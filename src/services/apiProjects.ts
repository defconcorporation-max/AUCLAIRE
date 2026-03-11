import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

// Types
export interface Project {
    id: string;
    title: string;
    client_id: string;
    status: 'designing' | 'design_ready' | 'design_modification' | '3d_model' | 'approved_for_production' | 'production' | 'delivery' | 'completed';
    description?: string;
    budget?: number;
    deadline?: string;
    priority?: 'normal' | 'rush';
    created_at: string;
    reference_number?: string;
    client?: { full_name: string }; // joined
    sales_agent_id?: string;
    stage_details?: {
        design_notes?: string;
        sketch_files?: string[]; // Initial Design / Sketches
        design_files?: string[]; // 3D Renders (Legacy name kept for compatibility)

        // Version History
        design_versions?: {
            version_number: number;
            created_at: string;
            notes: string;
            files: string[];
            status: 'submitted' | 'rejected' | 'approved';
            feedback?: string;
            model_link?: string;
        }[];

        model_link?: string;
        model_notes?: string;

        production_notes?: string;
        casting_date?: string;

        tracking_number?: string;
        delivery_date?: string;

        // Client Feedback
        client_notes?: string;
        client_approval_status?: 'pending' | 'approved' | 'changes_requested';
    };
    financials?: {
        // Legacy fields (kept for backward compatibility and auto-migration)
        supplier_cost?: number; // Cost from manufacturer
        shipping_cost?: number; // Shipping to client
        customs_fee?: number;   // Import duties
        additional_expense?: number; // Extra supplementary costs added after main expenses

        // New Dynamic Cost Items
        cost_items?: {
            id: string; // Unique ID for React mapping
            detail: string; // "Manufacturing 14k", "Shipping", etc.
            amount: number;
        }[];

        selling_price?: number; // Usually same as budget, but tracked separately
        paid_amount?: number;   // Total amount paid by client
        exported_to_expenses?: boolean; // Flag to skip double-counting in dashboard
        commission_exported_to_expenses?: boolean; // Flag for affiliate commission
    };
    affiliate_id?: string;
    affiliate?: { full_name: string };
    affiliate_commission_rate?: number;
    affiliate_commission_type?: 'percent' | 'fixed';
    manufacturer_id?: string;
    manufacturer?: { full_name: string };
}

export type ProjectStatus = Project['status'];

