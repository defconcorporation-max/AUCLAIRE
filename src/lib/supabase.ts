
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase URL or Anon Key. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

const rawSupabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

// Basic Rate Limiting Decorator
const rateLimit = {
    lastCall: 0,
    minInterval: 100, // 10 requests per second
    check() {
        const now = Date.now();
        if (now - this.lastCall < this.minInterval) {
            console.warn('API Rate Limit Warning: Throttling request');
            return false;
        }
        this.lastCall = now;
        return true;
    }
};

export const supabase = new Proxy(rawSupabase, {
    get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'function' && ['from', 'rpc', 'auth'].includes(prop as string)) {
            return (...args: any[]) => {
                rateLimit.check();
                return value.apply(target, args);
            };
        }
        return value;
    }
});
