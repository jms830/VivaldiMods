@echo off
REM ============================================================================
REM Vivaldi Mods - Restore Original
REM ============================================================================
REM Restores Vivaldi's original window.html (removes JS mods)
REM CSS mods can be disabled in Vivaldi Settings or vivaldi://experiments
REM ============================================================================

cd "%~dp0"

echo.
echo ========================================
echo  Vivaldi Mods - Restore Original
echo ========================================
echo.

set installPath="%localappdata%\Vivaldi\Application\"
echo Searching for Vivaldi at: %installPath%

for /f "tokens=*" %%a in ('dir /a:-d /b /s %installPath%') do (
    if "%%~nxa"=="window.html" set latestVersionFolder=%%~dpa
)

if "%latestVersionFolder%"=="" (
    echo [X] ERROR: No window.html found. Is Vivaldi installed?
    pause & exit /b 1
)

echo Found Vivaldi at: %latestVersionFolder%
echo.

if not exist "%latestVersionFolder%\window.bak.html" (
    echo [!] No backup found (window.bak.html)
    echo     JS mods may not have been installed, or backup was removed.
    echo.
    echo     To fully reset, you can reinstall Vivaldi.
    pause & exit /b 1
)

echo Restoring original window.html from backup...
copy /y "%latestVersionFolder%\window.bak.html" "%latestVersionFolder%\window.html" >nul

if exist "%latestVersionFolder%\custom.js" (
    echo Removing custom.js...
    del "%latestVersionFolder%\custom.js"
)

echo.
echo ========================================
echo  Restore Complete!
echo ========================================
echo.
echo  JS mods have been removed.
echo.
echo  To also disable CSS mods:
echo  1. Open vivaldi://experiments
echo  2. Disable "Allow for using CSS modifications"
echo  3. Restart Vivaldi
echo.
echo  Restart Vivaldi to apply changes.
echo.
pause
