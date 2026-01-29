import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiProjects } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Save, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';

// Reuse file compression helper or import it if shared
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
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
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
        };
        reader.onerror = (err) => reject(err);
    });
};

export default function SharedProjectView() {
    const { token } = useParams<{ token: string }>();
    const queryClient = useQueryClient();
    const [manufacturingCost, setManufacturingCost] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    const { data: project, isLoading, error } = useQuery({
        queryKey: ['shared-project', token],
        queryFn: () => apiProjects.getByToken(token!),
        enabled: !!token
    });

    const updateProjectMutation = useMutation({
        mutationFn: (updates: { stage_details: any, financials: any, status: string }) =>
            apiProjects.updateByToken(token!, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shared-project', token] });
            alert("Project updated successfully");
            setIsThinking(false);
        },
        onError: () => {
            alert("Failed to update project");
            setIsThinking(false);
        }
    });

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-luxury-gold" /></div>;
    if (error || !project) return <div className="flex h-screen items-center justify-center flex-col gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-2xl font-bold">Invalid or Expired Link</h1>
        <p className="text-zinc-500">Please contact the administrator for a new link.</p>
    </div>;

    const details = (project.stage_details || {}) as any;
    const financials = (project.financials || {}) as any;
    const images = details.design_files || [];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsThinking(true);
        try {
            const dataUrl = await compressImage(file);
            const newImages = [...images, dataUrl];

            updateProjectMutation.mutate({
                stage_details: { ...details, design_files: newImages },
                financials: financials,
                status: project.status
            });
        } catch (err) {
            console.error(err);
            setIsThinking(false);
            alert("Failed to process image");
        }
    };

    const handleSaveCost = () => {
        if (!manufacturingCost) return;
        setIsThinking(true);
        updateProjectMutation.mutate({
            stage_details: details,
            financials: { ...financials, supplier_cost: parseFloat(manufacturingCost) },
            status: project.status
        });
    };

    const handleSubmitDesign = () => {
        if (confirm("Submit design for review?")) {
            setIsThinking(true);
            updateProjectMutation.mutate({
                stage_details: details,
                financials: financials,
                status: 'design_ready'
            });
        }
    };

    const handleStartProduction = () => {
        if (confirm("Confirm start of production?")) {
            setIsThinking(true);
            updateProjectMutation.mutate({
                stage_details: details,
                financials: financials,
                status: 'production'
            });
        }
    };

    const handleFinishProduction = () => {
        if (confirm("Confirm production complete?")) {
            setIsThinking(true);
            updateProjectMutation.mutate({
                stage_details: details,
                financials: financials,
                status: 'delivery'
            });
        }
    };

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

                        {/* Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Production Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {project.status === 'designing' && (
                                    <Button onClick={handleSubmitDesign} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isThinking}>
                                        Submit Design for Review
                                    </Button>
                                )}
                                {project.status === 'approved_for_production' && (
                                    <Button onClick={handleStartProduction} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isThinking}>
                                        Start Production
                                    </Button>
                                )}
                                {project.status === 'production' && (
                                    <Button onClick={handleFinishProduction} className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isThinking}>
                                        Mark as Completed (Ready for Delivery)
                                    </Button>
                                )}

                                <div className="pt-4 border-t">
                                    <label className="text-sm font-medium mb-1.5 block">Update Manufacturing Cost</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-2.5 top-2.5 text-zinc-500">$</span>
                                            <Input
                                                type="number"
                                                placeholder={financials.supplier_cost?.toString() || "0.00"}
                                                className="pl-7"
                                                value={manufacturingCost}
                                                onChange={(e) => setManufacturingCost(e.target.value)}
                                            />
                                        </div>
                                        <Button size="icon" onClick={handleSaveCost} disabled={!manufacturingCost || isThinking}>
                                            <Save className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {financials.supplier_cost && (
                                        <p className="text-xs text-zinc-500 mt-1">Current recorded cost: ${financials.supplier_cost}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Files & Renders */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><Upload className="w-4 h-4" /> Design Files</div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {images.map((img: string, idx: number) => (
                                        <div key={idx} className="relative aspect-square rounded-md overflow-hidden border bg-zinc-100">
                                            <img src={img} alt={`Render ${idx}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    {images.length === 0 && (
                                        <div className="col-span-2 py-8 text-center text-zinc-400 text-sm border-2 border-dashed rounded-md">
                                            No files uploaded yet.
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileUpload}
                                        disabled={isThinking}
                                    />
                                    <Button variant="outline" className="w-full border-dashed" disabled={isThinking}>
                                        {isThinking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                        Upload New Render / Photo
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
