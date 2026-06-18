import {
  requireAuth, createAdminClient, corsHeaders, jsonResponse, errorResponse,
  getClientUser, newId, nowIso,
} from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await requireAuth(req);
    const admin = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    const cu = await getClientUser(admin, user.id);
    if (!cu) return jsonResponse({ error: "no_profile", message: "Profil bulunamadı." }, 404);

    if (action === "notifications") {
      const { data: notifs } = await admin
        .from("ClientNotification")
        .select("id,type,title,message,link,isRead,readAt,createdAt,appointmentId,businessId,Business(name,logoUrl,primaryColor)")
        .eq("clientUserId", cu.id)
        .is("deletedAt", null)
        .order("createdAt", { ascending: false })
        .limit(100);
      const list = notifs ?? [];
      const unread = list.filter((n) => !n.isRead).length;
      return jsonResponse({ notifications: list, unread });
    }

    if (action === "mark_read") {
      const id = body.id as string;
      await admin.from("ClientNotification").update({ isRead: true, readAt: nowIso() }).eq("id", id).eq("clientUserId", cu.id);
      return jsonResponse({ ok: true });
    }

    if (action === "mark_all_read") {
      await admin.from("ClientNotification").update({ isRead: true, readAt: nowIso() }).eq("clientUserId", cu.id).eq("isRead", false);
      return jsonResponse({ ok: true });
    }

    if (action === "review") {
      const appointmentId = body.appointmentId as string;
      const rating = Math.max(1, Math.min(5, parseInt(String(body.rating ?? 0), 10)));
      const comment = (body.comment ?? "").toString().trim() || null;
      const serviceQuality = body.serviceQuality != null ? Math.max(1, Math.min(5, parseInt(String(body.serviceQuality), 10))) : null;
      const waitingTime = body.waitingTime != null ? Math.max(1, Math.min(5, parseInt(String(body.waitingTime), 10))) : null;
      const communication = body.communication != null ? Math.max(1, Math.min(5, parseInt(String(body.communication), 10))) : null;

      const { data: appt } = await admin
        .from("Appointment")
        .select("id,clientUserId,businessId,staffId,serviceId,status,patientId")
        .eq("id", appointmentId)
        .maybeSingle();
      if (!appt || appt.clientUserId !== cu.id) {
        return jsonResponse({ error: "not_found", message: "Randevu bulunamadı." }, 404);
      }
      if (appt.status !== "COMPLETED") {
        return jsonResponse({ error: "not_completed", message: "Yalnızca tamamlanan randevular değerlendirilebilir." }, 400);
      }
      const { data: existing } = await admin.from("Review").select("id").eq("appointmentId", appointmentId).is("deletedAt", null).maybeSingle();
      if (existing) return jsonResponse({ error: "already_reviewed", message: "Bu randevu için zaten değerlendirme yaptınız." }, 409);

      const { error: insErr } = await admin.from("Review").insert({
        id: newId(),
        businessId: appt.businessId,
        appointmentId,
        clientUserId: cu.id,
        patientId: appt.patientId,
        staffId: appt.staffId,
        serviceId: appt.serviceId,
        rating,
        serviceQuality,
        waitingTime,
        communication,
        comment,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      if (insErr) {
        console.error("Review insert failed", insErr);
        return jsonResponse({ error: "review_failed", message: "Değerlendirme kaydedilemedi." }, 500);
      }
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "unknown_action" }, 400);
  } catch (err) {
    return errorResponse(err);
  }
});
