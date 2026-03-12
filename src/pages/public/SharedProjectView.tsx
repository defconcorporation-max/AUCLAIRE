import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiProjects } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle, FileText, PenTool, Box, ThumbsUp, Hammer, Truck, Sparkles, Clock } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';

// Reuse file compression helper or import it if shared
export default function SharedProjectView() {
    const { token } = useParams<{ token: string }>();
const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { data: project, isLoading, error } = useQuery({
        queryKey: ['shared-project', token],
        queryFn: () => apiProjects.getByToken(token!),
        enabled: !!token
    });

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-luxury-gold" /></div>;
    if (error || !project) return <div className="flex h-screen items-center justify-center flex-col gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-2xl font-bold">Invalid or Expired Link</h1>
        <p className="text-zinc-500">Please contact the administrator for a new link.</p>
    </div>;

    const details = (project.stage_details || {}) as any;
const images = details.design_files || [];











    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-serif text-luxury-gold">{project.title}</h1>
                            <StatusBadge status={project.status} />
                        </div>
                        <p className="text-zinc-500 mt-2 max-w-xl">{project.description || "No description provided."}</p>
                    </div>
                    <div className="text-right">
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors text-foreground text-xs font-mono">
                            ID: {project.id.slice(0, 8)}
                        </div>
                        {project.deadline && (
                            <div className="text-sm text-red-500 mt-1 font-medium">
                                Deadline: {new Date(project.deadline).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Specifications */}
                    <div className="space-y-6">
                        {/* Project Timeline Tracker */}
                        <Card className="bg-gradient-to-br from-black to-zinc-950 border-luxury-gold/20 shadow-lg shadow-luxury-gold/5 overflow-hidden">
                            <CardHeader className="border-b border-luxury-gold/10 bg-white/5 pb-4">
                                <CardTitle className="flex items-center gap-2 text-luxury-gold">
                                    <Sparkles className="w-4 h-4" /> Project Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 pb-8">
                                <div className="relative">
                                    {/* Vertical line connecting steps */}
                                    <div className="absolute left-6 top-4 bottom-4 w-px bg-zinc-800" />
                                    
                                    <div className="space-y-6">
                                        {[
                                            { id: 'designing', label: 'Initial Design', desc: 'Crafting the concept', icon: PenTool },
                                            { id: '3d_model', label: '3D Modeling', desc: 'Building the digital model', icon: Box },
                                            { id: 'design_ready', label: 'Renders Ready', desc: '3D designs ready for review', icon: Sparkles },
                                            { id: 'waiting_for_approval', label: 'Waiting Approval', desc: 'Awaiting client confirmation', icon: Clock },
                                            { id: 'design_modification', label: 'Modifying', desc: 'Refining design based on feedback', icon: PenTool },
                                            { id: 'approved_for_production', label: 'Approved', desc: 'Confirmed for manufacturing', icon: ThumbsUp },
                                            { id: 'production', label: 'In Production', desc: 'Casting and polishing your piece', icon: Hammer },
                                            { id: 'delivery', label: 'Ready for Delivery', desc: 'Quality checked and shipping', icon: Truck },
                                            { id: 'completed', label: 'Completed', desc: 'Delivered successfully', icon: Sparkles }
                                        ].map((step, index, array) => {
                                            const statuses = array.map(s => s.id);
                                            const currentIndex = statuses.indexOf(project.status || 'designing');
                                            const isCompleted = index < currentIndex;
                                            const isCurrent = index === currentIndex;
                                            const isPending = index > currentIndex;

                                            return (
                                                <div key={step.id} className={`relative flex items-center gap-4 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                                                    <div className={`
                                                        relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                                        ${isCompleted ? 'bg-luxury-gold border-luxury-gold text-black' : ''}
                                                        ${isCurrent ? 'bg-black border-luxury-gold text-luxury-gold shadow-[0_0_15px_rgba(210,181,123,0.3)]' : ''}
                                                        ${isPending ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : ''}
                                                    `}>
                                                        <step.icon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className={`font-medium ${isCurrent ? 'text-luxury-gold' : isCompleted ? 'text-zinc-200' : 'text-zinc-500'}`}>
                                                            {step.label}
                                                        </h4>
                                                        <p className="text-xs text-zinc-500 mt-0.5">{step.desc}</p>
                                                    </div>
                                                    {isCurrent && (
                                                        <div className="inline-flex items-center rounded-full font-semibold transition-colors px-2.5 py-0.5 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 uppercase text-[10px] tracking-wider">
                                                            Current Phase
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Initial Design Brief */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4" /> Initial Design Brief</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <span className="text-zinc-500 block text-xs font-bold uppercase tracking-wider mb-2">Instructions / Notes</span>
                                    <div className="text-sm refresh-pre-wrap whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-900 p-3 rounded-md border border-zinc-100 dark:border-zinc-800">
                                        {details.design_notes || "No design notes provided."}
                                    </div>
                                </div>

                                {details.sketch_files && details.sketch_files.length > 0 && (
                                    <div>
                                        <span className="text-zinc-500 block text-xs font-bold uppercase tracking-wider mb-2">Reference Images</span>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {details.sketch_files.map((url: string, i: number) => (
                                                <div key={i} className="relative aspect-square rounded-md overflow-hidden border bg-zinc-100">
                                                    <img src={url} alt={`Sketch ${i}`} className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => setPreviewUrl(url)} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Client Portal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
<p className="text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-md">You are viewing a read-only snapshot of your project. For any changes, please contact your representative.</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Files & Renders */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Design Renders</div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {images.map((img: string, idx: number) => (
                                        <div key={idx} className="relative aspect-square rounded-md overflow-hidden border bg-zinc-100">
                                            <img src={img} alt={`Render ${idx}`} className="w-full h-full object-cover cursor-pointer hover:opacity-90" onClick={() => setPreviewUrl(img)} />
                                        </div>
                                    ))}
                                    {images.length === 0 && (
                                        <div className="col-span-2 py-8 text-center text-zinc-400 text-sm border-2 border-dashed rounded-md">
                                            No files uploaded yet.
                                        </div>
                                    )}
                                </div>


                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <ImagePreviewModal
                isOpen={!!previewUrl}
                imageUrl={previewUrl}
                onClose={() => setPreviewUrl(null)}
                title="Project Design Preview"
            />
        </div>
    );
}





