'use strict';
/* =========================================================
   Codi 3 SEM · lògica del joc
   - Repetició espaiada (7 nivells de domini per codi)
   - XP, nivells, ratxa diària, objectiu diari, assoliments
   - Modes: repàs intel·ligent, targetes, contrarellotge,
     supervivència, parelles, torns de guàrdia, mode expert,
     deletrejar / desxifrar / escoltar INTERCO
   ========================================================= */

/* ---------------- Utilitats ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function dayStr(d = new Date()) { const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; }
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); }
function normText(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/l[·.•]l/g, 'll').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
const normWord = s => normText(s).replace(/\s/g, '');
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
const sim = (a, b) => { const m = Math.max(a.length, b.length); return m ? 1 - lev(a, b) / m : 1; };
function normCode(s) {
  s = String(s || '').toUpperCase().replace(/,/g, '.').replace(/[\s\/\-]/g, '');
  if (s.startsWith('3.')) s = s.slice(2);
  return s;
}
function fmtDur(ms) {
  if (ms <= 0) return 'ara';
  const m = ms / 60000; if (m < 60) return Math.ceil(m) + ' min';
  const h = m / 60; if (h < 24) return Math.round(h) + ' h';
  return Math.round(h / 24) + ' d';
}
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

/* ---------------- Dades ---------------- */
const UNITS = [], ITEMS = [], BY_ID = {}, UNIT_BY_ID = {}, C3_BY_SFX = {};
C3_UNITS.forEach((u, idx) => {
  const unit = { id: u.id, track: 'c3', idx, icon: u.icon, name: u.name, desc: u.desc, pista: u.pista, ids: [] };
  u.items.forEach(r => {
    const sfx = normCode(r.c);
    const it = { id: 'c:' + sfx, track: 'c3', unit: u.id, code: r.c, sfx, alts: (r.a || []).map(normCode), m: r.m, s: r.s, k: r.k, nk: r.nk || [], h: r.h || '' };
    ITEMS.push(it); BY_ID[it.id] = it; C3_BY_SFX[sfx] = it; unit.ids.push(it.id);
    it.alts.forEach(a => { C3_BY_SFX[a] = C3_BY_SFX[a] || it; });
  });
  UNITS.push(unit); UNIT_BY_ID[unit.id] = unit;
});
IC_UNITS.forEach((u, idx) => {
  const unit = { id: u.id, track: 'ic', idx, icon: u.icon, name: u.name, desc: u.desc, pista: u.pista, ids: [] };
  u.items.forEach(r => {
    const it = { id: 'i:' + r.l, track: 'ic', unit: u.id, sym: r.l, w: r.w, alts: [r.w, ...(r.a || [])].map(normWord), pr: r.p, num: /\d/.test(r.l) };
    it.code = r.l; it.m = r.w;
    ITEMS.push(it); BY_ID[it.id] = it; unit.ids.push(it.id);
  });
  UNITS.push(unit); UNIT_BY_ID[unit.id] = unit;
});
const C3 = ITEMS.filter(i => i.track === 'c3');
const IC = ITEMS.filter(i => i.track === 'ic');
const IC_LETTERS = IC.filter(i => !i.num);
const unitsOf = track => UNITS.filter(u => u.track === track);

/* ---------------- Estat (localStorage) ---------------- */
const KEY = 'codi3sem.v1';
function freshState() {
  return {
    v: 1, xp: 0, items: {}, day: { d: dayStr(), xp: 0, goalHit: false }, streak: { n: 0, last: null }, goal: 100,
    best: {}, ach: {}, set: { sound: true, unlockAll: false, theme: 'auto' },
    stats: { ans: 0, ok: 0, bestCombo: 0, sessions: 0, perfectStory: 0, perfectPairs: 0, spellPerfect: 0, timeMs: 0 },
  };
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw), f = freshState();
      return { ...f, ...o, set: { ...f.set, ...(o.set || {}) }, stats: { ...f.stats, ...(o.stats || {}) }, best: o.best || {}, ach: o.ach || {}, items: o.items || {}, day: o.day || f.day, streak: o.streak || f.streak };
    }
  } catch (e) { /* sense emmagatzematge */ }
  return freshState();
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignora */ } }

/* ---------------- Repetició espaiada ---------------- */
const MASTERY = ['Nou', 'Vist', 'Reconegut', 'Recordat', 'Après', 'Consolidat', 'Dominat'];
const IV = [0, 0, 60e3, 5 * 60e3, 3600e3, 8 * 3600e3, 2 * 86400e3];
const st = id => S.items[id] || { b: 0, due: 0, ok: 0, ko: 0 };
const box = id => st(id).b;
/* kind: 'rec' (reconèixer: opcions) només puja fins a "Recordat";
         'prod' (escriure de memòria) pot arribar a "Dominat".
   Els nivells alts (Après →) només pugen si toca repàs (cal espaiar en el temps). */
function srsUpdate(id, ok, kind) {
  const now = Date.now(), s = { ...st(id) }, before = s.b;
  if (ok) {
    s.ok++;
    const cap = kind === 'rec' ? 3 : 6;
    if (s.b < cap && (s.b < 4 || s.due <= now)) {
      s.b++;
      if (s.b === 6) s.iv = IV[6];
      s.due = now + (s.b === 6 ? s.iv : IV[s.b]);
    } else if (s.b === 6 && kind === 'prod' && s.due <= now) {
      s.iv = Math.min((s.iv || IV[6]) * 2, 60 * 86400e3);
      s.due = now + s.iv;
    } else if (s.b === 0) {
      s.b = 1; s.due = now;
    }
  } else {
    s.ko++;
    s.b = s.b >= 3 ? s.b - 2 : 1;
    s.iv = 0; s.due = now;
  }
  s.last = now;
  S.items[id] = s;
  return { before, after: s.b };
}
function unitUnlocked(u) {
  if (S.set.unlockAll || u.idx === 0) return true;
  const prev = unitsOf(u.track)[u.idx - 1];
  return prev.ids.every(id => box(id) >= 2);
}
function unitProgress(u) {
  const bs = u.ids.map(box);
  const sum = bs.reduce((a, b) => a + b, 0);
  const stars = bs.every(b => b >= 6) ? 3 : bs.every(b => b >= 4) ? 2 : bs.every(b => b >= 1) ? 1 : 0;
  return { pct: pct(sum, u.ids.length * 6), stars, seen: bs.filter(b => b > 0).length };
}
function trackStats(track) {
  const its = ITEMS.filter(i => i.track === track);
  const counts = [0, 0, 0, 0, 0, 0, 0];
  let sum = 0;
  its.forEach(i => { const b = box(i.id); counts[b]++; sum += b; });
  return { n: its.length, counts, pct: pct(sum, its.length * 6), mastered: counts[6] };
}
function dueCount(track) {
  const now = Date.now();
  return ITEMS.filter(i => i.track === track && box(i.id) > 0 && st(i.id).due <= now).length;
}
function newAvail(track) { return ITEMS.filter(i => i.track === track && box(i.id) === 0 && unitUnlocked(UNIT_BY_ID[i.unit])).length; }

/* ---------------- XP i nivells ---------------- */
const cum = L => 50 * L * (L + 1);
function lvlInfo(xp) {
  let L = 1; while (xp >= cum(L)) L++;
  const prev = cum(L - 1), next = cum(L);
  return { L, into: xp - prev, need: next - prev, p: (xp - prev) / (next - prev) };
}
const TITLES = [[1, 'Aspirant'], [2, 'Alumne/a TTS'], [3, 'TTS en pràctiques'], [4, 'TTS'], [5, 'TTS expert/a'], [7, "Cap d'equip"],
  [9, 'Operador/a de ràdio'], [11, 'Gestor/a del CECOS'], [14, 'Coordinador/a del CECOS'], [17, 'Veu de la xarxa'], [20, 'Mestre/a del Codi 3'], [25, 'Llegenda del SEM']];
const titleFor = L => TITLES.filter(t => t[0] <= L).pop()[1];
function touchDay() { const t = dayStr(); if (S.day.d !== t) S.day = { d: t, xp: 0, goalHit: false }; }
function streakNow() { return (S.streak.last === dayStr() || S.streak.last === yesterdayStr()) ? S.streak.n : 0; }
function addXp(n) {
  touchDay();
  const before = lvlInfo(S.xp).L;
  S.xp += n; S.day.xp += n;
  const t = dayStr();
  if (S.streak.last !== t) {
    S.streak.n = S.streak.last === yesterdayStr() ? S.streak.n + 1 : 1;
    S.streak.last = t;
    if (S.streak.n > 1) toast('🔥', `Ratxa de ${S.streak.n} dies!`, 'Continua així cada dia.');
  }
  if (!S.day.goalHit && S.day.xp >= S.goal) { S.day.goalHit = true; toast('🎯', 'Objectiu diari complert!', `${S.goal} XP avui. Boníssim!`); sfx('ach'); }
  const after = lvlInfo(S.xp).L;
  if (after > before) {
    sfx('lvl'); confetti();
    toast('⭐', `Nivell ${after}!`, titleFor(after));
    if (R) R.levelUp = after;
  }
  updateHeader();
}

/* ---------------- So ---------------- */
let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
function tone(f, dur, type = 'sine', when = 0, vol = 0.12) {
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + when;
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
}
function noise(dur, vol = 0.05) {
  const a = ac(); if (!a) return;
  const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  f.type = 'bandpass'; f.frequency.value = 1800; g.gain.value = vol;
  src.buffer = buf; src.connect(f).connect(g).connect(a.destination); src.start();
}
const SFX = {
  ok() { tone(660, .12, 'triangle'); tone(990, .2, 'triangle', .08); },
  ko() { tone(196, .22, 'sawtooth', 0, .06); tone(147, .3, 'sawtooth', .1, .05); },
  lvl() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .25, 'triangle', i * .09, .1)); },
  ach() { [784, 988, 1175].forEach((f, i) => tone(f, .18, 'sine', i * .08, .1)); },
  click() { tone(900, .04, 'square', 0, .03); },
  squelch() { noise(.18, .06); tone(1250, .09, 'sine', .2, .05); },
  combo() { tone(880, .08, 'square', 0, .04); tone(1320, .1, 'square', .06, .04); },
};
function sfx(n) { if (!S.set.sound) return; try { SFX[n] && SFX[n](); } catch (e) { /* res */ } }

/* ---------------- Veu (INTERCO) ---------------- */
const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
function speak(text) {
  if (!canSpeak) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const vs = speechSynthesis.getVoices();
    const v = vs.find(v => /en[-_]GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang));
    if (v) u.voice = v;
    u.lang = v ? v.lang : 'en-GB'; u.rate = 0.85;
    speechSynthesis.speak(u);
    return true;
  } catch (e) { return false; }
}

