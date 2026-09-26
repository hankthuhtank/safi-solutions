/* HouseEdge — casino props built in three.js: felt, cards, chips, dice, a to-scale roulette wheel and slot reels.
   Used live by the roulette wheel and offline (_source/render.html) to render the page's photographs.
   Units are metres, sized to regulation equipment: poker-size cards (63.5 × 88.9 mm), 39 mm clay chips,
   19 mm precision dice and a 32-inch roulette wheel. */
import * as THREE from '../assets/vendor/three.min.js';
import { RoomEnvironment, RoundedBoxGeometry } from '../assets/vendor/three.min.js';

export { THREE };
export const TAU = Math.PI * 2;
export const RED_NUMS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
/* pocket order, clockwise seen from above, starting at the green zero */
export const WHEELS = {
  european: ['0', 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26].map(String),
  american: ['0', 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, '00', 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2].map(String)
};
export const pocketColor = p => (p === '0' || p === '00') ? 'green' : RED_NUMS.has(+p) ? 'red' : 'black';
export const INK = { felt: '#0e5236', feltDeep: '#083624', red: '#a8150e', black: '#121212', green: '#0b6e40', ivory: '#f3ead7', gold: '#d9b566', gold2: '#f1d38e', cardRed: '#c3261f', cardBlack: '#161616' };

const SERIF = "'Bodoni Moda', 'Didot', 'Bodoni 72', Georgia, serif";
const SANS = "'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif";

