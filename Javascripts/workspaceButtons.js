(function workspaceButtons() {
  'use strict';
  
  try {

  // Helper to get React props from a DOM element (same pattern as globalMediaControls.js)
  let reactPropsKey = null;
  const getReactProps = (element) => {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (!element || element.ownerDocument !== document) {
      return;
    }
    if (!reactPropsKey) {
      reactPropsKey = Object.keys(element).find((key) => key.startsWith('__reactProps'));
    }
    return element[reactPropsKey];
  };

  // Simulate a button click using PointerEvent (same pattern as globalMediaControls.js)
  const simulateButtonClick = (element) => {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (!element) {
      console.log('[WorkspaceButtons] simulateButtonClick: element not found');
      return false;
    }
    
    const pointerDown = new PointerEvent('pointerdown', {
      view: window,
      bubbles: true,
      cancelable: true,
      buttons: 0,
      pointerType: 'mouse',
    });
    pointerDown.persist = () => {};
    
    const reactProps = getReactProps(element);
    if (reactProps?.onPointerDown) {
      console.log('[WorkspaceButtons] Triggering onPointerDown via React props');
      reactProps.onPointerDown(pointerDown);
      
      element.dispatchEvent(new PointerEvent('pointerup', {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 0,
        pointerType: 'mouse',
      }));
      return true;
    } else {
      console.log('[WorkspaceButtons] No onPointerDown found in React props');
      return false;
    }
  };

  const CONFIG = {
    containerId: 'workspace-buttons-container',
    buttonClass: 'workspace-quick-button',
    activeClass: 'workspace-active',
    addButtonClass: 'workspace-add-button',
    checkInterval: 1000,
    debounceDelay: 100,
    maxVisible: 8,
    minButtonSize: 24,
    maxButtonSize: 32,
    defaultWorkspaceId: null,
    defaultWorkspaceName: 'Default',
    defaultWorkspaceIcon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>'
  };

  let currentWorkspaceId = null;
  let workspaceList = [];
  let container = null;
  let isInitialized = false;
  let isSwitching = false;



  const getWorkspaceList = () => {
    return new Promise((resolve) => {
      if (typeof vivaldi !== 'undefined' && vivaldi.prefs) {
        vivaldi.prefs.get('vivaldi.workspaces.list', (list) => {
          resolve(list || []);
        });
      } else {
        resolve([]);
      }
    });
  };

  const getCurrentWorkspaceId = () => {
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

  const switchWorkspace = async (workspaceId, index) => {
    if (isSwitching) {
      console.log('[WorkspaceButtons] Already switching, ignoring');
      return;
    }
    isSwitching = true;

    const targetWorkspaceId = index === -1 ? null : workspaceList[index]?.id;
    const targetName = index === -1 ? 'Default' : workspaceList[index]?.name;

    const workspacePopupButton = document.querySelector('.button-toolbar.workspace-popup > button');
    if (!workspacePopupButton) {
      console.log('[WorkspaceButtons] Workspace popup button not found');
      isSwitching = false;
      return;
    }

    const popupOpened = simulateButtonClick(workspacePopupButton);
    
    if (!popupOpened) {
      console.log('[WorkspaceButtons] Failed to trigger popup button');
      isSwitching = false;
      setTimeout(updateActiveState, 100);
      return;
    }

    const findAndClickWorkspaceItem = (attempts = 0) => {
      // Look for the actual popup menu - it's rendered as a separate element, not inside the button
      // Try various selectors for Vivaldi popup menus
      const popupSelectors = [
        '.vivaldi-menu',
        '.menu-popup',
        '.dropdown-menu',
        '[role="menu"]',
        '[role="listbox"]',
        '.popup:not(.workspace-popup)',
        'div[class*="Popup"]:not(.workspace-popup)',
        '.floating-menu'
      ];
      
      let popup = null;
      for (const selector of popupSelectors) {
        const el = document.querySelector(selector);
        if (el && el.querySelectorAll('button, [role="menuitem"], [role="option"]').length > 1) {
          popup = el;
          break;
        }
      }
      
      // Also check for any element that appeared recently with multiple workspace-like items
      if (!popup) {
        const allMenus = document.querySelectorAll('div[style*="position"], div[class*="menu"], div[class*="Menu"], div[class*="popup"], div[class*="Popup"], div[class*="dropdown"]');
        for (const menu of allMenus) {
          const items = menu.querySelectorAll('button, [role="menuitem"], [role="option"], div[tabindex="0"]');
          if (items.length >= 2) {
            // Check if any item text matches a workspace name
            for (const item of items) {
              const text = item.textContent?.trim() || '';
              if (workspaceList.some(ws => ws.name === text) || text === 'Default') {
                popup = menu;
                break;
              }
            }
            if (popup) break;
          }
        }
      }
      
      if (!popup && attempts < 30) {
        setTimeout(() => findAndClickWorkspaceItem(attempts + 1), 50);
        return;
      }
      
      if (!popup) {
        console.log('[WorkspaceButtons] Popup menu did not appear');
        isSwitching = false;
        setTimeout(updateActiveState, 100);
        return;
      }

      const allClickables = popup.querySelectorAll('button, [role="menuitem"], [role="option"], div[tabindex="0"], div[tabindex="-1"]');
      
      const workspaceItems = Array.from(allClickables).filter(el => {
        const text = el.textContent?.trim() || '';
        return text.length > 0 && text.length < 100;
      });
      
      let targetItem = null;
      
      // For "Default" workspace (index -1), find the "this-window" button which shows unassigned tabs
      if (index === -1) {
        targetItem = popup.querySelector('button.this-window, .this-window');
        if (targetItem) {
          console.log('[WorkspaceButtons] Found this-window item for Default workspace');
        }
      } else {
        // For named workspaces, find by name match
        for (const item of workspaceItems) {
          const itemText = item.textContent?.trim() || item.getAttribute('title') || '';
          if (item.classList.contains('workspace-item-wrapper') && 
              itemText.toLowerCase().includes(targetName.toLowerCase())) {
            targetItem = item;
            console.log('[WorkspaceButtons] Found workspace item by name match:', itemText);
            break;
          }
        }
      }

      if (targetItem) {
        if (!simulateButtonClick(targetItem)) {
          targetItem.click();
        }
        isSwitching = false;
        setTimeout(updateActiveState, 200);
        setTimeout(updateActiveState, 500);
      } else {
        console.log('[WorkspaceButtons] Could not find target workspace item');
        simulateButtonClick(workspacePopupButton);
        isSwitching = false;
        setTimeout(updateActiveState, 200);
      }
    };

    setTimeout(() => findAndClickWorkspaceItem(), 50);
  };

  const createButton = (workspace, index) => {
    const button = document.createElement('button');
    button.className = CONFIG.buttonClass;
    button.dataset.workspaceId = workspace.id;
    button.dataset.workspaceIndex = index;
    button.title = workspace.name;

    if (workspace.icon) {
      button.innerHTML = workspace.icon;
    } else {
      button.textContent = workspace.name.charAt(0).toUpperCase();
    }

    button.addEventListener('click', (e) => {
      console.log('[WorkspaceButtons] DEBUG: Button clicked for workspace:', workspace.name, 'index:', index);
      e.preventDefault();
      e.stopPropagation();
      // Defer to escape current event context - allows wsButton.click() to work properly
      setTimeout(() => switchWorkspace(workspace.id, index), 0);
    });

    return button;
  };

  const createContainer = () => {
    const existing = document.getElementById(CONFIG.containerId);
    if (existing) {
      existing.remove();
    }

    container = document.createElement('div');
    container.id = CONFIG.containerId;
    return container;
  };

  const injectStyles = () => {
    const styleId = 'workspace-buttons-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #${CONFIG.containerId} {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 2px;
        padding: 6px 4px;
        margin: 4px;
        background: var(--colorBgAlphaHeavy, rgba(0,0,0,0.2));
        border-radius: var(--radius, 8px);
        flex-wrap: nowrap;
        overflow: hidden;
        min-height: 28px;
        flex-shrink: 0;
      }

      .tabbar-wrapper:has(#${CONFIG.containerId}) {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .tabbar-wrapper:has(#${CONFIG.containerId}) .tab-strip {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
      }

      .${CONFIG.buttonClass} {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: ${CONFIG.minButtonSize}px;
        max-width: ${CONFIG.maxButtonSize}px;
        width: ${CONFIG.maxButtonSize}px;
        height: ${CONFIG.maxButtonSize}px;
        min-height: ${CONFIG.minButtonSize}px;
        padding: 2px;
        border: none;
        border-radius: calc(var(--radius, 8px) * 0.6);
        background: transparent;
        color: var(--colorFg);
        cursor: pointer;
        transition: all 0.15s ease;
        opacity: 0.6;
        flex-shrink: 1;
        flex-grow: 0;
      }

      .${CONFIG.buttonClass}:hover {
        background: var(--colorBgAlphaHeavy, rgba(255,255,255,0.1));
        opacity: 1;
        transform: scale(1.05);
      }

      .${CONFIG.buttonClass}.${CONFIG.activeClass} {
        background: var(--colorAccentBg, rgba(255,255,255,0.2));
        opacity: 1;
        box-shadow: inset 0 0 0 2px var(--colorAccentFg, currentColor);
      }

      .${CONFIG.buttonClass} svg {
        width: 14px;
        height: 14px;
        min-width: 12px;
        min-height: 12px;
        stroke: currentColor;
        fill: none;
        flex-shrink: 0;
      }

      .${CONFIG.addButtonClass} {
        opacity: 0.4;
        border: 1px dashed var(--colorFg, currentColor);
      }

      .${CONFIG.addButtonClass}:hover {
        opacity: 0.8;
        border-style: solid;
      }

      /* Responsive sizing based on container width */
      @container tabs-container (max-width: 200px) {
        .${CONFIG.buttonClass} {
          width: 24px;
          height: 24px;
          min-width: 20px;
          min-height: 20px;
        }
        .${CONFIG.buttonClass} svg {
          width: 12px;
          height: 12px;
        }
      }

      /* Fallback: CSS calc based responsive */
      #tabs-tabbar-container.left #${CONFIG.containerId},
      #tabs-tabbar-container.right #${CONFIG.containerId} {
        max-width: calc(100% - 8px);
      }

      /* When very narrow, allow smaller buttons */
      #tabs-tabbar-container #${CONFIG.containerId} .${CONFIG.buttonClass} {
        flex: 1 1 auto;
        max-width: ${CONFIG.maxButtonSize}px;
      }
    `;
    document.head.appendChild(style);
  };

  const updateActiveState = async () => {
    const newWorkspaceId = await getCurrentWorkspaceId();
    currentWorkspaceId = newWorkspaceId;
    
    const buttons = container?.querySelectorAll(`.${CONFIG.buttonClass}:not(.${CONFIG.addButtonClass})`);
    buttons?.forEach((btn) => {
      const btnWorkspaceId = btn.dataset.workspaceId;
      const isDefaultButton = btnWorkspaceId === 'default';
      const noWorkspaceAssigned = !currentWorkspaceId;
      const isActive = isDefaultButton 
        ? noWorkspaceAssigned
        : String(btnWorkspaceId) === String(currentWorkspaceId);
      btn.classList.toggle(CONFIG.activeClass, isActive);
    });
  };

  const findInsertionPoint = () => {
    const tabbarContainer = document.querySelector('#tabs-tabbar-container');
    if (!tabbarContainer) return null;

    const targets = [
      '#tabs-tabbar-container.left .tabbar-wrapper',
      '#tabs-tabbar-container.right .tabbar-wrapper',
      '#tabs-tabbar-container .toolbar-tabbar-after',
      '#tabs-tabbar-container .sync-and-trash-container',
      '.tabbar-wrapper',
      '#tabs-tabbar-container'
    ];

    for (const selector of targets) {
      const el = document.querySelector(selector);
      if (el) {
        console.log('[WorkspaceButtons] Found insertion point:', selector);
        return el;
      }
    }
    return tabbarContainer;
  };

  const createDefaultWorkspaceButton = () => {
    const button = document.createElement('button');
    button.className = CONFIG.buttonClass;
    button.dataset.workspaceId = 'default';
    button.dataset.workspaceIndex = -1;
    button.title = CONFIG.defaultWorkspaceName;
    button.innerHTML = CONFIG.defaultWorkspaceIcon;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => switchWorkspace(null, -1), 0);
    });

    return button;
  };

  const createAddButton = () => {
    const button = document.createElement('button');
    button.className = `${CONFIG.buttonClass} ${CONFIG.addButtonClass}`;
    button.title = 'New Workspace';
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openNewWorkspaceDialog();
    });

    return button;
  };

  const openNewWorkspaceDialog = () => {
    console.log('[WorkspaceButtons] Opening new workspace dialog');
    const workspaceButton = document.querySelector(
      '.WorkspaceButton, button.WorkspaceButton, [class*="WorkspaceButton"], button[title*="orkspace"]'
    );
    
    if (workspaceButton) {
      workspaceButton.click();
      setTimeout(() => {
        const newButton = document.querySelector(
          '[class*="NewWorkspace"], button[title*="New"], [class*="add-workspace"], .WorkspacePopup button:last-child'
        );
        if (newButton) {
          console.log('[WorkspaceButtons] Clicking new workspace button');
          newButton.click();
        } else {
          console.log('[WorkspaceButtons] New workspace button not found in popup');
        }
      }, 150);
    } else {
      console.log('[WorkspaceButtons] No workspace button found for new workspace');
    }
  };

  const render = async () => {
    workspaceList = await getWorkspaceList();

    injectStyles();
    container = createContainer();

    const defaultButton = createDefaultWorkspaceButton();
    container.appendChild(defaultButton);

    const visibleWorkspaces = workspaceList.slice(0, CONFIG.maxVisible - 1);
    
    visibleWorkspaces.forEach((workspace, index) => {
      const button = createButton(workspace, index);
      container.appendChild(button);
    });

    const addButton = createAddButton();
    container.appendChild(addButton);

    if (workspaceList.length > CONFIG.maxVisible - 1) {
      console.log('[WorkspaceButtons] Truncated to', CONFIG.maxVisible - 1, 'of', workspaceList.length);
    }

    const insertionPoint = findInsertionPoint();
    if (insertionPoint) {
      insertionPoint.appendChild(container);
      console.log('[WorkspaceButtons] Rendered', visibleWorkspaces.length + 2, 'buttons (default + workspaces + add)');
    } else {
      console.log('[WorkspaceButtons] No insertion point found');
      return;
    }

    await updateActiveState();
  };

  const init = () => {
    if (isInitialized) return;
    
    const tabbar = document.querySelector('#tabs-tabbar-container');
    if (!tabbar) {
      setTimeout(init, 500);
      return;
    }

    isInitialized = true;
    console.log('[WorkspaceButtons] Initializing...');

    render();

    setInterval(updateActiveState, CONFIG.checkInterval);

    chrome.tabs.onActivated.addListener(() => {
      setTimeout(updateActiveState, CONFIG.debounceDelay);
    });

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const containerEl = document.getElementById(CONFIG.containerId);
          if (!containerEl || !document.body.contains(containerEl)) {
            setTimeout(render, 100);
            break;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  };

  if (document.readyState === 'complete') {
    setTimeout(init, 500);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
  }

  window.addEventListener('load', () => setTimeout(init, 1000));

  } catch (e) {
    console.error('[WorkspaceButtons] Fatal error:', e);
  }
})();
