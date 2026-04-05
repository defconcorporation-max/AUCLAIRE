import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiProjects } from '@/services/apiProjects';
import { apiMarketing } from '@/services/apiMarketing';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Briefcase, AlertTriangle, Megaphone, Rocket, TrendingUp, Clock, Target, Zap } from 'lucide-react';

export default function AdminDashboard() {
    const { t } = useTranslation();

    const { data: projects = [], isLoading: projLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll,
    });

    const { data: campaigns = [], isLoading: campLoading } = useQuery({
        queryKey: ['marketing-campaigns'],
        queryFn: apiMarketing.getCampaigns,
    });

    if (projLoading || campLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
            </div>
        );
    }

    const activeStatuses = ['designing', '3d_model', 'design_ready', 'design_modification', 'approved_for_production', 'production', 'delivery', 'waiting_for_approval'];
    const activeProjects = projects.filter(p => activeStatuses.includes(p.status));
    const overdueProjects = projects.filter(p => {
        if (!p.deadline || p.status === 'completed' || p.status === 'cancelled') return false;
        return new Date(p.deadline) < new Date();
    });
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    const pendingCampaigns = campaigns.filter(c => c.status === 'idea' || c.status === 'planning');

    const KPI_CARDS = [
        {
            label: t('admin.dashboard.activeProjects'),
            value: activeProjects.length,
            icon: Briefcase,
            gradient: 'from-blue-500/20 to-cyan-500/20',
            iconColor: 'text-blue-400',
            valueColor: 'text-blue-400',
        },
        {
            label: t('admin.dashboard.overdueProjects'),
            value: overdueProjects.length,
            icon: AlertTriangle,
            gradient: overdueProjects.length > 0 ? 'from-red-500/20 to-orange-500/20' : 'from-emerald-500/20 to-green-500/20',
            iconColor: overdueProjects.length > 0 ? 'text-red-400' : 'text-emerald-400',
            valueColor: overdueProjects.length > 0 ? 'text-red-400' : 'text-emerald-400',
        },
        {
            label: t('admin.dashboard.activeCampaigns'),
            value: activeCampaigns.length,
            icon: Megaphone,
            gradient: 'from-emerald-500/20 to-teal-500/20',
            iconColor: 'text-emerald-400',
            valueColor: 'text-emerald-400',
        },
        {
            label: t('admin.dashboard.pendingCampaigns'),
            value: pendingCampaigns.length,
            icon: Rocket,
            gradient: 'from-amber-500/20 to-orange-500/20',
            iconColor: 'text-amber-400',
            valueColor: 'text-amber-400',
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h2 className="text-3xl font-serif font-bold text-luxury-gold tracking-wide flex items-center gap-3">
                    <Zap className="w-7 h-7" /> {t('admin.dashboard.title')}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">{t('admin.dashboard.subtitle')}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {KPI_CARDS.map((kpi, i) => (
                    <Card key={i} className="border-none ring-1 ring-black/5 dark:ring-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                        style={{ animationDelay: `${i * 100}ms` }}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-30`} />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{kpi.label}</p>
                                    <p className={`text-4xl font-serif font-bold ${kpi.valueColor}`}>{kpi.value}</p>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center`}>
                                    <kpi.icon className={`w-7 h-7 ${kpi.iconColor}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Overdue Projects List */}
            {overdueProjects.length > 0 && (
                <Card className="border-none ring-1 ring-red-500/20 bg-red-500/5">
                    <CardContent className="p-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-red-400 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> {t('admin.dashboard.overdueList')}
                        </h3>
                        <div className="space-y-3">
                            {overdueProjects.slice(0, 5).map(p => {
                                const daysLate = Math.floor((new Date().getTime() - new Date(p.deadline!).getTime()) / (1000 * 60 * 60 * 24));
                                return (
                                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-red-500/10 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{p.title}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{p.client?.full_name || '—'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-red-400" />
                                            <span className="text-xs text-red-400 font-bold">{daysLate}j {t('admin.dashboard.late')}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Active Campaigns List */}
            {activeCampaigns.length > 0 && (
                <Card className="border-none ring-1 ring-emerald-500/20 bg-emerald-500/5">
                    <CardContent className="p-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4" /> {t('admin.dashboard.activeCampaignsList')}
                        </h3>
                        <div className="space-y-3">
                            {activeCampaigns.map(c => {
                                const tasksDone = (c.tasks || []).filter(t2 => t2.done).length;
                                const tasksTotal = (c.tasks || []).length;
                                const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
                                return (
                                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-emerald-500/10 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{c.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{t(`marketing.roadmap.type_${c.type}`)}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {tasksTotal > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                                                    </div>
                                                    <span className="text-[10px] text-emerald-400 font-mono">{progress}%</span>
                                                </div>
                                            )}
                                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
