import {
  requireAuth,
  createAdminClient,
  handlePreflight,
  makeResponder,
  getClientUser,
  newId,
  nowIso,
  clientIp,
} from "../_shared/auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { parseBody, registerBodySchema, updateProfileBodySchema } from "../_shared/validation.ts";
import { captureEdgeException, createLogger } from "../_shared/logger.ts";

const LEGAL_VERSION = "1.0";

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
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  const { json, error } = makeResponder(req);
  const log = createLogger(req);
  let userId: string | undefined;
  try {
    const admin = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;
    log.setAction(action ?? "unknown");

    if (action === "register") {
      const ip = clientIp(req);
      const limited = await checkRateLimit(admin, {
        bucket: `auth:register:${ip}`,
        limit: 5,
        windowSeconds: 3600,
      });
      if (!limited.allowed) return rateLimitResponse(limited.retryAfter, req);

      const parsed = parseBody(registerBodySchema, body, req);
      if (parsed instanceof Response) return parsed;
      const { fullName, email, phone, password } = parsed;
      const consentAt = nowIso();

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { fullName, phone },
      });
      if (createErr || !created.user) {
        const msg = createErr?.message ?? "";
        if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
          return json({ error: "email_taken", message: "Bu e-posta zaten kayıtlı. Lütfen giriş yapın." }, 409);
        }
        return json({ error: "create_failed", message: "Hesap oluşturulamadı. Lütfen tekrar deneyin." }, 400);
      }
      const id = newId();
      const { error: cuErr } = await admin.from("ClientUser").insert({
        id,
        authUserId: created.user.id,
        fullName,
        email,
        phone: phone || null,
        termsAcceptedAt: consentAt,
        privacyAcceptedAt: consentAt,
        healthDataConsentAt: consentAt,
        termsVersion: LEGAL_VERSION,
        privacyVersion: LEGAL_VERSION,
        createdAt: consentAt,
        updatedAt: consentAt,
      });
      if (cuErr) console.error("ClientUser insert failed", cuErr);
      return json({ ok: true, clientUserId: id });
    }

    const user = await requireAuth(req);
    userId = user.id;
    const limited = await checkRateLimit(admin, {
      bucket: `auth:user:${user.id}`,
      limit: 120,
      windowSeconds: 60,
    });
    if (!limited.allowed) return rateLimitResponse(limited.retryAfter, req);

    if (action === "get") {
      let cu = await getClientUser(admin, user.id);
      if (!cu) {
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
      return json({ clientUser: normalizeClientUser(cu as Record<string, unknown>) });
    }

    if (action === "update") {
      const parsed = parseBody(updateProfileBodySchema, body, req);
      if (parsed instanceof Response) return parsed;

      const cu = await getClientUser(admin, user.id);
      if (!cu) return json({ error: "not_found", message: "Profil bulunamadı." }, 404);
      const patch: Record<string, unknown> = { updatedAt: nowIso() };
      if (parsed.fullName) patch.fullName = parsed.fullName;
      if (parsed.phone !== undefined) patch.phone = parsed.phone || null;
      if (parsed.address !== undefined) patch.address = parsed.address || null;
      if (parsed.city !== undefined) patch.city = parsed.city || null;
      if (parsed.locationLat !== undefined) patch.locationLat = parsed.locationLat;
      if (parsed.locationLng !== undefined) patch.locationLng = parsed.locationLng;
      const { data: updated } = await admin
        .from("ClientUser")
        .update(patch)
        .eq("id", cu.id)
        .select("*")
        .single();
      return json({ clientUser: normalizeClientUser(updated as Record<string, unknown>) });
    }

    if (action === "export_data") {
      const cu = await getClientUser(admin, user.id);
      if (!cu) return json({ error: "not_found", message: "Profil bulunamadı." }, 404);

      const [{ data: appointments }, { data: notifications }, { data: reviews }] = await Promise.all([
        admin
          .from("Appointment")
          .select("id,date,startTime,endTime,status,price,notes,createdAt,businessId,serviceId,staffId")
          .eq("clientUserId", cu.id)
          .is("deletedAt", null),
        admin
          .from("ClientNotification")
          .select("id,type,title,message,isRead,createdAt,appointmentId")
          .eq("clientUserId", cu.id)
          .is("deletedAt", null),
        admin
          .from("Review")
          .select("id,rating,comment,createdAt,appointmentId")
          .eq("clientUserId", cu.id)
          .is("deletedAt", null),
      ]);

      return json({
        exportedAt: nowIso(),
        format: "asistan-data-export-v1",
        profile: normalizeClientUser(cu as Record<string, unknown>),
        appointments: appointments ?? [],
        notifications: notifications ?? [],
        reviews: reviews ?? [],
      });
    }

    if (action === "delete_account") {
      const cu = await getClientUser(admin, user.id);
      if (!cu) return json({ error: "not_found", message: "Profil bulunamadı." }, 404);

      const deletedAt = nowIso();
      const today = deletedAt.slice(0, 10);

      await admin
        .from("Appointment")
        .update({ status: "CANCELLED", updatedAt: deletedAt })
        .eq("clientUserId", cu.id)
        .in("status", ["SCHEDULED", "CONFIRMED"])
        .gte("date", today);

      await admin
        .from("ClientUser")
        .update({
          fullName: "Silinmiş Kullanıcı",
          email: null,
          phone: null,
          address: null,
          city: null,
          locationLat: null,
          locationLng: null,
          deletedAt,
          updatedAt: deletedAt,
        })
        .eq("id", cu.id);

      if (cu.authUserId) {
        const { error: authDelErr } = await admin.auth.admin.deleteUser(cu.authUserId);
        if (authDelErr) console.error("Auth user delete failed", authDelErr);
      }

      return json({ ok: true, deletedAt });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (err) {
    captureEdgeException(log, err, { userId });
    return error(err);
  } finally {
    log.finish({ userId });
  }
});