/* ------------------------------------------------------------------ canvas textures */
const cache = new Map();
export function canvasTex(key, w, h, draw, { srgb = true, wrap = false, aniso = 8 } = {}) {
  if (key && cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  if (key) cache.set(key, t);
  return t;
}
function rand(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function grain(g, w, h, amt, seed = 7) {
  const img = g.getImageData(0, 0, w, h), d = img.data, r = rand(seed);
  for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/* suit glyphs as paths, centred on (0,0) with height ≈ s */
export function suitPath(g, suit, s) {
  const k = s / 100; g.save(); g.scale(k, k); g.beginPath();
  if (suit === 'H') { g.moveTo(0, 38); g.bezierCurveTo(-8, 28, -50, 4, -50, -18); g.bezierCurveTo(-50, -38, -34, -50, -24, -50); g.bezierCurveTo(-12, -50, -3, -43, 0, -32); g.bezierCurveTo(3, -43, 12, -50, 24, -50); g.bezierCurveTo(34, -50, 50, -38, 50, -18); g.bezierCurveTo(50, 4, 8, 28, 0, 38); }
  else if (suit === 'D') { g.moveTo(0, -50); g.quadraticCurveTo(18, -22, 40, 0); g.quadraticCurveTo(18, 22, 0, 50); g.quadraticCurveTo(-18, 22, -40, 0); g.quadraticCurveTo(-18, -22, 0, -50); }
  else if (suit === 'S') { g.moveTo(0, -50); g.bezierCurveTo(8, -36, 50, -14, 50, 10); g.bezierCurveTo(50, 28, 36, 38, 24, 38); g.bezierCurveTo(14, 38, 7, 32, 4, 24); g.quadraticCurveTo(6, 42, 16, 50); g.lineTo(-16, 50); g.quadraticCurveTo(-6, 42, -4, 24); g.bezierCurveTo(-7, 32, -14, 38, -24, 38); g.bezierCurveTo(-36, 38, -50, 28, -50, 10); g.bezierCurveTo(-50, -14, -8, -36, 0, -50); }
  else { // clubs
    g.arc(0, -24, 22, 0, TAU); g.moveTo(-2 + 24 + 22, 10); g.arc(24, 10, 22, 0, TAU); g.moveTo(-24 + 22, 10); g.arc(-24, 10, 22, 0, TAU);
    g.moveTo(-6, 4); g.lineTo(6, 4); g.quadraticCurveTo(6, 40, 16, 50); g.lineTo(-16, 50); g.quadraticCurveTo(-6, 40, -6, 4);
  }
  g.fill(); g.restore();
}

/* ------------------------------------------------------------------ cards */
const CARD_W = .0635, CARD_H = .0889, CARD_T = .0003;
const PIPS = { // [col(-1..1), row(0..1)] — rows below .5 are drawn inverted
  A: [[0, .5]], 2: [[0, 0], [0, 1]], 3: [[0, 0], [0, .5], [0, 1]], 4: [[-1, 0], [1, 0], [-1, 1], [1, 1]],
  5: [[-1, 0], [1, 0], [0, .5], [-1, 1], [1, 1]], 6: [[-1, 0], [1, 0], [-1, .5], [1, .5], [-1, 1], [1, 1]],
  7: [[-1, 0], [1, 0], [0, .25], [-1, .5], [1, .5], [-1, 1], [1, 1]], 8: [[-1, 0], [1, 0], [0, .25], [-1, .5], [1, .5], [0, .75], [-1, 1], [1, 1]],
  9: [[-1, 0], [1, 0], [-1, 1 / 3], [1, 1 / 3], [0, .5], [-1, 2 / 3], [1, 2 / 3], [-1, 1], [1, 1]],
  10: [[-1, 0], [1, 0], [0, 1 / 6], [-1, 1 / 3], [1, 1 / 3], [-1, 2 / 3], [1, 2 / 3], [0, 5 / 6], [-1, 1], [1, 1]]
};
export function cardFaceTexture(rank, suit) {
  return canvasTex(`card-${rank}${suit}`, 500, 700, (g, w, h) => {
    const red = suit === 'H' || suit === 'D', ink = red ? INK.cardRed : INK.cardBlack;
    g.fillStyle = '#f7f1e3'; g.fillRect(0, 0, w, h); grain(g, w, h, 6, rank.charCodeAt(0) * 7 + suit.charCodeAt(0));
    g.fillStyle = ink;
    const index = (flip) => {
      g.save(); if (flip) { g.translate(w, h); g.rotate(Math.PI); }
      g.font = `700 ${rank === '10' ? 58 : 66}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillText(rank, 48, 84); g.save(); g.translate(48, 122); suitPath(g, suit, 44); g.restore(); g.restore();
    };
    index(false); index(true);
    const court = { J: 1, Q: 1, K: 1 }[rank];
    if (court) {
      const x = 100, y = 110, cw = w - 200, ch = h - 220;
      g.strokeStyle = ink; g.lineWidth = 3; g.strokeRect(x, y, cw, ch);
      // quartered frame: gold, ink and a red/black band like printed court robes
      const band = red ? '#1f3a78' : '#b8261f';
      g.fillStyle = '#e7c46a'; g.fillRect(x + 8, y + 8, cw - 16, ch - 16);
      g.fillStyle = band; g.fillRect(x + 8, y + ch / 2 - 30, cw - 16, 60);
      g.fillStyle = ink; g.fillRect(x + 8, y + ch / 2 - 4, cw - 16, 8);
      g.fillStyle = '#f7f1e3'; g.fillRect(x + 26, y + 26, cw - 52, ch / 2 - 64); g.fillRect(x + 26, y + ch / 2 + 38, cw - 52, ch / 2 - 64);
      g.fillStyle = ink; g.font = `700 150px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(rank, w / 2, y + ch / 4 + 8);
      g.save(); g.translate(w / 2, y + ch * .75 - 8); g.rotate(Math.PI); g.fillText(rank, 0, 0); g.restore();
      g.save(); g.translate(x + cw - 50, y + 60); suitPath(g, suit, 48); g.restore();
      g.save(); g.translate(x + 50, y + ch - 60); g.rotate(Math.PI); suitPath(g, suit, 48); g.restore();
      return;
    }
    const pts = PIPS[rank] || PIPS.A, big = rank === 'A';
    const top = 150, bot = h - 150, cx = w / 2, dx = 108;
    pts.forEach(([c, r]) => {
      g.save(); g.translate(cx + c * dx, top + r * (bot - top)); if (r > .5) g.rotate(Math.PI);
      suitPath(g, suit, big ? 190 : 96); g.restore();
    });
  });
}
export function cardBackTexture() {
  return canvasTex('card-back', 500, 700, (g, w, h) => {
    g.fillStyle = '#f7f1e3'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7d1a17'; roundRect(g, 26, 26, w - 52, h - 52, 18); g.fill();
    g.save(); roundRect(g, 40, 40, w - 80, h - 80, 12); g.clip();
    g.strokeStyle = 'rgba(247,241,227,.55)'; g.lineWidth = 3;
    for (let i = -h; i < w + h; i += 26) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); }
    g.restore();
    g.strokeStyle = '#f7f1e3'; g.lineWidth = 4; roundRect(g, 40, 40, w - 80, h - 80, 12); g.stroke();
    g.fillStyle = '#7d1a17'; g.beginPath(); g.ellipse(w / 2, h / 2, 92, 92, 0, 0, TAU); g.fill();
    g.strokeStyle = '#e2c273'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#e2c273'; g.font = `700 74px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HE', w / 2, h / 2 + 4);
  });
}
let cardGeo = null;
function cardGeometry() {
  if (cardGeo) return cardGeo;
  const s = new THREE.Shape(), w = CARD_W, h = CARD_H, r = .0032, x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: CARD_T, bevelEnabled: false, curveSegments: 6 });
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  g.translate(0, 0, -CARD_T / 2); g.rotateX(-Math.PI / 2); // lie flat, face (+z cap) now points up (+y)
  cardGeo = g; return g;
}
const edgeMat = new THREE.MeshStandardMaterial({ color: 0xefe7d6, roughness: .7 });
/* cards lie flat, face up by default; front = the +y cap */
export function makeCard(rank, suit, { faceUp = true } = {}) {
  const geo = cardGeometry();
  const face = new THREE.MeshStandardMaterial({ map: cardFaceTexture(rank, suit), roughness: .42, metalness: 0 });
  const back = new THREE.MeshStandardMaterial({ map: cardBackTexture(), roughness: .45 });
  // ExtrudeGeometry groups: 0 = caps (front + back), 1 = sides. Split the caps so each side gets its own texture.
  const g = geo.clone(); g.clearGroups();
  const idx = g.index, capCount = geo.groups[0].count; // caps are first
  const tris = capCount / 3; let frontIdx = [], backIdx = [];
  const pos = g.attributes.position, arr = idx ? idx.array : null;
  for (let t = 0; t < tris; t++) {
    const a = arr ? arr[t * 3] : t * 3; (pos.getY(a) > 0 ? frontIdx : backIdx).push(t);
  }
  // rebuild index ordering: front caps, back caps, sides
  const newIdx = [], push = t => { for (let k = 0; k < 3; k++) newIdx.push(arr ? arr[t * 3 + k] : t * 3 + k); };
  frontIdx.forEach(push); backIdx.forEach(push);
  const sideStart = capCount, total = arr ? arr.length : pos.count;
  for (let i = sideStart; i < total; i++) newIdx.push(arr ? arr[i] : i);
  g.setIndex(newIdx);
  g.addGroup(0, frontIdx.length * 3, 0); g.addGroup(frontIdx.length * 3, backIdx.length * 3, 1); g.addGroup(capCount, total - capCount, 2);
  const m = new THREE.Mesh(g, [face, back, edgeMat]);
  m.castShadow = true; m.receiveShadow = true;
  if (!faceUp) m.rotation.z = Math.PI;
  const grp = new THREE.Group(); grp.add(m); grp.userData.card = `${rank}${suit}`;
  return grp;
}

