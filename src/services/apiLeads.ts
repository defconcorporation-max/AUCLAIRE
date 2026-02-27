import { supabase } from '@/lib/supabase';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';
export type LeadSource = 'facebook' | 'website' | 'manual';

export interface Lead {
    id: string;
    created_at: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: LeadStatus;
    source: LeadSource;
    value: number;
    notes: string | null;
    metadata: any | null;
    fb_leadgen_id: string | null;
}

export const apiLeads = {
    async getAll() {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Lead[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Lead;
    },

    async create(lead: Partial<Lead>) {
        const { data, error } = await supabase
            .from('leads')
            .insert([lead])
            .select()
            .single();

        if (error) throw error;
        return data as Lead;
    },

    async update(id: string, updates: Partial<Lead>) {
        const { data, error } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Lead;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
