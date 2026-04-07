import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClients, Client } from '@/services/apiClients';
import { apiInvoices, Invoice } from '@/services/apiInvoices';
import { apiProjects, Project } from '@/services/apiProjects';
import { apiUsers } from '@/services/apiUsers';
import { apiExpenses, Expense } from '@/services/apiExpenses';
import { apiActivities, ActivityLog } from '@/services/apiActivities';
import { financialUtils } from '@/utils/financialUtils';
import { formatCurrency } from '@/lib/utils';
import type { TFunction } from 'i18next';

// ─── Status Parser (bilingual FR/EN) ───────────────────────────

const STATUS_NAMES: Record<string, string> = {
    'designing': 'designing', 'design': 'designing', 'conception': 'designing',
    '3d_model': '3d_model', '3d model': '3d_model', 'design 3d': '3d_model', 'modèle 3d': '3d_model', 'modele 3d': '3d_model',
    'design_ready': 'design_ready', 'design ready': 'design_ready', 'design prêt': 'design_ready', 'design pret': 'design_ready',
    'waiting_for_approval': 'waiting_for_approval', 'waiting for approval': 'waiting_for_approval', 'en attente': 'waiting_for_approval', "en attente d'approbation": 'waiting_for_approval',
    'design_modification': 'design_modification', 'design modification': 'design_modification', 'modification': 'design_modification', 'modification du design': 'design_modification',
    'approved_for_production': 'approved_for_production', 'approved for production': 'approved_for_production', 'approuvé pour production': 'approved_for_production', 'approuve pour production': 'approved_for_production',
    'production': 'production',
    'delivery': 'delivery', 'livraison': 'delivery',
    'completed': 'completed', 'terminé': 'completed', 'termine': 'completed', 'complété': 'completed', 'complete': 'completed',
    'cancelled': 'cancelled', 'annulé': 'cancelled', 'annule': 'cancelled',
};

export function parseTargetStatus(details: string): string | null {
    const d = details.toLowerCase().trim();
    const colonMatch = d.match(/(?:statut mis à jour|status updated)[:\s]+(.+)$/i);
    if (colonMatch) {
        const raw = colonMatch[1].replace(/_/g, ' ').trim();
        return STATUS_NAMES[raw] || null;
    }
    const arrowMatch = d.match(/→\s*(.+?)\s*$/i);
    if (arrowMatch) {
        const raw = arrowMatch[1].replace(/_/g, ' ').trim().toLowerCase();
        return STATUS_NAMES[raw] || null;
    }
    const frMatch = d.match(/à\s+(.+?)\s*(?:via|$)/i);
    if (frMatch) {
        const raw = frMatch[1].replace(/_/g, ' ').trim().toLowerCase();
        return STATUS_NAMES[raw] || null;
    }
    const enMatch = d.match(/to\s+(.+?)\s*(?:via|$)/i);
    if (enMatch) {
        const raw = enMatch[1].replace(/_/g, ' ').trim().toLowerCase();
        return STATUS_NAMES[raw] || null;
    }
    return null;
}

// ─── Types ──────────────────────────────────────────────────────

export type Timeframe = 'day' | 'week' | 'month' | 'total';

export interface TrendData {
    current: {
        collected: number;
        invoiced: number;
        avgOrder: number;
        clients: number;
        expenses: number;
        profit: number;
        outstanding: number;
    };
    previous: {
        collected: number;
        invoiced: number;
        avgOrder: number;
        clients: number;
        expenses: number;
        profit: number;
        outstanding: number;
    };
    label: string;
    growth: {
        collected: number;
        avgOrder: number;
        clients: number;
        profit: number;
        outstanding: number;
    };
}

export interface MonthlyDataPoint {
    month: string;
    collected: number;
    invoiced: number;
    expenses: number;
}

export interface SellerStat {
    id: string;
    name: string;
    role: string;
    projectCount: number;
    volume: number;
    commissions: number;
    cashCollected: number;
}

export interface ManufacturerStat {
    id: string;
    name: string;
    projectCount: number;
    volume: number;
    avgSpeed: number;
    qualityRate: number;
}

export interface ForecastPoint {
    name: string;
    projected: number;
}

export interface JewelryRow {
    name: string;
    count: number;
    revenue: number;
    costs: number;
    margin: number;
    marginPct: number;
}

export interface Insight {
    icon: string;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'danger' | 'info';
}

