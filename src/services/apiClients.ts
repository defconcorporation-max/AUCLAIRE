
import { supabase } from '@/lib/supabase';

export interface Client {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    notes?: string;
    status: 'active' | 'inactive';
    created_at: string;
}

// MOCK STORE (Fallback)
let mockClients: Client[] = [
    { id: '1', full_name: 'Test Client', email: 'client@test.com', phone: '555-0000', status: 'active', created_at: new Date().toISOString() },
];


// Helper to persist mock data
const saveMockData = () => {
    localStorage.setItem('mock_clients', JSON.stringify(mockClients));
};

// Load mock data from storage or use default
const loadMockData = () => {
    const stored = localStorage.getItem('mock_clients');
    if (stored) {
        mockClients = JSON.parse(stored);
    }
};

// Initial Load
loadMockData();

export const apiClients = {
    async getAll() {
        // Reload on fetch
        loadMockData();

        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error || !data) {
            console.warn("Using Mock Data for Clients");
            return [...mockClients];
        }
        return data as Client[];
    },

    async getById(id: string) {
        const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();

        if (error) {
            console.warn("Using Mock GetById for Client");
            const client = mockClients.find(c => c.id === id);
            if (client) return client;
            throw error;
        }

        return data as Client;
    },

    async create(client: Partial<Client>) {
        const { data, error } = await supabase.from('clients').insert(client).select().single();

        if (error) {
            console.error("Supabase Create Client Error:", error);
            throw error;
        }
        return data;
    },

    async update(id: string, updates: Partial<Client>) {
        const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single();

        if (error) {
            console.warn("Using Mock Update for Client");
            const index = mockClients.findIndex(c => c.id === id);
            if (index !== -1) {
                mockClients[index] = { ...mockClients[index], ...updates };
                saveMockData();
                return mockClients[index];
            }
            throw new Error('Client not found');
        }
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) {
            console.warn("Using Mock Delete for Client");
            mockClients = mockClients.filter(c => c.id !== id);
            saveMockData();
            return;
        }
    }
};
