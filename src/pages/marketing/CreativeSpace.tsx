import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMarketing, MarketingIdea } from '@/services/apiMarketing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import {
    Plus, Search, Loader2, Video, Camera, Film, BookOpen, Sparkles,
    Trash2, Edit3, ExternalLink, Lightbulb, FileText, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    scripted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    filming: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    editing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const TYPE_ICONS: Record<string, any> = {
    video: Video,
    photo: Camera,
    reel: Film,
    story: BookOpen,
    other: Lightbulb,
};

export default function CreativeSpace() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [editIdea, setEditIdea] = useState<MarketingIdea | null>(null);
    const [selectedIdea, setSelectedIdea] = useState<MarketingIdea | null>(null);
    const [form, setForm] = useState<Partial<MarketingIdea>>({
        title: '', type: 'video', script: '', notes: '', status: 'draft',
        inspiration_urls: [],
    });
    const [newUrl, setNewUrl] = useState('');

    const { data: ideas = [], isLoading } = useQuery({
        queryKey: ['marketing-ideas'],
        queryFn: apiMarketing.getIdeas,
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<MarketingIdea>) => apiMarketing.createIdea(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing-ideas'] });
            setIsOpen(false);
            resetForm();
            toast({ title: t('marketing.creative.toastCreated') });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<MarketingIdea> }) =>
            apiMarketing.updateIdea(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing-ideas'] });
            setIsOpen(false);
            setEditIdea(null);
            resetForm();
            toast({ title: t('marketing.creative.toastUpdated') });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiMarketing.deleteIdea(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing-ideas'] });
            setSelectedIdea(null);
            toast({ title: t('marketing.creative.toastDeleted') });
        },
    });

    const resetForm = () => setForm({ title: '', type: 'video', script: '', notes: '', status: 'draft', inspiration_urls: [] });

    const openEdit = (idea: MarketingIdea) => {
        setEditIdea(idea);
        setForm({ ...idea });
        setIsOpen(true);
    };

    const handleSave = () => {
        if (!form.title?.trim()) return;
        if (editIdea) {
            updateMutation.mutate({ id: editIdea.id, data: form });
        } else {
            createMutation.mutate(form);
        }
    };

    const addInspirationUrl = () => {
        if (!newUrl.trim()) return;
        setForm(prev => ({
            ...prev,
            inspiration_urls: [...(prev.inspiration_urls || []), newUrl.trim()],
        }));
        setNewUrl('');
    };

    const removeInspirationUrl = (idx: number) => {
        setForm(prev => ({
            ...prev,
            inspiration_urls: (prev.inspiration_urls || []).filter((_, i) => i !== idx),
        }));
    };

    const filtered = ideas.filter(idea =>
        (idea.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (idea.script || '').toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button onClick={() => navigate('/dashboard/marketing')} className="text-xs text-muted-foreground hover:text-luxury-gold flex items-center gap-1 mb-2 transition-colors">
                        <ChevronLeft className="w-3 h-3" /> {t('marketing.backToHub')}
                    </button>
                    <h2 className="text-3xl font-serif font-bold text-luxury-gold tracking-wide flex items-center gap-3">
                        <Sparkles className="w-7 h-7" />
                        {t('marketing.creative.title')}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">{t('marketing.creative.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder={t('marketing.creative.searchPlaceholder')} className="pl-9 w-64 bg-white/50 dark:bg-black/20" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <Button onClick={() => { resetForm(); setEditIdea(null); setIsOpen(true); }} className="bg-luxury-gold hover:bg-luxury-gold/90 text-black">
                        <Plus className="w-4 h-4 mr-2" /> {t('marketing.creative.newIdea')}
                    </Button>
                </div>
            </div>

            {/* Ideas Grid */}
            {filtered.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl">
                    <Lightbulb className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h4 className="text-lg font-serif text-muted-foreground">{t('marketing.creative.emptyTitle')}</h4>
                    <p className="text-sm text-muted-foreground/60 mt-1">{t('marketing.creative.emptyHint')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((idea, i) => {
                        const Icon = TYPE_ICONS[idea.type] || Lightbulb;
                        return (
                            <Card
                                key={idea.id}
                                onClick={() => setSelectedIdea(idea)}
                                className="group cursor-pointer border-none ring-1 ring-black/5 dark:ring-white/5 hover:ring-luxury-gold/30 transition-all duration-300 hover:shadow-lg hover:shadow-luxury-gold/5 overflow-hidden animate-in fade-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-luxury-gold/60 to-luxury-gold/10" />
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 flex items-center justify-center">
                                            <Icon className="w-5 h-5 text-luxury-gold" />
                                        </div>
                                        <Badge variant="outline" className={STATUS_COLORS[idea.status]}>{t(`marketing.creative.status_${idea.status}`)}</Badge>
                                    </div>
                                    <h3 className="font-serif text-lg font-medium text-foreground leading-tight mb-2 group-hover:text-luxury-gold transition-colors">{idea.title}</h3>
                                    {idea.script && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{idea.script}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                                        <span>{t(`marketing.creative.type_${idea.type}`)}</span>
                                        {(idea.inspiration_urls?.length || 0) > 0 && (
                                            <>
                                                <span>·</span>
                                                <span>{idea.inspiration_urls?.length} {t('marketing.creative.inspirations')}</span>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            <Dialog open={!!selectedIdea} onOpenChange={open => !open && setSelectedIdea(null)}>
                <DialogContent className="max-w-lg bg-white dark:bg-zinc-950 border-luxury-gold/20">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-luxury-gold">{selectedIdea?.title}</DialogTitle>
                        <DialogDescription>{t(`marketing.creative.type_${selectedIdea?.type || 'other'}`)}</DialogDescription>
                    </DialogHeader>
                    {selectedIdea && (
                        <div className="space-y-4 py-4">
                            <div className="flex gap-2">
                                <Badge variant="outline" className={STATUS_COLORS[selectedIdea.status]}>{t(`marketing.creative.status_${selectedIdea.status}`)}</Badge>
                            </div>
                            {selectedIdea.script && (
                                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold mb-2 flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> {t('marketing.creative.scriptLabel')}
                                    </h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedIdea.script}</p>
                                </div>
                            )}
                            {selectedIdea.notes && (
                                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold mb-2">{t('marketing.creative.notesLabel')}</h4>
                                    <p className="text-sm text-muted-foreground">{selectedIdea.notes}</p>
                                </div>
                            )}
                            {(selectedIdea.inspiration_urls?.length || 0) > 0 && (
                                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold mb-2">{t('marketing.creative.inspirationsLabel')}</h4>
                                    <div className="space-y-1">
                                        {selectedIdea.inspiration_urls?.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                                <ExternalLink className="w-3 h-3" /> {url}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => { openEdit(selectedIdea); setSelectedIdea(null); }}>
                                    <Edit3 className="w-4 h-4 mr-2" /> {t('common.edit')}
                                </Button>
                                <Button variant="outline" className="text-red-500 hover:bg-red-500/10 border-red-500/20" onClick={() => { if (confirm(t('marketing.creative.deleteConfirm'))) deleteMutation.mutate(selectedIdea.id); }}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create/Edit Modal */}
            <Dialog open={isOpen} onOpenChange={open => { if (!open) { setIsOpen(false); setEditIdea(null); } }}>
                <DialogContent className="max-w-lg bg-white dark:bg-zinc-950 border-luxury-gold/20">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-luxury-gold">
                            {editIdea ? t('marketing.creative.editTitle') : t('marketing.creative.createTitle')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('marketing.creative.typeLabel')}</Label>
                                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as any }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['video', 'photo', 'reel', 'story', 'other'].map(t2 => (
                                            <SelectItem key={t2} value={t2}>{t(`marketing.creative.type_${t2}`)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('marketing.creative.statusLabel')}</Label>
                                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['draft', 'scripted', 'filming', 'editing', 'published'].map(s => (
                                            <SelectItem key={s} value={s}>{t(`marketing.creative.status_${s}`)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('marketing.creative.titleLabel')}</Label>
                            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder={t('marketing.creative.titlePh')} />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><FileText className="w-3 h-3 text-luxury-gold" />{t('marketing.creative.scriptLabel')}</Label>
                            <Textarea value={form.script} onChange={e => setForm(p => ({ ...p, script: e.target.value }))} placeholder={t('marketing.creative.scriptPh')} rows={5} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('marketing.creative.notesLabel')}</Label>
                            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder={t('marketing.creative.notesPh')} rows={2} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('marketing.creative.inspirationsLabel')}</Label>
                            <div className="flex gap-2">
                                <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." className="flex-1" onKeyDown={e => e.key === 'Enter' && addInspirationUrl()} />
                                <Button variant="outline" onClick={addInspirationUrl} size="icon"><Plus className="w-4 h-4" /></Button>
                            </div>
                            {(form.inspiration_urls || []).map((url, i) => (
                                <div key={i} className="flex items-center justify-between text-xs text-muted-foreground bg-black/5 dark:bg-white/5 rounded-lg px-3 py-2">
                                    <span className="truncate">{url}</span>
                                    <button onClick={() => removeInspirationUrl(i)} className="text-red-400 hover:text-red-300 ml-2"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleSave} className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-black" disabled={createMutation.isPending || updateMutation.isPending}>
                            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editIdea ? t('common.save') : t('marketing.creative.create')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
