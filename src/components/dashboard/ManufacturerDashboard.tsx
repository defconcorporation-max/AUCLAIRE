import { Project } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TrendingUp, Package, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ManufacturerDashboardProps {
    projects: Project[];
}

export function ManufacturerDashboard({ projects }: ManufacturerDashboardProps) {
    const ongoing = projects.filter(p => p.status === 'production');
    const waiting = projects.filter(p => p.status === 'approved_for_production');
    const delivery = projects.filter(p => p.status === 'delivery');

    const kpis = [
        { label: "En Production", count: ongoing.length, icon: TrendingUp, color: "text-purple-500" },
        { label: "À Démarrer", count: waiting.length, icon: Clock, color: "text-blue-500" },
        { label: "En Livraison", count: delivery.length, icon: Package, color: "text-amber-500" },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kpis.map((kpi, idx) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
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
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg font-serif tracking-wide">Commandes à Produire</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-widest text-blue-500/70 font-bold">Approuvé • En attente de lancement</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y divide-white/5 p-0">
                        {waiting.length === 0 ? (
                            <p className="p-8 text-center text-xs uppercase tracking-widest text-muted-foreground">Aucun projet en attente</p>
                        ) : (
                            waiting.map(project => (
                                <div key={project.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-serif text-sm truncate group-hover:text-luxury-gold transition-colors">{project.title}</h4>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                                            {project.priority === 'rush' && <span className="text-red-500 font-bold mr-2">RUSH</span>}
                                            {project.deadline && `Due: ${new Date(project.deadline).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold hover:text-black text-[10px] uppercase font-bold" asChild>
                                        <Link to={`/dashboard/projects/${project.id}`}>Voir</Link>
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg font-serif tracking-wide">Production en Cours</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-widest text-purple-500/70 font-bold">Actuellement sur l'établi</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y divide-white/5 p-0">
                        {ongoing.length === 0 ? (
                            <p className="p-8 text-center text-xs uppercase tracking-widest text-muted-foreground">Rien en cours de fabrication</p>
                        ) : (
                            ongoing.map(project => (
                                <div key={project.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-serif text-sm truncate group-hover:text-luxury-gold transition-colors">{project.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase border-purple-500/30 text-purple-500">En Production</Badge>
                                            <span className="text-[10px] text-muted-foreground">
                                                {project.deadline && `Due: ${new Date(project.deadline).toLocaleDateString()}`}
                                            </span>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold hover:text-black text-[10px] uppercase font-bold" asChild>
                                        <Link to={`/dashboard/projects/${project.id}`}>Détails</Link>
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
