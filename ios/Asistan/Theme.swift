import SwiftUI

// MARK: - Color scheme-aware theme
/// Central design system for Asistan — premium, healthcare-focused, dark mode ready.
enum Theme {
    // MARK: Brand palette (derived from the Asistan logo)
    static let teal = Color(hex: "0FB9A8")
    static let tealDeep = Color(hex: "0A9C9A")
    static let tealLight = Color(hex: "4DD4E8")
    static let blue = Color(hex: "1E73E8")
    static let accentGreen = Color(hex: "16C79A")

    // MARK: Legacy semantic colors (light mode; preserved for existing views)
    static let ink = Color(hex: "0E1B2A")
    static let inkSecondary = Color(hex: "5B6B7B")
    static let inkTertiary = Color(hex: "97A4B2")
    static let surface = Color(hex: "FFFFFF")
    static let surfaceElevated = Color(hex: "FFFFFF")
    static let canvas = Color(hex: "F4F7FA")
    static let stroke = Color(hex: "E6ECF2")
    static let strokeSubtle = Color(hex: "F0F4F8")
    static let success = Color(hex: "1FB47A")
    static let warning = Color(hex: "F0A23B")
    static let danger = Color(hex: "E5563E")
    static let pendingAmber = Color(hex: "E8973A")

    static var shadowColor: Color { Color(hex: "0E1B2A") }
    static var glassBackground: Color { Color(hex: "FFFFFF").opacity(0.72) }

    static var brandGradient: LinearGradient {
        LinearGradient(
            colors: [accentGreen, teal, blue],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    static var heroGradient: LinearGradient {
        LinearGradient(
            colors: [Color(hex: "0FB9A8"), Color(hex: "0E8FB8"), Color(hex: "1A6FE0")],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // MARK: Shapes
    static let cardRadius: CGFloat = 24
    static let chipRadius: CGFloat = 16
    static let pillRadius: CGFloat = 999
    static let buttonRadius: CGFloat = 16
    static let inputRadius: CGFloat = 14

    // MARK: Spacing (8-point grid)
    enum Space {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 24
        static let xxl: CGFloat = 32
        static let section: CGFloat = 20
    }

    // MARK: Typography
    enum Typography {
        static let hero = Font.system(size: 28, weight: .heavy)
        static let h1 = Font.system(size: 24, weight: .bold)
        static let h2 = Font.system(size: 20, weight: .bold)
        static let h3 = Font.system(size: 17, weight: .bold)
        static let body = Font.system(size: 15, weight: .regular)
        static let bodyMedium = Font.system(size: 15, weight: .medium)
        static let caption = Font.system(size: 13, weight: .regular)
        static let captionMedium = Font.system(size: 13, weight: .medium)
        static let captionBold = Font.system(size: 13, weight: .bold)
        static let micro = Font.system(size: 11, weight: .medium)
    }

    // MARK: Motion
    enum Motion {
        static let quick: Animation = .spring(response: 0.3, dampingFraction: 0.8)
        static let smooth: Animation = .spring(response: 0.45, dampingFraction: 0.75)
        static let entrance: Animation = .spring(response: 0.55, dampingFraction: 0.8)
        static let press: Animation = .spring(response: 0.25, dampingFraction: 0.7)
    }

    // MARK: Dynamic color scheme-aware palette (use in new premium views)
    struct Colors {
        let ink: Color
        let inkSecondary: Color
        let inkTertiary: Color
        let surface: Color
        let surfaceElevated: Color
        let canvas: Color
        let stroke: Color
        let strokeSubtle: Color
        let shadow: Color
        let glass: Color

        static func forScheme(_ scheme: ColorScheme) -> Colors {
            switch scheme {
            case .dark:
                return Colors(
                    ink: Color(hex: "F4F7FA"),
                    inkSecondary: Color(hex: "8B9BAB"),
                    inkTertiary: Color(hex: "6B7C8F"),
                    surface: Color(hex: "141C24"),
                    surfaceElevated: Color(hex: "1C2530"),
                    canvas: Color(hex: "0E141B"),
                    stroke: Color(hex: "26313D"),
                    strokeSubtle: Color(hex: "1E2733"),
                    shadow: Color(hex: "000000"),
                    glass: Color(hex: "141C24").opacity(0.72)
                )
            default:
                return Colors(
                    ink: Color(hex: "0E1B2A"),
                    inkSecondary: Color(hex: "5B6B7B"),
                    inkTertiary: Color(hex: "97A4B2"),
                    surface: Color(hex: "FFFFFF"),
                    surfaceElevated: Color(hex: "FFFFFF"),
                    canvas: Color(hex: "F4F7FA"),
                    stroke: Color(hex: "E6ECF2"),
                    strokeSubtle: Color(hex: "F0F4F8"),
                    shadow: Color(hex: "0E1B2A"),
                    glass: Color(hex: "FFFFFF").opacity(0.72)
                )
            }
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 15, 185, 168)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

extension View {
    /// Standard rounded card container used throughout the app. Adapts to light/dark mode via system colors.
    func asistanCard(padding: CGFloat = Theme.Space.lg) -> some View {
        self
            .padding(padding)
            .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                    .stroke(Color(.separator).opacity(0.6), lineWidth: 1)
            )
            .shadow(color: Theme.shadowColor.opacity(0.06), radius: 18, x: 0, y: 10)
    }

    /// Compact card with softer shadow for chips/small items.
    func asistanSoftCard(padding: CGFloat = Theme.Space.md) -> some View {
        self
            .padding(padding)
            .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: Theme.chipRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.chipRadius, style: .continuous)
                    .stroke(Color(.separator).opacity(0.6), lineWidth: 1)
            )
            .shadow(color: Theme.shadowColor.opacity(0.04), radius: 12, x: 0, y: 6)
    }

    /// Glassmorphism container for floating elements.
    func glassCard(padding: CGFloat = Theme.Space.lg, radius: CGFloat = Theme.cardRadius) -> some View {
        self
            .padding(padding)
            .background(Color(.systemBackground).opacity(0.72), in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(Color(.separator).opacity(0.5), lineWidth: 1)
            )
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
    }

    func premiumShadow(color: Color? = nil, radius: CGFloat = 18, y: CGFloat = 10) -> some View {
        self.shadow(color: (color ?? Theme.shadowColor).opacity(0.08), radius: radius, x: 0, y: y)
    }

    func softShadow(color: Color? = nil, radius: CGFloat = 12, y: CGFloat = 6) -> some View {
        self.shadow(color: (color ?? Theme.shadowColor).opacity(0.04), radius: radius, x: 0, y: y)
    }

    func reduceMotionAware() -> some View {
        self.animation(nil, value: UUID())
    }
}

// MARK: - Haptics helper
enum Haptics {
    static func light() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }
    static func medium() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }
    static func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }
    static func error() {
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    }
    static func warning() {
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }
}

