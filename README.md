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
4. Enable desired CSS/JS mods
5. Restart Vivaldi

## Alternative: CSS-Only (No ModManager)

If you only want CSS mods and don't need JS:

1. Open `vivaldi://experiments` in Vivaldi
2. Enable "Allow for using CSS modifications"
3. Restart Vivaldi
4. Go to Settings > Appearance > Custom UI Modifications
5. Select the `user_mods/css/` folder
6. Restart Vivaldi

## Customization

### Enable/Disable Modules

Edit `user_mods/css/core.css` - uncomment lines to enable:

```css
/* === MODULES (optional - uncomment to enable) === */
@import url('modules/autohide-addressbar.css');
@import url('modules/compact-mode.css');
/* @import url('modules/autohide-panel.css'); */
```

### Tweak Variables

Edit `user_mods/css/base/variables.css`:

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
│   ├── core.css                # Main entry - import hub
│   ├── base/
│   │   ├── variables.css       # All CSS custom properties
│   │   └── vivalarc-base.css   # Core Arc styling
│   ├── modules/                # Optional feature modules
│   │   ├── autohide-addressbar.css
│   │   ├── autohide-bookmarks.css
│   │   ├── autohide-panel.css
│   │   └── compact-mode.css
│   └── themes/
│       ├── arc-dark.css
│       └── arc-light.css
└── js/                         # Optional JS mods (ModManager only)
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
