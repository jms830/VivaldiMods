@echo off
REM ============================================================================
REM Vivaldi Mods - Setup Auto-Patch on Login
REM ============================================================================
REM This script creates a scheduled task that runs auto-patch-vivaldi.bat
REM every time you log in. This ensures JS mods persist through Vivaldi updates.
REM
REM Run this ONCE to set up automatic patching.
REM ============================================================================

setlocal EnableDelayedExpansion

echo.
echo ========================================
echo  Vivaldi Mods - Setup Auto-Patch
echo ========================================
echo.

set "SCRIPT_PATH=%~dp0auto-patch-vivaldi.bat"

REM Check if script exists
if not exist "%SCRIPT_PATH%" (
    echo [X] ERROR: auto-patch-vivaldi.bat not found
    echo     Expected: %SCRIPT_PATH%
    pause & exit /b 1
)

echo This will create a scheduled task that runs on login to
echo automatically re-apply JS mods after Vivaldi updates.
echo.
echo Script: %SCRIPT_PATH%
echo.

choice /C YN /M "Create scheduled task"
if errorlevel 2 goto :cancelled

REM Create scheduled task
echo.
echo Creating scheduled task...

schtasks /create /tn "Vivaldi Mods Auto-Patch" ^
    /tr "\"%SCRIPT_PATH%\"" ^
    /sc onlogon ^
    /rl limited ^
    /f >nul 2>&1

if errorlevel 1 (
    echo [X] Failed to create scheduled task.
    echo     Try running this script as Administrator.
    pause & exit /b 1
)

echo [OK] Scheduled task created: "Vivaldi Mods Auto-Patch"
echo.
echo The task will run every time you log in and check if
echo Vivaldi was updated. If so, it will re-apply JS mods.
echo.
echo To remove: schtasks /delete /tn "Vivaldi Mods Auto-Patch" /f
echo.
pause
exit /b 0

:cancelled
echo.
echo Cancelled.
pause
exit /b 0
