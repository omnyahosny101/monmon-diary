import WidgetKit
import SwiftUI

// MARK: - shared look

enum Pink {
    static let rose = Color(red: 1.0, green: 0.36, blue: 0.56)
    static let ink = Color(red: 0.29, green: 0.12, blue: 0.2)
    static let muted = Color(red: 0.6, green: 0.42, blue: 0.49)
    static let lilac = Color(red: 0.55, green: 0.45, blue: 0.95)
    static let mint = Color(red: 0.25, green: 0.7, blue: 0.5)
    static let danger = Color(red: 0.9, green: 0.25, blue: 0.35)
    static let bg = LinearGradient(colors: [Color(red: 1.0, green: 0.95, blue: 0.965), Color(red: 1.0, green: 0.85, blue: 0.9)],
                                   startPoint: .topLeading, endPoint: .bottomTrailing)
    static let lilacBg = LinearGradient(colors: [Color(red: 0.99, green: 0.95, blue: 1.0), Color(red: 0.91, green: 0.88, blue: 1.0)],
                                        startPoint: .topLeading, endPoint: .bottomTrailing)
    static let peachBg = LinearGradient(colors: [Color(red: 1.0, green: 0.98, blue: 0.93), Color(red: 1.0, green: 0.9, blue: 0.86)],
                                        startPoint: .topLeading, endPoint: .bottomTrailing)
    static func font(_ size: CGFloat, _ weight: Font.Weight = .semibold) -> Font { .system(size: size, weight: weight, design: .rounded) }
}

