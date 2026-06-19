import SwiftUI

@main
struct AsistanApp: App {
    @State private var auth = AuthManager()
    @State private var toast = ToastCenter()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(auth)
                .environment(toast)
                .tint(Theme.teal)
        }
    }
}
