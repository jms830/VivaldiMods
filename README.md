# Vivaldi Unified Modpack

Arc-style theming for Vivaldi Browser. This repo includes a vendored fork of [Awesome-Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi) with additional fixes.

## Quick Setup

### Option A: Use This Repo Directly

1. Clone or download this repo
2. Open `vivaldi://experiments` in Vivaldi
3. Enable "Allow for using CSS modifications"
4. Restart Vivaldi
5. Go to Settings > Appearance > Custom UI Modifications
6. Select `vendor/awesome-vivaldi/CSS/` folder from this repo
7. Restart Vivaldi

### Option B: Use the Web Configurator

**[Open Configurator](https://jms830.github.io/VivaldiMods/)** - Customize which modules are enabled.

1. Toggle the modules you want
2. Adjust settings (sidebar width, animations, etc.)
3. Download your customized `Core.css`
4. Replace `vendor/awesome-vivaldi/CSS/Core.css` with it
5. Point Vivaldi to `vendor/awesome-vivaldi/CSS/`

## Presets

The configurator offers these presets:

| Preset | Description |
|--------|-------------|
| **Default** | Clean upstream Awesome-Vivaldi (no custom fixes) |
| **Minimal** | Basic Arc-style sidebar |
| **Recommended** | Balanced features with auto-hide and animations |
| **All Features** | Everything enabled |

## What's Included

### CSS Modules

Located in `vendor/awesome-vivaldi/CSS/`:

**Auto-Hide**
- AdaptiveBF, Tabbar, Bookmarkbar, Panel, StatusBar

**Layout**
- main (core Arc-style), FavouriteTabs, Addressbar, NeatDial, FindInPage, QuickCommand, DownloadPanel, ExtensionsPanel

**Enhanced UX**
- BtnHoverAnime, TabsTrail, Quietify, SelectableText

**JS Integration** (requires JS mods)
- TidyTabs, ClearTabs, ArcPeek, Accentmod

### JS Mods

Located in `vendor/awesome-vivaldi/Javascripts/`:

| File | Description |
|------|-------------|
| tidyTabs.js | AI-powered tab grouping |
| tidyTitles.js | AI-powered tab title cleanup |
| globalMediaControls.js | Media playback panel |
| colorTabs.js | Color tab borders by favicon |
| mdNotes.js | Markdown notes in sidebar |

## Customizations

We maintain a fork of Awesome-Vivaldi with targeted fixes. See [docs/customizations.md](docs/customizations.md) for details on what we've changed and why.

## Configuration Variables

The configurator sets these `:root` variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `--fluid-theme` | color | Theme mode: color, transparent, immersive |
| `--fluid-compact-mode` | off | Ultra-thin sidebar when collapsed |
| `--fluid-float-tabbar` | on | Sidebar overlays vs pushes content |
| `--fluid-tabs-grid` | on | Show pinned tabs as grid |
| `--tabs-container-expand-width` | 280px | Expanded sidebar width |
| `--animation-speed` | 260ms | Animation duration |

## Platform Notes

| Platform | CSS Mods | JS Mods |
|----------|----------|---------|
| Windows | Via experiments flag | VivaldiModManager or manual |
| Linux | Via experiments flag | Manual window.html patch |
| macOS | Via experiments flag | Manual window.html patch |

## Credits

- [Awesome-Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi) by @PaRr0tBoY and community
- [VivalArc](https://github.com/tovifun/VivalArc) by @tovifun

## License

MIT
