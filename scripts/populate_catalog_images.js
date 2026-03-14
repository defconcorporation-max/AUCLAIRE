const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://lytrifyjoevhgkgkzcul.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dHJpZnlqb2V2aGdrZ2t6Y3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDM3NDIsImV4cCI6MjA4NTAxOTc0Mn0.NxBhNpNl_Rziv022yPukbvPX304zQ3dEJS4jeCsCAIQ';

const IMAGE_DIR = 'C:/Users/tour tako/.gemini/antigravity/brain/1321b80f-f4cb-412b-9ebb-3c2140249f12';

const mappings = [
    { label: 'bagues de fiançailles', type: 'category', local: 'category_engagement_rings_1773491761470.png' },
    { label: 'aliances', type: 'category', local: 'category_wedding_bands_alliances_1773491776382.png' },
    { label: "Boucles d'Oreilles", type: 'category', local: 'category_earrings_boucles_d_oreilles_1773491789577.png' },
    { label: 'Bracelets', type: 'category', local: 'category_bracelets_tennis_1773491803952.png' },
    { label: 'Pendentifs', type: 'category', local: 'category_pendants_necklaces_1773491816870.png' },
    { label: 'round cut', type: 'model', local: 'cut_round_diamond_1773491830712.png' },
    { label: 'oval cut', type: 'model', local: 'cut_oval_diamond_1773491843914.png' },
    { label: 'princess cut', type: 'model', local: 'cut_princess_diamond_1773491856621.png' },
    { label: 'radiant cut', type: 'model', local: 'cut_radiant_diamond_1773491871188.png' },
    { label: 'marquise cut', type: 'model', local: 'cut_marquise_diamond_1773491885202.png' },
    { label: 'eternity', type: 'style', local: 'style_eternity_ring_1773491900640.png' },
    { label: 'plain', type: 'style', local: 'style_plain_band_1773491913120.png' }
];

async function run() {
    for (const item of mappings) {
        const localPath = path.join(IMAGE_DIR, item.local);
        if (!fs.existsSync(localPath)) {
            console.error(`File not found: ${localPath}`);
            continue;
        }

        console.log(`Uploading ${item.local}...`);
        const content = fs.readFileSync(localPath);
        const remoteName = `catalog/${Date.now()}_${item.local}`;
        
        try {
            // 1. Upload to Storage
            const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/project-files/${remoteName}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'image/png'
                },
                body: content
            });

            if (!uploadRes.ok) {
                const err = await uploadRes.json();
                console.error(`Upload failed for ${item.local}:`, err);
                continue;
            }

            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/project-files/${remoteName}`;
            console.log(`  Uploaded! URL: ${publicUrl}`);

            // 2. Update Database
            // We use the REST API for simplicity in a standalone script
            const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/catalog_tree?label=eq.${encodeURIComponent(item.label)}&type=eq.${item.type}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ image_url: publicUrl })
            });

            if (!dbRes.ok) {
                const err = await dbRes.json();
                console.error(`  DB update failed for ${item.label}:`, err);
            } else {
                console.log(`  DB updated for ${item.label}`);
            }

        } catch (error) {
            console.error(`  Error processing ${item.local}:`, error);
        }
    }
}

run();
