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

### OmniDropdown (URL Autocomplete) Clipping at Sidebar Edge (Vivaldi 7.8+, Feb 2026)

**Symptom**: When typing in the URL bar with tabs on left/right, the autocomplete dropdown (OmniDropdown) is clipped at the sidebar edge instead of extending into the content area.

**Root Cause**: TWO separate issues creating **containing blocks** that clip positioned descendants:

1. **selectSearch.js**: `transform: translateY(-5px)` on `.search-engines-in-address-bar`
2. **nativeautohidepolish.css**: `backdrop-filter: blur(12px)` on `.auto-hide-wrapper`

Both `transform` and `backdrop-filter` create **stacking contexts** and **containing blocks**, which clip `position: absolute` descendants (OmniDropdown).

**CSS Properties That Create Containing Blocks**:
- `transform` (any value except `none`)
- `filter` / `backdrop-filter` (any value except `none`)
- `will-change: transform` or `will-change: filter`
- `perspective` (any value except `none`)
- `contain: paint` or `contain: layout`

**Solution**:

1. **Disable selectSearch.js** (user preference - adds clutter to dropdown):
   ```bash
   # In custom.js, comment out the selectSearch.js section:
   sed -i '11866s|^|/* DISABLED: |; 12314s|$| */|' \
     "/mnt/c/Users/jordans/AppData/Local/Vivaldi/Application/<version>/resources/vivaldi/custom.js"
   ```

2. **CSS Fix** (already in `nativeautohidepolish.css` lines 157-167):
   ```css
   .auto-hide-wrapper.left:has(.OmniDropdown),
   .auto-hide-wrapper.right:has(.OmniDropdown),
   .auto-hide-wrapper.top:has(.OmniDropdown) {
     overflow: visible !important;
     backdrop-filter: none !important;
     -webkit-backdrop-filter: none !important;
   }
   ```

**How we found it**:
1. Disabled all CSS → clipping persisted → suspected JS mod
2. Bisected JS mods → isolated selectSearch.js
3. Disabling selectSearch helped but didn't fix 100% → suspected CSS too
4. Searched for `backdrop-filter` in active CSS → found `.auto-hide-wrapper`
5. Added `.top` to existing fix (was only `.left` and `.right`)

**Key Insight**: When debugging clipping issues, always check for properties that create containing blocks, not just `overflow: hidden` or `clip-path`.

**Files**:
- `CSS/Layout/nativeautohidepolish.css` (lines 157-167)
- `Javascripts/Tam710562/selectSearch.js` (disable in custom.js)

### Ghosted/Doubled URL Text with Toolbar AutoHide (Vivaldi 7.9+, Feb 2026)

**Symptom**: URL text (e.g., "google.com") appears doubled/ghosted in the address bar — two overlapping copies of the same text, making it unreadable. Only occurs when `toolbarautohide.css` is enabled.

**Root Cause**: The toolbar auto-hide rule at line 19 sets `opacity: 0` on all direct children of the toolbar. The `.UrlBar-AddressField` is correctly exempted with `opacity: 1`. However, a separate rule was also forcing `opacity: 1 !important` on internal address bar children (`.UrlBar-AddressField > *`, `.UrlBar-UrlFieldWrapper`, `.UrlBar-UrlField`). This made Vivaldi's normally-hidden page-title/hostname overlay visible alongside the editable URL input, creating the doubled text.

**Fix**: Remove `opacity: 1 !important` from the URL bar internal elements rule. The parent `.UrlBar-AddressField` already has `opacity: 1`, so children inherit visibility naturally. Only `min-height`, `max-height`, and `overflow` overrides are needed on the internals.

**Before** (broken):
```css
.toolbar.toolbar-tabbar-before .UrlBar-UrlFieldWrapper,
.toolbar.toolbar-tabbar-before .UrlBar-UrlFieldWrapper > .observer,
.toolbar.toolbar-tabbar-before .UrlBar-UrlField {
  opacity: 1 !important;        /* CAUSES GHOSTING — remove */
  min-height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}
```

