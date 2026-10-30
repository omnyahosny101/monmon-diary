/* ============ PERSONAL LAYER (from Omnya's profile) ============
   Real budgets, three jobs and paydays, savings plan, valU payoff, net worth, Shein true cost,
   late-night and payday guards, Friday check-in, wedding plan, body log and Toto.
   Loaded after app.js, so views defined here replace the earlier ones of the same name. */

CATS.splice(CATS.findIndex(c => c.id === 'shopping'), 0,
  {id:'shein', name:'Shein + customs', e:'\u{1F6CD}\u{FE0F}'});
CATS.splice(CATS.findIndex(c => c.id === 'bills'), 0,
  {id:'valu', name:'valU installment', e:'\u{1F4B3}'}, {id:'phone', name:'Phone & internet', e:'\u{1F4F6}'}, {id:'lashes', name:'Lashes', e:'\u{1F441}\u{FE0F}'});
const PROTECTED = ['donations', 'pets', 'gifts'];
CATS.forEach(c => { if (PROTECTED.includes(c.id)) c.protected = true; });

const PROFILE_BUDGETS = {food:7850, donations:3500, valu:2367, out:2000, subs:1500, gifts:1500, pets:1170, transport:1000, phone:1000, lashes:1000};
const JOBS_DEFAULT = [
  {id:'lenme', name:'Lenme', pay:25000, day:28, e:'\u{1F4F1}'},
  {id:'bib', name:'BIB', pay:12000, day:1, e:'\u{1F6E1}\u{FE0F}'},
  {id:'isch', name:'iSchoolTech', pay:10000, day:15, e:'\u{1F4BB}'},
];
const SEED_JARS = [['Emergency fund','\u{1F6DF}',130000], ['Car down payment','\u{1F697}',350000], ['Wedding shopping','\u{1F470}',20000], ['Wedding beauty','\u{1F485}',48500]];
const BEAUTY = [
  ['hl1','Hair laser · session 1','✨',5000,''], ['hl2','Hair laser · session 2','✨',5000,''], ['hl3','Hair laser · session 3','✨',5000,''],
  ['pc1','Pico laser · session 1','\u{1F48E}',5000,''], ['pc2','Pico laser · session 2','\u{1F48E}',5000,''],
  ['sv','Spider veins','\u{1F9B5}',6000,''], ['ht','Hair treatment','\u{1F486}‍♀\u{FE0F}',7500,'5,000–10,000'], ['hd','Hair dye','\u{1F487}‍♀\u{FE0F}',10000,''],
  ['fi','Filler: lips 0.5 ml, cheeks 1 ml','\u{1F48B}','','Price per ml not known yet'], ['bo','Botox: crow’s feet, nose','\u{1F4AB}','','Price not known yet'],
];
const INBODY_SEED = [
  {date:'2022-11-09', weight:65.1, smm:23.2, pbf:34.1},
  {date:'2023-02-06', weight:63.5, smm:22.7, pbf:34.1, fat:21.6, visc:8},
  {date:'2026-06-03', weight:68.2, smm:24.3, pbf:34.6, fat:23.6, visc:9},
  {date:'2026-07-26', weight:64.4, smm:24.5, pbf:30.5, fat:19.7, visc:7},
];
const GLUTE_DAY = [['Hip thrust','4 sets'],['Romanian deadlift','4 sets'],['Back extension','4 sets'],['Hip abduction','4 sets'],['Cable kickbacks','3 sets']];
const QUAD_DAY = [['Hack squat or Smith squat','4 × 6–10'],['Leg press, feet low','3 × 8–12'],['Leg extension, leaning back','4 × 10–15'],['Sissy squat or reverse Nordic','3 × 8–12']];
const FRIDAY_STEPS = ['Log any spending I missed this week','Check my budgets in Money','Move savings to my jars','valU installment on track','Decide on my wait list'];
const SHEIN_X = 1.61;

/* ---------- migration: fills in her profile once, never overwrites her own edits ---------- */
function lifeMigrate(){
  if (S.settings.rem.gym === undefined) S.settings.rem.gym = true;
  if (!S.remV2){ Object.assign(S.settings.rem, {checkin:false, work:false, night:false, learn:true}); S.remV2 = true; }
  S.profile = Object.assign({name:'Omnya', birthday:'2002-01-07', wedding:'', wake:'09:00', workStart:'10:00', workEnd:'18:00'}, S.profile || {});
  if (!Array.isArray(S.jobs) || !S.jobs.length) S.jobs = JSON.parse(JSON.stringify(JOBS_DEFAULT));
  S.income = Array.isArray(S.income) ? S.income : [];
  if (!S.incomeMigrated){ Object.keys(S.salary || {}).forEach(k => { if (+S.salary[k] > 0) S.income.push({id:uid(), date:k + '-01', job:'other', amount:+S.salary[k]}); }); S.incomeMigrated = true; }
  S.valu = S.valu || {total:7100, monthly:2367, paid:[]};
  S.worth = S.worth || {gold:80000, thndr:10090, lent:61031, bank:1617, valuCard:5586, asOf:'2026-10-21'};
  S.wait = Array.isArray(S.wait) ? S.wait : [];
  S.savedByWaiting = +S.savedByWaiting || 0;
  S.friday = S.friday || {};
  S.wedding = S.wedding || {};
  if (!Array.isArray(S.wedding.beauty)) S.wedding.beauty = BEAUTY.map(b => ({id:b[0], name:b[1], e:b[2], price:b[3], note:b[4], planned:'', done:'', spendId:''}));
  if (!Array.isArray(S.wedding.checklist)) S.wedding.checklist = [{id:uid(), title:'Wedding shopping (20,000 budget, November)', done:false}];
  S.inbody = Array.isArray(S.inbody) ? S.inbody : INBODY_SEED.slice();
  S.runs = Array.isArray(S.runs) ? S.runs : [];
  S.workouts = Array.isArray(S.workouts) ? S.workouts : [];
  S.toto = S.toto || {weight:5.6, neutered:false, neuterPrice:'', neuterDate:''};
  const R = S.settings.rem; ['wake','work','friday','night','payday'].forEach(k => { if (R[k] == null) R[k] = true; });
  if (!S.seed4){
    const B = S.settings.budgets = S.settings.budgets || {};
    Object.keys(PROFILE_BUDGETS).forEach(k => { if (B[k] == null) B[k] = PROFILE_BUDGETS[k]; });
    const like = {'Emergency fund':/emergency/i, 'Car down payment':/\bcar\b/i, 'Wedding shopping':/^wedding shopping$/i, 'Wedding beauty':/^wedding beauty$/i};
    SEED_JARS.forEach(([n, e, t]) => { if (!S.jars.some(j => like[n].test(j.name))) S.jars.push({id:uid(), name:n, e, target:t, deposits:[]}); });
    const add = [{id:'wake', name:'Wake up on time', e:'⏰', freq:'daily', target:1, reward:''}, {id:'noshop', name:'No shopping after 11 PM', e:'\u{1F319}', freq:'daily', target:1, reward:''},
      {id:'gym', name:'Gym', e:'\u{1F3CB}\u{FE0F}', freq:'weekly', target:5, reward:''}];
    add.forEach(h => { if (!S.habits.some(x => x.id === h.id)) S.habits.push(h); });
    S.habits.forEach(h => {
      if (h.reward === 'A new lip gloss after 30 days') h.reward = 'After 30 days: an outing you love, like ice skating, a museum or a concert';
      if (h.reward === 'A new book after 14 days') h.reward = 'After 14 days: a café afternoon with your book';
    });
    S.seed4 = true;
  }
}

