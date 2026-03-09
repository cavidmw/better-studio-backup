/**
 * BYS Logout Guard — Çıkış Onay Sistemi
 * YouTube ve YouTube Studio'da "Oturumu kapat" butonuna tıklandığında
 * premium bir onay modalı göstererek yanlışlıkla çıkışı engeller.
 */
(function () {
    'use strict';

    const LOGOUT_TEXTS = ['Oturumu kapat', 'Sign out', 'Çıkış yap'];
    let modalVisible = false;
    let pendingLogoutElement = null;

    // ─── SVG Uyarı İkonu ───────────────────────────────────────────────────────
    const WARNING_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

    // ─── Modal HTML ───────────────────────────────────────────────────────────
    function createModal() {
        if (document.getElementById('bys-logout-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'bys-logout-overlay';
        overlay.innerHTML = `
            <div id="bys-logout-modal">
                <div class="bys-logout-icon">${WARNING_ICON_SVG}</div>
                <h2 class="bys-logout-title">Oturumu Kapat</h2>
                <p class="bys-logout-desc">Tüm Google hesaplarından çıkış yapılacak ve tekrar giriş gerekebilir.</p>
                <div class="bys-logout-actions">
                    <button id="bys-logout-cancel" class="bys-logout-btn">İptal</button>
                    <button id="bys-logout-confirm" class="bys-logout-btn">Devam et</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Event listeners
        const cancelBtn = document.getElementById('bys-logout-cancel');
        const confirmBtn = document.getElementById('bys-logout-confirm');
        const modal = document.getElementById('bys-logout-modal');

        cancelBtn.addEventListener('click', hideModal);

        confirmBtn.addEventListener('click', () => {
            hideModal();
            triggerRealLogout();
        });

        // Easter egg: hover efekti
        confirmBtn.addEventListener('mouseenter', () => {
            confirmBtn.classList.add('bys-shaking');
            modal.classList.add('bys-hover-warn');
        });

        confirmBtn.addEventListener('mouseleave', () => {
            confirmBtn.classList.remove('bys-shaking');
            modal.classList.remove('bys-hover-warn');
        });

        // Animasyon bitince class kaldır (tekrar tetiklenebilsin)
        confirmBtn.addEventListener('animationend', () => {
            confirmBtn.classList.remove('bys-shaking');
        });

        modal.addEventListener('animationend', () => {
            if (!confirmBtn.matches(':hover')) {
                modal.classList.remove('bys-hover-warn');
            }
        });

        // Overlay tıklama ile kapatma
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) hideModal();
        });

        // ESC tuşu ile kapatma
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalVisible) {
                hideModal();
            }
        });
    }

    function showModal(logoutElement) {
        createModal();
        pendingLogoutElement = logoutElement;
        const overlay = document.getElementById('bys-logout-overlay');
        if (overlay) {
            overlay.classList.add('bys-visible');
            modalVisible = true;
        }
    }

    function hideModal() {
        const overlay = document.getElementById('bys-logout-overlay');
        if (overlay) {
            overlay.classList.remove('bys-visible');
            modalVisible = false;
        }
        pendingLogoutElement = null;
    }

    function triggerRealLogout() {
        if (!pendingLogoutElement) return;

        // Bypass flag ekle
        pendingLogoutElement.dataset.bysAllowed = 'true';

        // Gerçek click tetikle
        pendingLogoutElement.click();

        // Flag temizle (async olarak, click işlendikten sonra)
        setTimeout(() => {
            if (pendingLogoutElement) {
                delete pendingLogoutElement.dataset.bysAllowed;
            }
            pendingLogoutElement = null;
        }, 100);
    }

    // ─── Logout Element Tespiti ───────────────────────────────────────────────
    function isLogoutElement(element) {
        if (!element) return false;

        // Bypass kontrolü
        if (element.dataset?.bysAllowed === 'true') return false;

        // tp-yt-paper-item veya ytd-compact-link-renderer içinde "Oturumu kapat" metni ara
        const container = element.closest('tp-yt-paper-item, ytd-compact-link-renderer, ytd-menu-service-item-renderer');
        if (!container) return false;

        // Bypass kontrolü container'da da
        if (container.dataset?.bysAllowed === 'true') return false;

        // Label metni kontrolü
        const label = container.querySelector('#label, yt-formatted-string, [id="label"]');
        if (label) {
            const text = label.textContent?.trim();
            if (LOGOUT_TEXTS.some(t => text?.includes(t))) {
                return container;
            }
        }

        // Direkt metin kontrolü
        const text = container.textContent?.trim();
        if (LOGOUT_TEXTS.some(t => text?.includes(t))) {
            // Sadece logout öğesi olduğundan emin ol (çok fazla metin içermemeli)
            if (text.length < 50) {
                return container;
            }
        }

        return false;
    }

    // ─── Event Delegation ile Click Intercept ─────────────────────────────────
    function handleClick(e) {
        const logoutElement = isLogoutElement(e.target);
        if (!logoutElement) return;

        // Bypass kontrolü
        if (logoutElement.dataset?.bysAllowed === 'true') {
            return; // Gerçek logout'a izin ver
        }

        // Varsayılan davranışı engelle
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Modal göster
        showModal(logoutElement);
    }

    // ─── Init ─────────────────────────────────────────────────────────────────
    function init() {
        // Capture phase'de dinle — en erken müdahale
        document.addEventListener('click', handleClick, true);

        console.log('[BYS] Logout Guard aktif');
    }

    // Sayfa yüklendiğinde başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
