@echo off
REM ============================================================================
REM Vivaldi Mods - Auto-Patch on Update (Persistent Architecture)
REM ============================================================================
REM This script checks if Vivaldi was updated and re-applies window.html.
REM 
REM With the persistent architecture, JS files live in Application\javascript\
REM and survive updates. Only window.html (in the versioned dir) gets wiped.
REM
REM How it works:
REM   1. Finds the latest Vivaldi version folder
REM   2. Checks if our modular window.html already exists there
REM   3. If JS files exist in Application\javascript\, does a FAST patch
REM      (copies only window.html - takes <1 second)
REM   4. If JS files are also missing, runs the full installer
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
set "IS_PATCHED=0"

REM Check for custom.js one-liner injection in window.html
findstr /C:"custom.js" "%LATEST_DIR%\window.html" >nul 2>&1
if not errorlevel 1 set "IS_PATCHED=1"

if "%IS_PATCHED%"=="1" (
    echo [%DATE% %TIME%] Version %LATEST_VERSION% already patched >> "%LOG_FILE%"
    if "%SILENT_MODE%"=="0" (
        echo Vivaldi %LATEST_VERSION% is already patched with JS mods.
        echo.
        echo To force re-apply, run install-js-mods.bat directly.
        pause
    )
    exit /b 0
)

REM === Not patched - check if we can do a fast patch ===
echo [%DATE% %TIME%] New Vivaldi version detected: %LATEST_VERSION% >> "%LOG_FILE%"

REM Check if JS files already exist in persistent location
set "JS_PERSISTENT=%VIVALDI_PATH%\javascript"
if exist "%JS_PERSISTENT%\custom.js" (
    REM custom.js exists! Just inject the one-liner into window.html (fast path)
    echo [%DATE% %TIME%] custom.js found in persistent location, injecting one-liner >> "%LOG_FILE%"

    if "%SILENT_MODE%"=="0" (
        echo.
        echo =============================================
        echo  New Vivaldi Version Detected! (Fast Patch)
        echo =============================================
        echo.
        echo Version: %LATEST_VERSION%
        echo.
        echo JS files already in place at: %JS_PERSISTENT%\
        echo Injecting custom.js loader into window.html...
        echo.
    )

    REM Backup original window.html
    if not exist "%LATEST_DIR%\window.bak.html" (
        copy "%LATEST_DIR%\window.html" "%LATEST_DIR%\window.bak.html" >nul
    )

    REM Inject the one-liner before </body>
    powershell -Command "(Get-Content '%LATEST_DIR%\window.html') -replace '</body>', '<script src=\"../../../javascript/custom.js\"></script>`r`n</body>' | Set-Content '%LATEST_DIR%\window.html'" 2>nul
    if errorlevel 1 (
        echo [%DATE% %TIME%] ERROR: Failed to inject into window.html >> "%LOG_FILE%"
        if "%SILENT_MODE%"=="0" (
            echo [X] ERROR: Failed to inject into window.html
            pause
        )
        exit /b 1
    )

    REM Verify injection
    findstr /C:"custom.js" "%LATEST_DIR%\window.html" >nul 2>&1
    if errorlevel 1 (
        echo [%DATE% %TIME%] ERROR: Injection verification failed >> "%LOG_FILE%"
        if "%SILENT_MODE%"=="0" (
            echo [X] ERROR: Injection verification failed
            pause
        )
        exit /b 1
    )

    echo [%DATE% %TIME%] Fast-patched window.html successfully >> "%LOG_FILE%"

    if "%SILENT_MODE%"=="0" (
        echo [OK] custom.js loader injected into window.html!
        echo.
        echo Restart Vivaldi to apply changes.
        echo.
        pause
    )

    if "%SILENT_MODE%"=="1" (
        powershell -Command "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('Vivaldi updated to %LATEST_VERSION%.`n`ncustom.js loader injected (JS mods persisted).`nPlease restart Vivaldi.', 'Vivaldi Mods', 'OK', 'Information')" >nul 2>&1
    )
    exit /b 0
)

REM === JS files missing too - run full installer ===
echo [%DATE% %TIME%] JS files not found in persistent location, running full install >> "%LOG_FILE%"

if "%SILENT_MODE%"=="0" (
    echo.
    echo ========================================
    echo  New Vivaldi Version Detected!
    echo ========================================
    echo.
    echo Version: %LATEST_VERSION%
    echo Path: %LATEST_DIR%
    echo.
    echo JS files not found in persistent location.
    echo Running full installer...
    echo.
)

REM Run the full installer
pushd "%~dp0"
if "%SILENT_MODE%"=="1" (
    call install-js-mods.bat --silent
) else (
    call install-js-mods.bat
)
popd

echo [%DATE% %TIME%] Full install completed successfully >> "%LOG_FILE%"

REM Show notification for silent mode
if "%SILENT_MODE%"=="1" (
    powershell -Command "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('Vivaldi was updated to %LATEST_VERSION%.`n`nJS mods have been fully re-installed.`nPlease restart Vivaldi.', 'Vivaldi Mods', 'OK', 'Information')" >nul 2>&1
)
