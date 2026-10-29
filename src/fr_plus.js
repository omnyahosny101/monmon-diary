/* ============ FRENCH+: a clear voice, spaced review, speaking practice and a listening drill ============
   In the iPhone app the voice comes from the phone itself (AVSpeechSynthesizer), which can use the
   Enhanced and Premium French voices downloaded in Settings. Safari's web voices can't, so they stay a fallback.
   S.frv = {speed, voice}; S.fr.srs = {fr:{b, due}}; S.fr.rev / sh / drill = {date:count} */
const VOX = {native:false, listen:false, voices:[], ar:[]};
window.__capsIn = c => { VOX.native = !!(c && c.speak); VOX.audio = !!(c && c.audio); VOX.queue = !!(c && c.queue); VOX.listen = !!(c && c.listen); VOX.voices = (c && c.voices) || []; VOX.ar = (c && c.ar) || [];
  if (nav.tab === 'grow' && nav.sub.grow === 'fr' && !$('.sheet') && !RD) render(); };
(function(){ const n = native(); if (n) try { n.postMessage({type:'caps'}); } catch(e){} })();
function frPlusMigrate(){
  S.frv = Object.assign({speed:0.9, voice:''}, S.frv || {});
  ['srs', 'rev', 'sh', 'drill', 'newc'].forEach(k => { S.fr[k] = S.fr[k] && typeof S.fr[k] === 'object' ? S.fr[k] : {}; });
}

/* ---------- speaking ---------- */
let spkN = 0; const spkWait = {};
window.__spoke = id => { const f = spkWait[id]; if (f){ delete spkWait[id]; f(); } };
function webVoices(prefix){ try { return speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(prefix)); } catch(e){ return []; } }
function bestWebVoice(lang){
  const pre = lang.slice(0, 2).toLowerCase(), vs = webVoices(pre); if (!vs.length) return null;
  if (pre === 'fr' && S.frv && S.frv.voice){ const m = vs.find(v => v.name === S.frv.voice || v.voiceURI === S.frv.voice); if (m) return m; }
  const score = v => (/premium/i.test(v.name) ? 50 : 0) + (/enhanced|amélioré|natural|neural/i.test(v.name) ? 40 : 0) + (/google/i.test(v.name) ? 30 : 0) +
    (/am[ée]lie|thomas|audrey|aur[ée]lie|marie|daniel/i.test(v.name) ? 10 : 0) + (v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase() ? 5 : 0) + (v.localService ? 1 : 0);
  return vs.slice().sort((a, b) => score(b) - score(a))[0];
}
function speak(text, lang, rate){
  text = String(text || '').trim(); rate = rate || 1;
  return new Promise(res => {
    if (!text) return res();
    const id = 's' + (++spkN);
    const tmo = setTimeout(() => window.__spoke(id), 2500 + text.length * 160 / rate);
    spkWait[id] = () => { clearTimeout(tmo); res(); };
    if (VOX.native){ try { native().postMessage({type:'speak', id, text, lang, rate:0.5 * rate, voice:lang.startsWith('fr') ? (S.frv.voice || '') : ''}); return; } catch(e){} }
    try {
      const s = window.speechSynthesis; if (!s){ toast(L2('الصوت مش متاح هنا', 'Sound isn’t available here')); return window.__spoke(id); }
      s.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate;
      const v = bestWebVoice(lang); if (v) u.voice = v;
      u.onend = u.onerror = () => window.__spoke(id); s.speak(u);
    } catch(e){ window.__spoke(id); }
  });
}
function stopSpeak(){ Object.keys(spkWait).forEach(k => window.__spoke(k)); try { if (VOX.native) native().postMessage({type:'stopSpeak'}); else if (window.speechSynthesis) speechSynthesis.cancel(); } catch(e){} }
let lastSay = {t:'', at:0};
function frSpeed(slow){ return (S.frv ? S.frv.speed : 0.9) * (slow ? 0.6 : 1); }
// tap 🔊 once: normal speed; tap the same word again within 3 seconds: slow
function sayFr(text, slow){
  const t = frClean(text), again = lastSay.t === t && Date.now() - lastSay.at < 3000;
  lastSay = {t, at:Date.now()};
  return speak(t, 'fr-FR', frSpeed(slow || again));
}
const arClean = t => String(t).replace(/\([^)]*\)/g, '').replace(/ \/ /g, '، ').replace(/[…]/g, '').trim();
function hasArVoice(){ return VOX.native ? VOX.ar.length > 0 : webVoices('ar').length > 0; }

