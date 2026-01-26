
import { supabase } from '@/lib/supabase';
import { Project } from './apiProjects';

export interface Invoice {
    id: string;
    project_id: string;
    amount: number;
    status: 'draft' | 'sent' | 'paid' | 'void';
    stripe_payment_link?: string;
    due_date?: string;
    paid_at?: string;
    created_at: string;
    project?: Project; // joined
}

// MOCK STORE
let mockInvoices: Invoice[] = [
    {
        id: '1', amount: 1500, status: 'draft', due_date: '2024-12-31', created_at: new Date().toISOString(),
        project_id: '1',
        project: { title: 'Test Project - Solitaire Ring', client: { full_name: 'Test Client' } } as Project
    },
];

// Helper to persist mock data
const saveMockData = () => {
    try {
        localStorage.setItem('mock_invoices', JSON.stringify(mockInvoices));
    } catch (e) {
        console.warn("Failed to persist mock invoices", e);
    }
};

// Load mock data from storage
const loadMockData = () => {
    const stored = localStorage.getItem('mock_invoices');
    if (stored) {
        mockInvoices = JSON.parse(stored);
    }
};

// Initial Load
loadMockData();

export const apiInvoices = {
    async getAll() {
        loadMockData(); // Ensure fresh data
        const { data, error } = await supabase
            .from('invoices')
            .select('*, project:projects(title, client:clients(full_name))')
            .order('created_at', { ascending: false });

        if (error || !data) {
            console.warn("Using Mock Data for Invoices");

            // AUTO-SYNC: Ensure every project has an invoice
            try {
                const storedProjects = JSON.parse(localStorage.getItem('mock_projects') || '[]');
                let added = false;
                storedProjects.forEach((p: any) => {
                    const hasInvoice = mockInvoices.some(i => i.project_id === p.id);
                    if (!hasInvoice && p.budget) {
                        const newInv: Invoice = {
                            id: Math.random().toString(36).substr(2, 9),
                            project_id: p.id,
                            amount: p.budget,
                            status: 'draft',
                            created_at: new Date().toISOString(),
                            due_date: p.deadline,
                            project: { title: p.title, client: p.client || { full_name: 'Unknown' } } as Project
                        };
                        mockInvoices.push(newInv);
                        added = true;
                    }
                });
                if (added) {
                    saveMockData();
                    // Sort descending
                    mockInvoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                }
            } catch (e) {
                console.error("Auto-sync failed", e);
            }

            return [...mockInvoices];
        }
        return data as Invoice[];
    },

    async create(invoice: Partial<Invoice>) {
        const { data, error } = await supabase.from('invoices').insert(invoice).select().single();

        if (error) {
            console.warn("Using Mock Create for Invoice");

            // Helper to get real project info for the mock join
            let projectInfo: any = { title: 'Unknown Project', client: { full_name: 'Unknown' } };
            if (invoice.project_id) {
                try {
                    const storedProjects = JSON.parse(localStorage.getItem('mock_projects') || '[]');
                    const foundP = storedProjects.find((p: any) => p.id === invoice.project_id);
                    if (foundP) {
                        projectInfo = {
                            title: foundP.title,
                            client: foundP.client || { full_name: 'Unknown' }
                        };
                    }
                } catch (e) { console.error(e); }
            }

            const newInvoice: Invoice = {
                id: Math.random().toString(36).substr(2, 9),
                amount: invoice.amount || 0,
                status: 'draft',
                due_date: invoice.due_date,
                project_id: invoice.project_id || '1',
                stripe_payment_link: invoice.stripe_payment_link,
                created_at: new Date().toISOString(),
                project: projectInfo as Project
            };
            mockInvoices = [newInvoice, ...mockInvoices];
            saveMockData();
            return newInvoice;
        }

        return data;
    },

    async update(id: string, updates: Partial<Invoice>) {
        const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single();

        if (error) {
            console.warn("Using Mock Update for Invoice");
            const index = mockInvoices.findIndex(i => i.id === id);
            if (index !== -1) {
                mockInvoices[index] = { ...mockInvoices[index], ...updates };
                saveMockData();
                return mockInvoices[index];
            }
            throw new Error('Invoice not found');
        }
        return data; // Fixed missing brace in previous attempt context
    },

    async delete(id: string) {
        const { error } = await supabase.from('invoices').delete().eq('id', id);

        if (error) {
            console.warn("Using Mock Delete for Invoice");
            mockInvoices = mockInvoices.filter(i => i.id !== id);
            saveMockData();
            return;
        }
    }
};
