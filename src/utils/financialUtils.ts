import { Invoice } from '@/services/apiInvoices';
import { Expense } from '@/services/apiExpenses';
import { Project } from '@/services/apiProjects';
import { ActivityLog } from '@/services/apiActivities';

type TimeFrame = 'day' | 'week' | 'month' | 'year' | 'total' | 'today' | 'all-time';

export const financialUtils = {
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

    toLocalDate(date: string | Date | undefined, locale: string = 'fr-FR'): string {
        if (!date) return '-';
        return new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    },

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
        
        // Use the specific rate from the project object
        const rate = (role === 'affiliate' ? p.affiliate_commission_rate : (p as any).sales_agent_commission_rate) || 0;
        const type = (role === 'affiliate' ? p.affiliate_commission_type : (p as any).sales_agent_commission_type) || 'percent';
        
        if (type === 'fixed') return Number(rate);
        return (price * (Number(rate) / 100));
    },

    computeProjectMargin(p: Project) {
        const price = this.getSalePrice(p);
        const costs = this.computeProjectCosts(p.financials);
        const comm = this.computeCommissionAmount(p);
        const marginAmount = price - costs - comm;
        const marginPercent = price > 0 ? (marginAmount / price) * 100 : 0;
        return { marginAmount, marginPercent };
    },

    getPeriodRange(type: TimeFrame): { start: Date; end: Date } {
        const now = new Date();
        const start = new Date(now);
        
        if (type === 'day' || type === 'today') {
            start.setHours(0, 0, 0, 0);
        } else if (type === 'week') {
            // Start of current calendar week (Monday)
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
        } else if (type === 'month') {
            // Start of current calendar month
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
        } else if (type === 'year') {
            // Start of current year
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
        } else {
            // All-time or Total
            start.setFullYear(2000, 0, 1);
            start.setHours(0, 0, 0, 0);
        }
        
        return { start, end: now };
    },

    getPreviousPeriodRange(type: TimeFrame): { start: Date; end: Date } {
        const { start: currentStart } = this.getPeriodRange(type);
        const end = new Date(currentStart);
        const start = new Date(currentStart);
        
        if (type === 'day' || type === 'today') {
            start.setDate(start.getDate() - 1);
        } else if (type === 'week') {
            start.setDate(start.getDate() - 7);
        } else if (type === 'month') {
            start.setMonth(start.getMonth() - 1);
        } else if (type === 'year') {
            start.setFullYear(start.getFullYear() - 1);
        } else {
            start.setFullYear(start.getFullYear() - 1);
        }
        
        return { start, end };
    },

    getCollectedFromInvoices(invoices: Invoice[], start: Date, end: Date): number {
        return invoices.reduce((sum, inv) => {
            if (inv.status === 'void') return sum;
            
            // PRIORITY 1: Precise tracking via payment history
            if (inv.payment_history && Array.isArray(inv.payment_history) && inv.payment_history.length > 0) {
                const historySum = inv.payment_history.reduce((hSum, entry) => {
                    const pDate = new Date(entry.date);
                    if (pDate >= start && pDate <= end) {
                        return hSum + Number(entry.amount || 0);
                    }
                    return hSum;
                }, 0);
                return sum + historySum;
            }

            // PRIORITY 2: Fallback for rows without history (legacy or simplified)
            // Use paid_at (fully paid) OR updated_at (likely latest partial payment)
            const dateToUse = inv.paid_at || ((inv.status === 'paid' || inv.status === 'partial') ? (inv as any).updated_at || inv.created_at : null);
            
            if (!dateToUse) return sum;
            
            const paidAt = new Date(dateToUse);
            if (paidAt >= start && paidAt <= end) {
                // If we don't have history, we can only count the total amount_paid as of this date range
                // Note: this is an approximation for legacy data
                const paid = Number(inv.amount_paid);
                if (paid > 0) return sum + paid;
                if (inv.status === 'paid') return sum + Number(inv.amount || 0);
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
