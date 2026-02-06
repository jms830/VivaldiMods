# Vivaldi Unified Modpack

Arc-style theming for Vivaldi Browser. This repo is a fork of [Awesome-Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi) with additional fixes and a web configurator.

## Quick Setup (Windows)

### Option A: Automated Install

1. Clone this repo:
   ```
   git clone https://github.com/jms830/revivarc-vivaldi.git
   ```
2. Run `scripts/install.bat` - sets up CSS mods
3. Run `scripts/install-js-mods.bat` - sets up JS mods (optional)
4. Open `vivaldi://experiments` in Vivaldi
5. Enable "Allow for using CSS modifications"
6. Restart Vivaldi

### Option B: Manual Install

1. Clone or download this repo
2. Open `vivaldi://experiments` in Vivaldi
3. Enable "Allow for using CSS modifications"
4. Go to Settings > Appearance > Custom UI Modifications
5. Select the `CSS/` folder from this repo
6. Restart Vivaldi

### Option C: Use the Web Configurator

**[Open Configurator](https://jms830.github.io/VivaldiMods/)** - Customize which modules are enabled.

1. Toggle the modules you want
2. Adjust settings (sidebar width, animations, etc.)
3. Download your customized `core.css`
4. Replace `CSS/core.css` in this repo with it
5. Run `scripts/install.bat` or point Vivaldi to `CSS/` manually

## Repository Structure

```
revivarc-vivaldi/
├── CSS/                    # CSS mods (point Vivaldi here)
│   ├── core.css            # Entry point - imports all modules
│   ├── AutoHide/           # Auto-hide features
│   ├── Layout/             # Core layouts
│   ├── EnhancedUX/         # Visual enhancements
│   └── JSIntegration/      # CSS for JS-dependent features
├── Javascripts/            # JS mods (require patching Vivaldi)
├── scripts/                # Installation scripts
│   ├── install.bat         # CSS setup (Windows)
│   ├── install-js-mods.bat # JS setup (Windows)
│   ├── restore-vivaldi.bat # Remove JS mods
│   ├── auto-patch-vivaldi.bat   # Re-apply JS mods if missing
│   ├── setup-auto-patch.bat     # Schedule auto-patch on login
│   └── vivaldi-watcher.ahk      # Auto-apply JS mods on Vivaldi update
├── configurator/           # Web-based configuration tool
├── docs/                   # Documentation and customization notes
└── Themes/                 # Theme presets
```

## Presets

The configurator offers these presets:

| Preset | Description |
|--------|-------------|
| **Default** | Clean upstream Awesome-Vivaldi |
| **Minimal** | Basic Arc-style sidebar |
| **Recommended** | Balanced features with auto-hide and animations |
| **Native 7.8+** | For Vivaldi 7.8+ users with native auto-hide enabled |
| **All Features** | Everything enabled |

## What's Included

### CSS Modules

**Auto-Hide**
- AdaptiveBF, Tabbar, Bookmarkbar, Panel, StatusBar

**Layout**
- main (core Arc-style), FavouriteTabs, Addressbar, NeatDial, FindInPage, QuickCommand, DownloadPanel, ExtensionsPanel

**Enhanced UX**
- BtnHoverAnime, TabsTrail, Quietify, SelectableText

**JS Integration** (requires JS mods)
- TidyTabs, ClearTabs, ArcPeek, Accentmod

### JS Mods

| File | Description |
|------|-------------|
| tidyTabs.js | AI-powered tab grouping |
| tidyTitles.js | AI-powered tab title cleanup |
| globalMediaControls.js | Media playback panel |
| colorTabs.js | Color tab borders by favicon |
| mdNotes.js | Markdown notes in sidebar |
| workspaceButtons.js | Quick workspace switching buttons in tabbar |

**Note:** JS mods require patching Vivaldi's `window.html`. Run `scripts/install-js-mods.bat` on Windows, or see [docs](docs/) for manual instructions on macOS/Linux.

### JS Mods - Manual Modular Install

For more control over which JS mods are loaded (like `core.css` for CSS), use the modular `window.html`:

1. Copy `Javascripts/window.html` to `<VIVALDI>/Application/<VERSION>/resources/vivaldi/`
2. Copy all JS files from `Javascripts/` (including subfolders) to the same location
3. Edit `window.html` - comment/uncomment `<script>` lines to enable/disable mods:
   ```html
   <!-- Enabled: -->
   <script src="tidyTabs.js"></script>
   
   <!-- Disabled (commented out): -->
   <!-- <script src="colorTabs.js.disabled"></script> -->
   ```
4. Restart Vivaldi

Each script has a comment explaining what it does. This approach is easier to customize than the bundled `custom.js`.

### JS Mod Persistence (Vivaldi Updates)

JS mods are injected into Vivaldi's versioned `Application/<version>/resources/vivaldi/` folder. **When Vivaldi updates, this folder is replaced and JS mods are lost.** CSS mods persist because their path is stored in user preferences.

**Solutions for Windows:**

| Script | Description |
|--------|-------------|
| `scripts/auto-patch-vivaldi.bat` | Checks if latest Vivaldi version has custom.js, re-applies if missing. Run manually or on schedule. |
| `scripts/setup-auto-patch.bat` | Creates a Windows scheduled task to run auto-patch on login. |
| `scripts/vivaldi-watcher.ahk` | AutoHotkey v2 script that monitors Vivaldi's folder and auto-applies JS mods when a new version is detected. **Recommended** - set it to run at startup. |

To use the watcher:
1. Install [AutoHotkey v2](https://www.autohotkey.com/)
2. Edit `scripts/vivaldi-watcher.ahk` and set `installerScript` to the full path of your `install-js-mods.bat`
3. Add the .ahk file to Windows startup (Win+R → `shell:startup` → create shortcut)

## Customizations

We maintain targeted fixes on top of Awesome-Vivaldi. See [docs/customizations.md](docs/customizations.md) for details on what we've changed and why.

## Configuration Variables

Edit these in `CSS/core.css` or use the configurator:

| Variable | Default | Description |
|----------|---------|-------------|
| `--fluid-theme` | color | Theme mode: color, transparent, immersive |
| `--fluid-compact-mode` | off | Ultra-thin sidebar when collapsed |
| `--fluid-float-tabbar` | on | Sidebar overlays vs pushes content |
| `--fluid-tabs-grid` | on | Show pinned tabs as grid |
| `--tabs-container-expand-width` | 280px | Expanded sidebar width |
| `--animation-speed` | 260ms | Animation duration |

## Platform Support

| Platform | CSS Mods | JS Mods |
|----------|----------|---------|
| Windows | `scripts/install.bat` | `scripts/install-js-mods.bat` |
| Linux | Manual (vivaldi://experiments) | Manual window.html patch |
| macOS | Manual (vivaldi://experiments) | Manual window.html patch |

## Credits

- [Awesome-Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi) by @PaRr0tBoY and community
- [VivalArc](https://github.com/tovifun/VivalArc) by @tovifun

## License

MIT
