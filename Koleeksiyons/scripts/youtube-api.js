// YouTube Collections - YouTube Data API Integration
// Kanal bilgilerini çekmek için bulk API istekleri

const YouTubeAPI = (() => {
  // Cache for channel data
  const channelCache = new Map();
  const cacheTimestamps = new Map();

  // Normalize YouTube channel URLs so downstream features can safely reuse them
  const normalizeChannelUrl = (url) => {
    if (!url || typeof url !== 'string') return null;

    const trimmed = url.trim();
    if (!trimmed) return null;

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith('@')) {
      return `https://www.youtube.com/${trimmed}`;
    }

    if (trimmed.startsWith('channel/') || trimmed.startsWith('c/') || trimmed.startsWith('user/')) {
      return `https://www.youtube.com/${trimmed}`;
    }

    if (trimmed.startsWith('youtube.com/') || trimmed.startsWith('www.youtube.com/')) {
      return `https://${trimmed.replace(/^\/+/, '')}`;
    }

    return `https://www.youtube.com/${trimmed.replace(/^\/+/, '')}`;
  };

  // ─── URL builder ────────────────────────────────────────────────────────
  // Rule 1: real channel ID (starts with "UC") → /channel/UCxxx
  // Rule 2: handle or pseudo-ID ("handle_xxx" / "Nathanbluprint") → /@handle
  // customUrl from the API always takes precedence when present.
  const buildChannelUrl = (channelId, customUrl = '') => {
    // API-returned customUrl (e.g. "@nathanbluprint") is the cleanest source
    if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
      const cu = customUrl.trim().replace(/^\/+/, '');
      if (cu.startsWith('@')) return `https://www.youtube.com/${cu}`;
      if (cu.includes('/'))   return `https://www.youtube.com/${cu}`;
      return `https://www.youtube.com/@${cu}`;
    }

    if (!channelId) return null;

    // Rule 1 — real UC channel ID
    if (channelId.startsWith('UC')) {
      return `https://www.youtube.com/channel/${channelId}`;
    }

    // Rule 2 — handle / pseudo-ID ("handle_Nathanbluprint" or bare handle)
    const handle = channelId.startsWith('handle_')
      ? channelId.slice('handle_'.length)   // strip prefix
      : channelId;
    const atHandle = handle.startsWith('@') ? handle : `@${handle}`;
    return `https://www.youtube.com/${atHandle}`;
  };

  // Fetch channel data by IDs (bulk request)
  const getChannelsByIds = async (channelIds) => {
    if (!channelIds || channelIds.length === 0) return [];

    // Filter out cached channels
    const now = Date.now();
    const uncachedIds = [];
    const cachedChannels = [];

    channelIds.forEach(id => {
      const cached = channelCache.get(id);
      const timestamp = cacheTimestamps.get(id);
      
      if (cached && timestamp && (now - timestamp) < CollectionsConfig.CACHE_DURATION) {
        cachedChannels.push(cached);
      } else {
        uncachedIds.push(id);
      }
    });

    // If all cached, return immediately
    if (uncachedIds.length === 0) {
      return cachedChannels;
    }

    // Fetch uncached channels in batches
    const fetchedChannels = await fetchChannelsBatch(uncachedIds);
    
    // Cache the results
    fetchedChannels.forEach(channel => {
      channelCache.set(channel.id, channel);
      cacheTimestamps.set(channel.id, now);
    });

    return [...cachedChannels, ...fetchedChannels];
  };

  // Fetch channels in batches (max 50 per request)
  const fetchChannelsBatch = async (channelIds) => {
    const results = [];
    const batchSize = CollectionsConfig.MAX_BATCH_SIZE;

    for (let i = 0; i < channelIds.length; i += batchSize) {
      const batch = channelIds.slice(i, i + batchSize);
      const batchResults = await fetchChannelsFromAPI(batch);
      results.push(...batchResults);
    }

    return results;
  };

  // Make actual API request
  // ★ STRICT: each result is keyed by item.id — never by array index
  const fetchChannelsFromAPI = async (channelIds) => {
    try {
      const ids = channelIds.join(',');
      const url = `${CollectionsConfig.YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${ids}&key=${CollectionsConfig.YOUTUBE_API_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error('YouTube API error:', response.status);
        return [];
      }

      const data = await response.json();
      if (!data.items || data.items.length === 0) return [];

      // ★ RULE 1 — Build a Map keyed by item.id first, THEN export.
      //   This guarantees that even if the API reorders items,
      //   every channel object carries its OWN id/name/avatar — never
      //   a neighbour's values.
      const resultMap = new Map();

      for (const item of data.items) {
        // ★ RULE 2 — All variables are block-scoped inside this `for` loop.
        //   No shared mutable variable can bleed across iterations.
        const channelId   = item.id;                          // guaranteed unique per item
        const snippet     = item.snippet;
        const statistics  = item.statistics || {};

        const channelObj = {
          id:                 channelId,
          name:               snippet.title,
          handle:             snippet.customUrl
                                ? (snippet.customUrl.startsWith('@')
                                    ? snippet.customUrl
                                    : `@${snippet.customUrl}`)
                                : `@${snippet.title.toLowerCase().replace(/\s+/g, '')}`,
          avatar:             snippet.thumbnails?.medium?.url
                                || snippet.thumbnails?.default?.url
                                || '',
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

  // Format subscriber count (e.g., 1.5M, 500K)
  const formatSubscriberCount = (count) => {
    const num = parseInt(count);
    if (isNaN(num)) return '0';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + ' Mn';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + ' B';
    }
    return num.toString();
  };

  // Get single channel by ID
  const getChannelById = async (channelId) => {
    const channels = await getChannelsByIds([channelId]);
    return channels[0] || null;
  };

  // Extract channel ID from URL
  const extractChannelId = (url) => {
    // Handle different URL formats
    const patterns = [
      /youtube\.com\/channel\/([^\/\?]+)/,
      /youtube\.com\/@([^\/\?]+)/,
      /youtube\.com\/c\/([^\/\?]+)/,
      /youtube\.com\/user\/([^\/\?]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  // Get channel ID from handle (requires search API)
  const getChannelIdFromHandle = async (handle) => {
    try {
      const cleanHandle = handle.replace('@', '');
      const url = `${CollectionsConfig.YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&key=${CollectionsConfig.YOUTUBE_API_KEY}&maxResults=1`;
      
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].snippet.channelId;
      }
      return null;
    } catch (error) {
      console.error('Error getting channel ID from handle:', error);
      return null;
    }
  };

  // Resolve a full channel object from any supported YouTube channel URL
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
      if (channelMatch) {
        channelId = channelMatch[1];
      }

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

      if (!channelId) {
        return null;
      }

      const channel = await getChannelById(channelId);
      if (!channel) return null;

      const canonicalUrl = channel.url || buildChannelUrl(channel.id, channel.handle) || preferredUrl;

      return {
        ...channel,
        handle: channel.handle || handle,
        url: canonicalUrl,
        sourceUrl: normalizedUrl
      };
    } catch (error) {
      console.error('Error resolving channel from URL:', error);
      return null;
    }
  };

  // ─── syncAndStoreAllChannels ───────────────────────────────────────────────
  //
  // ★ RULE 1  Strict key-value mapping: every API item is matched to storage
  //   by its own `item.id` — never by array index or shared mutable state.
  //
  // ★ RULE 2  Block-scoped closures: each channel is processed inside its
  //   own block / Map entry so no value can bleed to a neighbour.
  //
  // ★ RULE 3  Self-healing: "handle_*" pseudo-IDs left by the DOM scraper
  //   are resolved to real UCxxx IDs via the API before updating storage.
  //
  const syncAndStoreAllChannels = async () => {
    try {
      const folders = await CollectionsStorage.getFolders();

      // ── Collect every stored ID (string) from every folder ──────────────
      // folder.channels is always an array of ID *strings* in the schema.
      // Guard against any corrupt object entries that might have crept in.
      const realIds   = new Set(); // UC*** IDs — queryable directly
      const handleIds = new Set(); // handle_xxx pseudo-IDs — need resolution

      for (const folder of folders) {
        if (!Array.isArray(folder.channels)) continue;
        for (const entry of folder.channels) {
          // entry should always be a string ID, but occasionally a full
          // channel object was accidentally pushed — handle gracefully.
          const id = (typeof entry === 'string') ? entry
                   : (entry && typeof entry.id === 'string') ? entry.id
                   : null;
          if (!id) continue;

          if (id.startsWith('handle_')) {
            handleIds.add(id);
          } else {
            realIds.add(id);
          }
        }
      }

      if (realIds.size === 0 && handleIds.size === 0) return;

      console.log(`YouTube Collections: Bulk API sync started — ${realIds.size} real IDs, ${handleIds.size} handle pseudo-IDs`);

      // ── Force-clear cache so we always get fresh API data ───────────────
      clearCache();

      // ── Resolve handle_* pseudo-IDs to real UC IDs ──────────────────────
      const handleResolutionMap = new Map(); // pseudo-id → real UC id
      for (const pseudoId of handleIds) {
        const handleStr = '@' + pseudoId.replace('handle_', '');
        const realId = await getChannelIdFromHandle(handleStr);
        if (realId) {
          handleResolutionMap.set(pseudoId, realId);
          realIds.add(realId);
        }
      }

      if (realIds.size === 0) return;

      // ── Batch-fetch all real IDs (≤50 per API call) ─────────────────────
      const realIdsArray = Array.from(realIds);
      const freshChannels = await getChannelsByIds(realIdsArray);

      // ★ CRITICAL: Build an ID → channelObj lookup map from API results.
      //   This is the single source of truth.  We NEVER use array indices.
      const freshById = new Map();
      for (const ch of freshChannels) {
        // Each ch is already strictly mapped (see fetchChannelsFromAPI above)
        freshById.set(ch.id, ch);
      }

      if (freshById.size === 0) {
        console.warn('YouTube Collections: API returned 0 results during sync');
        return;
      }

      // ── Build the storage update payload ────────────────────────────────
      // For each stored ID, look up the *matching* API entry by that specific
      // ID.  Block-scope each assignment so no value leaks between channels.
      const updates = [];

      for (const storedId of realIds) {
        const freshCh = freshById.get(storedId);
        if (!freshCh) continue; // API returned no data for this ID — skip

        // ★ Block-scoped: every property access belongs to freshCh alone
        const update = {
          id:                 freshCh.id,
          name:               freshCh.name,
          handle:             freshCh.handle,
          avatar:             freshCh.avatar,
          url:                freshCh.url,
          subscriberCount:    freshCh.subscriberCount,
          subscriberCountRaw: freshCh.subscriberCountRaw,
          videoCount:         freshCh.videoCount,
          viewCount:          freshCh.viewCount
        };
        updates.push(update);
      }

      if (updates.length === 0) return;

      // ── Persist to chrome.storage ─────────────────────────────────────────
      await CollectionsStorage.updateChannelsBulk(updates);

      // ── Self-healing: fix handle_* pseudo-IDs in folder.channels arrays ───
      if (handleResolutionMap.size > 0) {
        await CollectionsStorage.repairPseudoIds(handleResolutionMap);
      }

      console.log(`YouTube Collections: Sync complete — ${updates.length} channels updated.`);
    } catch (error) {
      console.error('YouTube Collections: API Sync Error', error);
    }
  };

  // ─── Prefetch all channels from all folders ───────────────────────────
  // Alias kept for backward compatibility; callers should prefer
  // syncAndStoreAllChannels() directly.
  const prefetchAllChannels = () => syncAndStoreAllChannels();

  // Clear cache
  const clearCache = () => {
    channelCache.clear();
    cacheTimestamps.clear();
  };

  // Get cached channel (no API call)
  const getCachedChannel = (channelId) => {
    return channelCache.get(channelId) || null;
  };

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = YouTubeAPI;
}
