// BYS Collections - Storage Module
// Namespace: window.BYS.Collections.Storage
// chrome.storage.local kullanır (büyük veri için — sync'in 100KB limiti yetersiz)

window.BYS = window.BYS || {};
window.BYS.Collections = window.BYS.Collections || {};

window.BYS.Collections.Storage = (() => {
  const STORAGE_KEY = 'collections_data';

  // Default data structure
  const defaultData = {
    folders: [],
    channels: {},
    settings: {
      animationsEnabled: true
    }
  };

  // Generate unique ID
  const generateId = () => {
    return 'col_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  };

  // Get all data
  const getData = () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        resolve(result[STORAGE_KEY] || defaultData);
      });
    });
  };

  // Save all data
  const setData = (data) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
        resolve(true);
      });
    });
  };

  // FOLDER OPERATIONS

  const getFolders = async () => {
    const data = await getData();
    return data.folders.sort((a, b) => a.order - b.order);
  };

  const getFolder = async (folderId) => {
    const data = await getData();
    return data.folders.find(f => f.id === folderId);
  };

  const createFolder = async (name, description = '') => {
    const data = await getData();
    const newFolder = {
      id: generateId(),
      name: name,
      description: description,
      order: data.folders.length,
      channels: [],
      createdAt: Date.now()
    };
    data.folders.push(newFolder);
    await setData(data);
    return newFolder;
  };

  const updateFolder = async (folderId, updates) => {
    const data = await getData();
    const folderIndex = data.folders.findIndex(f => f.id === folderId);
    if (folderIndex !== -1) {
      data.folders[folderIndex] = { ...data.folders[folderIndex], ...updates };
      await setData(data);
      return data.folders[folderIndex];
    }
    return null;
  };

  const deleteFolder = async (folderId) => {
    const data = await getData();
    data.folders = data.folders.filter(f => f.id !== folderId);
    data.folders.forEach((f, i) => f.order = i);
    await setData(data);
    return true;
  };

  const reorderFolders = async (folderIds) => {
    const data = await getData();
    folderIds.forEach((id, index) => {
      const folder = data.folders.find(f => f.id === id);
      if (folder) folder.order = index;
    });
    await setData(data);
    return true;
  };

  // CHANNEL OPERATIONS

  const getChannel = async (channelId) => {
    const data = await getData();
    return data.channels[channelId];
  };

  const getChannelsInFolder = async (folderId) => {
    const data = await getData();
    const folder = data.folders.find(f => f.id === folderId);
    if (!folder) return [];
    return folder.channels.map(chId => data.channels[chId]).filter(Boolean);
  };

  const addChannelToFolder = async (folderId, channelInfo) => {
    const data = await getData();
    const folder = data.folders.find(f => f.id === folderId);
    if (!folder) return false;

    data.channels[channelInfo.id] = {
      ...data.channels[channelInfo.id],
      ...channelInfo,
      updatedAt: Date.now()
    };

    if (!folder.channels.includes(channelInfo.id)) {
      folder.channels.push(channelInfo.id);
    }

    await setData(data);
    return true;
  };

  const removeChannelFromFolder = async (folderId, channelId) => {
    const data = await getData();
    const folder = data.folders.find(f => f.id === folderId);
    if (!folder) return false;
    folder.channels = folder.channels.filter(id => id !== channelId);
    await setData(data);
    return true;
  };

  const moveChannelToFolder = async (channelId, fromFolderId, toFolderId) => {
    const data = await getData();
    const fromFolder = data.folders.find(f => f.id === fromFolderId);
    const toFolder = data.folders.find(f => f.id === toFolderId);
    if (!fromFolder || !toFolder) return false;
    fromFolder.channels = fromFolder.channels.filter(id => id !== channelId);
    if (!toFolder.channels.includes(channelId)) {
      toFolder.channels.push(channelId);
    }
    await setData(data);
    return true;
  };

  const reorderChannelsInFolder = async (folderId, channelIds) => {
    const data = await getData();
    const folder = data.folders.find(f => f.id === folderId);
    if (!folder) return false;
    folder.channels = channelIds;
    await setData(data);
    return true;
  };

  const getFoldersContainingChannel = async (channelId) => {
    const data = await getData();
    return data.folders.filter(f => f.channels.includes(channelId));
  };

  // ── Bulk update channels ───────────────────────────────────────────────
  // ★ Strict mapping: each channel is stored under data.channels[channel.id].
  const updateChannelsBulk = async (channelsArray) => {
    if (!channelsArray || !channelsArray.length) return false;
    const data = await getData();
    let updated = false;

    for (const channel of channelsArray) {
      if (!channel || typeof channel.id !== 'string' || !channel.id) {
        console.warn('updateChannelsBulk: skipping entry with missing id', channel);
        continue;
      }
      const existingEntry = data.channels[channel.id] || {};
      data.channels[channel.id] = {
        ...existingEntry,
        id:                 channel.id,
        name:               channel.name               ?? existingEntry.name,
        handle:             channel.handle             ?? existingEntry.handle,
        avatar:             channel.avatar             ?? existingEntry.avatar,
        url:                channel.url                ?? existingEntry.url,
        subscriberCount:    channel.subscriberCount    ?? existingEntry.subscriberCount,
        subscriberCountRaw: channel.subscriberCountRaw ?? existingEntry.subscriberCountRaw,
        videoCount:         channel.videoCount         ?? existingEntry.videoCount,
        viewCount:          channel.viewCount          ?? existingEntry.viewCount,
        updatedAt:          Date.now()
      };
      updated = true;
    }

    if (updated) {
      await setData(data);
    }
    return updated;
  };

  // ── Self-healing: repair handle_* pseudo-IDs in folder.channels arrays ──
  const repairPseudoIds = async (pseudoToRealMap) => {
    if (!pseudoToRealMap || pseudoToRealMap.size === 0) return;
    const data = await getData();
    let changed = false;

    for (const folder of data.folders) {
      if (!Array.isArray(folder.channels)) continue;
      folder.channels = folder.channels.map(entry => {
        const entryId = (typeof entry === 'string') ? entry
                      : (entry && typeof entry.id === 'string') ? entry.id
                      : null;
        if (!entryId) return entry;
        if (pseudoToRealMap.has(entryId)) {
          const realId = pseudoToRealMap.get(entryId);
          changed = true;
          return realId;
        }
        return entry;
      });
    }

    if (changed) {
      await setData(data);
      console.log('BYS Collections: Repaired pseudo-IDs in storage');
    }
  };

  // SETTINGS

  const getSettings = async () => {
    const data = await getData();
    return data.settings;
  };

  const updateSettings = async (updates) => {
    const data = await getData();
    data.settings = { ...data.settings, ...updates };
    await setData(data);
    return data.settings;
  };

  return {
    getData,
    setData,
    generateId,
    getFolders,
    getFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    reorderFolders,
    getChannel,
    getChannelsInFolder,
    addChannelToFolder,
    removeChannelFromFolder,
    moveChannelToFolder,
    reorderChannelsInFolder,
    getFoldersContainingChannel,
    updateChannelsBulk,
    repairPseudoIds,
    getSettings,
    updateSettings
  };
})();