/* ---------- small helpers ---------- */
const isNight = () => { const h = new Date().getHours(); return h >= 23 || h < 9; };
const jobName = id => (S.jobs.find(j => j.id === id) || {name:id === 'other' ? 'Other income' : id}).name;
const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
function paydayOn(job, y, m){ const last = new Date(y, m + 1, 0).getDate(); return ymd(new Date(y, m, Math.min(job.day, last))); }
function nextPaydays(job, n){ const out = [], now = new Date(); let y = now.getFullYear(), m = now.getMonth(); while (out.length < n){ const d = paydayOn(job, y, m); if (d >= todayStr()) out.push(d); m++; if (m > 11){ m = 0; y++; } } return out; }
function paydayWindow(){
  const t = todayStr(), now = new Date();
  for (const j of S.jobs){ for (let back = 0; back < 2; back++){ const d = paydayOn(j, now.getFullYear(), now.getMonth() - back + (now.getMonth() - back < 0 ? 12 : 0)); const diff = daysBetween(d, t); if (diff >= 0 && diff <= 2) return j; } }
  const inc = S.income.find(i => { const diff = daysBetween(i.date, t); return diff >= 0 && diff <= 2; });
  return inc ? (S.jobs.find(j => j.id === inc.job) || {name:'Salary'}) : null;
}
const incomeIn = k => S.income.filter(i => inMonth(i, k));
const valuLeft = () => Math.max(0, S.valu.total - sum(S.valu.paid, p => p.amount));
const jarByName = n => S.jars.find(j => j.name.toLowerCase() === n.toLowerCase());
const jarTotal = j => sum(j.deposits, d => d.amount);
function deposit(j, a, why){
  const before = jarTotal(j); j.deposits.push({id:uid(), date:todayStr(), amount:a, why:why || ''}); save();
  const after = before + a, ms = [25, 50, 75, 100].filter(m => j.target && before / j.target * 100 < m && after / j.target * 100 >= m).pop();
  if (ms) celebrate({key:'jar-' + j.id + '-' + ms, e:ms === 100 ? '\u{1F3C6}' : j.e, title:ms === 100 ? j.name + ' is full!' : ms + '% of ' + j.name + '!', msg:ms === 100 ? money(after) + ' saved. Celebrate with an experience, not a purchase.' : money(after) + ' saved so far. Every pound is a step closer.'});
  return !!ms;
}
function weddingDays(){ if (!S.profile.wedding) return null; return daysBetween(todayStr(), S.profile.wedding); }

/* ---------- payday: pay yourself first ---------- */
function paydaySheet(amount, label, after){
  const before2027 = todayStr() < '2027-01-01';
  const def = jarByName(before2027 ? 'Wedding beauty' : 'Emergency fund') || S.jars[0];
  const pct = Math.round(amount * 0.3);
  sheet('<div style="text-align:center;font-size:46px">\u{1F4B8}</div><h2 class="plain" style="justify-content:center">Payday: pay yourself first</h2>' +
    '<p class="small muted" style="margin:0;font-weight:700;text-align:center">' + esc(label) + ' · ' + money(amount) + '. ' + (before2027 ? 'Your plan for November and December: what’s left after the budget goes to the wedding.' : 'Your plan: move 30% of every salary to savings within an hour.') + '</p>' +
    '<label class="field"><span>Move to</span><select class="in" data-pj>' + S.jars.map(j => '<option value="' + j.id + '"' + (def && j.id === def.id ? ' selected' : '') + '>' + j.e + ' ' + esc(j.name) + '</option>').join('') + '</select></label>' +
    '<label class="field"><span>Amount (30% is ' + fmt(pct) + ')</span><input class="in num" data-pa type="number" inputmode="decimal" min="0" value="' + pct + '"></label>' +
    '<button class="btn full" data-go style="background:var(--mint)">Move it now</button>',
  (sh, close) => {
    $('[data-go]', sh).onclick = () => { const a = +$('[data-pa]', sh).value, j = S.jars.find(x => x.id === $('[data-pj]', sh).value); if (!(a > 0) || !j) return toast('Enter an amount');
      close(); if (!deposit(j, a, 'payday')) celebrate({key:'payday-' + uid(), e:'\u{1F451}', title:'You paid yourself first!', msg:money(a) + ' moved to ' + j.name + ' before spending a pound. That’s how wealth is built.'}); if (after) after(); };
  });
}

/* ---------- TODAY additions ---------- */
function lifeTodayTop(){
  const t = todayStr(), out = [];
  if (S.profile.birthday && S.profile.birthday.slice(5) === t.slice(5)) out.push('<div class="card tint" style="text-align:center;align-items:center"><div style="font-size:46px">\u{1F382}</div><div class="greet">Happy birthday, Monmon!</div><span class="small muted" style="font-weight:800">' + (new Date().getFullYear() - +S.profile.birthday.slice(0, 4)) + ' looks beautiful on you. Plan something new and fun today.</span></div>');
  const pw = paydayWindow();
  if (pw) out.push('<div class="card" style="background:linear-gradient(140deg,var(--mint-soft),var(--gold-soft));border-color:transparent"><h2 class="plain">\u{1F4B8} Payday window' + (pw.name ? ': ' + esc(pw.name) : '') + '</h2><p style="margin:0;font-weight:700">Last month, 63% of your spending happened within two days of a salary. Move your savings first, then wait 48 hours before anything big.</p><button class="btn" data-go="money:salary" style="align-self:flex-start;background:var(--mint)">Log salary and save</button></div>');
  if (new Date().getDay() === 5){
    const f = S.friday[t] || {}, n = FRIDAY_STEPS.filter((_, i) => f[i]).length;
    out.push('<div class="card" style="background:linear-gradient(140deg,var(--surface) 30%,var(--mint-soft))"><div class="card-head"><h2>Friday money check-in</h2><span class="num muted">' + n + '/' + FRIDAY_STEPS.length + '</span></div><span class="small muted" style="font-weight:700">10 minutes. ' + fridayStreak() + ' Fridays done in a row.</span>' +
      '<div class="list">' + FRIDAY_STEPS.map((s, i) => '<button class="item" data-fri="' + i + '"><span class="tick' + (f[i] ? ' on' : '') + '">' + CHECK + '</span><span class="t">' + s + '</span><span></span></button>').join('') + '</div></div>');
  }
  return out.join('');
}
function fridayStreak(){ let n = 0; const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 2) % 7)); for (let i = 0; i < 52; i++){ const f = S.friday[ymd(d)]; if (f && FRIDAY_STEPS.every((_, k) => f[k])) n++; else if (i > 0 || ymd(d) !== todayStr()) break; d.setDate(d.getDate() - 7); } return n; }
function lifeTodayMid(){
  const k = ym(new Date());
  const didOne = S.exp.some(x => x.done && x.doneOn && x.doneOn.slice(0, 7) === k);
  if (didOne) return '';
  const next = S.exp.filter(x => !x.done)[0];
  return '<div class="card" style="background:linear-gradient(140deg,var(--lilac-soft),var(--surface) 70%)"><h2>One new experience this month</h2><p style="margin:0;font-weight:700">' + (next ? '✨ ' + esc(next.title) + (next.with && next.with.length ? ' with ' + esc(next.with.join(', ')) : '') + (next.date ? ' · ' + nice(next.date) : ' · pick a day') : 'Pick something new to try in ' + MONTHS_L[new Date().getMonth()] + ', inside your outings budget.') + '</p><button class="linkbtn" data-go="plans:exp" style="align-self:flex-start">' + (next ? 'Plan it' : 'Choose one') + '</button></div>';
}
function bindLifeToday(el, again){
  const t = todayStr();
  $$('[data-fri]', el).forEach(b => b.onclick = ev => { const f = S.friday[t] = S.friday[t] || {}; f[b.dataset.fri] = !f[b.dataset.fri]; save();
    if (FRIDAY_STEPS.every((_, i) => f[i])) celebrate({key:'fri-' + t, e:'\u{1F4B0}', title:'Friday check-in done!', msg:fridayStreak() + ' Fridays in a row. You’re running your money, not the other way round.'}); else if (f[b.dataset.fri]) hearts(ev.clientX, ev.clientY);
    again(); });
}

