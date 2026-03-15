import { supabase } from '@/lib/supabase';

export interface FeedbackEntry {
    id: string;
    created_at: string;
    user_id: string;
    user_name: string;
    page_url: string;
    comment: string;
    screenshots: string[];
    status: 'pending' | 'in_review' | 'done';
    comments?: { user: string; text: string; date: string }[];
}

export const apiFeedback = {
    async submit(feedback: Omit<FeedbackEntry, 'id' | 'created_at' | 'status' | 'comments'>) {
        const { data, error } = await supabase
            .from('beta_feedback')
            .insert({ ...feedback, status: 'pending', comments: [] })
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

    async addComment(id: string, comment: { user: string; text: string; date: string }, existingComments: any[]) {
        const newComments = [...(existingComments || []), comment];
        const { error } = await supabase
            .from('beta_feedback')
            .update({ comments: newComments })
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
