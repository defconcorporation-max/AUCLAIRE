import { Invoice } from '@/services/apiInvoices';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiAffiliates, AffiliateProfile } from '@/services/apiAffiliates';
import { supabase } from '@/lib/supabase';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, Loader2, CheckCircle, Clock, Trash2, Briefcase } from 'lucide-react';
import { apiProjects } from '@/services/apiProjects';

export default function AffiliateDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [affiliate, setAffiliate] = useState<AffiliateProfile | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [pendingCommissions, setPendingCommissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPayingId, setIsPayingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Editable Fields
    const [fullName, setFullName] = useState('');
    // const [email, setEmail] = useState(''); // Note: Email is tricky with Supabase Profiles vs Auth
    const [status, setStatus] = useState<string>('pending');
    const [level, setLevel] = useState<string>('starter');
    const [rate, setRate] = useState<number>(10);
    const [type, setType] = useState<string>('percent');

    useEffect(() => {
        if (!id) return;
        loadData();
    }, [id]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Profile (Manual fetch from apiAffiliates or re-use getAffiliates and find?)
            // We don't have getById yet in apiAffiliates, so let's add it or just use getAffiliates for now (inefficient but works)
            // Actually, let's implement a simple direct fetch here or assuming apiAffiliates has getById
            // Since I didn't add getById to apiAffiliates, I'll fetch the list and find (temporary) OR I'll add the method.
            // Let's assume I'll add getById to apiAffiliates.ts shortly. For now, I'll implement the fetch inline to be safe.
            const list = await apiAffiliates.getAffiliates();
            const found = list.find(a => a.id === id);

            if (found) {
                setAffiliate(found);
                setFullName(found.full_name || '');
                setStatus(found.affiliate_status || 'pending');
                setLevel(found.affiliate_level || 'starter');
                setRate(found.commission_rate || 10);
                setType(found.commission_type || 'percent');

                // 2. Fetch Stats
                const statsData = await apiAffiliates.getAffiliateStats(id!);
                setStats(statsData);

                // 3. Fetch Pending Commissions from expenses table
                const { data: commData } = await supabase
                    .from('expenses')
                    .select('id, amount, description, date, status, project_id, project:projects(title)')
                    .eq('recipient_id', id!)
                    .eq('category', 'commission')
                    .order('date', { ascending: false });
                setPendingCommissions(commData || []);
            }
        } catch (error) {
            console.error("Failed to load affiliate", error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (error) return (
        <div className="p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-red-500">Failed to load Affiliate Data</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm bg-zinc-100 p-2 rounded max-w-lg mx-auto font-mono">
                Hint: Check if 'budget' or 'affiliate_id' columns exist in your database.
            </p>
            <Button onClick={loadData}>Retry</Button>
        </div>
    );
    if (!affiliate) return <div className="p-8 text-center text-red-500">Affiliate not found.</div>;

    const handleSave = async () => {
        if (!id) return;
        setIsSaving(true);
        try {
            await apiAffiliates.updateAffiliate(id, {
                full_name: fullName,
                affiliate_status: status as any,
                affiliate_level: level as any,
                commission_rate: Number(rate),
                commission_type: type as any
            });
            alert("Affiliate updated successfully!");
            loadData(); // Reload
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePayCommission = async (commissionId: string, amount: number) => {
        if (!confirm(`Marquer cette commission de ${new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(amount))} comme PAYÉE ?`)) return;
        setIsPayingId(commissionId);
        try {
            await supabase
                .from('expenses')
                .update({ status: 'paid' })
                .eq('id', commissionId);
            await loadData();
        } catch (err) {
            alert('Échec du paiement : ' + err.message);
        } finally {
            setIsPayingId(null);
        }
    };

    const handleDeleteExpense = async (expenseId: string, projectId?: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir ANNULER et SUPPRIMER cette commission ?\nCela réinitialisera également la commission du projet à 0%.`)) return;
        try {
            // Delete the expense record
            await supabase.from('expenses').delete().eq('id', expenseId);

            // If it was linked to a project, reset the project financials
            if (projectId) {
                await apiProjects.updateFinancials(projectId, { commission_exported_to_expenses: false });
                await apiProjects.update(projectId, { affiliate_commission_rate: 0, affiliate_commission_type: 'percent' });
            }

            alert('Commission annulée avec succès.');
            await loadData();
        } catch (err) {
            alert('Erreur lors de la suppression : ' + err.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/affiliates')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                        {affiliate.full_name}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="outline">{affiliate.role}</Badge>
                        <span className="text-luxury-gold uppercase font-bold text-xs tracking-wider">
                            {affiliate.affiliate_level}
                        </span>
                    </div>
                </div>
                <div className="ml-auto">
                    <Button onClick={handleSave} disabled={isSaving} className="bg-luxury-gold hover:bg-luxury-gold/90 text-black gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-5">
                <Card className="bg-zinc-900 text-white border-zinc-800">
                    <CardHeader className="pb-2 text-luxury-gold flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Ventes Totales</CardTitle>
                        <Briefcase className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif">
                            {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(stats?.totalSales || 0)}
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Volume de vente total</p>
                    </CardContent>
                </Card>
                {/* Stats Cards */}
                <Card className="bg-zinc-900 text-white border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Commission totale estimée</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-luxury-gold">
                            {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(stats?.commissionEarned || 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700">En attente de paiement</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-amber-600">
                            {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(
                                pendingCommissions.filter(c => c.status === 'pending').reduce((s: number, c: Invoice) => s + Number(c.amount), 0)
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">Déjà payé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-green-600">
                            {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(
                                pendingCommissions.filter(c => c.status === 'paid').reduce((s: number, c: Invoice) => s + Number(c.amount), 0)
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Default Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif">
                            {affiliate.commission_rate}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Edit Profile Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Profile Settings</CardTitle>
                        <CardDescription>Manage status and commission rates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Level</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                            >
                                <option value="starter">Starter</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="elite">Elite</option>
                                <option value="partner">Partner</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Commission</Label>
                                <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="percent">% Percent</option>
                                    <option value="fixed">$ Fixed</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Commissions Panel */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            Commissions
                        </CardTitle>
                        <CardDescription>Cliquez sur "Payer" pour marquer une commission comme réglée.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingCommissions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Aucune commission enregistrée.</p>
                        ) : (
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Montant</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingCommissions.map((c: any) => (
                                            <TableRow key={c.id}>
                                                <TableCell className="text-sm">
                                                    <div>{c.description}</div>
                                                    <div className="text-xs text-muted-foreground">{new Date(c.date).toLocaleDateString('fr-CA')}</div>
                                                </TableCell>
                                                <TableCell className="font-mono font-bold text-luxury-gold">
                                                    {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(c.amount))}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={c.status === 'paid'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                                                    }>
                                                        {c.status === 'paid' ? <><CheckCircle className="w-3 h-3 inline mr-1" />Payé</> : '⏳ En attente'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {c.status === 'pending' ? (
                                                        <div className="flex justify-end items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs text-red-500 hover:bg-red-50"
                                                                onClick={() => handleDeleteExpense(c.id, c.project_id)}
                                                            >
                                                                <Trash2 className="w-3 h-3 mr-1" />
                                                                Annuler
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                                                                disabled={isPayingId === c.id}
                                                                onClick={() => handlePayCommission(c.id, c.amount)}
                                                            >
                                                                {isPayingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                                Payer
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">✓ Réglé</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
