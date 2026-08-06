@echo off
cd /d "%~dp0"
echo ====================================
echo  Snipping Tool Categories Updater
echo ====================================
echo.
python update_categories.py
echo.
pause
