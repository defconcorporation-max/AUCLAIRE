@echo off
set "SUPABASE_URL=https://lytrifyjoevhgkgkzcul.supabase.co"
set "SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dHJpZnlqb2V2aGdrZ2t6Y3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDM3NDIsImV4cCI6MjA4NTAxOTc0Mn0.NxBhNpNl_Rziv022yPukbvPX304zQ3dEJS4jeCsCAIQ"
set "IMAGE_DIR=C:\Users\tour tako\.gemini\antigravity\brain\1321b80f-f4cb-412b-9ebb-3c2140249f12"

echo Starting population... > populate_batch.log

call :upload "category_engagement_rings_1773491761470.png" "bagues de fiançailles" "category"
call :upload "category_wedding_bands_alliances_1773491776382.png" "aliances" "category"
call :upload "category_earrings_boucles_d_oreilles_1773491789577.png" "Boucles d'Oreilles" "category"
call :upload "category_bracelets_tennis_1773491803952.png" "Bracelets" "category"
call :upload "category_pendants_necklaces_1773491816870.png" "Pendentifs" "category"
call :upload "cut_round_diamond_1773491830712.png" "round cut" "model"
call :upload "cut_oval_diamond_1773491843914.png" "oval cut" "model"
call :upload "cut_princess_diamond_1773491856621.png" "princess cut" "model"
call :upload "cut_radiant_diamond_1773491871188.png" "radiant cut" "model"
call :upload "cut_marquise_diamond_1773491885202.png" "marquise cut" "model"
call :upload "style_eternity_ring_1773491900640.png" "eternity" "style"
call :upload "style_plain_band_1773491913120.png" "plain" "style"

echo Done. >> populate_batch.log
goto :eof

:upload
set "FILE=%~1"
set "LABEL=%~2"
set "TYPE=%~3"
set "REMOTE=catalog/%random%_%FILE%"

echo Uploading %FILE%... >> populate_batch.log
curl -X POST "%SUPABASE_URL%/storage/v1/object/project-files/%REMOTE%" ^
     -H "Authorization: Bearer %SUPABASE_KEY%" ^
     -H "apikey: %SUPABASE_KEY%" ^
     -H "Content-Type: image/png" ^
     --data-binary "@%IMAGE_DIR%\%FILE%" >> populate_batch.log 2>&1

set "PUBLIC_URL=%SUPABASE_URL%/storage/v1/object/public/project-files/%REMOTE%"

echo Updating DB for %LABEL%... >> populate_batch.log
curl -X PATCH "%SUPABASE_URL%/rest/v1/catalog_tree?label=eq.%LABEL: =%%20%&type=eq.%TYPE%" ^
     -H "Authorization: Bearer %SUPABASE_KEY%" ^
     -H "apikey: %SUPABASE_KEY%" ^
     -H "Content-Type: application/json" ^
     -d "{\"image_url\": \"%PUBLIC_URL%\"}" >> populate_batch.log 2>&1
goto :eof
