import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
    Calendar, 
    TrendingUp, 
    CheckCircle2, 
    Clock, 
    DollarSign,
    Briefcase,
    Activity
} from "lucide-react";
import { apiInvoices } from '@/services/apiInvoices';
import { apiExpenses } from '@/services/apiExpenses';
import { apiActivities } from '@/services/apiActivities';
import { cn, formatCurrency } from "@/lib/utils";
import { financialUtils } from "@/utils/financialUtils";
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

/** Données sensibles (CA, encaissements, marges) — jamais exposées aux manufacturiers */
export default function DailyReportSheet() {
    const { role } = useAuth();
    const { t, i18n } = useTranslation();
    const hideFinancialFlash = role === 'manufacturer';

    const [open, setOpen] = useState(false);
    const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'total'>('day');

    const queriesEnabled = open && !hideFinancialFlash;

    const { data: invoices = [], refetch: refetchInvoices } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll,
        enabled: queriesEnabled,
    });
    const { data: expenses = [] } = useQuery({
        queryKey: ['expenses'],
        queryFn: apiExpenses.getAll,
        enabled: queriesEnabled,
    });
    const { data: activities = [], refetch: refetchActivities } = useQuery({
        queryKey: ['activities'],
        queryFn: apiActivities.getAll,
        enabled: queriesEnabled,
    });

    useEffect(() => {
        if (queriesEnabled) {
            refetchInvoices();
            refetchActivities();
        }
    }, [queriesEnabled, refetchInvoices, refetchActivities]);

    const stats = useMemo(() => {
        const { start, end } = financialUtils.getPeriodRange(
            timeframe === "day" ? "day" :
            timeframe === "week" ? "week" :
            timeframe === "month" ? "month" : "total"
        );

        const isInRange = (dateStr: string) =>
            financialUtils.isInRange(dateStr, start, end);

        // Financials
        const filteredInvoices = invoices.filter(inv => isInRange(inv.created_at));
        const filteredExpenses = expenses.filter(exp => isInRange(exp.created_at) && exp.status !== 'cancelled');

        const invoiced = filteredInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

        const collected = financialUtils.getCollectedFromInvoices(invoices, start, end);

        const spent = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
        const profit = collected - spent;

        // Advancements
        const filteredAdvancements = activities.filter(act => 
            isInRange(act.created_at) && act.action === 'status_change'
        );

        return {
            invoiced,
            collected,
            spent,
            profit,
            advancements: filteredAdvancements,
            invoiceCount: filteredInvoices.length,
            paymentCount: activities.filter(act => 
                act.action === 'financial' && act.details.includes('Paiement enregistré:') && isInRange(act.created_at)
            ).length,
            label: timeframe === 'day' ? t('dailyReport.periodDay') :
                   timeframe === 'week' ? t('dailyReport.periodWeek') :
                   timeframe === 'month' ? t('dailyReport.periodMonth') : t('dailyReport.periodTotal')
        };
    }, [invoices, expenses, activities, timeframe, t]);

    if (hideFinancialFlash) {
        return null;
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-luxury-gold/30 hover:bg-luxury-gold/10 text-luxury-gold">
                    <Activity size={16} />
                    <span className="hidden sm:inline">{t('dailyReport.button')}</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] bg-luxury-charcoal border-l-luxury-gold/20 overflow-hidden flex flex-col p-0 text-white">
                <div className="p-6 bg-gradient-to-b from-luxury-black to-transparent space-y-4">
                    <SheetHeader>
                        <div className="flex items-center gap-2 text-luxury-gold mb-1">
                            <Calendar size={18} />
                            <span className="text-sm font-medium uppercase tracking-widest italic">{stats.label}</span>
                        </div>
                        <SheetTitle className="text-3xl font-serif text-white">{t('dailyReport.snapshotTitle')}</SheetTitle>
                        <SheetDescription className="text-zinc-400">
                            {t('dailyReport.snapshotSubtitle')}
                        </SheetDescription>
                    </SheetHeader>

                    {/* Timeframe Toggles */}
                    <div className="flex bg-luxury-black/50 p-1 rounded-lg border border-zinc-800 w-fit">
                        {([
                            { id: 'day' as const, labelKey: 'dailyReport.day' },
                            { id: 'week' as const, labelKey: 'dailyReport.week' },
                            { id: 'month' as const, labelKey: 'dailyReport.month' },
                            { id: 'total' as const, labelKey: 'dailyReport.total' }
                        ]).map((period) => (
                            <button
                                key={period.id}
                                onClick={() => setTimeframe(period.id)}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-medium rounded-md transition-all",
                                    timeframe === period.id 
                                        ? "bg-luxury-gold text-luxury-black shadow-lg" 
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {t(period.labelKey)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 px-6 pb-6 overflow-y-auto">
                    <div className="space-y-8">
                        {/* Financial Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-luxury-black/50 border border-zinc-800">
                                <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <DollarSign size={12} /> {t('dailyReport.invoiced')}
                                </div>
                                <div className="text-xl font-bold text-white">{formatCurrency(stats.invoiced)}</div>
                                <div className="text-[10px] text-zinc-500 mt-1">{t('dailyReport.invoicesCount', { count: stats.invoiceCount })}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-luxury-black/50 border border-zinc-800">
                                <div className="text-green-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <TrendingUp size={12} /> {t('dailyReport.collected')}
                                </div>
                                <div className="text-xl font-bold text-green-400">{formatCurrency(stats.collected)}</div>
                                <div className="text-[10px] text-zinc-500 mt-1">{t('dailyReport.paymentsCount', { count: stats.paymentCount })}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-luxury-black/50 border border-zinc-800">
                                <div className="text-red-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <DollarSign size={12} /> {t('dailyReport.spent')}
                                </div>
                                <div className="text-xl font-bold text-red-400">{formatCurrency(stats.spent)}</div>
                            </div>
                            <div className={cn(
                                "p-4 rounded-xl border",
                                stats.profit >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
                            )}>
                                <div className="text-xs uppercase tracking-wider mb-1 flex items-center gap-1 text-zinc-400">
                                    {t('dailyReport.netProfit')}
                                </div>
                                <div className={cn(
                                    "text-xl font-bold",
                                    stats.profit >= 0 ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {formatCurrency(stats.profit)}
                                </div>
                            </div>
                        </div>

                        {/* Project Advancements */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-luxury-gold flex items-center gap-2">
                                <Briefcase size={16} />
                                {t('dailyReport.statusHistory')}
                            </h4>
                            
                            {stats.advancements.length === 0 ? (
                                <div className="py-8 text-center border-dashed border-zinc-800 border rounded-xl">
                                    <Clock className="mx-auto mb-2 text-zinc-700" size={24} />
                                    <p className="text-sm text-zinc-500">{t('dailyReport.noStatusChanges')}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {stats.advancements.map((act) => (
                                        <div key={act.id} className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-start gap-4">
                                            <div className="mt-1">
                                                <CheckCircle2 className="text-luxury-gold" size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {act.details.split('by')[0].trim()}
                                                    </p>
                                                    <span className="text-[10px] text-zinc-600 whitespace-nowrap ml-2">
                                                        {new Date(act.created_at).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-CA' : 'fr-CA', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-500">
                                                    {t('dailyReport.byAuthor')} <span className="text-zinc-400 font-medium">{act.user_name}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 rounded-lg bg-luxury-gold/5 border border-luxury-gold/10">
                            <p className="text-[11px] text-luxury-gold/70 italic leading-relaxed">
                                {t('dailyReport.footnote', { period: stats.label })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-luxury-gold/10 bg-luxury-black/80 backdrop-blur">
                    <Button 
                        className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black font-bold uppercase tracking-widest"
                        onClick={() => setOpen(false)}
                    >
                        {t('dailyReport.close')}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