**After** (fixed):
```css
.toolbar.toolbar-tabbar-before .UrlBar-UrlFieldWrapper,
.toolbar.toolbar-tabbar-before .UrlBar-UrlFieldWrapper > .observer,
.toolbar.toolbar-tabbar-before .UrlBar-UrlField {
  min-height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}
```

**Key Insight**: When overriding toolbar auto-hide, only force sizing/overflow on address bar internals — never force `opacity`. Vivaldi uses internal opacity toggling to show/hide overlapping URL display layers (editable input vs formatted hostname). Forcing `opacity: 1` on all of them defeats that mechanism.

**File**: `CSS/Layout/toolbarautohide.css` (lines 37-46)

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

## Configuration Guide

### Toolbar AutoHide Granular Controls (Jan 2026)

**File**: `CSS/Layout/toolbarautohide.css`

The toolbar autohide feature hides elements in the sidebar toolbar (`.toolbar-tabbar-before`) until you hover. By default, ONLY the address bar and workspace popup remain visible.

**Granular Controls** - Add these CSS variables to `CSS/core.css` `:root` section to control individual element visibility in collapsed state:

| Variable | Element | Default |
|----------|---------|---------|
| `--toolbar-show-extensions` | Extensions button | `0` (hidden) |
| `--toolbar-show-navigation` | Back, Forward, Reload, Home buttons | `0` (hidden) |
| `--toolbar-show-pageactions` | Page actions button | `0` (hidden) |
| `--toolbar-show-readermode` | Reader mode button | `0` (hidden) |
| `--toolbar-show-bookmarks` | Bookmarks button | `0` (hidden) |
| `--toolbar-show-downloads` | Downloads button | `0` (hidden) |
| `--toolbar-show-settings` | Settings button | `0` (hidden) |
| `--toolbar-show-vbutton` | Vivaldi menu button | `0` (hidden) |

**Always Visible** (non-configurable):
- Address bar (`.UrlBar-AddressField`)
- Workspace popup button (`.workspace-popup`)

**To show an element in collapsed state**, change its value from `0` to `1`:

```css
:root {
  --toolbar-show-navigation: 1;  /* Show back/forward/reload/home */
  --toolbar-show-downloads: 1;   /* Show downloads button */
}
```

**Behavior**:
- **Collapsed**: Only configured elements + address bar + workspace popup visible
- **Expanded** (on hover): ALL elements visible regardless of configuration
- **Focused**: ALL elements visible when address bar has focus

**What This Controls**: Elements in the toolbar ROW (horizontal bar above tabs in sidebar), NOT the tabbar itself or the top address bar when using native autohide.

---

### Zen Browser Address Bar Styling (Feb 2026)

**File**: `CSS/Layout/addressbar.css`

Zen Browser-inspired address bar with pill-shaped design, generous padding, and clean elevation.

**Configuration** - Add these CSS variables to `CSS/core.css` `:root` section:

| Variable | Default | Description |
|----------|---------|-------------|
| `--zen-addressbar-enabled` | `on` | Enable/disable Zen styling |
| `--zen-addressbar-radius` | `16px` | Border radius (pill shape) |
| `--zen-addressbar-padding` | `12px 18px` | Internal padding |
| `--zen-addressbar-bg` | `rgba(255,255,255,0.06)` | Base background |
| `--zen-addressbar-bg-hover` | `rgba(255,255,255,0.08)` | Hover background |
| `--zen-addressbar-bg-focus` | `#2a2a2a` | Focus background |
| `--zen-addressbar-shadow` | `0 2px 8px rgba(0,0,0,0.15)` | Base shadow |
| `--zen-addressbar-shadow-focus` | `0 8px 24px rgba(0,0,0,0.3)` | Focus shadow |

**To disable Zen styling**, set:
```css
:root {
  --zen-addressbar-enabled: off;
}
```

**Key Features**:
- **Pill shape**: Heavy border-radius (16px default) for modern, rounded look
- **Generous padding**: 12px vertical, 18px horizontal for breathing room
- **Lighter background**: Subtle background distinct from sidebar
- **Hover feedback**: Background lightens on hover
- **Focus elevation**: Enhanced shadow and background on focus
- **Clean transitions**: Smooth animations using `--animation-speed`

