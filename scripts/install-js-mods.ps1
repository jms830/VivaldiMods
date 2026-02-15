# ============================================================================
# Vivaldi Mods - JavaScript Mods Installer (PowerShell, Hardlink Architecture)
# ============================================================================
# This script installs JavaScript mods using NTFS HARDLINKS:
#   - JS files go to Application\javascript\ (survives Vivaldi updates!)
#   - Hardlinks make them visible as resources\vivaldi\javascript\
#   - ONE line is injected into Vivaldi's stock window.html to load custom.js
#   - custom.js dynamically loads all individual mods
#
# Architecture:
#   Application\
#   +-- javascript\               <-- JS mods live here (PERSISTENT)
#   |   +-- custom.js             <-- Loader (configure mods here)
#   |   +-- workspaceButtons.js
#   |   +-- Tam710562\
#   |   +-- ...
#   +-- 7.x.xxxx.x\
#       +-- resources\vivaldi\
#           +-- javascript\       <-- HARDLINKS to Application\javascript\ files
#           +-- window.html       <-- ONE line injected before </body>
#
# Why hardlinks? Chrome-extension:// security blocks junctions/symlinks because
# it resolves the real path and checks it's inside the extension root. Hardlinks
# ARE the file (same NTFS data object, two names) so security checks pass.
#
# Usage:
#   .\install-js-mods.ps1              - Normal install with watcher prompt
#   .\install-js-mods.ps1 -Silent      - Silent mode (no prompts)
#   .\install-js-mods.ps1 -AhkPath "C:\path\to\AutoHotkey"
#
# To customize which mods are enabled:
#   1. Open Application\javascript\custom.js
#   2. Comment/uncomment lines in the mods array
#   3. Restart Vivaldi
#
# NOTE: After Vivaldi updates, only hardlinks + one-liner need re-creating!
#       JS files + custom.js in Application\javascript\ persist automatically.
# ============================================================================

