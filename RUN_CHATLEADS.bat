@echo off
title ChatLeads AI - Launcher
color 0D

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

set "BACKEND=%ROOT%\backend"
set "WHATSAPP=%ROOT%\services\whatsapp"
set "FRONTEND=%ROOT%\frontend"
set "PYTHON=C:\Users\laksh\AppData\Local\Python\pythoncore-3.14-64\python.exe"

echo.
echo  ============================================================
echo      ChatLeads AI - Full Stack Local Launcher
echo  ============================================================
echo.

echo  [1/3]  Starting Backend on http://localhost:8000 ...
start "ChatLeads Backend" /d "%BACKEND%" cmd /k "set PYTHONUTF8=1&& %PYTHON% -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 5 /nobreak >nul

echo  [2/3]  Starting WhatsApp Bridge on http://localhost:8001 ...
start "ChatLeads WhatsApp" /d "%WHATSAPP%" cmd /k "npm start"

echo  [3/3]  Starting Frontend on http://localhost:3000 ...
start "ChatLeads Frontend" /d "%FRONTEND%" cmd /k "npm run dev"

echo.
echo  ============================================================
echo   All services launched!
echo.
echo   Frontend  :  http://localhost:3000
echo   Backend   :  http://localhost:8000/docs
echo.
echo   Super Admin Login:
echo     Click "Access the Console" on http://localhost:3000
echo     Email   : admin@chatleads.ai
echo     Password: Lakshay@123
echo  ============================================================
echo.
pause
