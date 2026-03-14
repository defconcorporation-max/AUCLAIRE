import os
import glob
import shutil

src_dir = r"C:\Users\tour tako\.gemini\antigravity\brain\1321b80f-f4cb-412b-9ebb-3c2140249f12"
dest_dir = r"f:\Entreprises\Auclaire\Auclaire APP\public\images\catalog"

mappings = [
    ("cat_engagement_rings_local_", "engagement_rings.png"),
    ("cat_wedding_bands_local_2", "wedding_bands.png"),
    ("cat_earrings_local_2", "earrings.png"),
    ("cat_bracelets_local_2", "bracelets.png"),
    ("cat_pendants_local_2", "pendants.png"),
    ("cut_round_local_2", "round_cut.png"),
    ("cut_oval_local_2", "oval_cut.png"),
    ("cut_princess_local_2", "princess_cut.png"),
    ("cut_radiant_local_2", "radiant_cut.png"),
    ("cut_marquise_local_2", "marquise_cut.png"),
    ("style_eternity_local_2", "eternity.png"),
    ("style_plain_local_2", "plain.png")
]

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

for prefix, target in mappings:
    files = glob.glob(os.path.join(src_dir, f"{prefix}*.png"))
    if files:
        latest_file = max(files, key=os.path.getctime)
        shutil.copy(latest_file, os.path.join(dest_dir, target))
        print(f"Copied {os.path.basename(latest_file)} to {target}")
    else:
        print(f"No file found for prefix {prefix}")
