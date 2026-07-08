import SwiftUI

// MARK: - Premium Home Components
// Reusable blocks for the new premium home experience.

struct PremiumGreetingHeader: View {
    @Environment(\.colorScheme) private var colorScheme
    let firstName: String
    let city: String?
    let unread: Int
    let onBell: () -> Void
    let onProfile: () -> Void

    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Merhaba, \(firstName)")
                    .font(Theme.Typography.hero)
                    .foregroundStyle(colors.ink)
                HStack(spacing: 4) {
                    Image(systemName: "location.fill")
                        .font(.system(size: 11, weight: .semibold))
                    Text(city ?? "Konum seçilmedi")
                        .font(Theme.Typography.captionMedium)
                }
                .foregroundStyle(Theme.teal)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(Theme.teal.opacity(0.12), in: Capsule())
            }
            Spacer()
            HStack(spacing: 10) {
                Button(action: { Haptics.light(); onBell() }) {
                    ZStack {
                        Circle()
                            .fill(colors.surfaceElevated)
                            .frame(width: 46, height: 46)
                            .overlay(Circle().stroke(colors.stroke, lineWidth: 1))
                        Image(systemName: "bell.fill")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(colors.ink)
                        if unread > 0 {
                            Text("\(min(unread, 9))")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(width: 16, height: 16)
                                .background(Theme.danger, in: Circle())
                                .offset(x: 12, y: -10)
                        }
                    }
                }
                .buttonStyle(PremiumPressableStyle())

                Button(action: { Haptics.light(); onProfile() }) {
                    ZStack {
                        Circle()
                            .fill(Theme.brandGradient)
                            .frame(width: 46, height: 46)
                        Text(firstName.prefix(1).uppercased())
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
                .buttonStyle(PremiumPressableStyle())
            }
        }
    }
}

struct PremiumSearchBar: View {
    @Environment(\.colorScheme) private var colorScheme
    let onTap: () -> Void

    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }

    var body: some View {
        Button(action: { Haptics.light(); onTap() }) {
            HStack(spacing: 10) {
                ZStack {
                    Circle()
                        .fill(Theme.teal.opacity(0.12))
                        .frame(width: 34, height: 34)
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Theme.teal)
                }
                Text("Doktor, klinik veya hizmet ara")
                    .font(Theme.Typography.body)
                    .foregroundStyle(colors.inkTertiary)
                Spacer()
                Image(systemName: "mic.fill")
                    .font(.system(size: 15))
                    .foregroundStyle(colors.inkTertiary)
            }
            .padding(.horizontal, 14)
            .frame(height: 56)
            .background(colors.surface, in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                    .stroke(colors.stroke, lineWidth: 1)
            )
            .shadow(color: colors.shadow.opacity(0.06), radius: 16, x: 0, y: 8)
        }
        .buttonStyle(PremiumPressableStyle())
    }
}

struct HeroBanner: View {
    @Environment(\.colorScheme) private var colorScheme
    let firstName: String
    let onBook: () -> Void

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                .fill(Theme.heroGradient)
                .frame(height: 180)

            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Sağlığınızı önemsiyoruz")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.85))
                    Text("Hemen randevu al,\nuzmanlarla görüş.")
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                    Button(action: { Haptics.medium(); onBook() }) {
                        HStack(spacing: 6) {
                            Text("Randevu Ara")
                                .font(.system(size: 14, weight: .bold))
                            Image(systemName: "arrow.right")
                                .font(.system(size: 13, weight: .bold))
                        }
                        .foregroundStyle(Theme.teal)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(.white, in: Capsule())
                    }
                    .buttonStyle(PremiumPressableStyle())
                }
                .padding(.leading, 20)
                .padding(.vertical, 20)
                Spacer()
            }
        }
        .premiumShadow(color: Theme.teal, radius: 20, y: 12)
    }
}

