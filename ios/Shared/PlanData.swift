import Foundation

struct Meal: Codable, Hashable {
    let type: String
    let name: String
    let kcal: Int
    let protein: Int
}

struct PlanDay: Codable {
    let day: Int
    let kcal: Int
    let protein: Int
    let meals: [Meal]
}

enum Plan {
    /// The 30 days, read from plan.json bundled with the app and the widget.
    static let days: [PlanDay] = {
        guard let url = Bundle.main.url(forResource: "plan", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let decoded = try? JSONDecoder().decode([PlanDay].self, from: data) else {
            return []
        }
        return decoded
    }()

    /// 1 November 2026, used until a start date is chosen in the app.
    static let defaultStart: Date = {
        var c = DateComponents()
        c.year = 2026
        c.month = 11
        c.day = 1
        return Calendar.current.date(from: c) ?? Date()
    }()

    /// Plan day number for a date (1 = the start date). Can be below 1 or above 30.
    static func dayNumber(for date: Date, start: Date) -> Int {
        let cal = Calendar.current
        let diff = cal.dateComponents([.day], from: cal.startOfDay(for: start), to: cal.startOfDay(for: date)).day ?? 0
        return diff + 1
    }

    static func day(_ number: Int) -> PlanDay? {
        guard number >= 1, number <= days.count else { return nil }
        return days[number - 1]
    }

    /// Parses the "yyyy-MM-dd" start date the web app stores.
    static func parse(_ text: String?) -> Date? {
        guard let text else { return nil }
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f.date(from: text)
    }
}