param(
    [switch]$Silent,
    [string]$AhkPath = "$env:USERPROFILE\Documents\AutoHotkey"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Vivaldi Mods - JS Installer (Hardlinks)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# === Get repo root (parent of scripts/) ===
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$JsFolder = Join-Path $RepoRoot "Javascripts"

# === Verify Javascripts folder exists ===
if (-not (Test-Path $JsFolder)) {
    Write-Host "[X] ERROR: Javascripts folder not found at:" -ForegroundColor Red
    Write-Host "    $JsFolder" -ForegroundColor Red
    Write-Host ""
    Write-Host "    Make sure you're running this from the scripts/ folder" -ForegroundColor Yellow
    Write-Host "    inside the revivarc-vivaldi repository." -ForegroundColor Yellow
    if (-not $Silent) { Read-Host "Press Enter to exit" }
    exit 1
}

if (-not (Test-Path (Join-Path $JsFolder "custom.js"))) {
    Write-Host "[X] ERROR: custom.js not found at:" -ForegroundColor Red
    Write-Host "    $(Join-Path $JsFolder 'custom.js')" -ForegroundColor Red
    Write-Host ""
    Write-Host "    This is the mod loader. It should be in the Javascripts folder." -ForegroundColor Yellow
    if (-not $Silent) { Read-Host "Press Enter to exit" }
    exit 1
}

Write-Host "[OK] Found Javascripts folder: $JsFolder" -ForegroundColor Green
Write-Host "[OK] Found custom.js loader" -ForegroundColor Green
Write-Host ""

# === Find Vivaldi installation ===
$VivaldiBase = "$env:LOCALAPPDATA\Vivaldi\Application"
Write-Host "Searching for Vivaldi at: $VivaldiBase"

if (-not (Test-Path $VivaldiBase)) {
    Write-Host "[X] ERROR: Vivaldi Application folder not found." -ForegroundColor Red
    Write-Host "    Is Vivaldi installed?" -ForegroundColor Yellow
    if (-not $Silent) { Read-Host "Press Enter to exit" }
    exit 1
}

# Find the latest version folder with window.html
$VivaldiVersionDir = $null
$LatestVersion = $null
Get-ChildItem -Path $VivaldiBase -Directory | Where-Object { $_.Name -match '^\d+\.\d+' } | Sort-Object Name -Descending | ForEach-Object {
    $WindowHtml = Join-Path $_.FullName "resources\vivaldi\window.html"
    if ((Test-Path $WindowHtml) -and (-not $VivaldiVersionDir)) {
        $VivaldiVersionDir = Join-Path $_.FullName "resources\vivaldi"
        $LatestVersion = $_.Name
    }
}

if (-not $VivaldiVersionDir) {
    Write-Host "[X] ERROR: Vivaldi window.html not found." -ForegroundColor Red
    Write-Host "    Is Vivaldi installed correctly?" -ForegroundColor Yellow
    if (-not $Silent) { Read-Host "Press Enter to exit" }
    exit 1
}

$JsPersistent = Join-Path $VivaldiBase "javascript"

Write-Host "[OK] Found Vivaldi $LatestVersion" -ForegroundColor Green
Write-Host "     Versioned dir: $VivaldiVersionDir" -ForegroundColor Gray
Write-Host "     Persistent JS: $JsPersistent\  (survives updates)" -ForegroundColor Gray
Write-Host "     Hardlinks in:  $VivaldiVersionDir\javascript\" -ForegroundColor Gray
Write-Host ""

# === Check if Vivaldi is running ===
$VivaldiRunning = $false
$VivaldiProcess = Get-Process -Name "vivaldi" -ErrorAction SilentlyContinue
if ($VivaldiProcess) {
    $VivaldiRunning = $true
    Write-Host "[!] Vivaldi is currently running." -ForegroundColor Yellow
    Write-Host "    File locks may cause hardlink creation to fail." -ForegroundColor Yellow
    Write-Host "    Close Vivaldi for best results, or continue at your own risk." -ForegroundColor Yellow
    Write-Host ""
    if (-not $Silent) {
        $response = Read-Host "Continue anyway? (Y/N)"
        if ($response -notmatch '^[Yy]') {
            Write-Host "     Aborting. Please close Vivaldi and run again."
            exit 0
        }
    }
}

# === Step 1: Backup stock window.html ===
Write-Host "[1/4] Creating backup of stock window.html..." -ForegroundColor Cyan

$WindowHtmlPath = Join-Path $VivaldiVersionDir "window.html"
$BackupPath = Join-Path $VivaldiVersionDir "window.bak.html"

# If backup exists but contains our mods, it's stale - replace it
if (Test-Path $BackupPath) {
    $BackupContent = Get-Content $BackupPath -Raw -ErrorAction SilentlyContinue
    if ($BackupContent -match 'custom\.js') {
        Write-Host "     Existing backup contains mods (stale) - will recreate from stock" -ForegroundColor Yellow
        Remove-Item $BackupPath -Force
    }
}

if (-not (Test-Path $BackupPath)) {
    # Only backup if current window.html is stock (no custom.js reference)
    $CurrentContent = Get-Content $WindowHtmlPath -Raw -ErrorAction SilentlyContinue
    if ($CurrentContent -notmatch 'custom\.js') {
        Copy-Item $WindowHtmlPath $BackupPath
        Write-Host "     Created backup: window.bak.html (stock Vivaldi)"
    } else {
        Write-Host "     [!] Current window.html already modded, no stock backup available" -ForegroundColor Yellow
        Write-Host "     [!] Proceeding anyway - injection will be idempotent" -ForegroundColor Yellow
    }
} else {
    Write-Host "     Backup already exists: window.bak.html (stock Vivaldi)"
}
Write-Host ""

# === Step 2: Copy JS files to PERSISTENT Application\javascript\ ===
Write-Host "[2/4] Copying JavaScript mods to persistent location..." -ForegroundColor Cyan
Write-Host "     Target: $JsPersistent\" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path $JsPersistent)) {
    New-Item -ItemType Directory -Path $JsPersistent | Out-Null
}