/* ------------------------------------------------------------------ chips */
export const CHIP = { 1: { base: '#efe9dc', spot: '#1f4fa3', ink: '#1f4fa3' }, 5: { base: '#b32620', spot: '#f3ead7', ink: '#b32620' }, 25: { base: '#15714a', spot: '#f3ead7', ink: '#15714a' }, 100: { base: '#141414', spot: '#f3ead7', ink: '#141414' }, 1000: { base: '#d9a21f', spot: '#141414', ink: '#7a5200' } };
const CHIP_R = .0195, CHIP_H = .0033;
function chipTop(v) {
  const c = CHIP[v];
  return canvasTex(`chip-top-${v}`, 512, 512, (g, w) => {
    const R = w / 2; g.fillStyle = c.base; g.fillRect(0, 0, w, w);
    g.translate(R, R);
    for (let i = 0; i < 6; i++) { g.save(); g.rotate(i * TAU / 6); g.fillStyle = c.spot; g.fillRect(-34, -R, 68, 70); g.fillStyle = c.base; g.fillRect(-6, -R, 12, 70); g.restore(); }
    g.strokeStyle = c.spot; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, R - 86, 0, TAU); g.stroke();
    g.fillStyle = '#f5eedd'; g.beginPath(); g.arc(0, 0, R - 100, 0, TAU); g.fill();
    g.strokeStyle = c.ink; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, R - 116, 0, TAU); g.stroke();
    g.fillStyle = c.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${v >= 1000 ? 92 : 118}px ${SERIF}`; g.fillText(v >= 1000 ? '1000' : String(v), 0, 8);
    g.font = `600 22px ${SANS}`; const word = 'HOUSEEDGE · HOUSEEDGE · ';
    for (let i = 0; i < word.length; i++) { g.save(); g.rotate(-1.35 + i * .118); g.translate(0, -(R - 138)); g.fillText(word[i], 0, 0); g.restore(); }
    grain(g, w, w, 8, v);
  });
}
function chipSide(v) {
  const c = CHIP[v];
  return canvasTex(`chip-side-${v}`, 1024, 32, (g, w, h) => {
    g.fillStyle = c.base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { const x = (i + .5) * w / 6; g.fillStyle = c.spot; g.fillRect(x - 36, 0, 72, h); g.fillStyle = c.base; g.fillRect(x - 7, 0, 14, h); }
    grain(g, w, h, 10, v + 3);
  });
}
const chipGeo = new THREE.CylinderGeometry(CHIP_R, CHIP_R, CHIP_H, 64, 1);
export function makeChip(v = 25) {
  const side = new THREE.MeshStandardMaterial({ map: chipSide(v), roughness: .55 });
  const top = new THREE.MeshStandardMaterial({ map: chipTop(v), roughness: .5 });
  const m = new THREE.Mesh(chipGeo, [side, top, top]); m.castShadow = m.receiveShadow = true;
  return m;
}
export function makeStack(v, n, seed = 1) {
  const r = rand(seed * 97 + v), g = new THREE.Group();
  for (let i = 0; i < n; i++) { const c = makeChip(Array.isArray(v) ? v[i % v.length] : v); c.position.set((r() - .5) * .0016, CHIP_H * (i + .5), (r() - .5) * .0016); c.rotation.y = r() * TAU; g.add(c); }
  return g;
}

/* ------------------------------------------------------------------ dice (19 mm precision dice) */
function dieFace(n) {
  return canvasTex(`die-${n}`, 256, 256, (g, w) => {
    g.fillStyle = '#a3140f'; g.fillRect(0, 0, w, w);
    const P = { 1: [[.5, .5]], 2: [[.27, .27], [.73, .73]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]], 5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.27, .23], [.73, .23], [.27, .5], [.73, .5], [.27, .77], [.73, .77]] }[n];
    P.forEach(([x, y]) => { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x * w + 2, y * w + 3, 21, 0, TAU); g.fill(); g.fillStyle = '#fbf7ee'; g.beginPath(); g.arc(x * w, y * w, 20, 0, TAU); g.fill(); });
  });
}
const DIE_FACES = [3, 4, 1, 6, 2, 5]; // +x, -x, +y, -y, +z, -z  (opposite faces sum to 7)
export function makeDie(top = 1, spin = 0) {
  const s = .019, geo = new RoundedBoxGeometry(s, s, s, 3, .0009);
  const mats = DIE_FACES.map(n => new THREE.MeshPhysicalMaterial({ map: dieFace(n), roughness: .12, clearcoat: 1, clearcoatRoughness: .06, sheen: .2 }));
  const m = new THREE.Mesh(geo, mats); m.castShadow = true; m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m);
  const rot = { 1: [0, 0], 6: [Math.PI, 0], 2: [-Math.PI / 2, 0], 5: [Math.PI / 2, 0], 3: [0, Math.PI / 2], 4: [0, -Math.PI / 2] }[top];
  m.rotation.x = rot[0]; m.rotation.z = rot[1]; g.rotation.y = spin; g.position.y = s / 2;
  return g;
}

/* ------------------------------------------------------------------ materials */
function woodTex(key, dark = '#3b1c10', light = '#6d3a1e', w = 1024, h = 256, seed = 3) {
  return canvasTex(key, w, h, (g) => {
    g.fillStyle = dark; g.fillRect(0, 0, w, h);
    const r = rand(seed);
    for (let i = 0; i < 180; i++) { const y = r() * h, a = .05 + r() * .18; g.strokeStyle = `rgba(${r() > .5 ? '120,64,30' : '20,8,4'},${a})`; g.lineWidth = .6 + r() * 2.4; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * .004 + i) * 3 + (r() - .5) * 1.5); g.stroke(); }
    const lg = g.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, 'rgba(255,190,120,.06)'); lg.addColorStop(1, 'rgba(0,0,0,.12)'); g.fillStyle = lg; g.fillRect(0, 0, w, h);
    grain(g, w, h, 8, seed);
  }, { wrap: true });
}
export const MAT = {
  chrome: () => new THREE.MeshStandardMaterial({ color: 0xd9dde0, metalness: 1, roughness: .18 }),
  brass: () => new THREE.MeshStandardMaterial({ color: 0xd4ad62, metalness: 1, roughness: .26 }),
  wood: (key = 'wood-a', dark, light, seed) => new THREE.MeshPhysicalMaterial({ map: woodTex(key, dark, light, 1024, 256, seed), roughness: .38, clearcoat: .8, clearcoatRoughness: .12 }),
  leather: () => new THREE.MeshStandardMaterial({ color: 0x17110d, roughness: .62 })
};

/* ------------------------------------------------------------------ felt */
export function feltTexture(key, W, H, print, color = INK.felt) {
  return canvasTex(key, W, H, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    const rg = g.createRadialGradient(w * .5, h * .45, h * .05, w * .5, h * .5, Math.max(w, h) * .75);
    rg.addColorStop(0, 'rgba(255,255,255,.06)'); rg.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = rg; g.fillRect(0, 0, w, h);
    grain(g, w, h, 14, W + H);
    if (print) { g.save(); print(g, w, h); g.restore(); }
  });
}
export function makeFelt(w, d, tex, { rough = 1 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0 }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m;
}
/* text set along an arc, as printed on blackjack felt */
export function arcText(g, text, cx, cy, r, mid, { font, color, spacing = 1, up = true } = {}) {
  g.save(); g.font = font; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  const widths = [...text].map(ch => g.measureText(ch).width * spacing), total = widths.reduce((a, b) => a + b, 0);
  let a = mid - (up ? 1 : -1) * total / r / 2;
  [...text].forEach((ch, i) => {
    const step = widths[i] / r; a += (up ? 1 : -1) * step / 2;
    g.save(); g.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.rotate(a + (up ? Math.PI / 2 : -Math.PI / 2)); g.fillText(ch, 0, 0); g.restore();
    a += (up ? 1 : -1) * step / 2;
  });
  g.restore();
}

/* ------------------------------------------------------------------ roulette wheel (32-inch) */
function ringGeometry(n, r0, y0, r1, y1, seg = 4) {
  // annulus split into n × seg slices; u runs clockwise from 12 o'clock, v from inner (0) to outer (1)
  const N = n * seg, pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const a = i / N * TAU, s = Math.sin(a), c = -Math.cos(a);
    pos.push(r0 * s, y0, r0 * c, r1 * s, y1, r1 * c); uv.push(i / N, 0, i / N, 1);
    if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function numberRingTex(order) {
  return canvasTex(`numring-${order.length}`, 4096, 256, (g, w, h) => {
    const n = order.length, sw = w / n;
    order.forEach((p, i) => {
      const x = i * sw, col = pocketColor(p);
      g.fillStyle = col === 'red' ? INK.red : col === 'green' ? INK.green : INK.black; g.fillRect(x, 0, sw + 1, h);
      g.save(); g.translate(x + sw / 2, h * .56);
      g.fillStyle = '#f7f1e3'; g.font = `700 ${p.length > 1 ? 70 : 80}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.scale(p.length > 1 ? .78 : 1, 1); g.fillText(p, 0, 0); g.restore();
      g.fillStyle = '#d9b566'; g.fillRect(x - 2, 0, 4, h);
    });
    g.fillStyle = '#d9b566'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 12, w, 12);
    grain(g, w, h, 10, 11);
  });
}
function pocketTex(order) {
  return canvasTex(`pockets-${order.length}`, 2048, 64, (g, w, h) => {
    const n = order.length, sw = w / n;
    order.forEach((p, i) => { const col = pocketColor(p); g.fillStyle = col === 'red' ? '#96201a' : col === 'green' ? '#0a6139' : '#121212'; g.fillRect(i * sw, 0, sw + 1, h); });
    const lg = g.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, 'rgba(0,0,0,.35)'); lg.addColorStop(1, 'rgba(255,255,255,.06)'); g.fillStyle = lg; g.fillRect(0, 0, w, h);
  });
}
export const WHEEL = { trackR: .352, trackY: .077, pocketR: .232, pocketY: .03, rotorR: .305 };
export function makeWheel(type = 'european') {
  const order = WHEELS[type], n = order.length, root = new THREE.Group();
  const bowlWood = MAT.wood('wood-bowl', '#2c140b', '#5e301a', 5), trackWood = MAT.wood('wood-track', '#4a2412', '#7a4222', 9);
  bowlWood.side = THREE.DoubleSide; trackWood.side = THREE.DoubleSide;
  // stationary bowl: apron → ball track → back wall → rim → outer skirt
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const apron = new THREE.Mesh(new THREE.LatheGeometry([V2(.307, .036), V2(.322, .046), V2(.338, .058), V2(.35, .07), V2(.358, .079), V2(.364, .086)], 148), trackWood);
  const wall = new THREE.Mesh(new THREE.LatheGeometry([V2(.364, .086), V2(.368, .1), V2(.372, .112), V2(.376, .118), V2(.405, .12), V2(.418, .114), V2(.425, .09), V2(.425, 0)], 148), bowlWood);
  [apron, wall].forEach(m => { m.receiveShadow = true; m.castShadow = true; root.add(m); });
  // brass deflectors ("diamonds"), alternating vertical and horizontal
  const brass = MAT.brass();
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + TAU / 16, d = new THREE.Mesh(new THREE.OctahedronGeometry(.009, 0), brass);
    const vert = i % 2 === 0; d.scale.set(vert ? .55 : 1.6, .55, vert ? 1.6 : .55);
    d.position.set(Math.sin(a) * .33, .056, -Math.cos(a) * .33); d.rotation.y = -a; d.castShadow = true; root.add(d);
  }
  // rotor (wheel head)
  const rotor = new THREE.Group(); root.add(rotor);
  const numRing = new THREE.Mesh(ringGeometry(n, .262, .036, .305, .031, 6), new THREE.MeshPhysicalMaterial({ map: numberRingTex(order), roughness: .3, clearcoat: .7 }));
  const pockets = new THREE.Mesh(ringGeometry(n, .205, .02, .262, .02, 6), new THREE.MeshStandardMaterial({ map: pocketTex(order), roughness: .5 }));
  const pocketWall = new THREE.Mesh(new THREE.LatheGeometry([V2(.262, .02), V2(.262, .036)], 148), new THREE.MeshStandardMaterial({ color: 0x241208, roughness: .5, side: THREE.DoubleSide }));
  const coneWood = MAT.wood('wood-cone', '#3a1a0d', '#6b3a1d', 13); coneWood.side = THREE.DoubleSide;
  const cone = new THREE.Mesh(new THREE.LatheGeometry([V2(.205, .02), V2(.205, .036), V2(.17, .05), V2(.12, .066), V2(.07, .08), V2(.035, .088), V2(0, .09)], 148), coneWood);
  [numRing, pockets, pocketWall, cone].forEach(m => { m.receiveShadow = true; m.castShadow = true; rotor.add(m); });
  const chrome = MAT.chrome();
  const fretGeo = new THREE.BoxGeometry(.0022, .016, .058);
  for (let i = 0; i < n; i++) { const a = i / n * TAU, f = new THREE.Mesh(fretGeo, chrome); f.position.set(Math.sin(a) * .233, .028, -Math.cos(a) * .233); f.rotation.y = -a; f.castShadow = true; rotor.add(f); }
  // turret: spindle + four arms with ball ends
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(.012, .018, .06, 32), chrome); spindle.position.y = .115; rotor.add(spindle);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.016, 24, 16), chrome); cap.position.y = .148; rotor.add(cap);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU, arm = new THREE.Mesh(new THREE.CylinderGeometry(.0045, .0045, .1, 16), chrome);
    arm.rotation.z = Math.PI / 2; arm.position.set(Math.sin(a) * .05, .13, -Math.cos(a) * .05); arm.rotation.y = -a + Math.PI / 2; rotor.add(arm);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(.009, 20, 14), chrome); knob.position.set(Math.sin(a) * .1, .13, -Math.cos(a) * .1); rotor.add(knob);
  }
  rotor.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.0095, 32, 20), new THREE.MeshPhysicalMaterial({ color: 0xf8f6f0, roughness: .22, clearcoat: 1 }));
  ball.castShadow = true; ball.visible = false; root.add(ball);
  const pocketAngle = i => (i + .5) / n * TAU; // pocket i is centred on its slice; slices start at 12 o'clock
  return {
    group: root, rotor, ball, order, n,
    /* world angle (clockwise from 12 o'clock) of pocket i at the current rotor rotation */
    angleOf: i => pocketAngle(i) + rotorAngle(),
    placeBall(angle, r, y) { ball.visible = true; ball.position.set(Math.sin(angle) * r, y + .0095, -Math.cos(angle) * r); },
    setRotor(a) { rotor.rotation.y = -a; }
  };
  function rotorAngle() { return -rotor.rotation.y; }
}
/* height of the bowl / pockets at radius r (for the ball's path) */
export function surfaceY(r) {
  if (r >= .364) return .086; if (r >= .307) return .036 + (r - .307) / (.364 - .307) * .05;
  if (r >= .262) return .034; return .02;
}

