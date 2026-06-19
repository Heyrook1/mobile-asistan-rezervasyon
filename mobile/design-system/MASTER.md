# Asistan — Design System (MASTER)

> **Kaynak dosya:** Tüm UI kararlarının tek doğruluk kaynağı.  
> Sayfa özel kurallar `design-system/pages/[sayfa].md` içinde MASTER'ı geçersiz kılar.

**Proje:** Asistan Rezervasyon  
**Platform:** React Native (Expo) + Web (Netlify)  
**Kategori:** Sağlık / Randevu / Klinik  
**Stil:** Accessible & Ethical + Soft UI (mockup referans)

---

## 1. Marka & Ton

| Özellik | Değer |
|---------|-------|
| Duygu | Güvenilir, sakin, profesyonel, erişilebilir |
| Hedef kitle | Sağlık hizmeti arayan son kullanıcılar |
| Dil | Türkçe (tutarlı terimler: **Randevu**, **Rezervasyon**, **Klinik**) |
| İkon seti | **Ionicons** (outline varsayılan, filled aktif durum) |
| Emoji | ❌ İkon olarak kullanılmaz |

---

## 2. Renk Paleti

Kaynak: `mobile/src/theme.ts`

| Rol | Hex | Kullanım |
|-----|-----|----------|
| **Primary** | `#1BA8B5` | CTA, aktif tab, filtre butonu, marka |
| **Primary Dark** | `#0D7A86` | Hover / pressed, koyu vurgu |
| **Primary Soft** | `#E0F7FA` | İkon arka planı, chip, kategori tint |
| **Secondary** | `#4DD4E8` | Gradyan bitiş, hero vurgu |
| **Accent** | `#0D5C6B` | Hero gradyan başlangıç |
| **Background** | `#F4F7FA` | Ekran arka planı |
| **Surface** | `#FFFFFF` | Kart, input, tab bar |
| **Surface Alt** | `#EEF6F8` | İkincil yüzey, action icon bg |
| **Text** | `#1A2B3C` | Başlık ve gövde |
| **Muted** | `#6B7C8F` | Alt metin, placeholder |
| **Border** | `#E4EBF0` | Kart ve input kenarlığı |
| **Verified** | `#3B82F6` | Doğrulanmış klinik rozeti |
| **Success / CTA** | `#22C55E` | Açık, onay, başarı |
| **Warning** | `#D97706` | Bekleyen durum |
| **Danger** | `#EF4444` | İptal, hata, bildirim badge |
| **Star** | `#F59E0B` | Puan yıldızı |

### Gradyanlar

```
Hero / FAB:     #0D5C6B → #1BA8B5 → #4DD4E8
Klinik logo:    primaryColor || #1BA8B5 → #4DD4E8
Rezervasyon CTA: #1BA8B5 → #4DD4E8 (yatay)
```

### Yasak

- Neon / parlak mor-pembe AI gradyanları
- Ekran başına 4'ten fazla ana renk
- Düşük kontrast metin (< 4.5:1)

---

## 3. Tipografi

**Web:** Figtree (başlık) + Noto Sans (gövde) — Google Fonts  
**Native:** Sistem fontu (SF Pro / Roboto) — `fontWeight` ile hiyerarşi

| Token | Boyut | Ağırlık | Kullanım |
|-------|-------|---------|----------|
| `h1` | 26px | 800 | Ekran başlığı, karşılama |
| `h2` | 20px | 800 | Bölüm başlığı |
| `h3` | 16px | 700 | Kart başlığı, doktor adı |
| `body` | 15px | 500–600 | Gövde metni, input |
| `caption` | 13px | 600 | Meta bilgi (puan, mesafe) |
| `label` | 12px | 700 | Rozet, chip, tab label |

**Letter-spacing:** Başlıklarda `-0.3` ila `-0.4`

---

## 4. Boşluk & Köşe

Kaynak: `theme.spacing` / `theme.radius`

### Spacing (8pt grid)

| Token | px | Kullanım |
|-------|-----|----------|
| `xs` | 4 | Sıkı iç boşluk |
| `sm` | 8 | İkon-metin arası |
| `md` | 12 | Kart içi küçük gap |
| `lg` | 16 | Standart padding, yatay margin |
| `xl` | 24 | Bölüm arası |
| `xxl` | 32 | Scroll alt boşluk |

### Border Radius

| Token | px | Kullanım |
|-------|-----|----------|
| `sm` | 10 | Küçük chip |
| `md` | 16 | Input, buton, kategori kare |
| `lg` | 22 | Kart |
| `xl` | 28 | Hero, profil banner |
| `pill` | 999 | CTA, rozet, arama |

