import Foundation

/// What the home-screen widgets show. The web app builds it on every save (src/widgets.js),
/// the app writes it into the shared app-group folder, and the widgets read it from there.
struct WData: Codable {
    struct Quote: Codable { let src: String; let idea: String; let tip: String }
    struct Item: Codable { let t: String; let x: String }
    struct Day: Codable { let d: String; let q: Quote; let lesson: Item; let facts: [Item] }
    struct Task: Codable { let t: String; let due: String; let p: Int }
    struct Lesson: Codable { let t: String; let g: String; let w: Int; let done: Bool }
    struct Course: Codable {
        let start: String
        let total: Int
        let done: Int
        let streak: Int
        let mins: Int
        let i: Int
        let behind: Int
        let todayDone: Bool
        let final: Bool
        let days: [Lesson]
    }
    struct Next: Codable { let t: String; let e: String; let d: String }

    let at: String
    let wedding: String
    let wnext: Next?
    let wdone: Int
    let wtotal: Int
    let tasks: [Task]
    let open: Int
    let urgent: Int
    let course: Course
    let days: [Day]
    let water: Int
    let habits: Int
    let htotal: Int

    /// The precomputed day for a date, or the last one we have.
    func day(_ date: Date) -> Day? {
        let key = WidgetStore.key(date)
        return days.first(where: { $0.d == key }) ?? days.last
    }

    /// Today's lesson in the 30-day course: the day's lesson, or the first unfinished one if she's behind.
    func lessonIndex(on date: Date) -> Int? {
        guard let start = Plan.parse(course.start), !course.days.isEmpty else { return nil }
        let cal = Calendar.current
        let raw = cal.dateComponents([.day], from: cal.startOfDay(for: start), to: cal.startOfDay(for: date)).day ?? 0
        let today = min(max(raw, 0), course.days.count - 1)
        guard let firstOpen = course.days.firstIndex(where: { !$0.done }) else { return nil }
        return min(firstOpen, today)
    }
}

enum WidgetStore {
    static let group = "group.com.monmon2026.monmonslife"
    static let weddingFallback = "2026-12-31"

    static var fileURL: URL? {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group)?
            .appendingPathComponent("widget.json")
    }

    /// Saves the page's widget JSON. Returns true when it changed, so the app only reloads widgets then.
    @discardableResult
    static func save(_ text: String) -> Bool {
        guard let url = fileURL, let data = text.data(using: .utf8), !data.isEmpty else { return false }
        if let old = try? Data(contentsOf: url), old == data { return false }
        guard (try? JSONDecoder().decode(WData.self, from: data)) != nil else { return false }
        try? data.write(to: url, options: .atomic)
        return true
    }

    static func load() -> WData? {
        guard let url = fileURL, let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(WData.self, from: data)
    }

    static func key(_ date: Date) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    /// Whole days from the start of `date` to `target` ("yyyy-MM-dd").
    static func daysUntil(_ target: String, from date: Date) -> Int {
        guard let t = Plan.parse(target) else { return 0 }
        let cal = Calendar.current
        return cal.dateComponents([.day], from: cal.startOfDay(for: date), to: cal.startOfDay(for: t)).day ?? 0
    }

    static let arMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]

    /// "16 نوفمبر"
    static func niceDay(_ text: String) -> String {
        guard let d = Plan.parse(text) else { return text }
        let cal = Calendar.current
        return "\(cal.component(.day, from: d)) \(arMonths[cal.component(.month, from: d) - 1])"
    }
}
