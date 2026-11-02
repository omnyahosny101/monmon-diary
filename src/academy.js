/* ============ ACADEMY: a small online-learning platform inside the app ============
   S.acad = {start, cur, done:{'cid-i':date}, best:{'cid-i':pct}, tasks:{'cid-i':{k:true}}, notes:{'cid-i':text},
             srs:{'cid-i-k':{b,due}}, mins:{date:n}, lmins:{'cid-i':n}, remind:'22:00', on:true, final:{cid:{pct,date,pass}},
             timer:{cid,i,start,acc}|null, badges:{id:date}} */
function academyMigrate(){
  const A = S.acad = S.acad && typeof S.acad === 'object' ? S.acad : {};
  A.start = A.start || '2026-11-03'; A.cur = A.cur || 'meta30';
  ['done', 'best', 'tasks', 'notes', 'srs', 'mins', 'lmins', 'final', 'badges'].forEach(k => { A[k] = A[k] && typeof A[k] === 'object' ? A[k] : {}; });
  if (A.remind == null) A.remind = '22:00';
  if (A.on == null) A.on = true;
  if (A.timer === undefined) A.timer = null;
  S.askq = S.askq || [];
}
ASK_SRC.course = ['🎯', 'الأكاديمية', 'Academy'];

const acCourse = id => ACAD.find(c => c.id === id) || ACAD[0];
const acKey = (cid, i) => cid + '-' + i;
const acDone = (cid, i) => !!S.acad.done[acKey(cid, i)];
const acDoneN = c => c.days.filter((d, i) => acDone(c.id, i)).length;
const acDated = c => c.id === 'meta30';                       // the 30-day course follows the calendar; the book course is self-paced
function acTodayIdx(c){                                        // 0-based lesson for today in a dated course
  if (!acDated(c)) { const i = c.days.findIndex((d, k) => !acDone(c.id, k)); return i < 0 ? c.days.length - 1 : i; }
  const n = Math.round((parseD(todayStr()) - parseD(S.acad.start)) / 864e5);
  return Math.max(0, Math.min(c.days.length - 1, n));
}
function acNextIdx(c){ const i = c.days.findIndex((d, k) => !acDone(c.id, k)); return i < 0 ? -1 : i; }
function acOpen(c, i){                                         // can she open lesson i?
  if (!acDated(c)) return true;
  return i <= acTodayIdx(c) || i === 0 || acDone(c.id, i - 1); // today's and earlier, or the one right after her last finished lesson
}
const acDateOf = (c, i) => addDays(S.acad.start, i);
function acAvg(c){ const v = c.days.map((d, i) => S.acad.best[acKey(c.id, i)]).filter(x => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; }
const acMinsTotal = () => Object.values(S.acad.mins).reduce((a, b) => a + b, 0);
function acStreak(){                                           // days in a row with 20+ minutes or a finished lesson
  const studied = new Set(Object.values(S.acad.done)); Object.entries(S.acad.mins).forEach(([d, m]) => { if (m >= 20) studied.add(d); });
  let n = 0, d = todayStr(); if (!studied.has(d)) d = addDays(d, -1);
  while (studied.has(d) && n < 400){ n++; d = addDays(d, -1); }
  return n;
}
const acHrs = m => m >= 60 ? (Math.floor(m / 60) + ' س' + (m % 60 ? ' ' + (m % 60) + ' د' : '')) : m + ' د';
const acShuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);

