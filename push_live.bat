@echo off
echo ==============================================
echo Pushing Updates to GitHub (RONE MentorOS)
echo ==============================================
git add .
git commit -m "Content Update"
git push
echo ==============================================
echo Successfully pushed to Live!
echo ==============================================
pause
