import SwiftUI

/// Formatting helpers shared across cards.
nonisolated enum Format {
    static func price(_ value: Double, currency: String = "TRY") -> String {
        let symbol = currency == "TRY" ? "₺" : currency
        if value == value.rounded() {
            return "\(symbol)\(Int(value))"
        }
        return "\(symbol)\(String(format: "%.2f", value))"
    }

    static func priceRange(min: Double?, max: Double?, currency: String) -> String? {
        guard let min else { return nil }
        if let max, max != min {
            return "\(price(min, currency: currency)) – \(price(max, currency: currency))"
        }
        return price(min, currency: currency)
    }

    static func distance(_ km: Double?) -> String? {
        guard let km else { return nil }
        if km < 1 { return "\(Int(km * 1000)) m" }
        return String(format: "%.1f km", km)
    }

    private static let monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
    private static let weekdayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]

    /// "2026-06-15" -> "15 Haz Pzt"
    static func shortDate(_ iso: String) -> String {
        let parts = iso.split(separator: "-")
        guard parts.count == 3, let y = Int(parts[0]), let m = Int(parts[1]), let d = Int(parts[2]) else { return iso }
        var comps = DateComponents()
        comps.year = y; comps.month = m; comps.day = d
        let cal = Calendar(identifier: .gregorian)
        let weekday = cal.date(from: comps).map { cal.component(.weekday, from: $0) - 1 } ?? 0
        let month = (m >= 1 && m <= 12) ? monthNames[m - 1] : ""
        return "\(d) \(month) \(weekdayNames[weekday])"
    }

    /// Friendly label for next-available slot.
    static func nextSlotLabel(_ slot: NextSlot, today: String) -> String {
        if slot.date == today {
            return "Bugün \(slot.startTime)"
        }
        return "\(shortDate(slot.date)) • \(slot.startTime)"
    }

    static var todayIso: String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Europe/Istanbul") ?? .current
        let now = Date()
        let c = cal.dateComponents([.year, .month, .day], from: now)
        return String(format: "%04d-%02d-%02d", c.year ?? 2026, c.month ?? 1, c.day ?? 1)
    }
}

struct ProviderCard: View {
    let provider: Provider
    var showNextSlot: Bool = true

    private var tint: Color { Color(hex: provider.primaryColor) }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 12) {
                ClinicAvatar(logoUrl: provider.logoUrl, name: provider.clinicName, tint: tint, size: 54)
                VStack(alignment: .leading, spacing: 3) {
                    Text(provider.doctorName)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(1)
                    if let specialty = provider.specialty, !specialty.isEmpty {
                        Text(specialty)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(tint)
                            .lineLimit(1)
                    }
                    Text(provider.clinicName)
                        .font(.system(size: 12.5))
                        .foregroundStyle(Theme.inkSecondary)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
                OpenStatusPill(isOpen: provider.isOpenNow)
            }

            HStack(spacing: 10) {
                RatingView(rating: provider.rating, count: provider.reviewCount, compact: true)
                if let dist = Format.distance(provider.distanceKm) {
                    metaItem(icon: "location.fill", text: dist)
                }
                if let city = provider.city, !city.isEmpty, provider.distanceKm == nil {
                    metaItem(icon: "mappin.and.ellipse", text: city)
                }
                if let range = Format.priceRange(min: provider.priceMin, max: provider.priceMax, currency: provider.currency) {
                    metaItem(icon: "tag.fill", text: range)
                }
            }

            if !provider.services.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(provider.services.prefix(4)) { svc in
                            Text(svc.name)
                                .font(.system(size: 11.5, weight: .semibold))
                                .foregroundStyle(Theme.inkSecondary)
                                .padding(.horizontal, 9)
                                .padding(.vertical, 5)
                                .background(Theme.canvas, in: Capsule())
                        }
                    }
                }
            }

            if showNextSlot {
                Divider().background(Theme.stroke)
                HStack(spacing: 7) {
                    Image(systemName: "calendar.badge.clock")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(provider.nextAvailable != nil ? Theme.success : Theme.inkTertiary)
                    if let next = provider.nextAvailable {
                        Text("İlk uygun: ")
                            .font(.system(size: 13))
                            .foregroundStyle(Theme.inkSecondary)
                        + Text(Format.nextSlotLabel(next, today: Format.todayIso))
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(Theme.ink)
                    } else {
                        Text("Müsaitlik yakında eklenecek")
                            .font(.system(size: 13))
                            .foregroundStyle(Theme.inkTertiary)
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Theme.inkTertiary)
                }
            }
        }
        .asistanCard()
    }

    private func metaItem(icon: String, text: String) -> some View {
        HStack(spacing: 3) {
            Image(systemName: icon).font(.system(size: 10))
            Text(text).font(.system(size: 12, weight: .medium))
        }
        .foregroundStyle(Theme.inkSecondary)
    }
}
