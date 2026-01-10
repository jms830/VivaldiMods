# Vivaldi Unified Modpack

Arc-style theming for Vivaldi Browser, combining VivalArc + Awesome-Vivaldi.

## Quick Start

### Option A: Vivaldi's Built-in CSS Mods (CSS only)

1. Open `vivaldi://experiments`
2. Enable "Allow for using CSS modifications"
3. Restart Vivaldi
4. Go to Settings > Appearance > Custom UI Modifications
5. Select the `user_mods/css/` folder
6. Restart Vivaldi

### Option B: VivaldiModManager (CSS + JS)

1. Download [VivaldiModManager](https://github.com/eximido/vivaldimodmanager)
2. Run the executable
3. Point it to this repo's `user_mods/` folder
4. Enable desired mods
5. Restart Vivaldi

## Customization

Edit `user_mods/css/core.css` to enable/disable modules:

```css
/* Uncomment to enable */
@import url('modules/autohide-addressbar.css');
@import url('modules/compact-mode.css');
```

Edit `user_mods/css/base/variables.css` to tweak values:

```css
:root {
    --window-border: 10px;      /* 4px-16px recommended */
    --compact-sidebar-width: 60px;
    --pinned-column-count: 4;   /* Pinned tabs per row */
}
```

## Structure

```
user_mods/
├── css/
│   ├── core.css           # Main entry - import hub
│   ├── base/
│   │   ├── variables.css  # All CSS custom properties
│   │   └── vivalarc-base.css  # Core Arc styling
│   └── modules/           # Optional feature modules
│       ├── autohide-*.css
│       └── compact-mode.css
└── js/                    # Optional JS mods (ModManager only)
```

## Credits

- [VivalArc](https://github.com/tovifun/VivalArc) by @tovifun
- [Awesome-Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi) by @PaRr0tBoY
- [VivaldiModManager](https://github.com/eximido/vivaldimodmanager) by @eximido

## License

MIT
