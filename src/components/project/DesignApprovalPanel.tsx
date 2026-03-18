import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    XCircle,
    Clock,
    Send,
    ThumbsUp,
    ThumbsDown,
    Pen,
    ExternalLink,
    Loader2,
    ShieldCheck,
    History,
} from 'lucide-react';
import type { Project, DesignApproval } from '@/services/apiProjects';
import { apiProjects } from '@/services/apiProjects';
import { apiNotifications } from '@/services/apiNotifications';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

interface DesignApprovalPanelProps {
    project: Project;
    mode: 'admin' | 'client';
}

const STATUS_CONFIG = {
    pending: { label: 'En attente', icon: Clock, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    approved: { label: 'Approuvé', icon: CheckCircle2, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    rejected: { label: 'Modifications demandées', icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export function DesignApprovalPanel({ project, mode }: DesignApprovalPanelProps) {
    const queryClient = useQueryClient();
    const { user, profile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [clientComment, setClientComment] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showSignature, setShowSignature] = useState(false);

    const approvals: DesignApproval[] = project.stage_details?.design_approvals || [];
    const latestApproval = approvals.length > 0 ? approvals[approvals.length - 1] : null;
    const pendingApproval = latestApproval?.status === 'pending' ? latestApproval : null;

    const designFiles = [
        ...(project.stage_details?.design_files || []),
        ...(project.stage_details?.design_versions || []).flatMap(v => v.files || []),
    ].filter((url, i, arr) => arr.indexOf(url) === i);

    const handleSubmitForApproval = async () => {
        if (designFiles.length === 0) {
            toast({ title: 'Aucun design', description: 'Ajoutez des fichiers de design avant de soumettre.', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const newApproval: DesignApproval = {
                id: crypto.randomUUID(),
                status: 'pending',
                submitted_at: new Date().toISOString(),
                design_version: (project.stage_details?.design_versions?.length || 0) + 1,
                files: designFiles,
                admin_notes: adminNotes || undefined,
            };
            const existing = project.stage_details?.design_approvals || [];
            await apiProjects.updateDetails(project.id, {
                design_approvals: [...existing, newApproval],
            });
            await apiProjects.updateStatus(project.id, 'waiting_for_approval', {
                id: user?.id || 'system',
                name: profile?.full_name || 'Système',
            });

            await apiNotifications.create({
                user_id: project.client_id,
                title: 'Design prêt pour approbation',
                message: `Le design pour "${project.title}" est prêt. Veuillez l'examiner et donner votre approbation.`,
                type: 'info',
                link: `/dashboard/projects/${project.id}`,
            });

            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setAdminNotes('');
            toast({ title: 'Soumis pour approbation', description: 'Le client a été notifié.' });
        } catch {
            toast({ title: 'Erreur', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const getSignatureData = (): string | undefined => {
        if (!canvasRef.current) return undefined;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return undefined;
        const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        const hasContent = imageData.data.some((val, idx) => idx % 4 === 3 && val > 0);
        return hasContent ? canvasRef.current.toDataURL('image/png') : undefined;
    };

    const handleClientApprove = async () => {
        if (!pendingApproval) return;
        setSaving(true);
        try {
            const signature = getSignatureData();
            const updated: DesignApproval = {
                ...pendingApproval,
                status: 'approved',
                responded_at: new Date().toISOString(),
                client_comment: clientComment || undefined,
                client_signature: signature,
            };
            const updatedApprovals = approvals.map(a => a.id === pendingApproval.id ? updated : a);
            await apiProjects.updateDetails(project.id, {
                design_approvals: updatedApprovals,
                client_approval_status: 'approved',
                client_notes: clientComment || 'Design approuvé par le client',
            });
            await apiProjects.updateStatus(project.id, 'approved_for_production', {
                id: user?.id || 'system',
                name: profile?.full_name || 'Client',
            });

            await apiNotifications.create({
                user_id: 'admin',
                title: 'Design approuvé!',
                message: `${profile?.full_name || 'Le client'} a approuvé le design pour "${project.title}".`,
                type: 'success',
                link: `/dashboard/projects/${project.id}`,
            });

            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setClientComment('');
            toast({ title: 'Design approuvé!', description: 'Le projet passe en production.' });
        } catch {
            toast({ title: 'Erreur', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleClientReject = async () => {
        if (!pendingApproval || !clientComment.trim()) {
            toast({ title: 'Commentaire requis', description: 'Décrivez les modifications souhaitées.', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const updated: DesignApproval = {
                ...pendingApproval,
                status: 'rejected',
                responded_at: new Date().toISOString(),
                client_comment: clientComment,
            };
            const updatedApprovals = approvals.map(a => a.id === pendingApproval.id ? updated : a);
            await apiProjects.updateDetails(project.id, {
                design_approvals: updatedApprovals,
                client_approval_status: 'changes_requested',
                client_notes: clientComment,
            });
            await apiProjects.updateStatus(project.id, 'design_modification', {
                id: user?.id || 'system',
                name: profile?.full_name || 'Client',
            });

            await apiNotifications.create({
                user_id: 'admin',
                title: 'Modifications demandées',
                message: `${profile?.full_name || 'Le client'} demande des modifications pour "${project.title}".`,
                type: 'warning',
                link: `/dashboard/projects/${project.id}`,
            });

            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setClientComment('');
            toast({ title: 'Demande envoyée', description: "L'équipe sera notifiée." });
        } catch {
            toast({ title: 'Erreur', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#D2B57B';
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif flex items-center justify-between">
                    <span className="flex items-center gap-2 text-luxury-gold">
                        <ShieldCheck className="w-5 h-5" /> Approbation du Design
                    </span>
                    {approvals.length > 1 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowHistory(!showHistory)}
                            className="text-muted-foreground hover:text-white"
                        >
                            <History className="w-4 h-4 mr-1" />
                            Historique ({approvals.length})
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current status */}
                {latestApproval && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        {(() => {
                            const config = STATUS_CONFIG[latestApproval.status];
                            const Icon = config.icon;
                            return (
                                <>
                                    <Badge className={config.color}>
                                        <Icon className="w-3.5 h-3.5 mr-1" />
                                        {config.label}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {latestApproval.design_version && `v${latestApproval.design_version}`}
                                        {' · '}
                                        {new Date(latestApproval.submitted_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Design preview */}
                {designFiles.length > 0 && (pendingApproval || mode === 'admin') && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {designFiles.slice(0, 6).map((url, idx) => (
                            <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-luxury-gold/40 transition-all"
                            >
                                <img src={url} alt={`Design ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ExternalLink className="w-5 h-5 text-white" />
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* ADMIN: Submit for approval */}
                {mode === 'admin' && !pendingApproval && (
                    <div className="space-y-3 p-4 rounded-xl border border-luxury-gold/20 bg-luxury-gold/5">
                        <p className="text-sm text-muted-foreground">
                            Envoyez le design actuel au client pour approbation. Il recevra une notification.
                        </p>
                        <Textarea
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            placeholder="Notes pour le client (optionnel)..."
                            className="min-h-[60px]"
                        />
                        <Button
                            onClick={handleSubmitForApproval}
                            disabled={saving || designFiles.length === 0}
                            className="bg-luxury-gold hover:bg-yellow-600 text-black w-full"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Soumettre pour approbation
                        </Button>
                    </div>
                )}

                {/* ADMIN: Waiting status */}
                {mode === 'admin' && pendingApproval && (
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-amber-400 animate-pulse" />
                        <p className="text-sm font-medium text-amber-400">En attente de la réponse du client</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Soumis le {new Date(pendingApproval.submitted_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                )}

                {/* CLIENT: Approve or reject */}
                {mode === 'client' && pendingApproval && (
                    <div className="space-y-4 p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/5">
                        {pendingApproval.admin_notes && (
                            <p className="text-sm italic text-muted-foreground border-l-2 border-luxury-gold/30 pl-3">
                                Note de l'équipe : {pendingApproval.admin_notes}
                            </p>
                        )}

                        <Textarea
                            value={clientComment}
                            onChange={e => setClientComment(e.target.value)}
                            placeholder="Vos commentaires (requis pour les modifications)..."
                            className="min-h-[80px]"
                        />

                        {/* Signature pad */}
                        <div className="space-y-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowSignature(!showSignature)}
                                className="text-muted-foreground hover:text-luxury-gold"
                            >
                                <Pen className="w-4 h-4 mr-1" />
                                {showSignature ? 'Masquer la signature' : 'Ajouter votre signature'}
                            </Button>
                            {showSignature && (
                                <div className="space-y-2">
                                    <canvas
                                        ref={canvasRef}
                                        width={400}
                                        height={120}
                                        className="w-full border border-white/20 rounded-lg bg-white/5 cursor-crosshair"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={() => setIsDrawing(false)}
                                        onMouseLeave={() => setIsDrawing(false)}
                                    />
                                    <Button variant="ghost" size="sm" onClick={clearSignature} className="text-xs">
                                        Effacer la signature
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleClientApprove}
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ThumbsUp className="w-4 h-4 mr-2" />}
                                Approuver le Design
                            </Button>
                            <Button
                                onClick={handleClientReject}
                                disabled={saving || !clientComment.trim()}
                                variant="outline"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-1"
                            >
                                <ThumbsDown className="w-4 h-4 mr-2" />
                                Demander des Modifications
                            </Button>
                        </div>
                    </div>
                )}

                {/* Approval with signature display */}
                {latestApproval?.status === 'approved' && latestApproval.client_signature && (
                    <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 space-y-2">
                        <p className="text-xs text-green-400 uppercase tracking-widest font-bold">Signature du client</p>
                        <img
                            src={latestApproval.client_signature}
                            alt="Client signature"
                            className="max-h-20 rounded border border-white/10"
                        />
                        <p className="text-xs text-muted-foreground">
                            Approuvé le {latestApproval.responded_at && new Date(latestApproval.responded_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                )}

                {/* History */}
                {showHistory && approvals.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">Historique des approbations</p>
                        {[...approvals].reverse().map(approval => {
                            const config = STATUS_CONFIG[approval.status];
                            const Icon = config.icon;
                            return (
                                <div key={approval.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5">
                                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${
                                        approval.status === 'approved' ? 'text-green-400' :
                                        approval.status === 'rejected' ? 'text-red-400' : 'text-amber-400'
                                    }`} />
                                    <div className="min-w-0">
                                        <p className="text-sm">
                                            {config.label}
                                            {approval.design_version && <span className="text-muted-foreground"> · v{approval.design_version}</span>}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(approval.submitted_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {approval.responded_at && ` → ${new Date(approval.responded_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}`}
                                        </p>
                                        {approval.client_comment && (
                                            <p className="text-xs text-muted-foreground italic mt-1">"{approval.client_comment}"</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
