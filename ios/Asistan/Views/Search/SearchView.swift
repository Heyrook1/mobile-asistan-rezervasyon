import SwiftUI

@MainActor
@Observable
final class SearchModel {
    var query = ""
    var providers: [Provider] = []
    var isLoading = false
    var hasSearched = false
    var sort = "nearest"
    var filters = APIService.SearchFilters()
    private var task: Task<Void, Never>?

    var activeFilterCount: Int {
        var n = 0
        if filters.specialty != nil { n += 1 }
        if filters.service != nil { n += 1 }
        if filters.maxDistanceKm != nil { n += 1 }
        if filters.minRating != nil { n += 1 }
        if filters.availableToday == true { n += 1 }
        if filters.maxPrice != nil { n += 1 }
        return n
    }

    func search(lat: Double?, lng: Double?, debounce: Bool = true) {
        task?.cancel()
        task = Task {
            if debounce {
                try? await Task.sleep(for: .milliseconds(350))
                if Task.isCancelled { return }
            }
            isLoading = true
            hasSearched = true
            do {
                providers = try await APIService.search(
                    lat: lat, lng: lng,
                    query: query.trimmingCharacters(in: .whitespaces).isEmpty ? nil : query,
                    filters: filters, sort: sort
                )
            } catch {
                providers = []
            }
            if !Task.isCancelled { isLoading = false }
        }
    }
}

struct SearchView: View {
    @Environment(AuthManager.self) private var auth
    @State private var model = SearchModel()
    @State private var showFilters = false
    @State private var route: ProviderRoute?
    @FocusState private var searchFocused: Bool

    private var coord: (lat: Double, lng: Double)? { auth.coordinate }

    private let sortOptions: [(String, String, String)] = [
        ("nearest", "En yakın", "location.fill"),
        ("earliest", "En erken", "bolt.fill"),
        ("rating", "En yüksek puan", "star.fill"),
        ("reviews", "En çok yorum", "text.bubble.fill"),
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                searchHeader
                sortBar
                resultsList
            }
            .background(Theme.canvas.ignoresSafeArea())
            .navigationDestination(item: $route) { r in
                switch r {
                case .doctor(let id): DoctorProfileView(staffId: id)
                case .clinic(let id): ClinicProfileView(businessId: id)
                }
            }
            .sheet(isPresented: $showFilters) {
                FilterSheet(filters: model.filters) { newFilters in
                    model.filters = newFilters
                    model.search(lat: coord?.lat, lng: coord?.lng, debounce: false)
                }
            }
        }
        .task {
            if !model.hasSearched {
                model.search(lat: coord?.lat, lng: coord?.lng, debounce: false)
            }
        }
    }

    private var searchHeader: some View {
        VStack(spacing: 12) {
            Text("Ara")
                .font(.system(size: 28, weight: .heavy))
                .foregroundStyle(Theme.ink)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 10) {
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").foregroundStyle(Theme.inkTertiary)
                    TextField("Doktor, klinik veya hizmet", text: $model.query)
                        .font(.system(size: 15))
                        .focused($searchFocused)
                        .submitLabel(.search)
                        .onChange(of: model.query) { _, _ in
                            model.search(lat: coord?.lat, lng: coord?.lng)
                        }
                    if !model.query.isEmpty {
                        Button {
                            model.query = ""
                            model.search(lat: coord?.lat, lng: coord?.lng, debounce: false)
                        } label: {
                            Image(systemName: "xmark.circle.fill").foregroundStyle(Theme.inkTertiary)
                        }
                    }
                }
                .padding(.horizontal, 14)
                .frame(height: 50)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.stroke, lineWidth: 1))

                Button {
                    showFilters = true
                } label: {
                    ZStack(alignment: .topTrailing) {
                        Image(systemName: "slider.horizontal.3")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(model.activeFilterCount > 0 ? .white : Theme.ink)
                            .frame(width: 50, height: 50)
                            .background(
                                model.activeFilterCount > 0 ? AnyShapeStyle(Theme.brandGradient) : AnyShapeStyle(Theme.surface),
                                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                            )
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(model.activeFilterCount > 0 ? Color.clear : Theme.stroke, lineWidth: 1))
                        if model.activeFilterCount > 0 {
                            Text("\(model.activeFilterCount)")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(Theme.teal)
                                .frame(width: 16, height: 16)
                                .background(.white, in: Circle())
                                .offset(x: 5, y: -5)
                        }
                    }
                }
            }
        }
        .padding(.horizontal, 18)
        .padding(.top, 8)
        .padding(.bottom, 12)
    }

    private var sortBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(sortOptions, id: \.0) { option in
                    Chip(title: option.1, isSelected: model.sort == option.0, icon: option.2) {
                        model.sort = option.0
                        model.search(lat: coord?.lat, lng: coord?.lng, debounce: false)
                    }
                }
            }
            .padding(.horizontal, 18)
        }
        .padding(.bottom, 10)
    }

    private var resultsList: some View {
        ScrollView(showsIndicators: false) {
            if model.isLoading {
                VStack(spacing: 14) {
                    ForEach(0..<4, id: \.self) { _ in SkeletonCard(height: 150) }
                }
                .padding(.horizontal, 18)
            } else if model.providers.isEmpty {
                EmptyStateView(
                    icon: "magnifyingglass",
                    title: "Sonuç bulunamadı",
                    message: "Arama veya filtrelerinizi değiştirerek tekrar deneyin."
                )
                .padding(.top, 40)
            } else {
                VStack(spacing: 14) {
                    ForEach(model.providers) { provider in
                        Button { route = .doctor(provider.staffId) } label: {
                            ProviderCard(provider: provider)
                        }
                        .buttonStyle(PressableStyle())
                    }
                }
                .padding(.horizontal, 18)
                .padding(.top, 4)
            }
            Color.clear.frame(height: 90)
        }
    }
}
