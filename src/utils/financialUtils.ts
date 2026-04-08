import { Invoice } from '@/services/apiInvoices';
import { Expense } from '@/services/apiExpenses';
import { Project } from '@/services/apiProjects';
import { ActivityLog } from '@/services/apiActivities';

export const financialUtils = {
    // Basic Parsing & Helpers
    parsePaymentAmount(details: string): number {
        const matches = details.match(/[\d.]+/g);
        if (matches && matches.length > 0) return parseFloat(matches[matches.length - 1]);
        return 0;
    },

    isPaymentActivity(log: ActivityLog): boolean {
        const details = (log.details || '').toLowerCase();
        return details.includes('payment') || details.includes('paiement') || details.includes('encaissé');
    },

    isInRange(dateStr: string | Date, start: Date, end: Date): boolean {
        const d = new Date(dateStr);
        return d >= start && d <= end;
    },

    toLocalDate(date: string | Date, locale: string = 'fr-FR'): string {
        return new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    },

    // Price & Cost Computations
    getSalePrice(p: Project): number {
        return Number(p.financials?.selling_price || p.budget || 0);
    },

    computeProjectCosts(financials: Project['financials']): number {
        if (!financials) return 0;
        const itemSum = (financials.cost_items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        return (Number(financials.supplier_cost) || 0) + 
               (Number(financials.shipping_cost) || 0) + 
               (Number(financials.customs_fee) || 0) + 
               (Number(financials.additional_expense) || 0) + 
               itemSum;
    },

    computeCommissionAmount(p: Project, preferredRole?: string): number {
        const price = this.getSalePrice(p);
        const role = preferredRole || (p.affiliate_id ? 'affiliate' : 'sales_agent');
        const rate = (role === 'affiliate' ? p.affiliate_rate : p.sales_agent_rate) || 0;
        return (price * (Number(rate) / 100));
    },

    computeProjectMargin(p: Project): number {
        const price = this.getSalePrice(p);
        if (price === 0) return 0;
        const costs = this.computeProjectCosts(p.financials);
        const comm = this.computeCommissionAmount(p);
        return (price - costs - comm) / price;
    },

    // Range Selection
    getPeriodRange(type: 'day' | 'week' | 'month' | 'total'): { start: Date; end: Date } {
        const now = new Date();
        const start = new Date();
        if (type === 'day') start.setHours(0,0,0,0);
        else if (type === 'week') start.setDate(now.getDate() - 7);
        else if (type === 'month') start.setMonth(now.getMonth() - 1);
        else start.setFullYear(2000);
        return { start, end: now };
    },

    getPreviousPeriodRange(type: 'day' | 'week' | 'month' | 'total' | 'today'): { start: Date; end: Date } {
        // Handle 'today' as 'day' for compatibility
        const actualType = type === 'today' ? 'day' : type;
        const { start: currentStart } = this.getPeriodRange(actualType as any);
        const end = new Date(currentStart);
        const start = new Date(currentStart);
        
        if (actualType === 'day') start.setDate(start.getDate() - 1);
        else if (actualType === 'week') start.setDate(start.getDate() - 7);
        else if (actualType === 'month') start.setMonth(start.getMonth() - 1);
        else start.setFullYear(start.getFullYear() - 1);
        
        return { start, end };
    },

    // Metrics & Aggregations
    getCollectedFromInvoices(invoices: Invoice[], start: Date, end: Date): number {
        return invoices.reduce((sum, inv) => {
            if (inv.status === 'void') return sum;
            const paidAt = inv.paid_at ? new Date(inv.paid_at) : (inv.status === 'paid' ? new Date(inv.updated_at || inv.created_at) : null);
            if (paidAt && paidAt >= start && paidAt <= end) {
                return sum + (Number(inv.amount_paid) > 0 ? Number(inv.amount_paid) : Number(inv.amount));
            }
            return sum;
        }, 0);
    },

    calculateMetrics(invoices: Invoice[], expenses: Expense[], start: Date, end: Date = new Date()) {
        const invoicedTotal = invoices.reduce((sum, inv) => {
            const date = new Date(inv.created_at);
            if (date >= start && date <= end && inv.status !== 'void') return sum + Number(inv.amount || 0);
            return sum;
        }, 0);
        const cashCollected = this.getCollectedFromInvoices(invoices, start, end);
        const expensesTotal = expenses.reduce((sum, exp) => {
            const date = new Date(exp.date || exp.created_at);
            if (date >= start && date <= end && exp.status !== 'cancelled') return sum + Number(exp.amount || 0);
            return sum;
        }, 0);
        return { invoicedTotal, cashCollected, expensesTotal };
    }
};
