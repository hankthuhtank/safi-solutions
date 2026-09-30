/* OVERTONE · Rhythm Room
   A Maelzel-style metronome whose pendulum is driven by the audio clock,
   so what you see is exactly what you hear, and a drum machine playing
   real sampled kits with swing and a little human looseness. */
import { $, $$, esc, store, act, onInput, defineView, clamp, reducedMotion, OT } from '../util.js';
import { A, KITS } from '../audio.js';
import { at, Loop, clearQueue, audibleNow } from '../clock.js';
import { KB } from '../keybed.js';
import { vhead, playBtn, setPlayBtn } from './shared.js';

const SIGS = [['2/4', 2, [2]], ['3/4', 3, [3]], ['4/4', 4, [4]], ['5/4', 5, [3, 2]], ['6/8', 6, [3, 3]], ['7/8', 7, [2, 2, 3]], ['9/8', 9, [2, 2, 2, 3]], ['12/8', 12, [3, 3, 3, 3]]];
const SUBS = [[1, 'Beat'], [2, 'Eighths'], [3, 'Triplets'], [4, 'Sixteenths']];
const LANES = [['k', 'Kick'], ['s', 'Snare'], ['h', 'Hat'], ['t', 'Tom'], ['c', 'Clave']];
const MARKINGS = [[40, 'Grave'], [60, 'Largo'], [66, 'Larghetto'], [76, 'Adagio'], [108, 'Andante'], [120, 'Moderato'], [156, 'Allegro'], [176, 'Vivace'], [200, 'Presto'], [999, 'Prestissimo']];
const marking = b => MARKINGS.find(([m]) => b < m)[1];
const accentsFor = sig => { const s = SIGS.find(x => x[0] === sig); const out = []; s[2].forEach(g => { for (let i = 0; i < g; i++) out.push(out.length === 0 ? 2 : i === 0 ? 1 : 0.5); }); return out; };

