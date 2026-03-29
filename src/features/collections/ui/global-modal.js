// BYS Collections - Global Modal Component
// Namespace: window.BYS.Collections.GlobalModal
// Ana koleksiyon modalı — tüm içerik burada yaşar

window.BYS = window.BYS || {};
window.BYS.Collections = window.BYS.Collections || {};

window.BYS.Collections.GlobalModal = (() => {
  // ─── i18n Helper ────────────────────────────────────────────────────────
  function t(key, params = {}) {
    return window.BYS?.i18n?.t?.(key, params) || key;
  }

  let modalElement = null;
  let contentContainer = null;
  let isOpen = false;
  let currentView = 'folders';
  let currentFolder = null;

  // 3D Folder Icon — kırmızı tema (gfg ID prefix'leri korunuyor)
  const folder3DIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="56" height="56" class="ytc-folder-3d-icon">
    <defs>
      <linearGradient id="gfg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ff3030"/>
        <stop offset="50%" style="stop-color:#ff1a1a"/>
        <stop offset="100%" style="stop-color:#cc0000"/>
      </linearGradient>
      <linearGradient id="gfg2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ff6666"/>
        <stop offset="100%" style="stop-color:#ff3030"/>
      </linearGradient>
      <linearGradient id="gfg3" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ff1a1a"/>
        <stop offset="100%" style="stop-color:#b30000"/>
      </linearGradient>
      <filter id="gshadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <rect x="16" y="28" width="96" height="72" rx="8" ry="8" fill="url(#gfg1)" filter="url(#gshadow)"/>
    <path d="M16 36 L16 28 Q16 24 20 24 L48 24 Q52 24 54 28 L58 36 Z" fill="url(#gfg2)"/>
    <rect x="16" y="40" width="96" height="60" rx="6" ry="6" fill="url(#gfg3)"/>
    <rect x="20" y="44" width="88" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/>
    <rect x="20" y="52" width="60" height="2" rx="1" fill="rgba(255,255,255,0.15)"/>
  </svg>`;

  const icons = {
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M12 5v14M5 12h14"/></svg>`,
    back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
    openAll: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    folder: folder3DIcon
  };

  const loadingSpinner = `<div class="ytc-loading-container"><div class="ytc-spinner"></div><p>${t('collections.status.loading')}</p></div>`;

  // ─── URL resolver ────────────────────────────────────────────────────────
  const getChannelOpenUrl = (channel) => {
    if (!channel) return null;
    if (channel.url && typeof channel.url === 'string'
        && channel.url.startsWith('https://www.youtube.com/')
        && !/undefined|null|handle_/.test(channel.url)) {
      return channel.url.split('?')[0];
    }
    const id = channel.id || '';
    if (id.startsWith('UC')) return `https://www.youtube.com/channel/${id}`;
    if (id) {
      const raw = id.startsWith('handle_') ? id.slice('handle_'.length) : id;
      const handle = raw.startsWith('@') ? raw : `@${raw}`;
      return `https://www.youtube.com/${handle}`;
    }
    if (channel.handle) {
      const h = channel.handle.startsWith('@') ? channel.handle : `@${channel.handle}`;
      return `https://www.youtube.com/${h}`;
    }
    return null;
  };

  const openTabsInBackground = async (urls) => {
    if (!urls || urls.length === 0) return { success: true, count: 0 };
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'openTabs', urls }, (response) => {
          const runtimeError = chrome.runtime.lastError;
          if (runtimeError) {
            urls.forEach((url) => window.open(url, '_blank', 'noopener,noreferrer'));
            resolve({ success: true, fallback: true, count: urls.length });
            return;
          }
          resolve(response);
        });
      });
    }
    urls.forEach((url) => window.open(url, '_blank', 'noopener'));
    return { success: true, count: urls.length };
  };

  const create = () => {
    modalElement = document.createElement('div');
    modalElement.id = 'ytc-global-modal';
    modalElement.className = 'ytc-global-modal-overlay';
    modalElement.innerHTML = `
      <div class="ytc-global-modal">
        <div class="ytc-global-modal-header">
          <div class="ytc-global-modal-title-area">
            <button class="ytc-modal-back-btn" style="display:none;">${icons.back}</button>
            <h2 class="ytc-global-modal-title">${t('collections.modal.title')}</h2>
          </div>
          <button class="ytc-global-modal-close">${icons.close}</button>
        </div>
        <div class="ytc-global-modal-content"></div>
      </div>
    `;
    contentContainer = modalElement.querySelector('.ytc-global-modal-content');
    modalElement.querySelector('.ytc-global-modal-close').addEventListener('click', close);
    modalElement.querySelector('.ytc-modal-back-btn').addEventListener('click', () => { showFoldersView(); });
    modalElement.addEventListener('click', (e) => { if (e.target === modalElement) close(); });
    document.addEventListener('keydown', handleKeyDown);
    document.body.appendChild(modalElement);
    return modalElement;
  };

  const handleKeyDown = (e) => { if (e.key === 'Escape' && isOpen) close(); };

  const getScrollbarWidth = () => window.innerWidth - document.documentElement.clientWidth;

  const open = () => {
    if (!modalElement) create();
    const scrollbarWidth = getScrollbarWidth();
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    isOpen = true;
    modalElement.classList.add('ytc-modal-visible');
    showFoldersView();

    const API = window.BYS.Collections.YouTubeAPI;
    if (API?.syncAndStoreAllChannels) {
      API.syncAndStoreAllChannels().then(() => {
        if (currentView === 'channels' && currentFolder) showChannelsView(currentFolder);
        else if (currentView === 'folders') buildAllChannelsCache();
      });
    }
  };

  const close = () => {
    if (!modalElement) return;
    isOpen = false;
    modalElement.classList.remove('ytc-modal-visible');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    currentView = 'folders';
    currentFolder = null;
  };

  const searchIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`;
  const clearIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
  const folderSmallIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M4 6c0-1.1.9-2 2-2h3.2l2 2H18c1.1 0 2 .9 2 2v2H4V6zm0 5h16v7c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-7z"/></svg>`;

  let allChannelsCache = null;

  const buildAllChannelsCache = async () => {
    const Storage = window.BYS.Collections.Storage;
    const folders = await Storage.getFolders();
    const channelsMap = new Map();
    for (const folder of folders) {
      const channels = await Storage.getChannelsInFolder(folder.id);
      for (const channel of channels) {
        if (!channel || !channel.id) continue;
        const channelData = {
          id: channel.id, name: channel.name || channel.title || t('collections.channel.unknown'),
          handle: channel.handle || '', avatar: channel.avatar || channel.thumbnail || '',
          url: channel.url || '', subscriberCount: channel.subscriberCount || ''
        };
        if (!channelsMap.has(channel.id)) {
          channelsMap.set(channel.id, { ...channelData, folders: [{ id: folder.id, name: folder.name }] });
        } else {
          channelsMap.get(channel.id).folders.push({ id: folder.id, name: folder.name });
        }
      }
    }
    allChannelsCache = Array.from(channelsMap.values());
    return allChannelsCache;
  };

  const filterChannels = (query) => {
    if (!allChannelsCache || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    return allChannelsCache.filter(ch => {
      const name = (ch.name || ch.title || '').toLowerCase();
      const handle = (ch.handle || '').toLowerCase();
      return name.includes(q) || handle.includes(q);
    });
  };

  const escapeHtml = (text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const searchEmptyIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M8 8l6 6M14 8l-6 6"/></svg>`;

  const createSearchResultCard = (channel, index) => {
    const card = document.createElement('div');
    card.className = 'ytc-search-result-card';
    card.style.animationDelay = `${index * 40}ms`;
    const channelUrl = getChannelOpenUrl(channel) || '#';
    const avatar = channel.avatar || channel.thumbnail || '';
    const name = escapeHtml(channel.name || channel.title || t('collections.channel.unknown'));
    const handle = channel.handle ? escapeHtml(channel.handle) : '';
    const folderBadges = (channel.folders || []).map(f => `
      <span class="ytc-folder-badge-link" data-folder-id="${f.id}" title="${t('collections.hint.gotoFolder', { name: f.name })}">
        ${folderSmallIcon} ${escapeHtml(f.name)}
      </span>
    `).join('');

    card.innerHTML = `
      <a href="${channelUrl}" target="_blank" class="ytc-search-result-link">
        <img src="${avatar}" alt="" class="ytc-search-result-avatar"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23888%22 font-size=%2240%22>?</text></svg>'">
        <div class="ytc-search-result-info">
          <p class="ytc-search-result-name">${name}</p>
          ${handle ? `<p class="ytc-search-result-handle">${handle}</p>` : ''}
        </div>
      </a>
      <div class="ytc-search-result-badges">${folderBadges}</div>
    `;

    card.querySelectorAll('.ytc-folder-badge-link').forEach(badge => {
      badge.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation();
        const folderId = badge.dataset.folderId;
        const folders = await window.BYS.Collections.Storage.getFolders();
        const folder = folders.find(f => f.id === folderId);
        if (folder) showChannelsView(folder);
      });
    });
    return card;
  };

  const showSearchResults = (results, query) => {
    const grid = contentContainer.querySelector('#ytc-modal-folders-grid');
    if (!grid) return;
    if (results.length === 0) {
      grid.className = 'ytc-modal-folders-grid';
      grid.innerHTML = `<div class="ytc-search-empty"><div class="ytc-search-empty-icon">${searchEmptyIcon}</div><p class="ytc-search-empty-text">${t('collections.search.noResult', { query: query })}</p></div>`;
    } else {
      grid.innerHTML = '';
      grid.className = 'ytc-search-results';
      results.forEach((channel, index) => grid.appendChild(createSearchResultCard(channel, index)));
    }
  };

  const showFoldersGrid = async () => {
    const grid = contentContainer.querySelector('#ytc-modal-folders-grid');
    if (!grid) return;
    grid.className = 'ytc-modal-folders-grid';
    const folders = await window.BYS.Collections.Storage.getFolders();
    if (folders.length === 0) {
      grid.innerHTML = `<div class="ytc-empty-state"><div class="ytc-empty-icon">${icons.folder}</div><h3>${t('collections.empty.noFolders')}</h3><p>${t('collections.empty.noFoldersDesc')}</p></div>`;
    } else {
      grid.innerHTML = '';
      folders.forEach((folder, index) => grid.appendChild(createFolderCard(folder, index)));
    }
  };

  const showFoldersView = async () => {
    if (!contentContainer) return;
    currentView = 'folders';
    currentFolder = null;

    const titleEl = modalElement.querySelector('.ytc-global-modal-title');
    const backBtn = modalElement.querySelector('.ytc-modal-back-btn');
    titleEl.textContent = t('collections.modal.title');
    backBtn.style.display = 'none';

    contentContainer.innerHTML = `
      <div class="ytc-modal-folders-header">
        <div class="ytc-search-container">
          <input type="text" class="ytc-search-input" id="ytc-search-input" placeholder="${t('collections.search.placeholder')}" autocomplete="off">
          <span class="ytc-search-icon">${searchIcon}</span>
          <button class="ytc-search-clear" id="ytc-search-clear" type="button">${clearIcon}</button>
        </div>
        <button class="ytc-btn ytc-btn-primary" id="ytc-modal-create-folder">
          ${icons.plus} ${t('collections.btn.newFolder')}
        </button>
      </div>
      <div class="ytc-modal-folders-grid" id="ytc-modal-folders-grid">
        <div class="ytc-loading">${t('collections.status.loading')}</div>
      </div>
    `;

    contentContainer.querySelector('#ytc-modal-create-folder').addEventListener('click', () => {
      window.BYS.Collections.Modals.showFolderModal(null, async (data) => {
        await window.BYS.Collections.Storage.createFolder(data.name, data.description);
        allChannelsCache = null;
        showFoldersView();
      });
    });

    const searchInput = contentContainer.querySelector('#ytc-search-input');
    const clearBtn = contentContainer.querySelector('#ytc-search-clear');
    let searchTimeout = null;
    buildAllChannelsCache();

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      clearBtn.classList.toggle('visible', query.length > 0);
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        if (query.trim().length > 0) {
          if (!allChannelsCache) await buildAllChannelsCache();
          showSearchResults(filterChannels(query), query);
        } else {
          showFoldersGrid();
        }
      }, 200);
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.remove('visible');
      showFoldersGrid();
      searchInput.focus();
    });

    await showFoldersGrid();
  };

  const createFolderCard = (folder, index) => {
    const card = document.createElement('div');
    card.className = 'ytc-folder-card';
    card.style.animationDelay = `${index * 80}ms`;
    const channelCount = folder.channels ? folder.channels.length : 0;

    card.innerHTML = `
      <div class="ytc-folder-card-icon">
        ${folder3DIcon}
        <span class="ytc-folder-badge">${channelCount}</span>
      </div>
      <div class="ytc-folder-card-info">
        <h3 class="ytc-folder-card-name">${escapeHtml(folder.name)}</h3>
        <p class="ytc-folder-card-count">${t('collections.folder.count', { count: channelCount })}</p>
        <p class="ytc-folder-card-desc">${folder.description ? escapeHtml(folder.description) : t('collections.folder.noDesc')}</p>
      </div>
      <div class="ytc-folder-card-actions">
        <button class="ytc-icon-btn" data-action="open-all" title="${t('collections.btn.openAll')}">
          ${icons.openAll}
        </button>
        <button class="ytc-icon-btn" data-action="edit" title="${t('collections.btn.edit')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="ytc-icon-btn ytc-icon-btn-danger" data-action="delete" title="${t('collections.btn.delete')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.ytc-folder-card-actions')) showChannelsView(folder);
    });

    card.querySelector('[data-action="open-all"]').addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      const channels = await window.BYS.Collections.Storage.getChannelsInFolder(folder.id);
      const urls = channels.map(getChannelOpenUrl).filter(url => url && url.includes('youtube.com'));
      if (urls.length === 0) return;
      close();
      await openTabsInBackground(urls);
    });

    card.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
      e.stopPropagation();
      window.BYS.Collections.Modals.showFolderModal(folder, async (updates) => {
        await window.BYS.Collections.Storage.updateFolder(folder.id, updates);
        showFoldersView();
      });
    });

    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      window.BYS.Collections.Modals.showDeleteConfirm(folder.name, 'klasör', async () => {
        await window.BYS.Collections.Storage.deleteFolder(folder.id);
        allChannelsCache = null;
        showFoldersView();
      });
    });

    return card;
  };

  const showChannelsView = async (folder) => {
    if (!contentContainer) return;
    currentView = 'channels';
    currentFolder = folder;

    const titleEl = modalElement.querySelector('.ytc-global-modal-title');
    const backBtn = modalElement.querySelector('.ytc-modal-back-btn');
    titleEl.textContent = folder.name;
    backBtn.style.display = 'flex';

    contentContainer.innerHTML = `
      <div class="ytc-modal-channels-header">
        <div class="ytc-modal-channels-header-copy">
          <p class="ytc-folder-description">${folder.description ? escapeHtml(folder.description) : t('collections.folder.noDesc')}</p>
        </div>
        <button class="ytc-btn ytc-btn-secondary ytc-manual-add-btn" id="ytc-manual-channel-add-btn">
          ${icons.plus} ${t('collections.modal.manualAdd.title')}
        </button>
      </div>
      <div class="ytc-modal-channels-list" id="ytc-modal-channels-list">${loadingSpinner}</div>
    `;

    const manualAddBtn = contentContainer.querySelector('#ytc-manual-channel-add-btn');
    if (manualAddBtn) {
      manualAddBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        window.BYS.Collections.Modals.showManualChannelAddModal(async (inputUrl) => {
          const API = window.BYS.Collections.YouTubeAPI;
          if (!API?.resolveChannelFromUrl) throw new Error(t('collections.error.noResolve'));
          const resolvedChannel = await API.resolveChannelFromUrl(inputUrl);
          if (!resolvedChannel || !resolvedChannel.id) throw new Error(t('collections.error.invalidUrl'));
          const folderList = await window.BYS.Collections.Storage.getChannelsInFolder(folder.id);
          const alreadyExists = folderList.some(ch => ch.id === resolvedChannel.id);
          if (alreadyExists) throw new Error(t('collections.error.alreadyInFolder'));
          await window.BYS.Collections.Storage.addChannelToFolder(folder.id, resolvedChannel);
          allChannelsCache = null;
          await showChannelsView(folder);
        });
      });
    }

    const storedChannels = await window.BYS.Collections.Storage.getChannelsInFolder(folder.id);
    const listContainer = contentContainer.querySelector('#ytc-modal-channels-list');
    const channels = storedChannels.map(ch => ({
      id: ch.id, name: ch.name || ch.title || t('collections.channel.unknown'),
      handle: ch.handle || '', avatar: ch.avatar || channel.thumbnail || '',
      url: ch.url || '', subscriberCount: ch.subscriberCount || ''
    }));

    if (channels.length === 0) {
      listContainer.innerHTML = `<div class="ytc-empty-state"><h3>${t('collections.empty.noChannels')}</h3><p>${t('collections.empty.noChannelsDesc')}</p></div>`;
    } else {
      listContainer.innerHTML = '';
      channels.forEach((channel, index) => {
        const card = createChannelCard(channel, folder.id, index);
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        listContainer.appendChild(card);
        setTimeout(() => {
          card.style.transition = 'opacity 0.4s cubic-bezier(0.4,0,0.2,1), transform 0.4s cubic-bezier(0.4,0,0.2,1)';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 60);
      });
      setupDragAndDrop(listContainer, folder.id);
    }
  };

  const createChannelCard = (channel, folderId, index) => {
    const card = document.createElement('div');
    card.className = 'ytc-channel-card';
    card.dataset.channelId = channel.id;
    card.dataset.index = index;
    card.draggable = false;
    const avatarUrl = channel.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=random`;

    card.innerHTML = `
      <div class="ytc-channel-drag-handle" title="${t('collections.btn.drag')}">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
        </svg>
      </div>
      <a href="${getChannelOpenUrl(channel) || `https://www.youtube.com/channel/${channel.id}`}" target="_blank" rel="noopener" class="ytc-channel-link">
        <img class="ytc-channel-avatar" src="${avatarUrl}" alt="${escapeHtml(channel.name)}" loading="lazy">
        <div class="ytc-channel-info">
          <h4 class="ytc-channel-name">${escapeHtml(channel.name)}</h4>
          ${channel.handle ? `<p class="ytc-channel-handle">${escapeHtml(channel.handle)}</p>` : ''}
          ${channel.subscriberCount ? `<p class="ytc-channel-subs">${t('collections.channel.subscribers', { count: channel.subscriberCount })}</p>` : ''}
        </div>
      </a>
      <div class="ytc-channel-actions">
        <button class="ytc-icon-btn" data-action="move" title="${t('collections.btn.move')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
          </svg>
        </button>
        <button class="ytc-icon-btn ytc-icon-btn-danger" data-action="delete" title="${t('collections.btn.delete')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    `;

    card.querySelector('[data-action="move"]').addEventListener('click', (e) => {
      e.stopPropagation();
      window.BYS.Collections.Modals.showMoveToFolderModal(channel, folderId, async (toFolderId) => {
        await window.BYS.Collections.Storage.moveChannelToFolder(channel.id, folderId, toFolderId);
        allChannelsCache = null;
        showChannelsView(currentFolder);
      });
    });

    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      window.BYS.Collections.Modals.showDeleteConfirm(channel.name, 'kanal', async () => {
        await window.BYS.Collections.Storage.removeChannelFromFolder(folderId, channel.id);
        allChannelsCache = null;
        showChannelsView(currentFolder);
      });
    });

    return card;
  };

  const setupDragAndDrop = (container, folderId) => {
    let draggedItem = null;
    container.querySelectorAll('.ytc-channel-card').forEach(card => {
      const handle = card.querySelector('.ytc-channel-drag-handle');
      handle.addEventListener('mousedown', () => { card.draggable = true; });
      handle.addEventListener('mouseup', () => { card.draggable = false; });

      card.addEventListener('dragstart', (e) => {
        if (!e.target.draggable) { e.preventDefault(); return; }
        draggedItem = card;
        card.classList.add('ytc-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', async () => {
        card.draggable = false;
        card.classList.remove('ytc-dragging');
        if (draggedItem) {
          const cards = container.querySelectorAll('.ytc-channel-card');
          const newOrder = Array.from(cards).map(c => c.dataset.channelId);
          await window.BYS.Collections.Storage.reorderChannelsInFolder(folderId, newOrder);
          cards.forEach((c, i) => { c.dataset.index = i; });
        }
        draggedItem = null;
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault(); e.dataTransfer.dropEffect = 'move';
        if (draggedItem && draggedItem !== card) {
          const rect = card.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          if (e.clientY < midY) container.insertBefore(draggedItem, card);
          else container.insertBefore(draggedItem, card.nextSibling);
        }
      });
    });
  };

  const getIsOpen = () => isOpen;
  const toggle = () => { if (isOpen) close(); else open(); };

  return { create, open, close, toggle, isOpen: getIsOpen, showFoldersView, showChannelsView };
})();
