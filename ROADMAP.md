# Asistan — Production Readiness Roadmap

> Healthcare reservation platform · Expo (SDK 54) React Native client + Supabase (Auth + Edge Functions) backend.
> Live web preview: https://thunderous-liger-d1d41c.netlify.app

This roadmap takes the current working prototype to a **store-ready, compliant, observable, and beautifully usable production product**. It covers security, compliance, reliability, feature completion, testing/CI, store release, **UI/UX excellence & accessibility**, performance, and scale. Items are ordered by priority. Each phase has clear exit criteria.

---

## 0. Current State (Baseline)

**What already works**
- Expo SDK 54 RN app (TypeScript), 5-tab navigation with center FAB, premium home redesign.
- Supabase email/password auth with `AsyncStorage` session persistence + foreground auto-refresh.
- 4 Edge Functions: `auth-client`, `booking`, `catalog`, `engagement`.
- JWT verification on every function (`requireAuth`) and Turkish, user-facing error messages.
- **Server-side slot re-validation** on booking (working hours, blocks, existing appointments) — prevents double-booking.
- Real-data discovery (nearby / available today / top rated), booking list/cancel, in-app notifications.
- Web build deployed to Netlify (`expo export -p web`).

**What blocks production** — addressed in the phases below.

---

## Phase 1 — Security & Secrets (BLOCKER, week 1)

Highest priority. The current model relies entirely on function-level checks with a service-role client that bypasses RLS.

- [ ] **Rotate the Supabase service-role key** (it was exposed during development) in Supabase dashboard → update edge function secrets. Confirm the key is **never** bundled client-side.
- [x] Verify only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are exposed to the client (`mobile/src/lib/config.ts`).
- [ ] **Enable Row Level Security (RLS)** on all tables as defense-in-depth. Even though edge functions use the service role, RLS protects against any future direct anon access. Write policies per table (ClientUser, Appointment, Business, Service, Review, Notification…). → Migration: `supabase/migrations/20260619100000_phase1_security.sql` (apply in dashboard).
- [x] **Restrict CORS** in `backend/functions/_shared/auth.ts` — replace `Access-Control-Allow-Origin: *` with an allow-list (web origin + app scheme). Configurable via `ALLOWED_ORIGINS` secret.
- [x] **Rate limiting** on edge functions, especially `booking` (book/cancel) and `auth-client` (register). Uses `EdgeFunctionRateLimit` table + `increment_rate_limit` RPC (see migration).
- [x] Remove the silent placeholder fallback in `supabase.ts` (`"https://placeholder.supabase.co"`) — fail loudly if env missing in production builds.
- [x] Add input validation/sanitization (e.g. `zod`) for every edge function body instead of ad-hoc casts. → `backend/functions/_shared/validation.ts`
- [ ] Secrets management: separate **staging** and **production** Supabase projects + env files; never commit `.env`. → See `docs/PHASE1_SECURITY.md`

**Exit criteria:** key rotated, RLS on for all tables, CORS locked down, rate limits live, validation on all function inputs.

> **Progress (2026-06-19):** Code shipped for CORS, zod validation, rate limiting, production env guard, and RLS migration SQL. Manual steps remain: rotate service-role key, run migration in Supabase, deploy edge functions. See [`docs/PHASE1_SECURITY.md`](docs/PHASE1_SECURITY.md).

---

## Phase 2 — Compliance & Legal (BLOCKER for stores, week 1–2)

Health data is sensitive personal data under **KVKK (Turkey)** and **GDPR**.

- [x] Privacy Policy + Terms of Service (Turkish + English), hosted and linked in-app and on the auth screen. → `mobile/src/legal/`, `LegalDocumentModal`
- [x] Explicit **consent flow** for processing health-related data (KVKK açık rıza) at registration.
- [x] **Account & data deletion** flow in-app (Apple App Store requirement) → `auth-client` `delete_account` + Profile UI.
- [x] Data export ("right to access") endpoint. → `auth-client` `export_data` + Profile UI.
- [x] Data retention policy + automated purge of `deletedAt` records after retention window. → `purge_deleted_client_data()` (schedule via pg_cron).
- [x] Cookie/analytics consent on web build. → `CookieConsentBanner` (essential cookies only).
- [x] Confirm encryption in transit (HTTPS — ✅) and at rest (Supabase default — verify), document it. → `docs/PHASE2_COMPLIANCE.md`

