/* MotorAtlas: wires the 3D machine into the page: the hero X-ray (plate 01) and the "Where it lives" locator in the parts library. */
import { SYSTEMS } from '../assets/js/machine3d.js';

const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>'"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[m]));
const hex = n => '#' + n.toString(16).padStart(6, '0');
const UI = window.MotorAtlasUI, DATA = UI?.data, B = window.MOTOR_BEGINNER;
const SHORT = { engine: 'Engine', airfuel: 'Air + fuel', cooling: 'Cooling', lubrication: 'Lubrication', transmission: 'Transmission', drivetrain: 'Drivetrain', suspension: 'Suspension', steering: 'Steering', brakes: 'Brakes', electrical: 'Electrical', hvac: 'Heat + A/C', exhaust: 'Exhaust', wheels: 'Wheels + tires', structure: 'Structure', hybridev: 'Hybrid + EV' };
const SPEC = { gas: 'GASOLINE · TURBO 4-CYL · AWD', hybrid: 'HYBRID · 4-CYL + 2 MOTOR-GENERATORS · FWD', ev: 'ELECTRIC · DUAL MOTOR · AWD' };
const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
const plainIntro = p => (B?.special?.[p.name]) || p.purpose;
const idle = fn => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 250));

/* ------------------------------------------------ hero machine */
const stage = $('#machineStage');
let hero = null;
if (stage) {
  const chips = $('#machineSystems'), card = $('#machineCard');
  const count = id => DATA?.systems.find(s => s.id === id)?.parts.length || 0;
  chips.innerHTML = `<button type="button" class="ms-chip is-on" data-sys="" aria-pressed="true"><i style="--c:#e9e6dc"></i>All systems</button>` +
    Object.entries(SYSTEMS).map(([id, s]) => `<button type="button" class="ms-chip" data-sys="${id}" aria-pressed="false" title="${esc(s.name)} · ${count(id)} parts"><i style="--c:${hex(s.color)}"></i>${esc(SHORT[id])}</button>`).join('');
  const setChip = id => $$('.ms-chip', chips).forEach(b => { const on = b.dataset.sys === (id || ''); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
  const syncInsets = () => requestAnimationFrame(() => hero?.setInsets({ left: card.hidden ? 4 : card.offsetTop + card.offsetHeight + 8, right: stage.classList.contains('is-focused') ? 4 : 46 }));
  const closeBtn = '<button type="button" class="mc-close" aria-label="Close">×</button>';
  card.addEventListener('click', e => { if (e.target.closest('.mc-close')) { card.hidden = true; syncInsets(); } });
  const showSystem = id => {
    stage.classList.toggle('is-focused', !!id);
    if (!id) { card.hidden = true; syncInsets(); return; }
    const s = DATA.systems.find(x => x.id === id);
    card.hidden = false;
    card.innerHTML = `${closeBtn}<span class="mc-code" style="--c:${hex(SYSTEMS[id].color)}">${esc(SYSTEMS[id].name)} · ${s.parts.length} parts</span><p>${esc(s.summary)}</p><small>Tap a highlighted part to see what it does.</small>`;
    syncInsets();
  };
  const showPart = ({ part, system }) => {
    const hit = UI.find(part); if (!hit) return;
    card.hidden = false;
    stage.classList.add('is-focused');
    card.innerHTML = `${closeBtn}<span class="mc-code" style="--c:${hex(SYSTEMS[system]?.color ?? 0xf0a43b)}">${esc(hit.system.name)}</span><b>${esc(hit.part.name)}</b><p>${esc(plainIntro(hit.part))}</p><button type="button" class="mc-open">Open the full part page ↓</button>`;
    $('.mc-open', card).onclick = () => UI.openPart(hit.part.name, hit.system.id);
    syncInsets();
  };
  const mount = async () => {
    if (hero || !webgl) { if (!webgl) stage.classList.add('no-webgl'); return; }
    try {
      const { mountMachine } = await import('../assets/js/machine3d.js');
      hero = await mountMachine(stage, { mode: 'gas', autoRotate: true, labels: true });
      stage.classList.add('is-ready');
      hero.on('pick', d => { hero.focusPart(d.part); setChip(d.system); showPart(d); });
    } catch (e) { console.warn('3D machine unavailable', e); stage.classList.add('no-webgl'); }
  };
  idle(mount);
  chips.addEventListener('click', e => {
    const b = e.target.closest('.ms-chip'); if (!b) return;
    const id = b.dataset.sys || null; setChip(id); showSystem(id); hero?.focus(id);
  });
  $$('[data-mode]').forEach(b => b.addEventListener('click', () => {
    $$('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('#machineSpec').textContent = SPEC[b.dataset.mode];
    hero?.setMode(b.dataset.mode);
    if (hero?.state.focus && !['hybridev', 'transmission'].includes(hero.state.focus)) hero.focus(hero.state.focus, { fly: false });
    stage.dataset.mode = b.dataset.mode;
  }));
  $$('[data-view]').forEach(b => b.addEventListener('click', () => hero?.setView(b.dataset.view)));
  const xr = $('[data-xray]');
  xr?.addEventListener('click', () => { const on = xr.getAttribute('aria-pressed') !== 'true'; xr.setAttribute('aria-pressed', String(on)); hero?.setXray(on); });
}

/* ------------------------------------------------ bigger view: the whole plate (model, controls, systems) fills the screen */
const plate = $('#machine'), expand = $('#machineExpand');
if (plate && expand && stage) {
  const label = $('span', expand);
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const setOpen = open => {
    plate.classList.toggle('is-expanded', open);
    document.documentElement.classList.toggle('m3-lock', open);
    expand.setAttribute('aria-pressed', String(open));
    label.textContent = open ? 'Close full view' : 'Expand view';
    requestAnimationFrame(() => { hero?.resize(); hero?.setInsets({ left: $('#machineCard').hidden ? 4 : $('#machineCard').offsetTop + $('#machineCard').offsetHeight + 8 }); });
  };
  const open = () => {
    setOpen(true);
    // real fullscreen where the browser allows it (desktop, Android, iPad); otherwise the plate simply covers the page
    const req = plate.requestFullscreen || plate.webkitRequestFullscreen;
    if (req) { try { const r = req.call(plate); if (r && r.catch) r.catch(() => {}); } catch (e) { /* stays as a page overlay */ } }
    expand.focus({ preventScroll: true });
  };
  const close = () => {
    if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    setOpen(false);
    expand.focus({ preventScroll: true });
  };
  expand.addEventListener('click', () => (plate.classList.contains('is-expanded') ? close() : open()));
  const onFs = () => { if (!fsEl() && plate.classList.contains('is-expanded')) setOpen(false); };
  document.addEventListener('fullscreenchange', onFs); document.addEventListener('webkitfullscreenchange', onFs);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && plate.classList.contains('is-expanded') && !fsEl()) close(); });
}

