/* TradeSchool 3D plates.
   app.js renders a placeholder <div class="rig-plate" data-rig="…"> and calls TradeRig.hydrate()
   after every route. This file builds the plate chrome (header, part card, controls, chips) and
   drives the one shared 3D stage (js/3d/engine.js) for that page:
     home     cycles through the six trade models
     world    the whole trade model, one chip per course unit
     unit     sticky model that follows the reader: the part for the topic on screen lights up
     concept  "where it lives" locator for a single topic
   Labels sit on the model next to the part (spatial contiguity); the focused unit dims everything
   else (signalling). No WebGL → a rendered still of the same model. */
(() => {
  'use strict';
  const D = window.TRADE_DATA, R = window.TRADE_RIG, B = window.TRADE_BEGINNER || {};
  if (!D || !R) return;
  const BASE = new URL('../3d/', document.currentScript.src);
  const RENDERS = new URL('../../assets/renders/', document.currentScript.src);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const byId = id => D.concepts.find(c => c.id === id);
  const worldOf = c => c?.world || 'electrical';
  const cats = w => (D.worldCategories && D.worldCategories[w]) || D.categories;
  const catOf = (w, id) => cats(w).find(c => c.id === id);
  const friendly = c => (B.friendly && B.friendly[norm(c.title)]) || c.oneLine || '';
  const ORDER = ['electrical', 'hvac', 'plumbing', 'industrial', 'welding', 'construction'];
  const coarse = matchMedia('(pointer: coarse)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();

  let stageP = null;
  const getStage = () => stageP || (stageP = import(new URL('engine.js?v=1', BASE).href).then(m => m.getStage()));
  const still = (w, unit) => new URL(unit ? `${w}--${unit}.webp` : `${w}.webp`, RENDERS).href;
  const onModel = (id, w) => { const p = R.parts[id]; return !!p && (!w || p[0] === w); };
  const plateNo = w => String(ORDER.indexOf(w) + 1).padStart(2, '0');

  let active = null;
  function teardown() { if (!active) return; active.unsub.forEach(f => { try { f(); } catch (e) { } }); active.io?.disconnect(); clearInterval(active.timer); clearTimeout(active.t2); document.documentElement.classList.remove('rig-lock'); active = null; }

  /* ------------------------------------------------ chrome */
  function chrome(el, o) {
    const m = R.models[o.model];
    el.innerHTML = `
      <div class="rp-head"><span class="rp-code">${esc(o.code)}</span><span class="rp-spec">${esc(o.spec ?? m.plate)}</span></div>
      <div class="rp-stage">
        <div class="rp-host" role="img" aria-label="${esc(o.aria || `Interactive 3D model: ${m.name}. Drag to turn it, tap a part to learn what it is.`)}"></div>
        <img class="rp-still" src="${still(o.model, o.stillUnit)}" alt="" loading="lazy" hidden>
        <p class="rp-hint">${coarse ? 'Tap any part' : 'Drag to turn · tap any part'}</p>
        <div class="rp-card" hidden aria-live="polite"></div>
        <div class="rp-tools">
          ${m.modes && !o.plain ? `<div class="rp-seg" role="group" aria-label="Operating mode">${Object.entries(m.modes).map(([k, v]) => `<button type="button" data-mode="${k}" aria-pressed="false">${esc(v)}</button>`).join('')}</div>` : ''}
          ${m.layers && !o.plain ? `<div class="rp-build"><button type="button" class="rp-play" aria-label="Play the build sequence">▶</button><label><span>Build stage</span><input type="range" min="0" max="${m.layers.length - 1}" step="1" value="${m.layers.length - 1}" aria-label="Build stage"></label><b class="rp-layer">${esc(m.layers[m.layers.length - 1])}</b></div>` : ''}
          <div class="rp-btns">
            ${coarse ? '<button type="button" data-orbit="-0.7" aria-label="Turn left">⟲</button><button type="button" data-orbit="0.7" aria-label="Turn right">⟳</button>' : ''}
            <button type="button" data-zoom="0.8" aria-label="Zoom in">+</button><button type="button" data-zoom="1.25" aria-label="Zoom out">−</button>
            <button type="button" data-reset aria-label="Reset view">Reset</button>
            <button type="button" data-expand aria-pressed="false" aria-label="Expand the model">⤢</button>
          </div>
        </div>
      </div>
      ${o.foot || ''}`;
    return { host: $('.rp-host', el), card: $('.rp-card', el), still: $('.rp-still', el), head: $('.rp-head', el) };
  }
  function sysChip(w, sys, extra = '') { const s = R.models[w].systems[sys]; return `<span class="rp-sys" style="--c:${s?.color || '#999'}">${esc(s?.name || '')}${extra}</span>`; }
  function partCard(w, d, o = {}) {
    const ids = (d.concepts || []).filter(k => byId(k));
    const c = byId(d.concept) || byId(ids[0]);
    if (!c) return `<button type="button" class="rp-x" aria-label="Close">×</button>${sysChip(w, d.sys)}<b>${esc(d.label)}</b>`;
    const also = ids.filter(k => k !== c.id).slice(0, 4).map(byId);
    return `<button type="button" class="rp-x" aria-label="Close">×</button>${sysChip(w, d.sys)}<b>${esc(d.label || c.title)}</b>
      ${d.label && norm(d.label) !== norm(c.title) ? `<small class="rp-topic">${esc(c.title)}</small>` : ''}
      <p>${esc(friendly(c))}</p>
      ${also.length ? `<div class="rp-also"><span>Also here</span>${also.map(a => `<a href="#/concept/${a.id}">${esc(a.title)}</a>`).join('')}</div>` : ''}
      ${o.noOpen ? '' : `<a class="rp-open" href="#/concept/${c.id}">Open the topic <span>→</span></a>`}`;
  }
  function showCard(ui, html) { ui.card.innerHTML = html; ui.card.hidden = !html; }

  /* shared behaviour for every plate */
  function wire(el, ui, stage, w, o = {}) {
    const unsub = active.unsub;
    const m = R.models[w];
    // mode + build stage
    const syncState = st => {
      $$('[data-mode]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === st.mode)));
      const r = $('.rp-build input', el); if (r && st.layer != null && m.layers) { r.value = Math.min(st.layer, m.layers.length - 1); $('.rp-layer', el).textContent = m.layers[+r.value]; }
    };
    syncState(stage.state);
    unsub.push(stage.on('state', syncState));
    $$('[data-mode]', el).forEach(b => b.addEventListener('click', () => { stage.setMode(b.dataset.mode); syncState(stage.state); }));
    const range = $('.rp-build input', el);
    if (range) {
      range.addEventListener('input', () => { stage.setLayer(+range.value); syncState(stage.state); });
      const play = $('.rp-play', el); let t = 0;
      play.addEventListener('click', () => {
        clearInterval(t); let i = 0; stage.setLayer(0); syncState(stage.state);
        t = setInterval(() => { i++; if (i >= m.layers.length) { clearInterval(t); return; } stage.setLayer(i); syncState(stage.state); }, reduced ? 400 : 1300);
      });
      unsub.push(() => clearInterval(t));
    }
    $$('[data-zoom]', el).forEach(b => b.addEventListener('click', () => stage.zoom(+b.dataset.zoom)));
    $$('[data-orbit]', el).forEach(b => b.addEventListener('click', () => stage.orbitBy(+b.dataset.orbit)));
    $('[data-reset]', el)?.addEventListener('click', () => { showCard(ui, ''); o.reset ? o.reset() : stage.overview(); });
    ui.card.addEventListener('click', e => { if (e.target.closest('.rp-x')) { showCard(ui, ''); o.closeCard?.(); } });
    // expanded view: the whole plate covers the page; wheel zoom and touch orbit switch on
    const ex = $('[data-expand]', el);
    const setOpen = open => {
      el.classList.toggle('is-expanded', open); document.documentElement.classList.toggle('rig-lock', open);
      ex.setAttribute('aria-pressed', String(open)); ex.textContent = open ? '✕' : '⤢'; ex.setAttribute('aria-label', open ? 'Close the expanded model' : 'Expand the model');
      stage.setZoom(open); stage.enableOrbit(open || !coarse);
      requestAnimationFrame(() => stage.resize());
    };
    ex.addEventListener('click', () => setOpen(!el.classList.contains('is-expanded')));
    const onKey = e => { if (e.key === 'Escape' && el.classList.contains('is-expanded')) setOpen(false); };
    document.addEventListener('keydown', onKey); unsub.push(() => document.removeEventListener('keydown', onKey));
    unsub.push(() => { if (el.classList.contains('is-expanded')) setOpen(false); });
    const hint = $('.rp-hint', el);
    unsub.push(stage.on('interact', () => hint?.classList.add('is-gone')));
  }

  /* hover or focus on a list item previews that part on the model */
  function peekers(stage, w, restore) {
    let t = 0;
    const onEnter = e => {
      const b = e.target.closest('[data-rig-peek],[data-rig-unit]'); if (!b) return;
      clearTimeout(t);
      t = setTimeout(() => { if (b.dataset.rigPeek && onModel(b.dataset.rigPeek, w)) stage.focusConcept(b.dataset.rigPeek); else if (b.dataset.rigUnit) stage.focus(b.dataset.rigUnit); }, 120);
    };
    const onLeave = e => { const b = e.target.closest('[data-rig-peek],[data-rig-unit]'); if (!b) return; clearTimeout(t); t = setTimeout(restore, 500); };
    const app = document.getElementById('app');
    app.addEventListener('mouseover', onEnter); app.addEventListener('mouseout', onLeave); app.addEventListener('focusin', onEnter); app.addEventListener('focusout', onLeave);
    active.unsub.push(() => { clearTimeout(t); app.removeEventListener('mouseover', onEnter); app.removeEventListener('mouseout', onLeave); app.removeEventListener('focusin', onEnter); app.removeEventListener('focusout', onLeave); });
  }

  /* ------------------------------------------------ plate kinds */
  async function world(el) {
    const w = el.dataset.model, m = R.models[w];
    const counts = {}; Object.values(R.parts).forEach(([mw, , s]) => { if (mw === w) counts[s] = (counts[s] || 0) + 1; });
    const units = cats(w);
    const foot = `<div class="rp-chips" role="group" aria-label="Show one unit on the model"><button type="button" class="rp-chip is-on" data-sys="" aria-pressed="true"><i style="--c:#E9E5DC"></i>Whole system</button>${units.map((u, i) => `<button type="button" class="rp-chip" data-sys="${u.id}" aria-pressed="false"><i style="--c:${m.systems[u.id]?.color || '#999'}"></i><span>${String(i + 1).padStart(2, '0')}</span>${esc(u.name)}</button>`).join('')}</div>`;
    const ui = chrome(el, { model: w, code: `REFERENCE PLATE ${plateNo(w)} · ${m.name}`, foot });
    const setChip = id => $$('.rp-chip', el).forEach(b => { const on = b.dataset.sys === (id || ''); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
    const unitCard = id => { const u = catOf(w, id); const n = D.concepts.filter(c => worldOf(c) === w && c.category === id).length; return `<button type="button" class="rp-x" aria-label="Close">×</button>${sysChip(w, id)}<b>${esc(u?.name || '')}</b><p>${esc(u?.description || '')}</p><a class="rp-open" href="#/world/${w}/unit/${id}">Open the unit · ${n} topics <span>→</span></a>`; };
    const stage = await mount(el, ui, { model: w, autoRotate: true });
    if (!stage) return;
    wire(el, ui, stage, w, { reset: () => { setChip(''); stage.overview(); } });
    $$('.rp-chip', el).forEach(b => b.addEventListener('click', () => { const id = b.dataset.sys || null; setChip(id); stage.focus(id); showCard(ui, id ? unitCard(id) : ''); }));
    active.unsub.push(stage.on('pick', d => { stage.focusConcept(d.concept || d.comp); setChip(d.sys); showCard(ui, partCard(w, d)); }));
    peekers(stage, w, () => { const on = $('.rp-chip.is-on', el)?.dataset.sys; if (on) stage.focus(on); else stage.overview(); });
  }

  async function unit(el) {
    const w = el.dataset.model, u = el.dataset.unit, m = R.models[w];
    const topics = $$('[data-topic]');
    const ids = topics.map(t => t.dataset.topic);
    const foot = `<div class="rp-dots" role="group" aria-label="Topics in this unit">${ids.map((id, i) => { const c = byId(id); return `<button type="button" data-goto="${id}" class="${onModel(id, w) ? '' : 'is-off'}" title="${esc(c?.title)}"><span>${String(i + 1).padStart(2, '0')}</span></button>`; }).join('')}</div>`;
    const ui = chrome(el, { model: w, code: `UNIT ON THE MODEL · ${catOf(w, u)?.name || ''}`, spec: m.name, foot, stillUnit: u });
    const now = document.createElement('div'); now.className = 'rp-now'; now.innerHTML = '<small>Scroll the lesson · the model follows</small>'; ui.head.after(now);
    const stage = await mount(el, ui, { model: w, focus: u, autoRotate: false, reframe: true });
    if (!stage) return;
    let current = null, t = 0;
    const setDots = id => $$('.rp-dots button', el).forEach(b => b.classList.toggle('is-on', b.dataset.goto === id));
    const setCurrent = (id, fly = true) => {
      if (id === current) return; current = id;
      const c = byId(id), i = ids.indexOf(id);
      setDots(id); topics.forEach(tp => tp.classList.toggle('is-current', tp.dataset.topic === id));
      now.innerHTML = c ? `<small>NOW SHOWING · ${String(i + 1).padStart(2, '0')}</small><b>${esc(c.title)}</b>` : '';
      if (!fly) return;
      if (c && onModel(id, w)) { stage.focusConcept(id); showCard(ui, ''); }
      else { stage.focus(u); showCard(ui, c ? `<button type="button" class="rp-x" aria-label="Close">×</button>${sysChip(w, u)}<b>${esc(c.title)}</b><p>This one is a rule you apply across the whole system, not a single part, so the model shows the unit instead.</p>` : ''); }
    };
    wire(el, ui, stage, w, { reset: () => { current = null; stage.focus(u); showCard(ui, ''); } });
    // follow the reader: the topic crossing the reading line drives the model
    const io = new IntersectionObserver(es => {
      const vis = es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!vis) return; clearTimeout(t); t = setTimeout(() => setCurrent(vis.target.dataset.topic), 140);
    }, { rootMargin: '-38% 0px -52% 0px' });
    topics.forEach(tp => io.observe(tp)); active.io = io;
    active.unsub.push(() => clearTimeout(t));
    $$('.rp-dots button', el).forEach(b => b.addEventListener('click', () => document.getElementById('topic-' + b.dataset.goto)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })));
    const onShow = e => {
      const b = e.target.closest('[data-rig-show]'); if (!b) return;
      current = null; setCurrent(b.dataset.rigShow);
      if (el.getBoundingClientRect().bottom < 80 || el.getBoundingClientRect().top > innerHeight - 80) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    };
    document.getElementById('app').addEventListener('click', onShow); active.unsub.push(() => document.getElementById('app').removeEventListener('click', onShow));
    active.unsub.push(stage.on('pick', d => {
      const id = (d.concepts || []).find(k => ids.includes(k));
      if (id) { document.getElementById('topic-' + id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); current = null; setCurrent(id); }
      else { stage.focusConcept(d.concept || d.comp, { keepFocus: true }); showCard(ui, partCard(w, d)); }
    }));
    // collapse the model on small screens to get reading room back
    const tog = document.createElement('button'); tog.type = 'button'; tog.className = 'rp-collapse'; tog.textContent = 'Hide model'; tog.setAttribute('aria-expanded', 'true');
    tog.addEventListener('click', () => { const c = el.classList.toggle('is-collapsed'); tog.textContent = c ? 'Show model' : 'Hide model'; tog.setAttribute('aria-expanded', String(!c)); requestAnimationFrame(() => stage.resize()); });
    ui.head.append(tog);
  }

  async function concept(el) {
    const w = el.dataset.model, id = el.dataset.part, c = byId(id), m = R.models[w];
    const part = R.parts[id];
    const ui = chrome(el, { model: w, code: part ? `WHERE IT LIVES · ${part[1] || c?.title}` : `APPLIES ACROSS THE SYSTEM · ${m.name}`, spec: m.name, foot: `<div class="rp-chips rp-chips-sm">${part ? `<button type="button" class="rp-chip is-on" data-part-view aria-pressed="true"><i style="--c:${m.systems[part[2]]?.color}"></i>This part</button><button type="button" class="rp-chip" data-sys="${part[2]}" aria-pressed="false"><i style="--c:${m.systems[part[2]]?.color}"></i>Its system</button>` : ''}<button type="button" class="rp-chip" data-sys="" aria-pressed="false"><i style="--c:#E9E5DC"></i>Whole ${esc(D.worlds.find(x => x.id === w)?.name || '')} model</button></div>` });
    const stage = await mount(el, ui, { model: w, part: part ? id : undefined, autoRotate: !part });
    if (!stage) return;
    const setChip = b => $$('.rp-chip', el).forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    const home = () => { if (part) stage.focusConcept(id); else stage.overview(); };
    wire(el, ui, stage, w, { reset: () => { setChip($('[data-part-view]', el)); home(); } });
    $$('.rp-chip', el).forEach(b => b.addEventListener('click', () => { setChip(b); showCard(ui, ''); if (b.hasAttribute('data-part-view')) home(); else if (b.dataset.sys) stage.focus(b.dataset.sys); else stage.overview(); }));
    active.unsub.push(stage.on('pick', d => {
      if ((d.concepts || []).includes(id)) { showCard(ui, ''); home(); return; }
      stage.focusConcept(d.concept || d.comp, { keepFocus: true }); showCard(ui, partCard(w, d));
    }));
    peekers(stage, w, home);
  }

  async function home(el) {
    let w = el.dataset.model || 'electrical';
    const tabs = `<div class="rp-tabs" role="tablist" aria-label="Choose a trade">${ORDER.map(k => `<button type="button" role="tab" data-w="${k}" aria-selected="${k === w}"><i></i>${esc(D.worlds.find(x => x.id === k)?.name || k)}</button>`).join('')}</div>`;
    const ui = chrome(el, { model: w, code: `REFERENCE PLATE ${plateNo(w)} · ${R.models[w].name}`, foot: tabs, plain: true });
    const open = document.createElement('a'); open.className = 'rp-course'; ui.head.append(open);
    const label = () => { $('.rp-code', el).textContent = `REFERENCE PLATE ${plateNo(w)} · ${R.models[w].name}`; $('.rp-spec', el).textContent = R.models[w].plate; open.href = `#/world/${w}`; open.innerHTML = `Open ${esc(D.worlds.find(x => x.id === w)?.name)} <span>→</span>`; };
    label();
    const stage = await mount(el, ui, { model: w, autoRotate: true });
    if (!stage) return;
    let user = false;
    const pick = async k => {
      w = k; label(); $$('.rp-tabs button', el).forEach(b => b.setAttribute('aria-selected', String(b.dataset.w === k))); showCard(ui, '');
      el.dataset.model = k; ui.still.src = still(k);
      await stage.attach(ui.host, { model: k, autoRotate: true, sparse: innerWidth < 700 });
    };
    $$('.rp-tabs button', el).forEach(b => b.addEventListener('click', () => { user = true; clearInterval(active.timer); pick(b.dataset.w); }));
    active.timer = reduced ? 0 : setInterval(() => { if (user || document.hidden || el.matches(':hover')) return; pick(ORDER[(ORDER.indexOf(w) + 1) % ORDER.length]); }, 9000);
    active.unsub.push(stage.on('interact', () => { user = true; clearInterval(active.timer); }));
    active.unsub.push(stage.on('pick', d => { user = true; clearInterval(active.timer); stage.focusConcept(d.concept || d.comp); showCard(ui, partCard(w, d)); }));
    wire(el, ui, stage, w, { reset: () => stage.overview() });
  }

  /* ------------------------------------------------ mount (with still-image fallback) */
  async function mount(el, ui, o) {
    if (!webgl) { ui.still.hidden = false; el.classList.add('no-webgl'); return null; }
    el.classList.add('is-loading');
    let stage;
    try { stage = await getStage(); } catch (e) { console.warn('3D unavailable', e); ui.still.hidden = false; el.classList.add('no-webgl'); return null; }
    if (!el.isConnected || active?.el !== el) return null;
    try { await stage.attach(ui.host, { labels: true, sparse: innerWidth < 700, ...o }); } catch (e) { console.warn('3D model failed', e); ui.still.hidden = false; el.classList.add('no-webgl'); return null; }
    if (!el.isConnected || active?.el !== el) return null;
    el.classList.remove('is-loading'); el.classList.add('is-ready');
    active.stage = stage;
    return stage;
  }

  /* ------------------------------------------------ entry point, called after every route */
  const KINDS = { world, unit, concept, home };
  function hydrate() {
    const el = $('.rig-plate:not([data-bound])');
    if (!el) { if (active && !active.el.isConnected) { const st = active.stage; teardown(); st?.detach(); } return; }
    const prevStage = active?.stage; teardown(); if (prevStage && !el.isConnected) prevStage.detach();
    el.dataset.bound = '1';
    active = { el, unsub: [], io: null, timer: 0, stage: null };
    (KINDS[el.dataset.rig] || world)(el);
  }
  // warm the engine while the browser is idle so the first plate appears quickly
  const warm = () => getStage().catch(() => { });
  if (webgl) { if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 2500 }); else setTimeout(warm, 1500); }
  window.TradeRig = { hydrate, onModel, part: id => R.parts[id] || null, model: w => R.models[w], still };
  hydrate(); // the first route rendered before this file loaded
})();
