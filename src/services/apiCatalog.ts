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
     * Propagates a node and its entire sub-tree to all compatible parents in the Category.
     * Example: If propagating a Carat, it will hit ALL Styles across ALL Models in this Category.
     */
    async propagateNode(sourceNodeId: string) {
        try {
            console.log("Starting broad propagation for node:", sourceNodeId);
            
            // 1. Get the source node
            const { data: sourceNode, error: fetchErr } = await supabase
                .from('catalog_tree')
                .select('*')
                .eq('id', sourceNodeId)
                .single();
            
            if (fetchErr || !sourceNode) throw fetchErr || new Error("Source node not found");
            if (!sourceNode.parent_id) return;

            // 2. Identify the Category root
            let categoryNode: CatalogNode | null = null;
            let currentParentId: string | null = sourceNode.parent_id;

            while (currentParentId) {
                const { data: node, error } = await supabase
                    .from('catalog_tree')
                    .select('*')
                    .eq('id', currentParentId)
                    .single();
                
                if (error || !node) break;
                if (node.type === 'category') {
                    categoryNode = node;
                    break;
                }
                currentParentId = node.parent_id;
            }

            if (!categoryNode) {
                console.warn("Could not find 'category' ancestor. Propagation stopped.");
                return;
            }

            console.log(`Propagating within Category: ${categoryNode.label}`);

            // 3. Find ALL nodes in this Category that can be a parent for the source node type
            const targetParentType = this.getParentTypeFor(sourceNode.type);
            if (!targetParentType) return;

            const targetParents = await this.findAllNodesByTypeInCategory(categoryNode.id, targetParentType);
            
            // Exclude the current parent
            const otherParents = targetParents.filter(p => p.id !== sourceNode.parent_id);
            
            console.log(`Found ${otherParents.length} other target parents of type ${targetParentType}`);

            // 4. Parallelize propagation
            if (otherParents.length > 0) {
                await Promise.all(otherParents.map(parent => 
                    this.duplicateSubTree(sourceNode, parent.id)
                ));
            }

            console.log("Broad propagation completed successfully.");
        } catch (error) {
            console.error("Propagation error:", error);
            throw error;
        }
    },

    getParentTypeFor(type: CatalogNode['type']): CatalogNode['type'] | null {
        const types: CatalogNode['type'][] = ['category', 'model', 'style', 'carat', 'metal'];
        const index = types.indexOf(type);
        if (index <= 0) return null;
        return types[index - 1];
    },

    async findAllNodesByTypeInCategory(categoryId: string, type: CatalogNode['type']): Promise<CatalogNode[]> {
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
