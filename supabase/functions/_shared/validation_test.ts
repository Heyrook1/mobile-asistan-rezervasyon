import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { bookBodySchema, cancelBodySchema, rescheduleBodySchema } from "./validation.ts";

Deno.test("bookBodySchema accepts valid booking payload", () => {
  const parsed = bookBodySchema.safeParse({
    action: "book",
    businessId: "biz1",
    staffId: "staff1",
    serviceId: "svc1",
    date: "2026-06-20",
    startTime: "10:00",
    note: null,
    contactPhone: "+905551112233",
  });
  assertEquals(parsed.success, true);
});

Deno.test("bookBodySchema rejects invalid date", () => {
  const parsed = bookBodySchema.safeParse({
    action: "book",
    businessId: "biz1",
    staffId: "staff1",
    serviceId: "svc1",
    date: "20-06-2026",
    startTime: "10:00",
  });
  assertEquals(parsed.success, false);
});

Deno.test("rescheduleBodySchema requires ISO date and appointment id", () => {
  const ok = rescheduleBodySchema.safeParse({
    action: "reschedule",
    appointmentId: "appt1",
    date: "2026-06-21",
    startTime: "14:30",
  });
  assertEquals(ok.success, true);

  const bad = rescheduleBodySchema.safeParse({
    action: "reschedule",
    appointmentId: "",
    date: "2026-06-21",
    startTime: "14:30",
  });
  assertEquals(bad.success, false);
});

Deno.test("cancelBodySchema requires appointmentId", () => {
  const parsed = cancelBodySchema.safeParse({ action: "cancel", appointmentId: "x" });
  assertEquals(parsed.success, true);
});
