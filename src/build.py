"""Builds index.html (web) and ios/Web/index.html (iPhone app) from the files in src/."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
page = (src / 'app.html').read_text()
parts = {
    '__DATA__': json.dumps(json.loads((src / 'plan.json').read_text()), ensure_ascii=False),
    '__GROC__': json.dumps(json.loads((src / 'groc.json').read_text()), ensure_ascii=False),
    '__DISHES__': json.dumps(json.loads((src / 'dishes.json').read_text()), ensure_ascii=False),
    '__CONTENT__': (src / 'content.js').read_text(),
    '__NUTRITION__': (src / 'nutrition.js').read_text(),
    '__APP_JS__': (src / 'app.js').read_text(),
}
for k, v in parts.items():
    assert page.count(k) == 1, k
    page = page.replace(k, v)
(root / 'index.html').write_text(page)
(root / 'ios/Web/index.html').write_text(page)
(root / 'ios/Shared/plan.json').write_text(parts['__DATA__'])
print('built', len(page), 'bytes')
