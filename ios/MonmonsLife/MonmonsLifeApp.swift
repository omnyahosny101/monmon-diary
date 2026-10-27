import SwiftUI

@main
struct MonmonsLifeApp: App {
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            WebView()
                .ignoresSafeArea()
                .background(Color(red: 1.0, green: 0.95, blue: 0.965))
                .preferredColorScheme(.light)
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                Reminders.reschedule()
            }
        }
    }
}