/* ---------- MONEY: overview ---------- */
VIEWS['money.overview'] = function(el){
  const k = ui.moneyMonth, list = S.spend.filter(s => inMonth(s, k));
  const spent = sum(list, s => s.amount), inc = sum(incomeIn(k), i => i.amount);
  const saved = sum(S.jars.flatMap(j => j.deposits.filter(d => inMonth(d, k))), d => d.amount) + sum((S.invest || []).filter(x => inMonth(x, k)), x => x.amount);
  const by = {}; list.forEach(s => by[s.cat] = (by[s.cat] || 0) + (+s.amount || 0));
  const B = S.settings.budgets || {}, budTotal = sum(Object.keys(B), c => B[c]);
  const budSpent = sum(Object.keys(B).filter(c => +B[c] > 0), c => by[c] || 0);
  const cats = CATS.filter(c => by[c.id] || +B[c.id]).sort((a, b) => (by[b.id] || 0) - (by[a.id] || 0));
  const inv = S.investDone[k] || {}, left = valuLeft(), paidPct = Math.min(100, (S.valu.total - left) / S.valu.total * 100);
  const pays = S.income.filter(i => inMonth(i, k)).map(i => i.date);
  const inWindow = list.filter(s => pays.some(p => { const d = daysBetween(p, s.date); return d >= 0 && d <= 2; }));
  const small = list.filter(s => +s.amount < 100).length, delivery = list.filter(s => s.cat === 'delivery' || s.cat === 'out').length;
  el.innerHTML = monthNav('moneyMonth') +
    '<div class="money3"><div class="mbox"><b>' + fmt(inc) + '</b><span>income</span></div><div class="mbox"><b>' + fmt(spent) + '</b><span>spent</span></div><div class="mbox"><b style="color:' + (inc - spent - saved < 0 ? 'var(--warn)' : 'var(--mint)') + '">' + fmt(inc - spent - saved) + '</b><span>left after saving</span></div></div>' +
    (budTotal ? '<div class="card"><div class="statrow" style="color:var(--ink)"><span>Monthly budget</span><span class="num">' + fmt(budSpent) + ' / ' + fmt(budTotal) + '</span></div><div class="bar' + (budSpent > budTotal ? ' over' : ' good') + '"><i style="width:' + Math.min(100, budSpent / budTotal * 100) + '%"></i></div></div>' : '') +
    '<div class="card tint"><h2>Money goals</h2>' +
      investHTML(k) +
      '<button class="item" data-sub2="savings"><span style="font-size:20px">\u{1FAD9}</span><span class="t">Saved into jars this month<span class="s">Emergency fund, car, wedding</span></span><span class="amt">' + fmt(saved) + '</span></button></div>' +
    '<div class="card"><div class="card-head"><h2>valU payoff</h2><span class="amt">' + (left ? money(left) + ' left' : 'Paid off \u{1F389}') + '</span></div><div class="bar good"><i style="width:' + paidPct + '%"></i></div>' +
      (left ? '<div class="row"><span class="small muted" style="font-weight:700;flex:1">' + S.valu.paid.length + ' of 3 installments paid · no new valU purchases</span><button class="btn" id="vPay">Pay ' + fmt(Math.min(left, S.valu.monthly)) + '</button></div>' : '<span class="small muted" style="font-weight:700">Debt-free. That ' + fmt(S.valu.monthly) + ' a month can go to your car fund now.</span>') + '</div>' +
    (list.length >= 5 ? '<div class="card"><h2>My patterns this month</h2><div class="list">' +
      (pays.length ? '<div class="item"><span style="font-size:20px">\u{1F4B8}</span><span class="t">Spent within 2 days of a salary<span class="s">Last month it was 63%</span></span><span class="amt">' + Math.round(sum(inWindow, s => s.amount) / spent * 100) + '%</span></div>' : '') +
      '<div class="item"><span style="font-size:20px">\u{1FA99}</span><span class="t">Small purchases under 100 EGP<span class="s">They add up quietly</span></span><span class="amt">' + small + '</span></div>' +
      '<div class="item"><span style="font-size:20px">\u{1F6F5}</span><span class="t">Delivery and eating out<span class="s">Deciding meals in the morning helps</span></span><span class="amt">' + delivery + '</span></div></div></div>' : '') +
    '<div class="card"><div class="card-head"><h2>By category</h2><button class="linkbtn" data-sub2="spend">Add</button></div>' +
      (cats.length ? cats.map(c => { const v = by[c.id] || 0, b = +B[c.id] || 0, pct = b ? Math.min(100, v / b * 100) : 0;
        return '<div class="catrow"><div class="statrow"><span>' + c.e + ' ' + c.name + (c.protected ? ' <span class="pill" title="A value, not a leak">\u{1F497} protected</span>' : '') + '</span><span class="num">' + fmt(v) + (b ? ' / ' + fmt(b) : '') + '</span></div>' + (b ? '<div class="bar' + (v > b && !c.protected ? ' over' : ' good') + '"><i style="width:' + pct + '%"></i></div>' : '') + '</div>'; }).join('') : '<div class="empty">No spending logged this month yet.</div>') +
      '<p class="small muted" style="margin:0">Sadaqa, pets and gifts are protected: they’re values, never spending to cut.</p></div>';
  const again = () => VIEWS['money.overview'](el);
  bindMonthNav(el, 'moneyMonth', again);
  bindInvest(el, again);
  $$('[data-sub2]', el).forEach(b => b.onclick = () => go('money', b.dataset.sub2));
  const vp = $('#vPay', el); if (vp) vp.onclick = () => { const a = Math.min(valuLeft(), S.valu.monthly), sid = uid();
    S.spend.push({id:sid, date:todayStr(), amount:a, cat:'valu', note:'valU installment'}); S.valu.paid.push({id:uid(), date:todayStr(), amount:a, spendId:sid}); save();
    if (!valuLeft()) celebrate({key:'valu-free', e:'\u{1F513}', title:'valU paid off!', msg:'Debt-free, Monmon. From now on that money goes to your future, starting with the car fund.'}); else toast('Installment logged ♡ ' + money(valuLeft()) + ' left');
    again(); };
};

