import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiProjects } from '@/services/apiProjects';
import { apiInvoices } from '@/services/apiInvoices';
import type { Project } from '@/services/apiProjects';
import type { Invoice } from '@/services/apiInvoices';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { Package, CreditCard, Clock, CheckCircle2, Eye, Camera, ExternalLink, AlertCircle, ThumbsUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { apiStories, type WIPStory } from '@/services/apiStories';

// Timeline steps: Consultation → Design → Approbation → Production → Livraison
const TIMELINE_STEPS = [
    { id: 'consultation', label: 'Consultation' },
    { id: 'design', label: 'Design' },
    { id: 'approbation', label: 'Approbation' },
    { id: 'production', label: 'Production' },
    { id: 'livraison', label: 'Livraison' },
] as const;

function getTimelineState(status: Project['status']) {
    const statusOrder: Record<string, number> = {
        designing: 1,
        '3d_model': 1,
        design_modification: 1,
        design_ready: 2,
        waiting_for_approval: 2,
        approved_for_production: 3,
        production: 3,
        delivery: 4,
        completed: 4,
        cancelled: 0,
    };
    const currentIndex = statusOrder[status] ?? 0;
    return { currentIndex };
}

function getStepDate(project: Project, stepIndex: number): string | undefined {
    const sd = project.stage_details;
    switch (stepIndex) {
        case 0: return project.created_at;
        case 1: return undefined;
        case 2: return undefined;
        case 3: return sd?.casting_date;
        case 4: return sd?.delivery_date;
        default: return undefined;
    }
}

function ProjectTimeline({ project }: { project: Project }) {
    const { currentIndex } = getTimelineState(project.status);
    return (
        <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-luxury-gold/70 font-serif mb-3">Progression du projet</p>
            <div className="flex items-start gap-0">
                {TIMELINE_STEPS.map((step, idx) => {
                    const isCompleted = idx < currentIndex || project.status === 'completed';
                    const isCurrent = idx === currentIndex && project.status !== 'completed' && project.status !== 'cancelled';
                    const isPending = idx > currentIndex;
                    const date = getStepDate(project, idx);
                    return (
                        <div key={step.id} className="flex-1 flex flex-col items-center min-w-0">
                            <div className="flex items-center w-full">
                                {idx > 0 && (
                                    <div
                                        className={`flex-1 h-0.5 -mr-px transition-colors ${
                                            isCompleted ? 'bg-green-500/60' : isCurrent ? 'bg-luxury-gold/40' : 'bg-white/10'
                                        }`}
                                    />
                                )}
                                <div
                                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                        isCompleted ? 'bg-green-500/80 border-green-500 text-white' :
                                        isCurrent ? 'bg-luxury-gold/20 border-luxury-gold text-luxury-gold shadow-[0_0_12px_rgba(210,181,123,0.3)]' :
                                        'bg-white/5 border-white/10 text-muted-foreground'
                                    }`}
                                >
                                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : (
                                        <span className="text-[10px] font-bold">{idx + 1}</span>
                                    )}
                                </div>
                                {idx < TIMELINE_STEPS.length - 1 && (
                                    <div
                                        className={`flex-1 h-0.5 -ml-px transition-colors ${
                                            isCompleted ? 'bg-green-500/60' : isCurrent ? 'bg-luxury-gold/40' : 'bg-white/10'
                                        }`}
                                    />
                                )}
                            </div>
                            <div className={`mt-2 text-center ${isPending ? 'opacity-50' : ''}`}>
                                <p className={`text-[10px] font-medium truncate w-full ${isCurrent ? 'text-luxury-gold' : isCompleted ? 'text-green-400/90' : 'text-muted-foreground'}`}>
                                    {step.label}
                                </p>
                                {date && (isCompleted || isCurrent) && (
                                    <p className="text-[9px] text-muted-foreground mt-0.5">
                                        {new Date(date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function DesignGallery({ project }: { project: Project }) {
    const sd = project.stage_details || {};
    const sketchFiles = sd.sketch_files || [];
    const designFiles = sd.design_files || [];
    const designNotes = sd.design_notes;
    const approvedVersions = (sd.design_versions || []).filter(v => v.status === 'approved');
    const approvedFiles = approvedVersions.flatMap(v => v.files || []);
    const allFiles = [...new Set([...sketchFiles, ...designFiles, ...approvedFiles])];

    if (allFiles.length === 0) return null;

    return (
        <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-luxury-gold/70 font-serif">Galerie des designs approuvés</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {allFiles.map((url, idx) => (
                    <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-luxury-gold/40 transition-all"
                    >
                        <img
                            src={url}
                            alt={`Design ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                            <span className="text-[10px] text-white flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Cliquer pour agrandir
                            </span>
                        </div>
                    </a>
                ))}
            </div>
            {designNotes && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-luxury-gold/30 pl-3 py-1">
                    {designNotes}
                </p>
            )}
        </div>
    );
}

