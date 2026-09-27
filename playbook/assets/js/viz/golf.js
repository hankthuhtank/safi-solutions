/* Playbook: golf visuals. The hole map uses yards with the tee at the bottom (y ≈ 0) and the green at the top. */
import { Diagram, sceneSwitcher } from '../diagram.js';
import { GOLF } from '../surfaces.js';

const NS = 'http://www.w3.org/2000/svg';
const h = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const s = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.append(n); return n; };
const NARROW = matchMedia('(max-width: 640px)').matches;
const OPT = { sport: 'golf', orient: 'h', r: NARROW ? 4.5 : 3.2 };

/* ------------------------------------------------ the hole & five areas */
function hole(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid viz-grid-even'); body.append(wrap);
  const left = h('div'); const right = h('div', 'tool'); wrap.append(left, right);
  const d = new Diagram(left, { ...OPT, label: 'A to-scale par 4 with the five areas of the course', caption: false, controls: false });
  const [gx, gy] = GOLF.greenC;
  const markers = [[200, '#2f66d0'], [150, '#f5f5f5'], [100, '#d8342b']];
  d.load({ static: true, view: [-92, -468, 184, 480], marks: [
    { type: 'line', x1: 0, y1: -8, x2: gx, y2: gy, tone: 'dim', dash: '4 4', label: '418 YD · PAR 4', fs: 7, lx: -34, ly: -120 },
    { type: 'line', x1: 82, y1: -30, x2: 82, y2: -30, label: 'OB', fs: 6, lx: 74, ly: -40, tone: 'dim' }
  ] });
  const areas = {
    general: ['General area', 'Everything that isn’t one of the other four areas: fairway, rough, trees. Most of your shots are played from here.', ['general', 'trees', 'path', 'markers']],
    teeing: ['Teeing area', 'Where each hole starts: a rectangle two club-lengths deep behind the line between the tee markers. You may tee the ball up only here.', ['teeing']],
    bunkers: ['Bunkers', 'Prepared sand areas. You may not touch the sand with your club before your stroke (with some exceptions), and relief options are limited.', ['bunkers']],
    penalty: ['Penalty areas', 'Water and similar areas marked by **red** or **yellow** stakes or lines. Play it as it lies, or take relief for one stroke.', ['penalty']],
    green: ['Putting green', 'Specially prepared for putting. You may mark, lift and clean your ball and repair most damage, including spike marks.', ['green']],
    ob: ['Out of bounds', 'Beyond the white stakes. A ball out of bounds costs one penalty stroke and must be replayed from where it was last hit.', ['ob']]
  };
  const chips = h('div', 'chips'); const v = h('div', 'verdict'); const legend = h('div', 'legend', markers.map(([yd, c]) => `<span><i class="sw" style="background:${c}"></i>${yd} yd to the green</span>`).join(''));
  right.append(chips, v, legend, h('p', 'kicker', 'Yardage markers show the distance to the center of the green: blue 200, white 150, red 100.'));
  const all = [...new Set(Object.values(areas).flatMap(a => a[2]))];
  const pick = k => {
    chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === k)));
    const keep = k ? areas[k][2] : all;
    d.svg.querySelectorAll('[data-layer]').forEach(n => n.style.opacity = keep.includes(n.dataset.layer) || !k ? '' : '.18');
    const [t, text] = k ? areas[k] : ['The five areas of the course', 'Rule 2.2 divides every course into the **general area**, **teeing area**, **bunkers**, **penalty areas** and **putting green**, plus **out of bounds** beyond the white stakes. Tap one.'];
    v.className = 'verdict mid'; v.innerHTML = `<strong>${t}</strong>${text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}`;
  };
  const b0 = h('button', 'chip', 'All'); b0.type = 'button'; b0.dataset.k = ''; b0.onclick = () => pick(null); chips.append(b0);
  Object.entries(areas).forEach(([k, a]) => { const b = h('button', 'chip', a[0]); b.type = 'button'; b.dataset.k = k; b.onclick = () => pick(k); chips.append(b); });
  pick(null);
}

