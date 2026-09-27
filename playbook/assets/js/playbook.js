/* Playbook: page runtime: 3D hero, period bar progress, TOC, jargon popovers, glossary, ⌘K search, visuals. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sport = document.body.dataset.sport;
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };

/* ---------------- 3D hero (lazy) */
async function hero3d() {
  const stage = $('[data-field3d]'); if (!stage) return;
  const tools = $('.hero-tools');
  const go = async () => {
    try {
      const { mountField, SPORT_VIEWS } = await import('./field3d.js');
      const f = await mountField(stage, stage.dataset.field3d, { autoRotate: stage.dataset.rotate !== 'false' });
      if (tools) {
        const names = { broadcast: 'Broadcast', allTwentyTwo: 'All-22', sky: 'Skycam', endzone: 'End zone', baseline: 'Baseline', behindGoal: 'Behind goal', endline: 'End line', centerfield: 'CF cam', behindHome: 'Behind home', tee: 'Tee box', flyover: 'Flyover', green: 'Green' };
        const views = SPORT_VIEWS[stage.dataset.field3d];
        tools.innerHTML = '';
        views.forEach((v, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = names[v] || v; b.setAttribute('aria-pressed', i === 0 && !stage.dataset.view ? 'true' : String(stage.dataset.view === v)); b.onclick = () => { f.setView(v); $$('button', tools).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }; tools.append(b); });
        const lab = document.createElement('button'); lab.type = 'button'; lab.textContent = 'Labels'; lab.setAttribute('aria-pressed', 'false');
        lab.onclick = () => { const on = lab.getAttribute('aria-pressed') !== 'true'; lab.setAttribute('aria-pressed', String(on)); f.labels(on); };
        tools.append(lab);
      }
    } catch (e) { console.warn('3D unavailable, poster shown', e); stage.classList.add('no-webgl'); tools?.remove(); }
  };
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1200 }); else setTimeout(go, 300);
}

/* ---------------- sections, period bar, TOC */
function progress() {
  const secs = $$('.sec[data-period]'); if (!secs.length) return;
  const periods = $$('.period');
  const toc = new Map($$('.toc a').map(a => [a.getAttribute('href').slice(1), a]));
  const readKey = `playbook:${sport}:read`;
  const read = new Set(store.get(readKey, []));
  const mark = () => {
    for (const [id, a] of toc) a.classList.toggle('is-read', read.has(id));
    periods.forEach(p => {
      const mine = secs.filter(s => s.dataset.period === p.dataset.period);
      const done = mine.filter(s => read.has(s.id)).length;
      p.querySelector('.p-fill i').style.width = (mine.length ? done / mine.length * 100 : 0) + '%';
      p.classList.toggle('is-done', mine.length && done === mine.length);
    });
    const clock = $('.clock b'); if (clock) clock.textContent = `${read.size}/${secs.length}`;
  };
  mark();
  let current = null;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) {
      current = e.target;
      for (const [id, a] of toc) a.setAttribute('aria-current', String(id === current.id));
      periods.forEach(p => p.classList.toggle('is-now', p.dataset.period === current.dataset.period));
    }
  }, { rootMargin: '-35% 0px -60% 0px' });
  secs.forEach(s => io.observe(s));
  // a section counts as "read" once its end has scrolled past the middle of the screen
  const readIO = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { const s = e.target.closest('.sec'); if (s && !read.has(s.id)) { read.add(s.id); store.set(readKey, [...read]); mark(); } }
  }, { rootMargin: '0px 0px -40% 0px' });
  secs.forEach(s => { const end = document.createElement('i'); end.className = 'sec-end'; end.setAttribute('aria-hidden', 'true'); s.append(end); readIO.observe(end); });
}

