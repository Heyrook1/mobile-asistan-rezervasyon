import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Convert "HH:MM" to minutes since midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return h * 60 + (m || 0);
}

/** Convert minutes since midnight to "HH:MM". */
export function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Two [start,end) ranges overlap. */
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/** ISO weekday for a YYYY-MM-DD date string interpreted in the given IANA timezone. 0=Sunday..6=Saturday */
export function weekdayInTz(dateStr: string, _tz: string): number {
  // dateStr is a calendar date; weekday is timezone-independent for a fixed calendar date.
  const d = new Date(`${dateStr}T12:00:00Z`);
  return d.getUTCDay();
}

/** Current minutes-since-midnight and date (YYYY-MM-DD) in the given timezone. */
export function nowInTz(tz: string): { date: string; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const minutes = hour * 60 + parseInt(get("minute"), 10);
  return { date, minutes };
}

export interface SlotResult {
  startTime: string;
  endTime: string;
}

/**
 * Compute real available appointment start times for a staff member, service, and date.
 * Honors working hours, slot interval, existing appointments, unavailable blocks,
 * service duration, business timezone, and never returns past slots.
 */
export async function computeAvailableSlots(
  admin: SupabaseClient,
  params: {
    businessId: string;
    staffId: string;
    durationMin: number;
    date: string; // YYYY-MM-DD
    timezone: string;
    excludeAppointmentId?: string;
  },
): Promise<SlotResult[]> {
  const { businessId, staffId, durationMin, date, timezone, excludeAppointmentId } = params;
  const weekday = weekdayInTz(date, timezone);

  const { data: availRows, error: availErr } = await admin
    .from("TeamMemberAvailability")
    .select("startTime,endTime,slotIntervalMin,isActive,weekday")
    .eq("businessId", businessId)
    .eq("staffId", staffId)
    .eq("weekday", weekday)
    .eq("isActive", true)
    .is("deletedAt", null);
  if (availErr) throw availErr;
  if (!availRows || availRows.length === 0) return [];

  let apptQuery = admin
    .from("Appointment")
    .select("id,startTime,endTime,status")
    .eq("businessId", businessId)
    .eq("staffId", staffId)
    .eq("date", date)
    .in("status", ["SCHEDULED", "CONFIRMED"])
    .is("deletedAt", null);
  if (excludeAppointmentId) apptQuery = apptQuery.neq("id", excludeAppointmentId);
  const { data: appts, error: apptErr } = await apptQuery;
  if (apptErr) throw apptErr;

  const { data: blocks, error: blockErr } = await admin
    .from("TeamMemberUnavailableBlock")
    .select("startTime,endTime")
    .eq("businessId", businessId)
    .eq("staffId", staffId)
    .eq("date", date)
    .is("deletedAt", null);
  if (blockErr) throw blockErr;

  const busy: Array<[number, number]> = [];
  for (const a of appts ?? []) busy.push([toMinutes(a.startTime), toMinutes(a.endTime)]);
  for (const b of blocks ?? []) busy.push([toMinutes(b.startTime), toMinutes(b.endTime)]);

  const tzNow = nowInTz(timezone);
  const isToday = tzNow.date === date;
  const minStart = isToday ? tzNow.minutes : -1;

  const slots: SlotResult[] = [];
  const seen = new Set<number>();
  for (const win of availRows) {
    const winStart = toMinutes(win.startTime);
    const winEnd = toMinutes(win.endTime);
    const step = win.slotIntervalMin && win.slotIntervalMin > 0 ? win.slotIntervalMin : 15;
    for (let s = winStart; s + durationMin <= winEnd; s += step) {
      const e = s + durationMin;
      if (s <= minStart) continue;
      if (seen.has(s)) continue;
      const clash = busy.some(([bs, be]) => overlaps(s, e, bs, be));
      if (clash) continue;
      seen.add(s);
      slots.push({ startTime: toHHMM(s), endTime: toHHMM(e) });
    }
  }
  slots.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  return slots;
}
