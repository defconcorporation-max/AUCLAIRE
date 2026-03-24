import { supabase } from '@/lib/supabase';
import { apiActivities } from './apiActivities';

// --- TYPES ---

export interface DesignVersion {
    version_number: number;
    created_at: string;
    notes: string;
    files: string[];
    status: 'submitted' | 'rejected' | 'approved';
    feedback?: string;
    model_link?: string;
}

export interface QualityIssue {
    id: string;
    type: 'rework' | 'repair' | 'return' | 'defect';
    description: string;
    reported_at: string;
    resolved_at?: string;
    resolution?: string;
}

export interface TimeEntry {
    id: string;
    stage: string;
    description: string;
    hours: number;
    date: string;
    user_id?: string;
    user_name?: string;
}

export interface DesignApproval {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    submitted_at: string;
    responded_at?: string;
    design_version?: number;
    files: string[];
    client_signature?: string;
    client_comment?: string;
    admin_notes?: string;
}

export interface StageDetails {
    design_notes?: string;
    sketch_files?: string[];
    design_files?: string[];
    vault_files?: string[];
    design_versions?: DesignVersion[];
    model_link?: string;
    model_notes?: string;
    production_notes?: string;
    casting_date?: string;
    tracking_number?: string;
    delivery_date?: string;
    client_notes?: string;
    client_approval_status?: 'pending' | 'approved' | 'changes_requested';
    quality_issues?: QualityIssue[];
    time_entries?: TimeEntry[];
    design_approvals?: DesignApproval[];
}

export interface CostItem {
    id: string;
    detail: string;
    amount: number;
}

export interface Financials {
    supplier_cost?: number;
    shipping_cost?: number;
    customs_fee?: number;
    additional_expense?: number;
    cost_items?: CostItem[];
    selling_price?: number;
    tax_province?: string;
    paid_amount?: number;
    exported_to_expenses?: boolean;
    commission_exported_to_expenses?: boolean;
}

export const JEWELRY_TYPES = [
    'Bague',
    'Bracelet',
    'Collier',
    'Pendentif',
    "Boucles d'oreilles",
    'Chevalière',
    'Alliance',
    'Autre',
] as const;

export type JewelryType = (typeof JEWELRY_TYPES)[number];

export interface Project {
    id: string;
    title: string;
    client_id: string;
    status: 'designing' | 'design_ready' | 'waiting_for_approval' | 'design_modification' | '3d_model' | 'approved_for_production' | 'production' | 'delivery' | 'completed' | 'cancelled';
    description?: string;
    internal_notes?: string;
    budget?: number;
    deadline?: string;
    priority?: 'normal' | 'rush';
    jewelry_type?: JewelryType;
    created_at: string;
    updated_at?: string;
    reference_number?: string;
    share_token?: string;
    pandadoc_contract_id?: string;
    pandadoc_contract_status?: string;
    client?: { full_name: string; email?: string };
    sales_agent_id?: string;
    stage_details?: StageDetails;
    financials?: Financials;
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
        const { data, error } = await supabase
            .from('projects')
            .select(`
                *,
                client:clients(full_name,email),
                affiliate:profiles!projects_affiliate_id_fkey(full_name),
                manufacturer:profiles!projects_manufacturer_id_fkey(full_name)
            `)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error("Project Fetching Failed:", error);
            if (error.code === 'PGRST201' || error.message.includes('ambiguous')) {
                const { data: fallback, error: fallbackError } = await supabase
                    .from('projects')
                    .select('*, client:clients(full_name,email)')
                    .order('updated_at', { ascending: false });
                if (!fallbackError) return fallback as Project[];
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
        return { total, active, completed, revenue };
    },

    async getRevenueStats() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();

        const [projectsResponse, invoicesResponse] = await Promise.all([
            apiProjects.getAll(),
            supabase.from('invoices').select('project_id, amount, amount_paid, status, created_at, paid_at')
        ]);

        const projects = projectsResponse || [];
        const invoices = invoicesResponse.data || [];
        const invoicedProjectIds = new Set(invoices.map(i => i.project_id));

        const collectedMap = new Map<string, number>();
        const invoicedMap = new Map<string, number>();
        const potentialMap = new Map<string, number>();
        
        months.forEach(m => {
            collectedMap.set(m, 0);
            invoicedMap.set(m, 0);
            potentialMap.set(m, 0);
        });