$ModCount = 0
$FolderCount = 0

# Copy root-level JS files (including custom.js loader)
Write-Host "     Copying root JS files..."
Get-ChildItem -Path $JsFolder -Filter "*.js" -File | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $JsPersistent $_.Name) -Force
    Write-Host "       + javascript/$($_.Name)" -ForegroundColor Green
    $script:ModCount++
}

# Copy subfolders
$Subfolders = @("Tam710562", "luetage", "Other", "PageAction", "aminought")
foreach ($Subfolder in $Subfolders) {
    $SubfolderSrc = Join-Path $JsFolder $Subfolder
    if (Test-Path $SubfolderSrc) {
        Write-Host ""
        Write-Host "     Copying $Subfolder/ folder..."

        $SubfolderDst = Join-Path $JsPersistent $Subfolder
        if (-not (Test-Path $SubfolderDst)) {
            New-Item -ItemType Directory -Path $SubfolderDst | Out-Null
        }
        $FolderCount++

        Get-ChildItem -Path $SubfolderSrc -Filter "*.js" -File | ForEach-Object {
            Copy-Item $_.FullName (Join-Path $SubfolderDst $_.Name) -Force
            Write-Host "       + javascript/$Subfolder/$($_.Name)" -ForegroundColor Green
            $script:ModCount++
        }
    }
}

Write-Host ""
Write-Host "     Copied $ModCount JS files to persistent location ($FolderCount subfolders)" -ForegroundColor Green
Write-Host ""

# === Step 3: Create hardlinks in versioned directory ===
Write-Host "[3/4] Creating hardlinks to persistent JS files..." -ForegroundColor Cyan

$LinkDir = Join-Path $VivaldiVersionDir "javascript"
$LinkCount = 0

# Remove existing directory (junction from old installs, or previous hardlinks)
if (Test-Path $LinkDir) {
    Remove-Item $LinkDir -Recurse -Force -ErrorAction SilentlyContinue
}

# Create directory structure
New-Item -ItemType Directory -Path $LinkDir -Force | Out-Null
foreach ($Subfolder in $Subfolders) {
    $SubfolderPersistent = Join-Path $JsPersistent $Subfolder
    if (Test-Path $SubfolderPersistent) {
        New-Item -ItemType Directory -Path (Join-Path $LinkDir $Subfolder) -Force | Out-Null
    }
}

# cmd.exe can't run from a UNC working directory (e.g., \\wsl.localhost\...).
# Push to a Windows-native dir so mklink works when invoked from WSL.
$OriginalDir = Get-Location
Set-Location $env:TEMP

# Hardlink root-level JS files
Get-ChildItem -Path $JsPersistent -Filter "*.js" -File | ForEach-Object {
    $LinkTarget = Join-Path $LinkDir $_.Name
    cmd /c "mklink /H `"$LinkTarget`" `"$($_.FullName)`"" 2>&1 | Out-Null
    if (Test-Path $LinkTarget) { $LinkCount++ }
}

# Hardlink subdirectory JS files
foreach ($Subfolder in $Subfolders) {
    $SubfolderPersistent = Join-Path $JsPersistent $Subfolder
    if (Test-Path $SubfolderPersistent) {
        Get-ChildItem -Path $SubfolderPersistent -Filter "*.js" -File | ForEach-Object {
            $LinkTarget = Join-Path $LinkDir "$Subfolder\$($_.Name)"
            cmd /c "mklink /H `"$LinkTarget`" `"$($_.FullName)`"" 2>&1 | Out-Null
            if (Test-Path $LinkTarget) { $LinkCount++ }
        }
    }
}

Set-Location $OriginalDir

