/* Playbook: baseball visuals. Field units are feet with home plate at (0,0) and second base up the screen. */
import { Diagram, sceneSwitcher } from '../diagram.js';
import { BASES } from '../surfaces.js';

const NS = 'http://www.w3.org/2000/svg';
const h = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const s = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.append(n); return n; };
const NARROW = matchMedia('(max-width: 640px)').matches;
const polar = (d, deg) => [+(d * Math.sin(deg * Math.PI / 180)).toFixed(2), +(-d * Math.cos(deg * Math.PI / 180)).toFixed(2)];
const { first: B1, second: B2, third: B3 } = BASES;
const FULL = [-300, -432, 600, 504], INF = [-125, -175, 250, 205];
const R = NARROW ? 16 : 8;
const OPT = { sport: 'baseball', orient: 'h', r: R };

const POS = {
  P: { n: 1, name: 'Pitcher', at: [0, -59.6], info: 'Pitcher (1): delivers every pitch, then becomes a fifth infielder: fields bunts, covers first on balls to the right side, backs up bases on throws.' },
  C: { n: 2, name: 'Catcher', at: [0, 5], info: 'Catcher (2): receives pitches, calls the game with the pitcher, blocks balls in the dirt and throws out base stealers.' },
  '1B': { n: 3, name: 'First baseman', at: polar(108, 39), info: 'First baseman (3): takes most infield throws for outs, holds runners on, fields the right side.' },
  '2B': { n: 4, name: 'Second baseman', at: polar(148, 17), info: 'Second baseman (4): right side of second base; turns double plays and is the cutoff on many throws.' },
  '3B': { n: 5, name: 'Third baseman', at: polar(112, -39), info: 'Third baseman (5): the “hot corner”: hard-hit balls, bunts and the long throw across the diamond.' },
  SS: { n: 6, name: 'Shortstop', at: polar(146, -17), info: 'Shortstop (6): the infield’s range-and-arm position; leads cutoffs and double plays.' },
  LF: { n: 7, name: 'Left fielder', at: polar(285, -28), info: 'Left fielder (7): covers left field; backs up third base.' },
  CF: { n: 8, name: 'Center fielder', at: polar(318, 0), info: 'Center fielder (8): most ground to cover; has priority on fly balls he can reach.' },
  RF: { n: 9, name: 'Right fielder', at: polar(285, 28), info: 'Right fielder (9): usually the strongest outfield arm (long throw to third).' }
};
const fielders = (over = {}, o = {}) => Object.entries(POS).map(([k, p]) => ({ id: k, label: o.numbers ? String(p.n) : k, name: p.name, team: 'd', x: (over[k] || p.at)[0], y: (over[k] || p.at)[1], info: p.info }));

/* ------------------------------------------------ anatomy */
function anatomy(host) {
  const body = host.querySelector('.viz-body');
  const bar = h('div', 'chips layers'); body.append(bar);
  const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'To-scale ballpark with toggleable layers', caption: false, callouts: true, controls: false });
  const marks = {
    areas: [
      { type: 'path', d: `M0,0 L${polar(330, -45)} L${polar(330, 45)} Z`, tone: 'zone', under: true },
      { type: 'line', x1: 0, y1: -120, x2: 0, y2: -120, label: 'INFIELD', fs: 11, pill: false, tone: 'dim' },
      { type: 'line', x1: 0, y1: -280, x2: 0, y2: -280, label: 'OUTFIELD', fs: 13, pill: false, tone: 'dim' },
      { type: 'line', x1: -205, y1: -95, x2: -205, y2: -95, label: 'FOUL TERRITORY', fs: 10, tone: 'dim' },
      { type: 'line', x1: 205, y1: -95, x2: 205, y2: -95, label: 'FOUL TERRITORY', fs: 10, tone: 'dim' }
    ],
    dims: [
      { type: 'dim', x1: 0, y1: 0, x2: B1[0], y2: B1[1], label: '90 FT', fs: 9, lx: 56, ly: -14 },
      { type: 'dim', x1: 12, y1: 0, x2: 12, y2: -60.5, label: "60' 6\"", fs: 9, lx: 34, ly: -46 },
      { type: 'dim', x1: -6, y1: 0, x2: -6, y2: B2[1], label: "127' 3⅜\"", fs: 9, lx: -34, ly: -100 },
      { type: 'line', x1: 0, y1: -60.5, x2: 67, y2: -124.5, label: "95' GRASS ARC", fs: 8.5, lx: 92, ly: -140, tone: 'dim' },
      { type: 'line', x1: 0, y1: -400, x2: 0, y2: -400, label: '400 FT TO CENTER', fs: 10, ly: -386 },
      { type: 'line', x1: 0, y1: -300, x2: 0, y2: -300, label: '', fs: 1, pill: false }
    ],
    positions: []
  };
  const state = { areas: true, dims: true, positions: false };
  const render = () => {
    d.load({ static: true, view: FULL, marks: Object.keys(marks).flatMap(k => state[k] ? marks[k] : []), players: state.positions ? fielders({}, { numbers: true }) : [] });
  };
  [['areas', 'Fair & foul'], ['dims', 'Dimensions'], ['positions', 'Position numbers']].forEach(([k, label]) => {
    const b = h('button', 'chip chip-toggle', label); b.type = 'button'; b.setAttribute('aria-pressed', String(state[k]));
    b.onclick = () => { state[k] = !state[k]; b.setAttribute('aria-pressed', String(state[k])); render(); };
    bar.append(b);
  });
  render();
}

