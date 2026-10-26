/* ============ HOME (Today) ============
   Wedding tracker on top, then mashawer, tasks, day log, spending, habits split daily/weekly/monthly (3 per row),
   tasks and mashawer on the home page; reading and podcasts open as pop-ups from their habits. */

const PREP_DEFAULTS = [
  ['\u{1F484}','Book the makeup artist'], ['\u{1F457}','Find the dress'], ['\u{1F487}‍♀\u{FE0F}','Find a hairdresser'],
  ['\u{1F484}','Makeup trial'], ['\u{1F487}‍♀\u{FE0F}','Hair trial'], ['\u{1F460}','Shoes and accessories'], ['\u{1F485}','Nails, a few days before'],
];
const MONTHLY_HABITS = [
  {id:'m-lashes', name:'Lashes', e:'\u{1F441}\u{FE0F}', freq:'monthly', target:1, reward:''},
  {id:'m-laser', name:'Laser session', e:'✨', freq:'monthly', target:1, reward:''},
  {id:'m-bath', name:'Moroccan bath', e:'\u{1F6C1}', freq:'monthly', target:1, reward:''},
];
function homeMigrate(){
  if (S.seed5) return;
  S.habits = S.habits.filter(h => h.id !== 'treadmill');
  const gym = S.habits.find(h => h.id === 'gym'); if (gym){ gym.freq = 'weekly'; gym.target = 5; }
  MONTHLY_HABITS.forEach(h => { if (!S.habits.some(x => x.id === h.id)) S.habits.push(Object.assign({}, h)); });
  const have = S.wedding.checklist.map(c => c.title.toLowerCase());
  PREP_DEFAULTS.forEach(([e, t]) => { if (!have.includes(t.toLowerCase())) S.wedding.checklist.push({id:uid(), e, title:t, done:false}); });
  S.wedding.checklist.forEach(c => { if (!c.e) c.e = /shopping/i.test(c.title) ? '\u{1F6CD}\u{FE0F}' : '\u{1F48D}'; });
  if (!S.wedding.beauty.some(b => b.id === 'sb')) S.wedding.beauty.splice(Math.max(0, S.wedding.beauty.findIndex(b => b.id === 'fi')), 0, {id:'sb', name:'Skin booster', e:'\u{1F4A7}', price:'', note:'Price not known yet', planned:'', done:'', spendId:''});
  const lastMonth = (S.profile.wedding || '2026-12-31').slice(0, 7);
  Object.keys(S.selfcare).forEach(k => { if (k <= lastMonth) S.selfcare[k].forEach(s => { if (s.wedding == null) s.wedding = true; }); });
  S.seed5 = true;
}

/* ---------- habits by period ---------- */
function periodCount(h, day){
  if (h.freq === 'weekly') return weekCount(h.id, day);
  if (h.freq === 'monthly'){ const k = day.slice(0, 7), last = new Date(+k.slice(0, 4), +k.slice(5, 7), 0).getDate(); let c = 0; for (let d = 1; d <= last; d++) if (habitDone(h.id, k + '-' + pad(d))) c++; return c; }
  return habitDone(h.id, day) ? 1 : 0;
}

/* ---------- wedding prep: beauty plan, checklist, tagged mashawer and self-care ---------- */
function prepItems(){
  const out = [];
  weddingSessions().forEach(({k, s}) => out.push({key:'s:' + s.id, e:s.e, title:s.name, date:s.planned, done:!!s.done, kind:'Beauty · ' + MONTHS_L[+k.slice(5) - 1]}));
  S.wedding.beauty.forEach(b => out.push({key:'b:' + b.id, e:b.e, title:b.name, date:b.planned, done:!!b.done, kind:'Beauty'}));
  S.wedding.checklist.forEach(c => out.push({key:'c:' + c.id, e:c.e || '\u{1F48D}', title:c.title, date:c.date || '', done:!!c.done, kind:'To do'}));
  S.mashawer.filter(m => m.wedding).forEach(m => out.push({key:'m:' + m.id, e:'\u{1F4CD}', title:m.name, date:m.date, done:!!m.done, kind:'Meshwar'}));
  (S.wedding.shopping || []).forEach(x => out.push({key:'w:' + x.id, e:x.e, title:x.title, date:'', done:!!x.done, kind:'Shopping'}));
  return out;
}
function logPaid(item, cat){
  S.spend = S.spend.filter(x => x.id !== item.spendId); item.spendId = '';
  if (item.done && +item.price > 0){ item.spendId = uid(); S.spend.push({id:item.spendId, date:item.done, amount:+item.price, cat, note:item.e + ' ' + item.name}); }
}
function togglePrep(key){
  const [k, id] = key.split(':'), t = todayStr();
  if (k === 'b'){ const b = S.wedding.beauty.find(x => x.id === id); b.done = b.done ? '' : t; logPaid(b, 'wedding'); }
  if (k === 'c'){ const c = S.wedding.checklist.find(x => x.id === id); c.done = !c.done; }
  if (k === 'm'){ const m = S.mashawer.find(x => x.id === id); m.done = !m.done; m.doneOn = m.done ? t : ''; }
  if (k === 's') Object.values(S.selfcare).forEach(l => l.forEach(s => { if (s.id === id){ s.done = s.done ? '' : t; logPaid(s, s.wedding ? 'wedding' : 'selfcare'); scHabit(s); } }));
  if (k === 'w'){ const x = S.wedding.shopping.find(y => y.id === id); x.done = !x.done; }
  save();
  const all = prepItems(); if (all.length && all.every(x => x.done)) celebrate({key:'prep-all', e:'\u{1F470}', title:'Wedding prep complete!', msg:'Everything on your list is done. Now enjoy every moment, bride.'});
}
function weddingTrackerHTML(){
  const W = S.profile.wedding, wd = weddingDays(), items = prepItems(), done = items.filter(x => x.done).length, t = todayStr();
  const next = items.filter(x => !x.done).sort((a, b) => (a.date || '9') < (b.date || '9') ? -1 : 1).slice(0, 4);
  return '<div class="card wedtrack">' +
    '<div class="wtop">' + (W ? '<span class="wn num">' + Math.max(0, wd) + '</span><span><b style="display:block;font-size:16px">' + (wd <= 0 ? 'Your wedding day! \u{1F48D}' : 'days to your wedding \u{1F48D}') + '</b><span class="small" style="font-weight:700">' + nice(W) + '</span></span>'
      : '<span style="font-size:36px">\u{1F48D}</span><span style="min-width:0"><b style="display:block">Wedding tracker</b><label class="field" style="margin-top:6px"><span>Set your wedding date</span><input class="in" id="hwDate" type="date"></label></span>') + '</div>' +
    '<div class="statrow" style="color:var(--ink)"><span>Wedding preparations</span><span class="num">' + done + ' / ' + items.length + ' done</span></div><div class="bar good"><i style="width:' + (items.length ? done / items.length * 100 : 0) + '%"></i></div>' +
    '<div class="list">' + (next.length ? next.map(x => '<button class="item" data-prep="' + x.key + '"><span class="tick">' + CHECK + '</span><span class="t">' + x.e + ' ' + esc(x.title) + '<span class="s">' + x.kind + (x.date ? ' · ' + (x.date < t ? 'was ' : '') + nice(x.date) : '') + '</span></span><span></span></button>').join('') : '<div class="empty">Everything is done \u{1F389}</div>') + '</div>' +
    '<button class="linkbtn" data-go="plans:wedding" style="align-self:flex-start">Open wedding preparations ›</button></div>';
}

