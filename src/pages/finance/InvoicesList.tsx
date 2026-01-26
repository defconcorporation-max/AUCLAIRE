
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiInvoices } from '@/services/apiInvoices'

import { apiSettings } from '@/services/apiSettings'
import { generateInvoicePDF } from '@/services/pdfService'
import { Card } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Plus, FileText, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from '@/context/AuthContext'

export default function InvoicesList() {
    const navigate = useNavigate()
    const { role } = useAuth();
    const queryClient = useQueryClient();
    const { data: invoices, isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll
    })

    // State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<any>(null);
    const [paymentLink, setPaymentLink] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');

    // Edit Link Handlers
    const openEditModal = (invoice: any) => {
        setEditingInvoice(invoice);
        setPaymentLink(invoice.stripe_payment_link || '');
        setIsEditModalOpen(true);
    };

    const handleSaveLink = async () => {
        if (!editingInvoice) return;
        await apiInvoices.update(editingInvoice.id, { stripe_payment_link: paymentLink });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        setIsEditModalOpen(false);
    };

    // Payment Handlers
    const openPaymentModal = (invoice: any) => {
        setEditingInvoice(invoice);
        setPaymentAmount('');
        setIsPaymentModalOpen(true);
    };

    const handleRecordPayment = async () => {
        if (!editingInvoice || !paymentAmount) return;
        const addAmount = parseFloat(paymentAmount);
        if (isNaN(addAmount)) return;

        const currentPaid = editingInvoice.amount_paid || 0;
        const newTotalPaid = currentPaid + addAmount;

        await apiInvoices.update(editingInvoice.id, {
            amount_paid: newTotalPaid,
            // Status auto-updated in API
        });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        setIsPaymentModalOpen(false);
    };



    // Manual Sync Removed - Now handled automatically in apiInvoices.getAll()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-luxury-gold">Invoices</h2>
                    <p className="text-muted-foreground">Manage payments and billing.</p>
                </div>
                <Button
                    className="bg-luxury-gold text-black hover:bg-luxury-gold-dark"
                    onClick={() => navigate('/dashboard/invoices/new')}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                </Button>

            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div>Loading invoices...</div>
                ) : invoices?.length === 0 ? (
                    <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                        No invoices found.
                    </div>
                ) : (
                    invoices?.map(invoice => (
                        <Card key={invoice.id} className="flex items-center justify-between p-4 bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-luxury-gold/20 rounded text-luxury-gold">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-medium font-serif">{invoice.project?.title || 'Unknown Project'}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Client: {invoice.project?.client?.full_name || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="font-bold text-lg">${invoice.amount.toLocaleString()}</p>
                                    {(invoice.amount_paid || 0) > 0 && invoice.status !== 'paid' && (
                                        <p className="text-xs text-green-600 font-medium">Paid: ${invoice.amount_paid?.toLocaleString()}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">Due {invoice.due_date || 'N/A'}</p>
                                </div>
                                <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className={
                                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                        invoice.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                                            invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                }>
                                    {invoice.status.toUpperCase()}
                                </Badge>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const settings = apiSettings.get();
                                        generateInvoicePDF(invoice, settings);
                                    }}>
                                        Print PDF
                                    </Button>
                                    {/* Admin Actions: Edit Link & Mark Paid & Delete */}
                                    {role === 'admin' && (
                                        <>
                                            {invoice.status !== 'paid' && (
                                                <>
                                                    <Button variant="ghost" size="sm" onClick={() => openEditModal(invoice)}>
                                                        Edit Link
                                                    </Button>
                                                    {!invoice.stripe_payment_link && (
                                                        <Button size="sm" onClick={() => openPaymentModal(invoice)}>
                                                            Record Payment
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={async () => {
                                                if (confirm("Delete this invoice?")) {
                                                    await apiInvoices.delete(invoice.id);
                                                    queryClient.invalidateQueries({ queryKey: ['invoices'] });
                                                }
                                            }}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}

                                    {/* Pay Now Action (Eveyone sees this if link exists) */}
                                    {invoice.status !== 'paid' && invoice.stripe_payment_link && (
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => window.open(invoice.stripe_payment_link, '_blank')}
                                        >
                                            Pay Now
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Payment Link</DialogTitle>
                        <DialogDescription>
                            Add or update the Stripe payment link for this invoice.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Stripe Link</Label>
                            <Input
                                placeholder="https://buy.stripe.com/..."
                                value={paymentLink}
                                onChange={(e) => setPaymentLink(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveLink}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Enter the amount received.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Amount Received ($)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Total Due: ${editingInvoice?.amount?.toLocaleString()} <br />
                                Remaining: ${(editingInvoice?.amount - (editingInvoice?.amount_paid || 0))?.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleRecordPayment}>Record Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
