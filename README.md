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
│   ├── core.css            # Entry point - comment/uncomment @imports to toggle
│   ├── AutoHide/           # Auto-hide features
│   ├── Layout/             # Core layouts
│   ├── EnhancedUX/         # Visual enhancements
│   └── JSIntegration/      # CSS for JS-dependent features
├── Javascripts/            # JS mods
│   ├── custom.js           # JS loader - comment/uncomment lines to toggle mods
│   ├── Tam710562/          # Tam's mods (media controls, notes, etc.)
│   ├── luetage/            # Luetage's mods (accent, hover, theme, etc.)
│   ├── aminought/          # Aminought's mods (colorTabs, addressBar)
│   ├── Other/              # Misc mods (PiP, dashboard, hibernate)
│   └── PageAction/         # Page action mods (follower tabs, tab lock)
├── scripts/                # Installation scripts
│   ├── install.bat         # CSS setup (Windows)
│   ├── install-js-mods.bat # JS setup (Windows)
│   ├── restore-vivaldi.bat # Remove JS mods
│   ├── auto-patch-vivaldi.bat   # Re-apply JS after Vivaldi updates
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
| commandChainIcons.js | Custom SVG icons for command chains |
| workspaceColors.js | Per-workspace accent colors |

### How JS Mods Work

JS mods use **NTFS hardlinks** to survive Vivaldi updates:

1. JS files persist in `Application/javascript/` (outside the versioned folder).
2. `install-js-mods.bat` creates **hardlinks** so Vivaldi can see the files inside its versioned directory: `resources/vivaldi/javascript/`.
3. It injects a single `<script>` tag into Vivaldi's `window.html` that loads `custom.js`.
4. `custom.js` dynamically loads all enabled mods.

**To customize:** Edit `Application/javascript/custom.js` and comment/uncomment lines in the `enabledMods` array.

**After Vivaldi updates:** Only the hardlinks and the `window.html` one-liner need re-creating. Run `auto-patch-vivaldi.bat` to fix it in under a second.

**Why hardlinks?** Vivaldi loads `window.html` as a Chrome extension. Chrome's security rejects symlinks to files outside the extension root. Hardlinks are the *same NTFS data object* with two directory entries — Chrome sees a real file at the expected path. No admin privileges required, zero extra disk space.

### JS Mod Persistence (Vivaldi Updates)

JS files live in `Application/javascript/` which is **outside** the versioned folder. When Vivaldi updates, only the versioned folder is replaced — your JS files and `custom.js` config survive automatically.

**Solutions for Windows:**

| Script | Description |
|--------|-------------|
| `scripts/install-js-mods.bat` | **Full install.** Copies JS files to the persistent location, creates hardlinks, and injects the script tag. |
| `scripts/auto-patch-vivaldi.bat` | **Fast re-patch.** Use after Vivaldi updates. Re-creates hardlinks and injects the script tag (<1 second). |
| `scripts/restore-vivaldi.bat` | **Complete uninstall.** Removes script injection and hardlinks. |
| `scripts/setup-auto-patch.bat` | Creates a Windows scheduled task to run auto-patch on login. |
| `scripts/vivaldi-watcher.ahk` | **Recommended.** AutoHotkey v2 script that monitors Vivaldi and auto-applies mods on update. |

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