/* ---------------- Confeti ---------------- */
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = $('#confetti'), ctx = cv.getContext('2d');
  const W = cv.width = innerWidth, H = cv.height = innerHeight;
  const cols = ['#ffd60a', '#22c55e', '#38bdf8', '#f43f5e', '#a78bfa', '#ffffff'];
  const ps = Array.from({ length: 140 }, () => ({ x: W / 2 + (Math.random() - .5) * 120, y: H * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, s: 5 + Math.random() * 6, c: pick(cols), r: Math.random() * 6, vr: (Math.random() - .5) * .3 }));
  let f = 0;
  (function loop() {
    ctx.clearRect(0, 0, W, H);
    ps.forEach(p => { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
    if (++f < 150) requestAnimationFrame(loop); else ctx.clearRect(0, 0, W, H);
  })();
}

/* ---------------- Toasts i modal ---------------- */
function toast(icon, title, sub = '') {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="ti">${icon}</span><div>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
  const box = $('#toasts'); box.appendChild(el);
  while (box.children.length > 3) box.firstElementChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 3200);
}
function openModal(html) { $('#modalBody').innerHTML = html; const m = $('#modal'); m.classList.add('show'); m.setAttribute('aria-hidden', 'false'); }
function closeModal() { const m = $('#modal'); m.classList.remove('show'); m.setAttribute('aria-hidden', 'true'); }
const modalOpen = () => $('#modal').classList.contains('show');

/* ---------------- Capçalera ---------------- */
function updateHeader() {
  touchDay();
  const li = lvlInfo(S.xp);
  $('#hLvl').textContent = li.L;
  $('#hXp').style.width = (li.p * 100).toFixed(1) + '%';
  const sn = streakNow();
  $('#hStreak').textContent = sn;
  $('#hStreakChip').classList.toggle('off', S.streak.last !== dayStr());
  $('#hGoal').textContent = `${Math.min(S.day.xp, S.goal)}/${S.goal}`;
  $('#hGoalRing').style.strokeDashoffset = 94.25 * (1 - Math.min(1, S.day.xp / S.goal));
}

/* =========================================================
   PREGUNTES
   ========================================================= */
const PRAISE = ['Correcte!', 'Molt bé!', 'Perfecte!', 'Així es fa!', 'Exacte!', 'Genial!', 'Impecable!', 'Rebut, correcte!'];

function distract(it, n, hard = true) {
  const pool = it.track === 'c3' ? C3 : (it.num ? IC.filter(i => i.num) : IC_LETTERS);
  const out = [];
  const add = x => { if (x && x !== it && !out.includes(x) && out.length < n) out.push(x); };
  if (it.track === 'c3') {
    const conf = new Set();
    C3_CONFUSABLE.forEach(g => { if (g.includes(it.sfx)) g.forEach(s => conf.add(s)); });
    shuffle([...conf]).slice(0, hard ? 2 : 1).forEach(s => add(C3_BY_SFX[s]));
    shuffle(UNIT_BY_ID[it.unit].ids.map(id => BY_ID[id])).slice(0, hard ? 2 : 1).forEach(add);
  }
  shuffle(pool).forEach(add);
  return out;
}
function revealC3(it) {
  return `<div class="rv"><span class="rv-code">${esc(it.code)}</span><span>${esc(it.m)}</span></div>${it.h ? `<div class="hint">💡 ${esc(it.h)}</div>` : ''}`;
}
function revealIC(it) {
  return `<div class="rv"><span class="rv-code">${esc(it.sym)}</span><span><b>${esc(it.w)}</b> <span class="muted">(${esc(it.pr)})</span></span></div>`;
}
function codeCheck(it, v) {
  const n = normCode(v);
  const ok = n === it.sfx || it.alts.includes(n);
  const res = { ok, given: v.trim().toUpperCase() };
  if (!ok) {
    const other = C3_BY_SFX[n];
    if (other) res.msg = `Has escrit <b>${esc(other.code)}</b>, que vol dir: <i>${esc(other.m)}</i>.`;
    else if (n) res.msg = `El codi 3.${esc(n)} no existeix.`;
    if (it.sfx === '1O' && n === '10') res.msg = "⚠️ Ull: és la <b>lletra O</b> d'Operativa (3.1 O), no un zero. 3.10 és Retorn a Base.";
    if (it.sfx === '10' && n === '1O') res.msg = "⚠️ Ull: Retorn a Base és 3.10 amb <b>zero</b>. 3.1 O (lletra O) és trucada Operativa.";
  }
  return res;
}
function wordHit(alt, toks, full) {
  if (alt.includes(' ')) return (' ' + full + ' ').includes(' ' + alt);
  const tol = alt.length >= 9 ? 2 : alt.length >= 7 ? 1 : 0;
  const fuzzy = t => tol > 0 && t.length >= 5 && [-1, 0, 1].some(d => lev(t.slice(0, alt.length + d), alt) <= tol);
  return toks.some(t => t === alt || (alt.length >= 4 && t.startsWith(alt)) || fuzzy(t));
}
function meaningCheck(it, v) {
  const full = normText(v), toks = full.split(' ').filter(Boolean);
  const okK = it.k.every(g => g.split('|').some(a => wordHit(a, toks, full)));
  const bad = it.nk.some(a => wordHit(a, toks, full));
  return { ok: okK && !bad, given: v.trim() };
}

/* ---- Codi 3 ---- */
const C3_BY_BOX = [
  ['mc_code2mean'], ['mc_code2mean', 'tf', 'mc_mean2code'], ['mc_mean2code', 'mc_scen', 'mc_code2mean'],
  ['type_code', 'type_code', 'mc_scen'], ['type_code', 'type_scen'], ['type_scen', 'type_code', 'type_mean'], ['type_scen', 'type_mean', 'type_code'],
];
function c3Q(it, qt) {
  const reveal = revealC3(it);
  const base = { item: it, reveal };
  const hard = box(it.id) >= 2;
  const mcFrom = (opts, label, cls = '') => ({
    kind: 'mc', optClass: cls,
    options: opts.map(o => ({ html: label(o), ok: o === it })),
  });
  switch (qt) {
    case 'mc_code2mean': {
      const opts = shuffle([it, ...distract(it, 3, hard)]);
      return { ...base, ...mcFrom(opts, o => esc(o.m)), tag: 'Codi → significat', xp: 8, srsKind: 'rec',
        prompt: `<div class="q-sub">Què vol dir aquest codi?</div><div class="q-code">${esc(it.code)}</div>` };
    }
    case 'mc_mean2code': {
      const opts = shuffle([it, ...distract(it, 3, hard)]);
      return { ...base, ...mcFrom(opts, o => `<span class="oc">${esc(o.code)}</span>`, 'codes'), tag: 'Significat → codi', xp: 8, srsKind: 'rec',
        prompt: `<div class="q-sub">Quin codi correspon a…</div><div class="q-mean">${esc(it.m)}</div>` };
    }
    case 'mc_scen': {
      const opts = shuffle([it, ...distract(it, 3, true)]);
      return { ...base, ...mcFrom(opts, o => `<span class="oc">${esc(o.code)}</span>`, 'codes'), tag: 'Situació real', xp: 10, srsKind: 'rec',
        prompt: `<div class="q-sub">Quin codi faries servir?</div><div class="q-scen"><span class="ri">📻</span><span>${esc(it.s)}</span></div>` };
    }
    case 'tf': {
      const truth = Math.random() < .5;
      const shown = truth ? it : distract(it, 1, true)[0];
      return { ...base, kind: 'tf', answer: truth, tag: 'Cert o fals', xp: 5, srsKind: 'rec',
        prompt: `<div class="q-sub">És correcte?</div><div class="q-code">${esc(it.code)}</div><div class="q-mean">= ${esc(shown.m)}</div>`,
        check: v => ({ ok: v === truth, chosen: v, msg: truth ? '' : `Era fals: aquest significat és el del <b>${esc(shown.code)}</b>.` }) };
    }
    case 'type_scen':
      return { ...base, kind: 'type', prefix: '3.', ph: '', caps: 'characters', tag: 'Situació real · escriu', xp: 14, srsKind: 'prod',
        prompt: `<div class="q-sub">Quin codi transmets?</div><div class="q-scen"><span class="ri">📻</span><span>${esc(it.s)}</span></div>`,
        check: v => codeCheck(it, v) };
    case 'type_mean':
      return { ...base, kind: 'type', wide: true, ph: 'Escriu el significat…', tag: 'Mode expert · significat', xp: 16, srsKind: 'prod', allowOverride: true,
        prompt: `<div class="q-sub">Què vol dir aquest codi? Escriu-ho amb les teves paraules.</div><div class="q-code">${esc(it.code)}</div>`,
        check: v => meaningCheck(it, v) };
    case 'type_code':
    default:
      return { ...base, kind: 'type', prefix: '3.', ph: '', caps: 'characters', tag: 'Escriu el codi', xp: 12, srsKind: 'prod',
        prompt: `<div class="q-sub">Escriu el codi de…</div><div class="q-mean">${esc(it.m)}</div>`,
        check: v => codeCheck(it, v) };
  }
}

