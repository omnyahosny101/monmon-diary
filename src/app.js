/* ============ helpers ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => r.querySelectorAll(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_L = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const fmt = n => Math.round(+n || 0).toLocaleString('en-US');
const money = n => fmt(n) + ' EGP';
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const ym = d => d.getFullYear() + '-' + pad(d.getMonth() + 1);
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d || 1); };
const todayStr = () => ymd(new Date());
const nice = s => { const d = parseD(s); return WD[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const dayOfYear = d => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
const sum = (arr, f) => arr.reduce((a, x) => a + (+f(x) || 0), 0);
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function weekStart(d){ const x = new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; }
function addDays(s, n){ const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); }

/* ============ defaults ============ */
const DEFAULT_HABITS = [
  {id:'shower', name:'Shower', e:'\u{1F6BF}', freq:'daily', target:1, reward:''},
  {id:'vitamins', name:'Vitamins', e:'\u{1F48A}', freq:'daily', target:1, reward:''},
  {id:'nosugar', name:'No sugar or junk', e:'\u{1F36D}', freq:'daily', target:1, reward:'A new lip gloss after 30 days'},
  {id:'read', name:'Read 5+ pages', e:'\u{1F4D6}', freq:'daily', target:1, reward:'A new book after 14 days'},
  {id:'listen', name:'Podcast or episode', e:'\u{1F3A7}', freq:'daily', target:1, reward:''},
  {id:'drybrush', name:'Dry brushing', e:'\u{1FAA5}', freq:'weekly', target:2, reward:''},
  {id:'hair', name:'Wash hair', e:'\u{1F9F4}', freq:'weekly', target:1, reward:''},
];
const DAYLOG = [
  {id:'worked', name:'Worked', e:'\u{1F4BC}'}, {id:'wfh', name:'Worked from home', e:'\u{1F3E0}'},
  {id:'gym', name:'Gym', e:'\u{1F3CB}\u{FE0F}'}, {id:'friends', name:'Out with friends', e:'\u{1F46F}'},
  {id:'fiance', name:'With my fiancé', e:'\u{1F48D}'}, {id:'family', name:'With family', e:'\u{1F3E1}'},
  {id:'pamper', name:'Pampered myself', e:'\u{1F485}'}, {id:'meshwar', name:'Finished a meshwar', e:'\u{1F697}'},
];
const MOODS = [{e:'\u{1F622}',t:'Sad'},{e:'\u{1F615}',t:'Meh'},{e:'\u{1F610}',t:'Okay'},{e:'\u{1F642}',t:'Good'},{e:'\u{1F970}',t:'Amazing'}];
const SELFCARE = [
  {name:'Laser hair removal', e:'✨'}, {name:'Moroccan bath', e:'\u{1F6C1}'}, {name:'Lashes', e:'\u{1F441}\u{FE0F}'},
  {name:'Spider veins removal', e:'\u{1F9B5}'}, {name:'Dermapen session', e:'\u{1FAA1}'}, {name:'Pico laser session', e:'\u{1F48E}'},
  {name:'Filler injection', e:'\u{1F489}'}, {name:'Skin booster session', e:'\u{1F4A7}'},
];
const CATS = [
  {id:'food', name:'Food & groceries', e:'\u{1F96C}'}, {id:'out', name:'Eating out & outings', e:'\u{1F370}'},
  {id:'delivery', name:'Talabat, Noon, Amazon', e:'\u{1F6CD}\u{FE0F}'}, {id:'selfcare', name:'Self-care', e:'\u{1F338}'},
  {id:'pets', name:'Pets', e:'\u{1F431}'}, {id:'subs', name:'Subscriptions', e:'\u{1F4F1}'},
  {id:'gifts', name:'Gifts & occasions', e:'\u{1F381}'}, {id:'transport', name:'Transport', e:'\u{1F695}'},
  {id:'donations', name:'Sadaqa & donations', e:'\u{1F932}'}, {id:'wedding', name:'Wedding', e:'\u{1F470}'},
  {id:'shopping', name:'Clothes & shopping', e:'\u{1F457}'}, {id:'learning', name:'Courses & hobbies', e:'\u{1F3A8}'},
  {id:'bills', name:'Bills', e:'\u{1F9FE}'}, {id:'other', name:'Other', e:'\u{1F4B8}'},
];
const STORES = ['Talabat','Noon','Amazon','Other'];
const EMO = ['⭐','\u{1F338}','\u{1F496}','✨','\u{1F98B}','\u{1F308}','\u{1F381}','\u{1F48E}','\u{1F697}','\u{1F3E1}','✈\u{FE0F}','\u{1F48D}','\u{1F4B0}','\u{1F4DA}','\u{1F4BB}','\u{1F431}','\u{1F3D6}\u{FE0F}','\u{1F45C}','\u{1F3A8}','\u{1F3FA}','\u{1F4E7}','\u{1F4C8}','\u{1F3B5}','\u{1F9D8}‍♀\u{FE0F}'];
const VCOL = ['#ffe3ec','#e9e2ff','#ffe6d8','#dff5ec','#e0f0ff','#fff3c9'];

const DEF = () => ({
  v:3, start:'2026-11-01', checks:{}, water:{}, gym:{}, groc:{},
  settings:{invest:0, budgets:{}, celebrate:true, splash:true, rem:{meals:true, water:true, diary:true, money:true, checkin:true, plans:true}},
  habits:JSON.parse(JSON.stringify(DEFAULT_HABITS)),
  hlog:{}, daylog:{}, diary:{}, media:{}, notes:{}, qa:{}, extras:{}, swaps:{}, dishes:[], forbidden:[],
  mashawer:[], exp:[], selfcare:{}, spend:[], salary:{}, investDone:{}, jars:[], sadaqa:[], shop:[], tasks:[], vision:[],
  skills:[
    {id:'mb', kind:'skill', name:'Media buying (in depth)', e:'\u{1F4C8}', progress:10, next:'Learn campaign structure: campaign, ad set, ad', notes:'', sessions:0},
    {id:'em', kind:'skill', name:'Email campaigns', e:'\u{1F4E7}', progress:5, next:'Write one welcome email sequence', notes:'', sessions:0},
    {id:'mo', kind:'hobby', name:'Mosaic', e:'\u{1F3A8}', progress:0, next:'Find a beginner workshop or kit', notes:'', sessions:0},
    {id:'po', kind:'hobby', name:'Pottery', e:'\u{1F3FA}', progress:0, next:'Book a wheel-throwing class', notes:'', sessions:0},
  ],
  celebrated:{}, splashSeen:'', insightShift:0, savedAt:0
});

