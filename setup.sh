#!/usr/bin/env bash
# Vivaldi Unified Modpack - Setup Script (Linux/macOS)
# Downloads VivaldiModManager or sets up CSS-only mode

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOD_MANAGER_VERSION="0.2.7"
DOWNLOAD_URL="https://github.com/eximido/vivaldimodmanager/releases/download/${MOD_MANAGER_VERSION}/vivaldimodsmanager-${MOD_MANAGER_VERSION}.zip"

echo "Vivaldi Unified Modpack Setup"
echo "=============================="
echo ""

# Detect OS
OS="unknown"
case "$(uname -s)" in
    Linux*)  OS="linux";;
    Darwin*) OS="macos";;
    MINGW*|MSYS*|CYGWIN*) OS="windows";;
esac

echo "Detected OS: $OS"
echo ""

if [[ "$OS" == "windows" ]]; then
    echo "On Windows, please run setup.ps1 instead:"
    echo "  powershell -ExecutionPolicy Bypass -File setup.ps1"
    echo ""
    echo "Or run this script in WSL/Git Bash for CSS-only setup."
    echo ""
fi

# VivaldiModManager is Windows-only (.NET), so Linux/macOS use CSS-only mode
if [[ "$OS" != "windows" ]]; then
    echo "VivaldiModManager is Windows-only (.NET application)."
    echo "Setting up CSS-only mode for $OS..."
    echo ""
    echo "To enable CSS mods in Vivaldi:"
    echo ""
    echo "1. Open Vivaldi and go to: vivaldi://experiments"
    echo "2. Enable: 'Allow for using CSS modifications'"
    echo "3. Restart Vivaldi"
    echo "4. Go to: Settings > Appearance > Custom UI Modifications"
    echo "5. Select this folder: $SCRIPT_DIR/user_mods/css"
    echo "6. Restart Vivaldi"
    echo ""
    
    # Try to find Vivaldi installation and show path
    VIVALDI_PATH=""
    if [[ "$OS" == "linux" ]]; then
        if [[ -d "/opt/vivaldi" ]]; then
            VIVALDI_PATH="/opt/vivaldi"
        elif [[ -d "$HOME/.local/share/vivaldi" ]]; then
            VIVALDI_PATH="$HOME/.local/share/vivaldi"
        fi
    elif [[ "$OS" == "macos" ]]; then
        if [[ -d "/Applications/Vivaldi.app" ]]; then
            VIVALDI_PATH="/Applications/Vivaldi.app"
        fi
    fi
    
    if [[ -n "$VIVALDI_PATH" ]]; then
        echo "Found Vivaldi at: $VIVALDI_PATH"
    else
        echo "Vivaldi installation not found in standard locations."
        echo "Make sure Vivaldi is installed before proceeding."
    fi
    
    echo ""
    echo "For JS mods on Linux/macOS, you'll need to manually patch Vivaldi."
    echo "See: https://forum.vivaldi.net/topic/10549/modding-vivaldi"
    echo ""
    
    # Offer to open Vivaldi experiments page
    read -p "Open vivaldi://experiments in your browser now? [y/N] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open "vivaldi://experiments" 2>/dev/null || echo "Could not open browser automatically."
        elif command -v open &> /dev/null; then
            open "vivaldi://experiments" 2>/dev/null || echo "Could not open browser automatically."
        else
            echo "Please open vivaldi://experiments manually in Vivaldi."
        fi
    fi
fi

echo ""
echo "Setup complete!"
echo ""
echo "CSS mods folder: $SCRIPT_DIR/user_mods/css"
echo ""
echo "To customize, edit:"
echo "  - user_mods/css/core.css (enable/disable modules)"
echo "  - user_mods/css/base/variables.css (tweak values)"