/* ---- INTERCO ---- */
const IC_BY_BOX = [['mc_l2w'], ['mc_l2w', 'mc_w2l'], ['mc_w2l', 'type_l2w', 'mc_l2w'], ['type_l2w'], ['type_l2w'], ['type_l2w', 'type_w2l'], ['type_l2w']];
function icCheckWord(it, v) {
  let n = normWord(v);
  const ok = it.alts.includes(n) || (n.length >= 5 && it.alts.some(a => a.length >= 5 && lev(n, a) <= 1));
  const res = { ok, given: v.trim() };
  if (ok && !it.alts.includes(n)) res.msg = `Gairebé perfecte: s'escriu <b>${esc(it.w)}</b>.`;
  return res;
}
function icQ(it, qt) {
  const what = it.num ? 'el número' : 'la lletra';
  const base = { item: it, reveal: revealIC(it) };
  switch (qt) {
    case 'mc_l2w': {
      const opts = shuffle([it, ...distract(it, 3)]);
      return { ...base, kind: 'mc', tag: 'Lletra → INTERCO', xp: 6, srsKind: 'rec',
        options: opts.map(o => ({ html: `<span class="oc">${esc(o.w)}</span>`, ok: o === it })),
        prompt: `<div class="q-sub">Com es diu ${what}…</div><div class="q-code">${esc(it.sym)}</div>` };
    }
    case 'mc_w2l': {
      const opts = shuffle([it, ...distract(it, 3)]);
      return { ...base, kind: 'mc', optClass: 'codes', tag: 'INTERCO → lletra', xp: 6, srsKind: 'rec',
        options: opts.map(o => ({ html: `<span class="oc">${esc(o.sym)}</span>`, ok: o === it })),
        prompt: `<div class="q-sub">Quin${it.num ? ' número' : 'a lletra'} és…</div><div class="q-word">${esc(it.w)}</div>` };
    }
    case 'type_w2l':
      return { ...base, kind: 'type', caps: 'characters', ph: '?', tag: 'INTERCO → lletra', xp: 5, srsKind: 'rec',
        prompt: `<div class="q-sub">Escriu ${what} de…</div><div class="q-word">${esc(it.w)}</div>`,
        check: v => ({ ok: v.trim().toUpperCase() === it.sym, given: v.trim().toUpperCase() }) };
    case 'type_l2w':
    default:
      return { ...base, kind: 'type', wide: true, ph: 'Paraula INTERCO…', tag: 'Escriu en INTERCO', xp: 10, srsKind: 'prod',
        prompt: `<div class="q-sub">Com es diu ${what}…</div><div class="q-code">${esc(it.sym)}</div>`,
        check: v => icCheckWord(it, v) };
  }
}
function autoQ(it) {
  const b = box(it.id);
  return it.track === 'c3' ? c3Q(it, pick(C3_BY_BOX[b])) : icQ(it, pick(IC_BY_BOX[b]));
}
function introQ(it) {
  let html;
  if (it.track === 'c3') {
    const u = UNIT_BY_ID[it.unit];
    html = `<div class="intro-card"><div class="new">✨ CODI NOU · ${esc(u.name.toUpperCase())}</div>
      <div class="q-code">${esc(it.code)}</div>
      <div class="meaning">${esc(it.m)}</div>
      <div class="ex">📻 <b>Quan l'usaràs:</b> ${esc(it.s)}</div>
      ${it.h ? `<div class="hint">💡 ${esc(it.h)}</div>` : `<div class="hint">🧭 ${esc(u.pista)}</div>`}
      </div>`;
  } else {
    html = `<div class="intro-card"><div class="new">✨ NOU · INTERCO</div>
      <div class="q-code">${esc(it.sym)}</div>
      <div class="meaning">${esc(it.w)}</div>
      <div class="pron">Es pronuncia: <b>${esc(it.pr)}</b></div>
      ${canSpeak ? `<p><button class="speak" data-act="speak" data-text="${esc(it.w.replace('-', ' '))}">🔊 Escolta</button></p>` : ''}
      </div>`;
  }
  return { kind: 'intro', item: it, tag: 'Aprèn', prompt: html, onShow: () => { if (it.track === 'ic') speak(it.w.replace('-', ' ')); else sfx('squelch'); } };
}

/* =========================================================
   MOTOR DE JOC
   ========================================================= */
