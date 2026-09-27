/* HouseEdge — the roulette table: a printed layout you can bet on, a to-scale 3D wheel that spins, and a ledger that
   shows the house edge appearing out of the noise. The result of each spin comes from crypto.getRandomValues; the ball
   is then flown into that pocket. */
const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
const money = (n, d = 0) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const colorOf = p => (p === '0' || p === '00') ? 'g' : RED.has(+p) ? 'r' : 'k';
const ORDER = {
  european: ['0', 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26].map(String),
  american: ['0', 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, '00', 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2].map(String)
};
const rand = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));

export function init(host) {
  const felt = $('#rlFelt', host);
  const state = { wheel: 'european', unit: 10, bets: new Map(), spinning: false, spins: 0, wagered: 0, net: 0, history: [] };
  const catalog = new Map(), els = new Map();

  /* ---------------------------------------------------------------- the layout */
  const lay = document.createElement('div'); lay.className = 'lay'; felt.appendChild(lay);
  const hot = document.createElement('div'); hot.style.cssText = 'position:relative;grid-column:2/14;grid-row:1/7;pointer-events:none'; // overlay over the numbers
  const hotStreet = document.createElement('div'); hotStreet.style.cssText = 'position:relative;grid-column:2/14;grid-row:7;pointer-events:none';
  const bet = (id, label, nums, pays) => { if (!catalog.has(id)) catalog.set(id, { id, label, nums: nums.map(String), pays }); return catalog.get(id); };
  const bind = (el, b) => { el.type = 'button'; el.dataset.bet = b.id; el.setAttribute('aria-label', `${b.label}, pays ${b.pays} to 1`); el.title = `${b.label} · pays ${b.pays}:1`; if (!els.has(b.id)) els.set(b.id, []); els.get(b.id).push(el); el.addEventListener('click', () => toggle(b.id)); return el; };
  const btn = (cls, html, b, style = '') => { const el = document.createElement('button'); el.className = cls; el.innerHTML = html; if (style) el.style.cssText = style; return bind(el, b); };
  const numAt = (c, r) => 3 * (c + 1) - r; // column 0–11, row 0 = top
  function build() {
    lay.innerHTML = ''; els.clear(); hot.innerHTML = ''; hotStreet.innerHTML = '';
    const us = state.wheel === 'american';
    // zeros: rows are half-height (6 half-rows = 3 number rows)
    if (us) { lay.appendChild(btn('z top', '<i>0</i>', bet('s0', '0 straight up', ['0'], 35), 'grid-row:1/4;border-radius:22px 0 0 0')); lay.appendChild(btn('z bot', '<i>00</i>', bet('s00', '00 straight up', ['00'], 35), 'grid-row:4/7;border-radius:0 0 0 22px')); }
    else lay.appendChild(btn('z single', '<i>0</i>', bet('s0', '0 straight up', ['0'], 35), 'grid-row:1/7'));
    for (let c = 0; c < 12; c++) for (let r = 0; r < 3; r++) { const n = numAt(c, r); lay.appendChild(btn(`n ${RED.has(n) ? 'r' : 'k'}`, `<i>${n}</i>`, bet('s' + n, `${n} straight up`, [n], 35), `grid-column:${c + 2};grid-row:${r * 2 + 1}/span 2`)).dataset.pocket = n; }
    ['Top', 'Middle', 'Bottom'].forEach((t, r) => lay.appendChild(btn('col', '2 to 1', bet('col' + r, `${t} column`, Array.from({ length: 12 }, (_, c) => numAt(c, r)), 2), `grid-row:${r * 2 + 1}/span 2`)));
    lay.appendChild(hot); lay.appendChild(hotStreet);
    // splits, corners (on the lines between numbers)
    const hs = (cls, left, top, b, parent = hot) => { const el = document.createElement('button'); el.className = 'hs ' + cls; el.style.cssText = `left:calc(${left * 100}% - ${cls === 'v' ? 11 : cls === 'h' ? 15 : 10}px);top:calc(${top * 100}% - ${cls === 'v' ? 15 : cls === 'h' ? 9 : 10}px);pointer-events:auto`; parent.appendChild(bind(el, b)); };
    for (let c = 0; c < 12; c++) for (let r = 0; r < 2; r++) { const a = numAt(c, r), b2 = numAt(c, r + 1); hs('h', (c + .5) / 12, (r + 1) / 3, bet(`sp${b2}-${a}`, `${b2}/${a} split`, [b2, a], 17)); }
    for (let c = 0; c < 11; c++) for (let r = 0; r < 3; r++) { const a = numAt(c, r), b2 = numAt(c + 1, r); hs('v', (c + 1) / 12, (r + .5) / 3, bet(`sp${a}-${b2}`, `${a}/${b2} split`, [a, b2], 17)); }
    for (let c = 0; c < 11; c++) for (let r = 0; r < 2; r++) { const ns = [numAt(c, r + 1), numAt(c, r), numAt(c + 1, r + 1), numAt(c + 1, r)].sort((x, y) => x - y); hs('c', (c + 1) / 12, (r + 1) / 3, bet('co' + ns.join('-'), `${ns.join('/')} corner`, ns, 8)); }
    // streets + six lines
    for (let c = 0; c < 12; c++) { const ns = [numAt(c, 2), numAt(c, 1), numAt(c, 0)]; lay.appendChild(btn('street', `${ns[0]}–${ns[2]}`, bet('st' + c, `${ns[0]}–${ns[2]} street`, ns, 11), `grid-column:${c + 2};grid-row:7`)); }
    for (let c = 0; c < 11; c++) { const ns = [numAt(c, 2), numAt(c, 1), numAt(c, 0), numAt(c + 1, 2), numAt(c + 1, 1), numAt(c + 1, 0)]; hs('c', (c + 1) / 12, .5, bet('sl' + c, `${ns[0]}–${ns[5]} six line`, ns, 5), hotStreet); }
    // the one bet with a worse price: top line on double-zero, first four on single-zero
    lay.appendChild(us ? btn('spec', 'Top<br>line', bet('top', 'Top line 0-00-1-2-3', ['0', '00', '1', '2', '3'], 6), 'grid-column:1;grid-row:7') : btn('spec', 'First<br>four', bet('first4', 'First four 0-1-2-3', ['0', '1', '2', '3'], 8), 'grid-column:1;grid-row:7'));
    [['1st 12', 1, 12], ['2nd 12', 13, 24], ['3rd 12', 25, 36]].forEach(([t, a, b2], i) => lay.appendChild(btn('dz', t, bet('dz' + i, `${t} dozen`, range(a, b2), 2), `grid-column:${i * 4 + 2}/span 4;grid-row:8`)));
    const reds = [...RED].map(String), blacks = range(1, 36).filter(n => !RED.has(+n));
    [['1–18', 'low', range(1, 18)], ['Even', 'even', range(1, 36).filter(n => n % 2 === 0)], ['<i></i>', 'red', reds], ['<i></i>', 'blk', blacks], ['Odd', 'odd', range(1, 36).filter(n => n % 2 === 1)], ['19–36', 'high', range(19, 36)]]
      .forEach(([t, k, ns], i) => lay.appendChild(btn(`ev ${k}`, t, bet('ev' + k, { low: '1–18', even: 'Even', red: 'Red', blk: 'Black', odd: 'Odd', high: '19–36' }[k], ns, 1), `grid-column:${i * 2 + 2}/span 2;grid-row:9`)));
    // drop bets that don't exist on this wheel
    [...state.bets.keys()].forEach(id => { if (!els.has(id)) state.bets.delete(id); });
    sync();
  }
  lay.style.gridTemplateRows = 'repeat(6, 23px) 30px 40px 40px';
  const mq = matchMedia('(max-width: 600px)'); const rows = () => { lay.style.gridTemplateRows = mq.matches ? 'repeat(6, 20px) 26px 36px 36px' : 'repeat(6, 23px) 30px 40px 40px'; }; rows(); mq.addEventListener?.('change', rows);

  function toggle(id) { if (state.spinning) return; state.bets.has(id) ? state.bets.delete(id) : state.bets.set(id, catalog.get(id)); clearMarks(); sync(); }
  function pockets() { return ORDER[state.wheel]; }
  function sync() {
    state.unit = Math.max(1, Math.round(+$('#rlUnit').value || 1));
    const active = [...state.bets.values()], total = active.length * state.unit, P = pockets();
    els.forEach((list, id) => list.forEach(el => { el.classList.toggle('on', state.bets.has(id)); const has = el.querySelector('.chipmark'); if (state.bets.has(id) && !has) el.insertAdjacentHTML('beforeend', `<span class="chipmark${el.classList.contains('hs') ? ' hs-chip' : ''}"></span>`); if (!state.bets.has(id) && has) has.remove(); }));
    const outcomes = P.map(p => active.reduce((s, b) => s + (b.nums.includes(p) ? state.unit * (b.pays + 1) : 0), 0) - total);
    const covered = P.filter(p => active.some(b => b.nums.includes(p))).length, avg = outcomes.reduce((a, b) => a + b, 0) / P.length;
    $('#slCount').textContent = active.length; $('#slTotal').textContent = money(total); $('#slCover').textContent = `${covered} / ${P.length}`;
    $('#slLoss').textContent = active.length ? money(-avg, 2) : '$0'; $('#slEdge').textContent = active.length ? (-avg / total * 100).toFixed(2) + '%' : '–';
    state.exp = active.length ? -avg / total : null; $('#lgExp').textContent = state.exp === null ? 'place a bet to compare' : `math says ${(state.exp * 100).toFixed(2)}%`;
  }
  function clearMarks() { $$('.win, .hitpocket', lay).forEach(e => e.classList.remove('win', 'hitpocket')); }
  $('#rlUnit').addEventListener('input', sync);
  $('#rlClear').addEventListener('click', () => { if (state.spinning) return; state.bets.clear(); clearMarks(); sync(); });

  /* ---------------------------------------------------------------- results + ledger */
  const hist = $('#rlHistory'), result = $('#rlResult');
  function settle(pocket, show = true) {
    const active = [...state.bets.values()], total = active.length * state.unit;
    const back = active.reduce((s, b) => s + (b.nums.includes(pocket) ? state.unit * (b.pays + 1) : 0), 0), net = back - total;
    state.spins++; state.wagered += total; state.net += net;
    state.history.unshift(pocket); state.history.length = Math.min(state.history.length, 14);
    if (show) {
      clearMarks();
      $$(`[data-pocket="${pocket}"]`, lay).forEach(e => e.classList.add('hitpocket'));
      if (pocket === '0' || pocket === '00') els.get('s' + pocket)?.forEach(e => e.classList.add('hitpocket'));
      active.filter(b => b.nums.includes(pocket)).forEach(b => els.get(b.id)?.forEach(e => e.classList.add('win')));
      const c = colorOf(pocket), name = { r: 'Red', k: 'Black', g: 'Green' }[c];
      result.innerHTML = `<b class="${c}">${pocket}</b>${name} · ${total ? (net >= 0 ? 'you win ' + money(net) : 'you lose ' + money(-net)) : 'no chips on the table'}`;
      result.classList.add('show');
    }
    return net;
  }
  function ledger() {
    hist.innerHTML = state.history.map(p => `<li class="${colorOf(p)}">${p}</li>`).join('');
    $('#lgSpins').textContent = state.spins.toLocaleString('en-US'); $('#lgWagered').textContent = money(state.wagered);
    const n = $('#lgNet'); n.textContent = (state.net > 0 ? '+' : '') + money(state.net); n.className = state.net < 0 ? 'neg' : state.net > 0 ? 'pos' : '';
    $('#lgEdge').textContent = state.wagered ? (-state.net / state.wagered * 100).toFixed(2) + '%' : '–';
    if (state.spins && state.spins < 30) $('#lgExp').textContent = `math says ${((state.exp ?? 0) * 100).toFixed(2)}% · keep spinning`;
  }

  /* ---------------------------------------------------------------- 3D wheel */
  const stage = $('#rlStage', host); let wheel3d = null;
  const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  if (webgl) mountWheel().catch(e => console.warn('3D wheel unavailable', e));
  async function mountWheel() {
    const P3 = await import('./props3d.js');
    const { THREE, makeRenderer, makeWheel, casinoLights, WHEEL, surfaceY, TAU } = P3;
    const canvas = document.createElement('canvas'); stage.prepend(canvas);
    const renderer = makeRenderer(canvas, { alpha: true }); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(33, 1.2, .05, 10); cam.position.set(0, .8, .6); cam.lookAt(0, .02, .03);
    casinoLights(scene, renderer, { key: [.22, 1.6, .45], target: [0, 0, 0], intensity: 11, angle: .55 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.47, .48, .03, 96), new THREE.MeshStandardMaterial({ color: 0x0b0806, roughness: .75 })); base.position.y = -.016; base.receiveShadow = true; scene.add(base);
    let W = null, type = null, alpha = 0, ballAngle = 0, spin = null, lastT = performance.now(), visible = true, locked = null;
    const setType = t => { if (W) { scene.remove(W.group); W.group.traverse(o => { o.geometry?.dispose?.(); }); } W = makeWheel(t); type = t; scene.add(W.group); W.setRotor(alpha); if (locked) locked = null; W.ball.visible = false; };
    setType(state.wheel);
    const resize = () => { const r = stage.getBoundingClientRect(); if (!r.width) return; renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.fov = cam.aspect < 1.1 ? 38 : 33; cam.updateProjectionMatrix(); };
    new ResizeObserver(resize).observe(stage); resize();
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(stage);
    const ease = u => 1 - Math.pow(1 - u, 3), smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const T = reduced ? 1.2 : 6.4, Dturns = reduced ? 1.5 : 9;
    // rotor speed: fast after the croupier's push, easing back to an idle drift
    const rotorAt = (t, s) => s.a0 + .6 * t + (1.5 - .6) * (T / 2.2) * (1 - Math.exp(-2.2 * t / T));
    function start(pocket) {
      return new Promise(resolve => {
        const n = W.order.length, k = W.order.indexOf(pocket), phi = (k + .5) / n * TAU;
        const s = { t0: performance.now(), a0: alpha, k, phi, resolve };
        const tLock = .95 * T, D = Dturns * TAU;
        s.target = t => rotorAt(t, s) + phi;
        s.theta0 = s.target(tLock) + D * ease(.95);
        spin = s; W.ball.visible = true;
      });
    }
    function frame(now) {
      const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
      if (spin) {
        const t = (now - spin.t0) / 1000, u = Math.min(1, t / T);
        alpha = rotorAt(Math.min(t, T), spin);
        const free = spin.theta0 - Dturns * TAU * ease(Math.min(u, .95)), lockA = spin.target(Math.min(t, T)), b = smooth(.84, .95, u);
        ballAngle = free * (1 - b) + lockA * b;
        let r = WHEEL.trackR, y = 0;
        if (u > .6) r = WHEEL.trackR + (.3 - WHEEL.trackR) * smooth(.6, .74, u);
        if (u > .74) r = .3 + (.27 - .3) * smooth(.74, .8, u);
        if (u > .8) r = .27 + (WHEEL.pocketR - .27) * smooth(.8, .93, u);
        if (u > .74 && u < .93) y = Math.abs(Math.sin((u - .74) / .19 * Math.PI * 3)) * .012 * (1 - (u - .74) / .19);
        W.setRotor(alpha); W.placeBall(ballAngle, r, (r <= .262 ? .026 : surfaceY(r)) + y);
        if (t >= T) { locked = { phi: spin.phi }; const res = spin.resolve; spin = null; res(); }
      } else {
        alpha += (locked ? .45 : .35) * dt; W.setRotor(alpha);
        if (locked) W.placeBall(alpha + locked.phi, WHEEL.pocketR, .026);
      }
      if (visible || spin) renderer.render(scene, cam);
    }
    renderer.setAnimationLoop(frame);
    stage.classList.add('live');
    wheel3d = { spin: start, setType: t => { if (t !== type) setType(t); } };
  }

  /* ---------------------------------------------------------------- controls */
  const spinBtn = $('#rlSpin'), spin100 = $('#rlSpin100');
  async function doSpin() {
    if (state.spinning) return; state.spinning = true; spinBtn.disabled = spin100.disabled = true; result.classList.remove('show'); clearMarks();
    const P = pockets(), pocket = P[rand(P.length)];
    if (wheel3d) await wheel3d.spin(pocket); else await new Promise(r => setTimeout(r, reduced ? 100 : 900));
    settle(pocket); ledger(); state.spinning = false; spinBtn.disabled = spin100.disabled = false;
  }
  spinBtn.addEventListener('click', doSpin);
  spin100.addEventListener('click', () => {
    if (state.spinning) return; const P = pockets(); let last;
    for (let i = 0; i < 100; i++) { last = P[rand(P.length)]; settle(last, i === 99); }
    ledger();
  });
  $$('[data-wheel]', host).forEach(b => b.addEventListener('click', () => {
    if (state.spinning || b.dataset.wheel === state.wheel) return;
    $$('[data-wheel]', host).forEach(x => x.setAttribute('aria-checked', String(x === b)));
    state.wheel = b.dataset.wheel; state.spins = state.wagered = state.net = 0; state.history = [];
    result.classList.remove('show'); build(); ledger(); wheel3d?.setType(state.wheel);
  }));

  // a sensible opening layout: red plus a number
  build(); state.bets.set('evred', catalog.get('evred')); state.bets.set('s17', catalog.get('s17')); sync(); ledger();
}
