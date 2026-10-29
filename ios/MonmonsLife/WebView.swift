import SwiftUI
import WebKit
import WidgetKit
import AVFoundation
import Speech
import MediaPlayer

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
        // sound may start from code (the narrator moving to the next paragraph), not only from a tap
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
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

        // No pinch or double-tap zoom: the app keeps its own size.
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            webView.scrollView.minimumZoomScale = 1
            webView.scrollView.maximumZoomScale = 1
            webView.scrollView.pinchGestureRecognizer?.isEnabled = false
        }

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
            case "caps":
                VoiceBox.shared.webView = webView
                VoiceBox.shared.send("__capsIn", VoiceBox.shared.caps())
            case "speak":
                VoiceBox.shared.webView = webView
                VoiceBox.shared.speak(body["text"] as? String ?? "",
                                      lang: body["lang"] as? String ?? "fr-FR",
                                      rate: (body["rate"] as? NSNumber)?.doubleValue ?? 0.45,
                                      voiceId: body["voice"] as? String ?? "",
                                      id: body["id"] as? String ?? "")
            case "speakQueue":
                VoiceBox.shared.webView = webView
                let items = (body["items"] as? [[String: Any]] ?? []).compactMap { item -> (String, String)? in
                    guard let id = item["id"] as? String, let text = item["text"] as? String else { return nil }
                    return (id, text)
                }
                VoiceBox.shared.queue(items,
                                      replace: body["replace"] as? Bool ?? true,
                                      lang: body["lang"] as? String ?? "ar-EG",
                                      rate: (body["rate"] as? NSNumber)?.doubleValue ?? 0.5,
                                      voiceId: body["voice"] as? String ?? "")
            case "audioQueue":
                VoiceBox.shared.webView = webView
                let items = (body["items"] as? [[String: Any]] ?? []).compactMap { item -> (String, String)? in
                    guard let id = item["id"] as? String, let url = item["url"] as? String else { return nil }
                    return (id, url)
                }
                VoiceBox.shared.playAudio(items,
                                          rate: (body["rate"] as? NSNumber)?.doubleValue ?? 1,
                                          replace: body["replace"] as? Bool ?? true)
            case "podPlay":
                VoiceBox.shared.webView = webView
                PodPlayer.shared.play(url: body["url"] as? String ?? "",
                                      start: (body["start"] as? NSNumber)?.doubleValue ?? 0,
                                      rate: (body["rate"] as? NSNumber)?.doubleValue ?? 1,
                                      title: body["title"] as? String ?? "",
                                      artist: body["artist"] as? String ?? "")
            case "podPause":
                PodPlayer.shared.pause()
            case "podResume":
                PodPlayer.shared.resume()
            case "podSeek":
                PodPlayer.shared.seek(by: (body["by"] as? NSNumber)?.doubleValue ?? 0)
            case "podRate":
                PodPlayer.shared.setRate((body["rate"] as? NSNumber)?.doubleValue ?? 1)
            case "podStop":
                PodPlayer.shared.stop()
            case "pauseSpeak":
                VoiceBox.shared.pause()
            case "resumeSpeak":
                VoiceBox.shared.resume()
            case "stopSpeak":
                VoiceBox.shared.stopSpeaking()
            case "listen":
                VoiceBox.shared.webView = webView
                VoiceBox.shared.listen(lang: body["lang"] as? String ?? "fr-FR")
            case "stopListen":
                VoiceBox.shared.stopListening()
            case "playMine":
                VoiceBox.shared.playMine()
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

/// The iPhone's own voices, including the clearer Enhanced and Premium ones downloaded in
/// Settings › Accessibility › Spoken Content › Voices (web pages can't use those), plus
/// listening to Monmon's French with speech recognition and recording it so she can hear herself.
final class VoiceBox: NSObject, AVSpeechSynthesizerDelegate {
    static let shared = VoiceBox()
    weak var webView: WKWebView?

    private let synth = AVSpeechSynthesizer()
    private var spoken: [ObjectIdentifier: String] = [:]
    private let engine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var file: AVAudioFile?
    private var player: AVAudioPlayer?
    private var token = 0
    private var sentFinal = false
    private var tapped = false
    private static var mine: URL { FileManager.default.temporaryDirectory.appendingPathComponent("my-voice.caf") }

