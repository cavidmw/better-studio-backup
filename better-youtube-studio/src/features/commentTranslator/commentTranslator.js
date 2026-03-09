/**
 * BYS Comment Translator — YouTube Studio Yorum Çeviri Modülü
 * Yorumları Türkçeye çevirmek için Vercel backend'e istek atar.
 */
(function () {
    'use strict';

    // ─── Ayarlar ──────────────────────────────────────────────────────────────
    const TRANSLATE_API_URL = 'https://YOUR-VERCEL-APP.vercel.app/api/translate';
    const TARGET_LANG = 'tr';
    const BUTTON_TEXT = "TR'ye Çevir";
    const TRANSLATED_LABEL = 'Çevrildi';

    // ─── Çeviri Cache (aynı yoruma tekrar istek atma) ─────────────────────────
    const translationCache = new WeakMap();

    // ─── SVG İkon ─────────────────────────────────────────────────────────────
    const TRANSLATE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`;

    // ─── Yorum Kartına Buton Ekle ─────────────────────────────────────────────
    function addTranslateButton(commentEl) {
        // Zaten buton eklenmişse atla
        if (commentEl.dataset.bysTranslateAdded === 'true') return;
        commentEl.dataset.bysTranslateAdded = 'true';

        // Yorum metni elementi
        const contentText = commentEl.querySelector('#content-text');
        if (!contentText) return;

        // Aksiyon alanı
        const actionsArea = commentEl.querySelector('#comment-actions');
        if (!actionsArea) return;

        // Buton oluştur
        const btn = document.createElement('button');
        btn.className = 'bys-translate-btn';
        btn.innerHTML = `${TRANSLATE_ICON}<span>${BUTTON_TEXT}</span>`;
        btn.title = 'Yorumu Türkçeye çevir';

        // Click handler
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTranslate(commentEl, contentText, btn);
        });

        // Butonu aksiyon alanının başına ekle
        actionsArea.insertBefore(btn, actionsArea.firstChild);
    }

    // ─── Çeviri İşlemi ────────────────────────────────────────────────────────
    async function handleTranslate(commentEl, contentText, btn) {
        // Zaten çevrilmişse tekrar istek atma
        if (translationCache.has(commentEl)) {
            showAlreadyTranslated(commentEl);
            return;
        }

        const originalText = contentText.textContent?.trim();
        if (!originalText) return;

        // Loading durumu
        btn.disabled = true;
        btn.classList.add('bys-loading');
        btn.innerHTML = `<span class="bys-spinner"></span><span>Çevriliyor...</span>`;

        try {
            const response = await fetch(TRANSLATE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: originalText,
                    targetLang: TARGET_LANG
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const translatedText = data.translatedText || data.translation || data.text;

            if (!translatedText) {
                throw new Error('Çeviri sonucu boş');
            }

            // Çeviriyi göster
            showTranslation(commentEl, contentText, originalText, translatedText, btn);

            // Cache'e ekle
            translationCache.set(commentEl, { original: originalText, translated: translatedText });

        } catch (error) {
            console.error('[BYS] Çeviri hatası:', error);
            showError(btn, error.message);
        }
    }

    // ─── Çeviri Sonucunu Göster ───────────────────────────────────────────────
    function showTranslation(commentEl, contentText, originalText, translatedText, btn) {
        // Yorum kartına çevrildi işareti
        commentEl.classList.add('bys-translated');

        // Orijinal metni sakla (data attribute)
        contentText.dataset.bysOriginal = originalText;

        // Çeviri container oluştur
        const translationContainer = document.createElement('div');
        translationContainer.className = 'bys-translation-container';
        translationContainer.innerHTML = `
            <div class="bys-translation-label">${TRANSLATED_LABEL}</div>
            <div class="bys-translated-text">${escapeHtml(translatedText)}</div>
            <div class="bys-original-text">
                <span class="bys-original-label">Orijinal:</span>
                <span class="bys-original-content">${escapeHtml(originalText)}</span>
            </div>
        `;

        // Orijinal metni gizle ve çeviriyi ekle
        contentText.style.display = 'none';
        contentText.parentNode.insertBefore(translationContainer, contentText.nextSibling);

        // Butonu güncelle
        btn.classList.remove('bys-loading');
        btn.classList.add('bys-done');
        btn.innerHTML = `${TRANSLATE_ICON}<span>Çevrildi ✓</span>`;
        btn.disabled = true;
    }

    // ─── Zaten Çevrilmiş Uyarısı ──────────────────────────────────────────────
    function showAlreadyTranslated(commentEl) {
        const btn = commentEl.querySelector('.bys-translate-btn');
        if (btn) {
            btn.classList.add('bys-pulse');
            setTimeout(() => btn.classList.remove('bys-pulse'), 500);
        }
    }

    // ─── Hata Göster ──────────────────────────────────────────────────────────
    function showError(btn, message) {
        btn.classList.remove('bys-loading');
        btn.classList.add('bys-error');
        btn.innerHTML = `${TRANSLATE_ICON}<span>Hata!</span>`;
        btn.title = `Çeviri hatası: ${message}`;
        btn.disabled = false;

        // 3 saniye sonra normale dön
        setTimeout(() => {
            btn.classList.remove('bys-error');
            btn.innerHTML = `${TRANSLATE_ICON}<span>${BUTTON_TEXT}</span>`;
            btn.title = 'Yorumu Türkçeye çevir';
        }, 3000);
    }

    // ─── HTML Escape ──────────────────────────────────────────────────────────
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ─── Mevcut Yorumları Tara ────────────────────────────────────────────────
    function scanExistingComments() {
        const comments = document.querySelectorAll('ytcp-comment');
        comments.forEach(addTranslateButton);
    }

    // ─── MutationObserver ile Yeni Yorumları İzle ─────────────────────────────
    function observeNewComments() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;

                    // Eklenen node bir yorum mu?
                    if (node.matches && node.matches('ytcp-comment')) {
                        addTranslateButton(node);
                    }

                    // İçinde yorum var mı?
                    const comments = node.querySelectorAll?.('ytcp-comment');
                    if (comments) {
                        comments.forEach(addTranslateButton);
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }

    // ─── Sayfa Kontrolü ───────────────────────────────────────────────────────
    function isCommentsPage() {
        return location.pathname.includes('/comments');
    }

    // ─── Init ─────────────────────────────────────────────────────────────────
    let observer = null;

    function init() {
        if (!isCommentsPage()) return;

        // Mevcut yorumları tara
        scanExistingComments();

        // Yeni yorumları izle
        observer = observeNewComments();

        console.log('[BYS] Comment Translator aktif');
    }

    function cleanup() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    }

    // ─── SPA Navigasyon Desteği ───────────────────────────────────────────────
    let lastPath = location.pathname;

    function checkNavigation() {
        if (location.pathname !== lastPath) {
            lastPath = location.pathname;
            cleanup();
            if (isCommentsPage()) {
                setTimeout(init, 500); // DOM'un yüklenmesini bekle
            }
        }
    }

    // History API override ile navigasyon algıla
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
        originalPushState.apply(this, args);
        checkNavigation();
    };

    window.addEventListener('popstate', checkNavigation);

    // Sayfa yüklendiğinde başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // BYS namespace'e ekle
    window.BYS = window.BYS || {};
    window.BYS.CommentTranslator = { init, cleanup };
})();
