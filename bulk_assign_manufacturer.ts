import { createClient } from '@supabase/supabase-js';

// Using service role key would be needed for ALTER TABLE, but with anon key we can try
// The migration needs to be run manually in Supabase Dashboard SQL editor
// This script just does the bulk assign after the column exists

const supabase = createClient(
    'https://lytrifyjoevhgkgkzcul.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dHJpZnlqb2V2aGdrZ2t6Y3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDM3NDIsImV4cCI6MjA4NTAxOTc0Mn0.NxBhNpNl_Rziv022yPukbvPX304zQ3dEJS4jeCsCAIQ'
);

async function run() {
    const manufacturer = { id: '47f46051-3404-4793-9864-99f9e27745b6', full_name: 'Ruchita Export' };
    console.log(`Assigning all projects to: ${manufacturer.full_name}`);

    // Get all project IDs
    const { data: projects, error: fetchErr } = await supabase
        .from('projects')
        .select('id, title');

    if (fetchErr) {
        console.error('Fetch error:', fetchErr.message);
        return;
    }

    console.log(`Found ${projects?.length} projects. Updating...`);

    // Update all projects
    const { data, error } = await supabase
        .from('projects')
        .update({ manufacturer_id: manufacturer.id })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    if (error) {
        console.error('Update error:', error.message);
        console.log('\n⚠️  You need to run this SQL in Supabase dashboard first:');
        console.log('ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS manufacturer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;');
        console.log('CREATE INDEX IF NOT EXISTS idx_projects_manufacturer_id ON public.projects(manufacturer_id);');
    } else {
        console.log(`✅ All projects assigned to ${manufacturer.full_name}!`);
    }
}

run().catch(console.error);
