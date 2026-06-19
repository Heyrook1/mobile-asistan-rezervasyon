import SwiftUI

@MainActor
@Observable
final class BookingModel {
    let provider: Provider
    var step = 0
    var selectedService: ServiceItem?
    var selectedDate: String?
    var selectedSlot: SlotItem?
    var note = ""
    var contactPhone = ""

    var slots: [SlotItem] = []
    var loadingSlots = false
    var isBooking = false
    var bookingResult: BookingResponse?

    init(provider: Provider, defaultPhone: String?) {
        self.provider = provider
        self.contactPhone = defaultPhone ?? ""
        if provider.services.count == 1 { selectedService = provider.services.first }
    }

    /// Next 14 bookable dates.
    var dateOptions: [String] {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Europe/Istanbul") ?? .current
        let today = Date()
        return (0..<14).compactMap { offset in
            guard let date = cal.date(byAdding: .day, value: offset, to: today) else { return nil }
            let c = cal.dateComponents([.year, .month, .day], from: date)
            return String(format: "%04d-%02d-%02d", c.year ?? 2026, c.month ?? 1, c.day ?? 1)
        }
    }

    func loadSlots() async {
        guard let service = selectedService, let date = selectedDate else { return }
        loadingSlots = true
        selectedSlot = nil
        do {
            slots = try await APIService.slots(staffId: provider.staffId, serviceId: service.id, date: date)
        } catch {
            slots = []
        }
        loadingSlots = false
    }

    func confirm() async throws {
        guard let service = selectedService, let date = selectedDate, let slot = selectedSlot else { return }
        isBooking = true
        defer { isBooking = false }
        bookingResult = try await APIService.book(
            businessId: provider.businessId,
            staffId: provider.staffId,
            serviceId: service.id,
            date: date,
            startTime: slot.startTime,
            note: note.trimmingCharacters(in: .whitespaces).isEmpty ? nil : note,
            contactPhone: contactPhone.trimmingCharacters(in: .whitespaces).isEmpty ? nil : contactPhone
        )
    }
}

