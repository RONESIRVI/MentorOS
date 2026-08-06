@echo off
echo Running Categories Update...
python update_categories.py
echo.
echo Running Resources Update...
python update_resources.py
echo.
pause
