# Phase 1 — Security Deployment Guide

Follow these steps after pulling Phase 1 security changes.

## 1. Rotate the service-role key (manual — required)

The service-role key was exposed during development. In the [Supabase Dashboard](https://supabase.com/dashboard):

1. **Project Settings → API → Service role** → Reset / rotate key
2. Update the secret everywhere it is stored:
   - Supabase Edge Function secrets (`SUPABASE_SERVICE_ROLE_KEY`)
   - Local `.env` (never commit)
   - CI/CD secrets if applicable

Confirm the key never appears in `mobile/` source or Netlify env vars (only `EXPO_PUBLIC_*` belongs there).

## 2. Run the database migration

Open **Supabase SQL Editor** and run:

```
supabase/migrations/20260619100000_phase1_security.sql
```

This creates:

- `EdgeFunctionRateLimit` table + `increment_rate_limit()` RPC
- `current_client_id()` helper
- RLS policies on client-facing tables

Verify with:

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('ClientUser','Appointment','Review');
```

## 3. Deploy edge functions

From the project root (with [Supabase CLI](https://supabase.com/docs/guides/cli) linked):

```bash
supabase functions deploy auth-client --no-verify-jwt
supabase functions deploy booking
supabase functions deploy catalog
supabase functions deploy engagement
```

Set function secrets if not already present:

```bash
supabase secrets set ALLOWED_ORIGINS=https://thunderous-liger-d1d41c.netlify.app,http://localhost:8081
```

(`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.)

## 4. Environment separation

| Environment | Supabase project | Mobile env file |
|-------------|------------------|-----------------|
| Development | staging (recommended) | `mobile/.env` |
| Production | production | Netlify env vars |

**Client (mobile / web):** only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Server (edge functions):** `SUPABASE_SERVICE_ROLE_KEY`, optional `ALLOWED_ORIGINS`

See `.env.example` (root) and `mobile/.env.example`.

## 5. Redeploy web client

```bash
cd mobile && npm run build:web
cd .. && netlify deploy --dir=mobile/dist --site=2e9d371b-5692-4aac-81cf-1f78ba84a9b2
# Promote to production (if --prod fails):
# netlify api restoreSiteDeploy with site_id + deploy_id
```

## Phase 1 exit checklist

- [ ] Service-role key rotated
- [x] Client exposes only `EXPO_PUBLIC_*` keys
- [ ] SQL migration applied (RLS + rate limit)
- [x] CORS allow-list in edge functions
- [x] Rate limiting code (register, book, cancel, auth)
- [x] Zod validation on function inputs
- [x] Production build fails without Supabase env
- [ ] Staging Supabase project created (recommended)
