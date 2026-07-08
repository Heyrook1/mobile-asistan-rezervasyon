import SwiftUI

@main
struct AsistanApp: App {
    @State private var auth = AuthManager()
    @State private var toast = ToastCenter()
    @AppStorage("preferredColorScheme") private var preferredScheme: AppTheme = .system

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(auth)
                .environment(toast)
                .tint(Theme.teal)
                .preferredColorScheme(preferredScheme.colorScheme)
        }
    }
}

enum AppTheme: String, CaseIterable {
    case system, light, dark

    var displayName: String {
        switch self {
        case .system: return "Sistem"
        case .light: return "Açık"
        case .dark: return "Koyu"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}
