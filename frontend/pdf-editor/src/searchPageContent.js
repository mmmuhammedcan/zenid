const origin = "https://getzenid.com";

const page = (definition) => ({
  ...definition,
  canonicalUrl: `${origin}/${definition.path}/`,
});

export const TURKISH_CV_SEARCH_PAGE = page({
  id: "tr-cv-hazirlama",
  path: "tr/cv-hazirlama",
  locale: "tr",
  alternateLocale: "en",
  alternateUrl: `${origin}/en/resume-builder/`,
  title: "Ücretsiz CV Hazırlama ve ATS Uyumlu Özgeçmiş | ZenID",
  description:
    "ZenID ile ATS uyumlu CV hazırlayın, PDF olarak dışa aktarın ve verileriniz cihazınızda kalsın. Üyelik gerektirmeyen ücretsiz CV oluşturucu.",
  eyebrow: "ZenID — Yerel kimlik çalışma alanınız",
  heading: "Ücretsiz CV Hazırlama: ATS Uyumlu Özgeçmişinizi Oluşturun",
  intro:
    "Profesyonel bilgilerinizi bir kez girin, hedefe uygun CV sürümleri oluşturun ve seçilebilir metin içeren PDF çıktısı alın; verileriniz cihazınızda kalır.",
  sections: [
    {
      heading: "CV hazırlama süreci nasıl çalışır?",
      paragraphs: [
        "Deneyim, eğitim, proje ve yeteneklerinizi ortak profesyonel profilinizde tutun. Aynı bilgilerden farklı iş ilanlarına göre ayrı CV sürümleri hazırlayın.",
      ],
      items: [
        "Bölümleri ve görünmesini istediğiniz deneyimleri seçin.",
        "ATS odaklı tek sütunlu PDF önizlemesini kontrol edin.",
        "CV’nizi PDF veya düzenlenebilir .zenid proje dosyası olarak cihazınıza kaydedin.",
      ],
    },
    {
      heading: "ATS uyumlu CV için temel kontroller",
      paragraphs: [
        "Açık bölüm başlıkları, okunabilir yazı düzeni ve gerçekle uyumlu ifadeler kullanın. İlanla ilgili becerileri doğal biçimde öne çıkarın; deneyim veya başarı uydurmayın.",
      ],
      items: [
        "İletişim bilgilerini ve tarihleri tutarlı yazın.",
        "Karmaşık tablo ve çok sütunlu ATS düzenlerinden kaçının.",
        "PDF çıktısındaki metnin seçilebilir ve sayfa sonlarının anlaşılır olduğunu doğrulayın.",
      ],
    },
    {
      heading: "Üyelik olmadan, tarayıcınızda",
      paragraphs: [
        "ZenID temel CV oluşturma akışında hesap istemez. Profiliniz ve CV sürümleriniz tarayıcıdaki yerel çalışma alanında kalır; yedek almak istediğinizde özel .zenid dosyanızı siz kaydedersiniz.",
      ],
    },
  ],
  toolPath: "/resume",
  toolName: "ZenID Resume Builder",
  ctaLabel: "CV oluşturmaya başla",
  alternateLabel: "Read in English",
});

const ENGLISH_RESUME_SEARCH_PAGE = page({
  id: "en-resume-builder",
  path: "en/resume-builder",
  locale: "en",
  alternateLocale: "tr",
  alternateUrl: `${origin}/tr/cv-hazirlama/`,
  title: "Free ATS-Friendly Resume Builder — Private and Local | ZenID",
  description:
    "Build an ATS-friendly resume, export a selectable PDF, and keep your professional data on your device. ZenID is free and requires no account.",
  eyebrow: "ZenID — Your local identity workspace.",
  heading: "Free ATS-Friendly Resume Builder",
  intro:
    "Enter your professional facts once, create focused resume versions, and export a selectable PDF. No account is required, and your data stays on your device.",
  sections: [
    {
      heading: "Build focused resumes from one profile",
      paragraphs: [
        "Keep experience, education, projects, and skills in one reusable professional profile. Create separate resume versions without duplicating or rewriting every fact.",
      ],
      items: [
        "Choose which experience and projects belong in each version.",
        "Review the exact single-column ATS PDF pages before export.",
        "Save a private .zenid project when you want a portable editable backup.",
      ],
    },
    {
      heading: "Practical ATS resume checks",
      paragraphs: [
        "Use clear section headings, readable formatting, and factual language. Reflect relevant job terminology naturally without inventing experience, tools, or results.",
      ],
      items: [
        "Keep contact details and dates consistent.",
        "Avoid complex tables and multi-column ATS layouts.",
        "Confirm that PDF text is selectable and page breaks are understandable.",
      ],
    },
    {
      heading: "Private by default",
      paragraphs: [
        "ZenID’s core resume workflow runs in your browser. It does not require an account or upload your professional profile to a ZenID project-data server.",
      ],
    },
  ],
  toolPath: "/resume",
  toolName: "ZenID Resume Builder",
  ctaLabel: "Build your resume",
  alternateLabel: "Türkçe okuyun",
});

