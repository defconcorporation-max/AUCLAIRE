import { Project } from '@/services/apiProjects';
import { ActivityLog } from '@/services/apiActivities';
import { CompanySettings } from '@/services/apiSettings';
import { financialUtils } from '@/utils/financialUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

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

    const statusLogs = activities.filter(a => a.action === 'status_change');
    const velocityData: Record<string, { totalDays: number, count: number }> = {};
    const logsByProject: Record<string, ActivityLog[]> = {};

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

    const PIPELINE_STATUSES = ['3d_model', 'design_modification', 'production', 'delivery'];

    projects.forEach(p => {
        if (!PIPELINE_STATUSES.includes(p.status)) return;

        const pLogs = logsByProject[p.id] || [];
        const lastLog = pLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        const lastChangeDate = lastLog ? new Date(lastLog.created_at) : new Date(p.created_at);
        const daysInStatus = (Date.now() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24);

        // CONFIGURABLE THRESHOLDS FROM SETTINGS
        // Fallback to hardcoded defaults if settings are not available/passed
        const settings = (window as any).auclaireSettings as CompanySettings | undefined;
        let warnThreshold = 0;
        let dangerThreshold = 0;

        if (p.status === 'production') {
            warnThreshold = settings?.prod_warn_days || 10;
            dangerThreshold = settings?.prod_danger_days || 20;
        } else if (p.status === '3d_model' || p.status === 'designing') {
            warnThreshold = settings?.design_warn_days || 1;
            dangerThreshold = settings?.design_danger_days || 2;
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

        const price = financialUtils.getSalePrice(p);
        const totalCosts = financialUtils.computeProjectCosts(p.financials);
        const commission = financialUtils.computeCommissionAmount(p);

        if (price > 0) {
            // Margin based on full economic costs (including commission)
            const margin = (price - totalCosts - commission) / price;
            const marginWarn = (settings?.margin_warn_percent || 20) / 100;
            const marginDanger = (settings?.margin_danger_percent || 10) / 100;

            if (margin < marginDanger && totalCosts > 0) {
                alerts.push({
                    id: `margin-danger-${p.id}`,
                    projectId: p.id,
                    projectTitle: p.title,
                    type: 'margin',
                    severity: 'danger',
                    message: `Critical Margin: ${Math.round(margin * 100)}%`
                });
            } else if (margin < marginWarn && totalCosts > 0) {
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
        <Card className="glass-card overflow-hidden relative">
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
                        {alerts.sort((a) => a.severity === 'danger' ? -1 : 1).map((alert, idx) => (
                            <Link 
                                key={alert.id}
                                to={`/dashboard/projects/${alert.projectId}`}
                                className="flex items-start gap-3 p-4 hover:bg-white/5 transition-all group border-r border-white/5 last:border-r-0 animate-in fade-in"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${alert.severity === 'danger' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-serif group-hover:text-luxury-gold transition-colors truncate">{alert.projectTitle}</p>
                                    <p className={`text-[11px] font-bold uppercase tracking-tight mt-0.5 ${alert.severity === 'danger' ? 'text-red-500' : 'text-amber-500'}`}>{alert.message}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