---

## 5. Gölge & Derinlik

```ts
// Kart
shadowColor: #1A2B3C, opacity: 0.06, radius: 16, offset: {0, 4}

// FAB / primary CTA
shadowColor: #1BA8B5, opacity: 0.18, radius: 20, offset: {0, 8}
```

- Kartlarda ince `borderWidth: 1` + `borderLight` tercih edilir
- Ağır gölgelerden kaçının

---

## 6. Bileşen Kuralları

### Primary Button
- Min yükseklik: **50px** (dokunma hedefi ≥ 44px)
- `borderRadius: md`, `fontWeight: 800`
- Primary arka plan: `#1BA8B5`, metin: beyaz
- Disabled: `opacity: 0.6`
- `activeOpacity: 0.85`

### Secondary / Ghost
- Arka plan: `surfaceAlt` veya şeffaf
- Kenarlık: `border`

### Search Bar
- Yükseklik: **52px**, `radius: lg`
- Sol: `search-outline` ikon
- Sağ filtre: **52×52** teal kare, `options-outline`

### Kart (Klinik)
- Yatay layout: **96×96** gradyan logo + bilgi
- Doğrulanmış: `checkmark-circle` mavi
- Favori: sağ üst `heart-outline`
- Yeşil **Açık** rozeti: `successSoft` bg
- CTA: gradyan **Rezervasyon →** pill

### Tab Bar
- Aktif sekme: `primarySoft` pill arka plan
- Orta FAB: **60×60** gradyan, `search` ikonu
- Üst border + hafif gölge

### Hero Banner
- Min yükseklik: **178px**
- Gradyan + cam kalkan görseli (glassmorphism)
- Beyaz pill CTA: **Hizmetler →**
- Altında pagination dots (aktif: geniş teal çubuk)

### Boş Durum (EmptyState)
- 68×68 `primarySoft` ikon kutusu
- Başlık + kısa alt metin, ortalanmış

---

## 7. Ekran Yapısı (Bilgi Mimarisi)

```
Auth → Ana Sayfa (Tabs)
         ├── Ara
         ├── Randevularım
         ├── Bildirimler
         └── Profil
Stack:
  ├── Doktor Detay
  ├── Klinik
  ├── Randevu Al (stepper)
  └── Bildirimler (stack)
```

---

## 8. Erişilebilirlik (WCAG)

- [ ] Tüm tıklanabilir öğeler ≥ **44×44** px
- [ ] Metin kontrastı ≥ **4.5:1**
- [ ] `accessibilityRole` / `accessibilityLabel` butonlarda
- [ ] `prefers-reduced-motion`: animasyonları azalt
- [ ] Form alanlarında görünür label
- [ ] Hata mesajları Türkçe ve anlaşılır

---

## 9. Anti-Pattern Listesi

| ❌ Yapma | ✅ Yap |
|----------|--------|
| Emoji ikon | Ionicons |
| Çalışmayan buton (favori, hızlı erişim) | Bağla veya kaldır |
| `getSession` sonsuz bekleme (web) | Timeout + localStorage fast-path |
| Her ekranda farklı renk | `theme.ts` tokenları |
| Anlamsız loading | Skeleton + anlamlı mesaj |
| Karışık TR/EN | Tek dil, tek terim seti |

---

## 10. Teslim Öncesi Checklist

- [ ] `theme.ts` dışında hardcoded renk yok
- [ ] İkonlar Ionicons
- [ ] Kartlar `shadow.card` + `radius.lg`
- [ ] Loading / Empty / Error durumları her listede
- [ ] iOS Safari / Chrome WebKit test edildi
- [ ] 375px genişlikte taşma yok
- [ ] API hatalarında kullanıcı mesajı

---

## 11. Sayfa Override Dosyaları

| Sayfa | Dosya |
|-------|-------|
| Ana Sayfa | `pages/home.md` |
| Giriş | `pages/auth.md` |
| Randevu Al | `pages/booking.md` |
| Arama | `pages/search.md` |

---

## 12. Kod Referansları

| Dosya | Açıklama |
|-------|----------|
| `src/theme.ts` | Renk, spacing, radius, shadow |
| `src/components/ui.tsx` | Button, Card, Badge, EmptyState |
| `src/components/home/HomeSections.tsx` | Ana sayfa bileşenleri |
| `src/components/PremiumTabBar.tsx` | Alt navigasyon |

---

*Son güncelleme: 2026-06-19 — Uygulama mockup ve `theme.ts` ile senkronize.*