/* ---------- flashcards with spaced repetition ---------- */
function acCards(){                                            // every card from finished lessons
  const out = [];
  ACAD.forEach(c => c.days.forEach((d, i) => { if (acDone(c.id, i)) (d.c || []).forEach((cd, k) => out.push({key:acKey(c.id, i) + '-' + k, f:cd[0], b:cd[1], src:d.t, cid:c.id})); }));
  return out;
}
function acDue(){ const t = todayStr(); return acCards().filter(c => { const s = S.acad.srs[c.key]; return !s || s.due <= t; }); }
function acReview(cards, done){
  let q = acShuffle(cards || acDue()).slice(0, 30);
  if (!q.length) return toast('مفيش كروت للمراجعة النهارده 🎉');
  let i = 0, ok = 0; const again = new Set(), t = todayStr();
  const show = sh => {
    const box = $('[data-cbox]', sh), c = q[i];
    if (!c){ save(); box.innerHTML = '<div style="text-align:center;font-size:46px">🎉</div><div class="greet" style="text-align:center">خلصتي المراجعة!</div><p style="text-align:center;margin:0;font-weight:700">' + ok + ' كارت افتكرتيه. اللي نسيتيه هيرجعلك بكرة.</p>'; return; }
    box.innerHTML = '<span class="small muted" style="font-weight:900">' + (i + 1) + ' / ' + q.length + ' · <span data-notr>' + esc(c.src) + '</span></span>' +
      '<div class="acflip" data-notr><div class="acf">' + esc(c.f) + '</div><div class="acb" hidden>' + esc(c.b) + '</div></div>' +
      '<p class="small muted" style="margin:0;text-align:center;font-weight:800">قولي المعنى بصوت عالي، وبعدين اكشفي</p>' +
      '<button class="btn full" data-reveal>👀 اكشفي</button>' +
      '<div class="row srs-rate" hidden><button class="btn soft" data-r="0" style="flex:1">😕 نسيته</button><button class="btn soft" data-r="1" style="flex:1">🙂 افتكرته</button><button class="btn soft" data-r="2" style="flex:1">😎 سهل</button></div>';
    $('[data-reveal]', box).onclick = () => { $('.acb', box).hidden = false; $('.srs-rate', box).hidden = false; $('[data-reveal]', box).remove(); };
    $$('[data-r]', box).forEach(b => b.onclick = () => { const r = +b.dataset.r, cur = S.acad.srs[c.key] || {b:-1};
      if (r === 0){ S.acad.srs[c.key] = {b:0, due:addDays(t, 1)}; if (!again.has(c.key)){ again.add(c.key); q.push(c); } }
      else { const nb = Math.min(SRS_INT.length - 1, Math.max(0, cur.b) + r); S.acad.srs[c.key] = {b:nb, due:addDays(t, SRS_INT[nb])}; ok++; }
      save(); i++; show(sh); });
  };
  sheet('<div style="text-align:center;font-size:34px">🃏</div><h2 class="plain" style="justify-content:center">مراجعة الكروت</h2><div data-cbox style="display:flex;flex-direction:column;gap:12px"></div>',
    (sh, close) => { show(sh); $('[data-close]', sh).addEventListener('click', () => done && done()); });
}
function acBrowseCards(d){                                     // flip through a lesson's cards without grading
  let i = 0;
  const show = sh => { const box = $('[data-cbox]', sh), c = d.c[i];
    box.innerHTML = '<span class="small muted" style="font-weight:900">' + (i + 1) + ' / ' + d.c.length + '</span><button class="acflip" data-flip data-notr><div class="acf">' + esc(c[0]) + '</div><div class="acb" hidden>' + esc(c[1]) + '</div></button>' +
      '<p class="small muted" style="margin:0;text-align:center;font-weight:800">دوسي على الكارت عشان تقلبيه</p><div class="row"><button class="btn soft" data-pv style="flex:1"' + (i ? '' : ' disabled') + '>→ اللي قبله</button><button class="btn soft" data-nx style="flex:1"' + (i < d.c.length - 1 ? '' : ' disabled') + '>اللي بعده ←</button></div>';
    $('[data-flip]', box).onclick = () => { const f = $('.acf', box), b = $('.acb', box); f.hidden = !f.hidden; b.hidden = !b.hidden; };
    $('[data-pv]', box).onclick = () => { i--; show(sh); }; $('[data-nx]', box).onclick = () => { i++; show(sh); };
  };
  sheet('<div style="text-align:center;font-size:34px">🃏</div><h2 class="plain" style="justify-content:center">كروت الدرس</h2><div data-cbox style="display:flex;flex-direction:column;gap:12px"></div>', sh => show(sh));
}