/* ------------------------------------------------ score names */
function scoring(host) {
  const body = host.querySelector('.viz-body');
  const tool = h('div', 'tool'); body.append(tool);
  const pars = h('div', 'segmented'); pars.innerHTML = [3, 4, 5].map(p => `<button type="button" data-p="${p}">Par ${p}</button>`).join('');
  const strokes = h('div', 'chips');
  const card = h('div'); card.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:6px';
  const v = h('div', 'verdict');
  tool.append(pars, strokes, v, card);
  let par = 4, st = 3;
  const NAMES = { '-4': 'Condor', '-3': 'Albatross', '-2': 'Eagle', '-1': 'Birdie', '0': 'Par', '1': 'Bogey', '2': 'Double bogey', '3': 'Triple bogey', '4': 'Quadruple bogey' };
  const render = () => {
    pars.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.p === par)));
    strokes.innerHTML = '';
    for (let n = 1; n <= par + 4; n++) { const b = h('button', 'chip', `${n} stroke${n > 1 ? 's' : ''}`); b.type = 'button'; b.setAttribute('aria-pressed', String(n === st)); b.onclick = () => { st = n; render(); }; strokes.append(b); }
    const diff = st - par, name = st === 1 ? `Hole-in-one${diff <= -2 ? ` (${NAMES[diff]})` : ''}` : NAMES[diff] || `+${diff}`;
    v.className = 'verdict ' + (diff < 0 ? 'ok' : diff === 0 ? 'mid' : 'bad');
    v.innerHTML = `<strong>${name} · ${diff > 0 ? '+' : ''}${diff === 0 ? 'E' : diff}</strong>${st} strokes on a par ${par}. ${diff < 0 ? 'Under par: every stroke below par is a stroke gained on the course.' : diff === 0 ? 'Even par: what a skilled player is expected to score.' : 'Over par. On a scorecard, bogeys are often shown with a square and birdies with a circle.'}`;
    card.innerHTML = [-3, -2, -1, 0, 1, 2].map(k => `<div style="padding:10px;border:1px solid ${k === diff ? 'var(--yellow)' : 'var(--line)'};border-radius:4px;background:var(--panel);text-align:center"><b style="font:800 22px/1 var(--display);color:${k < 0 ? 'var(--green)' : k === 0 ? 'var(--chalk)' : 'var(--orange)'}">${k > 0 ? '+' : ''}${k === 0 ? 'E' : k}</b><div style="font:600 10px var(--mono);color:var(--muted);letter-spacing:.06em;margin-top:6px;text-transform:uppercase">${NAMES[k]}</div></div>`).join('');
  };
  pars.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { par = +b.dataset.p; st = Math.min(st, par + 4); render(); } });
  render();
}

