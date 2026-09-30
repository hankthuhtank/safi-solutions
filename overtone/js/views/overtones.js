/* OVERTONE · Overtones
   Where the name comes from: the overtone series on one string, and
   the smallest change in harmony (moving a third by a half step).
   Lives as a tab on the Bench. */
import { $, $$, act } from '../util.js';
import { A } from '../audio.js';
import { at, clearQueue } from '../clock.js';
import { KB } from '../keybed.js';

/* ---------- the overtone series ---------- */
const F0 = 130.8128;
const HARM = [[1, 'C3', 48, 0], [2, 'C4', 60, 0], [3, 'G4', 67, 2], [4, 'C5', 72, 0], [5, 'E5', 76, -14], [6, 'G5', 79, 2], [7, 'B♭5', 82, -31], [8, 'C6', 84, 0],
  [9, 'D6', 86, 4], [10, 'E6', 88, -14], [11, 'F♯6', 90, -49], [12, 'G6', 91, 2], [13, 'A♭6', 92, 41], [14, 'B♭6', 94, -31], [15, 'B6', 95, -12], [16, 'C7', 96, 0]];
const WHY = {
  1: 'The fundamental: the whole string swings as one arc. This is the pitch you name.',
  2: 'Two halves, an octave higher: exactly double the frequency. Same note name, higher.',
  3: 'Thirds of the string give the fifth above. The octave and fifth are why power chords sound so solid.',
  4: 'Quarters: two octaves up. The series keeps returning to C at every power of two.',
  5: 'The major third, but 14 cents flatter than a piano’s E. Harmonics 4, 5 and 6 are a major triad: C, E, G.',
  6: 'Another G, an octave above harmonic 3. With 4 and 5 it completes the major chord hidden inside every note.',
  7: 'The “blue” seventh: 31 cents flatter than a piano’s B♭. Barbershop singers and blues players lean on it.',
  8: 'Three octaves up. Everything above here is packed a step or less apart; the ladder gets crowded.',
  9: 'A whole step above C: the major ninth.', 10: 'E again, still 14 cents flat: the same third as harmonic 5, an octave higher.',
  11: 'Right between F and F♯. No piano key comes close. Alphorns and natural horns play this note.', 12: 'G again: the fifth, now four positions up the ladder.',
  13: 'Between A♭ and A, another note equal temperament can’t play.', 14: 'The flat seventh again, an octave above harmonic 7.',
  15: 'B, 12 cents flat: the major seventh.', 16: 'Four octaves above the fundamental.'
};
const cents = c => c === 0 ? 'in tune' : (c > 0 ? '+' : '−') + Math.abs(c) + '¢';
const SER = {
  modes: [[1, 1]], t0: 0, energy: .5, playing: false, raf: 0, visible: false,
  mount() {
    const keys = $('#series .series-keys');
    keys.innerHTML = HARM.map(([n, nm, , c]) => `<button type="button" data-act="series.pick" data-v="${n}" aria-label="Harmonic ${n}, ${nm}, ${cents(c)}"><b>${n}</b><span>${nm}</span><i class="${Math.abs(c) >= 10 ? 'off' : ''}">${cents(c)}</i></button>`).join('');
    SER.cv = $('#seriesCv'); SER.g = SER.cv.getContext('2d');
    new ResizeObserver(() => SER.size()).observe(SER.cv);
    new IntersectionObserver(es => { SER.visible = es[0].isIntersecting; if (SER.visible) SER.kick(); }).observe(SER.cv);
    $('#seriesNote').innerHTML = 'Tap a harmonic <em>·</em> or play the whole series';
    $('#seriesWhy').textContent = WHY[1];
  },
  size() { const r = SER.cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); SER.cv.width = r.width * d; SER.cv.height = r.height * d; SER.g.setTransform(d, 0, 0, d, 0, 0); SER.kick(); },
  select(list, label) {
    SER.modes = list; SER.energy = 1; SER.t0 = performance.now();
    $$('#series .series-keys button').forEach(b => b.setAttribute('aria-pressed', String(list.length === 1 && +b.dataset.v === list[0][0])));
    if (label) $('#seriesNote').innerHTML = label;
    SER.kick();
  },
  pick(n, when = 0) {
    const [, nm, midi, c] = HARM[n - 1];
    A.sine(F0 * n, { when, dur: 1.7, gain: .2 });
    const go = () => {
      SER.select([[n, 1]], `Harmonic ${n} <em>·</em> ${nm} <em>·</em> ${(F0 * n).toFixed(1)} Hz <em>·</em> <span class="${Math.abs(c) >= 10 ? 'off' : ''}">${cents(c)}</span>`);
      $('#seriesWhy').textContent = WHY[n]; KB.flash(midi, 380);
    };
    when ? at(A.ctx.currentTime + when, go, SER) : go();
  },
  kick() { if (!SER.raf && SER.g) SER.raf = requestAnimationFrame(SER.draw); },
  stop() { clearQueue(SER); SER.playing = false; },
  draw(now) {
    SER.raf = 0;
    const g = SER.g, w = SER.cv.clientWidth, h = SER.cv.clientHeight, x0 = 22, x1 = w - 22, cy = h / 2, amp = h * .34;
    const t = (now - SER.t0) / 1000; SER.energy = Math.max(.1, SER.energy * .993);
    g.clearRect(0, 0, w, h);
    const single = SER.modes.length === 1, n1 = SER.modes[0][0];
    if (single) {
      g.strokeStyle = 'rgba(214,162,74,.18)'; g.setLineDash([3, 5]);
      for (let k = 1; k < n1; k++) { const x = x0 + (x1 - x0) * k / n1; g.beginPath(); g.moveTo(x, cy - amp - 6); g.lineTo(x, cy + amp + 6); g.stroke(); }
      g.setLineDash([]);
      g.strokeStyle = 'rgba(99,185,166,.22)';
      [1, -1].forEach(sg => { g.beginPath(); for (let i = 0; i <= 200; i++) { const x = i / 200; g.lineTo(x0 + (x1 - x0) * x, cy + sg * amp * SER.energy * Math.sin(n1 * Math.PI * x)); } g.stroke(); });
    }
    const norm = SER.modes.reduce((s, [, a]) => s + a, 0);
    const shape = x => SER.modes.reduce((s, [n, a]) => s + a * Math.sin(n * Math.PI * x) * Math.cos(t * (.7 + .22 * n) * 2 * Math.PI), 0);
    const grad = g.createLinearGradient(0, cy - amp, 0, cy + amp); grad.addColorStop(0, '#f6eedf'); grad.addColorStop(1, '#d6a24a');
    g.strokeStyle = grad; g.lineWidth = 2.2; g.shadowColor = 'rgba(214,162,74,.55)'; g.shadowBlur = 10;
    g.beginPath(); for (let i = 0; i <= 320; i++) { const x = i / 320; g.lineTo(x0 + (x1 - x0) * x, cy + amp * SER.energy * shape(x) / norm); } g.stroke(); g.shadowBlur = 0;
    g.fillStyle = '#e9c47a';
    [x0, x1].forEach(x => { g.beginPath(); g.moveTo(x - 7, cy + 14); g.lineTo(x + 7, cy + 14); g.lineTo(x + 2, cy - 2); g.lineTo(x - 2, cy - 2); g.closePath(); g.fill(); });
    if (single) { g.fillStyle = '#63b9a6'; for (let k = 1; k < n1; k++) { g.beginPath(); g.arc(x0 + (x1 - x0) * k / n1, cy, 3, 0, 7); g.fill(); } }
    if ((SER.visible && SER.energy > .1) || SER.playing) SER.kick();
  }
};

