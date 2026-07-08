import SwiftUI

@MainActor
@Observable
final class HomeModel {
    var data: DiscoveryResponse?
    var appointments: [AppointmentRow] = []
    var unreadNotifications = 0
    var isLoading = false
    var errorMessage: String?

    func load(lat: Double?, lng: Double?, force: Bool = false) async {
        if data != nil && !force { return }
        isLoading = data == nil
        errorMessage = nil
        do {
            async let discovery = APIService.discovery(lat: lat, lng: lng)
            async let appts = APIService.myAppointments()
            async let notifs = APIService.notifications()
            data = try await discovery
            appointments = try await appts
            unreadNotifications = (try? await notifs)?.unread ?? 0
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = "İçerik yüklenemedi."
        }
        isLoading = false
    }

    var nextUpcoming: AppointmentRow? {
        let today = Format.todayIso
        return appointments
            .filter { !["CANCELLED", "COMPLETED", "NO_SHOW"].contains($0.status) && $0.date >= today }
            .sorted { ($0.date, $0.startTime) < ($1.date, $1.startTime) }
            .first
    }
}

struct HomeView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(\.colorScheme) private var colorScheme
    @Binding var selectedTab: MainTabView.Tab
    @State private var model = HomeModel()
    @State private var route: ProviderRoute?
    @State private var showAI = false
    @State private var appear = false

    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }
    private var firstName: String {
        (auth.clientUser?.fullName ?? "").split(separator: " ").first.map(String.init) ?? "Hoş geldiniz"
    }
    private var coord: (lat: Double, lng: Double)? { auth.coordinate }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomTrailing) {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: Theme.Space.xl) {
                        PremiumGreetingHeader(
                            firstName: firstName,
                            city: auth.clientUser?.city,
                            unread: model.unreadNotifications,
                            onBell: { selectedTab = .notifications },
                            onProfile: { selectedTab = .profile }
                        )

                        PremiumSearchBar { selectedTab = .search }

                        if model.isLoading {
                            loadingState
                        } else if let data = model.data {
                            content(data)
                        } else if model.errorMessage != nil {
                            EmptyStateView(
                                icon: "wifi.slash",
                                title: "Bir şeyler ters gitti",
                                message: model.errorMessage ?? ""
                            )
                            .asistanCard()
                        }
                        Color.clear.frame(height: 120)
                    }
                    .padding(.horizontal, Theme.Space.lg)
                    .padding(.top, Theme.Space.sm)
                }
                .background(colors.canvas.ignoresSafeArea())
                .navigationDestination(item: $route) { r in
                    destination(for: r)
                }
                .refreshable { await model.load(lat: coord?.lat, lng: coord?.lng, force: true) }

                VStack(spacing: 12) {
                    EmergencyShortcutButton { callEmergency() }
                    FloatingAIButton { showAI = true }
                }
                .padding(.trailing, Theme.Space.lg)
                .padding(.bottom, Theme.Space.xxl)
                .offset(y: appear ? 0 : 100)
                .animation(Theme.Motion.entrance.delay(0.4), value: appear)
            }
        }
        .task {
            await model.load(lat: coord?.lat, lng: coord?.lng)
            withAnimation(Theme.Motion.smooth) { appear = true }
        }
        .sheet(isPresented: $showAI) {
            AIAssistantSheet()
        }
    }

    private var loadingState: some View {
        VStack(spacing: Theme.Space.lg) {
            SkeletonCard(height: 180)
            SkeletonCard(height: 150)
            SkeletonCard(height: 150)
        }
    }

    @ViewBuilder
    private func content(_ data: DiscoveryResponse) -> some View {
        if data.nearby.isEmpty {
            EmptyStateView(
                icon: "cross.case",
                title: "Yakında klinik bulunamadı",
                message: "Şu an bölgenizde aktif klinik yok. Daha sonra tekrar deneyin veya aramayı kullanın."
            )
            .asistanCard()
        } else {
            if let upcoming = model.nextUpcoming {
                SectionHeader(title: "Yaklaşan Randevu", action: "Tümü", onAction: { selectedTab = .appointments }) {
                    UpcomingAppointmentWidget(
                        appointment: upcoming,
                        onView: { selectedTab = .appointments },
                        onReschedule: { selectedTab = .appointments }
                    )
                }
            }

            HeroBanner(firstName: firstName) { selectedTab = .search }

            SectionHeader(title: "Kategoriler", action: "Tümü", onAction: { selectedTab = .search }) {
                CategoryGrid(categories: HealthCategory.default) { category in
                    // Route to search with query intent.
                    selectedTab = .search
                }
            }

            if !data.availableToday.isEmpty {
                SectionHeader(title: "Bugün Müsait", action: "Tümü", onAction: { selectedTab = .search }) {
                    horizontalProviders(data.availableToday)
                }
            }

            if !data.popularServices.isEmpty {
                SectionHeader(title: "Popüler Hizmetler", action: "Tümü", onAction: { selectedTab = .search }) {
                    horizontalServiceChips(data.popularServices)
                }
            }

            if !data.topRated.isEmpty {
                SectionHeader(title: "Önerilen Doktorlar", action: "Tümü", onAction: { selectedTab = .search }) {
                    horizontalProviders(data.topRated)
                }
            }

            SectionHeader(title: "Yakınındaki Klinikler", action: "Tümü", onAction: { selectedTab = .search }) {
                VStack(spacing: Theme.Space.lg) {
                    ForEach(data.nearby.prefix(6)) { provider in
                        Button { route = .doctor(provider.staffId) } label: {
                            ProviderCard(provider: provider)
                        }
                        .buttonStyle(PremiumPressableStyle())
                    }
                }
            }

            PromoBanner { selectedTab = .search }

            TrustBadgesRow()
        }
    }

    private func horizontalProviders(_ providers: [Provider]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Space.lg) {
                ForEach(providers) { provider in
                    Button { route = .doctor(provider.staffId) } label: {
                        CompactProviderCard(provider: provider)
                    }
                    .buttonStyle(PremiumPressableStyle())
                }
            }
            .padding(.horizontal, 2)
        }
    }

    private func horizontalServiceChips(_ services: [PopularService]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Space.md) {
                ForEach(services) { svc in
                    Button { selectedTab = .search } label: {
                        VStack(alignment: .leading, spacing: 8) {
                            Image(systemName: "heart.text.square.fill")
                                .font(.system(size: 22))
                                .foregroundStyle(Theme.blue)
                            Text(svc.name)
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(colors.ink)
                                .lineLimit(2)
                                .multilineTextAlignment(.leading)
                            Text("\(svc.count) uzman")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(colors.inkTertiary)
                        }
                        .frame(width: 150, height: 110, alignment: .topLeading)
                        .padding(14)
                        .background(colors.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 18).stroke(colors.stroke, lineWidth: 1))
                    }
                    .buttonStyle(PremiumPressableStyle())
                }
            }
            .padding(.horizontal, 2)
        }
    }

    @ViewBuilder
    private func destination(for route: ProviderRoute) -> some View {
        switch route {
        case .doctor(let id): DoctorProfileView(staffId: id)
        case .clinic(let id): ClinicProfileView(businessId: id)
        }
    }

    private func callEmergency() {
        guard let url = URL(string: "tel://112") else { return }
        UIApplication.shared.open(url)
    }
}