/* ------------------------------------------------ ABS strike zone */
function abs(host) {
  const body = host.querySelector('.viz-body');
  const grid = h('div', 'viz-grid'); body.append(grid);
  const left = h('div'); const right = h('div', 'tool'); grid.append(left, right);
  const svg = s('svg', { viewBox: '-44 -6 88 96', class: 'dg-svg', role: 'img', 'aria-label': 'Strike zone set by batter height; tap to throw a pitch' });
  svg.style.background = '#0b120e'; svg.style.borderRadius = '4px'; svg.style.cursor = 'crosshair';
  left.append(svg);
  // y axis: inches above ground, flipped (SVG y = 84 - inches)
  const Y = inch => 84 - inch;
  const ground = s('rect', { x: -44, y: Y(0), width: 88, height: 6, fill: '#3b2616' }, svg);
  s('polygon', { points: `-8.5,${Y(0) + .6} 8.5,${Y(0) + .6} 8.5,${Y(0) + 2.2} 0,${Y(0) + 4.2} -8.5,${Y(0) + 2.2}`, fill: '#f2f2f2' }, svg);
  for (let i = 0; i <= 84; i += 12) { s('line', { x1: -44, y1: Y(i), x2: -40, y2: Y(i), stroke: '#6b786f', 'stroke-width': .3 }, svg); const t = s('text', { x: -39, y: Y(i) + 1, 'font-size': 2.4, fill: '#9aa79e', 'font-family': 'Martian Mono, monospace' }, svg); t.textContent = `${i / 12}'`; }
  const figure = s('g', { opacity: .5 }, svg);
  const zone = s('rect', { fill: 'rgba(255,212,0,.10)', stroke: '#ffd400', 'stroke-width': .45 }, svg);
  const zoneGrid = s('g', { stroke: 'rgba(255,212,0,.35)', 'stroke-width': .2 }, svg);
  const top = s('text', { x: 10.5, 'font-size': 2.6, fill: '#ffd400', 'font-family': 'Martian Mono, monospace' }, svg);
  const bot = s('text', { x: 10.5, 'font-size': 2.6, fill: '#ffd400', 'font-family': 'Martian Mono, monospace' }, svg);
  const pitches = s('g', {}, svg);
  const heightIn = { v: 74 };
  const drawFigure = () => {
    const H = heightIn.v; figure.innerHTML = '';
    const g = s('g', { transform: 'translate(-22 0)' }, figure);
    const c = '#b9bec6';
    s('circle', { cx: 0, cy: Y(H - 4.6), r: 4.4, fill: c }, g);
    s('rect', { x: -6, y: Y(H - 9.5), width: 12, height: H * .36, rx: 4, fill: c }, g);
    s('rect', { x: -5, y: Y(H * .47), width: 4.2, height: H * .47, rx: 2, fill: c }, g);
    s('rect', { x: 1, y: Y(H * .47), width: 4.2, height: H * .47, rx: 2, fill: c }, g);
    s('line', { x1: -30, y1: Y(H), x2: 30, y2: Y(H), stroke: '#6b786f', 'stroke-width': .25, 'stroke-dasharray': '1 1' }, figure);
  };
  const call = h('div', 'verdict'); const readout = h('div', 'readout');
  const row = h('div', 'tool-row');
  row.innerHTML = `<label for="abs-h">Batter height <b></b></label><input id="abs-h" type="range" min="64" max="82" step="1" value="74">`;
  right.append(row, readout, call);
  const chall = h('div', 'chips'); right.append(chall);
  const hint = h('p', 'kicker', 'Tap anywhere on the zone to throw a pitch.'); right.append(hint);
  let challenges = 2, pending = null, pitchesThrown = 0;
  const btn = h('button', 'chip chip-toggle', 'Challenge the call'); btn.type = 'button'; btn.disabled = true; chall.append(btn);
  const reset = h('button', 'chip', 'New game (2 challenges)'); reset.type = 'button'; chall.append(reset);
  const zoneFor = H => ({ bot: .27 * H, top: .535 * H });
  const renderZone = () => {
    const H = heightIn.v, z = zoneFor(H);
    row.querySelector('b').textContent = `${Math.floor(H / 12)}′ ${H % 12}″`;
    zone.setAttribute('x', -8.5); zone.setAttribute('width', 17); zone.setAttribute('y', Y(z.top)); zone.setAttribute('height', z.top - z.bot);
    zoneGrid.innerHTML = '';
    for (let i = 1; i < 3; i++) { s('line', { x1: -8.5 + 17 * i / 3, y1: Y(z.top), x2: -8.5 + 17 * i / 3, y2: Y(z.bot) }, zoneGrid); const yy = z.bot + (z.top - z.bot) * i / 3; s('line', { x1: -8.5, y1: Y(yy), x2: 8.5, y2: Y(yy) }, zoneGrid); }
    top.setAttribute('y', Y(z.top) + .9); top.textContent = `TOP ${z.top.toFixed(1)}″ (53.5%)`;
    bot.setAttribute('y', Y(z.bot) + .9); bot.textContent = `BOTTOM ${z.bot.toFixed(1)}″ (27%)`;
    readout.innerHTML = `<div class="is-key"><small>Zone height</small><b>${(z.top - z.bot).toFixed(1)}″</b></div><div><small>Plate width</small><b>17″</b></div><div><small>Challenges left</small><b>${challenges}</b></div>`;
    drawFigure();
  };
  const isStrike = (x, yIn) => { const z = zoneFor(heightIn.v), r = 1.45; // any part of the ball touching the zone
    const dx = Math.max(Math.abs(x) - 8.5, 0), dy = yIn > z.top ? yIn - z.top : yIn < z.bot ? z.bot - yIn : 0; return Math.hypot(dx, dy) <= r; };
  const edgeDist = (x, yIn) => { const z = zoneFor(heightIn.v); const inside = Math.abs(x) <= 8.5 && yIn >= z.bot && yIn <= z.top; const d = inside ? Math.min(8.5 - Math.abs(x), z.top - yIn, yIn - z.bot) : Math.hypot(Math.max(Math.abs(x) - 8.5, 0), yIn > z.top ? yIn - z.top : yIn < z.bot ? z.bot - yIn : 0); return inside ? -d : d; };
  svg.addEventListener('click', e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const x = Math.max(-30, Math.min(30, p.x)), yIn = Math.max(4, Math.min(80, 84 - p.y));
    const truth = isStrike(x, yIn), dist = edgeDist(x, yIn) - 1.45;
    // an umpire is near-perfect away from the edges; within ~2 inches of the edge, calls can go either way
    const ump = Math.abs(dist) < 2.2 ? (Math.random() < .5) : truth;
    pitchesThrown++;
    pending = { truth, ump, x, yIn };
    s('circle', { cx: x, cy: 84 - yIn, r: 1.45, fill: truth ? '#ffd400' : '#fff', 'fill-opacity': .9, stroke: '#000', 'stroke-width': .25 }, pitches);
    call.className = 'verdict mid';
    call.innerHTML = `<strong>Umpire: ${ump ? 'Strike' : 'Ball'}</strong>${Math.abs(dist) < 2.2 ? 'That one was close to the edge. Think the umpire missed it? Challenge.' : 'Clear call. Challenging this would probably waste one.'}`;
    btn.disabled = challenges <= 0;
    if (pitches.children.length > 12) pitches.firstChild.remove();
  });
  btn.onclick = () => {
    if (!pending || challenges <= 0) return;
    const right = pending.truth !== pending.ump;
    if (!right) challenges--;
    call.className = 'verdict ' + (right ? 'ok' : 'bad');
    call.innerHTML = `<strong>ABS: ${pending.truth ? 'Strike' : 'Ball'} · ${right ? 'overturned' : 'call stands'}</strong>${right ? 'Challenge won: the team keeps it.' : 'Challenge lost.'} ${challenges} left.${challenges === 0 ? ' No more challenges this game (one is added for each extra inning).' : ''}`;
    pending = null; btn.disabled = true; renderZone();
  };
  reset.onclick = () => { challenges = 2; pitches.innerHTML = ''; pending = null; btn.disabled = true; call.className = 'verdict'; call.innerHTML = '<strong>Play ball</strong>Tap the zone to throw a pitch.'; renderZone(); };
  row.querySelector('input').addEventListener('input', e => { heightIn.v = +e.target.value; pitches.innerHTML = ''; renderZone(); });
  call.innerHTML = '<strong>Play ball</strong>Tap the zone to throw a pitch. Yellow = strike by ABS.';
  renderZone();
}

