import { supabase } from '@/lib/supabase';

export interface FeedbackEntry {
    id: string;
    created_at: string;
    user_id: string;
    user_name: string;
    page_url: string;
    comment: string;
    screenshots: string[];
    status: 'pending' | 'implemented' | 'reviewed';
}

export const apiFeedback = {
    async submit(feedback: Omit<FeedbackEntry, 'id' | 'created_at' | 'status'>) {
        const { data, error } = await supabase
            .from('beta_feedback')
            .insert({ ...feedback, status: 'pending' })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getAll() {
        const { data, error } = await supabase
            .from('beta_feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as FeedbackEntry[];
    },

    async updateStatus(id: string, status: FeedbackEntry['status']) {
        const { error } = await supabase
            .from('beta_feedback')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('beta_feedback')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
