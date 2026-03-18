import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer, BarChart3 } from 'lucide-react';
import type { Project } from '@/services/apiProjects';
import { useQuery } from '@tanstack/react-query';
import { apiActivities, ActivityLog } from '@/services/apiActivities';

const STAGE_LABELS: Record<string, string> = {
    designing: 'Design',
    '3d_model': 'Modélisation 3D',
    design_ready: 'Design prêt',
    waiting_for_approval: 'En attente approbation',
    design_modification: 'Modification design',
    approved_for_production: 'Approuvé production',
    production: 'Production',
    delivery: 'Livraison',
    completed: 'Complété',
};

const STAGE_COLORS: Record<string, string> = {
    designing: 'bg-blue-500',
    '3d_model': 'bg-violet-500',
    design_ready: 'bg-sky-500',
    waiting_for_approval: 'bg-amber-500',
    design_modification: 'bg-orange-500',
    approved_for_production: 'bg-yellow-500',
    production: 'bg-purple-500',
    delivery: 'bg-emerald-500',
    completed: 'bg-green-500',
};

interface StageDuration {
    stage: string;
    days: number;
    hours: number;
}

function computeStageDurations(logs: ActivityLog[], projectCreatedAt: string): StageDuration[] {
    const statusChanges = logs
        .filter(l => l.action === 'status_change')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (statusChanges.length === 0) {
        const totalMs = Date.now() - new Date(projectCreatedAt).getTime();
        const days = totalMs / (1000 * 60 * 60 * 24);
        return [{ stage: 'designing', days, hours: days * 24 }];
    }

    const durations: Record<string, number> = {};

    const extractStatus = (detail: string): string | null => {
        const match = detail.toLowerCase().match(/(?:to |: )([a-z_]+)/);
        return match ? match[1] : null;
    };

    let prevTime = new Date(projectCreatedAt).getTime();
    let prevStage = 'designing';

    for (const log of statusChanges) {
        const logTime = new Date(log.created_at).getTime();
        const ms = logTime - prevTime;
        if (ms > 0) {
            durations[prevStage] = (durations[prevStage] || 0) + ms;
        }

        const newStage = extractStatus(log.details);
        if (newStage) prevStage = newStage;
        prevTime = logTime;
    }

    const nowMs = Date.now() - prevTime;
    if (nowMs > 0) {
        durations[prevStage] = (durations[prevStage] || 0) + nowMs;
    }

    return Object.entries(durations)
        .map(([stage, ms]) => ({
            stage,
            days: ms / (1000 * 60 * 60 * 24),
            hours: ms / (1000 * 60 * 60),
        }))
        .sort((a, b) => b.days - a.days);
}

interface TimeTrackerProps {
    project: Project;
}

export function TimeTracker({ project }: TimeTrackerProps) {
    const { data: activities = [] } = useQuery({
        queryKey: ['activities'],
        queryFn: apiActivities.getAll,
    });

    const projectLogs = activities.filter(a => a.project_id === project.id);
    const durations = computeStageDurations(projectLogs, project.created_at);

    const totalDays = durations.reduce((s, d) => s + d.days, 0);
    const totalHours = durations.reduce((s, d) => s + d.hours, 0);

    const formatDuration = (days: number) => {
        if (days < 1) return `${Math.round(days * 24)}h`;
        return `${Math.round(days * 10) / 10}j`;
    };

    return (
        <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif flex items-center justify-between">
                    <span className="flex items-center gap-2 text-luxury-gold">
                        <Timer className="w-5 h-5" /> Temps de production
                    </span>
                    <span className="text-sm font-mono text-muted-foreground">
                        Total : <span className="text-white font-bold">{formatDuration(totalDays)}</span>
                        <span className="text-muted-foreground ml-1">({Math.round(totalHours)}h)</span>
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {totalDays > 0 ? (
                    <>
                        <div className="flex rounded-full overflow-hidden h-3">
                            {durations.map(d => (
                                <div
                                    key={d.stage}
                                    className={`${STAGE_COLORS[d.stage] || 'bg-zinc-500'} transition-all`}
                                    style={{ width: `${(d.days / totalDays) * 100}%` }}
                                    title={`${STAGE_LABELS[d.stage] || d.stage}: ${formatDuration(d.days)}`}
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {durations.map(d => (
                                <div key={d.stage} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5">
                                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STAGE_COLORS[d.stage] || 'bg-zinc-500'}`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs truncate">{STAGE_LABELS[d.stage] || d.stage}</p>
                                    </div>
                                    <span className="font-mono text-xs font-bold text-luxury-gold shrink-0">{formatDuration(d.days)}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center italic">
                            Calculé automatiquement à partir de l'historique du pipeline
                        </p>
                    </>
                ) : (
                    <div className="text-center py-6 text-muted-foreground">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Aucune donnée de temps disponible.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
