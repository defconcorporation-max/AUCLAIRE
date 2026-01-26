
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
            return [...mockInvoices];
        }
        return data as Invoice[];
    },

    async create(invoice: Partial<Invoice>) {
        const { data, error } = await supabase.from('invoices').insert(invoice).select().single();

        if (error) {
            console.warn("Using Mock Create for Invoice");
            const newInvoice: Invoice = {
                id: Math.random().toString(36).substr(2, 9),
                amount: invoice.amount || 0,
                status: 'draft',
                due_date: invoice.due_date,
                project_id: invoice.project_id || '1',
                stripe_payment_link: invoice.stripe_payment_link,
                created_at: new Date().toISOString(),
                // Mock joined data relation (hacky but works for demo)
                project: { title: 'New Project', client: { full_name: 'Client' } } as Project
            };
            mockInvoices = [newInvoice, ...mockInvoices];
            saveMockData();
            return newInvoice;
        }

        return data;
    }
};
