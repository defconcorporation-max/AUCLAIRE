import os
import shutil

src_dir = r"C:\Users\tour tako\.gemini\antigravity\brain\1321b80f-f4cb-412b-9ebb-3c2140249f12"
dest_dir = r"f:\Entreprises\Auclaire\Auclaire APP\public\images\catalog"

mappings = [
    ("category_engagement_rings_1773491761470.png", "engagement_rings.png"),
    ("category_wedding_bands_alliances_1773491776382.png", "wedding_bands.png"),
    ("category_earrings_boucles_d_oreilles_1773491789577.png", "earrings.png"),
    ("category_bracelets_tennis_1773491803952.png", "bracelets.png"),
    ("category_pendants_necklaces_1773491816870.png", "pendants.png"),
    ("cut_round_diamond_1773491830712.png", "round_cut.png"),
    ("cut_oval_diamond_1773491843914.png", "oval_cut.png"),
    ("cut_princess_diamond_1773491856621.png", "princess_cut.png"),
    ("cut_radiant_diamond_1773491871188.png", "radiant_cut.png"),
    ("cut_marquise_diamond_1773491885202.png", "marquise_cut.png"),
    ("style_eternity_ring_1773491900640.png", "eternity.png"),
    ("style_plain_band_1773491913120.png", "plain.png")
]

try:
    if not os.path.exists(dest_dir):
        print(f"Creating directory {dest_dir}")
        os.makedirs(dest_dir)
    else:
        print(f"Directory {dest_dir} already exists")

    for src_name, target in mappings:
        src_path = os.path.join(src_dir, src_name)
        if os.path.exists(src_path):
            shutil.copy2(src_path, os.path.join(dest_dir, target))
            print(f"Copied {src_name} to {target}")
        else:
            print(f"Source not found: {src_path}")
except Exception as e:
    print(f"An error occurred: {e}")