export const apiProjects = {
    async getAll() {

        // Primary Query: Try with Affiliate Join
        // We use the specific FK constraint name to avoid ambiguity if multiple FKs exist
        const { data, error } = await supabase
            .from('projects')
            .select(`
        *,
        client:clients(full_name),
        affiliate:profiles!projects_affiliate_id_fkey(full_name),
        manufacturer:profiles!projects_manufacturer_id_fkey(full_name)
      `)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error("Project Fetching Failed:", error);
            // Check for explicit "no such column" or ambiguity error
            // If the join fails, try falling back to a query without the affiliate join
            if (error.code === 'PGRST201' || error.message.includes('ambiguous')) {
                console.warn("Ambiguous join detected, attempting fallback without affiliate join...");
                const { data: fallback, error: fallbackError } = await supabase
                    .from('projects')
                    .select('*, client:clients(full_name)')
                    .order('updated_at', { ascending: false });

                if (!fallbackError) return fallback as Project[];
            }

            if (error.code === '42P01' || error.message.includes('permission denied')) {
                toast({ title: 'Database Error', description: error.message, variant: 'destructive' });
                throw error;
            }
            throw error;
        }

        return data as Project[];
    },

    async getStats() {
        const projects = await this.getAll();
        const total = projects.length;
        const active = projects.filter(p => !['completed', 'delivery'].includes(p.status)).length;
        const completed = projects.filter(p => p.status === 'completed').length;
        const revenue = projects.reduce((sum, p) => sum + (p.financials?.selling_price || p.budget || 0), 0);

        return {
            total,
            active,
            completed,
            revenue
        }
    },

    async getRevenueStats() {
        const projects = await this.getAll();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();

        // Initialize with 0
        const revenueMap = new Map<string, number>();
        months.forEach(m => revenueMap.set(m, 0));

        projects.forEach(p => {
            const date = new Date(p.created_at);
            if (date.getFullYear() === currentYear) {
                const month = months[date.getMonth()];
                const amount = p.financials?.selling_price || p.budget || 0;
                revenueMap.set(month, (revenueMap.get(month) || 0) + amount);
            }
        });

        return months.map(name => ({
            name,
            total: revenueMap.get(name) || 0
        }));
    },

    async create(project: Partial<Project>) {
        const { data, error } = await supabase.from('projects').insert(project).select().single();

        if (error) {
            console.error("Supabase Create Project Error:", error);
            throw error;
        }

        return data;
    },

    async updateStatus(id: string, status: ProjectStatus) {
        const { data, error } = await supabase
            .from('projects')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
            throw error;
        }

        return data as Project;
    },

    // Public / Shared Token Access
    async getByToken(token: string) {
        const { data, error } = await supabase
            .rpc('get_project_by_token', { token_uuid: token });

        if (error) throw error;
        // RPC returns an array of rows
        if (!data || data.length === 0) throw new Error("Project not found");
        return data[0] as Project;
    },

    async updateByToken(token: string, updates: Partial<Project>) {
        const { error } = await supabase
            .rpc('update_project_by_token', {
                token_uuid: token,
                new_stage_details: updates.stage_details,
                new_financials: updates.financials,
                new_status: updates.status
            });

        if (error) throw error;
    },

    async updateDetails(id: string, details: Partial<Project['stage_details']>) {
        // 1. Fetch current to merge JSONB
        const { data: currentProject, error: fetchError } = await supabase
            .from('projects')
            .select('stage_details')
            .eq('id', id)
            .single();

        if (!fetchError && currentProject) {
            const newDetails = { ...(currentProject.stage_details || {}), ...details };
            const { data, error } = await supabase
                .from('projects')
                .update({ stage_details: newDetails })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                toast({ title: 'Error updating details', description: error.message, variant: 'destructive' });
                throw error;
            }
            return data;
        }

        if (fetchError) {
            toast({ title: 'Error fetching details', description: fetchError.message, variant: 'destructive' });
            throw fetchError;
        }
    },

    async update(id: string, updates: Partial<Project>) {
        const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();

        // FINANCIAL SYNC (Real DB): Update Invoice if Budget Changed
        if (!error && data && updates.budget) {
            try {
                // Dynamic import to avoid cycles
                const { apiInvoices } = await import('./apiInvoices');
                // We need to find the invoice for this project. 
                // Since we don't have a direct "getInvoiceByProjectId" yet, we'll list (or filter if RLS allows).
                // Ideally, better to add a getByProject method to apiInvoices, but re-using getAll() for consistency with mock pattern for now 
                // or better: select id from invoices where project_id = id
                const { data: invoices } = await supabase.from('invoices').select('*').eq('project_id', id).neq('status', 'paid');

                if (invoices && invoices.length > 0) {
                    const linkedInvoice = invoices[0];
                    console.log(`Syncing Invoice ${linkedInvoice.id} amount to ${updates.budget}`);
                    await apiInvoices.update(linkedInvoice.id, { amount: updates.budget });
                }
            } catch (err) {
                console.error("Failed to sync invoice price (DB)", err);
            }
        }

        if (error) {
            toast({ title: 'Error updating project', description: error.message, variant: 'destructive' });
            throw error;
        }
        return data;
    },

    async updateFinancials(id: string, financials: Partial<Project['financials']>, auditInfo?: { user_id: string; user_name: string }) {
        // 1. Fetch current to merge JSONB
        const { data: currentProject, error: fetchError } = await supabase
            .from('projects')
            .select('financials, title')
            .eq('id', id)
            .single();

        if (!fetchError && currentProject) {
            const oldFinancials = currentProject.financials || {};
            const newFinancials = { ...oldFinancials, ...financials };

            // Build audit diff — track what actually changed
            const changes: string[] = [];
            for (const key of Object.keys(financials) as (keyof typeof financials)[]) {
                const oldVal = oldFinancials[key];
                const newVal = financials[key];
                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    if (key === 'cost_items') {
                        const oldCount = Array.isArray(oldVal) ? (oldVal as any[]).length : 0;
                        const newCount = Array.isArray(newVal) ? (newVal as any[]).length : 0;
                        changes.push(`cost_items: ${oldCount} → ${newCount} items`);
                    } else {
                        changes.push(`${key}: ${oldVal ?? 'N/A'} → ${newVal ?? 'N/A'}`);
                    }
                }
            }

            const { data, error } = await supabase
                .from('projects')
                .update({ financials: newFinancials })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                toast({ title: 'Error updating financials', description: error.message, variant: 'destructive' });
                throw error;
            }

            // Log audit trail if there were meaningful changes
            if (changes.length > 0 && auditInfo) {
                supabase.from('activity_logs').insert({
                    project_id: id,
                    user_id: auditInfo.user_id,
                    user_name: auditInfo.user_name,
                    action: 'financial',
                    details: `Updated financials on "${currentProject.title}": ${changes.join(', ')}`
                }).then(() => {}).catch(() => {}); // fire and forget
            }

            return data;
        }

        if (fetchError) {
            toast({ title: 'Error fetching financials', description: fetchError.message, variant: 'destructive' });
            throw fetchError;
        }
    },

    async delete(id: string) {
        const { error } = await supabase.from('projects').delete().eq('id', id);

        if (error) {
            toast({ title: 'Error deleting project', description: error.message, variant: 'destructive' });
            throw error;
        }
    }
};
