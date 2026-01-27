import { supabase } from "@/lib/supabase";

export interface CompanySettings {
    company_name: string;
    logo_url?: string;
    contact_email: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    country: string;
    tax_rate: number; // e.g., 20.0 for 20%
    currency_symbol: string;
}

const DEFAULT_SETTINGS: CompanySettings = {
    company_name: 'Auclaire Jewelry',
    contact_email: 'contact@auclaire.com',
    phone: '+1 (555) 0123',
    address_line1: '123 Luxury Lane',
    city: 'New York',
    country: 'USA',
    tax_rate: 0,
    currency_symbol: '$'
};

const LOCAL_STORAGE_KEY = 'auclaire_settings';

export const apiSettings = {
    async get(): Promise<CompanySettings> {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();

        if (error || !data) {
            console.warn("Using Mock/Local Data for Settings");
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
            return DEFAULT_SETTINGS;
        }

        // Map DB fields back to interface if needed (though they match 1:1 currently)
        return data as CompanySettings;
    },

    async save(settings: CompanySettings) {
        // Upsert ID = 1
        const { data, error } = await supabase.from('settings').upsert({
            id: 1,
            ...settings,
            updated_at: new Date().toISOString()
        }).select().single();

        if (error) {
            console.warn("Using Mock Save for Settings");
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
            return settings;
        }

        return data as CompanySettings;
    }
};
