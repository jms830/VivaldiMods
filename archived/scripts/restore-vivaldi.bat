@echo off
REM Restore original Vivaldi window.html (removes JS mods)

cd "%~dp0"

set installPath="%localappdata%\Vivaldi\Application\"
echo Searching for Vivaldi at: %installPath%

for /f "tokens=*" %%a in ('dir /a:-d /b /s %installPath%') do (
    if "%%~nxa"=="window.html" set latestVersionFolder=%%~dpa
)

if "%latestVersionFolder%"=="" (
    echo ERROR: No window.html found. Is Vivaldi installed?
    pause & exit /b 1
)

if not exist "%latestVersionFolder%\window.bak.html" (
    echo ERROR: No backup found. Nothing to restore.
    pause & exit /b 1
)

echo Restoring original window.html from backup...
copy /y "%latestVersionFolder%\window.bak.html" "%latestVersionFolder%\window.html"

if exist "%latestVersionFolder%\custom.js" (
    echo Removing custom.js...
    del "%latestVersionFolder%\custom.js"
)

echo.
echo Done! Vivaldi restored to original state.
echo Restart Vivaldi to apply changes.
pause