/* ---------- listening to her (speaking practice) ---------- */
let heardCb = null, webRec = null, webMedia = null, webBlobUrl = '';
window.__heard = m => { if (heardCb) heardCb(m || {}); };
function canCheckSpeech(){ return VOX.listen || !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
function canRecord(){ return VOX.listen || !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder); }
function startListen(cb){
  let gotFinal = false; heardCb = m => { if (m.final) gotFinal = true; cb(m); }; stopSpeak();
  if (VOX.listen){ native().postMessage({type:'listen', lang:'fr-FR'}); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (navigator.mediaDevices && window.MediaRecorder){
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream => {
      const chunks = []; webMedia = new MediaRecorder(stream);
      webMedia.ondataavailable = e => chunks.push(e.data);
      webMedia.onstop = () => { stream.getTracks().forEach(t => t.stop()); if (webBlobUrl) URL.revokeObjectURL(webBlobUrl); webBlobUrl = URL.createObjectURL(new Blob(chunks, {type:webMedia.mimeType || 'audio/mp4'})); setTimeout(() => { if (!gotFinal) window.__heard({text:'', final:true, recOnly:true}); }, SR ? 900 : 0); };
      webMedia.start(); window.__heard({started:true});
      setTimeout(() => { if (webMedia && webMedia.state === 'recording') stopListen(); }, 7000);
    }).catch(() => window.__heard({err:'mic'}));
  }
  if (SR){
    try { webRec = new SR(); webRec.lang = 'fr-FR'; webRec.interimResults = true; webRec.maxAlternatives = 1;
      webRec.onresult = e => { const r = e.results[e.results.length - 1]; window.__heard({text:Array.from(e.results).map(x => x[0].transcript).join(' '), final:r.isFinal}); };
      webRec.onerror = () => { if (!window.MediaRecorder) window.__heard({err:'unavailable'}); }; webRec.onend = () => { if (webMedia && webMedia.state === 'recording') webMedia.stop(); };
      webRec.start(); if (!window.MediaRecorder) window.__heard({started:true}); } catch(e){ window.__heard({err:'unavailable'}); }
  }
}
function stopListen(){
  if (VOX.listen){ try { native().postMessage({type:'stopListen'}); } catch(e){} return; }
  try { if (webRec) webRec.stop(); } catch(e){}
  try { if (webMedia && webMedia.state === 'recording') webMedia.stop(); } catch(e){}
}
function playMine(){
  if (VOX.listen){ native().postMessage({type:'playMine'}); return; }
  if (webBlobUrl){ const a = new Audio(webBlobUrl); a.play().catch(() => {}); }
}
const frNorm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’'`]/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
function speechScore(target, heard){
  const tw = frNorm(frClean(target)).split(' ').filter(Boolean), hw = frNorm(heard).split(' ').filter(Boolean), pool = hw.slice();
  const marks = tw.map(w => { const i = pool.indexOf(w); if (i >= 0){ pool.splice(i, 1); return true; } return false; });
  return {pct:tw.length ? Math.round(marks.filter(Boolean).length / tw.length * 100) : 0, marks, words:frClean(target).split(/\s+/)};
}

