import {
  requireAuth,
  createAdminClient,
  handlePreflight,
  makeResponder,
  getClientUser,
  newId,
  nowIso,
} from "../_shared/auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { parseBody, bookBodySchema, cancelBodySchema, rescheduleBodySchema } from "../_shared/validation.ts";
import { computeAvailableSlots, toMinutes, toHHMM } from "../_shared/slots.ts";
import { sendExpoPushToClient } from "../_shared/push.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  const { json, error } = makeResponder(req);
  try {
    const user = await requireAuth(req);
    const admin = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    const cu = await getClientUser(admin, user.id);
    if (!cu) return json({ error: "no_profile", message: "Profil bulunamadı." }, 404);

    if (action === "book" || action === "cancel" || action === "reschedule") {
      const limited = await checkRateLimit(admin, {
        bucket: `booking:${action}:${user.id}`,
        limit: action === "book" ? 20 : action === "reschedule" ? 15 : 30,
        windowSeconds: 3600,
      });
      if (!limited.allowed) return rateLimitResponse(limited.retryAfter, req);
    }

    if (action === "book") {
      const parsed = parseBody(bookBodySchema, body, req);
      if (parsed instanceof Response) return parsed;
      const { businessId, staffId, serviceId, date, startTime } = parsed;
      const note = parsed.note?.trim() || null;
      const contactPhone = (parsed.contactPhone ?? cu.phone ?? "").toString().trim();

      // Validate service belongs to the business and is offered by the staff.
      const { data: svc } = await admin
        .from("Service")
        .select("id,businessId,name,durationMin,price,currency,isActive")
        .eq("id", serviceId)
        .maybeSingle();
      if (!svc || svc.businessId !== businessId || !svc.isActive) {
        return json({ error: "invalid_service", message: "Hizmet bulunamadı." }, 400);
      }
      const { data: ss } = await admin
        .from("ServiceStaff")
        .select("id")
        .eq("serviceId", serviceId)
        .eq("staffId", staffId)
        .eq("isActive", true)
        .is("deletedAt", null)
        .maybeSingle();
      if (!ss) return json({ error: "invalid_staff", message: "Bu hizmet seçilen uzman tarafından verilmiyor." }, 400);

      const { data: biz } = await admin
        .from("Business")
        .select("id,timezone,autoConfirmClientAppointments,currency")
        .eq("id", businessId)
        .maybeSingle();
      const timezone = biz?.timezone ?? "Europe/Istanbul";

      const endTime = toHHMM(toMinutes(startTime) + svc.durationMin);

      // Server-side re-validation: the requested slot must still be in the real
      // available set (working hours, blocks, existing appointments).
      const slots = await computeAvailableSlots(admin, {
        businessId, staffId, durationMin: svc.durationMin, date, timezone,
      });
      if (!slots.some((s) => s.startTime === startTime)) {
        return json({ error: "slot_unavailable", message: "Bu saat az önce doldu. Lütfen başka bir saat seçin." }, 409);
      }

      // Find or create a Patient record for this client within the business.
      let patientId: string | null = null;
      if (contactPhone) {
        const { data: existingPatient } = await admin
          .from("Patient")
          .select("id")
          .eq("businessId", businessId)
          .eq("phone", contactPhone)
          .is("deletedAt", null)
          .limit(1)
          .maybeSingle();
        if (existingPatient) patientId = existingPatient.id;
      }
      if (!patientId) {
        const pid = newId();
        const patientNumber = "APP-" + Date.now().toString(36).toUpperCase();
        const { error: pErr } = await admin.from("Patient").insert({
          id: pid,
          businessId,
          patientNumber,
          fullName: cu.fullName,
          phone: contactPhone || "-",
          email: cu.email,
          city: cu.city,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
        if (pErr) {
          console.error("Patient insert failed", pErr);
          return json({ error: "patient_failed", message: "Hasta kaydı oluşturulamadı." }, 500);
        }
        patientId = pid;
      }

      const status = biz?.autoConfirmClientAppointments ? "CONFIRMED" : "SCHEDULED";
      const apptId = newId();
      const { data: rpcResult, error: rpcErr } = await admin.rpc("book_client_appointment", {
        p_appointment_id: apptId,
        p_business_id: businessId,
        p_patient_id: patientId,
        p_service_id: serviceId,
        p_staff_id: staffId,
        p_client_user_id: cu.id,
        p_date: date,
        p_start_time: startTime,
        p_end_time: endTime,
        p_status: status,
        p_price: Number(svc.price),
        p_notes: note,
      });
      if (rpcErr) {
        console.error("book rpc failed", rpcErr);
        return json({ error: "book_failed", message: "Rezervasyon oluşturulamadı." }, 500);
      }
      if (rpcResult === "CONFLICT") {
        return json({ error: "conflict", message: "Bu saat az önce doldu. Lütfen başka bir saat seçin." }, 409);
      }

      // Notify the client.
      const confirmed = status === "CONFIRMED";
      await admin.from("ClientNotification").insert({
        id: newId(),
        clientUserId: cu.id,
        businessId,
        appointmentId: apptId,
        type: confirmed ? "BOOKING_CONFIRMATION" : "BOOKING_PENDING",
        title: confirmed ? "Randevunuz onaylandı" : "Randevu talebiniz alındı",
        message: confirmed
          ? `${svc.name} randevunuz ${date} ${startTime} için onaylandı.`
          : `${svc.name} randevu talebiniz ${date} ${startTime} için alındı. Onay bekleniyor.`,
        isRead: false,
        createdAt: nowIso(),
      });

      await sendExpoPushToClient(admin, cu.id, {
        title: confirmed ? "Randevunuz onaylandı" : "Randevu talebiniz alındı",
        body: confirmed
          ? `${svc.name} • ${date} ${startTime.slice(0, 5)}`
          : `${svc.name} için onay bekleniyor`,
        data: { appointmentId: apptId, type: confirmed ? "BOOKING_CONFIRMATION" : "BOOKING_PENDING" },
      });

      // Notify the clinic dashboard (doctor/secretary/owner).
      const { data: staff } = await admin.from("TeamMember").select("userId,fullName").eq("id", staffId).maybeSingle();
      await admin.from("Notification").insert({
        id: newId(),
        businessId,
        userId: staff?.userId ?? null,
        type: "APPOINTMENT",
        subtype: "CLIENT_BOOKING",
        title: confirmed ? "Yeni randevu (mobil)" : "Yeni randevu talebi (mobil)",
        message: `${cu.fullName} • ${svc.name} • ${date} ${startTime}`,
        entityType: "Appointment",
        entityId: apptId,
        priority: confirmed ? "NORMAL" : "HIGH",
        actionRequired: !confirmed,
        isRead: false,
        createdAt: nowIso(),
      });

      return json({ ok: true, appointmentId: apptId, status, startTime, endTime, date });
    }

    if (action === "list") {
      const { data: appts } = await admin
        .from("Appointment")
        .select("id,date,startTime,endTime,status,source,price,notes,createdAt,businessId,serviceId,staffId," +
          "Service(name,durationMin),TeamMember(fullName,specialty),Business(name,city,address,phone,primaryColor,logoUrl)")
        .eq("clientUserId", cu.id)
        .is("deletedAt", null)
        .order("date", { ascending: false })
        .order("startTime", { ascending: false });
      // Mark which appointments already have a review.
      const apptIds = (appts ?? []).map((a) => a.id);
      let reviewed = new Set<string>();
      if (apptIds.length) {
        const { data: revs } = await admin.from("Review").select("appointmentId").in("appointmentId", apptIds).is("deletedAt", null);
        reviewed = new Set((revs ?? []).map((r) => r.appointmentId));
      }
      const enriched = (appts ?? []).map((a) => ({
        ...a,
        price: a.price != null ? Number(a.price) : null,
        hasReview: reviewed.has(a.id),
      }));
      return json({ appointments: enriched });
    }

    if (action === "cancel") {
      const parsed = parseBody(cancelBodySchema, body, req);
      if (parsed instanceof Response) return parsed;
      const { appointmentId } = parsed;
      const { data: appt } = await admin
        .from("Appointment")
        .select("id,clientUserId,businessId,status,date,startTime,staffId,serviceId,Service(name),TeamMember(userId)")
        .eq("id", appointmentId)
        .maybeSingle();
      if (!appt || appt.clientUserId !== cu.id) {
        return json({ error: "not_found", message: "Randevu bulunamadı." }, 404);
      }
      if (!["SCHEDULED", "CONFIRMED"].includes(appt.status)) {
        return json({ error: "not_cancelable", message: "Bu randevu iptal edilemez." }, 400);
      }
      await admin.from("Appointment").update({ status: "CANCELLED", updatedAt: nowIso() }).eq("id", appointmentId);

      const svcName = (appt as { Service?: { name?: string } }).Service?.name ?? "Randevu";
      await admin.from("ClientNotification").insert({
        id: newId(),
        clientUserId: cu.id,
        businessId: appt.businessId,
        appointmentId,
        type: "BOOKING_CANCELLED",
        title: "Randevu iptal edildi",
        message: `${svcName} • ${appt.date} ${appt.startTime} randevunuz iptal edildi.`,
        isRead: false,
        createdAt: nowIso(),
      });
      await sendExpoPushToClient(admin, cu.id, {
        title: "Randevu iptal edildi",
        body: `${svcName} • ${appt.date} ${String(appt.startTime).slice(0, 5)}`,
        data: { appointmentId, type: "BOOKING_CANCELLED" },
      });
      await admin.from("Notification").insert({
        id: newId(),
        businessId: appt.businessId,
        userId: (appt as { TeamMember?: { userId?: string } }).TeamMember?.userId ?? null,
        type: "APPOINTMENT",
        subtype: "CLIENT_CANCELLED",
        title: "Randevu iptali (mobil)",
        message: `${cu.fullName} • ${svcName} • ${appt.date} ${appt.startTime} randevusunu iptal etti.`,
        entityType: "Appointment",
        entityId: appointmentId,
        priority: "NORMAL",
        isRead: false,
        createdAt: nowIso(),
      });
      return json({ ok: true });
    }

    if (action === "reschedule") {
      const parsed = parseBody(rescheduleBodySchema, body, req);
      if (parsed instanceof Response) return parsed;
      const { appointmentId, date, startTime } = parsed;

      const { data: appt } = await admin
        .from("Appointment")
        .select("id,clientUserId,businessId,status,date,startTime,staffId,serviceId,Service(name,durationMin),TeamMember(userId,fullName)")
        .eq("id", appointmentId)
        .maybeSingle();
      if (!appt || appt.clientUserId !== cu.id) {
        return json({ error: "not_found", message: "Randevu bulunamadı." }, 404);
      }
      if (!["SCHEDULED", "CONFIRMED"].includes(appt.status)) {
        return json({ error: "not_reschedulable", message: "Bu randevu ertelenemez." }, 400);
      }

      const svc = (appt as { Service?: { name?: string; durationMin?: number } }).Service;
      const durationMin = svc?.durationMin ?? 30;
      const { data: biz } = await admin
        .from("Business")
        .select("timezone")
        .eq("id", appt.businessId)
        .maybeSingle();
      const timezone = biz?.timezone ?? "Europe/Istanbul";
      const endTime = toHHMM(toMinutes(startTime) + durationMin);

      const slots = await computeAvailableSlots(admin, {
        businessId: appt.businessId,
        staffId: appt.staffId,
        durationMin,
        date,
        timezone,
        excludeAppointmentId: appointmentId,
      });
      if (!slots.some((s) => s.startTime === startTime)) {
        return json({ error: "slot_unavailable", message: "Bu saat uygun değil. Lütfen başka bir saat seçin." }, 409);
      }

      const { data: updated, error: updErr } = await admin
        .from("Appointment")
        .update({ date, startTime, endTime, updatedAt: nowIso() })
        .eq("id", appointmentId)
        .eq("clientUserId", cu.id)
        .in("status", ["SCHEDULED", "CONFIRMED"])
        .select("id")
        .maybeSingle();
      if (updErr || !updated) {
        console.error("reschedule update failed", updErr);
        return json({ error: "reschedule_failed", message: "Randevu ertelenemedi." }, 500);
      }

      const svcName = svc?.name ?? "Randevu";
      const oldWhen = `${appt.date} ${String(appt.startTime).slice(0, 5)}`;
      const newWhen = `${date} ${startTime.slice(0, 5)}`;

      await admin.from("ClientNotification").insert({
        id: newId(),
        clientUserId: cu.id,
        businessId: appt.businessId,
        appointmentId,
        type: "BOOKING_RESCHEDULED",
        title: "Randevunuz ertelendi",
        message: `${svcName} randevunuz ${oldWhen} → ${newWhen} olarak güncellendi.`,
        isRead: false,
        createdAt: nowIso(),
      });
      await sendExpoPushToClient(admin, cu.id, {
        title: "Randevunuz ertelendi",
        body: `${svcName} • ${newWhen}`,
        data: { appointmentId, type: "BOOKING_RESCHEDULED" },
      });
      await admin.from("Notification").insert({
        id: newId(),
        businessId: appt.businessId,
        userId: (appt as { TeamMember?: { userId?: string } }).TeamMember?.userId ?? null,
        type: "APPOINTMENT",
        subtype: "CLIENT_RESCHEDULED",
        title: "Randevu ertelendi (mobil)",
        message: `${cu.fullName} • ${svcName} • ${oldWhen} → ${newWhen}`,
        entityType: "Appointment",
        entityId: appointmentId,
        priority: "NORMAL",
        isRead: false,
        createdAt: nowIso(),
      });

      return json({ ok: true, appointmentId, date, startTime, endTime });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (err) {
    return error(err);
  }
});
