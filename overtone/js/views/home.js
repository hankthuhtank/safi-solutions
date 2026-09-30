/* OVERTONE · home
   The soundboard: a guitar top you can strum by sweeping across the
   strings. Its soundhole is the logo's O, and it breathes with every
   sound the app makes. Below it, a compact index of the rooms, each
   of which answers with its own sound, and where you left off. */
import { $, $$, esc, store, act, defineView, clamp, reducedMotion, OT } from '../util.js';
import { A } from '../audio.js';
import { at, clearQueue } from '../clock.js';
import { KB } from '../keybed.js';
import { pc, midiOf, freq, diatonic, nameQuality, romanFor, rootName, useKey, scaleById, spellChord } from '../music.js';
import { SECTIONS_META, progress } from './shared.js';

const TUNING = [40, 45, 50, 55, 59, 64];
const KEYS = [[7, 'G'], [0, 'C'], [2, 'D'], [9, 'A'], [4, 'E']];
const ORDER = [0, 3, 4, 5, 1, 2];                 /* I IV V vi ii iii */

/* ---------- guitar shapes for the board ---------- */
function shapeFor(rootPc, q) {
  const sym = q === 'm' ? 'm' : '';
  const names = [OT.SHARP[rootPc] + sym, OT.FLAT[rootPc] + sym].map(s => s.replace('♯', '#').replace('♭', 'b'));
  for (const n of names) { const o = OT.GUITAR_OPEN[n] || OT.GUITAR_OPEN[n.replace('#', '♯')]; if (o) return o.f.slice(); }
  const qq = q === 'm' ? 'min' : q === '°' ? 'min' : 'maj';
  let best = null;
  OT.GUITAR_MOVABLE.filter(m => m.q === qq).forEach(m => {
    let fret = pc(rootPc - [4, 9, 2, 7, 11, 4][m.rootStr]); if (fret === 0) fret = 12;
    if (!best || fret < best.fret) best = { fret, f: m.f.map(x => x < 0 ? -1 : x + fret) };
  });
  return best ? best.f : [0, 2, 2, 1, 0, 0];
}

