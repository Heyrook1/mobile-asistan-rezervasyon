import SwiftUI

struct ReviewSheet: View {
    @Environment(\.dismiss) private var dismiss
    let appointment: AppointmentRow
    let onSubmitted: () -> Void

    @State private var rating = 5
    @State private var serviceQuality = 5
    @State private var waitingTime = 5
    @State private var communication = 5
    @State private var comment = ""
    @State private var isSubmitting = false
    @State private var errorText: String?

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 22) {
                    VStack(spacing: 6) {
                        Text(appointment.service?.name ?? "Randevu")
                            .font(.system(size: 18, weight: .heavy)).foregroundStyle(Theme.ink)
                        if let doctor = appointment.teamMember?.fullName {
                            Text(doctor).font(.system(size: 14)).foregroundStyle(Theme.inkSecondary)
                        }
                    }
                    .padding(.top, 8)

                    VStack(spacing: 10) {
                        Text("Genel puanınız").font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.inkSecondary)
                        StarPicker(value: $rating, size: 38)
                    }
                    .frame(maxWidth: .infinity).asistanCard(padding: 20)

                    VStack(spacing: 16) {
                        ratingRow("Hizmet kalitesi", $serviceQuality)
                        Divider().background(Theme.stroke)
                        ratingRow("Bekleme süresi", $waitingTime)
                        Divider().background(Theme.stroke)
                        ratingRow("İletişim", $communication)
                    }
                    .asistanCard()

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Yorumunuz (opsiyonel)").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.inkSecondary)
                        TextField("Deneyiminizi paylaşın", text: $comment, axis: .vertical)
                            .font(.system(size: 15)).lineLimit(4...8).padding(14)
                            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.stroke, lineWidth: 1))
                    }

                    if let errorText {
                        Text(errorText).font(.system(size: 13, weight: .medium)).foregroundStyle(Theme.danger)
                    }

                    Color.clear.frame(height: 80)
                }
                .padding(.horizontal, 20)
            }
            .background(Theme.canvas.ignoresSafeArea())
            .navigationTitle("Değerlendirme")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: { Image(systemName: "xmark.circle.fill").foregroundStyle(Theme.inkTertiary) }
                }
            }
            .safeAreaInset(edge: .bottom) {
                PrimaryButton(title: "Değerlendirmeyi gönder", icon: "paperplane.fill", isLoading: isSubmitting) {
                    submit()
                }
                .padding(.horizontal, 20).padding(.vertical, 12)
                .background(.ultraThinMaterial)
            }
        }
    }

    private func ratingRow(_ label: String, _ value: Binding<Int>) -> some View {
        HStack {
            Text(label).font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.ink)
            Spacer()
            StarPicker(value: value, size: 20)
        }
    }

    private func submit() {
        errorText = nil
        isSubmitting = true
        Task {
            do {
                try await APIService.submitReview(
                    appointmentId: appointment.id,
                    rating: rating,
                    comment: comment.trimmingCharacters(in: .whitespaces).isEmpty ? nil : comment,
                    serviceQuality: serviceQuality,
                    waitingTime: waitingTime,
                    communication: communication
                )
                isSubmitting = false
                onSubmitted()
                dismiss()
            } catch let error as APIError {
                isSubmitting = false
                errorText = error.message
            } catch {
                isSubmitting = false
                errorText = "Değerlendirme gönderilemedi."
            }
        }
    }
}

struct StarPicker: View {
    @Binding var value: Int
    var size: CGFloat = 28

    var body: some View {
        HStack(spacing: size * 0.2) {
            ForEach(1...5, id: \.self) { i in
                Button {
                    value = i
                    let gen = UIImpactFeedbackGenerator(style: .light); gen.impactOccurred()
                } label: {
                    Image(systemName: i <= value ? "star.fill" : "star")
                        .font(.system(size: size))
                        .foregroundStyle(i <= value ? Theme.warning : Theme.stroke)
                }
                .buttonStyle(.plain)
            }
        }
    }
}
