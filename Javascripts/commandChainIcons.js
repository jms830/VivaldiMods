/*
 * Command Chain Icons
 * Adds ability to set custom icons for command chains in Settings > Quick Commands
 * 
 * Features:
 * - Icon picker with 60 curated Material Design Icons
 * - Custom SVG input (paste code)
 * - File upload for .svg files
 * - Icon preview before applying
 * - Clear icon option
 * 
 * Pref path: vivaldi.chained_commands.command_list
 * Each command chain can have an optional "icon" field with inline SVG
 */

(async () => {
  'use strict';

  const modState = {
    listeners: [],
    observers: [],
    timeouts: [],
    intervals: [],
    chromeListeners: [],
    vivaldiListeners: [],
    
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
    
    addVivaldiListener(api, event, handler) {
      api[event].addListener(handler);
      this.vivaldiListeners.push({ api, event, handler });
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
      this.vivaldiListeners.forEach(({ api, event, handler }) => {
        api[event].removeListener(handler);
      });
      this.listeners = [];
      this.observers = [];
      this.timeouts = [];
      this.intervals = [];
      this.chromeListeners = [];
      this.vivaldiListeners = [];
      console.log('[CommandChainIcons] Cleanup complete');
    }
  };

  // Helper utilities (subset of gnoh pattern)
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
      getIndex(element) {
        return Array.from(element.parentElement.children).indexOf(element);
      },
    },
  };

  // ============================================
  // ICON LIBRARY - 60 Curated Material Design Icons
  // ============================================
  const ICON_LIBRARY = {
    // Actions (15)
    'refresh': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0 0 12 4a8 8 0 0 0-8 8 8 8 0 0 0 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18a6 6 0 0 1-6-6 6 6 0 0 1 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35Z"/></svg>',
    'save': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Zm2 16H5V5h11.17L19 7.83V19Zm-7-7a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3Zm-6-6h9v4H6V6Z"/></svg>',
    'copy': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1Z"/></svg>',
    'paste': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19 20H5V4h2v3h10V4h2m-7-2a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1m7 0h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/></svg>',
    'cut': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3l-6 6-2-2-6 6V3m-2 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m-5 4l2 2v6h-4v-6l2-2Z"/></svg>',
    'delete': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z"/></svg>',
    'edit': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25Z"/></svg>',
    'search': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5Z"/></svg>',
    'download': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7 7-7Z"/></svg>',
    'upload': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16v-6H5l7-7 7 7h-4v6H9m-4 4v-2h14v2H5Z"/></svg>',
    'undo': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8Z"/></svg>',
    'redo': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M18.4 10.6C16.55 9 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16a8.002 8.002 0 0 1 7.6-5.5c1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6Z"/></svg>',
    'share': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7 0-.24-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81a3 3 0 0 0 3-3 3 3 0 0 0-3-3 3 3 0 0 0-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.15c-.05.21-.08.43-.08.66 0 1.61 1.31 2.91 2.92 2.91 1.61 0 2.92-1.3 2.92-2.91A2.92 2.92 0 0 0 18 16.08Z"/></svg>',
    'print': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M18 3H6v4h12m1 5a1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1m-3 7H8v-5h8m3-6H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Z"/></svg>',
    'bookmark': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2Z"/></svg>',
    
    // Navigation (10)
    'home': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5Z"/></svg>',
    'arrow-back': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2Z"/></svg>',
    'arrow-forward': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M4 11v2h12l-5.59 5.59L12 20l8-8-8-8-1.41 1.41L16.17 11H4Z"/></svg>',
    'arrow-up': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M13 20h-2V8l-5.59 5.59L4 12l8-8 8 8-1.41 1.41L13 8v12Z"/></svg>',
    'menu': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z"/></svg>',
    'close': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z"/></svg>',
    'expand': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M10 21v-2H6.41l4.5-4.5-1.41-1.41-4.5 4.5V14H3v7h7m4.5-10.09 4.5-4.5V10h2V3h-7v2h3.59l-4.5 4.5 1.41 1.41Z"/></svg>',
    'collapse': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19.5 3.09 15 7.59V4h-2v7h7V9h-3.59l4.5-4.5-1.41-1.41M4 13v2h3.59l-4.5 4.5 1.41 1.41 4.5-4.5V20h2v-7H4Z"/></svg>',
    'fullscreen': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M5 5h5v2H7v3H5V5m9 0h5v5h-2V7h-3V5m3 9h2v5h-5v-2h3v-3m-7 3v2H5v-5h2v3h3Z"/></svg>',
    'fullscreen-exit': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M14 14h5v2h-3v3h-2v-5m-9 0h5v5H8v-3H5v-2m3-9h2v5H5V8h3V5m11 3v2h-5V5h2v3h3Z"/></svg>',
    
    // Media (10)
    'play': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7L8 5Z"/></svg>',
    'pause': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M14 19h4V5h-4M6 19h4V5H6v14Z"/></svg>',
    'stop': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M18 18H6V6h12v12Z"/></svg>',
    'skip-next': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M16 18h2V6h-2M6 18l8.5-6L6 6v12Z"/></svg>',
    'skip-previous': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M6 6h2v12H6m3.5-6 8.5 6V6l-8.5 6Z"/></svg>',
    'volume-high': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.84-5 6.7v2.07c4-.91 7-4.49 7-8.77 0-4.28-3-7.86-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03V16c1.5-.71 2.5-2.24 2.5-4M3 9v6h4l5 5V4L7 9H3Z"/></svg>',
    'volume-mute': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 4 9.91 6.09 12 8.18M4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.26c-.67.51-1.42.93-2.25 1.17v2.07c1.38-.32 2.63-.95 3.68-1.81L19.73 21 21 19.73l-9-9M19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.916 8.916 0 0 0 21 12c0-4.28-3-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71m-7-8-1.88 1.88L12 7.76m4.5 4.24c0-1.77-1-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24Z"/></svg>',
    'music': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M21 3v12.5a3.5 3.5 0 0 1-3.5 3.5 3.5 3.5 0 0 1-3.5-3.5 3.5 3.5 0 0 1 3.5-3.5c.54 0 1.05.12 1.5.34V6.47L9 8.6v8.9A3.5 3.5 0 0 1 5.5 21 3.5 3.5 0 0 1 2 17.5 3.5 3.5 0 0 1 5.5 14c.54 0 1.05.12 1.5.34V6l14-3Z"/></svg>',
    'video': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="m17 10.5 4-4v11l-4-4v4.5H3v-14h14v6.5Z"/></svg>',
    'camera': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m8 3a5 5 0 0 0-5 5 5 5 0 0 0 5 5 5 5 0 0 0 5-5 5 5 0 0 0-5-5m0 2a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3Z"/></svg>',
    
    // File Types (10)
    'file': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M13 9V3.5L18.5 9M6 2c-1.11 0-2 .89-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6Z"/></svg>',
    'folder': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z"/></svg>',
    'file-document': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M13 9h5.5L13 3.5V9M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.11.89-2 2-2m9 16v-2H6v2h9m3-4v-2H6v2h12Z"/></svg>',
    'file-image': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M13 9h5.5L13 3.5V9M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.11.89-2 2-2m0 18h12v-8l-4 4-2-2-6 6m0-6 6-2-3.5-4.5-2.5 3-2 3.5 2-1Z"/></svg>',
    'file-code': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M13 9h5.5L13 3.5V9M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.11.89-2 2-2m.5 16.5 1.5-1.5-2-2 2-2-1.5-1.5L3 15l3.5 3.5m7 0L17 15l-3.5-3.5L12 13l2 2-2 2 1.5 1.5Z"/></svg>',
    'archive': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h18v4H3V3m1 5h16v13H4V8m5.5 3a.5.5 0 0 0-.5.5V13h6v-1.5a.5.5 0 0 0-.5-.5h-5Z"/></svg>',
    'file-pdf': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M13 9h5.5L13 3.5V9M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.11.89-2 2-2m4.93 11.04c-.12-.16-.19-.38-.19-.67 0-.28.06-.5.18-.66.12-.15.29-.22.51-.22.2 0 .36.07.47.22.12.15.17.37.17.66s-.06.51-.17.66c-.12.16-.28.24-.48.24-.22 0-.38-.08-.49-.23m.59-3.78c-.21 0-.39.1-.51.27-.13.18-.19.42-.19.72 0 .29.06.53.19.71.12.18.3.27.51.27s.39-.09.51-.27c.13-.18.19-.42.19-.71 0-.3-.06-.54-.19-.72-.12-.17-.3-.27-.51-.27m2.96 3.78c-.12-.16-.19-.38-.19-.67 0-.28.06-.5.18-.66.12-.15.29-.22.51-.22.2 0 .36.07.47.22.12.15.17.37.17.66s-.06.51-.17.66c-.12.16-.28.24-.48.24-.22 0-.38-.08-.49-.23m.59-3.78c-.21 0-.39.1-.51.27-.13.18-.19.42-.19.72 0 .29.06.53.19.71.12.18.3.27.51.27s.39-.09.51-.27c.13-.18.19-.42.19-.71 0-.3-.06-.54-.19-.72-.12-.17-.3-.27-.51-.27Z"/></svg>',
    'file-excel': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.11.89-2 2-2m7 1.5V9h5.5L13 3.5M8.93 12.61 11.05 17H9.36l-1.41-3.07L6.53 17H4.85l2.16-4.39-1.97-4.11h1.68l1.24 2.83 1.25-2.83h1.68l-1.96 4.11m3.52 4.39v-6.5h1.71v6.5h-1.71m3.27 0v-6.5h1.71v6.5h-1.71Z"/></svg>',
    'file-powerpoint': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.11.89-2 2-2m7 1.5V9h5.5L13 3.5m-3.3 8.5v6h1.5v-2h1.1c.6 0 1.1-.2 1.5-.5.4-.3.6-.9.6-1.5s-.2-1.2-.6-1.5c-.4-.3-.9-.5-1.5-.5h-2.6m1.5 1.2h.9c.2 0 .4.1.6.2.1.1.2.3.2.6s-.1.5-.2.6c-.2.1-.4.2-.6.2h-.9v-1.6Z"/></svg>',
    'database': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.59 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4m0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2-6-1.5-6-2 2.13-2 6-2M6 9.08c1.42.9 3.55 1.42 6 1.42s4.58-.52 6-1.42V12c0 .5-2.13 2-6 2s-6-1.5-6-2V9.08m0 5c1.42.9 3.55 1.42 6 1.42s4.58-.52 6-1.42V17c0 .5-2.13 2-6 2s-6-1.5-6-2v-2.92Z"/></svg>',
    
    // Communication (8)
    'email': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M20 8l-8 5-8-5V6l8 5 8-5m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/></svg>',
    'chat': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3c5.5 0 10 3.58 10 8s-4.5 8-10 8c-1.24 0-2.43-.18-3.53-.5C5.55 21 2 21 2 21c2.33-2.33 2.7-3.9 2.75-4.5C3.05 15.07 2 13.14 2 11c0-4.42 4.5-8 10-8Z"/></svg>',
    'phone': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.28-.28.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.24.2 2.45.57 3.57.1.35.03.74-.25 1.02l-2.2 2.2Z"/></svg>',
    'bell': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M21 19v1H3v-1l2-2v-6c0-3.1 2.03-5.83 5-6.71V4a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.29c2.97.88 5 3.61 5 6.71v6l2 2m-7 2a2 2 0 0 1-2 2 2 2 0 0 1-2-2"/></svg>',
    'bell-off': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M21 19v1H6.39l2-2H19l-2-2v-6c0-.72-.14-1.4-.38-2.03l1.53-1.53c.57 1.08.85 2.3.85 3.56v6l2 2M3.16 3.86 4.27 2.75l16.28 16.28-1.11 1.11L17.29 18H5l2-2v-6c0-3.1 2.03-5.83 5-6.71V4a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.29c.69.19 1.33.48 1.91.86L3.16 3.86M14 21a2 2 0 0 1-2 2 2 2 0 0 1-2-2"/></svg>',
    'send': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M2 21 23 12 2 3v7l15 2-15 2v7Z"/></svg>',
    'inbox': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m0 11h-4.17l-1.42 1.41c-.36.37-.86.59-1.41.59s-1.05-.22-1.42-.59L9.17 14H5V5h14v9Z"/></svg>',
    'link': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7a5 5 0 0 0-5 5 5 5 0 0 0 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1M8 13h8v-2H8v2m9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.71-1.39 3.1-3.1 3.1h-4V17h4a5 5 0 0 0 5-5 5 5 0 0 0-5-5Z"/></svg>',
    
    // Misc (7 + 13 new = 20)
    'settings': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/></svg>',
    'lock': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17a2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5 5 5 0 0 1 5 5v2h1m-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3Z"/></svg>',
    'lock-open': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M18 8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h9V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3H7a5 5 0 0 1 5-5 5 5 0 0 1 5 5v2h1m-6 9a2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2Z"/></svg>',
    'star': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.45 4.73L5.82 21 12 17.27Z"/></svg>',
    'heart': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="m12 21.35-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35Z"/></svg>',
    'flag': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M14.4 6 14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6Z"/></svg>',
    'pin': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2Z"/></svg>',
    'plus': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z"/></svg>',
    'minus': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13H5v-2h14v2Z"/></svg>',
    'plus-circle': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17 13h-4v4h-2v-4H7v-2h4V7h2v4h4m-5-9A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2Z"/></svg>',
    'check': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M21 7 9 19l-5.5-5.5 1.41-1.41L9 16.17 19.59 5.59 21 7Z"/></svg>',
    'check-circle': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9Z"/></svg>',
    'close-circle': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2m5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59Z"/></svg>',
    'eye': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5 5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Z"/></svg>',
    'eye-off': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M11.83 9 15 12.16V12a3 3 0 0 0-3-3h-.17m-4.3.8 1.55 1.55c-.05.21-.08.42-.08.65a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2M2 4.27l2.28 2.28.45.45C3.08 8.3 1.78 10 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.43.42L19.73 22 21 20.73 3.27 3M12 7a5 5 0 0 1 5 5c0 .64-.13 1.26-.36 1.82l2.93 2.93c1.5-1.25 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-4 .7l2.17 2.15C10.74 7.13 11.35 7 12 7Z"/></svg>',
    'lightning': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M11 15H6l7-14v8h5l-7 14v-8Z"/></svg>',
    'moon': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17.75 4.09 15.22 6.03l-2.53-1.94.91 3.06-2.63 1.81 3.19.09.91 3.06.91-3.06 3.19-.09-2.63-1.81.91-3.06M12 6c-4.42 0-8 3.58-8 8s3.58 8 8 8c.57 0 1.13-.07 1.67-.17-2.73-1.1-4.67-3.78-4.67-6.93 0-3.14 1.94-5.82 4.67-6.93-.54-.1-1.1-.17-1.67-.17Z"/></svg>',
    'sun': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3m0-7 2.39 3.42C13.65 5.15 12.84 5 12 5c-.84 0-1.65.15-2.39.42L12 2M3.34 7l4.16-.35A7.2 7.2 0 0 0 5.94 8.5c-.44.74-.77 1.55-.98 2.4L3.34 7m.02 10 1.62-3.9a7.06 7.06 0 0 0 .98 2.4c.48.74 1.04 1.39 1.68 1.93L3.36 17m18.3-10-1.63 3.9a7.12 7.12 0 0 0-.97-2.4 6.91 6.91 0 0 0-1.68-1.93L21.66 7m-.02 10-4.16.35c.91-.68 1.69-1.53 2.28-2.5.44-.74.77-1.55.98-2.4L21.64 17M12 22l-2.39-3.42c.74.27 1.55.42 2.39.42.84 0 1.65-.15 2.39-.42L12 22Z"/></svg>',
    'globe': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17.9 17.39c-.26-.8-1.01-1.39-1.9-1.39h-1v-3a1 1 0 0 0-1-1H8v-2h2a1 1 0 0 0 1-1V7h2a2 2 0 0 0 2-2v-.41a7.984 7.984 0 0 1 2.9 12.8M11 19.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.22.21-1.79L9 15v1a2 2 0 0 0 2 2v1.93M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2Z"/></svg>',
    'tab': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 16H3V5h10v4h8v10Z"/></svg>',
  };

  const ICON_CATEGORIES = {
    'Actions': ['refresh', 'save', 'copy', 'paste', 'cut', 'delete', 'edit', 'search', 'download', 'upload', 'undo', 'redo', 'share', 'print', 'bookmark'],
    'Navigation': ['home', 'arrow-back', 'arrow-forward', 'arrow-up', 'menu', 'close', 'expand', 'collapse', 'fullscreen', 'fullscreen-exit'],
    'Media': ['play', 'pause', 'stop', 'skip-next', 'skip-previous', 'volume-high', 'volume-mute', 'music', 'video', 'camera'],
    'Files': ['file', 'folder', 'file-document', 'file-image', 'file-code', 'archive', 'file-pdf', 'file-excel', 'file-powerpoint', 'database'],
    'Communication': ['email', 'chat', 'phone', 'bell', 'bell-off', 'send', 'inbox', 'link'],
    'Common': ['plus', 'minus', 'plus-circle', 'check', 'check-circle', 'close-circle', 'eye', 'eye-off', 'lightning', 'tab'],
    'Misc': ['settings', 'lock', 'lock-open', 'star', 'heart', 'flag', 'pin', 'moon', 'sun', 'globe'],
  };

  const COMMAND_CHAINS_PATH = 'vivaldi.chained_commands.command_list';
  const THEMES_PATH = 'vivaldi.themes.user';
  const THEME_SCHEDULE_PATH = 'vivaldi.theme.schedule';
  const SETTINGS_URL = 'chrome-extension://mpognobbkildjkofajifpdfhcoklimli/components/settings/settings.html?path=qc';
  const THUMBNAILS_PATH = 'VivaldiThumbnails';
  const ICONIFY_API = 'https://api.iconify.design';
  
  const iconSearchCache = new Map();

  const icons = {
    setIcon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5m4.5 2A3.5 3.5 0 0 1 13 8.5c0 1.06-.47 2-1.21 2.64l3.07 3.07-1.41 1.41-3.07-3.07A3.5 3.5 0 0 1 9.5 13 3.5 3.5 0 0 1 6 9.5 3.5 3.5 0 0 1 9.5 5m0 2A1.5 1.5 0 0 0 8 8.5a1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 9.5 7Z"/></svg>',
  };

  let timeOut;
  let iconPickerDialog = null;

  // ============================================
  // CORE FUNCTIONS
  // ============================================

  async function getCommandChains() {
    return new Promise((resolve) => {
      vivaldi.prefs.get(COMMAND_CHAINS_PATH, (value) => resolve(value || []));
    });
  }

  async function getCommandChainByKey(key) {
    const commandList = await getCommandChains();
    return commandList.find(c => c.key === key);
  }

  async function getUserThemes() {
    return new Promise((resolve) => {
      vivaldi.prefs.get(THEMES_PATH, (value) => resolve(value || []));
    });
  }

  async function getThemeSchedule() {
    return new Promise((resolve) => {
      vivaldi.prefs.get(THEME_SCHEDULE_PATH, (value) => resolve(value || {}));
    });
  }

  async function getCurrentThemeId() {
    const schedule = await getThemeSchedule();
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const osSchedule = schedule?.o_s;
    if (osSchedule) {
      return isDark ? osSchedule.dark : osSchedule.light;
    }
    const themes = await getUserThemes();
    return themes[0]?.id || null;
  }

  async function getIconFromTheme(commandKey, themeId = null) {
    const themes = await getUserThemes();
    const targetId = themeId || await getCurrentThemeId();
    const theme = themes.find(t => t.id === targetId);
    if (!theme?.buttons) return null;
    
    const buttonKey = `COMMAND_${commandKey}`;
    const iconUrl = theme.buttons[buttonKey];
    if (!iconUrl) return null;
    
    return iconUrl;
  }

  function getThemeForegroundColor() {
    const selectors = [
      '.toolbar-mainbar .button-toolbar',
      '.toolbar .button-toolbar',
      '.toolbar .toolbar-button',
      '.toolbar',
      '#browser',
      'body'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (!el) continue;
      const computed = getComputedStyle(el);
      const colorVar = computed.getPropertyValue('--colorFg').trim();
      if (colorVar) return colorVar;
      const color = computed.color?.trim();
      if (color && color !== 'rgba(0, 0, 0, 0)') return color;
    }

    return '#ffffff';
  }

  function normalizeSvg(svgContent, fillColor = null) {
    try {
      let svg = svgContent.trim();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      
      if (!svgEl) return svg;
      
      if (!svgEl.getAttribute('viewBox')) {
        svgEl.setAttribute('viewBox', '0 0 24 24');
      }
      
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');
      
      const color = fillColor || getThemeForegroundColor();
      
      const elementsWithFill = svgEl.querySelectorAll('[fill]');
      elementsWithFill.forEach(el => {
        const fill = el.getAttribute('fill');
        if (fill && fill !== 'none') {
          el.setAttribute('fill', color);
        }
      });
      
      const elementsWithStroke = svgEl.querySelectorAll('[stroke]');
      elementsWithStroke.forEach(el => {
        const stroke = el.getAttribute('stroke');
        if (stroke && stroke !== 'none') {
          el.setAttribute('stroke', color);
        }
      });
      
      const paths = svgEl.querySelectorAll('path, circle, rect, polygon, polyline, ellipse, line');
      paths.forEach(path => {
        if (!path.getAttribute('fill') && !path.getAttribute('stroke')) {
          path.setAttribute('fill', color);
        }
      });
      
      const serializer = new XMLSerializer();
      return serializer.serializeToString(svgEl);
    } catch (err) {
      console.error('[CommandChainIcons] SVG normalization failed:', err);
      return svgContent;
    }
  }

  function svgToDataUrl(svgContent) {
    const normalizedSvg = normalizeSvg(svgContent);
    const encoded = encodeURIComponent(normalizedSvg)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
    return `data:image/svg+xml,${encoded}`;
  }

  async function setCommandChainIcon(commandKey, iconSvg, applyToAllThemes = false) {
    const themes = await getUserThemes();
    if (!themes.length) {
      console.error('[CommandChainIcons] No user themes found');
      return false;
    }

    const buttonKey = `COMMAND_${commandKey}`;
    const iconDataUrl = iconSvg ? svgToDataUrl(iconSvg) : null;

    const currentThemeId = await getCurrentThemeId();
    const themesToUpdate = applyToAllThemes ? themes : themes.filter(t => t.id === currentThemeId);

    for (const theme of themesToUpdate) {
      if (!theme.buttons) {
        theme.buttons = {};
      }
      
      if (iconDataUrl) {
        theme.buttons[buttonKey] = iconDataUrl;
      } else {
        delete theme.buttons[buttonKey];
      }
    }

    vivaldi.prefs.set({
      path: THEMES_PATH,
      value: themes
    });

    const scope = applyToAllThemes ? 'all themes' : 'current theme';
    console.log(`[CommandChainIcons] Icon ${iconSvg ? 'set' : 'cleared'} for ${buttonKey} in ${scope}`);
    return true;
  }

  async function getCommandChainCurrentIcon(commandKey) {
    const iconUrl = await getIconFromTheme(commandKey);
    return iconUrl;
  }

  // ============================================
  // ICONIFY API FUNCTIONS
  // ============================================

  async function searchIconifyIcons(query, limit = 64) {
    if (!query || query.length < 2) return [];
    
    const cacheKey = `search:${query}:${limit}`;
    if (iconSearchCache.has(cacheKey)) {
      return iconSearchCache.get(cacheKey);
    }
    
    try {
      const url = `${ICONIFY_API}/search?query=${encodeURIComponent(query)}&prefix=mdi&limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      const results = data.icons || [];
      iconSearchCache.set(cacheKey, results);
      return results;
    } catch (err) {
      console.error('[CommandChainIcons] Icon search failed:', err);
      return [];
    }
  }

  async function fetchIconifySvg(iconName) {
    const cacheKey = `svg:${iconName}`;
    if (iconSearchCache.has(cacheKey)) {
      return iconSearchCache.get(cacheKey);
    }
    
    try {
      const url = `${ICONIFY_API}/${iconName}.svg?height=24`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Fetch failed');
      
      const svg = await response.text();
      iconSearchCache.set(cacheKey, svg);
      return svg;
    } catch (err) {
      console.error('[CommandChainIcons] Icon fetch failed:', err);
      return null;
    }
  }

  // ============================================
  // UI FUNCTIONS
  // ============================================

  function showToast(message, type = 'info') {
    const existing = document.querySelector('.cci-toast');
    if (existing) existing.remove();
    
    const toast = gnoh.createElement('div', {
      class: `cci-toast cci-toast-${type}`,
      text: message,
    }, document.body);
    
    modState.setTimeout(() => {
      toast.style.opacity = '0';
      modState.setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function closeIconPicker() {
    if (iconPickerDialog) {
      iconPickerDialog.remove();
      iconPickerDialog = null;
    }
  }

  async function showIconPicker(commandChainKey) {
    closeIconPicker();
    
    const commandChain = await getCommandChainByKey(commandChainKey);
    if (!commandChain) {
      showToast('Command chain not found', 'error');
      return;
    }
    
    const currentIconUrl = await getCommandChainCurrentIcon(commandChainKey);
    let selectedIcon = '';
    let currentIconDisplay = '<span class="cci-no-icon">No icon set</span>';
    
    if (currentIconUrl) {
      currentIconDisplay = `<img src="${currentIconUrl}" class="cci-current-img" alt="Current icon">`;
    }
    
    const dialog = gnoh.createElement('div', { class: 'cci-dialog' });
    
    const header = gnoh.createElement('div', { class: 'cci-header' }, dialog);
    gnoh.createElement('h2', { text: 'Set Command Chain Icon' }, header);
    gnoh.createElement('div', { class: 'cci-chain-name', text: commandChain.label }, header);
    
    const content = gnoh.createElement('div', { class: 'cci-content' }, dialog);
    
    const currentSection = gnoh.createElement('div', { class: 'cci-current-section' }, content);
    gnoh.createElement('label', { text: 'Current icon (from active theme):' }, currentSection);
    const currentBox = gnoh.createElement('div', { class: 'cci-preview-box' }, currentSection);
    gnoh.createElement('div', { 
      class: 'cci-preview-icon',
      html: currentIconDisplay
    }, currentBox);
    
    const previewSection = gnoh.createElement('div', { class: 'cci-preview-section' }, content);
    gnoh.createElement('label', { text: 'New icon preview:' }, previewSection);
    const previewBox = gnoh.createElement('div', { class: 'cci-preview-box' }, previewSection);
    const previewIcon = gnoh.createElement('div', { 
      class: 'cci-preview-icon',
      html: '<span class="cci-no-icon">Select an icon</span>'
    }, previewBox);
    
    const updatePreview = (svg) => {
      selectedIcon = svg;
      previewIcon.innerHTML = svg || '<span class="cci-no-icon">No icon</span>';
    };
    
    const gridSection = gnoh.createElement('div', { class: 'cci-grid-section' }, content);
    gnoh.createElement('label', { text: 'Choose an icon:' }, gridSection);
    
    const tabsContainer = gnoh.createElement('div', { class: 'cci-tabs' }, gridSection);
    const gridContainer = gnoh.createElement('div', { class: 'cci-grid-container' }, gridSection);
    
    let searchTimeout = null;
    let currentSearchQuery = '';
    
    const renderIconButton = (grid, name, svg, onSelect) => {
      const btn = gnoh.createElement('button', {
        class: 'cci-icon-btn',
        html: svg,
        title: name,
        events: {
          click: (e) => {
            e.preventDefault();
            grid.querySelectorAll('.cci-icon-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            onSelect(svg);
          }
        }
      }, grid);
      return btn;
    };
    
    const renderGrid = (category) => {
      gridContainer.innerHTML = '';
      const grid = gnoh.createElement('div', { class: 'cci-icon-grid' }, gridContainer);
      
      const iconNames = ICON_CATEGORIES[category] || [];
      iconNames.forEach(name => {
        const svg = ICON_LIBRARY[name];
        if (!svg) return;
        
        const btn = renderIconButton(grid, name, svg, (svg) => {
          updatePreview(svg);
          customInput.value = svg;
        });
        
        if (selectedIcon === svg) {
          btn.classList.add('selected');
        }
      });
    };
    
    const renderSearchUI = () => {
      gridContainer.innerHTML = '';
      
      const searchWrapper = gnoh.createElement('div', { class: 'cci-search-wrapper' }, gridContainer);
      const searchInput = gnoh.createElement('input', {
        type: 'text',
        class: 'cci-search-input',
        placeholder: 'Search 7000+ Material Design Icons...',
        value: currentSearchQuery,
        events: {
          input: (e) => {
            currentSearchQuery = e.target.value;
            if (searchTimeout) clearTimeout(searchTimeout);
            searchTimeout = modState.setTimeout(() => performSearch(currentSearchQuery), 300);
          }
        }
      }, searchWrapper);
      
      const resultsContainer = gnoh.createElement('div', { class: 'cci-search-results' }, gridContainer);
      
      if (currentSearchQuery.length >= 2) {
        performSearch(currentSearchQuery);
      } else {
        resultsContainer.innerHTML = '<div class="cci-search-hint">Type at least 2 characters to search</div>';
      }
      
      searchInput.focus();
      
      async function performSearch(query) {
        if (query.length < 2) {
          resultsContainer.innerHTML = '<div class="cci-search-hint">Type at least 2 characters to search</div>';
          return;
        }
        
        resultsContainer.innerHTML = '<div class="cci-search-loading">Searching...</div>';
        
        const iconNames = await searchIconifyIcons(query, 64);
        
        if (iconNames.length === 0) {
          resultsContainer.innerHTML = '<div class="cci-search-hint">No icons found for "' + query + '"</div>';
          return;
        }
        
        resultsContainer.innerHTML = '';
        const grid = gnoh.createElement('div', { class: 'cci-icon-grid' }, resultsContainer);
        
        for (const fullName of iconNames) {
          const shortName = fullName.replace('mdi:', '');
          const svg = await fetchIconifySvg(fullName);
          if (!svg) continue;
          
          renderIconButton(grid, shortName, svg, (svg) => {
            updatePreview(svg);
            customInput.value = svg;
          });
        }
        
        gnoh.createElement('div', { 
          class: 'cci-search-count',
          text: `Found ${iconNames.length} icons`
        }, resultsContainer);
      }
    };
    
    const searchTab = gnoh.createElement('button', {
      class: 'cci-tab cci-tab-search active',
      html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5Z"/></svg> Search',
      events: {
        click: (e) => {
          e.preventDefault();
          tabsContainer.querySelectorAll('.cci-tab').forEach(t => t.classList.remove('active'));
          searchTab.classList.add('active');
          renderSearchUI();
        }
      }
    }, tabsContainer);
    
    Object.keys(ICON_CATEGORIES).forEach((cat) => {
      const tab = gnoh.createElement('button', {
        class: 'cci-tab',
        text: cat,
        events: {
          click: (e) => {
            e.preventDefault();
            tabsContainer.querySelectorAll('.cci-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderGrid(cat);
          }
        }
      }, tabsContainer);
    });
    
    renderSearchUI();
    
    const customSection = gnoh.createElement('div', { class: 'cci-custom-section' }, content);
    gnoh.createElement('label', { text: 'Or paste custom SVG:' }, customSection);
    
    const customInput = gnoh.createElement('textarea', {
      class: 'cci-custom-input',
      placeholder: '<svg viewBox="0 0 24 24">...</svg>',
      events: {
        input: (e) => {
          const val = e.target.value.trim();
          if (val.startsWith('<svg') && val.endsWith('</svg>')) {
            updatePreview(val);
            gridContainer.querySelectorAll('.cci-icon-btn').forEach(b => b.classList.remove('selected'));
          }
        }
      }
    }, customSection);
    
    if (selectedIcon) {
      customInput.value = selectedIcon;
    }
    
    const uploadSection = gnoh.createElement('div', { class: 'cci-upload-section' }, content);
    gnoh.createElement('label', { text: 'Or upload SVG file:' }, uploadSection);
    
    const fileInput = gnoh.createElement('input', {
      type: 'file',
      accept: '.svg',
      class: 'cci-file-input',
      events: {
        change: async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          
          try {
            const text = await file.text();
            if (text.includes('<svg') && text.includes('</svg>')) {
              const match = text.match(/<svg[\s\S]*<\/svg>/i);
              if (match) {
                const cleanSvg = match[0];
                customInput.value = cleanSvg;
                updatePreview(cleanSvg);
                gridContainer.querySelectorAll('.cci-icon-btn').forEach(b => b.classList.remove('selected'));
                showToast('SVG file loaded', 'success');
              } else {
                showToast('Invalid SVG file', 'error');
              }
            } else {
              showToast('File does not contain valid SVG', 'error');
            }
          } catch (err) {
            showToast('Failed to read file: ' + err.message, 'error');
          }
        }
      }
    }, uploadSection);
    
    const optionsSection = gnoh.createElement('div', { class: 'cci-options-section' }, content);
    const applyAllLabel = gnoh.createElement('label', { class: 'cci-checkbox-label' }, optionsSection);
    const applyAllCheckbox = gnoh.createElement('input', {
      type: 'checkbox',
      class: 'cci-checkbox',
      checked: true
    }, applyAllLabel);
    gnoh.createElement('span', { text: ' Apply to all themes (recommended)' }, applyAllLabel);
    gnoh.createElement('div', { 
      class: 'cci-options-hint',
      text: 'Uncheck to apply only to current theme. Icons are stored per-theme.'
    }, optionsSection);
    
    const footer = gnoh.createElement('div', { class: 'cci-footer' }, dialog);
    
    gnoh.createElement('button', {
      class: 'cci-btn cci-btn-clear',
      text: 'Clear Icon',
      events: {
        click: async (e) => {
          e.preventDefault();
          const applyToAll = applyAllCheckbox.checked;
          await setCommandChainIcon(commandChainKey, null, applyToAll);
          showToast(`Icon cleared from ${applyToAll ? 'all themes' : 'current theme'}`, 'success');
          closeIconPicker();
          reloadSettings();
        }
      }
    }, footer);
    
    gnoh.createElement('button', {
      class: 'cci-btn cci-btn-cancel',
      text: 'Cancel',
      events: {
        click: (e) => {
          e.preventDefault();
          closeIconPicker();
        }
      }
    }, footer);
    
    gnoh.createElement('button', {
      class: 'cci-btn cci-btn-apply',
      text: 'Apply',
      events: {
        click: async (e) => {
          e.preventDefault();
          const iconToSet = customInput.value.trim() || selectedIcon;
          
          if (!iconToSet) {
            showToast('Please select an icon first', 'error');
            return;
          }
          
          if (!iconToSet.startsWith('<svg') || !iconToSet.endsWith('</svg>')) {
            showToast('Invalid SVG format', 'error');
            return;
          }
          
          const applyToAll = applyAllCheckbox.checked;
          const success = await setCommandChainIcon(commandChainKey, iconToSet, applyToAll);
          if (success) {
            showToast(`Icon applied to ${applyToAll ? 'all themes' : 'current theme'}`, 'success');
            closeIconPicker();
            reloadSettings();
          } else {
            showToast('Failed to save icon', 'error');
          }
        }
      }
    }, footer);
    
    const overlay = gnoh.createElement('div', { 
      class: 'cci-overlay',
      events: {
        click: () => closeIconPicker()
      }
    });
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    iconPickerDialog = dialog;
    
    dialog._overlay = overlay;
    const originalRemove = dialog.remove.bind(dialog);
    dialog.remove = () => {
      overlay.remove();
      originalRemove();
    };
    
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeIconPicker();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  async function reloadSettings() {
    const tabs = await chrome.tabs.query({ url: SETTINGS_URL + '*' });
    for (const tab of tabs) {
      chrome.tabs.reload(tab.id);
    }
  }

  // ============================================
  // SETTINGS PAGE INJECTION
  // ============================================

  function createButtonToolbar(attribute, parent) {
    return gnoh.createElement('button', Object.assign({ class: 'button-toolbar' }, attribute), parent);
  }

  function createSettings() {
    if (timeOut) {
      timeOut.stop();
    }
    
    timeOut = gnoh.timeOut(chainedCommand => {
      if (chainedCommand.dataset.commandChainIcons === 'true') {
        return;
      }
      chainedCommand.dataset.commandChainIcons = 'true';
      
      const masterToolbar = chainedCommand.querySelector('.master-toolbar');
      if (!masterToolbar || masterToolbar.dataset.commandChainIcons === 'true') {
        return;
      }
      masterToolbar.dataset.commandChainIcons = 'true';
      
      const master = chainedCommand.querySelector('.master');
      
      async function getSelectedKey() {
        const itemSelected = master?.querySelector('.master-items .item-selected');
        if (!itemSelected) {
          return null;
        }
        const commandList = await getCommandChains();
        const indexSelected = gnoh.element.getIndex(itemSelected);
        return commandList[indexSelected]?.key;
      }
      
      gnoh.element.appendAtIndex(
        createButtonToolbar({
          html: icons.setIcon,
          title: 'Set Icon',
          events: {
            click: async (e) => {
              e.preventDefault();
              const key = await getSelectedKey();
              if (key) {
                showIconPicker(key);
              } else {
                showToast('Please select a command chain first', 'error');
              }
            }
          }
        }),
        masterToolbar,
        4
      );
      
      console.log('[CommandChainIcons] Settings button added');
    }, '.Setting--ChainedCommand.master-detail:not([data-command-chain-icons="true"])');
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  gnoh.addStyle(`
    /* Toast notifications */
    .cci-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: var(--radiusHalf, 4px);
      font-size: 13px;
      z-index: var(--z-overlay, 1000);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: opacity var(--animation-speed, 260ms);
    }
    .cci-toast-success { background: #2e7d32; color: white; }
    .cci-toast-error { background: #c62828; color: white; }
    .cci-toast-info { background: #1565c0; color: white; }
    
    /* Dialog overlay */
    .cci-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: var(--z-modal, 300);
    }
    
    /* Dialog */
    .cci-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--colorBg, #1e1e1e);
      border: 1px solid var(--colorBorder, #333);
      border-radius: 8px;
      width: 520px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: var(--z-popup, 400);
      box-shadow: 0 16px 48px rgba(0,0,0,0.4);
    }
    
    .cci-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--colorBorder, #333);
    }
    
    .cci-header h2 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 600;
      color: var(--colorFg, #fff);
    }
    
    .cci-chain-name {
      font-size: 13px;
      color: var(--colorFgFaded, #888);
    }
    
    .cci-content {
      padding: 16px 20px;
      overflow-y: auto;
      flex: 1;
    }
    
    .cci-content label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--colorFgFaded, #888);
      margin-bottom: 8px;
    }
    
    /* Current icon section */
    .cci-current-section {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--colorBorder, #333);
    }
    
    .cci-current-img {
      width: 28px;
      height: 28px;
    }
    
    /* Preview */
    .cci-preview-section {
      margin-bottom: 16px;
    }
    
    .cci-preview-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--colorBgDark, #161616);
      border-radius: var(--radiusHalf, 4px);
      border: 1px solid var(--colorBorder, #333);
    }
    
    .cci-preview-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--colorBgIntense, #252525);
      border-radius: var(--radiusHalf, 4px);
      color: var(--colorFg, #fff);
    }
    
    .cci-preview-icon svg {
      width: 28px;
      height: 28px;
    }
    
    .cci-no-icon {
      font-size: 10px;
      color: var(--colorFgFaded, #666);
      text-align: center;
    }
    
    /* Options section */
    .cci-options-section {
      margin-bottom: 16px;
      padding: 12px;
      background: var(--colorBgDark, #161616);
      border-radius: var(--radiusHalf, 4px);
      border: 1px solid var(--colorBorder, #333);
    }
    
    .cci-checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 13px;
      color: var(--colorFg, #fff);
    }
    
    .cci-checkbox {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    
    .cci-options-hint {
      margin-top: 6px;
      font-size: 11px;
      color: var(--colorFgFaded, #666);
    }
    
    /* Icon grid */
    .cci-grid-section {
      margin-bottom: 16px;
    }
    
    .cci-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    
    .cci-tab {
      padding: 6px 12px;
      border: none;
      background: var(--colorBgDark, #252525);
      color: var(--colorFgFaded, #888);
      border-radius: var(--radiusHalf, 4px);
      font-size: 12px;
      cursor: pointer;
      transition: all var(--fast-animation-speed, 140ms);
    }
    
    .cci-tab:hover {
      background: var(--colorBgIntense, #303030);
      color: var(--colorFg, #fff);
    }
    
    .cci-tab.active {
      background: var(--colorAccentBg, #3b82f6);
      color: white;
    }
    
    .cci-grid-container {
      background: var(--colorBgDark, #161616);
      border-radius: var(--radiusHalf, 4px);
      border: 1px solid var(--colorBorder, #333);
      padding: 8px;
      max-height: 180px;
      overflow-y: auto;
    }
    
    .cci-icon-grid {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      gap: 4px;
    }
    
    .cci-icon-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid transparent;
      background: var(--colorBgIntense, #252525);
      border-radius: var(--radiusHalf, 4px);
      cursor: pointer;
      color: var(--colorFg, #fff);
      transition: all var(--fast-animation-speed, 140ms);
    }
    
    .cci-icon-btn svg {
      width: 20px;
      height: 20px;
    }
    
    .cci-icon-btn:hover {
      background: var(--colorBgIntenser, #353535);
      transform: scale(1.1);
    }
    
    .cci-icon-btn.selected {
      border-color: var(--colorAccentBg, #3b82f6);
      background: var(--colorAccentBgFaded, rgba(59, 130, 246, 0.2));
    }
    
    /* Custom SVG input */
    .cci-custom-section {
      margin-bottom: 16px;
    }
    
    .cci-custom-input {
      width: 100%;
      height: 80px;
      padding: 10px;
      border: 1px solid var(--colorBorder, #333);
      border-radius: var(--radiusHalf, 4px);
      background: var(--colorBgDark, #161616);
      color: var(--colorFg, #fff);
      font-family: monospace;
      font-size: 12px;
      resize: vertical;
    }
    
    .cci-custom-input:focus {
      outline: none;
      border-color: var(--colorAccentBg, #3b82f6);
    }
    
    /* File upload */
    .cci-upload-section {
      margin-bottom: 8px;
    }
    
    .cci-file-input {
      width: 100%;
      padding: 8px;
      border: 1px dashed var(--colorBorder, #333);
      border-radius: var(--radiusHalf, 4px);
      background: var(--colorBgDark, #161616);
      color: var(--colorFg, #fff);
      font-size: 12px;
    }
    
    .cci-file-input::file-selector-button {
      padding: 6px 12px;
      border: none;
      border-radius: var(--radiusHalf, 4px);
      background: var(--colorBgIntense, #252525);
      color: var(--colorFg, #fff);
      cursor: pointer;
      margin-right: 12px;
    }
    
    .cci-file-input::file-selector-button:hover {
      background: var(--colorBgIntenser, #353535);
    }
    
    /* Footer */
    .cci-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--colorBorder, #333);
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    
    .cci-btn {
      padding: 8px 16px;
      border: none;
      border-radius: var(--radiusHalf, 4px);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--fast-animation-speed, 140ms);
    }
    
    .cci-btn-clear {
      background: transparent;
      color: var(--colorFgFaded, #888);
      margin-right: auto;
    }
    
    .cci-btn-clear:hover {
      color: var(--colorFg, #fff);
      background: var(--colorBgIntense, #252525);
    }
    
    .cci-btn-cancel {
      background: var(--colorBgIntense, #252525);
      color: var(--colorFg, #fff);
    }
    
    .cci-btn-cancel:hover {
      background: var(--colorBgIntenser, #353535);
    }
    
    .cci-btn-apply {
      background: var(--colorAccentBg, #3b82f6);
      color: white;
    }
    
    .cci-btn-apply:hover {
      filter: brightness(1.1);
    }
    
    /* Search tab */
    .cci-tab-search {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .cci-tab-search svg {
      flex-shrink: 0;
    }
    
    .cci-search-wrapper {
      margin-bottom: 12px;
    }
    
    .cci-search-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--colorBorder, #333);
      border-radius: var(--radiusHalf, 4px);
      background: var(--colorBgIntense, #252525);
      color: var(--colorFg, #fff);
      font-size: 13px;
    }
    
    .cci-search-input:focus {
      outline: none;
      border-color: var(--colorAccentBg, #3b82f6);
    }
    
    .cci-search-input::placeholder {
      color: var(--colorFgFaded, #666);
    }
    
    .cci-search-results {
      min-height: 100px;
    }
    
    .cci-search-hint,
    .cci-search-loading {
      padding: 20px;
      text-align: center;
      color: var(--colorFgFaded, #666);
      font-size: 12px;
    }
    
    .cci-search-count {
      padding: 8px;
      text-align: center;
      color: var(--colorFgFaded, #666);
      font-size: 11px;
      border-top: 1px solid var(--colorBorder, #333);
      margin-top: 8px;
    }
  `, 'command-chain-icons');

  const tabUpdateHandler = (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('settings.html') && tab.url?.includes('path=qc')) {
      modState.setTimeout(createSettings, 500);
    }
  };
  modState.addChromeListener(chrome.tabs, 'onUpdated', tabUpdateHandler);

  gnoh.timeOut(async () => {
    console.log('[CommandChainIcons] Initializing...');
    
    try {
      if (document.querySelector('#main > .webpageview')) {
        console.log('[CommandChainIcons] Found webpageview, looking for Quick Commands menu item');
        const menuItem = document.evaluate(
          '//div[contains(concat(" ", normalize-space(@class), " "), " tree-row ") and contains(., "Quick Commands")]',
          document, null, XPathResult.ANY_TYPE, null
        ).iterateNext();
        
        if (menuItem) {
          console.log('[CommandChainIcons] Found Quick Commands menu item, adding click listener');
          modState.addEventListener(menuItem, 'click', () => modState.setTimeout(createSettings, 300));
        } else {
          console.log('[CommandChainIcons] Quick Commands menu item not found');
        }
      } else {
        console.log('[CommandChainIcons] No webpageview, checking if on settings page');
        const tabs = await chrome.tabs.query({ active: true, windowId: vivaldiWindowId });
        console.log('[CommandChainIcons] Active tab:', tabs[0]?.url);
        if (tabs.length && tabs[0].url?.includes('settings.html') && tabs[0].url?.includes('path=qc')) {
          console.log('[CommandChainIcons] On Quick Commands settings page, calling createSettings');
          createSettings();
        }
      }
      
      window.addEventListener('beforeunload', () => {
        if (timeOut) timeOut.stop();
        closeIconPicker();
        modState.cleanup();
      });
      
      console.log('[CommandChainIcons] Initialized - button appears in Settings > Quick Commands');
    } catch (err) {
      console.error('[CommandChainIcons] Initialization error:', err);
    }
  }, '#main');
})();
