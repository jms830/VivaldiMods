@echo off
REM ============================================================================
REM Vivaldi Mods - JavaScript Mods Installer
REM ============================================================================
REM This script patches Vivaldi to load JavaScript mods from THIS repository.
REM No external downloads or cloning required.
REM
REM What it does:
REM   1. Backs up Vivaldi's original window.html
REM   2. Combines all JS mods into a single custom.js file
REM   3. Patches window.html to load custom.js
REM
REM NOTE: You'll need to re-run this after Vivaldi updates!
REM ============================================================================

setlocal EnableDelayedExpansion
cd "%~dp0"

echo.
echo ========================================
echo  Vivaldi Mods - JS Installer
echo ========================================
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

echo [OK] Found Javascripts folder: %JS_FOLDER%
echo.

REM === Find Vivaldi installation ===
set "VIVALDI_PATH=%LOCALAPPDATA%\Vivaldi\Application"
echo Searching for Vivaldi at: %VIVALDI_PATH%

for /f "tokens=*" %%a in ('dir /a:-d /b /s "%VIVALDI_PATH%" 2^>nul') do (
    if "%%~nxa"=="window.html" set "VIVALDI_VERSION_DIR=%%~dpa"
)

if "%VIVALDI_VERSION_DIR%"=="" (
    echo [X] ERROR: Vivaldi window.html not found.
    echo     Is Vivaldi installed?
    pause & exit /b 1
)

echo [OK] Found Vivaldi version folder: %VIVALDI_VERSION_DIR%
echo.

REM === Check if Vivaldi is running ===
tasklist /FI "IMAGENAME eq vivaldi.exe" 2>nul | find /I "vivaldi.exe" >nul
if not errorlevel 1 (
    echo [!] Vivaldi is currently running.
    echo     Please close Vivaldi, then press any key to continue...
    echo.
    pause >nul
)

REM === Backup window.html ===
echo [1/3] Creating backup...
if not exist "%VIVALDI_VERSION_DIR%window.bak.html" (
    copy "%VIVALDI_VERSION_DIR%window.html" "%VIVALDI_VERSION_DIR%window.bak.html" >nul
    echo     Created backup: window.bak.html
) else (
    echo     Backup already exists: window.bak.html
)
echo.

REM === Build custom.js ===
echo [2/3] Combining JS mods into custom.js...
echo.

echo // Vivaldi JS Mods > "%VIVALDI_VERSION_DIR%custom.js"
echo // Installed from: %REPO_ROOT% >> "%VIVALDI_VERSION_DIR%custom.js"
echo // Date: %DATE% %TIME% >> "%VIVALDI_VERSION_DIR%custom.js"
echo. >> "%VIVALDI_VERSION_DIR%custom.js"

set "MOD_COUNT=0"

REM Add root-level JS files (tidyTabs.js, tidyTitles.js, ClearTabs.js, etc.)
for %%f in ("%JS_FOLDER%\*.js") do (
    echo     Adding: %%~nxf
    echo. >> "%VIVALDI_VERSION_DIR%custom.js"
    echo // === %%~nxf === >> "%VIVALDI_VERSION_DIR%custom.js"
    type "%%f" >> "%VIVALDI_VERSION_DIR%custom.js"
    set /a MOD_COUNT+=1
)

REM Add Tam710562 mods (globalMediaControls, mdNotes, easyFiles, etc.)
if exist "%JS_FOLDER%\Tam710562" (
    for %%f in ("%JS_FOLDER%\Tam710562\*.js") do (
        echo     Adding: Tam710562/%%~nxf
        echo. >> "%VIVALDI_VERSION_DIR%custom.js"
        echo // === Tam710562/%%~nxf === >> "%VIVALDI_VERSION_DIR%custom.js"
        type "%%f" >> "%VIVALDI_VERSION_DIR%custom.js"
        set /a MOD_COUNT+=1
    )
)

REM Add aminought mods (colorTabs, ybAddressBar)
if exist "%JS_FOLDER%\aminought" (
    for %%f in ("%JS_FOLDER%\aminought\*.js") do (
        echo     Adding: aminought/%%~nxf
        echo. >> "%VIVALDI_VERSION_DIR%custom.js"
        echo // === aminought/%%~nxf === >> "%VIVALDI_VERSION_DIR%custom.js"
        type "%%f" >> "%VIVALDI_VERSION_DIR%custom.js"
        set /a MOD_COUNT+=1
    )
)

REM Add luetage mods (accentMod, monochromeIcons, etc.)
if exist "%JS_FOLDER%\luetage" (
    for %%f in ("%JS_FOLDER%\luetage\*.js") do (
        echo     Adding: luetage/%%~nxf
        echo. >> "%VIVALDI_VERSION_DIR%custom.js"
        echo // === luetage/%%~nxf === >> "%VIVALDI_VERSION_DIR%custom.js"
        type "%%f" >> "%VIVALDI_VERSION_DIR%custom.js"
        set /a MOD_COUNT+=1
    )
)

REM Add PageAction mods
if exist "%JS_FOLDER%\PageAction" (
    for %%f in ("%JS_FOLDER%\PageAction\*.js") do (
        echo     Adding: PageAction/%%~nxf
        echo. >> "%VIVALDI_VERSION_DIR%custom.js"
        echo // === PageAction/%%~nxf === >> "%VIVALDI_VERSION_DIR%custom.js"
        type "%%f" >> "%VIVALDI_VERSION_DIR%custom.js"
        set /a MOD_COUNT+=1
    )
)

REM Add Other mods
if exist "%JS_FOLDER%\Other" (
    for %%f in ("%JS_FOLDER%\Other\*.js") do (
        echo     Adding: Other/%%~nxf
        echo. >> "%VIVALDI_VERSION_DIR%custom.js"
        echo // === Other/%%~nxf === >> "%VIVALDI_VERSION_DIR%custom.js"
        type "%%f" >> "%VIVALDI_VERSION_DIR%custom.js"
        set /a MOD_COUNT+=1
    )
)

echo.
echo     Total mods added: %MOD_COUNT%
echo.

REM === Patch window.html ===
echo [3/3] Patching window.html...

REM Remove closing tags and add script reference
type "%VIVALDI_VERSION_DIR%window.bak.html" | findstr /v "</body>" | findstr /v "</html>" > "%VIVALDI_VERSION_DIR%window.html"
echo     ^<script src="custom.js"^>^</script^> >> "%VIVALDI_VERSION_DIR%window.html"
echo   ^</body^> >> "%VIVALDI_VERSION_DIR%window.html"
echo ^</html^> >> "%VIVALDI_VERSION_DIR%window.html"

echo     Done.
echo.

echo ========================================
echo  JS Installation Complete!
echo ========================================
echo.
echo  Installed %MOD_COUNT% JavaScript mods.
echo.
echo  Location: %VIVALDI_VERSION_DIR%custom.js
echo.
echo  IMPORTANT:
echo  - Restart Vivaldi to apply changes
echo  - Re-run this script after Vivaldi updates!
echo.
echo  To remove JS mods: run restore-vivaldi.bat
echo.
pause