**Behavior**:
- **Default state**: Subtle background with light shadow
- **Hover**: Background lightens, shadow deepens
- **Focus**: Prominent background and deep shadow for clear focus indication

**Customization Example**:
```css
:root {
  --zen-addressbar-radius: 20px;  /* More pill-like */
  --zen-addressbar-padding: 14px 20px;  /* More generous */
  --zen-addressbar-bg: rgba(255,255,255,0.1);  /* Lighter background */
}
```

**Transparent Tabbar Integration**: When "Transparent Tab Bar" is enabled in Settings > Themes > Settings, the address bar automatically uses `backdrop-filter: blur()` and semi-transparent background to match the rest of the UI. This overrides the Zen solid backgrounds with glass-like transparency.

---

### Transparent Tabbar Mode (Feb 2026)

**Trigger**: Enable "Transparent Tab Bar" in Settings > Themes > Settings. Vivaldi adds `.transparent-tabbar` class to body.

**What gets transparency**:
- Auto-hide wrappers (sidebar, top address bar)
- Address bar (`.UrlBar-AddressField`)
- Workspace popup dropdown

**CSS Pattern**:
```css
.transparent-tabbar .element {
  background-color: var(--colorBgAlpha, rgba(30, 30, 30, 0.85)) !important;
  backdrop-filter: blur(12px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
}
```

**Files implementing this**:
- `CSS/Layout/nativeautohidepolish.css` - Auto-hide wrappers
- `CSS/Layout/addressbar.css` - Address bar
- `CSS/Layout/workspacebuttons.css` - Workspace popup

## Code Standards & Best Practices

### CSS Guidelines

#### Use CSS Variables for Timing

All animations and transitions MUST use the timing variables defined in `core.css`:

```css
:root {
  --slow-animation-speed: 560ms;  /* Major transitions, panel slides */
  --animation-speed: 260ms;        /* Default, most UI interactions */
  --fast-animation-speed: 140ms;   /* Hover effects, micro-interactions */
}
```

**Do:**
```css
transition: opacity var(--animation-speed) ease-out;
```

**Don't:**
```css
transition: opacity 0.3s ease-out;  /* Hardcoded - avoid */
```

#### Z-Index Scale (MANDATORY)

Use semantic z-index values. NEVER use arbitrary large numbers.

| Variable | Value | Use Case |
|----------|-------|----------|
| `--z-base` | 1 | Default stacking |
| `--z-hover` | 10 | Hover states, highlights |
| `--z-dropdown` | 100 | Dropdown menus, tooltips |
| `--z-sticky` | 200 | Sticky headers, pinned elements |
| `--z-modal` | 300 | Modals, dialogs |
| `--z-popup` | 400 | Popups, popovers |
| `--z-tooltip` | 500 | Tooltips (highest user content) |
| `--z-overlay` | 1000 | Full-screen overlays |

**Do:**
```css
.dropdown { z-index: var(--z-dropdown); }
```

**Don't:**
```css
.dropdown { z-index: 999999999 !important; }  /* Never do this */
```

#### Minimize `!important`

Current codebase has 690+ `!important` declarations (tech debt). For new code:

1. **First attempt**: Increase selector specificity
2. **Second attempt**: Use `:where()` or `:is()` to manage specificity
3. **Last resort**: Use `!important` with a comment explaining why

**When `!important` is acceptable:**
- Overriding Vivaldi's internal styles (they use `!important`)
- Utility classes that must always win
- Accessibility overrides

**Document it:**
```css
/* !important required: Vivaldi sets this with !important internally */
.my-override { display: none !important; }
```

#### File Size Limits

- **Max 500 lines per CSS file** - Split larger files into logical modules
- Current `tabbar.css` (1548 lines) is tech debt; new features should be separate files

#### Color Variables

Use Vivaldi's color system, never hardcode colors:

```css
/* Vivaldi provides these */
var(--colorBg)           /* Background */
var(--colorFg)           /* Foreground/text */
var(--colorAccentBg)     /* Accent background */
var(--colorAccentFg)     /* Accent foreground */
var(--colorBorder)       /* Borders */
var(--colorHighlightBg)  /* Selection/highlight */
```

