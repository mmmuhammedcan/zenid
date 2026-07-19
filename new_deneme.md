# Doc Toolkit — Yeniden Önceliklendirme: Overlay Editörü + CV Oluşturucu

## Context (neden bu değişiklik)

Foto→PDF (OCR) hattı üzerinde ciddi zaman harcandı; gerçek dünya testlerinde (yoğun akademik
metin, spiral defter, sohbet ekran görüntüsü) OCR tabanlı "yeniden dizim" yaklaşımı kırılgan çıktı
(üst üste binen metin, yanlış okumalar). Kullanıcı bilinçli olarak bu hattı **olduğu gibi bırakmaya**
("basit aşamada kalsın") ve enerjiyi çok daha güvenilir, gerçek hedef kitleye (öğrenciler, staj/iş
evrakı hazırlayanlar) doğrudan hizmet eden özelliklere kaydırmaya karar verdi:

1. Yüklenen bir PDF'te (staj evrakı gibi) boşlukları doldurma
2. Elektronik imza atma — imzanın **tutarlı şekilde saklanıp** tekrar kullanılabilmesi
3. PDF'e fotoğraf/vesikalık yerleştirme (Canva tarzı)
4. (Sonraki sprint) CV/özgeçmiş oluşturucu — şablon + form → temiz PDF

Portfolyo sitesi oluşturucu, CV analizörü ve mobil uygulama kullanıcı tarafından **bilinçli olarak
sonraki fazlara** ertelendi — şimdi kapsam dışı.

