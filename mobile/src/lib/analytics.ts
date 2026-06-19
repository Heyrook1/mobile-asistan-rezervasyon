import { config } from "./config";

export type AnalyticsEvent =
  | "search"
  | "provider_view"
  | "booking_start"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_rescheduled";

type EventProps = Record<string, string | number | boolean | null | undefined>;

const queue: { event: AnalyticsEvent; properties?: EventProps }[] = [];
let flushing = false;

export function trackEvent(event: AnalyticsEvent, properties?: EventProps): void {
  if (__DEV__) {
    console.log("[analytics]", event, properties ?? {});
  }
  queue.push({ event, properties: sanitizeProps(properties) });
  void flushQueue();
}

function sanitizeProps(props?: EventProps): EventProps | undefined {
  if (!props) return undefined;
  const out: EventProps = {};
  for (const [k, v] of Object.entries(props)) {
    if (v !== undefined) out[k] = v ?? null;
  }
  return Object.keys(out).length ? out : undefined;
}

async function flushQueue(): Promise<void> {
  if (flushing || !config.isConfigured || queue.length === 0) return;
  flushing = true;
  try {
    const { supabase } = await import("./supabase");
    const { isNetworkOnline } = await import("./network");
    if (!isNetworkOnline()) return;

    while (queue.length > 0) {
      const batch = queue.splice(0, 5);
      await Promise.all(
        batch.map((item) =>
          supabase.functions.invoke("engagement", {
            body: { action: "track", event: item.event, properties: item.properties ?? null },
          })
        )
      );
    }
  } catch {
    /* events stay queued for next attempt */
  } finally {
    flushing = false;
  }
}

/** Retry sending queued events when back online. */
export function flushAnalytics(): void {
  void flushQueue();
}
