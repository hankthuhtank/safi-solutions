/* OVERTONE · Tuner & Drone
   A microphone tuner (McLeod pitch method, via pitchy) with a brass
   needle and a strobe band, reference strings to tune by ear, and a
   tanpura-style drone to practise intonation against. */
import { $, $$, esc, store, act, onInput, defineView, clamp, toast, OT } from '../util.js';
import { A } from '../audio.js';
import { at, Loop, clearQueue } from '../clock.js';
import { KB } from '../keybed.js';
import { pc, midiOf, rootName } from '../music.js';
import { vhead, keyPicker, playBtn, setPlayBtn } from './shared.js';

const PRESETS = [
  ['chromatic', 'Chromatic', []],
  ['gtr-std', 'Guitar', [40, 45, 50, 55, 59, 64]], ['gtr-drop', 'Drop D', [38, 45, 50, 55, 59, 64]], ['gtr-dadgad', 'DADGAD', [38, 45, 50, 55, 57, 62]],
  ['bass', 'Bass', [28, 33, 38, 43]], ['uke', 'Ukulele', [67, 60, 64, 69]], ['mando', 'Mandolin', [55, 62, 69, 76]],
  ['violin', 'Violin', [55, 62, 69, 76]], ['cello', 'Cello', [36, 43, 50, 57]]
];
const NAMES = OT.SHARP;
const DRONES = [['pa', 'Sa · Pa', 7], ['ma', 'Sa · Ma', 5], ['ni', 'Sa · Ni', 11]];

