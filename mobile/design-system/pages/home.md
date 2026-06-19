# Ana Sayfa — Override Rules

> MASTER.md geçerli. Bu dosya yalnızca ana sayfaya özel ek kuralları içerir.

## Layout sırası

1. `GreetingHeader` — marka + karşılama + bildirim
2. `SearchBar` — arama + filtre
3. `HeroBanner` — gradyan + kalkan + CTA
4. `UpcomingWidget` — varsa yaklaşan randevu
5. `CategoryRow` — yatay scroll kategoriler
6. `AvailableTodayRow` — bugün müsait doktorlar
7. `ClinicListCard` listesi — "Önerilen Klinikler"
8. `PromoBanner` + `TrustRow`

## Bölüm başlıkları

- "Kategoriler" / "Tümünü gör ›"
- "Bugün Müsait"
- "Önerilen Klinikler"

## Kategori ikonları

Pastel kare (64×64, radius 20), Ionicons 26px:
Hekim, Kardiyoloji, Dermatoloji, Pediatri, Psikoloji, Diş

## Klinik kartı zorunlu öğeler

- Gradyan logo veya `logoUrl`
- Verified check (reviewCount ≥ 5 veya rating ≥ 4)
- Yıldız + mesafe
- Saat satırı veya uzmanlık
- Yeşil "Açık" (yalnızca `isOpenNow`)
- Gradyan "Rezervasyon" CTA
