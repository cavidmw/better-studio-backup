/**
 * BYS.CurrencyPicker — Gelişmiş Para Birimi Seçici
 * YouTube Studio Ayarlar > Genel ekranındaki para birimi seçiciyi
 * arama ve favoriler destekli modern bir arayüzle değiştirir.
 *
 * Seçim: orijinal ytcp-form-select triggerına click → dropdown açılır →
 * doğru option bulunup click → Polymer state güncellenir → Kaydet aktif.
 */
window.BYS = window.BYS || {};

window.BYS.CurrencyPicker = (function () {
    'use strict';

    // ─── i18n Helper ──────────────────────────────────────────────────────────

    function t(key) {
        return window.BYS?.i18n?.t?.(key) || key;
    }

    const SVG_STAR_EMPTY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>`;
    const SVG_STAR_FILLED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;

    /* ---- State ---- */
    let favorites = new Set();
    let filterFavOnly = false;
    let searchQuery = '';
    let selectedCode = null;
    let injected = false;
    let listEl = null;
    let searchEl = null;
    let starFilterEl = null;
    let emptyEl = null;
    let nativeFormSelect = null;
    let observer = null;
    let intervalIds = [];

    /* ---- Storage ---- */
    function loadFavorites(cb) {
        try {
            chrome.storage.local.get('ks_favorites', (r) => {
                if (r && r.ks_favorites) favorites = new Set(r.ks_favorites);
                cb();
            });
        } catch (e) { cb(); }
    }

    function saveFavorites() {
        try { chrome.storage.local.set({ ks_favorites: [...favorites] }); } catch (e) { }
    }

    /* ---- Deep Shadow DOM query ---- */
    function deepQuery(root, selector) {
        if (!root) return null;
        const found = root.querySelector(selector);
        if (found) return found;
        for (const el of root.querySelectorAll('*')) {
            if (el.shadowRoot) {
                const r = deepQuery(el.shadowRoot, selector);
                if (r) return r;
            }
        }
        return null;
    }

    function deepQueryAll(root, selector, results = []) {
        if (!root) return results;
        root.querySelectorAll(selector).forEach(el => results.push(el));
        root.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) deepQueryAll(el.shadowRoot, selector, results);
        });
        return results;
    }

    /* ==============================================================
       CORE: Simulate real user interaction on the original dropdown.
       This is the only reliable way to trigger Polymer's save-button
       dirty-check — we must use YouTube's own event pathway.
       ============================================================== */
    function simulateNativeSelection(code) {
        if (!nativeFormSelect) return;

        nativeFormSelect.style.cssText = `
      position: fixed !important;
      left: -9999px !important;
      top: 0px !important;
      display: block !important;
      width: 320px !important;
      opacity: 0 !important;
      pointer-events: auto !important;
      visibility: visible !important;
      z-index: 9999 !important;
    `;

        setTimeout(() => {
            const trigger = (
                nativeFormSelect.querySelector('ytcp-dropdown-trigger') ||
                deepQuery(nativeFormSelect, 'ytcp-dropdown-trigger') ||
                nativeFormSelect.querySelector('[role="button"]') ||
                deepQuery(nativeFormSelect, '[role="button"]')
            );

            if (!trigger) {
                hideFormSelect();
                return;
            }

            trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));

            let attempts = 0;
            function tryClickOption() {
                attempts++;
                const clicked = findAndClickOption(code);
                if (clicked) {
                    setTimeout(hideFormSelect, 200);
                } else if (attempts < 6) {
                    setTimeout(tryClickOption, 200);
                } else {
                    document.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 'Escape', keyCode: 27, bubbles: true, composed: true
                    }));
                    setTimeout(hideFormSelect, 100);
                }
            }
            setTimeout(tryClickOption, 300);

        }, 80);
    }

    function clickAndNotify(el) {
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, cancelable: true }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true, cancelable: true }));
        if (nativeFormSelect) {
            ['input', 'change'].forEach(type =>
                nativeFormSelect.dispatchEvent(new Event(type, { bubbles: true, composed: true }))
            );
        }
    }

    function findAndClickOption(code) {
        const roleOptions = [
            ...document.querySelectorAll('[role="option"]'),
            ...document.querySelectorAll('[role="listitem"]'),
        ].filter(el => !el.closest('#ks-picker'));

        for (const el of roleOptions) {
            if (matchesCode(el, code)) {
                clickAndNotify(el);
                return true;
            }
        }

        const shadowOptions = deepQueryAll(nativeFormSelect, '[role="option"], ytcp-select-option, tp-yt-paper-item, li');
        for (const el of shadowOptions) {
            if (matchesCode(el, code)) {
                clickAndNotify(el);
                return true;
            }
        }

        const allVisible = [
            ...document.querySelectorAll('ytcp-ve, tp-yt-paper-item'),
            ...deepQueryAll(nativeFormSelect, 'ytcp-ve, tp-yt-paper-item'),
        ].filter(el => !el.closest('#ks-picker'));

        for (const el of allVisible) {
            if (matchesCode(el, code)) {
                clickAndNotify(el);
                return true;
            }
        }

        return false;
    }

    function matchesCode(el, code) {
        const val = (el.getAttribute('value') || el.getAttribute('data-value') || '').trim();
        if (val === code) return true;
        const text = el.textContent.trim();
        return text === code || text.startsWith(code + ' ') || text.startsWith(code + '\n') ||
            text.startsWith(code + '-') || text.replace(/\s+/g, ' ').startsWith(code + ' ');
    }

    function hideFormSelect() {
        if (nativeFormSelect) {
            nativeFormSelect.style.cssText = 'display: none !important';
            nativeFormSelect.setAttribute('aria-hidden', 'true');
        }
    }

    /* ---- Currency selection ---- */
    function selectCurrency(code) {
        selectedCode = code;
        renderList();
        simulateNativeSelection(code);
    }

    /* ---- Fuzzy search helpers ---- */
    function normalize(str) {
        return (str || '').normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/gi, ' ')
            .toLowerCase()
            .trim();
    }

    function fuzzyMatch(haystack, needle) {
        const h = normalize(haystack);
        const n = normalize(needle);
        if (!n) return true;
        if (h.includes(n)) return true;
        const needleWords = n.split(/\s+/).filter(Boolean);
        const haystackWords = h.split(/\s+/).filter(Boolean);
        return needleWords.every(nw =>
            haystackWords.some(hw => hw.startsWith(nw))
        );
    }

    /* ---- List helpers ---- */
    function getFilteredSortedList() {
        let list = [...KS_CURRENCIES];
        if (searchQuery) {
            list = list.filter(c =>
                fuzzyMatch(c.code, searchQuery) ||
                fuzzyMatch(c.name, searchQuery) ||
                fuzzyMatch(c.countries || '', searchQuery)
            );
        }
        if (filterFavOnly) list = list.filter(c => favorites.has(c.code));
        list.sort((a, b) => {
            const af = favorites.has(a.code), bf = favorites.has(b.code);
            if (af && !bf) return -1; if (!af && bf) return 1;
            return a.code.localeCompare(b.code);
        });
        return list;
    }

    function renderList() {
        if (!listEl) return;
        listEl.innerHTML = '';
        const items = getFilteredSortedList();
        if (!items.length) { emptyEl && emptyEl.classList.add('ks-visible'); return; }
        emptyEl && emptyEl.classList.remove('ks-visible');

        let sepAdded = false;
        items.forEach((cur, idx) => {
            const isFav = favorites.has(cur.code);
            const isSel = cur.code === selectedCode;

            if (!filterFavOnly && !searchQuery && idx > 0 && !sepAdded) {
                if (favorites.has(items[idx - 1].code) && !isFav) {
                    const sep = document.createElement('li');
                    sep.className = 'ks-separator'; sep.setAttribute('role', 'separator');
                    listEl.appendChild(sep); sepAdded = true;
                }
            }

            const li = document.createElement('li');
            li.className = 'ks-item' + (isSel ? ' ks-selected' : '');
            li.setAttribute('role', 'option');
            li.setAttribute('data-code', cur.code);
            li.setAttribute('aria-selected', String(isSel));

            const codeEl = document.createElement('span');
            codeEl.className = 'ks-code'; codeEl.textContent = cur.code;

            const nameEl = document.createElement('span');
            nameEl.className = 'ks-name'; nameEl.textContent = cur.name;

            const starBtn = document.createElement('button');
            starBtn.className = 'ks-item-star' + (isFav ? ' ks-starred' : '');
            starBtn.type = 'button';
            starBtn.setAttribute('aria-label', isFav ? t('currency.removeFav') : t('currency.addFav'));
            starBtn.innerHTML = isFav ? SVG_STAR_FILLED : SVG_STAR_EMPTY;
            starBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                favorites.has(cur.code) ? favorites.delete(cur.code) : favorites.add(cur.code);
                saveFavorites(); renderList();
            });

            li.addEventListener('click', () => selectCurrency(cur.code));
            li.appendChild(codeEl); li.appendChild(nameEl); li.appendChild(starBtn);
            listEl.appendChild(li);
        });
    }

    /* ---- Fix parent container widths ---- */
    function fixWidths(container) {
        const expand = (el) => {
            if (!el) return;
            el.style.setProperty('width', '100%', 'important');
            el.style.setProperty('max-width', 'none', 'important');
            el.style.setProperty('box-sizing', 'border-box', 'important');
        };
        expand(container);
        let el = container.parentElement, steps = 0;
        while (el && steps < 6) {
            const tag = el.tagName || '';
            if (tag === 'YTCP-SETTINGS-STUDIO-DEFAULT' || tag === 'YTCP-NAVIGATION' ||
                tag === 'TP-YT-IRON-PAGES' || el.id === 'content') break;
            expand(el); el = el.parentElement; steps++;
        }
        try {
            const studioEl = deepQuery(document, 'ytcp-settings-studio-default');
            if (studioEl && studioEl.shadowRoot && !studioEl.shadowRoot.querySelector('#ks-shadow-style')) {
                const s = document.createElement('style');
                s.id = 'ks-shadow-style';
                s.textContent = `
          #main, .input-container, #currency-container {
            width: 100% !important; max-width: none !important;
            box-sizing: border-box !important;
          }
        `;
                studioEl.shadowRoot.appendChild(s);
            }
        } catch (e) { }
    }

    /* ---- Build the picker UI ---- */
    function buildPicker(container, formSelectEl) {
        hideFormSelectEl(formSelectEl);
        nativeFormSelect = formSelectEl;

        try {
            const val = formSelectEl.getAttribute('value') ||
                deepQuery(formSelectEl, '[selected]')?.getAttribute('value') || '';
            if (/^[A-Z]{3}$/.test(val.trim())) {
                selectedCode = val.trim();
            } else {
                const trig = deepQuery(formSelectEl, '.dropdown-trigger-text');
                if (trig) {
                    const m = trig.textContent.trim().match(/^([A-Z]{3})/);
                    if (m) selectedCode = m[1];
                }
            }
        } catch (e) { }

        fixWidths(container);

        const picker = document.createElement('div');
        picker.id = 'ks-picker';
        picker.setAttribute('role', 'listbox');
        picker.setAttribute('aria-label', t('currency.search'));

        const toolbar = document.createElement('div');
        toolbar.id = 'ks-toolbar';

        searchEl = document.createElement('input');
        searchEl.id = 'ks-search'; searchEl.type = 'text';
        searchEl.placeholder = t('currency.search');
        searchEl.setAttribute('aria-label', 'Para birimi ara');
        searchEl.autocomplete = 'off'; searchEl.spellcheck = false;
        searchEl.addEventListener('input', () => { searchQuery = searchEl.value.trim(); renderList(); });

        starFilterEl = document.createElement('button');
        starFilterEl.id = 'ks-star-filter'; starFilterEl.type = 'button';
        starFilterEl.setAttribute('aria-label', t('currency.showFavOnly'));
        starFilterEl.setAttribute('aria-pressed', 'false');
        starFilterEl.title = t('currency.showFavOnly');
        starFilterEl.innerHTML = SVG_STAR_EMPTY;
        starFilterEl.addEventListener('click', () => {
            filterFavOnly = !filterFavOnly;
            starFilterEl.classList.toggle('ks-active', filterFavOnly);
            starFilterEl.setAttribute('aria-pressed', String(filterFavOnly));
            starFilterEl.title = filterFavOnly ? t('currency.showAll') : t('currency.showFavOnly');
            renderList();
        });

        toolbar.appendChild(searchEl); toolbar.appendChild(starFilterEl);
        listEl = document.createElement('ul'); listEl.id = 'ks-list';
        emptyEl = document.createElement('div'); emptyEl.id = 'ks-empty';
        emptyEl.textContent = t('currency.noResult');

        picker.appendChild(toolbar); picker.appendChild(listEl); picker.appendChild(emptyEl);
        container.appendChild(picker);
        renderList();
        requestAnimationFrame(() => {
            const sel = listEl.querySelector('.ks-selected');
            if (sel) sel.scrollIntoView({ block: 'center', behavior: 'instant' });
        });
    }

    function hideFormSelectEl(el) {
        el.style.cssText = 'display: none !important';
        el.setAttribute('aria-hidden', 'true');
    }

    /* ---- Main injection ---- */
    function tryInject() {
        if (injected) return;
        const studioEl = deepQuery(document, 'ytcp-settings-studio-default');
        if (!studioEl) return;
        const sr = studioEl.shadowRoot;
        const container = (sr && sr.querySelector('#currency-container')) || studioEl.querySelector('#currency-container');
        if (!container) return;
        const formSelectEl = container.querySelector('ytcp-form-select');
        if (!formSelectEl) return;
        if (container.querySelector('#ks-picker')) return;
        injected = true;
        loadFavorites(() => buildPicker(container, formSelectEl));
    }

    function resetInjection() {
        injected = false; listEl = null; searchEl = null;
        starFilterEl = null; emptyEl = null; nativeFormSelect = null;
        filterFavOnly = false; searchQuery = '';
    }

    /* ---- Public API ---- */
    return {
        init() {
            if (observer) return;

            observer = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    for (const node of m.addedNodes) {
                        if (node.nodeType !== 1) continue;
                        const tag = node.tagName || '';
                        if (tag === 'YTCP-SETTINGS-DIALOG' || tag === 'YTCP-CHANNEL-SETTINGS-DIALOG' ||
                            tag === 'YTCP-SETTINGS-STUDIO-DEFAULT' ||
                            (node.querySelector && (node.querySelector('ytcp-settings-dialog') ||
                                node.querySelector('ytcp-settings-studio-default')))) {
                            setTimeout(tryInject, 200); setTimeout(tryInject, 700); setTimeout(tryInject, 1400);
                        }
                    }
                    for (const node of m.removedNodes) {
                        if (node.nodeType !== 1) continue;
                        if ((node.tagName || '') === 'YTCP-SETTINGS-DIALOG' ||
                            (node.tagName || '') === 'YTCP-CHANNEL-SETTINGS-DIALOG') {
                            resetInjection();
                        }
                    }
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            intervalIds.push(setInterval(() => {
                if (!injected) return;
                if (!deepQuery(document, '#ks-picker')) { resetInjection(); tryInject(); }
            }, 2000));

            setTimeout(tryInject, 400);
            setTimeout(tryInject, 1200);
        },

        cleanup() {
            if (observer) { observer.disconnect(); observer = null; }
            intervalIds.forEach(id => clearInterval(id));
            intervalIds = [];
            resetInjection();
            document.getElementById('ks-picker')?.remove();
        }
    };
})();
