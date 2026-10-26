import WidgetKit
import SwiftUI
import AppIntents

/// Long-press the widget, tap Edit Widget, and pick the plan start date.
struct StartDateIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Plan start"
    static var description = IntentDescription("Choose the day your 30-day plan starts.")

    @Parameter(title: "Plan starts on")
    var start: Date?
}

struct DayEntry: TimelineEntry {
    let date: Date
    let dayNumber: Int
    let day: PlanDay?
    let started: Bool
    let next: Int
}

struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> DayEntry {
        DayEntry(date: Date(), dayNumber: 1, day: Plan.day(1), started: true, next: 0)
    }

    func snapshot(for configuration: StartDateIntent, in context: Context) async -> DayEntry {
        entry(at: Date(), config: configuration)
    }

    func timeline(for configuration: StartDateIntent, in context: Context) async -> Timeline<DayEntry> {
        let cal = Calendar.current
        let now = Date()
        var entries = [entry(at: now, config: configuration)]
        // Refresh at each meal change today and tomorrow.
        for dayOffset in 0...1 {
            guard let base = cal.date(byAdding: .day, value: dayOffset, to: cal.startOfDay(for: now)) else { continue }
            for (h, m) in [(0, 0), (11, 0), (15, 0), (18, 30)] {
                if let t = cal.date(bySettingHour: h, minute: m, second: 0, of: base), t > now {
                    entries.append(entry(at: t, config: configuration))
                }
            }
        }
        return Timeline(entries: entries, policy: .atEnd)
    }

    private func entry(at date: Date, config: StartDateIntent) -> DayEntry {
        let start = config.start ?? Plan.defaultStart
        let raw = Plan.dayNumber(for: date, start: start)
        let number = min(max(raw, 1), 30)
        let cal = Calendar.current
        let minutes = cal.component(.hour, from: date) * 60 + cal.component(.minute, from: date)
        let next: Int
        switch minutes {
        case ..<660: next = 0
        case ..<900: next = 1
        case ..<1110: next = 2
        default: next = 3
        }
        return DayEntry(date: date, dayNumber: number, day: Plan.day(number), started: raw >= 1, next: next)
    }
}

struct MonmonWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: DayEntry

    private let rose = Color(red: 1.0, green: 0.36, blue: 0.56)
    private let ink = Color(red: 0.29, green: 0.12, blue: 0.2)

    var body: some View {
        if let day = entry.day, !day.meals.isEmpty {
            if family == .systemSmall {
                small(day)
            } else {
                list(day)
            }
        } else {
            Text("Open Monmon's Life")
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(ink)
        }
    }

    private func small(_ day: PlanDay) -> some View {
        let meal = day.meals[min(entry.next, day.meals.count - 1)]
        return VStack(alignment: .leading, spacing: 4) {
            Text(entry.started ? "DAY \(entry.dayNumber)" : "STARTS SOON")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(rose)
            Text(meal.type.uppercased())
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(ink.opacity(0.6))
            Text(meal.name)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(ink)
                .lineLimit(4)
            Spacer(minLength: 0)
            Text("\(day.kcal) kcal today")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(rose)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private func list(_ day: PlanDay) -> some View {
        VStack(alignment: .leading, spacing: family == .systemLarge ? 10 : 5) {
            HStack(alignment: .firstTextBaseline) {
                Text(entry.started ? "Day \(entry.dayNumber)" : "Day 1 soon")
                    .font(.system(size: 17, weight: .heavy, design: .rounded))
                    .foregroundStyle(rose)
                Spacer()
                Text("\(day.kcal) kcal \u{00B7} \(day.protein) g protein")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(ink.opacity(0.6))
            }
            ForEach(Array(day.meals.enumerated()), id: \.offset) { index, meal in
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Circle()
                        .fill(index == entry.next ? rose : rose.opacity(0.25))
                        .frame(width: 7, height: 7)
                    Text(meal.type)
                        .font(.system(size: 11, weight: .heavy, design: .rounded))
                        .foregroundStyle(ink.opacity(0.55))
                        .frame(width: 64, alignment: .leading)
                    Text(meal.name)
                        .font(.system(size: 12, weight: index == entry.next ? .bold : .medium, design: .rounded))
                        .foregroundStyle(ink)
                        .lineLimit(family == .systemLarge ? 3 : 1)
                }
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

struct MonmonWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "MonmonWidget", intent: StartDateIntent.self, provider: Provider()) { entry in
            MonmonWidgetView(entry: entry)
                .containerBackground(for: .widget) {
                    LinearGradient(
                        colors: [Color(red: 1.0, green: 0.95, blue: 0.965), Color(red: 1.0, green: 0.85, blue: 0.9)],
                        startPoint: .topLeading, endPoint: .bottomTrailing)
                }
        }
        .configurationDisplayName("Today's meals")
        .description("Your Monmon's Life meals for today.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

@main
struct MonmonWidgetBundle: WidgetBundle {
    var body: some Widget {
        MonmonWidget()
    }
}