const M = {
  bpm: store.get('metro.bpm', 96), sig: store.get('metro.sig', '4/4'), sub: 1, acc: null, loop: null, climb: false, bars: 0,
  beat: 0, beatT: 0, raf: 0, taps: [],
  html() {
    M.acc = M.acc || accentsFor(M.sig);
    return `<section class="metro panel">
      <div class="metro-case">${M.svg()}</div>
      <div class="metro-ctl">
        <div class="metro-read"><b id="mBpm">${M.bpm}</b><span><i id="mMark">${marking(M.bpm)}</i>beats per minute</span></div>
        <div class="slider-row"><button class="icon-btn" data-act="metro.nudge" data-v="-1" aria-label="Slower">−</button><input type="range" min="30" max="240" value="${M.bpm}" data-input="metro.bpm" aria-label="Tempo"><button class="icon-btn" data-act="metro.nudge" data-v="1" aria-label="Faster">+</button></div>
        <div class="row">${playBtn('metro.toggle', false, 'Start', 'Stop', 'mBtn')}<button class="btn btn-ghost" data-act="metro.tap">Tap tempo</button>
          <button class="chip" data-act="metro.climb" aria-pressed="${M.climb}" title="Adds 2 BPM every 4 bars">Speed climb</button></div>
        <div class="row"><span class="plabel">Time</span>${SIGS.map(([n]) => `<button class="chip" data-act="metro.sig" data-v="${n}" aria-pressed="${n === M.sig}">${n}</button>`).join('')}</div>
        <div class="row"><span class="plabel">Subdivide</span>${SUBS.map(([v, n]) => `<button class="chip pat" data-act="metro.sub" data-v="${v}" aria-pressed="${v === M.sub}">${n}</button>`).join('')}</div>
        <div><span class="plabel">Accents · tap a beat to change it</span><div class="beats" id="mBeats">${M.beatsHtml()}</div></div>
      </div>
    </section>`;
  },
  beatsHtml() { return M.acc.map((a, i) => `<button class="bt lv${String(a).replace('.', '')}" data-act="metro.acc" data-v="${i}" aria-label="Beat ${i + 1}, ${a === 2 ? 'bar accent' : a === 1 ? 'accent' : a === .5 ? 'normal' : a === 0 ? 'soft' : 'silent'}"><i></i><span>${i + 1}</span></button>`).join(''); },
  svg() {
    const ticks = [40, 50, 60, 72, 84, 96, 108, 120, 138, 160, 184, 208].map(b => { const y = M.yFor(b); return `<line x1="112" x2="${b % 12 === 0 ? 124 : 120}" y1="${y}" y2="${y}"/><text x="128" y="${y + 3}">${b}</text>`; }).join('');
    return `<svg viewBox="0 0 240 360" class="metro-svg" role="img" aria-label="Pendulum metronome">
      <defs>
        <linearGradient id="mw" x1="0" x2="1"><stop offset="0" stop-color="#2b170c"/><stop offset=".45" stop-color="#5a3219"/><stop offset=".55" stop-color="#6a3c1f"/><stop offset="1" stop-color="#2a150a"/></linearGradient>
        <linearGradient id="mb" x1="0" x2="1"><stop offset="0" stop-color="#8a6327"/><stop offset=".4" stop-color="#f3d08a"/><stop offset="1" stop-color="#8a6327"/></linearGradient>
      </defs>
      <path d="M96 14 L144 14 L206 332 L34 332 Z" fill="url(#mw)" stroke="#120a05" stroke-width="2"/>
      <path d="M104 30 L136 30 L184 300 L56 300 Z" fill="#140b06" stroke="#0a0503"/>
      <g class="m-scale">${ticks}</g>
      <rect x="26" y="330" width="188" height="16" rx="3" fill="url(#mb)"/>
      <g id="mPend" class="m-pend" style="transform-origin:120px 288px">
        <line x1="120" y1="288" x2="120" y2="36" stroke="#d9b36a" stroke-width="3.2" stroke-linecap="round"/><line x1="119.2" y1="286" x2="119.2" y2="38" stroke="#fff1c9" stroke-width=".8" opacity=".6"/>
        <g id="mWeight" transform="translate(0 ${M.yFor(M.bpm) - 150})"><path d="M108 140 L132 140 L128 162 L112 162 Z" fill="url(#mb)" stroke="#5a3f16"/><line x1="112" x2="128" y1="150" y2="150" stroke="#5a3f16"/></g>
      </g>
      <circle cx="120" cy="288" r="7" fill="url(#mb)" stroke="#5a3f16"/>
      <text x="120" y="322" class="m-brand">OVERTONE</text>
    </svg>`;
  },
  yFor(b) { return 60 + (clamp(b, 40, 208) - 40) / 168 * 190; },
  setBpm(b) {
    M.bpm = clamp(Math.round(b), 30, 240); store.set('metro.bpm', M.bpm);
    $('#mBpm') && ($('#mBpm').textContent = M.bpm); $('#mMark') && ($('#mMark').textContent = marking(M.bpm));
    const sl = $('.metro input[type=range]'); if (sl && +sl.value !== M.bpm) sl.value = M.bpm;
    const w = $('#mWeight'); if (w) w.setAttribute('transform', `translate(0 ${M.yFor(M.bpm) - 150})`);
    if (M.loop) M.loop.bpm = M.bpm * (M.sig.endsWith('/8') ? 1 : 1);
  },
  toggle() {
    if (M.loop) { M.stop(); return; }
    A.resume(); M.bars = 0;
    const perBeat = M.sub;
    M.loop = new Loop({ bpm: M.bpm, div: perBeat, onStep: (step, t) => {
      const n = M.acc.length, beat = Math.floor(step / perBeat) % n, onBeat = step % perBeat === 0;
      if (onBeat) {
        const a = M.acc[beat];
        if (a >= 0) A.click(a === 2 ? 2 : a === 1 ? 1.5 : a === .5 ? 1 : 0, t);
        if (beat === 0 && step > 0) { M.bars++; if (M.climb && M.bars % 4 === 0) { M.setBpm(M.bpm + 2); } }
        at(t, () => { M.beat = beat; M.beatT = t; M.flash(beat); }, M);
      } else if (M.acc[beat] >= 0) A.click(0, t);
    } });
    M.loop.start(); M.beatT = A.ctx.currentTime + .06; M.beat = 0;
    setPlayBtn($('#mBtn'), true, 'Start');
    M.animate();
  },
  stop() { if (M.loop) M.loop.stop(); M.loop = null; clearQueue(M); setPlayBtn($('#mBtn'), false, 'Start'); cancelAnimationFrame(M.raf); M.raf = 0; const p = $('#mPend'); if (p) p.style.transform = ''; $$('#mBeats .bt').forEach(b => b.classList.remove('now')); },
  flash(beat) { $$('#mBeats .bt').forEach((b, i) => b.classList.toggle('now', i === beat)); },
  animate() {
    const p = $('#mPend');
    const step = () => {
      if (!M.loop) return;
      const beatDur = 60 / M.bpm, ph = M.beat + clamp((audibleNow() - M.beatT) / beatDur, 0, 1.2);
      const amp = reducedMotion() ? 6 : 26;
      if (p) p.style.transform = `rotate(${(amp * Math.cos(Math.PI * ph)).toFixed(2)}deg)`;
      M.raf = requestAnimationFrame(step);
    };
    M.raf = requestAnimationFrame(step);
  },
  tap() {
    const now = performance.now();
    M.taps = M.taps.filter(t => now - t < 2600); M.taps.push(now);
    A.resume(); A.click(1);
    if (M.taps.length < 2) return;
    const gaps = M.taps.slice(1).map((t, i) => t - M.taps[i]);
    M.setBpm(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length));
  }
};

