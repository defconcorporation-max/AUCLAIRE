
import { supabase } from '@/lib/supabase';

// Types
export interface Project {
    id: string;
    title: string;
    client_id: string;
    status: 'designing' | 'design_ready' | 'design_modification' | '3d_model' | 'approved_for_production' | 'production' | 'delivery' | 'completed';
    description?: string;
    budget?: number;
    deadline?: string;
    created_at: string;
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
        supplier_cost?: number; // Cost from manufacturer
        shipping_cost?: number; // Shipping to client
        customs_fee?: number;   // Import duties
        selling_price?: number; // Usually same as budget, but tracked separately
        paid_amount?: number;   // Total amount paid by client
    };
}

export type ProjectStatus = Project['status'];

// MOCK STORE
let mockProjects: Project[] = [
    { id: '1', title: 'Test Project - Solitaire Ring', status: 'designing', client_id: '1', client: { full_name: 'Test Client' }, budget: 5000, deadline: '2024-12-31', created_at: new Date().toISOString() },
];

// Helper to persist mock data
const saveMockData = () => {
    try {
        localStorage.setItem('mock_projects', JSON.stringify(mockProjects));
    } catch (e) {
        console.warn("Failed to persist mock data (Likely Quota Exceeded)", e);
        // Could implement LRU or clear old projects here in a real limited demo
    }
};

// Load mock data from storage or use default
const loadMockData = () => {
    const stored = localStorage.getItem('mock_projects');
    if (stored) {
        mockProjects = JSON.parse(stored);
    }
};

// Initial Load
loadMockData();

