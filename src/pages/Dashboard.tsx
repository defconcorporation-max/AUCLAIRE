import { Project } from '@/services/apiProjects';
import { Invoice } from '@/services/apiInvoices';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiProjects } from '@/services/apiProjects';
import { apiInvoices } from '@/services/apiInvoices';
import { apiSettings } from '@/services/apiSettings';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecentActivityList } from "@/components/RecentActivityList";
import { RevenueChart } from "@/components/RevenueChart";
import { useNavigate } from 'react-router-dom';

import { apiExpenses } from '@/services/apiExpenses';
import { apiUsers } from '@/services/apiUsers';
import { apiActivities, ActivityLog } from '@/services/apiActivities';
import { Filter, User, Factory, X, Briefcase } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Button } from '@/components/ui/button';

// New Modular Components
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { HealthAuditorWidget } from '@/components/dashboard/HealthAuditorWidget';
import { ProjectPipeline } from '@/components/dashboard/ProjectPipeline';
import { AmbassadorLeaderboard } from '@/components/dashboard/AmbassadorLeaderboard';
import { DesignReviewWidget } from '@/components/dashboard/DesignReviewWidget';
import { CashRiskTracker } from '@/components/dashboard/CashRiskTracker';
import { TimeBasedStats } from '@/components/dashboard/TimeBasedStats';
import { ManufacturerDashboard } from '@/components/dashboard/ManufacturerDashboard';
import { WorkloadMonitor } from '@/components/dashboard/WorkloadMonitor';
import { financialUtils } from '@/utils/financialUtils';
import { BoutiqueMirror } from '@/components/dashboard/BoutiqueMirror';

