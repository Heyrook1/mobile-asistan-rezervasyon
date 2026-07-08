import SwiftUI

@MainActor
@Observable
final class AIAssistantModel {
    struct Message: Identifiable, Equatable {
        let id = UUID()
        let role: Role
        var text: String
        let suggestions: [String]?
        var isStreaming = false

        enum Role { case user, assistant }
    }

    var messages: [Message] = []
    var input = ""
    var isThinking = false
    var hasGreeted = false

    func greet() {
        guard !hasGreeted else { return }
        hasGreeted = true
        let greeting = """
        Merhaba! Ben Asistan AI. Size şunlarda yardımcı olabilirim:
        • Yakınınızdaki doktor ve klinik önerisi
        • Şikayetinize uygun branş önerisi
        • Uygun randevu saati önerisi
        • Yorumların özetlenmesi
        """
        messages.append(.init(role: .assistant, text: greeting, suggestions: [
            "Lefkoşa'da diş doktoru öner",
            "Başım ağrıyor, hangi branşa gitmeliyim?",
            "En erken müsait dermatolog kim?",
        ]))
    }

    func send(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        messages.append(.init(role: .user, text: trimmed, suggestions: nil))
        input = ""
        isThinking = true

        // Simulate async AI response with a structured suggestion.
        Task {
            try? await Task.sleep(for: .seconds(1.2))
            let response = generateResponse(for: trimmed)
            await MainActor.run {
                isThinking = false
                messages.append(.init(role: .assistant, text: response.text, suggestions: response.suggestions))
            }
        }
    }

    private func generateResponse(for text: String) -> (text: String, suggestions: [String]?) {
        let lower = text.lowercased()
        if lower.contains("diş") || lower.contains("dişçi") || lower.contains("ağız") {
            return ("Size en yakın ve en yüksek puanlı diş hekimlerini listeleyebilirim. Randevu almak ister misiniz?", ["En yakın dişçiler", "Bugün müsait dişçi", "Dişçi fiyatları"])
        }
        if lower.contains("baş") || lower.contains("ağrı") {
            return ("Baş ağrısı için önce nöroloji veya aile hekimliği değerlendirilebilir. Acil şikayetleriniz varsa lütfen 112'yi arayın.", ["Nörolog ara", "Aile hekimi ara", "Acil durum"])
        }
        if lower.contains("cilt") || lower.contains("sivilce") || lower.contains("doktor") && lower.contains("cilt") {
            return ("Dermatoloji uzmanı size yardımcı olabilir. Yakınınızdaki dermatologları gösterebilirim.", ["Dermatolog ara", "Cilt bakımı", "Yakınımdaki"])
        }
        if lower.contains("randevu") || lower.contains("saat") {
            return ("Randevu almak için bir klinik veya doktor seçmeniz gerekiyor. Size bugün müsait olanları gösterebilirim.", ["Bugün müsait", "En yakın klinik", "Popüler hizmetler"])
        }
        return ("Anladım. Size en uygun sağlık seçeneğini bulmak için klinikleri veya doktorları arayabilirim. Dilerseniz randevu alma akışına başlayalım.", ["Klinik ara", "Doktor ara", "Randevu al"])
    }
}

struct AIAssistantSheet: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dismiss) private var dismiss
    @State private var model = AIAssistantModel()

    private var colors: Theme.Colors { Theme.Colors.forScheme(colorScheme) }

    var body: some View {
        NavigationStack {
            ZStack {
                colors.canvas.ignoresSafeArea()

                VStack(spacing: 0) {
                    ScrollView(showsIndicators: false) {
                        LazyVStack(spacing: Theme.Space.lg) {
                            ForEach(model.messages) { message in
                                MessageBubble(message: message, colors: colors)
                            }
                            if model.isThinking {
                                ThinkingIndicator(colors: colors)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.horizontal, Theme.Space.lg)
                            }
                            Color.clear.frame(height: 20)
                        }
                        .padding(.top, Theme.Space.lg)
                    }

                    inputBar
                }
            }
            .navigationTitle("Asistan AI")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundStyle(colors.inkTertiary)
                    }
                }
            }
            .onAppear { model.greet() }
        }
    }

    private var inputBar: some View {
        HStack(spacing: Theme.Space.md) {
            TextField("Mesajınızı yazın...", text: $model.input, axis: .vertical)
                .font(Theme.Typography.body)
                .lineLimit(1...4)
                .padding(.horizontal, Theme.Space.md)
                .padding(.vertical, 10)
                .background(colors.surfaceElevated, in: RoundedRectangle(cornerRadius: Theme.inputRadius, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.inputRadius, style: .continuous)
                        .stroke(colors.stroke, lineWidth: 1)
                )

            Button {
                Haptics.medium()
                model.send(model.input)
            } label: {
                ZStack {
                    Circle()
                        .fill(Theme.brandGradient)
                        .frame(width: 46, height: 46)
                    Image(systemName: "arrow.up")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                }
            }
            .disabled(model.input.trimmingCharacters(in: .whitespaces).isEmpty)
            .buttonStyle(PremiumPressableStyle())
        }
        .padding(.horizontal, Theme.Space.lg)
        .padding(.vertical, Theme.Space.md)
        .background(colors.surfaceElevated)
        .overlay(Rectangle().fill(colors.stroke).frame(height: 1), alignment: .top)
    }
}

