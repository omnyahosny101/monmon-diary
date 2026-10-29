/* ============ READING: books, a 15-day plan, a reader with highlights and notes ============
   S.books[id] = {start, days, pos, max, done:{k:date}, hl:[{id,g,p,s,e,c,note,at,text}], log:{date:chars}}
   S.reader = {fs, theme:'pink'|'sepia'|'dark', font:'cairo'|'amiri'|'system', lh}
   The text of each book lives in books/<file>.js and is loaded only when the book is opened. */
const L2 = (ar, en) => isAr() ? ar : en;
const CPM = 900; // Arabic characters read per minute, roughly
const HL_COLORS = [['y', '#ffe066'], ['p', '#ffb3cf'], ['g', '#a8e6c4'], ['b', '#a9d4ff']];
function bookMigrate(){
  S.books = S.books && typeof S.books === 'object' ? S.books : {};
  S.reader = Object.assign({fs:19, theme:'pink', font:'cairo', lh:2}, S.reader || {});
  S.askq = Array.isArray(S.askq) ? S.askq : [];
  BOOKS.forEach(b => { const x = S.books[b.id] = S.books[b.id] || {};
    if (!x.start) x.start = todayStr(); if (!x.days) x.days = 15; x.pos = x.pos || 0; x.max = x.max == null ? -1 : x.max;
    x.done = x.done || {}; x.hl = Array.isArray(x.hl) ? x.hl : []; x.log = x.log || {}; });
}
const bookById = id => BOOKS.find(b => b.id === id);
const plainOf = s => s.replace(/\*\*/g, '');
function bookTotal(b){ return b.lens.reduce((a, x) => a + x, 0); }
function bookRanges(b, days){
  const total = bookTotal(b), per = total / days, out = []; let start = 0, acc = 0, k = 1;
  for (let i = 0; i < b.lens.length; i++){
    acc += b.lens[i];
    if (k < days && acc >= per * k){
      let end = i + 1; // never end a day on a heading
      while (end < b.lens.length && b.heads.some(h => h[0] === end - 1)) end++;
      out.push([start, end]); start = end; k++; i = end - 1; acc = b.lens.slice(0, end).reduce((a, x) => a + x, 0);
    }
  }
  out.push([start, b.lens.length]);
  while (out.length < days) out.push([b.lens.length, b.lens.length]);
  return out;
}
function bookState(b){
  const x = S.books[b.id], R = bookRanges(b, x.days), today = todayStr();
  const k = Math.max(0, Math.min(x.days - 1, daysBetween(x.start, today)));
  const due = R[k][1] - 1, read = x.max;
  const left = c => b.lens.slice(Math.max(read + 1, c[0]), c[1]).reduce((a, y) => a + y, 0);
  let remToday = 0; for (let j = 0; j <= k; j++) remToday += left(R[j]);
  const behind = R.slice(0, k).filter(r => read < r[1] - 1).length;
  const pct = Math.round(Math.max(0, read + 1) / b.lens.length * 100);
  const chapIdx = b.heads.filter(h => h[0] <= Math.max(0, x.pos)).length - 1;
  const finished = read >= b.lens.length - 1;
  return {R, k, due, remToday, behind, pct, chap:b.heads[Math.max(0, chapIdx)], finished, endDate:addDays(x.start, x.days - 1)};
}
const minsOf = c => Math.max(1, Math.round(c / CPM));
function chapterOfPara(b, i){ let h = b.heads[0]; for (const x of b.heads) if (x[0] <= i) h = x; return h; }

/* ---------- loading the text ---------- */
const bookLoading = {};
function loadBook(b){
  window.BOOK_TEXT = window.BOOK_TEXT || {};
  if (window.BOOK_TEXT[b.id]) return Promise.resolve(window.BOOK_TEXT[b.id]);
  if (bookLoading[b.id]) return bookLoading[b.id];
  return bookLoading[b.id] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = b.file + '?v=' + b.v;
    s.onload = () => window.BOOK_TEXT[b.id] ? res(window.BOOK_TEXT[b.id]) : rej();
    s.onerror = () => { delete bookLoading[b.id]; s.remove(); rej(); };
    document.head.appendChild(s);
  });
}

/* ---------- paragraphs with bold and highlights ---------- */
function parsePara(s){
  const bold = []; let out = '', i = 0, on = false, st = 0;
  while (i < s.length){ if (s.startsWith('**', i)){ if (on) bold.push([st, out.length]); else st = out.length; on = !on; i += 2; } else { out += s[i]; i++; } }
  if (on) bold.push([st, out.length]);
  return {t:out, bold};
}
function paraInner(b, i, raw){
  const {t, bold} = parsePara(raw), hls = S.books[b.id].hl.filter(h => h.p === i);
  const cuts = new Set([0, t.length]); bold.forEach(r => { cuts.add(r[0]); cuts.add(r[1]); }); hls.forEach(h => { cuts.add(Math.max(0, h.s)); cuts.add(Math.min(t.length, h.e)); });
  const pts = [...cuts].filter(x => x >= 0 && x <= t.length).sort((a, c) => a - c);
  let html = '';
  for (let j = 0; j < pts.length - 1; j++){
    const a = pts[j], z = pts[j + 1]; if (z <= a) continue;
    let seg = esc(t.slice(a, z));
    if (bold.some(r => r[0] <= a && r[1] >= z)) seg = '<b>' + seg + '</b>';
    const h = hls.filter(x => x.s <= a && x.e >= z).pop();
    if (h){ const last = h.note && h.e === z; seg = '<mark class="hl hl-' + h.c + (last ? ' noted' : '') + '" data-hid="' + h.g + '">' + seg + '</mark>'; }
    html += seg;
  }
  return html;
}
function paraHTML(b, i, P, dayStarts){
  const [k, raw] = P[i];
  const day = dayStarts[i] != null ? '<div class="rd-day" data-notr>' + L2('📅 اليوم ', '📅 Day ') + (dayStarts[i] + 1) + '</div>' : '';
  if (k === 'h') return day + '<h2 class="rd-h" data-i="' + i + '">' + paraInner(b, i, raw) + '</h2>';
  return day + '<p class="rd-p' + (k === 'li' ? ' li' : '') + '" data-i="' + i + '">' + paraInner(b, i, raw) + '</p>';
}

