/*
 * Tab Panel Media Controls
 * Minimal Arc/Zen-style media indicator in the tab panel area
 * Shows a compact control when audio is playing from any tab
 */

(function tabPanelMediaControls() {
  'use strict';

  const CONFIG = {
    POSITION: 'top',
    POLL_INTERVAL: 2000,
  };

  let mediaIndicator = null;
  let pollInterval = null;

  function waitForElement(selector, callback, maxWait = 10000) {
    const startTime = Date.now();
    const check = () => {
      const element = document.querySelector(selector);
      if (element) {
        callback(element);
      } else if (Date.now() - startTime < maxWait) {
        setTimeout(check, 100);
      }
    };
    check();
  }

  function createMediaIndicator() {
    if (mediaIndicator) return mediaIndicator;

    const indicator = document.createElement('div');
    indicator.className = 'tab-panel-media-indicator';
    indicator.style.cssText = `
      display: none;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      margin: 4px;
      background: var(--colorBgAlpha, rgba(30,30,30,0.9));
      border-radius: 6px;
      font-size: 12px;
      color: var(--colorFg);
      cursor: pointer;
      transition: opacity 0.2s, background 0.2s;
      border: 1px solid var(--colorBorder, transparent);
    `;

    const icon = document.createElement('span');
    icon.className = 'media-icon';
    icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
    </svg>`;
    icon.style.cssText = 'display: flex; align-items: center;';

    const info = document.createElement('span');
    info.className = 'media-info';
    info.style.cssText = `
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
    `;

    const muteBtn = document.createElement('button');
    muteBtn.className = 'media-mute-btn';
    muteBtn.innerHTML = '🔊';
    muteBtn.title = 'Mute/Unmute';
    muteBtn.style.cssText = `
      background: none;
      border: none;
      color: var(--colorFg);
      cursor: pointer;
      padding: 2px 4px;
      font-size: 12px;
      opacity: 0.7;
    `;
    muteBtn.onmouseenter = () => muteBtn.style.opacity = '1';
    muteBtn.onmouseleave = () => muteBtn.style.opacity = '0.7';

    indicator.appendChild(icon);
    indicator.appendChild(info);
    indicator.appendChild(muteBtn);

    indicator.onmouseenter = () => {
      indicator.style.background = 'var(--colorBgLighter, rgba(50,50,50,0.95))';
    };
    indicator.onmouseleave = () => {
      indicator.style.background = 'var(--colorBgAlpha, rgba(30,30,30,0.9))';
    };

    mediaIndicator = indicator;
    return indicator;
  }

  function updateMediaIndicator() {
    if (!mediaIndicator) return;

    chrome.tabs.query({ audible: true, currentWindow: true }, (audibleTabs) => {
      if (chrome.runtime.lastError) {
        console.error('[TabPanelMediaControls] Query error:', chrome.runtime.lastError);
        return;
      }

      const activeTabs = audibleTabs.filter(t => !t.mutedInfo?.muted);
      
      if (activeTabs.length === 0) {
        mediaIndicator.style.display = 'none';
        return;
      }

      const tab = activeTabs[0];
      const info = mediaIndicator.querySelector('.media-info');
      const muteBtn = mediaIndicator.querySelector('.media-mute-btn');
      
      let displayText;
      try {
        displayText = new URL(tab.url).hostname.replace('www.', '');
      } catch {
        displayText = tab.title?.substring(0, 20) || 'Playing';
      }
      
      if (activeTabs.length > 1) {
        displayText += ` +${activeTabs.length - 1}`;
      }
      
      info.textContent = displayText;
      muteBtn.innerHTML = tab.mutedInfo?.muted ? '🔇' : '🔊';
      muteBtn.title = tab.mutedInfo?.muted ? 'Unmute' : 'Mute';
      
      muteBtn.onclick = (e) => {
        e.stopPropagation();
        chrome.tabs.update(tab.id, { muted: !tab.mutedInfo?.muted });
      };

      mediaIndicator.onclick = () => {
        chrome.tabs.update(tab.id, { active: true });
      };

      mediaIndicator.style.display = 'flex';
    });
  }

  function init(tabbarContainer) {
    const indicator = createMediaIndicator();
    
    const toolbar = tabbarContainer.querySelector('.toolbar-tabbar-before');
    if (toolbar) {
      if (CONFIG.POSITION === 'top') {
        toolbar.insertBefore(indicator, toolbar.firstChild);
      } else {
        toolbar.appendChild(indicator);
      }
    } else {
      tabbarContainer.insertBefore(indicator, tabbarContainer.firstChild);
    }

    updateMediaIndicator();

    pollInterval = setInterval(updateMediaIndicator, CONFIG.POLL_INTERVAL);

    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if ('audible' in changeInfo || 'mutedInfo' in changeInfo) {
        updateMediaIndicator();
      }
    });

    chrome.tabs.onRemoved.addListener(updateMediaIndicator);

    console.log('[TabPanelMediaControls] Initialized');
  }

  waitForElement('#tabs-tabbar-container', init);
})();
