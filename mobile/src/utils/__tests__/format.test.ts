import { addDaysIso, formatDate, formatDistance, formatPrice, formatPriceRange, todayIso } from "../format";

describe("formatPrice", () => {
  it("formats TRY with symbol", () => {
    expect(formatPrice(1500, "TRY")).toMatch(/1\.500/);
    expect(formatPrice(1500, "TRY")).toContain("₺");
  });

  it("returns dash for null", () => {
    expect(formatPrice(null)).toBe("-");
  });
});

describe("formatPriceRange", () => {
  it("shows range when min and max differ", () => {
    const result = formatPriceRange(100, 200, "TRY");
    expect(result).toContain("-");
  });

  it("shows single price when min equals max", () => {
    expect(formatPriceRange(100, 100, "TRY")).toContain("100");
  });

  it("handles missing prices", () => {
    expect(formatPriceRange(null, null)).toBe("Fiyat bilgisi yok");
  });
});

describe("formatDistance", () => {
  it("formats meters under 1km", () => {
    expect(formatDistance(0.5)).toBe("500 m");
  });

  it("formats kilometers", () => {
    expect(formatDistance(2.34)).toBe("2.3 km");
  });

  it("returns null for missing value", () => {
    expect(formatDistance(null)).toBeNull();
  });
});

describe("formatDate", () => {
  it("formats ISO date in Turkish", () => {
    expect(formatDate("2026-06-19")).toBe("19 Haz 2026");
  });

  it("returns input when invalid", () => {
    expect(formatDate("invalid")).toBe("invalid");
  });
});

describe("todayIso / addDaysIso", () => {
  it("addDaysIso shifts calendar days", () => {
    expect(addDaysIso("2026-06-19", 1)).toBe("2026-06-20");
    expect(addDaysIso("2026-06-19", -1)).toBe("2026-06-18");
  });

  it("todayIso returns YYYY-MM-DD", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
