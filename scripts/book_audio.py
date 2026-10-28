"""Turns a book in books/<file>.js into Egyptian-Arabic audio, one MP3 per paragraph,
with Microsoft's Egyptian neural voice (Azure Speech, free tier: 500,000 characters a month).
Runs on GitHub Actions with the secrets AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.
Already-made files are kept, so running it again only fills the gaps."""
import json, os, re, sys, time, pathlib, urllib.request, urllib.error
from xml.sax.saxutils import escape

root = pathlib.Path(__file__).resolve().parent.parent
book_id, book_file = sys.argv[1], sys.argv[2]
voice = os.environ.get('VOICE', 'ar-EG-SalmaNeural')
key, region = os.environ['AZURE_SPEECH_KEY'].strip(), os.environ['AZURE_SPEECH_REGION'].strip()
src = (root / book_file).read_text()
paras = json.loads(src[src.index("'] = ") + 5:].rstrip().rstrip(';'))
out = root / 'books' / 'audio' / book_id
out.mkdir(parents=True, exist_ok=True)


def clean(t):
    t = t.replace('**', '')
    t = re.sub(r'(\d),(\d{3})', r'\1\2', t)
    t = re.sub(r'الـ\s?(?=\d)', '', t)
    t = re.sub(r'(\d+(?:\.\d+)?)\s?%', r'\1 في المية', t)
    t = re.sub(r'\$\s?(\d+(?:\.\d+)?)', r'\1 دولار', t)
    t = re.sub(r'(\d{4})\s?[-–]\s?(\d{4})', r'\1 لـ \2', t)
    t = re.sub(r'\bPPP\b', '', t)
    t = re.sub(r'[«»"“”„]', '', t)
    t = re.sub(r'[()\[\]]', '، ', t)
    t = re.sub(r'\s*[:؛;—–]\s*', '، ', t)
    t = re.sub(r'\.\.+', '، ', t)
    t = re.sub(r'\s*/\s*', ' أو ', t)
    t = re.sub(r'[*#•]', '', t)
    t = re.sub(r'\s+،', '،', t)
    t = re.sub(r'(،\s*){2,}', '، ', t)
    return re.sub(r'\s{2,}', ' ', t).strip(' ،')


def synth(text):
    ssml = ("<speak version='1.0' xml:lang='ar-EG'><voice name='%s'><prosody rate='-4%%'>%s</prosody></voice></speak>" % (voice, escape(text))).encode('utf-8')
    req = urllib.request.Request('https://%s.tts.speech.microsoft.com/cognitiveservices/v1' % region, data=ssml, method='POST', headers={
        'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'monmon-diary'})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and attempt < 5:
                time.sleep(10 * (attempt + 1)); continue
            raise SystemExit('Azure said %s: %s' % (e.code, e.read()[:300]))


files, chars = {}, 0
for i, (kind, raw) in enumerate(paras):
    text = clean(raw)
    if not re.search(r'[؀-ۿ]', text):
        continue
    name = '%03d.mp3' % i
    files[str(i)] = name
    f = out / name
    if f.exists() and f.stat().st_size > 1000:
        continue
    f.write_bytes(synth(text))
    chars += len(text)
    print(i, len(text), 'chars', flush=True)
    time.sleep(3.2)  # the free tier allows 20 requests a minute

(out / 'index.json').write_text(json.dumps({'voice': voice, 'files': files}, ensure_ascii=False))
print('done:', len(files), 'paragraphs,', chars, 'characters sent this run')
