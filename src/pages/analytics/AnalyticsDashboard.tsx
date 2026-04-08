import { apiInvoices, Invoice } from '@/services/apiInvoices';
import { apiProjects, Project } from '@/services/apiProjects';
import { useQuery } from '@tanstack/react-query';
import { apiUsers } from '@/services/apiUsers';
import { apiExpenses } from '@/services/apiExpenses';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, ArrowUpRight, FileDown, Gem, Target, MousePointer2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ComposedChart, Line, Bar } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { generateMonthlyReportPDF } from '@/services/monthlyReportPdf';
import { apiSettings } from '@/services/apiSettings';

export default function AnalyticsDashboard() {
    const { t } = useTranslation();
    const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'total'>('month');
    
    const { isLoading: engineLoading, trendData, yearlyExtrapolation, avgMonthlyGrowth } = useAnalyticsData(timeframe);

    const { data: projects = [], isLoading: pLoad } = useQuery({ queryKey: ['projects'], queryFn: apiProjects.getAll });
    const { data: invoices = [], isLoading: iLoad } = useQuery({ queryKey: ['invoices'], queryFn: apiInvoices.getAll });
    const { data: users = [], isLoading: uLoad } = useQuery({ queryKey: ['users'], queryFn: apiUsers.getAll });
    const { data: expenses = [], isLoading: eLoad } = useQuery({ queryKey: ['expenses'], queryFn: apiExpenses.getAll });
    const { isLoading: cLoad } = useQuery({ queryKey: ['clients_dummy'], queryFn: () => [] }); 

    if (pLoad || iLoad || uLoad || eLoad || engineLoading || cLoad) {
        return <div className="p-8 text-center text-luxury-gold animate-pulse font-serif italic text-xl">Analyse stratégique en cours...</div>;
    }

    const totalYearlyProjected = yearlyExtrapolation.reduce((sum, m) => sum + m.invoiced, 0);

    const sellerStats: Record<string, { id: string, name: string, role: string, projectCount: number, volume: number, cashCollected: number }> = {};
    users.filter(u => ['affiliate', 'admin', 'ambassador'].includes(u.role as string)).forEach(u => {
        sellerStats[u.id] = { id: u.id, name: u.full_name, role: u.role as string, projectCount: 0, volume: 0, cashCollected: 0 };
    });

    projects.forEach(p => {
        const isSale = ['production', 'delivery', 'completed'].includes(p.status) || invoices.some(inv => inv.project_id === p.id);
        if (!isSale) return;
        const responsibleId = p.sales_agent_id || p.affiliate_id;
        if (responsibleId && sellerStats[responsibleId]) {
            sellerStats[responsibleId].projectCount++;
            sellerStats[responsibleId].volume += Number(p.financials?.selling_price || p.budget || 0);
            invoices.filter(inv => inv.project_id === p.id).forEach(inv => {
                const paidValue = Number(inv.amount_paid) > 0 ? Number(inv.amount_paid) : (inv.status === 'paid' ? Number(inv.amount) : 0);
                sellerStats[responsibleId].cashCollected += paidValue;
            });
        }
    });

    const leaderboard = Object.values(sellerStats).filter(s => s.projectCount > 0).sort((a, b) => b.volume - a.volume);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16 px-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-black/5 dark:border-white/5 pb-8">
                <div>
                    <h1 className="text-4xl font-serif text-black dark:text-white tracking-tighter">{t('analyticsPage.title')}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="h-1 w-12 bg-luxury-gold rounded-full" />
                        <p className="text-muted-foreground text-sm uppercase tracking-[0.2em] font-medium">{t('analyticsPage.subtitle')}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            const settings = await apiSettings.get();
                            generateMonthlyReportPDF({ invoices, expenses, projects, month: new Date(), settings });
                        }}
                        className="rounded-full border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/5 px-6"
                    >
                        <FileDown className="w-4 h-4 mr-2" />
                        Exporter Rapport
                    </Button>
                    <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-inner">
                        {(['day', 'week', 'month', 'total'] as const).map((period) => (
                            <Button
                                key={period}
                                variant="ghost"
                                size="sm"
                                onClick={() => setTimeframe(period)}
                                className={`rounded-full px-6 transition-all duration-300 ${timeframe === period ? 'bg-luxury-gold text-white shadow-lg scale-105' : 'text-muted-foreground hover:text-black dark:hover:text-white'}`}
                            >
                                {period === 'day' ? 'Jour' : period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Total'}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard title="Cash Encaissé" value={trendData.collected.value} trend={trendData.collected.trend} label={trendData.collected.label} />
                <KPICard title="Total Facturé" value={trendData.invoiced.value} trend={trendData.invoiced.trend} label={trendData.invoiced.label} />
                <KPICard title="Nouveaux Clients" value={trendData.clients.value} trend={trendData.clients.trend} label={trendData.clients.label} isCurrency={false} />
                <Card className="bg-black text-white dark:bg-zinc-800 dark:text-white shadow-2xl overflow-hidden relative group border-none">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target className="w-20 h-20" /></div>
                    <CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase tracking-widest opacity-60">Estimation Fin d'Année</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif">{formatCurrency(totalYearlyProjected)}</div>
                        <div className="flex items-center gap-2 mt-2"><ArrowUpRight className="w-4 h-4 text-luxury-gold" /><span className="text-xs font-bold text-luxury-gold">+{avgMonthlyGrowth}% / mois</span></div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-black overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-8">
                    <div>
                        <CardTitle className="text-2xl font-serif flex items-center gap-2"><Target className="w-6 h-6 text-luxury-gold" />Prévisionnel Annuel & Objectifs de Croissance</CardTitle>
                        <CardDescription>Analyse extrapolée basée sur les moyennes mensuelles actuelles</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <div className="h-[400px] w-full mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={yearlyExtrapolation} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
                                <Tooltip content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                                                <p className="text-xs font-bold uppercase tracking-widest mb-2 border-b pb-1 opacity-50">{data.name} {data.isProjected ? '(Projection)' : '(Réel)'}</p>
                                                <div className="space-y-1.5">
                                                    <p className="flex justify-between gap-8 text-sm"><span className="opacity-60">Facturation:</span> <strong>{formatCurrency(data.invoiced)}</strong></p>
                                                    <p className="flex justify-between gap-8 text-sm"><span className="opacity-60">Cash Flow (Est.):</span> <strong className="text-emerald-500">{formatCurrency(data.collected)}</strong></p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }} />
                                <Legend verticalAlign="top" height={36}/>
                                <Bar name="Facturé" dataKey="invoiced" fill="#A68A56" radius={[4, 4, 0, 0]} barSize={30} />
                                <Line name="Trend Trésorerie" type="monotone" dataKey="collected" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                                <ReferenceLine x={yearlyExtrapolation.findIndex(m => m.isProjected) - 0.5} stroke="#A68A56" label={{ value: 'PROJECTION', position: 'top', fill: '#A68A56', fontSize: 10, fontWeight: 'bold' }} strokeDasharray="3 3"/>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="glass-card shadow-xl border-black/5 dark:border-white/5 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-black/[0.03] dark:border-white/[0.03] pb-4">
                        <CardTitle className="font-serif text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-luxury-gold" /> Performance Vendeurs</CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader className="bg-black/[0.01] dark:bg-white/[0.01]"><TableRow><TableHead className="w-16 text-center">Rang</TableHead><TableHead>Vendeur</TableHead><TableHead className="text-right">Volume (YTD)</TableHead><TableHead className="text-right text-emerald-600">Encaissement</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {leaderboard.map((s, idx) => (
                                <TableRow key={s.id} className="group hover:bg-luxury-gold/[0.02] transition-colors">
                                    <TableCell className="text-center font-serif text-lg opacity-30 group-hover:opacity-100 transition-opacity">{idx + 1}</TableCell>
                                    <TableCell><p className="font-bold text-sm">{s.name}</p><p className="text-[10px] uppercase opacity-40 tracking-tighter">{s.role}</p></TableCell>
                                    <TableCell className="text-right font-serif font-bold text-sm">{formatCurrency(s.volume)}</TableCell>
                                    <TableCell className="text-right font-serif font-bold text-emerald-600 text-sm">{formatCurrency(s.cashCollected)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>

                <Card className="glass-card shadow-xl border-black/5 dark:border-white/5 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-black/[0.03] dark:border-white/[0.03] pb-4">
                        <CardTitle className="font-serif text-lg flex items-center gap-2"><Gem className="w-5 h-5 text-luxury-gold" /> Rentabilité par Catégorie</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {(() => {
                            const categories: Record<string, { count: number; rev: number; costs: number }> = {};
                            projects.forEach(p => {
                                const cat = p.jewelry_type || 'Autres';
                                if (!categories[cat]) categories[cat] = { count: 0, rev: 0, costs: 0 };
                                categories[cat].count++;
                                categories[cat].rev += Number(p.financials?.selling_price || p.budget || 0);
                                categories[cat].costs += (Number(p.financials?.supplier_cost || 0));
                            });
                            return Object.entries(categories).sort((a,b) => b[1].rev - a[1].rev).map(([name, d]) => {
                                const m = d.rev - d.costs;
                                const pct = d.rev > 0 ? (m / d.rev) * 100 : 0;
                                return (
                                    <div key={name} className="mb-6 last:mb-0">
                                        <div className="flex justify-between items-end mb-2">
                                            <div><span className="text-xs font-bold uppercase tracking-widest">{name}</span><span className="text-[10px] ml-2 opacity-40">{d.count} projets</span></div>
                                            <span className={`text-xs font-bold ${pct > 40 ? 'text-emerald-500' : 'text-luxury-gold'}`}>{pct.toFixed(0)}% Marge</span>
                                        </div>
                                        <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-luxury-gold/50" style={{ width: `${(d.costs/Math.max(1, d.rev))*100}%` }} />
                                            <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border-none bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-zinc-900 shadow-xl ring-1 ring-emerald-500/10"><CardHeader><CardTitle className="font-serif text-xl flex items-center gap-2">⚡ Insights Stratégiques</CardTitle></CardHeader>
                    <CardContent className="grid gap-3">
                        {generateInsights(invoices, leaderboard).map((insight, i) => (
                            <div key={i} className={`p-4 rounded-3xl border flex gap-4 items-center bg-white/50 dark:bg-black/20 ${insight.type === 'success' ? 'border-emerald-500/10' : 'border-amber-500/10'}`}>
                                <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm text-2xl">{insight.icon}</div>
                                <div><p className="font-bold text-[13px] leading-tight">{insight.title}</p><p className="text-[11px] text-muted-foreground mt-0.5">{insight.description}</p></div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="glass-card shadow-xl"><CardHeader><CardTitle className="font-serif text-xl flex items-center gap-2"><MousePointer2 className="w-5 h-5 text-luxury-gold" /> Prochaines Actions</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-black/5 rounded-2xl border border-dashed border-black/10 flex items-center justify-between"><span className="text-xs font-medium">Relancer factures impayées ({invoices.filter(i => i.status === 'sent').length})</span><Button size="sm" variant="ghost" className="text-luxury-gold text-[10px] font-bold">ACTIONS</Button></div>
                        <div className="p-4 bg-black/5 rounded-2xl border border-dashed border-black/10 flex items-center justify-between"><span className="text-xs font-medium">Valider projets en attente ({projects.filter(p => p.status === 'waiting_for_approval').length})</span><Button size="sm" variant="ghost" className="text-luxury-gold text-[10px] font-bold">REVUE</Button></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function KPICard({ title, value, trend, label, isCurrency = true }: { title: string; value: number; trend: number; label: string; isCurrency?: boolean }) {
    const isPos = trend > 0;
    return (
        <Card className="luxury-card border-none bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl shadow-lg hover:shadow-2xl transition-all duration-500 group">
            <CardHeader className="pb-2"><CardTitle className="text-[10px] font-serif uppercase tracking-[0.2em] text-zinc-400 group-hover:text-luxury-gold transition-colors">{title}</CardTitle></CardHeader>
            <CardContent>
                <div className="text-3xl font-serif text-black dark:text-white mb-2">{isCurrency ? formatCurrency(value) : value}</div>
                {trend !== 0 && (<div className={`flex items-center gap-1.5 text-xs font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>{isPos ? <ArrowUpRight className="w-3" /> : null}{Math.abs(trend)}% <span className="text-[9px] text-zinc-400 font-normal uppercase italic tracking-tighter">vs {label}</span></div>)}
            </CardContent>
        </Card>
    );
}

function generateInsights(invoices: Invoice[], leaderboard: any[]): any[] {
    const insights = [];
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
    const rate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 100;
    if (rate < 70) insights.push({ icon: '💰', title: 'Attention Trésorerie', description: `Seulement ${rate}% encaissé.`, type: 'warning' });
    else insights.push({ icon: '💰', title: 'Collecte Efficace', description: `Taux d'encaissement de ${rate}%. Serein.`, type: 'success' });
    if (leaderboard[0]) insights.push({ icon: '🏆', title: `Top Seller: ${leaderboard[0].name}`, description: 'Meneur YTD.', type: 'success' });
    return insights;
}
