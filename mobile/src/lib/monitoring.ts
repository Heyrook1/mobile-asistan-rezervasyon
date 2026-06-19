import { Platform } from "react-native";
import { config } from "./config";

type SentryModule = typeof import("@sentry/react-native");

let sentry: SentryModule | null = null;
let initialized = false;

export async function initMonitoring(): Promise<void> {
  if (initialized || !config.sentryDsn) return;
  try {
    sentry = await import("@sentry/react-native");
    sentry.init({
      dsn: config.sentryDsn,
      tracesSampleRate: 0.15,
      enableAutoSessionTracking: true,
      environment: __DEV__ ? "development" : "production",
    });
    initialized = true;
  } catch (e) {
    if (__DEV__) console.warn("Sentry init skipped:", e);
  }
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  if (__DEV__) console.error("[monitoring]", err, context);

  sentry?.captureException(err, { extra: context });

  void reportErrorToBackend({
    message: err.message,
    stack: err.stack ?? null,
    context,
    platform: Platform.OS,
  });
}

export function captureMessage(message: string, context?: Record<string, unknown>): void {
  if (__DEV__) console.log("[monitoring]", message, context);
  sentry?.captureMessage(message, { extra: context });
}

async function reportErrorToBackend(input: {
  message: string;
  stack: string | null;
  context?: Record<string, unknown>;
  platform: string;
}): Promise<void> {
  if (!config.isConfigured) return;
  try {
    const { supabase } = await import("./supabase");
    await supabase.functions.invoke("engagement", {
      body: {
        action: "report_error",
        message: input.message,
        stack: input.stack,
        context: input.context ?? null,
        platform: input.platform,
      },
    });
  } catch {
    /* best-effort */
  }
}