/* ---------- the reader ---------- */
let RD = null; // {b, P, el, R}
function readerVars(){
  const r = S.reader, f = r.font === 'amiri' ? '"Amiri", "Cairo", serif' : r.font === 'system' ? '-apple-system, "SF Arabic", system-ui, sans-serif' : '"Cairo", system-ui, sans-serif';
  return '--rfs:' + r.fs + 'px;--rlh:' + r.lh + ';--rff:' + f;
}
function ensureAmiri(){ if (S.reader.font !== 'amiri' || $('#amiriFont')) return; const l = document.createElement('link'); l.id = 'amiriFont'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap'; document.head.appendChild(l); }
function openReader(id, at){
  const b = bookById(id); if (!b) return;
  const x = S.books[b.id];
  const shell = document.createElement('div'); shell.className = 'reader rt-' + S.reader.theme; shell.id = 'reader'; shell.setAttribute('data-notr', '');
  shell.setAttribute('style', readerVars());
  shell.innerHTML = '<div class="rd-top"><button class="rd-ic" data-rclose aria-label="Close">✕</button><div class="rd-title"><b>' + esc(b.t) + '</b><span id="rdChap"></span></div>' +
    '<button class="rd-ic" data-rnar aria-label="Listen">🎧</button><button class="rd-ic" data-rtoc aria-label="Chapters">☰</button><button class="rd-ic" data-rnotes aria-label="My highlights">🖍️</button><button class="rd-ic" data-raa aria-label="Text settings">Aa</button></div>' +
    '<div class="rd-scroll" id="rdScroll"><div class="rd-loading">' + L2('بنفتح الكتاب…', 'Opening the book…') + '</div></div>' +
    '<div class="rd-bottom"><div class="rd-prog"><i id="rdBar"></i></div><span id="rdInfo"></span></div>' +
    '<div class="rd-sel" id="rdSel" hidden>' + HL_COLORS.map(c => '<button class="rd-dot" data-hc="' + c[0] + '" style="background:' + c[1] + '" aria-label="Highlight"></button>').join('') +
    '<button data-hnote>💬 ' + L2('تعليق', 'Note') + '</button><button data-hask>🤔 ' + L2('اسألي كلود', 'Ask Claude') + '</button><button data-hcopy>📋</button></div>';
  document.body.appendChild(shell); document.documentElement.classList.add('reading');
  ensureAmiri();
  RD = {b, el:shell, P:null};
  if (typeof narrManifest === 'function') narrManifest(b);
  try { if (document.fullscreenEnabled && !navigator.standalone && window.innerWidth > 700) document.documentElement.requestFullscreen().catch(() => {}); } catch(e){}
  $('[data-rclose]', shell).onclick = closeReader;
  $('[data-raa]', shell).onclick = readerSettings;
  $('[data-rtoc]', shell).onclick = readerTOC;
  $('[data-rnotes]', shell).onclick = () => highlightsSheet(b.id, true);
  $('[data-rnar]', shell).onclick = () => narrBar();
  loadBook(b).then(P => { RD.P = P; drawReader(at != null ? at : x.pos); })
    .catch(() => { $('#rdScroll', shell).innerHTML = '<div class="rd-loading">' + L2('محتاجة نت أول مرة تفتحي فيها الكتاب. اتأكدي من النت وجربي تاني.', 'You need internet the first time you open this book.') + '</div>'; });
}
function drawReader(at){
  const {b, P, el} = RD, x = S.books[b.id], R = bookRanges(b, x.days), dayStarts = {};
  R.forEach((r, k) => { if (r[0] < r[1]) dayStarts[r[0]] = k; });
  const sc = $('#rdScroll', el);
  sc.innerHTML = '<article class="rd-text"><div class="rd-cover"><div class="e">' + b.e + '</div><h1>' + esc(b.t) + '</h1><p>' + esc(b.au) + '</p><p class="s">' + esc(b.sub) + '</p></div>' +
    P.map((_, i) => paraHTML(b, i, P, dayStarts)).join('') +
    '<div class="rd-fin">' + L2('🎉 خلصتي الكتاب! برافو يا مونمون', '🎉 You finished the book!') + '</div></article>';
  RD.paras = $$('[data-i]', sc);
  const tgt = RD.paras[Math.max(0, Math.min(P.length - 1, at || 0))];
  if (tgt && at > 0) sc.scrollTop = tgt.offsetTop - 70;
  bindReaderText();
  readerTrack(true);
}
function closeReader(){
  if (typeof narrStop === 'function') narrStop();
  if (!RD) return; readerTrack(true); saveNow();
  RD.el.remove(); RD = null; document.documentElement.classList.remove('reading');
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch(e){}
  render();
}
function saveNow(){ save(); }
let rdTick = 0, rdSaveT = 0;
function readerTrack(force){
  if (!RD || !RD.paras) return;
  const {b, el} = RD, sc = $('#rdScroll', el), x = S.books[b.id], top = sc.scrollTop + 64, bot = sc.scrollTop + sc.clientHeight - 40;
  let pos = 0, max = -1;
  const ps = RD.paras;
  let lo = 0, hi = ps.length - 1; // first paragraph whose bottom is below the top line
  while (lo < hi){ const m = (lo + hi) >> 1; if (ps[m].offsetTop + ps[m].offsetHeight < top) lo = m + 1; else hi = m; }
  pos = lo;
  lo = 0; hi = ps.length - 1; // last paragraph fully seen
  while (lo < hi){ const m = (lo + hi + 1) >> 1; if (ps[m].offsetTop + ps[m].offsetHeight <= bot) lo = m; else hi = m - 1; }
  max = ps[lo].offsetTop + ps[lo].offsetHeight <= bot ? lo : -1;
  if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 30) max = ps.length - 1;
  x.pos = pos;
  if (max > x.max){
    const day = todayStr(), gained = b.lens.slice(x.max + 1, max + 1).reduce((a, y) => a + y, 0);
    x.log[day] = (x.log[day] || 0) + gained; x.max = max;
    const st = bookState(b);
    if (!x.done[st.k] && max >= st.due){ x.done[st.k] = day; readDone(b, st); }
  }
  const st = bookState(b), ch = chapterOfPara(b, pos);
  $('#rdChap', el).textContent = ch ? ch[1] : '';
  $('#rdBar', el).style.width = st.pct + '%';
  $('#rdInfo', el).textContent = st.finished ? L2('خلصتي الكتاب 🎉', 'Finished 🎉') :
    st.remToday > 0 ? L2('اليوم ' + (st.k + 1) + ' من ' + x.days + ' · فاضل ' + minsOf(st.remToday) + ' دقيقة على جزء النهارده', 'Day ' + (st.k + 1) + ' of ' + x.days + ' · ' + minsOf(st.remToday) + ' min left today')
      : L2('✓ خلصتي جزء النهارده · ' + st.pct + '% من الكتاب', '✓ Today’s part done · ' + st.pct + '%');
  const now = Date.now(); if (force || now - rdSaveT > 2500){ rdSaveT = now; save(); }
}
function readDone(b, st){
  const day = todayStr(), x = S.books[b.id];
  const m = S.media[day] = S.media[day] || {}; m.book = b.t; m.pages = Math.max(m.pages || 0, Math.round((x.log[day] || 0) / 3450));
  S.lastBook = b.t;
  if (S.habits.some(h => h.id === 'read') && !habitDone('read', day)) setHabit('read', day, true);
  toast(L2('🎉 خلصتي قراية النهارده! برافو', '🎉 Today’s reading is done!'));
}
function bindReaderText(){
  const {el} = RD, sc = $('#rdScroll', el);
  sc.onscroll = () => { if (rdTick) return; rdTick = requestAnimationFrame(() => { rdTick = 0; readerTrack(); }); };
  sc.onclick = ev => {
    const m = ev.target.closest('mark[data-hid]');
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    if (m) return hlSheet(RD.b.id, m.dataset.hid);
    const pp = ev.target.closest('[data-i]');
    if (pp && NAR.bar){ narrFrom(+pp.dataset.i); return; }
    if (pp) narrHerePill(+pp.dataset.i, ev.clientY);
    if (ev.target.closest('.rd-text')) el.classList.toggle('bare');
  };
}
/* selection → toolbar */
let rdSelCache = null, rdSelT = 0;
document.addEventListener('selectionchange', () => {
  if (!RD) return; clearTimeout(rdSelT);
  rdSelT = setTimeout(() => {
    const bar = $('#rdSel', RD.el); if (!bar) return;
    const sel = window.getSelection(), info = selInfo(sel);
    if (info){ rdSelCache = info; bar.hidden = false; RD.el.classList.remove('bare'); }
    else bar.hidden = true;
  }, 180);
});
function selInfo(sel){
  if (!RD || !sel || sel.isCollapsed || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0), text = sel.toString().trim(); if (!text) return null;
  const pa = node => { const e = node.nodeType === 1 ? node : node.parentElement; return e && e.closest ? e.closest('[data-i]') : null; };
  let p1 = pa(r.startContainer), p2 = pa(r.endContainer);
  if (!p1 && !p2) return null; if (!p1) p1 = p2; if (!p2) p2 = p1;
  const off = (p, node, o) => { try { const q = document.createRange(); q.setStart(p, 0); q.setEnd(node, o); return q.toString().length; } catch(e){ return 0; } };
  const i1 = +p1.dataset.i, i2 = +p2.dataset.i;
  const o1 = p1.contains(r.startContainer) ? off(p1, r.startContainer, r.startOffset) : 0;
  const o2 = p2.contains(r.endContainer) ? off(p2, r.endContainer, r.endOffset) : p2.textContent.length;
  return {i1, o1, i2, o2, text};
}
document.addEventListener('pointerdown', ev => { if (ev.target.closest && ev.target.closest('#rdSel')) ev.preventDefault(); }, true);
document.addEventListener('click', ev => {
  const bar = ev.target.closest && ev.target.closest('#rdSel'); if (!bar || !RD) return;
  const btn = ev.target.closest('button'); if (!btn) return;
  const info = rdSelCache || selInfo(window.getSelection()); if (!info) return;
  const b = RD.b;
  if (btn.dataset.hcopy != null){ copyText(info.text); return; }
  if (btn.dataset.hask != null){ window.getSelection().removeAllRanges(); $('#rdSel', RD.el).hidden = true;
    return askSheet({src:'book', title:b.t + ' · ' + (chapterOfPara(b, info.i1) || ['', ''])[1], ctx:info.text}); }
  const g = addHighlight(b, info, btn.dataset.hc || 'y');
  window.getSelection().removeAllRanges(); $('#rdSel', RD.el).hidden = true; rdSelCache = null;
  if (btn.dataset.hnote != null) hlSheet(b.id, g, true);
});
function addHighlight(b, info, c){
  const x = S.books[b.id], g = uid(), P = RD.P;
  for (let p = info.i1; p <= info.i2; p++){
    const len = plainOf(P[p][1]).length, s = p === info.i1 ? info.o1 : 0, e = p === info.i2 ? info.o2 : len;
    if (e > s) x.hl.push({id:uid(), g, p, s, e, c, note:'', at:todayStr(), text:p === info.i1 ? info.text.slice(0, 1200) : ''});
  }
  save(); redrawParas(b, info.i1, info.i2);
  return g;
}
function redrawParas(b, a, z){
  if (!RD || !RD.P) return;
  for (let i = a; i <= z; i++){ const el = RD.paras[i]; if (el) el.innerHTML = paraInner(b, i, RD.P[i][1]); }
}
const hlGroup = (id, g) => S.books[id].hl.filter(h => h.g === g);
function hlSheet(id, g, focus){
  const b = bookById(id), hs = hlGroup(id, g); if (!hs.length) return;
  const h0 = hs[0], text = h0.text || '';
  sheet('<h2 class="plain">🖍️ ' + L2('الجزء اللي علّمتي عليه', 'Your highlight') + '</h2><blockquote class="quote" data-notr>' + esc(text) + '</blockquote>' +
    '<div class="row" style="justify-content:center">' + HL_COLORS.map(c => '<button class="rd-dot big' + (h0.c === c[0] ? ' on' : '') + '" data-c="' + c[0] + '" style="background:' + c[1] + '" aria-label="Colour"></button>').join('') + '</div>' +
    '<label class="field"><span>' + L2('تعليقك', 'Your note') + '</span><textarea class="in" data-note placeholder="' + L2('اكتبي رأيك أو اللي فهمتيه…', 'What do you think?') + '">' + esc(h0.note || '') + '</textarea></label>' +
    '<button class="btn full" data-save>' + L2('حفظ', 'Save') + '</button>' +
    '<div class="row"><button class="btn soft" data-ask style="flex:1">🤔 ' + L2('اسألي كلود عنها', 'Ask Claude') + '</button><button class="btn soft" data-copy style="flex:1">📋 ' + L2('نسخ', 'Copy') + '</button></div>' +
    (RD ? '' : '<button class="btn soft full" data-open>📖 ' + L2('افتحي في الكتاب', 'Open in the book') + '</button>') +
    '<button class="btn soft full" data-del style="color:var(--danger)">🗑️ ' + L2('امسحي العلامة', 'Remove highlight') + '</button>',
  (sh, close) => {
    const ta = $('[data-note]', sh); if (focus) setTimeout(() => ta.focus(), 250);
    $$('[data-c]', sh).forEach(btn => btn.onclick = () => { hs.forEach(h => h.c = btn.dataset.c); save(); $$('[data-c]', sh).forEach(z => z.classList.toggle('on', z === btn)); refresh(); });
    const refresh = () => { if (RD) redrawParas(b, Math.min(...hs.map(h => h.p)), Math.max(...hs.map(h => h.p))); };
    $('[data-save]', sh).onclick = () => { const v = ta.value.trim(); hs.forEach((h, j) => h.note = j === hs.length - 1 ? v : ''); hs[0].note = v; save(); refresh(); close(); toast(L2('اتحفظ ✓', 'Saved ✓')); if (!RD) render(); };
    $('[data-ask]', sh).onclick = () => { close(); askSheet({src:'book', title:b.t + ' · ' + (chapterOfPara(b, h0.p) || ['', ''])[1], ctx:text, q:ta.value.trim()}); };
    $('[data-copy]', sh).onclick = () => copyText(text + (ta.value.trim() ? '\n— ' + ta.value.trim() : ''));
    const op = $('[data-open]', sh); if (op) op.onclick = () => { close(); openReader(id, h0.p); };
    $('[data-del]', sh).onclick = () => { const x = S.books[id]; x.hl = x.hl.filter(h => h.g !== g); save(); refresh(); close(); if (!RD) render(); };
  });
}
function readerSettings(){
  const r = S.reader;
  const apply = () => { if (!RD) return; RD.el.className = 'reader rt-' + r.theme + (RD.el.classList.contains('bare') ? ' bare' : ''); RD.el.setAttribute('style', readerVars()); ensureAmiri(); save(); };
  sheet('<h2 class="plain">Aa ' + L2('شكل القراية', 'Reading settings') + '</h2>' +
    '<div class="rd-set"><span>' + L2('حجم الخط', 'Text size') + '</span><div class="row"><button class="btn soft" data-fs="-1" aria-label="Smaller">A−</button><b id="fsv">' + r.fs + '</b><button class="btn soft" data-fs="1" aria-label="Bigger">A+</button></div></div>' +
    '<div class="rd-set"><span>' + L2('المسافة بين السطور', 'Line spacing') + '</span><div class="row"><button class="btn soft" data-lh="-0.15">−</button><b id="lhv">' + r.lh.toFixed(2) + '</b><button class="btn soft" data-lh="0.15">+</button></div></div>' +
    '<div class="rd-set"><span>' + L2('الوضع', 'Mode') + '</span><div class="chips">' +
      [['pink', L2('🌸 فاتح', '🌸 Light')], ['sepia', L2('📜 ورق قديم', '📜 Sepia')], ['dark', L2('🌙 ليلي', '🌙 Dark')]].map(t => '<button class="chip' + (r.theme === t[0] ? ' on' : '') + '" data-th="' + t[0] + '">' + t[1] + '</button>').join('') + '</div></div>' +
    '<div class="rd-set"><span>' + L2('الخط', 'Font') + '</span><div class="chips">' +
      [['cairo', 'كايرو'], ['amiri', 'أميري (خط كتب)'], ['system', L2('خط الآيفون', 'iPhone font')]].map(t => '<button class="chip' + (r.font === t[0] ? ' on' : '') + '" data-ff="' + t[0] + '">' + t[1] + '</button>').join('') + '</div></div>' +
    '<p class="small muted" style="margin:0;font-weight:700">' + L2('💡 دوسي على الكلام مرة تختفي الأزرار وتبقى الشاشة كلها للقراية. علّمي على أي جملة بصباعك عشان تلونيها أو تكتبي عليها تعليق.', '💡 Tap the text to hide the bars. Select any sentence to highlight it or add a note.') + '</p>',
  sh => {
    $$('[data-fs]', sh).forEach(btn => btn.onclick = () => { r.fs = Math.max(14, Math.min(34, r.fs + +btn.dataset.fs)); $('#fsv', sh).textContent = r.fs; apply(); });
    $$('[data-lh]', sh).forEach(btn => btn.onclick = () => { r.lh = Math.max(1.5, Math.min(2.7, +(r.lh + +btn.dataset.lh).toFixed(2))); $('#lhv', sh).textContent = r.lh.toFixed(2); apply(); });
    $$('[data-th]', sh).forEach(btn => btn.onclick = () => { r.theme = btn.dataset.th; $$('[data-th]', sh).forEach(z => z.classList.toggle('on', z === btn)); apply(); });
    $$('[data-ff]', sh).forEach(btn => btn.onclick = () => { r.font = btn.dataset.ff; $$('[data-ff]', sh).forEach(z => z.classList.toggle('on', z === btn)); apply(); });
  });
}
function readerTOC(){
  const {b} = RD, x = S.books[b.id], R = bookRanges(b, x.days);
  sheet('<h2 class="plain">☰ ' + L2('الفصول', 'Chapters') + '</h2><div class="list">' +
    b.heads.map(h => { const k = R.findIndex(r => h[0] >= r[0] && h[0] < r[1]); return '<button class="item" data-to="' + h[0] + '"><span class="t">' + esc(h[1]) + '<span class="s">' + L2('اليوم ', 'Day ') + (k + 1) + (x.max >= h[0] ? ' · ✓' : '') + '</span></span><span></span></button>'; }).join('') + '</div>' +
    '<h3>' + L2('أيام الخطة', 'Plan days') + '</h3><div class="list">' + R.map((r, k) => '<button class="item" data-to="' + r[0] + '"><span class="t">' + L2('اليوم ', 'Day ') + (k + 1) + ' · ' + niceDM(addDays(x.start, k)) + '<span class="s">' + esc((chapterOfPara(b, r[0]) || ['', ''])[1]) + '</span></span><span>' + (x.done[k] || x.max >= r[1] - 1 ? '✓' : '') + '</span></button>').join('') + '</div>',
  (sh, close) => $$('[data-to]', sh).forEach(btn => btn.onclick = () => { close(); const t = RD.paras[+btn.dataset.to]; if (t){ const sc = $('#rdScroll', RD.el); sc.scrollTop = t.offsetTop - 70; } }));
}
function highlightsSheet(id, inReader){
  const b = bookById(id), x = S.books[id], groups = [];
  x.hl.forEach(h => { if (!groups.some(g => g.g === h.g)) groups.push(h); });
  groups.sort((a, c) => a.p - c.p || a.s - c.s);
  sheet('<h2 class="plain">🖍️ ' + L2('علاماتي وتعليقاتي', 'My highlights and notes') + ' <span class="pill">' + groups.length + '</span></h2>' +
    (groups.length ? '<div class="list">' + groups.map(h => { const note = hlGroup(id, h.g).map(z => z.note).filter(Boolean)[0] || '';
      return '<button class="hlrow hl-' + h.c + '" data-hg="' + h.g + '" data-p="' + h.p + '"><span class="q" data-notr>' + esc(h.text.length > 220 ? h.text.slice(0, 220) + '…' : h.text) + '</span>' + (note ? '<span class="n">💬 ' + esc(note) + '</span>' : '') + '<span class="s">' + esc((chapterOfPara(b, h.p) || ['', ''])[1]) + '</span></button>'; }).join('') + '</div>' +
      '<button class="btn soft full" data-copyall>📋 ' + L2('انسخي كل العلامات', 'Copy all highlights') + '</button>'
      : '<div class="empty">' + L2('لسه مفيش. علّمي على أي جملة في الكتاب بصباعك وهتلاقي ألوان وتعليق.', 'Nothing yet. Select any sentence while reading.') + '</div>'),
  (sh, close) => {
    $$('[data-hg]', sh).forEach(btn => btn.onclick = () => { close(); if (inReader && RD){ const t = RD.paras[+btn.dataset.p]; if (t) $('#rdScroll', RD.el).scrollTop = t.offsetTop - 90; setTimeout(() => hlSheet(id, btn.dataset.hg), 300); } else hlSheet(id, btn.dataset.hg); });
    const ca = $('[data-copyall]', sh); if (ca) ca.onclick = () => copyText(b.t + '\n\n' + groups.map(h => '• ' + h.text + (hlGroup(id, h.g).map(z => z.note).filter(Boolean)[0] ? '\n  — ' + hlGroup(id, h.g).map(z => z.note).filter(Boolean)[0] : '')).join('\n\n'));
  });
}

