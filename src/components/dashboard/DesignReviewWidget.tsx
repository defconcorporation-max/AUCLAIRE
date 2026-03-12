import { Project } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronRight, PenTool } from 'lucide-react';

interface DesignReviewWidgetProps {
    projects: Project[];
}

export function DesignReviewWidget({ projects }: DesignReviewWidgetProps) {
    return (
        <Card className="glass-card">
            <CardHeader className="py-4 border-b border-white/5">
                <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-luxury-gold" />
                    Designs en Attente
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest text-luxury-gold/70">Awaiting Admin Approval</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                    {projects.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <p className="text-xs uppercase tracking-widest">Aucun design à valider</p>
                        </div>
                    ) : (
                        projects.map((project, idx) => (
                            <div
                                key={project.id}
                                className="p-4 hover:bg-white/5 transition-all group flex items-center justify-between gap-4 animate-in fade-in"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-serif text-sm truncate group-hover:text-luxury-gold transition-colors">{project.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                                            {project.affiliate?.full_name || 'Direct'}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                        <span className="text-[10px] font-bold text-luxury-gold tabular-nums">
                                            ${(project.budget || 0).toLocaleString()} Budget
                                        </span>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" className="h-8 border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold hover:text-black gap-2 text-[10px] uppercase tracking-widest font-bold" asChild>
                                    <Link to={`/dashboard/projects/${project.id}`}>
                                        Review <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
