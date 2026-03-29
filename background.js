// BYS Background Service Worker
// Koleksiyonlar veri deposu başlatma, mesaj işleme ve sekme açma

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Koleksiyonlar için varsayılan veri yapısını oluştur
    chrome.storage.local.get(['collections_data'], (result) => {
      if (!result.collections_data) {
        chrome.storage.local.set({
          collections_data: {
            folders: [],
            channels: {},
            settings: { animationsEnabled: true }
          }
        });
      }
    });
  }

});

// Mesaj dinleyici
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Collections: Storage okuma
  if (message.action === 'getData') {
    chrome.storage.local.get([message.key || 'collections_data'], (result) => {
      sendResponse({ success: true, data: result[message.key || 'collections_data'] });
    });
    return true; // Asenkron yanıt için
  }

  // Collections: Storage yazma
  if (message.action === 'setData') {
    chrome.storage.local.set({ [message.key || 'collections_data']: message.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  // Collections: Arka planda sekme açma
  if (message.action === 'openTabs') {
    const urls = message.urls || [];
    if (urls.length === 0) {
      sendResponse({ success: true, count: 0 });
      return;
    }

    const openPromises = urls.map(url => {
      return chrome.tabs.create({ url, active: false }).catch(() => {
        return null;
      });
    });

    Promise.all(openPromises).then(tabs => {
      const successCount = tabs.filter(Boolean).length;
      sendResponse({ success: true, count: successCount });
    });

    return true;
  }
});
