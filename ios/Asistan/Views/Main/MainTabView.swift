import SwiftUI

struct MainTabView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(\.colorScheme) private var colorScheme
    @State private var selected: Tab = .home
    @State private var notifModel = NotificationsModel()

    enum Tab: Int, CaseIterable {
        case home, search, appointments, notifications, profile
        var title: String {
            switch self {
            case .home: return "Ana Sayfa"
            case .search: return "Ara"
            case .appointments: return "Randevularım"
            case .notifications: return "Bildirimler"
            case .profile: return "Profil"
            }
        }
        var icon: String {
            switch self {
            case .home: return "house.fill"
            case .search: return "magnifyingglass"
            case .appointments: return "calendar"
            case .notifications: return "bell.fill"
            case .profile: return "person.fill"
            }
        }
    }

    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                switch selected {
                case .home: HomeView(selectedTab: $selected)
                case .search: SearchView()
                case .appointments: AppointmentsView()
                case .notifications: NotificationsView(model: notifModel)
                case .profile: ProfileView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            tabBar
        }
        .ignoresSafeArea(.keyboard)
        .environment(notifModel)
        .task { await notifModel.loadIfNeeded() }
    }

    private var tabBar: some View {
        HStack(spacing: 0) {
            ForEach(Tab.allCases, id: \.rawValue) { tab in
                let isSelected = selected == tab
                Button {
                    withAnimation(Theme.Motion.quick) {
                        if selected != tab {
                            Haptics.light()
                        }
                        selected = tab
                    }
                } label: {
                    VStack(spacing: 4) {
                        ZStack {
                            Image(systemName: tab.icon)
                                .font(.system(size: 21, weight: .semibold))
                                .foregroundStyle(isSelected ? Theme.teal : colors.inkTertiary)
                                .scaleEffect(isSelected ? 1.08 : 1.0)
                                .animation(Theme.Motion.press, value: isSelected)
                            if tab == .notifications && notifModel.unread > 0 {
                                Text("\(min(notifModel.unread, 9))")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundStyle(.white)
                                    .frame(width: 16, height: 16)
                                    .background(Theme.danger, in: Circle())
                                    .offset(x: 12, y: -10)
                            }
                        }
                        Text(tab.title)
                            .font(.system(size: 10, weight: isSelected ? .bold : .medium))
                            .foregroundStyle(isSelected ? Theme.teal : colors.inkTertiary)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.top, 10)
        .padding(.bottom, 26)
        .padding(.horizontal, 6)
        .background(
            colors.surface
                .ignoresSafeArea(edges: .bottom)
                .shadow(color: colors.shadow.opacity(0.08), radius: 16, y: -4)
        )
    }
}