/* ------------------------------------------------ positions */
function positions(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'The nine defensive positions', caption: false, controls: false });
  sceneSwitcher(stage, d, {
    names: { chip: 'Positions', title: 'Where they stand', about: 'Tap a fielder. Infielders stand on the dirt; outfielders on the grass behind them. The pitcher and catcher form the “battery”.', static: true, view: FULL, players: fielders() },
    numbers: { chip: 'Scorekeeping numbers', title: 'Numbers 1–9', about: 'Scorers record plays with position numbers: “6-4-3” is a double play from shortstop to second base to first base; “F8” is a fly-out to center.', static: true, view: FULL, players: fielders({}, { numbers: true }) }
  }, { label: 'Positions view', noAutoplay: true });
}

/* ------------------------------------------------ the count */
function count(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid'); body.append(wrap);
  const gridEl = h('div'); const info = h('div', 'tool'); wrap.append(gridEl, info);
  const edge = { '3-0': 3, '2-0': 2, '3-1': 2, '1-0': 1, '2-1': 1, '3-2': 0, '0-0': 0, '1-1': 0, '2-2': -1, '0-1': -1, '1-2': -2, '0-2': -3 };
  const text = {
    '0-0': 'Neutral. Pitchers want strike one, the most important pitch in many at-bats. Some hitters ambush a first-pitch fastball.',
    '1-0': 'Hitter’s count. The pitcher now wants to avoid 2-0, so a strike is likely.',
    '2-0': 'Strong hitter’s count: expect a strike, often a fastball. Hitters look for one spot and swing hard.',
    '3-0': 'Best hitter’s count. Many hitters take (don’t swing) unless given the “green light”; the pitcher must throw a strike or walk him.',
    '0-1': 'Pitcher ahead. The hitter must now protect more of the zone.',
    '1-1': 'Even. The next pitch swings the at-bat either way, a big “leverage pitch”.',
    '2-1': 'Slight hitter edge. Pitchers still need strikes, hitters can still be selective.',
    '3-1': 'Hitter’s count. The pitcher can’t afford ball four; hitters hunt a pitch to drive.',
    '0-2': 'Pitcher’s best count. Time to “expand”: chase pitches just off the zone. Hitters shorten up and protect.',
    '1-2': 'Pitcher ahead. Breaking balls out of the zone are the classic putaway pitch.',
    '2-2': 'Battle count. The pitcher can waste one; the hitter must defend the plate.',
    '3-2': 'Full count: the next ball walks him, the next strike (unless fouled off) strikes him out. With two outs, runners go on the pitch.'
  };
  const t = h('table', ''); t.style.width = '100%'; t.style.tableLayout = 'fixed';
  t.innerHTML = `<thead><tr><th>Balls ↓ / Strikes →</th><th>0</th><th>1</th><th>2</th></tr></thead><tbody>${[0, 1, 2, 3].map(b => `<tr><th scope="row">${b}</th>${[0, 1, 2].map(k => { const c = `${b}-${k}`, e = edge[c]; const col = e > 0 ? `rgba(47,207,122,${.12 + e * .12})` : e < 0 ? `rgba(239,65,54,${.12 - e * .12})` : 'rgba(255,212,0,.12)'; return `<td><button type="button" class="count-cell" data-c="${c}" style="width:100%;min-height:62px;border:1px solid var(--line-2);border-radius:4px;background:${col};font:800 26px/1 var(--display);color:var(--chalk)">${c}</button></td>`; }).join('')}</tr>`).join('')}</tbody>`;
  gridEl.append(h('div', 'table-wrap')); gridEl.firstChild.append(t);
  const v = h('div', 'verdict'); info.append(v);
  info.append(h('div', 'legend', '<span><i style="background:#2fcf7a"></i>Hitter’s count</span><span><i style="background:#ffd400"></i>Even</span><span><i style="background:#ef4136"></i>Pitcher’s count</span>'));
  const pick = c => { t.querySelectorAll('.count-cell').forEach(b => b.style.outline = b.dataset.c === c ? '2px solid var(--yellow)' : 'none'); const e = edge[c]; v.className = 'verdict ' + (e > 0 ? 'ok' : e < 0 ? 'bad' : 'mid'); v.innerHTML = `<strong>${c.replace('-', '–')} · ${e > 0 ? 'hitter ahead' : e < 0 ? 'pitcher ahead' : 'even'}</strong>${text[c]}`; };
  t.addEventListener('click', e => { const b = e.target.closest('.count-cell'); if (b) pick(b.dataset.c); });
  pick('0-0');
}

