/* TradeSchool 3D kit: geometry and material helpers shared by every trade model.
   Units are metres, y is up. Built on the site's vendored three.js (r186), the same
   build MotorAtlas uses, so the browser caches one copy for both projects. */
import * as THREE from '../../../assets/vendor/three.min.js';
import { RoundedBoxGeometry, BufferGeometryUtils } from '../../../assets/vendor/three.min.js';

export { THREE };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const rbox = (w, h, d, r = 0.01, seg = 2) =>
  new RoundedBoxGeometry(w, h, d, seg, Math.max(1e-4, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)));
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

/* cylinder along an axis ('x' | 'y' | 'z'); r2 is the far-end radius for cones */
export function cyl(r, len, axis = 'y', seg = 24, r2 = r, open = false) {
  const g = new THREE.CylinderGeometry(r2, r, len, seg, 1, open);
  if (axis === 'x') g.rotateZ(-Math.PI / 2); else if (axis === 'z') g.rotateX(Math.PI / 2);
  return g;
}
export function cylBetween(a, b, r, seg = 14, r2 = r) {
  const dir = b.clone().sub(a), len = dir.length();
  const g = new THREE.CylinderGeometry(r2, r, len, seg);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
}
export const curve = (pts, closed = false) => new THREE.CatmullRomCurve3(pts, closed, 'centripetal');
export function tube(pts, r, closed = false, seg, radial = 10) {
  const c = curve(pts, closed);
  return new THREE.TubeGeometry(c, seg || Math.max(20, Math.round(c.getLength() * 40)), r, radial, closed);
}
/* straight-run pipe with tight elbows: like real pipe, not a garden hose */
export function pipe(pts, r, bend = 0.06, radial = 12) {
  if (pts.length < 3) return tube(pts, r, false, 8, radial);
  const path = new THREE.CurvePath();
  let prev = pts[0].clone();
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const inD = b.clone().sub(a), outD = c.clone().sub(b);
    const k = Math.min(bend, inD.length() / 2, outD.length() / 2);
    const p1 = b.clone().sub(inD.normalize().multiplyScalar(k)), p2 = b.clone().add(outD.normalize().multiplyScalar(k));
    if (prev.distanceTo(p1) > 1e-4) path.add(new THREE.LineCurve3(prev, p1));
    path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
    prev = p2;
  }
  path.add(new THREE.LineCurve3(prev, pts[pts.length - 1].clone()));
  const len = path.getLength();
  return new THREE.TubeGeometry(path, Math.max(24, Math.round(len * 50)), r, radial, false);
}
/* the centreline of pipe(): used so flow particles ride inside the pipe */
export function pipePoints(pts, bend = 0.06) {
  if (pts.length < 3) return pts.map(p => p.clone());
  const out = [pts[0].clone()];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const inD = b.clone().sub(a), outD = c.clone().sub(b);
    const k = Math.min(bend, inD.length() / 2, outD.length() / 2);
    out.push(b.clone().sub(inD.normalize().multiplyScalar(k)), b.clone().add(outD.normalize().multiplyScalar(k)));
  }
  out.push(pts[pts.length - 1].clone());
  return out;
}
export function helix(base, r, len, turns, wire, axis = 'y') {
  class Helix extends THREE.Curve {
    getPoint(t, o = new THREE.Vector3()) {
      const a = t * turns * Math.PI * 2, u = Math.cos(a) * r, w = Math.sin(a) * r, l = t * len;
      if (axis === 'x') return o.set(base.x + l, base.y + u, base.z + w);
      if (axis === 'z') return o.set(base.x + u, base.y + w, base.z + l);
      return o.set(base.x + u, base.y + l, base.z + w);
    }
  }
  return new THREE.TubeGeometry(new Helix(), Math.max(16, Math.round(turns * 24)), wire, 6, false);
}
export const lathe = (profile, seg = 36) => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
export function extrude(shapePts, depth, holes = [], bevel = 0) {
  const s = new THREE.Shape(shapePts.map(([x, y]) => new THREE.Vector2(x, y)));
  holes.forEach(h => s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y)))));
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 16 });
}
export const merge = gs => BufferGeometryUtils.mergeGeometries(gs.filter(Boolean).map(g => (g.index ? g.toNonIndexed() : g)), false);
export const at = (g, x, y, z) => { g.translate(x, y, z); return g; };
export const rotX = (g, a) => { g.rotateX(a); return g; };
export const rotY = (g, a) => { g.rotateY(a); return g; };
export const rotZ = (g, a) => { g.rotateZ(a); return g; };

