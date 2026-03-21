import { Invoice, PaymentEntry } from '@/services/apiInvoices';

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiInvoices } from '@/services/apiInvoices'

import { apiSettings } from '@/services/apiSettings'
import { generateInvoicePDF } from '@/services/pdfService'
import { Card } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Plus, FileText, Trash2, Pencil, CalendarDays, DollarSign, Search } from 'lucide-react'
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
import { useTranslation } from 'react-i18next'

export default function InvoicesList() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const { role } = useAuth();
    const dateLocale = i18n.language.startsWith('en') ? 'en-US' : 'fr-FR'

    const invoiceStatusBadge = (status: string) => {
        if (status === 'paid') return t('invoicesPage.badge_paid')
        if (status === 'partial') return t('invoicesPage.badge_partial')
        if (status === 'sent') return t('invoicesPage.badge_sent')
        if (status === 'draft') return t('invoicesPage.badge_draft')
        return status.toUpperCase()
    }
    const queryClient = useQueryClient();
    const { data: invoices, isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll
    })

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [paymentLink, setPaymentLink] = useState('');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

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
        // Auto-migrate: if amount_paid > 0 but no payment_history, create a virtual entry
        let migrated = invoice;
        const existingHistory = invoice.payment_history || [];
        const existingPaid = Number(invoice.amount_paid) || 0;
        if (existingHistory.length === 0 && existingPaid > 0) {
            const virtualEntry: PaymentEntry = {
                id: 'legacy-' + invoice.id.slice(0, 8),
                amount: existingPaid,
                date: invoice.paid_at || invoice.created_at,
                note: '',
            };
            migrated = { ...invoice, payment_history: [virtualEntry] };
        }
        setSelectedInvoice(migrated);
        resetNewPaymentForm();
        // Auto-open legacy entry in edit mode so user can set the date
        if (migrated.payment_history?.length === 1 && migrated.payment_history[0].id.startsWith('legacy-')) {
            const p = migrated.payment_history[0];
            setEditingPaymentId(p.id);
            setEditPayAmount(String(p.amount));
            setEditPayDate(new Date(p.date).toISOString().slice(0, 10));
            setEditPayNote('');
        } else {
            setEditingPaymentId(null);
        }
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
            const result = await apiInvoices.addPayment(selectedInvoice.id, {
                amount,
                date: new Date(newPayDate + 'T12:00:00').toISOString(),
                note: newPayNote || undefined,
            });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            if (result?.payment_history) {
                setSelectedInvoice(prev => prev ? { ...prev, ...result } as Invoice : null);
            } else {
                await refreshInvoice();
            }
            resetNewPaymentForm();
        } catch (err: unknown) {
            console.error('Add payment error:', err);
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
            const result = await apiInvoices.updatePayment(selectedInvoice.id, editingPaymentId, {
                amount,
                date: new Date(editPayDate + 'T12:00:00').toISOString(),
                note: editPayNote || undefined,
            });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            if (result?.payment_history) {
                setSelectedInvoice(prev => prev ? { ...prev, ...result } as Invoice : null);
            } else {
                await refreshInvoice();
            }
            setEditingPaymentId(null);
        } catch (err: unknown) {
            console.error('Edit payment error:', err);
        } finally { setSaving(false); }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!selectedInvoice) return;
        setSaving(true);
        try {
            const result = await apiInvoices.deletePayment(selectedInvoice.id, paymentId);
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            if (result?.payment_history) {
                setSelectedInvoice(prev => prev ? { ...prev, ...result } as Invoice : null);
            } else {
                await refreshInvoice();
            }
        } catch (err: unknown) {
            console.error('Delete payment error:', err);
        } finally { setSaving(false); }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const filteredInvoices = invoices?.filter(inv => {
        const matchSearch = !searchTerm || inv.project?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || inv.project?.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = !filterStatus || inv.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const payments: PaymentEntry[] = selectedInvoice?.payment_history || [];
    const remainingAmount = selectedInvoice
        ? selectedInvoice.amount - payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-luxury-gold">{t('invoicesPage.title')}</h2>
                    <p className="text-muted-foreground">{t('invoicesPage.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (!invoices?.length) return;
                            const headers = [
                                t('invoicesPage.csvTitle'),
                                t('invoicesPage.csvClient'),
                                t('invoicesPage.csvAmount'),
                                t('invoicesPage.csvPaid'),
                                t('invoicesPage.csvStatus'),
                                t('invoicesPage.csvCreated'),
                                t('invoicesPage.csvPaidDate'),
                                t('invoicesPage.csvDue'),
                            ];
                            const rows = invoices.map(inv => [
                                inv.project?.title || '',
                                inv.project?.client?.full_name || '',
                                inv.amount,
                                inv.amount_paid,
                                inv.status,
                                inv.created_at?.split('T')[0] || '',
                                inv.paid_at?.split('T')[0] || '',
                                inv.due_date || ''
                            ]);
                            const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `factures_auclaire_${new Date().toISOString().split('T')[0]}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                    >
                        <FileText className="w-4 h-4 mr-1" />
                        {t('invoicesPage.exportCsv')}
                    </Button>
                    <Button
                        className="bg-luxury-gold text-black hover:bg-luxury-gold-dark"
                        onClick={() => navigate('/dashboard/invoices/new')}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('invoicesPage.newInvoice')}
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t('invoicesPage.searchPlaceholder')} className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                    {[
                        { value: '', label: t('invoicesPage.filterAll') },
                        { value: 'draft', label: t('invoicesPage.filterDraft') },
                        { value: 'sent', label: t('invoicesPage.filterSent') },
                        { value: 'partial', label: t('invoicesPage.filterPartial') },
                        { value: 'paid', label: t('invoicesPage.filterPaid') },
                    ].map(tab => (
                        <button key={tab.value} onClick={() => setFilterStatus(tab.value)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterStatus === tab.value ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- Invoice List --- */}
            <div className="space-y-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-muted rounded w-10 h-10" />
                                <div className="space-y-2"><div className="h-4 w-40 bg-muted rounded" /><div className="h-3 w-32 bg-muted rounded" /></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-6 w-24 bg-muted rounded" />
                                <div className="h-8 w-20 bg-muted rounded" />
                            </div>
                        </Card>
                    ))
                ) : filteredInvoices?.length === 0 ? (
                    <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                        {t('invoicesPage.empty')}
                    </div>
                ) : (
                    filteredInvoices?.map(invoice => (
                        <Card key={invoice.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer" onClick={() => openDetailsModal(invoice)}>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-luxury-gold/20 rounded text-luxury-gold">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-medium font-serif">{invoice.project?.title || t('invoicesPage.unknownProject')}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {t('invoicesPage.clientLabel')} {invoice.project?.client?.full_name || t('invoicesPage.na')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                <div className="text-right min-w-[160px]">
                                    {invoice.project?.financials?.tax_province ? (
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{t('invoicesPage.totalTTC')}</p>
                                            <p className="font-bold text-lg text-luxury-gold">
                                                {formatCurrency(invoice.amount + calculateCanadianTax(invoice.amount, invoice.project.financials.tax_province as CanadianProvince).total)}
                                            </p>
                                            <p className="text-[9px] text-muted-foreground">
                                                {t('invoicesPage.netTaxes', {
                                                    net: formatCurrency(invoice.amount),
                                                    province: invoice.project.financials.tax_province,
                                                })}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="font-bold text-lg">{formatCurrency(invoice.amount)}</p>
                                    )}

                                    {/* Progress bar */}
                                    {(() => {
                                        const paid = Number(invoice.amount_paid) || 0;
                                        const total = Number(invoice.amount) || 1;
                                        const pct = Math.min(Math.round((paid / total) * 100), 100);
                                        return paid > 0 ? (
                                            <div className="mt-1.5 space-y-0.5">
                                                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-luxury-gold'}`} style={{ width: `${pct}%` }} />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {formatCurrency(paid)} / {formatCurrency(total)} ({pct}%)
                                                </p>
                                            </div>
                                        ) : null;
                                    })()}

                                    {invoice.status === 'paid' && (
                                        <p className="text-[10px] text-green-600/70 font-medium uppercase tracking-widest mt-1">
                                            {t('invoicesPage.paidOn', {
                                                date: (invoice.paid_at
                                                    ? new Date(invoice.paid_at)
                                                    : new Date(invoice.created_at)
                                                ).toLocaleDateString(dateLocale, invoice.paid_at
                                                    ? { day: 'numeric', month: 'short', year: 'numeric' }
                                                    : { day: 'numeric', month: 'short' }),
                                            })}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        {invoice.due_date
                                            ? `${t('invoicesPage.duePrefix')} ${new Date(invoice.due_date).toLocaleDateString(dateLocale)}`
                                            : ''}
                                    </p>
                                </div>
                                <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className={
                                    invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                        invoice.status === 'partial' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                                            invoice.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                }>
                                    {invoiceStatusBadge(invoice.status)}
                                </Badge>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            const settings = await apiSettings.get();
                                            await generateInvoicePDF(invoice, settings);
                                        } catch (err) {
                                            console.error('PDF generation failed:', err);
                                        }
                                    }}>
                                        {t('invoicesPage.printPdf')}
                                    </Button>
                                    {(role === 'admin' || role === 'secretary') && (
                                        <>
                                            {invoice.status !== 'paid' && (
                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditModal(invoice); }}>
                                                    {t('invoicesPage.editLink')}
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={async (e) => {
                                                e.stopPropagation();
                                                setInvoiceToDelete(invoice.id);
                                                setIsDeleteConfirmOpen(true);
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
                                            {t('invoicesPage.pay')}
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
                        <DialogTitle>{t('invoicesPage.modalEditTitle')}</DialogTitle>
                        <DialogDescription>{t('invoicesPage.modalEditDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('invoicesPage.stripeLink')}</Label>
                            <Input placeholder="https://buy.stripe.com/..." value={paymentLink} onChange={(e) => setPaymentLink(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleSaveLink}>{t('common.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== INVOICE DETAILS MODAL (with payment history) ===== */}
            <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">{t('invoicesPage.detailsTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('invoicesPage.detailsInvoiceId', { id: selectedInvoice?.id.slice(0, 8) })}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedInvoice && (
                        <div className="space-y-6">
                            {/* Project / Client */}
                            <div className="grid grid-cols-2 gap-4 border-b pb-4">
                                <div>
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">{t('invoicesPage.labelProject')}</Label>
                                    <p className="font-serif text-lg">{selectedInvoice.project?.title}</p>
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">{t('invoicesPage.labelClient')}</Label>
                                    <p className="font-medium">{selectedInvoice.project?.client?.full_name || t('invoicesPage.na')}</p>
                                </div>
                            </div>

                            {/* Financial Breakdown */}
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">{t('invoicesPage.financialDetails')}</Label>
                                <div className="space-y-1 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 font-mono text-sm">
                                    <div className="flex justify-between">
                                        <span>{t('invoicesPage.amountNet')}</span>
                                        <span>{formatCurrency(selectedInvoice.amount)}</span>
                                    </div>
                                    {selectedInvoice.project?.financials?.tax_province && (
                                        <>
                                            <div className="flex justify-between text-muted-foreground text-xs mt-1">
                                                <span>{t('invoicesPage.taxLine', { province: selectedInvoice.project.financials.tax_province })}</span>
                                                <span>+ {formatCurrency(calculateCanadianTax(selectedInvoice.amount, selectedInvoice.project.financials.tax_province as CanadianProvince).total)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold border-t pt-2 mt-2 text-luxury-gold text-lg">
                                                <span>{t('invoicesPage.totalTTC')}</span>
                                                <span>{formatCurrency(selectedInvoice.amount + calculateCanadianTax(selectedInvoice.amount, selectedInvoice.project.financials.tax_province as CanadianProvince).total)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Status & Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">{t('invoicesPage.labelStatus')}</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={selectedInvoice.status === 'paid' ? 'default' : 'secondary'}>
                                            {invoiceStatusBadge(selectedInvoice.status)}
                                        </Badge>
                                        <span className="text-sm font-medium">
                                            {formatCurrency(selectedInvoice.amount_paid || 0)} / {formatCurrency(selectedInvoice.amount)}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">{t('invoicesPage.labelDates')}</Label>
                                    <p className="text-xs">{t('invoicesPage.createdOn', { date: new Date(selectedInvoice.created_at).toLocaleDateString(dateLocale) })}</p>
                                    <p className="text-xs">{t('invoicesPage.dueOn', { date: selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString(dateLocale) : t('invoicesPage.na') })}</p>
                                </div>
                            </div>

                            {/* ====== PAYMENT HISTORY ====== */}
                            <div className="space-y-3 pt-2 border-t">
                                <Label className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> {t('invoicesPage.payments')}
                                </Label>

                                {payments.length === 0 && (Number(selectedInvoice.amount_paid) || 0) === 0 && (
                                    <p className="text-xs text-muted-foreground italic">{t('invoicesPage.noPayments')}</p>
                                )}

                                {/* Payment entries list */}
                                {payments.map((p, idx) => (
                                    <div key={p.id} className={`rounded-lg p-3 space-y-2 ${p.id.startsWith('legacy-') ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-zinc-50 dark:bg-zinc-900'}`}>
                                        {p.id.startsWith('legacy-') && editingPaymentId === p.id && (
                                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                                                {t('invoicesPage.legacyPaymentHint')}
                                            </p>
                                        )}
                                        {editingPaymentId === p.id ? (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <Label className="text-[9px] uppercase text-muted-foreground">{t('invoicesPage.amountUsd')}</Label>
                                                        <Input type="number" value={editPayAmount} onChange={(e) => setEditPayAmount(e.target.value)} className="h-8 text-sm" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[9px] uppercase text-muted-foreground">{t('invoicesPage.date')}</Label>
                                                        <Input type="date" value={editPayDate} onChange={(e) => setEditPayDate(e.target.value)} className="h-8 text-sm" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[9px] uppercase text-muted-foreground">{t('invoicesPage.note')}</Label>
                                                        <Input value={editPayNote} onChange={(e) => setEditPayNote(e.target.value)} placeholder={t('invoicesPage.notePlaceholder')} className="h-8 text-sm" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingPaymentId(null)} disabled={saving}>{t('common.cancel')}</Button>
                                                    <Button size="sm" onClick={handleSaveEditPayment} disabled={saving}>
                                                        {saving ? t('invoicesPage.saving') : t('common.save')}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
                                                    <div>
                                                        <p className="text-sm font-semibold">{formatCurrency(p.amount)}</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <CalendarDays className="w-3 h-3" />
                                                            {new Date(p.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
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

                                {/* Add new payment form — always visible unless fully paid */}
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2">
                                    <Label className="text-[10px] uppercase text-green-700 dark:text-green-400 font-bold">
                                        {t('invoicesPage.addPayment')}
                                    </Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <Label className="text-[9px] uppercase text-muted-foreground">{t('invoicesPage.amountUsd')}</Label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={newPayAmount}
                                                onChange={(e) => setNewPayAmount(e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {t('invoicesPage.invoiceTotal', { amount: formatCurrency(selectedInvoice.amount) })}
                                                {remainingAmount > 0 && <> · {t('invoicesPage.remaining', { amount: formatCurrency(remainingAmount) })}</>}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-[9px] uppercase text-muted-foreground">{t('invoicesPage.date')}</Label>
                                            <Input
                                                type="date"
                                                value={newPayDate}
                                                onChange={(e) => setNewPayDate(e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[9px] uppercase text-muted-foreground">{t('invoicesPage.note')}</Label>
                                            <Input
                                                value={newPayNote}
                                                onChange={(e) => setNewPayNote(e.target.value)}
                                                placeholder={t('invoicesPage.notePlaceholder')}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button size="sm" onClick={handleAddPayment} disabled={saving || !newPayAmount}>
                                            {saving ? t('invoicesPage.saving') : t('invoicesPage.savePayment')}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Link */}
                            {selectedInvoice.stripe_payment_link && (
                                <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-md">
                                    <Label className="text-[10px] uppercase text-green-600 font-bold mb-1 block">{t('invoicesPage.paymentLinkSection')}</Label>
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
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">{t('invoicesPage.projectContent')}</Label>
                                    
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
                                                    alt={t('invoicesPage.designAlt', { n: idx + 1 })} 
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
                        <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>{t('invoicesPage.close')}</Button>
                        <Button
                            variant="default"
                            className="bg-luxury-gold text-black hover:bg-gold-600"
                            onClick={async () => {
                                try {
                                    const settings = await apiSettings.get();
                                    if (selectedInvoice) await generateInvoicePDF(selectedInvoice, settings);
                                } catch (err) {
                                    console.error('PDF generation failed:', err);
                                }
                            }}
                        >
                            Télécharger PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{t('invoicesPage.deleteTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('invoicesPage.deleteDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>{t('common.cancel')}</Button>
                        <Button variant="destructive" onClick={async () => {
                            if (invoiceToDelete) {
                                await apiInvoices.delete(invoiceToDelete);
                                queryClient.invalidateQueries({ queryKey: ['invoices'] });
                            }
                            setIsDeleteConfirmOpen(false);
                            setInvoiceToDelete(null);
                        }}>{t('common.delete')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
