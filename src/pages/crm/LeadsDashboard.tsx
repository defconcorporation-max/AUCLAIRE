import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Phone, Mail, Facebook, Filter, LayoutGrid, List as ListIcon, Loader2 } from 'lucide-react';
import { apiLeads, Lead, LeadStatus } from '@/services/apiLeads';
import { supabase } from '@/lib/supabase';

const parseSourceIcon = (source: string) => {
    switch (source) {
        case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
        case 'website': return <Filter className="w-4 h-4 text-purple-500" />;
        default: return <Plus className="w-4 h-4 text-gray-500" />;
    }
};

const LeadCard = ({ lead, onClick }: { lead: Lead, onClick: () => void }) => {
    return (
        <Card
            onClick={onClick}
            className="group cursor-pointer bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-sm shadow-sm hover:shadow-md border border-black/5 dark:border-white/5 hover:border-luxury-gold/50 transition-all duration-300 relative"
        >
            <CardContent className="p-4 relative">
                <div className="flex justify-between items-start mb-2 relative">
                    <div>
                        <h3 className="font-serif text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-luxury-gold transition-colors truncate pr-2">
                            {lead.name}
                        </h3>
                        {lead.value > 0 && (
                            <p className="text-xs font-semibold text-luxury-gold mt-0.5">${lead.value.toLocaleString()}</p>
                        )}
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full z-10" title={`Source: ${lead.source}`}>
                        {parseSourceIcon(lead.source)}
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                    {lead.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{lead.phone}</span>
                        </div>
                    )}
                    {lead.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate">{lead.email}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default function LeadsDashboard() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { data: leads = [], isLoading, error } = useQuery({
        queryKey: ['leads'],
        queryFn: apiLeads.getAll
    });

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('leads-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
                queryClient.invalidateQueries({ queryKey: ['leads'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: LeadStatus }) =>
            apiLeads.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        }
    });

    const columns: LeadStatus[] = ['new', 'contacted', 'qualified', 'won', 'lost'];

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (lead.phone?.includes(searchTerm));
        return matchesSearch;
    });

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        const newStatus = destination.droppableId as LeadStatus;

        // Optimistic update
        queryClient.setQueryData(['leads'], (old: Lead[] | undefined) => {
            if (!old) return [];
            return old.map(l => l.id === draggableId ? { ...l, status: newStatus } : l);
        });

        updateStatusMutation.mutate({ id: draggableId, status: newStatus });
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center text-red-500">
                Error loading leads. Please try again later.
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-luxury-gold tracking-wide">CRM & Leads</h2>
                    <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">Manage your pipeline.</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64 mr-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search leads..."
                            className="pl-9 h-9 bg-white/50 dark:bg-black/20 border-black/10 dark:border-white/10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="bg-muted p-1 rounded-md flex">
                        <button
                            className={`h-7 w-8 flex items-center justify-center rounded-sm transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm' : 'opacity-50 hover:opacity-100'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            className={`h-7 w-8 flex items-center justify-center rounded-sm transition-all ${viewMode === 'list' ? 'bg-background shadow-sm' : 'opacity-50 hover:opacity-100'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <Button className="bg-luxury-gold text-black hover:bg-luxury-gold/90 transition-all shadow-md ml-2 h-9">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Lead
                    </Button>
                </div>
            </div>

            {viewMode === 'grid' && (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex-1 flex gap-4 overflow-x-auto pb-8 snap-x min-h-[500px]">
                        {columns.map(status => {
                            const columnLeads = filteredLeads.filter(l => l.status === status);
                            return (
                                <div key={status} className="min-w-[280px] w-[280px] flex-shrink-0 snap-start flex flex-col">
                                    <div className="flex items-center justify-between px-1 pb-2 border-b border-black/10 dark:border-white/10 mb-2">
                                        <h3 className="font-semibold text-xs text-luxury-gold uppercase tracking-[0.2em]">
                                            {status === 'new' ? 'New Lead' : status}
                                        </h3>
                                        <span className="text-[10px] font-mono bg-luxury-gold/10 text-luxury-gold px-2.5 py-1 rounded-full ring-1 ring-luxury-gold/20">
                                            {columnLeads.length}
                                        </span>
                                    </div>

                                    <Droppable droppableId={status}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 space-y-3 p-1 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-black/5 dark:bg-white/5' : ''}`}
                                            >
                                                {columnLeads.map((lead, index) => (
                                                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                                                }}
                                                            >
                                                                <LeadCard
                                                                    lead={lead}
                                                                    onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                                                                />
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}

                                                {columnLeads.length === 0 && !snapshot.isDraggingOver && (
                                                    <div className="h-24 rounded-lg border-2 border-dashed border-black/5 dark:border-white/5 flex items-center justify-center">
                                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Empty</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            )
                        })}
                    </div>
                </DragDropContext>
            )}

            {viewMode === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredLeads.map(lead => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                        />
                    ))}
                    {filteredLeads.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg border-black/10 dark:border-white/10">
                            No leads found.
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
