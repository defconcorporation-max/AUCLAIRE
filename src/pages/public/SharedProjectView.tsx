import { Project } from '@/services/apiProjects';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiProjects } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
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
                        <Badge variant="outline" className="text-xs font-mono">ID: {project.id.slice(0, 8)}</Badge>
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4" /> Usage Specifications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-zinc-500 block">Required Size</span>
                                        <span className="font-medium">{details.finger_size || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block">Metal Type</span>
                                        <span className="font-medium">{details.metal_type || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block">Center Stone</span>
                                        <span className="font-medium">{details.gem_type || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block">Stone Shape</span>
                                        <span className="font-medium">{details.stone_shape || '-'}</span>
                                    </div>
                                </div>
                                {details.model_notes && (
                                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-md text-sm mt-4">
                                        <span className="font-semibold block mb-1">Notes:</span>
                                        {details.model_notes}
                                    </div>
                                )}
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