const TURKISH_PORTFOLIO_SEARCH_PAGE = page({
  id: "tr-portfolyo-hazirlama",
  path: "tr/portfolyo-hazirlama",
  locale: "tr",
  alternateLocale: "en",
  alternateUrl: `${origin}/en/portfolio-builder/`,
  title: "Ücretsiz Portfolyo Hazırlama — Gizlilik Odaklı | ZenID",
  description:
    "Profesyonel profilinizden ücretsiz portfolyo hazırlayın. İletişim ve proje görünürlüğünü siz seçin; statik siteyi cihazınızda dışa aktarın.",
  eyebrow: "ZenID — Yerel kimlik çalışma alanınız",
  heading: "Ücretsiz Portfolyo Hazırlama",
  intro:
    "CV bilgilerinizden responsive bir profesyonel portfolyo oluşturun. Yayın paketine yalnızca seçtiğiniz bilgileri dahil edin ve siteyi kendi sağlayıcınızda yayınlayın.",
  sections: [
    {
      heading: "Tek profilden profesyonel portfolyo",
      paragraphs: [
        "Deneyim, proje, yetenek ve sertifika bilgilerinizi yeniden yazmadan portfolyonuzda kullanın. Görünüm tercihleri CV sürümlerinizden ayrı kalır.",
      ],
      items: [
        "Yayınlanacak bölümleri ve proje içeriklerini seçin.",
        "Masaüstü ve mobil önizlemeyi yerel olarak kontrol edin.",
        "Statik portfolyo ZIP paketini cihazınızda oluşturun.",
      ],
    },
    {
      heading: "Yayınlamadan önce gizlilik kontrolü",
      paragraphs: [
        "Telefon, e-posta, CV dosyası ve medya öğelerinin her biri için görünürlük kararı verin. ZenID, özel .zenid projenizi veya yayınlanmamış CV sürümlerinizi portfolyo paketine koymaz.",
      ],
    },
    {
      heading: "Sağlayıcıya bağlı kalmadan yayınlayın",
      paragraphs: [
        "Dışa aktarılan portfolyo standart statik dosyalardan oluşur. Paketi seçtiğiniz statik barındırma hizmetine veya kendi sunucunuza taşıyabilirsiniz.",
      ],
    },
  ],
  toolPath: "/portfolio",
  toolName: "ZenID Portfolio Builder",
  ctaLabel: "Portfolyo oluşturmaya başla",
  alternateLabel: "Read in English",
});

const ENGLISH_PORTFOLIO_SEARCH_PAGE = page({
  id: "en-portfolio-builder",
  path: "en/portfolio-builder",
  locale: "en",
  alternateLocale: "tr",
  alternateUrl: `${origin}/tr/portfolyo-hazirlama/`,
  title: "Free Private Portfolio Builder | ZenID",
  description:
    "Build a responsive professional portfolio from your reusable profile. Choose exactly what becomes public and export a provider-neutral static site.",
  eyebrow: "ZenID — Your local identity workspace.",
  heading: "Free Private Portfolio Builder",
  intro:
    "Turn your professional profile into a responsive portfolio. Publish only the information you select and deploy the static site with a provider you control.",
  sections: [
    {
      heading: "Reuse one professional profile",
      paragraphs: [
        "Use your experience, projects, skills, and certificates without re-entering every fact. Portfolio presentation choices remain separate from your resume versions.",
      ],
      items: [
        "Choose which sections and project details become public.",
        "Review the responsive portfolio locally before export.",
        "Generate a provider-neutral static website ZIP in your browser.",
      ],
    },
    {
      heading: "Review privacy before publishing",
      paragraphs: [
        "Control the visibility of phone, email, resume files, and media. ZenID does not place your private .zenid project or unpublished resume versions in the public package.",
      ],
    },
    {
      heading: "Publish without platform lock-in",
      paragraphs: [
        "The exported portfolio contains standard static files, so you can move it to a static host or server you choose.",
      ],
    },
  ],
  toolPath: "/portfolio",
  toolName: "ZenID Portfolio Builder",
  ctaLabel: "Build your portfolio",
  alternateLabel: "Türkçe okuyun",
});

