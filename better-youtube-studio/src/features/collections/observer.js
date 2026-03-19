// BYS Collections - Observer Module
// Namespace: window.BYS.Collections.Observer
// vidIQ-style: native YT events + debounced MutationObserver fallback

window.BYS = window.BYS || {};
window.BYS.Collections = window.BYS.Collections || {};

window.BYS.Collections.Observer = (() => {
  let mutationObserver = null;
  let lastUrl = '';
  let debounceTimer = null;

  // ─── navigation abort controller ─────────────────────────────────────
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
    abortNavigation();
    callbacks.onNavigate.forEach(cb => cb(getPageType(), url));
  };

  const firePageDataUpdated = () => {
    callbacks.onPageDataUpdated.forEach(cb => cb(getPageType(), window.location.href));
  };

  // ─── Debounced MutationObserver ───────────────────────────────────────
  const startMutationObserver = () => {
    if (mutationObserver) return;
    mutationObserver = new MutationObserver(mutations => {
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

  // ─── YouTube native SPA events ────────────────────────────────────────
  const bindYTEvents = () => {
    document.addEventListener('yt-navigate-start', () => {
      abortNavigation();
    });

    document.addEventListener('yt-navigate-finish', () => {
      fireNavigate();
    });

    document.addEventListener('yt-page-data-updated', () => {
      firePageDataUpdated();
    });

    window.addEventListener('popstate', () => {
      setTimeout(fireNavigate, 0);
    });
  };

  // ─── waitForElement ───────────────────────────────────────────────────
  const waitForElement = (selectors, timeout = 5000) => {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];
    const signal = currentNavAbortController.signal;

    return new Promise((resolve, reject) => {
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
  const waitForDOMSync = (timeout = 5000, interval = 80) => {
    const urlHandle = getHandleFromUrl();
    const signal = currentNavAbortController.signal;

    if (!urlHandle) return Promise.resolve(true);

    return new Promise((resolve) => {
      if (getDOMHandle() === urlHandle) { resolve(true); return; }
      if (signal.aborted) { resolve(false); return; }

      const startTime = Date.now();
      const timer = setInterval(() => {
        if (signal.aborted) { clearInterval(timer); resolve(false); return; }
        if (getDOMHandle() === urlHandle) { clearInterval(timer); resolve(true); return; }
        if (Date.now() - startTime > timeout) { clearInterval(timer); resolve(false); return; }
      }, interval);

      const onAbort = () => { clearInterval(timer); resolve(false); };
      signal.addEventListener('abort', onAbort, { once: true });
    });
  };

  // ─── Theme Observer ───────────────────────────────────────────────────
  const applyTheme = () => {
    const isLight = !document.documentElement.hasAttribute('dark');
    document.documentElement.classList.toggle('ytc-light-theme', isLight);
  };

  let themeObserver = null;

  const startThemeObserver = () => {
    applyTheme();
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
