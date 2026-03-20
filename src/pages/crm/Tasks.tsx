import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Calendar, 
    User, 
    CheckCircle2, 
    Circle, 
    Clock, 
    ExternalLink,
    Search,
    Loader2,
    CheckSquare
} from 'lucide-react';
import { apiTasks, Task } from '@/services/apiTasks';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

export default function Tasks() {
    const { role, user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
    const [viewOnlyMine, setViewOnlyMine] = useState(true);

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: apiTasks.getAll
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: Task['status'] }) =>
            apiTasks.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             task.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || task.status === filter;
        const matchesOwnership = !viewOnlyMine || task.assigned_to === user?.id;
        return matchesSearch && matchesFilter && matchesOwnership;
    });

    const handleToggleStatus = (task: Task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        updateStatusMutation.mutate({ id: task.id, status: newStatus });
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
            {/* Header section */}
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
                {filteredTasks.length > 0 ? (
                    filteredTasks.map(task => (
                        <Card key={task.id} className={`group border-none overflow-hidden transition-all duration-300 ${
                            task.status === 'completed' ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-lg hover:shadow-luxury-gold/5 ring-1 ring-black/5 dark:ring-white/5'
                        }`}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                task.status === 'completed' ? 'bg-green-500' : 'bg-luxury-gold'
                            }`} />
                            
                            <CardContent className="p-5 flex items-start gap-4">
                                <button 
                                    onClick={() => handleToggleStatus(task)}
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
                                                task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                                            }`}>
                                                {task.title}
                                            </h3>
                                            {task.description && (
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
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
                                        {task.due_date && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>Échéance: {format(new Date(task.due_date), 'PPP', { locale: fr })}</span>
                                            </div>
                                        )}
                                        {task.assigned_to_profile && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <User className="w-3.5 h-3.5" />
                                                <span>Assigné à: <span className="text-foreground font-medium">{task.assigned_to_profile.full_name}</span></span>
                                            </div>
                                        )}
                                        {task.client && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground border-l border-black/10 dark:border-white/10 pl-4 ml-2">
                                                <ExternalLink className="w-3.5 h-3.5" />
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
        </div>
    );
}
