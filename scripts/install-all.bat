@echo off
REM ============================================================================
REM Vivaldi Mods - All-in-One Installer
REM ============================================================================
REM This script:
REM   1. Clones/updates Awesome-Vivaldi repo
REM   2. Copies your custom Core.css configuration
REM   3. Installs JS mods into Vivaldi
REM   4. Sets Vivaldi's CSS path in preferences
REM
REM Usage: Place your Core.css in the same folder as this script, then run it.
REM ============================================================================

setlocal EnableDelayedExpansion
cd "%~dp0"

echo.
echo ========================================
echo  Vivaldi Mods - All-in-One Installer
echo ========================================
echo.

REM === Configuration ===
set "INSTALL_DIR=%USERPROFILE%\Documents"
set "AWESOME_VIVALDI_DIR=%INSTALL_DIR%\Awesome-Vivaldi"
set "VIVALDI_PREFS=%LOCALAPPDATA%\Vivaldi\User Data\Default\Preferences"
set "CORE_CSS=%~dp0Core.css"

REM === Step 0: Check for Core.css ===
if not exist "%CORE_CSS%" (
    echo [!] No Core.css found in script directory.
    echo.
    echo     To get your Core.css:
    echo     1. Visit https://jms830.github.io/VivaldiMods/
    echo     2. Configure your desired modules
    echo     3. Click "Download Core.css"
    echo     4. Place the downloaded file next to this script
    echo     5. Run this script again
    echo.
    pause
    exit /b 1
)

REM === Step 1: Clone or Update Awesome-Vivaldi ===
echo [1/4] Setting up Awesome-Vivaldi...

if exist "%AWESOME_VIVALDI_DIR%\.git" (
    echo      Repository exists, pulling latest changes...
    pushd "%AWESOME_VIVALDI_DIR%"
    git pull origin main 2>nul || git pull origin master 2>nul
    popd
) else (
    if exist "%AWESOME_VIVALDI_DIR%" (
        echo      Folder exists but not a git repo. Backing up and re-cloning...
        move "%AWESOME_VIVALDI_DIR%" "%AWESOME_VIVALDI_DIR%.backup.%DATE:~-4%%DATE:~-10,2%%DATE:~-7,2%"
    )
    echo      Cloning Awesome-Vivaldi repository...
    git clone https://github.com/PaRr0tBoY/Awesome-Vivaldi.git "%AWESOME_VIVALDI_DIR%"
    if errorlevel 1 (
        echo [X] Failed to clone repository. Is git installed?
        echo     Install git from: https://git-scm.com/download/win
        pause
        exit /b 1
    )
)
echo      Done.
echo.

REM === Step 2: Copy Core.css ===
echo [2/4] Installing your Core.css configuration...
copy /Y "%CORE_CSS%" "%AWESOME_VIVALDI_DIR%\CSS\Core.css" >nul
if errorlevel 1 (
    echo [X] Failed to copy Core.css
    pause
    exit /b 1
)
echo      Done.
echo.

REM === Step 3: Install JS Mods ===
echo [3/4] Installing JavaScript mods...

REM Find Vivaldi installation
set "VIVALDI_PATH=%LOCALAPPDATA%\Vivaldi\Application"
for /f "tokens=*" %%a in ('dir /a:-d /b /s "%VIVALDI_PATH%" 2^>nul') do (
    if "%%~nxa"=="window.html" set "VIVALDI_VERSION_DIR=%%~dpa"
)

if "%VIVALDI_VERSION_DIR%"=="" (
    echo [!] Vivaldi not found. Skipping JS mod installation.
    echo     You can install JS mods later with install-js-mods.bat
    goto :set_css_path
)

echo      Found Vivaldi at: %VIVALDI_VERSION_DIR%

REM Backup window.html if not already backed up
if not exist "%VIVALDI_VERSION_DIR%window.bak.html" (
    echo      Creating backup of window.html...
    copy "%VIVALDI_VERSION_DIR%window.html" "%VIVALDI_VERSION_DIR%window.bak.html" >nul
)

REM Build custom.js from all JS mods
set "JS_FOLDER=%AWESOME_VIVALDI_DIR%\Javascripts"
echo // Awesome-Vivaldi JS Mods > "%VIVALDI_VERSION_DIR%custom.js"
echo // Installed by VivaldiMods All-in-One Installer >> "%VIVALDI_VERSION_DIR%custom.js"
echo. >> "%VIVALDI_VERSION_DIR%custom.js"

REM Add root-level JS files
for %%f in ("%JS_FOLDER%\*.js") do (
    echo      Adding: %%~nxf
    echo. >> "%VIVALDI_VERSION_DIR%custom.js"
    echo // === %%~nxf === >> "%VIVALDI_VERSION_DIR%custom.js"
    type "%%f" >> "%VIVALDI_VERSION_DIR%custom.js"
)

