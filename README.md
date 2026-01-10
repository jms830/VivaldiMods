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
4. Enable mods (see tables below)
5. Restart Vivaldi

## Available Mods

### CSS Mods

| File | Description | Requires |
|------|-------------|----------|
| `core.css` | **Base Arc-style theme** | Nothing (enable first!) |
| `mod-autohide-addressbar.css` | Hide address bar, show on hover | `core.css` |
| `mod-autohide-bookmarks.css` | Hide bookmark bar, show on hover | `core.css` |
| `mod-autohide-panel.css` | Collapse panel, expand on hover | `core.css` |
| `mod-compact-mode.css` | Auto-collapse sidebar when not hovered | `core.css` |
| `theme-arc-dark.css` | Dark color scheme | `core.css` |
| `theme-arc-light.css` | Light color scheme | `core.css` |

**Usage:** Enable `core.css` first (required base), then enable any `mod-*` or `theme-*` files you want.

### JS Mods (Windows only)

| File | Description |
|------|-------------|
| `tidyTabs.js` | **AI-powered tab grouping** (Gemini, OpenAI, etc.) |
| `colorTabs.js` | Color tab borders based on favicon |
| `globalMediaControls.js` | Media playback panel with controls, volume, PiP |
| `mdNotes.js` | Markdown notes editor in sidebar |
| `elementCapture.js` | Screenshot/element capture tool |
| `activateTabOnHover.js` | Switch tabs on mouse hover |
| `tabScroll.js` | Mouse wheel scrolling in tab bar |
| `monochromeIcons.js` | Convert toolbar icons to monochrome |

JS mods work independently. For `tidyTabs.js`, Ctrl+Click the button to configure your AI provider (free Gemini API key works great).

## Alternative: CSS-Only (No ModManager)

For Linux/macOS or if you don't want ModManager:

1. Open `vivaldi://experiments` in Vivaldi
2. Enable "Allow for using CSS modifications"
3. Restart Vivaldi
4. Go to Settings > Appearance > Custom UI Modifications
5. Select the `user_mods/css/` folder
6. Restart Vivaldi

**Note:** This loads ALL CSS files at once. For selective control, use VivaldiModManager on Windows.

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
│   ├── core.css                    # Base theme - ENABLE FIRST
│   ├── mod-*.css                   # Optional feature modules
│   ├── theme-*.css                 # Color scheme overrides
│   ├── base/                       # Shared files (auto-imported)
│   ├── modules/                    # Module implementations
│   └── themes/                     # Theme implementations
└── js/                             # JS mods (Windows/ModManager only)
    ├── tidyTabs.js                 # AI tab grouping (multi-provider)
    ├── colorTabs.js + chroma.min.js
    ├── globalMediaControls.js
    ├── mdNotes.js
    ├── elementCapture.js
    ├── activateTabOnHover.js
    ├── tabScroll.js
    └── monochromeIcons.js
```

## Credits

- [VivalArc](https://github.com/tovifun/VivalArc) by @tovifun
- [Awesome-Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi) by @PaRr0tBoY and community
- [VivaldiModManager](https://github.com/eximido/vivaldimodmanager) by @eximido

## License

MIT
