import { Project } from '@/services/apiProjects';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiProjects } from '@/services/apiProjects';
import { apiInvoices } from '@/services/apiInvoices';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { RecentActivityList } from "@/components/RecentActivityList";
import { RevenueChart } from "@/components/RevenueChart";
import { Link, useNavigate } from 'react-router-dom';

import {
    Activity, TrendingUp,
    AlertCircle, Clock, BarChart3,
    Briefcase, Package, Banknote, Trophy, CalendarDays, ChevronDown, ChevronRight
} from 'lucide-react';

import { apiExpenses } from '@/services/apiExpenses';
import { apiUsers, UserProfile } from '@/services/apiUsers';
import { apiActivities, ActivityLog } from '@/services/apiActivities';

interface HealthAlert {
    id: string;
    projectId: string;
    projectTitle: string;
    type: 'delay' | 'margin';
    severity: 'warning' | 'danger';
    message: string;
}

function ProjectHealthAuditor({ projects, activities }: { projects: Project[], activities: ActivityLog[] }) {
    const alerts: HealthAlert[] = [];

    // 1. Calculate Average Velocity per status from logs
    const statusLogs = activities.filter(a => a.action === 'status_change');
    const velocityData: Record<string, { totalDays: number, count: number }> = {};
    const logsByProject: Record<string, any[]> = {};

    statusLogs.forEach(log => {
        if (log.project_id) {
            if (!logsByProject[log.project_id]) logsByProject[log.project_id] = [];
            logsByProject[log.project_id].push(log);
        }
    });

    Object.values(logsByProject).forEach(logs => {
        const sorted = logs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        for (let i = 0; i < sorted.length - 1; i++) {
            const start = new Date(sorted[i].created_at);
            const end = new Date(sorted[i + 1].created_at);
            const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
            const status = sorted[i].details.toLowerCase().split('to ')[1];
            if (status) {
                if (!velocityData[status]) velocityData[status] = { totalDays: 0, count: 0 };
                velocityData[status].totalDays += days;
                velocityData[status].count++;
            }
        }
    });

    const avgVelocity: Record<string, number> = {};
    Object.entries(velocityData).forEach(([status, data]) => {
        avgVelocity[status] = data.totalDays / data.count;
    });

    // 2. Scan Projects for health issues
    projects.forEach(p => {
        if (p.status === 'completed' || p.status === 'cancelled' || p.status === 'waiting_for_approval') return;

        // --- Delay Detection ---
        const pLogs = logsByProject[p.id] || [];
        const lastLog = pLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        const lastChangeDate = lastLog ? new Date(lastLog.created_at) : new Date(p.created_at);
        const daysInStatus = (Date.now() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24);

        let warnThreshold = 0;
        let dangerThreshold = 0;

        // Specific thresholds from user business rules
        if (p.status === 'production') {
            warnThreshold = 10;
            dangerThreshold = 20;
        } else if (p.status === '3d_model' || p.status === 'designing') {
            warnThreshold = 1; // 24h
            dangerThreshold = 2; // 48h
        } else {
            // Fallback to average velocity logic
            const statusLower = p.status.toLowerCase().replace(/_/g, ' ');
            const avg = avgVelocity[statusLower] || 5;
            warnThreshold = avg * 1.5;
            dangerThreshold = avg * 3;
        }

        if (daysInStatus > dangerThreshold) {
            alerts.push({
                id: `delay-danger-${p.id}`,
                projectId: p.id,
                projectTitle: p.title,
                type: 'delay',
                severity: 'danger',
                message: `Stuck for ${Math.round(daysInStatus)} days (Limit: ${Math.round(dangerThreshold)})`
            });
        } else if (daysInStatus > warnThreshold) {
            alerts.push({
                id: `delay-warn-${p.id}`,
                projectId: p.id,
                projectTitle: p.title,
                type: 'delay',
                severity: 'warning',
                message: `Slow progress (${Math.round(daysInStatus)} days)`
            });
        }

        // --- Margin Detection ---
        const price = Number(p.financials?.selling_price || p.budget || 0);
        const dynamicCosts = p.financials?.cost_items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
        const totalCosts = Number(p.financials?.supplier_cost || 0) + 
                          Number(p.financials?.shipping_cost || 0) + 
                          Number(p.financials?.customs_fee || 0) + 
                          dynamicCosts;

        if (price > 0) {
            const margin = (price - totalCosts) / price;
            if (margin < 0.10 && totalCosts > 0) {
                alerts.push({
                    id: `margin-danger-${p.id}`,
                    projectId: p.id,
                    projectTitle: p.title,
                    type: 'margin',
                    severity: 'danger',
                    message: `Critical Margin: ${Math.round(margin * 100)}%`
                });
            } else if (margin < 0.20 && totalCosts > 0) {
                alerts.push({
                    id: `margin-warn-${p.id}`,
                    projectId: p.id,
                    projectTitle: p.title,
                    type: 'margin',
                    severity: 'warning',
                    message: `Low Margin: ${Math.round(margin * 100)}%`
                });
            }
        }
    });

    if (alerts.length === 0) return null;

    return (
        <Card className="border-luxury-gold/20 bg-luxury-gold/5 backdrop-blur-md shadow-xl overflow-hidden">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-luxury-gold/10">
                <CardTitle className="text-sm font-serif tracking-widest text-luxury-gold flex items-center gap-2">
                    <Activity className="w-4 h-4" /> PROJECT HEALTH AUDITOR
                </CardTitle>
                <div className="flex gap-2">
                    <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-sm font-semibold transition-colors uppercase tracking-tighter border-red-500/50 text-red-500 bg-transparent">
                        {alerts.filter(a => a.severity === 'danger').length} Critical
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-h-[200px] overflow-y-auto">
                    {alerts.sort((a, _) => a.severity === 'danger' ? -1 : 1).map(alert => (

                        <Link 
                            key={alert.id} 
                            to={`/dashboard/projects/${alert.projectId}`}
                            className={`flex items-start gap-3 p-3 border-b border-black/5 dark:border-white/5 hover:bg-black/5 transition-colors group ${alert.severity === 'danger' ? 'bg-red-500/5' : ''}`}
                        >
                            <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.severity === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
                            <div>
                                <p className="text-[13px] font-serif group-hover:text-luxury-gold transition-colors truncate max-w-[150px]">{alert.projectTitle}</p>
                                <p className={`text-sm mb-1 line-clamp-1 font-medium leading-tight ${alert.severity === 'danger' ? 'text-red-600' : 'text-amber-600'}`}>{alert.message}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

interface ManufacturerDashboardProps {
    manufacturer: UserProfile;
    projects: Project[];
    role: string;
}

function ManufacturerDashboardSection({ manufacturer, projects, role }: ManufacturerDashboardProps) {

    const [open, setOpen] = useState(role === 'manufacturer');

    const sortByRush = (a: Project, b: Project) => {
        if (a.priority === 'rush' && b.priority !== 'rush') return -1;
        if (a.priority !== 'rush' && b.priority === 'rush') return 1;
        return 0;
    };

    const mDesignRequests = projects.filter(p => p.status === 'design_modification' || p.status === '3d_model').sort(sortByRush);
    const mPendingProduction = projects.filter(p => p.status === 'approved_for_production').sort(sortByRush);
    const mOngoingProduction = projects.filter(p => p.status === 'production').sort(sortByRush);
    const mInDelivery = projects.filter(p => p.status === 'delivery').sort(sortByRush);
    const mCompleted = projects.filter(p => p.status === 'completed');

    return (
        <Card className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl overflow-hidden">
            <CardHeader
                className={`py-3 px-4 flex flex-row items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${open ? 'border-b border-black/5 dark:border-white/5' : ''}`}
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold font-bold text-sm">
                        {manufacturer.full_name.charAt(0)}
                    </div>
                    <div>
                        <CardTitle className="text-base font-serif">{manufacturer.full_name}</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-widest">Manufacturer • {projects.length} Projects</CardDescription>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex gap-3 text-center">
                        <div>
                            <div className="text-xs font-bold text-blue-500">{mDesignRequests.length}</div>
                            <div className="text-xs uppercase tracking-tighter text-muted-foreground">Design</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-green-500">{mPendingProduction.length}</div>
                            <div className="text-xs uppercase tracking-tighter text-muted-foreground">Pending</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-purple-500">{mOngoingProduction.length}</div>
                            <div className="text-xs uppercase tracking-tighter text-muted-foreground">Production</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-amber-500">{mInDelivery.length}</div>
                            <div className="text-xs uppercase tracking-tighter text-muted-foreground">Delivery</div>
                        </div>
                    </div>
                    {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
            </CardHeader>

            {open && (
                <CardContent className="pt-4 px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid gap-4">
                        <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
                            {/* KPI 1: Design Ready */}
                            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-blue-500/30 transition-colors duration-500 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 relative z-10">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-blue-500 transition-colors">Design Ready</CardTitle>
                                    <Clock className="h-3 w-3 text-blue-500/70" />
                                </CardHeader>
                                <CardContent className="relative z-10 pb-3 px-4">
                                    <div className="text-2xl font-serif text-black dark:text-white group-hover:text-blue-500 transition-colors duration-500">
                                        {mDesignRequests.length}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">À Démarrer</p>
                                </CardContent>
                            </Card>

                            {/* KPI 2: Ongoing Production */}
                            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-purple-500/30 transition-colors duration-500 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 relative z-10">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-purple-500 transition-colors">En Cours</CardTitle>
                                    <TrendingUp className="h-3 w-3 text-purple-500/70" />
                                </CardHeader>
                                <CardContent className="relative z-10 pb-3 px-4">
                                    <div className="text-2xl font-serif text-black dark:text-white group-hover:text-purple-500 transition-colors duration-500">
                                        {mOngoingProduction.length}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">En Fabrication</p>
                                </CardContent>
                            </Card>

                            {/* KPI 3: Completed Projects */}
                            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-green-500/30 transition-colors duration-500 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 relative z-10">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-green-500 transition-colors">Total Fabriqué</CardTitle>
                                    <Briefcase className="h-3 w-3 text-green-500/70" />
                                </CardHeader>
                                <CardContent className="relative z-10 pb-3 px-4">
                                    <div className="text-2xl font-serif text-black dark:text-white group-hover:text-green-500 transition-colors duration-500">
                                        {mCompleted.length}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">Achevés</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {/* 1. DESIGN REQUESTS */}
                            <Card className="border-l-4 border-l-blue-500 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl">
                                <CardHeader className="py-3 px-4">
                                    <CardTitle className="flex items-center gap-1.5 font-serif text-xs">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        Design Requests
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-3">
                                    {mDesignRequests.length === 0 ? (
                                        <p className="text-sm text-muted-foreground p-2 text-center border border-dashed rounded-lg">No designs.</p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {mDesignRequests.map(project => (
                                                <div key={project.id} className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 group">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <Link to={`/dashboard/projects/${project.id}`} className="font-serif text-sm mb-1 line-clamp-1 truncate flex-1 hover:text-blue-500 transition-colors">
                                                            {project.title}
                                                        </Link>
                                                        {project.priority === 'rush' && <div className="h-3 text-sm px-1 bg-red-500 text-white rounded-full flex items-center font-bold uppercase tracking-tighter">RUSH</div>}
                                                    </div>
                                                    <div className="text-xs text-gray-500 uppercase tracking-tighter flex justify-between">
                                                        <span>{project.status.replace('_', ' ')}</span>
                                                        {(role === 'admin' || role === 'secretary') && project.affiliate && <span className="text-luxury-gold">Amb: {project.affiliate.full_name?.split(' ')[0]}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 2. PENDING PRODUCTION */}
                            <Card className="border-l-4 border-l-green-500 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl">
                                <CardHeader className="py-3 px-4">
                                    <CardTitle className="flex items-center gap-1.5 font-serif text-xs">
                                        <AlertCircle className="w-4 h-4 text-green-500" />
                                        Pending Prod
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-3">
                                    {mPendingProduction.length === 0 ? (
                                        <p className="text-sm text-muted-foreground p-2 text-center border border-dashed rounded-lg">No pending.</p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {mPendingProduction.map(project => (
                                                <div key={project.id} className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 group">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <Link to={`/dashboard/projects/${project.id}`} className="font-serif text-sm mb-1 line-clamp-1 truncate flex-1 hover:text-green-500 transition-colors">
                                                            {project.title}
                                                        </Link>
                                                        {project.priority === 'rush' && <div className="h-3 text-sm px-1 bg-red-500 text-white rounded-full flex items-center font-bold uppercase tracking-tighter">RUSH</div>}
                                                    </div>
                                                    <div className="text-xs text-gray-500 uppercase tracking-tighter flex justify-between">
                                                        <span>Ready for Prod</span>
                                                        {(role === 'admin' || role === 'secretary') && project.affiliate && <span className="text-luxury-gold">Amb: {project.affiliate.full_name?.split(' ')[0]}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 3. ONGOING PRODUCTION */}
                            <Card className="border-l-4 border-l-purple-500 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl">
                                <CardHeader className="py-3 px-4">
                                    <CardTitle className="flex items-center gap-1.5 font-serif text-xs">
                                        <TrendingUp className="w-4 h-4 text-purple-500" />
                                        Ongoing
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-3">
                                    {mOngoingProduction.length === 0 ? (
                                        <p className="text-sm text-muted-foreground p-2 text-center border border-dashed rounded-lg">No ongoing.</p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {mOngoingProduction.map(project => (
                                                <div key={project.id} className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 group">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <Link to={`/dashboard/projects/${project.id}`} className="font-serif text-sm mb-1 line-clamp-1 truncate flex-1 hover:text-purple-500 transition-colors">
                                                            {project.title}
                                                        </Link>
                                                        {project.priority === 'rush' && <div className="h-3 text-sm px-1 bg-red-500 text-white rounded-full flex items-center font-bold uppercase tracking-tighter">RUSH</div>}
                                                    </div>
                                                    <div className="text-xs text-gray-500 uppercase tracking-tighter flex justify-between">
                                                        <span>In Fabrication</span>
                                                        {(role === 'admin' || role === 'secretary') && project.affiliate && <span className="text-luxury-gold">Amb: {project.affiliate.full_name?.split(' ')[0]}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 4. IN DELIVERY */}
                            <Card className="border-l-4 border-l-amber-500 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl">
                                <CardHeader className="py-3 px-4">
                                    <CardTitle className="flex items-center gap-1.5 font-serif text-xs">
                                        <Package className="w-4 h-4 text-amber-500" />
                                        In Delivery
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-3">
                                    {mInDelivery.length === 0 ? (
                                        <p className="text-sm text-muted-foreground p-2 text-center border border-dashed rounded-lg">No delivery.</p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {mInDelivery.map(project => (
                                                <div key={project.id} className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 group">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <Link to={`/dashboard/projects/${project.id}`} className="font-serif text-sm mb-1 line-clamp-1 truncate flex-1 hover:text-amber-500 transition-colors">
                                                            {project.title}
                                                        </Link>
                                                        {project.priority === 'rush' && <div className="h-3 text-sm px-1 bg-red-500 text-white rounded-full flex items-center font-bold uppercase tracking-tighter">RUSH</div>}
                                                    </div>
                                                    <div className="text-xs text-gray-500 uppercase tracking-tighter flex justify-between">
                                                        <span>Finished</span>
                                                        {(role === 'admin' || role === 'secretary') && project.affiliate && <span className="text-luxury-gold">Amb: {project.affiliate.full_name?.split(' ')[0]}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

export default function Dashboard() {
    const { profile, role } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Redirect clients to their portal
    useEffect(() => {
        if (role === 'client') {
            navigate('/dashboard/my-portal', { replace: true });
        }
    }, [role, navigate]);

    // Fetch all projects
    const { data: projects, isLoading: projectsLoading, error: projectsError } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll
    });

    const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll
    });

    // NEW: Fetch all expenses to subtract from profit
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

    if (projectsLoading || invoicesLoading || expensesLoading || usersLoading || activitiesLoading) return <div>Loading dashboard...</div>;

    const hasError = projectsError || invoicesError || expensesError || usersError || !projects || !invoices || !expenses;

    if (hasError) {
        console.error("Dashboard Data Error:", projectsError, invoicesError, expensesError);
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline ml-2">Failed to load dashboard data. Please try again later.</span>
                {projectsError && <p className="text-sm">Projects Error: {projectsError.message}</p>}
                {invoicesError && <p className="text-sm">Invoices Error: {invoicesError.message}</p>}
                {expensesError && <p className="text-sm">Expenses Error: {expensesError.message}</p>}
            </div>
        );
    }

    const filteredProjects = projects?.filter(p => {
        if (role === 'admin' || role === 'secretary') return true;
        if (role === 'manufacturer') return (p as any).manufacturer_id === profile?.id;
        if (role === 'affiliate') {
            return p.sales_agent_id === profile?.id || p.affiliate_id === profile?.id;
        }
        return false;
    }) || [];

    const projectIds = new Set(filteredProjects.map(p => p.id));
    const filteredInvoices = invoices?.filter(i => projectIds.has(i.project_id)) || [];

    // Expenses are usually admin-only, but let's be safe
    const filteredExpenses = (role === 'admin' || role === 'secretary') ? expenses : [];

    const sortByRush = (a: Project, b: Project) => {
        if (a.priority === 'rush' && b.priority !== 'rush') return -1;
        if (a.priority !== 'rush' && b.priority === 'rush') return 1;
        return 0;
    };

    const manufacturerDesignRequests = filteredProjects.filter(p => p.status === 'design_modification' || p.status === '3d_model').sort(sortByRush);
    const manufacturerPendingProduction = filteredProjects.filter(p => p.status === 'approved_for_production').sort(sortByRush);
    const manufacturerOngoingProduction = filteredProjects.filter(p => p.status === 'production').sort(sortByRush);
    const manufacturerInDelivery = filteredProjects.filter(p => p.status === 'delivery').sort(sortByRush);
    const manufacturerCompleted = filteredProjects.filter(p => p.status === 'completed');
    const adminDesignReady = filteredProjects.filter(p => p.status === 'design_ready' || p.status === 'waiting_for_approval');
    const recentProjects = filteredProjects.slice(0, 5);

    // ─── Financial Source of Truth ──────────────────────────────────────────────
    // RULE: selling_price is the canonical sale price. budget is the legacy fallback.
    const getSalePrice = (p: Project) => Number(p.financials?.selling_price || p.budget || 0);

    // RULE: Commission for a project is estimated from its rate fields.
    //       Once exported to expenses, the expense row IS the real commission.
    const getCommissionEstimate = (p: Project) => {
        if (!p.affiliate_id && !p.sales_agent_id) return 0;
        if (p.affiliate_commission_type === 'fixed') return Number(p.affiliate_commission_rate || 0);
        return (getSalePrice(p) * Number(p.affiliate_commission_rate || 0)) / 100;
    };
    // ────────────────────────────────────────────────────────────────────────────

    // --- Refined Sales Detection Logic ---
    const PRODUCTION_READY_STATUSES = ['approved_for_production', 'production', 'delivery', 'completed'];
    
    // A project is a "Sale" if it's in production OR has an invoice
    const isProjectASale = (p: Project) => {
        if (PRODUCTION_READY_STATUSES.includes(p.status)) return true;
        const hasInvoice = filteredInvoices.some(i => i.project_id === p.id);
        return hasInvoice;
    };

    // Total Pipeline Value - Strictly projects from "Production Ready" or Invoiced
    const totalProjectValue = filteredProjects
        .filter(isProjectASale)
        .reduce((sum, p) => sum + getSalePrice(p), 0);

    // Collected: amount_paid is the exact field; if status=paid and amount_paid=0, use the full invoice amount.
    const totalCollected = filteredInvoices.reduce((sum, i) => {
        const paid = (i.amount_paid && i.amount_paid > 0) ? i.amount_paid : (i.status === 'paid' ? i.amount : 0);
        return sum + paid;
    }, 0);

    // Pending = invoice total minus what is already collected
    const totalPending = filteredInvoices.reduce((sum, i) => {
        const paid = (i.amount_paid && i.amount_paid > 0) ? i.amount_paid : (i.status === 'paid' ? i.amount : 0);
        return sum + Math.max(0, i.amount - paid);
    }, 0);

    // Real Expenses from the expenses table (all statuses except cancelled)
    // This already includes commissions that were exported.
    const totalRealExpenses = (filteredExpenses as any[])
        ?.filter(e => e.status !== 'cancelled')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    // Estimated Commissions (ONLY for projects NOT yet exported — these don't appear in expenses yet)
    const totalPendingCommissions = filteredProjects.reduce((sum, p) => {
        if (p.financials?.commission_exported_to_expenses) return sum; // already counted in totalRealExpenses
        return sum + getCommissionEstimate(p);
    }, 0);

    // Production Costs from project financials (only for projects NOT yet exported to expenses)
    const totalProductionCost = filteredProjects.reduce((sum, p) => {
        const COST_STATUSES = ['production', 'delivery', 'completed'];
        if (!COST_STATUSES.includes(p.status)) return sum;
        if (p.financials?.exported_to_expenses) return sum; // already in real expenses

        const dynamicCosts = p.financials?.cost_items?.reduce((itemSum, item) => itemSum + (Number(item.amount) || 0), 0) || 0;

        return sum +
            Number(p.financials?.supplier_cost || 0) +
            Number(p.financials?.shipping_cost || 0) +
            Number(p.financials?.customs_fee || 0) +
            dynamicCosts;
    }, 0);

    // ── Profit Calculations ───────────────────────────────────────────────────────
    // Actual Profit = Cash Collected - Real Expenses (already includes exported commissions)
    // We do NOT subtract pending commissions here since they aren't paid yet.
    const totalProfit = totalCollected - totalRealExpenses;

    // Projected Profit = Total Pipeline Value - All costs (real + production + pending commissions)
    const projectedProfit = totalProjectValue - totalRealExpenses - totalProductionCost - totalPendingCommissions;

    // Keep this alias for UI referencing totalCommissions
    const totalCommissions = totalPendingCommissions;

    // ─── Affiliate (Sales) Specific Calculations ──────────────────────────────────
    // The dashboard leaderboard shows ESTIMATED commissions (project rates, including pre-export).
    // The AffiliateDetails profile page shows ACTUAL commissions from expense rows.
    const sellerStats: Record<string, { id: string, name: string, projectCount: number, volume: number, commissions: number }> = {};
    if (users) {
        users.filter(u => u.role === 'affiliate' || u.role === 'admin').forEach(u => {
            sellerStats[u.id] = { id: u.id, name: u.full_name, projectCount: 0, volume: 0, commissions: 0 };
        });

        projects?.forEach(p => {
            if (!isProjectASale(p)) return;
            const responsibleId = p.sales_agent_id || p.affiliate_id;
            if (responsibleId && sellerStats[responsibleId]) {
                const salePrice = getSalePrice(p);
                const comRate = Number(p.affiliate_commission_rate || 0);
                const commission = p.affiliate_commission_type === 'fixed' ? comRate : (salePrice * comRate) / 100;
                sellerStats[responsibleId].projectCount++;
                sellerStats[responsibleId].volume += salePrice;
                sellerStats[responsibleId].commissions += commission;
            }
        });
    }

    const leaderboard = Object.values(sellerStats)
        .filter(s => s.projectCount > 0)
        .sort((a, b) => b.volume - a.volume);


    // Find current affiliate user's rank
    const myRankIndex = leaderboard.findIndex(s => s.id === profile?.id);
    const myRank = myRankIndex !== -1 ? myRankIndex + 1 : '-';
    const myStats = profile ? sellerStats[profile.id] : null;

    // ─── Time-Based Statistics ────────────────────────────────────────────────────
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Start of week (Monday)
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - distanceToMonday);

    // Start of Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const isToday = (dateStr: string) => new Date(dateStr) >= today;
    const isThisWeek = (dateStr: string) => new Date(dateStr) >= startOfWeek;
    const isThisMonth = (dateStr: string) => new Date(dateStr) >= startOfMonth;

    const stats = {
        today: { count: 0, volume: 0, collected: 0 },
        week: { count: 0, volume: 0, collected: 0 },
        month: { count: 0, volume: 0, collected: 0 }
    };

    filteredProjects.forEach(p => {
        if (!isProjectASale(p)) return;
        const val = getSalePrice(p);
        if (isToday(p.created_at)) { stats.today.count++; stats.today.volume += val; }
        if (isThisWeek(p.created_at)) { stats.week.count++; stats.week.volume += val; }
        if (isThisMonth(p.created_at)) { stats.month.count++; stats.month.volume += val; }
    });

    filteredInvoices.forEach(i => {
        // Use paid_at if available, otherwise created_at for recent payments gauge
        const dateStr = i.paid_at || i.created_at;
        const paidAmount = (i.amount_paid && i.amount_paid > 0) ? i.amount_paid : (i.status === 'paid' ? i.amount : 0);

        // Only count actual payments that happened in the period
        if (paidAmount > 0) {
            // If the invoice was paid, and the status was updated in this timeframe
            if (isToday(dateStr)) stats.today.collected += paidAmount;
            if (isThisWeek(dateStr)) stats.week.collected += paidAmount;
            if (isThisMonth(dateStr)) stats.month.collected += paidAmount;
        }
    });
    // ────────────────────────────────────────────────────────────────────────────

    console.log("--- Dashboard Financial Debug ---");
    console.log("Projects:", projects?.length, "Value:", totalProjectValue);
    console.log("Invoices:", invoices?.length, "Collected:", totalCollected, "Pending:", totalPending);
    console.log("Expenses (Table):", expenses?.length, "Paid:", totalRealExpenses);
    console.log("Production Costs (Projects):", totalProductionCost);
    console.log("Calculated Profit:", totalProfit);
    console.log("---------------------------------");

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div>
                    <h1 className="text-4xl font-serif text-black dark:text-white tracking-wide">Welcome back, <span className="text-luxury-gold italic">{profile?.full_name?.split(' ')[0]}</span></h1>
                    <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">Here is what needs your attention today.</p>
                </div>
                {(role === 'admin' || role === 'secretary') && (
                    <Button asChild className="bg-luxury-gold text-black hover:bg-luxury-gold/90">
                        <Link to="/dashboard/projects/new">New Project</Link>
                    </Button>
                )}
            </div>

            {/* PROJECT HEALTH AUDITOR (Admin & Secretary Only) */}
            {(role === 'admin' || role === 'secretary') && activities && projects && (
                <ProjectHealthAuditor projects={projects} activities={activities} />
            )}

            {/* SECRETARY VIEW: PER-MANUFACTURER DASHBOARDS */}
            {role === 'secretary' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-serif text-luxury-gold">Manufacturer Workloads</h2>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search manufacturer..."
                                className="bg-white/10 border border-white/20 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-luxury-gold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid gap-4">
                        {users?.filter(u => u.role === 'manufacturer' && (searchTerm === '' || u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))).map(m => (
                            <ManufacturerDashboardSection
                                key={m.id}
                                manufacturer={m}
                                projects={projects?.filter(p => (p as any).manufacturer_id === m.id) || []}
                                role={role}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* MANUFACTURER VIEW: SPECIFIC DASHBOARD */}
            {role === 'manufacturer' && profile && (
                <ManufacturerDashboardSection
                    manufacturer={profile as any}
                    projects={filteredProjects}
                    role={role}
                />
            )}

            {/* ADMIN VIEW: GLOBAL DASHBOARD (Keep original layout for Admin) */}
            {role === 'admin' && (
                <div className="space-y-8">
                    {/* MANUFACTURER DASHBOARD PREVIEW (Show to Admin) */}
                    <div className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* KPI 1: Design Ready */}
                            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-blue-500/30 transition-colors duration-500 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-blue-500 transition-colors">Design Ready</CardTitle>
                                    <Clock className="h-4 w-4 text-blue-500/70" />
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-3xl font-serif text-black dark:text-white group-hover:text-blue-500 transition-colors duration-500">
                                        {manufacturerDesignRequests.length}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">À Démarrer</p>
                                </CardContent>
                            </Card>

                            {/* KPI 2: Ongoing Production */}
                            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-purple-500/30 transition-colors duration-500 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-purple-500 transition-colors">En Cours (Ongoing)</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-purple-500/70" />
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-3xl font-serif text-black dark:text-white group-hover:text-purple-500 transition-colors duration-500">
                                        {manufacturerOngoingProduction.length}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">En Fabrication</p>
                                </CardContent>
                            </Card>

                            {/* KPI 3: Completed Projects */}
                            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-green-500/30 transition-colors duration-500 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-green-500 transition-colors">Total Fabriqué</CardTitle>
                                    <Briefcase className="h-4 w-4 text-green-500/70" />
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-3xl font-serif text-black dark:text-white group-hover:text-green-500 transition-colors duration-500">
                                        {manufacturerCompleted.length}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Projets historiques achevés</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* ADMIN DASHBOARD - CONTROL CENTER */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* KPI 1: Design Ready */}
                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-blue-500/30 transition-colors duration-500 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-blue-500 transition-colors">Design Ready</CardTitle>
                                <Clock className="h-4 w-4 text-blue-500/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-blue-500 transition-colors duration-500">
                                    {manufacturerDesignRequests.length}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">À Démarrer</p>
                            </CardContent>
                        </Card>

                        {/* KPI 2: Ongoing Production */}
                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-purple-500/30 transition-colors duration-500 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-purple-500 transition-colors">En Cours (Ongoing)</CardTitle>
                                <TrendingUp className="h-4 w-4 text-purple-500/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-purple-500 transition-colors duration-500">
                                    {manufacturerOngoingProduction.length}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">En Fabrication</p>
                            </CardContent>
                        </Card>

                        {/* KPI 3: Completed Projects */}
                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-green-500/30 transition-colors duration-500 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-green-500 transition-colors">Total Fabriqué</CardTitle>
                                <Briefcase className="h-4 w-4 text-green-500/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-green-500 transition-colors duration-500">
                                    {manufacturerCompleted.length}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Projets historiques achevés</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {/* 1. DESIGN REQUESTS */}
                        <Card className="border-l-4 border-l-blue-500 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-serif">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    Design Requests
                                </CardTitle>
                                <CardDescription className="uppercase tracking-widest text-sm">New ideas needing 3D design & cost estimation.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {manufacturerDesignRequests.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">No pending design requests.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {manufacturerDesignRequests.map(project => (
                                            <div key={project.id} className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg shadow-sm border transition-colors group ${project.priority === 'rush' ? 'bg-red-50 dark:bg-red-950/40 border-red-500/50 hover:border-red-500' : 'bg-zinc-50 dark:bg-zinc-900 border-black/5 dark:border-white/5 hover:border-blue-500/30'}`}>
                                                <div className="flex-1 min-w-[150px]">
                                                    <div className="font-serif text-base group-hover:text-blue-500 transition-colors flex items-center gap-2 flex-wrap">
                                                        {project.title}
                                                        {project.priority === 'rush' && (
                                                            <Badge variant="destructive" className="bg-red-500 text-xs uppercase tracking-widest leading-none px-1.5 py-0.5 whitespace-nowrap">RUSH</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                                                        Status: <span className="capitalize">{project.status.replace('_', ' ')}</span>
                                                        {(role === 'admin' || role === 'secretary') && (
                                                            <>
                                                                {project.affiliate && ` • Amb: ${project.affiliate.full_name}`}
                                                                {project.manufacturer && ` • Mfg: ${project.manufacturer.full_name}`}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Button size="sm" variant="outline" className="border-blue-500/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" asChild>
                                                        <Link to={`/dashboard/projects/${project.id}`}>View Request</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 2. PENDING PRODUCTION */}
                        <Card className="border-l-4 border-l-green-500 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-serif">
                                    <AlertCircle className="w-5 h-5 text-green-500" />
                                    Pending Production
                                </CardTitle>
                                <CardDescription className="uppercase tracking-widest text-sm">Approved designs ready to be manufactured.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {manufacturerPendingProduction.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">No approved production tasks.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {manufacturerPendingProduction.map(project => (
                                            <div key={project.id} className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg shadow-sm border transition-colors group ${project.priority === 'rush' ? 'bg-red-50 dark:bg-red-950/40 border-red-500/50 hover:border-red-500' : 'bg-zinc-50 dark:bg-zinc-900 border-black/5 dark:border-white/5 hover:border-green-500/30'}`}>
                                                <div className="flex-1 min-w-[150px]">
                                                    <div className="font-serif text-base group-hover:text-green-500 transition-colors flex items-center gap-2 flex-wrap">
                                                        {project.title}
                                                        {project.priority === 'rush' && (
                                                            <Badge variant="destructive" className="bg-red-500 text-xs uppercase tracking-widest leading-none px-1.5 py-0.5 whitespace-nowrap">RUSH</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                                                        Pending Production
                                                        {project.deadline && ` • Due ${new Date(project.deadline).toLocaleDateString()}`}
                                                        {(role === 'admin' || role === 'secretary') && (
                                                            <>
                                                                {project.affiliate && ` • Amb: ${project.affiliate.full_name}`}
                                                                {project.manufacturer && ` • Mfg: ${project.manufacturer.full_name}`}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Button size="sm" variant="outline" className="border-green-500/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" asChild>
                                                        <Link to={`/dashboard/projects/${project.id}`}>View Details</Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 shadow border-green-700/50 text-white"
                                                        onClick={async () => {
                                                            if (confirm("Start production for this project?")) {
                                                                await apiProjects.updateStatus(project.id, 'production');
                                                                window.location.reload();
                                                            }
                                                        }}
                                                    >
                                                        Start Production
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 3. ONGOING PRODUCTION */}
                        <Card className="border-l-4 border-l-purple-500 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-serif">
                                    <TrendingUp className="w-5 h-5 text-purple-500" />
                                    Ongoing Production
                                </CardTitle>
                                <CardDescription className="uppercase tracking-widest text-sm">Projects currently being manufactured.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {manufacturerOngoingProduction.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">No projects currently in production.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {manufacturerOngoingProduction.map(project => (
                                            <div key={project.id} className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg shadow-sm border transition-colors group ${project.priority === 'rush' ? 'bg-red-50 dark:bg-red-950/40 border-red-500/50 hover:border-red-500' : 'bg-zinc-50 dark:bg-zinc-900 border-black/5 dark:border-white/5 hover:border-purple-500/30'}`}>
                                                <div className="flex-1 min-w-[150px]">
                                                    <div className="font-serif text-base group-hover:text-purple-500 transition-colors flex items-center gap-2 flex-wrap">
                                                        {project.title}
                                                        {project.priority === 'rush' && (
                                                            <Badge variant="destructive" className="bg-red-500 text-xs uppercase tracking-widest leading-none px-1.5 py-0.5 whitespace-nowrap">RUSH</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                                                        Production Started
                                                        {project.deadline && ` • Due ${new Date(project.deadline).toLocaleDateString()}`}
                                                        {(role === 'admin' || role === 'secretary') && (
                                                            <>
                                                                {project.affiliate && ` • Amb: ${project.affiliate.full_name}`}
                                                                {project.manufacturer && ` • Mfg: ${project.manufacturer.full_name}`}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20" asChild>
                                                        <Link to={`/dashboard/projects/${project.id}`}>View Details</Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-purple-600 hover:bg-purple-700 shadow border-purple-700/50 text-white"
                                                        onClick={async () => {
                                                            if (confirm("Production finished? Send to delivery?")) {
                                                                await apiProjects.updateStatus(project.id, 'delivery');
                                                                window.location.reload();
                                                            }
                                                        }}
                                                    >
                                                        Mark as Delivery
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 4. IN DELIVERY */}
                        <Card className="border-l-4 border-l-amber-500 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-serif">
                                    <Package className="w-5 h-5 text-amber-500" />
                                    In Delivery
                                </CardTitle>
                                <CardDescription className="uppercase tracking-widest text-sm">Finished rings awaiting client delivery.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {manufacturerInDelivery.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">No projects currently in delivery.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {manufacturerInDelivery.map(project => (
                                            <div key={project.id} className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg shadow-sm border transition-colors group ${project.priority === 'rush' ? 'bg-red-50 dark:bg-red-950/40 border-red-500/50 hover:border-red-500' : 'bg-zinc-50 dark:bg-zinc-900 border-black/5 dark:border-white/5 hover:border-amber-500/30'}`}>
                                                <div className="flex-1 min-w-[150px]">
                                                    <div className="font-serif text-base group-hover:text-amber-500 transition-colors flex items-center gap-2 flex-wrap">
                                                        {project.title}
                                                        {project.priority === 'rush' && (
                                                            <Badge variant="destructive" className="bg-red-500 text-xs uppercase tracking-widest leading-none px-1.5 py-0.5 whitespace-nowrap">RUSH</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                                                        Shipment Pending
                                                        {(role === 'admin' || role === 'secretary') && (
                                                            <>
                                                                {project.affiliate && ` • Amb: ${project.affiliate.full_name}`}
                                                                {project.manufacturer && ` • Mfg: ${project.manufacturer.full_name}`}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" asChild>
                                                        <Link to={`/dashboard/projects/${project.id}`}>View Details</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>

                    {/* Financial Macros (Admin Only) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-green-600 transition-colors">Total Collected</CardTitle>
                                <Banknote className="h-4 w-4 text-green-600/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-green-600 transition-colors duration-500">
                                    ${totalCollected.toLocaleString()}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Cash Received</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-amber-600 transition-colors">Pending Payment</CardTitle>
                                <Clock className="h-4 w-4 text-amber-600/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-amber-600 transition-colors duration-500">
                                    ${totalPending.toLocaleString()}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Outstanding Balance</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-purple-600 transition-colors">Commissions</CardTitle>
                                <Banknote className="h-4 w-4 text-purple-600/70" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white group-hover:text-purple-600 transition-colors duration-500">
                                    ${totalCommissions.toLocaleString()}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Affiliate Payouts (Est)</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-luxury-gold/10 to-black/40 backdrop-blur-xl border-luxury-gold/30 shadow-[0_4px_20px_rgba(210,181,123,0.1)] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tl from-luxury-gold/10 to-transparent opacity-50" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-luxury-gold">Actual Profit</CardTitle>
                                <TrendingUp className="h-4 w-4 text-luxury-gold" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-serif text-black dark:text-white">
                                    ${totalProfit.toLocaleString()}
                                </div>
                                <div className="text-sm text-luxury-gold/70 uppercase tracking-widest mt-1 flex justify-between gap-2 font-medium">
                                    <span>Net Income</span>
                                    <span title="Potential profit if all invoices are paid" className="opacity-70">/ ${projectedProfit.toLocaleString()} Proj.</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>




                    {/* Time-Based Statistics Component For Admin */}
                    <Card className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-luxury-gold/50 to-transparent opacity-50" />
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/5">
                                {/* TODAY */}
                                <div className="p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-2 mb-6 text-luxury-gold/80 group-hover:text-luxury-gold transition-colors">
                                        <Activity className="w-5 h-5" />
                                        <h3 className="font-serif text-lg tracking-wide">Aujourd'hui (Today)</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">New Projects</span>
                                            <span className="font-serif text-xl text-black dark:text-white">{stats.today.count}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">Volume Generated</span>
                                            <span className="font-serif text-xl text-black dark:text-white">${stats.today.volume.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs uppercase tracking-widest text-green-600/70">Cash Collected</span>
                                            <span className="font-serif text-xl text-green-600 dark:text-green-400">${stats.today.collected.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* THIS WEEK */}
                                <div className="p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-2 mb-6 text-luxury-gold/80 group-hover:text-luxury-gold transition-colors">
                                        <BarChart3 className="w-5 h-5" />
                                        <h3 className="font-serif text-lg tracking-wide">Cette Semaine (Week)</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">New Projects</span>
                                            <span className="font-serif text-xl text-black dark:text-white">{stats.week.count}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">Volume Generated</span>
                                            <span className="font-serif text-xl text-black dark:text-white">${stats.week.volume.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs uppercase tracking-widest text-green-600/70">Cash Collected</span>
                                            <span className="font-serif text-xl text-green-600 dark:text-green-400">${stats.week.collected.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* THIS MONTH */}
                                <div className="p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-2 mb-6 text-luxury-gold/80 group-hover:text-luxury-gold transition-colors">
                                        <CalendarDays className="w-5 h-5" />
                                        <h3 className="font-serif text-lg tracking-wide">Ce Mois (Month)</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">New Projects</span>
                                            <span className="font-serif text-xl text-black dark:text-white">{stats.month.count}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">Volume Generated</span>
                                            <span className="font-serif text-xl text-black dark:text-white">${stats.month.volume.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs uppercase tracking-widest text-green-600/70">Cash Collected</span>
                                            <span className="font-serif text-xl text-green-600 dark:text-green-400">${stats.month.collected.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Factory Pipeline Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50">
                            <CardHeader className="py-4 pb-2">
                                <CardTitle className="text-sm uppercase tracking-widest font-semibold text-blue-700 dark:text-blue-400">Design Phase</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-serif text-blue-900 dark:text-blue-100">{manufacturerDesignRequests.length}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50">
                            <CardHeader className="py-4 pb-2">
                                <CardTitle className="text-sm uppercase tracking-widest font-semibold text-green-700 dark:text-green-400">Ready for Prod</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-serif text-green-900 dark:text-green-100">{manufacturerPendingProduction.length}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50">
                            <CardHeader className="py-4 pb-2">
                                <CardTitle className="text-sm uppercase tracking-widest font-semibold text-purple-700 dark:text-purple-400">In Production</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-serif text-purple-900 dark:text-purple-100">{manufacturerOngoingProduction.length}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
                            <CardHeader className="py-4 pb-2">
                                <CardTitle className="text-sm uppercase tracking-widest font-semibold text-amber-700 dark:text-amber-400">In Delivery</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-serif text-amber-900 dark:text-amber-100">{manufacturerInDelivery.length}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Two Column Section: Action Items & Leaderboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Action Required: Designs pending approval */}
                        <Card className="border-l-2 border-l-luxury-gold bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-xl border border-black/5 dark:border-white/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-luxury-gold font-serif">
                                    <AlertCircle className="w-5 h-5 relative -top-[1px]" />
                                    Designs Pending Review
                                </CardTitle>
                                <CardDescription className="text-xs uppercase tracking-widest">Awaiting Admin Approval</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {adminDesignReady.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-4 text-center border-dashed border rounded-lg">No designs are waiting for approval.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {adminDesignReady.map(project => (
                                            <div key={project.id} className="group flex items-center justify-between p-3 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors rounded-lg border border-black/5 dark:border-white/5">
                                                <div>
                                                    <div className="font-serif text-black dark:text-white group-hover:text-luxury-gold transition-colors">{project.title}</div>
                                                </div>
                                                <Button size="sm" variant="outline" className="border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold hover:text-black" asChild>
                                                    <Link to={`/dashboard/projects/${project.id}`}>Review Design</Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Ambassadors */}
                        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-serif text-gray-800 dark:text-gray-200">
                                    <Trophy className="w-5 h-5 text-amber-500 relative -top-[1px]" />
                                    Top Ambassadors
                                </CardTitle>
                                <CardDescription className="text-xs uppercase tracking-widest">Global Sales Leaderboard</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {leaderboard.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-4 text-center border-dashed border rounded-lg">No active sales yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {leaderboard.slice(0, 5).map((seller, index) => (
                                            <div key={seller.id} className="flex flex-wrap items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-black/10 dark:bg-white/10 text-gray-500'}`}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm text-black dark:text-white capitalize">{seller.name}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-serif text-green-600 dark:text-green-400">${seller.volume.toLocaleString()}</div>
                                                    <div className="text-sm text-gray-500 uppercase tracking-widest mt-0.5">
                                                        {seller.projectCount} Projects
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>
            )}

            {/* AFFILIATE DASHBOARD - SPECIFIC KPIs */}
            {
                role === 'affiliate' && (

                    <div className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 dark:hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-luxury-gold transition-colors">Mes Commissions</CardTitle>
                                    <Banknote className="h-4 w-4 text-luxury-gold/70" />
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-3xl font-serif text-black dark:text-white group-hover:text-luxury-gold transition-colors duration-500">
                                        ${(myStats?.commissions || 0).toLocaleString()}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Gagnées sur {myStats?.projectCount || 0} projets</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 dark:hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 group-hover:text-luxury-gold transition-colors">Volume Généré</CardTitle>
                                    <Briefcase className="h-4 w-4 text-luxury-gold/70" />
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-3xl font-serif text-black dark:text-white group-hover:text-luxury-gold transition-colors duration-500">
                                        ${(myStats?.volume || 0).toLocaleString()}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Chiffre d'Affaires Apporté</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Classement Leaderboard</CardTitle>
                                    <Trophy className="h-4 w-4 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-serif text-black dark:text-white flex items-baseline gap-1">
                                        <span className="text-lg text-luxury-gold/50">#</span>{myRank}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Sur {leaderboard.length} Ambassadeurs actifs</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 transition-colors duration-500 overflow-hidden relative group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Objectif Mensuel</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-blue-500/70" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-serif text-black dark:text-white">
                                        ${Math.min(stats.month.volume, profile?.monthly_goal || 50000).toLocaleString()}
                                    </div>
                                    <div className="mt-2 w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min((stats.month.volume / (profile?.monthly_goal || 50000)) * 100, 100)}%` }} />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1 flex justify-between">
                                        <span>Palier: {(profile?.monthly_goal || 50000) / 1000}k$</span>
                                        <span>{Math.round(Math.min((stats.month.volume / (profile?.monthly_goal || 50000)) * 100, 100))}%</span>
                                    </p>
                                </CardContent>
                            </Card>

                            {/* TIME-BASED STATISTICS COMPONENT EN AFFILIÉ RESTE SEUL AU BOUT DU BLOC */}
                            <Card className="col-span-full bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-2xl relative overflow-hidden mt-2">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-luxury-gold/50 to-transparent opacity-50" />
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/5">

                                        {/* TODAY */}
                                        <div className="p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-2 mb-6 text-luxury-gold/80 group-hover:text-luxury-gold transition-colors">
                                                <Activity className="w-5 h-5" />
                                                <h3 className="font-serif text-lg tracking-wide">Aujourd'hui</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                                    <span className="text-xs uppercase tracking-widest text-gray-500">Nvx Projets</span>
                                                    <span className="font-serif text-xl text-black dark:text-white">{stats.today.count}</span>
                                                </div>
                                                <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                                    <span className="text-xs uppercase tracking-widest text-gray-500">Volume Généré</span>
                                                    <span className="font-serif text-xl text-black dark:text-white">${stats.today.volume.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs uppercase tracking-widest text-green-600/70">Cash Encaissé</span>
                                                    <span className="font-serif text-xl text-green-600 dark:text-green-400">${stats.today.collected.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* THIS WEEK */}
                                        <div className="p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-2 mb-6 text-luxury-gold/80 group-hover:text-luxury-gold transition-colors">
                                                <BarChart3 className="w-5 h-5" />
                                                <h3 className="font-serif text-lg tracking-wide">Cette Semaine</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                                    <span className="text-xs uppercase tracking-widest text-gray-500">Nvx Projets</span>
                                                    <span className="font-serif text-xl text-black dark:text-white">{stats.week.count}</span>
                                                </div>
                                                <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                                    <span className="text-xs uppercase tracking-widest text-gray-500">Volume Généré</span>
                                                    <span className="font-serif text-xl text-black dark:text-white">${stats.week.volume.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs uppercase tracking-widest text-green-600/70">Cash Encaissé</span>
                                                    <span className="font-serif text-xl text-green-600 dark:text-green-400">${stats.week.collected.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* THIS MONTH */}
                                        <div className="p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-2 mb-6 text-luxury-gold/80 group-hover:text-luxury-gold transition-colors">
                                                <CalendarDays className="w-5 h-5" />
                                                <h3 className="font-serif text-lg tracking-wide">Ce Mois</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                                    <span className="text-xs uppercase tracking-widest text-gray-500">Nvx Projets</span>
                                                    <span className="font-serif text-xl text-black dark:text-white">{stats.month.count}</span>
                                                </div>
                                                <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-2">
                                                    <span className="text-xs uppercase tracking-widest text-gray-500">Volume Généré</span>
                                                    <span className="font-serif text-xl text-black dark:text-white">${stats.month.volume.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs uppercase tracking-widest text-green-600/70">Cash Encaissé</span>
                                                    <span className="font-serif text-xl text-green-600 dark:text-green-400">${stats.month.collected.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )
            }

            {/* SHARED / DEFAULT DASHBOARD (Recent Projects) */}
            {
                ((role as string) === 'admin' || (role as string) === 'affiliate') && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Revenue Overview */}
                        <Card className="col-span-2 lg:col-span-2 bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 shadow-xl">
                            <CardHeader>
                                <CardTitle className="font-serif text-xl tracking-wide">Revenue Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <RevenueChart />
                            </CardContent>
                        </Card>

                        {/* Standard Dashboard Cards... */}
                        <Card className="col-span-2 lg:col-span-1 bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 shadow-xl">
                            <CardHeader>
                                <CardTitle className="font-serif text-xl tracking-wide">Recent Projects</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentProjects.map((project) => (
                                        <div key={project.id} className="group flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <h3 className="font-serif text-lg text-gray-800 dark:text-gray-200 group-hover:text-luxury-gold transition-colors">{project.title}</h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider mt-1">{project.status.replace('_', ' ')} <span className="text-luxury-gold/50">•</span> {project.client?.full_name}</p>
                                            </div>
                                            <div className="bg-luxury-gold/10 text-luxury-gold px-2.5 py-0.5 rounded-full text-xs font-semibold border border-luxury-gold/30">
                                                {project.status.replace('_', ' ')}
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* RECENT ACTIVITY WIDGET */}
                        <Card className="col-span-2 bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 shadow-xl">
                            <CardHeader>
                                <CardTitle className="font-serif text-xl tracking-wide">Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RecentActivityList />
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </div >
    );
}
