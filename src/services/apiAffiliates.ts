import { supabase } from '@/lib/supabase';

export interface AffiliateStats {
    totalSales: number;
    commissionEarned: number;
    commissionPaid: number;
    commissionPending: number;
    activeProjects: number;
}

export const apiAffiliates = {
    async getStats(affiliateId: string): Promise<AffiliateStats> {
        // 1. Get Projects Stats (Sales & Earned Commission)
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('financials, status, affiliate_commission_rate, affiliate_commission_type')
            .eq('affiliate_id', affiliateId)
            .neq('status', 'cancelled'); // Exclude cancelled projects

        if (projectsError) throw projectsError;

        let totalSales = 0;
        let commissionEarned = 0;
        let activeProjects = 0;

        projects?.forEach(p => {
            if (p.status !== 'completed' && p.status !== 'delivered') {
                activeProjects++;
            }

            // Sales Volume
            const price = p.financials?.selling_price || 0;
            totalSales += price;

            // Commission Earned Calculation
            let comm = 0;
            if (p.affiliate_commission_type === 'fixed') {
                comm = p.affiliate_commission_rate || 0;
            } else {
                // Percentage
                const rate = p.affiliate_commission_rate || 0;
                comm = (price * rate) / 100;
            }
            commissionEarned += comm;
        });

        // 2. Get Expenses Stats (Commission Paid)
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('amount, status')
            .eq('recipient_id', affiliateId)
            .eq('category', 'commission'); // Ensure we only count commission payouts

        if (expensesError) throw expensesError;

        // Sum up PAID expenses
        const commissionPaid = expenses
            ?.filter(e => e.status === 'paid')
            .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        return {
            totalSales,
            commissionEarned,
            commissionPaid,
            commissionPending: commissionEarned - commissionPaid,
            activeProjects
        };
    },

    async getAllAffiliatesWithStats() {
        // Fetch all users with affiliate role
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['affiliate', 'ambassador']); // Handle likely role names

        if (error) throw error;

        // Enrich with stats (N+1 query but acceptable for small number of affiliates)
        const affiliatesWithStats = await Promise.all(profiles.map(async (p) => {
            const stats = await this.getStats(p.id);
            return { ...p, stats };
        }));

        return affiliatesWithStats;
    }
};
