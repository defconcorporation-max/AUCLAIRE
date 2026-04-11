import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Phone, Mail, Calendar, Edit, Save, X, Loader2, Sparkles, FileText } from 'lucide-react';
import { apiLeads, Lead } from '@/services/apiLeads';

export default function LeadDetails() {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language.startsWith('en') ? 'en-US' : 'fr-FR';
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [activeNotes, setActiveNotes] = useState('');

    const { data: lead, isLoading: isLeadLoading, error: leadError } = useQuery({
        queryKey: ['lead', id],
        queryFn: async () => {
            const data = await apiLeads.getById(id);
            setActiveNotes(data.notes || '');
            return data;
        },
        enabled: !!id
    });

    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', value: '' });

    const updateLeadMutation = useMutation({
        mutationFn: (updates: Partial<Lead>) => apiLeads.update(id, updates),
        onSuccess: (updatedLead) => {
            queryClient.setQueryData(['lead', id], updatedLead);
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            setIsEditing(false);
        }
    });

    const handleSaveNotes = async () => {
        setIsSavingNotes(true);
        try {
            await apiLeads.update(id, { notes: activeNotes });
            queryClient.invalidateQueries({ queryKey: ['lead', id] });
        } catch (error) {
            console.error('Failed to save notes:', error);
            alert('Erreur lors de la sauvegarde des notes.');
        } finally {
            setIsSavingNotes(false);
        }
    };

    const leadStatusLabel = (s: string) =>
        t(`leadStatus.${s}` as 'leadStatus.new', { defaultValue: s });

    if (isLeadLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
            </div>
        );
    }

    if (leadError || !lead) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-serif text-red-500">{t('crmLeadDetails.notFound')}</h2>
                <Button onClick={() => navigate('/dashboard/leads')} className="mt-4">{t('crmLeadDetails.goBack')}</Button>
            </div>
        );
    }

    const handleSave = () => {
        updateLeadMutation.mutate({
            name: editForm.name,
            email: editForm.email,
            phone: editForm.phone,
            value: parseFloat(editForm.value) || 0
        });
    };

    const handleCancel = () => {
        setEditForm({
            name: lead.name,
            email: lead.email || '',
            phone: lead.phone || '',
            value: lead.value?.toString() || '0'
        });
        setIsEditing(false);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/leads')} className="hover:bg-black/5 dark:hover:bg-white/5">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        {isEditing ? (
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="text-xl font-serif font-bold text-luxury-gold h-10 w-64 bg-transparent border-black/20 dark:border-white/20 focus-visible:ring-1 focus-visible:ring-luxury-gold/50"
                            />
                        ) : (
                            <h2 className="text-3xl font-serif font-bold tracking-tight text-luxury-gold flex items-center gap-3">
                                {lead.name}
                                <span className="text-[10px] bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20 px-2 py-1 rounded-full uppercase tracking-widest font-sans font-semibold">
                                    {leadStatusLabel(lead.status)}
                                </span>
                            </h2>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-muted-foreground text-sm bg-black/5 dark:bg-white/5 px-3 py-1 rounded-md inline-block">
                                {t('crmLeadDetails.sourceLabel')} <span className="capitalize">{lead.source}</span>
                            </p>
                            {lead.affiliate && (
                                <p className="text-luxury-gold text-sm bg-luxury-gold/10 px-3 py-1 rounded-md inline-block font-semibold border border-luxury-gold/20">
                                    Ambassadeur: {lead.affiliate.full_name || 'Inconnu'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    {/* CONVERT BUTTON */}
                    {lead.status !== 'won' && (
                        <Button 
                            onClick={async () => {
                                if (!confirm("Voulez-vous convertir ce lead en projet ?")) return;
                                try {
                                    const { apiProjects } = await import('@/services/apiProjects');
                                    const newProject = await apiProjects.create({
                                        title: `Projet - ${lead.name}`,
                                        description: activeNotes || lead.notes || '',
                                        budget: lead.value || 0,
                                        status: 'designing',
                                        affiliate_id: lead.affiliate_id,
                                    });
                                    
                                    await apiLeads.update(lead.id, { status: 'won' });
                                    queryClient.invalidateQueries({ queryKey: ['lead', id] });
                                    
                                    if (confirm("Lead converti ! Souhaitez-vous voir le projet ?")) {
                                        navigate(`/dashboard/projects/${newProject.id}`);
                                    }
                                } catch (err) {
                                    console.error("Conversion failed:", err);
                                    alert("Erreur lors de la conversion.");
                                }
                            }}
                            className="bg-luxury-gold text-black hover:bg-luxury-gold/90 shadow-lg shadow-luxury-gold/20"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Convertir en Projet
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-white to-gray-50/50 dark:from-black dark:to-[#050505] shadow-sm border-black/5 dark:border-white/5">
                        <CardHeader className="pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-serif">{t('crmLeadDetails.contactInfo')}</CardTitle>
                            {isEditing ? (
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleSave}
                                        disabled={updateLeadMutation.isPending}
                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                        <Save className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setEditForm({
                                            name: lead.name,
                                            email: lead.email || '',
                                            phone: lead.phone || '',
                                            value: lead.value?.toString() || '0'
                                        });
                                        setIsEditing(true);
                                    }}
                                    className="h-8 text-muted-foreground hover:text-luxury-gold"
                                >
                                    <Edit className="w-3.5 h-3.5 mr-1" /> {t('common.edit')}
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#0A0A0A] rounded-lg border border-black/5 dark:border-white/5">
                                <Phone className="w-4 h-4 text-luxury-gold" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('crmLeadDetails.phone')}</p>
                                    {isEditing ? (
                                        <Input
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="h-7 mt-1 text-sm bg-transparent border-black/20 dark:border-white/20"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium">{lead.phone || t('crmLeadDetails.na')}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#0A0A0A] rounded-lg border border-black/5 dark:border-white/5">
                                <Mail className="w-4 h-4 text-luxury-gold" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('crmLeadDetails.emailLabel')}</p>
                                    {isEditing ? (
                                        <Input
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="h-7 mt-1 text-sm bg-transparent border-black/20 dark:border-white/20"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium truncate">{lead.email || t('crmLeadDetails.na')}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#0A0A0A] rounded-lg border border-black/5 dark:border-white/5">
                                <Calendar className="w-4 h-4 text-luxury-gold" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('crmLeadDetails.createdInCrm')}</p>
                                    <p className="text-sm font-medium">{new Date(lead.created_at).toLocaleDateString(dateLocale)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 dark:bg-black/60 backdrop-blur-md shadow-sm border-black/5 dark:border-white/5">
                        <CardHeader>
                            <CardTitle className="text-lg font-serif">{t('crmLeadDetails.pipelineValue')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-serif text-luxury-gold">$</span>
                                    <Input
                                        type="number"
                                        value={editForm.value}
                                        onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                                        className="text-2xl font-serif text-luxury-gold h-12 w-32 bg-transparent border-black/20 dark:border-white/20"
                                    />
                                </div>
                            ) : (
                                <div className="text-4xl font-serif text-luxury-gold tracking-tight">
                                    ${lead.value ? lead.value.toLocaleString() : '0'}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">{t('crmLeadDetails.estimatedValue')}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card className="h-full bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md border border-black/5 dark:border-white/5 shadow-md flex flex-col">
                        <CardHeader className="border-b border-black/5 dark:border-white/5 pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xl font-serif flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-luxury-gold" />
                                    Notes & Détails du Projet
                                </CardTitle>
                                <Button 
                                    onClick={handleSaveNotes}
                                    disabled={isSavingNotes || activeNotes === lead.notes}
                                    className="h-8 bg-luxury-gold text-black hover:bg-luxury-gold/90 text-xs font-bold uppercase tracking-widest"
                                >
                                    {isSavingNotes ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                                    Enregistrer les Notes
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            <Textarea 
                                value={activeNotes}
                                onChange={(e) => setActiveNotes(e.target.value)}
                                placeholder="Saisissez les notes ici... budget, préférences de design, pierres souhaitées, etc."
                                className="w-full h-full min-h-[400px] p-6 text-base bg-transparent border-none focus-visible:ring-0 resize-none font-sans leading-relaxed"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