# Verify hardlinks created
$CustomJsLink = Join-Path $LinkDir "custom.js"
if (-not (Test-Path $CustomJsLink)) {
    Write-Host "[X] ERROR: Hardlink verification failed!" -ForegroundColor Red
    Write-Host "    custom.js hardlink not found at: $CustomJsLink" -ForegroundColor Red
    Write-Host ""

    # Rollback
    if (Test-Path $BackupPath) {
        Copy-Item $BackupPath $WindowHtmlPath -Force
        Write-Host "[OK] Rollback successful - original window.html restored." -ForegroundColor Green
    }
    if (Test-Path $LinkDir) {
        Remove-Item $LinkDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    if (-not $Silent) { Read-Host "Press Enter to exit" }
    exit 1
}

Write-Host "     Created $LinkCount hardlinks in: $LinkDir\" -ForegroundColor Green
Write-Host "     Linked to persistent files in: $JsPersistent\" -ForegroundColor Gray
Write-Host ""

# === Step 4: Inject one-liner into Vivaldi's window.html ===
Write-Host "[4/4] Injecting custom.js loader into window.html..." -ForegroundColor Cyan

# Check if already injected with correct path
$WindowContent = Get-Content $WindowHtmlPath -Raw
if ($WindowContent -match 'javascript/custom\.js') {
    Write-Host "     custom.js reference already present in window.html (correct path)" -ForegroundColor Green
    Write-Host ""
} else {
    # Remove any old-style injection (src="custom.js" without javascript/ prefix)
    if ($WindowContent -match '<script\s+src="custom\.js"') {
        Write-Host "     Removing old-style custom.js injection (wrong path)..." -ForegroundColor Yellow
        $WindowContent = $WindowContent -replace '\s*<script\s+src="custom\.js"></script>\s*', ''
    }

    # Use backup as base if available, otherwise patch current
    if ((Test-Path $BackupPath) -and ($WindowContent -notmatch 'javascript/custom\.js')) {
        $BaseContent = Get-Content $BackupPath -Raw -Encoding UTF8
    } else {
        $BaseContent = $WindowContent
    }

    try {
        $PatchedContent = $BaseContent -replace '</body>', "  <script src=`"javascript/custom.js`"></script>`n</body>"
        $PatchedContent | Out-File -FilePath $WindowHtmlPath -Encoding UTF8 -NoNewline

        # Validate
        Write-Host "     Validating..."

        $ValidatedContent = Get-Content $WindowHtmlPath -Raw
        if ($ValidatedContent -notmatch 'javascript/custom\.js') {
            throw "custom.js script tag not found in patched file"
        }
        if ($ValidatedContent -notmatch '</body>') {
            throw "closing body tag not found"
        }
        if ($ValidatedContent -notmatch '</html>') {
            throw "closing html tag not found"
        }

        Write-Host "     Injected: <script src=`"javascript/custom.js`"></script>" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host ""
        Write-Host "[X] ERROR: Patch validation failed!" -ForegroundColor Red
        Write-Host "    $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "    Attempting automatic rollback..." -ForegroundColor Yellow

        if (Test-Path $BackupPath) {
            Copy-Item $BackupPath $WindowHtmlPath -Force
            Write-Host "[OK] Rollback successful - original window.html restored." -ForegroundColor Green
        } else {
            Write-Host "[!] No backup found - cannot rollback automatically." -ForegroundColor Red
            Write-Host "    You may need to reinstall Vivaldi." -ForegroundColor Yellow
        }

        if (-not $Silent) { Read-Host "Press Enter to exit" }
        exit 1
    }
}

# === Clean up old bundled custom.js (from legacy PS1 installs) ===
$OldBundledJs = Join-Path $VivaldiVersionDir "custom.js"
if (Test-Path $OldBundledJs) {
    # Large file = old bundled monolith, safe to remove
    $OldSize = (Get-Item $OldBundledJs).Length
    if ($OldSize -gt 10000) {
        Write-Host "[i] Cleaning up old bundled custom.js ($([math]::Round($OldSize/1024))KB)..." -ForegroundColor Yellow
        Remove-Item $OldBundledJs -Force -ErrorAction SilentlyContinue
        Write-Host "     Removed old bundled custom.js" -ForegroundColor Green
    }
}

$OldBundledBak = Join-Path $VivaldiVersionDir "custom.js.bak"
if (Test-Path $OldBundledBak) {
    Remove-Item $OldBundledBak -Force -ErrorAction SilentlyContinue
    Write-Host "     Removed old custom.js.bak" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host " JS Installation Complete! (Hardlinks)" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host " Installed $ModCount JS files, created $LinkCount hardlinks."
Write-Host ""
Write-Host " JS mods:    $JsPersistent\  (PERSISTENT)" -ForegroundColor Gray
Write-Host " Config:     $JsPersistent\custom.js" -ForegroundColor Gray
Write-Host " Hardlinks:  $LinkDir\" -ForegroundColor Gray
Write-Host " Injected:   window.html in $VivaldiVersionDir" -ForegroundColor Gray
Write-Host ""
Write-Host " +---------------------------------------------------------+"
Write-Host " |  HOW IT WORKS:                                          |"
Write-Host " |                                                         |"
Write-Host " |  - JS files in Application\javascript\ survive updates  |"
Write-Host " |  - NTFS hardlinks make them visible inside resources\   |"
Write-Host " |  - One line in window.html loads custom.js              |"
Write-Host " |  - custom.js loads all your enabled mods                |"
Write-Host " |  - After updates: re-create hardlinks + one-liner       |"
Write-Host " |                                                         |"
Write-Host " |  TO CUSTOMIZE MODS:                                     |"
Write-Host " |                                                         |"
Write-Host " |  1. Edit: Application\javascript\custom.js              |"
Write-Host " |  2. Comment/uncomment lines in the mods array           |"
Write-Host " |  3. Restart Vivaldi                                     |"
Write-Host " +---------------------------------------------------------+"
Write-Host ""

# === Offer to install watcher (if not silent) ===
if (-not $Silent) {
    $WatcherSrc = Join-Path $ScriptDir "vivaldi-watcher.ahk"
    $WatcherDst = Join-Path $AhkPath "Vivaldi Watcher.ahk"

    if ((Test-Path $WatcherSrc) -and (Test-Path $AhkPath)) {
        if (-not (Test-Path $WatcherDst)) {
            Write-Host " Would you like to install the AutoHotkey watcher?" -ForegroundColor Cyan
            Write-Host " This will auto-patch Vivaldi when it updates."
            Write-Host " (JS files persist automatically - no action needed for them!)"
            Write-Host ""
            Write-Host " Install location: $WatcherDst"
            Write-Host ""
            $response = Read-Host "Install watcher? (Y/N)"

            if ($response -match '^[Yy]') {
                Copy-Item $WatcherSrc $WatcherDst -Force
                Write-Host ""
                Write-Host " [OK] Watcher installed: $WatcherDst" -ForegroundColor Green
                Write-Host ""
                Write-Host " To enable auto-start:" -ForegroundColor Yellow
                Write-Host "   1. Press Win+R, type: shell:startup"
                Write-Host "   2. Create a shortcut to the watcher script"
                Write-Host ""
            }
        } else {
            Write-Host " [i] Watcher already installed: $WatcherDst" -ForegroundColor Cyan
            Write-Host ""
        }
    }
}

if ($VivaldiRunning) {
    Write-Host " IMPORTANT: RESTART VIVALDI to apply changes!" -ForegroundColor Yellow
    Write-Host ""
}
Write-Host " NOTE: After Vivaldi updates, only hardlinks + one-liner need re-creating!" -ForegroundColor Yellow
Write-Host "       JS files in Application\javascript\ persist automatically." -ForegroundColor Gray
Write-Host ""
Write-Host " To remove JS mods: run restore-vivaldi.bat"
Write-Host ""

if (-not $Silent) { Read-Host "Press Enter to exit" }