    override init() {
        super.init()
        synth.delegate = self
    }

    // MARK: voices
    private static func usable(_ v: AVSpeechSynthesisVoice) -> Bool { !v.voiceTraits.contains(.isNoveltyVoice) }

    static func voices(_ prefix: String) -> [[String: Any]] {
        AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language.hasPrefix(prefix) && usable($0) }
            .sorted { $0.quality.rawValue > $1.quality.rawValue }
            .map { ["id": $0.identifier, "name": $0.name, "lang": $0.language, "q": $0.quality.rawValue] }
    }

    private func best(_ lang: String) -> AVSpeechSynthesisVoice? {
        let all = AVSpeechSynthesisVoice.speechVoices().filter { Self.usable($0) }
        let exact = all.filter { $0.language == lang }
        let near = all.filter { $0.language.hasPrefix(String(lang.prefix(2))) }
        let pool = exact.isEmpty ? near : exact
        return pool.max { $0.quality.rawValue < $1.quality.rawValue } ?? AVSpeechSynthesisVoice(language: lang)
    }

    func caps() -> [String: Any] {
        ["speak": true,
         "queue": true,
         "audio": true,
         "pod": true,
         "listen": SFSpeechRecognizer(locale: Locale(identifier: "fr-FR")) != nil,
         "voices": Self.voices("fr"),
         "ar": Self.voices("ar")]
    }

    // MARK: speaking
    func speak(_ text: String, lang: String, rate: Double, voiceId: String, id: String) {
        if engine.isRunning { stopListening() }
        let session = AVAudioSession.sharedInstance()
        // .playback so the voice is loud and clear even when the phone is on silent
        try? session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        try? session.setActive(true)
        if synth.isSpeaking { synth.stopSpeaking(at: .immediate) }
        let u = AVSpeechUtterance(string: text)
        u.voice = (voiceId.isEmpty ? nil : AVSpeechSynthesisVoice(identifier: voiceId)) ?? best(lang)
        u.rate = Float(min(Double(AVSpeechUtteranceMaximumSpeechRate), max(Double(AVSpeechUtteranceMinimumSpeechRate), rate)))
        u.postUtteranceDelay = 0.05
        if !id.isEmpty { spoken[ObjectIdentifier(u)] = id }
        synth.speak(u)
    }

    /// The narrator: many sentences queued at once so reading carries on with the screen locked.
    func queue(_ items: [(String, String)], replace: Bool, lang: String, rate: Double, voiceId: String) {
        if engine.isRunning { stopListening() }
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio, options: [])
        try? session.setActive(true)
        if replace && synth.isSpeaking { synth.stopSpeaking(at: .immediate) }
        let voice = (voiceId.isEmpty ? nil : AVSpeechSynthesisVoice(identifier: voiceId)) ?? best(lang)
        let r = Float(min(Double(AVSpeechUtteranceMaximumSpeechRate), max(Double(AVSpeechUtteranceMinimumSpeechRate), rate)))
        for (id, text) in items {
            let u = AVSpeechUtterance(string: text)
            u.voice = voice
            u.rate = r
            u.postUtteranceDelay = 0.12
            spoken[ObjectIdentifier(u)] = id
            synth.speak(u)
        }
    }

    func pause() {
        if synth.isSpeaking { synth.pauseSpeaking(at: .word) }
        audio?.pause()
    }
    func resume() {
        if synth.isPaused { synth.continueSpeaking() }
        if let p = audio, p.currentItem != nil, p.rate == 0 { p.playImmediately(atRate: audioRate) }
    }

    // MARK: recorded audio (the book in the Egyptian voice), one file per paragraph
    private var audio: AVQueuePlayer?
    private var audioIds: [ObjectIdentifier: String] = [:]
    private var audioRate: Float = 1
    private var endObserver: NSObjectProtocol?

    func playAudio(_ items: [(String, String)], rate: Double, replace: Bool) {
        if synth.isSpeaking { synth.stopSpeaking(at: .immediate) }
        if engine.isRunning { stopListening() }
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio, options: [])
        try? session.setActive(true)
        if audio == nil {
            audio = AVQueuePlayer()
            endObserver = NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: nil, queue: .main) { [weak self] note in
                guard let self = self, let item = note.object as? AVPlayerItem,
                      let id = self.audioIds.removeValue(forKey: ObjectIdentifier(item)) else { return }
                self.send("__spoke", id)
                self.announceAudio()
            }
        }
        guard let player = audio else { return }
        if replace { stopAudio() }
        for (id, link) in items {
            guard let url = URL(string: link) else { continue }
            let item = AVPlayerItem(url: url)
            item.audioTimePitchAlgorithm = .timeDomain
            audioIds[ObjectIdentifier(item)] = id
            player.insert(item, after: nil)
        }
        audioRate = Float(max(0.5, min(2, rate)))
        player.playImmediately(atRate: audioRate)
        announceAudio()
    }

    private func announceAudio() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            if let item = self.audio?.currentItem, let id = self.audioIds[ObjectIdentifier(item)] { self.send("__spokeStart", id) }
        }
    }

    private func stopAudio() {
        audio?.pause()
        audio?.removeAllItems()
        audioIds.removeAll()
    }

    func stopSpeaking() {
        if synth.isSpeaking { synth.stopSpeaking(at: .immediate) }
        stopAudio()
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        let key = ObjectIdentifier(utterance)
        DispatchQueue.main.async {
            if let id = self.spoken[key] { self.send("__spokeStart", id) }
        }
    }
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) { finished(utterance) }
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) { finished(utterance) }

    private func finished(_ u: AVSpeechUtterance) {
        DispatchQueue.main.async {
            guard let id = self.spoken.removeValue(forKey: ObjectIdentifier(u)) else { return }
            self.send("__spoke", id)
        }
    }

    // MARK: listening
    func listen(lang: String) {
        SFSpeechRecognizer.requestAuthorization { status in
            DispatchQueue.main.async {
                guard status == .authorized else { return self.heard(["err": "speech"]) }
                AVAudioApplication.requestRecordPermission { granted in
                    DispatchQueue.main.async {
                        if granted { self.begin(lang) } else { self.heard(["err": "mic"]) }
                    }
                }
            }
        }
    }

    private func begin(_ lang: String) {
        stopSpeaking()
        stopListening()
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: lang)), recognizer.isAvailable else {
            return heard(["err": "unavailable"])
        }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .duckOthers])
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            let req = SFSpeechAudioBufferRecognitionRequest()
            req.shouldReportPartialResults = true
            request = req

            let input = engine.inputNode
            let format = input.outputFormat(forBus: 0)
            try? FileManager.default.removeItem(at: Self.mine)
            file = try? AVAudioFile(forWriting: Self.mine, settings: format.settings)
            input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
                req.append(buffer)
                try? self?.file?.write(from: buffer)
            }
            tapped = true
            engine.prepare()
            try engine.start()

            token += 1
            sentFinal = false
            let mine = token
            task = recognizer.recognitionTask(with: req) { [weak self] result, error in
                DispatchQueue.main.async {
                    guard let self = self, mine == self.token, !self.sentFinal else { return }
                    let isFinal = result?.isFinal == true || error != nil
                    let text = result?.bestTranscription.formattedString ?? ""
                    if isFinal {
                        self.sentFinal = true
                        self.stopListening()
                    }
                    self.heard(["text": text, "final": isFinal])
                }
            }
            heard(["started": true])
            // stop by itself after 7 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 7) { [weak self] in
                guard let self = self, mine == self.token, self.engine.isRunning else { return }
                self.stopListening()
            }
        } catch {
            stopListening()
            heard(["err": "audio"])
        }
    }

    func stopListening() {
        if engine.isRunning { engine.stop() }
        if tapped {
            engine.inputNode.removeTap(onBus: 0)
            tapped = false
        }
        request?.endAudio()
        request = nil
        file = nil
    }

    func playMine() {
        stopListening()
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .default)
        try? session.setActive(true)
        player = try? AVAudioPlayer(contentsOf: Self.mine)
        player?.volume = 1
        player?.play()
    }

    // MARK: talking back to the page
    private func heard(_ info: [String: Any]) { send("__heard", info) }

    func send(_ fn: String, _ value: Any) {
        guard let data = try? JSONSerialization.data(withJSONObject: [value]),
              let json = String(data: data, encoding: .utf8) else { return }
        let code = "window.\(fn) && window.\(fn).apply(null, \(json));"
        DispatchQueue.main.async { self.webView?.evaluateJavaScript(code) }
    }
}

