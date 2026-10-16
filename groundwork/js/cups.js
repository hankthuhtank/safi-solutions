// Cutaway cups and glasses. Every drink is drawn from its layers: the liquid is the picture.
export const INK = {
  espresso: '#2b1710', crema: '#b8763c', coffee: '#3b2215', americano: '#4b2b19', coldbrew: '#2e1a10', water: '#dbe7ea',
  milk: '#f2e8d8', steamed: '#ecdcc2', foam: '#fbf6ee', microfoam: '#f4e9d7', oat: '#ead9bd', cream: '#fff4de', halfhalf: '#f1e2c6',
  whip: '#fffdf8', condensed: '#e6cb98', chocolate: '#4a2516', cocoa: '#5b3221', caramel: '#b8682a', ice: '#e9f2f4', tonic: '#eef3e6',
  matcha: '#7f9a3a', chai: '#b3895c', pistachio: '#b5c287', ube: '#8d6aae', lavender: '#b4a2cc', egg: '#efcf73', saltcream: '#f3ede2',
  whiskey: '#a6622a', liqueur: '#2d150b', vodka: '#eef0ee', grappa: '#f1efe6', brandy: '#8a4a1f', rum: '#7a3c16', tea: '#8a5530',
  milktea: '#c49a6c', qahwa: '#c79f5a', turkish: '#24110a', kopi: '#3a2010', kaapi: '#c69c70', olla: '#43251a', honey: '#d99a2b',
  syrup: '#c27a2f', lemon: '#f0dc6a', orange: '#e08a2e', coconut: '#f6f1e6', cheese: '#f0dca4', sugar: '#f7f2e8', icecream: '#f7edd8',
  spice: '#8b4a22', protein: '#e7d9bf', brownsugar: '#9a5a24', maple: '#b0661f', cherry: '#b3362b', vanilla: '#f3e6c4', mocha: '#5d3322',
  dirtychai: '#7a5236', melange: '#d9bf9c', lightcoffee: '#b78a62', sweetmilk: '#e8d5b0', cola: '#3a1d12', foamdark: '#d8c0a0',
};
export const swatch = k => INK[k] || '#8a7a68';