**Exit criteria:** policies live, consent + deletion + export shipped, retention job scheduled.

> **Progress (2026-06-19):** Code complete. Apply `supabase/migrations/20260619120000_phase2_compliance.sql`, deploy `auth-client`, schedule retention cron. See [`docs/PHASE2_COMPLIANCE.md`](docs/PHASE2_COMPLIANCE.md).

---

## Phase 3 — Reliability & Observability (week 2)

- [x] **Error boundary** at app root (`App.tsx`) with a friendly fallback screen + retry.
- [x] **Crash & error reporting** — integrate Sentry (`@sentry/react-native`) for client + `ClientErrorReport` fallback via `engagement` `report_error`.
- [x] **Structured logging** in edge functions (request id, user id, action, latency) beyond `console.error`. → `_shared/logger.ts`
- [x] **Product analytics** (privacy-respecting) — funnel events: search → view provider → start booking → confirmed. → `ProductAnalytics` table + `track` action.
- [x] **Offline / network handling** — detect connectivity, show offline banner, block API with clear message. → `NetworkContext`, `OfflineBanner`.
- [ ] **Uptime monitoring** + alerts on edge function 5xx rate and Supabase health. → Configure external monitor on `health` endpoint (see docs).
- [x] Health-check endpoint and synthetic booking test in monitoring. → `backend/functions/health` (synthetic E2E: use Maestro in Phase 5).

**Exit criteria:** crashes visible in Sentry, dashboards for booking funnel + error rates, graceful offline UX.

> **Progress (2026-06-19):** Code complete. Run Phase 3 migration, deploy `health` + `engagement`, set `EXPO_PUBLIC_SENTRY_DSN`, configure uptime monitor. See [`docs/PHASE3_OBSERVABILITY.md`](docs/PHASE3_OBSERVABILITY.md).

---

## Phase 4 — Core Feature Completion (week 2–4)

Replace placeholders with real functionality.

- [x] **Push notifications** — wire `expo-notifications`: register device token, store per-user, send on appointment confirm/remind/cancel from `engagement`/`booking`. Add iOS/Android permission flow.
- [x] **Appointment reminders** — scheduled function `reminders` (24h / 1h before) → push + in-app.
- [x] **Reschedule flow** — real reschedule (pick new slot, atomic move) instead of routing to Appointments list.
- [x] **Favorites** — persist via `ClientFavorite` + `engagement` actions; **Favorilerim** screen.
- [x] **Location** — `expo-location` + web geolocation; home prompt + profile update; city fallback.
- [x] **Voice search** — placeholder removed from home search bar (mic hidden).
- [x] **Biometric & social login** — placeholder buttons removed from auth screen.
- [x] **Reviews** — submit/display loop with server-side moderation (profanity + link blocking).
- [ ] **Payments** (if in scope) — decide model (pay-at-clinic vs in-app); if in-app, integrate iyzico/Stripe + receipts.

**Exit criteria:** no placeholder/"yakında" features remain in shipped build; notifications + reschedule fully working.

> **Progress (2026-06-19):** Push, favorites, location, reminders, reschedule, reviews moderation shipped in code. See [`docs/PHASE4_FEATURES.md`](docs/PHASE4_FEATURES.md). Remaining: payments (if in scope), deploy functions + migration.

---

## Phase 5 — Quality, Testing & CI/CD (week 3–4, parallel)

- [x] **Linting/formatting** — ESLint + Prettier config enforced; add `npm run lint` and `typecheck` scripts.
- [x] **Unit tests** — Jest + tests for utils (`format.ts`, `async.ts`), API client error handling.
- [x] **Edge function tests** — Deno test for slot logic, validation schemas, review moderation.
- [x] **E2E tests** — Maestro flows for auth + post-login smoke (`mobile/.maestro/flows/`).
- [x] **CI pipeline** (GitHub Actions): on PR run typecheck + lint + tests; block merge on failure (enable branch protection).
- [x] **CD**: automate web deploy (Netlify) and EAS build on tagged releases (`deploy-web.yml`, `eas-release.yml`).
- [ ] Test on real devices across screen sizes (small Android, iPhone SE → Pro Max, tablets).

**Exit criteria:** green CI required to merge; critical-path E2E passing; one-command release.

