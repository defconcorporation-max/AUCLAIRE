import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, AlertTriangle, PieChart } from 'lucide-react';
import { formatCurrency } from '@/utils/taxUtils';

interface FinancialItem {
    id?: string;
    detail: string;
    amount: number;
}

interface ProjectFinancialDashboardProps {
    budget: number;
    financials: {
        supplier_cost?: number;
        shipping_cost?: number;
        customs_fee?: number;
        additional_expense?: number;
        cost_items?: FinancialItem[];
        selling_price?: number;
    } | null;
    commission?: number;
}

export const ProjectFinancialDashboard: React.FC<ProjectFinancialDashboardProps> = ({ 
    budget, 
    financials, 
    commission = 0 
}) => {
    const { t } = useTranslation();
    const salePrice = financials?.selling_price || budget || 0;
    const supplierCost = financials?.supplier_cost || 0;
    const shippingAndCustoms = (financials?.shipping_cost || 0) + (financials?.customs_fee || 0);
    const otherExpenses = (financials?.additional_expense || 0) + 
        (financials?.cost_items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0);
    
    const totalCost = supplierCost + shippingAndCustoms + otherExpenses + commission;
    const netProfit = salePrice - totalCost;
    const margin = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    // Health configuration
    const getHealthColor = (m: number) => {
        if (m >= 35) return 'text-green-500';
        if (m >= 20) return 'text-amber-500';
        return 'text-red-500';
    };

    const getHealthBg = (m: number) => {
        if (m >= 35) return 'bg-green-500';
        if (m >= 20) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-card shimmer-luxury border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('projectFinancialDashboard.kpiNetMargin')}</span>
                            <div className={`p-2 rounded-full ${getHealthBg(margin)}/10 ${getHealthColor(margin)}`}>
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className={`text-2xl font-serif ${getHealthColor(margin)}`}>
                            {margin.toFixed(1)}%
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{t('projectFinancialDashboard.marginTargetHint')}</p>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('projectFinancialDashboard.kpiNetProfit')}</span>
                            <div className="p-2 rounded-full bg-luxury-gold/10 text-luxury-gold">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-serif text-white/90">
                            {formatCurrency(netProfit)}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{t('projectFinancialDashboard.netProfitSub')}</p>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('projectFinancialDashboard.kpiRoi')}</span>
                            <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
                                <PieChart className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-serif text-blue-400">
                            {roi.toFixed(1)}%
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{t('projectFinancialDashboard.roiSub')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Visual Breakdown */}
            <Card className="glass-card border-none overflow-visible">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-serif text-luxury-gold flex items-center gap-2">
                        <PieChart className="w-4 h-4" /> {t('projectFinancialDashboard.costStructureTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase tracking-tighter text-muted-foreground mb-1">
                            <span>{t('projectFinancialDashboard.linearSplit')}</span>
                            <span>{t('projectFinancialDashboard.linearSplitTotal', { amount: formatCurrency(salePrice) })}</span>
                        </div>
                        <div className="h-4 w-full bg-zinc-800 rounded-full flex overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-red-500/80 transition-all duration-1000" 
                                style={{ width: `${(supplierCost / salePrice) * 100}%` }}
                                title={t('projectFinancialDashboard.tooltipSupplier', { amount: formatCurrency(supplierCost) })}
                            />
                            <div 
                                className="h-full bg-orange-500/80 border-l border-black/20 transition-all duration-1000" 
                                style={{ width: `${(shippingAndCustoms / salePrice) * 100}%` }}
                                title={t('projectFinancialDashboard.tooltipLogistics', { amount: formatCurrency(shippingAndCustoms) })}
                            />
                            <div 
                                className="h-full bg-yellow-500/80 border-l border-black/20 transition-all duration-1000" 
                                style={{ width: `${(otherExpenses / salePrice) * 100}%` }}
                                title={t('projectFinancialDashboard.tooltipOther', { amount: formatCurrency(otherExpenses) })}
                            />
                            <div 
                                className="h-full bg-purple-500/80 border-l border-black/20 transition-all duration-1000" 
                                style={{ width: `${(commission / salePrice) * 100}%` }}
                                title={t('projectFinancialDashboard.tooltipCommission', { amount: formatCurrency(commission) })}
                            />
                            <div 
                                className="h-full bg-green-500/80 border-l border-black/20 transition-all duration-1000" 
                                style={{ width: `${(netProfit / salePrice) * 100}%` }}
                                title={t('projectFinancialDashboard.tooltipProfit', { amount: formatCurrency(netProfit) })}
                            />
                        </div>
                        <div className="flex flex-wrap gap-4 mt-4">
                            <LegendItem color="bg-red-500" label={t('projectFinancialDashboard.legendSupplier')} value={supplierCost} />
                            <LegendItem color="bg-orange-500" label={t('projectFinancialDashboard.legendLogistics')} value={shippingAndCustoms} />
                            <LegendItem color="bg-yellow-500" label={t('projectFinancialDashboard.legendOther')} value={otherExpenses} />
                            <LegendItem color="bg-purple-500" label={t('projectFinancialDashboard.legendCommission')} value={commission} />
                            <LegendItem color="bg-green-500" label={t('projectFinancialDashboard.legendProfit')} value={netProfit} />
                        </div>
                    </div>

                    {margin < 20 && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-pulse-slow">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                            <div>
                                <h4 className="text-xs font-bold text-red-400">{t('projectFinancialDashboard.lowMarginTitle')}</h4>
                                <p className="text-[10px] text-red-300/80 leading-relaxed">
                                    {t('projectFinancialDashboard.lowMarginDesc')}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const LegendItem = ({ color, label, value }: { color: string, label: string, value: number }) => (
    <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-[10px] text-muted-foreground">{label}: <span className="text-white/80">{formatCurrency(value)}</span></span>
    </div>
);
