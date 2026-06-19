import SwiftUI
import CoreLocation

struct LocationOnboardingView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(ToastCenter.self) private var toast
    @State private var location = LocationManager()
    @State private var showManual = false
    @State private var searchText = ""
    @State private var isSaving = false

    private var filteredCities: [KKTCSehir] {
        if searchText.isEmpty { return KKTCSehir.all }
        return KKTCSehir.all.filter {
            $0.name.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        ZStack {
            Theme.canvas.ignoresSafeArea()
            if showManual {
                manualSelection
            } else {
                permissionPrompt
            }
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.85), value: showManual)
    }

    private var permissionPrompt: some View {
        VStack(spacing: 0) {
            Spacer()
            ZStack {
                Circle().fill(Theme.teal.opacity(0.12)).frame(width: 150, height: 150)
                Circle().fill(Theme.teal.opacity(0.18)).frame(width: 104, height: 104)
                Image(systemName: "location.fill")
                    .font(.system(size: 44, weight: .semibold))
                    .foregroundStyle(Theme.heroGradient)
            }
            .padding(.bottom, 28)

            Text("Konumunu paylaş")
                .font(.system(size: 26, weight: .heavy))
                .foregroundStyle(Theme.ink)
            Text("Sana en yakın klinikleri ve doktorları\ngösterebilmemiz için konumuna ihtiyacımız var.")
                .font(.system(size: 15))
                .foregroundStyle(Theme.inkSecondary)
                .multilineTextAlignment(.center)
                .padding(.top, 8)
                .padding(.horizontal, 24)

            Spacer()

            VStack(spacing: 12) {
                PrimaryButton(
                    title: "Konumumu kullan",
                    icon: "location.fill",
                    isLoading: location.isResolving || isSaving
                ) { useDeviceLocation() }

                Button {
                    showManual = true
                } label: {
                    Text("Şehri elle seç")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.teal)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.stroke, lineWidth: 1))
                }
                .buttonStyle(PressableStyle())

                Button("Şimdilik geç") { auth.skipLocation() }
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Theme.inkTertiary)
                    .padding(.top, 4)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
    }

    private var manualSelection: some View {
        VStack(spacing: 0) {
            HStack {
                Button {
                    showManual = false
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(Theme.ink)
                }
                Spacer()
                Text("Şehir seç").font(.system(size: 17, weight: .bold))
                Spacer()
                Color.clear.frame(width: 20)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)

            HStack(spacing: 10) {
                Image(systemName: "magnifyingglass").foregroundStyle(Theme.inkTertiary)
                TextField("Şehir ara", text: $searchText)
                    .font(.system(size: 15))
            }
            .padding(.horizontal, 14)
            .frame(height: 48)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.stroke, lineWidth: 1))
            .padding(.horizontal, 20)

            ScrollView(showsIndicators: false) {
                LazyVStack(spacing: 10) {
                    ForEach(filteredCities) { city in
                        Button {
                            selectCity(city)
                        } label: {
                            HStack {
                                Image(systemName: "mappin.circle.fill")
                                    .font(.system(size: 22))
                                    .foregroundStyle(Theme.teal)
                                Text(city.name)
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(Theme.ink)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(Theme.inkTertiary)
                            }
                            .padding(.horizontal, 16)
                            .frame(height: 58)
                            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.stroke, lineWidth: 1))
                        }
                        .buttonStyle(PressableStyle())
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 14)
                .padding(.bottom, 30)
            }
        }
    }

    private func useDeviceLocation() {
        Task {
            let coord = await location.requestLocation()
            if let coord {
                isSaving = true
                await auth.saveLocation(
                    lat: coord.latitude, lng: coord.longitude,
                    city: location.city, address: nil
                )
                isSaving = false
            } else {
                toast.show("Konum alınamadı. Şehri elle seçebilirsin.", style: .error)
                showManual = true
            }
        }
    }

    private func selectCity(_ city: KKTCSehir) {
        Task {
            isSaving = true
            await auth.saveCity(city.name, lat: city.lat, lng: city.lng)
            isSaving = false
        }
    }
}
