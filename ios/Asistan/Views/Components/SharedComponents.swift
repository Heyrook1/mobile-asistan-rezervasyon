import SwiftUI

// MARK: - Avatar / Logo

struct ClinicAvatar: View {
    let logoUrl: String?
    let name: String
    let tint: Color
    var size: CGFloat = 52

    private var initials: String {
        let parts = name.split(separator: " ").prefix(2)
        return parts.compactMap { $0.first }.map(String.init).joined().uppercased()
    }

    var body: some View {
        ZStack {
            if let logoUrl, let url = URL(string: logoUrl), !logoUrl.isEmpty {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().aspectRatio(contentMode: .fill)
                    default:
                        placeholder
                    }
                }
            } else {
                placeholder
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: size * 0.28, style: .continuous))
    }

    private var placeholder: some View {
        ZStack {
            LinearGradient(colors: [tint.opacity(0.9), tint.opacity(0.6)], startPoint: .topLeading, endPoint: .bottomTrailing)
            Text(initials.isEmpty ? "AS" : initials)
                .font(.system(size: size * 0.34, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
        }
    }
}

// MARK: - Rating stars

struct RatingView: View {
    let rating: Double
    let count: Int
    var compact: Bool = false

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "star.fill")
                .font(.system(size: compact ? 11 : 13))
                .foregroundStyle(Theme.warning)
            if count > 0 {
                Text(String(format: "%.1f", rating))
                    .font(.system(size: compact ? 12 : 14, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                Text("(\(count))")
                    .font(.system(size: compact ? 11 : 12))
                    .foregroundStyle(Theme.inkTertiary)
            } else {
                Text("Yeni")
                    .font(.system(size: compact ? 11 : 12, weight: .medium))
                    .foregroundStyle(Theme.inkTertiary)
            }
        }
    }
}

// MARK: - Status badge

struct StatusBadge: View {
    let status: String

    private var config: (text: String, color: Color) {
        switch AppointmentStatus(rawValue: status) {
        case .scheduled: return ("Onay bekliyor", Theme.pendingAmber)
        case .confirmed: return ("Onaylandı", Theme.success)
        case .completed: return ("Tamamlandı", Theme.blue)
        case .cancelled: return ("İptal edildi", Theme.danger)
        case .noShow: return ("Gelinmedi", Theme.inkTertiary)
        case .none: return (status, Theme.inkSecondary)
        }
    }

    var body: some View {
        let c = config
        Text(c.text)
            .font(.system(size: 12, weight: .bold))
            .foregroundStyle(c.color)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(c.color.opacity(0.12), in: Capsule())
    }
}

// MARK: - Open / Closed pill

struct OpenStatusPill: View {
    let isOpen: Bool
    var body: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(isOpen ? Theme.success : Theme.inkTertiary)
                .frame(width: 7, height: 7)
            Text(isOpen ? "Açık" : "Kapalı")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(isOpen ? Theme.success : Theme.inkTertiary)
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 4)
        .background((isOpen ? Theme.success : Theme.inkTertiary).opacity(0.1), in: Capsule())
    }
}

// MARK: - Pill / Chip

struct Chip: View {
    let title: String
    let isSelected: Bool
    var icon: String? = nil
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if let icon {
                    Image(systemName: icon).font(.system(size: 12, weight: .semibold))
                }
                Text(title).font(.system(size: 14, weight: .semibold))
            }
            .foregroundStyle(isSelected ? .white : Theme.inkSecondary)
            .padding(.horizontal, 14)
            .padding(.vertical, 9)
            .background(
                isSelected ? AnyShapeStyle(Theme.brandGradient) : AnyShapeStyle(Theme.surface),
                in: Capsule()
            )
            .overlay(Capsule().stroke(isSelected ? Color.clear : Theme.stroke, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Primary button

struct PrimaryButton: View {
    let title: String
    var icon: String? = nil
    var isLoading: Bool = false
    var enabled: Bool = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView().tint(.white)
                } else {
                    Text(title).font(.system(size: 17, weight: .bold))
                    if let icon { Image(systemName: icon).font(.system(size: 15, weight: .bold)) }
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(Theme.brandGradient, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .foregroundStyle(.white)
            .opacity(enabled && !isLoading ? 1 : 0.55)
            .shadow(color: Theme.teal.opacity(0.35), radius: 14, x: 0, y: 8)
        }
        .disabled(!enabled || isLoading)
        .buttonStyle(PressableStyle())
    }
}

struct PressableStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

// MARK: - Empty + Loading states

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    var body: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle().fill(Theme.teal.opacity(0.1)).frame(width: 88, height: 88)
                Image(systemName: icon)
                    .font(.system(size: 36, weight: .medium))
                    .foregroundStyle(Theme.teal)
            }
            Text(title).font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.ink)
            Text(message)
                .font(.system(size: 14))
                .foregroundStyle(Theme.inkSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 32)
        .padding(.vertical, 40)
    }
}

struct SkeletonCard: View {
    @State private var shimmer = false
    var height: CGFloat = 120
    var body: some View {
        RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
            .fill(Theme.stroke.opacity(0.6))
            .frame(height: height)
            .overlay(
                LinearGradient(
                    colors: [.clear, Theme.surface.opacity(0.6), .clear],
                    startPoint: .leading, endPoint: .trailing
                )
                .offset(x: shimmer ? 220 : -220)
                .mask(RoundedRectangle(cornerRadius: Theme.cardRadius))
            )
            .onAppear {
                withAnimation(.linear(duration: 1.2).repeatForever(autoreverses: false)) {
                    shimmer = true
                }
            }
    }
}

// MARK: - Toast

@MainActor
@Observable
final class ToastCenter {
    struct Toast: Identifiable, Equatable {
        let id = UUID()
        let message: String
        let style: Style
        enum Style { case success, error, info }
    }
    var current: Toast?

    func show(_ message: String, style: Toast.Style = .info) {
        current = Toast(message: message, style: style)
        let toastId = current?.id
        Task {
            try? await Task.sleep(for: .seconds(3))
            if current?.id == toastId { current = nil }
        }
    }
}

struct ToastOverlay: View {
    let toast: ToastCenter.Toast

    private var color: Color {
        switch toast.style {
        case .success: return Theme.success
        case .error: return Theme.danger
        case .info: return Theme.ink
        }
    }
    private var icon: String {
        switch toast.style {
        case .success: return "checkmark.circle.fill"
        case .error: return "exclamationmark.triangle.fill"
        case .info: return "info.circle.fill"
        }
    }

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon).foregroundStyle(.white)
            Text(toast.message)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 13)
        .background(color, in: Capsule())
        .shadow(color: .black.opacity(0.2), radius: 12, y: 6)
        .padding(.horizontal, 24)
        .transition(.move(edge: .top).combined(with: .opacity))
    }
}
