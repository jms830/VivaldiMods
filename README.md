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

## JS Mods (Optional)

For full functionality, install JavaScript mods from Awesome-Vivaldi:

| File | Description |
|------|-------------|
| tidyTabs.js | AI-powered tab grouping |
| immersiveAddressbar.js | Required for immersive theme mode |
| clearTabs.js | Clear inactive tabs |
| globalMediaControls.js | Media playback panel |

**Windows:** Use [VivaldiModManager](https://github.com/eximido/vivaldimodmanager)

**macOS/Linux:** See [Awesome-Vivaldi installation guide](https://github.com/PaRr0tBoY/Awesome-Vivaldi#ii-install-mods)

## Credits

- [Awesome-Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi) by @PaRr0tBoY and community
- [VivalArc](https://github.com/tovifun/VivalArc) by @tovifun
- [VivaldiModManager](https://github.com/eximido/vivaldimodmanager) by @eximido

## License

MIT