function ProjectPaymentSection({ project, invoices }: { project: Project; invoices: Invoice[] }) {
    const projectInvoices = invoices.filter(inv => inv.project_id === project.id);
    if (projectInvoices.length === 0) return null;

    const totalAmount = projectInvoices.reduce((s, inv) => s + Number(inv.amount || 0), 0);
    const totalPaid = projectInvoices.reduce((s, inv) => s + Number(inv.amount_paid || 0), 0);
    const pct = totalAmount > 0 ? Math.min(100, (totalPaid / totalAmount) * 100) : 0;
    const hasUnpaid = projectInvoices.some(inv => inv.status !== 'paid' && inv.status !== 'void');
    const unpaidInvoice = projectInvoices.find(inv => inv.status !== 'paid' && inv.status !== 'void');
    const stripeLink = unpaidInvoice?.stripe_payment_link;
    const dueDate = unpaidInvoice?.due_date;
    const nowMs = new Date().getTime();
    const daysUntilDue = dueDate ? Math.ceil((new Date(dueDate).getTime() - nowMs) / (1000 * 60 * 60 * 24)) : null;

    return (
        <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-luxury-gold/70 font-serif">Paiements</p>
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Montant payé / Total</span>
                    <span className="font-mono font-bold text-luxury-gold">
                        {Number(totalPaid).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })} / {Number(totalAmount).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                    </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-green-500' : 'bg-luxury-gold'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                {dueDate && hasUnpaid && daysUntilDue !== null && (
                    <p className={`text-xs flex items-center gap-1 ${daysUntilDue <= 7 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                        {daysUntilDue <= 7 && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                        Échéance : {new Date(dueDate).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {daysUntilDue <= 7 && daysUntilDue > 0 && ` (dans ${daysUntilDue} jours)`}
                        {daysUntilDue <= 0 && ' — En retard'}
                    </p>
                )}
                {stripeLink && hasUnpaid && (
                    <a
                        href={stripeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-green-500/20"
                    >
                        <CreditCard className="w-4 h-4" />
                        Payer le solde
                    </a>
                )}
            </div>
        </div>
    );
}

export default function ClientPortal() {
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();
    const [showFeedbackFor, setShowFeedbackFor] = useState<Record<string, boolean>>({});
    const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});

    const { data: allProjects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll,
    });

    const { data: allInvoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll,
    });

    const myProjects = allProjects.filter(p => p.client_id === user?.id);
    const myInvoices = allInvoices.filter(inv => {
        const proj = myProjects.find(p => p.id === inv.project_id);
        return !!proj;
    });

    const activeProjects = myProjects.filter(p => p.status !== 'completed');
    const completedProjects = myProjects.filter(p => p.status === 'completed');
    const pendingApproval = myProjects.filter(p => p.status === 'design_ready' || p.status === 'waiting_for_approval');
    const unpaidInvoices = myInvoices.filter(inv => inv.status !== 'paid');

    const { data: stories = [] } = useQuery({
        queryKey: ['client_stories', user?.id],
        queryFn: async () => {
            const allStories: WIPStory[] = [];
            for (const project of myProjects) {
                const s = await apiStories.getClientStories(project.id);
                allStories.push(...s);
            }
            return allStories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        },
        enabled: myProjects.length > 0
    });

    const clientName = profile?.full_name || 'Client';

    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto page-fade-in">
            {/* Welcome Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-serif text-luxury-gold">
                    Bienvenue, {clientName}
                </h1>
                <p className="text-muted-foreground font-serif">
                    Suivez vos projets de joaillerie, approuvez les designs et gérez vos paiements.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-card bg-gradient-to-br from-luxury-gold/10 to-transparent border-luxury-gold/20">
                    <CardContent className="p-4 text-center">
                        <Package className="w-6 h-6 mx-auto mb-2 text-luxury-gold" />
                        <div className="text-2xl font-bold font-serif">{activeProjects.length}</div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Projets actifs</p>
                    </CardContent>
                </Card>
                <Card className="glass-card bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                    <CardContent className="p-4 text-center">
                        <Eye className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                        <div className="text-2xl font-bold font-serif">{pendingApproval.length}</div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">En attente d'approbation</p>
                    </CardContent>
                </Card>
                <Card className="glass-card bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                    <CardContent className="p-4 text-center">
                        <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-400" />
                        <div className="text-2xl font-bold font-serif">{completedProjects.length}</div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Terminés</p>
                    </CardContent>
                </Card>
                <Card className="glass-card bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                    <CardContent className="p-4 text-center">
                        <CreditCard className="w-6 h-6 mx-auto mb-2 text-red-400" />
                        <div className="text-2xl font-bold font-serif">{unpaidInvoices.length}</div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Factures impayées</p>
                    </CardContent>
                </Card>
            </div>

            {/* Boutique Mirror - Live Workshop Feed */}
            {stories.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-serif text-luxury-gold flex items-center gap-2">
                            <Camera className="w-5 h-5" /> Fil d'atelier en direct
                        </h2>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] bg-luxury-gold/10 px-2 py-1 rounded">Mises à jour en temps réel</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                        {stories.map((story) => (
                            <div key={story.id} className="relative shrink-0 w-64 aspect-[4/5] rounded-2xl overflow-hidden glass-card snap-start">
                                <img
                                    src={story.image_url}
                                    alt="Workshop WIP"
                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                    <p className="text-xs text-white/90 font-serif mb-1">{story.project?.title}</p>
                                    <p className="text-[10px] text-luxury-gold/80 uppercase tracking-wider">
                                        {new Date(story.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Approval Banner */}
            {pendingApproval.length > 0 && (
                <Card className="glass-card border-amber-500/30 bg-amber-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-serif flex items-center gap-2 text-luxury-gold">
                            <Eye className="w-5 h-5 text-amber-400" />
                            Designs en attente de votre approbation
                        </CardTitle>
                        <CardDescription>Examinez et approuvez les designs pour poursuivre la production.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {pendingApproval.map(project => (
                            <Link
                                key={project.id}
                                to={`/dashboard/projects/${project.id}`}
                                className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                            >
                                <div>
                                    <p className="font-medium font-serif text-sm">{project.title}</p>
                                    <p className="text-xs text-muted-foreground">Cliquez pour examiner le design</p>
                                </div>
                                <Button size="sm" className="bg-luxury-gold hover:bg-luxury-gold/90 text-black font-serif">
                                    Examiner le design
                                </Button>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Project Cards - Each project as a beautiful card */}
            <div className="space-y-6">
                <h2 className="text-xl font-serif text-luxury-gold flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Vos projets
                </h2>
                {myProjects.length === 0 ? (
                    <Card className="glass-card">
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground text-sm font-serif">
                                Aucun projet pour le moment. Votre équipe en créera un bientôt !
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {myProjects.map(project => (
                            <Card key={project.id} className="glass-card overflow-hidden border-luxury-gold/10 hover:border-luxury-gold/30 transition-all duration-300">
                                <CardHeader className="pb-3 border-b border-white/5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-lg font-serif text-luxury-gold flex items-center gap-2">
                                                {project.title}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1 text-xs">
                                                <Clock className="w-3 h-3" />
                                                Créé le {new Date(project.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                {project.priority === 'rush' && (
                                                    <Badge className="bg-red-500/20 text-red-400 text-[10px] px-1.5 ml-1">RUSH</Badge>
                                                )}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={project.status} />
                                            <Button size="sm" variant="outline" className="border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10 font-serif" asChild>
                                                <Link to={`/dashboard/projects/${project.id}`}>
                                                    Voir le projet
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-8">
                                    <ProjectTimeline project={project} />
                                    {(project.status === 'design_ready' || project.status === 'waiting_for_approval') && (
                                        <div className="mt-4 p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-5 h-5 text-amber-500" />
                                                <h3 className="font-serif font-bold text-amber-500">Approbation du Design Requise</h3>
                                            </div>

                                            {(() => {
                                                const designUrls = (project.stage_details?.design_files?.length ?? 0) > 0
                                                    ? (project.stage_details.design_files || [])
                                                    : (project.stage_details?.design_versions || []).flatMap((v: { files?: string[] }) => v.files || []);
                                                return designUrls.length > 0 ? (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {designUrls.map((url: string, idx: number) => (
                                                            <img
                                                                key={idx}
                                                                src={url}
                                                                alt={`Design ${idx + 1}`}
                                                                className="rounded-lg border border-white/10 object-cover aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => window.open(url, '_blank')}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : null;
                                            })()}

                                            {!showFeedbackFor[project.id] ? (
                                                <div className="flex gap-2">
                                                    <Button
                                                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                                        onClick={async () => {
                                                            const { error } = await supabase
                                                                .from('projects')
                                                                .update({
                                                                    status: 'approved_for_production',
                                                                    stage_details: {
                                                                        ...project.stage_details,
                                                                        client_approval_status: 'approved',
                                                                        client_notes: 'Design approuvé par le client'
                                                                    }
                                                                })
                                                                .eq('id', project.id);
                                                            if (error) {
                                                                toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
                                                            } else {
                                                                toast({ title: 'Design approuvé!', description: 'Votre projet passe en production.' });
                                                                queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                            }
                                                        }}
                                                    >
                                                        <ThumbsUp className="w-4 h-4 mr-2" />
                                                        Approuver le Design
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 flex-1"
                                                        onClick={() => setShowFeedbackFor(prev => ({ ...prev, [project.id]: true }))}
                                                    >
                                                        <MessageSquare className="w-4 h-4 mr-2" />
                                                        Demander des Modifications
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <Textarea
                                                        value={feedbackText[project.id] || ''}
                                                        onChange={(e) => setFeedbackText(prev => ({ ...prev, [project.id]: e.target.value }))}
                                                        placeholder="Décrivez les modifications souhaitées..."
                                                        className="min-h-[80px]"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            className="bg-amber-500 hover:bg-amber-600 text-black flex-1"
                                                            onClick={async () => {
                                                                const notes = feedbackText[project.id] || '';
                                                                const { error } = await supabase
                                                                    .from('projects')
                                                                    .update({
                                                                        status: 'design_modification',
                                                                        stage_details: {
                                                                            ...project.stage_details,
                                                                            client_approval_status: 'changes_requested',
                                                                            client_notes: notes
                                                                        }
                                                                    })
                                                                    .eq('id', project.id);
                                                                if (error) {
                                                                    toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
                                                                } else {
                                                                    toast({ title: 'Demande envoyée', description: 'L\'équipe sera notifiée de vos commentaires.' });
                                                                    setShowFeedbackFor(prev => ({ ...prev, [project.id]: false }));
                                                                    setFeedbackText(prev => ({ ...prev, [project.id]: '' }));
                                                                    queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                                }
                                                            }}
                                                        >
                                                            Envoyer la Demande
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => setShowFeedbackFor(prev => ({ ...prev, [project.id]: false }))}
                                                        >
                                                            Annuler
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <DesignGallery project={project} />
                                    <ProjectPaymentSection project={project} invoices={myInvoices} />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
