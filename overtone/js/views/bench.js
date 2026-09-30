/* OVERTONE · The Bench
   Scales, chords, progressions and the circle of fifths in any key.
   Every note is spelled for its key, written on manuscript, laid out
   on a guitar neck and lit on the piano as it sounds. */
import { $, $$, esc, store, act, onInput, defineView, OT } from '../util.js';
import { A } from '../audio.js';
import { at, Loop, clearQueue } from '../clock.js';
import { KB } from '../keybed.js';
import { Staff } from '../staff.js';
import { pc, midiOf, midiName, diatonic, nameQuality, romanFor, romanForStep, spellScale, spellChord, rootName, useKey, scaleById, chordById, progById, voiceLead } from '../music.js';
import { vhead, keyPicker, playBtn, setPlayBtn } from './shared.js';
import { go } from '../shell.js';

const CAT_ORDER = [['major', 'Major'], ['minor', 'Minor'], ['mode', 'Modes'], ['pentatonic', 'Pentatonic & blues'], ['world', 'World'], ['symmetric', 'Symmetric']];
const MOOD = { bright: '#e9c47a', dark: '#b8564f', cool: '#63b9a6' };
const TABS = [['scales', 'Scales & modes'], ['chords', 'Chords'], ['progs', 'Progressions'], ['circle', 'Circle of fifths']];

