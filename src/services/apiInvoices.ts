import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Project } from './apiProjects';
import { apiActivities } from './apiActivities';

export interface PaymentEntry {
    id: string;
    amount: number;
    date: string;   // ISO string
    note?: string;   // e.g. "Dépôt", "Solde"
}

export interface Invoice {
    id: string;
    project_id: string;
    amount: number;
    amount_paid: number;
    status: 'draft' | 'sent' | 'partial' | 'paid' | 'void';
    stripe_payment_link?: string;
    due_date?: string;
    paid_at?: string;
    payment_history?: PaymentEntry[];
    created_at: string;
    project?: Project; // joined
}

function deriveStatusAndPaidAt(totalAmount: number, payments: PaymentEntry[]): { status: Invoice['status']; amount_paid: number; paid_at: string | undefined } {
    const amount_paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    if (amount_paid >= totalAmount) {
        const latestDate = payments.length > 0
            ? payments.reduce((latest, p) => (p.date > latest ? p.date : latest), payments[0].date)
            : new Date().toISOString();
        return { status: 'paid', amount_paid, paid_at: latestDate };
    }
    if (amount_paid > 0) {
        const latestDate = payments.reduce((latest, p) => (p.date > latest ? p.date : latest), payments[0].date);
        return { status: 'partial', amount_paid, paid_at: latestDate };
    }
    return { status: 'sent', amount_paid: 0, paid_at: undefined };
}