struct BookingFlowView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AuthManager.self) private var auth
    @Environment(ToastCenter.self) private var toast
    @State private var model: BookingModel
    @State private var errorText: String?

    init(provider: Provider) {
        _model = State(initialValue: BookingModel(provider: provider, defaultPhone: nil))
    }

    private let stepTitles = ["Hizmet", "Tarih", "Saat", "Bilgiler", "Onay"]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if let result = model.bookingResult {
                    SuccessView(result: result, provider: model.provider) { dismiss() }
                } else {
                    progressBar
                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: 18) {
                            stepContent
                            Color.clear.frame(height: 100)
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 12)
                    }
                    bottomBar
                }
            }
            .background(Theme.canvas.ignoresSafeArea())
            .navigationTitle(model.bookingResult == nil ? "Randevu Al" : "")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if model.bookingResult == nil {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { dismiss() } label: {
                            Image(systemName: "xmark.circle.fill").foregroundStyle(Theme.inkTertiary)
                        }
                    }
                }
            }
            .onAppear {
                if model.contactPhone.isEmpty { model.contactPhone = auth.clientUser?.phone ?? "" }
            }
        }
    }

    private var progressBar: some View {
        VStack(spacing: 8) {
            HStack(spacing: 6) {
                ForEach(0..<stepTitles.count, id: \.self) { i in
                    Capsule()
                        .fill(i <= model.step ? AnyShapeStyle(Theme.brandGradient) : AnyShapeStyle(Theme.stroke))
                        .frame(height: 5)
                        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: model.step)
                }
            }
            HStack {
                Text("Adım \(model.step + 1)/\(stepTitles.count)")
                    .font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.inkTertiary)
                Spacer()
                Text(stepTitles[model.step])
                    .font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.teal)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }

    @ViewBuilder
    private var stepContent: some View {
        switch model.step {
        case 0: serviceStep
        case 1: dateStep
        case 2: slotStep
        case 3: infoStep
        default: confirmStep
        }
    }

    // Step 1 — Service
    private var serviceStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            stepHeader("Hizmet seçin", "Bu uzmanın sunduğu hizmetlerden birini seçin.")
            if model.provider.services.isEmpty {
                EmptyStateView(icon: "list.bullet", title: "Hizmet yok", message: "Bu uzman için tanımlı hizmet bulunmuyor.")
            } else {
                ForEach(model.provider.services) { svc in
                    selectableRow(
                        title: svc.name,
                        subtitle: "\(svc.durationMin) dk",
                        trailing: Format.price(svc.price, currency: svc.currency),
                        isSelected: model.selectedService?.id == svc.id
                    ) {
                        model.selectedService = svc
                    }
                }
            }
        }
    }

    // Step 2 — Date
    private var dateStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            stepHeader("Tarih seçin", "Randevu almak istediğiniz günü seçin.")
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 4), spacing: 10) {
                ForEach(model.dateOptions, id: \.self) { date in
                    dateCell(date)
                }
            }
        }
    }

    private func dateCell(_ date: String) -> some View {
        let selected = model.selectedDate == date
        let parts = date.split(separator: "-")
        let day = parts.count == 3 ? String(parts[2]) : ""
        let label = Format.shortDate(date).split(separator: " ")
        let weekday = label.count >= 3 ? String(label[2]) : ""
        let month = label.count >= 2 ? String(label[1]) : ""
        return Button {
            model.selectedDate = date
            Task { await model.loadSlots() }
        } label: {
            VStack(spacing: 3) {
                Text(weekday).font(.system(size: 11, weight: .semibold))
                Text(day).font(.system(size: 19, weight: .heavy))
                Text(month).font(.system(size: 10))
            }
            .foregroundStyle(selected ? .white : Theme.ink)
            .frame(maxWidth: .infinity)
            .frame(height: 72)
            .background(
                selected ? AnyShapeStyle(Theme.brandGradient) : AnyShapeStyle(Theme.surface),
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(selected ? Color.clear : Theme.stroke, lineWidth: 1))
        }
        .buttonStyle(PressableStyle())
    }

    // Step 3 — Slot
    private var slotStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            stepHeader("Saat seçin", model.selectedDate.map { Format.shortDate($0) } ?? "")
            if model.loadingSlots {
                ProgressView().tint(Theme.teal).frame(maxWidth: .infinity).padding(.vertical, 40)
            } else if model.slots.isEmpty {
                EmptyStateView(
                    icon: "clock.badge.xmark",
                    title: "Uygun saat yok",
                    message: "Bu gün için boş randevu bulunmuyor. Lütfen başka bir gün seçin."
                )
            } else {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 10) {
                    ForEach(model.slots) { slot in
                        let selected = model.selectedSlot?.startTime == slot.startTime
                        Button {
                            model.selectedSlot = slot
                            let gen = UIImpactFeedbackGenerator(style: .light); gen.impactOccurred()
                        } label: {
                            Text(slot.startTime)
                                .font(.system(size: 15, weight: .bold))
                                .foregroundStyle(selected ? .white : Theme.ink)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(
                                    selected ? AnyShapeStyle(Theme.brandGradient) : AnyShapeStyle(Theme.surface),
                                    in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                                )
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(selected ? Color.clear : Theme.stroke, lineWidth: 1))
                        }
                        .buttonStyle(PressableStyle())
                    }
                }
            }
        }
    }

    // Step 4 — Info
    private var infoStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            stepHeader("İletişim & not", "Klinik sizinle iletişime geçebilir.")
            VStack(alignment: .leading, spacing: 8) {
                Text("Telefon").font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.inkSecondary)
                TextField("Telefon numaranız", text: $model.contactPhone)
                    .keyboardType(.phonePad)
                    .font(.system(size: 15))
                    .padding(.horizontal, 14).frame(height: 50)
                    .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.stroke, lineWidth: 1))
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("Not (opsiyonel)").font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.inkSecondary)
                TextField("Şikayetiniz veya notunuz", text: $model.note, axis: .vertical)
                    .font(.system(size: 15))
                    .lineLimit(3...6)
                    .padding(14)
                    .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.stroke, lineWidth: 1))
            }
        }
    }

    // Step 5 — Confirm
    private var confirmStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            stepHeader("Randevuyu onayla", "Bilgileri kontrol edin ve onaylayın.")
            VStack(spacing: 0) {
                summaryRow(icon: "person.fill", label: "Uzman", value: model.provider.doctorName)
                divider
                summaryRow(icon: "cross.case.fill", label: "Klinik", value: model.provider.clinicName)
                divider
                summaryRow(icon: "list.bullet", label: "Hizmet", value: model.selectedService?.name ?? "-")
                divider
                summaryRow(icon: "calendar", label: "Tarih", value: model.selectedDate.map { Format.shortDate($0) } ?? "-")
                divider
                summaryRow(icon: "clock.fill", label: "Saat", value: model.selectedSlot.map { "\($0.startTime) - \($0.endTime)" } ?? "-")
                if let svc = model.selectedService {
                    divider
                    summaryRow(icon: "tag.fill", label: "Ücret", value: Format.price(svc.price, currency: svc.currency))
                }
            }
            .asistanCard()

            HStack(spacing: 8) {
                Image(systemName: model.provider.autoConfirm ? "checkmark.seal.fill" : "clock.badge.checkmark")
                    .foregroundStyle(model.provider.autoConfirm ? Theme.success : Theme.pendingAmber)
                Text(model.provider.autoConfirm
                     ? "Randevunuz anında onaylanacak."
                     : "Randevunuz klinik onayına gönderilecek.")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Theme.inkSecondary)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background((model.provider.autoConfirm ? Theme.success : Theme.pendingAmber).opacity(0.1), in: RoundedRectangle(cornerRadius: 12))

            if let errorText {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill")
                    Text(errorText).font(.system(size: 13, weight: .medium))
                }
                .foregroundStyle(Theme.danger)
            }
        }
    }

    private var divider: some View { Divider().background(Theme.stroke).padding(.leading, 44) }

    private func summaryRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(Theme.teal).frame(width: 24)
            Text(label).font(.system(size: 14)).foregroundStyle(Theme.inkSecondary)
            Spacer()
            Text(value).font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.ink)
                .multilineTextAlignment(.trailing)
        }
        .padding(.vertical, 11)
    }

    private func stepHeader(_ title: String, _ subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title).font(.system(size: 22, weight: .heavy)).foregroundStyle(Theme.ink)
            if !subtitle.isEmpty {
                Text(subtitle).font(.system(size: 14)).foregroundStyle(Theme.inkSecondary)
            }
        }
    }

    private func selectableRow(title: String, subtitle: String, trailing: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 22))
                    .foregroundStyle(isSelected ? Theme.teal : Theme.stroke)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.ink)
                    Text(subtitle).font(.system(size: 12.5)).foregroundStyle(Theme.inkTertiary)
                }
                Spacer()
                Text(trailing).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.teal)
            }
            .padding(16)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(isSelected ? Theme.teal : Theme.stroke, lineWidth: isSelected ? 1.5 : 1))
        }
        .buttonStyle(PressableStyle())
    }

    private var canAdvance: Bool {
        switch model.step {
        case 0: return model.selectedService != nil
        case 1: return model.selectedDate != nil
        case 2: return model.selectedSlot != nil
        case 3: return true
        default: return true
        }
    }

    private var bottomBar: some View {
        HStack(spacing: 12) {
            if model.step > 0 {
                Button {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) { model.step -= 1 }
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(Theme.ink)
                        .frame(width: 54, height: 54)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.stroke, lineWidth: 1))
                }
                .buttonStyle(PressableStyle())
            }
            if model.step < 4 {
                PrimaryButton(title: "Devam et", icon: "arrow.right", enabled: canAdvance) {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) { model.step += 1 }
                }
            } else {
                PrimaryButton(title: "Randevuyu Onayla", icon: "checkmark", isLoading: model.isBooking) {
                    confirmBooking()
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 28)
        .background(Theme.surface.ignoresSafeArea(edges: .bottom).shadow(color: .black.opacity(0.06), radius: 12, y: -4))
    }

    private func confirmBooking() {
        errorText = nil
        Task {
            do {
                try await model.confirm()
                let gen = UINotificationFeedbackGenerator(); gen.notificationOccurred(.success)
            } catch let error as APIError {
                errorText = error.message
                // If the slot was taken, send the user back to slot selection.
                if error.message.contains("doldu") {
                    await model.loadSlots()
                    withAnimation { model.step = 2 }
                    toast.show(error.message, style: .error)
                }
            } catch {
                errorText = "Randevu oluşturulamadı. Lütfen tekrar deneyin."
            }
        }
    }
}