/* ---------- one small change ---------- */
const THIRD = {
  v: 4,
  draw() {
    const major = THIRD.v === 4;
    $('#thirdName').textContent = major ? 'E' : 'E♭';
    $('#thirdPlay').textContent = 'Play C ' + (major ? 'major' : 'minor');
    $('#thirdRuler').innerHTML = Array.from({ length: 8 }, (_, i) => `<span class="${[0, THIRD.v, 7].includes(i) ? 'on' : ''}"><b>${i}</b><i></i></span>`).join('');
    $('#thirdMeaning').textContent = `From C: ${THIRD.v} semitones up to ${major ? 'E' : 'E♭'}, 7 up to G. The root and fifth have not moved at all.`;
    $$('#thirdStudy [data-act="third.set"]').forEach(b => b.setAttribute('aria-selected', String(+b.dataset.v === THIRD.v)));
  }
};

act({
  'series.pick': el => { A.resume(); if (SER.playing) SER.stop(); A.begin('series', SER.stop); SER.pick(+el.dataset.v); },
  'series.play': () => {
    A.resume(); A.begin('series', SER.stop); SER.playing = true;
    for (let n = 1; n <= 16; n++) SER.pick(n, (n - 1) * .5);
    at(A.ctx.currentTime + 8.4, () => { SER.playing = false; }, SER);
  },
  'series.stack': () => {
    A.resume(); A.begin('series', SER.stop);
    const list = HARM.slice(0, 8).map(([n]) => [n, 1 / n]);
    SER.select(list, 'Harmonics 1–8 together <em>·</em> heard as one note, <span>C3</span>');
    $('#seriesWhy').textContent = 'Played together at falling volumes, the eight partials fuse into one pitch: you hear “a C”, not a chord. Change the balance of these partials and you change the instrument. That balance is what separates a clarinet from a violin.';
    list.forEach(([n, a]) => A.sine(F0 * n, { dur: 2.6, gain: .2 * a })); KB.flash(48, 600);
  },
  'third.set': el => { THIRD.v = +el.dataset.v; THIRD.draw(); A.begin('third'); A.chord([60, 60 + THIRD.v, 67], { dur: 1.4, vel: .55 }); },
  'third.play': () => { A.resume(); A.begin('third'); A.chord([60, 60 + THIRD.v, 67], { dur: 1.4, vel: .6 }); }
});

