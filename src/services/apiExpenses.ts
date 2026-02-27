import { supabase } from '@/lib/supabase';

export interface Expense {
    id: string;
    created_at: string;
    date: string;
    category: 'commission' | 'operational' | 'material' | 'marketing' | 'salary' | 'software' | 'other';
    description: string;
    amount: number;
    recipient_id?: string;
    recipient?: { full_name: string, email: string };
    project_id?: string;
    project?: { title: string };
    status: 'paid' | 'pending' | 'cancelled';
    created_by?: string;
}

export const apiExpenses = {
    async getAll() {
        // Fetch explicit expenses
        const { data: explicitExpenses, error } = await supabase
            .from('expenses')
            .select(`
                *,
                recipient:profiles(full_name, email),
                project:projects(title)
            `)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching expenses:', error);
            throw error;
        }

        // Fetch projects to synthesize production costs
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, title, created_at, financials, status')
            .neq('status', 'cancelled'); // Don't show costs for cancelled projects unless you want to

        if (projectsError) console.error('Error fetching projects for expenses:', projectsError);

        let synthesizedExpenses: Expense[] = [];

        if (projects) {
            projects.forEach(p => {
                if (!p.financials) return;

                const pushSyntheticExpense = (amount: number, typeLabel: string, category: Expense['category']) => {
                    if (amount > 0) {
                        synthesizedExpenses.push({
                            id: `synth-${p.id}-${typeLabel.toLowerCase().replace(' ', '-')}`,
                            created_at: p.created_at,
                            date: p.created_at.split('T')[0], // Approximation of when the expense occurred
                            category: category,
                            description: `Project: ${p.title} - ${typeLabel}`,
                            amount: amount,
                            project_id: p.id,
                            project: { title: p.title },
                            status: 'paid', // Assuming production costs entered are already paid or committed
                        });
                    }
                };

                // Add individual costs
                pushSyntheticExpense(Number(p.financials.supplier_cost) || 0, 'Production / Supplier Cost', 'material');
                pushSyntheticExpense(Number(p.financials.shipping_cost) || 0, 'Shipping Cost', 'operational');
                pushSyntheticExpense(Number(p.financials.customs_fee) || 0, 'Customs Fee', 'operational');
            });
        }

        const combinedData = [...(explicitExpenses as Expense[]), ...synthesizedExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        console.log('Fetched Combined Expenses:', combinedData);
        return combinedData;
    },

    async create(expense: Partial<Expense>) {
        const { data, error } = await supabase
            .from('expenses')
            .insert([expense])
            .select()
            .single();

        if (error) throw error;
        return data as Expense;
    },

    async update(id: string, updates: Partial<Expense>) {
        const { data, error } = await supabase
            .from('expenses')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Expense;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getStats() {
        // Fetch simple stats locally for now (can be optimized with RPC later)
        const { data, error } = await supabase
            .from('expenses')
            .select('amount, category, status');

        if (error) throw error;

        const totalExpenses = data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const byCategory = data.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + (Number(item.amount) || 0);
            return acc;
        }, {} as Record<string, number>);

        return { totalExpenses, byCategory };
    }
};
