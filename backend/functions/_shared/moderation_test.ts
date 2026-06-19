import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { moderateReviewComment } from "./moderation.ts";

Deno.test("moderateReviewComment allows clean text", () => {
  const result = moderateReviewComment("  Çok ilgili bir doktor.  ");
  assertEquals(result, { ok: true, text: "Çok ilgili bir doktor." });
});

Deno.test("moderateReviewComment rejects links", () => {
  const result = moderateReviewComment("Site: https://spam.com");
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.message, "Yorumda bağlantı paylaşılamaz.");
});

Deno.test("moderateReviewComment strips HTML", () => {
  const result = moderateReviewComment("<b>Harika</b> deneyim");
  assertEquals(result, { ok: true, text: "Harika deneyim" });
});

Deno.test("moderateReviewComment returns null for empty", () => {
  assertEquals(moderateReviewComment("   "), { ok: true, text: null });
});