/// Right-to-left layout for the Arabic widgets.
struct RTL: ViewModifier {
    func body(content: Content) -> some View {
        content
            .environment(\.layoutDirection, .rightToLeft)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

struct OpenAppHint: View {
    var body: some View {
        VStack(spacing: 4) {
            Text("💗").font(.system(size: 22))
            Text("افتحي Monmon’s Life مرة عشان الويدجت يتملي")
                .font(Pink.font(12, .bold)).foregroundStyle(Pink.ink).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct ProgressLine: View {
    let value: Double
    var color: Color = Pink.rose
    var body: some View {
        GeometryReader { g in
            ZStack(alignment: .leading) {
                Capsule().fill(color.opacity(0.18))
                Capsule().fill(color).frame(width: max(6, g.size.width * min(1, max(0, value))))
            }
        }
        .frame(height: 6)
    }
}

/// One entry per moment the widget should change; the data comes from the shared file.
struct LifeEntry: TimelineEntry {
    let date: Date
    let data: WData?
    var slot: Int = 0
}

/// Entries at midnight for the next week (the page precomputes 7 days), plus extra moments in the day if asked.
struct LifeProvider: TimelineProvider {
    var times: [(Int, Int)] = []

    func placeholder(in context: Context) -> LifeEntry { LifeEntry(date: Date(), data: WidgetStore.load()) }
    func getSnapshot(in context: Context, completion: @escaping (LifeEntry) -> Void) { completion(entries().first!) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<LifeEntry>) -> Void) {
        completion(Timeline(entries: entries(), policy: .atEnd))
    }

    private func entries() -> [LifeEntry] {
        let data = WidgetStore.load(), cal = Calendar.current, now = Date()
        var out = [LifeEntry(date: now, data: data, slot: slot(at: now))]
        for offset in 0...6 {
            guard let day = cal.date(byAdding: .day, value: offset, to: cal.startOfDay(for: now)) else { continue }
            if offset > 0 { out.append(LifeEntry(date: day, data: data, slot: 0)) }
            for (i, hm) in times.enumerated() {
                if let t = cal.date(bySettingHour: hm.0, minute: hm.1, second: 0, of: day), t > now {
                    out.append(LifeEntry(date: t, data: data, slot: i + 1))
                }
            }
        }
        return out.sorted { $0.date < $1.date }
    }

    private func slot(at date: Date) -> Int {
        let cal = Calendar.current, m = cal.component(.hour, from: date) * 60 + cal.component(.minute, from: date)
        return times.filter { $0.0 * 60 + $0.1 <= m }.count
    }
}

// MARK: - 💍 wedding countdown

struct WeddingView: View {
    @Environment(\.widgetFamily) private var family
    let entry: LifeEntry

    var body: some View {
        let target = entry.data?.wedding ?? WidgetStore.weddingFallback
        let days = WidgetStore.daysUntil(target, from: entry.date)
        switch family {
        case .accessoryInline:
            Text(days > 0 ? "💍 \(days) يوم على الفرح" : "💍 مبروك يا عروسة")
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                VStack(spacing: 0) {
                    Text("💍").font(.system(size: 12))
                    Text("\(max(days, 0))").font(.system(size: 20, weight: .heavy, design: .rounded)).minimumScaleFactor(0.6)
                    Text("يوم").font(.system(size: 9, weight: .bold))
                }
            }
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 1) {
                Text("💍 \(max(days, 0)) يوم على الفرح").font(.system(size: 14, weight: .heavy, design: .rounded))
                if let n = entry.data?.wnext {
                    Text("\(n.e) \(n.t) · \(WidgetStore.niceDay(n.d))").font(.system(size: 12, weight: .semibold)).lineLimit(2)
                }
            }
            .environment(\.layoutDirection, .rightToLeft)
            .frame(maxWidth: .infinity, alignment: .leading)
        case .systemSmall:
            VStack(alignment: .leading, spacing: 2) {
                Text("💍 الفرح").font(Pink.font(12, .heavy)).foregroundStyle(Pink.rose)
                Spacer(minLength: 0)
                Text("\(max(days, 0))").font(.system(size: 46, weight: .heavy, design: .rounded)).foregroundStyle(Pink.ink).minimumScaleFactor(0.6)
                Text(days > 0 ? "يوم فاضل" : "مبروك يا عروسة 🤍").font(Pink.font(13, .bold)).foregroundStyle(Pink.ink)
                Spacer(minLength: 0)
                Text("\(max(days / 7, 0)) أسبوع · \(WidgetStore.niceDay(target))").font(Pink.font(10, .bold)).foregroundStyle(Pink.muted)
            }
            .modifier(RTL())
        default:
            HStack(alignment: .center, spacing: 14) {
                VStack(spacing: 0) {
                    Text("💍").font(.system(size: 22))
                    Text("\(max(days, 0))").font(.system(size: 44, weight: .heavy, design: .rounded)).foregroundStyle(Pink.ink).minimumScaleFactor(0.6)
                    Text("يوم على الفرح").font(Pink.font(12, .bold)).foregroundStyle(Pink.rose)
                }
                .frame(width: 104)
                VStack(alignment: .leading, spacing: 6) {
                    Text("\(WidgetStore.niceDay(target)) · \(max(days / 7, 0)) أسبوع و\(max(days % 7, 0)) يوم").font(Pink.font(12, .bold)).foregroundStyle(Pink.muted)
                    if let d = entry.data, d.wtotal > 0 {
                        Text("تجهيزات الفرح: \(d.wdone) من \(d.wtotal)").font(Pink.font(12, .bold)).foregroundStyle(Pink.ink)
                        ProgressLine(value: Double(d.wdone) / Double(d.wtotal))
                    }
                    if let n = entry.data?.wnext {
                        Text("الجاي: \(n.e) \(n.t)").font(Pink.font(13, .heavy)).foregroundStyle(Pink.ink).lineLimit(2)
                        Text(WidgetStore.niceDay(n.d)).font(Pink.font(11, .bold)).foregroundStyle(Pink.rose)
                    }
                    Spacer(minLength: 0)
                }
            }
            .modifier(RTL())
        }
    }
}

struct WeddingWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "MonmonWedding", provider: LifeProvider()) { entry in
            WeddingView(entry: entry)
                .widgetURL(URL(string: "monmon://wedding"))
                .containerBackground(for: .widget) { Pink.bg }
        }
        .configurationDisplayName("💍 Wedding countdown")
        .description("Days until the wedding and your next beauty appointment.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

// MARK: - 🎓 academy lesson of the day

struct CourseView: View {
    @Environment(\.widgetFamily) private var family
    let entry: LifeEntry

    var body: some View {
        if let d = entry.data {
            let c = d.course, idx = d.lessonIndex(on: entry.date)
            let pct = c.total > 0 ? Double(c.done) / Double(c.total) : 0
            let todayMins = WidgetStore.key(entry.date) == d.at ? c.mins : 0
            switch family {
            case .accessoryRectangular:
                VStack(alignment: .leading, spacing: 1) {
                    if let i = idx {
                        Text("🎓 اليوم \(i + 1) · \(c.done)/\(c.total)").font(.system(size: 13, weight: .heavy, design: .rounded))
                        Text(c.days[i].t).font(.system(size: 12, weight: .semibold)).lineLimit(2)
                    } else {
                        Text(c.final ? "🎓 خبيرة ميتا ✅" : "🎓 فاضل الاختبار النهائي").font(.system(size: 13, weight: .heavy, design: .rounded))
                    }
                }
                .environment(\.layoutDirection, .rightToLeft)
                .frame(maxWidth: .infinity, alignment: .leading)
            case .accessoryCircular:
                Gauge(value: pct) { Text("🎓") } currentValueLabel: { Text("\(c.done)") }
                    .gaugeStyle(.accessoryCircularCapacity)
            case .systemSmall:
                VStack(alignment: .leading, spacing: 4) {
                    Text(idx.map { "🎓 اليوم \($0 + 1)" } ?? "🎓 الأكاديمية").font(Pink.font(12, .heavy)).foregroundStyle(Pink.lilac)
                    Text(idx.map { c.days[$0].t } ?? (c.final ? "خلصتي الكورس 🏆" : "فاضل الاختبار النهائي"))
                        .font(Pink.font(14, .heavy)).foregroundStyle(Pink.ink).lineLimit(4).minimumScaleFactor(0.85)
                    Spacer(minLength: 0)
                    ProgressLine(value: pct, color: Pink.lilac)
                    Text("\(c.done)/\(c.total) · \(todayMins) د النهارده\(c.streak > 0 ? " · \(c.streak)🔥" : "")").font(Pink.font(10, .bold)).foregroundStyle(Pink.muted)
                }
                .modifier(RTL())
            default:
                VStack(alignment: .leading, spacing: 5) {
                    HStack {
                        Text("🎓 خبيرة ميتا في 30 يوم").font(Pink.font(12, .heavy)).foregroundStyle(Pink.lilac)
                        Spacer()
                        Text("\(c.done)/\(c.total)").font(Pink.font(12, .heavy)).foregroundStyle(Pink.ink)
                    }
                    if let i = idx {
                        Text("اليوم \(i + 1) · الأسبوع \(c.days[i].w)\(c.behind > 0 && WidgetStore.key(entry.date) == d.at ? " · متأخرة \(c.behind)" : "")").font(Pink.font(11, .bold)).foregroundStyle(Pink.muted)
                        Text(c.days[i].t).font(Pink.font(15, .heavy)).foregroundStyle(Pink.ink).lineLimit(2)
                        Text("🎯 " + c.days[i].g).font(Pink.font(11, .semibold)).foregroundStyle(Pink.ink.opacity(0.8)).lineLimit(family == .systemLarge ? 4 : 2)
                    } else {
                        Text(c.final ? "خلصتي الكورس والشهادة 🏆" : "خلصتي الدروس! فاضل الاختبار النهائي").font(Pink.font(15, .heavy)).foregroundStyle(Pink.ink)
                    }
                    Spacer(minLength: 0)
                    ProgressLine(value: min(1, Double(todayMins) / 60), color: Pink.lilac)
                    Text("\(todayMins) من 60 دقيقة النهارده\(c.streak > 0 ? " · \(c.streak) أيام ورا بعض 🔥" : "")").font(Pink.font(10, .bold)).foregroundStyle(Pink.muted)
                }
                .modifier(RTL())
            }
        } else {
            OpenAppHint()
        }
    }
}

struct CourseWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "MonmonAcademy", provider: LifeProvider()) { entry in
            CourseView(entry: entry)
                .widgetURL(URL(string: "monmon://lesson"))
                .containerBackground(for: .widget) { Pink.lilacBg }
        }
        .configurationDisplayName("🎓 Today's lesson")
        .description("Your Meta ads course: today's lesson, progress and study minutes.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryCircular])
    }
}

