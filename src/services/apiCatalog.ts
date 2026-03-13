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

    /**
     * Propagates a node and its entire sub-tree to all sibling branches.
     * Useful for applying the same Style/Carat/Metal options to all Models in a Category.
     */
    async propagateNode(sourceNodeId: string) {
        // 1. Get the source node and its siblings' parent
        const { data: sourceNode, error: fetchErr } = await supabase
            .from('catalog_tree')
            .select('*')
            .eq('id', sourceNodeId)
            .single();
        
        if (fetchErr || !sourceNode) throw fetchErr || new Error("Source node not found");
        if (!sourceNode.parent_id) return; // Cannot propagate root nodes

        // 2. We want to apply this to all sibling MODELS of the current model.
        // Hierarchy is: Category -> Model -> Style -> Carat -> Metal
        // If we are at 'Style' level, we want to copy to all other 'Model' nodes.
        
        const { data: parentNode, error: parentErr } = await supabase
            .from('catalog_tree')
            .select('*')
            .eq('id', sourceNode.parent_id)
            .single();

        if (parentErr || !parentNode || !parentNode.parent_id) return;

        // Get all sibling MODELS (nodes with same parent as our parent)
        const { data: siblingParents, error: siblingsErr } = await supabase
            .from('catalog_tree')
            .select('*')
            .eq('parent_id', parentNode.parent_id)
            .neq('id', parentNode.id); // Exclude current model

        if (siblingsErr) throw siblingsErr;

        // 3. For each sibling, ensure equivalent node exists and propagate sub-tree
        for (const targetParent of siblingParents) {
            await this.duplicateSubTree(sourceNode, targetParent.id);
        }
    },

    async duplicateSubTree(sourceNode: any, targetParentId: string) {
        // 1. Check if node with same label already exists under targetParentId
        const { data: existing } = await supabase
            .from('catalog_tree')
            .select('*')
            .eq('parent_id', targetParentId)
            .eq('label', sourceNode.label)
            .eq('type', sourceNode.type)
            .maybeSingle();

        let targetNodeId: string;

        if (existing) {
            targetNodeId = existing.id;
            // Update to sync
            await this.updateNode(targetNodeId, {
                price: sourceNode.price,
                image_url: sourceNode.image_url,
                description: sourceNode.description,
                specs: sourceNode.specs
            });
        } else {
            // Create new node
            const newNode = await this.createNode({
                parent_id: targetParentId,
                label: sourceNode.label,
                type: sourceNode.type,
                description: sourceNode.description,
                image_url: sourceNode.image_url,
                price: sourceNode.price,
                specs: sourceNode.specs,
                sort_order: sourceNode.sort_order
            });
            targetNodeId = newNode.id;
        }

        // 2. Recursively duplicate children
        const children = await this.getNodes(sourceNode.id);
        for (const child of children) {
            await this.duplicateSubTree(child, targetNodeId);
        }
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
