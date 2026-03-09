import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiProjects, ProjectStatus, Project } from '@/services/apiProjects'
import { apiUsers } from '@/services/apiUsers'
import { ProjectCard } from '@/components/ui/ProjectCard'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, List as ListIcon, Loader2, Filter, X } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

export default function ProjectsList() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const { role, profile } = useAuth()
    const containerRef = useRef<HTMLDivElement>(null)
    const topScrollRef = useRef<HTMLDivElement>(null)

    const { data: allProjects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll
    })

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: apiUsers.getAll,
        enabled: role === 'admin' || role === 'secretary'
    })

    const affiliates = (users as any[]).filter(u => u.role === 'affiliate' || u.role === 'admin')
    const manufacturers = (users as any[]).filter(u => u.role === 'manufacturer')

    const [filterAffiliate, setFilterAffiliate] = useState('')
    const [filterManufacturer, setFilterManufacturer] = useState('')

    // Role-based base filter
    const baseProjects = allProjects?.filter(p => {
        if (role === 'admin' || role === 'secretary') return true;
        if (role === 'manufacturer') return (p as any).manufacturer_id === profile?.id;
        if (role === 'affiliate') {
            return p.sales_agent_id === profile?.id || p.affiliate_id === profile?.id;
        }
        return false;
    }) || []

    // Admin/Secretary secondary filters
    const projects = (role === 'admin' || role === 'secretary') ? baseProjects.filter(p => {
        if (filterAffiliate && p.affiliate_id !== filterAffiliate) return false;
        if (filterManufacturer && (p as any).manufacturer_id !== filterManufacturer) return false;
        return true;
    }) : baseProjects;

    const hasActiveFilter = !!filterAffiliate || !!filterManufacturer;

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: ProjectStatus }) =>
            apiProjects.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
        }
    })

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    const columns: ProjectStatus[] = ['designing', '3d_model', 'design_ready', 'design_modification', 'approved_for_production', 'production', 'delivery', 'completed']

    // Sync scrollbars
    useEffect(() => {
        const topScroll = topScrollRef.current
        const mainContainer = containerRef.current

        if (!topScroll || !mainContainer) return

        const handleTopScroll = () => {
            if (mainContainer.scrollLeft !== topScroll.scrollLeft) {
                mainContainer.scrollLeft = topScroll.scrollLeft
            }
        }

        const handleMainScroll = () => {
            if (topScroll.scrollLeft !== mainContainer.scrollLeft) {
                topScroll.scrollLeft = mainContainer.scrollLeft
            }
        }

        topScroll.addEventListener('scroll', handleTopScroll)
        mainContainer.addEventListener('scroll', handleMainScroll)

        return () => {
            topScroll.removeEventListener('scroll', handleTopScroll)
            mainContainer.removeEventListener('scroll', handleMainScroll)
        }
    }, [projects, viewMode])

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result
        if (!destination) return
        if (destination.droppableId === source.droppableId && destination.index === source.index) return

        const newStatus = destination.droppableId as ProjectStatus

        // Optimistic update
        queryClient.setQueryData(['projects'], (old: Project[] | undefined) => {
            if (!old) return []
            return old.map(p => p.id === draggableId ? { ...p, status: newStatus } : p)
        })

        updateStatusMutation.mutate({ id: draggableId, status: newStatus })
    }

    if (isLoading) return (
        <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
        </div>
    )

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
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

            {/* Filters — admin/secretary */}
            {(role === 'admin' || role === 'secretary') && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-xl">
                    <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex flex-wrap gap-3 flex-1">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400 uppercase tracking-wider shrink-0">Ambassador</label>
                            <select
                                className="h-7 rounded border border-white/10 bg-black/40 text-xs text-white px-2 min-w-[150px]"
                                value={filterAffiliate}
                                onChange={e => setFilterAffiliate(e.target.value)}
                            >
                                <option value="">All</option>
                                {affiliates.map((a: any) => (
                                    <option key={a.id} value={a.id}>{a.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400 uppercase tracking-wider shrink-0">Manufacturer</label>
                            <select
                                className="h-7 rounded border border-white/10 bg-black/40 text-xs text-white px-2 min-w-[150px]"
                                value={filterManufacturer}
                                onChange={e => setFilterManufacturer(e.target.value)}
                            >
                                <option value="">All</option>
                                {manufacturers.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.full_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {hasActiveFilter && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-400 hover:text-white gap-1 h-7 px-2"
                            onClick={() => { setFilterAffiliate(''); setFilterManufacturer(''); }}
                        >
                            <X className="w-3 h-3" /> Clear
                        </Button>
                    )}
                    <span className="text-xs text-gray-500 ml-auto">
                        {projects.length} project{projects.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Kanban View */}
            {viewMode === 'grid' && (
                <div className="flex flex-col min-h-0">
                    {/* Top Scrollbar Mirror */}
                    <div
                        ref={topScrollRef}
                        className="overflow-x-auto overflow-y-hidden h-4 mb-2 scrollbar-thin scrollbar-thumb-luxury-gold/20"
                    >
                        <div style={{ width: `${columns.length * 344}px` }} className="h-1" />
                    </div>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <div
                            ref={containerRef}
                            className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-thin scrollbar-thumb-luxury-gold/50"
                        >
                            {columns.map(status => {
                                const columnProjects = projects?.filter(p => p.status === status) || [];
                                const columnTotal = columnProjects.reduce((sum, p) => sum + (p.financials?.selling_price || p.budget || 0), 0);

                                return (
                                    <div key={status} className="min-w-[320px] w-[320px] flex-shrink-0 snap-start flex flex-col h-full">
                                        <div className="flex items-center justify-between px-1 pb-3 border-b border-white/10 mb-4 h-12">
                                            <div>
                                                <h3 className="font-semibold text-[10px] text-luxury-gold uppercase tracking-[0.2em] mb-1">
                                                    {status.replace(/_/g, ' ')}
                                                </h3>
                                                {(role === 'admin' || role === 'secretary') && (
                                                    <p className="text-sm font-serif text-white/90">
                                                        {columnTotal > 0 ? `$${columnTotal.toLocaleString()}` : '-'}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-mono bg-luxury-gold/10 text-luxury-gold px-2.5 py-1 rounded-full ring-1 ring-luxury-gold/20">
                                                {columnProjects.length}
                                            </span>
                                        </div>

                                        <Droppable droppableId={status}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`flex-1 space-y-4 min-h-[500px] p-1 rounded-xl transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-white/5' : ''
                                                        }`}
                                                >
                                                    {columnProjects.map((project, index) => (
                                                        <Draggable key={project.id} draggableId={project.id} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    style={{
                                                                        ...provided.draggableProps.style,
                                                                        transform: snapshot.isDragging
                                                                            ? provided.draggableProps.style?.transform
                                                                            : 'none'
                                                                    }}
                                                                    className={`${snapshot.isDragging ? 'z-50' : ''}`}
                                                                >
                                                                    <ProjectCard
                                                                        project={project}
                                                                        onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                )
                            })}
                        </div>
                    </DragDropContext>
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
