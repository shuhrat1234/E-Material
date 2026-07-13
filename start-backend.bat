@echo off
cd /d "%~dp0backend"
echo Starting E-Material backend on 0.0.0.0:8000 ...
python manage.py runserver 0.0.0.0:8000
pause
