import { useQuery } from '@tanstack/react-query';
import { apiInvoices } from '@/services/apiInvoices';
import { apiExpenses } from '@/services/apiExpenses';
import { apiProjects } from '@/services/apiProjects';
import { apiClients } from '@/services/apiClients';
import { financialUtils } from '@/utils/financialUtils';

export function useAnalyticsData(timeframe: 'day' | 'week' | 'month' | 'total') {
    const { data: invoices = [], isLoading: iLoad } = useQuery({ queryKey: ['invoices'], queryFn: apiInvoices.getAll });
    const { data: expenses = [], isLoading: eLoad } = useQuery({ queryKey: ['expenses'], queryFn: apiExpenses.getAll });
    const { data: projects = [], isLoading: pLoad } = useQuery({ queryKey: ['projects'], queryFn: apiProjects.getAll });
    const { data: clients = [], isLoading: cLoad } = useQuery({ queryKey: ['clients'], queryFn: apiClients.getAll });

    const isLoading = iLoad || eLoad || pLoad || cLoad;

    // 1. Current Period Trends (KPIs)
    const { start: currentStart, end: currentEnd } = financialUtils.getPeriodRange(timeframe);
    const { start: previousStart, end: previousEnd } = financialUtils.getPreviousPeriodRange(timeframe);

    const currentMetrics = financialUtils.calculateMetrics(invoices, expenses, currentStart, currentEnd);
    const previousMetrics = financialUtils.calculateMetrics(invoices, expenses, previousStart, previousEnd);

    const calcTrend = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
    };

    const trendData = {
        collected: { value: currentMetrics.collected, trend: calcTrend(currentMetrics.collected, previousMetrics.collected), label: timeframe },
        invoiced: { value: currentMetrics.invoiced, trend: calcTrend(currentMetrics.invoiced, previousMetrics.invoiced), label: timeframe },
        clients: { 
            value: clients.filter(c => {
                const d = new Date(c.created_at);
                return d >= currentStart && d <= currentEnd;
            }).length,
            trend: 0, 
            label: timeframe 
        }
    };

    // 2. Weighted Pipeline (Project Potential)
    const statusWeights: Record<string, number> = {
        'waiting_for_approval': 0.1,
        'approved_for_production': 0.4,
        'production': 0.8,
        'delivery': 0.95,
        'completed': 1.0,
        'cancelled': 0
    };

    const weightedPipeline = projects.reduce((acc, p) => {
        const weight = statusWeights[p.status] || 0.2;
        const val = Number(p.financials?.selling_price || p.budget || 0);
        return acc + (val * weight);
    }, 0);

    // 3. Short Term 3-Month Matrix Forecast
    const distributionMatrix = {
        'waiting_for_approval': [0.1, 0.4, 0.5],
        'approved_for_production': [0.3, 0.5, 0.2],
        'production': [0.6, 0.3, 0.1],
        'delivery': [0.9, 0.1, 0],
        'completed': [1, 0, 0]
    };

    const forecast = [0, 1, 2].map(m => {
        const d = new Date();
        d.setMonth(d.getMonth() + m);
        const name = d.toLocaleDateString('fr-FR', { month: 'short' });
        
        let mInvoiced = 0;
        let mCollected = 0;

        projects.forEach(p => {
            const matrix = distributionMatrix[p.status as keyof typeof distributionMatrix] || [0.3, 0.4, 0.3];
            const val = Number(p.financials?.selling_price || p.budget || 0);
            mInvoiced += val * matrix[m];
            mCollected += (val * matrix[m]) * 0.85; // Est. collection rate
        });

        return { name, invoiced: Math.round(mInvoiced), collected: Math.round(mCollected), expenses: Math.round(mCollected * 0.4) };
    });

    // 4. Yearly Growth & Extrapolation Engine
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-indexed
    const monthlyHistory = Array.from({ length: currentMonth + 1 }, (_, i) => {
        const start = new Date(currentYear, i, 1);
        const end = new Date(currentYear, i + 1, 0, 23, 59, 59);
        const metrics = financialUtils.calculateMetrics(invoices, expenses, start, end);
        return { month: i, ...metrics };
    });

    // Calculate Monthly Average Growth Rate (Safe CAGR approach)
    let avgGrowthRate = 0;
    if (monthlyHistory.length > 1) {
        let totalGrowth = 0;
        let growthPoints = 0;
        for (let i = 1; i < monthlyHistory.length; i++) {
            const prev = monthlyHistory[i-1].invoiced || 1; // avoid div by zero
            const curr = monthlyHistory[i].invoiced;
            totalGrowth += (curr - prev) / prev;
            growthPoints++;
        }
        avgGrowthRate = totalGrowth / growthPoints;
    }

    // Limit growth to a realistic range (-20% to +50% per month for projections)
    const safeGrowthRate = Math.max(-0.2, Math.min(0.5, avgGrowthRate));

    const yearlyExtrapolation = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(currentYear, i, 1);
        const name = date.toLocaleDateString('fr-FR', { month: 'short' });
        
        if (i <= currentMonth) {
            // Real Data
            const hist = monthlyHistory[i];
            return { name, invoiced: hist.invoiced, collected: hist.collected, expenses: hist.expenses, isProjected: false };
        } else {
            // Projected Data based on growth
            const monthsForward = i - currentMonth;
            const lastRealInvoiced = monthlyHistory[currentMonth].invoiced;
            const projectedInvoiced = lastRealInvoiced * Math.pow(1 + safeGrowthRate, monthsForward);
            
            return { 
                name, 
                invoiced: Math.round(projectedInvoiced), 
                collected: Math.round(projectedInvoiced * 0.8), // 80% collection efficiency
                expenses: Math.round(projectedInvoiced * 0.35), // 35% margin est
                isProjected: true 
            };
        }
    });

    return {
        isLoading,
        trendData,
        weightedPipeline,
        forecast,
        yearlyExtrapolation,
        avgMonthlyGrowth: Math.round(safeGrowthRate * 100)
    };
}
