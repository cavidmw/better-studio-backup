// BYS Collections - Configuration
// Namespace: window.BYS.Collections.Config

window.BYS = window.BYS || {};
window.BYS.Collections = window.BYS.Collections || {};

window.BYS.Collections.Config = (() => {
  // YouTube Data API v3 key
  const YOUTUBE_API_KEY = 'AIzaSyA1bCbiS0WCRLfOsw7NkLbPXTcU0_1pUBs';

  // API endpoints
  const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

  // Cache settings
  const CACHE_DURATION = 1000 * 60 * 30; // 30 dakika

  // Batch request settings
  const MAX_BATCH_SIZE = 50; // YouTube API max 50 ID per request

  // 3D Folder Icon — BYS kırmızı tema (mavi → kırmızı dönüşümü)
  const FOLDER_3D_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="48" height="48">
    <defs>
      <linearGradient id="folderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ff3030"/>
        <stop offset="50%" style="stop-color:#ff1a1a"/>
        <stop offset="100%" style="stop-color:#cc0000"/>
      </linearGradient>
      <linearGradient id="folderTabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ff6666"/>
        <stop offset="100%" style="stop-color:#ff3030"/>
      </linearGradient>
      <linearGradient id="folderFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ff1a1a"/>
        <stop offset="100%" style="stop-color:#b30000"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.25"/>
      </filter>
    </defs>
    <rect x="16" y="28" width="96" height="72" rx="8" ry="8" fill="url(#folderGrad)" filter="url(#shadow)"/>
    <path d="M16 36 L16 28 Q16 24 20 24 L48 24 Q52 24 54 28 L58 36 Z" fill="url(#folderTabGrad)"/>
    <rect x="16" y="40" width="96" height="60" rx="6" ry="6" fill="url(#folderFrontGrad)"/>
    <rect x="20" y="44" width="88" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/>
    <rect x="20" y="52" width="60" height="2" rx="1" fill="rgba(255,255,255,0.15)"/>
    <rect x="20" y="58" width="40" height="2" rx="1" fill="rgba(255,255,255,0.1)"/>
  </svg>`;

  // Small version for buttons (20x20)
  const FOLDER_3D_ICON_SMALL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="20" height="20">
    <defs>
      <linearGradient id="fg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ff3030"/>
        <stop offset="100%" style="stop-color:#cc0000"/>
      </linearGradient>
      <linearGradient id="fg2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ff1a1a"/>
        <stop offset="100%" style="stop-color:#b30000"/>
      </linearGradient>
    </defs>
    <rect x="16" y="28" width="96" height="72" rx="8" fill="url(#fg1)"/>
    <path d="M16 36 L16 28 Q16 24 20 24 L48 24 Q52 24 54 28 L58 36 Z" fill="#ff6666"/>
    <rect x="16" y="40" width="96" height="60" rx="6" fill="url(#fg2)"/>
    <rect x="20" y="44" width="88" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/>
  </svg>`;

  return {
    YOUTUBE_API_KEY,
    YOUTUBE_API_BASE,
    CACHE_DURATION,
    MAX_BATCH_SIZE,
    FOLDER_3D_ICON,
    FOLDER_3D_ICON_SMALL
  };
})();
