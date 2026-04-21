import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { apiServices, CompanyService } from "@/services/apiServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function ServiceSettings() {
    const { t } = useTranslation();
    const [services, setServices] = useState<CompanyService[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Partial<CompanyService> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        setIsLoading(true);
        try {
            const data = await apiServices.getAll();
            setServices(data);
        } catch (error) {
            console.error(error);
            toast({ title: t('settings.errorLoadingServices', 'Error loading services'), variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingService?.name) {
            toast({ title: "Le nom du service est requis.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            if (editingService.id) {
                await apiServices.update(editingService.id, {
                    name: editingService.name,
                    description: editingService.description,
                    default_price: editingService.default_price
                });
                toast({ title: "Service mis à jour avec succès" });
            } else {
                await apiServices.create({
                    name: editingService.name,
                    description: editingService.description,
                    default_price: editingService.default_price || 0
                });
                toast({ title: "Service créé avec succès" });
            }
            await loadServices();
            setIsModalOpen(false);
            setEditingService(null);
        } catch (error) {
            console.error(error);
            toast({ title: "Erreur lors de l'enregistrement du service", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) return;

        try {
            await apiServices.delete(id);
            toast({ title: "Service supprimé avec succès" });
            await loadServices();
        } catch (error) {
            console.error(error);
            toast({ title: "Erreur lors de la suppression du service", variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" /> Gestion des Services
                    </CardTitle>
                    <CardDescription>
                        Gérez les services offerts que vous pouvez facturer ou attacher aux projets.
                    </CardDescription>
                </div>
                <Button onClick={() => { setEditingService({ name: '', description: '', default_price: 0 }); setIsModalOpen(true); }} className="bg-luxury-gold hover:bg-amber-600 text-black">
                    <Plus className="w-4 h-4 mr-2" /> Ajouter un Service
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
                    </div>
                ) : (
                    <div className="rounded-md border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/10">
                                    <TableHead>Nom du service</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Prix par défaut</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            Aucun service configuré. Cliquez sur "Ajouter un Service" pour commencer.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    services.map((service) => (
                                        <TableRow key={service.id} className="border-white/10 hover:bg-white/5">
                                            <TableCell className="font-medium text-foreground">{service.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{service.description || '-'}</TableCell>
                                            <TableCell className="text-right font-mono">${Number(service.default_price).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingService(service); setIsModalOpen(true); }} className="h-8 w-8 hover:bg-white/10">
                                                        <Pencil className="w-4 h-4 text-muted-foreground hover:text-luxury-gold" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)} className="h-8 w-8 hover:bg-red-500/20">
                                                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-white/10 text-foreground">
                    <DialogHeader>
                        <DialogTitle>
                            {editingService?.id ? 'Modifier le service' : 'Ajouter un service'}
                        </DialogTitle>
                        <DialogDescription>
                            Définissez le nom, la description et le prix de base de ce service.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nom du service <span className="text-red-500">*</span></label>
                            <Input
                                value={editingService?.name || ''}
                                onChange={(e) => setEditingService(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Ex: Design Sur Mesure 3D"
                                className="bg-black/40 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                value={editingService?.description || ''}
                                onChange={(e) => setEditingService(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Brève description du service"
                                className="bg-black/40 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Prix par défaut ($)</label>
                            <Input
                                type="number"
                                min="0"
                                step="1"
                                value={editingService?.default_price || 0}
                                onChange={(e) => setEditingService(prev => ({ ...prev, default_price: parseFloat(e.target.value) || 0 }))}
                                className="bg-black/40 border-white/10"
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-white/10 hover:bg-white/5">
                            Annuler
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-luxury-gold hover:bg-amber-600 text-black">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