/* ------------------------------------------------ pitch movement */
function pitchesViz(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid'); body.append(wrap);
  const left = h('div'); const right = h('div', 'tool'); wrap.append(left, right);
  // x: horizontal break in inches (+ = arm side for the chosen hand, drawn from the pitcher's view); y: induced vertical break
  const P = [
    { k: 'FF', name: 'Four-seam fastball', v: 94.5, hb: 7, ivb: 16, c: '#ef4136', d: 'The most-thrown pitch. Backspin makes it drop less than hitters expect: the “rising” fastball.' },
    { k: 'SI', name: 'Sinker', v: 93.5, hb: 15, ivb: 8, c: '#ff8a3d', d: 'Fastball with more arm-side run and less lift: aimed at ground balls.' },
    { k: 'FC', name: 'Cutter', v: 89, hb: -2.5, ivb: 9, c: '#c07bff', d: 'Fastball that breaks late toward the glove side, small, sharp and hard.' },
    { k: 'SL', name: 'Slider', v: 85.5, hb: -5, ivb: 1.5, c: '#ffd400', d: 'Breaking ball with glove-side and downward movement.' },
    { k: 'ST', name: 'Sweeper', v: 82, hb: -15, ivb: 0, c: '#e8e36a', d: 'Slider that moves mostly sideways, often 15+ inches across the plate.' },
    { k: 'CU', name: 'Curveball', v: 79.5, hb: -9, ivb: -10, c: '#3d8bff', d: 'Topspin makes it drop far more than a spinless ball: the “12-to-6” family.' },
    { k: 'CH', name: 'Changeup', v: 85.5, hb: 14, ivb: 6, c: '#2fcf7a', d: 'Thrown with fastball arm speed but ~8–10 mph slower, fading to the arm side.' },
    { k: 'FS', name: 'Splitter', v: 86, hb: 9.5, ivb: 2.5, c: '#5ed6c6', d: 'Low spin: looks like a fastball, then “tumbles” as it reaches the plate.' },
    { k: 'KN', name: 'Knuckleball', v: 76, hb: 0, ivb: -1, c: '#b9bec6', d: 'Almost no spin, so it flutters unpredictably. Nearly extinct in MLB.' }
  ];
  const svg = s('svg', { viewBox: '-27 -27 54 52', class: 'dg-svg', role: 'img', 'aria-label': 'Pitch movement chart' }); svg.style.background = '#0b120e'; svg.style.borderRadius = '4px';
  left.append(svg);
  const hand = { v: 'R' };
  const draw = focus => {
    svg.innerHTML = '';
    for (let i = -24; i <= 24; i += 6) { s('line', { x1: i, y1: -24, x2: i, y2: 22, stroke: i ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.3)', 'stroke-width': .15 }, svg); }
    for (let j = -18; j <= 24; j += 6) { const y = -j; s('line', { x1: -24, y1: y, x2: 24, y2: y, stroke: j ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.3)', 'stroke-width': .15 }, svg); const tt = s('text', { x: -26, y: y + .5, 'font-size': 1.2, fill: '#6b786f', 'font-family': 'Martian Mono, monospace' }, svg); tt.textContent = j; }
    const lab = (x, y, txt, anchor = 'middle') => { const tt = s('text', { x, y, 'font-size': 1.3, fill: '#9aa79e', 'text-anchor': anchor, 'font-family': 'Martian Mono, monospace', 'letter-spacing': .1 }, svg); tt.textContent = txt; };
    const sign = hand.v === 'R' ? 1 : -1;
    lab(23.5, 21.4, 'ARM SIDE →', 'end'); lab(-23.5, 21.4, '← GLOVE SIDE', 'start');
    if (sign < 0) { svg.lastChild.textContent = '← ARM SIDE'; svg.lastChild.previousSibling.textContent = 'GLOVE SIDE →'; }
    lab(1, -25.2, '▲ RISE (LESS DROP)', 'start'); lab(1, 24.2, '▼ MORE DROP', 'start');
    for (const p of P) {
      const x = p.hb * sign, y = -p.ivb, on = !focus || focus === p.k;
      const g = s('g', { style: `cursor:pointer;opacity:${on ? 1 : .28}`, tabindex: 0, role: 'button', 'aria-label': p.name }, svg);
      s('ellipse', { cx: x, cy: y, rx: 3.2, ry: 2.6, fill: p.c, 'fill-opacity': .16, stroke: p.c, 'stroke-width': .2 }, g);
      s('circle', { cx: x, cy: y, r: 1.25, fill: p.c, stroke: '#000', 'stroke-width': .15 }, g);
      const tt = s('text', { x, y: y - 1.8, 'font-size': 1.7, 'text-anchor': 'middle', fill: '#fff', 'font-family': 'Martian Mono, monospace', 'font-weight': 600 }, g); tt.textContent = p.k;
      g.addEventListener('click', () => pick(p.k)); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(p.k); } });
    }
  };
  const seg = h('div', 'segmented'); seg.innerHTML = '<button type="button" aria-pressed="true" data-h="R">Right-handed pitcher</button><button type="button" aria-pressed="false" data-h="L">Left-handed</button>';
  seg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; hand.v = b.dataset.h; seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(cur); });
  const card = h('div', 'verdict');
  const list = h('div', 'chips');
  P.forEach(p => { const b = h('button', 'chip', `${p.k} · ${p.name}`); b.type = 'button'; b.dataset.k = p.k; b.onclick = () => pick(p.k); list.append(b); });
  right.append(seg, card, list);
  let cur = null;
  const pick = k => { cur = k; const p = P.find(x => x.k === k); list.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === k))); card.className = 'verdict mid'; card.innerHTML = `<strong style="color:${p.c}">${p.name} · ~${p.v} mph</strong>${p.d}<br><span class="mono" style="font-size:12px;color:var(--muted)">≈ ${Math.abs(p.hb)}″ ${p.hb >= 0 ? 'arm-side' : 'glove-side'} · ${p.ivb >= 0 ? p.ivb + '″ rise' : Math.abs(p.ivb) + '″ extra drop'} vs. a spinless ball</span>`; draw(k); };
  draw(null); pick('FF');
}

