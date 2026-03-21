import { Project } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TrendingUp, Package, Clock, PenTool } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ManufacturerDashboardProps {
    projects: Project[];
}

export function ManufacturerDashboard({ projects }: ManufacturerDashboardProps) {
    const { t } = useTranslation();
    const ongoing = projects.filter(p => p.status === 'production');
    const waiting = projects.filter(p => p.status === 'approved_for_production');
    const delivery = projects.filter(p => p.status === 'delivery');
    const designs3d = projects.filter(p => p.status === '3d_model' || p.status === 'design_modification');

    const kpis = [
        { label: t('manufacturerDashboard.inProduction'), count: ongoing.length, icon: TrendingUp, color: "text-purple-500" },
        { label: t('manufacturerDashboard.toStart'), count: waiting.length, icon: Clock, color: "text-blue-500" },
        { label: t('manufacturerDashboard.designs3d'), count: designs3d.length, icon: PenTool, color: "text-indigo-500" },
        { label: t('manufacturerDashboard.inDelivery'), count: delivery.length, icon: Package, color: "text-amber-500" },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, idx) => (
                    <div
                        key={kpi.label}
                        className="animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <Card className="glass-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{kpi.label}</CardTitle>
                                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-serif">{kpi.count}</div>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
                            <PenTool className="w-5 h-5 text-indigo-500" />
                            {t('manufacturerDashboard.models3d')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-white/5 p-0">
                        {designs3d.length === 0 ? (
                            <p className="p-8 text-center text-xs uppercase tracking-widest text-muted-foreground">{t('manufacturerDashboard.noDesigns')}</p>
                        ) : (
                            designs3d.map(project => (
                                <div key={project.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-serif text-sm truncate group-hover:text-luxury-gold transition-colors">{project.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase border-indigo-500/30 text-indigo-500">
                                                {project.status === '3d_model' ? t('projectStatus.3d_model') : t('projectStatus.design_modification')}
                                            </Badge>
                                            {project.priority === 'rush' && (
                                                <Badge className="bg-red-500 hover:bg-red-600 text-white text-[8px] h-3 px-1 uppercase animate-pulse border-none">{t('dashboard.rushBadge')}</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold hover:text-black text-[10px] uppercase font-bold" asChild>
                                        <Link to={`/dashboard/projects/${project.id}`}>{t('manufacturerDashboard.view')}</Link>
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            {t('manufacturerDashboard.toStartProduction')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-white/5 p-0">
                        {waiting.length === 0 ? (
                            <p className="p-8 text-center text-xs uppercase tracking-widest text-muted-foreground">{t('manufacturerDashboard.noReady')}</p>
                        ) : (
                            waiting.map(project => (
                                <div key={project.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-serif text-sm truncate group-hover:text-luxury-gold transition-colors">{project.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                                {project.deadline && `${t('manufacturerDashboard.duePrefix')} ${new Date(project.deadline).toLocaleDateString()}`}
                                            </p>
                                            {project.priority === 'rush' && (
                                                <Badge className="bg-red-500 hover:bg-red-600 text-white text-[8px] h-3 px-1 uppercase animate-pulse border-none">{t('dashboard.rushBadge')}</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold hover:text-black text-[10px] uppercase font-bold" asChild>
                                        <Link to={`/dashboard/projects/${project.id}`}>{t('manufacturerDashboard.launch')}</Link>
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-500" />
                            {t('manufacturerDashboard.inFabrication')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-white/5 p-0">
                        {ongoing.length === 0 ? (
                            <p className="p-8 text-center text-xs uppercase tracking-widest text-muted-foreground">{t('manufacturerDashboard.nothingOngoing')}</p>
                        ) : (
                            ongoing.map(project => (
                                <div key={project.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-serif text-sm truncate group-hover:text-luxury-gold transition-colors">{project.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase border-purple-500/30 text-purple-500">{t('manufacturerDashboard.inProduction')}</Badge>
                                            <span className="text-[10px] text-muted-foreground">
                                                {project.deadline && `${t('manufacturerDashboard.duePrefix')} ${new Date(project.deadline).toLocaleDateString()}`}
                                            </span>
                                            {project.priority === 'rush' && (
                                                <Badge className="bg-red-500 hover:bg-red-600 text-white text-[8px] h-3 px-1 uppercase animate-pulse border-none">{t('dashboard.rushBadge')}</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold hover:text-black text-[10px] uppercase font-bold" asChild>
                                        <Link to={`/dashboard/projects/${project.id}`}>{t('manufacturerDashboard.details')}</Link>
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


