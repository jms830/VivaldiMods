@echo off
REM Vivaldi JS Mods Installer for Windows
REM Automatically patches Vivaldi to load custom JavaScript mods
REM 
REM Original by: debiedowner
REM Editor: Phobos
REM Source: https://forum.vivaldi.net/topic/10592/patching-vivaldi-with-batch-scripts

cd "%~dp0"

set installPath="%localappdata%\Vivaldi\Application\"
echo Searching for Vivaldi at: %installPath%

for /f "tokens=*" %%a in ('dir /a:-d /b /s %installPath%') do (
    if "%%~nxa"=="window.html" set latestVersionFolder=%%~dpa
)

if "%latestVersionFolder%"=="" (
    echo ERROR: No window.html found. Is Vivaldi installed?
    pause & exit /b 1
) else (
    echo Found Vivaldi version folder: "%latestVersionFolder%"
)

if not exist "%latestVersionFolder%\window.bak.html" (
    echo Creating backup of original window.html...
    copy "%latestVersionFolder%\window.html" "%latestVersionFolder%\window.bak.html"
    echo Backup created: window.bak.html
)

set jsFolder=%~dp0..\Awesome-Vivaldi\Javascripts
if not exist "%jsFolder%" (
    echo ERROR: Awesome-Vivaldi/Javascripts folder not found.
    echo Please clone Awesome-Vivaldi first:
    echo   git clone https://github.com/PaRr0tBoY/Awesome-Vivaldi.git
    pause & exit /b 1
)

echo.
echo Combining JS mods into custom.js...
type "%jsFolder%\*.js" > "%latestVersionFolder%\custom.js" 2>nul

echo Patching window.html...
type "%latestVersionFolder%\window.bak.html" | findstr /v "</body>" | findstr /v "</html>" > "%latestVersionFolder%\window.html"
echo     ^<script src="custom.js"^>^</script^> >> "%latestVersionFolder%\window.html"
echo   ^</body^> >> "%latestVersionFolder%\window.html"
echo ^</html^> >> "%latestVersionFolder%\window.html"

echo.
echo Done! JS mods installed successfully.
echo Restart Vivaldi to apply changes.
echo.
echo To restore original: copy window.bak.html to window.html
pause