const B = {
  tab: store.get('bench.tab', 'scales'), root: store.get('bench.root', 0), scale: store.get('bench.scale', 'ionian'),
  chord: 'maj', inv: 0, prog: 'axis', bpm: 84, ext: store.get('ext9', false), tuning: store.get('bench.tuning', 'gtr-std'),
  drone: [], loop: null, circleRot: 0,

  mount(el) {
    el.innerHTML = vhead('The Bench', 'Pick a sound. <em>Hear what it does.</em>', 'Scales, chords and progressions in all twelve keys, spelled properly, written on the staff, laid out on the neck and explained in plain language.')
      + `<div class="seg bench-tabs" role="tablist" aria-label="Bench tools">${TABS.map(([v, n]) => `<button role="tab" data-act="bench.tab" data-v="${v}" aria-selected="${v === B.tab}">${n}</button>`).join('')}</div>
      <div id="benchBody" class="bench-body"></div>`;
    B.render();
  },
  render() {
    B.stopAll(true);
    $$('[data-act="bench.tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.v === B.tab)));
    ({ scales: B.scales, chords: B.chords, progs: B.progs, circle: B.circle })[B.tab]();
  },

  /* ---------------- scales ---------------- */
  scales() {
    const sc = scaleById(B.scale);
    useKey(B.root, sc); KB.setKey(B.root, B.scale);
    const sp = spellScale(B.root, sc);
    const hept = sc.iv.length === 7;
    const chords = hept ? sc.iv.map((_, i) => { const rel = diatonic(sc.iv, i, 4), q = nameQuality(rel), r = pc(B.root + sc.iv[i]); return { i, r, q, name: sp[i].name + q, roman: romanFor(i, q) }; }) : [];
    const cats = CAT_ORDER.map(([c, n]) => {
      const list = OT.SCALES.filter(s => s.cat === c); if (!list.length) return '';
      return `<div class="scat"><span class="plabel">${n}</span><div class="row">${list.map(s => `<button class="chip" data-act="bench.scale" data-v="${s.id}" aria-pressed="${s.id === B.scale}"><i class="dot" style="--c:${MOOD[s.mood] || '#8d7b64'}"></i>${esc(s.n)}</button>`).join('')}</div></div>`;
    }).join('');
    const run = B.run();
    $('#benchBody').innerHTML = `
      <div class="bench-grid">
        <aside class="panel plain pick-col">
          <span class="plabel">Key</span>${keyPicker(B.root, 'bench.root')}
          <div class="scats">${cats}</div>
          <p class="hint mood-key"><i class="dot" style="--c:${MOOD.bright}"></i>bright <i class="dot" style="--c:${MOOD.dark}"></i>dark <i class="dot" style="--c:${MOOD.cool}"></i>cool</p>
        </aside>
        <div class="stack">
          <section class="panel">
            <div class="panel-h">
              <h3>${esc(sp[0].name)} ${esc(sc.n)}<small>${esc(sc.alt)}</small></h3>
              ${playBtn('bench.playScale', false, 'Hear it', 'Stop', 'scaleBtn')}
              <button class="btn btn-ghost" data-act="bench.playScale" data-v="down">Down</button>
            </div>
            <div class="row" style="margin:-4px 0 16px">
              <button class="chip" data-act="bench.ext" aria-pressed="${B.ext}" title="Carry the run past the octave">Through the 9th</button>
              <button class="chip pat" data-act="bench.drone" aria-pressed="${B.drone.length > 0}" title="Hold the root underneath so the colour of each degree is obvious">Drone underneath</button>
            </div>
            <div class="degs" id="scaleDegs">${sp.map((n, i) => `<button class="deg ${i === 0 ? 'root' : ''}" data-act="bench.note" data-v="${midiOf(B.root, 4) + sc.iv[i]}" data-i="${i}"><b>${esc(n.name)}</b><i>${esc(sc.deg[i])}</i></button>`).join('')}
              <button class="deg root" data-act="bench.note" data-v="${midiOf(B.root, 5)}" data-i="${sc.iv.length}"><b>${esc(sp[0].name)}</b><i>8</i></button></div>
            <div class="staffbox" id="scaleStaff">${Staff.render(run.map(r => r.m), { hints: run.map(r => r.sp), alt: sp[0].name + ' ' + sc.n + ' on the staff', clef: 'treble' })}</div>
            <div class="neck-head"><span class="plabel">On the neck</span>
              <div class="chips-scroll">${OT.TUNINGS.map(t => `<button class="chip" data-act="bench.tuning" data-v="${t.id}" aria-pressed="${t.id === B.tuning}">${esc(t.n)}</button>`).join('')}</div></div>
            <div class="neckbox" id="neckBox">${B.neck(sc, sp)}</div>
            <p class="hint">${esc((OT.TUNINGS.find(t => t.id === B.tuning) || {}).note || '')} Tap any dot to hear it.</p>
          </section>
          ${hept ? `<section class="panel">
            <div class="panel-h"><h3>Chords that live here</h3><button class="btn btn-ghost btn-sm" data-act="bench.allChords">Play in order</button></div>
            <div class="degs chords-in">${chords.map(c => `<button class="deg" data-act="bench.diatonic" data-v="${c.i}"><b>${esc(c.name)}</b><i>${esc(c.roman)}</i></button>`).join('')}</div>
            <p class="hint" style="margin-top:12px">Stack every other note of the scale and these are the chords you get. Progressions are built from them.</p>
          </section>` : `<section class="panel plain"><p class="note-txt"><span class="kv">No tidy chord family</span>This scale does not have seven notes, so stacking thirds does not produce a neat set of chords the way the major scale does. It works as melodic colour over harmony borrowed from elsewhere, or over a drone. Try the drone.</p></section>`}
          <section class="panel plain explain">
            <p class="note-txt"><span class="kv">What it is</span>${esc(sc.read)}</p>
            <p class="note-txt"><span class="kv">Where you hear it</span>${esc(sc.ctx)}</p>
            <p class="note-txt trap"><span class="kv">The trap</span><b>${esc(sc.trap)}</b></p>
          </section>
        </div>
      </div>`;
  },
  run() {
    const sc = scaleById(B.scale), sp = spellScale(B.root, sc), base = midiOf(B.root, 4);
    const out = sc.iv.map((iv, i) => ({ m: base + iv, sp: sp[i], i }));
    out.push({ m: base + 12, sp: sp[0], i: sc.iv.length });
    if (B.ext) sc.iv.slice(1).forEach((iv, k) => { if (iv <= 5) out.push({ m: base + 12 + iv, sp: sp[k + 1], i: sc.iv.length + 1 + k }); });
    return out;
  },
  playScale(down) {
    A.resume(); B.stopAll(true);
    let run = B.run(); if (down) run = run.slice().reverse();
    const gap = .22, t0 = A.ctx.currentTime + .05;
    run.forEach((r, k) => {
      A.play(r.m, { at: t0 + k * gap, dur: gap * 1.9, vel: .72, human: .8 });
      at(t0 + k * gap, () => {
        $$('#scaleDegs .deg').forEach(d => d.classList.toggle('now', +d.dataset.i === r.i || (r.i === run.length && false)));
        Staff.light($('#scaleStaff'), run.indexOf(r) === -1 ? -1 : (down ? run.length - 1 - k : k));
      }, B);
    });
    at(t0 + run.length * gap + .2, () => { $$('#scaleDegs .deg').forEach(d => d.classList.remove('now')); Staff.light($('#scaleStaff'), -1, true); }, B);
  },
  neck(sc, sp) {
    const T = OT.TUNINGS.find(t => t.id === B.tuning) || OT.TUNINGS[0];
    const n = T.notes.length, frets = 15, W = 1000, gapY = 26, top = 22, H = top * 2 + gapY * (n - 1);
    const x0 = 46, x1 = 985, k = (x1 - x0) / (1 - Math.pow(2, -frets / 12));
    const fx = f => x0 + k * (1 - Math.pow(2, -f / 12));
    const pcs = sc.iv.map(i => pc(B.root + i));
    let g = `<rect x="${x0}" y="${top - 12}" width="${x1 - x0}" height="${H - top * 2 + 24}" rx="3" class="nk-wood"/>`;
    [3, 5, 7, 9, 15].forEach(f => { g += `<circle cx="${(fx(f - 1) + fx(f)) / 2}" cy="${H / 2}" r="6" class="nk-inlay"/>`; });
    [H / 2 - gapY, H / 2 + gapY].forEach(y => { g += `<circle cx="${(fx(11) + fx(12)) / 2}" cy="${y}" r="6" class="nk-inlay"/>`; });
    for (let f = 1; f <= frets; f++) g += `<line x1="${fx(f)}" x2="${fx(f)}" y1="${top - 12}" y2="${H - top + 12}" class="nk-fret"/><text x="${(fx(f - 1) + fx(f)) / 2}" y="${H + 2}" class="nk-num">${[3, 5, 7, 9, 12, 15].includes(f) ? f : ''}</text>`;
    g += `<rect x="${x0 - 6}" y="${top - 12}" width="7" height="${H - top * 2 + 24}" class="nk-nut"/>`;
    const strs = T.notes.map((p, i) => ({ p, midi: midiOf(p, T.oct[i]) })).reverse();   /* high string on top */
    strs.forEach((s, i) => { const y = top + i * gapY; g += `<line x1="${x0 - 30}" x2="${x1}" y1="${y}" y2="${y}" class="nk-str" style="stroke-width:${1 + (i / (n - 1)) * 1.6}"/><text x="14" y="${y + 4}" class="nk-open">${esc(rootName(s.p, false))}</text>`; });
    strs.forEach((s, i) => {
      const y = top + i * gapY;
      for (let f = 0; f <= frets; f++) {
        const m = s.midi + f, k2 = pcs.indexOf(pc(m)); if (k2 < 0) continue;
        const x = f === 0 ? x0 - 18 : (fx(f - 1) + fx(f)) / 2;
        g += `<g class="nk-dot ${k2 === 0 ? 'root' : ''}" data-act="bench.note" data-v="${m}" role="button" aria-label="${esc(midiName(m))}"><circle cx="${x}" cy="${y}" r="10.5"/><text x="${x}" y="${y + 3.6}">${esc(sc.deg[k2])}</text></g>`;
      }
    });
    return `<svg class="fbneck" viewBox="0 0 ${W} ${H + 8}" role="img" aria-label="${esc(sp[0].name + ' ' + sc.n)} on the ${esc(T.n)}">${g}</svg>`;
  },
  droneOn() {
    A.resume();
    const r = midiOf(B.root, 2);
    B.drone = [A.play(r, { voice: 'syn_pad', vel: .55, dur: null }), A.play(r + 7, { voice: 'syn_pad', vel: .42, dur: null }), A.play(r + 12, { voice: 'syn_pad', vel: .35, dur: null })].filter(Boolean);
  },
  droneOff() { B.drone.forEach(h => h.release(A.ctx.currentTime)); B.drone = []; },

  /* ---------------- chords ---------------- */
  voiced() {
    const ch = chordById(B.chord);
    let n = ch.iv.map(i => midiOf(B.root, 4) + i);
    for (let k = 0; k < B.inv; k++) n.push(n.shift() + 12);
    if (n[0] > 66) n = n.map(x => x - 12);
    return n;
  },
  chords() {
    const ch = chordById(B.chord);
    KB.setTones(B.root, ch.iv.map(i => B.root + i));
    const notes = B.voiced();
    const sp = spellChord(B.root, ch.iv, OT.FLAT_KEYS.includes(B.root));
    const spOf = m => sp[ch.iv.findIndex(i => pc(B.root + i) === pc(m))];
    const groups = [['triad', 'Triads'], ['seventh', 'Sevenths'], ['extended', 'Extended']];
    $('#benchBody').innerHTML = `
      <div class="bench-grid">
        <aside class="panel plain pick-col">
          <span class="plabel">Root</span>${keyPicker(B.root, 'bench.croot', 'Root')}
          <div class="scats">${groups.map(([c, n]) => `<div class="scat"><span class="plabel">${n}</span><div class="row">${OT.CHORDS.filter(x => x.cat === c).map(x => `<button class="chip" data-act="bench.chord" data-v="${x.id}" aria-pressed="${x.id === B.chord}">${esc(x.n)}</button>`).join('')}</div></div>`).join('')}</div>
        </aside>
        <div class="stack">
          <section class="panel">
            <div class="panel-h"><h3>${esc(sp[0].name + ch.sym)}<small>${esc(ch.n)}</small></h3>
              ${playBtn('bench.playChord', false, 'Play')}
              <button class="btn btn-ghost" data-act="bench.playChord" data-v="arp">Arpeggiate</button></div>
            <div class="row" style="margin:-4px 0 16px"><span class="plabel">Inversion</span>
              ${[0, 1, 2, 3].filter(i => i < ch.iv.length).map(i => `<button class="chip" data-act="bench.inv" data-v="${i}" aria-pressed="${i === B.inv}">${['Root position', '1st', '2nd', '3rd'][i]}</button>`).join('')}</div>
            <div class="degs">${notes.map((m, i) => { const s = spOf(m); const iv = OT.INTERVALS.find(x => x.s === pc(m - B.root)); return `<button class="deg ${pc(m) === pc(B.root) ? 'root' : ''}" data-act="bench.note" data-v="${m}"><b>${esc(s ? s.name : midiName(m))}</b><i>${esc(iv ? iv.sh : '')}</i></button>`; }).join('')}</div>
            <div class="grid2 even" style="margin-top:16px;align-items:center">
              <div class="staffbox">${Staff.render(notes, { chord: true, hints: notes.map(spOf), clef: 'treble', alt: sp[0].name + ch.sym + ' on the staff' })}</div>
              <p class="note-txt"><span class="kv">Built from the root</span>${ch.iv.map(i => { const iv = OT.INTERVALS.find(x => x.s === i % 12); return esc(iv ? iv.n : i + ' semitones') + (i > 12 ? ' (an octave up)' : ''); }).join(' · ')}</p>
            </div>
          </section>
          <section class="panel plain explain">
            <p class="note-txt"><span class="kv">What it is</span>${esc(ch.read)}</p>
            <p class="note-txt"><span class="kv">Where you hear it</span>${esc(ch.ctx)}</p>
            <p class="note-txt trap"><span class="kv">The trap</span><b>${esc(ch.trap)}</b></p>
          </section>
        </div>
      </div>`;
  },
  playChord(arp) {
    A.resume(); const n = B.voiced();
    if (arp) A.seq(n.concat([n[0] + 12]), { gap: .15, dur: 1.4, vel: .7 });
    else { A.chord(n, { dur: 1.9, vel: .66 }); A.play(midiOf(B.root, 2), { dur: 1.9, vel: .45 }); }
  },

  /* ---------------- progressions ---------------- */
  progs() {
    const p = progById(B.prog);
    useKey(B.root, scaleById('ionian')); KB.setKey(B.root, p.mood === 'dark' ? 'aeolian' : 'ionian');
    const cats = [...new Set(OT.PROGS.map(x => x.cat))];
    $('#benchBody').innerHTML = `
      <div class="bench-grid">
        <aside class="panel plain pick-col">
          <span class="plabel">Key</span>${keyPicker(B.root, 'bench.proot')}
          <div class="scats"><div class="scat"><span class="plabel">Progressions</span><div class="row">${OT.PROGS.map(x => `<button class="chip" data-act="bench.prog" data-v="${x.id}" aria-pressed="${x.id === B.prog}">${esc(x.n)}</button>`).join('')}</div></div></div>
        </aside>
        <div class="stack">
          <section class="panel">
            <div class="panel-h"><h3>${esc(p.alt)}<small>${esc(p.n)} in ${esc(rootName(B.root, OT.FLAT_KEYS.includes(B.root)))}</small></h3>
              ${playBtn('bench.loop', false, 'Play loop', 'Stop', 'progBtn')}</div>
            <div class="degs prog-steps" id="progSteps">${p.steps.map((s, i) => { const ch = chordById(s[1]); return `<button class="deg" data-act="bench.step" data-v="${i}" data-i="${i}"><b>${esc(rootName(B.root + s[0], OT.FLAT_KEYS.includes(B.root)) + ch.sym)}</b><i>${esc(romanForStep(s))}</i></button>`; }).join('')}</div>
            <div class="slider-row" style="margin-top:18px"><span class="plabel">Tempo</span><input type="range" min="50" max="160" value="${B.bpm}" data-input="bench.bpm" aria-label="Tempo"><output id="progBpm">${B.bpm}</output></div>
            <div class="row" style="margin-top:14px"><button class="chip" data-act="bench.toSketch">Open this in the Sketchpad</button></div>
          </section>
          <section class="panel plain explain">
            <p class="note-txt"><span class="kv">What it is</span>${esc(p.read)}</p>
            <p class="note-txt"><span class="kv">Why it works</span>${esc(p.ctx)}</p>
            <p class="note-txt trap"><span class="kv">The trap</span><b>${esc(p.trap)}</b></p>
          </section>
        </div>
      </div>`;
  },
  voicings() {
    const p = progById(B.prog); let prev = null;
    return p.steps.map(s => { const ch = chordById(s[1]); const r = B.root + s[0]; const v = voiceLead(prev, ch.iv.map(i => r + i), { center: 62 }); prev = v; return { v, bass: midiOf(pc(r), 2) + (pc(r) > 7 ? 0 : 12) }; });
  },
  playStep(i, t) {
    const vs = B.voicings(), s = vs[i];
    A.chord(s.v, { at: t, dur: (60 / B.bpm) * 2 * .95, vel: .58, strum: .02 });
    A.play(s.bass, { at: t, dur: (60 / B.bpm) * 2 * .9, vel: .55 });
    at(t, () => $$('#progSteps .deg').forEach(d => d.classList.toggle('now', +d.dataset.i === i)), B);
  },
  toggleLoop() {
    if (B.loop && B.loop.running) { B.stopAll(); return; }
    const p = progById(B.prog);
    B.loop = new Loop({ bpm: B.bpm, div: .5, onStep: (step, t) => B.playStep(step % p.steps.length, t) });
    B.loop.start(); setPlayBtn($('#progBtn'), true, 'Play loop');
  },

  /* ---------------- circle of fifths ---------------- */
  circle() {
    const idx = OT.CIRCLE.findIndex(k => k.pc === B.root), cur = OT.CIRCLE[idx < 0 ? 0 : idx];
    useKey(B.root, scaleById('ionian')); KB.setKey(B.root, 'ionian');
    const R = 200, r1 = 196, r2 = 136, r3 = 92;
    const P = (r, a) => [R + r * Math.cos(a), R + r * Math.sin(a)];
    const arc = (ra, rb, a0, a1) => { const [x1, y1] = P(ra, a0), [x2, y2] = P(ra, a1), [x3, y3] = P(rb, a1), [x4, y4] = P(rb, a0); return `M${x1} ${y1}A${ra} ${ra} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${rb} ${rb} 0 0 0 ${x4} ${y4}Z`; };
    let segs = '';
    OT.CIRCLE.forEach((k, i) => {
      const a0 = (i * 30 - 105) * Math.PI / 180, a1 = ((i + 1) * 30 - 105) * Math.PI / 180, mid = (a0 + a1) / 2;
      const d = ((i - idx) % 12 + 12) % 12;
      const inKey = d === 0 || d === 1 || d === 11, inMin = d === 0 || d === 1 || d === 11;
      const [tx, ty] = P((r1 + r2) / 2, mid), [mx, my] = P((r2 + r3) / 2, mid);
      const rot = (i * 30);
      segs += `<g class="seg ${d === 0 ? 'on' : ''} ${inKey ? 'dia' : ''}" data-act="bench.circle" data-v="${k.pc}" role="button" aria-label="${esc(k.maj)} major, ${esc(k.min)}, ${esc(k.sig)}">
        <path d="${arc(r1, r2, a0, a1)}" class="maj-seg ${i % 2 ? 'alt' : ''}"/><path d="${arc(r2, r3, a0, a1)}" class="min-seg ${inMin ? 'dia' : ''} ${i % 2 ? 'alt' : ''}"/>
        <g class="lbl" style="transform:rotate(${-B.circleRot}deg)"><text x="${tx}" y="${ty + 7}" class="t-maj">${esc(k.maj)}</text></g>
        <g class="lbl" style="transform:rotate(${-B.circleRot}deg)"><text x="${mx}" y="${my + 4}" class="t-min">${esc(k.min)}</text></g></g>`;
    });
    const target = -(idx < 0 ? 0 : idx) * 30;
    let delta = target - B.circleRot; delta = ((delta + 180) % 360 + 360) % 360 - 180;
    const next = B.circleRot + delta;
    const iv = scaleById('ionian').iv, sp = spellScale(B.root, scaleById('ionian'));
    $('#benchBody').innerHTML = `
      <div class="grid2 circle-grid">
        <section class="panel cof-panel">
          <div class="cof-wrap">
            <svg class="cof" viewBox="0 0 400 400" role="group" aria-label="Circle of fifths">
              <g class="cof-rot" style="transform:rotate(${B.circleRot}deg)" id="cofRot">${segs}</g>
              <circle cx="200" cy="200" r="${r3 - 2}" class="cof-hub"/>
              <text x="200" y="196" class="t-hub">${esc(cur.maj)}</text>
              <text x="200" y="222" class="t-hub2">${esc(cur.min)} · ${esc(cur.sig)}</text>
              <path d="M200 6 l-7 -1 7 14 7 -14z" class="cof-pointer"/>
            </svg>
          </div>
          <p class="hint" style="text-align:center">Tap a key to hear its chord. The lit band is the family of chords that belong to the key at the top.</p>
          <div class="row" style="justify-content:center;margin-top:12px"><button class="btn btn-brass" data-act="bench.walk">Walk the circle</button><button class="btn btn-ghost" data-act="bench.cofScale">Open in scales</button></div>
        </section>
        <div class="stack">
          <section class="panel">
            <div class="panel-h"><h3>${esc(sp[0].name)} major<small>${esc(cur.sig === '–' ? 'no sharps or flats' : cur.sig)}</small></h3></div>
            <div class="degs">${[3, 0, 4, 1, 5, 2, 6].map(i => { const rel = diatonic(iv, i, 3), q = nameQuality(rel); return `<button class="deg" data-act="bench.cofChord" data-v="${i}"><b>${esc(sp[i].name + q)}</b><i>${esc(romanFor(i, q))}</i></button>`; }).join('')}</div>
            <p class="hint" style="margin-top:12px">Ordered as they sit on the wheel: IV, I and V on the outer ring, their relative minors inside, and the diminished chord at the edge of the family.</p>
          </section>
          <section class="panel plain explain">
            <p class="note-txt"><span class="kv">What you are looking at</span>Twelve keys arranged so each step clockwise is a perfect fifth up. Because that is the strongest root motion in tonal music, keys that sit next to each other share six of their seven notes.</p>
            <p class="note-txt"><span class="kv">Why it is useful</span>It answers three questions at once: which sharps or flats a key has, what its relative minor is, and which keys you can move to without the join showing. Anything adjacent is a smooth move.</p>
            <p class="note-txt trap"><span class="kv">The trap</span><b>It is a map, not a rule. Distant modulations are perfectly usable; they just need preparation, or the deliberate shock of having none.</b></p>
          </section>
        </div>
      </div>`;
    requestAnimationFrame(() => {
      const g = $('#cofRot'); if (!g) return;
      g.style.transform = `rotate(${next}deg)`;
      $$('#cofRot .lbl').forEach(l => { l.style.transform = `rotate(${-next}deg)`; });
      B.circleRot = next;
    });
  },

  stopAll(quiet) {
    if (B.loop) { B.loop.stop(); B.loop = null; setPlayBtn($('#progBtn'), false, 'Play loop'); }
    clearQueue(B);
    $$('#benchBody .deg.now').forEach(d => d.classList.remove('now'));
    if (!quiet && B.drone.length) { B.droneOff(); }
  }
};

act({
  'bench.tab': el => { B.tab = el.dataset.v; store.set('bench.tab', B.tab); if (B.drone.length) B.droneOff(); B.render(); },
  'bench.root': el => { B.root = +el.dataset.v; store.set('bench.root', B.root); if (B.drone.length) { B.droneOff(); B.droneOn(); } B.scales(); B.playScale(); },
  'bench.scale': el => { B.scale = el.dataset.v; store.set('bench.scale', B.scale); B.scales(); B.playScale(); },
  'bench.playScale': el => { if (el.dataset.v === 'down') B.playScale(true); else B.playScale(false); },
  'bench.ext': () => { B.ext = !B.ext; store.set('ext9', B.ext); B.scales(); B.playScale(); },
  'bench.drone': el => { if (B.drone.length) B.droneOff(); else B.droneOn(); el.setAttribute('aria-pressed', String(B.drone.length > 0)); },
  'bench.tuning': el => { B.tuning = el.dataset.v; store.set('bench.tuning', B.tuning); const sc = scaleById(B.scale); $('#neckBox').innerHTML = B.neck(sc, spellScale(B.root, sc)); $$('[data-act="bench.tuning"]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); },
  'bench.note': el => { A.resume(); A.play(+el.dataset.v, { dur: 1.2, vel: .78 }); if (el.classList.contains('deg')) { el.classList.remove('ring'); void el.offsetWidth; el.classList.add('ring'); } },
  'bench.diatonic': el => { A.resume(); const sc = scaleById(B.scale), i = +el.dataset.v; const base = midiOf(B.root, 3) + sc.iv[i]; A.chord(diatonic(sc.iv, i, 4).map(r => base + r), { dur: 1.7, vel: .62 }); },
  'bench.allChords': () => {
    A.resume(); const sc = scaleById(B.scale); let prev = null; const t0 = A.ctx.currentTime + .05;
    sc.iv.forEach((iv, i) => {
      const r = B.root + iv, v = voiceLead(prev, diatonic(sc.iv, i, 4).map(x => r + x), { center: 64 }); prev = v;
      A.chord(v, { at: t0 + i * .7, dur: .9, vel: .55 }); A.play(midiOf(pc(r), 2) + 12, { at: t0 + i * .7, dur: .9, vel: .5 });
      at(t0 + i * .7, () => $$('.chords-in .deg').forEach((d, k) => d.classList.toggle('now', k === i)), B);
    });
    at(t0 + 7 * .7, () => $$('.chords-in .deg').forEach(d => d.classList.remove('now')), B);
  },
  'bench.croot': el => { B.root = +el.dataset.v; store.set('bench.root', B.root); B.chords(); B.playChord(); },
  'bench.chord': el => { B.chord = el.dataset.v; B.inv = 0; B.chords(); B.playChord(); },
  'bench.inv': el => { B.inv = +el.dataset.v; B.chords(); B.playChord(); },
  'bench.playChord': el => B.playChord(el.dataset.v === 'arp'),
  'bench.proot': el => { B.root = +el.dataset.v; store.set('bench.root', B.root); const was = B.loop && B.loop.running; B.progs(); if (was) B.toggleLoop(); },
  'bench.prog': el => { B.prog = el.dataset.v; const was = B.loop && B.loop.running; B.stopAll(true); B.progs(); if (was) B.toggleLoop(); else { A.resume(); B.playStep(0, A.ctx.currentTime + .03); } },
  'bench.step': el => { A.resume(); B.playStep(+el.dataset.v, A.ctx.currentTime + .02); },
  'bench.loop': () => B.toggleLoop(),
  'bench.toSketch': () => { const p = progById(B.prog); store.set('sketch.import', { key: B.root, steps: p.steps, bpm: B.bpm, name: p.alt }); go('sketch'); },
  'bench.circle': el => { B.root = +el.dataset.v; store.set('bench.root', B.root); A.resume(); A.chord([0, 4, 7].map(i => midiOf(B.root, 4) + i), { dur: 1.6, vel: .6 }); A.play(midiOf(B.root, 2), { dur: 1.6, vel: .45 }); B.circle(); },
  'bench.cofChord': el => { A.resume(); const iv = scaleById('ionian').iv, i = +el.dataset.v, base = midiOf(B.root, 3) + iv[i]; A.chord(diatonic(iv, i, 3).map(r => base + r), { dur: 1.5, vel: .62 }); },
  'bench.cofScale': () => { B.scale = 'ionian'; B.tab = 'scales'; B.render(); B.playScale(); },
  'bench.walk': () => {
    A.resume(); const t0 = A.ctx.currentTime + .05;
    OT.CIRCLE.forEach((k, i) => {
      A.chord([0, 4, 7].map(x => midiOf(k.pc, 3) + x + (k.pc > 6 ? 0 : 12)), { at: t0 + i * .62, dur: .75, vel: .5 });
      A.play(midiOf(k.pc, 2), { at: t0 + i * .62, dur: .75, vel: .45 });
      at(t0 + i * .62, () => { if (B.tab !== 'circle') return; B.root = k.pc; B.circle(); }, B);
    });
  }
});
onInput({ 'bench.bpm': el => { B.bpm = +el.value; $('#progBpm').textContent = B.bpm; if (B.loop) B.loop.bpm = B.bpm; } });

/* other rooms can open the bench on a particular scale */
export function openBench({ root, scale, tab = 'scales' }) {
  if (root != null) { B.root = root; store.set('bench.root', root); }
  if (scale) { B.scale = scale; store.set('bench.scale', scale); }
  B.tab = tab; store.set('bench.tab', tab);
  if ($('#benchBody')) B.render();
  go('bench');
}

defineView('bench', {
  mount: el => B.mount(el),
  show() { if (B.tab === 'scales') { useKey(B.root, scaleById(B.scale)); KB.setKey(B.root, B.scale); } },
  hide() { B.stopAll(); },
  stop() { B.stopAll(); },
  sub(t) { if (TABS.some(x => x[0] === t)) { B.tab = t; B.render(); } }
});
