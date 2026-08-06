@echo off
echo ====================================
echo Setting up New Website (MentorOS)
echo ====================================
git remote set-url origin https://github.com/RONESIRVI/MentorOS.git
git add .
git commit -m "Initial commit for new website"
git push -u origin main
echo.
echo ====================================
echo DONE! Code Uploaded Successfully.
echo ====================================
pause