/* ------------------------------------------------ batted ball */
function battedball(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid'); body.append(wrap);
  const left = h('div'); const right = h('div', 'tool'); wrap.append(left, right);
  const svg = s('svg', { viewBox: '-6 -70 80 78', class: 'dg-svg', role: 'img', 'aria-label': 'Launch angle fan' }); svg.style.background = '#0b120e'; svg.style.borderRadius = '4px'; left.append(svg);
  const ctrls = h('div', 'tool');
  ctrls.innerHTML = `<div class="tool-row"><label for="bb-ev">Exit velocity <b></b></label><input id="bb-ev" type="range" min="50" max="120" value="103"></div><div class="tool-row"><label for="bb-la">Launch angle <b></b></label><input id="bb-la" type="range" min="-20" max="70" value="28"></div>`;
  const readout = h('div', 'readout'); const verdict = h('div', 'verdict');
  right.append(ctrls, readout, verdict);
  const ev = ctrls.querySelector('#bb-ev'), la = ctrls.querySelector('#bb-la');
  const barrelRange = v => v < 98 ? null : [Math.max(8, 26 - (v - 98)), Math.min(50, 30 + (v - 98) * (20 / 18))];
  const type = a => a < 10 ? 'Ground ball' : a < 25 ? 'Line drive' : a <= 50 ? 'Fly ball' : 'Pop-up';
  const wedge = (a0, a1, r, fill, stroke) => { const p = (a, rr) => [rr * Math.cos(a * Math.PI / 180), -rr * Math.sin(a * Math.PI / 180)]; const [x0, y0] = p(a0, r), [x1, y1] = p(a1, r); return s('path', { d: `M0,0 L${x0},${y0} A${r},${r} 0 0 0 ${x1},${y1} Z`, fill, stroke, 'stroke-width': .25 }, svg); };
  const draw = () => {
    const v = +ev.value, a = +la.value;
    svg.innerHTML = '';
    s('rect', { x: -6, y: 0, width: 80, height: 8, fill: '#1f5130' }, svg);
    wedge(-20, 10, 66, 'rgba(255,255,255,.03)', 'rgba(255,255,255,.1)'); wedge(10, 25, 66, 'rgba(47,207,122,.08)', 'rgba(47,207,122,.3)'); wedge(25, 50, 66, 'rgba(61,139,255,.08)', 'rgba(61,139,255,.3)'); wedge(50, 90, 66, 'rgba(255,255,255,.03)', 'rgba(255,255,255,.1)');
    const lbl = (ang, txt, r = 56) => { const x = r * Math.cos(ang * Math.PI / 180), y = -r * Math.sin(ang * Math.PI / 180); const t = s('text', { x, y, 'font-size': 2.3, fill: '#c9d1c9', 'text-anchor': 'middle', 'font-family': 'Martian Mono, monospace', transform: `rotate(${-ang} ${x} ${y})` }, svg); t.textContent = txt; };
    lbl(3, 'GROUND BALL <10°', 50); lbl(17.5, 'LINE DRIVE 10–25°'); lbl(37.5, 'FLY BALL 25–50°'); lbl(68, 'POP-UP >50°', 40);
    const br = barrelRange(v);
    if (br) wedge(br[0], br[1], 36 + (v - 98) * 1.2, 'rgba(255,212,0,.22)', '#ffd400');
    // trajectory hint: a simple arc whose height and length scale with angle & speed (illustrative, not a distance model)
    const len = Math.max(6, Math.min(70, (v / 120) ** 2 * 72 * Math.sin(2 * Math.max(a, 3) * Math.PI / 180) * (a < 0 ? .5 : 1) + (a < 10 ? 20 : 0))), hgt = Math.max(0, Math.min(62, (v / 120) ** 2 * 58 * Math.sin(Math.max(a, 0) * Math.PI / 180) ** 2));
    s('path', { d: a <= 0 ? `M0,-1 L${len},-.4` : `M0,-1 Q${len / 2},${-hgt * 2} ${len},0`, fill: 'none', stroke: br && a >= br[0] && a <= br[1] ? '#ffd400' : '#fff', 'stroke-width': .7, 'stroke-dasharray': '2 1.2' }, svg);
    s('circle', { cx: 0, cy: -1, r: 1.3, fill: '#fff' }, svg);
    const barrel = br && a >= br[0] && a <= br[1], sweet = a >= 8 && a <= 32, hard = v >= 95;
    ctrls.querySelector('label[for=bb-ev] b').textContent = v + ' mph'; ctrls.querySelector('label[for=bb-la] b').textContent = a + '°';
    readout.innerHTML = `<div class="is-key"><small>Type</small><b style="font-size:22px">${type(a)}</b></div><div class="${hard ? 'is-good' : ''}"><small>Hard-hit (95+)</small><b>${hard ? 'YES' : 'NO'}</b></div><div class="${sweet ? 'is-good' : ''}"><small>Sweet spot 8–32°</small><b>${sweet ? 'YES' : 'NO'}</b></div><div class="${barrel ? 'is-key' : ''}"><small>Barrel</small><b>${barrel ? 'YES' : 'NO'}</b></div>`;
    verdict.className = 'verdict ' + (barrel ? 'ok' : hard && sweet ? 'mid' : 'bad');
    verdict.innerHTML = barrel ? '<strong>Barrel</strong>The best contact in baseball: barrels have produced a batting average above .500 and a slugging percentage above 1.500 since Statcast began tracking them.' : br ? `<strong>Not quite</strong>At ${v} mph, a barrel needs roughly ${Math.round(br[0])}–${Math.round(br[1])}°.` : '<strong>Needs more speed</strong>Barrels start at 98 mph exit velocity.';
  };
  ev.addEventListener('input', draw); la.addEventListener('input', draw); draw();
}