export default function Dashboard() {
    const { profile, role } = useAuth();
    const navigate = useNavigate();

    // Filters State
    const [selectedAffiliate, setSelectedAffiliate] = useState<string>('all');
    const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all');
    
    type TimeFrame = 'today' | 'week' | 'month' | 'year' | 'total';
    const [timeframe, setTimeframe] = useState<TimeFrame>('total');

    // Redirect clients to their portal
    useEffect(() => {
        if (role === 'client') {
            navigate('/dashboard/my-portal', { replace: true });
        }
    }, [role, navigate]);

    // Fetch and expose settings for widgets
    useEffect(() => {
        apiSettings.get()
            .then(data => {
                // @ts-expect-error - Global settings for legacy widgets
                window.auclaireSettings = data;
            })
            .catch(err => {
                console.warn("Failed to load settings in Dashboard, using defaults.", err);
                // The service already returns defaults, so we just log.
            });
    }, []);

    // Data Fetching
    const { data: projects, isLoading: projectsLoading, error: projectsError } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll
    });

    const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll
    });

    const { data: expenses, isLoading: expensesLoading, error: expensesError } = useQuery({
        queryKey: ['expenses'],
        queryFn: apiExpenses.getAll
    });

    const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
        queryKey: ['users'],
        queryFn: apiUsers.getAll
    });

    const { data: activities, isLoading: activitiesLoading } = useQuery({
        queryKey: ['activities'],
        queryFn: apiActivities.getAll
    });

    // Extract Filter Options
    const affiliates = useMemo(() => users?.filter(u => u.role === 'affiliate' || u.role === 'admin') || [], [users]);
    const manufacturers = useMemo(() => users?.filter(u => u.role === 'manufacturer') || [], [users]);

    if (projectsLoading || invoicesLoading || expensesLoading || usersLoading || activitiesLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
            </div>
        );
    }

    const hasError = projectsError || invoicesError || expensesError || usersError || !projects || !invoices || !expenses;
    if (hasError) {
        return (
            <div className="p-8 glass-card border-red-500/20 text-red-500 text-center">
                <h2 className="text-xl font-serif mb-2">Erreur de Chargement</h2>
                <p className="text-sm opacity-70">Impossible de récupérer les données du tableau de bord.</p>
            </div>
        );
    }

    // Role-based filtering + UI Filters
    const filteredProjects = projects?.filter(p => {
        // First Level: Role constraints
        let passesRole = false;
        if (role === 'admin' || role === 'secretary') passesRole = true;
        else if (role === 'manufacturer') passesRole = p.manufacturer_id === profile?.id;
        else if (role === 'affiliate') passesRole = p.sales_agent_id === profile?.id || p.affiliate_id === profile?.id;
        
        if (!passesRole) return false;

        // Second Level: Active UI Filters (for Admin/Secretary)
        if (role === 'admin' || role === 'secretary') {
            if (selectedAffiliate !== 'all' && p.affiliate_id !== selectedAffiliate && p.sales_agent_id !== selectedAffiliate) return false;
            if (selectedManufacturer !== 'all' && p.manufacturer_id !== selectedManufacturer) return false;
        }

        return true;
    }) || [];

    const projectIds = new Set(filteredProjects.map(p => p.id));
    const filteredInvoices = invoices?.filter(i => projectIds.has(i.project_id)) || [];

    // Sorting Helper
    const sortByRush = (a: Project, b: Project) => {
        if (a.priority === 'rush' && b.priority !== 'rush') return -1;
        if (a.priority !== 'rush' && b.priority === 'rush') return 1;
        return 0;
    };

    // Pipeline Data
    const manufacturerDesignRequests = filteredProjects.filter(p => p.status === 'design_modification' || p.status === '3d_model').sort(sortByRush);
    const manufacturerPendingProduction = filteredProjects.filter(p => p.status === 'approved_for_production').sort(sortByRush);
    const manufacturerOngoingProduction = filteredProjects.filter(p => p.status === 'production').sort(sortByRush);
    const manufacturerInDelivery = filteredProjects.filter(p => p.status === 'delivery').sort(sortByRush);
    const adminDesignReady = filteredProjects.filter(p => p.status === 'design_ready' || p.status === 'waiting_for_approval').sort(sortByRush);

    // Financial Logic
    const getSalePrice = (p: Project) => financialUtils.getSalePrice(p);
    const getCommissionEstimate = (p: Project) => financialUtils.computeCommissionAmount(p);

    const totalCollected = filteredInvoices.reduce((sum, i) => sum + ((i.amount_paid && i.amount_paid > 0) ? i.amount_paid : (i.status === 'paid' ? i.amount : 0)), 0);
    const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    
    const invoicedProjectIds = new Set(filteredInvoices.map(i => i.project_id));
    const potentialRevenue = filteredProjects.reduce((sum, p) => {
        if (p.status === 'cancelled' || invoicedProjectIds.has(p.id)) return sum;
        return sum + getSalePrice(p);
    }, 0);

    const totalRealExpenses = expenses?.filter(e => e.status !== 'cancelled').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const totalPendingCommissions = filteredProjects.reduce((sum, p) => p.financials?.commission_exported_to_expenses ? sum : sum + getCommissionEstimate(p), 0);
    const totalProductionCost = filteredProjects.reduce((sum, p) => {
        if (!['production', 'delivery', 'completed'].includes(p.status) || p.financials?.exported_to_expenses) return sum;
        const dynamicCosts = p.financials?.cost_items?.reduce((itemSum, item) => itemSum + (Number(item.amount) || 0), 0) || 0;
        return sum + Number(p.financials?.supplier_cost || 0) + Number(p.financials?.shipping_cost || 0) + Number(p.financials?.customs_fee || 0) + dynamicCosts;
    }, 0);

    const projectedProfit = (totalInvoiced + potentialRevenue) - totalRealExpenses - totalProductionCost - totalPendingCommissions;

    // Time-filtered Stats for DashboardStats
    const { start: periodStart, end: periodEnd } = financialUtils.getPeriodRange(timeframe);
    
    const periodProjects = filteredProjects.filter(p => {
        const date = new Date(p.created_at);
        return timeframe === 'total' || (date >= periodStart && date <= periodEnd);
    });

    const periodInvoices = filteredInvoices.filter(i => {
        const date = new Date(i.created_at);
        return timeframe === 'total' || (date >= periodStart && date <= periodEnd);
    });

    const periodCollected = financialUtils.getCollectedFromLogs(activities || [], periodStart, periodEnd);
    const periodInvoiced = periodInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const periodPotential = periodProjects.reduce((sum, p) => {
        if (p.status === 'cancelled' || invoicedProjectIds.has(p.id)) return sum;
        return sum + getSalePrice(p);
    }, 0);

    const periodExpenses = expenses?.filter(e => {
        const date = new Date(e.created_at);
        return e.status !== 'cancelled' && (timeframe === 'total' || (date >= periodStart && date <= periodEnd));
    }).reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    const periodProfit = periodCollected - periodExpenses;

    // Risk & Pipeline
    const highRiskProjects: { project: Project, deficit: number, committed: number, deposited: number }[] = [];
    let expectedCashPipeline = 0;
    filteredProjects.forEach(p => {
        if (p.status === 'cancelled') return;
        const price = getSalePrice(p);
        const collected = filteredInvoices.filter(i => i.project_id === p.id).reduce((s, i) => s + (i.amount_paid || (i.status === 'paid' ? i.amount : 0)), 0);
        const dynamicCosts = p.financials?.cost_items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
        const totalCosts = Number(p.financials?.supplier_cost || 0) + Number(p.financials?.shipping_cost || 0) + Number(p.financials?.customs_fee || 0) + dynamicCosts + getCommissionEstimate(p);
        const remainingToCollect = price - collected;
        let prob = 0;
        if (p.status === 'completed') prob = 1;
        else if (p.status === 'production' || p.status === 'delivery') prob = 0.95;
        else if (p.status === 'approved_for_production') prob = 0.9;
        else if (p.status === '3d_model') prob = 0.7;
        else if (p.status === 'designing') prob = 0.5;
        else prob = 0.5;
        expectedCashPipeline += remainingToCollect * prob;
        if (['approved_for_production', 'production', 'delivery'].includes(p.status) && totalCosts > collected) {
            highRiskProjects.push({ project: p, deficit: totalCosts - collected, committed: totalCosts, deposited: collected });
        }
    });

    // Total outstanding balance across all invoices

    // Stats calculations
    const getCalendarStats = (mode: 'today' | 'week' | 'month') => {
        const { start, end } = financialUtils.getPeriodRange(mode);
        
        const periodProjects = filteredProjects.filter(p => {
            const date = new Date(p.created_at);
            return date >= start && date <= end;
        });

        // Use activity logs for accurate collection timing if available, 
        // fallback to invoice timing for legacy (though activities are preferred and synced now)
        const collected = financialUtils.getCollectedFromLogs(activities || [], start, end);

        const volume = periodProjects.reduce((s, p) => s + getSalePrice(p), 0);
        
        return {
            count: periodProjects.length,
            volume: volume,
            collected: collected
        };
    };

    const statsData = {
        today: getCalendarStats('today'),
        week: getCalendarStats('week'),
        month: getCalendarStats('month')
    };

    const isProjectASale = (p: Project) => invoicedProjectIds.has(p.id);

    // Leaderboard
    const sellerStats: Record<string, { id: string, name: string, volume: number, projectCount: number, profit: number, totalSalePrice: number }> = {};
    filteredProjects.filter(isProjectASale).forEach(p => {
        const sellerId = p.affiliate_id || p.sales_agent_id || 'direct';
        const sellerName = p.affiliate?.full_name || 'Vente Directe';
        if (!sellerStats[sellerId]) sellerStats[sellerId] = { id: sellerId, name: sellerName, volume: 0, projectCount: 0, profit: 0, totalSalePrice: 0 };
        const price = getSalePrice(p);
        const dynamicCosts = p.financials?.cost_items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
        const totalCosts = Number(p.financials?.supplier_cost || 0) + Number(p.financials?.shipping_cost || 0) + Number(p.financials?.customs_fee || 0) + dynamicCosts + getCommissionEstimate(p);
        sellerStats[sellerId].volume += price;
        sellerStats[sellerId].projectCount++;
        sellerStats[sellerId].profit += (price - totalCosts);
        sellerStats[sellerId].totalSalePrice += price;
    });

    const leaderboard = Object.values(sellerStats)
        .map(s => ({ ...s, marginPercent: s.totalSalePrice > 0 ? (s.profit / s.totalSalePrice) * 100 : 0 }))
        .sort((a, b) => b.volume - a.volume);

    // Operational Velocity Logic (from Analytics)
    const velocityData: Record<string, { totalDays: number, count: number }> = {
        'designing': { totalDays: 0, count: 0 },
        '3d_model': { totalDays: 0, count: 0 },
        'approved_for_production': { totalDays: 0, count: 0 },
        'production': { totalDays: 0, count: 0 },
    };

    const statusLogs = activities?.filter(a => a.action === 'status_change') || [];
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
            const end = new Date(sorted[i+1].created_at);
            const days = Math.max(0.1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const prevStatusMsg = sorted[i].details.toLowerCase().split('to ')[1];
            if (prevStatusMsg && velocityData[prevStatusMsg]) {
                velocityData[prevStatusMsg].totalDays += days;
                velocityData[prevStatusMsg].count++;
            }
        }
    });

    // Manufacturer Performance Logic
    const manufacturerStats: Record<string, { id: string, name: string, projectCount: number, volume: number, totalProdDays: number, prodCount: number, modCount: number }> = {};
    manufacturers.forEach(u => {
        manufacturerStats[u.id] = { id: u.id, name: u.full_name, projectCount: 0, volume: 0, totalProdDays: 0, prodCount: 0, modCount: 0 };
    });

    filteredProjects.forEach(p => {
        if (p.manufacturer_id && manufacturerStats[p.manufacturer_id]) {
            manufacturerStats[p.manufacturer_id].projectCount++;
            manufacturerStats[p.manufacturer_id].volume += getSalePrice(p);
            const pLogs = logsByProject[p.id] || [];
            const sorted = pLogs.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            let prodStart: Date | null = null;
            sorted.forEach(log => {
                const details = log.details.toLowerCase();
                if (details.includes('to production') || details.includes('to approved_for_production')) {
                    prodStart = new Date(log.created_at);
                }
                if (details.includes('to completed') && prodStart) {
                    const days = (new Date(log.created_at).getTime() - prodStart.getTime()) / (1000 * 60 * 60 * 24);
                    manufacturerStats[p.manufacturer_id!].totalProdDays += days;
                    manufacturerStats[p.manufacturer_id!].prodCount++;
                    prodStart = null;
                }
                if (details.includes('to design_modification')) {
                    manufacturerStats[p.manufacturer_id!].modCount++;
                }
            });
        }
    });

    const manufacturerScorecard = Object.values(manufacturerStats)
        .filter(s => s.projectCount > 0)
        .map(s => ({
            ...s,
            avgSpeed: s.prodCount > 0 ? Math.round(s.totalProdDays / s.prodCount) : 0,
            qualityRate: Math.max(0, 100 - (s.modCount / s.projectCount * 100))
        }))
        .sort((a, b) => b.qualityRate - a.qualityRate);

    // AI Insights Logic
    const insights = generateDashboardInsights(filteredProjects, filteredInvoices, expenses || [], leaderboard);

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="animate-in fade-in slide-in-from-left-4">
                    <h1 className="text-4xl font-serif text-luxury-gradient tracking-tight mb-2">Tableau de Bord</h1>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                        v3.6.1 • Bienvenue, <span className="text-foreground">{profile?.full_name}</span> • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>

                {/* Dashboard Filters for Admin/Secretary */}
                {(role === 'admin' || role === 'secretary') && (
                    <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-full border-white/10">
                            <Filter className="w-3.5 h-3.5 text-luxury-gold" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-white/10 pr-2 mr-1">Filtres</span>
                            
                            {/* Affiliate Select */}
                            <div className="flex items-center gap-2 group">
                                <User className="w-3 h-3 text-muted-foreground group-hover:text-luxury-gold transition-colors" />
                                <select 
                                    className="bg-transparent border-none text-[11px] font-medium focus:ring-0 cursor-pointer text-foreground appearance-none min-w-[100px]"
                                    value={selectedAffiliate}
                                    onChange={(e) => setSelectedAffiliate(e.target.value)}
                                >
                                    <option value="all" className="bg-neutral-900 text-foreground">Tous les Ambassadeurs</option>
                                    {affiliates.map(aff => (
                                        <option key={aff.id} value={aff.id} className="bg-neutral-900 text-foreground">{aff.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <span className="w-px h-4 bg-white/10 mx-1" />

                            {/* Manufacturer Select */}
                            <div className="flex items-center gap-2 group">
                                <Factory className="w-3 h-3 text-muted-foreground group-hover:text-luxury-gold transition-colors" />
                                <select 
                                    className="bg-transparent border-none text-[11px] font-medium focus:ring-0 cursor-pointer text-foreground appearance-none min-w-[100px]"
                                    value={selectedManufacturer}
                                    onChange={(e) => setSelectedManufacturer(e.target.value)}
                                >
                                    <option value="all" className="bg-neutral-900 text-foreground">Tous les Ateliers</option>
                                    {manufacturers.map(m => (
                                        <option key={m.id} value={m.id} className="bg-neutral-900 text-foreground">{m.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            {(selectedAffiliate !== 'all' || selectedManufacturer !== 'all') && (
                                <>
                                    <span className="w-px h-4 bg-white/10 mx-1" />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 rounded-full hover:bg-white/10"
                                        onClick={() => { setSelectedAffiliate('all'); setSelectedManufacturer('all'); }}
                                    >
                                        <X className="w-3 h-3 text-red-400" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ADMIN / SECRETARY VIEW */}
            {(role === 'admin' || role === 'secretary') && (
                <div className="space-y-8">
                    <div className="flex justify-center mb-4">
                        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 gap-1">
                            {['today', 'week', 'month', 'year', 'total'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeframe(t as TimeFrame)}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        timeframe === t 
                                        ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/20' 
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {t === 'today' ? "Aujourd'hui" : t === 'week' ? "Cette Semaine" : t === 'month' ? "Ce Mois" : t === 'year' ? "Cette Année" : "Total"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <DashboardStats 
                        totalCollected={periodCollected} 
                        totalInvoiced={periodInvoiced}
                        potentialRevenue={periodPotential}
                        totalProfit={periodProfit}
                        projectedProfit={projectedProfit}
                        expectedCashPipeline={expectedCashPipeline}
                        waitingCollection={totalInvoiced - totalCollected}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <HealthAuditorWidget projects={filteredProjects} activities={activities || []} />
                            <ProjectPipeline 
                                design={manufacturerDesignRequests} 
                                pending={manufacturerPendingProduction}
                                ongoing={manufacturerOngoingProduction}
                                delivery={manufacturerInDelivery}
                                role={role}
                            />
                        </div>
                        <div className="space-y-6">
                            <WorkloadMonitor />
                            <DesignReviewWidget projects={adminDesignReady} />
                            <AmbassadorLeaderboard leaderboard={leaderboard} />
                        </div>
                    </div>

                    {/* Dashboard Insights Grid */}
                    <div className="space-y-6">
                        {/* 
                          BOUTIQUE MIRROR (LIVE FEED)
                          VISIBLE TO ADMINS, MANUFACTURERS, AND SECRETARIES
                        */}
                        {(role === 'admin' || role === 'secretary' || role === 'manufacturer') && (
                            <BoutiqueMirror />
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <CashRiskTracker highRiskProjects={highRiskProjects} />
                            
                            {/* AI Insights Engine Integration */}
                            <Card className="border-luxury-gold/20 bg-gradient-to-br from-luxury-gold/5 to-transparent backdrop-blur-md shadow-xl">
                                <CardHeader className="py-4">
                                    <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2">
                                        <span className="text-luxury-gold animate-pulse">✨</span>
                                        AI Business Insights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pb-6">
                                    <div className="grid gap-3 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-luxury-gold/20">
                                        {insights.slice(0, 5).map((insight, i) => (
                                            <div
                                                key={i}
                                                className={`p-3 rounded-xl border animate-in fade-in slide-in-from-right-2 duration-300 ${
                                                    insight.type === 'success' ? 'border-green-500/20 bg-green-500/5' :
                                                    insight.type === 'warning' ? 'border-amber-500/20 bg-amber-500/5' :
                                                    insight.type === 'danger' ? 'border-red-500/20 bg-red-500/5' :
                                                    'border-blue-500/20 bg-blue-500/5'
                                                }`}
                                                style={{ animationDelay: `${i * 100}ms` }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="text-lg">{insight.icon}</span>
                                                    <div>
                                                        <p className="font-medium text-[12px] leading-tight text-foreground">{insight.title}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{insight.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Manufacturer Performance Scorecards Integration */}
                        <Card className="glass-card overflow-hidden mt-8">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4">
                                <div>
                                    <CardTitle className="font-serif text-xl tracking-wide flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-luxury-gold" />
                                        Performance des Ateliers
                                    </CardTitle>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Vitesse, Qualité et Volume de production</p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground py-3">Atelier</TableHead>
                                            <TableHead className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">Projets</TableHead>
                                            <TableHead className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">Vitesse Moy.</TableHead>
                                            <TableHead className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">Score Qualité</TableHead>
                                            <TableHead className="text-right text-[10px] uppercase tracking-widest text-muted-foreground">Volume Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {manufacturerScorecard.map((m) => (
                                            <TableRow key={m.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                                <TableCell className="font-medium text-foreground py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold font-bold text-[10px] ring-1 ring-luxury-gold/20">
                                                            {m.name.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-serif">{m.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-widest border-luxury-gold/30 text-luxury-gold bg-transparent uppercase">
                                                        {m.projectCount}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-serif">
                                                    {m.avgSpeed > 0 ? (
                                                        <span className={`text-sm ${m.avgSpeed < 7 ? 'text-green-500' : m.avgSpeed > 14 ? 'text-red-500' : 'text-amber-500'}`}>
                                                            {m.avgSpeed} Jours
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-[10px] italic">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-sm font-serif ${m.qualityRate > 90 ? 'text-green-500' : m.qualityRate < 70 ? 'text-red-500' : 'text-amber-500'}`}>
                                                            {Math.round(m.qualityRate)}%
                                                        </span>
                                                        <div className="w-16 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                                                            <div 
                                                                className={`h-full ${m.qualityRate > 90 ? 'bg-green-500' : m.qualityRate < 70 ? 'bg-red-500' : 'bg-amber-500'}`} 
                                                                style={{ width: `${m.qualityRate}%` }} 
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-serif text-sm font-bold text-luxury-gold">
                                                    ${m.volume.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            <TimeBasedStats stats={statsData} />
                            {/* Potential for a mini forecast chart here */}
                        </div>
                    </div>
                </div>
            )}

            {/* MANUFACTURER VIEW */}
            {role === 'manufacturer' && (
                <ManufacturerDashboard projects={filteredProjects} />
            )}

            {/* AFFILIATE VIEW */}
            {role === 'affiliate' && (
                <div className="space-y-8">
                    <div className="flex justify-center mb-4">
                        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 gap-1">
                            {['today', 'week', 'month', 'year', 'total'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeframe(t as TimeFrame)}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        timeframe === t 
                                        ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/20' 
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {t === 'today' ? "Aujourd'hui" : t === 'week' ? "Cette Semaine" : t === 'month' ? "Ce Mois" : t === 'year' ? "Cette Année" : "Total"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <DashboardStats 
                        totalCollected={periodCollected} 
                        totalInvoiced={periodInvoiced}
                        potentialRevenue={periodPotential}
                        totalProfit={periodProfit}
                        projectedProfit={projectedProfit}
                        expectedCashPipeline={expectedCashPipeline}
                        waitingCollection={totalInvoiced - totalCollected}
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                             <ProjectPipeline 
                                design={manufacturerDesignRequests} 
                                pending={manufacturerPendingProduction}
                                ongoing={manufacturerOngoingProduction}
                                delivery={manufacturerInDelivery}
                                role={role}
                            />
                        </div>
                        <div>
                            <TimeBasedStats stats={statsData} />
                        </div>
                    </div>
                </div>
            )}

            {/* Global Insights Section (Charts & Activity) */}
            {(role === 'admin' || role === 'secretary' || role === 'affiliate') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 glass-card">
                        <CardHeader>
                            <CardTitle className="font-serif text-lg">Aperçu des Revenus</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <RevenueChart />
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="font-serif text-lg">Activité Récente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RecentActivityList />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

// AI Insights Engine — generates smart observations from raw data
interface DashboardInsight {
    icon: string;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'danger' | 'info';
}

function generateDashboardInsights(
    projects: Project[],
    invoices: Invoice[],
    expenses: { amount: number; status: string }[],
    leaderboard: { name: string; volume: number }[]
): DashboardInsight[] {
    const insights: DashboardInsight[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();

    // 1. Collection Rate Analysis
    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount_paid || i.amount), 0);
    const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

    if (collectionRate >= 80) {
        insights.push({ icon: '💰', title: `Taux de recouvrement: ${collectionRate}%`, description: `Excellent! Discipline de paiement client solide.`, type: 'success' });
    } else if (collectionRate >= 50) {
        insights.push({ icon: '⚠️', title: `Taux de recouvrement: ${collectionRate}%`, description: `Attention, $${(totalInvoiced - totalPaid).toLocaleString()} en attente.`, type: 'warning' });
    }

    // 2. Pipeline Balance
    const designing = projects.filter(p => ['designing', '3d_model', 'design_ready'].includes(p.status)).length;
    const inProduction = projects.filter(p => ['approved_for_production', 'production'].includes(p.status)).length;

    if (designing > inProduction * 2 && inProduction > 0) {
        insights.push({ icon: '🎨', title: `Pipeline Design Saturation`, description: `${designing} designs en cours vs ${inProduction} en production. Risque de goulot d'étranglement.`, type: 'warning' });
    } else if (inProduction > 0) {
        insights.push({ icon: '🏭', title: `Flux Production Sain`, description: `Équilibre maintenu entre la création et la fabrication.`, type: 'success' });
    }

    // 3. Profitability (Expense Ratio)
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount), 0);
    if (totalRevenue > 0) {
        const expenseRatio = Math.round((totalExpenses / totalRevenue) * 100);
        if (expenseRatio < 40) {
            insights.push({ icon: '✅', title: `Rentabilité Optimale`, description: `Ratio dépenses/revenus de ${expenseRatio}%. Marges préservées.`, type: 'success' });
        } else if (expenseRatio > 70) {
            insights.push({ icon: '🚨', title: `Marges sous Pression`, description: `Les dépenses représentent ${expenseRatio}% du CA. Audit recommandé.`, type: 'danger' });
        }
    }

    // 4. Seller Performance Concentration
    if (leaderboard.length >= 2) {
        const totalVolume = leaderboard.reduce((s, l) => s + l.volume, 0);
        const topSellerShare = Math.round((leaderboard[0].volume / totalVolume) * 100);
        if (topSellerShare > 60) {
            insights.push({ icon: '👤', title: `Dépendance Commerciale`, description: `${leaderboard[0].name} génère ${topSellerShare}% du volume. Risque de concentration élevé.`, type: 'danger' });
        }
    }

    // 5. Monthly Velocity
    const newThisMonth = projects.filter(p => {
        const d = new Date(p.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === now.getFullYear();
    }).length;
    if (newThisMonth > 5) {
        insights.push({ icon: '🌟', title: `Forte Acquisition`, description: `${newThisMonth} nouveaux projets créés ce mois-ci. Belle dynamique!`, type: 'success' });
    }

    return insights;
}
