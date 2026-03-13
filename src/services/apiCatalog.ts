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
        try {
            console.log("Starting propagation for node:", sourceNodeId);
            
            // 1. Get the source node
            const { data: sourceNode, error: fetchErr } = await supabase
                .from('catalog_tree')
                .select('*')
                .eq('id', sourceNodeId)
                .single();
            
            if (fetchErr || !sourceNode) throw fetchErr || new Error("Source node not found");
            if (!sourceNode.parent_id) return; // Cannot propagate root nodes

            // 2. Build the path from Model to SourceNode parent
            // We want to apply this across sibling models.
            let pathFromModel: { label: string, type: CatalogNode['type'] }[] = [];
            let currentParentId: string | null = sourceNode.parent_id;
            let modelNode: CatalogNode | null = null;

            while (currentParentId) {
                const { data: node, error } = await supabase
                    .from('catalog_tree')
                    .select('*')
                    .eq('id', currentParentId)
                    .single();
                
                if (error || !node) break;
                
                if (node.type === 'model') {
                    modelNode = node;
                    break;
                }
                
                pathFromModel.unshift({ label: node.label, type: node.type });
                currentParentId = node.parent_id;
            }

            if (!modelNode || !modelNode.parent_id) {
                console.warn("Could not find 'model' ancestor for propagation. Falling back to local sibling logic.");
                // Fallback: propagate to direct siblings of the parent if no model ancestor found
                return this.propagateToDirectSiblings(sourceNode);
            }

            console.log(`Found Model ancestor: ${modelNode.label}. Path to target:`, pathFromModel);

            // 3. Get all sibling Models in the Category
            const { data: siblingModels, error: siblingsErr } = await supabase
                .from('catalog_tree')
                .select('*')
                .eq('parent_id', modelNode.parent_id)
                .neq('id', modelNode.id);

            if (siblingsErr) throw siblingsErr;
            if (!siblingModels || siblingModels.length === 0) return;

            console.log(`Propagating to ${siblingModels.length} sibling models.`);

            // 4. Parallelize propagation to each Model branch
            await Promise.all(siblingModels.map(async (targetModel) => {
                try {
                    // Navigate/Create the path under targetModel
                    let targetParentId = targetModel.id;
                    for (const step of pathFromModel) {
                        targetParentId = await this.ensureNodeExists(targetParentId, step.label, step.type);
                    }
                    
                    // Duplicate/Sync the source node
                    await this.duplicateSubTree(sourceNode, targetParentId);
                } catch (err) {
                    console.error(`Failed to propagate to model ${targetModel.label}:`, err);
                }
            }));

            console.log("Propagation completed successfully.");
        } catch (error) {
            console.error("Propagation error:", error);
            throw error;
        }
    },


    async ensureNodeExists(parentId: string, label: string, type: CatalogNode['type']): Promise<string> {
        const { data: existing } = await supabase
            .from('catalog_tree')
            .select('id')
            .eq('parent_id', parentId)
            .eq('label', label)
            .maybeSingle();
        
        if (existing) return existing.id;

        const newNode = await this.createNode({
            parent_id: parentId,
            label,
            type,
            sort_order: 0,
            specs: {}
        });
        return newNode.id;
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