/* ------------------------------------------------ force play checker */
function force(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid'); body.append(wrap);
  const left = h('div'); const right = h('div', 'tool'); wrap.append(left, right);
  const d = new Diagram(left, { ...OPT, r: NARROW ? 10 : 8, label: 'Force play checker', caption: false, controls: false });
  const st = { on: { 1: true, 2: false, 3: false }, outs: 0 };
  const bases = { 1: B1, 2: B2, 3: B3, 4: [0, 0] };
  const toggles = h('div', 'chips'); const outs = h('div', 'segmented'); const out = h('div', 'verdict');
  [1, 2, 3].forEach(n => { const b = h('button', 'chip chip-toggle', `Runner on ${n === 1 ? 'first' : n === 2 ? 'second' : 'third'}`); b.type = 'button'; b.dataset.n = n; b.onclick = () => { st.on[n] = !st.on[n]; render(); }; toggles.append(b); });
  outs.innerHTML = [0, 1, 2].map(n => `<button type="button" data-o="${n}">${n} out${n === 1 ? '' : 's'}</button>`).join('');
  outs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { st.outs = +b.dataset.o; render(); } });
  right.append(toggles, outs, out);
  function render() {
    toggles.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(st.on[b.dataset.n])));
    outs.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.o === st.outs)));
    const forced = { 1: st.on[1], 2: st.on[1] && st.on[2], 3: st.on[1] && st.on[2] && st.on[3] };
    const players = [{ id: 'BR', label: 'BAT', team: 'o', x: -3, y: -1, hl: true, info: 'The batter becomes a runner the moment he hits the ball, which is what creates force plays.' }];
    const marks = [{ type: 'circle', x: B1[0], y: B1[1], r: 7, tone: 'hot' }];
    [1, 2, 3].forEach(n => { if (!st.on[n]) return; const [x, y] = bases[n]; players.push({ id: 'R' + n, label: 'R' + n, team: 'o', x, y: y + (n === 2 ? 4 : 0), hl: forced[n], info: forced[n] ? `Forced: must run to ${n === 3 ? 'home' : 'the next base'} on a ground ball.` : 'Not forced: can stay put; must be tagged if he runs.' }); if (forced[n]) { const nx = bases[n + 1]; marks.push({ type: 'circle', x: nx[0], y: nx[1], r: 7, tone: 'hot' }); } });
    d.load({ static: true, view: INF, players, marks });
    const fb = ['first'];
    if (forced[1]) fb.push('second'); if (forced[2]) fb.push('third'); if (forced[3]) fb.push('home');
    const dp = st.outs < 2 && st.on[1], ifr = st.outs < 2 && st.on[1] && st.on[2], sac = st.outs < 2 && st.on[3];
    out.className = 'verdict mid';
    out.innerHTML = `<strong>Force outs possible at ${fb.join(', ')}</strong>${fb.length > 1 ? 'Step on the base ahead of a forced runner (holding the ball) and he is out, no tag needed.' : 'Only the batter is forced.'}
      <ul class="bullets" style="margin-top:10px">${dp ? '<li><b>Double play is on:</b> a ground ball can get two outs.</li>' : ''}${ifr ? '<li><b>Infield fly rule is in effect:</b> a routine pop-up in the infield is an automatic out, so the defense can’t drop it on purpose for a double play.</li>' : ''}${sac ? '<li><b>Sacrifice fly possible:</b> the runner on third can tag up and score after a catch.</li>' : ''}${st.outs === 2 ? '<li><b>Two outs:</b> runners go on contact, since any out ends the inning.</li>' : ''}${[1, 2, 3].some(n => st.on[n] && !forced[n]) ? '<li>Runners without a force must be <b>tagged</b> if they try to advance.</li>' : ''}</ul>`;
  }
  render();
}

