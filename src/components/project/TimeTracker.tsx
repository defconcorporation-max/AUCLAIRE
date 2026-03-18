import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Plus, Trash2, Timer, BarChart3 } from 'lucide-react';
import type { Project, TimeEntry } from '@/services/apiProjects';
import { apiProjects } from '@/services/apiProjects';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

const STAGE_LABELS: Record<string, string> = {
    design: 'Design',
    modeling: 'Modélisation 3D',
    production: 'Production',
    setting: 'Sertissage',
    polishing: 'Polissage',
    quality_check: 'Contrôle qualité',
    other: 'Autre',
};

const STAGE_COLORS: Record<string, string> = {
    design: 'bg-blue-500',
    modeling: 'bg-violet-500',
    production: 'bg-purple-500',
    setting: 'bg-amber-500',
    polishing: 'bg-emerald-500',
    quality_check: 'bg-cyan-500',
    other: 'bg-zinc-500',
};

interface TimeTrackerProps {
    project: Project;
}

export function TimeTracker({ project }: TimeTrackerProps) {
    const queryClient = useQueryClient();
    const { user, profile } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newEntry, setNewEntry] = useState({
        stage: 'production',
        description: '',
        hours: '',
        date: new Date().toISOString().split('T')[0],
    });

    const timeEntries: TimeEntry[] = project.stage_details?.time_entries || [];
    const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);

    const hoursByStage = timeEntries.reduce<Record<string, number>>((acc, e) => {
        acc[e.stage] = (acc[e.stage] || 0) + e.hours;
        return acc;
    }, {});

    const handleAdd = async () => {
        const hours = parseFloat(newEntry.hours);
        if (!hours || hours <= 0) {
            toast({ title: 'Heures invalides', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const entry: TimeEntry = {
                id: crypto.randomUUID(),
                stage: newEntry.stage,
                description: newEntry.description,
                hours,
                date: newEntry.date,
                user_id: user?.id,
                user_name: profile?.full_name || 'Inconnu',
            };
            const existing = project.stage_details?.time_entries || [];
            await apiProjects.updateDetails(project.id, {
                time_entries: [...existing, entry],
            });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setNewEntry({ stage: 'production', description: '', hours: '', date: new Date().toISOString().split('T')[0] });
            setShowForm(false);
            toast({ title: 'Temps enregistré', description: `${hours}h ajoutées en ${STAGE_LABELS[newEntry.stage]}` });
        } catch {
            toast({ title: 'Erreur', description: "Impossible d'enregistrer le temps.", variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (entryId: string) => {
        try {
            const filtered = timeEntries.filter(e => e.id !== entryId);
            await apiProjects.updateDetails(project.id, { time_entries: filtered });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast({ title: 'Entrée supprimée' });
        } catch {
            toast({ title: 'Erreur', variant: 'destructive' });
        }
    };

    return (
        <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif flex items-center justify-between">
                    <span className="flex items-center gap-2 text-luxury-gold">
                        <Timer className="w-5 h-5" /> Temps de production
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-muted-foreground">
                            Total : <span className="text-white font-bold">{totalHours.toFixed(1)}h</span>
                        </span>
                        <Button
                            size="sm"
                            onClick={() => setShowForm(!showForm)}
                            className="bg-luxury-gold/20 hover:bg-luxury-gold/30 text-luxury-gold border border-luxury-gold/30"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Ajouter
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Stage breakdown bar */}
                {totalHours > 0 && (
                    <div className="space-y-2">
                        <div className="flex rounded-full overflow-hidden h-3">
                            {Object.entries(hoursByStage).map(([stage, hours]) => (
                                <div
                                    key={stage}
                                    className={`${STAGE_COLORS[stage] || 'bg-zinc-500'} transition-all`}
                                    style={{ width: `${(hours / totalHours) * 100}%` }}
                                    title={`${STAGE_LABELS[stage] || stage}: ${hours.toFixed(1)}h`}
                                />
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-3 text-[10px]">
                            {Object.entries(hoursByStage)
                                .sort((a, b) => b[1] - a[1])
                                .map(([stage, hours]) => (
                                    <span key={stage} className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${STAGE_COLORS[stage] || 'bg-zinc-500'}`} />
                                        <span className="text-muted-foreground">{STAGE_LABELS[stage] || stage}</span>
                                        <span className="font-bold text-white">{hours.toFixed(1)}h</span>
                                    </span>
                                ))}
                        </div>
                    </div>
                )}

                {/* Add form */}
                {showForm && (
                    <div className="p-4 rounded-xl border border-luxury-gold/20 bg-luxury-gold/5 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <select
                                value={newEntry.stage}
                                onChange={e => setNewEntry(prev => ({ ...prev, stage: e.target.value }))}
                                className="h-9 rounded-lg border border-white/10 bg-black/40 text-sm text-white px-3 focus:border-luxury-gold/50"
                            >
                                {Object.entries(STAGE_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            <Input
                                type="number"
                                step="0.25"
                                min="0.25"
                                placeholder="Heures"
                                value={newEntry.hours}
                                onChange={e => setNewEntry(prev => ({ ...prev, hours: e.target.value }))}
                                className="h-9"
                            />
                            <Input
                                type="date"
                                value={newEntry.date}
                                onChange={e => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                                className="h-9"
                            />
                            <Input
                                placeholder="Description (optionnel)"
                                value={newEntry.description}
                                onChange={e => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                                className="h-9"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
                            <Button size="sm" onClick={handleAdd} disabled={saving} className="bg-luxury-gold hover:bg-yellow-600 text-black">
                                {saving ? <Clock className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Entries list */}
                {timeEntries.length > 0 ? (
                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {[...timeEntries].reverse().map(entry => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${STAGE_COLORS[entry.stage] || 'bg-zinc-500'}`} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {STAGE_LABELS[entry.stage] || entry.stage}
                                            {entry.description && (
                                                <span className="text-muted-foreground font-normal ml-2">— {entry.description}</span>
                                            )}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(entry.date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                                            {entry.user_name && ` · ${entry.user_name}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-mono text-sm font-bold text-luxury-gold">{entry.hours}h</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(entry.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-muted-foreground">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Aucun temps enregistré pour ce projet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
