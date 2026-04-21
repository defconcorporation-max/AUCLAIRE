import { supabase } from '@/lib/supabase';

export interface CompanyService {
    id: string;
    name: string;
    description?: string;
    default_price: number;
    created_at?: string;
}

export const apiServices = {
    getAll: async (): Promise<CompanyService[]> => {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('name');
        
        if (error && error.code !== '42P01') {
            console.error('Error fetching services:', error);
            throw error;
        }
        
        // Return empty array if table doesn't exist yet (42P01: undefined_table)
        if (error && error.code === '42P01') {
            return [];
        }
        
        return data || [];
    },

    create: async (service: Omit<CompanyService, 'id' | 'created_at'>): Promise<CompanyService> => {
        const { data, error } = await supabase
            .from('services')
            .insert(service)
            .select()
            .single();

        if (error) {
            console.error('Error creating service:', error);
            throw error;
        }

        return data;
    },

    update: async (id: string, service: Partial<CompanyService>): Promise<CompanyService> => {
        const { data, error } = await supabase
            .from('services')
            .update(service)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating service:', error);
            throw error;
        }

        return data;
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting service:', error);
            throw error;
        }
    }
};
