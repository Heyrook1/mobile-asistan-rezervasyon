import SwiftUI

@MainActor
@Observable
final class AppointmentsModel {
    var appointments: [AppointmentRow] = []
    var isLoading = true
    var errorMessage: String?

    func load() async {
        errorMessage = nil
        do {
            appointments = try await APIService.myAppointments()
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = "Randevular yüklenemedi."
        }
        isLoading = false
    }

    var upcoming: [AppointmentRow] {
        appointments.filter { ["SCHEDULED", "CONFIRMED"].contains($0.status) }
            .sorted { ($0.date, $0.startTime) < ($1.date, $1.startTime) }
    }
    var past: [AppointmentRow] {
        appointments.filter { ["COMPLETED", "NO_SHOW"].contains($0.status) }
    }
    var cancelled: [AppointmentRow] {
        appointments.filter { $0.status == "CANCELLED" }
    }
}

struct AppointmentsView: View {
    @Environment(ToastCenter.self) private var toast
    @State private var model = AppointmentsModel()
    @State private var tab = 0
    @State private var cancelTarget: AppointmentRow?
    @State private var reviewTarget: AppointmentRow?

    private let tabs = ["Yaklaşan", "Geçmiş", "İptal"]

    private var currentList: [AppointmentRow] {
        switch tab {
        case 0: return model.upcoming
        case 1: return model.past
        default: return model.cancelled
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Text("Randevularım")
                    .font(.system(size: 28, weight: .heavy)).foregroundStyle(Theme.ink)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 18).padding(.top, 8).padding(.bottom, 14)

                segmentBar

                ScrollView(showsIndicators: false) {
                    if model.isLoading {
                        VStack(spacing: 14) { ForEach(0..<3, id: \.self) { _ in SkeletonCard(height: 130) } }
                            .padding(.horizontal, 18).padding(.top, 14)
                    } else if currentList.isEmpty {
                        EmptyStateView(
                            icon: emptyIcon,
                            title: emptyTitle,
                            message: emptyMessage
                        )
                        .padding(.top, 50)
                    } else {
                        VStack(spacing: 14) {
                            ForEach(currentList) { appt in
                                AppointmentCard(
                                    appt: appt,
                                    onCancel: ["SCHEDULED", "CONFIRMED"].contains(appt.status) ? { cancelTarget = appt } : nil,
                                    onReview: (appt.status == "COMPLETED" && !appt.hasReview) ? { reviewTarget = appt } : nil
                                )
                            }
                        }
                        .padding(.horizontal, 18).padding(.top, 14)
                    }
                    Color.clear.frame(height: 90)
                }
                .refreshable { await model.load() }
            }
            .background(Theme.canvas.ignoresSafeArea())
            .confirmationDialog("Randevuyu iptal et?", isPresented: Binding(get: { cancelTarget != nil }, set: { if !$0 { cancelTarget = nil } }), titleVisibility: .visible) {
                Button("Randevuyu iptal et", role: .destructive) {
                    if let target = cancelTarget { cancel(target) }
                }
                Button("Vazgeç", role: .cancel) {}
            } message: {
                Text("Bu randevuyu iptal etmek istediğinize emin misiniz?")
            }
            .sheet(item: $reviewTarget) { appt in
                ReviewSheet(appointment: appt) {
                    Task { await model.load() }
                    toast.show("Değerlendirmeniz için teşekkürler!", style: .success)
                }
            }
        }
        .task { await model.load() }
    }

    private var segmentBar: some View {
        HStack(spacing: 0) {
            ForEach(0..<tabs.count, id: \.self) { i in
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) { tab = i }
                } label: {
                    VStack(spacing: 6) {
                        Text(tabs[i])
                            .font(.system(size: 14, weight: tab == i ? .bold : .medium))
                            .foregroundStyle(tab == i ? Theme.teal : Theme.inkTertiary)
                        Capsule()
                            .fill(tab == i ? Theme.teal : Color.clear)
                            .frame(height: 3)
                    }
                }
                .buttonStyle(.plain)
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal, 18)
        .overlay(Rectangle().fill(Theme.stroke).frame(height: 1), alignment: .bottom)
    }

    private func cancel(_ appt: AppointmentRow) {
        Task {
            do {
                try await APIService.cancel(appointmentId: appt.id)
                await model.load()
                toast.show("Randevunuz iptal edildi.", style: .success)
            } catch let error as APIError {
                toast.show(error.message, style: .error)
            } catch {
                toast.show("İptal işlemi başarısız.", style: .error)
            }
        }
        cancelTarget = nil
    }

    private var emptyIcon: String { tab == 0 ? "calendar.badge.plus" : tab == 1 ? "clock.arrow.circlepath" : "calendar.badge.minus" }
    private var emptyTitle: String { tab == 0 ? "Yaklaşan randevu yok" : tab == 1 ? "Geçmiş randevu yok" : "İptal edilen randevu yok" }
    private var emptyMessage: String {
        tab == 0 ? "Ana sayfadan bir klinik seçerek hemen randevu alabilirsiniz." :
        tab == 1 ? "Tamamlanan randevularınız burada görünecek." :
        "İptal ettiğiniz randevular burada listelenir."
    }
}

