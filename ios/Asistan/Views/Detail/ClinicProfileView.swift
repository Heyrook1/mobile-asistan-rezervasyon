import SwiftUI

@MainActor
@Observable
final class ClinicModel {
    var response: ClinicResponse?
    var isLoading = true

    func load(businessId: String, lat: Double?, lng: Double?) async {
        do {
            response = try await APIService.clinic(businessId: businessId, lat: lat, lng: lng)
        } catch {
            print("clinic load failed: \(error)")
        }
        isLoading = false
    }
}

struct ClinicProfileView: View {
    let businessId: String
    @Environment(AuthManager.self) private var auth
    @State private var model = ClinicModel()
    @State private var doctorRoute: String?

    private var coord: (lat: Double, lng: Double)? { auth.coordinate }
    private var tint: Color { Color(hex: model.response?.business?.primaryColor ?? "0FB9A8") }

    var body: some View {
        ScrollView(showsIndicators: false) {
            if model.isLoading {
                VStack(spacing: 14) {
                    SkeletonCard(height: 180)
                    ForEach(0..<2, id: \.self) { _ in SkeletonCard(height: 140) }
                }
                .padding(.horizontal, 18).padding(.top, 8)
            } else if let response = model.response, let business = response.business {
                VStack(spacing: 18) {
                    header(business, response)
                    if let description = business.description, !description.isEmpty {
                        infoCard(title: "Hakkında", icon: "info.circle.fill") {
                            Text(description).font(.system(size: 14)).foregroundStyle(Theme.inkSecondary)
                        }
                    }
                    contactCard(business)
                    doctorsCard(response)
                    if !response.reviews.isEmpty {
                        reviewsCard(response)
                    }
                    Color.clear.frame(height: 90)
                }
                .padding(.horizontal, 18).padding(.top, 8)
            } else {
                EmptyStateView(icon: "cross.case", title: "Klinik bulunamadı", message: "Bu klinik artık mevcut değil.")
                    .padding(.top, 60)
            }
        }
        .background(Theme.canvas.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(item: $doctorRoute) { id in DoctorProfileView(staffId: id) }
        .task { await model.load(businessId: businessId, lat: coord?.lat, lng: coord?.lng) }
    }

    private func header(_ business: ClinicInfo, _ response: ClinicResponse) -> some View {
        VStack(spacing: 14) {
            ClinicAvatar(logoUrl: business.logoUrl, name: business.name, tint: tint, size: 80)
            VStack(spacing: 4) {
                Text(business.name).font(.system(size: 22, weight: .heavy)).foregroundStyle(Theme.ink).multilineTextAlignment(.center)
                if let city = business.city {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin.and.ellipse").font(.system(size: 11))
                        Text([business.address, city].compactMap { $0 }.first ?? city)
                            .font(.system(size: 13)).lineLimit(1)
                    }
                    .foregroundStyle(Theme.inkSecondary)
                }
            }
            HStack(spacing: 18) {
                statItem(value: response.reviewCount > 0 ? String(format: "%.1f", response.rating) : "—", label: "Puan", icon: "star.fill", color: Theme.warning)
                divider
                statItem(value: "\(response.reviewCount)", label: "Yorum", icon: "text.bubble.fill", color: Theme.blue)
                divider
                statItem(value: "\(response.doctors.count)", label: "Uzman", icon: "person.2.fill", color: tint)
            }
            if let dist = Format.distance(business.distanceKm) {
                Label(dist + " uzaklıkta", systemImage: "location.fill")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(tint)
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .background(tint.opacity(0.1), in: Capsule())
            }
        }
        .frame(maxWidth: .infinity)
        .asistanCard(padding: 20)
    }

    private var divider: some View { Rectangle().fill(Theme.stroke).frame(width: 1, height: 32) }

    private func statItem(value: String, label: String, icon: String, color: Color) -> some View {
        VStack(spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon).font(.system(size: 12)).foregroundStyle(color)
                Text(value).font(.system(size: 17, weight: .bold)).foregroundStyle(Theme.ink)
            }
            Text(label).font(.system(size: 12)).foregroundStyle(Theme.inkTertiary)
        }
        .frame(maxWidth: .infinity)
    }

    private func contactCard(_ business: ClinicInfo) -> some View {
        infoCard(title: "İletişim & Konum", icon: "mappin.circle.fill") {
            VStack(spacing: 12) {
                if let address = business.address {
                    contactRow(icon: "mappin.and.ellipse", text: address)
                }
                if let phone = business.phone, !phone.isEmpty {
                    Button {
                        if let url = URL(string: "tel://\(phone.filter { $0.isNumber || $0 == "+" })") {
                            UIApplication.shared.open(url)
                        }
                    } label: {
                        HStack {
                            contactRow(icon: "phone.fill", text: phone)
                            Spacer()
                            Image(systemName: "phone.arrow.up.right").foregroundStyle(tint)
                        }
                    }
                }
                if business.address == nil && (business.phone ?? "").isEmpty {
                    Text("İletişim bilgisi eklenmemiş.").font(.system(size: 13)).foregroundStyle(Theme.inkTertiary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private func contactRow(icon: String, text: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(tint).frame(width: 22)
            Text(text).font(.system(size: 14)).foregroundStyle(Theme.inkSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func doctorsCard(_ response: ClinicResponse) -> some View {
        infoCard(title: "Uzmanlar", icon: "person.2.fill") {
            VStack(spacing: 12) {
                ForEach(response.doctors) { doctor in
                    Button { doctorRoute = doctor.staffId } label: {
                        HStack(spacing: 12) {
                            ClinicAvatar(logoUrl: nil, name: doctor.doctorName, tint: Color(hex: doctor.color), size: 46)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(doctor.doctorName).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.ink)
                                if let specialty = doctor.specialty {
                                    Text(specialty).font(.system(size: 12.5, weight: .medium)).foregroundStyle(Color(hex: doctor.color))
                                }
                                RatingView(rating: doctor.rating, count: doctor.reviewCount, compact: true)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.inkTertiary)
                        }
                        .padding(.vertical, 4)
                    }
                    .buttonStyle(PressableStyle())
                    if doctor.staffId != response.doctors.last?.staffId {
                        Divider().background(Theme.stroke)
                    }
                }
            }
        }
    }

    private func reviewsCard(_ response: ClinicResponse) -> some View {
        infoCard(title: "Değerlendirmeler", icon: "star.bubble.fill") {
            VStack(spacing: 14) {
                ForEach(response.reviews.prefix(6)) { review in
                    ReviewRow(review: review)
                    if review.id != response.reviews.prefix(6).last?.id {
                        Divider().background(Theme.stroke)
                    }
                }
            }
        }
    }

    private func infoCard<Content: View>(title: String, icon: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 7) {
                Image(systemName: icon).font(.system(size: 14, weight: .bold)).foregroundStyle(tint)
                Text(title).font(.system(size: 17, weight: .heavy)).foregroundStyle(Theme.ink)
            }
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .asistanCard()
    }
}