/* ---------- spaced repetition (Leitner boxes) ---------- */
const SRS_INT = [1, 2, 4, 7, 15, 30, 60];
function frLearnedN(){ const done = Object.keys(S.fr.done).map(Number); return Math.min(FR.length, Math.max(0, ...done, todayStr() >= FR_START ? frToday() - 1 : 0)); }
function frCards(){ const out = []; FR.slice(0, frLearnedN()).forEach((L, li) => { L.w.forEach(w => out.push({fr:w[0], ar:w[1], pr:w[2] || '', n:li + 1})); L.p.forEach(p => out.push({fr:p[0], ar:p[1], pr:'', n:li + 1})); }); return out; }
function frDue(){
  const t = todayStr(), cards = frCards(), due = cards.filter(c => S.fr.srs[c.fr] && S.fr.srs[c.fr].due <= t);
  const newLeft = Math.max(0, 15 - (S.fr.newc[t] || 0)), fresh = cards.filter(c => !S.fr.srs[c.fr]).slice(0, newLeft);
  return {due, fresh, all:due.concat(fresh)};
}
function srsReview(done){
  const {due, fresh} = frDue(), shuffle = a => a.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  let q = shuffle(due).slice(0, 25).concat(fresh.slice(0, Math.max(0, 25 - due.length)));
  if (!q.length) return toast(L2(frLearnedN() ? 'مفيش مراجعة النهارده. برافو! 🎉' : 'خلّصي أول درس الأول وبعدين المراجعة تبدأ', frLearnedN() ? 'Nothing to review today 🎉' : 'Finish lesson 1 first'));
  q = q.map((c, i) => Object.assign({}, c, {mode:i % 2 ? 'listen' : 'recall'}));
  let i = 0, ok = 0; const again = new Set(), t = todayStr();
  const show = sh => {
    const box = $('[data-sbox]', sh), c = q[i];
    if (!c){ S.fr.rev[t] = (S.fr.rev[t] || 0) + ok; save();
      box.innerHTML = '<div style="text-align:center;font-size:46px">🎉</div><div class="greet" style="text-align:center">' + L2('خلصتي المراجعة!', 'Review done!') + '</div><p style="text-align:center;margin:0;font-weight:700">' + L2(ok + ' كلمة افتكرتيها. الكلمات اللي نسيتيها هترجعلك بكرة.', ok + ' remembered. The ones you missed come back tomorrow.') + '</p>'; return; }
    const isNew = !S.fr.srs[c.fr];
    box.innerHTML = '<span class="small muted" style="font-weight:900">' + (i + 1) + ' / ' + q.length + (isNew ? L2(' · كلمة جديدة', ' · new') : '') + ' · ' + L2('درس ', 'L') + c.n + '</span>' +
      (c.mode === 'recall' ? '<div class="srs-front" data-notr>' + esc(c.ar) + '</div><p class="small muted" style="margin:0;text-align:center;font-weight:800">' + L2('قوليها بالفرنساوي بصوت عالي، وبعدين اكشفي', 'Say it in French out loud, then reveal') + '</p>'
        : '<button class="btn soft" data-again>🔊 ' + L2('اسمعي تاني', 'Listen again') + '</button><p class="small muted" style="margin:0;text-align:center;font-weight:800">' + L2('معناها إيه؟ فكّري وبعدين اكشفي', 'What does it mean? Then reveal') + '</p>') +
      '<div class="srs-back" hidden><div class="frbig" lang="fr" dir="ltr" data-notr>' + esc(c.fr) + '</div><div class="small" style="text-align:center;font-weight:800" data-notr>' + esc(c.ar) + (c.pr ? ' · <span class="pr">' + esc(c.pr) + '</span>' : '') + '</div></div>' +
      '<button class="btn full" data-reveal>👀 ' + L2('اكشفي', 'Reveal') + '</button>' +
      '<div class="row srs-rate" hidden><button class="btn soft" data-r="0" style="flex:1">😕 ' + L2('نسيتها', 'Forgot') + '</button><button class="btn soft" data-r="1" style="flex:1">🙂 ' + L2('افتكرتها', 'Got it') + '</button><button class="btn soft" data-r="2" style="flex:1">😎 ' + L2('سهلة', 'Easy') + '</button></div>';
    if (c.mode === 'listen') setTimeout(() => sayFr(c.fr), 250);
    const ag = $('[data-again]', box); if (ag) ag.onclick = () => sayFr(c.fr);
    $('[data-reveal]', box).onclick = () => { $('.srs-back', box).hidden = false; $('.srs-rate', box).hidden = false; $('[data-reveal]', box).remove(); if (c.mode === 'recall') sayFr(c.fr); };
    $$('[data-r]', box).forEach(b => b.onclick = () => { const r = +b.dataset.r, cur = S.fr.srs[c.fr] || {b:-1};
      if (isNew) S.fr.newc[t] = (S.fr.newc[t] || 0) + 1;
      if (r === 0){ S.fr.srs[c.fr] = {b:0, due:addDays(t, 1)}; if (!again.has(c.fr)){ again.add(c.fr); q.push(Object.assign({}, c, {mode:'recall'})); } }
      else { const nb = Math.min(SRS_INT.length - 1, Math.max(0, cur.b) + r); S.fr.srs[c.fr] = {b:nb, due:addDays(t, SRS_INT[nb])}; ok++; }
      save(); i++; show(sh); });
  };
  sheet('<div style="text-align:center;font-size:34px">🔁</div><h2 class="plain" style="justify-content:center">' + L2('مراجعة الكلمات', 'Word review') + '</h2><div data-sbox style="display:flex;flex-direction:column;gap:12px"></div>',
    (sh, close) => { show(sh); $('[data-close]', sh).addEventListener('click', () => { stopSpeak(); done && done(); }); });
}

