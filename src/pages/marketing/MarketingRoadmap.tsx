import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMarketing, MarketingCampaign } from '@/services/apiMarketing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Plus, Search, Loader2, Trash2, Edit3, Map, ChevronLeft, Target, Calendar, CheckCircle2, Circle, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

const STATUS_COLORS: Record<string, string> = {
    idea: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const TYPE_LABELS: Record<string, string> = {
    collaboration: '🤝', ad: '📢', contest: '🎁', launch: '🚀', event: '🎉', other: '📋',
};

export default function MarketingRoadmap() {
    const { t, i18n } = useTranslation();
    const dfLocale = i18n.language.startsWith('en') ? enUS : fr;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isOpen, setIsOpen] = useState(false);
    const [editItem, setEditItem] = useState<MarketingCampaign | null>(null);
    const [selectedItem, setSelectedItem] = useState<MarketingCampaign | null>(null);
    const [newTaskText, setNewTaskText] = useState('');
    const [form, setForm] = useState<Partial<MarketingCampaign>>({
        name: '', description: '', type: 'other', status: 'idea', budget: 0, tasks: [], notes: '', results: '',
    });

    const { data: campaigns = [], isLoading } = useQuery({
        queryKey: ['marketing-campaigns'],
        queryFn: apiMarketing.getCampaigns,
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<MarketingCampaign>) => apiMarketing.createCampaign(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] }); setIsOpen(false); toast({ title: t('marketing.roadmap.toastCreated') }); },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<MarketingCampaign> }) => apiMarketing.updateCampaign(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] }); setIsOpen(false); setEditItem(null); setSelectedItem(null); toast({ title: t('marketing.roadmap.toastUpdated') }); },
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiMarketing.deleteCampaign(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] }); setSelectedItem(null); toast({ title: t('marketing.roadmap.toastDeleted') }); },
    });

    const resetForm = () => setForm({ name: '', description: '', type: 'other', status: 'idea', budget: 0, tasks: [], notes: '', results: '' });

    const handleSave = () => {
        if (!form.name?.trim()) return;
        editItem ? updateMutation.mutate({ id: editItem.id, data: form }) : createMutation.mutate(form);
    };

    const toggleTask = (campaignId: string, taskIdx: number) => {
        const campaign = campaigns.find(c => c.id === campaignId);
        if (!campaign) return;
        const tasks = [...(campaign.tasks || [])];
        tasks[taskIdx] = { ...tasks[taskIdx], done: !tasks[taskIdx].done };
        updateMutation.mutate({ id: campaignId, data: { tasks } });
    };

    const addTaskToSelected = () => {
        if (!newTaskText.trim() || !selectedItem) return;
        const tasks = [...(selectedItem.tasks || []), { text: newTaskText.trim(), done: false }];
        updateMutation.mutate({ id: selectedItem.id, data: { tasks } });
        setNewTaskText('');
    };

    const removeTaskFromSelected = (idx: number) => {
        if (!selectedItem) return;
        const tasks = (selectedItem.tasks || []).filter((_, i) => i !== idx);
        updateMutation.mutate({ id: selectedItem.id, data: { tasks } });
    };

    const filtered = campaigns.filter(c => {
        const matchesSearch = (c.name || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getProgress = (campaign: MarketingCampaign) => {
        const tasks = campaign.tasks || [];
        if (tasks.length === 0) return 0;
        return Math.round((tasks.filter(t2 => t2.done).length / tasks.length) * 100);
    };

    if (isLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-luxury-gold" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button onClick={() => navigate('/dashboard/marketing')} className="text-xs text-muted-foreground hover:text-luxury-gold flex items-center gap-1 mb-2 transition-colors">
                        <ChevronLeft className="w-3 h-3" /> {t('marketing.backToHub')}
                    </button>
                    <h2 className="text-3xl font-serif font-bold text-luxury-gold tracking-wide flex items-center gap-3">
                        <Map className="w-7 h-7" /> {t('marketing.roadmap.title')}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">{t('marketing.roadmap.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder={t('marketing.roadmap.searchPh')} className="pl-9 w-64 bg-white/50 dark:bg-black/20" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <Button onClick={() => { resetForm(); setEditItem(null); setIsOpen(true); }} className="bg-luxury-gold hover:bg-luxury-gold/90 text-black">
                        <Plus className="w-4 h-4 mr-2" /> {t('marketing.roadmap.newCampaign')}
                    </Button>
                </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-lg w-fit">
                {['all', 'idea', 'planning', 'active', 'paused', 'completed'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-white dark:bg-zinc-800 text-luxury-gold shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                        {s === 'all' ? t('marketing.roadmap.filterAll') : t(`marketing.roadmap.status_${s}`)}
                    </button>
                ))}
            </div>

            {/* Campaigns */}
            {filtered.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl">
                    <Target className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h4 className="text-lg font-serif text-muted-foreground">{t('marketing.roadmap.emptyTitle')}</h4>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((campaign, i) => {
                        const progress = getProgress(campaign);
                        return (
                            <Card key={campaign.id} onClick={() => setSelectedItem(campaign)}
                                className="group cursor-pointer border-none ring-1 ring-black/5 dark:ring-white/5 hover:ring-luxury-gold/30 transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${i * 50}ms` }}>
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-luxury-gold/10 flex items-center justify-center text-2xl shrink-0">
                                            {TYPE_LABELS[campaign.type] || '📋'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-luxury-gold transition-colors">{campaign.name}</h3>
                                                <Badge variant="outline" className={STATUS_COLORS[campaign.status]}>{t(`marketing.roadmap.status_${campaign.status}`)}</Badge>
                                            </div>
                                            {campaign.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{campaign.description}</p>}
                                            <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
                                                {campaign.start_date && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(campaign.start_date), 'PP', { locale: dfLocale })}
                                                        {campaign.end_date && ` → ${format(new Date(campaign.end_date), 'PP', { locale: dfLocale })}`}
                                                    </span>
                                                )}
                                                {(campaign.budget || 0) > 0 && (
                                                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{campaign.budget}$</span>
                                                )}
                                                {(campaign.tasks?.length || 0) > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        {campaign.tasks?.filter(t2 => t2.done).length}/{campaign.tasks?.length}
                                                    </span>
                                                )}
                                            </div>
                                            {(campaign.tasks?.length || 0) > 0 && (
                                                <div className="mt-3 w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-luxury-gold to-luxury-gold/60 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            <Dialog open={!!selectedItem} onOpenChange={open => !open && setSelectedItem(null)}>
                <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 border-luxury-gold/20 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-luxury-gold flex items-center gap-3">
                            <span className="text-2xl">{TYPE_LABELS[selectedItem?.type || 'other']}</span>
                            {selectedItem?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-4 py-4">
                            <div className="flex gap-2 flex-wrap">
                                <Badge variant="outline" className={STATUS_COLORS[selectedItem.status]}>{t(`marketing.roadmap.status_${selectedItem.status}`)}</Badge>
                                <Badge variant="outline">{t(`marketing.roadmap.type_${selectedItem.type}`)}</Badge>
                                {(selectedItem.budget || 0) > 0 && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400"><DollarSign className="w-3 h-3 mr-1" />{selectedItem.budget}$</Badge>}
                            </div>
                            {selectedItem.description && (
                                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                                    <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                                </div>
                            )}

                            {/* Tasks */}
                            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold mb-3">{t('marketing.roadmap.tasksLabel')}</h4>
                                <div className="space-y-2">
                                    {(selectedItem.tasks || []).map((task, idx) => (
                                        <div key={idx} className="flex items-center gap-3 group/task">
                                            <button onClick={(e) => { e.stopPropagation(); toggleTask(selectedItem.id, idx); }}
                                                className="transition-transform hover:scale-110">
                                                {task.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-muted-foreground/30 hover:text-luxury-gold" />}
                                            </button>
                                            <span className={`text-sm flex-1 ${task.done ? 'line-through text-muted-foreground/50' : ''}`}>{task.text}</span>
                                            <button onClick={() => removeTaskFromSelected(idx)} className="opacity-0 group-hover/task:opacity-100 text-red-400 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder={t('marketing.roadmap.addTaskPh')} className="flex-1" onKeyDown={e => e.key === 'Enter' && addTaskToSelected()} />
                                    <Button variant="outline" size="sm" onClick={addTaskToSelected}><Plus className="w-4 h-4" /></Button>
                                </div>
                            </div>

                            {selectedItem.results && (
                                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">{t('marketing.roadmap.resultsLabel')}</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedItem.results}</p>
                                </div>
                            )}
                            {selectedItem.notes && (
                                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold mb-2">{t('marketing.roadmap.notesLabel')}</h4>
                                    <p className="text-sm text-muted-foreground">{selectedItem.notes}</p>
                                </div>
                            )}
                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => { setEditItem(selectedItem); setForm({ ...selectedItem }); setIsOpen(true); setSelectedItem(null); }}>
                                    <Edit3 className="w-4 h-4 mr-2" /> {t('common.edit')}
                                </Button>
                                <Button variant="outline" className="text-red-500 hover:bg-red-500/10 border-red-500/20" onClick={() => { if (confirm(t('marketing.roadmap.deleteConfirm'))) deleteMutation.mutate(selectedItem.id); }}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create/Edit */}
            <Dialog open={isOpen} onOpenChange={open => { if (!open) { setIsOpen(false); setEditItem(null); } }}>
                <DialogContent className="max-w-lg bg-white dark:bg-zinc-950 border-luxury-gold/20">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-luxury-gold">{editItem ? t('marketing.roadmap.editTitle') : t('marketing.roadmap.createTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('marketing.roadmap.typeLabel')}</Label>
                                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as any }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['collaboration', 'ad', 'contest', 'launch', 'event', 'other'].map(t2 => (
                                            <SelectItem key={t2} value={t2}>{TYPE_LABELS[t2]} {t(`marketing.roadmap.type_${t2}`)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('marketing.roadmap.statusLabel')}</Label>
                                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['idea', 'planning', 'active', 'paused', 'completed'].map(s => (
                                            <SelectItem key={s} value={s}>{t(`marketing.roadmap.status_${s}`)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2"><Label>{t('marketing.roadmap.nameLabel')}</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                        <div className="space-y-2"><Label>{t('marketing.roadmap.descLabel')}</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>{t('marketing.roadmap.budgetLabel')}</Label><Input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: Number(e.target.value) }))} /></div>
                            <div className="space-y-2"><Label>{t('marketing.roadmap.startDate')}</Label><Input type="date" value={form.start_date ? format(new Date(form.start_date), 'yyyy-MM-dd') : ''} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                            <div className="space-y-2"><Label>{t('marketing.roadmap.endDate')}</Label><Input type="date" value={form.end_date ? format(new Date(form.end_date), 'yyyy-MM-dd') : ''} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
                        </div>
                        <div className="space-y-2"><Label>{t('marketing.roadmap.resultsLabel')}</Label><Textarea value={form.results} onChange={e => setForm(p => ({ ...p, results: e.target.value }))} rows={2} /></div>
                        <div className="space-y-2"><Label>{t('marketing.roadmap.notesLabel')}</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                        <Button onClick={handleSave} className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-black" disabled={createMutation.isPending || updateMutation.isPending}>
                            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editItem ? t('common.save') : t('marketing.roadmap.create')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
