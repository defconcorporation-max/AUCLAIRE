import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UserPlus, FilePlus } from 'lucide-react';
import { apiClients } from '@/services/apiClients';
import { apiProjects } from '@/services/apiProjects';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

interface AmbassadorNewSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AmbassadorNewSaleModal({ isOpen, onClose }: AmbassadorNewSaleModalProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'client' | 'project'>('client');
    
    // Client Data
    const [clientData, setClientData] = useState({
        full_name: '',
        email: '',
        phone: '',
    });
    
    // Project Data
    const [projectData, setProjectData] = useState({
        title: '',
        description: '',
        budget: '',
    });

    const [createdClientId, setCreatedClientId] = useState<string | null>(null);

    const resetForm = () => {
        setStep('client');
        setClientData({ full_name: '', email: '', phone: '' });
        setProjectData({ title: '', description: '', budget: '' });
        setCreatedClientId(null);
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Check if client exists by email maybe? 
            // For now, let's just create.
            const newClient = await apiClients.create(clientData);
            setCreatedClientId(newClient.id);
            setProjectData(prev => ({ ...prev, title: `Design - ${clientData.full_name}` }));
            setStep('project');
            toast({ title: t('common.success'), description: "Client créé avec succès." });
        } catch (error: any) {
            toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createdClientId) return;
        setLoading(true);
        try {
            await apiProjects.create({
                title: projectData.title,
                description: projectData.description,
                budget: parseFloat(projectData.budget) || 0,
                client_id: createdClientId,
                affiliate_id: user?.id, // Assigned to the ambassador
                status: 'designing',
            });
            
            toast({ 
                title: "Projet Initié", 
                description: "Le design initial a été créé et est en attente de revue administrative." 
            });
            
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            resetForm();
            onClose();
        } catch (error: any) {
            toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] glass-card border-luxury-gold/20">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif text-luxury-gold flex items-center gap-2">
                        {step === 'client' ? <UserPlus className="w-6 h-6" /> : <FilePlus className="w-6 h-6" />}
                        {step === 'client' ? "Nouveau Client" : "Détails du Design"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'client' 
                            ? "Commencez par enregistrer les informations de votre client." 
                            : "Décrivez le projet de bijoux pour nos designers."}
                    </DialogDescription>
                </DialogHeader>

                {step === 'client' ? (
                    <form onSubmit={handleCreateClient} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Nom Complet</Label>
                            <Input 
                                id="full_name" 
                                value={clientData.full_name} 
                                onChange={e => setClientData({...clientData, full_name: e.target.value})}
                                required
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                                id="email" 
                                type="email"
                                value={clientData.email} 
                                onChange={e => setClientData({...clientData, email: e.target.value})}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input 
                                id="phone" 
                                value={clientData.phone} 
                                onChange={e => setClientData({...clientData, phone: e.target.value})}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full bg-luxury-gold text-black hover:bg-luxury-gold/90" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Continuer vers le Projet"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <form onSubmit={handleCreateProject} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Titre du Projet</Label>
                            <Input 
                                id="title" 
                                value={projectData.title} 
                                onChange={e => setProjectData({...projectData, title: e.target.value})}
                                required
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="budget">Estimation Budget ($)</Label>
                            <Input 
                                id="budget" 
                                type="number"
                                value={projectData.budget} 
                                onChange={e => setProjectData({...projectData, budget: e.target.value})}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Notes & Souhaits du Client</Label>
                            <Textarea 
                                id="description" 
                                value={projectData.description} 
                                onChange={e => setProjectData({...projectData, description: e.target.value})}
                                placeholder="Taille de bague, type d'or, type de pierre..."
                                className="bg-white/5 border-white/10 min-h-[120px]"
                            />
                        </div>
                        <DialogFooter className="pt-4 gap-2">
                            <Button type="button" variant="ghost" onClick={() => setStep('client')} disabled={loading}>
                                Retour
                            </Button>
                            <Button type="submit" className="flex-1 bg-luxury-gold text-black hover:bg-luxury-gold/90" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Créer le Design"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
