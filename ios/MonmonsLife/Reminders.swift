import Foundation
import UserNotifications

/// Local reminders: each meal of the next 7 days, plus 4 daily water breaks.
/// iOS keeps at most 64 pending reminders, so meals are rescheduled each time the app opens.
enum Reminders {
    static let mealTimes: [(label: String, hour: Int, minute: Int)] = [
        ("Breakfast", 9, 0),
        ("Lunch", 14, 0),
        ("Snack", 17, 30),
        ("Dinner", 20, 30),
    ]
    static let waterHours = [11, 13, 16, 19]

    static func reschedule() {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            guard granted else { return }
            center.removeAllPendingNotificationRequests()

            let defaults = UserDefaults.standard
            if defaults.object(forKey: "reminders") as? Bool == false { return }

            let start = Plan.parse(defaults.string(forKey: "start")) ?? Plan.defaultStart
            let cal = Calendar.current
            let now = Date()

            for offset in 0..<7 {
                guard let date = cal.date(byAdding: .day, value: offset, to: cal.startOfDay(for: now)) else { continue }
                let number = Plan.dayNumber(for: date, start: start)
                guard let planDay = Plan.day(number) else { continue }

                for (index, slot) in mealTimes.enumerated() where index < planDay.meals.count {
                    var comps = cal.dateComponents([.year, .month, .day], from: date)
                    comps.hour = slot.hour
                    comps.minute = slot.minute
                    guard let fire = cal.date(from: comps), fire > now else { continue }

                    let meal = planDay.meals[index]
                    let content = UNMutableNotificationContent()
                    content.title = "\(slot.label) time, Monmon \u{2661}"
                    content.body = "\(meal.name) \u{00B7} \(meal.kcal) kcal"
                    content.sound = .default
                    let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
                    center.add(UNNotificationRequest(identifier: "meal-\(number)-\(index)", content: content, trigger: trigger))
                }
            }

            for hour in waterHours {
                let content = UNMutableNotificationContent()
                content.title = "Water break"
                content.body = "Have a glass of water and tap it in Monmon's Life."
                content.sound = .default
                var comps = DateComponents()
                comps.hour = hour
                comps.minute = 0
                let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
                center.add(UNNotificationRequest(identifier: "water-\(hour)", content: content, trigger: trigger))
            }
        }
    }
}
