# Vivaldi Modpack Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a ModManager-ready Vivaldi modpack that combines VivalArc CSS theming with Awesome-Vivaldi's modular CSS/JS architecture.

**Architecture:** Single repo with `user_mods/css/` and `user_mods/js/` directories matching VivaldiModManager's expected layout. A central `core.css` imports all CSS modules. JS mods are optional and loaded via ModManager's injection system.

**Tech Stack:** CSS3 (custom properties, @import), JavaScript (ES6+), VivaldiModManager (C#/.NET)

---

## Task 1: Create ModManager-Compatible Directory Structure

**Files:**
- Create: `user_mods/css/core.css`
- Create: `user_mods/css/base/vivalarc-base.css`
- Create: `user_mods/css/modules/` (directory)
- Create: `user_mods/js/` (directory)
- Create: `README.md` (new unified readme)

**Step 1: Create the directory structure**

```bash
mkdir -p user_mods/css/base
mkdir -p user_mods/css/modules
mkdir -p user_mods/js
```

**Step 2: Verify structure exists**

Run: `ls -la user_mods/`
Expected: `css/` and `js/` directories present

**Step 3: Commit skeleton**

```bash
git init
git add user_mods/
git commit -m "chore: create ModManager-compatible directory structure"
```

---

## Task 2: Extract and Refactor VivalArc Base CSS

**Files:**
- Read: `VivalArc-main/vivalarc.css`
- Create: `user_mods/css/base/vivalarc-base.css`
- Create: `user_mods/css/base/variables.css`

**Step 1: Create variables.css with all CSS custom properties**

Extract `:root` block from `VivalArc-main/vivalarc.css` into standalone file:

```css
/* user_mods/css/base/variables.css */
/* VivalArc + Awesome-Vivaldi unified variables */
/* version: 2.0.0 */

:root {
    /* === Window & Layout === */
    --window-border: 10px;
    --mac-header: calc(var(--window-border) + 0px);
    --win-header: calc(var(--window-border) + 0px);
    --linux-header: calc(var(--window-border) + 0px);
    --addressbar-height: 36px;
    
    /* === Window Buttons === */
    --window-button-scale: 0.8;
    --window-button-opacity: 0.3;
    --tab-padding: calc(var(--window-border) / 2);
    
    /* === Shadows === */
    --webview-shadow-light: 0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 0px var(--window-border) 0px rgba(0, 0, 0, 0.10);
    --webview-shadow-dark: 0px 2px 2px 0px rgba(0, 0, 0, 0.05), 0px 2px 8px 0px rgba(0, 0, 0, 0.05), 0px 0px 0px 1.2px #ffffff18;
    
    /* === Pinned Tabs Grid === */
    --pinned-column-count: 4;
    --pinned-sticky-enabled: 1;
    --pinned-background: var(--colorTabBar);
    --pinned-separator-color: var(--colorBorder);
    --pinned-separator-width: 1px;
    --pinned-grid-gap: 4px;
    --pinned-grid-padding: 4px;
    --pinned-icon-bg: var(--colorAccentBgAlpha);
    --pinned-icon-bg-hover: var(--colorAccentBg);
    --pinned-icon-bg-active: var(--colorBg);
    --pinned-icon-border-active: var(--colorAccentBg);
    --pinned-icon-radius: var(--radiusHalf);
    --pinned-transition-speed: 0.15s;
    
    /* === Compact Mode === */
    --compact-mode-enabled: 0;
    --compact-sidebar-width: 60px;
    --normal-sidebar-width: 200px;
    --compact-transition-speed: 0.2s;
    
    /* === Feature Toggles (1=on, 0=off) === */
    --feature-autohide-addressbar: 0;
    --feature-autohide-panel: 0;
    --feature-autohide-bookmarks: 0;
}
```

**Step 2: Create vivalarc-base.css with core styles (no variables)**

Copy `VivalArc-main/vivalarc.css` to `user_mods/css/base/vivalarc-base.css`, removing the `:root` block (it's now in variables.css).

**Step 3: Verify files created**

Run: `ls -la user_mods/css/base/`
Expected: `variables.css` and `vivalarc-base.css` present

**Step 4: Commit base CSS**

```bash
git add user_mods/css/base/
git commit -m "feat: extract VivalArc base CSS with separated variables"
```

---

## Task 3: Create Core.css Import Hub

**Files:**
- Create: `user_mods/css/core.css`

**Step 1: Create core.css with modular imports**

```css
/* user_mods/css/core.css */
/* Unified Vivaldi Modpack - Main Entry Point */
/* version: 2.0.0 */
/* 
 * Point VivaldiModManager or Vivaldi's Custom UI Modifications to this folder.
 * Toggle features by commenting/uncommenting @import lines below.
 */

/* === BASE (required) === */
@import url('base/variables.css');
@import url('base/vivalarc-base.css');

/* === MODULES (optional - uncomment to enable) === */
/* @import url('modules/autohide-addressbar.css'); */
/* @import url('modules/autohide-panel.css'); */
/* @import url('modules/autohide-bookmarks.css'); */
/* @import url('modules/compact-mode.css'); */
/* @import url('modules/arc-peek.css'); */
/* @import url('modules/colorful-tabs.css'); */
/* @import url('modules/clean-newtab.css'); */

/* === THEMES (pick one) === */
/* @import url('themes/arc-light.css'); */
/* @import url('themes/arc-dark.css'); */
/* @import url('themes/reflect-purple.css'); */
```

**Step 2: Verify core.css created**

Run: `cat user_mods/css/core.css | head -20`
Expected: Import statements visible

**Step 3: Commit core.css**

```bash
git add user_mods/css/core.css
git commit -m "feat: add core.css import hub for modular CSS loading"
```

---

## Task 4: Create Autohide Modules (from Awesome-Vivaldi patterns)

**Files:**
- Create: `user_mods/css/modules/autohide-addressbar.css`
- Create: `user_mods/css/modules/autohide-panel.css`
- Create: `user_mods/css/modules/autohide-bookmarks.css`

**Step 1: Create autohide-addressbar.css**

```css
/* user_mods/css/modules/autohide-addressbar.css */
/* Auto-hide address bar - shows on hover */

#browser:not(.address-top) .UrlBar {
    transition: opacity var(--compact-transition-speed) ease,
                transform var(--compact-transition-speed) ease;
}

#browser:not(.address-top):not(:hover) .UrlBar {
    opacity: 0;
    transform: translateY(-100%);
    pointer-events: none;
}

#browser:not(.address-top):hover .UrlBar {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}
```

**Step 2: Create autohide-panel.css**

```css
/* user_mods/css/modules/autohide-panel.css */
/* Auto-hide panel - expands on hover */

#panels-container {
    transition: width var(--compact-transition-speed) ease;
}

#panels-container:not(:hover):not(:focus-within) {
    width: 0 !important;
    overflow: hidden;
}

#panels-container:hover,
#panels-container:focus-within {
    width: auto !important;
}
```

**Step 3: Create autohide-bookmarks.css**

```css
/* user_mods/css/modules/autohide-bookmarks.css */
/* Auto-hide bookmark bar - shows on hover near top */

.bookmark-bar {
    transition: opacity var(--compact-transition-speed) ease,
                max-height var(--compact-transition-speed) ease;
    overflow: hidden;
}

#browser:not(:hover) .bookmark-bar {
    opacity: 0;
    max-height: 0;
}

#browser:hover .bookmark-bar {
    opacity: 1;
    max-height: 40px;
}
```

**Step 4: Verify modules created**

Run: `ls user_mods/css/modules/`
Expected: Three autohide CSS files

**Step 5: Commit modules**

```bash
git add user_mods/css/modules/
git commit -m "feat: add autohide modules for addressbar, panel, bookmarks"
```

---

## Task 5: Create Compact Mode Module

**Files:**
- Create: `user_mods/css/modules/compact-mode.css`

**Step 1: Create compact-mode.css**

```css
/* user_mods/css/modules/compact-mode.css */
/* Auto-compact sidebar - collapses when not hovered */

#browser.tabs-left #tabs-tabbar-container,
#browser.tabs-right #tabs-tabbar-container {
    transition: width var(--compact-transition-speed) ease;
    width: var(--normal-sidebar-width);
}

#browser.tabs-left:not(:hover) #tabs-tabbar-container,
#browser.tabs-right:not(:hover) #tabs-tabbar-container {
    width: var(--compact-sidebar-width);
}

/* Hide tab titles when collapsed */
#browser.tabs-left:not(:hover) .tab-header span.title,
#browser.tabs-right:not(:hover) .tab-header span.title {
    opacity: 0;
    transition: opacity var(--compact-transition-speed) ease;
}

#browser.tabs-left:hover .tab-header span.title,
#browser.tabs-right:hover .tab-header span.title {
    opacity: 1;
}

/* Center favicons when collapsed */
#browser.tabs-left:not(:hover) .tab-header .favicon,
#browser.tabs-right:not(:hover) .tab-header .favicon {
    margin: 0 auto;
}
```

**Step 2: Verify file created**

Run: `cat user_mods/css/modules/compact-mode.css | head -10`
Expected: CSS content visible

**Step 3: Commit**

```bash
git add user_mods/css/modules/compact-mode.css
git commit -m "feat: add compact-mode module for auto-collapsing sidebar"
```

---

## Task 6: Set Up Optional JS Mods Directory

**Files:**
- Create: `user_mods/js/README.md`
- Create: `user_mods/js/.gitkeep`

**Step 1: Create JS directory readme**

```markdown
# JavaScript Mods

Place JavaScript mods here. They will be loaded by VivaldiModManager's injection system.

## Recommended Mods (from Awesome-Vivaldi)

Copy desired mods from https://github.com/PaRr0tBoY/Awesome-Vivaldi/tree/main/Javascripts

Popular options:
- `tidyTabs.js` - AI-powered tab grouping (requires API key)
- `globalMediaControls.js` - Media playback controls
- `markdownNotes.js` - Markdown editor in sidebar

## Installation

1. Copy `.js` files to this directory
2. Use VivaldiModManager to enable/disable
3. Restart Vivaldi

## Note

JS mods require VivaldiModManager for injection. CSS-only users can ignore this folder.
```

**Step 2: Create .gitkeep**

```bash
touch user_mods/js/.gitkeep
```

**Step 3: Commit**

```bash
git add user_mods/js/
git commit -m "docs: add JS mods directory with setup instructions"
```

---

## Task 7: Create Unified README

**Files:**
- Create: `README.md`

**Step 1: Write README.md**

```markdown
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
```

**Step 2: Commit README**

```bash
git add README.md
git commit -m "docs: add unified README with quick start guide"
```

---

## Task 8: Copy VivalArc Themes

**Files:**
- Create: `user_mods/css/themes/` (directory)
- Copy: Theme CSS extracts from VivalArc theme zips

**Step 1: Create themes directory**

```bash
mkdir -p user_mods/css/themes
```

**Step 2: Create arc-dark.css theme**

```css
/* user_mods/css/themes/arc-dark.css */
/* Dark theme override */

:root {
    --colorBg: #1a1a1a;
    --colorFg: #e0e0e0;
    --colorTabBar: #242424;
    --colorAccentBg: #3d5afe;
}
```

**Step 3: Create arc-light.css theme**

```css
/* user_mods/css/themes/arc-light.css */
/* Light theme override */

:root {
    --colorBg: #ffffff;
    --colorFg: #1a1a1a;
    --colorTabBar: #f5f5f5;
    --colorAccentBg: #3d5afe;
}
```

**Step 4: Commit themes**

```bash
git add user_mods/css/themes/
git commit -m "feat: add arc-dark and arc-light theme modules"
```

---

## Task 9: Final Verification and Tag

**Step 1: Verify complete structure**

Run: `find user_mods -type f | sort`

Expected output:
```
user_mods/css/base/variables.css
user_mods/css/base/vivalarc-base.css
user_mods/css/core.css
user_mods/css/modules/autohide-addressbar.css
user_mods/css/modules/autohide-bookmarks.css
user_mods/css/modules/autohide-panel.css
user_mods/css/modules/compact-mode.css
user_mods/css/themes/arc-dark.css
user_mods/css/themes/arc-light.css
user_mods/js/.gitkeep
user_mods/js/README.md
```

**Step 2: Test CSS loads in browser**

1. Open Vivaldi
2. Go to `vivaldi://experiments` > Enable CSS mods
3. Settings > Appearance > Custom UI Modifications > Select `user_mods/css/`
4. Restart Vivaldi
5. Verify Arc-style sidebar appears

**Step 3: Create version tag**

```bash
git tag -a v2.0.0 -m "Initial unified modpack release"
```

**Step 4: Final commit log check**

Run: `git log --oneline`

Expected: 8 commits showing incremental progress

---

## Summary

This plan creates a ModManager-ready modpack with:
- Modular CSS architecture (toggle features via imports)
- Separated variables for easy customization
- Optional JS mod support
- Compatible with both Vivaldi's native CSS mods and VivaldiModManager
- Clear documentation

Total tasks: 9
Estimated time: 30-45 minutes
