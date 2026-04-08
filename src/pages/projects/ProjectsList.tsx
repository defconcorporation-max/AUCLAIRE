import { UserProfile } from '@/services/apiUsers';
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiProjects, ProjectStatus, Project } from '@/services/apiProjects'
import { apiUsers } from '@/services/apiUsers'
import { apiActivities } from '@/services/apiActivities'
import { ProjectCard, getProjectThumbnail } from '@/components/ui/ProjectCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, List as ListIcon, Loader2, Filter, X, Search, Calendar, ChevronRight, ImageIcon } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Input } from '@/components/ui/input'

export default function ProjectsList() {
    const { t, i18n } = useTranslation()
    const statusLabel = (s: string) =>
        t(`projectStatus.${s}`, { defaultValue: s.replace(/_/g, ' ') })
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

    const affiliates = users.filter(u => u.role === 'affiliate' || u.role === 'admin')
    const manufacturers = users.filter(u => u.role === 'manufacturer')

    const [filterAffiliate, setFilterAffiliate] = useState('')
    const [filterManufacturer, setFilterManufacturer] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    const sortByRush = (a: Project, b: Project) => {
        if (a.priority === 'rush' && b.priority !== 'rush') return -1;
        if (a.priority !== 'rush' && b.priority === 'rush') return 1;
        return 0;
    };

    const baseProjects = allProjects?.filter(p => {
        if (role === 'admin' || role === 'secretary') return true;
        if (role === 'manufacturer') return p.manufacturer_id === profile?.id;
        if (role === 'affiliate') {
            return p.sales_agent_id === profile?.id || p.affiliate_id === profile?.id;
        }
        return false;
    }) || []

    const projects = baseProjects.filter(p => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesName = p.title?.toLowerCase().includes(query);
            const matchesRef = p.reference_number?.toLowerCase().includes(query);
            if (!matchesName && !matchesRef) return false;
        }

        if (role === 'admin' || role === 'secretary') {
            if (filterAffiliate && p.affiliate_id !== filterAffiliate) return false;
            if (filterManufacturer && p.manufacturer_id !== filterManufacturer) return false;
        }

        return true;
    }).sort((a, b) => {
        const rush = sortByRush(a, b);
        if (rush !== 0) return rush;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const hasActiveFilter = !!filterAffiliate || !!filterManufacturer || !!searchQuery;

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: ProjectStatus }) =>
            apiProjects.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
        }
    })

    const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() => {
        return window.innerWidth < 768 ? 'list' : 'kanban';
    })

    const columns: ProjectStatus[] = ['designing', '3d_model', 'design_ready', 'design_modification', 'approved_for_production', 'production', 'delivery', 'completed', 'waiting_for_approval']

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

        const projectToUpdate = projects?.find((p) => p.id === draggableId)

        queryClient.setQueryData(['projects'], (old: Project[] | undefined) => {
            if (!old) return []
            return old.map(p => p.id === draggableId ? { ...p, status: newStatus } as Project : p)
        })

        updateStatusMutation.mutate({ id: draggableId, status: newStatus })

        if (projectToUpdate && projectToUpdate.status !== newStatus) {
            apiActivities.log({
                project_id: draggableId,
                user_id: profile?.id || 'admin',
                user_name: profile?.full_name || 'Admin',
                action: 'status_change',
                details: t('projectsPage.statusChangeViaKanban', {
                    from: statusLabel(projectToUpdate.status),
                    to: statusLabel(newStatus),
                })
            }).then(() => {
                queryClient.invalidateQueries({ queryKey: ['activities', draggableId] });
            })
        }
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
                    <h2 className="text-3xl font-serif font-bold text-white tracking-wide">{t('projectsPage.title')}</h2>
                    <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">{t('projectsPage.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-64 md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-luxury-gold transition-colors" />
                        <Input 
                            placeholder={t('projectsPage.searchPlaceholder')}
                            className="pl-10 bg-white/5 border-white/10 focus:border-luxury-gold/50 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="bg-muted p-1 rounded-md flex">
                        <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t('projectsPage.kanbanViewAria')}
                            className={viewMode === 'kanban' ? 'bg-background shadow-sm' : ''}
                            onClick={() => setViewMode('kanban')}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t('projectsPage.listViewAria')}
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
                        {t('projectsPage.newProject')}
                    </Button>
                </div>
            </div>

            {(role === 'admin' || role === 'secretary') && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-xl">
                    <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex flex-wrap gap-3 flex-1">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400 uppercase tracking-wider shrink-0">{t('projectsPage.affiliate')}</label>
                            <select
                                className="h-7 rounded border border-white/10 bg-black/40 text-xs text-white px-2 min-w-[150px]"
                                value={filterAffiliate}
                                onChange={e => setFilterAffiliate(e.target.value)}
                            >
                                <option value="">{t('projectsPage.all')}</option>
                                {affiliates.map((a: UserProfile) => (
                                    <option key={a.id} value={a.id}>{a.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400 uppercase tracking-wider shrink-0">{t('projectsPage.manufacturer')}</label>
                            <select
                                className="h-7 rounded border border-white/10 bg-black/40 text-xs text-white px-2 min-w-[150px]"
                                value={filterManufacturer}
                                onChange={e => setFilterManufacturer(e.target.value)}
                            >
                                <option value="">{t('projectsPage.all')}</option>
                                {manufacturers.map((m: UserProfile) => (
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
                            onClick={() => { setFilterAffiliate(''); setFilterManufacturer(''); setSearchQuery(''); }}
                        >
                            <X className="w-3 h-3" /> {t('projectsPage.clear')}
                        </Button>
                    )}
                    <span className="text-xs text-gray-500 ml-auto">
                        {t('projectsPage.countProjects', { count: projects.length })}
                    </span>
                </div>
            )}

            {/* Kanban View */}
            {viewMode === 'kanban' && (
                <div className="flex flex-col min-h-0">
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
                                                    {statusLabel(status)}
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

            {/* List View */}
            {viewMode === 'list' && (
                projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                            <Search className="w-7 h-7 text-white/20" />
                        </div>
                        <p className="text-white/60 font-serif text-lg">{t('projectsPage.noProjectsFound')}</p>
                        <p className="text-white/30 text-sm mt-1">
                            {hasActiveFilter
                                ? t('projectsPage.tryFilters')
                                : t('projectsPage.createFirst')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {projects.map(project => {
                            const isRush = project.priority === 'rush';
                            const price = project.financials?.selling_price || project.budget;
                            const thumb = getProjectThumbnail(project);

                            return (
                                <div
                                    key={project.id}
                                    onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                                    className={`
                                        group cursor-pointer relative overflow-hidden rounded-xl
                                        bg-white/[0.03] backdrop-blur-sm border transition-all duration-200
                                        ${isRush
                                            ? 'border-red-500/40 hover:border-red-500/60'
                                            : 'border-white/10 hover:border-luxury-gold/40'}
                                        hover:bg-white/[0.06]
                                    `}
                                >
                                    {isRush && (
                                        <div className="absolute inset-y-0 left-0 w-0.5 bg-red-500" />
                                    )}

                                    <div className="flex items-center gap-4 px-4 py-3">
                                        {isRush && (
                                            <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                        )}

                                        {/* Thumbnail */}
                                        <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                                            {thumb ? (
                                                <img
                                                    src={thumb}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <ImageIcon className="w-5 h-5 text-white/20" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                {project.reference_number && (
                                                    <span className="text-[10px] font-mono text-luxury-gold/50 tracking-wider shrink-0">
                                                        {project.reference_number}
                                                    </span>
                                                )}
                                                <h3 className={`font-serif text-sm font-semibold truncate ${isRush ? 'text-red-400' : 'text-white group-hover:text-luxury-gold'} transition-colors`}>
                                                    {project.title}
                                                </h3>
                                            </div>
                                            <p className="text-[11px] text-white/40 truncate mt-0.5">
                                                {project.client?.full_name || '—'}
                                            </p>
                                        </div>

                                        <div className="shrink-0 hidden sm:block">
                                            <StatusBadge status={project.status} />
                                        </div>

                                        {price != null && role !== 'manufacturer' && role !== 'client' && (
                                            <span className="shrink-0 hidden md:block font-mono text-xs text-luxury-gold/80">
                                                ${Number(price).toLocaleString()}
                                            </span>
                                        )}

                                        <span className="shrink-0 hidden lg:flex items-center gap-1 text-[10px] text-white/30">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(project.created_at).toLocaleDateString(
                                                i18n.language.startsWith('en') ? 'en-US' : 'fr-FR',
                                                { day: 'numeric', month: 'short' }
                                            )}
                                        </span>

                                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-luxury-gold/50 transition-colors shrink-0" />
                                    </div>

                                    <div className="sm:hidden px-4 pb-3 -mt-1">
                                        <StatusBadge status={project.status} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    )
}
