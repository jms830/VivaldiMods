# Vivaldi Unified Modpack - Setup Script
# Downloads VivaldiModManager and launches it

$ErrorActionPreference = "Stop"
$ModManagerVersion = "0.2.7"
$DownloadUrl = "https://github.com/eximido/vivaldimodmanager/releases/download/$ModManagerVersion/vivaldimodsmanager-$ModManagerVersion.zip"
$ZipPath = "$PSScriptRoot\VivaldiModManager.zip"
$ExtractPath = "$PSScriptRoot\VivaldiModManager"
$ExePath = "$ExtractPath\VivaldiModManager.exe"

Write-Host "Vivaldi Unified Modpack Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Check if already installed
if (Test-Path $ExePath) {
    Write-Host "VivaldiModManager already installed." -ForegroundColor Green
    Write-Host "Launching..." -ForegroundColor Yellow
    Start-Process $ExePath
    exit 0
}

# Download
Write-Host "Downloading VivaldiModManager v$ModManagerVersion..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath -UseBasicParsing
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    Write-Host "Please download manually from: https://github.com/eximido/vivaldimodmanager/releases" -ForegroundColor Yellow
    exit 1
}

# Extract
Write-Host "Extracting..." -ForegroundColor Yellow
if (Test-Path $ExtractPath) {
    Remove-Item -Recurse -Force $ExtractPath
}
Expand-Archive -Path $ZipPath -DestinationPath $ExtractPath -Force

# Cleanup zip
Remove-Item $ZipPath -Force

# Find exe (might be in subfolder)
$ExeFile = Get-ChildItem -Path $ExtractPath -Recurse -Filter "VivaldiModManager.exe" | Select-Object -First 1
if (-not $ExeFile) {
    Write-Host "Error: VivaldiModManager.exe not found in extracted files" -ForegroundColor Red
    exit 1
}

# Launch
Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. VivaldiModManager will open" -ForegroundColor White
Write-Host "2. Click 'Add' and select: $PSScriptRoot\user_mods" -ForegroundColor White
Write-Host "3. Enable desired mods" -ForegroundColor White
Write-Host "4. Restart Vivaldi" -ForegroundColor White
Write-Host ""

Start-Process $ExeFile.FullName
