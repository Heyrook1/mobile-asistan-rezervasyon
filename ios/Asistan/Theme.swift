import SwiftUI

/// Central design system for Asistan — teal-forward healthcare marketplace aesthetic.
enum Theme {
    // Brand palette derived from the Asistan mark (teal → blue gradient).
    static let teal = Color(hex: "0FB9A8")
    static let tealDeep = Color(hex: "0A9C9A")
    static let blue = Color(hex: "1E73E8")
    static let accentGreen = Color(hex: "16C79A")

    static let ink = Color(hex: "0E1B2A")
    static let inkSecondary = Color(hex: "5B6B7B")
    static let inkTertiary = Color(hex: "97A4B2")

    static let surface = Color(hex: "FFFFFF")
    static let canvas = Color(hex: "F4F7FA")
    static let stroke = Color(hex: "E6ECF2")

    static let success = Color(hex: "1FB47A")
    static let warning = Color(hex: "F0A23B")
    static let danger = Color(hex: "E5563E")
    static let pendingAmber = Color(hex: "E8973A")

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

    static let cardRadius: CGFloat = 20
    static let chipRadius: CGFloat = 14

    static func cardShadow(_ content: some View) -> some View {
        content.shadow(color: Color(hex: "0E1B2A").opacity(0.06), radius: 18, x: 0, y: 10)
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
    /// Standard rounded card container used throughout the app.
    func asistanCard(padding: CGFloat = 16) -> some View {
        self
            .padding(padding)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                    .stroke(Theme.stroke, lineWidth: 1)
            )
            .shadow(color: Color(hex: "0E1B2A").opacity(0.05), radius: 16, x: 0, y: 8)
    }
}
