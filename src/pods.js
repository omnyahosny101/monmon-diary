/* ============ PODCASTS: listen inside the app, no YouTube, no feed to scroll ============
   Shows and episodes come from Apple Podcasts' public directory (loaded as JSONP, so no server is needed).
   In the iPhone app the audio plays natively: it keeps going with the screen locked and shows on the lock screen.
   S.pods = {subs:[{id, t, au, art}], prog:{trackId:{pos, dur, done, at}}, last:{...episode}, rate} */
const POD_SEED = [{id:'1847596356', t:'El Daheeh - الدحيح', au:'El Daheeh', art:''}];
const POD_RATES = [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5, 1.75, 2];
function podMigrate(){
  S.pods = S.pods && typeof S.pods === 'object' ? S.pods : {};
  if (!Array.isArray(S.pods.subs)){ S.pods.subs = POD_SEED.slice(); }
  S.pods.prog = S.pods.prog || {}; S.pods.rate = S.pods.rate || 1;
}
function jsonp(url){
  return new Promise((res, rej) => {
    const cb = '__jp' + Date.now() + Math.floor(Math.random() * 1e5), s = document.createElement('script');
    const done = () => { clearTimeout(t); delete window[cb]; s.remove(); };
    const t = setTimeout(() => { done(); rej(new Error('timeout')); }, 15000);
    window[cb] = d => { done(); res(d); };
    s.onerror = () => { done(); rej(new Error('net')); };
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb;
    document.head.appendChild(s);
  });
}
const POD_CACHE = {};
function podEpisodes(id, force){
  if (POD_CACHE[id] && !force) return Promise.resolve(POD_CACHE[id]);
  return jsonp('https://itunes.apple.com/lookup?id=' + encodeURIComponent(id) + '&entity=podcastEpisode&limit=60&country=eg').then(d => {
    const rs = (d && d.results) || [], show = rs.find(r => r.kind === 'podcast' || r.wrapperType === 'track' && r.collectionId == id && !r.episodeUrl) || {};
    const eps = rs.filter(r => r.episodeUrl).map(r => ({k:String(r.trackId), t:r.trackName, d:(r.releaseDate || '').slice(0, 10), url:r.episodeUrl, ms:r.trackTimeMillis || 0,
      art:r.artworkUrl160 || r.artworkUrl600 || show.artworkUrl100 || '', desc:r.shortDescription || r.description || '', show:String(id), st:r.collectionName || show.collectionName || ''}));
    eps.sort((a, b) => b.d < a.d ? -1 : 1);
    const sub = S.pods.subs.find(x => x.id == id); if (sub && show.collectionName){ sub.t = show.collectionName; sub.au = show.artistName || sub.au; sub.art = show.artworkUrl100 || sub.art; }
    return POD_CACHE[id] = {show, eps};
  });
}
function podSearch(term){ return jsonp('https://itunes.apple.com/search?media=podcast&entity=podcast&limit=15&country=eg&term=' + encodeURIComponent(term)).then(d => (d && d.results) || []); }

/* ---------- the player ---------- */
const POD = {ep:null, playing:false, pos:0, dur:0, el:null, lastSave:0};
window.__podIn = m => { if (!m) return;
  if (m.pos != null){ POD.pos = m.pos; if (m.dur) POD.dur = m.dur; POD.playing = !!m.playing; podProgress(); }
  if (m.ended) podEnded(); podBar(); };
