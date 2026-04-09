import { useQuery } from '@tanstack/react-query';
import { apiInvoices } from '@/services/apiInvoices';
import { apiExpenses } from '@/services/apiExpenses';
import { apiProjects } from '@/services/apiProjects';
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

export interface StrategicMetrics {
    closingRate: number;      // % de projets gagnés
    avgSalesCycle: number;    // Jours moyens pour closer
    avgMarkup: number;        // Coefficient moyen (Vente/Coût)
    cashRunway: number;       // Mois de survie cas de 0 ventes
    totalCashAvailable: number; // Cash - Dépenses
}

export function useAnalyticsData(timeframe: 'day' | 'week' | 'month' | 'total' = 'month') {
    const { data: invoices = [], isLoading: iLoad } = useQuery({ queryKey: ['invoices'], queryFn: apiInvoices.getAll });
    const { data: expenses = [], isLoading: eLoad } = useQuery({ queryKey: ['expenses'], queryFn: apiExpenses.getAll });
    const { data: projects = [], isLoading: pLoad } = useQuery({ queryKey: ['projects'], queryFn: apiProjects.getAll });

    const analytics = useMemo(() => {
        const now = new Date();
        const currentMonthIndex = now.getMonth();
        const currentDay = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), currentMonthIndex + 1, 0).getDate();
        const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juill.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

        // 1. Métriques Réelles par mois
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

            let statusQuoVal = 0;
            if (isPast) {
                statusQuoVal = fullHistory[i].invoiced;
            } else if (isCurrent) {
                // Pour le mois actuel dans le status quo, on montre l'estimation basée sur le rythme actuel
                statusQuoVal = Math.round(estimatedCurrentMonth);
            } else {
                // Pour le futur, on part de l'estimation du mois actuel et on ajoute la progression moyenne
                const monthsFromNow = i - currentMonthIndex;
                statusQuoVal = Math.round(estimatedCurrentMonth + (monthsFromNow * avgMonthlyIncrease));
            }

            let target20Val = 0;
            if (isPast) {
                target20Val = fullHistory[i].invoiced;
            } else if (isCurrent) {
                target20Val = Math.max(Math.round(lastCompletedMonthVal * 1.20), Math.round(estimatedCurrentMonth));
            } else {
                const monthsAheadFromCurrent = i - currentMonthIndex;
                target20Val = Math.round(startingPointForFutureEvo20 * Math.pow(1.20, monthsAheadFromCurrent));
            }

            totalYearlyStatusQuo += statusQuoVal;
            totalYearlyEvo20 += target20Val;

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

        // --- CALCUL DES MÉTRIQUES STRATÉGIQUES ---
        const validProjects = projects.filter(p => p.status !== 'cancelled');
        const closedProjects = validProjects.filter(p => ['approved_for_production', 'production', 'delivery', 'completed'].includes(p.status));
        const closingRate = validProjects.length > 0 ? (closedProjects.length / validProjects.length) * 100 : 0;

        // Délai de vente moyen
        let totalSalesCycleDays = 0;
        let salesCycleCount = 0;
        invoices.forEach(inv => {
            // Utiliser la date du projet jointe si disponible
            const projectCreatedDate = inv.project?.created_at;
            if (inv.status === 'paid' && inv.paid_at && projectCreatedDate) {
                const diff = new Date(inv.paid_at).getTime() - new Date(projectCreatedDate).getTime();
                totalSalesCycleDays += diff / (1000 * 60 * 60 * 24);
                salesCycleCount++;
            }
        });
        const avgSalesCycle = salesCycleCount > 0 ? Math.round(totalSalesCycleDays / salesCycleCount) : 0;

        // Markup moyen (Coefficient)
        let totalMarkup = 0;
        let markupCount = 0;
        projects.forEach(p => {
            const sale = Number(p.financials?.selling_price || p.budget || 0);
            
            // Calculer le coût total à partir des cost_items si supplier_cost est vide
            let cost = Number(p.financials?.supplier_cost || 0);
            if (cost === 0 && p.financials?.cost_items) {
                cost = (p.financials.cost_items as { amount: number }[]).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            }

            if (sale > 0 && cost > 0) {
                totalMarkup += sale / cost;
                markupCount++;
            }
        });
        const avgMarkup = markupCount > 0 ? (totalMarkup / markupCount) : 0;

        // Santé de Trésorerie
        const totalCollected = invoices.reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0);
        const totalSpent = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
        const cashBalance = totalCollected - totalSpent;
        const elapsedMonths = Math.max(1, currentMonthIndex + 1);
        const avgMonthlyBurn = totalSpent / elapsedMonths;
        // Si pas de dépenses, on considère une santé excellente (99+ mois)
        const cashRunway = avgMonthlyBurn > 0 ? (cashBalance / avgMonthlyBurn) : (cashBalance > 0 ? 99 : 0);

        return {
            performanceDelta: totalYearlyStatusQuo > 0 ? Math.round(((totalYearlyEvo20 - totalYearlyStatusQuo) / totalYearlyStatusQuo) * 100) : 0,
            yearlyExtrapolation,
            estimatedCurrentMonth,
            totalYearlyStatusQuo,
            totalYearlyEvo20,
            strategicMetrics: {
                closingRate,
                avgSalesCycle,
                avgMarkup: Number(avgMarkup.toFixed(2)),
                cashRunway: Number(cashRunway.toFixed(1)),
                totalCashAvailable: cashBalance
            }
        };
    }, [invoices, expenses, projects, timeframe]);

    return {
        isLoading: iLoad || eLoad || pLoad,
        ...analytics
    };
}
