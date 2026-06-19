import SwiftUI

@MainActor
@Observable
final class HomeModel {
    var data: DiscoveryResponse?
    var isLoading = false
    var errorMessage: String?

    func load(lat: Double?, lng: Double?, force: Bool = false) async {
        if data != nil && !force { return }
        isLoading = data == nil
        errorMessage = nil
        do {
            data = try await APIService.discovery(lat: lat, lng: lng)
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = "İçerik yüklenemedi."
        }
        isLoading = false
    }
}

struct HomeView: View {
    @Environment(AuthManager.self) private var auth
    @Binding var selectedTab: MainTabView.Tab
    @State private var model = HomeModel()
    @State private var route: ProviderRoute?

    private var firstName: String {
        (auth.clientUser?.fullName ?? "").split(separator: " ").first.map(String.init) ?? "Hoş geldiniz"
    }
    private var coord: (lat: Double, lng: Double)? { auth.coordinate }

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 22) {
                    header
                    if model.isLoading {
                        loadingState
                    } else if let data = model.data {
                        content(data)
                    } else if model.errorMessage != nil {
                        EmptyStateView(icon: "wifi.slash", title: "Bir şeyler ters gitti", message: model.errorMessage ?? "")
                    }
                    Color.clear.frame(height: 90)
                }
                .padding(.horizontal, 18)
                .padding(.top, 8)
            }
            .background(Theme.canvas.ignoresSafeArea())
            .navigationDestination(item: $route) { r in
                destination(for: r)
            }
            .refreshable { await model.load(lat: coord?.lat, lng: coord?.lng, force: true) }
        }
        .task { await model.load(lat: coord?.lat, lng: coord?.lng) }
    }

    private var header: some View {
        VStack(spacing: 16) {
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Merhaba, \(firstName) 👋")
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundStyle(Theme.ink)
                    HStack(spacing: 4) {
                        Image(systemName: "location.fill").font(.system(size: 11))
                        Text(auth.clientUser?.city ?? "Konum seçilmedi")
                            .font(.system(size: 13, weight: .medium))
                    }
                    .foregroundStyle(Theme.inkSecondary)
                }
                Spacer()
                ZStack {
                    Circle().fill(Theme.brandGradient).frame(width: 46, height: 46)
                    Text(firstName.prefix(1).uppercased())
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                }
            }

            Button {
                selectedTab = .search
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").foregroundStyle(Theme.inkTertiary)
                    Text("Doktor, klinik veya hizmet ara")
                        .font(.system(size: 15))
                        .foregroundStyle(Theme.inkTertiary)
                    Spacer()
                }
                .padding(.horizontal, 16)
                .frame(height: 52)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.stroke, lineWidth: 1))
            }
            .buttonStyle(.plain)
        }
    }

    private var loadingState: some View {
        VStack(spacing: 14) {
            ForEach(0..<3, id: \.self) { _ in SkeletonCard(height: 150) }
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
            if !data.availableToday.isEmpty {
                section(title: "Bugün müsait", systemImage: "bolt.fill", tint: Theme.success) {
                    horizontalProviders(data.availableToday)
                }
            }

            if !data.popularServices.isEmpty {
                section(title: "Popüler hizmetler", systemImage: "sparkles", tint: Theme.blue) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(data.popularServices) { svc in
                                serviceChip(svc)
                            }
                        }
                        .padding(.horizontal, 2)
                    }
                }
            }

            if !data.topRated.isEmpty {
                section(title: "En yüksek puanlı", systemImage: "star.fill", tint: Theme.warning) {
                    horizontalProviders(data.topRated)
                }
            }

            section(title: "Yakınındaki klinikler", systemImage: "mappin.and.ellipse", tint: Theme.teal) {
                VStack(spacing: 14) {
                    ForEach(data.nearby) { provider in
                        Button { route = .doctor(provider.staffId) } label: {
                            ProviderCard(provider: provider)
                        }
                        .buttonStyle(PressableStyle())
                    }
                }
            }
        }
    }

    private func horizontalProviders(_ providers: [Provider]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 14) {
                ForEach(providers) { provider in
                    Button { route = .doctor(provider.staffId) } label: {
                        CompactProviderCard(provider: provider)
                    }
                    .buttonStyle(PressableStyle())
                }
            }
            .padding(.horizontal, 2)
        }
    }

    private func serviceChip(_ svc: PopularService) -> some View {
        Button {
            selectedTab = .search
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: "heart.text.square.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(Theme.blue)
                Text(svc.name)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Text("\(svc.count) uzman")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Theme.inkTertiary)
            }
            .frame(width: 140, height: 110, alignment: .topLeading)
            .padding(14)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.stroke, lineWidth: 1))
        }
        .buttonStyle(PressableStyle())
    }

    private func section<Content: View>(
        title: String, systemImage: String, tint: Color,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 7) {
                Image(systemName: systemImage)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(tint)
                Text(title)
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundStyle(Theme.ink)
            }
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private func destination(for route: ProviderRoute) -> some View {
        switch route {
        case .doctor(let id): DoctorProfileView(staffId: id)
        case .clinic(let id): ClinicProfileView(businessId: id)
        }
    }
}

enum ProviderRoute: Hashable {
    case doctor(String)
    case clinic(String)
}

struct CompactProviderCard: View {
    let provider: Provider
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
                    .foregroundStyle(Theme.ink)
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
                    .foregroundStyle(Theme.inkTertiary)
            }
        }
        .frame(width: 200, alignment: .leading)
        .asistanCard(padding: 14)
    }
}
