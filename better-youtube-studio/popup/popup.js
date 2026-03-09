/**
 * Better YouTube Studio — Popup v2
 * Kontrol merkezi: kart bazlı yönlendirme + shortcuts live-save
 */
(async function () {
    'use strict';

    // ─── Sabitler ──────────────────────────────────────────────────────────────

    const DEFAULTS = {
        shortcuts: {
            '1': 'dashboard',
            '2': 'content-videos',
            '3': 'analytics',
            '4': 'comments',
            '5': 'monetization',
            '6': 'audio-library',
            '7': 'settings',
            '8': 'copyright',
            '9': 'subtitles'
        }
    };

    const NAV_OPTIONS = [
        { value: 'none',                label: '— Atanmamış —' },
        { value: '_g_main',             label: '── Ana Menü ──',              disabled: true },
        { value: 'dashboard',           label: 'Kontrol Paneli' },
        { value: 'content-videos',      label: 'İçerik - Videolar' },
        { value: 'content-shorts',      label: 'İçerik - Shorts' },
        { value: 'comments',            label: 'Topluluk' },
        { value: 'monetization',        label: 'Para Kazanma' },
        { value: 'customization',       label: 'Özelleştirme' },
        { value: 'audio-library',       label: 'Ses Kitaplığı' },
        { value: 'subtitles',           label: 'Altyazı ve Ses' },
        { value: 'copyright',           label: 'İçerik Tespiti' },
        { value: 'settings',            label: 'Ayarlar' },
        { value: '_g_analytics',        label: '── Analytics ──',             disabled: true },
        { value: 'analytics',           label: 'Analytics - Genel Bakış' },
        { value: 'analytics-content',   label: 'Analytics - İçerik' },
        { value: 'analytics-audience',  label: 'Analytics - Kitle' },
        { value: 'analytics-revenue',   label: 'Analytics - Gelir' },
    ];

    // ─── Storage ───────────────────────────────────────────────────────────────

    function storageGet(keys) {
        return new Promise(res => chrome.storage.sync.get(keys, d => res(d || {})));
    }

    function storageSet(data) {
        return new Promise(res => chrome.storage.sync.set(data, res));
    }

    // ─── Toast ─────────────────────────────────────────────────────────────────

    const toastEl = document.getElementById('popup-toast');
    let toastTimer;

    function showToast(msg, duration = 2200) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
    }

    // ─── Content Script Mesajı ─────────────────────────────────────────────────

    async function sendToActiveTab(message) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id && tab.url?.includes('studio.youtube.com')) {
                chrome.tabs.sendMessage(tab.id, message);
                return true;
            }
        } catch (e) { /* sessiz hata */ }
        return false;
    }

    async function isOnStudio() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            return !!(tab?.url?.includes('studio.youtube.com'));
        } catch { return false; }
    }

    // ══════════════════════════════════════════════════════════════════════
    // KART 1 — Grafik Renkleri
    // Tıklanınca sayfa içi BYS_OPEN_GRAPH_MODAL tetiklenir
    // ══════════════════════════════════════════════════════════════════════

    const cardColors = document.getElementById('card-colors');

    cardColors.addEventListener('click', async () => {
        const onStudio = await isOnStudio();
        if (!onStudio) {
            showToast('⚠️  Önce Analytics sayfasını açın');
            return;
        }
        await sendToActiveTab({ type: 'BYS_OPEN_GRAPH_MODAL' });
        showToast('🎨  Özelleştirme modalı açılıyor…');
    });

    cardColors.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cardColors.click(); }
    });

    // ══════════════════════════════════════════════════════════════════════
    // KART 2 — Klavye Kısayolları (inline panel)
    // ══════════════════════════════════════════════════════════════════════

    let shortcutSettings = { ...DEFAULTS.shortcuts };
    let shortcutsExpanded = false;

    const cardShortcuts = document.getElementById('card-shortcuts');
    const shortcutsPanel = document.getElementById('shortcuts-panel');
    const shortcutsList = document.getElementById('shortcuts-list');

    cardShortcuts.addEventListener('click', toggleShortcutsPanel);
    cardShortcuts.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleShortcutsPanel(); }
    });

    function toggleShortcutsPanel() {
        shortcutsExpanded = !shortcutsExpanded;
        cardShortcuts.setAttribute('aria-expanded', String(shortcutsExpanded));
        cardShortcuts.classList.toggle('is-open', shortcutsExpanded);
        shortcutsPanel.classList.toggle('is-open', shortcutsExpanded);
        shortcutsPanel.setAttribute('aria-hidden', String(!shortcutsExpanded));

        if (shortcutsExpanded) {
            // Panel açılınca kart ile panel arasında border-radius sürekliliği için
            cardShortcuts.style.borderBottomLeftRadius = '0';
            cardShortcuts.style.borderBottomRightRadius = '0';
            cardShortcuts.style.borderBottom = 'none';
        } else {
            cardShortcuts.style.borderBottomLeftRadius = '';
            cardShortcuts.style.borderBottomRightRadius = '';
            cardShortcuts.style.borderBottom = '';
        }
    }

    // ── Shortcut listesini render et ──────────────────────────────────────

    function getAssignedTargets(excludeKey) {
        const assigned = new Set();
        for (const [k, v] of Object.entries(shortcutSettings)) {
            if (k !== excludeKey && v && v !== 'none' && !v.startsWith('_g_')) {
                assigned.add(v);
            }
        }
        return assigned;
    }

    function buildSelectOptions(select, currentKey) {
        select.innerHTML = '';
        const assigned = getAssignedTargets(currentKey);

        NAV_OPTIONS.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.value;

            const isGroupHeader = opt.disabled;
            const isAssignedElsewhere = assigned.has(opt.value);

            if (isGroupHeader) {
                o.textContent = opt.label;
                o.disabled = true;
                o.className = 'opt-group-header';
            } else if (isAssignedElsewhere) {
                o.textContent = `${opt.label} (kullanılıyor)`;
                o.className = 'opt-assigned';
            } else {
                o.textContent = opt.label;
                o.className = 'opt-free';
            }

            o.selected = shortcutSettings[currentKey] === opt.value;
            select.appendChild(o);
        });
    }

    function refreshAllSelectOptions() {
        for (let i = 1; i <= 9; i++) {
            const select = document.getElementById(`sc-${i}`);
            if (select) buildSelectOptions(select, String(i));
        }
    }

    function renderShortcuts() {
        shortcutsList.innerHTML = '';

        for (let i = 1; i <= 9; i++) {
            const key = String(i);

            const row = document.createElement('div');
            row.className = 'shortcut-row';

            // Klavye göstergesi
            const keyEl = document.createElement('div');
            keyEl.className = 'shortcut-key';
            keyEl.innerHTML = `<kbd>Alt</kbd><span class="shortcut-plus">+</span><kbd>${i}</kbd>`;

            // Select
            const select = document.createElement('select');
            select.className = 'shortcut-select';
            select.id = `sc-${key}`;
            select.dataset.key = key;

            buildSelectOptions(select, key);

            // Auto-save badge
            const savedBadge = document.createElement('span');
            savedBadge.className = 'shortcut-saved';
            savedBadge.textContent = '✓';

            // Çakışma badge
            const conflictBadge = document.createElement('span');
            conflictBadge.className = 'conflict-badge';

            // ── Change handler: anında kaydet + çakışma kuralı ────────────
            select.addEventListener('change', async () => {
                const newVal = select.value;
                const thisKey = select.dataset.key;

                // Disabled group header seçildiyse geri al
                if (newVal.startsWith('_g_')) {
                    select.value = shortcutSettings[thisKey] || 'none';
                    return;
                }

                conflictBadge.textContent = '';

                // Çakışma: aynı değer başka bir key'de mi?
                if (newVal !== 'none') {
                    for (const [k, v] of Object.entries(shortcutSettings)) {
                        if (k !== thisKey && v === newVal) {
                            shortcutSettings[k] = 'none';
                            const conflictRow = document.getElementById(`sc-${k}`)?.closest('.shortcut-row');
                            if (conflictRow) {
                                const cb = conflictRow.querySelector('.conflict-badge');
                                if (cb) {
                                    cb.textContent = '← kaldırıldı';
                                    setTimeout(() => { cb.textContent = ''; }, 1200);
                                }
                            }
                            break;
                        }
                    }
                }

                shortcutSettings[thisKey] = newVal;
                await storageSet({ shortcuts: shortcutSettings });
                sendToActiveTab({ type: 'BYS_RELOAD_SHORTCUTS' });

                // Tüm select'lerin option durumlarını güncelle
                refreshAllSelectOptions();

                // Saved göstergesi
                savedBadge.classList.add('visible');
                setTimeout(() => savedBadge.classList.remove('visible'), 900);
            });

            row.appendChild(keyEl);
            row.appendChild(select);
            row.appendChild(conflictBadge);
            row.appendChild(savedBadge);
            shortcutsList.appendChild(row);
        }
    }

    // ── Varsayıla Dön ─────────────────────────────────────────────────────

    document.getElementById('reset-shortcuts-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        shortcutSettings = { ...DEFAULTS.shortcuts };
        await storageSet({ shortcuts: shortcutSettings });
        sendToActiveTab({ type: 'BYS_RELOAD_SHORTCUTS' });
        renderShortcuts();
        showToast('↺ Varsayılan kısayollar yüklendi');
    });

    // ── Yükle ─────────────────────────────────────────────────────────────

    async function loadShortcuts() {
        const data = await storageGet(['shortcuts']);
        shortcutSettings = data.shortcuts || { ...DEFAULTS.shortcuts };
        renderShortcuts();
    }

    // ══════════════════════════════════════════════════════════════════════
    // TOGGLE SWITCH — Para Birimi + AZN Tooltip
    // ══════════════════════════════════════════════════════════════════════

    const TOGGLE_DEFS = [
        { id: 'toggle-currency', feature: 'currencyPicker', cardId: 'card-currency' },
        { id: 'toggle-tooltip',  feature: 'tooltip',        cardId: 'card-tooltip'  }
    ];

    let featureToggles = { currencyPicker: true, tooltip: true };

    async function loadToggles() {
        const data = await storageGet(['featureToggles']);
        if (data.featureToggles) {
            featureToggles = Object.assign({ currencyPicker: true, tooltip: true }, data.featureToggles);
        }
        TOGGLE_DEFS.forEach(({ id, feature, cardId }) => {
            const checkbox = document.getElementById(id);
            const card = document.getElementById(cardId);
            if (!checkbox) return;
            const enabled = featureToggles[feature] !== false;
            checkbox.checked = enabled;
            card?.classList.toggle('is-disabled', !enabled);
        });
    }

    async function onToggleChange(feature, cardId, enabled) {
        featureToggles[feature] = enabled;
        await storageSet({ featureToggles });

        const card = document.getElementById(cardId);
        card?.classList.toggle('is-disabled', !enabled);

        const sent = await sendToActiveTab({ type: 'BYS_SET_FEATURE', feature, enabled });

        if (enabled && !sent) {
            // Özellik aktif edildi ama sayfa mesajı alamadı — Studio'da değil, reload gerek yok
        } else if (enabled && sent) {
            // Aktif edildi, mesaj gönderildi — reload gerekmez, BYS_SET_FEATURE handler halledecek
        }
        // Disable durumunda reload gerekmez — cleanup mesajla yapıldı
    }

    function initToggles() {
        TOGGLE_DEFS.forEach(({ id, feature, cardId }) => {
            const checkbox = document.getElementById(id);
            if (!checkbox) return;
            checkbox.addEventListener('change', () => {
                onToggleChange(feature, cardId, checkbox.checked);
            });
            // Tıklama olayının kartın üst kısmına yayılmasını engelle
            checkbox.closest('label')?.addEventListener('click', (e) => e.stopPropagation());
        });
    }

    // ══════════════════════════════════════════════════════════════════════
    // Başlangıç
    // ══════════════════════════════════════════════════════════════════════

    await loadShortcuts();
    await loadToggles();
    initToggles();
})();