/* ---------- quizzes ---------- */
function acQuizSheet(qs, o){                                   // qs: [[q, [right, ...wrong], why]]; o: {title, onDone(pct, wrong)}
  const items = qs.map(q => { const opts = acShuffle(q[1].map((t, k) => ({t, ok:k === 0}))); return {q:q[0], opts, ok:opts.findIndex(x => x.ok), why:q[2]}; });
  let i = 0, score = 0; const wrong = [];
  const show = sh => {
    const box = $('[data-qbox]', sh), q = items[i];
    if (!q){ const pct = Math.round(score / items.length * 100); o.onDone && o.onDone(pct, wrong);
      box.innerHTML = '<div style="text-align:center;font-size:46px">' + (pct >= 80 ? '🏆' : pct >= 60 ? '👏' : '💪') + '</div><div class="greet" style="text-align:center">' + score + ' / ' + items.length + ' · ' + pct + '%</div><p style="text-align:center;margin:0;font-weight:700">' +
        (pct >= 80 ? 'ممتاز! الكلام ثبت.' : pct >= 60 ? 'حلو! راجعي الأسئلة اللي غلطتي فيها.' : 'عادي خالص، الغلط بيثبّت أكتر. اقري الجزء تاني وأعيدي الكويز.') + '</p>' +
        (wrong.length ? '<div class="card" style="margin:0"><h2 class="plain" style="font-size:15px">راجعي دول</h2>' + wrong.map(w => '<p class="small" style="margin:0 0 8px;font-weight:700" data-notr>❓ ' + esc(w.q) + '<br>✓ ' + esc(w.a) + '<br><span class="muted">' + esc(w.why) + '</span></p>').join('') + '</div>' : '') +
        '<button class="btn soft full" data-retake>🔁 أعيدي الكويز</button>';
      $('[data-retake]', box).onclick = () => { $('[data-close]', sh).click(); acQuizSheet(qs, o); };
      return; }
    box.innerHTML = '<span class="small muted" style="font-weight:900">' + (i + 1) + ' / ' + items.length + '</span><div class="bar"><i style="width:' + Math.round(i / items.length * 100) + '%"></i></div><div class="greet" style="font-size:18px;line-height:1.6" data-notr>' + esc(q.q) + '</div>' +
      '<div class="list" style="gap:8px">' + q.opts.map((x, k) => '<button class="qopt" data-k="' + k + '" data-notr style="text-align:start;line-height:1.5">' + esc(x.t) + '</button>').join('') + '</div><div data-why></div>';
    $$('[data-k]', box).forEach(btn => btn.onclick = () => { const k = +btn.dataset.k, right = k === q.ok;
      if (right) score++; else wrong.push({q:q.q, a:q.opts[q.ok].t, why:q.why || ''});
      $$('[data-k]', box).forEach(x => { x.disabled = true; if (+x.dataset.k === q.ok) x.classList.add('right'); else if (x === btn) x.classList.add('wrong'); });
      $('[data-why]', box).innerHTML = '<p class="small" style="margin:0;font-weight:800" data-notr>' + (right ? '✓ ' : '💡 ') + esc(q.why || '') + '</p><button class="btn full" data-next style="margin-top:8px">' + (i < items.length - 1 ? 'اللي بعده' : 'النتيجة') + '</button>';
      $('[data-next]', box).onclick = () => { i++; show(sh); }; });
  };
  sheet('<div style="text-align:center;font-size:34px">📝</div><h2 class="plain" style="justify-content:center" data-notr>' + esc(o.title || 'كويز') + '</h2><div data-qbox style="display:flex;flex-direction:column;gap:10px"></div>', sh => show(sh));
}
function acFinal(c, again){
  const pool = acShuffle(c.days.flatMap(d => d.q)).slice(0, ACAD_FINAL_N);
  acQuizSheet(pool, {title:'الاختبار النهائي · ' + c.t, onDone:pct => {
    const prev = S.acad.final[c.id], pass = pct >= 80;
    if (!prev || pct > prev.pct) S.acad.final[c.id] = {pct, date:todayStr(), pass:pass || !!(prev && prev.pass)};
    save(); acBadges(c);
    if (pass) setTimeout(() => { $$('.sheet').forEach(s => s.remove()); acCert(c); celebrate({key:'acad-cert-' + c.id, e:'🎓', title:'مبروك يا خبيرة!', msg:'عدّيتي الاختبار النهائي بـ' + pct + '%. شهادتك جاهزة.'}); again && again(); }, 900);
    else again && again();
  }});
}
function acCert(c){
  const f = S.acad.final[c.id]; if (!f || !f.pass) return toast('الشهادة بتظهر لما تعدّي الاختبار النهائي بـ80%');
  const mins = c.days.reduce((a, d, i) => a + (S.acad.lmins[acKey(c.id, i)] || 0), 0);
  const txt = 'شهادة إتمام: ' + c.t + '\nأمنية (مونمون)\nالنتيجة ' + f.pct + '% · ' + niceDM(f.date) + ' ' + f.date.slice(0, 4) + '\n' + acDoneN(c) + ' درس · ' + acHrs(mins) + ' مذاكرة';
  sheet('<div class="accert" data-notr><div class="acseal">🎓</div><span class="small" style="font-weight:900;letter-spacing:.5px">أكاديمية Monmon’s Life</span><div class="accert-t">شهادة إتمام</div><span class="small" style="font-weight:700">بنشهد إن</span><div class="accert-n">أمنية (مونمون)</div><span class="small" style="font-weight:700">خلّصت بنجاح كورس</span><div class="accert-c">' + c.e + ' ' + esc(c.t) + '</div>' +
    '<div class="row" style="justify-content:center;gap:14px"><span class="pill">النتيجة ' + f.pct + '%</span><span class="pill">' + acDoneN(c) + ' درس</span><span class="pill">' + acHrs(mins) + '</span></div><span class="small muted" style="font-weight:800">' + niceDM(f.date) + ' ' + f.date.slice(0, 4) + '</span></div>' +
    '<p class="small muted" style="margin:0;text-align:center;font-weight:700">الخطوة الجاية: امتحان Meta Certified Media Buying Professional الرسمي.</p>' +
    (navigator.share ? '<button class="btn full" data-shc>📤 شاركي</button>' : '<button class="btn full" data-cpc>📋 انسخي</button>'),
  sh => { const s = $('[data-shc]', sh); if (s) s.onclick = () => navigator.share({text:txt}).catch(() => {}); const cp = $('[data-cpc]', sh); if (cp) cp.onclick = () => copyText(txt); });
}

/* ---------- badges ---------- */
const AC_BADGES = [
  ['first', '🌱', 'أول درس', c => acDoneN(c) >= 1],
  ['w1', '📊', 'الأسبوع 1: اللغة والنظام', c => c.days.every((d, i) => d.w !== 1 || acDone(c.id, i))],
  ['w2', '🛠️', 'الأسبوع 2: الإعدادات والتتبع', c => c.days.every((d, i) => d.w !== 2 || acDone(c.id, i))],
  ['w3', '🎬', 'الأسبوع 3: الكريتيف والإطلاق', c => c.days.every((d, i) => d.w !== 3 || acDone(c.id, i))],
  ['w4', '🚀', 'الأسبوع 4: التوسيع والخبرة', c => c.days.every((d, i) => d.w !== 4 || acDone(c.id, i))],
  ['s7', '🔥', '7 أيام ورا بعض', () => acStreak() >= 7],
  ['ace', '💯', '5 كويزات 100%', c => c.days.filter((d, i) => S.acad.best[acKey(c.id, i)] === 100).length >= 5],
  ['h10', '⏱️', '10 ساعات مذاكرة', () => acMinsTotal() >= 600],
  ['cert', '🎓', 'الشهادة', c => !!(S.acad.final[c.id] && S.acad.final[c.id].pass)]
];
function acBadges(c){                                          // award new badges; returns the new ones
  const got = [];
  AC_BADGES.forEach(b => { const k = c.id + '-' + b[0]; if (!S.acad.badges[k] && b[3](c)){ S.acad.badges[k] = todayStr(); got.push(b); } });
  if (got.length) save();
  return got;
}

