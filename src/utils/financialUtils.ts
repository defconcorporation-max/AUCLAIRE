import { ActivityLog } from "@/services/apiActivities";
import type { Financials, Project } from "@/services/apiProjects";

// Shared, robust parsing and financial helpers for all analytics

// Matches our activity log patterns such as:
// - "Paiement enregistré: +123$ (Initial, Inv: XXXX)"
// - "Paiement enregistré: -50.25$ (Total: 300$, Inv: XXXX)"
const PAYMENT_REGEX = /Paiement enregistré:\s*([+-]?\d+(?:\.\d+)?)\$/;

export const financialUtils = {
    /**
     * Safely parses a single payment amount from an activity log details string.
     * Returns null if the entry does not contain a valid payment.
     */
    parsePaymentAmount(details: string): number | null {
        const match = details.match(PAYMENT_REGEX);
        if (!match) return null;
        const value = Number(match[1]);
        return Number.isFinite(value) ? value : null;
    },

    /**
     * Returns true if the given log is a financial payment entry.
     */
    isPaymentActivity(log: ActivityLog): boolean {
        return log.action === "financial" && log.details.includes("Paiement enregistré");
    },

    /**
     * Utility: checks whether a given date (string or Date) falls within [start, end].
     * For single-day periods, also accepts same calendar day (month+day) to handle year mismatch.
     */
    isInRange(dateStr: string | Date | null | undefined, start: Date, end: Date): boolean {
        const d = financialUtils.toLocalDate(dateStr);
        if (!d.getTime()) return false;
        if (d >= start && d <= end) return true;
        if (financialUtils.isOneDayPeriod(start, end) && financialUtils.isSameCalendarDay(d, start)) return true;
        return false;
    },

    /**
     * Parse date string for range checks. Date-only (YYYY-MM-DD) → local midnight; with time → normal parse.
     * Accepts string or Date (e.g. from API).
     */
    toLocalDate(dateStr: string | Date | null | undefined): Date {
        if (dateStr == null) return new Date(0);
        if (typeof dateStr !== "string") {
            const d = dateStr as Date;
            return d && d.getTime ? d : new Date(0);
        }
        const s = dateStr.trim();
        if (!s) return new Date(0);
        if (s.length >= 10 && s[4] === "-" && s[7] === "-") {
            const [y, m, d] = s.substring(0, 10).split("-").map(Number);
            if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d))
                return new Date(y, m - 1, d, 0, 0, 0, 0);
        }
        return new Date(s);
    },

    /** True if the period is a single calendar day (for "today" fallback). */
    isOneDayPeriod(start: Date, end: Date): boolean {
        const sameDay = start.getDate() === end.getDate() && start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
        const sameOrAdjacent = end.getTime() - start.getTime() < 48 * 60 * 60 * 1000;
        return sameDay || sameOrAdjacent;
    },

    /** True if d has the same month and day as ref (ignores year). */
    isSameCalendarDay(d: Date, ref: Date): boolean {
        return d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
    },

    /**
     * Calculates the total amount collected from a list of activity logs within a date range.
     * This is the source of truth for "when" money actually arrived (cash basis).
     */
    getCollectedFromLogs(activities: ActivityLog[], start: Date, end: Date): number {
        if (!activities || activities.length === 0) return 0;

        return activities.reduce((sum, a) => {
            if (!financialUtils.isPaymentActivity(a)) return sum;
            if (!financialUtils.isInRange(a.created_at, start, end)) return sum;

            const amount = financialUtils.parsePaymentAmount(a.details);
            return amount !== null ? sum + amount : sum;
        }, 0);
    },

    /**
     * Fallback: total collected from invoices whose payment date falls in [start, end].
     * Uses paid_at, or created_at if paid, or updated_at for partial (when payment was last recorded).
     * Date-only strings are treated as local so "today" works in all timezones.
     */
    getCollectedFromInvoices(
        invoices: {
            paid_at?: string;
            created_at: string;
            amount_paid?: number;
            amount?: number;
            status: string;
        }[],
        start: Date,
        end: Date
    ): number {
        if (!invoices?.length) return 0;
        return invoices.reduce((sum, inv) => {
            // Priority: Explicit paid_at Date
            // Fallback: created_at ONLY if status is 'paid' (legacy data)
            // Partial payments without paid_at are excluded from period-specific collected unless logs are used
            const paidAt = inv.paid_at || (inv.status === "paid" ? inv.created_at : null);
            
            if (!paidAt || !financialUtils.isInRange(paidAt, start, end)) return sum;
            
            const paidValue = Number(inv.amount_paid || 0) > 0 
                ? Number(inv.amount_paid) 
                : (inv.status === "paid" ? Number(inv.amount || 0) : 0);
                
            return sum + paidValue;
        }, 0);
    },

    /**
     * Source of truth for total accounts receivable (Outstanding).
     * Includes all sent or partial invoices that are not void or fully paid.
     */
    getOutstandingBalance(
        invoices: {
            amount: number;
            amount_paid?: number;
            status: string;
        }[]
    ): number {
        return (invoices || []).reduce((sum, inv) => {
            if (inv.status === "void" || inv.status === "paid" || inv.status === "draft") return sum;
            const balance = Number(inv.amount || 0) - Number(inv.amount_paid || 0);
            return sum + Math.max(0, balance);
        }, 0);
    },

    /**
     * Gets start/end of period dates for calendar logic.
     * Weeks start on Monday. All boundaries are local-time midnight for simplicity.
     */
    getPeriodRange(mode: "day" | "today" | "week" | "month" | "year" | "total") {
        const now = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        if (mode === "day" || mode === "today") {
            // Full calendar day so payments anytime today count (end = 23:59:59.999)
            const endOfToday = new Date(start);
            endOfToday.setHours(23, 59, 59, 999);
            return { start, end: endOfToday };
        } else if (mode === "week") {
            const day = now.getDay(); // 0 (Sun) - 6 (Mon)
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // shift to Monday
            start.setDate(diff);
        } else if (mode === "month") {
            start.setDate(1);
        } else if (mode === "year") {
            start.setMonth(0, 1);
        } else if (mode === "total") {
            // Business decision: total reporting starts Jan 1, 2024
            return { start: new Date(2024, 0, 1), end: now };
        }
        return { start, end: now };
    },

    /**
     * Computes the total direct costs of a project from its financials
     * (supplier, shipping, customs, additional_expense and dynamic cost_items).
     */
    computeProjectCosts(financials?: Financials | null): number {
        if (!financials) return 0;
        const baseCosts =
            Number(financials.supplier_cost || 0) +
            Number(financials.shipping_cost || 0) +
            Number(financials.customs_fee || 0) +
            Number(financials.additional_expense || 0);

        const dynamicCosts =
            financials.cost_items?.reduce(
                (sum, item) => sum + (Number(item.amount) || 0),
                0
            ) || 0;

        return baseCosts + dynamicCosts;
    },

    /**
     * Computes the affiliate commission amount for a project, or 0 if none.
     */
    computeCommissionAmount(project: Project): number {
        if (!project.affiliate_id) return 0;
        const rate = Number(project.affiliate_commission_rate || 0);
        if (!Number.isFinite(rate) || rate <= 0) return 0;

        const salePrice = Number(project.financials?.selling_price || project.budget || 0);
        if (salePrice <= 0) return 0;

        if (project.affiliate_commission_type === "fixed") {
            return rate;
        }
        return (salePrice * rate) / 100;
    },

    /**
     * Computes the gross sale price used for margin calculations.
     */
    getSalePrice(project: Project): number {
        return Number(project.financials?.selling_price || project.budget || 0);
    },

    /**
     * Computes absolute and percentage margin for a project, excluding tax.
     */
    computeProjectMargin(project: Project): { marginAmount: number; marginPercent: number } {
        const salePrice = financialUtils.getSalePrice(project);
        if (salePrice <= 0) {
            return { marginAmount: 0, marginPercent: 0 };
        }

        const directCosts = financialUtils.computeProjectCosts(project.financials);
        const commission = financialUtils.computeCommissionAmount(project);

        const marginAmount = salePrice - directCosts - commission;
        const marginPercent = (marginAmount / salePrice) * 100;

        return { marginAmount, marginPercent };
    },

    /**
     * Simple helper for global cash-based profit.
     */
    computeGlobalProfit(collected: number, expenses: number): number {
        return Number(collected || 0) - Number(expenses || 0);
    },
};
