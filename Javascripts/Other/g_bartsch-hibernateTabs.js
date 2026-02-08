(function () {
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
      this.observers.forEach(obs => {
        obs.disconnect();
      });
      this.timeouts.forEach(id => {
        clearTimeout(id);
      });
      this.intervals.forEach(id => {
        clearInterval(id);
      });
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

  const HIBERNATE_TIMEOUT = 15 * 1000; // 15 seconds
	//const HIBERNATE_TIMEOUT = 15 * 1000; // 15 seconds
	//const HIBERNATE_TIMEOUT = 30 * 1000; // 30 seconds
	//const HIBERNATE_TIMEOUT = 60 * 1000; // 1 minute
	//const HIBERNATE_TIMEOUT = 2 * 60 * 1000; // 2 minutes
	//const HIBERNATE_TIMEOUT = 3 * 60 * 1000; // 3 minutes
	//const HIBERNATE_TIMEOUT = 4 * 60 * 1000; // 4 minutes
	//const HIBERNATE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  function hibernateInactiveTabs() {
    const tabs = chrome.tabs.query({ currentWindow: true, active: false }, (tabs) => {
      tabs.forEach((tab) => {
        const elapsedTime = Date.now() - tab.lastAccessed;
        if (elapsedTime >= HIBERNATE_TIMEOUT) {
          chrome.tabs.discard(tab.id);
        }
      });
    });
  }

  modState.setInterval(hibernateInactiveTabs, HIBERNATE_TIMEOUT / 2);
  window.addEventListener('beforeunload', () => modState.cleanup());
})();