/* ============ storage ============ */
const LS = 'monmon-life-v2';
let S = DEF();
(function load(){
  let local = null, nat = null;
  try { local = JSON.parse(localStorage.getItem(LS) || 'null'); } catch(e){}
  if (!local){ try { local = JSON.parse(localStorage.getItem('monmon-v1') || 'null'); } catch(e){} }
  try { nat = window.__NATIVE_STATE__ || null; } catch(e){}
  const pick = (nat && (!local || (nat.savedAt || 0) >= (local.savedAt || 0))) ? nat : local;
  if (pick && typeof pick === 'object') S = merge(DEF(), pick);
  if (!Array.isArray(S.habits) || !S.habits.length) S.habits = JSON.parse(JSON.stringify(DEFAULT_HABITS));
  if (!S.noDonateHabit){ S.habits = S.habits.filter(h => h.id !== 'donate'); S.noDonateHabit = true; }
  S.habits.forEach(h => { if (!(h.target > 0)) h.target = 1; if (h.reward == null) h.reward = ''; });
})();
function merge(base, src){
  for (const k in src){
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) base[k] = merge(base[k], src[k]);
    else base[k] = src[k];
  }
  return base;
}
function native(){ try { return window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.app; } catch(e){ return null; } }
let saveTimer = null;
function save(){
  S.savedAt = Date.now();
  try { localStorage.setItem(LS, JSON.stringify(S)); } catch(e){}
  clearTimeout(saveTimer); saveTimer = setTimeout(syncNative, 500);
}
function syncNative(){ const n = native(); if (!n) return; try { n.postMessage({type:'sync', state:JSON.stringify(S), reminders:buildReminders(), start:S.start}); } catch(e){} }
function toast(t){ $$('.toast').forEach(x => x.remove()); const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 2000); }
function hearts(x, y){
  if (x == null || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const g = ['♥','✦','♥','❀'], c = ['var(--rose)','var(--gold)','var(--lilac)','var(--mint)'];
  for (let i = 0; i < 12; i++){
    const h = document.createElement('span'); h.className = 'heart'; h.textContent = g[i % 4];
    const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 60;
    h.style.left = x + 'px'; h.style.top = y + 'px'; h.style.color = c[i % 4];
    h.style.setProperty('--dx', Math.cos(a) * r + 'px'); h.style.setProperty('--dy', Math.sin(a) * r - 30 + 'px'); h.style.setProperty('--r', (Math.random() * 120 - 60) + 'deg');
    document.body.appendChild(h); setTimeout(() => h.remove(), 950);
  }
}

/* ============ celebrations ============ */
function confetti(canvas){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dpr = devicePixelRatio || 1, ctx = canvas.getContext('2d'), W = canvas.width = innerWidth * dpr, H = canvas.height = innerHeight * dpr;
  const cols = ['#ff5c8f','#ffb48f','#b9a3ff','#3fbf8f','#ffd166','#7cc4ff'];
  const ps = Array.from({length:140}, () => ({x:W / 2, y:H * .45, vx:(Math.random() - .5) * 26 * dpr, vy:(-Math.random() * 22 - 6) * dpr, s:(5 + Math.random() * 7) * dpr, c:cols[Math.floor(Math.random() * cols.length)], r:Math.random() * 6, vr:(Math.random() - .5) * .3, h:Math.random() < .3}));
  let t = 0;
  (function frame(){
    if (!canvas.isConnected) return;
    ctx.clearRect(0, 0, W, H); t++;
    ps.forEach(p => { p.vy += .55 * dpr; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if (p.h){ ctx.font = (p.s * 2) + 'px serif'; ctx.fillText('♥', 0, 0); } else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore(); });
    if (t < 220) requestAnimationFrame(frame);
  })();
}
function celebrate(o){
  if (o.key){ if (S.celebrated[o.key]) return; S.celebrated[o.key] = Date.now(); save(); }
  if (S.settings.celebrate === false){ toast(o.title); return; }
  $$('.overlay.celebration').forEach(x => x.remove());
  const ov = document.createElement('div'); ov.className = 'overlay celebration'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = '<canvas class="confetti"></canvas><div class="ocard"><div class="big">' + o.e + '</div><h2>' + esc(o.title) + '</h2><p>' + esc(o.msg) + '</p>' + (o.reward ? '<div class="adv"><b>Your reward</b>' + esc(o.reward) + '</div>' : '') + '<button class="btn full" style="background:var(--rose)">Yay, thank you ♡</button></div>';
  document.body.appendChild(ov);
  confetti($('canvas', ov));
  const close = () => ov.remove();
  $('button', ov).onclick = close; ov.onclick = e => { if (e.target === ov) close(); };
}
const MILESTONES = [3, 7, 14, 21, 30, 45, 60, 90, 100, 150, 200, 365];
const habitDone = (id, day) => !!(S.hlog[day] && S.hlog[day][id]);
function streakOf(id){ let n = 0; const d = new Date(); if (!habitDone(id, ymd(d))) d.setDate(d.getDate() - 1); for (let i = 0; i < 400 && habitDone(id, ymd(d)); i++){ n++; d.setDate(d.getDate() - 1); } return n; }

/* ============ reminders (scheduled by the iPhone app) ============ */
function buildReminders(){
  const R = S.settings.rem, now = new Date(), once = [], repeat = [];
  const at = (d, h, m) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
  const iso = d => ymd(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  const push = (id, title, body, when) => { if (when > now) once.push({id, title, body, at:iso(when)}); };
  if (R.water) [11,13,16,19].forEach(h => repeat.push({id:'water-' + h, title:'Water break \u{1F4A7}', body:'Have a glass of water and tap it in Monmon’s Life.', hour:h, minute:0}));
  if (R.diary){
    repeat.push({id:'diary-0', title:'Diary time, Monmon ♡', body:'How was today? Pick your mood and answer today’s 3 questions.', hour:0, minute:0});
    repeat.push({id:'diary-2', title:'Before you sleep \u{1F319}', body:'If you haven’t yet, close the day in your diary. Then rest, beautiful.', hour:2, minute:0});
  }
  if (R.checkin) repeat.push({id:'checkin', title:'Evening check-in ✨', body:'Tick your habits, log your spending and what you did today.', hour:22, minute:0});
  if (R.money){
    const amt = S.settings.invest ? money(S.settings.invest) : 'your monthly amount';
    repeat.push({id:'invest', title:'New month: invest \u{1F4B0}', body:'Add ' + amt + ' to your investments this month.', day:1, hour:10, minute:0});
    repeat.push({id:'gold', title:'Gold reminder ✨', body:'Buy gold this month.', day:1, hour:10, minute:5});
    repeat.push({id:'scplan', title:'Plan your self-care month \u{1F338}', body:'Open Plans › Self-care and set this month’s sessions and prices.', day:1, hour:10, minute:10});
    repeat.push({id:'salary', title:'Log your salary \u{1F4B5}', body:'Add this month’s salary in Money › Salary.', day:1, hour:12, minute:0});
  }
  if (R.plans){
    S.tasks.filter(t => !t.done && t.due && t.prio === 'urgent').forEach(t => {
      const tm = t.time ? t.time.split(':').map(Number) : null, due = parseD(t.due);
      const eve = at(due, 20, 0); eve.setDate(eve.getDate() - 1);
      push('tu1-' + t.id, '\u{1F6A8} Urgent tomorrow', t.title, eve);
      push('tu2-' + t.id, '\u{1F6A8} Urgent today', t.title + (t.time ? ' · by ' + t.time : ''), at(due, 9, 0));
      if (tm){ const b = at(due, tm[0], tm[1]); b.setHours(b.getHours() - 1); push('tu3-' + t.id, '\u{1F6A8} 1 hour left', t.title, b); }
    });
    S.mashawer.filter(m => !m.done && m.remind !== false && m.date).forEach(m => {
      const t = m.time ? m.time.split(':').map(Number) : [10, 0];
      const when = at(parseD(m.date), t[0], t[1]); when.setDate(when.getDate() - 1);
      push('m-' + m.id, 'Tomorrow: ' + m.name + ' \u{1F4CD}', (m.time ? 'At ' + m.time + '. ' : '') + (m.note || 'Your meshwar is tomorrow.'), when);
    });
    Object.values(S.selfcare).forEach(list => list.forEach(s => {
      if (s.done || !s.planned) return;
      const when = at(parseD(s.planned), 20, 0); when.setDate(when.getDate() - 1);
      push('s-' + s.id, 'Tomorrow: ' + s.e + ' ' + s.name, s.price ? ('Budget: ' + money(s.price)) : 'Your self-care session is tomorrow.', when);
    }));
    S.tasks.filter(t => !t.done && t.due && t.prio !== 'urgent').forEach(t => {
      if (t.prio === 'high'){ const eve = at(parseD(t.due), 20, 0); eve.setDate(eve.getDate() - 1); push('th-' + t.id, '⚠\u{FE0F} Important tomorrow', t.title, eve); }
      push('t-' + t.id, (t.kind === 'work' ? 'Work task due today' : 'To-do today'), t.title, at(parseD(t.due), 9, 0));
    });
    S.exp.filter(x => !x.done && x.date).forEach(x => { const when = at(parseD(x.date), 19, 0); when.setDate(when.getDate() - 1); push('x-' + x.id, 'Tomorrow: ' + x.title + ' ✨', x.with && x.with.length ? 'With ' + x.with.join(', ') : 'A new experience awaits.', when); });
  }
  if (R.meals){
    const slots = [['Breakfast',9,0],['Lunch',14,0],['Snack',17,30],['Dinner',20,30]];
    for (let o = 0; o < 4; o++){
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + o);
      const n = planDayNum(d); if (n < 1 || n > 30) continue;
      mealsFor(n).forEach((m, i) => push('meal-' + n + '-' + i, slots[i][0] + ' time, Monmon ♡', m.name + ' · ' + m.kcal + ' kcal', at(d, slots[i][1], slots[i][2])));
    }
  }
  once.sort((a, b) => a.at < b.at ? -1 : 1);
  return {repeat, once};
}

/* ============ plan helpers ============ */
function planDayNum(date){ const d = new Date(date); d.setHours(0,0,0,0); return Math.round((d - parseD(S.start)) / 864e5) + 1; }
const clampDay = n => Math.min(30, Math.max(1, n));
function planDate(n){ const d = parseD(S.start); d.setDate(d.getDate() + n - 1); return d; }
function mealsFor(n){ return PLAN[n - 1].meals.map((m, i) => { const sw = S.swaps[n + '-' + i]; return sw ? Object.assign({}, m, {name:sw.name, kcal:sw.kcal, protein:sw.protein, swapped:true}) : m; }); }

/* ============ navigation ============ */
const TABS = [
  {id:'today', name:'Today', icon:'<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="4"/>', subs:null},
  {id:'food', name:'Food', icon:'<circle cx="12" cy="13" r="7"/><circle cx="12" cy="13" r="3.5"/><path d="M3 3v6M21 3c-1.5 1-2 3-2 5h2V3zM21 8v13"/>', subs:[['meals','Meals'],['dishes','My dishes'],['forbidden','Forbidden'],['month','Month'],['groc','Groceries'],['tips','Tips']]},
  {id:'money', name:'Money', icon:'<rect x="2.5" y="6" width="19" height="13" rx="3"/><path d="M2.5 10h19M16 15h2"/>', subs:[['overview','Overview'],['spend','Spending'],['savings','Savings'],['sadaqa','Sadaqa'],['receipts','Receipts'],['salary','Salary'],['pets','Pets']]},
  {id:'plans', name:'Plans', icon:'<path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>', subs:[['tasks','Tasks'],['mashawer','Mashawer'],['exp','Experiences'],['selfcare','Self-care'],['shop','Shopping'],['vision','Vision board']]},
  {id:'grow', name:'Grow', icon:'<path d="M12 21v-9M12 12c0-4 3-7 8-7 0 5-3 7-8 7zM12 14c0-3-2.5-5.5-7-5.5 0 4 2.5 5.5 7 5.5z"/>', subs:[['skills','Skills'],['hobbies','Hobbies']]},
  {id:'me', name:'Me', icon:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>', subs:[['days','My days'],['diary','Diary'],['habits','Habits'],['settings','Settings']]},
];
let nav = {tab:'today', sub:{food:'meals', money:'overview', plans:'tasks', grow:'skills', me:'days'}};
let ui = {foodDay:null, moneyMonth:ym(new Date()), scMonth:ym(new Date()), diaryMonth:ym(new Date()), dayView:todayStr(), vEmo:EMO[0], dishType:'Lunch', build:[], gEmo:null, hEmo:null};
try { const n = JSON.parse(sessionStorage.getItem('monmon-nav') || 'null'); if (n && n.sub){ nav.tab = n.tab; Object.assign(nav.sub, n.sub); } } catch(e){}

function renderTabs(){
  $('#tabs').innerHTML = TABS.map(t => '<button class="tab" role="tab" data-t="' + t.id + '" aria-selected="' + (nav.tab === t.id) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + t.icon + '</svg>' + t.name + '</button>').join('');
  $$('#tabs .tab').forEach(b => b.onclick = () => go(b.dataset.t));
}
function go(tab, sub){
  nav.tab = tab; if (sub) nav.sub[tab] = sub;
  try { sessionStorage.setItem('monmon-nav', JSON.stringify(nav)); } catch(e){}
  render(); window.scrollTo({top:0});
}
function segHTML(t){
  const T = TABS.find(x => x.id === t); if (!T.subs) return '';
  return '<div class="seg" role="tablist">' + T.subs.map(s => '<button data-sub="' + s[0] + '" aria-pressed="' + (nav.sub[t] === s[0]) + '">' + s[1] + '</button>').join('') + '</div>';
}
const VIEWS = {};
function render(){
  const d = new Date();
  if (!TABS.some(t => t.id === nav.tab)) nav.tab = 'today';
  document.body.dataset.tab = nav.tab;
  $('#dateLabel').textContent = WD[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS_L[d.getMonth()];
  renderTabs();
  const T = TABS.find(x => x.id === nav.tab);
  if (T.subs && !T.subs.some(s => s[0] === nav.sub[nav.tab])) nav.sub[nav.tab] = T.subs[0][0];
  const v = $('#views');
  v.innerHTML = '<section class="view">' + segHTML(nav.tab) + '<div class="view pop" id="body"></div></section>';
  $$('.seg button', v).forEach(b => b.onclick = () => go(nav.tab, b.dataset.sub));
  (T.subs ? VIEWS[nav.tab + '.' + nav.sub[nav.tab]] : VIEWS[nav.tab])($('#body'));
  const seg = $('.seg', v), on = seg && $('[aria-pressed="true"]', seg);
  if (on) seg.scrollLeft = on.offsetLeft - 20;
}
$('#openSettings').onclick = () => go('me', 'settings');
$('#openNote').onclick = () => showSplash(true);

/* ============ shared bits ============ */
function weekCount(id, dayStr){ const ws = weekStart(parseD(dayStr)); let c = 0; for (let i = 0; i < 7; i++){ const d = new Date(ws); d.setDate(ws.getDate() + i); if (habitDone(id, ymd(d))) c++; } return c; }
function setHabit(id, day, on, ev){
  S.hlog[day] = S.hlog[day] || {};
  if (on) S.hlog[day][id] = true; else delete S.hlog[day][id];
  save();
  if (!on) return;
  if (ev) hearts(ev.clientX, ev.clientY);
  const h = S.habits.find(x => x.id === id); if (!h || day !== todayStr()) return;
  if (h.freq === 'daily'){
    const st = streakOf(id);
    if (MILESTONES.includes(st)) celebrate({key:'st-' + id + '-' + st + '-' + day, e:'\u{1F525}', title:st + ' days of ' + h.name + '!', msg:'Look at you, Monmon. ' + st + ' days in a row. Keep the flame going.', reward:h.reward});
  } else if (weekCount(id, day) === h.target){
    toast(h.e + ' ' + h.name + ': weekly goal done!');
  }
  const daily = S.habits.filter(x => x.freq === 'daily');
  if (daily.length && daily.every(x => habitDone(x.id, day))) celebrate({key:'all-' + day, e:'\u{1F451}', title:'All daily habits done!', msg:'Every single one, today. You’re glowing, queen.'});
}
function delBtn(attr, id){ return '<button class="del" ' + attr + '="' + id + '" aria-label="Delete">×</button>'; }
function armDelete(el, attr, onDel){
  $$('[' + attr + ']', el).forEach(b => { let armed = false;
    b.onclick = ev => { ev.stopPropagation(); if (!armed){ armed = true; b.textContent = 'Delete?'; b.classList.add('armed'); setTimeout(() => { armed = false; b.textContent = '×'; b.classList.remove('armed'); }, 2500); return; } onDel(b.getAttribute(attr)); };
  });
}
function monthNav(key){ const d = parseD(ui[key] + '-01'); return '<div class="monthnav"><button data-mn="-1" aria-label="Previous month">‹</button><b>' + MONTHS_L[d.getMonth()] + ' ' + d.getFullYear() + '</b><button data-mn="1" aria-label="Next month">›</button></div>'; }
function bindMonthNav(el, key, again){ $$('[data-mn]', el).forEach(b => b.onclick = () => { const d = parseD(ui[key] + '-01'); d.setMonth(d.getMonth() + +b.dataset.mn); ui[key] = ym(d); again(); }); }
const monthLabel = k => { const d = parseD(k + '-01'); return MONTHS_L[d.getMonth()] + ' ' + d.getFullYear(); };
const inMonth = (s, k) => s.date && s.date.slice(0, 7) === k;
const spentOn = day => sum(S.spend.filter(s => s.date === day), s => s.amount);
const catOf = id => CATS.find(c => c.id === id) || CATS[CATS.length - 1];
function sheet(html, bind){
  const sh = document.createElement('div'); sh.className = 'sheet';
  sh.innerHTML = '<div class="sheet-in" role="dialog" aria-modal="true">' + html + '<button class="btn soft full" data-close>Close</button></div>';
  document.body.appendChild(sh);
  const close = () => sh.remove();
  sh.onclick = e => { if (e.target === sh) close(); };
  $('[data-close]', sh).onclick = close;
  if (bind) bind(sh, close);
}
function emoPicker(cur, attr){ return '<div class="emopick">' + EMO.map(e => '<button type="button" ' + attr + '="' + e + '" aria-pressed="' + (cur === e) + '">' + e + '</button>').join('') + '</div>'; }
function bindEmo(root, attr, onPick){ $$('[' + attr + ']', root).forEach(b => b.onclick = () => { onPick(b.getAttribute(attr)); $$('[' + attr + ']', root).forEach(x => x.setAttribute('aria-pressed', x === b)); }); }

/* ============ splash: daily note + advice ============ */
function showSplash(force){
  const t = todayStr();
  if (!force && (S.splashSeen === t || S.settings.splash === false)) return;
  if ($('.overlay')) return;
  S.splashSeen = t; save();
  const doy = dayOfYear(new Date()), h = new Date().getHours();
  const hello = h < 5 ? 'Still up, Monmon? \u{1F319}' : h < 12 ? 'Sabah el kheir, Monmon ☀\u{FE0F}' : h < 18 ? 'Hello, gorgeous \u{1F338}' : 'Masa2 el kheir, Monmon \u{1F319}';
  const ov = document.createElement('div'); ov.className = 'overlay';
  ov.innerHTML = '<div class="ocard"><p style="color:var(--berry);font-weight:900">' + hello + '</p><div class="quote">“' + esc(NOTES[doy % NOTES.length]) + '”</div><div class="adv"><b>Today’s advice for you</b>' + esc(ADVICE[(doy * 7) % ADVICE.length]) + '</div><button class="btn full" style="background:var(--rose)">Let’s go ♡</button></div>';
  document.body.appendChild(ov);
  const close = () => ov.remove(); $('button', ov).onclick = close; ov.onclick = e => { if (e.target === ov) close(); };
}

/* ============ TODAY ============ */
function urgentTasks(){ const t = todayStr(), soon = addDays(t, 2); return S.tasks.filter(x => !x.done && (x.prio === 'urgent' || (x.prio === 'high' && x.due && x.due <= soon))).sort((a, b) => ((a.prio === 'urgent' ? 0 : 1) - (b.prio === 'urgent' ? 0 : 1)) || ((a.due || '9') < (b.due || '9') ? -1 : 1)); }
VIEWS.today = function(el){
  const day = todayStr(), doy = dayOfYear(new Date());
  const n = planDayNum(new Date()), inPlan = n >= 1 && n <= 30;
  let eaten = 0; if (inPlan) for (let i = 0; i < 4; i++) if (S.checks[n + '-' + i]) eaten++;
  const daily = S.habits.filter(x => x.freq === 'daily'), hDone = S.habits.filter(x => habitDone(x.id, day)).length;
  const media = S.media[day] || {}, diary = S.diary[day] || {}, logs = S.daylog[day] || [], qa = S.qa[day] || {};
  const qs = [0, 1, 2].map(i => (doy * 3 + i) % QUESTIONS.length);
  const urg = urgentTasks(), coming = upcoming().slice(0, 4);
  const sadT = sum(S.sadaqa.filter(s => s.date === day), s => s.amount);
  const ins = INSIGHTS[(doy + (S.insightShift || 0)) % INSIGHTS.length];
  const todaySpend = S.spend.filter(s => s.date === day);
  el.innerHTML =
  (urg.length ? '<div class="urgent"><h2>Do these first</h2>' + urg.slice(0, 4).map(x => '<button class="ur" data-udone="' + x.id + '"><span class="tick">' + CHECK + '</span><span><span class="pill" style="background:#fff;color:' + (x.prio === 'urgent' ? 'var(--danger)' : '#a86d00') + '">' + (x.prio === 'urgent' ? '\u{1F6A8} URGENT' : '⚠\u{FE0F} SOON') + '</span>' + esc(x.title) + (x.due ? '<span style="display:block;font-size:12px;opacity:.92">' + (x.due < day ? 'Overdue · ' : '') + nice(x.due) + (x.time ? ' · by ' + x.time : '') + '</span>' : '') + '</span></button>').join('') + '</div>' : '') +

  '<div class="card tint"><div class="greet">Your day so far</div>' +
    '<div class="stats3"><div class="stat"><b>' + (inPlan ? eaten + '/4' : '–') + '</b><span>meals</span></div><div class="stat"><b>' + hDone + '/' + S.habits.length + '</b><span>habits</span></div><div class="stat"><b>' + fmt(spentOn(day)) + '</b><span>EGP spent</span></div></div></div>' +

  '<div class="card"><div class="card-head"><h2>Today’s habits</h2><button class="linkbtn" data-go="me:habits">Customize</button></div><div class="hgrid">' +
    S.habits.map(x => { const on = habitDone(x.id, day), st = x.freq === 'daily' ? streakOf(x.id) : 0, sub = x.freq === 'weekly' ? (weekCount(x.id, day) + '/' + x.target + ' this week') : 'daily';
      return '<button class="habit' + (on ? ' on' : '') + '" data-h="' + x.id + '" aria-pressed="' + on + '"><span class="e">' + x.e + '</span><span class="hl">' + esc(x.name) + '<span class="hs">' + sub + '</span></span>' + (st >= 2 ? '<span class="fire">\u{1F525}' + st + '</span>' : '') + '</button>'; }).join('') +
  '</div>' + (daily.length && daily.every(x => habitDone(x.id, day)) ? '<p class="small" style="margin:0;text-align:center;font-weight:900;color:var(--mint)">\u{1F451} All daily habits done. Proud of you!</p>' : '') + '</div>' +

  '<div class="card"><div class="card-head"><h2>Sadaqa</h2><span class="amt">' + money(sadT) + ' today</span></div><div class="row"><label class="field" style="flex:1 1 90px"><span>Amount (EGP)</span><input class="in num" id="sAmt" type="number" inputmode="decimal" min="0" placeholder="0"></label><label class="field" style="flex:2 1 140px"><span>For</span><input class="in" id="sNote" placeholder="Street cats, a family…"></label><button class="btn" id="sAdd">Give</button></div>' +
    '<p class="small muted" style="margin:0;font-weight:800">\u{1F49D} ' + S.sadaqa.length + ' times so far · ' + money(sum(S.sadaqa, s => s.amount)) + ' in total</p></div>' +

  '<div class="card"><h2>Reading & listening</h2><div class="row">' +
    '<label class="field" style="flex:2 1 160px"><span>Book</span><input class="in" id="mBook" placeholder="What are you reading?" value="' + esc(media.book || S.lastBook || '') + '"></label>' +
    '<label class="field" style="flex:1 1 80px"><span>Pages today</span><input class="in num" id="mPages" type="number" inputmode="numeric" min="0" value="' + esc(media.pages || '') + '"></label></div>' +
    '<label class="field"><span>Podcast or episode</span><input class="in" id="mEp" placeholder="El Da7ee7, El Hadara…" value="' + esc(media.episode || '') + '"></label>' +
    '<p class="small muted" style="margin:0">5 pages or more ticks reading; an episode ticks listening.</p></div>' +

  '<div class="card"><h2>What did I do today?</h2><div class="chips">' + DAYLOG.map(x => '<button class="chip' + (logs.includes(x.id) ? ' on' : '') + '" data-l="' + x.id + '">' + x.e + ' ' + x.name + '</button>').join('') + '</div></div>' +

  '<div class="card"><div class="card-head"><h2>Dear diary</h2><span class="small muted">' + nice(day) + '</span></div>' +
    '<div class="moods">' + MOODS.map((m, i) => '<button class="mood' + (diary.mood === i + 1 ? ' on' : '') + '" data-mood="' + (i + 1) + '" aria-label="' + m.t + '">' + m.e + '<span>' + m.t + '</span></button>').join('') + '</div>' +
    '<h3>Today’s 3 questions</h3>' +
    qs.map(q => '<label class="field"><span class="qlab">' + esc(QUESTIONS[q]) + '</span><textarea class="in" data-q="' + q + '" placeholder="My answer…" style="min-height:50px">' + esc(qa[q] || '') + '</textarea></label>').join('') +
    '<label class="field"><span>What I did</span><textarea class="in" id="dSum" placeholder="A little summary of my day…">' + esc(diary.summary || '') + '</textarea></label>' +
    '<label class="field"><span>How I felt</span><textarea class="in" id="dFeel" placeholder="My feelings today…">' + esc(diary.feelings || '') + '</textarea></label>' +
    '<label class="field"><span>Quick notes and drafts</span><textarea class="in" id="dNote" placeholder="Anything to remember about today…">' + esc(S.notes[day] || '') + '</textarea></label>' +
    '<button class="linkbtn" data-go="me:days" style="align-self:flex-start">See my whole day ›</button></div>' +

  '<div class="card"><div class="card-head"><h2>Spent today</h2><span class="amt">' + money(spentOn(day)) + '</span></div>' +
    '<div class="row"><label class="field" style="flex:1 1 90px"><span>Amount</span><input class="in num" id="qAmt" type="number" inputmode="decimal" min="0" placeholder="0"></label>' +
    '<label class="field" style="flex:2 1 150px"><span>Category</span><select class="in" id="qCat">' + CATS.map(c => '<option value="' + c.id + '">' + c.e + ' ' + c.name + '</option>').join('') + '</select></label></div>' +
    '<div class="row"><label class="field"><span>Note</span><input class="in" id="qNote" placeholder="What was it?"></label><button class="btn" id="qAdd">Add</button></div>' +
    '<div class="list">' + (todaySpend.length ? todaySpend.map(spendRow).join('') : '<div class="empty">Nothing spent yet today.</div>') + '</div></div>' +

  '<div class="card"><div class="card-head"><h2>Coming up</h2><button class="linkbtn" data-go="plans">Plans</button></div><div class="list">' +
    (coming.length ? coming.map(c => '<div class="item"><span style="font-size:20px">' + c.e + '</span><span class="t">' + esc(c.title) + '<span class="s">' + c.when + '</span></span><span></span></div>').join('') : '<div class="empty">Nothing planned yet.</div>') + '</div></div>' +

  (inPlan ? '<div class="card"><div class="card-head"><h2>Next meal</h2><button class="linkbtn" data-go="food">Food</button></div>' + nextMealHTML(n) + '</div>' : '') +

  '<div class="card insight"><span class="tag">Did you know · ' + ins[0] + '</span><p>' + esc(ins[1]) + '</p><button class="linkbtn" id="insNext" style="align-self:flex-start;background:var(--surface);color:var(--lilac)">Another one</button></div>';

  const again = () => VIEWS.today(el);
  $$('[data-h]', el).forEach(b => b.onclick = ev => { setHabit(b.dataset.h, day, !habitDone(b.dataset.h, day), ev); again(); });
  $$('[data-l]', el).forEach(b => b.onclick = () => { const arr = S.daylog[day] = S.daylog[day] || []; const i = arr.indexOf(b.dataset.l); if (i >= 0) arr.splice(i, 1); else arr.push(b.dataset.l); b.classList.toggle('on'); save(); });
  $$('[data-mood]', el).forEach(b => b.onclick = () => { S.diary[day] = S.diary[day] || {}; S.diary[day].mood = +b.dataset.mood; save(); $$('[data-mood]', el).forEach(x => x.classList.toggle('on', x === b)); });
  const dSet = (k, v) => { S.diary[day] = S.diary[day] || {}; S.diary[day][k] = v; save(); };
  $('#dSum', el).oninput = e => dSet('summary', e.target.value);
  $('#dFeel', el).oninput = e => dSet('feelings', e.target.value);
  $('#dNote', el).oninput = e => { S.notes[day] = e.target.value; save(); };
  $$('[data-q]', el).forEach(t => t.oninput = () => { S.qa[day] = S.qa[day] || {}; S.qa[day][t.dataset.q] = t.value; save(); });
  const mSet = () => {
    const book = $('#mBook', el).value.trim(), pages = +$('#mPages', el).value || 0, ep = $('#mEp', el).value.trim();
    S.media[day] = {book, pages, episode:ep}; if (book) S.lastBook = book; save();
    if (pages >= 5 && !habitDone('read', day)) setHabit('read', day, true);
    if (ep && !habitDone('listen', day)) setHabit('listen', day, true);
  };
  ['#mBook','#mPages','#mEp'].forEach(s => $(s, el).onchange = () => { mSet(); again(); });
  $('#qAdd', el).onclick = () => { const amt = +$('#qAmt', el).value; if (!(amt > 0)) return toast('Enter an amount'); S.spend.push({id:uid(), date:day, amount:amt, cat:$('#qCat', el).value, note:$('#qNote', el).value.trim()}); save(); toast('Added ' + money(amt)); again(); };
  $('#sAdd', el).onclick = ev => { if (addSadaqa(+$('#sAmt', el).value, $('#sNote', el).value.trim(), day, ev)) again(); };
  bindSpendDeletes(el, again);
  $$('[data-go]', el).forEach(b => b.onclick = () => { const p = b.dataset.go.split(':'); go(p[0], p[1]); });
  $$('[data-udone]', el).forEach(b => b.onclick = ev => { const x = S.tasks.find(y => y.id === b.dataset.udone); x.done = true; x.doneOn = day; save(); hearts(ev.clientX, ev.clientY); toast('Done! One less thing ♡'); again(); });
  $('#insNext', el).onclick = () => { S.insightShift = (S.insightShift || 0) + 1; save(); again(); setTimeout(() => { const i = $('.insight'); if (i) i.scrollIntoView({block:'center'}); }, 0); };
  const nm = $('[data-nextmeal]', el); if (nm) nm.onclick = ev => { toggleMeal(nm.dataset.nextmeal, ev); again(); };
};
function addSadaqa(amt, note, date, ev){
  if (!(amt > 0)){ toast('Enter the amount'); return false; }
  const spendId = uid();
  S.sadaqa.push({id:uid(), date, amount:amt, note, spendId});
  S.spend.push({id:spendId, date, amount:amt, cat:'donations', note:note || 'Sadaqa'});
  save();
  if (ev) hearts(ev.clientX, ev.clientY);
  const c = S.sadaqa.length, tot = sum(S.sadaqa, s => s.amount);
  if ([1, 5, 10, 25, 50, 75, 100, 150, 200, 300, 500].includes(c)) celebrate({key:'sad-' + c, e:'\u{1F932}', title:c === 1 ? 'Your first sadaqa here!' : c + ' times of sadaqa!', msg:'May it come back to you multiplied. ' + money(tot) + ' given so far.'});
  else toast('Sadaqa logged ♡ ' + c + ' times so far');
  return true;
}
function toggleMeal(k, ev){
  S.checks[k] = !S.checks[k]; if (!S.checks[k]) delete S.checks[k]; else if (ev) hearts(ev.clientX, ev.clientY);
  save();
  const n = +k.split('-')[0];
  if (S.checks[k] && mealsDone(n) === 4) celebrate({key:'meals-' + n + '-' + S.start, e:'\u{1F957}', title:'Day ' + n + ' meals: all done!', msg:'You ate your whole plan today. Your body says thank you.'});
}
function nextMealHTML(n){
  const meals = mealsFor(n), h = new Date().getHours() + new Date().getMinutes() / 60;
  let i = h < 11 ? 0 : h < 15 ? 1 : h < 18.5 ? 2 : 3;
  for (let k = 0; k < 4 && S.checks[n + '-' + i]; k++) i = Math.min(3, i + 1);
  const m = meals[i], key = n + '-' + i, on = !!S.checks[key];
  return '<button class="meal' + (on ? ' eaten' : '') + '" data-nextmeal="' + key + '" style="box-shadow:none;background:var(--bg)"><span class="ic">' + (MICONS[m.type] || MICONS.Gym) + '</span><span class="txt"><span class="lbl">' + m.type + ' · Day ' + n + '</span><div class="nm">' + esc(m.name) + '</div><div class="mac">' + m.kcal + ' kcal · ' + m.protein + ' g protein</div></span><span class="check">' + CHECK + '</span></button>';
}
function upcoming(){
  const t = todayStr(), out = [];
  S.mashawer.filter(m => !m.done && m.date >= t).forEach(m => out.push({d:m.date + (m.time || ''), e:'\u{1F4CD}', title:m.name, when:nice(m.date) + (m.time ? ' · ' + m.time : '')}));
  S.exp.filter(x => !x.done && x.date && x.date >= t).forEach(x => out.push({d:x.date, e:'✨', title:x.title, when:nice(x.date) + (x.with && x.with.length ? ' · with ' + x.with.join(', ') : '')}));
  Object.values(S.selfcare).forEach(l => l.filter(s => !s.done && s.planned && s.planned >= t).forEach(s => out.push({d:s.planned, e:s.e, title:s.name, when:nice(s.planned) + (s.price ? ' · ' + money(s.price) : '')})));
  S.tasks.filter(x => !x.done && x.due && x.due >= t && x.prio !== 'urgent').forEach(x => out.push({d:x.due, e:x.kind === 'work' ? '\u{1F4BC}' : '✅', title:x.title, when:'Due ' + nice(x.due)}));
  return out.sort((a, b) => a.d < b.d ? -1 : 1);
}

/* ============ FOOD ============ */
const MICONS = {
  Breakfast:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4"/></svg>',
  Lunch:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="7"/><circle cx="12" cy="13" r="3.5"/><path d="M3 3v6M21 3c-1.5 1-2 3-2 5h2V3zM21 8v13"/></svg>',
  Snack:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="16.5" r="3.5"/><circle cx="16.5" cy="17.5" r="3.5"/><path d="M7.5 13c1-5 4-8 8-9.5M16.5 14c-.5-4-1-7-1-10.5M15.5 3.5c2 0 4 1 5 3"/></svg>',
  Dinner:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  Gym:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>'
};
function mealsDone(d){ let n = 0; for (let i = 0; i < 4; i++) if (S.checks[d + '-' + i]) n++; return n; }
function allDishes(type){ return DISHES.filter(d => !type || d.type === type).concat(S.dishes.filter(d => !type || d.type === type || d.type === 'Any')); }
VIEWS['food.meals'] = function(el){
  const t = planDayNum(new Date());
  if (ui.foodDay == null) ui.foodDay = clampDay(t);
  const sel = ui.foodDay, gym = !!S.gym[sel], dateS = ymd(planDate(sel));
  const meals = mealsFor(sel).slice();
  if (gym) meals.push({type:'Pre-gym', name:'Banana, apple or 3 fresh dates, 60 to 90 minutes before training', kcal:100, protein:1});
  const extras = S.extras[dateS] || [];
  let eK = 0, eP = 0, pK = 0, pP = 0;
  const keys = meals.map((m, i) => sel + '-' + (m.type === 'Pre-gym' ? 'g' : i));
  meals.forEach((m, i) => { pK += m.kcal; pP += m.protein; if (S.checks[keys[i]]) { eK += m.kcal; eP += m.protein; } });
  extras.forEach(x => { eK += x.kcal; eP += x.protein; });
  const w = S.water[sel] || 0, C = 364.4;
  let strip = '';
  for (let d = 1; d <= 30; d++){ const dt = planDate(d), n = mealsDone(d); strip += '<button class="dpill' + (d === sel ? ' sel' : '') + (d === t ? ' today' : '') + (n === 4 ? ' done' : n ? ' part' : '') + '" data-d="' + d + '" aria-label="Day ' + d + '"><span class="dn">' + WD[dt.getDay()] + '</span><span class="dd">' + dt.getDate() + '</span><span class="dot"></span></button>'; }
  el.innerHTML = '<div class="strip" id="strip">' + strip + '</div>' +
    (t < 1 && sel === 1 ? '<div class="card tint" style="padding:10px 14px;text-align:center;font-weight:800">Your plan starts in ' + (1 - t) + ' day' + (1 - t === 1 ? '' : 's') + '. Here is a peek at Day 1.</div>' : '') +
    '<div class="card tint"><div class="ringwrap"><div class="ring"><svg viewBox="0 0 140 140"><circle class="track" cx="70" cy="70" r="58"/><circle class="fill" cx="70" cy="70" r="58" stroke-dasharray="364.4" stroke-dashoffset="' + (C - C * Math.min(1, eK / pK)).toFixed(1) + '"/></svg><div class="mid"><span class="big">' + fmt(eK) + '</span><span class="sm">of ' + fmt(pK) + ' kcal</span></div></div>' +
    '<div style="display:flex;flex-direction:column;gap:10px;min-width:0"><div><div class="greet">Day ' + sel + '</div><div class="small muted" style="font-weight:800">' + nice(dateS) + '</div></div>' +
    '<div><div class="statrow"><span>Protein</span><span>' + Math.round(eP) + ' / ' + pP + ' g</span></div><div class="bar"><i style="width:' + Math.min(100, eP / pP * 100) + '%"></i></div></div>' +
    '<button class="toggle" id="gymBtn"><span class="sw" role="switch" aria-checked="' + gym + '"></span><span>Gym day</span></button></div></div></div>' +
    '<div class="card"><div class="card-head"><h2>Water</h2><span class="num muted">' + w + ' / 8 glasses</span></div><div class="cups">' + Array.from({length:8}, (_, i) => '<button class="cup' + (i < w ? ' on' : '') + '" data-c="' + (i + 1) + '" aria-label="Glass ' + (i + 1) + '"></button>').join('') + '</div></div>' +
    meals.map((m, i) => '<div class="meal' + (S.checks[keys[i]] ? ' eaten' : '') + '"><span class="ic">' + (MICONS[m.type] || MICONS.Gym) + '</span><span class="txt"><span class="lbl">' + m.type + (m.type !== 'Pre-gym' ? ' <button class="swap" data-swap="' + i + '">' + (m.swapped ? 'Swapped · change' : '⇄ Swap') + '</button>' : '') + '</span><div class="nm">' + esc(m.name) + '</div><div class="mac">' + m.kcal + ' kcal · ' + m.protein + ' g protein</div></span><button class="check" data-k="' + keys[i] + '" aria-label="Mark eaten">' + CHECK + '</button></div>').join('') +
    extras.map((x, i) => '<div class="meal" style="background:color-mix(in srgb,var(--danger) 8%,var(--surface))"><span class="ic" style="font-size:24px;background:transparent">' + x.e + '</span><span class="txt"><span class="lbl">Treat</span><div class="nm">' + esc(x.name) + '</div><div class="mac">' + x.kcal + ' kcal · ' + x.protein + ' g protein</div></span>' + delBtn('data-xdel', i) + '</div>').join('') +
    '<p class="note">Tap the circle when you’ve eaten a meal. Tap Swap to eat something else from your dishes.</p>';
  const again = () => VIEWS['food.meals'](el);
  $$('[data-d]', el).forEach(b => b.onclick = () => { ui.foodDay = +b.dataset.d; again(); });
  $$('[data-k]', el).forEach(b => b.onclick = ev => { toggleMeal(b.dataset.k, ev); again(); });
  $$('[data-c]', el).forEach(b => b.onclick = () => { const i = +b.dataset.c; S.water[sel] = w === i ? i - 1 : i; save(); if (S.water[sel] === 8) celebrate({key:'water-' + sel + '-' + S.start, e:'\u{1F4A7}', title:'8 glasses!', msg:'Fully hydrated. Glowing skin incoming.'}); again(); });
  armDelete(el, 'data-xdel', i => { extras.splice(+i, 1); save(); again(); });
  $('#gymBtn', el).onclick = () => { if (S.gym[sel]) delete S.gym[sel]; else S.gym[sel] = true; save(); again(); };
  $$('[data-swap]', el).forEach(b => b.onclick = () => swapSheet(sel, +b.dataset.swap, again));
  const strp = $('#strip', el), cur = strp.children[sel - 1]; if (cur) requestAnimationFrame(() => strp.scrollTo({left:cur.offsetLeft - strp.clientWidth / 2 + 26}));
};
function swapSheet(day, idx, done){
  const orig = PLAN[day - 1].meals[idx], key = day + '-' + idx, list = allDishes(orig.type).filter(d => d.name !== orig.name);
  sheet('<h2>Swap ' + orig.type.toLowerCase() + '</h2><p class="small muted" style="margin:0;font-weight:700">Plan: ' + esc(orig.name) + ' · ' + orig.kcal + ' kcal</p>' +
    (S.swaps[key] ? '<button class="btn soft full" data-back>Back to the plan</button>' : '') +
    '<div class="list">' + list.map((d, i) => '<button class="dish" data-pick="' + i + '"><span class="t">' + esc(d.name) + (d.custom ? ' <span class="pill">mine</span>' : '') + '</span><span class="m">' + d.kcal + ' kcal · ' + d.protein + ' g</span></button>').join('') + '</div>' +
    '<p class="small muted" style="margin:0">Want something new? Build it in Food › My dishes. Treats from the forbidden corner never show here.</p>',
  (sh, close) => {
    $$('[data-pick]', sh).forEach(b => b.onclick = () => { const d = list[+b.dataset.pick]; S.swaps[key] = {name:d.name, kcal:d.kcal, protein:d.protein}; save(); close(); toast('Swapped ♡'); done(); });
    const bk = $('[data-back]', sh); if (bk) bk.onclick = () => { delete S.swaps[key]; save(); close(); done(); };
  });
}
VIEWS['food.dishes'] = function(el){
  const types = ['Breakfast','Lunch','Snack','Dinner'], ty = ui.dishType, list = allDishes(ty);
  const tot = ui.build.reduce((a, r) => { const ing = INGREDIENTS[r.i], f = ing[1] === 'g' ? r.q / 100 : r.q; a.k += ing[2] * f; a.p += ing[3] * f; return a; }, {k:0, p:0});
  el.innerHTML = '<div class="card tint"><div class="greet">Dishes I love \u{1F37D}\u{FE0F}</div><span class="small muted" style="font-weight:700">Every dish here can be swapped into your plan.</span></div>' +
    '<div class="seg">' + types.map(t => '<button data-ty="' + t + '" aria-pressed="' + (t === ty) + '">' + t + '</button>').join('') + '</div>' +
    '<div class="card"><div class="list">' + list.map(d => '<div class="dish"><span class="t">' + esc(d.name) + (d.custom ? ' <span class="pill">mine</span>' : '') + '</span><span class="m">' + d.kcal + ' kcal · ' + d.protein + ' g' + (d.custom ? delBtn('data-ddel', d.id) : '') + '</span></div>').join('') + '</div></div>' +
    '<div class="card"><h2>Build my own meal</h2>' +
      '<div class="row"><label class="field" style="flex:2 1 170px"><span>Ingredient</span><select class="in" id="bIng">' + INGREDIENTS.map((x, i) => '<option value="' + i + '">' + esc(x[0]) + '</option>').join('') + '</select></label>' +
      '<label class="field" style="flex:1 1 80px"><span id="bUnit">Grams</span><input class="in num" id="bQ" type="number" inputmode="decimal" min="0" value="100"></label><button class="btn" id="bAdd">Add</button></div>' +
      '<div class="list">' + (ui.build.length ? ui.build.map((r, i) => { const ing = INGREDIENTS[r.i], f = ing[1] === 'g' ? r.q / 100 : r.q; return '<div class="item"><span class="num muted" style="font-size:12px">' + r.q + (ing[1] === 'g' ? ' g' : ' ×') + '</span><span class="t">' + esc(ing[0]) + '<span class="s">' + Math.round(ing[2] * f) + ' kcal · ' + (ing[3] * f).toFixed(1) + ' g protein</span></span><button class="del" data-bdel="' + i + '" aria-label="Remove">×</button></div>'; }).join('') : '<div class="empty">Add ingredients to see calories and protein.</div>') + '</div>' +
      '<div class="money3"><div class="mbox"><b>' + Math.round(tot.k) + '</b><span>kcal</span></div><div class="mbox"><b>' + tot.p.toFixed(1) + '</b><span>g protein</span></div><div class="mbox"><b>' + ui.build.length + '</b><span>ingredients</span></div></div>' +
      '<div class="row"><label class="field" style="flex:2 1 160px"><span>Name it</span><input class="in" id="bName" placeholder="My shrimp rice bowl"></label><label class="field" style="flex:1 1 110px"><span>Meal</span><select class="in" id="bType">' + types.concat(['Any']).map(t => '<option' + (t === ty ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></label></div>' +
      '<button class="btn full" id="bSave">Save to my dishes</button></div>';
  const again = () => VIEWS['food.dishes'](el);
  $$('[data-ty]', el).forEach(b => b.onclick = () => { ui.dishType = b.dataset.ty; again(); });
  const unit = () => { const ing = INGREDIENTS[+$('#bIng', el).value]; $('#bUnit', el).textContent = ing[1] === 'g' ? 'Grams' : 'How many'; $('#bQ', el).value = ing[1] === 'g' ? 100 : 1; };
  $('#bIng', el).onchange = unit; unit();
  $('#bAdd', el).onclick = () => { const q = +$('#bQ', el).value; if (!(q > 0)) return toast('Enter an amount'); ui.build.push({i:+$('#bIng', el).value, q}); again(); };
  $$('[data-bdel]', el).forEach(b => b.onclick = () => { ui.build.splice(+b.dataset.bdel, 1); again(); });
  $('#bSave', el).onclick = () => { const name = $('#bName', el).value.trim(); if (!ui.build.length) return toast('Add some ingredients first'); if (!name) return toast('Give your dish a name');
    S.dishes.push({id:uid(), custom:true, type:$('#bType', el).value, name, kcal:Math.round(tot.k), protein:Math.round(tot.p), parts:ui.build.slice()}); ui.build = []; save(); celebrate({key:'dish-first', e:'\u{1F469}‍\u{1F373}', title:'Your first own dish!', msg:name + ' is saved. You can swap it into any day now.'}); toast('Saved to your dishes ♡'); again(); };
  armDelete(el, 'data-ddel', id => { S.dishes = S.dishes.filter(d => d.id !== id); save(); again(); });
};
VIEWS['food.forbidden'] = function(el){
  const day = todayStr(), list = FORBIDDEN.concat(S.forbidden || []);
  const log = Object.keys(S.extras).flatMap(d => (S.extras[d] || []).map(x => Object.assign({d}, x)));
  const month = log.filter(x => x.d.slice(0, 7) === ym(new Date())).length;
  const last = log.map(x => x.d).sort().pop();
  const strong = last ? Math.max(0, Math.round((parseD(day) - parseD(last)) / 864e5)) : null;
  el.innerHTML = '<div class="card forbid"><h2>The forbidden corner</h2><p class="small" style="margin:0;font-weight:700">Treats I love but keep out of my plan. They never show up in swaps. If I have one, I log it honestly and move on kindly.</p>' +
    '<div class="money3"><div class="mbox"><b style="color:var(--mint)">' + (strong == null ? '—' : strong) + '</b><span>days since the last treat</span></div><div class="mbox"><b>' + month + '</b><span>treats this month</span></div><div class="mbox"><b style="color:var(--warn)">\u{1F525}' + streakOf('nosugar') + '</b><span>no-sugar streak</span></div></div></div>' +
    '<div class="card"><div class="list">' + list.map((f, i) => '<div class="fitem"><span class="fe">' + f.e + '</span><span class="t" style="font-weight:800">' + esc(f.name) + '<span class="s" style="display:block;font-size:12px;font-weight:600;color:var(--muted)">' + f.kcal + ' kcal · ' + f.protein + ' g protein' + (f.sugar ? ' · breaks no-sugar' : '') + '</span></span><button class="linkbtn" data-ate="' + i + '" style="background:color-mix(in srgb,var(--danger) 12%,transparent);color:var(--danger)">I had it</button></div>').join('') + '</div></div>' +
    '<div class="card"><h2>Add a forbidden treat</h2><div class="row"><label class="field" style="flex:0 0 64px"><span>Emoji</span><input class="in" id="fE" value="\u{1F369}" maxlength="4" style="text-align:center"></label><label class="field"><span>Treat</span><input class="in" id="fN" placeholder="Kunafa, pizza…"></label></div>' +
      '<div class="row"><label class="field"><span>kcal</span><input class="in num" id="fK" type="number" inputmode="numeric" min="0" placeholder="300"></label><label class="field"><span>Protein (g)</span><input class="in num" id="fP" type="number" inputmode="numeric" min="0" placeholder="5"></label></div>' +
      '<button class="toggle" id="fS"><span class="sw" role="switch" aria-checked="true"></span><span>It’s a sugary treat</span></button><button class="btn full" id="fAdd" style="background:var(--danger)">Add to the forbidden corner</button></div>';
  const again = () => VIEWS['food.forbidden'](el);
  $$('[data-ate]', el).forEach(b => b.onclick = () => { const f = list[+b.dataset.ate];
    sheet('<div style="text-align:center;font-size:54px">' + f.e + '</div><h2 class="plain" style="justify-content:center">Having ' + esc(f.name) + '?</h2><p style="margin:0;text-align:center;font-weight:700" class="muted">That’s about ' + f.kcal + ' kcal' + (f.sugar ? ' and it will reset your no-sugar streak' : '') + '. It’s okay to enjoy it. One treat doesn’t undo your progress; log it and get back on track at the next meal.</p><button class="btn full" data-yes style="background:var(--danger)">Yes, log it</button>', (sh, close) => {
      $('[data-yes]', sh).onclick = () => { (S.extras[day] = S.extras[day] || []).push({name:f.name, e:f.e, kcal:f.kcal, protein:f.protein}); if (f.sugar && habitDone('nosugar', day)) setHabit('nosugar', day, false); save(); close(); toast('Logged. Tomorrow is a fresh start ♡'); again(); };
    });
  });
  let sug = true; $('#fS', el).onclick = () => { sug = !sug; $('#fS .sw', el).setAttribute('aria-checked', sug); };
  $('#fAdd', el).onclick = () => { const n = $('#fN', el).value.trim(); if (!n) return toast('Name the treat'); S.forbidden = S.forbidden || []; S.forbidden.push({name:n, e:$('#fE', el).value.trim() || '\u{1F369}', kcal:+$('#fK', el).value || 0, protein:+$('#fP', el).value || 0, sugar:sug}); save(); again(); };
};
VIEWS['food.month'] = function(el){
  const avgK = Math.round(sum(PLAN, d => d.kcal) / 30), avgP = Math.round(sum(PLAN, d => d.protein) / 30);
  let eaten = 0; Object.keys(S.checks).forEach(k => { if (!k.endsWith('-g')) eaten++; });
  const t = planDayNum(new Date()), C = 2 * Math.PI * 22;
  el.innerHTML = '<div class="money3"><div class="mbox"><b>120</b><span>planned meals</span></div><div class="mbox"><b>' + eaten + '</b><span>meals eaten</span></div><div class="mbox"><b>' + fmt(avgK) + '</b><span>avg kcal a day</span></div></div>' +
    '<div class="card"><div class="cal5">' + PLAN.map(d => { const n = mealsDone(d.day), k = sum(mealsFor(d.day), m => m.kcal); return '<button class="mday' + (d.day === t ? ' today' : '') + '" data-d="' + d.day + '"><svg viewBox="0 0 50 50"><circle class="t" cx="25" cy="25" r="22"/><circle class="p" cx="25" cy="25" r="22" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C - C * n / 4).toFixed(1) + '"/></svg><span class="n">' + d.day + '</span><span class="k">' + fmt(k) + '</span></button>'; }).join('') + '</div></div>' +
    '<p class="note">About ' + avgP + ' g protein a day. Tap a day to open it.</p>';
  $$('[data-d]', el).forEach(b => b.onclick = () => { ui.foodDay = +b.dataset.d; go('food', 'meals'); });
};
VIEWS['food.groc'] = function(el){
  let total = 0, on = 0;
  const html = GROC.map(([cat, items]) => '<div class="list"><h3 style="margin:6px 0 2px">' + esc(cat) + '</h3>' + items.map(([name, qty, use]) => {
    total++; const k = cat + '|' + name, isOn = !!S.groc[k]; if (isOn) on++;
    return '<button class="item' + (isOn ? ' done' : '') + '" data-g="' + esc(k) + '"><span class="tick' + (isOn ? ' on' : '') + '">' + CHECK + '</span><span class="t">' + esc(name) + (use ? '<span class="s">' + esc(use) + '</span>' : '') + '</span><span class="amt muted" style="font-size:13px">' + esc(qty) + '</span></button>';
  }).join('') + '</div>').join('');
  el.innerHTML = '<div class="card"><div class="card-head"><span class="small muted" style="font-weight:800">' + on + ' of ' + total + ' in the basket</span><button class="linkbtn" id="gReset">Clear ticks</button></div><div class="bar good"><i style="width:' + (total ? on / total * 100 : 0) + '%"></i></div></div><div class="card">' + html + '</div><p class="note">Beans, foul, tuna and sardines are canned. Buy fish, shrimp and fruit in two trips.</p>';
  const again = () => VIEWS['food.groc'](el);
  $$('[data-g]', el).forEach(b => b.onclick = () => { const k = b.dataset.g; if (S.groc[k]) delete S.groc[k]; else S.groc[k] = true; save(); if (S.groc[k] && Object.keys(S.groc).length === total) celebrate({key:'groc-' + ym(new Date()), e:'\u{1F6D2}', title:'Groceries done!', msg:'Your whole month is in the basket. Future-you is eating well.'}); again(); });
  $('#gReset', el).onclick = () => { S.groc = {}; save(); again(); };
};
VIEWS['food.tips'] = function(el){
  const tip = (t, l) => '<div class="card"><h2>' + t + '</h2><ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px">' + l.map(x => '<li>' + x + '</li>').join('') + '</ul></div>';
  el.innerHTML = tip('Iron that actually absorbs', ['Eat the guava, orange, mandarin or pomegranate with lunch.','No tea or coffee for 1 hour around meals.','Take iron and vitamin D with lunch, 2 hours away from yogurt, milk and cheese.']) +
    tip('No added sugar', ['Tea with milk, no sugar. No iced coffee, juices or desserts.','Fruit is your sweet treat.','Skip ketchup, BBQ, teriyaki, oyster and sweet chili sauce. Use low-sodium soy sauce, 1 to 2 tbsp per meal.']) +
    tip('Butter, measured', ['1 tsp on eggs and vegetables.','2 tsp in mash or a soup.','Omelets get a small handful (30 g) of mozzarella.']) +
    tip('Gym days', ['Banana, apple or 3 fresh dates 60 to 90 minutes before.','Dinner after the gym is your recovery meal; keep the full protein.']) +
    tip('Supplements', ['Check your Centrum label; most contain iron and vitamin D already. Show the doctor all three labels.','Stop Centrum 2 to 3 days before blood tests; its biotin can distort thyroid results.','10 to 20 minutes of midday sun, 3 to 4 times a week.']);
};

/* ============ MONEY ============ */
function spendRow(s){
  const c = catOf(s.cat);
  return '<div class="item"><span style="font-size:20px">' + c.e + '</span><span class="t">' + (s.store ? '<span class="pill">' + esc(s.store) + '</span>' : '') + esc(s.note || c.name) + '<span class="s">' + nice(s.date) + ' · ' + esc(c.name) + '</span></span><span style="display:flex;align-items:center;gap:4px"><span class="amt">' + fmt(s.amount) + '</span>' + delBtn('data-sdel', s.id) + '</span></div>';
}
function bindSpendDeletes(el, again){ armDelete(el, 'data-sdel', id => { S.spend = S.spend.filter(s => s.id !== id); S.sadaqa = S.sadaqa.filter(x => x.spendId !== id); save(); again(); }); }
VIEWS['money.overview'] = function(el){
  const k = ui.moneyMonth, list = S.spend.filter(s => inMonth(s, k));
  const spent = sum(list, s => s.amount), sal = +S.salary[k] || 0;
  const saved = sum(S.jars.flatMap(j => j.deposits.filter(d => inMonth(d, k))), d => d.amount);
  const by = {}; list.forEach(s => by[s.cat] = (by[s.cat] || 0) + (+s.amount || 0));
  const B = S.settings.budgets || {};
  const cats = CATS.filter(c => by[c.id] || B[c.id]).sort((a, b) => (by[b.id] || 0) - (by[a.id] || 0));
  const inv = S.investDone[k] || {};
  el.innerHTML = monthNav('moneyMonth') +
    '<div class="money3"><div class="mbox"><b>' + fmt(sal) + '</b><span>salary</span></div><div class="mbox"><b>' + fmt(spent) + '</b><span>spent</span></div><div class="mbox"><b style="color:' + (sal - spent - saved < 0 ? 'var(--warn)' : 'var(--mint)') + '">' + fmt(sal - spent - saved) + '</b><span>left after saving</span></div></div>' +
    '<div class="card tint"><h2>This month’s money goals</h2>' +
      '<button class="item" data-inv="invest"><span class="tick' + (inv.invest ? ' on' : '') + '">' + CHECK + '</span><span class="t">Invest ' + (S.settings.invest ? money(S.settings.invest) : 'this month') + '<span class="s">Reminder on the 1st of every month</span></span><span style="font-size:20px">\u{1F4B0}</span></button>' +
      '<button class="item" data-inv="gold"><span class="tick' + (inv.gold ? ' on' : '') + '">' + CHECK + '</span><span class="t">Buy gold<span class="s">Reminder on the 1st of every month</span></span><span style="font-size:20px">✨</span></button>' +
      '<button class="item" data-sub2="savings"><span style="font-size:20px">\u{1FAD9}</span><span class="t">Saved into jars<span class="s">Money › Savings</span></span><span class="amt">' + fmt(saved) + '</span></button></div>' +
    '<div class="card"><div class="card-head"><h2>By category</h2><button class="linkbtn" data-sub2="spend">Add</button></div>' +
      (cats.length ? cats.map(c => { const v = by[c.id] || 0, b = +B[c.id] || 0, pct = b ? Math.min(100, v / b * 100) : 0;
        return '<div class="catrow"><div class="statrow"><span>' + c.e + ' ' + c.name + '</span><span class="num">' + fmt(v) + (b ? ' / ' + fmt(b) : '') + '</span></div>' + (b ? '<div class="bar' + (v > b ? ' over' : ' good') + '"><i style="width:' + pct + '%"></i></div>' : '') + '</div>'; }).join('') : '<div class="empty">No spending logged this month yet.</div>') +
      '<p class="small muted" style="margin:0">Set budgets per category in Me › Settings to see progress bars.</p></div>';
  const again = () => VIEWS['money.overview'](el);
  bindMonthNav(el, 'moneyMonth', again);
  $$('[data-inv]', el).forEach(b => b.onclick = () => { const x = S.investDone[k] = S.investDone[k] || {}; x[b.dataset.inv] = !x[b.dataset.inv]; save();
    if (x[b.dataset.inv]) celebrate({key:'inv-' + b.dataset.inv + '-' + k, e:b.dataset.inv === 'gold' ? '✨' : '\u{1F4B0}', title:b.dataset.inv === 'gold' ? 'Gold bought!' : 'Invested this month!', msg:'Rich-girl habits. Your future self is clapping for you.'});
    again(); });
  $$('[data-sub2]', el).forEach(b => b.onclick = () => go('money', b.dataset.sub2));
};
function spendForm(o){
  const cats = o.cats || CATS;
  return '<div class="card"><h2>' + o.title + '</h2>' +
    '<div class="row"><label class="field" style="flex:1 1 90px"><span>Amount (EGP)</span><input class="in num" id="fAmt" type="number" inputmode="decimal" min="0" placeholder="0"></label><label class="field" style="flex:1 1 130px"><span>Date</span><input class="in" id="fDate" type="date" value="' + todayStr() + '"></label></div>' +
    (o.store ? '<label class="field"><span>Store</span><select class="in" id="fStore">' + STORES.map(s => '<option>' + s + '</option>').join('') + '</select></label>' : '') +
    (cats.length > 1 ? '<label class="field"><span>Category</span><select class="in" id="fCat">' + cats.map(c => '<option value="' + c.id + '">' + c.e + ' ' + c.name + '</option>').join('') + '</select></label>' : '') +
    '<div class="row"><label class="field"><span>' + (o.noteLabel || 'Note') + '</span><input class="in" id="fNote" placeholder="' + (o.notePh || 'What was it?') + '"></label><button class="btn" id="fAdd">Add</button></div></div>';
}
function bindSpendForm(el, o, again){
  $('#fAdd', el).onclick = () => { const amt = +$('#fAmt', el).value; if (!(amt > 0)) return toast('Enter an amount');
    const e = {id:uid(), date:$('#fDate', el).value || todayStr(), amount:amt, cat:o.cat || ($('#fCat', el) ? $('#fCat', el).value : 'other'), note:$('#fNote', el).value.trim()};
    if (o.store) e.store = $('#fStore', el).value; S.spend.push(e); save(); toast('Saved ' + money(amt)); again(); };
}
VIEWS['money.spend'] = function(el){
  const k = ui.moneyMonth, list = S.spend.filter(s => inMonth(s, k)).sort((a, b) => a.date < b.date ? 1 : -1);
  const days = {}; list.forEach(s => (days[s.date] = days[s.date] || []).push(s));
  el.innerHTML = spendForm({title:'Add spending'}) + monthNav('moneyMonth') +
    (list.length ? Object.keys(days).map(d => '<div class="card"><div class="card-head"><h3>' + nice(d) + '</h3><span class="amt">' + money(sum(days[d], s => s.amount)) + '</span></div><div class="list">' + days[d].map(spendRow).join('') + '</div></div>').join('') : '<div class="card"><div class="empty">No spending logged in ' + monthLabel(k) + '.</div></div>');
  const again = () => VIEWS['money.spend'](el);
  bindSpendForm(el, {}, again); bindMonthNav(el, 'moneyMonth', again); bindSpendDeletes(el, again);
};
VIEWS['money.savings'] = function(el){
  const total = sum(S.jars.flatMap(j => j.deposits), d => d.amount);
  el.innerHTML = '<div class="card tint"><span class="small muted" style="font-weight:900">ALL MY JARS</span><div class="greet num">' + money(total) + '</div><span class="small muted" style="font-weight:700">Every jar celebrates you at 25%, 50%, 75% and 100%.</span></div>' +
    S.jars.map(j => { const have = sum(j.deposits, d => d.amount), pct = j.target ? Math.min(100, have / j.target * 100) : 0, lastD = j.deposits[j.deposits.length - 1];
      return '<div class="card"><div class="jar"><div class="jarv"><i style="height:' + pct + '%"></i><span>' + j.e + '</span></div><div style="min-width:0;display:flex;flex-direction:column;gap:6px"><div class="card-head"><b style="font-size:16px">' + esc(j.name) + '</b>' + delBtn('data-jdel', j.id) + '</div>' +
        '<div class="statrow"><span class="num">' + money(have) + '</span><span class="num">' + (j.target ? Math.round(pct) + '% of ' + fmt(j.target) : 'no target') + '</span></div><div class="bar good"><i style="width:' + pct + '%"></i></div></div></div>' +
        '<div class="row"><label class="field"><span>Add to this jar (EGP)</span><input class="in num" data-jamt="' + j.id + '" type="number" inputmode="decimal" min="0" placeholder="0"></label><button class="btn" data-jadd="' + j.id + '">Save</button></div>' +
        (lastD ? '<p class="small muted" style="margin:0">Last: ' + money(lastD.amount) + ' on ' + nice(lastD.date) + ' · ' + j.deposits.length + ' deposits</p>' : '') + '</div>'; }).join('') +
    '<div class="card"><h2>New savings jar</h2><div class="chips">' + JAR_IDEAS.map(([n, e]) => '<button class="chip" data-jidea="' + n + '|' + e + '">' + e + ' ' + n + '</button>').join('') + '</div>' +
      '<div class="row"><label class="field" style="flex:0 0 64px"><span>Emoji</span><input class="in" id="jE" value="\u{1F4B0}" maxlength="4" style="text-align:center"></label><label class="field"><span>Name</span><input class="in" id="jN" placeholder="What are you saving for?"></label></div>' +
      '<label class="field"><span>Target (EGP)</span><input class="in num" id="jT" type="number" inputmode="decimal" min="0" placeholder="Optional"></label><button class="btn full" id="jAdd">Create jar</button></div>';
  const again = () => VIEWS['money.savings'](el);
  $$('[data-jidea]', el).forEach(b => b.onclick = () => { const p = b.dataset.jidea.split('|'); $('#jN', el).value = p[0]; $('#jE', el).value = p[1]; $('#jT', el).focus(); });
  $('#jAdd', el).onclick = () => { const n = $('#jN', el).value.trim(); if (!n) return toast('Name your jar'); S.jars.push({id:uid(), name:n, e:$('#jE', el).value.trim() || '\u{1F4B0}', target:+$('#jT', el).value || 0, deposits:[]}); save(); toast('Jar created \u{1FAD9}'); again(); };
  $$('[data-jadd]', el).forEach(b => b.onclick = () => { const j = S.jars.find(x => x.id === b.dataset.jadd), a = +$('[data-jamt="' + j.id + '"]', el).value; if (!(a > 0)) return toast('Enter an amount');
    const before = sum(j.deposits, d => d.amount); j.deposits.push({id:uid(), date:todayStr(), amount:a}); save();
    const after = before + a, ms = [25, 50, 75, 100].filter(m => j.target && before / j.target * 100 < m && after / j.target * 100 >= m).pop();
    if (ms) celebrate({key:'jar-' + j.id + '-' + ms, e:ms === 100 ? '\u{1F3C6}' : j.e, title:ms === 100 ? j.name + ' jar is full!' : ms + '% of your ' + j.name + ' jar!', msg:ms === 100 ? 'You did it! ' + money(after) + ' saved. Enjoy it, you earned it.' : money(after) + ' saved so far. Every pound is a step closer.'});
    else toast('Saved ' + money(a) + ' \u{1FAD9}');
    again(); });
  armDelete(el, 'data-jdel', id => { S.jars = S.jars.filter(j => j.id !== id); save(); again(); });
};
VIEWS['money.sadaqa'] = function(el){
  const k = ym(new Date()), month = S.sadaqa.filter(s => inMonth(s, k)), tot = sum(S.sadaqa, s => s.amount);
  const list = S.sadaqa.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  el.innerHTML = '<div class="card tint" style="text-align:center;align-items:center"><div style="font-size:44px">\u{1F932}</div><div class="greet">' + S.sadaqa.length + ' times of sadaqa</div><span class="muted" style="font-weight:800">' + money(tot) + ' given in total</span></div>' +
    '<div class="money3"><div class="mbox"><b>' + month.length + '</b><span>times this month</span></div><div class="mbox"><b>' + fmt(sum(month, s => s.amount)) + '</b><span>EGP this month</span></div><div class="mbox"><b>' + (S.sadaqa.length ? fmt(tot / S.sadaqa.length) : 0) + '</b><span>average EGP</span></div></div>' +
    '<div class="card"><h2>Log sadaqa</h2><div class="row"><label class="field"><span>Amount (EGP)</span><input class="in num" id="sdA" type="number" inputmode="decimal" min="0" placeholder="0"></label><label class="field"><span>Date</span><input class="in" id="sdD" type="date" value="' + todayStr() + '"></label></div>' +
      '<div class="row"><label class="field"><span>For</span><input class="in" id="sdN" placeholder="Street animals, a family, the mosque…"></label><button class="btn" id="sdAdd">Give</button></div><p class="small muted" style="margin:0">It’s also added to Spending under Sadaqa & donations.</p></div>' +
    '<div class="card"><div class="list">' + (list.length ? list.map(s => '<div class="item"><span style="font-size:20px">\u{1F49D}</span><span class="t">' + esc(s.note || 'Sadaqa') + '<span class="s">' + nice(s.date) + '</span></span><span style="display:flex;align-items:center;gap:4px"><span class="amt">' + fmt(s.amount) + '</span>' + delBtn('data-sddel', s.id) + '</span></div>').join('') : '<div class="empty">Your first sadaqa will show here.</div>') + '</div></div>';
  const again = () => VIEWS['money.sadaqa'](el);
  $('#sdAdd', el).onclick = ev => { if (addSadaqa(+$('#sdA', el).value, $('#sdN', el).value.trim(), $('#sdD', el).value || todayStr(), ev)) again(); };
  armDelete(el, 'data-sddel', id => { const s = S.sadaqa.find(x => x.id === id); S.sadaqa = S.sadaqa.filter(x => x.id !== id); if (s) S.spend = S.spend.filter(x => x.id !== s.spendId); save(); again(); });
};
VIEWS['money.receipts'] = function(el){
  const k = ui.moneyMonth, list = S.spend.filter(s => inMonth(s, k) && s.store).sort((a, b) => a.date < b.date ? 1 : -1);
  const per = {}; list.forEach(s => per[s.store] = (per[s.store] || 0) + (+s.amount || 0));
  el.innerHTML = spendForm({title:'Add an order receipt', store:true, cats:[catOf('delivery'), catOf('food'), catOf('selfcare'), catOf('shopping'), catOf('pets'), catOf('other')], noteLabel:'What did I order', notePh:'Groceries, lotion, lip gloss…'}) + monthNav('moneyMonth') +
    '<div class="money3">' + ['Talabat','Noon','Amazon'].map(s => '<div class="mbox"><b>' + fmt(per[s] || 0) + '</b><span>' + s + '</span></div>').join('') + '</div>' +
    '<div class="card"><div class="list">' + (list.length ? list.map(spendRow).join('') : '<div class="empty">No orders logged in ' + monthLabel(k) + '.</div>') + '</div></div>';
  const again = () => VIEWS['money.receipts'](el);
  bindSpendForm(el, {store:true}, again); bindMonthNav(el, 'moneyMonth', again); bindSpendDeletes(el, again);
};
VIEWS['money.salary'] = function(el){
  const now = new Date(), months = [];
  for (let i = -1; i < 11; i++) months.push(ym(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  const year = String(now.getFullYear()), ytd = sum(Object.keys(S.salary).filter(k => k.startsWith(year)), k => S.salary[k]);
  el.innerHTML = '<div class="card tint"><span class="small muted" style="font-weight:900">SALARY IN ' + year + '</span><div class="greet num">' + money(ytd) + '</div></div>' +
    '<div class="card"><h2>Monthly salary</h2><div class="list">' + months.map(k => '<div class="item"><span style="font-size:18px">\u{1F4B5}</span><span class="t">' + monthLabel(k) + '</span><input class="in num" data-sal="' + k + '" type="number" inputmode="decimal" min="0" placeholder="0" value="' + esc(S.salary[k] || '') + '" style="width:120px;text-align:right" aria-label="Salary for ' + monthLabel(k) + '"></div>').join('') + '</div><p class="small muted" style="margin:0">Include bonuses in the month you received them.</p></div>';
  $$('[data-sal]', el).forEach(i => i.onchange = () => { const v = +i.value; if (v > 0) S.salary[i.dataset.sal] = v; else delete S.salary[i.dataset.sal]; save(); toast('Salary saved'); VIEWS['money.salary'](el); });
};
VIEWS['money.pets'] = function(el){
  const k = ui.moneyMonth, list = S.spend.filter(s => inMonth(s, k) && s.cat === 'pets').sort((a, b) => a.date < b.date ? 1 : -1);
  el.innerHTML = '<div class="card tint"><div class="greet">Toto & street friends \u{1F43E}</div><span class="small muted" style="font-weight:700">Cat food, chicken liver, vet visits, dry food for street cats and dogs</span></div>' +
    spendForm({title:'Add a pet expense', cats:[catOf('pets')], notePh:'Cat food for Toto, dry food for street cats…'}) + monthNav('moneyMonth') +
    '<div class="card"><div class="card-head"><h3>Total</h3><span class="amt">' + money(sum(list, s => s.amount)) + '</span></div><div class="list">' + (list.length ? list.map(spendRow).join('') : '<div class="empty">No pet expenses in ' + monthLabel(k) + '.</div>') + '</div></div>';
  const again = () => VIEWS['money.pets'](el);
  bindSpendForm(el, {cat:'pets'}, again); bindMonthNav(el, 'moneyMonth', again); bindSpendDeletes(el, again);
};

/* ============ PLANS ============ */
const PRIO = {urgent:{l:'\u{1F6A8} Urgent', c:'urgent'}, high:{l:'⚠\u{FE0F} Important', c:'high'}, normal:{l:'Normal', c:''}};
VIEWS['plans.tasks'] = function(el){
  const t = todayStr(), order = {urgent:0, high:1, normal:2};
  const block = (kind, title, ph) => {
    const items = S.tasks.filter(x => x.kind === kind).sort((a, b) => (a.done - b.done) || (order[a.prio || 'normal'] - order[b.prio || 'normal']) || ((a.due || '9') < (b.due || '9') ? -1 : 1));
    return '<div class="card"><h2>' + title + '</h2><label class="field"><input class="in" data-tin="' + kind + '" placeholder="' + ph + '" aria-label="New task"></label>' +
      '<div class="row"><label class="field"><span>Priority</span><select class="in" data-tprio="' + kind + '"><option value="normal">Normal</option><option value="high">⚠\u{FE0F} Important</option><option value="urgent">\u{1F6A8} Urgent</option></select></label><label class="field"><span>Due</span><input class="in" type="date" data-tdue="' + kind + '"></label><label class="field" style="flex:1 1 90px"><span>By</span><input class="in" type="time" data-ttime="' + kind + '"></label></div>' +
      '<button class="btn full" data-tadd="' + kind + '">Add task</button>' +
      '<div class="list">' + (items.length ? items.map(x => '<div class="item' + (x.done ? ' done' : '') + '"><button class="tick' + (x.done ? ' on' : '') + '" data-tdone="' + x.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + (x.prio && x.prio !== 'normal' && !x.done ? '<span class="pill ' + PRIO[x.prio].c + '">' + PRIO[x.prio].l + '</span>' : '') + esc(x.title) + (x.due ? '<span class="s" style="' + (!x.done && x.due < t ? 'color:var(--danger);font-weight:900' : '') + '">' + (!x.done && x.due < t ? 'Overdue · ' : 'Due ') + nice(x.due) + (x.time ? ' · by ' + x.time : '') + '</span>' : '') + '</span>' + delBtn('data-tdel', x.id) + '</div>').join('') : '<div class="empty">Nothing here yet.</div>') + '</div></div>';
  };
  el.innerHTML = block('work', 'Work tasks \u{1F4BC}', 'Lenme post, BIB report…') + block('personal', 'My to-dos ✅', 'Call the clinic, pay a bill…') +
    '<p class="note">\u{1F6A8} Urgent tasks sit at the top of Today and remind you the evening before, at 9:00 on the day and 1 hour before the deadline. Important ones remind you the evening before.</p>' +
    (S.tasks.some(x => x.done) ? '<button class="btn soft full" id="tClear">Clear finished tasks</button>' : '');
  const again = () => VIEWS['plans.tasks'](el);
  $$('[data-tadd]', el).forEach(b => b.onclick = () => { const k = b.dataset.tadd, v = $('[data-tin="' + k + '"]', el).value.trim(); if (!v) return toast('Write the task');
    S.tasks.push({id:uid(), title:v, kind:k, prio:$('[data-tprio="' + k + '"]', el).value, due:$('[data-tdue="' + k + '"]', el).value, time:$('[data-ttime="' + k + '"]', el).value, done:false}); save(); again(); });
  $$('[data-tin]', el).forEach(i => i.onkeydown = e => { if (e.key === 'Enter') $('[data-tadd="' + i.dataset.tin + '"]', el).click(); });
  $$('[data-tdone]', el).forEach(b => b.onclick = ev => { const x = S.tasks.find(y => y.id === b.dataset.tdone); x.done = !x.done; x.doneOn = x.done ? t : ''; if (x.done){ hearts(ev.clientX, ev.clientY); if (x.prio === 'urgent') toast('Urgent task done! Breathe out ♡'); } save(); again(); });
  armDelete(el, 'data-tdel', id => { S.tasks = S.tasks.filter(x => x.id !== id); save(); again(); });
  const c = $('#tClear', el); if (c) c.onclick = () => { S.tasks = S.tasks.filter(x => !x.done); save(); again(); };
};
VIEWS['plans.mashawer'] = function(el){
  const t = todayStr();
  const up = S.mashawer.filter(m => !m.done).sort((a, b) => (a.date + (a.time || '')) < (b.date + (b.time || '')) ? -1 : 1);
  const done = S.mashawer.filter(m => m.done).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 15);
  const row = m => '<div class="item' + (m.done ? ' done' : '') + '"><button class="tick' + (m.done ? ' on' : '') + '" data-mdone="' + m.id + '" aria-label="Mark done">' + CHECK + '</button><span class="t">' + esc(m.name) + '<span class="s">' + (m.date ? nice(m.date) : 'No date') + (m.time ? ' · ' + m.time : '') + (m.date && m.date < t && !m.done ? ' · missed' : '') + (m.remind !== false && !m.done ? ' · \u{1F514} day before' : '') + '</span>' + (m.note ? '<span class="s" style="color:var(--ink);font-weight:600">' + esc(m.note) + '</span>' : '') + '</span>' + delBtn('data-mdel', m.id) + '</div>';
  el.innerHTML = '<div class="card"><h2>New meshwar</h2><label class="field"><span>Where</span><input class="in" id="pName" placeholder="Bank, tailor, mall, clinic…"></label>' +
    '<div class="row"><label class="field"><span>Day</span><input class="in" id="pDate" type="date" value="' + t + '"></label><label class="field"><span>Time</span><input class="in" id="pTime" type="time" value="12:00"></label></div>' +
    '<label class="field"><span>Note</span><input class="in" id="pNote" placeholder="What to bring or do there"></label>' +
    '<button class="toggle" id="pRem"><span class="sw" role="switch" aria-checked="true"></span><span>Remind me a day before</span></button><button class="btn full" id="pAdd">Add meshwar</button></div>' +
    '<div class="card"><h2>Coming up</h2><div class="list">' + (up.length ? up.map(row).join('') : '<div class="empty">No mashawer planned.</div>') + '</div></div>' +
    (done.length ? '<div class="card"><h2>Done</h2><div class="list">' + done.map(row).join('') + '</div></div>' : '');
  const again = () => VIEWS['plans.mashawer'](el);
  let rem = true; $('#pRem', el).onclick = () => { rem = !rem; $('#pRem .sw', el).setAttribute('aria-checked', rem); };
  $('#pAdd', el).onclick = () => { const name = $('#pName', el).value.trim(); if (!name) return toast('Where are you going?');
    S.mashawer.push({id:uid(), name, date:$('#pDate', el).value, time:$('#pTime', el).value, note:$('#pNote', el).value.trim(), remind:rem, done:false}); save(); toast(rem ? 'Added. I’ll remind you a day before.' : 'Meshwar added'); again(); };
  $$('[data-mdone]', el).forEach(b => b.onclick = ev => { const m = S.mashawer.find(x => x.id === b.dataset.mdone); m.done = !m.done; m.doneOn = m.done ? t : '';
    if (m.done){ hearts(ev.clientX, ev.clientY); const a = S.daylog[t] = S.daylog[t] || []; if (!a.includes('meshwar')) a.push('meshwar'); } save(); again(); });
  armDelete(el, 'data-mdel', id => { S.mashawer = S.mashawer.filter(m => m.id !== id); save(); again(); });
};
VIEWS['plans.exp'] = function(el){
  const up = S.exp.filter(x => !x.done), done = S.exp.filter(x => x.done), pickWho = [];
  const row = x => '<div class="item' + (x.done ? ' done' : '') + '"><button class="tick' + (x.done ? ' on' : '') + '" data-xdone="' + x.id + '" aria-label="Done">' + CHECK + '</button><span class="t">' + esc(x.title) + (x.with && x.with.length ? '<span class="s who">with ' + esc(x.with.join(', ')) + '</span>' : '') + '<span class="s">' + (x.date ? nice(x.date) : 'Someday') + (x.where ? ' · ' + esc(x.where) : '') + '</span>' + (x.memory ? '<span class="s" style="color:var(--ink);font-weight:600">\u{1F4AD} ' + esc(x.memory) + '</span>' : '') + '</span>' + delBtn('data-xdel', x.id) + '</div>';
  el.innerHTML = '<div class="card tint"><div class="greet">New experiences ✨</div><span class="small muted" style="font-weight:700">Places to go and things to try, and who to share them with.</span></div>' +
    '<div class="card"><h2>Add an experience</h2><div class="chips">' + EXP_IDEAS.map(i => '<button class="chip" data-idea="' + esc(i) + '">' + esc(i) + '</button>').join('') + '</div>' +
      '<label class="field"><span>What</span><input class="in" id="xT" placeholder="Try ice skating, visit a new museum…"></label>' +
      '<div class="row"><label class="field"><span>Where</span><input class="in" id="xW" placeholder="Optional"></label><label class="field"><span>When</span><input class="in" id="xD" type="date"></label></div>' +
      '<div class="field"><span>With whom</span><div class="chips">' + WHO.map(w => '<button class="chip" data-who="' + esc(w) + '">' + esc(w) + '</button>').join('') + '</div></div>' +
      '<button class="btn full" id="xAdd">Add to my list</button></div>' +
    '<div class="card"><h2>Waiting for me</h2><div class="list">' + (up.length ? up.map(row).join('') : '<div class="empty">Add your first new experience.</div>') + '</div></div>' +
    (done.length ? '<div class="card"><h2>Lived it \u{1F496}</h2><div class="list">' + done.map(row).join('') + '</div></div>' : '');
  const again = () => VIEWS['plans.exp'](el);
  $$('[data-idea]', el).forEach(b => b.onclick = () => { $('#xT', el).value = b.dataset.idea; });
  $$('[data-who]', el).forEach(b => b.onclick = () => { const w = b.dataset.who, i = pickWho.indexOf(w); if (i >= 0) pickWho.splice(i, 1); else pickWho.push(w); b.classList.toggle('on'); });
  $('#xAdd', el).onclick = () => { const t = $('#xT', el).value.trim(); if (!t) return toast('What do you want to experience?'); S.exp.push({id:uid(), title:t, where:$('#xW', el).value.trim(), date:$('#xD', el).value, with:pickWho.slice(), done:false, memory:''}); save(); toast('Added ✨'); again(); };
  $$('[data-xdone]', el).forEach(b => b.onclick = () => { const x = S.exp.find(y => y.id === b.dataset.xdone);
    if (x.done){ x.done = false; x.doneOn = ''; save(); return again(); }
    sheet('<h2>You did it: ' + esc(x.title) + '!</h2><label class="field"><span>A little memory to keep</span><textarea class="in" data-mem placeholder="How was it? What made it special?"></textarea></label><button class="btn full" data-ok>Save the memory</button>', (sh, close) => {
      $('[data-ok]', sh).onclick = () => { x.done = true; x.doneOn = todayStr(); x.memory = $('[data-mem]', sh).value.trim(); save(); close(); celebrate({key:'exp-' + x.id, e:'\u{1F308}', title:'New experience unlocked!', msg:x.title + (x.with && x.with.length ? ' with ' + x.with.join(', ') : '') + '. Life is for living, and you’re living it.'}); again(); };
    }); });
  armDelete(el, 'data-xdel', id => { S.exp = S.exp.filter(x => x.id !== id); save(); again(); });
};
function setupSelfcare(k){
  const first = parseD(k + '-01'), today = new Date(); today.setHours(0,0,0,0);
  const startDay = (ym(today) === k) ? Math.max(today.getDate() + 1, 2) : 2;
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const step = Math.max(1, Math.floor((last - startDay + 1) / SELFCARE.length));
  return SELFCARE.map((s, i) => ({id:uid(), name:s.name, e:s.e, price:'', planned:ymd(new Date(first.getFullYear(), first.getMonth(), startDay + i * step)), done:'', spendId:''}));
}
VIEWS['plans.selfcare'] = function(el){
  const k = ui.scMonth, list = S.selfcare[k];
  const total = sum(list || [], s => s.price), paid = sum((list || []).filter(s => s.done), s => s.price), dn = (list || []).filter(s => s.done).length;
  el.innerHTML = monthNav('scMonth') +
    (!list ? '<div class="card tint"><div class="greet">Your self-care month \u{1F338}</div><p class="small muted" style="margin:0;font-weight:700">Set up ' + monthLabel(k) + ' with your 8 sessions, each on its own day. Change any date or price after.</p><button class="btn full" id="scSetup">Set up ' + MONTHS_L[parseD(k + '-01').getMonth()] + '</button></div>' :
    '<div class="money3"><div class="mbox"><b>' + dn + '/' + list.length + '</b><span>sessions done</span></div><div class="mbox"><b>' + fmt(total) + '</b><span>planned EGP</span></div><div class="mbox"><b>' + fmt(paid) + '</b><span>spent EGP</span></div></div>' +
    '<div class="card"><div class="list">' + list.map(s => '<div class="sc' + (s.done ? ' done' : '') + '"><span class="em">' + s.e + '</span><div style="min-width:0"><div class="nm">' + esc(s.name) + '</div>' +
      '<div class="fields"><label class="field"><span>Price</span><input class="in num" type="number" inputmode="decimal" min="0" data-scf="price" data-id="' + s.id + '" value="' + esc(s.price) + '" placeholder="EGP"></label>' +
      '<label class="field"><span>Planned</span><input class="in" type="date" data-scf="planned" data-id="' + s.id + '" value="' + esc(s.planned) + '"></label>' +
      '<label class="field"><span>Done on</span><input class="in" type="date" data-scf="done" data-id="' + s.id + '" value="' + esc(s.done) + '"></label></div></div>' + delBtn('data-scdel', s.id) + '</div>').join('') + '</div>' +
      '<p class="small muted" style="margin:0">\u{1F514} Reminder the evening before each planned date. A done date adds the price to Money › Self-care.</p></div>' +
    '<div class="card"><h2>Add another session</h2><div class="row"><label class="field" style="flex:0 0 64px"><span>Emoji</span><input class="in" id="scE" value="\u{1F33F}" maxlength="4" style="text-align:center"></label><label class="field"><span>Service</span><input class="in" id="scN" placeholder="Facial, nails, massage…"></label><button class="btn" id="scAdd">Add</button></div></div>');
  const again = () => VIEWS['plans.selfcare'](el);
  bindMonthNav(el, 'scMonth', again);
  if (!list){ $('#scSetup', el).onclick = () => { S.selfcare[k] = setupSelfcare(k); save(); toast('Your month is set ♡'); again(); }; return; }
  $$('[data-scf]', el).forEach(i => i.onchange = () => {
    const s = list.find(x => x.id === i.dataset.id), f = i.dataset.scf, wasDone = !!s.done; s[f] = f === 'price' ? (+i.value || '') : i.value;
    S.spend = S.spend.filter(x => x.id !== s.spendId); s.spendId = '';
    if (s.done && +s.price > 0){ s.spendId = uid(); S.spend.push({id:s.spendId, date:s.done, amount:+s.price, cat:'selfcare', note:s.e + ' ' + s.name}); }
    save();
    if (f === 'done' && s.done && !wasDone){ if (list.every(x => x.done)) celebrate({key:'sc-all-' + k, e:'\u{1F451}', title:'Self-care month complete!', msg:'All ' + list.length + ' sessions done. You invested in you.'}); else toast(s.e + ' Logged. Glowing! ♡'); }
    again(); });
  armDelete(el, 'data-scdel', id => { const s = list.find(x => x.id === id); if (s && s.spendId) S.spend = S.spend.filter(x => x.id !== s.spendId); S.selfcare[k] = list.filter(x => x.id !== id); save(); again(); });
  $('#scAdd', el).onclick = () => { const n = $('#scN', el).value.trim(); if (!n) return toast('Name the service'); list.push({id:uid(), name:n, e:$('#scE', el).value.trim() || '\u{1F33F}', price:'', planned:'', done:'', spendId:''}); save(); again(); };
};
VIEWS['plans.shop'] = function(el){
  const items = S.shop.slice().sort((a, b) => a.done - b.done);
  el.innerHTML = '<div class="card"><h2>Shopping list \u{1F6D2}</h2><div class="row"><label class="field"><input class="in" id="shIn" placeholder="Add an item" aria-label="Item"></label><button class="btn" id="shAdd">Add</button></div>' +
    '<div class="list">' + (items.length ? items.map(x => '<div class="item' + (x.done ? ' done' : '') + '"><button class="tick' + (x.done ? ' on' : '') + '" data-shd="' + x.id + '" aria-label="Got it">' + CHECK + '</button><span class="t">' + esc(x.name) + '</span>' + delBtn('data-shdel', x.id) + '</div>').join('') : '<div class="empty">Your list is empty.</div>') + '</div>' +
    (S.shop.some(x => x.done) ? '<button class="btn soft full" id="shClear">Remove ticked items</button>' : '') + '</div><p class="note">Your monthly food groceries are in Food › Groceries.</p>';
  const again = () => VIEWS['plans.shop'](el);
  const add = () => { const v = $('#shIn', el).value.trim(); if (!v) return; S.shop.push({id:uid(), name:v, done:false}); save(); again(); setTimeout(() => { const i = $('#shIn'); if (i) i.focus(); }, 0); };
  $('#shAdd', el).onclick = add; $('#shIn', el).onkeydown = e => { if (e.key === 'Enter') add(); };
  $$('[data-shd]', el).forEach(b => b.onclick = () => { const x = S.shop.find(y => y.id === b.dataset.shd); x.done = !x.done; save(); again(); });
  armDelete(el, 'data-shdel', id => { S.shop = S.shop.filter(x => x.id !== id); save(); again(); });
  const c = $('#shClear', el); if (c) c.onclick = () => { S.shop = S.shop.filter(x => !x.done); save(); again(); };
};
VIEWS['plans.vision'] = function(el){
  el.innerHTML = '<div class="card tint"><div class="greet">Things I wish for ✦</div><span class="small muted" style="font-weight:700">Dream big. Tap a card when it comes true.</span></div>' +
    '<div class="vgrid">' + (S.vision.length ? S.vision.map((v, i) => '<div class="vcard' + (v.done ? ' got' : '') + '" style="background:' + VCOL[i % VCOL.length] + '"><span class="ve">' + v.e + '</span><span class="vt">' + esc(v.title) + '</span>' + (v.note ? '<span class="vn">' + esc(v.note) + '</span>' : '') + '<div class="vact"><button class="linkbtn" data-vdone="' + v.id + '">' + (v.done ? 'Not yet' : 'It came true') + '</button><button class="del" data-vdel="' + v.id + '" aria-label="Delete" style="color:#7a4a5e">×</button></div></div>').join('') : '<div class="card" style="grid-column:1/-1"><div class="empty">Add your first wish below.</div></div>') + '</div>' +
    '<div class="card"><h2>Add a wish</h2>' + emoPicker(ui.vEmo, 'data-ve') + '<label class="field"><span>I wish for</span><input class="in" id="vT" placeholder="My own car, a trip to Italy…"></label><label class="field"><span>Why it matters or how</span><input class="in" id="vN" placeholder="Optional"></label><button class="btn full" id="vAdd">Add to my board</button></div>';
  const again = () => VIEWS['plans.vision'](el);
  bindEmo(el, 'data-ve', e => { ui.vEmo = e; });
  $('#vAdd', el).onclick = () => { const t = $('#vT', el).value.trim(); if (!t) return toast('Write your wish'); S.vision.push({id:uid(), title:t, note:$('#vN', el).value.trim(), e:ui.vEmo, done:false}); save(); again(); };
  $$('[data-vdone]', el).forEach(b => b.onclick = () => { const v = S.vision.find(x => x.id === b.dataset.vdone); v.done = !v.done; save(); if (v.done) celebrate({key:'vis-' + v.id, e:v.e, title:'A wish came true!', msg:v.title + '. You dreamed it and worked for it. Mabrouk, Monmon!'}); again(); });
  armDelete(el, 'data-vdel', id => { S.vision = S.vision.filter(v => v.id !== id); save(); again(); });
};

/* ============ GROW ============ */
function growView(kind){ return function(el){
  const list = S.skills.filter(s => s.kind === kind), isSkill = kind === 'skill', defE = isSkill ? '\u{1F4C8}' : '\u{1F3A8}';
  el.innerHTML = '<div class="card tint"><div class="greet">' + (isSkill ? 'Skills I’m mastering \u{1F4DA}' : 'Hobbies I’m learning \u{1F3A8}') + '</div><span class="small muted" style="font-weight:700">Log each practice session, move the slider as you grow, and keep your next step clear.</span></div>' +
    (list.length ? '<div class="card"><div class="list">' + list.map(s => '<div class="grow"><div class="gh"><span class="ge">' + s.e + '</span><span style="min-width:0"><span class="gn">' + esc(s.name) + '</span><span class="small muted" style="display:block;font-weight:700">' + (s.sessions || 0) + ' sessions · ' + (s.progress || 0) + '%</span></span>' + delBtn('data-gdel', s.id) + '</div>' +
      '<input class="range" type="range" min="0" max="100" step="5" value="' + (s.progress || 0) + '" data-gp="' + s.id + '" aria-label="Progress for ' + esc(s.name) + '">' +
      '<label class="field"><span>Next step</span><input class="in" data-gnext="' + s.id + '" value="' + esc(s.next || '') + '" placeholder="The very next thing to do"></label>' +
      '<label class="field"><span>Notes and resources</span><textarea class="in" data-gnotes="' + s.id + '" placeholder="Courses, links, what I learned…" style="min-height:52px">' + esc(s.notes || '') + '</textarea></label>' +
      '<button class="btn soft" data-gsess="' + s.id + '">+ I practiced today</button></div>').join('') + '</div></div>' : '') +
    '<div class="card"><h2>Add a ' + (isSkill ? 'skill' : 'hobby') + '</h2>' + emoPicker(ui.gEmo || defE, 'data-ge') + '<label class="field"><span>Name</span><input class="in" id="gN" placeholder="' + (isSkill ? 'SEO, Meta ads, copywriting…' : 'Painting, belly dancing, crochet…') + '"></label><button class="btn full" id="gAdd">Add</button></div>';
  const again = () => VIEWS['grow.' + (isSkill ? 'skills' : 'hobbies')](el);
  bindEmo(el, 'data-ge', e => { ui.gEmo = e; });
  $('#gAdd', el).onclick = () => { const n = $('#gN', el).value.trim(); if (!n) return toast('Name it'); S.skills.push({id:uid(), kind, name:n, e:ui.gEmo || defE, progress:0, next:'', notes:'', sessions:0}); ui.gEmo = null; save(); again(); };
  $$('[data-gp]', el).forEach(r => r.onchange = () => { const s = S.skills.find(x => x.id === r.dataset.gp), before = s.progress || 0; s.progress = +r.value; save();
    const ms = [25, 50, 75, 100].filter(m => before < m && s.progress >= m).pop();
    if (ms) celebrate({key:'grow-' + s.id + '-' + ms, e:ms === 100 ? '\u{1F393}' : s.e, title:ms === 100 ? 'You mastered ' + s.name + '!' : s.name + ': ' + ms + '% there!', msg:ms === 100 ? 'From curious to confident. Time to show it off.' : 'Keep going. Every session builds on the last.'});
    again(); });
  $$('[data-gnext]', el).forEach(i => i.onchange = () => { S.skills.find(x => x.id === i.dataset.gnext).next = i.value; save(); });
  $$('[data-gnotes]', el).forEach(i => i.oninput = () => { S.skills.find(x => x.id === i.dataset.gnotes).notes = i.value; save(); });
  $$('[data-gsess]', el).forEach(b => b.onclick = ev => { const s = S.skills.find(x => x.id === b.dataset.gsess); s.sessions = (s.sessions || 0) + 1; save(); hearts(ev.clientX, ev.clientY);
    if ([1, 5, 10, 25, 50, 100].includes(s.sessions)) celebrate({key:'sess-' + s.id + '-' + s.sessions, e:s.e, title:s.sessions === 1 ? 'First session of ' + s.name + '!' : s.sessions + ' sessions of ' + s.name + '!', msg:'Practice is how talent is made. Proud of you.'});
    else toast(s.e + ' Session logged!'); again(); });
  armDelete(el, 'data-gdel', id => { S.skills = S.skills.filter(x => x.id !== id); save(); again(); });
}; }
VIEWS['grow.skills'] = growView('skill');
VIEWS['grow.hobbies'] = growView('hobby');

/* ============ ME ============ */
VIEWS['me.days'] = function(el){
  const d = ui.dayView, t = todayStr();
  const diary = S.diary[d] || {}, qa = S.qa[d] || {}, logs = S.daylog[d] || [], media = S.media[d] || {};
  const habits = S.habits.filter(h => habitDone(h.id, d));
  const spends = S.spend.filter(s => s.date === d), sad = S.sadaqa.filter(s => s.date === d);
  const n = planDayNum(parseD(d)), inPlan = n >= 1 && n <= 30;
  const meals = inPlan ? mealsFor(n).filter((m, i) => S.checks[n + '-' + i]) : [];
  const extras = S.extras[d] || [];
  const kcal = sum(meals, m => m.kcal) + sum(extras, x => x.kcal);
  const doneTasks = S.tasks.filter(x => x.doneOn === d), doneM = S.mashawer.filter(x => x.doneOn === d), doneX = S.exp.filter(x => x.doneOn === d);
  const answered = Object.keys(qa).filter(q => qa[q]);
  const sec = (title, body) => '<div style="display:flex;flex-direction:column;gap:6px"><h3>' + title + '</h3>' + body + '</div>';
  const parts = [];
  if (logs.length) parts.push(sec('What I did', '<div class="chips">' + logs.map(id => { const x = DAYLOG.find(y => y.id === id); return x ? '<span class="chip on" style="cursor:default">' + x.e + ' ' + x.name + '</span>' : ''; }).join('') + '</div>'));
  if (habits.length) parts.push(sec('Habits', '<div style="font-size:22px;letter-spacing:4px">' + habits.map(h => h.e).join('') + '</div>'));
  if (meals.length || extras.length) parts.push(sec('Ate', '<div class="list">' + meals.map(m => '<div class="item"><span>\u{1F37D}\u{FE0F}</span><span class="t">' + esc(m.name) + '</span><span class="amt muted" style="font-size:12px">' + m.kcal + '</span></div>').join('') + extras.map(x => '<div class="item"><span>' + x.e + '</span><span class="t">' + esc(x.name) + '</span><span class="amt muted" style="font-size:12px">' + x.kcal + '</span></div>').join('') + '</div>'));
  if (spends.length) parts.push(sec('Spent', '<div class="list">' + spends.map(s => '<div class="item"><span>' + catOf(s.cat).e + '</span><span class="t">' + esc(s.note || catOf(s.cat).name) + '</span><span class="amt">' + fmt(s.amount) + '</span></div>').join('') + '</div>'));
  if (sad.length) parts.push(sec('Sadaqa', '<p style="margin:0;font-weight:700">\u{1F49D} ' + money(sum(sad, s => s.amount)) + '</p>'));
  if (media.pages || media.episode) parts.push(sec('Read & listened', '<p style="margin:0;font-weight:700">' + (media.pages ? '\u{1F4D6} ' + media.pages + ' pages' + (media.book ? ' of ' + esc(media.book) : '') : '') + (media.pages && media.episode ? '<br>' : '') + (media.episode ? '\u{1F3A7} ' + esc(media.episode) : '') + '</p>'));
  if (doneTasks.length || doneM.length || doneX.length) parts.push(sec('Finished', '<div class="list">' + doneTasks.map(x => '<div class="item"><span>✅</span><span class="t">' + esc(x.title) + '</span><span></span></div>').join('') + doneM.map(x => '<div class="item"><span>\u{1F4CD}</span><span class="t">' + esc(x.name) + '</span><span></span></div>').join('') + doneX.map(x => '<div class="item"><span>✨</span><span class="t">' + esc(x.title) + '</span><span></span></div>').join('') + '</div>'));
  if (diary.summary) parts.push(sec('Summary', '<p style="margin:0;white-space:pre-wrap">' + esc(diary.summary) + '</p>'));
  if (diary.feelings) parts.push(sec('Feelings', '<p style="margin:0;white-space:pre-wrap">' + esc(diary.feelings) + '</p>'));
  if (answered.length) parts.push(sec('Reflections', answered.map(q => '<p style="margin:0"><b>' + esc(QUESTIONS[q]) + '</b><br>' + esc(qa[q]) + '</p>').join('')));
  el.innerHTML = '<div class="monthnav"><button data-dv="-1" aria-label="Previous day">‹</button><b style="font-size:18px">' + (d === t ? 'Today, ' : '') + nice(d) + '</b><button data-dv="1" aria-label="Next day"' + (d >= t ? ' disabled style="opacity:.3"' : '') + '>›</button></div>' +
    '<div class="card tint"><div class="card-head"><div class="greet">My day</div><span style="font-size:34px">' + (diary.mood ? MOODS[diary.mood - 1].e : '') + '</span></div>' +
      '<div class="stats3"><div class="stat"><b>' + habits.length + '</b><span>habits</span></div><div class="stat"><b>' + fmt(kcal) + '</b><span>kcal eaten</span></div><div class="stat"><b>' + fmt(sum(spends, s => s.amount)) + '</b><span>EGP spent</span></div></div></div>' +
    '<div class="card">' + (parts.length ? parts.join('') : '<div class="empty">Nothing logged for this day yet.</div>') +
      '<label class="field"><span>Notes and draft for this day</span><textarea class="in" id="dvNote" placeholder="Write anything about this day…">' + esc(S.notes[d] || '') + '</textarea></label></div>';
  $$('[data-dv]', el).forEach(b => b.onclick = () => { const nd = addDays(ui.dayView, +b.dataset.dv); if (nd > t) return; ui.dayView = nd; VIEWS['me.days'](el); });
  $('#dvNote', el).oninput = e => { S.notes[d] = e.target.value; save(); };
};
VIEWS['me.diary'] = function(el){
  const k = ui.diaryMonth, first = parseD(k + '-01'), last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7, t = todayStr();
  let cells = ''; ['M','T','W','T','F','S','S'].forEach(x => cells += '<div class="cday blank muted" style="font-weight:900">' + x + '</div>');
  for (let i = 0; i < lead; i++) cells += '<div class="cday blank"></div>';
  for (let d = 1; d <= last; d++){ const key = k + '-' + pad(d), m = S.diary[key] && S.diary[key].mood; cells += '<button class="cday' + (key === t ? ' today' : '') + '" data-day="' + key + '" aria-label="' + nice(key) + '">' + (m ? '<span class="e">' + MOODS[m - 1].e + '</span>' : '<span class="muted">' + d + '</span>') + '</button>'; }
  const entries = Object.keys(S.diary).filter(d => d.slice(0, 7) === k && (S.diary[d].summary || S.diary[d].feelings || S.diary[d].mood)).sort().reverse();
  const counts = [0,0,0,0,0]; entries.forEach(d => { const m = S.diary[d].mood; if (m) counts[m - 1]++; });
  el.innerHTML = monthNav('diaryMonth') + '<div class="card"><h2>Mood calendar</h2><div class="cal">' + cells + '</div><div class="chips" style="justify-content:center">' + MOODS.map((m, i) => '<span class="chip" style="cursor:default">' + m.e + ' <span class="cnt">' + counts[i] + '</span></span>').join('') + '</div><p class="small muted" style="margin:0;text-align:center">Tap a day to open its full record.</p></div>' +
    (entries.length ? entries.map(d => { const e = S.diary[d]; return '<div class="card"><div class="card-head"><h3>' + nice(d) + '</h3><span style="font-size:22px">' + (e.mood ? MOODS[e.mood - 1].e : '') + '</span></div>' + (e.summary ? '<p style="margin:0;white-space:pre-wrap">' + esc(e.summary) + '</p>' : '') + (e.feelings ? '<p style="margin:0;white-space:pre-wrap;color:var(--muted)">' + esc(e.feelings) + '</p>' : '') + '</div>'; }).join('') : '<div class="card"><div class="empty">No diary entries in ' + monthLabel(k) + '. Write today’s on the Today tab.</div></div>');
  bindMonthNav(el, 'diaryMonth', () => VIEWS['me.diary'](el));
  $$('[data-day]', el).forEach(b => b.onclick = () => { if (b.dataset.day > t) return; ui.dayView = b.dataset.day; go('me', 'days'); });
};
VIEWS['me.habits'] = function(el){
  const now = new Date(), k = ym(now), days = now.getDate();
  const dom = Array.from({length:days}, (_, i) => k + '-' + pad(i + 1));
  const cnt = id => dom.filter(d => habitDone(id, d)).length;
  const pages = sum(dom, d => S.media[d] && S.media[d].pages), eps = dom.filter(d => S.media[d] && S.media[d].episode).length;
  el.innerHTML = '<div class="money3"><div class="mbox"><b style="color:var(--warn)">\u{1F525}' + streakOf('nosugar') + '</b><span>no-sugar streak</span></div><div class="mbox"><b>' + fmt(pages) + '</b><span>pages this month</span></div><div class="mbox"><b>' + eps + '</b><span>episodes this month</span></div></div>' +
    '<div class="card"><div class="card-head"><h2>This month</h2><span class="small muted">' + days + ' days so far</span></div>' +
      S.habits.map(h => { const c = cnt(h.id), goal = h.freq === 'daily' ? days : Math.ceil(days / 7) * h.target, st = h.freq === 'daily' ? streakOf(h.id) : 0; return '<div class="catrow"><div class="statrow"><span>' + h.e + ' ' + esc(h.name) + (st > 1 ? ' · \u{1F525}' + st : '') + '</span><span class="num">' + c + ' / ' + goal + '</span></div><div class="bar good"><i style="width:' + Math.min(100, goal ? c / goal * 100 : 0) + '%"></i></div></div>'; }).join('') + '</div>' +
    '<div class="card"><h2>Customize my habits</h2><p class="small muted" style="margin:0;font-weight:700">Set a reward for each one; it pops up when you hit a streak milestone (3, 7, 14, 21, 30 days and more).</p>' +
      '<div class="list">' + S.habits.map(h => '<div class="grow"><div class="gh"><input class="in" data-he="' + h.id + '" value="' + esc(h.e) + '" maxlength="4" style="text-align:center;padding:8px;font-size:20px" aria-label="Emoji"><input class="in" data-hn="' + h.id + '" value="' + esc(h.name) + '" aria-label="Habit name">' + delBtn('data-hdel', h.id) + '</div>' +
        '<div class="row"><label class="field"><span>How often</span><select class="in" data-hf="' + h.id + '"><option value="daily"' + (h.freq === 'daily' ? ' selected' : '') + '>Every day</option><option value="weekly"' + (h.freq === 'weekly' ? ' selected' : '') + '>Times a week</option></select></label>' +
        (h.freq === 'weekly' ? '<label class="field" style="flex:0 0 90px"><span>Per week</span><input class="in num" type="number" min="1" max="7" data-ht="' + h.id + '" value="' + h.target + '"></label>' : '') + '</div>' +
        '<label class="field"><span>My reward</span><input class="in" data-hr="' + h.id + '" value="' + esc(h.reward || '') + '" placeholder="A face mask, a new nail colour…"></label></div>').join('') + '</div>' +
      '<h3 style="margin-top:6px">Add a habit</h3>' + emoPicker(ui.hEmo || '\u{1F338}', 'data-hpick') + '<div class="row"><label class="field"><span>Name</span><input class="in" id="hN" placeholder="Skincare, stretch, pray on time…"></label><button class="btn" id="hAdd">Add</button></div></div>';
  const again = () => VIEWS['me.habits'](el), find = id => S.habits.find(h => h.id === id);
  $$('[data-he]', el).forEach(i => i.onchange = () => { find(i.dataset.he).e = i.value.trim() || '⭐'; save(); });
  $$('[data-hn]', el).forEach(i => i.onchange = () => { if (i.value.trim()) find(i.dataset.hn).name = i.value.trim(); save(); });
  $$('[data-hf]', el).forEach(i => i.onchange = () => { const h = find(i.dataset.hf); h.freq = i.value; if (!(h.target > 0)) h.target = 1; save(); again(); });
  $$('[data-ht]', el).forEach(i => i.onchange = () => { find(i.dataset.ht).target = Math.min(7, Math.max(1, +i.value || 1)); save(); });
  $$('[data-hr]', el).forEach(i => i.onchange = () => { find(i.dataset.hr).reward = i.value.trim(); save(); toast('Reward saved \u{1F381}'); });
  bindEmo(el, 'data-hpick', e => { ui.hEmo = e; });
  $('#hAdd', el).onclick = () => { const n = $('#hN', el).value.trim(); if (!n) return toast('Name your habit'); S.habits.push({id:uid(), name:n, e:ui.hEmo || '\u{1F338}', freq:'daily', target:1, reward:''}); save(); toast('Habit added ♡'); again(); };
  armDelete(el, 'data-hdel', id => { S.habits = S.habits.filter(h => h.id !== id); save(); again(); });
};
VIEWS['me.settings'] = function(el){
  const R = S.settings.rem, B = S.settings.budgets || {};
  const sw = (k, label, sub, obj) => '<button class="toggle" data-sw="' + k + '" data-obj="' + (obj || 'rem') + '" style="justify-content:space-between;width:100%"><span>' + label + '<span class="small muted" style="display:block;font-weight:600">' + sub + '</span></span><span class="sw" role="switch" aria-checked="' + !!(obj === 'settings' ? S.settings[k] !== false : R[k]) + '"></span></button>';
  el.innerHTML = '<div class="card"><h2>Make it mine</h2>' + sw('celebrate', 'Celebrations', 'Confetti and messages for streaks, savings and wins', 'settings') + sw('splash', 'Daily note when I open the app', 'A quote and advice once a day', 'settings') + '</div>' +
    '<div class="card"><h2>Meal plan</h2><label class="field"><span>Plan start date (Day 1)</span><input class="in" id="stStart" type="date" value="' + esc(S.start) + '"></label></div>' +
    '<div class="card"><h2>Money</h2><label class="field"><span>Monthly investment amount (EGP)</span><input class="in num" id="stInv" type="number" inputmode="decimal" min="0" value="' + esc(S.settings.invest || '') + '" placeholder="0"></label>' +
      '<h3 style="margin-top:4px">Monthly budgets</h3>' + CATS.map(c => '<div class="item"><span style="font-size:18px">' + c.e + '</span><span class="t">' + c.name + '</span><input class="in num" data-bud="' + c.id + '" type="number" inputmode="decimal" min="0" placeholder="No limit" value="' + esc(B[c.id] || '') + '" style="width:110px;text-align:right" aria-label="Budget for ' + c.name + '"></div>').join('') + '</div>' +
    '<div class="card"><h2>Reminders</h2>' + (native() ? '' : '<p class="small" style="margin:0;font-weight:800;color:var(--berry)">Reminders work in the iPhone app. In the browser these switches are saved for when you use the app.</p>') +
      sw('meals', 'Meals', '9:00, 14:00, 17:30, 20:30 with that day’s meal') + sw('water', 'Water', '11:00, 13:00, 16:00, 19:00') + sw('diary', 'Diary', '12:00 am and 2:00 am') + sw('checkin', 'Evening check-in', '10:00 pm: habits, spending, day log') +
      sw('money', 'Start of the month', 'Invest, buy gold, plan self-care, log salary') + sw('plans', 'Tasks and plans', 'Urgent tasks, mashawer, experiences and self-care sessions') + '</div>' +
    '<div class="card"><h2>Backup</h2><p class="small muted" style="margin:0;font-weight:600">Everything is saved on this phone. Copy a backup now and then and keep it in Notes.</p>' +
      '<div class="row"><button class="btn soft" id="bkCopy">Copy backup</button><button class="btn soft" id="bkShow">Restore from backup</button></div>' +
      '<div id="bkBox" hidden><textarea class="in" id="bkText" placeholder="Paste your backup here"></textarea><button class="btn full" id="bkRestore" style="margin-top:8px">Restore</button></div></div>' +
    '<p class="note">Monmon’s Life · made for Omnya ♡</p>';
  $('#stStart', el).onchange = e => { if (e.target.value){ S.start = e.target.value; ui.foodDay = null; save(); toast('Start date saved'); } };
  $('#stInv', el).onchange = e => { S.settings.invest = +e.target.value || 0; save(); toast('Saved'); };
  $$('[data-bud]', el).forEach(i => i.onchange = () => { S.settings.budgets = S.settings.budgets || {}; const v = +i.value; if (v > 0) S.settings.budgets[i.dataset.bud] = v; else delete S.settings.budgets[i.dataset.bud]; save(); toast('Budget saved'); });
  $$('[data-sw]', el).forEach(b => b.onclick = () => { const k = b.dataset.sw; let on;
    if (b.dataset.obj === 'settings'){ S.settings[k] = S.settings[k] === false; on = S.settings[k]; } else { R[k] = !R[k]; on = R[k]; }
    $('.sw', b).setAttribute('aria-checked', on); save(); });
  $('#bkCopy', el).onclick = async () => { const txt = JSON.stringify(S); try { await navigator.clipboard.writeText(txt); toast('Backup copied. Paste it in Notes.'); } catch(e){ $('#bkBox', el).hidden = false; $('#bkText', el).value = txt; $('#bkText', el).select(); toast('Select all and copy'); } };
  $('#bkShow', el).onclick = () => { $('#bkBox', el).hidden = false; $('#bkText', el).value = ''; };
  $('#bkRestore', el).onclick = () => { try { const d = JSON.parse($('#bkText', el).value); if (!d || typeof d !== 'object') throw 0; S = merge(DEF(), d); save(); toast('Restored ♡'); render(); } catch(e){ toast('That backup text isn’t valid'); } };
};

/* ============ boot ============ */
render();
syncNative();
setTimeout(() => showSplash(false), 350);
document.addEventListener('visibilitychange', () => { if (!document.hidden){ if (nav.tab === 'today') render(); syncNative(); showSplash(false); } });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