/// Podcast episodes: one native player that keeps playing with the screen locked,
/// shows on the lock screen and answers the headphone and lock-screen buttons.
final class PodPlayer: NSObject {
    static let shared = PodPlayer()
    private var player: AVPlayer?
    private var timeObserver: Any?
    private var endObserver: NSObjectProtocol?
    private var rate: Float = 1
    private var info: [String: Any] = [:]
    private var commandsReady = false

    func play(url: String, start: Double, rate: Double, title: String, artist: String) {
        guard let link = URL(string: url) else { return }
        VoiceBox.shared.stopSpeaking()
        stop()
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio, options: [])
        try? session.setActive(true)
        let item = AVPlayerItem(url: link)
        item.audioTimePitchAlgorithm = .timeDomain
        let p = AVPlayer(playerItem: item)
        player = p
        self.rate = Float(max(0.5, min(3, rate)))
        if start > 1 { p.seek(to: CMTime(seconds: start, preferredTimescale: 600)) }
        p.playImmediately(atRate: self.rate)
        timeObserver = p.addPeriodicTimeObserver(forInterval: CMTime(seconds: 1, preferredTimescale: 600), queue: .main) { [weak self] _ in
            self?.report()
        }
        endObserver = NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main) { [weak self] _ in
            self?.updateNowPlaying()
            VoiceBox.shared.send("__podIn", ["ended": true])
        }
        info = [MPMediaItemPropertyTitle: title, MPMediaItemPropertyArtist: artist]
        setupCommands()
        updateNowPlaying()
    }

    private func report() {
        guard let p = player else { return }
        updateNowPlaying()
        let duration = p.currentItem?.duration.seconds ?? 0
        VoiceBox.shared.send("__podIn", ["pos": p.currentTime().seconds,
                                         "dur": duration.isFinite ? duration : 0,
                                         "playing": p.rate > 0])
    }

    func pause() { player?.pause(); report() }
    func resume() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio, options: [])
        try? session.setActive(true)
        player?.playImmediately(atRate: rate)
        report()
    }
    func seek(by seconds: Double) {
        guard let p = player else { return }
        let target = max(0, p.currentTime().seconds + seconds)
        p.seek(to: CMTime(seconds: target, preferredTimescale: 600)) { [weak self] _ in self?.report() }
    }
    func setRate(_ r: Double) {
        rate = Float(max(0.5, min(3, r)))
        if let p = player, p.rate > 0 { p.rate = rate }
        updateNowPlaying()
    }
    func stop() {
        if let t = timeObserver { player?.removeTimeObserver(t) }
        timeObserver = nil
        if let e = endObserver { NotificationCenter.default.removeObserver(e) }
        endObserver = nil
        player?.pause()
        player = nil
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }

    private func updateNowPlaying() {
        guard let p = player else { return }
        var now = info
        now[MPNowPlayingInfoPropertyElapsedPlaybackTime] = p.currentTime().seconds
        let duration = p.currentItem?.duration.seconds ?? 0
        if duration.isFinite && duration > 0 { now[MPMediaItemPropertyPlaybackDuration] = duration }
        now[MPNowPlayingInfoPropertyPlaybackRate] = Double(p.rate)
        MPNowPlayingInfoCenter.default().nowPlayingInfo = now
    }

    private func setupCommands() {
        guard !commandsReady else { return }
        commandsReady = true
        let c = MPRemoteCommandCenter.shared()
        c.playCommand.addTarget { [weak self] _ in self?.resume(); return .success }
        c.pauseCommand.addTarget { [weak self] _ in self?.pause(); return .success }
        c.togglePlayPauseCommand.addTarget { [weak self] _ in
            guard let self = self, let p = self.player else { return .commandFailed }
            if p.rate > 0 { self.pause() } else { self.resume() }
            return .success
        }
        c.skipForwardCommand.preferredIntervals = [30]
        c.skipForwardCommand.addTarget { [weak self] _ in self?.seek(by: 30); return .success }
        c.skipBackwardCommand.preferredIntervals = [15]
        c.skipBackwardCommand.addTarget { [weak self] _ in self?.seek(by: -15); return .success }
    }
}
