import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMarketing, WebsiteTask } from '@/services/apiMarketing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Plus, Loader2, Trash2, Globe, ChevronLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PRIORITY_COLORS: Record<string, string> = {
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    normal: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_ORDER = ['todo', 'in_progress', 'review', 'done'];

export default function WebsiteAudit() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState<Partial<WebsiteTask>>({ title: '', description: '', status: 'todo', priority: 'normal' });

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['website-tasks'],
        queryFn: apiMarketing.getWebsiteTasks,
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<WebsiteTask>) => apiMarketing.createWebsiteTask(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['website-tasks'] }); setIsOpen(false); setForm({ title: '', description: '', status: 'todo', priority: 'normal' }); toast({ title: t('marketing.website.toastCreated') }); },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<WebsiteTask> }) => apiMarketing.updateWebsiteTask(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['website-tasks'] }); },
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiMarketing.deleteWebsiteTask(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['website-tasks'] }); toast({ title: t('marketing.website.toastDeleted') }); },
    });

    const moveToNextStatus = (task: WebsiteTask) => {
        const idx = STATUS_ORDER.indexOf(task.status);
        if (idx < STATUS_ORDER.length - 1) {
            updateMutation.mutate({ id: task.id, data: { status: STATUS_ORDER[idx + 1] as any } });
        }
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
                        <Globe className="w-7 h-7" /> {t('marketing.website.title')}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">{t('marketing.website.subtitle')}</p>
                </div>
                <Button onClick={() => setIsOpen(true)} className="bg-luxury-gold hover:bg-luxury-gold/90 text-black">
                    <Plus className="w-4 h-4 mr-2" /> {t('marketing.website.addTask')}
                </Button>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {STATUS_ORDER.map(status => {
                    const columnTasks = tasks.filter(t2 => t2.status === status);
                    return (
                        <div key={status} className="space-y-3">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t(`marketing.website.col_${status}`)}</h3>
                                <Badge variant="outline" className="text-[9px]">{columnTasks.length}</Badge>
                            </div>
                            <div className="space-y-2 min-h-[200px] bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-2 border border-dashed border-black/5 dark:border-white/5">
                                {columnTasks.map(task => (
                                    <Card key={task.id} className="border-none ring-1 ring-black/5 dark:ring-white/5 hover:ring-luxury-gold/20 transition-all group">
                                        <CardContent className="p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="text-sm font-medium text-foreground leading-tight flex-1">{task.title}</h4>
                                                <Badge variant="outline" className={`text-[8px] shrink-0 ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</Badge>
                                            </div>
                                            {task.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                                            <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {status !== 'done' ? (
                                                    <button onClick={() => moveToNextStatus(task)} className="text-[10px] text-luxury-gold hover:text-luxury-gold/80 flex items-center gap-1 font-medium">
                                                        <ArrowRight className="w-3 h-3" /> {t(`marketing.website.col_${STATUS_ORDER[STATUS_ORDER.indexOf(status) + 1]}`)}
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t('marketing.website.complete')}</span>
                                                )}
                                                <button onClick={() => { if (confirm(t('marketing.website.deleteConfirm'))) deleteMutation.mutate(task.id); }}
                                                    className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Task Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border-luxury-gold/20">
                    <DialogHeader><DialogTitle className="font-serif text-2xl text-luxury-gold">{t('marketing.website.createTitle')}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>{t('marketing.website.titleLabel')}</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
                        <div className="space-y-2"><Label>{t('marketing.website.descLabel')}</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('marketing.website.statusLabel')}</Label>
                                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{t(`marketing.website.col_${s}`)}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('marketing.website.priorityLabel')}</Label>
                                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v as any }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{['low', 'normal', 'high', 'urgent'].map(p => <SelectItem key={p} value={p}>{t(`marketing.website.priority_${p}`)}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button onClick={() => createMutation.mutate(form)} className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-black" disabled={createMutation.isPending || !form.title?.trim()}>
                            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {t('marketing.website.create')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