const H = {
  key: store.get('home.key', 7), chord: 0, voice: store.get('home.voice', 'ks_steel'),
  strings: TUNING.map((m, i) => ({ i, amp: 0, ph: 0, x: 0, fret: 0, midi: m, muted: false, t: 0 })),
  cv: null, g: null, hole: null, hg: null, raf: 0, last: 0, lastP: null,
  chords() {
    const iv = scaleById('ionian').iv;
    return ORDER.map(d => {
      const rel = diatonic(iv, d, 3), q = nameQuality(rel), root = pc(H.key + iv[d]);
      return { d, root, q, name: rootName(root, false) + q, roman: romanFor(d, q), f: shapeFor(root, q) };
    });
  },
  setChord(i, strum = true) {
    H.chord = i;
    const c = H.chords()[i];
    c.f.forEach((fr, s) => { const st = H.strings[s]; st.muted = fr < 0; st.fret = fr; st.midi = TUNING[s] + Math.max(0, fr); });
    $$('#chordBar button').forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    const r = $('#boardRead');
    if (r) r.innerHTML = `<b>${esc(c.name)}</b><span>${esc(c.roman)} in ${esc(rootName(H.key, false))} major · ${c.f.map((fr, s) => fr < 0 ? '×' : esc(OT.SHARP[pc(TUNING[s] + fr)])).join(' ')}</span>`;
    H.drawShape(c.f);
    if (strum) H.strum(1, .8);
  },
  drawShape(f) {
    const el = $('#boardShape'); if (!el) return;
    const base = Math.max(1, Math.min(...f.filter(x => x > 0)));
    const lo = base > 3 ? base : 1;
    let s = '';
    for (let i = 0; i < 6; i++) s += `<line x1="${8 + i * 10}" x2="${8 + i * 10}" y1="12" y2="56" />`;
    for (let r = 0; r <= 4; r++) s += `<line x1="8" x2="58" y1="${12 + r * 11}" y2="${12 + r * 11}" class="${r === 0 && lo === 1 ? 'nutl' : ''}"/>`;
    f.forEach((fr, i) => {
      const x = 8 + i * 10;
      if (fr < 0) s += `<text x="${x}" y="8" class="x">×</text>`;
      else if (fr === 0) s += `<circle cx="${x}" cy="5" r="2.6" class="o"/>`;
      else s += `<circle cx="${x}" cy="${12 + (fr - lo + .5) * 11}" r="3.6"/>`;
    });
    if (lo > 1) s += `<text x="64" y="21" class="fr">${lo}</text>`;
    el.innerHTML = s;
  },

  /* ---------- sound ---------- */
  pluck(s, vel, when = 0) {
    const st = H.strings[s];
    A.resume();
    const t = A.ctx.currentTime + when + .004;
    if (st.muted) A.play(TUNING[s] + 5, { at: t, voice: 'ks_steel', dur: .035, vel: vel * .35 });
    else A.play(st.midi, { at: t, voice: H.voice, dur: 3.2, vel });
    at(t, () => { st.amp = Math.min(1.15, st.amp * .3 + (st.muted ? .25 : .55 + vel * .55)); st.t = 0; H.kick(); });
  },
  strum(dir = 1, vel = .75, speed = .018) {
    const order = dir > 0 ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
    order.forEach((s, k) => H.pluck(s, vel * (dir < 0 && s < 3 ? .75 : 1) * (.92 + Math.random() * .12), k * speed));
  },
  demo() {
    /* travis picking through I – vi – IV – V */
    A.resume(); clearQueue(H); A.begin('home', () => clearQueue(H));
    const seq = [0, 3, 1, 2], spb = 60 / 96 / 2;
    const pat = [['b', 1], [3, .6], ['a', .8], [2, .55], ['b', .9], [3, .6], ['a', .8], [4, .6]];
    seq.forEach((ci, bar) => {
      const c = H.chords()[ci];
      const bassStrings = c.f.map((fr, s) => fr >= 0 ? s : -1).filter(s => s >= 0 && s < 4);
      const b = bassStrings[0], a = bassStrings.find(s => s > b + 1) ?? bassStrings[1] ?? b;
      at(A.ctx.currentTime + bar * 8 * spb, () => H.setChord(ci, false), H);
      pat.forEach(([s, v], k) => {
        const idx = s === 'b' ? b : s === 'a' ? a : s;
        H.plan(ci, idx, v * .85, (bar * 8 + k) * spb);
      });
    });
    at(A.ctx.currentTime + 4 * 8 * spb, () => { H.setChord(0, false); H.strum(1, .9, .026); }, H);
  },
  plan(ci, s, vel, when) {
    const c = H.chords()[ci], fr = c.f[s];
    if (fr < 0) return;
    A.resume();
    const t = A.ctx.currentTime + when + .05;
    A.play(TUNING[s] + fr, { at: t, voice: H.voice, dur: 2.4, vel, human: .6 });
    at(t, () => { const st = H.strings[s]; st.amp = Math.min(1.1, st.amp * .3 + .5 + vel * .5); st.t = 0; H.kick(); }, H);
  },

  /* ---------- drawing ---------- */
  layout() {
    const cv = H.cv; if (!cv) return;
    const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    cv.width = r.width * d; cv.height = r.height * d; H.g.setTransform(d, 0, 0, d, 0, 0);
    H.W = r.width; H.H = r.height;
    const span = H.W * .27, cx = H.W / 2;
    H.strings.forEach((s, i) => { s.x = cx - span / 2 + (span / 5) * i; });
    H.top = H.H * .02; H.bot = H.H * .79;
    const hr = H.hole.getBoundingClientRect();
    H.hole.width = hr.width * d; H.hole.height = hr.height * d; H.hg.setTransform(d, 0, 0, d, 0, 0);
    H.kick();
  },
  kick() { if (!H.raf) H.raf = requestAnimationFrame(H.frame); },
  frame(now) {
    H.raf = 0;
    const dt = Math.min(.05, (now - (H.last || now)) / 1000); H.last = now;
    const g = H.g; if (!g) return;
    g.clearRect(0, 0, H.W, H.H);
    let alive = false;
    const L = H.bot - H.top;
    H.strings.forEach((s, i) => {
      const wound = i < 3, w = [2.5, 2.1, 1.75, 1.3, 1.05, .85][i];
      s.t += dt;
      const a = s.amp * (wound ? 8 : 6);
      if (a > .15) {
        /* the blur a vibrating string leaves in your eye */
        g.beginPath();
        for (let k = 0; k <= 40; k++) { const u = k / 40; g.lineTo(s.x + a * Math.sin(Math.PI * u), H.top + L * u); }
        for (let k = 40; k >= 0; k--) { const u = k / 40; g.lineTo(s.x - a * Math.sin(Math.PI * u), H.top + L * u); }
        g.fillStyle = wound ? `rgba(214,162,74,${.1 + s.amp * .12})` : `rgba(235,235,230,${.07 + s.amp * .1})`;
        g.fill(); alive = true;
      }
      const off = a * Math.cos(s.t * 70 + i);
      const grad = g.createLinearGradient(s.x - w, 0, s.x + w, 0);
      if (wound) { grad.addColorStop(0, '#6a4a22'); grad.addColorStop(.5, s.muted ? '#8a7a64' : '#f0cf8e'); grad.addColorStop(1, '#5a3c18'); }
      else { grad.addColorStop(0, '#77756f'); grad.addColorStop(.5, s.muted ? '#8c8980' : '#fbfbf6'); grad.addColorStop(1, '#6c6a64'); }
      g.save(); g.translate(0, 0);
      g.beginPath();
      for (let k = 0; k <= 30; k++) { const u = k / 30; g.lineTo(s.x + off * Math.sin(Math.PI * u), H.top + L * u); }
      g.strokeStyle = s.muted ? 'rgba(140,130,115,.55)' : grad; g.lineWidth = w; g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 4; g.shadowOffsetX = 2; g.shadowOffsetY = 1;
      g.stroke(); g.restore();
      if (wound && !s.muted) { /* winding texture */
        g.beginPath(); g.setLineDash([1, 1.6]);
        for (let k = 0; k <= 30; k++) { const u = k / 30; g.lineTo(s.x + off * Math.sin(Math.PI * u), H.top + L * u); }
        g.strokeStyle = 'rgba(40,24,8,.45)'; g.lineWidth = w * .9; g.stroke(); g.setLineDash([]);
      }
      s.amp *= Math.pow(reducedMotion() ? .02 : .12, dt);
      if (s.amp < .004) s.amp = 0;
    });
    H.drawHole(dt);
    if (alive || H.level > .01) H.kick();
  },
  level: 0, bands: [0, 0, 0],
  drawHole() {
    const g = H.hg, c = H.hole; if (!g) return;
    const w = c.clientWidth, h = c.clientHeight, cx = w / 2, cy = h / 2, R = w / 2;
    g.clearRect(0, 0, w, h);
    let lvl = 0;
    if (A.an) {
      const buf = H.buf || (H.buf = new Uint8Array(A.an.frequencyBinCount));
      A.an.getByteFrequencyData(buf);
      const band = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += buf[i]; return s / (b - a) / 255; };
      const nb = [band(2, 12), band(12, 60), band(60, 220)];
      H.bands = H.bands.map((v, i) => v * .78 + nb[i] * .22);
      lvl = (nb[0] + nb[1] + nb[2]) / 3;
    }
    H.level = H.level * .85 + lvl * .15;
    /* the logo's dot and its three arcs, breathing with the sound */
    const dx = cx - R * .22;
    g.fillStyle = `rgba(214,162,74,${.55 + H.level * 1.2})`;
    g.beginPath(); g.arc(dx, cy, R * .09 * (1 + H.bands[0] * .6), 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 3; k++) {
      const e = H.bands[k], r = R * (.26 + k * .16) + e * R * .06;
      g.beginPath(); g.arc(dx, cy, r, -Math.PI * .34, Math.PI * .34);
      g.strokeStyle = `rgba(${k === 2 ? '243,208,138' : '214,162,74'},${.28 + e * 1.4})`;
      g.lineWidth = R * (.045 - k * .006); g.lineCap = 'round'; g.stroke();
    }
    if (A.an && H.level > .01) {
      const td = H.td || (H.td = new Uint8Array(A.an.fftSize));
      A.an.getByteTimeDomainData(td);
      g.beginPath();
      for (let k = 0; k <= 128; k++) {
        const a = (k / 128) * Math.PI * 2, v = (td[Math.floor(k / 128 * (td.length - 1))] - 128) / 128;
        const rr = R * .84 + v * R * .12;
        g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      g.strokeStyle = `rgba(99,185,166,${Math.min(.5, H.level * 2)})`; g.lineWidth = 1.2; g.stroke();
    }
  },

  bindBoard() {
    const cv = H.cv;
    const hit = (x0, y0, x1, y1, vel) => {
      if (Math.max(y0, y1) < H.top || Math.min(y0, y1) > H.bot) return;
      const dir = x1 > x0 ? 1 : -1;
      const list = dir > 0 ? H.strings : [...H.strings].reverse();
      list.forEach(s => { if ((x0 - s.x) * (x1 - s.x) < 0 || (x1 === s.x)) H.pluck(s.i, vel); });
    };
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
    cv.addEventListener('pointermove', e => {
      const p = pos(e), q = H.lastP; H.lastP = p;
      if (!q || p.t - q.t > 120) return;
      if (e.pointerType !== 'mouse' && !e.pressure) return;
      const speed = Math.abs(p.x - q.x) / Math.max(8, p.t - q.t);
      hit(q.x, q.y, p.x, p.y, clamp(.35 + speed * .45, .3, 1));
    });
    cv.addEventListener('pointerdown', e => {
      cv.setPointerCapture?.(e.pointerId); H.lastP = pos(e);
      const p = H.lastP, near = H.strings.reduce((b, s) => Math.abs(s.x - p.x) < Math.abs(b.x - p.x) ? s : b);
      if (Math.abs(near.x - p.x) < 9 && p.y > H.top && p.y < H.bot) H.pluck(near.i, .7);
    });
    cv.addEventListener('pointerleave', () => { H.lastP = null; });
    new ResizeObserver(() => H.layout()).observe(cv);
    A.on('note', () => H.kick());
  },

  html() {
    const ch = H.chords();
    return `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">A playable music workshop</p>
        <h1>Pull a string.<em>Hear why music works.</em></h1>
        <p class="lede">Everything here makes a sound. Strum the soundboard, play the piano under the page, and watch scales, chords and rhythms light up as you hear them. Built for anyone who has ever wondered why a song feels the way it does.</p>
        <div class="row hero-cta">
          <button class="btn btn-brass" data-act="home.demo"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12-7.5z"/></svg>Play me something</button>
          <a class="btn btn-ghost" href="#bench">Open the bench</a>
        </div>
        <ul class="hero-keys">
          <li class="hint-desk"><kbd>Sweep</kbd> the pointer across the strings to strum</li>
          <li class="hint-touch"><kbd>Drag</kbd> a finger across the strings to strum</li>
          <li class="hint-desk"><kbd>A</kbd>–<kbd>;</kbd> play the piano · <kbd>Space</kbd> is the pedal</li>
          <li class="hint-desk">Plug in a <kbd>MIDI</kbd> keyboard and it just works</li>
        </ul>
        <a class="hero-more" href="#bench/overtones">Why it’s called Overtone: one note is a whole chord in disguise →</a>
      </div>
      <figure class="board" aria-label="A guitar soundboard. Sweep the pointer across the strings to strum.">
        <div class="board-top">
          <div class="fingerboard" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
          <div class="pickguard" aria-hidden="true"></div>
          <div class="rosette" aria-hidden="true"><canvas class="hole" id="holeViz"></canvas></div>
          <div class="bridge" aria-hidden="true"><i class="saddle"></i><span>${'<i></i>'.repeat(6)}</span></div>
          <canvas class="board-strings" id="boardStrings"></canvas>
          <svg class="board-shape" id="boardShape" viewBox="0 0 70 60" aria-hidden="true"></svg>
        </div>
        <figcaption class="board-cap">
          <div class="board-read" id="boardRead" aria-live="polite"></div>
          <div class="chordbar" id="chordBar" role="group" aria-label="Chords">
            ${ch.map((c, i) => `<button data-act="home.chord" data-v="${i}" aria-pressed="${i === H.chord}"><b>${esc(c.name)}</b><i>${esc(c.roman)}</i></button>`).join('')}
          </div>
          <div class="row board-opts">
            <span class="plabel">Key</span>
            <div class="seg seg-sm" role="tablist">${KEYS.map(([k, n]) => `<button role="tab" data-act="home.key" data-v="${k}" aria-selected="${k === H.key}">${n}</button>`).join('')}</div>
            <div class="seg seg-sm" role="tablist" aria-label="Strings">
              <button role="tab" data-act="home.voice" data-v="ks_steel" aria-selected="${H.voice === 'ks_steel'}">Steel</button>
              <button role="tab" data-act="home.voice" data-v="ks_nylon" aria-selected="${H.voice === 'ks_nylon'}">Nylon</button>
            </div>
            <button class="btn btn-ghost btn-sm" data-act="home.strum" data-v="1" aria-label="Strum down">Strum ↓</button>
            <button class="btn btn-ghost btn-sm" data-act="home.strum" data-v="-1" aria-label="Strum up">↑</button>
          </div>
        </figcaption>
      </figure>
    </section>

    <section class="rooms" aria-labelledby="roomsH">
      <div class="rooms-head"><p class="eyebrow">The workshop</p><h2 id="roomsH">Ten rooms. <em>Pick a door.</em></h2></div>
      <ol class="index" id="roomIndex"></ol>
    </section>

    <section class="progress-band" id="homeProgress"></section>`;
  }
};

