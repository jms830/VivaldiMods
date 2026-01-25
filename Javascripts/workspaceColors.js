/**
 * Workspace Colors
 * Assigns a persistent accent color to each workspace.
 * Right-click a workspace button to set its color.
 * 
 * Requires: workspaceButtons.js (for the buttons to right-click)
 * Works with: accentMod.css (uses --colorAccentBg CSS variable)
 */

(function workspaceColors() {
  'use strict';

  const STORAGE_KEY = 'vivaldi-workspace-colors';
  const DEFAULT_COLORS = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#6366f1', // indigo
  ];

  // Preset color palette for the picker
  const COLOR_PALETTE = [
    // Row 1: Blues & Purples
    '#3b82f6', '#2563eb', '#1d4ed8', '#6366f1', '#8b5cf6', '#a855f7',
    // Row 2: Pinks & Reds
    '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#dc2626', '#b91c1c',
    // Row 3: Oranges & Yellows
    '#f97316', '#ea580c', '#f59e0b', '#eab308', '#facc15', '#fde047',
    // Row 4: Greens & Teals
    '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    // Row 5: Neutrals
    '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#020617',
  ];

  let workspaceColors = {};
  let currentWorkspaceId = null;
  let colorPickerElement = null;
  let cachedWorkspaceList = [];
  
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
      this.listeners = [];
      this.observers = [];
      this.timeouts = [];
      this.intervals = [];
      this.chromeListeners = [];
      console.log('[WorkspaceColors] Cleanup complete');
    }
  };

  // Load saved colors from localStorage
  const loadColors = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        workspaceColors = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[WorkspaceColors] Failed to load colors:', e);
    }
  };

  // Save colors to localStorage
  const saveColors = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaceColors));
    } catch (e) {
      console.warn('[WorkspaceColors] Failed to save colors:', e);
    }
  };

  // Get color for a workspace (assigns default if none set)
  const getWorkspaceColor = (workspaceId, index = 0) => {
    if (!workspaceId) return DEFAULT_COLORS[0];
    
    if (!workspaceColors[workspaceId]) {
      // Assign a default color based on index
      workspaceColors[workspaceId] = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
      saveColors();
    }
    return workspaceColors[workspaceId];
  };

  // Set color for a workspace
  const setWorkspaceColor = (workspaceId, color) => {
    workspaceColors[workspaceId] = color;
    saveColors();
    
    // If this is the current workspace, apply immediately
    if (workspaceId === currentWorkspaceId) {
      applyAccentColor(color);
    }
    
    // Update the button's indicator
    updateButtonIndicator(workspaceId, color);
  };

  // Apply accent color to Vivaldi UI
  const applyAccentColor = (color) => {
    const root = document.documentElement;
    
    // Set CSS custom properties that Vivaldi uses for accent
    root.style.setProperty('--colorAccentBg', color);
    root.style.setProperty('--colorAccentBgAlpha', color + '40');
    root.style.setProperty('--colorAccentBgFaded', color + '20');
    root.style.setProperty('--colorAccentBgDark', adjustBrightness(color, -20));
    root.style.setProperty('--colorAccentBgLight', adjustBrightness(color, 20));
    
    // Also set on #browser for some elements
    const browser = document.getElementById('browser');
    if (browser) {
      browser.style.setProperty('--colorAccentBg', color);
    }

    // Mark that we're using workspace colors (for CSS targeting)
    document.body.classList.add('workspace-colors-active');
  };

  // Adjust color brightness
  const adjustBrightness = (hex, percent) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };

  // Update the color indicator on a workspace button
  const updateButtonIndicator = (workspaceId, color) => {
    const button = document.querySelector(
      `[data-workspace-id="${workspaceId}"], .workspace-quick-button[data-workspace-id="${workspaceId}"]`
    );
    if (button) {
      button.style.setProperty('--workspace-color', color);
      
      // Add/update color dot indicator
      let indicator = button.querySelector('.workspace-color-indicator');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'workspace-color-indicator';
        button.appendChild(indicator);
      }
      indicator.style.backgroundColor = color;
    }
  };

  // Create color picker popup
  const createColorPicker = (workspaceId, anchorElement) => {
    // Remove existing picker
    if (colorPickerElement) {
      colorPickerElement.remove();
    }

    const picker = document.createElement('div');
    picker.className = 'workspace-color-picker';
    picker.innerHTML = `
      <div class="wcp-header">Set Workspace Color</div>
      <div class="wcp-palette">
        ${COLOR_PALETTE.map(c => `
          <button class="wcp-swatch" data-color="${c}" style="background-color: ${c}" 
                  title="${c}" ${workspaceColors[workspaceId] === c ? 'data-selected="true"' : ''}></button>
        `).join('')}
      </div>
      <div class="wcp-custom">
        <label>Custom:</label>
        <input type="color" class="wcp-custom-input" value="${workspaceColors[workspaceId] || DEFAULT_COLORS[0]}">
      </div>
      <div class="wcp-actions">
        <button class="wcp-btn wcp-cancel">Cancel</button>
        <button class="wcp-btn wcp-apply">Apply</button>
      </div>
    `;

    // Position near the anchor element
    const rect = anchorElement.getBoundingClientRect();
    picker.style.position = 'fixed';
    picker.style.left = `${rect.left}px`;
    picker.style.top = `${rect.bottom + 8}px`;
    picker.style.zIndex = '999999';

    document.body.appendChild(picker);
    colorPickerElement = picker;

    let selectedColor = workspaceColors[workspaceId] || DEFAULT_COLORS[0];

    // Swatch click handlers
    picker.querySelectorAll('.wcp-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        picker.querySelectorAll('.wcp-swatch').forEach(s => s.removeAttribute('data-selected'));
        swatch.setAttribute('data-selected', 'true');
        selectedColor = swatch.dataset.color;
        picker.querySelector('.wcp-custom-input').value = selectedColor;
      });
    });

    // Custom color input
    picker.querySelector('.wcp-custom-input').addEventListener('input', (e) => {
      selectedColor = e.target.value;
      picker.querySelectorAll('.wcp-swatch').forEach(s => s.removeAttribute('data-selected'));
    });

    // Cancel button
    picker.querySelector('.wcp-cancel').addEventListener('click', () => {
      picker.remove();
      colorPickerElement = null;
    });

    // Apply button
    picker.querySelector('.wcp-apply').addEventListener('click', () => {
      setWorkspaceColor(workspaceId, selectedColor);
      picker.remove();
      colorPickerElement = null;
    });

    // Close on click outside
    modState.setTimeout(() => {
      const closeOnOutside = (e) => {
        if (!picker.contains(e.target) && !anchorElement.contains(e.target)) {
          picker.remove();
          colorPickerElement = null;
          document.removeEventListener('click', closeOnOutside);
        }
      };
      document.addEventListener('click', closeOnOutside);
    }, 100);
  };

  // Add context menu to workspace buttons
  const setupContextMenu = () => {
    const handler = (e) => {
      const button = e.target.closest('.workspace-quick-button, [data-workspace-id]');
      if (button) {
        const workspaceId = button.dataset.workspaceId;
        if (workspaceId) {
          e.preventDefault();
          e.stopPropagation();
          createColorPicker(workspaceId, button);
        }
      }
    };
    modState.addEventListener(document, 'contextmenu', handler);
  };

  // Get current workspace ID from active tab
  const detectCurrentWorkspace = () => {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].vivExtData) {
          try {
            const extData = JSON.parse(tabs[0].vivExtData);
            resolve(extData.workspaceId || null);
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  };

  const refreshWorkspaceListCache = () => {
    if (typeof vivaldi !== 'undefined' && vivaldi.prefs) {
      vivaldi.prefs.get('vivaldi.workspaces.list', (list) => {
        if (list) cachedWorkspaceList = list;
      });
    }
  };

  const onWorkspaceChange = async () => {
    const newWorkspaceId = await detectCurrentWorkspace();
    
    if (newWorkspaceId !== currentWorkspaceId) {
      currentWorkspaceId = newWorkspaceId;
      
      let workspaceIndex = cachedWorkspaceList.findIndex(w => w.id === currentWorkspaceId);
      if (workspaceIndex === -1) workspaceIndex = 0;
      
      const color = getWorkspaceColor(currentWorkspaceId, workspaceIndex);
      applyAccentColor(color);
    }
  };

  // Initialize all button indicators
  const initButtonIndicators = async () => {
    if (typeof vivaldi !== 'undefined' && vivaldi.prefs) {
      vivaldi.prefs.get('vivaldi.workspaces.list', (list) => {
        if (list) {
          list.forEach((workspace, index) => {
            const color = getWorkspaceColor(workspace.id, index);
            updateButtonIndicator(workspace.id, color);
          });
        }
      });
    }
  };

  // Inject CSS for the color picker
  const injectStyles = () => {
    const style = document.createElement('style');
    style.id = 'workspace-colors-style';
    style.textContent = `
      /* Color picker popup */
      .workspace-color-picker {
        background: var(--colorBg, #1e1e1e);
        border: 1px solid var(--colorBorder, #333);
        border-radius: 8px;
        padding: 12px;
        min-width: 220px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        font-family: inherit;
        font-size: 12px;
      }
      
      .wcp-header {
        font-weight: 600;
        margin-bottom: 10px;
        color: var(--colorFg, #fff);
      }
      
      .wcp-palette {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 6px;
        margin-bottom: 12px;
      }
      
      .wcp-swatch {
        width: 28px;
        height: 28px;
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        transition: transform 0.1s, border-color 0.1s;
      }
      
      .wcp-swatch:hover {
        transform: scale(1.15);
        z-index: 1;
      }
      
      .wcp-swatch[data-selected="true"] {
        border-color: white;
        box-shadow: 0 0 0 2px var(--colorAccentBg, #3b82f6);
      }
      
      .wcp-custom {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        color: var(--colorFg, #ccc);
      }
      
      .wcp-custom-input {
        flex: 1;
        height: 32px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        background: transparent;
      }
      
      .wcp-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      
      .wcp-btn {
        padding: 6px 14px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: background 0.1s;
      }
      
      .wcp-cancel {
        background: var(--colorBgDark, #333);
        color: var(--colorFg, #ccc);
      }
      
      .wcp-cancel:hover {
        background: var(--colorBgDarker, #444);
      }
      
      .wcp-apply {
        background: var(--colorAccentBg, #3b82f6);
        color: white;
      }
      
      .wcp-apply:hover {
        filter: brightness(1.1);
      }
      
      /* Color indicator on workspace buttons */
      .workspace-color-indicator {
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        width: 12px;
        height: 3px;
        border-radius: 2px;
        pointer-events: none;
      }
      
      .workspace-quick-button {
        position: relative;
      }
      
      /* When workspace colors are active, fast transition for snappy feel */
      .workspace-colors-active #browser {
        transition: --colorAccentBg 0.1s ease;
      }
    `;
    document.head.appendChild(style);
  };

  // Initialize
  const init = async () => {
    console.log('[WorkspaceColors] Initializing...');
    
    loadColors();
    injectStyles();
    setupContextMenu();
    
    refreshWorkspaceListCache();
    await onWorkspaceChange();
    
    // Listen for tab changes (workspace switches)
    modState.addChromeListener(chrome.tabs, 'onActivated', () => {
      modState.setTimeout(onWorkspaceChange, 50);
    });
    
    // Also listen for tab updates (in case workspace changes without tab switch)
    modState.addChromeListener(chrome.tabs, 'onUpdated', (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' || changeInfo.vivExtData) {
        modState.setTimeout(onWorkspaceChange, 50);
      }
    });
    
    // Initialize button indicators after a short delay (wait for workspaceButtons.js)
    modState.setTimeout(initButtonIndicators, 1000);
    
    // Re-init indicators when DOM changes (new buttons added)
    modState.addObserver(document.body, (mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          const hasWorkspaceButton = Array.from(mutation.addedNodes).some(
            node => node.classList?.contains('workspace-quick-button') || 
                    node.querySelector?.('.workspace-quick-button')
          );
          if (hasWorkspaceButton) {
            modState.setTimeout(initButtonIndicators, 100);
          }
        }
      }
    }, { childList: true, subtree: true });
    
    // Register cleanup on page unload
    window.addEventListener('beforeunload', () => modState.cleanup());
    
    console.log('[WorkspaceColors] Initialized successfully');
  };

  // Wait for DOM and Vivaldi API
  setTimeout(function wait() {
    const browser = document.getElementById('browser');
    if (browser && typeof chrome !== 'undefined' && chrome.tabs) {
      init();
    } else {
      setTimeout(wait, 300);
    }
  }, 300);

})();
