import { supabase } from '@/lib/supabase';
import { UserRole } from '@/context/AuthContext';

export interface UserProfile {
    id: string;
    full_name: string;
    role: UserRole;
    email?: string; // Optional, might not be available in profiles table, but useful if we join
    created_at: string;
}

export const apiUsers = {
    async getAll() {
        // Fetch profiles.
        // Note: profiles table doesn't have email. 
        // In a real admin dashboard, you'd use a Supabase Edge Function with Service Role to fetch auth.users.
        // For this "Hybrid" setup, we only have access to 'profiles'.
        // We will list profiles. The admin will have to identify users by Name.

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as UserProfile[];
    },

    async updateRole(id: string, role: UserRole) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
