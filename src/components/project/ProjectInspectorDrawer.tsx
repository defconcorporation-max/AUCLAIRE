import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
    User, 
    Factory, 
    Handshake, 
    Shield, 
    Save, 
    Pencil, 
    X, 
    Mail, 
    Phone, 
    Calendar,
    Briefcase,
    CheckCircle2
} from 'lucide-react';
import { apiProjects, type Project } from '@/services/apiProjects';
import { apiActivities } from '@/services/apiActivities';
import { apiUsers, type UserProfile } from '@/services/apiUsers';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface ProjectInspectorDrawerProps {
    project: Project;
    isOpen: boolean;
    onClose: () => void;
    role: string;
    user: any;
}

export const ProjectInspectorDrawer: React.FC<ProjectInspectorDrawerProps> = ({
    project,
    isOpen,
    onClose,
    role,
    user
}) => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const localeTag = i18n.language.startsWith('fr') ? 'fr-CA' : 'en-CA';

    // Editing states
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(project.client_id || '');
    
    const [isEditingAffiliate, setIsEditingAffiliate] = useState(false);
    const [selectedAffiliateId, setSelectedAffiliateId] = useState(project.affiliate_id || '');
    
    const [isEditingManufacturer, setIsEditingManufacturer] = useState(false);
    const [selectedManufacturerId, setSelectedManufacturerId] = useState(project.manufacturer_id || '');

    const [internalNotes, setInternalNotes] = useState(project.internal_notes || '');

    // Fetch lists
    const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: () => apiUsers.getAll().then(users => users.filter(u => u.role === 'client')) });
    const { data: affiliates } = useQuery({ queryKey: ['affiliates'], queryFn: () => apiUsers.getAll().then(users => users.filter(u => u.role === 'affiliate')) });
    const { data: manufacturers } = useQuery({ queryKey: ['manufacturers'], queryFn: () => apiUsers.getAll().then(users => users.filter(u => u.role === 'manufacturer')) });

    useEffect(() => {
        setInternalNotes(project.internal_notes || '');
    }, [project.internal_notes]);

    const handleUpdateField = async (field: keyof Project, value: any, logAction: string) => {
        try {
            await apiProjects.update(project.id, { [field]: value });
            await apiActivities.log({
                project_id: project.id,
                user_id: user?.id || 'admin',
                user_name: user?.user_metadata?.full_name || 'Admin',
                action: 'update',
                details: logAction
            });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast({ title: t('common.success') });
        } catch (error: any) {
            toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-zinc-950 border-l border-luxury-gold/20">
                <SheetHeader className="border-b border-black/5 dark:border-white/5 pb-4 mb-6">
                    <SheetTitle className="text-luxury-gold font-serif flex items-center gap-2">
                        <Shield className="w-5 h-5" /> {t('projectDetailsPage.internalNotesTitle')}
                    </SheetTitle>
                    <SheetDescription className="text-[10px] uppercase tracking-widest">
                        {t('projectDetailsPage.updateStageDescription')}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-8">
                    {/* CLIENT SECTION */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <User className="w-3 h-3 text-luxury-gold" /> {t('projectDetailsPage.labelClient')}
                        </h3>
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-black/5 dark:border-white/5">
                            {!isEditingClient ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{project.client?.full_name || t('projectDetailsPage.labelClientFallback')}</span>
                                        {(role === 'admin' || role === 'secretary') && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingClient(true)}>
                                                <Pencil className="w-3 h-3 text-luxury-gold" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Mail className="w-3 h-3" /> {project.client?.email || 'N/A'}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Phone className="w-3 h-3" /> {project.client?.phone || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <select
                                        className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                        value={selectedClientId}
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                    >
                                        <option value="">{t('projectDetailsPage.noneOption')}</option>
                                        {clients?.map((c) => (
                                            <option key={c.id} value={c.id}>{c.full_name}</option>
                                        ))}
                                    </select>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => {
                                        handleUpdateField('client_id', selectedClientId || null, `Updated client to ${clients?.find(c => c.id === selectedClientId)?.full_name || 'None'}`);
                                        setIsEditingClient(false);
                                    }}>
                                        <Save className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setIsEditingClient(false)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* TEAM SECTION (Affiliate & Manufacturer) */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Briefcase className="w-3 h-3 text-luxury-gold" /> {t('projectDetailsPage.adminFinancialsTitle')}
                        </h3>
                        <div className="space-y-3">
                            {/* Affiliate */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-black/5 dark:border-white/5">
                                <span className="text-xs text-muted-foreground flex items-center gap-2"><Handshake className="w-3 h-3" /> {t('projectDetailsPage.ambassadorLabel')}</span>
                                {!isEditingAffiliate ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{project.affiliate?.full_name || t('projectDetailsPage.noneOption')}</span>
                                        {(role === 'admin' || role === 'secretary') && (
                                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsEditingAffiliate(true)}>
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <select
                                            className="h-7 rounded border border-input bg-background text-xs px-1 w-32"
                                            value={selectedAffiliateId}
                                            onChange={(e) => setSelectedAffiliateId(e.target.value)}
                                        >
                                            <option value="">{t('projectDetailsPage.noneOption')}</option>
                                            {affiliates?.map((a) => (
                                                <option key={a.id} value={a.id}>{a.full_name}</option>
                                            ))}
                                        </select>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500" onClick={() => {
                                            handleUpdateField('affiliate_id', selectedAffiliateId || null, `Updated ambassador to ${affiliates?.find(a => a.id === selectedAffiliateId)?.full_name || 'None'}`);
                                            setIsEditingAffiliate(false);
                                        }}>
                                            <Save className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Manufacturer */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-black/5 dark:border-white/5">
                                <span className="text-xs text-muted-foreground flex items-center gap-2"><Factory className="w-3 h-3" /> {t('projectDetailsPage.manufacturerLabel')}</span>
                                {!isEditingManufacturer ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{project.manufacturer?.full_name || t('projectDetailsPage.noneOption')}</span>
                                        {(role === 'admin' || role === 'secretary') && (
                                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsEditingManufacturer(true)}>
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <select
                                            className="h-7 rounded border border-input bg-background text-xs px-1 w-32"
                                            value={selectedManufacturerId}
                                            onChange={(e) => setSelectedManufacturerId(e.target.value)}
                                        >
                                            <option value="">{t('projectDetailsPage.noneOption')}</option>
                                            {manufacturers?.map((m) => (
                                                <option key={m.id} value={m.id}>{m.full_name}</option>
                                            ))}
                                        </select>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500" onClick={() => {
                                            handleUpdateField('manufacturer_id', selectedManufacturerId || null, `Updated manufacturer to ${manufacturers?.find(m => m.id === selectedManufacturerId)?.full_name || 'None'}`);
                                            setIsEditingManufacturer(false);
                                        }}>
                                            <Save className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* INTERNAL NOTES SECTION */}
                    {(role === 'admin' || role === 'secretary') && (
                        <section className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Shield className="w-3 h-3 text-luxury-gold" /> {t('projectDetailsPage.internalNotesTitle')}
                            </h3>
                            <div className="space-y-3">
                                <Textarea
                                    value={internalNotes}
                                    onChange={(e) => setInternalNotes(e.target.value)}
                                    placeholder={t('projectDetailsPage.internalNotesPlaceholder')}
                                    className="min-h-[150px] bg-white dark:bg-black/30 border-black/10 dark:border-white/10 resize-none text-sm"
                                />
                                <Button 
                                    className="w-full bg-luxury-gold text-black hover:bg-luxury-gold/90 h-10 gap-2"
                                    onClick={async () => {
                                        await handleUpdateField('internal_notes', internalNotes, 'Updated internal notes');
                                    }}
                                >
                                    <Save className="w-4 h-4" /> {t('common.save')}
                                </Button>
                            </div>
                        </section>
                    )}

                    {/* PROJECT INFO (Timeline preview) */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-luxury-gold" /> {t('projectDetailsPage.tabTimeline')}
                        </h3>
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-black/5 dark:border-white/5 space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{t('projectDetailsPage.deadlineLabel')}</span>
                                <span className="font-medium">{project.deadline ? new Date(project.deadline).toLocaleDateString(localeTag) : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Created</span>
                                <span className="font-medium">{new Date(project.created_at).toLocaleDateString(localeTag)}</span>
                            </div>
                        </div>
                    </section>
                </div>

                <SheetFooter className="mt-8 pt-6 border-t border-black/5 dark:border-white/5">
                    <Button variant="outline" className="w-full h-11" onClick={onClose}>
                        {t('common.close')}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
