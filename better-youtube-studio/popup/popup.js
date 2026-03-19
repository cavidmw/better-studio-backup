/**
 * Better YouTube Studio — Popup v3
 * Kontrol merkezi: 5 özellik toggle + i18n + shortcuts live-save
 */
(async function () {
    'use strict';

    // ─── i18n Çeviri Sistemi ───────────────────────────────────────────────────

    const translations = {
        tr: {
            'popup.title': 'Better YouTube Studio',
            'popup.desc': 'YouTube Studio deneyimini güçlendiren profesyonel araç seti.',
            'popup.features': 'Özellikler',
            'feature.graphColors': 'Grafik Renkleri',
            'feature.graphColors.desc': 'Analytics grafiklerini kişisel renginizle özelleştirin.',
            'feature.shortcuts': 'Klavye Kısayolları',
            'feature.shortcuts.desc': 'Alt + 1–9 ile sayfalar arası anında geçiş.',
            'feature.currencyPicker': 'Para Birimi Seçici',
            'feature.currencyPicker.desc': 'Ayarlar › Genel ekranında gelişmiş seçici otomatik aktif.',
            'feature.tooltip': 'USD → AZN Tooltip',
            'feature.tooltip.desc': 'Dolar tutarlarının üzerine gelince AZN karşılığı gösterilir.',
            'feature.logoutGuard': 'Çıkış Koruması',
            'feature.logoutGuard.desc': 'Yanlışlıkla çıkış yapmayı önleyen onay modalı.',
            'shortcuts.hint': 'Değişiklikler anında kaydedilir.',
            'shortcuts.reset': '↺ Varsayılana Dön',
            'shortcuts.unassigned': '— Atanmamış —',
            'shortcuts.inUse': '(kullanılıyor)',
            'shortcuts.removed': '← kaldırıldı',
            'shortcuts.loaded': '↺ Varsayılan kısayollar yüklendi',
            'nav.mainMenu': '── Ana Menü ──',
            'nav.analytics': '── Analytics ──',
            'nav.dashboard': 'Kontrol Paneli',
            'nav.contentVideos': 'İçerik - Videolar',
            'nav.contentShorts': 'İçerik - Shorts',
            'nav.comments': 'Topluluk',
            'nav.monetization': 'Para Kazanma',
            'nav.customization': 'Özelleştirme',
            'nav.audioLibrary': 'Ses Kitaplığı',
            'nav.subtitles': 'Altyazı ve Ses',
            'nav.copyright': 'İçerik Tespiti',
            'nav.settings': 'Ayarlar',
            'nav.analyticsOverview': 'Analytics - Genel Bakış',
            'nav.analyticsContent': 'Analytics - İçerik',
            'nav.analyticsAudience': 'Analytics - Kitle',
            'nav.analyticsRevenue': 'Analytics - Gelir',
            'toast.openAnalytics': '⚠️  Önce Analytics sayfasını açın',
            'toast.modalOpening': '🎨  Özelleştirme modalı açılıyor…'
        },
        az: {
            'popup.title': 'Better YouTube Studio',
            'popup.desc': 'YouTube Studio təcrübənizi gücləndirən peşəkar alət dəsti.',
            'popup.features': 'Xüsusiyyətlər',
            'feature.graphColors': 'Qrafik Rəngləri',
            'feature.graphColors.desc': 'Analytics qrafiklərini şəxsi rənginizlə fərdiləşdirin.',
            'feature.shortcuts': 'Klaviatura Qısayolları',
            'feature.shortcuts.desc': 'Alt + 1–9 ilə səhifələr arasında ani keçid.',
            'feature.currencyPicker': 'Valyuta Seçici',
            'feature.currencyPicker.desc': 'Ayarlar › Ümumi ekranında təkmil seçici avtomatik aktiv.',
            'feature.tooltip': 'USD → AZN Tooltip',
            'feature.tooltip.desc': 'Dollar məbləğlərinin üzərinə gələndə AZN qarşılığı göstərilir.',
            'feature.logoutGuard': 'Çıxış Qoruması',
            'feature.logoutGuard.desc': 'Təsadüfi çıxışın qarşısını alan təsdiq modalı.',
            'shortcuts.hint': 'Dəyişikliklər dərhal yadda saxlanılır.',
            'shortcuts.reset': '↺ Standarta Qayıt',
            'shortcuts.unassigned': '— Təyin edilməyib —',
            'shortcuts.inUse': '(istifadə olunur)',
            'shortcuts.removed': '← silindi',
            'shortcuts.loaded': '↺ Standart qısayollar yükləndi',
            'nav.mainMenu': '── Əsas Menyu ──',
            'nav.analytics': '── Analytics ──',
            'nav.dashboard': 'İdarəetmə Paneli',
            'nav.contentVideos': 'Məzmun - Videolar',
            'nav.contentShorts': 'Məzmun - Shorts',
            'nav.comments': 'İcma',
            'nav.monetization': 'Pul Qazanma',
            'nav.customization': 'Fərdiləşdirmə',
            'nav.audioLibrary': 'Səs Kitabxanası',
            'nav.subtitles': 'Altyazı və Səs',
            'nav.copyright': 'Məzmun Aşkarlanması',
            'nav.settings': 'Ayarlar',
            'nav.analyticsOverview': 'Analytics - Ümumi Baxış',
            'nav.analyticsContent': 'Analytics - Məzmun',
            'nav.analyticsAudience': 'Analytics - Auditoriya',
            'nav.analyticsRevenue': 'Analytics - Gəlir',
            'toast.openAnalytics': '⚠️  Əvvəlcə Analytics səhifəsini açın',
            'toast.modalOpening': '🎨  Fərdiləşdirmə modalı açılır…'
        }
    };

    let currentLang = 'tr';

    function t(key) {
        return translations[currentLang]?.[key] || translations.tr[key] || key;
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
    }

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

    function getNavOptions() {
        return [
            { value: 'none',                label: t('shortcuts.unassigned') },
            { value: '_g_main',             label: t('nav.mainMenu'),              disabled: true },
            { value: 'dashboard',           label: t('nav.dashboard') },
            { value: 'content-videos',      label: t('nav.contentVideos') },
            { value: 'content-shorts',      label: t('nav.contentShorts') },
            { value: 'comments',            label: t('nav.comments') },
            { value: 'monetization',        label: t('nav.monetization') },
            { value: 'customization',       label: t('nav.customization') },
            { value: 'audio-library',       label: t('nav.audioLibrary') },
            { value: 'subtitles',           label: t('nav.subtitles') },
            { value: 'copyright',           label: t('nav.copyright') },
            { value: 'settings',            label: t('nav.settings') },
            { value: '_g_analytics',        label: t('nav.analytics'),             disabled: true },
            { value: 'analytics',           label: t('nav.analyticsOverview') },
            { value: 'analytics-content',   label: t('nav.analyticsContent') },
            { value: 'analytics-audience',  label: t('nav.analyticsAudience') },
            { value: 'analytics-revenue',   label: t('nav.analyticsRevenue') },
        ];
    }

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
    // Ok butonuna tıklanınca sayfa içi BYS_OPEN_GRAPH_MODAL tetiklenir
    // ══════════════════════════════════════════════════════════════════════

    const btnOpenColors = document.getElementById('btn-open-colors');

    btnOpenColors?.addEventListener('click', async (e) => {
        e.stopPropagation();
        const onStudio = await isOnStudio();
        if (!onStudio) {
            showToast(t('toast.openAnalytics'));
            return;
        }
        await sendToActiveTab({ type: 'BYS_OPEN_GRAPH_MODAL' });
        showToast(t('toast.modalOpening'));
    });

    // ══════════════════════════════════════════════════════════════════════
    // KART 2 — Klavye Kısayolları (inline panel)
    // ══════════════════════════════════════════════════════════════════════

    let shortcutSettings = { ...DEFAULTS.shortcuts };
    let shortcutsExpanded = false;

    const cardShortcuts = document.getElementById('card-shortcuts');
    const shortcutsPanel = document.getElementById('shortcuts-panel');
    const shortcutsList = document.getElementById('shortcuts-list');
    const btnExpandShortcuts = document.getElementById('btn-expand-shortcuts');

    btnExpandShortcuts?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleShortcutsPanel();
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
        const navOptions = getNavOptions();

        navOptions.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.value;

            const isGroupHeader = opt.disabled;
            const isAssignedElsewhere = assigned.has(opt.value);

            if (isGroupHeader) {
                o.textContent = opt.label;
                o.disabled = true;
                o.className = 'opt-group-header';
            } else if (isAssignedElsewhere) {
                o.textContent = `${opt.label} ${t('shortcuts.inUse')}`;
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
                                    cb.textContent = t('shortcuts.removed');
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
        showToast(t('shortcuts.loaded'));
    });

    // ── Yükle ─────────────────────────────────────────────────────────────

    async function loadShortcuts() {
        const data = await storageGet(['shortcuts']);
        shortcutSettings = data.shortcuts || { ...DEFAULTS.shortcuts };
        renderShortcuts();
    }

    // ══════════════════════════════════════════════════════════════════════
    // TOGGLE SWITCH — 5 Özellik için aç/kapa sistemi
    // ══════════════════════════════════════════════════════════════════════

    const TOGGLE_DEFS = [
        { id: 'toggle-graphColors',    feature: 'graphColors',    cardId: 'card-colors' },
        { id: 'toggle-shortcuts',      feature: 'shortcuts',      cardId: 'card-shortcuts' },
        { id: 'toggle-currencyPicker', feature: 'currencyPicker', cardId: 'card-currency' },
        { id: 'toggle-tooltip',        feature: 'tooltip',        cardId: 'card-tooltip' },
        { id: 'toggle-logoutGuard',    feature: 'logoutGuard',    cardId: 'card-logoutGuard' }
    ];

    let featureToggles = {
        graphColors: true,
        shortcuts: true,
        currencyPicker: true,
        tooltip: true,
        logoutGuard: true
    };

    async function loadToggles() {
        const data = await storageGet(['featureToggles']);
        if (data.featureToggles) {
            featureToggles = Object.assign({
                graphColors: true,
                shortcuts: true,
                currencyPicker: true,
                tooltip: true,
                logoutGuard: true
            }, data.featureToggles);
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
    // Dil Seçici
    // ══════════════════════════════════════════════════════════════════════

    const langSelect = document.getElementById('lang-select');

    async function loadLanguage() {
        const data = await storageGet(['language']);
        if (data.language && translations[data.language]) {
            currentLang = data.language;
        } else {
            // Tarayıcı diline göre otomatik seçim
            const browserLang = navigator.language?.toLowerCase().split('-')[0];
            currentLang = (browserLang === 'az') ? 'az' : 'tr';
        }
        if (langSelect) langSelect.value = currentLang;
        applyTranslations();
    }

    langSelect?.addEventListener('change', async () => {
        currentLang = langSelect.value;
        await storageSet({ language: currentLang });
        applyTranslations();
        renderShortcuts(); // Kısayol seçeneklerini yeniden render et

        // YouTube Studio sekmesini yenile — yeni dil için content script yeniden başlasın
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.url?.includes('studio.youtube.com')) {
                chrome.tabs.reload(tab.id);
            }
        } catch (e) { /* sessiz hata */ }
    });

    // ══════════════════════════════════════════════════════════════════════
    // Başlangıç
    // ══════════════════════════════════════════════════════════════════════

    await loadLanguage();
    await loadShortcuts();
    await loadToggles();
    initToggles();
})();
