import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiInvoices } from '@/services/apiInvoices';
import { apiExpenses } from '@/services/apiExpenses';
import { apiProjects } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function CashFlowForecast() {
    const { t, i18n } = useTranslation();
    const localeTag = i18n.language.startsWith('en') ? 'en-CA' : 'fr-CA';
    const { data: invoices, isLoading: invLoading } = useQuery({ queryKey: ['invoices'], queryFn: apiInvoices.getAll });
    const { data: expenses, isLoading: expLoading } = useQuery({ queryKey: ['expenses'], queryFn: apiExpenses.getAll });
    const { data: projects, isLoading: pLoad } = useQuery({ queryKey: ['projects'], queryFn: apiProjects.getAll });

    if (invLoading || expLoading || pLoad) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-luxury-gold" /></div>;
    }

    const now = new Date();
    const months: { key: string; label: string; start: Date; end: Date; income: number; expense: number; pending: number }[] = [];

    for (let i = -2; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + i + 1, 0, 23, 59, 59);
        const label = d.toLocaleDateString(localeTag, { month: 'short', year: 'numeric' });
        months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label, start: d, end, income: 0, expense: 0, pending: 0 });
    }

    invoices?.forEach(inv => {
        const paidAt = inv.paid_at ? new Date(inv.paid_at) : null;
        const dueDate = inv.due_date ? new Date(inv.due_date) : null;
        const amount = Number(inv.amount_paid) || 0;
        const remaining = Number(inv.amount) - amount;
        if (paidAt && amount > 0) {
            const m = months.find(mo => paidAt >= mo.start && paidAt <= mo.end);
            if (m) m.income += amount;
        }
        if (remaining > 0 && inv.status !== 'paid' && inv.status !== 'void') {
            const targetDate = dueDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const m = months.find(mo => targetDate >= mo.start && targetDate <= mo.end);
            if (m) m.pending += remaining;
        }
    });

    expenses?.forEach(exp => {
        const date = new Date(exp.date);
        if (exp.status === 'cancelled') return;
        const m = months.find(mo => date >= mo.start && date <= mo.end);
        if (m) m.expense += Number(exp.amount) || 0;
    });

    const maxVal = Math.max(...months.map(m => Math.max(m.income + m.pending, m.expense)), 1);
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonth = months.find(m => m.key === currentMonthKey);

    const totalCollected = invoices?.reduce((s, i) => s + (Number(i.amount_paid) > 0 ? Number(i.amount_paid) : (i.status === 'paid' ? Number(i.amount) : 0)), 0) || 0;
    const totalOutstanding = invoices?.filter(i => i.status !== 'paid' && i.status !== 'void').reduce((s, i) => s + (Number(i.amount) - Number(i.amount_paid || 0)), 0) || 0;

    const totalPending = months.filter(m => m.start >= now).reduce((s, m) => s + m.pending, 0);
    const totalFutureExpense = months.filter(m => m.start >= now).reduce((s, m) => s + m.expense, 0);
    const netForecast = totalPending - totalFutureExpense;

    const activeProjects = projects?.filter(p => !['completed', 'cancelled'].includes(p.status)).length || 0;
    const healthStatus = netForecast >= 0 ? 'healthy' : 'warning';

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif text-luxury-gold">{t('cashFlowPage.title')}</h1>
                <p className="text-muted-foreground mt-1">{t('cashFlowPage.subtitle')}</p>
            </div>

            {/* Quick summary */}
            <Card className={`glass-card border-2 ${healthStatus === 'healthy' ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                <CardContent className="py-6">
                    <div className="flex items-center gap-4 mb-4">
                        {healthStatus === 'healthy'
                            ? <CheckCircle2 className="w-8 h-8 text-green-500" />
                            : <AlertTriangle className="w-8 h-8 text-amber-500" />
                        }
                        <div>
                            <h2 className="text-xl font-serif font-bold">
                                {healthStatus === 'healthy' ? t('cashFlowPage.healthy') : t('cashFlowPage.attention')}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {t('cashFlowPage.summaryLine', {
                                    active: activeProjects,
                                    collected: formatCurrency(totalCollected),
                                    outstanding: formatCurrency(totalOutstanding),
                                })}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{t('cashFlowPage.thisMonth')}</p>
                            <p className="text-lg font-serif font-bold text-green-500">+{formatCurrency(currentMonth?.income || 0)}</p>
                            <p className="text-[10px] text-muted-foreground">{t('cashFlowPage.encashed')}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{t('cashFlowPage.upcoming')}</p>
                            <p className="text-lg font-serif font-bold text-emerald-400">{formatCurrency(totalPending)}</p>
                            <p className="text-[10px] text-muted-foreground">{t('cashFlowPage.pendingInvoices')}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{t('cashFlowPage.expenses')}</p>
                            <p className="text-lg font-serif font-bold text-red-500">{formatCurrency(totalFutureExpense)}</p>
                            <p className="text-[10px] text-muted-foreground">{t('cashFlowPage.planned')}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{t('cashFlowPage.netBalance')}</p>
                            <p className={`text-lg font-serif font-bold ${netForecast >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(netForecast)}</p>
                            <p className="text-[10px] text-muted-foreground">{t('cashFlowPage.forecast')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-luxury-gold" />
                        {t('cashFlowPage.monthlyFlow')}
                    </CardTitle>
                    <CardDescription className="text-xs">{t('cashFlowPage.monthlyFlowDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {months.map(m => {
                            const isCurrent = m.key === currentMonthKey;
                            const isPast = m.end < now;
                            const net = m.income + m.pending - m.expense;
                            return (
                                <div key={m.key} className={`space-y-1.5 ${isCurrent ? 'bg-luxury-gold/5 -mx-4 px-4 py-3 rounded-xl border border-luxury-gold/20' : ''}`}>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-serif font-medium ${isCurrent ? 'text-luxury-gold' : ''}`}>{m.label}</span>
                                            {isCurrent && <Badge className="bg-luxury-gold/20 text-luxury-gold border-luxury-gold/30 text-[10px]">{t('cashFlowPage.currentBadge')}</Badge>}
                                            {isPast && <span className="text-[10px] text-muted-foreground">{t('cashFlowPage.pastSuffix')}</span>}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-mono">
                                            <span className="text-green-500">+{formatCurrency(m.income + m.pending)}</span>
                                            <span className="text-red-500">-{formatCurrency(m.expense)}</span>
                                            <span className={`font-bold ${net >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                                                = {formatCurrency(net)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 h-4">
                                        {m.income > 0 && <div className="bg-green-500/70 rounded-sm transition-all duration-500" style={{ width: `${(m.income / maxVal) * 100}%` }} title={t('cashFlowPage.tipCollected', { amount: formatCurrency(m.income) })} />}
                                        {m.pending > 0 && <div className="bg-green-500/30 rounded-sm border border-green-500/40 border-dashed transition-all duration-500" style={{ width: `${(m.pending / maxVal) * 100}%` }} title={t('cashFlowPage.tipReceivable', { amount: formatCurrency(m.pending) })} />}
                                    </div>
                                    {m.expense > 0 && (
                                        <div className="flex gap-1 h-3">
                                            <div className="bg-red-500/50 rounded-sm transition-all duration-500" style={{ width: `${(m.expense / maxVal) * 100}%` }} title={t('cashFlowPage.tipExpenses', { amount: formatCurrency(m.expense) })} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-6 text-[10px] text-muted-foreground pt-4 mt-4 border-t border-white/5">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500/70" /><span>{t('cashFlowPage.legendCollected')}</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/40 border-dashed" /><span>{t('cashFlowPage.legendReceivable')}</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500/50" /><span>{t('cashFlowPage.legendExpenses')}</span></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
