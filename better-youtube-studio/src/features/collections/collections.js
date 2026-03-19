// BYS Collections - Orchestrator / Feature Entry Point
// Namespace: window.BYS.Collections
// Bu dosya, Collections modülünün BYS featureToggle sistemiyle entegrasyon noktasıdır.
// youtubeMain.js tarafından `window.BYS.Collections.init()` ve `window.BYS.Collections.cleanup()` çağrılır.

window.BYS = window.BYS || {};
window.BYS.Collections = window.BYS.Collections || {};

(() => {
  // ─── Guard ────────────────────────────────────────────────────────────────
  if (window.BYS._collectionsInitialized) {
    console.log('BYS Collections: Already initialized, skipping...');
    return;
  }

  // ─── Orchestrator State ───────────────────────────────────────────────────
  let isInitialized = false;

  // ─── init ─────────────────────────────────────────────────────────────────
  window.BYS.Collections.init = () => {
    if (isInitialized) return;
    isInitialized = true;
    window.BYS._collectionsInitialized = true;
    console.log('BYS Collections: Initializing...');

    // Observer başlat
    const Observer = window.BYS.Collections.Observer;
    Observer.init();

    // Re-usable handlers
    const handleNavigate = (pageType) => {
      if (pageType === 'channel') {
        window.BYS.Collections.ChannelPage.forceReset();
        window.BYS.Collections.ChannelPage.inject().then(ok => {
          if (!ok) console.log('BYS Collections: Channel button inject deferred');
        });
      } else {
        window.BYS.Collections.ChannelPage.remove();
      }

      // Masthead butonu her sayfada görünür
      if (!window.BYS.Collections.MastheadButton.exists()) {
        Observer.waitForElement('#masthead', 5000).then(() => {
          window.BYS.Collections.MastheadButton.inject();
        }).catch(() => {
          window.BYS.Collections.MastheadButton.inject();
        });
      }
    };

    const handlePageData = (pageType) => {
      if (pageType === 'channel') {
        window.BYS.Collections.ChannelPage.refreshState();
      }
    };

    // Navigation olaylarına bağlan
    Observer.onNavigate(handleNavigate);
    Observer.onPageDataUpdated(handlePageData);

    // İlk yüklemede mevcut sayfayı işle
    const initialPage = Observer.getPageType();
    handleNavigate(initialPage);

    console.log('BYS Collections: Initialized ✓');
  };

  // ─── cleanup ──────────────────────────────────────────────────────────────
  window.BYS.Collections.cleanup = () => {
    if (!isInitialized) return;
    console.log('BYS Collections: Cleaning up...');

    window.BYS.Collections.Observer.destroy();
    window.BYS.Collections.MastheadButton.remove();
    window.BYS.Collections.ChannelPage.remove();

    // Global modal varsa kapat ve kaldır
    const modal = document.getElementById('ytc-global-modal');
    if (modal) modal.remove();

    // CSS class temizle
    document.documentElement.classList.remove('ytc-light-theme');

    isInitialized = false;
    window.BYS._collectionsInitialized = false;
    console.log('BYS Collections: Cleanup complete ✓');
  };

  // ─── Debug API ─────────────────────────────────────────────────────────────
  // Orijinal Collections'daki window.YouTubeCollections debug API'si korunuyor
  window.YouTubeCollections = {
    openModal:  () => window.BYS.Collections.GlobalModal.open(),
    closeModal: () => window.BYS.Collections.GlobalModal.close(),
    getStorage: () => window.BYS.Collections.Storage,
    getConfig:  () => window.BYS.Collections.Config
  };
})();
