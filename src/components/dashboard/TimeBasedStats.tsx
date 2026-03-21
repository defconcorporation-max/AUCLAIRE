import { Card } from '@/components/ui/card';
import { Activity, BarChart3, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TimeStats {
    count: number;
    volume: number;
    collected: number;
}

interface TimeBasedStatsProps {
    stats: {
        today: TimeStats;
        week: TimeStats;
        month: TimeStats;
    };
}

export function TimeBasedStats({ stats }: TimeBasedStatsProps) {
    const { t } = useTranslation();
    const periods = [
        { labelKey: 'dashboard.timeframeToday' as const, key: 'today', icon: Activity, color: "text-blue-500" },
        { labelKey: 'dashboard.timeframeWeek' as const, key: 'week', icon: BarChart3, color: "text-purple-500" },
        { labelKey: 'dashboard.timeframeMonth' as const, key: 'month', icon: CalendarDays, color: "text-luxury-gold" },
    ];

    return (
        <Card className="glass-card overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
                {periods.map((p, idx) => {
                    const data = stats[p.key as keyof typeof stats];
                    return (
                        <div 
                            key={p.key} 
                            className="p-6 hover:bg-white/5 transition-all group animate-in fade-in"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="flex items-center gap-2 mb-6 group-hover:translate-x-1 transition-transform">
                                <p.icon className={`w-4 h-4 ${p.color}`} />
                                <h3 className="font-serif text-sm tracking-widest uppercase">{t(p.labelKey)}</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('dashboard.timeStatsNewProjects')}</span>
                                    <span className="font-serif text-xl">{data.count}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('dashboard.timeStatsVolume')}</span>
                                    <span className="font-serif text-xl">${data.volume.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] uppercase tracking-widest text-green-500/70 font-bold">{t('dashboard.timeStatsCollected')}</span>
                                    <span className="font-serif text-xl text-green-500">${data.collected.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
