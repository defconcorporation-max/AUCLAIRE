import { apiClients, Client } from '@/services/apiClients';
import { apiInvoices, Invoice } from '@/services/apiInvoices';
import { apiProjects, Project } from '@/services/apiProjects';
import { useQuery } from '@tanstack/react-query';
import { apiUsers } from '@/services/apiUsers';
import { apiExpenses, Expense } from '@/services/apiExpenses';
import { apiActivities, ActivityLog } from '@/services/apiActivities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Banknote, Briefcase, Trophy, ChevronUp, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { financialUtils } from '@/utils/financialUtils';

export default function AnalyticsDashboard() {
    const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'total'>('month');
    const { data: projects = [], isLoading: pLoad } = useQuery({ queryKey: ['projects'], queryFn: apiProjects.getAll });
    const { data: clients = [], isLoading: cLoad } = useQuery({ queryKey: ['clients'], queryFn: apiClients.getAll });
    const { data: invoices = [], isLoading: iLoad } = useQuery({ queryKey: ['invoices'], queryFn: apiInvoices.getAll });
    const { data: users = [], isLoading: uLoad } = useQuery({ queryKey: ['users'], queryFn: apiUsers.getAll });
    const { data: expenses = [], isLoading: eLoad } = useQuery({ queryKey: ['expenses'], queryFn: apiExpenses.getAll });
    const { data: activities = [], isLoading: alLoad } = useQuery({ queryKey: ['activities'], queryFn: apiActivities.getAll });

    if (pLoad || cLoad || iLoad || uLoad || eLoad || alLoad) {
        return <div className="p-8 text-center text-luxury-gold animate-pulse font-serif">Loading Power Analytics...</div>;
    }

    // Helpers to prevent string concatenation
    const getSalePrice = (p: Project) => Number(p.financials?.selling_price || p.budget || 0);

    // Calculate Trend Data
    const getTrendData = () => {
        const { start: startCurr } = financialUtils.getPeriodRange(timeframe);
        let startPrev = new Date(startCurr);
        let label = "";

        if (timeframe === 'day') {
            startPrev.setDate(startPrev.getDate() - 1);
            label = "hier";
        } else if (timeframe === 'week') {
            startPrev.setDate(startPrev.getDate() - 7);
            label = "semaine dernière";
        } else if (timeframe === 'month') {
            startPrev.setMonth(startPrev.getMonth() - 1);
            label = "mois dernier";
        } else {
            label = "total";
        }

        const getStatsForRangeStandard = (start: Date, end: Date) => {
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

            // Source of Truth for Cash: activity_logs via shared Utils
            const collected = financialUtils.getCollectedFromLogs(activities || [], start, end);

            const invoiced = periodInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
            const expAmount = periodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
            
            const count = periodInvoices.length;
            const avgOrder = count > 0 ? Math.round(invoiced / count) : 0;
            const profit = collected - expAmount;
            const outstanding = invoiced - collected;
            
            return { collected, invoiced, avgOrder, clients: periodClients.length, expenses: expAmount, profit, outstanding };
        };

        const current = getStatsForRangeStandard(startCurr, new Date());
        const previous = getStatsForRangeStandard(startPrev, startCurr);

        const calcGrowth = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return Math.round(((curr - prev) / prev) * 100);
        };

        return {
            current,
            previous,
            label,
            growth: {
                collected: calcGrowth(current.collected, previous.collected),
                avgOrder: calcGrowth(current.avgOrder, previous.avgOrder),
                clients: calcGrowth(current.clients, previous.clients),
                profit: calcGrowth(current.profit, previous.profit),
                outstanding: calcGrowth(current.outstanding, previous.outstanding)
            }
        };
    };

    const trendData = getTrendData();

    // 2. Monthly Revenue Chart (Paid Invoices)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyData = months.map(m => ({ month: m, collected: 0, invoiced: 0, expenses: 0 }));

    // Aggregate collections by month from activity_logs using shared cash helper
    months.forEach((_, monthIdx) => {
        const start = new Date(currentYear, monthIdx, 1, 0, 0, 0, 0);
        const end = new Date(currentYear, monthIdx + 1, 0, 23, 59, 59, 999);
        monthlyData[monthIdx].collected = financialUtils.getCollectedFromLogs(activities || [], start, end);
    });

    // Handle invoiced and expenses as before but ensure year check
    invoices.forEach(inv => {
        if (inv.status === 'void') return;
        const createdDate = new Date(inv.created_at);
        if (createdDate.getFullYear() === currentYear) {
            monthlyData[createdDate.getMonth()].invoiced += Number(inv.amount || 0);
        }
    });

    // Aggregate expenses by month
    expenses.forEach(exp => {
        if (exp.status === 'cancelled') return;
        const date = new Date(exp.created_at);
        if (date.getFullYear() === currentYear) {
            monthlyData[date.getMonth()].expenses += Number(exp.amount || 0);
        }
    });

    const PRODUCTION_READY_STATUSES = ['approved_for_production', 'production', 'delivery', 'completed'];
    const isProjectASale = (p: Project) => PRODUCTION_READY_STATUSES.includes(p.status) || invoices.some(inv => inv.project_id === p.id);

    // 3. Seller/Affiliate Leaderboard
    // Commission totals come from expense rows (same source of truth as apiAffiliates.getStats)
    const sellerStats: Record<string, { id: string, name: string, role: string, projectCount: number, volume: number, commissions: number, cashCollected: number }> = {};

    users.filter(u => (u.role as string) === 'affiliate' || (u.role as string) === 'admin' || (u.role as string) === 'ambassador').forEach(u => {
        sellerStats[u.id] = { id: u.id, name: u.full_name, role: u.role as string, projectCount: 0, volume: 0, commissions: 0, cashCollected: 0 };
    });

    // Volume and project count from projects - Strictly Production Ready or Invoiced
    projects.forEach(p => {
        if (!isProjectASale(p)) return;
        const responsibleId = p.sales_agent_id || p.affiliate_id;
        if (responsibleId && sellerStats[responsibleId]) {
            sellerStats[responsibleId].projectCount++;
            sellerStats[responsibleId].volume += getSalePrice(p);
            
            // Add accurate Cash Collected metrics corresponding to this project
            const pInvoices = invoices.filter(inv => inv.project_id === p.id);
            pInvoices.forEach(inv => {
                const paidValue = Number(inv.amount_paid) > 0 ? Number(inv.amount_paid) : (inv.status === 'paid' ? Number(inv.amount) : 0);
                sellerStats[responsibleId].cashCollected += paidValue;
            });
        }
    });

    // Commissions come from expense rows (pending + paid), matching apiAffiliates.getStats
    (expenses as { category: string; status: string; amount?: number; recipient_id?: string; description?: string }[]).filter(e => e.category === 'commission' && e.status !== 'cancelled' && !e.description?.includes('Commission Payout')).forEach(e => {
        const recipientId = e.recipient_id;
        if (recipientId && sellerStats[recipientId]) {
            sellerStats[recipientId].commissions += Number(e.amount || 0);
        }
    });

    const leaderboard = Object.values(sellerStats)
        .filter(s => s.projectCount > 0)
        .sort((a, b) => b.volume - a.volume);

    // 4. POWER ANALYTICS: Revenue Forecasting & Projections
    const PROBABILITY_MAP: Record<string, number> = {
        designing: 0.1,
        '3d_model': 0.4,
        design_ready: 0.6,
        waiting_for_approval: 0.8,
        design_modification: 0.4,
        approved_for_production: 0.9,
        production: 1.0,
        delivery: 1.0,
        completed: 1.0,
    };

    // Calculate Projected Cash Flow for next 3 months
    const currentMonthIdx = new Date().getMonth();
    const next3MonthsData = [
        { name: 'Ce mois', projected: monthlyData[currentMonthIdx].collected },
        { name: 'Mois +1', projected: 0 },
        { name: 'Mois +2', projected: 0 },
    ];

    projects.forEach(p => {
        if (p.status === 'completed' || p.status === 'cancelled') return;
        
        const totalValue = getSalePrice(p);
        const paidSoFar = Number(p.financials?.paid_amount || 0);
        const remainingValue = Math.max(0, totalValue - paidSoFar);
        
        const prob = PROBABILITY_MAP[p.status] || 0;
        const weightedRemaining = remainingValue * prob;

        if (['production', 'delivery', 'approved_for_production'].includes(p.status)) {
            next3MonthsData[0].projected += weightedRemaining;
        } else if (['3d_model', 'design_ready', 'waiting_for_approval'].includes(p.status)) {
            next3MonthsData[1].projected += weightedRemaining;
        } else {
            next3MonthsData[2].projected += weightedRemaining;
        }
    });

    // 5. POWER ANALYTICS: Operational Velocity (Days in Status)
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
            const end = new Date(sorted[i+1].created_at);
            const days = Math.max(0.1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const prevStatusMsg = sorted[i].details.toLowerCase().split('to ')[1];
            if (prevStatusMsg && velocityData[prevStatusMsg]) {
                velocityData[prevStatusMsg].totalDays += days;
                velocityData[prevStatusMsg].count++;
            }
        }
    });

    // 6. POWER ANALYTICS: Manufacturer Performance Scorecards
    const manufacturerStats: Record<string, { id: string, name: string, projectCount: number, volume: number, totalProdDays: number, prodCount: number, modCount: number }> = {};
    
    users.filter(u => u.role === 'manufacturer').forEach(u => {
        manufacturerStats[u.id] = { id: u.id, name: u.full_name, projectCount: 0, volume: 0, totalProdDays: 0, prodCount: 0, modCount: 0 };
    });

    projects.forEach(p => {
        if (p.manufacturer_id && manufacturerStats[p.manufacturer_id]) {
            manufacturerStats[p.manufacturer_id].projectCount++;
            manufacturerStats[p.manufacturer_id].volume += getSalePrice(p);
            
            // Speed Calculation
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
                    prodStart = null; // Reset for next potential cycle
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-serif text-black dark:text-white tracking-wide">Business Analytics</h1>
                    <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">Global performance & seller leaderboard.</p>
                </div>
                
                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl backdrop-blur-md border border-black/10 dark:border-white/10">
                    {(['day', 'week', 'month', 'total'] as const).map((t) => (
                        <Button
                            key={t}
                            variant="ghost"
                            size="sm"
                            onClick={() => setTimeframe(t)}
                            className={`rounded-lg px-4 transition-all duration-300 ${
                                timeframe === t 
                                ? 'bg-luxury-gold text-white shadow-lg' 
                                : 'hover:bg-luxury-gold/10 text-muted-foreground'
                            }`}
                        >
                            {t === 'day' ? 'Jour' : t === 'week' ? 'Semaine' : t === 'month' ? 'Mois' : 'Total'}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-gradient-to-br from-black/5 to-transparent dark:from-white/5 border-black/10 dark:border-white/10 relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-gray-500">Panier Moyen</CardTitle>
                        <Briefcase className="h-4 w-4 text-luxury-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-3xl font-serif text-black dark:text-white">${trendData.current.avgOrder.toLocaleString()}</div>
                            {timeframe !== 'total' && <TrendBadge value={trendData.growth.avgOrder} label={trendData.label} />}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-black/5 to-transparent dark:from-white/5 border-black/10 dark:border-white/10 relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-gray-500">Cash Encaissé</CardTitle>
                        <Banknote className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-3xl font-serif text-black dark:text-white">${trendData.current.collected.toLocaleString()}</div>
                            {timeframe !== 'total' && <TrendBadge value={trendData.growth.collected} label={trendData.label} />}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-black/5 to-transparent dark:from-white/5 border-black/10 dark:border-white/10 relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-gray-500">Nouveaux Clients</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-3xl font-serif text-black dark:text-white">{trendData.current.clients}</div>
                            {timeframe !== 'total' && <TrendBadge value={trendData.growth.clients} label={trendData.label} />}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-black/5 to-transparent dark:from-white/5 border-black/10 dark:border-white/10 relative overflow-hidden border-l-green-500/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-gray-500">Profit Réel</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className={`text-3xl font-serif ${trendData.current.profit >= 0 ? 'text-black dark:text-white' : 'text-red-500'}`}>
                                ${trendData.current.profit.toLocaleString()}
                            </div>
                            {timeframe !== 'total' && <TrendBadge value={trendData.growth.profit} label={trendData.label} />}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-black/5 to-transparent dark:from-white/5 border-black/10 dark:border-white/10 relative overflow-hidden border-l-red-500/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-gray-500">À Récolter</CardTitle>
                        <Banknote className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-3xl font-serif text-black dark:text-white">
                                ${trendData.current.outstanding.toLocaleString()}
                            </div>
                            {timeframe !== 'total' && <TrendBadge value={trendData.growth.outstanding} label={trendData.label} />}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-luxury-gold/10 to-transparent border-luxury-gold/20 relative overflow-hidden ring-1 ring-luxury-gold/20 shadow-lg shadow-luxury-gold/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-luxury-gold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Pipeline Pondéré
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-luxury-gold">${Math.round(next3MonthsData.reduce((s, m) => s + m.projected, 0)).toLocaleString()}</div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-tighter mt-1">Valeur estimée du pipeline selon probabilité d'étape</p>
                    </CardContent>
                </Card>
            </div>

            {/* Double Chart Layout */}
            <div className="grid gap-6 md:grid-cols-3">

                {/* Chart */}
                <Card className="md:col-span-2 border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-xl">
                    <CardHeader>
                        <CardTitle className="font-serif text-xl">Croissance Annuelle ({currentYear})</CardTitle>
                        <CardDescription>Facturé vs Encaissé vs Dépensé</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#A68A56" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#A68A56" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                    <Tooltip
                                        formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(210,181,123,0.3)', color: '#fff' }}
                                    />
                                    <Area type="monotone" name="Facturé ($)" dataKey="invoiced" stroke="#A68A56" fillOpacity={1} fill="url(#colorInvoiced)" />
                                    <Area type="monotone" name="Encaissé ($)" dataKey="collected" stroke="#22c55e" fillOpacity={1} fill="url(#colorCollected)" />
                                    <Area type="monotone" name="Dépensé ($)" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Mini Top Seller */}
                <Card className="border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="font-serif text-xl flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-luxury-gold" />
                            Meilleur Vendeur
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center h-[300px] mt-4">
                        {leaderboard.length > 0 ? (
                            <div className="text-center space-y-6">
                                <div className="inline-flex items-center justify-center p-6 bg-luxury-gold/10 rounded-full ring-2 ring-luxury-gold/30">
                                    <Trophy className="w-12 h-12 text-luxury-gold" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-serif text-black dark:text-white">{leaderboard[0].name}</h3>
                                    <p className="text-luxury-gold mt-1 uppercase tracking-widest text-sm font-semibold">
                                        ${leaderboard[0].volume.toLocaleString()} Générés
                                    </p>
                                    <p className="text-gray-500 text-xs mt-2">{leaderboard[0].projectCount} Projets signés</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">Aucun projet attribué.</div>
                        )}
                    </CardContent>
                </Card>

            </div>

            {/* Velocity and AI Analysis Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Velocity Monitor */}
                <Card className="border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-xl">
                    <CardHeader>
                        <CardTitle className="font-serif text-xl flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-luxury-gold" />
                            Prévisions de Trésorerie (3 Mois)
                        </CardTitle>
                        <CardDescription>Conversion estimée du pipeline actuel</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={next3MonthsData}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis hide />
                                    <Tooltip 
                                        formatter={(value: number) => [`$${value.toLocaleString()}`, "CA Prévu"]}
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(210,181,123,0.3)', color: '#fff' }}
                                    />
                                    <Bar dataKey="projected" radius={[4, 4, 0, 0]} barSize={40}>
                                        {next3MonthsData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#A68A56' : '#d2b57b'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center italic mt-2">
                            Calcul basé sur la vélocité historique et les probabilités de clôture.
                        </p>
                    </CardContent>
                </Card>

                {/* AI Insights Engine (Existing) */}
                <Card className="border-luxury-gold/20 bg-gradient-to-br from-luxury-gold/5 to-transparent backdrop-blur-md shadow-xl">
                    <CardHeader>
                        <CardTitle className="font-serif text-xl tracking-wide flex items-center gap-2">
                            <span className="text-luxury-gold">✨</span>
                            AI Business Insights
                        </CardTitle>
                        <CardDescription>Generated from your live business data</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-luxury-gold/20">
                            {generateInsights(projects, invoices, expenses, monthlyData, leaderboard, clients).slice(0, 6).map((insight, i) => (
                                <div
                                    key={i}
                                    className={`p-3 rounded-xl border ${
                                        insight.type === 'success' ? 'border-green-500/20 bg-green-500/5' :
                                        insight.type === 'warning' ? 'border-amber-500/20 bg-amber-500/5' :
                                        insight.type === 'danger' ? 'border-red-500/20 bg-red-500/5' :
                                        'border-blue-500/20 bg-blue-500/5'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-lg">{insight.icon}</span>
                                        <div>
                                            <p className="font-medium text-[13px] leading-tight">{insight.title}</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">{insight.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Manufacturer Performance Scorecards */}
            <Card className="border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-xl overflow-hidden mt-8">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-serif text-2xl tracking-wide flex items-center gap-2">
                            <Briefcase className="w-6 h-6 text-luxury-gold" />
                            Manufacturer Performance Scorecards
                        </CardTitle>
                        <CardDescription>Supplier accountability: Tracking speed, quality, and output.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-black/5 dark:bg-white/5">
                            <TableRow className="border-black/5 dark:border-white/5">
                                <TableHead>Manufacturer</TableHead>
                                <TableHead className="text-center">Projects</TableHead>
                                <TableHead className="text-center text-blue-500">Avg Speed</TableHead>
                                <TableHead className="text-center text-green-500">Quality Score</TableHead>
                                <TableHead className="text-right">Total Volume</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {manufacturerScorecard.map((m) => (
                                <TableRow key={m.id} className="border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <TableCell className="font-medium text-black dark:text-white">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold font-bold text-xs">
                                                {m.name.charAt(0)}
                                            </div>
                                            {m.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-widest border-luxury-gold/30 text-luxury-gold bg-transparent uppercase">
                                            {m.projectCount} Projects
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-serif text-lg">
                                        {m.avgSpeed > 0 ? (
                                            <span className={m.avgSpeed < 7 ? 'text-green-500' : m.avgSpeed > 14 ? 'text-red-500' : 'text-amber-500'}>
                                                {m.avgSpeed} Days
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`text-lg font-serif ${m.qualityRate > 90 ? 'text-green-500' : m.qualityRate < 70 ? 'text-red-500' : 'text-amber-500'}`}>
                                                {Math.round(m.qualityRate)}%
                                            </span>
                                            <div className="w-16 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                                                <div 
                                                    className={`h-full ${m.qualityRate > 90 ? 'bg-green-500' : m.qualityRate < 70 ? 'bg-red-500' : 'bg-amber-500'}`} 
                                                    style={{ width: `${m.qualityRate}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-serif text-lg font-bold">
                                        ${m.volume.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {manufacturerScorecard.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500 italic">
                                        No manufacturer production data found yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-xl overflow-hidden mt-8">
                <CardHeader>
                    <CardTitle className="font-serif text-2xl tracking-wide">Palmarès Admins & Ambassadeurs</CardTitle>
                    <CardDescription>Classement par volume de projets apportés (Ventes directes).</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-black/5 dark:bg-white/5">
                            <TableRow className="border-black/5 dark:border-white/5">
                                <TableHead className="w-16 text-center font-bold text-luxury-gold">Rang</TableHead>
                                <TableHead>Nom du Vendeur</TableHead>
                                <TableHead className="text-center">Projets</TableHead>
                                <TableHead className="text-right">Volume Apporté</TableHead>
                                <TableHead className="text-right text-green-600/70 dark:text-green-500">Cash Récolté</TableHead>
                                <TableHead className="text-right text-purple-600/70 dark:text-purple-400">Commissions (Est/Payées)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaderboard.map((seller, idx) => (
                                <TableRow key={seller.id} className="border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <TableCell className="text-center font-serif text-lg text-gray-500">
                                        {idx === 0 ? <span className="text-luxury-gold">1</span> : idx + 1}
                                    </TableCell>
                                    <TableCell className="font-medium text-black dark:text-white text-base">
                                        <div className="flex items-center gap-2">
                                            {seller.name}
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter ${
                                                seller.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                seller.role === 'ambassador' ? 'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20' :
                                                'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                            }`}>
                                                {seller.role === 'admin' ? 'Admin' : seller.role === 'ambassador' ? 'Ambassadeur' : 'Vendeur'}
                                            </span>
                                            {idx === 0 && <ChevronUp className="inline-block w-4 h-4 text-green-500" />}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-widest border-luxury-gold/30 text-luxury-gold bg-transparent uppercase">
                                            {seller.projectCount}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-serif text-lg font-bold">
                                        ${seller.volume.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right font-serif text-lg font-bold text-green-600 dark:text-green-500">
                                        ${seller.cashCollected.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-purple-600 dark:text-purple-400 font-medium">
                                        ${seller.commissions.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {leaderboard.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        Aucune donnée de vente pour le moment.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ====== AI INSIGHTS SECTION ====== */}
            <Card className="border-luxury-gold/20 bg-gradient-to-br from-luxury-gold/5 to-transparent backdrop-blur-md shadow-xl mt-8">
                <CardHeader>
                    <CardTitle className="font-serif text-2xl tracking-wide flex items-center gap-2">
                        <span className="text-luxury-gold">✨</span>
                        AI Business Insights
                    </CardTitle>
                    <CardDescription>Smart analysis generated from your data — updated in real-time.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {generateInsights(projects, invoices, expenses, monthlyData, leaderboard, clients).map((insight, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-xl border ${
                                    insight.type === 'success' ? 'border-green-500/20 bg-green-500/5' :
                                    insight.type === 'warning' ? 'border-amber-500/20 bg-amber-500/5' :
                                    insight.type === 'danger' ? 'border-red-500/20 bg-red-500/5' :
                                    'border-blue-500/20 bg-blue-500/5'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">{insight.icon}</span>
                                    <div>
                                        <p className="font-medium text-sm">{insight.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}


// UI Component for Growth Trend Badges
function TrendBadge({ value, label }: { value: number; label: string }) {
    if (value === 0) return (
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                <Minus className="w-3 h-3" />
                <span>0%</span>
            </div>
            <span className="text-[9px] text-gray-400 uppercase tracking-tighter">vs {label}</span>
        </div>
    );

    const isPositive = value > 0;
    
    return (
        <div className="flex flex-col items-end">
            <div className={`flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                isPositive 
                ? 'text-green-600 bg-green-500/10' 
                : 'text-red-600 bg-red-500/10'
            }`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{Math.abs(value)}%</span>
            </div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-tighter mt-1 italic">vs {label}</span>
        </div>
    );
}

// AI Insights Engine — generates smart observations from raw data
interface Insight {
    icon: string;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'danger' | 'info';
}

function generateInsights(
    projects: Project[],
    invoices: Invoice[],
    expenses: Expense[],
    monthlyData: { month: string; collected: number; invoiced: number; expenses: number }[],
    leaderboard: { name: string; projectCount: number; volume: number }[],
    clients: Client[]
): Insight[] {
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
            insights.push({ icon: '📈', title: `Revenue up ${growth}% vs prior quarter`, description: `Strong momentum! Collections grew from $${totalPrev.toLocaleString()} to $${totalRecent.toLocaleString()}.`, type: 'success' });
        } else if (growth < -10) {
            insights.push({ icon: '📉', title: `Revenue declined ${Math.abs(growth)}%`, description: `Collections dropped from $${totalPrev.toLocaleString()} to $${totalRecent.toLocaleString()}. Consider running promotions.`, type: 'danger' });
        } else {
            insights.push({ icon: '📊', title: `Revenue stable (${growth > 0 ? '+' : ''}${growth}%)`, description: `Consistent cash flow of ~$${Math.round(totalRecent / 3).toLocaleString()}/month.`, type: 'info' });
        }
    }

    // 2. Collection Rate
    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
    const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

    if (collectionRate >= 80) {
        insights.push({ icon: '💰', title: `${collectionRate}% collection rate — excellent`, description: `You're collecting $${totalPaid.toLocaleString()} of $${totalInvoiced.toLocaleString()} invoiced. Strong client payment discipline.`, type: 'success' });
    } else if (collectionRate >= 50) {
        insights.push({ icon: '⚠️', title: `${collectionRate}% collection rate — needs attention`, description: `$${(totalInvoiced - totalPaid).toLocaleString()} outstanding. Consider sending payment reminders.`, type: 'warning' });
    } else if (totalInvoiced > 0) {
        insights.push({ icon: '🚨', title: `Only ${collectionRate}% collected — critical`, description: `$${(totalInvoiced - totalPaid).toLocaleString()} unpaid. Urgent follow-up needed on outstanding invoices.`, type: 'danger' });
    }

    // 3. Pipeline Health
    const designing = projects.filter(p => ['designing', '3d_model', 'design_ready'].includes(p.status)).length;
    const inProduction = projects.filter(p => ['approved_for_production', 'production'].includes(p.status)).length;
    const completed = projects.filter(p => p.status === 'completed').length;

    if (designing > inProduction * 2) {
        insights.push({ icon: '🎨', title: `${designing} designs in progress, only ${inProduction} in production`, description: `The design pipeline is full but production capacity may be a bottleneck. Consider scaling manufacturing.`, type: 'warning' });
    } else if (inProduction > 0) {
        insights.push({ icon: '🏭', title: `${inProduction} projects in production, ${designing} designing`, description: `Healthy pipeline balance. ${completed} completed total.`, type: 'success' });
    }

    // 4. Best Season
    const busyMonths = monthlyData
        .map((m, i) => ({ ...m, index: i }))
        .filter(m => m.invoiced > 0)
        .sort((a, b) => b.invoiced - a.invoiced);

    if (busyMonths.length >= 2) {
        const topMonth = busyMonths[0];
        insights.push({ icon: '📅', title: `Peak month: ${topMonth.month}`, description: `$${topMonth.invoiced.toLocaleString()} in project volume. Ensure design/production capacity is scaled up ahead of peak periods.`, type: 'info' });
    }

    // 5. Top Client Concentration
    if (leaderboard.length >= 2) {
        const topSellerShare = Math.round((leaderboard[0].volume / leaderboard.reduce((s, l) => s + l.volume, 0)) * 100);
        if (topSellerShare > 60) {
            insights.push({ icon: '👤', title: `${leaderboard[0].name} brings ${topSellerShare}% of volume`, description: `High dependency on one seller. Diversifying the sales force would reduce business risk.`, type: 'warning' });
        } else {
            insights.push({ icon: '👥', title: `Healthy seller distribution`, description: `Top seller (${leaderboard[0].name}) brings ${topSellerShare}% — well diversified across ${leaderboard.length} active sellers.`, type: 'success' });
        }
    }

    // 6. Expense Ratio
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount), 0);
    if (totalRevenue > 0) {
        const expenseRatio = Math.round((totalExpenses / totalRevenue) * 100);
        if (expenseRatio < 40) {
            insights.push({ icon: '✅', title: `${expenseRatio}% expense ratio — healthy margins`, description: `Expenses ($${totalExpenses.toLocaleString()}) vs revenue ($${totalRevenue.toLocaleString()}) show strong profitability.`, type: 'success' });
        } else if (expenseRatio < 70) {
            insights.push({ icon: '📋', title: `${expenseRatio}% expense ratio — monitor closely`, description: `Expenses are growing relative to revenue. Review cost categories for optimization.`, type: 'warning' });
        } else {
            insights.push({ icon: '🔴', title: `${expenseRatio}% expense ratio — margins squeezed`, description: `Expenses nearly match revenue. Urgent cost review recommended.`, type: 'danger' });
        }
    }

    // 7. Growth Prediction
    if (currentMonth >= 2) {
        const avgMonthly = totalRecent / Math.min(3, currentMonth + 1);
        const monthsLeft = 12 - currentMonth - 1;
        const predicted = totalRecent + (avgMonthly * monthsLeft);
        insights.push({ icon: '🔮', title: `Projected annual collections: $${Math.round(predicted).toLocaleString()}`, description: `Based on $${Math.round(avgMonthly).toLocaleString()}/month average over the last 3 months, with ${monthsLeft} months remaining.`, type: 'info' });
    }

    // 8. Client Growth
    const newClientsThisMonth = clients.filter(c => {
        const d = new Date(c.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === now.getFullYear();
    }).length;

    if (newClientsThisMonth > 0) {
        insights.push({ icon: '🌟', title: `${newClientsThisMonth} new client${newClientsThisMonth > 1 ? 's' : ''} this month`, description: `Growing client base! Total active clients: ${clients.length}.`, type: 'success' });
    }

    return insights;
}
