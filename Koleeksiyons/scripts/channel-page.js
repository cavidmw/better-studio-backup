// YouTube Collections - Channel Page Integration v2
// vidIQ-style: AbortController-safe inject, yt-page-data-updated aware state refresh

const CollectionsChannelPage = (() => {
  // 3D Folder icon (small version for button)
  const folder3DIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="18" height="18" style="flex-shrink: 0;">
    <defs>
      <linearGradient id="cfg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#4FC3F7"/>
        <stop offset="100%" style="stop-color:#0288D1"/>
      </linearGradient>
      <linearGradient id="cfg2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#29B6F6"/>
        <stop offset="100%" style="stop-color:#0277BD"/>
      </linearGradient>
    </defs>
    <rect x="16" y="28" width="96" height="72" rx="8" fill="url(#cfg1)"/>
    <path d="M16 36 L16 28 Q16 24 20 24 L48 24 Q52 24 54 28 L58 36 Z" fill="#81D4FA"/>
    <rect x="16" y="40" width="96" height="60" rx="6" fill="url(#cfg2)"/>
    <rect x="20" y="44" width="88" height="3" rx="1.5" fill="rgba(255,255,255,0.5)"/>
  </svg>`;

  // DOM'dan TAZE kanal bilgisi çek - her zaman güncel
  // Güçlendirilmiş selector'lar ile "Bilinmeyen Kanal" bug'ı düzeltildi
  const extractChannelInfo = () => {
    try {
      // 1. Önce URL'den kontrol et (SPA geçişlerinde meta tag'ler geç güncellendiği için en taze veri URL'dir)
      let channelId = null;
      const path = window.location.pathname;
      const channelMatch = path.match(/^\/channel\/(UC[\w-]+)/);
      if (channelMatch) channelId = channelMatch[1];
      
      if (!channelId) {
        const handleMatch = path.match(/^\/@([\w.-]+)/);
        if (handleMatch) channelId = 'handle_' + handleMatch[1];
      }

      // 2. URL'den bulunamadıysa Meta tag'den
      if (!channelId) {
        const metaChannelId = document.querySelector('meta[itemprop="channelId"]');
        if (metaChannelId?.content) {
          channelId = metaChannelId.content;
        }
      }
      
      // 3. Hala yoksa Canonical link'ten
      if (!channelId) {
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical?.href) {
          const match = canonical.href.match(/\/channel\/(UC[\w-]+)/);
          if (match) channelId = match[1];
        }
      }

      if (!channelId) return null;

      // Channel name - genişletilmiş selector listesi
      let name = '';
      const nameSelectors = [
        // Yeni YouTube yapısı
        'yt-page-header-view-model .page-header-view-model-wiz__page-header-title span',
        'yt-page-header-view-model .page-header-view-model-wiz__page-header-title',
        // Eski YouTube yapısı
        '#channel-name yt-formatted-string',
        'ytd-channel-name #text',
        '#channel-header ytd-channel-name yt-formatted-string',
        // Alternatif selector'lar
        '.ytd-channel-name',
        '#inner-header-container #channel-name',
        'ytd-c4-tabbed-header-renderer #channel-name yt-formatted-string',
        // Meta tag fallback
        'meta[property="og:title"]'
      ];
      
      for (const sel of nameSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          // Meta tag için content attribute'u kontrol et
          if (sel.includes('meta')) {
            const content = el.getAttribute('content');
            if (content?.trim()) {
              name = content.trim().replace(' - YouTube', '');
              break;
            }
          } else if (el.textContent?.trim()) {
            name = el.textContent.trim();
            break;
          }
        }
      }

      // Handle - genişletilmiş selector listesi
      let handle = '';
      const handleSelectors = [
        'yt-page-header-view-model yt-content-metadata-view-model span',
        '#channel-handle',
        'ytd-c4-tabbed-header-renderer #channel-handle',
        '.ytd-channel-tagline-renderer',
        '#inner-header-container #channel-handle'
      ];
      
      for (const sel of handleSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          const text = el.textContent.trim();
          if (text.startsWith('@')) {
            handle = text;
            break;
          }
        }
      }
      
      // URL'den handle çıkar (fallback)
      if (!handle) {
        const urlHandleMatch = path.match(/^\/@([\w.-]+)/);
        if (urlHandleMatch) {
          handle = '@' + urlHandleMatch[1];
        }
      }

      // Avatar - genişletilmiş selector listesi
      let avatar = '';
      const avatarSelectors = [
        'yt-page-header-view-model yt-decorated-avatar-view-model img',
        'yt-page-header-view-model yt-avatar-shape img',
        '#channel-header-container #avatar img',
        'ytd-c4-tabbed-header-renderer #avatar img',
        '#inner-header-container #avatar img',
        '.ytd-channel-avatar-editor img',
        '#channel-header img.yt-img-shadow'
      ];
      
      for (const sel of avatarSelectors) {
        const el = document.querySelector(sel);
        if (el?.src && !el.src.includes('data:') && el.src.includes('yt')) {
          avatar = el.src;
          break;
        }
      }

      // Fallback avatar - UI Avatars API
      if (!avatar && name) {
        avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3ea6ff&color=fff&size=176`;
      }

      return {
        id: channelId,
        name: name || handle?.replace('@', '') || 'Bilinmeyen Kanal',
        handle,
        avatar,
        url: window.location.href.split('?')[0],
        addedAt: Date.now()
      };
    } catch (e) {
      console.error('Error extracting channel info:', e);
      return null;
    }
  };

  // vidIQ tarzı flex container ile buton oluştur - Siyah liquid tasarım
  const createButton = () => {
    const container = document.createElement('div');
    container.id = 'ytc-add-to-collection';
    container.className = 'vidiq-scope flex flex-row gap-xsmall items-stretch justify-center ml-xsmall relative';
    container.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; margin-left: 8px; margin-right: 8px; flex: 0 0 auto; width: max-content;';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ytc-channel-add-btn';
    btn.setAttribute('aria-label', 'Koleksiyona Ekle');
    
    // Siyah liquid tasarım - glassmorphism efekti
    btn.style.cssText = `
      background: linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(15, 15, 15, 0.9) 100%);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 0 16px;
      height: 36px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      font-family: "Roboto", "Arial", sans-serif;
      white-space: nowrap;
      width: max-content;
      flex: 0 0 auto;
      box-sizing: border-box;
    `;
    
    // 3D ikon + metin
    btn.innerHTML = `${folder3DIcon}<span class="ytc-btn-text" style="pointer-events: none;">Koleksiyona Ekle</span>`;

    // Click handler - preventDefault ve stopPropagation ile
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleButtonClick(btn);
    });
    
    // Hover efekti - daha parlak
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'linear-gradient(135deg, rgba(50, 50, 50, 0.95) 0%, rgba(30, 30, 30, 0.9) 100%)';
      btn.style.borderColor = 'rgba(79, 195, 247, 0.4)';
      btn.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 20px rgba(79, 195, 247, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
      btn.style.transform = 'translateY(-1px)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(15, 15, 15, 0.9) 100%)';
      btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
      btn.style.transform = 'translateY(0)';
    });

    container.appendChild(btn);
    return container;
  };

  // Buton click handler
  const handleButtonClick = (btn) => {
    const channelInfo = extractChannelInfo();
    if (!channelInfo || !channelInfo.id) {
      console.error('YouTube Collections: Could not extract channel info on click');
      return;
    }

    CollectionsModals.showAddToFolderModal(
      channelInfo,
      async (folderId, channel) => {
        await CollectionsStorage.addChannelToFolder(folderId, channel);
        updateButtonState(btn);
        // Background API sync to persist authoritative data
        if (typeof YouTubeAPI !== 'undefined' && YouTubeAPI.syncAndStoreAllChannels) {
          YouTubeAPI.syncAndStoreAllChannels();
        }
      }
    );
  };

  // ─── Buton state güncelle ───────────────────────────────────────────────
  const resetButtonToDefault = (btn) => {
    if (!btn) return;
    btn.classList.remove('in-collection');
    btn.style.background = 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(15, 15, 15, 0.9) 100%)';
    btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    btn.style.color = '#ffffff';
    const textEl = btn.querySelector('.ytc-btn-text');
    if (textEl) textEl.textContent = 'Koleksiyona Ekle';
  };

  const updateButtonState = async (btn) => {
    if (!btn) return;
    
    const channelInfo = extractChannelInfo();
    if (!channelInfo) {
      // DOM not ready yet — show safe default
      resetButtonToDefault(btn);
      return;
    }

    const folders = await CollectionsStorage.getFoldersContainingChannel(channelInfo.id);
    const textEl = btn.querySelector('.ytc-btn-text');
    
    if (folders.length > 0) {
      btn.classList.add('in-collection');
      // Premium "eklendi" durumu - YouTube'un yerel butonlarıyla uyumlu
      btn.style.background = 'linear-gradient(135deg, rgba(62, 166, 255, 0.15) 0%, rgba(30, 30, 30, 0.95) 100%)';
      btn.style.borderColor = 'rgba(62, 166, 255, 0.5)';
      btn.style.color = '#3ea6ff';
      btn.style.boxShadow = '0 2px 8px rgba(62, 166, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
      if (textEl) textEl.textContent = `${folders.length} koleksiyonda`;
    } else {
      resetButtonToDefault(btn);
    }
  };

  // ─── Inject state ──────────────────────────────────────────────────────
  let lastInjectedChannelId = null;
  let isInjecting = false;

  const TARGET_SELECTORS = [
    'yt-flexible-actions-view-model',
    '#buttons.ytd-c4-tabbed-header-renderer',
    '#channel-header #buttons',
    '#subscribe-button',
    '.page-header-view-model-wiz__page-header-buttons'
  ];

  // ─── Force Reset ──────────────────────────────────────────────────────
  // Called THE INSTANT a navigation is detected.  Nukes every piece of
  // stale state so the old channel can never leak into the new one.
  const forceReset = () => {
    lastInjectedChannelId = null;
    isInjecting = false;
    // Remove old button from DOM immediately
    remove();
    // If button somehow survives, reset its visual state
    const btn = document.querySelector('#ytc-add-to-collection button');
    resetButtonToDefault(btn);
    console.log('YouTube Collections: State force-reset ✓');
  };

  // ─── Inject ───────────────────────────────────────────────────────────
  // Core principle: NEVER read DOM data until URL and DOM are in sync.
  const inject = async () => {
    // Prevent concurrent injects
    if (isInjecting) return false;
    isInjecting = true;

    try {
      // ── Step 1: Wait for DOM ↔ URL sync ──────────────────────────────
      // This is the critical fix: polls until the handle visible in the
      // DOM matches the handle in the URL.  If navigation aborts or
      // times out, we bail out.
      const synced = await CollectionsObserver.waitForDOMSync(5000, 80);
      if (!synced) {
        console.log('YouTube Collections: DOM sync failed or was aborted');
        return false;
      }

      // ── Step 2: Wait for the inject target container ─────────────────
      let container;
      try {
        container = await CollectionsObserver.waitForElement(TARGET_SELECTORS, 4000);
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('YouTube Collections: inject aborted (navigation)');
          return false;
        }
        console.log('YouTube Collections: target not found', err.message);
        return false;
      }

      // ── Step 3: Double-check no duplicate ────────────────────────────
      if (document.getElementById('ytc-add-to-collection')) {
        // Already injected (e.g. by a parallel call)
        const existingBtn = document.querySelector('#ytc-add-to-collection button');
        await updateButtonState(existingBtn);
        return true;
      }

      // ── Step 4: NOW extract channel info (DOM is guaranteed fresh) ───
      const channelInfo = extractChannelInfo();
      const currentId = channelInfo?.id || null;

      const btnObj = createButton();
      container.appendChild(btnObj);

      lastInjectedChannelId = currentId;
      await updateButtonState(btnObj.querySelector('button'));
      return true;
    } catch (err) {
      console.error('YouTube Collections: Error injecting button', err);
      return false;
    } finally {
      isInjecting = false;
    }
  };

  // ─── refreshState ─────────────────────────────────────────────────────
  // Called on yt-page-data-updated — DOM is now guaranteed to have real data.
  const refreshState = async () => {
    const btn = document.querySelector('#ytc-add-to-collection button');
    if (!btn) return;
    const channelInfo = extractChannelInfo();
    if (!channelInfo) return;
    lastInjectedChannelId = channelInfo.id;
    await updateButtonState(btn);
  };

  // Butonu kaldır
  const remove = () => {
    const btn = document.getElementById('ytc-add-to-collection');
    if (btn) {
      btn.remove();
    }
  };

  // Buton var mı
  const exists = () => {
    return !!document.getElementById('ytc-add-to-collection');
  };

  return {
    inject,
    remove,
    exists,
    extractChannelInfo,
    refreshState,
    forceReset,
    updateData: refreshState
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CollectionsChannelPage;
}
