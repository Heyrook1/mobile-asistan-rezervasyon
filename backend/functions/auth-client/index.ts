import {
  requireAuth, createAdminClient, corsHeaders, jsonResponse, errorResponse,
  getClientUser, newId, nowIso,
} from "../_shared/auth.ts";

function normalizeClientUser(cu: Record<string, unknown> | null) {
  if (!cu) return null;
  return {
    id: cu.id,
    authUserId: cu.authUserId ?? null,
    fullName: cu.fullName,
    phone: cu.phone ?? null,
    email: cu.email ?? null,
    address: cu.address ?? null,
    city: cu.city ?? null,
    locationLat: cu.locationLat != null ? Number(cu.locationLat) : null,
    locationLng: cu.locationLng != null ? Number(cu.locationLng) : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    // Public: create account (auto-confirmed) + ClientUser row.
    if (action === "register") {
      const fullName = (body.fullName ?? "").trim();
      const email = (body.email ?? "").trim().toLowerCase();
      const phone = (body.phone ?? "").trim();
      const password = body.password ?? "";
      if (!fullName || !email || !password) {
        return jsonResponse({ error: "validation", message: "Ad, e-posta ve şifre zorunludur." }, 400);
      }
      if (password.length < 6) {
        return jsonResponse({ error: "validation", message: "Şifre en az 6 karakter olmalıdır." }, 400);
      }
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { fullName, phone },
      });
      if (createErr || !created.user) {
        const msg = createErr?.message ?? "";
        if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
          return jsonResponse({ error: "email_taken", message: "Bu e-posta zaten kayıtlı. Lütfen giriş yapın." }, 409);
        }
        return jsonResponse({ error: "create_failed", message: "Hesap oluşturulamadı. Lütfen tekrar deneyin." }, 400);
      }
      const id = newId();
      const { error: cuErr } = await admin.from("ClientUser").insert({
        id,
        authUserId: created.user.id,
        fullName,
        email,
        phone: phone || null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      if (cuErr) {
        console.error("ClientUser insert failed", cuErr);
      }
      return jsonResponse({ ok: true, clientUserId: id });
    }

    // Authenticated below
    const user = await requireAuth(req);

    if (action === "get") {
      let cu = await getClientUser(admin, user.id);
      if (!cu) {
        // Auto-provision a ClientUser if missing (e.g. created out-of-band).
        const meta = (body.metadata ?? {}) as { fullName?: string; phone?: string };
        const id = newId();
        const { data: inserted } = await admin
          .from("ClientUser")
          .insert({
            id,
            authUserId: user.id,
            fullName: meta.fullName?.trim() || (user.email ? user.email.split("@")[0] : "Kullanıcı"),
            email: user.email ?? null,
            phone: meta.phone?.trim() || null,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          })
          .select("*")
          .single();
        cu = inserted as typeof cu;
      }
      return jsonResponse({ clientUser: normalizeClientUser(cu as Record<string, unknown>) });
    }

    if (action === "update") {
      const cu = await getClientUser(admin, user.id);
      if (!cu) return jsonResponse({ error: "not_found", message: "Profil bulunamadı." }, 404);
      const patch: Record<string, unknown> = { updatedAt: nowIso() };
      if (typeof body.fullName === "string" && body.fullName.trim()) patch.fullName = body.fullName.trim();
      if (typeof body.phone === "string") patch.phone = body.phone.trim() || null;
      if (typeof body.address === "string") patch.address = body.address.trim() || null;
      if (typeof body.city === "string") patch.city = body.city.trim() || null;
      if (typeof body.locationLat === "number") patch.locationLat = body.locationLat;
      if (typeof body.locationLng === "number") patch.locationLng = body.locationLng;
      const { data: updated } = await admin
        .from("ClientUser")
        .update(patch)
        .eq("id", cu.id)
        .select("*")
        .single();
      return jsonResponse({ clientUser: normalizeClientUser(updated as Record<string, unknown>) });
    }

    return jsonResponse({ error: "unknown_action" }, 400);
  } catch (err) {
    return errorResponse(err);
  }
});
