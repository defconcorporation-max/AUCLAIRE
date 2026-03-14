@echo off
set "SRC=C:\Users\tour tako\.gemini\antigravity\brain\1321b80f-f4cb-412b-9ebb-3c2140249f12"
set "DEST=f:\Entreprises\Auclaire\Auclaire APP\public\images\catalog"

mkdir "%DEST%" 2>nul

copy /Y "%SRC%\category_engagement_rings_1773491761470.png" "%DEST%\engagement_rings.png"
copy /Y "%SRC%\category_wedding_bands_alliances_1773491776382.png" "%DEST%\wedding_bands.png"
copy /Y "%SRC%\category_earrings_boucles_d_oreilles_1773491789577.png" "%DEST%\earrings.png"
copy /Y "%SRC%\category_bracelets_tennis_1773491803952.png" "%DEST%\bracelets.png"
copy /Y "%SRC%\category_pendants_necklaces_1773491816870.png" "%DEST%\pendants.png"
copy /Y "%SRC%\cut_round_diamond_1773491830712.png" "%DEST%\round_cut.png"
copy /Y "%SRC%\cut_oval_diamond_1773491843914.png" "%DEST%\oval_cut.png"
copy /Y "%SRC%\cut_princess_diamond_1773491856621.png" "%DEST%\princess_cut.png"
copy /Y "%SRC%\cut_radiant_diamond_1773491871188.png" "%DEST%\radiant_cut.png"
copy /Y "%SRC%\cut_marquise_diamond_1773491885202.png" "%DEST%\marquise_cut.png"
copy /Y "%SRC%\style_eternity_ring_1773491900640.png" "%DEST%\eternity.png"
copy /Y "%SRC%\style_plain_band_1773491913120.png" "%DEST%\plain.png"

echo Copy completed. > f:\Entreprises\Auclaire\Auclaire APP\final_copy_log.txt
dir "%DEST%" >> f:\Entreprises\Auclaire\Auclaire APP\final_copy_log.txt
