import { supabase } from '@/lib/supabase';

export interface Task {
    id: string;
    ghl_id?: string;
    title: string;
    description?: string;
    status: 'pending' | 'completed' | 'in_progress' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    due_date?: string;
    assigned_to?: string;
    contact_id?: string;
    project_id?: string;
    metadata?: any;
    created_at: string;
    updated_at: string;
    // Joined data
    assigned_to_profile?: { full_name: string; email: string };
    client?: { full_name: string };
    project?: { title: string };
}

export const apiTasks = {
    async getAll() {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name, email),
                client:clients(full_name),
                project:projects(title)
            `)
            .order('due_date', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Task[];
    },

    async updateStatus(id: string, status: Task['status']) {
        const { data, error } = await supabase
            .from('tasks')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Task;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getConversationSummary(contactId: string, locationId?: string) {
        const { data, error } = await supabase.functions.invoke('ghl-conversation-summary', {
            body: { contactId, locationId }
        });

        if (error) {
            console.error('Edge Function Error:', error);
            // If the error has a response, we can try to extract the body
            if (error instanceof Error && 'context' in (error as any)) {
                 // Supabase often puts it in context
            }
            return { error: error.message || "Erreur de communication avec Supabase" };
        }
        return data as { summary: string; images: string[] };
    }
};
