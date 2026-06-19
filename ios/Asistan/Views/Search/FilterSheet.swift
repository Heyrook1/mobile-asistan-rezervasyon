import SwiftUI

struct FilterSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State var filters: APIService.SearchFilters
    let onApply: (APIService.SearchFilters) -> Void

    @State private var specialty = ""
    @State private var service = ""
    @State private var clinicName = ""
    @State private var doctorName = ""
    @State private var maxDistance: Double = 50
    @State private var distanceEnabled = false
    @State private var minRating: Double = 0
    @State private var maxPrice: Double = 2000
    @State private var priceEnabled = false
    @State private var availableToday = false

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 24) {
                    Toggle(isOn: $availableToday) {
                        Label("Bugün müsait", systemImage: "bolt.fill")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                    }
                    .tint(Theme.teal)

                    textGroup(title: "Uzmanlık", icon: "stethoscope", text: $specialty, placeholder: "Örn. Diş Hekimi")
                    textGroup(title: "Hizmet", icon: "heart.text.square.fill", text: $service, placeholder: "Örn. Dolgu")
                    textGroup(title: "Klinik adı", icon: "cross.case.fill", text: $clinicName, placeholder: "Klinik ara")
                    textGroup(title: "Doktor adı", icon: "person.fill", text: $doctorName, placeholder: "Doktor ara")

                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Label("En düşük puan", systemImage: "star.fill")
                                .font(.system(size: 16, weight: .semibold)).foregroundStyle(Theme.ink)
                            Spacer()
                            Text(minRating == 0 ? "Tümü" : String(format: "%.1f+", minRating))
                                .font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.teal)
                        }
                        Slider(value: $minRating, in: 0...5, step: 0.5).tint(Theme.teal)
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Toggle(isOn: $distanceEnabled) {
                            Label("Mesafe sınırı", systemImage: "location.fill")
                                .font(.system(size: 16, weight: .semibold)).foregroundStyle(Theme.ink)
                        }.tint(Theme.teal)
                        if distanceEnabled {
                            HStack {
                                Slider(value: $maxDistance, in: 1...100, step: 1).tint(Theme.teal)
                                Text("\(Int(maxDistance)) km")
                                    .font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.teal)
                                    .frame(width: 60, alignment: .trailing)
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Toggle(isOn: $priceEnabled) {
                            Label("En yüksek fiyat", systemImage: "tag.fill")
                                .font(.system(size: 16, weight: .semibold)).foregroundStyle(Theme.ink)
                        }.tint(Theme.teal)
                        if priceEnabled {
                            HStack {
                                Slider(value: $maxPrice, in: 100...5000, step: 50).tint(Theme.teal)
                                Text("₺\(Int(maxPrice))")
                                    .font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.teal)
                                    .frame(width: 70, alignment: .trailing)
                            }
                        }
                    }
                }
                .padding(20)
                .padding(.bottom, 90)
            }
            .background(Theme.canvas.ignoresSafeArea())
            .navigationTitle("Filtrele")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Sıfırla") { reset() }
                        .foregroundStyle(Theme.danger)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill").foregroundStyle(Theme.inkTertiary)
                    }
                }
            }
            .safeAreaInset(edge: .bottom) {
                PrimaryButton(title: "Sonuçları göster", icon: "checkmark") {
                    apply()
                    dismiss()
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial)
            }
            .onAppear(perform: loadFromFilters)
        }
    }

    private func textGroup(title: String, icon: String, text: Binding<String>, placeholder: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: icon)
                .font(.system(size: 16, weight: .semibold)).foregroundStyle(Theme.ink)
            TextField(placeholder, text: text)
                .font(.system(size: 15))
                .padding(.horizontal, 14)
                .frame(height: 48)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.stroke, lineWidth: 1))
        }
    }

    private func loadFromFilters() {
        specialty = filters.specialty ?? ""
        service = filters.service ?? ""
        clinicName = filters.clinicName ?? ""
        doctorName = filters.doctorName ?? ""
        availableToday = filters.availableToday ?? false
        minRating = filters.minRating ?? 0
        if let d = filters.maxDistanceKm { distanceEnabled = true; maxDistance = d }
        if let p = filters.maxPrice { priceEnabled = true; maxPrice = p }
    }

    private func reset() {
        specialty = ""; service = ""; clinicName = ""; doctorName = ""
        availableToday = false; minRating = 0
        distanceEnabled = false; maxDistance = 50
        priceEnabled = false; maxPrice = 2000
    }

    private func apply() {
        var f = APIService.SearchFilters()
        f.specialty = specialty.trimmed
        f.service = service.trimmed
        f.clinicName = clinicName.trimmed
        f.doctorName = doctorName.trimmed
        f.availableToday = availableToday ? true : nil
        f.minRating = minRating > 0 ? minRating : nil
        f.maxDistanceKm = distanceEnabled ? maxDistance : nil
        f.maxPrice = priceEnabled ? maxPrice : nil
        onApply(f)
    }
}

private extension String {
    var trimmed: String? {
        let t = trimmingCharacters(in: .whitespaces)
        return t.isEmpty ? nil : t
    }
}
