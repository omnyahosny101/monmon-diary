/* ============ LAB RESULTS (Me › Lab results) ============
   S.labs     = [{id, date, lab, note, tests:[{name, value, unit, lo, hi}]}]   one entry per lab visit
   S.labsTodo = [{id, name, why, done}]                                          tests she still wants to do
   Photos of each report live under the photo key 'lab:<id>' (same photo system as the diary). */
const A2 = (en, ar) => isAr() ? ar : en;
const LAB_REF = {
  'Hemoglobin':        {unit:'g/dL',        lo:11.5, hi:15.5, ar:'الهيموجلوبين — بيشيل الأكسجين. لو قليل: تعب ووقوع شعر.'},
  'Haematocrit':       {unit:'%',           lo:36,   hi:45,   ar:'نسبة كرات الدم الحمرا في الدم.'},
  'RBCs':              {unit:'million/cmm', lo:4.0,  hi:5.2,  ar:'عدد كرات الدم الحمرا.'},
  'MCV':               {unit:'fL',          lo:80,   hi:100,  ar:'حجم كرة الدم الحمرا. لو صغير: غالبًا نقص حديد.'},
  'MCH':               {unit:'pg',          lo:27,   hi:33,   ar:'كمية الهيموجلوبين في كل كرة.'},
  'MCHC':              {unit:'g/dL',        lo:31,   hi:37,   ar:'تركيز الهيموجلوبين في الكرة.'},
  'RDW':               {unit:'%',           lo:11.5, hi:15,   ar:'اختلاف أحجام الكرات. بيعلى بدري في نقص الحديد.'},
  'Platelets':         {unit:'thousand/cmm',lo:150,  hi:450,  ar:'الصفايح — مسؤولة عن تجلط الدم.'},
  'WBCs':              {unit:'thousand/cmm',lo:4,    hi:11,   ar:'كرات الدم البيضا — المناعة.'},
  'Neutrophils':       {unit:'×10⁹/L',      lo:2,    hi:7,    ar:'خلايا مناعة ضد البكتيريا.'},
  'Lymphocytes':       {unit:'×10⁹/L',      lo:1,    hi:4.8,  ar:'خلايا مناعة ضد الفيروسات.'},
  'Monocytes':         {unit:'×10⁹/L',      lo:0.2,  hi:1,    ar:'خلايا مناعة بتنضف الالتهابات.'},
  'Eosinophils':       {unit:'×10⁹/L',      lo:0.1,  hi:0.45, ar:'بتعلى مع الحساسية. القليل لوحده ما لوش معنى.'},
  'Basophils':         {unit:'×10⁹/L',      lo:0,    hi:0.1,  ar:'نوع نادر من خلايا المناعة.'},
  'FSH':               {unit:'mIU/mL',      lo:1.4,  hi:9.9,  ar:'بيقول للمبايض تكبّر البويضات. يتعمل يوم 2–5 من الدورة.'},
  'LH':                {unit:'mIU/mL',      lo:1.7,  hi:15,   ar:'بيعمل التبويض. لو أعلى من FSH بالضعف: علامة تكيس.'},
  'Prolactin':         {unit:'ng/mL',       lo:3.5,  hi:23.3, ar:'هرمون اللبن. لو عالي ممكن يوقف التبويض.'},
  'Total testosterone':{unit:'ng/mL',       lo:0.12, hi:0.60, ar:'الهرمون الذكري. لو عالي: شعر زيادة وحبوب.'},
  'TSH':               {unit:'mIU/L',       lo:0.3,  hi:5.0,  ar:'الغدة الدرقية. المثالي 0.5–2.5.'},
  'Vitamin D':         {unit:'ng/mL',       lo:30,   hi:100,  ar:'تحت 20 نقص، 21–29 قليل، المثالي 40–60.'},
  'SHBG':              {unit:'nmol/L',      lo:18,   hi:144,  ar:'بيربط التستوستيرون ويعطله. لو قليل: التستوستيرون الحر بيعلى.'},
  'DHEA-S':            {unit:'µg/dL',       lo:65,   hi:380,  ar:'هرمون ذكري من الغدة الكظرية.'},
  '17-OH progesterone':{unit:'ng/mL',       lo:0,    hi:2,    ar:'يستبعد مشكلة الغدة الكظرية اللي شبه التكيس. الصبح، يوم 2–5.'},
  'Ferritin':          {unit:'ng/mL',       lo:15,   hi:150,  ar:'مخزون الحديد. المثالي للشعر فوق 40–50.'},
  'Vitamin B12':       {unit:'pg/mL',       lo:200,  hi:900,  ar:'للتركيز والطاقة والأعصاب. المثالي فوق 400.'},
  'Fasting insulin':   {unit:'µIU/mL',      lo:2,    hi:20,   ar:'لو عالي: مقاومة إنسولين. المثالي تحت 10.'},
  'Fasting glucose':   {unit:'mg/dL',       lo:70,   hi:100,  ar:'السكر الصايم.'},
  'HbA1c':             {unit:'%',           lo:4,    hi:5.6,  ar:'متوسط السكر في آخر 3 شهور.'},
  'AMH':               {unit:'ng/mL',       lo:1,    hi:4,    ar:'مخزون البويضات. بيعلى في التكيس.'},
};
const labStatus = t => { const v = +t.value; if (t.value === '' || isNaN(v)) return 'na'; if (t.lo !== '' && t.lo != null && v < +t.lo) return 'low'; if (t.hi !== '' && t.hi != null && v > +t.hi) return 'high'; return 'ok'; };
const LAB_CHIP = {ok:['Normal','طبيعي','#2e9e6a'], low:['Low','قليل','#d9822b'], high:['High','عالي','#d64545'], na:['—','—','#999']};
function labChip(st){ const c = LAB_CHIP[st]; return '<span class="labchip" style="--lc:' + c[2] + '">' + A2(c[0], c[1]) + '</span>'; }
function labBar(t){
  const v = +t.value, lo = +t.lo, hi = +t.hi; if (isNaN(v) || isNaN(lo) || isNaN(hi) || hi <= lo) return '';
  const span = hi - lo, min = lo - span * 0.35, max = hi + span * 0.35, pos = x => Math.max(0, Math.min(100, (x - min) / (max - min) * 100));
  return '<div class="labbar"><i style="left:' + pos(lo) + '%;right:' + (100 - pos(hi)) + '%"></i><b style="left:' + pos(v) + '%;background:' + LAB_CHIP[labStatus(t)][2] + '"></b></div>';
}
function labsMigrate(){
  S.labs = Array.isArray(S.labs) ? S.labs : [];
  S.labsTodo = Array.isArray(S.labsTodo) ? S.labsTodo : [];
}
/* 27 Nov: her first two lab visits, as she sent them, plus the follow-up tests we talked about. */
function seedLabs27Nov(){
  if (S.seed31) return;
  const T = (name, value, lo, hi, unit) => ({name, value, unit:unit || LAB_REF[name].unit, lo:lo != null ? lo : LAB_REF[name].lo, hi:hi != null ? hi : LAB_REF[name].hi});
  if (!S.labs.some(l => l.date === '2026-11-24')) S.labs.push({id:uid(), date:'2026-11-24', lab:'المختبر (مؤمنة كامل)', note:'صورة دم كاملة. تعليق المعمل: Normal blood picture. يوم 2 من الدورة.', tests:[
    T('Hemoglobin', 12.2), T('Haematocrit', 37.4), T('RBCs', 4.31), T('MCV', 86.6), T('MCH', 28.3), T('MCHC', 32.7), T('RDW', 14.4),
    T('Platelets', 184), T('WBCs', 4.9), T('Neutrophils', 3.44), T('Lymphocytes', 1.24), T('Monocytes', 0.16), T('Eosinophils', 0.05), T('Basophils', 0)]});
  if (!S.labs.some(l => l.date === '2026-11-25')) S.labs.push({id:uid(), date:'2026-11-25', lab:'رويال لاب (التجمع 2)', note:'هرمونات يوم 3 من الدورة + الغدة + فيتامين د.', tests:[
    T('FSH', 7.3), T('LH', 8.2), T('Prolactin', 12.3), T('Total testosterone', 0.15), T('TSH', 1.8), T('Vitamin D', 46.8)]});
  [['SHBG', 'مع التستوستيرون عشان يتحسب الـ FAI (التستوستيرون الحر)'], ['DHEA-S', 'لو الشعر الزيادة زاد'], ['17-OH progesterone', 'الصبح، يوم 2–5 من الدورة'],
   ['Ferritin', 'مخزون الحديد'], ['Vitamin B12', 'للتركيز والطاقة']].forEach(([n, w]) => { if (!S.labsTodo.some(x => x.name === n)) S.labsTodo.push({id:uid(), name:n, why:w, done:false}); });
  S.seed31 = true;
}

