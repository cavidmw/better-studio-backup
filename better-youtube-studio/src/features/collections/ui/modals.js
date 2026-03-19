// BYS Collections - Modal System
// Namespace: window.BYS.Collections.Modals

window.BYS = window.BYS || {};
window.BYS.Collections = window.BYS.Collections || {};

window.BYS.Collections.Modals = (() => {
  // ─── i18n Helper ────────────────────────────────────────────────────────
  function t(key, params = {}) {
    return window.BYS?.i18n?.t?.(key, params) || key;
  }

  let activeModal = null;

  const icons = {
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>`,
    folder: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 6a2 2 0 012-2h4.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"/>
    </svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M5 13l4 4L19 7"/>
    </svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>`
  };

  const createOverlay = () => {
    const overlay = document.createElement('div');
    overlay.className = 'ytc-modal-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    return overlay;
  };

  const createModalBase = (title, content, footer) => {
    const modal = document.createElement('div');
    modal.className = 'ytc-modal';
    modal.innerHTML = `
      <div class="ytc-modal-header">
        <h3 class="ytc-modal-title">${title}</h3>
        <button class="ytc-modal-close" aria-label="${t('collections.btn.cancel')}">${icons.close}</button>
      </div>
      <div class="ytc-modal-body"></div>
      <div class="ytc-modal-footer"></div>
    `;
    modal.querySelector('.ytc-modal-body').appendChild(content);
    modal.querySelector('.ytc-modal-footer').appendChild(footer);
    modal.querySelector('.ytc-modal-close').addEventListener('click', closeModal);
    return modal;
  };

  const showModal = (modal) => {
    const overlay = createOverlay();
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    activeModal = overlay;

    const handleKeydown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKeydown);
    overlay._keydownHandler = handleKeydown;

    const firstInput = modal.querySelector('input, button:not(.ytc-modal-close)');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  };

  const closeModal = () => {
    if (!activeModal) return;
    activeModal.style.animation = 'ytcFadeOut 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards';
    const modal = activeModal.querySelector('.ytc-modal');
    if (modal) modal.style.animation = 'ytcModalOut 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards';
    document.removeEventListener('keydown', activeModal._keydownHandler);
    setTimeout(() => {
      if (activeModal && activeModal.parentNode) activeModal.parentNode.removeChild(activeModal);
      activeModal = null;
    }, 300);
  };

  const showDeleteConfirm = (itemName, itemType = 'klasör', onConfirm) => {
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="text-align: center; padding: 20px 0;">
        <div style="width: 64px; height: 64px; margin: 0 auto 16px; color: var(--ytc-danger);">${icons.warning}</div>
        <p style="color: var(--ytc-text-primary); margin: 0 0 8px; font-size: 16px;">
          ${itemType === 'klasör' ? t('collections.modal.deleteConfirm.folderMsg', { name: itemName }) : t('collections.modal.deleteConfirm.channelMsg', { name: itemName })}
        </p>
        <p style="color: var(--ytc-text-secondary); margin: 0; font-size: 14px;">${t('collections.modal.deleteConfirm.info')}</p>
      </div>
    `;
    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;';
    footer.innerHTML = `
      <button class="ytc-btn ytc-btn-secondary" data-action="cancel">${t('collections.btn.cancel')}</button>
      <button class="ytc-btn ytc-btn-danger" data-action="confirm">${t('collections.btn.delete')}</button>
    `;
    footer.querySelector('[data-action="cancel"]').addEventListener('click', closeModal);
    footer.querySelector('[data-action="confirm"]').addEventListener('click', () => { onConfirm(); closeModal(); });
    const modal = createModalBase(t('collections.modal.deleteConfirm.title'), content, footer);
    modal.addEventListener('keydown', (e) => { if (e.key === 'Enter') { onConfirm(); closeModal(); } });
    showModal(modal);
  };

  const showFolderModal = (folder = null, onSave) => {
    const isEdit = !!folder;
    const title = isEdit ? t('collections.modal.addFolder.titleEdit') : t('collections.modal.addFolder.titleNew');
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="ytc-input-group">
        <label class="ytc-input-label">${t('collections.modal.addFolder.nameLabel')}</label>
        <input type="text" class="ytc-input" id="ytc-folder-name"
               placeholder="${t('collections.modal.addFolder.namePlaceholder')}"
               value="${isEdit ? folder.name : ''}" maxlength="50">
      </div>
      <div class="ytc-input-group">
        <label class="ytc-input-label">${t('collections.modal.addFolder.descLabel')}</label>
        <textarea class="ytc-input ytc-textarea" id="ytc-folder-desc"
                  placeholder="${t('collections.modal.addFolder.descPlaceholder')}" maxlength="200">${isEdit ? (folder.description || '') : ''}</textarea>
      </div>
    `;
    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;';
    footer.innerHTML = `
      <button class="ytc-btn ytc-btn-secondary" data-action="cancel">${t('collections.btn.cancel')}</button>
      <button class="ytc-btn ytc-btn-primary" data-action="save">${isEdit ? t('collections.btn.save') : t('collections.btn.create')}</button>
    `;
    footer.querySelector('[data-action="cancel"]').addEventListener('click', closeModal);
    footer.querySelector('[data-action="save"]').addEventListener('click', () => {
      const name = content.querySelector('#ytc-folder-name').value.trim();
      const description = content.querySelector('#ytc-folder-desc').value.trim();
      if (!name) { content.querySelector('#ytc-folder-name').style.borderColor = 'var(--ytc-danger)'; return; }
      onSave({ name, description });
      closeModal();
    });
    const modal = createModalBase(title, content, footer);
    content.querySelector('#ytc-folder-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') footer.querySelector('[data-action="save"]').click();
    });
    showModal(modal);
  };

  const showMoveToFolderModal = async (channel, currentFolderId, onMove) => {
    const Storage = window.BYS.Collections.Storage;
    const folders = await Storage.getFolders();
    const containingFolders = await Storage.getFoldersContainingChannel(channel.id);
    const containingIds = containingFolders.map(f => f.id);

    const content = document.createElement('div');
    const preview = document.createElement('div');
    preview.className = 'ytc-channel-preview';
    preview.innerHTML = `
      <div class="ytc-channel-preview-avatar"><img src="${channel.avatar}" alt="${channel.name}"></div>
      <div class="ytc-channel-preview-info">
        <p class="ytc-channel-preview-name">${channel.name}</p>
        <p class="ytc-channel-preview-handle">${channel.handle}</p>
      </div>
    `;
    content.appendChild(preview);

    const listContainer = document.createElement('div');
    listContainer.className = 'ytc-folder-select-list ytc-scrollbar';
    if (folders.length === 0) {
      listContainer.innerHTML = `<p style="text-align:center;color:var(--ytc-text-secondary);padding:20px;">${t('collections.empty.noFoldersShort')}</p>`;
    } else {
      folders.forEach(folder => {
        if (folder.id === currentFolderId) return;
        const isInFolder = containingIds.includes(folder.id);
        const item = document.createElement('div');
        item.className = `ytc-folder-select-item ${isInFolder ? 'contains-channel' : ''}`;
        item.dataset.folderId = folder.id;
        item.innerHTML = `
          <div class="ytc-folder-select-icon" style="color:var(--ytc-accent);">${icons.folder}</div>
          <span class="ytc-folder-select-name">${folder.name}</span>
          ${isInFolder ? `<span class="ytc-folder-select-check">${icons.check}</span>` : ''}
        `;
        item.addEventListener('click', () => {
          listContainer.querySelectorAll('.ytc-folder-select-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
        });
        listContainer.appendChild(item);
      });
    }
    content.appendChild(listContainer);

    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;';
    footer.innerHTML = `
      <button class="ytc-btn ytc-btn-secondary" data-action="cancel">${t('collections.btn.cancel')}</button>
      <button class="ytc-btn ytc-btn-primary" data-action="move">${t('collections.btn.move')}</button>
    `;
    footer.querySelector('[data-action="cancel"]').addEventListener('click', closeModal);
    footer.querySelector('[data-action="move"]').addEventListener('click', () => {
      const selected = listContainer.querySelector('.ytc-folder-select-item.selected');
      if (selected) { onMove(selected.dataset.folderId); closeModal(); }
    });
    showModal(createModalBase(t('collections.modal.moveToFolder.title'), content, footer));
  };

  const showAddToFolderModal = async (channel, onAdd) => {
    if (!channel || !channel.id) {
      console.error('showAddToFolderModal: invalid channel data', channel);
      return;
    }
    const Storage = window.BYS.Collections.Storage;
    const folders = await Storage.getFolders();
    const containingFolders = await Storage.getFoldersContainingChannel(channel.id);
    const containingIds = containingFolders.map(f => f.id);
    let selectedFolderId = null;

    const overlay = document.createElement('div');
    overlay.className = 'ytc-atf-overlay';
    overlay.style.cssText = `position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
      background:var(--ytc-overlay-bg,rgba(0,0,0,0.60));backdrop-filter:blur(var(--ytc-overlay-blur,6px));
      -webkit-backdrop-filter:blur(var(--ytc-overlay-blur,6px));animation:ytcFadeIn 180ms ease forwards;`;

    const modal = document.createElement('div');
    modal.className = 'ytc-atf-modal';
    modal.style.cssText = `background:var(--ytc-modal-bg);border:1px solid var(--ytc-modal-border);border-radius:20px;
      box-shadow:var(--ytc-modal-shadow);width:380px;max-width:calc(100vw - 32px);max-height:80vh;
      display:flex;flex-direction:column;overflow:hidden;animation:ytcModalIn 250ms cubic-bezier(0.34,1.56,0.64,1) forwards;`;

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:18px 20px 0;flex-shrink:0;';
    header.innerHTML = `
      <h3 style="margin:0;font-size:17px;font-weight:600;color:var(--ytc-text-primary,#fff);">${t('collections.modal.addToFolder.title')}</h3>
      <button id="ytc-atf-close" style="background:none;border:none;cursor:pointer;color:var(--ytc-text-secondary,#aaa);padding:4px;display:flex;align-items:center;border-radius:50%;transition:background 0.15s;">
        ${icons.close}
      </button>
    `;
    modal.appendChild(header);

    const avatarUrl = channel.avatar
      || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.handle || 'K')}&background=ff0000&color=fff&size=96`;
    const preview = document.createElement('div');
    preview.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;padding:20px 20px 4px;';
    preview.innerHTML = `
      <img src="${avatarUrl}" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;box-shadow:0 4px 16px rgba(0,0,0,0.35);flex-shrink:0;"
           onerror="this.src='https://ui-avatars.com/api/?name=K&background=ff0000&color=fff&size=96'">
      <span style="font-size:15px;font-weight:500;color:var(--ytc-text-primary,#fff);">${channel.handle || ''}</span>
    `;
    modal.appendChild(preview);

    const listEl = document.createElement('div');
    listEl.className = 'ytc-folder-select-list ytc-scrollbar';
    listEl.style.cssText = 'flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:6px;';
    if (folders.length === 0) {
      listEl.innerHTML = `<p style="text-align:center;color:var(--ytc-text-secondary,#aaa);padding:24px 0;margin:0;">${t('collections.empty.noFoldersShort')}</p>`;
    } else {
      folders.forEach(folder => {
        const isInFolder = containingIds.includes(folder.id);
        const item = document.createElement('div');
        item.className = `ytc-folder-select-item${isInFolder ? ' contains-channel' : ''}`;
        item.dataset.folderId = folder.id;
        item.innerHTML = `
          <div class="ytc-folder-select-icon" style="color:var(--ytc-accent);">${icons.folder}</div>
          <span class="ytc-folder-select-name">${folder.name}</span>
          ${isInFolder ? `<span class="ytc-folder-select-check">${icons.check}</span>` : ''}
        `;
        item.addEventListener('click', () => {
          listEl.querySelectorAll('.ytc-folder-select-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          selectedFolderId = folder.id;
        });
        item.addEventListener('dblclick', async () => {
          if (!isInFolder) { await onAdd(folder.id, channel); closeAtf(); }
        });
        listEl.appendChild(item);
      });
    }
    modal.appendChild(listEl);

    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;justify-content:flex-end;padding:14px 16px 18px;flex-shrink:0;border-top:1px solid var(--ytc-border,rgba(255,255,255,0.07));';
    footer.innerHTML = `<button class="ytc-btn ytc-btn-primary" id="ytc-atf-save">${t('collections.btn.save')}</button>`;
    modal.appendChild(footer);

    const closeAtf = () => {
      overlay.style.animation = 'ytcFadeOut 150ms ease forwards';
      modal.style.animation = 'ytcModalOut 150ms ease forwards';
      setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 150);
    };

    overlay.addEventListener('click', e => { if (e.target === overlay) closeAtf(); });
    header.querySelector('#ytc-atf-close').addEventListener('click', closeAtf);
    footer.querySelector('#ytc-atf-save').addEventListener('click', async () => {
      if (!selectedFolderId) {
        listEl.style.animation = 'ytcShake 0.3s ease';
        setTimeout(() => { listEl.style.animation = ''; }, 300);
        return;
      }
      if (!containingIds.includes(selectedFolderId)) await onAdd(selectedFolderId, channel);
      closeAtf();
    });

    const handleEsc = e => { if (e.key === 'Escape') { closeAtf(); document.removeEventListener('keydown', handleEsc); } };
    document.addEventListener('keydown', handleEsc);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  };

  const showManualChannelAddModal = (onSubmit) => {
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="ytc-manual-add-modal">
        <div class="ytc-input-group">
          <label class="ytc-input-label">${t('collections.modal.manualAdd.urlLabel')}</label>
          <input type="text" class="ytc-input" id="ytc-manual-channel-url"
            placeholder="${t('collections.modal.manualAdd.urlPlaceholder')}" autocomplete="off" spellcheck="false">
        </div>
        <p class="ytc-manual-add-hint">${t('collections.modal.manualAdd.hint')}</p>
        <p class="ytc-manual-add-error" id="ytc-manual-channel-error" aria-live="polite"></p>
      </div>
    `;
    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;';
    footer.innerHTML = `
      <button class="ytc-btn ytc-btn-secondary" data-action="cancel">${t('collections.btn.cancel')}</button>
      <button class="ytc-btn ytc-btn-primary" data-action="add">${t('collections.btn.add')}</button>
    `;
    const modal = createModalBase(t('collections.modal.manualAdd.title'), content, footer);
    const input = content.querySelector('#ytc-manual-channel-url');
    const errorEl = content.querySelector('#ytc-manual-channel-error');
    const addBtn = footer.querySelector('[data-action="add"]');

    const setLoadingState = (isLoading) => {
      input.disabled = isLoading;
      addBtn.disabled = isLoading;
      addBtn.textContent = isLoading ? t('collections.status.adding') : t('collections.btn.add');
    };
    const showError = (message) => { errorEl.textContent = message; errorEl.style.display = 'block'; input.style.borderColor = 'var(--ytc-danger)'; };
    const clearError = () => { errorEl.textContent = ''; errorEl.style.display = 'none'; input.style.borderColor = 'var(--ytc-border)'; };

    footer.querySelector('[data-action="cancel"]').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeModal(); });

    const submit = async () => {
      const value = input.value.trim();
      if (!value) { showError(t('collections.error.emptyUrl')); return; }
      clearError();
      setLoadingState(true);
      try { await onSubmit(value); closeModal(); }
      catch (error) { showError(error?.message || t('collections.error.general')); }
      finally { setLoadingState(false); }
    };

    addBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); submit(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    showModal(modal);
    setTimeout(() => input.focus(), 100);
  };

  // Modal animasyon keyframe'leri
  const addModalStyles = () => {
    if (document.getElementById('ytc-modal-animations')) return;
    const style = document.createElement('style');
    style.id = 'ytc-modal-animations';
    style.textContent = `
      @keyframes ytcFadeIn  { from{opacity:0} to{opacity:1} }
      @keyframes ytcFadeOut { from{opacity:1} to{opacity:0} }
      @keyframes ytcModalIn  { from{opacity:0;transform:scale(0.95) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
      @keyframes ytcModalOut { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.95) translateY(20px)} }
      @keyframes ytcShake    { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
    `;
    document.head.appendChild(style);
  };
  addModalStyles();

  return {
    showDeleteConfirm,
    showFolderModal,
    showMoveToFolderModal,
    showAddToFolderModal,
    showManualChannelAddModal,
    closeModal
  };
})();
