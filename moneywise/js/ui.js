/* Moneywise page shell: glossary index cards, the Parts rail, tool tabs and the W-2 style input boxes. */
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

/* ------------------------------------------------ Parts rail follows the reader */
function partsRail() {
  const links = $$('.parts-rail a[href^="#"]');
  if (!links.length) return;
  const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const seen = new Map();
  const io = new IntersectionObserver(entries => {
    for (const e of entries) seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
    let best = null, ratio = 0;
    for (const [id, r] of seen) if (r > ratio) { ratio = r; best = id; }
    if (!best) return;
    links.forEach(a => a.removeAttribute('aria-current'));
    const a = byId.get(best);
    if (a) { a.setAttribute('aria-current', 'true'); if (a.scrollIntoView && getComputedStyle(a.closest('ol')).display === 'flex') a.parentElement.parentElement.scrollTo({ left: a.offsetLeft - 20, behavior: 'smooth' }); }
  }, { rootMargin: '-120px 0px -55% 0px', threshold: [0, .1, .3, .6] });
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

/* ------------------------------------------------ tool tabs: panels initialise the first time they are shown */
const tools = new Map();
export function registerTool(id, init) { tools.set(id, { init, done: false }); }
function openTool(tab) {
  const list = tab.closest('[role="tablist"]');
  $$('[role="tab"]', list).forEach(t => {
    const on = t === tab;
    t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    if (panel) panel.hidden = !on;
  });
  const id = tab.getAttribute('aria-controls'), t = tools.get(id);
  if (t && !t.done) { t.done = true; t.init(document.getElementById(id)); }
}
export function startTools() {
  $$('[role="tablist"]').forEach(list => {
    const tabs = $$('[role="tab"]', list);
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => { openTool(tab); history.replaceState(null, '', '#' + tab.getAttribute('aria-controls')); });
      tab.addEventListener('keydown', e => {
        const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!k) return;
        e.preventDefault();
        const next = tabs[(i + k + tabs.length) % tabs.length]; next.focus(); openTool(next);
      });
    });
    const wanted = tabs.find(t => location.hash === '#' + t.getAttribute('aria-controls'));
    openTool(wanted || tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0]);
    if (wanted) setTimeout(() => list.scrollIntoView({ block: 'start' }), 50);
  });
  // a single tool without tabs
  $$('.tool[data-solo]').forEach(p => { const t = tools.get(p.id); if (t && !t.done) { t.done = true; t.init(p); } });
}

/* ------------------------------------------------ W-2 style boxes */
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
  // the lead figure goes first across the full width; an odd one out at the end also takes the full width
  const sorted = [...items.filter(i => i.hero), ...items.filter(i => !i.hero)];
  const odd = sorted.filter(i => !i.hero).length % 2 === 1;
  el.replaceChildren(...sorted.map((it, n) => {
    const d = document.createElement('div');
    d.className = 'fig' + (it.tone ? ' ' + it.tone : '') + (it.hero ? ' big' : '') + ((it.wide || (odd && n === sorted.length - 1 && !it.hero)) ? ' span' : '');
    const m = document.createElement('span'); m.className = 'micro'; m.textContent = it.label;
    const b = document.createElement('b'); b.textContent = it.value;
    d.append(m, b);
    if (it.note) { const s = document.createElement('small'); s.textContent = it.note; d.appendChild(s); }
    return d;
  }));
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

/* ------------------------------------------------ the Parts bar sticks just under the header, whatever its height */
function stickyTop() {
  const top = $('.mw-top');
  if (!top) return;
  const set = () => document.documentElement.style.setProperty('--sticky-top', (getComputedStyle(top).position === 'sticky' ? top.offsetHeight : 0) + 'px');
  set();
  new ResizeObserver(set).observe(top);
}

export function boot() {
  stickyTop();
  glossary();
  partsRail();
  startLive();
}
