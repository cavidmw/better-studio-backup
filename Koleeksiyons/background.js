// YouTube Collections - Background Service Worker
// Ileride master eklentiye entegrasyon için modüler yapı

chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Collections extension installed');
  
  // Initialize default storage structure
  chrome.storage.local.get(['collections_data'], (result) => {
    if (!result.collections_data) {
      chrome.storage.local.set({
        collections_data: {
          folders: [],
          channels: {},
          settings: {
            animationsEnabled: true
          }
        }
      });
    }
  });
});

// Message handler for future features
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getData') {
    chrome.storage.local.get(['collections_data'], (result) => {
      sendResponse(result.collections_data);
    });
    return true;
  }

  if (request.action === 'openTabs' && Array.isArray(request.urls)) {
    const urls = request.urls.filter(Boolean);
    urls.forEach((url, index) => {
      chrome.tabs.create({
        url,
        active: index === 0
      });
    });

    sendResponse({ success: true, count: urls.length });
    return true;
  }
  
  if (request.action === 'setData') {
    chrome.storage.local.set({ collections_data: request.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
