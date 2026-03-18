import { UserProfile } from '@/services/apiUsers';
import { useParams, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiProjects, ProjectStatus } from '@/services/apiProjects';
import { apiExpenses } from '@/services/apiExpenses';
import { apiInvoices } from '@/services/apiInvoices';
import { apiClients } from '@/services/apiClients';
import { apiNotifications } from '@/services/apiNotifications';
import { apiAffiliates } from '@/services/apiAffiliates';
import { apiActivities } from '@/services/apiActivities';
import { apiUsers } from '@/services/apiUsers';
import { apiMetals } from '@/services/apiMetals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityLogList } from '@/components/ActivityLogList';
import { ProjectChat } from '@/components/project/ProjectChat';
import { ProjectFinancialDashboard } from '@/components/project/ProjectFinancialDashboard';
import {
    Clock,
    Upload,
    FileText,
    Trash2,
    CheckCircle2,
    AlertCircle,
    DollarSign,
    ArrowLeft,
    Activity,
    ShieldCheck,
    Eye,
    User,
    Shield,
    XCircle,
    Send,
    Factory,
    ThumbsUp,
    ThumbsDown,
    Pencil,
    Save,
    X,
    Handshake,
    Link as LinkIcon
} from "lucide-react";
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
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { calculateCanadianTax, provinceNames, CanadianProvince, formatCurrency } from '@/utils/taxUtils';
import { financialUtils } from '@/utils/financialUtils';


