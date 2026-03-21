import { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
    Link2,
    ChevronDown,
    Copy,
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

export function DesignApprovalPanel({ project, mode }: DesignApprovalPanelProps) {
    const { t, i18n } = useTranslation();
    const localeTag = i18n.language.startsWith('en') ? 'en-CA' : 'fr-CA';
    const queryClient = useQueryClient();
    const { user, profile } = useAuth();

    const statusConfig = useMemo(() => ({
        pending: { label: t('projectDetailsPage.designApproval.statusPending'), icon: Clock, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
        approved: { label: t('projectDetailsPage.designApproval.statusApproved'), icon: CheckCircle2, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
        rejected: { label: t('projectDetailsPage.designApproval.statusRejected'), icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    }), [t, i18n.language]);
    const [saving, setSaving] = useState(false);
    const [clientComment, setClientComment] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [expanded, setExpanded] = useState(false);
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
            toast({ title: t('projectDetailsPage.designApproval.toastNoDesign'), description: t('projectDetailsPage.designApproval.toastNoDesignDesc'), variant: 'destructive' });
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
                name: profile?.full_name || t('projectDetailsPage.designApproval.fallbackSystem'),
            });

            await apiNotifications.create({
                user_id: project.client_id,
                title: t('projectDetailsPage.designApproval.notifSubmitClientTitle'),
                message: t('projectDetailsPage.designApproval.notifSubmitClientMsg', { title: project.title }),
                type: 'info',
                link: `/dashboard/projects/${project.id}`,
            });

            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setAdminNotes('');
            toast({ title: t('projectDetailsPage.designApproval.toastSubmittedTitle'), description: t('projectDetailsPage.designApproval.toastSubmittedDesc') });
        } catch {
            toast({ title: t('projectDetailsPage.designApproval.toastError'), variant: 'destructive' });
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
                client_notes: clientComment || t('projectDetailsPage.designApproval.clientNotesApprovedDefault'),
            });
            await apiProjects.updateStatus(project.id, 'approved_for_production', {
                id: user?.id || 'system',
                name: profile?.full_name || t('projectDetailsPage.designApproval.fallbackClient'),
            });

            await apiNotifications.create({
                user_id: 'admin',
                title: t('projectDetailsPage.designApproval.notifApprovedTitle'),
                message: t('projectDetailsPage.designApproval.notifApprovedMsg', {
                    name: profile?.full_name || t('projectDetailsPage.designApproval.notifNameFallback'),
                    title: project.title,
                }),
                type: 'success',
                link: `/dashboard/projects/${project.id}`,
            });

            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setClientComment('');
            toast({ title: t('projectDetailsPage.designApproval.toastApprovedTitle'), description: t('projectDetailsPage.designApproval.toastApprovedDesc') });
        } catch {
            toast({ title: t('projectDetailsPage.designApproval.toastError'), variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleClientReject = async () => {
        if (!pendingApproval || !clientComment.trim()) {
            toast({ title: t('projectDetailsPage.designApproval.toastCommentRequired'), description: t('projectDetailsPage.designApproval.toastCommentRequiredDesc'), variant: 'destructive' });
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
                name: profile?.full_name || t('projectDetailsPage.designApproval.fallbackClient'),
            });

            await apiNotifications.create({
                user_id: 'admin',
                title: t('projectDetailsPage.designApproval.notifModRequestedTitle'),
                message: t('projectDetailsPage.designApproval.notifModRequestedMsg', {
                    name: profile?.full_name || t('projectDetailsPage.designApproval.notifNameFallback'),
                    title: project.title,
                }),
                type: 'warning',
                link: `/dashboard/projects/${project.id}`,
            });

            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setClientComment('');
            toast({ title: t('projectDetailsPage.designApproval.toastRequestSentTitle'), description: t('projectDetailsPage.designApproval.toastRequestSentDesc') });
        } catch {
            toast({ title: t('projectDetailsPage.designApproval.toastError'), variant: 'destructive' });
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

    const publicLink = project.share_token
        ? `${window.location.origin}/public/project/${project.share_token}`
        : null;

    const handleCopyLink = () => {
        if (publicLink) {
            navigator.clipboard.writeText(publicLink);
            toast({ title: t('projectDetailsPage.designApproval.toastLinkCopied'), description: t('projectDetailsPage.designApproval.toastLinkCopiedDesc') });
        }
    };

    return (
        <Card className="glass-card border-white/10">
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <CardTitle className="text-sm font-serif flex items-center justify-between">
                    <span className="flex items-center gap-2 text-luxury-gold">
                        <ShieldCheck className="w-4 h-4" /> {t('projectDetailsPage.designApproval.cardTitle')}
                        {latestApproval && (() => {
                            const config = statusConfig[latestApproval.status];
                            const Icon = config.icon;
                            return (
                                <Badge className={`${config.color} ml-2 text-[10px]`}>
                                    <Icon className="w-3 h-3 mr-1" />
                                    {config.label}
                                </Badge>
                            );
                        })()}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </CardTitle>
            </CardHeader>

            {expanded && (
            <CardContent className="space-y-3 pt-0">
                {/* Public link for client */}
                {mode === 'admin' && publicLink && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                        <Link2 className="w-3.5 h-3.5 text-luxury-gold shrink-0" />
                        <span className="text-[10px] text-muted-foreground truncate flex-1">{publicLink}</span>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-luxury-gold" onClick={handleCopyLink}>
                            <Copy className="w-3 h-3" />
                        </Button>
                    </div>
                )}

                {/* Design preview - compact grid */}
                {designFiles.length > 0 && (pendingApproval || mode === 'admin') && (
                    <div className="grid grid-cols-3 gap-1.5">
                        {designFiles.slice(0, 3).map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-luxury-gold/40 transition-all">
                                <img src={url} alt={t('projectDetailsPage.designApproval.altDesignPreview', { n: idx + 1 })} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ExternalLink className="w-4 h-4 text-white" />
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* ADMIN: Submit for approval */}
                {mode === 'admin' && !pendingApproval && (
                    <div className="space-y-2 p-3 rounded-lg border border-luxury-gold/20 bg-luxury-gold/5">
                        <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                            placeholder={t('projectDetailsPage.designApproval.adminNotesPlaceholder')} className="min-h-[40px] text-sm" />
                        <Button onClick={handleSubmitForApproval} disabled={saving || designFiles.length === 0}
                            className="bg-luxury-gold hover:bg-yellow-600 text-black w-full h-8 text-xs">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                            {t('projectDetailsPage.designApproval.submitForApproval')}
                        </Button>
                    </div>
                )}

                {/* ADMIN: Waiting status */}
                {mode === 'admin' && pendingApproval && (
                    <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-center">
                        <Clock className="w-5 h-5 mx-auto mb-1 text-amber-400 animate-pulse" />
                        <p className="text-xs font-medium text-amber-400">{t('projectDetailsPage.designApproval.waitingClient')}</p>
                    </div>
                )}

                {/* CLIENT: Approve or reject */}
                {mode === 'client' && pendingApproval && (
                    <div className="space-y-3 p-3 rounded-lg border-2 border-amber-500/30 bg-amber-500/5">
                        {pendingApproval.admin_notes && (
                            <p className="text-xs italic text-muted-foreground border-l-2 border-luxury-gold/30 pl-2">
                                {pendingApproval.admin_notes}
                            </p>
                        )}
                        <Textarea value={clientComment} onChange={e => setClientComment(e.target.value)}
                            placeholder={t('projectDetailsPage.designApproval.clientCommentPlaceholder')} className="min-h-[50px] text-sm" />
                        <div className="space-y-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowSignature(!showSignature)}
                                className="text-muted-foreground hover:text-luxury-gold text-xs h-7">
                                <Pen className="w-3 h-3 mr-1" />
                                {showSignature ? t('projectDetailsPage.designApproval.toggleHideSignature') : t('projectDetailsPage.designApproval.toggleShowSignature')}
                            </Button>
                            {showSignature && (
                                <div className="space-y-1">
                                    <canvas ref={canvasRef} width={300} height={80}
                                        className="w-full border border-white/20 rounded bg-white/5 cursor-crosshair"
                                        onMouseDown={startDrawing} onMouseMove={draw}
                                        onMouseUp={() => setIsDrawing(false)} onMouseLeave={() => setIsDrawing(false)} />
                                    <Button variant="ghost" size="sm" onClick={clearSignature} className="text-[10px] h-6">{t('projectDetailsPage.designApproval.clearSignature')}</Button>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleClientApprove} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white flex-1 h-8 text-xs">
                                {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ThumbsUp className="w-3 h-3 mr-1" />}
                                {t('projectDetailsPage.designApproval.approveButton')}
                            </Button>
                            <Button onClick={handleClientReject} disabled={saving || !clientComment.trim()} variant="outline"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-1 h-8 text-xs">
                                <ThumbsDown className="w-3 h-3 mr-1" /> {t('projectDetailsPage.designApproval.requestChangesButton')}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Signature display */}
                {latestApproval?.status === 'approved' && latestApproval.client_signature && (
                    <div className="p-2 rounded-lg border border-green-500/20 bg-green-500/5 flex items-center gap-3">
                        <img src={latestApproval.client_signature} alt={t('projectDetailsPage.designApproval.altSignature')} className="max-h-12 rounded border border-white/10" />
                        <p className="text-[10px] text-green-400">
                            {latestApproval.responded_at && t('projectDetailsPage.designApproval.approvedOn', {
                                date: new Date(latestApproval.responded_at).toLocaleDateString(localeTag, { day: 'numeric', month: 'short' }),
                            })}
                        </p>
                    </div>
                )}

                {/* History */}
                {approvals.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}
                        className="text-muted-foreground hover:text-white text-[10px] h-6 w-full">
                        <History className="w-3 h-3 mr-1" /> {t('projectDetailsPage.designApproval.history')} ({approvals.length})
                    </Button>
                )}
                {showHistory && approvals.length > 0 && (
                    <div className="space-y-1">
                        {[...approvals].reverse().map(approval => {
                            const config = statusConfig[approval.status];
                            const Icon = config.icon;
                            return (
                                <div key={approval.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 text-xs">
                                    <Icon className={`w-3 h-3 shrink-0 ${
                                        approval.status === 'approved' ? 'text-green-400' :
                                        approval.status === 'rejected' ? 'text-red-400' : 'text-amber-400'
                                    }`} />
                                    <span>{config.label}</span>
                                    <span className="text-muted-foreground">
                                        {new Date(approval.submitted_at).toLocaleDateString(localeTag, { day: 'numeric', month: 'short' })}
                                    </span>
                                    {approval.client_comment && <span className="text-muted-foreground italic truncate">"{approval.client_comment}"</span>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
            )}
        </Card>
    );
}
