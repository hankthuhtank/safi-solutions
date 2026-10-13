/* Moneywise page shell: glossary index cards, flashcards, calculators (opened on demand, tape folded until asked for)
   and the input boxes. */
import { startLive, getRates } from './live.js';
import { latest } from './ratesview.js';
import { makeChart } from './charts.js';

export const $ = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ------------------------------------------------ glossary terms -> index card popover */
function glossary() {
  const data = $('#mw-terms');
  if (!data) return;
  const terms = JSON.parse(data.textContent);
  const pop = document.createElement('div');
  pop.className = 'card-pop'; pop.id = 'mw-card'; pop.setAttribute('role', 'tooltip');
  document.body.appendChild(pop);
  let current = null, hoverTimer = 0, hideTimer = 0, pressed = null;

  const fill = (key) => {
    const t = terms[key];
    pop.replaceChildren();
    const h4 = document.createElement('h4'); h4.textContent = t.term;
    if (t.abbr) { const sm = document.createElement('small'); sm.textContent = t.abbr; h4.appendChild(sm); }
    const p = document.createElement('p'); p.textContent = t.short;
    pop.append(h4, p);
    if (t.seen) { const s = document.createElement('p'); s.className = 'seen'; const b = document.createElement('b'); b.textContent = 'Seen on'; s.append(b, document.createTextNode(t.seen)); pop.appendChild(s); }
    const a = document.createElement('a'); a.href = `/moneywise/glossary/#${key}`; a.textContent = 'Full entry in the glossary →';
    pop.appendChild(a);
  };
  const place = (el) => {
    const r = el.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    let left = r.left + window.scrollX + r.width / 2 - pw / 2;
    left = Math.max(window.scrollX + 12, Math.min(left, window.scrollX + document.documentElement.clientWidth - pw - 12));
    let top = r.top + window.scrollY - ph - 10;
    if (r.top - ph - 10 < 120) top = r.bottom + window.scrollY + 10;
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
  };
  const show = (el) => {
    clearTimeout(hideTimer);
    const key = el.dataset.term;
    if (!terms[key]) return;
    if (current && current !== el) current.setAttribute('aria-expanded', 'false');
    current = el; fill(key); el.setAttribute('aria-expanded', 'true'); el.setAttribute('aria-describedby', 'mw-card');
    pop.classList.add('on'); place(el);
  };
  const hide = () => {
    pop.classList.remove('on');
    if (current) { current.setAttribute('aria-expanded', 'false'); current.removeAttribute('aria-describedby'); }
    current = null;
  };
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  $$('a.term').forEach(el => {
    el.setAttribute('aria-expanded', 'false');
    if (fine) {
      el.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => show(el), 120); });
      el.addEventListener('mouseleave', () => { clearTimeout(hoverTimer); hideTimer = setTimeout(hide, 180); });
    }
    // a press focuses the link before its click lands; let the click decide, or a tap would open and close at once
    el.addEventListener('pointerdown', () => { pressed = el; });
    el.addEventListener('focus', () => { if (pressed !== el) show(el); });
    el.addEventListener('blur', () => { hideTimer = setTimeout(() => { if (!pop.contains(document.activeElement)) hide(); }, 120); });
    el.addEventListener('click', e => {
      pressed = null;
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      // touch: a second tap closes the card; mouse: hovering already opened it, so a click keeps it open
      if (!fine && current === el && pop.classList.contains('on')) hide(); else show(el);
    });
  });
  pop.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  pop.addEventListener('mouseleave', () => { hideTimer = setTimeout(hide, 180); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && current) { const el = current; hide(); el.focus(); } });
  document.addEventListener('pointerdown', e => { if (current && !pop.contains(e.target) && e.target !== current) hide(); });
  addEventListener('resize', () => current && place(current));
}

