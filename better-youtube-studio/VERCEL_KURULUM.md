git add .
git commit -m "API eklendi ve README duzeltildi"
git push origin main# Vercel Çeviri API Kurulum Rehberi

Bu rehber, YouTube Studio yorum çevirisi için ücretsiz Vercel backend'i nasıl kuracağını adım adım anlatıyor.

---

## 1. Vercel Hesabı Aç

1. [vercel.com](https://vercel.com) adresine git
2. "Sign Up" butonuna tıkla
3. GitHub hesabınla giriş yap (en kolay yol)

---

## 2. Yeni Proje Oluştur

1. Vercel panelinde "Add New" → "Project" tıkla
2. "Import Git Repository" yerine **"Import Third-Party Git Repository"** seç
3. Veya direkt boş proje için: Sol menüden "New Project" → "Clone Template" → "Other" seç

**Alternatif (daha kolay):**
1. GitHub'da yeni bir repo oluştur (örn: `translate-api`)
2. Aşağıdaki dosyaları bu repo'ya ekle
3. Vercel'de bu repo'yu import et

---

## 3. API Dosyasını Oluştur

Projende şu klasör yapısını oluştur:

```
api/
  translate.js
```

`api/translate.js` dosyasının içeriği:

```javascript
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, targetLang = 'tr' } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Google Translate ücretsiz API (unofficial)
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Çeviri sonucunu parse et
        let translatedText = '';
        if (data && data[0]) {
            for (const part of data[0]) {
                if (part[0]) {
                    translatedText += part[0];
                }
            }
        }

        return res.status(200).json({ 
            translatedText,
            originalText: text,
            targetLang 
        });

    } catch (error) {
        console.error('Translation error:', error);
        return res.status(500).json({ error: 'Translation failed' });
    }
}
```

---

## 4. Deploy Et

1. Dosyaları GitHub repo'na push et
2. Vercel otomatik olarak deploy edecek
3. Deploy bitince sana bir URL verilecek, örnek:
   - `https://translate-api-abc123.vercel.app`

---

## 5. URL'yi Eklentiye Ekle

1. Eklenti klasöründe şu dosyayı aç:
   ```
   src/features/commentTranslator/commentTranslator.js
   ```

2. En üstteki bu satırı bul:
   ```javascript
   const TRANSLATE_API_URL = 'https://YOUR-VERCEL-APP.vercel.app/api/translate';
   ```

3. `YOUR-VERCEL-APP` kısmını kendi Vercel URL'inle değiştir:
   ```javascript
   const TRANSLATE_API_URL = 'https://translate-api-abc123.vercel.app/api/translate';
   ```

---

## 6. Chrome Eklentisini Yenile

1. Chrome'da `chrome://extensions` adresine git
2. "Better YouTube Studio" eklentisini bul
3. Sağ alttaki yenile (↻) ikonuna tıkla

---

## 7. Test Et

1. [YouTube Studio](https://studio.youtube.com) aç
2. Sol menüden "Yorumlar" sayfasına git
3. Herhangi bir yorumun yanında **"TR'ye Çevir"** butonunu gör
4. Butona tıkla ve çevirinin geldiğini kontrol et

---

## Sorun Giderme

### "Hata!" mesajı alıyorum
- Vercel URL'ini doğru yapıştırdığından emin ol
- Vercel panelinde "Deployments" sekmesinden son deploy'un başarılı olduğunu kontrol et

### Buton görünmüyor
- Sayfayı yenile (F5)
- Eklentiyi yeniden yükle
- Yorumlar sayfasında olduğundan emin ol

### Çeviri çalışmıyor
- Tarayıcı konsolunu aç (F12 → Console)
- Kırmızı hata mesajlarını kontrol et
- Vercel Functions loglarını kontrol et (Vercel paneli → Logs)

---

## Notlar

- Bu çözüm **tamamen ücretsiz**
- Google Translate'in unofficial API'sini kullanıyor
- Vercel'in ücretsiz planı aylık 100.000 istek veriyor (fazlasıyla yeterli)
- API anahtarı gerektirmiyor
