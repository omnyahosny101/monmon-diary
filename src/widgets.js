/* ============ HOME-SCREEN WIDGETS ============
   The iPhone widgets can't run the page, so on every save the page hands the app a small JSON
   with what they show: today's lesson in the academy, the quote and facts for the next 7 days,
   open tasks, the wedding countdown and today's water and habits. The app writes it to the
   shared app-group folder and the widgets read it. Everything date-based is precomputed for a week,
   so the widgets keep changing even if the app isn't opened. */
function widgetJSON(){
  try {
    const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; };
    const t = todayStr(), WL = wisdomList(), pool = lessonPool(), all = pool.length;
    const item = i => { const P = pool[((i % all) + all) % all]; return P.L ? {t:P.L.t, x:cut(P.L.x, 220)} : {t:'تعرفي إن · ' + tr(P.f[0]), x:cut(tr(P.f[1]), 220)}; };
    const days = [];
    for (let o = 0; o < 7; o++){
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + o);
      const ds = ymd(d), k = daysBetween(LESSON_START, ds), wz = WL[(dayOfYear(d) + (S.wisdomShift || 0)) % WL.length];
      days.push({d:ds, q:{src:cut(tr(wz.src), 60), idea:cut(tr(wz.idea), 240), tip:cut(tr(wz.advice), 160)}, lesson:item(k + (S.lessonShift || 0)), facts:[0, 1, 2, 3, 4, 5].map(j => item(k * 6 + j + 135))});
    }
    const prio = x => x.prio === 'urgent' ? 0 : x.prio === 'high' ? 1 : 2;
    const open = S.tasks.filter(x => !x.done).sort((a, b) => prio(a) - prio(b) || ((a.due || '9') < (b.due || '9') ? -1 : (a.due || '9') > (b.due || '9') ? 1 : 0));
    const tasks = open.slice(0, 8).map(x => ({t:cut(x.title, 70), due:x.due || '', p:prio(x)}));
    const c = ACAD[0], A = S.acad || {done:{}, mins:{}}, ti = acTodayIdx(c), nx = acNextIdx(c), li = nx < 0 ? -1 : Math.min(nx, ti);
    const course = {start:A.start, total:c.days.length, done:acDoneN(c), streak:acStreak(), mins:(A.mins || {})[t] || 0,
      i:li, behind:li >= 0 && li < ti ? ti - li : 0, todayDone:acDone(c.id, ti), final:!!(A.final && A.final.meta30 && A.final.meta30.pass),
      days:c.days.map((d, i) => ({t:d.t, g:cut(d.goal, 110), w:d.w, done:acDone(c.id, i)}))};
    const B = (S.wedding && S.wedding.beauty) || [], next = B.filter(b => b.planned && !b.done && b.planned >= t).sort((a, b) => a.planned < b.planned ? -1 : 1)[0];
    const W = S.wedding || {}, ck = W.checklist || [];
    const daily = S.habits.filter(x => x.freq === 'daily');
    return JSON.stringify({v:1, at:t, wedding:S.profile.wedding || '2026-12-31',
      wnext:next ? {t:cut(next.name, 40), e:next.e || '💗', d:next.planned} : null,
      wdone:B.filter(b => b.done).length + ck.filter(x => x.done).length, wtotal:B.length + ck.length,
      tasks, open:open.length, urgent:open.filter(x => x.prio === 'urgent').length,
      course, days, water:S.water[t] || 0, habits:daily.filter(h => habitDone(h.id, t)).length, htotal:daily.length});
  } catch(e){ return ''; }
}
/* the widgets open the app on a page: monmon://academy, monmon://tasks, monmon://wedding … */
window.monmonOpen = function(where){
  const R = {academy:['grow', 'academy'], lesson:['grow', 'academy'], book:['grow', 'academy'], tasks:['plans', 'tasks'], wedding:['plans', 'wedding'], quote:['today'], fact:['grow', 'learn'], today:['today']}[where];
  if (!R) return;
  if (where === 'lesson'){ const c = ACAD[0], ti = acTodayIdx(c), nx = acNextIdx(c); ui.acBk = null; ui.acC = 'meta30'; ui.acL = nx < 0 ? null : Math.min(nx, ti); }
  if (where === 'book'){ ui.acBk = {}; }
  $$('.sheet').forEach(s => s.remove());
  go(R[0], R[1]); scrollTo({top:0});
};
