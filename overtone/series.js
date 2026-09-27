/* OVERTONE — the overtone series, played on one string.
   A plucked string vibrates as a whole, in halves, thirds, quarters… all at once. Harmonic n sounds at n × the fundamental.
   Tap a harmonic to hear it alone and see its standing wave; "Stack" plays the first eight together — which is what one note
   on a real instrument actually is. Cents = distance from the nearest equal-tempered piano key. */
(() => {
  const host = document.getElementById('series'); if (!host) return;
  const F0 = 130.8128; // C3
  const H = [
    [1, 'C3', 48, 0], [2, 'C4', 60, 0], [3, 'G4', 67, 2], [4, 'C5', 72, 0], [5, 'E5', 76, -14], [6, 'G5', 79, 2], [7, 'B♭5', 82, -31], [8, 'C6', 84, 0],
    [9, 'D6', 86, 4], [10, 'E6', 88, -14], [11, 'F♯6', 90, -49], [12, 'G6', 91, 2], [13, 'A♭6', 92, 41], [14, 'B♭6', 94, -31], [15, 'B6', 95, -12], [16, 'C7', 96, 0]
  ];
  const WHY = {
    1: 'The fundamental: the whole string swings as one arc. This is the pitch you name.',
    2: 'Two halves, an octave higher: exactly double the frequency. Same note name, higher.',
    3: 'Thirds of the string give the fifth above. The octave and fifth are why power chords sound so solid.',
    4: 'Quarters: two octaves up. The series keeps returning to C at every power of two.',
    5: 'The major third, but 14 cents flatter than a piano’s E. Harmonics 4, 5 and 6 are a major triad: C, E, G.',
    6: 'Another G, an octave above harmonic 3. With 4 and 5 it completes the major chord hidden inside every note.',
    7: 'The “blue” seventh: 31 cents flatter than a piano’s B♭. Barbershop singers and blues players lean on it.',
    8: 'Three octaves up. Everything above here is packed a step or less apart; the ladder gets crowded.',
    9: 'A whole step above C: the major ninth.',
    10: 'E again, still 14 cents flat: the same third as harmonic 5, an octave higher.',
    11: 'Right between F and F♯. No piano key comes close. Alphorns and natural horns play this note.',
    12: 'G again: the fifth, now four positions up the ladder.',
    13: 'Between A♭ and A, another note equal temperament can’t play.',
    14: 'The flat seventh again, an octave above harmonic 7.',
    15: 'B, 12 cents flat: the major seventh.',
    16: 'Four octaves above the fundamental.'
  };
  const cents = c => c === 0 ? 'in tune' : (c > 0 ? '+' : '−') + Math.abs(c) + '¢';
  host.querySelector('.series-keys').innerHTML = H.map(([n, nm, , c]) => `<button type="button" data-n="${n}" aria-label="Harmonic ${n}, ${nm}, ${cents(c)}"><b>${n}</b><span>${nm}</span><i class="${Math.abs(c) >= 10 ? 'off' : ''}">${cents(c)}</i></button>`).join('');
  const canvas = host.querySelector('canvas'), g = canvas.getContext('2d'), out = document.getElementById('seriesNote'), why = document.getElementById('seriesWhy');
  let modes = [[1, 1]], t0 = performance.now(), energy = .35, playing = false, raf = 0, visible = true;

  function ctx() { try { if (typeof A !== 'undefined') { A.resume(); return A.ctx; } } catch (e) {} return null; }
  function tone(n, when = 0, dur = 1.6, gain = .22) {
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime + when, o = ac.createOscillator(), v = ac.createGain();
    o.type = 'sine'; o.frequency.value = F0 * n;
    v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(gain, t + .02); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(v); v.connect(ac.destination); o.start(t); o.stop(t + dur + .05);
  }
  function flashKey(midi) { const k = document.querySelector(`#keys [data-m="${midi}"]`); if (k) { k.classList.add('down'); setTimeout(() => k.classList.remove('down'), 380); } }
  function select(list, label) {
    modes = list; energy = 1; t0 = performance.now();
    host.querySelectorAll('.series-keys button').forEach(b => b.classList.toggle('on', list.length === 1 && +b.dataset.n === list[0][0]));
    if (label) out.innerHTML = label;
    kick();
  }
  function pick(n) {
    const [, nm, midi, c] = H[n - 1];
    select([[n, 1]], `Harmonic ${n} <em>·</em> ${nm} <em>·</em> ${(F0 * n).toFixed(1)} Hz <em>·</em> <span class="${Math.abs(c) >= 10 ? 'off' : ''}">${cents(c)}</span>`);
    why.textContent = WHY[n]; tone(n); flashKey(midi);
  }
  host.querySelector('.series-keys').addEventListener('click', e => { const b = e.target.closest('button'); if (b && !playing) pick(+b.dataset.n); });
  document.getElementById('seriesPlay').addEventListener('click', () => {
    if (playing) return; playing = true; let n = 1;
    const step = () => { pick(n); if (++n <= 16) setTimeout(step, 520); else setTimeout(() => { playing = false; }, 600); };
    step();
  });
  document.getElementById('seriesStack').addEventListener('click', () => {
    const list = H.slice(0, 8).map(([n]) => [n, 1 / n]);
    select(list, 'Harmonics 1–8 together <em>·</em> one note, heard as a single <span>C3</span>');
    why.textContent = 'Played together at falling volumes, the eight partials fuse into one pitch: you hear “a C”, not a chord. Change the balance of these partials and you change the instrument: this mix is what separates a clarinet from a violin.';
    list.forEach(([n, a]) => tone(n, 0, 2.4, .2 * a)); flashKey(48);
  });

  /* ---- drawing: a steel string between two brass bridges ---- */
  function size() { const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d); g.setTransform(d, 0, 0, d, 0, 0); }
  function draw(now) {
    const w = canvas.clientWidth, h = canvas.clientHeight, x0 = 26, x1 = w - 26, cy = h / 2, amp = h * .34;
    const t = (now - t0) / 1000; energy = Math.max(.12, energy * .994);
    g.clearRect(0, 0, w, h);
    // node guides for a single harmonic
    if (modes.length === 1) {
      const n = modes[0][0];
      g.strokeStyle = 'rgba(217,164,65,.16)'; g.lineWidth = 1; g.setLineDash([3, 5]);
      for (let k = 1; k < n; k++) { const x = x0 + (x1 - x0) * k / n; g.beginPath(); g.moveTo(x, cy - amp - 6); g.lineTo(x, cy + amp + 6); g.stroke(); }
      g.setLineDash([]);
    }
    // envelope ghost (the extremes of the motion)
    const shape = (x, ph) => modes.reduce((s, [n, a]) => s + a * Math.sin(n * Math.PI * x) * Math.cos(ph * (0.7 + .22 * n) * 2 * Math.PI), 0);
    const norm = modes.reduce((s, [, a]) => s + a, 0);
    g.strokeStyle = 'rgba(95,184,166,.18)'; g.lineWidth = 1;
    if (modes.length === 1) { const n = modes[0][0]; [1, -1].forEach(sg => { g.beginPath(); for (let i = 0; i <= 200; i++) { const x = i / 200; g.lineTo(x0 + (x1 - x0) * x, cy + sg * amp * energy * Math.sin(n * Math.PI * x)); } g.stroke(); }); }
    // the string
    const grad = g.createLinearGradient(0, cy - amp, 0, cy + amp); grad.addColorStop(0, '#f3ecdd'); grad.addColorStop(1, '#d9a441');
    g.strokeStyle = grad; g.lineWidth = 2.2; g.shadowColor = 'rgba(217,164,65,.55)'; g.shadowBlur = 10;
    g.beginPath(); for (let i = 0; i <= 320; i++) { const x = i / 320; g.lineTo(x0 + (x1 - x0) * x, cy + amp * energy * shape(x, t) / norm); } g.stroke();
    g.shadowBlur = 0;
    // bridges
    g.fillStyle = '#d9a441'; [x0, x1].forEach(x => { g.beginPath(); g.moveTo(x - 7, cy + 14); g.lineTo(x + 7, cy + 14); g.lineTo(x + 2, cy - 2); g.lineTo(x - 2, cy - 2); g.closePath(); g.fill(); });
    // nodes
    if (modes.length === 1) { const n = modes[0][0]; g.fillStyle = '#5fb8a6'; for (let k = 1; k < n; k++) { g.beginPath(); g.arc(x0 + (x1 - x0) * k / n, cy, 3, 0, Math.PI * 2); g.fill(); } }
    raf = (visible && energy > .12) || playing ? requestAnimationFrame(draw) : 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(draw); }
  new ResizeObserver(() => { size(); kick(); }).observe(canvas);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(canvas);
  size(); out.innerHTML = 'Tap a harmonic <em>·</em> or play the whole series'; why.textContent = WHY[1]; energy = .6; kick();
  // idle: a gentle fundamental so the string is never dead
  setInterval(() => { if (!playing && energy <= .13 && visible) { energy = .35; kick(); } }, 4000);
})();
