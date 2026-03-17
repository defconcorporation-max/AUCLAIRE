import { ActivityLog } from "@/services/apiActivities";

// Shared, robust parsing and date helpers for all financial analytics

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
     * Utility: checks whether a given ISO date string falls within [start, end].
     * Used to keep all date-range checks consistent.
     */
    isInRange(dateStr: string, start: Date, end: Date): boolean {
        const d = new Date(dateStr);
        return d >= start && d <= end;
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
     * Gets start/end of period dates for calendar logic.
     * Weeks start on Monday. All boundaries are local-time midnight for simplicity.
     */
    getPeriodRange(mode: "day" | "today" | "week" | "month" | "year" | "total") {
        const now = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        if (mode === "day" || mode === "today") {
            // start is already correctly set to 00:00:00 local
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
};
