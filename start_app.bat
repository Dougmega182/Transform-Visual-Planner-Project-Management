@echo off
TITLE Transform Visual Planner - Development Server
cd /d "%~dp0"

echo.
echo  =========================================
echo    Transform Visual Planner
echo    Starting Development Server...
echo  =========================================
echo.

:: Try to open in Chrome specifically, fall back to default if not found
where chrome >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start chrome http://localhost:3004
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" http://localhost:3004
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" http://localhost:3004
) else (
    start http://localhost:3004
)

:: Start the Next.js development server
npm run dev

pause
