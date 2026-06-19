import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://thunderous-liger-d1d41c.netlify.app",
  "http://localhost:8081",
  "http://localhost:19006",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19006",
];

function allowedOrigins(): string[] {
  const extra = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...extra])];
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;
  return allowedOrigins().includes(origin);
}

export function resolveCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
  if (!origin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigins()[0];
    return headers;
  }
  if (isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

/** @deprecated Use handlePreflight + resolveCorsHeaders(req) */
export const corsHeaders = {
  "Access-Control-Allow-Origin": DEFAULT_ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function handlePreflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  const origin = req.headers.get("Origin");
  if (origin && !isOriginAllowed(origin)) {
    return new Response("Forbidden", { status: 403 });
  }
  return new Response("ok", { headers: resolveCorsHeaders(req) });
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthUser {
  id: string;
  email?: string;
}

/** Verify the native Supabase Auth JWT from the request and return the user. */
export async function requireAuth(req: Request): Promise<AuthUser> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) throw new AuthError("Missing Authorization header");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new AuthError("Unauthorized");
  return { id: user.id, email: user.email ?? undefined };
}

/** Service-role client — bypasses RLS. Used for all data access from edge functions. */
export function createAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function jsonResponse(body: unknown, status = 200, req?: Request): Response {
  const headers: Record<string, string> = {
    ...(req ? resolveCorsHeaders(req) : corsHeaders),
    "Content-Type": "application/json",
  };
  return new Response(JSON.stringify(body), { status, headers });
}

export function errorResponse(err: unknown, req?: Request): Response {
  if (err instanceof AuthError) {
    return jsonResponse(
      { error: "unauthorized", message: "Oturum geçersiz. Lütfen tekrar giriş yapın." },
      401,
      req,
    );
  }
  console.error("EdgeFunctionError:", err);
  const message = err instanceof Error ? err.message : "Bilinmeyen hata";
  return jsonResponse({ error: "internal", message }, 500, req);
}

export function makeResponder(req: Request) {
  return {
    json: (body: unknown, status = 200) => jsonResponse(body, status, req),
    error: (err: unknown) => errorResponse(err, req),
  };
}

export function newId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Returns the ClientUser row for the given auth user id, or null. */
export async function getClientUser(admin: SupabaseClient, authUserId: string) {
  const { data, error } = await admin
    .from("ClientUser")
    .select("*")
    .eq("authUserId", authUserId)
    .is("deletedAt", null)
    .maybeSingle();
  if (error) throw error;
  return data as ClientUserRow | null;
}

export interface ClientUserRow {
  id: string;
  authUserId: string | null;
  fullName: string;
  phone: string | null;
  email: string | null;
  locationLat: number | null;
  locationLng: number | null;
  address: string | null;
  city: string | null;
}
