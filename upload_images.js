const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://lytrifyjoevhgkgkzcul.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dHJpZnlqb2V2aGdrZ2t6Y3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDM3NDIsImV4cCI6MjA4NTAxOTc0Mn0.NxBhNpNl_Rziv022yPukbvPX304zQ3dEJS4jeCsCAIQ';

const images = [
    { local: 'C:/Users/tour tako/.gemini/antigravity/brain/6a0d5e01-3226-4ef6-8c1a-33a772cf644a/round_cut_diamond_1773449627479.png', remote: 'catalog/round_cut_diamond_1773449627479.png' },
    { local: 'C:/Users/tour tako/.gemini/antigravity/brain/6a0d5e01-3226-4ef6-8c1a-33a772cf644a/oval_cut_diamond_1773449643503.png', remote: 'catalog/oval_cut_diamond_1773449643503.png' },
    { local: 'C:/Users/tour tako/.gemini/antigravity/brain/6a0d5e01-3226-4ef6-8c1a-33a772cf644a/princess_cut_diamond_1773449660297.png', remote: 'catalog/princess_cut_diamond_1773449660297.png' },
    { local: 'C:/Users/tour tako/.gemini/antigravity/brain/6a0d5e01-3226-4ef6-8c1a-33a772cf644a/radiant_cut_diamond_1773449673717.png', remote: 'catalog/radiant_cut_diamond_1773449673717.png' },
    { local: 'C:/Users/tour tako/.gemini/antigravity/brain/6a0d5e01-3226-4ef6-8c1a-33a772cf644a/eternity_ring_style_1773449692274.png', remote: 'catalog/eternity_ring_style_1773449692274.png' },
    { local: 'C:/Users/tour tako/.gemini/antigravity/brain/6a0d5e01-3226-4ef6-8c1a-33a772cf644a/half_eternity_ring_style_1773449706328.png', remote: 'catalog/half_eternity_ring_style_1773449706328.png' },
    { local: 'C:/Users/tour tako/.gemini/antigravity/brain/6a0d5e01-3226-4ef6-8c1a-33a772cf644a/plain_ring_style_1773449718532.png', remote: 'catalog/plain_ring_style_1773449718532.png' }
];

async function uploadFiles() {
    for (const img of images) {
        console.log(`Uploading ${img.local} to ${img.remote}...`);
        try {
            const content = fs.readFileSync(img.local);
            const response = await fetch(`${SUPABASE_URL}/storage/v1/object/project-files/${img.remote}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'image/png'
                },
                body: content
            });
            const data = await response.json();
            console.log(`Result for ${img.remote}:`, data);
        } catch (error) {
            console.error(`Error uploading ${img.remote}:`, error);
        }
    }
}

uploadFiles();
