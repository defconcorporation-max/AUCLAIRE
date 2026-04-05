import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMarketing } from '@/services/apiMarketing';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import {
    Sparkles, Users, Target, Globe, AtSign, Loader2, Plus, ArrowRight, ChevronLeft
} from 'lucide-react';

type ActionType = 'idea' | 'collab' | 'campaign' | 'webtask' | 'account' | null;

interface QuickActionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function QuickActionModal({ open, onOpenChange }: QuickActionModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [step, setStep] = useState<'select' | 'form'>('select');
    const [type, setType] = useState<ActionType>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [name, setName] = useState(''); // for collab/campaign
    const [category, setCategory] = useState(''); 
    const [platform, setPlatform] = useState('');
    const [username, setUsername] = useState('');

    const resetForm = () => {
        setStep('select');
        setType(null);
        setTitle('');
        setName('');
        setCategory('');
        setPlatform('');
        setUsername('');
    };

    const handleOpenChange = (v: boolean) => {
        if (!v) resetForm();
        onOpenChange(v);
    };

    // Mutations
    const mutationOptions = {
        onSuccess: () => {
            toast({ title: t('common.toastSuccess'), variant: 'default' });
            queryClient.invalidateQueries({ queryKey: ['marketing-ideas'] });
            queryClient.invalidateQueries({ queryKey: ['marketing-collabs'] });
            queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['website-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['marketing-accounts'] });
            handleOpenChange(false);
        },
        onError: (err: any) => {
            toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
        }
    };

    const createIdea = useMutation({ mutationFn: apiMarketing.createIdea, ...mutationOptions });
    const createCollab = useMutation({ mutationFn: apiMarketing.createCollaboration, ...mutationOptions });
    const createCampaign = useMutation({ mutationFn: apiMarketing.createCampaign, ...mutationOptions });
    const createWebTask = useMutation({ mutationFn: apiMarketing.createWebsiteTask, ...mutationOptions });
    const createAccount = useMutation({ mutationFn: apiMarketing.createAccount, ...mutationOptions });

    const isSubmitting = createIdea.isPending || createCollab.isPending || createCampaign.isPending || createWebTask.isPending || createAccount.isPending;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!type) return;

        switch (type) {
            case 'idea':
                createIdea.mutate({ title, type: (category as any) || 'video', status: 'draft' });
                break;
            case 'collab':
                createCollab.mutate({ name, type: (category as any) || 'influencer', status: 'prospect' });
                break;
            case 'campaign':
                createCampaign.mutate({ name, type: (category as any) || 'collaboration', status: 'idea' });
                break;
            case 'webtask':
                createWebTask.mutate({ title, status: 'todo', priority: 'normal' });
                break;
            case 'account':
                createAccount.mutate({ platform, username, url: '' });
                break;
        }
    };

    const actionTypes = [
        { id: 'idea', label: t('marketing.hub.creativeTitle'), icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { id: 'collab', label: t('marketing.hub.collabsTitle'), icon: Users, color: 'text-pink-400', bg: 'bg-pink-400/10' },
        { id: 'campaign', label: t('marketing.hub.roadmapTitle'), icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { id: 'webtask', label: t('marketing.hub.websiteTitle'), icon: Globe, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { id: 'account', label: t('marketing.hub.accountsTitle'), icon: AtSign, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    ];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none bg-white/95 dark:bg-[#050505]/95 backdrop-blur-xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-serif font-bold text-luxury-gold tracking-wide">
                        {step === 'select' ? t('marketing.quickAction.selectionTitle') : t('marketing.quickAction.formTitle')}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs uppercase tracking-widest">
                        {step === 'select' ? t('marketing.quickAction.selectionDesc') : t(`marketing.quickAction.create_${type}`)}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 pt-2">
                    {step === 'select' ? (
                        <div className="grid grid-cols-1 gap-2">
                            {actionTypes.map((act) => (
                                <button
                                    key={act.id}
                                    onClick={() => { setType(act.id as ActionType); setStep('form'); }}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-black/5 dark:border-white/5 hover:border-luxury-gold/30 hover:bg-luxury-gold/5 transition-all text-left group"
                                >
                                    <div className={`w-10 h-10 rounded-lg ${act.bg} flex items-center justify-center shrink-0`}>
                                        <act.icon className={`w-5 h-5 ${act.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground">{act.label}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{t('marketing.quickAction.addItem')}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-luxury-gold group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setStep('select')}
                                className="h-7 text-[10px] uppercase tracking-widest -ml-2 text-muted-foreground hover:text-luxury-gold"
                            >
                                <ChevronLeft className="w-3 h-3 mr-1" /> {t('common.previous')}
                            </Button>

                            {/* FIELDS ACCORDING TO TYPE */}
                            {type === 'idea' || type === 'webtask' ? (
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('marketing.creative.titleLabel')}</Label>
                                    <Input
                                        autoFocus
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={type === 'idea' ? t('marketing.creative.titlePh') : t('marketing.website.titleLabel')}
                                        className="bg-black/5 dark:bg-white/5 border-none"
                                        required
                                    />
                                </div>
                            ) : null}

                            {type === 'collab' || type === 'campaign' ? (
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('marketing.collabs.nameLabel')}</Label>
                                    <Input
                                        autoFocus
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={type === 'collab' ? t('marketing.collabs.namePh') : t('marketing.roadmap.namePh')}
                                        className="bg-black/5 dark:bg-white/5 border-none"
                                        required
                                    />
                                </div>
                            ) : null}

                            {type === 'account' ? (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('marketing.accounts.platformLabel')}</Label>
                                        <Input
                                            autoFocus
                                            value={platform}
                                            onChange={(e) => setPlatform(e.target.value)}
                                            placeholder="Ex: Instagram"
                                            className="bg-black/5 dark:bg-white/5 border-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('marketing.accounts.usernameLabel')}</Label>
                                        <Input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Ex: auclaire_empire"
                                            className="bg-black/5 dark:bg-white/5 border-none"
                                            required
                                        />
                                    </div>
                                </>
                            ) : null}

                            {/* SELECTOR FOR CATEGORY (if applicable) */}
                            {type === 'idea' && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('marketing.creative.typeLabel')}</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="bg-black/5 dark:bg-white/5 border-none">
                                            <SelectValue placeholder={t('marketing.creative.typeLabel')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="video">{t('marketing.creative.type_video')}</SelectItem>
                                            <SelectItem value="photo">{t('marketing.creative.type_photo')}</SelectItem>
                                            <SelectItem value="reel">{t('marketing.creative.type_reel')}</SelectItem>
                                            <SelectItem value="story">{t('marketing.creative.type_story')}</SelectItem>
                                            <SelectItem value="other">{t('marketing.creative.type_other')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {type === 'collab' && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('marketing.collabs.typeLabel')}</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="bg-black/5 dark:bg-white/5 border-none">
                                            <SelectValue placeholder={t('marketing.collabs.typeLabel')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="influencer">{t('marketing.collabs.type_influencer')}</SelectItem>
                                            <SelectItem value="brand">{t('marketing.collabs.type_brand')}</SelectItem>
                                            <SelectItem value="media">{t('marketing.collabs.type_media')}</SelectItem>
                                            <SelectItem value="other">{t('marketing.collabs.type_other')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {type === 'campaign' && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('marketing.roadmap.typeLabel')}</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="bg-black/5 dark:bg-white/5 border-none">
                                            <SelectValue placeholder={t('marketing.roadmap.typeLabel')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="launch">{t('marketing.roadmap.type_launch')}</SelectItem>
                                            <SelectItem value="ad">{t('marketing.roadmap.type_ad')}</SelectItem>
                                            <SelectItem value="collaboration">{t('marketing.roadmap.type_collaboration')}</SelectItem>
                                            <SelectItem value="event">{t('marketing.roadmap.type_event')}</SelectItem>
                                            <SelectItem value="contest">{t('marketing.roadmap.type_contest')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-luxury-gold to-luxury-gold/80 hover:from-luxury-gold/90 hover:to-luxury-gold text-black font-bold h-12 rounded-xl transition-all shadow-lg shadow-luxury-gold/10"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> {t('common.save')}</>}
                            </Button>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
