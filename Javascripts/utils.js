(function vivaldiModUtils() {
  'use strict';

  window.VivaldiModUtils = {
    waitForElement(selector, timeout = 5000) {
      return new Promise((resolve, reject) => {
        const el = document.querySelector(selector);
        if (el) return resolve(el);

        const observer = new MutationObserver((_, obs) => {
          const el = document.querySelector(selector);
          if (el) {
            obs.disconnect();
            resolve(el);
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
          observer.disconnect();
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
      });
    },

    getReactProps(element) {
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;
      const key = Object.keys(element).find(k => k.startsWith('__reactProps'));
      return key ? element[key] : null;
    },

    simulateReactClick(element) {
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return false;

      const pointerDown = new PointerEvent('pointerdown', {
        view: window, bubbles: true, cancelable: true,
        buttons: 0, pointerType: 'mouse'
      });
      pointerDown.persist = () => {};

      const props = this.getReactProps(element);
      if (props?.onPointerDown) {
        props.onPointerDown(pointerDown);
        element.dispatchEvent(new PointerEvent('pointerup', {
          view: window, bubbles: true, cancelable: true,
          buttons: 0, pointerType: 'mouse'
        }));
        return true;
      }
      return false;
    },

    createMod(name, initFn) {
      const mod = {
        name,
        listeners: [],
        observers: [],
        intervals: [],
        timeouts: [],

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

        setInterval(callback, delay) {
          const id = setInterval(callback, delay);
          this.intervals.push(id);
          return id;
        },

        setTimeout(callback, delay) {
          const id = setTimeout(callback, delay);
          this.timeouts.push(id);
          return id;
        },

        cleanup() {
          this.listeners.forEach(({ target, event, handler, options }) => {
            target.removeEventListener(event, handler, options);
          });
          this.observers.forEach(obs => obs.disconnect());
          this.intervals.forEach(id => clearInterval(id));
          this.timeouts.forEach(id => clearTimeout(id));
          this.listeners = [];
          this.observers = [];
          this.intervals = [];
          this.timeouts = [];
          console.log(`[${this.name}] Cleanup complete`);
        }
      };

      window.VivaldiModUtils.waitForElement('#browser')
        .then(() => initFn(mod))
        .catch(e => console.error(`[${name}] Init failed:`, e));

      window.addEventListener('beforeunload', () => mod.cleanup());

      return mod;
    }
  };

  console.log('[VivaldiModUtils] Loaded');
})();