const T = {
  on: false, stream: null, src: null, an: null, det: null, buf: null, raf: 0, a4: store.get('tuner.a4', 440),
  preset: store.get('tuner.preset', 'chromatic'), hist: [], cents: 0, disp: 0, strobe: 0, lastT: 0, note: null,
  droneKey: store.get('drone.key', 2), droneType: 'pa', droneLoop: null, hum: [],
  html() {
    return `<div class="tuner-grid">
      <section class="panel tuner">
        <svg class="gauge" viewBox="0 0 400 240" aria-hidden="true">
          <defs><linearGradient id="gz" x1="0" x2="1"><stop offset="0" stop-color="#b8564f"/><stop offset=".4" stop-color="#e9c47a"/><stop offset=".5" stop-color="#63b9a6"/><stop offset=".6" stop-color="#e9c47a"/><stop offset="1" stop-color="#b8564f"/></linearGradient>
            <radialGradient id="gf" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#f4ead6"/><stop offset="1" stop-color="#d9caa9"/></radialGradient></defs>
          <path d="M20 220 A180 180 0 0 1 380 220 Z" fill="#1c120b" stroke="#8a6327" stroke-width="4"/>
          <path d="M36 220 A164 164 0 0 1 364 220 Z" fill="url(#gf)"/>
          <path d="M60 220 A140 140 0 0 1 340 220" fill="none" stroke="url(#gz)" stroke-width="8" opacity=".85"/>
          ${Array.from({ length: 21 }, (_, i) => { const c = -50 + i * 5, a = (c / 50) * 70 * Math.PI / 180, r1 = 150, r2 = i % 5 === 0 ? 128 : 138; return `<line x1="${200 + Math.sin(a) * r1}" y1="${220 - Math.cos(a) * r1}" x2="${200 + Math.sin(a) * r2}" y2="${220 - Math.cos(a) * r2}" stroke="#3a2716" stroke-width="${i % 5 === 0 ? 2 : 1}"/>${i % 5 === 0 ? `<text x="${200 + Math.sin(a) * 114}" y="${224 - Math.cos(a) * 114}" class="g-num">${c > 0 ? '+' + c : c}</text>` : ''}`; }).join('')}
          <text x="128" y="206" class="g-lbl">cents</text>
          <g id="needle" style="transform-origin:200px 220px"><line x1="200" y1="220" x2="200" y2="62" stroke="#1a0f06" stroke-width="3" stroke-linecap="round"/><line x1="200" y1="220" x2="200" y2="66" stroke="#b5741f" stroke-width="1.4"/></g>
          <circle cx="200" cy="220" r="12" fill="#8a6327" stroke="#f3d08a" stroke-width="2"/>
        </svg>
        <div class="t-read"><b id="tNote">–</b><span id="tOct"></span></div>
        <p class="t-sub"><span id="tHz">Tap start and play a note</span> · <span id="tCents"></span></p>
        <canvas id="strobe" class="strobe" aria-hidden="true"></canvas>
        <div class="row" style="justify-content:center">${playBtn('tuner.toggle', false, 'Start tuner', 'Stop', 'tBtn')}</div>
        <div class="slider-row a4"><span class="plabel">A4 =</span><input type="range" min="428" max="448" value="${T.a4}" data-input="tuner.a4" aria-label="Reference pitch"><output id="tA4">${T.a4} Hz</output></div>
      </section>
      <div class="stack">
        <section class="panel">
          <div class="panel-h"><h3>Tune by ear</h3></div>
          <div class="chips-scroll">${PRESETS.map(([id, n]) => `<button class="chip" data-act="tuner.preset" data-v="${id}" aria-pressed="${id === T.preset}">${n}</button>`).join('')}</div>
          <div class="strings" id="tStrings">${T.stringsHtml()}</div>
          <p class="hint">Tap a string to hear its target pitch. With the tuner running, the string you are nearest lights up.</p>
        </section>
        <section class="panel drone-panel">
          <div class="panel-h"><h3>Tanpura drone<small>for singing and intonation</small></h3>${playBtn('drone.toggle', false, 'Drone', 'Stop', 'dBtn')}</div>
          <span class="plabel">Sa (home note)</span>${keyPicker(T.droneKey, 'drone.key', 'Drone key')}
          <div class="row" style="margin-top:14px"><span class="plabel">Tuning</span>${DRONES.map(([id, n]) => `<button class="chip" data-act="drone.type" data-v="${id}" aria-pressed="${id === T.droneType}">${n}</button>`).join('')}</div>
          <div class="tanpura" aria-hidden="true">${[0, 1, 2, 3].map(i => `<i data-s="${i}"></i>`).join('')}</div>
          <p class="note-txt">A tanpura never plays a melody. Its four strings are plucked over and over, the fifth or fourth then the home note three times, so the air is always full of the same few pitches. Sing or play a scale against it and every out-of-tune note announces itself.</p>
        </section>
      </div>
    </div>`;
  },
  stringsHtml() {
    const p = PRESETS.find(x => x[0] === T.preset);
    if (!p[2].length) return `<p class="note-txt">Chromatic mode names any note you play. Pick an instrument to see its strings.</p>`;
    return p[2].map((m, i) => `<button class="tstr" data-act="tuner.ref" data-v="${m}" data-i="${i}"><b>${NAMES[pc(m)]}</b><span>${NAMES[pc(m)]}${Math.floor(m / 12) - 1}</span><i style="--w:${1 + (p[2].length - i) * .5}px"></i></button>`).join('');
  },
  async start() {
    try {
      A.resume();
      T.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e) { toast('The microphone is needed for the tuner. You can still tune by ear with the strings.'); return; }
    let mod;
    try { mod = await import('../../vendor/pitchy.js'); } catch (e) { toast('Could not load the pitch detector.'); T.stop(); return; }
    T.src = A.ctx.createMediaStreamSource(T.stream);
    T.an = A.ctx.createAnalyser(); T.an.fftSize = 4096;
    T.src.connect(T.an);
    T.buf = new Float32Array(T.an.fftSize);
    T.det = mod.PitchDetector.forFloat32Array(T.an.fftSize); T.det.minVolumeDecibels = -48;
    T.on = true; setPlayBtn($('#tBtn'), true, 'Start tuner');
    T.loop();
  },
  stop() {
    T.on = false; cancelAnimationFrame(T.raf); T.raf = 0;
    if (T.stream) T.stream.getTracks().forEach(t => t.stop());
    T.stream = null; if (T.src) T.src.disconnect(); T.src = null;
    setPlayBtn($('#tBtn'), false, 'Start tuner');
  },
  loop(now = performance.now()) {
    if (!T.on) return;
    const dt = Math.min(.05, (now - (T.lastT || now)) / 1000); T.lastT = now;
    T.an.getFloatTimeDomainData(T.buf);
    const [f, clarity] = T.det.findPitch(T.buf, A.ctx.sampleRate);
    if (clarity > .92 && f > 25 && f < 4200) {
      T.hist.push(f); if (T.hist.length > 5) T.hist.shift();
      const med = [...T.hist].sort((a, b) => a - b)[Math.floor(T.hist.length / 2)];
      const midiF = 69 + 12 * Math.log2(med / T.a4), m = Math.round(midiF);
      T.cents = (midiF - m) * 100; T.note = m;
      $('#tNote').textContent = NAMES[pc(m)]; $('#tOct').textContent = Math.floor(m / 12) - 1;
      $('#tHz').textContent = med.toFixed(1) + ' Hz';
      $('#tCents').textContent = Math.abs(T.cents) < 3 ? 'in tune' : (T.cents > 0 ? '+' : '−') + Math.abs(T.cents).toFixed(0) + ' cents ' + (T.cents > 0 ? 'sharp' : 'flat');
      $('.tuner').classList.toggle('good', Math.abs(T.cents) < 4);
      $$('#tStrings .tstr').forEach(b => { const d = Math.abs(midiF - +b.dataset.v); b.classList.toggle('near', d < .6); });
    } else if (T.hist.length && clarity < .5) { T.hist = []; }
    T.disp += (T.cents - T.disp) * Math.min(1, dt * 10);
    const n = $('#needle'); if (n) n.style.transform = `rotate(${clamp(T.disp, -50, 50) / 50 * 70}deg)`;
    T.drawStrobe(dt);
    T.raf = requestAnimationFrame(T.loop);
  },
  drawStrobe(dt) {
    const cv = $('#strobe'); if (!cv) return;
    const w = cv.clientWidth, h = cv.clientHeight, d = Math.min(devicePixelRatio || 1, 2);
    if (cv.width !== w * d) { cv.width = w * d; cv.height = h * d; }
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    T.strobe += (T.hist.length ? T.cents : 0) * dt * 4;
    [[0, 14, 1], [1, 8, 2]].forEach(([row, size, mult]) => {
      const y = row * h / 2, off = (T.strobe * mult) % (size * 2);
      for (let x = -size * 2 + off; x < w + size * 2; x += size * 2) { g.fillStyle = row ? 'rgba(99,185,166,.55)' : 'rgba(233,196,122,.7)'; g.fillRect(x, y + 2, size, h / 2 - 4); }
    });
  },

  /* ---------- drone ---------- */
  droneToggle() {
    if (T.droneLoop) { T.droneStop(); return; }
    A.resume();
    const sa = midiOf(T.droneKey, 3), other = DRONES.find(d => d[0] === T.droneType)[2];
    const plucks = [sa - 12 + other, sa, sa, sa - 12];
    T.droneLoop = new Loop({ bpm: 58, div: 1, onStep: (step, t) => {
      const i = step % 4;
      A.play(plucks[i], { at: t, voice: 'ks_steel', dur: 4.5, vel: i === 3 ? .62 : .5, human: .6 });
      A.play(plucks[i] + 12, { at: t + .01, voice: 'ks_nylon', dur: 3, vel: .18 });
      at(t, () => $$('.tanpura i').forEach((el, k) => { if (k === i) { el.classList.remove('pl'); void el.offsetWidth; el.classList.add('pl'); } }), T);
    } });
    T.droneLoop.start();
    T.hum = [A.play(sa - 12, { voice: 'syn_pad', vel: .3, dur: null }), A.play(sa - 12 + other, { voice: 'syn_pad', vel: .18, dur: null })].filter(Boolean);
    setPlayBtn($('#dBtn'), true, 'Drone');
    KB.setTones(T.droneKey, [T.droneKey, T.droneKey + other]);
  },
  droneStop() {
    if (T.droneLoop) T.droneLoop.stop(); T.droneLoop = null; clearQueue(T);
    T.hum.forEach(h => h.release(A.ctx.currentTime)); T.hum = [];
    setPlayBtn($('#dBtn'), false, 'Drone');
  }
};