### JavaScript Guidelines

#### Cleanup Pattern (MANDATORY for all JS mods)

Every JS mod MUST implement cleanup to prevent memory leaks:

```javascript
(function myMod() {
  'use strict';

  const modState = {
    listeners: [],
    observers: [],
    timeouts: [],
    intervals: [],
    chromeListeners: [],
    
    addEventListener(target, event, handler, options) {
      target.addEventListener(event, handler, options);
      this.listeners.push({ target, event, handler, options });
    },
    
    addObserver(target, callback, options) {
      const observer = new MutationObserver(callback);
      observer.observe(target, options);
      this.observers.push(observer);
      return observer;
    },
    
    setTimeout(callback, delay) {
      const id = setTimeout(callback, delay);
      this.timeouts.push(id);
      return id;
    },
    
    setInterval(callback, delay) {
      const id = setInterval(callback, delay);
      this.intervals.push(id);
      return id;
    },
    
    addChromeListener(api, event, handler) {
      api[event].addListener(handler);
      this.chromeListeners.push({ api, event, handler });
    },
    
    cleanup() {
      this.listeners.forEach(({ target, event, handler, options }) => {
        target.removeEventListener(event, handler, options);
      });
      this.observers.forEach(obs => obs.disconnect());
      this.timeouts.forEach(id => clearTimeout(id));
      this.intervals.forEach(id => clearInterval(id));
      this.chromeListeners.forEach(({ api, event, handler }) => {
        api[event].removeListener(handler);
      });
      // Reset arrays
      this.listeners = [];
      this.observers = [];
      this.timeouts = [];
      this.intervals = [];
      this.chromeListeners = [];
    }
  };

  const init = () => {
    // Use modState.addEventListener, modState.setTimeout, etc.
    // instead of direct addEventListener, setTimeout, etc.
    
    window.addEventListener('beforeunload', () => modState.cleanup());
  };

  // Wait for browser element
  setTimeout(function wait() {
    if (document.getElementById('browser')) {
      init();
    } else {
      setTimeout(wait, 300);
    }
  }, 300);
})();
```

#### Interacting with Vivaldi's React UI

Vivaldi's UI is React-based. Standard DOM events don't trigger React state updates.

**Pattern for clicking React buttons:**
```javascript
const getReactProps = (element) => {
  const key = Object.keys(element).find(k => k.startsWith('__reactProps'));
  return element[key];
};

const simulateReactClick = (element) => {
  const pointerDown = new PointerEvent('pointerdown', {
    view: window, bubbles: true, cancelable: true,
    buttons: 0, pointerType: 'mouse',
  });
  pointerDown.persist = () => {};  // Required for React event pooling
  
  const props = getReactProps(element);
  if (props?.onPointerDown) {
    props.onPointerDown(pointerDown);
    element.dispatchEvent(new PointerEvent('pointerup', { ... }));
    return true;
  }
  return false;
};
```

**Key insights:**
- React uses `onPointerDown`, not `onClick`, for toolbar buttons
- Popup menus render via React portals at document root
- Always check for `__reactProps` key on elements

#### Avoid Polling When Possible

**Don't:**
```javascript
setInterval(checkForChanges, 1000);  // Wasteful polling
```

**Do:**
```javascript
// Use MutationObserver for DOM changes
modState.addObserver(document.body, (mutations) => {
  // React to specific changes
}, { childList: true, subtree: true });

// Use chrome.tabs events for tab changes
modState.addChromeListener(chrome.tabs, 'onActivated', handler);
```

#### Async Operations

Cache expensive async results instead of fetching on every use:

```javascript
let cachedData = null;

const refreshCache = () => {
  vivaldi.prefs.get('some.pref', (data) => {
    cachedData = data;
  });
};

// Call refreshCache at init and on relevant events
// Use cachedData in hot paths instead of re-fetching
```

### File Naming

- **All lowercase**: `myfeature.css`, `mymod.js`
- **Kebab-case for multi-word**: `workspace-buttons.css`
- **No spaces or special characters**
- **Reason**: Linux/WSL filesystems are case-sensitive; mismatched case breaks `@import`

