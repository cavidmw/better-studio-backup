// YouTube Collections - Observer Module v2
// vidIQ-style: native YT events + debounced MutationObserver fallback

const CollectionsObserver = (() => {
  let mutationObserver = null;
  let lastUrl = '';
  let debounceTimer = null;

  // ─── navigation abort controller ─────────────────────────────────────
  // Whenever navigation starts we abort any pending waitForElement promises
  // so stale injections from the previous page can't complete.
  let currentNavAbortController = new AbortController();

  const abortNavigation = () => {
    currentNavAbortController.abort();
    currentNavAbortController = new AbortController();
  };

  // ─── Page type helpers ────────────────────────────────────────────────
  const isHomePage = () => {
    const p = window.location.pathname;
    return p === '/' || p.startsWith('/feed/');
  };

  const isChannelPage = () => {
    const p = window.location.pathname;
    return p.startsWith('/@') || p.startsWith('/channel/') || p.startsWith('/c/') || p.startsWith('/user/');
  };

  const getPageType = () => {
    if (isHomePage()) return 'home';
    if (isChannelPage()) return 'channel';
    return 'other';
  };

  // ─── Callbacks ─────────────────────────────────────────────────────────
  const callbacks = { onNavigate: [], onPageDataUpdated: [], onDOMChange: [] };

  const onNavigate        = fn => callbacks.onNavigate.push(fn);
  const onPageDataUpdated = fn => callbacks.onPageDataUpdated.push(fn);
  const onDOMChange       = fn => callbacks.onDOMChange.push(fn);

  const fireNavigate = () => {
    const url = window.location.href;
    if (url === lastUrl) return;
    lastUrl = url;
    abortNavigation();                               // cancel stale waits
    callbacks.onNavigate.forEach(cb => cb(getPageType(), url));
  };

  const firePageDataUpdated = () => {
    callbacks.onPageDataUpdated.forEach(cb => cb(getPageType(), window.location.href));
  };

  // ─── Debounced MutationObserver (URL-diff only) ───────────────────────
  const startMutationObserver = () => {
    if (mutationObserver) return;
    mutationObserver = new MutationObserver(mutations => {
      // URL check – debounced so we don't fire 1000x per navigation
      if (window.location.href !== lastUrl) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fireNavigate, 50);
      }
      callbacks.onDOMChange.forEach(cb => cb(mutations));
    });
    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  };

  // ─── YouTube native SPA events (primary mechanism) ────────────────────
  const bindYTEvents = () => {
    // yt-navigate-start  → navigation begins, cancel stale waits immediately
    document.addEventListener('yt-navigate-start', () => {
      abortNavigation();
    });

    // yt-navigate-finish → URL has changed and skeleton DOM is painted
    document.addEventListener('yt-navigate-finish', () => {
      fireNavigate();
    });

    // yt-page-data-updated → real page data (channel name, avatar…) is ready
    // This is the key event for updating button state - fires AFTER navigate-finish
    document.addEventListener('yt-page-data-updated', () => {
      firePageDataUpdated();
    });

    // History API (back/forward buttons)
    window.addEventListener('popstate', () => {
      setTimeout(fireNavigate, 0);
    });
  };

  // ─── waitForElement ───────────────────────────────────────────────────
  // Returns a Promise that resolves when any of `selectors` matches in DOM,
  // or rejects if `timeout` expires OR the navigation AbortSignal fires.
  const waitForElement = (selectors, timeout = 5000) => {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];
    const signal = currentNavAbortController.signal;

    return new Promise((resolve, reject) => {
      // Already present?
      for (const s of selectorList) {
        const el = document.querySelector(s);
        if (el) { resolve(el); return; }
      }

      if (signal.aborted) { reject(new DOMException('Navigation aborted', 'AbortError')); return; }

      let obs;
      const cleanup = () => { obs && obs.disconnect(); clearTimeout(timer); signal.removeEventListener('abort', onAbort); };
      const onAbort = () => { cleanup(); reject(new DOMException('Navigation aborted', 'AbortError')); };
      signal.addEventListener('abort', onAbort, { once: true });

      const timer = setTimeout(() => { cleanup(); reject(new Error(`Timeout: ${selectorList[0]}`)); }, timeout);

      obs = new MutationObserver(() => {
        for (const s of selectorList) {
          const el = document.querySelector(s);
          if (el) { cleanup(); resolve(el); return; }
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    });
  };

  // ─── URL handle extraction ──────────────────────────────────────────────
  const getHandleFromUrl = () => {
    const path = window.location.pathname;
    // /@handle → handle (lowercased for comparison)
    const m = path.match(/^\/@([\w.-]+)/);
    return m ? m[1].toLowerCase() : null;
  };

  // ─── DOM handle selectors ──────────────────────────────────────────────
  const HANDLE_SELECTORS = [
    'yt-page-header-view-model yt-content-metadata-view-model span',
    '#channel-handle',
    'ytd-c4-tabbed-header-renderer #channel-handle',
    '#inner-header-container #channel-handle'
  ];

  const getDOMHandle = () => {
    for (const sel of HANDLE_SELECTORS) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        const text = el.textContent.trim();
        if (text.startsWith('@')) return text.slice(1).toLowerCase();
      }
    }
    return null;
  };

  // ─── waitForDOMSync ────────────────────────────────────────────────────
  // Polls every `interval`ms until the DOM-displayed handle matches the
  // handle in the current URL.  Resolves with `true` when synced or
  // `false` if timed out / navigation was aborted.
  //
  // For /channel/UCxxxx URLs where there's no handle in the URL, resolves
  // immediately (we rely on yt-page-data-updated in those cases).
  const waitForDOMSync = (timeout = 5000, interval = 80) => {
    const urlHandle = getHandleFromUrl();
    const signal = currentNavAbortController.signal;

    // No handle in URL (e.g. /channel/UCxxx) — can't poll for it
    if (!urlHandle) return Promise.resolve(true);

    return new Promise((resolve) => {
      // Already synced?
      if (getDOMHandle() === urlHandle) { resolve(true); return; }
      if (signal.aborted) { resolve(false); return; }

      const startTime = Date.now();
      const timer = setInterval(() => {
        if (signal.aborted) { clearInterval(timer); resolve(false); return; }
        if (getDOMHandle() === urlHandle) { clearInterval(timer); resolve(true); return; }
        if (Date.now() - startTime > timeout) { clearInterval(timer); resolve(false); return; }
      }, interval);

      // Also abort on navigation
      const onAbort = () => { clearInterval(timer); resolve(false); };
      signal.addEventListener('abort', onAbort, { once: true });
    });
  };
  // ─── Theme Observer ───────────────────────────────────────────────────
  // YouTube signals light mode by removing the `dark` attribute on <html>.
  // We mirror this by toggling `ytc-light-theme` on <html> so our CSS
  // variables can flip the entire extension palette instantly.
  const applyTheme = () => {
    const isLight = !document.documentElement.hasAttribute('dark');
    document.documentElement.classList.toggle('ytc-light-theme', isLight);
  };

  let themeObserver = null;

  const startThemeObserver = () => {
    applyTheme(); // Apply correct theme immediately on load
    themeObserver = new MutationObserver(() => applyTheme());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dark']
    });
  };

  // ─── Init ─────────────────────────────────────────────────────────────
  const init = () => {
    lastUrl = window.location.href;
    bindYTEvents();
    startMutationObserver();
    startThemeObserver();
  };

  const destroy = () => {
    mutationObserver && mutationObserver.disconnect();
    mutationObserver = null;
    themeObserver && themeObserver.disconnect();
    themeObserver = null;
    abortNavigation();
  };

  return {
    init,
    destroy,
    onNavigate,
    onPageDataUpdated,
    onDOMChange,
    waitForElement,
    waitForDOMSync,
    getHandleFromUrl,
    isHomePage,
    isChannelPage,
    getPageType,
    getNavSignal: () => currentNavAbortController.signal
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CollectionsObserver;
}