// viewBox 0 0 120 140. cav = inner cavity polygon (liquid is clipped to it). yt/yb = fill top/bottom.
const V = {
  demitasse: { kind: 'ceramic', cap: 90, yt: 97, yb: 125, saucer: 1,
    out: 'M36 90 H84 L80 116 Q78 128 64 129 H56 Q42 128 40 116 Z', cav: 'M39.5 93 H80.5 L77.4 115 Q75.6 125.5 63 126 H57 Q44.4 125.5 42.6 115 Z',
    handle: 'M82 97 Q96 96 95 107 Q94 117 79 116' },
  gibraltar: { kind: 'glass', cap: 135, yt: 75, yb: 121, base: 'M37.3 121 H82.7 L82 130 H38 Z',
    out: 'M33 70 H87 L82 130 H38 Z', cav: 'M35.6 72 H84.4 L80.3 121 H39.7 Z' },
  cap: { kind: 'ceramic', cap: 180, yt: 86, yb: 123, saucer: 1, saucerW: 44,
    out: 'M22 81 H98 Q98 104 86 118 Q78 127 66 128 H54 Q42 127 34 118 Q22 104 22 81 Z', cav: 'M25.5 84 H94.5 Q94 104 83.5 116 Q76.5 124 65 124.8 H55 Q43.5 124 36.5 116 Q26 104 25.5 84 Z',
    handle: 'M96 90 Q111 90 109 101 Q107 111 92 109' },
  fw: { kind: 'ceramic', cap: 160, yt: 92, yb: 123, saucer: 1, tint: '#efe7da',
    out: 'M27 88 H93 Q93 107 82 119 Q75 127 64 128 H56 Q45 127 38 119 Q27 107 27 88 Z', cav: 'M30.5 91 H89.5 Q89 107 79.8 117 Q73.8 124 63.5 124.8 H56.5 Q46.2 124 40.2 117 Q31 107 30.5 91 Z',
    handle: 'M91 95 Q104 95 103 105 Q101 114 88 112' },
  latte: { kind: 'glass', cap: 300, yt: 37, yb: 121, base: 'M38.5 121 H81.5 L81 130 H39 Z',
    out: 'M34 30 H86 L81 130 H39 Z', cav: 'M36.6 32 H83.4 L78.6 121 H41.4 Z' },
  mug: { kind: 'ceramic', cap: 300, yt: 59, yb: 125, tint: '#e9dccb',
    out: 'M27 51 H89 V118 Q89 130 77 130 H39 Q27 130 27 118 Z', cav: 'M30.5 54 H85.5 V117 Q85.5 126.5 76 126.5 H40 Q30.5 126.5 30.5 117 Z',
    handle: 'M89 64 Q106 63 106 82 Q106 101 89 101' },
  glassmug: { kind: 'glass', cap: 300, yt: 52, yb: 122, base: 'M33 122 H87 V128 Q87 131 84 131 H36 Q33 131 33 128 Z',
    out: 'M30 46 H90 V126 Q90 131 85 131 H35 Q30 131 30 126 Z', cav: 'M32.6 48 H87.4 V122 H32.6 Z',
    handle: 'M90 60 Q106 60 106 82 Q106 104 90 104', handleIn: 'M90 67 Q99.5 67 99.5 82 Q99.5 97 90 97' },
  bowl: { kind: 'ceramic', cap: 350, yt: 88, yb: 124, tint: '#e6d8c1',
    out: 'M12 82 H108 Q106 106 88 120 Q78 129 66 129 H54 Q42 129 32 120 Q14 106 12 82 Z', cav: 'M15.5 85 H104.5 Q102.5 104.5 86 117.5 Q76.8 125.8 65.5 125.8 H54.5 Q43.2 125.8 34 117.5 Q17.5 104.5 15.5 85 Z' },
  highball: { kind: 'glass', cap: 350, yt: 28, yb: 121, base: 'M38.6 121 H81.4 L81 130 H39 Z',
    out: 'M35 18 H85 L81 130 H39 Z', cav: 'M37.6 20 H82.4 L78.7 121 H41.3 Z' },
  rocks: { kind: 'glass', cap: 250, yt: 70, yb: 119, base: 'M27.4 119 H92.6 L92 130 H28 Z',
    out: 'M25 62 H95 L92 130 H28 Z', cav: 'M27.6 64 H92.4 L90.2 119 H29.8 Z' },
  irish: { kind: 'glass', cap: 240, yt: 36, yb: 93, stem: 1,
    out: 'M31 28 H89 L86 82 Q84 98 66 99 H54 Q36 98 34 82 Z', cav: 'M33.6 30 H86.4 L83.6 81 Q82 95 65.5 96 H54.5 Q38 95 36.4 81 Z',
    handle: 'M86 42 Q101 42 101 57 Q101 72 86 72', handleIn: 'M86.6 48 Q95 48 95 57 Q95 66 86.6 66' },
  coupe: { kind: 'glass', cap: 150, yt: 62, yb: 88, stem: 1,
    out: 'M16 56 H104 Q102 82 74 90 Q66 92 60 92 Q54 92 46 90 Q18 82 16 56 Z', cav: 'M19 58.5 H101 Q99 80 72.8 87.4 Q65.5 89.3 60 89.3 Q54.5 89.3 47.2 87.4 Q21 80 19 58.5 Z' },
  fincan: { kind: 'ceramic', cap: 70, yt: 99, yb: 124, saucer: 1, band: 1,
    out: 'M40 94 H80 L76 120 Q75 128 64 128.5 H56 Q45 128 44 120 Z', cav: 'M43.4 97 H76.6 L73.2 119 Q72.4 125.3 63.3 125.6 H56.7 Q47.6 125.3 46.8 119 Z',
    handle: 'M78 99 Q89 99 88 107 Q87 114 76 114' },
  finjan: { kind: 'ceramic', cap: 60, yt: 104, yb: 125, saucer: 0, band: 1,
    out: 'M38 99 H82 L76 122 Q75 129 64 129 H56 Q45 129 44 122 Z', cav: 'M41.6 102 H78.4 L73.2 121 Q72.4 126 63.2 126 H56.8 Q47.6 126 46.8 121 Z' },
  tumbler: { kind: 'steel', cap: 150, yt: 70, yb: 111, dabarah: 1,
    out: 'M40 62 H80 L77 114 H43 Z', cav: 'M42.6 64.5 H77.4 L74.8 111 H45.2 Z' },
  phin: { kind: 'glass', cap: 180, yt: 82, yb: 121, base: 'M36.4 121 H83.6 L83 130 H37 Z', phin: 1,
    out: 'M33 76 H87 L83 130 H37 Z', cav: 'M35.6 78 H84.4 L80.7 121 H39.3 Z' },
  tulip: { kind: 'glass', cap: 300, yt: 44, yb: 121, base: 'M44 121 H76 Q78 125 77 130 H43 Q42 125 44 121 Z',
    out: 'M41 36 H79 Q90 70 88 100 Q86 124 77 130 H43 Q34 124 32 100 Q30 70 41 36 Z', cav: 'M43.4 38.5 H76.6 Q87 71 85.4 99.5 Q83.6 116 76 121 H44 Q36.4 116 34.6 99.5 Q33 71 43.4 38.5 Z' },
  jar: { kind: 'glass', cap: 400, yt: 42, yb: 122, base: 'M36.5 122 H83.5 V125 Q83.5 130 78.5 130 H41.5 Q36.5 130 36.5 125 Z', lid: 1,
    out: 'M34 34 H86 V124 Q86 131 79 131 H41 Q34 131 34 124 Z', cav: 'M36.6 36.5 H83.4 V122 H36.6 Z' },
  jarrito: { kind: 'clay', cap: 260, yt: 62, yb: 125,
    out: 'M30 56 H90 L84 120 Q82 130 70 130 H50 Q38 130 36 120 Z', cav: 'M33.6 59 H86.4 L80.8 119 Q79 126.8 69.5 126.8 H50.5 Q41 126.8 39.2 119 Z',
    handle: 'M88 66 Q104 66 102 85 Q100 103 84 102' },
};
export const VESSELS = Object.keys(V);
const LABEL = { demitasse: 'Demitasse', gibraltar: 'Gibraltar glass', cap: 'Cappuccino cup', fw: 'Small cup', latte: 'Latte glass', mug: 'Mug', glassmug: 'Glass mug', bowl: 'Bowl', highball: 'Tall glass', rocks: 'Rocks glass', irish: 'Irish coffee glass', coupe: 'Coupe', fincan: 'Fincan', finjan: 'Finjan', tumbler: 'Tumbler & dabarah', phin: 'Glass + phin', tulip: 'Tulip glass', jar: 'Jar', jarrito: 'Clay mug' };
export const vesselLabel = v => LABEL[v] || v;

