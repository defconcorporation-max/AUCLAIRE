import { apiInvoices, Invoice } from '@/services/apiInvoices';
import { apiProjects, Project } from '@/services/apiProjects';
import { useQuery } from '@tanstack/react-query';
import { apiUsers } from '@/services/apiUsers';
import { apiExpenses } from '@/services/apiExpenses';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, ArrowUpRight, ArrowDownRight, FileDown, Gem, Target, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, Bar, Cell, ComposedChart, Area } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { generateMonthlyReportPDF } from '@/services/monthlyReportPdf';
import { apiSettings } from '@/services/apiSettings';

export default function AnalyticsDashboard() {
    const { t } = useTranslation();
    const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'total'>('month');
    
    const { isLoading: engineLoading, trendData, yearlyExtrapolation, performanceDelta, estimatedCurrentMonth } = useAnalyticsData(timeframe);

    const { data: projects = [] as Project[], isLoading: pLoad } = useQuery({ queryKey: ['projects'], queryFn: apiProjects.getAll });
    const { data: invoices = [] as Invoice[], isLoading: iLoad } = useQuery({ queryKey: ['invoices'], queryFn: apiInvoices.getAll });
    const { data: users = [], isLoading: uLoad } = useQuery({ queryKey: ['users'], queryFn: apiUsers.getAll });
    const { data: expenses = [], isLoading: eLoad } = useQuery({ queryKey: ['expenses'], queryFn: apiExpenses.getAll });
    const { isLoading: cLoad } = useQuery({ queryKey: ['clients_dummy'], queryFn: () => [] }); 

    if (pLoad || iLoad || uLoad || eLoad || engineLoading || cLoad) {
        return <div className="p-8 text-center text-luxury-gold animate-pulse font-serif italic text-xl">Calcul des trajectoires...</div>;
    }

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
                        <p className="text-muted-foreground text-sm uppercase tracking-[0.2em] font-medium">Scénarios Stratégiques & Expansion</p>
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
                    <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full backdrop-blur-xl border border-black/10 dark:border-white/10">
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
                <KPICard title="Estimation Fin de Mois" value={estimatedCurrentMonth} trend={performanceDelta} label="vs Statu Quo" />
                <KPICard title="CA Réel (Avril)" value={yearlyExtrapolation.find(m => m.isCurrent)?.actual || 0} trend={0} label="ce mois" />
                <KPICard title="Cash Encaissé" value={trendData.collected.value} trend={0} label="ce mois" />
                <Card className="bg-emerald-600 text-white shadow-2xl overflow-hidden relative group border-none">
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity"><TrendingUp className="w-20 h-20" /></div>
                    <CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase tracking-widest opacity-80">Objectif Expansion (Evo 20)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif">{formatCurrency(yearlyExtrapolation[yearlyExtrapolation.length-1].target20)}</div>
                        <div className="flex items-center gap-2 mt-2"><ArrowUpRight className="w-4 h-4 text-white" /><span className="text-xs font-bold text-white">Target Décembre (+20%/m)</span></div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-black overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-8">
                    <div>
                        <CardTitle className="text-2xl font-serif flex items-center gap-2"><TrendingUp className="w-6 h-6 text-luxury-gold" />Comparaison des Scénarios de Croissance</CardTitle>
                        <CardDescription>Visualisez vos performances réelles face à vos objectifs de croissance (+20%/m)</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <div className="h-[450px] w-full mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={yearlyExtrapolation} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
                                <Tooltip content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white/90 dark:bg-zinc-900/90 border border-black/10 dark:border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                                                <p className="text-xs font-bold uppercase tracking-widest mb-2 border-b pb-1 opacity-50">{data.name}</p>
                                                <div className="space-y-1.5 min-w-[180px]">
                                                    <p className="flex justify-between gap-4 text-sm text-luxury-gold"><span className="opacity-60 italic">Revenu Réel:</span> <strong>{formatCurrency(data.actual)}</strong></p>
                                                    {data.isCurrent && (
                                                        <p className="flex justify-between gap-4 text-sm text-blue-500 font-bold"><span className="opacity-60 italic">Estimation Fin de Mois:</span> <strong>{formatCurrency(data.estimated)}</strong></p>
                                                    )}
                                                    <p className="flex justify-between gap-4 text-sm text-zinc-500"><span className="opacity-60 italic">Si on continue (Statu Quo):</span> <strong>{formatCurrency(data.statusQuo)}</strong></p>
                                                    <p className="flex justify-between gap-4 text-sm text-emerald-500 font-bold"><span className="opacity-60 italic">Objectif Evo 20:</span> <strong>{formatCurrency(data.target20)}</strong></p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }} />
                                <Legend verticalAlign="top" height={36} iconType="circle"/>
                                
                                {/* Zone d'ombre pour l'ambition (Evo 20) */}
                                <Area type="monotone" dataKey="target20" fill="rgba(16, 185, 129, 0.05)" stroke="none" />
                                
                                <Bar name="Revenu Réel" dataKey="actual" fill="#A68A56" radius={[4, 4, 0, 0]} barSize={35}>
                                    {yearlyExtrapolation.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.isCurrent ? '#3b82f6' : '#A68A56'} />
                                    ))}
                                </Bar>

                                {yearlyExtrapolation.some(m => m.isCurrent) && (
                                    <Bar name="Estimation Avril" dataKey="estimated" fill="rgba(59, 130, 246, 0.2)" radius={[4, 4, 0, 0]} barSize={35} />
                                )}

                                <Line name="Si on continue comme ça" type="monotone" dataKey="statusQuo" stroke="#71717a" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                <Line name="Evo 20 (Objectif)" type="monotone" dataKey="target20" stroke="#10b981" strokeWidth={3} dot={{ stroke: '#10b981', strokeWidth: 2, r: 4, fill: '#fff' }} />
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
                {trend !== 0 ? (
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${isPos ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {isPos ? <ArrowUpRight className="w-3" /> : <ArrowDownRight className="w-3" />}
                        {Math.abs(trend)}% <span className="text-[9px] text-zinc-400 font-normal uppercase italic tracking-tighter">vs {label}</span>
                    </div>
                ) : (
                    <span className="text-[9px] text-zinc-400 uppercase italic tracking-tighter">Sur l'Objectif</span>
                )}
            </CardContent>
        </Card>
    );
}