### Adding New Features Checklist

1. [ ] CSS uses timing variables (`--animation-speed`, etc.)
2. [ ] CSS uses z-index scale variables
3. [ ] CSS avoids `!important` where possible (document if required)
4. [ ] CSS file under 500 lines (split if larger)
5. [ ] JS implements `modState` cleanup pattern
6. [ ] JS uses event-driven updates, not polling
7. [ ] Filename is lowercase
8. [ ] Tested on both Windows and Linux/WSL

## Known Tech Debt

### `!important` Declarations (692 total)

Most are **necessary** to override Vivaldi's internal styles. Distribution by file:

| File | Count | Status |
|------|-------|--------|
| `AutoHide/tabbar.css` | 249 | Legacy (disabled by default) |
| `Layout/favouritetabs.css` | 154 | Required for pinned tabs |
| `Layout/addressbar.css` | 38 | Required for URL bar styling |
| `Layout/nativeautohidepolish.css` | 28 | Required for native auto-hide |
| Other files | 223 | Mixed necessity |

**Policy**: Do not remove existing `!important` without testing. Vivaldi's internal CSS uses `!important` extensively, so our overrides must match.

### Large Files

| File | Lines | Status |
|------|-------|--------|
| `AutoHide/tabbar.css` | 1,548 | Legacy, well-organized with @container queries |

**Policy**: `tabbar.css` is disabled by default (Vivaldi 7.8+ has native auto-hide). Keep as-is for users who need custom auto-hide behavior.

### Two-Level Tab Stack Peek (Optional Feature - Jan 2026)

**File**: `CSS/Layout/twolevel-tabstack.css`

**Purpose**: For users with 2-level tab stacks (Settings > Tabs > Tab Stacking > Two-Level), this creates an interactive hover-to-expand behavior where hovering over one level expands it while shrinking the other.

**How it works**:
- Main tabs container starts at 18% width, expands to 82% on hover
- Secondary tabs shrink from 82% to 18% when main is hovered (and vice versa)
- Uses CSS container queries to hide toolbar buttons when collapsed
- 300ms delay before expanding for intentional hover detection

**To enable**: Uncomment in `core.css`:
```css
@import "Layout/twolevel-tabstack.css";
```

**Note**: Only useful if you have 2-level tab stacks enabled in Vivaldi settings. Disabled by default since most users don't use this feature.

**Source**: Ported from upstream `Bettert2LevelTabStack.css` (commit 4bb4cb9)

---

### Remove Clutter Module (Jan 2026)

**File**: `CSS/EnhancedUX/removeclutter.css`

**Purpose**: General UI cleanup by hiding rarely-used elements. Separate from `quietify.css` which specifically handles audio/media icons.

**What it hides**:
- Scrollbars in vertical tab bars
- WorkspacePopup scrollbar
- Update notification toolbar
- Tabs-locked/unlocked buttons

**Relationship to quietify.css**:
| File | Purpose |
|------|---------|
| `quietify.css` | Hides audio/media icons on tabs |
| `removeclutter.css` | Hides other UI clutter (scrollbars, update notifications, lock buttons) |

Both are enabled by default. Disable either in `core.css` if you need those UI elements.

**Source**: Ported from upstream `RemoveClutter.css` (commit 4bb4cb9)

---

### Improved Auto-Hide Transitions (Jan 2026)

**File**: `CSS/Layout/nativeautohidepolish.css`

**Enhancement**: Added differentiated easing curves for show vs hide states to make auto-hide animations feel more polished.

**Before**: Same transition for both show and hide
**After**: 
- **Hide state**: `cubic-bezier(.4, 0, .6, 1)` - smooth deceleration
- **Show state**: `cubic-bezier(.25, .8, .25, 1.03)` - slight overshoot for snappy feel

The show transition has a subtle overshoot (1.03 > 1.0) that creates a more responsive "snap into place" feel when panels appear.

**Source**: Merged from upstream `BetterAutoHide.css` (commit 4bb4cb9)

---

### Command Chain Icons: SVG Color for Dark/Light Themes (Jan 2026)

