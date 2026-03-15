import { Invoice } from '@/services/apiInvoices';

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
import { calculateCanadianTax, CanadianProvince, formatCurrency } from '@/utils/taxUtils';
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
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // Edit Link Handlers
    const openEditModal = (invoice: Invoice) => {
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
    const openPaymentModal = (invoice: Invoice) => {
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

    const openDetailsModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsDetailsModalOpen(true);
    };

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
                        <Card key={invoice.id} className="flex items-center justify-between p-4 bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer" onClick={() => openDetailsModal(invoice)}>
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
                                    {invoice.project?.financials?.tax_province ? (
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Gross</p>
                                            <p className="font-bold text-lg text-luxury-gold">
                                                {formatCurrency(invoice.amount + calculateCanadianTax(invoice.amount, invoice.project.financials.tax_province as CanadianProvince).total)}
                                            </p>
                                            <p className="text-[9px] text-muted-foreground">
                                                Net: {formatCurrency(invoice.amount)} + Taxes ({invoice.project.financials.tax_province})
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="font-bold text-lg">{formatCurrency(invoice.amount)}</p>
                                    )}
                                    
                                    {(invoice.amount_paid || 0) > 0 && invoice.status !== 'paid' && (
                                        <p className="text-xs text-green-600 font-medium">Paid: {formatCurrency(invoice.amount_paid)}</p>
                                    )}
                                    {invoice.status === 'paid' && (
                                        <p className="text-[10px] text-green-600/70 font-medium uppercase tracking-widest mt-1">
                                            Payé le: {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(invoice.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">Due {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</p>
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
                                    <Button variant="outline" size="sm" onClick={async () => {
                                        const settings = await apiSettings.get();
                                        generateInvoicePDF(invoice, settings);
                                    }}>
                                        Print PDF
                                    </Button>
                                    {/* Admin Actions: Edit Link & Mark Paid & Delete */}
                                    {(role === 'admin' || role === 'secretary') && (
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

            {/* Invoice Details Modal */}
            <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">Invoice Summary</DialogTitle>
                        <DialogDescription>
                            Detailed breakdown of invoice #{selectedInvoice?.id.slice(0, 8)}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedInvoice && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 border-b pb-4">
                                <div>
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Project</Label>
                                    <p className="font-serif text-lg">{selectedInvoice.project?.title}</p>
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Client</Label>
                                    <p className="font-medium">{selectedInvoice.project?.client?.full_name || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Financial Breakdown</Label>
                                <div className="space-y-1 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 font-mono text-sm">
                                    <div className="flex justify-between">
                                        <span>Amount (Net)</span>
                                        <span>{formatCurrency(selectedInvoice.amount)}</span>
                                    </div>
                                    {selectedInvoice.project?.financials?.tax_province && (
                                        <>
                                            <div className="flex justify-between text-muted-foreground text-xs mt-1">
                                                <span>Tax ({selectedInvoice.project.financials.tax_province})</span>
                                                <span>+ {formatCurrency(calculateCanadianTax(selectedInvoice.amount, selectedInvoice.project.financials.tax_province as CanadianProvince).total)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold border-t pt-2 mt-2 text-luxury-gold text-lg">
                                                <span>Total Gross</span>
                                                <span>{formatCurrency(selectedInvoice.amount + calculateCanadianTax(selectedInvoice.amount, selectedInvoice.project.financials.tax_province as CanadianProvince).total)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Status & Payment</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={selectedInvoice.status === 'paid' ? 'default' : 'secondary'}>
                                            {selectedInvoice.status.toUpperCase()}
                                        </Badge>
                                        <span className="text-sm font-medium">
                                            {formatCurrency(selectedInvoice.amount_paid || 0)} Paid
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Dates</Label>
                                    <p className="text-xs">Created: {new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
                                    <p className="text-xs">Due: {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>

                            {selectedInvoice.stripe_payment_link && (
                                <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-md">
                                    <Label className="text-[10px] uppercase text-green-600 font-bold mb-1 block">Payment Link</Label>
                                    <a href={selectedInvoice.stripe_payment_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                                        {selectedInvoice.stripe_payment_link}
                                    </a>
                                </div>
                            )}

                            {/* New: Project Content */}
                            {(selectedInvoice.project?.stage_details?.design_notes || 
                              (selectedInvoice.project?.stage_details?.sketch_files?.length || 0) > 0 ||
                              (selectedInvoice.project?.stage_details?.design_files?.length || 0) > 0) && (
                                <div className="space-y-4 pt-4 border-t">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Project Content & Designs</Label>
                                    
                                    {selectedInvoice.project.stage_details.design_notes && (
                                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded border border-black/5 text-sm italic text-muted-foreground whitespace-pre-wrap">
                                            "{selectedInvoice.project.stage_details.design_notes}"
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {[...(selectedInvoice.project.stage_details.sketch_files || []), ...(selectedInvoice.project.stage_details.design_files || [])].map((url, idx) => (
                                            <div key={idx} className="relative group">
                                                <img 
                                                    src={url} 
                                                    alt={`Design ${idx}`} 
                                                    className="w-24 h-24 object-cover rounded border border-black/10 shadow-sm transition-transform hover:scale-110 cursor-zoom-in"
                                                    onClick={() => window.open(url, '_blank')}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
                        <Button
                            variant="default"
                            className="bg-luxury-gold text-black hover:bg-gold-600"
                            onClick={async () => {
                                const settings = await apiSettings.get();
                                if (selectedInvoice) generateInvoicePDF(selectedInvoice, settings);
                            }}
                        >
                            Download PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
