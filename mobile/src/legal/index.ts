export type LegalDocId = "privacy" | "terms";
export type LegalLocale = "tr" | "en";

export const LEGAL_VERSION = "1.0";

export const LEGAL_TITLES: Record<LegalDocId, Record<LegalLocale, string>> = {
  privacy: { tr: "Gizlilik Politikası", en: "Privacy Policy" },
  terms: { tr: "Kullanım Koşulları", en: "Terms of Service" },
};

export const PRIVACY_TR = `Gizlilik Politikası (v${LEGAL_VERSION})
Son güncelleme: 19 Haziran 2026

1. Veri Sorumlusu
Asistan Rezervasyon platformu ("Asistan"), kişisel verilerinizin veri sorumlusudur.

2. Toplanan Veriler
• Kimlik ve iletişim: ad soyad, e-posta, telefon, adres, şehir
• Konum: mesafe hesaplama için isteğe bağlı konum
• Rezervasyon: randevu tarihi/saati, seçilen hizmet, notlar
• Teknik: oturum bilgileri, cihaz türü, hata kayıtları

3. İşleme Amaçları
Randevu oluşturma ve yönetimi, kliniklerle iletişim, bildirimler, hizmet kalitesinin artırılması ve yasal yükümlülükler.

4. Hukuki Dayanak (KVKK m.5 / GDPR Art.6)
• Sözleşmenin kurulması ve ifası (randevu hizmeti)
• Açık rıza (sağlık verisi niteliğindeki randevu notları)
• Meşru menfaat (güvenlik, dolandırıcılık önleme)

5. Paylaşım
Verileriniz yalnızca randevu aldığınız klinik/işletme ve altyapı sağlayıcılarımız (Supabase, Netlify) ile paylaşılır. Veriler üçüncü taraflara satılmaz.

6. Saklama
Hesap aktifken veriler saklanır. Hesap silindikten sonra 30 gün içinde kalıcı olarak silinir (yasal zorunluluklar hariç).

7. Haklarınız
KVKK m.11 / GDPR kapsamında erişim, düzeltme, silme, taşınabilirlik ve itiraz haklarına sahipsiniz. Profil → Verilerimi İndir / Hesabımı Sil veya destek@asistan.app.

8. Güvenlik
Tüm iletişim TLS (HTTPS) ile şifrelenir. Veritabanında Supabase varsayılan disk şifrelemesi uygulanır.

9. İletişim
destek@asistan.app`;

export const PRIVACY_EN = `Privacy Policy (v${LEGAL_VERSION})
Last updated: 19 June 2026

1. Data Controller
Asistan Reservation platform ("Asistan") is the data controller for your personal data.

2. Data We Collect
• Identity & contact: name, email, phone, address, city
• Location: optional, for distance sorting
• Bookings: appointment date/time, service, notes
• Technical: session data, device type, error logs

3. Purposes
Appointment booking and management, clinic communication, notifications, service improvement, and legal compliance.

4. Legal Basis (KVKK / GDPR)
• Contract performance (booking service)
• Explicit consent (health-related appointment notes)
• Legitimate interest (security, fraud prevention)

5. Sharing
Data is shared only with clinics you book with and our infrastructure providers (Supabase, Netlify). We do not sell your data.

6. Retention
Data is kept while your account is active. After deletion, records are permanently removed within 30 days unless law requires longer retention.

7. Your Rights
Access, rectification, erasure, portability, and objection. Use Profile → Export My Data / Delete Account or contact support@asistan.app.

8. Security
All traffic is encrypted via TLS (HTTPS). Database storage uses Supabase default encryption at rest.

9. Contact
support@asistan.app`;

export const TERMS_TR = `Kullanım Koşulları (v${LEGAL_VERSION})
Son güncelleme: 19 Haziran 2026

1. Hizmet
Asistan, kullanıcıların sağlık kuruluşlarından randevu almasını sağlayan bir aracı platformdur. Tıbbi teşhis veya tedavi sunmaz.

2. Hesap
Doğru bilgi vermekle yükümlüsünüz. Hesap güvenliğinden siz sorumlusunuz.

3. Randevular
Randevu onayı kliniğin politikasına bağlıdır. Geç kalma ve iptal koşulları ilgili kliniğe aittir.

4. Kullanım Kuralları
Yanıltıcı bilgi, kötüye kullanım, otomatik istek (bot) ve yasadışı kullanım yasaktır.

5. Sorumluluk Sınırı
Asistan, kliniklerin hizmet kalitesinden sorumlu değildir. Platform "olduğu gibi" sunulur.

6. Fikri Mülkiyet
Asistan markası ve arayüzü korunmaktadır.

7. Fesih
Hesabınızı istediğiniz zaman silebilirsiniz. Koşulları ihlal eden hesaplar askıya alınabilir.

8. Uygulanacak Hukuk
Türkiye Cumhuriyeti kanunları geçerlidir.

9. İletişim
destek@asistan.app`;

export const TERMS_EN = `Terms of Service (v${LEGAL_VERSION})
Last updated: 19 June 2026

1. Service
Asistan is an intermediary platform for booking healthcare appointments. It does not provide medical diagnosis or treatment.

2. Account
You must provide accurate information and keep your credentials secure.

3. Appointments
Confirmation depends on clinic policy. Late arrival and cancellation rules belong to the clinic.

4. Acceptable Use
Misrepresentation, abuse, automated scraping, and unlawful use are prohibited.

5. Limitation of Liability
Asistan is not responsible for clinic service quality. The platform is provided "as is".

6. Intellectual Property
The Asistan brand and interface are protected.

7. Termination
You may delete your account at any time. Accounts violating these terms may be suspended.

8. Governing Law
Laws of the Republic of Türkiye apply.

9. Contact
support@asistan.app`;

export const KVKK_CONSENT_TR = `Sağlık Verisi Açık Rıza Metni

Randevu notları ve seçtiğiniz sağlık hizmetleri kişisel sağlık verisi niteliği taşıyabilir. Bu verilerin randevu oluşturma, kliniğe iletilmesi ve randevu yönetimi amacıyla işlenmesine açık rıza veriyorum. Rızamı istediğim zaman geri çekebileceğimi biliyorum.`;

export const KVKK_CONSENT_EN = `Health Data Explicit Consent

Appointment notes and selected healthcare services may constitute personal health data. I explicitly consent to processing this data for booking, sharing with the clinic, and appointment management. I understand I may withdraw consent at any time.`;

export function getLegalContent(doc: LegalDocId, locale: LegalLocale): string {
  const map = {
    privacy: { tr: PRIVACY_TR, en: PRIVACY_EN },
    terms: { tr: TERMS_TR, en: TERMS_EN },
  };
  return map[doc][locale];
}