/* ------------------------------------------------ the bag */
function bag(host) {
  const body = host.querySelector('.viz-body');
  const tool = h('div', 'tool'); body.append(tool);
  tool.innerHTML = `<div class="tool-row"><label for="g7">Your 7-iron carry <b></b></label><input id="g7" type="range" min="100" max="190" value="150"></div>`;
  const list = h('div'); list.style.cssText = 'display:grid;gap:6px';
  tool.append(list, h('p', 'kicker', 'Ratios from TrackMan PGA Tour averages (driver ≈ 1.6× a 7-iron). Gap, sand and lob wedges are estimates; full-swing wedge carries vary most between players.'));
  // [club, loft, ratio to 7-iron carry, estimated?]
  const C = [['Driver', '10.5°', 1.60], ['3-wood', '15°', 1.41], ['5-wood', '18°', 1.34], ['Hybrid', '21°', 1.31], ['4-iron', '22°', 1.18], ['5-iron', '25°', 1.13], ['6-iron', '28°', 1.06], ['7-iron', '32°', 1.00], ['8-iron', '36°', .93], ['9-iron', '40°', .86], ['Pitching wedge', '45°', .79], ['Gap wedge', '50°', .72, 1], ['Sand wedge', '56°', .63, 1], ['Lob wedge', '60°', .55, 1]];
  const inp = tool.querySelector('#g7');
  const run = () => {
    const c7 = +inp.value; tool.querySelector('label b').textContent = c7 + ' yd';
    const max = c7 * 1.6;
    list.innerHTML = C.map(([n, loft, r, est], i) => { const yd = Math.round(c7 * r), gap = i ? Math.round(c7 * C[i - 1][2]) - yd : null; return `<div style="display:grid;grid-template-columns:118px 46px 1fr 70px;gap:10px;align-items:center;font-size:13.5px"><b style="color:var(--chalk)">${n}</b><span class="mono" style="color:var(--muted);font-size:11px">${loft}</span><span style="height:14px;border-radius:2px;background:linear-gradient(90deg,var(--sport-2),var(--sport));width:${(yd / max * 100).toFixed(1)}%;opacity:${est ? .6 : 1}"></span><span class="num" style="text-align:right">${yd}${est ? '*' : ''} yd</span></div>`; }).join('') + '<div class="kicker" style="margin-top:6px">+ PUTTER = 14 CLUBS, THE LEGAL MAXIMUM · * ESTIMATED</div>';
  };
  inp.addEventListener('input', run); run();
}

