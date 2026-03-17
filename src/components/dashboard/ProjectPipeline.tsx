import { Project, apiProjects, ProjectStatus } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, AlertCircle, TrendingUp, Package, ChevronRight, HandCoins } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ProjectPipelineProps {
    design: Project[];
    pending: Project[];
    ongoing: Project[];
    delivery: Project[];
    role: string;
}

export function ProjectPipeline({ design, pending, ongoing, delivery, role: _role }: ProjectPipelineProps) {
    const { user } = useAuth();
    const categories = [
        { id: 'design', label: 'Design', icon: Clock, data: design, color: 'text-blue-500' },
        { id: 'pending', label: 'Ready', icon: AlertCircle, data: pending, color: 'text-green-500' },
        { id: 'ongoing', label: 'Production', icon: TrendingUp, data: ongoing, color: 'text-purple-500' },
        { id: 'delivery', label: 'Delivery', icon: Package, data: delivery, color: 'text-amber-500' },
    ];

    const handleAction = async (id: string, status: ProjectStatus, confirmMsg: string) => {
        if (confirm(confirmMsg)) {
            const userContext = user ? { id: user.id, name: user.user_metadata?.full_name || 'Utilisateur' } : undefined;
            await apiProjects.updateStatus(id, status, userContext);
            window.location.reload();
        }
    };

    return (
        <Card className="glass-card overflow-hidden">
            <CardHeader className="py-4 border-b border-white/5">
                <CardTitle className="text-lg font-serif tracking-wide flex items-center justify-between">
                    <span>Flux de Production</span>
                    <Badge variant="outline" className="text-[10px] tracking-widest uppercase border-white/20">
                        {design.length + pending.length + ongoing.length + delivery.length} Total
                    </Badge>
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest">Suivi des étapes de fabrication</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="design" className="w-full">
                    <TabsList className="w-full justify-start rounded-none bg-black/5 dark:bg-black/20 p-1 h-auto border-b border-white/5">
                        {categories.map(cat => (
                            <TabsTrigger 
                                key={cat.id} 
                                value={cat.id}
                                className="flex-1 py-2 text-[10px] uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-luxury-gold gap-2"
                            >
                                <cat.icon className={`w-3 h-3 ${cat.color}`} />
                                <span className="hidden sm:inline">{cat.label}</span>
                                <span className="ml-auto opacity-50 tabular-nums">{cat.data.length}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    
                    {categories.map(cat => (
                        <TabsContent key={cat.id} value={cat.id} className="m-0 focus-visible:outline-none">
                            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                                {cat.data.length === 0 ? (
                                    <div className="p-12 text-center text-muted-foreground">
                                        <p className="text-xs uppercase tracking-widest">Rien en cours ici</p>
                                    </div>
                                ) : (
                                    cat.data.map((project, idx) => (
                                        <div
                                            key={project.id}
                                            className="p-3 hover:bg-white/5 transition-colors group relative border-l-2 border-transparent hover:border-luxury-gold/50 animate-in fade-in slide-in-from-bottom-1"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-serif text-sm truncate group-hover:text-luxury-gold transition-colors">{project.title}</h4>
                                                        {project.priority === 'rush' && (
                                                            <Badge variant="destructive" className="h-4 text-[8px] px-1 uppercase leading-none bg-red-500/80 animate-pulse">RUSH</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <HandCoins className="w-2.5 h-2.5" /> {project.affiliate?.full_name || 'Direct'}
                                                        </span>
                                                        {project.deadline && (
                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                <Clock className="w-2.5 h-2.5" /> {new Date(project.deadline).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-tighter">
                                                            {project.manufacturer?.full_name || 'No Factory'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                                                        <Link to={`/dashboard/projects/${project.id}`}>
                                                            <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-luxury-gold" />
                                                        </Link>
                                                    </Button>
                                                    
                                                    {cat.id === 'pending' && (
                                                         <Button 
                                                            size="sm" 
                                                            className="h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                                                            onClick={() => handleAction(project.id, 'production', "Start production for this project?")}
                                                        >
                                                            Générer Production
                                                        </Button>
                                                    )}
                                                    
                                                    {cat.id === 'ongoing' && (
                                                        <Button 
                                                            size="sm" 
                                                            className="h-7 text-[10px] bg-purple-600 hover:bg-purple-700 text-white"
                                                            onClick={() => handleAction(project.id, 'delivery', "Production finished? Send to delivery?")}
                                                        >
                                                            Prêt pour Livraison
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}
