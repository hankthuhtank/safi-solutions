/* Safi Solutions — shared page behaviour: menu, reveals, the Paris TX clock, the showroom, project filters,
   "add to phone" help, and forwarding of links made for the old single-page site. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  document.documentElement.classList.add('js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ links from the old one-page site (index.html#products etc.) */
  if (document.body.classList.contains('page-home') && location.hash) {
    const h = decodeURIComponent(location.hash.slice(1));
    const projects = ['sportsatlas', 'motoratlas', 'voltvisual', 'tradeschool', 'overtone', 'thebench', 'houseedge', 'thewell', 'vellum', 'cardesk', 'movedesk', 'tradingdesk'];
    let to = null;
    if (['products', 'main', 'top', 'desk', 'playground'].includes(h)) to = '/products/';
    else if (/^[a-z]+-product$/.test(h)) to = '/products/#' + h.replace('-product', '');
    else if (h === 'work') to = '/projects/';
    else if (h === 'markets') to = '/projects/#tradingdesk';
    else if (projects.includes(h)) to = '/projects/#' + h;
    else if (['websites', 'services', 'packages', 'elizabeth', 'baker'].includes(h)) to = '/websites/' + (['elizabeth', 'baker'].includes(h) ? '#' + h : '');
    else if (h === 'safistudios' || h.startsWith('studio-')) to = '/studio/';
    if (to) { location.replace(to); return; }
  }

  /* ------------------------------------------------ mobile menu */
  const menu = $('#menu-toggle'), mnav = $('#mobile-nav');
  if (menu && mnav) {
    const close = () => { menu.setAttribute('aria-expanded', 'false'); mnav.classList.remove('open'); menu.querySelector('span').textContent = 'Menu'; };
    menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); mnav.classList.toggle('open', open); menu.querySelector('span').textContent = open ? 'Close' : 'Menu'; });
    mnav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && mnav.classList.contains('open')) { close(); menu.focus(); } });
  }

  /* ------------------------------------------------ year + local time in Paris, Texas */
  $$('[data-year]').forEach(n => n.textContent = new Date().getFullYear());
  const clock = $('[data-clock]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' });
    const tick = () => { clock.innerHTML = 'Paris, Texas · <b>' + fmt.format(new Date()) + '</b>'; };
    tick(); setInterval(tick, 30000);
  }

  /* ------------------------------------------------ reveal on scroll */
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach((el, i) => { if (el.dataset.d) el.style.transitionDelay = el.dataset.d + 'ms'; io.observe(el); });
  } else $$('.rv').forEach(el => el.classList.add('in'));

  /* ------------------------------------------------ pointer light on screenshots */
  $$('.card-shot, .screen-view').forEach(el => el.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%'); el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  }, { passive: true }));

  /* ------------------------------------------------ "I'm interested in…" prefill */
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-interest]'); if (!a) return;
    const sel = $('#iq-interest'); if (sel && [...sel.options].some(o => o.value === a.dataset.interest)) sel.value = a.dataset.interest;
  });

  /* ------------------------------------------------ showroom: one screen, a list of work beside it */
  const show = $('.show-grid');
  if (show) {
    const tabs = $$('[role="tab"]', show), screen = $('.screen-view', show), url = $('.screen-url span', show);
    const cap = $('.show-cap p', show), open = $('.show-cap .button', show);
    const DUR = 6500; let i = 0, timer = null, paused = false;
    show.style.setProperty('--dur', DUR + 'ms');
    const imgs = tabs.map(tb => {
      let el;
      if (tb.dataset.splash) { el = document.createElement('div'); el.className = 'splash out'; el.style.background = tb.dataset.bg || '#101418'; el.innerHTML = `<img src="${tb.dataset.splash}" alt="">`; }
      else { el = document.createElement('img'); el.src = tb.dataset.img; el.alt = tb.dataset.alt || ''; el.loading = 'lazy'; el.className = 'out'; }
      screen.appendChild(el); return el;
    });
    const first = $('img.first', screen); if (first) first.remove();
    function go(n, user) {
      i = (n + tabs.length) % tabs.length; const tb = tabs[i];
      tabs.forEach((b, k) => { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
      imgs.forEach((el, k) => el.classList.toggle('out', k !== i));
      screen.href = tb.dataset.href; screen.setAttribute('aria-label', 'Open ' + tb.dataset.name);
      url.textContent = tb.dataset.url; cap.textContent = tb.dataset.desc;
      open.href = tb.dataset.href; open.firstChild.textContent = tb.dataset.cta + ' ';
      if (tb.dataset.ext) { open.target = screen.target = '_blank'; open.rel = screen.rel = 'noopener noreferrer'; } else { open.removeAttribute('target'); screen.removeAttribute('target'); }
      // restart the progress bar
      const bar = $('.sl-bar i', tb); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      schedule(user);
    }
    function schedule(user) { clearTimeout(timer); if (reduced || user === 'stop') return; timer = setTimeout(() => { if (!paused) go(i + 1); else schedule(); }, DUR); }
    tabs.forEach((b, k) => b.addEventListener('click', () => go(k, 'user')));
    show.addEventListener('keydown', e => { if (!e.target.matches('[role="tab"]')) return; const m = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (m) { e.preventDefault(); go(i + m, 'user'); tabs[i].focus(); } });
    const pause = v => { paused = v; show.classList.toggle('paused', v); };
    show.addEventListener('pointerenter', () => pause(true)); show.addEventListener('pointerleave', () => pause(false));
    show.addEventListener('focusin', () => pause(true)); show.addEventListener('focusout', () => pause(false));
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { if (es[0].isIntersecting) go(i); else clearTimeout(timer); }, { threshold: .35 }).observe(show);
    else go(0);
  }

  /* ------------------------------------------------ project filters */
  const filters = $('.filters');
  if (filters) {
    const cards = $$('.card[data-kind]');
    filters.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      $$('.chip', filters).forEach(c => c.setAttribute('aria-pressed', String(c === b)));
      const k = b.dataset.filter; cards.forEach(c => c.classList.toggle('is-hidden', k !== 'all' && c.dataset.kind !== k));
    });
  }

  /* ------------------------------------------------ add to phone */
  const dlg = $('#phone-dialog');
  if (dlg) {
    $$('[data-phone]').forEach(b => b.addEventListener('click', () => {
      $('#phone-name', dlg).textContent = b.dataset.phone; const a = $('#phone-open', dlg); a.href = b.dataset.href; a.firstChild.textContent = 'Open ' + b.dataset.phone + ' ';
      dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
    }));
    $('.sd-close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }

  /* ------------------------------------------------ product screenshot zoom */
  const zoom = $('#zoom-dialog');
  if (zoom) {
    $$('[data-zoom]').forEach(b => b.addEventListener('click', () => { const img = b.querySelector('img'); $('img', zoom).src = img.src; $('img', zoom).alt = img.alt; $('.zoom-title', zoom).textContent = img.alt; zoom.showModal(); }));
    zoom.addEventListener('click', e => { if (e.target === zoom || e.target.closest('.sd-close')) zoom.close(); });
  }
})();
