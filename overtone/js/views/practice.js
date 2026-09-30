/* OVERTONE · Practice Room
   For people who practise every day: rudiments with a real ramp,
   a click that disappears to test your internal time, polyrhythms
   drawn as two rings, and a ladder of subdivisions. */
import { $, $$, esc, store, act, onInput, defineView, clamp, toast, OT } from '../util.js';
import { A } from '../audio.js';
import { at, Loop, clearQueue, audibleNow } from '../clock.js';
import { KB } from '../keybed.js';
import { vhead, playBtn, setPlayBtn } from './shared.js';

const TOOLS = [['rudiments', 'Rudiments'], ['gap', 'Gap click'], ['poly', 'Polyrhythm'], ['ladder', 'Subdivision ladder']];
const LADDER = [[1, 'Quarters', 'one'], [2, 'Eighths', 'one-and'], [3, 'Triplets', 'tri-pl-et'], [4, 'Sixteenths', 'one-e-and-a'], [5, 'Quintuplets', 'u-ni-ver-si-ty'], [6, 'Sextuplets', 'two triplets']];

const P = {
  tool: store.get('prac.tool', 'rudiments'), rud: store.get('prac.rud', 'para'), bpm: store.get('prac.bpm', 80),
  loop: null, ramp: null, poly: 0, cycle: 2.4, playBars: 2, muteBars: 2, lad: 0, auto: false,
  mount(el) {
    el.innerHTML = vhead('Practice Room', 'Time, <em>taken seriously.</em>', 'Rudiments with sticking and a real tempo ramp, a click that vanishes to test whether your time is internal, polyrhythms you can see, and a subdivision ladder.')
      + `<div class="seg" role="tablist" style="margin-bottom:20px">${TOOLS.map(([v, n]) => `<button role="tab" data-act="prac.tool" data-v="${v}" aria-selected="${v === P.tool}">${n}</button>`).join('')}</div><div id="pracBody"></div>`;
    P.render(); A.loadKit();
  },
  render() {
    P.stop();
    $$('[data-act="prac.tool"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.v === P.tool)));
    $('#pracBody').innerHTML = ({ rudiments: P.rudHtml, gap: P.gapHtml, poly: P.polyHtml, ladder: P.ladHtml })[P.tool]();
    if (P.tool === 'poly') P.drawPoly(0);
  },
  stop() {
    if (P.loop) P.loop.stop(); P.loop = null; clearInterval(P.ramp); P.ramp = null; clearQueue(P);
    cancelAnimationFrame(P.raf); P.raf = 0;
    const b = $('#pracBtn'); if (b) setPlayBtn(b, false, P.tool === 'gap' || P.tool === 'ladder' ? 'Start' : 'Play');
    $$('#pracBody .now').forEach(e => e.classList.remove('now'));
  },
  tempoRow(max = 200) { return `<div class="slider-row"><span class="plabel">Tempo</span><input type="range" min="40" max="${max}" value="${Math.min(max, P.bpm)}" data-input="prac.bpm" aria-label="Tempo"><output id="pracBpm">${Math.min(max, P.bpm)}</output></div>`; },

  /* ---------- rudiments ---------- */
  curRud() { return OT.RUDIMENTS.find(x => x.id === P.rud) || OT.RUDIMENTS[0]; },
  rudHtml() {
    const r = P.curRud(), chars = [...r.p].filter(c => c !== ' ');
    const cats = [...new Set(OT.RUDIMENTS.map(x => x.cat))];
    return `<div class="grid2">
      <section class="panel">
        <div class="panel-h"><h3>${esc(r.n)}<small>${r.sub} notes per beat</small></h3></div>
        <div class="sticking" id="stick">${chars.map((c, i) => { const grace = c === c.toLowerCase(); return `<span class="sk ${grace ? 'grace' : ''} ${r.acc.includes(i) ? 'acc' : ''} ${c.toUpperCase() === 'R' ? 'rh' : 'lh'}" data-i="${i}"><em>${r.acc.includes(i) ? '&gt;' : ''}</em>${c.toUpperCase()}</span>`; }).join('')}</div>
        <p class="hint" style="text-align:center">&gt; accent · small letters are grace notes · R right hand, L left</p>
        ${P.tempoRow()}
        <div class="row" style="margin-top:14px">${playBtn('prac.play', false, 'Play', 'Stop', 'pracBtn')}<button class="btn btn-ghost" data-act="prac.ramp">Slow → fast → slow</button></div>
        <div class="rud-list">${cats.map(c => `<div class="scat"><span class="plabel">${esc(c === 'diddle' ? 'Diddles' : c === 'roll' ? 'Rolls' : c === 'flam' ? 'Flams' : 'Drags')}</span><div class="row">${OT.RUDIMENTS.filter(x => x.cat === c).map(x => `<button class="chip" data-act="prac.rud" data-v="${x.id}" aria-pressed="${x.id === P.rud}">${esc(x.n)}</button>`).join('')}</div></div>`).join('')}</div>
      </section>
      <aside class="panel plain">
        <p class="note-txt"><span class="kv">What it is</span>${esc(r.note)}</p>
        <p class="note-txt"><span class="kv">Practising it</span><b>${esc(r.tip)}</b></p>
        <p class="note-txt"><span class="kv">Why rudiments</span>They are the alphabet. Every fill and groove you admire is rudiments rearranged and moved around the kit. The ramp button is how drum-corps players actually drill them: slow, to the edge of control, and back.</p>
      </aside>
    </div>`;
  },
  playRud() {
    if (P.loop) { P.stop(); return; }
    A.resume(); const r = P.curRud(), chars = [...r.p].filter(c => c !== ' ');
    P.loop = new Loop({ bpm: P.bpm, div: r.sub, onStep: (step, t) => {
      const i = step % chars.length, c = chars[i], grace = c === c.toLowerCase();
      A.stick(c, t - (grace ? .035 : 0), r.acc.includes(i) ? 1 : grace ? .3 : .6);
      if (step % r.sub === 0) A.click(step % (r.sub * 4) === 0 ? 1 : 0, t);
      at(t, () => $$('#stick .sk').forEach(el => el.classList.toggle('now', +el.dataset.i === i)), P);
    } });
    P.loop.start(); setPlayBtn($('#pracBtn'), true, 'Play');
  },
  rampRun() {
    P.stop();
    const start = Math.max(40, P.bpm - 40), peak = Math.min(200, P.bpm + 40);
    let v = start, dir = 1; P.setBpm(v); P.playRud();
    P.ramp = setInterval(() => {
      v += dir * 4; if (v >= peak) dir = -1;
      if (v <= start && dir === -1) { P.stop(); toast('Ramp complete'); return; }
      P.setBpm(v);
    }, 1400);
    toast(`Ramping ${start} → ${peak} → ${start} BPM`);
  },
  setBpm(v) { P.bpm = v; store.set('prac.bpm', v); const o = $('#pracBpm'); if (o) o.textContent = v; const sl = $('#pracBody input[data-input="prac.bpm"]'); if (sl) sl.value = v; if (P.loop) P.loop.bpm = v; },

  /* ---------- gap click ---------- */
  gapHtml() {
    return `<div class="grid2">
      <section class="panel gap-panel">
        <div class="gap-lamp" id="gapLamp"><b id="gapState">Ready</b><span id="gapSub">${P.playBars} bars on · ${P.muteBars} off</span></div>
        <div class="beats gap-beats" id="gapBeats">${[0, 1, 2, 3].map(i => `<span class="bt ${i === 0 ? 'lv2' : 'lv05'}"><i></i><span>${i + 1}</span></span>`).join('')}</div>
        ${P.tempoRow()}
        <div class="row" style="margin-top:12px"><span class="plabel">Bars on</span>${[1, 2, 4].map(n => `<button class="chip" data-act="prac.gap" data-k="playBars" data-v="${n}" aria-pressed="${n === P.playBars}">${n}</button>`).join('')}
          <span class="plabel" style="margin-left:10px;min-width:0">Bars off</span>${[1, 2, 4, 8].map(n => `<button class="chip pat" data-act="prac.gap" data-k="muteBars" data-v="${n}" aria-pressed="${n === P.muteBars}">${n}</button>`).join('')}</div>
        <div class="row" style="margin-top:16px">${playBtn('prac.gapPlay', false, 'Start', 'Stop', 'pracBtn')}</div>
      </section>
      <aside class="panel plain">
        <p class="note-txt"><span class="kv">What this does</span>The click plays for a few bars, then disappears for a few, then comes back. Keep playing through the silence and be exactly in time when it returns.</p>
        <p class="note-txt"><span class="kv">Why it is the real test</span>A click on every beat teaches you to <em>follow</em> a pulse. It does not prove you can <em>make</em> one. The gap is where you find out.</p>
        <p class="note-txt trap"><span class="kv">How to use it</span><b>Start with two bars off. When the click comes back and you are still locked, double the gap. Most people discover they rush. The silence makes that impossible to hide.</b></p>
      </aside>
    </div>`;
  },
  playGap() {
    if (P.loop) { P.stop(); $('#gapState').textContent = 'Ready'; $('#gapLamp').className = 'gap-lamp'; return; }
    A.resume();
    P.loop = new Loop({ bpm: P.bpm, div: 1, onStep: (step, t) => {
      const total = (P.playBars + P.muteBars) * 4, pos = step % total, bar = Math.floor(pos / 4), beat = pos % 4, on = bar < P.playBars;
      if (on) A.click(beat === 0 ? 2 : 1, t);
      at(t, () => {
        $$('#gapBeats .bt').forEach((b, i) => b.classList.toggle('now', i === beat && on));
        $('#gapState').textContent = on ? 'Click' : 'Keep going';
        $('#gapSub').textContent = on ? `bar ${bar + 1} of ${P.playBars}` : `silent bar ${bar - P.playBars + 1} of ${P.muteBars}`;
        $('#gapLamp').className = 'gap-lamp ' + (on ? 'on' : 'off');
      }, P);
    } });
    P.loop.start(); setPlayBtn($('#pracBtn'), true, 'Start');
  },

  /* ---------- polyrhythm ---------- */
  polyHtml() {
    const p = OT.POLY[P.poly];
    return `<div class="grid2">
      <section class="panel poly-panel">
        <div class="row" style="justify-content:center">${OT.POLY.map((x, i) => `<button class="chip" data-act="prac.poly" data-v="${i}" aria-pressed="${i === P.poly}">${esc(x.n)}</button>`).join('')}</div>
        <canvas id="polyCv" width="420" height="420" aria-label="${esc(p.n)} polyrhythm drawn as two rings"></canvas>
        <div class="slider-row"><span class="plabel">Cycle</span><input type="range" min="12" max="50" value="${Math.round(P.cycle * 10)}" data-input="prac.cycle" aria-label="Cycle length"><output id="polyCyc">${P.cycle.toFixed(1)}s</output></div>
        <div class="row" style="justify-content:center;margin-top:12px">${playBtn('prac.polyPlay', false, 'Play', 'Stop', 'pracBtn')}</div>
      </section>
      <aside class="panel plain">
        <p class="note-txt"><span class="kv">What you are hearing</span>${esc(p.note)}</p>
        <p class="note-txt"><span class="kv">Reading the rings</span>The outer ring is the first number, played high; the inner ring is the second, played low. The hand sweeps once per cycle, and the only place both rings agree is the top.</p>
        <p class="note-txt trap"><span class="kv">The trap</span><b>Counting both parts at once does not work and never will. Feel one, play the other against it, and aim for the moment they meet.</b></p>
      </aside>
    </div>`;
  },
  drawPoly(frac, hitA = -1, hitB = -1) {
    const cv = $('#polyCv'); if (!cv) return;
    const g = cv.getContext('2d'), p = OT.POLY[P.poly], W = 420, c = W / 2;
    g.clearRect(0, 0, W, W);
    const ring = (n, r, col, hit) => {
      g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.strokeStyle = 'rgba(214,162,74,.18)'; g.lineWidth = 1.5; g.stroke();
      g.beginPath();
      for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i % n) / n * Math.PI * 2; g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); }
      g.strokeStyle = col.replace('X', '.22'); g.stroke();
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + i / n * Math.PI * 2, on = i === hit;
        g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, on ? 15 : 10, 0, Math.PI * 2);
        g.fillStyle = on ? col.replace('X', '1') : col.replace('X', '.35'); g.fill();
        if (on) { g.shadowColor = col.replace('X', '.9'); g.shadowBlur = 24; g.fill(); g.shadowBlur = 0; }
      }
    };
    ring(p.a, 176, 'rgba(236,196,120,X)', hitA);
    ring(p.b, 112, 'rgba(99,185,166,X)', hitB);
    const a = -Math.PI / 2 + frac * Math.PI * 2;
    g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * 196, c + Math.sin(a) * 196); g.strokeStyle = 'rgba(242,233,216,.8)'; g.lineWidth = 2; g.stroke();
    g.beginPath(); g.arc(c, c, 6, 0, 7); g.fillStyle = '#f3d08a'; g.fill();
    g.font = '400 44px "IM Fell English", Georgia, serif'; g.fillStyle = '#f2e9d8'; g.textAlign = 'center'; g.fillText(p.n, c, c + 60);
  },
  playPoly() {
    if (P.loop) { P.stop(); P.drawPoly(0); return; }
    A.resume();
    const p = OT.POLY[P.poly], L = p.a * p.b;
    let t0 = 0, lastA = -1, lastB = -1;
    P.loop = new Loop({ bpm: 60 / (P.cycle / L), div: 1, onStep: (step, t) => {
      const i = step % L; if (i === 0) at(t, () => { t0 = t; }, P);
      if (i % p.b === 0) { const k = i / p.b; A.woodblock(t, k === 0 ? .9 : .6, 1.5); at(t, () => { lastA = k; }, P); }
      if (i % p.a === 0) { const k = i / p.a; A.woodblock(t, k === 0 ? .9 : .6, .72); at(t, () => { lastB = k; }, P); }
    } });
    P.loop.start(); t0 = A.ctx.currentTime + .06;
    const draw = () => { if (!P.loop) return; const f = ((audibleNow() - t0) / P.cycle) % 1; P.drawPoly(f < 0 ? 0 : f, lastA, lastB); P.raf = requestAnimationFrame(draw); };
    P.raf = requestAnimationFrame(draw);
    setPlayBtn($('#pracBtn'), true, 'Play');
  },

  /* ---------- ladder ---------- */
  ladHtml() {
    const l = LADDER[P.lad];
    return `<div class="grid2">
      <section class="panel lad-panel">
        <div class="lad-read"><span class="plabel">Pulse stays put · subdivision changes</span><b id="ladName">${l[1]}</b><span id="ladSay">say “${l[2]}”</span></div>
        <div class="lad-steps" id="ladSteps">${LADDER.map((x, i) => `<button class="lad-rung ${i === P.lad ? 'on' : ''}" data-act="prac.lad" data-v="${i}" style="--n:${x[0]}">${Array.from({ length: x[0] }, () => '<i></i>').join('')}<span>${x[0]}</span></button>`).join('')}</div>
        ${P.tempoRow(140)}
        <div class="row" style="margin-top:14px">${playBtn('prac.ladPlay', false, 'Start', 'Stop', 'pracBtn')}<button class="btn btn-ghost" data-act="prac.ladAuto">Auto-climb</button></div>
      </section>
      <aside class="panel plain">
        <p class="note-txt"><span class="kv">What this trains</span>The beat never changes; only how many notes you fit inside it. Switching cleanly between subdivisions without the tempo drifting is one of the hardest and most useful skills a drummer can own.</p>
        <p class="note-txt"><span class="kv">The hard ones</span>Fives and sixes are where most people fall apart. Use words: five is “u-ni-ver-si-ty”, six is two triplets. Say them out loud while you play.</p>
        <p class="note-txt trap"><span class="kv">Auto-climb</span><b>Four bars of each, stepping up automatically. The moment of the change is the whole exercise: that is where time gets lost.</b></p>
      </aside>
    </div>`;
  },
  playLad(auto) {
    if (P.loop && !auto) { P.stop(); return; }
    P.stop(); A.resume(); P.auto = !!auto;
    let sub = LADDER[P.lad][0];
    P.loop = new Loop({ bpm: P.bpm, div: 60, onStep: (step, t) => {
      /* sixty steps per beat hold every subdivision from 1 to 6 exactly */
      const within = step % 60, beatNo = Math.floor(step / 60);
      if (within === 0 && P.auto && beatNo > 0 && beatNo % 16 === 0) { P.lad = (P.lad + 1) % LADDER.length; sub = LADDER[P.lad][0]; at(t, () => P.showLad(), P); }
      const every = 60 / sub;
      if (within % every === 0) {
        const k = within / every;
        A.click(within === 0 ? (beatNo % 4 === 0 ? 2 : 1) : 0, t);
        at(t, () => { const r = $$('#ladSteps .lad-rung')[P.lad]; if (r) r.querySelectorAll('i').forEach((d, j) => d.classList.toggle('now', j === k)); }, P);
      }
    } });
    P.loop.start(); setPlayBtn($('#pracBtn'), true, 'Start');
  },
  showLad() {
    const l = LADDER[P.lad];
    $('#ladName').textContent = l[1]; $('#ladSay').textContent = 'say “' + l[2] + '”';
    $$('#ladSteps .lad-rung').forEach((r, i) => r.classList.toggle('on', i === P.lad));
  }
};

