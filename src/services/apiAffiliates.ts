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
            .select('id, title, client_id, budget, financials, status, affiliate_commission_rate, affiliate_commission_type, client:clients(full_name)')
            .or(`affiliate_id.eq.${affiliateId},sales_agent_id.eq.${affiliateId}`)
            .neq('status', 'cancelled');

        if (projectsError) throw projectsError;

        // 2. Get Invoices to verify sales AND get total cash collected
        const projectIds = projects.map(p => p.id);
        let invoices: any[] = [];
        if (projectIds.length > 0) {
            const { data: invData, error: invError } = await supabase
                .from('invoices')
                .select('project_id, amount, amount_paid, status, paid_at, created_at, updated_at')
                .in('project_id', projectIds);
            if (invError) throw invError;
            invoices = invData || [];
        }
        const invoicedProjectIds = new Set(invoices.map(i => i.project_id));

        let totalSales = 0;
        let salesCount = 0;
        let cashCollected = 0;
        let activeProjects = 0;

        invoices.forEach(inv => {
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

    /** Monthly sales volume for last 6 months (for chart). Uses invoice paid_at when available. */
    async getMonthlySales(affiliateId: string): Promise<{ month: string; label: string; amount: number }[]> {
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, financials, budget, status')
            .or(`affiliate_id.eq.${affiliateId},sales_agent_id.eq.${affiliateId}`)
            .neq('status', 'cancelled');

        if (projectsError || !projects?.length) return this._emptyMonthlyData();

        const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('project_id, amount, amount_paid, status, paid_at, created_at, updated_at')
            .in('project_id', projects.map(p => p.id));

        if (invError) return this._emptyMonthlyData();

        const projectIds = new Set(projects.map(p => p.id));
        const PRODUCTION_READY = ['approved_for_production', 'production', 'delivery', 'completed'];
        const projectSaleAmount = new Map<string, number>();
        projects.forEach(p => {
            const isSale = PRODUCTION_READY.includes(p.status);
            if (isSale) {
                const price = Number(p.financials?.selling_price || p.budget || 0);
                projectSaleAmount.set(p.id, price);
            }
        });

        const months: { month: string; label: string; amount: number }[] = [];
        const now = new Date();
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            months.push({ month: key, label, amount: 0 });
        }

        const monthMap = new Map(months.map(m => [m.month, m]));

        invoices?.forEach(inv => {
            if (!projectIds.has(inv.project_id)) return;
            const paidValue = Number(inv.amount_paid) > 0 ? Number(inv.amount_paid) : (inv.status === 'paid' ? Number(inv.amount) : 0);
            if (paidValue <= 0) return;
            const paidAt = inv.paid_at || (inv.status === 'paid' ? inv.created_at : null) || (Number(inv.amount_paid) > 0 ? inv.updated_at ?? inv.created_at : null);
            if (!paidAt) return;
            const date = new Date(paidAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const entry = monthMap.get(key);
            if (entry) entry.amount += paidValue;
        });

        return months;
    },

    _emptyMonthlyData(): { month: string; label: string; amount: number }[] {
        const now = new Date();
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, amount: 0 };
        });
    },

    async getAllAffiliatesWithStats() {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*');

            if (error) throw error;
            const allProfiles = (data || []) as AffiliateProfile[];

            const affiliateProfiles = allProfiles.filter(p =>
                ['affiliate', 'ambassador', 'admin'].includes(p.role?.toLowerCase())
            );

            if (affiliateProfiles.length === 0) return [];

            const allProjectIds = new Set<string>();
            const profileProjectMap = new Map<string, any[]>();
            const profileInvoiceMap = new Map<string, any[]>();

            const { data: allProjects } = await supabase
                .from('projects')
                .select('id, title, client_id, budget, financials, status, affiliate_id, sales_agent_id, affiliate_commission_rate, affiliate_commission_type')
                .neq('status', 'cancelled');

            (allProjects || []).forEach(p => {
                const ownerId = p.affiliate_id || p.sales_agent_id;
                if (ownerId) {
                    if (!profileProjectMap.has(ownerId)) profileProjectMap.set(ownerId, []);
                    profileProjectMap.get(ownerId)!.push(p);
                    allProjectIds.add(p.id);
                }
            });

            let allInvoices: any[] = [];
            if (allProjectIds.size > 0) {
                const { data: invData } = await supabase
                    .from('invoices')
                    .select('project_id, amount, amount_paid, status, paid_at, created_at')
                    .in('project_id', Array.from(allProjectIds));
                allInvoices = invData || [];
            }

            const invoiceByProject = new Map<string, any[]>();
            allInvoices.forEach(inv => {
                if (!invoiceByProject.has(inv.project_id)) invoiceByProject.set(inv.project_id, []);
                invoiceByProject.get(inv.project_id)!.push(inv);
            });

            let allExpenses: any[] = [];
            try {
                const { data: expData } = await supabase
                    .from('expenses')
                    .select('amount, status, description, recipient_id')
                    .eq('category', 'commission');
                allExpenses = expData || [];
            } catch { /* expenses table may not have recipient_id */ }

            const PRODUCTION_READY = ['approved_for_production', 'production', 'delivery', 'completed'];

            return affiliateProfiles.map(profile => {
                const projects = profileProjectMap.get(profile.id) || [];
                const invoicedIds = new Set<string>();
                let totalSales = 0, salesCount = 0, cashCollected = 0, activeProjects = 0;

                projects.forEach(p => {
                    const pInvoices = invoiceByProject.get(p.id) || [];
                    pInvoices.forEach(inv => {
                        invoicedIds.add(inv.project_id);
                        cashCollected += Number(inv.amount_paid) > 0 ? Number(inv.amount_paid) : (inv.status === 'paid' ? Number(inv.amount) : 0);
                    });
                    if (!['completed', 'delivery'].includes(p.status)) activeProjects++;
                    const isSale = PRODUCTION_READY.includes(p.status) || invoicedIds.has(p.id);
                    if (isSale) {
                        totalSales += Number(p.financials?.selling_price || p.budget || 0);
                        salesCount++;
                    }
                });

                const myExpenses = allExpenses.filter(e => e.recipient_id === profile.id && !e.description?.includes('Commission Payout'));
                const commissionEarned = myExpenses.filter(e => e.status !== 'cancelled').reduce((s, e) => s + Number(e.amount), 0);
                const commissionPaid = myExpenses.filter(e => e.status === 'paid').reduce((s, e) => s + Number(e.amount), 0);
                const commissionPending = myExpenses.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0);

                return {
                    ...profile,
                    stats: { totalSales, salesCount, cashCollected, commissionEarned, commissionPaid, commissionPending, activeProjects, projects }
                };
            });
        } catch (err) {
            console.error("Critical: Could not fetch affiliates.", err);
            return [];
        }
    },

    async payCommission(affiliateId: string, amount: number, notes?: string) {
        // 1. Find all pending commissions for this affiliate
        const { data: pendingExpenses, error: findError } = await supabase
            .from('expenses')
            .select('id, amount')
            .eq('recipient_id', affiliateId)
            .eq('category', 'commission')
            .eq('status', 'pending')
            .not('description', 'ilike', '%Commission Payout%');

        if (findError) throw findError;

        // 2. Mark matches as paid
        if (pendingExpenses && pendingExpenses.length > 0) {
            const { error: updateError } = await supabase
                .from('expenses')
                .update({ status: 'paid' })
                .in('id', pendingExpenses.map(e => e.id));
            
            if (updateError) throw updateError;
        }

        // 3. Create a summary payout record for tracking (excluded from earned/pending/paid stats by description)
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
