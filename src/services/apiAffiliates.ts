import { supabase } from '@/lib/supabase';

export interface AffiliateStats {
    totalSales: number;
    salesCount: number;
    cashCollected: number;
    commissionEarned: number;
    commissionPaid: number;
    commissionPending: number;
    activeProjects: number;
    projects: unknown[];
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
            .in('role', ['affiliate', 'ambassador', 'admin']);
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
        // 1. Get Projects Stats (Sales & Active count)
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, title, client_id, budget, financials, status, affiliate_commission_rate, affiliate_commission_type')
            .eq('affiliate_id', affiliateId)
            .neq('status', 'cancelled');

        if (projectsError) throw projectsError;

        // 2. Get Invoices to verify sales AND get total cash collected
        const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('project_id, amount, amount_paid, status')
            .in('project_id', projects.map(p => p.id));

        if (invError) throw invError;
        const invoicedProjectIds = new Set(invoices?.map(i => i.project_id));

        let totalSales = 0;
        let salesCount = 0;
        let cashCollected = 0;
        let activeProjects = 0;

        // Calculate actual cash collected from PAID client invoices
        invoices?.forEach(inv => {
            // Include amount_paid if available, otherwise fallback to amount if fully paid
            const paidValue = Number(inv.amount_paid) > 0 ? Number(inv.amount_paid) : (inv.status === 'paid' ? Number(inv.amount) : 0);
            cashCollected += paidValue;
        });

        const PRODUCTION_READY_STATUSES = ['approved_for_production', 'production', 'delivery', 'completed'];

        projects?.forEach(p => {
            if (p.status !== 'completed' && (p.status as string) !== 'delivery' && (p.status as string) !== 'delivered') {
                activeProjects++;
            }
            
            const isSale = PRODUCTION_READY_STATUSES.includes(p.status) || invoicedProjectIds.has(p.id);
            if (isSale) {
                const price = Number(p.financials?.selling_price || p.budget || 0);
                totalSales += price;
                salesCount++;
            }
        });

        // 3. Get Expenses Stats — commissionEarned is the source of truth
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('amount, status, description')
            .eq('recipient_id', affiliateId)
            .eq('category', 'commission');

        if (expensesError) throw expensesError;

        // Total Earned = ALL non-cancelled commission expenses (pending + paid) EXCEPT manual payout records
        // Manual payout records usually have description "Commission Payout" or no project_id
        const commissionEarned = expenses
            ?.filter(e => e.status !== 'cancelled' && !e.description?.includes('Commission Payout'))
            .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        const commissionPaid = expenses
            ?.filter(e => e.status === 'paid' && !e.description?.includes('Commission Payout'))
            .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        const commissionPending = expenses
            ?.filter(e => e.status === 'pending' && !e.description?.includes('Commission Payout'))
            .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        return {
            totalSales,
            salesCount,
            cashCollected,
            commissionEarned,
            commissionPaid,
            commissionPending,
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
                ['affiliate', 'ambassador'].includes((p as any).role?.toLowerCase())
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

        } catch (err) {
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
