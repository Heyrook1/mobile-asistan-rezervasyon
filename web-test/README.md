# Web Test Harness

This folder contains a tiny browser app to test your Supabase auth + edge functions without iOS/Xcode.

## What it tests

- `auth-client` register
- Supabase email/password sign-in
- `auth-client` profile get
- `catalog` discovery
- `booking` appointments list

## Setup env vars

Create `.env` in project root (or copy from `.env.example`):

```powershell
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Do **not** put service role key into browser/client usage.

## Run

From project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-web-test.ps1
```

Then open:

[http://localhost:5500/web-test/](http://localhost:5500/web-test/)

The script reads `.env`, generates `web-test/env.js`, then starts a local web server.

## Notes

- This is only a test harness, not the full app UI.
- If your edge functions are not deployed or CORS is restricted, function calls will fail.
- You can still override values manually in the UI and click **Save Config**.
