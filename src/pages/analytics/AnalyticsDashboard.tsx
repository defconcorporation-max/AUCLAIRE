import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Banknote, Briefcase, Trophy, ChevronUp, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, FileDown, Gem, Target, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { generateMonthlyReportPDF } from '@/services/monthlyReportPdf';
import { apiSettings } from '@/services/apiSettings';
import { useAnalyticsData, type Timeframe, type Insight, type JewelryRow, type ManufacturerStat, type SellerStat, type TrendData, type ChartDataPoint, type ForecastPoint } from '@/hooks/useAnalyticsData';

// ═══════════════════════════════════════════════════════════════
//  ANALYTICS DASHBOARD — Modular, Hook-Driven
// ═══════════════════════════════════════════════════════════════

export default function AnalyticsDashboard() {
    const { t } = useTranslation();
    const [timeframe, setTimeframe] = useState<Timeframe>('month');
    const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
    
    // Hook handles all computation and filtering
    const data = useAnalyticsData(timeframe, selectedSellerId);

    if (data.isLoading) {
        return <div className="p-8 text-center text-luxury-gold animate-pulse font-serif">{t('analyticsPage.loading')}</div>;
    }

    if (!data.trendData) return null;

    const selectedSeller = selectedSellerId ? data.users.find(u => u.id === selectedSellerId) : null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            {/* Header + Timeframe Selector */}
            <DashboardHeader
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                selectedSellerName={selectedSeller?.full_name}
                onClearSeller={() => setSelectedSellerId(null)}
                onExport={async () => {
                    const settings = await apiSettings.get();
                    generateMonthlyReportPDF({ invoices: data.invoices, expenses: data.expenses, projects: data.projects, month: new Date(), settings });
                }}
            />

            {/* Top KPI Cards */}
            <KpiGrid 
                trendData={data.trendData} 
                timeframe={timeframe} 
                weightedPipeline={data.weightedPipeline!} 
                conversionRate={data.conversionRate!}
            />

            {/* Revenue Chart + Top Seller */}
            <div className="grid gap-6 md:grid-cols-3">
                <RevenueChart
                    chartData={data.chartData!}
                    currentYear={data.currentYear!}
                    timeframe={timeframe}
                />
                <TopSellerCard 
                    leaderboard={data.leaderboard!} 
                    onSelectSeller={setSelectedSellerId}
                />
            </div>

            {/* Forecast */}
            <ForecastChart forecast={data.forecast!} />

            {/* Manufacturer Scorecards (Only show if no specific seller is filtered for clarity) */}
            {!selectedSellerId && <ManufacturerTable scorecards={data.manufacturerScorecard!} />}

            {/* Seller Leaderboard */}
            <SellerLeaderboard 
                leaderboard={data.leaderboard!} 
                selectedSellerId={selectedSellerId}
                onSelectSeller={setSelectedSellerId}
            />

            {/* AI Insights */}
            <InsightsPanel insights={data.insights!} />

            {/* Jewelry Profitability */}
            <JewelryProfitBreakdown rows={data.jewelryRows!} />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function DashboardHeader({ 
    timeframe, 
    setTimeframe, 
    onExport, 
    selectedSellerName, 
    onClearSeller 
}: { 
    timeframe: Timeframe; 
    setTimeframe: (t: Timeframe) => void; 
    onExport: () => void;
    selectedSellerName?: string;
    onClearSeller: () => void;
}) {
    const { t } = useTranslation();
    const labels: Record<Timeframe, string> = {
        day: t('analyticsPage.periodDay'),
        week: t('analyticsPage.periodWeek'),
        month: t('analyticsPage.periodMonth'),
        total: t('analyticsPage.periodTotal'),
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-serif text-black dark:text-white tracking-wide">{t('analyticsPage.title')}</h1>
                    {selectedSellerName && (
                        <Badge variant="outline" className="h-8 pl-3 pr-1 gap-2 bg-luxury-gold/10 border-luxury-gold text-luxury-gold rounded-full font-sans uppercase tracking-widest text-[10px]">
                            {selectedSellerName}
                            <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-luxury-gold/20 p-0" onClick={onClearSeller}>
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}
                </div>
                <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">
                    {selectedSellerName ? t('analyticsPage.viewingStatsFor', { name: selectedSellerName }) : t('analyticsPage.subtitle')}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onExport}
                    className="rounded-lg border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10 hover:border-luxury-gold/50 transition-all"
                >
                    <FileDown className="w-4 h-4 mr-2" />
                    {t('analyticsPage.exportPdf')}
                </Button>
                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl backdrop-blur-md border border-black/10 dark:border-white/10">
                    {(['day', 'week', 'month', 'total'] as const).map((period) => (
                        <Button
                            key={period}
                            variant="ghost"
                            size="sm"
                            onClick={() => setTimeframe(period)}
                            className={`rounded-lg px-4 transition-all duration-300 ${
                                timeframe === period
                                    ? 'bg-luxury-gold text-white shadow-lg'
                                    : 'hover:bg-luxury-gold/10 text-muted-foreground'
                            }`}
                        >
                            {labels[period]}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function KpiGrid({ trendData, timeframe, weightedPipeline, conversionRate }: { trendData: TrendData; timeframe: Timeframe; weightedPipeline: number; conversionRate: number }) {
    const { t } = useTranslation();
    const showTrend = timeframe !== 'total';

    const kpis = [
        { label: t('analyticsPage.kpiAvgOrder'), value: formatCurrency(trendData.current.avgOrder), growth: trendData.growth.avgOrder, icon: <Briefcase className="h-4 w-4 text-luxury-gold" />, border: '' },
        { label: t('analyticsPage.kpiCashCollected'), value: formatCurrency(trendData.current.collected), growth: trendData.growth.collected, icon: <Banknote className="h-4 w-4 text-green-500" />, border: '' },
        { 
            label: t('analyticsPage.conversionRate', 'Taux de Conversion'), 
            value: `${conversionRate}%`, 
            growth: 0, 
            icon: <Target className="h-4 w-4 text-purple-500" />, 
            border: '',
            hideTrend: true
        },
        { label: t('analyticsPage.kpiProfit'), value: formatCurrency(trendData.current.profit), growth: trendData.growth.profit, icon: <TrendingUp className="h-4 w-4 text-green-600" />, border: 'border-l-green-500/50', valueClass: trendData.current.profit >= 0 ? '' : 'text-red-500' },
        { label: t('analyticsPage.kpiOutstanding'), value: formatCurrency(trendData.current.outstanding), growth: trendData.growth.outstanding, icon: <Banknote className="h-4 w-4 text-orange-500" />, border: 'border-l-red-500/50' },
    ];

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi, i) => (
                <Card key={i} className={`bg-gradient-to-br from-black/5 to-transparent dark:from-white/5 border-black/10 dark:border-white/10 relative overflow-hidden ${kpi.border}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-gray-500">{kpi.label}</CardTitle>
                        {kpi.icon}
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className={`text-3xl font-serif text-black dark:text-white ${kpi.valueClass || ''}`}>{kpi.value}</div>
                            {showTrend && !kpi.hideTrend && <TrendBadge value={kpi.growth} label={trendData.label} />}
                        </div>
                    </CardContent>
                </Card>
            ))}
            {/* Weighted Pipeline — special gold card */}
            <Card className="bg-gradient-to-br from-luxury-gold/10 to-transparent border-luxury-gold/20 relative overflow-hidden ring-1 ring-luxury-gold/20 shadow-lg shadow-luxury-gold/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium uppercase tracking-widest text-luxury-gold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> {t('analyticsPage.kpiWeightedPipeline')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-serif text-luxury-gold">{formatCurrency(weightedPipeline)}</div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-tighter mt-1">{t('analyticsPage.kpiPipelineHint')}</p>
                </CardContent>
            </Card>
        </div>
    );
}

function RevenueChart({ chartData, currentYear, timeframe }: { chartData: ChartDataPoint[]; currentYear: number; timeframe: Timeframe }) {
    const { t } = useTranslation();
    
    let chartTitle = t('analyticsPage.chartAnnualTitle', { year: currentYear });
    if (timeframe === 'day') chartTitle = t('analyticsPage.chartDailyTitle', 'Activité des dernières 24h');
    if (timeframe === 'week') chartTitle = t('analyticsPage.chartWeeklyTitle', 'Activité des 7 derniers jours');

    return (
        <Card className="md:col-span-2 border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-xl">
            <CardHeader>
                <CardTitle className="font-serif text-xl">{chartTitle}</CardTitle>
                <CardDescription>{t('analyticsPage.chartAnnualDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                            <XAxis dataKey="label" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number)} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value), ""]}
                                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(210,181,123,0.3)', color: '#fff' }}
                            />
                            <Area type="monotone" name={t('analyticsPage.seriesInvoiced')} dataKey="invoiced" stroke="#A68A56" fillOpacity={1} fill="url(#colorInvoiced)" />
                            <Area type="monotone" name={t('analyticsPage.seriesCollected')} dataKey="collected" stroke="#22c55e" fillOpacity={1} fill="url(#colorCollected)" />
                            <Area type="monotone" name={t('analyticsPage.seriesSpent')} dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

function TopSellerCard({ leaderboard, onSelectSeller }: { leaderboard: SellerStat[]; onSelectSeller: (id: string) => void }) {
    const { t } = useTranslation();
    return (
        <Card className="border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-xl">
            <CardHeader className="pb-2">
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-luxury-gold" />
                    {t('analyticsPage.topSeller')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center h-[300px] mt-4">
                {leaderboard.length > 0 ? (
                    <div 
                        className="text-center space-y-6 cursor-pointer group"
                        onClick={() => onSelectSeller(leaderboard[0].id)}
                    >
                        <div className="inline-flex items-center justify-center p-6 bg-luxury-gold/10 rounded-full ring-2 ring-luxury-gold/30 group-hover:scale-110 transition-transform">
                            <Trophy className="w-12 h-12 text-luxury-gold" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif text-black dark:text-white group-hover:text-luxury-gold transition-colors">{leaderboard[0].name}</h3>
                            <p className="text-luxury-gold mt-1 uppercase tracking-widest text-sm font-semibold">
                                {t('analyticsPage.topSellerGenerated', { amount: formatCurrency(leaderboard[0].volume) })}
                            </p>
                            <p className="text-gray-500 text-xs mt-2">{t('analyticsPage.topSellerProjects', { count: leaderboard[0].projectCount })}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500">{t('analyticsPage.topSellerEmpty')}</div>
                )}
            </CardContent>
        </Card>
    );
}

function ForecastChart({ forecast }: { forecast: ForecastPoint[] }) {
    const { t } = useTranslation();
    return (
        <Card className="border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-xl">
            <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-luxury-gold" />
                    {t('analyticsPage.forecastTitle')}
                </CardTitle>
                <CardDescription>{t('analyticsPage.forecastDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={forecast}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis hide />
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value), t('analyticsPage.forecastTooltip')]}
                                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(210,181,123,0.3)', color: '#fff' }}
                            />
                            <Bar dataKey="projected" radius={[4, 4, 0, 0]} barSize={40}>
                                {forecast.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#A68A56' : '#d2b57b'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-muted-foreground text-center italic mt-2">
                    {t('analyticsPage.forecastFootnote')}
                </p>
            </CardContent>
        </Card>
    );
}

function ManufacturerTable({ scorecards }: { scorecards: ManufacturerStat[] }) {
    const { t } = useTranslation();
    return (
        <Card className="border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-xl overflow-hidden mt-8">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-serif text-2xl tracking-wide flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-luxury-gold" />
                        {t('analyticsPage.manufacturerTitle')}
                    </CardTitle>
                    <CardDescription>{t('analyticsPage.manufacturerDesc')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-black/5 dark:bg-white/5">
                        <TableRow className="border-black/5 dark:border-white/5">
                            <TableHead>{t('analyticsPage.colManufacturer')}</TableHead>
                            <TableHead className="text-center">{t('analyticsPage.colProjects')}</TableHead>
                            <TableHead className="text-center text-blue-500">{t('analyticsPage.colAvgSpeed')}</TableHead>
                            <TableHead className="text-center text-green-500">{t('analyticsPage.colQualityScore')}</TableHead>
                            <TableHead className="text-right">{t('analyticsPage.colTotalVolume')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {scorecards.map((m) => (
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
                                        {t('analyticsPage.projectsBadge', { count: m.projectCount })}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center font-serif text-lg">
                                    {m.avgSpeed > 0 ? (
                                        <span className={m.avgSpeed < 7 ? 'text-green-500' : m.avgSpeed > 14 ? 'text-red-500' : 'text-amber-500'}>
                                            {t('analyticsPage.days', { count: m.avgSpeed })}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">{t('analyticsPage.na')}</span>
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
                                    {formatCurrency(m.volume)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {scorecards.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500 italic">
                                    {t('analyticsPage.manufacturerEmpty')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function SellerLeaderboard({ 
    leaderboard, 
    selectedSellerId, 
    onSelectSeller 
}: { 
    leaderboard: SellerStat[]; 
    selectedSellerId?: string | null;
    onSelectSeller: (id: string) => void;
}) {
    const { t } = useTranslation();
    return (
        <Card className="border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-xl overflow-hidden mt-8">
            <CardHeader>
                <CardTitle className="font-serif text-2xl tracking-wide">{t('analyticsPage.leaderboardTitle')}</CardTitle>
                <CardDescription>{t('analyticsPage.leaderboardDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-black/5 dark:bg-white/5">
                        <TableRow className="border-black/5 dark:border-white/5">
                            <TableHead className="w-16 text-center font-bold text-luxury-gold">{t('analyticsPage.colRank')}</TableHead>
                            <TableHead>{t('analyticsPage.colSellerName')}</TableHead>
                            <TableHead className="text-center">{t('analyticsPage.colProjects')}</TableHead>
                            <TableHead className="text-right">{t('analyticsPage.colBroughtVolume')}</TableHead>
                            <TableHead className="text-right text-green-600/70 dark:text-green-500">{t('analyticsPage.colCashRecovered')}</TableHead>
                            <TableHead className="text-right text-purple-600/70 dark:text-purple-400">{t('analyticsPage.colCommissionsEst')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaderboard.map((seller, idx) => (
                            <TableRow 
                                key={seller.id} 
                                className={`border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${selectedSellerId === seller.id ? 'bg-luxury-gold/10' : ''}`}
                                onClick={() => onSelectSeller(seller.id)}
                            >
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
                                            {seller.role === 'admin' ? t('affiliatesListPage.roleAdmin') : seller.role === 'ambassador' ? t('affiliatesListPage.roleAmbassador') : t('affiliatesListPage.roleSeller')}
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
                                    {formatCurrency(seller.volume)}
                                </TableCell>
                                <TableCell className="text-right font-serif text-lg font-bold text-green-600 dark:text-green-500">
                                    {formatCurrency(seller.cashCollected)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm text-purple-600 dark:text-purple-400 font-medium">
                                    {formatCurrency(seller.commissions)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {leaderboard.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    {t('analyticsPage.leaderboardEmpty')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function InsightsPanel({ insights }: { insights: Insight[] }) {
    const { t } = useTranslation();
    const typeColors: Record<Insight['type'], string> = {
        success: 'border-green-500/20 bg-green-500/5',
        warning: 'border-amber-500/20 bg-amber-500/5',
        danger: 'border-red-500/20 bg-red-500/5',
        info: 'border-blue-500/20 bg-blue-500/5',
    };

    return (
        <Card className="border-luxury-gold/20 bg-gradient-to-br from-luxury-gold/5 to-transparent backdrop-blur-md shadow-xl mt-8">
            <CardHeader>
                <CardTitle className="font-serif text-2xl tracking-wide flex items-center gap-2">
                    <span className="text-luxury-gold">✨</span>
                    {t('analyticsPage.aiInsightsTitle')}
                </CardTitle>
                <CardDescription>{t('analyticsPage.aiInsightsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                    {insights.map((insight, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${typeColors[insight.type]}`}>
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
    );
}

function JewelryProfitBreakdown({ rows }: { rows: JewelryRow[] }) {
    const { t } = useTranslation();
    const maxRevenue = Math.max(...rows.map(r => r.revenue), 1);

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Gem className="w-5 h-5 text-luxury-gold" />
                    {t('analyticsPage.jewelryProfitTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="space-y-3">
                        {rows.map(row => (
                            <div key={row.name} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-serif font-medium">{row.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{t('analyticsPage.jewelryProjectCount', { count: row.count })}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-muted-foreground">{formatCurrency(row.revenue)}</span>
                                        <span className={`font-bold ${row.marginPct >= 30 ? 'text-green-500' : row.marginPct >= 15 ? 'text-amber-500' : 'text-red-500'}`}>
                                            {t('analyticsPage.jewelryMargin', { pct: row.marginPct.toFixed(0) })}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-luxury-gold/60 rounded-full transition-all duration-700"
                                        style={{ width: `${(row.costs / maxRevenue) * 100}%` }}
                                    />
                                    <div
                                        className="h-full bg-green-500/60 rounded-full transition-all duration-700"
                                        style={{ width: `${(Math.max(0, row.margin) / maxRevenue) * 100}%` }}
                                    />
                                </div>
                                <div className="flex gap-4 text-[10px] text-muted-foreground">
                                    <span>{t('analyticsPage.jewelryCosts', { amount: formatCurrency(row.costs) })}</span>
                                    <span>{t('analyticsPage.jewelryMarginAmt', { amount: formatCurrency(row.margin) })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-6 text-[10px] text-muted-foreground pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-luxury-gold/60" />
                            <span>{t('analyticsPage.legendDirectCosts')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-green-500/60" />
                            <span>{t('analyticsPage.legendGrossMargin')}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ═══════════════════════════════════════════════════════════════
//  SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════

function TrendBadge({ value, label }: { value: number; label: string }) {
    const { t } = useTranslation();
    if (value === 0) return (
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                <Minus className="w-3 h-3" />
                <span>{t('analyticsPage.trendFlat')}</span>
            </div>
            <span className="text-[9px] text-gray-400 uppercase tracking-tighter">{t('analyticsPage.trendVs', { label })}</span>
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
            <span className="text-[9px] text-muted-foreground uppercase tracking-tighter mt-1 italic">{t('analyticsPage.trendVs', { label })}</span>
        </div>
    );
}
