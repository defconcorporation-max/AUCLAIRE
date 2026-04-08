import { useQuery } from '@tanstack/react-query';
import { apiInvoices } from '@/services/apiInvoices';
import { apiExpenses } from '@/services/apiExpenses';
import { apiProjects } from '@/services/apiProjects';
import { apiClients } from '@/services/apiClients';
import { financialUtils } from '@/utils/financialUtils';
import { useMemo } from 'react';

export interface ExtrapolationMonth {
    name: string;
    invoiced: number;    // Réel
    target: number;      // Objectif calculé
    collected: number;
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
        const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juill.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

        // 1. Calculer les données réelles pour TOUS les mois jusqu'à aujourd'hui
        const fullHistory: { invoiced: number, collected: number }[] = [];
        for (let i = 0; i <= currentMonthIndex; i++) {
            const monthStart = new Date(now.getFullYear(), i, 1);
            const monthEnd = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59);
            const { invoicedTotal, cashCollected } = financialUtils.calculateMetrics(invoices, expenses, monthStart, monthEnd);
            fullHistory.push({ invoiced: invoicedTotal, collected: cashCollected });
        }

        // 2. Calculer la croissance basée UNIQUEMENT sur les mois terminés (excluant avril)
        let totalGrowth = 0;
        let growthCounts = 0;
        // On s'arrête à currentMonthIndex - 1 (Mars si on est en Avril)
        for (let i = 1; i < currentMonthIndex; i++) {
            const prev = fullHistory[i-1].invoiced;
            if (prev > 0) {
                totalGrowth += (fullHistory[i].invoiced - prev) / prev;
                growthCounts++;
            }
        }
        const avgMonthlyGrowth = growthCounts > 0 ? (totalGrowth / growthCounts) : 0.15;

        // 3. Construire le tunnel de prévision (Target) sur toute l'année
        const yearlyExtrapolation: ExtrapolationMonth[] = [];
        
        // Base de départ pour les targets : Premier mois ou moyenne
        let currentTarget = fullHistory[0].invoiced || 10000; 

        for (let i = 0; i < 12; i++) {
            const isPast = i < currentMonthIndex;
            const isCurrent = i === currentMonthIndex;
            const isFuture = i > currentMonthIndex;

            const realData = isPast || isCurrent ? fullHistory[i] : null;

            yearlyExtrapolation.push({
                name: monthNames[i],
                invoiced: realData?.invoiced || 0,
                collected: realData?.collected || 0,
                target: Math.round(currentTarget),
                isProjected: isFuture,
                isCurrent: isCurrent
            });

            // Incrémenter le target pour le mois suivant
            currentTarget = currentTarget * (1 + avgMonthlyGrowth);
        }

        // Calcul additionnel pour le header
        const currentMonthTarget = yearlyExtrapolation[currentMonthIndex].target;
        const currentMonthReal = yearlyExtrapolation[currentMonthIndex].invoiced;
        const performanceDelta = currentMonthTarget > 0 ? Math.round(((currentMonthReal - currentMonthTarget) / currentMonthTarget) * 100) : 0;

        const { start, end } = financialUtils.getPeriodRange(timeframe);
        const { start: pStart, end: pEnd } = financialUtils.getPreviousPeriodRange(timeframe);
        const current = financialUtils.calculateMetrics(invoices, expenses, start, end);
        const previous = financialUtils.calculateMetrics(invoices, expenses, pStart, pEnd);

        return {
            trendData: {
                collected: { value: current.cashCollected, trend: performanceDelta, label: 'Objectif Mois' },
                invoiced: { value: current.invoicedTotal, trend: 0, label: timeframe },
                clients: { value: clients.length, trend: 0, label: 'total' }
            },
            performanceDelta,
            yearlyExtrapolation,
            avgMonthlyGrowth: Math.round(avgMonthlyGrowth * 100)
        };
    }, [invoices, expenses, projects, clients, timeframe]);

    return {
        isLoading: iLoad || eLoad || pLoad || cLoad,
        ...analytics
    };
}
