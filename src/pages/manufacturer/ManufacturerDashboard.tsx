import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiProjects } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Pencil, Layers, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
    initial_design: 'Initial Design',
    '3d_modeling': '3D Modeling',
    design_ready: 'Design Ready',
    approved_for_production: 'Approved for Production',
    production: 'In Production',
    delivery: 'Delivery',
    completed: 'Completed',
};

export default function ManufacturerDashboard() {
    const navigate = useNavigate();

    const { data: allProjects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll,
    });

    const designRequests = allProjects.filter((p: any) => p.status === 'initial_design');
    const modeling = allProjects.filter((p: any) => p.status === '3d_modeling');
    const designReady = allProjects.filter((p: any) => p.status === 'design_ready');
    const inProduction = allProjects.filter((p: any) => ['approved_for_production', 'production'].includes(p.status));

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-luxury-gold" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-serif text-gray-900 dark:text-white">Atelier</h1>
                <p className="text-gray-500 mt-1">Tableau de bord de fabrication</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Demandes de Design</CardTitle>
                        <Pencil className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-serif text-amber-600 dark:text-amber-400">{designRequests.length}</div>
                        <p className="text-xs text-amber-600/70 mt-1">En attente de design initial</p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Modélisation 3D</CardTitle>
                        <Layers className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-serif text-blue-600 dark:text-blue-400">{modeling.length}</div>
                        <p className="text-xs text-blue-600/70 mt-1">Projets en modélisation</p>
                    </CardContent>
                </Card>

                <Card className="bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Prêts à valider</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-serif text-purple-600 dark:text-purple-400">{designReady.length}</div>
                        <p className="text-xs text-purple-600/70 mt-1">Design finalisé</p>
                    </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">En Production</CardTitle>
                        <Clock className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-serif text-green-600 dark:text-green-400">{inProduction.length}</div>
                        <p className="text-xs text-green-600/70 mt-1">En cours de fabrication</p>
                    </CardContent>
                </Card>
            </div>

            {/* Design Requests — highest priority */}
            <ProjectTable
                title="🎨 Demandes de Design Initial"
                subtitle="Ces projets nécessitent un premier design"
                projects={designRequests}
                badgeClass="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                navigate={navigate}
                emptyMessage="Aucune demande de design en attente."
            />

            {/* 3D Modeling */}
            <ProjectTable
                title="🔷 Modélisation 3D en cours"
                subtitle="Ces projets sont en phase de modélisation"
                projects={modeling}
                badgeClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                navigate={navigate}
                emptyMessage="Aucun projet en modélisation 3D."
            />

            {/* Design Ready */}
            {designReady.length > 0 && (
                <ProjectTable
                    title="✅ Design Finalisé — En attente d'approbation"
                    subtitle="Prêts pour validation client"
                    projects={designReady}
                    badgeClass="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    navigate={navigate}
                />
            )}
        </div>
    );
}

function ProjectTable({ title, subtitle, projects, badgeClass, navigate, emptyMessage }: {
    title: string;
    subtitle: string;
    projects: any[];
    badgeClass: string;
    navigate: (path: string) => void;
    emptyMessage?: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-serif">{title}</CardTitle>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50 dark:bg-zinc-900/50">
                                <TableHead>Projet</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Deadline</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                                        {emptyMessage || 'Aucun projet.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                projects.map((p: any) => (
                                    <TableRow key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer" onClick={() => navigate(`/dashboard/projects/${p.id}`)}>
                                        <TableCell className="font-medium">
                                            <div>{p.title}</div>
                                            {p.description && (
                                                <div className="text-xs text-muted-foreground truncate max-w-48">{p.description}</div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {p.client?.full_name || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-xs ${badgeClass}`}>
                                                {STATUS_LABELS[p.status] || p.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {p.deadline ? (
                                                <span className={new Date(p.deadline) < new Date() ? 'text-red-500 font-semibold' : 'text-muted-foreground'}>
                                                    {new Date(p.deadline).toLocaleDateString('fr-CA')}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/projects/${p.id}`); }}>
                                                Ouvrir <ArrowRight className="w-3 h-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
