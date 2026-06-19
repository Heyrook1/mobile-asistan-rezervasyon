import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse } from "./auth.ts";

export interface RateLimitConfig {
  bucket: string;
  limit: number;
  windowSeconds: number;
}

export async function checkRateLimit(
  admin: SupabaseClient,
  config: RateLimitConfig,
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  const windowKey = Math.floor(Date.now() / (config.windowSeconds * 1000)).toString();
  const { data, error } = await admin.rpc("increment_rate_limit", {
    p_bucket: config.bucket,
    p_window_key: windowKey,
    p_limit: config.limit,
  });
  if (error) {
    console.error("Rate limit check failed (allowing request):", error);
    return { allowed: true };
  }
  if (data === true) return { allowed: true };
  const retryAfter = config.windowSeconds -
    (Math.floor(Date.now() / 1000) % config.windowSeconds);
  return { allowed: false, retryAfter };
}

export function rateLimitResponse(retryAfter: number, req?: Request): Response {
  return jsonResponse(
    {
      error: "rate_limited",
      message: "Çok fazla istek gönderdiniz. Lütfen bir süre sonra tekrar deneyin.",
      retryAfter,
    },
    429,
    req,
  );
}
