// YouTube Collections - Masthead Button Component
// YouTube ytd-masthead yapısı içinde, center div'inde arama kutusu yanına eklenir
// Glassmorphism/liquid efekti ile modern tasarım

const CollectionsMastheadButton = (() => {
  // 3D Folder icon (small version)
  const folder3DIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="22" height="22" style="flex-shrink: 0;">
    <defs>
      <linearGradient id="mfg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#4FC3F7"/>
        <stop offset="100%" style="stop-color:#0288D1"/>
      </linearGradient>
      <linearGradient id="mfg2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#29B6F6"/>
        <stop offset="100%" style="stop-color:#0277BD"/>
      </linearGradient>
    </defs>
    <rect x="16" y="28" width="96" height="72" rx="8" fill="url(#mfg1)"/>
    <path d="M16 36 L16 28 Q16 24 20 24 L48 24 Q52 24 54 28 L58 36 Z" fill="#81D4FA"/>
    <rect x="16" y="40" width="96" height="60" rx="6" fill="url(#mfg2)"/>
    <rect x="20" y="44" width="88" height="3" rx="1.5" fill="rgba(255,255,255,0.5)"/>
  </svg>`;

  // Handle click
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    CollectionsGlobalModal.open();
  };

  // YouTube native masthead butonu oluştur - Glassmorphism efekti
  const createMastheadButton = () => {
    const container = document.createElement('div');
    container.id = 'ytc-collections-masthead-entry';
    container.className = 'vidiq-scope';
    container.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; margin-right: 14px; margin-left: 4px; max-height: 44px; flex-shrink: 0;';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ytc-masthead-btn';
    
    // 3D ikon + metin
    btn.innerHTML = `${folder3DIcon}<span class="ytc-masthead-btn-text">Koleksiyonlar</span>`;
    
    // Handle clicks
    btn.addEventListener('click', handleClick);
    
    container.appendChild(btn);
    return container;
  };

  // Inject
  const inject = () => {
    if (document.getElementById('ytc-collections-masthead-entry')) {
      return true;
    }

    // Hedef: ytd-masthead içindeki #center div'i (Kullanıcı SS'ine göre vidIQ'nun olduğu yer)
    const centerContainer = document.querySelector('ytd-masthead #container #center');
    if (!centerContainer) return false;

    const btnObj = createMastheadButton();

    // Arama çubuğundan önce (vidIQ gibi) ekle
    if (centerContainer.firstChild) {
      centerContainer.insertBefore(btnObj, centerContainer.firstChild);
    } else {
      centerContainer.appendChild(btnObj);
    }
    return true;
  };

  // Remove
  const remove = () => {
    const el = document.getElementById('ytc-collections-masthead-entry');
    if (el) el.remove();
  };

  // Exists
  const exists = () => {
    return !!document.getElementById('ytc-collections-masthead-entry');
  };

  return {
    inject,
    remove,
    exists
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CollectionsMastheadButton;
}
