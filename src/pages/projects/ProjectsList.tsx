
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiProjects, ProjectStatus } from '@/services/apiProjects'
import { ProjectCard } from '@/components/ui/ProjectCard'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, List as ListIcon } from 'lucide-react'

export default function ProjectsList() {
    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll
    })
    const navigate = useNavigate()

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    const columns: ProjectStatus[] = ['designing', '3d_model', 'design_ready', 'design_modification', 'approved_for_production', 'production', 'delivery', 'completed']

    if (isLoading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-luxury-gold">Projects</h2>
                    <p className="text-muted-foreground">Manage your design pipeline.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-muted p-1 rounded-md flex">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={viewMode === 'grid' ? 'bg-background shadow-sm' : ''}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={viewMode === 'list' ? 'bg-background shadow-sm' : ''}
                            onClick={() => setViewMode('list')}
                        >
                            <ListIcon className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button
                        className="bg-luxury-gold text-black hover:bg-luxury-gold-dark"
                        onClick={() => navigate('/dashboard/projects/new')}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Project
                    </Button>
                </div>
            </div>

            {/* Kanban View */}
            {viewMode === 'grid' && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {columns.map(status => (
                        <div key={status} className="min-w-[300px] w-[300px] flex-shrink-0 space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{status.replace('_', ' ')}</h3>
                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                    {projects?.filter(p => p.status === status).length}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {projects?.filter(p => p.status === status).map(project => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List View placeholder for now */}
            {viewMode === 'list' && (
                <div className="grid gap-4">
                    {projects?.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
