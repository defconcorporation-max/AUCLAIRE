export const financialUtils = {
    /**
     * Calculates the total amount collected from a list of activity logs within a date range.
     * This is the source of truth for "when" money actually arrived.
     */
    getCollectedFromLogs: (activities: any[], start: Date, end: Date) => {
        return activities
            .filter(a => {
                const date = new Date(a.created_at);
                return a.action === 'financial' && 
                       a.details.includes('Paiement enregistré') &&
                       date >= start && 
                       date <= end;
            })
            .reduce((sum, a) => {
                const match = a.details.match(/Paiement enregistré: \+?(-?\d+)\$/);
                return sum + (match ? parseInt(match[1]) : 0);
            }, 0);
    },

    /**
     * Gets start of period dates for calendar logic
     */
    getPeriodRange: (mode: 'day' | 'today' | 'week' | 'month' | 'total') => {
        const now = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        if (mode === 'day' || mode === 'today') {
            // start is already correctly set to 00:00:00
        } else if (mode === 'week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
        } else if (mode === 'month') {
            start.setDate(1);
        } else if (mode === 'total') {
            return { start: new Date(2024, 0, 1), end: now };
        }

        return { start, end: now };
    }
};