/* ---------- speaking practice: listen, repeat, check, hear yourself ---------- */
function speakSheet(n, done){
  const L = FR[n - 1], items = L.p.map(p => ({fr:p[0], ar:p[1], pr:''})).concat(L.w.map(w => ({fr:w[0], ar:w[1], pr:w[2] || ''})));
  let i = 0, said = 0; const t = todayStr();
  const show = sh => {
    const box = $('[data-kbox]', sh), it = items[i];
    box.innerHTML = '<span class="small muted" style="font-weight:900">' + (i + 1) + ' / ' + items.length + '</span>' +
      '<div class="frbig" lang="fr" dir="ltr" data-notr>' + esc(it.fr) + '</div><div class="small" style="text-align:center;font-weight:800" data-notr>' + esc(it.ar) + (it.pr ? ' · <span class="pr">' + esc(it.pr) + '</span>' : '') + '</div>' +
      '<div class="row"><button class="btn soft" data-pl="0" style="flex:1">🔊 ' + L2('عادي', 'Normal') + '</button><button class="btn soft" data-pl="1" style="flex:1">🐢 ' + L2('بالراحة', 'Slow') + '</button></div>' +
      (canRecord() ? '<button class="btn full mic" data-mic>🎙️ ' + L2('دورك: قوليها', 'Your turn: say it') + '</button>' : '<p class="small muted" style="margin:0;font-weight:700;text-align:center">' + L2('كرري ورا الصوت بصوت عالي 3 مرات، بنفس الإيقاع.', 'Repeat after the voice three times, same rhythm.') + '</p>') +
      '<div class="kres" data-res></div>' +
      '<div class="row"><button class="btn soft" data-k="-1" style="flex:1"' + (i ? '' : ' disabled') + '>‹ ' + L2('اللي قبلها', 'Back') + '</button><button class="btn" data-k="1" style="flex:1">' + (i < items.length - 1 ? L2('اللي بعدها', 'Next') + ' ›' : L2('خلصت ✓', 'Done ✓')) + '</button></div>';
    $$('[data-pl]', box).forEach(b => b.onclick = () => speak(frClean(it.fr), 'fr-FR', frSpeed(b.dataset.pl === '1')));
    setTimeout(() => speak(frClean(it.fr), 'fr-FR', frSpeed(false)), 250);
    const mic = $('[data-mic]', box), res = $('[data-res]', box);
    if (mic) mic.onclick = () => {
      if (mic.classList.contains('on')){ stopListen(); return; }
      mic.classList.add('on'); mic.textContent = '⏹️ ' + L2('بسمعك… دوسي لما تخلصي', 'Listening… tap when done');
      res.innerHTML = '';
      startListen(m => {
        if (m.err){ mic.classList.remove('on'); mic.textContent = '🎙️ ' + L2('جربي تاني', 'Try again'); res.innerHTML = '<p class="small" style="margin:0;font-weight:800;color:var(--danger)">' + (m.err === 'mic' || m.err === 'speech' ? L2('محتاجة إذن المايك والتعرّف على الكلام: الإعدادات › Monmon’s Life › فعّلي المايكروفون والتعرف على الكلام.', 'Allow the microphone and speech recognition in Settings › Monmon’s Life.') : L2('التعرف على الكلام مش متاح دلوقتي. كرري ورا الصوت بصوت عالي.', 'Speech check isn’t available right now.')) + '</p>'; return; }
        if (m.started) return;
        if (m.text != null && !m.recOnly){ const sc = speechScore(it.fr, m.text);
          res.innerHTML = '<div class="kwords" lang="fr" dir="ltr" data-notr>' + sc.words.map((w, k) => '<span class="' + (sc.marks[k] ? 'ok' : 'no') + '">' + esc(w) + '</span>').join(' ') + '</div>' +
            '<span class="small muted" dir="ltr" data-notr style="font-weight:700">' + L2('اللي سمعته: ', 'I heard: ') + esc(m.text || '…') + '</span>'; }
        if (m.final){ mic.classList.remove('on'); mic.textContent = '🎙️ ' + L2('قوليها تاني', 'Say it again'); said++;
          S.fr.sh[t] = (S.fr.sh[t] || 0) + 1; save();
          const sc = speechScore(it.fr, m.text || '');
          res.insertAdjacentHTML('beforeend', (m.recOnly ? '' : '<div class="kscore ' + (sc.pct >= 80 ? 'hi' : sc.pct >= 50 ? 'mid' : 'lo') + '">' + sc.pct + '% · ' + (sc.pct >= 80 ? 'Parfait ! 🎉' : sc.pct >= 50 ? L2('قربتي! اسمعي تاني وكرري', 'Close! Listen and repeat') : L2('اسمعيها بالراحة وجربي تاني', 'Listen slowly and try again')) + '</div>') +
            '<button class="btn soft full" data-mine>▶️ ' + L2('اسمعي صوتك', 'Hear yourself') + '</button>');
          const mb = $('[data-mine]', res); if (mb) mb.onclick = playMine;
        }
      });
    };
    $$('[data-k]', box).forEach(b => b.onclick = () => { stopListen(); const d = +b.dataset.k; if (d > 0 && i === items.length - 1){ toast('Bravo ! 🎙️'); $('[data-close]', sh).click(); return; } i = Math.max(0, i + d); show(sh); });
  };
  sheet('<div style="text-align:center;font-size:34px">🎙️</div><h2 class="plain" style="justify-content:center">' + L2('اتكلمي: درس ', 'Speak: lesson ') + n + '</h2><p class="small muted" style="margin:0;text-align:center;font-weight:700">' + L2('اسمعي ← كرري بنفس الإيقاع ← اسمعي صوتك وقارني', 'Listen → repeat with the same rhythm → compare') + '</p><div data-kbox style="display:flex;flex-direction:column;gap:12px"></div>',
    (sh, close) => { show(sh); $('[data-close]', sh).addEventListener('click', () => { stopListen(); stopSpeak(); heardCb = null; done && done(); }); });
}

