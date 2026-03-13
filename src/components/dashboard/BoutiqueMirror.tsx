import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiStories, WIPStory } from '@/services/apiStories';
import { apiProjects } from '@/services/apiProjects';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Eye, EyeOff, Trash2, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

export const BoutiqueMirror: React.FC = () => {
    const { role, user } = useAuth();
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedProject, setSelectedProject] = useState('');

    const { data: stories, isLoading } = useQuery({
        queryKey: ['wip_stories'],
        queryFn: apiStories.getAll
    });

    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll,
        enabled: role === 'manufacturer' || role === 'admin'
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedProject) {
            if (!selectedProject) toast({ title: "Select a project first", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `wip-stories/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('project-files')
                .getPublicUrl(filePath);

            await apiStories.create({
                project_id: selectedProject,
                manufacturer_id: user?.id,
                image_url: publicUrl,
                is_client_visible: false, // Default to hidden, admin must approve
                caption: 'Workshop WIP'
            });

            toast({ title: "Story uploaded! Awaiting admin approval." });
            queryClient.invalidateQueries({ queryKey: ['wip_stories'] });
        } catch (error: any) {
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const toggleVisibility = async (story: WIPStory) => {
        await apiStories.updateVisibility(story.id, !story.is_client_visible);
        queryClient.invalidateQueries({ queryKey: ['wip_stories'] });
    };

    const deleteStory = async (id: string) => {
        if (!confirm("Delete this story?")) return;
        await apiStories.delete(id);
        queryClient.invalidateQueries({ queryKey: ['wip_stories'] });
    };

    if (isLoading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-luxury-gold" /></div>;

    return (
        <Card className="p-6 glass-card overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-serif font-bold text-luxury-gold flex items-center gap-2">
                        <Camera className="w-5 h-5" /> Boutique Mirror
                    </h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Live Workshop Feed</p>
                </div>

                {role === 'manufacturer' && (
                    <div className="flex items-center gap-2">
                        <select 
                            className="text-xs border rounded p-1 bg-transparent"
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                        >
                            <option value="">Project...</option>
                            {projects?.filter(p => p.status === 'production').map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        <label className="cursor-pointer">
                            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                            <Button size="sm" variant="outline" className="h-8 gap-2" disabled={isUploading}>
                                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                Post WIP
                            </Button>
                        </label>
                    </div>
                )}
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                {stories?.length === 0 && (
                    <div className="w-full text-center py-12 text-muted-foreground text-sm italic">
                        No recent workshop updates.
                    </div>
                )}
                {stories?.map((story) => (
                    <div key={story.id} className="relative shrink-0 w-48 aspect-[3/4] rounded-xl overflow-hidden group snap-start border border-luxury-gold/10">
                        <img 
                            src={story.image_url} 
                            alt="WIP" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-[10px] text-white/70 truncate">{story.project?.title}</p>
                            <p className="text-[10px] text-luxury-gold font-medium">By {story.manufacturer?.full_name}</p>
                        </div>

                        {/* Admin Controls */}
                        {(role === 'admin' || role === 'secretary') && (
                            <div className="absolute top-2 right-2 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
                                <Button 
                                    size="icon" 
                                    variant="secondary" 
                                    className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border-0 text-white hover:bg-luxury-gold hover:text-black"
                                    onClick={() => toggleVisibility(story)}
                                >
                                    {story.is_client_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </Button>
                                <Button 
                                    size="icon" 
                                    variant="destructive" 
                                    className="h-8 w-8 rounded-full bg-red-500/80 backdrop-blur-md border-0 text-white"
                                    onClick={() => deleteStory(story.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-2 left-2">
                            <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${story.is_client_visible ? 'bg-green-500/80 text-white' : 'bg-amber-500/80 text-white'}`}>
                                {story.is_client_visible ? 'Live' : 'Pending'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};
