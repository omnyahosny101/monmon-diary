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
  const row = x => '<div class="item"><button class="tick" data-htdone="' + x.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + (x.job ? '<span class="pill">' + esc(jobName(x.job)) + '</span>' : '') + (x.prio && x.prio !== 'normal' ? '<span class="pill ' + PRIO[x.prio].c + '">' + PRIO[x.prio].l + '</span>' : '') + esc(x.title) + photoStrip('task:' + x.id, false) + (x.due ? '<span class="s" style="' + (x.due < t ? 'color:var(--danger);font-weight:900' : '') + '">' + (x.due < t ? 'Overdue · ' : 'Due ') + nice(x.due) + (x.time ? ' · by ' + x.time : '') + '</span>' : '') + '</span><span class="ibtns">' + editBtn('task', x.id) + flagBtn('t:' + x.id, x.prio === 'urgent') + '</span></div>';
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
    '<div class="list">' + (up.length ? up.slice(0, 5).map(m => '<div class="item"><button class="tick" data-hmdone="' + m.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + (m.wedding ? '<span class="pill wedpill">\u{1F48D} Wedding prep</span>' : '') + esc(m.name) + '<span class="s">' + (m.date ? (m.date < t ? 'Missed · ' : '') + nice(m.date) : 'No date') + (m.time ? ' · ' + m.time : '') + '</span></span><span class="ibtns">' + editBtn('mesh', m.id) + flagBtn('m:' + m.id, m.flag) + '</span></div>').join('') : '<div class="empty">No mashawer planned.</div>') + '</div></div>';
}

/* ---------- 🚨 emergency flags: tasks, mashawer, wedding prep, shopping, beauty ---------- */
function flagBtn(key, on){ return '<span class="ibtns">' + bellBtn(key) + flagOnly(key, on) + '</span>'; }
function flagOnly(key, on){ return '<button class="flag' + (on ? ' on' : '') + '" data-flag="' + key + '" aria-pressed="' + !!on + '" aria-label="' + (on ? 'Remove emergency flag' : 'Flag as emergency') + '">\u{1F6A8}</button>'; }
function findFlag(key){
  const [k, id] = key.split(':');
  if (k === 't') return S.tasks.find(x => x.id === id);
  if (k === 'm') return S.mashawer.find(x => x.id === id);
  if (k === 'c') return S.wedding.checklist.find(x => x.id === id);
  if (k === 'w') return (S.wedding.shopping || []).find(x => x.id === id);
  if (k === 's') for (const m in S.selfcare){ const x = S.selfcare[m].find(y => y.id === id); if (x) return x; }
}
function toggleFlag(key){
  const x = findFlag(key); if (!x) return;
  let on; if (key[0] === 't'){ x.prio = x.prio === 'urgent' ? 'normal' : 'urgent'; on = x.prio === 'urgent'; } else on = x.flag = !x.flag;
  save(); toast(on ? '\u{1F6A8} Emergency. It’s at the top of Today now.' : 'Flag removed');
}
function bindFlags(el, again){ $$('[data-flag]', el).forEach(b => b.onclick = ev => { ev.stopPropagation(); toggleFlag(b.dataset.flag); again(); }); bindBells(el, again); }
function emergencies(){
  const out = [];
  urgentTasks().forEach(x => out.push({key:'t:' + x.id, e:x.kind === 'work' ? '\u{1F4BC}' : '✅', title:x.title, date:x.due, time:x.time, kind:x.prio === 'urgent' ? (x.job ? jobName(x.job) : 'Task') : '⚠\u{FE0F} Due soon', flag:x.prio === 'urgent', wed:/wedding|زفاف|فرح/i.test(x.title)}));
  S.mashawer.filter(m => m.flag && !m.done).forEach(m => out.push({key:'m:' + m.id, e:'\u{1F4CD}', title:m.name, date:m.date, time:m.time, kind:'Meshwar', flag:true, wed:!!m.wedding}));
  S.wedding.checklist.filter(c => c.flag && !c.done).forEach(c => out.push({key:'c:' + c.id, e:c.e || '\u{1F48D}', title:c.title, date:c.date || '', kind:'Wedding prep', flag:true, wed:true}));
  (S.wedding.shopping || []).filter(x => x.flag && !x.done).forEach(x => out.push({key:'w:' + x.id, e:x.e, title:x.title, date:'', kind:'To buy', flag:true, wed:true}));
  Object.values(S.selfcare).forEach(l => l.filter(x => x.flag && !x.done).forEach(x => out.push({key:'s:' + x.id, e:x.e, title:x.name, date:x.planned, kind:'Beauty', flag:true, wed:!!x.wedding})));
  return out.sort((a, b) => ((a.date || '9') < (b.date || '9') ? -1 : (a.date || '9') > (b.date || '9') ? 1 : 0) || (b.wed - a.wed));
}
function emergencyHTML(){
  const L = emergencies(), t = todayStr(); if (!L.length) return '';
  return '<div class="urgent"><div class="card-head"><h2>Emergency</h2><span class="num" style="font-weight:600">' + L.length + '</span></div>' + L.slice(0, 8).map(x =>
    '<div class="ur"><button class="tick" data-emdone="' + x.key + '" aria-label="Done">' + CHECK + '</button><span style="flex:1;min-width:0"><span class="pill" style="background:#fff;color:var(--danger)">' + (x.wed ? '\u{1F48D} ' : '') + esc(x.kind) + '</span>' + x.e + ' ' + esc(x.title) +
    (x.date ? '<span style="display:block;font-size:12px;opacity:.92">' + (x.date < t ? 'Overdue · ' : x.date === t ? 'Today · ' : '') + nice(x.date) + (x.time ? ' · ' + x.time : '') + '</span>' : '') + '</span>' + (x.flag ? flagBtn(x.key, true) : '') + '</div>').join('') +
    (L.length > 8 ? '<span class="small" style="font-weight:800">+ ' + (L.length - 8) + ' more flagged</span>' : '') + '</div>';
}
function emergencyReminders(push, at){
  const t = todayStr(), tm = addDays(t, 1);
  S.mashawer.filter(m => m.flag && !m.done && m.date >= t).forEach(m => push('em-m-' + m.id, '\u{1F6A8} Today: ' + m.name, m.time ? 'At ' + m.time + '. Flagged as an emergency.' : 'Flagged as an emergency.', at(parseD(m.date), 9, 0)));
  Object.values(S.selfcare).forEach(l => l.filter(x => x.flag && !x.done && x.planned >= t).forEach(x => push('em-s-' + x.id, '\u{1F6A8} Today: ' + x.e + ' ' + x.name, 'Flagged as an emergency.', at(parseD(x.planned), 9, 0))));
  S.mashawer.filter(m => m.flag && !m.done && !m.date).forEach(m => push('em-m-' + m.id, '\u{1F6A8} Still open: ' + m.name, 'Pick a day for it today.', at(parseD(tm), 10, 0)));
  S.wedding.checklist.filter(c => c.flag && !c.done).forEach(c => push('em-c-' + c.id, '\u{1F6A8} Wedding: ' + c.title, 'Flagged as an emergency. Can you do it today?', at(parseD(tm), 10, 0)));
  (S.wedding.shopping || []).filter(x => x.flag && !x.done).forEach(x => push('em-w-' + x.id, '\u{1F6A8} To buy: ' + x.title, 'Flagged as an emergency for the wedding.', at(parseD(tm), 10, 5)));
}

/* ---------- beauty and pampering, shopping list ---------- */
function beautyHTML(){
  const t = todayStr(), now = new Date(), next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const sec = k => { const L = (S.selfcare[k] || []).slice().sort((a, b) => (a.planned || '9') < (b.planned || '9') ? -1 : 1); if (!L.length) return '';
    return '<h3>' + MONTHS_L[+k.slice(5) - 1] + ' · ' + L.filter(s => s.done).length + '/' + L.length + ' done</h3><div class="list">' + L.map(s => '<div class="item' + (s.done ? ' done' : '') + '"><button class="tick' + (s.done ? ' on' : '') + '" data-bt="' + s.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + s.e + ' ' + esc(s.name) + (s.wedding ? ' \u{1F48D}' : '') +
      '<span class="s">' + (s.done ? 'Done ' + nice(s.done) : s.planned ? (s.planned < t ? 'Was due ' : '') + nice(s.planned) : 'No date yet') + (s.price ? ' · ' + money(s.price) : '') + '</span></span><span class="ibtns">' + editBtn('sc', s.id) + flagBtn('s:' + s.id, s.flag) + '</span></div>').join('') + '</div>'; };
  const body = sec(ym(now)) + sec(ym(next));
  return '<div class="card"><div class="card-head"><h2>Beauty and pampering</h2><button class="linkbtn" data-go="plans:wedding">All months</button></div>' + (body || '<div class="empty">No sessions planned. Plan them in Plans › Self-care.</div>') + '</div>';
}
function shopHTML(){
  const L = S.wedding.shopping || [], open = L.filter(x => !x.done), got = L.filter(x => x.done);
  const row = x => '<div class="item' + (x.done ? ' done' : '') + '"><button class="tick' + (x.done ? ' on' : '') + '" data-hs="' + x.id + '" aria-label="Bought">' + CHECK + '</button><span class="t">' + x.e + ' ' + esc(x.title) + '</span><span class="ibtns">' + editBtn('wshop', x.id) + flagBtn('w:' + x.id, x.flag) + '</span></div>';
  return '<div class="card"><div class="card-head"><h2>Shopping list</h2><span class="num muted">' + got.length + '/' + L.length + ' bought</span></div>' +
    '<div class="row"><label class="field"><input class="in" id="hsIn" placeholder="Add something to buy…" aria-label="New item"></label><button class="btn" id="hsAdd">Add</button></div>' +
    '<div class="list">' + (open.length ? open.map(row).join('') : '<div class="empty">Everything is bought \u{1F389}</div>') + got.map(row).join('') + '</div>' +
    '<p class="small muted" style="margin:0">Big buys still get the 48-hour wait. Ticked items stay at the bottom.</p></div>';
}