/* ---------- listening drill: hear the meaning, answer out loud, then hear the French ---------- */
function drillSheet(n, done){
  const L = FR[n - 1], items = L.w.map(w => ({fr:w[0], ar:w[1]})).concat(L.p.map(p => ({fr:p[0], ar:p[1]})));
  let i = 0, run = 0, paused = false; const t = todayStr();
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const loop = async (sh, token) => {
    const box = $('[data-dbox]', sh);
    while (i < items.length){
      if (token !== run || !document.body.contains(sh)) return;
      if (paused){ await wait(300); continue; }
      const it = items[i];
      box.innerHTML = '<span class="small muted" style="font-weight:900">' + (i + 1) + ' / ' + items.length + '</span><div class="srs-front" data-notr>' + esc(arClean(it.ar)) + '</div><div class="dstep">' + L2('🗣️ قوليها انتي بالفرنساوي…', '🗣️ Say it in French…') + '</div>';
      if (hasArVoice()) await speak(arClean(it.ar), 'ar-SA', 1); else await wait(600);
      if (token !== run) return;
      await wait(Math.min(6000, 2600 + frClean(it.fr).length * 60));
      if (token !== run) return;
      box.innerHTML = '<span class="small muted" style="font-weight:900">' + (i + 1) + ' / ' + items.length + '</span><div class="srs-front" data-notr>' + esc(arClean(it.ar)) + '</div><div class="frbig" lang="fr" dir="ltr" data-notr>' + esc(it.fr) + '</div><div class="dstep ok">' + L2('👂 اسمعي وكرري', '👂 Listen and repeat') + '</div>';
      await speak(frClean(it.fr), 'fr-FR', frSpeed(false)); if (token !== run) return;
      await wait(1800); if (token !== run) return;
      await speak(frClean(it.fr), 'fr-FR', frSpeed(false)); if (token !== run) return;
      await wait(1500);
      i++;
    }
    if (token !== run) return;
    S.fr.drill[t] = (S.fr.drill[t] || 0) + 1; save();
    box.innerHTML = '<div style="text-align:center;font-size:46px">🎧</div><div class="greet" style="text-align:center">Très bien !</div><p style="text-align:center;margin:0;font-weight:700">' + L2('خلصتي تمرين الودان. اعمليه تاني وانتي ماشية أو في الجيم.', 'Drill done. Do it again on a walk or at the gym.') + '</p>';
  };
  sheet('<div style="text-align:center;font-size:34px">🎧</div><h2 class="plain" style="justify-content:center">' + L2('تمرين الودان: درس ', 'Listening drill: lesson ') + n + '</h2><p class="small muted" style="margin:0;text-align:center;font-weight:700">' + L2('هسمّعك المعنى بالعربي، تقوليه انتي بالفرنساوي قبل ما تسمعيه، وبعدين تسمعي الصح مرتين. ينفع من غير ما تبصي على الشاشة.', 'Hear the meaning, say the French before you hear it, then hear it twice. Works eyes-free.') + '</p>' +
    '<div data-dbox style="display:flex;flex-direction:column;gap:12px;min-height:150px"></div><div class="row"><button class="btn soft" data-dp style="flex:1">⏸️ ' + L2('وقفي', 'Pause') + '</button><button class="btn soft" data-dn style="flex:1">⏭️ ' + L2('اللي بعدها', 'Skip') + '</button></div>',
    (sh, close) => {
      const start = () => { run++; loop(sh, run); };
      $('[data-dp]', sh).onclick = e => { paused = !paused; e.currentTarget.textContent = paused ? '▶️ ' + L2('كمّلي', 'Resume') : '⏸️ ' + L2('وقفي', 'Pause'); if (paused) stopSpeak(); else start(); };
      $('[data-dn]', sh).onclick = () => { stopSpeak(); i = Math.min(items.length, i + 1); paused = false; start(); };
      $('[data-close]', sh).addEventListener('click', () => { run++; stopSpeak(); done && done(); });
      start();
    });
}

