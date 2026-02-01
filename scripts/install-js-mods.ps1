# ============================================================================
# Vivaldi Mods - JavaScript Mods Installer (PowerShell)
# ============================================================================
# This script patches Vivaldi to load JavaScript mods from THIS repository.
# Works from both Windows native paths and WSL paths.
#
# Usage:
#   .\install-js-mods.ps1              - Normal install with watcher prompt
#   .\install-js-mods.ps1 -Silent      - Silent mode (no prompts)
#   .\install-js-mods.ps1 -AhkPath "C:\path\to\AutoHotkey"
#
# NOTE: Re-run after Vivaldi updates (or use the watcher)!
# ============================================================================

param(
    [switch]$Silent,
    [string]$AhkPath = "$env:USERPROFILE\Documents\AutoHotkey"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Vivaldi Mods - JS Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
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

Write-Host "[OK] Found Javascripts folder: $JsFolder" -ForegroundColor Green
Write-Host ""

# === Find Vivaldi installation ===
$VivaldiPath = "$env:LOCALAPPDATA\Vivaldi\Application"
Write-Host "Searching for Vivaldi at: $VivaldiPath"

if (-not (Test-Path $VivaldiPath)) {
    Write-Host "[X] ERROR: Vivaldi Application folder not found." -ForegroundColor Red
    Write-Host "    Is Vivaldi installed?" -ForegroundColor Yellow
    if (-not $Silent) { Read-Host "Press Enter to exit" }
    exit 1
}

# Find the latest version folder with window.html
$VivaldiVersionDir = $null
Get-ChildItem -Path $VivaldiPath -Directory | Where-Object { $_.Name -match '^\d+\.\d+' } | ForEach-Object {
    $WindowHtml = Join-Path $_.FullName "resources\vivaldi\window.html"
    if (Test-Path $WindowHtml) {
        $VivaldiVersionDir = Join-Path $_.FullName "resources\vivaldi"
    }
}

if (-not $VivaldiVersionDir) {
    Write-Host "[X] ERROR: Vivaldi window.html not found." -ForegroundColor Red
    Write-Host "    Is Vivaldi installed correctly?" -ForegroundColor Yellow
    if (-not $Silent) { Read-Host "Press Enter to exit" }
    exit 1
}

Write-Host "[OK] Found Vivaldi version folder: $VivaldiVersionDir" -ForegroundColor Green
Write-Host ""

# === Check if Vivaldi is running ===
$VivaldiRunning = $false
$VivaldiProcess = Get-Process -Name "vivaldi" -ErrorAction SilentlyContinue
if ($VivaldiProcess) {
    $VivaldiRunning = $true
    Write-Host "[!] Vivaldi is currently running - will need restart after install." -ForegroundColor Yellow
    Write-Host ""
}

# === Backup window.html ===
Write-Host "[1/3] Creating backup..." -ForegroundColor Cyan
$WindowHtmlPath = Join-Path $VivaldiVersionDir "window.html"
$BackupPath = Join-Path $VivaldiVersionDir "window.bak.html"

if (-not (Test-Path $BackupPath)) {
    Copy-Item $WindowHtmlPath $BackupPath
    Write-Host "     Created backup: window.bak.html"
} else {
    Write-Host "     Backup already exists: window.bak.html"
}
Write-Host ""

# === Build custom.js ===
Write-Host "[2/3] Combining JS mods into custom.js..." -ForegroundColor Cyan
Write-Host ""

$CustomJsPath = Join-Path $VivaldiVersionDir "custom.js"
$ModCount = 0

# Header
$CustomJsContent = @"
// Vivaldi JS Mods
// Installed from: $RepoRoot
// Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

"@

# Function to add JS files from a folder
function Add-JsFiles {
    param(
        [string]$Folder,
        [string]$Prefix = "",
        [string]$SkipFile = ""
    )
    
    $script:ModCount = $ModCount
    
    if (Test-Path $Folder) {
        # Add active mods (*.js files only, not *.js.disabled)
        Get-ChildItem -Path $Folder -Filter "*.js" -File | ForEach-Object {
            # Skip specified file (e.g., chroma.min.js already added as dependency)
            if ($SkipFile -and $_.Name -eq $SkipFile) {
                return
            }
            
            $DisplayName = if ($Prefix) { "$Prefix/$($_.Name)" } else { $_.Name }
            Write-Host "     Adding: $DisplayName" -ForegroundColor Green
            
            $script:CustomJsContent += "`n// === $DisplayName ===`n"
            $script:CustomJsContent += (Get-Content $_.FullName -Raw -Encoding UTF8)
            $script:CustomJsContent += "`n"
            $script:ModCount++
        }
        
        # Report disabled mods
        Get-ChildItem -Path $Folder -Filter "*.js.disabled" -File | ForEach-Object {
            $BaseName = $_.Name -replace '\.disabled$', ''
            $DisplayName = if ($Prefix) { "$Prefix/$BaseName" } else { $BaseName }
            Write-Host "     Skipped (disabled): $DisplayName" -ForegroundColor DarkGray
        }
    }
}

# FIRST: Add chroma.min.js (dependency for colorTabs.js - must load before root files)
$ChromaPath = Join-Path $JsFolder "aminought\chroma.min.js"
if (Test-Path $ChromaPath) {
    Write-Host "     Adding: aminought/chroma.min.js (dependency - must load first)" -ForegroundColor Green
    $script:CustomJsContent += "`n// === aminought/chroma.min.js (DEPENDENCY - must load first) ===`n"
    $script:CustomJsContent += (Get-Content $ChromaPath -Raw -Encoding UTF8)
    $script:CustomJsContent += "`n"
    $script:ModCount++
}

# Add root-level JS files
Add-JsFiles -Folder $JsFolder

# Add subfolder mods (skip chroma.min.js since already added)
$Subfolders = @("Tam710562", "aminought", "luetage", "PageAction", "Other")
foreach ($Subfolder in $Subfolders) {
    $SubfolderPath = Join-Path $JsFolder $Subfolder
    Add-JsFiles -Folder $SubfolderPath -Prefix $Subfolder -SkipFile "chroma.min.js"
}

Write-Host ""
Write-Host "     Total mods added: $ModCount"
Write-Host "     (chroma.min.js dependency loaded first for colorTabs.js)" -ForegroundColor DarkGray
Write-Host ""

# Write custom.js
$CustomJsContent | Out-File -FilePath $CustomJsPath -Encoding UTF8 -NoNewline

# === Patch window.html ===
Write-Host "[3/3] Patching window.html..." -ForegroundColor Cyan

try {
    $BackupContent = Get-Content $BackupPath -Raw -Encoding UTF8
    
    # Remove closing tags and add script reference
    $PatchedContent = $BackupContent -replace '</body>\s*</html>\s*$', ''
    $PatchedContent += "  <script src=`"custom.js`"></script>`n</body>`n</html>`n"
    
    $PatchedContent | Out-File -FilePath $WindowHtmlPath -Encoding UTF8 -NoNewline
    
    # Validate
    Write-Host "     Validating..."
    
    $ValidatedContent = Get-Content $WindowHtmlPath -Raw
    if ($ValidatedContent -notmatch 'custom\.js') {
        throw "custom.js script tag not found in patched file"
    }
    if ($ValidatedContent -notmatch '</body>') {
        throw "closing body tag not found"
    }
    if ($ValidatedContent -notmatch '</html>') {
        throw "closing html tag not found"
    }
    
    $CustomJsSize = (Get-Item $CustomJsPath).Length
    if ($CustomJsSize -lt 100) {
        throw "custom.js is too small ($CustomJsSize bytes)"
    }
    
    Write-Host "     Validation passed." -ForegroundColor Green
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
    
    if (Test-Path $CustomJsPath) {
        Remove-Item $CustomJsPath -Force
        Write-Host "     Removed incomplete custom.js"
    }
    
    if (-not $Silent) { Read-Host "Press Enter to exit" }
    exit 1
}

Write-Host "========================================" -ForegroundColor Green
Write-Host " JS Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host " Installed $ModCount JavaScript mods."
Write-Host ""
Write-Host " Location: $CustomJsPath"
Write-Host ""

# === Offer to install watcher (if not silent) ===
if (-not $Silent) {
    $WatcherSrc = Join-Path $ScriptDir "vivaldi-watcher.ahk"
    $WatcherDst = Join-Path $AhkPath "Vivaldi Watcher.ahk"
    
    if ((Test-Path $WatcherSrc) -and (Test-Path $AhkPath)) {
        if (-not (Test-Path $WatcherDst)) {
            Write-Host " Would you like to install the AutoHotkey watcher?" -ForegroundColor Cyan
            Write-Host " This will auto-patch Vivaldi when it updates."
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
Write-Host " NOTE: Re-run this script after Vivaldi updates!" -ForegroundColor Yellow
Write-Host ""
Write-Host " To remove JS mods: run restore-vivaldi.bat"
Write-Host ""

if (-not $Silent) { Read-Host "Press Enter to exit" }
