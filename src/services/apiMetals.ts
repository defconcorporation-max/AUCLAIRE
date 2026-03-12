import { supabase } from '../lib/supabase';

export interface MetalsPricing {
    timestamp: number;
    baseCurrency: string;
    xauOunce: number;         // XAu/USD
    xagOunce: number;
    // Priced in grams
    gold24k: number;          // 100%
    gold18k: number;          // 75%
    gold14k: number;          // 58.3%
    gold10k: number;          // 41.7%
    silver925: number;        // 92.5%
}

const TROY_OUNCE_TO_GRAMS = 31.1034768;

export const apiMetals = {
    /**
     * Fetch the latest spot prices securely through our Supabase Edge Function.
     * This bypasses all Frontend CORS restrictions and API Key exposure.
     */
    async getLatestPrices(): Promise<MetalsPricing> {
        let xauPrice = 4315.50; // Fallback offline mock price (per Ounce)
        let xagPrice = 52.30;   // Fallback offline mock price (per Ounce)

        try {
            // Call the secure Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('live-metals-pricing', {
                method: 'GET'
            });

            if (error) throw error;
            if (data) return data as MetalsPricing;
            
        } catch (error) {
            console.error("Error fetching metals from Edge Function:", error);
            console.log("Using fallback spot prices for demonstration.");
        }

        // 1 Troy Ounce = 31.1034768 grams
        const xauGram = xauPrice / TROY_OUNCE_TO_GRAMS;
        const xagGram = xagPrice / TROY_OUNCE_TO_GRAMS;

        return {
            timestamp: Date.now(),
            baseCurrency: 'USD',
            xauOunce: xauPrice,
            xagOunce: xagPrice,
            gold24k: xauGram,
            gold18k: xauGram * 0.75,
            gold14k: xauGram * 0.5833,
            gold10k: xauGram * 0.4167,
            silver925: xagGram * 0.925
        };
    }
};