/* ---------- the voice settings ---------- */
const QLAB = q => q >= 3 ? '⭐ Premium' : q === 2 ? '✨ ' + L2('محسّن', 'Enhanced') : L2('عادي', 'Basic');
function voiceCardHTML(){
  const nat = VOX.native, list = nat ? VOX.voices : webVoices('fr').map(v => ({id:v.name, name:v.name, lang:v.lang, q:/premium/i.test(v.name) ? 3 : /enhanced|amélioré/i.test(v.name) ? 2 : 1}));
  const good = list.some(v => v.q >= 2);
  return '<details class="card frx"' + (good ? '' : ' open') + '><summary><h2>🔊 ' + L2('صوت النطق', 'Pronunciation voice') + '</h2><span class="pill">' + (good ? L2('صوت واضح ✓', 'Clear voice ✓') : L2('حسّنيه', 'Improve it')) + '</span></summary>' +
    '<label class="field"><span>' + L2('الصوت', 'Voice') + '</span><select class="in" id="frVoice"><option value="">' + L2('أحسن صوت عندك (تلقائي)', 'Best available (auto)') + '</option>' +
      list.map(v => '<option value="' + esc(v.id) + '"' + (S.frv.voice === v.id ? ' selected' : '') + '>' + esc(v.name) + ' · ' + esc(v.lang) + ' · ' + QLAB(v.q) + '</option>').join('') + '</select></label>' +
    '<label class="field"><span>' + L2('السرعة', 'Speed') + ' <b id="frSpv">' + Math.round(S.frv.speed * 100) + '%</b></span><input type="range" id="frSpeed" min="0.5" max="1.2" step="0.05" value="' + S.frv.speed + '"></label>' +
    '<button class="btn soft full" id="frTest">🔊 ' + L2('جربي: «Bonjour Monmon, comment ça va ?»', 'Test the voice') + '</button>' +
    '<p class="small muted" style="margin:0;font-weight:700">' + L2('💡 دوسي 🔊 مرتين ورا بعض تسمعي الكلمة أبطأ.', '💡 Tap 🔊 twice to hear it slower.') + '</p>' +
    (good ? '' : '<div class="frnote"><b>📥 ' + L2('نزّلي صوت فرنساوي واضح (مرة واحدة، ببلاش)', 'Download a clear French voice (free, once)') + '</b><p>' +
      L2('في الآيفون: الإعدادات ‹ تسهيلات الاستخدام ‹ المحتوى المنطوق ‹ الأصوات ‹ الفرنسية (French) ‹ اختاري Audrey أو Thomas أو Amélie واختاري النسخة «المحسّن Enhanced» أو «Premium» ودوسي تنزيل. بعدين اقفلي التطبيق وافتحيه تاني واختاري الصوت من هنا.',
        'iPhone Settings › Accessibility › Spoken Content › Voices › French › pick Audrey, Thomas or Amélie (Enhanced or Premium) and download. Then reopen the app and pick it here.') +
      (nat ? '' : '<br><br>' + L2('⚠️ الأصوات الواضحة دي بتشتغل جوه التطبيق بعد ما تنزّلي التحديث من Xcode مرة واحدة (زي آخر مرة). في Safari بيشتغل الصوت العادي بس.', '⚠️ These clear voices work inside the app after installing this update once from Xcode. Safari only has the basic voice.')) + '</p></div>') +
    '</details>';
}
function bindVoiceCard(el, again){
  const v = $('#frVoice', el); if (!v) return;
  v.onchange = () => { S.frv.voice = v.value; save(); sayFr('Bonjour Monmon !'); };
  const sp = $('#frSpeed', el); sp.oninput = () => { S.frv.speed = +sp.value; $('#frSpv', el).textContent = Math.round(S.frv.speed * 100) + '%'; }; sp.onchange = () => { save(); sayFr('Je parle un peu français.'); };
  $('#frTest', el).onclick = () => speak('Bonjour Monmon, comment ça va ?', 'fr-FR', frSpeed(false));
}

