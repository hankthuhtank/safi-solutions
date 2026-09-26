/* Sports Atlas — 3D playing surfaces (three.js r186, vendored).
   Each scene is built from the same regulation geometry as the 2D plates (surfaces.js), rasterised onto the ground,
   then dressed with real-size props (goalposts, hoops, nets, mound, flagstick…), athletes and a broadcast tracer. */
import * as THREE from '../../../assets/vendor/three.min.js';
import { OrbitControls, RoomEnvironment, CSS2DRenderer, CSS2DObject } from '../../../assets/vendor/three.min.js';
import { surfaceSVG, PALETTES, textCanvas, FOOTBALL, BASKETBALL, SOCCER, VOLLEYBALL, BASES, GOLF, baseballFence, mulberry } from './surfaces.js';

const UNIT = { yd: 0.9144, ft: 0.3048, m: 1 };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 760px)').matches;

/* Team kits used by the athletes (broadcast "home / away"). */
const KIT = {
  home: { jersey: 0x1f5fbf, trim: 0xe9eef5, ring: 0x3d8bff },
  away: { jersey: 0xe9ecef, trim: 0xc8322b, ring: 0xff4d3d },
  keeperA: { jersey: 0xffd400, trim: 0x111111, ring: 0xffd400 },
  keeperB: { jersey: 0x19b36b, trim: 0x111111, ring: 0x19b36b },
  libero: { jersey: 0xffd400, trim: 0x1f5fbf, ring: 0xffd400 },
  ump: { jersey: 0x1d2229, trim: 0x1d2229, ring: 0x8892a0 }
};

/* ------------------------------------------------------------------ helpers */
function mat(color, o = {}) { return new THREE.MeshStandardMaterial({ color, roughness: o.r ?? .55, metalness: o.m ?? 0, ...o.extra }); }
async function rasterSurface(sport, px) {
  const pal = PALETTES[sport].texture;
  const { spec, markup } = surfaceSVG(sport, pal, { px, planks: sport === 'basketball', trees: false });
  const [bx, by, bw, bh] = spec.bounds;
  const W = px, H = Math.round(px * bh / bw);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const img = new Image();
  img.decoding = 'async';
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
  await img.decode();
  ctx.drawImage(img, 0, 0, W, H);
  const s = W / bw;
  const map = { s, pt: (x, y) => [(x - bx) * s, (y - by) * s] };
  try { await document.fonts.load('800 40px "Big Shoulders"'); } catch (e) { /* fall back to Arial Narrow */ }
  textCanvas(ctx, spec, map);
  // subtle turf / wood grain noise so the surface does not read as flat vector
  const rnd = mulberry(11), n = Math.round(W * H / 90);
  ctx.globalAlpha = sport === 'basketball' ? .05 : .07;
  for (let i = 0; i < n; i++) { ctx.fillStyle = rnd() < .5 ? '#000' : '#fff'; ctx.fillRect(rnd() * W, rnd() * H, 1.2, 1.2); }
  ctx.globalAlpha = 1;
  return { cv, spec };
}

/* A stylised, broadcast-style athlete: neutral "mannequin" head, team jersey, tracking ring at the feet. */
function athlete(kit, o = {}) {
  const grp = new THREE.Group();
  const H = o.h || 1.85, helmet = !!o.helmet;
  const jersey = mat(kit.jersey, { r: .6 }), trim = mat(kit.trim, { r: .6 });
  const skin = mat(0xb9bec6, { r: .45 });
  const leg = new THREE.CapsuleGeometry(.085 * H / 1.85, .6 * H / 1.85, 4, 10);
  for (const s of [-1, 1]) { const m = new THREE.Mesh(leg, trim); m.position.set(s * .1, .42 * H / 1.85, 0); m.castShadow = true; grp.add(m); }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.17 * H / 1.85, .36 * H / 1.85, 5, 14), jersey);
  torso.position.y = 1.12 * H / 1.85; torso.scale.set(helmet ? 1.35 : 1.12, 1, .78); torso.castShadow = true; grp.add(torso);
  const arm = new THREE.CapsuleGeometry(.058 * H / 1.85, .46 * H / 1.85, 4, 8);
  for (const s of [-1, 1]) { const m = new THREE.Mesh(arm, jersey); m.position.set(s * (helmet ? .3 : .25), 1.08 * H / 1.85, 0); m.rotation.z = s * .16; m.castShadow = true; grp.add(m); }
  const head = new THREE.Mesh(new THREE.SphereGeometry((helmet ? .16 : .12) * H / 1.85, 18, 14), helmet ? mat(kit.jersey, { r: .25, m: .15 }) : skin);
  head.position.y = 1.63 * H / 1.85; head.castShadow = true; grp.add(head);
  if (helmet) { const stripe = new THREE.Mesh(new THREE.TorusGeometry(.162, .012, 6, 24, Math.PI), mat(kit.trim)); stripe.rotation.set(0, Math.PI / 2, 0); stripe.position.y = 1.63; grp.add(stripe); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(.36, .46, 32), new THREE.MeshBasicMaterial({ color: kit.ring, transparent: true, opacity: .9 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .02; grp.add(ring);
  grp.userData.label = o.label || '';
  return grp;
}

/* Night-sky / dusk dome */
function skyDome(top, bottom, radius = 900, mid) {
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 256;
  const c = cv.getContext('2d'); const gr = c.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, top); if (mid) gr.addColorStop(.4, mid); gr.addColorStop(.5, bottom); gr.addColorStop(1, bottom);
  c.fillStyle = gr; c.fillRect(0, 0, 16, 256);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }));
  return m;
}

