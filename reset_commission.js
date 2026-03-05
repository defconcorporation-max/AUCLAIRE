import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('f:/Entreprises/Auclaire/Auclaire APP/.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(url, key);

const kadId = 'af5d5e0a-7d38-439f-b244-bf3e2c638744';

async function reset() {
    // 1. Get all projects for affiliate Kad
    const { data: projects, error: pErr } = await supabase
        .from('projects')
        .select('id, title, financials, affiliate_id, client_id')
        .eq('affiliate_id', kadId);

    if (pErr) { console.error("Error fetching projects:", pErr.message); return; }

    console.log(`\n--- Projects linked to Kad (${projects?.length || 0} found) ---`);
    projects?.forEach(p => {
        const exported = p.financials?.commission_exported_to_expenses;
        console.log(`  [${p.id.slice(0, 8)}] "${p.title}" - commission_exported: ${exported}`);
    });

    // 2. Show current commission expenses
    const { data: expenses } = await supabase
        .from('expenses')
        .select('id, amount, description, status, project_id')
        .eq('recipient_id', kadId)
        .eq('category', 'commission');

    console.log(`\n--- Commission expenses for Kad (${expenses?.length || 0} found) ---`);
    expenses?.forEach(e => console.log(`  [${e.id.slice(0, 8)}] ${e.description} - $${e.amount} - ${e.status}`));

    // 3. Reset the commission_exported_to_expenses flag on all projects
    let resetCount = 0;
    for (const project of (projects || [])) {
        if (project.financials?.commission_exported_to_expenses) {
            const newFin = { ...project.financials, commission_exported_to_expenses: false };
            const { error } = await supabase.from('projects').update({ financials: newFin }).eq('id', project.id);
            if (error) console.error(`  ❌ Failed to reset "${project.title}":`, error.message);
            else { console.log(`  ✅ Reset flag for: "${project.title}"`); resetCount++; }
        }
    }

    // 4. Delete all commission expenses for Kad
    const { data: deleted, error: delErr } = await supabase
        .from('expenses')
        .delete()
        .eq('recipient_id', kadId)
        .eq('category', 'commission')
        .select();

    if (delErr) console.error("  ❌ Delete failed:", delErr.message);
    else console.log(`  🗑️  Deleted ${deleted?.length || 0} commission expense record(s)`);

    console.log(`\n✅ Reset complete: ${resetCount} project flag(s) cleared. Kad's commissions are now fully reset.`);
}

reset();
