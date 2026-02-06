@echo off
REM ============================================================================
REM Vivaldi Mods - Auto-Patch on Update
REM ============================================================================
REM This script checks if Vivaldi was updated and re-applies JS mods if needed.
REM 
REM How it works:
REM   1. Finds the latest Vivaldi version folder
REM   2. Checks if our modular JS mods already exist there
REM   3. If not, runs the JS installer
REM
REM Usage options:
REM   A) Run manually after Vivaldi updates
REM   B) Add to Windows startup (shell:startup)
REM   C) Use scheduled task (run setup-auto-patch.bat)
REM   D) Use AutoHotkey watcher (vivaldi-watcher.ahk) - RECOMMENDED
REM ============================================================================

setlocal EnableDelayedExpansion

REM === Configuration ===
set "REPO_ROOT=%~dp0.."
set "LOG_FILE=%TEMP%\vivaldi-mods-autopatch.log"
set "SILENT_MODE=0"

REM Check for silent flag
if "%1"=="-s" set "SILENT_MODE=1"
if "%1"=="--silent" set "SILENT_MODE=1"

REM === Find latest Vivaldi version ===
set "VIVALDI_PATH=%LOCALAPPDATA%\Vivaldi\Application"
set "LATEST_VERSION="
set "LATEST_DIR="

for /f "tokens=*" %%d in ('dir /ad /b /o-n "%VIVALDI_PATH%" 2^>nul ^| findstr /r "^[0-9]"') do (
    if exist "%VIVALDI_PATH%\%%d\resources\vivaldi\window.html" (
        if not defined LATEST_DIR (
            set "LATEST_VERSION=%%d"
            set "LATEST_DIR=%VIVALDI_PATH%\%%d\resources\vivaldi"
        )
    )
)

if "%LATEST_DIR%"=="" (
    echo [%DATE% %TIME%] ERROR: No Vivaldi installation found >> "%LOG_FILE%"
    if "%SILENT_MODE%"=="0" (
        echo [X] ERROR: No Vivaldi installation found
        pause
    )
    exit /b 1
)

REM === Check if already patched ===
REM Check for modular approach (our marker in window.html) OR old bundled approach (custom.js)
set "IS_PATCHED=0"

REM Check for modular marker in window.html
findstr /C:"VIVALDI MODS - MASTER JS CONFIGURATION" "%LATEST_DIR%\window.html" >nul 2>&1
if not errorlevel 1 set "IS_PATCHED=1"

REM Also check for old bundled approach
if exist "%LATEST_DIR%\custom.js" set "IS_PATCHED=1"

if "%IS_PATCHED%"=="1" (
    REM Already patched, nothing to do
    echo [%DATE% %TIME%] Version %LATEST_VERSION% already patched >> "%LOG_FILE%"
    if "%SILENT_MODE%"=="0" (
        echo Vivaldi %LATEST_VERSION% is already patched with JS mods.
        echo.
        echo To force re-apply, run install-js-mods.bat directly.
        pause
    )
    exit /b 0
)

REM === Not patched - apply mods ===
echo [%DATE% %TIME%] New Vivaldi version detected: %LATEST_VERSION% >> "%LOG_FILE%"
echo [%DATE% %TIME%] Applying JS mods... >> "%LOG_FILE%"

if "%SILENT_MODE%"=="0" (
    echo.
    echo ========================================
    echo  New Vivaldi Version Detected!
    echo ========================================
    echo.
    echo Version: %LATEST_VERSION%
    echo Path: %LATEST_DIR%
    echo.
    echo Applying JS mods...
    echo.
)

REM Run the installer (it will find the latest version automatically)
pushd "%~dp0"
if "%SILENT_MODE%"=="1" (
    call install-js-mods.bat --silent
) else (
    call install-js-mods.bat
)
popd

echo [%DATE% %TIME%] JS mods applied successfully >> "%LOG_FILE%"

REM Show notification for silent mode
if "%SILENT_MODE%"=="1" (
    powershell -Command "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('Vivaldi was updated to %LATEST_VERSION%.`n`nJS mods have been re-applied.`nPlease restart Vivaldi.', 'Vivaldi Mods', 'OK', 'Information')" >nul 2>&1
)