const D = {
  id: store.get('drum.id', 'rock'), cat: 'all', pat: null, steps: 16, beats: 4, bpm: 110, swing: 0, human: true, loop: null, meta: null,
  load(id) {
    const r = OT.RHYTHMS.find(x => x.id === id) || OT.RHYTHMS[0];
    D.id = r.id; store.set('drum.id', D.id); D.meta = r;
    D.steps = r.k.length; D.beats = r.beats || 4; D.bpm = r.bpm;
    const z = () => Array(D.steps).fill(0);
    D.pat = { k: [...r.k], s: [...r.s], h: [...r.h], t: r.t ? [...r.t] : z(), c: r.c ? [...r.c] : z() };
    D.swing = r.id === 'jazzswing' || r.id === 'shuffle' || r.id === 'waltz-jazz' ? 0 : D.swing;
  },
  res() { return Math.max(1, Math.round(D.steps / D.beats)); },
  html() {
    if (!D.pat) D.load(D.id);
    const cats = ['all', ...new Set(OT.RHYTHMS.map(r => r.cat))];
    return `<section class="dm panel">
      <div class="panel-h"><h3>Drum machine<small id="dmName">${esc(D.meta.n)} · ${esc(D.meta.sig)}</small></h3>
        ${playBtn('drum.toggle', false, 'Play groove', 'Stop', 'dmBtn')}</div>
      <div class="dm-top">
        <div><span class="plabel">Kit</span><div class="seg seg-sm" role="tablist">${KITS.map(([id, n]) => `<button role="tab" data-act="drum.kit" data-v="${id}" aria-selected="${id === A.kitId}">${n}</button>`).join('')}</div></div>
        <div class="dm-sliders">
          <div class="slider-row"><span class="plabel">Tempo</span><input type="range" min="50" max="200" value="${D.bpm}" data-input="drum.bpm" aria-label="Groove tempo"><output id="dmBpm">${D.bpm}</output></div>
          <div class="slider-row"><span class="plabel">Swing</span><input type="range" min="0" max="60" value="${D.swing}" data-input="drum.swing" aria-label="Swing"><output id="dmSwing">${D.swing}%</output></div>
        </div>
      </div>
      <div class="chips-scroll dm-cats">${cats.map(c => `<button class="chip pat" data-act="drum.cat" data-v="${c}" aria-pressed="${c === D.cat}">${esc(c === 'all' ? 'All ' + OT.RHYTHMS.length : c)}</button>`).join('')}</div>
      <div class="chips-scroll dm-grooves" id="dmGrooves">${D.grooves()}</div>
      <div class="pads" id="dmPads" style="--steps:${D.steps}">${D.pads()}</div>
      <div class="row dm-foot"><button class="chip" data-act="drum.human" aria-pressed="${D.human}" title="Tiny random changes in timing and loudness, like a player">Human feel</button><button class="chip" data-act="drum.clear">Clear</button><span class="hint">Tap any pad to edit the groove.</span></div>
      <div class="dm-note" id="dmNote">${D.note()}</div>
    </section>`;
  },
  grooves() { return OT.RHYTHMS.filter(r => D.cat === 'all' || r.cat === D.cat).map(r => `<button class="chip" data-act="drum.load" data-v="${r.id}" aria-pressed="${r.id === D.id}">${esc(r.n)}</button>`).join(''); },
  pads() {
    const res = D.res();
    return LANES.map(([l, n]) => `<div class="lane"><span class="lane-n">${n}</span><div class="lane-steps">${D.pat[l].map((v, i) => `<button class="pad ${l} ${v ? 'on' : ''} ${i % res === 0 ? 'beat' : ''}" data-act="drum.pad" data-l="${l}" data-i="${i}" aria-pressed="${!!v}" aria-label="${n} step ${i + 1}"></button>`).join('')}</div></div>`).join('')
      + `<div class="lane ruler"><span></span><div class="lane-steps">${Array.from({ length: D.steps }, (_, i) => `<i>${i % res === 0 ? i / res + 1 : ''}</i>`).join('')}</div></div>`;
  },
  note() { const r = D.meta; return `<p class="note-txt"><span class="kv">${esc(r.n)} · ${esc(r.sig)} · ${r.bpm} BPM</span>${esc(r.read)}</p><p class="note-txt">${esc(r.ctx)}</p><p class="note-txt trap"><span class="kv">The trap</span><b>${esc(r.trap)}</b></p>`; },
  refresh() {
    $('#dmPads').outerHTML = `<div class="pads" id="dmPads" style="--steps:${D.steps}">${D.pads()}</div>`;
    $('#dmNote').innerHTML = D.note(); $('#dmName').textContent = D.meta.n + ' · ' + D.meta.sig;
    $('#dmGrooves').innerHTML = D.grooves();
    const b = $('.dm input[data-input="drum.bpm"]'); if (b) b.value = D.bpm; $('#dmBpm').textContent = D.bpm;
  },
  toggle() {
    if (D.loop) { D.stop(); return; }
    A.resume(); A.loadKit();
    D.loop = new Loop({ bpm: D.bpm, div: D.res(), swing: D.swing / 100, onStep: (step, t) => {
      const i = step % D.steps, h = D.human;
      LANES.forEach(([l]) => {
        if (!D.pat[l][i]) return;
        const vel = (l === 'h' ? (i % D.res() === 0 ? .85 : .6) : 1) * (h ? .88 + Math.random() * .2 : 1);
        A.drum(l, t + (h ? (Math.random() - .5) * .008 : 0), vel);
      });
      at(t, () => $$('#dmPads .lane-steps').forEach(row => row.childNodes.forEach((p, k) => p.classList && p.classList.toggle('cur', k === i))), D);
    } });
    D.loop.start(); setPlayBtn($('#dmBtn'), true, 'Play groove');
  },
  stop() { if (D.loop) D.loop.stop(); D.loop = null; clearQueue(D); setPlayBtn($('#dmBtn'), false, 'Play groove'); $$('#dmPads .cur').forEach(p => p.classList.remove('cur')); }
};

