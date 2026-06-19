const BLOCKED_PATTERNS = [
  /\b(https?:\/\/|www\.)/i,
  /\b(telegram|whatsapp)\.me\b/i,
];

const PROFANITY = [
  "amk",
  "aq",
  "orospu",
  "siktir",
  "piç",
  "yarrak",
];

/** Sanitize and validate a user review comment. Returns null when empty. */
export function moderateReviewComment(
  raw: string | null | undefined,
): { ok: true; text: string | null } | { ok: false; message: string } {
  if (raw == null || raw.trim() === "") return { ok: true, text: null };

  const text = raw
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length > 1000) {
    return { ok: false, message: "Yorum en fazla 1000 karakter olabilir." };
  }

  const lower = text.toLocaleLowerCase("tr");
  for (const p of BLOCKED_PATTERNS) {
    if (p.test(text)) {
      return { ok: false, message: "Yorumda bağlantı paylaşılamaz." };
    }
  }
  for (const word of PROFANITY) {
    if (lower.includes(word)) {
      return { ok: false, message: "Yorumunuz uygun değil. Lütfen düzenleyin." };
    }
  }

  return { ok: true, text };
}
