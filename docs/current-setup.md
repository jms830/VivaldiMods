# Current Setup - Jordan's Vivaldi 7.8 Configuration

Last updated: 2026-01-25

## Overview

This documents the current working configuration for Vivaldi 7.8 Snapshot with Arc-style theming. Use this to restore the setup or integrate into the configurator.

## Vivaldi Version

- **Version**: 7.8.3916.3 (Official build) (64-bit)
- **Platform**: Windows 11

## Vivaldi Settings

### Required Settings
1. `vivaldi://experiments` > Enable "Allow CSS modifications"
2. Settings > Appearance > Custom UI Modifications > Point to `CSS/` folder
3. Settings > Tabs > Tab Bar Position > **Left** (sidebar tabs)
4. Settings > Appearance > Auto-hide UI > Enable as desired (native auto-hide)

### Recommended Settings
- Settings > Tabs > Show Workspace Buttons (for workspace switching)
- Settings > Appearance > Use Animation (for smooth transitions)

## CSS Modules Enabled

### Layout (Core)
| Module | File | Purpose |
|--------|------|---------|
| ✅ | main.css | Core Arc-style layout |
| ✅ | NeatDial.css | Speed dial styling |
| ✅ | FavouriteTabs.css | 3x3 pinned tabs grid |
| ✅ | Addressbar.css | Address bar styling |
| ✅ | FindInPage.css | Find in page styling |
| ✅ | QuickCommand.css | Quick command styling |
| ✅ | DownloadPanel.css | Download panel |
| ✅ | ExtensionsPanel.css | Extensions panel |
| ✅ | WorkspaceButtons.css | Workspace button hover effects |
| ✅ | NativeAutohidePolish.css | Rounded corners for native auto-hide |
| ✅ | ToolbarAutoHide.css | Collapsible toolbar row in sidebar |
| ❌ | themePreviewer.css | Theme preview (not needed) |

### EnhancedUX
| Module | File | Purpose |
|--------|------|---------|
| ✅ | BtnHoverAnime.css | Button hover animations |
| ✅ | TabsTrail.css | Tab trail effect |
| ✅ | Quietify.css | Quieter UI elements |
| ✅ | SelectableText.css | Make all text selectable |

### JSIntegration (CSS for JS mods)
| Module | File | Purpose |
|--------|------|---------|
| ✅ | ClearTabs.css | Clear tabs button (red) |
| ✅ | TidyTabs.css | Tidy tabs button (blue) |
| ✅ | ArcPeek.css | Arc peek feature |
| ✅ | Accentmod.css | Accent color mod |
| ✅ | workspaceButtons.css | Workspace buttons JS styling |

### Dev
| Module | File | Purpose |
|--------|------|---------|
| ✅ | LineBreak.css | Line break styling |
| ❌ | TabStack.css | Tab stacking (experimental) |
| ❌ | autoHidePanel.css | Dev auto-hide (not needed) |
| ❌ | TileExpand.css | Tile expand (experimental) |

### AutoHide (DISABLED - Using Vivaldi 7.8 Native)
| Module | File | Why Disabled |
|--------|------|--------------|
| ❌ | AdaptiveBF.css | Vivaldi 7.8 native auto-hide |
| ❌ | Tabbar.css | Vivaldi 7.8 native auto-hide |
| ❌ | Bookmarkbar.css | Vivaldi 7.8 native auto-hide |
| ❌ | Panel.css | Vivaldi 7.8 native auto-hide |
| ❌ | StatusBar.css | Vivaldi 7.8 native auto-hide |

## CSS Variables (Current Values)

```css
:root {
  --fluid-theme: color;
  --fluid-compact-mode: off;
  --fluid-float-tabbar: on;
  --fluid-mask: off;
  --fluid-blur-hibernate-tab: off;
  --fluid-delay: on;
  --fluid-border-radius: on;
  --fluid-tabs-grid: on;
  --fluid-pin-at-top: off;
  
  --pinned-column-count: 3;
  --pinned-row-count: 3;
  --pinned-gap: 8px;
  --pinned-icon-size: 20px;
  --pinned-tab-height: 50px;
  
  --tabs-container-collapse-width-default: 44px;
  --tabs-container-expand-width: 280px;
  
  --animation-speed: 260ms;
  --fast-animation-speed: 140ms;
  --slow-animation-speed: 560ms;
  
  --addressbar-height: 36px;
}
```

## JS Mods Installed

