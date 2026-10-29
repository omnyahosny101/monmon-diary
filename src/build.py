"""Builds index.html (web) and ios/Web/index.html (iPhone app) from the files in src/."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
page = (src / 'app.html').read_text()
parts = {
    '__DATA__': json.dumps(json.loads((src / 'plan.json').read_text()), ensure_ascii=False),
    '__GROC__': json.dumps(json.loads((src / 'groc.json').read_text()), ensure_ascii=False),
    '__DISHES__': json.dumps(json.loads((src / 'dishes.json').read_text()), ensure_ascii=False),
    '__CONTENT__': (src / 'content.js').read_text() + (src / 'wisdom.js').read_text() + (src / 'facts.js').read_text() + ''.join((src / f).read_text() for f in ['learn1.js', 'learn2.js', 'learn3.js', 'learn4.js', 'wisdom_ar1.js', 'wisdom_ar2.js', 'french1.js', 'french2.js', 'books.js', 'book_extras.js']),
    '__NUTRITION__': (src / 'nutrition.js').read_text(),
    '__APP_JS__': (src / 'i18n.js').read_text() + (src / 'ar_ui.js').read_text() + (src / 'ar_food.js').read_text() + (src / 'ar_content.js').read_text() + (src / 'app.js').read_text() + (src / 'life.js').read_text() + (src / 'home.js').read_text() + (src / 'read.js').read_text() + (src / 'fr_plus.js').read_text() + (src / 'narrate.js').read_text() + (src / 'pods.js').read_text() + (src / 'boot.js').read_text(),
}
for k, v in parts.items():
    assert page.count(k) == 1, k
    page = page.replace(k, v)
(root / 'index.html').write_text(page)
(root / 'ios/Web/index.html').write_text(page)
import shutil
shutil.rmtree(root / 'ios/Web/books', ignore_errors=True)
shutil.copytree(root / 'books', root / 'ios/Web/books', ignore=shutil.ignore_patterns('audio'))
(root / 'ios/Shared/plan.json').write_text(parts['__DATA__'])
print('built', len(page), 'bytes')
