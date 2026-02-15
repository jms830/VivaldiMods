// ============================================================================
// VIVALDI MODS - Custom JS Loader
// ============================================================================
//
// This is the ONLY script referenced from window.html (one-liner injection).
// It dynamically loads all enabled JS mods from Application/javascript/.
//
// HOW TO USE:
//   - Comment/uncomment lines in the arrays below to enable/disable mods
//   - Restart Vivaldi after changes
//
// This file persists across Vivaldi updates (lives in Application/javascript/).
// After a Vivaldi update, only the one-liner in window.html needs re-injecting.
//
// ============================================================================

(function loadVivaldiMods() {
  'use strict';

  // Resolve base path from this script's location
  // (works regardless of Vivaldi version folder depth)
  var currentScript = document.currentScript;
  var base = currentScript ? currentScript.src.substring(0, currentScript.src.lastIndexOf('/') + 1) : 'javascript/';

  // ========================================================================
  // ENABLED MODS - Comment out a line to disable that mod
  // ========================================================================
  var enabledMods = [

    // --- CORE MODS ---
    'workspaceColors.js',                       // Assigns colors to workspaces
    'workspaceButtons.js',                      // Quick-switch buttons in tabbar sidebar
    'importExportWorkspaceRules.js',            // Backup/restore workspace assignments

    // --- TAB MANAGEMENT ---
    'tidyTabs.js',                              // AI-powered tab grouping (requires API key)
    'cleartabs.js',                             // One-click close all tabs in workspace
    // 'tidyTitles.js',                         // AI-powered tab title cleanup (experimental)

    // --- UI ENHANCEMENTS ---
    'commandChainIcons.js',                     // Custom icons for command chains
    'Tam710562/globalMediaControls.js',         // Media playback panel in sidebar
    'Tam710562/dialogTab.js',                   // Opens dialogs in tabs instead of popups
    'Tam710562/easyFiles.js',                   // Drag-and-drop file management
    'Tam710562/elementCapture.js',              // Screenshot element tool
    'Tam710562/mdNotes.js',                     // Markdown notes in sidebar panel
    // 'Tam710562/adaptiveWebPanelHeaders.js',  // DISABLED: Monkey-patches Element.prototype.appendChild globally, causes panel reload loops
    'Tam710562/feedIcon.js',                    // RSS feed indicator in address bar
    'Tam710562/clickAddBlockList.js',           // Easy ad-block list management
    'Tam710562/importExportCommandChains.js',   // Backup command chains

    // --- SETTINGS & UTILITIES ---
    'luetage/collapseKeyboardSettings.js',      // Collapsible keyboard shortcut sections
    'luetage/backupSearchEngines.js',           // Export/import search engines
  ];

  // ========================================================================
  // DISABLED BY DEFAULT - Uncomment to enable
  // ========================================================================
  var disabledMods = [
    // 'Tam710562/selectSearch.js',             // CAUTION: Causes OmniDropdown clipping
    // 'immersiveAddressbar.js',                // Full-width URL bar (may conflict with sidebar)
    // 'mainbar.js',                            // Custom toolbar positioning
    // 'wrapToday.js',                          // Date formatting in UI

    // --- EXPERIMENTAL / DEPRECATED ---
    // 'aminought/chroma.min.js',               // Required dependency for colorTabs
    // 'aminought/colorTabs.js',                // Color tab borders by favicon
    // 'aminought/ybAddressBar.js',             // Alternative address bar styling
    // 'luetage/accentMod.js',                  // Dynamic accent colors
    // 'luetage/activateTabOnHover.js',         // Switch tabs by hovering
    // 'luetage/monochromeIcons.js',            // Desaturate toolbar icons
    // 'luetage/moonPhase.js',                  // Show moon phase in UI
    // 'luetage/tabScroll.js',                  // Scroll wheel tab switching
    // 'luetage/themeInternal.js',              // Internal theme modifications
    // 'Other/autoHidePanel.js',                // Custom panel auto-hide (conflicts w/ native 7.8+)
    // 'Other/picture-in-picture.js',           // CAUTION: Causes dead space on panel edge
    // 'Other/vivaldiDashboardCamo.js',         // Dashboard theming
    // 'Other/g_bartsch-hibernateTabs.js',      // Suspend inactive tabs
    // 'PageAction/follower-tabs.js',           // Tab following behavior
    // 'PageAction/tabslock.js',                // Lock tabs from closing
    // 'tabPanelMediaControls.js',              // Media controls in tab panel
    // 'utils.js',                              // Utility functions (dependency for some mods)
  ];

  // ========================================================================
  // LOADER - Do not edit below this line
  // ========================================================================

  var allMods = enabledMods.concat(disabledMods.filter(Boolean));
  var loaded = 0;

  allMods.forEach(function(mod) {
    if (typeof mod !== 'string' || mod.length === 0) return;
    var s = document.createElement('script');
    s.src = base + mod;
    s.onerror = function() { console.warn('[Vivaldi Mods] Failed to load: ' + mod); };
    document.head.appendChild(s);
    loaded++;
  });

  console.log('[Vivaldi Mods] Loaded ' + loaded + ' mod(s) from ' + base);
})();
