
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/context/AuthContext';

export interface AffiliateProfile {
    id: string;
    full_name: string | null;
    role: UserRole;
    avatar_url: string | null;
    affiliate_status: 'pending' | 'active' | 'rejected';
    affiliate_level: 'starter' | 'confirmed' | 'elite' | 'partner';
    commission_rate: number;
    commission_type: 'percent' | 'fixed';
    email?: string; // Often joined from auth.users, but RLS might block. We rely on profiles.
}

export const apiAffiliates = {
    // Fetch all affiliates (for Admin)
    async getAffiliates() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['affiliate', 'admin'])
            .order('full_name', { ascending: true });

        if (error) throw error;
        return data as AffiliateProfile[];
    },

    // Update affiliate details (Admin)
    async updateAffiliate(id: string, updates: Partial<AffiliateProfile>) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as AffiliateProfile;
    },

    // Get stats for a specific affiliate
    async getAffiliateStats(affiliateId: string) {
        // We need to fetch all projects assigned to this affiliate
        // ideally filtering by status (e.g., only 'delivered' or 'paid' counts for stats?)
        // For now, we'll fetch all non-archived projects.
        const { data: projects, error } = await supabase
            .from('projects')
            .select('id, budget, status, payment_status, affiliate_commission_rate, affiliate_commission_type')
            .eq('affiliate_id', affiliateId);

        if (error) throw error;

        let totalSales = 0;
        let totalCommission = 0;
        let activeProjectsCount = 0;

        projects.forEach(project => {
            const price = Number(project.budget) || 0;

            // Calculate Commission
            // If the project has a snapshot rate, use it. Otherwise use 0 (or should we fetch profile default?)
            // We assume the snapshot is set when project is assigned.
            let commission = 0;
            if (project.affiliate_commission_type === 'fixed') {
                commission = Number(project.affiliate_commission_rate) || 0;
            } else {
                // percent
                const rate = Number(project.affiliate_commission_rate) || 0;
                commission = (price * rate) / 100;
            }

            // Status Logic
            if (project.status === 'delivered' || project.status === 'completed') {
                // fulfilled
            }

            if (project.status !== 'archived' && project.status !== 'cancelled') {
                activeProjectsCount++;
            }

            // For Total Sales/Commission, typically we count EVERYTHING or only PAID?
            // "ongoing project... total price sale" -> Suggests potential pipeline value.
            // "dashboard with total sales and total commission" -> Usually historical + potential.
            // Let's count everything that isn't cancelled.
            if (project.status !== 'cancelled') {
                totalSales += price;
                totalCommission += commission;
            }
        });

        return {
            totalSales,
            totalCommission,
            activeProjectsCount,
            projects // Return the raw list if needed for the table
        };
    }
};