let R = null;
const quizOpen = () => $('#quiz').classList.contains('open');
function openQuiz() { const q = $('#quiz'); q.classList.add('open'); q.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
function hideQuiz() { const q = $('#quiz'); q.classList.remove('open'); q.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; hideFeedback(); }
function hideFeedback() { const f = $('#qFb'); f.className = 'feedback'; f.innerHTML = ''; }

function newRun(cfg) {
  return { cfg, i: 0, n: 0, ok: 0, ko: 0, xp: 0, combo: 0, maxCombo: 0, lives: cfg.lives || 0, t0: Date.now(), ups: {}, rq: {}, log: [], over: false };
}
function startRun(cfg) {
  if (R && R.timer) clearInterval(R.timer);
  R = newRun(cfg);
  cfg.init && cfg.init(R);
  openQuiz();
  if (cfg.time) { R.tEnd = Date.now() + cfg.time * 1000; R.timer = setInterval(tickTimer, 100); }
  nextQ();
}
function tickTimer() {
  if (!R || R.over) return;
  if (R.tEnd) { R.timeLeft = Math.max(0, (R.tEnd - Date.now()) / 1000); if (R.timeLeft <= 0) return finishRun(); }
  updateHud();
}
function nextQ() {
  if (!R || R.over) return;
  clearTimeout(R.autoT);
  hideFeedback();
  if (R.cfg.lives && R.lives <= 0) return finishRun();
  const q = R.cfg.next(R);
  if (!q) return finishRun();
  R.q = q; R.answered = false; R.qT = Date.now(); R.flipped = false;
  renderQ(q); updateHud();
}
function renderQ(q) {
  let ans = '';
  if (q.kind === 'mc') {
    ans = `<div class="opts ${q.optClass || ''}">${q.options.map((o, i) => `<button class="opt" data-act="opt" data-i="${i}"><kbd>${i + 1}</kbd><span>${o.html}</span></button>`).join('')}</div>`;
  } else if (q.kind === 'tf') {
    ans = `<div class="opts tf"><button class="opt" data-act="tf" data-v="1"><kbd>1</kbd>✓ Cert</button><button class="opt" data-act="tf" data-v="0"><kbd>2</kbd>✗ Fals</button></div>`;
  } else if (q.kind === 'type') {
    ans = `<form class="typeform" id="qForm" autocomplete="off" novalidate>
      <div class="inwrap ${q.wide ? 'wide' : ''}">${q.prefix ? `<span class="prefix">${q.prefix}</span>` : ''}<input id="qIn" type="text" placeholder="${esc(q.ph || '')}" autocomplete="off" autocorrect="off" autocapitalize="${q.caps || 'off'}" spellcheck="false" enterkeyhint="done" aria-label="Resposta"></div>
      ${q.prefix && S.stats.ans < 60 ? '<div class="helper">Escriu només el que va darrere de «3.» (ex: 70, 1 O, 22 M). Lletres en majúscula o minúscula.</div>' : ''}
      <div class="row"><button type="button" class="btn ghost" data-act="skip">No ho sé</button><button type="submit" class="btn primary">Comprovar</button></div></form>`;
  } else if (q.kind === 'intro') {
    ans = `<button class="btn primary big full" data-act="introNext">Entesos! Som-hi ▶</button>`;
  } else if (q.kind === 'flash') {
    ans = `<div id="flashBtns"><button class="btn soft big full" data-act="flip">Gira la targeta (Espai)</button></div>`;
  }
  $('#qBody').innerHTML = `<div class="q-wrap"><div class="q-tag">${q.tag || ''}</div><div class="q-prompt">${q.prompt}</div><div class="q-ans">${ans}</div></div>`;
  $('#qBody').scrollTop = 0;
  if (q.kind === 'type') {
    $('#qForm').addEventListener('submit', e => {
      e.preventDefault();
      const inp = $('#qIn');
      if (!inp.value.trim()) { inp.parentElement.classList.remove('shake'); void inp.offsetWidth; inp.parentElement.classList.add('shake'); inp.focus(); return; }
      submit(inp.value);
    });
    setTimeout(() => { const i = $('#qIn'); if (i) i.focus(); }, 60);
  }
  q.onShow && q.onShow();
}
function updateHud() {
  if (!R) return;
  const c = R.cfg;
  let p = c.progress ? c.progress(R) : 0;
  if (c.time) p = 1 - (R.timeLeft ?? c.time) / c.time;
  $('#qBar').style.width = Math.max(0, Math.min(1, p)) * 100 + '%';
  let h = '';
  if (R.combo >= 3) h += `<span class="h combo">🔥${R.combo}</span>`;
  if (c.lives) h += `<span class="h">${'❤️'.repeat(Math.max(0, R.lives))}${'🖤'.repeat(Math.max(0, c.lives - R.lives))}</span>`;
  if (c.time) { const t = Math.ceil(R.timeLeft ?? c.time); h += `<span class="h time ${t <= 10 ? 'low' : ''}">⏱ ${t}s</span>`; }
  if (c.score) h += `<span class="h">${c.score(R)}</span>`;
  $('#qHud').innerHTML = h;
}
function submit(v) {
  if (!R || R.answered || R.over || !R.q) return;
  const q = R.q;
  const res = v === null ? { ok: false, skipped: true } : (q.check ? q.check(v) : { ok: false });
  if (q.kind === 'mc' && v !== null) { res.ok = !!q.options[v].ok; res.chosen = v; }
  R.answered = true;
  applyResult(q, res);
}
function trackUp(id, ch) {
  const prev = R.ups[id];
  R.ups[id] = { from: prev ? prev.from : ch.before, to: ch.after };
}
function applyResult(q, res) {
  const ok = !!res.ok;
  R.prev = { combo: R.combo, lives: R.lives, snaps: {} };
  R.n++; S.stats.ans++;
  if (ok) {
    R.ok++; S.stats.ok++; R.combo++;
    R.maxCombo = Math.max(R.maxCombo, R.combo);
    S.stats.bestCombo = Math.max(S.stats.bestCombo, R.combo);
    if (R.combo > 0 && R.combo % 5 === 0) setTimeout(() => sfx('combo'), 180);
  } else {
    R.ko++; R.combo = 0;
    if (R.cfg.lives) R.lives--;
  }
  const ups = res.srs || (q.srsKind && q.item ? [{ id: q.item.id, ok, kind: q.srsKind }] : []);
  ups.forEach(u => { R.prev.snaps[u.id] = S.items[u.id] ? { ...S.items[u.id] } : null; trackUp(u.id, srsUpdate(u.id, u.ok, u.kind)); });
  let gain = 0;
  if (ok) {
    gain = q.xp || 8;
    gain += Math.min(10, Math.floor(R.combo / 5) * 2);
    if (q.kind !== 'flash' && Date.now() - R.qT < 6000) gain += 2;
  } else if (res.partialXp) gain = res.partialXp;
  R.lastGain = gain;
  if (gain) { R.xp += gain; addXp(gain); }
  R.cfg.onAnswer && R.cfg.onAnswer(R, ok, q, res);
  save();
  sfx(ok ? 'ok' : 'ko');
  if (q.kind === 'flash') return nextQ();
  showFeedback(q, res, ok, gain);
  updateHud();
}
function override() {
  if (!R || !R.prev) return;
  const q = R.q, p = R.prev;
  Object.entries(p.snaps).forEach(([id, s]) => { if (s) S.items[id] = s; else delete S.items[id]; });
  R.ko--; R.ok++; S.stats.ok++;
  R.combo = p.combo + 1; R.maxCombo = Math.max(R.maxCombo, R.combo); R.lives = p.lives;
  Object.keys(p.snaps).forEach(id => trackUp(id, srsUpdate(id, true, q.srsKind || 'prod')));
  const gain = q.xp || 8; R.xp += gain; addXp(gain);
  R.cfg.onOverride && R.cfg.onOverride(R, q);
  save(); sfx('ok');
  showFeedback(q, { ok: true, msg: "D'acord, la comptem com a bona. Compara-la amb la definició oficial:" }, true, gain);
  updateHud();
}
function showFeedback(q, res, ok, gain) {
  if (q.kind === 'mc') {
    $$('.opt').forEach((el, i) => { el.disabled = true; if (q.options[i].ok) el.classList.add('right'); if (i === res.chosen && !ok) el.classList.add('wrong'); });
  } else if (q.kind === 'tf') {
    $$('.opt').forEach(el => { el.disabled = true; const v = el.dataset.v === '1'; if (v === q.answer) el.classList.add('right'); else if (v === res.chosen) el.classList.add('wrong'); });
  } else if (q.kind === 'type') {
    const i = $('#qIn'); if (i) { i.disabled = true; i.blur(); i.parentElement.classList.remove('okk', 'koo'); i.parentElement.classList.add(ok ? 'okk' : 'koo'); }
    $$('#qForm button').forEach(b => b.disabled = true);
  }
  const head = ok ? `<span class="fb-ic">✓</span>${pick(PRAISE)}` : `<span class="fb-ic">✗</span>${res.skipped ? 'Aprèn-lo ara:' : 'Incorrecte'}`;
  let body = '';
  if (res.msg) body += `<p>${res.msg}</p>`;
  if (!ok && res.given && !res.msg && !res.skipped) body += `<p>La teva resposta: <b>${esc(res.given)}</b></p>`;
  if (res.detail) body += res.detail;
  body += `<div>${!ok ? '<span class="muted">Resposta correcta:</span>' : ''}${q.reveal || ''}</div>`;
  const over = (!ok && q.allowOverride && !res.skipped) ? '<button class="btn ghost" data-act="override">Ho tenia bé</button>' : '';
  const fb = $('#qFb');
  fb.className = 'feedback show ' + (ok ? 'ok' : 'ko') + (R.cfg.fast ? ' compact' : '');
  fb.innerHTML = `<div class="fb-in"><div class="fb-head">${head}${gain ? `<span class="fb-xp">+${gain} XP</span>` : ''}</div><div class="fb-body">${body}</div><div class="fb-actions">${over}<button class="btn ${ok ? 'ok' : 'ko'}" data-act="cont" id="qCont">Continuar ▶</button></div></div>`;
  R.fbAt = Date.now();
  if (R.cfg.fast) R.autoT = setTimeout(nextQ, ok ? 450 : 1700);
  else setTimeout(() => { const b = $('#qCont'); if (b) b.focus({ preventScroll: true }); }, 40);
}
function flip() {
  if (!R || !R.q || R.q.kind !== 'flash' || R.answered) return;
  const card = $('.flash'); if (!card) return;
  R.flipped = !R.flipped;
  card.classList.toggle('flipped', R.flipped);
  if (R.flipped) {
    $('#flashBtns').innerHTML = `<div class="opts tf"><button class="opt" data-act="selfgrade" data-v="0"><kbd>1</kbd>✗ No ho sabia</button><button class="opt" data-act="selfgrade" data-v="1"><kbd>2</kbd>✓ Ho sabia</button></div>`;
  }
}
function quitRun() {
  if (R && !R.over) {
    if (R.n > 0 && !confirm('Vols sortir? El progrés que has fet ja està desat.')) return;
    R.over = true; clearInterval(R.timer); clearTimeout(R.autoT);
    if (R.n > 0) { S.stats.sessions++; S.stats.timeMs += Date.now() - R.t0; save(); checkAch(); }
  }
  if (canSpeak) speechSynthesis.cancel();
  R = null; hideQuiz(); render();
}
function finishRun() {
  if (!R || R.over) return;
  R.over = true; clearInterval(R.timer); clearTimeout(R.autoT);
  hideFeedback();
  S.stats.sessions++; S.stats.timeMs += Date.now() - R.t0;
  R.cfg.onFinish && R.cfg.onFinish(R);
  save();
  const newAch = checkAch();
  renderResults(newAch);
}
function renderResults(newAch) {
  const c = R.cfg;
  $('#qBar').style.width = '100%';
  $('#qHud').innerHTML = '';
  const acc = pct(R.ok, R.n);
  const icon = c.resultIcon ? c.resultIcon(R) : (acc >= 90 ? '🏆' : acc >= 70 ? '🚑' : acc >= 40 ? '💪' : '📚');
  const title = c.resultTitle ? c.resultTitle(R) : (acc >= 90 ? 'Brutal!' : acc >= 70 ? 'Molt bon torn!' : acc >= 40 ? 'Anem millorant' : 'Cal repassar-ho');
  const statsArr = [['Encerts', `${R.ok}/${R.n}`], ['Precisió', acc + '%'], ['XP guanyada', '+' + R.xp], ['Millor ratxa', R.maxCombo]].concat(c.extraStats ? c.extraStats(R) : []);
  const ups = Object.entries(R.ups).filter(([, u]) => u.to !== u.from).sort((a, b) => b[1].to - a[1].to);
  const upHtml = ups.map(([id, u]) => {
    const it = BY_ID[id];
    return `<span class="up"><b>${esc(it.code)}</b> <span class="dot m${u.to}"></span> ${u.to > u.from ? '▲' : '▼'} ${MASTERY[u.to]}</span>`;
  }).join('');
  const mastered = ups.filter(([, u]) => u.to === 6 && u.from < 6).length;
  $('#qBody').innerHTML = `<div class="q-wrap results">
    <div class="big-ic">${icon}</div><h1>${esc(title)}</h1>
    ${R.levelUp ? `<p><b>⭐ Has pujat al nivell ${R.levelUp}: ${esc(titleFor(R.levelUp))}!</b></p>` : ''}
    ${mastered ? `<p><b>👑 Has dominat ${mastered} ${mastered === 1 ? 'codi nou' : 'codis nous'}!</b></p>` : ''}
    <div class="res-stats">${statsArr.map(([l, v]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
    ${upHtml ? `<div class="muted">Canvis de domini</div><div class="ups">${upHtml}</div>` : ''}
    ${newAch.length ? `<div class="muted">Assoliments desbloquejats</div><div class="ups">${newAch.map(a => `<span class="up">${a.icon} <b>${esc(a.name)}</b></span>`).join('')}</div>` : ''}
    <div class="res-actions">${c.again ? '<button class="btn primary big" data-act="again">Una altra! ↻</button>' : ''}<button class="btn soft big" data-act="quit">Sortir</button></div>
  </div>`;
  if (acc >= 90 && R.n >= 5) confetti();
}

/* =========================================================
   MODES DE JOC
   ========================================================= */
function poolFor(track, unitId) {
  return ITEMS.filter(i => i.track === track && (unitId ? i.unit === unitId : unitUnlocked(UNIT_BY_ID[i.unit])));
}
function buildSrs(track, unitId) {
  const SIZE = 12, now = Date.now();
  const pool = poolFor(track, unitId);
  const byWeak = (a, b) => box(a.id) - box(b.id) || st(a.id).due - st(b.id).due;
  const due = pool.filter(i => box(i.id) > 0 && st(i.id).due <= now).sort(byWeak);
  const fresh = pool.filter(i => box(i.id) === 0);
  let rev = due.slice(0, SIZE);
  const maxNew = unitId ? 7 : (track === 'ic' ? 6 : 4);
  const nNew = Math.min(maxNew, fresh.length, Math.max(0, SIZE - rev.length - 2));
  const news = fresh.slice(0, nNew);
  if (rev.length + news.length * 2 < SIZE) {
    const extra = pool.filter(i => box(i.id) > 0 && !rev.includes(i)).sort(byWeak);
    rev = rev.concat(extra.slice(0, SIZE - rev.length - news.length * 2));
  }
  const tasks = shuffle(rev).map(it => ({ it }));
  news.forEach((it, k) => {
    const pos = Math.min(tasks.length, k * 3);
    tasks.splice(pos, 0, { it, intro: true });
    tasks.splice(Math.min(tasks.length, pos + 2), 0, { it });
  });
  shuffle(news).forEach(it => tasks.push({ it }));
  return tasks;
}
function startSrs(track, unitId) {
  const tasks = buildSrs(track, unitId);
  if (!tasks.length) { toast('🤔', 'No hi ha codis disponibles', 'Prova una altra unitat.'); return; }
  const u = unitId && UNIT_BY_ID[unitId];
  startRun({
    again: () => startSrs(track, unitId),
    next(R) { const t = tasks[R.i++]; if (!t) return null; return t.intro ? introQ(t.it) : autoQ(t.it); },
    progress: R => (R.i - 1) / tasks.length,
    onAnswer(R, ok, q) {
      if (!ok && q.item) {
        const c = R.rq[q.item.id] || 0;
        if (c < 2) { R.rq[q.item.id] = c + 1; tasks.splice(Math.min(R.i + 2, tasks.length), 0, { it: q.item }); }
      }
    },
    resultTitle: R => (pct(R.ok, R.n) >= 90 ? 'Repàs perfecte!' : 'Repàs completat!') + (u ? ` · ${u.name}` : ''),
  });
}
function scopePool(track, scope) {
  const p = ITEMS.filter(i => i.track === track);
  if (scope === 'seen') { const s = p.filter(i => box(i.id) > 0); return s.length >= 6 ? s : p; }
  if (scope === 'weak') { const s = p.filter(i => box(i.id) > 0).sort((a, b) => box(a.id) - box(b.id) || st(b.id).ko - st(a.id).ko).slice(0, 15); return s.length >= 6 ? s : p; }
  if (scope === 'letters') return p.filter(i => !i.num);
  if (scope === 'nums') return p.filter(i => i.num);
  if (scope && scope !== 'all' && UNIT_BY_ID[scope]) return p.filter(i => i.unit === scope);
  return p;
}
function drawer(pool) { let bag = []; return () => { if (!bag.length) bag = shuffle(pool); return bag.pop(); }; }

function startTimed(scope, diff) {
  const draw = drawer(scopePool('c3', scope)), key = 'timed_' + diff;
  startRun({
    time: 60, fast: true, again: () => startTimed(scope, diff),
    next: () => diff === 'type' ? c3Q(draw(), pick(['type_code', 'type_code', 'type_scen'])) : c3Q(draw(), pick(['mc_mean2code', 'mc_code2mean', 'mc_scen'])),
    score: R => `✓ ${R.ok}`,
    onFinish(R) { R.record = R.ok > (S.best[key] || 0); if (R.record) S.best[key] = R.ok; if (R.ok >= 20) S.stats.speed20 = 1; },
    extraStats: () => [['Rècord', S.best[key] || 0]],
    resultIcon: R => R.record ? '🏆' : '⏱️',
    resultTitle: R => R.record ? 'Nou rècord!' : 'Temps!',
  });
}
function startSurvival(scope) {
  const draw = drawer(scopePool('c3', scope));
  startRun({
    lives: 3, again: () => startSurvival(scope),
    next(R) {
      const it = draw(), s = R.ok;
      const types = s < 6 ? ['mc_code2mean', 'mc_mean2code', 'tf'] : s < 14 ? ['mc_scen', 'mc_mean2code', 'type_code'] : s < 24 ? ['type_code', 'type_scen', 'mc_scen'] : ['type_code', 'type_scen', 'type_scen'];
      return c3Q(it, pick(types));
    },
    score: R => `★ ${R.ok}`,
    onFinish(R) { R.record = R.ok > (S.best.surv || 0); if (R.record) S.best.surv = R.ok; },
    extraStats: () => [['Rècord', S.best.surv || 0]],
    resultIcon: R => R.record ? '🏆' : '💀',
    resultTitle: R => R.record ? `Nou rècord: ${R.ok}!` : `Has aguantat ${R.ok} preguntes`,
  });
}
function startExpert(scope) {
  const pool = shuffle(scopePool('c3', scope)).slice(0, 10);
  startRun({
    again: () => startExpert(scope),
    next: R => { const it = pool[R.i++]; return it ? c3Q(it, 'type_mean') : null; },
    progress: R => (R.i - 1) / pool.length,
  });
}
function startStory(si) {
  const story = STORIES[si];
  startRun({
    again: () => startStory(si),
    next(R) {
      const step = story.steps[R.i]; if (!step) return null;
      R.i++; R.step = step;
      const it = C3_BY_SFX[normCode(step.c)];
      const q = c3Q(it, 'type_code');
      q.tag = `${story.icon} ${story.t} · ${R.i}/${story.steps.length}`;
      q.xp = 12;
      q.prompt = `<div class="radio-log">${R.log.map(l => `<div class="rl ${l.ok ? 'ok' : 'ko'}"><span>${esc(l.t)}</span><span class="rl-c">${esc(l.code)}</span></div>`).join('')}</div>
        <div class="q-sub">Quin codi correspon?</div><div class="q-scen"><span class="ri">📻</span><span>${esc(step.t)}</span></div>`;
      q.onShow = () => sfx('squelch');
      return q;
    },
    progress: R => (R.i - 1) / story.steps.length,
    onAnswer(R, ok, q) { R.log.push({ t: R.step.t, code: q.item.code, ok }); },
    onFinish(R) { if (R.ko === 0 && R.n === story.steps.length) { S.stats.perfectStory++; S.best['story_' + si] = 1; } },
    resultIcon: R => R.ko === 0 ? '📻' : '🚑',
    resultTitle: R => R.ko === 0 ? 'Torn impecable!' : 'Torn acabat',
  });
}
function flashQ(it) {
  const reverse = it.track === 'c3' && box(it.id) >= 2 && Math.random() < .5;
  let front, back;
  if (it.track === 'c3') {
    const codeFace = `<div class="q-code">${esc(it.code)}</div>`;
    const meanFace = `<div class="q-mean">${esc(it.m)}</div>`;
    front = reverse ? `<div class="q-sub">Quin codi és?</div>${meanFace}` : `<div class="q-sub">Què vol dir?</div>${codeFace}`;
    back = (reverse ? codeFace : meanFace) + `<div class="ex">📻 ${esc(it.s)}</div>`;
  } else {
    front = `<div class="q-sub">Com es diu en INTERCO?</div><div class="q-code">${esc(it.sym)}</div>`;
    back = `<div class="q-word">${esc(it.w)}</div><div class="pron">${esc(it.pr)}</div>`;
  }
  return {
    kind: 'flash', item: it, tag: 'Targetes', xp: 3, srsKind: 'rec',
    prompt: `<div class="flash" data-act="flip"><div class="flash-in"><div class="flash-face">${front}<span class="tap">Toca per girar</span></div><div class="flash-face back">${back}</div></div></div>`,
    check: v => ({ ok: v }),
  };
}
function startFlash(track, scope) {
  const pool = shuffle(scopePool(track, scope)).slice(0, 20);
  startRun({
    again: () => startFlash(track, scope),
    next: R => { const it = pool[R.i++]; return it ? flashQ(it) : null; },
    progress: R => (R.i - 1) / pool.length,
    resultTitle: () => 'Targetes repassades',
  });
}

/* ---- Parelles ---- */
function startPairs(scope) {
  const pool = shuffle(scopePool('c3', scope)).slice(0, 15);
  if (pool.length < 3) { toast('🤔', 'Calen més codis per jugar'); return; }
  const rounds = [];
  for (let i = 0; i < pool.length; i += 5) rounds.push(pool.slice(i, i + 5));
  if (rounds.length > 1 && rounds[rounds.length - 1].length < 3) { const last = rounds.pop(); rounds[rounds.length - 1].push(...last); }
  if (R && R.timer) clearInterval(R.timer);
  R = newRun({
    again: () => startPairs(scope),
    score: R => `⏱ ${Math.floor((Date.now() - R.t0) / 1000)}s · ✗${R.ko}`,
    progress: R => R.ok / pool.length,
    onFinish(R) {
      R.secs = Math.round((Date.now() - R.t0) / 1000);
      if (R.ko === 0) S.stats.perfectPairs++;
      if (pool.length === 15 && R.ko === 0) { R.record = !S.best.pairs || R.secs < S.best.pairs; if (R.record) S.best.pairs = R.secs; }
    },
    extraStats: R => [['Temps', R.secs + ' s'], ['Rècord (sense errors)', S.best.pairs ? S.best.pairs + ' s' : '—']],
    resultIcon: R => R.ko === 0 ? '🧩' : '🧠',
    resultTitle: R => R.record ? 'Nou rècord!' : R.ko === 0 ? 'Parelles perfectes!' : 'Parelles completades',
  });
  R.rounds = rounds; R.round = 0; R.failed = new Set(); R.sel = null; R.left = 0; R.isPairs = true;
  openQuiz();
  R.timer = setInterval(updateHud, 500);
  renderPairs();
}
function renderPairs() {
  const items = R.rounds[R.round];
  R.left = items.length;
  const L = shuffle(items), Rr = shuffle(items);
  $('#qBody').innerHTML = `<div class="q-wrap"><div class="q-tag">🧩 Parelles · ronda ${R.round + 1}/${R.rounds.length}</div>
    <div class="q-sub">Toca un codi i després el seu significat.</div>
    <div class="pairs"><div class="pcol">${L.map(it => `<button class="pcard code" data-act="pair" data-side="L" data-id="${it.id}">${esc(it.code)}</button>`).join('')}</div>
    <div class="pcol">${Rr.map(it => `<button class="pcard mean" data-act="pair" data-side="R" data-id="${it.id}">${esc(it.m)}</button>`).join('')}</div></div></div>`;
  updateHud();
}
function pairClick(d, el) {
  if (!R || !R.isPairs || R.over || el.classList.contains('done')) return;
  if (!R.sel || R.sel.side === d.side) {
    $$('.pcard.sel').forEach(x => x.classList.remove('sel'));
    el.classList.add('sel'); R.sel = { side: d.side, id: d.id, el }; sfx('click'); return;
  }
  const a = R.sel; R.sel = null; a.el.classList.remove('sel');
  if (a.id === d.id) {
    a.el.classList.add('done'); el.classList.add('done');
    R.n++; R.ok++; R.combo++; R.maxCombo = Math.max(R.maxCombo, R.combo);
    S.stats.ans++; S.stats.ok++; S.stats.bestCombo = Math.max(S.stats.bestCombo, R.combo);
    if (!R.failed.has(d.id)) trackUp(d.id, srsUpdate(d.id, true, 'rec'));
    R.xp += 5; addXp(5); sfx('ok'); save();
    if (--R.left === 0) {
      R.round++;
      if (R.round >= R.rounds.length) setTimeout(finishRun, 400);
      else setTimeout(renderPairs, 450);
    }
  } else {
    R.n++; R.ko++; R.combo = 0; S.stats.ans++;
    const codeId = a.side === 'L' ? a.id : d.id;
    R.failed.add(codeId);
    [a.el, el].forEach(x => { x.classList.remove('bad'); void x.offsetWidth; x.classList.add('bad'); setTimeout(() => x.classList.remove('bad'), 450); });
    sfx('ko');
  }
  updateHud();
}

/* ---- INTERCO: deletrejar, desxifrar, escoltar, contrarellotge ---- */
function randomPlate() {
  const L = 'BCDFGHJKLMNPRSTVWXYZ', d = () => rnd(10);
  return `${d()}${d()}${d()}${d()} ${L[rnd(L.length)]}${L[rnd(L.length)]}${L[rnd(L.length)]}`;
}
function spellTarget() { return Math.random() < .25 ? { word: randomPlate(), plate: true } : { word: pick(SPELL_WORDS), plate: false }; }
const lettersOf = w => [...w].filter(ch => /[A-Z]/.test(ch));
function spellTokens(v) {
  return normText(String(v).replace(/x[\s-]+ray/gi, 'xray').replace(/nada\s+zero/gi, 'nadazero')).split(' ').filter(Boolean);
}
function spellQ() {
  const t = spellTarget(), letters = lettersOf(t.word);
  return {
    kind: 'type', wide: true, tag: '🗣️ Deletreja', xp: 3 * letters.length, ph: 'Ex: Sierra Echo Mike',
    prompt: `<div class="q-sub">${t.plate ? 'Deletreja les lletres de la matrícula:' : 'Deletreja en INTERCO:'}</div><div class="q-word">${esc(t.word)}</div>`,
    reveal: `<div class="rv"><span>${letters.map(L => `<b>${L}</b> ${esc(BY_ID['i:' + L].w)}`).join(' · ')}</span></div>`,
    check(v) {
      const toks = spellTokens(v);
      const per = letters.map((L, i) => { const it = BY_ID['i:' + L]; const tk = toks[i] || ''; return { L, it, tk, ok: it.alts.includes(tk) || (tk.length >= 5 && it.alts.some(a => a.length >= 5 && lev(tk, a) <= 1)) }; });
      const ok = per.every(p => p.ok) && toks.length === letters.length;
      const detail = `<div class="spell-tbl">${per.map(p => `<span class="${p.ok ? 'y' : 'n'}">${p.L}: ${esc(p.tk || '—')}</span>`).join('')}</div>`;
      return { ok, given: v, detail, srs: per.map(p => ({ id: p.it.id, ok: p.ok, kind: 'prod' })), partialXp: per.filter(p => p.ok).length };
    },
  };
}
function decodeQ(listen) {
  const t = spellTarget(), letters = lettersOf(t.word);
  const words = letters.map(L => BY_ID['i:' + L].w);
  const spoken = words.map(w => w.replace('-', ' ')).join('. ');
  return {
    kind: 'type', caps: 'characters', tag: listen ? '🎧 Escolta i escriu' : '🔍 Desxifra', xp: 2 * letters.length + (listen ? 4 : 0),
    ph: 'Lletres…',
    prompt: listen
      ? `<div class="q-sub">Escolta el missatge i escriu les lletres:</div><p><button class="btn soft big" data-act="speak" data-text="${esc(spoken)}">🔊 Torna-ho a escoltar</button></p>`
      : `<div class="q-sub">Quina paraula s'ha deletrejat?</div><div class="q-mean">${words.map(esc).join(' · ')}</div>`,
    reveal: `<div class="rv"><span class="rv-code">${letters.join('')}</span><span>${words.map(esc).join(' · ')}</span></div>`,
    onShow: listen ? () => setTimeout(() => speak(spoken), 300) : null,
    check(v) {
      const g = v.toUpperCase().replace(/[^A-Z]/g, '');
      const per = letters.map((L, i) => ({ id: 'i:' + L, ok: g[i] === L, kind: 'rec' }));
      return { ok: g === letters.join(''), given: g, srs: per };
    },
  };
}
function startSpell() {
  startRun({
    again: startSpell,
    next: R => R.i++ < 8 ? spellQ() : null,
    progress: R => (R.i - 1) / 8,
    onFinish(R) { if (R.ko === 0) S.stats.spellPerfect++; },
    resultTitle: R => R.ko === 0 ? 'Deletreig perfecte!' : 'Deletreig acabat',
  });
}
function startDecode(listen) {
  if (listen && !canSpeak) { toast('🔇', 'El teu navegador no pot parlar'); return; }
  startRun({
    again: () => startDecode(listen),
    next: R => R.i++ < 8 ? decodeQ(listen) : null,
    progress: R => (R.i - 1) / 8,
  });
}
function startTimedIC(scope) {
  const draw = drawer(scopePool('ic', scope)), key = 'timedIC_' + scope;
  startRun({
    time: 60, fast: true, again: () => startTimedIC(scope),
    next: () => icQ(draw(), 'type_l2w'),
    score: R => `✓ ${R.ok}`,
    onFinish(R) { R.record = R.ok > (S.best[key] || 0); if (R.record) S.best[key] = R.ok; },
    extraStats: () => [['Rècord', S.best[key] || 0]],
    resultIcon: R => R.record ? '🏆' : '⏱️',
    resultTitle: R => R.record ? 'Nou rècord!' : 'Temps!',
  });
}

/* ---- Pantalla prèvia (escollir àmbit i dificultat) ---- */
const GAMES = {
  timed: { icon: '⏱️', name: 'Contrarellotge', desc: '60 segons. Encerta tants codis com puguis.', track: 'c3', diff: true, best: () => Math.max(S.best.timed_mc || 0, S.best.timed_type || 0) ? `Rècord: ${S.best.timed_mc || 0} (opcions) · ${S.best.timed_type || 0} (escrivint)` : '' , start: (s, d) => startTimed(s, d) },
  surv: { icon: '❤️', name: 'Supervivència', desc: '3 vides. Cada cop més difícil. Fins on arribaràs?', track: 'c3', best: () => S.best.surv ? `Rècord: ${S.best.surv}` : '', start: s => startSurvival(s) },
  story: { icon: '📻', name: 'Torn de guàrdia', desc: 'Viu serveis complets i transmet cada codi com a la ràdio.', track: 'c3', best: () => { const n = STORIES.filter((_, i) => S.best['story_' + i]).length; return n ? `${n}/${STORIES.length} torns impecables` : ''; } },
  pairs: { icon: '🧩', name: 'Parelles', desc: 'Uneix codis i significats tan ràpid com puguis.', track: 'c3', best: () => S.best.pairs ? `Rècord: ${S.best.pairs} s` : '', start: s => startPairs(s) },
  expert: { icon: '✍️', name: 'Mode expert', desc: "Et dono el codi i n'escrius el significat amb les teves paraules.", track: 'c3', start: s => startExpert(s) },
  flash: { icon: '🃏', name: 'Targetes', desc: 'Repàs ràpid: gira la targeta i sigues sincer/a.', track: 'c3', start: s => startFlash('c3', s) },
  spell: { icon: '🗣️', name: 'Deletreja', desc: 'Paraules i matrícules: escriu-les en INTERCO.', track: 'ic', noScope: true, best: () => S.stats.spellPerfect ? `${S.stats.spellPerfect} rondes perfectes` : '', start: () => startSpell() },
  decode: { icon: '🔍', name: 'Desxifra', desc: 'Llegeixes «Sierra Echo Mike» i escrius SEM.', track: 'ic', noScope: true, start: () => startDecode(false) },
  listen: { icon: '🎧', name: 'Escolta', desc: 'Com a la ràdio: escolta el deletreig i escriu-lo.', track: 'ic', noScope: true, needsVoice: true, start: () => startDecode(true) },
  timedIC: { icon: '⚡', name: 'Contrarellotge INTERCO', desc: '60 segons: lletra → paraula INTERCO.', track: 'ic', best: () => S.best.timedIC_letters ? `Rècord: ${S.best.timedIC_letters}` : '', start: s => startTimedIC(s) },
  flashIC: { icon: '🃏', name: 'Targetes INTERCO', desc: "Repassa l'alfabet amb targetes.", track: 'ic', start: s => startFlash('ic', s) },
};
let PG = {};
function pregame(id) {
  const g = GAMES[id];
  if (id === 'story') return storyPicker();
  if (g.noScope) return g.start();
  const seen = ITEMS.filter(i => i.track === g.track && box(i.id) > 0).length;
  PG = { id, scope: g.track === 'ic' ? 'letters' : (seen >= 6 ? 'seen' : 'all'), diff: 'mc' };
  renderPregame();
}
function renderPregame() {
  const g = GAMES[PG.id];
  const seen = ITEMS.filter(i => i.track === g.track && box(i.id) > 0).length;
  const scopes = g.track === 'c3'
    ? [['seen', `Codis que ja he vist (${seen})`], ['weak', 'Els meus punts febles'], ['all', 'Tots (61)'], ...unitsOf('c3').map(u => [u.id, `${u.icon} ${u.name}`])]
    : [['letters', 'Lletres A–Z'], ['nums', 'Números'], ['all', 'Tot']];
  const chip = (k, v, l) => `<button class="${PG[k] === v ? 'on' : ''}" data-act="pg" data-k="${k}" data-v="${v}">${esc(l)}</button>`;
  openModal(`<div style="font-size:40px">${g.icon}</div><h2>${esc(g.name)}</h2><p class="muted">${esc(g.desc)}</p>
    <div class="opt-group"><b>Què vols practicar?</b><div class="chipsel">${scopes.map(([v, l]) => chip('scope', v, l)).join('')}</div>
    ${PG.scope === 'seen' && seen < 6 ? '<p class="muted">Encara has vist pocs codis: es faran servir tots.</p>' : ''}</div>
    ${g.diff ? `<div class="opt-group"><b>Dificultat</b><div class="chipsel">${chip('diff', 'mc', 'Amb opcions')}${chip('diff', 'type', 'Escrivint el codi (expert)')}</div></div>` : ''}
    <button class="btn primary big full" data-act="pgStart">Començar ▶</button>`);
}
function storyPicker() {
  openModal(`<div style="font-size:40px">📻</div><h2>Torn de guàrdia</h2><p class="muted">Serveis complets, pas a pas. Escriu el codi que correspon a cada moment. Aconsegueix-los tots sense errors!</p>
    <div class="story-list">${STORIES.map((s, i) => `<button class="story" data-act="story" data-i="${i}"><span class="si">${s.icon}</span><span><b>${esc(s.t)}</b><small>${s.steps.length} comunicacions</small></span>${S.best['story_' + i] ? '<span class="done">✓</span>' : ''}</button>`).join('')}</div>`);
}

/* =========================================================
   ASSOLIMENTS
   ========================================================= */
const allB = (list, b) => list.every(i => box(i.id) >= b);
const ACH = [
  { id: 'first', icon: '🚑', name: 'Primera sortida', desc: 'Completa la primera sessió', t: () => S.stats.sessions >= 1 },
  { id: 'c10', icon: '🔥', name: 'Ratxa x10', desc: '10 encerts seguits', t: () => S.stats.bestCombo >= 10 },
  { id: 'c25', icon: '☄️', name: 'Imparable', desc: '25 encerts seguits', t: () => S.stats.bestCombo >= 25 },
  { id: 'c50', icon: '🌋', name: 'En flama', desc: '50 encerts seguits', t: () => S.stats.bestCombo >= 50 },
  { id: 'seen', icon: '👀', name: "Ho he vist tot", desc: 'Veure els 61 codis del Codi 3', t: () => allB(C3, 1) },
  { id: 'recall', icon: '🧠', name: 'Memòria activa', desc: 'Tots els codis a «Recordat» o més', t: () => allB(C3, 3) },
  { id: 'unit', icon: '⭐', name: 'Unitat dominada', desc: "Domina tots els codis d'una unitat", t: () => unitsOf('c3').some(u => u.ids.every(id => box(id) >= 6)) },
  { id: 'm10', icon: '🎖️', name: '10 dominats', desc: 'Domina 10 codis', t: () => trackStats('c3').mastered >= 10 },
  { id: 'm30', icon: '🏅', name: 'Mig camí', desc: 'Domina 30 codis', t: () => trackStats('c3').mastered >= 30 },
  { id: 'master', icon: '👑', name: 'Mestre del Codi 3', desc: 'Domina els 61 codis', t: () => allB(C3, 6) },
  { id: 'abc', icon: '🔤', name: 'Alfabet complet', desc: 'Domina les 26 lletres INTERCO', t: () => allB(IC_LETTERS, 6) },
  { id: 'abcSeen', icon: '📖', name: 'Lletrista', desc: 'Veure totes les lletres INTERCO', t: () => allB(IC_LETTERS, 1) },
  { id: 'speed', icon: '⏱️', name: 'Velocista', desc: '20 encerts en una contrarellotge', t: () => !!S.stats.speed20 },
  { id: 'surv', icon: '❤️', name: 'Supervivent', desc: '25 punts a Supervivència', t: () => (S.best.surv || 0) >= 25 },
  { id: 'story', icon: '📻', name: 'Torn impecable', desc: 'Un torn de guàrdia sense errors', t: () => S.stats.perfectStory >= 1 },
  { id: 'allStories', icon: '🎙️', name: 'Veu de la xarxa', desc: 'Tots els torns sense errors', t: () => STORIES.every((_, i) => S.best['story_' + i]) },
  { id: 'pairs', icon: '🧩', name: 'Parelles perfectes', desc: 'Parelles sense cap error', t: () => S.stats.perfectPairs >= 1 },
  { id: 'spell', icon: '🗣️', name: 'Deletreig perfecte', desc: 'Una ronda de Deletreja sense errors', t: () => S.stats.spellPerfect >= 1 },
  { id: 's3', icon: '📅', name: 'Constància', desc: '3 dies seguits', t: () => S.streak.n >= 3 },
  { id: 's7', icon: '🗓️', name: 'Hàbit creat', desc: '7 dies seguits', t: () => S.streak.n >= 7 },
  { id: 's30', icon: '🏔️', name: 'Constància de ferro', desc: '30 dies seguits', t: () => S.streak.n >= 30 },
  { id: 'l5', icon: '🎓', name: 'TTS expert/a', desc: 'Arriba al nivell 5', t: () => lvlInfo(S.xp).L >= 5 },
  { id: 'l10', icon: '🛰️', name: 'Operador/a de ràdio', desc: 'Arriba al nivell 10', t: () => lvlInfo(S.xp).L >= 10 },
  { id: 'a500', icon: '💯', name: '500 respostes', desc: 'Respon 500 preguntes', t: () => S.stats.ans >= 500 },
  { id: 'night', icon: '🌙', name: 'Guàrdia nocturna', desc: 'Estudia entre les 0 h i les 6 h', t: () => { const h = new Date().getHours(); return h < 6 && S.stats.sessions > 0; } },
];
function checkAch() {
  const out = [];
  ACH.forEach(a => { if (!S.ach[a.id]) { let ok = false; try { ok = a.t(); } catch (e) { ok = false; } if (ok) { S.ach[a.id] = Date.now(); out.push(a); } } });
  if (out.length) {
    save(); sfx('ach');
    out.forEach((a, i) => setTimeout(() => toast(a.icon, 'Assoliment: ' + a.name, a.desc), i * 500));
  }
  return out;
}

/* =========================================================
   VISTES
   ========================================================= */
let VIEW = 'home', REF_TAB = 'c3', REF_Q = '';
function go(v) {
  VIEW = v;
  $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  render(); window.scrollTo(0, 0);
}
function render() {
  updateHeader();
  $('#main').innerHTML = VIEWS[VIEW]();
  if (VIEW === 'ref') { const i = $('#refSearch'); if (i) { i.value = REF_Q; i.addEventListener('input', () => { REF_Q = i.value; $('#refList').innerHTML = refList(); }); } }
}
function greeting() { const h = new Date().getHours(); return h < 6 ? 'Bona guàrdia nocturna' : h < 14 ? 'Bon dia' : h < 21 ? 'Bona tarda' : 'Bona nit'; }
function masteryBar(s, label) {
  return `<div class="mbar-row"><div class="mbar-head"><span>${label}</span><span>${s.mastered}/${s.n} dominats · ${s.pct}%</span></div>
    <div class="mbar">${[6, 5, 4, 3, 2, 1].map(b => s.counts[b] ? `<i class="m${b}" style="width:${s.counts[b] / s.n * 100}%" title="${MASTERY[b]}: ${s.counts[b]}"></i>` : '').join('')}</div></div>`;
}
const legend = () => `<div class="legend">${MASTERY.map((m, b) => `<span><i class="dot m${b}"></i>${m}</span>`).join('')}</div>`;

const VIEWS = {
  home() {
    const c3 = trackStats('c3'), ic = trackStats('ic'), li = lvlInfo(S.xp);
    const dC = dueCount('c3'), nC = newAvail('c3'), dI = dueCount('ic'), nI = newAvail('ic');
    const off = 264 * (1 - Math.min(1, S.day.xp / S.goal));
    const weak = C3.filter(i => st(i.id).ko > 0 && box(i.id) < 6).sort((a, b) => (st(b.id).ko - st(b.id).ok * .3) - (st(a.id).ko - st(a.id).ok * .3)).slice(0, 8);
    const tipU = pick(UNITS.filter(u => u.track === 'c3'));
    const fresh = S.stats.ans === 0;
    return `
    <section class="hero">
      <div><div class="hello">${greeting()}! 👋</div><h1>${fresh ? 'Comencem el torn' : esc(titleFor(li.L))}</h1>
      <p>${fresh ? 'Aprendràs el Codi 3 del SEM i el codi INTERCO pas a pas. Primer el reconeixeràs, després l\'escriuràs de memòria, i al final el dominaràs.' : `Nivell ${li.L} · ${li.into}/${li.need} XP fins al següent nivell. ${c3.mastered ? `Ja domines ${c3.mastered} codis.` : ''}`}</p></div>
      <div class="goal"><div class="goal-ring"><svg viewBox="0 0 96 96"><circle class="bg" cx="48" cy="48" r="42"/><circle class="fg" cx="48" cy="48" r="42" stroke-dasharray="264" stroke-dashoffset="${off}"/></svg>
        <div class="val"><div>${S.day.xp}<small>/${S.goal} XP</small></div></div></div><div class="lbl">Objectiu d'avui${streakNow() ? ` · 🔥 ${streakNow()} dies` : ''}</div></div>
    </section>
    <section class="cta-grid">
      <button class="cta c3" data-act="srs" data-track="c3">${dC ? `<span class="badge">${dC}</span>` : ''}
        <span class="cta-ic">3.</span><span><b>Repàs intel·ligent · Codi 3</b><span class="sub">${dC ? `${dC} per repassar` : 'Res pendent'}${nC ? ` · ${Math.min(nC, 4)} codis nous` : ''}</span></span><span class="cta-go">▶</span></button>
      <button class="cta ic" data-act="srs" data-track="ic">${dI ? `<span class="badge">${dI}</span>` : ''}
        <span class="cta-ic">AB</span><span><b>Repàs intel·ligent · INTERCO</b><span class="sub">${dI ? `${dI} per repassar` : 'Res pendent'}${nI ? ` · ${Math.min(nI, 6)} lletres noves` : ''}</span></span><span class="cta-go">▶</span></button>
    </section>
    <div class="section-title"><h2>El teu domini</h2><small>Per dominar un codi l'has d'escriure de memòria en dies diferents</small></div>
    <section class="card">${masteryBar(c3, 'Codi 3')}${masteryBar(ic, 'INTERCO')}${legend()}</section>
    ${weak.length ? `<div class="section-title"><h2>Codis a reforçar</h2><button class="btn ghost" data-act="mode" data-mode="surv">Practicar</button></div>
      <section class="card"><div class="chips">${weak.map(i => `<button class="code-chip" data-act="item" data-id="${i.id}"><b>${esc(i.code)}</b><span class="dot m${box(i.id)}"></span></button>`).join('')}</div></section>` : ''}
    <div class="section-title"><h2>Juga</h2><button class="btn ghost" data-act="nav" data-view="games">Tots els jocs ›</button></div>
    <div class="games">${['story', 'timed', 'surv'].map(gameCard).join('')}</div>
    <div class="section-title"><h2>💡 Pista</h2></div>
    <section class="card tip"><p><b>${tipU.icon} ${esc(tipU.name)}:</b> ${esc(tipU.pista)}</p></section>`;
  },
  path() {
    const sect = track => {
      const us = unitsOf(track);
      return `<div class="track-head"><span class="tbadge ${track}">${track === 'c3' ? '3.' : 'AB'}</span><div><h2>${track === 'c3' ? 'Codi 3' : 'Codi INTERCO'}</h2><small class="muted">${track === 'c3' ? '10 unitats · 61 codis' : '4 unitats · 26 lletres + 10 números'}</small></div></div>
      <div class="path">${us.map(u => {
        const p = unitProgress(u), lk = !unitUnlocked(u);
        const preview = u.ids.map(id => BY_ID[id].code).join(' · ');
        return `<button class="unit ${lk ? 'locked' : ''} ${p.stars === 3 ? 'done' : ''}" data-act="unit" data-id="${u.id}">
          <span class="u-ring" style="--p:${p.pct}"><span>${lk ? '🔒' : u.icon}</span></span>
          <span class="u-info"><b>${u.idx + 1}. ${esc(u.name)}</b><small>${esc(preview)}</small>
          <span class="stars">${[1, 2, 3].map(s => `<span class="${p.stars >= s ? '' : 'off'}">★</span>`).join('')}</span></span>
          <span class="u-pct">${p.pct}%</span></button>`;
      }).join('')}</div>`;
    };
    return `<p class="muted">Cada unitat té 3 estrelles: ★ tots vistos · ★★ tots «Après» · ★★★ tots «Dominats». La unitat següent es desbloqueja quan tots els codis de l'anterior estan com a mínim a «Reconegut».</p>
      ${sect('c3')}<div style="height:28px"></div>${sect('ic')}`;
  },
  games() {
    const c3g = ['story', 'timed', 'surv', 'pairs', 'expert', 'flash'], icg = ['spell', 'decode', 'listen', 'timedIC', 'flashIC'];
    return `<div class="section-title" style="margin-top:4px"><h2>Codi 3</h2></div><div class="games">${c3g.map(gameCard).join('')}</div>
      <div class="section-title"><h2>INTERCO</h2></div><div class="games">${icg.map(gameCard).join('')}</div>`;
  },
  ref() {
    return `<div class="seg"><button class="${REF_TAB === 'c3' ? 'on' : ''}" data-act="refTab" data-t="c3">Codi 3</button><button class="${REF_TAB === 'ic' ? 'on' : ''}" data-act="refTab" data-t="ic">INTERCO</button></div>
      <input id="refSearch" class="search" type="search" placeholder="Cerca per codi o paraula (ex: policia, 3.7, Sierra)…" autocomplete="off">
      <div id="refList">${refList()}</div>`;
  },
  profile() {
    const li = lvlInfo(S.xp), c3 = trackStats('c3'), ic = trackStats('ic');
    const hrs = Math.round(S.stats.timeMs / 60000);
    const sw = (k, on) => `<button class="switch ${on ? 'on' : ''}" data-act="set" data-k="${k}" aria-pressed="${on}" aria-label="${k}"></button>`;
    const themeChip = (v, l) => `<button class="${S.set.theme === v ? 'on' : ''}" data-act="theme" data-v="${v}">${l}</button>`;
    const goalChip = v => `<button class="${S.goal === v ? 'on' : ''}" data-act="goal" data-v="${v}">${v} XP</button>`;
    return `
    <section class="card lvl-card"><div class="lvl-big">${li.L}</div><div style="flex:1"><h2>${esc(titleFor(li.L))}</h2><div class="muted">${S.xp} XP en total · ${li.into}/${li.need} cap al nivell ${li.L + 1}</div><div class="xpline"><i style="width:${li.p * 100}%"></i></div></div></section>
    <div class="section-title"><h2>Estadístiques</h2></div>
    <div class="stats">
      <div class="stat"><b>${S.stats.ans}</b><span>Respostes</span></div>
      <div class="stat"><b>${pct(S.stats.ok, S.stats.ans)}%</b><span>Precisió</span></div>
      <div class="stat"><b>${S.stats.bestCombo}</b><span>Millor ratxa</span></div>
      <div class="stat"><b>${streakNow()} 🔥</b><span>Dies seguits</span></div>
      <div class="stat"><b>${c3.mastered}/61</b><span>Codi 3 dominats</span></div>
      <div class="stat"><b>${ic.mastered}/36</b><span>INTERCO dominats</span></div>
      <div class="stat"><b>${S.stats.sessions}</b><span>Sessions</span></div>
      <div class="stat"><b>${hrs} min</b><span>Temps d'estudi</span></div>
    </div>
    <div class="section-title"><h2>Mapa de domini · Codi 3</h2></div>
    <section class="card"><div class="heat">${C3.map(i => `<button class="m${box(i.id)}" data-act="item" data-id="${i.id}" title="${esc(i.m)}">${esc(i.code.replace(' ', ''))}</button>`).join('')}</div>${legend()}</section>
    <div class="section-title"><h2>Mapa de domini · INTERCO</h2></div>
    <section class="card"><div class="heat">${IC.map(i => `<button class="m${box(i.id)}" data-act="item" data-id="${i.id}" title="${esc(i.w)}">${esc(i.sym)}</button>`).join('')}</div></section>
    <div class="section-title"><h2>Assoliments</h2><small>${Object.keys(S.ach).length}/${ACH.length}</small></div>
    <div class="achs">${ACH.map(a => `<div class="ach ${S.ach[a.id] ? '' : 'off'}"><div class="ai">${a.icon}</div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></div>`).join('')}</div>
    <div class="section-title"><h2>Configuració</h2></div>
    <section class="card">
      <div class="set-row"><div>So<small>Efectes de so en encertar i fallar</small></div>${sw('sound', S.set.sound)}</div>
      <div class="set-row"><div>Desbloquejar totes les unitats<small>Si ja coneixes part del codi i vols saltar l'ordre</small></div>${sw('unlockAll', S.set.unlockAll)}</div>
      <div class="set-row"><div>Tema</div><div class="chipsel">${themeChip('auto', 'Auto')}${themeChip('dark', 'Fosc')}${themeChip('light', 'Clar')}</div></div>
      <div class="set-row"><div>Objectiu diari</div><div class="chipsel">${[50, 100, 200, 300].map(goalChip).join('')}</div></div>
      <div class="set-row"><div>Còpia de seguretat<small>El progrés es desa en aquest navegador. Exporta'l per passar-lo a un altre dispositiu.</small></div>
        <div class="btn-row"><button class="btn soft" data-act="export">Exportar</button><button class="btn soft" data-act="import">Importar</button></div></div>
      <div class="set-row"><div>Esborrar el progrés<small>Torna a començar de zero</small></div><button class="btn danger" data-act="reset">Esborrar</button></div>
    </section>
    <p class="muted" style="text-align:center;margin-top:20px;font-size:13px">Font: «CODI 3. Codificació pròpia del SEM». Eina d'estudi no oficial.</p>`;
  },
};
function gameCard(id) {
  const g = GAMES[id], rec = g.best ? g.best() : '';
  const dis = g.needsVoice && !canSpeak;
  return `<button class="game ${dis ? 'disabled' : ''}" data-act="mode" data-mode="${id}"><span class="g-ic">${g.icon}</span><b>${esc(g.name)}</b><p>${esc(dis ? 'El teu navegador no pot reproduir veu.' : g.desc)}</p>${rec ? `<span class="rec">${esc(rec)}</span>` : ''}</button>`;
}
function refList() {
  const q = normText(REF_Q);
  const match = it => !q || normText(`${it.code} ${it.m} ${it.track === 'c3' ? it.s : it.pr}`).includes(q) || normCode(it.code) === normCode(REF_Q);
  const us = unitsOf(REF_TAB);
  let h = '';
  us.forEach(u => {
    const its = u.ids.map(id => BY_ID[id]).filter(match);
    if (!its.length) return;
    h += `<div class="ref-unit">${u.icon} ${esc(u.name)}</div><div class="ref-list">${its.map(refRow).join('')}</div>`;
  });
  return h || '<p class="muted">Cap resultat.</p>';
}
function refRow(it) {
  const b = box(it.id);
  const main = it.track === 'c3' ? esc(it.m) : `<b>${esc(it.w)}</b><small>${esc(it.pr)}</small>`;
  return `<button class="ref-row" data-act="item" data-id="${it.id}"><span class="rc">${esc(it.code)}</span><span class="rm">${main}</span><span class="pill m${b}">${MASTERY[b]}</span></button>`;
}
function itemModal(id) {
  const it = BY_ID[id], s = st(id), b = s.b, u = UNIT_BY_ID[it.unit];
  const next = b > 0 ? (s.due <= Date.now() ? 'Toca repassar-lo ara' : `Proper repàs en ${fmtDur(s.due - Date.now())}`) : 'Encara no l\'has estudiat';
  const body = it.track === 'c3'
    ? `<div class="q-code" style="font-size:72px">${esc(it.code)}</div><h2 style="font-size:24px">${esc(it.m)}</h2>
       <div class="intro-card" style="padding:14px;margin-top:12px"><div class="muted">📻 Exemple</div><div>${esc(it.s)}</div></div>
       ${it.h ? `<div class="hint">💡 ${esc(it.h)}</div>` : ''}<div class="hint">🧭 ${esc(u.pista)}</div>`
    : `<div class="q-code" style="font-size:72px">${esc(it.sym)}</div><h2>${esc(it.w)}</h2><div class="pron">Pronunciació: <b>${esc(it.pr)}</b></div>
       ${canSpeak ? `<p><button class="speak" data-act="speak" data-text="${esc(it.w.replace('-', ' '))}">🔊 Escolta</button></p>` : ''}`;
  openModal(`${body}
    <div class="opt-group"><b>Domini: <span class="pill m${b}">${MASTERY[b]}</span></b>
    <div class="mbar" style="margin-top:6px"><i class="m${b}" style="width:${b / 6 * 100}%"></i></div>
    <p class="muted">${s.ok || 0} encerts · ${s.ko || 0} errors · ${next}</p></div>
    <button class="btn primary full" data-act="unitGo" data-id="${u.id}">Practicar la unitat «${esc(u.name)}»</button>`);
}
function unitModal(id) {
  const u = UNIT_BY_ID[id], p = unitProgress(u), lk = !unitUnlocked(u);
  openModal(`<div style="font-size:40px">${u.icon}</div><h2>${esc(u.name)}</h2><p class="muted">${esc(u.desc)}</p>
    <div class="stars" style="font-size:20px">${[1, 2, 3].map(s => `<span class="${p.stars >= s ? '' : 'off'}">★</span>`).join('')} <span class="muted" style="font-size:15px">${p.pct}% de domini</span></div>
    ${lk ? `<div class="hint">🔒 Unitat bloquejada al repàs intel·ligent. Es desbloqueja quan tots els codis de la unitat anterior estan a «Reconegut». Pots practicar-la igualment des d'aquí.</div>` : ''}
    <div class="hint">🧭 ${esc(u.pista)}</div>
    <div class="unit-items">${u.ids.map(i => refRow(BY_ID[i])).join('')}</div>
    <div class="btn-row"><button class="btn primary big" style="flex:1" data-act="unitGo" data-id="${u.id}">${p.seen ? 'Practicar' : 'Aprendre'} ▶</button>
    <button class="btn soft big" data-act="unitFlash" data-id="${u.id}">🃏 Targetes</button>
    ${u.track === 'c3' ? `<button class="btn soft big" data-act="unitPairs" data-id="${u.id}">🧩 Parelles</button>` : ''}</div>`);
}

/* ---------------- Exportar / importar ---------------- */
function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `codi3-progres-${dayStr()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$('#importFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const o = JSON.parse(rd.result);
      if (!o || typeof o !== 'object' || !o.items) throw new Error('format');
      const fr = freshState();
      S = { ...fr, ...o, set: { ...fr.set, ...(o.set || {}) }, stats: { ...fr.stats, ...(o.stats || {}) } };
      save(); applyTheme(); render(); toast('✅', 'Progrés importat');
    } catch (err) { toast('⚠️', 'Fitxer no vàlid'); }
    e.target.value = '';
  };
  rd.readAsText(f);
});
function applyTheme() {
  if (S.set.theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', S.set.theme);
}

/* =========================================================
   ESDEVENIMENTS
   ========================================================= */
const ACT = {
  nav: d => { closeModal(); go(d.view); },
  srs: d => startSrs(d.track),
  mode: d => pregame(d.mode),
  unit: d => unitModal(d.id),
  unitGo: d => { closeModal(); startSrs(UNIT_BY_ID[d.id].track, d.id); },
  unitFlash: d => { closeModal(); startFlash(UNIT_BY_ID[d.id].track, d.id); },
  unitPairs: d => { closeModal(); startPairs(d.id); },
  item: d => itemModal(d.id),
  closeModal: () => closeModal(),
  pg: d => { PG[d.k] = d.v; renderPregame(); },
  pgStart: () => { closeModal(); GAMES[PG.id].start(PG.scope, PG.diff); },
  story: d => { closeModal(); startStory(+d.i); },
  refTab: d => { REF_TAB = d.t; render(); },
  speak: d => speak(d.text),
  opt: d => submit(+d.i),
  tf: d => submit(d.v === '1'),
  skip: () => submit(null),
  cont: () => { if (R && R.answered) nextQ(); },
  override: () => override(),
  introNext: () => nextQ(),
  flip: () => flip(),
  selfgrade: d => { if (R && R.q && R.q.kind === 'flash' && !R.answered) { R.answered = true; applyResult(R.q, { ok: d.v === '1' }); } },
  pair: (d, el) => pairClick(d, el),
  again: () => { const f = R && R.cfg.again; if (f) f(); },
  quit: () => quitRun(),
  set: d => { S.set[d.k] = !S.set[d.k]; save(); render(); },
  theme: d => { S.set.theme = d.v; save(); applyTheme(); render(); },
  goal: d => { S.goal = +d.v; S.day.goalHit = S.day.xp >= S.goal; save(); render(); },
  export: () => exportData(),
  import: () => $('#importFile').click(),
  reset: () => {
    if (!confirm('Segur que vols esborrar TOT el progrés?')) return;
    if (!confirm('De debò? Aquesta acció no es pot desfer.')) return;
    S = freshState(); save(); applyTheme(); render(); toast('🧹', 'Progrés esborrat');
  },
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACT[el.dataset.act];
  if (fn) fn(el.dataset, el);
});
document.addEventListener('keydown', e => {
  if (modalOpen()) { if (e.key === 'Escape') closeModal(); return; }
  if (!quizOpen() || !R) return;
  if (e.key === 'Escape') { quitRun(); return; }
  const fbOpen = $('#qFb').classList.contains('show');
  if (fbOpen) {
    if ((e.key === 'Enter' || e.key === ' ') && Date.now() - R.fbAt > 250) { e.preventDefault(); if (R.answered) nextQ(); }
    return;
  }
  if (R.over) return;
  const q = R.q; if (!q || R.answered) return;
  const inInput = e.target.tagName === 'INPUT';
  if (inInput) return;
  if (q.kind === 'mc') { const n = +e.key; if (n >= 1 && n <= q.options.length) submit(n - 1); }
  else if (q.kind === 'tf') { if (e.key === '1') submit(true); else if (e.key === '2') submit(false); }
  else if (q.kind === 'intro') { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextQ(); } }
  else if (q.kind === 'flash') {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!R.flipped) flip(); }
    else if (R.flipped && (e.key === '1' || e.key === '2')) { R.answered = true; applyResult(q, { ok: e.key === '2' }); }
  }
});

/* ---------------- Inici ---------------- */
if (canSpeak) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); } catch (e) { /* res */ } }
applyTheme();
touchDay();
go('home');
