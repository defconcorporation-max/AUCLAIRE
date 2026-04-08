import { apiClients } from '@/services/apiClients';
import { apiInvoices, Invoice } from '@/services/apiInvoices';
import { apiProjects, Project } from '@/services/apiProjects';
import { useQuery } from '@tanstack/react-query';
import { apiUsers } from '@/services/apiUsers';
import { apiExpenses, Expense } from '@/services/apiExpenses';
import { apiActivities } from '@/services/apiActivities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Briefcase, Trophy, ArrowUpRight, ArrowDownRight, FileDown, Gem } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { financialUtils } from '@/utils/financialUtils';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { generateMonthlyReportPDF } from '@/services/monthlyReportPdf';
import { apiSettings } from '@/services/apiSettings';

export default function AnalyticsDashboard() {
    const { t } = useTranslation();
    const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'total'>('month');
    
    // Engine Hook for Dynamic Forecasting
    const { isLoading: engineLoading, forecast, trendData, weightedPipeline } = useAnalyticsData(timeframe);

    // Queries for Detailed Tables
    const { data: projects = [], isLoading: pLoad } = useQuery({ queryKey: ['projects'], queryFn: apiProjects.getAll });
    const { data: clients = [], isLoading: cLoad } = useQuery({ queryKey: ['clients'], queryFn: apiClients.getAll });
    const { data: invoices = [], isLoading: iLoad } = useQuery({ queryKey: ['invoices'], queryFn: apiInvoices.getAll });
    const { data: users = [], isLoading: uLoad } = useQuery({ queryKey: ['users'], queryFn: apiUsers.getAll });
    const { data: expenses = [], isLoading: eLoad } = useQuery({ queryKey: ['expenses'], queryFn: apiExpenses.getAll });
    const { data: activities = [], isLoading: alLoad } = useQuery({ queryKey: ['activities'], queryFn: apiActivities.getAll });

    if (pLoad || cLoad || iLoad || uLoad || eLoad || alLoad || engineLoading) {
        return <div className="p-8 text-center text-luxury-gold animate-pulse font-serif">Initialisation du Moteur Analytique...</div>;
    }

    const getSalePrice = (p: Project) => Number(p.financials?.selling_price || p.budget || 0);

    // Annual Growth Logic
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyData = months.map(m => ({ month: m, collected: 0, invoiced: 0 }));

    months.forEach((_, monthIdx) => {
        const start = new Date(currentYear, monthIdx, 1);
        const end = new Date(currentYear, monthIdx + 1, 0, 23, 59, 59);
        monthlyData[monthIdx].collected = financialUtils.getCollectedFromInvoices(invoices, start, end);
    });

    invoices.forEach(inv => {
        if (inv.status === 'void') return;
        const createdDate = new Date(inv.created_at);
        if (createdDate.getFullYear() === currentYear) {
            monthlyData[createdDate.getMonth()].invoiced += Number(inv.amount || 0);
        }
    });

    // Seller Leaderboard Calculations
    const sellerStats: Record<string, { id: string, name: string, projectCount: number, volume: number, cashCollected: number }> = {};
    users.filter(u => ['affiliate', 'admin', 'ambassador'].includes(u.role as string)).forEach(u => {
        sellerStats[u.id] = { id: u.id, name: u.full_name, projectCount: 0, volume: 0, cashCollected: 0 };
    });

    projects.forEach(p => {
        const isSale = ['production', 'delivery', 'completed'].includes(p.status) || invoices.some(inv => inv.project_id === p.id);
        if (!isSale) return;

        const responsibleId = p.sales_agent_id || p.affiliate_id;
        if (responsibleId && sellerStats[responsibleId]) {
            sellerStats[responsibleId].projectCount++;
            sellerStats[responsibleId].volume += getSalePrice(p);
            invoices.filter(inv => inv.project_id === p.id).forEach(inv => {
                const paidValue = Number(inv.amount_paid) > 0 ? Number(inv.amount_paid) : (inv.status === 'paid' ? Number(inv.amount) : 0);
                sellerStats[responsibleId].cashCollected += paidValue;
            });
        }
    });

    const leaderboard = Object.values(sellerStats).filter(s => s.projectCount > 0).sort((a, b) => b.volume - a.volume);

    // Manufacturer Performance Logic
    const manufacturerStats: Record<string, { id: string, name: string, projectCount: number, volume: number, totalProdDays: number, prodCount: number, modCount: number }> = {};
    users.filter(u => u.role === 'manufacturer').forEach(u => {
        manufacturerStats[u.id] = { id: u.id, name: u.full_name, projectCount: 0, volume: 0, totalProdDays: 0, prodCount: 0, modCount: 0 };
    });

    const statusLogs = activities.filter(a => a.action === 'status_change');
    projects.forEach(p => {
        if (p.manufacturer_id && manufacturerStats[p.manufacturer_id]) {
            manufacturerStats[p.manufacturer_id].projectCount++;
            manufacturerStats[p.manufacturer_id].volume += getSalePrice(p);
            
            const pLogs = statusLogs.filter(log => log.project_id === p.id).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            let prodStart: Date | null = null;
            
            pLogs.forEach(log => {
                const det = (log.details || '').toLowerCase();
                if (det.includes('to production')) prodStart = new Date(log.created_at);
                if (det.includes('to completed') && prodStart) {
                    manufacturerStats[p.manufacturer_id!].totalProdDays += (new Date(log.created_at).getTime() - prodStart.getTime()) / (1000 * 3600 * 24);
                    manufacturerStats[p.manufacturer_id!].prodCount++;
                    prodStart = null;
                }
                if (det.includes('to design_modification')) manufacturerStats[p.manufacturer_id!].modCount++;
            });
        }
    });

    const manufacturerScorecard = Object.values(manufacturerStats).filter(s => s.projectCount > 0).map(s => ({
        ...s,
        avgSpeed: s.prodCount > 0 ? Math.round(s.totalProdDays / s.prodCount) : 0,
        qualityRate: Math.max(0, 100 - (s.modCount / s.projectCount * 100))
    })).sort((a, b) => b.qualityRate - a.qualityRate);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-serif text-black dark:text-white tracking-wide">{t('analyticsPage.title')}</h1>
                    <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">{t('analyticsPage.subtitle')}</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            const settings = await apiSettings.get();
                            generateMonthlyReportPDF({ invoices, expenses, projects, month: new Date(), settings });
                        }}
                        className="rounded-lg border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10"
                    >
                        <FileDown className="w-4 h-4 mr-2" />
                        Exporter Rapport
                    </Button>
                    <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl backdrop-blur-md border border-black/10 dark:border-white/10">
                        {(['day', 'week', 'month', 'total'] as const).map((period) => (
                            <Button
                                key={period}
                                variant="ghost"
                                size="sm"
                                onClick={() => setTimeframe(period)}
                                className={`rounded-lg px-4 ${timeframe === period ? 'bg-luxury-gold text-white shadow-lg' : 'text-muted-foreground'}`}
                            >
                                {period === 'day' ? 'Jour' : period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Total'}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="luxury-card border-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-serif uppercase tracking-widest text-zinc-500">Cash Encaissé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-serif text-black dark:text-white">{formatCurrency(trendData.collected.value)}</div>
                        <TrendBadge value={trendData.collected.trend} label={trendData.collected.label} />
                    </CardContent>
                </Card>

                <Card className="luxury-card border-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-serif uppercase tracking-widest text-zinc-500">Total Facturé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-serif text-black dark:text-white">{formatCurrency(trendData.invoiced.value)}</div>
                        <TrendBadge value={trendData.invoiced.trend} label={trendData.invoiced.label} />
                    </CardContent>
                </Card>

                <Card className="luxury-card border-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-serif uppercase tracking-widest text-zinc-500">Nouveaux Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-serif text-black dark:text-white">{trendData.clients.value}</div>
                        {timeframe !== 'total' && <TrendBadge value={trendData.clients.trend} label={trendData.clients.label} />}
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-luxury-gold/10 to-transparent border-luxury-gold/20 shadow-lg shadow-luxury-gold/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-serif uppercase tracking-widest text-luxury-gold">Pipeline Pondéré</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-serif text-luxury-gold">{formatCurrency(weightedPipeline)}</div>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase italic tracking-tighter">Probabilité d'étape appliquée</p>
                    </CardContent>
                </Card>
            </div>

            {/* Visualizations */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="glass-card shadow-xl overflow-hidden border-black/5 dark:border-white/5">
                    <CardHeader>
                        <CardTitle className="font-serif">Croissance des Revenus ({currentYear})</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="cInv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A68A56" stopOpacity={0.3}/><stop offset="95%" stopColor="#A68A56" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="cCol" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
                                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" name="Facturé" dataKey="invoiced" stroke="#A68A56" fill="url(#cInv)" strokeWidth={2} />
                                <Area type="monotone" name="Encaissé" dataKey="collected" stroke="#10B981" fill="url(#cCol)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="glass-card shadow-xl overflow-hidden border-black/5 dark:border-white/5">
                    <CardHeader>
                        <CardTitle className="font-serif">Prévisions de Trésorerie (Flux Probables)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={forecast}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
                                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase' }} />
                                <Bar name="Facturé" dataKey="invoiced" fill="#A68A56" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar name="Trésorerie" dataKey="collected" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar name="Dépenses" dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Tables */}
            <div className="grid gap-8">
                <Card className="glass-card shadow-xl border-black/5 dark:border-white/5 overflow-hidden">
                    <CardHeader className="bg-black/[0.02] dark:bg-white/[0.02]">
                        <CardTitle className="font-serif text-lg flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-luxury-gold" /> Performance Fabricants
                        </CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fabricant</TableHead>
                                <TableHead className="text-center">Projets</TableHead>
                                <TableHead className="text-center">Vitesse (Moy)</TableHead>
                                <TableHead className="text-center">Qualité</TableHead>
                                <TableHead className="text-right">Volume</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {manufacturerScorecard.map(m => (
                                <TableRow key={m.id}>
                                    <TableCell className="font-medium">{m.name}</TableCell>
                                    <TableCell className="text-center">{m.projectCount}</TableCell>
                                    <TableCell className="text-center">{m.avgSpeed} Jours</TableCell>
                                    <TableCell className="text-center font-bold text-luxury-gold">{Math.round(m.qualityRate)}%</TableCell>
                                    <TableCell className="text-right font-serif">{formatCurrency(m.volume)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>

                <Card className="glass-card shadow-xl border-black/5 dark:border-white/5 overflow-hidden">
                    <CardHeader className="bg-black/[0.02] dark:bg-white/[0.02]">
                        <CardTitle className="font-serif text-lg flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-luxury-gold" /> Leaders de Vente
                        </CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16 text-center">Rang</TableHead>
                                <TableHead>Vendeur</TableHead>
                                <TableHead className="text-center">Projets</TableHead>
                                <TableHead className="text-right">Volume Apporté</TableHead>
                                <TableHead className="text-right text-emerald-600">Encaissement</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaderboard.map((s, idx) => (
                                <TableRow key={s.id}>
                                    <TableCell className="text-center font-serif text-lg opacity-40">{idx + 1}</TableCell>
                                    <TableCell className="font-medium">{s.name}</TableCell>
                                    <TableCell className="text-center">{s.projectCount}</TableCell>
                                    <TableCell className="text-right font-serif font-bold">{formatCurrency(s.volume)}</TableCell>
                                    <TableCell className="text-right font-serif font-bold text-emerald-600">{formatCurrency(s.cashCollected)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {/* AI and Categories */}
            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="glass-card border-luxury-gold/20 bg-luxury-gold/[0.02]">
                    <CardHeader>
                        <CardTitle className="font-serif text-xl flex items-center gap-2">✨ Insights Stratégiques</CardTitle>
                        <CardDescription>Analyses automatiques sur vos opérations</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {generateInsights(projects, invoices, leaderboard).map((insight, i) => (
                            <div key={i} className={`p-4 rounded-xl border flex gap-3 ${
                                insight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/10' :
                                insight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/10' : 'bg-blue-500/5 border-blue-500/10'
                            }`}>
                                <span className="text-xl">{insight.icon}</span>
                                <div>
                                    <p className="font-bold text-sm">{insight.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="font-serif text-xl flex items-center gap-2"><Gem className="w-5 h-5 text-luxury-gold" /> Rentabilité par Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const categories: Record<string, { count: number; revenue: number; costs: number }> = {};
                            const detect = (t: string): string => {
                                const s = t.toLowerCase();
                                if (s.includes('bague') || s.includes('ring')) return 'Bagues';
                                if (s.includes('collier') || s.includes('necklace')) return 'Colliers';
                                if (s.includes('bracelet')) return 'Bracelets';
                                if (s.includes('boucle')) return 'Boucles';
                                return 'Autres';
                            };
                            projects.forEach(p => {
                                const cat = p.jewelry_type || detect(p.title || '');
                                if (!categories[cat]) categories[cat] = { count: 0, revenue: 0, costs: 0 };
                                categories[cat].count++;
                                categories[cat].revenue += getSalePrice(p);
                                categories[cat].costs += (Number(p.financials?.supplier_cost || 0) + Number(p.financials?.shipping_cost || 0));
                            });
                            return Object.entries(categories).sort((a,b) => b[1].revenue - a[1].revenue).map(([name, data]) => {
                                const margin = data.revenue - data.costs;
                                const pct = data.revenue > 0 ? (margin / data.revenue) * 100 : 0;
                                return (
                                    <div key={name} className="mb-4 last:mb-0">
                                        <div className="flex justify-between text-xs mb-1 font-medium">
                                            <span>{name} ({data.count})</span>
                                            <span className="text-luxury-gold">{pct.toFixed(0)}% de marge</span>
                                        </div>
                                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-luxury-gold" style={{ width: `${Math.min(100, (data.costs / Math.max(1, data.revenue)) * 100)}%` }} />
                                            <div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, pct)}%` }} />
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function TrendBadge({ value, label }: { value: number; label: string }) {
    if (value === 0) return <span className="text-[10px] text-zinc-400 mt-1 uppercase italic tracking-tighter">Stable vs {label}</span>;
    const isPos = value > 0;
    return (
        <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(value)}% <span className="text-[9px] text-zinc-400 font-normal ml-0.5">vs {label}</span>
        </div>
    );
}

interface Insight { icon: string; title: string; description: string; type: 'success' | 'warning' | 'info'; }
function generateInsights(projects: Project[], invoices: Invoice[], leaderboard: any[]): Insight[] {
    const insights: Insight[] = [];
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
    const rate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 100;

    if (rate < 70) insights.push({ icon: '⚠️', title: 'Attention Trésorerie', description: `Seulement ${rate}% de vos factures sont encaissées.`, type: 'warning' });
    else insights.push({ icon: '💰', title: 'Recouvrement Sain', description: `Excellent taux d'encaissement de ${rate}%.`, type: 'success' });

    if (projects.filter(p => p.status === 'production').length > 5) insights.push({ icon: '🏭', title: 'Atelier Surchargé', description: 'Volume important en production. Surveillez les délais.', type: 'warning' });
    if (leaderboard[0]) insights.push({ icon: '🏆', title: `Performeur: ${leaderboard[0].name}`, description: 'Meneur indiscutable du volume de vente actuel.', type: 'success' });

    return insights;
}
