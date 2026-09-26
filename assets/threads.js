/* Safi Solutions — the hero threads.
   Forty strands in the logo's two colours (brushed silver and Safi blue) drift in from the edges, knot together, then
   leave as four clean bundles — one per door. On load the order spreads out from the knot; the pointer pushes strands
   aside and they settle back; hovering a door lights its lane and sends signal pulses down it. */
(() => {
  const hero = document.querySelector('.hero');
  const canvas = hero && hero.querySelector('.threads');
  if (!canvas || !canvas.getContext) return;
  const g = canvas.getContext('2d');
  const copy = hero.querySelector('.hero-copy'), doorsBox = hero.querySelector('.doors');
  const doors = [...hero.querySelectorAll('.door')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LANES = doors.length, PER = 10, N = LANES * PER, S = 170, JOIN = .5, SIG = .055;
  const TAU = Math.PI * 2;

  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const strands = Array.from({ length: N }, (_, i) => ({
    lane: Math.floor(i / PER), k: i % PER, a: rnd(), b: rnd(), top: rnd() < .5,
    ph: Array.from({ length: 4 }, () => rnd() * TAU),
    f: [1.3 + rnd() * 1.5, 2 + rnd() * 1.8, 2.8 + rnd() * 2],
    v: [.3 + rnd() * .35, .22 + rnd() * .3, .4 + rnd() * .35],
    amp: .75 + rnd() * .45, silver: i % 2 === 0
  }));

  let W = 0, H = 0, dpr = 1, K = { x: 0, y: 0 }, anchors = [], stacked = false, knotAmp = 30, gapL = 0, gapR = 0;
  let front = reduced ? 1.2 : -.05, start = performance.now() + 300, last = performance.now(), raf = 0, visible = true;
  const lit = new Array(LANES).fill(0), litTarget = new Array(LANES).fill(0);
  const ptr = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
  const pulses = []; let nextPulse = 0;

  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const bez = (p0, p1, p2, p3, t) => { const m = 1 - t; return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3; };

  function layout() {
    const r = hero.getBoundingClientRect(), nb = doorsBox.getBoundingClientRect(), cb = copy.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    stacked = nb.top - r.top > cb.bottom - r.top - 4; // doors sit under the copy (narrow screens)
    anchors = doors.map(d => { const b = d.getBoundingClientRect(); return { x: b.left - r.left - .5, y: b.top - r.top + b.height / 2 }; });
    if (stacked) {
      K = { x: Math.max(14, nb.left - r.left - 18), y: nb.top - r.top - 46 }; knotAmp = 16; gapL = 0; gapR = K.x + 40;
    } else {
      gapL = cb.right - r.left; gapR = nb.left - r.left;
      const gap = Math.max(80, gapR - gapL);
      K = { x: gapL + gap * .36, y: (anchors[0].y + anchors[LANES - 1].y) / 2 };
      knotAmp = Math.max(20, Math.min(46, gap * .2));
    }
    draw(performance.now());
  }

  const pts = new Float32Array(S * 2);
  function strand(s, t) {
    const a = anchors[s.lane];
    let Sx, Sy, c1x, c1y, c2x, c2y;
    if (stacked) { Sx = -30; Sy = K.y + (s.a - .5) * 120; c1x = Sx + (K.x - Sx) * .5; c1y = Sy; c2x = K.x - 20; c2y = K.y; }
    else {
      const gap = gapR - gapL;
      Sx = gapL - gap * .45 + s.a * gap * 1.25; Sy = s.top ? -30 : H + 30;
      c1x = Sx + (s.b - .5) * gap * .5; c1y = Sy + (K.y - Sy) * .6; c2x = K.x - gap * .32; c2y = K.y + (s.b - .5) * 60;
    }
    const Ay = a.y + (s.k - (PER - 1) / 2) * (stacked ? 1.2 : 1.6), Ax = a.x;
    const knot = knotAmp * s.amp;
    for (let j = 0; j < S; j++) {
      const u = j / (S - 1);
      let x, y;
      if (u <= JOIN) { const q = u / JOIN; x = bez(Sx, c1x, c2x, K.x, q); y = bez(Sy, c1y, c2y, K.y, q); }
      else {
        const q = (u - JOIN) / (1 - JOIN);
        if (stacked) { x = bez(K.x, K.x, K.x + (Ax - K.x) * .3, Ax, q); y = bez(K.y, Ay - 18, Ay, Ay, q); }
        else { const mx = K.x + (Ax - K.x) * .5; x = bez(K.x, mx, mx, Ax, q); y = bez(K.y, K.y, Ay, Ay, q); }
      }
      // a tight knot at the join, loose drift on the way in, disorder only ahead of the ordering front
      const w = (u - JOIN) / SIG;
      let E = knot * Math.exp(-w * w * .5) * (1 + .6 * (1 - Math.min(1, front)));
      E += knot * .9 * (1 - smooth(.12, JOIN - .04, u)) * smooth(0, .12, u);
      if (u > JOIN) { const v = (u - JOIN) / (1 - JOIN); E += knot * 1.6 * smooth(front - .16, front, v) * (1 - smooth(.88, 1, v) * .5); }
      if (E > .01) {
        x += E * (Math.sin(s.f[0] * w + s.ph[0] + s.v[0] * t) * .9 + Math.sin(s.f[1] * w * .55 + s.ph[1] + s.v[1] * t) * .4);
        y += E * (Math.cos(s.f[0] * w * .8 + s.ph[2] + s.v[0] * t * 1.1) * .85 + Math.sin(s.f[2] * w * .45 + s.ph[3] + s.v[2] * t) * .4);
      }
      const dx = x - ptr.x, dy = y - ptr.y, d2 = dx * dx + dy * dy, R = stacked ? 0 : 100;
      if (d2 < R * R && d2 > .01) { const d = Math.sqrt(d2), p = 1 - d / R; x += dx / d * p * p * 40; y += dy / d * p * p * 40; }
      pts[j * 2] = x; pts[j * 2 + 1] = y;
    }
    return pts;
  }
  function path(p) {
    g.beginPath(); g.moveTo(p[0], p[1]);
    for (let j = 1; j < S - 1; j++) { const mx = (p[j * 2] + p[j * 2 + 2]) / 2, my = (p[j * 2 + 1] + p[j * 2 + 3]) / 2; g.quadraticCurveTo(p[j * 2], p[j * 2 + 1], mx, my); }
    g.lineTo(p[S * 2 - 2], p[S * 2 - 1]);
  }

  function draw(now) {
    if (!W) return;
    const t = reduced ? 0 : (now - start) / 1000;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const anyLit = Math.max(...lit);
    const col = (r, gg, b, a) => {
      if (stacked) return `rgba(${r},${gg},${b},${a})`;
      const gr = g.createLinearGradient(0, 0, 0, H); // strands fade in from the top and bottom edges
      gr.addColorStop(0, `rgba(${r},${gg},${b},0)`); gr.addColorStop(.3, `rgba(${r},${gg},${b},${a})`); gr.addColorStop(.7, `rgba(${r},${gg},${b},${a})`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      return gr;
    };
    const cSilver = col(208, 214, 222, .34 * (1 - .6 * anyLit)), cBlue = col(79, 143, 214, .52 * (1 - .6 * anyLit));
    g.lineCap = 'round';
    for (const pass of [0, 1]) {
      for (const s of strands) {
        const L = lit[s.lane]; if ((pass === 1) !== (L > .02)) continue;
        path(strand(s, t));
        if (pass === 0) { g.strokeStyle = s.silver ? cSilver : cBlue; g.lineWidth = 1; g.shadowBlur = 0; }
        else { g.strokeStyle = `rgba(184,216,250,${.25 + .7 * L})`; g.lineWidth = 1 + .5 * L; g.shadowColor = 'rgba(184,216,250,.6)'; g.shadowBlur = 8 * L; }
        g.stroke();
      }
    }
    g.shadowBlur = 0;
    for (let i = pulses.length - 1; i >= 0; i--) {
      const pu = pulses[i], q = (now - pu.t0) / pu.dur;
      if (q >= 1) { pulses.splice(i, 1); continue; }
      const p = strand(strands[pu.s], t), u = JOIN + (1 - JOIN) * (q * q * (3 - 2 * q)), j = Math.min(S - 1, Math.round(u * (S - 1)));
      const x = p[j * 2], y = p[j * 2 + 1], a = Math.sin(q * Math.PI);
      const gr = g.createRadialGradient(x, y, 0, x, y, 9); gr.addColorStop(0, `rgba(235,244,255,${.95 * a})`); gr.addColorStop(1, 'rgba(184,216,250,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill();
    }
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (now > start && front < 1.2) front = Math.min(1.2, front + dt * .6);
    ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 10); ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 10);
    for (let i = 0; i < LANES; i++) lit[i] += (litTarget[i] - lit[i]) * Math.min(1, dt * 7);
    if (now > nextPulse && front > .95) {
      const hot = litTarget.indexOf(1), lane = hot >= 0 ? hot : Math.floor(Math.random() * LANES);
      pulses.push({ s: lane * PER + Math.floor(Math.random() * PER), t0: now, dur: 1300 + Math.random() * 600 });
      nextPulse = now + (hot >= 0 ? 380 : 1400 + Math.random() * 1400);
    }
    draw(now);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && !reduced) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  hero.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect(); ptr.tx = e.clientX - r.left; ptr.ty = e.clientY - r.top;
    if (ptr.x < -1e3) { ptr.x = ptr.tx; ptr.y = ptr.ty; }
    hero.classList.add('touched'); kick();
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { ptr.tx = -1e4; ptr.ty = -1e4; });
  doors.forEach((d, i) => {
    const on = () => { litTarget.fill(0); litTarget[i] = 1; d.classList.add('lit'); nextPulse = 0; if (reduced) { lit.fill(0); lit[i] = 1; draw(0); } else kick(); };
    const off = () => { litTarget[i] = 0; d.classList.remove('lit'); if (reduced) { lit[i] = 0; draw(0); } else kick(); };
    d.addEventListener('pointerenter', on); d.addEventListener('pointerleave', off);
    d.addEventListener('focus', on); d.addEventListener('blur', off);
  });
  new ResizeObserver(() => layout()).observe(hero);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); kick(); });
  layout(); kick();
})();
