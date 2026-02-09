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
        let allProfiles: any[] = [];

        try {
            // Attempt 1: Fetch Profiles first
            const { data, error } = await supabase
                .from('profiles')
                .select('*');

            if (error) throw error;
            allProfiles = data || [];

            // Filter for affiliates/ambassadors
            const affiliateProfiles = allProfiles.filter(p =>
                ['affiliate', 'ambassador'].includes(p.role?.toLowerCase())
            );

            // Fetch generic stats for them (Batched or individual - keeping it simple/safe for now)
            // To avoid N+1 slow loading or complex joins failing, we'll do a safe Promise.all
            // This is less efficient but WAY more robust against schema mismatches
            const results = await Promise.all(affiliateProfiles.map(async (profile) => {
                try {
                    const stats = await this.getStats(profile.id);
                    return { ...profile, stats };
                } catch (e) {
                    console.warn(`Failed to load stats for ${profile.id}`, e);
                    // Return zero stats on error
                    return {
                        ...profile,
                        stats: {
                            totalSales: 0,
                            commissionEarned: 0,
                            commissionPaid: 0,
                            commissionPending: 0,
                            activeProjects: 0,
                            projects: []
                        }
                    };
                }
            }));

            return results;

        } catch (err: any) {
            console.error("Critical: Could not fetch affiliates.", err);
            return [];
        }
    },

    async payCommission(affiliateId: string, amount: number, notes?: string) {
        // Create an expense record for the commission payment
        const { data, error } = await supabase
            .from('expenses')
            .insert([{
                category: 'commission',
                amount: amount,
                recipient_id: affiliateId,
                description: notes || `Commission Payout`,
                status: 'paid',
                date: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