/* ------------------------------------------------ calculators: the main one starts at once; the others open from chips */
const tools = new Map();
export function registerTool(id, init) { tools.set(id, { init, done: false }); }
const initTool = panel => { const t = tools.get(panel.id); if (t && !t.done) { t.done = true; t.init(panel); } };
function openChip(chip, { scroll = false } = {}) {
  const group = chip.closest('.t-sec') || document;
  const open = chip.getAttribute('aria-expanded') !== 'true';
  $$('.chip', group).forEach(c => {
    const on = open && c === chip;
    c.setAttribute('aria-expanded', on);
    const panel = document.getElementById(c.getAttribute('aria-controls'));
    if (panel) panel.hidden = !on;
  });
  const panel = document.getElementById(chip.getAttribute('aria-controls'));
  if (open && panel) { initTool(panel); if (scroll) panel.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
}
export function startTools() {
  $$('.tool[data-solo]').forEach(initTool);
  $$('.chip[aria-controls]').forEach(chip => chip.addEventListener('click', () => {
    openChip(chip);
    history.replaceState(null, '', chip.getAttribute('aria-expanded') === 'true' ? '#' + chip.getAttribute('aria-controls') : location.pathname);
  }));
  const wanted = location.hash && $(`.chip[aria-controls="${CSS.escape(location.hash.slice(1))}"]`);
  if (wanted) openChip(wanted, { scroll: true });
  // "Show the math": the calculator tape stays folded until someone asks for it, then prints line by line
  $$('.math-btn').forEach(btn => btn.addEventListener('click', () => {
    const slot = document.getElementById(btn.getAttribute('aria-controls')), tool = btn.closest('.tool');
    const on = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', on);
    $('span', btn).textContent = on ? 'Hide the math' : 'Show the math';
    slot.hidden = !on; tool.classList.toggle('math-on', on);
    if (on && !matchMedia('(prefers-reduced-motion: reduce)').matches) $$('.t-line', slot).forEach((li, k) => { li.style.animation = 'none'; void li.offsetWidth; li.style.animation = `print .3s ${k * 28}ms ease-out both`; });
  }));
}

/* ------------------------------------------------ input boxes */
const parse = (raw, type) => {
  const v = Number(String(raw).replace(/[$,%\s]/g, ''));
  if (!Number.isFinite(v)) return null;
  return type === 'pct' ? v / 100 : v;
};
const show = (v, type, dp) => {
  if (type === 'money') return Math.round(v).toLocaleString('en-US');
  if (type === 'pct') return dp != null && dp !== '' ? (v * 100).toFixed(Number(dp)) : String(Math.round(v * 100 * 1000) / 1000);
  return String(v);
};
/* Every input with data-k inside root becomes values[k]. data-t: money | pct | num | sel | check.
   A range input with data-for="k" moves with its box. Segmented buttons: .seg[data-k] > button[data-v]. */
export function bindBoxes(root, onChange) {
  const fields = $$('[data-k]', root);
  const dirty = new Set();
  let raf = 0;
  const values = () => {
    const o = {};
    for (const f of fields) {
      const k = f.dataset.k, t = f.dataset.t;
      if (f.classList.contains('seg')) { const on = $('[aria-pressed="true"]', f); o[k] = on ? on.dataset.v : null; continue; }
      if (t === 'check') o[k] = f.checked;
      else if (t === 'sel') o[k] = f.value;
      else { const v = parse(f.value, t); o[k] = v == null ? Number(f.dataset.default || 0) : v; }
    }
    return o;
  };
  const fire = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => onChange(values())); };
  for (const f of fields) {
    if (f.classList.contains('seg')) {
      $$('button', f).forEach(b => b.addEventListener('click', () => { $$('button', f).forEach(x => x.setAttribute('aria-pressed', x === b)); fire(); }));
      continue;
    }
    const range = $(`input[type="range"][data-for="${f.dataset.k}"]`, root);
    f.addEventListener('input', () => {
      dirty.add(f.dataset.k);
      if (range) { const v = parse(f.value, f.dataset.t); if (v != null) range.value = f.dataset.t === 'pct' ? v * 100 : v; }
      fire();
    });
    f.addEventListener('change', fire);
    if (f.dataset.t === 'money') f.addEventListener('blur', () => { const v = parse(f.value, 'money'); if (v != null) f.value = show(v, 'money'); });
    if (range) range.addEventListener('input', () => {
      dirty.add(f.dataset.k);
      const v = Number(range.value);
      f.value = f.dataset.t === 'money' ? show(v, 'money') : f.dataset.t === 'pct' ? show(v / 100, 'pct', f.dataset.dp) : String(v);
      fire();
    });
  }
  // live defaults: a box with data-live follows today's number until you type in it
  document.addEventListener('mw:rates', e => {
    let changed = false;
    for (const f of fields) {
      if (!f.dataset.live || dirty.has(f.dataset.k)) continue;
      const v = latest(e.detail, f.dataset.live);
      if (v == null) continue;
      f.value = show(v / 100, 'pct', f.dataset.dp);
      const range = $(`input[type="range"][data-for="${f.dataset.k}"]`, root);
      if (range) range.value = v;
      changed = true;
    }
    if (changed) fire();
  });
  return {
    values,
    set(k, v) {
      const f = fields.find(x => x.dataset.k === k); if (!f) return;
      if (f.dataset.t === 'check') f.checked = !!v; else f.value = show(v, f.dataset.t, f.dataset.dp);
      const range = $(`input[type="range"][data-for="${k}"]`, root);
      if (range) range.value = f.dataset.t === 'pct' ? v * 100 : v;
      fire();
    },
    fire,
  };
}

