/**
 * BYS YouTube Main — YouTube.com için content script
 * LogoutGuard + Collections özelliklerini yönetir.
 */
(function () {
    'use strict';

    const DEFAULT_TOGGLES = {
        logoutGuard: true,
        collections: true
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

    async function init() {
        // i18n sistemini başlat
        if (window.BYS?.i18n?.init) {
            await window.BYS.i18n.init();
        }

        await loadToggles();

        // LogoutGuard — toggle açıksa başlat
        if (featureToggles.logoutGuard !== false && window.BYS?.LogoutGuard?.init) {
            window.BYS.LogoutGuard.init();
        }

        // Collections — toggle açıksa başlat
        if (featureToggles.collections !== false && window.BYS?.Collections?.init) {
            window.BYS.Collections.init();
        }
    }

    // Popup'tan mesaj dinle
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!message || !message.type) return;

        if (message.type === 'BYS_GET_THEME') {
            const isDark = document.documentElement.hasAttribute('dark');
            sendResponse({ isDark });
            return true;
        }

        if (message.type === 'BYS_SET_FEATURE') {
            const { feature, enabled } = message;

            if (feature === 'logoutGuard') {
                featureToggles.logoutGuard = enabled;
                const mod = window.BYS?.LogoutGuard;
                if (mod) {
                    if (enabled && mod.init) {
                        try { mod.init(); } catch (e) { }
                    } else if (!enabled && mod.cleanup) {
                        try { mod.cleanup(); } catch (e) { }
                    }
                }
            }

            if (feature === 'collections') {
                featureToggles.collections = enabled;
                const mod = window.BYS?.Collections;
                if (mod) {
                    if (enabled && mod.init) {
                        try { mod.init(); } catch (e) { }
                    } else if (!enabled && mod.cleanup) {
                        try { mod.cleanup(); } catch (e) { }
                    }
                }
            }
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

