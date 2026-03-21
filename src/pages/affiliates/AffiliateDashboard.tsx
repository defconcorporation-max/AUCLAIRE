import { Project } from '@/services/apiProjects';
import { formatCurrency } from '@/lib/utils';
import { financialUtils } from '@/utils/financialUtils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { apiAffiliates, AffiliateStats } from '@/services/apiAffiliates';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, DollarSign, Briefcase, TrendingUp, Clock, Target, Award, BarChart3, Percent } from 'lucide-react';

interface PendingCommission {
    id: string;
    amount: number;
    description: string;
    date: string;
    status: 'pending' | 'paid' | 'cancelled';
    project_id?: string;
    project?: { title: string };
}

interface MonthlyData {
    month: string;
    label: string;
    amount: number;
}

const BADGE_TIERS = [
    { nameKey: 'badgeBronze', min: 0, max: 10000, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-500/20' },
    { nameKey: 'badgeSilver', min: 10000, max: 25000, color: 'text-zinc-400', bg: 'bg-zinc-400/20' },
    { nameKey: 'badgeGold', min: 25000, max: 50000, color: 'text-luxury-gold', bg: 'bg-luxury-gold/20' },
    { nameKey: 'badgeDiamond', min: 50000, max: Infinity, color: 'text-cyan-300', bg: 'bg-cyan-400/20' },
] as const;

function getBadgeForVolume(totalSales: number) {
    for (let i = BADGE_TIERS.length - 1; i >= 0; i--) {
        if (totalSales >= BADGE_TIERS[i].min) {
            return BADGE_TIERS[i];
        }
    }
    return BADGE_TIERS[0];
}

export default function AffiliateDashboard() {
    const { t, i18n } = useTranslation();
    const localeTag = i18n.language.startsWith('en') ? 'en-CA' : 'fr-CA';
    const { profile } = useAuth();
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [pendingCommissions, setPendingCommissions] = useState<PendingCommission[]>([]);
    const [monthlySales, setMonthlySales] = useState<MonthlyData[]>([]);
    const [allAffiliates, setAllAffiliates] = useState<{ id: string; full_name: string | null; stats?: AffiliateStats }[]>([]);
    const [commissionFilter, setCommissionFilter] = useState<'all' | 'pending' | 'paid'>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            if (!profile?.id) return;
            try {
                const [data, { data: expensesData }, monthly, affiliates] = await Promise.all([
                    apiAffiliates.getAffiliateStats(profile.id),
                    supabase
                        .from('expenses')
                        .select('id, amount, description, date, status, project_id, project:projects(title)')
                        .eq('recipient_id', profile.id)
                        .eq('category', 'commission')
                        .not('description', 'ilike', '%Commission Payout%')
                        .order('date', { ascending: false }),
                    apiAffiliates.getMonthlySales(profile.id),
                    apiAffiliates.getAllAffiliatesWithStats(),
                ]);

                if (isMounted) {
                    setStats(data);
                    setPendingCommissions((expensesData || []) as unknown as PendingCommission[]);
                    setMonthlySales(monthly);
                    setAllAffiliates(affiliates.filter((a: { role?: string }) => a.role !== 'admin'));
                }
            } catch (error) {
                console.error("Failed to load affiliate data", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, [profile?.id]);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-luxury-gold" />
            </div>
        );
    }

    const { commissionEarned = 0, activeProjects = 0, projects = [], totalSales = 0, salesCount = 0 } = stats || {};
    const pendingTotal = pendingCommissions.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.amount), 0);

    const monthlyGoal = profile?.monthly_goal ?? 10000;
    const currentMonthRevenue = monthlySales.length > 0 ? monthlySales[monthlySales.length - 1]?.amount ?? 0 : 0;
    const goalProgress = Math.min(100, (currentMonthRevenue / monthlyGoal) * 100);
    const remaining = Math.max(0, monthlyGoal - currentMonthRevenue);

    const totalLeads = (projects as Project[]).length;
    const conversionRate = totalLeads > 0 ? ((salesCount / totalLeads) * 100).toFixed(1) : '0';

    const sortedAffiliates = [...allAffiliates].sort((a, b) => (b.stats?.totalSales ?? 0) - (a.stats?.totalSales ?? 0));
    const myRank = sortedAffiliates.findIndex(a => a.id === profile?.id) + 1;
    const topPerformer = sortedAffiliates[0];
    const topVolume = topPerformer?.stats?.totalSales ?? 0;
    const badge = getBadgeForVolume(totalSales);

    const expenseByProject = new Map<string | undefined, PendingCommission>();
    pendingCommissions.forEach(e => {
        if (e.project_id) expenseByProject.set(e.project_id, e);
    });

    const commissionRows = (projects as Project[]).filter(p => financialUtils.computeCommissionAmount(p) > 0).map(p => {
        const com = financialUtils.computeCommissionAmount(p);
        const exp = expenseByProject.get(p.id);
        const status = exp ? (exp.status === 'paid' ? 'paid' : 'pending') : 'not_submitted';
        return { project: p, commission: com, status };
    });

    const filteredRows = commissionRows.filter(r => {
        if (commissionFilter === 'pending') return r.status === 'pending';
        if (commissionFilter === 'paid') return r.status === 'paid';
        return true;
    });

    const maxChartValue = Math.max(...monthlySales.map(m => m.amount), 1);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-serif text-gray-900 dark:text-white">
                    {t('affiliateDashboardPage.hello', { name: profile?.full_name?.split(' ')[0] ?? '' })}
                </h1>
                <p className="text-gray-500">
                    {t('affiliateDashboardPage.level')}{' '}
                    <span className="text-luxury-gold font-bold uppercase">{profile?.affiliate_level || 'Starter'}</span>
                </p>
            </div>

            {/* Quick Stats Cards - Luxury dark theme */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass-card border border-white/5 bg-zinc-900/80 backdrop-blur-sm shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">{t('affiliateDashboardPage.volumeTotal')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-luxury-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-luxury-gold">
                            {formatCurrency(totalSales)}
                        </div>
                        <p className="text-xs text-gray-500">{t('affiliateDashboardPage.cumulativeSales')}</p>
                    </CardContent>
                </Card>

                <Card className="glass-card border border-white/5 bg-zinc-900/80 backdrop-blur-sm shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">{t('affiliateDashboardPage.commissionsEarned')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-luxury-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-luxury-gold">
                            {formatCurrency(commissionEarned)}
                        </div>
                        <p className="text-xs text-gray-500">{t('affiliateDashboardPage.totalRevenue')}</p>
                    </CardContent>
                </Card>

                <Card className="glass-card border border-white/5 bg-zinc-900/80 backdrop-blur-sm shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">{t('affiliateDashboardPage.activeProjects')}</CardTitle>
                        <Briefcase className="h-4 w-4 text-luxury-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-white">
                            {activeProjects}
                        </div>
                        <p className="text-xs text-gray-500">{t('affiliateDashboardPage.inProgress')}</p>
                    </CardContent>
                </Card>

                <Card className="glass-card border border-white/5 bg-zinc-900/80 backdrop-blur-sm shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">{t('affiliateDashboardPage.conversionRate')}</CardTitle>
                        <Percent className="h-4 w-4 text-luxury-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-white">
                            {conversionRate}%
                        </div>
                        <p className="text-xs text-gray-500">{t('affiliateDashboardPage.wonVsTotal')}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Monthly Goal Progress */}
                <Card className="glass-card border border-white/5 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Target className="h-4 w-4 text-luxury-gold" />
                            {t('affiliateDashboardPage.monthlyGoal')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-6">
                            <div className="relative h-24 w-24 flex-shrink-0">
                                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="text-zinc-700"
                                    />
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="url(#goldGradient)"
                                        strokeWidth="2"
                                        strokeDasharray={`${goalProgress}, 100`}
                                        strokeLinecap="round"
                                        className="transition-all duration-500"
                                    />
                                </svg>
                                <defs>
                                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#D2B57B" />
                                        <stop offset="100%" stopColor="#E9D8A6" />
                                    </linearGradient>
                                </defs>
                                <span className="absolute inset-0 flex items-center justify-center text-lg font-serif font-bold text-luxury-gold">
                                    {Math.round(goalProgress)}%
                                </span>
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm text-gray-400">
                                    {formatCurrency(currentMonthRevenue)} / {formatCurrency(monthlyGoal)}
                                </p>
                                <p className="text-lg font-serif font-bold text-luxury-gold">
                                    {formatCurrency(remaining)} restant
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Ranking & Badge */}
                <Card className="glass-card border border-white/5 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Award className="h-4 w-4 text-luxury-gold" />
                            {t('affiliateDashboardPage.rankingBadge')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className={`rounded-full px-4 py-2 ${badge.bg} ${badge.color} font-serif font-bold`}>
                                {t(`affiliateDashboardPage.${badge.nameKey}`)}
                            </div>
                            <div>
                                <p className="text-lg font-serif font-bold text-white">
                                    {t('affiliateDashboardPage.rankOf', { rank: myRank || '-', total: sortedAffiliates.length })}
                                </p>
                                {topVolume > 0 && totalSales < topVolume && (
                                    <p className="text-xs text-gray-500">
                                        {t('affiliateDashboardPage.bestVsYou', { best: formatCurrency(topVolume), you: formatCurrency(totalSales) })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Chart - Tailwind bar chart */}
            <Card className="glass-card border border-white/5 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-luxury-gold" />
                        {t('affiliateDashboardPage.monthlySalesChart')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-2 h-40">
                        {monthlySales.map((m) => (
                            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className="w-full rounded-t bg-gradient-to-t from-luxury-gold/80 to-luxury-gold/40 min-h-[4px] transition-all duration-500"
                                    style={{ height: `${Math.max(4, (m.amount / maxChartValue) * 100)}%` }}
                                />
                                <span className="text-[10px] text-gray-500 truncate max-w-full">{m.label}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Commission Breakdown Table */}
            <Card className="glass-card border border-white/5 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-luxury-gold" />
                            {t('affiliateDashboardPage.commissionDetail')}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Tabs value={commissionFilter} onValueChange={(v) => setCommissionFilter(v as 'all' | 'pending' | 'paid')}>
                                <TabsList className="bg-zinc-800 border border-white/5">
                                    <TabsTrigger value="all" className="data-[state=active]:bg-luxury-gold/20 data-[state=active]:text-luxury-gold">{t('affiliateDashboardPage.tabAll')}</TabsTrigger>
                                    <TabsTrigger value="pending" className="data-[state=active]:bg-luxury-gold/20 data-[state=active]:text-luxury-gold">{t('affiliateDashboardPage.tabPending')}</TabsTrigger>
                                    <TabsTrigger value="paid" className="data-[state=active]:bg-luxury-gold/20 data-[state=active]:text-luxury-gold">{t('affiliateDashboardPage.tabPaid')}</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            {pendingTotal > 0 && (
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-serif">
                                    {t('affiliateDashboardPage.pendingAmount', { amount: formatCurrency(pendingTotal) })}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-white/5 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-950/50 border-white/5">
                                    <TableHead className="text-gray-400">{t('affiliateDashboardPage.colProject')}</TableHead>
                                    <TableHead className="text-gray-400">{t('affiliateDashboardPage.colClient')}</TableHead>
                                    <TableHead className="text-right text-gray-400">{t('affiliateDashboardPage.colSaleAmount')}</TableHead>
                                    <TableHead className="text-right text-gray-400">{t('affiliateDashboardPage.colRate')}</TableHead>
                                    <TableHead className="text-right text-luxury-gold font-bold">{t('affiliateDashboardPage.colCommission')}</TableHead>
                                    <TableHead className="text-right text-gray-400">{t('affiliateDashboardPage.colStatus')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRows.length === 0 ? (
                                    <TableRow className="border-white/5">
                                        <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                            {t('affiliateDashboardPage.noCommissions')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRows.map(({ project, commission, status }) => {
                                        const price = Number(project.financials?.selling_price || project.budget || 0);
                                        const rate = project.affiliate_commission_rate || 0;
                                        const rateDisplay = project.affiliate_commission_type === 'fixed' ? t('affiliateDashboardPage.rateFixed') : `${rate}%`;
                                        const clientName = (project.client as { full_name?: string })?.full_name ?? '-';

                                        return (
                                            <TableRow key={project.id} className="border-white/5">
                                                <TableCell className="font-medium text-white">{project.title}</TableCell>
                                                <TableCell className="text-gray-400">{clientName}</TableCell>
                                                <TableCell className="text-right font-mono text-gray-300">{formatCurrency(price)}</TableCell>
                                                <TableCell className="text-right text-gray-400">{rateDisplay}</TableCell>
                                                <TableCell className="text-right font-mono font-bold text-luxury-gold">{formatCurrency(commission)}</TableCell>
                                                <TableCell className="text-right">
                                                    {status === 'paid' ? (
                                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✓ {t('affiliateDashboardPage.statusPaid')}</Badge>
                                                    ) : status === 'pending' ? (
                                                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">⏳ {t('affiliateDashboardPage.statusPending')}</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-gray-500 border-white/10">{t('affiliateDashboardPage.statusNotSubmitted')}</Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Historique des Versements (existing) */}
            {pendingCommissions.length > 0 && (
                <Card className="glass-card border border-white/5 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                            <Clock className="w-5 h-5 text-luxury-gold" />
                            {t('affiliateDashboardPage.payoutHistory')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-white/5 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-zinc-950/50 border-white/5">
                                        <TableHead className="text-gray-400">{t('affiliateDashboardPage.colDate')}</TableHead>
                                        <TableHead className="text-gray-400">{t('affiliateDashboardPage.colDescription')}</TableHead>
                                        <TableHead className="text-gray-400">{t('affiliateDashboardPage.colStatus')}</TableHead>
                                        <TableHead className="text-right text-gray-400">{t('affiliateDashboardPage.colAmount')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingCommissions.map(c => (
                                        <TableRow key={c.id} className="border-white/5">
                                            <TableCell className="text-sm text-gray-500">
                                                {new Date(c.date).toLocaleDateString(localeTag)}
                                            </TableCell>
                                            <TableCell className="font-medium text-white">{c.description}</TableCell>
                                            <TableCell>
                                                <Badge className={c.status === 'paid'
                                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                }>
                                                    {c.status === 'paid' ? `✓ ${t('affiliateDashboardPage.statusPaid')}` : `⏳ ${t('affiliateDashboardPage.statusPending')}`}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-luxury-gold">
                                                {formatCurrency(Number(c.amount))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Projects Table (Vos Dossiers Clients) - keep existing */}
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-xl font-serif text-white">{t('affiliateDashboardPage.yourClientFiles')}</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="rounded-md border border-white/5 bg-zinc-900/80 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-950/50 border-white/5">
                                    <TableHead className="text-gray-400">{t('affiliateDashboardPage.colFile')}</TableHead>
                                    <TableHead className="text-gray-400">{t('affiliateDashboardPage.colStatus')}</TableHead>
                                    <TableHead className="text-right text-gray-400">{t('affiliateDashboardPage.colSaleAmount')}</TableHead>
                                    <TableHead className="text-right text-luxury-gold font-bold">{t('affiliateDashboardPage.colYourComm')}</TableHead>
                                    <TableHead className="text-right text-gray-400">{t('affiliateDashboardPage.colCommissionStatus')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.length === 0 ? (
                                    <TableRow className="border-white/5">
                                        <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                            {t('affiliateDashboardPage.noAssignedProjects')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (projects as Project[]).map((project) => {
                                        const price = Number(project.financials?.selling_price || project.budget || 0);
                                        const com = financialUtils.computeCommissionAmount(project);
                                        const rate = project.affiliate_commission_rate || 0;
                                        const rateDisplay = project.affiliate_commission_type === 'fixed' ? t('affiliateDashboardPage.rateFixed') : `${rate}%`;
                                        const isExported = project.financials?.commission_exported_to_expenses;

                                        return (
                                            <TableRow key={project.id} className="border-white/5">
                                                <TableCell className="font-medium text-white">
                                                    <div>{project.title}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs border-white/10 text-gray-400">
                                                        {project.status?.replace(/_/g, ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-gray-300">
                                                    {formatCurrency(price)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-luxury-gold">
                                                    {formatCurrency(com)}
                                                    <span className="block text-[10px] text-gray-500 font-normal">{rateDisplay}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isExported ? (
                                                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                                                            ⏳ {t('affiliateDashboardPage.pendingPaymentBadge')}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs text-gray-500 border-white/10">
                                                            {t('affiliateDashboardPage.statusNotSubmitted')}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