/* Crowd texture: dense, randomised specks on dark risers. */
function crowdTexture(seed = 3, light = false) {
  const W = 1024, H = 512, rows = 40, rh = H / rows;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d'); const rnd = mulberry(seed);
  c.fillStyle = light ? '#23282e' : '#0c0f12'; c.fillRect(0, 0, W, H);
  const cols = ['#d9dde2', '#b8322b', '#1f4f9f', '#c9a400', '#2a323b', '#46505b', '#6b7480', '#27364a', '#8b939d', '#5b2a2a'];
  for (let r = 0; r < rows; r++) {
    const y = r * rh, fade = .45 + .55 * (r / rows); // rows nearer the field (bottom of texture) are brighter
    c.fillStyle = '#05070a'; c.fillRect(0, y + rh - 2, W, 2);
    for (let x = 2; x < W; x += 7 + rnd() * 2) {
      if (rnd() < .12) continue; // empty seat
      c.globalAlpha = (.35 + rnd() * .45) * fade;
      c.fillStyle = cols[Math.floor(rnd() * cols.length)];
      c.fillRect(x, y + rh * .38, 4.6, rh * .5);           // body
      c.fillStyle = rnd() < .5 ? '#c9b8a6' : '#7a5a44'; c.globalAlpha *= .9;
      c.fillRect(x + 1, y + rh * .12, 2.6, rh * .26);        // head
    }
  }
  c.globalAlpha = 1;
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/* Seating bowl around a superellipse (a, b = inner half-extents in metres). */
function bowl(a, b, depth, rise, o = {}) {
  const segU = 220, segV = 10, n = o.n || 4, y0 = o.y0 ?? 1.2;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segU; i++) {
    const t = i / segU * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    const ex = Math.sign(c) * Math.abs(c) ** (2 / n), ez = Math.sign(s) * Math.abs(s) ** (2 / n);
    for (let j = 0; j <= segV; j++) {
      const v = j / segV;
      pos.push((a + depth * v) * ex, y0 + rise * v + (j % 2 ? .0 : 0), (b + depth * v) * ez);
      uv.push(i / segU * (o.repeat || 24), 1 - v * (o.repeatV || 1));
    }
  }
  for (let i = 0; i < segU; i++) for (let j = 0; j < segV; j++) {
    const k = i * (segV + 1) + j; idx.push(k, k + segV + 1, k + 1, k + 1, k + segV + 1, k + segV + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: crowdTexture(o.seed || 3, o.light), roughness: .95, side: THREE.DoubleSide }));
  const grp = new THREE.Group(); grp.add(m);
  // wall / fascia at the front of the bowl
  const wallPts = [];
  for (let i = 0; i <= segU; i++) { const t = i / segU * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); wallPts.push(new THREE.Vector3(a * Math.sign(c) * Math.abs(c) ** (2 / n), 0, b * Math.sign(s) * Math.abs(s) ** (2 / n))); }
  const wg = new THREE.BufferGeometry(); const wp = [];
  wallPts.forEach(p => { wp.push(p.x, 0, p.z, p.x, y0, p.z); });
  const wi = []; for (let i = 0; i < segU; i++) { const k = i * 2; wi.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setIndex(wi); wg.computeVertexNormals();
  grp.add(new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: o.fascia || 0x14191e, roughness: .8, side: THREE.DoubleSide })));
  // LED ribbon board
  const rb = new THREE.BufferGeometry(); const rp = [];
  wallPts.forEach(p => { rp.push(p.x * 1.0005, y0 * .35, p.z * 1.0005, p.x * 1.0005, y0 * .8, p.z * 1.0005); });
  rb.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rb.setIndex(wi); rb.computeVertexNormals();
  grp.add(new THREE.Mesh(rb, new THREE.MeshBasicMaterial({ color: o.ribbon || 0x0b2a4a, side: THREE.DoubleSide, fog: true })));
  return grp;
}

/* Floodlight tower with glowing lamp bank. */
function lightTower(x, z, h, face) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.35, .6, h, 10), mat(0x2a3138, { r: .7, m: .3 }));
  pole.position.y = h / 2; g.add(pole);
  const bank = new THREE.Mesh(new THREE.BoxGeometry(7, 4.2, .6), new THREE.MeshStandardMaterial({ color: 0x20262c, emissive: 0xfff4d6, emissiveIntensity: 2.2, roughness: .4 }));
  bank.position.y = h + 2; bank.lookAt(face.x, h * .2, face.z); g.add(bank);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfff1cf, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  glow.scale.set(34, 34, 1); glow.position.y = h + 2; g.add(glow);
  g.position.set(x, 0, z);
  return g;
}
let _glow;
function glowTexture() {
  if (_glow) return _glow;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,244,214,.55)'); gr.addColorStop(1, 'rgba(255,244,214,0)');
  c.fillStyle = gr; c.fillRect(0, 0, 128, 128); _glow = new THREE.CanvasTexture(cv); return _glow;
}

/* Broadcast-style ball tracer: a growing tube along a curve with a travelling ball. */
function tracer(curve, color = 0xff3b30, radius = .09) {
  const grp = new THREE.Group();
  const tubeMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .95, toneMapped: false });
  const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .22, toneMapped: false, depthWrite: false });
  const segs = 140;
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, radius, 8, false), tubeMat);
  const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, radius * 3.2, 8, false), glowMat);
  const idxCount = tube.geometry.index.count, haloCount = halo.geometry.index.count;
  grp.add(halo, tube);
  return {
    group: grp,
    set(t) { const k = Math.max(0, Math.min(1, t)); tube.geometry.setDrawRange(0, Math.floor(idxCount * k / 6) * 6); halo.geometry.setDrawRange(0, Math.floor(haloCount * k / 6) * 6); return curve.getPoint(k); }
  };
}

