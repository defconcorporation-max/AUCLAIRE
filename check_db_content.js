import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Manually load env vars since we are running with node
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://loremipsum.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// We need to read the actual .env file or hardcode if we can't
// I'll try to read the .env file content first using fs, but since I can't in this environment seamlessly without tool, 
// I will rely on the user having these in their environment OR I will cheat and read the .env file in the next step if this fails.
// Actually, I can just read the file content in the tool before writing this script? 
// No, I'll assume standard vite conventions. I'll read the .env file from the code to be sure.

console.log("Reading DB...");

async function run() {
    // Hack to read env vars from file since process.env might not be populated in this shell context
    const fs = await import('fs');
    const path = await import('path');

    let url = '';
    let key = '';

    try {
        const envPath = path.resolve('f:/Entreprises/Auclaire/Auclaire APP/.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            for (const line of envConfig.split('\n')) {
                const [k, v] = line.split('=');
                if (k && v) {
                    if (k.trim() === 'VITE_SUPABASE_URL') url = v.trim();
                    if (k.trim() === 'VITE_SUPABASE_ANON_KEY') key = v.trim();
                }
            }
        }
    } catch (e) {
        console.error("Could not read .env", e);
    }

    if (!url || !key) {
        console.error("Missing Creds. URL:", url ? "OK" : "MISSING", "Key:", key ? "OK" : "MISSING");
        return;
    }

    const supabase = createClient(url, key);

    const { data: clients, error: cErr } = await supabase.from('clients').select('*');
    if (cErr) console.error("Clients Error:", cErr);
    else {
        console.log(`\n--- Found ${clients.length} Clients ---`);
        clients.forEach(c => console.log(`[${c.id}] ${c.full_name} (${c.email})`));
    }

    const { data: projects, error: pErr } = await supabase.from('projects').select('*');
    if (pErr) console.error("Projects Error:", pErr);
    else {
        console.log(`\n--- Found ${projects.length} Projects ---`);
        projects.forEach(p => console.log(`[${p.id}] '${p.title}' (Client: ${p.client_id}) Status: ${p.status}`));
    }

    // Check if mapping would work
    // Mock ID '1' -> Test Client
    const testClient = clients?.find(c => c.full_name?.toLowerCase().includes('test'));
    if (testClient) {
        console.log(`\nPotential Match for Mock Client '1': ${testClient.id}`);
    } else {
        console.log("\nNo 'Test Client' found to map Mock ID '1' to.");
    }

}

run();
