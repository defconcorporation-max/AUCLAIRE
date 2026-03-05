import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('f:/Entreprises/Auclaire/Auclaire APP/.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(url, key);

const kadId = 'af5d5e0a-7d38-439f-b244-bf3e2c638744';

async function reset() {
    const { data: projects } = await supabase
        .from('projects')
        .select('id, title, financials')
        .eq('affiliate_id', kadId);

    for (const p of (projects || [])) {
        const newFin = { ...p.financials, commission_exported_to_expenses: false };
        const { error } = await supabase.from('projects').update({ financials: newFin }).eq('id', p.id);
        if (error) console.error(`Failed: ${p.title}`, error.message);
        else console.log(`✅ Flag reset for "${p.title}"`);
    }

    // Also delete any leftover commission expenses
    const { data: del } = await supabase.from('expenses').delete().eq('recipient_id', kadId).eq('category', 'commission').select();
    console.log(`🗑️ Deleted ${del?.length || 0} expense records`);
    console.log('\n✅ Done. Now run the SQL fix in Supabase, then test again.');
}

reset();