export function overtonesHtml() {
  return `
    <section class="series-sec" id="series">
      <div class="series-copy">
        <p class="eyebrow">Where the name comes from</p>
        <h2>One note is <em>a whole chord</em> in disguise.</h2>
        <p class="lede">Pluck a string and it swings as a whole, in halves, in thirds and quarters, all at once. Those overtones are why a violin and a flute sound different on the same pitch, and harmonics 4, 5 and 6 spell a major chord. Tap one to hear it alone.</p>
        <div class="row"><button class="btn btn-brass" data-act="series.play">Play the series</button><button class="btn btn-ghost" data-act="series.stack">Stack 1–8 into one note</button></div>
        <p class="series-why" id="seriesWhy" aria-live="polite"></p>
      </div>
      <div class="series-inst">
        <div class="series-head"><span class="plabel">The overtone series on C</span><b id="seriesNote" aria-live="polite"></b></div>
        <canvas id="seriesCv" aria-hidden="true"></canvas>
        <div class="series-keys" role="group" aria-label="Harmonics 1 to 16"></div>
      </div>
    </section>

    <section class="third" id="thirdStudy">
      <div>
        <p class="eyebrow">One small change</p>
        <h2>Move one note.<em>Hear a different chord.</em></h2>
        <p class="lede">Keep C and G where they are. Move only the middle note between E and E♭. That single half step turns the triad from major to minor.</p>
        <div class="row"><div class="seg" role="tablist" aria-label="Chord quality"><button role="tab" data-act="third.set" data-v="4" aria-selected="true">C major</button><button role="tab" data-act="third.set" data-v="3" aria-selected="false">C minor</button></div>
        <button class="btn btn-brass" data-act="third.play" id="thirdPlay">Play C major</button></div>
      </div>
      <div class="third-score">
        <div class="third-notes"><div><b>C</b><span>root</span></div><div class="moving"><b id="thirdName">E</b><span>third</span></div><div><b>G</b><span>fifth</span></div></div>
        <div class="third-ruler" id="thirdRuler" aria-label="Semitones above C"></div>
        <p class="note-txt" id="thirdMeaning" aria-live="polite"></p>
        <p class="hint">Major and minor are structures, not rules about happy or sad. Tempo, rhythm and context decide the feeling.</p>
      </div>
    </section>`;
}
export function mountOvertones() { SER.mount(); THIRD.draw(); SER.kick(); }
export function stopOvertones() { SER.stop(); SER.visible = false; }
