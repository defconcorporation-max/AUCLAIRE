import { supabase } from '@/lib/supabase';

export interface CatalogNode {
    id: string;
    parent_id: string | null;
    label: string;
    type: 'category' | 'model' | 'style' | 'carat' | 'metal';
    description?: string;
    image_url?: string;
    price?: number;
    specs: Record<string, any>;
    sort_order: number;
}

export const apiCatalog = {
    async getNodes(parentId: string | null = null) {
        let query = supabase
            .from('catalog_tree')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('label', { ascending: true });

        if (parentId === null) {
            query = query.is('parent_id', null);
        } else {
            query = query.eq('parent_id', parentId);
        }

        const { data, error } = await query;
        if (error) {
            // Table might not exist yet
            if (error.code === '42P01') {
                console.warn("Catalog table not found, using mock data");
                return this.getMockNodes(parentId);
            }
            throw error;
        }
        return data as CatalogNode[];
    },

    async createNode(node: Omit<CatalogNode, 'id'>) {
        const { data, error } = await supabase
            .from('catalog_tree')
            .insert(node)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateNode(id: string, updates: Partial<CatalogNode>) {
        const { data, error } = await supabase
            .from('catalog_tree')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteNode(id: string) {
        const { error } = await supabase
            .from('catalog_tree')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Mock data for development when table is missing
    getMockNodes(parentId: string | null): CatalogNode[] {
        if (parentId === null) {
            return [
                { id: 'cat1', parent_id: null, label: 'Bagues', type: 'category', description: 'Bagues de fiançailles haut de gamme', sort_order: 0, specs: {} },
                { id: 'cat2', parent_id: null, label: 'Alliances', type: 'category', description: 'Alliances classiques et éternité', sort_order: 1, specs: {} }
            ];
        }
        if (parentId === 'cat1') {
            return [
                { id: 'mod1', parent_id: 'cat1', label: 'Princess Cut', type: 'model', description: 'Taille princesse carrée', sort_order: 0, specs: {} },
                { id: 'mod2', parent_id: 'cat1', label: 'Oval Cut', type: 'model', description: 'Taille ovale élégante', sort_order: 1, specs: {} }
            ];
        }
        return [];
    }
};
