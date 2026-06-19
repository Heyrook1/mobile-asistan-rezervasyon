const url = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").trim();
const anonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const sentryDsn = (process.env.EXPO_PUBLIC_SENTRY_DSN ?? "").trim();

export const config = {
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  sentryDsn,
  isConfigured: Boolean(url && anonKey),
  monitoringEnabled: Boolean(sentryDsn),
};
