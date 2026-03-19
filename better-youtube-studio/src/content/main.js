/**
 * BYS Main Content Script — YouTube Studio SPA navigasyon yönetimi
 * Tüm feature modüllerini doğru sayfalarda başlatır/durdurur.
 * History API'yi override ederek SPA navigasyonları algılar.
 */
(function () {
    'use strict';

    // ─── Feature Toggle Varsayılanları ──────────────────────────────────────────

    const DEFAULT_TOGGLES = {
        graphColors: true,
        shortcuts: true,
        currencyPicker: true,
        tooltip: true,
        logoutGuard: true
    };

    let featureToggles = { ...DEFAULT_TOGGLES };

    async function loadToggles() {
        return new Promise(res => {
            try {
                chrome.storage.sync.get('featureToggles', (data) => {
                    if (data && data.featureToggles) {
                        featureToggles = Object.assign({ ...DEFAULT_TOGGLES }, data.featureToggles);
                    }
                    res();
                });
            } catch (e) { res(); }
        });
    }

    function getActiveFeatures(pathname) {
        const p = pathname.toLowerCase();
        const features = [];

        // Kısayollar — toggle açıksa
        if (featureToggles.shortcuts !== false) {
            features.push('shortcuts');
        }

        // Para birimi seçici — toggle açıksa
        if (featureToggles.currencyPicker !== false) {
            features.push('currencyPicker');
        }

        // USD→AZN tooltip — toggle açıksa
        if (featureToggles.tooltip !== false) {
            features.push('tooltip');
        }

        // Grafik renkleri — sadece analytics sayfasında ve toggle açıksa
        if (p.includes('/analytics') && featureToggles.graphColors !== false) {
            features.push('graphColors');
        }

        // LogoutGuard — her sayfada ve toggle açıksa
        if (featureToggles.logoutGuard !== false) {
            features.push('logoutGuard');
        }

        return features;
    }

    // ─── Feature Yaşam Döngüsü ──────────────────────────────────────────────────

    let activeFeatures = [];

    function getFeatureModule(name) {
        return {
            shortcuts: window.BYS?.Shortcuts,
            graphColors: window.BYS?.GraphColors,
            currencyPicker: window.BYS?.CurrencyPicker,
            tooltip: window.BYS?.Tooltip,
            logoutGuard: window.BYS?.LogoutGuard
        }[name];
    }

    // Her navigasyonda yeniden init edilmesi gereken feature'lar
    // (SPA'da DOM tamamen değiştiği için buton/UI kaybolabiliyor)
    const REINIT_ON_NAVIGATE = ['graphColors'];

    async function activateFeatures(pathname) {
        const needed = getActiveFeatures(pathname);

        // Artık gerekli olmayan feature'ları kapat
        for (const name of activeFeatures) {
            if (!needed.includes(name)) {
                const mod = getFeatureModule(name);
                if (mod?.cleanup) {
                    try { mod.cleanup(); } catch (e) { console.warn(`[BYS] ${name} cleanup hatası:`, e); }
                }
            }
        }

        // Yeni gerekli feature'ları başlat
        for (const name of needed) {
            const mod = getFeatureModule(name);
            const wasActive = activeFeatures.includes(name);
            const needsReinit = REINIT_ON_NAVIGATE.includes(name);

            // İlk kez aktif olan VEYA her navigasyonda yeniden init edilmesi gereken
            if (!wasActive || needsReinit) {
                if (mod?.init) {
                    try { await mod.init(); } catch (e) { console.warn(`[BYS] ${name} init hatası:`, e); }
                }
            }
        }

        activeFeatures = needed;
    }

    // ─── SPA Navigasyon Algılama ─────────────────────────────────────────────────

    let lastPathname = '';

    function onNavigate() {
        const pathname = location.pathname;
        if (pathname === lastPathname) return;
        lastPathname = pathname;
        activateFeatures(pathname);
    }

    function hookHistory() {
        const origPushState = history.pushState.bind(history);
        const origReplaceState = history.replaceState.bind(history);

        history.pushState = function (...args) {
            origPushState(...args);
            onNavigate();
        };

        history.replaceState = function (...args) {
            origReplaceState(...args);
            onNavigate();
        };

        window.addEventListener('popstate', onNavigate);
    }

    // ─── Popup'tan Mesaj Dinleme ─────────────────────────────────────────────────

    chrome.runtime.onMessage.addListener((message) => {
        if (!message || !message.type) return;
        switch (message.type) {
            case 'BYS_REFRESH_COLORS':
                if (window.BYS?.GraphColors?.refresh) BYS.GraphColors.refresh().catch(() => { });
                break;
            case 'BYS_RELOAD_SHORTCUTS':
                if (window.BYS?.Shortcuts?.reload) BYS.Shortcuts.reload().catch(() => { });
                break;
            case 'BYS_OPEN_GRAPH_MODAL':
                if (window.BYS?.GraphColors?.openModal) BYS.GraphColors.openModal();
                break;
            case 'BYS_OPEN_SETTINGS': {
                const base = location.pathname.match(/^(\/channel\/[^/]+)/)?.[1] || '';
                const url = `https://studio.youtube.com${base}/settings`;
                if (location.href !== url) {
                    history.pushState({}, '', url);
                    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
                }
                break;
            }
            case 'BYS_SET_FEATURE': {
                const { feature, enabled } = message;
                if (feature && typeof enabled === 'boolean') {
                    featureToggles[feature] = enabled;
                    const mod = getFeatureModule(feature);
                    if (mod) {
                        if (enabled && mod.init) {
                            try { mod.init(); } catch (e) { }
                        } else if (!enabled && mod.cleanup) {
                            try { mod.cleanup(); } catch (e) { }
                        }
                    }
                    if (enabled) {
                        activeFeatures = [...new Set([...activeFeatures, feature])];
                    } else {
                        activeFeatures = activeFeatures.filter(f => f !== feature);
                    }
                }
                break;
            }
        }
    });

    // ─── Başlangıç ───────────────────────────────────────────────────────────────

    async function init() {
        // i18n sistemini başlat
        if (window.BYS?.i18n?.init) {
            await window.BYS.i18n.init();
        }
        await loadToggles();
        hookHistory();
        lastPathname = location.pathname;
        activateFeatures(location.pathname);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
