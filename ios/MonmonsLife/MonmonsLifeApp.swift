import SwiftUI

extension Notification.Name {
    /// A home-screen widget opened the app at a page (monmon://academy, monmon://tasks, …).
    static let monmonOpen = Notification.Name("monmonOpen")
}

@main
struct MonmonsLifeApp: App {
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            WebView()
                .ignoresSafeArea()
                .background(Color(red: 1.0, green: 0.95, blue: 0.965))
                .preferredColorScheme(.light)
                .onOpenURL { url in
                    guard url.scheme == "monmon", let page = url.host else { return }
                    NotificationCenter.default.post(name: .monmonOpen, object: page)
                }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                Reminders.reschedule()
            }
        }
    }
}
