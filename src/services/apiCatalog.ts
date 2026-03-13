import { supabase } from '@/lib/supabase';

export interface CatalogCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
}

export interface CatalogItem {
    id: string;
    category_id: string;
    name: string;
    description?: string;
    image_url?: string;
    base_price: number;
    specs: Record<string, any>;
}

export const apiCatalog = {
    async getCategories() {
        const { data, error } = await supabase
            .from('catalog_categories')
            .select('*')
            .order('name');
        if (error) throw error;
        return data as CatalogCategory[];
    },

    async getItems(categoryId?: string) {
        let query = supabase.from('catalog_items').select('*, category:catalog_categories(name)');
        
        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createItem(item: Omit<CatalogItem, 'id'>) {
        const { data, error } = await supabase
            .from('catalog_items')
            .insert(item)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateItem(id: string, updates: Partial<CatalogItem>) {
        const { data, error } = await supabase
            .from('catalog_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteItem(id: string) {
        const { error } = await supabase
            .from('catalog_items')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
