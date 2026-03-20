
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClients } from '@/services/apiClients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, KeyRound, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiUsers } from '@/services/apiUsers';
import { toast } from '@/components/ui/use-toast';
import { apiProjects } from '@/services/apiProjects';
import type { Project } from '@/services/apiProjects';

export default function ClientDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { role } = useAuth();

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [isSendingLink, setIsSendingLink] = useState(false);

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: apiClients.getAll
    });

    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll,
    });

    const client = clients?.find(c => c.id === id);
    const clientProjects = projects?.filter((p: Project) => p.client_id === id) || [];

    if (!client) return (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <p className="font-serif text-lg">Client introuvable</p>
            <Button variant="link" className="mt-2 text-luxury-gold" onClick={() => navigate('/dashboard/clients')}>
                Retour à la liste
            </Button>
        </div>
    );

    const handleSendAccessLink = async () => {
        if (!client.email) {
            toast({ title: "Erreur", description: "Ce client n'a pas d'adresse courriel.", variant: "destructive" });
            return;
        }
        setIsSendingLink(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: client.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/dashboard`
                }
            });
            if (error) throw error;
            toast({ title: "Lien envoyé", description: "Un lien d'accès a été envoyé à " + client.email });
        } catch (err: unknown) {
            toast({ title: "Erreur", description: err instanceof Error ? err.message : 'Erreur', variant: "destructive" });
        } finally {
            setIsSendingLink(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/clients')} className="text-muted-foreground hover:text-luxury-gold gap-1">
                    <ArrowLeft className="w-4 h-4" /> Clients
                </Button>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-black dark:text-white tracking-wide">{client.full_name}</h1>
                    <div className="flex items-center gap-2 text-sm text-luxury-gold mt-1">
                        <span className="uppercase text-[10px] tracking-[0.2em] font-medium">Profil Client</span>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-2 bg-luxury-gold/10 text-luxury-gold hover:bg-luxury-gold hover:text-black transition-colors border border-luxury-gold/50"
                        onClick={handleSendAccessLink}
                        disabled={isSendingLink || !client.email}
                    >
                        <LinkIcon className="w-4 h-4" /> {isSendingLink ? 'Envoi...' : 'Envoyer le lien portail'}
                    </Button>

                    {role === 'admin' && (
                        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold hover:text-black">
                                    <KeyRound className="w-4 h-4" /> Réinitialiser le mot de passe
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Réinitialiser le mot de passe du client</DialogTitle>
                                    <DialogDescription>
                                        Entrez un nouveau mot de passe pour {client.full_name}. Le client pourra se connecter immédiatement avec ce nouveau mot de passe.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Input
                                            id="new_password"
                                            type="password"
                                            placeholder="Nouveau mot de passe (min. 6 caractères)..."
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        disabled={newPassword.length < 6 || isUpdatingPassword}
                                        onClick={async () => {
                                            if (!id) return;
                                            setIsUpdatingPassword(true);
                                            try {
                                                await apiUsers.adminUpdatePassword(id, newPassword);
                                                toast({ title: "Succès", description: "Mot de passe mis à jour." });
                                                setIsPasswordModalOpen(false);
                                                setNewPassword('');
                                            } catch (err: unknown) {
                                                toast({ title: "Erreur", description: err instanceof Error ? err.message : 'Erreur', variant: "destructive" });
                                            } finally {
                                                setIsUpdatingPassword(false);
                                            }
                                        }}
                                    >
                                        {isUpdatingPassword ? 'Enregistrement...' : 'Enregistrer'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                    <Badge variant="outline" className={`border-luxury-gold/50 tracking-widest uppercase text-[10px] ${client.status === 'active' ? 'bg-luxury-gold/10 text-luxury-gold' : 'text-gray-500 dark:text-gray-400 border-black/10 dark:border-white/10'}`}>
                        {client.status}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 dark:hover:border-luxury-gold/30 transition-colors duration-500 shadow-xl group">
                    <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5">
                        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-luxury-gold">Informations de contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                        <div className="flex items-center gap-4 text-sm group-hover:text-black dark:group-hover:text-white transition-colors">
                            <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-luxury-gold/70 group-hover:bg-luxury-gold/10 group-hover:text-luxury-gold transition-colors">
                                <Mail className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">{client.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm group-hover:text-black dark:group-hover:text-white transition-colors">
                            <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-luxury-gold/70 group-hover:bg-luxury-gold/10 group-hover:text-luxury-gold transition-colors">
                                <Phone className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">{client.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm group-hover:text-black dark:group-hover:text-white transition-colors">
                            <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-luxury-gold/70 group-hover:bg-luxury-gold/10 group-hover:text-luxury-gold transition-colors">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">Aucune adresse enregistrée</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm group-hover:text-black dark:group-hover:text-white transition-colors">
                            <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-luxury-gold/70 group-hover:bg-luxury-gold/10 group-hover:text-luxury-gold transition-colors">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">Créé le {new Date(client.created_at).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/5 to-transparent pointer-events-none" />
                    <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5 relative z-10">
                        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-luxury-gold">Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 relative z-10">
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-serif leading-relaxed italic">{client.notes || 'Aucune note privée.'}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 shadow-xl">
                <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5">
                    <CardTitle className="text-xs font-semibold uppercase tracking-widest text-luxury-gold">
                        Projets ({clientProjects.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {clientProjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Aucun projet pour ce client.</p>
                    ) : (
                        <div className="space-y-3">
                            {clientProjects.map((p: Project) => (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-colors" onClick={() => navigate(`/dashboard/projects/${p.id}`)}>
                                    <div>
                                        <p className="font-medium font-serif">{p.title}</p>
                                        <p className="text-xs text-muted-foreground">{p.reference_number}</p>
                                    </div>
                                    <Badge variant="outline" className="capitalize text-xs">{p.status?.replace(/_/g, ' ')}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