// MARK: - 💭 quote of the day

struct QuoteView: View {
    @Environment(\.widgetFamily) private var family
    let entry: LifeEntry

    var body: some View {
        if let q = entry.data?.day(entry.date)?.q {
            VStack(alignment: .leading, spacing: 6) {
                Text("💭 " + q.src).font(Pink.font(11, .heavy)).foregroundStyle(Pink.rose).lineLimit(1)
                Text(q.idea)
                    .font(Pink.font(family == .systemSmall ? 12 : 14, .bold)).foregroundStyle(Pink.ink)
                    .lineLimit(family == .systemSmall ? 6 : family == .systemMedium ? 4 : 8).minimumScaleFactor(0.85)
                if family == .systemLarge {
                    Text("✨ جربي النهارده: " + q.tip).font(Pink.font(13, .semibold)).foregroundStyle(Pink.ink.opacity(0.8)).lineLimit(5)
                }
                Spacer(minLength: 0)
            }
            .modifier(RTL())
        } else {
            OpenAppHint()
        }
    }
}

struct QuoteWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "MonmonQuote", provider: LifeProvider()) { entry in
            QuoteView(entry: entry)
                .widgetURL(URL(string: "monmon://quote"))
                .containerBackground(for: .widget) { Pink.peachBg }
        }
        .configurationDisplayName("💭 Quote of the day")
        .description("Today's idea from your books, with something to try.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - 💡 info: six new facts a day, plus today's lesson

struct FactView: View {
    @Environment(\.widgetFamily) private var family
    let entry: LifeEntry

    var body: some View {
        if let day = entry.data?.day(entry.date), !day.facts.isEmpty {
            // slot 0 (before 10:30) shows today's lesson; then a new fact at each slot
            let item = entry.slot == 0 ? day.lesson : day.facts[min(entry.slot - 1, day.facts.count - 1)]
            VStack(alignment: .leading, spacing: 5) {
                Text(entry.slot == 0 ? "📚 درس النهارده" : "💡 معلومة \(entry.slot) من 6").font(Pink.font(11, .heavy)).foregroundStyle(Pink.mint)
                Text(item.t).font(Pink.font(family == .systemSmall ? 13 : 14, .heavy)).foregroundStyle(Pink.ink).lineLimit(family == .systemSmall ? 3 : 2)
                Text(item.x).font(Pink.font(family == .systemSmall ? 11 : 12, .semibold)).foregroundStyle(Pink.ink.opacity(0.8))
                    .lineLimit(family == .systemSmall ? 4 : family == .systemMedium ? 3 : 9)
                Spacer(minLength: 0)
            }
            .modifier(RTL())
        } else {
            OpenAppHint()
        }
    }
}

struct FactWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "MonmonFact", provider: LifeProvider(times: [(10, 30), (12, 30), (15, 0), (16, 30), (18, 30), (21, 0)])) { entry in
            FactView(entry: entry)
                .widgetURL(URL(string: "monmon://fact"))
                .containerBackground(for: .widget) {
                    LinearGradient(colors: [Color(red: 0.94, green: 1.0, blue: 0.97), Color(red: 0.84, green: 0.96, blue: 0.91)], startPoint: .topLeading, endPoint: .bottomTrailing)
                }
        }
        .configurationDisplayName("💡 Daily info")
        .description("Today's lesson in the morning, then a new fact six times a day.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - ✅ tasks

struct TaskRow: View {
    let task: WData.Task
    let today: String
    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Circle().fill(task.p == 0 ? Pink.danger : task.p == 1 ? Color.orange : Pink.rose.opacity(0.35)).frame(width: 7, height: 7)
            Text(task.t).font(Pink.font(12, task.p == 0 ? .heavy : .semibold)).foregroundStyle(Pink.ink).lineLimit(1)
            Spacer(minLength: 4)
            if !task.due.isEmpty {
                Text(task.due < today ? "متأخرة" : task.due == today ? "النهارده" : WidgetStore.niceDay(task.due))
                    .font(Pink.font(10, .bold)).foregroundStyle(task.due <= today ? Pink.danger : Pink.muted)
            }
        }
    }
}

