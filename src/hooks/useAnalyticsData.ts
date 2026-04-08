import { useQuery } from '@tanstack/react-query';
import { apiInvoices } from '@/services/apiInvoices';
import { apiExpenses } from '@/services/apiExpenses';
import { apiProjects } from '@/services/apiProjects';
import { apiClients } from '@/services/apiClients';
import { financialUtils } from '@/utils/financialUtils';
import { useMemo } from 'react';

export interface ExtrapolationMonth {
    name: string;
    actual: number;      // Réel jusque là
    estimated: number | null; // Estimation fin de mois (uniquement pour le mois en cours)
    statusQuo: number;   // Courbe "Si on continue comme ça"
    target20: number;    // Courbe "+20% par mois"
    isProjected: boolean;
    isCurrent: boolean;
}

export function useAnalyticsData(timeframe: 'day' | 'week' | 'month' | 'total' = 'month') {
    const { data: invoices = [], isLoading: iLoad } = useQuery({ queryKey: ['invoices'], queryFn: apiInvoices.getAll });
    const { data: expenses = [], isLoading: eLoad } = useQuery({ queryKey: ['expenses'], queryFn: apiExpenses.getAll });
    const { data: projects = [], isLoading: pLoad } = useQuery({ queryKey: ['projects'], queryFn: apiProjects.getAll });
    const { data: clients = [], isLoading: cLoad } = useQuery({ queryKey: ['clients'], queryFn: apiClients.getAll });

    const analytics = useMemo(() => {
        const now = new Date();
        const currentMonthIndex = now.getMonth();
        const currentDay = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), currentMonthIndex + 1, 0).getDate();
        const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juill.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

        // 1. Données réelles mensuelles
        const fullHistory: { invoiced: number, collected: number }[] = [];
        for (let i = 0; i <= currentMonthIndex; i++) {
            const monthStart = new Date(now.getFullYear(), i, 1);
            const monthEnd = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59);
            const { invoicedTotal, cashCollected } = financialUtils.calculateMetrics(invoices, expenses, monthStart, monthEnd);
            fullHistory.push({ invoiced: invoicedTotal, collected: cashCollected });
        }

        // 2. Calcul des croissances
        let totalGrowth = 0;
        let growthCounts = 0;
        for (let i = 1; i < currentMonthIndex; i++) {
            const prev = fullHistory[i-1].invoiced;
            if (prev > 0) {
                totalGrowth += (fullHistory[i].invoiced - prev) / prev;
                growthCounts++;
            }
        }
        const avgGrowth = growthCounts > 0 ? (totalGrowth / growthCounts) : 0.10;

        // 3. Construction des trajectoires
        const yearlyExtrapolation: ExtrapolationMonth[] = [];
        let statusQuoRunner = fullHistory[0].invoiced;
        let target20Runner = fullHistory[0].invoiced;

        for (let i = 0; i < 12; i++) {
            const isCurrent = i === currentMonthIndex;
            const isFuture = i > currentMonthIndex;
            const isPast = i < currentMonthIndex;

            const multiplier = daysInMonth / currentDay;
            const estimatedVal = isCurrent ? fullHistory[i].invoiced * multiplier : null;

            yearlyExtrapolation.push({
                name: monthNames[i],
                actual: (isPast || isCurrent) ? fullHistory[i].invoiced : 0,
                estimated: estimatedVal,
                statusQuo: Math.round(statusQuoRunner),
                target20: Math.round(target20Runner),
                isProjected: isFuture,
                isCurrent: isCurrent
            });

            statusQuoRunner = statusQuoRunner * (1 + avgGrowth);
            target20Runner = target20Runner * 1.20;
        }

        const currentEstim = yearlyExtrapolation[currentMonthIndex].estimated || 0;
        const currentSQ = yearlyExtrapolation[currentMonthIndex].statusQuo;
        const perfVsSQ = currentSQ > 0 ? Math.round(((currentEstim - currentSQ) / currentSQ) * 100) : 0;

        const { start, end } = financialUtils.getPeriodRange(timeframe);
        const current = financialUtils.calculateMetrics(invoices, expenses, start, end);

        return {
            trendData: {
                collected: { value: current.cashCollected, trend: perfVsSQ, label: 'vs Statu Quo' },
                invoiced: { value: current.invoicedTotal, trend: 0, label: timeframe },
                clients: { value: clients.length, trend: 0, label: 'total' }
            },
            performanceDelta: perfVsSQ,
            yearlyExtrapolation,
            avgMonthlyGrowth: Math.round(avgGrowth * 100),
            estimatedCurrentMonth: currentEstim
        };
    }, [invoices, expenses, projects, clients, timeframe]);

    return {
        isLoading: iLoad || eLoad || pLoad || cLoad,
        ...analytics
    };
}
