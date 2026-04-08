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

        // 1. Récupérer l'historique réel
        const fullHistory: { invoiced: number, collected: number }[] = [];
        for (let i = 0; i <= currentMonthIndex; i++) {
            const monthStart = new Date(now.getFullYear(), i, 1);
            const monthEnd = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59);
            const { invoicedTotal, cashCollected } = financialUtils.calculateMetrics(invoices, expenses, monthStart, monthEnd);
            fullHistory.push({ invoiced: invoicedTotal, collected: cashCollected });
        }

        // 2. Calculer l'évolution LINÉAIRE (en dollars, pas en %)
        // On regarde combien de dollars on a gagné en moyenne par mois depuis janvier
        const firstMonthVal = fullHistory[0].invoiced;
        const lastCompletedMonthVal = fullHistory[currentMonthIndex - 1]?.invoiced || fullHistory[0].invoiced;
        
        // Augmentation totale en $ / nombre de mois passés
        const avgMonthlyDollarIncrease = currentMonthIndex > 0 
            ? (lastCompletedMonthVal - firstMonthVal) / currentMonthIndex 
            : 0;

        // 3. Construction des trajectoires réalistes
        const yearlyExtrapolation: ExtrapolationMonth[] = [];
        
        for (let i = 0; i < 12; i++) {
            const isCurrent = i === currentMonthIndex;
            const isFuture = i > currentMonthIndex;
            const isPast = i < currentMonthIndex;

            // Estimation avril (au prorata temporis)
            const multiplier = daysInMonth / currentDay;
            const estimatedVal = isCurrent ? fullHistory[i].invoiced * multiplier : null;

            // Statu Quo : Évolue linéairement à partir du premier mois
            // Formule : Premier Mois + (i * Augmentation Moyenne)
            const statusQuoVal = Math.round(firstMonthVal + (i * avgMonthlyDollarIncrease));

            // Target 20 : Commence REELLEMENT à partir du dernier mois complet
            let target20Val = 0;
            if (i < currentMonthIndex) {
                target20Val = fullHistory[i].invoiced; // Passé = Réel
            } else {
                // Futur = Dernier mois complet * 1.20 ^ nombre de mois d'écart
                const monthsAhead = i - (currentMonthIndex - 1);
                target20Val = Math.round(lastCompletedMonthVal * Math.pow(1.20, monthsAhead));
            }

            yearlyExtrapolation.push({
                name: monthNames[i],
                actual: (isPast || isCurrent) ? fullHistory[i].invoiced : 0,
                estimated: estimatedVal,
                statusQuo: statusQuoVal > 0 ? statusQuoVal : 0,
                target20: target20Val,
                isProjected: isFuture,
                isCurrent: isCurrent
            });
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
            estimatedCurrentMonth: currentEstim
        };
    }, [invoices, expenses, projects, clients, timeframe]);

    return {
        isLoading: iLoad || eLoad || pLoad || cLoad,
        ...analytics
    };
}