struct TasksView: View {
    @Environment(\.widgetFamily) private var family
    let entry: LifeEntry

    var body: some View {
        if let d = entry.data {
            let today = WidgetStore.key(entry.date)
            let n = family == .systemSmall ? 3 : family == .systemMedium ? 4 : 9
            VStack(alignment: .leading, spacing: family == .systemLarge ? 8 : 5) {
                HStack {
                    Text("✅ مهامي").font(Pink.font(13, .heavy)).foregroundStyle(Pink.rose)
                    Spacer()
                    Text(d.urgent > 0 ? "🚨 \(d.urgent) · \(d.open)" : "\(d.open)").font(Pink.font(12, .heavy)).foregroundStyle(Pink.ink)
                }
                if d.tasks.isEmpty {
                    Spacer(minLength: 0)
                    Text("مفيش مهام مفتوحة 🎉").font(Pink.font(14, .bold)).foregroundStyle(Pink.ink)
                } else if family == .systemSmall {
                    ForEach(Array(d.tasks.prefix(n).enumerated()), id: \.offset) { _, t in
                        Text((t.p == 0 ? "🚨 " : "• ") + t.t).font(Pink.font(12, t.p == 0 ? .heavy : .semibold)).foregroundStyle(Pink.ink).lineLimit(2)
                    }
                } else {
                    ForEach(Array(d.tasks.prefix(n).enumerated()), id: \.offset) { _, t in TaskRow(task: t, today: today) }
                }
                Spacer(minLength: 0)
            }
            .modifier(RTL())
        } else {
            OpenAppHint()
        }
    }
}