Kritik mimari içgörü: staj evrakı gibi gerçek belgeler (daha önce test edilen ODTÜ formu) **AcroForm
alanı olmayan düz/taranmış PDF'ler**. Yani "form doldurma" aslında "PDF üzerinde istediğin yere
tıkla, metin yaz" demek — tam olarak imza ve fotoğraf yerleştirmeyle aynı mekanizma. Orijinal
CLAUDE.md mimarisi bunu zaten öngörmüştü ("İmza ekleme ve foto/vesikalık yerleştirme aynı alt yapıyı
paylaşır"). Bu üçünü **tek bir "Overlay Editörü" özelliğinde** birleştiriyoruz.

İmza saklama için kullanıcı hesap sistemi yerine **tarayıcı localStorage** seçildi — sıfır backend
karmaşıklığı, hesap/login yok. Cihaz değişince imza kaybolur ama bu kabul edilebilir (ileride ödeme
sistemiyle birlikte gerçek hesaba geçilebilir).

## Yaklaşım

### 1. Backend: Overlay modülü (form doldurma + imza + fotoğraf — tek mekanizma)

**Yeni dosya:** `backend/modules/overlay.py`
- `PyMuPDF` (fitz) kullanılır — hem PDF sayfalarını önizleme için PNG'ye render eder hem de üzerine
  metin/görüntü basar, tek kütüphane ile ikisi de karşılanır (CLAUDE.md'de zaten önerilmişti).
- `render_pages(pdf_bytes) -> list[bytes]` — her sayfayı PNG olarak döner (frontend'de üstüne
  tıklanabilir önizleme için).
- `get_page_sizes(pdf_bytes) -> list[tuple[float, float]]` — her sayfanın gerçek PDF nokta
  boyutu (frontend'in piksel tıklama koordinatını PDF koordinatına çevirmesi için gerekli).
- `apply_overlay(pdf_bytes, items: list[OverlayItem]) -> bytes` — her item için `page.insert_text()`
  (metin) ya da `page.insert_image()` (imza/fotoğraf, base64 PNG) çağırır, sonucu döner.
- `OverlayItem`: `{page: int, x: float, y: float, kind: "text"|"image", content: str, font_size: int|None}`
  (dataclass olarak tanımlanacak).
- AcroForm otomatik alan tespiti **kapsam dışı** — overlay yaklaşımı hem düz hem interaktif PDF'lerde
  aynı şekilde çalışır, ekstra karmaşıklık gerekmiyor.

**facade.py'a eklenecek:**
- `DocFacade.render_pdf_pages(pdf_bytes) -> Result` (önizleme + koordinat bilgisi)
- `DocFacade.apply_overlay(pdf_bytes, items) -> Result`

**main.py'a eklenecek endpoint'ler:**
- `POST /api/pdf/preview` — PDF yükle, sayfa görüntüleri + boyutları dön
- `POST /api/pdf/overlay` — PDF + overlay item listesi (JSON) yükle, düzenlenmiş PDF dön

### 2. Frontend: Overlay Editörü sayfası

**Yeni dosya:** `frontend/editor.html` (mevcut `index.html` deseniyle aynı — vanilla JS, sade)
- PDF yükle → backend'den sayfa görüntülerini al → `<img>` üzerinde tıklanan piksel koordinatını
  gerçek PDF koordinatına çevir (ölçek oranı: `pdf_point = pixel * (page_width_pt / img_width_px)`)
- Tıklanan yere: (a) serbest metin kutusu YA DA (b) kayıtlı imza/fotoğraf yerleştirme seçeneği
- **İmza:** ilk kullanımda çiz/yükle → `localStorage.setItem('signature', dataURL)` → sonraki
  ziyaretlerde otomatik hazır, tek tıkla yerleştir
- Tüm yerleştirilen öğeler biriktirilir → "Kaydet" → `/api/pdf/overlay`'e gönderilir → PDF indirilir

### 3. Backend + Frontend: CV Oluşturucu (bu planın 2. sprinti, overlay editöründen sonra)

**Yeni dosya:** `backend/modules/cv_builder.py`
- `WeasyPrint` (HTML/CSS → pixel-perfect PDF) + `Jinja2` şablon — Canva'nın yaptığına en yakın,
  gerçek OCR/CV karmaşıklığı yok, sadece temiz veri → şablon → PDF.
- Tek, profesyonel görünümlü bir şablonla başla (kalite > çeşitlilik, kullanıcının isteği bu yönde).
- `generate_cv_pdf(data: dict) -> bytes`

**facade.py:** `DocFacade.generate_cv_pdf(data: dict) -> Result`

**main.py:** `POST /api/cv` — JSON form verisi al, PDF dön

**Yeni dosya:** `frontend/cv-builder.html` — ad-soyad, iletişim, deneyim (tekrarlanabilir), eğitim
(tekrarlanabilir), yetenekler alanlarından oluşan form.

### 4. requirements.txt eklemeleri
```
PyMuPDF==1.24.11
weasyprint==63.1
Jinja2==3.1.4
```

### 5. CLAUDE.md güncellemesi
Sprint tablosu yeniden önceliklendirilecek:
- Sprint A (şimdi): Overlay Editörü — form doldurma + e-imza + fotoğraf yerleştirme (tek özellik)
- Sprint B: CV/Özgeçmiş Oluşturucu
- Ertelenen/gelecek fazlar bölümüne not düşülecek: Portfolyo sitesi oluşturucu, CV analizörü
  (gerçek LLM gerektirir — ayrı maliyet/mimari konuşması), mobil uygulama, ödeme entegrasyonu +
  kullan-kadar-öde/aylık abonelik modeli (Sprint 7'de zaten planlıydı, korunuyor)
- Foto→PDF/OCR hattına dokunulmuyor, "yeterince iyi" olarak bırakılıyor

## Doğrulama
Mevcut sprint boyunca kullanılan yöntemle aynı: `uvicorn` arka planda başlat, `curl` ile multipart
istek at, üretilen PDF'i `pdftoppm` ile PNG'ye render edip görsel olarak kontrol et.
- Overlay: örnek bir PDF'e bilinen bir (x,y) koordinatına metin ve örnek bir imza görüntüsü yerleştir,
  render edilen sayfada doğru konumda göründüğünü doğrula.
- CV oluşturucu: örnek form verisiyle PDF üret, tüm alanların (ad, iletişim, deneyim, eğitim,
  yetenekler) doğru şekilde göründüğünü doğrula.
