import { Project } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface DeadlineTrackerProps {
    projects: Project[];
}

export function DeadlineTracker({ projects }: DeadlineTrackerProps) {
    const { t, i18n } = useTranslation();
    const localeTag = i18n.language.startsWith('en') ? 'en-CA' : 'fr-CA';
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const withDeadline = projects.filter(p =>
        p.deadline && p.status !== 'completed' && p.status !== 'cancelled'
    );

    const overdue = withDeadline
        .filter(p => new Date(p.deadline!) < now)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

    const atRisk = withDeadline
        .filter(p => {
            const d = new Date(p.deadline!);
            const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return daysLeft >= 0 && daysLeft <= 7;
        })
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

    const getDaysText = (deadline: string) => {
        const d = new Date(deadline);
        const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return t('dashboard.deadlineDaysLate', { n: Math.abs(diff) });
        if (diff === 0) return t('dashboard.deadlineToday');
        return t('dashboard.deadlineDaysLeft', { n: diff });
    };

    if (overdue.length === 0 && atRisk.length === 0) {
        return (
            <Card className="glass-card">
                <CardHeader className="py-4">
                    <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-500" />
                        {t('dashboard.deadlineTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-8 text-center">
                    <p className="text-xs uppercase tracking-widest text-green-500/70 font-bold">{t('dashboard.deadlineAllOk')}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card border-l-4 border-l-amber-500/50 overflow-hidden">
            <CardHeader className="py-4 border-b border-white/5">
                <CardTitle className="text-lg font-serif flex items-center gap-2 text-amber-500">
                    <AlertTriangle className="w-5 h-5" />
                    {t('dashboard.deadlineTitle')}
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest text-amber-500/70 font-medium">
                    {t('dashboard.deadlineSummary', { overdue: overdue.length, atRisk: atRisk.length })}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                    {overdue.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors group">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-serif truncate group-hover:text-red-500 transition-colors">{p.title}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                                        {getDaysText(p.deadline!)}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                        {t('dashboard.deadlineDueLabel')} {new Date(p.deadline!).toLocaleDateString(localeTag)}
                                    </span>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" asChild>
                                <Link to={`/dashboard/projects/${p.id}`}>
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    ))}
                    {atRisk.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-4 hover:bg-amber-500/5 transition-colors group">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-serif truncate group-hover:text-amber-500 transition-colors">{p.title}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                                        {getDaysText(p.deadline!)}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                        {t('dashboard.deadlineDueLabel')} {new Date(p.deadline!).toLocaleDateString(localeTag)}
                                    </span>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" asChild>
                                <Link to={`/dashboard/projects/${p.id}`}>
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
