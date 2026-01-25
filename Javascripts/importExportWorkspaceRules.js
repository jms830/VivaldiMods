/*
 * Import Export Workspace Rules
 * Adds import/export functionality to Settings > Tabs > Workspaces
 * 
 * Pref path: vivaldi.workspaces.link_routes
 * Structure: Array of { expression, id, type, workspaceId }
 */

(async () => {
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
      this.listeners = [];
      this.observers = [];
      this.timeouts = [];
      this.intervals = [];
      this.chromeListeners = [];
    }
  };

  const gnoh = {
    uuid: {
      generate(ids) {
        let d = Date.now() + performance.now();
        let r;
        const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          r = (d + Math.random() * 16) % 16 | 0;
          d = Math.floor(d / 16);
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        if (Array.isArray(ids) && ids.includes(id)) {
          return this.generate(ids);
        }
        return id;
      },
    },
    styles: {},
    addStyle(css, id) {
      if (Array.isArray(css)) {
        css = css.join('');
      }
      id = id || this.uuid.generate(Object.keys(this.styles));
      const style = document.createElement('style');
      style.textContent = css || '';
      style.dataset.id = id;
      document.head.appendChild(style);
      this.styles[id] = style;
      return style;
    },
    createElement(tagName, attribute, parent) {
      const el = document.createElement(tagName);
      if (attribute) {
        for (const key in attribute) {
          if (key === 'text') {
            el.textContent = attribute[key];
          } else if (key === 'html') {
            el.innerHTML = attribute[key];
          } else if (key === 'events') {
            for (const event in attribute.events) {
              el.addEventListener(event, attribute.events[event]);
            }
          } else if (key === 'style' && typeof attribute[key] === 'object') {
            Object.assign(el.style, attribute[key]);
          } else {
            el.setAttribute(key, attribute[key]);
          }
        }
      }
      if (parent) {
        if (typeof parent === 'string') {
          parent = document.querySelector(parent);
        }
        parent?.appendChild(el);
      }
      return el;
    },
    timeOut(callback, condition, timeout = 300) {
      let timeOutId = setTimeout(function wait() {
        let result;
        if (!condition) {
          result = document.getElementById('browser');
        } else if (typeof condition === 'string') {
          result = document.querySelector(condition);
        } else if (typeof condition === 'function') {
          result = condition();
        } else {
          return;
        }
        if (result) {
          callback(result);
        } else {
          timeOutId = setTimeout(wait, timeout);
        }
      }, timeout);
      return { stop: () => clearTimeout(timeOutId) };
    },
    element: {
      appendAtIndex(element, parentElement, index) {
        if (index >= parentElement.children.length) {
          parentElement.append(element);
        } else {
          parentElement.insertBefore(element, parentElement.children[index]);
        }
      },
    },
  };

  const WORKSPACE_RULES_PATH = 'vivaldi.workspaces.link_routes';
  const WORKSPACE_LIST_PATH = 'vivaldi.workspaces.list';

  const urls = {
    tabs: 'chrome-extension://mpognobbkildjkofajifpdfhcoklimli/components/settings/settings.html?path=tabs',
  };

  const icons = {
    import: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 12H4V17H20V12H22V17C22 18.11 21.11 19 20 19H4C2.9 19 2 18.11 2 17V12M12 15L17.55 9.54L16.13 8.13L13 11.25V2H11V11.25L7.88 8.13L6.46 9.55L12 15Z" /></svg>',
    export: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 12H4V17H20V12H22V17C22 18.11 21.11 19 20 19H4C2.9 19 2 18.11 2 17V12M12 2L6.46 7.46L7.88 8.88L11 5.75V15H13V5.75L16.13 8.88L17.55 7.45L12 2Z" /></svg>',
  };

  gnoh.addStyle([
    '.workspace-rules-buttons { display: flex; gap: 6px; margin-top: 12px; }',
    '.workspace-rules-buttons button { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: var(--radiusHalf); border: 1px solid var(--colorBorder); background: var(--colorBgIntense); color: var(--colorFg); cursor: pointer; font-size: 13px; }',
    '.workspace-rules-buttons button:hover { background: var(--colorBgIntenser); }',
    '.workspace-rules-buttons button svg { width: 16px; height: 16px; fill: currentColor; }',
    '.workspace-rules-restart-notice { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px 12px; border-radius: var(--radiusHalf); background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: var(--colorFg); font-size: 12px; }',
    '.workspace-rules-restart-notice svg { width: 16px; height: 16px; fill: #f59e0b; flex-shrink: 0; }',
    '.workspace-rules-toast { position: fixed; top: 20px; right: 20px; padding: 12px 16px; border-radius: 6px; color: white; font-size: 13px; z-index: 999999; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 400px; }',
    '.workspace-rules-toast.success { background: #2e7d32; }',
    '.workspace-rules-toast.error { background: #c62828; }',
    '.workspace-rules-toast.info { background: #1565c0; }',
  ], 'workspace-rules-import-export');

  const icons_notice = {
    warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 14H11V10H13M13 18H11V16H13M1 21H23L12 2L1 21Z" /></svg>',
  };

  function showRestartNotice(message) {
    const existing = document.querySelector('.workspace-rules-restart-notice');
    if (existing) existing.remove();

    const buttonContainer = document.querySelector('.workspace-rules-buttons');
    if (!buttonContainer) return;

    const notice = gnoh.createElement('div', {
      class: 'workspace-rules-restart-notice',
      html: icons_notice.warning + '<span>' + message + '</span>',
    });
    buttonContainer.parentNode.insertBefore(notice, buttonContainer.nextSibling);
  }

  function showToast(message, type = 'info') {
    const browserDoc = document.getElementById('browser')?.ownerDocument || document;
    const existing = browserDoc.querySelector('.workspace-rules-toast');
    if (existing) existing.remove();
    
    const toast = browserDoc.createElement('div');
    toast.className = `workspace-rules-toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 12px 16px; border-radius: 6px; color: white; font-size: 13px; z-index: 999999; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 400px; background: ${type === 'success' ? '#2e7d32' : type === 'error' ? '#c62828' : '#1565c0'};`;
    browserDoc.body.appendChild(toast);
    
    modState.setTimeout(() => {
      toast.style.transition = 'opacity 0.3s';
      toast.style.opacity = '0';
      modState.setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    console.log(`[WorkspaceRules] Toast (${type}): ${message}`);
  }

  let timeOut;

  async function getWorkspaceRules() {
    try {
      const rules = await vivaldi.prefs.get(WORKSPACE_RULES_PATH);
      return (rules && Array.isArray(rules)) ? rules : [];
    } catch (e) {
      console.error('[WorkspaceRules] Error getting rules:', e);
      return [];
    }
  }

  async function getWorkspaceList() {
    try {
      const list = await vivaldi.prefs.get(WORKSPACE_LIST_PATH);
      return list || [];
    } catch (e) {
      return [];
    }
  }

  function setWorkspaceRules(rules) {
    vivaldi.prefs.set({ path: WORKSPACE_RULES_PATH, value: rules });
  }

  async function exportRules() {
    const rules = await getWorkspaceRules();
    const workspaces = await getWorkspaceList();

    if (!rules.length) {
      showToast('No workspace rules found to export.', 'error');
      return;
    }

    const exportData = {
      version: 1,
      type: 'vivaldi-workspace-rules',
      exported: new Date().toISOString(),
      rules: rules,
      workspaces: workspaces.map(ws => ({ id: ws.id, name: ws.name })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: url,
      filename: `vivaldi-workspace-rules-${new Date().toISOString().split('T')[0]}.json`,
      saveAs: true,
    });

    URL.revokeObjectURL(url);
  }

  async function importRules() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (importData.type !== 'vivaldi-workspace-rules' || !importData.rules) {
          showToast('Invalid workspace rules file format', 'error');
          return;
        }

        const currentRules = await getWorkspaceRules();
        const currentWorkspaces = await getWorkspaceList();
        const currentWorkspaceIds = new Set(currentWorkspaces.map(ws => ws.id));

        console.log('[WorkspaceRules] Import - current rules:', currentRules);
        console.log('[WorkspaceRules] Import - current workspaces:', currentWorkspaces);
        console.log('[WorkspaceRules] Import - importing:', importData.rules);

        const existingRuleKeys = new Set(currentRules.map(r => `${r.expression}|${r.workspaceId}`));
        
        let added = 0;
        let skippedExists = 0;
        let skippedNoWorkspace = 0;
        
        const newRules = [];
        for (const rule of importData.rules) {
          const ruleKey = `${rule.expression}|${rule.workspaceId}`;
          console.log('[WorkspaceRules] Checking rule:', rule.expression, 'key:', ruleKey, 'exists:', existingRuleKeys.has(ruleKey), 'wsExists:', currentWorkspaceIds.has(rule.workspaceId));
          if (existingRuleKeys.has(ruleKey)) {
            skippedExists++;
          } else if (!currentWorkspaceIds.has(rule.workspaceId)) {
            skippedNoWorkspace++;
          } else {
            newRules.push({
              ...rule,
              id: crypto.randomUUID(),
            });
            added++;
          }
        }

        if (added === 0) {
          const msgs = [];
          if (skippedExists > 0) msgs.push(`${skippedExists} already exist`);
          if (skippedNoWorkspace > 0) msgs.push(`${skippedNoWorkspace} have missing workspaces`);
          showToast(`No rules imported: ${msgs.join(', ')}`, 'info');
          return;
        }

        const finalRules = [...currentRules, ...newRules];
        await setWorkspaceRules(finalRules);

        let msg = `Imported ${added} workspace rule${added > 1 ? 's' : ''}`;
        if (skippedExists > 0 || skippedNoWorkspace > 0) {
          const skipped = [];
          if (skippedExists > 0) skipped.push(`${skippedExists} existed`);
          if (skippedNoWorkspace > 0) skipped.push(`${skippedNoWorkspace} missing workspace`);
          msg += ` (skipped: ${skipped.join(', ')})`;
        }
        showToast(msg, 'success');
        showRestartNotice('Restart Vivaldi to see imported rules');

      } catch (err) {
        showToast('Import failed: ' + err.message, 'error');
        console.error('[WorkspaceRules] Import error:', err);
      }
    };

    input.click();
  }

  async function reloadSettingsPage() {
    const tabs = await chrome.tabs.query({ url: urls.tabs + '*' });
    for (const tab of tabs) {
      chrome.tabs.reload(tab.id);
    }
  }

  function createButtonToolbar(attribute, parent) {
    return gnoh.createElement('button', Object.assign({ class: 'button-toolbar' }, attribute), parent);
  }

  function getMenuItem(name) {
    const menuItem = document.evaluate(
      `//div[contains(concat(" ", normalize-space(@class), " "), " tree-row ") and contains(., "${name}")]`,
      document, null, XPathResult.ANY_TYPE, null
    );
    return menuItem.iterateNext();
  }

  function createWorkspaceRulesButtons() {
    if (timeOut) {
      timeOut.stop();
    }

    if (document.querySelector('.workspace-rules-buttons')) {
      console.log('[WorkspaceRules] Buttons already exist, skipping');
      return;
    }

    timeOut = gnoh.timeOut(linkRoutingSection => {
      if (document.querySelector('.workspace-rules-buttons')) return;

      const buttonContainer = gnoh.createElement('div', { class: 'workspace-rules-buttons' });

      gnoh.createElement('button', {
        html: icons.import + ' Import',
        title: 'Import Workspace Rules from JSON file',
        events: { click: (e) => { e.preventDefault(); importRules(); } },
      }, buttonContainer);

      gnoh.createElement('button', {
        html: icons.export + ' Export',
        title: 'Export Workspace Rules to JSON file',
        events: { click: (e) => { e.preventDefault(); exportRules(); } },
      }, buttonContainer);

      linkRoutingSection.appendChild(buttonContainer);
      console.log('[WorkspaceRules] Buttons added');

    }, () => {
      const el = document.querySelector('[class*="WorkspaceLinkRouting"]');
      if (el && !document.querySelector('.workspace-rules-buttons')) {
        return el;
      }
      return null;
    });
  }

  const tabUpdateHandler = (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('settings.html') && tab.url?.includes('tabs')) {
      modState.setTimeout(createWorkspaceRulesButtons, 500);
    }
  };
  modState.addChromeListener(chrome.tabs, 'onUpdated', tabUpdateHandler);

  gnoh.timeOut(async () => {
    const rules = await getWorkspaceRules();
    console.log(`[WorkspaceRules] Found ${rules.length} workspace rules`);

    if (document.querySelector('#main > .webpageview')) {
      const tabsMenuItem = getMenuItem('Tabs');
      if (tabsMenuItem) {
        modState.addEventListener(tabsMenuItem, 'click', () => modState.setTimeout(createWorkspaceRulesButtons, 300));
      }
    } else {
      const tabs = await chrome.tabs.query({ active: true, windowId: vivaldiWindowId });
      if (tabs.length && tabs[0].url?.includes('settings.html') && tabs[0].url?.includes('tabs')) {
        createWorkspaceRulesButtons();
      }
    }
    
    // Register cleanup on beforeunload
    window.addEventListener('beforeunload', () => modState.cleanup());
  }, '#main');

  console.log('[WorkspaceRules] Ready - buttons appear in Settings > Tabs > Workspaces');
})();
