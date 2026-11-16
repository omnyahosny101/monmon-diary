"""Turns the bedtime stories in stories/*.md into src/stories_data.js.
Each file: '# title', then 'sub:', 'tags:', 'cover:' lines, then '## night title' sections.
Inside a night, blank lines separate paragraphs and '---' is a scene break.
Run: python3 scripts/stories_to_js.py"""
import json, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
ORDER = ['guard', 'debt', 'office', 'back', 'iddah', 'still', 'takeover', 'undercover', 'qaid', 'ceo', 'zamalek', 'contract']
out = []
for sid in ORDER:
    lines = (root / 'stories' / (sid + '.md')).read_text().split('\n')
    st = {'id': sid, 't': '', 'sub': '', 'tags': '', 'e': '🌙', 'n': []}
    night = None
    for ln in lines:
        if ln.startswith('# '): st['t'] = ln[2:].strip(); continue
        m = re.match(r'^(sub|tags|cover):\s*(.*)$', ln)
        if m and night is None:
            st[{'sub': 'sub', 'tags': 'tags', 'cover': 'e'}[m.group(1)]] = m.group(2).strip(); continue
        if ln.startswith('## '):
            night = {'t': ln[3:].strip(), 'p': []}; st['n'].append(night); continue
        if night is not None: night['p'].append(ln)
    for n in st['n']:
        paras, cur = [], []
        for ln in n['p'] + ['']:
            if ln.strip() == '':
                if cur: paras.append('\n'.join(cur)); cur = []
            else: cur.append(ln.rstrip())
        n['p'] = paras
        n['w'] = sum(len(p.split()) for p in paras)
    out.append(st)
(root / 'src' / 'stories_data.js').write_text('/* Bedtime stories, generated from stories/*.md by scripts/stories_to_js.py. Edit the .md files, not this. */\nconst STORIES = ' + json.dumps(out, ensure_ascii=False) + ';\n')
print([(s['t'], len(s['n']), sum(n['w'] for n in s['n'])) for s in out])
