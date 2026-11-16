/* ============ BEDTIME STORIES (حواديت قبل النوم) ============
   S.stories = {read:{'zamalek-0':date}, last:{id, n}, fs, remind:'23:00', on:true}
   ui.stOpen = {id, n} while reading. */
function stMigrate(){ S.stories = S.stories && typeof S.stories === 'object' ? S.stories : {}; const T = S.stories; T.read = T.read || {}; if (T.fs == null) T.fs = 19; if (!T.remind) T.remind = '23:00'; if (T.on == null) T.on = true; }
const stFind = id => STORIES.find(s => s.id === id);
const stReadN = s => s.n.filter((_, i) => S.stories.read[s.id + '-' + i]).length;
const stNext = s => { const i = s.n.findIndex((_, k) => !S.stories.read[s.id + '-' + k]); return i < 0 ? 0 : i; };
const stMins = n => Math.max(3, Math.round(n.w / 130));
const NIGHT_AR = ['الأولى', 'التانية', 'التالتة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'التامنة', 'التاسعة', 'العاشرة'];
/* the story whose next night is tonight's: the one you're in, else the first unfinished */
function stTonight(){
  const L = S.stories.last, cur = L && stFind(L.id);
  if (cur && stReadN(cur) < cur.n.length) return cur;
  return STORIES.find(s => stReadN(s) < s.n.length) || null;
}

{ const stTab = TABS.find(t => t.id === 'me'); if (stTab && !stTab.subs.some(x => x[0] === 'stories')) stTab.subs.splice(2, 0, ['stories', 'Stories']); }

VIEWS['me.stories'] = function(el){
  stMigrate();
  if (ui.stOpen) return stReader(el);
  const T = S.stories, tn = stTonight();
  el.innerHTML = '<div class="card tint stbanner"><div class="greet">حواديت قبل النوم 🌙</div><span class="small muted" style="font-weight:700">ليلة واحدة كل يوم، 5 دقايق قراية. اقفلي النور، وكبّري الخط، وخلّي الباقي لبكرة.</span>' +
    (tn ? '<button class="btn" data-stgo="' + tn.id + '" data-n="' + stNext(tn) + '">▶ الليلة ' + NIGHT_AR[stNext(tn)] + ' من «' + esc(tn.t) + '»</button>' : '<span class="small" style="font-weight:800">خلّصتي كل الحواديت ✨ اطلبي من كلود حدوتة جديدة.</span>') + '</div>' +
    STORIES.map(s => { const r = stReadN(s), done = r === s.n.length;
      return '<div class="card stcard"><div class="sthead"><span class="ste">' + s.e + '</span><div><h2 class="plain">' + esc(s.t) + '</h2><span class="sttags">' + esc(s.tags) + '</span></div></div>' +
        '<p class="stsub">' + esc(s.sub) + '</p><div class="bar"><i style="width:' + Math.round(r / s.n.length * 100) + '%"></i></div>' +
        '<span class="small muted" style="font-weight:700">' + (done ? '✓ خلّصتيها' : r + ' من ' + s.n.length + ' ليالي') + '</span>' +
        '<div class="stnights">' + s.n.map((n, i) => '<button class="stn' + (T.read[s.id + '-' + i] ? ' on' : '') + '" data-stgo="' + s.id + '" data-n="' + i + '" title="' + esc(n.t) + '">' + (i + 1) + '</button>').join('') + '</div>' +
        '<button class="btn soft" data-stgo="' + s.id + '" data-n="' + (done ? 0 : stNext(s)) + '">' + (done ? '↺ اقريها تاني' : r ? '▶ كمّلي' : '▶ ابدئي') + '</button></div>'; }).join('') +
    '<div class="card"><label class="row" style="justify-content:space-between;font-weight:800"><span>🔔 فكّريني بالحدوتة كل ليلة</span><input type="checkbox" id="stOn"' + (T.on ? ' checked' : '') + '></label>' +
    '<label class="row" style="justify-content:space-between;font-weight:700"><span class="small">الساعة</span><input type="time" id="stAt" value="' + T.remind + '" style="max-width:130px"></label></div>';
  $$('[data-stgo]', el).forEach(b => b.onclick = () => { ui.stOpen = {id:b.dataset.stgo, n:+b.dataset.n}; VIEWS['me.stories'](el); scrollTo({top:0}); });
  $('#stOn', el).onchange = e => { T.on = e.target.checked; save(); };
  $('#stAt', el).onchange = e => { T.remind = e.target.value || '23:00'; save(); };
};

function stReader(el){
  const T = S.stories, s = stFind(ui.stOpen.id); if (!s){ ui.stOpen = null; return VIEWS['me.stories'](el); }
  const i = Math.min(Math.max(0, ui.stOpen.n), s.n.length - 1), n = s.n[i], key = s.id + '-' + i, last = i === s.n.length - 1;
  T.last = {id:s.id, n:i}; save();
  const para = p => p === '---' ? '<div class="stbreak">✦ ✦ ✦</div>' : '<p' + (/^[–-] /.test(p) ? ' class="stq"' : '') + '>' + esc(p).replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') + '</p>';
  el.innerHTML = '<div class="stnight"><div class="stbar"><button class="stx" id="stBack" aria-label="رجوع">‹ الحواديت</button><span class="stsp"></span><button class="stx" data-fs="-1" aria-label="أصغر">A−</button><button class="stx" data-fs="1" aria-label="أكبر">A+</button></div>' +
    '<article class="stbody" data-notr style="font-size:' + T.fs + 'px"><div class="stkick">' + s.e + ' ' + esc(s.t) + ' · ' + (i + 1) + ' من ' + s.n.length + ' · ' + stMins(n) + ' دقايق</div><h1>' + esc(n.t) + '</h1>' + n.p.map(para).join('') + '</article>' +
    '<div class="stend">' + (T.read[key] ? '<span class="small">✓ قريتيها</span>' : '<button class="btn" id="stDone">' + (last ? '✓ خلّصت الحدوتة' : '✓ خلّصت الليلة دي') + '</button>') +
    '<div class="row">' + (i > 0 ? '<button class="stx" data-go="-1">‹ الليلة اللي قبلها</button>' : '') + '<span class="stsp"></span>' + (!last ? '<button class="stx" data-go="1">الليلة اللي بعدها ›</button>' : '') + '</div>' +
    (!last ? '<p class="small stsoft">نامي دلوقتي، والليلة ' + NIGHT_AR[i + 1] + ' مستنياكي بكرة 🌙</p>' : '<p class="small stsoft">تصبحي على خير يا مونمون 💗</p>') + '</div></div>';
  const again = () => stReader(el);
  $('#stBack', el).onclick = () => { ui.stOpen = null; VIEWS['me.stories'](el); scrollTo({top:0}); };
  $$('[data-fs]', el).forEach(b => b.onclick = () => { T.fs = Math.max(15, Math.min(28, T.fs + 2 * +b.dataset.fs)); save(); $('.stbody', el).style.fontSize = T.fs + 'px'; });
  $$('[data-go]', el).forEach(b => b.onclick = () => { ui.stOpen = {id:s.id, n:i + +b.dataset.go}; again(); scrollTo({top:0}); });
  const d = $('#stDone', el); if (d) d.onclick = () => { T.read[key] = todayStr(); save(); again(); };
}

/* tonight's story on the home page, from 8 pm */
const _todaySt = VIEWS.today;
VIEWS.today = function(el){
  _todaySt(el);
  stMigrate();
  const h = new Date().getHours(), tn = stTonight();
  if (!tn || (h < 20 && h > 3)) return;
  const i = stNext(tn);
  el.insertAdjacentHTML('afterbegin', '<div class="card sthome"><span class="tag">🌙 حدوتة الليلة</span><h2 class="plain">' + esc(tn.t) + ' · الليلة ' + NIGHT_AR[i] + '</h2><span class="small">' + esc(tn.n[i].t.replace(/^[^:]*:\s*/, '')) + ' · ' + stMins(tn.n[i]) + ' دقايق</span><button class="btn" data-sthome>▶ اقريها في السرير</button></div>');
  $('[data-sthome]', el).onclick = () => { ui.stOpen = {id:tn.id, n:i}; go('me', 'stories'); scrollTo({top:0}); };
};

/* bedtime reminder */
const _lifeRemSt = lifeReminders;
lifeReminders = function(R, repeat, push, at){
  _lifeRemSt(R, repeat, push, at);
  stMigrate(); const T = S.stories; if (!T.on) return;
  const tn = stTonight(); if (!tn) return;
  const [h, m] = (T.remind || '23:00').split(':').map(Number), i = stNext(tn), t = todayStr();
  for (let k = 0; k < 3; k++){ const j = Math.min(i + k, tn.n.length - 1), day = addDays(t, k);
    push('story-' + day, '🌙 حدوتة الليلة · ' + tn.t, 'الليلة ' + NIGHT_AR[j] + ': ' + tn.n[j].t.replace(/^[^:]*:\s*/, '') + ' · ' + stMins(tn.n[j]) + ' دقايق قبل النوم 💗', at(parseD(day), h, m)); }
};
