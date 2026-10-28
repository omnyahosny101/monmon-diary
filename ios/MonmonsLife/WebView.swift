import SwiftUI
import WebKit
import WidgetKit

/// Shows Monmon's Life. It opens the live website so every update arrives by itself,
/// and falls back to the copy bundled inside the app when there's no internet.
/// Everything you enter is also saved to a file in the app, so it survives app updates
/// and the page gets that copy back every time it opens. Photos are kept as files too.
struct WebView: UIViewRepresentable {
    static let liveURL = URL(string: "https://omnyahosny101.github.io/monmon-diary/")!

    func makeCoordinator() -> Coordinator { Coordinator() }

    static var documents: URL { FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0] }
    static var stateFile: URL { documents.appendingPathComponent("monmon-state.json") }
    static var photoDir: URL {
        let dir = documents.appendingPathComponent("photos", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
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
        webView.navigationDelegate = context.coordinator
        context.coordinator.webView = webView

        var request = URLRequest(url: Self.liveURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 8)
        request.setValue("MonmonsLifeApp", forHTTPHeaderField: "X-Requested-With")
        webView.load(request)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    static func loadBundled(_ webView: WKWebView) {
        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
    }

    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
        weak var webView: WKWebView?
        private var usedFallback = false

        // No internet or the site is down: open the copy inside the app.
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { fallback(webView) }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { fallback(webView) }
        private func fallback(_ webView: WKWebView) {
            guard !usedFallback else { return }
            usedFallback = true
            WebView.loadBundled(webView)
        }

        // Links to other sites open in Safari.
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = action.request.url, action.navigationType == .linkActivated,
               url.host != WebView.liveURL.host, url.scheme?.hasPrefix("http") == true {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any] else { return }
            let type = body["type"] as? String ?? "sync"

            switch type {
            case "photo":
                if let id = body["id"] as? String, let data = body["data"] as? String, safe(id) {
                    try? data.write(to: WebView.photoDir.appendingPathComponent(id + ".txt"), atomically: true, encoding: .utf8)
                }
            case "delPhoto":
                if let id = body["id"] as? String, safe(id) {
                    try? FileManager.default.removeItem(at: WebView.photoDir.appendingPathComponent(id + ".txt"))
                }
            case "getPhoto":
                guard let id = body["id"] as? String, safe(id) else { return }
                let data = (try? String(contentsOf: WebView.photoDir.appendingPathComponent(id + ".txt"), encoding: .utf8)) ?? ""
                if let json = try? JSONSerialization.data(withJSONObject: [id, data]),
                   let args = String(data: json, encoding: .utf8) {
                    webView?.evaluateJavaScript("window.__photoIn && window.__photoIn.apply(null, \(args));")
                }
            default:
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

        /// Photo ids are made by the page (letters and numbers only); refuse anything else.
        private func safe(_ id: String) -> Bool {
            !id.isEmpty && id.count < 64 && id.allSatisfy { $0.isLetter || $0.isNumber }
        }
    }
}
