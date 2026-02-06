@echo off
REM ============================================================================
REM Vivaldi Mods - JavaScript Mods Installer (Modular)
REM ============================================================================
REM This script installs JavaScript mods using the MODULAR approach:
REM   - Copies all JS files (preserving folder structure) to Vivaldi
REM   - Replaces window.html with our commented/configurable version
REM   - You can enable/disable mods by editing window.html (like core.css!)
REM
REM What it does:
REM   1. Backs up Vivaldi's original window.html
REM   2. Copies entire Javascripts/ folder to Vivaldi's resources/vivaldi/
REM   3. Copies our modular window.html (with comments for each mod)
REM   4. (Optional) Installs AutoHotkey watcher for auto-patching on updates
REM
REM Usage:
REM   install-js-mods.bat              - Normal install with watcher prompt
REM   install-js-mods.bat --silent     - Silent mode (no watcher prompt)
REM   install-js-mods.bat --ahk-path "C:\path\to\AutoHotkey"
REM                                    - Custom AHK scripts folder
REM
REM To customize which mods are enabled:
REM   1. Navigate to Vivaldi's resources/vivaldi/ folder
REM   2. Open window.html in a text editor
REM   3. Comment/uncomment <script> lines to disable/enable mods
REM   4. Restart Vivaldi
REM
REM NOTE: You'll need to re-run this after Vivaldi updates (or use the watcher)!
REM ============================================================================

setlocal EnableDelayedExpansion
cd "%~dp0"

REM === Parse arguments ===
set "SILENT_MODE=0"
set "AHK_PATH=%USERPROFILE%\Documents\AutoHotkey"

:parse_args
if "%~1"=="" goto :done_args
if /I "%~1"=="--silent" set "SILENT_MODE=1" & shift & goto :parse_args
if /I "%~1"=="-s" set "SILENT_MODE=1" & shift & goto :parse_args
if /I "%~1"=="--ahk-path" set "AHK_PATH=%~2" & shift & shift & goto :parse_args
shift
goto :parse_args
:done_args

echo.
echo ========================================
echo  Vivaldi Mods - JS Installer (Modular)
echo ========================================
echo.

REM === Get repo root (parent of scripts/) ===
set "REPO_ROOT=%~dp0.."
pushd "%REPO_ROOT%"
set "REPO_ROOT=%CD%"
popd

set "JS_FOLDER=%REPO_ROOT%\Javascripts"
set "WINDOW_HTML=%JS_FOLDER%\window.html"

REM === Verify Javascripts folder exists ===
if not exist "%JS_FOLDER%" (
    echo [X] ERROR: Javascripts folder not found at:
    echo     %JS_FOLDER%
    echo.
    echo     Make sure you're running this from the scripts/ folder
    echo     inside the revivarc-vivaldi repository.
    pause & exit /b 1
)

REM === Verify window.html template exists ===
if not exist "%WINDOW_HTML%" (
    echo [X] ERROR: Modular window.html not found at:
    echo     %WINDOW_HTML%
    echo.
    echo     This file should be in the Javascripts folder.
    pause & exit /b 1
)

echo [OK] Found Javascripts folder: %JS_FOLDER%
echo [OK] Found modular window.html template
echo.

REM === Find Vivaldi installation (get latest version) ===
set "VIVALDI_BASE=%LOCALAPPDATA%\Vivaldi\Application"
echo Searching for Vivaldi at: %VIVALDI_BASE%

REM Find the latest version folder by looking for window.html
set "VIVALDI_VERSION_DIR="
set "LATEST_VERSION="

for /f "tokens=*" %%d in ('dir /ad /b /o-n "%VIVALDI_BASE%" 2^>nul ^| findstr /r "^[0-9]"') do (
    if exist "%VIVALDI_BASE%\%%d\resources\vivaldi\window.html" (
        if not defined VIVALDI_VERSION_DIR (
            set "VIVALDI_VERSION_DIR=%VIVALDI_BASE%\%%d\resources\vivaldi\"
            set "LATEST_VERSION=%%d"
        )
    )
)

if "%VIVALDI_VERSION_DIR%"=="" (
    echo [X] ERROR: Vivaldi installation not found.
    echo     Is Vivaldi installed?
    pause & exit /b 1
)

echo [OK] Found Vivaldi %LATEST_VERSION%
echo     Location: %VIVALDI_VERSION_DIR%
echo.

REM === Check if Vivaldi is running ===
set "VIVALDI_RUNNING=0"
tasklist /FI "IMAGENAME eq vivaldi.exe" 2>nul | find /I "vivaldi.exe" >nul
if not errorlevel 1 (
    set "VIVALDI_RUNNING=1"
    echo [!] Vivaldi is currently running - will need restart after install.
    echo.
)

REM === Step 1: Backup window.html ===
echo [1/3] Creating backup...
if not exist "%VIVALDI_VERSION_DIR%window.bak.html" (
    copy "%VIVALDI_VERSION_DIR%window.html" "%VIVALDI_VERSION_DIR%window.bak.html" >nul
    echo     Created backup: window.bak.html
) else (
    echo     Backup already exists: window.bak.html
)
echo.

REM === Step 2: Copy JS files into javascript/ subfolder ===
echo [2/3] Copying JavaScript mods into javascript/ subfolder...
echo.

set "JS_DEST=%VIVALDI_VERSION_DIR%javascript"
if not exist "%JS_DEST%" mkdir "%JS_DEST%"

set "MOD_COUNT=0"
set "FOLDER_COUNT=0"

REM Copy root-level JS files into javascript/
echo     Copying root JS files...
for %%f in ("%JS_FOLDER%\*.js") do (
    copy /y "%%f" "%JS_DEST%\" >nul 2>&1
    if not errorlevel 1 (
        echo       + javascript/%%~nxf
        set /a MOD_COUNT+=1
    )
)

