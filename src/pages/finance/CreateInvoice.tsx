
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiInvoices } from '@/services/apiInvoices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, DollarSign, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiProjects } from '@/services/apiProjects';

export default function CreateInvoice() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [projectId, setProjectId] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentLink, setPaymentLink] = useState('');
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await apiInvoices.create({
            project_id: projectId,
            amount: parseFloat(amount),
            stripe_payment_link: paymentLink,
            due_date: dueDate
        });
        setLoading(false);
        navigate(-1);
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-luxury-gold">New Invoice</h1>
                    <p className="text-sm text-muted-foreground">Generate billing for a project</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                    <CardDescription>Select a project and enter amount.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Project</label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                required
                            >
                                <option value="">Select Project...</option>
                                {projects?.map(p => (
                                    <option key={p.id} value={p.id}>{p.title} - {p.client?.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Amount ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Payment Link (Stripe) <span className="text-muted-foreground font-normal">(Optional)</span></label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    type="url"
                                    placeholder="https://buy.stripe.com/..."
                                    value={paymentLink}
                                    onChange={(e) => setPaymentLink(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Due Date</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    type="date"
                                    required
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-luxury-gold text-black hover:bg-luxury-gold-dark" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Invoice'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
