# Phase 3 — Reliability & Observability

## 1. Database migration

Run in Supabase SQL Editor:

```
supabase/migrations/20260619140000_phase3_observability.sql
```

Creates `ProductAnalytics` and `ClientErrorReport` tables.

## 2. Deploy edge functions

```bash
supabase functions deploy health --no-verify-jwt
supabase functions deploy engagement
supabase functions deploy auth-client booking catalog
```

### Health check (uptime monitoring)

Public endpoint (no JWT):

```
GET https://<project-ref>.supabase.co/functions/v1/health
```

Expected `200` body:

```json
{ "status": "ok", "service": "asistan-edge", "db": "up", "latencyMs": 42 }
```

**UptimeRobot / Better Stack / Pingdom:** poll every 5 min; alert on non-200 or `db: "down"`.

## 3. Sentry (optional but recommended)

1. Create a project at [sentry.io](https://sentry.io)
2. Add to `mobile/.env` and Netlify env:

```
EXPO_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

3. Rebuild web / EAS native builds (Sentry plugin is in `app.json`)

Errors are also stored in `ClientErrorReport` when backend is reachable (fallback without Sentry).

## 4. Product analytics funnel

Events stored in `ProductAnalytics`:

| Event | When |
|-------|------|
| `search` | User runs search |
| `provider_view` | Doctor detail opened |
| `booking_start` | Booking wizard opened |
| `booking_confirmed` | Appointment created |
| `booking_cancelled` | User cancels appointment |

Query funnel in Supabase SQL:

```sql
SELECT event, COUNT(*) AS n, DATE("createdAt") AS day
FROM "ProductAnalytics"
WHERE "createdAt" > now() - interval '7 days'
GROUP BY 1, 3
ORDER BY 3 DESC, 2 DESC;
```

## 5. Structured edge logs

All functions emit JSON logs via `_shared/logger.ts`:

```json
{"level":"info","requestId":"abc","action":"book","latencyMs":120,"userId":"..."}
```

View in Supabase Dashboard → Edge Functions → Logs. Filter by `requestId` for tracing.

## 6. Client reliability features

| Feature | Location |
|---------|----------|
| Error boundary + retry | `ErrorBoundary.tsx` |
| Offline banner | `OfflineBanner.tsx` + `NetworkContext` |
| Offline API guard | `api/client.ts` |
| Cookie consent (web) | `CookieConsentBanner.tsx` |

## 7. Redeploy web

```bash
cd mobile && npm run build:web
netlify deploy --dir=mobile/dist --site=2e9d371b-5692-4aac-81cf-1f78ba84a9b2
```

## Phase 3 exit checklist

- [x] Error boundary with friendly fallback
- [x] Sentry integration (optional via `EXPO_PUBLIC_SENTRY_DSN`)
- [x] Structured JSON logging in edge functions
- [x] Product analytics funnel events
- [x] Offline detection + banner + API messages
- [x] Health-check endpoint
- [ ] Migration applied in production
- [ ] `health` + `engagement` deployed
- [ ] Sentry DSN configured
- [ ] External uptime monitor on `/functions/v1/health`
- [ ] Synthetic booking test (manual or scheduled E2E)
