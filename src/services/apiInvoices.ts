import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Project } from './apiProjects';

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
            .select('*, project:projects(title, client:clients(full_name))')
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

        return data;
    },

    async update(id: string, updates: Partial<Invoice>) {

        // LOGIC PARITY: Retrieve current invoice to calculate status if amount_paid changes
        if (updates.amount_paid !== undefined) {
            const { data: current } = await supabase.from('invoices').select('amount').eq('id', id).single();
            if (current) {
                const total = updates.amount !== undefined ? updates.amount : current.amount;
                const paid = updates.amount_paid;

                if (paid >= total) {
                    updates.status = 'paid';
                    updates.paid_at = new Date().toISOString();
                } else if (paid > 0) {
                    updates.status = 'partial';
                    // Clear paid_at if it was previously set (optional, but good for consistency)
                    updates.paid_at = null as any;
                } else {
                    updates.status = 'sent';
                    updates.paid_at = null as any;
                }
            }
        }

        const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single();

        if (error) {
            toast({ title: 'Error updating invoice', description: error.message, variant: 'destructive' });
            throw error;
        }
        return data; // Fixed missing brace in previous attempt context
    },

    async delete(id: string) {
        const { error } = await supabase.from('invoices').delete().eq('id', id);

        if (error) {
            toast({ title: 'Error deleting invoice', description: error.message, variant: 'destructive' });
            throw error;
        }
    }
};
