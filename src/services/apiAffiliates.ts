import { supabase } from '@/lib/supabase';

export interface AffiliateStats {
    totalSales: number;
    commissionEarned: number;
    commissionPaid: number;
    commissionPending: number;
    activeProjects: number;
    projects: any[];
}

export interface AffiliateProfile {
    id: string;
    full_name: string | null;
    email?: string;
    role: string;
    affiliate_status?: 'pending' | 'active' | 'rejected';
    affiliate_level?: 'starter' | 'confirmed' | 'elite' | 'partner';
    commission_rate?: number;
    commission_type?: 'percent' | 'fixed';
    stats?: AffiliateStats;
}

export const apiAffiliates = {
    // Legacy support / Direct fetch
    async getAffiliates(): Promise<AffiliateProfile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['affiliate', 'ambassador', 'admin', 'sales']); // Include others who might be affiliates? sticking to affiliate/ambassador primarily but let's be broad if legacy used it.
        // Actually, keep it simple:
        // .in('role', ['affiliate', 'ambassador']);

        // Wait, ProjectDetails used it for specific dropdowns. Let's just fetch all potential affiliates.
        if (error) throw error;
        return data as AffiliateProfile[];
    },

    async updateAffiliate(id: string, updates: Partial<AffiliateProfile>) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
        return this.getStats(affiliateId);
    },

    async getStats(affiliateId: string): Promise<AffiliateStats> {
        // 1. Get Projects Stats (Sales & Earned Commission)
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, title, client_id, financials, status, affiliate_commission_rate, affiliate_commission_type')
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
            activeProjects,
            projects: projects || []
        };
    },

    async getAllAffiliatesWithStats() {
        // Efficient Single Query with Joins
        // We fetch profiles and join their projects and expenses in one go.
        /* 
           To be super safe against case-sensitive roles and ensure we get data if available:
        */
        const { data: allProfiles, error: fetchError } = await supabase
            .from('profiles')
            .select(`
                *,
                projects:projects(id, financials, status, affiliate_commission_rate, affiliate_commission_type),
                expenses:expenses(amount, status, category)
             `);

        if (fetchError) throw fetchError;

        // Filter for affiliates
        // const targetRoles = ['affiliate', 'ambassador'];
        // const affiliateProfiles = allProfiles?.filter(p => targetRoles.includes(p.role?.toLowerCase()));
        // Actually, let's stick to the simpler query first if the user is having "no data" issues.
        // It's likely RLS. But let's optimize the fetching logic first.

        const affiliateProfiles = allProfiles?.filter(p =>
            ['affiliate', 'ambassador'].includes(p.role?.toLowerCase())
        ) || [];

        // Process stats in memory
        const results = affiliateProfiles.map(profile => {
            const projects = profile.projects || [];
            const expenses = profile.expenses || [];

            let totalSales = 0;
            let commissionEarned = 0;
            let activeProjects = 0;

            // Calculate Project Stats
            projects.forEach((p: any) => {
                if (p.status !== 'completed' && p.status !== 'delivered' && p.status !== 'cancelled') {
                    activeProjects++;
                }
                if (p.status === 'cancelled') return;

                const price = p.financials?.selling_price || 0;
                totalSales += price;

                let comm = 0;
                if (p.affiliate_commission_type === 'fixed') {
                    comm = p.affiliate_commission_rate || 0;
                } else {
                    const rate = p.affiliate_commission_rate || 0;
                    comm = (price * rate) / 100;
                }
                commissionEarned += comm;
            });

            // Calculate Expenses Stats
            const commissionPaid = expenses
                .filter((e: any) => e.status === 'paid' && e.category === 'commission')
                .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

            return {
                ...profile,
                stats: {
                    totalSales,
                    commissionEarned,
                    commissionPaid,
                    commissionPending: commissionEarned - commissionPaid,
                    activeProjects,
                    projects
                }
            };
        });

        return results;
    }
};
