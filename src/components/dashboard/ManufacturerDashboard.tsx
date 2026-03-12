import { Project } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TrendingUp, Package, Clock, PenTool } from 'lucide-react';

interface ManufacturerDashboardProps {
    projects: Project[];
}

export function ManufacturerDashboard({ projects }: ManufacturerDashboardProps) {
    const ongoing = projects.filter(p => p.status === 'production');
    const waiting = projects.filter(p => p.status === 'approved_for_production');
    const delivery = projects.filter(p => p.status === 'delivery');
    const designs3d = projects.filter(p => p.status === '3d_model' || p.status === 'design_modification');

    const kpis = [
        { label: "En Production", count: ongoing.length, icon: TrendingUp, color: "text-purple-500" },
        { label: "À Démarrer", count: waiting.length, icon: Clock, color: "text-blue-500" },
        { label: "Designs 3D", count: designs3d.length, icon: PenTool, color: "text-indigo-500" },
        { label: "En Livraison", count: delivery.length, icon: Package, color: "text-amber-500" },
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
                            Modèles 3D / Rectifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-white/5 p-0">
                        {designs3d.length === 0 ? (
                            <p className="p-8 text-center text-xs uppercase tracking-widest text-muted-foreground">Aucun design en attente</p>
                        ) : (
                            designs3d.map(project => (
                                <div key={project.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-serif text-sm truncate group-hover:text-luxury-gold transition-colors">{project.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase border-indigo-500/30 text-indigo-500">
                                                {project.status === '3d_model' ? 'Modélisation 3D' : 'Rectification Design'}
                                            </Badge>
                                            {project.priority === 'rush' && (
                                                <Badge className="bg-red-500 hover:bg-red-600 text-white text-[8px] h-3 px-1 uppercase animate-pulse border-none">RUSH</Badge>
                                            )}
                                        </div>
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
                        <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            À Démarrer (Production)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-white/5 p-0">
                        {waiting.length === 0 ? (
                            <p className="p-8 text-center text-xs uppercase tracking-widest text-muted-foreground">Aucun projet prêt</p>
                        ) : (
                            waiting.map(project => (
                                <div key={project.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-serif text-sm truncate group-hover:text-luxury-gold transition-colors">{project.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                                {project.deadline && `Due: ${new Date(project.deadline).toLocaleDateString()}`}
                                            </p>
                                            {project.priority === 'rush' && (
                                                <Badge className="bg-red-500 hover:bg-red-600 text-white text-[8px] h-3 px-1 uppercase animate-pulse border-none">RUSH</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold hover:text-black text-[10px] uppercase font-bold" asChild>
                                        <Link to={`/dashboard/projects/${project.id}`}>Lancer</Link>
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
                            En Fabrication
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-white/5 p-0">
                        {ongoing.length === 0 ? (
                            <p className="p-8 text-center text-xs uppercase tracking-widest text-muted-foreground">Rien en cours</p>
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
                                            {project.priority === 'rush' && (
                                                <Badge className="bg-red-500 hover:bg-red-600 text-white text-[8px] h-3 px-1 uppercase animate-pulse border-none">RUSH</Badge>
                                            )}
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


