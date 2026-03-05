
import { createClient } from '@supabase/supabase-js';

const url = 'https://lytrifyjoevhgkgkzcul.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dHJpZnlqb2V2aGdrZ2t6Y3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDM3NDIsImV4cCI6MjA4NTAxOTc0Mn0.NxBhNpNl_Rziv022yPukbvPX304zQ3dEJS4jeCsCAIQ';
const supabase = createClient(url, key);

async function test() {
    console.log("Checking Projects count...");
    const { count: pc, error: pe } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    console.log("Projects Count:", pc, "Error:", pe?.message);

    console.log("Checking Expenses count...");
    const { count: ec, error: ee } = await supabase.from('expenses').select('*', { count: 'exact', head: true });
    console.log("Expenses Count:", ec, "Error:", ee?.message);

    console.log("Checking Profiles count...");
    const { count: prc, error: pre } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    console.log("Profiles Count:", prc, "Error:", pre?.message);
}

test();
