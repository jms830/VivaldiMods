(function () {
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

  function FollowerTabs() {
    var linksArr = document.getElementsByTagName("a");
    for (var i = 0; i < linksArr.length; i++) {
      linksArr[i].setAttribute("target", "followertab");
    }
  }

  const domContentLoadedHandler = function () {
    FollowerTabs();
  };

  if (document.readyState === 'complete') {
    FollowerTabs();
  } else {
    modState.addEventListener(document, 'DOMContentLoaded', domContentLoadedHandler);
  }

  window.addEventListener('beforeunload', () => modState.cleanup());
})();