/* ---------- home card + Grow › Reading ---------- */
function readHomeHTML(){
  return BOOKS.map(b => { const x = S.books[b.id], st = bookState(b);
    if (st.finished && x.done[x.days - 1] && x.done[x.days - 1] < addDays(todayStr(), -3)) return '';
    const doneToday = st.remToday === 0;
    return '<div class="card readhome"><div class="card-head"><h2>📖 ' + L2('قراية النهارده', 'Reading today') + '</h2><span class="num" style="font-weight:800">' + L2('اليوم ', 'Day ') + (st.k + 1) + ' / ' + x.days + '</span></div>' +
      '<div class="rbook"><span class="rcov">' + b.e + '</span><span class="t" data-notr><b>' + esc(b.t) + '</b><span class="s">' + esc(st.chap ? st.chap[1] : '') + '</span></span></div>' +
      '<div class="bar good"><i style="width:' + st.pct + '%"></i></div>' +
      '<span class="small" style="font-weight:800">' + (st.finished ? L2('🎉 خلصتي الكتاب كله!', '🎉 Book finished!') : doneToday ? L2('✓ خلصتي جزء النهارده · ' + st.pct + '% من الكتاب', '✓ Today’s part is done · ' + st.pct + '%') :
        L2('فاضل ~' + minsOf(st.remToday) + ' دقيقة' + (st.behind ? ' (فيهم ' + st.behind + ' يوم متأخر)' : '') + ' · ' + st.pct + '% من الكتاب', '~' + minsOf(st.remToday) + ' min left' + (st.behind ? ' (incl. ' + st.behind + ' day behind)' : '') + ' · ' + st.pct + '%')) + '</span>' +
      '<div class="row"><button class="btn" data-readopen="' + b.id + '" style="flex:2">' + (x.max < 0 ? L2('ابدئي القراية', 'Start reading') : L2('كمّلي من مكانك', 'Continue reading')) + '</button><button class="btn soft" data-go="grow:read" style="flex:1">' + L2('الخطة', 'Plan') + '</button></div></div>';
  }).join('');
}
VIEWS['grow.read'] = function(el){
  el.innerHTML = BOOKS.map(b => { const x = S.books[b.id], st = bookState(b), R = st.R, groups = new Set(x.hl.map(h => h.g)).size, notes = x.hl.filter(h => h.note).length;
    const week = Object.entries(x.log).sort().slice(-7), mins = week.reduce((a, e) => a + e[1], 0);
    return '<div class="card tint"><div class="rbook big"><span class="rcov">' + b.e + '</span><span class="t" data-notr><b>' + esc(b.t) + '</b><span class="s">' + esc(b.au) + '</span></span></div>' +
      '<div class="bar good"><i style="width:' + st.pct + '%"></i></div>' +
      '<div class="stats3"><div class="stat"><b>' + st.pct + '%</b><span>' + L2('من الكتاب', 'read') + '</span></div><div class="stat"><b>' + groups + '</b><span>' + L2('علامة', 'highlights') + '</span></div><div class="stat"><b>' + minsOf(mins) + '</b><span>' + L2('دقيقة الأسبوع ده', 'min this week') + '</span></div></div>' +
      '<div class="row"><button class="btn" data-readopen="' + b.id + '" style="flex:2">📖 ' + (x.max < 0 ? L2('ابدئي', 'Start') : L2('كمّلي القراية', 'Continue')) + '</button><button class="btn soft" data-hls="' + b.id + '" style="flex:1">🖍️ ' + L2('علاماتي', 'Highlights') + (notes ? ' · 💬' + notes : '') + '</button></div></div>' +
      '<div class="card"><div class="card-head"><h2>' + L2('خطة الـ' + x.days + ' يوم', x.days + '-day plan') + '</h2><span class="small muted" style="font-weight:800">' + L2('تخلص ', 'Ends ') + nice(st.endDate) + '</span></div>' +
      '<div class="row"><label class="field" style="flex:1"><span>' + L2('بدأت يوم', 'Started on') + '</span><input class="in" type="date" data-bstart="' + b.id + '" value="' + x.start + '"></label><label class="field" style="flex:1"><span>' + L2('عدد الأيام', 'Days') + '</span><select class="in" data-bdays="' + b.id + '">' + [7, 10, 14, 15, 20, 30].map(n => '<option' + (n === x.days ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label></div>' +
      '<div class="list">' + R.map((r, k) => { const ok = x.max >= r[1] - 1, cur = k === st.k, chars = b.lens.slice(r[0], r[1]).reduce((a, y) => a + y, 0);
        return '<button class="item rday' + (ok ? ' ok' : '') + (cur ? ' cur' : '') + '" data-rgo="' + b.id + ':' + r[0] + '"><span class="dn">' + (ok ? '✓' : k + 1) + '</span><span class="t">' + L2('اليوم ', 'Day ') + (k + 1) + ' · ' + nice(addDays(x.start, k)) + (cur ? L2(' · النهارده', ' · today') : '') + '<span class="s" data-notr>' + esc((chapterOfPara(b, r[0]) || ['', ''])[1]) + ' · ~' + minsOf(chars) + L2(' دقيقة', ' min') + '</span></span><span></span></button>'; }).join('') + '</div></div>';
  }).join('') +
  '<div class="card"><h2>' + L2('💡 إزاي تقري بتركيز', '💡 Read with focus') + '</h2><p class="small" style="margin:0;font-weight:700;line-height:1.7">' +
    L2('اقري جزء النهارده مرة واحدة من غير ما تقفي (20 دقيقة تقريبًا). علّمي بالأصفر على الأفكار المهمة، وبالوردي على اللي عايزة تفهميه أكتر، وابعتي أي حاجة مش واضحة لـ«اسألي كلود». في آخر كل يوم اكتبي في تعليق جملة واحدة: إيه أهم حاجة اتعلمتها؟',
      'Read today’s part in one sitting (about 20 minutes). Highlight key ideas in yellow and things to dig into in pink, and send anything unclear to “Ask Claude”.') + '</p></div>';
  const again = () => VIEWS['grow.read'](el);
  $$('[data-readopen]', el).forEach(btn => btn.onclick = () => openReader(btn.dataset.readopen));
  $$('[data-hls]', el).forEach(btn => btn.onclick = () => highlightsSheet(btn.dataset.hls));
  $$('[data-rgo]', el).forEach(btn => btn.onclick = () => { const [id, p] = btn.dataset.rgo.split(':'); openReader(id, +p); });
  $$('[data-bstart]', el).forEach(i => i.onchange = () => { if (i.value){ S.books[i.dataset.bstart].start = i.value; save(); again(); } });
  $$('[data-bdays]', el).forEach(i => i.onchange = () => { S.books[i.dataset.bdays].days = +i.value; S.books[i.dataset.bdays].done = {}; save(); again(); });
};
function readReminders(repeat){
  if (S.settings.rem && S.settings.rem.plans === false) return;
  BOOKS.forEach(b => { const st = bookState(b); if (!st.finished) repeat.push({id:'read-' + b.id, title:'\u{1F4D6} ' + b.t, body:'وقت القراية: جزء النهارده حوالي ' + minsOf(bookTotal(b) / S.books[b.id].days) + ' دقيقة. كمّلي من مكانك.', hour:21, minute:30}); });
}

/* ============ ASK CLAUDE LATER ============
   S.askq = [{id, src:'book'|'fr'|'lesson'|'wisdom'|'mine', title, ctx, q, at, done}] */
const ASK_SRC = {book:['📖', 'كتب', 'Books'], fr:['🇫🇷', 'فرنساوي', 'French'], lesson:['🎓', 'دروس', 'Lessons'], wisdom:['💭', 'اقتباسات', 'Quotes'], mine:['❓', 'أسئلتي', 'My questions']};
const ASK_CHIPS = [['اشرحهالي ببساطة كأني أول مرة أسمع عنها', 'Explain it simply'], ['اديني أمثلة من مصر ومن حياتي', 'Give me examples from Egypt'], ['إيه علاقتها بالفلوس والاستثمار؟', 'How does it relate to money?'], ['إزاي أطبقها في حياتي؟', 'How do I apply it?'], ['قولّي النطق والقاعدة وأمثلة جُمل', 'Pronunciation, rule and example sentences']];
function askSheet(pre){
  pre = pre || {};
  sheet('<div style="text-align:center;font-size:40px">🤔</div><h2 class="plain" style="justify-content:center">' + L2('احفظي سؤال لكلود', 'Save a question for Claude') + '</h2>' +
    (pre.ctx ? '<span class="small muted" style="font-weight:800">' + esc(pre.title || '') + '</span><blockquote class="quote" data-notr>' + esc(pre.ctx.length > 900 ? pre.ctx.slice(0, 900) + '…' : pre.ctx) + '</blockquote>' : '') +
    '<label class="field"><span>' + L2('سؤالك', 'Your question') + (pre.ctx ? L2(' (اختياري)', ' (optional)') : '') + '</span><textarea class="in" data-q placeholder="' + L2('مثلًا: يعني إيه الكلام ده؟ اديني مثال…', 'e.g. What does this mean?') + '">' + esc(pre.q || '') + '</textarea></label>' +
    '<div class="chips">' + ASK_CHIPS.map((c, i) => '<button class="chip" data-chip="' + i + '">' + L2(c[0], c[1]) + '</button>').join('') + '</div>' +
    '<button class="btn full" data-save>🤔 ' + L2('احفظي في «اسألي كلود»', 'Save to Ask Claude') + '</button>',
  (sh, close) => {
    const ta = $('[data-q]', sh);
    $$('[data-chip]', sh).forEach(c => c.onclick = () => { const t = L2(ASK_CHIPS[+c.dataset.chip][0], ASK_CHIPS[+c.dataset.chip][1]); ta.value = ta.value.trim() ? ta.value.trim() + '، ' + t : t; });
    $('[data-save]', sh).onclick = () => { const q = ta.value.trim(); if (!q && !pre.ctx) return toast(L2('اكتبي سؤالك', 'Write your question'));
      S.askq.unshift({id:uid(), src:pre.src || 'mine', title:pre.title || '', ctx:pre.ctx || '', q, at:todayStr(), done:false}); save(); close();
      toast(L2('اتحفظ في «اسألي كلود» 🤔', 'Saved to Ask Claude 🤔')); if (!RD && nav.tab === 'grow') render(); };
  });
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-ask-src]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  askSheet({src:b.dataset.askSrc, title:b.dataset.askTitle || '', ctx:b.dataset.askCtx || ''});
}, true);
const askBtn = (src, title, ctx, small) => '<button class="askb' + (small ? ' sm' : '') + '" data-ask-src="' + src + '" data-ask-title="' + esc(title) + '" data-ask-ctx="' + esc(ctx) + '" aria-label="Ask Claude later">🤔' + (small ? '' : ' ' + L2('اسألي كلود', 'Ask Claude')) + '</button>';
function askPrompt(items){
  const head = 'يا كلود، أنا مونمون. جمعت شوية حاجات من التطبيق بتاعي (كتب وفرنساوي ودروس واقتباسات) وعايزاك تشرحهالي بالمصري، ببساطة وبعمق، بأمثلة من الحياة في مصر. لو فيه كلمة فرنساوي قولّي النطق بالعربي ومثال جملة.\n';
  return head + '\n' + items.map((a, i) => (i + 1) + ') [' + ASK_SRC[a.src][1] + (a.title ? ' · ' + a.title : '') + ']' + (a.ctx ? '\n«' + a.ctx + '»' : '') + (a.q ? '\nسؤالي: ' + a.q : '\nسؤالي: اشرحهالي.')).join('\n\n');
}
function copyText(t){
  const done = () => toast(L2('اتنسخ 📋 الصقيه في كلود', 'Copied 📋'));
  try { if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(done, () => legacyCopy(t, done)); } catch(e){}
  legacyCopy(t, done);
}
function legacyCopy(t, done){
  const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
  document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
  let ok = false; try { ok = document.execCommand('copy'); } catch(e){}
  ta.remove(); if (ok) done(); else toast(L2('ماعرفتش أنسخ، جربي «شاركي»', 'Couldn’t copy, try Share'));
}
function openExternal(url){
  if (native()){ const a = document.createElement('a'); a.href = url; document.body.appendChild(a); a.click(); a.remove(); }
  else window.open(url, '_blank', 'noopener');
}
function askClaude(items){
  const p = askPrompt(items); copyText(p);
  const url = 'https://claude.ai/new?q=' + encodeURIComponent(p.length > 6000 ? p.slice(0, 6000) : p);
  setTimeout(() => openExternal(url), 350);
}
VIEWS['grow.ask'] = function(el){
  const f = ui.askF || 'all', showDone = !!ui.askDone, list = S.askq.filter(a => (f === 'all' || a.src === f) && !!a.done === showDone), open = S.askq.filter(a => !a.done);
  el.innerHTML = '<div class="card tint"><div class="greet">🤔 ' + L2('اسألي كلود بعدين', 'Ask Claude later') + '</div><span class="small" style="font-weight:700;line-height:1.6">' +
      L2('أي حاجة مش فاهماها في الكتاب أو الفرنساوي أو الدروس أو الاقتباسات، دوسي 🤔 جنبها وتتحفظ هنا. لما تفضي، ابعتيهم كلهم لكلود مرة واحدة.', 'Tap 🤔 next to anything in books, French, lessons or quotes and it lands here. Send them to Claude when you are free.') + '</span>' +
      '<div class="row"><button class="btn" id="askAll" style="flex:2"' + (open.length ? '' : ' disabled') + '>💬 ' + L2('ابعتي الكل لكلود', 'Send all to Claude') + ' (' + open.length + ')</button><button class="btn soft" id="askCopy" style="flex:1"' + (open.length ? '' : ' disabled') + '>📋 ' + L2('نسخ', 'Copy') + '</button>' + (navigator.share ? '<button class="btn soft" id="askShare" style="flex:1"' + (open.length ? '' : ' disabled') + '>📤</button>' : '') + '</div>' +
      '<span class="small muted" style="font-weight:700">' + L2('«ابعتي لكلود» بتنسخ الأسئلة وتفتح كلود، ولو ماظهرتش الرسالة الصقيها بس.', '“Send” copies everything and opens Claude; paste if it doesn’t appear.') + '</span></div>' +
    '<div class="card"><h2>' + L2('سؤال جديد', 'New question') + '</h2><div class="row"><input class="in" id="askIn" placeholder="' + L2('عايزة أفهم…', 'I want to understand…') + '" style="flex:1"><button class="btn" id="askAdd">' + L2('ضيفي', 'Add') + '</button></div></div>' +
    '<div class="chips"><button class="chip' + (f === 'all' ? ' on' : '') + '" data-af="all">' + L2('الكل', 'All') + '</button>' + Object.entries(ASK_SRC).map(([k, v]) => '<button class="chip' + (f === k ? ' on' : '') + '" data-af="' + k + '">' + v[0] + ' ' + L2(v[1], v[2]) + ' <span class="cnt">' + S.askq.filter(a => a.src === k && !a.done).length + '</span></button>').join('') + '</div>' +
    '<div class="seg mini"><button data-ad="0" aria-pressed="' + !showDone + '">' + L2('لسه', 'Open') + '</button><button data-ad="1" aria-pressed="' + showDone + '">' + L2('اتشرحت ✓', 'Explained ✓') + '</button></div>' +
    (list.length ? list.map(a => '<div class="card askrow' + (a.done ? ' done' : '') + '"><span class="small muted" style="font-weight:900">' + ASK_SRC[a.src][0] + ' ' + L2(ASK_SRC[a.src][1], ASK_SRC[a.src][2]) + (a.title ? ' · <span data-notr>' + esc(a.title) + '</span>' : '') + ' · ' + niceDM(a.at) + '</span>' +
        (a.ctx ? '<blockquote class="quote" data-notr>' + esc(a.ctx.length > 400 ? a.ctx.slice(0, 400) + '…' : a.ctx) + '</blockquote>' : '') +
        '<p class="aq" data-notr>' + (a.q ? '❓ ' + esc(a.q) : '<span class="muted">' + L2('(من غير سؤال: هتطلب شرح)', '(no question: will ask for an explanation)') + '</span>') + '</p>' +
        '<div class="row"><button class="linkbtn" data-aone="' + a.id + '">💬 ' + L2('اسألي عن دي بس', 'Ask just this') + '</button><button class="linkbtn" data-aedit="' + a.id + '">✏️</button><button class="linkbtn" data-adone="' + a.id + '">' + (a.done ? '↩︎ ' + L2('رجّعيها', 'Reopen') : '✓ ' + L2('اتشرحت', 'Explained')) + '</button>' + delBtn('data-adel', a.id) + '</div></div>').join('')
      : '<div class="empty">' + (showDone ? L2('لسه مفيش حاجة اتشرحت.', 'Nothing explained yet.') : L2('مفيش أسئلة هنا. دوسي 🤔 جنب أي حاجة عايزة تفهميها.', 'No questions here yet.')) + '</div>');
  const again = () => VIEWS['grow.ask'](el), opens = () => S.askq.filter(a => !a.done);
  $$('[data-af]', el).forEach(b => b.onclick = () => { ui.askF = b.dataset.af; again(); });
  $$('[data-ad]', el).forEach(b => b.onclick = () => { ui.askDone = b.dataset.ad === '1'; again(); });
  $('#askAll', el).onclick = () => askClaude(opens());
  $('#askCopy', el).onclick = () => copyText(askPrompt(opens()));
  const shb = $('#askShare', el); if (shb) shb.onclick = () => navigator.share({text:askPrompt(opens())}).catch(() => {});
  const add = () => { const v = $('#askIn', el).value.trim(); if (!v) return toast(L2('اكتبي سؤالك', 'Write your question')); S.askq.unshift({id:uid(), src:'mine', title:'', ctx:'', q:v, at:todayStr(), done:false}); save(); again(); };
  $('#askAdd', el).onclick = add; $('#askIn', el).onkeydown = e => { if (e.key === 'Enter') add(); };
  $$('[data-aone]', el).forEach(b => b.onclick = () => askClaude([S.askq.find(a => a.id === b.dataset.aone)]));
  $$('[data-adone]', el).forEach(b => b.onclick = ev => { const a = S.askq.find(x => x.id === b.dataset.adone); a.done = !a.done; save(); if (a.done) hearts(ev.clientX, ev.clientY); again(); });
  $$('[data-aedit]', el).forEach(b => b.onclick = () => { const a = S.askq.find(x => x.id === b.dataset.aedit);
    sheet('<h2 class="plain">✏️ ' + L2('عدّلي السؤال', 'Edit question') + '</h2><label class="field"><span>' + L2('سؤالك', 'Your question') + '</span><textarea class="in" data-q>' + esc(a.q) + '</textarea></label><button class="btn full" data-save>' + L2('حفظ', 'Save') + '</button>',
      (sh, close) => { $('[data-save]', sh).onclick = () => { a.q = $('[data-q]', sh).value.trim(); save(); close(); again(); }; }); });
  armDelete(el, 'data-adel', id => { S.askq = S.askq.filter(a => a.id !== id); save(); again(); });
};
if (growTab){
  if (!growTab.subs.some(x => x[0] === 'read')) growTab.subs.splice(1, 0, ['read', 'Reading']);
  if (!growTab.subs.some(x => x[0] === 'ask')) growTab.subs.splice(3, 0, ['ask', 'Ask Claude']);
}

