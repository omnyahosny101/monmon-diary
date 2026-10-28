/* ============ LANGUAGE: Egyptian Arabic (default) or English ============
   The app is written in English. In Arabic mode every text the page shows is translated on the fly:
   AR holds exact strings, AR_RX handles strings built from parts (numbers, names, dates),
   AR_WORDS is the last resort for single words left inside a sentence. Dates and months switch arrays. */
const AR = Object.create(null);
const AR_RX = [];
const AR_WORDS = [];
const AR_WD = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function lang(){ try { return (S && S.settings && S.settings.lang) || 'ar'; } catch(e){ return 'ar'; } }
const isAr = () => lang() === 'ar';
const trCache = new Map(), trOut = new Set();
let wordsRx = null;
function tr(s){
  if (s == null) return s; s = String(s);
  if (!isAr() || !/[A-Za-z]/.test(s) || trOut.has(s)) return s;
  if (trCache.has(s)) return trCache.get(s);
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
  let out = s;
  try { out = m[1] + trCore(m[2]) + m[3]; } catch(e){}
  trCache.set(s, out); trOut.add(out); return out;
}
const flipArrows = s => s.replace(/[›‹→←]/g, c => ({'›':'‹', '‹':'›', '→':'←', '←':'→'}[c]));
function trCore(t){
  if (!t || !/[A-Za-z]/.test(t)) return t;
  if (AR[t] != null) return AR[t];
  // leading emoji or symbols, trailing emoji, hearts or arrows
  const sm = /^([^A-Za-z0-9؀-ۿ“"'(+]*)([\s\S]*?)([\s‍️←-⇿⌀-⏿☀-➿⬀-⯿\u{1F000}-\u{1FFFF}♡›‹→←✓✦]*)$/u.exec(t);
  if (sm && (sm[1] || sm[3]) && sm[2]){
    const mid = sm[2];
    if (AR[mid] != null) return sm[1] + AR[mid] + flipArrows(sm[3]);
    if (/[A-Za-z]/.test(mid) && mid !== t){ const r = trCore(mid); if (r !== mid) return sm[1] + r + flipArrows(sm[3]); }
  }
  const latin = x => (x.match(/[A-Za-z]/g) || []).length;
  if (t.includes(' · ')){
    const parts = t.split(' · ').map(trCore).join(' · ');
    if (!latin(parts)) return parts;
    const whole = rxChain(t); return latin(whole) < latin(parts) ? whole : parts;
  }
  return rxChain(t);
}
function rxChain(t){
  let r = t;
  for (const [rx, rep] of AR_RX){ if (!/[A-Za-z]/.test(r)) break; if (rx.test(r)) r = r.replace(rx, rep); }
  return /[A-Za-z]{2}/.test(r) ? trWords(r) : r;
}
function trWords(t){
  if (!AR_WORDS.length) return t;
  if (!wordsRx){
    AR_WORDS.sort((a, b) => b[0].length - a[0].length);
    wordsRx = new RegExp('(^|[^A-Za-z])(' + AR_WORDS.map(w => w[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![A-Za-z])', 'g');
  }
  const map = new Map(AR_WORDS);
  return t.replace(wordsRx, (all, pre, w) => pre + map.get(w));
}
// a name inside a sentence: translate it if it is one of ours, keep it if it is hers
const trName = n => tr(n);

/* ---------- the page ---------- */
const TR_ATTRS = ['placeholder', 'aria-label', 'title'];
function trText(n){
  const p = n.parentNode; if (!p || p.nodeType !== 1) return;
  const tag = p.nodeName; if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || (p.closest && p.closest('[data-notr]'))) return;
  const v = n.nodeValue; if (!v || !/[A-Za-z]/.test(v) || trOut.has(v)) return;
  const nv = tr(v); if (nv !== v) n.nodeValue = nv;
}
function trEl(el){
  for (const a of TR_ATTRS){ const v = el.getAttribute(a); if (v && /[A-Za-z]/.test(v)){ const nv = tr(v); if (nv !== v) el.setAttribute(a, nv); } }
  if (el.nodeName === 'INPUT' && (el.type === 'text' || el.type === 'search') && el.value && AR[el.value] != null) el.value = AR[el.value];
}
function trNode(root){
  if (!isAr() || !root) return;
  if (root.nodeType === 3) return trText(root);
  if (root.nodeType !== 1) return;
  trEl(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n; while ((n = w.nextNode())){ if (n.nodeType === 3) trText(n); else trEl(n); }
}
let trObserver = null;
function applyLang(){
  const ar = isAr(), H = document.documentElement;
  H.lang = ar ? 'ar' : 'en'; H.dir = ar ? 'rtl' : 'ltr';
  if (ar){
    WD.splice(0, 7, ...AR_WD); MONTHS.splice(0, 12, ...AR_MONTHS); MONTHS_L.splice(0, 12, ...AR_MONTHS);
    document.title = tr(document.title);
    if (!trObserver){
      trObserver = new MutationObserver(muts => { for (const m of muts){ if (m.type === 'characterData') trText(m.target); else m.addedNodes.forEach(trNode); } });
      trObserver.observe(document.body, {childList:true, subtree:true, characterData:true});
    }
    trNode(document.body);
  }
}
function trReminders(r){
  if (!isAr()) return r;
  const f = x => Object.assign({}, x, {title:tr(x.title), body:tr(x.body)});
  return {repeat:r.repeat.map(f), once:r.once.map(f)};
}
