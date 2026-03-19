// BYS Collections - YouTube Data API Integration
// Namespace: window.BYS.Collections.YouTubeAPI

window.BYS = window.BYS || {};
window.BYS.Collections = window.BYS.Collections || {};

window.BYS.Collections.YouTubeAPI = (() => {
  const channelCache = new Map();
  const cacheTimestamps = new Map();

  const normalizeChannelUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('@')) return `https://www.youtube.com/${trimmed}`;
    if (trimmed.startsWith('channel/') || trimmed.startsWith('c/') || trimmed.startsWith('user/')) {
      return `https://www.youtube.com/${trimmed}`;
    }
    if (trimmed.startsWith('youtube.com/') || trimmed.startsWith('www.youtube.com/')) {
      return `https://${trimmed.replace(/^\/+/, '')}`;
    }
    return `https://www.youtube.com/${trimmed.replace(/^\/+/, '')}`;
  };

  const buildChannelUrl = (channelId, customUrl = '') => {
    if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
      const cu = customUrl.trim().replace(/^\/+/, '');
      if (cu.startsWith('@')) return `https://www.youtube.com/${cu}`;
      if (cu.includes('/'))   return `https://www.youtube.com/${cu}`;
      return `https://www.youtube.com/@${cu}`;
    }
    if (!channelId) return null;
    if (channelId.startsWith('UC')) return `https://www.youtube.com/channel/${channelId}`;
    const handle = channelId.startsWith('handle_') ? channelId.slice('handle_'.length) : channelId;
    const atHandle = handle.startsWith('@') ? handle : `@${handle}`;
    return `https://www.youtube.com/${atHandle}`;
  };

  const getChannelsByIds = async (channelIds) => {
    if (!channelIds || channelIds.length === 0) return [];
    const now = Date.now();
    const uncachedIds = [];
    const cachedChannels = [];

    channelIds.forEach(id => {
      const cached = channelCache.get(id);
      const timestamp = cacheTimestamps.get(id);
      if (cached && timestamp && (now - timestamp) < window.BYS.Collections.Config.CACHE_DURATION) {
        cachedChannels.push(cached);
      } else {
        uncachedIds.push(id);
      }
    });

    if (uncachedIds.length === 0) return cachedChannels;
    const fetchedChannels = await fetchChannelsBatch(uncachedIds);
    fetchedChannels.forEach(channel => {
      channelCache.set(channel.id, channel);
      cacheTimestamps.set(channel.id, now);
    });
    return [...cachedChannels, ...fetchedChannels];
  };

  const fetchChannelsBatch = async (channelIds) => {
    const results = [];
    const batchSize = window.BYS.Collections.Config.MAX_BATCH_SIZE;
    for (let i = 0; i < channelIds.length; i += batchSize) {
      const batch = channelIds.slice(i, i + batchSize);
      const batchResults = await fetchChannelsFromAPI(batch);
      results.push(...batchResults);
    }
    return results;
  };

  const fetchChannelsFromAPI = async (channelIds) => {
    try {
      const ids = channelIds.join(',');
      const cfg = window.BYS.Collections.Config;
      const url = `${cfg.YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${ids}&key=${cfg.YOUTUBE_API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error('YouTube API error:', response.status);
        return [];
      }
      const data = await response.json();
      if (!data.items || data.items.length === 0) return [];
      const resultMap = new Map();
      for (const item of data.items) {
        const channelId  = item.id;
        const snippet    = item.snippet;
        const statistics = item.statistics || {};
        const channelObj = {
          id:                 channelId,
          name:               snippet.title,
          handle:             snippet.customUrl
                                ? (snippet.customUrl.startsWith('@')
                                    ? snippet.customUrl
                                    : `@${snippet.customUrl}`)
                                : `@${snippet.title.toLowerCase().replace(/\s+/g, '')}`,
          avatar:             snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
          url:                buildChannelUrl(channelId, snippet.customUrl || ''),
          description:        snippet.description || '',
          subscriberCount:    formatSubscriberCount(statistics.subscriberCount),
          subscriberCountRaw: parseInt(statistics.subscriberCount) || 0,
          videoCount:         statistics.videoCount || '0',
          viewCount:          statistics.viewCount  || '0'
        };
        resultMap.set(channelId, channelObj);
      }
      return Array.from(resultMap.values());
    } catch (error) {
      console.error('YouTube API fetch error:', error);
      return [];
    }
  };

  const formatSubscriberCount = (count) => {
    const num = parseInt(count);
    if (isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + ' Mn';
    if (num >= 1000)    return (num / 1000).toFixed(1).replace(/\.0$/, '') + ' B';
    return num.toString();
  };

  const getChannelById = async (channelId) => {
    const channels = await getChannelsByIds([channelId]);
    return channels[0] || null;
  };

  const extractChannelId = (url) => {
    const patterns = [
      /youtube\.com\/channel\/([^\/\?]+)/,
      /youtube\.com\/@([^\/\?]+)/,
      /youtube\.com\/c\/([^\/\?]+)/,
      /youtube\.com\/user\/([^\/\?]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getChannelIdFromHandle = async (handle) => {
    try {
      const cfg = window.BYS.Collections.Config;
      const cleanHandle = handle.replace('@', '');
      const url = `${cfg.YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&key=${cfg.YOUTUBE_API_KEY}&maxResults=1`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.items && data.items.length > 0) return data.items[0].snippet.channelId;
      return null;
    } catch (error) {
      console.error('Error getting channel ID from handle:', error);
      return null;
    }
  };

  const resolveChannelFromUrl = async (inputUrl) => {
    try {
      const normalizedUrl = normalizeChannelUrl(inputUrl);
      if (!normalizedUrl) return null;
      const parsedUrl = new URL(normalizedUrl);
      const pathname = parsedUrl.pathname.replace(/\/+$/, '');
      let channelId = null;
      let preferredUrl = normalizedUrl.split('?')[0];
      let handle = '';

      const channelMatch = pathname.match(/^\/channel\/(UC[\w-]+)/i);
      if (channelMatch) channelId = channelMatch[1];

      if (!channelId) {
        const handleMatch = pathname.match(/^\/@([\w.-]+)/);
        if (handleMatch) {
          handle = `@${handleMatch[1]}`;
          channelId = await getChannelIdFromHandle(handle);
          preferredUrl = `https://www.youtube.com/${handle}`;
        }
      }

      if (!channelId) {
        const customMatch = pathname.match(/^\/(?:c|user)\/([^/?#]+)/i);
        if (customMatch) {
          handle = customMatch[1];
          channelId = await getChannelIdFromHandle(handle);
        }
      }

      if (!channelId) return null;
      const channel = await getChannelById(channelId);
      if (!channel) return null;
      const canonicalUrl = channel.url || buildChannelUrl(channel.id, channel.handle) || preferredUrl;
      return { ...channel, handle: channel.handle || handle, url: canonicalUrl, sourceUrl: normalizedUrl };
    } catch (error) {
      console.error('Error resolving channel from URL:', error);
      return null;
    }
  };

  const syncAndStoreAllChannels = async () => {
    try {
      const Storage = window.BYS.Collections.Storage;
      const folders = await Storage.getFolders();
      const realIds   = new Set();
      const handleIds = new Set();

      for (const folder of folders) {
        if (!Array.isArray(folder.channels)) continue;
        for (const entry of folder.channels) {
          const id = (typeof entry === 'string') ? entry
                   : (entry && typeof entry.id === 'string') ? entry.id
                   : null;
          if (!id) continue;
          if (id.startsWith('handle_')) handleIds.add(id);
          else realIds.add(id);
        }
      }

      if (realIds.size === 0 && handleIds.size === 0) return;
      console.log(`BYS Collections: Bulk API sync — ${realIds.size} real IDs, ${handleIds.size} handle pseudo-IDs`);
      clearCache();

      const handleResolutionMap = new Map();
      for (const pseudoId of handleIds) {
        const handleStr = '@' + pseudoId.replace('handle_', '');
        const realId = await getChannelIdFromHandle(handleStr);
        if (realId) {
          handleResolutionMap.set(pseudoId, realId);
          realIds.add(realId);
        }
      }

      if (realIds.size === 0) return;
      const freshChannels = await getChannelsByIds(Array.from(realIds));
      const freshById = new Map();
      for (const ch of freshChannels) freshById.set(ch.id, ch);

      if (freshById.size === 0) {
        console.warn('BYS Collections: API returned 0 results during sync');
        return;
      }

      const updates = [];
      for (const storedId of realIds) {
        const freshCh = freshById.get(storedId);
        if (!freshCh) continue;
        updates.push({
          id: freshCh.id, name: freshCh.name, handle: freshCh.handle,
          avatar: freshCh.avatar, url: freshCh.url,
          subscriberCount: freshCh.subscriberCount, subscriberCountRaw: freshCh.subscriberCountRaw,
          videoCount: freshCh.videoCount, viewCount: freshCh.viewCount
        });
      }

      if (updates.length === 0) return;
      await Storage.updateChannelsBulk(updates);
      if (handleResolutionMap.size > 0) await Storage.repairPseudoIds(handleResolutionMap);
      console.log(`BYS Collections: Sync complete — ${updates.length} channels updated.`);
    } catch (error) {
      console.error('BYS Collections: API Sync Error', error);
    }
  };

  const prefetchAllChannels = () => syncAndStoreAllChannels();

  const clearCache = () => {
    channelCache.clear();
    cacheTimestamps.clear();
  };

  const getCachedChannel = (channelId) => channelCache.get(channelId) || null;

  return {
    getChannelsByIds,
    getChannelById,
    extractChannelId,
    getChannelIdFromHandle,
    resolveChannelFromUrl,
    prefetchAllChannels,
    syncAndStoreAllChannels,
    clearCache,
    getCachedChannel,
    formatSubscriberCount,
    buildChannelUrl,
    normalizeChannelUrl
  };
})();
