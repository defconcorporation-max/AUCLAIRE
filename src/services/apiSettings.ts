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
    get(): CompanySettings {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
        return DEFAULT_SETTINGS;
    },

    save(settings: CompanySettings) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
        return settings;
    }
};