/* ---------------- jargon popovers */
function jargon() {
  const data = $('#glossary-data'); if (!data) return;
  let defs; try { defs = JSON.parse(data.textContent); } catch (e) { return; }
  const entries = Object.entries(defs).filter(([k, v]) => k.length > 2 && v).sort((a, b) => b[0].length - a[0].length);
  if (!entries.length) return;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp('\\b(' + entries.map(([k]) => esc(k)).join('|') + ')\\b', 'i');
  const map = new Map(entries.map(([k, v]) => [k.toLowerCase(), [k, v]]));
  const seen = new Set();
  const roots = $$('.sec:not([data-no-jargon]) .sec-intro, .sec:not([data-no-jargon]) .term p, .sec:not([data-no-jargon]) .bullets li, .sec:not([data-no-jargon]) .steps li, .sec:not([data-no-jargon]) td, .scene-info p');
  roots.forEach(root => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.parentElement.closest('.term-help,a,strong,b,h3')) return;
      const m = node.nodeValue.match(rx); if (!m) return;
      const key = m[1].toLowerCase(), hostCard = root.closest('.term');
      if (hostCard && hostCard.querySelector('h3')?.textContent.trim().toLowerCase() === key) return;
      const id = key + '|' + (root.closest('.sec')?.id || '');
      if (seen.has(id)) return; seen.add(id); // first mention per section only — keeps paragraphs readable
      const before = node.nodeValue.slice(0, m.index), after = node.nodeValue.slice(m.index + m[1].length);
      const span = document.createElement('span'); span.className = 'term-help'; span.tabIndex = 0; span.textContent = m[1]; span.dataset.k = key;
      node.replaceWith(before, span, after);
    });
  });
  const pop = document.createElement('div'); pop.className = 'term-pop'; pop.setAttribute('role', 'tooltip'); document.body.append(pop);
  const show = t => {
    const [name, def] = map.get(t.dataset.k) || []; if (!def) return;
    pop.innerHTML = `<b>${name}</b>${def}`; pop.classList.add('on');
    const r = t.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x = Math.min(Math.max(10, r.left + r.width / 2 - pw / 2), innerWidth - pw - 10), y = r.top - ph - 10;
    if (y < 70) y = r.bottom + 10;
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
  };
  const hide = () => pop.classList.remove('on');
  document.addEventListener('mouseover', e => { const t = e.target.closest?.('.term-help'); t ? show(t) : hide(); });
  document.addEventListener('focusin', e => { const t = e.target.closest?.('.term-help'); t ? show(t) : hide(); });
  document.addEventListener('click', e => { const t = e.target.closest?.('.term-help'); if (t) { e.preventDefault(); show(t); } else hide(); });
  addEventListener('scroll', hide, { passive: true });
}

/* ---------------- glossary filter */
function glossary() {
  const input = $('.gloss-search'); if (!input) return;
  const items = $$('.gloss > div'), count = $('.gloss-count'), empty = $('.gloss-empty');
  const run = () => {
    const q = input.value.trim().toLowerCase(); let n = 0;
    items.forEach(it => { const ok = !q || it.textContent.toLowerCase().includes(q); it.hidden = !ok; if (ok) n++; });
    count.textContent = `${n} TERM${n === 1 ? '' : 'S'}`; empty.classList.toggle('on', !n);
  };
  input.addEventListener('input', run); run();
}

/* ---------------- ⌘K palette */
function palette() {
  const pal = $('.palette'); if (!pal) return;
  const input = $('input', pal), list = $('.palette-list', pal);
  const index = [
    ...$$('.sec[id]').map(s => ({ t: s.querySelector('h2')?.textContent || '', d: s.querySelector('.sec-intro')?.textContent || '', k: 'Section', id: s.id })),
    ...$$('.term').map(c => ({ t: c.querySelector('h3')?.textContent || '', d: c.querySelector('p')?.textContent || '', k: 'Concept', el: c })),
    ...$$('.gloss > div').map(c => ({ t: c.querySelector('dt')?.textContent || '', d: c.querySelector('dd')?.textContent || '', k: 'Glossary', el: c }))
  ].filter(x => x.t);
  // every sport's sections, concepts and glossary, fetched the first time search opens
  const ROOT = new URL('../../', import.meta.url), home = document.body.classList.contains('home');
  let global = null, loading = null;
  const loadGlobal = () => loading || (loading = fetch(new URL('assets/playbook-index.json', ROOT)).then(r => r.json()).then(d => { global = d; if (pal.classList.contains('on')) render(); }).catch(() => { global = []; }));
  const H = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const cap = v => v.charAt(0).toUpperCase() + v.slice(1);
  const match = q => x => x.t.toLowerCase().includes(q) || x.d.toLowerCase().includes(q);
  const rank = q => (a, b) => (b.t.toLowerCase().startsWith(q)) - (a.t.toLowerCase().startsWith(q));
  let sel = 0, results = [];
  const render = () => {
    const q = input.value.trim().toLowerCase();
    const local = home ? [] : (q ? index.filter(match(q)).sort(rank(q)) : index.filter(x => x.k === 'Section')).slice(0, 40);
    const far = !global ? [] : q ? global.filter(x => (home || x.s !== sport) && match(q)(x)).sort(rank(q)).slice(0, home ? 50 : 14) : home ? global.filter(x => x.k === 'Section') : [];
    results = [...local, ...far];
    sel = Math.min(sel, Math.max(0, results.length - 1));
    list.innerHTML = results.length ? results.map((r, i) => `<a href="${r.u ? H(new URL(r.u, ROOT).href) : '#'}" role="option" aria-selected="${i === sel}" data-i="${i}"><b>${H(r.t)}</b><em${r.s ? ' class="far"' : ''}>${r.s ? H(cap(r.s)) + ' · ' : ''}${H(r.k)}</em><small>${H(r.d)}</small></a>`).join('') : `<p class="empty on">${global || home ? 'No match in any sport. Try a simpler word, like “offside”.' : 'Searching every sport…'}</p>`;
  };
  const go = r => {
    if (r.u) { location.href = new URL(r.u, ROOT).href; close(); return; }
    close();
    const target = r.id ? document.getElementById(r.id) : r.el;
    if (r.el?.hidden) { const gi = $('.gloss-search'); if (gi) { gi.value = ''; gi.dispatchEvent(new Event('input')); } }
    target?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    if (r.el) { r.el.classList.add('is-hit'); setTimeout(() => r.el.classList.remove('is-hit'), 2200); }
  };
  const open = () => { pal.classList.add('on'); input.value = ''; sel = 0; render(); loadGlobal(); setTimeout(() => input.focus(), 10); };
  const close = () => pal.classList.remove('on');
  $$('[data-open-search]').forEach(b => b.addEventListener('click', open));
  addEventListener('keydown', e => {
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName))) { e.preventDefault(); open(); }
    if (!pal.classList.contains('on')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(results.length - 1, sel + 1); render(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); render(); }
    if (e.key === 'Enter' && results[sel]) { e.preventDefault(); go(results[sel]); }
  });
  input.addEventListener('input', () => { sel = 0; render(); });
  list.addEventListener('click', e => { const a = e.target.closest('a'); if (a && !(e.metaKey || e.ctrlKey || e.shiftKey)) { e.preventDefault(); go(results[+a.dataset.i]); } });
  pal.addEventListener('click', e => { if (e.target === pal) close(); });
}

