# ZenID MCP Handoff

Tarih: 2026-09-03  
Dal: `agent/spec-driven-zenid-baseline`  
Bu belge hazırlanırken HEAD: `2147c84`

## Kısa durum

ZenID MCP, kullanıcının elinde mevcut bir `.zenid` dosyası olmasa bile ajanla konuşarak sıfırdan CV oluşturma akışını destekliyor. Profil bilgileri eklenebiliyor, mekanik ATS denetimi çalıştırılabiliyor, proje `.zenid` olarak kaydedilebiliyor, tekrar açılabiliyor ve ZenID ile aynı üretim yolunu kullanan PDF dışa aktarılabiliyor.

Yerel paket sürümü `zenid-mcp@0.1.1` olarak hazır. Npm kayıt defterinde doğrulanan son genel sürüm `0.1.0`. `0.1.1` yayını, paket sahibinin etkileşimli npm 2FA doğrulamasını gerektiriyor.

## Tamamlanan özellikler

- `zenid_create_project`: Bellekte geçerli schema-v3 ZenID çalışma alanı oluşturur.
- `zenid_add_fact`: Kullanıcının açıkça verdiği domain, beceri, deneyim, proje, başarı, sertifika ve eğitim kayıtlarını ekler.
- `zenid_edit_fact`: Şirket, rol, okul, tarih ve iletişim bilgileri gibi gerçek olguları açık değişiklik kaydıyla düzenler.
- `zenid_validate`: Yapısal doğrulama, mekanik bulgular, öneriler ve yedi eşit kriterden oluşan deterministik ATS skoru döndürür.
- `zenid_resume_playbook`: CV yazımı ve ilana uygunluk konuşması için rehber ve promptlar sağlar.
- CV varyantı, seçim ve sunum metni araçları çalışır.
- `.zenid` kaydetme ve yeniden açma çalışır.
- ATS dostu PDF ve yayın ayarlarıyla sınırlandırılmış portfolyo ZIP’i dışa aktarılabilir.
- MCP toplam 17 araç sunar.

## Önemli davranış ve güvenlik sınırları

- Sunucu yerel stdio üzerinden çalışır ve kullanıcı verisini ağa göndermez.
- MCP yalnızca kullanıcının belirttiği olguları eklemeli, deneyim veya başarı uydurmamalıdır.
- Yeni deneyim, proje ve sertifika kayıtları portfolyoda varsayılan olarak gizli kalır.
- Şemada beceri başına görünürlük olmadığı için yeni beceri eklendiğinde beceriler bölümü varsayılan olarak özel tutulur.
- Ajan portfolyo yayın kapsamını genişletemez. Yalnızca daraltabilir.
- Kaydedilmemiş yeni projelerde hedef dosya yolu açıkça verilmelidir.
- Hedef yolu olmayan kaydetme veya dışa aktarma işlemleri kodlu `NO_TARGET_PATH` hatası döndürür.
- `zenid_validate` gerçek bir işe alım sistemini veya işe alınma ihtimalini simüle etmez. Skor yalnızca belgelenmiş mekanik kriterlerin deterministik ölçümüdür.
- İş ilanına özel değerlendirme, ajanın CV bölümlerini ve ilanı birlikte yorumlamasıyla yapılır. Olmayan deneyim eklenmez.

## Son kabul sonucu

Gerçek, kayıtlı ZenID MCP arayüzü üzerinden uçtan uca akış tekrarlandı:

1. 17 araç listelendi.
2. Sıfırdan schema-v3 çalışma alanı oluşturuldu.
3. Sentetik iletişim, deneyim, beceri ve eğitim bilgileri eklendi.
4. İlk doğrulama üç mekanik bulgu ve `%57` ATS skoru verdi.
5. Alanlar ve tarihler aynı açık MCP düzenleme aracıyla düzeltildi.
6. İkinci doğrulama `valid: true`, sıfır bulgu ve `%100` (`7/7`) verdi.
7. Proje 2.332 baytlık `.zenid` dosyası olarak kaydedildi.
8. 152.898 baytlık, PDF 1.3, tek sayfalık CV üretildi.
9. Arşiv yeniden açıldı ve bir beceri, bir deneyim, bir eğitim kaydı görüldü.
10. Gizlilik varsayımları yeniden açılan projede korundu.

Kabul dosyaları geçicidir ve şurada üretildi:

`$JCODE_SCRATCH_DIR/zenid-final-acceptance/`

## Otomatik doğrulama özeti

- Frontend birim/entegrasyon testleri: `152/152`
- Frontend lint: `0` hata, `0` uyarı
- Production build: başarılı, deploy-output kontrolü geçti
- MCP paket testleri: `10/10`
- Temiz paket/tarball kurulum oturumu: başarılı
- Kök testler: `7/7`
- Kök `test:mcp`: `10/10`
- Chromium E2E: `33` geçti, `1` planlı atlandı
- Firefox E2E: iki bağımsız çalıştırmada da `12` geçti, `2` planlı atlandı
- `.zenid` roundtrip save/restore: başarılı
- Kabul arşivi `unzip -t`: dört girdinin tamamı başarılı
- Kabul PDF’i: geçerli PDF 1.3, tek sayfa