VIEWS['me.labs'] = function(el){
  const visits = S.labs.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  const latest = {}; visits.slice().reverse().forEach(v => v.tests.forEach(t => { (latest[t.name] = latest[t.name] || []).push(Object.assign({date:v.date}, t)); }));
  const flags = Object.values(latest).map(h => h[h.length - 1]).filter(t => ['low', 'high'].includes(labStatus(t)));
  const row = (t, v) => '<tr data-lt="' + v.id + '|' + esc(t.name) + '"><td><b><bdi dir="ltr">' + esc(t.name) + '</bdi></b>' + labBar(t) + '</td><td class="r num"><bdi dir="ltr">' + esc(t.value) + ' <small>' + esc(t.unit || '') + '</small></bdi></td><td class="r"><small class="num"><bdi dir="ltr">' + esc(t.lo) + '–' + esc(t.hi) + '</bdi></small><br>' + labChip(labStatus(t)) + '</td></tr>';
  el.innerHTML =
    '<div class="card tint"><h2>\u{1F9EA} ' + A2('My lab results', 'تحاليلي') + '</h2><p style="margin:0;font-weight:700">' +
      (!visits.length ? A2('No results yet.', 'لسه مفيش تحاليل.') :
        visits.length + ' ' + A2('lab visits · last on ', 'زيارات معمل · آخر واحدة ') + niceDM(visits[0].date) + '. ' +
        (flags.length ? A2('Outside range: ', 'برا المعدل: ') + flags.map(t => '<bdi dir="ltr">' + esc(t.name) + ' ' + t.value + '</bdi>').join('، ') + '.' : A2('Everything is within range.', 'كل حاجة في المعدل الطبيعي.'))) +
      '</p><button class="btn" id="lbNew">+ ' + A2('Add a lab visit', 'ضيفي زيارة معمل') + '</button></div>' +
    ('<div class="card"><h2>' + A2('Tests to do next', 'تحاليل لسه هعملها') + '</h2><div class="list">' + S.labsTodo.map(x =>
      '<div class="item' + (x.done ? ' done' : '') + '"><button class="tick' + (x.done ? ' on' : '') + '" data-ltd="' + x.id + '" aria-label="Done">' + CHECK + '</button><span class="t"><b><bdi dir="ltr">' + esc(x.name) + '</bdi></b>' + (x.why ? '<br><small>' + esc(x.why) + '</small>' : '') + '</span><button class="x" data-ltx="' + x.id + '" aria-label="Remove">×</button></div>').join('') +
      '</div><div class="row"><input class="in" id="ltN" placeholder="' + A2('Test name', 'اسم التحليل') + '" list="labNames"><button class="btn soft" id="ltAdd">' + A2('Add', 'ضيفي') + '</button></div></div>') +
    visits.map(v => '<div class="card"><div class="card-head"><h2>' + niceDM(v.date) + ' ' + v.date.slice(0, 4) + '</h2><button class="btn soft" data-lbe="' + v.id + '" style="padding:6px 10px">' + A2('Edit', 'تعديل') + '</button></div>' +
      '<p style="margin:0;font-weight:700">\u{1F3E5} ' + esc(v.lab || '') + '</p>' + (v.note ? '<p class="note" style="text-align:start">' + esc(v.note) + '</p>' : '') +
      (v.tests.length ? '<div style="overflow-x:auto"><table class="tbl labtbl"><thead><tr><th>' + A2('Test', 'التحليل') + '</th><th class="r">' + A2('Result', 'النتيجة') + '</th><th class="r">' + A2('Range', 'المعدل') + '</th></tr></thead><tbody>' + v.tests.map(t => row(t, v)).join('') + '</tbody></table></div>' : '') +
      '<button class="btn soft" data-lba="' + v.id + '">+ ' + A2('Add a test', 'ضيفي تحليل') + '</button>' +
      '<h3>' + A2('Report photos', 'صور التقرير') + '</h3>' + photoStrip('lab:' + v.id) + '</div>').join('') +
    '<datalist id="labNames">' + Object.keys(LAB_REF).map(n => '<option value="' + n + '">').join('') + '</datalist>';
  const again = () => VIEWS['me.labs'](el);
  const visitSheet = v => sheet('<h2>' + (v ? A2('Edit visit', 'تعديل الزيارة') : A2('New lab visit', 'زيارة معمل جديدة')) + '</h2>' +
      '<label class="field"><span>' + A2('Date', 'التاريخ') + '</span><input class="in" data-d type="date" value="' + (v ? v.date : todayStr()) + '"></label>' +
      '<label class="field"><span>' + A2('Lab', 'المعمل') + '</span><input class="in" data-l value="' + esc(v ? v.lab : '') + '"></label>' +
      '<label class="field"><span>' + A2('Note', 'ملاحظة') + '</span><textarea class="in" data-n rows="2">' + esc(v ? v.note || '' : '') + '</textarea></label>' +
      '<button class="btn full" data-ok>' + A2('Save', 'حفظ') + '</button>' + (v ? '<button class="btn soft full" data-del>' + A2('Delete visit', 'امسحي الزيارة') + '</button>' : ''),
    (sh, close) => {
      $('[data-ok]', sh).onclick = () => { const d = $('[data-d]', sh).value || todayStr(), l = $('[data-l]', sh).value.trim(), n = $('[data-n]', sh).value.trim();
        if (v) Object.assign(v, {date:d, lab:l, note:n}); else S.labs.push({id:uid(), date:d, lab:l, note:n, tests:[]}); save(); close(); again(); };
      const del = $('[data-del]', sh); if (del) del.onclick = () => { if (!confirm(A2('Delete this visit?', 'تمسحي الزيارة دي؟'))) return; S.labs = S.labs.filter(x => x !== v); save(); close(); again(); };
    });
  const testSheet = (v, t) => sheet('<h2>' + (t ? esc(t.name) : A2('Add a test', 'ضيفي تحليل')) + '</h2>' +
      '<label class="field"><span>' + A2('Test', 'التحليل') + '</span><input class="in" data-tn list="labNames2" value="' + esc(t ? t.name : '') + '"></label><datalist id="labNames2">' + Object.keys(LAB_REF).map(n => '<option value="' + n + '">').join('') + '</datalist>' +
      (t && LAB_REF[t.name] ? '<p class="note" style="text-align:start">' + LAB_REF[t.name].ar + '</p>' : '') +
      '<div class="row"><label class="field"><span>' + A2('Result', 'النتيجة') + '</span><input class="in num" data-tv inputmode="decimal" value="' + esc(t ? t.value : '') + '"></label><label class="field"><span>' + A2('Unit', 'الوحدة') + '</span><input class="in" data-tu value="' + esc(t ? t.unit : '') + '"></label></div>' +
      '<div class="row"><label class="field"><span>' + A2('Range from', 'المعدل من') + '</span><input class="in num" data-tl inputmode="decimal" value="' + esc(t ? t.lo : '') + '"></label><label class="field"><span>' + A2('to', 'لحد') + '</span><input class="in num" data-th inputmode="decimal" value="' + esc(t ? t.hi : '') + '"></label></div>' +
      '<button class="btn full" data-ok>' + A2('Save', 'حفظ') + '</button>' + (t ? '<button class="btn soft full" data-del>' + A2('Delete test', 'امسحي التحليل') + '</button>' : ''),
    (sh, close) => {
      const nm = $('[data-tn]', sh);
      nm.onchange = () => { const r = LAB_REF[nm.value.trim()]; if (!r) return; if (!$('[data-tu]', sh).value) $('[data-tu]', sh).value = r.unit; if (!$('[data-tl]', sh).value) $('[data-tl]', sh).value = r.lo; if (!$('[data-th]', sh).value) $('[data-th]', sh).value = r.hi; };
      $('[data-ok]', sh).onclick = () => { const n = nm.value.trim(), val = $('[data-tv]', sh).value.trim(); if (!n || val === '') return toast(A2('Add the test name and result', 'اكتبي اسم التحليل والنتيجة'));
        const num = x => x.trim() === '' ? '' : +x; const o = {name:n, value:isNaN(+val) ? val : +val, unit:$('[data-tu]', sh).value.trim(), lo:num($('[data-tl]', sh).value), hi:num($('[data-th]', sh).value)};
        if (t) Object.assign(t, o); else v.tests.push(o); save(); close(); again(); };
      const del = $('[data-del]', sh); if (del) del.onclick = () => { v.tests = v.tests.filter(x => x !== t); save(); close(); again(); };
    });
  $('#lbNew', el).onclick = () => visitSheet(null);
  el.querySelectorAll('[data-lbe]').forEach(b => b.onclick = () => visitSheet(S.labs.find(v => v.id === b.dataset.lbe)));
  el.querySelectorAll('[data-lba]').forEach(b => b.onclick = () => testSheet(S.labs.find(v => v.id === b.dataset.lba), null));
  el.querySelectorAll('[data-lt]').forEach(r => r.onclick = () => { const [id, name] = r.dataset.lt.split('|'), v = S.labs.find(x => x.id === id); testSheet(v, v.tests.find(t => t.name === name)); });
  el.querySelectorAll('[data-ltd]').forEach(b => b.onclick = () => { const x = S.labsTodo.find(y => y.id === b.dataset.ltd); x.done = !x.done; save(); again(); });
  el.querySelectorAll('[data-ltx]').forEach(b => b.onclick = () => { S.labsTodo = S.labsTodo.filter(y => y.id !== b.dataset.ltx); save(); again(); });
  const ta = $('#ltAdd', el); if (ta) ta.onclick = () => { const n = $('#ltN', el).value.trim(); if (!n) return; S.labsTodo.push({id:uid(), name:n, why:LAB_REF[n] ? LAB_REF[n].ar : '', done:false}); save(); again(); };
};
(function(){ const me = TABS.find(x => x.id === 'me'); if (me && !me.subs.some(x => x[0] === 'labs')) { const i = me.subs.findIndex(x => x[0] === 'cycle'); me.subs.splice(i >= 0 ? i + 1 : me.subs.length - 1, 0, ['labs', 'Lab results']); } })();
