import { Invoice } from '@/services/apiInvoices';
import { Expense } from '@/services/apiExpenses';
import { ActivityLog } from '@/services/apiActivities';

export const financialUtils = {
    parsePaymentAmount(details: string): number {
        const matches = details.match(/[\d.]+/g);
        if (matches && matches.length > 0) {
            return parseFloat(matches[matches.length - 1]);
        }
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

    getPeriodRange(type: 'day' | 'week' | 'month' | 'total'): { start: Date; end: Date } {
        const now = new Date();
        const start = new Date();
        if (type === 'day') start.setHours(0,0,0,0);
        else if (type === 'week') start.setDate(now.getDate() - 7);
        else if (type === 'month') start.setMonth(now.getMonth() - 1);
        else start.setFullYear(2000);
        return { start, end: now };
    },

    getPreviousPeriodRange(type: 'day' | 'week' | 'month' | 'total'): { start: Date; end: Date } {
        const { start: currentStart } = this.getPeriodRange(type);
        const end = new Date(currentStart);
        const start = new Date(currentStart);
        
        if (type === 'day') start.setDate(start.getDate() - 1);
        else if (type === 'week') start.setDate(start.getDate() - 7);
        else if (type === 'month') start.setMonth(start.getMonth() - 1);
        else start.setFullYear(start.getFullYear() - 10);
        
        return { start, end };
    },

    getCollectedFromInvoices(invoices: Invoice[], start: Date, end: Date): number {
        return invoices.reduce((sum, inv) => {
            if (inv.status === 'void') return sum;
            // Check specific payment date if available, otherwise use updated_at if paid
            const paidAt = inv.paid_at ? new Date(inv.paid_at) : (inv.status === 'paid' ? new Date(inv.updated_at) : null);
            if (paidAt && paidAt >= start && paidAt <= end) {
                return sum + (Number(inv.amount_paid) || Number(inv.amount));
            }
            return sum;
        }, 0);
    },

    calculateMetrics(invoices: Invoice[], expenses: Expense[], start: Date, end: Date = new Date()) {
        const invoicedTotal = invoices.reduce((sum, inv) => {
            const date = new Date(inv.created_at);
            if (date >= start && date <= end && inv.status !== 'void') {
                return sum + Number(inv.amount || 0);
            }
            return sum;
        }, 0);

        const cashCollected = this.getCollectedFromInvoices(invoices, start, end);

        const expensesTotal = expenses.reduce((sum, exp) => {
            const date = new Date(exp.date || exp.created_at);
            if (date >= start && date <= end && exp.status !== 'cancelled') {
                return sum + Number(exp.amount || 0);
            }
            return sum;
        }, 0);

        return { invoicedTotal, cashCollected, expensesTotal };
    }
};
