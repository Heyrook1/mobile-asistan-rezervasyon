# Phase 2 — Compliance & Legal Deployment Guide

KVKK / GDPR compliance features shipped in code. Complete the manual steps below.

## 1. Run database migration

In Supabase SQL Editor, run **after** Phase 1 migration:

```
supabase/migrations/20260619120000_phase2_compliance.sql
```

Adds consent audit columns on `ClientUser` and `purge_deleted_client_data()` for 30-day retention.

### Schedule retention job (recommended)

If `pg_cron` is enabled on your Supabase plan:

```sql
SELECT cron.schedule(
  'purge-deleted-clients',
  '0 3 * * *',
  $$SELECT public.purge_deleted_client_data()$$
);
```

Otherwise run manually weekly or use an external scheduler hitting a future admin endpoint.

## 2. Deploy updated `auth-client` edge function

```bash
supabase functions deploy auth-client --no-verify-jwt
```

New actions:

| Action | Auth | Description |
|--------|------|-------------|
| `register` | Public | Requires `acceptedTerms`, `acceptedPrivacy`, `acceptedHealthData` (all `true`) |
| `export_data` | JWT | Returns JSON bundle (profile, appointments, notifications, reviews) |
| `delete_account` | JWT | Soft-deletes profile, cancels future appointments, deletes auth user |

## 3. Redeploy web client

```bash
cd mobile && npm run build:web
cd .. && netlify deploy --dir=mobile/dist --site=2e9d371b-5692-4aac-81cf-1f78ba84a9b2
```

## 4. Encryption documentation

| Layer | Status |
|-------|--------|
| **In transit** | TLS 1.2+ (HTTPS) on Netlify web + Supabase API |
| **At rest** | Supabase Postgres AES-256 disk encryption (platform default) |
| **Sessions** | Supabase Auth JWT; stored in AsyncStorage / localStorage |

Document this in App Store / Play Data Safety forms.

## 5. Legal documents

In-app (TR + EN): `mobile/src/legal/index.ts`

- Privacy Policy v1.0
- Terms of Service v1.0
- KVKK health data explicit consent text

**Before store launch:** have a qualified lawyer review and customize contact emails (`support@asistan.app` placeholder).

## 6. User-facing flows

| Flow | Location |
|------|----------|
| Registration consent | Auth screen — 3 required checkboxes |
| Policy links | Auth footer + Profile → Gizlilik & Hesap |
| Data export | Profile → Verilerimi İndir |
| Account deletion | Profile → Hesabımı Sil |
| Cookie banner | Web only — essential cookies only, no tracking |

## Phase 2 exit checklist

- [x] Privacy + Terms in-app (TR/EN)
- [x] KVKK explicit consent at registration
- [x] Account deletion edge function + UI
- [x] Data export endpoint + UI
- [x] Retention function (30 days post soft-delete)
- [x] Web cookie consent banner
- [x] Encryption documented
- [ ] Migration applied in production Supabase
- [ ] `auth-client` deployed to production
- [ ] Legal text reviewed by counsel
- [ ] pg_cron retention job scheduled
