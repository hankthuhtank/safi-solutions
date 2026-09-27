/* Playbook: regulation playing-surface geometry.
   One definition per sport feeds both the 2D diagrams (SVG) and the 3D models (rasterised texture).
   Units are the sport's own: football = yards, basketball/baseball = feet, soccer/volleyball = metres, golf = yards.
   Sources: NFL Rulebook Rule 1; NBA Rule 1; MLB Official Baseball Rules 2.01; IFAB Law 1; FIVB Rules 2025-2028 Ch.1. */

const f = n => Math.round(n * 1000) / 1000;
let UID = 0;
const rect = (x, y, w, h, a = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" ${a}/>`;
const line = (x1, y1, x2, y2, a = '') => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${a}/>`;
const circ = (cx, cy, r, a = '') => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" ${a}/>`;
const path = (d, a = '') => `<path d="${d}" ${a}/>`;
const poly = (pts, a = '') => `<polygon points="${pts.map(p => f(p[0]) + ',' + f(p[1])).join(' ')}" ${a}/>`;
const g = (name, inner, a = '') => `<g data-layer="${name}" ${a}>${inner}</g>`;

/* Smooth closed/open path through points (Catmull-Rom → cubic Bézier). */
export function smoothPath(pts, closed = false, tension = 0.5) {
  if (pts.length < 2) return '';
  const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${f(P[1][0])},${f(P[1][1])}`;
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const t = tension / 3;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}

/* Palettes: "diagram" is tuned for overlays (players, routes, zones) on a dark page;
   "texture" is the realistic version rasterised onto the 3D models. */
export const PALETTES = {
  football: {
    diagram: { surround: '#123a22', surface: '#1b5a31', alt: '#1e6236', endzone: '#16492a', line: '#eef3ec', lineSoft: 'rgba(238,243,236,.55)', number: 'rgba(238,243,236,.85)', post: '#ffd400', pylon: '#ff7a1a' },
    texture: { surround: '#2c6b3c', surface: '#3f8a4a', alt: '#357c41', endzone: '#1f5f36', line: '#ffffff', lineSoft: 'rgba(255,255,255,.9)', number: '#ffffff', post: '#ffd400', pylon: '#ff7a1a' }
  },
  basketball: {
    diagram: { surround: '#2a1d14', surface: '#8a5f36', alt: '#946841', paint: '#7a2f1c', line: '#f3efe7', lineSoft: 'rgba(243,239,231,.6)', center: '#7a2f1c' },
    texture: { surround: '#3b2a1c', surface: '#d9a86b', alt: '#cf9d60', paint: '#b5471f', line: '#ffffff', lineSoft: 'rgba(255,255,255,.85)', center: '#b5471f' }
  },
  soccer: {
    diagram: { surround: '#143d24', surface: '#1d5c33', alt: '#206538', line: '#eef3ec', lineSoft: 'rgba(238,243,236,.55)' },
    texture: { surround: '#2d6b39', surface: '#3d8b45', alt: '#35803e', line: '#ffffff', lineSoft: 'rgba(255,255,255,.9)' }
  },
  volleyball: {
    diagram: { surround: '#143253', free: '#1d4a7c', surface: '#b4541f', alt: '#b4541f', line: '#f7f3ea', lineSoft: 'rgba(247,243,234,.6)', net: '#f7f3ea', antenna: '#e5382b' },
    texture: { surround: '#1a3f6b', free: '#2a64a8', surface: '#e3702e', alt: '#e3702e', line: '#ffffff', lineSoft: 'rgba(255,255,255,.85)', net: '#ffffff', antenna: '#e5382b' }
  },
  baseball: {
    diagram: { surround: '#15291c', surface: '#1f5130', alt: '#22583a', dirt: '#8a4f2c', track: '#6f4127', line: '#f3efe7', lineSoft: 'rgba(243,239,231,.55)', base: '#ffffff', pole: '#ffd400', wall: '#0c1a12' },
    texture: { surround: '#2a5a35', surface: '#3f8a47', alt: '#367d3f', dirt: '#b8703d', track: '#9c5d34', line: '#ffffff', lineSoft: 'rgba(255,255,255,.85)', base: '#ffffff', pole: '#ffd400', wall: '#16301f' }
  },
  golf: {
    diagram: { surround: '#1a3a1f', rough: '#24512b', fairway: '#3a7a37', green: '#4f9a45', fringe: '#448c3e', tee: '#3f8a3b', sand: '#cdb98a', water: '#1f5f8f', waterEdge: '#e5382b', ob: '#f3efe7', path: '#6f6a5c', tree: '#15321a', line: '#f3efe7' },
    texture: { surround: '#2f6a2f', rough: '#3a7a35', fairway: '#58a24a', green: '#6fc05a', fringe: '#62b152', tee: '#5aa84c', sand: '#e8d6a6', water: '#2d74ad', waterEdge: '#e5382b', ob: '#ffffff', path: '#9d9788', tree: '#1f4a24', line: '#ffffff' }
  }
};

/* ---------------------------------------------------------------- FOOTBALL (yards) */
/* NFL Rule 1: 120 × 53⅓ yd incl. 10-yd end zones; 6-ft white border; inbounds lines (hashes) 70'9" from each
   sideline; yard-line numerals 2 yd tall with bottoms 12 yd from the sideline; goalposts 18'6" wide. */
export const FOOTBALL = { L: 120, W: 160 / 3, HASH: 70.75 / 3, bounds: [-9, -7, 138, 160 / 3 + 14] };
export function football(p = PALETTES.football.diagram, o = {}) {
  const { L, W, HASH } = FOOTBALL;
  const lw = 4 / 36, gw = 8 / 36, tick = 2 / 3;
  let s = rect(-9, -7, 138, W + 14, `fill="${p.surround}"`);
  s += rect(-2, -2, L + 4, W + 4, `fill="${p.line}"`);
  s += rect(0, 0, L, W, `fill="${p.surface}"`);
  if (o.stripes !== false) for (let x = 10; x < 110; x += 10) s += rect(x, 0, 5, W, `fill="${p.alt}"`);
  s += rect(0, 0, 10, W, `fill="${p.endzone}"`) + rect(110, 0, 10, W, `fill="${p.endzone}"`);
  let lines = '';
  lines += rect(10 - gw / 2, 0, gw, W, `fill="${p.line}"`) + rect(110 - gw / 2, 0, gw, W, `fill="${p.line}"`);
  for (let x = 15; x <= 105; x += 5) lines += rect(x - lw / 2, 0, lw, W, `fill="${p.line}"`);
  let hashes = '';
  for (let x = 11; x <= 109; x++) {
    if (x % 5 === 0) continue;
    hashes += rect(x - lw / 2, lw, lw, tick, `fill="${p.line}"`) + rect(x - lw / 2, W - lw - tick, lw, tick, `fill="${p.line}"`);
    hashes += rect(x - lw / 2, HASH - tick, lw, tick, `fill="${p.line}"`) + rect(x - lw / 2, W - HASH, lw, tick, `fill="${p.line}"`);
  }
  hashes += rect(12 - lw / 2, W / 2 - .5, lw, 1, `fill="${p.line}"`) + rect(108 - lw / 2, W / 2 - .5, lw, 1, `fill="${p.line}"`);
  // direction arrows beside numerals (point to the nearer goal line)
  let arrows = '';
  for (let x = 20; x <= 100; x += 10) {
    if (x === 60) continue;
    const dir = x < 60 ? -1 : 1;
    const ax = x + dir * 2.55; // just outside the outer digit
    for (const [yTop, flip] of [[W - 12 - 2, 0], [12, 1]]) {
      const cy = flip ? yTop + 2 - .45 : yTop + .45;
      const tip = ax + dir * .9;
      arrows += poly([[ax, cy - .28], [ax, cy + .28], [tip, cy]], `fill="${p.number}"`);
    }
  }
  let posts = '';
  for (const x of [0, L]) {
    const d = x === 0 ? -1 : 1;
    posts += line(x, W / 2 - 37 / 12, x, W / 2 + 37 / 12, `stroke="${p.post}" stroke-width=".22" stroke-linecap="round"`);
    posts += line(x, W / 2, x + d * 2, W / 2, `stroke="${p.post}" stroke-width=".3"`);
  }
  let pylons = '';
  for (const x of [0, 10, 110, 120]) for (const y of [0, W]) pylons += rect(x - .22, y - .22, .44, .44, `fill="${p.pylon}"`);
  s += g('lines', lines) + g('hashes', hashes) + g('arrows', arrows) + g('posts', posts) + g('pylons', pylons);
  // Numerals: 6 ft tall (2 yd) × 4 ft wide; bottoms 12 yd in from each sideline; readable from the nearer sideline.
  // Text boxes are described by their bottom edge (y0), cap height (h) and rotation, so SVG and canvas agree.
  const texts = [];
  const nums = [10, 20, 30, 40, 50, 40, 30, 20, 10];
  nums.forEach((n, i) => {
    const x = 20 + i * 10, [a, b] = String(n).split('');
    texts.push({ x: x - 1.05, y0: W - 12, h: 2, sx: 1.55, str: a, rot: 0 }, { x: x + 1.05, y0: W - 12, h: 2, sx: 1.55, str: b, rot: 0 });
    texts.push({ x: x + 1.05, y0: 12, h: 2, sx: 1.55, str: a, rot: 180 }, { x: x - 1.05, y0: 12, h: 2, sx: 1.55, str: b, rot: 180 });
  });
  return { units: 'yd', bounds: FOOTBALL.bounds, svg: s, texts, textFill: p.number, font: '800 {s}px "Big Shoulders", "Arial Narrow", sans-serif' };
}

/* ---------------------------------------------------------------- BASKETBALL (feet) */
/* NBA Rule 1: 94 × 50 ft; basket centre 5'3" from baseline; 3-pt arc 23'9", corners 22'; lane 16' wide;
   free-throw line 15' from the backboard (19' from baseline); restricted-area arc 4'; centre circle 6'/2'. */
export const BASKETBALL = { L: 94, W: 50, RIM: 5.25, bounds: [-6, -6, 106, 62] };
export function basketball(p = PALETTES.basketball.diagram, o = {}) {
  const { L, W, RIM } = BASKETBALL;
  const sw = `stroke="${p.line}" stroke-width=".17" fill="none"`;
  let s = rect(-6, -6, L + 12, W + 12, `fill="${p.surround}"`) + rect(0, 0, L, W, `fill="${p.surface}"`);
  if (o.planks) for (let y = 0; y < W; y += .75) s += rect(0, y, L, .36, `fill="${p.alt}" opacity=".5"`);
  let paint = '', lines = '';
  const side = (flip) => {
    const X = x => flip ? L - x : x;
    const arc = (cx, cy, r, a0, a1, extra = '') => {
      const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
      const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
      return path(`M${f(X(p0[0]))},${f(p0[1])} A${r},${r} 0 ${large} ${flip ? 0 : 1} ${f(X(p1[0]))},${f(p1[1])}`, extra || sw);
    };
    paint += rect(flip ? L - 19 : 0, 17, 19, 16, `fill="${p.paint}"`);
    let l = rect(flip ? L - 19 : 0, 17, 19, 16, sw);
    const yTop = 25 - 22, yBot = 25 + 22, xArc = RIM + Math.sqrt(23.75 ** 2 - 22 ** 2);
    l += line(X(0), yTop, X(xArc), yTop, sw) + line(X(0), yBot, X(xArc), yBot, sw);
    const a = Math.asin(22 / 23.75);
    l += arc(RIM, 25, 23.75, -a, a);
    // free-throw circle: solid outside the lane, dashed inside
    l += arc(19, 25, 6, -Math.PI / 2, Math.PI / 2);
    l += arc(19, 25, 6, Math.PI / 2, Math.PI * 1.5, `stroke="${p.line}" stroke-width=".17" fill="none" stroke-dasharray="1.2 1"`);
    // restricted area
    l += line(X(4), 21, X(RIM), 21, sw) + line(X(4), 29, X(RIM), 29, sw) + arc(RIM, 25, 4, -Math.PI / 2, Math.PI / 2);
    // backboard + rim
    l += line(X(4), 22, X(4), 28, `stroke="${p.line}" stroke-width=".3"`);
    l += circ(X(RIM), 25, .75, `stroke="#ff7a1a" stroke-width=".15" fill="none"`);
    // lane-space marks
    for (const m of [7, 11, 14]) l += line(X(m), 17, X(m), 16.5, sw) + line(X(m), 33, X(m), 33.5, sw);
    l += rect(flip ? L - 9 : 8, 16.4, 1, .6, `fill="${p.line}"`) + rect(flip ? L - 9 : 8, 33, 1, .6, `fill="${p.line}"`);
    // 28-ft sideline hash marks
    l += line(X(28), 0, X(28), 3, sw) + line(X(28), W, X(28), W - 3, sw);
    lines += l;
  };
  side(false); side(true);
  s += g('paint', paint + circ(L / 2, 25, 6, `fill="${p.center}"`));
  lines += rect(0, 0, L, W, sw) + line(L / 2, 0, L / 2, W, sw) + circ(L / 2, 25, 6, sw) + circ(L / 2, 25, 2, sw);
  s += g('lines', lines);
  return { units: 'ft', bounds: BASKETBALL.bounds, svg: s, texts: [] };
}

/* ---------------------------------------------------------------- SOCCER (metres) */
/* IFAB Law 1 (FIFA-recommended 105 × 68 m): penalty area 16.5 m; goal area 5.5 m; penalty mark 11 m;
   centre circle & penalty arc 9.15 m; corner arc 1 m; goal 7.32 × 2.44 m. */
export const SOCCER = { L: 105, W: 68, bounds: [-6, -5, 117, 78] };
export function soccer(p = PALETTES.soccer.diagram, o = {}) {
  const { L, W } = SOCCER;
  const lw = .12, sw = `stroke="${p.line}" stroke-width="${lw * 1.6}" fill="none"`;
  let s = rect(-6, -5, L + 12, W + 10, `fill="${p.surround}"`) + rect(-1.5, -1.5, L + 3, W + 3, `fill="${p.surface}"`);
  if (o.stripes !== false) { const n = 18, w = L / n; for (let i = 0; i < n; i += 2) s += rect(i * w, -1.5, w, W + 3, `fill="${p.alt}"`); }
  let l = rect(0, 0, L, W, sw) + line(L / 2, 0, L / 2, W, sw) + circ(L / 2, W / 2, 9.15, sw) + circ(L / 2, W / 2, .25, `fill="${p.line}"`);
  const end = flip => {
    const X = x => flip ? L - x : x;
    let e = rect(flip ? L - 16.5 : 0, W / 2 - 20.16, 16.5, 40.32, sw);
    e += rect(flip ? L - 5.5 : 0, W / 2 - 9.16, 5.5, 18.32, sw);
    e += circ(X(11), W / 2, .25, `fill="${p.line}"`);
    const dy = Math.sqrt(9.15 ** 2 - 5.5 ** 2);
    e += path(`M${f(X(16.5))},${f(W / 2 - dy)} A9.15,9.15 0 0 ${flip ? 0 : 1} ${f(X(16.5))},${f(W / 2 + dy)}`, sw);
    // goal (behind the goal line)
    e += rect(flip ? L : -2, W / 2 - 3.66, 2, 7.32, `fill="none" stroke="${p.line}" stroke-width=".22" stroke-dasharray=".5 .3"`);
    e += line(X(0), W / 2 - 3.66, X(0), W / 2 + 3.66, `stroke="${p.line}" stroke-width=".4"`);
    return e;
  };
  l += end(false) + end(true);
  // corner arcs
  l += path(`M1,0 A1,1 0 0 1 0,1`, sw) + path(`M0,${W - 1} A1,1 0 0 1 1,${W}`, sw);
  l += path(`M${L - 1},0 A1,1 0 0 0 ${L},1`, sw) + path(`M${L},${W - 1} A1,1 0 0 0 ${L - 1},${W}`, sw);
  s += g('lines', l);
  return { units: 'm', bounds: SOCCER.bounds, svg: s, texts: [] };
}

/* ---------------------------------------------------------------- VOLLEYBALL (metres) */
/* FIVB 2025-2028 Rules 1: court 18 × 9 m; attack lines 3 m from the centre line (extended by 5 dashes);
   free zone 5 m from sidelines / 6.5 m from end lines at FIVB world & official competitions. */
export const VOLLEYBALL = { L: 18, W: 9, bounds: [-6.5, -5, 31, 19] };
export function volleyball(p = PALETTES.volleyball.diagram, o = {}) {
  const { L, W } = VOLLEYBALL;
  const lw = .05;
  let s = rect(-6.5, -5, 31, 19, `fill="${p.free}"`) + rect(0, 0, L, W, `fill="${p.surface}"`);
  let l = rect(0, 0, L, W, `fill="none" stroke="${p.line}" stroke-width="${lw * 2}"`);
  l += line(9, 0, 9, W, `stroke="${p.line}" stroke-width="${lw * 2}"`);
  for (const x of [6, 12]) {
    l += line(x, 0, x, W, `stroke="${p.line}" stroke-width="${lw * 2}"`);
    for (const [y0, d] of [[0, -1], [W, 1]]) for (let i = 0; i < 5; i++) {
      const a = y0 + d * (.2 + i * .35), b = a + d * .15;
      l += line(x, a, x, b, `stroke="${p.line}" stroke-width="${lw * 2}"`);
    }
  }
  // service-zone marks (15 cm, 20 cm behind the end line, extensions of the sidelines)
  for (const x of [-.2, L + .2]) for (const y of [0, W]) l += line(x, y, x + (x < 0 ? -.15 : .15), y, `stroke="${p.line}" stroke-width="${lw * 2}"`);
  let net = line(9, -1, 9, W + 1, `stroke="${p.net}" stroke-width=".09"`) + circ(9, -1, .12, `fill="${p.net}"`) + circ(9, W + 1, .12, `fill="${p.net}"`);
  net += circ(9, 0, .09, `fill="${p.antenna}"`) + circ(9, W, .09, `fill="${p.antenna}"`);
  s += g('lines', l) + g('net', net);
  return { units: 'm', bounds: VOLLEYBALL.bounds, svg: s, texts: [] };
}

/* ---------------------------------------------------------------- BASEBALL (feet) */
/* MLB OBR 2.01 & Appendix: 90-ft baselines; pitcher's plate 60'6" from the back point of home; mound 18' dia.,
   10" high; infield grass arc 95' radius from the pitcher's plate; bases 18" square (2023); 325'/400' guidance. */
export const BASEBALL = { BASE: 90, RUBBER: 60.5, FENCE: { line: 330, alley: 375, center: 400 }, bounds: [-300, -430, 600, 500] };
export function baseballFence(n = 48) {
  const { line: dl, alley, center } = BASEBALL.FENCE;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = -45 + 90 * i / n, a = Math.abs(t);
    const d = a <= 22.5 ? center + (alley - center) * (1 - Math.cos(Math.PI * a / 45)) / (1 - Math.cos(Math.PI / 2)) : alley + (dl - alley) * ((a - 22.5) / 22.5) ** 1.25;
    const r = t * Math.PI / 180;
    pts.push([d * Math.sin(r), -d * Math.cos(r)]);
  }
  return pts;
}
export const BASES = (() => { const d = 90 / Math.SQRT2; return { home: [0, 0], first: [d, -d], second: [0, -2 * d], third: [-d, -d], mound: [0, -59], rubber: [0, -60.5] }; })();
export function baseball(p = PALETTES.baseball.diagram, o = {}) {
  const { first, second, third } = BASES;
  const fence = baseballFence();
  const RF = fence[fence.length - 1], LF = fence[0];
  const k = 45 / Math.SQRT2, t = Math.sqrt(60 ** 2 - 45 ** 2) / Math.SQRT2;
  const rOff = [RF[0] + k, RF[1] + k], lOff = [LF[0] - k, LF[1] + k];
  const rBack = [t + k, -t + k], lBack = [-(t + k), -t + k];
  const field = `M${f(LF[0])},${f(LF[1])} ` + fence.slice(1).map(q => `L${f(q[0])},${f(q[1])}`).join(' ') + ` L${f(rOff[0])},${f(rOff[1])} L${f(rBack[0])},${f(rBack[1])} A60,60 0 0 1 ${f(lBack[0])},${f(lBack[1])} L${f(lOff[0])},${f(lOff[1])} Z`;
  const cid = 'bbclip' + (++UID);
  let s = rect(-300, -430, 600, 500, `fill="${p.wall}"`) + `<clipPath id="${cid}"><path d="${field}"/></clipPath>` + path(field, `fill="${p.surface}"`);
  if (o.stripes !== false) for (let y = -420; y < 40; y += 24) s += rect(-300, y, 600, 12, `fill="${p.alt}" clip-path="url(#${cid})"`);
  // warning track: 15-ft band inside the fence
  const inner = fence.map(([x, y]) => { const d = Math.hypot(x, y); return [x * (d - 15) / d, y * (d - 15) / d]; });
  const track = `M${f(fence[0][0])},${f(fence[0][1])} ` + fence.slice(1).map(q => `L${f(q[0])},${f(q[1])}`).join(' ') + ' ' + inner.slice().reverse().map(q => `L${f(q[0])},${f(q[1])}`).join(' ') + ' Z';
  s += path(track, `fill="${p.track}"`);
  // infield dirt: sector bounded by the 95' arc (centred on the pitcher's plate) and 3' outside the foul lines
  const C = [0, -60.5], R = 95;
  const hit = (sgn) => { // intersection of the arc with the foul line (sgn +1 = 1B side)
    const b = 121 / 2; const x = (b + Math.sqrt(b * b + 2 * (R * R - 60.5 * 60.5))) / 2; return [sgn * x, -x];
  };
  const H1 = hit(1), H3 = hit(-1);
  const o3 = 3 / Math.SQRT2;
  const dirt = `M${f(-o3)},${f(o3)} L${f(H3[0] - o3)},${f(H3[1] + o3)} A${R},${R} 0 0 1 ${f(H1[0] + o3)},${f(H1[1] + o3)} L${f(o3)},${f(o3)} Z`;
  const did = 'bbdirt' + (++UID);
  s += `<clipPath id="${did}"><path d="${dirt}"/></clipPath>` + path(dirt, `fill="${p.dirt}"`) + circ(0, -.7, 13, `fill="${p.dirt}"`);
  // infield grass: the diamond inset 3 ft, with cut-outs around the bases
  const nIn = 3 * Math.SQRT2, fIn = 127.28 - 12 * Math.SQRT2; // near sides 3 ft inside, far sides 12 ft inside
  const gpts = [[0, -nIn], [(fIn - nIn) / 2, -(fIn + nIn) / 2], [0, -fIn], [-(fIn - nIn) / 2, -(fIn + nIn) / 2]];
  s += poly(gpts, `fill="${p.surface}"`);
  s += circ(0, -59, 9, `fill="${p.dirt}"`);
  for (const b of [first, third]) s += circ(b[0], b[1], 13, `fill="${p.dirt}" clip-path="url(#${did})"`);
  s += circ(0, -.7, 13, `fill="${p.dirt}"`);
  let l = '';
  const lsw = `stroke="${p.line}" stroke-width=".35"`;
  l += line(0, 0, RF[0], RF[1], lsw) + line(0, 0, LF[0], LF[1], lsw);
  // runner's lane (last 45 ft to first, 3 ft into foul territory)
  const u = [1 / Math.SQRT2, -1 / Math.SQRT2], nrm = [1 / Math.SQRT2, 1 / Math.SQRT2];
  const a45 = [u[0] * 45, u[1] * 45], a90 = [u[0] * 90, u[1] * 90];
  l += line(a45[0] + nrm[0] * 3, a45[1] + nrm[1] * 3, a90[0] + nrm[0] * 3, a90[1] + nrm[1] * 3, lsw) + line(a45[0], a45[1], a45[0] + nrm[0] * 3, a45[1] + nrm[1] * 3, lsw);
  // batter's boxes (4 × 6 ft, 6 in from the plate)
  for (const sx of [-1, 1]) l += rect(sx > 0 ? 1.21 : -5.21, -3.71, 4, 6, `fill="none" ${lsw}`);
  s += g('lines', l);
  // pitcher's plate (24 × 6 in) and home plate (17 in pentagon)
  let b = rect(-1, -60.75, 2, .5, `fill="${p.base}"`);
  b += poly([[0, 0], [.7083, -.7083], [.7083, -1.4167], [-.7083, -1.4167], [-.7083, -.7083]], `fill="${p.base}"`);
  const bag = (c, rot = 45) => `<rect x="${f(c[0] - .75)}" y="${f(c[1] - .75)}" width="1.5" height="1.5" fill="${p.base}" transform="rotate(${rot} ${f(c[0])} ${f(c[1])})"/>`;
  b += bag([first[0] - .75, first[1] + .1]) + bag(second) + bag([third[0] + .75, third[1] + .1]);
  s += g('bases', b);
  s += g('poles', circ(RF[0], RF[1], 2.2, `fill="${p.pole}"`) + circ(LF[0], LF[1], 2.2, `fill="${p.pole}"`));
  s += g('fence', path(`M${fence.map(q => f(q[0]) + ',' + f(q[1])).join(' L')}`, `fill="none" stroke="${p.line}" stroke-width="1.6" opacity=".7"`));
  const texts = o.labels === false ? [] : [
    { x: LF[0] + 20, y0: LF[1] + 38, h: 10, sx: 1, str: String(BASEBALL.FENCE.line), rot: 0 },
    { x: RF[0] - 20, y0: RF[1] + 38, h: 10, sx: 1, str: String(BASEBALL.FENCE.line), rot: 0 },
    { x: 0, y0: -400 + 36, h: 10, sx: 1, str: String(BASEBALL.FENCE.center), rot: 0 }
  ];
  return { units: 'ft', bounds: BASEBALL.bounds, svg: s, texts, textFill: p.lineSoft, font: '800 {s}px "Big Shoulders", "Arial Narrow", sans-serif' };
}

/* ---------------------------------------------------------------- GOLF (yards) */
/* A representative 418-yard par 4 (dogleg right) drawn to scale. Areas follow Rule 2.2: general area,
   teeing area, bunkers, penalty areas, putting green — plus out of bounds. Tee at the bottom, green at the top. */
export const GOLF = {
  bounds: [-95, -470, 190, 500],
  tees: [{ id: 'black', y: -8, c: '#111' }, { id: 'blue', y: -28, c: '#2f66d0' }, { id: 'white', y: -50, c: '#f5f5f5' }, { id: 'red', y: -76, c: '#d8342b' }],
  pin: [44, -424], greenC: [41, -418],
  centerline: [[0, -95], [2, -165], [9, -235], [22, -300], [34, -355], [40, -398]],
  fairwayBunkers: [{ c: [-17, -238], rx: 11, ry: 6, rot: -12 }, { c: [42, -262], rx: 10, ry: 7, rot: 18 }],
  greenBunkers: [{ c: [21, -410], rx: 8, ry: 5, rot: -30 }, { c: [62, -432], rx: 7, ry: 5, rot: 25 }],
  water: [[-40, -300], [-18, -312], [-12, -345], [-24, -382], [-50, -392], [-66, -360], [-62, -320]],
  obX: 82
};
export function golf(p = PALETTES.golf.diagram, o = {}) {
  const G = GOLF;
  let s = rect(-95, -470, 190, 500, `fill="${p.surround}"`);
  s += rect(-80, -462, 162, 472, `fill="${p.rough}"`);
  // fairway: ribbon along the centreline, ~34 yd wide, tapering at both ends
  const cl = G.centerline;
  const left = [], right = [];
  cl.forEach((q, i) => {
    const a = cl[Math.max(0, i - 1)], b = cl[Math.min(cl.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L, w = i === 0 ? 11 : i === cl.length - 1 ? 12 : 17;
    left.push([q[0] + nx * w, q[1] + ny * w]); right.push([q[0] - nx * w, q[1] - ny * w]);
  });
  const fair = smoothPath([...left, [cl[cl.length - 1][0] + 2, cl[cl.length - 1][1] - 9], ...right.reverse(), [cl[0][0] - 1, cl[0][1] + 8]], true, .9);
  let areas = '';
  areas += g('general', path(fair, `fill="${p.fairway}"`));
  if (o.stripes !== false) { const gid = 'gclip' + (++UID); areas += `<clipPath id="${gid}"><path d="${fair}"/></clipPath>` + Array.from({ length: 22 }, (_, i) => rect(-80, -410 + i * 16, 170, 8, `fill="#fff" opacity=".045" clip-path="url(#${gid})"`)).join(''); }
  // teeing areas
  let tees = '';
  G.tees.forEach(t => {
    tees += rect(-7, t.y - 5, 14, 10, `fill="${p.tee}" stroke="${p.line}" stroke-opacity=".25" stroke-width=".3" rx="1.2"`);
    tees += circ(-3.5, t.y - 2, .9, `fill="${t.c}" stroke="#000" stroke-opacity=".35" stroke-width=".2"`) + circ(3.5, t.y - 2, .9, `fill="${t.c}" stroke="#000" stroke-opacity=".35" stroke-width=".2"`);
  });
  areas += g('teeing', tees);
  // penalty area (red)
  const water = smoothPath(G.water, true, .9);
  areas += g('penalty', path(water, `fill="${p.water}"`) + path(water, `fill="none" stroke="${p.waterEdge}" stroke-width="1" stroke-dasharray="2.2 1.6"`));
  // bunkers
  const bunk = b => `<ellipse cx="${b.c[0]}" cy="${b.c[1]}" rx="${b.rx}" ry="${b.ry}" transform="rotate(${b.rot} ${b.c[0]} ${b.c[1]})" fill="${p.sand}" stroke="#0003" stroke-width=".4"/>`;
  areas += g('bunkers', [...G.fairwayBunkers, ...G.greenBunkers].map(bunk).join(''));
  // putting green + fringe
  const [gx, gy] = G.greenC;
  areas += g('green', `<ellipse cx="${gx}" cy="${gy}" rx="19" ry="15.5" transform="rotate(-18 ${gx} ${gy})" fill="${p.fringe}"/><ellipse cx="${gx}" cy="${gy}" rx="17" ry="13.5" transform="rotate(-18 ${gx} ${gy})" fill="${p.green}"/>` + circ(G.pin[0], G.pin[1], .6, `fill="#0a0a0a"`));
  s += areas;
  // out of bounds (white stakes) on the right
  let ob = line(G.obX, -462, G.obX, 8, `stroke="${p.ob}" stroke-width=".6" stroke-dasharray="1.2 5"`);
  for (let y = -455; y < 8; y += 20) ob += circ(G.obX, y, 1, `fill="${p.ob}"`);
  s += g('ob', ob);
  // cart path
  s += g('path', path(smoothPath([[12, 6], [16, -70], [30, -160], [50, -250], [62, -330], [70, -392], [72, -440]], false, .9), `fill="none" stroke="${p.path}" stroke-width="2.4" stroke-linecap="round" opacity=".8"`));
  // yardage markers to the centre of the green (200 blue / 150 white / 100 red)
  let marks = '';
  const along = (target) => { // point on the centreline whose straight-line distance to the green centre ≈ target
    let best = cl[0], bd = 1e9;
    for (let i = 0; i < cl.length - 1; i++) for (let t = 0; t <= 1; t += .02) {
      const q = [cl[i][0] + (cl[i + 1][0] - cl[i][0]) * t, cl[i][1] + (cl[i + 1][1] - cl[i][1]) * t];
      const d = Math.abs(Math.hypot(q[0] - gx, q[1] - gy) - target); if (d < bd) { bd = d; best = q; }
    }
    return best;
  };
  const markers = [[200, '#2f66d0'], [150, '#f5f5f5'], [100, '#d8342b']].map(([d, c]) => ({ d, c, q: along(d) }));
  markers.forEach(m => { marks += circ(m.q[0], m.q[1], 1.3, `fill="${m.c}" stroke="#000" stroke-opacity=".4" stroke-width=".25"`); });
  s += g('markers', marks);
  // trees
  if (o.trees !== false) {
    let tr = '';
    const rnd = mulberry(7);
    for (let i = 0; i < 70; i++) {
      const y = -455 + rnd() * 455, side = rnd() < .55 ? -1 : 1;
      const x = side < 0 ? -78 + rnd() * 18 : 62 + rnd() * 16;
      if (side < 0 && y < -290 && y > -400) continue; // leave the water open
      tr += circ(x, y, 3 + rnd() * 3.5, `fill="${p.tree}" opacity=".95"`);
    }
    s += g('trees', tr);
  }
  return { units: 'yd', bounds: GOLF.bounds, svg: s, texts: [], markers };
}
export function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export const SURFACES = { football, basketball, soccer, volleyball, baseball, golf };

/* Text boxes → SVG. CAP is the display face's cap-height ratio (Big Shoulders ≈ .72 em). */
export const CAP = 0.72;
export function textSVG(spec, fill) {
  return (spec.texts || []).map(t => {
    const fs = t.h / CAP, sx = t.sx || 1;
    const base = t.rot ? t.y0 + t.h : t.y0, cy = t.rot ? t.y0 + t.h / 2 : t.y0 - t.h / 2;
    const tr = `${t.rot ? `rotate(${t.rot} ${f(t.x)} ${f(cy)}) ` : ''}translate(${f(t.x)} 0) scale(${sx} 1) translate(${f(-t.x)} 0)`;
    return `<text x="${f(t.x)}" y="${f(base)}" font-size="${f(fs)}" font-family="'Big Shoulders','Arial Narrow',sans-serif" font-weight="800" text-anchor="middle" fill="${fill || spec.textFill || '#fff'}" transform="${tr}">${t.str}</text>`;
  }).join('');
}
/* Text boxes → canvas (fonts loaded by the page are available here, unlike inside an SVG <img>). */
export function textCanvas(ctx, spec, map, fill) {
  for (const t of spec.texts || []) {
    const fs = t.h / CAP * map.s, sx = t.sx || 1;
    const [px, py] = map.pt(t.x, t.rot ? t.y0 + t.h / 2 : t.y0 - t.h / 2);
    ctx.save(); ctx.translate(px, py); ctx.rotate((t.rot || 0) * Math.PI / 180); ctx.scale(sx, 1);
    ctx.font = `800 ${fs}px "Big Shoulders", "Arial Narrow", sans-serif`; ctx.fillStyle = fill || spec.textFill || '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(t.str, 0, t.h / 2 * map.s); ctx.restore();
  }
}

/* Wrap a surface in a standalone SVG string (used for the 3D texture raster). */
export function surfaceSVG(sport, pal, opts = {}) {
  const spec = SURFACES[sport](pal, opts);
  const [x, y, w, h] = spec.bounds;
  return { spec, markup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${opts.px || 2048}" height="${Math.round((opts.px || 2048) * h / w)}" shape-rendering="geometricPrecision">${spec.svg}</svg>` };
}
