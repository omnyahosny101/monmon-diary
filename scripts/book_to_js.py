#!/usr/bin/env python3
"""Turn the media-buying course doc (markdown export) into src/academy_book.js.

The app book is re-ordered into parts that follow the learning path, every chapter keeps its sections,
formulas become readable HTML, and the two diagrams become small HTML diagrams.
Usage: python3 scripts/book_to_js.py book.md src/academy_book.js
"""
import html, json, re, sys

src, out = sys.argv[1], sys.argv[2]
md = open(src, encoding='utf-8').read()

# ---------- split into chapters (##) and sections (###) ----------
chapters = {}
cur = None
for line in md.split('\n'):
    if line.startswith('## '):
        cur = line[3:].strip(); chapters[cur] = [[None, []]]
    elif line.startswith('### ') and cur:
        chapters[cur].append([line[4:].strip(), []])
    elif cur:
        chapters[cur][-1][1].append(line)

def find(prefix):
    for k in chapters:
        if k.startswith(prefix): return k
    raise SystemExit('chapter not found: ' + prefix)

# id, chapter title prefix in the doc, short title in the app
PARTS = [
    ('الأساس: اللغة والأرقام والتخطيط', [('m1', 'موديول 1', 'الأساسيات: اللغة والأرقام'), ('m2', 'موديول 2', 'الاستراتيجية والتخطيط والميزانية')]),
    ('التتبع والقياس', [('m3', 'موديول 3', 'التتبع والقياس والإسناد')]),
    ('ميتا من الألف للياء', [('m4', 'موديول 4', 'ميتا أدز بالتفصيل'), ('inside', 'ميتا من جوه', 'ميتا من جوه: النظام والمزاد والتعلم'),
                             ('settings', 'كل إعداد', 'كل إعداد في ميتا ولازمته'), ('impact', 'إيه اللي بيأثر', 'إيه اللي بيأثر في حملتك'),
                             ('tactics', 'أقوى التكتيكات', 'أقوى التكتيكات والخرافات')]),
    ('الكريتيف وصفحة الهبوط', [('m7', 'موديول 7', 'استراتيجية الكريتيف'), ('cro', 'ملحق أ', 'صفحات الهبوط والتحويل (CRO)')]),
    ('التشغيل والتحسين والتقارير', [('types', 'ملحق ج', 'رسايل وليدز وكتالوج ووعي وريتارجتنج'), ('m8', 'موديول 8', 'التست والتحسين والتوسيع'), ('m9', 'موديول 9', 'التقارير والتحليل')]),
    ('السياسات والسوق المحلي', [('policy', 'ملحق ب', 'السياسات والرفض وأمان الحساب'), ('m11', 'موديول 11', 'السوق المصري والعربي')]),
    ('مستوى الخبراء', [('m10', 'موديول 10', 'مستوى الخبراء: القيمة والداتا والقيادة'), ('m12', 'موديول 12', 'إزاي تقودي حملة ناجحة جدًا')]),
    ('منصات تانية', [('m5', 'موديول 5', 'جوجل أدز'), ('m6', 'موديول 6', 'تيك توك وسناب ولينكدإن')]),
    ('مراجع وأدوات', [('examples', 'ملحق د', 'أمثلة جاهزة تشتغلي عليها'), ('news', 'أهم التطورات', 'أهم التطورات من 2024 لـ 2026'),
                      ('career', 'خطة مذاكرة', 'الشهادات والبورتفوليو والشغل الريموت'), ('sources', 'المصادر', 'المصادر')]),
]

# ---------- formulas and diagrams ----------
def frac(a, b): return '<span class="frac"><span>' + a + '</span><span>' + b + '</span></span>'
FORMULAS = {
    'CPA': 'CPA = ' + frac('CPM', '1000 × CTR × CVR'),
    'Breakeven ROAS': 'Breakeven ROAS = ' + frac('1', 'Gross margin'),
    'LTV': 'LTV = AOV × Gross margin × Purchases per customer',
    'Payback': 'Payback (months) = ' + frac('CAC', 'Monthly gross profit per customer'),
    'Budget': 'Budget = Target customers × Target CAC',
    'Daily budget': 'Daily budget ≈ ' + frac('50 × Target CPA', '7'),
    'Total value': 'Total value = Bid × Estimated action rate + Ad quality',
    'Pacing': 'Pacing = ' + frac('Spend to date', 'Monthly budget × Days passed ÷ Days in month'),
    'z': 'z = ' + frac('p<sub>B</sub> − p<sub>A</sub>', '√( p̄ (1 − p̄) (1/n<sub>A</sub> + 1/n<sub>B</sub>) )') + ' = ' + frac('0.08 − 0.06', '√(0.07 × 0.93 × 0.002)') + ' ≈ 1.75',
}
def formula(tex):
    for k in ['Breakeven ROAS', 'Daily budget', 'Total value', 'Payback', 'Pacing', 'Budget', 'LTV', 'CPA', 'z']:
        if re.search(r'\\text\{' + re.escape(k) + r'|^' + k + r' =', tex.strip()) or (k == 'z' and tex.strip().startswith('z =')):
            return '<div class="bkform" dir="ltr">' + FORMULAS[k] + '</div>'
    raise SystemExit('unknown formula: ' + tex)

