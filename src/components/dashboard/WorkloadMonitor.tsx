import { useQuery } from '@tanstack/react-query';
import { apiUsers } from '@/services/apiUsers';
import { apiProjects } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Factory, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorkloadMonitor() {
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
        const currentProjects = activeProjects.filter(p => p.manufacturer_id === m.id);
        const capacity = m.daily_capacity || 3; // Default capacity
        const loadPercentage = Math.min(Math.round((currentProjects.length / capacity) * 100), 100);
        
        let statusColor = "bg-green-500";
        if (loadPercentage > 80) statusColor = "bg-red-500";
        else if (loadPercentage > 50) statusColor = "bg-amber-500";

        return {
            ...m,
            projectCount: currentProjects.length,
            loadPercentage,
            statusColor,
            capacity
        };
    });

    // Suggest recommendation for new projects
    const bestChoice = [...workshopLoads].sort((a, b) => a.loadPercentage - b.loadPercentage)[0];

    return (
        <Card className="glass-card overflow-hidden relative border-luxury-gold/20">
            <CardHeader className="py-4 border-b border-white/5">
                <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
                    <Factory className="w-5 h-5 text-luxury-gold" />
                    Moniteur de Charge Ateliers
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest">Capacité & Flux de Production</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
                {bestChoice && (
                    <div className="bg-luxury-gold/5 border border-luxury-gold/20 rounded-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <Zap className="w-4 h-4 text-luxury-gold mt-0.5" />
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold">Assignation Optimale</p>
                            <p className="text-xs mt-1">
                                <span className="font-bold">{bestChoice.full_name}</span> est actuellement le plus disponible ({bestChoice.loadPercentage}% de charge).
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {workshopLoads.length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground py-8 uppercase tracking-widest">Aucun atelier configuré</p>
                    ) : (
                        workshopLoads.map((m, idx) => (
                            <div key={m.id} className="space-y-2 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">{m.full_name}</p>
                                        <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase border-white/10 text-muted-foreground">
                                            Capacité: {m.capacity}
                                        </Badge>
                                    </div>
                                    <p className="text-xs font-serif italic text-muted-foreground">{m.projectCount} projets actifs</p>
                                </div>
                                <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5">
                                    <div 
                                        className={cn("h-full transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)]", m.statusColor)}
                                        style={{ width: `${m.loadPercentage}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[9px] uppercase tracking-widest">
                                    <span className={cn("font-bold flex items-center gap-1", m.loadPercentage > 80 ? "text-red-500" : "text-muted-foreground")}>
                                        {m.loadPercentage > 80 ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                        Charge: {m.loadPercentage}%
                                    </span>
                                    <div className="flex gap-1">
                                        {m.specialty?.map(s => (
                                            <span key={s} className="text-[7px] bg-white/5 px-1 rounded border border-white/5">{s}</span>
                                        ))}
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
