/**
 * BYS.Shortcuts — Alt+1..9 klavye kısayolu sistemi
 */
window.BYS = window.BYS || {};

window.BYS.Shortcuts = (function () {
    const NAV_TARGETS = {
        // ── Ana menü sayfaları ────────────────────────────────────────────────
        'dashboard':           { label: 'Kontrol Paneli',          path: '/' },
        'content-videos':      { label: 'İçerik - Videolar',       path: '/videos/upload' },
        'content-shorts':      { label: 'İçerik - Shorts',         path: '/videos/short' },
        'comments':            { label: 'Topluluk',                 path: '/comments' },
        'monetization':        { label: 'Para Kazanma',             path: '/monetization' },
        'customization':       { label: 'Özelleştirme',             path: '/editing' },
        'audio-library':       { label: 'Ses Kitaplığı',            path: '/music' },
        'subtitles':           { label: 'Altyazı ve Ses',           path: '/translations-and-transcriptions' },
        'copyright':           { label: 'İçerik Tespiti',           path: '/copyright' },
        'settings':            { label: 'Ayarlar',                  path: null, domClick: true },
        // ── Analytics sekmeleri ───────────────────────────────────────────────
        'analytics':           { label: 'Analytics - Genel Bakış', path: '/analytics/tab-overview' },
        'analytics-content':   { label: 'Analytics - İçerik',      path: '/analytics/tab-content' },
        'analytics-audience':  { label: 'Analytics - Kitle',       path: '/analytics/tab-build_audience' },
        'analytics-revenue':   { label: 'Analytics - Gelir',       path: '/analytics/tab-earn_revenue' },
    };

    let assignments = {};
    let keydownHandler = null;
    let toastEl = null;

    function getChannelBase() {
        const match = location.pathname.match(/^(\/channel\/[^/]+)/);
        return match ? match[1] : '';
    }

    function navigateToPath(path) {
        const base = getChannelBase();
        const url = `https://studio.youtube.com${base}${path}`;
        if (location.href !== url) {
            history.pushState({}, '', url);
            window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
        }
    }

    async function clickSettingsItem(retries = 5) {
        for (let i = 0; i < retries; i++) {
            const settingsItem = document.querySelector(
                'tp-yt-paper-icon-item#settings-item, #settings-item, [id="settings-item"]'
            );
            if (settingsItem) {
                settingsItem.click();
                return true;
            }
            await new Promise(r => setTimeout(r, 200));
        }
        return false;
    }

    async function navigate(targetKey) {
        const target = NAV_TARGETS[targetKey];
        if (!target) return;

        if (target.domClick) {
            const clicked = await clickSettingsItem();
            if (clicked) {
                showToast(`⌨️ ${target.label}`);
            } else {
                showToast(`⚠️ ${target.label} açılamadı`);
            }
        } else {
            navigateToPath(target.path);
            showToast(`⌨️ ${target.label}`);
        }
    }

    function showToast(message) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.id = 'bys-toast';
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = message;
        toastEl.classList.add('bys-toast-visible');
        clearTimeout(toastEl._hideTimer);
        toastEl._hideTimer = setTimeout(() => {
            toastEl.classList.remove('bys-toast-visible');
        }, 1800);
    }

    return {
        NAV_TARGETS,

        async init() {
            assignments = await BYS.Storage.getKey('shortcuts');

            this.cleanup();

            keydownHandler = (e) => {
                if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
                const key = e.key;
                if (!/^[1-9]$/.test(key)) return;

                const targetKey = assignments[key];
                if (!targetKey || targetKey === 'none') return;

                e.preventDefault();
                e.stopPropagation();
                navigate(targetKey);
            };

            document.addEventListener('keydown', keydownHandler, true);
        },

        cleanup() {
            if (keydownHandler) {
                document.removeEventListener('keydown', keydownHandler, true);
                keydownHandler = null;
            }
        },

        async reload() {
            assignments = await BYS.Storage.getKey('shortcuts');
        }
    };
})();
