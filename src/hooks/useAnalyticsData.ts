import { useQuery } from '@tanstack/react-query';
import { apiProjects, ProjectStatus } from '@/services/apiProjects';
import { apiInvoices } from '@/services/apiInvoices';
import { apiExpenses } from '@/services/apiExpenses';
import { apiClients } from '@/services/apiClients';
import { financialUtils } from '@/utils/financialUtils';

export interface ForecastPoint {
    name: string;
    invoiced: number;
    collected: number;
    expenses: number;
}

export function useAnalyticsData(timeframe: 'day' | 'week' | 'month' | 'total') {
    // 1. Fetch all data
    const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: apiProjects.getAll });
    const invoicesQuery = useQuery({ queryKey: ['invoices'], queryFn: apiInvoices.getAll });
    const expensesQuery = useQuery({ queryKey: ['expenses'], queryFn: apiExpenses.getAll });
    const clientsQuery = useQuery({ queryKey: ['clients'], queryFn: apiClients.getAll });

    const isLoading = projectsQuery.isLoading || invoicesQuery.isLoading || expensesQuery.isLoading || clientsQuery.isLoading;
    const projects = projectsQuery.data || [];
    const invoices = invoicesQuery.data || [];
    const expenses = expensesQuery.data || [];
    const clients = clientsQuery.data || [];

    if (isLoading) return { isLoading: true };

    // ─── Trend Calculations ─────────────────────────────────
    const { start: startCurr } = financialUtils.getPeriodRange(timeframe);
    let startPrev = new Date(startCurr);
    let compareLabel = "";

    if (timeframe === 'day') {
        startPrev.setDate(startPrev.getDate() - 1);
        compareLabel = "hier";
    } else if (timeframe === 'week') {
        startPrev.setDate(startPrev.getDate() - 7);
        compareLabel = "semaine dernière";
    } else if (timeframe === 'month') {
        startPrev.setMonth(startPrev.getMonth() - 1);
        compareLabel = "mois dernier";
    } else {
        compareLabel = "total";
    }

    const { invoicedTotal, cashCollected, expensesTotal } = financialUtils.calculateMetrics(invoices, expenses, startCurr);
    const prevMetrics = financialUtils.calculateMetrics(invoices, expenses, startPrev, startCurr);

    const getClientsForRange = (start: Date, end: Date) => clients.filter(c => {
        const date = financialUtils.toLocalDate(c.created_at);
        return date >= start && date <= end;
    }).length;

    const currClients = getClientsForRange(startCurr, new Date());
    const prevClients = getClientsForRange(startPrev, startCurr);

    const calcTrend = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
    };

    const trendData = {
        collected: { value: cashCollected, trend: calcTrend(cashCollected, prevMetrics.cashCollected), label: compareLabel },
        invoiced: { value: invoicedTotal, trend: calcTrend(invoicedTotal, prevMetrics.invoicedTotal), label: compareLabel },
        expenses: { value: expensesTotal, trend: calcTrend(expensesTotal, prevMetrics.expensesTotal), label: compareLabel },
        profit: { value: cashCollected - expensesTotal, trend: calcTrend(cashCollected - expensesTotal, prevMetrics.cashCollected - prevMetrics.expensesTotal), label: compareLabel },
        clients: { value: currClients, trend: calcTrend(currClients, prevClients), label: compareLabel }
    };

    // ─── Matrix-Based Forecasting Engine ────────────────────
    const distributionMatrix: Record<ProjectStatus, { invoice: number[], collection: number[] }> = {
        'designing': { invoice: [0.2, 0.6, 0.2], collection: [0.1, 0.3, 0.6] },
        '3d_model': { invoice: [0.5, 0.5, 0], collection: [0.2, 0.5, 0.3] },
        'design_ready': { invoice: [0.8, 0.2, 0], collection: [0.4, 0.4, 0.2] },
        'waiting_for_approval': { invoice: [1, 0, 0], collection: [0.5, 0.5, 0] },
        'design_modification': { invoice: [0.4, 0.6, 0], collection: [0.2, 0.4, 0.4] },
        'approved_for_production': { invoice: [1, 0, 0], collection: [0.5, 0.5, 0] },
        'production': { invoice: [1, 0, 0], collection: [0.7, 0.3, 0] },
        'delivery': { invoice: [1, 0, 0], collection: [0.9, 0.1, 0] },
        'completed': { invoice: [1, 0, 0], collection: [1, 0, 0] },
        'cancelled': { invoice: [0, 0, 0], collection: [0, 0, 0] }
    };

    // Prepare Anchor Data for M0
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const realData = financialUtils.calculateMetrics(invoices, expenses, currentMonthStart);

    const forecast: ForecastPoint[] = [
        { name: "Ce mois", invoiced: realData.invoicedTotal, collected: realData.cashCollected, expenses: realData.expensesTotal },
        { name: "Mois +1", invoiced: 0, collected: 0, expenses: 0 },
        { name: "Mois +2", invoiced: 0, collected: 0, expenses: 0 }
    ];

    // Forecast Revenue & Collection from Pipeline (for M1 and M2 mostly)
    projects.forEach(p => {
        if (p.status === 'completed' || p.status === 'cancelled') return;
        const value = Number(p.financials?.selling_price || p.budget || 0);
        const matrix = distributionMatrix[p.status] || distributionMatrix['designing'];
        
        // M0 is already anchored with real data for current invoices, 
        // but pipeline projects can still contribute to collections in M0, M1, M2.
        // We only add pipeline projections to M1 and M2 to avoid double counting with current M0 invoices
        matrix.invoice.forEach((factor, i) => { if (i > 0 && forecast[i]) forecast[i].invoiced += value * factor; });
        matrix.collection.forEach((factor, i) => { if (i > 0 && forecast[i]) forecast[i].collected += value * factor; });
    });

    // Estimate future expenses based on average of last 3 months
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const historicalMetrics = financialUtils.calculateMetrics(invoices, expenses, threeMonthsAgo);
    const avgMonthlyExpenses = historicalMetrics.expensesTotal / 3;
    forecast[1].expenses = Math.round(avgMonthlyExpenses);
    forecast[2].expenses = Math.round(avgMonthlyExpenses);

    forecast.forEach(f => { f.invoiced = Math.round(f.invoiced); f.collected = Math.round(f.collected); });

    return {
        isLoading: false,
        trendData,
        forecast,
        weightedPipeline: Math.round(forecast.reduce((s, m) => s + m.invoiced, 0)),
        conversionRate: projects.length > 0 ? (projects.filter(p => !['cancelled', 'designing'].includes(p.status)).length / projects.length) * 100 : 0
    };
}
