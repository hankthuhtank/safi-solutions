/* Safi Solutions: page-to-page transitions.
   Every link you follow leaves a thread at the height you clicked it; the next page opens outward from that line,
   and a door's label flies up to become the page title. Chrome, Edge and Safari do this as a cross-document view
   transition; browsers without one get the same opening played on the page itself. Loaded in <head>, not deferred,
   so the arriving page is set up before its first frame. */
(() => {
  'use strict';
  const KEY = 'safi-seam', root = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const TITLED = ['/products/', '/projects/', '/websites/', '/studio/', '/shorecrest/']; // door label matches that page's h1
  const store = v => { try { v ? sessionStorage.setItem(KEY, JSON.stringify(v)) : sessionStorage.removeItem(KEY); } catch (e) {} };
  const clearNames = () => document.querySelectorAll('[data-vt]').forEach(n => { n.style.viewTransitionName = ''; n.removeAttribute('data-vt'); });
  const name = (n, v) => { if (n) { n.style.viewTransitionName = v; n.setAttribute('data-vt', ''); } };

  /* ------------------------------------------------ leaving: remember where the thread was pulled */
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
    const r = a.getBoundingClientRect();
    const y = r.height ? r.top + r.height / 2 : e.clientY, x = e.clientX || r.left + r.width / 2;
    const door = a.classList.contains('door') && TITLED.includes(url.pathname);
    clearNames();
    if (door) name(a.querySelector('.door-body b'), 'page-title');
    store({ t: Date.now(), to: url.pathname, x: Math.round(x), y: Math.round(y), title: door });
  }, true);

  /* ------------------------------------------------ arriving */
  const take = () => {
    let s = null;
    try { s = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) {}
    store(null);
    return s && Date.now() - s.t < 5000 && s.to === location.pathname ? s : null;
  };
  const place = s => {
    root.style.setProperty('--seam-x', Math.max(0, Math.min(innerWidth, s.x)) + 'px');
    root.style.setProperty('--seam-y', Math.max(0, Math.min(innerHeight, s.y)) + 'px');
  };
  const seam = s => {
    place(s);
    const el = document.createElement('i');
    el.className = 'vt-seam'; el.setAttribute('aria-hidden', 'true');
    root.append(el); // outside <body>, so the body's own opening clip never cuts the line
    return el;
  };

  if ('onpagereveal' in window) {
    addEventListener('pagereveal', e => {
      clearNames(); // a page restored from the back/forward cache still carries the names it left with
      const vt = e.viewTransition, s = vt && take();
      if (!s) return; // back/forward and anything unrecorded keep the browser's plain crossfade
      const el = seam(s);
      if (s.title) name(document.querySelector('.page-head h1'), 'page-title');
      root.classList.add('seam-vt');
      vt.finished.finally(() => { root.classList.remove('seam-vt'); el.remove(); clearNames(); });
    });
  } else {
    // no cross-document view transitions (Firefox for now): open the page itself from the same line
    const s = take();
    if (s) {
      place(s); root.classList.add('seam-in');
      requestAnimationFrame(() => {
        const el = seam(s);
        setTimeout(() => { root.classList.remove('seam-in'); el.remove(); }, 900);
      });
    }
  }
})();
