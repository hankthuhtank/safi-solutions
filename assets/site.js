/* Safi Solutions: shared page behaviour. Menu, reveals, the Paris TX clock, the project detail view,
   "add to phone" help, contact-form prefill, and forwarding of links made for the old single-page site. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  document.documentElement.classList.add('js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ links from the old one-page site (index.html#products etc.) */
  if (document.body.classList.contains('page-home') && location.hash) {
    const h = decodeURIComponent(location.hash.slice(1));
    const projects = ['playbook', 'motoratlas', 'voltvisual', 'tradeschool', 'overtone', 'thebench', 'houseedge', 'thewell', 'vellum', 'cardesk', 'movedesk'];
    let to = null;
    if (['products', 'main', 'top', 'desk', 'playground'].includes(h)) to = '/products/';
    else if (/^[a-z]+-product$/.test(h)) to = '/products/#' + h.replace('-product', '');
    else if (h === 'work') to = '/projects/';
    else if (h === 'markets' || h === 'tradingdesk') to = '/tradingdesk/';
    else if (projects.includes(h)) to = '/projects/#' + h;
    else if (h === 'sportsatlas') to = '/projects/#playbook';
    else if (['websites', 'services', 'packages', 'elizabeth', 'baker'].includes(h)) to = '/websites/' + (['elizabeth', 'baker'].includes(h) ? '#' + h : '');
    else if (h === 'safistudios' || h.startsWith('studio-')) to = '/studio/';
    else if (h === 'about') to = '/about/';
    else if (h === 'contact') to = '/contact/';
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
    $$('.rv').forEach(el => { if (el.dataset.d) el.style.transitionDelay = el.dataset.d + 'ms'; io.observe(el); });
  } else $$('.rv').forEach(el => el.classList.add('in'));

  /* ------------------------------------------------ pointer light on tiles and screenshots */
  $$('.tile-cover, .site-cover, .detail-view').forEach(el => el.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%'); el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  }, { passive: true }));

  /* ------------------------------------------------ client logos that fail to load fall back to a wordmark */
  $$('img[data-fallback]').forEach(img => {
    const swap = () => { const b = document.createElement('b'); b.className = 'site-wordmark'; b.textContent = img.dataset.fallback; img.replaceWith(b); };
    if (img.complete && img.naturalWidth === 0) swap(); else img.addEventListener('error', swap, { once: true });
  });

  /* ------------------------------------------------ add to phone */
  const dlg = $('#phone-dialog');
  const openPhone = (name, href) => {
    if (!dlg) return;
    $('#phone-name', dlg).textContent = name; const a = $('#phone-open', dlg); a.href = href; a.firstChild.textContent = 'Open ' + name + ' ';
    dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
  };
  if (dlg) {
    $('.sd-close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }

  /* ------------------------------------------------ projects: the tile wall and one detail view per project (/projects/#id) */
  const detail = $('#project-detail'), list = $('#project-list'), dataEl = $('#project-data');
  if (detail && list && dataEl) {
    const P = JSON.parse(dataEl.textContent), byId = new Map(P.map(p => [p.id, p]));
    const baseTitle = document.title;
    let current = null, listScroll = 0;
    const show = p => {
      const i = P.indexOf(p), prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
      $('#d-type').textContent = p.type; $('#d-title').textContent = p.name; $('#d-copy').textContent = p.detail;
      $('#d-open').href = $('#d-view').href = p.href;
      $('#d-view').setAttribute('aria-label', 'Open ' + p.name);
      const img = $('#d-img'); img.src = p.shot; img.alt = p.name + ': screenshot of the live project';
      $('#d-url').textContent = 'safisolutions.org' + p.href;
      $('#d-prev').href = '#' + prev.id; $('#d-prev').setAttribute('aria-label', 'Previous project: ' + prev.name);
      $('#d-next').href = '#' + next.id; $('#d-next').setAttribute('aria-label', 'Next project: ' + next.name);
      document.title = p.name + ' | Safi Solutions';
      current = p;
    };
    const ALIAS = { sportsatlas: 'playbook' }; // Playbook was called Sports Atlas for its first day online
    const route = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (ALIAS[h]) { history.replaceState(history.state, '', '#' + ALIAS[h]); return route(); }
      const p = byId.get(h);
      if (p) {
        if (!current) listScroll = scrollY;
        show(p); list.hidden = true; detail.hidden = false;
        scrollTo({ top: 0, behavior: 'instant' });
      } else {
        const was = current; current = null; detail.hidden = true; list.hidden = false; document.title = baseTitle;
        if (was) {
          const t = $('#t-' + was.id);
          if (t) {
            if (listScroll) scrollTo({ top: listScroll, behavior: 'instant' }); else t.scrollIntoView({ block: 'center', behavior: 'instant' });
            $('.tile-cover', t).focus({ preventScroll: true });
          }
        }
      }
    };
    $('[data-all]', detail).addEventListener('click', e => {
      e.preventDefault();
      if (history.state && history.state.fromList) history.back();
      else { history.pushState(null, '', location.pathname); route(); }
    });
    // remember that the detail view was opened from the wall, so "All projects" can simply go back
    list.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a || !byId.has(a.getAttribute('href').slice(1))) return;
      e.preventDefault(); listScroll = scrollY; history.pushState({ fromList: true }, '', a.getAttribute('href')); route();
    });
    $('#d-phone').addEventListener('click', () => current && openPhone(current.name, current.href));
    addEventListener('hashchange', route); addEventListener('popstate', route);
    route();
  }

  /* ------------------------------------------------ contact: "I'm interested in" follows the link you came from */
  const interest = $('#iq-interest');
  if (interest) {
    const want = new URLSearchParams(location.search).get('interest');
    if (want && [...interest.options].some(o => o.value === want)) interest.value = want;
  }

  /* ------------------------------------------------ product screenshot zoom */
  const zoom = $('#zoom-dialog');
  if (zoom) {
    $$('[data-zoom]').forEach(b => b.addEventListener('click', () => { const img = b.querySelector('img'); $('img', zoom).src = img.src; $('img', zoom).alt = img.alt; $('.zoom-title', zoom).textContent = img.alt; zoom.showModal(); }));
    zoom.addEventListener('click', e => { if (e.target === zoom || e.target.closest('.sd-close')) zoom.close(); });
  }
})();
