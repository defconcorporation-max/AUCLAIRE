import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiProjects, ProjectStatus } from '@/services/apiProjects';
import { apiInvoices } from '@/services/apiInvoices';
import { apiClients } from '@/services/apiClients';
import { apiNotifications } from '@/services/apiNotifications';
import { apiAffiliates } from '@/services/apiAffiliates';
import { apiActivities } from '@/services/apiActivities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityLogList } from '@/components/ActivityLogList';
import {
    ArrowLeft,
    User,
    DollarSign,
    Clock,
    Shield,
    XCircle,
    Send,
    Factory,
    CheckCircle2,
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    Pencil,
    Save,
    X,
    Trash2,
    Handshake
} from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';

// Helper to resize/compress image to save LocalStorage space
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600; // Stricter limit for LocalStorage
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Compress to JPEG 0.6 and reduced size
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

                // Validate
                if (dataUrl.length < 100 || !dataUrl.startsWith('data:image/')) {
                    reject(new Error("Compression failed: Invalid data URL"));
                    return;
                }

                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export default function ProjectDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { role } = useAuth(); // Get current role
    const [isAddingRender, setIsAddingRender] = useState(false);
    const [isAddingSketch, setIsAddingSketch] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [isEditingAffiliate, setIsEditingAffiliate] = useState(false);
    const [selectedAffiliateId, setSelectedAffiliateId] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [isSharing, setIsSharing] = useState(false);

    const handleShareProject = async () => {
        if (!projects || projects.length === 0) return;
        // In this component, we fetch ALL projects. We need to find the specific one.
        const project = projects.find(p => p.id === id);

        if (!project) return;

        setIsSharing(true);
        try {
            // Check if token exists on the object. If not, we might need to refresh or the DB trigger/default hasn't run.
            // But since we selected all columns, if the column exists, we have it.
            // For older projects, it might be null if we didn't backfill.
            // The SQL I wrote ADDS the column with DEFAULT uuid_generate_v4(), so it SHOULD backfill.

            // NOTE: We need to augment the Project interface in the frontend to know about 'share_token'
            const token = (project as any).share_token;

            if (!token) {
                alert("Share token missing. Please refresh or contact admin.");
                return;
            }

            const shareUrl = `${window.location.origin}/shared/${token}`;
            await navigator.clipboard.writeText(shareUrl);
            alert("Manufacturer Link copied to clipboard!");
        } catch (err) {
            console.error(err);
            alert("Failed to copy link");
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

    const { data: invoices } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll
    });

    const project = projects?.find(p => p.id === id) || projects?.[0]; // Fallback for demo

    if (!project) return <div>Project not found</div>;

    const handleStatusUpdate = (status: ProjectStatus) => {
        apiProjects.updateStatus(project.id, status)
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['projects'] });
            });
    };

    // Helper to check active status for timeline
    const isStepActive = (stepStatus: string) => {
        const statuses = ['designing', 'design_ready', 'design_modification', '3d_model', 'production', 'delivery', 'completed'];
        const currentIndex = statuses.indexOf(project.status === 'design_ready' || project.status === 'design_modification' ? '3d_model' : project.status);
        const stepIndex = statuses.indexOf(stepStatus);

        // Custom logic for parallel/looping design states
        if (stepStatus === '3d_model' && (project.status === 'design_ready' || project.status === 'design_modification')) return true;

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
            const compressedBase64 = await compressImage(file);

            if (type === 'sketch') {
                const current = project.stage_details?.sketch_files || [];
                await apiProjects.updateDetails(project.id, { sketch_files: [...current, compressedBase64] });
                setIsAddingSketch(false);
            } else {
                const current = project.stage_details?.design_files || [];
                await apiProjects.updateDetails(project.id, { design_files: [...current, compressedBase64] });
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        {role === 'admin' && (
                            <Button variant="outline" size="sm" onClick={handleShareProject} disabled={isSharing} className="gap-2 text-luxury-gold border-luxury-gold/50 hover:bg-luxury-gold/10">
                                <Send className="w-4 h-4" />
                                {isSharing ? "Copying..." : "Share Link"}
                            </Button>
                        )}
                        {(role === 'admin' || role === 'sales') && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditingClient(true)} className="gap-2">
                                <Pencil className="w-4 h-4" />
                                Edit Client
                            </Button>
                        )}
                        <h1 className="text-2xl font-serif font-bold text-luxury-gold">{project.title}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-3 h-3" />
                            {!isEditingClient ? (
                                <div className="flex items-center gap-2">
                                    <span>Client: {project.client?.full_name}</span>
                                    {(role === 'admin' || role === 'sales') && (
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
                                        {clients?.map((client: any) => (
                                            <option key={client.id} value={client.id}>{client.full_name}</option>
                                        ))}
                                    </select>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={() => {
                                        apiProjects.update(project.id, { client_id: selectedClientId })
                                            .then(() => {
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
                {role === 'admin' && (
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={async () => {
                        if (confirm("DELETE PROJECT? This action cannot be undone.")) {
                            await apiProjects.delete(project.id);
                            navigate('/dashboard');
                        }
                    }}>
                        <Trash2 className="w-5 h-5" />
                    </Button>
                )}
            </div>
            <div className="ml-auto flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground mr-2">Status:</span>
                <select
                    className="h-8 px-2 rounded-md border border-input bg-background text-sm capitalize"
                    value={project.status}
                    onChange={(e) => {
                        const newStatus = e.target.value as ProjectStatus;
                        handleStatusUpdate(newStatus);
                        apiActivities.log({
                            project_id: project.id,
                            user_id: 'admin', // Mock User ID
                            user_name: 'Admin User',
                            action: 'status_change',
                            details: `Changed status from ${project.status} to ${newStatus}`
                        });
                    }}
                    disabled={role === 'client'} // Clients shouldn't manually update status
                >
                    <option value="designing">Designing</option>
                    <option value="3d_model">3D Model</option>
                    <option value="design_ready">Design Ready (Review)</option>
                    <option value="design_modification">Mod Requested</option>
                    <option value="production">Production</option>
                    <option value="approved_for_production">Approved (Pending Prod)</option>
                    <option value="delivery">Delivery</option>
                    <option value="completed">Completed</option>
                </select>
            </div>


            {/* Approval Banners */}
            {
                project.status === 'design_ready' && role === 'admin' && (
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
                            <Button variant="outline" className="border-red-200 hover:bg-red-50 text-red-600" onClick={() => handleStatusUpdate('design_modification')}>
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
                project.status === 'approved_for_production' && role === 'admin' && (
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
            {
                project.status === 'design_ready' && role === 'client' && (
                    <Card className="border-l-4 border-l-luxury-gold bg-amber-50/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-luxury-gold" />
                                Design Approval Required
                            </CardTitle>
                            <CardDescription>Your custom design is ready for review! Please leave feedback or approve it for production.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                        const notes = prompt("Please describe what changes you would like:");
                                        if (notes) {
                                            apiProjects.updateDetails(project.id, {
                                                client_approval_status: 'changes_requested',
                                                client_notes: notes
                                            }).then(() => queryClient.invalidateQueries({ queryKey: ['projects'] }));
                                        }
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
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                            <TabsTrigger value="activity">Activity Log</TabsTrigger>
                        </TabsList>
                        <TabsContent value="timeline">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Project Timeline</CardTitle>
                                    <CardDescription>Design & Manufacturing Progress</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* Mock Timeline Visual */}
                                    <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-4 space-y-8 pb-4">
                                        {[
                                            { status: 'designing', label: 'Initial Design', date: project.created_at, active: true },
                                            { status: '3d_model', label: '3D Modeling', date: 'In Progress', active: isStepActive('3d_model') },
                                            { status: 'production', label: 'Production', date: 'TBD', active: ['production', 'delivery', 'completed'].includes(project.status) },
                                            { status: 'delivery', label: 'Final QC & Delivery', date: project.deadline, active: ['delivery', 'completed'].includes(project.status) },
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
                    </Tabs>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Affiliate Section */}
                        {(role === 'admin' || role === 'sales' || project.affiliate_id) && (
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Handshake className="w-3 h-3" /> Ambassador
                                </span>
                                {!isEditingAffiliate ? (
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{project.affiliate?.full_name || 'None'}</span>
                                        {(role === 'admin') && (
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
                                            const updates: any = { affiliate_id: selectedAffiliateId || null };
                                            if (affiliate) {
                                                updates.affiliate_commission_rate = affiliate.commission_rate;
                                                updates.affiliate_commission_type = affiliate.commission_type;
                                            }

                                            apiProjects.update(project.id, updates)
                                                .then(() => {
                                                    queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                    setIsEditingAffiliate(false);
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
                        )}
                        {/* Budget & Profit - Hidden for Clients & Suppliers (partially) */}

                        {role !== 'client' && role !== 'manufacturer' && (
                            <>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="w-3 h-3" /> Sale Price</span>
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
                                                            user_id: 'admin',
                                                            user_name: 'Admin User',
                                                            action: 'update',
                                                            details: `Updated Sale Price to $${val}`
                                                        });
                                                        queryClient.invalidateQueries({ queryKey: ['projects'] });
                                                        queryClient.invalidateQueries({ queryKey: ['activities', project.id] });
                                                    });
                                            }
                                        }}
                                    />
                                </div>
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
                                                        .then(() => queryClient.invalidateQueries({ queryKey: ['projects'] }));
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-bold">
                                        <span>Balance Due</span>
                                        <span className={(project.budget || 0) - (project.financials?.paid_amount || 0) > 0 ? "text-red-500" : "text-green-600"}>
                                            ${((project.budget || 0) - (project.financials?.paid_amount || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-500"
                                            style={{ width: `${Math.min(100, ((project.financials?.paid_amount || 0) / (project.budget || 1)) * 100)}%` }}
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

                        {/* Admin Financials */}
                        {role === 'admin' && (
                            <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-md space-y-2">
                                <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Admin Financials
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>Supplier Cost:</div>
                                    <div className="font-mono text-right text-red-500">-${project.financials?.supplier_cost || 0}</div>

                                    <div>Shipping/Customs:</div>
                                    <div className="font-mono text-right text-red-500">-${(project.financials?.shipping_cost || 0) + (project.financials?.customs_fee || 0)}</div>

                                    {/* Commission Display */}
                                    {project.affiliate_id && (
                                        <>
                                            <div>Commission ({project.affiliate_commission_type === 'fixed' ? 'Fixed' : `${project.affiliate_commission_rate}%`}):</div>
                                            <div className="font-mono text-right text-red-500">
                                                -${(() => {
                                                    if (project.affiliate_commission_type === 'fixed') return Number(project.affiliate_commission_rate || 0);
                                                    return ((project.budget || 0) * (Number(project.affiliate_commission_rate) || 0) / 100);
                                                })().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </>
                                    )}

                                    <div className="border-t pt-1 font-bold">Net Profit:</div>
                                    <div className={`border-t pt-1 font-mono text-right font-bold ${(project.budget || 0) - (project.financials?.supplier_cost || 0) - (project.financials?.shipping_cost || 0) - (project.financials?.customs_fee || 0) - (project.affiliate_id ? (project.affiliate_commission_type === 'fixed' ? Number(project.affiliate_commission_rate || 0) : ((project.budget || 0) * (Number(project.affiliate_commission_rate) || 0) / 100)) : 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ${((project.budget || 0) -
                                            (project.financials?.supplier_cost || 0) -
                                            (project.financials?.shipping_cost || 0) -
                                            (project.financials?.customs_fee || 0) -
                                            (project.affiliate_id ? (project.affiliate_commission_type === 'fixed' ? Number(project.affiliate_commission_rate || 0) : ((project.budget || 0) * (Number(project.affiliate_commission_rate) || 0) / 100)) : 0)
                                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>

                                {/* Manual Invoice Control */}
                                <div className="pt-2 border-t mt-2 flex justify-end">
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
                    </CardContent>
                </Card>

                {/* Stage Specific Data Form */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Stage Information: {project.status.replace('_', ' ').toUpperCase()}</CardTitle>
                        <CardDescription>Update information for the current stage.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {project.status === 'designing' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Design Notes</label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="Add notes about sketches, stones, etc."
                                        defaultValue={project.stage_details?.design_notes}
                                        onBlur={(e) => apiProjects.updateDetails(project.id, { design_notes: e.target.value })}
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
                                                                .then(() => queryClient.invalidateQueries({ queryKey: ['projects'] }));
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

                            {(project.status === '3d_model' || project.status === 'design_ready' || project.status === 'design_modification' || project.status === 'approved_for_production') && (
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

                                    {/* Version History */}
                                    {project.stage_details?.design_versions && project.stage_details.design_versions.length > 0 && (
                                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-md p-3 bg-zinc-50 dark:bg-zinc-900 mb-4">
                                            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                < Clock className="w-3 h-3" /> Previous Versions
                                            </h5>
                                            <div className="space-y-2">
                                                {project.stage_details.design_versions.map((ver, idx) => (
                                                    <div key={idx} className="text-xs p-2 bg-white dark:bg-zinc-950 border rounded-sm">
                                                        <div className="flex justify-between font-medium">
                                                            <span>Version {ver.version_number}</span>
                                                            <span className="text-muted-foreground">{new Date(ver.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        {ver.model_link && (
                                                            <a href={ver.model_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block mt-1 truncate">
                                                                CAD: {ver.model_link}
                                                            </a>
                                                        )}
                                                        <p className="text-muted-foreground mt-1 text-[10px]">Notes: {ver.notes}</p>
                                                        <div className="mt-1 pt-1 border-t border-zinc-100 dark:border-zinc-800 text-amber-600 font-medium">
                                                            Feedback: {ver.feedback}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Model Link (CAD)</label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="https://..."
                                            defaultValue={project.stage_details?.model_link}
                                            onBlur={(e) => apiProjects.updateDetails(project.id, { model_link: e.target.value })}
                                            readOnly={project.status === 'design_ready'} // Lock during review
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Model Notes</label>
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="Notes on the 3D model..."
                                            defaultValue={project.stage_details?.model_notes}
                                            onBlur={(e) => apiProjects.updateDetails(project.id, { model_notes: e.target.value })}
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
                                                                    .then(() => queryClient.invalidateQueries({ queryKey: ['projects'] }));
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

                                    {/* Supplier Cost Input */}
                                    {(role === 'manufacturer' || role === 'admin') && (
                                        <div className="space-y-2 border-t pt-4">
                                            <label className="text-sm font-medium flex items-center gap-2 text-amber-600"><DollarSign className="w-3 h-3" /> Manufacturing Cost (Internal)</label>
                                            <input
                                                type="number"
                                                className="flex h-10 w-full rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-sm"
                                                placeholder="0.00"
                                                defaultValue={project.financials?.supplier_cost}
                                                onBlur={(e) => apiProjects.updateFinancials(project.id, { supplier_cost: parseFloat(e.target.value) }).then(() => queryClient.invalidateQueries({ queryKey: ['projects'] }))}
                                                readOnly={project.status === 'design_ready'}
                                            />
                                            <p className="text-[10px] text-muted-foreground">Estimate production cost at this stage.</p>
                                        </div>
                                    )}

                                    {/* SUBMIT BUTTON FOR MANUFACTURER */}
                                    {role === 'manufacturer' && project.status !== 'design_ready' && (
                                        <div className="pt-4 border-t flex justify-end">
                                            <Button className="w-full md:w-auto gap-2" size="lg" onClick={() => handleStatusUpdate('design_ready')}>
                                                <Send className="w-4 h-4" />
                                                Submit Design for Approval
                                            </Button>
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
                                            onBlur={(e) => role !== 'client' && apiProjects.updateDetails(project.id, { production_notes: e.target.value })}
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
                                            onBlur={(e) => role !== 'client' && apiProjects.updateDetails(project.id, { tracking_number: e.target.value })}
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
        </div >
    );
}
