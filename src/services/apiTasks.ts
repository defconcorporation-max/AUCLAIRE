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
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            const response = await fetch(`${supabaseUrl}/functions/v1/ghl-conversation-summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`
                },
                body: JSON.stringify({ contactId, locationId })
            });

            const data = await response.json();
            
            if (!response.ok) {
                console.error('Edge Function Error Response:', data);
                return { error: data.error || `Erreur ${response.status}: ${response.statusText}`, details: data };
            }
            
            return data as { summary: string; images: string[] };
        } catch (error: any) {
            console.error('Fetch Error:', error);
            return { error: error.message || "Erreur de connexion au serveur" };
        }
    }
};