/* ------------------------------------------------------------------ slot reels (three-reel stepper) */
const SYMBOLS = ['7', 'BAR', 'CHERRY', 'BAR2', 'BELL', 'BAR3', 'DIAMOND', 'BAR', 'CHERRY', '7', 'BELL', 'BAR2'];
function drawSymbol(g, s, x, y, k) {
  g.save(); g.translate(x, y); g.scale(k, k);
  if (s === '7') { g.fillStyle = '#c3261f'; g.strokeStyle = '#6b0f0b'; g.lineWidth = 6; g.font = `900 150px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('7', 0, 6); g.fillText('7', 0, 6); }
  else if (s.startsWith('BAR')) { const n = +(s[3] || 1); for (let i = 0; i < n; i++) { const yy = (i - (n - 1) / 2) * 44; g.fillStyle = '#141414'; roundRect(g, -76, yy - 19, 152, 38, 6); g.fill(); g.fillStyle = '#f7f1e3'; g.font = `800 26px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BAR', 0, yy + 1); } }
  else if (s === 'CHERRY') { g.strokeStyle = '#2f6b2a'; g.lineWidth = 7; g.beginPath(); g.moveTo(-26, 16); g.quadraticCurveTo(-10, -40, 22, -52); g.moveTo(28, 22); g.quadraticCurveTo(26, -20, 22, -52); g.stroke(); [[-30, 30], [30, 34]].forEach(([cx, cy]) => { g.fillStyle = '#b3241c'; g.beginPath(); g.arc(cx, cy, 30, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(cx - 10, cy - 10, 8, 0, TAU); g.fill(); }); }
  else if (s === 'BELL') { g.fillStyle = '#d9a21f'; g.beginPath(); g.moveTo(-50, 38); g.quadraticCurveTo(-44, -40, 0, -50); g.quadraticCurveTo(44, -40, 50, 38); g.closePath(); g.fill(); g.fillStyle = '#8a5e08'; g.fillRect(-56, 34, 112, 12); g.beginPath(); g.arc(0, 52, 11, 0, TAU); g.fill(); }
  else if (s === 'DIAMOND') { g.fillStyle = '#1f4fa3'; g.beginPath(); g.moveTo(0, -56); g.lineTo(54, 0); g.lineTo(0, 56); g.lineTo(-54, 0); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(0, -56); g.lineTo(20, 0); g.lineTo(0, 56); g.lineTo(-10, 0); g.closePath(); g.fill(); }
  g.restore();
}
function reelTex(offset) {
  return canvasTex(`reel-${offset}`, 2048, 256, (g, w, h) => {
    const stops = 24, sw = w / stops;
    g.fillStyle = '#f5f0e4'; g.fillRect(0, 0, w, h); grain(g, w, h, 6, offset + 5);
    for (let i = 0; i < stops; i++) {
      g.strokeStyle = 'rgba(0,0,0,.08)'; g.beginPath(); g.moveTo(i * sw, 0); g.lineTo(i * sw, h); g.stroke();
      if (i % 2) continue; // symbols on even stops, blanks between
      const s = SYMBOLS[(i / 2 + offset) % SYMBOLS.length];
      g.save(); g.translate(i * sw + sw / 2, h / 2); g.rotate(Math.PI / 2); drawSymbol(g, s, 0, 0, .98); g.restore();
    }
  });
}
export function makeReels({ show = [['7', 0], ['7', 0], ['BAR', 0]] } = {}) {
  const g = new THREE.Group(), R = .095, W = .07;
  for (let i = 0; i < 3; i++) {
    const tex = reelTex(i * 3);
    const reel = new THREE.Mesh(new THREE.CylinderGeometry(R, R, W, 96, 1, true), new THREE.MeshStandardMaterial({ map: tex, roughness: .55 }));
    reel.rotation.z = Math.PI / 2; reel.position.x = (i - 1) * .082;
    // rotate so the requested stop faces the viewer (+z)
    const stops = 24, want = show[i]?.[0];
    let stop = 0; for (let k = 0; k < stops; k += 2) if (SYMBOLS[(k / 2 + i * 3) % SYMBOLS.length] === want) { stop = k; break; }
    reel.userData.stop = stop;
    reel.rotateY(-(stop + .5) / stops * TAU + (show[i]?.[1] || 0));
    reel.receiveShadow = true; g.add(reel);
  }
  return g;
}

/* ------------------------------------------------------------------ renderer + lighting */
export function makeRenderer(canvas, { alpha = false, preserve = false } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: preserve, powerPreference: 'high-performance' });
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .92;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
  return r;
}
export function casinoLights(scene, renderer, { key = [0.6, 2.2, 0.9], target = [0, 0, 0], intensity = 14, env = .2, warm = 0xffe2b8, angle = .5 } = {}) {
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = env;
  const spot = new THREE.SpotLight(warm, intensity, 0, angle, .75, 1.2); spot.position.set(...key); spot.target.position.set(...target);
  spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -.00012; spot.shadow.normalBias = .002; spot.shadow.camera.near = .2; spot.shadow.camera.far = 6;
  scene.add(spot, spot.target);
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x06140d, .12));
  return spot;
}
