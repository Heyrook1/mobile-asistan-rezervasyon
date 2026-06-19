import { createAdminClient, jsonResponse, newId, nowIso } from "../_shared/auth.ts";
import { sendExpoPushToClient } from "../_shared/push.ts";
import { createLogger } from "../_shared/logger.ts";

const REMINDER_WINDOWS = [
  { type: "24H", hoursAhead: 24, windowMinutes: 60 },
  { type: "1H", hoursAhead: 1, windowMinutes: 15 },
] as const;

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization") ?? "";
  const cronHeader = req.headers.get("x-cron-secret") ?? "";
  const authorized =
  cronSecret &&
  (cronHeader === cronSecret || authHeader === `Bearer ${cronSecret}`);
  if (!authorized) {
    return new Response("Forbidden", { status: 403 });
  }

  const log = createLogger(req, "reminders");
  const admin = createAdminClient();
  let sent = 0;

  try {
    const now = new Date();

    for (const window of REMINDER_WINDOWS) {
      const targetMs = window.hoursAhead * 60 * 60 * 1000;
      const halfWindow = (window.windowMinutes / 2) * 60 * 1000;
      const rangeStart = new Date(now.getTime() + targetMs - halfWindow);
      const rangeEnd = new Date(now.getTime() + targetMs + halfWindow);

      const { data: appts } = await admin
        .from("Appointment")
        .select("id,clientUserId,date,startTime,status,businessId,serviceId,Service(name)")
        .in("status", ["CONFIRMED", "SCHEDULED"])
        .is("deletedAt", null)
        .not("clientUserId", "is", null);

      for (const appt of appts ?? []) {
        const start = new Date(`${appt.date}T${String(appt.startTime).slice(0, 5)}:00`);
        if (start < rangeStart || start > rangeEnd) continue;

        const { data: existing } = await admin
          .from("AppointmentReminderLog")
          .select("id")
          .eq("appointmentId", appt.id)
          .eq("reminderType", window.type)
          .maybeSingle();
        if (existing) continue;

        const svcName = (appt as { Service?: { name?: string } }).Service?.name ?? "Randevu";
        const timeLabel = `${appt.date} ${String(appt.startTime).slice(0, 5)}`;
        const title =
          window.type === "24H" ? "Yarın randevunuz var" : "Randevunuza 1 saat kaldı";
        const body = `${svcName} • ${timeLabel}`;

        await admin.from("ClientNotification").insert({
          id: newId(),
          clientUserId: appt.clientUserId,
          businessId: appt.businessId,
          appointmentId: appt.id,
          type: window.type === "24H" ? "BOOKING_REMINDER_24H" : "BOOKING_REMINDER_1H",
          title,
          message: body,
          isRead: false,
          createdAt: nowIso(),
        });

        await sendExpoPushToClient(admin, appt.clientUserId!, {
          title,
          body,
          data: { appointmentId: appt.id, type: `REMINDER_${window.type}` },
        });

        await admin.from("AppointmentReminderLog").insert({
          id: newId(),
          appointmentId: appt.id,
          reminderType: window.type,
          sentAt: nowIso(),
        });
        sent++;
      }
    }

    log.finish({ sent });
    return jsonResponse({ ok: true, sent });
  } catch (err) {
    log.error("reminders_failed", err);
    return jsonResponse({ error: "reminders_failed" }, 500);
  }
});