/* ---------- 60-minute focus timer (survives reloads; logs minutes) ---------- */
const AC_PHASES = [[20, '📖 قراية'], [45, '🛠️ تطبيق'], [55, '📝 كويز وكروت'], [60, '✍️ ملاحظات']];
const acElapsed = () => { const T = S.acad.timer; return T ? T.acc + (T.start ? (Date.now() - T.start) / 1000 : 0) : 0; };
function acLogTimer(){                                         // move whole minutes from the running timer into the logs
  const T = S.acad.timer; if (!T) return;
  const secs = acElapsed(), logged = T.logged || 0, mins = Math.floor(secs / 60) - logged; if (mins <= 0) return;
  const t = todayStr(), k = acKey(T.cid, T.i);
  S.acad.mins[t] = (S.acad.mins[t] || 0) + mins; S.acad.lmins[k] = (S.acad.lmins[k] || 0) + mins; T.logged = logged + mins; save();
}
let acTick = null;
function acTimerUI(){
  $$('[data-actimer]').forEach(box => {
    const T = S.acad.timer, mine = T && T.cid === box.dataset.cid && +box.dataset.i === T.i, secs = mine ? acElapsed() : 0, left = Math.max(0, 3600 - secs);
    const ph = AC_PHASES.find(p => secs / 60 < p[0]) || AC_PHASES[3];
    $('.actime', box).textContent = pad(Math.floor(left / 60)) + ':' + pad(Math.floor(left % 60));
    $('.acphase', box).textContent = mine ? (secs >= 3600 ? '🎉 خلصتي الساعة!' : ph[1]) : 'ساعة مركّزة: 20 قراية · 25 تطبيق · 10 كويز وكروت · 5 ملاحظات';
    $('.bar>i', box).style.width = Math.min(100, secs / 36) + '%';
    const run = mine && T.start; $('[data-tgo]', box).textContent = run ? '⏸ وقفي' : (mine && secs ? '▶ كمّلي' : '▶ ابدئي الساعة');
    const st = $('[data-tstop]', box); if (st) st.hidden = !mine;
  });
  if (S.acad.timer && S.acad.timer.start){ acLogTimer(); if (acElapsed() >= 3600) acTimerStop(true); }
}
function acTimerStart(cid, i){
  const T = S.acad.timer;
  if (T && (T.cid !== cid || T.i !== i)) acTimerStop(false);
  if (S.acad.timer && S.acad.timer.start){ acLogTimer(); S.acad.timer.acc = acElapsed(); S.acad.timer.start = null; }
  else if (S.acad.timer) S.acad.timer.start = Date.now();
  else S.acad.timer = {cid, i, start:Date.now(), acc:0, logged:0};
  save(); acTimerUI(); acEnsureTick();
}
function acTimerStop(finished){
  acLogTimer(); S.acad.timer = null; save();
  if (finished){ toast('🎉 ساعة مذاكرة كاملة! برافو'); hearts(innerWidth / 2, innerHeight / 2); }
  acTimerUI();
}
function acEnsureTick(){ clearInterval(acTick); acTick = setInterval(() => { if (!S.acad.timer || !S.acad.timer.start){ clearInterval(acTick); acTick = null; } acTimerUI(); }, 1000); }

