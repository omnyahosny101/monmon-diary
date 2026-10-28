/* ============ NARRATOR: the book read aloud ============
   Sentences go to the phone's Arabic voice in batches, so it keeps reading with the screen locked.
   The paragraph being read glows and the page follows it. Tap any paragraph to start from there.
   S.nar = {rate, voice} */
const NAR = {bar:false, playing:false, paused:false, q:[], at:-1, sent:0, run:0};
const NAR_RATES = [0.8, 1, 1.2, 1.4];
function narrMigrate(){ S.nar = Object.assign({rate:1, voice:'', engine:'salma'}, S.nar || {}); }
/* the book recorded in Microsoft's Egyptian voice (Salma), one MP3 per paragraph, made by scripts/book_audio.py */
const NAR_AUDIO = {}; const LIVE = 'https://omnyahosny101.github.io/monmon-diary/';
function narrManifest(b){
  if (NAR_AUDIO[b.id] !== undefined) return Promise.resolve(NAR_AUDIO[b.id]);
  const base = location.protocol.startsWith('http') ? '' : LIVE;
  return fetch(base + 'books/audio/' + b.id + '/index.json?t=' + Date.now()).then(r => r.ok ? r.json() : null).catch(() => null)
    .then(m => { NAR_AUDIO[b.id] = m && m.files && Object.keys(m.files).length ? m : null; return NAR_AUDIO[b.id]; });
}
const narrUsesAudio = () => RD && S.nar.engine === 'salma' && !!NAR_AUDIO[RD.b.id];
function narrAudioURL(b, f){ return new URL('books/audio/' + b.id + '/' + f, location.protocol.startsWith('http') ? location.href : LIVE).href; }
let narrEl = null;
function narrWebAudio(i){
  const x = NAR.q[i]; if (!x) return;
  if (!narrEl){ narrEl = new Audio(); narrEl.preload = 'auto'; }
  narrEl.onended = () => { narrDone(x.id); if (NAR.q[i + 1] && NAR.playing) narrWebAudio(i + 1); };
  narrEl.src = x.url; narrEl.playbackRate = S.nar.rate; narrEl.play().then(() => narrStart(x.id)).catch(() => toast(L2('الصوت محتاج نت', 'The audio needs internet')));
}
function narrSplit(t){
  const out = [];
  t.split(/(?<=[.؟!?:؛])\s+/).forEach(s => {
    s = s.trim();
    while (s.length > 320){ let k = s.lastIndexOf('،', 300); if (k < 80) k = s.lastIndexOf(' ', 300); if (k < 1) k = 300; out.push(s.slice(0, k + 1).trim()); s = s.slice(k + 1).trim(); }
    if (s) out.push(s);
  });
  return out;
}
// make the text easy to say: no symbols read out loud, numbers written the way they're spoken
function narrClean(t){
  return t.replace(/\*\*/g, '')
    .replace(/(\d),(\d{3})/g, '$1$2')
    .replace(/الـ\s?(?=\d)/g, '')
    .replace(/(\d+(?:\.\d+)?)\s?%/g, '$1 في المية')
    .replace(/\$\s?(\d+(?:\.\d+)?)/g, '$1 دولار')
    .replace(/(\d{4})\s?[-–]\s?(\d{4})/g, '$1 لـ $2')
    .replace(/\bPPP\b/g, '')
    .replace(/[«»"“”„]/g, '')
    .replace(/[()\[\]]/g, '، ')
    .replace(/\s*[:؛;—–]\s*/g, '، ')
    .replace(/\.\.+/g, '، ')
    .replace(/\s*\/\s*/g, ' أو ')
    .replace(/[*#•]/g, '')
    .replace(/\s+،/g, '،')
    .replace(/(،\s*){2,}/g, '، ')
    .replace(/^\s*،\s*|\s*،\s*$/g, '')
    .replace(/\s{2,}/g, ' ').trim();
}
function narrBuild(from){
  NAR.run++; NAR.q = []; NAR.sent = 0; NAR.at = -1;
  const P = RD.P;
  if (narrUsesAudio()){ const m = NAR_AUDIO[RD.b.id]; for (let p = from; p < P.length; p++) if (m.files[p]) NAR.q.push({id:'n' + NAR.run + '_' + NAR.q.length, p, url:narrAudioURL(RD.b, m.files[p])}); return; }
  for (let p = from; p < P.length; p++) narrSplit(plainOf(P[p][1])).map(narrClean).filter(t => /[\u0600-\u06FF]/.test(t)).forEach(t => NAR.q.push({id:'n' + NAR.run + '_' + NAR.q.length, p, t}));
}
function narrWebVoice(){
  const vs = webVoices('ar'); if (!vs.length) return null;
  if (S.nar.voice){ const m = vs.find(v => v.name === S.nar.voice || v.voiceURI === S.nar.voice); if (m) return m; }
  const sc = v => (/eg/i.test(v.lang) ? 60 : 0) + (/premium/i.test(v.name) ? 50 : 0) + (/enhanced|natural|neural/i.test(v.name) ? 40 : 0) + (/google/i.test(v.name) ? 30 : 0) + (v.localService ? 1 : 0);
  return vs.slice().sort((a, b) => sc(b) - sc(a))[0];
}
function narrSend(replace){
  if (NAR.q[0] && NAR.q[0].url){
    if (!replace) return; NAR.sent = NAR.q.length;
    if (VOX.native){ try { native().postMessage({type:'audioQueue', replace:true, rate:S.nar.rate, items:NAR.q.map(x => ({id:x.id, url:x.url}))}); return; } catch(e){} }
    return narrWebAudio(0);
  }
  const batch = NAR.q.slice(NAR.sent, NAR.sent + 150); if (!batch.length) return;
  NAR.sent += batch.length;
  if (VOX.native){
    try { native().postMessage({type:'speakQueue', replace:!!replace, items:batch.map(x => ({id:x.id, text:x.t})), lang:'ar-EG', rate:0.5 * S.nar.rate, voice:S.nar.voice || ''}); return; } catch(e){}
  }
  const s = window.speechSynthesis; if (!s) return toast(L2('الصوت مش متاح هنا', 'Sound isn’t available here'));
  if (replace) s.cancel();
  const v = narrWebVoice();
  if (!v && replace) toast(L2('مفيش صوت عربي ظاهر هنا. نزّلي تحديث Xcode عشان يستعمل صوت الآيفون العربي.', 'No Arabic voice here. Install the app update to use the iPhone’s Arabic voice.'));
  batch.forEach(x => { const u = new SpeechSynthesisUtterance(x.t); u.lang = v ? v.lang : 'ar-SA'; if (v) u.voice = v; u.rate = S.nar.rate;
    u.onstart = () => narrStart(x.id); u.onend = () => narrDone(x.id); s.speak(u); });
}
const _spokeBase = window.__spoke;
window.__spoke = id => { if (String(id)[0] === 'n') return narrDone(id); _spokeBase(id); };
window.__spokeStart = id => { if (String(id)[0] === 'n') narrStart(id); };
const narrIdx = id => { const m = /^n(\d+)_(\d+)$/.exec(id); return m && +m[1] === NAR.run ? +m[2] : -1; };
function narrStart(id){
  const i = narrIdx(id); if (i < 0 || !RD) return;
  NAR.at = i; const p = NAR.q[i].p;
  $$('.rd-now', RD.el).forEach(e => { if (+e.dataset.i !== p) e.classList.remove('rd-now'); });
  const el = RD.paras[p]; if (el && !el.classList.contains('rd-now')){
    el.classList.add('rd-now');
    const sc = $('#rdScroll', RD.el), top = el.offsetTop - sc.scrollTop;
    if (top < 60 || top > sc.clientHeight * 0.55) sc.scrollTo({top:el.offsetTop - 110, behavior:'smooth'});
  }
  narrLabel();
}
function narrDone(id){
  const i = narrIdx(id); if (i < 0) return;
  const cur = NAR.q[i], next = NAR.q[i + 1];
  if (!next || next.p !== cur.p) narrMarkRead(cur.p);
  if (NAR.sent < NAR.q.length && i >= NAR.sent - 12) narrSend(false);
  if (!next){ NAR.playing = false; if (RD) $$('.rd-now', RD.el).forEach(e => e.classList.remove('rd-now')); narrLabel(); }
}
function narrMarkRead(p){
  if (!RD) return; const b = RD.b, x = S.books[b.id];
  if (p > x.max){
    const day = todayStr(); x.log[day] = (x.log[day] || 0) + b.lens.slice(x.max + 1, p + 1).reduce((a, y) => a + y, 0); x.max = p;
    const st = bookState(b); if (!x.done[st.k] && p >= st.due){ x.done[st.k] = day; readDone(b, st); }
    save();
  }
  x.pos = p; readerTrack();
}
function narrFrom(p){
  if (!RD || !RD.P) return;
  stopSpeak(); if (narrEl){ narrEl.pause(); narrEl.onended = null; }
  narrBuild(Math.max(0, Math.min(RD.P.length - 1, p)));
  NAR.playing = true; NAR.paused = false; narrSend(true); narrLabel();
}
function narrStop(){
  if (!NAR.bar && !NAR.playing) return;
  NAR.run++; NAR.playing = false; NAR.paused = false; NAR.bar = false;
  try { if (VOX.native) native().postMessage({type:'stopSpeak'}); else if (window.speechSynthesis) speechSynthesis.cancel(); } catch(e){}
  if (narrEl){ narrEl.pause(); narrEl.onended = null; }
  if (RD){ $$('.rd-now', RD.el).forEach(e => e.classList.remove('rd-now')); const bar = $('#rdNar', RD.el); if (bar) bar.remove(); RD.el.classList.remove('narr'); }
}
function narrPause(){
  if (!NAR.playing) return narrFrom(NAR.at >= 0 ? NAR.q[NAR.at].p : S.books[RD.b.id].pos);
  NAR.paused = !NAR.paused;
  try {
    if (narrEl && !VOX.native && NAR.q[0] && NAR.q[0].url){ if (NAR.paused) narrEl.pause(); else narrEl.play(); }
    else if (VOX.native) native().postMessage({type:NAR.paused ? 'pauseSpeak' : 'resumeSpeak'});
    else if (NAR.paused) speechSynthesis.pause(); else speechSynthesis.resume();
  } catch(e){}
  narrLabel();
}
function narrSkip(d){
  const cur = NAR.at >= 0 ? NAR.q[NAR.at].p : S.books[RD.b.id].pos;
  narrFrom(cur + d);
}
function narrLabel(){
  if (!RD) return; const bar = $('#rdNar', RD.el); if (!bar) return;
  const p = NAR.at >= 0 && NAR.q[NAR.at] ? NAR.q[NAR.at].p : S.books[RD.b.id].pos, ch = chapterOfPara(RD.b, p);
  $('[data-np]', bar).textContent = !NAR.playing ? '▶️' : NAR.paused ? '▶️' : '⏸️';
  $('[data-nr]', bar).textContent = S.nar.rate + '×';
  $('.nl', bar).textContent = !NAR.playing ? L2('دوسي ▶️ أو دوسي على أي فقرة تبدأ منها', 'Tap ▶️ or any paragraph to start') :
    (NAR.paused ? L2('واقفة · ', 'Paused · ') : (narrUsesAudio() ? L2('سلمى بتقرالك · ', 'Salma is reading · ') : L2('بتقرالك · ', 'Reading · '))) + (ch ? ch[1] : '');
}
function narrBar(){
  if (!RD || !RD.P) return;
  if (NAR.bar) return narrStop();
  NAR.bar = true; RD.el.classList.add('narr');
  RD.el.insertAdjacentHTML('beforeend', '<div class="rd-nar" id="rdNar"><span class="nl"></span><div class="nb">' +
    '<button data-nv aria-label="Voice">🗣️</button><button data-nk="-1" aria-label="Previous paragraph">⏮️</button><button class="big" data-np aria-label="Play or pause">⏸️</button><button data-nk="1" aria-label="Next paragraph">⏭️</button><button data-nr aria-label="Speed">1×</button><button data-nx aria-label="Stop">✕</button></div></div>');
  const bar = $('#rdNar', RD.el);
  $('[data-np]', bar).onclick = narrPause;
  $$('[data-nk]', bar).forEach(b => b.onclick = () => narrSkip(+b.dataset.nk));
  $('[data-nr]', bar).onclick = () => { const i = NAR_RATES.indexOf(S.nar.rate); S.nar.rate = NAR_RATES[(i + 1) % NAR_RATES.length]; save(); if (NAR.playing && NAR.at >= 0) narrFrom(NAR.q[NAR.at].p); else narrLabel(); };
  $('[data-nx]', bar).onclick = narrStop;
  $('[data-nv]', bar).onclick = narrVoiceSheet;
  narrManifest(RD.b).then(() => { if (RD && NAR.bar) narrFrom(S.books[RD.b.id].pos || 0); });
}
function narrVoiceSheet(){
  const nat = VOX.native, list = nat ? VOX.ar : webVoices('ar').map(v => ({id:v.name, name:v.name, lang:v.lang, q:/premium/i.test(v.name) ? 3 : /enhanced|natural|neural/i.test(v.name) ? 2 : 1}));
  sheet('<div style="text-align:center;font-size:38px">🗣️</div><h2 class="plain" style="justify-content:center">' + L2('صوت الراوي', 'Narrator voice') + '</h2>' +
    '<div class="chips" style="justify-content:center"><button class="chip' + (S.nar.engine === 'salma' ? ' on' : '') + '" data-eng="salma">🇪🇬 ' + L2('سلمى (مصري)', 'Salma (Egyptian)') + '</button><button class="chip' + (S.nar.engine !== 'salma' ? ' on' : '') + '" data-eng="tts">📱 ' + L2('صوت الآيفون', 'iPhone voice') + '</button></div>' +
    '<p class="small" style="margin:0;font-weight:800;text-align:center">' + (RD && NAR_AUDIO[RD.b.id] ? L2('✓ صوت سلمى المصري جاهز للكتاب ده (محتاج نت)', '✓ Salma’s Egyptian audio is ready for this book (needs internet)') : L2('⏳ صوت سلمى المصري لسه بيتجهز للكتاب ده، ولحد ما يخلص هيقرا صوت الآيفون.', '⏳ Salma’s audio isn’t ready yet; the iPhone voice reads meanwhile.')) + '</p>' +
    '<label class="field"><span>' + L2('صوت الآيفون', 'iPhone voice') + '</span><select class="in" data-v><option value="">' + L2('أحسن صوت عربي عندك (تلقائي)', 'Best Arabic voice (auto)') + '</option>' +
      list.map(v => '<option value="' + esc(v.id) + '"' + (S.nar.voice === v.id ? ' selected' : '') + '>' + esc(v.name) + ' · ' + esc(v.lang) + ' · ' + QLAB(v.q) + '</option>').join('') + '</select></label>' +
    '<button class="btn soft full" data-t>🔊 ' + L2('جربي الصوت', 'Test the voice') + '</button>' +
    '<div class="frnote"><b>📥 ' + L2('عشان الصوت يبقى أوضح', 'For a clearer voice') + '</b><p>' +
      L2('الإعدادات ‹ تسهيلات الاستخدام ‹ المحتوى المنطوق ‹ الأصوات ‹ العربية ‹ اختاري صوت ونزّلي نسخة «المحسّن Enhanced». بعدين اقفلي التطبيق وافتحيه واختاريه من هنا.', 'Settings › Accessibility › Spoken Content › Voices › Arabic › download an Enhanced voice, then reopen the app and pick it here.') +
      '<br><br>' + L2('ملحوظة: أصوات الآيفون العربي بتنطق فصحى، فهتقرالك الكلام المصري بلهجة فصحى شوية. لسه مفيش صوت مصري جوه الآيفون.', 'Note: iPhone Arabic voices speak Modern Standard Arabic; there is no Egyptian voice built in yet.') +
      (nat ? '' : '<br><br>' + L2('⚠️ الأصوات الواضحة والقراية والشاشة مقفولة بتشتغل جوه التطبيق بعد تحديث Xcode.', '⚠️ Clear voices and reading with the screen locked work in the app after the Xcode update.')) + '</p></div>',
  sh => {
    $$('[data-eng]', sh).forEach(b => b.onclick = () => { S.nar.engine = b.dataset.eng; save(); $$('[data-eng]', sh).forEach(z => z.classList.toggle('on', z === b)); if (NAR.playing && NAR.at >= 0) narrFrom(NAR.q[NAR.at].p); });
    $('[data-v]', sh).onchange = e => { S.nar.voice = e.target.value; save(); if (NAR.playing && NAR.at >= 0) narrFrom(NAR.q[NAR.at].p); };
    $('[data-t]', sh).onclick = () => { if (NAR.playing && !NAR.paused) narrPause(); speakAr('أهلًا يا مونمون، أنا هقرالك الكتاب النهارده.'); };
  });
}
function speakAr(t){
  if (VOX.native){ try { native().postMessage({type:'speak', id:'t' + Date.now(), text:t, lang:'ar-EG', rate:0.5 * S.nar.rate, voice:S.nar.voice || ''}); return; } catch(e){} }
  try { const s = speechSynthesis; s.cancel(); const u = new SpeechSynthesisUtterance(t); const v = narrWebVoice(); u.lang = v ? v.lang : 'ar-SA'; if (v) u.voice = v; u.rate = S.nar.rate; s.speak(u); } catch(e){}
}
