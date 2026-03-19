/**
 * BYS.Storage — chrome.storage.sync için promise tabanlı yardımcılar
 */
window.BYS = window.BYS || {};

window.BYS.Storage = (function () {
  // YouTube Studio'nun orijinal grafik renkleri
  const YOUTUBE_DEFAULT_COLORS = {
    primary: '#3ea6ff',
    favorites: []
  };

  const DEFAULTS = {
    graphColors: {
      primary: '#ff6b35',
      favorites: []
    },
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
    },
    featureToggles: {
      graphColors: true,
      shortcuts: true,
      currencyPicker: true,
      tooltip: true,
      logoutGuard: true,
      collections: true
    }
  };

  return {
    DEFAULTS,
    YOUTUBE_DEFAULT_COLORS,

    /**
     * YouTube'un orijinal grafik renklerini döndür
     */
    getYouTubeDefaults() {
      return { ...YOUTUBE_DEFAULT_COLORS };
    },

    /**
     * chrome.storage.sync'ten veri oku
     * @param {string|string[]|null} keys - null ise tüm veriler döner
     */
    get(keys) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(keys, (data) => {
          resolve(data || {});
        });
      });
    },

    /**
     * chrome.storage.sync'e veri yaz
     * @param {object} data
     */
    set(data) {
      return new Promise((resolve) => {
        chrome.storage.sync.set(data, resolve);
      });
    },

    /**
     * Belirli bir key için default değer ile merge ederek oku
     * @param {string} key - örn: 'graphColors'
     */
    async getKey(key) {
      const data = await this.get([key]);
      return data[key] !== undefined ? data[key] : DEFAULTS[key];
    },

    /**
     * Belirli bir key'in değerini güncelle (merge değil, replace)
     * @param {string} key
     * @param {*} value
     */
    async setKey(key, value) {
      return this.set({ [key]: value });
    },

    /**
     * Tüm ayarları default değerler ile birleştirerek döndür
     */
    async getAll() {
      const data = await this.get(null);
      const result = {};
      for (const key of Object.keys(DEFAULTS)) {
        result[key] = data[key] !== undefined ? data[key] : DEFAULTS[key];
      }
      return result;
    }
  };
})();
