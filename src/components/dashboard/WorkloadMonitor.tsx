import { useQuery } from '@tanstack/react-query';
import { apiUsers } from '@/services/apiUsers';
import { apiProjects } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Factory, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function WorkloadMonitor() {
    const { t } = useTranslation();
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: () => apiUsers.getAll()
    });

    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: () => apiProjects.getAll()
    });

    const manufacturers = users?.filter(u => u.role === 'manufacturer') || [];
    const activeProjects = projects?.filter(p => !['completed', 'cancelled', 'delivery'].includes(p.status)) || [];

    const workshopLoads = manufacturers.map(m => {
        // Design Load (3d_model or design_modification)
        const designProjects = activeProjects.filter(p => 
            p.manufacturer_id === m.id && ['3d_model', 'design_modification'].includes(p.status)
        );
        const designCapacity = m.design_capacity || 1;
        const designLoadPercent = Math.min(Math.round((designProjects.length / designCapacity) * 100), 100);

        // Production Load (approved_for_production, production)
        const prodProjects = activeProjects.filter(p => 
            p.manufacturer_id === m.id && ['approved_for_production', 'production'].includes(p.status)
        );
        const prodCapacity = m.production_capacity || 3;
        const prodLoadPercent = Math.min(Math.round((prodProjects.length / prodCapacity) * 100), 100);
        
        const getStatusColor = (percent: number) => {
            if (percent >= 100) return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
            if (percent > 80) return "bg-amber-500";
            return "bg-green-500";
        };

        return {
            ...m,
            designCount: designProjects.length,
            designLoadPercent,
            designStatusColor: getStatusColor(designLoadPercent),
            designCapacity,
            prodCount: prodProjects.length,
            prodLoadPercent,
            prodStatusColor: getStatusColor(prodLoadPercent),
            prodCapacity,
            // Overall load for "Best Choice" sorting
            loadPercentage: (designLoadPercent + prodLoadPercent) / 2
        };
    });

    // Suggest recommendation for new projects
    const bestChoice = [...workshopLoads].sort((a, b) => a.loadPercentage - b.loadPercentage)[0];

    return (
        <Card className="glass-card overflow-hidden relative border-luxury-gold/20">
            <CardHeader className="py-4 border-b border-white/5">
                <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
                    <Factory className="w-5 h-5 text-luxury-gold" />
                    {t('dashboard.workloadTitle')}
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest">{t('dashboard.workloadDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
                {bestChoice && (
                    <div className="bg-luxury-gold/5 border border-luxury-gold/20 rounded-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <Zap className="w-4 h-4 text-luxury-gold mt-0.5" />
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold">{t('dashboard.workloadOptimalTitle')}</p>
                            <p className="text-xs mt-1">
                                {t('dashboard.workloadOptimalBody', { name: bestChoice.full_name, pct: bestChoice.loadPercentage })}
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {workshopLoads.length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground py-8 uppercase tracking-widest">{t('dashboard.workloadEmpty')}</p>
                    ) : (
                        workshopLoads.map((m, idx) => (
                            <div key={m.id} className="space-y-3 p-3 rounded-lg border border-white/5 bg-white/[0.02] animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-luxury-gold">{m.full_name}</p>
                                    <div className="flex gap-1">
                                        {m.specialty?.slice(0, 2).map(s => (
                                            <span key={s} className="text-[7px] bg-white/5 px-1 rounded border border-white/5 uppercase opacity-60 font-bold">{s}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Design Capacity */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center px-0.5">
                                        <span className="text-[9px] uppercase tracking-tighter text-muted-foreground flex items-center gap-1">
                                            <Zap className="w-2 h-2 text-luxury-gold" /> {t('dashboard.workloadDesign3d')}
                                        </span>
                                        <span className="text-[9px] font-bold tabular-nums">
                                            {m.designCount}/{m.designCapacity}
                                        </span>
                                    </div>
                                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                                        <div 
                                            className={cn("h-full transition-all duration-700 rounded-full", m.designStatusColor)}
                                            style={{ width: `${m.designLoadPercent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Production Capacity */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center px-0.5">
                                        <span className="text-[9px] uppercase tracking-tighter text-muted-foreground flex items-center gap-1">
                                            <Factory className="w-2 h-2 text-blue-400" /> {t('dashboard.workloadProductionShort')}
                                        </span>
                                        <span className="text-[9px] font-bold tabular-nums">
                                            {m.prodCount}/{m.prodCapacity}
                                        </span>
                                    </div>
                                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                                        <div 
                                            className={cn("h-full transition-all duration-700 rounded-full", m.prodStatusColor)}
                                            style={{ width: `${m.prodLoadPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