// ─── Main Hook ──────────────────────────────────────────────────

export function useAnalyticsData(timeframe: Timeframe) {
    const { t, i18n } = useTranslation();
    const localeTag = i18n.language.startsWith('en') ? 'en-CA' : 'fr-CA';

    const { data: projects = [], isLoading: pLoad } = useQuery({ queryKey: ['projects'], queryFn: apiProjects.getAll });
    const { data: clients = [], isLoading: cLoad } = useQuery({ queryKey: ['clients'], queryFn: apiClients.getAll });
    const { data: invoices = [], isLoading: iLoad } = useQuery({ queryKey: ['invoices'], queryFn: apiInvoices.getAll });
    const { data: users = [], isLoading: uLoad } = useQuery({ queryKey: ['users'], queryFn: apiUsers.getAll });
    const { data: expenses = [], isLoading: eLoad } = useQuery({ queryKey: ['expenses'], queryFn: apiExpenses.getAll });
    const { data: activities = [], isLoading: alLoad } = useQuery({ queryKey: ['activities'], queryFn: apiActivities.getAll });

    const isLoading = pLoad || cLoad || iLoad || uLoad || eLoad || alLoad;

    // ─── Computed Data ──────────────────────────────────────────

    const computed = useMemo(() => {
        if (isLoading) return null;

        const getSalePrice = (p: Project) => Number(p.financials?.selling_price || p.budget || 0);

        const PRODUCTION_READY_STATUSES = ['approved_for_production', 'production', 'delivery', 'completed'];
        const isProjectASale = (p: Project) => PRODUCTION_READY_STATUSES.includes(p.status) || invoices.some(inv => inv.project_id === p.id);

        // ─── Trend Data ─────────────────────────────────────────

        const { start: startCurr } = financialUtils.getPeriodRange(timeframe);
        const startPrev = new Date(startCurr);
        let trendLabel = "";

        if (timeframe === 'day') {
            startPrev.setDate(startPrev.getDate() - 1);
            trendLabel = t('analyticsPage.compareYesterday');
        } else if (timeframe === 'week') {
            startPrev.setDate(startPrev.getDate() - 7);
            trendLabel = t('analyticsPage.compareLastWeek');
        } else if (timeframe === 'month') {
            startPrev.setMonth(startPrev.getMonth() - 1);
            trendLabel = t('analyticsPage.compareLastMonth');
        } else {
            trendLabel = t('analyticsPage.compareTotal');
        }

        const getStatsForRange = (start: Date, end: Date) => {
            const periodInvoices = invoices.filter(inv => {
                const date = new Date(inv.created_at);
                return date >= start && date <= end && inv.status !== 'void';
            });
            const periodClients = clients.filter(c => {
                const date = new Date(c.created_at);
                return date >= start && date <= end;
            });
            const periodExpenses = expenses.filter(exp => {
                const date = new Date(exp.created_at);
                return date >= start && date <= end && exp.status !== 'cancelled';
            });

            const collected = financialUtils.getCollectedFromInvoices(invoices, start, end);
            const invoiced = periodInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
            const expAmount = periodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

            const count = periodInvoices.length;
            const avgOrder = count > 0 ? Math.round(invoiced / count) : 0;
            const profit = collected - expAmount;
            const outstanding = invoiced - collected;

            return { collected, invoiced, avgOrder, clients: periodClients.length, expenses: expAmount, profit, outstanding };
        };

        const current = getStatsForRange(startCurr, new Date());
        const previous = getStatsForRange(startPrev, startCurr);

        const calcGrowth = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return Math.round(((curr - prev) / prev) * 100);
        };

        const trendData: TrendData = {
            current,
            previous,
            label: trendLabel,
            growth: {
                collected: calcGrowth(current.collected, previous.collected),
                avgOrder: calcGrowth(current.avgOrder, previous.avgOrder),
                clients: calcGrowth(current.clients, previous.clients),
                profit: calcGrowth(current.profit, previous.profit),
                outstanding: calcGrowth(current.outstanding, previous.outstanding)
            }
        };

        // ─── Monthly Revenue Chart ──────────────────────────────

        const currentYear = new Date().getFullYear();
        const monthlyData: MonthlyDataPoint[] = [...Array(12)].map((_, monthIdx) => ({
            month: new Date(currentYear, monthIdx, 1).toLocaleDateString(localeTag, { month: 'short' }),
            collected: 0,
            invoiced: 0,
            expenses: 0,
        }));

        monthlyData.forEach((_, monthIdx) => {
            const start = new Date(currentYear, monthIdx, 1, 0, 0, 0, 0);
            const end = new Date(currentYear, monthIdx + 1, 0, 23, 59, 59, 999);
            monthlyData[monthIdx].collected = financialUtils.getCollectedFromInvoices(invoices, start, end);
        });

        invoices.forEach(inv => {
            if (inv.status === 'void') return;
            const createdDate = new Date(inv.created_at);
            if (createdDate.getFullYear() === currentYear) {
                monthlyData[createdDate.getMonth()].invoiced += Number(inv.amount || 0);
            }
        });

        expenses.forEach(exp => {
            if (exp.status === 'cancelled') return;
            const date = new Date(exp.created_at);
            if (date.getFullYear() === currentYear) {
                monthlyData[date.getMonth()].expenses += Number(exp.amount || 0);
            }
        });

        // ─── Seller Leaderboard ─────────────────────────────────

        const sellerStats: Record<string, SellerStat> = {};

        users.filter(u => (u.role as string) === 'affiliate' || (u.role as string) === 'admin' || (u.role as string) === 'ambassador').forEach(u => {
            sellerStats[u.id] = { id: u.id, name: u.full_name, role: u.role as string, projectCount: 0, volume: 0, commissions: 0, cashCollected: 0 };
        });

        projects.forEach(p => {
            if (!isProjectASale(p)) return;
            const responsibleId = p.sales_agent_id || p.affiliate_id;
            if (responsibleId && sellerStats[responsibleId]) {
                sellerStats[responsibleId].projectCount++;
                sellerStats[responsibleId].volume += getSalePrice(p);

                const pInvoices = invoices.filter(inv => inv.project_id === p.id && inv.status !== 'void');
                pInvoices.forEach(inv => {
                    const amountPaid = Number(inv.amount_paid || 0);
                    const paidValue = amountPaid > 0 ? amountPaid : (inv.status === 'paid' ? Number(inv.amount || 0) : 0);
                    sellerStats[responsibleId].cashCollected += paidValue;
                });
            }
        });

        (expenses as Expense[]).filter(e => e.category === 'commission' && e.status !== 'cancelled' && !e.description?.includes('Commission Payout')).forEach(e => {
            const recipientId = e.recipient_id;
            if (recipientId && sellerStats[recipientId]) {
                sellerStats[recipientId].commissions += Number(e.amount || 0);
            }
        });

        const leaderboard = Object.values(sellerStats)
            .filter(s => s.projectCount > 0)
            .sort((a, b) => b.volume - a.volume);

        // ─── Revenue Forecast ───────────────────────────────────

        const PROBABILITY_MAP: Record<string, number> = {
            designing: 0.1, '3d_model': 0.4, design_ready: 0.6,
            waiting_for_approval: 0.8, design_modification: 0.4,
            approved_for_production: 0.9, production: 1.0, delivery: 1.0, completed: 1.0,
        };

        const currentMonthIdx = new Date().getMonth();
        const forecast: ForecastPoint[] = [
            { name: t('analyticsPage.forecastMonth0'), projected: monthlyData[currentMonthIdx].collected },
            { name: t('analyticsPage.forecastMonth1'), projected: 0 },
            { name: t('analyticsPage.forecastMonth2'), projected: 0 },
        ];

        projects.forEach(p => {
            if (p.status === 'completed' || p.status === 'cancelled') return;
            const totalValue = getSalePrice(p);
            const paidSoFar = Number(p.financials?.paid_amount || 0);
            const remainingValue = Math.max(0, totalValue - paidSoFar);
            const prob = PROBABILITY_MAP[p.status] || 0;
            const weightedRemaining = remainingValue * prob;

            if (['production', 'delivery', 'approved_for_production'].includes(p.status)) {
                forecast[0].projected += weightedRemaining;
            } else if (['3d_model', 'design_ready', 'waiting_for_approval'].includes(p.status)) {
                forecast[1].projected += weightedRemaining;
            } else {
                forecast[2].projected += weightedRemaining;
            }
        });

        // ─── Velocity Data ──────────────────────────────────────

        const statusLogs = activities.filter(a => a.action === 'status_change');
        const velocityData: Record<string, { totalDays: number, count: number }> = {
            'designing': { totalDays: 0, count: 0 },
            '3d_model': { totalDays: 0, count: 0 },
            'approved_for_production': { totalDays: 0, count: 0 },
            'production': { totalDays: 0, count: 0 },
        };

        const logsByProject: Record<string, ActivityLog[]> = {};
        statusLogs.forEach(log => {
            if (log.project_id) {
                if (!logsByProject[log.project_id]) logsByProject[log.project_id] = [];
                logsByProject[log.project_id].push(log);
            }
        });

        Object.values(logsByProject).forEach(logs => {
            const sorted = logs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            for (let i = 0; i < sorted.length - 1; i++) {
                const start = new Date(sorted[i].created_at);
                const end = new Date(sorted[i + 1].created_at);
                const days = Math.max(0.1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                const targetStatus = parseTargetStatus(sorted[i].details);
                if (targetStatus && velocityData[targetStatus]) {
                    velocityData[targetStatus].totalDays += days;
                    velocityData[targetStatus].count++;
                }
            }
        });

        // ─── Manufacturer Scorecards ────────────────────────────

        const manufacturerStats: Record<string, { id: string, name: string, projectCount: number, volume: number, totalProdDays: number, prodCount: number, modCount: number }> = {};

        users.filter(u => u.role === 'manufacturer').forEach(u => {
            manufacturerStats[u.id] = { id: u.id, name: u.full_name, projectCount: 0, volume: 0, totalProdDays: 0, prodCount: 0, modCount: 0 };
        });

        projects.forEach(p => {
            if (p.manufacturer_id && manufacturerStats[p.manufacturer_id]) {
                manufacturerStats[p.manufacturer_id].projectCount++;
                manufacturerStats[p.manufacturer_id].volume += getSalePrice(p);

                const pLogs = logsByProject[p.id] || [];
                const sorted = pLogs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

                let prodStart: Date | null = null;
                let hasReachedProduction = false;
                sorted.forEach(log => {
                    const ts = parseTargetStatus(log.details);
                    if (ts === 'production' || ts === 'approved_for_production') {
                        prodStart = new Date(log.created_at);
                        hasReachedProduction = true;
                    }
                    if (ts === 'completed' && prodStart) {
                        const days = (new Date(log.created_at).getTime() - prodStart.getTime()) / (1000 * 60 * 60 * 24);
                        manufacturerStats[p.manufacturer_id!].totalProdDays += days;
                        manufacturerStats[p.manufacturer_id!].prodCount++;
                        prodStart = null;
                    }
                    if (ts === 'design_modification' && hasReachedProduction) {
                        manufacturerStats[p.manufacturer_id!].modCount++;
                    }
                });
            }
        });

        const manufacturerScorecard: ManufacturerStat[] = Object.values(manufacturerStats)
            .filter(s => s.projectCount > 0)
            .map(s => ({
                id: s.id,
                name: s.name,
                projectCount: s.projectCount,
                volume: s.volume,
                avgSpeed: s.prodCount > 0 ? Math.round(s.totalProdDays / s.prodCount) : 0,
                qualityRate: Math.max(0, 100 - (s.modCount / Math.max(1, s.prodCount) * 100))
            }))
            .sort((a, b) => b.qualityRate - a.qualityRate);

        // ─── Jewelry Profitability ──────────────────────────────

        const categories: Record<string, { count: number; revenue: number; costs: number }> = {};
        const autoDetect = (title: string): string => {
            const tl = title.toLowerCase();
            if (tl.includes('ring') || tl.includes('bague') || tl.includes('engagement') || tl.includes('chevalier')) return 'Bague';
            if (tl.includes('bracelet')) return 'Bracelet';
            if (tl.includes('pendant') || tl.includes('pendentif')) return 'Pendentif';
            if (tl.includes('earring') || tl.includes('boucle')) return "Boucles d'oreilles";
            if (tl.includes('necklace') || tl.includes('collier') || tl.includes('chain') || tl.includes('chaine')) return 'Collier';
            return 'Autre';
        };

        projects.forEach((p: Project) => {
            const cat = p.jewelry_type || autoDetect(p.title || '');
            if (!categories[cat]) categories[cat] = { count: 0, revenue: 0, costs: 0 };
            categories[cat].count++;
            const revenue = Number(p.financials?.selling_price || p.budget || 0);
            const costItemsSum = p.financials?.cost_items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
            const costs = Number(p.financials?.supplier_cost || 0) + Number(p.financials?.shipping_cost || 0) + Number(p.financials?.customs_fee || 0) + Number(p.financials?.additional_expense || 0) + costItemsSum;
            categories[cat].revenue += revenue;
            categories[cat].costs += costs;
        });

        const jewelryRows: JewelryRow[] = Object.entries(categories)
            .map(([name, data]) => ({
                name,
                ...data,
                margin: data.revenue - data.costs,
                marginPct: data.revenue > 0 ? ((data.revenue - data.costs) / data.revenue) * 100 : 0
            }))
            .sort((a, b) => b.revenue - a.revenue);

        // ─── AI Insights ────────────────────────────────────────

        const insights = generateInsights(t, projects, invoices, expenses, monthlyData, leaderboard, clients);

        // ─── Pipeline Totals ────────────────────────────────────

        const weightedPipeline = Math.round(forecast.reduce((s, m) => s + m.projected, 0));

        return {
            trendData,
            monthlyData,
            leaderboard,
            forecast,
            manufacturerScorecard,
            jewelryRows,
            insights,
            velocityData,
            weightedPipeline,
            currentYear,
        };
    }, [isLoading, timeframe, projects, clients, invoices, users, expenses, activities, t, localeTag]);

    return {
        isLoading,
        projects,
        clients,
        invoices,
        users,
        expenses,
        activities,
        ...computed,
    };
}

