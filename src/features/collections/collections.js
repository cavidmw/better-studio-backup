// BYS Collections - Orchestrator / Feature Entry Point
// Namespace: window.BYS.Collections
// Bu dosya, Collections modülünün BYS featureToggle sistemiyle entegrasyon noktasıdır.
// youtubeMain.js tarafından `window.BYS.Collections.init()` ve `window.BYS.Collections.cleanup()` çağrılır.

window.BYS = window.BYS || {};
window.BYS.Collections = window.BYS.Collections || {};

(() => {
  // ─── Guard ────────────────────────────────────────────────────────────────
  if (window.BYS._collectionsInitialized) {
    return;
  }

  // ─── Orchestrator State ───────────────────────────────────────────────────
  let isInitialized = false;

  // ─── init ─────────────────────────────────────────────────────────────────
  window.BYS.Collections.init = () => {
    if (isInitialized) return;
    isInitialized = true;
    window.BYS._collectionsInitialized = true;


    // Observer başlat
    const Observer = window.BYS.Collections.Observer;
    Observer.init();

    // Re-usable handlers
    const handleNavigate = (pageType) => {
      if (pageType === 'channel') {
        window.BYS.Collections.ChannelPage.forceReset();
        window.BYS.Collections.ChannelPage.inject().then(ok => {
          if (!ok) { /* deferred */ }
        });
      } else {
        window.BYS.Collections.ChannelPage.remove();
      }

      // Guide (sidebar) butonu — sol menüye enjekte et
      if (!window.BYS.Collections.GuideButton.exists()) {
        window.BYS.Collections.GuideButton.inject();
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


  };

  // ─── cleanup ──────────────────────────────────────────────────────────────
  window.BYS.Collections.cleanup = () => {
    if (!isInitialized) return;


    window.BYS.Collections.Observer.destroy();
    window.BYS.Collections.GuideButton.remove();
    window.BYS.Collections.ChannelPage.remove();

    // Global modal varsa kapat ve kaldır
    const modal = document.getElementById('ytc-global-modal');
    if (modal) modal.remove();

    // CSS class temizle
    document.documentElement.classList.remove('ytc-light-theme');

    isInitialized = false;
    window.BYS._collectionsInitialized = false;

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
