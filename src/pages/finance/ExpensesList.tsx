import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiExpenses, Expense } from '@/services/apiExpenses';
import { apiActivities } from '@/services/apiActivities';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Search, Download, ArrowUpDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from '@/utils/taxUtils';

import { useAuth } from '@/context/AuthContext';

export default function ExpensesList() {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState('');
    const [sortField, setSortField] = useState<'date' | 'amount' | 'category'>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // Form State
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({
        date: new Date().toISOString().split('T')[0],
        category: 'commission',
        status: 'paid',
        amount: 0
    });

    // Fetch Expenses
    const { data: expenses, isLoading } = useQuery({
        queryKey: ['expenses'],
        queryFn: apiExpenses.getAll
    });

    // Fetch Profiles for Recipients
    const { data: profiles } = useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('id, full_name, email, role');
            return data || [];
        }
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: apiExpenses.create,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            apiActivities.log({
                user_id: profile?.id || 'admin',
                user_name: profile?.full_name || 'Admin',
                action: 'expense',
                details: `Recorded expense: $${variables.amount} — ${variables.description || variables.category}`,
            });
            setIsAddOpen(false);
            setNewExpense({
                date: new Date().toISOString().split('T')[0],
                category: 'commission',
                status: 'paid',
                amount: 0,
                description: '',
                recipient_id: undefined
            });
            toast({ title: "Dépense enregistrée", description: "La dépense a été ajoutée avec succès." });
        },
        onError: (error: unknown) => {
            console.error("Failed to create expense:", error);
            const desc = error instanceof Error
                ? error.message
                : (typeof error === 'object' && error !== null && 'error_description' in error
                    ? String((error as { error_description?: string }).error_description)
                    : "Erreur inconnue");
            toast({ title: "Erreur", description: desc, variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: apiExpenses.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            apiActivities.log({
                user_id: profile?.id || 'admin',
                user_name: profile?.full_name || 'Admin',
                action: 'delete',
                details: `Deleted an expense entry`,
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (profile?.id?.toString().startsWith('demo-')) {
            toast({ title: "Mode Démo", description: "Dépense simulée avec succès." });
            setIsAddOpen(false);
            const demoExpense = {
                ...newExpense,
                id: `temp-${Date.now()}`,
                created_at: new Date().toISOString(),
                recipient: { full_name: 'Demo Recipient', email: 'demo@example.com' },
                project: null
            };
            queryClient.setQueryData(['expenses'], (old: unknown) => [demoExpense, ...((old as Expense[]) || [])]);

            setNewExpense({
                date: new Date().toISOString().split('T')[0],
                category: 'commission',
                status: 'paid',
                amount: 0,
                description: '',
                recipient_id: undefined
            });
            return;
        }

        createMutation.mutate({
            ...newExpense,
            created_by: profile?.id
        });
    };

    const handleSort = (field: 'date' | 'amount' | 'category') => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    // Filter Logic
    const filteredExpenses = expenses
        ?.filter(e =>
            (e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.recipient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterCategory === '' || e.category === filterCategory)
        )
        ?.sort((a, b) => {
            const dir = sortDir === 'asc' ? 1 : -1;
            if (sortField === 'date') {
                return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
            }
            if (sortField === 'amount') {
                return dir * (Number(a.amount) - Number(b.amount));
            }
            return dir * a.category.localeCompare(b.category);
        });

    const totalPages = Math.ceil((filteredExpenses?.length || 0) / ITEMS_PER_PAGE);
    const paginatedExpenses = filteredExpenses?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const totalAmount = filteredExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-luxury-gold">Dépenses & Versements</h1>
                    <p className="text-muted-foreground">Suivi des coûts opérationnels et commissions.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (!expenses?.length) return;
                            const headers = ['Date', 'Catégorie', 'Description', 'Montant', 'Statut', 'Destinataire', 'Projet'];
                            const rows = expenses.map(e => [
                                e.date?.split('T')[0] || '',
                                e.category,
                                e.description,
                                e.amount,
                                e.status,
                                e.recipient?.full_name || '',
                                e.project?.title || ''
                            ]);
                            const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `depenses_auclaire_${new Date().toISOString().split('T')[0]}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                    >
                        <Download className="w-4 h-4 mr-1" />
                        Export CSV
                    </Button>

                    <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <SheetTrigger asChild>
                        <Button className="bg-luxury-gold text-black hover:bg-luxury-gold/90 gap-2">
                            <Plus className="w-4 h-4" /> Ajouter une dépense
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Nouvelle dépense</SheetTitle>
                        </SheetHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    required
                                    value={newExpense.date ? new Date(newExpense.date).toISOString().split('T')[0] : ''}
                                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Montant ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={newExpense.amount || ''}
                                    onChange={e => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Catégorie</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as Expense['category'] })}
                                >
                                    <option value="commission">Commission</option>
                                    <option value="operational">Opérationnel</option>
                                    <option value="material">Matériaux</option>
                                    <option value="marketing">Marketing</option>
                                    <option value="salary">Salaire</option>
                                    <option value="software">Logiciel / Outils</option>
                                    <option value="other">Autre</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Destinataire (Optionnel)</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newExpense.recipient_id || "none"}
                                    onChange={(e) => setNewExpense({ ...newExpense, recipient_id: e.target.value === "none" ? undefined : e.target.value })}
                                >
                                    <option value="none">-- Aucun / Externe --</option>
                                    {profiles?.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.full_name} ({p.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    value={newExpense.description || ''}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    placeholder="ex. Coulée bague pour commande #123"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Statut</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newExpense.status}
                                    onChange={(e) => setNewExpense({ ...newExpense, status: e.target.value as Expense['status'] })}
                                >
                                    <option value="paid">Payé</option>
                                    <option value="pending">En attente</option>
                                </select>
                            </div>

                            <Button type="submit" className="w-full bg-luxury-gold text-black" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>
                </div>
            </div>

            {/* Summary Card */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total (Filtré)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 items-center bg-white dark:bg-zinc-900 p-2 rounded-lg border">
                <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={filterCategory}
                    onChange={e => {
                        setFilterCategory(e.target.value);
                        setCurrentPage(1);
                    }}
                >
                    <option value="">Toutes</option>
                    <option value="commission">Commission</option>
                    <option value="operational">Opérationnel</option>
                    <option value="material">Matériaux</option>
                    <option value="marketing">Marketing</option>
                    <option value="salary">Salaire</option>
                    <option value="software">Logiciel / Outils</option>
                    <option value="other">Autre</option>
                </select>
                <Search className="w-4 h-4 text-muted-foreground ml-2" />
                <Input
                    placeholder="Rechercher dépenses, destinataires..."
                    className="border-0 bg-transparent focus-visible:ring-0"
                    value={searchTerm}
                    onChange={e => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {/* Expenses Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('date')}>
                                    <span className="inline-flex items-center gap-1">
                                        Date
                                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'date' ? 'text-luxury-gold' : 'text-muted-foreground/50'}`} />
                                    </span>
                                </TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Destinataire</TableHead>
                                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('category')}>
                                    <span className="inline-flex items-center gap-1">
                                        Catégorie
                                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'category' ? 'text-luxury-gold' : 'text-muted-foreground/50'}`} />
                                    </span>
                                </TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('amount')}>
                                    <span className="inline-flex items-center gap-1 justify-end">
                                        Montant
                                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'amount' ? 'text-luxury-gold' : 'text-muted-foreground/50'}`} />
                                    </span>
                                </TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">Chargement...</TableCell>
                                </TableRow>
                            ) : filteredExpenses?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune dépense trouvée.</TableCell>
                                </TableRow>
                            ) : (
                                paginatedExpenses?.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{new Date(expense.date).toLocaleDateString('fr-CA')}</TableCell>
                                        <TableCell className="font-medium">{expense.description || '-'}</TableCell>
                                        <TableCell>
                                            {expense.recipient ? (
                                                <div className="flex flex-col">
                                                    <span>{expense.recipient.full_name}</span>
                                                    <span className="text-xs text-muted-foreground">{expense.recipient.email}</span>
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">{expense.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={expense.status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}>
                                                {expense.status === 'paid' ? 'Payé' : 'En attente'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(Number(expense.amount))}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setDeleteTarget(expense.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                        Page {currentPage} sur {totalPages} ({filteredExpenses?.length} résultats)
                    </p>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                            Précédent
                        </Button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const page = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                            if (page < 1 || page > totalPages) return null;
                            return (
                                <Button key={page} variant={page === currentPage ? 'default' : 'outline'} size="sm" className={page === currentPage ? 'bg-luxury-gold text-black' : ''} onClick={() => setCurrentPage(page)}>
                                    {page}
                                </Button>
                            );
                        })}
                        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                            Suivant
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Confirmer la suppression</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
                        <Button variant="destructive" onClick={() => { deleteMutation.mutate(deleteTarget!); setDeleteTarget(null); }}>Supprimer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
