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

## Known Issues & Fixes

### Blank Space Below Address Bar (Vivaldi 7.8+)

**Symptom**: Extra blank space appears below the address bar when using sidebar tabs.

**Cause**: A `min-height` rule in `CSS/Layout/main.css` conflicts with Vivaldi 7.8+'s native auto-hide handling.

**The problematic rule (REMOVED)**:
```css
#browser:not(.address-top-off, .address-bottom-off, .address-bottom)
  .mainbar
  > .toolbar-mainbar {
  min-height: calc(34px / var(--uiZoomLevel));
}
```

**Fix**: This rule was removed from `main.css` in commit `cfb5d9a`. If blank space reappears after upstream updates, check for similar `min-height` or `height` rules on `.toolbar-mainbar`.

**How we found it**: Binary search through `main.css` - commented out half the file at a time until the culprit was isolated.

### Blank Space Below Address Bar - Second Occurrence (Vivaldi 7.8+)

**Symptom**: Same as above - extra blank space below the address bar with native auto-hide enabled.

**Cause**: A forced `height` rule in `CSS/Layout/addressbar.css` conflicts with Vivaldi 7.8+'s native auto-hide.

**The problematic rule (REMOVED)**:
```css
.mainbar .toolbar-mainbar {
  align-items: stretch;
  height: var(--mod-mainbar-height) !important;  /* was 25px */
  border: none !important;
}
```

**Fix**: Remove the `height: var(--mod-mainbar-height) !important;` line from `addressbar.css`. The toolbar needs its natural height for native auto-hide to work correctly.

**How we found it**: Disabled CSS files one by one until the culprit was isolated to `addressbar.css`.

### Workspace Buttons: Triggering React-Controlled UI (Fixed Jan 2026)

**Symptom**: Custom workspace quick-switch buttons could activate tabs in another workspace, but the tabbar UI wouldn't update to show that workspace's tabs.

**Root Cause**: Vivaldi's UI is React-based. Standard DOM events (`.click()`, `dispatchEvent()`) don't trigger React's internal state updates. The workspace popup button and items require React's event system.

**What DOESN'T Work**:
- `element.click()` - Native click doesn't trigger React handlers
- `dispatchEvent(new MouseEvent(...))` - DOM events bypass React
- `element.__reactProps$.onClick(event)` - React's onClick isn't the right handler
- Keyboard shortcut simulation - JS-generated events aren't "trusted" by browser

**What WORKS** (from `globalMediaControls.js`):
```javascript
// Get React's internal props from a DOM element
const getReactProps = (element) => {
  const key = Object.keys(element).find(k => k.startsWith('__reactProps'));
  return element[key];
};

// Trigger via onPointerDown - React's preferred event for buttons
const simulateButtonClick = (element) => {
  const pointerDown = new PointerEvent('pointerdown', {
    view: window, bubbles: true, cancelable: true,
    buttons: 0, pointerType: 'mouse',
  });
  pointerDown.persist = () => {};  // Required for React event pooling
  
  const props = getReactProps(element);
  if (props?.onPointerDown) {
    props.onPointerDown(pointerDown);
    element.dispatchEvent(new PointerEvent('pointerup', {...}));
    return true;
  }
  return false;
};
```

**Key Insights**:
1. React uses `onPointerDown` not `onClick` for toolbar buttons
2. The `.persist()` method is needed even if empty (prevents React event pooling issues)
3. Popup menus are rendered via React portals at document root, not inside the button
4. The popup selector is `div[class*="Popup"]` with multiple `button` children
5. "Default" workspace maps to the `.this-window` button in the popup

**File**: `Javascripts/workspaceButtons.js`

### Workspace Popup Transparency / Element Bleed-Through (Vivaldi 7.8+)

**Symptom**: When opening the workspace dropdown popup, elements behind it show through - pinned tabs, auto-hide toolbar buttons, and other UI elements are visible through the popup background.

**Root Cause**: Vivaldi's popup transparency is controlled by the "Transparent Tab Bar" setting in Settings > Themes > Settings. When this setting is **OFF**, the workspace popup uses semi-transparent backgrounds. When **ON**, the popup becomes properly opaque (counterintuitively).

**CSS Workaround** (in `CSS/Layout/workspacebuttons.css`):
```css
/* Force opaque background on popup */
.WorkspacePopup {
  z-index: 2147483647 !important;
  background: var(--colorBg, #1e1e1e) !important;
  background-color: var(--colorBg, #1e1e1e) !important;
  backdrop-filter: none !important;
  opacity: 1 !important;
}

/* Suppress pinned tab hover effects when popup is open */
body:has(.WorkspacePopup) #tabs-container .tab-strip .is-pinned .tab-wrapper {
  z-index: 1 !important;
  pointer-events: none;
}

/* Suppress auto-hide toolbar items when popup is open */
body:has(.WorkspacePopup) .toolbar.toolbar-tabbar-before > *:not(.UrlBar-AddressField) {
  opacity: 0 !important;
  pointer-events: none !important;
}
```