struct CategoryGrid: View {
    @Environment(\.colorScheme) private var colorScheme
    let categories: [HealthCategory]
    let onSelect: (HealthCategory) -> Void

    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }

    private let columns = [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 10) {
            ForEach(categories) { category in
                Button(action: { Haptics.light(); onSelect(category) }) {
                    VStack(spacing: 8) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .fill(category.color.opacity(0.12))
                                .frame(width: 52, height: 52)
                            Image(systemName: category.icon)
                                .font(.system(size: 22, weight: .semibold))
                                .foregroundStyle(category.color)
                        }
                        Text(category.name)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(colors.ink)
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                }
                .buttonStyle(PremiumPressableStyle())
            }
        }
    }
}

struct HealthCategory: Identifiable, Hashable {
    let id = UUID()
    let name: String
    let icon: String
    let query: String
    let color: Color
}

extension HealthCategory {
    static let `default`: [HealthCategory] = [
        .init(name: "Diş", icon: "face.smiling", query: "Diş", color: Color(hex: "0FB9A8")),
        .init(name: "Cilt", icon: "sparkles", query: "Dermatoloji", color: Color(hex: "1E73E8")),
        .init(name: "Kadın Doğum", icon: "heart.fill", query: "Kadın Doğum", color: Color(hex: "E5563E")),
        .init(name: "Çocuk", icon: "figure.child", query: "Çocuk", color: Color(hex: "F0A23B")),
        .init(name: "Göz", icon: "eye.fill", query: "Göz", color: Color(hex: "16C79A")),
        .init(name: "Ortopedi", icon: "figure.walk", query: "Ortopedi", color: Color(hex: "8B5CF6")),
        .init(name: "Psikoloji", icon: "brain.head.profile", query: "Psikoloji", color: Color(hex: "EC4899")),
        .init(name: "Genel", icon: "stethoscope", query: "Genel", color: Color(hex: "6B7C8F")),
    ]
}

struct UpcomingAppointmentWidget: View {
    @Environment(\.colorScheme) private var colorScheme
    let appointment: AppointmentRow
    let onView: () -> Void
    let onReschedule: () -> Void

    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }
    private var tint: Color { Color(hex: appointment.business?.primaryColor ?? "0FB9A8") }

    var body: some View {
        Button(action: { Haptics.light(); onView() }) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    HStack(spacing: 6) {
                        Image(systemName: "calendar.badge.clock")
                            .font(.system(size: 12, weight: .bold))
                        Text("Yaklaşan Randevunuz")
                            .font(.system(size: 12, weight: .bold))
                    }
                    .foregroundStyle(tint)
                    Spacer()
                    StatusBadge(status: appointment.status)
                }

                HStack(spacing: 12) {
                    ClinicAvatar(logoUrl: appointment.business?.logoUrl, name: appointment.business?.name ?? "Klinik", tint: tint, size: 48)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(appointment.service?.name ?? "Randevu")
                            .font(Theme.Typography.h3)
                            .foregroundStyle(colors.ink)
                            .lineLimit(1)
                        Text(appointment.teamMember?.fullName ?? "")
                            .font(Theme.Typography.captionMedium)
                            .foregroundStyle(tint)
                        Text("\(Format.shortDate(appointment.date)) · \(appointment.startTime)")
                            .font(Theme.Typography.caption)
                            .foregroundStyle(colors.inkSecondary)
                    }
                    Spacer()
                }

                HStack(spacing: 8) {
                    Button(action: { Haptics.light(); onView() }) {
                        Text("Görüntüle")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 38)
                            .background(tint, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(PremiumPressableStyle())

                    Button(action: { Haptics.light(); onReschedule() }) {
                        Text("Ertele")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(colors.ink)
                            .frame(maxWidth: .infinity)
                            .frame(height: 38)
                            .background(colors.surfaceElevated, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(colors.stroke, lineWidth: 1)
                            )
                    }
                    .buttonStyle(PremiumPressableStyle())
                }
            }
            .padding(16)
            .background(colors.surface, in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                    .stroke(tint.opacity(0.3), lineWidth: 1)
            )
            .shadow(color: tint.opacity(0.12), radius: 18, x: 0, y: 10)
        }
        .buttonStyle(PremiumPressableStyle())
    }
}

