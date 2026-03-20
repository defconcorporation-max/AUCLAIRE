import { AffiliateProfile } from '@/services/apiAffiliates';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiAffiliates } from '@/services/apiAffiliates';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, ChevronRight, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function AffiliatesList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateProfile | null>(null);
    const [amountToPay, setAmountToPay] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: affiliates, isLoading } = useQuery({
        queryKey: ['affiliates-stats'],
        queryFn: async () => {
            const res = await apiAffiliates.getAllAffiliatesWithStats();
            return res;
        }
    });

    if (isLoading) return (
        <div className="space-y-8 max-w-7xl mx-auto p-6">
            <div><h1 className="text-3xl font-serif text-luxury-gold">Ambassadeurs & Admins</h1></div>
            <div className="grid gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="animate-pulse"><CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-muted" />
                            <div className="space-y-2 flex-1"><div className="h-5 w-40 bg-muted rounded" /><div className="h-4 w-56 bg-muted rounded" /></div>
                        </div>
                    </CardContent></Card>
                ))}
            </div>
        </div>
    );

    const fmt = (n: number) => n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });

    const totalPending = affiliates?.reduce((sum, a) => sum + (a.stats?.commissionPending || 0), 0) || 0;

    const filteredAffiliates = affiliates?.filter(a =>
        !searchTerm || a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenPayment = (affiliate: AffiliateProfile, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedAffiliate(affiliate);
        setAmountToPay(affiliate.stats?.commissionPending?.toString() || '0');
    };

    const handlePayCommission = async () => {
        if (!selectedAffiliate || !amountToPay) return;

        try {
            await apiAffiliates.payCommission(
                selectedAffiliate.id,
                parseFloat(amountToPay),
                paymentNotes
            );

            toast({ title: "Succès", description: "Commission versée avec succès." });
            setSelectedAffiliate(null);
            setAmountToPay('');
            setPaymentNotes('');
            queryClient.invalidateQueries({ queryKey: ['affiliates-stats'] });
        } catch {
            toast({ title: "Erreur", description: "Échec du versement.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif text-luxury-gold">Ambassadeurs & Admins</h1>
                    <p className="text-muted-foreground mt-1">Suivez les performances et les commissions des partenaires et administrateurs.</p>
                </div>
                {totalPending > 0 && (
                    <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-lg border border-amber-500/20 flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span className="font-bold">Commissions en attente : {fmt(totalPending)}</span>
                    </div>
                )}
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher un ambassadeur..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="grid gap-4">
                {filteredAffiliates?.length === 0 ? (
                    <Card className="bg-zinc-50/50 dark:bg-zinc-900/50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <Users size={48} className="mb-4 opacity-20" />
                            <p>Aucun partenaire ou administrateur trouvé.</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredAffiliates?.map((affiliate) => (
                        <Card
                            key={affiliate.id}
                            className="bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group"
                            onClick={() => navigate(`/dashboard/affiliates/${affiliate.id}`)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-luxury-gold/10 text-luxury-gold flex items-center justify-center font-serif text-xl font-bold">
                                            {affiliate.full_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{affiliate.full_name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Badge variant="secondary" className={`text-xs ${
                                                    affiliate.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    affiliate.role === 'ambassador' ? 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/20' :
                                                    'bg-zinc-100 dark:bg-zinc-800'
                                                }`}>
                                                    {affiliate.role === 'admin' ? 'Admin' : affiliate.role === 'ambassador' ? 'Ambassadeur' : 'Vendeur'}
                                                </Badge>
                                                <span>• {affiliate.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden md:block">
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Ventes totales</div>
                                            <div className="font-bold text-zinc-700 dark:text-zinc-300">
                                                {fmt(affiliate.stats?.totalSales ?? 0)}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">{affiliate.stats?.salesCount ?? 0} ventes</div>
                                        </div>

                                        <div className="text-right hidden xl:block">
                                            <div className="text-xs text-green-600/70 uppercase tracking-wider">Encaissé</div>
                                            <div className="font-bold text-green-600 dark:text-green-500">
                                                {fmt(affiliate.stats?.cashCollected ?? 0)}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Gagné</div>
                                            <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                                {fmt(affiliate.stats?.commissionEarned ?? 0)}
                                            </div>
                                        </div>

                                        <div className="text-right min-w-[150px]">
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider">À verser</div>
                                            <div className={`font-bold text-xl ${(affiliate.stats?.commissionPending ?? 0) > 0 ? 'text-amber-500' : 'text-zinc-400'}`}>
                                                {fmt(affiliate.stats?.commissionPending ?? 0)}
                                            </div>

                                            {(affiliate.stats?.commissionPending ?? 0) > 0 && (
                                                <Button
                                                    size="sm"
                                                    className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                                                    onClick={(e) => handleOpenPayment(affiliate, e)}
                                                >
                                                    Verser
                                                </Button>
                                            )}
                                        </div>

                                        <ChevronRight className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Payment Dialog */}
            <Dialog open={!!selectedAffiliate} onOpenChange={(open) => !open && setSelectedAffiliate(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verser la commission</DialogTitle>
                        <DialogDescription>
                            Enregistrer un versement de commission pour {selectedAffiliate?.full_name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Montant ($)</Label>
                            <Input
                                type="number"
                                value={amountToPay}
                                onChange={(e) => setAmountToPay(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes (Optionnel)</Label>
                            <Input
                                placeholder="ex. Réf. virement bancaire #123"
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedAffiliate(null)}>Annuler</Button>
                        <Button onClick={handlePayCommission} className="bg-emerald-600 hover:bg-emerald-700">
                            Confirmer le versement
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