/* a row of identical geometry, e.g. studs at 16 in on centre */
export function row(make, n, step, axis = 'x') {
  const out = [];
  for (let i = 0; i < n; i++) { const g = make(i); g.translate(axis === 'x' ? i * step : 0, axis === 'y' ? i * step : 0, axis === 'z' ? i * step : 0); out.push(g); }
  return merge(out);
}

/* ------------------------------------------------------------------ assembly
   Every model starts here: add() registers one nameable piece of equipment, ctx() adds
   context that is never picked (walls, floors, benches), flow() adds a particle stream. */
export function assembly(meta) {
  const root = new THREE.Group(); const comps = [], flows = [];
  const add = (id, sys, g, o = {}) => {
    let obj;
    if (g.isObject3D) obj = g;
    else if (Array.isArray(g)) { obj = new THREE.Group(); g.forEach(([geo, m]) => geo && obj.add(new THREE.Mesh(geo, m || mat(meta.systems[sys].color)))); }
    else obj = new THREE.Mesh(g, o.mat || mat(meta.systems[sys]?.color ?? 0x999999, o.m || {}));
    obj.name = id; (o.parent || root).add(obj);
    const c = { id, sys, obj, concepts: o.c || [], label: o.label || '', ...o };
    delete c.mat; delete c.m; delete c.c; delete c.parent;
    comps.push(c); return c;
  };
  const ctx = (g, m, o = {}) => {
    const mesh = new THREE.Mesh(g, m); mesh.userData.cast = !!o.cast; mesh.name = 'ctx'; root.add(mesh);
    if (o.edges !== false && m.transparent) { // architectural context reads as a drawn outline, not a milky box
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), new THREE.LineBasicMaterial({ color: o.edgeColor ?? 0xaebccb, transparent: true, opacity: o.edgeOpacity ?? 0.35 }));
      e.name = 'ctx'; root.add(e);
    }
    return mesh;
  };
  const flow = (sys, pts, color, o = {}) => { const f = { sys, pts, color, r: 0.014, speed: 0.22, ...o }; flows.push(f); return f; };
  return { root, comps, flows, add, ctx, flow };
}
/* a glass-like context panel (walls, floors) that reads as architecture without hiding the equipment */
export const CONTEXT = {
  wall: () => mat(0x6d7885, { rough: 0.9, metal: 0, opacity: 0.05, side: THREE.DoubleSide }),
  slab: () => mat(0x7e8894, { rough: 0.9, metal: 0, opacity: 0.08, side: THREE.DoubleSide }),
  solid: () => mat(0x3a4048, { rough: 0.85, metal: 0.05 }),
  ground: () => mat(0x4a4f45, { rough: 1, metal: 0, opacity: 0.5 })
};

/* ------------------------------------------------------------------ materials */
const cache = new Map();
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.5, metalness: o.metal ?? 0.2, transparent: o.opacity != null, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide, depthWrite: o.opacity == null || o.opacity > 0.6, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1 });
  m.userData.base = new THREE.Color(color);
  cache.set(key, m);
  return m;
}
/* real-world stock materials; every model reuses these so a copper pipe looks the same in HVAC and plumbing */
export const STOCK = {
  steel: () => mat(0x9aa3ad, { rough: 0.38, metal: 0.9 }),
  darkSteel: () => mat(0x4b525b, { rough: 0.5, metal: 0.8 }),
  galv: () => mat(0xb9c0c6, { rough: 0.45, metal: 0.85 }),
  alu: () => mat(0xcfd5dc, { rough: 0.3, metal: 0.95 }),
  copper: () => mat(0xc7784a, { rough: 0.32, metal: 0.95 }),
  brass: () => mat(0xc9a449, { rough: 0.3, metal: 0.95 }),
  rubber: () => mat(0x1b1d20, { rough: 0.9, metal: 0 }),
  plastic: () => mat(0x2b2f35, { rough: 0.6, metal: 0.05 }),
  white: () => mat(0xe6e4de, { rough: 0.55, metal: 0.05 }),
  lumber: () => mat(0xd9b27c, { rough: 0.8, metal: 0 }),
  osb: () => mat(0xc49a5c, { rough: 0.9, metal: 0 }),
  concrete: () => mat(0x9c9a94, { rough: 0.95, metal: 0 }),
  rebar: () => mat(0x6b5446, { rough: 0.7, metal: 0.6 }),
  foam: () => mat(0x23262a, { rough: 0.95, metal: 0 }),
  glass: () => mat(0x9fd6e8, { rough: 0.05, metal: 0.1, opacity: 0.25 })
};