export const apiInvoices = {
    async getAll() {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, project:projects(title, budget, financials, stage_details, client:clients(full_name))')
            .order('created_at', { ascending: false });

        if (error) {
            toast({ title: 'Error fetching invoices', description: error.message, variant: 'destructive' });
            throw error;
        }
        return (data || []).map(inv => ({
            ...inv,
            payment_history: Array.isArray(inv.payment_history) ? inv.payment_history : [],
        })) as Invoice[];
    },

    async create(invoice: Partial<Invoice>) {
        const { data, error } = await supabase.from('invoices').insert(invoice).select().single();

        if (error) {
            console.error("Supabase Create Invoice Error:", error);
            throw error;
        }

        if (data?.amount_paid && data.amount_paid > 0) {
            apiActivities.log({
                project_id: data.project_id,
                user_id: 'system',
                user_name: 'Système',
                action: 'financial',
                details: `Paiement enregistré: +${data.amount_paid}$ (Initial, Inv: ${data.id.substring(0,8)})`
            }).catch(console.error);
        }

        if (data?.project_id) {
            await apiInvoices.syncProjectPaidAmount(data.project_id);
        }

        return data;
    },

    /**
     * Add a payment entry to an invoice's payment_history and recalculate totals.
     */
    async addPayment(invoiceId: string, entry: Omit<PaymentEntry, 'id'>) {
        const { data: current } = await supabase.from('invoices').select('amount, amount_paid, project_id, payment_history').eq('id', invoiceId).single();
        if (!current) throw new Error('Invoice not found');

        const history: PaymentEntry[] = Array.isArray(current.payment_history) ? [...current.payment_history] : [];

        // Migrate: if history is empty but amount_paid > 0, create a legacy entry
        if (history.length === 0 && (Number(current.amount_paid) || 0) > 0) {
            history.push({
                id: crypto.randomUUID(),
                amount: Number(current.amount_paid),
                date: new Date().toISOString(),
                note: 'Paiement précédent',
            });
        }

        const newEntry: PaymentEntry = { ...entry, id: crypto.randomUUID() };
        history.push(newEntry);

        const derived = deriveStatusAndPaidAt(current.amount, history);

        const { data, error } = await supabase.from('invoices').update({
            payment_history: history,
            amount_paid: derived.amount_paid,
            status: derived.status,
            paid_at: derived.paid_at,
        }).eq('id', invoiceId).select().single();

        if (error) { toast({ title: 'Error adding payment', description: error.message, variant: 'destructive' }); throw error; }

        apiActivities.log({
            project_id: current.project_id,
            user_id: 'system',
            user_name: 'Système',
            action: 'financial',
            details: `Paiement enregistré: +${newEntry.amount}$ (Total: ${derived.amount_paid}$, Inv: ${invoiceId.substring(0,8)})`
        }).catch(console.error);

        if (data?.project_id) await apiInvoices.syncProjectPaidAmount(data.project_id);
        return data;
    },

    /**
     * Update a specific payment entry (amount, date, note).
     */
    async updatePayment(invoiceId: string, paymentId: string, updates: Partial<Omit<PaymentEntry, 'id'>>) {
        const { data: current } = await supabase.from('invoices').select('amount, payment_history, project_id').eq('id', invoiceId).single();
        if (!current) throw new Error('Invoice not found');

        const history: PaymentEntry[] = Array.isArray(current.payment_history) ? [...current.payment_history] : [];
        const idx = history.findIndex(p => p.id === paymentId);
        if (idx === -1) throw new Error('Payment entry not found');

        history[idx] = { ...history[idx], ...updates };
        const derived = deriveStatusAndPaidAt(current.amount, history);

        const { data, error } = await supabase.from('invoices').update({
            payment_history: history,
            amount_paid: derived.amount_paid,
            status: derived.status,
            paid_at: derived.paid_at,
        }).eq('id', invoiceId).select().single();

        if (error) { toast({ title: 'Error updating payment', description: error.message, variant: 'destructive' }); throw error; }
        if (data?.project_id) await apiInvoices.syncProjectPaidAmount(data.project_id);
        return data;
    },

    /**
     * Delete a payment entry from payment_history.
     */
    async deletePayment(invoiceId: string, paymentId: string) {
        const { data: current } = await supabase.from('invoices').select('amount, payment_history, project_id').eq('id', invoiceId).single();
        if (!current) throw new Error('Invoice not found');

        const history: PaymentEntry[] = (Array.isArray(current.payment_history) ? current.payment_history : []).filter((p: PaymentEntry) => p.id !== paymentId);
        const derived = deriveStatusAndPaidAt(current.amount, history);

        const { data, error } = await supabase.from('invoices').update({
            payment_history: history,
            amount_paid: derived.amount_paid,
            status: derived.status,
            paid_at: derived.paid_at,
        }).eq('id', invoiceId).select().single();

        if (error) { toast({ title: 'Error deleting payment', description: error.message, variant: 'destructive' }); throw error; }
        if (data?.project_id) await apiInvoices.syncProjectPaidAmount(data.project_id);
        return data;
    },

    async update(id: string, updates: Partial<Invoice>) {
        if (updates.amount_paid !== undefined) {
            const { data: current } = await supabase.from('invoices').select('amount, amount_paid, project_id').eq('id', id).single();
            if (current) {
                const total = updates.amount !== undefined ? updates.amount : current.amount;
                const paid = updates.amount_paid;
                const userProvidedPaidAt = updates.paid_at;

                if (paid >= total) {
                    updates.status = 'paid';
                    updates.paid_at = userProvidedPaidAt || new Date().toISOString();
                } else if (paid > 0) {
                    updates.status = 'partial';
                    updates.paid_at = userProvidedPaidAt ?? undefined;
                } else {
                    updates.status = 'sent';
                    updates.paid_at = undefined;
                }

                const delta = paid - (current.amount_paid || 0);
                if (delta !== 0) {
                    apiActivities.log({
                        project_id: current.project_id,
                        user_id: 'system',
                        user_name: 'Système',
                        action: 'financial',
                        details: `Paiement enregistré: ${delta > 0 ? '+' : ''}${delta}$ (Total: ${paid}$, Inv: ${id.substring(0,8)})`
                    }).catch(console.error);
                }
            }
        }

        const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single();

        if (error) {
            toast({ title: 'Error updating invoice', description: error.message, variant: 'destructive' });
            throw error;
        }

        if (data?.project_id && updates.amount_paid !== undefined) {
            await apiInvoices.syncProjectPaidAmount(data.project_id);
        }

        return data;
    },

    async delete(id: string) {
        const { data: invoice } = await supabase.from('invoices').select('project_id').eq('id', id).single();
        const { error } = await supabase.from('invoices').delete().eq('id', id);

        if (error) {
            toast({ title: 'Error deleting invoice', description: error.message, variant: 'destructive' });
            throw error;
        }

        if (invoice?.project_id) {
            await apiInvoices.syncProjectPaidAmount(invoice.project_id);
        }
    },

    async syncProjectPaidAmount(projectId: string) {
        if (!projectId) return;

        const { data: invoices } = await supabase
            .from('invoices')
            .select('amount_paid')
            .eq('project_id', projectId)
            .neq('status', 'void');

        const totalPaid = (invoices || []).reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0);

        const { data: project } = await supabase
            .from('projects')
            .select('financials')
            .eq('id', projectId)
            .single();

        if (project) {
            const financials = project.financials || {};
            await supabase
                .from('projects')
                .update({ 
                    financials: { ...financials, paid_amount: totalPaid } 
                })
                .eq('id', projectId);
        }
    }
};
