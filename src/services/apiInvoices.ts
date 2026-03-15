import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Project } from './apiProjects';
import { apiActivities } from './apiActivities';

export interface Invoice {
    id: string;
    project_id: string;
    amount: number;
    amount_paid: number; // New field
    status: 'draft' | 'sent' | 'partial' | 'paid' | 'void';
    stripe_payment_link?: string;
    due_date?: string;
    paid_at?: string;
    created_at: string;
    project?: Project; // joined
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
        return data as Invoice[];
    },

    async create(invoice: Partial<Invoice>) {
        const { data, error } = await supabase.from('invoices').insert(invoice).select().single();

        if (error) {
            console.error("Supabase Create Invoice Error:", error);
            throw error;
        }

        // Log initial payment if present
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

    async update(id: string, updates: Partial<Invoice>) {

        // LOGIC PARITY: Retrieve current invoice to calculate status if amount_paid changes
        if (updates.amount_paid !== undefined) {
            const { data: current } = await supabase.from('invoices').select('amount, amount_paid, project_id').eq('id', id).single();
            if (current) {
                const total = updates.amount !== undefined ? updates.amount : current.amount;
                const paid = updates.amount_paid;

                if (paid >= total) {
                    updates.status = 'paid';
                    updates.paid_at = new Date().toISOString();
                } else if (paid > 0) {
                    updates.status = 'partial';
                    // Clear paid_at if it was previously set (optional, but good for consistency)
                    updates.paid_at = undefined;
                } else {
                    updates.status = 'sent';
                    updates.paid_at = undefined;
                }

                // Log the payment delta for accurate financial snapshots
                const delta = paid - (current.amount_paid || 0);
                if (delta !== 0) {
                    apiActivities.log({
                        project_id: current.project_id, 
                        user_id: 'system', // Default if context isn't passed yet, will be improved in next steps if needed
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

        return data; // Fixed missing brace in previous attempt context
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

        // Sum amount_paid from all invoices for this project
        const { data: invoices } = await supabase
            .from('invoices')
            .select('amount_paid')
            .eq('project_id', projectId)
            .neq('status', 'void');

        const totalPaid = (invoices || []).reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0);

        // Fetch current project financials
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
