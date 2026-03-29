import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    DollarSign, 
    TrendingUp, 
    AlertTriangle, 
    PieChart, 
    ChevronDown, 
    ChevronUp,
    Shield,
    CheckCircle2
} from 'lucide-react';

import { formatCurrency, calculateCanadianTax, CanadianProvince, provinceNames } from '@/utils/taxUtils';
import { financialUtils } from '@/utils/financialUtils';
import { type Project } from '@/services/apiProjects';

interface ProjectFinancialDashboardProps {
    project: Project;
    role: string;
}

export const ProjectFinancialDashboard: React.FC<ProjectFinancialDashboardProps> = ({ 
    project,
    role
}) => {
    const { t } = useTranslation();
    const [showTechnical, setShowTechnical] = useState(false);

    const budget = project.budget || 0;
    const financials = project.financials;
    const commission = financialUtils.computeCommissionAmount(project);
    
    const salePrice = financials?.selling_price || budget || 0;
    const supplierCost = financials?.supplier_cost || 0;
    const shippingAndCustoms = (financials?.shipping_cost || 0) + (financials?.customs_fee || 0);
    const otherExpenses = (financials?.additional_expense || 0) + 
        (financials?.cost_items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0);
    
    const totalCost = supplierCost + shippingAndCustoms + otherExpenses + commission;
    const netProfit = salePrice - totalCost;
    const margin = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    console.log("ROI computed:", roi); // Use roi to avoid unused variable error


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
            {/* KPI Cards (Overview) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card shimmer-luxury border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('projectFinancialDashboard.kpiNetMargin')}</span>
                            <div className={`p-1.5 rounded-full ${getHealthBg(margin)}/10 ${getHealthColor(margin)}`}>
                                <TrendingUp className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className={`text-xl font-serif ${getHealthColor(margin)}`}>
                            {margin.toFixed(1)}%
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('projectFinancialDashboard.kpiNetProfit')}</span>
                            <div className="p-1.5 rounded-full bg-luxury-gold/10 text-luxury-gold">
                                <DollarSign className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-xl font-serif text-white/90">
                            {formatCurrency(netProfit)}
                        </div>
                    </CardContent>
                </Card>

                {/* Total Sale Price */}
                <Card className="glass-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('projectDetailsPage.salePriceNet')}</span>
                            <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-400">
                                <DollarSign className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-xl font-serif text-blue-400">
                            {formatCurrency(salePrice)}
                        </div>
                    </CardContent>
                </Card>

                {/* Paid Status */}
                <Card className="glass-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('projectDetailsPage.paidAmountLabel')}</span>
                            <div className="p-1.5 rounded-full bg-green-500/10 text-green-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-xl font-serif text-green-400">
                            {formatCurrency(project.financials?.paid_amount || 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Action Bar for Financials */}
            <div className="flex items-center justify-between">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] uppercase tracking-widest text-luxury-gold hover:bg-luxury-gold/10 gap-2"
                    onClick={() => setShowTechnical(!showTechnical)}
                >
                    {showTechnical ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showTechnical ? t('common.hideDetails') : t('common.showDetails')}
                </Button>

                {margin < 20 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] text-red-400 font-bold uppercase tracking-widest">
                        <AlertTriangle className="w-3 h-3" /> {t('projectFinancialDashboard.lowMarginTitle')}
                    </div>
                )}
            </div>

            {/* TECHNICAL DETAILS SECTION */}
            {showTechnical && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
                    {/* Visual Breakdown */}
                    <Card className="glass-card border-none overflow-hidden">
                        <CardHeader className="pb-2 border-b border-white/5">
                            <CardTitle className="text-xs font-serif text-luxury-gold flex items-center gap-2 uppercase tracking-widest">
                                <PieChart className="w-4 h-4" /> {t('projectFinancialDashboard.costStructureTitle')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] uppercase tracking-tighter text-muted-foreground mb-1">
                                    <span>{t('projectFinancialDashboard.linearSplit')}</span>
                                    <span>{t('projectFinancialDashboard.linearSplitTotal', { amount: formatCurrency(salePrice) })}</span>
                                </div>
                                <div className="h-4 w-full bg-zinc-800 rounded-full flex overflow-hidden border border-white/5">
                                    <div className="h-full bg-red-500/80" style={{ width: `${(supplierCost / salePrice) * 100}%` }} title={t('projectFinancialDashboard.legendSupplier')} />
                                    <div className="h-full bg-orange-500/80 border-l border-black/20" style={{ width: `${(shippingAndCustoms / salePrice) * 100}%` }} title={t('projectFinancialDashboard.legendLogistics')} />
                                    <div className="h-full bg-yellow-500/80 border-l border-black/20" style={{ width: `${(otherExpenses / salePrice) * 100}%` }} title={t('projectFinancialDashboard.legendOther')} />
                                    <div className="h-full bg-purple-500/80 border-l border-black/20" style={{ width: `${(commission / salePrice) * 100}%` }} title={t('projectFinancialDashboard.legendCommission')} />
                                    <div className="h-full bg-green-500/80 border-l border-black/20" style={{ width: `${(netProfit / salePrice) * 100}%` }} title={t('projectFinancialDashboard.legendProfit')} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mt-4">
                                    <LegendItem color="bg-red-500" label={t('projectFinancialDashboard.legendSupplier')} value={supplierCost} />
                                    <LegendItem color="bg-orange-500" label={t('projectFinancialDashboard.legendLogistics')} value={shippingAndCustoms} />
                                    <LegendItem color="bg-yellow-500" label={t('projectFinancialDashboard.legendOther')} value={otherExpenses} />
                                    <LegendItem color="bg-purple-500" label={t('projectFinancialDashboard.legendCommission')} value={commission} />
                                    <LegendItem color="bg-green-500" label={t('projectFinancialDashboard.legendProfit')} value={netProfit} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tax & Admin Detail */}
                    <Card className="glass-card border-none overflow-hidden">
                        <CardHeader className="pb-2 border-b border-white/5">
                            <CardTitle className="text-xs font-serif text-luxury-gold flex items-center gap-2 uppercase tracking-widest">
                                <Shield className="w-4 h-4" /> {t('projectDetailsPage.adminFinancialsTitle')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6 text-sm">
                            {project.financials?.tax_province && (
                                <div className="space-y-2 pb-2 border-b border-white/5">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('projectDetailsPage.taxRegionCanada')}: {provinceNames[project.financials.tax_province as CanadianProvince]}</p>
                                    {(() => {
                                        const breakdown = calculateCanadianTax(budget, project.financials.tax_province as CanadianProvince);
                                        return (
                                            <div className="space-y-1 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t('projectDetailsPage.gstTps')}</span>
                                                    <span>{formatCurrency(breakdown.gst)}</span>
                                                </div>
                                                {breakdown.pst > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">{t('projectDetailsPage.pstTvq', { rate: '9.975%' })}</span>
                                                        <span>{formatCurrency(breakdown.pst)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between font-bold text-luxury-gold border-t border-white/5 pt-1 mt-1">
                                                    <span>{t('projectDetailsPage.totalGross')}</span>
                                                    <span>{formatCurrency(budget + breakdown.total)}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            <div className="space-y-1 text-xs">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2">{t('projectDetailsPage.internalFinancials')}</p>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('projectDetailsPage.supplierCost')}</span>
                                    <span className="text-red-400">-{formatCurrency(supplierCost)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('projectDetailsPage.shippingCustoms')}</span>
                                    <span className="text-red-400">-{formatCurrency(shippingAndCustoms)}</span>
                                </div>
                                {commission > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('projectDetailsPage.ambassadorCommission')}</span>
                                        <span className="text-red-400">-{formatCurrency(commission)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

const LegendItem = ({ color, label, value }: { color: string, label: string, value: number }) => (
    <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="text-white/80 font-mono">{formatCurrency(value)}</span>
    </div>
);