act({
  'tuner.toggle': () => T.on ? T.stop() : T.start(),
  'tuner.preset': el => { T.preset = el.dataset.v; store.set('tuner.preset', T.preset); $('#tStrings').innerHTML = T.stringsHtml(); $$('[data-act="tuner.preset"]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); },
  'tuner.ref': el => { A.resume(); const m = +el.dataset.v; A.play(m, { voice: 'ks_steel', dur: 3.5, vel: .8 }); A.sine(T.a4 * Math.pow(2, (m - 69) / 12), { dur: 2.5, gain: .06 }); el.classList.remove('pl'); void el.offsetWidth; el.classList.add('pl'); },
  'drone.toggle': () => T.droneToggle(),
  'drone.key': el => { T.droneKey = +el.dataset.v; store.set('drone.key', T.droneKey); $$('[data-act="drone.key"]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === T.droneKey))); if (T.droneLoop) { T.droneStop(); T.droneToggle(); } },
  'drone.type': el => { T.droneType = el.dataset.v; $$('[data-act="drone.type"]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); if (T.droneLoop) { T.droneStop(); T.droneToggle(); } }
});
onInput({ 'tuner.a4': el => { T.a4 = +el.value; store.set('tuner.a4', T.a4); $('#tA4').textContent = T.a4 + ' Hz'; } });

defineView('tuner', {
  mount(el) {
    el.innerHTML = vhead('Tuner & Drone', 'Get in tune. <em>Then stay there.</em>', 'A chromatic tuner that listens through your microphone, reference strings for tuning by ear, and a tanpura drone to sing and play against. Nothing you play is recorded or sent anywhere.') + T.html();
  },
  show() { KB.setKey(0, null); },
  hide() { T.stop(); T.droneStop(); },
  stop() { T.droneStop(); }
});