/* ---------- the home view ---------- */
VIEWS.today = function(el){
  const T0 = todayStr(), day = ui.homeDay && ui.homeDay < T0 ? ui.homeDay : T0, past = day !== T0, doy = dayOfYear(parseD(day));
  const n = planDayNum(new Date()), inPlan = n >= 1 && n <= 30;
  const diary = S.diary[day] || {}, logs = S.daylog[day] || [], qa = S.qa[day] || {};
  const qs = [0, 1, 2].map(i => (doy * 3 + i) % QUESTIONS.length);
  const urg = urgentTasks(), ins = INSIGHTS[(doy + (S.insightShift || 0)) % INSIGHTS.length], WL = wisdomList(), wz = WL[(dayOfYear(new Date()) + (S.wisdomShift || 0)) % WL.length];
  const todaySpend = S.spend.filter(s => s.date === day);
  const coming = [];
  S.exp.filter(x => !x.done && x.date && x.date >= day).forEach(x => coming.push({d:x.date, e:'✨', title:x.title, when:nice(x.date) + (x.with && x.with.length ? ' · with ' + x.with.join(', ') : '')}));
  coming.sort((a, b) => a.d < b.d ? -1 : 1);
  el.innerHTML =
    emergencyHTML() +
    cycleHomeHTML() +
    weddingTrackerHTML() +
    '<div class="card wisdom"><span class="src">\u{1F4DA} ' + esc(wz.src) + '</span><p class="idea">' + esc(wz.idea) + '</p><p class="todo"><b>Try this today</b>' + esc(wz.advice) + '</p><button class="linkbtn" id="wzNext" style="align-self:flex-start;background:var(--surface);color:var(--berry)">Another one</button></div>' +
    mashawerHTML() +
    tasksHTML() +
    '<div class="card daybar' + (past ? ' past' : '') + '"><div class="card-head"><h2>' + (past ? 'Logging a past day' : 'Log my day') + '</h2>' + (past ? '<button class="linkbtn" id="hdToday">Back to today</button>' : '') + '</div>' +
      '<div class="monthnav"><button data-hd="-1" aria-label="Previous day">‹</button><b>' + (past ? nice(day) : 'Today') + '</b><button data-hd="1" aria-label="Next day"' + (past ? '' : ' disabled') + '>›</button></div>' +
      '<label class="field"><span>Pick any previous day</span><input class="in" id="hdPick" type="date" max="' + T0 + '" value="' + day + '"></label></div>' +
    '<div class="card"><div class="card-head"><h2>' + (past ? 'Spent that day' : 'Spent today') + '</h2><span class="amt">' + money(spentOn(day)) + '</span></div>' +
      '<div class="row"><label class="field" style="flex:1 1 90px"><span>Amount</span><input class="in num" id="qAmt" type="number" inputmode="decimal" min="0" placeholder="0"></label>' +
      '<label class="field" style="flex:2 1 150px"><span>Category</span><select class="in" id="qCat">' + CATS.map(c => '<option value="' + c.id + '">' + c.e + ' ' + c.name + '</option>').join('') + '</select></label></div>' +
      '<div class="row"><label class="field"><span>Note</span><input class="in" id="qNote" placeholder="What was it?"></label><label class="field" style="flex:1 1 120px"><span>Day</span><input class="in" id="qDate" type="date" value="' + day + '"></label></div><button class="btn full" id="qAdd">Add</button>' +
      '<div class="list">' + (todaySpend.length ? todaySpend.map(spendRow).join('') : '<div class="empty">' + (past ? 'Nothing spent that day.' : 'Nothing spent yet today.') + '</div>') + '</div></div>' +
    '<div class="card"><h2>' + (past ? 'What did I do that day?' : 'What did I do today?') + '</h2><div class="chips">' + DAYLOG.map(x => '<button class="chip' + (logs.includes(x.id) ? ' on' : '') + '" data-l="' + x.id + '">' + x.e + ' ' + x.name + '</button>').join('') + '</div></div>' +
    '<div class="card"><div class="card-head"><h2>Dear diary</h2><span class="small muted">' + nice(day) + '</span></div>' +
      '<div class="moods">' + MOODS.map((m, i) => '<button class="mood' + (diary.mood === i + 1 ? ' on' : '') + '" data-mood="' + (i + 1) + '" aria-label="' + m.t + '">' + m.e + '<span>' + m.t + '</span></button>').join('') + '</div>' +
      '<h3>Today’s 3 questions</h3>' + qs.map(q => '<label class="field"><span class="qlab">' + esc(QUESTIONS[q]) + '</span><textarea class="in" data-q="' + q + '" placeholder="My answer…" style="min-height:50px">' + esc(qa[q] || '') + '</textarea></label>').join('') +
      '<label class="field"><span>What I did</span><textarea class="in" id="dSum" placeholder="A little summary of my day…">' + esc(diary.summary || '') + '</textarea></label>' +
      '<label class="field"><span>How I felt</span><textarea class="in" id="dFeel" placeholder="My feelings today…">' + esc(diary.feelings || '') + '</textarea></label>' +
      '<label class="field"><span>Quick notes and drafts</span><textarea class="in" id="dNote" placeholder="Anything to remember about today…">' + esc(S.notes[day] || '') + '</textarea></label>' +
      '<h3>\u{1F4F7} Photos</h3>' + photoStrip('diary:' + day) +
      '<button class="linkbtn" data-go="me:days" style="align-self:flex-start">See my whole day ›</button></div>' +
    habitsHTML(day) +
    frHomeHTML() +
    beautyHTML() +
    shopHTML() +
    lifeTodayTop() +
    lifeTodayMid() +
    (coming.length ? '<div class="card"><div class="card-head"><h2>Coming up</h2><button class="linkbtn" data-go="plans:exp">Experiences</button></div><div class="list">' + coming.slice(0, 4).map(c => '<div class="item"><span style="font-size:20px">' + c.e + '</span><span class="t">' + esc(c.title) + '<span class="s">' + c.when + '</span></span><span></span></div>').join('') + '</div></div>' : '') +
    (inPlan ? '<div class="card"><div class="card-head"><h2>Next meal</h2><button class="linkbtn" data-go="food">Food</button></div>' + nextMealHTML(n) + '</div>' : '') +
    lessonCardHTML();

  const again = () => VIEWS.today(el);
  $$('[data-hd]', el).forEach(b => b.onclick = () => { const nd = addDays(day, +b.dataset.hd); ui.homeDay = nd >= T0 ? '' : nd; again(); });
  $('#hdPick', el).onchange = e => { const v = e.target.value; ui.homeDay = v && v < T0 ? v : ''; again(); };
  const hdt = $('#hdToday', el); if (hdt) hdt.onclick = () => { ui.homeDay = ''; again(); };
  bindFlags(el, again);
  $$('[data-emdone]', el).forEach(b => b.onclick = ev => { const key = b.dataset.emdone;
    if (key[0] === 't'){ const x = findFlag(key); x.done = true; x.doneOn = day; save(); } else togglePrep(key);
    hearts(ev.clientX, ev.clientY); toast('Handled! Breathe out ♡'); again(); });
  $$('[data-bt]', el).forEach(b => b.onclick = ev => { const was = b.classList.contains('on'); togglePrep('s:' + b.dataset.bt); if (!was){ hearts(ev.clientX, ev.clientY); toast('Logged. Glowing! ♡'); } again(); });
  $$('[data-hs]', el).forEach(b => b.onclick = ev => { const was = b.classList.contains('on'); togglePrep('w:' + b.dataset.hs); if (!was) hearts(ev.clientX, ev.clientY); again(); });
  const addHS = () => { const v = $('#hsIn', el).value.trim(); if (!v) return toast('What do you need to buy?'); S.wedding.shopping.push({id:uid(), e:'\u{1F6CD}\u{FE0F}', title:v, done:false}); save(); again(); };
  $('#hsAdd', el).onclick = addHS; $('#hsIn', el).onkeydown = e => { if (e.key === 'Enter') addHS(); };
  const hw = $('#hwDate', el); if (hw) hw.onchange = e => { S.profile.wedding = e.target.value; save(); toast('Countdown started \u{1F48D}'); again(); };
  $$('[data-prep]', el).forEach(b => b.onclick = ev => { togglePrep(b.dataset.prep); hearts(ev.clientX, ev.clientY); toast('Done! One step closer \u{1F48D}'); again(); });
  $$('[data-h]', el).forEach(b => b.onclick = ev => { const id = b.dataset.h;
    if (id === 'read' || id === 'listen') return mediaSheet(id, day, again);
    if (id === 'gym') return gymSheet(day, again);
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
  $('#qAdd', el).onclick = () => { const amt = +$('#qAmt', el).value; if (!(amt > 0)) return toast('Enter an amount'); const qd = $('#qDate', el).value || day; S.spend.push({id:uid(), date:qd, amount:amt, cat:$('#qCat', el).value, note:$('#qNote', el).value.trim()}); save(); toast('Added ' + money(amt) + (qd !== day ? ' · ' + nice(qd) : '')); again(); };
  bindSpendDeletes(el, again);
  $$('[data-go]', el).forEach(b => b.onclick = () => { const p = b.dataset.go.split(':'); go(p[0], p[1]); });
  $$('[data-udone]', el).forEach(b => b.onclick = ev => { const x = S.tasks.find(y => y.id === b.dataset.udone); x.done = true; x.doneOn = day; save(); hearts(ev.clientX, ev.clientY); toast('Done! One less thing ♡'); again(); });
  $('#wzNext', el).onclick = () => { S.wisdomShift = (S.wisdomShift || 0) + 1; save(); again(); };
  bindLifeToday(el, again);
  const inb = $('#insNext', el); if (inb) inb.onclick = () => { S.insightShift = (S.insightShift || 0) + 1; save(); again(); };
  bindLessonCard(el, again);
  $$('[data-frquiz]', el).forEach(b => b.onclick = () => frQuiz(+b.dataset.frquiz, false, again));
  const nm = $('[data-nextmeal]', el); if (nm) nm.onclick = ev => { toggleMeal(nm.dataset.nextmeal, ev); again(); };
};

/* ---------- mashawer with a wedding-prep tag ---------- */
VIEWS['plans.mashawer'] = function(el){
  const t = todayStr();
  const up = S.mashawer.filter(m => !m.done).sort((a, b) => ((a.date || '9') + (a.time || '')) < ((b.date || '9') + (b.time || '')) ? -1 : 1);
  const done = S.mashawer.filter(m => m.done).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 15);
  const row = m => '<div class="item' + (m.done ? ' done' : '') + '"><button class="tick' + (m.done ? ' on' : '') + '" data-mdone="' + m.id + '" aria-label="Mark done">' + CHECK + '</button><span class="t">' + (m.wedding ? '<span class="pill wedpill">\u{1F48D} Wedding prep</span>' : '') + esc(m.name) + '<span class="s">' + (m.date ? nice(m.date) : 'No date') + (m.time ? ' · ' + m.time : '') + (m.date && m.date < t && !m.done ? ' · missed' : '') + (m.remind !== false && !m.done ? ' · \u{1F514} day before' : '') + '</span>' + (m.note ? '<span class="s" style="color:var(--ink);font-weight:600">' + esc(m.note) + '</span>' : '') + '</span><span style="display:flex;gap:4px;align-items:center">' + (m.done ? '' : flagBtn('m:' + m.id, m.flag)) + '<button class="tagw' + (m.wedding ? ' on' : '') + '" data-mw="' + m.id + '" aria-label="Wedding prep tag">\u{1F48D}</button>' + delBtn('data-mdel', m.id) + '</span></div>';
  el.innerHTML = '<div class="card"><h2>New meshwar</h2><label class="field"><span>Where</span><input class="in" id="pName" placeholder="Bank, tailor, bridal shop, clinic…"></label>' +
    '<div class="row"><label class="field"><span>Day</span><input class="in" id="pDate" type="date" value="' + t + '"></label><label class="field"><span>Time</span><input class="in" id="pTime" type="time" value="12:00"></label></div>' +
    '<label class="field"><span>Note</span><input class="in" id="pNote" placeholder="What to bring or do there"></label>' +
    '<button class="toggle" id="pWed"><span class="sw" role="switch" aria-checked="false"></span><span>\u{1F48D} Wedding preparation</span></button>' +
    '<button class="toggle" id="pEm"><span class="sw" role="switch" aria-checked="false"></span><span>\u{1F6A8} Emergency</span></button>' +
    '<button class="toggle" id="pRem"><span class="sw" role="switch" aria-checked="true"></span><span>Remind me a day before</span></button><button class="btn full" id="pAdd">Add meshwar</button></div>' +
    '<div class="card"><h2>Coming up</h2><div class="list">' + (up.length ? up.map(row).join('') : '<div class="empty">No mashawer planned.</div>') + '</div><p class="small muted" style="margin:0">Tap \u{1F48D} on any meshwar to add it to your wedding preparations.</p></div>' +
    (done.length ? '<div class="card"><h2>Done</h2><div class="list">' + done.map(row).join('') + '</div></div>' : '');
  const again = () => VIEWS['plans.mashawer'](el);
  let rem = true, wed = false, em = false;
  $('#pEm', el).onclick = () => { em = !em; $('#pEm .sw', el).setAttribute('aria-checked', em); };
  bindFlags(el, again);
  $('#pRem', el).onclick = () => { rem = !rem; $('#pRem .sw', el).setAttribute('aria-checked', rem); };
  $('#pWed', el).onclick = () => { wed = !wed; $('#pWed .sw', el).setAttribute('aria-checked', wed); };
  $('#pAdd', el).onclick = () => { const name = $('#pName', el).value.trim(); if (!name) return toast('Where are you going?');
    S.mashawer.push({id:uid(), name, date:$('#pDate', el).value, time:$('#pTime', el).value, note:$('#pNote', el).value.trim(), remind:rem, wedding:wed, flag:em, done:false}); save(); toast(rem ? 'Added. I’ll remind you a day before.' : 'Meshwar added'); again(); };
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
  el.innerHTML = '<div class="card wed" style="cursor:default">' + (W ? '<span class="wn num">' + Math.max(0, wd) + '</span><span style="min-width:0;text-align:start"><b style="display:block;font-size:17px">days to your wedding \u{1F48D}</b><span class="small" style="font-weight:700">' + nice(W) + '</span></span>' : '<span style="font-size:40px">\u{1F48D}</span><span style="min-width:0;text-align:start"><b style="display:block">Set your wedding date</b></span>') + '</div>' +
    '<div class="card"><label class="field"><span>Wedding date</span><input class="in" id="wDate" type="date" value="' + esc(W) + '"></label><div class="statrow" style="color:var(--ink)"><span>All preparations</span><span class="num">' + prepDone + ' / ' + allPrep.length + '</span></div><div class="bar good"><i style="width:' + (allPrep.length ? prepDone / allPrep.length * 100 : 0) + '%"></i></div></div>' +
    '<div class="money3"><div class="mbox"><b>' + nDone + '/' + ses.length + '</b><span>beauty sessions</span></div><div class="mbox"><b>' + fmt(known) + '</b><span>known prices</span></div><div class="mbox"><b>' + fmt(wj ? jarTotal(wj) : 0) + '</b><span>in beauty jar</span></div></div>' +
    Object.keys(byMonth).sort().map(k => { const L = byMonth[k].sort((a, b) => (a.planned || '9') < (b.planned || '9') ? -1 : 1), d = L.filter(s => s.done).length;
      return '<div class="card"><div class="card-head"><h2>' + MONTHS_L[+k.slice(5) - 1] + ' beauty</h2><span class="num muted">' + d + '/' + L.length + ' · ' + fmt(sum(L, s => s.price)) + ' EGP</span></div><div class="list">' +
        L.map(s => '<div class="sc' + (s.done ? ' done' : '') + '"><span class="em">' + s.e + '</span><div style="min-width:0"><div class="nm">' + esc(s.name) + '</div>' + (s.note ? '<span class="small muted" style="font-weight:700">' + esc(s.note) + '</span>' : '') +
          '<div class="fields">' + field(s, 'price', 'Price', 'number') + field(s, 'planned', 'Planned', 'date') + field(s, 'done', 'Done on', 'date') + '</div></div><span style="display:flex;flex-direction:column;gap:6px;align-items:center">' + delBtn('data-wsdel', s.id) + (s.done ? '' : flagBtn('s:' + s.id, s.flag)) + '</span></div>').join('') + '</div>' +
        '<div class="row"><label class="field"><input class="in" data-wsin="' + k + '" placeholder="Add a session to ' + MONTHS_L[+k.slice(5) - 1] + '…" aria-label="New session"></label><button class="btn soft" data-wsadd="' + k + '">Add</button></div></div>'; }).join('') +
    '<p class="note">\u{1F514} Reminder the evening before each session. These also show in Plans › Self-care, month by month. ' + money(spent) + ' spent so far.</p>' +
    '<div class="card"><h2>Wedding preparations</h2><div class="row"><label class="field" style="flex:0 0 60px"><input class="in" id="wcE" value="\u{1F48D}" maxlength="4" style="text-align:center" aria-label="Emoji"></label><label class="field"><input class="in" id="wcIn" placeholder="Invitations, photographer, dress fitting…" aria-label="New item"></label><button class="btn" id="wcAdd">Add</button></div>' +
      '<div class="list">' + S.wedding.checklist.map(x => '<div class="item' + (x.done ? ' done' : '') + '"><button class="tick' + (x.done ? ' on' : '') + '" data-wcd="' + x.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + (x.e || '\u{1F48D}') + ' ' + esc(x.title) + '</span><span style="display:flex;gap:4px;align-items:center">' + (x.done ? '' : flagBtn('c:' + x.id, x.flag)) + delBtn('data-wcdel', x.id) + '</span></div>').join('') + '</div></div>' +
    '<div class="card"><div class="card-head"><h2>Wedding shopping</h2><span class="num muted">' + shop.filter(x => x.done).length + '/' + shop.length + '</span></div><div class="row"><label class="field"><input class="in" id="wsIn" placeholder="Add something to buy…" aria-label="New item"></label><button class="btn" id="wsAdd">Add</button></div>' +
      '<div class="list">' + shop.map(x => '<div class="item' + (x.done ? ' done' : '') + '"><button class="tick' + (x.done ? ' on' : '') + '" data-wsd="' + x.id + '" aria-label="Bought">' + CHECK + '</button><span class="t">' + x.e + ' ' + esc(x.title) + '</span><span style="display:flex;gap:4px;align-items:center">' + (x.done ? '' : flagBtn('w:' + x.id, x.flag)) + delBtn('data-wshdel', x.id) + '</span></div>').join('') + '</div>' +
      (sj ? '<p class="small muted" style="margin:0">Wedding shopping jar: ' + money(jarTotal(sj)) + ' of ' + money(sj.target) + '. The 48-hour wait still applies to big buys.</p>' : '') + '</div>' +
    '<div class="card"><div class="card-head"><h2>Mashawer \u{1F48D}</h2><button class="linkbtn" data-go="plans:mashawer">Add or set dates</button></div><div class="list">' + (wm.length ? wm.map(m => '<div class="item' + (m.done ? ' done' : '') + '"><button class="tick' + (m.done ? ' on' : '') + '" data-wmd="' + m.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + esc(m.name) + '<span class="s">' + (m.date ? nice(m.date) : 'No date yet') + '</span></span>' + (m.done ? '<span></span>' : flagBtn('m:' + m.id, m.flag)) + '</div>').join('') : '<div class="empty">Tap \u{1F48D} on a meshwar to add it here.</div>') + '</div></div>';

  const again = () => VIEWS['plans.wedding'](el); bindFlags(el, again);
  const find = id => { for (const k in S.selfcare){ const s = S.selfcare[k].find(x => x.id === id); if (s) return [k, s]; } return []; };
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

/* ============ HOBBIES: new ones ============ */
const NEW_HOBBIES = [
  ['bedazzle', 'Bedazzling', '\u{1F48E}', 'Get a rhinestone kit and decorate a phone case or a denim jacket'],
  ['blocks', 'Block building puzzles', '\u{1F9E9}', 'Pick a 3D block puzzle set to build on a quiet evening'],
  ['acrylic', 'Acrylic painting', '\u{1F3A8}', 'Get a canvas, brushes and 5 basic colours, then paint one small piece'],
  ['pole', 'Pole dancing', '\u{1F483}', 'Book a beginner pole class'],
];
function hobbyMigrate(){
  if (S.seed7) return;
  NEW_HOBBIES.forEach(([id, name, e, next]) => { if (!S.skills.some(s => s.id === id || s.name.toLowerCase() === name.toLowerCase())) S.skills.push({id, kind:'hobby', name, e, progress:0, next, notes:'', sessions:0}); });
  S.wlog = S.wlog || {};
  S.seed7 = true;
}

/* ============ WORKOUT LOG: write exactly what I did ============ */
// type: s = strength (sets, reps, kg) · c = cardio (minutes, speed, incline) · t = timed hold (sets, seconds)
const EXERCISES = [
  ['Running','\u{1F3C3}‍♀\u{FE0F}','c'], ['Treadmill walk, incline','\u{1F6B6}‍♀\u{FE0F}','c'], ['Stair climber','\u{1FA9C}','c'], ['Bike','\u{1F6B4}‍♀\u{FE0F}','c'],
  ['Leg press','\u{1F9B5}','s'], ['Leg extension','\u{1F9B5}','s'], ['Leg curl','\u{1F9B5}','s'], ['Hip thrust','\u{1F351}','s'], ['Romanian deadlift','\u{1F3CB}\u{FE0F}‍♀\u{FE0F}','s'],
  ['Hack squat','\u{1F3CB}\u{FE0F}‍♀\u{FE0F}','s'], ['Smith squat','\u{1F3CB}\u{FE0F}‍♀\u{FE0F}','s'], ['Sissy squat','\u{1F9B5}','s'], ['Hip abduction','\u{1F351}','s'], ['Cable kickbacks','\u{1F351}','s'],
  ['Back extension','\u{1F4AA}','s'], ['Lat pulldown','\u{1F4AA}','s'], ['Seated row','\u{1F4AA}','s'], ['Shoulder press','\u{1F4AA}','s'], ['Plank','\u{1F9D8}‍♀\u{FE0F}','t'],
];
const WK_FIELDS = {s:[['sets','Sets'],['reps','Reps'],['kg','Kg']], c:[['min','Minutes'],['speed','Speed'],['inc','Incline']], t:[['sets','Sets'],['sec','Seconds']]};
const wkType = n => { const x = EXERCISES.find(e => e[0].toLowerCase() === n.toLowerCase()); return x ? x[2] : /lunge|squat|press|curl|raise|thrust|deadlift|extension|kickback|pulldown|fly|dip|bridge/i.test(n) ? 's' : /run|walk|treadmill|bike|cycl|stair|ellip|rope|swim|row machine|cardio|جري|مشي|عجلة|سلم|تريدميل|كارديو|نط/i.test(n) ? 'c' : /plank|hold|wall sit|بلانك/i.test(n) ? 't' : 's'; };
const wkEmoji = n => { const x = EXERCISES.find(e => e[0].toLowerCase() === n.toLowerCase()); return x ? x[1] : wkType(n) === 'c' ? '\u{1F3C3}‍♀\u{FE0F}' : '\u{1F4AA}'; };
function wkLast(name, before){
  const days = Object.keys(S.wlog || {}).filter(d => d < before).sort().reverse();
  for (const d of days){ const it = (S.wlog[d].items || []).find(x => x.name.toLowerCase() === name.toLowerCase()); if (it) return it; }
}
function wkAdd(day, name, extra){
  const L = S.wlog[day] = S.wlog[day] || {items:[], note:''}, last = wkLast(name, day) || {};
  const it = {id:uid(), name, e:wkEmoji(name), type:wkType(name)};
  WK_FIELDS[it.type].forEach(([f]) => { it[f] = last[f] != null ? last[f] : ''; });
  Object.assign(it, extra || {}); L.items.push(it);
  if (!habitDone('gym', day) && S.habits.some(h => h.id === 'gym')) setHabit('gym', day, true);
  const a = S.daylog[day] = S.daylog[day] || []; if (!a.includes('gym')) a.push('gym');
  save(); return it;
}
function wkLine(it){
  const v = f => it[f] !== '' && it[f] != null, A = isAr(), U = A ? {min:' دقيقة', inc:'، ميل ', s:' ث', sets:' جولات', reps:' عدّة', kg:' كجم'} : {min:' min', inc:', incline ', s:' s', sets:' sets', reps:' reps', kg:' kg'};
  const nm = tr(it.name);
  if (it.type === 'c') return nm + (v('min') ? ' ' + it.min + U.min : '') + (v('speed') ? ' @ ' + it.speed : '') + (v('inc') ? U.inc + it.inc : '');
  if (it.type === 't') return nm + (v('sets') ? ' ' + it.sets + ' ×' : '') + (v('sec') ? ' ' + it.sec + U.s : '');
  return nm + (v('sets') ? ' ' + it.sets + (v('reps') ? '×' + it.reps : U.sets) : v('reps') ? ' ' + it.reps + U.reps : '') + (v('kg') ? ' @ ' + it.kg + U.kg : '');
}
function workoutHTML(){
  const day = ui.wkDay || todayStr(), L = (S.wlog || {})[day] || {items:[], note:''}, t = todayStr();
  const prevDay = Object.keys(S.wlog || {}).filter(d => d < day && S.wlog[d].items && S.wlog[d].items.length).sort().pop();
  const sets = sum(L.items.filter(x => x.type !== 'c'), x => +x.sets || 0), mins = sum(L.items.filter(x => x.type === 'c'), x => +x.min || 0);
  const hist = Object.keys(S.wlog || {}).filter(d => d !== day && S.wlog[d].items && S.wlog[d].items.length).sort().reverse().slice(0, 8);
  return '<div class="card"><div class="card-head"><h2>' + (day === t ? 'Today’s workout' : 'Workout · ' + nice(day)) + '</h2><input class="in" id="wkDay" type="date" value="' + day + '" max="' + t + '" style="width:auto;padding:6px 8px;font-size:13px" aria-label="Workout day"></div>' +
    '<span class="small muted" style="font-weight:700">Tap what you did, then fill in sets, reps and weight. It saves as you type, like a draft.</span>' +
    '<div class="chips">' + EXERCISES.map((x, i) => '<button class="chip" data-wkx="' + i + '">' + x[1] + ' ' + x[0] + '</button>').join('') + '</div>' +
    '<div class="row"><label class="field"><input class="in" id="wkN" placeholder="Another exercise…" aria-label="Exercise name"></label><button class="btn" id="wkAdd">Add</button></div>' +
    '<div class="row"><button class="btn soft" data-wkt="glute" style="flex:1">+ Glute day</button><button class="btn soft" data-wkt="quad" style="flex:1">+ Quad day</button>' + (prevDay && !L.items.length ? '<button class="btn soft" id="wkCopy" style="flex:1">Repeat ' + WD[parseD(prevDay).getDay()] + '</button>' : '') + '</div>' +
    (L.items.length ? '<div class="list">' + L.items.map(it => '<div class="sc"><span class="em">' + it.e + '</span><div style="min-width:0"><div class="nm">' + esc(it.name) + '</div><div class="fields' + (WK_FIELDS[it.type].length === 2 ? ' f2' : '') + '">' +
        WK_FIELDS[it.type].map(([f, lab]) => '<label class="field"><span>' + lab + '</span><input class="in num" type="number" inputmode="decimal" min="0" step="any" data-wkf="' + f + '" data-id="' + it.id + '" value="' + esc(it[f] == null ? '' : it[f]) + '"></label>').join('') + '</div></div>' + delBtn('data-wkdel', it.id) + '</div>').join('') + '</div>' +
      '<p class="small" style="margin:0;font-weight:800;color:var(--mint)">\u{1F4AA} ' + L.items.length + ' exercises' + (sets ? ' · ' + sets + ' sets' : '') + (mins ? ' · ' + mins + ' min cardio' : '') + '</p>'
      : '<div class="empty">Nothing logged ' + (day === t ? 'yet today' : 'for this day') + '.</div>') +
    '<label class="field"><span>Notes</span><textarea class="in" id="wkNote" placeholder="How it felt, what to change next time…" style="min-height:52px">' + esc(L.note || '') + '</textarea></label></div>' +
    (hist.length ? '<div class="card"><h2>Past workouts</h2><div class="list">' + hist.map(d => '<button class="item" data-wkday="' + d + '"><span style="font-size:20px">\u{1F4AA}</span><span class="t">' + nice(d) + '<span class="s" style="color:var(--ink);font-weight:600">' + S.wlog[d].items.map(wkLine).map(esc).join(' · ') + '</span>' + (S.wlog[d].note ? '<span class="s">' + esc(S.wlog[d].note) + '</span>' : '') + '</span><span></span></button>').join('') + '</div></div>' : '');
}
function bindWorkout(el, again){
  const day = ui.wkDay || todayStr();
  const added = (n, ev) => { if (ev) hearts(ev.clientX, ev.clientY); toast(n + ' added \u{1F4AA}'); again(); };
  $('#wkDay', el).onchange = e => { ui.wkDay = e.target.value || todayStr(); again(); };
  $$('[data-wkx]', el).forEach(b => b.onclick = ev => { const x = EXERCISES[+b.dataset.wkx]; wkAdd(day, x[0]); added(x[0], ev); });
  const addN = ev => { const n = $('#wkN', el).value.trim(); if (!n) return toast('Name the exercise'); wkAdd(day, n); added(n, ev); };
  $('#wkAdd', el).onclick = addN; $('#wkN', el).onkeydown = e => { if (e.key === 'Enter') addN(); };
  $$('[data-wkt]', el).forEach(b => b.onclick = ev => { const T = b.dataset.wkt === 'glute' ? GLUTE_DAY : QUAD_DAY;
    T.forEach(([n, s]) => { const m = /^(\d+)\s*(?:×|x)\s*([\d–-]+)/.exec(s) || /^(\d+) sets/.exec(s); const it = wkAdd(day, n); if (m){ if (it.sets === '') it.sets = +m[1]; if (m[2] && it.reps === '') it.reps = m[2].split(/[–-]/).pop(); } });
    S.workouts.push({id:uid(), date:day, type:b.dataset.wkt}); save(); added(b.dataset.wkt === 'glute' ? 'Glute day' : 'Quad day', ev); });
  const cp = $('#wkCopy', el); if (cp) cp.onclick = ev => { const pd = Object.keys(S.wlog).filter(d => d < day && S.wlog[d].items.length).sort().pop();
    S.wlog[pd].items.forEach(x => { const c = Object.assign({}, x); delete c.id; wkAdd(day, x.name, c); }); added('Last workout', ev); };
  $$('[data-wkf]', el).forEach(i => i.oninput = () => { const it = S.wlog[day].items.find(x => x.id === i.dataset.id); it[i.dataset.wkf] = i.value === '' ? '' : +i.value; save(); });
  armDelete(el, 'data-wkdel', id => { S.wlog[day].items = S.wlog[day].items.filter(x => x.id !== id); save(); again(); });
  $('#wkNote', el).oninput = e => { S.wlog[day] = S.wlog[day] || {items:[], note:''}; S.wlog[day].note = e.target.value; save(); };
  $$('[data-wkday]', el).forEach(b => b.onclick = () => { ui.wkDay = b.dataset.wkday; again(); window.scrollTo({top:0, behavior:'smooth'}); });
}
function gymSheet(day, done){
  const L = (S.wlog || {})[day], on = habitDone('gym', day);
  sheet('<div style="text-align:center;font-size:44px">\u{1F3CB}\u{FE0F}‍♀\u{FE0F}</div><h2 class="plain" style="justify-content:center">Gym today</h2>' +
    (L && L.items.length ? '<div class="list">' + L.items.map(it => '<div class="item"><span>' + it.e + '</span><span class="t">' + esc(wkLine(it)) + '</span><span></span></div>').join('') + '</div>' : '<p class="small muted" style="margin:0;text-align:center;font-weight:700">Write exactly what you did: running, leg press, leg extensions…</p>') +
    '<button class="btn full" data-wlog>' + (L && L.items.length ? 'Edit my workout' : 'Write my workout') + '</button>' +
    '<button class="btn soft full" data-wtick>' + (on ? 'Mark gym as not done' : 'Just tick it') + '</button>',
  (sh, close) => {
    $('[data-wlog]', sh).onclick = () => { close(); ui.wkDay = day; go('me', 'body'); };
    $('[data-wtick]', sh).onclick = ev => { setHabit('gym', day, !on, ev); close(); done(); };
  });
}


/* ============ SETTINGS: app language ============ */
const settingsBase = VIEWS['me.settings'];
VIEWS['me.settings'] = function(el){
  settingsBase(el);
  const L = lang(), card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = '<h2>' + (L === 'ar' ? 'اللغة' : 'Language') + '</h2><div class="chips" data-notr><button class="chip' + (L === 'ar' ? ' on' : '') + '" data-lang="ar">العربي المصري</button><button class="chip' + (L === 'en' ? ' on' : '') + '" data-lang="en">English</button></div>';
  el.prepend(card);
  $$('[data-lang]', card).forEach(b => b.onclick = () => { if (b.dataset.lang === L) return; S.settings.lang = b.dataset.lang; save(); location.reload(); });
};


/* ============ MY REMINDERS: a reminder on any task, meshwar, wedding item, or anything ============ */
// S.myrem: [{id, title, date:'YYYY-MM-DD', time:'HH:MM', repeat:'once'|'daily'|'weekly'|'monthly', ref:'t:id'|''}]
const REPEATS = [['once', 'Once'], ['daily', 'Every day'], ['weekly', 'Every week'], ['monthly', 'Every month']];
const remFor = key => (S.myrem || []).find(r => r.ref === key);
function refDone(ref){ const x = ref && findFlag(ref); return !!(x && x.done); }
function refTitle(key){ const x = findFlag(key); return x ? (x.title || x.name || '') : ''; }
function refDate(key){ const x = findFlag(key); return x ? (x.due || x.date || x.planned || '') : ''; }
function bellBtn(key){ const r = remFor(key); return '<button class="bell' + (r ? ' on' : '') + '" data-bell="' + key + '" aria-label="' + (r ? 'Change reminder' : 'Remind me') + '">\u{1F514}</button>'; }
function remWhen(r){
  const rep = {daily:'every day', weekly:'every week', monthly:'every month'}[r.repeat];
  return (r.repeat === 'daily' ? '' : nice(r.date) + ' · ') + r.time + (rep ? ' · ' + rep : '');
}
function remSheet(opts, done){
  const r = opts.id ? S.myrem.find(x => x.id === opts.id) : (opts.ref ? remFor(opts.ref) : null);
  const title = r ? r.title : (opts.title || ''), date = r ? r.date : (opts.date && opts.date >= todayStr() ? opts.date : todayStr()), time = r ? r.time : (opts.time || '09:00'), rep = r ? r.repeat : 'once';
  sheet('<div style="text-align:center;font-size:44px">\u{1F514}</div><h2 class="plain" style="justify-content:center">Remind me</h2>' +
    (opts.ref ? '<p style="margin:0;text-align:center;font-weight:800">' + esc(tr(title)) + '</p>' : '<label class="field"><span>What should I remind you about?</span><input class="in" data-rt value="' + esc(title) + '" placeholder="Call the clinic, pay the bill…"></label>') +
    '<div class="row"><label class="field"><span>Day</span><input class="in" type="date" data-rd value="' + date + '"></label><label class="field"><span>Time</span><input class="in" type="time" data-rh value="' + time + '"></label></div>' +
    '<div class="chips" data-rr>' + REPEATS.map(([k, l]) => '<button class="chip' + (k === rep ? ' on' : '') + '" data-rep="' + k + '">' + l + '</button>').join('') + '</div>' +
    '<button class="btn full" data-rsave>Save reminder</button>' + (r ? '<button class="btn soft full" data-rdel>Remove reminder</button>' : '') +
    '<p class="small muted" style="margin:0;text-align:center;font-weight:700">Reminders ring in the iPhone app at the time you choose.</p>',
  (sh, close) => {
    let repeat = rep;
    $$('[data-rep]', sh).forEach(b => b.onclick = () => { repeat = b.dataset.rep; $$('[data-rep]', sh).forEach(x => x.classList.toggle('on', x === b)); });
    $('[data-rsave]', sh).onclick = () => {
      const t = opts.ref ? title : $('[data-rt]', sh).value.trim(); if (!t) return toast('What should I remind you about?');
      const d = $('[data-rd]', sh).value || todayStr(), h = $('[data-rh]', sh).value || '09:00';
      if (repeat === 'once' && new Date(d + 'T' + h) < new Date()) return toast('Pick a time that hasn’t passed yet');
      S.myrem = S.myrem || [];
      if (r) Object.assign(r, {title:t, date:d, time:h, repeat}); else S.myrem.push({id:uid(), title:t, date:d, time:h, repeat, ref:opts.ref || ''});
      save(); close(); toast('Reminder set \u{1F514}'); done();
    };
    const del = $('[data-rdel]', sh); if (del) del.onclick = () => { S.myrem = S.myrem.filter(x => x !== r); save(); close(); toast('Reminder removed'); done(); };
  });
}
function bindBells(el, again){ $$('[data-bell]', el).forEach(b => b.onclick = ev => { ev.stopPropagation(); const k = b.dataset.bell; remSheet({ref:k, title:refTitle(k), date:refDate(k)}, again); }); }
function myReminders(repeat, push, at){
  const now = new Date();
  (S.myrem || []).forEach(r => {
    if (refDone(r.ref)) return;
    const [h, m] = r.time.split(':').map(Number), d = parseD(r.date), title = '\u{1F514} ' + r.title, body = r.ref ? 'Your reminder' : 'Your reminder from Monmon’s Life';
    if (r.repeat === 'daily') repeat.push({id:'my-' + r.id, title, body, hour:h, minute:m});
    else if (r.repeat === 'weekly') repeat.push({id:'my-' + r.id, title, body, weekday:d.getDay() + 1, hour:h, minute:m});
    else if (r.repeat === 'monthly') repeat.push({id:'my-' + r.id, title, body, day:d.getDate(), hour:h, minute:m});
    else push('my-' + r.id, title, body, at(d, h, m));
  });
}
function remMigrate(){ S.myrem = Array.isArray(S.myrem) ? S.myrem : []; }
const plansTab = TABS.find(t => t.id === 'plans'); if (plansTab && !plansTab.subs.some(x => x[0] === 'rem')) plansTab.subs.splice(1, 0, ['rem', 'Reminders']);
VIEWS['plans.rem'] = function(el){
  const now = new Date(), active = (S.myrem || []).filter(r => r.repeat !== 'once' || new Date(r.date + 'T' + r.time) >= now).filter(r => !refDone(r.ref))
    .sort((a, b) => (a.repeat === 'once' ? a.date + a.time : '0' + a.time) < (b.repeat === 'once' ? b.date + b.time : '0' + b.time) ? -1 : 1);
  el.innerHTML = '<div class="card tint"><h2>My reminders \u{1F514}</h2><span class="small muted" style="font-weight:700">Anything you want: a call, a bill, a pill, a message. Tap \u{1F514} on any task, meshwar or wedding item to get a reminder for it too.</span>' +
    '<button class="btn full" id="remNew">+ New reminder</button></div>' +
    '<div class="card"><h2>Coming up</h2><div class="list">' + (active.length ? active.map(r => '<div class="item"><span style="font-size:20px">\u{1F514}</span><span class="t">' + esc(tr(r.title)) + '<span class="s">' + remWhen(r) + '</span></span><span class="ibtns"><button class="linkbtn" data-redit="' + r.id + '">Edit</button>' + delBtn('data-rmdel', r.id) + '</span></div>').join('') : '<div class="empty">No reminders yet.</div>') + '</div>' +
    '<p class="small muted" style="margin:0">Reminders ring in the iPhone app at the time you choose.</p></div>';
  const again = () => VIEWS['plans.rem'](el);
  $('#remNew', el).onclick = () => remSheet({}, again);
  $$('[data-redit]', el).forEach(b => b.onclick = () => { const r = S.myrem.find(x => x.id === b.dataset.redit); remSheet({id:r.id, ref:r.ref}, again); });
  armDelete(el, 'data-rmdel', id => { S.myrem = S.myrem.filter(r => r.id !== id); save(); toast('Reminder removed'); again(); });
};

/* ============ NOVEMBER FRESH START, INVESTMENTS, FOOD LOG, EDIT ANYTHING ============ */
function novMigrate(){
  if (!S.seed8){
    S.spend = S.spend.filter(s => s.date >= '2026-11-01');                 // October spending forgotten
    S.sadaqa = S.sadaqa.filter(x => x.date >= '2026-11-01');
    Object.keys(S.extras || {}).forEach(d => { S.extras[d] = (S.extras[d] || []).map(x => x.id ? x : Object.assign({id:uid()}, x)); });
    S.seed8 = true;
  }
  S.invest = Array.isArray(S.invest) ? S.invest : [];
  if (ym(new Date()) < '2026-11' && ui.moneyMonth < '2026-11') ui.moneyMonth = '2026-11';
}

/* ---------- Thndr and gold: log the real amount ---------- */
const INV = {thndr:{e:'\u{1F4C8}', name:'Thndr'}, gold:{e:'✨', name:'Gold'}};
function investHTML(k){
  const L = S.invest.filter(x => inMonth(x, k)).sort((a, b) => a.date < b.date ? 1 : -1);
  const row = kind => { const m = sum(L.filter(x => x.kind === kind), x => x.amount), g = sum(L.filter(x => x.kind === kind), x => +x.grams || 0);
    return '<div class="item"><span style="font-size:22px">' + INV[kind].e + '</span><span class="t">' + INV[kind].name + '<span class="s">' + (m ? money(m) + (g ? ' · ' + g + ' g' : '') + ' this month' : 'Nothing added this month') + '</span></span><button class="btn" data-invadd="' + kind + '" style="padding:8px 14px">+ Add</button></div>'; };
  return row('thndr') + row('gold') +
    (L.length ? L.map(x => '<div class="item"><span style="font-size:18px">' + INV[x.kind].e + '</span><span class="t">' + money(x.amount) + (x.grams ? ' · ' + x.grams + ' g' : '') + '<span class="s">' + nice(x.date) + (x.note ? ' · ' + esc(x.note) : '') + '</span></span>' + delBtn('data-invdel', x.id) + '</div>').join('') : '');
}
function investSheet(kind, x, done){
  const isGold = kind === 'gold';
  sheet('<div style="text-align:center;font-size:44px">' + INV[kind].e + '</div><h2 class="plain" style="justify-content:center">' + (isGold ? 'Gold I bought' : 'Money I put in Thndr') + '</h2>' +
    '<div class="row"><label class="field"><span>Amount (EGP)</span><input class="in num" data-ia type="number" inputmode="decimal" min="0" value="' + (x ? x.amount : '') + '"></label><label class="field"><span>Date</span><input class="in" data-id type="date" value="' + (x ? x.date : (ui.moneyMonth && ui.moneyMonth !== ym(new Date()) ? ui.moneyMonth + '-01' : todayStr())) + '"></label></div>' +
    (isGold ? '<label class="field"><span>Grams (optional)</span><input class="in num" data-ig type="number" inputmode="decimal" min="0" step="any" value="' + (x && x.grams ? x.grams : '') + '"></label>' : '') +
    '<label class="field"><span>Note</span><input class="in" data-in value="' + esc(x ? x.note || '' : '') + '" placeholder="' + (isGold ? '21 karat ring, coin…' : 'Fund name, stocks…') + '"></label>' +
    '<button class="btn full" data-is>Save</button>' + (x ? '<button class="btn soft full" data-ix>Delete</button>' : ''),
  (sh, close) => {
    $('[data-is]', sh).onclick = () => {
      const a = +$('[data-ia]', sh).value; if (!(a > 0)) return toast('Enter the amount');
      const d = $('[data-id]', sh).value || todayStr(), g = isGold ? (+$('[data-ig]', sh).value || 0) : 0, note = $('[data-in]', sh).value.trim();
      const diff = a - (x ? +x.amount : 0);
      if (x) Object.assign(x, {amount:a, date:d, grams:g, note}); else S.invest.push({id:uid(), kind, amount:a, date:d, grams:g, note});
      S.worth[kind] = (+S.worth[kind] || 0) + diff; S.worth.asOf = todayStr();
      const mk = d.slice(0, 7), inv = S.investDone[mk] = S.investDone[mk] || {}; inv[kind === 'thndr' ? 'invest' : 'gold'] = true;
      save(); close();
      if (!x) celebrate({key:'inv-' + kind + '-' + mk, e:INV[kind].e, title:isGold ? 'Gold bought!' : 'Invested this month!', msg:'Financial freedom in your thirties is built exactly like this.'}); else toast('Saved ♡');
      done();
    };
    const xb = $('[data-ix]', sh); if (xb) xb.onclick = () => { removeInvest(x.id); close(); done(); };
  });
}
function removeInvest(id){ const x = S.invest.find(y => y.id === id); if (!x) return; S.worth[x.kind] = (+S.worth[x.kind] || 0) - x.amount; S.worth.asOf = todayStr(); S.invest = S.invest.filter(y => y !== x); save(); toast('Removed'); }
function bindInvest(el, again){
  $$('[data-invadd]', el).forEach(b => b.onclick = () => investSheet(b.dataset.invadd, null, again));
  armDelete(el, 'data-invdel', id => { removeInvest(id); again(); });
}

/* ---------- food: log anything I ate, on any day ---------- */
const FOOD_TYPES = [['Breakfast', '\u{1F373}'], ['Lunch', '\u{1F372}'], ['Snack', '\u{1F34E}'], ['Dinner', '\u{1F957}'], ['Other', '\u{1F37D}\u{FE0F}']];
function foodChoices(){ const seen = new Set(), out = []; allDishes().forEach(d => { if (!seen.has(d.name)){ seen.add(d.name); out.push(d); } }); return out; }
function addFoodSheet(date, x, done){
  const list = foodChoices(), type = x ? x.type || 'Other' : 'Other', fid = x ? x.id : uid();
  sheet('<div style="text-align:center;font-size:44px">\u{1F37D}\u{FE0F}</div><h2 class="plain" style="justify-content:center">' + (x ? 'Edit what I ate' : 'What did I eat?') + '</h2>' +
    '<label class="field"><span>Day</span><input class="in" data-fd type="date" value="' + date + '"></label>' +
    '<div class="chips" data-ft>' + FOOD_TYPES.map(([t, e]) => '<button class="chip' + (t === type ? ' on' : '') + '" data-ftype="' + t + '">' + e + ' ' + t + '</button>').join('') + '</div>' +
    (x ? '' : '<label class="field"><span>Pick from my dishes</span><select class="in" data-fpick><option value="">Type it myself</option>' + list.map((d, i) => '<option value="' + i + '">' + esc(d.name) + ' · ' + d.kcal + ' kcal</option>').join('') + '</select></label>') +
    '<label class="field"><span>Food</span><input class="in" data-fn value="' + esc(x ? x.name : '') + '" placeholder="Koshari, sandwich, latte…"></label>' +
    '<div class="row"><label class="field"><span>Calories (kcal)</span><input class="in num" data-fk type="number" inputmode="decimal" min="0" value="' + (x ? x.kcal : '') + '"></label><label class="field"><span>Protein (g)</span><input class="in num" data-fp type="number" inputmode="decimal" min="0" value="' + (x ? x.protein : '') + '"></label></div>' +
    '<h3>\u{1F4F7} Photo</h3>' + photoStrip('food:' + fid) +
    (x ? '' : '<button class="toggle" data-fsave><span class="sw" role="switch" aria-checked="false"></span><span>Also save it to My dishes</span></button>') +
    '<button class="btn full" data-fok>Save</button>' + (x ? '<button class="btn soft full" data-fdel>Delete</button>' : ''),
  (sh, close) => {
    let t = type, keep = false;
    $$('[data-ftype]', sh).forEach(b => b.onclick = () => { t = b.dataset.ftype; $$('[data-ftype]', sh).forEach(y => y.classList.toggle('on', y === b)); });
    const pk = $('[data-fpick]', sh); if (pk) pk.onchange = () => { const d = list[+pk.value]; if (!d) return; $('[data-fn]', sh).value = tr(d.name); $('[data-fk]', sh).value = d.kcal; $('[data-fp]', sh).value = d.protein;
      const ty = FOOD_TYPES.find(f => f[0] === d.type); if (ty){ t = ty[0]; $$('[data-ftype]', sh).forEach(y => y.classList.toggle('on', y.dataset.ftype === t)); } };
    const ks = $('[data-fsave]', sh); if (ks) ks.onclick = () => { keep = !keep; $('.sw', ks).setAttribute('aria-checked', keep); };
    $('[data-fok]', sh).onclick = () => {
      const name = $('[data-fn]', sh).value.trim(); if (!name) return toast('What did you eat?');
      const d = $('[data-fd]', sh).value || date, kcal = Math.round(+$('[data-fk]', sh).value || 0), protein = Math.round(+$('[data-fp]', sh).value || 0), e = FOOD_TYPES.find(f => f[0] === t)[1];
      if (x){ S.extras[date] = (S.extras[date] || []).filter(y => y !== x); Object.assign(x, {name, kcal, protein, type:t, e}); (S.extras[d] = S.extras[d] || []).push(x); }
      else (S.extras[d] = S.extras[d] || []).push({id:fid, name, e, kcal, protein, type:t});
      if (keep && !allDishes().some(y => y.name.toLowerCase() === name.toLowerCase())) S.dishes.push({id:uid(), custom:true, type:t === 'Other' ? 'Any' : t, name, kcal, protein});
      ui.logDay = d; save(); close(); toast(x ? 'Saved ♡' : (keep ? 'Logged and saved to My dishes ♡' : 'Logged ♡')); done();
    };
    const del = $('[data-fdel]', sh); if (del) del.onclick = () => { S.extras[date] = (S.extras[date] || []).filter(y => y !== x); save(); close(); toast('Removed'); done(); };
  });
}
const foodTab = TABS.find(t => t.id === 'food'); if (foodTab && !foodTab.subs.some(x => x[0] === 'log')) foodTab.subs.splice(1, 0, ['log', 'My log']);
VIEWS['food.log'] = function(el){
  const d = ui.logDay || todayStr(), t = todayStr(), n = planDayNum(parseD(d)), inPlan = n >= 1 && n <= 30;
  const planned = inPlan ? mealsFor(n).map((m, i) => Object.assign({k:n + '-' + i}, m)).filter(m => S.checks[m.k]) : [];
  const extras = S.extras[d] || [], kcal = sum(planned, m => m.kcal) + sum(extras, x => x.kcal), prot = sum(planned, m => m.protein) + sum(extras, x => x.protein), goal = 1700;
  const week = Array.from({length:7}, (_, i) => addDays(t, -i)).map(x => { const nn = planDayNum(parseD(x)), pl = nn >= 1 && nn <= 30 ? mealsFor(nn).filter((m, i) => S.checks[nn + '-' + i]) : [];
    return [x, sum(pl, m => m.kcal) + sum(S.extras[x] || [], y => y.kcal)]; });
  el.innerHTML = '<div class="monthnav"><button data-ld="-1" aria-label="Previous day">‹</button><b>' + (d === t ? 'Today' : nice(d)) + '</b><button data-ld="1" aria-label="Next day">›</button></div>' +
    '<div class="card tint"><div class="statrow" style="color:var(--ink)"><span>Calories</span><span class="num">' + fmt(kcal) + ' / ' + fmt(goal) + ' kcal</span></div><div class="bar' + (kcal > goal ? ' over' : ' good') + '"><i style="width:' + Math.min(100, kcal / goal * 100) + '%"></i></div>' +
      '<div class="statrow" style="color:var(--ink)"><span>Protein</span><span class="num">' + Math.round(prot) + ' g</span></div>' +
      '<label class="field"><span>Pick any day</span><input class="in" id="logDay" type="date" value="' + d + '"></label>' +
      '<button class="btn full" id="logAdd">+ Add something I ate</button></div>' +
    '<div class="card"><h2>What I ate</h2><div class="list">' +
      (planned.length ? planned.map(m => '<div class="item"><span style="font-size:20px">✅</span><span class="t">' + esc(m.name) + '<span class="s">' + m.type + ' · ' + m.kcal + ' kcal · ' + m.protein + ' g</span></span><span></span></div>').join('') : '') +
      (extras.length ? extras.map(x => '<div class="item"><span style="font-size:20px">' + (x.e || '\u{1F37D}\u{FE0F}') + '</span><span class="t">' + esc(x.name) + '<span class="s">' + (x.type || 'Treat') + ' · ' + x.kcal + ' kcal · ' + x.protein + ' g</span>' + photoStrip('food:' + x.id, false) + '</span>' + delBtn('data-fldel', d + '|' + x.id) + '</div>').join('') : '') +
      (!planned.length && !extras.length ? '<div class="empty">Nothing logged for this day yet.</div>' : '') + '</div>' +
      (inPlan ? '<button class="linkbtn" id="logPlan" style="align-self:flex-start">Tick plan meals for Day ' + n + '</button>' : '') + '</div>' +
    '<div class="card"><h2>Last 7 days</h2><div class="list">' + week.map(([x, k]) => '<button class="item" data-lpick="' + x + '"><span style="font-size:18px">' + (k ? '\u{1F37D}\u{FE0F}' : '·') + '</span><span class="t">' + (x === t ? 'Today' : nice(x)) + '</span><span class="amt">' + fmt(k) + ' kcal</span></button>').join('') + '</div></div>';
  const again = () => VIEWS['food.log'](el);
  $$('[data-ld]', el).forEach(b => b.onclick = () => { ui.logDay = addDays(d, +b.dataset.ld); again(); });
  $('#logDay', el).onchange = e => { ui.logDay = e.target.value || t; again(); };
  $('#logAdd', el).onclick = () => addFoodSheet(d, null, again);
  const lp = $('#logPlan', el); if (lp) lp.onclick = () => { ui.foodDay = n; go('food', 'meals'); };
  $$('[data-lpick]', el).forEach(b => b.onclick = () => { ui.logDay = b.dataset.lpick; again(); window.scrollTo({top:0, behavior:'smooth'}); });
  armDelete(el, 'data-fldel', key => { const [dd, id] = key.split('|'); S.extras[dd] = (S.extras[dd] || []).filter(x => x.id !== id); save(); again(); });
};

/* ---------- edit any entry ---------- */
const EDIT_KINDS = {'data-tdel':'task', 'data-mdel':'mesh', 'data-sdel':'spend', 'data-xdel':'exp', 'data-shdel':'shop', 'data-wcdel':'check', 'data-wshdel':'wshop',
  'data-sddel':'sadaqa', 'data-idel':'income', 'data-ddel':'dish', 'data-jdel':'jar', 'data-fldel':'food', 'data-invdel':'invest'};
const editBtn = (kind, id) => '<button class="edit" data-edit="' + kind + ':' + id + '" aria-label="Edit">✏\u{FE0F}</button>';
const byId = (arr, id) => (arr || []).find(x => x.id === id);
const EDITS = {
  task:{find:id => byId(S.tasks, id), title:'Edit task', fields:() => [['title', 'text', 'Task'], ['due', 'date', 'Due'], ['time', 'time', 'By'],
    ['prio', 'select', 'Priority', [['normal', 'Normal'], ['high', '⚠\u{FE0F} Important'], ['urgent', '\u{1F6A8} Urgent']]], ['job', 'select', 'For', [['', 'Personal']].concat(S.jobs.map(j => [j.id, j.name]))]],
    after:x => { x.kind = x.job ? 'work' : 'personal'; }},
  mesh:{find:id => byId(S.mashawer, id), title:'Edit meshwar', fields:() => [['name', 'text', 'Where'], ['date', 'date', 'Day'], ['time', 'time', 'Time'], ['note', 'text', 'Note'], ['wedding', 'check', '\u{1F48D} Wedding preparation'], ['remind', 'check', 'Remind me a day before']]},
  spend:{find:id => byId(S.spend, id), title:'Edit spending', fields:() => [['amount', 'number', 'Amount (EGP)'], ['date', 'date', 'Date'], ['cat', 'select', 'Category', CATS.map(c => [c.id, c.e + ' ' + c.name])], ['note', 'text', 'Note']],
    after:x => { S.sadaqa.forEach(s => { if (s.spendId === x.id){ s.amount = x.amount; s.date = x.date; } }); ui.moneyMonth = x.date.slice(0, 7); }},
  exp:{find:id => byId(S.exp, id), title:'Edit experience', fields:() => [['title', 'text', 'What'], ['where', 'text', 'Where'], ['date', 'date', 'When']]},
  shop:{find:id => byId(S.shop, id), title:'Edit item', fields:() => [['name', 'text', 'Item']]},
  check:{find:id => byId(S.wedding.checklist, id), title:'Edit', fields:() => [['e', 'text', 'Emoji'], ['title', 'text', 'Wedding preparation'], ['date', 'date', 'Day']]},
  wshop:{find:id => byId(S.wedding.shopping, id), title:'Edit', fields:() => [['e', 'text', 'Emoji'], ['title', 'text', 'Item']]},
  sadaqa:{find:id => byId(S.sadaqa, id), title:'Edit sadaqa', fields:() => [['amount', 'number', 'Amount (EGP)'], ['date', 'date', 'Date'], ['note', 'text', 'Note']],
    after:x => { const s = byId(S.spend, x.spendId); if (s){ s.amount = x.amount; s.date = x.date; } }},
  income:{find:id => byId(S.income, id), title:'Edit income', fields:() => [['amount', 'number', 'Amount (EGP)'], ['date', 'date', 'Date'], ['job', 'select', 'From', S.jobs.map(j => [j.id, j.name]).concat([['other', 'Other']])]]},
  dish:{find:id => byId(S.dishes, id), title:'Edit dish', fields:() => [['name', 'text', 'Name'], ['type', 'select', 'Meal', [['Breakfast', 'Breakfast'], ['Lunch', 'Lunch'], ['Snack', 'Snack'], ['Dinner', 'Dinner'], ['Any', 'Any']]], ['kcal', 'number', 'Calories (kcal)'], ['protein', 'number', 'Protein (g)']]},
  jar:{find:id => byId(S.jars, id), title:'Edit jar', fields:() => [['e', 'text', 'Emoji'], ['name', 'text', 'Name'], ['target', 'number', 'Target (EGP)']]},
  sc:{find:id => { for (const k in S.selfcare){ const x = byId(S.selfcare[k], id); if (x) return x; } }, title:'Edit session', fields:() => [['e', 'text', 'Emoji'], ['name', 'text', 'Service'], ['price', 'number', 'Price (EGP)'], ['planned', 'date', 'Planned'], ['done', 'date', 'Done on']],
    after:x => { logPaid(x, x.wedding ? 'wedding' : 'selfcare'); scHabit(x);
      for (const k in S.selfcare){ if (S.selfcare[k].includes(x) && x.planned && x.planned.slice(0, 7) !== k){ S.selfcare[k] = S.selfcare[k].filter(y => y !== x); (S.selfcare[x.planned.slice(0, 7)] = S.selfcare[x.planned.slice(0, 7)] || []).push(x); break; } } }},
};
function openEdit(key){
  const i = key.indexOf(':'), kind = key.slice(0, i), id = key.slice(i + 1);
  if (kind === 'food'){ const [d, fid] = id.split('|'), x = byId(S.extras[d], fid); if (x) addFoodSheet(d, x, render); return; }
  if (kind === 'invest'){ const x = byId(S.invest, id); if (x) investSheet(x.kind, x, render); return; }
  const E = EDITS[kind], x = E && E.find(id); if (!x) return;
  const F = E.fields();
  sheet('<h2 class="plain" style="justify-content:center">✏\u{FE0F} ' + E.title + '</h2>' + F.map(([f, type, label, opts]) => {
      const v = x[f] == null ? '' : x[f];
      if (type === 'check') return '<button class="toggle" data-ef="' + f + '" data-et="check"><span class="sw" role="switch" aria-checked="' + !!v + '"></span><span>' + label + '</span></button>';
      if (type === 'select') return '<label class="field"><span>' + label + '</span><select class="in" data-ef="' + f + '">' + opts.map(([ov, ol]) => '<option value="' + esc(ov) + '"' + (String(v) === String(ov) ? ' selected' : '') + '>' + esc(ol) + '</option>').join('') + '</select></label>';
      return '<label class="field"><span>' + label + '</span><input class="in' + (type === 'number' ? ' num' : '') + '" data-ef="' + f + '" type="' + type + '"' + (type === 'number' ? ' inputmode="decimal" min="0"' : '') + ' value="' + esc(type === 'text' ? tr(String(v)) : v) + '"></label>';
    }).join('') + (['task', 'mesh', 'exp'].includes(kind) ? '<h3>\u{1F4F7} Photos</h3>' + photoStrip(kind + ':' + id) : '') + '<button class="btn full" data-esave>Save</button>',
  (sh, close) => {
    $$('[data-et="check"]', sh).forEach(b => b.onclick = () => { const s = $('.sw', b); s.setAttribute('aria-checked', s.getAttribute('aria-checked') !== 'true'); });
    $('[data-esave]', sh).onclick = () => {
      F.forEach(([f, type]) => { const inp = $('[data-ef="' + f + '"]', sh);
        if (type === 'check') x[f] = $('.sw', inp).getAttribute('aria-checked') === 'true';
        else if (type === 'number') x[f] = inp.value === '' ? '' : +inp.value;
        else if (type === 'text'){ const nv = inp.value.trim(); if (nv !== tr(String(x[f] == null ? '' : x[f]))) x[f] = nv; }
        else x[f] = inp.value; });
      if (E.after) E.after(x);
      save(); close(); toast('Saved ♡'); render();
    };
  });
}
document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-edit]'); if (!b) return; ev.preventDefault(); ev.stopPropagation(); openEdit(b.dataset.edit); }, true);

/* ============ PERIOD TRACKER ============ */
// S.cycle = {days:{'YYYY-MM-DD':flow}, sym:{'YYYY-MM-DD':[ids]}, notes:{}}
const FLOWS = [['spot', 'Spotting', '\u{1F338}'], ['light', 'Light', '\u{1F4A7}'], ['medium', 'Medium', '\u{1FA78}'], ['heavy', 'Heavy', '\u{2764}\u{FE0F}']];
const SYMPTOMS = [['cramps', 'Cramps', '\u{1F616}'], ['head', 'Headache', '\u{1F915}'], ['bloat', 'Bloating', '\u{1F388}'], ['back', 'Back pain', '\u{1F9CD}‍♀\u{FE0F}'], ['acne', 'Acne', '\u{1F534}'],
  ['crave', 'Cravings', '\u{1F36B}'], ['tired', 'Tired', '\u{1F634}'], ['mood', 'Mood swings', '\u{1F3AD}'], ['breast', 'Tender breasts', '\u{1F49E}']];
function cycleMigrate(){ S.cycle = S.cycle && typeof S.cycle === 'object' ? S.cycle : {}; S.cycle.days = S.cycle.days || {}; S.cycle.sym = S.cycle.sym || {}; S.cycle.notes = S.cycle.notes || {}; }
// her history copied from Flo (Oct 2024 – Oct 2026), added once
const FLO_HISTORY = {'2024-10':[22,23,24,25,26,27], '2024-11':[17,18,19,20,21,22], '2025-01':[12,13,14,15,16,17], '2025-02':[11,12,13,14,15,16], '2025-03':[15,16,17,18,19,20], '2025-04':[18,19,20,21,22,23], '2025-05':[16,17,18,19,20], '2025-06':[12,13,14,15,16], '2025-07':[12,13,14,15,16], '2025-08':[8,9,10,11,12], '2025-09':[3,4,5,6,7,29,30], '2025-10':[1,2,3,25,26,27,28,29], '2025-11':[19,20,21,22,23], '2025-12':[18,19,20,21,22], '2026-01':[18,19,20,21,22], '2026-02':[14,15,16,17,18], '2026-03':[15,16,17,18,19], '2026-04':[11,12,13,14,15], '2026-05':[9,10,11,12,13], '2026-06':[6,7,8,9,10], '2026-07':[1,2,3,4,5,30,31], '2026-08':[1,2,3,4,31], '2026-09':[1,2,3,4,5,30], '2026-10':[1,2,3,4,28,29]};
function cycleImportFlo(){ if (S.seedFlo1) return; Object.entries(FLO_HISTORY).forEach(([k, ds]) => ds.forEach(d => { const key = k + '-' + pad(d); if (key <= todayStr() && !S.cycle.days[key]) S.cycle.days[key] = 'medium'; })); S.seedFlo1 = true; }
function periods(){
  const ds = Object.keys(S.cycle.days).filter(d => S.cycle.days[d] && S.cycle.days[d] !== 'spot').sort(), out = [];
  ds.forEach(d => { const last = out[out.length - 1]; if (last && daysBetween(last.end, d) <= 2) last.end = d; else out.push({start:d, end:d}); });
  out.forEach(p => p.len = daysBetween(p.start, p.end) + 1); return out;
}
function cycleStats(){
  const P = periods(), gaps = [];
  for (let i = 1; i < P.length; i++){ const g = daysBetween(P[i - 1].start, P[i].start); if (g >= 18 && g <= 45) gaps.push(g); }
  const recent = gaps.slice(-12), srt = recent.slice().sort((a, b) => a - b), mid = srt.length >> 1;
  const cyc = !srt.length ? 28 : srt.length % 2 ? srt[mid] : Math.floor((srt[mid - 1] + srt[mid]) / 2);
  const last = P[P.length - 1], t = todayStr(), ongoing = last && daysBetween(last.end, t) <= 1;
  const lens = (ongoing ? P.slice(0, -1) : P).slice(-6).map(p => p.len), plen = lens.length ? Math.round(sum(lens, x => x) / lens.length) : 5;
  const spread = srt.length >= 4 ? [srt[Math.floor(srt.length * 0.2)], srt[Math.ceil(srt.length * 0.8) - 1]] : [cyc - 2, cyc + 2];
  let next = last ? addDays(last.start, cyc) : '';
  while (next && next < t && !(last && last.end >= t)) next = addDays(next, cyc);   // a missed log: roll forward
  const inPeriod = last && t >= last.start && daysBetween(last.end, t) <= 0;
  const cycleDay = last ? daysBetween(last.start, t) + 1 : 0;
  return {P, cyc, plen, last, next, inPeriod, cycleDay, guess:recent.length < 2, spread, early:last ? addDays(last.start, spread[0]) : '', late:last ? addDays(last.start, spread[1]) : ''};
}
function predictedDays(st, fromK, toK){
  const set = {}; if (!st.next) return set;
  for (let s = st.next, i = 0; i < 6 && s <= toK + '-31'; i++, s = addDays(s, st.cyc)){
    for (let j = 0; j < st.plen; j++) set[addDays(s, j)] = 'p';
    const ov = addDays(s, -14); for (let j = -5; j <= 1; j++) if (!set[addDays(ov, j)]) set[addDays(ov, j)] = j === 0 ? 'o' : 'f';
  }
  return set;
}
function cycleHomeHTML(){
  if (!S.cycle || (!Object.keys(S.cycle.days).length)) return '';
  const st = cycleStats(), t = todayStr(), until = st.next ? daysBetween(t, st.next) : null;
  if (!st.inPeriod && (until == null || until > 3)) return '';
  return '<button class="card cyc" data-go="me:cycle"><span style="font-size:30px">\u{1FA78}</span><span style="min-width:0;text-align:start"><b style="display:block">' + (st.inPeriod ? 'Period · day ' + st.cycleDay : (until <= 0 ? 'Period expected today' : 'Period in ' + until + ' days')) + '</b><span class="small" style="font-weight:700">' + (st.inPeriod ? 'Tap to log flow and how you feel' : 'Keep pads, painkillers and a hot water bottle ready') + '</span></span></button>';
}
VIEWS['me.cycle'] = function(el){
  const st = cycleStats(), t = todayStr(), sel = ui.cycDay || t, k = ui.cycMonth || t.slice(0, 7);
  const first = parseD(k + '-01'), lastD = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(), lead = first.getDay();
  const pred = predictedDays(st, k, k), flow = S.cycle.days[sel] || '', sym = S.cycle.sym[sel] || [];
  const W = S.profile.wedding, wedHit = W && st.next ? (() => { const pp = predictedDays(st, t.slice(0, 7), W.slice(0, 7)); for (let j = -2; j <= 0; j++) if (pp[addDays(W, j)] === 'p') return true; return false; })() : false;
  let cells = (isAr() ? ['ح','ن','ث','ر','خ','ج','س'] : ['S','M','T','W','T','F','S']).map(x => '<div class="cday blank muted" style="font-weight:900">' + x + '</div>').join('');
  for (let i = 0; i < lead; i++) cells += '<div class="cday blank"></div>';
  for (let d = 1; d <= lastD; d++){ const key = k + '-' + pad(d), f = S.cycle.days[key], pr = pred[key];
    cells += '<button class="cday cy' + (f && f !== 'spot' ? ' on' : f === 'spot' ? ' spot' : pr === 'p' ? ' pred' : pr === 'o' ? ' ovu' : pr === 'f' ? ' fert' : '') + (key === t ? ' today' : '') + (key === sel ? ' sel' : '') + '" data-cd="' + key + '"><span>' + d + '</span></button>'; }
  const status = st.inPeriod ? 'Day ' + st.cycleDay + ' of your period' : st.last ? (st.next ? (daysBetween(t, st.next) <= 0 ? 'Your period is expected today' : 'Next period in ' + daysBetween(t, st.next) + ' days') : '') : 'Log your last period to start';
  el.innerHTML = '<div class="card cyc" style="flex-direction:column;align-items:stretch;text-align:center"><div style="font-size:40px">\u{1FA78}</div><div class="greet">' + status + '</div>' +
      (st.next ? '<span class="small" style="font-weight:800">' + L2('متوقعة ' + nice(st.next) + (st.early && st.late && st.next === addDays(st.last.start, st.cyc) && st.early !== st.late ? ' (بين ' + niceDM(st.early) + ' و' + niceDM(st.late) + ')' : '') + ' · الدورة حوالي ' + st.cyc + ' يوم · بتقعد حوالي ' + st.plen + ' أيام', 'Expected ' + nice(st.next) + ' · cycle about ' + st.cyc + ' days · period about ' + st.plen + ' days') + (st.guess ? L2(' (تخمين لحد ما تسجلي دورتين)', ' (a guess until you log 2 periods)') : '') + '</span>' : '') +
      '<div class="cyq"><b>' + L2('🩸 نزلت إمتى؟', '🩸 When did it start?') + '</b><div class="row" style="justify-content:center"><button class="btn" data-cys="0">' + L2('النهارده', 'Today') + '</button><button class="btn soft" data-cys="1">' + L2('امبارح', 'Yesterday') + '</button><button class="btn soft" data-cys="2">' + L2('أول امبارح', '2 days ago') + '</button><input class="in" type="date" id="cyStartPick" max="' + t + '" aria-label="Pick the day" style="width:auto;min-height:42px"></div></div>' +
      (st.inPeriod || (st.last && daysBetween(st.last.end, t) <= 7) ? '<div class="cyq"><b>' + L2('✅ خلصت إمتى؟', '✅ When did it end?') + '</b><div class="row" style="justify-content:center"><button class="btn soft" data-cye="0">' + L2('النهارده', 'Today') + '</button><button class="btn soft" data-cye="1">' + L2('امبارح', 'Yesterday') + '</button><input class="in" type="date" id="cyEndPick" max="' + t + '" min="' + (st.last ? st.last.start : '') + '" aria-label="Pick the day" style="width:auto;min-height:42px"></div></div>' : '') +
      '<span class="small muted" style="font-weight:700">' + L2('أو دوسي على أي يوم في الكالندر تحت وغيّري النزول بتاعه.', 'Or tap any day in the calendar below and set its flow.') + '</span></div>' +
    (W && st.next && !wedHit ? (() => { let s0 = st.next; while (s0 && addDays(s0, st.cyc) <= W) s0 = addDays(s0, st.cyc); const gap = s0 ? daysBetween(addDays(s0, st.plen - 1), W) : null;
      return s0 && gap != null && gap >= 0 && gap <= 14 ? '<div class="card" style="border-color:var(--gold);background:var(--gold-soft)"><h2>\u{1F48D} ' + L2('الدورة والفرح', 'Period and the wedding') + '</h2><p style="margin:0;font-weight:700">' + L2('المتوقع تنزل حوالي ' + niceDM(s0) + ' وتخلص حوالي ' + niceDM(addDays(s0, st.plen - 1)) + '، يعني قبل الفرح بحوالي ' + gap + (gap >= 3 && gap <= 10 ? ' أيام.' : ' يوم.') + ' ده تقدير، وممكن تتأخر أو تبدر كام يوم، فلو حابة تتأكدي كلّمي دكتورتك قبلها بكام أسبوع.', 'Expected around ' + niceDM(s0) + '–' + niceDM(addDays(s0, st.plen - 1)) + ', about ' + gap + ' days before the wedding. It can shift a few days.') + '</p></div>' : ''; })() : '') +
    (wedHit ? '<div class="card" style="border-color:var(--gold);background:var(--gold-soft)"><h2>\u{1F48D} Heads-up for the wedding</h2><p style="margin:0;font-weight:700">Your period may come around 31 December. If you want to plan around it, talk to your gynaecologist a few weeks before.</p></div>' : '') +
    '<div class="monthnav"><button data-cm="-1" aria-label="Previous month">‹</button><b>' + MONTHS_L[first.getMonth()] + ' ' + first.getFullYear() + '</b><button data-cm="1" aria-label="Next month">›</button></div>' +
    '<div class="card"><div class="cal">' + cells + '</div><div class="chips" style="justify-content:center;font-size:12px"><span class="chip lg on-p">Period</span><span class="chip lg pr">Expected</span><span class="chip lg fe">Fertile (estimate)</span></div></div>' +
    '<div class="card"><div class="card-head"><h2>' + (sel === t ? 'Today' : nice(sel)) + '</h2><input class="in" id="cySel" type="date" value="' + sel + '" style="width:auto;padding:6px 8px;font-size:13px" aria-label="Day"></div>' +
      '<h3>Flow</h3><div class="chips"><button class="chip' + (!flow ? ' on' : '') + '" data-fl="">None</button>' + FLOWS.map(([id, l, e]) => '<button class="chip' + (flow === id ? ' on' : '') + '" data-fl="' + id + '">' + e + ' ' + l + '</button>').join('') + '</div>' +
      '<h3>How I feel</h3><div class="chips">' + SYMPTOMS.map(([id, l, e]) => '<button class="chip' + (sym.includes(id) ? ' on' : '') + '" data-sy="' + id + '">' + e + ' ' + l + '</button>').join('') + '</div>' +
      '<label class="field"><span>Note</span><textarea class="in" id="cyNote" placeholder="Anything to remember…" style="min-height:50px">' + esc(S.cycle.notes[sel] || '') + '</textarea></label></div>' +
    (st.P.length ? '<div class="card"><h2>My periods</h2><div class="list">' + st.P.slice().reverse().slice(0, 8).map((p, i, a) => { const prev = a[i + 1]; return '<div class="item"><span style="font-size:18px">\u{1FA78}</span><span class="t">' + nice(p.start) + (p.end !== p.start ? ' – ' + nice(p.end) : '') + '<span class="s">' + p.len + ' days' + (prev ? ' · cycle ' + daysBetween(prev.start, p.start) + ' days' : '') + '</span></span><span></span></div>'; }).join('') + '</div></div>' : '') +
    '<p class="note">Predictions are estimates from your own logs, not medical advice. A reminder comes 2 days before.</p>';
  const again = () => VIEWS['me.cycle'](el);
  $$('[data-cd]', el).forEach(b => b.onclick = () => { ui.cycDay = b.dataset.cd; again(); });
  $$('[data-cm]', el).forEach(b => b.onclick = () => { const d = parseD(k + '-01'); d.setMonth(d.getMonth() + +b.dataset.cm); ui.cycMonth = ym(d); again(); });
  $('#cySel', el).onchange = e => { ui.cycDay = e.target.value || t; ui.cycMonth = ui.cycDay.slice(0, 7); again(); };
  $$('[data-fl]', el).forEach(b => b.onclick = () => { if (b.dataset.fl) S.cycle.days[sel] = b.dataset.fl; else delete S.cycle.days[sel]; save(); again(); });
  $$('[data-sy]', el).forEach(b => b.onclick = () => { const a = S.cycle.sym[sel] = S.cycle.sym[sel] || [], i = a.indexOf(b.dataset.sy); if (i >= 0) a.splice(i, 1); else a.push(b.dataset.sy); save(); b.classList.toggle('on'); });
  $('#cyNote', el).oninput = e => { S.cycle.notes[sel] = e.target.value; save(); };
  const startOn = d => { if (!d || d > t) return; const end = addDays(d, Math.max(0, Math.min(daysBetween(d, t), st.plen - 1)));
    for (let x = d; x <= end; x = addDays(x, 1)) if (!S.cycle.days[x] || S.cycle.days[x] === 'spot') S.cycle.days[x] = x === d ? 'medium' : (S.cycle.days[x] || 'medium');
    ui.cycDay = d; ui.cycMonth = d.slice(0, 7); save(); toast(L2('اتسجلت من ' + niceDM(d) + ' ♡ خلي بالك من نفسك', 'Logged from ' + niceDM(d) + ' ♡')); again(); };
  const endOn = d => { const L = cycleStats().last; if (!d || !L || d < L.start) return toast(L2('اختاري يوم بعد ما نزلت', 'Pick a day after it started'));
    for (let x = L.start; x <= d; x = addDays(x, 1)) if (!S.cycle.days[x] || S.cycle.days[x] === 'spot') S.cycle.days[x] = 'light';
    for (let x = addDays(d, 1); x <= addDays(d, 10); x = addDays(x, 1)) if (S.cycle.days[x] && x <= t) delete S.cycle.days[x];
    save(); toast(L2('اتسجل إنها خلصت ' + niceDM(d) + ' ♡', 'Saved: ended ' + niceDM(d) + ' ♡')); again(); };
  $$('[data-cys]', el).forEach(b => b.onclick = () => startOn(addDays(t, -b.dataset.cys)));
  $('#cyStartPick', el).onchange = e => startOn(e.target.value);
  $$('[data-cye]', el).forEach(b => b.onclick = () => endOn(addDays(t, -b.dataset.cye)));
  const cep = $('#cyEndPick', el); if (cep) cep.onchange = e => endOn(e.target.value);
};
const meTab = TABS.find(x => x.id === 'me'); if (meTab && !meTab.subs.some(x => x[0] === 'cycle')) meTab.subs.splice(4, 0, ['cycle', 'Period']);
function cycleReminders(push, at){
  if (!S.cycle || !Object.keys(S.cycle.days).length) return;
  const st = cycleStats(); if (!st.next || st.inPeriod) return;
  push('cyc-2', '\u{1FA78} Period in 2 days', 'Keep pads, painkillers and a hot water bottle ready. Be kind to yourself ♡', at(parseD(addDays(st.next, -2)), 10, 0));
  push('cyc-0', '\u{1FA78} Period expected today', 'Log it in Monmon’s Life when it starts.', at(parseD(st.next), 10, 0));
}

/* ============ PHOTOS: food, diary, outings, tasks ============
   Each photo is shrunk to about 1080px, kept on the phone in IndexedDB, and a copy goes to the iPhone app's own files.
   S.photos = {key: [photoId, …]} where key is like 'diary:2026-11-02', 'task:<id>', 'exp:<id>', 'mesh:<id>', 'food:<id>', 'meal:<date>-<i>'. */
const PHDB = (() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('monmon-photos', 1); r.onupgradeneeded = () => r.result.createObjectStore('p'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const run = (mode, fn) => open().then(db => new Promise((res, rej) => { const t = db.transaction('p', mode), q = fn(t.objectStore('p')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }));
  return {put:(id, d) => run('readwrite', s => s.put(d, id)), get:id => run('readonly', s => s.get(id)), del:id => run('readwrite', s => s.delete(id))};
})();
const phWait = {};
window.__photoIn = (id, data) => { if (data) PHDB.put(id, data).catch(() => {}); (phWait[id] || []).forEach(f => f(data || null)); delete phWait[id]; };
function photoData(id){
  return PHDB.get(id).catch(() => null).then(d => {
    if (d) return d;
    const n = native(); if (!n) return null;
    return new Promise(res => { (phWait[id] = phWait[id] || []).push(res); try { n.postMessage({type:'getPhoto', id}); } catch(e){ res(null); } setTimeout(() => res(null), 4000); });
  });
}
function shrink(file){
  return new Promise((res, rej) => { const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { const m = 1080, r = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.72)); };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('image')); }; im.src = url; });
}
const photosOf = key => (S.photos && S.photos[key]) || [];
function photoStrip(key, add = true){
  const ids = photosOf(key);
  if (!add && !ids.length) return '';
  return '<div class="phs" data-phkey="' + key + '">' + ids.map(id => '<button class="ph" data-phv="' + id + '" data-phk="' + key + '" aria-label="Photo"><img data-phid="' + id + '" alt=""></button>').join('') +
    (add ? '<label class="phadd" aria-label="Add photo">\u{1F4F7}<span>' + (ids.length ? '+' : 'Add photo') + '</span><input type="file" accept="image/*" multiple data-phin="' + key + '" hidden></label>' : '') + '</div>';
}
function refreshStrips(key){ document.querySelectorAll('.phs[data-phkey="' + key + '"]').forEach(s => { const add = !!s.querySelector('.phadd'); s.outerHTML = photoStrip(key, add) || '<div class="phs" data-phkey="' + key + '"></div>'; }); fillPhotos(document); }
function fillPhotos(root){ (root || document).querySelectorAll('img[data-phid]:not([src])').forEach(img => { img.setAttribute('src', ''); photoData(img.dataset.phid).then(d => { if (d) img.src = d; else img.closest('.ph') && img.closest('.ph').classList.add('missing'); }); }); }
let phTick = 0;
new MutationObserver(() => { if (phTick) return; phTick = requestAnimationFrame(() => { phTick = 0; fillPhotos(document); }); }).observe(document.body, {childList:true, subtree:true});
document.addEventListener('change', async ev => {
  const inp = ev.target.closest && ev.target.closest('input[data-phin]'); if (!inp || !inp.files || !inp.files.length) return;
  const key = inp.dataset.phin, files = [...inp.files]; toast('Adding photo…');
  S.photos = S.photos || {}; const list = S.photos[key] = S.photos[key] || [];
  for (const f of files){ try { const d = await shrink(f), id = 'ph' + uid(); await PHDB.put(id, d); list.push(id); const n = native(); if (n) try { n.postMessage({type:'photo', id, data:d}); } catch(e){} } catch(e){ toast('That photo couldn’t be added'); } }
  save(); refreshStrips(key); toast('Photo saved \u{1F4F7}');
}, true);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-phv]'); if (!b) return; ev.preventDefault(); ev.stopPropagation();
  const id = b.dataset.phv, key = b.dataset.phk, v = document.createElement('div'); v.className = 'phview';
  v.innerHTML = '<img alt=""><div class="row" style="justify-content:center"><button class="btn soft" data-phdel>Delete photo</button><button class="btn" data-phclose>Close</button></div>';
  document.body.appendChild(v); photoData(id).then(d => { if (d) $('img', v).src = d; });
  v.onclick = e => { if (e.target === v || e.target.closest('[data-phclose]')) v.remove(); };
  $('[data-phdel]', v).onclick = () => { S.photos[key] = photosOf(key).filter(x => x !== id); PHDB.del(id).catch(() => {}); const n = native(); if (n) try { n.postMessage({type:'delPhoto', id}); } catch(e){} save(); v.remove(); refreshStrips(key); toast('Photo deleted'); };
}, true);
function photoMigrate(){ S.photos = S.photos && typeof S.photos === 'object' ? S.photos : {}; }

