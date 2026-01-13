# VivaldiMods Customizations

This document tracks all modifications we make to the upstream Awesome-Vivaldi CSS.
Each tweak should be applied and tested individually before moving to the next.

## Baseline

- **Source**: https://github.com/PaRr0tBoY/Awesome-Vivaldi
- **Location**: `CSS/` (repo root)
- **Date**: 2026-01-13

## Tweaks to Apply

### 1. Hide Windows Header for Sidebar Tabs (PRIORITY)

**Problem**: Extra ~20px space above address bar when using sidebar tabs (`.tabs-left` / `.tabs-right`) on Windows. Right-clicking the space shows Windows window controls.

**Root Cause**: `Layout/main.css` sets `#header` height for Windows but never hides it for sidebar tab layouts.

**File**: `CSS/Layout/main.css`

**Fix**: Added to the existing `display: none` rule block (line 49-55):

```css
#browser:not(.is-settingspage).fullscreen > #header,
#browser:not(.is-settingspage):not(.address-top).tabs-bottom > #header,
#browser:not(.is-settingspage).tabs-off.address-top > #header,
.color-behind-tabs-off:not(.is-settingspage).tabs-bottom #header,
#browser.win:is(.tabs-left, .tabs-right):not(.is-settingspage) > #header {
  display: none;
}
```

**Status**: APPLIED 2026-01-13

---

### 2. Compact Toolbar Height (44px Zen-style)

**Problem**: Default toolbar is taller than Zen browser's 44px.

**File**: `CSS/Layout/main.css` (line ~23)

**Current**:
```css
#browser:not(.address-top-off, .address-bottom-off, .address-bottom)
  .mainbar
  > .toolbar-mainbar {
  min-height: calc(34px / var(--uiZoomLevel));
}
```

**Proposed Fix**: Override or modify to force 44px height.

**Status**: NOT YET APPLIED - Test header fix first

---

### 3. Address Bar Field Height (32px pill)

**Problem**: Address bar pill could be more compact.

**Proposed Fix**:
```css
.UrlBar-AddressField {
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
}
```

**Status**: NOT YET APPLIED - Lower priority

---

## Tweaks That Did NOT Work

### Core.css Override Approach

Tried adding overrides at the end of generated `Core.css` to hide `#header`:

```css
#browser.win:is(.tabs-left, .tabs-right):not(.is-settingspage) > #header {
  display: none !important;
  min-height: 0 !important;
  height: 0 !important;
}
```

**Result**: Did not work. The CSS specificity or cascade order in `main.css` seems to override these rules even with `!important`. Direct modification of `main.css` is required.

---

## Testing Procedure

1. Make ONE change to vendor files
2. Restart Vivaldi
3. Check if issue is fixed AND no new issues introduced
4. If good, commit with clear message
5. If bad, revert and document why it failed
6. Move to next tweak

---

## File Reference

| File | Purpose |
|------|---------|
| `CSS/Core.css` | Entry point, imports modules |
| `CSS/Layout/main.css` | Core layout, header, toolbar |
| `CSS/Layout/addressbar.css` | Address bar styling |
| `CSS/AutoHide/*.css` | Auto-hide features |
