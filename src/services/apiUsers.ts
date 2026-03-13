import { supabase } from '@/lib/supabase';
import { UserRole } from '@/context/AuthContext';

export interface UserProfile {
    id: string;
    full_name: string;
    role: UserRole;
    email?: string;
    created_at: string;
    monthly_goal?: number;
    daily_capacity?: number;
    design_capacity?: number;
    production_capacity?: number;
    specialty?: string[];
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
            .select('id, full_name, role, email, created_at, monthly_goal, daily_capacity, design_capacity, production_capacity, specialty')
            .order('created_at', { ascending: false });

        if (error) throw error;
        console.log('Fetched Users:', data);
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
    },

    async updateCapacities(id: string, design_capacity: number, production_capacity: number) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ design_capacity, production_capacity })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateMonthlyGoal(id: string, monthly_goal: number) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ monthly_goal })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async adminUpdatePassword(userId: string, newPassword: string) {
        // Bypass for Demo Admin
        if (localStorage.getItem('isSharedMode') === 'true') {
            console.warn("Demo Mode: Mocking password update.");
            return true;
        }

        const { data, error } = await supabase.rpc('admin_update_user_password', {
            target_user_id: userId,
            new_password: newPassword
        });

        if (error) {
            console.error("Admin Password Update Error:", error);
            throw error;
        }

        return data; // Usually returns true on success
    }
};