struct SuccessView: View {
    let result: BookingResponse
    let provider: Provider
    let onDone: () -> Void
    @State private var appear = false

    private var confirmed: Bool { result.status == "CONFIRMED" }

    var body: some View {
        VStack(spacing: 22) {
            Spacer()
            ZStack {
                Circle().fill((confirmed ? Theme.success : Theme.pendingAmber).opacity(0.12)).frame(width: 130, height: 130)
                Image(systemName: confirmed ? "checkmark.circle.fill" : "clock.badge.checkmark.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(confirmed ? Theme.success : Theme.pendingAmber)
                    .scaleEffect(appear ? 1 : 0.5)
            }
            VStack(spacing: 8) {
                Text(confirmed ? "Randevunuz onaylandı!" : "Talebiniz alındı!")
                    .font(.system(size: 24, weight: .heavy)).foregroundStyle(Theme.ink)
                Text(confirmed
                     ? "Randevunuz başarıyla oluşturuldu."
                     : "Klinik onayladığında bildirim alacaksınız.")
                    .font(.system(size: 15)).foregroundStyle(Theme.inkSecondary)
                    .multilineTextAlignment(.center)
            }
            VStack(spacing: 0) {
                row("person.fill", provider.doctorName)
                Divider().background(Theme.stroke).padding(.leading, 40)
                row("calendar", Format.shortDate(result.date))
                Divider().background(Theme.stroke).padding(.leading, 40)
                row("clock.fill", "\(result.startTime) - \(result.endTime)")
            }
            .asistanCard()
            .padding(.horizontal, 24)
            Spacer()
            PrimaryButton(title: "Randevularıma git", icon: "calendar") { onDone() }
                .padding(.horizontal, 24)
                .padding(.bottom, 28)
        }
        .onAppear { withAnimation(.spring(response: 0.6, dampingFraction: 0.6)) { appear = true } }
    }

    private func row(_ icon: String, _ value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(Theme.teal).frame(width: 24)
            Text(value).font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.ink)
            Spacer()
        }
        .padding(.vertical, 12)
    }
}
