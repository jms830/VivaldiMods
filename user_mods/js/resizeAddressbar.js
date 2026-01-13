// Resize Address Bar Height
// version 2025.01.12
// Adds a draggable resize handle below the address bar
// Drag up/down to adjust toolbar height, persists to localStorage

(function resizeAddressbar() {
  "use strict";

  const STORAGE_KEY = "vivaldi-addressbar-height";
  const MIN_HEIGHT = 32;
  const MAX_HEIGHT = 72;
  const DEFAULT_HEIGHT = 44;

  // Wait for browser element
  const waitForElement = (selector) => {
    return new Promise((resolve) => {
      const check = () => {
        const el = document.querySelector(selector);
        if (el) {
          resolve(el);
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });
  };

  // Inject CSS for the resize handle
  const addStyles = () => {
    const style = document.createElement("style");
    style.textContent = `
      .mainbar-resize-handle {
        position: absolute;
        bottom: -3px;
        left: 0;
        right: 0;
        height: 6px;
        cursor: ns-resize;
        z-index: 999999;
        background: transparent;
        transition: background-color 0.15s ease;
      }
      
      .mainbar-resize-handle:hover,
      .mainbar-resize-handle.dragging {
        background: var(--colorHighlightBg, #0078d4);
        opacity: 0.5;
      }
      
      .mainbar-resize-handle.dragging {
        opacity: 0.8;
      }
      
      /* Ensure mainbar is positioned for absolute children */
      .mainbar {
        position: relative !important;
      }
      
      /* Visual feedback during drag */
      body.addressbar-resizing * {
        cursor: ns-resize !important;
        user-select: none !important;
      }
      
      body.addressbar-resizing webview,
      body.addressbar-resizing iframe {
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  };

  // Apply height to toolbar
  const applyHeight = (height) => {
    const clampedHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height));
    document.documentElement.style.setProperty("--mod-mainbar-height", `${clampedHeight}px`);
    
    // Also directly style the toolbar for immediate effect
    const toolbar = document.querySelector(".mainbar > .toolbar-mainbar");
    if (toolbar) {
      toolbar.style.height = `${clampedHeight}px`;
      toolbar.style.minHeight = `${clampedHeight}px`;
      toolbar.style.maxHeight = `${clampedHeight}px`;
    }
    
    return clampedHeight;
  };

  // Save height to localStorage
  const saveHeight = (height) => {
    try {
      localStorage.setItem(STORAGE_KEY, height.toString());
    } catch (e) {
      console.warn("Failed to save addressbar height:", e);
    }
  };

  // Load height from localStorage
  const loadHeight = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const height = parseInt(saved, 10);
        if (!isNaN(height) && height >= MIN_HEIGHT && height <= MAX_HEIGHT) {
          return height;
        }
      }
    } catch (e) {
      console.warn("Failed to load addressbar height:", e);
    }
    return DEFAULT_HEIGHT;
  };

  // Create and attach the resize handle
  const createResizeHandle = (mainbar) => {
    const handle = document.createElement("div");
    handle.className = "mainbar-resize-handle";
    handle.title = "Drag to resize address bar height";
    
    let isDragging = false;
    let startY = 0;
    let startHeight = 0;

    const onMouseDown = (e) => {
      if (e.button !== 0) return; // Only left click
      
      isDragging = true;
      startY = e.clientY;
      
      const toolbar = mainbar.querySelector(".toolbar-mainbar");
      startHeight = toolbar ? toolbar.offsetHeight : loadHeight();
      
      handle.classList.add("dragging");
      document.body.classList.add("addressbar-resizing");
      
      e.preventDefault();
      e.stopPropagation();
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaY = e.clientY - startY;
      const newHeight = startHeight + deltaY;
      applyHeight(newHeight);
      
      e.preventDefault();
    };

    const onMouseUp = (e) => {
      if (!isDragging) return;
      
      isDragging = false;
      handle.classList.remove("dragging");
      document.body.classList.remove("addressbar-resizing");
      
      const toolbar = mainbar.querySelector(".toolbar-mainbar");
      const finalHeight = toolbar ? toolbar.offsetHeight : loadHeight();
      saveHeight(finalHeight);
      
      e.preventDefault();
    };

    handle.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    
    // Also handle mouse leaving window
    document.addEventListener("mouseleave", onMouseUp);
    
    mainbar.appendChild(handle);
    return handle;
  };

  // Double-click to reset to default
  const addDoubleClickReset = (handle) => {
    handle.addEventListener("dblclick", (e) => {
      applyHeight(DEFAULT_HEIGHT);
      saveHeight(DEFAULT_HEIGHT);
      e.preventDefault();
    });
  };

  // Initialize
  const init = async () => {
    await waitForElement("#browser");
    
    const mainbar = document.querySelector(".mainbar");
    if (!mainbar) {
      console.warn("resizeAddressbar: .mainbar not found");
      return;
    }

    addStyles();
    
    // Apply saved height immediately
    const savedHeight = loadHeight();
    applyHeight(savedHeight);
    
    // Create resize handle
    const handle = createResizeHandle(mainbar);
    addDoubleClickReset(handle);
    
    console.log(`resizeAddressbar: initialized with height ${savedHeight}px`);
  };

  // Run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