struct TasksWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "MonmonTasks", provider: LifeProvider()) { entry in
            TasksView(entry: entry)
                .widgetURL(URL(string: "monmon://tasks"))
                .containerBackground(for: .widget) { Pink.bg }
        }
        .configurationDisplayName("✅ Tasks")
        .description("Your open tasks, urgent ones first.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - 🌸 my day: everything in one

struct DayView: View {
    @Environment(\.widgetFamily) private var family
    let entry: LifeEntry

    var body: some View {
        if let d = entry.data {
            let today = WidgetStore.key(entry.date), isToday = today == d.at
            let days = WidgetStore.daysUntil(d.wedding, from: entry.date), idx = d.lessonIndex(on: entry.date)
            VStack(alignment: .leading, spacing: family == .systemLarge ? 9 : 5) {
                HStack(spacing: 8) {
                    Text("🌸 يومي").font(Pink.font(14, .heavy)).foregroundStyle(Pink.rose)
                    Spacer()
                    Text("💍 \(max(days, 0)) يوم").font(Pink.font(12, .heavy)).foregroundStyle(Pink.ink)
                    if isToday && d.htotal > 0 { Text("✨ \(d.habits)/\(d.htotal)").font(Pink.font(12, .heavy)).foregroundStyle(Pink.ink) }
                    if isToday { Text("💧 \(d.water)/8").font(Pink.font(12, .heavy)).foregroundStyle(Pink.ink) }
                }
                if let i = idx {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("🎓 اليوم \(i + 1) في الأكاديمية").font(Pink.font(11, .heavy)).foregroundStyle(Pink.lilac)
                        Text(d.course.days[i].t).font(Pink.font(14, .heavy)).foregroundStyle(Pink.ink).lineLimit(family == .systemLarge ? 2 : 1)
                    }
                }
                if family == .systemLarge {
                    Divider().opacity(0.4)
                    Text("✅ أهم المهام").font(Pink.font(11, .heavy)).foregroundStyle(Pink.rose)
                    if d.tasks.isEmpty { Text("مفيش مهام مفتوحة 🎉").font(Pink.font(12, .bold)).foregroundStyle(Pink.ink) }
                    ForEach(Array(d.tasks.prefix(4).enumerated()), id: \.offset) { _, t in TaskRow(task: t, today: today) }
                    if let q = d.day(entry.date)?.q {
                        Divider().opacity(0.4)
                        Text("💭 " + q.src).font(Pink.font(11, .heavy)).foregroundStyle(Pink.rose).lineLimit(1)
                        Text(q.idea).font(Pink.font(12, .semibold)).foregroundStyle(Pink.ink).lineLimit(4)
                    }
                } else if let t = d.tasks.first {
                    Text((t.p == 0 ? "🚨 " : "✅ ") + t.t + (d.open > 1 ? "  +\(d.open - 1)" : "")).font(Pink.font(12, .bold)).foregroundStyle(Pink.ink).lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .modifier(RTL())
        } else {
            OpenAppHint()
        }
    }
}

struct DayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "MonmonDay", provider: LifeProvider()) { entry in
            DayView(entry: entry)
                .widgetURL(URL(string: "monmon://today"))
                .containerBackground(for: .widget) { Pink.bg }
        }
        .configurationDisplayName("🌸 My day")
        .description("Wedding countdown, today's lesson, tasks, habits, water and the quote, all together.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}
