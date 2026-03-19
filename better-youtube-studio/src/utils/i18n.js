/**
 * BYS.i18n — Language Support (Localization)
 * Supports English (en) and Turkish (tr).
 * Auto-detects browser language + manual override + dynamic storage listener.
 */
window.BYS = window.BYS || {};

window.BYS.i18n = (function () {
    'use strict';

    // ─── Translation Dictionaries ─────────────────────────────────────────────

    const translations = {
        en: {
            // Popup
            'popup.title': 'Better YouTube Studio',
            'popup.desc': 'Professional toolkit that enhances your YouTube Studio experience.',
            'popup.features': 'Features',
            'popup.version': 'v1.0.0',

            // Feature Cards
            'feature.graphColors': 'Graph Colors',
            'feature.graphColors.desc': 'Customize Analytics charts with your personal color.',
            'feature.shortcuts': 'Keyboard Shortcuts',
            'feature.shortcuts.desc': 'Quickly switch between pages with Alt + 1–9.',
            'feature.currencyPicker': 'Currency Picker',
            'feature.currencyPicker.desc': 'Advanced picker auto-activates on Settings › General.',
            'feature.tooltip': 'USD → AZN Tooltip',
            'feature.tooltip.desc': 'Hover over dollar amounts to see AZN equivalent.',
            'feature.logoutGuard': 'Logout Guard',
            'feature.logoutGuard.desc': 'Confirms before signing out to prevent accidental logouts.',
            'feature.collections': 'Collections',
            'feature.collections.desc': 'Organize YouTube channels into folders.',

            // Shortcuts Panel
            'shortcuts.hint': 'Changes are saved instantly.',
            'shortcuts.reset': '↺ Reset to Defaults',
            'shortcuts.unassigned': '— Unassigned —',
            'shortcuts.inUse': '(in use)',
            'shortcuts.removed': '← removed',
            'shortcuts.loaded': '↺ Default shortcuts loaded',

            // Nav Targets
            'nav.mainMenu': '── Main Menu ──',
            'nav.analytics': '── Analytics ──',
            'nav.dashboard': 'Dashboard',
            'nav.contentVideos': 'Content - Videos',
            'nav.contentShorts': 'Content - Shorts',
            'nav.comments': 'Community',
            'nav.monetization': 'Monetization',
            'nav.customization': 'Customization',
            'nav.audioLibrary': 'Audio Library',
            'nav.subtitles': 'Subtitles & Audio',
            'nav.copyright': 'Content Detection',
            'nav.settings': 'Settings',
            'nav.analyticsOverview': 'Analytics - Overview',
            'nav.analyticsContent': 'Analytics - Content',
            'nav.analyticsAudience': 'Analytics - Audience',
            'nav.analyticsRevenue': 'Analytics - Revenue',

            // Graph Colors Modal
            'modal.graphColors.title': 'Customize Graph Colors',
            'modal.graphColors.mainColor': '🎨 Primary Color',
            'modal.graphColors.hint': 'Line chart, 48-hour bars, tooltip and hover point will adopt this color.',
            'modal.graphColors.favorites': '⭐ Favorites',
            'modal.graphColors.addFav': '+ Add',
            'modal.graphColors.noFav': 'No favorite colors yet',
            'modal.graphColors.use': 'Use',
            'modal.graphColors.apply': '✓ Apply & Save',
            'modal.graphColors.cancel': 'Cancel',
            'modal.graphColors.reset': '↺ Reset to Defaults',
            'modal.graphColors.applied': '✅ Color applied!',
            'modal.graphColors.favAdded': '⭐ Added!',
            'modal.graphColors.resetDone': '↺ YouTube default colors loaded',

            // Logout Guard
            'logout.title': 'Sign Out',
            'logout.desc': 'You will be signed out of all Google accounts and may need to sign in again.',
            'logout.cancel': 'Cancel',
            'logout.confirm': 'Continue',

            // Currency Picker
            'currency.search': 'Search… USD, Euro, Turkish lira',
            'currency.noResult': 'No results found.',
            'currency.addFav': 'Add to favorites',
            'currency.removeFav': 'Remove from favorites',
            'currency.showFavOnly': 'Show favorites only',
            'currency.showAll': 'Show all currencies',

            // Toasts
            'toast.openAnalytics': '⚠️  Please open the Analytics page first',
            'toast.modalOpening': '🎨  Customization modal opening…',

            // Settings
            'settings.language': 'Language',
            'settings.languageDesc': 'Extension interface language',

            // Collections UI
            'collections.masthead.btn': 'Collections',
            'collections.modal.title': 'Collections',
            'collections.search.placeholder': 'Search channels...',
            'collections.btn.newFolder': 'New Folder',
            'collections.empty.noFolders': 'No folders yet',
            'collections.empty.noFoldersDesc': 'Create your first folder to organize your channels',
            'collections.empty.noChannels': 'No channels in this folder',
            'collections.empty.noChannelsDesc': 'You can add channels to this folder from channel pages',
            'collections.folder.count': '{{count}} channels',
            'collections.folder.noDesc': 'No description',
            'collections.btn.openAll': 'Open All',
            'collections.btn.edit': 'Edit',
            'collections.btn.delete': 'Delete',
            'collections.btn.move': 'Move',
            'collections.btn.drag': 'Drag',
            'collections.modal.deleteConfirm.title': 'Delete Confirmation',
            'collections.modal.deleteConfirm.folderMsg': 'Are you sure you want to delete the <strong>"{{name}}"</strong> folder?',
            'collections.modal.deleteConfirm.channelMsg': 'Are you sure you want to delete the <strong>"{{name}}"</strong> channel?',
            'collections.modal.deleteConfirm.info': 'This action cannot be undone.',
            'collections.btn.cancel': 'Cancel',
            'collections.btn.confirm': 'Confirm',
            'collections.modal.addFolder.titleNew': 'Create New Folder',
            'collections.modal.addFolder.titleEdit': 'Edit Folder',
            'collections.modal.addFolder.nameLabel': 'Folder Name',
            'collections.modal.addFolder.namePlaceholder': 'e.g. Rival Channels',
            'collections.modal.addFolder.descLabel': 'Description (optional)',
            'collections.modal.addFolder.descPlaceholder': 'Add a short note...',
            'collections.btn.save': 'Save',
            'collections.btn.create': 'Create',
            'collections.modal.moveToFolder.title': 'Move to Folder',
            'collections.empty.noFoldersShort': 'You haven\'t created any folders yet.',
            'collections.modal.addToFolder.title': 'Add to Collection',
            'collections.modal.manualAdd.title': 'Manually Add Channel',
            'collections.modal.manualAdd.urlLabel': 'YouTube Channel Link',
            'collections.modal.manualAdd.urlPlaceholder': 'https://www.youtube.com/@ChannelName',
            'collections.modal.manualAdd.hint': 'You can paste @handle, /channel/ID, /c/, or /user/ links.',
            'collections.btn.add': 'Add',
            'collections.status.adding': 'Adding...',
            'collections.error.emptyUrl': 'Please enter a YouTube channel link.',
            'collections.error.general': 'An error occurred while adding the channel.',
            'collections.error.noResolve': 'Channel resolution infrastructure not found.',
            'collections.error.invalidUrl': 'A valid YouTube channel link could not be found.',
            'collections.error.alreadyInFolder': 'This channel is already in this folder.',
            'collections.status.loading': 'Loading...',
            'collections.search.noResult': 'No results found for "{{query}}"',
            'collections.channel.subscribers': '{{count}} subscribers',
            'collections.channel.unknown': 'Unknown Channel',
            'collections.hint.gotoFolder': 'Go to {{name}} folder',
            'collections.btn.addShort': 'Add to Collection',
            'collections.btn.inCollections': 'In {{count}} collections'
        },

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
            'feature.collections': 'Koleksiyonlar',
            'feature.collections.desc': 'YouTube kanallarını klasörlerde organize edin.',

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
            'settings.languageDesc': 'Eklenti arayüz dili',

            // Collections UI
            'collections.masthead.btn': 'Koleksiyonlar',
            'collections.modal.title': 'Koleksiyonlar',
            'collections.search.placeholder': 'Kanal ara...',
            'collections.btn.newFolder': 'Yeni Klasör',
            'collections.empty.noFolders': 'Henüz klasör yok',
            'collections.empty.noFoldersDesc': 'Kanallarınızı düzenlemek için ilk klasörünüzü oluşturun',
            'collections.empty.noChannels': 'Bu klasörde kanal yok',
            'collections.empty.noChannelsDesc': 'Kanal sayfalarından bu klasöre kanal ekleyebilirsiniz',
            'collections.folder.count': '{{count}} kanal',
            'collections.folder.noDesc': 'Açıklama yok',
            'collections.btn.openAll': 'Tümünü Aç',
            'collections.btn.edit': 'Düzenle',
            'collections.btn.delete': 'Sil',
            'collections.btn.move': 'Taşı',
            'collections.btn.drag': 'Sürükle',
            'collections.modal.deleteConfirm.title': 'Silme Onayı',
            'collections.modal.deleteConfirm.folderMsg': '<strong>"{{name}}"</strong> klasörünü silmek istediğinize emin misiniz?',
            'collections.modal.deleteConfirm.channelMsg': '<strong>"{{name}}"</strong> kanalını silmek istediğinize emin misiniz?',
            'collections.modal.deleteConfirm.info': 'Bu işlem geri alınamaz.',
            'collections.btn.cancel': 'İptal',
            'collections.btn.confirm': 'Onayla',
            'collections.modal.addFolder.titleNew': 'Yeni Klasör Oluştur',
            'collections.modal.addFolder.titleEdit': 'Klasörü Düzenle',
            'collections.modal.addFolder.nameLabel': 'Klasör Adı',
            'collections.modal.addFolder.namePlaceholder': 'Örn: Rakip Kanallar',
            'collections.modal.addFolder.descLabel': 'Açıklama (opsiyonel)',
            'collections.modal.addFolder.descPlaceholder': 'Kısa bir not ekleyin...',
            'collections.btn.save': 'Kaydet',
            'collections.btn.create': 'Oluştur',
            'collections.modal.moveToFolder.title': 'Klasöre Taşı',
            'collections.empty.noFoldersShort': 'Henüz klasör oluşturmadınız.',
            'collections.modal.addToFolder.title': 'Koleksiyona Ekle',
            'collections.modal.manualAdd.title': 'Manuel Kanal Ekle',
            'collections.modal.manualAdd.urlLabel': 'YouTube Kanal Linki',
            'collections.modal.manualAdd.urlPlaceholder': 'https://www.youtube.com/@KanalAdi',
            'collections.modal.manualAdd.hint': '@handle, /channel/ID, /c/ veya /user/ linklerini yapıştırabilirsiniz.',
            'collections.btn.add': 'Ekle',
            'collections.status.adding': 'Ekleniyor...',
            'collections.error.emptyUrl': 'Lütfen bir YouTube kanal linki girin.',
            'collections.error.general': 'Kanal eklenirken bir hata oluştu.',
            'collections.error.noResolve': 'Kanal çözümleme altyapısı bulunamadı.',
            'collections.error.invalidUrl': 'Geçerli bir YouTube kanal linki bulunamadı.',
            'collections.error.alreadyInFolder': 'Bu kanal zaten bu klasörde mevcut.',
            'collections.status.loading': 'Yükleniyor...',
            'collections.search.noResult': '"{{query}}" için sonuç bulunamadı',
            'collections.channel.subscribers': '{{count}} abone',
            'collections.channel.unknown': 'Bilinmeyen Kanal',
            'collections.hint.gotoFolder': '{{name}} klasörüne git',
            'collections.btn.addShort': 'Koleksiyona Ekle',
            'collections.btn.inCollections': '{{count}} koleksiyonda'
        }
    };

    // ─── State ─────────────────────────────────────────────────────────────────

    let currentLang = 'en';

    // ─── Language Detection ──────────────────────────────────────────────────

    function detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage || 'en';
        const lang = browserLang.toLowerCase().split('-')[0];
        
        if (translations[lang]) return lang;
        
        return 'en'; // Default English
    }

    // ─── Dynamic Listener ────────────────────────────────────────────────────
    
    // Listen for language changes in storage from the popup
    try {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync' && changes.language && changes.language.newValue) {
                if (translations[changes.language.newValue]) {
                    currentLang = changes.language.newValue;
                    console.log('BYS i18n: Language updated dynamically to:', currentLang);
                }
            }
        });
    } catch (e) { }

    // ─── Public API ────────────────────────────────────────────────────────────

    return {
        /**
         * Initialize the language system
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
         * Return the current language
         */
        getLang() {
            return currentLang;
        },

        /**
         * Change and save the language
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
         * Get translation
         * @param {string} key - Translation key (e.g. 'popup.title')
         * @param {object} params - Optional variables
         */
        t(key, params = {}) {
            const dict = translations[currentLang] || translations.en;
            let text = dict[key] || translations.en[key] || key;
            
            // Parameter replacement: {{name}} → value
            for (const [k, v] of Object.entries(params)) {
                text = text.replace(new RegExp(`{{${k}}}`, 'g'), v);
            }
            
            return text;
        },

        /**
         * Return supported languages
         */
        getSupportedLanguages() {
            return [
                { code: 'en', name: 'English', nativeName: 'English' },
                { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe' }
            ];
        },

        /**
         * Return all translations (for debug)
         */
        getAllTranslations() {
            return translations;
        }
    };
})();
