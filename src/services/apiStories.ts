import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

export interface WIPStory {
    id: string;
    project_id: string;
    manufacturer_id: string;
    image_url: string;
    caption?: string;
    is_client_visible: boolean;
    created_at: string;
    project?: { title: string };
    manufacturer?: { full_name: string };
}

export const apiStories = {
    async getAll() {
        const { data, error } = await supabase
            .from('wip_stories')
            .select('*, project:projects(title), manufacturer:profiles!wip_stories_manufacturer_id_fkey(full_name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching WIP stories:", error);
            throw error;
        }
        return data as WIPStory[];
    },

    async getByProject(projectId: string) {
        const { data, error } = await supabase
            .from('wip_stories')
            .select('*, project:projects(title), manufacturer:profiles!wip_stories_manufacturer_id_fkey(full_name)')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching project WIP stories:", error);
            throw error;
        }
        return data as WIPStory[];
    },

    async getClientStories(projectId: string) {
        const { data, error } = await supabase
            .from('wip_stories')
            .select('*, project:projects(title), manufacturer:profiles!wip_stories_manufacturer_id_fkey(full_name)')
            .eq('project_id', projectId)
            .eq('is_client_visible', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching client WIP stories:", error);
            throw error;
        }
        return data as WIPStory[];
    },

    async create(story: Partial<WIPStory>) {
        const { data, error } = await supabase
            .from('wip_stories')
            .insert(story)
            .select()
            .single();

        if (error) {
            toast({ title: 'Error uploading story', description: error.message, variant: 'destructive' });
            throw error;
        }
        return data;
    },

    async updateVisibility(id: string, isVisible: boolean) {
        const { data, error } = await supabase
            .from('wip_stories')
            .update({ is_client_visible: isVisible })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            toast({ title: 'Error updating visibility', description: error.message, variant: 'destructive' });
            throw error;
        }
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('wip_stories')
            .delete()
            .eq('id', id);

        if (error) {
            toast({ title: 'Error deleting story', description: error.message, variant: 'destructive' });
            throw error;
        }
    }
};
