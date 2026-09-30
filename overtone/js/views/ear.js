/* OVERTONE · Ear Training
   Seven drills. Wrong answers are never a dead end: you can hear your
   pick next to the real one, which is how the ear actually learns.
   Keys: 1–9 answer, R replays, N skips. */
import { $, $$, esc, store, act, defineView, shuffle, rand, OT } from '../util.js';
import { A } from '../audio.js';
import { at, clearQueue } from '../clock.js';
import { KB } from '../keybed.js';
import { Staff } from '../staff.js';
import { pc, midiOf, pcName, chordById, setFlats } from '../music.js';
import { vhead, EAR_DRILLS } from './shared.js';

const BLURB = {
  interval: 'Sing the answer back before you choose. Producing the interval trains recognition faster than hearing it.',
  chord: 'Listen for the third first: it decides major or minor before anything else does.',
  scale: 'Find the degree that sounds unusual. One altered note is usually the whole identity of a mode.',
  prog: 'Follow the bass. Root motion gives a progression away faster than the chords on top.',
  meter: 'Count out loud and find the strongest beat. That is one, and the distance between ones is your answer.',
  read: 'Every Good Boy Deserves Fudge for the lines, FACE for the spaces (treble). Find the nearest landmark and step from it.',
  pitch: 'This one rewards absolute pitch, which most people do not have. Treat a lucky streak as luck, and enjoy it anyway.'
};
const MODES = { interval: [['up', 'Rising'], ['down', 'Falling'], ['harm', 'Together']] };