const podNative = () => !!VOX.pod;
function podPlay(ep, from){
  if (typeof narrStop === 'function' && NAR.bar) narrStop(); stopSpeak();
  const p = S.pods.prog[ep.k] || {}, start = from != null ? from : (p.done ? 0 : p.pos || 0);
  POD.ep = ep; POD.pos = start; POD.dur = ep.ms / 1000 || p.dur || 0; POD.playing = true; S.pods.last = ep; save();
  if (podNative()){ try { native().postMessage({type:'podPlay', url:ep.url, start, rate:S.pods.rate, title:ep.t, artist:ep.st}); podBar(); return; } catch(e){} }
  if (!POD.el){ POD.el = new Audio(); POD.el.preload = 'auto';
    POD.el.ontimeupdate = () => { POD.pos = POD.el.currentTime; POD.dur = POD.el.duration || POD.dur; podProgress(); podBarTime(); };
    POD.el.onplay = () => { POD.playing = true; podBar(); }; POD.el.onpause = () => { POD.playing = false; podBar(); };
    POD.el.onended = podEnded; }
  POD.el.src = ep.url; POD.el.playbackRate = S.pods.rate;
  const go = () => { try { if (start > 1) POD.el.currentTime = start; } catch(e){} };
  POD.el.onloadedmetadata = go;
  POD.el.play().then(() => { POD.el.playbackRate = S.pods.rate; }).catch(e => { POD.playing = false; podBar(); toast(e && e.name === 'NotAllowedError' ? L2('دوسي ▶️', 'Tap ▶️') : L2('الحلقة محتاجة نت', 'Needs internet')); });
  podBar();
}
function podToggle(){
  if (!POD.ep) return;
  if (podNative()){ native().postMessage({type:POD.playing ? 'podPause' : 'podResume'}); POD.playing = !POD.playing; podBar(); return; }
  if (!POD.el || !POD.el.src) return podPlay(POD.ep, POD.pos);
  if (POD.el.paused) POD.el.play().catch(() => {}); else POD.el.pause();
}
function podSeek(by){
  if (!POD.ep) return;
  if (podNative()){ native().postMessage({type:'podSeek', by}); POD.pos = Math.max(0, POD.pos + by); podBarTime(); return; }
  if (POD.el) POD.el.currentTime = Math.max(0, Math.min((POD.el.duration || 1e9) - 1, POD.el.currentTime + by));
}
function podSetRate(r){ S.pods.rate = r; save(); if (podNative()) native().postMessage({type:'podRate', rate:r}); else if (POD.el) POD.el.playbackRate = r; podBar(); }
function podStop(){ if (podNative()) try { native().postMessage({type:'podStop'}); } catch(e){} if (POD.el) POD.el.pause(); POD.playing = false; podProgress(true); POD.ep = null; podBar(); }
function podProgress(force){
  const ep = POD.ep; if (!ep) return;
  const p = S.pods.prog[ep.k] = S.pods.prog[ep.k] || {};
  p.pos = POD.pos; if (POD.dur) p.dur = POD.dur; p.at = todayStr();
  if (!p.done && p.dur && POD.pos / p.dur > 0.92) podMarkDone(ep);
  const now = Date.now(); if (force || now - POD.lastSave > 5000){ POD.lastSave = now; save(); }
}
function podMarkDone(ep){
  const p = S.pods.prog[ep.k] = S.pods.prog[ep.k] || {}; p.done = todayStr();
  const day = todayStr(), m = S.media[day] = S.media[day] || {}; m.episode = ep.st + ' · ' + ep.t;
  if (S.habits.some(h => h.id === 'listen') && !habitDone('listen', day)) setHabit('listen', day, true);
  save(); toast(L2('🎧 خلصتي الحلقة! برافو', '🎧 Episode done!'));
}
function podEnded(){ if (POD.ep){ POD.pos = POD.dur; podProgress(true); if (!(S.pods.prog[POD.ep.k] || {}).done) podMarkDone(POD.ep); } POD.playing = false; podBar(); }
const tfmt = s => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + pad(m) : m) + ':' + pad(x); };
function podBar(){
  let bar = document.getElementById('podBar');
  if (!POD.ep){ if (bar) bar.remove(); document.body.classList.remove('has-pod'); return; }
  if (!bar){ bar = document.createElement('div'); bar.id = 'podBar'; bar.setAttribute('data-notr', ''); bar.setAttribute('dir', 'ltr'); document.body.appendChild(bar); }
  document.body.classList.add('has-pod');
  bar.innerHTML = '<button class="pb-info" data-pbi>' + (POD.ep.art ? '<img src="' + esc(POD.ep.art) + '" alt="">' : '<span class="pb-e">🎧</span>') + '<span class="t"><b dir="auto">' + esc(POD.ep.t) + '</b><span id="pbTime">' + tfmt(POD.pos) + (POD.dur ? ' / ' + tfmt(POD.dur) : '') + '</span></span></button>' +
    '<button data-pbs="-15" aria-label="Back 15 seconds">↺15</button><button class="big" data-pbp aria-label="Play or pause">' + (POD.playing ? '⏸' : '▶️') + '</button><button data-pbs="30" aria-label="Forward 30 seconds">30↻</button><button data-pbr>' + S.pods.rate + '×</button><button data-pbx aria-label="Close">✕</button>' +
    '<i class="pb-prog" style="width:' + (POD.dur ? Math.min(100, POD.pos / POD.dur * 100) : 0) + '%"></i>';
  $('[data-pbp]', bar).onclick = podToggle;
  $$('[data-pbs]', bar).forEach(b => b.onclick = () => podSeek(+b.dataset.pbs));
  $('[data-pbr]', bar).onclick = () => sheet('<h2 class="plain" style="justify-content:center">⏩ ' + L2('السرعة', 'Speed') + '</h2><div class="chips" style="justify-content:center">' + POD_RATES.map(r => '<button class="chip' + (r === S.pods.rate ? ' on' : '') + '" data-r="' + r + '" style="min-width:60px;justify-content:center">' + r + '×</button>').join('') + '</div>',
    (sh, close) => $$('[data-r]', sh).forEach(b => b.onclick = () => { podSetRate(+b.dataset.r); close(); }));
  $('[data-pbx]', bar).onclick = podStop;
  $('[data-pbi]', bar).onclick = () => podEpisodeSheet(POD.ep);
}
function podBarTime(){ const t = document.getElementById('pbTime'); if (t) t.textContent = tfmt(POD.pos) + (POD.dur ? ' / ' + tfmt(POD.dur) : ''); const pr = $('#podBar .pb-prog'); if (pr && POD.dur) pr.style.width = Math.min(100, POD.pos / POD.dur * 100) + '%'; }
function podEpisodeSheet(ep){
  const p = S.pods.prog[ep.k] || {}, txt = String(ep.desc || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  sheet((ep.art ? '<img src="' + esc(ep.art) + '" alt="" style="width:110px;height:110px;border-radius:18px;align-self:center;object-fit:cover">' : '') +
    '<h2 class="plain" style="justify-content:center;text-align:center" data-notr>' + esc(ep.t) + '</h2><p class="small muted" style="margin:0;text-align:center;font-weight:800" data-notr>' + esc(ep.st) + (ep.d ? ' · ' + niceDM(ep.d) : '') + (ep.ms ? ' · ' + Math.round(ep.ms / 60000) + L2(' دقيقة', ' min') : '') + '</p>' +
    (txt ? '<p class="recap" data-notr style="max-height:180px;overflow:auto">' + esc(txt.slice(0, 1500)) + '</p>' : '') +
    '<label class="field"><span>' + L2('ملاحظاتي على الحلقة', 'My notes') + '</span><textarea class="in" data-n placeholder="' + L2('أهم حاجة سمعتها…', 'The key thing I heard…') + '">' + esc(p.note || '') + '</textarea></label>' +
    '<div class="row"><button class="btn" data-play style="flex:2">▶️ ' + (p.pos > 5 && !p.done ? L2('كمّلي من ', 'Resume at ') + tfmt(p.pos) : L2('شغّلي', 'Play')) + '</button><button class="btn soft" data-done style="flex:1">' + (p.done ? '↩︎ ' + L2('لسه', 'Not done') : '✓ ' + L2('خلصت', 'Done')) + '</button></div>' +
    '<button class="btn soft full" data-ask>🤔 ' + L2('اسألي كلود عن الحلقة', 'Ask Claude about it') + '</button>',
  (sh, close) => {
    const keep = () => { const v = $('[data-n]', sh).value.trim(), q = S.pods.prog[ep.k] = S.pods.prog[ep.k] || {}; if (v) q.note = v; else delete q.note; save(); };
    $('[data-n]', sh).oninput = keep;
    $('[data-play]', sh).onclick = () => { keep(); close(); podPlay(ep); };
    $('[data-done]', sh).onclick = () => { const q = S.pods.prog[ep.k] = S.pods.prog[ep.k] || {}; if (q.done) delete q.done; else podMarkDone(ep); save(); close(); if (nav.tab === 'grow') render(); };
    $('[data-ask]', sh).onclick = () => { keep(); close(); askSheet({src:'mine', title:ep.st + ' · ' + ep.t, ctx:(S.pods.prog[ep.k] || {}).note ? L2('ملاحظاتي: ', 'My notes: ') + S.pods.prog[ep.k].note : txt.slice(0, 600)}); };
  });
}

/* ---------- Grow › Listen ---------- */
function podIdFromLink(s){ const m = /podcasts\.apple\.com\/[^\s]*\/id(\d+)(?:[^\s]*[?&]i=(\d+))?/.exec(s) || /^\s*(\d{6,})\s*$/.exec(s); return m ? {id:m[1], ep:m[2] || ''} : null; }
function podFollow(r){ const id = String(r.collectionId || r.id); if (!S.pods.subs.some(x => x.id === id)){ S.pods.subs.push({id, t:r.collectionName || r.t || '', au:r.artistName || r.au || '', art:r.artworkUrl100 || r.art || ''}); save(); } ui.podShow = id; }
VIEWS['grow.listen'] = function(el){
  const subs = S.pods.subs, cur = ui.podShow || (subs[0] && subs[0].id), last = S.pods.last, lp = last && S.pods.prog[last.k];
  el.innerHTML = '<div class="card tint"><div class="greet">🎧 ' + L2('أسمع من غير تشتيت', 'Listen without distractions') + '</div><span class="small" style="font-weight:700;line-height:1.6">' +
      L2('بودكاستاتك هنا من غير يوتيوب ولا مقترحات. في التطبيق بتكمّل والشاشة مقفولة (بعد تحديث Xcode الجاي).', 'Your podcasts, no YouTube, no feed. In the app they keep playing with the screen locked (after the next Xcode update).') + '</span>' +
      '<div class="row"><input class="in" id="podQ" placeholder="' + L2('دوّري على بودكاست أو الزقي لينك Apple Podcasts', 'Search, or paste an Apple Podcasts link') + '" style="flex:1"><button class="btn" id="podGo">' + L2('دوّري', 'Search') + '</button></div><div id="podRes"></div></div>' +
    (last && lp && !lp.done && lp.pos > 5 ? '<div class="card"><div class="card-head"><h2>▶️ ' + L2('كمّلي', 'Continue') + '</h2><span class="small muted" style="font-weight:800">' + tfmt(lp.pos) + (lp.dur ? ' / ' + tfmt(lp.dur) : '') + '</span></div><button class="podep" data-pk="last"><span class="t" data-notr><b>' + esc(last.t) + '</b><span class="s">' + esc(last.st) + '</span></span><span class="pp">▶️</span></button></div>' : '') +
    (subs.length ? '<div class="chips">' + subs.map(s => '<button class="chip' + (s.id === cur ? ' on' : '') + '" data-ps="' + s.id + '" data-notr>' + (s.art ? '<img src="' + esc(s.art) + '" alt="" class="pchip">' : '🎧 ') + esc(s.t || s.id) + '</button>').join('') + '</div>' : '') +
    '<div class="card" id="podEps"><div class="empty">' + (cur ? L2('بنجيب الحلقات…', 'Loading episodes…') : L2('تابعي بودكاست من البحث فوق', 'Follow a podcast from the search above')) + '</div></div>';
  const again = () => VIEWS['grow.listen'](el);
  $$('[data-ps]', el).forEach(b => b.onclick = () => { ui.podShow = b.dataset.ps; again(); });
  const lk = $('[data-pk="last"]', el); if (lk) lk.onclick = () => podPlay(last);
  const search = () => { const v = $('#podQ', el).value.trim(); if (!v) return; const link = podIdFromLink(v), box = $('#podRes', el);
    if (link){ podFollow({id:link.id}); ui.podEp = link.ep; again(); return; }
    box.innerHTML = '<div class="empty">' + L2('بدوّر…', 'Searching…') + '</div>';
    podSearch(v).then(rs => { box.innerHTML = rs.length ? '<div class="list">' + rs.map((r, i) => '<div class="podres"><img src="' + esc(r.artworkUrl100 || '') + '" alt=""><span class="t" data-notr><b>' + esc(r.collectionName) + '</b><span class="s">' + esc(r.artistName || '') + '</span></span><button class="btn sm" data-fol="' + i + '">' + (subs.some(x => x.id == r.collectionId) ? '✓' : '➕ ' + L2('تابعي', 'Follow')) + '</button></div>').join('') + '</div>' : '<div class="empty">' + L2('مالقيتش حاجة', 'Nothing found') + '</div>';
      $$('[data-fol]', box).forEach(b => b.onclick = () => { podFollow(rs[+b.dataset.fol]); again(); }); })
      .catch(() => { box.innerHTML = '<div class="empty">' + L2('البحث محتاج نت', 'Search needs internet') + '</div>'; }); };
  $('#podGo', el).onclick = search; $('#podQ', el).onkeydown = e => { if (e.key === 'Enter') search(); };
  if (!cur) return;
  podEpisodes(cur).then(({eps}) => {
    const box = $('#podEps', el); if (!box) return;
    const sub = subs.find(x => x.id === cur) || {};
    box.innerHTML = '<div class="card-head"><h2 data-notr>' + esc(sub.t || '') + '</h2><button class="linkbtn" data-unf>' + L2('إلغاء المتابعة', 'Unfollow') + '</button></div>' +
      (eps.length ? '<div class="list">' + eps.map((e, i) => { const p = S.pods.prog[e.k] || {}, pct = p.dur ? Math.min(100, (p.pos || 0) / p.dur * 100) : 0;
        return '<button class="podep' + (p.done ? ' done' : '') + (ui.podEp === e.k ? ' hi' : '') + '" data-pe="' + i + '"><span class="t" data-notr><b>' + esc(e.t) + '</b><span class="s">' + (e.d ? niceDM(e.d) : '') + (e.ms ? ' · ' + Math.round(e.ms / 60000) + L2(' د', ' min') : '') + (p.done ? ' · ✓' : p.pos > 5 ? ' · ' + tfmt(p.pos) : '') + (p.note ? ' · 📝' : '') + '</span>' + (pct && !p.done ? '<i class="pbar"><i style="width:' + pct + '%"></i></i>' : '') + '</span><span class="pp" data-pplay="' + i + '">▶️</span></button>'; }).join('') + '</div>'
        : '<div class="empty">' + L2('مفيش حلقات صوت متاحة للبودكاست ده', 'No audio episodes for this show') + '</div>');
    $$('[data-pe]', box).forEach(b => b.onclick = ev => { const e = eps[+b.dataset.pe]; if (ev.target.closest('[data-pplay]')) return podPlay(e); podEpisodeSheet(e); });
    $('[data-unf]', box).onclick = () => { S.pods.subs = S.pods.subs.filter(x => x.id !== cur); ui.podShow = ''; save(); again(); };
    const hi = $('.podep.hi', box); if (hi) hi.scrollIntoView({block:'center'});
    $$('.chip[data-ps]', el).forEach(c => { const s = subs.find(x => x.id === c.dataset.ps); if (s && s.art && !$('img', c)) c.insertAdjacentHTML('afterbegin', '<img src="' + esc(s.art) + '" alt="" class="pchip">'); });
    save();
  }).catch(() => { const box = $('#podEps', el); if (box) box.innerHTML = '<div class="empty">' + L2('الحلقات محتاجة نت. جربي تاني.', 'Episodes need internet. Try again.') + '</div>'; });
};
if (growTab && !growTab.subs.some(x => x[0] === 'listen')) growTab.subs.splice(2, 0, ['listen', 'Listen']);
// the podcast habit on the home page opens the player
const _todayPod = VIEWS.today;
VIEWS.today = function(el){
  _todayPod(el);
  const last = S.pods && S.pods.last, lp = last && S.pods.prog[last.k];
  if (last && lp && !lp.done && lp.pos > 5 && lp.at && lp.at >= addDays(todayStr(), -7)){
    const anchor = $('.readhome', el) || $('.frhome', el);
    const html = '<div class="card podhome"><div class="card-head"><h2>🎧 ' + L2('كمّلي الحلقة', 'Continue listening') + '</h2><span class="small muted" style="font-weight:800">' + tfmt(lp.pos) + (lp.dur ? ' / ' + tfmt(lp.dur) : '') + '</span></div><button class="podep" data-podlast><span class="t" data-notr><b>' + esc(last.t) + '</b><span class="s">' + esc(last.st) + '</span></span><span class="pp">▶️</span></button></div>';
    if (anchor) anchor.insertAdjacentHTML('afterend', html); else el.insertAdjacentHTML('beforeend', html);
    const b = $('[data-podlast]', el); if (b) b.onclick = () => podPlay(last);
  }
};