/* ---------- MONEY: salary (three jobs) ---------- */
VIEWS['money.salary'] = function(el){
  const k = ui.moneyMonth, d = parseD(k + '-01'), inc = incomeIn(k).sort((a, b) => a.date < b.date ? 1 : -1);
  const year = String(new Date().getFullYear()), ytd = sum(S.income.filter(i => i.date.startsWith(year)), i => i.amount);
  el.innerHTML = '<div class="card tint"><span class="small muted" style="font-weight:900">INCOME IN ' + year + '</span><div class="greet num">' + money(ytd) + '</div><span class="small muted" style="font-weight:700">Regular pay: ' + money(sum(S.jobs, j => j.pay)) + ' a month across ' + S.jobs.length + ' jobs. Bonuses are tracked but never counted as regular.</span></div>' +
    monthNav('moneyMonth') +
    '<div class="card"><h2>Salaries</h2><div class="list">' + S.jobs.map(j => { const got = inc.filter(i => i.job === j.id && !i.bonus), amt = sum(got, i => i.amount);
      return '<div class="item"><span style="font-size:20px">' + j.e + '</span><span class="t">' + esc(j.name) + '<span class="s">' + (got.length ? 'Paid ' + nice(got[0].date) : 'Usually around the ' + ordinal(j.day) + ' · ' + fmt(j.pay)) + '</span></span>' +
        (got.length ? '<span class="amt" style="color:var(--mint)">✓ ' + fmt(amt) + '</span>' : '<button class="btn" data-paid="' + j.id + '" style="padding:8px 12px">Paid</button>') + '</div>'; }).join('') + '</div></div>' +
    '<div class="card"><h2>Bonus or other income</h2><div class="row"><label class="field"><span>Amount</span><input class="in num" id="oA" type="number" inputmode="decimal" min="0" placeholder="0"></label><label class="field"><span>From</span><select class="in" id="oJ">' + S.jobs.map(j => '<option value="' + j.id + '">' + esc(j.name) + '</option>').join('') + '<option value="other">Other</option></select></label></div>' +
      '<div class="row"><label class="field"><span>Date</span><input class="in" id="oD" type="date" value="' + todayStr() + '"></label><button class="btn" id="oAdd">Add bonus</button></div></div>' +
    '<div class="card"><div class="card-head"><h3>' + MONTHS_L[d.getMonth()] + ' total</h3><span class="amt">' + money(sum(inc, i => i.amount)) + '</span></div><div class="list">' + (inc.length ? inc.map(i => '<div class="item"><span style="font-size:18px">' + (i.bonus ? '\u{1F381}' : '\u{1F4B5}') + '</span><span class="t">' + esc(jobName(i.job)) + (i.bonus ? ' bonus' : '') + '<span class="s">' + nice(i.date) + '</span></span><span style="display:flex;align-items:center;gap:4px"><span class="amt">' + fmt(i.amount) + '</span>' + delBtn('data-idel', i.id) + '</span></div>').join('') : '<div class="empty">Nothing logged for ' + monthLabel(k) + ' yet.</div>') + '</div></div>';
  const again = () => VIEWS['money.salary'](el);
  bindMonthNav(el, 'moneyMonth', again);
  $$('[data-paid]', el).forEach(b => b.onclick = () => { const j = S.jobs.find(x => x.id === b.dataset.paid);
    sheet('<h2>' + j.e + ' ' + esc(j.name) + ' salary</h2><div class="row"><label class="field"><span>Amount</span><input class="in num" data-a type="number" inputmode="decimal" value="' + j.pay + '"></label><label class="field"><span>Date</span><input class="in" data-d type="date" value="' + todayStr() + '"></label></div><button class="btn full" data-ok>Log it</button>', (sh, close) => {
      $('[data-ok]', sh).onclick = () => { const a = +$('[data-a]', sh).value; if (!(a > 0)) return toast('Enter the amount'); S.income.push({id:uid(), date:$('[data-d]', sh).value || todayStr(), job:j.id, amount:a}); save(); close(); again(); paydaySheet(a, j.name + ' salary', again); };
    }); });
  $('#oAdd', el).onclick = () => { const a = +$('#oA', el).value; if (!(a > 0)) return toast('Enter the amount'); S.income.push({id:uid(), date:$('#oD', el).value || todayStr(), job:$('#oJ', el).value, amount:a, bonus:true}); save(); again(); paydaySheet(a, 'Bonus', again); };
  armDelete(el, 'data-idel', id => { S.income = S.income.filter(i => i.id !== id); save(); again(); });
};
function ordinal(n){ const s = ['th','st','nd','rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

/* ---------- MONEY: net worth ---------- */
VIEWS['money.worth'] = function(el){
  const W = S.worth, debt = valuLeft();
  const rows = [['gold','Gold','✨'], ['thndr','Thndr investments','\u{1F4C8}'], ['lent','Lent to family','\u{1F3E1}'], ['bank','Bank balance','\u{1F3E6}'], ['valuCard','valU prepaid card (borrowed)','\u{1F4B3}']];
  const assets = sum(rows, r => W[r[0]]), net = assets - debt, jars = sum(S.jars, jarTotal);
  const ef = jarByName('Emergency fund');
  el.innerHTML = '<div class="card tint" style="text-align:center;align-items:center"><span class="small muted" style="font-weight:900">MY NET WORTH</span><div class="greet num" style="font-size:30px">' + money(net) + '</div><span class="small muted" style="font-weight:700">Updated ' + nice(W.asOf) + ' · long-term goal: financial freedom in your thirties</span></div>' +
    '<div class="card"><h2>What I own and owe</h2><div class="list">' + rows.map(r => '<div class="item"><span style="font-size:20px">' + r[2] + '</span><span class="t">' + r[1] + '</span><input class="in num" data-w="' + r[0] + '" type="number" inputmode="decimal" value="' + esc(W[r[0]]) + '" style="width:120px;text-align:right" aria-label="' + r[1] + '"></div>').join('') +
      '<div class="item"><span style="font-size:20px">\u{1F4B3}</span><span class="t">valU debt<span class="s">From your valU payoff in Overview</span></span><span class="amt" style="color:var(--danger)">−' + fmt(debt) + '</span></div></div>' +
      '<p class="small muted" style="margin:0">Savings jars hold ' + money(jars) + '. They’re money you’ve set aside, so keep Bank balance for what’s left.</p></div>' +
    (ef ? '<div class="card"><div class="card-head"><h2>Emergency fund</h2><span class="num muted">' + Math.round(jarTotal(ef) / ef.target * 100) + '%</span></div><div class="bar good"><i style="width:' + Math.min(100, jarTotal(ef) / ef.target * 100) + '%"></i></div><span class="small muted" style="font-weight:700">' + money(jarTotal(ef)) + ' of ' + money(ef.target) + ', six months of expenses.</span></div>' : '');
  $$('[data-w]', el).forEach(i => i.onchange = () => { W[i.dataset.w] = +i.value || 0; W.asOf = todayStr(); save(); toast('Updated'); VIEWS['money.worth'](el); });
};

/* ---------- MONEY: Shein true cost + 48-hour wait list ---------- */
VIEWS['money.shein'] = function(el){
  const now = Date.now(), night = isNight();
  const k = ym(new Date()), sheinMonth = sum(S.spend.filter(s => s.cat === 'shein' && inMonth(s, k)), s => s.amount);
  const open = S.wait.filter(w => !w.decided).sort((a, b) => a.added - b.added), past = S.wait.filter(w => w.decided).slice(-8).reverse();
  el.innerHTML = (night ? '<div class="card night"><h2 class="plain">\u{1F319} It’s after 11 PM</h2><p style="margin:0;font-weight:700">Add things to the wait list now; buying opens at 9 AM.</p></div>' : '') +
    '<div class="card tint"><h2>True-cost calculator</h2><p class="small muted" style="margin:0;font-weight:700">Shein customs and VAT add about 61%, paid days later on delivery.</p>' +
      '<div class="row"><label class="field"><span>Cart total (EGP)</span><input class="in num" id="shC" type="number" inputmode="decimal" min="0" placeholder="0"></label><label class="field"><span>What is it</span><input class="in" id="shN" placeholder="Dress, bag…"></label></div>' +
      '<button class="toggle" id="shS"><span class="sw" role="switch" aria-checked="true"></span><span>Shein order (adds 61%)</span></button>' +
      '<div class="money3"><div class="mbox"><b id="shCart">0</b><span>cart</span></div><div class="mbox"><b id="shCus" style="color:var(--warn)">0</b><span>customs later</span></div><div class="mbox"><b id="shTot">0</b><span>true cost</span></div></div>' +
      '<button class="btn full" id="shWait">Add to my 48-hour wait list</button></div>' +
    '<div class="money3"><div class="mbox"><b>' + fmt(S.savedByWaiting) + '</b><span>saved by waiting</span></div><div class="mbox"><b>' + open.length + '</b><span>waiting</span></div><div class="mbox"><b>' + fmt(sheinMonth) + '</b><span>Shein this month</span></div></div>' +
    '<div class="card"><h2>Wait list</h2><div class="list">' + (open.length ? open.map(w => { const hrs = Math.max(0, 48 - (now - w.added) / 36e5), ready = hrs <= 0;
      return '<div class="item"><span style="font-size:20px">' + (ready ? '\u{1F514}' : '⏳') + '</span><span class="t">' + esc(w.name || 'Something') + '<span class="s">' + money(w.total) + (w.shein ? ' with customs' : '') + ' · ' + (ready ? 'Ready to decide' : Math.ceil(hrs) + ' hours to go') + '</span>' +
        (ready ? '<span style="display:flex;gap:6px;margin-top:6px"><button class="linkbtn" data-buy="' + w.id + '"' + (night ? ' disabled style="opacity:.45"' : '') + '>Still want it</button><button class="linkbtn" data-let="' + w.id + '" style="background:var(--mint-soft);color:var(--mint)">Let it go</button></span>' : '') + '</span>' + delBtn('data-wdel', w.id) + '</div>'; }).join('') : '<div class="empty">Nothing waiting. Add something above before you buy it.</div>') + '</div>' +
      (past.length ? '<h3 style="margin-top:6px">Decided</h3><div class="list">' + past.map(w => '<div class="item"><span>' + (w.decided === 'let' ? '\u{1F49A}' : '\u{1F6CD}\u{FE0F}') + '</span><span class="t">' + esc(w.name || 'Something') + '<span class="s">' + (w.decided === 'let' ? 'Let go · saved ' : 'Bought · ') + money(w.total) + '</span></span><span></span></div>').join('') + '</div>' : '') + '</div>';
  const again = () => VIEWS['money.shein'](el);
  let shein = true;
  const calc = () => { const c = +$('#shC', el).value || 0, tot = shein ? Math.round(c * SHEIN_X) : c; $('#shCart', el).textContent = fmt(c); $('#shCus', el).textContent = fmt(tot - c); $('#shTot', el).textContent = fmt(tot); return {c, tot}; };
  $('#shC', el).oninput = calc;
  $('#shS', el).onclick = () => { shein = !shein; $('#shS .sw', el).setAttribute('aria-checked', shein); calc(); };
  $('#shWait', el).onclick = () => { const r = calc(); if (!(r.c > 0)) return toast('Enter the cart total'); S.wait.push({id:uid(), name:$('#shN', el).value.trim(), cart:r.c, total:r.tot, shein, added:Date.now(), decided:''}); save(); toast('On the wait list. Decide in 48 hours ♡'); again(); };
  $$('[data-buy]', el).forEach(b => b.onclick = () => { if (isNight()) return toast('Buying opens at 9 AM'); const w = S.wait.find(x => x.id === b.dataset.buy); w.decided = 'buy';
    S.spend.push({id:uid(), date:todayStr(), amount:w.total, cat:w.shein ? 'shein' : 'shopping', note:(w.name || 'Order') + (w.shein ? ' (incl. customs)' : '')}); save(); toast('Logged at its true cost'); again(); });
  $$('[data-let]', el).forEach(b => b.onclick = () => { const w = S.wait.find(x => x.id === b.dataset.let); w.decided = 'let'; S.savedByWaiting += w.total; save();
    celebrate({key:'let-' + w.id, e:'\u{1F49A}', title:'You let it go!', msg:money(w.total) + ' stayed with you. ' + money(S.savedByWaiting) + ' saved by waiting so far. Move it to a jar?'}); again(); });
  armDelete(el, 'data-wdel', id => { S.wait = S.wait.filter(w => w.id !== id); save(); again(); });
};

/* ---------- MONEY: pets with Toto ---------- */
VIEWS['money.pets'] = function(el){
  const k = ui.moneyMonth, list = S.spend.filter(s => inMonth(s, k) && s.cat === 'pets').sort((a, b) => a.date < b.date ? 1 : -1), T = S.toto;
  el.innerHTML = '<div class="card tint"><div class="card-head"><div class="greet">Toto \u{1F431}</div><span class="num muted">' + T.weight + ' kg</span></div><span class="small muted" style="font-weight:700">Male baladi cat, about 1.5 years old, white with orange tabby patches.</span>' +
      '<div class="list"><div class="item"><span>\u{1F37D}\u{FE0F}</span><span class="t">Daily<span class="s">1 Friskies pouch, ¼ chicken breast, 1–2 spoons of dry food, 1 spoon of Greek yogurt</span></span><span></span></div>' +
      '<div class="item"><span>\u{1F4C5}</span><span class="t">Only 2–3 times a week<span class="s">Liver, hearts and tuna. Liver is very high in vitamin A</span></span><span></span></div></div>' +
      '<div class="row"><label class="field"><span>Weight (kg)</span><input class="in num" id="tW" type="number" step="0.1" inputmode="decimal" value="' + T.weight + '"></label></div></div>' +
    '<div class="card"><div class="card-head"><h2>Neutering</h2><span class="pill' + (T.neutered ? '' : ' high') + '">' + (T.neutered ? 'Done ✓' : 'Planned') + '</span></div><p class="small muted" style="margin:0;font-weight:700">Neutering usually reduces roaming and fights with other male cats.</p>' +
      '<div class="row"><label class="field"><span>Price (EGP)</span><input class="in num" id="tP" type="number" inputmode="decimal" value="' + esc(T.neuterPrice) + '" placeholder="Ask the vet"></label><label class="field"><span>Date</span><input class="in" id="tD" type="date" value="' + esc(T.neuterDate) + '"></label></div>' +
      (T.neutered ? '' : '<button class="btn soft full" id="tDone">Mark as done</button>') + '</div>' +
    spendForm({title:'Add a pet expense', cats:[catOf('pets')], notePh:'Cat food for Toto, dry food for street cats…'}) + monthNav('moneyMonth') +
    '<div class="card"><div class="card-head"><h3>Total · budget ' + fmt(S.settings.budgets.pets || 0) + '</h3><span class="amt">' + money(sum(list, s => s.amount)) + '</span></div><div class="list">' + (list.length ? list.map(spendRow).join('') : '<div class="empty">No pet expenses in ' + monthLabel(k) + '.</div>') + '</div></div>';
  const again = () => VIEWS['money.pets'](el);
  $('#tW', el).onchange = e => { T.weight = +e.target.value || T.weight; save(); toast('Toto’s weight saved'); };
  $('#tP', el).onchange = e => { T.neuterPrice = +e.target.value || ''; save(); };
  $('#tD', el).onchange = e => { T.neuterDate = e.target.value; save(); };
  const dn = $('#tDone', el); if (dn) dn.onclick = () => { T.neutered = true; T.neuterDate = T.neuterDate || todayStr(); if (+T.neuterPrice > 0) S.spend.push({id:uid(), date:T.neuterDate, amount:+T.neuterPrice, cat:'pets', note:'Toto neutering'}); save(); toast('Get well soon, Toto ♡'); again(); };
  bindSpendForm(el, {cat:'pets'}, again); bindMonthNav(el, 'moneyMonth', again); bindSpendDeletes(el, again);
};

/* ---------- PLANS: tasks with jobs and work hours ---------- */
VIEWS['plans.tasks'] = function(el){
  const t = todayStr(), order = {urgent:0, high:1, normal:2}, P = S.profile;
  const block = (kind, title, ph) => {
    const items = S.tasks.filter(x => x.kind === kind).sort((a, b) => (a.done - b.done) || (order[a.prio || 'normal'] - order[b.prio || 'normal']) || ((a.due || '9') < (b.due || '9') ? -1 : 1));
    return '<div class="card"><h2>' + title + '</h2><label class="field"><input class="in" data-tin="' + kind + '" placeholder="' + ph + '" aria-label="New task"></label>' +
      '<div class="row">' + (kind === 'work' ? '<label class="field"><span>For</span><select class="in" data-tjob>' + S.jobs.map(j => '<option value="' + j.id + '">' + esc(j.name) + '</option>').join('') + '</select></label>' : '') +
      '<label class="field"><span>Priority</span><select class="in" data-tprio="' + kind + '"><option value="normal">Normal</option><option value="high">⚠\u{FE0F} Important</option><option value="urgent">\u{1F6A8} Urgent</option></select></label></div>' +
      '<div class="row"><label class="field"><span>Due</span><input class="in" type="date" data-tdue="' + kind + '"></label><label class="field" style="flex:1 1 90px"><span>By</span><input class="in" type="time" data-ttime="' + kind + '"></label></div>' +
      '<button class="btn full" data-tadd="' + kind + '">Add task</button>' +
      '<div class="list">' + (items.length ? items.map(x => '<div class="item' + (x.done ? ' done' : '') + '"><button class="tick' + (x.done ? ' on' : '') + '" data-tdone="' + x.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + (x.job ? '<span class="pill">' + esc(jobName(x.job)) + '</span>' : '') + (x.prio && x.prio !== 'normal' && !x.done ? '<span class="pill ' + PRIO[x.prio].c + '">' + PRIO[x.prio].l + '</span>' : '') + esc(x.title) + (x.due ? '<span class="s" style="' + (!x.done && x.due < t ? 'color:var(--danger);font-weight:900' : '') + '">' + (!x.done && x.due < t ? 'Overdue · ' : 'Due ') + nice(x.due) + (x.time ? ' · by ' + x.time : '') + '</span>' : '') + '</span><span style="display:flex;gap:4px;align-items:center">' + (x.done ? '' : flagBtn('t:' + x.id, x.prio === 'urgent')) + delBtn('data-tdel', x.id) + '</span></div>').join('') : '<div class="empty">Nothing here yet.</div>') + '</div></div>';
  };
  el.innerHTML = '<div class="card tint"><div class="card-head"><h2>Work hours</h2><span class="num" style="font-weight:600">' + esc(P.workStart) + '–' + esc(P.workEnd) + '</span></div><span class="small muted" style="font-weight:700">Clear edges help you focus: a start reminder with your top task, and a log-off reminder. Sunday to Thursday. Change them in Me › Settings.</span></div>' +
    block('work', 'Work tasks \u{1F4BC}', 'Lenme launch post, BIB lead form…') + block('personal', 'My to-dos ✅', 'Call the clinic, pay a bill…') +
    '<p class="note">\u{1F6A8} Tap the siren on any task to make it an emergency. Emergencies sit at the top of Today and remind you the evening before, at 9:00 on the day and 1 hour before the deadline.</p>' +
    (S.tasks.some(x => x.done) ? '<button class="btn soft full" id="tClear">Clear finished tasks</button>' : '');
  const again = () => VIEWS['plans.tasks'](el); bindFlags(el, again);
  $$('[data-tadd]', el).forEach(b => b.onclick = () => { const k = b.dataset.tadd, v = $('[data-tin="' + k + '"]', el).value.trim(); if (!v) return toast('Write the task');
    S.tasks.push({id:uid(), title:v, kind:k, job:k === 'work' ? $('[data-tjob]', el).value : '', prio:$('[data-tprio="' + k + '"]', el).value, due:$('[data-tdue="' + k + '"]', el).value, time:$('[data-ttime="' + k + '"]', el).value, done:false}); save(); again(); });
  $$('[data-tin]', el).forEach(i => i.onkeydown = e => { if (e.key === 'Enter') $('[data-tadd="' + i.dataset.tin + '"]', el).click(); });
  $$('[data-tdone]', el).forEach(b => b.onclick = ev => { const x = S.tasks.find(y => y.id === b.dataset.tdone); x.done = !x.done; x.doneOn = x.done ? t : ''; if (x.done){ hearts(ev.clientX, ev.clientY); if (x.prio === 'urgent') toast('Urgent task done! Breathe out ♡'); } save(); again(); });
  armDelete(el, 'data-tdel', id => { S.tasks = S.tasks.filter(x => x.id !== id); save(); again(); });
  const c = $('#tClear', el); if (c) c.onclick = () => { S.tasks = S.tasks.filter(x => !x.done); save(); again(); };
};

/* ---------- PLANS: wedding ---------- */
function autoPlanBeauty(){
  const W = S.profile.wedding; if (!W) return 0;
  const t = todayStr(), cap = (d, max) => (d > max ? max : d), before = n => addDays(W, -n);
  const plan = {hl1:addDays(t, 3), hl2:addDays(t, 31), hl3:addDays(t, 59), pc1:addDays(t, 5), pc2:addDays(t, 33), sv:addDays(t, 10), sb:before(21), fi:before(25), bo:before(25), ht:before(14), hd:before(5)};
  const max = {hl1:before(10), hl2:before(10), hl3:before(10), pc1:before(14), pc2:before(14), sv:before(21)};
  let n = 0;
  S.wedding.beauty.forEach(b => { if (!b.planned && !b.done && plan[b.id]){ let d = plan[b.id]; if (max[b.id]) d = cap(d, max[b.id]); if (d < t) d = t; b.planned = d; n++; } });
  return n;
}
VIEWS['plans.wedding'] = function(el){
  const W = S.profile.wedding, wd = weddingDays(), B = S.wedding.beauty, t = todayStr();
  const known = sum(B, b => b.price), done = sum(B.filter(b => b.done), b => b.price), nDone = B.filter(b => b.done).length;
  const wj = jarByName('Wedding beauty'), sj = jarByName('Wedding shopping');
  const allPrep = prepItems(), prepDone = allPrep.filter(x => x.done).length, tagged = allPrep.filter(x => x.key[0] === 'm' || x.key[0] === 's');
  el.innerHTML = '<div class="card wed" style="cursor:default">' + (W ? '<span class="wn num">' + Math.max(0, wd) + '</span><span style="min-width:0;text-align:start"><b style="display:block;font-size:17px">days to your wedding \u{1F48D}</b><span class="small" style="font-weight:700">' + nice(W) + '</span></span>' : '<span style="font-size:40px">\u{1F48D}</span><span style="min-width:0;text-align:start"><b style="display:block">Set your wedding date</b><span class="small" style="font-weight:700">It starts the countdown and plans your beauty sessions around it.</span></span>') + '</div>' +
    '<div class="card"><label class="field"><span>Wedding date</span><input class="in" id="wDate" type="date" value="' + esc(W) + '"></label><div class="statrow" style="color:var(--ink)"><span>All preparations</span><span class="num">' + prepDone + ' / ' + allPrep.length + '</span></div><div class="bar good"><i style="width:' + (allPrep.length ? prepDone / allPrep.length * 100 : 0) + '%"></i></div></div>' +
    '<div class="money3"><div class="mbox"><b>' + nDone + '/' + B.length + '</b><span>sessions done</span></div><div class="mbox"><b>' + fmt(known) + '</b><span>known prices</span></div><div class="mbox"><b>' + fmt(wj ? jarTotal(wj) : 0) + '</b><span>in beauty jar</span></div></div>' +
    '<div class="card"><div class="card-head"><h2>Beauty plan</h2>' + (W ? '<button class="linkbtn" id="wAuto">Suggest dates</button>' : '') + '</div>' +
      '<p class="small muted" style="margin:0;font-weight:700">Multi-session lasers first, about 4 weeks apart. Filler and Botox 3–4 weeks before the wedding. Confirm spacing with your clinic.</p>' +
      '<div class="list">' + B.map(b => '<div class="sc' + (b.done ? ' done' : '') + '"><span class="em">' + b.e + '</span><div style="min-width:0"><div class="nm">' + esc(b.name) + '</div>' + (b.note ? '<span class="small muted" style="font-weight:700">' + esc(b.note) + '</span>' : '') +
        '<div class="fields"><label class="field"><span>Price</span><input class="in num" type="number" inputmode="decimal" min="0" data-wf="price" data-id="' + b.id + '" value="' + esc(b.price) + '" placeholder="EGP"></label>' +
        '<label class="field"><span>Planned</span><input class="in" type="date" data-wf="planned" data-id="' + b.id + '" value="' + esc(b.planned) + '"></label>' +
        '<label class="field"><span>Done on</span><input class="in" type="date" data-wf="done" data-id="' + b.id + '" value="' + esc(b.done) + '"></label></div></div>' + delBtn('data-wbdel', b.id) + '</div>').join('') + '</div>' +
      '<p class="small muted" style="margin:0">\u{1F514} Reminder the evening before each planned session. Lashes stay monthly in Self-care. ' + money(done) + ' spent so far.</p></div>' +
    '<div class="card"><h2>Wedding preparations</h2><div class="row"><label class="field" style="flex:0 0 60px"><input class="in" id="wcE" value="\u{1F48D}" maxlength="4" style="text-align:center" aria-label="Emoji"></label><label class="field"><input class="in" id="wcIn" placeholder="Invitations, photographer, dress fitting…" aria-label="New item"></label><button class="btn" id="wcAdd">Add</button></div>' +
      '<div class="list">' + S.wedding.checklist.map(x => '<div class="item' + (x.done ? ' done' : '') + '"><button class="tick' + (x.done ? ' on' : '') + '" data-wcd="' + x.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + (x.e || '\u{1F48D}') + ' ' + esc(x.title) + '</span>' + delBtn('data-wcdel', x.id) + '</div>').join('') + '</div>' +
      (sj ? '<p class="small muted" style="margin:0">Wedding shopping jar: ' + money(jarTotal(sj)) + ' of ' + money(sj.target) + '.</p>' : '') + '</div>' +
    (tagged.length ? '<div class="card"><div class="card-head"><h2>Tagged \u{1F48D}</h2><span class="small muted">from mashawer and self-care</span></div><div class="list">' + tagged.map(x => '<button class="item' + (x.done ? ' done' : '') + '" data-wtag="' + x.key + '"><span class="tick' + (x.done ? ' on' : '') + '">' + CHECK + '</span><span class="t">' + x.e + ' ' + esc(x.title) + '<span class="s">' + x.kind + (x.date ? ' · ' + nice(x.date) : '') + '</span></span><span></span></button>').join('') + '</div></div>'
      : '<p class="note">Tap \u{1F48D} on a meshwar or a self-care session (laser, pampering) and it shows up here too.</p>');
  const again = () => VIEWS['plans.wedding'](el);
  $('#wDate', el).onchange = e => { S.profile.wedding = e.target.value; save(); toast(e.target.value ? 'Countdown started \u{1F48D}' : 'Date cleared'); again(); };
  const au = $('#wAuto', el); if (au) au.onclick = () => { const n = autoPlanBeauty(); save(); toast(n ? n + ' sessions planned. Adjust any date.' : 'All sessions already have dates'); again(); };
  $$('[data-wf]', el).forEach(i => i.onchange = () => {
    const b = B.find(x => x.id === i.dataset.id), f = i.dataset.wf, was = !!b.done; b[f] = f === 'price' ? (+i.value || '') : i.value;
    S.spend = S.spend.filter(x => x.id !== b.spendId); b.spendId = '';
    if (b.done && +b.price > 0){ b.spendId = uid(); S.spend.push({id:b.spendId, date:b.done, amount:+b.price, cat:'wedding', note:b.e + ' ' + b.name}); }
    save();
    if (f === 'done' && b.done && !was){ if (B.every(x => x.done)) celebrate({key:'wb-all', e:'\u{1F470}', title:'Beauty plan complete!', msg:'Every session done. You’re ready to glow on your day.'}); else toast(b.e + ' Done. Glowing! ♡'); }
    again(); });
  armDelete(el, 'data-wbdel', id => { const b = B.find(x => x.id === id); if (b && b.spendId) S.spend = S.spend.filter(x => x.id !== b.spendId); S.wedding.beauty = B.filter(x => x.id !== id); save(); again(); });
  const addC = () => { const v = $('#wcIn', el).value.trim(); if (!v) return; S.wedding.checklist.push({id:uid(), e:$('#wcE', el).value.trim() || '\u{1F48D}', title:v, done:false}); save(); again(); };
  $('#wcAdd', el).onclick = addC; $('#wcIn', el).onkeydown = e => { if (e.key === 'Enter') addC(); };
  $$('[data-wcd]', el).forEach(b => b.onclick = ev => { const x = S.wedding.checklist.find(y => y.id === b.dataset.wcd); x.done = !x.done; if (x.done) hearts(ev.clientX, ev.clientY); save(); again(); });
  $$('[data-wtag]', el).forEach(b => b.onclick = ev => { togglePrep(b.dataset.wtag); hearts(ev.clientX, ev.clientY); again(); });
  armDelete(el, 'data-wcdel', id => { S.wedding.checklist = S.wedding.checklist.filter(x => x.id !== id); save(); again(); });
};

/* ---------- ME: body (InBody, gym days) ---------- */
VIEWS['me.body'] = function(el){
  const scans = S.inbody.slice().sort((a, b) => a.date < b.date ? 1 : -1), last = scans[0], prev = scans[1];
  const d = (k, better) => { if (!prev || last[k] == null || prev[k] == null) return ''; const v = +(last[k] - prev[k]).toFixed(1); if (!v) return ''; const good = better === 'up' ? v > 0 : v < 0; return ' <span class="delta ' + (good ? 'up' : 'down') + '">' + (v > 0 ? '+' : '') + v + '</span>'; };
  const ws = weekStart(new Date()), thisWeek = S.workouts.filter(w => parseD(w.date) >= ws).length, runsWeek = S.runs.filter(r => parseD(r.date) >= ws).length;
  const runs = S.runs.slice().sort((a, b) => a.date < b.date ? 1 : -1), bestMin = Math.max(5, ...S.runs.map(r => +r.min || 0)), bestSp = Math.max(6.2, ...S.runs.map(r => +r.speed || 0));
  const lastRun = runs[0];
  const day = (title, list, type) => '<div class="card"><div class="card-head"><h2>' + title + '</h2><button class="btn" data-wkt="' + type + '" style="padding:8px 12px">Add to log</button></div><div class="list">' + list.map(x => '<div class="item"><span>\u{1F4AA}</span><span class="t">' + x[0] + '</span><span class="amt muted" style="font-size:12.5px">' + x[1] + '</span></div>').join('') + '</div></div>';
  el.innerHTML = workoutHTML() + '<div class="money3"><div class="mbox"><b>' + last.weight + '</b><span>kg on ' + niceDM(last.date) + d('weight', 'down') + '</span></div><div class="mbox"><b>' + last.smm + '</b><span>kg muscle' + d('smm', 'up') + '</span></div><div class="mbox"><b>' + last.pbf + '%</b><span>body fat' + d('pbf', 'down') + '</span></div></div>' +
    '<div class="card tint"><h2>Where you are</h2><p style="margin:0;font-weight:700">' + (last.fat != null ? 'Fat mass ' + last.fat + ' kg; the healthy range on your scan is 11.1–17.8 kg. ' : '') + (last.visc != null ? 'Visceral fat ' + last.visc + ' (healthy is 1–9). ' : '') + 'Your best result yet: fat down, muscle up. Keep training 5 days a week to protect it.</p></div>' +
    '<div class="card"><h2>InBody history</h2><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Date</th><th class="r">Weight</th><th class="r">Muscle</th><th class="r">Fat %</th><th class="r">Visceral</th></tr></thead><tbody>' +
      scans.map(s => '<tr><td>' + niceDM(s.date) + ' ' + s.date.slice(2, 4) + '</td><td class="r num">' + s.weight + '</td><td class="r num">' + s.smm + '</td><td class="r num">' + s.pbf + '</td><td class="r num">' + (s.visc != null ? s.visc : '–') + '</td></tr>').join('') + '</tbody></table></div>' +
      '<h3 style="margin-top:4px">Add a scan</h3><div class="row"><label class="field"><span>Date</span><input class="in" id="ibD" type="date" value="' + todayStr() + '"></label><label class="field"><span>Weight</span><input class="in num" id="ibW" type="number" step="0.1" inputmode="decimal"></label></div>' +
      '<div class="row"><label class="field"><span>Muscle (SMM)</span><input class="in num" id="ibM" type="number" step="0.1" inputmode="decimal"></label><label class="field"><span>Body fat %</span><input class="in num" id="ibP" type="number" step="0.1" inputmode="decimal"></label></div>' +
      '<div class="row"><label class="field"><span>Fat mass kg</span><input class="in num" id="ibF" type="number" step="0.1" inputmode="decimal"></label><label class="field"><span>Visceral</span><input class="in num" id="ibV" type="number" inputmode="numeric"></label><button class="btn" id="ibAdd">Save</button></div></div>' +
    '<p class="note">Gym this week: ' + weekCount('gym', todayStr()) + ' of 5 sessions. Add a whole template to your log with the buttons below.</p>' +
    day('Glute day', GLUTE_DAY, 'glute') + day('Quad day', QUAD_DAY, 'quad');
  const again = () => VIEWS['me.body'](el);
  $('#ibAdd', el).onclick = () => { const w = +$('#ibW', el).value, m = +$('#ibM', el).value, p = +$('#ibP', el).value; if (!(w > 0 && m > 0 && p > 0)) return toast('Add weight, muscle and body fat %');
    const s = {date:$('#ibD', el).value || todayStr(), weight:w, smm:m, pbf:p}; if (+$('#ibF', el).value) s.fat = +$('#ibF', el).value; if ($('#ibV', el).value) s.visc = +$('#ibV', el).value;
    const prevS = S.inbody.slice().sort((a, b) => a.date < b.date ? 1 : -1)[0]; S.inbody.push(s); save();
    if (prevS && (p < prevS.pbf || m > prevS.smm)) celebrate({key:'ib-' + s.date, e:'\u{1F4AA}', title:'Your body is changing!', msg:(p < prevS.pbf ? 'Body fat down ' + (prevS.pbf - p).toFixed(1) + ' points. ' : '') + (m > prevS.smm ? 'Muscle up ' + (m - prevS.smm).toFixed(1) + ' kg.' : '')}); else toast('Scan saved');
    again(); };
  bindWorkout(el, again);
};

/* ---------- ME: settings ---------- */
VIEWS['me.settings'] = function(el){
  const R = S.settings.rem, B = S.settings.budgets || {}, P = S.profile;
  const sw = (k, label, sub, obj) => '<button class="toggle" data-sw="' + k + '" data-obj="' + (obj || 'rem') + '" style="justify-content:space-between;width:100%"><span>' + label + '<span class="small muted" style="display:block;font-weight:600">' + sub + '</span></span><span class="sw" role="switch" aria-checked="' + !!(obj === 'settings' ? S.settings[k] !== false : R[k]) + '"></span></button>';
  el.innerHTML = '<div class="card"><h2>About me</h2>' +
      '<div class="row"><label class="field"><span>Wedding date</span><input class="in" data-p="wedding" type="date" value="' + esc(P.wedding) + '"></label><label class="field"><span>Wake-up time</span><input class="in" data-p="wake" type="time" value="' + esc(P.wake) + '"></label></div>' +
      '<div class="row"><label class="field"><span>Work starts</span><input class="in" data-p="workStart" type="time" value="' + esc(P.workStart) + '"></label><label class="field"><span>Work ends</span><input class="in" data-p="workEnd" type="time" value="' + esc(P.workEnd) + '"></label></div>' +
      sw('celebrate', 'Celebrations', 'Confetti and messages for streaks, savings and wins', 'settings') + '</div>' +
    '<div class="card"><h2>My jobs</h2>' + S.jobs.map(j => '<div class="row"><label class="field" style="flex:2 1 120px"><span>' + j.e + ' ' + esc(j.name) + '</span><input class="in num" data-jp="' + j.id + '" type="number" inputmode="decimal" value="' + j.pay + '" aria-label="' + esc(j.name) + ' pay"></label><label class="field" style="flex:1 1 80px"><span>Payday</span><input class="in num" data-jd="' + j.id + '" type="number" min="1" max="31" value="' + j.day + '" aria-label="' + esc(j.name) + ' payday"></label></div>').join('') + '</div>' +
    '<div class="card"><h2>Meal plan</h2><label class="field"><span>Plan start date (Day 1)</span><input class="in" id="stStart" type="date" value="' + esc(S.start) + '"></label></div>' +
    '<div class="card"><h2>Money</h2><label class="field"><span>Monthly investment amount (EGP)</span><input class="in num" id="stInv" type="number" inputmode="decimal" min="0" value="' + esc(S.settings.invest || '') + '" placeholder="0"></label>' +
      '<h3 style="margin-top:4px">Monthly budgets · total ' + fmt(sum(Object.keys(B), k => B[k])) + '</h3>' + CATS.map(c => '<div class="item"><span style="font-size:18px">' + c.e + '</span><span class="t">' + c.name + (c.protected ? '<span class="s">\u{1F497} protected</span>' : '') + '</span><input class="in num" data-bud="' + c.id + '" type="number" inputmode="decimal" min="0" placeholder="No limit" value="' + (+B[c.id] ? B[c.id] : '') + '" style="width:110px;text-align:right" aria-label="Budget for ' + c.name + '"></div>').join('') +
      '<p class="small muted" style="margin:0">Still to decide: gym subscription and a clothes budget.</p></div>' +
    '<div class="card"><h2>Reminders</h2>' + (native() ? '' : '<p class="small" style="margin:0;font-weight:800;color:var(--berry)">Reminders work in the iPhone app. In the browser these switches are saved for when you use the app.</p>') +
      sw('wake', L2('الصحيان', 'Wake-up'), L2('الساعة ', 'At ') + esc(P.wake)) + sw('work', 'Work hours', 'Start and log-off, Sunday to Thursday') +
      sw('payday', 'Paydays', 'Pay yourself first on each salary day') + sw('friday', 'Friday money check-in', 'Fridays at 12:00') + sw('night', 'Shop-free hours', '11 PM: no shopping until 9 AM') +
      sw('meals', 'Meals', '9:00, 14:00, 17:30, 20:30 with that day’s meal') + sw('water', 'Water', '11:00, 13:00, 16:00, 19:00') + sw('gym', L2('الجيم \u{1F351}', 'Gym \u{1F351}'), L2('6:15 و7:45 و9:15 بالليل (آخر فرصة قبل ما يقفل 11) · بتسكت لو سجلتي تمرينة النهارده', '18:15, 19:45, 21:15 (last call before 11 pm) · quiet once you log a workout')) + sw('diary', 'Diary', L2('12 بالليل', '12:00 am')) + sw('learn', L2('دروس ومعلومات \u{1F4A1}', 'Lessons and facts \u{1F4A1}'), L2('حكمة 9:30 الصبح، درس النهارده 12 الضهر، و6 معلومات على مدار اليوم', 'A quote at 9:30, today’s lesson at 12:00 and 6 facts through the day')) + sw('checkin', 'Evening check-in', '10:00 pm: habits, spending, day log') +
      sw('money', 'Start of the month', 'Invest, buy gold, plan self-care') + sw('plans', 'Tasks and plans', 'Urgent tasks, mashawer, beauty and self-care sessions') + '</div>' +
    '<div class="card"><h2>Backup</h2><p class="small muted" style="margin:0;font-weight:600">Everything is saved on this phone. Copy a backup now and then and keep it in Notes.</p>' +
      '<div class="row"><button class="btn soft" id="bkCopy">Copy backup</button><button class="btn soft" id="bkShow">Restore from backup</button></div>' +
      '<div id="bkBox" hidden><textarea class="in" id="bkText" placeholder="Paste your backup here"></textarea><button class="btn full" id="bkRestore" style="margin-top:8px">Restore</button></div></div>' +
    '<p class="note">Monmon’s Life · made for Omnya ♡</p>';
  $$('[data-p]', el).forEach(i => i.onchange = () => { P[i.dataset.p] = i.value; save(); toast('Saved'); });
  $$('[data-jp]', el).forEach(i => i.onchange = () => { S.jobs.find(j => j.id === i.dataset.jp).pay = +i.value || 0; save(); toast('Saved'); });
  $$('[data-jd]', el).forEach(i => i.onchange = () => { S.jobs.find(j => j.id === i.dataset.jd).day = Math.min(31, Math.max(1, +i.value || 1)); save(); toast('Saved'); });
  $('#stStart', el).onchange = e => { if (e.target.value){ S.start = e.target.value; ui.foodDay = null; save(); toast('Start date saved'); } };
  $('#stInv', el).onchange = e => { S.settings.invest = +e.target.value || 0; save(); toast('Saved'); };
  $$('[data-bud]', el).forEach(i => i.onchange = () => { S.settings.budgets[i.dataset.bud] = +i.value > 0 ? +i.value : 0; save(); toast('Budget saved'); });
  $$('[data-sw]', el).forEach(b => b.onclick = () => { const k = b.dataset.sw; let on;
    if (b.dataset.obj === 'settings'){ S.settings[k] = S.settings[k] === false; on = S.settings[k]; } else { R[k] = !R[k]; on = R[k]; }
    $('.sw', b).setAttribute('aria-checked', on); save(); });
  $('#bkCopy', el).onclick = async () => { const txt = JSON.stringify(S); try { await navigator.clipboard.writeText(txt); toast('Backup copied. Paste it in Notes.'); } catch(e){ $('#bkBox', el).hidden = false; $('#bkText', el).value = txt; $('#bkText', el).select(); toast('Select all and copy'); } };
  $('#bkShow', el).onclick = () => { $('#bkBox', el).hidden = false; $('#bkText', el).value = ''; };
  $('#bkRestore', el).onclick = () => { try { const d = JSON.parse($('#bkText', el).value); if (!d || typeof d !== 'object') throw 0; S = merge(DEF(), d); lifeMigrate(); save(); toast('Restored ♡'); render(); } catch(e){ toast('That backup text isn’t valid'); } };
};

/* ---------- reminders added to the iPhone schedule ---------- */
function lifeReminders(R, repeat, push, at){
  myReminders(repeat, push, at);
  cycleReminders(push, at);
  frReminders(repeat);
  if (R.learn !== false) learnReminders(push, at);
  if (R.gym !== false) gymReminders(push, at);
  if (typeof readReminders === 'function') readReminders(repeat);
  if (R.plans !== false) emergencyReminders(push, at);
  const P = S.profile, hm = s => s.split(':').map(Number);
  if (R.wake !== false && P.wake){ const [h, m] = hm(P.wake); repeat.push({id:'wake', title:'Good morning, Monmon ☀\u{FE0F}', body:'Same time every day. Curtains open, a glass of water, then your day.', hour:h, minute:m}); }
  if (R.work !== false && P.workStart && P.workEnd){
    const top = S.tasks.filter(x => !x.done && x.kind === 'work').sort((a, b) => ({urgent:0, high:1}[a.prio] ?? 2) - ({urgent:0, high:1}[b.prio] ?? 2))[0];
    const [sh, sm] = hm(P.workStart), [eh, em] = hm(P.workEnd);
    for (let wd = 1; wd <= 5; wd++){
      repeat.push({id:'work-s-' + wd, title:'Work time \u{1F4BC}', body:top ? 'Start with: ' + top.title : 'Pick one important task and start it first.', weekday:wd, hour:sh, minute:sm});
      repeat.push({id:'work-e-' + wd, title:'Log off, Monmon ♡', body:'Work is done for today. Close the laptop.', weekday:wd, hour:eh, minute:em});
    }
  }
  if (R.friday !== false) repeat.push({id:'friday', title:'Friday money check-in \u{1F4B0}', body:'10 minutes: log what you missed, check budgets, move savings.', weekday:6, hour:12, minute:0});
  if (R.night !== false) repeat.push({id:'night', title:'Shop-free hours \u{1F319}', body:'No shopping until 9 AM. Put wishes on the wait list and decide in the morning.', hour:23, minute:0});
  if (R.payday !== false) S.jobs.forEach(j => nextPaydays(j, 2).forEach(d => {
    const body = d < '2027-01-01' ? 'Move what’s left after your budget to the wedding fund first.' : 'Move 30% to savings within the hour, before anything else.';
    push('pay-' + j.id + '-' + d, j.name + ' payday \u{1F4B8}', body, at(parseD(d), 10, 0));
  }));
  if (R.plans){
    S.wait.filter(w => !w.decided).forEach(w => { let r = new Date(w.added + 48 * 36e5); if (r.getHours() >= 23 || r.getHours() < 9){ if (r.getHours() >= 23) r.setDate(r.getDate() + 1); r.setHours(10, 0, 0, 0); } push('wait-' + w.id, 'Decision time ⏳', (w.name || 'Your wait-list item') + ': ' + money(w.total) + '. Still want it?', r); });
  }
}
