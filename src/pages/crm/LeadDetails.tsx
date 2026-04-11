import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Phone, Mail, Clock, Calendar, MessageSquare, Play, PhoneIncoming, PhoneOutgoing, Edit, Save, X, Loader2 } from 'lucide-react';
import Dialer from '@/components/crm/Dialer';
import { apiLeads, Lead, type Message } from '@/services/apiLeads';

const mockCallHistory = [
    { id: 1, type: 'outgoing' as const, duration: '5m 23s', timestamp: '2026-02-26T10:30:00Z', notes: 'Discussed the 2ct Radiant Cut. Client is very interested.', hasRecording: true },
    { id: 2, type: 'incoming' as const, duration: '2m 10s', timestamp: '2026-02-25T14:15:00Z', notes: 'Missed call. Left a voicemail.', hasRecording: false },
    { id: 3, type: 'outgoing' as const, duration: '12m 45s', timestamp: '2026-02-20T09:20:00Z', notes: 'Initial consultation and budget qualification.', hasRecording: true },
];

export default function LeadDetails() {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language.startsWith('en') ? 'en-US' : 'fr-FR';
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isDialerOpen, setIsDialerOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newMessage, setNewMessage] = useState('');

    const { data: lead, isLoading: isLeadLoading, error: leadError } = useQuery({
        queryKey: ['lead', id],
        queryFn: () => apiLeads.getById(id),
        enabled: !!id
    });

    const { data: messages = [] } = useQuery({
        queryKey: ['messages', id],
        queryFn: () => apiLeads.getMessages(id),
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

    const sendMessageMutation = useMutation({
        mutationFn: (content: string) => apiLeads.createMessage({
            lead_id: id,
            content,
            sender_type: 'agent',
            platform: lead?.source === 'facebook' ? 'facebook' : 'whatsapp'
        }),
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['messages', id] });
        },
        onError: (err) => {
            console.error('Failed to send message:', err);
            alert(t('crmLeadDetails.sendError'));
        }
    });

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sendMessageMutation.isPending) return;
        sendMessageMutation.mutate(newMessage);
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

    const handleCall = () => {
        setIsDialerOpen(true);
    };

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
        <div className="space-y-6 max-w-7xl mx-auto">
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
                        <p className="text-muted-foreground mt-1 text-sm bg-black/5 dark:bg-white/5 px-3 py-1 rounded-md inline-block">
                            {t('crmLeadDetails.sourceLabel')} <span className="capitalize">{lead.source}</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button onClick={handleCall} className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 transition-all border-none">
                        <Phone className="w-4 h-4 mr-2" />
                        {t('crmLeadDetails.callLead')}
                    </Button>
                    
                    {/* CONVERT BUTTON - NEW */}
                    {lead.status !== 'won' && (
                        <Button 
                            onClick={async () => {
                                if (!confirm("Voulez-vous convertir ce lead en projet ?")) return;
                                try {
                                    const { apiProjects } = await import('@/services/apiProjects');
                                    const newProject = await apiProjects.create({
                                        title: `Projet - ${lead.name}`,
                                        description: lead.notes || '',
                                        budget: lead.value || 0,
                                        status: 'designing',
                                        affiliate_id: lead.affiliate_id,
                                        // You might want to link client too if you have one, 
                                        // for now we just pass the names and basics
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

                    <Button variant="outline" className="border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
                        <Mail className="w-4 h-4 mr-2" />
                        {t('crmLeadDetails.email')}
                    </Button>
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
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#0A0A0A] rounded-lg border border-black/5 dark:border-white/5 transition-all">
                                <div className="w-10 h-10 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('crmLeadDetails.phone')}</p>
                                    {isEditing ? (
                                        <Input
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="h-7 mt-1 text-sm bg-transparent border-black/20 dark:border-white/20 focus-visible:ring-1 focus-visible:ring-luxury-gold/50"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium truncate">{lead.phone || t('crmLeadDetails.na')}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#0A0A0A] rounded-lg border border-black/5 dark:border-white/5 transition-all">
                                <div className="w-10 h-10 shrink-0 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('crmLeadDetails.emailLabel')}</p>
                                    {isEditing ? (
                                        <Input
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="h-7 mt-1 text-sm bg-transparent border-black/20 dark:border-white/20 focus-visible:ring-1 focus-visible:ring-luxury-gold/50"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium truncate">{lead.email || t('crmLeadDetails.na')}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#0A0A0A] rounded-lg border border-black/5 dark:border-white/5">
                                <div className="w-10 h-10 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('crmLeadDetails.createdInCrm')}</p>
                                    <p className="text-sm font-medium truncate">{new Date(lead.created_at).toLocaleDateString(dateLocale)}</p>
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
                                        className="text-2xl font-serif text-luxury-gold h-12 w-32 bg-transparent border-black/20 dark:border-white/20 focus-visible:ring-1 focus-visible:ring-luxury-gold/50"
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
                                    <Clock className="w-5 h-5 text-luxury-gold" />
                                    {t('crmLeadDetails.commHistory')}
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-black dark:hover:text-white">{t('crmLeadDetails.filterAll')}</Button>
                                    <Button variant="ghost" size="sm" className="text-xs font-semibold uppercase tracking-wider text-blue-500 hover:bg-blue-500/10">{t('crmLeadDetails.filterCalls')}</Button>
                                    <Button variant="ghost" size="sm" className="text-xs font-semibold uppercase tracking-wider text-purple-500 hover:bg-purple-500/10">{t('crmLeadDetails.filterNotes')}</Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-6 space-y-6">

                            {mockCallHistory.map((call) => (
                                <div key={call.id} className="relative pl-8 before:absolute before:inset-y-0 before:left-[15px] before:w-[2px] before:bg-luxury-gold/20 last:before:bottom-auto last:before:h-full">
                                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-[#0A0A0A] ${call.type === 'outgoing' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                        {call.type === 'outgoing' ? <PhoneOutgoing className="w-3 h-3" /> : <PhoneIncoming className="w-3 h-3" />}
                                    </div>

                                    <div className="bg-white dark:bg-black rounded-xl p-4 border border-black/5 dark:border-white/5 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold text-sm capitalize flex items-center gap-2">
                                                    {call.type === 'outgoing' ? t('crmLeadDetails.callOutgoing') : t('crmLeadDetails.callIncoming')}
                                                    <span className="text-xs font-normal text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                                        {call.duration}
                                                    </span>
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(call.timestamp).toLocaleString(dateLocale)}
                                                </p>
                                            </div>

                                            {call.hasRecording && (
                                                <Button variant="outline" size="sm" className="h-8 gap-2 text-xs border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10">
                                                    <Play className="w-3 h-3" /> {t('crmLeadDetails.playRecording')}
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 bg-black/5 dark:bg-white/5 p-3 rounded-lg border-l-2 border-luxury-gold">
                                            {call.notes}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {messages.map((msg: Message) => (
                                <div key={msg.id} className="relative pl-8 before:absolute before:inset-y-0 before:left-[15px] before:w-[2px] before:bg-luxury-gold/20">
                                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-[#0A0A0A] ${msg.sender_type === 'agent' ? 'bg-luxury-gold text-white' : 'bg-pink-100 text-pink-600 dark:bg-pink-900/30'}`}>
                                        <MessageSquare className="w-3 h-3" />
                                    </div>
                                    <div className={`rounded-xl p-4 border shadow-sm ${msg.sender_type === 'agent' ? 'bg-luxury-gold/5 border-luxury-gold/20' : 'bg-gray-50 dark:bg-white/5 border-black/5 dark:border-white/5'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                                    {msg.sender_type === 'agent' ? t('crmLeadDetails.crmReply') : t('crmLeadDetails.messagePlatform', { platform: msg.platform })}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(msg.created_at).toLocaleString(dateLocale)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                                            {msg.content}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {lead.source === 'facebook' && (
                                <div className="relative pl-8 before:absolute before:inset-y-0 before:left-[15px] before:w-[2px] before:bg-luxury-gold/20">
                                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-[#0A0A0A] bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                                        <MessageSquare className="w-3 h-3" />
                                    </div>
                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-500/20 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                                    {t('crmLeadDetails.fbFormTitle')}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(lead.created_at).toLocaleString(dateLocale)}
                                                </p>
                                            </div>
                                        </div>

                                        {lead.notes && (
                                            <p className="text-sm italic text-gray-700 dark:text-gray-300 mt-2">
                                                {lead.notes}
                                            </p>
                                        )}

                                        {lead.metadata && typeof lead.metadata === 'object' && Object.keys(lead.metadata).length > 0 && (
                                            <div className="mt-4 space-y-3 pt-3 border-t border-blue-500/10">
                                                {Object.entries(lead.metadata).map(([key, value]) => (
                                                    <div key={key} className="space-y-1">
                                                        <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                                                            {key.replace(/_/g, ' ')}
                                                        </p>
                                                        <p className="text-sm font-medium">
                                                            {String(value)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </CardContent>

                        <div className="p-4 border-t border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    placeholder={t('crmLeadDetails.replyPlaceholder', { name: lead.name, source: lead.source })}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="bg-white dark:bg-black border-black/10 dark:border-white/10"
                                />
                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                                    className="bg-luxury-gold hover:bg-luxury-gold/90 text-black font-semibold"
                                >
                                    {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('crmLeadDetails.send')}
                                </Button>
                            </form>
                            <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                {t('crmLeadDetails.sendingFooter')}
                            </p>
                        </div>
                    </Card>
                </div>
            </div>

            <Dialer
                isOpen={isDialerOpen}
                onClose={() => setIsDialerOpen(false)}
                contactName={lead.name}
                phoneNumber={lead.phone || ''}
            />
        </div>
    );
}
