
import { useEffect, useState } from 'react';
import { apiAffiliates, AffiliateProfile } from '@/services/apiAffiliates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Edit } from 'lucide-react';
// import { toast } from 'sonner';

export default function AffiliatesList() {
    const [affiliates, setAffiliates] = useState<AffiliateProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingAffiliate, setEditingAffiliate] = useState<AffiliateProfile | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [status, setStatus] = useState<string>('pending');
    const [level, setLevel] = useState<string>('starter');
    const [rate, setRate] = useState<number>(10);
    const [type, setType] = useState<string>('percent');

    const loadAffiliates = async () => {
        try {
            const data = await apiAffiliates.getAffiliates();
            setAffiliates(data);
        } catch (error) {
            console.error("Failed to load affiliates", error);
            // alert("Impossible de charger les affiliés");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAffiliates();
    }, []);

    const handleEdit = (affiliate: AffiliateProfile) => {
        setEditingAffiliate(affiliate);
        setStatus(affiliate.affiliate_status || 'pending');
        setLevel(affiliate.affiliate_level || 'starter');
        setRate(affiliate.commission_rate || 10);
        setType(affiliate.commission_type || 'percent');
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editingAffiliate) return;

        try {
            await apiAffiliates.updateAffiliate(editingAffiliate.id, {
                affiliate_status: status as any,
                affiliate_level: level as any,
                commission_rate: Number(rate),
                commission_type: type as any
            });
            // toast.success("Affilié mis à jour");
            setIsDialogOpen(false);
            loadAffiliates();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la mise à jour");
        }
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-serif">Gestion des Ambassadeurs</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <div className="rounded-md border bg-white dark:bg-zinc-900">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Niveau</TableHead>
                                <TableHead>Commission</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {affiliates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        Aucun ambassadeur trouvé.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                affiliates.map((affiliate) => (
                                    <TableRow key={affiliate.id}>
                                        <TableCell className="font-medium">
                                            {affiliate.full_name || 'Sans nom'}
                                            <div className="text-xs text-gray-400">{affiliate.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={affiliate.affiliate_status === 'active' ? 'default' : 'secondary'} className={
                                                affiliate.affiliate_status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                                    affiliate.affiliate_status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500'
                                            }>
                                                {affiliate.affiliate_status || 'Pending'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize border-luxury-gold text-luxury-gold bg-luxury-gold/5">
                                                {affiliate.affiliate_level || 'Starter'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {affiliate.commission_rate}% {affiliate.commission_type === 'fixed' ? '(Fixe)' : ''}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(affiliate)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier l'Ambassadeur</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Statut</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="pending">En attente</option>
                                <option value="active">Actif</option>
                                <option value="rejected">Rejeté</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Niveau</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                            >
                                <option value="starter">Starter</option>
                                <option value="confirmed">Confirmé</option>
                                <option value="elite">Élite</option>
                                <option value="partner">Partenaire</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Taux / Montant</Label>
                                <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="percent">Pourcentage (%)</option>
                                    <option value="fixed">Montant Fixe ($)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleSave} className="bg-luxury-gold hover:bg-luxury-gold/90 text-black">Enregistrer</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