/* ============ DAILY WISDOM (242) AND DAILY LESSON (201 + facts) ============ */
const wisdomList = () => isAr() ? WISDOM.concat(WISDOM_AR) : WISDOM;
const LESSON_START = '2026-10-28';
function lessonIndex(){ const all = LESSONS.length + INSIGHTS.length; return ((daysBetween(LESSON_START, todayStr()) + (S.lessonShift || 0)) % all + all) % all; }
function lessonCardHTML(){
  if (!isAr()){ const doy = dayOfYear(new Date()), ins = INSIGHTS[(doy + (S.insightShift || 0)) % INSIGHTS.length];
    return '<div class="card insight"><span class="tag">Did you know · ' + ins[0] + '</span><p>' + esc(ins[1]) + '</p><button class="linkbtn" id="insNext" style="align-self:flex-start;background:var(--surface);color:var(--lilac)">Another one</button></div>'; }
  const i = lessonIndex();
  if (i >= LESSONS.length){ const ins = INSIGHTS[i - LESSONS.length];
    return '<div class="card insight"><span class="tag">Did you know · ' + ins[0] + '</span><p>' + esc(ins[1]) + '</p><div class="row"><button class="linkbtn" data-ls="-1">‹ اللي قبله</button><button class="linkbtn" data-ls="1">اللي بعده ›</button></div></div>'; }
  const L = LESSONS[i], F = LESSON_FIELDS.find(f => f[0] === L.f), inField = LESSONS.filter(x => x.f === L.f), n = inField.indexOf(L) + 1;
  return '<div class="card insight lesson" data-notr><span class="tag">' + F[1] + ' درس النهارده · ' + F[2] + ' · ' + n + ' من ' + inField.length + '</span><h2 class="plain">' + esc(L.t) + '</h2><p>' + esc(L.x) + '</p>' +
    (L.ex ? '<p class="todo"><b>مثال</b>' + esc(L.ex) + '</p>' : '') +
    '<div class="row"><button class="linkbtn" data-ls="-1">‹ اللي قبله</button><button class="linkbtn" data-ls="1">اللي بعده ›</button><button class="linkbtn" data-go="grow:learn">كل الدروس</button></div></div>';
}
function bindLessonCard(el, again){
  $$('[data-ls]', el).forEach(b => b.onclick = () => { S.lessonShift = (S.lessonShift || 0) + +b.dataset.ls; save(); again(); setTimeout(() => { const c = $('.insight', el); if (c) c.scrollIntoView({block:'center'}); }, 0); });
}
const growTab = TABS.find(t => t.id === 'grow');
if (growTab){ if (!growTab.subs.some(x => x[0] === 'fr')) growTab.subs.unshift(['fr', 'French']); if (!growTab.subs.some(x => x[0] === 'learn')) growTab.subs.splice(1, 0, ['learn', 'Learn']); }
VIEWS['grow.learn'] = function(el){
  const f = ui.learnField || LESSONS[Math.min(lessonIndex(), LESSONS.length - 1)].f, list = LESSONS.filter(x => x.f === f), cur = LESSONS[lessonIndex()];
  el.innerHTML = '<div class="card tint"><div class="greet">' + (isAr() ? 'اتعلّمي كل يوم حاجة' : 'A lesson a day') + ' \u{1F4DA}</div><span class="small muted" style="font-weight:700">' + (isAr() ? 'أساسيات 10 مجالات، درس ورا درس. درس النهارده بيظهر تحت في الصفحة الرئيسية.' : 'Foundations of 10 fields, one lesson a day, in Egyptian Arabic.') + '</span></div>' +
    '<div class="chips">' + LESSON_FIELDS.map(F => '<button class="chip' + (F[0] === f ? ' on' : '') + '" data-lf="' + F[0] + '">' + F[1] + ' ' + F[2] + ' <span class="cnt">' + LESSONS.filter(x => x.f === F[0]).length + '</span></button>').join('') + '</div>' +
    list.map((L, i) => '<div class="card lesson' + (L === cur ? ' now' : '') + '" data-notr><span class="small muted" style="font-weight:900">' + (i + 1) + ' / ' + list.length + (L === cur ? ' · درس النهارده' : '') + '</span><h2 class="plain">' + esc(L.t) + '</h2><p style="margin:0">' + esc(L.x) + '</p>' + (L.ex ? '<p class="todo" style="margin:0"><b>مثال</b> ' + esc(L.ex) + '</p>' : '') + '</div>').join('');
  $$('[data-lf]', el).forEach(b => b.onclick = () => { ui.learnField = b.dataset.lf; VIEWS['grow.learn'](el); });
};

