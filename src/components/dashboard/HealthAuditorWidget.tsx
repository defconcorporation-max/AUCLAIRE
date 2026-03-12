import { Project } from '@/services/apiProjects';
import { ActivityLog } from '@/services/apiActivities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface HealthAlert {
    id: string;
    projectId: string;
    projectTitle: string;
    type: 'delay' | 'margin';
    severity: 'warning' | 'danger';
    message: string;
}

interface HealthAuditorWidgetProps {
    projects: Project[];
    activities: ActivityLog[];
}

export function HealthAuditorWidget({ projects, activities }: HealthAuditorWidgetProps) {
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

        if (p.status === 'production') {
            warnThreshold = 10;
            dangerThreshold = 20;
        } else if (p.status === '3d_model' || p.status === 'designing') {
            warnThreshold = 1;
            dangerThreshold = 2;
        } else {
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
                message: `Stuck for ${Math.round(daysInStatus)} days`
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

    const dangerAlerts = alerts.filter(a => a.severity === 'danger');

    return (
        <Card className="glass-card overflow-hidden">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-white/10">
                <CardTitle className="text-sm font-bold tracking-widest text-luxury-gold flex items-center gap-2 uppercase">
                    <Activity className="w-4 h-4" /> Health Monitor
                </CardTitle>
                <div className="flex gap-2">
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${dangerAlerts.length > 0 ? 'border-red-500/50 text-red-500 bg-red-500/10' : 'border-green-500/50 text-green-500 bg-green-500/10'}`}>
                        {dangerAlerts.length} Critical Issues
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {alerts.length === 0 ? (
                    <div className="p-6 flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="w-8 h-8 text-green-500 mb-2 opacity-50" />
                        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">All systems optimal</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-h-[250px] overflow-y-auto divide-y md:divide-y-0 md:border-b border-white/5">
                        <AnimatePresence>
                            {alerts.sort((a, _) => a.severity === 'danger' ? -1 : 1).map((alert, idx) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Link 
                                        to={`/dashboard/projects/${alert.projectId}`}
                                        className={`flex items-start gap-3 p-4 hover:bg-white/5 transition-all group border-r border-white/5 last:border-r-0`}
                                    >
                                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${alert.severity === 'danger' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-serif group-hover:text-luxury-gold transition-colors truncate">{alert.projectTitle}</p>
                                            <p className={`text-[11px] font-bold uppercase tracking-tight mt-0.5 ${alert.severity === 'danger' ? 'text-red-500' : 'text-amber-500'}`}>{alert.message}</p>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
