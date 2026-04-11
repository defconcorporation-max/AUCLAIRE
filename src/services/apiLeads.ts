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
    metadata: Record<string, unknown> | null;
    fb_leadgen_id: string | null;
    affiliate_id?: string | null;
    affiliate_source?: string | null;
    affiliate?: {
        full_name: string | null;
    } | null;
}

export const apiLeads = {
    async getAll() {
        const { data, error } = await supabase
            .from('leads')
            .select('*, affiliate:profiles(full_name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Lead[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('leads')
            .select('*, affiliate:profiles(full_name)')
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
    },

    async getMessages(leadId: string) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as Message[];
    },

    async createMessage(message: Partial<Message>) {
        const { data, error } = await supabase
            .from('messages')
            .insert([message])
            .select()
            .single();

        if (error) throw error;
        return data as Message;
    }
};

export interface Message {
    id: string;
    created_at: string;
    lead_id: string;
    content: string;
    sender_type: 'lead' | 'agent';
    platform: 'facebook' | 'instagram' | 'whatsapp';
    fb_message_id: string | null;
}