act({
  'prac.tool': el => { P.tool = el.dataset.v; store.set('prac.tool', P.tool); P.render(); },
  'prac.rud': el => { const was = !!P.loop; P.rud = el.dataset.v; store.set('prac.rud', P.rud); P.render(); if (was) P.playRud(); },
  'prac.play': () => P.playRud(),
  'prac.ramp': () => P.rampRun(),
  'prac.gap': el => { P[el.dataset.k] = +el.dataset.v; const was = !!P.loop; P.render(); if (was) P.playGap(); },
  'prac.gapPlay': () => P.playGap(),
  'prac.poly': el => { const was = !!P.loop; P.poly = +el.dataset.v; P.render(); if (was) P.playPoly(); },
  'prac.polyPlay': () => P.playPoly(),
  'prac.lad': el => { P.lad = +el.dataset.v; P.showLad(); if (P.loop) P.playLad(P.auto); },
  'prac.ladPlay': () => P.playLad(false),
  'prac.ladAuto': () => { P.lad = 0; P.showLad(); P.playLad(true); toast('Climbing through every subdivision, four bars each'); }
});
onInput({
  'prac.bpm': el => P.setBpm(+el.value),
  'prac.cycle': el => { P.cycle = +el.value / 10; $('#polyCyc').textContent = P.cycle.toFixed(1) + 's'; if (P.loop) { P.stop(); P.playPoly(); } }
});

defineView('practice', { mount: el => P.mount(el), hide: () => P.stop(), stop: () => P.stop(), show() { KB.setKey(0, null); } });
