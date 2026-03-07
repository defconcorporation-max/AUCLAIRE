import { useAuth } from '@/context/AuthContext';
import { apiProjects } from '@/services/apiProjects';
import { apiInvoices } from '@/services/apiInvoices';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { RecentActivityList } from "@/components/RecentActivityList";
import { RevenueChart } from "@/components/RevenueChart";
import { Link } from 'react-router-dom';

import {
    Activity, TrendingUp,
    AlertCircle, Clock, BarChart3,
    Briefcase, Package, Banknote, Trophy, CalendarDays
} from 'lucide-react';

import { apiExpenses } from '@/services/apiExpenses';
import { apiUsers } from '@/services/apiUsers';

// ... (imports)

export default function Dashboard() {
    const { profile, role } = useAuth();

    // Fetch all projects
    const { data: projects, isLoading: projectsLoading, error: projectsError } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll
    });

    const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll
    });

    // NEW: Fetch all expenses to subtract from profit
    const { data: expenses, isLoading: expensesLoading, error: expensesError } = useQuery({
        queryKey: ['expenses'],
        queryFn: apiExpenses.getAll
    });

    const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
        queryKey: ['users'],
        queryFn: apiUsers.getAll
    });

    if (projectsLoading || invoicesLoading || expensesLoading || usersLoading) return <div>Loading dashboard...</div>;

    const hasError = projectsError || invoicesError || expensesError || usersError || !projects || !invoices || !expenses;

    if (hasError) {
        console.error("Dashboard Data Error:", projectsError, invoicesError, expensesError);
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline ml-2">Failed to load dashboard data. Please try again later.</span>
                {projectsError && <p className="text-sm">Projects Error: {projectsError.message}</p>}
                {invoicesError && <p className="text-sm">Invoices Error: {invoicesError.message}</p>}
                {expensesError && <p className="text-sm">Expenses Error: {expensesError.message}</p>}
            </div>
        );
    }

    const filteredProjects = projects?.filter(p => {
        if (role === 'admin' || role === 'manufacturer') return true;
        if (role === 'affiliate') {
            return p.sales_agent_id === profile?.id || p.affiliate_id === profile?.id;
        }
        return false;
    }) || [];

    const projectIds = new Set(filteredProjects.map(p => p.id));
    const filteredInvoices = invoices?.filter(i => projectIds.has(i.project_id)) || [];

    // Expenses are usually admin-only, but let's be safe
    const filteredExpenses = role === 'admin' ? expenses : [];

    const sortByRush = (a: any, b: any) => {
        if (a.priority === 'rush' && b.priority !== 'rush') return -1;
        if (a.priority !== 'rush' && b.priority === 'rush') return 1;
        return 0;
    };

    const manufacturerDesignRequests = filteredProjects.filter(p => p.status === 'design_modification' || p.status === '3d_model').sort(sortByRush);
    const manufacturerPendingProduction = filteredProjects.filter(p => p.status === 'approved_for_production').sort(sortByRush);
    const manufacturerOngoingProduction = filteredProjects.filter(p => p.status === 'production').sort(sortByRush);
    const manufacturerInDelivery = filteredProjects.filter(p => p.status === 'delivery').sort(sortByRush);
    const manufacturerCompleted = filteredProjects.filter(p => p.status === 'completed');
    const adminDesignReady = filteredProjects.filter(p => p.status === 'design_ready');
    const recentProjects = filteredProjects.slice(0, 5);

    // ─── Financial Source of Truth ──────────────────────────────────────────────
    // RULE: selling_price is the canonical sale price. budget is the legacy fallback.
    const getSalePrice = (p: any) => Number(p.financials?.selling_price || p.budget || 0);

    // RULE: Commission for a project is estimated from its rate fields.
    //       Once exported to expenses, the expense row IS the real commission.
    const getCommissionEstimate = (p: any) => {
        if (!p.affiliate_id && !p.sales_agent_id) return 0;
        if (p.affiliate_commission_type === 'fixed') return Number(p.affiliate_commission_rate || 0);
        return (getSalePrice(p) * Number(p.affiliate_commission_rate || 0)) / 100;
    };
    // ────────────────────────────────────────────────────────────────────────────

    // Total Pipeline Value
    const totalProjectValue = filteredProjects.reduce((sum, p) => sum + getSalePrice(p), 0);

    // Collected: amount_paid is the exact field; if status=paid and amount_paid=0, use the full invoice amount.
    const totalCollected = filteredInvoices.reduce((sum, i) => {
        const paid = (i.amount_paid && i.amount_paid > 0) ? i.amount_paid : (i.status === 'paid' ? i.amount : 0);
        return sum + paid;
    }, 0);

    // Pending = invoice total minus what is already collected
    const totalPending = filteredInvoices.reduce((sum, i) => {
        const paid = (i.amount_paid && i.amount_paid > 0) ? i.amount_paid : (i.status === 'paid' ? i.amount : 0);
        return sum + Math.max(0, i.amount - paid);
    }, 0);

    // Real Expenses from the expenses table (all statuses except cancelled)
    // This already includes commissions that were exported.
    const totalRealExpenses = (filteredExpenses as any[])
        ?.filter(e => e.status !== 'cancelled')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    // Estimated Commissions (ONLY for projects NOT yet exported — these don't appear in expenses yet)
    const totalPendingCommissions = filteredProjects.reduce((sum, p) => {
        if (p.financials?.commission_exported_to_expenses) return sum; // already counted in totalRealExpenses
        return sum + getCommissionEstimate(p);
    }, 0);

    // Production Costs from project financials (only for projects NOT yet exported to expenses)
    const totalProductionCost = filteredProjects.reduce((sum, p) => {
        const COST_STATUSES = ['production', 'delivery', 'completed'];
        if (!COST_STATUSES.includes(p.status)) return sum;
        if (p.financials?.exported_to_expenses) return sum; // already in real expenses
        return sum +
            Number(p.financials?.supplier_cost || 0) +
            Number(p.financials?.shipping_cost || 0) +
            Number(p.financials?.customs_fee || 0);
    }, 0);

    // ── Profit Calculations ───────────────────────────────────────────────────────
    // Actual Profit = Cash Collected - Real Expenses (already includes exported commissions)
    // We do NOT subtract pending commissions here since they aren't paid yet.
    const totalProfit = totalCollected - totalRealExpenses;

    // Projected Profit = Total Pipeline Value - All costs (real + production + pending commissions)
    const projectedProfit = totalProjectValue - totalRealExpenses - totalProductionCost - totalPendingCommissions;

    // Keep this alias for UI referencing totalCommissions
    const totalCommissions = totalPendingCommissions;

    // ─── Affiliate (Sales) Specific Calculations ──────────────────────────────────
    // The dashboard leaderboard shows ESTIMATED commissions (project rates, including pre-export).
    // The AffiliateDetails profile page shows ACTUAL commissions from expense rows.
    const sellerStats: Record<string, { id: string, name: string, projectCount: number, volume: number, commissions: number }> = {};
    if (users) {
        users.filter(u => u.role === 'affiliate' || u.role === 'admin').forEach(u => {
            sellerStats[u.id] = { id: u.id, name: u.full_name, projectCount: 0, volume: 0, commissions: 0 };
        });

        projects?.forEach(p => {
            const responsibleId = p.sales_agent_id || p.affiliate_id;
            if (responsibleId && sellerStats[responsibleId]) {
                const salePrice = getSalePrice(p);
                const comRate = Number(p.affiliate_commission_rate || 0);
                const commission = p.affiliate_commission_type === 'fixed' ? comRate : (salePrice * comRate) / 100;
                sellerStats[responsibleId].projectCount++;
                sellerStats[responsibleId].volume += salePrice;
                sellerStats[responsibleId].commissions += commission;
            }
        });
    }

    const leaderboard = Object.values(sellerStats)
        .filter(s => s.projectCount > 0)
        .sort((a, b) => b.volume - a.volume);

    // Find current affiliate user's rank
    const myRankIndex = leaderboard.findIndex(s => s.id === profile?.id);
    const myRank = myRankIndex !== -1 ? myRankIndex + 1 : '-';
    const myStats = profile ? sellerStats[profile.id] : null;

    // ─── Time-Based Statistics ────────────────────────────────────────────────────
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Start of week (Monday)
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - distanceToMonday);

    // Start of Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const isToday = (dateStr: string) => new Date(dateStr) >= today;
    const isThisWeek = (dateStr: string) => new Date(dateStr) >= startOfWeek;
    const isThisMonth = (dateStr: string) => new Date(dateStr) >= startOfMonth;

    const stats = {
        today: { count: 0, volume: 0, collected: 0 },
        week: { count: 0, volume: 0, collected: 0 },
        month: { count: 0, volume: 0, collected: 0 }
    };

    filteredProjects.forEach(p => {
        const val = getSalePrice(p);
        if (isToday(p.created_at)) { stats.today.count++; stats.today.volume += val; }
        if (isThisWeek(p.created_at)) { stats.week.count++; stats.week.volume += val; }
        if (isThisMonth(p.created_at)) { stats.month.count++; stats.month.volume += val; }
    });

    filteredInvoices.forEach(i => {
        // Use paid_at if available, otherwise created_at for recent payments gauge
        const dateStr = i.paid_at || i.created_at;
        const paidAmount = (i.amount_paid && i.amount_paid > 0) ? i.amount_paid : (i.status === 'paid' ? i.amount : 0);

        // Only count actual payments that happened in the period
        if (paidAmount > 0) {
            // If the invoice was paid, and the status was updated in this timeframe
            if (isToday(dateStr)) stats.today.collected += paidAmount;
            if (isThisWeek(dateStr)) stats.week.collected += paidAmount;
            if (isThisMonth(dateStr)) stats.month.collected += paidAmount;
        }
    });
    // ────────────────────────────────────────────────────────────────────────────

    console.log("--- Dashboard Financial Debug ---");
    console.log("Projects:", projects?.length, "Value:", totalProjectValue);
    console.log("Invoices:", invoices?.length, "Collected:", totalCollected, "Pending:", totalPending);
    console.log("Expenses (Table):", expenses?.length, "Paid:", totalRealExpenses);
    console.log("Production Costs (Projects):", totalProductionCost);
    console.log("Calculated Profit:", totalProfit);
    console.log("---------------------------------");

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div>
                    <h1 className="text-4xl font-serif text-black dark:text-white tracking-wide">Welcome back, <span className="text-luxury-gold italic">{profile?.full_name?.split(' ')[0]}</span></h1>
                    <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">Here is what needs your attention today.</p>
                </div>
                {role === 'admin' && (
                    <Button asChild className="bg-luxury-gold text-black hover:bg-luxury-gold/90">
                        <Link to="/dashboard/projects/new">New Project</Link>
                    </Button>
                )}
            </div>

            {/* MANUFACTURER DASHBOARD */}
            {role === 'manufacturer' && (
                <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* KPI 1: Design Ready */}
                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-blue-500/30 transition-colors duration-500 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-blue-500 transition-colors">Design Ready</CardTitle>
                                <Clock className="h-4 w-4 text-blue-500/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-blue-500 transition-colors duration-500">
                                    {manufacturerDesignRequests.length}
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">À Démarrer</p>
                            </CardContent>
                        </Card>

                        {/* KPI 2: Ongoing Production */}
                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-purple-500/30 transition-colors duration-500 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-purple-500 transition-colors">En Cours (Ongoing)</CardTitle>
                                <TrendingUp className="h-4 w-4 text-purple-500/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-purple-500 transition-colors duration-500">
                                    {manufacturerOngoingProduction.length}
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">En Fabrication</p>
                            </CardContent>
                        </Card>

                        {/* KPI 3: Completed Projects */}
                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-green-500/30 transition-colors duration-500 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-green-500 transition-colors">Total Fabriqué</CardTitle>
                                <Briefcase className="h-4 w-4 text-green-500/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-green-500 transition-colors duration-500">
                                    {manufacturerCompleted.length}
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Projets historiques achevés</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {/* 1. DESIGN REQUESTS */}
                        <Card className="border-l-4 border-l-blue-500 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-serif">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    Design Requests
                                </CardTitle>
                                <CardDescription className="uppercase tracking-widest text-[10px]">New ideas needing 3D design & cost estimation.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {manufacturerDesignRequests.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">No pending design requests.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {manufacturerDesignRequests.map(project => (
                                            <div key={project.id} className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg shadow-sm border transition-colors group ${project.priority === 'rush' ? 'bg-red-50 dark:bg-red-950/40 border-red-500/50 hover:border-red-500' : 'bg-zinc-50 dark:bg-zinc-900 border-black/5 dark:border-white/5 hover:border-blue-500/30'}`}>
                                                <div className="flex-1 min-w-[150px]">
                                                    <div className="font-serif text-base group-hover:text-blue-500 transition-colors flex items-center gap-2 flex-wrap">
                                                        {project.title}
                                                        {project.priority === 'rush' && (
                                                            <Badge variant="destructive" className="bg-red-500 text-[9px] uppercase tracking-widest leading-none px-1.5 py-0.5 whitespace-nowrap">RUSH</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                                                        Status: <span className="capitalize">{project.status.replace('_', ' ')}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Button size="sm" variant="outline" className="border-blue-500/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" asChild>
                                                        <Link to={`/dashboard/projects/${project.id}`}>View Request</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 2. PENDING PRODUCTION */}
                        <Card className="border-l-4 border-l-green-500 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-serif">
                                    <AlertCircle className="w-5 h-5 text-green-500" />
                                    Pending Production
                                </CardTitle>
                                <CardDescription className="uppercase tracking-widest text-[10px]">Approved designs ready to be manufactured.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {manufacturerPendingProduction.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">No approved production tasks.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {manufacturerPendingProduction.map(project => (
                                            <div key={project.id} className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg shadow-sm border transition-colors group ${project.priority === 'rush' ? 'bg-red-50 dark:bg-red-950/40 border-red-500/50 hover:border-red-500' : 'bg-zinc-50 dark:bg-zinc-900 border-black/5 dark:border-white/5 hover:border-green-500/30'}`}>
                                                <div className="flex-1 min-w-[150px]">
                                                    <div className="font-serif text-base group-hover:text-green-500 transition-colors flex items-center gap-2 flex-wrap">
                                                        {project.title}
                                                        {project.priority === 'rush' && (
                                                            <Badge variant="destructive" className="bg-red-500 text-[9px] uppercase tracking-widest leading-none px-1.5 py-0.5 whitespace-nowrap">RUSH</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                                                        Pending Production
                                                        {project.deadline && ` • Due ${new Date(project.deadline).toLocaleDateString()}`}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Button size="sm" variant="outline" className="border-green-500/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" asChild>
                                                        <Link to={`/dashboard/projects/${project.id}`}>View Details</Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 shadow border-green-700/50 text-white"
                                                        onClick={async () => {
                                                            if (confirm("Start production for this project?")) {
                                                                await apiProjects.updateStatus(project.id, 'production');
                                                                window.location.reload();
                                                            }
                                                        }}
                                                    >
                                                        Start Production
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 3. ONGOING PRODUCTION */}
                        <Card className="border-l-4 border-l-purple-500 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-serif">
                                    <TrendingUp className="w-5 h-5 text-purple-500" />
                                    Ongoing Production
                                </CardTitle>
                                <CardDescription className="uppercase tracking-widest text-[10px]">Projects currently being manufactured.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {manufacturerOngoingProduction.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">No projects currently in production.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {manufacturerOngoingProduction.map(project => (
                                            <div key={project.id} className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg shadow-sm border transition-colors group ${project.priority === 'rush' ? 'bg-red-50 dark:bg-red-950/40 border-red-500/50 hover:border-red-500' : 'bg-zinc-50 dark:bg-zinc-900 border-black/5 dark:border-white/5 hover:border-purple-500/30'}`}>
                                                <div className="flex-1 min-w-[150px]">
                                                    <div className="font-serif text-base group-hover:text-purple-500 transition-colors flex items-center gap-2 flex-wrap">
                                                        {project.title}
                                                        {project.priority === 'rush' && (
                                                            <Badge variant="destructive" className="bg-red-500 text-[9px] uppercase tracking-widest leading-none px-1.5 py-0.5 whitespace-nowrap">RUSH</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                                                        Production Started
                                                        {project.deadline && ` • Due ${new Date(project.deadline).toLocaleDateString()}`}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20" asChild>
                                                        <Link to={`/dashboard/projects/${project.id}`}>View Details</Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-purple-600 hover:bg-purple-700 shadow border-purple-700/50 text-white"
                                                        onClick={async () => {
                                                            if (confirm("Production finished? Send to delivery?")) {
                                                                await apiProjects.updateStatus(project.id, 'delivery');
                                                                window.location.reload();
                                                            }
                                                        }}
                                                    >
                                                        Mark as Delivery
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 4. IN DELIVERY */}
                        <Card className="border-l-4 border-l-amber-500 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-serif">
                                    <Package className="w-5 h-5 text-amber-500" />
                                    In Delivery
                                </CardTitle>
                                <CardDescription className="uppercase tracking-widest text-[10px]">Finished rings awaiting client delivery.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {manufacturerInDelivery.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">No projects currently in delivery.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {manufacturerInDelivery.map(project => (
                                            <div key={project.id} className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg shadow-sm border transition-colors group ${project.priority === 'rush' ? 'bg-red-50 dark:bg-red-950/40 border-red-500/50 hover:border-red-500' : 'bg-zinc-50 dark:bg-zinc-900 border-black/5 dark:border-white/5 hover:border-amber-500/30'}`}>
                                                <div className="flex-1 min-w-[150px]">
                                                    <div className="font-serif text-base group-hover:text-amber-500 transition-colors flex items-center gap-2 flex-wrap">
                                                        {project.title}
                                                        {project.priority === 'rush' && (
                                                            <Badge variant="destructive" className="bg-red-500 text-[9px] uppercase tracking-widest leading-none px-1.5 py-0.5 whitespace-nowrap">RUSH</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                                                        Shipment Pending
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" asChild>
                                                        <Link to={`/dashboard/projects/${project.id}`}>View Details</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* ADMIN DASHBOARD -KPIs & DESIGN READY SECTION */}
            {role === 'admin' && (
                <div className="grid gap-6">
                    {/* Financial KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 dark:hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Total Collected</CardTitle>
                                <Banknote className="h-4 w-4 text-green-600/70 dark:text-green-500/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-500">
                                    ${totalCollected.toLocaleString()}
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Cash Received</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 dark:hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Pending Payment</CardTitle>
                                <Clock className="h-4 w-4 text-amber-600/70 dark:text-amber-500/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-500">
                                    ${totalPending.toLocaleString()}
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Outstanding Balance</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 dark:hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Commissions</CardTitle>
                                <Banknote className="h-4 w-4 text-purple-600/70 dark:text-purple-500/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-500">
                                    ${totalCommissions.toLocaleString()}
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Affiliate Payouts (Est)</p>
                            </CardContent>
                        </Card>

                        {role === 'admin' && (
                            <Card className="bg-gradient-to-br from-luxury-gold/10 to-black/40 backdrop-blur-xl border-luxury-gold/30 shadow-[0_4px_20px_rgba(210,181,123,0.1) relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-tl from-luxury-gold/10 to-transparent opacity-50" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-luxury-gold">Actual Profit</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-luxury-gold" />
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-3xl font-serif text-black dark:text-white">
                                        ${totalProfit.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-luxury-gold/70 uppercase tracking-widest mt-1 flex justify-between gap-2 font-medium">
                                        <span>Net Income</span>
                                        <span title="Potential profit if all invoices are paid" className="opacity-70">/ ${projectedProfit.toLocaleString()} Proj.</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* AFFILIATE DASHBOARD - SPECIFIC KPIs */}
            {role === 'affiliate' && (
                <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 dark:hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-luxury-gold transition-colors">Mes Commissions</CardTitle>
                                <Banknote className="h-4 w-4 text-luxury-gold/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-luxury-gold transition-colors duration-500">
                                    ${(myStats?.commissions || 0).toLocaleString()}
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Gagnées sur {myStats?.projectCount || 0} projets</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 dark:hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-luxury-gold transition-colors">Volume Généré</CardTitle>
                                <Briefcase className="h-4 w-4 text-luxury-gold/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-luxury-gold transition-colors duration-500">
                                    ${(myStats?.volume || 0).toLocaleString()}
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Chiffre d'Affaires Apporté</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Classement Leaderboard</CardTitle>
                                <Trophy className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-serif text-black dark:text-white flex items-baseline gap-1">
                                    <span className="text-lg text-luxury-gold/50">#</span>{myRank}
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Sur {leaderboard.length} Ambassadeurs actifs</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Objectif Mensuel</CardTitle>
                                <TrendingUp className="h-4 w-4 text-blue-500/70" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-serif text-black dark:text-white">
                                    ${Math.min(stats.month.volume, profile?.monthly_goal || 50000).toLocaleString()}
                                </div>
                                <div className="mt-2 w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min((stats.month.volume / (profile?.monthly_goal || 50000)) * 100, 100)}%` }} />
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1 flex justify-between">
                                    <span>Palier: {(profile?.monthly_goal || 50000) / 1000}k$</span>
                                    <span>{Math.round(Math.min((stats.month.volume / (profile?.monthly_goal || 50000)) * 100, 100))}%</span>
                                </p>
                            </CardContent>
                        </Card>

                        {/* TIME-BASED STATISTICS COMPONENT */}
                        {((role as string) === 'admin' || (role as string) === 'affiliate') && (
                            <Card className="col-span-full bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-2xl relative overflow-hidden mt-2">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-luxury-gold/50 to-transparent opacity-50" />
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/5">

                                        {/* TODAY */}
                                        <div className="p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-2 mb-6 text-luxury-gold/80 group-hover:text-luxury-gold transition-colors">
                                                <Activity className="w-5 h-5" />
                                                <h3 className="font-serif text-lg tracking-wide">Aujourd'hui</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                                    <span className="text-xs uppercase tracking-widest text-gray-500">Nvx Projets</span>
                                                    <span className="font-serif text-xl text-black dark:text-white">{stats.today.count}</span>
                                                </div>
                                                <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                                    <span className="text-xs uppercase tracking-widest text-gray-500">Volume Généré</span>
                                                    <span className="font-serif text-xl text-black dark:text-white">${stats.today.volume.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs uppercase tracking-widest text-green-600/70">Cash Encaissé</span>
                                                    <span className="font-serif text-xl text-green-600 dark:text-green-400">${stats.today.collected.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* THIS WEEK */}
                                        <div className="p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-2 mb-6 text-luxury-gold/80 group-hover:text-luxury-gold transition-colors">
                                                <BarChart3 className="w-5 h-5" />
                                                <h3 className="font-serif text-lg tracking-wide">Cette Semaine</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                                    <span className="text-xs uppercase tracking-widest text-gray-500">Nvx Projets</span>
                                                    <span className="font-serif text-xl text-black dark:text-white">{stats.week.count}</span>
                                                </div>
                                                <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                                    <span className="text-xs uppercase tracking-widest text-gray-500">Volume Généré</span>
                                                    <span className="font-serif text-xl text-black dark:text-white">${stats.week.volume.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs uppercase tracking-widest text-green-600/70">Cash Encaissé</span>
                                                    <span className="font-serif text-xl text-green-600 dark:text-green-400">${stats.week.collected.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* THIS MONTH */}
                                        <div className="p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-2 mb-6 text-luxury-gold/80 group-hover:text-luxury-gold transition-colors">
                                                <CalendarDays className="w-5 h-5" />
                                                <h3 className="font-serif text-lg tracking-wide">Ce Mois</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                                    <span className="text-xs uppercase tracking-widest text-gray-500">Nvx Projets</span>
                                                    <span className="font-serif text-xl text-black dark:text-white">{stats.month.count}</span>
                                                </div>
                                                <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                                    <span className="text-xs uppercase tracking-widest text-gray-500">Volume Généré</span>
                                                    <span className="font-serif text-xl text-black dark:text-white">${stats.month.volume.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs uppercase tracking-widest text-green-600/70">Cash Encaissé</span>
                                                    <span className="font-serif text-xl text-green-600 dark:text-green-400">${stats.month.collected.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {adminDesignReady.length > 0 && (
                            <Card className="border-l-2 border-l-luxury-gold bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 mb-6 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-luxury-gold font-serif text-xl">
                                        <AlertCircle className="w-5 h-5" />
                                        Designs Pending Approval
                                    </CardTitle>
                                    <CardDescription className="uppercase tracking-widest text-[10px]">Manufacturer has submitted these for review.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {adminDesignReady.map(project => (
                                            <div key={project.id} className="group flex items-center justify-between p-4 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors shadow-sm rounded-lg border border-black/5 dark:border-white/5">
                                                <div>
                                                    <div className="font-serif text-lg text-black dark:text-white group-hover:text-luxury-gold transition-colors">{project.title}</div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider mt-1">Submitted by Manufacturer</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" className="border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold hover:text-black" asChild>
                                                        <Link to={`/dashboard/projects/${project.id}`}>Review Design</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* SHARED / DEFAULT DASHBOARD (Recent Projects) */}
            {((role as string) === 'admin' || (role as string) === 'affiliate') && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Revenue Overview */}
                    <Card className="col-span-2 lg:col-span-2 bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 shadow-xl">
                        <CardHeader>
                            <CardTitle className="font-serif text-xl tracking-wide">Revenue Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <RevenueChart />
                        </CardContent>
                    </Card>

                    {/* Standard Dashboard Cards... */}
                    <Card className="col-span-2 lg:col-span-1 bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 shadow-xl">
                        <CardHeader>
                            <CardTitle className="font-serif text-xl tracking-wide">Recent Projects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentProjects.map((project) => (
                                    <div key={project.id} className="group flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <h3 className="font-serif text-lg text-gray-800 dark:text-gray-200 group-hover:text-luxury-gold transition-colors">{project.title}</h3>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider mt-1">{project.status.replace('_', ' ')} <span className="text-luxury-gold/50">•</span> {project.client?.full_name}</p>
                                        </div>
                                        <Badge variant={project.status === 'completed' ? 'secondary' : 'default'} className="bg-luxury-gold/10 text-luxury-gold hover:bg-luxury-gold hover:text-black border border-luxury-gold/30">
                                            {project.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* RECENT ACTIVITY WIDGET */}
                    <Card className="col-span-2 bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 shadow-xl">
                        <CardHeader>
                            <CardTitle className="font-serif text-xl tracking-wide">Recent Activity</CardTitle>
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
