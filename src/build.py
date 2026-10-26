"""Builds index.html (web) and ios/Web/index.html (iPhone app) from src/app.html + plan data."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'src/app.html').read_text()
plan = json.loads((root / 'src/plan.json').read_text())
groc = json.loads((root / 'src/groc.json').read_text())
out = src.replace('__DATA__', json.dumps(plan, ensure_ascii=False)).replace('__GROC__', json.dumps(groc, ensure_ascii=False))
(root / 'index.html').write_text(out)
(root / 'ios/Web/index.html').write_text(out)
(root / 'ios/Shared/plan.json').write_text(json.dumps(plan, ensure_ascii=False))
print('built', len(out), 'bytes')
