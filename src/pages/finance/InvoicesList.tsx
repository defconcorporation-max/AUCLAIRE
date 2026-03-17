import { Invoice, PaymentEntry } from '@/services/apiInvoices';

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiInvoices } from '@/services/apiInvoices'

import { apiSettings } from '@/services/apiSettings'
import { generateInvoicePDF } from '@/services/pdfService'
import { Card } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Plus, FileText, Trash2, Pencil, CalendarDays, DollarSign } from 'lucide-react'
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

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<any>(null);
    const [paymentLink, setPaymentLink] = useState('');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // New payment form state
    const [newPayAmount, setNewPayAmount] = useState('');
    const [newPayDate, setNewPayDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [newPayNote, setNewPayNote] = useState('');
    const [saving, setSaving] = useState(false);

    // Inline editing state for existing payments
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
    const [editPayAmount, setEditPayAmount] = useState('');
    const [editPayDate, setEditPayDate] = useState('');
    const [editPayNote, setEditPayNote] = useState('');

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

    const openDetailsModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        resetNewPaymentForm();
        setEditingPaymentId(null);
        setIsDetailsModalOpen(true);
    };

    const resetNewPaymentForm = () => {
        setNewPayAmount('');
        setNewPayDate(new Date().toISOString().slice(0, 10));
        setNewPayNote('');
    };

    const refreshInvoice = async () => {
        const updated = await queryClient.fetchQuery({ queryKey: ['invoices'], queryFn: apiInvoices.getAll });
        if (selectedInvoice) {
            const found = updated?.find((inv: Invoice) => inv.id === selectedInvoice.id);
            if (found) setSelectedInvoice(found);
        }
    };

    // --- Payment CRUD ---
    const handleAddPayment = async () => {
        if (!selectedInvoice || !newPayAmount) return;
        const amount = parseFloat(newPayAmount);
        if (isNaN(amount) || amount <= 0) return;
        setSaving(true);
        try {
            await apiInvoices.addPayment(selectedInvoice.id, {
                amount,
                date: new Date(newPayDate + 'T12:00:00').toISOString(),
                note: newPayNote || undefined,
            });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            await refreshInvoice();
            resetNewPaymentForm();
        } finally { setSaving(false); }
    };

    const startEditPayment = (p: PaymentEntry) => {
        setEditingPaymentId(p.id);
        setEditPayAmount(String(p.amount));
        setEditPayDate(new Date(p.date).toISOString().slice(0, 10));
        setEditPayNote(p.note || '');
    };

    const handleSaveEditPayment = async () => {
        if (!selectedInvoice || !editingPaymentId) return;
        const amount = parseFloat(editPayAmount);
        if (isNaN(amount) || amount <= 0) return;
        setSaving(true);
        try {
            await apiInvoices.updatePayment(selectedInvoice.id, editingPaymentId, {
                amount,
                date: new Date(editPayDate + 'T12:00:00').toISOString(),
                note: editPayNote || undefined,
            });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            await refreshInvoice();
            setEditingPaymentId(null);
        } finally { setSaving(false); }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!selectedInvoice) return;
        if (!confirm('Supprimer ce paiement ?')) return;
        setSaving(true);
        try {
            await apiInvoices.deletePayment(selectedInvoice.id, paymentId);
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            await refreshInvoice();
        } finally { setSaving(false); }
    };

    const payments: PaymentEntry[] = selectedInvoice?.payment_history || [];
    const remainingAmount = selectedInvoice
        ? selectedInvoice.amount - payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
        : 0;

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

            {/* --- Invoice List --- */}
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
                                    <Button variant="outline" size="sm" onClick={async (e) => {
                                        e.stopPropagation();
                                        const settings = await apiSettings.get();
                                        generateInvoicePDF(invoice, settings);
                                    }}>
                                        Print PDF
                                    </Button>
                                    {(role === 'admin' || role === 'secretary') && (
                                        <>
                                            {invoice.status !== 'paid' && (
                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditModal(invoice); }}>
                                                    Edit Link
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm("Delete this invoice?")) {
                                                    await apiInvoices.delete(invoice.id);
                                                    queryClient.invalidateQueries({ queryKey: ['invoices'] });
                                                }
                                            }}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                    {invoice.status !== 'paid' && invoice.stripe_payment_link && (
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={(e) => { e.stopPropagation(); window.open(invoice.stripe_payment_link, '_blank'); }}
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

            {/* --- Edit Link Modal --- */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Payment Link</DialogTitle>
                        <DialogDescription>Add or update the Stripe payment link for this invoice.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Stripe Link</Label>
                            <Input placeholder="https://buy.stripe.com/..." value={paymentLink} onChange={(e) => setPaymentLink(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveLink}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== INVOICE DETAILS MODAL (with payment history) ===== */}
            <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">Invoice Details</DialogTitle>
                        <DialogDescription>
                            Invoice #{selectedInvoice?.id.slice(0, 8)}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedInvoice && (
                        <div className="space-y-6">
                            {/* Project / Client */}
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

                            {/* Financial Breakdown */}
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

                            {/* Status & Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Status</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={selectedInvoice.status === 'paid' ? 'default' : 'secondary'}>
                                            {selectedInvoice.status.toUpperCase()}
                                        </Badge>
                                        <span className="text-sm font-medium">
                                            {formatCurrency(selectedInvoice.amount_paid || 0)} / {formatCurrency(selectedInvoice.amount)}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Dates</Label>
                                    <p className="text-xs">Created: {new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
                                    <p className="text-xs">Due: {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>

                            {/* ====== PAYMENT HISTORY ====== */}
                            <div className="space-y-3 pt-2 border-t">
                                <Label className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> Historique des paiements
                                </Label>

                                {payments.length === 0 && (Number(selectedInvoice.amount_paid) || 0) === 0 && (
                                    <p className="text-xs text-muted-foreground italic">Aucun paiement enregistré.</p>
                                )}

                                {/* Legacy: show single amount_paid if no payment_history yet */}
                                {payments.length === 0 && (Number(selectedInvoice.amount_paid) || 0) > 0 && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            Paiement existant de <strong>{formatCurrency(selectedInvoice.amount_paid)}</strong> sans historique détaillé.
                                            Ajoutez un nouveau paiement ci-dessous pour migrer vers le suivi détaillé.
                                        </p>
                                    </div>
                                )}

                                {/* Payment entries list */}
                                {payments.map((p, idx) => (
                                    <div key={p.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 space-y-2">
                                        {editingPaymentId === p.id ? (
                                            /* Edit mode */
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <Label className="text-[9px] uppercase text-muted-foreground">Montant ($)</Label>
                                                        <Input type="number" value={editPayAmount} onChange={(e) => setEditPayAmount(e.target.value)} className="h-8 text-sm" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[9px] uppercase text-muted-foreground">Date</Label>
                                                        <Input type="date" value={editPayDate} onChange={(e) => setEditPayDate(e.target.value)} className="h-8 text-sm" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[9px] uppercase text-muted-foreground">Note</Label>
                                                        <Input value={editPayNote} onChange={(e) => setEditPayNote(e.target.value)} placeholder="Dépôt, Solde..." className="h-8 text-sm" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingPaymentId(null)} disabled={saving}>Annuler</Button>
                                                    <Button size="sm" onClick={handleSaveEditPayment} disabled={saving}>
                                                        {saving ? 'Enregistrement…' : 'Sauvegarder'}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Read mode */
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
                                                    <div>
                                                        <p className="text-sm font-semibold">{formatCurrency(p.amount)}</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <CalendarDays className="w-3 h-3" />
                                                            {new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                            {p.note && <span className="ml-1 text-luxury-gold">— {p.note}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditPayment(p)}>
                                                        <Pencil className="w-3 h-3" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDeletePayment(p.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Add new payment form */}
                                {selectedInvoice.status !== 'paid' && (
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2">
                                        <Label className="text-[10px] uppercase text-green-700 dark:text-green-400 font-bold">
                                            + Ajouter un paiement
                                        </Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <Label className="text-[9px] uppercase text-muted-foreground">Montant ($)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={newPayAmount}
                                                    onChange={(e) => setNewPayAmount(e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                                {remainingAmount > 0 && (
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">Restant: {formatCurrency(remainingAmount)}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label className="text-[9px] uppercase text-muted-foreground">Date</Label>
                                                <Input
                                                    type="date"
                                                    value={newPayDate}
                                                    onChange={(e) => setNewPayDate(e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[9px] uppercase text-muted-foreground">Note</Label>
                                                <Input
                                                    value={newPayNote}
                                                    onChange={(e) => setNewPayNote(e.target.value)}
                                                    placeholder="Dépôt, Solde..."
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button size="sm" onClick={handleAddPayment} disabled={saving || !newPayAmount}>
                                                {saving ? 'Enregistrement…' : 'Enregistrer le paiement'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Paid invoice: allow editing payments but not adding new ones */}
                                {selectedInvoice.status === 'paid' && payments.length > 0 && (
                                    <p className="text-[10px] text-green-600 italic">Facture entièrement payée. Cliquez sur le crayon pour modifier une date ou un montant.</p>
                                )}
                            </div>

                            {/* Payment Link */}
                            {selectedInvoice.stripe_payment_link && (
                                <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-md">
                                    <Label className="text-[10px] uppercase text-green-600 font-bold mb-1 block">Payment Link</Label>
                                    <a href={selectedInvoice.stripe_payment_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                                        {selectedInvoice.stripe_payment_link}
                                    </a>
                                </div>
                            )}

                            {/* Project Content */}
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
