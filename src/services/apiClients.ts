
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

export interface Client {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    notes?: string;
    status: 'active' | 'inactive';
    created_at: string;
}

export const apiClients = {
    async getAll() {

        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast({ title: 'Error fetching clients', description: error.message, variant: 'destructive' });
            throw error;
        }
        return data as Client[];
    },

    async getById(id: string) {
        const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();

        if (error) {
            toast({ title: 'Error fetching client', description: error.message, variant: 'destructive' });
            throw error;
        }

        return data as Client;
    },

    async create(client: Partial<Client>) {
        const { data, error } = await supabase.from('clients').insert(client).select().single();

        if (error) {
            console.error("Supabase Create Client Error:", error);
            throw error;
        }
        return data;
    },

    async update(id: string, updates: Partial<Client>) {
        const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single();

        if (error) {
            toast({ title: 'Error updating client', description: error.message, variant: 'destructive' });
            throw error;
        }
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) {
            toast({ title: 'Error deleting client', description: error.message, variant: 'destructive' });
            throw error;
        }
    }
};
