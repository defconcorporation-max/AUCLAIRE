import { useState, useMemo } from 'react';
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
import { cn } from "@/lib/utils";

export default function DailyReportSheet() {
    const [open, setOpen] = useState(false);
    const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'total'>('day');

    const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: apiInvoices.getAll, enabled: open });
    const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: apiExpenses.getAll, enabled: open });
    const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: apiActivities.getAll, enabled: open });

    const stats = useMemo(() => {
        const now = new Date();
        const startOfRange = new Date();

        if (timeframe === 'day') {
            startOfRange.setHours(0, 0, 0, 0);
        } else if (timeframe === 'week') {
            startOfRange.setDate(now.getDate() - 7);
            startOfRange.setHours(0, 0, 0, 0);
        } else if (timeframe === 'month') {
            startOfRange.setMonth(now.getMonth() - 1);
            startOfRange.setHours(0, 0, 0, 0);
        } else {
            // Total: far enough back
            startOfRange.setFullYear(2020, 0, 1);
        }

        const isInRange = (dateStr: string) => {
            const d = new Date(dateStr);
            return d >= startOfRange && d <= now;
        };

        // Financials
        const filteredInvoices = invoices.filter(inv => isInRange(inv.created_at));
        const filteredPayments = invoices.filter(inv => inv.paid_at && isInRange(inv.paid_at));
        const filteredExpenses = expenses.filter(exp => isInRange(exp.created_at) && exp.status !== 'cancelled');

        const invoiced = filteredInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
        
        // Accurate Collection: sum all "Paiement enregistré" from activities
        const collected = activities.reduce((sum, act) => {
            if (act.action === 'financial' && act.details.includes('Paiement enregistré:') && isInRange(act.created_at)) {
                const match = act.details.match(/([+-]?\d+(\.\d+)?)\$/);
                if (match) return sum + Number(match[1]);
            }
            return sum;
        }, 0);

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
            paymentCount: filteredPayments.length,
            label: timeframe === 'day' ? "aujourd'hui" : 
                   timeframe === 'week' ? "7 derniers jours" : 
                   timeframe === 'month' ? "30 derniers jours" : "tout l'historique"
        };
    }, [invoices, expenses, activities, timeframe]);

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(val);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-luxury-gold/30 hover:bg-luxury-gold/10 text-luxury-gold">
                    <Activity size={16} />
                    <span className="hidden sm:inline">Rapport Flash</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] bg-luxury-charcoal border-l-luxury-gold/20 overflow-hidden flex flex-col p-0 text-white">
                <div className="p-6 bg-gradient-to-b from-luxury-black to-transparent space-y-4">
                    <SheetHeader>
                        <div className="flex items-center gap-2 text-luxury-gold mb-1">
                            <Calendar size={18} />
                            <span className="text-sm font-medium uppercase tracking-widest italic">{stats.label}</span>
                        </div>
                        <SheetTitle className="text-3xl font-serif text-white">Business Snapshot</SheetTitle>
                        <SheetDescription className="text-zinc-400">
                            Performance et activités sur la période sélectionnée.
                        </SheetDescription>
                    </SheetHeader>

                    {/* Timeframe Toggles */}
                    <div className="flex bg-luxury-black/50 p-1 rounded-lg border border-zinc-800 w-fit">
                        {[
                            { id: 'day', label: 'Jour' },
                            { id: 'week', label: 'Semaine' },
                            { id: 'month', label: 'Mois' },
                            { id: 'total', label: 'Total' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTimeframe(t.id as any)}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-medium rounded-md transition-all",
                                    timeframe === t.id 
                                        ? "bg-luxury-gold text-luxury-black shadow-lg" 
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {t.label}
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
                                    <DollarSign size={12} /> Facturé
                                </div>
                                <div className="text-xl font-bold text-white">{formatCurrency(stats.invoiced)}</div>
                                <div className="text-[10px] text-zinc-500 mt-1">{stats.invoiceCount} factures</div>
                            </div>
                            <div className="p-4 rounded-xl bg-luxury-black/50 border border-zinc-800">
                                <div className="text-green-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <TrendingUp size={12} /> Encaissé
                                </div>
                                <div className="text-xl font-bold text-green-400">{formatCurrency(stats.collected)}</div>
                                <div className="text-[10px] text-zinc-500 mt-1">{stats.paymentCount} paiements</div>
                            </div>
                            <div className="p-4 rounded-xl bg-luxury-black/50 border border-zinc-800">
                                <div className="text-red-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <DollarSign size={12} /> Dépensé
                                </div>
                                <div className="text-xl font-bold text-red-400">{formatCurrency(stats.spent)}</div>
                            </div>
                            <div className={cn(
                                "p-4 rounded-xl border",
                                stats.profit >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
                            )}>
                                <div className="text-xs uppercase tracking-wider mb-1 flex items-center gap-1 text-zinc-400">
                                    Profit Net (Cash)
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
                                Historique des Statuts
                            </h4>
                            
                            {stats.advancements.length === 0 ? (
                                <div className="py-8 text-center border-dashed border-zinc-800 border rounded-xl">
                                    <Clock className="mx-auto mb-2 text-zinc-700" size={24} />
                                    <p className="text-sm text-zinc-500">Aucun changement de statut sur cette période.</p>
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
                                                        {new Date(act.created_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-500">
                                                    Par <span className="text-zinc-400 font-medium">{act.user_name}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 rounded-lg bg-luxury-gold/5 border border-luxury-gold/10">
                            <p className="text-[11px] text-luxury-gold/70 italic leading-relaxed">
                                * Les données affichées correspondent à la période sélectionnée ({stats.label}). Le profit correspond au cash flow net encaissé.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-luxury-gold/10 bg-luxury-black/80 backdrop-blur">
                    <Button 
                        className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black font-bold uppercase tracking-widest"
                        onClick={() => setOpen(false)}
                    >
                        Quitter le Rapport
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