/* ---------- views ---------- */
function acRing(pct, mid, sub){
  const r = 52, C = 2 * Math.PI * r;
  return '<div class="ring" style="width:118px;height:118px"><svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="' + r + '"/><circle class="fill" cx="60" cy="60" r="' + r + '" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct / 100)).toFixed(1) + '"/></svg><div class="mid"><span class="big">' + mid + '</span><span class="sm">' + sub + '</span></div></div>';
}
function acCatalog(el){
  const due = acDue().length, mins = acMinsTotal(), certs = Object.values(S.acad.final).filter(f => f.pass).length, t = todayStr(), todayM = S.acad.mins[t] || 0;
  el.innerHTML = '<div class="card tint achero"><div class="greet">🎓 الأكاديمية</div><span class="small" style="font-weight:700;line-height:1.6">ساعة كل يوم. درس، تطبيق، كويز، كروت مراجعة، ملاحظات، وشهادة في الآخر. الكتاب الكامل مفتوح في أي وقت.</span>' +
      '<div class="acstats"><div><b>' + acStreak() + '🔥</b><span>أيام ورا بعض</span></div><div><b>' + acHrs(todayM) + '</b><span>النهارده</span></div><div><b>' + acHrs(mins) + '</b><span>كل المذاكرة</span></div><div><b>' + certs + '</b><span>شهادات</span></div></div>' +
      '<div class="row"><button class="btn" data-acrev style="flex:2"' + (due ? '' : ' disabled') + '>🃏 راجعي الكروت (' + due + ')</button><button class="btn soft" data-acbook style="flex:1">📘 الكتاب</button></div></div>' +
    ACAD.map(c => { const n = acDoneN(c), pct = Math.round(n / c.days.length * 100), nx = acNextIdx(c), ti = acTodayIdx(c), f = S.acad.final[c.id];
      const started = !acDated(c) || t >= S.acad.start;
      const line = nx < 0 ? '✅ خلصتي الكورس' + (f && f.pass ? ' · 🎓 ' + f.pct + '%' : ' · فاضل الاختبار النهائي') :
        acDated(c) ? (started ? 'النهارده: اليوم ' + (ti + 1) + ' · ' + c.days[ti].t : 'بيبدأ ' + niceDM(S.acad.start) + ' · تقدري تبدئي اليوم 1 دلوقتي') : 'الجاي: ' + c.days[nx].t;
      return '<button class="card accourse" data-acc="' + c.id + '" data-notr><div class="card-head"><h2 class="plain">' + c.e + ' ' + esc(c.t) + '</h2><span class="num" style="font-weight:800">' + n + ' / ' + c.days.length + '</span></div>' +
        '<span class="small muted" style="font-weight:700">' + esc(c.st) + '</span><div class="bar good"><i style="width:' + pct + '%"></i></div><span class="small" style="font-weight:800">' + esc(line) + '</span></button>'; }).join('') +
    '<div class="card"><h2 class="plain">💡 إزاي تستفيدي أقصى حاجة</h2><div class="small" style="font-weight:700;line-height:1.8">• ابدئي تايمر الساعة أول ما تفتحي الدرس.<br>• اعملي المهام بإيدك على Ads Manager، مش قراية بس.<br>• الكروت بتظهر تاني في الوقت اللي هتنسيها فيه، فراجعيها كل يوم.<br>• اكتبي ملاحظة بكلامك في آخر كل درس.<br>• أي حاجة مش فاهماها دوسي 🤔 وتتحفظ لكلود.</div></div>';
  $$('[data-acc]', el).forEach(b => b.onclick = () => { ui.acC = b.dataset.acc; ui.acL = null; VIEWS['grow.academy'](el); scrollTo({top:0}); });
  $('[data-acrev]', el).onclick = () => acReview(null, () => VIEWS['grow.academy'](el));
  $('[data-acbook]', el).onclick = () => openExternal(ACAD_DOC);
}
function acCourseView(el, c){
  const n = acDoneN(c), pct = Math.round(n / c.days.length * 100), avg = acAvg(c), ti = acTodayIdx(c), nx = acNextIdx(c), f = S.acad.final[c.id], t = todayStr();
  const mins = c.days.reduce((a, d, i) => a + (S.acad.lmins[acKey(c.id, i)] || 0), 0), dueN = acDue().filter(x => x.cid === c.id).length;
  const finalOpen = n >= c.days.length - 2, weeks = [...new Set(c.days.map(d => d.w))];
  const WN = {1:'اللغة والنظام', 2:'الإعدادات والتتبع', 3:'الكريتيف والإطلاق', 4:'التحسين والتوسيع والخبرة'};
  const go2 = acDated(c) ? (nx >= 0 && nx < ti ? nx : ti) : Math.max(0, nx);
  el.innerHTML = '<button class="linkbtn" data-acback>→ الأكاديمية</button>' +
    '<div class="card tint" data-notr><div class="greet">' + c.e + ' ' + esc(c.t) + '</div><span class="small" style="font-weight:700">' + esc(c.st) + '</span>' +
      '<div class="acover">' + acRing(pct, pct + '%', n + ' / ' + c.days.length + ' درس') + '<div class="acstats col"><div><b>' + (avg == null ? '—' : avg + '%') + '</b><span>متوسط الكويزات</span></div><div><b>' + acHrs(mins) + '</b><span>مذاكرة</span></div><div><b>' + acStreak() + '🔥</b><span>أيام ورا بعض</span></div></div></div>' +
      (nx >= 0 ? '<button class="btn full" data-acl="' + go2 + '">▶ ' + (acDone(c.id, go2) ? 'افتحي' : (nx === go2 && n ? 'كمّلي' : 'ابدئي')) + ': ' + (acDated(c) ? 'اليوم ' + (go2 + 1) + ' · ' : '') + esc(c.days[go2].t) + '</button>' : '') +
      (acDated(c) && nx >= 0 && nx < ti ? '<span class="small" style="font-weight:800;color:var(--danger)">⏳ متأخرة ' + (ti - nx) + ' ' + (ti - nx === 1 ? 'درس' : 'دروس') + '. عادي، خلّصي واحد زيادة في يوم فاضي.</span>' : '') +
      '<div class="row"><button class="btn soft" data-acrev style="flex:1"' + (dueN ? '' : ' disabled') + '>🃏 الكروت (' + dueN + ')</button><button class="btn soft" data-acbook style="flex:1">📘 الكتاب</button>' + (acDated(c) ? '<button class="btn soft" data-acset aria-label="إعدادات">⚙️</button>' : '') + '</div></div>' +
    '<div class="card"><h2 class="plain">🏅 الإنجازات</h2><div class="acbadges">' + AC_BADGES.filter(b => acDated(c) || !/^w\d$/.test(b[0])).map(b => { const on = S.acad.badges[c.id + '-' + b[0]]; return '<div class="acbadge' + (on ? ' on' : '') + '"><span>' + b[1] + '</span><small>' + b[2] + '</small></div>'; }).join('') + '</div></div>' +
    weeks.map(w => { const list = c.days.map((d, i) => [d, i]).filter(x => x[0].w === w), wd = list.filter(x => acDone(c.id, x[1])).length;
      return '<div class="card"><div class="card-head"><h2 class="plain">' + (acDated(c) ? 'الأسبوع ' + w + ': ' + WN[w] : 'الجزء ' + w) + '</h2><span class="num" style="font-weight:800">' + wd + ' / ' + list.length + '</span></div><div class="list">' +
        list.map(([d, i]) => { const done = acDone(c.id, i), open = acOpen(c, i), isT = acDated(c) && i === ti, best = S.acad.best[acKey(c.id, i)];
          return '<button class="item aclrow' + (done ? ' fin' : '') + (isT ? ' now' : '') + '" data-acl="' + i + '"' + (open ? '' : ' data-locked') + ' style="text-align:start" data-notr><span class="acdot">' + (done ? '✅' : !open ? '🔒' : isT ? '▶️' : (i + 1)) + '</span><span class="t">' + (acDated(c) ? 'اليوم ' + (i + 1) + ' · ' : '') + esc(d.t) +
            '<span class="s">' + (acDated(c) ? niceDM(acDateOf(c, i)) + (isT ? ' · النهارده' : '') : esc(d.goal)) + (best != null ? ' · 📝 ' + best + '%' : '') + '</span></span><span class="muted" style="font-size:18px">‹</span></button>'; }).join('') + '</div></div>'; }).join('') +
    '<div class="card acfinal"><h2 class="plain">🏆 الاختبار النهائي</h2><span class="small" style="font-weight:700">' + ACAD_FINAL_N + ' سؤال من كل الكورس. 80% فأكتر = شهادة إتمام.</span>' +
      (f ? '<span class="small" style="font-weight:800">أحسن نتيجة: ' + f.pct + '% ' + (f.pass ? '✅' : '') + '</span>' : '') +
      '<div class="row"><button class="btn" data-acfin style="flex:2"' + (finalOpen ? '' : ' disabled') + '>' + (finalOpen ? '📝 ابدئي الاختبار' : '🔒 بيفتح بعد ' + (c.days.length - 2) + ' درس') + '</button>' + (f && f.pass ? '<button class="btn soft" data-accert style="flex:1">🎓 الشهادة</button>' : '') + '</div></div>';
  const again = () => VIEWS['grow.academy'](el);
  $('[data-acback]', el).onclick = () => { ui.acC = null; again(); scrollTo({top:0}); };
  $$('[data-acl]', el).forEach(b => b.onclick = () => { if (b.hasAttribute('data-locked')) return toast('🔒 الدرس ده بيفتح يوم ' + niceDM(acDateOf(c, +b.dataset.acl)) + '، أو لما تخلّصي اللي قبله'); ui.acL = +b.dataset.acl; again(); scrollTo({top:0}); });
  $('[data-acrev]', el).onclick = () => acReview(acDue().filter(x => x.cid === c.id), again);
  $('[data-acbook]', el).onclick = () => openExternal(ACAD_DOC);
  const fb = $('[data-acfin]', el); if (fb) fb.onclick = () => acFinal(c, again);
  const cb = $('[data-accert]', el); if (cb) cb.onclick = () => acCert(c);
  const sb = $('[data-acset]', el); if (sb) sb.onclick = () => acSettings(again);
}
function acLesson(el, c, i){
  const d = c.days[i], k = acKey(c.id, i), done = acDone(c.id, i), best = S.acad.best[k], tk = S.acad.tasks[k] || {}, nTasks = d.tasks.filter((x, j) => tk[j]).length;
  const ctx = d.t + ': ' + d.read.join(' ');
  el.innerHTML = '<button class="linkbtn" data-acback>→ ' + esc(c.t) + '</button>' +
    '<div class="card tint aclhead" data-notr><span class="small muted" style="font-weight:900">' + (acDated(c) ? 'اليوم ' + (i + 1) + ' من ' + c.days.length + ' · الأسبوع ' + d.w + ' · ' + niceDM(acDateOf(c, i)) : 'الدرس ' + (i + 1) + ' من ' + c.days.length) + (done ? ' · ✅ خلصتيه' : '') + '</span>' +
      '<div class="greet" style="font-size:21px;line-height:1.5">' + esc(d.t) + '</div><p class="acgoal">🎯 ' + esc(d.goal) + '</p>' +
      '<div class="acsteps"><span class="' + (S.acad.lmins[k] ? 'on' : '') + '">📖 قراية</span><span class="' + (nTasks ? 'on' : '') + '">🛠️ تطبيق ' + nTasks + '/' + d.tasks.length + '</span><span class="' + (best != null ? 'on' : '') + '">📝 كويز' + (best != null ? ' ' + best + '%' : '') + '</span><span class="' + (S.acad.notes[k] ? 'on' : '') + '">✍️ ملاحظات</span></div></div>' +
    '<div class="card actimer" data-actimer data-cid="' + c.id + '" data-i="' + i + '"><div class="card-head"><h2 class="plain">⏱️ ساعة المذاكرة</h2><span class="actime num">60:00</span></div><div class="bar"><i></i></div><span class="small acphase" style="font-weight:800"></span>' +
      '<div class="row"><button class="btn" data-tgo style="flex:2">▶ ابدئي الساعة</button><button class="btn soft" data-tstop style="flex:1" hidden>⏹ خلّصت</button></div><span class="small muted" style="font-weight:700">اتسجّل للدرس ده: ' + acHrs(S.acad.lmins[k] || 0) + '</span></div>' +
    '<div class="card" data-notr><h2 class="plain">📖 الدرس</h2>' + d.read.map(p => '<p class="acp">' + esc(p) + '</p>').join('') +
      '<button class="btn soft full" data-acbook>📘 اقري بالتفصيل في الكتاب: ' + esc(d.ref) + '</button><div class="row" style="justify-content:flex-end">' + askBtn('course', d.t, ctx, false) + '</div></div>' +
    '<div class="card" data-notr><div class="card-head"><h2 class="plain">🛠️ التطبيق العملي</h2><span class="num" style="font-weight:800">' + nTasks + ' / ' + d.tasks.length + '</span></div><div class="list">' +
      d.tasks.map((x, j) => '<button class="item' + (tk[j] ? ' done' : '') + '" data-tk="' + j + '" style="text-align:start"><span class="tick' + (tk[j] ? ' on' : '') + '">' + CHECK + '</span><span class="t">' + esc(x) + '</span><span></span></button>').join('') + '</div>' +
      '<p class="todo" style="margin:0"><b>المطلوب تسلّميه</b> ' + esc(d.out) + '</p></div>' +
    '<div class="card"><div class="card-head"><h2 class="plain">📝 الكويز</h2><span class="num" style="font-weight:800">' + (best != null ? 'أحسن نتيجة ' + best + '%' : d.q.length + ' أسئلة') + '</span></div><span class="small muted" style="font-weight:700">كل إجابة ليها شرح. تقدري تعيديه لحد ما تقفليه 100%.</span><button class="btn full" data-acq>' + (best != null ? '🔁 أعيدي الكويز' : '📝 ابدئي الكويز') + '</button></div>' +
    '<div class="card" data-notr><div class="card-head"><h2 class="plain">🃏 كروت الدرس</h2><span class="num" style="font-weight:800">' + d.c.length + '</span></div><div class="accards">' + d.c.map(x => '<span><b>' + esc(x[0]) + '</b></span>').join('') + '</div>' +
      '<span class="small muted" style="font-weight:700">' + (done ? 'الكروت دي دخلت المراجعة اليومية.' : 'لما تخلّصي الدرس الكروت بتدخل المراجعة اليومية وبترجعلك قبل ما تنسيها.') + '</span><button class="btn soft full" data-acbc>👀 اتفرجي على الكروت</button></div>' +
    '<div class="card"><h2 class="plain">✍️ ملاحظاتي</h2><span class="small muted" style="font-weight:700">اكتبي أهم 3 حاجات اتعلمتيها بكلامك، وأي سؤال لسه في دماغك.</span><textarea class="in acnotes" data-acn rows="5" placeholder="1) …&#10;2) …&#10;3) …">' + esc(S.acad.notes[k] || '') + '</textarea><span class="small muted acsaved" style="font-weight:700"></span></div>' +
    '<button class="btn full acdone" data-acdone' + (done ? ' disabled' : '') + '>' + (done ? '✅ خلصتي الدرس ده' : '✓ خلّصت الدرس') + '</button>' +
    '<div class="row">' + (i > 0 ? '<button class="btn soft" data-acgo="' + (i - 1) + '" style="flex:1">→ اللي قبله</button>' : '') + (i < c.days.length - 1 ? '<button class="btn soft" data-acgo="' + (i + 1) + '" style="flex:1">اللي بعده ←</button>' : '') + '</div>';
  const again = () => VIEWS['grow.academy'](el);
  $('[data-acback]', el).onclick = () => { ui.acL = null; again(); scrollTo({top:0}); };
  $('[data-acbook]', el).onclick = () => openExternal(ACAD_DOC);
  $('[data-tgo]', el).onclick = () => acTimerStart(c.id, i);
  $('[data-tstop]', el).onclick = () => acTimerStop(acElapsed() >= 50 * 60);
  acTimerUI(); if (S.acad.timer && S.acad.timer.start) acEnsureTick();
  $$('[data-tk]', el).forEach(b => b.onclick = ev => { const j = +b.dataset.tk, T = S.acad.tasks[k] = S.acad.tasks[k] || {};
    if (T[j]) delete T[j]; else { T[j] = true; hearts(ev.clientX, ev.clientY); } save(); again(); });
  $('[data-acq]', el).onclick = () => acQuizSheet(d.q, {title:'كويز: ' + d.t, onDone:pct => { S.acad.best[k] = Math.max(S.acad.best[k] || 0, pct); save(); acBadges(c); again(); }});
  $('[data-acbc]', el).onclick = () => acBrowseCards(d);
  let nt; const ta = $('[data-acn]', el);
  ta.oninput = () => { clearTimeout(nt); nt = setTimeout(() => { S.acad.notes[k] = ta.value; save(); $('.acsaved', el).textContent = 'اتحفظت ✓'; }, 500); };
  const db = $('[data-acdone]', el); if (db) db.onclick = ev => {
    if (S.acad.best[k] == null) return toast('خدي الكويز الأول، ولو 3 دقايق 📝');
    if (S.acad.timer && S.acad.timer.cid === c.id && S.acad.timer.i === i) acTimerStop(false);
    S.acad.notes[k] = ta.value; S.acad.done[k] = todayStr();
    d.c.forEach((x, j) => { const ck = k + '-' + j; if (!S.acad.srs[ck]) S.acad.srs[ck] = {b:-1, due:addDays(todayStr(), 1)}; });
    save(); hearts(ev.clientX, ev.clientY);
    const got = acBadges(c);
    if (got.length) celebrate({key:'acad-' + c.id + '-' + got[0][0], e:got[0][1], title:'إنجاز جديد: ' + got[0][2], msg:'كمّلي كده يا مونمون، كل يوم بيقرّبك إنك تبقي خبيرة.'});
    else toast(acDoneN(c) === c.days.length ? '🎉 خلصتي كل الدروس! فاضل الاختبار النهائي' : '✅ برافو! الكروت دخلت المراجعة');
    again();
  };
  $$('[data-acgo]', el).forEach(b => b.onclick = () => { const j = +b.dataset.acgo; if (!acOpen(c, j)) return toast('🔒 الدرس ده بيفتح يوم ' + niceDM(acDateOf(c, j)) + '، أو لما تخلّصي اللي قبله'); ui.acL = j; again(); scrollTo({top:0}); });
}
function acSettings(again){
  sheet('<h2 class="plain">⚙️ إعدادات كورس الـ30 يوم</h2>' +
    '<label class="field"><span>يوم البداية (اليوم 1)</span><input class="in" type="date" data-st value="' + S.acad.start + '"></label>' +
    '<button class="toggle" data-ron style="width:100%"><span class="sw" role="switch" aria-checked="' + !!S.acad.on + '"></span><span>تذكير يومي بدرس النهارده</span></button>' +
    '<label class="field"><span>وقت التذكير</span><input class="in" type="time" data-rt value="' + S.acad.remind + '"></label>' +
    '<span class="small muted" style="font-weight:700">الجيم بيخلص 10:45 تقريبًا، فـ10 بالليل أو قبل الجيم الساعة 5 مناسبين. لو اتأخرتي يوم، الدروس بتفضل مفتوحة.</span>' +
    '<button class="btn full" data-sv>حفظ</button>',
  (sh, close) => {
    $('[data-ron]', sh).onclick = () => { const s = $('.sw', sh); s.setAttribute('aria-checked', s.getAttribute('aria-checked') !== 'true'); };
    $('[data-sv]', sh).onclick = () => { const st = $('[data-st]', sh).value, rt = $('[data-rt]', sh).value;
      if (st) S.acad.start = st; if (rt) S.acad.remind = rt; S.acad.on = $('.sw', sh).getAttribute('aria-checked') === 'true'; save(); close(); toast('اتحفظ ✓'); again(); };
  });
}
VIEWS['grow.academy'] = function(el){
  const c = ui.acC && ACAD.find(x => x.id === ui.acC);
  if (c && ui.acL != null && c.days[ui.acL]) acLesson(el, c, ui.acL);
  else if (c) acCourseView(el, c);
  else acCatalog(el);
};
if (growTab && !growTab.subs.some(x => x[0] === 'academy')) growTab.subs.splice(Math.max(0, growTab.subs.findIndex(x => x[0] === 'learn')) + 1, 0, ['academy', 'Academy']);