/* ---------------- visual modules: mounted when they approach the viewport */
function visuals() {
  const nodes = $$('[data-viz]'); if (!nodes.length) return;
  const mods = {};
  const load = async el => {
    const [mod, name] = el.dataset.viz.split('/');
    try {
      mods[mod] = mods[mod] || import(`./viz/${mod}.js`);
      const m = await mods[mod];
      await m.mount(el, name);
      el.classList.add('is-mounted');
    } catch (e) { console.error('viz failed', el.dataset.viz, e); el.querySelector('.viz-body')?.insertAdjacentHTML('beforeend', '<p class="empty on">This visual could not load in your browser.</p>'); }
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); load(e.target); } }), { rootMargin: '600px 0px' });
  nodes.forEach(n => io.observe(n));
}

/* ---------------- Playbook home: the slate rotates through the six plates like a broadcast rundown */
function homeSlate() {
  const list = $('.slate'); if (!list) return;
  const rows = $$('a[data-k]', list), shots = $$('.slate-shot');
  let i = 0, hold = false;
  const show = k => {
    rows.forEach(r => r.classList.toggle('is-live', r.dataset.k === k));
    shots.forEach(sh => sh.classList.toggle('is-on', sh.dataset.k === k));
    const bar = rows.find(r => r.dataset.k === k)?.querySelector('.sl-bar i');
    if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
  };
  const pause = on => { hold = on; list.classList.toggle('is-paused', on || reduced); if (!on) show(rows[i].dataset.k); };
  list.addEventListener('animationend', e => { if (hold || document.hidden || !e.target.closest('.is-live')) return; i = (i + 1) % rows.length; show(rows[i].dataset.k); });
  rows.forEach((r, n) => { const on = () => { i = n; show(r.dataset.k); pause(true); }; r.addEventListener('mouseenter', on); r.addEventListener('focus', on); });
  list.addEventListener('mouseleave', () => pause(false));
  list.addEventListener('focusout', e => { if (!list.contains(e.relatedTarget)) pause(false); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !hold) show(rows[i].dataset.k); });
  if (reduced) list.classList.add('is-paused');
  const hb = $('.howbar');
  if (hb) { if (reduced) hb.classList.add('in'); else { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { hb.classList.add('in'); io.disconnect(); } }), { threshold: .45 }); io.observe(hb); } }
}

function reveal() {
  if (reduced) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.term, .update, .steps li, .plate, .watch-row').forEach((n, i) => { n.classList.add('reveal'); n.style.transitionDelay = (i % 6) * 40 + 'ms'; io.observe(n); });
}

hero3d(); progress(); jargon(); glossary(); palette(); visuals(); homeSlate(); reveal();
