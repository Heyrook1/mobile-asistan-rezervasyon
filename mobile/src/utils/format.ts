export function formatPrice(value: number | null | undefined, currency = "TRY"): string {
  if (value == null) return "-";
  const symbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "";
  const formatted = Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return symbol ? `${formatted} ${symbol}` : `${formatted} ${currency}`;
}

export function formatPriceRange(
  min: number | null,
  max: number | null,
  currency = "TRY"
): string {
  if (min == null && max == null) return "Fiyat bilgisi yok";
  if (min != null && max != null && min !== max) {
    return `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`;
  }
  return formatPrice(min ?? max, currency);
}

export function formatDistance(km: number | null | undefined): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

const MONTHS_TR = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

export function formatDate(iso: string): string {
  // iso is "YYYY-MM-DD"
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  const month = MONTHS_TR[Number(m) - 1] ?? m;
  return `${Number(d)} ${month} ${y}`;
}

export function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysIso(baseIso: string, days: number): string {
  const d = new Date(`${baseIso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
