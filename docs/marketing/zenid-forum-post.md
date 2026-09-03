# ZenID — Bölüm Forumu / WhatsApp Paylaşım Metni

Hedef: CEng bölümü forumu + WhatsApp grubu. Maks ~3 dakika okuma.
Kişisel paylaşım tonu, kurumsal reklam değil.

---

## Versiyon 1 (önerilen — samimi, teknik detaya girmeden)

**Selam arkadaşlar,**

Bir süredir üzerinde çalıştığım bir projeyi paylaşmak istedim: **ZenID**
(getzenid.com). Kısaca ne yaptığını anlatayım, işinize yarayabilir.

**Ne yapıyor?**
Özgeçmiş (CV) ve portfolyo hazırlama aracı. Ama klasik "şablon doldur"
mantığında değil — bilgilerini bir kere giriyorsun, oradan hem ATS-uyumlu
(başvuru sistemlerinin okuyabildiği, format hatası vermeyen) bir PDF CV
hem de kişisel bir portfolyo sitesi çıkarabiliyorsun. Tamamen tarayıcıda
çalışıyor, hesap açmana gerek yok, verilerin bilgisayarından çıkmıyor.

**AI ile konuşarak CV yazma (asıl eğlenceli kısım)**
Geçen hafta buna bir de MCP sunucusu ekledim (`zenid-mcp`, npm'de
yayında, ücretsiz). Claude Desktop veya Claude Code kullanıyorsanız,
CV'nizi açık bırakıp direkt konuşarak düzenleyebiliyorsunuz:

> "Şu şirkette şunu yaptım, şöyle bir sonuç aldık, bunu bullet point'e
> çevir" diyorsunuz, o da düzgün bir cümleye çeviriyor.

> "Şu iş ilanına göre CV'mi kontrol et" diyorsunuz, gerçek ATS parsing
> kurallarına göre (eksik tarih, tutarsız format, eksik iletişim bilgisi
> gibi) bir skor veriyor ve ne eksik söylüyor.

Önemli olan şu: hiçbir şeyi uydurmuyor. Bir şirket adını, tarihi ya da
unvanını değiştirmesini istediğinizde bunu reddediyor ve "bu bir olgu
değişikliği, ayrı bir onay gerektirir" diyor — sadece ifadeyi
(wording'i) değiştirebiliyor, gerçekleri değil. Yani sizin adınıza
uydurma bir şey yazmıyor.

**Kurulumu (2 dakika):**
```
npx zenid-mcp
```
Claude Desktop config'ine bunu ekleyip restart atmanız yeterli, detaylar
npm sayfasında (npmjs.com/package/zenid-mcp) yazıyor.

**Portfolyo ve diğer özellikler:**
- `/portfolio` — mezuniyet projesi, staj deneyimi gibi şeyleri göstermek
  için hazır, responsive bir kişisel site şablonu. ZIP olarak indirip
  istediğiniz yere (GitHub Pages, kendi domaininiz vb.) yükleyebiliyorsunuz.
- `/editor` — PDF üzerinde form doldurma/imzalama için ayrı bir küçük araç
  (ZenPDF), staj sözleşmesi gibi formları uğraşmadan doldurmak için.

Açık kaynak, MIT lisanslı. Beğenen olursa geri bildirim çok kıymetli
olur, ya da direkt katkı da atabilirsiniz: github.com/mmmuhammedcan/zenid

---

## Versiyon 2 (daha kısa, WhatsApp için — Versiyon 1'in özeti)

**Bir proje paylaşmak istedim: ZenID (getzenid.com) 🎓**

CV + portfolyo hazırlama aracı, tamamen tarayıcıda çalışıyor, hesap yok,
verilerin çıkmıyor.

Asıl güzel kısmı: `npx zenid-mcp` ile Claude'a bağlayıp CV'nizi
**konuşarak** düzenleyebiliyorsunuz — "şunu yaptım, bullet'a çevir" ya
da "şu iş ilanına göre kontrol et" diyorsunuz, gerçek ATS kurallarına
göre skor + öneri alıyorsunuz. Ve önemlisi: şirket adı/tarih gibi
gerçekleri asla uydurmuyor, sadece izin verdiğiniz kısmı (ifadeyi)
düzenliyor.

Ücretsiz, açık kaynak. Bi bakın derim: getzenid.com

Kurulum: npmjs.com/package/zenid-mcp
Repo: github.com/mmmuhammedcan/zenid

---

## Notlar

- Versiyon 1 forum için (daha fazla bağlam okuyabilecekleri yer),
  Versiyon 2 WhatsApp için (kaydırıp geçmeden önce okuyabilecekleri
  uzunluk).
- "ATS-uyumlu" terimini bölüm arkadaşları muhtemelen biliyor ama yine
  de tek cümlelik açıklama bıraktım (başvuru sistemlerinin okuyabildiği).
- Bilinçli olarak fiyat/ücretsizlik vurgusu sona bırakıldı — CEng
  öğrencisi kitlesi zaten "npm'de, açık kaynak" görünce ücretsiz
  olduğunu anlar, baştan söylemek gereksiz tekrar olurdu.
- İstersen ben ekran görüntüsü/gif önerisi de ekleyebilirim (örneğin
  Elif senaryosundaki %57→%100 skor artışının ekran görüntüsü) —
  forum postlarında görsel olan çok daha fazla tıklanıyor.
