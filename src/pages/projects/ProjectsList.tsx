
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-white tracking-wide">Projects</h2>
                    <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">Manage your design pipeline.</p>
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
                <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
                    {columns.map(status => {
                        const columnProjects = projects?.filter(p => p.status === status);
                        return (
                            <div key={status} className="min-w-[320px] w-[320px] flex-shrink-0 snap-start space-y-4">
                                <div className="flex items-center justify-between px-1 pb-2 border-b border-white/10">
                                    <h3 className="font-semibold text-xs text-luxury-gold uppercase tracking-[0.2em]">{status.replace(/_/g, ' ')}</h3>
                                    <span className="text-[10px] font-mono bg-luxury-gold/10 text-luxury-gold px-2.5 py-1 rounded-full ring-1 ring-luxury-gold/20">
                                        {columnProjects?.length || 0}
                                    </span>
                                </div>

                                <div className="space-y-4 pt-2">
                                    {columnProjects?.map(project => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
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