/* ---------- the method: what works, from the research ---------- */
const FR_METHODS = [
  ['🔁', 'التكرار المتباعد', 'بتراجعي الكلمة قبل ما تنسيها بالظبط: بعد يوم، يومين، 4، أسبوع، أسبوعين، شهر. أبحاث «منحنى النسيان» من أيام إبنجهاوس وكل الدراسات بعدها بتقول إن المراجعة المتوزعة بتثبّت أكتر بكتير من الحفظ مرة واحدة.', 'مراجعة الكلمات كل يوم: التطبيق بيختارلك اللي جه ميعادها.'],
  ['🧠', 'الاسترجاع النشط', 'ماتقريش الإجابة على طول. حاولي تطلّعي الكلمة من دماغك الأول حتى لو غلطتي. «محاولة الافتكار» نفسها هي اللي بتثبّت الذاكرة (testing effect).', 'في المراجعة بتشوفي المعنى، تقوليها انتي، وبعدين تكشفي.'],
  ['🎙️', 'الشادوينج (التظليل)', 'تسمعي جملة وتكرريها ورا المتكلم بنفس السرعة والنغمة. مراجعة منهجية لـ44 دراسة (أكسفورد 2024) لقت إنه بيحسّن الوضوح والطلاقة والنغمة.', '«اتكلمي»: اسمعي، كرري، التطبيق يسمعك ويقولك نطقتي كام كلمة صح، وتسمعي صوتك.'],
  ['👂', 'مدخلات مفهومة', 'كراشن: بتتعلمي لما تسمعي وتقري حاجات فاهمة أغلبها (حوالي 90-95%) وفيها شوية جديد. اسمعي كتير قبل ما تقلقي من القواعد.', '«تمرين الودان» + بعد درس 15 جربي كرتون أو بودكاست فرنساوي للمبتدئين (زي «Coffee Break French» أو «InnerFrench») بسرعة بطيئة.'],
  ['🗣️', 'اتكلمي من أول يوم', 'سوين لقت إن الطلبة اللي بيسمعوا بس بيفهموا كويس بس بيتلخبطوا في الكلام. لما تتكلمي بتكتشفي اللي ناقصك.', 'كل يوم قولي 3 جمل عن يومك انتي بالفرنساوي بصوت عالي.'],
  ['🧩', 'احفظي جُمل مش كلمات', 'الجملة الجاهزة (chunk) زي «Je voudrais un café» بتطلع لوحدها وقت الكلام، والكلمة لوحدها لأ.', 'كل درس فيه جُمل كاملة، والمراجعة فيها الجمل كمان.'],
  ['🔀', 'الخلط (Interleaving)', 'لما تخلطي دروس قديمة وجديدة في المراجعة، دماغك بيتعلم يفرّق ويستخدم صح.', 'المراجعة بتجيبلك من كل الدروس اللي فاتت مع بعض.'],
  ['⏱️', 'شوية كل يوم', '20 دقيقة كل يوم أحسن من 3 ساعات مرة في الأسبوع. الاستمرار هو السر.', 'خطة النهارده فوق: 20 دقيقة بالظبط.'],
  ['❤️', 'اربطيها بحياتك', 'الكلمة اللي تخصك بتتحفظ أسرع: قولي جمل عن الفرح، الشغل، الجيم، والأكل بتاعك.', 'وانتي بتراجعي، اعملي جملة عنك انتي بكل كلمة جديدة.'],
];
function methodsCardHTML(){
  return '<details class="card frx"><summary><h2>🧠 ' + L2('إزاي تتعلمي لغة صح (الطرق اللي العلم بيقول إنها بتشتغل)', 'How to learn a language (what research says works)') + '</h2></summary>' +
    '<div class="list">' + FR_METHODS.map(m => '<div class="meth"><span class="e">' + m[0] + '</span><span class="t" data-notr><b>' + m[1] + '</b><span>' + m[2] + '</span><span class="how">✅ ' + m[3] + '</span></span></div>').join('') + '</div></details>';
}

