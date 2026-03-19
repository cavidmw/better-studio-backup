/**
 * BYS.i18n — Çoklu Dil Desteği (Localization)
 * Türkçe (tr) ve Azerbaycanca (az) destekler.
 * Tarayıcı diline göre otomatik seçim + manuel değiştirme.
 */
window.BYS = window.BYS || {};

window.BYS.i18n = (function () {
    'use strict';

    // ─── Çeviri Sözlükleri ─────────────────────────────────────────────────────

    const translations = {
        tr: {
            // Popup
            'popup.title': 'Better YouTube Studio',
            'popup.desc': 'YouTube Studio deneyimini güçlendiren profesyonel araç seti.',
            'popup.features': 'Özellikler',
            'popup.version': 'v1.0.0',

            // Feature Cards
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

            // Shortcuts Panel
            'shortcuts.hint': 'Değişiklikler anında kaydedilir.',
            'shortcuts.reset': '↺ Varsayılana Dön',
            'shortcuts.unassigned': '— Atanmamış —',
            'shortcuts.inUse': '(kullanılıyor)',
            'shortcuts.removed': '← kaldırıldı',
            'shortcuts.loaded': '↺ Varsayılan kısayollar yüklendi',

            // Nav Targets
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

            // Graph Colors Modal
            'modal.graphColors.title': 'Grafik Renklerini Özelleştir',
            'modal.graphColors.mainColor': '🎨 Ana Renk',
            'modal.graphColors.hint': 'Çizgi grafik, 48 saatlik çubuklar, tooltip ve hover noktası bu renge dönüşür.',
            'modal.graphColors.favorites': '⭐ Favoriler',
            'modal.graphColors.addFav': '+ Ekle',
            'modal.graphColors.noFav': 'Henüz favori renk yok',
            'modal.graphColors.use': 'Kullan',
            'modal.graphColors.apply': '✓ Uygula ve Kaydet',
            'modal.graphColors.cancel': 'İptal',
            'modal.graphColors.reset': '↺ Varsayılana Dön',
            'modal.graphColors.applied': '✅ Renk uygulandı!',
            'modal.graphColors.favAdded': '⭐ Eklendi!',
            'modal.graphColors.resetDone': '↺ YouTube varsayılan renkleri yüklendi',

            // Logout Guard
            'logout.title': 'Oturumu Kapat',
            'logout.desc': 'Tüm Google hesaplarından çıkış yapılacak ve tekrar giriş gerekebilir.',
            'logout.cancel': 'İptal',
            'logout.confirm': 'Devam et',

            // Currency Picker
            'currency.search': 'Ara… USD, Euro, Türk lirası',
            'currency.noResult': 'Sonuç bulunamadı.',
            'currency.addFav': 'Favorilere ekle',
            'currency.removeFav': 'Favorilerden çıkar',
            'currency.showFavOnly': 'Sadece favorileri göster',
            'currency.showAll': 'Tüm para birimlerini göster',

            // Toasts
            'toast.openAnalytics': '⚠️  Önce Analytics sayfasını açın',
            'toast.modalOpening': '🎨  Özelleştirme modalı açılıyor…',

            // Settings
            'settings.language': 'Dil',
            'settings.languageDesc': 'Eklenti arayüz dili'
        },

        az: {
            // Popup
            'popup.title': 'Better YouTube Studio',
            'popup.desc': 'YouTube Studio təcrübənizi gücləndirən peşəkar alət dəsti.',
            'popup.features': 'Xüsusiyyətlər',
            'popup.version': 'v1.0.0',

            // Feature Cards
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

            // Shortcuts Panel
            'shortcuts.hint': 'Dəyişikliklər dərhal yadda saxlanılır.',
            'shortcuts.reset': '↺ Standarta Qayıt',
            'shortcuts.unassigned': '— Təyin edilməyib —',
            'shortcuts.inUse': '(istifadə olunur)',
            'shortcuts.removed': '← silindi',
            'shortcuts.loaded': '↺ Standart qısayollar yükləndi',

            // Nav Targets
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

            // Graph Colors Modal
            'modal.graphColors.title': 'Qrafik Rənglərini Fərdiləşdir',
            'modal.graphColors.mainColor': '🎨 Əsas Rəng',
            'modal.graphColors.hint': 'Xətt qrafiki, 48 saatlıq çubuqlar, tooltip və hover nöqtəsi bu rəngə çevrilir.',
            'modal.graphColors.favorites': '⭐ Favoritlər',
            'modal.graphColors.addFav': '+ Əlavə et',
            'modal.graphColors.noFav': 'Hələ favori rəng yoxdur',
            'modal.graphColors.use': 'İstifadə et',
            'modal.graphColors.apply': '✓ Tətbiq et və Yadda saxla',
            'modal.graphColors.cancel': 'Ləğv et',
            'modal.graphColors.reset': '↺ Standarta Qayıt',
            'modal.graphColors.applied': '✅ Rəng tətbiq edildi!',
            'modal.graphColors.favAdded': '⭐ Əlavə edildi!',
            'modal.graphColors.resetDone': '↺ YouTube standart rəngləri yükləndi',

            // Logout Guard
            'logout.title': 'Hesabdan Çıx',
            'logout.desc': 'Bütün Google hesablarından çıxış ediləcək və yenidən giriş tələb oluna bilər.',
            'logout.cancel': 'Ləğv et',
            'logout.confirm': 'Davam et',

            // Currency Picker
            'currency.search': 'Axtar… USD, Euro, Türk lirəsi',
            'currency.noResult': 'Nəticə tapılmadı.',
            'currency.addFav': 'Favoritlərə əlavə et',
            'currency.removeFav': 'Favoritlərdən çıxar',
            'currency.showFavOnly': 'Yalnız favoritləri göstər',
            'currency.showAll': 'Bütün valyutaları göstər',

            // Toasts
            'toast.openAnalytics': '⚠️  Əvvəlcə Analytics səhifəsini açın',
            'toast.modalOpening': '🎨  Fərdiləşdirmə modalı açılır…',

            // Settings
            'settings.language': 'Dil',
            'settings.languageDesc': 'Əlavə interfeys dili'
        }
    };

    // ─── State ─────────────────────────────────────────────────────────────────

    let currentLang = 'tr';

    // ─── Dil Algılama ──────────────────────────────────────────────────────────

    function detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage || 'tr';
        const lang = browserLang.toLowerCase().split('-')[0];
        
        if (lang === 'az') return 'az';
        if (lang === 'tr') return 'tr';
        
        // Azerbaycan için ek kontroller
        if (browserLang.toLowerCase().includes('az')) return 'az';
        
        return 'tr'; // Varsayılan Türkçe
    }

    // ─── Public API ────────────────────────────────────────────────────────────

    return {
        /**
         * Dil sistemini başlat
         */
        async init() {
            return new Promise((resolve) => {
                try {
                    chrome.storage.sync.get('language', (data) => {
                        if (data && data.language && translations[data.language]) {
                            currentLang = data.language;
                        } else {
                            currentLang = detectBrowserLanguage();
                        }
                        resolve(currentLang);
                    });
                } catch (e) {
                    currentLang = detectBrowserLanguage();
                    resolve(currentLang);
                }
            });
        },

        /**
         * Mevcut dili döndür
         */
        getLang() {
            return currentLang;
        },

        /**
         * Dili değiştir ve kaydet
         */
        async setLang(lang) {
            if (!translations[lang]) return false;
            currentLang = lang;
            try {
                await new Promise(res => chrome.storage.sync.set({ language: lang }, res));
            } catch (e) { }
            return true;
        },

        /**
         * Çeviri al
         * @param {string} key - Çeviri anahtarı (örn: 'popup.title')
         * @param {object} params - Değişken parametreler (opsiyonel)
         */
        t(key, params = {}) {
            const dict = translations[currentLang] || translations.tr;
            let text = dict[key] || translations.tr[key] || key;
            
            // Parametre değiştirme: {{name}} → value
            for (const [k, v] of Object.entries(params)) {
                text = text.replace(new RegExp(`{{${k}}}`, 'g'), v);
            }
            
            return text;
        },

        /**
         * Desteklenen dilleri döndür
         */
        getSupportedLanguages() {
            return [
                { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe' },
                { code: 'az', name: 'Azerbaycanca', nativeName: 'Azərbaycan' }
            ];
        },

        /**
         * Tüm çevirileri döndür (debug için)
         */
        getAllTranslations() {
            return translations;
        }
    };
})();
