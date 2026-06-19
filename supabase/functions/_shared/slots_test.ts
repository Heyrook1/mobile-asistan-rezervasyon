import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { overlaps, toHHMM, toMinutes, weekdayInTz } from "./slots.ts";

Deno.test("toMinutes and toHHMM round-trip", () => {
  assertEquals(toMinutes("09:30"), 9 * 60 + 30);
  assertEquals(toHHMM(9 * 60 + 30), "09:30");
});

Deno.test("overlaps detects intersecting ranges", () => {
  assertEquals(overlaps(60, 120, 90, 150), true);
  assertEquals(overlaps(60, 120, 120, 180), false);
  assertEquals(overlaps(60, 120, 30, 60), false);
});

Deno.test("weekdayInTz returns stable weekday for calendar date", () => {
  // 2026-06-19 is Friday
  assertEquals(weekdayInTz("2026-06-19", "Europe/Istanbul"), 5);
});