// ─── AI Insights Engine ─────────────────────────────────────────

function generateInsights(
    t: TFunction,
    projects: Project[],
    invoices: Invoice[],
    expenses: Expense[],
    monthlyData: MonthlyDataPoint[],
    leaderboard: SellerStat[],
    clients: Client[]
): Insight[] {
    const ti = (key: string, opts?: Record<string, string | number>) =>
        t(`analyticsPage.insights.${key}`, opts as Record<string, unknown>);
    const insights: Insight[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();

    // 1. Revenue Trend
    const last3Months = monthlyData.slice(Math.max(0, currentMonth - 2), currentMonth + 1);
    const totalRecent = last3Months.reduce((s, m) => s + m.collected, 0);
    const prev3Months = monthlyData.slice(Math.max(0, currentMonth - 5), Math.max(0, currentMonth - 2));
    const totalPrev = prev3Months.reduce((s, m) => s + m.collected, 0);

    if (totalPrev > 0) {
        const growth = Math.round(((totalRecent - totalPrev) / totalPrev) * 100);
        if (growth > 20) {
            insights.push({ icon: '📈', title: ti('revenueUpTitle', { growth }), description: ti('revenueUpDesc', { from: formatCurrency(totalPrev), to: formatCurrency(totalRecent) }), type: 'success' });
        } else if (growth < -10) {
            insights.push({ icon: '📉', title: ti('revenueDownTitle', { growth: Math.abs(growth) }), description: ti('revenueDownDesc', { from: formatCurrency(totalPrev), to: formatCurrency(totalRecent) }), type: 'danger' });
        } else {
            insights.push({ icon: '📊', title: ti('revenueStableTitle', { pct: `${growth > 0 ? '+' : ''}${growth}` }), description: ti('revenueStableDesc', { avg: formatCurrency(Math.round(totalRecent / 3)) }), type: 'info' });
        }
    }

    // 2. Collection Rate
    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
    const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

    const preDeliveryProjects = projects.filter(p => !['delivery', 'completed'].includes(p.status) && p.status !== 'cancelled');
    const deliveryProjects = projects.filter(p => ['delivery', 'completed'].includes(p.status));
    const overdueInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'void' && deliveryProjects.some(p => p.id === i.project_id));
    const overdueAmount = overdueInvoices.reduce((s, i) => s + (Number(i.amount) - Number(i.amount_paid || 0)), 0);

    if (collectionRate >= 80) {
        insights.push({ icon: '💰', title: ti('collectionExcellentTitle', { rate: collectionRate }), description: ti('collectionExcellentDesc', { paid: formatCurrency(totalPaid), invoiced: formatCurrency(totalInvoiced) }), type: 'success' });
    } else if (collectionRate >= 40) {
        const overduePart = overdueAmount > 0 ? ti('collectionNormalOverdue', { amount: formatCurrency(overdueAmount) }) : '';
        insights.push({ icon: '💰', title: ti('collectionNormalTitle', { rate: collectionRate }), description: ti('collectionNormalDesc', { count: preDeliveryProjects.length, overduePart }), type: overdueAmount > 0 ? 'warning' : 'success' });
    } else if (totalInvoiced > 0) {
        insights.push({ icon: '⚠️', title: ti('collectionLowTitle', { rate: collectionRate }), description: ti('collectionLowDesc', { pending: formatCurrency(totalInvoiced - totalPaid) }), type: 'info' });
    }

    // 3. Pipeline Health
    const designing = projects.filter(p => ['designing', '3d_model', 'design_ready'].includes(p.status)).length;
    const inProduction = projects.filter(p => ['approved_for_production', 'production'].includes(p.status)).length;
    const completed = projects.filter(p => p.status === 'completed').length;

    if (designing > inProduction * 2) {
        insights.push({ icon: '🎨', title: ti('pipelineBottleneckTitle', { designing, production: inProduction }), description: ti('pipelineBottleneckDesc'), type: 'warning' });
    } else if (inProduction > 0) {
        insights.push({ icon: '🏭', title: ti('pipelineHealthyTitle', { production: inProduction, designing }), description: ti('pipelineHealthyDesc', { completed }), type: 'success' });
    }

    // 4. Best Season
    const busyMonths = monthlyData.map((m, i) => ({ ...m, index: i })).filter(m => m.invoiced > 0).sort((a, b) => b.invoiced - a.invoiced);
    if (busyMonths.length >= 2) {
        insights.push({ icon: '📅', title: ti('peakMonthTitle', { month: busyMonths[0].month }), description: ti('peakMonthDesc', { volume: formatCurrency(busyMonths[0].invoiced) }), type: 'info' });
    }

    // 5. Top Seller Concentration
    if (leaderboard.length >= 2) {
        const topSellerShare = Math.round((leaderboard[0].volume / leaderboard.reduce((s, l) => s + l.volume, 0)) * 100);
        if (topSellerShare > 60) {
            insights.push({ icon: '👤', title: ti('sellerConcentratedTitle', { name: leaderboard[0].name, share: topSellerShare }), description: ti('sellerConcentratedDesc'), type: 'warning' });
        } else {
            insights.push({ icon: '👥', title: ti('sellerDiversifiedTitle'), description: ti('sellerDiversifiedDesc', { name: leaderboard[0].name, share: topSellerShare, count: leaderboard.length }), type: 'success' });
        }
    }

    // 6. Expense Ratio
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount), 0);
    if (totalRevenue > 0) {
        const expenseRatio = Math.round((totalExpenses / totalRevenue) * 100);
        if (expenseRatio < 40) {
            insights.push({ icon: '✅', title: ti('expenseHealthyTitle', { ratio: expenseRatio }), description: ti('expenseHealthyDesc', { expenses: formatCurrency(totalExpenses), revenue: formatCurrency(totalRevenue) }), type: 'success' });
        } else if (expenseRatio < 70) {
            insights.push({ icon: '📋', title: ti('expenseMonitorTitle', { ratio: expenseRatio }), description: ti('expenseMonitorDesc'), type: 'warning' });
        } else {
            insights.push({ icon: '🔴', title: ti('expenseSqueezedTitle', { ratio: expenseRatio }), description: ti('expenseSqueezedDesc'), type: 'danger' });
        }
    }

    // 7. Growth Prediction
    if (currentMonth >= 2) {
        const avgMonthly = totalRecent / Math.min(3, currentMonth + 1);
        const monthsLeft = 12 - currentMonth - 1;
        const predicted = totalRecent + (avgMonthly * monthsLeft);
        insights.push({ icon: '🔮', title: ti('projectedAnnualTitle', { amount: formatCurrency(Math.round(predicted)) }), description: ti('projectedAnnualDesc', { avg: formatCurrency(Math.round(avgMonthly)), monthsLeft }), type: 'info' });
    }

    // 8. Client Growth
    const newClientsThisMonth = clients.filter(c => {
        const d = new Date(c.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === now.getFullYear();
    }).length;

    if (newClientsThisMonth > 0) {
        insights.push({ icon: '🌟', title: t('analyticsPage.insights.newClientsTitle', { count: newClientsThisMonth }), description: ti('newClientsDesc', { total: clients.length }), type: 'success' });
    }

    return insights;
}