        invoices.forEach(inv => {
            const dateStr = inv.paid_at || inv.created_at;
            const date = new Date(dateStr);
            if (date.getFullYear() === currentYear && inv.status !== 'void') {
                const month = months[date.getMonth()];
                const paid = Number(inv.amount_paid && inv.amount_paid > 0 ? inv.amount_paid : (inv.status === 'paid' ? inv.amount : 0));
                collectedMap.set(month, (collectedMap.get(month) || 0) + paid);
                
                const creationDate = new Date(inv.created_at);
                if (creationDate.getFullYear() === currentYear) {
                    const cMonth = months[creationDate.getMonth()];
                    invoicedMap.set(cMonth, (invoicedMap.get(cMonth) || 0) + Number(inv.amount || 0));
                }
            }
        });

        projects.forEach(p => {
            if (p.status === 'cancelled' || invoicedProjectIds.has(p.id)) return;
            const date = new Date(p.created_at);
            if (date.getFullYear() === currentYear) {
                const month = months[date.getMonth()];
                const amount = Number(p.financials?.selling_price || p.budget || 0);
                potentialMap.set(month, (potentialMap.get(month) || 0) + amount);
            }
        });

        return months.map(name => ({
            name,
            collected: collectedMap.get(name) || 0,
            invoiced: invoicedMap.get(name) || 0,
            potential: potentialMap.get(name) || 0
        }));
    },

    async create(project: Partial<Project>) {
        const { data, error } = await supabase.from('projects').insert(project).select().single();
        if (error) throw error;
        return data;
    },

    async updateStatus(id: string, status: ProjectStatus, userContext?: { id: string, name: string }) {
        const { data, error } = await supabase
            .from('projects')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        try {
            await apiActivities.log({
                project_id: id,
                user_id: userContext?.id || 'system',
                user_name: userContext?.name || 'Système',
                action: 'status_change',
                details: `Statut mis à jour: ${status.replace(/_/g, ' ')}`
            });
        } catch (logErr) {
            console.warn("Failed to log status change:", logErr);
        }
        return data as Project;
    },

    async getByToken(token: string) {
        const { data, error } = await supabase.rpc('get_project_by_token', { token_uuid: token });
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Project not found");
        return data[0] as Project;
    },

    async updateByToken(token: string, updates: Partial<Project>) {
        const { error } = await supabase.rpc('update_project_by_token', {
            token_uuid: token,
            new_stage_details: updates.stage_details,
            new_financials: updates.financials,
            new_status: updates.status
        });
        if (error) throw error;
    },

    async updateDetails(id: string, details: Partial<StageDetails>) {
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
            if (error) throw error;
            return data;
        }
        if (fetchError) throw fetchError;
    },

    async update(id: string, updates: Partial<Project>) {
        const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
        if (!error && data && updates.budget) {
            try {
                const { apiInvoices } = await import('./apiInvoices');
                const { data: invoices } = await supabase.from('invoices').select('*').eq('project_id', id).neq('status', 'paid');
                if (invoices && invoices.length > 0) {
                    await apiInvoices.update(invoices[0].id, { amount: updates.budget });
                }
            } catch (err) {
                console.error("Failed to sync invoice price (DB)", err);
            }
        }
        if (error) throw error;
        return data;
    },

    async updateFinancials(id: string, financials: Partial<Financials>, auditInfo?: { user_id: string; user_name: string }) {
        const { data: currentProject, error: fetchError } = await supabase
            .from('projects')
            .select('financials, title')
            .eq('id', id)
            .single();

        if (!fetchError && currentProject) {
            const oldFinancials = currentProject.financials || {};
            const newFinancials = { ...oldFinancials, ...financials };
            const changes: string[] = [];
            for (const key of Object.keys(financials) as (keyof Financials)[]) {
                const oldVal = oldFinancials[key];
                const newVal = financials[key];
                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    if (key === 'cost_items') {
                        const oldCount = Array.isArray(oldVal) ? (oldVal as unknown[]).length : 0;
                        const newCount = Array.isArray(newVal) ? (newVal as unknown[]).length : 0;
                        changes.push(`cost_items: ${oldCount} → ${newCount} items`);
                    } else {
                        changes.push(`${key}: ${oldVal ?? 'N/A'} → ${newVal ?? 'N/A'}`);
                    }
                }
            }

            const { data, error } = await supabase.from('projects').update({ financials: newFinancials }).eq('id', id).select().single();
            if (error) throw error;

            if (changes.length > 0 && auditInfo) {
                supabase.from('activity_logs').insert({
                    project_id: id,
                    user_id: auditInfo.user_id,
                    user_name: auditInfo.user_name,
                    action: 'financial',
                    details: `Updated financials on "${currentProject.title}": ${changes.join(', ')}`
                }).then(({ error }) => { if (error) console.warn("Audit log failed:", error); });
            }
            return data;
        }
        if (fetchError) throw fetchError;
    },

    async delete(id: string) {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
    }
};
