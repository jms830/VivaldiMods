# Zen Browser Style Reference

Patterns extracted from Zen Browser for styling guidance.

## Source Repository

https://github.com/zen-browser/desktop

Key CSS files:
- `src/zen/common/styles/zen-omnibox.css` - URL bar styling
- `src/zen/common/styles/zen-urlbar.css` - URL field specifics
- `src/zen/sidebar/` - Sidebar styling

## Design Philosophy

1. **Ultra-minimal** - UI nearly invisible until interacted with
2. **Subtle backgrounds** - 3-8% opacity, not solid colors
3. **No heavy effects** - Avoid blur, gradients, drop shadows
4. **Focus reveals** - Elements become more visible on hover/focus
5. **Consistent radii** - 8-12px border-radius throughout

## URL Bar Patterns

### Background Opacity Scale

| State | Opacity | Example |
|-------|---------|---------|
| Default | 3-5% | `rgba(255,255,255,0.03)` |
| Hover | 5-8% | `rgba(255,255,255,0.06)` |
| Focus | 8-12% | `rgba(255,255,255,0.08)` |

### CSS Variables (Zen-style for Vivaldi)

```css
:root {
  /* URL bar backgrounds */
  --zen-url-bg: rgba(255, 255, 255, 0.03);
  --zen-url-bg-hover: rgba(255, 255, 255, 0.06);
  --zen-url-bg-focus: rgba(255, 255, 255, 0.08);
  
  /* Border radius */
  --zen-url-radius: 8px;
  
  /* Transitions */
  --zen-transition: 150ms ease-out;
}

.theme-light {
  --zen-url-bg: rgba(0, 0, 0, 0.03);
  --zen-url-bg-hover: rgba(0, 0, 0, 0.05);
  --zen-url-bg-focus: rgba(0, 0, 0, 0.07);
}
```

### Implementation

```css
.UrlBar-AddressField {
  background: var(--zen-url-bg) !important;
  border-radius: var(--zen-url-radius) !important;
  border: none !important;
  transition: background var(--zen-transition) !important;
}

.UrlBar-AddressField:hover {
  background: var(--zen-url-bg-hover) !important;
}

.UrlBar-AddressField:focus-within {
  background: var(--zen-url-bg-focus) !important;
}
```

## Tab Styling

### Zen Tab Characteristics

- No visible borders between tabs
- Subtle background on hover only
- Active tab slightly more prominent
- Pinned tabs as simple icons (no expansion)

### Patterns

```css
/* Base tab - nearly invisible */
.tab {
  background: transparent;
  border: none;
}

/* Hover - subtle reveal */
.tab:hover {
  background: rgba(255, 255, 255, 0.04);
}

/* Active - slightly more visible */
.tab.active {
  background: rgba(255, 255, 255, 0.06);
}
```

## Sidebar Styling

### Width Recommendations

| State | Width |
|-------|-------|
| Collapsed | 48-52px (icons only) |
| Expanded | 260-300px |

### Transition Pattern

```css
.sidebar {
  transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Color Functions

Zen uses modern CSS color functions:

```css
/* Theme-aware colors */
background: light-dark(
  rgba(0, 0, 0, 0.05),    /* light theme */
  rgba(255, 255, 255, 0.05) /* dark theme */
);

/* Color mixing */
background: color-mix(in srgb, var(--colorBg), transparent 95%);
```

**Note**: `light-dark()` requires `color-scheme` to be set. Vivaldi may not support this natively - use `.theme-dark` / `.theme-light` classes instead.

## Animation Principles

1. **Duration**: 150-200ms for micro-interactions, 250-300ms for larger transitions
2. **Easing**: `ease-out` for most, `cubic-bezier(0.4, 0, 0.2, 1)` for expansion
3. **Properties**: Animate `background`, `opacity`, `transform` - avoid `width`/`height` when possible

## Anti-Patterns (What Zen Avoids)

| Avoid | Why | Alternative |
|-------|-----|-------------|
| Heavy blur (`blur(12px)+`) | Performance, visual noise | Subtle opacity or none |
| Thick borders | Cluttered look | Single-pixel or none |
| Bright backgrounds | Distracting | Near-transparent |
| Large shadows | Heavy visual weight | None or 1-2px subtle |
| Multiple transitions | Janky animation | Single smooth transition |

## Comparison: Vivaldi Default vs Zen Style

| Element | Vivaldi Default | Zen Style |
|---------|-----------------|-----------|
| URL bar bg | Solid `var(--colorBg)` | 3% white/black |
| URL bar radius | 4px | 8-12px |
| Tab hover | Background + border | Background only |
| Focus state | Ring/outline | Background change |
| Animations | 260ms | 150ms |

## Quick Implementation Checklist

- [ ] Replace solid backgrounds with semi-transparent
- [ ] Increase border-radius to 8px minimum
- [ ] Remove blur effects from non-modal elements
- [ ] Reduce animation duration to 150-200ms
- [ ] Remove borders, use background changes for state
- [ ] Test in both dark and light themes