DIAGRAMS = {
    'رحلة الإعلان': '<div class="bkflow">' + ''.join(
        '<div class="bkstep"><b>' + n + '</b><span>' + t + '</span><small>' + s + '</small></div>' for n, t, s in [
            ('1', 'الأهلية', 'الحدود، السياسات، الميزانية'), ('2', 'Retrieval · Andromeda', 'من ملايين لآلاف: هنا الكريتيف بيفرق'),
            ('3', 'Ranking', 'احتمال يعمل حدثك: العرض والصفحة'), ('4', 'المزاد', 'Bid × EAR + Ad quality'), ('5', 'العرض والـPacing', 'توزيع الميزانية')]) +
        '<div class="bkfb">↺ Feedback: كل كليك وتحويل وإخفاء بيرجع يعلّم النظام (البيكسل وCAPI)</div></div>',
    'شجرة تشخيص': '<div class="bktree"><div class="bkroot">CPA اتغيّر</div><div class="bkbr">' + ''.join(
        '<div><b>' + t + '</b><span>' + s + '</span></div>' for t, s in [
            ('CPM ↑', 'موسم؟ جمهور ضيق؟ جودة نزلت؟ منافسة؟'), ('CTR ↓', 'زهق؟ هوك ضعيف؟ عرض مش جذاب؟'), ('CVR ↓', 'الصفحة؟ العرض؟ التتبع؟ جودة الزوار؟')]) + '</div></div>',
}

# ---------- inline markdown ----------
def inline(s):
    s = s.replace('&#91;', '[').replace('\\[', '[').replace('\\]', ']')
    links = []
    def keep(m):
        links.append('<a class="bklink" data-ext="' + html.escape(m.group(2), True) + '">' + html.escape(m.group(1)) + ' ↗</a>')
        return '\x00' + str(len(links) - 1) + '\x00'
    s = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', keep, s)
    s = html.escape(s, False)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\x00(\d+)\x00', lambda m: links[int(m.group(1))], s)
    return s

def block(lines):
    out, i = [], 0
    while i < len(lines):
        ln = lines[i]
        if not ln.strip(): i += 1; continue
        if ln.startswith('```'):
            lang = ln[3:].strip(); body = []; i += 1
            while i < len(lines) and not lines[i].startswith('```'): body.append(lines[i]); i += 1
            i += 1
            if lang == 'latex': out.append(formula('\n'.join(body)))
            elif lang == 'markdown': out.append('<pre class="bkpre" dir="ltr">' + '<br>'.join(inline(b) for b in body) + '</pre>')
            else: out.append('<pre class="bkpre" dir="ltr">' + html.escape('\n'.join(body)) + '</pre>')
            continue
        if 'embedded content' in ln:
            for k, v in DIAGRAMS.items():
                if k in ln: out.append(v); break
            else: raise SystemExit('unknown diagram: ' + ln)
            i += 1; continue
        if ln.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', c) for c in cells): rows.append(cells)
                i += 1
            t = '<div class="bktable"><table><thead><tr>' + ''.join('<th>' + inline(c) + '</th>' for c in rows[0]) + '</tr></thead><tbody>'
            t += ''.join('<tr>' + ''.join('<td>' + inline(c) + '</td>' for c in r) + '</tr>' for r in rows[1:]) + '</tbody></table></div>'
            out.append(t); continue
        m = re.match(r'^(\s*)(- \[[ x]\] |- |\d+\. )', ln)
        if m:
            ordered = bool(re.match(r'\d+\.', m.group(2)))
            items = []
            while i < len(lines):
                l2 = lines[i]
                m2 = re.match(r'^(- \[[ x]\] |- |\d+\. )(.*)', l2)
                if m2: items.append([m2.group(2), []]); i += 1; continue
                m3 = re.match(r'^\s{2,}- (.*)', l2)
                if m3 and items: items[-1][1].append(m3.group(1)); i += 1; continue
                break
            tag = 'ol' if ordered else 'ul'
            out.append('<' + tag + '>' + ''.join('<li>' + inline(t) + ('<ul>' + ''.join('<li>' + inline(s) + '</li>' for s in sub) + '</ul>' if sub else '') + '</li>' for t, sub in items) + '</' + tag + '>')
            continue
        para = []
        while i < len(lines) and lines[i].strip() and not re.match(r'^(```|\||- |\d+\. |&#91;embedded)', lines[i]):
            para.append(lines[i].strip()); i += 1
        txt = ' '.join(para)
        cls = ' class="bkkey"' if txt.startswith('**') and txt.count('**') >= 2 and txt.index('**', 2) < 60 else ''
        out.append('<p' + cls + '>' + inline(txt) + '</p>')
    return ''.join(out)

def words(h): return len(re.sub(r'<[^>]+>', ' ', h).split())

book = []
for part, chs in PARTS:
    P = {'t': part, 'ch': []}
    for cid, prefix, short in chs:
        secs = chapters[find(prefix)]
        S = []
        for n, (h, lines) in enumerate(secs):
            body = block(lines)
            if not body: continue
            S.append({'id': cid + '-' + str(n), 'h': h or 'مقدمة', 'html': body, 'w': words(body)})
        P['ch'].append({'id': cid, 't': short, 'doc': find(prefix), 's': S})
    book.append(P)

js = '/* Generated by scripts/book_to_js.py from the course doc. Edit the doc, export markdown, re-run. */\nconst ACAD_BOOK = ' + json.dumps(book, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(out, 'w', encoding='utf-8').write(js)
for P in book:
    print('#', P['t'])
    for C in P['ch']:
        print('  ', C['id'], C['t'], sum(s['w'] for s in C['s']), 'words')
        for s in C['s']: print('      ', s['id'], s['h'])
