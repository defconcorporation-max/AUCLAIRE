
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

// MOCK STORE
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
            console.warn("Using Mock Create for Client");
            // Mock Create
            const newClient: Client = {
                id: Math.random().toString(36).substr(2, 9),
                full_name: client.full_name || 'Unknown',
                email: client.email,
                phone: client.phone,
                notes: client.notes,
                status: 'active',
                created_at: new Date().toISOString()
            };
            mockClients = [newClient, ...mockClients];
            saveMockData(); // Save persistence
            return newClient;
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
    }
};