enum ProviderRoute: Hashable {
    case doctor(String)
    case clinic(String)
}

struct CompactProviderCard: View {
    @Environment(\.colorScheme) private var colorScheme
    let provider: Provider
    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }
    private var tint: Color { Color(hex: provider.primaryColor) }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                ClinicAvatar(logoUrl: provider.logoUrl, name: provider.clinicName, tint: tint, size: 44)
                Spacer()
                OpenStatusPill(isOpen: provider.isOpenNow)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(provider.doctorName)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(colors.ink)
                    .lineLimit(1)
                Text(provider.specialty ?? provider.clinicName)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(tint)
                    .lineLimit(1)
            }
            RatingView(rating: provider.rating, count: provider.reviewCount, compact: true)
            if let next = provider.nextAvailable {
                HStack(spacing: 4) {
                    Image(systemName: "clock.fill").font(.system(size: 10))
                    Text(Format.nextSlotLabel(next, today: Format.todayIso))
                        .font(.system(size: 11.5, weight: .semibold))
                        .lineLimit(1)
                }
                .foregroundStyle(Theme.success)
            } else {
                Text("Müsaitlik yakında")
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(colors.inkTertiary)
            }
        }
        .frame(width: 200, alignment: .leading)
        .asistanCard(padding: 14)
    }
}