/* ============ FRENCH A1 IN TWO MONTHS ============ */
// S.fr = {done:{n:date}, best:{n:score}, last:n}
function frMigrate(){
  S.fr = S.fr && typeof S.fr === 'object' ? S.fr : {done:{}, best:{}};
  S.fr.done = S.fr.done || {}; S.fr.best = S.fr.best || {};
  if (!S.seedFr){ if (!S.habits.some(h => h.id === 'french')) S.habits.push({id:'french', name:'French lesson', e:'\u{1F1EB}\u{1F1F7}', freq:'daily', target:1, reward:'A croissant date when you finish a week'}); S.seedFr = true; }
}
function frToday(){ return Math.min(FR.length, Math.max(1, daysBetween(FR_START, todayStr()) + 1)); }
const frClean = t => t.replace(/\([^)]*\)/g, '').replace(/[…]/g, '').replace(/ \/ /g, ', ').trim();
function say(text, slow){ return sayFr(text, slow); }
try { if (window.speechSynthesis) speechSynthesis.getVoices(); } catch(e){}
document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-say]'); if (!b) return; ev.preventDefault(); ev.stopPropagation(); say(b.dataset.say); }, true);
function frWordRow(w){ return '<div class="frw"><button class="say" data-say="' + esc(w[0]) + '" aria-label="Listen">\u{1F50A}</button><span class="t" data-notr><b lang="fr" dir="ltr">' + esc(w[0]) + '</b><span class="s">' + esc(w[1]) + (w[2] ? ' · <span class="pr">' + esc(w[2]) + '</span>' : '') + '</span></span>' + (typeof askBtn === 'function' ? askBtn('fr', 'فرنساوي', w[0] + ' = ' + w[1], true) : '') + '</div>'; }
function frLessonHTML(n){
  const L = FR[n - 1], done = S.fr.done[n], best = S.fr.best[n];
  return '<div class="card frcard"><div class="card-head"><h2>' + (isAr() ? 'درس ' : 'Lesson ') + n + '</h2><span class="small muted" style="font-weight:800">' + nice(addDays(FR_START, n - 1)) + '</span></div><div class="greet" data-notr>' + esc(L.t) + '</div>' +
    '<h3>' + (isAr() ? 'الكلمات' : 'Words') + '</h3><div class="list">' + L.w.map(frWordRow).join('') + '</div>' +
    '<h3>' + (isAr() ? 'جُمل' : 'Phrases') + '</h3><div class="list">' + L.p.map(p => frWordRow([p[0], p[1]])).join('') + '</div>' +
    '<div class="frnote" data-notr><b>\u{1F4A1} ' + (isAr() ? 'القاعدة' : 'Tip') + '</b><p>' + esc(L.n) + '</p></div>' +
    '<div class="row"><button class="btn" data-frquiz="' + n + '" style="flex:1">\u{1F4DD} ' + (isAr() ? 'كويز الدرس' : 'Lesson quiz') + (best != null ? ' · ' + best + '/5' : '') + '</button>' +
    (done ? '<span class="pill" style="align-self:center">✓ ' + (isAr() ? 'خلص' : 'Done') + '</span>' : '<button class="btn soft" data-frdone="' + n + '" style="flex:1">✓ ' + (isAr() ? 'خلصت الدرس' : 'I finished it') + '</button>') + '</div></div>';
}
function frQuizSet(n, review){
  const pool = review ? FR.slice(0, n).flatMap(l => l.w) : FR[n - 1].w, qs = [], rnd = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => a.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  if (!review && FR[n - 1].q) FR[n - 1].q.forEach(q => qs.push({q:q[0], opts:q[1].slice(), ok:q[2], fr:true}));
  const all = FR.flatMap(l => l.w), want = review ? 8 : 5;
  let guard = 0;
  while (qs.length < want && guard++ < 50){
    const w = rnd(pool), kind = ['fa', 'af', 'listen'][Math.floor(Math.random() * 3)];
    const others = shuffle(all.filter(x => x[0] !== w[0] && x[1] !== w[1])).slice(0, 2);
    if (qs.some(q => q.key === w[0])) continue;
    if (kind === 'fa') qs.push({key:w[0], q:(isAr() ? 'يعني إيه "' : 'What does "') + w[0] + '"?', opts:[w[1], others[0][1], others[1][1]], ok:0});
    else if (kind === 'af') qs.push({key:w[0], q:(isAr() ? 'إزاي تقولي "' : 'How do you say "') + w[1] + '"?', opts:[w[0], others[0][0], others[1][0]], ok:0, fr:true});
    else qs.push({key:w[0], q:(isAr() ? 'اسمعي واختاري الكلمة' : 'Listen and pick the word'), listen:w[0], opts:[w[0], others[0][0], others[1][0]], ok:0, fr:true});
  }
  return qs.slice(0, want).map(q => { const order = shuffle([0, 1, 2].slice(0, q.opts.length)); return Object.assign({}, q, {opts:order.map(i => q.opts[i]), ok:order.indexOf(q.ok)}); });
}
function frQuiz(n, review, done){
  const qs = frQuizSet(n, review); let i = 0, score = 0;
  const show = sh => {
    const q = qs[i], box = $('[data-qbox]', sh);
    if (!q){ const of = qs.length, pct = score / of;
      if (!review){ S.fr.best[n] = Math.max(S.fr.best[n] || 0, Math.round(score / of * 5)); if (pct >= 0.6 && !S.fr.done[n]){ S.fr.done[n] = todayStr(); if (S.habits.some(h => h.id === 'french')) setHabit('french', todayStr(), true); } save(); }
      box.innerHTML = '<div style="text-align:center;font-size:48px">' + (pct >= 0.8 ? '\u{1F389}' : pct >= 0.6 ? '\u{1F44F}' : '\u{1F4AA}') + '</div><div class="greet" style="text-align:center">' + score + ' / ' + of + '</div><p style="text-align:center;margin:0;font-weight:700">' +
        (pct >= 0.8 ? (isAr() ? 'Bravo ! أنتِ نجمة.' : 'Bravo! You’re a star.') : pct >= 0.6 ? (isAr() ? 'Très bien ! كمّلي كده.' : 'Très bien! Keep going.') : (isAr() ? 'راجعي الدرس تاني وجربي كمان مرة.' : 'Review the lesson and try again.')) + '</p>';
      return; }
    box.innerHTML = '<span class="small muted" style="font-weight:900">' + (i + 1) + ' / ' + qs.length + '</span><div class="greet" style="font-size:19px" data-notr>' + esc(q.q) + '</div>' + (q.listen ? '<button class="btn soft" data-say="' + esc(q.listen) + '">\u{1F50A} ' + (isAr() ? 'اسمعي' : 'Listen') + '</button>' : '') +
      '<div class="list">' + q.opts.map((o, k) => '<button class="qopt" data-k="' + k + '" data-notr' + (q.fr ? ' lang="fr" dir="ltr"' : '') + '>' + esc(o) + '</button>').join('') + '</div>';
    if (q.listen) setTimeout(() => say(q.listen), 250);
    $$('[data-k]', box).forEach(b => b.onclick = () => { const k = +b.dataset.k; if (k === q.ok) score++;
      $$('[data-k]', box).forEach(x => { x.disabled = true; if (+x.dataset.k === q.ok) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
      if (q.fr || q.key) say(q.fr ? q.opts[q.ok] : q.key); setTimeout(() => { i++; show(sh); }, 1100); });
  };
  sheet('<div style="text-align:center;font-size:36px">\u{1F1EB}\u{1F1F7}</div><h2 class="plain" style="justify-content:center">' + (review ? (isAr() ? 'كويز مراجعة على كل اللي فات' : 'Review quiz') : (isAr() ? 'كويز درس ' : 'Quiz · lesson ') + n) + '</h2><div data-qbox style="display:flex;flex-direction:column;gap:10px"></div>',
    (sh, close) => { show(sh); const c = $('[data-close]', sh); if (c) c.addEventListener('click', () => done && done()); });
}
VIEWS['grow.fr'] = function(el){
  const today = frToday(), sel = ui.frLesson || today, doneN = Object.keys(S.fr.done).length, started = todayStr() >= FR_START;
  let strip = ''; for (let n = 1; n <= FR.length; n++) strip += '<button class="dpill' + (n === sel ? ' sel' : '') + (n === today && started ? ' today' : '') + (S.fr.done[n] ? ' done' : '') + '" data-frn="' + n + '"><span class="dn">' + (isAr() ? 'درس' : 'L') + '</span><span class="dd">' + n + '</span><span class="dot"></span></button>';
  el.innerHTML = '<div class="card tint frhero"><div class="greet">\u{1F1EB}\u{1F1F7} ' + (isAr() ? 'فرنساوي A1 في شهرين' : 'French A1 in two months') + '</div>' +
      '<span class="small" style="font-weight:800">' + (started ? (isAr() ? 'النهارده درس ' + today + ' من ' + FR.length : 'Today: lesson ' + today + ' of ' + FR.length) : (isAr() ? 'الكورس بيبدأ 1 نوفمبر، وتقدري تبدئي بدري.' : 'Starts 1 November; you can start early.')) + ' · ' + doneN + ' ' + (isAr() ? 'درس خلص' : 'done') + '</span>' +
      '<div class="bar good"><i style="width:' + (doneN / FR.length * 100) + '%"></i></div>' +
      '<div class="row"><button class="btn soft" id="frReview" style="flex:1">\u{1F501} ' + (isAr() ? 'كويز مراجعة' : 'Review quiz') + '</button></div>' +
      '<span class="small muted" style="font-weight:700">' + (isAr() ? 'دوسي 🔊 تسمعي النطق بصوت الآيفون الفرنساوي، من غير نت ومن غير مساحة.' : 'Tap 🔊 to hear it with the iPhone’s French voice.') + '</span></div>' +
    '<div class="strip" id="frStrip">' + strip + '</div>' + frLessonHTML(sel);
  const again = () => VIEWS['grow.fr'](el);
  $$('[data-frn]', el).forEach(b => b.onclick = () => { ui.frLesson = +b.dataset.frn; again(); });
  $$('[data-frquiz]', el).forEach(b => b.onclick = () => frQuiz(+b.dataset.frquiz, false, again));
  $$('[data-frdone]', el).forEach(b => b.onclick = ev => { S.fr.done[b.dataset.frdone] = todayStr(); if (S.habits.some(h => h.id === 'french')) setHabit('french', todayStr(), true, ev); save(); toast('Bravo ! ✓'); again(); });
  $('#frReview', el).onclick = () => frQuiz(Math.max(sel, Math.max(1, ...Object.keys(S.fr.done).map(Number))), true, again);
  const cur = $('#frStrip', el).children[sel - 1]; if (cur) requestAnimationFrame(() => cur.scrollIntoView({inline:'center', block:'nearest'}));
};
function frHomeHTML(){
  const n = frToday(), L = FR[n - 1], done = S.fr.done[n], started = todayStr() >= FR_START;
  return '<div class="card frhome"><div class="card-head"><h2>\u{1F1EB}\u{1F1F7} ' + (isAr() ? 'فرنساوي النهارده' : 'French today') + '</h2><span class="num" style="font-weight:700">' + n + ' / ' + FR.length + '</span></div>' +
    '<span class="small" style="font-weight:800">' + (started ? '' : (isAr() ? 'بيبدأ 1 نوفمبر · ' : 'Starts 1 Nov · ')) + (isAr() ? 'درس ' : 'Lesson ') + n + ': <span data-notr>' + esc(L.t) + '</span>' + (done ? ' ✓' : '') + '</span>' +
    '<div class="list">' + L.w.slice(0, 3).map(frWordRow).join('') + '</div>' +
    '<div class="row"><button class="btn" data-go="grow:fr" style="flex:1">' + (isAr() ? 'افتحي الدرس' : 'Open lesson') + '</button><button class="btn soft" data-frquiz="' + n + '" style="flex:1">\u{1F4DD} ' + (isAr() ? 'كويز النهارده' : 'Today’s quiz') + '</button></div></div>';
}
function frReminders(repeat){ if (S.settings.rem && S.settings.rem.plans === false) return; repeat.push({id:'fr-daily', title:'\u{1F1EB}\u{1F1F7} Bonjour, Monmon !', body:'15 minutes of French today: one lesson and a short quiz.', hour:19, minute:30}); }
