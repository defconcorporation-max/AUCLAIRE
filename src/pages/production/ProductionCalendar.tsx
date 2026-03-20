import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiProjects, Project } from '@/services/apiProjects';
import { apiUsers } from '@/services/apiUsers';
import { UserProfile } from '@/services/apiUsers';
import { Loader2, Calendar, Filter, Factory, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';

type ProductionStage = 'approved_for_production' | 'production' | 'delivery';

const STAGE_COLORS: Record<ProductionStage, string> = {
    approved_for_production: 'bg-yellow-500/80 border-yellow-400/50',
    production: 'bg-purple-500/80 border-purple-400/50',
    delivery: 'bg-amber-500/80 border-amber-400/50',
};

function getProjectStage(project: Project): ProductionStage | null {
    if (project.status === 'approved_for_production') return 'approved_for_production';
    if (project.status === 'production') return 'production';
    if (project.status === 'delivery') return 'delivery';
    return null;
}

function addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
        result.setDate(result.getDate() + 1);
        const dow = result.getDay();
        if (dow !== 0 && dow !== 6) added++;
    }
    return result;
}

function getStartDate(project: Project): Date {
    return new Date(project.updated_at || project.created_at);
}

function getEndDate(project: Project): Date {
    const delivery = project.stage_details?.delivery_date;
    if (delivery) return new Date(delivery);
    if (project.deadline) return new Date(project.deadline);
    return addBusinessDays(getStartDate(project), 21);
}

function getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
}

const WEEKS_COUNT = 14;
const ROW_HEIGHT = 52;

