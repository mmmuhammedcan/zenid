export const SUPPORTED_LOCALES = ["en", "tr"];
export const INTERFACE_LOCALE_STORAGE_KEY = "zenid.interface-locale";

export function normalizeLocale(value) {
  const base = String(value || "").trim().toLowerCase().split("-")[0];
  return SUPPORTED_LOCALES.includes(base) ? base : "en";
}

export function detectInitialLocale({ storedLocale, browserLocales = [] } = {}) {
  const storedBase = String(storedLocale || "").trim().toLowerCase().split("-")[0];
  if (SUPPORTED_LOCALES.includes(storedBase)) {
    return storedBase;
  }
  const supportedBrowserLocale = browserLocales
    .map((locale) => String(locale || "").toLowerCase().split("-")[0])
    .find((locale) => SUPPORTED_LOCALES.includes(locale));
  return supportedBrowserLocale || "en";
}

const TURKISH_UI = {
  "Back to home": "Ana sayfaya dön",
  "Go to home": "Ana sayfaya git",
  "ZenID home": "ZenID ana sayfası",
  "Language": "Dil",
  "English": "İngilizce",
  "Turkish": "Türkçe",
  "Welcome to ZenID": "ZenID’ye Hoş Geldiniz",
  "Your local identity workspace.": "Yerel kimlik çalışma alanınız.",
  "Pick a tool to get started.": "Başlamak için bir araç seçin.",
  "Edit PDF": "PDF Düzenle",
  "Build Resume": "CV Hazırla",
  "Build Portfolio": "Portfolio Hazırla",
  "Resume Builder": "CV Hazırlayıcı",
  "Fill application forms, add dates and a visual signature, then export privately in your browser.":
    "Formları doldurun, tarih ve görsel imza ekleyin; ardından dosyayı tarayıcınızda gizlilikle dışa aktarın.",
  "Turn a short form into a clean, professional resume.":
    "Bilgilerinizi sade ve profesyonel bir CV’ye dönüştürün.",
  "Reuse your professional profile and shape a responsive portfolio locally with explicit privacy controls.":
    "Profesyonel profilinizi yeniden kullanın ve açık gizlilik kontrolleriyle cihazınızda duyarlı bir portfolio oluşturun.",
  "Open": "Aç",
  "Templates": "Şablonlar",
  "Untitled Resume": "Adsız CV",
  "Resume name": "CV adı",
  "Active resume version": "Etkin CV sürümü",
  "Resume version name": "CV sürümü adı",
  "Add resume variant": "CV sürümü ekle",
  "Add Resume Variant": "CV Sürümü Ekle",
  "Delete current resume variant": "Geçerli CV sürümünü sil",
  "Open ZenID project": "ZenID projesi aç",
  "Save ZenID project": "ZenID projesini kaydet",
  "Clear local project": "Yerel projeyi temizle",
  "Resume Checklist": "CV Kontrol Listesi",
  "Export PDF": "PDF’yi Dışa Aktar",
  "Exporting…": "Dışa aktarılıyor…",
  "Personal Information": "Kişisel Bilgiler",
  "Design Preview": "Tasarım Önizlemesi",
  "PDF Preview": "PDF Önizlemesi",
  "Output language": "Çıktı dili",
  "Application language": "Uygulama dili",
  "Profile": "Profil",
  "Skills & Experience": "Yetenekler ve Deneyim",
  "Projects": "Projeler",
  "Certificates": "Sertifikalar",
  "Style & Privacy": "Stil ve Gizlilik",
  "Edit": "Düzenle",
  "Preview": "Önizleme",
  "Previous": "Önceki",
  "Next": "Sonraki",
  "Publish Portfolio": "Portfolio’yu Yayınla",
  "Portfolio Builder": "Portfolio Hazırlayıcı",
  "Local": "Yerel",
  "Open Project": "Proje Aç",
  "Save Project": "Projeyi Kaydet",
  "Export Website": "Web Sitesini Dışa Aktar",
  "Review preview": "Önizlemeyi incele",
  "Live portfolio preview": "Canlı portfolio önizlemesi",
  "Save ZenID Project": "ZenID Projesini Kaydet",
  "Open ZenID Project": "ZenID Projesi Aç",
  "Saved locally in this browser": "Bu tarayıcıya yerel olarak kaydedildi",
  "Download résumé": "CV’yi indir",
  "Loading your local workspace…": "Yerel çalışma alanınız açılıyor…",
  "Full name": "Ad soyad",
  "Title": "Unvan",
  "Email": "E-posta",
  "Phone": "Telefon",
  "City": "Şehir",
  "State": "Bölge",
  "Summary": "Özet",
  "Area": "Alan",
  "Category": "Kategori",
  "Skills (comma-separated)": "Yetenekler (virgülle ayrılmış)",
  "Company": "Şirket",
  "Role": "Pozisyon",
  "Start date": "Başlangıç tarihi",
  "End date": "Bitiş tarihi",
  "I currently work here": "Burada çalışmaya devam ediyorum",
  "Tools / technologies used": "Kullanılan araçlar / teknolojiler",
  "Description": "Açıklama",
  "Project name": "Proje adı",
  "Tech stack": "Teknoloji yığını",
  "Domain / function": "Alan / işlev",
  "This is a current project": "Bu proje devam ediyor",
  "GitHub repository": "GitHub deposu",
  "Live demo (Streamlit or website)": "Canlı demo (Streamlit veya web sitesi)",
  "Other project link": "Diğer proje bağlantısı",
  "Date (optional)": "Tarih (isteğe bağlı)",
  "Impact / description": "Etki / açıklama",
  "Certification title": "Sertifika adı",
  "Issuer": "Veren kurum",
  "Date issued": "Veriliş tarihi",
  "Certificate link": "Sertifika bağlantısı",
  "Credential ID": "Belge numarası",
  "What this credential demonstrates": "Bu belgenin gösterdiği yetkinlikler",
  "Institution": "Kurum",
  "Degree": "Derece",
  "Field of study": "Eğitim alanı",
  "I currently study here": "Burada öğrenim görmeye devam ediyorum",
  "GPA (optional)": "Not ortalaması (isteğe bağlı)",
  "Section title": "Bölüm başlığı",
  "Additional Information": "Ek Bilgiler",
  "Link (optional)": "Bağlantı (isteğe bağlı)",
  "Remove": "Kaldır",
  "Entry": "Kayıt",
  "Skill Category": "Yetenek Kategorisi",
  "Project": "Proje",
  "Achievement": "Başarı",
  "Certification": "Sertifika",
  "Add area": "Alan ekle",
  "Add skill category": "Yetenek kategorisi ekle",
  "Add experience": "Deneyim ekle",
  "Add project": "Proje ekle",
  "Add achievement": "Başarı ekle",
  "Add certification": "Sertifika ekle",
  "Add education": "Eğitim ekle",
  "Company name": "Şirket adı",
  "Job title": "Pozisyon adı",
  "Key achievements and responsibilities": "Temel başarılar ve sorumluluklar",
  "Project title": "Proje başlığı",
  "Technologies used": "Kullanılan teknolojiler",
  "Key features and accomplishments": "Temel özellikler ve başarılar",
  "University or college name": "Üniversite veya okul adı",
  "Major or field": "Bölüm veya alan",
  "A short, sharp summary of who you are.": "Kim olduğunuzu anlatan kısa ve etkili bir özet.",
  "Enter your custom content here": "Özel içeriğinizi buraya girin",
  "Choose a starting point": "Bir başlangıç noktası seçin",
  "You can change the layout and color later without losing your content.":
    "İçeriğinizi kaybetmeden düzeni ve rengi daha sonra değiştirebilirsiniz.",
  "Opened locally in your browser—nothing is uploaded.":
    "Tarayıcınızda yerel olarak açılır; hiçbir şey yüklenmez.",
  "Accent color": "Vurgu rengi",
  "Continue": "Devam et",
  "Minimal": "Minimal",
  "Modern": "Modern",
  "A single column, generous whitespace, and quiet typography.":
    "Tek sütun, geniş boşluklar ve sade tipografi.",
  "An accent sidebar for contact details beside your story.":
    "İletişim bilgileriniz için hikâyenizin yanında vurgulu bir kenar çubuğu.",
  "Included in this resume": "Bu CV’ye dahil edilenler",
  "Targeted wording": "Hedeflenmiş anlatım",
  "Preview type": "Önizleme türü",
  "Design": "Tasarım",
  "PDF export": "PDF çıktısı",
  "Exact ATS PDF layout and page breaks, generated locally in your browser.":
    "Tam ATS PDF düzeni ve sayfa sonları tarayıcınızda yerel olarak oluşturulur.",
  "The ATS PDF uses a single-column layout. Select PDF export to inspect the exact pages.":
    "ATS PDF tek sütunlu düzen kullanır. Tam sayfaları incelemek için PDF çıktısını seçin.",
  "Live design preview. Select PDF export to inspect exact page breaks.":
    "Canlı tasarım önizlemesi. Tam sayfa sonlarını incelemek için PDF çıktısını seçin.",
  "Fill and sign application forms privately": "Başvuru formlarını gizlilikle doldurun ve imzalayın",
  "Add Text": "Metin Ekle",
  "Add Visual Signature": "Görsel İmza Ekle",
  "Quick Fill": "Hızlı Doldur",
  "Add Image": "Görsel Ekle",
  "Draw": "Çiz",
  "Undo (Ctrl+Z)": "Geri al (Ctrl+Z)",
  "Redo (Ctrl+Shift+Z)": "Yinele (Ctrl+Shift+Z)",
  "Clear page (Ctrl+Z to undo)": "Sayfayı temizle (geri almak için Ctrl+Z)",
  "Shared wording remains part of your profile. Targeted wording changes only this resume version and must stay factual.":
    "Ortak anlatım profilinizin parçası olarak kalır. Hedeflenmiş anlatım yalnızca bu CV sürümünü değiştirir ve gerçeğe uygun olmalıdır.",
  "Excluded from this resume": "Bu CV’ye dahil değil",
  "Shared description": "Ortak açıklama",
  "No shared description yet.": "Henüz ortak açıklama yok.",
  "Wording for this resume": "Bu CV’ye özel anlatım",
  "Use shared wording": "Ortak anlatımı kullan",
  "Customize for this resume": "Bu CV için özelleştir",
  "Choose what appears in this resume version. Your profile and other resume versions stay unchanged.":
    "Bu CV sürümünde nelerin görüneceğini seçin. Profiliniz ve diğer CV sürümleri değişmeden kalır.",
  "Previous page": "Önceki sayfa",
  "Next page": "Sonraki sayfa",
  "Page": "Sayfa",
  "of": "/",
  "Zoom out": "Uzaklaştır",
  "Zoom in": "Yakınlaştır",
  "Drag & drop a PDF or image here": "PDF veya görseli buraya sürükleyip bırakın",
  "PDF, JPG, or PNG — or click to browse": "PDF, JPG veya PNG — seçmek için tıklayabilirsiniz",
  "Quick form fields": "Hızlı form alanları",
  "Quick fill": "Hızlı doldur",
  "Place initials": "Parafı yerleştir",
  "Create initials": "Paraf oluştur",
  "Edit saved initials": "Kayıtlı parafı düzenle",
  "Date": "Tarih",
  "Place date": "Tarihi yerleştir",
  "Place selected date": "Seçilen tarihi yerleştir",
  "Choose an item, then click its position on the page.":
    "Bir öğe seçin, ardından sayfadaki konumuna tıklayın.",
  "Brush": "Fırça",
  "Eraser — click or drag over a stroke to remove it": "Silgi — kaldırmak için çizginin üzerine tıklayın veya sürükleyin",
  "Stroke width": "Çizgi kalınlığı",
  "Stroke color": "Çizgi rengi",
  "About": "Hakkımda",
  "Skills": "Yetenekler",
  "Experience": "Deneyim",
  "Style": "Stil",
  "Résumé and introduction": "CV ve tanıtım",
  "Visible sections": "Görünür bölümler",
  "Section order": "Bölüm sırası",
  "Public contact details": "Herkese açık iletişim bilgileri",
  "Profile photo": "Profil fotoğrafı",
  "Professional title": "Profesyonel unvan",
  "Availability": "Uygunluk durumu",
  "Region": "Bölge",
  "Introduction video": "Tanıtım videosu",
  "Contact introduction": "İletişim açıklaması",
  "Show email publicly": "E-postayı herkese açık göster",
  "Show phone publicly": "Telefonu herkese açık göster",
  "Show LinkedIn publicly": "LinkedIn’i herkese açık göster",
  "Show GitHub publicly": "GitHub’ı herkese açık göster",
  "Show résumé download": "CV indirme bağlantısını göster",
  "Résumé source": "CV kaynağı",
  "Résumé version": "CV sürümü",
  "About & skills": "Hakkımda ve yetenekler",
  "Contact": "İletişim",
  "Publish": "Yayınla",
  "Hidden items remain safely stored in your private profile.":
    "Gizlenen öğeler özel profilinizde güvenle saklanmaya devam eder.",
  "Add text, dates, checkmarks, initials, and a visual signature. Your document stays in this browser.":
    "Metin, tarih, onay işareti, paraf ve görsel imza ekleyin. Belgeniz bu tarayıcıda kalır.",
  "Change file": "Dosyayı değiştir",
  "Redraw signature": "İmzayı yeniden çiz",
  "Choose a PDF or image.": "Bir PDF veya görsel seçin.",
  "Loading...": "Yükleniyor...",
  "Document ready.": "Belge hazır.",
  "Exporting...": "Dışa aktarılıyor...",
  "Load a PDF first.": "Önce bir PDF açın.",
  "Placement cancelled.": "Yerleştirme iptal edildi.",
  "Placed. Drag or resize it if needed.": "Yerleştirildi. Gerekirse sürükleyin veya boyutlandırın.",
  "Placed. Drag, resize, or double-click to edit.":
    "Yerleştirildi. Düzenlemek için sürükleyin, boyutlandırın veya çift tıklayın.",
};

