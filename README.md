# Vivaldi Unified Modpack

Arc-style theming for Vivaldi Browser, powered by [Awesome-Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi).

## Web Configurator (Recommended)

**[Open Configurator](https://jms830.github.io/VivaldiMods/)** - No-code configuration for Awesome-Vivaldi mods.

1. Toggle the modules you want
2. Adjust settings (sidebar width, animations, etc.)
3. Download your customized `Core.css`
4. Replace `Awesome-Vivaldi/CSS/Core.css` with it
5. Point Vivaldi to the CSS folder

## Quick Setup

### Step 1: Get Awesome-Vivaldi

```bash
git clone https://github.com/PaRr0tBoY/Awesome-Vivaldi.git
```

Or [download the ZIP](https://github.com/PaRr0tBoY/Awesome-Vivaldi/archive/refs/heads/main.zip).

### Step 2: Configure with the Web Tool

1. Open the [Configurator](https://jms830.github.io/VivaldiMods/)
2. Pick your modules and settings
3. Download `Core.css`
4. Replace `Awesome-Vivaldi/CSS/Core.css` with your download

### Step 3: Enable in Vivaldi

1. Open `vivaldi://experiments` in Vivaldi
2. Enable "Allow for using CSS modifications"
3. Restart Vivaldi
4. Go to Settings > Appearance > Custom UI Modifications
5. Select `Awesome-Vivaldi/CSS/` folder
6. Restart Vivaldi

## Available Modules

### Auto-Hide
| Module | Description |
|--------|-------------|
| AdaptiveBF | Hide back/forward when disabled |
| Tabbar | Auto-hide entire tabbar |
| Bookmarkbar | Auto-hide bookmark bar |
| Panel | Auto-hide side panel |
| StatusBar | Auto-hide status bar |

### Layout
| Module | Description |
|--------|-------------|
| main | Core Arc-style sidebar (required) |
| FavouriteTabs | Pinned tabs as icon grid |
| Addressbar | Styled address bar |
| NeatDial | Clean speed dial page |
| FindInPage | Styled find bar |
| QuickCommand | Styled command palette |
| DownloadPanel | Styled downloads |
| ExtensionsPanel | Styled extensions |

### Enhanced UX
| Module | Description |
|--------|-------------|
| BtnHoverAnime | Button hover animations |
| TabsTrail | Color trails on tab hover |
| Quietify | Animated audio icons |
| SelectableText | Make UI text selectable |

### JS Integration (requires JS mods)
| Module | Description |
|--------|-------------|
| TidyTabs | AI-powered tab grouping styles |
| ClearTabs | Clear tabs feature styles |
| ArcPeek | Arc peek preview styles |
| Accentmod | Dynamic accent colors |

## Configuration Variables

The configurator sets these `:root` variables in Core.css:

| Variable | Default | Description |
|----------|---------|-------------|
| `--fluid-theme` | color | Theme mode: color, transparent, immersive |
| `--fluid-compact-mode` | off | Ultra-thin sidebar when collapsed |
| `--fluid-float-tabbar` | on | Sidebar overlays vs pushes content |
| `--fluid-tabs-grid` | on | Show pinned tabs as grid |
| `--tabs-container-expand-width` | 280px | Expanded sidebar width |
| `--animation-speed` | 260ms | Animation duration |

See the [Awesome-Vivaldi docs](https://github.com/PaRr0tBoY/Awesome-Vivaldi) for full variable reference.

## Compatibility Notes

- Case-sensitive filesystems (Linux/macOS) require exact module filename casing; the configurator outputs the correct casing.
- CSS relies on modern Chromium features like `:has()` and container queries; Vivaldi 6.6+ recommended.

## Command Chain Flags (In-Browser Toggles)

Some autohide features can be toggled on/off directly in Vivaldi without editing CSS. This uses Vivaldi's Command Chain feature as flags - a pure CSS solution with no JavaScript required.

### How It Works

1. Go to **Settings > Quick Commands > Command Chains**
2. Create a new Command Chain with one of the names below (leave it empty - no commands needed)
3. Add the Command Chain's button to any toolbar (right-click toolbar > Customize)
4. When the button is visible, that autohide feature is **disabled**
5. Remove the button from the toolbar to re-enable autohide

### Available Toggles

| Command Chain Name | Effect |
|-------------------|--------|
| `Disable Autohide Panel` | Stops side panel from auto-hiding |
| `Disable Autohide Bookmarks` | Stops bookmark bar from auto-hiding |
| `Disable Autohide StatusBar` | Stops status bar from auto-hiding |

This works because the CSS uses `:has(button[title*="..."])` to detect if a button with that name exists on any toolbar.

## JS Mods (Optional)

For full functionality, install JavaScript mods from Awesome-Vivaldi:

| File | Description |
|------|-------------|
| tidyTabs.js | AI-powered tab grouping |
| tidyTitles.js | AI-powered tab title cleanup |
| clearTabs.js | Clear inactive tabs |
| immersiveAddressbar.js | Required for immersive theme mode |
| globalMediaControls.js | Media playback panel |
| colorTabs.js | Color tab borders by favicon |
| mdNotes.js | Markdown notes in sidebar |
| elementCapture.js | Screenshot/element capture |
| easyFiles.js | Quick file picker from downloads |

### Windows: Quick Install Script

```batch
scripts\install-js-mods.bat
```

This automatically finds Vivaldi, backs up `window.html`, and patches it to load all JS mods.

To restore original: `scripts\restore-vivaldi.bat`

### Windows: VivaldiModManager

Alternatively, use [VivaldiModManager](https://github.com/eximido/vivaldimodmanager) for a GUI.

### macOS/Linux

See [Awesome-Vivaldi installation guide](https://github.com/PaRr0tBoY/Awesome-Vivaldi#ii-install-mods)

## Credits

- [Awesome-Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi) by @PaRr0tBoY and community
- [VivalArc](https://github.com/tovifun/VivalArc) by @tovifun
- [VivaldiModManager](https://github.com/eximido/vivaldimodmanager) by @eximido

## License

MIT