/* ---------- hook into the home page ---------- */
const _todayView = VIEWS.today;
VIEWS.today = function(el){
  _todayView(el);
  const again = () => VIEWS.today(el);
  const fr = $('.frhome', el), html = readHomeHTML();
  if (html){ if (fr) fr.insertAdjacentHTML('beforebegin', html); else el.insertAdjacentHTML('beforeend', html); }
  $$('[data-readopen]', el).forEach(b => b.onclick = () => openReader(b.dataset.readopen));
  $$('.readhome [data-go]', el).forEach(b => b.onclick = () => { const p = b.dataset.go.split(':'); go(p[0], p[1]); });
  const wz = $('.card.wisdom', el);
  if (wz && !$('.askb', wz)){ const src = $('.src', wz), idea = $('.idea', wz); wz.insertAdjacentHTML('beforeend', askBtn('wisdom', src ? src.textContent.replace(/^\S+\s/, '') : '', idea ? idea.textContent : '', false)); const nb = $('#wzNext', wz); if (nb){ const r = document.createElement('div'); r.className = 'row'; nb.before(r); r.appendChild(nb); r.appendChild($('.askb', wz)); } }
  const ls = $('.card.lesson', el);
  if (ls && !$('.askb', ls)){ const h = $('h2', ls), p = $('p', ls), row = $('.row', ls); if (row) row.insertAdjacentHTML('beforeend', askBtn('lesson', h ? h.textContent : '', (h ? h.textContent + ': ' : '') + (p ? p.textContent : ''), false)); }
  if (typeof frHomeExtra === 'function') frHomeExtra(el, again);
};
const _learnView = VIEWS['grow.learn'];
VIEWS['grow.learn'] = function(el){
  _learnView(el);
  $$('.card.lesson', el).forEach(c => { if ($('.askb', c)) return; const h = $('h2', c), p = $('p', c); c.insertAdjacentHTML('beforeend', '<div class="row">' + askBtn('lesson', h ? h.textContent : '', (h ? h.textContent + ': ' : '') + (p ? p.textContent : ''), false) + '</div>'); });
};