/* ---------- the room index ---------- */
const ROOM_SOUND = {
  bench: () => A.seq([60, 64, 67, 72], { gap: .09, dur: .5, vel: .4 }),
  chords: () => { H.voice && A.chord([43, 47, 50, 55, 59, 67], { voice: 'ks_steel', strum: .018, dur: 2, vel: .45 }); },
  ear: () => { A.play(60, { dur: .6, vel: .4 }); A.play(67, { dur: .8, vel: .4, when: .22 }); },
  rhythm: () => { A.drum('k', null, .6); A.drum('s', A.ctx.currentTime + .22, .5); },
  practice: () => [0, 1, 2, 3].forEach(i => A.click(i === 0 ? 1 : 0, A.ctx.currentTime + i * .09)),
  tuner: () => A.sine(440, { dur: .9, gain: .12 }),
  sketch: () => { A.chord([55, 59, 62], { dur: .5, vel: .35 }); A.chord([57, 60, 64], { dur: .8, vel: .35, when: .28 }); },
  world: () => A.seq([62, 63, 67, 69], { gap: .12, dur: .6, vel: .45, voice: 'koto' }),
  library: () => A.play(72, { dur: 1.2, vel: .3, voice: 'celesta' }),
  path: () => A.seq([60, 64, 67, 71, 74], { gap: .07, dur: .7, vel: .32, voice: 'orchestral_harp' })
};
function roomIndex() {
  let lastT = 0;
  $('#roomIndex').innerHTML = SECTIONS_META.filter(s => s[0] !== 'home').map(([id, n, sub, blurb], i) => `
    <li><a href="#${id}" data-room="${id}">
      <span class="ix-n">${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][i]}</span>
      <span class="ix-t"><b>${esc(n)}</b><small>${esc(blurb)}</small></span>
      <span class="ix-lead" aria-hidden="true"></span>
      <span class="ix-sub">${esc(sub)}</span>
    </a></li>`).join('');
  $$('#roomIndex a').forEach(a => a.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse' || !A.ctx || A.ctx.state !== 'running') return;
    const now = performance.now(); if (now - lastT < 350) return; lastT = now;
    const fn = ROOM_SOUND[a.dataset.room]; if (fn) { A.load('koto'); fn(); }
  }));
}
function progressBand() {
  const p = progress();
  $('#homeProgress').innerHTML = `
    <a class="pb-next" href="#path"><span class="plabel">${p.done.length ? 'Pick up where you left off' : 'Start the path'}</span><b>${esc(p.next[0])}</b></a>
    <div class="pb-frets" title="${p.done.length} of ${p.total} stages">${Array.from({ length: p.total }, (_, i) => `<i class="${p.done.includes(i) ? 'on' : ''}"></i>`).join('')}</div>
    <a class="pb-stat" href="#ear"><span class="plabel">Best ear streak</span><b>${p.best}</b></a>`;
}

