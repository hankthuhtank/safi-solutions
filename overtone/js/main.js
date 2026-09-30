/* OVERTONE · boot, router and the shell around every view */
import { $, $$, esc, store, act, views, reducedMotion, toast, icon, clamp } from './util.js';
import { A, VOICES } from './audio.js';
import { KB } from './keybed.js';
import { initStrings } from './strings.js';
import { go, closeModal } from './shell.js';
import './views/home.js';
import './views/bench.js';
import './views/chordbook.js';
import './views/ear.js';
import './views/rhythm.js';
import './views/practice.js';
import './views/tuner.js';
import './views/sketch.js';
import './views/world.js';
import './views/library.js';
import './views/path.js';

export const SECTIONS = [
  ['home', 'Home', 'Start here', 'M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z'],
  ['bench', 'The Bench', 'Scales · chords · keys', 'M4 20V10M10 20V4M16 20v-8M22 20v-4'],
  ['chords', 'Chord Book', 'Where the fingers go', 'M6 3v18M10 3v18M14 3v18M18 3v18M6 8h12M6 13h12'],
  ['ear', 'Ear Training', 'Seven drills', 'M6 9a6 6 0 1 1 12 0c0 3-2 4-3 6s-1 4-4 4a3 3 0 0 1-3-3M9 9a3 3 0 0 1 6 0'],
  ['rhythm', 'Rhythm Room', 'Metronome · drum machine', 'M9 3h6l3 18H6zM12 17l4-10'],
  ['practice', 'Practice Room', 'Rudiments · polyrhythm', 'M4 14a8 3 0 0 0 16 0V9a8 3 0 0 0-16 0zM4 9a8 3 0 0 0 16 0M8 3l3 6M17 2l-3 7'],
  ['tuner', 'Tuner & Drone', 'Tune up · hold a note', 'M4 16a8 8 0 1 1 16 0M12 16l4-6M12 16h.01'],
  ['sketch', 'Sketchpad', 'Write a progression', 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4'],
  ['world', 'Around the World', 'Twelve traditions', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20'],
  ['library', 'The Library', 'Every term, plainly', 'M4 4h5v16H4zM10 4h4v16h-4zM15 5l4-1 3 15-4 1z'],
  ['path', 'The Path', 'Ten stages, in order', 'M5 21V4M5 4h11l-2 4 2 4H5']
];
const ALIAS = { lab: 'bench', enc: 'library', perc: 'practice', encyclopedia: 'library' };
let current = null;

function buildNeck() {
  $('#neck').innerHTML = SECTIONS.map(([id, n, sub, d], i) =>
    `${i === 8 ? '<div class="fret-gap" aria-hidden="true"></div>' : ''}<a class="fret" href="#${id}" data-v="${id}">
      <span class="inlay">${icon(d, 16, 1.6)}</span><span><b>${esc(n)}</b><small>${esc(sub)}</small></span></a>`).join('');
}

function resolve() {
  const raw = (location.hash || '#home').slice(1).split('/')[0];
  const id = ALIAS[raw] || raw;
  return views[id] ? id : 'home';
}
function show(id) {
  const prev = current;
  if (prev && prev !== id && views[prev].hide) views[prev].hide();
  $$('.view').forEach(s => s.classList.toggle('on', s.id === 'v-' + id));
  $$('#neck .fret').forEach(a => { if (a.dataset.v === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const v = views[id], el = $('#v-' + id);
  if (!v.mounted) { v.mount(el); v.mounted = true; }
  if (v.show) v.show(el);
  current = id;
  const sec = SECTIONS.find(s => s[0] === id);
  $('#crumb').innerHTML = `<b>${String(SECTIONS.indexOf(sec) + 1).padStart(2, '0')}</b>${esc(sec[1])}`;
  document.title = (id === 'home' ? 'Overtone · a playable music workshop' : sec[1] + ' · Overtone');
  store.set('lastView', id);
}
function route() {
  const id = resolve(), sub = location.hash.split('/')[1];
  closeNav();
  if (id === current) { if (sub && views[id].sub) views[id].sub(decodeURIComponent(sub)); return; }
  const swap = () => {
    show(id); scrollTo({ top: 0, behavior: 'instant' });
    if (sub && views[id].sub) views[id].sub(decodeURIComponent(sub));
  };
  if (document.startViewTransition && !reducedMotion() && current) {
    document.documentElement.classList.add('vt');
    const t = document.startViewTransition(swap);
    t.finished.finally(() => document.documentElement.classList.remove('vt'));
  } else swap();
}
function openNav() { document.body.classList.add('nav'); $('#menuBtn').setAttribute('aria-expanded', 'true'); $('#neck a[aria-current]')?.focus(); }
function closeNav() { if (!document.body.classList.contains('nav')) return; document.body.classList.remove('nav'); $('#menuBtn').setAttribute('aria-expanded', 'false'); }
addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('nav')) { closeNav(); $('#menuBtn').focus(); } });

/* ---------------- voice plate ---------------- */
function buildVoices() {
  const sel = $('#voiceSel');
  const groups = [...new Set(VOICES.map(v => v.g))];
  sel.innerHTML = groups.map(g => `<optgroup label="${esc(g)}">${VOICES.filter(v => v.g === g).map(v => `<option value="${v.id}">${esc(v.n)}</option>`).join('')}</optgroup>`).join('');
  sel.value = A.voiceId;
  sel.addEventListener('change', () => { A.resume(); A.setVoice(sel.value).then(() => A.play(60, { dur: 1, vel: .6 })); });
  A.on('voice', v => { sel.value = v.id; });
  const bar = $('#voiceLoad');
  A.on('load', ({ id, done, total }) => {
    if (id !== A.voiceId) return;
    bar.style.setProperty('--p', Math.round(done / total * 100) + '%');
    bar.classList.toggle('on', done < total);
  });
}

/* ---------------- rotary knobs ---------------- */
function knob(el, value, onChange) {
  const wrap = document.createElement('span'); wrap.className = 'knob-wrap';
  el.replaceWith(wrap); wrap.appendChild(el);
  const cap = document.createElement('span'); cap.className = 'knob-cap'; wrap.appendChild(cap);
  const lbl = document.createElement('span'); lbl.className = 'knob-lbl'; lbl.textContent = el.dataset.label; wrap.appendChild(lbl);
  let v = value;
  const set = (nv, fire = true) => {
    v = clamp(nv, 0, 1);
    el.style.setProperty('--k', (v * 75) + '%');
    cap.style.setProperty('--a', (-135 + v * 270) + 'deg');
    el.setAttribute('aria-valuenow', Math.round(v * 100));
    if (fire) onChange(v);
  };
  set(v, false);
  let startY = 0, startV = 0;
  el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); startY = e.clientY; startV = v; e.preventDefault(); });
  el.addEventListener('pointermove', e => { if (el.hasPointerCapture(e.pointerId)) set(startV + (startY - e.clientY) / 160); });
  el.addEventListener('wheel', e => { e.preventDefault(); set(v - Math.sign(e.deltaY) * .05); }, { passive: false });
  el.addEventListener('keydown', e => {
    const d = { ArrowUp: .05, ArrowRight: .05, ArrowDown: -.05, ArrowLeft: -.05, PageUp: .2, PageDown: -.2 }[e.key];
    if (d) { e.preventDefault(); set(v + d); }
    if (e.key === 'Home') set(0); if (e.key === 'End') set(1);
  });
  el.addEventListener('dblclick', () => set(value));
}

