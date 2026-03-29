// BYS Collections - YouTube Guide (Sidebar) Button Component
// Namespace: window.BYS.Collections.GuideButton
// Injects a native-looking "Collections" entry into the YouTube sidebar guide menu.

window.BYS = window.BYS || {};
window.BYS.Collections = window.BYS.Collections || {};

window.BYS.Collections.GuideButton = (() => {
  // ─── i18n Helper ────────────────────────────────────────────────────────
  function t(key, params = {}) {
    return window.BYS?.i18n?.t?.(key, params) || key;
  }

  // ─── ID ─────────────────────────────────────────────────────────────────
  const GUIDE_ENTRY_ID = 'ytc-guide-entry';

  // ─── SVG Icons ──────────────────────────────────────────────────────────
  // YouTube-native style folder icon, 24×24, outline style matching YT icons.
  // Dark mode version (light strokes for dark bg)
  const folderIconDark = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;"><path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm0 12H4V8h16v10z" fill="currentColor"/></svg>`;
  // Light mode version (dark strokes for light bg) — same SVG, currentColor adapts
  const folderIconLight = folderIconDark; // currentColor handles theme via CSS

  // ─── Create the guide entry DOM ─────────────────────────────────────────
  const createGuideEntry = () => {
    // Outer wrapper — mimics ytd-guide-entry-renderer
    const entry = document.createElement('div');
    entry.id = GUIDE_ENTRY_ID;
    entry.className = 'style-scope ytd-guide-section-renderer ytc-guide-entry';
    entry.setAttribute('is-primary', '');
    entry.setAttribute('line-end-style', 'none');

    // Determine current theme
    const isDark = document.documentElement.hasAttribute('dark');
    const iconSvg = isDark ? folderIconDark : folderIconLight;

    entry.innerHTML = `
      <a class="ytc-guide-link yt-simple-endpoint style-scope" tabindex="-1" role="button" title="${t('collections.masthead.btn')}">
        <div class="ytc-guide-paper-item" role="button" tabindex="0">
          <span class="ytc-guide-icon">
            <span class="yt-icon-shape">
              <div style="width:100%;height:100%;display:block;fill:currentcolor;">
                ${iconSvg}
              </div>
            </span>
          </span>
          <span class="ytc-guide-title">${t('collections.masthead.btn')}</span>
        </div>
      </a>
      <div class="ytc-guide-interaction">
        <div class="ytc-guide-interaction-fill"></div>
      </div>
    `;

    // Bind click
    entry.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.BYS.Collections.GlobalModal.open();
    });

    return entry;
  };

  // ─── Find injection target ──────────────────────────────────────────────
  const findGuideSection = () => {
    // Try to find the first guide section (Ana Sayfa / Home section)
    const sections = document.querySelectorAll('ytd-guide-section-renderer');
    if (sections.length > 0) {
      // First section usually has Home + Shorts
      const items = sections[0].querySelector('#items');
      return items || null;
    }
    return null;
  };

  // ─── Inject ─────────────────────────────────────────────────────────────
  let guideObserver = null;

  const inject = () => {
    if (document.getElementById(GUIDE_ENTRY_ID)) return true;

    const guideItems = findGuideSection();
    if (!guideItems) {
      // Guide not loaded yet — set up an observer to try again
      startGuideObserver();
      return false;
    }

    const entry = createGuideEntry();

    // Insert after the last existing entry in the first section (after Shorts)
    guideItems.appendChild(entry);

    stopGuideObserver();
    return true;
  };

  // ─── MutationObserver for lazy-loaded guide ─────────────────────────────
  const startGuideObserver = () => {
    if (guideObserver) return;

    guideObserver = new MutationObserver(() => {
      if (document.getElementById(GUIDE_ENTRY_ID)) {
        stopGuideObserver();
        return;
      }
      const guideItems = findGuideSection();
      if (guideItems) {
        const entry = createGuideEntry();
        guideItems.appendChild(entry);
        stopGuideObserver();
      }
    });

    guideObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Safety timeout — stop observing after 15s
    setTimeout(() => stopGuideObserver(), 15000);
  };

  const stopGuideObserver = () => {
    if (guideObserver) {
      guideObserver.disconnect();
      guideObserver = null;
    }
  };

  // ─── Remove ─────────────────────────────────────────────────────────────
  const remove = () => {
    stopGuideObserver();
    const el = document.getElementById(GUIDE_ENTRY_ID);
    if (el) el.remove();
  };

  // ─── Exists ─────────────────────────────────────────────────────────────
  const exists = () => !!document.getElementById(GUIDE_ENTRY_ID);

  return { inject, remove, exists };
})();