Firefox tekrar doğrulamasının son kanıt commit’i: `2147c84`.

## İlgili dosyalar

- MCP paketi: `packages/zenid-mcp/`
- Paket kullanım dokümanı: `packages/zenid-mcp/README.md`
- MCP araçları: `packages/zenid-mcp/src/tools.js`
- Protokol testleri: `packages/zenid-mcp/test/protocol.test.js`
- Özellik spesifikasyonu: `docs/specs/011-zenid-mcp-plugin/spec.md`
- Uygulama planı: `docs/specs/011-zenid-mcp-plugin/plan.md`
- Görevler: `docs/specs/011-zenid-mcp-plugin/tasks.md`
- Doğrulama kanıtı: `docs/specs/011-zenid-mcp-plugin/evidence.md`
- Karar kayıtları: `docs/decision-log.md`, özellikle D-028, D-029 ve D-030
- Forum metni: `docs/marketing/zenid-forum-post.txt`
- Markdown tanıtım taslağı: `docs/marketing/zenid-forum-post.md`

## Kullanım

Node.js 20 veya üzeri gereklidir.

Doğrudan çalıştırma:

```bash
npx -y zenid-mcp
```

Claude Code kaydı:

```bash
claude mcp add zenid -- npx -y zenid-mcp
```

Yerel geliştirme:

```bash
cd packages/zenid-mcp
npm install
npm test
npm run build
node dist/server.js
```

## Npm `0.1.1` yayın adımı

Kod, paket metadatası ve tarball hazırdır. Yayın, paket sahibi tarafından yapılmalıdır:

```bash
cd packages/zenid-mcp
npm test
npm pack --dry-run
npm publish
```

Npm’in açtığı etkileşimli 2FA doğrulamasını tamamla. OTP’yi hiçbir belgeye,
komuta geçmişine veya commit’e kalıcı olarak yazma. Zorunlu olarak `--otp`
kullanılacaksa kabuk geçmişine düşmeyecek güvenli bir yöntem seç.

Yayından sonra gerçek kayıt defterini doğrula:

```bash
npm view zenid-mcp version
npm view zenid-mcp dist.tarball
```

Ardından temiz bir geçici klasörde gerçek tüketici kurulumu yaparak `npx -y zenid-mcp@0.1.1` veya kurulu binary üzerinden araç listesini ve temel çağrıyı doğrula. Registry `0.1.1` göstermeden belgelerde sürümü yayınlanmış olarak işaretleme.

## Site deploy durumu

Bu çalışmanın ana çıktısı npm MCP paketidir. Yalnızca `packages/zenid-mcp` ve proje belgelerindeki değişiklikler için `getzenid.com` sitesini yeniden deploy etmek gerekmez. Frontend davranışı veya site içeriği ayrıca değiştirilirse normal frontend doğrulama ve deploy akışı uygulanmalıdır.

## Tanıtım materyali

CEng forumuna doğrudan yapıştırılabilir metin:

`docs/marketing/zenid-forum-post.txt`

Metin 352 kelimedir, Markdown başlığı/code fence içermez ve site, npm paketi ile kaynak kod bağlantılarını içerir. Jcode yan panelinde `ZenID Forum Tanıtım Metni` adıyla doğrudan kopyalanabilir olarak da hazırlanmıştır.

## Sonraki mantıklı adımlar

1. Paket sahibi npm 2FA ile `0.1.1` sürümünü yayınlar.
2. Temiz makine/klasör üzerinden npm tüketici kabul testi tekrarlanır.
3. Forum ve WhatsApp duyuruları kullanıcı tarafından paylaşılır.
4. İstenirse Claude Desktop veya Claude Code üzerinde tarihli manuel kabul kontrol listesi tamamlanır.
5. Daha sonraki sürümde, bölüm seçimine göre daha dar ve daha anlaşılır `zenid_add_fact` giriş şemaları değerlendirilebilir. Mevcut uygulama bilinmeyen alanları sessizce yok saymak yerine açıkça reddeder.

## Bilinen açık sınırlar

- `0.1.1` henüz npm’de genel sürüm olarak doğrulanmadı.
- Gerçek Claude Desktop/Claude Code kullanıcı oturumuna ait tarihli manuel kabul kaydı yok. Resmi MCP istemcisi ve kayıtlı Jcode MCP arayüzüyle otomatik/temsilî kabul güçlü biçimde geçti.
- ATS skoru gerçek ATS ürünleriyle korelasyon veya işe alınma tahmini iddiası taşımaz.
- Forum/WhatsApp paylaşımı yapılmadı. Metin hazır ve kullanıcıya teslim edildi.

## Son commit dizisi

- `032ed06` `feat: create ZenID resumes from conversation`
- `af6b5cf` canlı MCP kabul kanıtı
- `df4684e` npm yayın sınırı doğrulaması
- `47cb8e7` Firefox kabul kaydı
- `4304597` bütün sonuç için son MCP kabul tekrarı
- `493828b` forum metni teslim kaydı
- `2147c84` tekrarlanabilir Firefox kabul kanıtı

Bu handoff’tan sonra devam edecek kişi önce `docs/specs/011-zenid-mcp-plugin/evidence.md`, ardından paket README’si ve D-030 kararını okumalıdır.
