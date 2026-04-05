import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMarketing, MarketingAccount } from '@/services/apiMarketing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Plus, Loader2, Trash2, Edit3, ChevronLeft, ExternalLink, Copy, AtSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLATFORM_COLORS: Record<string, string> = {
    instagram: 'from-pink-500/20 to-purple-500/20 text-pink-400',
    youtube: 'from-red-500/20 to-red-600/20 text-red-400',
    tiktok: 'from-cyan-500/20 to-pink-500/20 text-cyan-400',
    facebook: 'from-blue-500/20 to-blue-600/20 text-blue-400',
    twitter: 'from-sky-500/20 to-sky-600/20 text-sky-400',
    pinterest: 'from-red-400/20 to-red-500/20 text-red-400',
    linkedin: 'from-blue-600/20 to-blue-700/20 text-blue-500',
    etsy: 'from-orange-500/20 to-orange-600/20 text-orange-400',
    website: 'from-luxury-gold/20 to-luxury-gold/10 text-luxury-gold',
    other: 'from-gray-500/20 to-gray-600/20 text-gray-400',
};

const PLATFORMS = ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'pinterest', 'linkedin', 'etsy', 'website', 'other'];

export default function AccountsDirectory() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [editItem, setEditItem] = useState<MarketingAccount | null>(null);
    const [form, setForm] = useState<Partial<MarketingAccount>>({ platform: 'instagram', username: '', url: '', notes: '' });

    const { data: accounts = [], isLoading } = useQuery({
        queryKey: ['marketing-accounts'],
        queryFn: apiMarketing.getAccounts,
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<MarketingAccount>) => apiMarketing.createAccount(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-accounts'] }); setIsOpen(false); resetForm(); toast({ title: t('marketing.accounts.toastCreated') }); },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<MarketingAccount> }) => apiMarketing.updateAccount(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-accounts'] }); setIsOpen(false); setEditItem(null); resetForm(); toast({ title: t('marketing.accounts.toastUpdated') }); },
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiMarketing.deleteAccount(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-accounts'] }); toast({ title: t('marketing.accounts.toastDeleted') }); },
    });

    const resetForm = () => setForm({ platform: 'instagram', username: '', url: '', notes: '' });

    const handleSave = () => {
        if (!form.username?.trim() || !form.url?.trim()) return;
        editItem ? updateMutation.mutate({ id: editItem.id, data: form }) : createMutation.mutate(form);
    };

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({ title: t('marketing.accounts.copied') });
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
                        <AtSign className="w-7 h-7" /> {t('marketing.accounts.title')}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">{t('marketing.accounts.subtitle')}</p>
                </div>
                <Button onClick={() => { resetForm(); setEditItem(null); setIsOpen(true); }} className="bg-luxury-gold hover:bg-luxury-gold/90 text-black">
                    <Plus className="w-4 h-4 mr-2" /> {t('marketing.accounts.addAccount')}
                </Button>
            </div>

            {accounts.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl">
                    <AtSign className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h4 className="text-lg font-serif text-muted-foreground">{t('marketing.accounts.emptyTitle')}</h4>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map((account, i) => {
                        const colorClass = PLATFORM_COLORS[account.platform] || PLATFORM_COLORS.other;
                        return (
                            <Card key={account.id} className="border-none ring-1 ring-black/5 dark:ring-white/5 hover:ring-luxury-gold/20 transition-all group animate-in fade-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${i * 50}ms` }}>
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center font-bold text-lg capitalize shrink-0`}>
                                            {account.platform[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{account.platform}</h3>
                                            <p className="text-lg font-serif font-medium text-foreground mt-0.5">@{account.username}</p>
                                            {account.notes && <p className="text-[11px] text-muted-foreground mt-1">{account.notes}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                                        <a href={account.url} target="_blank" rel="noreferrer"
                                            className="flex-1 text-[10px] text-muted-foreground hover:text-luxury-gold flex items-center gap-1 truncate transition-colors">
                                            <ExternalLink className="w-3 h-3 shrink-0" /> {account.url}
                                        </a>
                                        <button onClick={() => copyUrl(account.url)} className="text-muted-foreground/50 hover:text-luxury-gold transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => { setEditItem(account); setForm({ ...account }); setIsOpen(true); }} className="text-muted-foreground/50 hover:text-luxury-gold transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => { if (confirm(t('marketing.accounts.deleteConfirm'))) deleteMutation.mutate(account.id); }} className="text-muted-foreground/50 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={isOpen} onOpenChange={open => { if (!open) { setIsOpen(false); setEditItem(null); } }}>
                <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border-luxury-gold/20">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-luxury-gold">{editItem ? t('marketing.accounts.editTitle') : t('marketing.accounts.createTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('marketing.accounts.platformLabel')}</Label>
                            <Select value={form.platform} onValueChange={v => setForm(p => ({ ...p, platform: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2"><Label>{t('marketing.accounts.usernameLabel')}</Label><Input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="@auclaire" /></div>
                        <div className="space-y-2"><Label>{t('marketing.accounts.urlLabel')}</Label><Input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." /></div>
                        <div className="space-y-2"><Label>{t('marketing.accounts.notesLabel')}</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
                        <Button onClick={handleSave} className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-black" disabled={createMutation.isPending || updateMutation.isPending}>
                            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editItem ? t('common.save') : t('marketing.accounts.create')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
