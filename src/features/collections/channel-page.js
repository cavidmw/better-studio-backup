// BYS Collections - Channel Page Integration
// Namespace: window.BYS.Collections.ChannelPage
// vidIQ-style: AbortController-safe inject, yt-page-data-updated aware state refresh

window.BYS = window.BYS || {};
window.BYS.Collections = window.BYS.Collections || {};

window.BYS.Collections.ChannelPage = (() => {
  // ─── i18n Helper ────────────────────────────────────────────────────────
  function t(key, params = {}) {
    return window.BYS?.i18n?.t?.(key, params) || key;
  }

  // 3D Folder icon — kırmızı tema (cfg ID prefix'leri korunuyor)
  const folder3DIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="18" height="18" style="flex-shrink:0;">
    <defs>
      <linearGradient id="cfg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ff3030"/>
        <stop offset="100%" style="stop-color:#cc0000"/>
      </linearGradient>
      <linearGradient id="cfg2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ff1a1a"/>
        <stop offset="100%" style="stop-color:#b30000"/>
      </linearGradient>
    </defs>
    <rect x="16" y="28" width="96" height="72" rx="8" fill="url(#cfg1)"/>
    <path d="M16 36 L16 28 Q16 24 20 24 L48 24 Q52 24 54 28 L58 36 Z" fill="#ff6666"/>
    <rect x="16" y="40" width="96" height="60" rx="6" fill="url(#cfg2)"/>
    <rect x="20" y="44" width="88" height="3" rx="1.5" fill="rgba(255,255,255,0.5)"/>
  </svg>`;

  // Kanal bilgisini DOM'dan çek
  const extractChannelInfo = () => {
    try {
      let channelId = null;
      const path = window.location.pathname;
      const channelMatch = path.match(/^\/channel\/(UC[\w-]+)/);
      if (channelMatch) channelId = channelMatch[1];

      if (!channelId) {
        const handleMatch = path.match(/^\/@([\w.-]+)/);
        if (handleMatch) channelId = 'handle_' + handleMatch[1];
      }
      if (!channelId) {
        const metaChannelId = document.querySelector('meta[itemprop="channelId"]');
        if (metaChannelId?.content) channelId = metaChannelId.content;
      }
      if (!channelId) {
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical?.href) {
          const match = canonical.href.match(/\/channel\/(UC[\w-]+)/);
          if (match) channelId = match[1];
        }
      }
      if (!channelId) return null;

      // Channel name
      let name = '';
      const nameSelectors = [
        'yt-page-header-view-model .page-header-view-model-wiz__page-header-title span',
        'yt-page-header-view-model .page-header-view-model-wiz__page-header-title',
        '#channel-name yt-formatted-string', 'ytd-channel-name #text',
        '#channel-header ytd-channel-name yt-formatted-string', '.ytd-channel-name',
        '#inner-header-container #channel-name',
        'ytd-c4-tabbed-header-renderer #channel-name yt-formatted-string',
        'meta[property="og:title"]'
      ];
      for (const sel of nameSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          if (sel.includes('meta')) {
            const content = el.getAttribute('content');
            if (content?.trim()) { name = content.trim().replace(' - YouTube', ''); break; }
          } else if (el.textContent?.trim()) { name = el.textContent.trim(); break; }
        }
      }

      // Handle
      let handle = '';
      const handleSelectors = [
        'yt-page-header-view-model yt-content-metadata-view-model span',
        '#channel-handle', 'ytd-c4-tabbed-header-renderer #channel-handle',
        '.ytd-channel-tagline-renderer', '#inner-header-container #channel-handle'
      ];
      for (const sel of handleSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          const text = el.textContent.trim();
          if (text.startsWith('@')) { handle = text; break; }
        }
      }
      if (!handle) {
        const urlHandleMatch = path.match(/^\/@([\w.-]+)/);
        if (urlHandleMatch) handle = '@' + urlHandleMatch[1];
      }

      // Avatar
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
        if (el?.src && !el.src.includes('data:') && el.src.includes('yt')) { avatar = el.src; break; }
      }
      if (!avatar && name) {
        avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff0000&color=fff&size=176`;
      }

      return {
        id: channelId,
        name: name || handle?.replace('@', '') || t('collections.channel.unknown'),
        handle, avatar,
        url: window.location.href.split('?')[0],
        addedAt: Date.now()
      };
    } catch (e) {
      return null;
    }
  };

  // vidIQ tarzı flex container ile buton oluştur
  // Inline stiller minimumda tutuldu — görsel durum CSS sınıfları ile yönetiliyor
  const createButton = () => {
    const container = document.createElement('div');
    container.id = 'ytc-add-to-collection';
    container.className = 'vidiq-scope flex flex-row gap-xsmall items-stretch justify-center ml-xsmall relative';
    container.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;margin-left:8px;margin-right:8px;flex:0 0 auto;width:max-content;';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ytc-channel-add-btn';
    btn.setAttribute('aria-label', t('collections.btn.addShort'));
    btn.innerHTML = `${folder3DIcon}<span class="ytc-btn-text" style="pointer-events:none;">${t('collections.btn.addShort')}</span>`;

    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      handleButtonClick(btn);
    });

    container.appendChild(btn);
    return container;
  };

  const handleButtonClick = (btn) => {
    const channelInfo = extractChannelInfo();
    if (!channelInfo || !channelInfo.id) {
      return;
    }
    window.BYS.Collections.Modals.showAddToFolderModal(
      channelInfo,
      async (folderId, channel) => {
        await window.BYS.Collections.Storage.addChannelToFolder(folderId, channel);
        updateButtonState(btn);
        const API = window.BYS.Collections.YouTubeAPI;
        if (API?.syncAndStoreAllChannels) API.syncAndStoreAllChannels();
      }
    );
  };

  // ─── Buton state güncelle ───────────────────────────────────────────────
  // Inline stil KULLANILMIYOR — tüm görsel durum CSS sınıfları ile yönetiliyor
  const resetButtonToDefault = (btn) => {
    if (!btn) return;
    btn.classList.remove('in-collection');
    const textEl = btn.querySelector('.ytc-btn-text');
    if (textEl) textEl.textContent = t('collections.btn.addShort');
  };

  const updateButtonState = async (btn) => {
    if (!btn) return;
    const channelInfo = extractChannelInfo();
    if (!channelInfo) { resetButtonToDefault(btn); return; }

    const folders = await window.BYS.Collections.Storage.getFoldersContainingChannel(channelInfo.id);
    const textEl = btn.querySelector('.ytc-btn-text');

    if (folders.length > 0) {
      btn.classList.add('in-collection');
      if (textEl) textEl.textContent = t('collections.btn.inCollections', { count: folders.length });
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

  const forceReset = () => {
    lastInjectedChannelId = null;
    isInjecting = false;
    remove();
    const btn = document.querySelector('#ytc-add-to-collection button');
    resetButtonToDefault(btn);

  };

  const inject = async () => {
    if (isInjecting) return false;
    isInjecting = true;
    try {
      const Observer = window.BYS.Collections.Observer;

      // Step 1: DOM ↔ URL sync bekle
      const synced = await Observer.waitForDOMSync(5000, 80);
      if (!synced) { return false; }

      // Step 2: inject target bekle
      let container;
      try {
        container = await Observer.waitForElement(TARGET_SELECTORS, 4000);
      } catch (err) {
        return false;
      }

      // Step 3: duplicate kontrol
      if (document.getElementById('ytc-add-to-collection')) {
        const existingBtn = document.querySelector('#ytc-add-to-collection button');
        await updateButtonState(existingBtn);
        return true;
      }

      // Step 4: kanal bilgisini çek (DOM garantili)
      const channelInfo = extractChannelInfo();
      const currentId = channelInfo?.id || null;
      const btnObj = createButton();
      container.appendChild(btnObj);
      lastInjectedChannelId = currentId;
      await updateButtonState(btnObj.querySelector('button'));
      return true;
    } catch (err) {

      return false;
    } finally {
      isInjecting = false;
    }
  };

  const refreshState = async () => {
    const btn = document.querySelector('#ytc-add-to-collection button');
    if (!btn) return;
    const channelInfo = extractChannelInfo();
    if (!channelInfo) return;
    lastInjectedChannelId = channelInfo.id;
    await updateButtonState(btn);
  };

  const remove = () => {
    const btn = document.getElementById('ytc-add-to-collection');
    if (btn) btn.remove();
  };

  const exists = () => !!document.getElementById('ytc-add-to-collection');

  return { inject, remove, exists, extractChannelInfo, refreshState, forceReset, updateData: refreshState };
})();
