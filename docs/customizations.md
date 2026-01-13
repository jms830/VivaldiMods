# VivaldiMods Customizations

This document tracks all modifications we make to the upstream Awesome-Vivaldi CSS.
Each tweak should be applied and tested individually before moving to the next.

## Baseline

- **Source**: https://github.com/PaRr0tBoY/Awesome-Vivaldi
- **Location**: `CSS/` (repo root)
- **Date**: 2026-01-13

## Applied Tweaks

### 1. Hide Windows Header for Sidebar Tabs

**Problem**: Extra ~20px space above address bar when using sidebar tabs (`.tabs-left` / `.tabs-right`) on Windows. Right-clicking the space shows Windows window controls.

**Root Cause**: `Layout/main.css` sets `#header` height for Windows but never hides it for sidebar tab layouts.

**File**: `CSS/Layout/main.css`

**Fix**: Added to the existing `display: none` rule block:

```css
#browser.win:is(.tabs-left, .tabs-right):not(.is-settingspage) > #header {
  display: none;
}
```

**Status**: APPLIED 2026-01-13

---

### 2. Remove Toolbar Min-Height (Vivaldi 7.8+ Fix)

**Problem**: Blank space below address bar in Vivaldi 7.8+ snapshot caused by CSS forcing toolbar height that conflicts with Vivaldi's native auto-hide.

**Root Cause**: This rule in `Layout/main.css` forced a minimum height:

```css
/* REMOVED - caused blank space in Vivaldi 7.8+ */
#browser:not(.address-top-off, .address-bottom-off, .address-bottom)
  .mainbar
  > .toolbar-mainbar {
  min-height: calc(34px / var(--uiZoomLevel));
}
```

**File**: `CSS/Layout/main.css`

**Fix**: Removed the entire rule block.

**Status**: APPLIED 2026-01-13

---

### 3. Disable AutoHide CSS Modules

**Problem**: Vivaldi 7.8+ has native Auto-hide UI (Settings > Appearance > Auto-hide UI). Our CSS AutoHide modules conflict with it.

**File**: `CSS/Core.css`

**Fix**: Commented out all AutoHide imports:

```css
/* Disabled - Vivaldi 7.8+ has native AutoHide (Settings > Appearance > Auto-hide UI) */
/* @import "AutoHide/AdaptiveBF.css"; */
/* @import "AutoHide/Tabbar.css"; */
/* @import "AutoHide/Bookmarkbar.css"; */
/* @import "AutoHide/Panel.css"; */
/* @import "AutoHide/StatusBar.css"; */
```

**Status**: APPLIED 2026-01-13

---

### 4. Differentiate Tidy vs Clear AI Buttons

**Problem**: Both AI buttons (Tidy Tabs and Clear Tabs) looked identical, confusing users.

**Files**: 
- `CSS/JSIntegration/tidyTabs.css` - Blue theme (`#4a9eff`) with border
- `CSS/JSIntegration/clearTabs.css` - Red theme (`#ff6b6b`) with border

**Status**: APPLIED 2026-01-13

---

## Pending Tweaks (Lower Priority)

### Address Bar Field Height (32px pill)

**Problem**: Address bar pill could be more compact.

**Proposed Fix**:
```css
.UrlBar-AddressField {
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
}
```

**Status**: NOT YET APPLIED - Test other changes first

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
| `CSS/Layout/Addressbar.css` | Address bar styling |
| `CSS/AutoHide/*.css` | Auto-hide features (disabled for 7.8+) |
| `CSS/JSIntegration/*.css` | CSS for JS-dependent features |

---

## Vivaldi 7.8+ Compatibility Notes

Vivaldi 7.8 snapshot introduced **native Auto-hide UI** which makes our AutoHide CSS modules redundant. Key changes:

1. **Use Vivaldi's native auto-hide**: Settings > Appearance > Auto-hide UI
2. **Our CSS disabled**: `AutoHide/Tabbar.css`, `Bookmarkbar.css`, `Panel.css`, `StatusBar.css`, `AdaptiveBF.css`
3. **Still active**: Arc-style polish - `FavouriteTabs.css`, `TabsTrail.css`, `Quietify.css`, `BtnHoverAnime.css`
4. **Known issue**: Vivaldi's native autohide doesn't get CSS rounding/transparency polish from our themes
