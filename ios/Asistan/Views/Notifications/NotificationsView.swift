import SwiftUI

@MainActor
@Observable
final class NotificationsModel {
    var notifications: [ClientNotificationItem] = []
    var unread = 0
    var isLoading = true
    private var loaded = false
    private var pollTask: Task<Void, Never>?

    func loadIfNeeded() async {
        if !loaded { await load() }
        startPolling()
    }

    func load() async {
        do {
            let res = try await APIService.notifications()
            notifications = res.notifications
            unread = res.unread
            loaded = true
        } catch {
            print("notifications load failed: \(error)")
        }
        isLoading = false
    }

    /// Lightweight foreground polling keeps the badge + list close to real time
    /// so dashboard approvals/cancellations surface quickly.
    private func startPolling() {
        guard pollTask == nil else { return }
        pollTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(25))
                if Task.isCancelled { return }
                await self?.load()
            }
        }
    }

    func markRead(_ item: ClientNotificationItem) async {
        guard !item.isRead else { return }
        try? await APIService.markRead(id: item.id)
        await load()
    }

    func markAllRead() async {
        try? await APIService.markAllRead()
        await load()
    }
}

struct NotificationsView: View {
    @Bindable var model: NotificationsModel

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                HStack {
                    Text("Bildirimler").font(.system(size: 28, weight: .heavy)).foregroundStyle(Theme.ink)
                    Spacer()
                    if model.unread > 0 {
                        Button("Tümünü okundu işaretle") {
                            Task { await model.markAllRead() }
                        }
                        .font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.teal)
                    }
                }
                .padding(.horizontal, 18).padding(.top, 8).padding(.bottom, 14)

                ScrollView(showsIndicators: false) {
                    if model.isLoading {
                        VStack(spacing: 12) { ForEach(0..<4, id: \.self) { _ in SkeletonCard(height: 84) } }
                            .padding(.horizontal, 18)
                    } else if model.notifications.isEmpty {
                        EmptyStateView(
                            icon: "bell.slash",
                            title: "Bildirim yok",
                            message: "Randevu güncellemeleriniz ve klinik mesajları burada görünecek."
                        )
                        .padding(.top, 50)
                    } else {
                        LazyVStack(spacing: 10) {
                            ForEach(model.notifications) { item in
                                NotificationRow(item: item)
                                    .onTapGesture { Task { await model.markRead(item) } }
                            }
                        }
                        .padding(.horizontal, 18)
                    }
                    Color.clear.frame(height: 90)
                }
                .refreshable { await model.load() }
            }
            .background(Theme.canvas.ignoresSafeArea())
        }
    }
}

struct NotificationRow: View {
    let item: ClientNotificationItem

    private var config: (icon: String, color: Color) {
        switch item.type {
        case "BOOKING_APPROVED", "BOOKING_CONFIRMATION": return ("checkmark.circle.fill", Theme.success)
        case "BOOKING_PENDING": return ("clock.badge.checkmark", Theme.pendingAmber)
        case "BOOKING_CANCELLED": return ("xmark.circle.fill", Theme.danger)
        case "BOOKING_RESCHEDULED": return ("arrow.triangle.2.circlepath", Theme.blue)
        case "APPOINTMENT_REMINDER": return ("bell.badge.fill", Theme.teal)
        case "REVIEW_REQUEST": return ("star.bubble.fill", Theme.warning)
        default: return ("info.circle.fill", Theme.inkSecondary)
        }
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle().fill(config.color.opacity(0.12)).frame(width: 44, height: 44)
                Image(systemName: config.icon).font(.system(size: 18)).foregroundStyle(config.color)
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(item.title).font(.system(size: 14.5, weight: .bold)).foregroundStyle(Theme.ink)
                Text(item.message).font(.system(size: 13)).foregroundStyle(Theme.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
                Text(relativeTime(item.createdAt))
                    .font(.system(size: 11)).foregroundStyle(Theme.inkTertiary).padding(.top, 1)
            }
            Spacer(minLength: 0)
            if !item.isRead {
                Circle().fill(Theme.teal).frame(width: 9, height: 9).padding(.top, 4)
            }
        }
        .padding(14)
        .background(item.isRead ? Theme.surface : Theme.teal.opacity(0.04), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(item.isRead ? Theme.stroke : Theme.teal.opacity(0.25), lineWidth: 1))
    }

    private func relativeTime(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = formatter.date(from: iso)
            ?? ISO8601DateFormatter().date(from: iso)
            ?? parseLoose(iso)
        guard let date else { return Format.shortDate(String(iso.prefix(10))) }
        let interval = Date().timeIntervalSince(date)
        if interval < 60 { return "Az önce" }
        if interval < 3600 { return "\(Int(interval / 60)) dk önce" }
        if interval < 86400 { return "\(Int(interval / 3600)) saat önce" }
        if interval < 604800 { return "\(Int(interval / 86400)) gün önce" }
        return Format.shortDate(String(iso.prefix(10)))
    }

    private func parseLoose(_ iso: String) -> Date? {
        let df = DateFormatter()
        df.locale = Locale(identifier: "en_US_POSIX")
        df.timeZone = TimeZone(identifier: "UTC")
        df.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        return df.date(from: String(iso.prefix(19)))
    }
}
