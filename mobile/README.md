# Asistan — Mobile App (Expo / React Native)

Production-ready cross-platform (iOS + Android) client for the Asistan booking
backend. It talks to the same Supabase project and edge functions
(`auth-client`, `catalog`, `booking`, `engagement`) as the native iOS app.

## Features

- Email/password auth (register + sign in) with persistent session
- Discovery home (nearby, available today, top rated, popular services)
- Search with sorting and "available today" filter
- Doctor detail with services and reviews
- Booking flow (service → date → time slot → confirm)
- My appointments (cancel + leave a review)
- Notifications (mark read / mark all read)
- Profile editing

## 1. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase **anon (public)** key:

```
EXPO_PUBLIC_SUPABASE_URL=https://bzluypnxoxliodzdhnmp.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Get the anon key from Supabase: **Project Settings → API → Project API keys → `anon` `public`**.

> Never put the `service_role` key here — it must stay server-side only.

## 2. Install dependencies

```bash
npm install
```

> This project targets **Expo SDK 54**, which matches the version of Expo Go
> currently available on the App Store and Google Play. This is what lets it
> open in Expo Go on physical iPhones and Android phones without TestFlight.

## 3. Run on your phone (works on any network via tunnel)

```bash
npx expo start --tunnel
```

1. Install the latest **Expo Go** from the App Store / Google Play.
2. Scan the QR code shown in the terminal:
   - Android: scan from inside the Expo Go app
   - iPhone: scan with the Camera app, then open in Expo Go
3. The app loads over the internet — your phone and PC do **not** need to be on
   the same Wi‑Fi.

Same Wi‑Fi only? You can use the faster LAN mode instead: `npx expo start`.

## 4. Production builds (app stores) with EAS

Cloud builds work from Windows for **both** iOS and Android (no Mac required):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # produces an .aab/.apk
eas build --platform ios       # requires an Apple Developer account
```

Then submit:

```bash
eas submit --platform android
eas submit --platform ios
```

## Project structure

```
src/
  api/         types + edge-function client
  components/  shared UI (cards, buttons, provider card)
  lib/         supabase client + env config
  navigation/  stack + tab navigators
  screens/     Auth, Home, Search, ProviderDetail, Booking, Appointments, Profile, Notifications
  state/       AuthContext (session + profile)
  utils/       formatting helpers
```
