import SwiftUI
import CoreLocation

struct ProfileView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(ToastCenter.self) private var toast
    @Environment(\.colorScheme) private var colorScheme
    @AppStorage("preferredColorScheme") private var preferredScheme: AppTheme = .system
    @State private var showEdit = false
    @State private var showLocation = false
    @State private var showSignOut = false

    private var user: ClientUser? { auth.clientUser }
    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {
                    profileHeader
                    accountCard
                    locationCard
                    preferencesCard
                    aboutCard
                    signOutButton
                    Color.clear.frame(height: 90)
                }
                .padding(.horizontal, 18).padding(.top, 8)
            }
            .background(colors.canvas.ignoresSafeArea())
            .sheet(isPresented: $showEdit) {
                EditProfileSheet { toast.show("Profiliniz güncellendi.", style: .success) }
            }
            .sheet(isPresented: $showLocation) {
                EditLocationSheet { toast.show("Konumunuz güncellendi.", style: .success) }
            }
            .confirmationDialog("Çıkış yap", isPresented: $showSignOut, titleVisibility: .visible) {
                Button("Çıkış yap", role: .destructive) { Task { await auth.signOut() } }
                Button("Vazgeç", role: .cancel) {}
            }
        }
    }

    private var profileHeader: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle().fill(Theme.brandGradient).frame(width: 84, height: 84)
                Text((user?.fullName.prefix(1) ?? "K").uppercased())
                    .font(.system(size: 34, weight: .bold)).foregroundStyle(.white)
            }
            VStack(spacing: 3) {
                Text(user?.fullName ?? "Kullanıcı").font(.system(size: 21, weight: .heavy)).foregroundStyle(colors.ink)
                if let email = user?.email {
                    Text(email).font(.system(size: 14)).foregroundStyle(colors.inkSecondary)
                }
            }
            Button { showEdit = true } label: {
                Label("Profili düzenle", systemImage: "pencil")
                    .font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.teal)
                    .padding(.horizontal, 18).padding(.vertical, 9)
                    .background(Theme.teal.opacity(0.1), in: Capsule())
            }
            .buttonStyle(PressableStyle())
        }
        .frame(maxWidth: .infinity).asistanCard(padding: 20)
    }

    private var accountCard: some View {
        card(title: "Hesap Bilgileri", icon: "person.text.rectangle.fill") {
            VStack(spacing: 0) {
                infoRow(icon: "person.fill", label: "Ad Soyad", value: user?.fullName ?? "-")
                divider
                infoRow(icon: "envelope.fill", label: "E-posta", value: user?.email ?? "-")
                divider
                infoRow(icon: "phone.fill", label: "Telefon", value: user?.phone ?? "Eklenmedi")
            }
        }
    }

    private var locationCard: some View {
        Button { showLocation = true } label: {
            card(title: "Konum", icon: "location.fill") {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(user?.city ?? "Konum seçilmedi")
                            .font(.system(size: 15, weight: .bold)).foregroundStyle(colors.ink)
                        Text(user?.hasLocation == true ? "Yakındaki klinikler gösteriliyor" : "Şehir seçerek klinik bulun")
                            .font(.system(size: 12.5)).foregroundStyle(colors.inkSecondary)
                    }
                    Spacer()
                    Image(systemName: "chevron.right").font(.system(size: 13, weight: .bold)).foregroundStyle(colors.inkTertiary)
                }
            }
        }
        .buttonStyle(PressableStyle())
    }

    private var preferencesCard: some View {
        card(title: "Tercihler", icon: "gear") {
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    Image(systemName: preferredScheme == .dark ? "moon.fill" : preferredScheme == .light ? "sun.max.fill" : "circle.lefthalf.filled")
                        .font(.system(size: 14)).foregroundStyle(Theme.teal).frame(width: 22)
                    Text("Tema").font(.system(size: 14)).foregroundStyle(colors.inkSecondary)
                    Spacer()
                    Picker("Tema", selection: $preferredScheme) {
                        ForEach(AppTheme.allCases, id: \.self) { theme in
                            Text(theme.displayName).tag(theme)
                        }
                    }
                    .pickerStyle(.menu)
                    .tint(Theme.teal)
                }
                .padding(.vertical, 12)
            }
        }
    }

    private var aboutCard: some View {
        card(title: "Hakkında", icon: "info.circle.fill") {
            VStack(spacing: 0) {
                linkRow(icon: "shield.fill", label: "Gizlilik ve KVKK")
                divider
                linkRow(icon: "doc.text.fill", label: "Kullanım koşulları")
                divider
                infoRow(icon: "number", label: "Sürüm", value: "1.0.0")
            }
        }
    }

    private var signOutButton: some View {
        Button { showSignOut = true } label: {
            Label("Çıkış Yap", systemImage: "rectangle.portrait.and.arrow.right")
                .font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.danger)
                .frame(maxWidth: .infinity).frame(height: 54)
                .background(colors.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.danger.opacity(0.3), lineWidth: 1))
        }
        .buttonStyle(PressableStyle())
    }

    private var divider: some View { Divider().background(colors.stroke).padding(.leading, 36) }

    private func infoRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(Theme.teal).frame(width: 22)
            Text(label).font(.system(size: 14)).foregroundStyle(colors.inkSecondary)
            Spacer()
            Text(value).font(.system(size: 14, weight: .semibold)).foregroundStyle(colors.ink).lineLimit(1)
        }
        .padding(.vertical, 12)
    }

    private func linkRow(icon: String, label: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(Theme.teal).frame(width: 22)
            Text(label).font(.system(size: 14, weight: .medium)).foregroundStyle(colors.ink)
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 12, weight: .bold)).foregroundStyle(colors.inkTertiary)
        }
        .padding(.vertical, 12)
    }

    private func card<Content: View>(title: String, icon: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 7) {
                Image(systemName: icon).font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.teal)
                Text(title).font(.system(size: 14, weight: .heavy)).foregroundStyle(colors.inkSecondary)
            }
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading).asistanCard()
    }
}

