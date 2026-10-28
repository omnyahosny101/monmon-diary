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
  const row = x => '<div class="item"><button class="tick" data-htdone="' + x.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + (x.job ? '<span class="pill">' + esc(jobName(x.job)) + '</span>' : '') + (x.prio && x.prio !== 'normal' ? '<span class="pill ' + PRIO[x.prio].c + '">' + PRIO[x.prio].l + '</span>' : '') + esc(x.title) + (x.due ? '<span class="s" style="' + (x.due < t ? 'color:var(--danger);font-weight:900' : '') + '">' + (x.due < t ? 'Overdue · ' : 'Due ') + nice(x.due) + (x.time ? ' · by ' + x.time : '') + '</span>' : '') + '</span><span class="ibtns">' + editBtn('task', x.id) + flagBtn('t:' + x.id, x.prio === 'urgent') + '</span></div>';
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
    emergencyHTML() +
    weddingTrackerHTML() +
    '<div class="card wisdom"><span class="src">\u{1F4DA} ' + esc(wz.src) + '</span><p class="idea">' + esc(wz.idea) + '</p><p class="todo"><b>Try this today</b>' + esc(wz.advice) + '</p><button class="linkbtn" id="wzNext" style="align-self:flex-start;background:var(--surface);color:var(--berry)">Another one</button></div>' +
    mashawerHTML() +
    tasksHTML() +
    '<div class="card"><h2>What did I do today?</h2><div class="chips">' + DAYLOG.map(x => '<button class="chip' + (logs.includes(x.id) ? ' on' : '') + '" data-l="' + x.id + '">' + x.e + ' ' + x.name + '</button>').join('') + '</div></div>' +
    '<div class="card"><div class="card-head"><h2>Spent today</h2><span class="amt">' + money(spentOn(day)) + '</span></div>' +
      '<div class="row"><label class="field" style="flex:1 1 90px"><span>Amount</span><input class="in num" id="qAmt" type="number" inputmode="decimal" min="0" placeholder="0"></label>' +
      '<label class="field" style="flex:2 1 150px"><span>Category</span><select class="in" id="qCat">' + CATS.map(c => '<option value="' + c.id + '">' + c.e + ' ' + c.name + '</option>').join('') + '</select></label></div>' +
      '<div class="row"><label class="field"><span>Note</span><input class="in" id="qNote" placeholder="What was it?"></label><label class="field" style="flex:1 1 120px"><span>Day</span><input class="in" id="qDate" type="date" value="' + day + '"></label></div><button class="btn full" id="qAdd">Add</button>' +
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
  $('#insNext', el).onclick = () => { S.insightShift = (S.insightShift || 0) + 1; save(); again(); setTimeout(() => { const i = $('.insight'); if (i) i.scrollIntoView({block:'center'}); }, 0); };
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
  const list = foodChoices(), type = x ? x.type || 'Other' : 'Other';
  sheet('<div style="text-align:center;font-size:44px">\u{1F37D}\u{FE0F}</div><h2 class="plain" style="justify-content:center">' + (x ? 'Edit what I ate' : 'What did I eat?') + '</h2>' +
    '<label class="field"><span>Day</span><input class="in" data-fd type="date" value="' + date + '"></label>' +
    '<div class="chips" data-ft>' + FOOD_TYPES.map(([t, e]) => '<button class="chip' + (t === type ? ' on' : '') + '" data-ftype="' + t + '">' + e + ' ' + t + '</button>').join('') + '</div>' +
    (x ? '' : '<label class="field"><span>Pick from my dishes</span><select class="in" data-fpick><option value="">Type it myself</option>' + list.map((d, i) => '<option value="' + i + '">' + esc(d.name) + ' · ' + d.kcal + ' kcal</option>').join('') + '</select></label>') +
    '<label class="field"><span>Food</span><input class="in" data-fn value="' + esc(x ? x.name : '') + '" placeholder="Koshari, sandwich, latte…"></label>' +
    '<div class="row"><label class="field"><span>Calories (kcal)</span><input class="in num" data-fk type="number" inputmode="decimal" min="0" value="' + (x ? x.kcal : '') + '"></label><label class="field"><span>Protein (g)</span><input class="in num" data-fp type="number" inputmode="decimal" min="0" value="' + (x ? x.protein : '') + '"></label></div>' +
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
      else (S.extras[d] = S.extras[d] || []).push({id:uid(), name, e, kcal, protein, type:t});
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
      (extras.length ? extras.map(x => '<div class="item"><span style="font-size:20px">' + (x.e || '\u{1F37D}\u{FE0F}') + '</span><span class="t">' + esc(x.name) + '<span class="s">' + (x.type || 'Treat') + ' · ' + x.kcal + ' kcal · ' + x.protein + ' g</span></span>' + delBtn('data-fldel', d + '|' + x.id) + '</div>').join('') : '') +
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
    }).join('') + '<button class="btn full" data-esave>Save</button>',
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