/* ------------------------------------------------------------------ sport builders */
/* Each returns { cx, cy (focus in surface units), views, props(scene,k,toWorld), actors, play(t) } */
const SPORTS = {
  football: {
    center: [60, FOOTBALL.W / 2], px: 4096,
    sky: ['#04070b', '#101a24'],
    views: { broadcast: [0, 30, 62], allTwentyTwo: [-62, 38, 0], sky: [0, 95, 8], endzone: [-78, 14, 0] },
    view: 'broadcast', target: [-8, 0, 0], wideShift: -20,
    build(ctx) {
      const { add, W, k } = ctx;
      // goalposts: 10-ft crossbar, 18'6" between uprights, uprights rise 35 ft above the crossbar
      const post = mat(0xffd400, { r: .35, m: .2 });
      for (const x of [0, 120]) {
        const d = x === 0 ? -1 : 1, g = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 3.05, 12), post); base.position.set(d * 1.8, 1.52, 0); g.add(base);
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.8, 10), post); neck.rotation.z = Math.PI / 2; neck.position.set(d * .9, 3.05, 0); g.add(neck);
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 5.64, 10), post); bar.rotation.x = Math.PI / 2; bar.position.set(0, 3.05, 0); g.add(bar);
        for (const s of [-1, 1]) { const up = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 10.67, 10), post); up.position.set(0, 3.05 + 5.33, s * 2.82); g.add(up); }
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 1.8, 12), mat(0x1f5fbf)); pad.position.set(d * 1.8, .9, 0); g.add(pad);
        g.position.copy(ctx.w(x, W / 2)); g.traverse(o => o.castShadow = true); add(g);
      }
      // pylons (4 in × 18 in)
      for (const x of [0, 10, 110, 120]) for (const y of [0, W]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.1, .46, .1), mat(0xff7a1a)); p.position.copy(ctx.w(x, y)); p.position.y = .23; add(p); }
      // broadcast lines: line of scrimmage (blue) and line to gain (yellow)
      const strip = (x, color) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.2, W * k), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .92, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.copy(ctx.w(x, W / 2)); m.position.y = .03; add(m); return m; };
      strip(45, 0x2f7cf6); strip(55, 0xffd400);
      // 11 personnel, trips right vs. a two-high nickel look — offense attacks to the right
      const O = [['C', 44.4, 26.67], ['LG', 44.4, 25.4], ['RG', 44.4, 27.94], ['LT', 44.3, 24.1], ['RT', 44.3, 29.2], ['TE', 44.2, 30.5], ['QB', 40, 26.67], ['RB', 40.2, 28.2], ['X', 44.6, 9.5], ['SL', 44, 38], ['Z', 44.6, 45.5]];
      const D = [['DE', 46.2, 23.2], ['DT', 46.1, 25.9], ['DT', 46.1, 28.5], ['DE', 46.2, 31.4], ['MIKE', 50.2, 24.8], ['WILL', 50.2, 29.4], ['CB', 51, 9.5], ['NB', 49.5, 38.3], ['CB', 51, 45.5], ['FS', 57.5, 19], ['SS', 57.5, 35]];
      O.forEach(([l, x, y]) => ctx.player(KIT.home, x, y, { helmet: true, label: l, face: 1 }));
      D.forEach(([l, x, y]) => ctx.player(KIT.away, x, y, { helmet: true, label: l, face: -1 }));
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.11, 16, 12), mat(0x7a3f1d, { r: .5 })); ball.scale.set(1.6, 1, 1); ball.castShadow = true; add(ball); ball.position.copy(ctx.w(40, 26.67)).setY(1.5);
      // pass tracer: QB → deep right sideline
      const qb = ctx.w(40, 26.67), tgt = ctx.w(66, 43);
      const curve = new THREE.QuadraticBezierCurve3(qb.clone().setY(2.1), new THREE.Vector3((qb.x + tgt.x) / 2, 13, (qb.z + tgt.z) / 2), tgt.clone().setY(1.6));
      ctx.addTracer(curve, 0xffd400, { every: 7, dur: 2.2, ball });
    }
  },
  basketball: {
    center: [47, 25], px: 4096,
    sky: ['#05070a', '#0e141b'],
    views: { broadcast: [0, 11.5, 21], baseline: [22, 6, 0], sky: [0, 36, 3] },
    view: 'broadcast', target: [4, 0, 0], wideShift: -6,
    build(ctx) {
      const { add } = ctx;
      for (const flip of [false, true]) {
        const g = new THREE.Group(), d = flip ? -1 : 1;
        const rimX = flip ? 94 - 5.25 : 5.25, boardX = flip ? 94 - 4 : 4;
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 1.7), mat(0x1c2127)); base.position.copy(ctx.w(flip ? 94 + 3.5 : -3.5, 25)); base.position.y = .6; add(base);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.3, .14, .14), mat(0x2a3138, { m: .4 })); arm.position.copy(ctx.w(flip ? 94 + 1.6 : -1.6, 25)); arm.position.y = 3.3; arm.rotation.z = d * -.35; add(arm);
        const pole = new THREE.Mesh(new THREE.BoxGeometry(.16, 3.3, .16), mat(0x2a3138, { m: .4 })); pole.position.copy(ctx.w(flip ? 94 + 3.5 : -3.5, 25)); pole.position.y = 1.65 + .8; add(pole);
        const board = new THREE.Mesh(new THREE.BoxGeometry(.03, 1.07, 1.83), new THREE.MeshStandardMaterial({ color: 0xdfe8f0, roughness: .08, metalness: .1, transparent: true, opacity: .28 }));
        board.position.copy(ctx.w(boardX, 25)); board.position.y = 3.05 + .3; add(board);
        const frame = new THREE.LineSegments(new THREE.EdgesGeometry(board.geometry), new THREE.LineBasicMaterial({ color: 0xffffff })); frame.position.copy(board.position); add(frame);
        const sq = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.001, .45, .61)), new THREE.LineBasicMaterial({ color: 0xffffff })); sq.position.copy(board.position); sq.position.y = 3.05 + .15 + .22 - .08; add(sq);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(.2286, .012, 8, 32), mat(0xff5a1a, { r: .35, m: .3 })); rim.rotation.x = Math.PI / 2; rim.position.copy(ctx.w(rimX, 25)); rim.position.y = 3.05; add(rim);
        const net = new THREE.Mesh(new THREE.CylinderGeometry(.2286, .14, .42, 16, 4, true), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: .75 })); net.position.copy(rim.position); net.position.y = 3.05 - .21; add(net);
        g.traverse(o => o.castShadow = true);
      }
      // 5-out pick-and-roll: offense attacks the right basket
      const O = [['PG', 66, 26], ['C', 67.6, 22.2], ['SG', 91, 46.6], ['SF', 76, 4.5], ['PF', 79, 44]];
      const D = [['', 68, 26.3], ['', 73.5, 24.5], ['', 86.5, 41.5], ['', 78.5, 10], ['', 82.5, 36]];
      O.forEach(([l, x, y]) => ctx.player(KIT.home, x, y, { h: 2.0, label: l, face: 1 }));
      D.forEach(([l, x, y]) => ctx.player(KIT.away, x, y, { h: 2.0, label: l, face: -1 }));
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.12, 20, 14), mat(0xe0662b, { r: .6 })); ball.castShadow = true; add(ball);
      const from = ctx.w(76, 4.5).setY(2.4), rim = ctx.w(94 - 5.25, 25).setY(3.1);
      ctx.addTracer(new THREE.QuadraticBezierCurve3(from, new THREE.Vector3((from.x + rim.x) / 2, 6.2, (from.z + rim.z) / 2), rim), 0xff7a1a, { every: 6, dur: 1.4, ball, radius: .05 });
    }
  },
  soccer: {
    center: [52.5, 34], px: 4096,
    sky: ['#04070b', '#0f1a22'],
    views: { broadcast: [0, 44, 70], behindGoal: [-78, 16, 0], sky: [0, 118, 6] },
    view: 'broadcast', target: [0, 0, 4], wideShift: -16,
    build(ctx) {
      const { add } = ctx;
      const white = mat(0xffffff, { r: .3 });
      for (const flip of [false, true]) {
        const g = new THREE.Group(), x = flip ? 105 : 0, d = flip ? 1 : -1;
        for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.44, 12), white); p.position.set(0, 1.22, s * 3.66); g.add(p); }
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 7.44, 12), white); bar.rotation.x = Math.PI / 2; bar.position.y = 2.44; g.add(bar);
        const net = new THREE.Mesh(new THREE.BoxGeometry(2, 2.44, 7.32, 6, 6, 18), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: .35 }));
        net.position.set(d * 1, 1.22, 0); g.add(net);
        g.position.copy(ctx.w(x, 34)); g.traverse(o => o.castShadow = true); add(g);
      }
      for (const x of [0, 105]) for (const y of [0, 68]) {
        const f = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 1.5, 6), mat(0xffffff)); pole.position.y = .75; f.add(pole);
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(.45, .35), new THREE.MeshStandardMaterial({ color: 0xffd400, side: THREE.DoubleSide })); flag.position.set(.22, 1.32, 0); f.add(flag);
        f.position.copy(ctx.w(x, y)); add(f);
      }
      // 4-3-3 (home, attacking right) vs. 4-4-2 mid-block (away)
      const A = [['GK', 6, 34, KIT.keeperA], ['LB', 31, 9], ['CB', 27, 26], ['CB', 27, 42], ['RB', 31, 59], ['8', 45, 21], ['6', 40, 34], ['8', 45, 47], ['LW', 63, 10], ['9', 66, 34], ['RW', 63, 58]];
      const B = [['GK', 99.5, 34, KIT.keeperB], ['RB', 75, 12], ['CB', 76.5, 28], ['CB', 76.5, 40], ['LB', 75, 56], ['RM', 62, 14], ['CM', 60.5, 29], ['CM', 60.5, 39], ['LM', 62, 54], ['ST', 50, 29], ['ST', 50, 41]];
      A.forEach(([l, x, y, kit]) => ctx.player(kit || KIT.home, x, y, { h: 1.8, label: l, face: 1 }));
      B.forEach(([l, x, y, kit]) => ctx.player(kit || KIT.away, x, y, { h: 1.8, label: l, face: -1 }));
      const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(.11, 2), mat(0xffffff, { r: .4 })); ball.castShadow = true; add(ball);
      // switch of play: 6 → right winger
      const a = ctx.w(40, 34).setY(.2), b = ctx.w(63, 58).setY(.2);
      ctx.addTracer(new THREE.QuadraticBezierCurve3(a, new THREE.Vector3((a.x + b.x) / 2, 9, (a.z + b.z) / 2), b), 0x5bd6ff, { every: 6.5, dur: 1.8, ball, radius: .07 });
    }
  },
  volleyball: {
    center: [9, 4.5], px: 3072,
    sky: ['#05070b', '#0f1620'],
    views: { broadcast: [2, 8.5, 19.5], endline: [-17, 6.2, 0], sky: [0, 29, 2] },
    view: 'broadcast', target: [0, .9, 0], wideShift: -3.5,
    build(ctx) {
      const { add } = ctx;
      const net = new THREE.Group();
      for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.55, 12), mat(0xdfe4ea, { m: .3, r: .4 })); p.position.set(0, 1.275, s * 5.5); net.add(p); }
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, .95, 100, 10), new THREE.MeshBasicMaterial({ color: 0x0c0f12, wireframe: true, transparent: true, opacity: .9 }));
      mesh.rotation.y = Math.PI / 2; mesh.position.y = 2.43 - .475 - .05; net.add(mesh);
      const band = new THREE.Mesh(new THREE.BoxGeometry(.02, .07, 10), mat(0xffffff)); band.position.y = 2.43 - .035; net.add(band);
      const band2 = band.clone(); band2.position.y = 2.43 - .95; net.add(band2);
      for (const s of [-1, 1]) {
        const ant = new THREE.Group();
        for (let i = 0; i < 18; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(.005, .005, .1, 6), mat(i % 2 ? 0xffffff : 0xe5382b)); seg.position.y = .05 + i * .1; ant.add(seg); }
        ant.position.set(0, 2.43 - 1, s * 4.5); net.add(ant);
      }
      net.position.copy(ctx.w(9, 4.5)); net.traverse(o => o.castShadow = true); add(net);
      // receiving team (left, facing +x) and serving team (right, server behind the end line)
      const A = [['OH', 3.6, 1.6], ['L', 3.4, 4.5, KIT.libero], ['OH', 3.6, 7.4], ['MB', 7.6, 2.4], ['S', 7.9, 7.9], ['OPP', 6.2, 5.9]];
      const B = [['2', 10.3, 1.6], ['3', 10.3, 4.5], ['4', 10.3, 7.4], ['5', 15.4, 7.3], ['6', 15.6, 4.5], ['1', 21.2, 1.4]];
      A.forEach(([l, x, y, kit]) => ctx.player(kit || KIT.home, x, y, { h: 1.95, label: l, face: 1 }));
      B.forEach(([l, x, y]) => ctx.player(KIT.away, x, y, { h: 1.95, label: l, face: -1 }));
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.105, 20, 14), mat(0xf2d34a, { r: .5 })); ball.castShadow = true; add(ball);
      const a = ctx.w(21.2, 1.4).setY(2.9), b = ctx.w(3.4, 4.5).setY(.9);
      ctx.addTracer(new THREE.QuadraticBezierCurve3(a, new THREE.Vector3((a.x + b.x) / 2 + 2, 4.4, (a.z + b.z) / 2), b), 0xffd400, { every: 5.5, dur: 1.3, ball, radius: .035 });
    }
  },
  baseball: {
    center: [0, -150], px: 4096,
    sky: ['#04070b', '#0f1822'],
    views: { behindHome: [0, 34, 88], centerfield: [0, 13, -70], sky: [0, 170, 6] },
    view: 'behindHome', target: [0, 0, -8], wideShift: -22,
    build(ctx) {
      const { add, k } = ctx;
      // mound: 18 ft diameter, 10 in high
      const mound = new THREE.Mesh(new THREE.CylinderGeometry(9 * k * .82, 9 * k, .254, 40), mat(0xb8703d, { r: .95 })); mound.position.copy(ctx.w(0, -59)); mound.position.y = .127; mound.receiveShadow = true; add(mound);
      const rubber = new THREE.Mesh(new THREE.BoxGeometry(.61, .03, .15), mat(0xffffff)); rubber.position.copy(ctx.w(0, -60.75)); rubber.position.y = .27; add(rubber);
      for (const b of [BASES.first, BASES.second, BASES.third]) { const bag = new THREE.Mesh(new THREE.BoxGeometry(.457, .1, .457), mat(0xffffff, { r: .6 })); bag.position.copy(ctx.w(b[0], b[1])); bag.position.y = .05; bag.rotation.y = Math.PI / 4; bag.castShadow = true; add(bag); }
      // outfield wall along the fence line (8 ft) and foul poles
      const fence = baseballFence(64).map(([x, y]) => ctx.w(x, y));
      const wp = [], wi = [];
      fence.forEach(p => wp.push(p.x, 0, p.z, p.x, 2.44, p.z));
      for (let i = 0; i < fence.length - 1; i++) { const q = i * 2; wi.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setIndex(wi); wg.computeVertexNormals();
      add(new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: 0x173d27, roughness: .9, side: THREE.DoubleSide })));
      const tp = []; fence.forEach(p => tp.push(p.x, 2.44, p.z, p.x, 2.64, p.z));
      const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setIndex(wi); tg.computeVertexNormals();
      add(new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ color: 0xffd400, emissive: 0x332800, side: THREE.DoubleSide })));
      for (const p of [fence[0], fence[fence.length - 1]]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 22, 10), mat(0xffd400, { r: .3 })); pole.position.set(p.x, 11, p.z); add(pole); }
      // outfield bleachers and the grandstand behind home
      const stands = (pts, depth, rise, seed) => {
        const pos = [], uv = [], idx = [], seg = pts.length - 1;
        pts.forEach((p, i) => { const n = new THREE.Vector3(p.x, 0, p.z).sub(new THREE.Vector3(0, 0, ctx.w(0, -150).z)).setY(0).normalize(); for (let j = 0; j <= 6; j++) { const v = j / 6; pos.push(p.x + n.x * depth * v, 2.6 + rise * v, p.z + n.z * depth * v); uv.push(i / seg * 14, v * 1.4); } });
        for (let i = 0; i < seg; i++) for (let j = 0; j < 6; j++) { const q = i * 7 + j; idx.push(q, q + 7, q + 1, q + 1, q + 7, q + 8); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
        return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: crowdTexture(seed), roughness: .95, side: THREE.DoubleSide }));
      };
      add(stands(fence, 34, 16, 5));
      const home = []; for (let i = 0; i <= 48; i++) { const a = -Math.PI * .62 + Math.PI * 1.24 * i / 48; home.push(ctx.w(Math.sin(a) * 92, Math.cos(a) * 92 - 6)); }
      add(stands(home.reverse(), 30, 13, 9));
      // defence in standard alignment (shift rule: two infielders each side of 2B), batter & catcher
      const polar = (d, deg) => [d * Math.sin(deg * Math.PI / 180), -d * Math.cos(deg * Math.PI / 180)];
      const F = [['P', 0, -59.6], ['C', 0, 3.2], ['1B', ...polar(108, 39)], ['2B', ...polar(148, 17)], ['SS', ...polar(146, -17)], ['3B', ...polar(112, -39)], ['LF', ...polar(285, -28)], ['CF', ...polar(318, 0)], ['RF', ...polar(285, 28)]];
      F.forEach(([l, x, y]) => ctx.player(KIT.away, x, y, { h: 1.85, label: l, face: l === 'C' ? -1 : 1, z: true }));
      ctx.player(KIT.home, -3.3, -1, { h: 1.88, label: 'BATTER', face: 0 });
      ctx.player(KIT.ump, 0, 6.2, { h: 1.85, label: 'UMP', face: -1, z: true });
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.0366 * 2.2, 16, 12), mat(0xffffff, { r: .5 })); add(ball);
      // batted-ball tracer into the right-centre gap
      const a = ctx.w(0, -1.5).setY(1), b = ctx.w(...polar(372, 16)).setY(4);
      ctx.addTracer(new THREE.QuadraticBezierCurve3(a, new THREE.Vector3((a.x + b.x) / 2, 34, (a.z + b.z) / 2), b), 0xff3b30, { every: 7, dur: 2.6, ball, radius: .12 });
    }
  },
  golf: {
    center: [0, -240], px: 3072,
    sky: ['#24497a', '#f1cfa8', '#8fb2d6'], day: true,
    views: { tee: [-2, 7, 236], flyover: [-110, 140, 140], green: [58, 18, -150], sky: [0, 470, 10] },
    view: 'tee', target: [8, 0, 40], wideShift: -14,
    build(ctx) {
      const { add, k, scene } = ctx;
      // flagstick (7 ft) with flag
      const pin = ctx.w(...GOLF.pin);
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 2.13, 8), mat(0xffffff)); stick.position.set(pin.x, 1.07 + ctx.h(pin), pin.z); add(stick);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(.5, .35, 8, 2), new THREE.MeshStandardMaterial({ color: 0xffd400, side: THREE.DoubleSide })); flag.position.set(pin.x + .25, 1.95 + ctx.h(pin), pin.z); add(flag);
      ctx.onTick(t => { const p = flag.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(t * 5 + x * 9) * .04 * (x + .25)); } p.needsUpdate = true; });
      // trees along both sides
      const rnd = mulberry(7);
      const trunk = new THREE.CylinderGeometry(.25, .35, 3, 6), crown = new THREE.IcosahedronGeometry(3.6, 1);
      const tM = mat(0x4a3627, { r: .9 }), cM = mat(0x2a5a2c, { r: .9, extra: { flatShading: true } }), cM2 = mat(0x356b32, { r: .9, extra: { flatShading: true } });
      for (let i = 0; i < 140; i++) {
        const y = -455 + rnd() * 455, side = rnd() < .55 ? -1 : 1;
        const x = side < 0 ? -80 + rnd() * 20 : 64 + rnd() * 16;
        if (side < 0 && y < -290 && y > -400) continue;
        const p = ctx.w(x, y), s = .75 + rnd() * .8, g = new THREE.Group();
        const tr = new THREE.Mesh(trunk, tM); tr.position.y = 1.5; g.add(tr);
        const cr = new THREE.Mesh(crown, rnd() < .5 ? cM : cM2); cr.position.y = 5.4; cr.scale.set(1, 1.25, 1); g.add(cr);
        g.scale.setScalar(s); g.position.set(p.x, ctx.h(p) - .2, p.z); g.rotation.y = rnd() * 6; g.traverse(o => o.castShadow = true); add(g);
      }
      // tee markers
      for (const t of GOLF.tees) for (const sx of [-3.5, 3.5]) { const p = ctx.w(sx, t.y - 2); const m = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 8), mat(new THREE.Color(t.c).getHex(), { r: .4 })); m.position.set(p.x, ctx.h(p) + .15, p.z); add(m); }
      const golfer = ctx.player({ jersey: 0x1d2229, trim: 0xd9dde2, ring: 0xffd400 }, -1.6, -8, { h: 1.8, label: 'PLAYER', face: 0 });
      // tee shot + approach tracers (Toptracer style)
      const tee = ctx.w(0, -8); tee.y = ctx.h(tee) + .05;
      const land = ctx.w(14, -270); land.y = ctx.h(land);
      const g = ctx.w(...GOLF.pin); g.y = ctx.h(g);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.2, 14, 10), mat(0xffffff, { r: .3 })); ball.castShadow = true; add(ball);
      const drive = new THREE.CubicBezierCurve3(tee, new THREE.Vector3(tee.x - 2, 34, tee.z - 110), new THREE.Vector3(land.x + 6, 30, land.z + 40), land);
      const approach = new THREE.QuadraticBezierCurve3(land.clone(), new THREE.Vector3((land.x + g.x) / 2 + 4, 26, (land.z + g.z) / 2), g.clone().setY(g.y + .1));
      ctx.addTracer(drive, 0xff3b30, { every: 9, dur: 3.2, ball, radius: .35 });
      ctx.addTracer(approach, 0xff3b30, { every: 9, dur: 2.2, delay: 3.6, ball, radius: .3 });
    }
  }
};

