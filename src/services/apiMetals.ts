// src/services/apiMetals.ts

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
     * Fetch the latest spot prices for Gold (XAU) and Silver (XAG).
     * If no API key is set, it will return fallback/mock data for demonstration so the UI doesn't crash.
     */
    async getLatestPrices(): Promise<MetalsPricing> {
        // You can replace this endpoint with your chosen provider (e.g., goldapi.io, metals-api.com)
        const API_KEY = import.meta.env.VITE_METALS_API_KEY; 
        
        let xauPrice = 4315.50; // Fallback offline mock price (per Ounce)
        let xagPrice = 52.30;   // Fallback offline mock price (per Ounce)

        try {
            if (API_KEY) {
                // Example using a generic metals API structure. 
                // Swap the URL and Headers based on your actual provider.
                const response = await fetch('https://api.metals.dev/v1/latest?currency=USD&precious=true', {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data?.metals?.XAU) xauPrice = data.metals.XAU;
                    if (data?.metals?.XAG) xagPrice = data.metals.XAG;
                } else {
                    console.warn("Metals API failed, using fallback prices. Status:", response.status);
                }
            } else {
                console.log("No VITE_METALS_API_KEY found. Using fallback spot prices for demonstration.");
            }
        } catch (error) {
            console.error("Error fetching metals API:", error);
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
