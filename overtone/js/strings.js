/* OVERTONE · the string field
   Fourteen wires stretched across the page behind everything. Each
   note played anywhere plucks the wire nearest its pitch, and the
   standing wave gains nodes as the pitch rises, as on a real string. */
import { A } from './audio.js';
import { at } from './clock.js';
import { clamp, reducedMotion } from './util.js';

const S = { cv: null, g: null, w: 0, h: 0, wires: [], raf: 0, t: 0, last: 0 };
const N = 14;

function size() {
  const d = Math.min(devicePixelRatio || 1, 2);
  S.w = innerWidth; S.h = innerHeight;
  S.cv.width = S.w * d; S.cv.height = S.h * d;
  S.g.setTransform(d, 0, 0, d, 0, 0);
  kick();
}
function pluck(midi, vel) {
  const i = clamp(Math.round((midi - 28) / 4.8), 0, N - 1), s = S.wires[i];
  s.amp = Math.min(1.1, s.amp + vel * .8);
  s.n = clamp(1 + Math.floor((midi - 26) / 9), 1, 8);
  kick();
}
function frame(now) {
  S.raf = 0;
  const g = S.g, dt = Math.min(.05, (now - (S.last || now)) / 1000); S.last = now;
  S.t += dt;
  g.clearRect(0, 0, S.w, S.h);
  const gap = S.h / (N + 1), steps = Math.ceil(S.w / 10);
  let alive = false;
  for (let i = 0; i < N; i++) {
    const s = S.wires[i], y0 = gap * (i + 1), a = s.amp * S.h * .03;
    const wound = i < 5;
    g.beginPath();
    for (let j = 0; j <= steps; j++) {
      const x = (j / steps) * S.w, u = x / S.w;
      const y = y0 + a * Math.sin(s.n * Math.PI * u) * Math.sin(Math.PI * u) * Math.cos(S.t * (22 + s.n * 3) + s.ph);
      j ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.lineWidth = wound ? 1.4 : 1;
    g.strokeStyle = wound ? `rgba(196,150,86,${.07 + s.amp * .5})` : `rgba(226,214,196,${.05 + s.amp * .45})`;
    g.stroke();
    if (s.amp > .03) {
      g.lineWidth = 5; g.strokeStyle = `rgba(214,162,74,${s.amp * .12})`; g.stroke();
      alive = true;
    }
    s.amp *= reducedMotion() ? .86 : Math.pow(.2, dt);
    if (s.amp < .003) s.amp = 0;
  }
  if (alive) kick();
}
function kick() { if (!S.raf && S.g) S.raf = requestAnimationFrame(frame); }

export function initStrings() {
  S.cv = document.getElementById('strings'); if (!S.cv) return;
  S.g = S.cv.getContext('2d'); if (!S.g) return;
  for (let i = 0; i < N; i++) S.wires.push({ amp: 0, ph: Math.random() * 6.28, n: 1 });
  size(); addEventListener('resize', size, { passive: true });
  A.on('note', ({ midi, vel, at: t }) => at(t, () => pluck(midi, vel)));
}