/* ------------------------------------------------ charts inside a calculator: in the results column, or full width
   under the calculator when wide is set. Each key keeps its chart and updates it in place. */
const drawn = new Map();
export function draw(panel, key, spec, { wide = false } = {}) {
  let host = wide ? $('.tool-wide', panel) : $('[data-charts]', panel);
  if (!host) { host = document.createElement('div'); host.className = 'tool-wide'; $('.tool-grid', panel).after(host); }
  let slot = $(`[data-c="${key}"]`, host);
  if (!slot) { slot = document.createElement('div'); slot.dataset.c = key; host.appendChild(slot); }
  const ch = drawn.get(slot);
  if (ch) ch.update(spec); else drawn.set(slot, makeChart(slot, spec));
  return slot;
}

/* ------------------------------------------------ small helpers for page scripts */
export function figs(el, items) {
  // the lead number across the full width, then two more; anything beyond that waits under "More numbers"
  const sorted = [...items.filter(i => i.hero), ...items.filter(i => !i.hero)];
  const hasHero = sorted[0] && sorted[0].hero;
  const shown = sorted.slice(0, hasHero ? 3 : 2), extra = sorted.slice(shown.length);
  const fig = (it, n, list) => {
    const d = document.createElement('div');
    const odd = list.filter(i => !i.hero).length % 2 === 1 && n === list.length - 1 && !it.hero;
    d.className = 'fig' + (it.tone ? ' ' + it.tone : '') + (it.hero ? ' big' : '') + ((it.wide || odd) ? ' span' : '');
    const m = document.createElement('span'); m.className = 'micro'; m.textContent = it.label;
    const b = document.createElement('b'); b.textContent = it.value;
    d.append(m, b);
    if (it.note) { const s = document.createElement('small'); s.textContent = it.note; d.appendChild(s); }
    return d;
  };
  const nodes = shown.map((it, n) => fig(it, n, shown));
  if (extra.length) {
    const was = el.querySelector('.fig-more');
    const det = document.createElement('details'); det.className = 'fig-more'; det.open = !!(was && was.open);
    const sum = document.createElement('summary'); sum.textContent = `${extra.length} more number${extra.length > 1 ? 's' : ''}`;
    const box = document.createElement('div'); box.className = 'figs-extra';
    box.append(...extra.map((it, n) => fig({ ...it, hero: false }, n, extra)));
    det.append(sum, box); nodes.push(det);
  }
  el.replaceChildren(...nodes);
}
// verdict lines accept a tiny bit of markup: **bold** only
export function verdict(el, text, tone = '') {
  el.className = 'verdict' + (tone ? ' ' + tone : '');
  el.replaceChildren(...String(text).split(/(\*\*[^*]+\*\*)/).map(part => {
    if (part.startsWith('**')) { const b = document.createElement('b'); b.textContent = part.slice(2, -2); return b; }
    return document.createTextNode(part);
  }));
}

export { getRates };

/* ------------------------------------------------ flashcards: tap to turn over */
function flashcards() {
  $$('.fc').forEach(card => card.addEventListener('click', () => {
    const on = card.getAttribute('aria-pressed') !== 'true';
    card.setAttribute('aria-pressed', on);
    $('.fc-front', card).setAttribute('aria-hidden', on);
    $('.fc-back', card).setAttribute('aria-hidden', !on);
  }));
}

export function boot() {
  glossary();
  flashcards();
  startLive();
}
