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

import { Clock, AlertCircle, Banknote, TrendingUp } from 'lucide-react';

import { apiExpenses } from '@/services/apiExpenses';

// ... (imports)

export default function Dashboard() {
    const { profile, role } = useAuth();

    // Fetch all projects
    const { data: projects, isLoading: projectsLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll
    });

    const { data: invoices, isLoading: invoicesLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll
    });

    // NEW: Fetch all expenses to subtract from profit
    const { data: expenses, isLoading: expensesLoading } = useQuery({
        queryKey: ['expenses'],
        queryFn: apiExpenses.getAll
    });

    if (projectsLoading || invoicesLoading || expensesLoading) return <div>Loading dashboard...</div>;

    // ... (filters)
    const manufacturerDesignRequests = projects?.filter(p => p.status === 'designing' || p.status === 'design_modification' || p.status === '3d_model') || [];
    const manufacturerPendingProduction = projects?.filter(p => p.status === 'approved_for_production') || [];
    const manufacturerOngoingProduction = projects?.filter(p => p.status === 'production') || [];
    const adminDesignReady = projects?.filter(p => p.status === 'design_ready') || [];
    const recentProjects = projects?.slice(0, 5) || [];

    // Financial calculations
    const totalProjectValue = projects?.reduce((sum, p) => sum + (p.financials?.selling_price || p.budget || 0), 0) || 0;

    // Collected (Invoices)
    const totalCollected = invoices?.reduce((sum, i) => {
        const paid = i.amount_paid || (i.status === 'paid' ? i.amount : 0);
        return sum + paid;
    }, 0) || 0;

    // Pending (Invoices)
    const totalPending = invoices?.reduce((sum, i) => {
        const paid = i.amount_paid || (i.status === 'paid' ? i.amount : 0);
        return sum + (i.amount - paid);
    }, 0) || 0;

    // 2. Calculate Affiliate Commissions
    const totalCommissions = projects?.reduce((sum, p) => {
        if (!p.affiliate_id) return sum;

        let comm = 0;
        if (p.affiliate_commission_type === 'fixed') {
            comm = p.affiliate_commission_rate || 0;
        } else {
            // Percent of Budget
            const budget = p.financials?.selling_price || p.budget || 0;
            const rate = p.affiliate_commission_rate || 0;
            comm = (budget * rate) / 100;
        }
        return sum + comm;
    }, 0) || 0;

    // Expenses Calculation (Only PAID expenses count towards actual costs for now, or maybe all?)
    // Usually Profit = Income - Expenses. Let's subtract all PAID expenses.
    const totalRealExpenses = expenses
        ?.filter(e => e.status === 'paid')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    // 1. Calculate Production Costs (Estimated from Projects) - OPTIONAL: We might want to replace this with REAL expenses if they are tracked?
    // For now, let's keep the project-based estimation as "COGS" maybe? Or just use the Real Expenses?
    // User asked: "expense should be taken in consideration in the financial data".
    // Let's use Real Expenses as the "Total Expenses" line item.

    // 1. Calculate Production Costs (Estimated from Projects)
    const totalProductionCost = projects?.reduce((sum, p) => {
        // Production costs are only "incurred" once production is officially launched
        const COST_RELEVANT_STATUSES = ['production', 'delivery', 'completed'];
        if (!COST_RELEVANT_STATUSES.includes(p.status)) return sum;

        // IMPORTANT: If the cost was already manually exported to the 'expenses' table, 
        // we don't count it here to avoid double-counting in projectedProfit.
        if (p.financials?.exported_to_expenses) return sum;

        return sum +
            (p.financials?.supplier_cost || 0) +
            (p.financials?.shipping_cost || 0) +
            (p.financials?.customs_fee || 0);
    }, 0) || 0;

    // Actual Profit = Collected - Real Expenses ONLY (no double-counting with production costs)
    // The expenses table is the single source of truth for all costs (supplier, shipping, overhead, etc.)
    // Production costs from project financials are used ONLY for projected profit when expenses aren't tracked yet.
    const totalProfit = totalCollected - totalRealExpenses - totalCommissions;
    const projectedProfit = totalProjectValue - totalRealExpenses - totalProductionCost - totalCommissions;

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
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* 1. DESIGN REQUESTS */}
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                Design Requests
                            </CardTitle>
                            <CardDescription>New ideas needing 3D design & cost estimation.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {manufacturerDesignRequests.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No pending design requests.</p>
                            ) : (
                                <div className="space-y-4">
                                    {manufacturerDesignRequests.map(project => (
                                        <div key={project.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                            <div>
                                                <div className="font-medium text-sm">{project.title}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Status: <span className="capitalize">{project.status.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline" asChild>
                                                <Link to={`/dashboard/projects/${project.id}`}>View Request</Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 2. PENDING PRODUCTION */}
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-green-500" />
                                Pending Production
                            </CardTitle>
                            <CardDescription>Approved designs ready for manufacturing.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {manufacturerPendingProduction.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No approved production tasks.</p>
                            ) : (
                                <div className="space-y-4">
                                    {manufacturerPendingProduction.map(project => (
                                        <div key={project.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                            <div>
                                                <div className="font-medium text-sm">{project.title}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Pending Production
                                                    {project.deadline && ` • Due ${new Date(project.deadline).toLocaleDateString()}`}
                                                </div>
                                            </div>

                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
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
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 3. ONGOING PRODUCTION */}
                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-purple-500" />
                                Ongoing Production
                            </CardTitle>
                            <CardDescription>Projects currently being manufactured.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {manufacturerOngoingProduction.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No projects currently in production.</p>
                            ) : (
                                <div className="space-y-4">
                                    {manufacturerOngoingProduction.map(project => (
                                        <div key={project.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                            <div>
                                                <div className="font-medium text-sm">{project.title}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Production Started
                                                    {project.deadline && ` • Due ${new Date(project.deadline).toLocaleDateString()}`}
                                                </div>
                                            </div>

                                            <Button size="sm" variant="outline" asChild>
                                                <Link to={`/dashboard/projects/${project.id}`}>View Details</Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
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

                        <Card className="bg-gradient-to-br from-luxury-gold/10 to-black/40 backdrop-blur-xl border-luxury-gold/30 shadow-[0_4px_20px_rgba(210,181,123,0.1)] relative overflow-hidden group">
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
                    </div>

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
            )}

            {/* SHARED / DEFAULT DASHBOARD (Recent Projects) */}
            {(role === 'admin' || role === 'sales') && (
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