> **Progress (2026-06-19):** Tooling + tests + CI/CD workflows shipped. See [`docs/PHASE5_TESTING.md`](docs/PHASE5_TESTING.md). Manual: GitHub secrets, branch protection, Maestro on device.

---

## Phase 6 — Native App Store Release (week 4–5)

- [ ] **EAS Build** config (`eas.json`) for iOS + Android release builds (managed workflow; the bare `ios/` folder should be reconciled or removed).
- [ ] App icons, splash, and store screenshots using the **official Asistan brand** only.
- [ ] iOS permission usage strings (`NSLocationWhenInUseUsageDescription`, notifications, microphone if voice) in `app.json`.
- [ ] Android adaptive icon ✅ present — verify all densities; set `versionCode`/`buildNumber` strategy.
- [ ] App Store Connect + Google Play listings (TR + EN), age rating, data-safety / privacy nutrition labels.
- [ ] **EAS Submit** to TestFlight + Play Internal Testing → closed beta → production.
- [ ] OTA strategy via EAS Update for JS-only hotfixes.

**Exit criteria:** signed builds in TestFlight + Play Internal track, store metadata complete.

---

## Phase 6.5 — UI / UX Excellence (week 3–5, parallel)

Elevate from "good-looking prototype" to a **trustworthy, world-class healthcare experience**. Healthcare apps live or die on perceived trust, clarity, and speed.

### 6.5.1 Design System & Tokens
- [ ] Formalize **design tokens** beyond `theme.ts`: color (incl. semantic roles — success/warning/danger/info), spacing scale, radii, elevation/shadow, typography ramp, motion durations/easings. Single source of truth.
- [ ] **Typography system** — define a type scale (display/title/body/caption), line-heights, and a font strategy (system vs custom brand font); enforce min body size 14–16px for accessibility.
- [ ] **Component library** — extract reusable primitives (Button variants, Input, Card, Badge, Chip, Sheet, Modal, Toast, Skeleton, Avatar, Rating). Document states (default/hover/press/focus/disabled/loading).
- [ ] **Iconography** — consistent icon set (Ionicons today); audit for consistent weight/size; replace emoji used as UI icons (categories, trust badges) with vector icons for crisp rendering and theming.
- [ ] **Logo usage guide** — enforce official Asistan logo only; clear-space, min size, and approved backgrounds (the dark-box logo issue is documented).

