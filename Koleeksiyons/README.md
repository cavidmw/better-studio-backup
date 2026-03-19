# YouTube Collections

YouTube içerik üreticileri için rakip kanalları koleksiyonlar halinde organize etmeyi sağlayan Chrome eklentisi.

## Özellikler

- **Koleksiyonlar Sekmesi**: YouTube ana sayfasında "Ana Sayfa" ve "Shorts" sekmelerinin yanında özel "Koleksiyonlar" butonu
- **Klasör Yönetimi**: Klasör oluşturma, düzenleme, silme
- **Kanal Ekleme**: Kanal sayfalarında "Koleksiyona Ekle" butonu
- **Drag & Drop**: Kanalları sürükleyerek sıralama
- **Çoklu Klasör**: Aynı kanalı birden fazla klasöre ekleme
- **Dark Mode**: YouTube'un karanlık temasıyla tam uyum
- **Animasyonlar**: Modern, akıcı ve performanslı animasyonlar

## Kurulum

1. Chrome tarayıcısında `chrome://extensions` adresine gidin
2. Sağ üstten "Geliştirici modu"nu açın
3. "Paketlenmemiş öğe yükle" butonuna tıklayın
4. `Collections` klasörünü seçin

## Kullanım

### Koleksiyonlar Sayfası
1. YouTube ana sayfasına gidin
2. Üst sekmelerde "Koleksiyonlar" butonuna tıklayın
3. "Yeni Klasör" ile klasör oluşturun

### Kanal Ekleme
1. Herhangi bir YouTube kanalına gidin
2. Abone ol butonunun yanındaki "Koleksiyona Ekle" butonuna tıklayın
3. Eklemek istediğiniz klasörü seçin veya yeni klasör oluşturun

### Kanal Yönetimi
- **Taşıma**: Kanal kartındaki "..." menüsünden "Klasöre taşı"
- **Silme**: Kanal kartındaki "..." menüsünden "Kaldır"
- **Sıralama**: Sürükle-bırak ile kanalları yeniden sıralayın

## Teknik Detaylar

- **Manifest Version**: 3
- **Storage**: Chrome Storage API (sync desteği)
- **Framework**: Vanilla JavaScript (bağımlılık yok)

## Dosya Yapısı

```
Collections/
├── manifest.json
├── background.js
├── icons/
├── styles/
│   └── collections.css
└── scripts/
    ├── content.js
    ├── storage.js
    ├── observer.js
    ├── channel-page.js
    └── ui/
        ├── tab-button.js
        ├── collections-view.js
        ├── folder-card.js
        ├── channel-card.js
        ├── channel-list.js
        ├── modals.js
        └── dropdown.js
```

## Master Eklenti Entegrasyonu

Bu eklenti, ileride daha büyük bir eklentinin parçası olarak entegre edilebilir. Global API:

```javascript
window.YouTubeCollections.api.getFolders()
window.YouTubeCollections.api.createFolder(name, description)
window.YouTubeCollections.api.addChannel(folderId, channelInfo)
window.YouTubeCollections.api.showCollections()
window.YouTubeCollections.api.hideCollections()
```

## Lisans

MIT License - Ücretsiz kullanım