export default function ProductionCalendar() {
    const navigate = useNavigate();
    const { role, profile } = useAuth();
    const [filterManufacturer, setFilterManufacturer] = useState('');
    const [filterStage, setFilterStage] = useState<'' | ProductionStage>('');
    const [weekOffset, setWeekOffset] = useState(0);

    const { data: allProjects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll,
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: apiUsers.getAll,
        enabled: role === 'admin' || role === 'secretary',
    });

    const manufacturers = users.filter((u: UserProfile) => u.role === 'manufacturer');

    const { weekStart, weekEnd, projects } = useMemo(() => {
        const today = new Date();
        const start = getMonday(today);
        start.setDate(start.getDate() + weekOffset * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + WEEKS_COUNT * 7);

        let filtered = (allProjects || []).filter((p) => {
            const stage = getProjectStage(p);
            if (!stage) return false;
            if (filterStage && stage !== filterStage) return false;
            if (role === 'admin' || role === 'secretary') {
                if (filterManufacturer && p.manufacturer_id !== filterManufacturer) return false;
                return true;
            }
            if (role === 'manufacturer') {
                return p.manufacturer_id === profile?.id;
            }
            return false;
        });

        filtered = filtered.sort((a, b) => {
            if (a.priority === 'rush' && b.priority !== 'rush') return -1;
            if (a.priority !== 'rush' && b.priority === 'rush') return 1;
            return getStartDate(a).getTime() - getStartDate(b).getTime();
        });

        return { weekStart: start, weekEnd: end, projects: filtered };
    }, [allProjects, role, profile?.id, filterManufacturer, filterStage, weekOffset]);

    const totalMs = weekEnd.getTime() - weekStart.getTime();
    const nowMs = new Date().getTime();

    const weekLabels = useMemo(() => {
        const labels: { label: string; date: Date }[] = [];
        for (let i = 0; i < WEEKS_COUNT; i++) {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i * 7);
            labels.push({
                label: `S${i + 1}`,
                date: d,
            });
        }
        return labels;
    }, [weekStart]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-white tracking-wide">
                        Production Calendar
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">
                        Timeline view of projects in production stages.
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 p-1 glass-card rounded-xl border-white/10">
                        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(o => o - 4)} className="text-white/70 hover:text-white hover:bg-white/10">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)} className="text-xs text-white/70 hover:text-white hover:bg-white/10">
                            Aujourd'hui
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(o => o + 4)} className="text-white/70 hover:text-white hover:bg-white/10">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 p-3 glass-card rounded-xl border-white/10">
                        <Zap className="w-4 h-4 text-luxury-gold shrink-0" />
                        <label className="text-xs text-gray-400 uppercase tracking-wider shrink-0">
                            Stage
                        </label>
                        <select
                            className="h-8 rounded-lg border border-white/10 bg-black/40 dark:bg-black/40 text-sm text-white dark:text-white px-3 min-w-[160px] focus:border-luxury-gold/50 focus:ring-1 focus:ring-luxury-gold/30"
                            value={filterStage}
                            onChange={(e) => setFilterStage(e.target.value as '' | ProductionStage)}
                        >
                            <option value="">Tous les stages</option>
                            <option value="approved_for_production">Approuvé</option>
                            <option value="production">Production</option>
                            <option value="delivery">Livraison</option>
                        </select>
                    </div>

                    {(role === 'admin' || role === 'secretary') && (
                        <div className="flex items-center gap-2 p-3 glass-card rounded-xl border-white/10">
                            <Filter className="w-4 h-4 text-luxury-gold shrink-0" />
                            <label className="text-xs text-gray-400 uppercase tracking-wider shrink-0">
                                Manufacturier
                            </label>
                            <select
                                className="h-8 rounded-lg border border-white/10 bg-black/40 dark:bg-black/40 text-sm text-white dark:text-white px-3 min-w-[180px] focus:border-luxury-gold/50 focus:ring-1 focus:ring-luxury-gold/30"
                                value={filterManufacturer}
                                onChange={(e) => setFilterManufacturer(e.target.value)}
                            >
                                <option value="">Tous</option>
                                {manufacturers.map((m: UserProfile) => (
                                    <option key={m.id} value={m.id}>
                                        {m.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="glass-card border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-luxury-gold/80">
                        <Calendar className="w-4 h-4" />
                        {weekStart.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}{' '}
                        — {weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex gap-1 mt-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            Approuvé
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Production
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Livraison
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-white/10 text-white/60 border border-white/20">
                            Délai: 21 jours ouvrables
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[800px] relative">
                        {/* Today marker */}
                        {(() => {
                            const todayPct = ((nowMs - weekStart.getTime()) / totalMs) * 100;
                            if (todayPct >= 0 && todayPct <= 100) {
                                return (
                                    <div
                                        className="absolute top-0 bottom-0 z-20 pointer-events-none"
                                        style={{ left: `calc(192px + (100% - 192px) * ${todayPct / 100})` }}
                                    >
                                        <div className="w-0.5 h-full bg-red-500/70" />
                                        <div className="absolute top-0 -translate-x-1/2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-b font-medium whitespace-nowrap">
                                            Aujourd'hui
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {/* Timeline header */}
                        <div className="flex border-b border-white/10 bg-black/20">
                            <div className="w-48 shrink-0 p-3 border-r border-white/10 text-xs font-semibold uppercase tracking-wider text-luxury-gold/70">
                                Project
                            </div>
                            <div className="flex-1 flex">
                                {weekLabels.map((w) => (
                                    <div
                                        key={w.label}
                                        className="shrink-0 border-r border-white/5 text-center py-2"
                                        style={{ width: `${100 / WEEKS_COUNT}%`, minWidth: 60 }}
                                    >
                                        <span className="text-[10px] text-white/50 block">{w.label}</span>
                                        <span className="text-[10px] text-white/70">
                                            {w.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Project rows */}
                        {projects.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                <p>No projects in production stages.</p>
                                <p className="text-sm mt-1">
                                    Projects in design, approved, production, or delivery will appear here.
                                </p>
                            </div>
                        ) : (
                            projects.map((project) => {
                                const stage = getProjectStage(project) || 'approved_for_production';
                                const start = getStartDate(project);
                                const end = getEndDate(project);
                                const startMs = start.getTime() - weekStart.getTime();
                                const endMs = end.getTime() - weekStart.getTime();
                                const leftPct = Math.max(0, (startMs / totalMs) * 100);
                                const widthPct = Math.min(
                                    100 - leftPct,
                                    Math.max(5, ((endMs - startMs) / totalMs) * 100)
                                );

                                return (
                                    <div
                                        key={project.id}
                                        className="flex items-stretch border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                                        style={{ minHeight: ROW_HEIGHT }}
                                    >
                                        <div className="w-48 shrink-0 p-2 border-r border-white/10 flex flex-col justify-center">
                                            <div className="flex items-center gap-2">
                                                {project.priority === 'rush' && (
                                                    <span
                                                        className="shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse"
                                                        title="Rush"
                                                    />
                                                )}
                                                <button
                                                    onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                                                    className="text-left font-medium text-white hover:text-luxury-gold truncate transition-colors"
                                                >
                                                    {project.title}
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-white/50 truncate mt-0.5">
                                                {project.client?.full_name || '—'}
                                            </p>
                                            {project.manufacturer?.full_name && (
                                                <div className="flex items-center gap-1 mt-1 text-[10px] text-white/40">
                                                    <Factory className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{project.manufacturer.full_name}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 relative py-2 pr-2">
                                            <div className="relative h-full" style={{ minHeight: ROW_HEIGHT - 16 }}>
                                                <button
                                                    onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                                                    className={`absolute top-0 h-full rounded-lg border ${STAGE_COLORS[stage]} 
                                                        hover:opacity-95 transition-opacity shadow-lg
                                                        flex items-center justify-center overflow-hidden
                                                        group/bar min-w-[80px]`}
                                                    style={{
                                                        left: `${leftPct}%`,
                                                        width: `${widthPct}%`,
                                                    }}
                                                >
                                                    <span className="text-[11px] font-medium text-white truncate px-2 flex items-center gap-1">
                                                        {project.priority === 'rush' && (
                                                            <Zap className="w-3 h-3 shrink-0 text-red-200" />
                                                        )}
                                                        {project.reference_number || project.title}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                {projects.length} project{projects.length !== 1 ? 's' : ''} in production stages
            </p>
        </div>
    );
}
