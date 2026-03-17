import { supabase } from '@/lib/supabase';

export interface CatalogNode {
    id: string;
    parent_id: string | null;
    label: string;
    type: string; // 'category', 'model', 'style', 'carat', 'metal' or any custom variation type
    description?: string;
    image_url?: string;
    price?: number;
    specs: Record<string, unknown>;
    sort_order: number;
}

export const apiCatalog = {
    async getFullTree() {
        // Request a large range to avoid truncation in large catalogs
        const { data, error } = await supabase
            .from('catalog_tree')
            .select('*')
            .range(0, 10000)
            .order('sort_order', { ascending: true })
            .order('label', { ascending: true });
        
        if (error) throw error;
        console.log(`[FullTree] Fetched ${data?.length} nodes`);
        return data as CatalogNode[];
    },

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

    async bulkCreateNode(parentIds: string[], nodeData: Omit<CatalogNode, 'id' | 'parent_id'>) {
        const insertions = parentIds.map(parentId => ({
            ...nodeData,
            parent_id: parentId
        }));

        const { data, error } = await supabase
            .from('catalog_tree')
            .insert(insertions)
            .select();

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
     * Propagates a node and its entire sub-tree to all compatible parents in the Category.
     * Uses a high-performance database RPC to avoid network round-trips.
     */
    async propagateNode(sourceNodeId: string) {
        try {
            console.log("Starting optimized database-side propagation for node:", sourceNodeId);
            const { error } = await supabase.rpc('propagate_catalog_node', { source_id: sourceNodeId });
            if (error) throw error;
            console.log("Optimized propagation completed successfully.");
        } catch (error) {
            console.error("Propagation error:", error);
            throw error;
        }
    },

    async findAllNodesByTypeInCategory(categoryId: string, type: string): Promise<CatalogNode[]> {
        const results: CatalogNode[] = [];
        
        const walk = async (parentId: string) => {
            const children = await this.getNodes(parentId);
            for (const child of children) {
                if (child.type === type) {
                    results.push(child);
                }
                await walk(child.id);
            }
        };

        await walk(categoryId);
        return results;
    },

    async duplicateSubTree(sourceNode: CatalogNode, targetParentId: string) {
        // This client-side method is now deprecated in favor of internal_duplicate_subtree (DB-side)
        // for propagation, but we keep it if needed for other one-off client-side clones.
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
            await this.updateNode(targetNodeId, {
                price: sourceNode.price,
                image_url: sourceNode.image_url,
                description: sourceNode.description,
                specs: sourceNode.specs
            });
        } else {
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

        const children = await this.getNodes(sourceNode.id);
        if (children && children.length > 0) {
            await Promise.all(children.map(child => this.duplicateSubTree(child, targetNodeId)));
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
