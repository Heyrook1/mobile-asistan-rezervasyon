# Phase 5 — Testing & CI/CD Guide

Quality gates, automated tests, and release pipelines.

## 1. Mobile scripts (`mobile/`)

| Script | Purpose |
|--------|---------|
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint (expo flat config) |
| `npm run format` | Prettier check |
| `npm run test` | Jest unit tests |
| `npm run test:ci` | Jest with coverage (CI) |
| `npm run test:e2e` | Maestro critical path (device/simulator required) |

## 2. Backend scripts (`backend/`)

```bash
deno task test
```

Tests live in `backend/functions/_shared/*_test.ts` (slots, validation, moderation).

## 3. CI (GitHub Actions)

**`.github/workflows/ci.yml`** runs on every PR and push to `main`:

- Mobile: `typecheck` → `lint` → `test:ci`
- Backend: `deno task test`

Merge should be blocked until CI is green (enable branch protection in GitHub).

## 4. CD

### Web (Netlify)

**`.github/workflows/deploy-web.yml`** — triggers on `v*` tags or manual dispatch.

Required GitHub secrets:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID` (`2e9d371b-5692-4aac-81cf-1f78ba84a9b2`)

### Native (EAS)

**`.github/workflows/eas-release.yml`** — preview builds on `v*` tags.

Required secrets:

- `EXPO_TOKEN` (expo.dev account)

Configure project: `cd mobile && eas init` then update `app.json` `extra.eas.projectId`.

## 5. Maestro E2E

Flows in `mobile/.maestro/flows/`:

- `critical-path.yaml` — login (if needed) + home + appointments tab
- `auth-login.yaml` — email/password sign-in
- `booking-smoke.yaml` — post-login navigation smoke

Run locally (Expo Go or dev build running):

```bash
export MAESTRO_TEST_EMAIL=you@example.com
export MAESTRO_TEST_PASSWORD=your-password
cd mobile && npm run test:e2e
```

Extend flows for full book → cancel path once stable test clinic data exists.

## 6. Device matrix (manual QA)

Before store release, verify on:

- Small Android (720p)
- iPhone SE / mini
- iPhone Pro Max
- Tablet (optional)

## Phase 5 checklist

- [x] ESLint + Prettier + `typecheck` scripts
- [x] Jest unit tests (format, async, API client)
- [x] Deno tests (slots, validation, moderation)
- [x] Maestro E2E flow scaffolding
- [x] GitHub Actions CI
- [x] CD workflows (Netlify + EAS template)
- [ ] Enable GitHub branch protection requiring CI
- [ ] Add repo secrets for CD
- [ ] Run Maestro on real device before release