export default function ProjectDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, role } = useAuth();
 // Get current role and user
    const [isAddingRender, setIsAddingRender] = useState(false);
    const [isAddingSketch, setIsAddingSketch] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [isEditingAffiliate, setIsEditingAffiliate] = useState(false);
    const [selectedAffiliateId, setSelectedAffiliateId] = useState('');
    const [isEditingManufacturer, setIsEditingManufacturer] = useState(false);
    const [selectedManufacturerId, setSelectedManufacturerId] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [localPriority, setLocalPriority] = useState<string | null>(null);
    const [localStatus, setLocalStatus] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [modNotes, setModNotes] = useState('');
    const [isModDialogOpen, setIsModDialogOpen] = useState(false);
    const [editingModVersion, setEditingModVersion] = useState<number | null>(null);

    const handleSendClientAccessLink = async () => {
        setIsSharing(true);
        try {
            // If they have an email, send the magic link
            if (project?.client?.email) {
                const { error } = await supabase.auth.signInWithOtp({
                    email: project.client.email,
                    options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`
                    }
                });
                if (error) throw error;
                alert(`Portal access link successfully sent to ${project.client.email}!`);
            } else {
                // If they DON'T have an email, copy the anonymous share link to clipboard
                const token = project.share_token;
                if (!token) {
                    alert("This project doesn't have a share token yet. Please contact admin.");
                    return;
                }
                const shareUrl = `${window.location.origin}/shared/${token}`;
                await navigator.clipboard.writeText(shareUrl);
                alert("Client has no email. A direct access link has been copied to your clipboard. You can paste it in a message (WhatsApp, SMS, etc) to send to them.");
            }
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : String(err);
            alert("Failed: " + message);
        } finally {
            setIsSharing(false);
        }
    };

    // In a real app, we'd fetch by ID. 
    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll
    });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: apiClients.getAll,
        enabled: isEditingClient // Only fetch when editing
    });

    const { data: affiliates } = useQuery({
        queryKey: ['affiliates'],
        queryFn: apiAffiliates.getAffiliates,
        enabled: isEditingAffiliate
    });

    const { data: manufacturers } = useQuery({
        queryKey: ['manufacturers'],
        queryFn: () => apiUsers.getAll().then(users => users.filter((u: UserProfile) => u.role === 'manufacturer')),
        enabled: isEditingManufacturer
    });

    const { data: metalsPrice } = useQuery({
        queryKey: ['metalsPrice'],
        queryFn: apiMetals.getLatestPrices,
        refetchInterval: 1000 * 60 * 15, // 15 mins
    });

    const { data: invoices } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll
    });

    const project = projects?.find(p => p.id === id) || projects?.[0]; // Fallback for demo

    // Auto-migrate legacy costs to cost_items (must be before any conditional return)
    React.useEffect(() => {
        if (!project || !project.financials) return;

        const hasLegacyMfg = (project.financials.supplier_cost || 0) > 0;
        const hasLegacyAdd = (project.financials.additional_expense || 0) > 0;

        if (hasLegacyMfg || hasLegacyAdd) {
            const newItems = [...(project.financials.cost_items || [])];
            let changed = false;

            if (hasLegacyMfg) {
                newItems.push({ id: crypto.randomUUID(), detail: 'Manufacturing Cost', amount: project.financials.supplier_cost! });
                changed = true;
            }
            if (hasLegacyAdd) {
                newItems.push({ id: crypto.randomUUID(), detail: 'Additional Expense', amount: project.financials.additional_expense! });
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
                        details: `Auto-migrated legacy costs to dynamic line items.`
                    });
                });
            }
        }
    }, [project?.id, project?.financials?.supplier_cost, project?.financials?.additional_expense, queryClient, user]);

    if (!project) return <div>Project not found</div>;

    const handleStatusUpdate = (status: ProjectStatus) => {
        const userContext = user ? { id: user.id, name: user.user_metadata?.full_name || 'Utilisateur' } : undefined;
        apiProjects.updateStatus(project.id, status, userContext)
            .then(async () => {
                queryClient.invalidateQueries({ queryKey: ['projects'] });

                // Detailed Notifications for Status Changes
                if (status === 'design_ready') {
                    console.log('[Notifications] Design Ready triggered for project:', project.title);

                    if (project.client_id) {
                        apiNotifications.create({
                            user_id: project.client_id,
                            title: 'Design Ready for Review',
                            message: `Your project "${project.title}" has a new 3D design ready for your approval.`,
                            type: 'info',
                            link: `/dashboard/projects/${project.id}`
                        }).then(() => console.log('[Notifications] Client notification created'))
                            .catch(err => console.error('[Notifications] Client notification FAILED:', err));
                    }

                    // Notify Secretaries and Admins
                    try {
                        const allUsers = await apiUsers.getAll();
                        const notifiedUsers = allUsers.filter(u => u.role === 'secretary' || u.role === 'admin');
                        console.log('[Notifications] Found users to notify:', notifiedUsers.map(u => ({ name: u.full_name, role: u.role, email: u.email })));

                        for (const userToNotify of notifiedUsers) {
                            // 1. In-App Notification
                            try {
                                await apiNotifications.create({
                                    user_id: userToNotify.id,
                                    title: 'Design Ready for Review',
                                    message: `The project "${project.title}" is Design Ready and awaits client review.`,
                                    type: 'info',
                                    link: `/dashboard/projects/${project.id}`
                                });
                                console.log(`[Notifications] ✅ In-app notification created for ${userToNotify.full_name}`);
                            } catch (err) {
                                console.error(`[Notifications] ❌ In-app notification FAILED for ${userToNotify.full_name}:`, err);
                            }

                            // 2. Email Notification via Edge Function
                            const emailAddress = userToNotify.email;
                            if (emailAddress) {
                                console.log(`[Notifications] Sending email to ${emailAddress}...`);
                                supabase.functions.invoke('send-email', {
                                    body: {
                                        to: emailAddress,
                                        subject: `Design Ready: ${project.title}`,
                                        html: `
                                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                                <h2 style="color: #6a5100;">Design Ready for Review</h2>
                                                <p>Hello ${userToNotify.full_name},</p>
                                                <p>The manufacturing team has marked the project <strong>"${project.title}"</strong> as Design Ready.</p>
                                                <p>Please review the design files and coordinate with the client for approval.</p>
                                                <br/>
                                                <a href="${window.location.origin}/dashboard/projects/${project.id}" style="background-color: #6a5100; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a>
                                            </div>
                                        `
                                    }
                                }).then(res => console.log(`[Notifications] ✅ Email result for ${emailAddress}:`, res))
                                    .catch(err => console.error(`[Notifications] ❌ Email FAILED for ${emailAddress}:`, err));
                            } else {
                                console.warn(`[Notifications] ⚠️ No email found for ${userToNotify.full_name}`);
                            }
                        }
                    } catch (err) {
                        console.error("[Notifications] Failed to fetch users for notifications", err);
                    }

                } else if (status === 'production') {
                    if (project.client_id) {
                        apiNotifications.create({
                            user_id: project.client_id,
                            title: 'Production Started',
                            message: `Great news! "${project.title}" is now in production.`,
                            type: 'success',
                            link: `/dashboard/projects/${project.id}`
                        });
                    }
                    // Email secretaries & admins
                    try {
                        const allUsers = await apiUsers.getAll();
                        allUsers.filter(u => u.role === 'secretary' || u.role === 'admin').forEach(u => {
                            const email = u.email;
                            if (email) {
                                supabase.functions.invoke('send-email', {
                                    body: { to: email, subject: `Production Started: ${project.title}`, html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h2 style="color:#6a5100;">Production Started</h2><p>Hello ${u.full_name},</p><p>The project <strong>"${project.title}"</strong> has entered production.</p><a href="${window.location.origin}/dashboard/projects/${project.id}" style="background-color:#6a5100;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">View Project</a></div>` }
                                }).catch(err => console.error("Email failed:", err));
                            }
                        });
                    } catch (err) { /* silent */ }

                } else if (status === 'delivery') {
                    if (project.client_id) {
                        apiNotifications.create({
                            user_id: project.client_id,
                            title: 'Order Shipped',
                            message: `Your project "${project.title}" is on its way!`,
                            type: 'success',
                            link: `/dashboard/projects/${project.id}`
                        });
                    }
                    try {
                        const allUsers = await apiUsers.getAll();
                        allUsers.filter(u => u.role === 'secretary' || u.role === 'admin').forEach(u => {
                            const email = u.email;
                            if (email) {
                                supabase.functions.invoke('send-email', {
                                    body: { to: email, subject: `Shipped: ${project.title}`, html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h2 style="color:#6a5100;">Order Shipped</h2><p>Hello ${u.full_name},</p><p>The project <strong>"${project.title}"</strong> has been shipped for delivery.</p><a href="${window.location.origin}/dashboard/projects/${project.id}" style="background-color:#6a5100;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">View Project</a></div>` }
                                }).catch(err => console.error("Email failed:", err));
                            }
                        });
                    } catch (err) { /* silent */ }

                } else if (status === 'completed') {
                    if (project.client_id) {
                        apiNotifications.create({
                            user_id: project.client_id,
                            title: 'Project Completed',
                            message: `Your project "${project.title}" is complete! Thank you for choosing Auclaire.`,
                            type: 'success',
                            link: `/dashboard/projects/${project.id}`
                        });
                    }
                    try {
                        const allUsers = await apiUsers.getAll();
                        allUsers.filter(u => u.role === 'secretary' || u.role === 'admin').forEach(u => {
                            const email = u.email;
                            if (email) {
                                supabase.functions.invoke('send-email', {
                                    body: { to: email, subject: `Completed: ${project.title}`, html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h2 style="color:#6a5100;">Project Completed 🎉</h2><p>Hello ${u.full_name},</p><p>The project <strong>"${project.title}"</strong> has been marked as completed.</p><a href="${window.location.origin}/dashboard/projects/${project.id}" style="background-color:#6a5100;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">View Project</a></div>` }
                                }).catch(err => console.error("Email failed:", err));
                            }
                        });
                    } catch (err) { /* silent */ }

                } else if (status === 'design_modification' && project.manufacturer_id) {
                    apiNotifications.create({
                        user_id: project.manufacturer_id,
                        title: 'Modifications Requested',
                        message: `Changes have been requested on "${project.title}".`,
                        type: 'warning',
                        link: `/dashboard/projects/${project.id}`
                    });
                }
            });
    };

    const handleSubmitModification = async () => {
        if (!modNotes.trim()) return;

        const currentVersions = project.stage_details?.design_versions || [];
        
        try {
            if (editingModVersion !== null) {
                // EDITING EXISTING VERSION
                const newVersions = currentVersions.map(v => 
                    v.version_number === editingModVersion 
                        ? { ...v, feedback: modNotes } 
                        : v
                );
                await apiProjects.updateDetails(project.id, {
                    design_versions: newVersions,
                    client_notes: role === 'client' ? modNotes : project.stage_details?.client_notes
                });
                toast({ title: "Modification updated." });
            } else {
                // NEW MOD REQUEST
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
                toast({ title: "Modifications requested & design archived." });
            }

            setIsModDialogOpen(false);
            setModNotes('');
            setEditingModVersion(null);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        } catch (err) {
            toast({ title: "Failed to save modification", variant: "destructive" });
        }
    };

    const handleDeleteMod = async (verNumber: number) => {
        if (!confirm("Are you sure you want to delete this historical iteration? This cannot be undone.")) return;
        
        try {
            const currentVersions = project.stage_details?.design_versions || [];
            const newVersions = currentVersions.filter(v => v.version_number !== verNumber);
            
            await apiProjects.updateDetails(project.id, {
                design_versions: newVersions
            });
            toast({ title: "Iteration deleted." });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        } catch (err) {
            toast({ title: "Delete failed", variant: "destructive" });
        }
    };

    // Helper to check active status for timeline
    const isStepActive = (stepStatus: string) => {
        const statuses = ['designing', '3d_model', 'design_ready', 'waiting_for_approval', 'design_modification', 'approved_for_production', 'production', 'delivery', 'completed'];
        const currentIndex = statuses.indexOf(project.status);
        const stepIndex = statuses.indexOf(stepStatus);

        return currentIndex >= stepIndex;
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'sketch' | 'render') => {
        const file = e.target.files?.[0];
        setUploadError('');

        if (!file) return;

        // Simple size check before compression processing (cancel if > 5MB raw)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError("Image too large. Please pick something under 5MB.");
            return;
        }

        try {
            if (type === 'sketch') {
                const imageUrl = await uploadImage(file, 'sketches');
                const current = project.stage_details?.sketch_files || [];
                await apiProjects.updateDetails(project.id, { sketch_files: [...current, imageUrl] });
                apiActivities.log({
                    project_id: project.id,
                    user_id: user?.id || 'admin',
                    user_name: user?.user_metadata?.full_name || 'User',
                    action: 'update',
                    details: 'Added a new sketch/reference image'
                });
                if (project.client_id) {
                    apiNotifications.create({
                        user_id: 'admin',
                        title: 'New Sketch Uploaded',
                        message: `A new sketch has been added to "${project.title}".`,
                        type: 'info',
                        link: `/dashboard/projects/${project.id}`
                    });
                }
                setIsAddingSketch(false);
            } else {
                const imageUrl = await uploadImage(file, 'designs');
                const current = project.stage_details?.design_files || [];
                await apiProjects.updateDetails(project.id, { design_files: [...current, imageUrl] });
                apiActivities.log({
                    project_id: project.id,
                    user_id: user?.id || 'admin',
                    user_name: user?.user_metadata?.full_name || 'User',
                    action: 'update',
                    details: 'Uploaded a new 3D rendering'
                });
                // Notify Client if Renders are uploaded (optional, but good)
                if (project.client_id && project.status === 'design_ready') {
                    apiNotifications.create({
                        user_id: project.client_id,
                        title: 'New 3D Render Uploaded',
                        message: `A new 3D rendering has been added to "${project.title}".`,
                        type: 'info',
                        link: `/dashboard/projects/${project.id}`
                    });
                }
                if (project.client_id) {
                    apiNotifications.create({
                        user_id: 'admin',
                        title: 'New 3D Render Uploaded',
                        message: `A new 3D rendering has been added to "${project.title}".`,
                        type: 'info',
                        link: `/dashboard/projects/${project.id}`
                    });
                }
                setIsAddingRender(false);
            }

            queryClient.invalidateQueries({ queryKey: ['projects'] });
        } catch (error) {
            console.error("Upload failed", error);
            setUploadError("Failed to save. Storage limit likely reached.");
            // If checking persistence quota specifically
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                setUploadError("Demo Limit: Browser storage full. Delete some items.");
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-2 w-full relative">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                    <div className="flex items-center gap-4 flex-wrap">
                        {(role === 'admin' || role === 'secretary' || role === 'affiliate') && (
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={handleSendClientAccessLink} 
                                disabled={isSharing} 
                                className="gap-2 bg-luxury-gold/10 text-luxury-gold hover:bg-luxury-gold hover:text-black transition-colors border border-luxury-gold/50"
                            >
                                <LinkIcon className="w-4 h-4" />
                                {isSharing ? "Processing..." : "Share Link"}
                            </Button>
                        )}
                        {(role === 'admin' || role === 'affiliate' || role === 'secretary') && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditingClient(true)} className="gap-2 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10">
                                <Pencil className="w-4 h-4" />
                                Edit Client
                            </Button>
                        )}
                        <h1 className="text-3xl font-serif font-bold text-black dark:text-white tracking-wide ml-2">
                            {project.reference_number && <span className="text-luxury-gold/80 font-mono mr-3 text-2xl">[{project.reference_number}]</span>}
                            {project.title}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 ml-4 border-l border-black/10 dark:border-white/10 pl-6">
                            <User className="w-4 h-4 text-luxury-gold/70" />
                            {!isEditingClient ? (
                                <div className="flex items-center gap-2">
                                    <span>Client: {project.client?.full_name}</span>
                                    {(role === 'admin' || role === 'affiliate' || role === 'secretary') && (
                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                                            setSelectedClientId(project.client_id);
                                            setIsEditingClient(true);
                                        }}>
                                            <Pencil className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 animate-in fade-in zoom-in-95">
                                    <select
                                        className="h-7 rounded border border-input bg-background text-sm px-1"
                                        value={selectedClientId}
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                    >
                                        {clients?.map((client) => (
                                            <option key={client.id} value={client.id}>{client.full_name}</option>
                                        ))}
                                    </select>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={() => {
                                        apiProjects.update(project.id, { client_id: selectedClientId })
                                            .then(() => {
                                                const newClient = clients?.find(c => c.id === selectedClientId);
                                                apiActivities.log({
                                                    project_id: project.id,
                                                    user_id: user?.id || 'admin',
                                                    user_name: user?.user_metadata?.full_name || 'Admin',
                                                    action: 'update',
                                                    details: `Reassigned client to ${newClient?.full_name || 'Unknown'}`
                                                });
                                                queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                setIsEditingClient(false);
                                            });
                                    }}>
                                        <Save className="w-3 h-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => setIsEditingClient(false)}>
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {(role === 'admin' || role === 'secretary') && (
                    <Button variant="ghost" size="icon" className="absolute right-0 top-0 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" onClick={async () => {
                        if (confirm("DELETE PROJECT? This action cannot be undone.")) {
                            await apiProjects.delete(project.id);
                            navigate('/dashboard');
                        }
                    }}>
                        <Trash2 className="w-5 h-5" />
                    </Button>
                )}
            </div>
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 mt-2 flex-wrap gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {role !== 'client' && (
                        <>
                            <span className="text-xs font-medium text-gray-500 mr-2">Quick Actions:</span>
                            <Button size="sm" variant={project.status === 'design_ready' ? 'default' : 'outline'} className={project.status === 'design_ready' ? 'bg-luxury-gold hover:bg-luxury-gold-dark text-black' : ''} onClick={() => handleStatusUpdate('design_ready')}>
                                Design Ready
                            </Button>
                            <Button size="sm" variant={project.status === 'design_modification' ? 'default' : 'outline'} className={project.status === 'design_modification' ? 'bg-luxury-gold hover:bg-luxury-gold-dark text-black' : ''} onClick={() => handleStatusUpdate('design_modification')}>
                                Modif Requested
                            </Button>
                            <Button size="sm" variant={project.status === 'approved_for_production' ? 'default' : 'outline'} className={project.status === 'approved_for_production' ? 'bg-luxury-gold hover:bg-luxury-gold-dark text-black' : ''} onClick={() => handleStatusUpdate('approved_for_production')}>
                                Approved (Prod)
                            </Button>
                            <Button size="sm" variant={project.status === 'production' ? 'default' : 'outline'} className={project.status === 'production' ? 'bg-luxury-gold hover:bg-luxury-gold-dark text-black' : ''} onClick={() => handleStatusUpdate('production')}>
                                Start Production
                            </Button>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-widest font-medium text-gray-400">Priority:</span>
                    <select
                        className={`h-8 px-2 rounded-md border border-input font-medium text-sm capitalize ${(localPriority || project.priority) === 'rush' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-background'}`}
                        value={localPriority || project.priority || 'normal'}
                        onChange={(e) => {
                            const newPriority = e.target.value as 'normal' | 'rush';
                            setLocalPriority(newPriority);
                            apiProjects.update(project.id, { priority: newPriority })
                                .then(() => {
                                    apiActivities.log({
                                        project_id: project.id,
                                        user_id: user?.id || 'admin',
                                        user_name: user?.user_metadata?.full_name || 'Admin',
                                        action: 'update',
                                        details: `Changed priority to ${newPriority.toUpperCase()}`
                                    });
                                    queryClient.invalidateQueries({ queryKey: ['projects'] });
                                    queryClient.invalidateQueries({ queryKey: ['activities', project.id] });
                                })
                                .catch(err => {
                                    alert(err.message);
                                    setLocalPriority(null);
                                });
                        }}
                        disabled={role === 'client' || role === 'affiliate' || role === 'manufacturer'} // Secretary can update priority
                    >
                        <option value="normal">Normal</option>
                        <option value="rush">Rush 🚨</option>
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-widest font-medium text-gray-400">Status:</span>
                    <select
                        className="h-8 px-2 rounded-md border border-input bg-background font-medium text-sm capitalize"
                        value={localStatus || project.status}
                        onChange={(e) => {
                            const newStatus = e.target.value as ProjectStatus;
                            setLocalStatus(newStatus);
                            handleStatusUpdate(newStatus);
                            apiActivities.log({
                                project_id: project.id,
                                user_id: user?.id || 'admin',
                                user_name: user?.user_metadata?.full_name || 'Admin',
                                action: 'status_change',
                                details: `Changed status from ${project.status.replace('_', ' ')} to ${newStatus.replace('_', ' ')}`
                            }).then(() => {
                                queryClient.invalidateQueries({ queryKey: ['projects'] });
                                queryClient.invalidateQueries({ queryKey: ['activities', project.id] });
                            });
                        }}
                        disabled={role === 'client'} // Clients shouldn't manually update status
                    >
                        <option value="designing">Designing</option>
                        <option value="3d_model">3D Model</option>
                        <option value="design_ready">Design Ready (Review)</option>
                        <option value="waiting_for_approval">Waiting Approval (Decision)</option>
                        <option value="design_modification">Mod Requested</option>
                        <option value="approved_for_production">Approved (Pending Prod)</option>
                        <option value="production">Production</option>
                        <option value="delivery">Delivery</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>


            {/* Approval Banners */}
            {
                project.status === 'design_ready' && (role === 'admin' || role === 'secretary') && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full">
                                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-amber-900 dark:text-amber-100">Design Ready for Review</h3>
                                <p className="text-sm text-amber-700 dark:text-amber-300">Manufacturer has submitted 3D designs for approval.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                className="border-red-200 hover:bg-red-50 text-red-600" 
                                onClick={() => {
                                    setModNotes('');
                                    setEditingModVersion(null);
                                    setIsModDialogOpen(true);
                                }}
                            >
                                Request Changes
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusUpdate('approved_for_production')}>
                                Approve for Production
                            </Button>
                        </div>
                    </div>
                )
            }

            {
                project.status === 'approved_for_production' && role === 'manufacturer' && (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                                <Factory className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-green-900 dark:text-green-100">Ready for Production</h3>
                                <p className="text-sm text-green-700 dark:text-green-300">Design is approved. Start production when ready.</p>
                            </div>
                        </div>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusUpdate('production')}>
                            Start Production
                        </Button>
                    </div>
                )
            }

            {
                project.status === 'approved_for_production' && (role === 'admin' || role === 'secretary') && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-medium text-blue-900 dark:text-blue-100">Approved for Production</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">Pending manufacturer to start production.</p>
                        </div>
                    </div>
                )
            }

            {
                project.status === 'design_modification' && role === 'manufacturer' && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-medium text-blue-900 dark:text-blue-100">Modification Requested</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">Admin requested changes. Please update the design and re-submit.</p>
                        </div>
                    </div>
                )
            }

            {/* CLIENT APPROVAL BANNER */}
            {/* CLIENT APPROVAL BANNER */}
            {
                project.status === 'design_ready' && role === 'client' && (
                    <Card className="border-l-2 border-l-luxury-gold bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 shadow-xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-luxury-gold font-serif text-xl">
                                <Clock className="w-5 h-5 text-luxury-gold" />
                                Design Approval Required
                            </CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-300">Your custom design is ready for review! Please leave feedback or approve it for production.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="flex gap-4">
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                                    onClick={() => {
                                        if (confirm("Are you sure you want to approve this design? It will wait for the manufacturer to start production.")) {
                                            apiProjects.updateDetails(project.id, { client_approval_status: 'approved' })
                                                .then(() => apiProjects.updateStatus(project.id, 'approved_for_production'))
                                                .then(() => {
                                                    // Create Notification for Admin
                                                    apiNotifications.create({
                                                        user_id: 'admin',
                                                        title: 'Design Approved',
                                                        message: `${project.client?.full_name || 'Client'} approved design for ${project.title}`,
                                                        type: 'success',
                                                        link: `/dashboard/projects/${project.id}`
                                                    });
                                                    // Log Activity
                                                    apiActivities.log({
                                                        project_id: project.id,
                                                        user_id: 'client',
                                                        user_name: project.client?.full_name || 'Client',
                                                        action: 'approval',
                                                        details: 'Approved design for production'
                                                    });
                                                    queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                    queryClient.invalidateQueries({ queryKey: ['activities', project.id] });
                                                });
                                        }
                                    }}
                                >
                                    <ThumbsUp className="w-4 h-4" /> Approve Design
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-2"
                                    onClick={() => {
                                        setModNotes('');
                                        setEditingModVersion(null);
                                        setIsModDialogOpen(true);
                                    }}
                                >
                                    <ThumbsDown className="w-4 h-4" /> Request Changes
                                </Button>
                            </div>
                            {project.stage_details?.client_approval_status === 'changes_requested' && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100">
                                    <span className="font-bold">Your Feedback:</span> {project.stage_details.client_notes}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            }

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Tabs defaultValue="timeline" className="w-full">
                        <TabsList className={`grid w-full ${(role === 'admin' || role === 'secretary') ? 'grid-cols-4' : 'grid-cols-3'}`}>
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                            <TabsTrigger value="activity">Activity Log</TabsTrigger>
                            <TabsTrigger value="messages">Messages</TabsTrigger>
                            {(role === 'admin' || role === 'secretary') && (
                                <TabsTrigger value="finance" className="text-luxury-gold">Intelligence</TabsTrigger>
                            )}
                        </TabsList>
                        <TabsContent value="timeline">
                            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/5 dark:border-white/5 shadow-xl">
                                <CardHeader className="border-b border-black/5 dark:border-white/5 pb-4">
                                    <CardTitle className="text-luxury-gold font-serif text-lg tracking-wide">Project Timeline</CardTitle>
                                    <CardDescription className="text-xs uppercase tracking-widest text-[#A68A56]">Design & Manufacturing Progress</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* Mock Timeline Visual */}
                                    <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-4 space-y-8 pb-4">
                                        {[
                                            { status: 'designing', label: 'Initial Design', date: project.created_at, active: isStepActive('designing') },
                                            { status: '3d_model', label: '3D Modeling', date: 'TBD', active: isStepActive('3d_model') },
                                            { status: 'design_ready', label: 'Design Ready (Review)', date: 'TBD', active: isStepActive('design_ready') },
                                            { status: 'waiting_for_approval', label: 'Waiting Approval (Client)', date: 'TBD', active: isStepActive('waiting_for_approval') },
                                            { status: 'design_modification', label: 'Modifications Requested', date: 'TBD', active: isStepActive('design_modification') },
                                            { status: 'approved_for_production', label: 'Approved (Pending Prod)', date: 'TBD', active: isStepActive('approved_for_production') },
                                            { status: 'production', label: 'Production', date: 'TBD', active: isStepActive('production') },
                                            { status: 'delivery', label: 'Final QC & Delivery', date: project.deadline, active: isStepActive('delivery') },
                                            { status: 'completed', label: 'Completed', date: 'TBD', active: isStepActive('completed') },
                                        ].map((step, i) => (
                                            <div key={i} className="relative pl-6 group cursor-pointer" onClick={() => handleStatusUpdate(step.status as ProjectStatus)}>
                                                <div className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 transition-colors ${step.active ? 'bg-luxury-gold border-luxury-gold' : 'bg-background border-zinc-300 group-hover:border-luxury-gold'}`} />
                                                <p className={`text-sm font-medium transition-colors ${step.active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>{step.label}</p>
                                                <p className="text-xs text-muted-foreground">{step.date ? (!step.date.includes('T') ? step.date : new Date(step.date).toLocaleDateString()) : 'Pending'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="activity">
                            <ActivityLogList projectId={project.id} />
                        </TabsContent>
                        <TabsContent value="messages">
                            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 shadow-xl overflow-hidden">
                                <Tabs defaultValue={role === 'client' ? 'client' : 'internal'} className="w-full">
                                    <div className="px-4 pt-4 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
                                        <TabsList className="bg-transparent h-auto p-0 gap-6">
                                            {(role === 'admin' || role === 'secretary' || role === 'affiliate' || role === 'manufacturer') && (
                                                <TabsTrigger 
                                                    value="internal" 
                                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-luxury-gold rounded-none px-0 pb-2 text-xs uppercase tracking-widest"
                                                >
                                                    Canal Interne
                                                </TabsTrigger>
                                            )}
                                            {(role === 'admin' || role === 'secretary' || role === 'affiliate' || role === 'client') && (
                                                <TabsTrigger 
                                                    value="client" 
                                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-luxury-gold rounded-none px-0 pb-2 text-xs uppercase tracking-widest"
                                                >
                                                    Canal Client
                                                </TabsTrigger>
                                            )}
                                        </TabsList>
                                    </div>
                                    <TabsContent value="internal" className="m-0">
                                        <ProjectChat projectId={project.id} channel="internal" />
                                    </TabsContent>
                                    <TabsContent value="client" className="m-0">
                                        <ProjectChat projectId={project.id} channel="client" />
                                    </TabsContent>
                                </Tabs>
                            </Card>
                        </TabsContent>
                        {(role === 'admin' || role === 'secretary') && (
                            <TabsContent value="finance">
                                <ProjectFinancialDashboard 
                                    budget={project.budget}
                                    financials={project.financials}
                                    commission={financialUtils.computeCommissionAmount(project)}
                                />
                            </TabsContent>
                        )}
                    </Tabs>
                </div>

                <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-luxury-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <CardHeader className="border-b border-black/5 dark:border-white/5 pb-4 bg-white/50 dark:bg-white/[0.02]">
                        <CardTitle className="text-luxury-gold font-serif text-lg tracking-wide">Financial Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                        {/* Margin Health Gauge */}
                        {(() => {
                            const { marginAmount, marginPercent } = financialUtils.computeProjectMargin(project);
                            const revenue = financialUtils.getSalePrice(project);
                            const isHealthy = marginPercent >= 40;
                            const isWarning = marginPercent >= 20 && marginPercent < 40;
                            const isCritical = marginPercent < 20;
                            const gaugeColor = isHealthy ? '#22c55e' : isWarning ? '#eab308' : '#ef4444';
                            const clampedPercent = Math.min(100, Math.max(0, marginPercent));
                            const angle = (clampedPercent / 100) * 180;
                            const rad = (angle - 180) * (Math.PI / 180);
                            const r = 40;
                            const cx = 50;
                            const cy = 45;
                            const x = cx + r * Math.cos(rad);
                            const y = cy + r * Math.sin(rad);
                            const largeArc = angle > 180 ? 1 : 0;
                            const arcPath = angle <= 0
                                ? ''
                                : `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${x.toFixed(2)} ${y.toFixed(2)}`;

                            return (
                                <div className="rounded-xl border border-luxury-gold/20 bg-gradient-to-br from-luxury-gold/5 to-transparent p-4">
                                    <div className="flex items-center gap-6">
                                        <div className="shrink-0">
                                            <svg
                                                viewBox="0 0 100 55"
                                                className="w-28 h-14"
                                                aria-label={`Marge: ${marginPercent.toFixed(1)}%`}
                                            >
                                                <path
                                                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="6"
                                                    className="text-zinc-200 dark:text-zinc-700"
                                                    strokeLinecap="round"
                                                />
                                                {arcPath && (
                                                    <path
                                                        d={arcPath}
                                                        fill="none"
                                                        stroke={gaugeColor}
                                                        strokeWidth="6"
                                                        strokeLinecap="round"
                                                        className="transition-all duration-700"
                                                    />
                                                )}
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">Marge</p>
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                <span className={`text-xl font-serif font-bold ${isHealthy ? 'text-green-600 dark:text-green-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {marginPercent.toFixed(1)}%
                                                </span>
                                                <span className="text-sm text-muted-foreground font-mono">
                                                    {formatCurrency(marginAmount)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                sur {formatCurrency(revenue)} de revenu
                                            </p>
                                            {isCritical && (
                                                <p className="text-xs text-red-500 dark:text-red-400 font-medium mt-2 flex items-center gap-1.5">
                                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                    Marge sous 20% — vérifier les coûts ou le prix de vente
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Affiliate Section */}
                        {(role === 'admin' || role === 'affiliate' || role === 'secretary' || project.affiliate_id) && (
                            <>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Handshake className="w-3 h-3" /> Ambassador
                                    </span>
                                    {!isEditingAffiliate ? (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{project.affiliate?.full_name || 'None'}</span>
                                            {(role === 'admin' || role === 'secretary') && (
                                                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => {
                                                    setSelectedAffiliateId(project.affiliate_id || '');
                                                    setIsEditingAffiliate(true);
                                                }}>
                                                    <Pencil className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 animate-in fade-in zoom-in-95">
                                            <select
                                                className="h-6 rounded border border-input bg-background text-xs px-1 w-32"
                                                value={selectedAffiliateId}
                                                onChange={(e) => setSelectedAffiliateId(e.target.value)}
                                            >
                                                <option value="">None</option>
                                                {affiliates?.map((a) => (
                                                    <option key={a.id} value={a.id}>{a.full_name}</option>
                                                ))}
                                            </select>
                                            <Button size="icon" variant="ghost" className="h-5 w-5 text-green-600" onClick={() => {
                                                const affiliate = affiliates?.find(a => a.id === selectedAffiliateId);
                                                const updates: Record<string, unknown> = { affiliate_id: selectedAffiliateId || null };
                                                if (affiliate) {
                                                    updates.affiliate_commission_rate = affiliate.commission_rate;
                                                    updates.affiliate_commission_type = affiliate.commission_type;
                                                }

                                                apiProjects.update(project.id, updates)
                                                    .then(() => {
                                                        queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                        setIsEditingAffiliate(false);
                                                        if (selectedAffiliateId && affiliate) {
                                                            apiActivities.log({
                                                                project_id: project.id,
                                                                user_id: user?.id || 'admin',
                                                                user_name: user?.user_metadata?.full_name || 'Admin',
                                                                action: 'update',
                                                                details: `Assigned ambassador ${affiliate.full_name}`
                                                            });
                                                            apiNotifications.create({
                                                                user_id: selectedAffiliateId,
                                                                title: 'New Ambassador Assignment',
                                                                message: `You've been assigned to the project "${project.title}"!`,
                                                                type: 'info',
                                                                link: `/dashboard/projects/${project.id}`
                                                            });
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(error);
                                                        alert(`Failed to assign ambassador. Likely database schema mismatch.\nDid you run the SQL script?\n\nError: ${error.message}`);
                                                    });
                                            }}>
                                                <Save className="w-3 h-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-5 w-5 text-red-500" onClick={() => setIsEditingAffiliate(false)}>
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {/* Manufacturer Assignment */}
                                {(role === 'admin' || role === 'secretary') && (
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Factory className="w-3 h-3" /> Manufacturer
                                        </span>
                                        {!isEditingManufacturer ? (
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{project.manufacturer?.full_name || 'None'}</span>
                                                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => {
                                                    setSelectedManufacturerId(project.manufacturer_id || '');
                                                    setIsEditingManufacturer(true);
                                                }}>
                                                    <Pencil className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 animate-in fade-in zoom-in-95">
                                                <select
                                                    className="h-6 rounded border border-input bg-background text-xs px-1 w-36"
                                                    value={selectedManufacturerId}
                                                    onChange={(e) => setSelectedManufacturerId(e.target.value)}
                                                >
                                                    <option value="">None</option>
                                                    {manufacturers?.map((m: UserProfile) => (
                                                        <option key={m.id} value={m.id}>{m.full_name}</option>
                                                    ))}
                                                </select>
                                                <Button size="icon" variant="ghost" className="h-5 w-5 text-green-600" onClick={() => {
                                                    apiProjects.update(project.id, { manufacturer_id: selectedManufacturerId || null })
                                                        .then(() => {
                                                            const mfg = manufacturers?.find((m: UserProfile) => m.id === selectedManufacturerId);
                                                            queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                            setIsEditingManufacturer(false);
                                                            if (selectedManufacturerId && mfg) {
                                                                apiActivities.log({
                                                                    project_id: project.id,
                                                                    user_id: user?.id || 'admin',
                                                                    user_name: user?.user_metadata?.full_name || 'Admin',
                                                                    action: 'update',
                                                                    details: `Assigned manufacturer ${mfg.full_name}`
                                                                });
                                                                apiNotifications.create({
                                                                    user_id: selectedManufacturerId,
                                                                    title: 'New Manufacturing Assignment',
                                                                    message: `You've been assigned to manufacture "${project.title}"!`,
                                                                    type: 'info',
                                                                    link: `/dashboard/projects/${project.id}`
                                                                });
                                                            }
                                                        })
                                                        .catch(err => alert('Failed to assign manufacturer: ' + err.message));
                                                }}>
                                                    <Save className="w-3 h-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-5 w-5 text-red-500" onClick={() => setIsEditingManufacturer(false)}>
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Commission Controls (Editable) */}
                                {project.affiliate_id && (role === 'admin' || role === 'affiliate' || role === 'secretary') && (
                                    <>
                                        <div className="flex items-center justify-between mt-2 pl-5">
                                            <span className="text-xs text-muted-foreground">Commission</span>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    className="w-16 text-right border rounded px-1 py-0.5 text-xs bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                                    defaultValue={project.affiliate_commission_rate || 0}
                                                    onBlur={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) {
                                                            apiProjects.update(project.id, { affiliate_commission_rate: val })
                                                                .then(() => queryClient.invalidateQueries({ queryKey: ['projects'] }))
                                                                .catch(err => alert(err.message));
                                                        }
                                                    }}
                                                />
                                                <select
                                                    className="h-6 rounded border border-input bg-background text-xs px-1"
                                                    value={project.affiliate_commission_type || 'percent'}
                                                    onChange={(e) => {
                                                        apiProjects.update(project.id, { affiliate_commission_type: e.target.value as 'percent' | 'fixed' })
                                                            .then(() => queryClient.invalidateQueries({ queryKey: ['projects'] }))
                                                            .catch(err => alert(err.message));
                                                    }}
                                                >
                                                    <option value="percent">%</option>
                                                    <option value="fixed">$</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pl-5">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Calculated</span>
                                                <span className="text-sm font-bold text-luxury-gold">
                                                    ${financialUtils.computeCommissionAmount(project).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            {(!project.financials?.commission_exported_to_expenses) ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-[10px] h-7 gap-1 text-luxury-gold border-luxury-gold/30 hover:bg-luxury-gold hover:text-black transition-colors"
                                                    onClick={async () => {
                                                        const amount = financialUtils.computeCommissionAmount(project);

                                                        if (amount <= 0) {
                                                            alert("Commission amount must be greater than 0.");
                                                            return;
                                                        }

                                                        if (confirm(`Export $${amount.toLocaleString()} commission for ${project.affiliate?.full_name} to Expenses?`)) {
                                                            try {
                                                                await apiExpenses.create({
                                                                    date: new Date().toISOString().split('T')[0],
                                                                    category: 'commission',
                                                                    amount: amount,
                                                                    description: `Commission: ${project.title} (${project.affiliate?.full_name})`,
                                                                    recipient_id: project.affiliate_id,
                                                                    project_id: project.id,
                                                                    status: 'pending'
                                                                });

                                                                await apiProjects.updateFinancials(project.id, {
                                                                    commission_exported_to_expenses: true
                                                                });

                                                                apiActivities.log({
                                                                    project_id: project.id,
                                                                    user_id: user?.id || 'admin',
                                                                    user_name: user?.user_metadata?.full_name || 'Admin User',
                                                                    action: 'update',
                                                                    details: `Exported commission ($${amount.toLocaleString()}) for ${project.affiliate?.full_name} to expenses.`
                                                                });

                                                                queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                                queryClient.invalidateQueries({ queryKey: ['expenses'] });
                                                                alert("Commission exported successfully!");
                                                            } catch (err) {
                                                                alert("Export failed: " + err.message);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    🚀 Send to Commission
                                                </Button>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3 text-green-500" /> Commission Sent
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-[10px] h-7 px-2 text-red-500 hover:bg-red-500/10 transition-colors"
                                                        onClick={async () => {
                                                            if (confirm(`Are you sure you want to REVERT this commission export? This will delete the matching expense.`)) {
                                                                try {
                                                                    await apiExpenses.deleteByProjectAndCategory(project.id, 'commission');

                                                                    await apiProjects.updateFinancials(project.id, {
                                                                        commission_exported_to_expenses: false
                                                                    });

                                                                    // Reset the commission rate
                                                                    await apiProjects.update(project.id, {
                                                                        affiliate_commission_rate: 0,
                                                                        affiliate_commission_type: 'percent'
                                                                    });

                                                                    apiActivities.log({
                                                                        project_id: project.id,
                                                                        user_id: user?.id || 'admin',
                                                                        user_name: user?.user_metadata?.full_name || 'Admin User',
                                                                        action: 'update',
                                                                        details: `Reverted and reset commission export for ${project.affiliate?.full_name}. Expense deleted.`
                                                                    });

                                                                    queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                                    queryClient.invalidateQueries({ queryKey: ['expenses'] });
                                                                    alert("Commission export reverted successfully!");
                                                                } catch (err) {
                                                                    alert("Revert failed: " + err.message);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        Undo Export
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                        {/* Budget & Profit - Hidden for Clients, Manufacturers, Sales & Affiliates (partially) */}

                        {role !== 'client' && role !== 'manufacturer' && (
                            <>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="w-3 h-3" /> Sale Price (Net)</span>
                                    <input
                                        type="number"
                                        className="w-32 text-right border rounded px-2 py-1 text-sm font-medium bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                        defaultValue={project.budget}
                                        placeholder="0.00"
                                        onBlur={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val)) {
                                                apiProjects.update(project.id, { budget: val })
                                                    .then(() => {
                                                        apiActivities.log({
                                                            project_id: project.id,
                                                            user_id: user?.id || 'admin',
                                                            user_name: user?.user_metadata?.full_name || 'Admin User',
                                                            action: 'update',
                                                            details: `Updated Sale Price to $${val}`
                                                        });
                                                        queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                    });
                                            }
                                        }}
                                    />
                                </div>

                                {/* Tax Region Selector */}
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">📍 Tax Region (Canada)</span>
                                    <select
                                        className="h-8 rounded border border-input bg-background text-xs px-1 w-32"
                                        value={project.financials?.tax_province || ''}
                                        onChange={(e) => {
                                            const province = e.target.value;
                                            apiProjects.updateFinancials(project.id, { tax_province: province || undefined })
                                                .then(() => queryClient.invalidateQueries({ queryKey: ['projects'] }));
                                        }}
                                    >
                                        <option value="">None / Intl</option>
                                        {Object.entries(provinceNames).map(([code, name]) => (
                                            <option key={code} value={code}>{name} ({code})</option>
                                        ))}
                                    </select>
                                </div>

                                {project.financials?.tax_province && (
                                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-md space-y-1 text-xs border border-luxury-gold/10">
                                        {(() => {
                                            const net = project.budget || 0;
                                            const breakdown = calculateCanadianTax(net, project.financials.tax_province as CanadianProvince);
                                            return (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span>GST/TPS (5%):</span>
                                                        <span>{formatCurrency(breakdown.gst)}</span>
                                                    </div>
                                                    {breakdown.pst > 0 && (
                                                        <div className="flex justify-between">
                                                            <span>PST/TVQ ({project.financials.tax_province === 'QC' ? '9.975%' : '7%'}):</span>
                                                            <span>{formatCurrency(breakdown.pst)}</span>
                                                        </div>
                                                    )}
                                                    {breakdown.hst > 0 && (
                                                        <div className="flex justify-between">
                                                            <span>HST ({breakdown.totalRate.toFixed(0)}%):</span>
                                                            <span>{formatCurrency(breakdown.hst)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between font-bold border-t pt-1 mt-1 text-luxury-gold">
                                                        <span>Total Gross:</span>
                                                        <span>{formatCurrency(net + breakdown.total)}</span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Payment Tracking */}
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Paid Amount</span>
                                        <input
                                            type="number"
                                            className="w-24 text-right border rounded px-1 py-0.5 text-xs bg-transparent"
                                            defaultValue={project.financials?.paid_amount || 0}
                                            placeholder="0.00"
                                            onBlur={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) {
                                                    apiProjects.updateFinancials(project.id, { paid_amount: val })
                                                        .then(() => {
                                                            queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                        });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-bold">
                                        <span>Balance Due</span>
                                        {(() => {
                                            const net = project.budget || 0;
                                            const tax = project.financials?.tax_province 
                                                ? calculateCanadianTax(net, project.financials.tax_province as CanadianProvince).total 
                                                : 0;
                                            const gross = net + tax;
                                            const balance = gross - (project.financials?.paid_amount || 0);
                                            return (
                                                <span className={balance > 0 ? "text-red-500" : "text-green-600"}>
                                                    {formatCurrency(balance)}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-500"
                                            style={{ 
                                                width: `${Math.min(100, ((project.financials?.paid_amount || 0) / 
                                                ((project.budget || 1) + (project.financials?.tax_province ? calculateCanadianTax(project.budget || 0, project.financials.tax_province as CanadianProvince).total : 0))) * 100)}%` 
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="border-b pb-2"></div>
                            </>
                        )}

                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="w-3 h-3" /> Deadline</span>
                            <span className="font-medium">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'None'}</span>
                        </div>

                        {/* Precious Metals Market Price */}
                        {(role === 'admin' || role === 'secretary') && metalsPrice && (
                            <div className="bg-gradient-to-r from-amber-500/10 to-amber-900/10 border border-amber-500/20 p-3 rounded-md space-y-2 mt-4 mb-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-500 flex items-center gap-1 mb-2">
                                    <Activity className="w-3 h-3" /> Live Metals Market (Per Gram)
                                </h4>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-[9px]">Silver 925</span>
                                        <span className="font-bold text-gray-700 dark:text-gray-300">${metalsPrice.silver925.toFixed(2)}/g</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-[9px]">Gold 10k</span>
                                        <span className="font-bold text-amber-600 dark:text-amber-400">${metalsPrice.gold10k.toFixed(2)}/g</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-[9px]">Gold 14k</span>
                                        <span className="font-bold text-luxury-gold">${metalsPrice.gold14k.toFixed(2)}/g</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-[9px]">Gold 18k</span>
                                        <span className="font-bold text-amber-500">${metalsPrice.gold18k.toFixed(2)}/g</span>
                                    </div>
                                </div>
                                <div className="text-[9px] text-right text-muted-foreground mt-1 opacity-60">XAu/USD Index: ${metalsPrice.xauOunce.toFixed(2)} / oz</div>
                            </div>
                        )}

                        {/* Admin Financials - Strictly for Admin */}
                        {(role === 'admin' || role === 'secretary') && (
                            <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-md space-y-2">
                                <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Admin Financials
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>Supplier Cost:</div>
                                    <div className="font-mono text-right text-red-500">-${project.financials?.supplier_cost || 0}</div>

                                    <div>Shipping/Customs:</div>
                                    <div className="font-mono text-right text-red-500">-${(project.financials?.shipping_cost || 0) + (project.financials?.customs_fee || 0)}</div>

                                    {project.financials?.additional_expense ? (
                                        <>
                                            <div>Additional Expense:</div>
                                            <div className="font-mono text-right text-red-500">-${project.financials.additional_expense}</div>
                                        </>
                                    ) : null}

                                    {project.financials?.cost_items?.map((item, idx) => (
                                        <React.Fragment key={item.id || idx}>
                                            <div>{item.detail || "Cost Item"}:</div>
                                            <div className="font-mono text-right text-red-500">-${item.amount}</div>
                                        </React.Fragment>
                                    ))}

                                    {/* Commission Display */}
                                    {project.affiliate_id && (
                                        <>
                                            <div>Commission ({project.affiliate_commission_type === 'fixed' ? 'Fixed' : `${project.affiliate_commission_rate}%`}):</div>
                                            <div className="font-mono text-right text-red-500">
                                                -${financialUtils
                                                    .computeCommissionAmount(project)
                                                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </>
                                    )}

                                    <div className="border-t pt-1 font-bold">Net Profit:</div>
                                    <div
                                        className={`border-t pt-1 font-mono text-right font-bold ${
                                            (() => {
                                                const { marginAmount } = financialUtils.computeProjectMargin(project);
                                                return marginAmount > 0 ? 'text-green-600' : 'text-red-600';
                                            })()
                                        }`}
                                    >
                                        {(() => {
                                            const { marginAmount } = financialUtils.computeProjectMargin(project);
                                            return `$${marginAmount.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}`;
                                        })()}
                                    </div>
                                </div>

                                {/* Manual Invoice Control */}
                                <div className="pt-2 border-t mt-2 flex justify-between items-center">
                                    {/* Export to Expenses Button */}
                                    {(!project.financials?.exported_to_expenses) ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs text-red-500 border-red-200 hover:bg-red-50"
                                            onClick={async () => {
                                                const dynamicCosts = project.financials?.cost_items?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
                                                const totalCost = (project.financials?.supplier_cost || 0) +
                                                    (project.financials?.shipping_cost || 0) +
                                                    (project.financials?.customs_fee || 0) +
                                                    dynamicCosts;

                                                if (totalCost <= 0) {
                                                    alert("No costs to export (Supplier + Shipping + Customs + Cost Items = 0)");
                                                    return;
                                                }

                                                if (confirm(`Export $${totalCost.toLocaleString()} to Expenses?`)) {
                                                    try {
                                                        await apiExpenses.create({
                                                            date: new Date().toISOString().split('T')[0],
                                                            category: 'material',
                                                            amount: totalCost,
                                                            description: `Production Costs: ${project.title}`,
                                                            project_id: project.id,
                                                            status: 'paid'
                                                        });

                                                        // Mark project as exported
                                                        await apiProjects.updateFinancials(project.id, {
                                                            exported_to_expenses: true
                                                        });

                                                        apiActivities.log({
                                                            project_id: project.id,
                                                            user_id: user?.id || 'admin',
                                                            user_name: user?.user_metadata?.full_name || 'Admin User',
                                                            action: 'update',
                                                            details: `Exported $${totalCost.toLocaleString()} to global expenses`
                                                        });

                                                        queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                        queryClient.invalidateQueries({ queryKey: ['expenses'] });
                                                        alert("Exported successfully!");
                                                    } catch (err) {
                                                        alert("Export failed: " + err.message);
                                                    }
                                                }
                                            }}
                                        >
                                            🚀 Send to Expenses
                                        </Button>
                                    ) : (
                                        <div className="text-xs text-zinc-400 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Exported
                                        </div>
                                    )}

                                    {(() => {
                                        const hasInvoice = invoices?.some(i => i.project_id === project.id);
                                        if (!hasInvoice) {
                                            return (
                                                <Button size="sm" variant="outline" className="text-xs" onClick={async () => {
                                                    if (confirm("Create an invoice for this project?")) {
                                                        await apiInvoices.create({
                                                            project_id: project.id,
                                                            amount: project.budget,
                                                            status: 'draft',
                                                            due_date: project.deadline || undefined
                                                        });
                                                        queryClient.invalidateQueries({ queryKey: ['invoices'] });
                                                    }
                                                }}>
                                                    + Create Invoice
                                                </Button>
                                            );
                                        } else {
                                            return <div className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Invoice Created</div>;
                                        }
                                    })()}
                                </div>
                            </div>
                        )}

                        <div className="pt-4">
                            <h4 className="text-sm font-medium mb-2">Description</h4>
                            <p className="text-xs text-muted-foreground">
                                {project.description || "No description provided. Custom design request."}
                            </p>
                        </div>

                        {/* THE VAULT - CONCIERGE DOCUMENT STORAGE */}
                        {(role === 'admin' || role === 'secretary' || (role === 'client' && project.stage_details?.vault_files?.length)) && (
                            <div className="mt-8 pt-8 border-t border-luxury-gold/20">
                                <Card className="glass-card gold-glow-hover border-none bg-white/5 dark:bg-black/20 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-serif text-luxury-gold flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5" /> The Vault
                                        </h3>
                                        <p className="text-[10px] uppercase tracking-widest text-luxury-gold/60">Concierge Document Storage</p>
                                    </div>
                                    {(role === 'admin' || role === 'secretary') && (
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                className="hidden"
                                                multiple
                                                onChange={async (e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    if (files.length === 0) return;

                                                    const uploadedUrls: string[] = [];
                                                    for (const file of files) {
                                                        const path = `vault/${project.id}/${Date.now()}_${file.name}`;
                                                        const { error } = await supabase.storage.from('project-files').upload(path, file);
                                                        if (!error) {
                                                            const { data: { publicUrl } } = supabase.storage.from('project-files').getPublicUrl(path);
                                                            uploadedUrls.push(publicUrl);
                                                        }
                                                    }

                                                    const currentVault = project.stage_details?.vault_files || [];
                                                    await apiProjects.updateDetails(project.id, {
                                                        vault_files: [...currentVault, ...uploadedUrls]
                                                    });
                                                    queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                    toast({ title: "Documents secured in the Vault" });
                                                }}
                                            />
                                            <Button size="sm" variant="outline" className="h-8 border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold hover:text-black transition-all">
                                                <Upload className="w-3 h-3 mr-2" /> Secure Doc
                                            </Button>
                                        </label>
                                    )}
                                </div>

                                {(!project.stage_details?.vault_files || project.stage_details.vault_files.length === 0) ? (
                                    <div className="text-center py-8 bg-zinc-900/20 rounded-lg border border-dashed border-luxury-gold/10 text-muted-foreground text-xs italic">
                                        The vault is currently empty.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {project.stage_details.vault_files.map((fileUrl: string, idx: number) => {
                                            const fileName = decodeURIComponent(fileUrl.split('/').pop() || 'document').replace(/^\d+_/, '');
                                            return (
                                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-luxury-gold/30 transition-all group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded bg-luxury-gold/10 text-luxury-gold">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-white/90 truncate max-w-[150px]">{fileName}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Secured Document</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-luxury-gold hover:text-luxury-gold hover:bg-luxury-gold/10"
                                                            onClick={() => window.open(fileUrl, '_blank')}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        {(role === 'admin' || role === 'secretary') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={async () => {
                                                                    if (confirm("Remove this document from the Vault?")) {
                                                                        const newVault = project.stage_details?.vault_files?.filter((_file: string, i: number) => i !== idx);
                                                                        await apiProjects.updateDetails(project.id, { vault_files: newVault });
                                                                        queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                </Card>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* VERSION HISTORY - Prominent Section Requested by User */}
                {project.stage_details?.design_versions && project.stage_details.design_versions.length > 0 && (
                    <Card className="md:col-span-3 glass-card gold-glow-hover border-none shadow-xl transition-all">
                        <CardHeader className="border-b border-black/5 dark:border-white/5 pb-4 bg-white/50 dark:bg-white/[0.02] flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-luxury-gold font-serif text-lg tracking-wide flex items-center gap-2">
                                    <Clock className="w-5 h-5" /> Design History & Versions
                                </CardTitle>
                                <CardDescription className="text-xs uppercase tracking-widest text-gray-500">Historical iterations and archived design snapshots.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {([...(project.stage_details?.design_versions || [])]).reverse().map((ver, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-white/5 dark:bg-zinc-900/50 border border-black/5 dark:border-white/10 hover:border-luxury-gold/30 transition-all flex flex-col justify-between group/ver">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30">
                                                        v{ver.version_number}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500 uppercase tracking-tight">
                                                        {new Date(ver.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1 items-center">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter font-bold ${ver.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'}`}>
                                                        {ver.status}
                                                    </span>
                                                    {(role === 'admin' || role === 'secretary' || (role === 'client' && ver.status === 'rejected')) && (
                                                        <div className="flex gap-0.5 opacity-0 group-hover/ver:opacity-100 transition-opacity">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-6 w-6 text-gray-400 hover:text-luxury-gold"
                                                                onClick={() => {
                                                                    setModNotes(ver.feedback || '');
                                                                    setEditingModVersion(ver.version_number);
                                                                    setIsModDialogOpen(true);
                                                                }}
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                                                                onClick={() => handleDeleteMod(ver.version_number)}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {ver.notes && <p className="text-xs text-foreground/80 italic leading-relaxed line-clamp-2">"{ver.notes}"</p>}
                                                
                                                {ver.model_link && (
                                                    <a href={ver.model_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors text-xs">
                                                        <LinkIcon className="w-3 h-3" /> <span className="underline">Modèle 3D (CAD)</span>
                                                    </a>
                                                )}

                                                {ver.files && ver.files.length > 0 && (
                                                    <div className="flex gap-2 mt-2">
                                                        {ver.files.slice(0, 3).map((f: string, i: number) => (
                                                            <img 
                                                                key={i} 
                                                                src={f} 
                                                                className="w-10 h-10 object-cover rounded border border-black/5 dark:border-white/10 cursor-pointer hover:scale-105 transition-transform" 
                                                                onClick={() => setPreviewImage(f)}
                                                            />
                                                        ))}
                                                        {ver.files.length > 3 && (
                                                            <div className="w-10 h-10 rounded border border-black/5 dark:border-white/10 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold">
                                                                +{ver.files.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {ver.feedback && (
                                                    <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex items-start gap-2">
                                                        <AlertCircle className="w-3 h-3 text-red-500 mt-0.5" />
                                                        <div className="text-red-500/80 text-[10px] italic font-medium line-clamp-2">Rejet: {ver.feedback}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stage Specific Data Form */}
                <Card className="md:col-span-3 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 shadow-xl group">
                    <CardHeader className="border-b border-black/5 dark:border-white/5 pb-4 bg-white/50 dark:bg-white/[0.02]">
                        <CardTitle className="text-luxury-gold font-serif text-lg tracking-wide">Stage Information: {project.status.replace(/_/g, ' ').toUpperCase()}</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-widest text-gray-500">Update information for the current stage.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {project.status === 'designing' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Design Notes</label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none overflow-hidden"
                                        placeholder="Add notes about sketches, stones, etc."
                                        defaultValue={project.stage_details?.design_notes}
                                        onInput={(e) => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.style.height = 'auto';
                                            target.style.height = `${target.scrollHeight}px`;
                                        }}
                                        onBlur={(e) => apiProjects.updateDetails(project.id, { design_notes: e.target.value })}
                                        ref={(el) => {
                                            if (el) {
                                                el.style.height = 'auto';
                                                el.style.height = `${el.scrollHeight}px`;
                                            }
                                        }}
                                    />
                                    <div className="pt-2">
                                        <label className="text-sm font-medium mb-2 block">Reference Images / Sketches</label>
                                        <div className="flex gap-2 flex-wrap mb-2">
                                            {project.stage_details?.sketch_files?.map((url, i) => (
                                                <div key={i} className="relative group cursor-pointer" onClick={() => setPreviewImage(url)}>
                                                    <img
                                                        src={url}
                                                        className="w-20 h-20 object-cover rounded-md border border-input hover:opacity-80 transition-opacity bg-neutral-100 dark:bg-neutral-800"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/80x80?text=Broken"; }}
                                                    />
                                                    {/* Delete for Sketch */}
                                                    <button
                                                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const current = project.stage_details?.sketch_files || [];
                                                            const newFiles = current.filter((_, idx) => idx !== i);
                                                            apiProjects.updateDetails(project.id, { sketch_files: newFiles })
                                                                .then(() => {
                                                                    apiActivities.log({
                                                                        project_id: project.id,
                                                                        user_id: user?.id || 'admin',
                                                                        user_name: user?.user_metadata?.full_name || 'User',
                                                                        action: 'delete',
                                                                        details: 'Deleted a sketch/reference image'
                                                                    });
                                                                    queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                                    queryClient.invalidateQueries({ queryKey: ['activities', project.id] });
                                                                });
                                                        }}
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {isAddingSketch ? (
                                            <div className="flex gap-2 items-center animate-in fade-in zoom-in-95 duration-200">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    autoFocus
                                                    onChange={(e) => handleImageUpload(e, 'sketch')}
                                                />
                                                <Button size="sm" variant="ghost" className="h-9 px-2" onClick={() => setIsAddingSketch(false)}>
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => setIsAddingSketch(true)}>
                                                + Add Sketch
                                            </Button>
                                        )}
                                        {uploadError && isAddingSketch && <span className="text-xs text-red-500 ml-2">{uploadError}</span>}
                                    </div>
                                </div>
                            )}

                            {project.status !== 'designing' && (
                                <>
                                    {/* Initial Design Reference (Read Only) */}
                                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-md border border-zinc-200 dark:border-zinc-800 mb-6">
                                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Initial Design Brief</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                                                <p className="text-sm whitespace-pre-wrap">{project.stage_details?.design_notes || "No notes provided."}</p>
                                            </div>
                                            {project.stage_details?.sketch_files && project.stage_details.sketch_files.length > 0 && (
                                                <div>
                                                    <label className="text-xs font-medium text-muted-foreground block mb-2">Sketches & Reference</label>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {project.stage_details.sketch_files.map((url, i) => (
                                                            <div key={i} className="cursor-pointer hover:opacity-90" onClick={() => setPreviewImage(url)}>
                                                                <img src={url} className="w-24 h-24 object-cover rounded-md border bg-white" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Model Link (CAD)</label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="https://..."
                                            defaultValue={project.stage_details?.model_link}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (val !== project.stage_details?.model_link) {
                                                    apiProjects.updateDetails(project.id, { model_link: val }).then(() => {
                                                        apiActivities.log({
                                                            project_id: project.id,
                                                            user_id: user?.id || 'admin',
                                                            user_name: user?.user_metadata?.full_name || 'Admin',
                                                            action: 'update',
                                                            details: `Updated CAD Model Link`
                                                        });
                                                        queryClient.invalidateQueries({ queryKey: ['activities', project.id] });
                                                    });
                                                }
                                            }}
                                            readOnly={project.status === 'design_ready'} // Lock during review
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Model Notes</label>
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="Notes on the 3D model..."
                                            defaultValue={project.stage_details?.model_notes}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (val !== project.stage_details?.model_notes) {
                                                    apiProjects.updateDetails(project.id, { model_notes: val }).then(() => {
                                                        apiActivities.log({
                                                            project_id: project.id,
                                                            user_id: user?.id || 'admin',
                                                            user_name: user?.user_metadata?.full_name || 'Admin',
                                                            action: 'update',
                                                            details: `Updated Model Notes`
                                                        });
                                                        queryClient.invalidateQueries({ queryKey: ['activities', project.id] });
                                                    });
                                                }
                                            }}
                                            readOnly={project.status === 'design_ready'}
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <label className="text-sm font-medium mb-2 block">Renderings</label>
                                        {/* Renderings Logic reused */}
                                        <div className="flex gap-2 flex-wrap mb-2">
                                            {project.stage_details?.design_files?.map((url, i) => (
                                                <div key={i} className="relative group cursor-pointer" onClick={() => setPreviewImage(url)}>
                                                    <img
                                                        src={url}
                                                        className="w-20 h-20 object-cover rounded-md border border-input hover:opacity-80 transition-opacity bg-neutral-100 dark:bg-neutral-800"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = "https://placehold.co/80x80?text=Broken";
                                                        }}
                                                    />
                                                    {role !== 'client' && (
                                                        <button
                                                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const current = project.stage_details?.design_files || [];
                                                                const newFiles = current.filter((_, idx) => idx !== i);
                                                                apiProjects.updateDetails(project.id, { design_files: newFiles })
                                                                    .then(() => {
                                                                        apiActivities.log({
                                                                            project_id: project.id,
                                                                            user_id: user?.id || 'admin',
                                                                            user_name: user?.user_metadata?.full_name || 'User',
                                                                            action: 'delete',
                                                                            details: 'Deleted a 3D rendering image'
                                                                        });
                                                                        queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                                        queryClient.invalidateQueries({ queryKey: ['activities', project.id] });
                                                                    });
                                                            }}
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {isAddingRender ? (
                                            <div className="flex gap-2 items-center animate-in fade-in zoom-in-95 duration-200">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                    autoFocus
                                                    onChange={(e) => handleImageUpload(e, 'render')}
                                                // Removed onBlur to prevent hiding input before onChange fires
                                                // Removed onBlur to prevent hiding input before onChange fires
                                                />
                                                <Button size="sm" variant="ghost" className="h-9 px-2" onClick={() => setIsAddingRender(false)}>
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={project.status === 'design_ready'}
                                                    onClick={() => setIsAddingRender(true)}
                                                >
                                                    + Add Render
                                                </Button>
                                                {uploadError && <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">{uploadError}</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Cost Line Items Input */}
                                    {(role === 'manufacturer' || role === 'admin' || role === 'secretary') && (
                                        <div className="space-y-4 border-t pt-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium flex items-center gap-2 text-amber-600">
                                                    <DollarSign className="w-3 h-3" /> Cost Line Items (Internal)
                                                </label>
                                                {!project.financials?.exported_to_expenses && (
                                                    <Button size="sm" variant="outline" onClick={() => {
                                                        const currentItems = project.financials?.cost_items || [];
                                                        const newItems = [...currentItems, { id: crypto.randomUUID(), detail: '', amount: 0 }];
                                                        apiProjects.updateFinancials(project.id, { cost_items: newItems }).then(() => {
                                                            queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                        });
                                                    }}>
                                                        + Add Cost Row
                                                    </Button>
                                                )}
                                            </div>

                                            {project.financials?.cost_items?.map((item, idx) => (
                                                <div key={item.id || idx} className="flex gap-2 items-center">
                                                    <input
                                                        className={`flex-1 h-10 rounded-md border ${project.financials?.exported_to_expenses ? 'border-zinc-200 bg-zinc-100 dark:bg-zinc-900 cursor-not-allowed opacity-75' : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'} px-3 py-2 text-sm`}
                                                        placeholder="Detail (e.g. 14k gold, shipping)"
                                                        defaultValue={item.detail}
                                                        readOnly={!!project.financials?.exported_to_expenses}
                                                        onBlur={(e) => {
                                                            if (project.financials?.exported_to_expenses) return;
                                                            const currentItems = project.financials?.cost_items || [];
                                                            const newItems = [...currentItems];
                                                            if (newItems[idx].detail === e.target.value) return;
                                                            newItems[idx] = { ...newItems[idx], detail: e.target.value };
                                                            apiProjects.updateFinancials(project.id, { cost_items: newItems }).then(() => {
                                                                queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                            });
                                                        }}
                                                    />
                                                    <input
                                                        type="number"
                                                        className={`w-32 h-10 rounded-md border ${project.financials?.exported_to_expenses ? 'border-zinc-200 bg-zinc-100 dark:bg-zinc-900 cursor-not-allowed opacity-75' : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'} px-3 py-2 text-sm text-right font-mono`}
                                                        placeholder="0.00"
                                                        defaultValue={item.amount}
                                                        readOnly={!!project.financials?.exported_to_expenses}
                                                        onBlur={(e) => {
                                                            if (project.financials?.exported_to_expenses) return;
                                                            const currentItems = project.financials?.cost_items || [];
                                                            const newItems = [...currentItems];
                                                            const val = parseFloat(e.target.value) || 0;
                                                            if (newItems[idx].amount === val) return;
                                                            newItems[idx] = { ...newItems[idx], amount: val };
                                                            apiProjects.updateFinancials(project.id, { cost_items: newItems }).then(() => {
                                                                queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                                apiActivities.log({
                                                                    project_id: project.id,
                                                                    user_id: user?.id || 'admin',
                                                                    user_name: user?.user_metadata?.full_name || 'Admin',
                                                                    action: 'update',
                                                                    details: `Updated cost item to $${val.toLocaleString()}`
                                                                });
                                                            });
                                                        }}
                                                    />
                                                    {!project.financials?.exported_to_expenses && (
                                                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 h-10 w-10 shrink-0" onClick={() => {
                                                            if (!window.confirm('Remove this cost item?')) return;
                                                            const currentItems = project.financials?.cost_items || [];
                                                            const newItems = currentItems.filter((_, i) => i !== idx);
                                                            apiProjects.updateFinancials(project.id, { cost_items: newItems }).then(() => {
                                                                queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                            });
                                                        }}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            <p className="text-[10px] text-muted-foreground">{project.financials?.exported_to_expenses ? "Costs locked, already exported to expenses." : "Update production costs at any stage before exporting."}</p>
                                        </div>
                                    )}

                                    {/* SUBMIT BUTTON FOR MANUFACTURER */}
                                    {role === 'manufacturer' && (project.status === '3d_model' || project.status === 'design_modification') && (
                                        <div className="pt-4 border-t space-y-3">
                                            <div className="flex flex-col md:flex-row gap-3">
                                                <Button 
                                                    variant="outline"
                                                    className="flex-1 gap-2 border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10"
                                                    onClick={async () => {
                                                        if (!confirm("This will archive current renders and nodes into a new version history entry. Continue?")) return;
                                                        
                                                        const currentVersions = project.stage_details?.design_versions || [];
                                                        const newVersion = {
                                                            version_number: currentVersions.length + 1,
                                                            created_at: new Date().toISOString(),
                                                            notes: project.stage_details?.model_notes || '',
                                                            files: project.stage_details?.design_files || [],
                                                            model_link: project.stage_details?.model_link || '',
                                                            status: 'submitted' as const
                                                        };

                                                        await apiProjects.updateDetails(project.id, {
                                                            design_versions: [...currentVersions, newVersion],
                                                            // We clear current ones to signify a "new" iteration if desired, 
                                                            // but usually easier to keep them and just update.
                                                            // For now, let's keep them so they don't "disappear" until updated.
                                                        });

                                                        toast({ title: `Version ${newVersion.version_number} archived.` });
                                                        queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                    }}
                                                >
                                                    <Clock className="w-4 h-4" />
                                                    Archive as Version (History)
                                                </Button>

                                                <Button className="flex-1 gap-2 bg-luxury-gold text-black hover:bg-gold-600" onClick={() => handleStatusUpdate('design_ready')}>
                                                    <Send className="w-4 h-4" />
                                                    Submit Final Design
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                                                Archive before marking as 'Design Ready' to keep track of iterations.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {project.status === 'production' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Production / Casting Notes</label>
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="Casting details, stone setting notes..."
                                            defaultValue={project.stage_details?.production_notes}
                                            readOnly={role === 'client'}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (role !== 'client' && val !== project.stage_details?.production_notes) {
                                                    apiProjects.updateDetails(project.id, { production_notes: val }).then(() => {
                                                        apiActivities.log({
                                                            project_id: project.id,
                                                            user_id: user?.id || 'admin',
                                                            user_name: user?.user_metadata?.full_name || 'Admin',
                                                            action: 'update',
                                                            details: `Updated Production Notes`
                                                        });
                                                        queryClient.invalidateQueries({ queryKey: ['activities', project.id] });
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                    {/* ... rest of production view ... */}
                                </div>
                            )}

                            {project.status === 'delivery' && (
                                <div className="space-y-4">
                                    {/* ... delivery view ... */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Tracking Number</label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="FedEx / DHL Tracking"
                                            defaultValue={project.stage_details?.tracking_number}
                                            readOnly={role === 'client'}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (role !== 'client' && val !== project.stage_details?.tracking_number) {
                                                    apiProjects.updateDetails(project.id, { tracking_number: val }).then(() => {
                                                        apiActivities.log({
                                                            project_id: project.id,
                                                            user_id: user?.id || 'admin',
                                                            user_name: user?.user_metadata?.full_name || 'Admin',
                                                            action: 'update',
                                                            details: `Added/Updated tracking number: ${val}`
                                                        });
                                                        if (project.client_id && val) {
                                                            apiNotifications.create({
                                                                user_id: project.client_id,
                                                                title: 'Project Shipped!',
                                                                message: `A tracking number (${val}) has been added to your project "${project.title}".`,
                                                                type: 'success',
                                                                link: `/dashboard/projects/${project.id}`
                                                            });
                                                        }
                                                        queryClient.invalidateQueries({ queryKey: ['activities', project.id] });
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground italic mt-4">Changes save automatically when you click outside the field.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <ImagePreviewModal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                imageUrl={previewImage}
            />

            <Dialog open={isModDialogOpen} onOpenChange={setIsModDialogOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border border-luxury-gold/20 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif text-luxury-gold flex items-center gap-2">
                            <Pencil className="w-5 h-5" />
                            {editingModVersion ? "Edit Modification Request" : "Request Design Changes"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {editingModVersion 
                                ? "Update your feedback for this design iteration." 
                                : "Describe exactly what you would like to change. The current design will be archived automatically."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <Textarea 
                            placeholder="Example: Make the band slightly thinner, or change the center stone to a square cut..."
                            className="min-h-[120px] bg-neutral-50 dark:bg-zinc-900/50 border-input focus:ring-luxury-gold"
                            value={modNotes}
                            onChange={(e) => setModNotes(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="flex gap-2 sm:justify-end">
                        <Button variant="ghost" onClick={() => setIsModDialogOpen(false)} className="hover:bg-neutral-100 dark:hover:bg-zinc-800">
                            Cancel
                        </Button>
                        <Button 
                            className="bg-luxury-gold text-black hover:bg-gold-600 transition-all shadow-lg"
                            onClick={handleSubmitModification}
                            disabled={!modNotes.trim()}
                        >
                            {editingModVersion ? "Save Changes" : "Submit Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
