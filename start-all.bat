@echo off
echo Launching E-Material backend and frontend in separate windows...
start "E-Material Backend" cmd /k "%~dp0start-backend.bat"
start "E-Material Frontend" cmd /k "%~dp0start-frontend.bat"