**Symptom**: Custom icons set via the Command Chain Icon Picker appear dark/black on dark themes instead of matching toolbar button colors (white).

**Root Cause**: SVG icons use `fill="currentColor"` which works in inline SVGs but **NOT in data URLs**. When an SVG is encoded as a data URL (`data:image/svg+xml,...`) and used in an `<img>` tag or CSS background, `currentColor` has no CSS context to inherit from and defaults to black.

**What DOESN'T Work**:
- `fill="currentColor"` in data URL SVGs - no inheritance context
- CSS `filter` on the image - unreliable across themes
- `--colorFg` from `:root` - may not reflect actual toolbar button color

**What WORKS**:
```javascript
function getThemeForegroundColor() {
  const selectors = [
    '.toolbar-mainbar .button-toolbar',
    '.toolbar .button-toolbar',
    '.toolbar .toolbar-button',
    '.toolbar',
    '#browser',
    'body'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (!el) continue;
    const computed = getComputedStyle(el);
    const colorVar = computed.getPropertyValue('--colorFg').trim();
    if (colorVar) return colorVar;
    const color = computed.color?.trim();
    if (color && color !== 'rgba(0, 0, 0, 0)') return color;
  }

  return '#ffffff';
}

function normalizeSvg(svgContent, fillColor = null) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  
  if (!svgEl) return svgContent;
  
  // Ensure consistent sizing
  if (!svgEl.getAttribute('viewBox')) {
    svgEl.setAttribute('viewBox', '0 0 24 24');
  }
  svgEl.removeAttribute('width');
  svgEl.removeAttribute('height');
  
  // Replace ALL fills with actual theme color (not currentColor)
  const color = fillColor || getThemeForegroundColor();
  
  svgEl.querySelectorAll('[fill]').forEach(el => {
    if (el.getAttribute('fill') !== 'none') {
      el.setAttribute('fill', color);
    }
  });
  
  // Add fill to paths without explicit fill
  svgEl.querySelectorAll('path, circle, rect, polygon').forEach(path => {
    if (!path.getAttribute('fill') && !path.getAttribute('stroke')) {
      path.setAttribute('fill', color);
    }
  });
  
  return new XMLSerializer().serializeToString(svgEl);
}
```

**Key Insights**:
1. Sample actual toolbar button color, not just CSS variables from root
2. Replace `currentColor` with the actual hex/rgb value before encoding
3. Icons need to be re-saved after theme changes (color is baked into data URL)
4. Normalize `viewBox` and remove explicit dimensions for consistent sizing

**File**: `Javascripts/commandChainIcons.js`

---

### TidyTabs: Non-Default Prompt Templates Fail (Jan 2026)

**Symptom**: TidyTabs AI grouping works with the default prompt template, but fails with other templates (Domain-Focused, Semantic Topics, Custom). Console shows "AI returned invalid JSON" errors.

**Root Cause**: The `parseJSONResponse()` function had a regex that blindly quoted ALL word characters followed by colons:
```javascript
.replace(/(\w+):/g, '"$1":')
```

This was intended to fix unquoted keys like `{name: "value"}`, but it ALSO corrupted already-valid JSON:
- Input: `{"name": "test"}`
- After regex: `{""name"": "test"}` ← INVALID

The subsequent "fix" `.replace(/""+/g, '"')` was incomplete and couldn't fully recover.

**Fix**: Replace the greedy regex with a pattern that only matches ACTUALLY unquoted keys:
```javascript
// Only match keys after { or , that aren't already quoted
jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3');
```

This regex:
- Captures the delimiter (`{` or `,`) and any whitespace
- Captures the unquoted key (word starting with letter/underscore)
- Captures the colon and any whitespace
- Only matches if key is NOT already in quotes (because `"name"` doesn't match `[a-zA-Z_]\w*` after `,\s*`)

**File**: `Javascripts/tidyTabs.js`, function `parseJSONResponse()` around line 1225

## Source Repos (Reference)

- VivalArc: https://github.com/tovifun/VivalArc
- Awesome-Vivaldi: https://github.com/PaRr0tBoY/Awesome-Vivaldi
- VivaldiModManager: https://github.com/eximido/vivaldimodmanager
