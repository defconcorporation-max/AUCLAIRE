import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiProjects, ProjectStatus } from '@/services/apiProjects';
import { apiInvoices } from '@/services/apiInvoices';
import { apiActivities } from '@/services/apiActivities';
import { apiNotifications } from '@/services/apiNotifications';
import { apiUsers } from '@/services/apiUsers';
import { apiExpenses } from '@/services/apiExpenses';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityLogList } from '@/components/ActivityLogList';
import { ProjectChat } from '@/components/project/ProjectChat';
import { ProjectFinancialDashboard } from '@/components/project/ProjectFinancialDashboard';
import { ProjectInspectorDrawer } from '@/components/project/ProjectInspectorDrawer';
import { TimeTracker } from '@/components/project/TimeTracker';
import { DesignApprovalPanel } from '@/components/project/DesignApprovalPanel';
import {
    Clock,
    Upload,
    FileText,
    CheckCircle2,
    ArrowLeft,
    User,
    Shield,
    Link as LinkIcon,
    Copy,
    Check,
    MoreVertical,
    Info,
    LayoutDashboard,
    Ruler,
    Sparkles,
    Gem
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/AuthContext';
import { uploadImage } from '@/utils/storage';
import { supabase } from '@/lib/supabase';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { toast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";


export default function ProjectDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, role } = useAuth();
    const { t, i18n } = useTranslation();
    const localeTag = i18n.language.startsWith('fr') ? 'fr-CA' : 'en-CA';
    
    // Core data fetch moved up to support dependent variables
    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll
    });

    const project = projects?.find(p => p.id === id) || projects?.[0];

    const [isAddingRender, setIsAddingRender] = useState(false);
    const [isAddingSketch, setIsAddingSketch] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isPortalLinkDialogOpen, setIsPortalLinkDialogOpen] = useState(false);
    const [portalLink, setPortalLink] = useState("");
    const [hasCopied, setHasCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'timeline' | 'chat'>('overview');
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const [modNotes, setModNotes] = useState('');
    const [isModDialogOpen, setIsModDialogOpen] = useState(false);
    const [editingModVersion, setEditingModVersion] = useState<number | null>(null);
    const [internalNotes, setInternalNotes] = useState('');


    const handleCopyLink = () => {
        if (!portalLink) return;
        navigator.clipboard.writeText(portalLink);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
        toast({ 
            title: t('projectDetailsPage.portalLinkCopyToast'), 
            description: t('projectDetailsPage.portalLinkCopyToastDesc') 
        });
    };


    function getSmartAction(status: ProjectStatus) {
        if (role === 'client') return null;

        switch (status) {
            case 'designing':
                return {
                    label: t('projectDetailsPage.smartActionShareLink'),
                    icon: LinkIcon,
                    action: () => setIsInspectorOpen(true),
                    color: 'bg-luxury-gold hover:bg-luxury-gold/90 text-black'
                };
            case '3d_model':
                return {
                    label: t('projectDetailsPage.smartActionDesignReady'),
                    icon: CheckCircle2,
                    action: () => handleStatusUpdate('design_ready'),
                    color: 'bg-luxury-gold hover:bg-luxury-gold/90 text-black'
                };
            case 'production':
                return {
                    label: t('projectDetailsPage.smartActionMarkFinishing'),
                    icon: Sparkles,
                    action: () => handleStatusUpdate('delivery'),
                    color: 'bg-green-600 hover:bg-green-700 text-white'
                };
            case 'delivery':
                return {
                    label: t('projectDetailsPage.smartActionDeliver'),
                    icon: CheckCircle2,
                    action: () => handleStatusUpdate('completed'),
                    color: 'bg-luxury-gold hover:bg-luxury-gold/90 text-black'
                };
            default:
                return null;
        }
    }


    useEffect(() => {
        if (project?.internal_notes !== undefined) {
            setInternalNotes(project.internal_notes || '');
        }
    }, [project?.internal_notes]);



    React.useEffect(() => {
        if (!project || !project.financials) return;

        const hasLegacyMfg = (project.financials.supplier_cost || 0) > 0;
        const hasLegacyAdd = (project.financials.additional_expense || 0) > 0;

        if (hasLegacyMfg || hasLegacyAdd) {
            const newItems = [...(project.financials.cost_items || [])];
            let changed = false;

            if (hasLegacyMfg) {
                newItems.push({ id: crypto.randomUUID(), detail: t('projectDetailsPage.legacyDetail_manufacturingCost'), amount: project.financials.supplier_cost! });
                changed = true;
            }
            if (hasLegacyAdd) {
                newItems.push({ id: crypto.randomUUID(), detail: t('projectDetailsPage.legacyDetail_additionalExpense'), amount: project.financials.additional_expense! });
                changed = true;
            }

            if (changed) {
                apiProjects.updateFinancials(project.id, {
                    cost_items: newItems,
                    supplier_cost: 0,
                    additional_expense: 0
                }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['projects'] });
                    apiActivities.log({
                        project_id: project.id,
                        user_id: user?.id || 'admin',
                        user_name: user?.user_metadata?.full_name || 'System',
                        action: 'update',
                        details: t('projectDetailsPage.activity_autoMigratedLegacyCosts')
                    });
                });
            }
        }
    }, [project, queryClient, user, t]);

    if (!project) return <div className="p-8 text-center">{t('projectDetailsPage.notFound')}</div>;

    const handleStatusUpdate = (status: ProjectStatus) => {
        const userContext = user ? { id: user.id, name: user.user_metadata?.full_name || t('common.user') } : undefined;
        apiProjects.updateStatus(project.id, status, userContext)
            .then(async () => {
                queryClient.invalidateQueries({ queryKey: ['projects'] });

                if (status === 'design_ready') {
                    if (project.client_id) {
                        apiNotifications.create({
                            user_id: project.client_id,
                            title: t('projectDetailsPage.notif_designReady_client_title'),
                            message: t('projectDetailsPage.notif_designReady_client_msg', { title: project.title }),
                            type: 'info',
                            link: `/dashboard/projects/${project.id}`
                        });
                    }

                    try {
                        const allUsers = await apiUsers.getAll();
                        const notifiedUsers = allUsers.filter(u => u.role === 'secretary' || u.role === 'admin');
                        for (const userToNotify of notifiedUsers) {
                            await apiNotifications.create({
                                user_id: userToNotify.id,
                                title: t('projectDetailsPage.notif_designReady_staff_title'),
                                message: t('projectDetailsPage.notif_designReady_staff_msg', { title: project.title }),
                                type: 'info',
                                link: `/dashboard/projects/${project.id}`
                            });
                        }
                    } catch (err) { }

                } else if (status === 'production') {
                    if (project.client_id) {
                        apiNotifications.create({
                            user_id: project.client_id,
                            title: t('projectDetailsPage.notif_production_client_title'),
                            message: t('projectDetailsPage.notif_production_client_msg', { title: project.title }),
                            type: 'success',
                            link: `/dashboard/projects/${project.id}`
                        });
                    }
                }
            });
    };

    const handleSubmitModification = async () => {
        if (!modNotes.trim()) return;
        const currentVersions = project.stage_details?.design_versions || [];
        try {
            if (editingModVersion !== null) {
                const newVersions = currentVersions.map(v => 
                    v.version_number === editingModVersion 
                        ? { ...v, feedback: modNotes } 
                        : v
                );
                await apiProjects.updateDetails(project.id, {
                    design_versions: newVersions,
                    client_notes: role === 'client' ? modNotes : project.stage_details?.client_notes
                });
            } else {
                const newVersion = {
                    version_number: currentVersions.length + 1,
                    created_at: new Date().toISOString(),
                    notes: project.stage_details?.model_notes || '',
                    files: project.stage_details?.design_files || [],
                    model_link: project.stage_details?.model_link || '',
                    status: 'rejected' as const,
                    feedback: modNotes
                };
                await apiProjects.updateDetails(project.id, {
                    design_versions: [...currentVersions, newVersion],
                    client_notes: role === 'client' ? modNotes : project.stage_details?.client_notes
                });
                await handleStatusUpdate('design_modification');
            }
            setIsModDialogOpen(false);
            setModNotes('');
            setEditingModVersion(null);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        } catch { }
    };

    const handleUnlockFinancials = async () => {
        if (!project || (role !== 'admin' && role !== 'secretary')) return;
        if (confirm(t('projectDetailsPage.unlockCostsConfirm'))) {
            try {
                await apiExpenses.deleteByProjectAndCategory(project.id, 'material');
                await apiProjects.updateFinancials(project.id, { exported_to_expenses: false });
                queryClient.invalidateQueries({ queryKey: ['projects'] });
                queryClient.invalidateQueries({ queryKey: ['expenses'] });
            } catch (err: any) { }
        }
    };

    const handleDeleteMod = async (verNumber: number) => {
        if (!confirm(t('projectDetailsPage.confirmDeleteIteration'))) return;
        try {
            const currentVersions = project.stage_details?.design_versions || [];
            const newVersions = currentVersions.filter(v => v.version_number !== verNumber);
            await apiProjects.updateDetails(project.id, { design_versions: newVersions });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        } catch { }
    };

    const isStepActive = (stepStatus: string) => {
        const statuses = ['designing', '3d_model', 'design_ready', 'waiting_for_approval', 'design_modification', 'approved_for_production', 'production', 'delivery', 'completed'];
        const currentIndex = statuses.indexOf(project.status);
        const stepIndex = statuses.indexOf(stepStatus);
        return currentIndex >= stepIndex;
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'sketch' | 'render') => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            if (type === 'sketch') {
                const imageUrl = await uploadImage(file, 'sketches');
                const current = project.stage_details?.sketch_files || [];
                await apiProjects.updateDetails(project.id, { sketch_files: [...current, imageUrl] });
                setIsAddingSketch(false);
            } else {
                const imageUrl = await uploadImage(file, 'designs');
                const current = project.stage_details?.design_files || [];
                await apiProjects.updateDetails(project.id, { design_files: [...current, imageUrl] });
                setIsAddingRender(false);
            }
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        } catch (error) { }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#050505] text-[#1A1A1A] dark:text-[#F5F5F7] font-sans selection:bg-luxury-gold/30">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <div className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 px-4 lg:px-8 py-4">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => navigate('/dashboard/projects')} className="hover:bg-black/5 dark:hover:bg-white/5 rounded-full p-2">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-serif font-medium tracking-tight bg-gradient-to-br from-black to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent">
                                        {project.title}
                                    </h1>
                                    <Badge className={`text-[11px] uppercase tracking-wider px-3 py-0.5 rounded-full font-bold ${project.status === 'completed' ? 'bg-green-500/10 text-green-600 border-green-500/20' : project.status === 'production' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/20'}`}>
                                        {t(`projectStatus.${project.status}` as any)}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    {project.client?.full_name || t('common.noClient')}
                                    <span className="opacity-30">•</span>
                                    <Clock className="w-3 h-3" />
                                    {project.deadline ? new Date(project.deadline).toLocaleDateString(localeTag) : t('common.noDeadline')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <TabsList className="bg-black/5 dark:bg-white/5 rounded-full p-1 h-auto hidden lg:flex">
                                <TabsTrigger value="overview" className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm text-xs font-bold transition-all">{t('projectDetailsPage.tab_overview')}</TabsTrigger>
                                <TabsTrigger value="finance" className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm text-xs font-bold transition-all">{t('projectDetailsPage.tab_finance')}</TabsTrigger>
                                <TabsTrigger value="timeline" className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm text-xs font-bold transition-all">{t('projectDetailsPage.tab_timeline')}</TabsTrigger>
                                <TabsTrigger value="chat" className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm text-xs font-bold transition-all">{t('projectDetailsPage.tab_chat')}</TabsTrigger>
                            </TabsList>

                            {smartAction && (
                                <Button onClick={smartAction.action} className={`gap-2 rounded-full h-11 px-6 font-bold shadow-lg transition-all active:scale-95 border-none ${smartAction.color}`}>
                                    <smartAction.icon className="w-4 h-4" />
                                    {smartAction.label}
                                </Button>
                            )}

                            <Button variant="outline" size="icon" onClick={() => setIsInspectorOpen(true)} className="rounded-full border-black/10 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                                <Info className="w-5 h-5 text-luxury-gold" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5">
                                        <MoreVertical className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-zinc-950 border-black/10 dark:border-white/10 shadow-2xl">
                                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-1.5 font-bold">{t('projectDetailsPage.adminActions')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setIsPortalLinkDialogOpen(true)} className="gap-2 cursor-pointer"><LinkIcon className="w-4 h-4 text-luxury-gold" /> {t('projectDetailsPage.shareProjectLink')}</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/dashboard/resources/quote/${project.id}`)} className="gap-2 cursor-pointer"><FileText className="w-4 h-4" /> {t('projectDetailsPage.quoteButton')}</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-1.5 font-bold">{t('projectDetailsPage.adminOverrideLabel')}</DropdownMenuLabel>
                                    {(['designing', '3d_model', 'design_ready', 'approved_for_production', 'production', 'delivery', 'completed'] as ProjectStatus[]).map((s) => (
                                        <DropdownMenuItem key={s} onClick={() => handleStatusUpdate(s)} className="text-xs py-2 cursor-pointer hover:bg-black/5 group">
                                            <div className={`w-2 h-2 rounded-full mr-2 transition-colors ${project.status === s ? 'bg-luxury-gold' : 'bg-black/10 dark:bg-white/10 group-hover:bg-zinc-300'}`} />
                                            {t(`projectStatus.${s}` as any)}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 min-h-[calc(100vh-100px)]">
                    <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <div className="lg:col-span-3 space-y-8">
                                <DesignApprovalPanel project={project} mode={role === 'client' ? 'client' : 'admin'} />
                                <Card className="bg-white/40 dark:bg-black/20 border-black/5 dark:border-white/5 backdrop-blur-md overflow-hidden shadow-xl shadow-black/5">
                                    <CardHeader className="border-b border-black/5 dark:border-white/5 pb-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-serif">{t('projectDetailsPage.detailsTitle')}</CardTitle>
                                            <Badge variant="outline" className="text-[10px] border-black/10 dark:border-white/10 font-mono opacity-50">ID: {project.id.slice(0,8)}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-8">
                                        <div>
                                            <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-3">{t('projectDetailsPage.descriptionLabel')}</h4>
                                            <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap font-medium">{project.description || t('projectDetailsPage.noDescription')}</p>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: t('projectDetailsPage.typeLabel'), value: project.jewelry_type, icon: Gem },
                                            ].map((spec, i) => spec.value && (
                                                <div key={i} className="bg-white/50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
                                                    <spec.icon className="w-4 h-4 text-luxury-gold/50 mb-3" />
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{spec.label}</p>
                                                    <p className="text-sm font-bold tracking-tight">{spec.value}</p>
                                                </div>
                                            ))}

                                        </div>
                                        <div>
                                            <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-4">{t('projectDetailsPage.referenceImagesLabel')}</h4>
                                            <div className="flex flex-wrap gap-4">
                                                {project.stage_details?.sketch_files?.map((url, i) => (
                                                    <div key={i} className="group relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-transparent hover:border-luxury-gold transition-all cursor-pointer shadow-lg" onClick={() => setPreviewImage(url)}>
                                                        <img src={url} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                ))}
                                                <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer group" onClick={() => setIsAddingSketch(true)}>
                                                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-luxury-gold transition-colors" />
                                                    <span className="text-[10px] font-bold text-muted-foreground">{t('common.add')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <aside className="space-y-6">
                                <TimeTracker project={project} />
                                <Card className="bg-luxury-gold/5 border-luxury-gold/20 backdrop-blur-md shadow-lg shadow-luxury-gold/5 overflow-hidden group">
                                    <CardHeader className="pb-2 border-b border-luxury-gold/10">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xs uppercase tracking-widest text-luxury-gold font-bold">{t('projectDetailsPage.internalNotesTitle')}</CardTitle>
                                            <Shield className="w-3.5 h-3.5 text-luxury-gold" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <Textarea className="text-xs bg-transparent border-none focus-visible:ring-0 p-0 min-h-[150px] resize-none no-scrollbar placeholder:text-luxury-gold/20 font-medium leading-relaxed" placeholder={t('projectDetailsPage.typeInternalNotes')} defaultValue={project.internal_notes} onBlur={(e) => {
                                            if (e.target.value !== project.internal_notes) {
                                                apiProjects.update(project.id, { internal_notes: e.target.value }).then(() => toast({ title: t('projectDetailsPage.notesSaved') }));
                                            }
                                        }} />
                                    </CardContent>
                                </Card>
                            </aside>
                        </div>
                    </TabsContent>
                    <TabsContent value="finance" className="mt-0"><ProjectFinancialDashboard project={project} role={role || ''} /></TabsContent>
                    <TabsContent value="timeline" className="mt-0"><ActivityLogList projectId={project.id} /></TabsContent>
                    <TabsContent value="chat" className="mt-0 h-[calc(100vh-250px)]"><ProjectChat projectId={project.id} channel="client" /></TabsContent>
                </main>
            </Tabs>
            <ProjectInspectorDrawer isOpen={isInspectorOpen} onClose={() => setIsInspectorOpen(false)} project={project} role={role || ''} user={user} />

            <ImagePreviewModal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} imageUrl={previewImage} />
            <Dialog open={isPortalLinkDialogOpen} onOpenChange={setIsPortalLinkDialogOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border-black/10 shadow-2xl rounded-3xl p-8">
                    <DialogHeader className="mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 flex items-center justify-center mb-4"><LinkIcon className="w-6 h-6 text-luxury-gold" /></div>
                        <DialogTitle className="text-2xl font-serif text-black dark:text-white">{t('projectDetailsPage.portalLinkTitle')}</DialogTitle>
                        <DialogDescription className="text-sm font-medium pt-2">{t('projectDetailsPage.portalLinkDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl group transition-all hover:border-luxury-gold/30">
                            <code className="text-[12px] flex-1 break-all text-muted-foreground select-all font-mono tracking-tight">{portalLink}</code>
                            <Button size="icon" variant="ghost" onClick={handleCopyLink} className="h-10 w-10 text-luxury-gold hover:bg-luxury-gold/10 rounded-xl shrink-0">
                                {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                        <Button className="w-full h-14 bg-black dark:bg-white text-white dark:text-black font-bold text-sm uppercase tracking-widest rounded-2xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl" onClick={() => setIsPortalLinkDialogOpen(false)}>{t('common.close')}</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
