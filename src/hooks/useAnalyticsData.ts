import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClients } from '@/services/apiClients';
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

export interface ChartDataPoint {
    label: string;
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

export function useAnalyticsData(timeframe: Timeframe, selectedSellerId?: string | null) {
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

        // Filter datasets if a seller is selected
        const filteredProjects = selectedSellerId 
            ? projects.filter(p => p.sales_agent_id === selectedSellerId || p.affiliate_id === selectedSellerId)
            : projects;
        
        const filteredInvoices = selectedSellerId
            ? invoices.filter(inv => {
                const p = projects.find(proj => proj.id === inv.project_id);
                return p && (p.sales_agent_id === selectedSellerId || p.affiliate_id === selectedSellerId);
            })
            : invoices;

        const filteredExpenses = selectedSellerId
            ? expenses.filter(exp => exp.recipient_id === selectedSellerId || (exp.project_id && projects.find(proj => proj.id === exp.project_id)?.sales_agent_id === selectedSellerId))
            : expenses;

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
            const periodInvoices = filteredInvoices.filter(inv => {
                const date = new Date(inv.created_at);
                return date >= start && date <= end && inv.status !== 'void';
            });
            const periodClients = clients.filter(c => {
                const date = new Date(c.created_at);
                return date >= start && date <= end;
            });
            const periodExpenses = filteredExpenses.filter(exp => {
                const date = new Date(exp.created_at);
                return date >= start && date <= end && exp.status !== 'cancelled';
            });

            const collected = financialUtils.getCollectedFromInvoices(filteredInvoices, start, end);
            const invoiced = periodInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
            const expAmount = periodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

            const count = periodInvoices.length;
            const avgOrder = count > 0 ? Math.round(invoiced / count) : 0;
            const profit = collected - expAmount;
            
            // Correction Phase 1: Global Outstanding
            const outstanding = financialUtils.getOutstandingBalance(filteredInvoices);

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

        // ─── Dynamic Chart Data (Phase 3) ───────────────────────

        let chartData: ChartDataPoint[] = [];

        if (timeframe === 'day') {
            // Last 24 hours
            const now = new Date();
            for (let i = 23; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 60 * 60 * 1000);
                const start = new Date(d.setMinutes(0, 0, 0));
                const end = new Date(d.setMinutes(59, 59, 999));
                chartData.push({
                    label: d.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' }),
                    collected: financialUtils.getCollectedFromInvoices(filteredInvoices, start, end),
                    invoiced: filteredInvoices.filter(inv => { const dIn = new Date(inv.created_at); return dIn >= start && dIn <= end && inv.status !== 'void'; }).reduce((s, i) => s + Number(i.amount), 0),
                    expenses: filteredExpenses.filter(e => { const dE = new Date(e.created_at); return dE >= start && dE <= end && e.status !== 'cancelled'; }).reduce((s, e) => s + Number(e.amount), 0),
                });
            }
        } else if (timeframe === 'week') {
            // Last 7 days
            const now = new Date();
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const start = new Date(d.setHours(0, 0, 0, 0));
                const end = new Date(d.setHours(23, 59, 59, 999));
                chartData.push({
                    label: d.toLocaleDateString(localeTag, { weekday: 'short' }),
                    collected: financialUtils.getCollectedFromInvoices(filteredInvoices, start, end),
                    invoiced: filteredInvoices.filter(inv => { const dIn = new Date(inv.created_at); return dIn >= start && dIn <= end && inv.status !== 'void'; }).reduce((s, i) => s + Number(i.amount), 0),
                    expenses: filteredExpenses.filter(e => { const dE = new Date(e.created_at); return dE >= start && dE <= end && e.status !== 'cancelled'; }).reduce((s, e) => s + Number(e.amount), 0),
                });
            }
        } else {
            // Default 12 months for month/total
            const currentYear = new Date().getFullYear();
            chartData = [...Array(12)].map((_, monthIdx) => {
                const start = new Date(currentYear, monthIdx, 1, 0, 0, 0, 0);
                const end = new Date(currentYear, monthIdx + 1, 0, 23, 59, 59, 999);
                return {
                    label: new Date(currentYear, monthIdx, 1).toLocaleDateString(localeTag, { month: 'short' }),
                    collected: financialUtils.getCollectedFromInvoices(filteredInvoices, start, end),
                    invoiced: filteredInvoices.filter(inv => { 
                        const dIn = new Date(inv.created_at); 
                        return dIn.getFullYear() === currentYear && dIn.getMonth() === monthIdx && inv.status !== 'void'; 
                    }).reduce((s, i) => s + Number(i.amount), 0),
                    expenses: filteredExpenses.filter(e => { 
                        const dE = new Date(e.created_at); 
                        return dE.getFullYear() === currentYear && dE.getMonth() === monthIdx && e.status !== 'cancelled'; 
                    }).reduce((s, e) => s + Number(e.amount), 0),
                };
            });
        }

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

        const forecast: ForecastPoint[] = [
            { name: t('analyticsPage.forecastMonth0'), projected: 0 },
            { name: t('analyticsPage.forecastMonth1'), projected: 0 },
            { name: t('analyticsPage.forecastMonth2'), projected: 0 },
        ];
        
        // Month 0 anchor
        const m0Start = new Date(); m0Start.setDate(1); m0Start.setHours(0,0,0,0);
        forecast[0].projected = financialUtils.getCollectedFromInvoices(filteredInvoices, m0Start, new Date());

        filteredProjects.forEach(p => {
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

        filteredProjects.forEach(p => {
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

        const categoryStats: Record<string, { count: number; revenue: number; costs: number }> = {};
        const autoDetect = (title: string): string => {
            const tl = title.toLowerCase();
            if (tl.includes('ring') || tl.includes('bague') || tl.includes('engagement') || tl.includes('chevalier')) return 'Bague';
            if (tl.includes('bracelet')) return 'Bracelet';
            if (tl.includes('pendant') || tl.includes('pendentif')) return 'Pendentif';
            if (tl.includes('earring') || tl.includes('boucle')) return "Boucles d'oreilles";
            if (tl.includes('necklace') || tl.includes('collier') || tl.includes('chain') || tl.includes('chaine')) return 'Collier';
            return 'Autre';
        };

        filteredProjects.forEach((p: Project) => {
            const cat = p.jewelry_type || autoDetect(p.title || '');
            if (!categoryStats[cat]) categoryStats[cat] = { count: 0, revenue: 0, costs: 0 };
            categoryStats[cat].count++;
            const revenue = getSalePrice(p);
            const costs = financialUtils.computeProjectCosts(p.financials);
            categoryStats[cat].revenue += revenue;
            categoryStats[cat].costs += costs;
        });

        const jewelryRows: JewelryRow[] = Object.entries(categoryStats)
            .map(([name, data]) => ({
                name,
                ...data,
                margin: data.revenue - data.costs,
                marginPct: data.revenue > 0 ? ((data.revenue - data.costs) / data.revenue) * 100 : 0
            }))
            .sort((a, b) => b.revenue - a.revenue);

        // ─── Phase 3: Conversion Rate ───────────────────────────
        
        const totalProjectsCount = filteredProjects.length;
        const reachedProductionCount = filteredProjects.filter(p => PRODUCTION_READY_STATUSES.includes(p.status)).length;
        const conversionRate = totalProjectsCount > 0 ? Math.round((reachedProductionCount / totalProjectsCount) * 100) : 0;

        // ─── AI Insights ────────────────────────────────────────

        const insights = generateInsights(t, filteredProjects, filteredInvoices, filteredExpenses, chartData);

        // ─── Pipeline Totals ────────────────────────────────────

        const weightedPipeline = Math.round(forecast.reduce((s, m) => s + m.projected, 0));

        return {
            trendData,
            chartData,
            leaderboard,
            forecast,
            manufacturerScorecard,
            jewelryRows,
            insights,
            velocityData,
            weightedPipeline,
            conversionRate,
            totalProjectsCount,
            currentYear: new Date().getFullYear(),
        };
    }, [isLoading, timeframe, selectedSellerId, projects, clients, invoices, users, expenses, activities, t, localeTag]);

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
    chartData: ChartDataPoint[]
): Insight[] {
    const ti = (key: string, opts?: Record<string, string | number>) =>
        t(`analyticsPage.insights.${key}`, opts as Record<string, unknown>);
    const insights: Insight[] = [];

    // 1. Revenue Trend (based on chartData buckets)
    if (chartData.length >= 2) {
        const currentTotal = chartData.reduce((s, d) => s + d.collected, 0);
        const avgCollected = currentTotal / chartData.length;
        
        if (currentTotal > 0) {
            insights.push({ 
                icon: '📊', 
                title: ti('revenueStableTitle', { pct: '' }), 
                description: ti('revenueStableDesc', { avg: formatCurrency(Math.round(avgCollected)) }), 
                type: 'info' 
            });
        }
    }

    // 2. Collection Rate
    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
    const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

    const deliveryProjectsIds = projects.filter(p => ['delivery', 'completed'].includes(p.status)).map(p => p.id);
    const overdueInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'void' && deliveryProjectsIds.includes(i.project_id));
    const overdueAmount = overdueInvoices.reduce((s, i) => s + (Number(i.amount) - Number(i.amount_paid || 0)), 0);

    if (collectionRate >= 80) {
        insights.push({ icon: '💰', title: ti('collectionExcellentTitle', { rate: collectionRate }), description: ti('collectionExcellentDesc', { paid: formatCurrency(totalPaid), invoiced: formatCurrency(totalInvoiced) }), type: 'success' });
    } else if (collectionRate >= 40) {
        const overduePart = overdueAmount > 0 ? ti('collectionNormalOverdue', { amount: formatCurrency(overdueAmount) }) : '';
        insights.push({ icon: '💰', title: ti('collectionNormalTitle', { rate: collectionRate }), description: ti('collectionNormalDesc', { count: projects.length, overduePart }), type: overdueAmount > 0 ? 'warning' : 'success' });
    }

    // 3. Pipeline Health
    const designing = projects.filter(p => ['designing', '3d_model', 'design_ready'].includes(p.status)).length;
    const inProduction = projects.filter(p => ['approved_for_production', 'production'].includes(p.status)).length;

    if (designing > inProduction * 2 && inProduction > 0) {
        insights.push({ icon: '🎨', title: ti('pipelineBottleneckTitle', { designing, production: inProduction }), description: ti('pipelineBottleneckDesc'), type: 'warning' });
    } else if (inProduction > 0) {
        insights.push({ icon: '🏭', title: ti('pipelineHealthyTitle', { production: inProduction, designing }), description: ti('pipelineHealthyDesc', { completed: projects.filter(p => p.status === 'completed').length }), type: 'success' });
    }

    // 4. Expense Ratio
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount), 0);
    if (totalRevenue > 0) {
        const expenseRatio = Math.round((totalExpenses / totalRevenue) * 100);
        if (expenseRatio < 40) {
            insights.push({ icon: '✅', title: ti('expenseHealthyTitle', { ratio: expenseRatio }), description: ti('expenseHealthyDesc', { expenses: formatCurrency(totalExpenses), revenue: formatCurrency(totalRevenue) }), type: 'success' });
        } else if (expenseRatio > 70) {
            insights.push({ icon: '🔴', title: ti('expenseSqueezedTitle', { ratio: expenseRatio }), description: ti('expenseSqueezedDesc'), type: 'danger' });
        }
    }

    return insights;
}
