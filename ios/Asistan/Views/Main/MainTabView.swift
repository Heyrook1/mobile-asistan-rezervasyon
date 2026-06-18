import SwiftUI

struct MainTabView: View {
    @Environment(AuthManager.self) private var auth
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
                Button {
                    if selected != tab {
                        let gen = UIImpactFeedbackGenerator(style: .light)
                        gen.impactOccurred()
                    }
                    selected = tab
                } label: {
                    VStack(spacing: 4) {
                        ZStack {
                            Image(systemName: tab.icon)
                                .font(.system(size: 21, weight: .semibold))
                                .foregroundStyle(selected == tab ? Theme.teal : Theme.inkTertiary)
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
                            .font(.system(size: 10, weight: selected == tab ? .bold : .medium))
                            .foregroundStyle(selected == tab ? Theme.teal : Theme.inkTertiary)
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
            Theme.surface
                .ignoresSafeArea(edges: .bottom)
                .shadow(color: .black.opacity(0.06), radius: 12, y: -4)
        )
    }
}
