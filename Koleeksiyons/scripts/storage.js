// YouTube Collections - Storage Module
// Chrome Storage API wrapper - modüler ve genişletilebilir yapı

const CollectionsStorage = (() => {
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

  // Get all folders
  const getFolders = async () => {
    const data = await getData();
    return data.folders.sort((a, b) => a.order - b.order);
  };

  // Get folder by ID
  const getFolder = async (folderId) => {
    const data = await getData();
    return data.folders.find(f => f.id === folderId);
  };

  // Create new folder
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

  // Update folder
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

  // Delete folder
  const deleteFolder = async (folderId) => {
    const data = await getData();
    data.folders = data.folders.filter(f => f.id !== folderId);
    // Reorder remaining folders
    data.folders.forEach((f, i) => f.order = i);
    await setData(data);
    return true;
  };

  // Reorder folders
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

  // Get channel info
  const getChannel = async (channelId) => {
    const data = await getData();
    return data.channels[channelId];
  };

  // Get channels in folder
  const getChannelsInFolder = async (folderId) => {
    const data = await getData();
    const folder = data.folders.find(f => f.id === folderId);
    if (!folder) return [];
    
    return folder.channels.map(chId => data.channels[chId]).filter(Boolean);
  };

  // Add channel to folder
  const addChannelToFolder = async (folderId, channelInfo) => {
    const data = await getData();
    const folder = data.folders.find(f => f.id === folderId);
    if (!folder) return false;

    // Store/update channel info
    data.channels[channelInfo.id] = {
      ...data.channels[channelInfo.id],
      ...channelInfo,
      updatedAt: Date.now()
    };

    // Add to folder if not already there
    if (!folder.channels.includes(channelInfo.id)) {
      folder.channels.push(channelInfo.id);
    }

    await setData(data);
    return true;
  };

  // Remove channel from folder
  const removeChannelFromFolder = async (folderId, channelId) => {
    const data = await getData();
    const folder = data.folders.find(f => f.id === folderId);
    if (!folder) return false;

    folder.channels = folder.channels.filter(id => id !== channelId);
    await setData(data);
    return true;
  };

  // Move channel to another folder
  const moveChannelToFolder = async (channelId, fromFolderId, toFolderId) => {
    const data = await getData();
    const fromFolder = data.folders.find(f => f.id === fromFolderId);
    const toFolder = data.folders.find(f => f.id === toFolderId);
    
    if (!fromFolder || !toFolder) return false;

    // Remove from source
    fromFolder.channels = fromFolder.channels.filter(id => id !== channelId);
    
    // Add to destination if not already there
    if (!toFolder.channels.includes(channelId)) {
      toFolder.channels.push(channelId);
    }

    await setData(data);
    return true;
  };

  // Reorder channels in folder
  const reorderChannelsInFolder = async (folderId, channelIds) => {
    const data = await getData();
    const folder = data.folders.find(f => f.id === folderId);
    if (!folder) return false;

    folder.channels = channelIds;
    await setData(data);
    return true;
  };

  // Get folders containing a channel
  const getFoldersContainingChannel = async (channelId) => {
    const data = await getData();
    return data.folders.filter(f => f.channels.includes(channelId));
  };

  // ── Bulk update channels ───────────────────────────────────────────────
  // ★ Strict mapping: each channel is stored under data.channels[channel.id].
  //   We NEVER iterate by index — every write is keyed by the channel's own id.
  const updateChannelsBulk = async (channelsArray) => {
    if (!channelsArray || !channelsArray.length) return false;

    const data = await getData();
    let updated = false;

    for (const channel of channelsArray) {
      // ★ Block-scoped: `channel` is the loop variable for this iteration only.
      //   No shared mutable binding can reference a previous channel's data.
      if (!channel || typeof channel.id !== 'string' || !channel.id) {
        console.warn('updateChannelsBulk: skipping entry with missing id', channel);
        continue;
      }

      const existingEntry = data.channels[channel.id] || {};

      // ★ Explicit field merge — never a blind spread of an external object
      //   that could carry stale or mismatched data from a previous iteration.
      data.channels[channel.id] = {
        // Preserve fields we never want to overwrite from the API
        ...existingEntry,
        // API-authoritative fields — always update these
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
  // pseudoToRealMap: Map<'handle_xxx', 'UCxxx'>
  const repairPseudoIds = async (pseudoToRealMap) => {
    if (!pseudoToRealMap || pseudoToRealMap.size === 0) return;

    const data = await getData();
    let changed = false;

    for (const folder of data.folders) {
      if (!Array.isArray(folder.channels)) continue;

      folder.channels = folder.channels.map(entry => {
        // entry may be a pseudo-ID string or a corrupt channel object
        const entryId = (typeof entry === 'string') ? entry
                      : (entry && typeof entry.id === 'string') ? entry.id
                      : null;
        if (!entryId) return entry;

        if (pseudoToRealMap.has(entryId)) {
          const realId = pseudoToRealMap.get(entryId);
          changed = true;
          return realId; // replace pseudo-ID with real UC* ID
        }
        return entry;
      });
    }

    if (changed) {
      await setData(data);
      console.log('YouTube Collections: Repaired pseudo-IDs in storage');
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

  // Public API
  return {
    getData,
    setData,
    generateId,
    // Folders
    getFolders,
    getFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    reorderFolders,
    // Channels
    getChannel,
    getChannelsInFolder,
    addChannelToFolder,
    removeChannelFromFolder,
    moveChannelToFolder,
    reorderChannelsInFolder,
    getFoldersContainingChannel,
    updateChannelsBulk,
    repairPseudoIds,
    // Settings
    getSettings,
    updateSettings
  };
})();

// Export for module systems (future compatibility)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CollectionsStorage;
}
