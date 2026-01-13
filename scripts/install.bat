@echo off
REM ============================================================================
REM Vivaldi Mods - CSS Installer
REM ============================================================================
REM This script configures Vivaldi to use the CSS mods from THIS repository.
REM No external downloads or cloning required.
REM
REM What it does:
REM   1. Enables CSS modifications in Vivaldi (via experiments flag)
REM   2. Sets Vivaldi's CSS path to this repo's CSS/ folder
REM
REM For JS mods, run install-js-mods.bat separately.
REM ============================================================================

setlocal EnableDelayedExpansion
cd "%~dp0"

echo.
echo ========================================
echo  Vivaldi Mods - CSS Installer
echo ========================================
echo.

REM === Get repo root (parent of scripts/) ===
set "REPO_ROOT=%~dp0.."
pushd "%REPO_ROOT%"
set "REPO_ROOT=%CD%"
popd

set "CSS_FOLDER=%REPO_ROOT%\CSS"
set "VIVALDI_PREFS=%LOCALAPPDATA%\Vivaldi\User Data\Default\Preferences"

REM === Verify CSS folder exists ===
if not exist "%CSS_FOLDER%\Core.css" (
    echo [X] ERROR: CSS folder not found at:
    echo     %CSS_FOLDER%
    echo.
    echo     Make sure you're running this from the scripts/ folder
    echo     inside the revivarc-vivaldi repository.
    pause & exit /b 1
)

echo [OK] Found CSS folder: %CSS_FOLDER%
echo.

REM === Check if Vivaldi is installed ===
set "VIVALDI_PATH=%LOCALAPPDATA%\Vivaldi\Application"
if not exist "%VIVALDI_PATH%" (
    echo [X] ERROR: Vivaldi not found at:
    echo     %VIVALDI_PATH%
    echo.
    echo     Please install Vivaldi first.
    pause & exit /b 1
)

echo [OK] Found Vivaldi installation
echo.

REM === Check if Vivaldi is running ===
tasklist /FI "IMAGENAME eq vivaldi.exe" 2>nul | find /I "vivaldi.exe" >nul
if not errorlevel 1 (
    echo [!] Vivaldi is currently running.
    echo     Please close Vivaldi, then press any key to continue...
    echo.
    pause >nul
)

REM === Update Vivaldi preferences ===
echo [1/2] Setting CSS mods directory in Vivaldi preferences...

if not exist "%VIVALDI_PREFS%" (
    echo [!] Vivaldi preferences file not found.
    echo     This might be a fresh install. Please:
    echo     1. Open Vivaldi once and close it
    echo     2. Run this script again
    echo.
    echo     Or set the path manually:
    echo     Settings ^> Appearance ^> Custom UI Modifications
    echo     Path: %CSS_FOLDER%
    pause & exit /b 1
)

REM Use PowerShell to update JSON preferences
set "CSS_PATH_ESCAPED=%CSS_FOLDER:\=\\%"

powershell -Command ^
    "$prefs = Get-Content '%VIVALDI_PREFS%' -Raw | ConvertFrom-Json; ^
    if (-not $prefs.vivaldi) { $prefs | Add-Member -NotePropertyName 'vivaldi' -NotePropertyValue @{} -Force }; ^
    if (-not $prefs.vivaldi.appearance) { $prefs.vivaldi | Add-Member -NotePropertyName 'appearance' -NotePropertyValue @{} -Force }; ^
    $prefs.vivaldi.appearance.css_ui_mods_directory = '%CSS_PATH_ESCAPED%'; ^
    $prefs | ConvertTo-Json -Depth 100 -Compress | Set-Content '%VIVALDI_PREFS%' -Encoding UTF8"

if errorlevel 1 (
    echo [X] Failed to update preferences automatically.
    echo.
    echo     Please set the CSS path manually:
    echo     1. Open Vivaldi Settings
    echo     2. Go to Appearance ^> Custom UI Modifications
    echo     3. Set path to: %CSS_FOLDER%
    pause & exit /b 1
)

echo     CSS path set to: %CSS_FOLDER%
echo.

REM === Remind about experiments flag ===
echo [2/2] Checking experiments flag...
echo.
echo     IMPORTANT: You must enable CSS modifications in Vivaldi:
echo.
echo     1. Open Vivaldi
echo     2. Go to: vivaldi://experiments
echo     3. Enable: "Allow for using CSS modifications"
echo     4. Restart Vivaldi
echo.

echo ========================================
echo  CSS Installation Complete!
echo ========================================
echo.
echo  CSS Folder: %CSS_FOLDER%
echo.
echo  Next steps:
echo  1. Enable CSS mods in vivaldi://experiments (if not already)
echo  2. Restart Vivaldi
echo  3. (Optional) Run install-js-mods.bat for JavaScript mods
echo.
echo  To customize which modules are enabled:
echo  - Edit CSS/Core.css directly, or
echo  - Use the configurator at https://jms830.github.io/VivaldiMods/
echo    and replace CSS/Core.css with the downloaded file
echo.
pause
