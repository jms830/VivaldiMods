# AGENTS.md - Vivaldi Unified Modpack

## Project Overview

This repo provides Arc-style theming for Vivaldi Browser by combining:
- **VivalArc** - Core CSS styling
- **Awesome-Vivaldi** - Modular enhancements and JS mods
- **VivaldiModManager** - Windows tool for managing mods (not in repo, downloaded by setup script)

## Architecture

### Why Shims Exist

VivaldiModManager only scans **top-level files** in `user_mods/css/` and `user_mods/js/`. It uses `Directory.EnumerateFiles()` without recursion, so subdirectories are invisible to its UI.

However, CSS `@import` works normally because mods are injected via `<link rel="stylesheet">` elements.

**Solution: Shim files**

Top-level shim files (e.g., `mod-autohide-addressbar.css`) import from subdirectories:
```css
@import url('base/variables.css');
@import url('modules/autohide-addressbar.css');
```

This lets users toggle individual features in ModManager's UI while keeping code organized in subdirectories.

### File Structure

```
user_mods/css/
├── core.css                    # Base theme - imports variables + vivalarc-base
├── mod-*.css                   # Shims that appear in ModManager UI
├── theme-*.css                 # Theme shims
├── base/                       # Shared dependencies (not visible in UI)
│   ├── variables.css           # All CSS custom properties
│   └── vivalarc-base.css       # Core VivalArc styling (~31KB)
├── modules/                    # Module implementations (not visible in UI)
│   ├── autohide-addressbar.css
│   ├── autohide-bookmarks.css
│   ├── autohide-panel.css
│   └── compact-mode.css
└── themes/                     # Theme implementations (not visible in UI)
    ├── arc-dark.css
    └── arc-light.css
```

### Naming Conventions

| Prefix | Purpose | Example |
|--------|---------|---------|
| `core.css` | Base theme, always enable first | Required for Arc styling |
| `mod-*` | Optional feature modules | `mod-compact-mode.css` |
| `theme-*` | Color scheme overrides | `theme-arc-dark.css` |

## Adding New Modules

1. Create implementation in `modules/my-feature.css`
2. Create shim at top level: `mod-my-feature.css`
3. Shim content:
   ```css
   @import url('base/variables.css');
   @import url('modules/my-feature.css');
   ```
4. Use variables from `base/variables.css` for consistency
5. Update README.md's "Available Mods" table

## Adding New Themes

1. Create implementation in `themes/my-theme.css` with `:root` overrides
2. Create shim: `theme-my-theme.css`
3. Shim content:
   ```css
   @import url('themes/my-theme.css');
   ```

## Platform Support

| Platform | Method | CSS | JS |
|----------|--------|-----|-----|
| Windows | VivaldiModManager | ✅ | ✅ |
| Linux | vivaldi://experiments | ✅ | ❌ Manual patching required |
| macOS | vivaldi://experiments | ✅ | ❌ Manual patching required |

VivaldiModManager is a .NET Windows application. Linux/macOS users can only use CSS mods via Vivaldi's built-in support.

## Key Dependencies

- **VivaldiModManager** (external): https://github.com/eximido/vivaldimodmanager
  - Windows-only, .NET 4.5+
  - Downloaded by `setup.ps1`, not included in repo
  - Manages mod injection into Vivaldi's `window.html`

- **Vivaldi Browser**: Tested with v6.6 - v7.0+
  - CSS mods via `vivaldi://experiments` > "Allow CSS modifications"

## Testing Changes

1. Edit CSS files
2. In Vivaldi: Ctrl+Shift+R (hard refresh) or restart browser
3. Check DevTools (F12) > Console for CSS errors
4. Check Elements panel to verify styles applied

## Source Repos (Reference)

- VivalArc: https://github.com/tovifun/VivalArc
- Awesome-Vivaldi: https://github.com/PaRr0tBoY/Awesome-Vivaldi
- VivaldiModManager: https://github.com/eximido/vivaldimodmanager
