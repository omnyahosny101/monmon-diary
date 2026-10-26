/* ============ HOME (Today) ============
   Wedding tracker on top, an overview of every section, habits split daily/weekly/monthly (3 per row),
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
  S.wedding.beauty.forEach(b => out.push({key:'b:' + b.id, e:b.e, title:b.name, date:b.planned, done:!!b.done, kind:'Beauty'}));
  S.wedding.checklist.forEach(c => out.push({key:'c:' + c.id, e:c.e || '\u{1F48D}', title:c.title, date:c.date || '', done:!!c.done, kind:'To do'}));
  S.mashawer.filter(m => m.wedding).forEach(m => out.push({key:'m:' + m.id, e:'\u{1F4CD}', title:m.name, date:m.date, done:!!m.done, kind:'Meshwar'}));
  Object.values(S.selfcare).forEach(l => l.filter(s => s.wedding).forEach(s => out.push({key:'s:' + s.id, e:s.e, title:s.name, date:s.planned, done:!!s.done, kind:'Self-care'})));
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
  if (k === 's') Object.values(S.selfcare).forEach(l => l.forEach(s => { if (s.id === id){ s.done = s.done ? '' : t; logPaid(s, 'selfcare'); } }));
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

/* ---------- overview of every section ---------- */
function overviewHTML(){
  const day = todayStr(), k = ym(new Date()), n = planDayNum(new Date()), inPlan = n >= 1 && n <= 30;
  const eaten = inPlan ? mealsDone(n) : 0, daily = S.habits.filter(h => h.freq === 'daily'), dDone = daily.filter(h => habitDone(h.id, day)).length;
  const B = S.settings.budgets || {}, bt = sum(Object.keys(B), c => B[c]), ms = sum(S.spend.filter(s => inMonth(s, k)), s => s.amount);
  const openT = S.tasks.filter(x => !x.done), urg = openT.filter(x => x.prio === 'urgent').length;
  const upM = S.mashawer.filter(m => !m.done && m.date >= day).sort((a, b) => a.date < b.date ? -1 : 1);
  const sc = (S.selfcare[k] || []), scNext = sc.filter(s => !s.done && s.planned >= day).sort((a, b) => a.planned < b.planned ? -1 : 1)[0];
  const mood = S.diary[day] && S.diary[day].mood, ws = weekStart(new Date());
  const gym = S.habits.find(h => h.id === 'gym'), gymN = gym ? weekCount('gym', day) : S.workouts.filter(w => parseD(w.date) >= ws).length;
  const pages = sum(Object.keys(S.media).filter(d => d.slice(0, 7) === k), d => S.media[d].pages);
  const tiles = [
    ['\u{1F37D}\u{FE0F}', inPlan ? eaten + '/4' : 'Day ' + Math.max(1, n), inPlan ? 'meals today' : 'meal plan soon', 'food:meals'],
    ['✅', dDone + '/' + daily.length, 'daily habits', 'me:habits'],
    ['\u{1F4B8}', fmt(spentOn(day)), 'EGP spent today', 'money:spend'],
    ['\u{1F4CA}', bt ? Math.round(ms / bt * 100) + '%' : fmt(ms), bt ? 'of budget used' : 'EGP this month', 'money:overview'],
    ['\u{1FAD9}', fmt(sum(S.jars, jarTotal)), 'EGP in jars', 'money:savings'],
    ['\u{1F932}', String(S.sadaqa.filter(s => inMonth(s, k)).length), 'sadaqa this month', 'money:sadaqa'],
    ['\u{1F4BC}', String(openT.length), urg ? urg + ' urgent' : 'open tasks', 'plans:tasks', urg ? 'var(--danger)' : ''],
    ['\u{1F4CD}', String(upM.length), upM[0] ? 'next ' + nice(upM[0].date).slice(4) : 'mashawer', 'plans:mashawer'],
    ['\u{1F338}', scNext ? nice(scNext.planned).slice(4) : sc.filter(s => s.done).length + '/' + sc.length, scNext ? scNext.name : 'self-care', 'plans:selfcare'],
    ['\u{1F4AA}', gymN + '/' + (gym ? gym.target : 5), 'gym this week', 'me:body'],
    ['\u{1F4D6}', fmt(pages), 'pages this month', 'me:habits'],
    ['\u{1F4D4}', mood ? MOODS[mood - 1].e : '–', 'mood today', 'me:diary'],
    ['✨', String(S.exp.filter(x => x.done && x.doneOn && x.doneOn.slice(0, 7) === k).length), 'experiences', 'plans:exp'],
    ['\u{1F331}', String(sum(S.skills, s => s.sessions)), 'learning sessions', 'grow:skills'],
    ['\u{1F3AF}', S.vision.filter(v => v.done).length + '/' + S.vision.length, 'wishes come true', 'plans:vision'],
  ];
  return '<div class="card"><div class="card-head"><h2>Everything at a glance</h2></div><div class="ov">' +
    tiles.map(x => '<button class="ovt" data-go="' + x[3] + '"><span class="oe">' + x[0] + '</span><b' + (x[4] ? ' style="color:' + x[4] + '"' : '') + '>' + esc(x[1]) + '</b><span>' + esc(x[2]) + '</span></button>').join('') + '</div></div>';
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
  Object.values(S.selfcare).forEach(l => l.filter(s => !s.done && s.planned && s.planned >= day).forEach(s => coming.push({d:s.planned, e:s.e, title:s.name, when:nice(s.planned) + (s.wedding ? ' · \u{1F48D}' : '') + (s.price ? ' · ' + money(s.price) : '')})));
  coming.sort((a, b) => a.d < b.d ? -1 : 1);
  el.innerHTML =
    weddingTrackerHTML() +
    (urg.length ? '<div class="urgent"><h2>Do these first</h2>' + urg.slice(0, 4).map(x => '<button class="ur" data-udone="' + x.id + '"><span class="tick">' + CHECK + '</span><span><span class="pill" style="background:#fff;color:' + (x.prio === 'urgent' ? 'var(--danger)' : '#a86d00') + '">' + (x.prio === 'urgent' ? '\u{1F6A8} URGENT' : '⚠\u{FE0F} SOON') + '</span>' + esc(x.title) + (x.due ? '<span style="display:block;font-size:12px;opacity:.92">' + (x.due < day ? 'Overdue · ' : '') + nice(x.due) + (x.time ? ' · by ' + x.time : '') + '</span>' : '') + '</span></button>').join('') + '</div>' : '') +
    '<div class="card wisdom"><span class="src">\u{1F4DA} ' + esc(wz.src) + '</span><p class="idea">' + esc(wz.idea) + '</p><p class="todo"><b>Try this today</b>' + esc(wz.advice) + '</p><button class="linkbtn" id="wzNext" style="align-self:flex-start;background:var(--surface);color:var(--berry)">Another one</button></div>' +
    overviewHTML() +
    lifeTodayTop() +
    habitsHTML(day) +
    tasksHTML() +
    mashawerHTML() +
    '<div class="card"><h2>What did I do today?</h2><div class="chips">' + DAYLOG.map(x => '<button class="chip' + (logs.includes(x.id) ? ' on' : '') + '" data-l="' + x.id + '">' + x.e + ' ' + x.name + '</button>').join('') + '</div></div>' +
    '<div class="card"><div class="card-head"><h2>Dear diary</h2><span class="small muted">' + nice(day) + '</span></div>' +
      '<div class="moods">' + MOODS.map((m, i) => '<button class="mood' + (diary.mood === i + 1 ? ' on' : '') + '" data-mood="' + (i + 1) + '" aria-label="' + m.t + '">' + m.e + '<span>' + m.t + '</span></button>').join('') + '</div>' +
      '<h3>Today’s 3 questions</h3>' + qs.map(q => '<label class="field"><span class="qlab">' + esc(QUESTIONS[q]) + '</span><textarea class="in" data-q="' + q + '" placeholder="My answer…" style="min-height:50px">' + esc(qa[q] || '') + '</textarea></label>').join('') +
      '<label class="field"><span>What I did</span><textarea class="in" id="dSum" placeholder="A little summary of my day…">' + esc(diary.summary || '') + '</textarea></label>' +
      '<label class="field"><span>How I felt</span><textarea class="in" id="dFeel" placeholder="My feelings today…">' + esc(diary.feelings || '') + '</textarea></label>' +
      '<label class="field"><span>Quick notes and drafts</span><textarea class="in" id="dNote" placeholder="Anything to remember about today…">' + esc(S.notes[day] || '') + '</textarea></label>' +
      '<button class="linkbtn" data-go="me:days" style="align-self:flex-start">See my whole day ›</button></div>' +
    '<div class="card"><div class="card-head"><h2>Spent today</h2><span class="amt">' + money(spentOn(day)) + '</span></div>' +
      '<div class="row"><label class="field" style="flex:1 1 90px"><span>Amount</span><input class="in num" id="qAmt" type="number" inputmode="decimal" min="0" placeholder="0"></label>' +
      '<label class="field" style="flex:2 1 150px"><span>Category</span><select class="in" id="qCat">' + CATS.map(c => '<option value="' + c.id + '">' + c.e + ' ' + c.name + '</option>').join('') + '</select></label></div>' +
      '<div class="row"><label class="field"><span>Note</span><input class="in" id="qNote" placeholder="What was it?"></label><button class="btn" id="qAdd">Add</button></div>' +
      '<div class="list">' + (todaySpend.length ? todaySpend.map(spendRow).join('') : '<div class="empty">Nothing spent yet today.</div>') + '</div></div>' +
    lifeTodayMid() +
    (coming.length ? '<div class="card"><div class="card-head"><h2>Coming up</h2><button class="linkbtn" data-go="plans:selfcare">Self-care</button></div><div class="list">' + coming.slice(0, 4).map(c => '<div class="item"><span style="font-size:20px">' + c.e + '</span><span class="t">' + esc(c.title) + '<span class="s">' + c.when + '</span></span><span></span></div>').join('') + '</div></div>' : '') +
    (inPlan ? '<div class="card"><div class="card-head"><h2>Next meal</h2><button class="linkbtn" data-go="food">Food</button></div>' + nextMealHTML(n) + '</div>' : '') +
    '<div class="card insight"><span class="tag">Did you know · ' + ins[0] + '</span><p>' + esc(ins[1]) + '</p><button class="linkbtn" id="insNext" style="align-self:flex-start;background:var(--surface);color:var(--lilac)">Another one</button></div>';

  const again = () => VIEWS.today(el);
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