### 6.5.2 UX Audit & Information Architecture
- [ ] End-to-end **heuristic evaluation** (Nielsen's 10) of every screen; log issues with severity.
- [ ] **Task-flow review** for the money path: discover → provider → select service → pick slot → confirm → manage. Minimize taps; aim for the "60-second booking" promise to be literally true and measured.
- [ ] **Navigation model** — validate the 5-tab + center FAB IA with users; ensure back/cancel behavior is predictable; deep-link strategy (open appointment from push).
- [ ] **Content & microcopy** — professional, reassuring Turkish tone; consistent terminology; error messages that say what happened + how to fix.

### 6.5.3 State, Feedback & Edge Cases
- [ ] Design all **screen states**: loading (skeletons ✅ exist), empty, error, offline, partial/slow, success. No dead-ends.
- [ ] **Optimistic UI** + clear feedback for book/cancel/reschedule; confirmation + undo where safe.
- [ ] **Form UX** — inline validation, proper keyboard types, autofill, password rules visible, error recovery (login/register already partial).
- [ ] **Toasts/snackbars** for non-blocking feedback; reserve modals/alerts for decisions.
- [ ] Booking conflict UX — the server's "slot just filled (409)" must surface gracefully with a suggested next slot.

### 6.5.4 Onboarding & First-Run
- [ ] Lightweight **onboarding** (2–3 screens) communicating value: find specialists, book in seconds, manage appointments. Skippable.
- [ ] **Permission priming** — explain *why* before asking for location/notifications (system prompt right after).
- [ ] **Empty home for new users** — helpful first-time state (popular categories, "set your location") instead of blank sections.

### 6.5.5 Visual Polish & Motion
- [ ] **Micro-interactions** — button press ripple/scale, card elevation on press (present), tab indicator animation (present), pull-to-refresh styling.
- [ ] **Motion guidelines** — consistent durations/easing; honor `prefers-reduced-motion` / Reduce Motion.
- [ ] **Dark mode** — full dark theme using semantic tokens (`userInterfaceStyle` currently `light`).
- [ ] **Haptics** on key actions (booking confirmed, errors) via `expo-haptics`.
- [ ] **Glass/gradient accents** applied tastefully and consistently (avoid over-use).

### 6.5.6 Accessibility (WCAG 2.2 AA)
- [ ] Color contrast AA for text and interactive elements (verify teal-on-white, white-on-gradient).
- [ ] `accessibilityLabel`/`accessibilityRole`/state on all interactive elements; logical focus order.
- [ ] **Dynamic Type / font scaling** support without layout breakage.
- [ ] Min **44×44pt touch targets**; one-handed reachability (FAB + bottom nav already help).
- [ ] Screen-reader pass (VoiceOver/TalkBack) on critical flows; fix web `aria-hidden`/focus warnings.
- [ ] Respect Reduce Motion / Reduce Transparency.

### 6.5.7 Research & Validation
- [ ] **Usability testing** (5–7 users) on the booking flow; measure task success, time-on-task, errors.
- [ ] **Trust testing** — does the design feel credible for a health product? Iterate on trust signals (verified badges, real reviews, secure-booking cues).
- [ ] A/B test high-impact surfaces (home hero CTA, category layout) once analytics from Phase 3 are live.
- [ ] Establish a recurring design QA checklist in PR review.

**Exit criteria:** documented design system + component library, AA accessibility pass, dark mode shipped, every screen has loading/empty/error/offline states, usability test success rate ≥ 90% on the booking flow, "60-second booking" verified with real timing.

---

## Phase 7 — Performance & Polish (ongoing)

- [ ] **Web bundle splitting** — current single chunk ~1.94 MB; enable code splitting / lazy routes for web.
- [ ] **Image optimization** — cached, sized clinic/provider images (`expo-image`), placeholders, CDN.
- [ ] **List virtualization** — ensure long lists use `FlatList`/`FlashList`, not `ScrollView.map`.
- [ ] **Accessibility audit** — labels, contrast (WCAG AA), dynamic font scaling, screen-reader pass; fix the web `aria-hidden`/focus warnings from react-navigation.
- [ ] **i18n** — externalize strings (currently hard-coded Turkish) to support future locales.
- [ ] Micro-animation polish + reduced-motion support.

---

## Phase 8 — Scale & Operations (post-launch)

- [ ] Database indexes for discovery queries (geo distance, rating, availability) + load testing.
- [ ] Caching layer for catalog/discovery (edge cache / materialized views).
- [ ] Backups + point-in-time recovery verified; disaster-recovery runbook.
- [ ] On-call/alerting rotation; incident runbook.
- [ ] Cost monitoring (Supabase, Netlify, push, storage).
- [ ] Feature flags for safe rollout.

---

## Suggested Timeline

| Weeks | Focus |
|------|-------|
| 1 | Phase 1 (Security) + start Phase 2 (Compliance) + start design system (6.5.1) |
| 2 | Finish Phase 2, Phase 3 (Observability), start Phase 4 + UX audit (6.5.2) |
| 3 | Phase 4 (features) + Phase 5 (tests/CI) + UI/UX states & onboarding (6.5.3–6.5.4) in parallel |
| 4 | Finish Phase 4/5, Phase 6 (EAS builds, beta) + visual polish & a11y (6.5.5–6.5.6) |
| 5 | Store submission, usability testing (6.5.7), Phase 7 polish |
| Post | Phase 7 ongoing + Phase 8 scale + design iteration from analytics |

## Definition of Done (Production Launch)
1. Service-role key rotated; RLS enabled; CORS locked; rate limiting live.
2. Privacy/Terms published; consent, account deletion, and data export shipped.
3. Crash reporting + analytics + offline handling in place.
4. No placeholder features; push notifications + reschedule working.
5. Green CI gate; critical-path E2E passing.
6. Signed iOS/Android builds submitted; store metadata + privacy labels complete.
7. **Design system + component library documented; dark mode shipped.**
8. **Accessibility WCAG 2.2 AA pass (contrast, labels, dynamic type, 44pt targets, screen-reader).**
9. **Every screen has loading/empty/error/offline states; no dead-ends.**
10. **Usability test ≥ 90% task success on booking; "60-second booking" verified with real timing.**
11. Web bundle optimized (code splitting, image optimization).
