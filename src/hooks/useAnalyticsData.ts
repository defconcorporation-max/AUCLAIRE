import { useQuery } from '@tanstack/react-query';
import { apiInvoices } from '@/services/apiInvoices';
import { apiExpenses } from '@/services/apiExpenses';
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

        const firstMonthVal = fullHistory[0].invoiced;
        const totalIncrease = lastCompletedMonthVal - firstMonthVal;
        const avgMonthlyIncrease = currentMonthIndex > 0 ? totalIncrease / currentMonthIndex : 0;

        const startingPointForFutureEvo20 = Math.max(lastCompletedMonthVal * 1.20, estimatedCurrentMonth);

        const yearlyExtrapolation: ExtrapolationMonth[] = [];
        let totalYearlyStatusQuo = 0;
        let totalYearlyEvo20 = 0;
        
        for (let i = 0; i < 12; i++) {
            const isCurrent = i === currentMonthIndex;
            const isFuture = i > currentMonthIndex;
            const isPast = i < currentMonthIndex;

            const statusQuoVal = isPast 
                ? fullHistory[i].invoiced 
                : Math.round(lastCompletedMonthVal + ((i - (currentMonthIndex - 1)) * avgMonthlyIncrease));

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
                statusQuo: statusQuoVal > 0 ? statusQuoVal : 0,
                target20: target20Val,
                isProjected: isFuture,
                isCurrent: isCurrent
            });
        }

        const currentSQ = yearlyExtrapolation[currentMonthIndex].statusQuo;
        const perfVsSQ = currentSQ > 0 ? Math.round(((estimatedCurrentMonth - currentSQ) / currentSQ) * 100) : 0;

        return {
            performanceDelta: perfVsSQ,
            yearlyExtrapolation,
            estimatedCurrentMonth,
            totalYearlyStatusQuo,
            totalYearlyEvo20
        };
    }, [invoices, expenses, timeframe]);

    return {
        isLoading: iLoad || eLoad,
        ...analytics
    };
}