export function translate(locale, text) {
  if (normalizeLocale(locale) !== "tr") return text;
  return TURKISH_UI[text] || text;
}

const RESUME_COPY = {
  en: {
    sections: {
      domains: "Domain/Functional Areas",
      skills: "Key Skills",
      experience: "Professional Experience",
      projects: "Projects",
      achievements: "Achievements",
      certifications: "Certifications",
      education: "Education",
      additionalSection: "Additional Section",
    },
    present: "Present",
    tools: "Tools",
    link: "Link",
    fieldConnector: "in",
    gpa: "GPA",
    contact: {
      email: "Email",
      phone: "Phone",
      location: "Location",
      portfolio: "Portfolio",
    },
  },
  tr: {
    sections: {
      domains: "Uzmanlık Alanları",
      skills: "Temel Yetenekler",
      experience: "Profesyonel Deneyim",
      projects: "Projeler",
      achievements: "Başarılar",
      certifications: "Sertifikalar",
      education: "Eğitim",
      additionalSection: "Ek Bölüm",
    },
    present: "Devam ediyor",
    tools: "Araçlar",
    link: "Bağlantı",
    fieldConnector: "—",
    gpa: "Not ortalaması",
    contact: {
      email: "E-posta",
      phone: "Telefon",
      location: "Konum",
      portfolio: "Portfolio",
    },
  },
};