act({
  'nav.open': openNav, 'nav.close': closeNav,
  'modal.close': closeModal,
  'audio.mute': el => { A.setMuted(!A.muted); el.setAttribute('aria-pressed', String(A.muted)); toast(A.muted ? 'Muted' : 'Sound on'); },
  'audio.panic': () => { A.stopAll(); A.setSustain(false); KB.latched.clear(); KB.hold = false; KB.paint(); KB.sync(); Object.values(views).forEach(v => v.stop && v.stop()); },
  go: el => go(el.dataset.v)
});

function boot() {
  buildNeck(); buildVoices();
  knob($('#roomKnob'), A.room, v => A.setRoom(v));
  knob($('#volKnob'), A.vol, v => A.setVolume(v));
  initStrings();
  KB.render(); KB.bind();
  if (store.get('kb.hidden', false)) $('#hideBtn').click();
  addEventListener('hashchange', route);
  if (!location.hash) { const last = store.get('lastView', null); if (last && last !== 'home' && views[last]) history.replaceState(null, '', '#' + last); }
  route();
  /* audio can only start from a gesture; warm everything up on the first one */
  const wake = () => {
    A.resume(); A.load(A.voiceId); A.loadKit();
    removeEventListener('pointerdown', wake, true); removeEventListener('keydown', wake, true);
  };
  addEventListener('pointerdown', wake, true); addEventListener('keydown', wake, true);
  const loader = $('#loader');
  const leave = () => { loader.classList.add('gone'); setTimeout(() => loader.remove(), 600); };
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1400))]).then(() => setTimeout(leave, 250));
}
boot();
