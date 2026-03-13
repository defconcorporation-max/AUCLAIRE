export type CanadianProvince = 
    | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

export interface TaxBreakdown {
    gst: number;
    pst: number;
    hst: number;
    total: number;
    totalRate: number;
}

export const CANADIAN_TAX_RATES: Record<CanadianProvince, { gst: number; pst: number; hst: number }> = {
    'AB': { gst: 0.05, pst: 0, hst: 0 },
    'BC': { gst: 0.05, pst: 0.07, hst: 0 },
    'MB': { gst: 0.05, pst: 0.07, hst: 0 },
    'NB': { gst: 0, pst: 0, hst: 0.15 },
    'NL': { gst: 0, pst: 0, hst: 0.15 },
    'NS': { gst: 0, pst: 0, hst: 0.15 },
    'NT': { gst: 0.05, pst: 0, hst: 0 },
    'NU': { gst: 0.05, pst: 0, hst: 0 },
    'ON': { gst: 0, pst: 0, hst: 0.13 },
    'PE': { gst: 0, pst: 0, hst: 0.15 },
    'QC': { gst: 0.05, pst: 0.09975, hst: 0 },
    'SK': { gst: 0.05, pst: 0.06, hst: 0 },
    'YT': { gst: 0.05, pst: 0, hst: 0 },
};

export const provinceNames: Record<CanadianProvince, string> = {
    'AB': 'Alberta',
    'BC': 'British Columbia',
    'MB': 'Manitoba',
    'NB': 'New Brunswick',
    'NL': 'Newfoundland and Labrador',
    'NS': 'Nova Scotia',
    'NT': 'Northwest Territories',
    'NU': 'Nunavut',
    'ON': 'Ontario',
    'PE': 'Prince Edward Island',
    'QC': 'Québec',
    'SK': 'Saskatchewan',
    'YT': 'Yukon',
};

export function calculateCanadianTax(netAmount: number, province: CanadianProvince): TaxBreakdown {
    const rates = CANADIAN_TAX_RATES[province];
    const gst = netAmount * rates.gst;
    const pst = netAmount * rates.pst;
    const hst = netAmount * rates.hst;
    const total = gst + pst + hst;
    const totalRate = rates.gst + rates.pst + rates.hst;

    return {
        gst,
        pst,
        hst,
        total,
        totalRate: totalRate * 100
    };
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency: 'CAD',
    }).format(amount);
}