act({
  'metro.toggle': () => M.toggle(),
  'metro.nudge': el => M.setBpm(M.bpm + +el.dataset.v),
  'metro.tap': () => M.tap(),
  'metro.climb': el => { M.climb = !M.climb; el.setAttribute('aria-pressed', String(M.climb)); },
  'metro.sig': el => { M.sig = el.dataset.v; store.set('metro.sig', M.sig); M.acc = accentsFor(M.sig); $('#mBeats').innerHTML = M.beatsHtml(); $$('[data-act="metro.sig"]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); if (M.loop) { M.stop(); M.toggle(); } },
  'metro.sub': el => { M.sub = +el.dataset.v; $$('[data-act="metro.sub"]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); if (M.loop) { M.stop(); M.toggle(); } },
  'metro.acc': el => { const i = +el.dataset.v, cyc = [2, 1, .5, 0, -1]; M.acc[i] = cyc[(cyc.indexOf(M.acc[i]) + 1) % cyc.length]; $('#mBeats').innerHTML = M.beatsHtml(); },
  'drum.toggle': () => D.toggle(),
  'drum.kit': el => { A.setKit(el.dataset.v).then(() => { if (!D.loop) { A.drum('k'); A.drum('s', A.ctx.currentTime + .25); A.drum('h', A.ctx.currentTime + .5, .7); } }); $$('[data-act="drum.kit"]').forEach(b => b.setAttribute('aria-selected', String(b === el))); },
  'drum.cat': el => { D.cat = el.dataset.v; $$('[data-act="drum.cat"]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); $('#dmGrooves').innerHTML = D.grooves(); },
  'drum.load': el => { const was = !!D.loop; D.stop(); D.load(el.dataset.v); D.refresh(); if (was) D.toggle(); },
  'drum.pad': el => { const l = el.dataset.l, i = +el.dataset.i; D.pat[l][i] = D.pat[l][i] ? 0 : 1; el.classList.toggle('on', !!D.pat[l][i]); el.setAttribute('aria-pressed', String(!!D.pat[l][i])); if (D.pat[l][i]) { A.resume(); A.drum(l); } },
  'drum.clear': () => { LANES.forEach(([l]) => D.pat[l].fill(0)); $$('#dmPads .pad').forEach(p => { p.classList.remove('on'); p.setAttribute('aria-pressed', 'false'); }); },
  'drum.human': el => { D.human = !D.human; el.setAttribute('aria-pressed', String(D.human)); }
});
onInput({
  'metro.bpm': el => M.setBpm(+el.value),
  'drum.bpm': el => { D.bpm = +el.value; $('#dmBpm').textContent = D.bpm; if (D.loop) D.loop.bpm = D.bpm; },
  'drum.swing': el => { D.swing = +el.value; $('#dmSwing').textContent = D.swing + '%'; if (D.loop) D.loop.swing = D.swing / 100; }
});

defineView('rhythm', {
  mount(el) {
    el.innerHTML = vhead('Rhythm Room', 'Time is the part <em>listeners actually feel.</em>', 'A pendulum metronome driven by the audio clock, and a drum machine with real sampled kits and forty grooves from around the world. Edit any of them.')
      + `<div class="rhythm-grid">${M.html()}<aside class="panel plain metro-notes">
          <p class="note-txt"><span class="kv">Why subdivision matters</span>How fast music feels comes from how densely the beat is filled, not the tempo number. Practise switching subdivision without changing the tempo and your internal clock steadies fast.</p>
          <p class="note-txt"><span class="kv">Accents</span>The first beat of the bar is louder; that is what tells a listener where the bar starts. Tap the beats to reshape the pattern, or silence some to hear the pulse only every other beat.</p>
          <p class="note-txt trap"><span class="kv">The trap</span><b>Practising only with a click on every beat teaches you to follow rather than keep time. Silence beats 2 and 4, or try the gap click in the Practice Room.</b></p>
        </aside></div>${D.html()}`;
    A.loadKit();
  },
  show() { KB.setKey(0, null); },
  hide() { M.stop(); D.stop(); },
  stop() { M.stop(); D.stop(); },
  sub(id) { if (OT.RHYTHMS.find(r => r.id === id)) { D.stop(); D.load(id); D.refresh(); D.toggle(); $('.dm')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
});