struct SectionHeader<Content: View>: View {
    @Environment(\.colorScheme) private var colorScheme
    let title: String
    let action: String?
    let onAction: (() -> Void)?
    @ViewBuilder let content: Content

    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.md) {
            HStack {
                Text(title)
                    .font(Theme.Typography.h2)
                    .foregroundStyle(colors.ink)
                Spacer()
                if let action, let onAction {
                    Button(action: { Haptics.light(); onAction() }) {
                        Text(action)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(Theme.teal)
                    }
                    .buttonStyle(PremiumPressableStyle())
                }
            }
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct PromoBanner: View {
    @Environment(\.colorScheme) private var colorScheme
    let onTap: () -> Void

    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }

    var body: some View {
        Button(action: { Haptics.light(); onTap() }) {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(Theme.teal.opacity(0.12))
                        .frame(width: 56, height: 56)
                    Image(systemName: "shield.checkered.fill")
                        .font(.system(size: 24))
                        .foregroundStyle(Theme.teal)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text("Güvenilir sağlık hizmeti")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(colors.ink)
                    Text("Onaylı klinikler ve uzmanlarla randevu alın.")
                        .font(Theme.Typography.caption)
                        .foregroundStyle(colors.inkSecondary)
                        .lineLimit(2)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(colors.inkTertiary)
            }
            .padding(14)
            .background(Theme.teal.opacity(0.06), in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                    .stroke(Theme.teal.opacity(0.15), lineWidth: 1)
            )
        }
        .buttonStyle(PremiumPressableStyle())
    }
}

struct TrustBadgesRow: View {
    @Environment(\.colorScheme) private var colorScheme

    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }

    var body: some View {
        HStack(spacing: 10) {
            TrustBadge(icon: "checkmark.shield.fill", text: "Onaylı")
            TrustBadge(icon: "lock.shield.fill", text: "Güvenli")
            TrustBadge(icon: "clock.arrow.circlepath", text: "7/24")
        }
    }
}

struct TrustBadge: View {
    @Environment(\.colorScheme) private var colorScheme
    let icon: String
    let text: String

    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(Theme.teal)
            Text(text)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(colors.inkSecondary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(colors.surface, in: Capsule())
        .overlay(Capsule().stroke(colors.stroke, lineWidth: 1))
    }
}

struct FloatingAIButton: View {
    @Environment(\.colorScheme) private var colorScheme
    let onTap: () -> Void
    @State private var isPulsing = false

    var body: some View {
        Button(action: { Haptics.medium(); onTap() }) {
            ZStack {
                Circle()
                    .fill(Theme.teal.opacity(0.25))
                    .frame(width: 64, height: 64)
                    .scaleEffect(isPulsing ? 1.2 : 1.0)
                    .opacity(isPulsing ? 0.0 : 1.0)
                    .animation(.easeInOut(duration: 1.8).repeatForever(autoreverses: false), value: isPulsing)

                Circle()
                    .fill(Theme.brandGradient)
                    .frame(width: 56, height: 56)
                    .shadow(color: Theme.teal.opacity(0.4), radius: 14, x: 0, y: 8)

                VStack(spacing: 2) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 16, weight: .bold))
                    Text("AI")
                        .font(.system(size: 9, weight: .bold))
                }
                .foregroundStyle(.white)
            }
        }
        .buttonStyle(PremiumPressableStyle())
        .onAppear { isPulsing = true }
    }
}

struct PremiumPressableStyle: ButtonStyle {
    @Environment(\.colorScheme) private var colorScheme

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .opacity(configuration.isPressed ? 0.92 : 1.0)
            .animation(Theme.Motion.press, value: configuration.isPressed)
    }
}

struct EmergencyShortcutButton: View {
    @Environment(\.colorScheme) private var colorScheme
    let onTap: () -> Void

    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }

    var body: some View {
        Button(action: { Haptics.error(); onTap() }) {
            HStack(spacing: 8) {
                Image(systemName: "phone.fill")
                    .font(.system(size: 13, weight: .bold))
                Text("Acil Çağrı")
                    .font(.system(size: 13, weight: .bold))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(Theme.danger, in: Capsule())
            .shadow(color: Theme.danger.opacity(0.3), radius: 10, x: 0, y: 4)
        }
        .buttonStyle(PremiumPressableStyle())
    }
}
