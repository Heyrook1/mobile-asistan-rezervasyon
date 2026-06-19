# Phase 4 — Core Features Deployment Guide

Push notifications, favorites, and location services.

## 1. Database migration

```sql
-- supabase/migrations/20260619160000_phase4_features.sql
```

Creates: `ClientFavorite`, `ClientPushToken`, `AppointmentReminderLog`

## 2. Deploy edge functions

```bash
supabase functions deploy engagement
supabase functions deploy booking
supabase functions deploy reminders --no-verify-jwt
```

Set secrets:

```bash
supabase secrets set CRON_SECRET=your-random-secret-here
```

## 3. Schedule appointment reminders

Hourly cron (Supabase Dashboard → Integrations → Cron, or pg_cron):

```http
POST https://<project>.supabase.co/functions/v1/reminders
x-cron-secret: <CRON_SECRET>
```

Sends 24h and 1h push + in-app reminders for CONFIRMED/SCHEDULED appointments.

## 4. Push notifications (native)

- Uses **Expo Push API** (`ClientPushToken` table)
- Token registered on login (`register_push` action)
- Sent on book / cancel / reminders

**Requirements for production push:**
1. EAS project with `extra.eas.projectId` in `app.json` / `app.config.js`
2. iOS: APNs credentials in EAS
3. Android: FCM key in EAS

Web does not receive native push (skipped in code).

## 5. Favorites

| Action | Endpoint |
|--------|----------|
| List | `engagement` → `favorites` |
| Toggle | `engagement` → `favorite_toggle` |

UI: heart on home clinic cards, **Profil → Favoriler** screen.

## 6. Location

- `expo-location` + web `navigator.geolocation`
- Home **Konumunuzu paylaşın** banner when no coords
- Profile **Konumumu Güncelle** button
- Manual **Şehir** field still works as fallback

## 7. Redeploy web

```bash
cd mobile && npm run build:web
netlify deploy --dir=mobile/dist --site=2e9d371b-5692-4aac-81cf-1f78ba84a9b2
```

## Phase 4 checklist (this batch)

- [x] Push token registration + send on book/cancel
- [x] Reminders function (24h / 1h)
- [x] Favorites persist + Favorites screen
- [x] Location permission + profile/home UX
- [x] Reschedule flow (`booking` → `reschedule`, `RescheduleScreen`)
- [x] Auth placeholders removed (biometric/social)
- [x] Review moderation (profanity + links blocked server-side)
- [ ] Migration applied
- [ ] Functions deployed (`booking`, `catalog`, `engagement`, `reminders`)
- [ ] Reminders cron scheduled
- [ ] EAS push credentials for App Store / Play

**Still in ROADMAP:** payments (if in scope).

## Reschedule

| Action | Endpoint |
|--------|----------|
| Reschedule | `booking` → `reschedule` `{ appointmentId, date, startTime }` |
| Slots (exclude current) | `catalog` → `slots` + optional `excludeAppointmentId` |

UI: **Ertele** on home upcoming widget, appointments list, and `RescheduleScreen` (date + slot picker).

Push + in-app notification type: `BOOKING_RESCHEDULED`.