/* ---------- habits ---------- */
function habitsHTML(day){
  const group = (freq, title) => {
    const list = S.habits.filter(h => (h.freq || 'daily') === freq); if (!list.length) return '';
    return '<h3>' + title + '</h3><div class="hgrid hg3">' + list.map(h => {
      const on = habitDone(h.id, day), c = periodCount(h, day), met = freq !== 'daily' && c >= h.target, st = freq === 'daily' ? streakOf(h.id) : 0;
      const sub = freq === 'daily' ? (h.id === 'read' ? '5+ pages' : h.id === 'listen' ? 'tap to log' : 'today') : c + '/' + h.target + (freq === 'weekly' ? ' this week' : ' this month');
      return '<button class="habit mini' + (on ? ' on' : '') + (met && !on ? ' met' : '') + '" data-h="' + h.id + '" aria-pressed="' + on + '"><span class="e">' + h.e + '</span><span class="hl">' + esc(h.name) + '</span><span class="hs">' + sub + '</span>' + (st >= 2 ? '<span class="fire">\u{1F525}' + st + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  };
  const daily = S.habits.filter(x => x.freq === 'daily');
  return '<div class="card"><div class="card-head"><h2>Today’s habits</h2><button class="linkbtn" data-go="me:habits">Customize</button></div>' +
    group('daily', 'Daily') + group('weekly', 'Weekly') + group('monthly', 'Monthly') +
    (daily.length && daily.every(x => habitDone(x.id, day)) ? '<p class="small" style="margin:0;text-align:center;font-weight:900;color:var(--mint)">\u{1F451} All daily habits done. Proud of you!</p>' : '') + '</div>';
}
function mediaSheet(kind, day, done){
  const m = S.media[day] || {}, isRead = kind === 'read', on = habitDone(kind, day);
  sheet('<div style="text-align:center;font-size:44px">' + (isRead ? '\u{1F4D6}' : '\u{1F3A7}') + '</div><h2 class="plain" style="justify-content:center">' + (isRead ? 'Reading today' : 'Listening today') + '</h2>' +
    (isRead ? '<label class="field"><span>Book</span><input class="in" data-book placeholder="What are you reading?" value="' + esc(m.book || S.lastBook || '') + '"></label><label class="field"><span>Pages today</span><input class="in num" data-pages type="number" inputmode="numeric" min="0" value="' + esc(m.pages || '') + '"></label><p class="small muted" style="margin:0;font-weight:700">5 pages or more ticks the habit.</p>'
      : '<label class="field"><span>Podcast or episode</span><input class="in" data-ep placeholder="El Da7ee7, El Hadara…" value="' + esc(m.episode || '') + '"></label>') +
    '<button class="btn full" data-save>Save</button>' + (on ? '<button class="btn soft full" data-undo>Mark as not done</button>' : ''),
  (sh, close) => {
    $('[data-save]', sh).onclick = ev => {
      const cur = S.media[day] = S.media[day] || {};
      if (isRead){ cur.book = $('[data-book]', sh).value.trim(); cur.pages = +$('[data-pages]', sh).value || 0; if (cur.book) S.lastBook = cur.book; save(); close(); if (cur.pages >= 5) setHabit('read', day, true, ev); else toast('Saved. 5 pages ticks it ♡'); }
      else { cur.episode = $('[data-ep]', sh).value.trim(); save(); close(); if (cur.episode) setHabit('listen', day, true, ev); }
      done();
    };
    const u = $('[data-undo]', sh); if (u) u.onclick = () => { setHabit(kind, day, false); close(); done(); };
  });
}

/* ---------- tasks and mashawer on home ---------- */
function tasksHTML(){
  const t = todayStr(), order = {urgent:0, high:1};
  const sort = (a, b) => ((order[a.prio] ?? 2) - (order[b.prio] ?? 2)) || ((a.due || '9') < (b.due || '9') ? -1 : 1);
  const row = x => '<div class="item"><button class="tick" data-htdone="' + x.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + (x.job ? '<span class="pill">' + esc(jobName(x.job)) + '</span>' : '') + (x.prio && x.prio !== 'normal' ? '<span class="pill ' + PRIO[x.prio].c + '">' + PRIO[x.prio].l + '</span>' : '') + esc(x.title) + (x.due ? '<span class="s" style="' + (x.due < t ? 'color:var(--danger);font-weight:900' : '') + '">' + (x.due < t ? 'Overdue · ' : 'Due ') + nice(x.due) + (x.time ? ' · by ' + x.time : '') + '</span>' : '') + '</span><span></span></div>';
  const w = S.tasks.filter(x => !x.done && x.kind === 'work').sort(sort), p = S.tasks.filter(x => !x.done && x.kind !== 'work').sort(sort);
  return '<div class="card"><div class="card-head"><h2>Tasks</h2><button class="linkbtn" data-go="plans:tasks">All tasks</button></div>' +
    '<div class="row"><label class="field" style="flex:2 1 150px"><input class="in" id="htIn" placeholder="Add a task…" aria-label="New task"></label><label class="field" style="flex:1 1 100px"><select class="in" id="htFor" aria-label="For"><option value="personal">Personal</option>' + S.jobs.map(j => '<option value="' + j.id + '">' + esc(j.name) + '</option>').join('') + '</select></label><button class="btn" id="htAdd">Add</button></div>' +
    '<h3>\u{1F4BC} Work · ' + w.length + '</h3><div class="list">' + (w.length ? w.slice(0, 6).map(row).join('') : '<div class="empty">No open work tasks.</div>') + '</div>' +
    '<h3>✅ My to-dos · ' + p.length + '</h3><div class="list">' + (p.length ? p.slice(0, 6).map(row).join('') : '<div class="empty">Nothing on your list.</div>') + '</div></div>';
}
function mashawerHTML(){
  const t = todayStr(), up = S.mashawer.filter(m => !m.done).sort((a, b) => ((a.date || '9') + (a.time || '')) < ((b.date || '9') + (b.time || '')) ? -1 : 1);
  return '<div class="card"><div class="card-head"><h2>Mashawer</h2><button class="linkbtn" data-go="plans:mashawer">All</button></div>' +
    '<div class="row"><label class="field" style="flex:2 1 140px"><input class="in" id="hmIn" placeholder="Where to?" aria-label="Where"></label><label class="field" style="flex:1 1 120px"><input class="in" id="hmDate" type="date" value="' + t + '" aria-label="Day"></label></div>' +
    '<div class="row"><button class="chip" id="hmWed" aria-pressed="false">\u{1F48D} Wedding prep</button><span style="flex:1"></span><button class="btn" id="hmAdd">Add</button></div>' +
    '<div class="list">' + (up.length ? up.slice(0, 5).map(m => '<div class="item"><button class="tick" data-hmdone="' + m.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + (m.wedding ? '<span class="pill wedpill">\u{1F48D} Wedding prep</span>' : '') + esc(m.name) + '<span class="s">' + (m.date ? (m.date < t ? 'Missed · ' : '') + nice(m.date) : 'No date') + (m.time ? ' · ' + m.time : '') + '</span></span><span></span></div>').join('') : '<div class="empty">No mashawer planned.</div>') + '</div></div>';
}

/* ---------- beauty and pampering, shopping list ---------- */
function beautyHTML(){
  const t = todayStr(), now = new Date(), next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const sec = k => { const L = (S.selfcare[k] || []).slice().sort((a, b) => (a.planned || '9') < (b.planned || '9') ? -1 : 1); if (!L.length) return '';
    return '<h3>' + MONTHS_L[+k.slice(5) - 1] + ' · ' + L.filter(s => s.done).length + '/' + L.length + ' done</h3><div class="list">' + L.map(s => '<button class="item' + (s.done ? ' done' : '') + '" data-bt="' + s.id + '"><span class="tick' + (s.done ? ' on' : '') + '">' + CHECK + '</span><span class="t">' + s.e + ' ' + esc(s.name) + (s.wedding ? ' \u{1F48D}' : '') +
      '<span class="s">' + (s.done ? 'Done ' + nice(s.done) : s.planned ? (s.planned < t ? 'Was due ' : '') + nice(s.planned) : 'No date yet') + (s.price ? ' · ' + money(s.price) : '') + '</span></span><span></span></button>').join('') + '</div>'; };
  const body = sec(ym(now)) + sec(ym(next));
  return '<div class="card"><div class="card-head"><h2>Beauty and pampering</h2><button class="linkbtn" data-go="plans:wedding">All months</button></div>' + (body || '<div class="empty">No sessions planned. Plan them in Plans › Self-care.</div>') + '</div>';
}
function shopHTML(){
  const L = S.wedding.shopping || [], open = L.filter(x => !x.done), got = L.filter(x => x.done);
  const row = x => '<button class="item' + (x.done ? ' done' : '') + '" data-hs="' + x.id + '"><span class="tick' + (x.done ? ' on' : '') + '">' + CHECK + '</span><span class="t">' + x.e + ' ' + esc(x.title) + '</span><span></span></button>';
  return '<div class="card"><div class="card-head"><h2>Shopping list</h2><span class="num muted">' + got.length + '/' + L.length + ' bought</span></div>' +
    '<div class="row"><label class="field"><input class="in" id="hsIn" placeholder="Add something to buy…" aria-label="New item"></label><button class="btn" id="hsAdd">Add</button></div>' +
    '<div class="list">' + (open.length ? open.map(row).join('') : '<div class="empty">Everything is bought \u{1F389}</div>') + got.map(row).join('') + '</div>' +
    '<p class="small muted" style="margin:0">Big buys still get the 48-hour wait. Ticked items stay at the bottom.</p></div>';
}

/* ---------- the home view ---------- */
VIEWS.today = function(el){
  const day = todayStr(), doy = dayOfYear(new Date());
  const n = planDayNum(new Date()), inPlan = n >= 1 && n <= 30;
  const diary = S.diary[day] || {}, logs = S.daylog[day] || [], qa = S.qa[day] || {};
  const qs = [0, 1, 2].map(i => (doy * 3 + i) % QUESTIONS.length);
  const urg = urgentTasks(), ins = INSIGHTS[(doy + (S.insightShift || 0)) % INSIGHTS.length], wz = WISDOM[(doy + (S.wisdomShift || 0)) % WISDOM.length];
  const todaySpend = S.spend.filter(s => s.date === day);
  const coming = [];
  S.exp.filter(x => !x.done && x.date && x.date >= day).forEach(x => coming.push({d:x.date, e:'✨', title:x.title, when:nice(x.date) + (x.with && x.with.length ? ' · with ' + x.with.join(', ') : '')}));
  coming.sort((a, b) => a.d < b.d ? -1 : 1);
  el.innerHTML =
    weddingTrackerHTML() +
    (urg.length ? '<div class="urgent"><h2>Do these first</h2>' + urg.slice(0, 4).map(x => '<button class="ur" data-udone="' + x.id + '"><span class="tick">' + CHECK + '</span><span><span class="pill" style="background:#fff;color:' + (x.prio === 'urgent' ? 'var(--danger)' : '#a86d00') + '">' + (x.prio === 'urgent' ? '\u{1F6A8} URGENT' : '⚠\u{FE0F} SOON') + '</span>' + esc(x.title) + (x.due ? '<span style="display:block;font-size:12px;opacity:.92">' + (x.due < day ? 'Overdue · ' : '') + nice(x.due) + (x.time ? ' · by ' + x.time : '') + '</span>' : '') + '</span></button>').join('') + '</div>' : '') +
    '<div class="card wisdom"><span class="src">\u{1F4DA} ' + esc(wz.src) + '</span><p class="idea">' + esc(wz.idea) + '</p><p class="todo"><b>Try this today</b>' + esc(wz.advice) + '</p><button class="linkbtn" id="wzNext" style="align-self:flex-start;background:var(--surface);color:var(--berry)">Another one</button></div>' +
    mashawerHTML() +
    tasksHTML() +
    '<div class="card"><h2>What did I do today?</h2><div class="chips">' + DAYLOG.map(x => '<button class="chip' + (logs.includes(x.id) ? ' on' : '') + '" data-l="' + x.id + '">' + x.e + ' ' + x.name + '</button>').join('') + '</div></div>' +
    '<div class="card"><div class="card-head"><h2>Spent today</h2><span class="amt">' + money(spentOn(day)) + '</span></div>' +
      '<div class="row"><label class="field" style="flex:1 1 90px"><span>Amount</span><input class="in num" id="qAmt" type="number" inputmode="decimal" min="0" placeholder="0"></label>' +
      '<label class="field" style="flex:2 1 150px"><span>Category</span><select class="in" id="qCat">' + CATS.map(c => '<option value="' + c.id + '">' + c.e + ' ' + c.name + '</option>').join('') + '</select></label></div>' +
      '<div class="row"><label class="field"><span>Note</span><input class="in" id="qNote" placeholder="What was it?"></label><button class="btn" id="qAdd">Add</button></div>' +
      '<div class="list">' + (todaySpend.length ? todaySpend.map(spendRow).join('') : '<div class="empty">Nothing spent yet today.</div>') + '</div></div>' +
    habitsHTML(day) +
    '<div class="card"><div class="card-head"><h2>Dear diary</h2><span class="small muted">' + nice(day) + '</span></div>' +
      '<div class="moods">' + MOODS.map((m, i) => '<button class="mood' + (diary.mood === i + 1 ? ' on' : '') + '" data-mood="' + (i + 1) + '" aria-label="' + m.t + '">' + m.e + '<span>' + m.t + '</span></button>').join('') + '</div>' +
      '<h3>Today’s 3 questions</h3>' + qs.map(q => '<label class="field"><span class="qlab">' + esc(QUESTIONS[q]) + '</span><textarea class="in" data-q="' + q + '" placeholder="My answer…" style="min-height:50px">' + esc(qa[q] || '') + '</textarea></label>').join('') +
      '<label class="field"><span>What I did</span><textarea class="in" id="dSum" placeholder="A little summary of my day…">' + esc(diary.summary || '') + '</textarea></label>' +
      '<label class="field"><span>How I felt</span><textarea class="in" id="dFeel" placeholder="My feelings today…">' + esc(diary.feelings || '') + '</textarea></label>' +
      '<label class="field"><span>Quick notes and drafts</span><textarea class="in" id="dNote" placeholder="Anything to remember about today…">' + esc(S.notes[day] || '') + '</textarea></label>' +
      '<button class="linkbtn" data-go="me:days" style="align-self:flex-start">See my whole day ›</button></div>' +
    beautyHTML() +
    shopHTML() +
    lifeTodayTop() +
    lifeTodayMid() +
    (coming.length ? '<div class="card"><div class="card-head"><h2>Coming up</h2><button class="linkbtn" data-go="plans:exp">Experiences</button></div><div class="list">' + coming.slice(0, 4).map(c => '<div class="item"><span style="font-size:20px">' + c.e + '</span><span class="t">' + esc(c.title) + '<span class="s">' + c.when + '</span></span><span></span></div>').join('') + '</div></div>' : '') +
    (inPlan ? '<div class="card"><div class="card-head"><h2>Next meal</h2><button class="linkbtn" data-go="food">Food</button></div>' + nextMealHTML(n) + '</div>' : '') +
    '<div class="card insight"><span class="tag">Did you know · ' + ins[0] + '</span><p>' + esc(ins[1]) + '</p><button class="linkbtn" id="insNext" style="align-self:flex-start;background:var(--surface);color:var(--lilac)">Another one</button></div>';

  const again = () => VIEWS.today(el);
  $$('[data-bt]', el).forEach(b => b.onclick = ev => { const was = b.classList.contains('done'); togglePrep('s:' + b.dataset.bt); if (!was){ hearts(ev.clientX, ev.clientY); toast('Logged. Glowing! ♡'); } again(); });
  $$('[data-hs]', el).forEach(b => b.onclick = ev => { const was = b.classList.contains('done'); togglePrep('w:' + b.dataset.hs); if (!was) hearts(ev.clientX, ev.clientY); again(); });
  const addHS = () => { const v = $('#hsIn', el).value.trim(); if (!v) return toast('What do you need to buy?'); S.wedding.shopping.push({id:uid(), e:'\u{1F6CD}\u{FE0F}', title:v, done:false}); save(); again(); };
  $('#hsAdd', el).onclick = addHS; $('#hsIn', el).onkeydown = e => { if (e.key === 'Enter') addHS(); };
  const hw = $('#hwDate', el); if (hw) hw.onchange = e => { S.profile.wedding = e.target.value; save(); toast('Countdown started \u{1F48D}'); again(); };
  $$('[data-prep]', el).forEach(b => b.onclick = ev => { togglePrep(b.dataset.prep); hearts(ev.clientX, ev.clientY); toast('Done! One step closer \u{1F48D}'); again(); });
  $$('[data-h]', el).forEach(b => b.onclick = ev => { const id = b.dataset.h;
    if (id === 'read' || id === 'listen') return mediaSheet(id, day, again);
    setHabit(id, day, !habitDone(id, day), ev); again(); });
  $('#htAdd', el).onclick = () => { const v = $('#htIn', el).value.trim(), f = $('#htFor', el).value; if (!v) return toast('Write the task');
    S.tasks.push({id:uid(), title:v, kind:f === 'personal' ? 'personal' : 'work', job:f === 'personal' ? '' : f, prio:'normal', due:'', time:'', done:false}); save(); again(); };
  $('#htIn', el).onkeydown = e => { if (e.key === 'Enter') $('#htAdd', el).click(); };
  $$('[data-htdone]', el).forEach(b => b.onclick = ev => { const x = S.tasks.find(y => y.id === b.dataset.htdone); x.done = true; x.doneOn = day; save(); hearts(ev.clientX, ev.clientY); toast('Done! One less thing ♡'); again(); });
  let wed = false; $('#hmWed', el).onclick = () => { wed = !wed; $('#hmWed', el).classList.toggle('on', wed); $('#hmWed', el).setAttribute('aria-pressed', wed); };
  $('#hmAdd', el).onclick = () => { const v = $('#hmIn', el).value.trim(); if (!v) return toast('Where are you going?');
    S.mashawer.push({id:uid(), name:v, date:$('#hmDate', el).value, time:'', note:'', remind:true, wedding:wed, done:false}); save(); toast('Added. I’ll remind you a day before.'); again(); };
  $$('[data-hmdone]', el).forEach(b => b.onclick = ev => { const m = S.mashawer.find(x => x.id === b.dataset.hmdone); m.done = true; m.doneOn = day; const a = S.daylog[day] = S.daylog[day] || []; if (!a.includes('meshwar')) a.push('meshwar'); save(); hearts(ev.clientX, ev.clientY); again(); });
  $$('[data-l]', el).forEach(b => b.onclick = () => { const arr = S.daylog[day] = S.daylog[day] || []; const i = arr.indexOf(b.dataset.l); if (i >= 0) arr.splice(i, 1); else arr.push(b.dataset.l); b.classList.toggle('on'); save(); });
  $$('[data-mood]', el).forEach(b => b.onclick = () => { S.diary[day] = S.diary[day] || {}; S.diary[day].mood = +b.dataset.mood; save(); $$('[data-mood]', el).forEach(x => x.classList.toggle('on', x === b)); });
  const dSet = (k, v) => { S.diary[day] = S.diary[day] || {}; S.diary[day][k] = v; save(); };
  $('#dSum', el).oninput = e => dSet('summary', e.target.value);
  $('#dFeel', el).oninput = e => dSet('feelings', e.target.value);
  $('#dNote', el).oninput = e => { S.notes[day] = e.target.value; save(); };
  $$('[data-q]', el).forEach(t => t.oninput = () => { S.qa[day] = S.qa[day] || {}; S.qa[day][t.dataset.q] = t.value; save(); });
  $('#qAdd', el).onclick = () => { const amt = +$('#qAmt', el).value; if (!(amt > 0)) return toast('Enter an amount'); S.spend.push({id:uid(), date:day, amount:amt, cat:$('#qCat', el).value, note:$('#qNote', el).value.trim()}); save(); toast('Added ' + money(amt)); again(); };
  bindSpendDeletes(el, again);
  $$('[data-go]', el).forEach(b => b.onclick = () => { const p = b.dataset.go.split(':'); go(p[0], p[1]); });
  $$('[data-udone]', el).forEach(b => b.onclick = ev => { const x = S.tasks.find(y => y.id === b.dataset.udone); x.done = true; x.doneOn = day; save(); hearts(ev.clientX, ev.clientY); toast('Done! One less thing ♡'); again(); });
  $('#wzNext', el).onclick = () => { S.wisdomShift = (S.wisdomShift || 0) + 1; save(); again(); };
  bindLifeToday(el, again);
  $('#insNext', el).onclick = () => { S.insightShift = (S.insightShift || 0) + 1; save(); again(); setTimeout(() => { const i = $('.insight'); if (i) i.scrollIntoView({block:'center'}); }, 0); };
  const nm = $('[data-nextmeal]', el); if (nm) nm.onclick = ev => { toggleMeal(nm.dataset.nextmeal, ev); again(); };
};

/* ---------- mashawer with a wedding-prep tag ---------- */
VIEWS['plans.mashawer'] = function(el){
  const t = todayStr();
  const up = S.mashawer.filter(m => !m.done).sort((a, b) => ((a.date || '9') + (a.time || '')) < ((b.date || '9') + (b.time || '')) ? -1 : 1);
  const done = S.mashawer.filter(m => m.done).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 15);
  const row = m => '<div class="item' + (m.done ? ' done' : '') + '"><button class="tick' + (m.done ? ' on' : '') + '" data-mdone="' + m.id + '" aria-label="Mark done">' + CHECK + '</button><span class="t">' + (m.wedding ? '<span class="pill wedpill">\u{1F48D} Wedding prep</span>' : '') + esc(m.name) + '<span class="s">' + (m.date ? nice(m.date) : 'No date') + (m.time ? ' · ' + m.time : '') + (m.date && m.date < t && !m.done ? ' · missed' : '') + (m.remind !== false && !m.done ? ' · \u{1F514} day before' : '') + '</span>' + (m.note ? '<span class="s" style="color:var(--ink);font-weight:600">' + esc(m.note) + '</span>' : '') + '</span><span style="display:flex;gap:2px"><button class="tagw' + (m.wedding ? ' on' : '') + '" data-mw="' + m.id + '" aria-label="Wedding prep tag">\u{1F48D}</button>' + delBtn('data-mdel', m.id) + '</span></div>';
  el.innerHTML = '<div class="card"><h2>New meshwar</h2><label class="field"><span>Where</span><input class="in" id="pName" placeholder="Bank, tailor, bridal shop, clinic…"></label>' +
    '<div class="row"><label class="field"><span>Day</span><input class="in" id="pDate" type="date" value="' + t + '"></label><label class="field"><span>Time</span><input class="in" id="pTime" type="time" value="12:00"></label></div>' +
    '<label class="field"><span>Note</span><input class="in" id="pNote" placeholder="What to bring or do there"></label>' +
    '<button class="toggle" id="pWed"><span class="sw" role="switch" aria-checked="false"></span><span>\u{1F48D} Wedding preparation</span></button>' +
    '<button class="toggle" id="pRem"><span class="sw" role="switch" aria-checked="true"></span><span>Remind me a day before</span></button><button class="btn full" id="pAdd">Add meshwar</button></div>' +
    '<div class="card"><h2>Coming up</h2><div class="list">' + (up.length ? up.map(row).join('') : '<div class="empty">No mashawer planned.</div>') + '</div><p class="small muted" style="margin:0">Tap \u{1F48D} on any meshwar to add it to your wedding preparations.</p></div>' +
    (done.length ? '<div class="card"><h2>Done</h2><div class="list">' + done.map(row).join('') + '</div></div>' : '');
  const again = () => VIEWS['plans.mashawer'](el);
  let rem = true, wed = false;
  $('#pRem', el).onclick = () => { rem = !rem; $('#pRem .sw', el).setAttribute('aria-checked', rem); };
  $('#pWed', el).onclick = () => { wed = !wed; $('#pWed .sw', el).setAttribute('aria-checked', wed); };
  $('#pAdd', el).onclick = () => { const name = $('#pName', el).value.trim(); if (!name) return toast('Where are you going?');
    S.mashawer.push({id:uid(), name, date:$('#pDate', el).value, time:$('#pTime', el).value, note:$('#pNote', el).value.trim(), remind:rem, wedding:wed, done:false}); save(); toast(rem ? 'Added. I’ll remind you a day before.' : 'Meshwar added'); again(); };
  $$('[data-mw]', el).forEach(b => b.onclick = () => { const m = S.mashawer.find(x => x.id === b.dataset.mw); m.wedding = !m.wedding; save(); toast(m.wedding ? 'Added to wedding prep \u{1F48D}' : 'Removed from wedding prep'); again(); });
  $$('[data-mdone]', el).forEach(b => b.onclick = ev => { const m = S.mashawer.find(x => x.id === b.dataset.mdone); m.done = !m.done; m.doneOn = m.done ? t : '';
    if (m.done){ hearts(ev.clientX, ev.clientY); const a = S.daylog[t] = S.daylog[t] || []; if (!a.includes('meshwar')) a.push('meshwar'); } save(); again(); });
  armDelete(el, 'data-mdel', id => { S.mashawer = S.mashawer.filter(m => m.id !== id); save(); again(); });
};


/* ============ WEDDING PLAN, MONTH BY MONTH (wedding 31 Dec 2026) ============
   Beauty sessions live in Self-care, in the month they happen, tagged 💍. The wedding page groups them by month. */
const WED_PLAN = [
  // [key, name, emoji, price, date, note]
  ['hl1','Hair laser · session 1','✨',5000,'2026-10-28'], ['ls1','Lashes · session 1','\u{1F441}\u{FE0F}','','2026-10-29'],
  ['dy','Dr. Yasser Bleil','\u{1FA7A}','','2026-10-31'], ['pc1','Pico laser · session 1','\u{1F48E}',5000,'2026-11-01'], ['hd','Hair dye','\u{1F487}‍♀\u{FE0F}',10000,'2026-11-03'],
  ['ht','Hair treatment','\u{1F486}‍♀\u{FE0F}',7500,'2026-11-07','5,000–10,000'], ['sv1','Spider veins laser · session 1','\u{1F9B5}',6000,'2026-11-10'],
  ['bp','Butt peeling','\u{1F351}','','2026-11-14'], ['dp','Dermapen','\u{1FAA1}','','2026-11-17'], ['mb1','Moroccan bath · 1','\u{1F6C1}','','2026-11-20'],
  ['fi','Filler: lips 0.5 ml, cheeks 1 ml','\u{1F48B}','','2026-11-24','Price per ml not known yet'], ['hl2','Hair laser · session 2','✨',5000,'2026-11-25'], ['ls2','Lashes · session 2','\u{1F441}\u{FE0F}','','2026-11-26'],
  ['pc2','Pico laser · session 2','\u{1F48E}',5000,'2026-12-01'], ['bo','Botox: crow’s feet, nose','\u{1F4AB}','','2026-12-05','Price not known yet'], ['sb','Skin booster','\u{1F4A7}','','2026-12-08'],
  ['sv2','Spider veins laser · session 2','\u{1F9B5}',6000,'2026-12-10'], ['hl3','Hair laser · session 3','✨',5000,'2026-12-20'],
  ['ls3','Lashes · session 3','\u{1F441}\u{FE0F}','','2026-12-27'], ['mb2','Moroccan bath · 2','\u{1F6C1}','','2026-12-29'],
];
const WED_MATCH = {hl:/hair laser|laser hair|^laser\b/i, ls:/lash/i, pc:/pico/i, hd:/dye/i, ht:/treatment/i, sv:/spider/i, bp:/peel/i, dp:/dermapen|derma pen/i, mb:/moroccan|bath/i, fi:/filler/i, bo:/botox/i, sb:/booster/i};
const WED_SHOP = [['\u{1FA72}','Panties'],['\u{1F459}','More lingerie (cosplay)'],['\u{1F9F4}','Perfumes'],['\u{1F9F4}','Body lotion'],['\u{1F4A6}','Body splash'],['\u{1F6C1}','Body care'],
  ['\u{1F9E5}','Winter clothes'],['\u{1F457}','Summer clothes'],['\u{1F456}','Trousers'],['\u{1F45F}','Sneakers'],['\u{1F462}','Boots'],['\u{1F484}','Makeup'],['\u{1FA73}','Shorts'],['\u{1F460}','Heels and ballerinas'],['\u{2708}\u{FE0F}','Honeymoon clothes']];
const HOME_HABITS = [
  {id:'moist', name:'Moisturise my body', e:'\u{1F9F4}', freq:'daily', target:1, reward:''},
  {id:'nails', name:'Nails at home', e:'\u{1F485}', freq:'weekly', target:1, reward:''},
  {id:'pedi', name:'Pedicure in the shower', e:'\u{1F9B6}', freq:'weekly', target:1, reward:''},
];
function weddingSessions(){ const out = []; Object.keys(S.selfcare).sort().forEach(k => S.selfcare[k].forEach(s => { if (s.wedding) out.push({k, s}); })); return out; }
function scHabit(s){
  if (!s.done) return;
  const id = /lash/i.test(s.name) ? 'm-lashes' : /moroccan|bath/i.test(s.name) ? 'm-bath' : (/laser/i.test(s.name) && !/pico|spider/i.test(s.name)) ? 'm-laser' : '';
  if (id && S.habits.some(h => h.id === id)){ S.hlog[s.done] = S.hlog[s.done] || {}; S.hlog[s.done][id] = true; }
}
function weddingMigrate(){
  if (S.seed6) return;
  const t = todayStr(), W = S.profile.wedding = '2026-12-31';
  const old = {}; (S.wedding.beauty || []).forEach(b => { old[b.id === 'sv' ? 'sv1' : b.id] = b; });
  const months = [...new Set(WED_PLAN.map(p => p[4].slice(0, 7)))], claimed = new Set();
  WED_PLAN.forEach(([key, name, e, price, date, note]) => {
    const o = old[key], k = date.slice(0, 7), list = S.selfcare[k] = S.selfcare[k] || [], re = WED_MATCH[key.replace(/\d$/, '')];
    let s = re && list.find(x => !claimed.has(x.id) && !x.key && re.test(x.name) && !(key.startsWith('hl') && /pico|spider/i.test(x.name)));
    if (!s){ s = {id:uid(), name, e, price:'', planned:'', done:'', spendId:''}; list.push(s); }
    claimed.add(s.id);
    Object.assign(s, {key, name, e, wedding:true, note:note || ''});
    if (o && o.done){ s.done = o.done; s.spendId = o.spendId || ''; }
    s.price = s.price || (o && o.price) || price;
    s.planned = s.done ? (s.planned || s.done) : (date < t ? t : date);
  });
  months.forEach(k => { S.selfcare[k] = S.selfcare[k].filter(x => {
    if (claimed.has(x.id)) return true;
    if (k > ym(new Date()) && !x.done && !x.price) return false;   // untouched placeholder sessions in coming months
    x.wedding = false; return true; }); });
  S.wedding.beauty = [];
  const hd = S.wedding.checklist.find(c => /find a hairdresser/i.test(c.title)); if (hd) hd.title = 'Book the hairdresser';
  if (!S.wedding.checklist.some(c => /turkey/i.test(c.title))) S.wedding.checklist.push({id:uid(), e:'\u{2708}\u{FE0F}', title:'Turkey travel papers', done:false});
  S.wedding.shopping = S.wedding.shopping || [];
  WED_SHOP.forEach(([e, title]) => { if (!S.wedding.shopping.some(x => x.title === title)) S.wedding.shopping.push({id:uid(), e, title, done:false}); });
  [['Oriental Weavers (El Nassageon) for the carpets','\u{1F9F6}'],['Buy the chandelier','\u{1F4A1}']].forEach(([name]) => { if (!S.mashawer.some(m => m.name === name)) S.mashawer.push({id:uid(), name, date:'', time:'', note:'For the apartment', remind:true, wedding:true, done:false}); });
  HOME_HABITS.forEach(h => { if (!S.habits.some(x => x.id === h.id)) S.habits.push(Object.assign({}, h)); });
  S.seed6 = true;
}

VIEWS['plans.wedding'] = function(el){
  const W = S.profile.wedding, wd = weddingDays(), t = todayStr();
  const ses = weddingSessions(), byMonth = {}; ses.forEach(({k, s}) => (byMonth[k] = byMonth[k] || []).push(s));
  const allPrep = prepItems(), prepDone = allPrep.filter(x => x.done).length;
  const known = sum(ses, x => x.s.price), spent = sum(ses.filter(x => x.s.done), x => x.s.price), nDone = ses.filter(x => x.s.done).length;
  const wj = jarByName('Wedding beauty'), sj = jarByName('Wedding shopping'), shop = S.wedding.shopping || [], wm = S.mashawer.filter(m => m.wedding);
  const field = (s, f, label, type) => '<label class="field"><span>' + label + '</span><input class="in' + (type === 'number' ? ' num' : '') + '" type="' + type + '"' + (type === 'number' ? ' inputmode="decimal" min="0" placeholder="EGP"' : '') + ' data-wsf="' + f + '" data-id="' + s.id + '" value="' + esc(s[f] || '') + '"></label>';
  el.innerHTML = '<div class="card wed" style="cursor:default">' + (W ? '<span class="wn num">' + Math.max(0, wd) + '</span><span style="min-width:0;text-align:left"><b style="display:block;font-size:17px">days to your wedding \u{1F48D}</b><span class="small" style="font-weight:700">' + nice(W) + '</span></span>' : '<span style="font-size:40px">\u{1F48D}</span><span style="min-width:0;text-align:left"><b style="display:block">Set your wedding date</b></span>') + '</div>' +
    '<div class="card"><label class="field"><span>Wedding date</span><input class="in" id="wDate" type="date" value="' + esc(W) + '"></label><div class="statrow" style="color:var(--ink)"><span>All preparations</span><span class="num">' + prepDone + ' / ' + allPrep.length + '</span></div><div class="bar good"><i style="width:' + (allPrep.length ? prepDone / allPrep.length * 100 : 0) + '%"></i></div></div>' +
    '<div class="money3"><div class="mbox"><b>' + nDone + '/' + ses.length + '</b><span>beauty sessions</span></div><div class="mbox"><b>' + fmt(known) + '</b><span>known prices</span></div><div class="mbox"><b>' + fmt(wj ? jarTotal(wj) : 0) + '</b><span>in beauty jar</span></div></div>' +
    Object.keys(byMonth).sort().map(k => { const L = byMonth[k].sort((a, b) => (a.planned || '9') < (b.planned || '9') ? -1 : 1), d = L.filter(s => s.done).length;
      return '<div class="card"><div class="card-head"><h2>' + MONTHS_L[+k.slice(5) - 1] + ' beauty</h2><span class="num muted">' + d + '/' + L.length + ' · ' + fmt(sum(L, s => s.price)) + ' EGP</span></div><div class="list">' +
        L.map(s => '<div class="sc' + (s.done ? ' done' : '') + '"><span class="em">' + s.e + '</span><div style="min-width:0"><div class="nm">' + esc(s.name) + '</div>' + (s.note ? '<span class="small muted" style="font-weight:700">' + esc(s.note) + '</span>' : '') +
          '<div class="fields">' + field(s, 'price', 'Price', 'number') + field(s, 'planned', 'Planned', 'date') + field(s, 'done', 'Done on', 'date') + '</div></div>' + delBtn('data-wsdel', s.id) + '</div>').join('') + '</div>' +
        '<div class="row"><label class="field"><input class="in" data-wsin="' + k + '" placeholder="Add a session to ' + MONTHS_L[+k.slice(5) - 1] + '…" aria-label="New session"></label><button class="btn soft" data-wsadd="' + k + '">Add</button></div></div>'; }).join('') +
    '<p class="note">\u{1F514} Reminder the evening before each session. These also show in Plans › Self-care, month by month. ' + money(spent) + ' spent so far.</p>' +
    '<div class="card"><h2>Wedding preparations</h2><div class="row"><label class="field" style="flex:0 0 60px"><input class="in" id="wcE" value="\u{1F48D}" maxlength="4" style="text-align:center" aria-label="Emoji"></label><label class="field"><input class="in" id="wcIn" placeholder="Invitations, photographer, dress fitting…" aria-label="New item"></label><button class="btn" id="wcAdd">Add</button></div>' +
      '<div class="list">' + S.wedding.checklist.map(x => '<div class="item' + (x.done ? ' done' : '') + '"><button class="tick' + (x.done ? ' on' : '') + '" data-wcd="' + x.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + (x.e || '\u{1F48D}') + ' ' + esc(x.title) + '</span>' + delBtn('data-wcdel', x.id) + '</div>').join('') + '</div></div>' +
    '<div class="card"><div class="card-head"><h2>Wedding shopping</h2><span class="num muted">' + shop.filter(x => x.done).length + '/' + shop.length + '</span></div><div class="row"><label class="field"><input class="in" id="wsIn" placeholder="Add something to buy…" aria-label="New item"></label><button class="btn" id="wsAdd">Add</button></div>' +
      '<div class="list">' + shop.map(x => '<div class="item' + (x.done ? ' done' : '') + '"><button class="tick' + (x.done ? ' on' : '') + '" data-wsd="' + x.id + '" aria-label="Bought">' + CHECK + '</button><span class="t">' + x.e + ' ' + esc(x.title) + '</span>' + delBtn('data-wshdel', x.id) + '</div>').join('') + '</div>' +
      (sj ? '<p class="small muted" style="margin:0">Wedding shopping jar: ' + money(jarTotal(sj)) + ' of ' + money(sj.target) + '. The 48-hour wait still applies to big buys.</p>' : '') + '</div>' +
    '<div class="card"><div class="card-head"><h2>Mashawer \u{1F48D}</h2><button class="linkbtn" data-go="plans:mashawer">Add or set dates</button></div><div class="list">' + (wm.length ? wm.map(m => '<div class="item' + (m.done ? ' done' : '') + '"><button class="tick' + (m.done ? ' on' : '') + '" data-wmd="' + m.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + esc(m.name) + '<span class="s">' + (m.date ? nice(m.date) : 'No date yet') + '</span></span><span></span></div>').join('') : '<div class="empty">Tap \u{1F48D} on a meshwar to add it here.</div>') + '</div></div>';

  const again = () => VIEWS['plans.wedding'](el), find = id => { for (const k in S.selfcare){ const s = S.selfcare[k].find(x => x.id === id); if (s) return [k, s]; } return []; };
  $('#wDate', el).onchange = e => { S.profile.wedding = e.target.value; save(); toast(e.target.value ? 'Countdown started \u{1F48D}' : 'Date cleared'); again(); };
  $$('[data-wsf]', el).forEach(i => i.onchange = () => {
    const [k, s] = find(i.dataset.id), f = i.dataset.wsf, was = !!s.done; s[f] = f === 'price' ? (+i.value || '') : i.value;
    if (f === 'planned' && s.planned && s.planned.slice(0, 7) !== k){ S.selfcare[k] = S.selfcare[k].filter(x => x !== s); (S.selfcare[s.planned.slice(0, 7)] = S.selfcare[s.planned.slice(0, 7)] || []).push(s); }
    logPaid(s, 'wedding'); scHabit(s); save();
    if (f === 'done' && s.done && !was){ if (weddingSessions().every(x => x.s.done)) celebrate({key:'wb-all', e:'\u{1F470}', title:'Beauty plan complete!', msg:'Every session done. You’re ready to glow on your day.'}); else toast(s.e + ' Done. Glowing! ♡'); }
    again(); });
  armDelete(el, 'data-wsdel', id => { const [k, s] = find(id); if (s.spendId) S.spend = S.spend.filter(x => x.id !== s.spendId); S.selfcare[k] = S.selfcare[k].filter(x => x !== s); save(); again(); });
  $$('[data-wsadd]', el).forEach(b => b.onclick = () => { const k = b.dataset.wsadd, v = $('[data-wsin="' + k + '"]', el).value.trim(); if (!v) return toast('Name the session');
    S.selfcare[k].push({id:uid(), name:v, e:'✨', price:'', planned:'', done:'', spendId:'', wedding:true}); save(); again(); });
  const addC = () => { const v = $('#wcIn', el).value.trim(); if (!v) return; S.wedding.checklist.push({id:uid(), e:$('#wcE', el).value.trim() || '\u{1F48D}', title:v, done:false}); save(); again(); };
  $('#wcAdd', el).onclick = addC; $('#wcIn', el).onkeydown = e => { if (e.key === 'Enter') addC(); };
  $$('[data-wcd]', el).forEach(b => b.onclick = ev => { const x = S.wedding.checklist.find(y => y.id === b.dataset.wcd); x.done = !x.done; if (x.done) hearts(ev.clientX, ev.clientY); save(); again(); });
  armDelete(el, 'data-wcdel', id => { S.wedding.checklist = S.wedding.checklist.filter(x => x.id !== id); save(); again(); });
  const addS = () => { const v = $('#wsIn', el).value.trim(); if (!v) return; S.wedding.shopping.push({id:uid(), e:'\u{1F6CD}\u{FE0F}', title:v, done:false}); save(); again(); };
  $('#wsAdd', el).onclick = addS; $('#wsIn', el).onkeydown = e => { if (e.key === 'Enter') addS(); };
  $$('[data-wsd]', el).forEach(b => b.onclick = ev => { const x = shop.find(y => y.id === b.dataset.wsd); x.done = !x.done; if (x.done) hearts(ev.clientX, ev.clientY); save(); again(); });
  armDelete(el, 'data-wshdel', id => { S.wedding.shopping = shop.filter(x => x.id !== id); save(); again(); });
  $$('[data-wmd]', el).forEach(b => b.onclick = ev => { const m = S.mashawer.find(y => y.id === b.dataset.wmd); m.done = !m.done; m.doneOn = m.done ? t : ''; if (m.done) hearts(ev.clientX, ev.clientY); save(); again(); });
  $$('[data-go]', el).forEach(b => b.onclick = () => { const p = b.dataset.go.split(':'); go(p[0], p[1]); });
};