export const apiProjects = {
    async getAll() {
        // Reload on every fetch to ensure consistency across tabs if needed
        loadMockData();

        const { data, error } = await supabase
            .from('projects')
            .select('*, client:clients(full_name)')
            .order('updated_at', { ascending: false });

        if (error || !data) {
            console.warn("Using Mock Data for Projects");
            return [...mockProjects];
        }
        return data as Project[];
    },

    async getStats() {
        loadMockData(); // Ensure fresh data
        const total = mockProjects.length;
        const active = mockProjects.filter(p => !['completed', 'delivery'].includes(p.status)).length;
        const completed = mockProjects.filter(p => p.status === 'completed').length;
        const revenue = mockProjects.reduce((sum, p) => sum + (p.financials?.selling_price || p.budget || 0), 0);

        return {
            total,
            active,
            completed,
            revenue
        }
    },

    async getRevenueStats() {
        loadMockData();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();

        // Initialize with 0
        const revenueMap = new Map<string, number>();
        months.forEach(m => revenueMap.set(m, 0));

        mockProjects.forEach(p => {
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
            console.warn("Using Mock Create for Project");

            // Try to find client name for better UX in mock mode
            let clientName = 'Mock Client';
            if (project.client_id) {
                try {
                    // Cyclic dependency workaround: re-fetch from local storage directly if API fails
                    // or try dynamic import
                    const { apiClients } = await import('./apiClients');
                    // Ensure we are fetching fresh data
                    await apiClients.getAll();
                    const client = await apiClients.getById(project.client_id);
                    if (client) clientName = client.full_name;
                } catch (e) {
                    console.warn("Could not resolve client for mock project", e);
                    // Fallback: try to read from localStorage directly
                    try {
                        const storedClients = JSON.parse(localStorage.getItem('mock_clients') || '[]');
                        const found = storedClients.find((c: any) => c.id === project.client_id);
                        if (found) clientName = found.full_name;
                    } catch (err) {
                        console.error("Double fallback failed", err);
                    }
                }
            }

            const newProject: Project = {
                id: Math.random().toString(36).substr(2, 9),
                title: project.title || 'New Project',
                client_id: project.client_id || '1',
                status: 'designing',
                description: project.description,
                budget: project.budget,
                deadline: project.deadline,
                created_at: new Date().toISOString(),
                client: { full_name: clientName }
            };
            mockProjects = [newProject, ...mockProjects];
            saveMockData(); // Save to local storage
            return newProject;
        }

        return data;
    },

    async updateStatus(id: string, status: ProjectStatus) {
        const { data, error } = await supabase.from('projects').update({ status }).eq('id', id).select().single();

        if (error) {
            console.warn("Using Mock Update for Project Status");
            const index = mockProjects.findIndex(p => p.id === id);
            if (index !== -1) {
                // Versioning Logic: Snapshot current design if requesting modification
                if (status === 'design_modification' && mockProjects[index].status === 'design_ready') {
                    const current = mockProjects[index];
                    const details = current.stage_details || {};
                    const versions = details.design_versions || [];

                    const newVersion = {
                        version_number: versions.length + 1,
                        created_at: new Date().toISOString(),
                        notes: details.model_notes || 'No notes',
                        files: details.design_files || [], // Snapshot current files
                        model_link: details.model_link,
                        status: 'rejected' as const,
                        feedback: 'Changes requested by Admin'
                    };

                    mockProjects[index] = {
                        ...current,
                        status,
                        stage_details: {
                            ...details,
                            design_versions: [...versions, newVersion]
                        }
                    };
                } else {
                    // Standard update
                    mockProjects[index] = { ...mockProjects[index], status };
                }

                saveMockData(); // Save to local storage
                return mockProjects[index];
            }
            throw new Error('Project not found in mock store');
        }

        return data;
    },

    async updateDetails(id: string, details: Partial<Project['stage_details']>) {
        console.warn("Using Mock Update for Project Details");
        const index = mockProjects.findIndex(p => p.id === id);
        if (index !== -1) {
            const current = mockProjects[index].stage_details || {};
            mockProjects[index] = {
                ...mockProjects[index],
                stage_details: { ...current, ...details }
            };
            saveMockData(); // Save to local storage
            return mockProjects[index];
        }
        throw new Error('Project not found');
    },

    async update(id: string, updates: Partial<Project>) {
        const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();

        if (error) {
            console.warn("Using Mock Update for Project Root");
            const index = mockProjects.findIndex(p => p.id === id);
            if (index !== -1) {
                let updatedProject = { ...mockProjects[index], ...updates };

                // Check if Client ID changed, if so, update the joined client object
                if (updates.client_id && updates.client_id !== mockProjects[index].client_id) {
                    try {
                        let clientName = 'Unknown Client';
                        const storedClients = JSON.parse(localStorage.getItem('mock_clients') || '[]');
                        const found = storedClients.find((c: any) => c.id === updates.client_id);
                        if (found) {
                            clientName = found.full_name;
                        } else {
                            // Try dynamic import if not found (less likely for mock, but safe)
                            const { apiClients } = await import('./apiClients');
                            const client = await apiClients.getById(updates.client_id!);
                            if (client) clientName = client.full_name;
                        }

                        updatedProject.client = { full_name: clientName };
                        // Also update the client_id prop if not already set by spread
                        updatedProject.client_id = updates.client_id;
                    } catch (e) {
                        console.warn("Failed to resolve new client name during update", e);
                    }
                }

                mockProjects[index] = updatedProject;
                saveMockData();
                mockProjects[index] = updatedProject;
                saveMockData();

                // FINANCIAL SYNC: Update Invoice if Budget Changed
                if (updates.budget) {
                    try {
                        // Dynamic import to avoid cycles if any
                        const { apiInvoices } = await import('./apiInvoices');
                        const invoices = await apiInvoices.getAll();
                        const linkedInvoice = invoices.find(i => i.project_id === id && i.status !== 'paid');

                        if (linkedInvoice) {
                            console.log(`Syncing Invoice ${linkedInvoice.id} amount to ${updates.budget}`);
                            await apiInvoices.update(linkedInvoice.id, { amount: updates.budget });
                        }
                    } catch (err) {
                        console.error("Failed to sync invoice price", err);
                    }
                }

                return mockProjects[index];
            }
            throw new Error('Project not found');
        }
        return data;
    },

    async updateFinancials(id: string, financials: Partial<Project['financials']>) {
        console.warn("Using Mock Update for Project Financials");
        const index = mockProjects.findIndex(p => p.id === id);
        if (index !== -1) {
            const current = mockProjects[index].financials || {};
            mockProjects[index] = {
                ...mockProjects[index],
                financials: { ...current, ...financials }
            };
            saveMockData(); // Save to local storage
            return mockProjects[index];
        }
        throw new Error('Project not found');
    },

    async delete(id: string) {
        const { error } = await supabase.from('projects').delete().eq('id', id);

        if (error) {
            console.warn("Using Mock Delete for Project");
            mockProjects = mockProjects.filter(p => p.id !== id);
            saveMockData();
            return;
        }
    }
};