const TURKISH_PDF_SEARCH_PAGE = page({
  id: "tr-pdf-duzenleme",
  path: "tr/pdf-duzenleme",
  locale: "tr",
  alternateLocale: "en",
  alternateUrl: `${origin}/en/private-pdf-editor/`,
  title: "Tarayıcıda Ücretsiz PDF Düzenleme | ZenID",
  description:
    "PDF formlarına metin, tarih, işaret ve görsel imza ekleyin. ZenPDF ücretsiz çalışır; belgeniz tarayıcınızdan yüklenmeden dışa aktarılır.",
  eyebrow: "ZenPDF by ZenID",
  heading: "Tarayıcıda Ücretsiz PDF Düzenleme",
  intro:
    "Başvuru ve kayıt formlarını yerel olarak doldurun; metin, tarih, onay işareti, paraf ve görsel imza ekleyin. İşlem sırasında belgeniz tarayıcınızda kalır.",
  sections: [
    {
      heading: "PDF doldurma ve görsel imza",
      paragraphs: [
        "PDF veya desteklenen görseli açın, öğeyi seçin ve belgedeki hedef konuma yerleştirin. Birden fazla sayfada gezinin ve sonucu yeni bir PDF olarak dışa aktarın.",
      ],
      items: [
        "Metin, tarih, onay ve çarpı işaretleri ekleyin.",
        "Paraf, görsel veya çizilmiş görsel imza yerleştirin.",
        "Orijinal PDF sayfa boyutlarını koruyan yerel çıktı alın.",
      ],
    },
    {
      heading: "Belgeniz sunucuya gönderilmez",
      paragraphs: [
        "ZenPDF işlemleri tarayıcıda yürütür ve belge yüklemek için bir ZenID hesabı istemez. Hassas bir belgeyi dışa aktardıktan sonra paylaşılan cihazdaki yerel çalışma alanını temizlemek yine sizin kontrolünüzdedir.",
      ],
    },
    {
      heading: "Görsel imza sınırı",
      paragraphs: [
        "Eklenen imza görsel bir işarettir; sertifika tabanlı güvenli elektronik imza veya PAdES imzası değildir.",
      ],
    },
  ],
  toolPath: "/editor",
  toolName: "ZenPDF",
  ctaLabel: "PDF düzenlemeye başla",
  alternateLabel: "Read in English",
});

const ENGLISH_PDF_SEARCH_PAGE = page({
  id: "en-private-pdf-editor",
  path: "en/private-pdf-editor",
  locale: "en",
  alternateLocale: "tr",
  alternateUrl: `${origin}/tr/pdf-duzenleme/`,
  title: "Free Private PDF Editor in Your Browser | ZenID",
  description:
    "Fill PDF forms, add text, dates, marks, initials, and a visual signature in your browser. ZenPDF exports locally with no account required.",
  eyebrow: "ZenPDF by ZenID",
  heading: "Free Private PDF Editor",
  intro:
    "Fill application and registration forms locally. Add text, dates, checkmarks, initials, and a visual signature while your document stays in your browser.",
  sections: [
    {
      heading: "Fill and visually sign a PDF",
      paragraphs: [
        "Open a PDF or supported image, choose an item, and place it at the intended position. Navigate multi-page documents and export the result as a new PDF.",
      ],
      items: [
        "Add text, dates, checkmarks, crossmarks, and filled dots.",
        "Place initials, images, or a drawn visual signature.",
        "Export locally while preserving the original PDF page dimensions.",
      ],
    },
    {
      heading: "No document upload",
      paragraphs: [
        "ZenPDF processes the document in your browser and does not require a ZenID account. On a shared device, you remain in control of clearing the local workspace after export.",
      ],
    },
    {
      heading: "Visual signature boundary",
      paragraphs: [
        "A placed signature is a visual mark. It is not a certificate-backed digital signature or a PAdES electronic signature.",
      ],
    },
  ],
  toolPath: "/editor",
  toolName: "ZenPDF",
  ctaLabel: "Edit a PDF",
  alternateLabel: "Türkçe okuyun",
});

export const SEARCH_PAGES = [
  TURKISH_CV_SEARCH_PAGE,
  ENGLISH_RESUME_SEARCH_PAGE,
  TURKISH_PORTFOLIO_SEARCH_PAGE,
  ENGLISH_PORTFOLIO_SEARCH_PAGE,
  TURKISH_PDF_SEARCH_PAGE,
  ENGLISH_PDF_SEARCH_PAGE,
];

export function getSearchPagesForLocale(locale) {
  return SEARCH_PAGES.filter((searchPage) => searchPage.locale === locale);
}
