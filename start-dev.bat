@echo off
REM Start Gilabun dev server - adds Node to PATH then runs npm run dev
set "NODE_DIR=C:\Program Files\nodejs"
if not exist "%NODE_DIR%\node.exe" (
  echo Node.js not found at %NODE_DIR%
  echo Install Node.js from https://nodejs.org and run this again.
  pause
  exit /b 1
)
set "PATH=%NODE_DIR%;%PATH%"
cd /d "%~dp0"

echo Starting dev server...
echo Open http://localhost:3000 in your browser when ready.
echo Press Ctrl+C to stop.
echo.
npm run dev
pause
