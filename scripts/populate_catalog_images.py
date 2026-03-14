import os
import time
import json
import urllib.request
import urllib.parse

SUPABASE_URL = 'https://lytrifyjoevhgkgkzcul.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dHJpZnlqb2V2aGdrZ2t6Y3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDM3NDIsImV4cCI6MjA4NTAxOTc0Mn0.NxBhNpNl_Rziv022yPukbvPX304zQ3dEJS4jeCsCAIQ'

IMAGE_DIR = 'C:/Users/tour tako/.gemini/antigravity/brain/1321b80f-f4cb-412b-9ebb-3c2140249f12'

mappings = [
    { 'label': 'bagues de fiançailles', 'type': 'category', 'local': 'category_engagement_rings_1773491761470.png' },
    { 'label': 'aliances', 'type': 'category', 'local': 'category_wedding_bands_alliances_1773491776382.png' },
    { 'label': "Boucles d'Oreilles", 'type': 'category', 'local': 'category_earrings_boucles_d_oreilles_1773491789577.png' },
    { 'label': 'Bracelets', 'type': 'category', 'local': 'category_bracelets_tennis_1773491803952.png' },
    { 'label': 'Pendentifs', 'type': 'category', 'local': 'category_pendants_necklaces_1773491816870.png' },
    { 'label': 'round cut', 'type': 'model', 'local': 'cut_round_diamond_1773491830712.png' },
    { 'label': 'oval cut', 'type': 'model', 'local': 'cut_oval_diamond_1773491843914.png' },
    { 'label': 'princess cut', 'type': 'model', 'local': 'cut_princess_diamond_1773491856621.png' },
    { 'label': 'radiant cut', 'type': 'model', 'local': 'cut_radiant_diamond_1773491871188.png' },
    { 'label': 'marquise cut', 'type': 'model', 'local': 'cut_marquise_diamond_1773491885202.png' },
    { 'label': 'eternity', 'type': 'style', 'local': 'style_eternity_ring_1773491900640.png' },
    { 'label': 'plain', 'type': 'style', 'local': 'style_plain_band_1773491913120.png' }
]

def run():
    for item in mappings:
        local_path = os.path.join(IMAGE_DIR, item['local'])
        if not os.path.exists(local_path):
            print(f"File not found: {local_path}")
            continue

        print(f"Uploading {item['local']}...")
        with open(local_path, 'rb') as f:
            content = f.read()

        remote_name = f"catalog/{int(time.time() * 1000)}_{item['local']}"
        
        try:
            # 1. Upload to Storage
            upload_url = f"{SUPABASE_URL}/storage/v1/object/project-files/{remote_name}"
            req = urllib.request.Request(upload_url, data=content, method='POST')
            req.add_header('Authorization', f'Bearer {SUPABASE_KEY}')
            req.add_header('apikey', SUPABASE_KEY)
            req.add_header('Content-Type', 'image/png')
            
            with urllib.request.urlopen(req) as response:
                if response.status not in (200, 201):
                    print(f"  Upload failed for {item['local']}: {response.status}")
                    continue

            public_url = f"{SUPABASE_URL}/storage/v1/object/public/project-files/{remote_name}"
            print(f"  Uploaded! URL: {public_url}")

            # 2. Update Database
            query_params = urllib.parse.urlencode({
                'label': f"eq.{item['label']}",
                'type': f"eq.{item['type']}"
            })
            db_url = f"{SUPABASE_URL}/rest/v1/catalog_tree?{query_params}"
            patch_data = json.dumps({'image_url': public_url}).encode('utf-8')
            
            db_req = urllib.request.Request(db_url, data=patch_data, method='PATCH')
            db_req.add_header('Authorization', f'Bearer {SUPABASE_KEY}')
            db_req.add_header('apikey', SUPABASE_KEY)
            db_req.add_header('Content-Type', 'application/json')
            db_req.add_header('Prefer', 'return=representation')

            with urllib.request.urlopen(db_req) as db_response:
                if db_response.status not in (200, 204):
                    print(f"  DB update failed for {item['label']}: {db_response.status}")
                else:
                    print(f"  DB updated for {item['label']}")

        except Exception as e:
            print(f"  Error processing {item['local']}: {e}")

if __name__ == "__main__":
    run()
