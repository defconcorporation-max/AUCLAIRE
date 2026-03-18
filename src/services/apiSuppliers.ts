import { supabase } from '@/lib/supabase';

export interface Supplier {
    id: string;
    name: string;
    type: 'diamantaire' | 'fondeur' | 'sertisseur' | 'graveur' | 'other';
    contact_name?: string;
    email?: string;
    phone?: string;
    notes?: string;
    rating?: number; // 1-5
    created_at: string;
}

export const apiSuppliers = {
    async getAll() {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data as Supplier[]) || [];
    },

    async create(supplier: Partial<Supplier>) {
        const { data, error } = await supabase
            .from('suppliers')
            .insert([supplier])
            .select()
            .single();

        if (error) throw error;
        return data as Supplier;
    },

    async update(id: string, updates: Partial<Supplier>) {
        const { data, error } = await supabase
            .from('suppliers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Supplier;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