REM Copy subfolders into javascript/ (Tam710562, luetage, Other, PageAction, aminought)
for %%d in (Tam710562 luetage Other PageAction aminought) do (
    if exist "%JS_FOLDER%\%%d" (
        echo.
        echo     Copying %%d/ folder...

        if not exist "%JS_DEST%\%%d" mkdir "%JS_DEST%\%%d"
        set /a FOLDER_COUNT+=1

        for %%f in ("%JS_FOLDER%\%%d\*.js") do (
            copy /y "%%f" "%JS_DEST%\%%d\" >nul 2>&1
            if not errorlevel 1 (
                echo       + javascript/%%d/%%~nxf
                set /a MOD_COUNT+=1
            )
        )
    )
)

echo.
echo     Copied %MOD_COUNT% JS files into javascript/ (%FOLDER_COUNT% subfolders)
echo.

REM === Step 3: Copy modular window.html ===
echo [3/3] Installing modular window.html...

copy /y "%WINDOW_HTML%" "%VIVALDI_VERSION_DIR%window.html" >nul
if errorlevel 1 goto :patch_failed

REM === Validate installation ===
echo     Validating...

REM Check window.html exists and has our marker comment
findstr /C:"VIVALDI MODS - MASTER JS CONFIGURATION" "%VIVALDI_VERSION_DIR%window.html" >nul
if errorlevel 1 goto :patch_failed

REM Check a few key JS files exist in javascript/ subfolder
if not exist "%VIVALDI_VERSION_DIR%javascript\workspaceButtons.js" goto :patch_failed
if not exist "%VIVALDI_VERSION_DIR%javascript\tidyTabs.js" goto :patch_failed

echo     Validation passed.
echo.

echo ========================================
echo  JS Installation Complete! (Modular)
echo ========================================
echo.
echo  Installed %MOD_COUNT% JavaScript mods.
echo.
echo  Location: %VIVALDI_VERSION_DIR%
echo.
echo  +---------------------------------------------------------+
echo  ^|  HOW TO CUSTOMIZE:                                      ^|
echo  ^|                                                         ^|
echo  ^|  1. Open: %VIVALDI_VERSION_DIR%window.html
echo  ^|  2. Comment/uncomment ^<script^> lines to toggle mods   ^|
echo  ^|  3. Restart Vivaldi                                     ^|
echo  ^|                                                         ^|
echo  ^|  Example:                                                ^|
echo  ^|    Enabled:  ^<script src="tidyTabs.js"^>^</script^>       ^|
echo  ^|    Disabled: ^<!-- ^<script src="foo.js"^>^</script^> --^>  ^|
echo  +---------------------------------------------------------+
echo.

REM === Offer to install watcher (if not silent and AHK exists) ===
if "%SILENT_MODE%"=="1" goto :skip_watcher

set "WATCHER_SRC=%~dp0vivaldi-watcher.ahk"
set "WATCHER_DST=%AHK_PATH%\Vivaldi Watcher.ahk"

if not exist "%WATCHER_SRC%" goto :skip_watcher

REM Check if watcher already installed
if exist "%WATCHER_DST%" (
    echo  [i] Watcher already installed: %WATCHER_DST%
    echo.
    goto :after_watcher
)

REM Check if AHK folder exists
if not exist "%AHK_PATH%" (
    echo  [?] AutoHotkey folder not found: %AHK_PATH%
    echo      Use --ahk-path to specify a different location.
    echo.
    goto :skip_watcher
)

echo  Would you like to install the AutoHotkey watcher?
echo  This will auto-patch Vivaldi when it updates.
echo.
echo  Install location: %WATCHER_DST%
echo.
choice /C YN /M "Install watcher"
if errorlevel 2 goto :skip_watcher

copy "%WATCHER_SRC%" "%WATCHER_DST%" >nul
echo.
echo  [OK] Watcher installed: %WATCHER_DST%
echo.
echo  To enable auto-start:
echo    1. Press Win+R, type: shell:startup
echo    2. Create a shortcut to the watcher script
echo.
goto :after_watcher

:skip_watcher
if "%VIVALDI_RUNNING%"=="1" (
    echo  IMPORTANT: RESTART VIVALDI to apply changes!
    echo.
)
echo  NOTE: Re-run this script after Vivaldi updates!
echo.
echo  TIP: Install the AutoHotkey watcher to auto-patch on updates:
echo       run: install-js-mods.bat (without --silent)
echo.

:after_watcher
if "%VIVALDI_RUNNING%"=="1" (
    echo  *** REMINDER: RESTART VIVALDI NOW ***
    echo.
)
echo  To remove JS mods: run restore-vivaldi.bat
echo.
pause
goto :eof

REM ============================================================================
REM Error Handler: Auto-rollback on patch failure
REM ============================================================================
:patch_failed
echo.
echo [X] ERROR: Installation validation failed!
echo.
echo     Attempting automatic rollback...
echo.

if exist "%VIVALDI_VERSION_DIR%window.bak.html" (
    copy /y "%VIVALDI_VERSION_DIR%window.bak.html" "%VIVALDI_VERSION_DIR%window.html" >nul
    if errorlevel 1 (
        echo [X] CRITICAL: Rollback failed!
        echo     Please manually restore from: %VIVALDI_VERSION_DIR%window.bak.html
        echo     Or reinstall Vivaldi to fix.
    ) else (
        echo [OK] Rollback successful - original window.html restored.
    )
) else (
    echo [!] No backup found - cannot rollback automatically.
    echo     You may need to reinstall Vivaldi.
)

echo.
echo  Vivaldi should still work normally.
echo  Please report this issue if it persists.
echo.
pause
exit /b 1
