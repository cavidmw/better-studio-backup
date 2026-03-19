// YouTube Collections - Main Content Script v2
// Orchestrates all modules using CollectionsObserver's native YT event bindings

(function() {
  'use strict';

  if (window.ytCollectionsInitialized) return;
  window.ytCollectionsInitialized = true;

  console.log('YouTube Collections: Initializing...');

  // ─── Masthead (Koleksiyonlar top bar button) ────────────────────────────
  const injectMastheadButton = () => {
    if (CollectionsMastheadButton.exists()) return;
    CollectionsMastheadButton.inject();
  };

  // ─── Channel button ─────────────────────────────────────────────────────
  const injectChannelButton = () => {
    if (!CollectionsObserver.isChannelPage()) return;
    CollectionsChannelPage.inject();
  };

  CollectionsObserver.onNavigate((pageType) => {
    injectMastheadButton();
    if (pageType === 'channel') {
      CollectionsChannelPage.forceReset();
      CollectionsChannelPage.inject();
    } else {
      CollectionsChannelPage.forceReset();
    }
  });

  CollectionsObserver.onPageDataUpdated((pageType) => {
    injectMastheadButton();
    if (pageType === 'channel') {
      if (!CollectionsChannelPage.exists()) {
        CollectionsChannelPage.inject();
      }
      CollectionsChannelPage.refreshState();
    }
  });

  // ─── Bootstrap ──────────────────────────────────────────────────────────
  const init = () => {
    CollectionsObserver.init();       // binds YT events + starts MutationObserver

    // Immediate inject for the page we're already on
    injectMastheadButton();
    injectChannelButton();
  };

  const waitForYouTube = () => {
    if (document.querySelector('ytd-app')) {
      init();
    } else {
      setTimeout(waitForYouTube, 100);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForYouTube);
  } else {
    waitForYouTube();
  }

  // ─── Debug API ───────────────────────────────────────────────────────────
  window.YouTubeCollections = {
    storage:        CollectionsStorage,
    globalModal:    CollectionsGlobalModal,
    mastheadButton: CollectionsMastheadButton,
    channelPage:    CollectionsChannelPage,
    modals:         CollectionsModals,
    observer:       CollectionsObserver,
    api: {
      getFolders:   () => CollectionsStorage.getFolders(),
      createFolder: (name, desc) => CollectionsStorage.createFolder(name, desc),
      openModal:    () => CollectionsGlobalModal.open()
    }
  };

  console.log('YouTube Collections: Ready ✓');
})();