/* ------------------------------------------------ "Where it lives" locator in the parts library */
const loc = $('#locator'), frame = $('.visual-frame'), note = $('#locatorNote'), locCap = $('#locatorCaption');
let locator = null, pending = null, tab = 'where';
function follow({ system, part }) {
  pending = { system, part };
  if (!locator) return;
  const modes = locator.modesFor(part);
  const want = modes.includes(locator.state.mode) ? locator.state.mode : modes.includes('gas') ? 'gas' : modes[0];
  if (want && want !== locator.state.mode) locator.setMode(want);
  const found = locator.focusPart(part, system);
  const mode = { gas: 'gasoline car', hybrid: 'hybrid', ev: 'electric car' }[locator.state.mode];
  note.textContent = found ? '' : 'Not fitted to this model car. The highlighted system shows where it would sit.';
  note.hidden = found;
  locCap.textContent = found ? `3D locator · ${part} · shown on the ${mode}` : `3D locator · ${SYSTEMS[system]?.name || ''}`;
}
if (loc && frame) {
  const tabs = $$('[data-vt]');
  const setTab = t => {
    tab = t; tabs.forEach(b => b.setAttribute('aria-selected', String(b.dataset.vt === t)));
    frame.classList.toggle('is-where', t === 'where'); frame.classList.toggle('is-photo', t === 'photo');
    if (t === 'where') locator?.resize();
  };
  tabs.forEach(b => b.addEventListener('click', () => setTab(b.dataset.vt)));
  document.addEventListener('ma:part', e => follow(e.detail));
  if (!webgl) setTab('photo');
  else {
    const io = new IntersectionObserver(async es => {
      if (!es[0].isIntersecting || locator) return; io.disconnect();
      try {
        const { mountMachine } = await import('../assets/js/machine3d.js');
        locator = await mountMachine(loc, { mode: 'gas', autoRotate: false, labels: false });
        loc.classList.add('is-ready');
        locator.on('pick', d => UI.openPart(d.part, d.system, false));
        if (pending) follow(pending);
      } catch (e) { console.warn('3D locator unavailable', e); setTab('photo'); }
    }, { rootMargin: '300px 0px' });
    io.observe(loc);
  }
}

/* ------------------------------------------------ architecture section → drive the hero machine */
$$('#archTabs button').forEach(b => b.addEventListener('click', () => {
  const m = { gas: 'gas', hybrid: 'hybrid', ev: 'ev' }[b.dataset.arch];
  const btn = m && document.querySelector(`[data-mode="${m}"]`); if (btn && btn.getAttribute('aria-pressed') !== 'true') btn.click();
}));