/* ---------- today’s plan on the French page ---------- */
function frPlanHTML(n){
  const t = todayStr(), {all} = frDue(), revDone = (S.fr.rev[t] || 0) > 0 && !all.length;
  const step = (ok, e, title, sub, btn) => '<div class="fstep' + (ok ? ' ok' : '') + '"><span class="ck">' + (ok ? '✓' : e) + '</span><span class="t"><b>' + title + '</b><span class="s">' + sub + '</span></span>' + btn + '</div>';
  return '<div class="card frplan"><div class="card-head"><h2>' + L2('خطة النهارده · 20 دقيقة', 'Today’s plan · 20 min') + '</h2></div>' +
    step(revDone || (!all.length && frLearnedN() > 0), '🔁', L2('مراجعة الكلمات', 'Review words'), all.length ? L2(all.length + ' كلمة مستنياكي · 5 دقايق', all.length + ' waiting · 5 min') : frLearnedN() ? L2('مفيش حاجة النهارده', 'All clear') : L2('بتبدأ بعد أول درس', 'Starts after lesson 1'), all.length ? '<button class="btn sm" data-srs>' + L2('يلا', 'Go') + '</button>' : '') +
    step(!!S.fr.done[n], '📘', L2('درس ', 'Lesson ') + n, L2('الكلمات والجُمل والقاعدة · 7 دقايق', 'Words, phrases, tip · 7 min'), '<button class="btn sm soft" data-tolesson>' + L2('افتحي', 'Open') + '</button>') +
    step((S.fr.sh[t] || 0) >= 5, '🎙️', L2('اتكلمي', 'Speak'), L2('كرري جُمل الدرس ورا الصوت · 5 دقايق', 'Shadow the phrases · 5 min'), '<button class="btn sm" data-speak="' + n + '">' + L2('يلا', 'Go') + '</button>') +
    step((S.fr.drill[t] || 0) > 0, '🎧', L2('تمرين الودان', 'Listening drill'), L2('من غير ما تبصي · 3 دقايق', 'Eyes-free · 3 min'), '<button class="btn sm" data-drill="' + n + '">' + L2('يلا', 'Go') + '</button>') +
    step(S.fr.best[n] != null, '📝', L2('الكويز', 'Quiz'), S.fr.best[n] != null ? S.fr.best[n] + '/5' : L2('5 أسئلة', '5 questions'), '<button class="btn sm soft" data-frquiz="' + n + '">' + L2('يلا', 'Go') + '</button>') + '</div>';
}
const _frView = VIEWS['grow.fr'];
VIEWS['grow.fr'] = function(el){
  _frView(el);
  const sel = ui.frLesson || frToday(), again = () => VIEWS['grow.fr'](el);
  const hero = $('.frhero', el); if (hero) hero.insertAdjacentHTML('afterend', frPlanHTML(sel));
  el.insertAdjacentHTML('beforeend', voiceCardHTML() + methodsCardHTML());
  const fc = $('.frcard', el); if (fc && !$('.frcard .askb.big', el)) fc.insertAdjacentHTML('beforeend', '<div class="row">' + askBtn('fr', L2('فرنساوي · درس ', 'French · lesson ') + sel, FR[sel - 1].t + '\n' + FR[sel - 1].n, false) + '</div>');
  $$('[data-srs]', el).forEach(b => b.onclick = () => srsReview(again));
  $$('[data-speak]', el).forEach(b => b.onclick = () => speakSheet(+b.dataset.speak, again));
  $$('[data-drill]', el).forEach(b => b.onclick = () => drillSheet(+b.dataset.drill, again));
  $$('.frplan [data-frquiz]', el).forEach(b => b.onclick = () => frQuiz(+b.dataset.frquiz, false, again));
  const tl = $('[data-tolesson]', el); if (tl) tl.onclick = () => { const c = $('.frcard', el); if (c) c.scrollIntoView({behavior:'smooth', block:'start'}); };
  bindVoiceCard(el, again);
};
function frHomeExtra(el, again){
  const c = $('.frhome', el); if (!c || $('.frx-row', c)) return;
  const n = frToday(), {all} = frDue();
  c.insertAdjacentHTML('beforeend', '<div class="row frx-row">' + (all.length ? '<button class="btn soft" data-srs style="flex:1">🔁 ' + L2('مراجعة ', 'Review ') + all.length + '</button>' : '') +
    '<button class="btn soft" data-speak="' + n + '" style="flex:1">🎙️ ' + L2('اتكلمي', 'Speak') + '</button><button class="btn soft" data-drill="' + n + '" style="flex:1">🎧 ' + L2('ودان', 'Drill') + '</button></div>');
  $$('[data-srs]', c).forEach(b => b.onclick = () => srsReview(again));
  $$('[data-speak]', c).forEach(b => b.onclick = () => speakSheet(+b.dataset.speak, again));
  $$('[data-drill]', c).forEach(b => b.onclick = () => drillSheet(+b.dataset.drill, again));
}
