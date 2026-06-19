import SwiftUI

@MainActor
@Observable
final class DoctorModel {
    var doctor: Provider?
    var reviews: [ReviewItem] = []
    var isLoading = true

    func load(staffId: String, lat: Double?, lng: Double?) async {
        do {
            let res = try await APIService.doctor(staffId: staffId, lat: lat, lng: lng)
            doctor = res.doctor
            reviews = res.reviews
        } catch {
            print("doctor load failed: \(error)")
        }
        isLoading = false
    }
}

struct DoctorProfileView: View {
    let staffId: String
    @Environment(AuthManager.self) private var auth
    @State private var model = DoctorModel()
    @State private var showBooking = false
    @State private var clinicRoute: String?

    private var coord: (lat: Double, lng: Double)? { auth.coordinate }
    private var tint: Color { Color(hex: model.doctor?.primaryColor ?? "0FB9A8") }

    var body: some View {
        ZStack(alignment: .bottom) {
            if model.isLoading {
                ProgressView().tint(Theme.teal).frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let doctor = model.doctor {
                content(doctor)
                bookingBar(doctor)
            } else {
                EmptyStateView(icon: "person.crop.circle.badge.questionmark", title: "Doktor bulunamadı", message: "Bu profil artık mevcut değil.")
            }
        }
        .background(Theme.canvas.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(item: $clinicRoute) { id in ClinicProfileView(businessId: id) }
        .sheet(isPresented: $showBooking) {
            if let doctor = model.doctor {
                BookingFlowView(provider: doctor)
            }
        }
        .task { await model.load(staffId: staffId, lat: coord?.lat, lng: coord?.lng) }
    }

    private func content(_ doctor: Provider) -> some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 18) {
                heroHeader(doctor)
                if let next = doctor.nextAvailable {
                    nextSlotBanner(next)
                }
                if let bio = doctor.bio, !bio.isEmpty {
                    infoCard(title: "Hakkında", icon: "person.text.rectangle") {
                        Text(bio).font(.system(size: 14)).foregroundStyle(Theme.inkSecondary)
                    }
                }
                servicesCard(doctor)
                clinicCard(doctor)
                if !model.reviews.isEmpty {
                    reviewsCard
                }
                Color.clear.frame(height: 110)
            }
            .padding(.horizontal, 18)
            .padding(.top, 8)
        }
    }

    private func heroHeader(_ doctor: Provider) -> some View {
        VStack(spacing: 14) {
            ClinicAvatar(logoUrl: doctor.logoUrl, name: doctor.doctorName, tint: tint, size: 84)
            VStack(spacing: 4) {
                Text(doctor.doctorName)
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(Theme.ink)
                    .multilineTextAlignment(.center)
                if let specialty = doctor.specialty, !specialty.isEmpty {
                    Text(specialty)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(tint)
                }
            }
            HStack(spacing: 18) {
                statItem(value: doctor.reviewCount > 0 ? String(format: "%.1f", doctor.rating) : "—", label: "Puan", icon: "star.fill", color: Theme.warning)
                divider
                statItem(value: "\(doctor.reviewCount)", label: "Yorum", icon: "text.bubble.fill", color: Theme.blue)
                divider
                statItem(value: doctor.isOpenNow ? "Açık" : "Kapalı", label: "Durum", icon: "clock.fill", color: doctor.isOpenNow ? Theme.success : Theme.inkTertiary)
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

    private func nextSlotBanner(_ next: NextSlot) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 22)).foregroundStyle(.white)
            VStack(alignment: .leading, spacing: 2) {
                Text("İlk uygun randevu").font(.system(size: 12, weight: .medium)).foregroundStyle(.white.opacity(0.9))
                Text(Format.nextSlotLabel(next, today: Format.todayIso))
                    .font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
            }
            Spacer()
        }
        .padding(16)
        .background(Theme.heroGradient, in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
    }

    private func servicesCard(_ doctor: Provider) -> some View {
        infoCard(title: "Hizmetler", icon: "list.bullet.rectangle.fill") {
            VStack(spacing: 10) {
                if doctor.services.isEmpty {
                    Text("Henüz hizmet eklenmemiş.").font(.system(size: 13)).foregroundStyle(Theme.inkTertiary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                } else {
                    ForEach(doctor.services) { svc in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(svc.name).font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.ink)
                                Text("\(svc.durationMin) dk").font(.system(size: 12)).foregroundStyle(Theme.inkTertiary)
                            }
                            Spacer()
                            Text(Format.price(svc.price, currency: svc.currency))
                                .font(.system(size: 14, weight: .bold)).foregroundStyle(tint)
                        }
                        if svc.id != doctor.services.last?.id {
                            Divider().background(Theme.stroke)
                        }
                    }
                }
            }
        }
    }

    private func clinicCard(_ doctor: Provider) -> some View {
        Button { clinicRoute = doctor.businessId } label: {
            HStack(spacing: 12) {
                ClinicAvatar(logoUrl: doctor.logoUrl, name: doctor.clinicName, tint: tint, size: 46)
                VStack(alignment: .leading, spacing: 2) {
                    Text(doctor.clinicName).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.ink)
                    if let address = doctor.address ?? doctor.city {
                        Text(address).font(.system(size: 12.5)).foregroundStyle(Theme.inkSecondary).lineLimit(1)
                    }
                }
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.inkTertiary)
            }
            .asistanCard()
        }
        .buttonStyle(PressableStyle())
    }

    private var reviewsCard: some View {
        infoCard(title: "Değerlendirmeler", icon: "star.bubble.fill") {
            VStack(spacing: 14) {
                ForEach(model.reviews.prefix(5)) { review in
                    ReviewRow(review: review)
                    if review.id != model.reviews.prefix(5).last?.id {
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

    private func bookingBar(_ doctor: Provider) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 1) {
                    if let range = Format.priceRange(min: doctor.priceMin, max: doctor.priceMax, currency: doctor.currency) {
                        Text(range).font(.system(size: 18, weight: .heavy)).foregroundStyle(Theme.ink)
                        Text("başlangıç fiyatı").font(.system(size: 11)).foregroundStyle(Theme.inkTertiary)
                    } else {
                        Text("Randevu al").font(.system(size: 16, weight: .heavy)).foregroundStyle(Theme.ink)
                    }
                }
                Spacer()
                Button { showBooking = true } label: {
                    HStack(spacing: 7) {
                        Text("Randevu al").font(.system(size: 16, weight: .bold))
                        Image(systemName: "arrow.right").font(.system(size: 14, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 26)
                    .frame(height: 52)
                    .background(Theme.brandGradient, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
                    .shadow(color: Theme.teal.opacity(0.35), radius: 12, y: 6)
                }
                .buttonStyle(PressableStyle())
                .disabled(doctor.services.isEmpty)
                .opacity(doctor.services.isEmpty ? 0.5 : 1)
            }
            .padding(.horizontal, 20)
            .padding(.top, 14)
            .padding(.bottom, 28)
        }
        .background(Theme.surface.ignoresSafeArea(edges: .bottom).shadow(color: .black.opacity(0.08), radius: 14, y: -6))
    }
}

struct ReviewRow: View {
    let review: ReviewItem
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 3) {
                ForEach(1...5, id: \.self) { i in
                    Image(systemName: i <= review.rating ? "star.fill" : "star")
                        .font(.system(size: 12)).foregroundStyle(Theme.warning)
                }
                Spacer()
                Text(Format.shortDate(String(review.createdAt.prefix(10))))
                    .font(.system(size: 11)).foregroundStyle(Theme.inkTertiary)
            }
            if let comment = review.comment, !comment.isEmpty {
                Text(comment).font(.system(size: 13.5)).foregroundStyle(Theme.inkSecondary)
            }
            HStack(spacing: 12) {
                if let q = review.serviceQuality { miniStat("Kalite", q) }
                if let w = review.waitingTime { miniStat("Bekleme", w) }
                if let c = review.communication { miniStat("İletişim", c) }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func miniStat(_ label: String, _ value: Int) -> some View {
        HStack(spacing: 3) {
            Text(label).font(.system(size: 10.5)).foregroundStyle(Theme.inkTertiary)
            Text("\(value)").font(.system(size: 11, weight: .bold)).foregroundStyle(Theme.inkSecondary)
            Image(systemName: "star.fill").font(.system(size: 8)).foregroundStyle(Theme.warning)
        }
    }
}
