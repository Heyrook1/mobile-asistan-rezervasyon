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
import { parseBody, markReadBodySchema, reviewBodySchema, trackEventBodySchema, reportErrorBodySchema, registerPushBodySchema, favoriteToggleBodySchema } from "../_shared/validation.ts";
import { captureEdgeException, createLogger } from "../_shared/logger.ts";
import { moderateReviewComment } from "../_shared/moderation.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  const { json, error } = makeResponder(req);
  const log = createLogger(req);
  let userId: string | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    const action = (body.action as string) ?? "unknown";
    log.setAction(action);

    if (action === "report_error") {
      const ip = clientIp(req);
      const limited = await checkRateLimit(createAdminClient(), {
        bucket: `engagement:report:${ip}`,
        limit: 30,
        windowSeconds: 3600,
      });
      if (!limited.allowed) return rateLimitResponse(limited.retryAfter, req);

      const parsed = parseBody(reportErrorBodySchema, body, req);
      if (parsed instanceof Response) return parsed;

      const admin = createAdminClient();
      let clientUserId: string | null = null;
      try {
        const user = await requireAuth(req);
        userId = user.id;
        const cu = await getClientUser(admin, user.id);
        clientUserId = cu?.id ?? null;
      } catch {
        /* anonymous error report */
      }

      await admin.from("ClientErrorReport").insert({
        id: newId(),
        clientUserId,
        message: parsed.message.slice(0, 2000),
        stack: parsed.stack?.slice(0, 8000) ?? null,
        context: parsed.context ?? null,
        platform: parsed.platform ?? "unknown",
        createdAt: nowIso(),
      });
      log.info("error_reported", { clientUserId });
      return json({ ok: true });
    }

    const user = await requireAuth(req);
    userId = user.id;
    const admin = createAdminClient();
    const cu = await getClientUser(admin, user.id);

    if (action === "track") {
      const parsed = parseBody(trackEventBodySchema, body, req);
      if (parsed instanceof Response) return parsed;
      await admin.from("ProductAnalytics").insert({
        id: newId(),
        clientUserId: cu?.id ?? null,
        event: parsed.event,
        properties: parsed.properties ?? null,
        createdAt: nowIso(),
      });
      log.info("event_tracked", { event: parsed.event, clientUserId: cu?.id });
      return json({ ok: true });
    }

    if (!cu) return json({ error: "no_profile", message: "Profil bulunamadı." }, 404);

    if (action === "register_push") {
      const parsed = parseBody(registerPushBodySchema, body, req);
      if (parsed instanceof Response) return parsed;
      const { data: existing } = await admin
        .from("ClientPushToken")
        .select("id")
        .eq("token", parsed.token)
        .maybeSingle();
      const ts = nowIso();
      if (existing) {
        await admin
          .from("ClientPushToken")
          .update({
            clientUserId: cu.id,
            platform: parsed.platform,
            updatedAt: ts,
            deletedAt: null,
          })
          .eq("id", existing.id);
      } else {
        await admin.from("ClientPushToken").insert({
          id: newId(),
          clientUserId: cu.id,
          token: parsed.token,
          platform: parsed.platform,
          createdAt: ts,
          updatedAt: ts,
        });
      }
      return json({ ok: true });
    }

    if (action === "favorites") {
      const { data: rows } = await admin
        .from("ClientFavorite")
        .select("businessId,createdAt,Business(id,name,logoUrl,primaryColor,city,address)")
        .eq("clientUserId", cu.id)
        .order("createdAt", { ascending: false });
      return json({ favorites: rows ?? [] });
    }

    if (action === "favorite_toggle") {
      const parsed = parseBody(favoriteToggleBodySchema, body, req);
      if (parsed instanceof Response) return parsed;
      const { data: existing } = await admin
        .from("ClientFavorite")
        .select("id")
        .eq("clientUserId", cu.id)
        .eq("businessId", parsed.businessId)
        .maybeSingle();
      if (existing) {
        await admin.from("ClientFavorite").delete().eq("id", existing.id);
        return json({ favorited: false });
      }
      await admin.from("ClientFavorite").insert({
        id: newId(),
        clientUserId: cu.id,
        businessId: parsed.businessId,
        createdAt: nowIso(),
      });
      return json({ favorited: true });
    }

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
      return json({ notifications: list, unread });
    }

    if (action === "mark_read") {
      const parsed = parseBody(markReadBodySchema, body, req);
      if (parsed instanceof Response) return parsed;
      await admin
        .from("ClientNotification")
        .update({ isRead: true, readAt: nowIso() })
        .eq("id", parsed.id)
        .eq("clientUserId", cu.id);
      return json({ ok: true });
    }

    if (action === "mark_all_read") {
      await admin
        .from("ClientNotification")
        .update({ isRead: true, readAt: nowIso() })
        .eq("clientUserId", cu.id)
        .eq("isRead", false);
      return json({ ok: true });
    }

    if (action === "review") {
      const parsed = parseBody(reviewBodySchema, body, req);
      if (parsed instanceof Response) return parsed;
      const { appointmentId, rating, comment, serviceQuality, waitingTime, communication } = parsed;

      const { data: appt } = await admin
        .from("Appointment")
        .select("id,clientUserId,businessId,staffId,serviceId,status,patientId")
        .eq("id", appointmentId)
        .maybeSingle();
      if (!appt || appt.clientUserId !== cu.id) {
        return json({ error: "not_found", message: "Randevu bulunamadı." }, 404);
      }
      if (appt.status !== "COMPLETED") {
        return json({ error: "not_completed", message: "Yalnızca tamamlanan randevular değerlendirilebilir." }, 400);
      }
      const { data: existing } = await admin
        .from("Review")
        .select("id")
        .eq("appointmentId", appointmentId)
        .is("deletedAt", null)
        .maybeSingle();
      if (existing) {
        return json({ error: "already_reviewed", message: "Bu randevu için zaten değerlendirme yaptınız." }, 409);
      }

      const moderated = moderateReviewComment(comment);
      if (!moderated.ok) {
        return json({ error: "moderation", message: moderated.message }, 400);
      }

      const { error: insErr } = await admin.from("Review").insert({
        id: newId(),
        businessId: appt.businessId,
        appointmentId,
        clientUserId: cu.id,
        patientId: appt.patientId,
        staffId: appt.staffId,
        serviceId: appt.serviceId,
        rating,
        serviceQuality: serviceQuality ?? null,
        waitingTime: waitingTime ?? null,
        communication: communication ?? null,
        comment: moderated.text,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      if (insErr) {
        log.error("review_insert_failed", insErr);
        return json({ error: "review_failed", message: "Değerlendirme kaydedilemedi." }, 500);
      }
      return json({ ok: true });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (err) {
    captureEdgeException(log, err, { userId });
    return error(err);
  } finally {
    log.finish({ userId });
  }
});
