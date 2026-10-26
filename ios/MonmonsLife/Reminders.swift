import Foundation
import UserNotifications

/// Schedules the reminders the page sends: repeating ones (water, diary at 12 am and 2 am,
/// evening check-in, start-of-month money reminders) and one-off ones (meals, mashawer and
/// self-care the day before, task due dates). iOS keeps at most 64 pending reminders,
/// so repeating ones go first, then the soonest one-off reminders.
enum Reminders {
    private static let storeKey = "reminderPayload"

    /// Saves the latest list from the page and schedules it.
    static func update(with payload: [String: Any]) {
        if let data = try? JSONSerialization.data(withJSONObject: payload) {
            UserDefaults.standard.set(data, forKey: storeKey)
        }
        reschedule()
    }

    /// Re-applies the saved list (used when the app comes to the foreground).
    static func reschedule() {
        guard let data = UserDefaults.standard.data(forKey: storeKey),
              let payload = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return }

        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            guard granted else { return }
            center.removeAllPendingNotificationRequests()

            var budget = 64
            let repeats = payload["repeat"] as? [[String: Any]] ?? []
            for item in repeats where budget > 0 {
                guard let id = item["id"] as? String,
                      let hour = item["hour"] as? Int,
                      let minute = item["minute"] as? Int else { continue }
                var comps = DateComponents()
                comps.hour = hour
                comps.minute = minute
                if let day = item["day"] as? Int { comps.day = day }
                let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
                center.add(UNNotificationRequest(identifier: id, content: content(item), trigger: trigger))
                budget -= 1
            }

            let formatter = DateFormatter()
            formatter.calendar = Calendar(identifier: .gregorian)
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.timeZone = .current
            formatter.dateFormat = "yyyy-MM-dd'T'HH:mm"
            let now = Date()
            let cal = Calendar.current

            let once = payload["once"] as? [[String: Any]] ?? []
            for item in once where budget > 0 {
                guard let id = item["id"] as? String,
                      let at = item["at"] as? String,
                      let date = formatter.date(from: at), date > now else { continue }
                let comps = cal.dateComponents([.year, .month, .day, .hour, .minute], from: date)
                let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
                center.add(UNNotificationRequest(identifier: id, content: content(item), trigger: trigger))
                budget -= 1
            }
        }
    }

    private static func content(_ item: [String: Any]) -> UNMutableNotificationContent {
        let c = UNMutableNotificationContent()
        c.title = item["title"] as? String ?? "Monmon's Life"
        c.body = item["body"] as? String ?? ""
        c.sound = .default
        return c
    }
}
