/**
 * BYS.GraphColors — Analytics grafik renk özelleştirme
 * ─────────────────────────────────────────────────────
 * Tek bir "Ana Renk" seçilir — tüm grafik elementleri (çizgi, alan,
 * hover nokta, tooltip değer, 48 saatlik çubuklar) bu renge dönüşür.
 *
 * Gerçek zamanlı 48s çubukları için CSS !important kullanılır;
 * bu sayede YouTube'un her yenileme döngüsünde renkler korunur.
 */
window.BYS = window.BYS || {};

window.BYS.GraphColors = (function () {
    let settings = { primary: '#ff6b35', favorites: [] };
    let mutationObserver = null;
    let cssStyleEl = null;
    let modalOpen = false;

    // ─── i18n Helper ──────────────────────────────────────────────────────────

    function t(key) {
        return window.BYS?.i18n?.t?.(key) || key;
    }

    // ─── Yardımcı ─────────────────────────────────────────────────────────────

    function hexToRgba(hex, alpha) {
        const c = hex.replace('#', '');
        return `rgba(${parseInt(c.slice(0, 2), 16)},${parseInt(c.slice(2, 4), 16)},${parseInt(c.slice(4, 6), 16)},${alpha})`;
    }

    // ─── Tek CSS Bloğu ile Her Şeyi Renklendir ───────────────────────────────

    function applyCSS() {
        if (!cssStyleEl) {
            cssStyleEl = document.createElement('style');
            cssStyleEl.id = 'bys-chart-override';
            document.head.appendChild(cssStyleEl);
        }

        const p = settings.primary;
        const pa = hexToRgba(p, 0.1);

        cssStyleEl.textContent = `
      /* ── Ana çizgi (ve tüm diğer çizgiler — tek renk) ─── */
      path.line-series:not(.event-target) {
        stroke: ${p} !important;
      }

      /* ── Alan dolgusu ─── */
      g[series-id="MAIN_METRIC_SERIES_NAME_area"] path.area,
      path.area {
        fill: ${pa} !important;
      }

      /* ── Hover nokta ─── */
      circle.aplos-circle-shape {
        fill: ${p} !important;
      }

      /* ── Tooltip değer metni (yta-hovercard #value) ─── */
      yta-hovercard #value {
        color: ${p} !important;
      }

      /* ── Son 48 saat çubuk grafiği (EXTERNAL_VIEWS serisi) ─── */
      g[series-id="EXTERNAL_VIEWS"] path.bar {
        fill:   ${p} !important;
        stroke: ${p} !important;
      }

      /* ── Aynı renk tüm anomali/ek seriler için ─── */
      g[series-id]:not([series-id="VIDEO_OVERLAY_SERIES_NAME"])
        path.line-series:not(.event-target) {
        stroke: ${p} !important;
      }
    `;
    }

    // ─── Anchor-Based Buton Enjeksiyonu (NewStudio yaklaşımı) ─────────────────

    let btnCheckInterval = null;
    let headerBtn = null; // Buton referansını tut, tekrar kullan

    const DEBUG = true;
    function log(...args) {
        if (DEBUG) console.log('[BYS GraphColors]', ...args);
    }

    // Anchor element bul — .advanced-analytics-container içindeki ytcp-ve
    function getAnchorElement() {
        const container = document.querySelector('.advanced-analytics-container');
        if (!container) {
            log('Anchor bulunamadı: .advanced-analytics-container yok');
            return null;
        }
        
        const ytcpVe = container.querySelector('ytcp-ve');
        log('Anchor bulundu:', { container: !!container, ytcpVe: !!ytcpVe });
        return {
            container,
            insertBefore: ytcpVe // ytcp-ve varsa önüne ekle
        };
    }

    // Butonu oluştur (sadece bir kez)
    function createButton() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'bys-header-btn';
        btn.className = 'bys-header-btn';
        btn.title = t('modal.graphColors.title');
        btn.innerHTML = `
      <span class="bys-btn-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" fill="currentColor"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </span>
      <span>${t('nav.customization')}</span>
    `;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            openModal();
        }, true);

        return btn;
    }

    // Butonu kontrol et ve gerekirse ekle/gizle
    function ensureButton() {
        const anchor = getAnchorElement();
        
        // Anchor yoksa butonu gizle (DOM'dan kaldırma, sadece gizle)
        if (!anchor) {
            if (headerBtn) {
                headerBtn.style.display = 'none';
            }
            return;
        }
        
        // Buton yoksa oluştur
        if (!headerBtn) {
            headerBtn = createButton();
        }
        
        // Buton DOM'da değilse veya yanlış yerdeyse ekle
        if (!document.contains(headerBtn) || headerBtn.parentElement !== anchor.container) {
            if (anchor.insertBefore) {
                anchor.container.insertBefore(headerBtn, anchor.insertBefore);
            } else {
                anchor.container.insertBefore(headerBtn, anchor.container.firstChild);
            }
        }
        
        // Görünür yap
        headerBtn.style.display = '';
    }

    // Periyodik kontrol başlat — 250ms interval (NewStudio'nun 142ms'ine yakın)
    function startButtonCheck() {
        stopButtonCheck();
        log('startButtonCheck() çağrıldı');

        // İlk deneme
        ensureButton();

        // 250ms interval — hızlı tepki için
        btnCheckInterval = setInterval(ensureButton, 250);
    }

    function stopButtonCheck() {
        if (btnCheckInterval) {
            clearInterval(btnCheckInterval);
            btnCheckInterval = null;
        }
    }

    function removeHeaderButton() {
        if (headerBtn) {
            headerBtn.remove();
            headerBtn = null;
        }
        closeModal();
    }

    // ─── Modal ────────────────────────────────────────────────────────────────

    function openModal() {
        if (document.getElementById('bys-modal-overlay')) return;
        modalOpen = true;

        const overlay = document.createElement('div');
        overlay.id = 'bys-modal-overlay';
        overlay.innerHTML = `
      <div id="bys-modal" class="bys-modal">
        <div class="bys-modal-header">
          <div class="bys-modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="5" fill="#ff4444"/>
              <path d="M9 7l8 5-8 5V7z" fill="white"/>
            </svg>
            <span>${t('modal.graphColors.title')}</span>
          </div>
          <button class="bys-modal-close" id="bys-modal-close">✕</button>
        </div>

        <div class="bys-modal-body">
          <div class="bys-modal-section">
            <label class="bys-modal-label">${t('modal.graphColors.mainColor')}</label>
            <div class="bys-modal-color-row">
              <input type="color" id="bys-m-picker" value="${settings.primary}" class="bys-m-picker">
              <input type="text" id="bys-m-hex" value="${settings.primary}" maxlength="7" class="bys-m-hex" placeholder="#rrggbb">
              <div class="bys-m-preview" id="bys-m-preview" style="background:${settings.primary}"></div>
            </div>
            <p class="bys-modal-hint">${t('modal.graphColors.hint')}</p>
          </div>

          <div class="bys-modal-section bys-modal-fav-section">
            <div class="bys-modal-fav-header">
              <label class="bys-modal-label">${t('modal.graphColors.favorites')}</label>
              <button id="bys-m-add-fav" class="bys-m-add-fav">${t('modal.graphColors.addFav')}</button>
            </div>
            <div id="bys-m-fav-list" class="bys-m-fav-list"></div>
          </div>
        </div>

        <div class="bys-modal-footer">
          <button id="bys-m-reset" class="bys-m-btn-reset">${t('modal.graphColors.reset')}</button>
          <div class="bys-modal-footer-right">
            <button id="bys-m-cancel" class="bys-m-btn-cancel">${t('modal.graphColors.cancel')}</button>
            <button id="bys-m-apply" class="bys-m-btn-apply">${t('modal.graphColors.apply')}</button>
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        document.getElementById('bys-modal-close').addEventListener('click', closeModal);
        document.getElementById('bys-m-cancel').addEventListener('click', closeModal);

        const picker = document.getElementById('bys-m-picker');
        const hex = document.getElementById('bys-m-hex');
        const preview = document.getElementById('bys-m-preview');

        function syncColor(color) {
            picker.value = color;
            hex.value = color;
            preview.style.background = color;
        }

        picker.addEventListener('input', () => syncColor(picker.value));
        hex.addEventListener('input', () => {
            if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) syncColor(hex.value);
        });

        document.querySelectorAll('.bys-m-preset').forEach(btn => {
            btn.addEventListener('click', () => syncColor(btn.dataset.color));
        });

        document.getElementById('bys-m-apply').addEventListener('click', async () => {
            settings.primary = picker.value;
            await BYS.Storage.setKey('graphColors', settings);
            applyCSS();
            showToast(t('modal.graphColors.applied'));
            closeModal();
        });

        document.getElementById('bys-m-add-fav').addEventListener('click', async () => {
            const color = picker.value;
            if (!settings.favorites.includes(color)) {
                settings.favorites = [color, ...settings.favorites.slice(0, 7)];
                await BYS.Storage.setKey('graphColors', settings);
                renderFavorites();
                showToast(t('modal.graphColors.favAdded'));
            }
        });

        // Varsayılana Dön — YouTube'un orijinal renklerine döndür
        document.getElementById('bys-m-reset').addEventListener('click', async () => {
            const ytDefaults = BYS.Storage.getYouTubeDefaults();
            settings.primary = ytDefaults.primary;
            // Favorileri koruyoruz, sadece ana rengi sıfırlıyoruz
            await BYS.Storage.setKey('graphColors', settings);
            
            // Picker'ı güncelle
            syncColor(ytDefaults.primary);
            
            // CSS'i kaldır — YouTube'un orijinal stilleri geri gelsin
            if (cssStyleEl) {
                cssStyleEl.textContent = '';
            }
            
            showToast(t('modal.graphColors.resetDone'));
            closeModal();
        });

        renderFavorites();
    }

    function renderFavorites() {
        const list = document.getElementById('bys-m-fav-list');
        if (!list) return;
        list.innerHTML = '';

        if (!settings.favorites?.length) {
            list.innerHTML = `<span class="bys-m-fav-empty">${t('modal.graphColors.noFav')}</span>`;
            return;
        }

        settings.favorites.forEach((color, idx) => {
            const item = document.createElement('div');
            item.className = 'bys-m-fav-item';
            item.innerHTML = `
        <div class="bys-m-fav-dot" style="background:${color}" title="${color}"></div>
        <span class="bys-m-fav-code">${color}</span>
        <button class="bys-m-fav-use" data-color="${color}">${t('modal.graphColors.use')}</button>
        <button class="bys-m-fav-del" data-idx="${idx}">✕</button>
      `;
            item.querySelector('.bys-m-fav-use').addEventListener('click', () => {
                const picker = document.getElementById('bys-m-picker');
                const hex = document.getElementById('bys-m-hex');
                const prev = document.getElementById('bys-m-preview');
                if (picker) { picker.value = color; hex.value = color; prev.style.background = color; }
            });
            item.querySelector('.bys-m-fav-del').addEventListener('click', async () => {
                settings.favorites.splice(idx, 1);
                await BYS.Storage.setKey('graphColors', settings);
                renderFavorites();
            });
            list.appendChild(item);
        });
    }

    function closeModal() {
        document.getElementById('bys-modal-overlay')?.remove();
        modalOpen = false;
    }

    // ─── Toast ────────────────────────────────────────────────────────────────

    function showToast(msg) {
        let t = document.getElementById('bys-toast');
        if (!t) { t = document.createElement('div'); t.id = 'bys-toast'; document.body.appendChild(t); }
        t.textContent = msg;
        t.classList.add('bys-toast-visible');
        clearTimeout(t._t);
        t._t = setTimeout(() => t.classList.remove('bys-toast-visible'), 2000);
    }

    // ─── MutationObserver (bar chart re-render için) ──────────────────────────

    function startObserver() {
        if (mutationObserver) mutationObserver.disconnect();

        const debouncedReapply = BYS.DOM.debounce(() => {
            const hovercardValues = document.querySelectorAll('yta-hovercard #value');
            hovercardValues.forEach(el => {
                el.style.setProperty('color', settings.primary, 'important');
            });
        }, 300);

        mutationObserver = new MutationObserver((mutations) => {
            const relevant = mutations.some(m =>
                m.addedNodes.length > 0 || m.type === 'attributes'
            );
            if (relevant) debouncedReapply();
        });

        // Analytics container'ını hedefle, bulunamazsa body fallback
        const analyticsTarget = document.querySelector(
            'ytcp-analytics, ytcp-analytics-main, [class*="analytics-main"]'
        ) || document.body;

        mutationObserver.observe(analyticsTarget, {
            childList: true, subtree: true,
            attributes: true, attributeFilter: ['style', 'fill', 'stroke']
        });
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    return {
        async init() {
            log('init() çağrıldı, pathname:', location.pathname);
            settings = await BYS.Storage.getKey('graphColors');
            if (!settings.favorites) settings.favorites = [];

            applyCSS();
            startObserver();

            // Basit periyodik buton kontrolü başlat
            startButtonCheck();
        },

        cleanup() {
            mutationObserver?.disconnect();
            mutationObserver = null;
            stopButtonCheck();
            removeHeaderButton();
        },

        async refresh() {
            settings = await BYS.Storage.getKey('graphColors');
            applyCSS();
        },

        openModal() {
            openModal();
        }
    };
})();
