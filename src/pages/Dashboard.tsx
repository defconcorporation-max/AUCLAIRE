import { Project } from '@/services/apiProjects';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiProjects } from '@/services/apiProjects';
import { apiInvoices } from '@/services/apiInvoices';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RecentActivityList } from "@/components/RecentActivityList";
import { RevenueChart } from "@/components/RevenueChart";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { apiExpenses } from '@/services/apiExpenses';
import { apiUsers } from '@/services/apiUsers';
import { apiActivities } from '@/services/apiActivities';

// New Modular Components
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { HealthAuditorWidget } from '@/components/dashboard/HealthAuditorWidget';
import { ProjectPipeline } from '@/components/dashboard/ProjectPipeline';
import { AmbassadorLeaderboard } from '@/components/dashboard/AmbassadorLeaderboard';
import { DesignReviewWidget } from '@/components/dashboard/DesignReviewWidget';
import { CashRiskTracker } from '@/components/dashboard/CashRiskTracker';
import { TimeBasedStats } from '@/components/dashboard/TimeBasedStats';
import { ManufacturerDashboard } from '@/components/dashboard/ManufacturerDashboard';

export default function Dashboard() {
    const { profile, role } = useAuth();
    const navigate = useNavigate();

    // Redirect clients to their portal
    useEffect(() => {
        if (role === 'client') {
            navigate('/dashboard/my-portal', { replace: true });
        }
    }, [role, navigate]);

    // Data Fetching
    const { data: projects, isLoading: projectsLoading, error: projectsError } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll
    });

    const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll
    });

    const { data: expenses, isLoading: expensesLoading, error: expensesError } = useQuery({
        queryKey: ['expenses'],
        queryFn: apiExpenses.getAll
    });

    const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
        queryKey: ['users'],
        queryFn: apiUsers.getAll
    });

    const { data: activities, isLoading: activitiesLoading } = useQuery({
        queryKey: ['activities'],
        queryFn: apiActivities.getAll
    });

    if (projectsLoading || invoicesLoading || expensesLoading || usersLoading || activitiesLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
            </div>
        );
    }

    const hasError = projectsError || invoicesError || expensesError || usersError || !projects || !invoices || !expenses;
    if (hasError) {
        return (
            <div className="p-8 glass-card border-red-500/20 text-red-500 text-center">
                <h2 className="text-xl font-serif mb-2">Erreur de Chargement</h2>
                <p className="text-sm opacity-70">Impossible de récupérer les données du tableau de bord.</p>
            </div>
        );
    }

    // Role-based filtering
    const filteredProjects = projects?.filter(p => {
        if (role === 'admin' || role === 'secretary') return true;
        if (role === 'manufacturer') return (p as any).manufacturer_id === profile?.id;
        if (role === 'affiliate') return p.sales_agent_id === profile?.id || p.affiliate_id === profile?.id;
        return false;
    }) || [];

    const projectIds = new Set(filteredProjects.map(p => p.id));
    const filteredInvoices = invoices?.filter(i => projectIds.has(i.project_id)) || [];
    const filteredExpenses = (role === 'admin' || role === 'secretary') ? expenses : [];

    // Sorting Helper
    const sortByRush = (a: Project, b: Project) => {
        if (a.priority === 'rush' && b.priority !== 'rush') return -1;
        if (a.priority !== 'rush' && b.priority === 'rush') return 1;
        return 0;
    };

    // Pipeline Data
    const manufacturerDesignRequests = filteredProjects.filter(p => p.status === 'design_modification' || p.status === '3d_model').sort(sortByRush);
    const manufacturerPendingProduction = filteredProjects.filter(p => p.status === 'approved_for_production').sort(sortByRush);
    const manufacturerOngoingProduction = filteredProjects.filter(p => p.status === 'production').sort(sortByRush);
    const manufacturerInDelivery = filteredProjects.filter(p => p.status === 'delivery').sort(sortByRush);
    const adminDesignReady = filteredProjects.filter(p => p.status === 'design_ready' || p.status === 'waiting_for_approval');

    // Financial Logic
    const getSalePrice = (p: Project) => Number(p.financials?.selling_price || p.budget || 0);
    const getCommissionEstimate = (p: Project) => {
        if (!p.affiliate_id && !p.sales_agent_id) return 0;
        if (p.affiliate_commission_type === 'fixed') return Number(p.affiliate_commission_rate || 0);
        return (getSalePrice(p) * Number(p.affiliate_commission_rate || 0)) / 100;
    };

    const PRODUCTION_READY_STATUSES = ['approved_for_production', 'production', 'delivery', 'completed'];
    const isProjectASale = (p: Project) => PRODUCTION_READY_STATUSES.includes(p.status) || filteredInvoices.some(i => i.project_id === p.id);

    const totalProjectValue = filteredProjects.filter(isProjectASale).reduce((sum, p) => sum + getSalePrice(p), 0);
    const totalCollected = filteredInvoices.reduce((sum, i) => sum + ((i.amount_paid && i.amount_paid > 0) ? i.amount_paid : (i.status === 'paid' ? i.amount : 0)), 0);
    const totalPending = filteredInvoices.reduce((sum, i) => sum + Math.max(0, i.amount - ((i.amount_paid && i.amount_paid > 0) ? i.amount_paid : (i.status === 'paid' ? i.amount : 0))), 0);
    const totalRealExpenses = (filteredExpenses as any[])?.filter(e => e.status !== 'cancelled').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const totalPendingCommissions = filteredProjects.reduce((sum, p) => p.financials?.commission_exported_to_expenses ? sum : sum + getCommissionEstimate(p), 0);
    const totalProductionCost = filteredProjects.reduce((sum, p) => {
        if (!['production', 'delivery', 'completed'].includes(p.status) || p.financials?.exported_to_expenses) return sum;
        const dynamicCosts = p.financials?.cost_items?.reduce((itemSum, item) => itemSum + (Number(item.amount) || 0), 0) || 0;
        return sum + Number(p.financials?.supplier_cost || 0) + Number(p.financials?.shipping_cost || 0) + Number(p.financials?.customs_fee || 0) + dynamicCosts;
    }, 0);

    const totalProfit = totalCollected - totalRealExpenses;
    const projectedProfit = totalProjectValue - totalRealExpenses - totalProductionCost - totalPendingCommissions;

    // Risk & Pipeline
    const highRiskProjects: any[] = [];
    let expectedCashPipeline = 0;
    filteredProjects.forEach(p => {
        if (p.status === 'cancelled') return;
        const price = getSalePrice(p);
        const collected = filteredInvoices.filter(i => i.project_id === p.id).reduce((s, i) => s + (i.amount_paid || (i.status === 'paid' ? i.amount : 0)), 0);
        const dynamicCosts = p.financials?.cost_items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
        const totalCosts = Number(p.financials?.supplier_cost || 0) + Number(p.financials?.shipping_cost || 0) + Number(p.financials?.customs_fee || 0) + dynamicCosts + getCommissionEstimate(p);
        const remainingToCollect = price - collected;
        let prob = 0;
        if (p.status === 'completed') prob = 1;
        else if (['production', 'delivery'].includes(p.status)) prob = 0.95;
        else if (p.status === 'approved_for_production') prob = 0.9;
        else if (p.status === '3d_model') prob = 0.7;
        else if (p.status === 'inquiring') prob = 0.2;
        else prob = 0.5;
        expectedCashPipeline += remainingToCollect * prob;
        if (['approved_for_production', 'production', 'delivery'].includes(p.status) && totalCosts > collected) {
            highRiskProjects.push({ project: p, deficit: totalCosts - collected, committed: totalCosts, deposited: collected });
        }
    });

    // Stats calculations
    const getStatsForPeriod = (days: number) => {
        const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const periodProjects = filteredProjects.filter(p => new Date(p.created_at) >= threshold);
        const periodInvoices = filteredInvoices.filter(i => new Date(i.created_at) >= threshold);
        return {
            count: periodProjects.length,
            volume: periodProjects.reduce((s, p) => s + getSalePrice(p), 0),
            collected: periodInvoices.reduce((s, i) => s + (i.amount_paid || (i.status === 'paid' ? i.amount : 0)), 0)
        };
    };

    const statsData = {
        today: getStatsForPeriod(1),
        week: getStatsForPeriod(7),
        month: getStatsForPeriod(30)
    };

    // Leaderboard
    const sellerStats: Record<string, { id: string, name: string, volume: number, projectCount: number, profit: number, totalSalePrice: number }> = {};
    filteredProjects.filter(isProjectASale).forEach(p => {
        const seller = p.sales_agent || p.affiliate || { id: 'direct', full_name: 'Vente Directe' };
        if (!sellerStats[seller.id]) sellerStats[seller.id] = { id: seller.id, name: seller.full_name, volume: 0, projectCount: 0, profit: 0, totalSalePrice: 0 };
        const price = getSalePrice(p);
        const dynamicCosts = p.financials?.cost_items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
        const totalCosts = Number(p.financials?.supplier_cost || 0) + Number(p.financials?.shipping_cost || 0) + Number(p.financials?.customs_fee || 0) + dynamicCosts + getCommissionEstimate(p);
        sellerStats[seller.id].volume += price;
        sellerStats[seller.id].projectCount++;
        sellerStats[seller.id].profit += (price - totalCosts);
        sellerStats[seller.id].totalSalePrice += price;
    });

    const leaderboard = Object.values(sellerStats)
        .map(s => ({ ...s, marginPercent: s.totalSalePrice > 0 ? (s.profit / s.totalSalePrice) * 100 : 0 }))
        .sort((a, b) => b.volume - a.volume);

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-4xl font-serif text-luxury-gradient tracking-tight mb-2">Tableau de Bord</h1>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                        Bienvenue, <span className="text-foreground">{profile?.full_name}</span> • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </motion.div>
            </div>

            {/* ADMIN / SECRETARY VIEW */}
            {(role === 'admin' || role === 'secretary') && (
                <div className="space-y-8">
                    <DashboardStats 
                        totalCollected={totalCollected} 
                        totalPending={totalPending} 
                        totalProfit={totalProfit}
                        projectedProfit={projectedProfit}
                        expectedCashPipeline={expectedCashPipeline}
                        totalCommissions={totalPendingCommissions}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <HealthAuditorWidget projects={filteredProjects} activities={activities || []} />
                            <ProjectPipeline 
                                design={manufacturerDesignRequests} 
                                pending={manufacturerPendingProduction}
                                ongoing={manufacturerOngoingProduction}
                                delivery={manufacturerInDelivery}
                                role={role}
                            />
                        </div>
                        <div className="space-y-6">
                            <DesignReviewWidget projects={adminDesignReady} />
                            <AmbassadorLeaderboard leaderboard={leaderboard} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <CashRiskTracker highRiskProjects={highRiskProjects} />
                        <TimeBasedStats stats={statsData} />
                    </div>
                </div>
            )}

            {/* MANUFACTURER VIEW */}
            {role === 'manufacturer' && (
                <ManufacturerDashboard projects={filteredProjects} />
            )}

            {/* AFFILIATE VIEW (Shared logic with Admin but simplified UI) */}
            {role === 'affiliate' && (
                <div className="space-y-8">
                    <DashboardStats 
                        totalCollected={totalCollected} 
                        totalPending={totalPending} 
                        totalProfit={totalProfit}
                        projectedProfit={projectedProfit}
                        expectedCashPipeline={expectedCashPipeline}
                        totalCommissions={totalPendingCommissions}
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                             <ProjectPipeline 
                                design={manufacturerDesignRequests} 
                                pending={manufacturerPendingProduction}
                                ongoing={manufacturerOngoingProduction}
                                delivery={manufacturerInDelivery}
                                role={role}
                            />
                        </div>
                        <div>
                            <TimeBasedStats stats={statsData} />
                        </div>
                    </div>
                </div>
            )}

            {/* Global Insights Section (Charts & Activity) */}
            {(role === 'admin' || role === 'secretary' || role === 'affiliate') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 glass-card">
                        <CardHeader>
                            <CardTitle className="font-serif text-lg">Aperçu des Revenus</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <RevenueChart />
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="font-serif text-lg">Activité Récente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RecentActivityList />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
