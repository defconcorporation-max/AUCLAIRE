import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { 
    Calendar, 
    User, 
    CheckCircle2, 
    Circle, 
    Clock, 
    ExternalLink,
    Search,
    Loader2,
    CheckSquare,
    MessageSquare,
    Sparkles,
    Image as ImageIcon
} from 'lucide-react';
import { apiTasks, Task } from '@/services/apiTasks';
import { useAuth } from '@/context/AuthContext';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

export default function Tasks() {
    const { role, user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
    const [viewOnlyMine, setViewOnlyMine] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summary, setSummary] = useState<{ summary: string; images: string[] } | null>(null);

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: apiTasks.getAll
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: Task['status'] }) =>
            apiTasks.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (selectedTask) {
                setSelectedTask(prev => prev ? { ...prev, status: prev.status === 'completed' ? 'pending' : 'completed' } as Task : null);
            }
        }
    });

    const filteredTasks = (Array.isArray(tasks) ? tasks : []).filter(task => {
        if (!task) return false;
        const matchesSearch = ((task.title || "").toLowerCase().includes((searchTerm || "").toLowerCase())) || 
                             ((task.description || "").toLowerCase().includes((searchTerm || "").toLowerCase()));
        const matchesFilter = filter === 'all' || task.status === filter;
        const matchesOwnership = !viewOnlyMine || task.assigned_to === user?.id;
        return matchesSearch && matchesFilter && matchesOwnership;
    });

    const handleToggleStatus = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        updateStatusMutation.mutate({ id: task.id, status: newStatus });
    };
    const fetchSummary = async (task: Task) => {
        const metadata = task.metadata || {};
        const contactId = metadata.contact_id || metadata.contact?.id || metadata.contactId || metadata.cid;
        const locationId = metadata.location_id || metadata.location?.id || metadata.locationId;

        if (!contactId) {
            toast({
                title: "Information manquante",
                description: "Impossible de trouver l'ID du contact GHL pour cette tâche.",
                variant: "destructive"
            });
            return;
        }

        setSummaryLoading(true);
        try {
            const res = await apiTasks.getConversationSummary(contactId, locationId);
            if (res && 'error' in res) {
                toast({
                    title: "Erreur GHL",
                    description: (res as any).error || "Une erreur est survenue lors de la récupération.",
                    variant: "destructive"
                });
                setSummary(null);
            } else if (res && 'summary' in res) {
                setSummary(res as { summary: string; images: string[] });
            }
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Impossible de récupérer le résumé de la conversation.",
                variant: "destructive"
            });
        } finally {
            setSummaryLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header section remains same */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-luxury-gold tracking-wide">Tâches & Synchronisation</h2>
                    <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" /> 
                        Flux en direct de GoHighLevel
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Rechercher une tâche..." 
                            className="pl-9 bg-white/50 dark:bg-black/20 border-black/10 dark:border-white/10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {role === 'admin' && (
                        <Button 
                            variant={viewOnlyMine ? "outline" : "default"}
                            className={!viewOnlyMine ? "bg-luxury-gold text-black" : ""}
                            onClick={() => setViewOnlyMine(!viewOnlyMine)}
                        >
                            {viewOnlyMine ? "Tout voir" : "Mes tâches uniquement"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-lg w-fit">
                {(['pending', 'completed', 'all'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-widest transition-all ${
                            filter === f 
                            ? 'bg-white dark:bg-zinc-800 text-luxury-gold shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {f === 'pending' ? 'En cours' : f === 'completed' ? 'Terminées' : 'Toutes'}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="grid grid-cols-1 gap-4">
                {(Array.isArray(filteredTasks) && filteredTasks.length > 0) ? (
                    filteredTasks.map(task => (
                        <Card 
                            key={task.id} 
                            onClick={() => {
                                setSelectedTask(task);
                                setSummary(null);
                            }}
                            className={`group border-none overflow-hidden transition-all duration-300 cursor-pointer ${
                                task.status === 'completed' ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-lg hover:shadow-luxury-gold/5 ring-1 ring-black/5 dark:ring-white/5 hover:translate-x-1'
                            }`}
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                task.status === 'completed' ? 'bg-green-500' : 'bg-luxury-gold'
                            }`} />
                            
                            <CardContent className="p-5 flex items-start gap-4">
                                <button 
                                    onClick={(e) => handleToggleStatus(e, task)}
                                    className="mt-1 transition-transform hover:scale-110 active:scale-90"
                                >
                                    {task.status === 'completed' 
                                        ? <CheckCircle2 className="w-6 h-6 text-green-500" /> 
                                        : <Circle className="w-6 h-6 text-luxury-gold/40 hover:text-luxury-gold" />
                                    }
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className={`font-medium text-lg leading-tight ${
                                                task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground font-serif'
                                            }`}>
                                                {task.title}
                                            </h3>
                                            {task.description && (
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>
                                        {task.priority !== 'normal' && (
                                            <Badge variant="outline" className={`capitalize ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-4">
                                        {task.due_date && isValid(new Date(task.due_date)) && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>Échéance: {format(new Date(task.due_date), 'PPP', { locale: fr })}</span>
                                            </div>
                                        )}
                                        {task.assigned_to_profile && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <User className="w-3.5 h-3.5 text-luxury-gold/60" />
                                                <span>Assigné à: <span className="text-foreground font-medium">{task.assigned_to_profile.full_name}</span></span>
                                            </div>
                                        )}
                                        {task.client && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground border-l border-black/10 dark:border-white/10 pl-4">
                                                <ExternalLink className="w-3.5 h-3.5 text-luxury-gold/60" />
                                                <span>Client: <span className="text-foreground font-medium">{task.client.full_name}</span></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="py-20 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl">
                        <Clock className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                        <h4 className="text-lg font-serif text-muted-foreground">Aucune tâche trouvée</h4>
                        <p className="text-sm text-muted-foreground/60 mt-1 uppercase tracking-widest">Utilisez GHL pour ajouter des tâches quotidiennes.</p>
                    </div>
                )}
            </div>

            {/* Task Detail Modal */}
            <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 border-luxury-gold/20">
                    <DialogHeader>
                        <div className="flex justify-between items-center pr-8">
                            <Badge variant="outline" className={getPriorityColor(selectedTask?.priority || 'normal')}>
                                Priorité {selectedTask?.priority || 'Normal'}
                            </Badge>
                            <span className="text-xs text-muted-foreground uppercase tracking-tighter italic">ID: {String(selectedTask?.ghl_id || "").substring(0, 15)}...</span>
                        </div>
                        <DialogTitle className="text-2xl font-serif text-luxury-gold mt-4">{selectedTask?.title}</DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-2">
                           Détails de la tâche synchronisée via GoHighLevel.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold mb-3">Informations Clés</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Calendar className="w-4 h-4 text-luxury-gold" />
                                        <span>Échéance: {(selectedTask?.due_date && isValid(new Date(selectedTask.due_date))) ? format(new Date(selectedTask.due_date), 'PPP', { locale: fr }) : 'Non définie'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <User className="w-4 h-4 text-luxury-gold" />
                                        <span>Assigné à: <b className="text-foreground">{selectedTask?.assigned_to_profile?.full_name || 'Non assigné'}</b></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Loader2 className={`w-4 h-4 ${selectedTask?.status === 'completed' ? 'text-green-500' : 'text-blue-500'}`} />
                                        <span>Statut: <Badge className={selectedTask?.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}>{selectedTask?.status === 'completed' ? 'Terminé' : 'En cours'}</Badge></span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold mb-2">Description</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {selectedTask?.description || "Aucune description fournie dans GHL."}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-luxury-gold/5 p-4 rounded-xl border border-luxury-gold/10">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold">Résumé Conversation</h4>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-7 text-xs gap-1 hover:bg-luxury-gold/10 text-luxury-gold"
                                        onClick={() => selectedTask && fetchSummary(selectedTask)}
                                        disabled={summaryLoading}
                                    >
                                        {summaryLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                        {summary ? "Actualiser" : "Générer"}
                                    </Button>
                                </div>

                                {summaryLoading ? (
                                    <div className="py-8 text-center space-y-3">
                                        <span className="relative flex h-3 w-3 mx-auto">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-luxury-gold opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-luxury-gold"></span>
                                        </span>
                                        <p className="text-xs text-muted-foreground italic">Analyse des derniers messages GHL...</p>
                                    </div>
                                ) : summary ? (
                                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                                            {summary.summary}
                                        </p>
                                        {((summary as any)?.images && Array.isArray((summary as any).images) && (summary as any).images.length > 0) && (
                                            <div className="grid grid-cols-2 gap-2 mt-4">
                                                {(summary as any).images.map((img: string, i: number) => (
                                                    <a key={i} href={img} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg border border-white/10 overflow-hidden group/img relative">
                                                        <img src={img} alt="Shared" className="w-full h-full object-cover transition-transform group-hover/img:scale-110"/>
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                            <ImageIcon className="w-4 h-4 text-white"/>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center">
                                        <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground italic">Cliquez sur Générer pour analyser le contexte client.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-between gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 border-luxury-gold/20 hover:bg-luxury-gold/5"
                            onClick={() => selectedTask && (window.open(`https://app.gohighlevel.com/v2/location/${selectedTask.metadata?.location?.id}/contacts/detail/${selectedTask.metadata?.contact_id}`, '_blank'))}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ouvrir dans GHL
                        </Button>
                        <Button
                            className="flex-1 bg-luxury-gold text-black hover:bg-luxury-gold/90"
                            onClick={(e) => selectedTask && handleToggleStatus(e, selectedTask)}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {selectedTask?.status === 'completed' ? 'Marquer comme en cours' : 'Marquer comme fini'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