struct EditProfileSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AuthManager.self) private var auth
    let onSaved: () -> Void

    @State private var fullName = ""
    @State private var phone = ""
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                fieldGroup(title: "Ad Soyad", icon: "person.fill", text: $fullName, placeholder: "Ad Soyad")
                fieldGroup(title: "Telefon", icon: "phone.fill", text: $phone, placeholder: "Telefon", keyboard: .phonePad)
                Spacer()
            }
            .padding(20)
            .background(Color(.systemGroupedBackground).ignoresSafeArea())
            .navigationTitle("Profili Düzenle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("Vazgeç") { dismiss() }.foregroundStyle(Theme.inkSecondary) }
            }
            .safeAreaInset(edge: .bottom) {
                PrimaryButton(title: "Kaydet", isLoading: isSaving, enabled: !fullName.trimmingCharacters(in: .whitespaces).isEmpty) { save() }
                    .padding(.horizontal, 20).padding(.vertical, 12).background(.ultraThinMaterial)
            }
            .onAppear {
                fullName = auth.clientUser?.fullName ?? ""
                phone = auth.clientUser?.phone ?? ""
            }
        }
    }

    private func fieldGroup(title: String, icon: String, text: Binding<String>, placeholder: String, keyboard: UIKeyboardType = .default) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.inkSecondary)
            HStack(spacing: 10) {
                Image(systemName: icon).foregroundStyle(Theme.teal).frame(width: 20)
                TextField(placeholder, text: text).font(.system(size: 15)).keyboardType(keyboard)
            }
            .padding(.horizontal, 14).frame(height: 52)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.stroke, lineWidth: 1))
        }
    }

    private func save() {
        isSaving = true
        Task {
            if let updated = try? await APIService.updateProfile(
                fullName: fullName.trimmingCharacters(in: .whitespaces),
                phone: phone.trimmingCharacters(in: .whitespaces)
            ) {
                auth.clientUser = updated
            }
            isSaving = false
            onSaved()
            dismiss()
        }
    }
}

struct EditLocationSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AuthManager.self) private var auth
    let onSaved: () -> Void

    @State private var location = LocationManager()
    @State private var searchText = ""
    @State private var isSaving = false

    private var filteredCities: [KKTCSehir] {
        searchText.isEmpty ? KKTCSehir.all : KKTCSehir.all.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 14) {
                Button { useDevice() } label: {
                    HStack(spacing: 10) {
                        if location.isResolving || isSaving { ProgressView().tint(Theme.teal) }
                        else { Image(systemName: "location.fill").foregroundStyle(Theme.teal) }
                        Text("Mevcut konumumu kullan").font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.teal)
                        Spacer()
                    }
                    .padding(16)
                    .background(Theme.teal.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
                }
                .buttonStyle(PressableStyle())

                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").foregroundStyle(Theme.inkTertiary)
                    TextField("Şehir ara", text: $searchText).font(.system(size: 15))
                }
                .padding(.horizontal, 14).frame(height: 48)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.stroke, lineWidth: 1))

                ScrollView(showsIndicators: false) {
                    LazyVStack(spacing: 10) {
                        ForEach(filteredCities) { city in
                            Button { selectCity(city) } label: {
                                HStack {
                                    Image(systemName: "mappin.circle.fill").font(.system(size: 20)).foregroundStyle(Theme.teal)
                                    Text(city.name).font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.ink)
                                    Spacer()
                                    if auth.clientUser?.city == city.name {
                                        Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.teal)
                                    }
                                }
                                .padding(.horizontal, 16).frame(height: 54)
                                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12))
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.stroke, lineWidth: 1))
                            }
                            .buttonStyle(PressableStyle())
                        }
                    }
                    .padding(.bottom, 20)
                }
            }
            .padding(20)
            .background(Color(.systemGroupedBackground).ignoresSafeArea())
            .navigationTitle("Konum")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) { Button { dismiss() } label: { Image(systemName: "xmark.circle.fill").foregroundStyle(Theme.inkTertiary) } }
            }
        }
    }

    private func useDevice() {
        Task {
            if let coord = await location.requestLocation() {
                isSaving = true
                await auth.saveLocation(lat: coord.latitude, lng: coord.longitude, city: location.city, address: nil)
                isSaving = false
                onSaved(); dismiss()
            }
        }
    }

    private func selectCity(_ city: KKTCSehir) {
        Task {
            isSaving = true
            await auth.saveCity(city.name, lat: city.lat, lng: city.lng)
            isSaving = false
            onSaved(); dismiss()
        }
    }
}
