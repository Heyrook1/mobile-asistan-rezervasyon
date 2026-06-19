import SwiftUI

struct RootView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(ToastCenter.self) private var toast

    var body: some View {
        ZStack {
            switch auth.phase {
            case .loading:
                SplashView()
                    .transition(.opacity)
            case .unauthenticated:
                AuthFlowView()
                    .transition(.opacity)
            case .onboardingLocation:
                LocationOnboardingView()
                    .transition(.move(edge: .trailing).combined(with: .opacity))
            case .ready:
                MainTabView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.35), value: auth.phase)
        .overlay(alignment: .top) {
            if let current = toast.current {
                ToastOverlay(toast: current)
                    .padding(.top, 8)
            }
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: toast.current)
        .task {
            await auth.bootstrap()
        }
    }
}

#Preview {
    RootView()
        .environment(AuthManager())
        .environment(ToastCenter())
}
