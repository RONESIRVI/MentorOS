@echo off
cd /d "%~dp0"
echo ====================================
echo Setting up New Website (MentorOS)
echo ====================================
git remote set-url origin https://github.com/RONESIRVI/MentorOS.git
git add .
git commit -m "Initial commit for new website"
git push -f -u origin main
echo.
echo ====================================
echo DONE! Code Uploaded Successfully.
echo ====================================
pause