struct MessageBubble: View {
    let message: AIAssistantModel.Message
    let colors: Theme.Colors

    private var bubbleFill: some ShapeStyle {
        message.role == .assistant
            ? AnyShapeStyle(colors.surface)
            : AnyShapeStyle(Theme.brandGradient)
    }

    var body: some View {
        HStack {
            if message.role == .user { Spacer(minLength: 40) }

            VStack(alignment: message.role == .assistant ? .leading : .trailing, spacing: 8) {
                HStack(alignment: .top, spacing: 10) {
                    if message.role == .assistant {
                        ZStack {
                            Circle()
                                .fill(Theme.brandGradient)
                                .frame(width: 30, height: 30)
                            Image(systemName: "sparkles")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(.white)
                        }
                    }

                    Text(message.text)
                        .font(Theme.Typography.body)
                        .foregroundStyle(message.role == .assistant ? colors.ink : .white)
                        .padding(.horizontal, Theme.Space.md)
                        .padding(.vertical, 12)
                        .background(bubbleFill, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(message.role == .assistant ? colors.stroke : Color.clear, lineWidth: 1)
                        )
                }

                if let suggestions = message.suggestions {
                    FlowLayout(spacing: 8) {
                        ForEach(suggestions, id: \.self) { suggestion in
                            Button {
                                Haptics.light()
                                // In a real implementation, this would send the suggestion as a user message.
                            } label: {
                                Text(suggestion)
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(Theme.teal)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Theme.teal.opacity(0.10), in: Capsule())
                                    .overlay(Capsule().stroke(Theme.teal.opacity(0.25), lineWidth: 1))
                            }
                            .buttonStyle(PremiumPressableStyle())
                        }
                    }
                    .frame(maxWidth: 280, alignment: .leading)
                }
            }

            if message.role == .assistant { Spacer(minLength: 40) }
        }
        .padding(.horizontal, Theme.Space.lg)
    }
}

struct ThinkingIndicator: View {
    let colors: Theme.Colors
    @State private var dots = 0

    var body: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(Theme.brandGradient)
                    .frame(width: 30, height: 30)
                Image(systemName: "sparkles")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white)
            }
            HStack(spacing: 4) {
                Text("Düşünüyor")
                    .font(Theme.Typography.captionMedium)
                    .foregroundStyle(colors.inkSecondary)
                Text(String(repeating: ".", count: dots))
                    .font(Theme.Typography.captionMedium)
                    .foregroundStyle(colors.inkSecondary)
                    .frame(width: 20, alignment: .leading)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(colors.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(colors.stroke, lineWidth: 1))
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.5).repeatForever(autoreverses: false)) {
                dots = 3
            }
        }
    }
}

// MARK: - Simple flow layout for suggestion chips
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = flow(subviews: subviews, proposal: proposal)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = flow(subviews: subviews, proposal: proposal)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: result.positions[index].x + bounds.minX, y: result.positions[index].y + bounds.minY), proposal: .unspecified)
        }
    }

    private func flow(subviews: Subviews, proposal: ProposedViewSize) -> (size: CGSize, positions: [CGPoint]) {
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var maxHeight: CGFloat = 0
        var rowHeight: CGFloat = 0
        let width = proposal.width ?? .infinity

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > width && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
            maxHeight = max(maxHeight, y + rowHeight)
        }
        return (CGSize(width: width, height: maxHeight), positions)
    }
}
