# Vivaldi Unified Modpack

Arc-style theming for Vivaldi Browser, combining VivalArc + Awesome-Vivaldi.

## Quick Setup

### Windows (recommended - full CSS + JS support)

```powershell
.\setup.ps1
```

### Linux / macOS (CSS-only)

```bash
./setup.sh
```

VivaldiModManager is Windows-only. Linux/macOS users get CSS mods via Vivaldi's built-in support.

### Manual Setup

1. Download [VivaldiModManager v0.2.7](https://github.com/eximido/vivaldimodmanager/releases/download/0.2.7/vivaldimodsmanager-0.2.7.zip)
2. Extract and run `VivaldiModManager.exe`
3. Click "Add" and select this repo's `user_mods/` folder
4. Enable desired mods (see list below)
5. Restart Vivaldi

## Available Mods

In VivaldiModManager, you'll see these files to enable/disable individually:

| File | Description |
|------|-------------|
| `core.css` | **Base theme** - Arc-style UI (required) |
| `mod-autohide-addressbar.css` | Hide address bar, show on hover |
| `mod-autohide-bookmarks.css` | Hide bookmark bar, show on hover |
| `mod-autohide-panel.css` | Collapse panel, expand on hover |
| `mod-compact-mode.css` | Auto-collapse sidebar when not hovered |
| `theme-arc-dark.css` | Dark color scheme |
| `theme-arc-light.css` | Light color scheme |

Enable `core.css` first, then add any mods/themes you want.

## Alternative: CSS-Only (No ModManager)

If you only want CSS mods and don't need JS:

1. Open `vivaldi://experiments` in Vivaldi
2. Enable "Allow for using CSS modifications"
3. Restart Vivaldi
4. Go to Settings > Appearance > Custom UI Modifications
5. Select the `user_mods/css/` folder
6. Restart Vivaldi

Note: This method loads ALL CSS files. To selectively enable mods, use VivaldiModManager.

## Customization

Edit `user_mods/css/base/variables.css` to tweak values:

```css
:root {
    --window-border: 10px;           /* 4px-16px recommended */
    --compact-sidebar-width: 60px;   /* Width when collapsed */
    --pinned-column-count: 4;        /* Pinned tabs per row */
}
```

## Structure

```
user_mods/
├── css/
│   ├── core.css                    # Base theme (VivalArc styling)
│   ├── mod-*.css                   # Shims for individual modules
│   ├── theme-*.css                 # Shims for themes
│   ├── base/
│   │   ├── variables.css           # Customizable CSS variables
│   │   └── vivalarc-base.css       # Core Arc styling
│   ├── modules/                    # Actual module implementations
│   │   ├── autohide-addressbar.css
│   │   ├── autohide-bookmarks.css
│   │   ├── autohide-panel.css
│   │   └── compact-mode.css
│   └── themes/
│       ├── arc-dark.css
│       └── arc-light.css
└── js/                             # Optional JS mods (ModManager only)
    └── README.md
```

## Adding JS Mods

JS mods require VivaldiModManager. Popular options from [Awesome-Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi/tree/main/Javascripts):

- `tidyTabs.js` - AI-powered tab grouping
- `globalMediaControls.js` - Media playback controls
- `markdownNotes.js` - Markdown editor in sidebar

Copy `.js` files to `user_mods/js/`, then enable via ModManager.

## Credits

- [VivalArc](https://github.com/tovifun/VivalArc) by @tovifun
- [Awesome-Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi) by @PaRr0tBoY
- [VivaldiModManager](https://github.com/eximido/vivaldimodmanager) by @eximido

## License

MIT