struct AppointmentCard: View {
    let appt: AppointmentRow
    var onCancel: (() -> Void)?
    var onReview: (() -> Void)?

    private var tint: Color { Color(hex: appt.business?.primaryColor ?? "0FB9A8") }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                ClinicAvatar(logoUrl: appt.business?.logoUrl, name: appt.business?.name ?? "Klinik", tint: tint, size: 48)
                VStack(alignment: .leading, spacing: 2) {
                    Text(appt.service?.name ?? "Randevu")
                        .font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.ink).lineLimit(1)
                    if let doctor = appt.teamMember?.fullName {
                        Text(doctor).font(.system(size: 13, weight: .medium)).foregroundStyle(tint).lineLimit(1)
                    }
                    Text(appt.business?.name ?? "").font(.system(size: 12)).foregroundStyle(Theme.inkSecondary).lineLimit(1)
                }
                Spacer()
                StatusBadge(status: appt.status)
            }

            HStack(spacing: 14) {
                infoChip(icon: "calendar", text: Format.shortDate(appt.date))
                infoChip(icon: "clock.fill", text: "\(appt.startTime) - \(appt.endTime)")
                if let price = appt.price, price > 0 {
                    infoChip(icon: "tag.fill", text: Format.price(price))
                }
            }

            if let note = appt.notes, !note.isEmpty {
                Text(note)
                    .font(.system(size: 12.5)).foregroundStyle(Theme.inkSecondary)
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Theme.canvas, in: RoundedRectangle(cornerRadius: 10))
            }

            if onCancel != nil || onReview != nil {
                Divider().background(Theme.stroke)
                HStack(spacing: 10) {
                    if let onReview {
                        Button(action: onReview) {
                            Label("Değerlendir", systemImage: "star.fill")
                                .font(.system(size: 13, weight: .bold)).foregroundStyle(.white)
                                .frame(maxWidth: .infinity).frame(height: 40)
                                .background(Theme.brandGradient, in: RoundedRectangle(cornerRadius: 11))
                        }
                        .buttonStyle(PressableStyle())
                    }
                    if let onCancel {
                        Button(action: onCancel) {
                            Label("İptal et", systemImage: "xmark")
                                .font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.danger)
                                .frame(maxWidth: .infinity).frame(height: 40)
                                .background(Theme.danger.opacity(0.1), in: RoundedRectangle(cornerRadius: 11))
                        }
                        .buttonStyle(PressableStyle())
                    }
                }
            }
        }
        .asistanCard()
    }

    private func infoChip(icon: String, text: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 11)).foregroundStyle(tint)
            Text(text).font(.system(size: 12.5, weight: .semibold)).foregroundStyle(Theme.inkSecondary)
        }
    }
}