act({
  'home.chord': el => { A.begin('board', () => clearQueue(H)); H.setChord(+el.dataset.v, true); },
  'home.key': el => { H.key = +el.dataset.v; store.set('home.key', H.key); rerenderBar(); H.setChord(0, true); },
  'home.voice': el => { H.voice = el.dataset.v; store.set('home.voice', H.voice); $$('[data-act="home.voice"]').forEach(b => b.setAttribute('aria-selected', String(b === el))); H.strum(1, .7); },
  'home.strum': el => { A.begin('board', () => clearQueue(H)); H.strum(+el.dataset.v, .8); },
  'home.demo': () => H.demo()
});
function rerenderBar() {
  const ch = H.chords();
  $('#chordBar').innerHTML = ch.map((c, i) => `<button data-act="home.chord" data-v="${i}" aria-pressed="${i === H.chord}"><b>${esc(c.name)}</b><i>${esc(c.roman)}</i></button>`).join('');
  $$('[data-act="home.key"]').forEach(b => b.setAttribute('aria-selected', String(+b.dataset.v === H.key)));
}

defineView('home', {
  mount(el) {
    el.innerHTML = H.html();
    H.cv = $('#boardStrings'); H.g = H.cv.getContext('2d');
    H.hole = $('#holeViz'); H.hg = H.hole.getContext('2d');
    H.bindBoard(); H.setChord(0, false); H.layout();
    roomIndex();
  },
  show() { KB.setKey(H.key, 'ionian'); useKey(H.key, scaleById('ionian')); progressBand(); H.layout(); }
});