/* ------------------------------------------------------------------ mount */
export async function mountField(host, sport, opts = {}) {
  const S = SPORTS[sport];
  if (!S) throw new Error('unknown sport ' + sport);
  const canvas = document.createElement('canvas');
  canvas.className = 'field3d-canvas';
  host.append(canvas);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { canvas.remove(); throw e; }
  const dpr = Math.min(devicePixelRatio || 1, small ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = S.day ? .92 : .9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const bg = new THREE.Color(S.sky[1]);
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 180, 820);
  scene.add(skyDome(S.sky[0], S.sky[1], 900, S.sky[2]));
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = S.day ? .4 : .22;

  // surface
  const { cv, spec } = await rasterSurface(sport, small ? Math.min(S.px, 2048) : S.px);
  const u = UNIT[spec.units];
  const [bx, by, bw, bh] = spec.bounds;
  const [cx, cy] = S.center;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const w = (x, y) => new THREE.Vector3((x - cx) * u, 0, (y - cy) * u);
  let heightAt = () => 0;
  let ground;
  if (sport === 'golf') {
    // gentle terrain: flatter on the fairway/green, rolling in the rough, a basin for the water
    const segX = 96, segY = 240;
    const geo = new THREE.PlaneGeometry(bw * u, bh * u, segX, segY);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const hfun = (X, Z) => {
      const x = X / u + cx, y = Z / u + cy;
      let hgt = 1.6 * Math.sin(x * .045) * Math.cos(y * .021) + 1.1 * Math.sin((x + y) * .03) + 2.2 * Math.cos(y * .012);
      const dg = Math.hypot(x - GOLF.greenC[0], y - GOLF.greenC[1]); hgt += 2.2 * Math.exp(-(dg * dg) / 900);
      const dw = Math.hypot(x + 38, y + 345); hgt -= 3.4 * Math.exp(-(dw * dw) / 1500);
      if (Math.abs(x) > 60) hgt += (Math.abs(x) - 60) * .12;
      return hgt;
    };
    for (let i = 0; i < pos.count; i++) pos.setY(i, hfun(pos.getX(i) + (bx + bw / 2 - cx) * u, pos.getZ(i) + (by + bh / 2 - cy) * u));
    geo.computeVertexNormals();
    ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: .95 }));
    ground.position.set((bx + bw / 2 - cx) * u, 0, (by + bh / 2 - cy) * u);
    heightAt = v => hfun(v.x, v.z);
    const water = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.MeshStandardMaterial({ color: 0x2d74ad, roughness: .08, metalness: .1, transparent: true, opacity: .82 }));
    water.rotation.x = -Math.PI / 2; const wc = w(-38, -345); water.position.set(wc.x, hfun(wc.x, wc.z) + 1.1, wc.z); water.scale.set(.62, 1.18, 1);
    scene.add(water);
  } else {
    ground = new THREE.Mesh(new THREE.PlaneGeometry(bw * u, bh * u), new THREE.MeshStandardMaterial({ map: tex, roughness: sport === 'basketball' ? .38 : .92, metalness: 0 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set((bx + bw / 2 - cx) * u, 0, (by + bh / 2 - cy) * u);
  }
  ground.receiveShadow = true;
  scene.add(ground);
  // outer apron beyond the texture
  const apron = new THREE.Mesh(new THREE.CircleGeometry(1400, 48), new THREE.MeshStandardMaterial({ color: S.day ? 0x2f5e2c : 0x0b1210, roughness: 1 }));
  apron.rotation.x = -Math.PI / 2; apron.position.y = S.day ? -6 : -.02; scene.add(apron);

  // lights
  const hemi = new THREE.HemisphereLight(S.day ? 0xcfe0ff : 0x8fa6bd, S.day ? 0x3a5a2a : 0x141a12, S.day ? 1.0 : .5);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(S.day ? 0xffdcae : 0xfff4e2, S.day ? 2.4 : 2.1);
  const span = Math.max(bw, bh) * u;
  key.position.set(span * .35, span * .55, span * .28);
  key.castShadow = true;
  key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  const sc = key.shadow.camera; sc.left = -span * .55; sc.right = span * .55; sc.top = span * .55; sc.bottom = -span * .55; sc.near = 1; sc.far = span * 2;
  key.shadow.bias = -.0004; key.shadow.normalBias = .02;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xbfd6ff, S.day ? .25 : .45); fill.position.set(-span * .4, span * .3, -span * .3); scene.add(fill);

  // stadium dressing
  if (!S.day) {
    const hx = (sport === 'baseball' ? 0 : spec.bounds[2] * u / 2), hz = (sport === 'baseball' ? 0 : spec.bounds[3] * u / 2);
    if (sport === 'football') scene.add(bowl(hx + 6, hz + 8, 58, 30, { seed: 3, repeat: 30 }));
    if (sport === 'soccer') scene.add(bowl(hx + 4, hz + 6, 52, 27, { seed: 4, repeat: 30 }));
    if (sport === 'basketball') scene.add(bowl(hx + 4, hz + 5, 26, 15, { seed: 6, repeat: 22, n: 3.2, y0: 1, ribbon: 0x0b2a4a }));
    if (sport === 'volleyball') scene.add(bowl(hx + 4, hz + 5, 20, 11, { seed: 8, repeat: 18, n: 3.4, y0: .9 }));
    const towerR = sport === 'baseball' ? 150 : sport === 'soccer' ? 88 : sport === 'football' ? 96 : 0;
    if (towerR) for (const a of [.62, 2.52, 3.76, 5.66]) { const t = lightTower(Math.cos(a) * towerR * 1.15, Math.sin(a) * towerR * .72 + (sport === 'baseball' ? -40 : 0), sport === 'baseball' ? 52 : 46, new THREE.Vector3(0, 0, 0)); scene.add(t); }
    if (sport === 'basketball' || sport === 'volleyball') {
      // arena ceiling rig: soft overhead light bank
      const rig = new THREE.Mesh(new THREE.BoxGeometry(sport === 'basketball' ? 24 : 16, .4, sport === 'basketball' ? 12 : 9), new THREE.MeshStandardMaterial({ color: 0x111418, emissive: 0xfff2dc, emissiveIntensity: 1.2 }));
      rig.position.y = sport === 'basketball' ? 26 : 16; scene.add(rig);
      const spot = new THREE.SpotLight(0xfff4e0, 60, 80, .75, .6, 1.2); spot.position.set(0, rig.position.y - 1, 0); spot.target.position.set(0, 0, 0); scene.add(spot, spot.target);
    }
  } else {
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffe0b0, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    sun.scale.set(120, 120, 1); sun.position.set(-260, 70, -620); scene.add(sun);
    scene.fog = new THREE.Fog(new THREE.Color('#e9d2b6'), 340, 1150);
  }

  // athletes, labels
  const labelLayer = new CSS2DRenderer();
  labelLayer.domElement.className = 'field3d-labels';
  host.append(labelLayer.domElement);
  const actors = [];
  const tickers = [], tracers = [];
  const ctx = {
    scene, k: u, W: sport === 'football' ? FOOTBALL.W : 0,
    add: o => { scene.add(o); return o; },
    w, h: v => heightAt(v),
    onTick: fn => tickers.push(fn),
    player(kit, x, y, o = {}) {
      const a = athlete(kit, { h: o.h, helmet: o.helmet, label: o.label });
      const p = w(x, y); a.position.set(p.x, heightAt(p), p.z);
      a.rotation.y = o.face === 1 ? Math.PI / 2 : o.face === -1 ? -Math.PI / 2 : 0;
      if (o.z) a.rotation.y = o.face === -1 ? 0 : Math.PI;
      if (o.label) {
        const el = document.createElement('span'); el.className = 'f3-tag'; el.textContent = o.label;
        const tag = new CSS2DObject(el); tag.position.set(0, (o.h || 1.85) + .55, 0); a.add(tag);
      }
      scene.add(a); actors.push(a); return a;
    },
    addTracer(curve, color, o = {}) { const tr = tracer(curve, color, o.radius); scene.add(tr.group); tracers.push({ tr, ...o }); }
  };
  S.build(ctx);

  // camera + controls
  const camera = new THREE.PerspectiveCamera(sport === 'golf' ? 40 : 34, 1, .1, 3000);
  const target = new THREE.Vector3(...S.target);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .07;
  controls.enablePan = false;
  controls.minPolarAngle = .08; controls.maxPolarAngle = sport === 'golf' ? 1.42 : 1.36;
  const baseDist = new THREE.Vector3(...S.views[S.view]).distanceTo(target);
  controls.minDistance = baseDist * .22; controls.maxDistance = baseDist * 2.6;
  controls.target.copy(target);
  controls.autoRotate = !reduced && opts.autoRotate !== false;
  controls.autoRotateSpeed = sport === 'golf' ? .25 : .35;
  controls.addEventListener('start', () => { controls.autoRotate = false; host.classList.add('is-touched'); });
  const shiftX = () => { const r = host.getBoundingClientRect(); return r.width / Math.max(1, r.height) > 1.25 && opts.shift !== false ? (S.wideShift || 0) : 0; };
  const setView = (name, instant) => {
    const v = S.views[name]; if (!v) return;
    const sx = shiftX();
    controls.target.set(target.x + sx, target.y, target.z);
    const to = new THREE.Vector3(v[0] + sx, v[1], v[2]);
    if (instant || reduced) { camera.position.copy(to); controls.update(); return; }
    const from = camera.position.clone(), t0 = performance.now();
    anim = t => { const k2 = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - k2, 3); camera.position.lerpVectors(from, to, e); if (k2 >= 1) anim = null; };
  };
  let anim = null;
  setView(opts.view || S.view, true);

  // sizing
  const resize = () => {
    const r = host.getBoundingClientRect(); const W = Math.max(1, r.width), H = Math.max(1, r.height);
    renderer.setSize(W, H, false); labelLayer.setSize(W, H);
    camera.aspect = W / H;
    camera.fov = (sport === 'golf' ? 40 : 34) * (W / H < 1 ? 1.45 : 1);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  // loop (only while on screen)
  let visible = true, running = false, t0 = performance.now();
  const clock = () => (performance.now() - t0) / 1000;
  const frame = () => {
    const t = clock();
    if (anim) anim(performance.now());
    controls.update();
    for (const fn of tickers) fn(t);
    for (const s of tracers) {
      // each tracer grows for `dur`, holds for a moment, then hides until its next loop (broadcast replay feel)
      const period = s.every || 7, since = t - (s.delay || 0), local = ((since % period) + period) % period;
      if (reduced) { s.tr.set(1); s.tr.group.visible = true; continue; }
      const on = since >= 0 && local <= s.dur + 2.6;
      s.tr.group.visible = on;
      const p = s.tr.set(Math.min(1, local / s.dur));
      if (s.ball && since >= 0 && local <= s.dur) s.ball.position.copy(p);
    }
    renderer.render(scene, camera); labelLayer.render(scene, camera);
  };
  const start = () => { if (running) return; running = true; renderer.setAnimationLoop(frame); };
  const stop = () => { running = false; renderer.setAnimationLoop(null); };
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; visible && !document.hidden ? start() : stop(); }, { threshold: .02 });
  io.observe(host);
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : visible && start(); });
  frame();
  host.classList.add('is-ready');

  return {
    scene, camera, controls, renderer, views: Object.keys(S.views), setView,
    labels(on) { host.classList.toggle('show-tags', on); },
    dispose() { stop(); ro.disconnect(); io.disconnect(); renderer.dispose(); pmrem.dispose(); host.innerHTML = ''; }
  };
}
export const SPORT_VIEWS = Object.fromEntries(Object.entries(SPORTS).map(([k, v]) => [k, Object.keys(v.views)]));