Location: `C:\Users\jordans\AppData\Local\Vivaldi\Application\7.8.3916.3\resources\vivaldi\mods\`

| File | Purpose | Size |
|------|---------|------|
| tidyTabs.js | AI-powered tab grouping | 28KB |
| tidyTitles.js | AI-powered tab title cleanup | 17KB |
| ClearTabs.js | AI clear tabs button | 5KB |
| globalMediaControls.js | Media playback panel | 76KB |
| mdNotes.js | Markdown notes in sidebar | 12KB |
| easyFiles.js | File management panel | 36KB |
| workspaceButtons.js | Quick workspace switching buttons | 18KB |

### JS Mods NOT Installed (Available in repo)
- dialogTab.js - Arc Peek / link preview in floating dialog (now enabled)
- colorTabs.js - Color tab borders by favicon
- accentMod.js - Dynamic accent colors  
- tabScroll.js - Scroll through tabs
- activateTabOnHover.js - Switch tabs on hover
- immersiveAddressbar.js - Immersive mode (requires --fluid-theme: immersive)
- commandChainIcons.js - Custom icons for command chains (new Jan 2026)

## New Modules Created (2026-01-13)

These were extracted from AutoHide/tabbar.css for standalone use:

1. **WorkspaceButtons.css** - Workspace button hover effects and sizing
2. **NativeAutohidePolish.css** - Rounded corners and transparency for Vivaldi's native auto-hide
3. **ToolbarAutoHide.css** - Collapsible toolbar row in sidebar (URL bar + toolbar buttons)

## Installation Steps

### CSS Mods
1. Clone repo or download
2. Enable CSS mods in `vivaldi://experiments`
3. Point Vivaldi to `CSS/` folder in Settings > Appearance
4. Restart Vivaldi

### JS Mods (Windows)
1. Run `scripts/install-js-mods.bat` OR manually copy files:
   ```
   Copy from: Javascripts/tidyTabs.js, tidyTitles.js, ClearTabs.js
   Copy from: Javascripts/Tam710562/globalMediaControls.js, mdNotes.js, easyFiles.js
   Copy to: %LOCALAPPDATA%\Vivaldi\Application\<version>\resources\vivaldi\mods\
   ```
2. Patch `window.html` to load mods (install script does this)
3. Restart Vivaldi

**Note**: JS mods must be reinstalled after Vivaldi updates (new version folder).

## Configurator Integration

To add this as a preset in the configurator:

```javascript
{
  name: "Jordan's Vivaldi 7.8",
  description: "Arc-style with native auto-hide, AI tabs, media controls",
  modules: {
    // Layout
    "Layout/main.css": true,
    "Layout/NeatDial.css": true,
    "Layout/FavouriteTabs.css": true,
    "Layout/Addressbar.css": true,
    "Layout/FindInPage.css": true,
    "Layout/QuickCommand.css": true,
    "Layout/DownloadPanel.css": true,
    "Layout/ExtensionsPanel.css": true,
    "Layout/WorkspaceButtons.css": true,
    "Layout/NativeAutohidePolish.css": true,
    "Layout/ToolbarAutoHide.css": true,
    
    // EnhancedUX
    "EnhancedUX/BtnHoverAnime.css": true,
    "EnhancedUX/TabsTrail.css": true,
    "EnhancedUX/Quietify.css": true,
    "EnhancedUX/SelectableText.css": true,
    
    // JSIntegration
    "JSIntegration/ClearTabs.css": true,
    "JSIntegration/TidyTabs.css": true,
    "JSIntegration/ArcPeek.css": true,
    "JSIntegration/Accentmod.css": true,
    "JSIntegration/workspaceButtons.css": true,
    
    // Dev
    "Dev/LineBreak.css": true,
    
    // AutoHide - ALL DISABLED
    "AutoHide/AdaptiveBF.css": false,
    "AutoHide/Tabbar.css": false,
    "AutoHide/Bookmarkbar.css": false,
    "AutoHide/Panel.css": false,
    "AutoHide/StatusBar.css": false
  },
  variables: {
    "--fluid-theme": "color",
    "--fluid-compact-mode": "off",
    "--fluid-float-tabbar": "on",
    "--fluid-tabs-grid": "on",
    "--tabs-container-expand-width": "280px",
    "--animation-speed": "260ms"
  },
  jsMods: [
    "tidyTabs.js",
    "tidyTitles.js", 
    "ClearTabs.js",
    "globalMediaControls.js",
    "mdNotes.js",
    "easyFiles.js",
    "workspaceButtons.js"
  ]
}
```