**User-side fix**: Enable "Transparent Tab Bar" in Settings > Themes > Settings. Despite the name, this makes popups opaque.

**Why CSS workaround is imperfect**: The CSS cannot fully override Vivaldi's internal transparency handling. The `body:has()` selectors suppress interfering elements when the popup is open, but this is a bandaid.

**File**: `CSS/Layout/workspacebuttons.css`

### Dead Space on Right Edge of Panel (Vivaldi 7.8+)

**Symptom**: A horizontal bar or dead space appears to the right of the panel bar, preventing full window maximize and blocking clicks in that area.

**Cause**: The `Other/picture-in-picture.js` mod appended its host element to `document.documentElement` (the `<html>` element) instead of `document.body`, causing layout interference with the panel area.

**Fix**: Changed line 447 from:
```javascript
document.documentElement.appendChild(this.host_);
```
to:
```javascript
document.body.appendChild(this.host_);
```

**How we found it**: Binary search (bisect) through JS mods - disabled half at a time until the culprit was isolated.

**File**: `Javascripts/Other/picture-in-picture.js`

### CSS @import Case Sensitivity on Linux/WSL (Jan 2026)

**Symptom**: CSS files fail to load with `ERR_FAILED` in DevTools console. Example errors:
```
Addressbar.css:1 Failed to load resource: net::ERR_FAILED
NeatDial.css:1 Failed to load resource: net::ERR_FAILED
```

**Cause**: Linux and WSL filesystems are case-sensitive. CSS `@import` statements must match the exact filename case. Windows is case-insensitive, so mismatches work there but fail on Linux/WSL.

**Example**:
```css
/* core.css import */
@import "Layout/Addressbar.css";  /* FAILS - file is addressbar.css */
@import "Layout/addressbar.css";  /* WORKS */
```

**Fix**: Standardize all filenames to lowercase and ensure `core.css` imports match exactly.

**Prevention**: This repo uses lowercase filenames as the standard. When adding new CSS files:
1. Use lowercase filenames: `myfeature.css` not `MyFeature.css`
2. Use lowercase in imports: `@import "folder/myfeature.css";`
3. Test on Linux/WSL before committing

**Files renamed in Jan 2026 fix** (all CSS now lowercase):
- `Core.css` → `core.css`
- `Layout/Addressbar.css` → `Layout/addressbar.css`
- `Layout/NeatDial.css` → `Layout/neatdial.css`
- `Layout/FavouriteTabs.css` → `Layout/favouritetabs.css`
- `Layout/FindInPage.css` → `Layout/findinpage.css`
- `Layout/QuickCommand.css` → `Layout/quickcommand.css`
- `Layout/DownloadPanel.css` → `Layout/downloadpanel.css`
- `Layout/ExtensionsPanel.css` → `Layout/extensionspanel.css`
- `Layout/WorkspaceButtons.css` → `Layout/workspacebuttons.css`
- `Layout/NativeAutohidePolish.css` → `Layout/nativeautohidepolish.css`
- `Layout/ToolbarAutoHide.css` → `Layout/toolbarautohide.css`
- `EnhancedUX/BtnHoverAnime.css` → `EnhancedUX/btnhoveranime.css`
- `EnhancedUX/TabsTrail.css` → `EnhancedUX/tabstrail.css`
- `EnhancedUX/Quietify.css` → `EnhancedUX/quietify.css`
- `EnhancedUX/SelectableText.css` → `EnhancedUX/selectabletext.css`
- `JSIntegration/AccentMod.css` → `JSIntegration/accentmod.css`
- `JSIntegration/ArcPeek.css` → `JSIntegration/arcpeek.css`
- `JSIntegration/clearTabs.css` → `JSIntegration/cleartabs.css`
- `JSIntegration/tidyTabs.css` → `JSIntegration/tidytabs.css`
- `JSIntegration/workspaceButtons.css` → `JSIntegration/workspacebuttons.css`
- `AutoHide/Bookmarkbar.css` → `AutoHide/bookmarkbar.css`
- `AutoHide/Panel.css` → `AutoHide/panel.css`
- `AutoHide/StatusBar.css` → `AutoHide/statusbar.css`
- `PageAction/Follower-Tabs.js` → `PageAction/follower-tabs.js`
- `PageAction/TabsLock.js` → `PageAction/tabslock.js`
- `Other/Picture-in-Picture.js` → `Other/picture-in-picture.js`
- `ClearTabs.js` → `cleartabs.js`

## Source Repos (Reference)

- VivalArc: https://github.com/tovifun/VivalArc
- Awesome-Vivaldi: https://github.com/PaRr0tBoY/Awesome-Vivaldi
- VivaldiModManager: https://github.com/eximido/vivaldimodmanager
