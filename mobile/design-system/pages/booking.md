# Randevu Al — Override Rules

## Stepper (4 adım)

1. Hizmet seç
2. Tarih seç
3. Saat seç
4. Onay

- Aktif adım: teal dot + kalın label
- Tamamlanan: ✓ işareti, yeşil connector

## Tarih seçici

- Yatay 7 günlük scroll
- Seçili gün: `primary` arka plan, beyaz metin

## Saat slotları

- Grid chip'ler, müsait: `primarySoft` / seçili: `primary`
- Dolu slot: disabled, `muted`

## Onay ekranı

- Özet kartı: doktor, klinik, hizmet, tarih, saat, fiyat
- Primary: "Randevuyu Onayla"
- Başarı sonrası toast veya Alert + Ana sayfaya dön
