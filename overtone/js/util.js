/* OVERTONE · small shared helpers */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand = arr => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const OT = window.OT;

export const store = {
  get(k, d) { try { const v = localStorage.getItem('ot.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ot.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
};

const mq = matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => mq.matches;

let toastTimer;
export function toast(msg, ms = 2600) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---- one delegated click handler for the whole app ----
   Markup says what it wants: <button data-act="bench.root" data-v="3">.
   Views register the handlers they own. */
const actions = {};
export function act(map) { Object.assign(actions, map); }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) { fn(el, e); }
});
/* inputs (sliders, text) report through data-input */
const inputs = {};
export function onInput(map) { Object.assign(inputs, map); }
document.addEventListener('input', e => {
  const el = e.target.closest('[data-input]');
  if (el && inputs[el.dataset.input]) inputs[el.dataset.input](el, e);
});

/* ---- view lifecycle registry ---- */
export const views = {};
export function defineView(id, v) { views[id] = v; }

/* render a string of markup into an element, keeping focus where it can */
export function render(el, html) {
  if (!el) return;
  const active = document.activeElement;
  const key = active && el.contains(active) ? active.dataset.focus : null;
  el.innerHTML = html;
  if (key) { const again = el.querySelector(`[data-focus="${key}"]`); if (again) again.focus({ preventScroll: true }); }
}

/* a plain SVG icon from a path string */
export const icon = (d, size = 18, sw = 1.7) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

export const ICON = {
  play: 'M7 4.5v15l12-7.5z',
  stop: 'M6 6h12v12H6z',
  loop: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
  replay: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  down: 'M12 5v14M5 12l7 7 7-7',
  up: 'M12 19V5M5 12l7-7 7 7',
  dice: 'M4 4h16v16H4zM8.5 8.5h.01M15.5 15.5h.01M15.5 8.5h.01M8.5 15.5h.01M12 12h.01',
  share: 'M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13',
  save: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3',
  x: 'M18 6 6 18M6 6l12 12',
  tap: 'M9 11V5a2 2 0 1 1 4 0v6M13 10a2 2 0 1 1 4 0v3M17 12a2 2 0 1 1 4 0v3a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3l-3-5a2 2 0 0 1 3-2l2 2'
};

/* debounce for resize and similar */
export function debounce(fn, ms = 120) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

/* spring-ish number tween for readouts */
export function tweenNumber(el, to, ms = 380) {
  if (!el) return;
  const from = parseFloat(el.textContent) || 0;
  if (reducedMotion() || from === to) { el.textContent = to; return; }
  const t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
