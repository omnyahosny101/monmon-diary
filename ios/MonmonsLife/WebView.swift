import SwiftUI
import WebKit
import WidgetKit

/// Shows the Monmon's Life page bundled inside the app, so it works offline.
struct WebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.userContentController.add(context.coordinator, name: "app")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false

        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    /// Receives the start date and reminder setting from the page.
    final class Coordinator: NSObject, WKScriptMessageHandler {
        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any] else { return }
            let defaults = UserDefaults.standard
            var changed = false
            if let start = body["start"] as? String, defaults.string(forKey: "start") != start {
                defaults.set(start, forKey: "start")
                changed = true
            }
            if let on = body["reminders"] as? Bool, defaults.object(forKey: "reminders") as? Bool != on {
                defaults.set(on, forKey: "reminders")
                changed = true
            }
            if changed {
                Reminders.reschedule()
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }
}
