import SwiftUI
import WebKit
import WidgetKit

/// Shows the Monmon's Life page bundled inside the app, so it works offline.
/// Everything you enter is also saved to a file in the app, so it survives even if
/// iOS clears web data; the page gets that copy back every time it opens.
struct WebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    static var stateFile: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return docs.appendingPathComponent("monmon-state.json")
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.userContentController.add(context.coordinator, name: "app")

        // Hand the saved copy to the page before its script runs.
        if let data = try? Data(contentsOf: Self.stateFile),
           let json = String(data: data, encoding: .utf8),
           (try? JSONSerialization.jsonObject(with: data)) != nil {
            let script = WKUserScript(source: "window.__NATIVE_STATE__ = \(json);",
                                      injectionTime: .atDocumentStart, forMainFrameOnly: true)
            config.userContentController.addUserScript(script)
        }

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

    final class Coordinator: NSObject, WKScriptMessageHandler {
        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any] else { return }

            if let state = body["state"] as? String, let data = state.data(using: .utf8) {
                try? data.write(to: WebView.stateFile, options: .atomic)
            }
            if let reminders = body["reminders"] as? [String: Any] {
                Reminders.update(with: reminders)
            }
            if let start = body["start"] as? String, UserDefaults.standard.string(forKey: "start") != start {
                UserDefaults.standard.set(start, forKey: "start")
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }
}
