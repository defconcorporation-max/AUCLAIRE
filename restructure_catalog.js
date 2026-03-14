
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function restructure() {
    console.log("Fetching root nodes...");
    const { data: roots, error: rootsError } = await supabase
        .from('catalog_tree')
        .select('id, label, type')
        .is('parent_id', null);

    if (rootsError) {
        console.error(rootsError);
        return;
    }

    console.log("Current roots:", roots.map(r => r.label));

    const jewelTypes = [
        { label: 'Bagues', types: ['bagues de fiançailles', 'aliances', 'bagues'] },
        { label: 'Boucles d\'Oreilles', types: ['boucles d\'oreilles'] },
        { label: 'Bracelets', types: ['bracelets'] },
        { label: 'Pendentifs', types: ['pendentifs'] }
    ];

    for (const jt of jewelTypes) {
        console.log(`Creating Jewel Type: ${jt.label}`);
        const { data: newJt, error: jtError } = await supabase
            .from('catalog_tree')
            .insert({
                label: jt.label,
                type: 'jewel_type',
                parent_id: null,
                sort_order: 0,
                specs: {}
            })
            .select()
            .single();

        if (jtError) {
            console.error(jtError);
            continue;
        }

        const nodesToMove = roots.filter(r => 
            jt.types.some(t => r.label.toLowerCase().includes(t.toLowerCase()))
        );

        for (const node of nodesToMove) {
            console.log(`Moving ${node.label} under ${jt.label}`);
            const { error: moveError } = await supabase
                .from('catalog_tree')
                .update({ parent_id: newJt.id })
                .eq('id', node.id);
            
            if (moveError) console.error(moveError);
        }
    }
    console.log("Restructuring complete.");
}

restructure();
