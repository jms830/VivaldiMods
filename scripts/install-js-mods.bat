@echo off
REM ============================================================================
REM Vivaldi Mods - JavaScript Mods Installer (Persistent Architecture)
REM ============================================================================
REM This script installs JavaScript mods using the PERSISTENT approach:
REM   - JS files go to Application\javascript\ (survives Vivaldi updates!)
REM   - ONE line is injected into Vivaldi's stock window.html to load custom.js
REM   - custom.js dynamically loads all individual mods
REM
REM Architecture:
REM   Application\
REM   +-- javascript\               <-- JS mods live here (PERSISTENT)
REM   |   +-- custom.js             <-- Loader (configure mods here)
REM   |   +-- workspaceButtons.js
REM   |   +-- Tam710562\
REM   |   +-- ...
REM   +-- 7.x.xxxx.x\
REM       +-- resources\vivaldi\
REM           +-- window.html       <-- ONE line injected before </body>
REM
REM What it does:
REM   1. Backs up Vivaldi's original window.html
REM   2. Copies JS files + custom.js to Application\javascript\ (persistent)
REM   3. Injects one script tag into Vivaldi's window.html
REM   4. (Optional) Installs AutoHotkey watcher for auto-patching on updates
REM
REM Usage:
REM   install-js-mods.bat              - Normal install with watcher prompt
REM   install-js-mods.bat --silent     - Silent mode (no watcher prompt)
REM   install-js-mods.bat --ahk-path "C:\path\to\AutoHotkey"
REM                                    - Custom AHK scripts folder
REM
REM To customize which mods are enabled:
REM   1. Open Application\javascript\custom.js
REM   2. Comment/uncomment lines in the mods array
REM   3. Restart Vivaldi
REM
REM NOTE: After Vivaldi updates, only the one-liner injection is needed!
REM       JS files + custom.js in Application\javascript\ persist automatically.
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
echo =============================================
echo  Vivaldi Mods - JS Installer (Persistent)
echo =============================================
echo.

REM === Get repo root (parent of scripts/) ===
set "REPO_ROOT=%~dp0.."
pushd "%REPO_ROOT%"
set "REPO_ROOT=%CD%"
popd

set "JS_FOLDER=%REPO_ROOT%\Javascripts"

REM === Verify Javascripts folder exists ===
if not exist "%JS_FOLDER%" (
    echo [X] ERROR: Javascripts folder not found at:
    echo     %JS_FOLDER%
    echo.
    echo     Make sure you're running this from the scripts/ folder
    echo     inside the revivarc-vivaldi repository.
    pause & exit /b 1
)

if not exist "%JS_FOLDER%\custom.js" (
    echo [X] ERROR: custom.js not found at:
    echo     %JS_FOLDER%\custom.js
    echo.
    echo     This is the mod loader. It should be in the Javascripts folder.
    pause & exit /b 1
)

echo [OK] Found Javascripts folder: %JS_FOLDER%
echo [OK] Found custom.js loader
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
echo     Versioned dir: %VIVALDI_VERSION_DIR%
echo     Persistent JS: %VIVALDI_BASE%\javascript\
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

REM === Step 2: Copy JS files to PERSISTENT Application\javascript\ ===
echo [2/3] Copying JavaScript mods to persistent location...
echo     Target: %VIVALDI_BASE%\javascript\
echo.

set "JS_DEST=%VIVALDI_BASE%\javascript"
if not exist "%JS_DEST%" mkdir "%JS_DEST%"

set "MOD_COUNT=0"
set "FOLDER_COUNT=0"

REM Copy root-level JS files (including custom.js loader)
echo     Copying root JS files...
for %%f in ("%JS_FOLDER%\*.js") do (
    copy /y "%%f" "%JS_DEST%\" >nul 2>&1
    if not errorlevel 1 (
        echo       + javascript/%%~nxf
        set /a MOD_COUNT+=1
    )
)

REM Copy subfolders (Tam710562, luetage, Other, PageAction, aminought)
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
echo     Copied %MOD_COUNT% JS files to persistent location (%FOLDER_COUNT% subfolders)
echo.

REM === Step 3: Inject one-liner into Vivaldi's window.html ===
echo [3/3] Injecting custom.js loader into window.html...

set "INJECT_LINE=^<script src="../../../javascript/custom.js"^>^</script^>"
set "WINDOW_TARGET=%VIVALDI_VERSION_DIR%window.html"

REM Check if already injected
findstr /C:"custom.js" "%WINDOW_TARGET%" >nul 2>&1
if not errorlevel 1 (
    echo     custom.js reference already present in window.html
    echo.
    goto :validate
)

REM Inject the script tag before </body> using PowerShell
powershell -Command "(Get-Content '%WINDOW_TARGET%') -replace '</body>', '<script src=\"../../../javascript/custom.js\"></script>`r`n</body>' | Set-Content '%WINDOW_TARGET%'" 2>nul
if errorlevel 1 goto :patch_failed

echo     Injected: ^<script src="../../../javascript/custom.js"^>^</script^>
echo.

:validate
REM === Validate installation ===
echo     Validating...

REM Check window.html has our custom.js reference
findstr /C:"custom.js" "%WINDOW_TARGET%" >nul
if errorlevel 1 goto :patch_failed

REM Check key JS files exist in PERSISTENT location
if not exist "%VIVALDI_BASE%\javascript\custom.js" goto :patch_failed
if not exist "%VIVALDI_BASE%\javascript\workspaceButtons.js" goto :patch_failed

echo     Validation passed.
echo.

REM === Clean up old installs (versioned-dir JS files, old bundled custom.js) ===
if exist "%VIVALDI_VERSION_DIR%javascript" (
    echo [i] Cleaning up old JS files from versioned dir...
    rmdir /s /q "%VIVALDI_VERSION_DIR%javascript" 2>nul
    echo     Removed old %VIVALDI_VERSION_DIR%javascript\
    echo.
)

echo =============================================
echo  JS Installation Complete! (Persistent)
echo =============================================
echo.
echo  Installed %MOD_COUNT% JS files to persistent location.
echo.
echo  JS mods:    %VIVALDI_BASE%\javascript\  (PERSISTENT)
echo  Config:     %VIVALDI_BASE%\javascript\custom.js
echo  Injected:   window.html in %VIVALDI_VERSION_DIR%
echo.
echo  +---------------------------------------------------------+
echo  ^|  HOW IT WORKS:                                          ^|
echo  ^|                                                         ^|
echo  ^|  - JS files in Application\javascript\ survive updates  ^|
echo  ^|  - One line in window.html loads custom.js              ^|
echo  ^|  - custom.js loads all your enabled mods                ^|
echo  ^|  - After updates, only the one-liner needs re-injecting ^|
echo  ^|                                                         ^|
echo  ^|  TO CUSTOMIZE MODS:                                     ^|
echo  ^|                                                         ^|
echo  ^|  1. Edit: Application\javascript\custom.js              ^|
echo  ^|  2. Comment/uncomment lines in the mods array           ^|
echo  ^|  3. Restart Vivaldi                                     ^|
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
echo  This will auto-patch window.html when Vivaldi updates.
echo  (JS files persist automatically - no action needed for them!)
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
echo  NOTE: After Vivaldi updates, only window.html needs re-placing!
echo        JS files in Application\javascript\ persist automatically.
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