/* ---------- home card ---------- */
function acHomeHTML(){
  const c = acCourse('meta30'), t = todayStr(); if (t < addDays(S.acad.start, -3)) return '';
  const nx = acNextIdx(c); if (nx < 0 && S.acad.final[c.id] && S.acad.final[c.id].pass) return '';
  const ti = acTodayIdx(c), i = nx < 0 ? -1 : Math.min(nx, ti), due = acDue().length, m = S.acad.mins[t] || 0, n = acDoneN(c);
  const before = t < S.acad.start;
  return '<div class="card achome" data-notr><div class="card-head"><h2>🎓 ' + (before ? 'الأكاديمية بتبدأ ' + niceDM(S.acad.start) : 'ساعة الأكاديمية') + '</h2><span class="num" style="font-weight:700">' + n + ' / ' + c.days.length + '</span></div>' +
    (i >= 0 ? '<span class="small muted" style="font-weight:900">اليوم ' + (i + 1) + (i < ti ? ' · متأخرة ' + (ti - i) : acDone(c.id, ti) ? ' · ✅ درس النهارده خلص' : '') + '</span><div class="greet" style="font-size:18px;line-height:1.5">' + esc(c.days[i].t) + '</div><span class="small" style="font-weight:700">🎯 ' + esc(c.days[i].goal) + '</span>'
      : '<span class="small" style="font-weight:800">🏆 خلصتي الدروس! فاضل الاختبار النهائي والشهادة.</span>') +
    '<div class="bar"><i style="width:' + Math.min(100, m / 0.6) + '%"></i></div><span class="small muted" style="font-weight:700">' + acHrs(m) + ' من ساعة النهارده' + (acStreak() ? ' · ' + acStreak() + '🔥' : '') + '</span>' +
    '<div class="row"><button class="btn" data-acopen="' + i + '" style="flex:2">▶ ' + (i < 0 ? 'الاختبار النهائي' : 'افتحي الدرس') + '</button>' + (due ? '<button class="btn soft" data-acrev style="flex:1">🃏 ' + due + '</button>' : '') + '</div></div>';
}
const _todayAcad = VIEWS.today;
VIEWS.today = function(el){
  _todayAcad(el);
  const html = acHomeHTML(); if (!html) return;
  const anchor = $('.readhome', el) || $('.frhome', el);
  if (anchor) anchor.insertAdjacentHTML('beforebegin', html); else el.insertAdjacentHTML('beforeend', html);
  const card = $('.achome', el);
  $('[data-acopen]', card).onclick = b => { const i = +b.currentTarget.dataset.acopen; ui.acC = 'meta30'; ui.acL = i < 0 ? null : i; go('grow', 'academy'); scrollTo({top:0}); };
  const r = $('[data-acrev]', card); if (r) r.onclick = () => acReview(null, () => VIEWS.today(el));
};

/* ---------- daily reminder ---------- */
const _lifeRemAcad = lifeReminders;
lifeReminders = function(R, repeat, push, at){
  _lifeRemAcad(R, repeat, push, at);
  if (!S.acad || !S.acad.on) return;
  const c = acCourse('meta30'), [h, m] = (S.acad.remind || '22:00').split(':').map(Number), t = todayStr();
  for (let k = 0; k < 4; k++){
    const day = addDays(t, k), i = Math.round((parseD(day) - parseD(S.acad.start)) / 864e5);
    if (i < 0 || i >= c.days.length || acDone(c.id, i)) continue;
    push('acad-' + day, '🎓 ساعة الأكاديمية · اليوم ' + (i + 1), c.days[i].t + ' · ابدئي التايمر وخلّصي الدرس والكويز ✨', at(parseD(day), h, m));
  }
  const due = acDue().length;
  if (due >= 5) push('acad-cards-' + t, '🃏 ' + due + ' كارت مستنيينك', 'مراجعة 5 دقايق في الأكاديمية عشان متنسيش اللي اتعلمتيه.', at(parseD(t), 13, 30));
};
