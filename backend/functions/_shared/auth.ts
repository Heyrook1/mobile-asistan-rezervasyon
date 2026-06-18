import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(err: unknown): Response {
  if (err instanceof AuthError) {
    return jsonResponse({ error: "unauthorized", message: "Oturum geçersiz. Lütfen tekrar giriş yapın." }, 401);
  }
  console.error("EdgeFunctionError:", err);
  const message = err instanceof Error ? err.message : "Bilinmeyen hata";
  return jsonResponse({ error: "internal", message }, 500);
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