/* ------------------------------------------------ alignments */
function alignments(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Defensive alignments', caption: false, controls: false });
  const line2B = [{ type: 'line', x1: 0, y1: -127.3, x2: 0, y2: -180, tone: 'dim', dash: '4 3' }];
  const sc = (chip, title, about, over, extra = {}) => ({ chip, title, about, static: true, view: FULL, players: fielders(over).map(p => ({ ...p, hl: Object.keys(over).includes(p.id) })), marks: line2B, ...extra });
  sceneSwitcher(stage, d, {
    std: sc('Standard', 'Standard alignment', 'The default: two infielders on each side of second base, outfielders straight away. Every other alignment is an adjustment from here.', {}),
    dp: sc('Double-play depth', 'Double-play depth', 'With a runner on first and fewer than two outs, the middle infielders move a few steps closer to second base so they can turn two.', { '2B': polar(128, 12), SS: polar(128, -12) }),
    infield: sc('Infield in', 'Infield in', 'Runner on third, fewer than two outs, run matters: infielders play on the grass to throw the runner out at home. Grounders that would be outs now get through.', { '1B': polar(86, 41), '2B': polar(100, 17), SS: polar(100, -17), '3B': polar(86, -41) }),
    bunt: sc('Corners in', 'Corners in (bunt defense)', 'First and third basemen charge toward the plate to field a bunt; the middle infielders rotate to cover the bases.', { '1B': polar(64, 38), '3B': polar(64, -38), '2B': polar(96, 44) }),
    nodoubles: sc('No-doubles', 'No-doubles defense', 'Late with a small lead: outfielders play deep and the corner outfielders guard the lines, giving up singles to prevent extra-base hits.', { LF: polar(318, -35), CF: polar(350, 0), RF: polar(318, 35), '1B': polar(100, 43), '3B': polar(104, -43) }),
    illegal: sc('Old “shift” (illegal)', 'The overloaded shift, illegal since 2023', 'Three infielders on the right side for a pull-hitting lefty. Since 2023 this is illegal: two infielders must be on each side of second base, all four on the dirt. The penalty is an automatic ball (or the offense takes the play result).', { '3B': polar(145, -10), SS: polar(150, 8), '2B': polar(178, 26) }, { marks: [...line2B, { type: 'path', d: `M0,-127 L${polar(260, 5)} L${polar(260, 45)} L${B1} Z`, tone: 'hot', under: true }] })
  }, { label: 'Alignment', noAutoplay: true });
}

/* ------------------------------------------------ relay */
function relay(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, autoplay: true, label: 'Cutoff and relay on a single to right field' });
  const f = fielders();
  const pos = id => f.find(p => p.id === id);
  const players = [...f.map(p => ({ ...p, ghost: !['RF', 'SS', '3B', 'P', '2B', '1B', 'CF'].includes(p.id) })),
    { id: 'BR', label: 'B', team: 'o', x: -3, y: -1, info: 'Batter-runner.' }, { id: 'R1', label: 'R', team: 'o', x: B1[0] - 6, y: B1[1] - 3, info: 'Runner from first, trying to go first-to-third.' }];
  const hitTo = [118, -232];
  d.load({
    view: FULL, players, ball: { x: 0, y: -1, r: 4 },
    paths: [
      { kind: 'hit', fromPt: [0, -1], toPt: hitTo, t: .2, d: 1.1, bend: .15 },
      { who: 'RF', kind: 'move', pts: [pos('RF').at || [pos('RF').x, pos('RF').y], [120, -236]], t: .3, d: 1.1 },
      { who: 'BR', kind: 'run', pts: [[-3, -1], [40, -38], [70, -64], [74, -76]], curve: true, t: .3, d: 1.6 },
      { who: 'R1', kind: 'run', pts: [[B1[0] - 6, B1[1] - 3], [30, -110], [0, -130], [-40, -104], [-64, -66]], curve: true, t: .15, d: 3.6, ease: 'lin' },
      { who: 'SS', kind: 'move', pts: [[pos('SS').x, pos('SS').y], [-8, -126]], t: .4, d: 1.3 },
      { who: '3B', kind: 'move', pts: [[pos('3B').x, pos('3B').y], [-60, -68]], t: .4, d: 1 },
      { who: '2B', kind: 'move', pts: [[pos('2B').x, pos('2B').y], [6, -125]], t: .4, d: 1.1 },
      { who: '1B', kind: 'move', pts: [[pos('1B').x, pos('1B').y], [60, -60]], t: .4, d: 1 },
      { who: 'P', kind: 'move', pts: [[0, -59.6], [-50, -40], [-92, -44]], curve: true, t: .5, d: 1.8 },
      { who: 'CF', kind: 'move', pts: [[pos('CF').x, pos('CF').y], [90, -270]], t: .4, d: 1.4 },
      { kind: 'toss', fromPt: [120, -236], toPt: [-8, -126], t: 1.55, d: .9, bend: .05 },
      { kind: 'toss', fromPt: [-8, -126], toPt: [-60, -68], t: 2.55, d: .55, bend: .05 }
    ],
    captions: [{ t: 0, text: 'Runner on first. Line drive single into right field.' }, { t: .7, text: 'The shortstop races to line up between the right fielder and third base: the cutoff. The pitcher runs to back up third.' }, { t: 1.6, text: 'The right fielder hits the cutoff man chest-high…' }, { t: 2.55, text: '…and the relay goes to third, where the runner arrives just in time: a bang-bang play.' }]
  });
}

