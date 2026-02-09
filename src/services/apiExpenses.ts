import { supabase } from '@/lib/supabase';

export interface Expense {
    id: string;
    created_at: string;
    date: string;
    category: 'commission' | 'operational' | 'material' | 'marketing' | 'salary' | 'software' | 'other';
    description: string;
    amount: number;
    recipient_id?: string;
    recipient?: { full_name: string, email: string };
    project_id?: string;
    project?: { title: string };
    status: 'paid' | 'pending' | 'cancelled';
    created_by?: string;
}

export const apiExpenses = {
    async getAll() {
        const { data, error } = await supabase
            .from('expenses')
            .select(`
                *,
                recipient:profiles!expenses_recipient_id_fkey(full_name, email),
                project:projects(title)
            `)
            .order('date', { ascending: false });

        if (error) throw error;
        return data as Expense[];
    },

    async create(expense: Partial<Expense>) {
        const { data, error } = await supabase
            .from('expenses')
            .insert([expense])
            .select()
            .single();

        if (error) throw error;
        return data as Expense;
    },

    async update(id: string, updates: Partial<Expense>) {
        const { data, error } = await supabase
            .from('expenses')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Expense;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getStats() {
        // Fetch simple stats locally for now (can be optimized with RPC later)
        const { data, error } = await supabase
            .from('expenses')
            .select('amount, category, status');

        if (error) throw error;

        const totalExpenses = data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const byCategory = data.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + (Number(item.amount) || 0);
            return acc;
        }, {} as Record<string, number>);

        return { totalExpenses, byCategory };
    }
};