export function getResumeCopy(locale) {
  return RESUME_COPY[normalizeLocale(locale)];
}

export function formatDocumentDate(dateStr, locale = "en") {
  if (!dateStr) return "";
  const normalized = normalizeLocale(locale);
  if (String(dateStr).toLowerCase() === "present") return getResumeCopy(normalized).present;
  if (/^\d{4}-\d{2}$/.test(String(dateStr))) {
    const [year, month] = String(dateStr).split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleString(
      normalized === "tr" ? "tr-TR" : "en-US",
      { month: "short", year: "numeric", timeZone: "UTC" }
    );
  }
  return dateStr;
}

export function uppercaseDocumentLabel(value, locale = "en") {
  return String(value || "").toLocaleUpperCase(normalizeLocale(locale) === "tr" ? "tr-TR" : "en-US");
}

const PORTFOLIO_COPY = {
  en: {
    navigation: {
      about: "About",
      experience: "Experience",
      projects: "Projects",
      certifications: "Certificates",
      contact: "Contact",
    },
    downloadResume: "Download résumé",
    watchIntroduction: "Watch introduction",
    contactMe: "Contact me",
    greeting: "Hello, I’m",
    publishedProjects: "Published projects",
    present: "Present",
    role: "Role",
    credential: "Credential",
    verifyCredential: "Verify credential",
    viewCaseStudy: "View case study",
    builtLocally: "Built locally with ZenID",
    portfolioOwner: "Portfolio owner",
    professionalPortfolio: "Professional portfolio",
    yourName: "Your name",
    profileAlt: "Portfolio profile",
    viewProject: "View project",
    viewSource: "View source",
    headings: {
      experienceEyebrow: "Journey",
      experience: "Experience",
      experienceCopy: "Roles, responsibilities, and the work that shaped my practice.",
      projectsEyebrow: "Selected work",
      projects: "Projects",
      projectsCopy: "Case studies, implementation details, and project links.",
      certificationsEyebrow: "Learning",
      certifications: "Certificates & awards",
      certificationsCopy: "Credentials with context, evidence, and direct verification.",
      contactEyebrow: "Contact",
      contact: "Let’s connect",
      profileEyebrow: "Profile",
      about: "About me",
      skillsEyebrow: "Capabilities",
      skills: "Key skills",
    },
    empty: {
      experience: "Experience coming soon",
      projects: "Projects coming soon",
      certificates: "Certificates coming soon",
      contacts: "No public contact method is enabled.",
    },
  },
  tr: {
    navigation: {
      about: "Hakkımda",
      experience: "Deneyim",
      projects: "Projeler",
      certifications: "Sertifikalar",
      contact: "İletişim",
    },
    downloadResume: "CV’yi indir",
    watchIntroduction: "Tanıtımı izle",
    contactMe: "İletişime geç",
    greeting: "Merhaba, ben",
    publishedProjects: "Yayınlanan projeler",
    present: "Devam ediyor",
    role: "Pozisyon",
    credential: "Belge numarası",
    verifyCredential: "Belgeyi doğrula",
    viewCaseStudy: "Vaka çalışmasını görüntüle",
    builtLocally: "ZenID ile cihazda oluşturuldu",
    portfolioOwner: "Portfolio sahibi",
    professionalPortfolio: "Profesyonel portfolio",
    yourName: "Adınız",
    profileAlt: "Portfolio profil fotoğrafı",
    viewProject: "Projeyi görüntüle",
    viewSource: "Kaynak kodu görüntüle",
    headings: {
      experienceEyebrow: "Kariyer",
      experience: "Deneyim",
      experienceCopy: "Kariyerimi şekillendiren görevler, sorumluluklar ve çalışmalar.",
      projectsEyebrow: "Seçili çalışmalar",
      projects: "Projeler",
      projectsCopy: "Vaka çalışmaları, uygulama ayrıntıları ve proje bağlantıları.",
      certificationsEyebrow: "Gelişim",
      certifications: "Sertifikalar ve başarılar",
      certificationsCopy: "Bağlamı, kanıtı ve doğrudan doğrulama bağlantılarıyla belgeler.",
      contactEyebrow: "İletişim",
      contact: "İletişime geçelim",
      profileEyebrow: "Profil",
      about: "Hakkımda",
      skillsEyebrow: "Yetkinlikler",
      skills: "Temel yetenekler",
    },
    empty: {
      experience: "Deneyimler yakında eklenecek",
      projects: "Projeler yakında eklenecek",
      certificates: "Sertifikalar yakında eklenecek",
      contacts: "Herkese açık bir iletişim yöntemi etkin değil.",
    },
  },
};

export function getPortfolioCopy(locale) {
  return PORTFOLIO_COPY[normalizeLocale(locale)];
}