/* ------------------------------------------------ run expectancy (base-out states) */
function baseout(host) {
  const body = host.querySelector('.viz-body');
  // FanGraphs RE24 table, MLB 2010–2015
  const RE = { '___': [.481, .254, .098], '1__': [.859, .509, .224], '_2_': [1.100, .664, .319], '__3': [1.353, .950, .353], '12_': [1.437, .884, .429], '1_3': [1.798, 1.140, .471], '_23': [1.920, 1.352, .570], '123': [2.282, 1.520, .736] };
  const names = { '___': 'Bases empty', '1__': 'Runner on 1st', '_2_': 'Runner on 2nd', '__3': 'Runner on 3rd', '12_': '1st & 2nd', '1_3': '1st & 3rd', '_23': '2nd & 3rd', '123': 'Bases loaded' };
  const diamond = k => `<svg viewBox="-10 -10 20 20" width="26" height="26" aria-hidden="true">${[['1', 6, 0], ['2', 0, -6], ['3', -6, 0]].map(([n, x, y]) => `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" transform="rotate(45 ${x} ${y})" fill="${k.includes(n) ? '#ffd400' : 'none'}" stroke="#9aa79e" stroke-width="1"/>`).join('')}</svg>`;
  const max = 2.282;
  const table = h('div', 'table-wrap');
  table.innerHTML = `<table><thead><tr><th>Runners</th><th>0 outs</th><th>1 out</th><th>2 outs</th></tr></thead><tbody>${Object.keys(RE).map(k => `<tr><td style="display:flex;align-items:center;gap:10px">${diamond(k)}${names[k]}</td>${RE[k].map((v, o) => `<td><button type="button" data-k="${k}" data-o="${o}" class="re-cell" style="width:100%;border:0;border-radius:3px;padding:8px 6px;font:600 14px var(--mono);color:#fff;background:rgba(255,212,0,${(.08 + v / max * .5).toFixed(3)})">${v.toFixed(3)}</button></td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const tool = h('div', 'tool'); tool.style.marginTop = '14px';
  const v = h('div', 'verdict');
  const tests = h('div', 'chips');
  tool.append(tests, v);
  body.append(table, tool);
  const explain = (k, o) => { v.className = 'verdict mid'; v.innerHTML = `<strong>${names[k]}, ${o} out${o === 1 ? '' : 's'}: ${RE[k][o].toFixed(3)} runs</strong>On average, this is how many runs scored from here to the end of the inning.`; table.querySelectorAll('.re-cell').forEach(b => b.style.outline = b.dataset.k === k && +b.dataset.o === o ? '2px solid #fff' : 'none'); };
  const compare = (label, a, b, why) => { const [ka, oa] = a, [kb, ob] = b; const dv = RE[kb][ob] - RE[ka][oa]; v.className = 'verdict ' + (dv >= 0 ? 'ok' : 'bad'); v.innerHTML = `<strong>${label}: ${dv >= 0 ? '+' : ''}${dv.toFixed(3)} runs</strong>${names[ka]}, ${oa} out (${RE[ka][oa].toFixed(3)}) → ${names[kb]}, ${ob} out${ob === 1 ? '' : 's'} (${RE[kb][ob].toFixed(3)}). ${why}`; table.querySelectorAll('.re-cell').forEach(btn => btn.style.outline = (btn.dataset.k === ka && +btn.dataset.o === oa) || (btn.dataset.k === kb && +btn.dataset.o === ob) ? '2px solid #fff' : 'none'); };
  [['Sacrifice bunt (runner on 1st, 0 out)', ['1__', 0], ['_2_', 1], 'Trading an out for a base usually costs runs, one reason teams bunt far less than they used to (it can still make sense late when one run matters most).'],
   ['Successful steal of 2nd (0 out)', ['1__', 0], ['_2_', 0], 'A stolen base adds value…'],
   ['Caught stealing (0 out)', ['1__', 0], ['___', 1], '…but getting caught costs far more. That is why steals need a high success rate to be worth it.'],
   ['Intentional walk (2nd & 3rd, 1 out)', ['_23', 1], ['123', 1], 'It sets up a force at every base and a possible double play, but it also adds a runner.']
  ].forEach(([label, a, b, why]) => { const btn = h('button', 'chip', label); btn.type = 'button'; btn.onclick = () => { tests.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === btn))); compare(label, a, b, why); }; tests.append(btn); });
  table.addEventListener('click', e => { const b = e.target.closest('.re-cell'); if (b) explain(b.dataset.k, +b.dataset.o); });
  explain('___', 0);
}

/* ------------------------------------------------ slash-line calculator */
function statcalc(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid'); body.append(wrap);
  const f = [['ab', 'At-bats', 550], ['h', 'Hits', 160], ['d', 'Doubles', 32], ['t', 'Triples', 3], ['hr', 'Home runs', 25], ['bb', 'Walks', 60], ['hbp', 'Hit by pitch', 5], ['sf', 'Sacrifice flies', 5]];
  const form = h('div', 'tool'); form.style.gridTemplateColumns = 'repeat(2, minmax(0,1fr))'; form.style.display = 'grid';
  form.innerHTML = f.map(([k, l, v]) => `<div class="tool-row"><label for="sc-${k}">${l}</label><input id="sc-${k}" type="number" min="0" value="${v}" style="height:42px;border-radius:4px;border:1px solid var(--line-2);background:var(--panel);color:var(--chalk);padding:0 10px;font:600 15px var(--mono)"></div>`).join('');
  const right = h('div', 'tool'); const ro = h('div', 'readout'); const expl = h('p', 'note'); right.append(ro, expl);
  wrap.append(form, right);
  const val = k => Math.max(0, +form.querySelector('#sc-' + k).value || 0);
  const fmt = x => isFinite(x) ? x.toFixed(3).replace(/^0/, '') : '–';
  const run = () => {
    const ab = val('ab'), H = val('h'), d2 = val('d'), t3 = val('t'), hr = val('hr'), bb = val('bb'), hbp = val('hbp'), sf = val('sf');
    const singles = Math.max(0, H - d2 - t3 - hr), tb = singles + 2 * d2 + 3 * t3 + 4 * hr;
    const avg = H / ab, obp = (H + bb + hbp) / (ab + bb + hbp + sf), slg = tb / ab;
    ro.innerHTML = `<div class="is-key"><small>AVG</small><b>${fmt(avg)}</b></div><div><small>OBP</small><b>${fmt(obp)}</b></div><div><small>SLG</small><b>${fmt(slg)}</b></div><div class="is-good"><small>OPS</small><b>${fmt(obp + slg)}</b></div>`;
    expl.innerHTML = `<strong>How it adds up:</strong> ${singles} singles + ${d2} doubles + ${t3} triples + ${hr} homers = <b>${tb} total bases</b>. AVG = hits ÷ at-bats · OBP adds walks and HBP · SLG = total bases ÷ at-bats · OPS = OBP + SLG. An OPS above .800 is very good; above .900 is star level.`;
  };
  form.addEventListener('input', run); run();
}

const MODS = { anatomy, abs, positions, count, pitches: pitchesViz, battedball, force, alignments, relay, baseout, statcalc };
export function mount(host, name) { const fn = MODS[name]; if (!fn) throw new Error('No baseball visual: ' + name); return fn(host); }