let uid = 0;
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = seed || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)) >>> 0) / 4294967296; }

/**
 * layers: [[ink, ml, flags]] bottom→top. flags: 'b' blend into the layer below, 'f' foam, 'w' whipped/cloud above,
 * 'i' ice (cubes drawn over the liquid), 'd' dusting on top, 's' sinking syrup (thin, dark edge)
 * opts: { fill: 0..1 animated fill, steam: bool, riso: bool, id }
 */
export function cupSVG(drink, opts = {}) {
  const v = V[drink.v] || V.mug; const id = 'c' + (++uid);
  const fillT = opts.fill == null ? 1 : opts.fill;
  const layers = (drink.layers || []).filter(l => !/[wid]/.test(l[2] || ''));
  const extras = (drink.layers || []).filter(l => /[wid]/.test(l[2] || ''));
  const total = layers.reduce((a, l) => a + l[1], 0) || 1;
  const fullH = v.yb - v.yt;
  const frac = Math.min(1, total / v.cap) * fillT;
  const liquidTop = v.yb - Math.max(frac, total ? .08 * fillT : 0) * fullH;
  const H = v.yb - liquidTop;
  // gradient stops, bottom (offset 1) to top (offset 0) in a gradient spanning liquidTop..yb
  let y = v.yb, stops = '', bubbles = '', foamTop = null; const segs = [];
  layers.forEach((l, i) => { const h = H * l[1] / total; segs.push({ k: l[0], y0: y - h, y1: y, f: /f/.test(l[2] || ''), b: /b/.test(l[2] || '') }); y -= h; });
  const off = yy => ((yy - liquidTop) / (H || 1)).toFixed(4);
  for (let i = segs.length - 1; i >= 0; i--) { // top → bottom for ordered offsets
    const s = segs[i], c = swatch(s.k), next = segs[i - 1];
    const blendTop = s.b && segs[i + 1] ? 0 : 0;
    stops += `<stop offset="${off(s.y0 + blendTop)}" stop-color="${c}"/>`;
    if (next && s.b) { const bh = Math.min(10, (s.y1 - s.y0) * .5); stops += `<stop offset="${off(s.y1 - bh)}" stop-color="${c}"/>`; }
    else stops += `<stop offset="${off(s.y1)}" stop-color="${c}"/>`;
    if (s.f) { if (i === segs.length - 1) foamTop = s.y0; bubbles += `<rect x="0" y="${s.y0.toFixed(1)}" width="120" height="${(s.y1 - s.y0).toFixed(1)}" fill="url(#${id}b)"/>`; }
    if (s.k === 'crema') bubbles += `<rect x="0" y="${s.y0.toFixed(1)}" width="120" height="${(s.y1 - s.y0).toFixed(1)}" fill="url(#${id}t)"/>`;
  }
  const R = rng(hash(drink.id || drink.n || 'x'));
  // ice cubes
  let ice = '';
  const iceL = extras.find(l => /i/.test(l[2]));
  if (iceL && fillT > .2) {
    const n = Math.max(2, Math.round(iceL[1] / 30)); const cav = v.cav.match(/[\d.]+/g).map(Number);
    const xs = cav.filter((_, i) => i % 2 === 0), left = Math.min(...xs) + 6, right = Math.max(...xs) - 6;
    for (let k = 0; k < n; k++) {
      const s = 15 + R() * 6, cx = left + s / 2 + R() * Math.max(1, right - left - s), cy = Math.min(v.yb - s / 2 - 1, liquidTop + s / 2 - 3 + (k / n) * (v.yb - liquidTop - s) + R() * 6), rot = (R() * 40 - 20).toFixed(0);
      ice += `<rect x="${(cx - s / 2).toFixed(1)}" y="${(cy - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" rx="3.5" transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="rgba(255,255,255,.38)" stroke="rgba(255,255,255,.85)" stroke-width="1.2"/>`;
    }
  }
  // topping on the surface
  let top = '';
  const dust = extras.find(l => /d/.test(l[2]));
  const whip = extras.find(l => /w/.test(l[2]));
  const surf = foamTop ?? liquidTop;
  if (whip && fillT > .9) {
    const c = swatch(whip[0]), w = 46 + whip[1] / 4, cx = 60, by = Math.min(surf, v.yt + 4);
    const hgt = 10 + whip[1] / 8;
    top += `<path d="M${cx - w / 2} ${by} q2 -${hgt * .6} 10 -${hgt * .7} q2 -${hgt * .5} 9 -${hgt * .55} q5 -${hgt * .45} ${w / 2 - 19} -${hgt * .2} q${w / 2 - 19} -${hgt * .1} ${w / 2 - 4} ${hgt * .55} q4 ${hgt * .3} 4 ${hgt * .99} Z" fill="${c}" stroke="#2a1a12" stroke-width="1.6" stroke-linejoin="round"/>`;
    top += `<path d="M${cx - 12} ${by - hgt * .55} q6 -4 12 -1 M${cx + 2} ${by - hgt * .75} q6 -3 10 1" fill="none" stroke="rgba(42,26,18,.25)" stroke-width="1.2" stroke-linecap="round"/>`;
  }
  if (dust && fillT > .9) {
    const c = swatch(dust[0]); let dots = '';
    const yy = whip ? Math.min(surf, v.yt + 4) - 12 : surf + 1.6;
    for (let k = 0; k < 26; k++) dots += `<circle cx="${(38 + R() * 44).toFixed(1)}" cy="${(yy + R() * 2.4 - 1.2).toFixed(1)}" r="${(.7 + R() * .9).toFixed(1)}"/>`;
    top += `<g fill="${c}">${dots}</g>`;
  }
  const ink = '#2a1a12';
  const glass = v.kind === 'glass';
  const bodyFill = v.kind === 'ceramic' ? (v.tint || '#f6f0e6') : v.kind === 'clay' ? '#b25e3a' : v.kind === 'steel' ? '#c9ccce' : 'rgba(255,255,255,.34)';
  let s = `<svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${(drink.n || '').replace(/"/g, '')}">`;
  s += `<defs><linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="0" y1="${liquidTop.toFixed(1)}" x2="0" y2="${v.yb}">${stops}</linearGradient>`;
  s += `<clipPath id="${id}k"><path d="${v.cav}"/></clipPath>`;
  s += `<pattern id="${id}b" width="7" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="rgba(255,255,255,.75)"/><circle cx="5.5" cy="4.6" r=".7" fill="rgba(200,170,130,.35)"/></pattern>`;
  s += `<pattern id="${id}t" width="9" height="4" patternUnits="userSpaceOnUse"><ellipse cx="3" cy="2" rx="2.4" ry=".9" fill="rgba(90,45,18,.55)"/><ellipse cx="7.5" cy="1" rx="1.2" ry=".5" fill="rgba(240,200,140,.45)"/></pattern>`;
  s += `<pattern id="${id}h" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="rgba(42,26,18,.28)" stroke-width="1"/></pattern></defs>`;
  if (opts.steam && drink.t !== 'iced') s += `<g class="cup-steam" fill="none" stroke="rgba(122,74,43,.38)" stroke-width="2.4" stroke-linecap="round"><path d="M50 ${v.yt - 12} q-6 -9 0 -18 q6 -9 0 -18"/><path d="M66 ${v.yt - 8} q-6 -9 0 -18 q6 -9 0 -18"/></g>`;
  if (v.saucer) s += `<ellipse cx="60" cy="131" rx="${v.saucerW || 36}" ry="4.2" fill="#efe6d8" stroke="${ink}" stroke-width="1.8"/>`;
  if (v.dabarah) s += `<path d="M22 104 H98 Q96 126 82 131 H38 Q24 126 22 104 Z" fill="#cfd2d4" stroke="${ink}" stroke-width="2"/><path d="M24 107 H96" stroke="rgba(255,255,255,.7)" stroke-width="2"/>`;
  if (v.stem) s += `<path d="M57 ${v.yb + 4} V124 M63 ${v.yb + 4} V124" stroke="${ink}" stroke-width="2"/><rect x="57" y="${v.yb + 3}" width="6" height="${121 - v.yb}" fill="rgba(255,255,255,.4)"/><ellipse cx="60" cy="127" rx="25" ry="4" fill="rgba(255,255,255,.5)" stroke="${ink}" stroke-width="2"/>`;
  if (v.handle) s += `<path d="${v.handle}" fill="none" stroke="${ink}" stroke-width="${glass ? 2.2 : 7.5}" stroke-linecap="round"/>` + (glass ? '' : `<path d="${v.handle}" fill="none" stroke="${bodyFill}" stroke-width="4" stroke-linecap="round"/>`);
  if (v.handleIn && glass) s += `<path d="${v.handleIn}" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`;
  s += `<path d="${v.out}" fill="${bodyFill}" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
  if (!glass) s += `<path d="${v.out}" fill="url(#${id}h)" opacity=".7"/><path d="${v.cav}" fill="#fbf7ef"/>`;
  // liquid
  s += `<g clip-path="url(#${id}k)"><rect x="0" y="${liquidTop.toFixed(1)}" width="120" height="${(H + 1).toFixed(1)}" fill="url(#${id}g)"/>${bubbles}${ice}`;
  if (H > 0 && !foamTop) s += `<rect x="0" y="${liquidTop.toFixed(1)}" width="120" height="1.6" fill="rgba(255,255,255,.35)"/>`;
  s += `</g>`;
  if (foamTop != null && fillT > .9) s += `<path d="M${v.cav.match(/M([\d.]+)/)[1]} ${foamTop + 1} Q60 ${foamTop - 5} ${120 - +v.cav.match(/M([\d.]+)/)[1]} ${foamTop + 1}" fill="${swatch(segs[segs.length - 1].k)}" stroke="none"/>`;
  if (glass) {
    s += `<path d="${v.out}" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
    if (v.base) s += `<path d="${v.base}" fill="rgba(255,255,255,.5)" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
    s += `<path d="${hl(v)}" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="3" stroke-linecap="round"/>`;
  } else {
    s += `<path d="${v.cav}" fill="none" stroke="${ink}" stroke-width="1.2" opacity=".55"/>`;
  }
  if (v.band) s += `<path d="M${v.kind === 'ceramic' && v.cap === 70 ? '42 104 H78' : '40 108 H80'}" stroke="#b3362b" stroke-width="2.4"/>`;
  if (v.phin) s += `<g stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M26 74 H94 V78 H26 Z" fill="#c9ccce"/><path d="M38 74 L40 48 H80 L82 74 Z" fill="#d6d9db"/><path d="M36 48 H84 V43 H36 Z" fill="#b7bbbe"/><path d="M56 43 V38 H64 V43" fill="#b7bbbe"/></g><g fill="#2b1710">${fillT < 1 ? '<circle cx="60" cy="80" r="1.6"/>' : ''}</g>`;
  if (v.lid) s += `<path d="M33 28 H87 V35 H33 Z" fill="#c9ccce" stroke="${ink}" stroke-width="1.8"/>`;
  s += top;
  if (drink.garnish) s += garnish(drink.garnish, v, surf);
  s += `</svg>`;
  return s;
}
function hl(v) { // a highlight streak down the left inside wall
  const m = v.cav.match(/M([\d.]+) ([\d.]+)/); const x = +m[1] + 4, y0 = +m[2] + 6;
  return `M${x} ${y0} L${x + 2.5} ${Math.min(v.yb - 6, y0 + (v.yb - y0) * .55)}`;
}
function garnish(g, v, surf) {
  const top = Math.min(surf, v.yt);
  if (g === 'lemon' || g === 'orange') { const c = g === 'lemon' ? '#e8cc3e' : '#e0862a'; return `<g transform="translate(${g === 'lemon' ? 74 : 78} ${v.yt - 2}) rotate(28)"><path d="M-10 0 A10 10 0 0 1 10 0 Z" fill="${c}" stroke="#2a1a12" stroke-width="1.6"/><path d="M-7 0 A7 7 0 0 1 7 0" fill="#fff4b8" opacity=".75"/><path d="M0 0 L0 -7 M0 0 L-5 -5 M0 0 L5 -5" stroke="${c}" stroke-width="1"/></g>`; }
  if (g === 'beans') return `<g fill="#3b2215" stroke="#2a1a12" stroke-width=".8"><ellipse cx="54" cy="${top - 1}" rx="3.2" ry="2.2"/><ellipse cx="61" cy="${top - 2}" rx="3.2" ry="2.2" transform="rotate(20 61 ${top - 2})"/><ellipse cx="68" cy="${top - 1}" rx="3.2" ry="2.2" transform="rotate(-15 68 ${top - 1})"/></g>`;
  if (g === 'cinnamon') return `<g transform="translate(70 ${v.yt - 14}) rotate(18)"><rect x="-3" y="0" width="6" height="${36}" rx="2.5" fill="#8b4a22" stroke="#2a1a12" stroke-width="1.4"/><path d="M-1 3 V33" stroke="rgba(255,255,255,.3)"/></g>`;
  if (g === 'star') return `<g transform="translate(60 ${top - 1})" fill="#6b3a1e" stroke="#2a1a12" stroke-width=".8">${[0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="0" cy="-4" rx="1.8" ry="4" transform="rotate(${a})"/>`).join('')}</g>`;
  if (g === 'heart') return `<path d="M60 ${top + 6} c-6 -4 -9 -7 -9 -10 a4.5 4.5 0 0 1 9 -1.2 a4.5 4.5 0 0 1 9 1.2 c0 3 -3 6 -9 10 Z" fill="#fbf6ee" opacity=".95"/>`;
  if (g === 'leaf') return `<g transform="translate(66 ${v.yt - 4}) rotate(-30)"><path d="M0 0 Q8 -10 18 -4 Q8 4 0 0 Z" fill="#6d8a3b" stroke="#2a1a12" stroke-width="1.2"/></g>`;
  return '';
}