const E = {
  drill: store.get('ear.drill', 'interval'), mode: store.get('ear.mode', 'up'), q: null, score: 0, streak: 0, tries: 0, locked: false,
  mount(el) {
    el.innerHTML = vhead('Ear Training', 'The one skill that <em>transfers to everything.</em>', 'Seven drills, from naming intervals to hearing modes and meters. Your best streaks stay on this device.') + '<div id="earBody"></div>';
    E.render();
    addEventListener('keydown', E.keys);
  },
  render() {
    const best = store.get('best.' + E.drill, 0);
    $('#earBody').innerHTML = `
      <div class="ear-tabs chips-scroll">${EAR_DRILLS.map(([v, n]) => `<button class="chip" data-act="ear.drill" data-v="${v}" aria-pressed="${v === E.drill}">${n}</button>`).join('')}</div>
      <div class="ear-stage">
        <div class="ear-station panel">
          ${MODES[E.drill] ? `<div class="seg seg-sm ear-mode" role="tablist">${MODES[E.drill].map(([v, n]) => `<button role="tab" data-act="ear.mode" data-v="${v}" aria-selected="${v === E.mode}">${n}</button>`).join('')}</div>` : ''}
          <div class="staffbox ear-staff" id="earStaff" ${E.drill === 'read' ? '' : 'hidden'}></div>
          <button class="ear-play" data-act="ear.play" aria-label="Play the question again (R)"><span class="ep-ring"></span><span class="ep-hole"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></button>
          <p class="ear-prompt" id="earPrompt">Listen, then choose</p>
          <div class="ear-answers" id="earAns"></div>
          <p class="ear-msg" id="earMsg" aria-live="polite"></p>
          <div class="row ear-after" id="earAfter"></div>
        </div>
        <aside class="ear-side">
          <div class="plates">
            <div class="plate"><span class="plabel">Score</span><b id="earScore">${E.score}</b><small id="earAcc">${E.tries ? Math.round(E.score / E.tries * 100) + '% right' : 'this session'}</small></div>
            <div class="plate"><span class="plabel">Best streak</span><b id="earBest">${best}</b><small>on this device</small></div>
          </div>
          <div class="streak"><span class="plabel">Streak</span><div class="streak-frets" id="earStreak">${Array.from({ length: 12 }, (_, i) => `<i class="${i < E.streak % 13 ? 'on' : ''}"></i>`).join('')}</div></div>
          <p class="note-txt"><span class="kv">How to listen</span>${esc(BLURB[E.drill])}</p>
          <p class="hint">Keys: <kbd>1</kbd>–<kbd>9</kbd> answer · <kbd>R</kbd> replay · <kbd>N</kbd> next</p>
        </aside>
      </div>`;
    E.next();
  },
  pickAns(pool, n, same) { const opts = shuffle(pool).slice(0, n), ans = rand(opts); return { opts, ans, same }; },
  next() {
    clearQueue(E);
    E.locked = false;
    const g = E.drill;
    let q;
    if (g === 'interval') { const p = E.pickAns(OT.INTERVALS.filter(i => i.s > 0 && i.s <= 12), 6); q = { ...p, root: 55 + Math.floor(Math.random() * 10), labels: p.opts.map(o => o.n), right: p.opts.indexOf(p.ans) }; }
    else if (g === 'chord') { const pool = OT.CHORDS.filter(c => ['maj', 'min', 'dim', 'aug', '7', 'maj7', 'm7', 'm7b5', 'dim7', 'sus4'].includes(c.id)); const p = E.pickAns(pool, 6); q = { ...p, root: 55 + Math.floor(Math.random() * 9), labels: p.opts.map(o => o.n), right: p.opts.indexOf(p.ans) }; }
    else if (g === 'scale') { const pool = OT.SCALES.filter(s => ['ionian', 'aeolian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'harmonic', 'minpent', 'blues', 'wholetone'].includes(s.id)); const p = E.pickAns(pool, 5); q = { ...p, root: 55 + Math.floor(Math.random() * 8), labels: p.opts.map(o => o.n), right: p.opts.indexOf(p.ans) }; }
    else if (g === 'prog') { const p = E.pickAns(OT.PROGS.filter(x => x.steps.length <= 4), 5); q = { ...p, root: 55 + Math.floor(Math.random() * 7), labels: p.opts.map(o => o.n + ' · ' + o.alt), right: p.opts.indexOf(p.ans) }; }
    else if (g === 'meter') { const p = E.pickAns(OT.METERS, 5); q = { ...p, labels: p.opts.map(o => o.n), right: p.opts.indexOf(p.ans) }; }
    else if (g === 'read') {
      const clef = Math.random() < .5 ? 'treble' : 'bass', naturals = [0, 2, 4, 5, 7, 9, 11];
      let midi; do { midi = (clef === 'bass' ? 41 : 57) + Math.floor(Math.random() * 18); } while (!naturals.includes(pc(midi)));
      const opts = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      q = { ans: midi, clef, labels: opts, right: opts.indexOf(OT.SHARP[pc(midi)]) };
    } else { const p0 = Math.floor(Math.random() * 12); q = { ans: p0, root: midiOf(p0, 4), labels: OT.SHARP.slice(), right: p0 }; }
    E.q = q;
    setFlats(false);
    $('#earAns').innerHTML = q.labels.map((l, i) => `<button data-act="ear.answer" data-v="${i}"><kbd>${i + 1 <= 9 ? i + 1 : ''}</kbd>${esc(l)}</button>`).join('');
    $('#earMsg').textContent = ''; $('#earAfter').innerHTML = '';
    const st = $('#earStaff'); if (st) st.innerHTML = g === 'read' ? Staff.render([q.ans], { clef: q.clef, alt: 'Name this note' }) : '';
    $('#earPrompt').textContent = { read: 'Name the note on the staff', pitch: 'Which note is this?', meter: 'How many beats in the bar?' }[g] || 'Listen, then choose';
    setTimeout(() => E.play(), 250);
  },
  play(which) {
    A.resume(); clearQueue(E);
    const q = E.q, g = E.drill; if (!q) return;
    const item = which != null ? q.opts[which] : q.ans;
    const pulse = () => { const b = $('.ear-play'); if (b) { b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); } };
    pulse();
    if (g === 'interval') {
      const a = q.root, b = q.root + item.s * (E.mode === 'down' ? -1 : 1);
      if (E.mode === 'harm') A.chord([a, b], { dur: 1.6, vel: .7, strum: 0 });
      else { A.play(a, { dur: .9, vel: .74 }); A.play(b, { dur: 1.2, vel: .74, when: .6 }); }
    }
    else if (g === 'chord') { A.chord(item.iv.map(i => q.root + i), { dur: 1.8, vel: .64 }); A.play(q.root - 12, { dur: 1.8, vel: .45 }); }
    else if (g === 'scale') A.seq(item.iv.map(i => q.root + i).concat([q.root + 12]), { gap: .21, dur: .42, vel: .7 });
    else if (g === 'prog') item.steps.forEach(([d, c], i) => { const ch = chordById(c); A.chord(ch.iv.map(x => q.root + d + x), { dur: 1.3, vel: .52, when: i * .78 }); A.play(q.root + d - 12, { dur: 1.3, vel: .48, when: i * .78 }); });
    else if (g === 'meter') E.meter(item);
    else if (g === 'read') A.play(q.ans, { dur: 1.4, vel: .78 });
    else A.play(q.root, { dur: 1.6, vel: .8 });
  },
  meter(m) {
    A.loadKit(); const spb = .42, t0 = A.ctx.currentTime + .08;
    for (let bar = 0; bar < 2; bar++) { let beat = 0; m.group.forEach(gr => { for (let i = 0; i < gr; i++) { const t = t0 + (bar * m.beats + beat) * spb; A.drum(beat === 0 ? 'k' : i === 0 ? 's' : 'h', t, beat === 0 ? 1 : i === 0 ? .6 : .45); beat++; } }); }
  },
  answer(i) {
    if (E.locked) return; E.locked = true;
    const q = E.q, ok = i === q.right;
    E.tries++;
    const btns = $$('#earAns button');
    btns[q.right]?.classList.add('right');
    if (!ok) btns[i]?.classList.add('wrong');
    if (ok) {
      E.score++; E.streak++;
      if (E.streak > store.get('best.' + E.drill, 0)) store.set('best.' + E.drill, E.streak);
      const cue = E.drill === 'interval' ? q.ans.cue : E.drill === 'meter' ? q.ans.hint : '';
      $('#earMsg').innerHTML = `<b>${rand(['Correct.', 'Yes.', 'That’s it.', 'Clean.', 'Nailed it.'])}</b> ${esc(cue || '')}`;
      A.play(84, { voice: 'celesta', dur: .6, vel: .25 });
      setTimeout(() => { if (E.locked && E.q === q) E.next(); }, cue ? 2100 : 1100);
    } else {
      E.streak = 0;
      $('#earMsg').innerHTML = `Not quite. It was <b>${esc(q.labels[q.right])}</b>.`;
      if (q.opts) $('#earAfter').innerHTML = `<button class="chip" data-act="ear.hear" data-v="${i}">Hear yours: ${esc(q.labels[i])}</button><button class="chip pat" data-act="ear.hear" data-v="-1">Hear the answer</button><button class="btn btn-brass btn-sm" data-act="ear.next">Next</button>`;
      else $('#earAfter').innerHTML = `<button class="btn btn-brass btn-sm" data-act="ear.next">Next</button>`;
      if (E.drill === 'pitch' || E.drill === 'read') { KB.flash(E.drill === 'read' ? q.ans : q.root, 900); }
    }
    $('#earScore').textContent = E.score;
    $('#earAcc').textContent = Math.round(E.score / E.tries * 100) + '% right';
    $('#earBest').textContent = store.get('best.' + E.drill, 0);
    $$('#earStreak i').forEach((el, k) => el.classList.toggle('on', k < E.streak % 13));
  },
  keys(e) {
    if (!$('#v-ear.on') || e.metaKey || e.ctrlKey || e.altKey || /input|select|textarea/i.test(e.target.tagName)) return;
    if (/^[1-9]$/.test(e.key)) { const i = +e.key - 1; if (E.q && i < E.q.labels.length) { e.preventDefault(); E.answer(i); } }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); E.play(); }
    else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); E.next(); }
  }
};

act({
  'ear.drill': el => { E.drill = el.dataset.v; store.set('ear.drill', E.drill); E.score = 0; E.streak = 0; E.tries = 0; E.render(); },
  'ear.mode': el => { E.mode = el.dataset.v; store.set('ear.mode', E.mode); $$('[data-act="ear.mode"]').forEach(b => b.setAttribute('aria-selected', String(b === el))); E.play(); },
  'ear.play': () => E.play(),
  'ear.answer': el => E.answer(+el.dataset.v),
  'ear.hear': el => { const v = +el.dataset.v; E.play(v < 0 ? null : v); },
  'ear.next': () => E.next()
});

defineView('ear', { mount: el => E.mount(el), hide() { clearQueue(E); }, show() { KB.setKey(0, null); } });
