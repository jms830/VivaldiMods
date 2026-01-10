# VivalArc Configurator V2 Design

## Overview

Enhanced web configurator with full Awesome-Vivaldi feature parity, preset system, and granular customization.

## Goals

1. **Feature Parity** - Support all Awesome-Vivaldi CSS features
2. **Presets** - One-click configurations (Minimal, Arc-like, Power User)
3. **Customization** - Users can tweak any setting after selecting a preset

## Feature Inventory

### Theme Modes (Radio Selection)
| Variable | Options | Description |
|----------|---------|-------------|
| `--fluid-theme` | `color`, `transparent`, `immersive` | Base theme mode |

### Sidebar Behavior (Toggles)
| Feature | Variable | Default | Description |
|---------|----------|---------|-------------|
| Compact Mode | `--fluid-compact-mode` | off | Ultra-thin collapsed sidebar (7px) |
| Floating Tabbar | `--fluid-float-tabbar` | on | Overlay webpage when expanded |
| Blur Mask | `--fluid-mask` | off | Blur webpage when sidebar expanded |
| Smart Delay | `--fluid-delay` | on | Delay expand/collapse animations |
| Border Radius | `--fluid-border-radius` | on | Round corners on expand |
| Blur Hibernated | `--fluid-blur-hibernate-tab` | off | Blur inactive tabs |

### Pinned Tabs Grid (Toggles + Sliders)
| Feature | Variable | Default | Description |
|---------|----------|---------|-------------|
| Enable Grid | `--fluid-tabs-grid` | on | Show favorites as grid |
| Pin at Top | `--fluid-pin-at-top` | off | Keep grid pinned while scrolling |
| Columns | `--pinned-column-count` | 3 | Grid columns (1-6) |
| Rows | `--pinned-row-count` | 3 | Grid rows (1-6) |
| Gap | `--pinned-gap` | 8px | Space between tabs |
| Icon Size | `--pinned-icon-size` | 20px | Favicon size |
| Tab Height | `--pinned-tab-height` | 50px | Grid cell height |

### Auto-Hide Elements (Toggles)
| Feature | Description |
|---------|-------------|
| Address Bar | Hide until hover near top |
| Bookmark Bar | Hide until hover |
| Panel | Collapse until hover |
| Status Bar | Hide status bar |
| Adaptive Back/Forward | Hide disabled nav buttons |

### Visual Enhancements (Toggles)
| Feature | Description |
|---------|-------------|
| Tab Trails | Green/red gradient on hover/close |
| Quietify | Animated audio icons |
| Button Animations | Hover effects on buttons |
| NeatDial | Clean speed dial page |

### Sizing Variables (Sliders)
| Variable | Default | Range | Description |
|----------|---------|-------|-------------|
| `--window-border` | 4px | 0-16px | Window padding |
| `--tabs-container-collapse-width-default` | 44px | 36-60px | Collapsed sidebar width |
| `--tabs-container-expand-width` | 280px | 200-400px | Expanded sidebar width |
| `--animation-speed` | 260ms | 100-500ms | Animation duration |
| `--transition-delay-time-collapse` | 200ms | 0-500ms | Collapse delay |
| `--radius` | 12px | 0-24px | Corner radius |

## Presets

### Minimal
- Compact mode: ON
- Floating tabbar: ON
- Blur mask: OFF
- Tabs grid: OFF
- All auto-hide: OFF
- Tab trails: OFF
- Quietify: OFF
- Small window border (4px)
- Fast animations (140ms)

### Arc-like (Default)
- Compact mode: OFF
- Floating tabbar: ON
- Blur mask: OFF
- Tabs grid: ON (3x3)
- Smart delay: ON
- Auto-hide: Address bar only
- Tab trails: ON
- Quietify: ON
- Medium border (8px)
- Normal animations (260ms)

### Power User
- Compact mode: OFF
- Floating tabbar: ON
- Blur mask: ON
- Tabs grid: ON (4x3)
- Pin at top: ON
- Smart delay: ON
- All auto-hide: ON
- All visual enhancements: ON
- Large sidebar (320px expanded)
- All features enabled

## UI Layout

```
+------------------------------------------+
|          VivalArc Configurator           |
|     Customize your Arc-style Vivaldi     |
+------------------------------------------+
|                                          |
|  [Minimal] [Arc-like] [Power User]       |  <- Preset buttons
|                                          |
+------------------+-----------------------+
|                  |                       |
|  FEATURES        |  PREVIEW              |
|                  |                       |
|  Theme Mode      |  [Preview Image/GIF]  |
|  ( ) Color       |                       |
|  ( ) Transparent |  Theme                |
|  ( ) Immersive   |  [Dark] [Light]       |
|                  |                       |
|  Sidebar         |  CUSTOMIZATION        |
|  [x] Compact     |                       |
|  [x] Floating    |  Window Padding       |
|  [ ] Blur Mask   |  [====o====] 8px      |
|  [x] Smart Delay |                       |
|                  |  Sidebar Width        |
|  Pinned Tabs     |  [======o==] 280px    |
|  [x] Grid Layout |                       |
|  [ ] Pin at Top  |  Animation Speed      |
|  Columns: [3]    |  [===o=====] 260ms    |
|  Rows: [3]       |                       |
|                  |  Corner Radius        |
|  Auto-Hide       |  [====o====] 12px     |
|  [ ] Address Bar |                       |
|  [ ] Bookmarks   |  Grid Columns         |
|  [ ] Panel       |  [==o======] 3        |
|  [ ] Status Bar  |                       |
|  [ ] Nav Buttons |  +------------------+ |
|                  |  | Download CSS     | |
|  Enhancements    |  +------------------+ |
|  [x] Tab Trails  |                       |
|  [x] Quietify    |  Installation steps   |
|  [x] NeatDial    |  1. vivaldi://exp...  |
|                  |                       |
+------------------+-----------------------+
```

## Implementation Notes

### CSS Generation Strategy

1. **Base theme** - Always include core Arc styling
2. **Conditional sections** - Only include CSS for enabled features
3. **Variable overrides** - Set all variables in `:root`
4. **Feature blocks** - Use `@container style()` queries where supported

### File Size Optimization

- Only generate CSS for enabled features
- Minify output option
- Estimated sizes:
  - Minimal: ~15KB
  - Arc-like: ~25KB
  - Power User: ~35KB

### Preview System

- Show relevant GIF based on hovered/selected feature
- Preview images from Awesome-Vivaldi showcase folder
- Fallback to static screenshots

## Migration from V1

- All existing features preserved
- New features added to UI
- Default preset = "Arc-like" (similar to current defaults)