/* ------------------------------------------------ ball flight laws */
function flight(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid'); body.append(wrap);
  const left = h('div'); const right = h('div', 'tool'); wrap.append(left, right);
  const svg = s('svg', { viewBox: '-60 -262 120 272', class: 'dg-svg', role: 'img', 'aria-label': 'Top-down ball flight' }); svg.style.background = '#16341c'; svg.style.borderRadius = '4px';
  left.append(svg);
  right.innerHTML = `<div class="tool-row"><label for="gf-face">Clubface at impact <b></b></label><input id="gf-face" type="range" min="-8" max="8" step=".5" value="1"></div><div class="tool-row"><label for="gf-path">Swing path <b></b></label><input id="gf-path" type="range" min="-8" max="8" step=".5" value="3"></div><div class="segmented" id="gf-club"><button type="button" data-c="iron" aria-pressed="true">7-iron</button><button type="button" data-c="driver" aria-pressed="false">Driver</button></div>`;
  const ro = h('div', 'readout'); const v = h('div', 'verdict'); right.append(ro, v);
  const face = right.querySelector('#gf-face'), path = right.querySelector('#gf-path'); let club = 'iron';
  right.querySelector('#gf-club').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; club = b.dataset.c; right.querySelectorAll('#gf-club button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); });
  const presets = h('div', 'chips'); right.append(presets);
  [['Straight', 0, 0], ['Draw', -1, 2.5], ['Fade', 1, -2.5], ['Slice', 3, -5], ['Hook', -3, 5], ['Push', 3.5, 3.5], ['Pull', -3.5, -3.5]].forEach(([n, f, p]) => { const b = h('button', 'chip', n); b.type = 'button'; b.onclick = () => { face.value = f; path.value = p; draw(); }; presets.append(b); });
  const deg = x => `${Math.abs(x)}° ${x > 0 ? 'right/open' : x < 0 ? 'left/closed' : 'square'}`;
  function draw() {
    const F = +face.value, P = +path.value, carry = club === 'driver' ? 250 : 165, wf = club === 'driver' ? .85 : .75;
    right.querySelector('label[for=gf-face] b').textContent = deg(F).replace('right/open', 'open').replace('left/closed', 'closed');
    right.querySelector('label[for=gf-path] b').textContent = `${Math.abs(P)}° ${P > 0 ? 'in-to-out' : P < 0 ? 'out-to-in' : 'neutral'}`;
    const start = wf * F + (1 - wf) * P, ftp = F - P;
    const k = ftp * (club === 'driver' ? .0009 : .0011);
    const pts = []; for (let i = 0; i <= 60; i++) { const y = carry * i / 60; const x = y * Math.tan(start * Math.PI / 180) + k * y * y; pts.push([x, -y]); }
    const endX = pts[pts.length - 1][0];
    svg.innerHTML = '';
    s('rect', { x: -22, y: -262, width: 44, height: 262, fill: '#2f6a2b', opacity: .9 }, svg); // fairway
    for (let y = 0; y <= 250; y += 50) { s('line', { x1: -60, y1: -y, x2: 60, y2: -y, stroke: 'rgba(255,255,255,.08)', 'stroke-width': .5 }, svg); const t = s('text', { x: -58, y: -y - 2, 'font-size': 5, fill: '#9aa79e', 'font-family': 'Martian Mono, monospace' }, svg); t.textContent = y + ' yd'; }
    s('line', { x1: 0, y1: 0, x2: 0, y2: -262, stroke: '#fff', 'stroke-width': .6, 'stroke-dasharray': '3 3', opacity: .7 }, svg);
    const tt = s('text', { x: 1.5, y: -255, 'font-size': 5, fill: '#fff', 'font-family': 'Martian Mono, monospace' }, svg); tt.textContent = 'TARGET LINE';
    const fx = Math.sin(F * Math.PI / 180) * 20, fy = -Math.cos(F * Math.PI / 180) * 20;
    s('line', { x1: 0, y1: 0, x2: fx, y2: fy, stroke: '#ffd400', 'stroke-width': 1.2 }, svg);
    const px = Math.sin(P * Math.PI / 180) * 20, py = -Math.cos(P * Math.PI / 180) * 20;
    s('line', { x1: -px * .8, y1: -py * .8, x2: px, y2: py, stroke: '#3d8bff', 'stroke-width': 1.2, 'stroke-dasharray': '2 1.4' }, svg);
    s('path', { d: 'M' + pts.map(p => p.map(q => q.toFixed(2)).join(',')).join(' L'), fill: 'none', stroke: '#ff3b30', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, svg);
    s('circle', { cx: endX, cy: -carry, r: 2.4, fill: '#fff', stroke: '#000', 'stroke-width': .4 }, svg);
    s('circle', { cx: 0, cy: 0, r: 2, fill: '#fff' }, svg);
    const legend = s('g', { transform: 'translate(24 -12)', 'font-size': 4.6, 'font-family': 'Martian Mono, monospace' }, svg);
    s('line', { x1: 0, y1: 0, x2: 8, y2: 0, stroke: '#ffd400', 'stroke-width': 1.2 }, legend); const l1 = s('text', { x: 10, y: 1.6, fill: '#ffd400' }, legend); l1.textContent = 'FACE';
    s('line', { x1: 0, y1: 7, x2: 8, y2: 7, stroke: '#3d8bff', 'stroke-width': 1.2, 'stroke-dasharray': '2 1.4' }, legend); const l2 = s('text', { x: 10, y: 8.6, fill: '#3d8bff' }, legend); l2.textContent = 'PATH';
    const sd = start < -1.2 ? 'L' : start > 1.2 ? 'R' : 'S', cv = ftp < -1.2 ? 'L' : ftp > 1.2 ? 'R' : 'S', big = Math.abs(ftp) > 5;
    const NAME = { SS: 'Straight', SR: big ? 'Slice' : 'Fade', SL: big ? 'Hook' : 'Draw', RS: 'Push', RR: 'Push-slice', RL: 'Push-draw', LS: 'Pull', LR: 'Pull-fade', LL: 'Pull-hook' };
    const name = NAME[sd + cv];
    ro.innerHTML = `<div class="is-key"><small>Shot</small><b>${name}</b></div><div><small>Start direction</small><b>${start.toFixed(1)}°</b></div><div><small>Face-to-path</small><b>${ftp > 0 ? '+' : ''}${ftp.toFixed(1)}°</b></div><div><small>Finish</small><b>${Math.abs(endX).toFixed(0)} yd ${endX > .5 ? 'R' : endX < -.5 ? 'L' : ''}</b></div>`;
    v.className = 'verdict ' + (Math.abs(endX) < 12 ? 'ok' : Math.abs(endX) < 25 ? 'mid' : 'bad');
    v.innerHTML = `<strong>${name}</strong>The ball starts ${sd === 'S' ? 'on line' : sd === 'R' ? 'right' : 'left'} because the face points ${F > 0 ? 'right' : F < 0 ? 'left' : 'at the target'}, and curves ${cv === 'S' ? 'very little' : cv === 'R' ? 'right' : 'left'} because the face is ${ftp > 0 ? 'open' : ftp < 0 ? 'closed' : 'square'} to the path. ${Math.abs(ftp) > 5 ? 'That much face-to-path difference produces a big curve.' : ''}`;
  }
  face.addEventListener('input', draw); path.addEventListener('input', draw); draw();
}

/* ------------------------------------------------ putting break simulator */
function putt(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid'); body.append(wrap);
  const left = h('div'); const right = h('div', 'tool'); wrap.append(left, right);
  const svg = s('svg', { viewBox: '-22 -46 44 52', class: 'dg-svg', role: 'img', 'aria-label': 'Putting green simulation' }); svg.style.background = '#1f4d25'; svg.style.borderRadius = '4px'; left.append(svg);
  right.innerHTML = `<div class="tool-row"><label for="pt-d">Putt length <b></b></label><input id="pt-d" type="range" min="4" max="40" value="20"></div>
  <div class="tool-row"><label for="pt-s">Slope <b></b></label><input id="pt-s" type="range" min="0" max="4" step=".25" value="2"></div>
  <div class="tool-row"><label for="pt-a">Slope falls toward <b></b></label><input id="pt-a" type="range" min="0" max="345" step="15" value="0"></div>
  <div class="tool-row"><label for="pt-st">Green speed (Stimpmeter) <b></b></label><input id="pt-st" type="range" min="7" max="14" step=".5" value="11"></div>`;
  const ro = h('div', 'readout'); const v = h('div', 'verdict'); right.append(ro, v, h('p', 'kicker', 'Aims for the ball to finish about 17 inches past the hole if it missed, the pace most putting research recommends.'));
  const G = 32.17, HOLE_R = 4.25 / 24;
  const sim = (D, slope, fall, stimp, ang, v0, record) => {
    // math coords (feet): ball at (0,-D), hole at (0,0); fall = downhill direction (radians, 0 = +x)
    const af = 36 / (2 * stimp), ag = (5 / 7) * G * slope / 100; // Stimpmeter release ≈ 6 ft/s; rolling sphere feels 5/7 of the slope force
    const gx = Math.cos(fall) * ag, gy = Math.sin(fall) * ag;
    let x = 0, y = -D, vx = Math.sin(ang) * v0, vy = Math.cos(ang) * v0, dt = .005, best = 1e9, bestI = 0, i = 0, pts = record ? [[x, y]] : null;
    for (; i < 16000; i++) {
      const sp = Math.hypot(vx, vy);
      if (sp < .03) break;
      vx += (gx - af * vx / sp) * dt; vy += (gy - af * vy / sp) * dt; x += vx * dt; y += vy * dt;
      const dh = Math.hypot(x, y); if (dh < best) { best = dh; bestI = i; }
      if (record && i % 10 === 0) pts.push([x, y]);
    }
    if (record) pts.push([x, y]);
    return { x, y, best, short: bestI >= i - 3, pts };
  };
  const solve = (D, slope, fall, stimp) => {
    const aimFor = v0 => { let lo = -.9, hi = .9, bA = 0; for (let it = 0; it < 4; it++) { let bD = 1e9; const n = 18; for (let k = 0; k <= n; k++) { const a = lo + (hi - lo) * k / n; const r = sim(D, slope, fall, stimp, a, v0); if (r.best < bD) { bD = r.best; bA = a; } } const w = (hi - lo) / n; lo = bA - w; hi = bA + w; } return bA; };
    const past = v0 => { const a = aimFor(v0), r = sim(D, slope, fall, stimp, a, v0); return { a, p: r.short ? -r.best : Math.hypot(r.x, r.y) }; };
    let lo = .5, hi = 40;
    for (let it = 0; it < 16; it++) { const mid = (lo + hi) / 2; if (past(mid).p < 1.42) lo = mid; else hi = mid; }
    const v0 = (lo + hi) / 2, ang = aimFor(v0);
    return { v0, ang, run: sim(D, slope, fall, stimp, ang, v0, true) };
  };
  const inputs = ['pt-d', 'pt-s', 'pt-a', 'pt-st'].map(id => right.querySelector('#' + id));
  const dirName = a => { const n = ((a % 360) + 360) % 360; return n === 0 ? '→ right (left-to-right break)' : n === 180 ? '← left (right-to-left break)' : n === 90 ? '↑ toward the hole (downhill putt)' : n === 270 ? '↓ toward you (uphill putt)' : `${n}°`; };
  let timer;
  const draw = () => {
    const [D, slope, a, stimp] = inputs.map(i => +i.value);
    right.querySelector('label[for=pt-d] b').textContent = D + ' ft'; right.querySelector('label[for=pt-s] b').textContent = slope + '%';
    right.querySelector('label[for=pt-a] b').textContent = dirName(a); right.querySelector('label[for=pt-st] b').textContent = stimp;
    const fall = a * Math.PI / 180;
    const { v0, ang, run } = solve(D, slope, fall, stimp);
    const aimOff = D * Math.tan(ang) * 12; // inches at the hole
    const breakMax = Math.max(...run.pts.map(p => Math.abs(p[0]))) * 12;
    const sc = 36 / (D + 3), Y = y => -40 - y * sc, X = x => x * sc;
    svg.innerHTML = '';
    s('ellipse', { cx: 0, cy: -20, rx: 21, ry: 25, fill: '#2f7a33' }, svg);
    // fall-line arrows
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const cx = i * 8, cy = -20 + j * 9; const len = 1.2 + slope * .9; const g = s('g', { transform: `translate(${cx} ${cy}) rotate(${-a})`, opacity: slope ? .35 : 0 }, svg); s('path', { d: `M${-len},0 L${len},0 M${len - 1},-.9 L${len},0 L${len - 1},.9`, stroke: '#cfe8c9', 'stroke-width': .35, fill: 'none' }, g); }
    const hx = X(0), hy = Y(0), bx = X(0), by = Y(-D);
    s('line', { x1: bx, y1: by, x2: hx, y2: hy, stroke: '#fff', 'stroke-width': .25, 'stroke-dasharray': '.8 .8', opacity: .6 }, svg);
    const aimX = X(D * Math.tan(ang)), aimY = hy;
    s('line', { x1: bx, y1: by, x2: aimX, y2: aimY, stroke: '#ffd400', 'stroke-width': .3, 'stroke-dasharray': '1.2 .8' }, svg);
    s('circle', { cx: aimX, cy: aimY, r: .7, fill: 'none', stroke: '#ffd400', 'stroke-width': .35 }, svg);
    s('path', { d: 'M' + run.pts.map(p => `${X(p[0]).toFixed(2)},${Y(p[1]).toFixed(2)}`).join(' L'), fill: 'none', stroke: '#ff3b30', 'stroke-width': .5, 'stroke-linecap': 'round' }, svg);
    s('circle', { cx: hx, cy: hy, r: Math.max(.5, HOLE_R * sc), fill: '#0a0a0a' }, svg);
    s('line', { x1: hx, y1: hy, x2: hx, y2: hy - 7, stroke: '#fff', 'stroke-width': .25 }, svg);
    s('path', { d: `M${hx},${hy - 7} l3,1 l-3,1 z`, fill: '#ffd400' }, svg);
    s('circle', { cx: bx, cy: by, r: .7, fill: '#fff', stroke: '#000', 'stroke-width': .15 }, svg);
    const lab = (x, y, t, c = '#fff') => { const tx = s('text', { x, y, 'font-size': 1.7, fill: c, 'font-family': 'Martian Mono, monospace', 'text-anchor': 'middle' }, svg); tx.textContent = t; };
    lab(aimX, aimY - 1.6, 'AIM', '#ffd400');
    ro.innerHTML = `<div class="is-key"><small>Aim</small><b>${Math.abs(aimOff) < 1 ? 'CENTER' : `${Math.abs(aimOff).toFixed(0)}″ ${aimOff > 0 ? 'RIGHT' : 'LEFT'}`}</b></div><div><small>Max break</small><b>${breakMax.toFixed(0)}″</b></div><div><small>Start speed</small><b>${(v0 * .3048).toFixed(2)} m/s</b></div>`;
    v.className = 'verdict mid';
    v.innerHTML = `<strong>${Math.abs(aimOff) < 1 ? 'Straight in' : `Play ${Math.abs(aimOff / 12).toFixed(1)} ft ${aimOff > 0 ? 'right' : 'left'} of the hole`}</strong>${slope === 0 ? 'A flat putt: aim at the hole and focus on pace.' : 'Gravity pulls the ball downhill as it slows, so most of the break happens near the hole, when the ball is moving slowest. Try a faster green or a longer putt and watch the break grow.'}`;
  };
  const q = () => { clearTimeout(timer); timer = setTimeout(draw, 40); };
  inputs.forEach(i => i.addEventListener('input', q)); draw();
}

/* ------------------------------------------------ relief options */
function relief(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Relief options drawn to scale' });
  const H = GOLF.pin, CL = 2.4; // two club-lengths ≈ 2 × 43 in ≈ 2.4 yd
  const X = [-15, -322], B = [-28, -338], P0 = [8, -236];
  const dir = (() => { const dx = X[0] - H[0], dy = X[1] - H[1], L = Math.hypot(dx, dy); return [dx / L, dy / L]; })();
  const behind = t => [X[0] + dir[0] * t, X[1] + dir[1] * t];
  const semi = (c, r, awayFrom) => { // relief area: circle of radius r around c, no nearer the hole (half facing away)
    const ang = Math.atan2(c[1] - awayFrom[1], c[0] - awayFrom[0]); const pts = [];
    for (let i = 0; i <= 24; i++) { const a = ang - Math.PI / 2 + Math.PI * i / 24; pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
    return pts;
  };
  const view = [-58, -392, 92, 150];
  const U = [69, -205], C = [52, -262];
  sceneSwitcher(stage, d, {
    red: { chip: 'Red penalty area', title: 'Ball in a red penalty area: three options', about: 'One penalty stroke for any of them: (1) stroke-and-distance from where you last played; (2) back-on-the-line: keep the point where the ball last crossed into the area between you and the hole, and drop on that line as far back as you like; (3) red only: lateral relief within two club-lengths of that point, no nearer the hole.', view,
      players: [{ id: 'b', label: '', team: 'n', x: B[0], y: B[1], r: 1.8, info: 'Your ball, in the water.' }],
      marks: [
        { type: 'line', x1: H[0], y1: H[1], x2: behind(70)[0], y2: behind(70)[1], tone: 'ltg', label: '② BACK-ON-THE-LINE', fs: 4.2, lx: behind(46)[0] - 3, ly: behind(46)[1] },
        { type: 'path', d: 'M' + semi(X, CL, H).map(p => p.join(',')).join(' L') + ' Z', tone: 'good', label: '', fs: 3 },
        { type: 'line', x1: X[0], y1: X[1], x2: X[0], y2: X[1], label: '③ LATERAL · 2 CLUB-LENGTHS', fs: 4, lx: X[0] + 20, ly: X[1] + 8 },
        { type: 'line', x1: B[0], y1: B[1], x2: P0[0], y2: P0[1], tone: 'los', dash: '3 2', label: '① STROKE & DISTANCE', fs: 4, lx: P0[0] + 14, ly: P0[1] - 6 },
        { type: 'circle', x: X[0], y: X[1], r: 1.4, tone: 'hot', label: '', pill: false }
      ],
      paths: [{ kind: 'shot', fromPt: P0, toPt: B, t: .2, d: 1, bend: .15 }],
      captions: [{ t: 0, text: 'The approach from the fairway drifts left and splashes into the red penalty area.' }, { t: 1.2, text: 'Everything is measured from where it last crossed the red line (the red dot), not where it finished.' }] },
    yellow: { chip: 'Yellow penalty area', title: 'Ball in a yellow penalty area', about: 'Same as red, minus lateral relief: stroke-and-distance, or back-on-the-line, one penalty stroke either way. (Or play the ball as it lies, with no penalty, if you can.)', static: true, view,
      players: [{ id: 'b', label: '', team: 'n', x: B[0], y: B[1], r: 1.8 }],
      marks: [
        { type: 'line', x1: H[0], y1: H[1], x2: behind(70)[0], y2: behind(70)[1], tone: 'ltg', label: 'BACK-ON-THE-LINE', fs: 4.2, lx: behind(46)[0] - 3, ly: behind(46)[1] },
        { type: 'line', x1: B[0], y1: B[1], x2: P0[0], y2: P0[1], tone: 'los', dash: '3 2', label: 'STROKE & DISTANCE', fs: 4, lx: P0[0] + 14, ly: P0[1] - 6 },
        { type: 'circle', x: X[0], y: X[1], r: 1.4, tone: 'hot', label: '', pill: false }
      ] },
    unplayable: { chip: 'Unplayable ball', title: 'Unplayable ball (Rule 19)', about: 'You may declare your ball unplayable anywhere except in a penalty area. One stroke: stroke-and-distance, back-on-the-line from the hole through the ball, or within two club-lengths of the ball, no nearer the hole.', static: true, view: [20, -300, 80, 130],
      players: [{ id: 'u', label: '', team: 'n', x: U[0], y: U[1], r: 1.8, info: 'Ball stuck under a tree.' }],
      marks: [
        { type: 'line', x1: H[0], y1: H[1], x2: U[0] + (U[0] - H[0]) * .5, y2: U[1] + (U[1] - H[1]) * .5, tone: 'ltg', label: 'BACK-ON-THE-LINE', fs: 4.2, lx: U[0] + 6, ly: U[1] + 40 },
        { type: 'path', d: 'M' + semi(U, CL, H).map(p => p.join(',')).join(' L') + ' Z', tone: 'good' },
        { type: 'line', x1: U[0], y1: U[1], x2: U[0], y2: U[1], label: 'TWO CLUB-LENGTHS', fs: 4, lx: U[0] - 22, ly: U[1] + 6 }
      ] },
    free: { chip: 'Free relief (cart path)', title: 'Free relief from a cart path', about: 'An immovable obstruction such as a cart path gives free relief: find the nearest point of complete relief (no nearer the hole) and drop within one club-length of it.', static: true, view: [30, -282, 44, 48],
      players: [{ id: 'c', label: '', team: 'n', x: C[0], y: C[1], r: 1.4, info: 'Ball on the cart path.' }],
      marks: [
        { type: 'circle', x: C[0] - 3.2, y: C[1] + .6, r: 1, tone: 'hot', label: 'NEAREST POINT', fs: 3.4, lx: C[0] - 20, ly: C[1] + 2 },
        { type: 'path', d: 'M' + semi([C[0] - 3.2, C[1] + .6], 1.2, H).map(p => p.join(',')).join(' L') + ' Z', tone: 'good' },
        { type: 'line', x1: C[0], y1: C[1], x2: C[0], y2: C[1], label: 'NO PENALTY · 1 CLUB-LENGTH', fs: 3.6, lx: C[0] - 16, ly: C[1] - 10 }
      ] }
  }, { label: 'Situation' });
}

const MODS = { hole, scoring, bag, flight, putt, relief };
export function mount(host, name) { const fn = MODS[name]; if (!fn) throw new Error('No golf visual: ' + name); return fn(host); }
