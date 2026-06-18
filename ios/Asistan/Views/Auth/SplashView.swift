import SwiftUI

struct SplashView: View {
    @State private var appear = false
    @State private var pulse = false

    var body: some View {
        ZStack {
            Theme.heroGradient.ignoresSafeArea()

            // Soft floating orbs for depth.
            Circle().fill(.white.opacity(0.08)).frame(width: 280).blur(radius: 8)
                .offset(x: -130, y: pulse ? -240 : -210)
            Circle().fill(.white.opacity(0.06)).frame(width: 220).blur(radius: 6)
                .offset(x: 150, y: pulse ? 260 : 290)

            VStack(spacing: 22) {
                ZStack {
                    Circle()
                        .fill(.white)
                        .frame(width: 116, height: 116)
                        .shadow(color: .black.opacity(0.15), radius: 20, y: 10)
                    Image(systemName: "stethoscope")
                        .font(.system(size: 52, weight: .semibold))
                        .foregroundStyle(Theme.heroGradient)
                }
                .scaleEffect(appear ? 1 : 0.7)
                .opacity(appear ? 1 : 0)

                VStack(spacing: 6) {
                    Text("Asistan")
                        .font(.system(size: 38, weight: .heavy, design: .rounded))
                        .foregroundStyle(.white)
                    Text("Hızlı ve güvenli randevu")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(.white.opacity(0.9))
                }
                .opacity(appear ? 1 : 0)
                .offset(y: appear ? 0 : 16)
            }

            VStack {
                Spacer()
                ProgressView()
                    .tint(.white)
                    .padding(.bottom, 50)
                    .opacity(appear ? 1 : 0)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.7)) { appear = true }
            withAnimation(.easeInOut(duration: 3).repeatForever(autoreverses: true)) { pulse = true }
        }
    }
}
