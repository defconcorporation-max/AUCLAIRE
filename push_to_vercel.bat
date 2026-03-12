@echo off
echo =======================================================
echo Auclaire APP - Envoi des mises a jour vers Vercel
echo =======================================================
echo.

cd /d "f:\Entreprises\Auclaire\Auclaire APP"

echo [1/3] Preparation des fichiers...
git add .

echo.
echo [2/3] Validation des changements...
git commit -m "feat: Luxury Admin Dashboard Redesign"

echo.
echo [3/3] Envoi vers GitHub et Vercel...
git push

echo.
echo =======================================================
echo Operation terminee ! Vercel devrait commencer le deploiement.
echo S'il y a une erreur ci-dessus (comme une demande de mot de passe GitHub),
echo veuillez suivre les instructions a l'ecran.
echo =======================================================
pause
