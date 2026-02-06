@echo off
REM ============================================================================
REM Vivaldi Mods - Restore Original
REM ============================================================================
REM Restores Vivaldi's original window.html and removes all JS mods
REM (both bundled custom.js and modular individual files)
REM
REM CSS mods can be disabled in Vivaldi Settings or vivaldi://experiments
REM ============================================================================

setlocal EnableDelayedExpansion
cd "%~dp0"

echo.
echo ========================================
echo  Vivaldi Mods - Restore Original
echo ========================================
echo.

set "VIVALDI_BASE=%LOCALAPPDATA%\Vivaldi\Application"
echo Searching for Vivaldi at: %VIVALDI_BASE%

REM Find the latest version folder
set "VIVALDI_DIR="
for /f "tokens=*" %%d in ('dir /ad /b /o-n "%VIVALDI_BASE%" 2^>nul ^| findstr /r "^[0-9]"') do (
    if exist "%VIVALDI_BASE%\%%d\resources\vivaldi\window.html" (
        if not defined VIVALDI_DIR (
            set "VIVALDI_DIR=%VIVALDI_BASE%\%%d\resources\vivaldi\"
            set "VIVALDI_VERSION=%%d"
        )
    )
)

if "%VIVALDI_DIR%"=="" (
    echo [X] ERROR: No Vivaldi installation found.
    pause & exit /b 1
)

echo Found Vivaldi %VIVALDI_VERSION%
echo Location: %VIVALDI_DIR%
echo.

REM === Check for backup ===
if not exist "%VIVALDI_DIR%window.bak.html" (
    echo [!] No backup found (window.bak.html)
    echo     JS mods may not have been installed, or backup was removed.
    echo.
    echo     To fully reset, you can reinstall Vivaldi.
    pause & exit /b 1
)

REM === Restore window.html ===
echo [1/3] Restoring original window.html from backup...
copy /y "%VIVALDI_DIR%window.bak.html" "%VIVALDI_DIR%window.html" >nul
if errorlevel 1 (
    echo [X] ERROR: Failed to restore window.html
    pause & exit /b 1
)
echo     Done.
echo.

REM === Remove bundled custom.js (old approach) ===
echo [2/3] Removing bundled JS (custom.js)...
if exist "%VIVALDI_DIR%custom.js" (
    del "%VIVALDI_DIR%custom.js" 2>nul
    echo     Removed custom.js
) else (
    echo     No custom.js found (already clean)
)
echo.

REM === Remove modular JS files (new approach) ===
echo [3/3] Removing modular JS files...

set "REMOVED_COUNT=0"

REM Remove root-level JS files that we installed
for %%f in (
    workspaceColors.js
    workspaceButtons.js
    importExportWorkspaceRules.js
    tidyTabs.js
    cleartabs.js
    commandChainIcons.js
) do (
    if exist "%VIVALDI_DIR%%%f" (
        del "%VIVALDI_DIR%%%f" 2>nul
        echo     Removed %%f
        set /a REMOVED_COUNT+=1
    )
)

REM Remove subfolders we created
for %%d in (Tam710562 luetage Other PageAction aminought) do (
    if exist "%VIVALDI_DIR%%%d" (
        echo     Removing %%d/ folder...
        rmdir /s /q "%VIVALDI_DIR%%%d" 2>nul
        if not exist "%VIVALDI_DIR%%%d" (
            echo       Removed %%d/
            set /a REMOVED_COUNT+=1
        ) else (
            echo       [!] Could not fully remove %%d/ (files may be in use)
        )
    )
)

if %REMOVED_COUNT%==0 (
    echo     No modular JS files found (already clean)
) else (
    echo     Removed %REMOVED_COUNT% items
)
echo.

echo ========================================
echo  Restore Complete!
echo ========================================
echo.
echo  All JS mods have been removed.
echo.
echo  To also disable CSS mods:
echo  1. Open vivaldi://experiments
echo  2. Disable "Allow for using CSS modifications"
echo  3. Restart Vivaldi
echo.
echo  Restart Vivaldi to apply changes.
echo.
pause
