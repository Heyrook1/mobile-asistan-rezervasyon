import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/** Send Expo push notifications to all active tokens for a client user. */
export async function sendExpoPushToClient(
  admin: SupabaseClient,
  clientUserId: string,
  payload: PushPayload,
): Promise<void> {
  const { data: rows } = await admin
    .from("ClientPushToken")
    .select("token")
    .eq("clientUserId", clientUserId)
    .is("deletedAt", null);

  const tokens = (rows ?? []).map((r) => r.token as string).filter(Boolean);
  if (tokens.length === 0) return;

  const messages = tokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: "default",
    priority: "high",
  }));

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Expo push failed", res.status, text);
    }
  } catch (e) {
    console.error("Expo push error", e);
  }
}