REM Add Tam710562 mods
if exist "%JS_FOLDER%\Tam710562" (
    for %%f in ("%JS_FOLDER%\Tam710562\*.js") do (
        echo      Adding: Tam710562/%%~nxf
        echo. >> "%VIVALDI_VERSION_DIR%custom.js"
        echo // === Tam710562/%%~nxf === >> "%VIVALDI_VERSION_DIR%custom.js"
        type "%%f" >> "%VIVALDI_VERSION_DIR%custom.js"
    )
)

REM Add aminought mods
if exist "%JS_FOLDER%\aminought" (
    for %%f in ("%JS_FOLDER%\aminought\*.js") do (
        echo      Adding: aminought/%%~nxf
        echo. >> "%VIVALDI_VERSION_DIR%custom.js"
        echo // === aminought/%%~nxf === >> "%VIVALDI_VERSION_DIR%custom.js"
        type "%%f" >> "%VIVALDI_VERSION_DIR%custom.js"
    )
)

REM Add luetage mods
if exist "%JS_FOLDER%\luetage" (
    for %%f in ("%JS_FOLDER%\luetage\*.js") do (
        echo      Adding: luetage/%%~nxf
        echo. >> "%VIVALDI_VERSION_DIR%custom.js"
        echo // === luetage/%%~nxf === >> "%VIVALDI_VERSION_DIR%custom.js"
        type "%%f" >> "%VIVALDI_VERSION_DIR%custom.js"
    )
)

REM Patch window.html to load custom.js
type "%VIVALDI_VERSION_DIR%window.bak.html" | findstr /v "</body>" | findstr /v "</html>" > "%VIVALDI_VERSION_DIR%window.html"
echo     ^<script src="custom.js"^>^</script^> >> "%VIVALDI_VERSION_DIR%window.html"
echo   ^</body^> >> "%VIVALDI_VERSION_DIR%window.html"
echo ^</html^> >> "%VIVALDI_VERSION_DIR%window.html"

echo      Done.
echo.

:set_css_path
REM === Step 4: Set Vivaldi CSS Path ===
echo [4/4] Configuring Vivaldi to use CSS mods...

if not exist "%VIVALDI_PREFS%" (
    echo [!] Vivaldi preferences not found at:
    echo     %VIVALDI_PREFS%
    echo.
    echo     Please set CSS path manually:
    echo     1. Open Vivaldi Settings
    echo     2. Go to Appearance ^> Custom UI Modifications
    echo     3. Set path to: %AWESOME_VIVALDI_DIR%\CSS
    goto :done
)

REM Check if Vivaldi is running
tasklist /FI "IMAGENAME eq vivaldi.exe" 2>nul | find /I "vivaldi.exe" >nul
if not errorlevel 1 (
    echo [!] Vivaldi is currently running.
    echo     Please close Vivaldi, then press any key to continue...
    pause >nul
)

REM Use PowerShell to update JSON preferences
set "CSS_PATH=%AWESOME_VIVALDI_DIR%\CSS"
set "CSS_PATH_ESCAPED=%CSS_PATH:\=\\%"

powershell -Command ^
    "$prefs = Get-Content '%VIVALDI_PREFS%' -Raw | ConvertFrom-Json; ^
    if (-not $prefs.vivaldi) { $prefs | Add-Member -NotePropertyName 'vivaldi' -NotePropertyValue @{} }; ^
    if (-not $prefs.vivaldi.appearance) { $prefs.vivaldi | Add-Member -NotePropertyName 'appearance' -NotePropertyValue @{} }; ^
    $prefs.vivaldi.appearance.css_ui_mods_directory = '%CSS_PATH_ESCAPED%'; ^
    $prefs | ConvertTo-Json -Depth 100 -Compress | Set-Content '%VIVALDI_PREFS%' -Encoding UTF8"

if errorlevel 1 (
    echo [!] Failed to update preferences automatically.
    echo     Please set CSS path manually in Vivaldi Settings.
) else (
    echo      CSS path set to: %CSS_PATH%
)
echo      Done.
echo.

:done
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo  CSS Mods: %AWESOME_VIVALDI_DIR%\CSS
echo  JS Mods:  Installed to Vivaldi
echo.
echo  Next steps:
echo  1. Open vivaldi://experiments in Vivaldi
echo  2. Enable "Allow for using CSS modifications"
echo  3. Restart Vivaldi
echo.
echo  To reconfigure: Visit https://jms830.github.io/VivaldiMods/
echo  Download a new Core.css and run this script again.
echo.
pause
