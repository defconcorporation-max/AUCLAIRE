import { useQuery } from '@tanstack/react-query';
import { apiInvoices } from '@/services/apiInvoices';
import { apiExpenses } from '@/services/apiExpenses';
import { apiProjects } from '@/services/apiProjects';
import { apiClients } from '@/services/apiClients';
import { financialUtils } from '@/utils/financialUtils';
import { useMemo } from 'react';

export interface ExtrapolationMonth {
    name: string;
    actual: number;      
    estimated: number | null; 
    statusQuo: number;   
    target20: number;    
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

        const fullHistory: { invoiced: number, collected: number }[] = [];
        for (let i = 0; i <= currentMonthIndex; i++) {
            const monthStart = new Date(now.getFullYear(), i, 1);
            const monthEnd = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59);
            const { invoicedTotal, cashCollected } = financialUtils.calculateMetrics(invoices, expenses, monthStart, monthEnd);
            fullHistory.push({ invoiced: invoicedTotal, collected: cashCollected });
        }

        const lastCompletedMonthVal = fullHistory[currentMonthIndex - 1]?.invoiced || 0;
        const currentMonthInvoiced = fullHistory[currentMonthIndex].invoiced;
        const multiplier = daysInMonth / currentDay;
        const estimatedCurrentMonth = currentMonthInvoiced * multiplier;

        // 1. Calcul de l'évolution moyenne réelle (Historique)
        let totalGrowth = 0;
        let growthCounts = 0;
        for (let i = 1; i < currentMonthIndex; i++) {
            const prev = fullHistory[i - 1].invoiced;
            if (prev > 0) {
                const g = (fullHistory[i].invoiced - prev) / prev;
                // Cap à 100% par mois pour eviter les explosions de 400M
                totalGrowth += Math.min(g, 1.0); 
                growthCounts++;
            }
        }
        const avgHistoricalGrowth = growthCounts > 0 ? (totalGrowth / growthCounts) : 0.15;

        // 2. Points de départ pour les trajectoires (Partent du dernier mois complet)
        const startingPointForFutureEvo20 = Math.max(lastCompletedMonthVal * 1.20, estimatedCurrentMonth);
        const startingPointForFutureSQ = Math.max(lastCompletedMonthVal * (1 + avgHistoricalGrowth), estimatedCurrentMonth);

        // 3. Construction des trajectoires
        const yearlyExtrapolation: ExtrapolationMonth[] = [];
        let totalYearlyStatusQuo = 0;
        let totalYearlyEvo20 = 0;
        
        for (let i = 0; i < 12; i++) {
            const isCurrent = i === currentMonthIndex;
            const isFuture = i > currentMonthIndex;
            const isPast = i < currentMonthIndex;

            // --- CALCUL STATUS QUO (Tendance d'évolution réelle) ---
            let statusQuoVal = 0;
            if (isPast) {
                statusQuoVal = fullHistory[i].invoiced;
            } else if (isCurrent) {
                // Pour avril, le statu quo suit la tendance historique moyenne calculée à partir de mars
                statusQuoVal = Math.round(lastCompletedMonthVal * (1 + avgHistoricalGrowth));
            } else {
                // Projection future : Prolonge la tendance historique à partir de mars ou estimation avril
                const monthsAheadFromCurrent = i - currentMonthIndex;
                statusQuoVal = Math.round(startingPointForFutureSQ * Math.pow(1 + avgHistoricalGrowth, monthsAheadFromCurrent));
            }

            // --- CALCUL EVO 20 (Objectif Ambitieux) ---
            let target20Val = 0;
            if (isPast) {
                target20Val = fullHistory[i].invoiced;
            } else if (isCurrent) {
                target20Val = Math.max(Math.round(lastCompletedMonthVal * 1.20), Math.round(estimatedCurrentMonth));
            } else {
                const monthsAheadFromCurrent = i - currentMonthIndex;
                target20Val = Math.round(startingPointForFutureEvo20 * Math.pow(1.20, monthsAheadFromCurrent));
            }

            totalYearlyStatusQuo += (isPast ? fullHistory[i].invoiced : statusQuoVal);
            totalYearlyEvo20 += (isPast ? fullHistory[i].invoiced : target20Val);

            yearlyExtrapolation.push({
                name: monthNames[i],
                actual: (isPast || isCurrent) ? fullHistory[i].invoiced : 0,
                estimated: isCurrent ? estimatedCurrentMonth : null,
                statusQuo: statusQuoVal,
                target20: target20Val,
                isProjected: isFuture,
                isCurrent: isCurrent
            });
        }

        const currentSQ = yearlyExtrapolation[currentMonthIndex].statusQuo;
        const perfVsSQ = currentSQ > 0 ? Math.round(((estimatedCurrentMonth - currentSQ) / currentSQ) * 100) : 0;

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
            estimatedCurrentMonth,
            totalYearlyStatusQuo,
            totalYearlyEvo20
        };
    }, [invoices, expenses, projects, clients, timeframe]);

    return {
        isLoading: iLoad || eLoad || pLoad || cLoad,
        ...analytics
    };
}
