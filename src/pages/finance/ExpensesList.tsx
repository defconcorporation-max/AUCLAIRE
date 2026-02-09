import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiExpenses, Expense } from '@/services/apiExpenses';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';

import { useAuth } from '@/context/AuthContext';

export default function ExpensesList() {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);

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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            setIsAddOpen(false);
            setNewExpense({
                date: new Date().toISOString().split('T')[0],
                category: 'commission',
                status: 'paid',
                amount: 0,
                description: '',
                recipient_id: undefined
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: apiExpenses.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            ...newExpense,
            created_by: profile?.id
        });
    };

    // Filter Logic
    const filteredExpenses = expenses?.filter(e =>
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.recipient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalAmount = filteredExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-luxury-gold">Expenses & Payouts</h1>
                    <p className="text-muted-foreground">Track operational costs and affiliate commissions.</p>
                </div>

                <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <SheetTrigger asChild>
                        <Button className="bg-luxury-gold text-black hover:bg-luxury-gold/90 gap-2">
                            <Plus className="w-4 h-4" /> Add Expense
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Record New Expense</SheetTitle>
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
                                <Label>Amount ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={newExpense.amount || ''}
                                    onChange={e => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={newExpense.category}
                                    onValueChange={(val: any) => setNewExpense({ ...newExpense, category: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="commission">Commission Payout</SelectItem>
                                        <SelectItem value="operational">Operational</SelectItem>
                                        <SelectItem value="material">Material Cost</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="salary">Salary</SelectItem>
                                        <SelectItem value="software">Software / Tools</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Recipient (Optional)</Label>
                                <Select
                                    value={newExpense.recipient_id || "none"}
                                    onValueChange={(val) => setNewExpense({ ...newExpense, recipient_id: val === "none" ? undefined : val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select who got paid..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- None / External --</SelectItem>
                                        {profiles?.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.full_name} ({p.role})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    value={newExpense.description || ''}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    placeholder="e.g. Ring Casting for Order #123"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={newExpense.status}
                                    onValueChange={(val: any) => setNewExpense({ ...newExpense, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button type="submit" className="w-full bg-luxury-gold text-black" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Saving...' : 'Save Expense'}
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Summary Card */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses (Filtered)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 items-center bg-white dark:bg-zinc-900 p-2 rounded-lg border">
                <Search className="w-4 h-4 text-muted-foreground ml-2" />
                <Input
                    placeholder="Search expenses, recipients..."
                    className="border-0 bg-transparent focus-visible:ring-0"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Expenses Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">Loading expenses...</TableCell>
                                </TableRow>
                            ) : filteredExpenses?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No expenses found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredExpenses?.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
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
                                                {expense.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            ${Number(expense.amount).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    if (confirm('Delete this expense?')) deleteMutation.mutate(expense.id);
                                                }}
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
        </div>
    );
}
