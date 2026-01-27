import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Read .env manually to get credentials
let SUPABASE_URL = '';
let SUPABASE_KEY = '';

try {
    const envPath = path.resolve(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valParts] = line.split('=');
        if (!key) return;
        const val = valParts.join('=').trim();
        if (key.trim() === 'VITE_SUPABASE_URL') SUPABASE_URL = val;
        if (key.trim() === 'VITE_SUPABASE_ANON_KEY') SUPABASE_KEY = val;
    });
} catch (e) {
    console.error("Error reading .env:", e.message);
    process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase Credentials in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function restoreData() {
    console.log("Starting Manual Data Restoration...");

    // --- CLIENT ---
    console.log("Restoring Client...");
    let clientId = null;
    const clientData = {
        full_name: 'Test Client',
        email: 'client@test.com',
        phone: '555-0123',
        notes: 'Restored via Admin Script',
        created_at: new Date().toISOString()
    };

    // Check existing
    const { data: existingClient } = await supabase.from('clients').select('id').eq('email', clientData.email).maybeSingle();
    if (existingClient) {
        console.log(`Found existing client: ${existingClient.id}`);
        clientId = existingClient.id;
    } else {
        const { data: newClient, error } = await supabase.from('clients').insert(clientData).select().single();
        if (error) {
            console.error("Failed to create client:", error);
            return;
        }
        console.log(`Created new client: ${newClient.id}`);
        clientId = newClient.id;
    }

    // --- PROJECT ---
    console.log("Restoring Project...");
    let projectId = null;
    const projectData = {
        title: 'Test Project - Solitaire Ring',
        client_id: clientId,
        status: 'designing',
        budget: 5000,
        deadline: '2024-12-31',
        description: 'A beautiful solitaire ring design.',
        created_at: new Date().toISOString()
    };

    // Check existing project
    const { data: existingProject } = await supabase.from('projects').select('id')
        .eq('client_id', clientId)
        .eq('title', projectData.title)
        .maybeSingle();

    if (existingProject) {
        console.log(`Found existing project: ${existingProject.id}`);
        projectId = existingProject.id;
    } else {
        const { data: newProject, error } = await supabase.from('projects').insert(projectData).select().single();
        if (error) {
            console.error("Failed to create project:", error);
            return;
        }
        console.log(`Created new project: ${newProject.id}`);
        projectId = newProject.id;
    }

    // --- INVOICE ---
    console.log("Restoring Invoice...");
    const invoiceData = {
        project_id: projectId,
        amount: 1500,
        amount_paid: 0,
        status: 'draft',
        due_date: '2024-12-31',
        created_at: new Date().toISOString()
    };

    // Check existing invoice
    const { data: existingInvoice } = await supabase.from('invoices').select('id')
        .eq('project_id', projectId)
        .eq('amount', invoiceData.amount)
        .maybeSingle();

    if (existingInvoice) {
        console.log(`Found existing invoice: ${existingInvoice.id}`);
    } else {
        const { error } = await supabase.from('invoices').insert(invoiceData);
        if (error) console.error("Failed to create invoice:", error);
        else console.log("Created/Restored Invoice.");
    }

    console.log("\n--- RESTORE COMPLETE ---");
    console.log("Please refresh your application dashboard.");
}

restoreData();
