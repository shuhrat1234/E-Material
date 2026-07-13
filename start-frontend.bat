@echo off
cd /d "%~dp0frontend"
echo Starting E-Material frontend on 0.0.0.0:5173 ...
call npm run dev
pause
