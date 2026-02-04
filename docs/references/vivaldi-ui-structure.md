# Vivaldi UI Structure Reference

Quick reference for Vivaldi's DOM structure, useful for debugging CSS issues.

## Sidebar Tab Layout (Tabs on Left/Right)

```
#browser
├── .auto-hide-wrapper.left/.right     [CLIPS: overflow: hidden for rounded corners]
│   └── #tabs-tabbar-container
│       ├── .toolbar.toolbar-tabbar-before  [Toolbar row: URL bar, nav buttons, etc.]
│       │   ├── .UrlBar-AddressField        [URL bar container]
│       │   │   ├── .UrlBar-UrlFieldWrapper
│       │   │   │   └── .UrlBar-UrlField
│       │   │   │       └── .UrlFragment-Wrapper
│       │   │   ├── .OmniDropdown           [Autocomplete dropdown - can overflow]
│       │   │   └── .toolbar-insideinput    [Icons inside URL bar]
│       │   ├── .workspace-popup            [Workspace switcher button]
│       │   ├── .button-toolbar.extensions
│       │   ├── .button-toolbar.back/.forward/.reload/.home
│       │   └── [other toolbar buttons]
│       └── #tabs-container
│           ├── .tab-strip                  [Scrollable tab list]
│           │   ├── .tab.pinned             [Pinned tabs]
│           │   └── .tab                    [Regular tabs]
│           └── .newtab                     [New tab button]
└── #webview-container                      [Page content area]
```

## Top Address Bar Layout (Native Auto-Hide)

```
#browser
├── .auto-hide-wrapper.top              [CLIPS: overflow: hidden (fixed to visible)]
│   └── .mainbar / .toolbar-mainbar
│       ├── .UrlBar-AddressField
│       └── [toolbar buttons]
└── #main
    └── #webview-container
```

## Key Clipping Points

| Element | Rule | Why | Fix |
|---------|------|-----|-----|
| `.auto-hide-wrapper.left/right` | `overflow: hidden` | Rounded corners | `:has(:focus-within)` → `overflow: visible` |
| `.auto-hide-wrapper.top` | `overflow: visible` | Already fixed for trigger zone | N/A |
| `#webview-container` | `clip-path: inset(...)` | Content clipping (tabbar.css) | Disabled by default |

## URL Bar Selector Patterns

```css
/* Target URL bar in sidebar */
.toolbar-tabbar-before .UrlBar-AddressField { }

/* Target URL bar in top auto-hide */
.auto-hide-wrapper.top .UrlBar-AddressField { }

/* Target URL bar anywhere */
.UrlBar-AddressField { }

/* URL bar with focus */
.UrlBar-AddressField:focus-within { }

/* Autocomplete dropdown visible */
.UrlBar-AddressField:has(.OmniDropdown) { }
```

## Tab Selectors

```css
/* All tabs */
.tab-strip .tab { }

/* Pinned tabs only */
.tab-strip .tab.pinned { }
#tabs-container .pinned-tabs .tab { }

/* Active tab */
.tab-strip .tab.active { }

/* Tab in accordion/stack */
.tab-strip .tab.accordion { }
.tab-strip .tab-group { }
```

## Workspace Selectors

```css
/* Workspace popup button */
.workspace-popup { }

/* Workspace dropdown (React portal at document root) */
div[class*="WorkspacePopup"] { }

/* Individual workspace in dropdown */
div[class*="WorkspacePopup"] button { }
```

## Theme Detection Classes

| Class on `body` or `#browser` | Meaning |
|-------------------------------|---------|
| `.transparent-tabbar` | "Transparent Tab Bar" enabled in theme settings |
| `.theme-dark` | Dark theme active |
| `.theme-light` | Light theme active |
| `.acc-transparent` | Accent color is transparent |
| `.color-accent-from-page` | Accent color derived from page |

## Vivaldi Internal Variables

```css
/* Colors */
var(--colorBg)           /* Background */
var(--colorFg)           /* Foreground/text */
var(--colorAccentBg)     /* Accent background */
var(--colorAccentFg)     /* Accent foreground */
var(--colorBorder)       /* Borders */
var(--colorHighlightBg)  /* Selection/highlight */
var(--colorBgAlpha)      /* Semi-transparent background (transparent themes) */
var(--colorTabBar)       /* Tab bar background */

/* Layout */
var(--uiZoomLevel)       /* UI zoom multiplier */
```

## React Interaction Notes

Vivaldi uses React. Standard DOM events don't trigger state updates.

```javascript
// Get React props from DOM element
const getReactProps = (el) => {
  const key = Object.keys(el).find(k => k.startsWith('__reactProps'));
  return el[key];
};

// Trigger button click via React
const props = getReactProps(button);
if (props?.onPointerDown) {
  const event = new PointerEvent('pointerdown', { bubbles: true });
  event.persist = () => {};
  props.onPointerDown(event);
}
```

## Debugging Tips

1. **DevTools** (F12) → Elements → find element → check Computed styles
2. **Search for overflow** in Computed tab when content is clipped
3. **Check parent chain** - clipping is often on ancestor, not direct parent
4. **`:has()` support** - Vivaldi uses Chromium, `:has()` works
5. **`!important` wars** - Vivaldi uses `!important` internally; match it
