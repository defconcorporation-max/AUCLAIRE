import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMarketing, MarketingCollaboration } from '@/services/apiMarketing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Plus, Search, Loader2, Trash2, Edit3, Users, ExternalLink, ChevronLeft, UserPlus, Mail, Phone, Instagram, Youtube, Globe, Calendar, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

const STATUS_COLORS: Record<string, string> = {
    prospect: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    contacted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    negotiating: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    declined: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const PLATFORM_ICONS: Record<string, any> = {
    instagram: Instagram,
    youtube: Youtube,
    tiktok: Globe,
    facebook: Globe,
    twitter: Globe,
    website: Globe,
};

export default function CollaborationsHub() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [editItem, setEditItem] = useState<MarketingCollaboration | null>(null);
    const [selectedItem, setSelectedItem] = useState<MarketingCollaboration | null>(null);
    const [form, setForm] = useState<Partial<MarketingCollaboration>>({
        name: '', type: 'influencer', status: 'prospect', social_links: [], partnership_details: '', notes: '', follow_up_date: '', reach_out_count: 0,
    });
    const [newLink, setNewLink] = useState({ platform: 'instagram', url: '', username: '' });

    const { data: collabs = [], isLoading } = useQuery({
        queryKey: ['marketing-collabs'],
        queryFn: apiMarketing.getCollaborations,
    });

    const dfLocale = useTranslation().i18n.language.startsWith('en') ? enUS : fr;

    const createMutation = useMutation({
        mutationFn: (data: Partial<MarketingCollaboration>) => apiMarketing.createCollaboration(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-collabs'] }); setIsOpen(false); toast({ title: t('marketing.collabs.toastCreated') }); },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<MarketingCollaboration> }) => apiMarketing.updateCollaboration(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-collabs'] }); setIsOpen(false); setEditItem(null); toast({ title: t('marketing.collabs.toastUpdated') }); },
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiMarketing.deleteCollaboration(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-collabs'] }); setSelectedItem(null); toast({ title: t('marketing.collabs.toastDeleted') }); },
    });

    const resetForm = () => setForm({ name: '', type: 'influencer', status: 'prospect', social_links: [], partnership_details: '', notes: '' });

    const handleSave = () => {
        if (!form.name?.trim()) return;
        editItem ? updateMutation.mutate({ id: editItem.id, data: form }) : createMutation.mutate(form);
    };

    const addSocialLink = () => {
        if (!newLink.url.trim()) return;
        setForm(p => ({ ...p, social_links: [...(p.social_links || []), { ...newLink }] }));
        setNewLink({ platform: 'instagram', url: '', username: '' });
    };

    const removeSocialLink = (idx: number) => {
        setForm(p => ({ ...p, social_links: (p.social_links || []).filter((_, i) => i !== idx) }));
    };

    const filtered = collabs.filter(c =>
        (c.name || '').toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-luxury-gold" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button onClick={() => navigate('/dashboard/marketing')} className="text-xs text-muted-foreground hover:text-luxury-gold flex items-center gap-1 mb-2 transition-colors">
                        <ChevronLeft className="w-3 h-3" /> {t('marketing.backToHub')}
                    </button>
                    <h2 className="text-3xl font-serif font-bold text-luxury-gold tracking-wide flex items-center gap-3">
                        <Users className="w-7 h-7" /> {t('marketing.collabs.title')}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">{t('marketing.collabs.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder={t('marketing.collabs.searchPh')} className="pl-9 w-64 bg-white/50 dark:bg-black/20" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <Button onClick={() => { resetForm(); setEditItem(null); setIsOpen(true); }} className="bg-luxury-gold hover:bg-luxury-gold/90 text-black">
                        <UserPlus className="w-4 h-4 mr-2" /> {t('marketing.collabs.addCollab')}
                    </Button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl">
                    <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h4 className="text-lg font-serif text-muted-foreground">{t('marketing.collabs.emptyTitle')}</h4>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((collab, i) => (
                        <Card key={collab.id} onClick={() => setSelectedItem(collab)}
                            className="group cursor-pointer border-none ring-1 ring-black/5 dark:ring-white/5 hover:ring-luxury-gold/30 transition-all duration-300 hover:shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2"
                            style={{ animationDelay: `${i * 50}ms` }}>
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-luxury-gold/30 to-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold font-serif text-xl shrink-0">
                                        {collab.name?.[0] || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-luxury-gold transition-colors">{collab.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className={STATUS_COLORS[collab.status]}>{t(`marketing.collabs.status_${collab.status}`)}</Badge>
                                            <span className="text-[10px] text-muted-foreground uppercase">{t(`marketing.collabs.type_${collab.type}`)}</span>
                                        </div>
                                        {(collab.social_links?.length || 0) > 0 && (
                                            <div className="flex gap-2 mt-3">
                                                {collab.social_links?.slice(0, 4).map((link, i2) => {
                                                    const Icon = PLATFORM_ICONS[link.platform] || Globe;
                                                    return <Icon key={i2} className="w-4 h-4 text-muted-foreground/60" />;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            <Dialog open={!!selectedItem} onOpenChange={open => !open && setSelectedItem(null)}>
                <DialogContent className="max-w-lg bg-white dark:bg-zinc-950 border-luxury-gold/20 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-luxury-gold flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-luxury-gold/30 to-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold font-serif text-lg">{selectedItem?.name?.[0]}</div>
                            {selectedItem?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-4 py-4">
                            <div className="flex gap-2">
                                <Badge variant="outline" className={STATUS_COLORS[selectedItem.status]}>{t(`marketing.collabs.status_${selectedItem.status}`)}</Badge>
                                <Badge variant="outline">{t(`marketing.collabs.type_${selectedItem.type}`)}</Badge>
                            </div>
                            {selectedItem.contact_email && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4 text-luxury-gold" />{selectedItem.contact_email}</div>
                            )}
                            {selectedItem.contact_phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4 text-luxury-gold" />{selectedItem.contact_phone}</div>
                            )}
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div className="bg-luxury-gold/5 p-3 rounded-xl border border-luxury-gold/10">
                                    <p className="text-[10px] uppercase font-bold text-luxury-gold mb-1">{t('marketing.collabs.followUp')}</p>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-luxury-gold" />
                                        {selectedItem.follow_up_date ? format(new Date(selectedItem.follow_up_date), 'PP', { locale: dfLocale }) : t('common.none')}
                                    </div>
                                </div>
                                <div className="bg-luxury-gold/5 p-3 rounded-xl border border-luxury-gold/10">
                                    <p className="text-[10px] uppercase font-bold text-luxury-gold mb-1">{t('marketing.collabs.outreachCount')}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-serif font-bold">{selectedItem.reach_out_count || 0}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-luxury-gold" onClick={() => updateMutation.mutate({ id: selectedItem.id, data: { reach_out_count: (selectedItem.reach_out_count || 0) + 1, last_contacted_at: new Date().toISOString() } })}>
                                            <RefreshCcw className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            {(selectedItem.social_links?.length || 0) > 0 && (
                                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold mb-2">{t('marketing.collabs.socialLinks')}</h4>
                                    {selectedItem.social_links?.map((link, i) => {
                                        const Icon = PLATFORM_ICONS[link.platform] || Globe;
                                        return (
                                            <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-luxury-gold transition-colors">
                                                <Icon className="w-4 h-4" />
                                                <span className="capitalize font-medium">{link.platform}</span>
                                                <span className="text-xs">@{link.username}</span>
                                                <ExternalLink className="w-3 h-3 ml-auto" />
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                            {selectedItem.partnership_details && (
                                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold mb-2">{t('marketing.collabs.partnershipLabel')}</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedItem.partnership_details}</p>
                                </div>
                            )}
                            {selectedItem.notes && (
                                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold mb-2">{t('marketing.collabs.notesLabel')}</h4>
                                    <p className="text-sm text-muted-foreground">{selectedItem.notes}</p>
                                </div>
                            )}
                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => { setEditItem(selectedItem); setForm({ ...selectedItem }); setIsOpen(true); setSelectedItem(null); }}>
                                    <Edit3 className="w-4 h-4 mr-2" /> {t('common.edit')}
                                </Button>
                                <Button variant="outline" className="text-red-500 hover:bg-red-500/10 border-red-500/20" onClick={() => { if (confirm(t('marketing.collabs.deleteConfirm'))) deleteMutation.mutate(selectedItem.id); }}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create/Edit Modal */}
            <Dialog open={isOpen} onOpenChange={open => { if (!open) { setIsOpen(false); setEditItem(null); } }}>
                <DialogContent className="max-w-lg bg-white dark:bg-zinc-950 border-luxury-gold/20 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-luxury-gold">{editItem ? t('marketing.collabs.editTitle') : t('marketing.collabs.createTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('marketing.collabs.typeLabel')}</Label>
                                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as any }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['influencer', 'brand', 'media', 'other'].map(t2 => (
                                            <SelectItem key={t2} value={t2}>{t(`marketing.collabs.type_${t2}`)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('marketing.collabs.statusLabel')}</Label>
                                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['prospect', 'contacted', 'negotiating', 'active', 'completed', 'declined'].map(s => (
                                            <SelectItem key={s} value={s}>{t(`marketing.collabs.status_${s}`)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2"><Label>{t('marketing.collabs.nameLabel')}</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>{t('marketing.collabs.emailLabel')}</Label><Input value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} /></div>
                            <div className="space-y-2"><Label>{t('marketing.collabs.phoneLabel')}</Label><Input value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>{t('marketing.collabs.followUpLabel')}</Label><Input type="date" value={form.follow_up_date?.split('T')[0]} onChange={e => setForm(p => ({ ...p, follow_up_date: e.target.value }))} /></div>
                            <div className="space-y-2"><Label>{t('marketing.collabs.outreachLabel')}</Label><Input type="number" value={form.reach_out_count} onChange={e => setForm(p => ({ ...p, reach_out_count: parseInt(e.target.value) }))} /></div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('marketing.collabs.socialLinks')}</Label>
                            <div className="flex gap-2">
                                <Select value={newLink.platform} onValueChange={v => setNewLink(p => ({ ...p, platform: v }))}>
                                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'website'].map(p => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input placeholder="@username" className="w-28" value={newLink.username} onChange={e => setNewLink(p => ({ ...p, username: e.target.value }))} />
                                <Input placeholder="https://..." className="flex-1" value={newLink.url} onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))} />
                                <Button variant="outline" size="icon" onClick={addSocialLink}><Plus className="w-4 h-4" /></Button>
                            </div>
                            {(form.social_links || []).map((link, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs bg-black/5 dark:bg-white/5 rounded-lg px-3 py-2">
                                    <span className="capitalize font-medium">{link.platform}</span>
                                    <span className="text-muted-foreground">@{link.username}</span>
                                    <button onClick={() => removeSocialLink(i)} className="ml-auto text-red-400"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2"><Label>{t('marketing.collabs.partnershipLabel')}</Label><Textarea value={form.partnership_details} onChange={e => setForm(p => ({ ...p, partnership_details: e.target.value }))} rows={3} /></div>
                        <div className="space-y-2"><Label>{t('marketing.collabs.notesLabel')}</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                        <Button onClick={handleSave} className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-black" disabled={createMutation.isPending || updateMutation.isPending}>
                            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editItem ? t('common.save') : t('marketing.collabs.create')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
