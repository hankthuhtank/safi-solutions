/* MotorAtlas — "The Machine": an X-ray 3D car built procedurally with three.js (vendored r186).
   Every system in the parts library has real, proportionate hardware in the model, colour-coded and linked to the part pages.
   Units are metres. x = forward, y = up, z = right (driver sits on the left, −z). Proportions follow a typical compact sedan:
   4.63 m long, 1.78 m wide, 2.70 m wheelbase, 225/45 R17 tyres. */
import * as THREE from '../vendor/three.min.js';
import { OrbitControls, RoomEnvironment, RoundedBoxGeometry, BufferGeometryUtils } from '../vendor/three.min.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ------------------------------------------------------------------ systems (ids match atlas-data.js) */
export const SYSTEMS = {
  engine: { name: 'Engine core', color: 0xf0a43b },
  airfuel: { name: 'Air + fuel', color: 0x7fd3ea },
  cooling: { name: 'Cooling', color: 0x3b82f6 },
  lubrication: { name: 'Lubrication', color: 0xd4a72c },
  transmission: { name: 'Transmission', color: 0xe0679b },
  drivetrain: { name: 'Drivetrain', color: 0xff7f50 },
  suspension: { name: 'Suspension', color: 0x34d399 },
  steering: { name: 'Steering', color: 0x2dd4bf },
  brakes: { name: 'Brakes', color: 0xef4444 },
  electrical: { name: 'Electrical + electronics', color: 0xfacc15 },
  hvac: { name: 'Heating + A/C', color: 0x9cc9ff },
  exhaust: { name: 'Exhaust + emissions', color: 0xb9ada3 },
  wheels: { name: 'Wheels + tires', color: 0xd4d4d8 },
  structure: { name: 'Structure + safety', color: 0x94a3b8 },
  hybridev: { name: 'Hybrid + EV', color: 0xa3e635 }
};
export const MODES = { gas: 'Gasoline', hybrid: 'Hybrid', ev: 'Electric' };
const HV_ORANGE = 0xff8a1f; // high-voltage cabling is orange on every production EV and hybrid

/* ------------------------------------------------------------------ dimensions */
const AX_F = 1.40, AX_R = -1.30, TRACK = 0.765, WR = 0.317;          // axles, half-track, wheel radius
const CR = { x: 1.54, y: 0.47 };                                      // crankshaft axis (transverse, along z)
const BORES = [-0.035, 0.055, 0.145, 0.235];                          // inline-four cylinder centres along z
const STROKE_R = 0.045, ROD = 0.145;

/* ------------------------------------------------------------------ geometry helpers */
const rbox = (w, h, d, r = 0.015, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
function cylAxis(r, len, axis = 'y', seg = 24, r2 = r) {
  const g = new THREE.CylinderGeometry(r2, r, len, seg);
  if (axis === 'x') g.rotateZ(-Math.PI / 2); else if (axis === 'z') g.rotateX(Math.PI / 2);
  return g;
}
function cylBetween(a, b, r, seg = 16, r2 = r) {
  const dir = b.clone().sub(a), len = dir.length();
  const g = new THREE.CylinderGeometry(r2, r, len, seg);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
}
const curveOf = (pts, closed = false) => new THREE.CatmullRomCurve3(pts, closed, 'centripetal');
function tube(pts, r, closed = false, seg) {
  const c = curveOf(pts, closed);
  return new THREE.TubeGeometry(c, seg || Math.max(24, Math.round(c.getLength() * 60)), r, 10, closed);
}
function helixGeo(base, r, len, turns, wire) {
  class Helix extends THREE.Curve { getPoint(t, o = new THREE.Vector3()) { const a = t * turns * Math.PI * 2; return o.set(base.x + Math.cos(a) * r, base.y + t * len, base.z + Math.sin(a) * r); } }
  return new THREE.TubeGeometry(new Helix(), Math.round(turns * 28), wire, 6, false);
}
function lathe(profile, seg = 40) { return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg); }
function boot(a, b, r0, r1, ribs = 5) { // bellows boot between two points
  const pts = []; const n = ribs * 2 + 1;
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([(r0 + (r1 - r0) * t) * (i % 2 ? 1.12 : 1), t]); }
  const g = lathe(pts, 18); const dir = b.clone().sub(a), len = dir.length();
  g.scale(1, len, 1); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.normalize())); g.translate(a.x, a.y, a.z);
  return g;
}
const merge = gs => BufferGeometryUtils.mergeGeometries(gs.map(g => g.index ? g.toNonIndexed() : g), false);
const at = (g, x, y, z) => { g.translate(x, y, z); return g; };

/* ------------------------------------------------------------------ the body: a signed-distance sedan, meshed with surface nets */
// side silhouette (x forward, y up), clockwise from the front bumper lip
const PROFILE = [[2.27, 0.29], [2.33, 0.40], [2.33, 0.52], [2.29, 0.63], [2.20, 0.71], [2.08, 0.755], [1.80, 0.79], [1.30, 0.84], [0.85, 0.895], [0.62, 0.93],
  [0.32, 1.10], [0.02, 1.28], [-0.22, 1.395], [-0.45, 1.428], [-0.75, 1.435], [-1.02, 1.418], [-1.26, 1.33], [-1.50, 1.18], [-1.72, 1.055], [-1.95, 1.025],
  [-2.17, 0.995], [-2.265, 0.93], [-2.305, 0.78], [-2.315, 0.56], [-2.28, 0.36], [-2.20, 0.27], [-1.80, 0.215], [-1.0, 0.17], [0.0, 0.155], [1.0, 0.165], [1.85, 0.22], [2.18, 0.26]];
const beltY = x => 0.935 + Math.max(0, -x) * 0.03;
function planW(x, y) { // half-width in plan view (superellipse front and rear), tucked in above the beltline (tumblehome)
  let w = 0.89;
  if (x > 1.6) { const t = Math.min(1, (x - 1.6) / 0.735); w *= Math.pow(Math.max(0, 1 - Math.pow(t, 3.2)), 1 / 3.2); }
  if (x < -1.75) { const t = Math.min(1, (-1.75 - x) / 0.57); w *= Math.pow(Math.max(0, 1 - Math.pow(t, 3.6)), 1 / 3.6); }
  const b = beltY(x);
  if (y > b) w -= (y - b) * 0.58;
  if (y < 0.34) w -= (0.34 - y) * 0.35; // sills roll under
  return w;
}
function sdPoly(v, px, py) {
  let d = (px - v[0][0]) ** 2 + (py - v[0][1]) ** 2, s = 1;
  for (let i = 0, j = v.length - 1; i < v.length; j = i, i++) {
    const ex = v[j][0] - v[i][0], ey = v[j][1] - v[i][1], wx = px - v[i][0], wy = py - v[i][1];
    const t = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
    const bx = wx - ex * t, by = wy - ey * t; d = Math.min(d, bx * bx + by * by);
    const c1 = py >= v[i][1], c2 = py < v[j][1], c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}
const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; };
function bodySDF(d2, x, y, z) {
  let d = smax(d2, Math.abs(z) - planW(x, y), 0.08);
  for (const ax of [AX_F, AX_R]) { // wheel arches: cylinders cut out of the sides
    const arch = Math.max(Math.hypot(x - ax, y - WR) - 0.378, 0.57 - Math.abs(z));
    d = smax(d, -arch, 0.035);
  }
  return d;
}
function buildBody() {
  const h = 0.032, X0 = -2.42, X1 = 2.42, Y0 = 0.1, Y1 = 1.5, Z0 = -0.96, Z1 = 0.96;
  const nx = Math.ceil((X1 - X0) / h) + 1, ny = Math.ceil((Y1 - Y0) / h) + 1, nz = Math.ceil((Z1 - Z0) / h) + 1;
  const d2 = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) d2[i + j * nx] = sdPoly(PROFILE, X0 + i * h, Y0 + j * h);
  const F = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) F[i + nx * (j + ny * k)] = bodySDF(d2[i + j * nx], X0 + i * h, Y0 + j * h, Z0 + k * h);
  const cx = nx - 1, cy = ny - 1, cz = nz - 1, cell = new Int32Array(cx * cy * cz).fill(-1), pos = [];
  const f = (i, j, k) => F[i + nx * (j + ny * k)];
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const val = new Float32Array(8);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    let inside = 0;
    for (let c = 0; c < 8; c++) { val[c] = f(i + C[c][0], j + C[c][1], k + C[c][2]); if (val[c] < 0) inside++; }
    if (!inside || inside === 8) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of E) {
      if ((val[a] < 0) === (val[b] < 0)) continue;
      const t = val[a] / (val[a] - val[b]);
      sx += C[a][0] + (C[b][0] - C[a][0]) * t; sy += C[a][1] + (C[b][1] - C[a][1]) * t; sz += C[a][2] + (C[b][2] - C[a][2]) * t; n++;
    }
    cell[i + cx * (j + cy * k)] = pos.length / 3;
    pos.push(X0 + (i + sx / n) * h, Y0 + (j + sy / n) * h, Z0 + (k + sz / n) * h);
  }
  const idx = [], q = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; flip ? idx.push(a, c, b, a, d, c) : idx.push(a, b, c, a, c, d); };
  const cid = (i, j, k) => cell[i + cx * (j + cy * k)];
  for (let k = 1; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 0; i < cx; i++) { const a = f(i, j, k) < 0, b = f(i + 1, j, k) < 0; if (a !== b) q(cid(i, j - 1, k - 1), cid(i, j, k - 1), cid(i, j, k), cid(i, j - 1, k), !a); }
  for (let k = 1; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 1; i < cx; i++) { const a = f(i, j, k) < 0, b = f(i, j + 1, k) < 0; if (a !== b) q(cid(i - 1, j, k - 1), cid(i - 1, j, k), cid(i, j, k), cid(i, j, k - 1), !a); }
  for (let k = 0; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 1; i < cx; i++) { const a = f(i, j, k) < 0, b = f(i, j, k + 1) < 0; if (a !== b) q(cid(i - 1, j - 1, k), cid(i, j - 1, k), cid(i, j, k), cid(i - 1, j, k), !a); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  // glazing mask: windscreen, side glass and rear window (pillars, roof and panels stay body-coloured)
  const P = g.attributes.position, N = g.attributes.normal, glass = new Float32Array(P.count);
  for (let v = 0; v < P.count; v++) {
    const x = P.getX(v), y = P.getY(v), z = Math.abs(P.getZ(v)), nx_ = N.getX(v), ny_ = N.getY(v), nz_ = Math.abs(N.getZ(v));
    const b = beltY(x) + 0.035; if (y < b) continue;
    const top = topY(x);
    const wind = nx_ > 0.3 && x < 0.6 && x > -0.2 && z < planW(x, y) - 0.1 && y < top - 0.02;
    const rear = nx_ < -0.3 && x < -1.05 && x > -1.7 && z < planW(x, y) - 0.1;
    const side = nz_ > 0.55 && x < 0.5 && x > -1.58 && y < top - 0.07 && !(x < -0.24 && x > -0.4) && ny_ < 0.8;
    if (wind || rear || side) glass[v] = 1;
  }
  g.setAttribute('glass', new THREE.BufferAttribute(glass, 1));
  return g;
}
function topY(x) { // roof/glass top line from the silhouette
  const top = PROFILE.slice(9, 20);
  for (let i = 0; i < top.length - 1; i++) { const [x0, y0] = top[i], [x1, y1] = top[i + 1]; if (x <= x0 && x >= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
  return 0;
}
const surfZ = (x, y, inset = 0.03) => Math.max(0.05, planW(x, y) - inset);

/* ------------------------------------------------------------------ materials */
const ghostBody = () => new THREE.ShaderMaterial({
  uniforms: { uRim: { value: new THREE.Color(0xbfd3dc) }, uGlass: { value: new THREE.Color(0x58c3d6) }, uOpacity: { value: 1 } },
  vertexShader: `attribute float glass; varying vec3 vN; varying vec3 vV; varying float vG;
    void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vG = glass; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uRim; uniform vec3 uGlass; uniform float uOpacity; varying vec3 vN; varying vec3 vV; varying float vG;
    void main(){ float f = 1.0 - abs(dot(normalize(vN), normalize(vV))); float rim = pow(f, 2.6);
      vec3 col = mix(uRim, uGlass, vG); float a = (0.035 + 0.62*rim) * mix(1.0, 0.75, vG) + vG*0.05;
      gl_FragColor = vec4(col*(0.55+0.8*rim), a*uOpacity); }`,
  transparent: true, depthWrite: false, side: THREE.FrontSide
});
const paintBody = () => new THREE.MeshPhysicalMaterial({ color: 0x2b3238, metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 });
const MAT = {
  rubber: new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.92, metalness: 0 }),
  alloy: new THREE.MeshStandardMaterial({ color: 0xc9ced6, roughness: 0.28, metalness: 1 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x8c9198, roughness: 0.42, metalness: 0.9 }),
  context: new THREE.MeshStandardMaterial({ color: 0x5b6670, roughness: 0.8, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false }),
  ghost: new THREE.MeshBasicMaterial({ color: 0x8795a1, transparent: true, opacity: 0.07, depthWrite: false }),
  lampW: new THREE.MeshBasicMaterial({ color: 0xcfe9ff, transparent: true, opacity: 0.85 }),
  lampR: new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.9 })
};
const sysMat = {};
function matFor(sys, variant) {
  const key = sys + (variant || '');
  if (sysMat[key]) return sysMat[key];
  const c = new THREE.Color(SYSTEMS[sys]?.color ?? 0x999999);
  let m;
  if (variant === 'hv') m = new THREE.MeshStandardMaterial({ color: HV_ORANGE, roughness: 0.45, metalness: 0.1 });
  else if (variant === 'metal') m = new THREE.MeshStandardMaterial({ color: c.clone().lerp(new THREE.Color(0xb8bec6), 0.45), roughness: 0.35, metalness: 0.85 });
  else if (variant === 'shell') m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.4, transparent: true, opacity: 1 });
  else m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.35 });
  m.userData.base = c.clone();
  return (sysMat[key] = m);
}

/* ------------------------------------------------------------------ the car */
function buildCar() {
  const root = new THREE.Group(); root.name = 'car';
  const comps = [];      // { id, sys, parts, label, obj, modes, anchor }
  const anim = {};       // named moving parts
  const flows = [];      // { sys, pts, color, modes, speed, r }
  const add = (id, sys, geoOrObj, o = {}) => {
    let obj = geoOrObj;
    if (geoOrObj.isBufferGeometry) obj = new THREE.Mesh(geoOrObj, o.mat || matFor(sys, o.variant));
    obj.name = id;
    obj.traverse(n => { if (n.isMesh) { n.castShadow = !o.noShadow; n.userData.comp = id; n.userData.sys = sys; n.userData.shell = !!o.shell; n.userData.baseMat = n.material; } });
    root.add(obj);
    const c = { id, sys, parts: o.parts || [], label: o.label || (o.parts || [])[0] || id, obj, modes: o.modes || ['gas', 'hybrid', 'ev'], drives: o.drives || null, anchor: o.anchor || null, labelled: o.labelled !== false };
    comps.push(c); return c;
  };
  const GAS = ['gas'], ICE = ['gas', 'hybrid'], HY = ['hybrid'], EV = ['ev'], ELEC = ['hybrid', 'ev'];

  /* body shell */
  const body = new THREE.Mesh(buildBody(), ghostBody()); body.name = 'body'; root.add(body);
  // LED light blades traced along the body corners (front DRLs, full-width rear bar)
  const xFront = (z, y) => Math.min(1.6 + 0.735 * Math.pow(1 - Math.pow(Math.min(z / 0.89, 0.999), 3.2), 1 / 3.2), y > 0.63 ? 2.29 - (y - 0.63) * 1.1 : 2.33) - 0.016;
  const xRear = (z, y) => Math.max(-1.75 - 0.57 * Math.pow(1 - Math.pow(Math.min(z / 0.89, 0.999), 3.6), 1 / 3.6), -2.265 - (0.93 - y) * 0.27) + 0.014;
  const strip = (fx, y, z0, z1, n = 12) => Array.from({ length: n + 1 }, (_, i) => { const z = z0 + (z1 - z0) * i / n; return V(fx(Math.abs(z), y), y, z); });
  const lampsF = merge([-1, 1].flatMap(s => [tube(strip(xFront, 0.675, s * 0.4, s * 0.77, 14), 0.013), tube(strip(xFront, 0.635, s * 0.5, s * 0.74, 10), 0.008)]));
  const lampsR = merge([tube(strip(xRear, 0.9, -0.74, 0.74, 24), 0.012)]);
  root.add(new THREE.Mesh(lampsF, MAT.lampW), new THREE.Mesh(lampsR, MAT.lampR));

  /* cabin context (never highlighted) */
  const ctx = merge([
    at(rbox(0.36, 0.2, 1.5, 0.06), 0.47, 0.86, 0),                       // dashboard
    at(rbox(1.2, 0.02, 1.52, 0.01), -0.32, 0.2, 0),                       // floor pan
    at(rbox(0.02, 0.62, 1.4, 0.01), 0.665, 0.56, 0),                      // firewall
    ...[-0.37, 0.37].flatMap(z => [at(rbox(0.5, 0.11, 0.5, 0.04), -0.07, 0.44, z), at(rbox(0.12, 0.62, 0.5, 0.04).rotateZ(0.2), -0.33, 0.8, z), at(rbox(0.12, 0.16, 0.26, 0.05), -0.4, 1.19, z)]),
    at(rbox(0.46, 0.12, 1.1, 0.04), -1.0, 0.56, 0), at(rbox(0.12, 0.56, 1.1, 0.04).rotateZ(0.22), -1.3, 0.9, 0)
  ]);
  const ctxMesh = new THREE.Mesh(ctx, MAT.context); ctxMesh.name = 'context'; root.add(ctxMesh);

  /* ---------------- wheels + tires + brakes (each corner) */
  const tireProfile = [[0.216, -0.105], [0.262, -0.112], [0.298, -0.108], [0.312, -0.094], [0.317, -0.072], [0.317, -0.05], [0.311, -0.046], [0.311, -0.034], [0.317, -0.03], [0.317, -0.008], [0.311, -0.004], [0.311, 0.004], [0.317, 0.008], [0.317, 0.03], [0.311, 0.034], [0.311, 0.046], [0.317, 0.05], [0.317, 0.072], [0.312, 0.094], [0.298, 0.108], [0.262, 0.112], [0.216, 0.105]];
  const tireG = lathe(tireProfile, 56).rotateX(Math.PI / 2);
  const rimShape = new THREE.Shape(); rimShape.absarc(0, 0, 0.205, 0, Math.PI * 2, false);
  for (let s = 0; s < 5; s++) { const a0 = s / 5 * Math.PI * 2 + 0.2, a1 = a0 + Math.PI * 2 / 5 - 0.4; const hole = new THREE.Path(); hole.absarc(0, 0, 0.175, a0, a1, false); hole.absarc(0, 0, 0.075, a1 - 0.05, a0 + 0.05, true); rimShape.holes.push(hole); }
  const rimFace = new THREE.ExtrudeGeometry(rimShape, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2, curveSegments: 48 });
  const rimG = merge([rimFace, at(new THREE.CylinderGeometry(0.212, 0.212, 0.2, 48, 1, true).rotateX(Math.PI / 2), 0, 0, -0.09)]);
  const lugG = merge(Array.from({ length: 5 }, (_, i) => { const a = i / 5 * Math.PI * 2; return at(cylAxis(0.011, 0.03, 'z', 10), Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0.02); }));
  anim.wheels = [];
  const corners = [['FL', AX_F, -1], ['FR', AX_F, 1], ['RL', AX_R, -1], ['RR', AX_R, 1]];
  for (const [nm, ax, s] of corners) {
    const front = ax > 0, zc = s * TRACK;
    const spin = new THREE.Group(); spin.position.set(0, 0, 0);
    const tire = new THREE.Mesh(tireG, MAT.rubber), rim = new THREE.Mesh(rimG, MAT.alloy), lugs = new THREE.Mesh(lugG, MAT.iron);
    rim.scale.z = s; lugs.scale.z = s; rim.position.z = s * 0.075; lugs.position.z = s * 0.075;
    spin.add(tire, rim, lugs);
    const rotor = new THREE.Mesh(merge([cylAxis(front ? 0.152 : 0.14, 0.026, 'z', 40), at(cylAxis(0.07, 0.06, 'z', 24), 0, 0, s * 0.03)]), MAT.iron);
    rotor.position.z = -s * 0.035; spin.add(rotor);
    const steer = new THREE.Group(); steer.position.set(ax, WR, zc); steer.add(spin);
    // caliper (fixed to knuckle, not spinning), sits behind the axle, above centre
    const cal = new THREE.Mesh(merge([at(rbox(0.07, 0.13, 0.07, 0.018), 0, 0, 0)]), matFor('brakes'));
    cal.position.set(-0.115, 0.07, -s * 0.035); cal.rotation.z = 0.55;
    steer.add(cal);
    const hubG = merge([cylAxis(0.055, 0.07, 'z', 20)]); const hub = new THREE.Mesh(hubG, matFor('wheels', 'metal')); hub.position.z = -s * 0.075; steer.add(hub);
    const tpms = new THREE.Mesh(rbox(0.02, 0.012, 0.03, 0.005), matFor('wheels')); tpms.position.set(0, 0.2, s * 0.02); spin.add(tpms);
    const g = new THREE.Group(); g.add(steer);
    add('wheel' + nm, 'wheels', g, { parts: ['Tire tread', 'Tire sidewall', 'Steel belts / carcass plies', 'Wheel / rim', 'Lug nut / wheel bolt', 'TPMS sensor', 'Alignment: toe / camber / caster'], label: nm === 'FR' ? 'Tire & wheel' : '', anchor: V(ax, WR + 0.34, zc), labelled: nm === 'FR' });
    // make brake pieces pickable as brakes, hub as wheel bearing
    cal.userData = { comp: 'caliper' + nm, sys: 'brakes', baseMat: cal.material }; rotor.userData = { comp: 'rotor' + nm, sys: 'brakes', baseMat: rotor.material };
    comps.push({ id: 'caliper' + nm, sys: 'brakes', parts: ['Brake caliper', 'Brake pad'], label: nm === 'FL' ? 'Caliper + pads' : '', obj: cal, modes: ['gas', 'hybrid', 'ev'], anchor: null, labelled: nm === 'FL' });
    comps.push({ id: 'rotor' + nm, sys: 'brakes', parts: ['Brake rotor'], label: nm === 'FL' ? 'Brake rotor' : '', obj: rotor, modes: ['gas', 'hybrid', 'ev'], anchor: null, labelled: false });
    hub.userData = { comp: 'hub' + nm, sys: 'wheels', baseMat: hub.material };
    comps.push({ id: 'hub' + nm, sys: 'wheels', parts: ['Wheel bearing / hub', 'Wheel hub splines'], label: 'Hub + bearing', obj: hub, modes: ['gas', 'hybrid', 'ev'], anchor: null, labelled: false });
    anim.wheels.push({ spin, steer, front, s });
    // ABS wheel-speed sensor
    add('abs' + nm, 'brakes', at(cylAxis(0.012, 0.05, 'y', 10), ax + 0.06, WR - 0.08, zc - s * 0.1), { parts: ['ABS wheel-speed sensor'], labelled: false });
  }

  /* ---------------- engine core (gasoline + hybrid) */
  const EX = CR.x;
  add('block', 'engine', merge([at(rbox(0.34, 0.36, 0.58, 0.03), EX, 0.58, 0.1)]), { parts: ['Engine block'], shell: true, variant: 'shell', modes: ICE, anchor: V(EX, 0.66, -0.2) });
  add('head', 'engine', at(rbox(0.32, 0.13, 0.58, 0.025), EX, 0.825, 0.1), { parts: ['Cylinder head'], shell: true, variant: 'shell', modes: ICE, anchor: V(EX + 0.12, 0.84, 0.36) });
  add('gasket', 'engine', at(rbox(0.335, 0.008, 0.585, 0.003), EX, 0.763, 0.1), { parts: ['Head gasket'], variant: 'metal', modes: ICE, labelled: false });
  add('valvecover', 'engine', merge([at(rbox(0.26, 0.07, 0.57, 0.03), EX, 0.925, 0.1), ...BORES.map(z => at(cylAxis(0.02, 0.02, 'y', 12), EX, 0.965, z))]), { parts: ['Cylinder head'], label: '', shell: true, variant: 'shell', modes: ICE, labelled: false });
  anim.pistons = []; anim.rods = [];
  for (const [n, z] of BORES.entries()) {
    const piston = new THREE.Mesh(merge([cylAxis(0.041, 0.05, 'y', 24), at(cylAxis(0.0415, 0.004, 'y', 24), 0, 0.012, 0), at(cylAxis(0.0415, 0.004, 'y', 24), 0, 0.002, 0)]), matFor('engine', 'metal'));
    piston.position.set(EX, 0.64, z);
    add('piston' + n, 'engine', piston, { parts: ['Piston', 'Piston rings'], label: n === 1 ? 'Piston + rings' : '', modes: ICE, labelled: n === 1, anchor: V(EX, 0.68, z) });
    const rod = new THREE.Mesh(merge([at(rbox(0.018, ROD, 0.012, 0.004), 0, ROD / 2, 0), cylAxis(0.022, 0.018, 'z', 16)]), matFor('engine', 'metal'));
    add('rod' + n, 'engine', rod, { parts: ['Connecting rod', 'Rod bearing'], label: n === 2 ? 'Connecting rod' : '', modes: ICE, labelled: n === 2, anchor: V(EX + 0.02, 0.56, z) });
    anim.pistons.push({ piston, rod, phase: n === 0 || n === 3 ? 0 : Math.PI, z });
  }
  const crank = new THREE.Group(); crank.position.set(EX, CR.y, 0);
  const crankG = merge([cylAxis(0.026, 0.6, 'z', 16).translate(0, 0, 0.1), ...BORES.map((z, n) => { const ph = n === 0 || n === 3 ? 0 : Math.PI; return merge([at(rbox(0.1, 0.03, 0.016, 0.006).rotateZ(ph + Math.PI / 2), Math.sin(ph) * 0.02, Math.cos(ph) * 0.02, z - 0.022), at(rbox(0.1, 0.03, 0.016, 0.006).rotateZ(ph + Math.PI / 2), Math.sin(ph) * 0.02, Math.cos(ph) * 0.02, z + 0.022), at(cylAxis(0.02, 0.03, 'z', 12), Math.sin(ph) * STROKE_R, Math.cos(ph) * STROKE_R, z)]); })]);
  crank.add(new THREE.Mesh(crankG, matFor('engine', 'metal')));
  add('crank', 'engine', crank, { parts: ['Crankshaft', 'Main bearing'], modes: ICE, anchor: V(EX, CR.y - 0.02, -0.12) });
  anim.crank = crank;
  const cams = new THREE.Group();
  for (const dx of [-0.065, 0.065]) {
    const cam = new THREE.Group(); cam.position.set(EX + dx, 0.872, 0);
    cam.add(new THREE.Mesh(merge([cylAxis(0.013, 0.56, 'z', 12).translate(0, 0, 0.1), ...BORES.flatMap(z => [-0.018, 0.018].map(o => at(new THREE.SphereGeometry(0.02, 12, 8).scale(1, 0.72, 0.32), 0, 0.006, z + o)))]), matFor('engine', 'metal')));
    cams.add(cam);
  }
  add('cams', 'engine', cams, { parts: ['Camshaft'], modes: ICE, anchor: V(EX + 0.07, 0.9, -0.1) }); anim.cams = cams.children;
  const valves = [], springs = [];
  for (const z of BORES) for (const [dx, s] of [[0.034, 1], [-0.034, -1]]) {
    valves.push(at(cylAxis(0.004, 0.09, 'y', 8), EX + dx, 0.81, z), at(cylAxis(0.016, 0.004, 'y', 16), EX + dx, 0.768, z));
    springs.push(helixGeo(V(EX + dx, 0.8, z), 0.011, 0.045, 5, 0.0022));
  }
  add('valves', 'engine', merge(valves), { parts: ['Intake valve', 'Exhaust valve'], label: 'Valves', variant: 'metal', modes: ICE, anchor: V(EX + 0.034, 0.77, 0.3) });
  add('vsprings', 'engine', merge(springs), { parts: ['Valve spring'], variant: 'metal', modes: ICE, labelled: false });
  const chain = [V(EX - 0.028, CR.y, 0), V(EX, CR.y - 0.03, 0), V(EX + 0.028, CR.y, 0), V(EX + 0.11, 0.872, 0), V(EX + 0.065, 0.918, 0), V(EX, 0.885, 0), V(EX - 0.065, 0.918, 0), V(EX - 0.11, 0.872, 0)].map(p => p.setZ(0.405));
  add('timing', 'engine', merge([tube(chain, 0.006, true), at(cylAxis(0.045, 0.012, 'z', 24), EX + 0.065, 0.872, 0.405), at(cylAxis(0.045, 0.012, 'z', 24), EX - 0.065, 0.872, 0.405), at(cylAxis(0.026, 0.012, 'z', 18), EX, CR.y, 0.405)]), { parts: ['Timing chain / belt'], variant: 'metal', modes: ICE, anchor: V(EX + 0.12, 0.7, 0.42) });
  add('flywheel', 'engine', at(cylAxis(0.14, 0.024, 'z', 40), EX, CR.y, -0.207), { parts: ['Flywheel / flexplate'], variant: 'metal', modes: ICE, anchor: V(EX, CR.y + 0.15, -0.2) });
  add('damper', 'engine', merge([at(cylAxis(0.075, 0.034, 'z', 32), EX, CR.y, 0.445), at(cylAxis(0.05, 0.02, 'z', 24), EX, CR.y, 0.47)]), { parts: ['Harmonic damper'], variant: 'metal', modes: ICE, anchor: V(EX + 0.06, CR.y - 0.08, 0.48) });

  /* ---------------- lubrication */
  add('oilpan', 'lubrication', at(rbox(0.25, 0.11, 0.5, 0.03), EX + 0.04, 0.345, 0.1), { parts: ['Oil pan / sump'], modes: ICE, anchor: V(EX + 0.05, 0.3, -0.05) });
  add('pickup', 'lubrication', merge([tube([V(EX + 0.02, 0.43, 0.25), V(EX + 0.03, 0.34, 0.2), V(EX + 0.04, 0.315, 0.12)], 0.009), at(cylAxis(0.03, 0.008, 'y', 18), EX + 0.04, 0.308, 0.1)]), { parts: ['Oil pickup / strainer'], modes: ICE, labelled: false });
  add('oilpump', 'lubrication', at(rbox(0.08, 0.07, 0.05, 0.01), EX + 0.04, 0.445, 0.36), { parts: ['Oil pump'], modes: ICE, anchor: V(EX + 0.05, 0.43, 0.38) });
  add('oilfilter', 'lubrication', merge([at(cylAxis(0.038, 0.09, 'x', 20), EX + 0.215, 0.53, 0.24), at(cylAxis(0.04, 0.012, 'x', 20), EX + 0.172, 0.53, 0.24)]), { parts: ['Oil filter'], modes: ICE, anchor: V(EX + 0.27, 0.53, 0.24) });
  add('oilpress', 'lubrication', at(cylAxis(0.01, 0.035, 'x', 10), EX + 0.185, 0.62, -0.1), { parts: ['Oil pressure sensor / switch'], modes: ICE, labelled: false });
  flows.push({ sys: 'lubrication', modes: ICE, color: 0xffd166, r: 0.01, speed: 0.22, pts: [V(EX + 0.04, 0.315, 0.12), V(EX + 0.03, 0.34, 0.2), V(EX + 0.02, 0.43, 0.25), V(EX + 0.04, 0.445, 0.36), V(EX + 0.17, 0.5, 0.3), V(EX + 0.2, 0.53, 0.24), V(EX + 0.12, 0.56, 0.1), V(EX + 0.02, CR.y + 0.01, -0.1)] });

  /* ---------------- air + fuel */
  const TB = V(1.83, 0.88, 0.36);
  add('airbox', 'airfuel', at(rbox(0.3, 0.18, 0.28, 0.035), 1.73, 0.8, 0.6), { parts: ['Air filter'], label: 'Air box + filter', modes: ICE, anchor: V(1.73, 0.9, 0.62) });
  add('airfilter', 'airfuel', at(rbox(0.22, 0.025, 0.2, 0.005), 1.73, 0.8, 0.6), { parts: ['Air filter'], variant: 'metal', modes: ICE, labelled: false });
  const intakePts = [V(1.6, 0.82, 0.55), V(1.52, 0.9, 0.46), V(1.6, 0.96, 0.4), V(1.76, 0.92, 0.38), TB];
  add('intaketube', 'airfuel', tube(intakePts, 0.038), { parts: ['Air filter'], label: '', modes: GAS, labelled: false });
  add('maf', 'airfuel', at(cylAxis(0.043, 0.06, 'x', 20).rotateY(0.9), 1.56, 0.87, 0.5), { parts: ['Mass airflow sensor (MAF)'], label: 'MAF sensor', modes: ICE, anchor: V(1.52, 0.93, 0.53) });
  add('throttle', 'airfuel', merge([at(cylAxis(0.042, 0.06, 'z', 20), TB.x, TB.y, TB.z - 0.02), at(rbox(0.05, 0.05, 0.04, 0.008), TB.x + 0.04, TB.y + 0.02, TB.z - 0.02)]), { parts: ['Throttle body'], modes: ICE, anchor: V(TB.x + 0.05, TB.y + 0.06, TB.z) });
  const runners = BORES.map(z => tube([V(1.83, 0.86, z), V(1.86, 0.78, z), V(1.8, 0.74, z), V(1.72, 0.8, z)], 0.024));
  add('manifold', 'airfuel', merge([at(cylAxis(0.055, 0.52, 'z', 24), 1.84, 0.87, 0.1), ...runners]), { parts: ['Intake manifold'], modes: ICE, anchor: V(1.9, 0.92, 0.0) });
  add('map', 'airfuel', at(rbox(0.03, 0.02, 0.03, 0.005), 1.84, 0.93, -0.05), { parts: ['MAP sensor'], modes: ICE, labelled: false });
  add('fuelrail', 'airfuel', merge([at(cylAxis(0.011, 0.44, 'z', 12), 1.72, 0.86, 0.1), ...BORES.map(z => cylBetween(V(1.72, 0.86, z), V(1.69, 0.79, z), 0.009, 10))]), { parts: ['Fuel rail', 'Fuel injector'], label: 'Fuel rail + injectors', modes: ICE, anchor: V(1.72, 0.9, 0.3) });
  add('hpfp', 'airfuel', at(cylAxis(0.028, 0.07, 'y', 18), EX + 0.06, 0.965, -0.15), { parts: ['High-pressure fuel pump'], modes: ICE, anchor: V(EX + 0.06, 1.01, -0.16) });
  // saddle fuel tank under the rear seat (clears the driveshaft and exhaust tunnel)
  const tankX = -0.78;
  add('tank', 'airfuel', merge([at(rbox(0.55, 0.22, 0.3, 0.06), tankX, 0.285, -0.33), at(rbox(0.55, 0.22, 0.3, 0.06), tankX, 0.285, 0.33), at(rbox(0.5, 0.07, 0.4, 0.03), tankX, 0.37, 0)]), { parts: ['Fuel tank'], modes: ICE, anchor: V(tankX, 0.42, -0.4) });
  add('fuelpump', 'airfuel', at(cylAxis(0.03, 0.12, 'y', 16), tankX + 0.05, 0.29, -0.3), { parts: ['Fuel pump', 'Fuel filter'], label: 'In-tank pump', modes: ICE, anchor: V(tankX + 0.05, 0.37, -0.3) });
  const fuelLine = [V(tankX + 0.28, 0.22, -0.4), V(0.2, 0.19, -0.4), V(0.9, 0.22, -0.4), V(1.14, 0.46, -0.3), V(1.3, 0.78, -0.2), V(EX + 0.06, 0.95, -0.15), V(1.66, 0.93, -0.14), V(1.72, 0.86, -0.12)];
  add('fuelline', 'airfuel', tube(fuelLine, 0.007), { parts: ['Fuel filter'], label: '', modes: ICE, labelled: false });
  add('filler', 'airfuel', tube([V(tankX - 0.18, 0.39, 0.42), V(-1.05, 0.6, 0.55), V(-1.28, 0.8, 0.7), V(-1.56, 0.88, 0.83)], 0.024), { parts: ['Fuel tank'], label: '', modes: ICE, labelled: false });
  flows.push({ sys: 'airfuel', modes: ICE, color: 0xbfefff, r: 0.02, speed: 0.3, pts: [V(1.73, 0.8, 0.6), ...intakePts, V(1.84, 0.87, 0.2), V(1.84, 0.87, -0.1)] });
  flows.push({ sys: 'airfuel', modes: ICE, color: 0x7fd3ea, r: 0.012, speed: 0.12, pts: fuelLine });
  // turbo + intercooler (charge air)
  const turboC = V(1.22, 0.62, 0.02);
  add('turbo', 'airfuel', merge([at(new THREE.TorusGeometry(0.06, 0.032, 12, 28), turboC.x, turboC.y, turboC.z + 0.05), at(new THREE.TorusGeometry(0.055, 0.028, 12, 28), turboC.x, turboC.y, turboC.z - 0.07), at(cylAxis(0.035, 0.12, 'z', 16), turboC.x, turboC.y, turboC.z - 0.01)]), { parts: ['Turbocharger'], variant: 'metal', modes: GAS, anchor: V(turboC.x - 0.05, turboC.y + 0.1, turboC.z - 0.07) });
  add('intercooler', 'airfuel', at(rbox(0.06, 0.16, 0.9, 0.015), 2.07, 0.31, 0), { parts: ['Intercooler / charge-air cooler'], modes: GAS, anchor: V(2.1, 0.32, -0.46) });
  add('chargepipes', 'airfuel', merge([tube([V(turboC.x, turboC.y, -0.1), V(1.16, 0.45, -0.2), V(1.3, 0.24, -0.25), V(1.9, 0.24, -0.4), V(2.05, 0.3, -0.42)], 0.03), tube([V(2.05, 0.3, 0.42), V(1.95, 0.4, 0.5), V(1.9, 0.72, 0.45), V(1.86, 0.86, 0.4), TB], 0.03)]), { parts: ['Intercooler / charge-air cooler'], label: '', modes: GAS, labelled: false });

  /* ---------------- cooling */
  add('radiator', 'cooling', at(rbox(0.05, 0.42, 1.12, 0.012), 1.97, 0.53, 0), { parts: ['Radiator'], anchor: V(1.99, 0.76, 0.3) });
  const fans = new THREE.Group();
  anim.fans = [];
  for (const z of [-0.26, 0.26]) {
    const hubM = new THREE.Group(); hubM.position.set(1.91, 0.53, z);
    const blades = merge([cylAxis(0.035, 0.03, 'x', 16), ...Array.from({ length: 7 }, (_, i) => at(rbox(0.006, 0.13, 0.05, 0.004).rotateX(i / 7 * Math.PI * 2).rotateY(0.3), 0, Math.cos(i / 7 * Math.PI * 2) * 0.085, Math.sin(i / 7 * Math.PI * 2) * 0.085))]);
    hubM.add(new THREE.Mesh(blades, matFor('cooling'))); fans.add(hubM); anim.fans.push(hubM);
  }
  fans.add(new THREE.Mesh(merge([at(new THREE.TorusGeometry(0.17, 0.012, 8, 36).rotateY(Math.PI / 2), 1.92, 0.53, -0.26), at(new THREE.TorusGeometry(0.17, 0.012, 8, 36).rotateY(Math.PI / 2), 1.92, 0.53, 0.26)]), matFor('cooling')));
  add('fans', 'cooling', fans, { parts: ['Cooling fan'], anchor: V(1.9, 0.72, -0.3) });
  const upperHose = [V(EX + 0.12, 0.8, 0.4), V(1.78, 0.83, 0.47), V(1.9, 0.76, 0.5), V(1.96, 0.72, 0.5)];
  const lowerHose = [V(1.96, 0.35, 0.5), V(1.86, 0.3, 0.46), V(1.72, 0.42, 0.44), V(EX + 0.08, 0.62, 0.44)];
  add('hoses', 'cooling', merge([tube(upperHose, 0.02), tube(lowerHose, 0.02)]), { parts: ['Radiator'], label: 'Radiator hoses', modes: ICE, anchor: V(1.8, 0.86, 0.48) });
  add('thermostat', 'cooling', at(cylAxis(0.03, 0.05, 'x', 16), EX + 0.12, 0.8, 0.39), { parts: ['Thermostat', 'Coolant temperature sensor'], modes: ICE, anchor: V(EX + 0.15, 0.84, 0.44) });
  add('waterpump', 'cooling', merge([at(cylAxis(0.05, 0.025, 'z', 24), EX + 0.08, 0.66, 0.46), at(cylAxis(0.035, 0.03, 'z', 18), EX + 0.08, 0.66, 0.43)]), { parts: ['Water pump'], modes: ICE, anchor: V(EX + 0.12, 0.7, 0.5) });
  add('exptank', 'cooling', merge([at(rbox(0.12, 0.12, 0.16, 0.03), 1.9, 0.84, -0.45), at(cylAxis(0.022, 0.025, 'y', 16), 1.9, 0.91, -0.42)]), { parts: ['Coolant reservoir / expansion tank', 'Pressure cap'], label: 'Expansion tank + cap', anchor: V(1.9, 0.94, -0.45) });
  const heaterA = [V(EX - 0.17, 0.7, 0.3), V(1.05, 0.72, 0.32), V(0.7, 0.7, 0.2), V(0.62, 0.66, 0.15)];
  add('heaterhoses', 'cooling', merge([tube(heaterA, 0.014), tube(heaterA.map(p => p.clone().add(V(0, -0.05, 0.04))), 0.014)]), { parts: ['Heater core'], label: '', modes: ICE, labelled: false });
  add('heatercore', 'cooling', at(rbox(0.05, 0.16, 0.22, 0.008), 0.56, 0.62, 0.12), { parts: ['Heater core'], anchor: V(0.56, 0.72, 0.15) });
  flows.push({ sys: 'cooling', modes: ICE, color: 0x60a5fa, r: 0.026, speed: 0.18, pts: [...upperHose, V(1.97, 0.6, 0.3), V(1.97, 0.45, 0.0), V(1.97, 0.4, 0.4), ...lowerHose, V(EX, 0.64, 0.3), V(EX + 0.12, 0.8, 0.4)], closed: true });

  /* ---------------- transmission (automatic transaxle; hybrid gets an e-CVT with two motor-generators) */
  const bell = lathe([[0.02, 0], [0.17, 0.0], [0.155, 0.12], [0.02, 0.12]], 40); bell.rotateX(Math.PI / 2); bell.translate(EX, CR.y, -0.335);
  add('transaxle', 'transmission', merge([bell, at(rbox(0.4, 0.36, 0.26, 0.05), 1.46, 0.43, -0.47)]), { parts: ['Transmission fluid pump', 'Valve body', 'Clutch (manual)'], label: 'Transaxle', shell: true, variant: 'shell', modes: GAS, anchor: V(1.46, 0.66, -0.5) });
  add('torqueconv', 'transmission', at(new THREE.TorusGeometry(0.1, 0.045, 14, 32), EX, CR.y, -0.27), { parts: ['Torque converter'], variant: 'metal', modes: GAS, anchor: V(EX + 0.05, CR.y + 0.16, -0.28) });
  add('planetary', 'transmission', merge([at(cylAxis(0.1, 0.05, 'z', 28), 1.48, 0.46, -0.42), at(cylAxis(0.09, 0.04, 'z', 28), 1.48, 0.46, -0.5), at(cylAxis(0.1, 0.03, 'z', 28), 1.48, 0.46, -0.56)]), { parts: ['Planetary gearset', 'Clutch pack', 'CVT belt / chain and pulleys'], label: 'Gearsets + clutches', variant: 'metal', modes: GAS, anchor: V(1.5, 0.58, -0.62) });
  add('valvebody', 'transmission', at(rbox(0.22, 0.04, 0.18, 0.01), 1.46, 0.27, -0.47), { parts: ['Valve body', 'Shift / pressure-control solenoid'], modes: GAS, anchor: V(1.5, 0.24, -0.6) });
  add('atfcooler', 'transmission', merge([at(rbox(0.03, 0.1, 0.26, 0.01), 2.0, 0.28, -0.3), tube([V(2.0, 0.3, -0.18), V(1.8, 0.28, -0.3), V(1.62, 0.35, -0.42)], 0.008)]), { parts: ['Transmission cooler'], modes: GAS, anchor: V(2.02, 0.34, -0.38) });
  add('ecvt', 'transmission', at(rbox(0.44, 0.4, 0.3, 0.06), 1.44, 0.44, -0.49), { parts: ['Planetary gearset'], label: 'e-CVT transaxle', shell: true, variant: 'shell', modes: HY, anchor: V(1.44, 0.68, -0.52) });
  add('mg', 'hybridev', merge([at(cylAxis(0.12, 0.1, 'z', 32), 1.46, 0.46, -0.42), at(cylAxis(0.13, 0.11, 'z', 32), 1.44, 0.44, -0.56)]), { parts: ['Traction motor / generator'], label: 'Motor-generators', modes: HY, anchor: V(1.44, 0.6, -0.66) });

  /* ---------------- drivetrain: front-biased AWD (gas), FWD (hybrid), dual-motor (EV) */
  const halfShaft = (x, zIn, zOut, y = WR) => {
    const s = Math.sign(zOut), a = V(x, y, zIn), b = V(x, WR, zOut - s * 0.08);
    return { shaft: cylBetween(a, b, 0.017, 12), boots: [boot(a, a.clone().lerp(b, 0.16), 0.045, 0.022), boot(b, b.clone().lerp(a, 0.16), 0.042, 0.022)] };
  };
  const fl = halfShaft(AX_F, -0.6, -TRACK), fr = halfShaft(AX_F, 0.3, TRACK);
  add('cvaxles', 'drivetrain', merge([fl.shaft, fr.shaft, cylBetween(V(AX_F, WR, -0.34), V(AX_F, WR, 0.3), 0.02, 12)]), { parts: ['CV axle'], label: 'CV axles', modes: ICE, drives: ['fwd', 'awd'], anchor: V(AX_F, WR - 0.07, 0.55) });
  add('cvboots', 'drivetrain', merge([...fl.boots, ...fr.boots]), { parts: ['CV joint boot'], modes: ICE, drives: ['fwd', 'awd'], anchor: V(AX_F, WR + 0.08, -0.62) });
  add('diff', 'drivetrain', merge([at(cylAxis(0.1, 0.03, 'z', 36), AX_F, WR, -0.5), at(new THREE.SphereGeometry(0.06, 18, 12), AX_F, WR, -0.47)]), { parts: ['Differential', 'Ring and pinion', 'Limited-slip / locking differential'], label: 'Front differential', variant: 'metal', modes: ICE, drives: ['fwd', 'awd'], anchor: V(AX_F - 0.05, WR - 0.12, -0.5) });
  // AWD: power take-off, two-piece driveshaft with U-joints, rear differential and half-shafts (gas model)
  const dsA = V(1.26, 0.26, -0.07), dsM = V(0.0, 0.235, -0.07), dsB = V(-1.14, 0.3, -0.03);
  add('ptu', 'drivetrain', at(rbox(0.14, 0.14, 0.14, 0.03), 1.33, 0.31, -0.16), { parts: ['Transfer case'], label: 'Power take-off unit', modes: GAS, drives: ['awd', 'rwd'], anchor: V(1.3, 0.2, -0.22) });
  add('driveshaft', 'drivetrain', merge([cylBetween(dsA, dsM, 0.03, 14), cylBetween(dsM, dsB, 0.03, 14), at(rbox(0.06, 0.08, 0.1, 0.015), 0, 0.235, -0.07)]), { parts: ['Driveshaft'], modes: GAS, drives: ['awd', 'rwd'], anchor: V(-0.5, 0.2, -0.2) });
  add('ujoints', 'drivetrain', merge([dsA, dsM, dsB].map(p => at(new THREE.SphereGeometry(0.04, 12, 10).scale(1, 0.8, 1.3), p.x, p.y, p.z))), { parts: ['Universal joint (U-joint)'], label: 'U-joints', modes: GAS, drives: ['awd', 'rwd'], anchor: V(0.0, 0.3, -0.07) });
  const rl = halfShaft(AX_R, -0.12, -TRACK), rr = halfShaft(AX_R, 0.12, TRACK);
  add('reardiff', 'drivetrain', merge([at(new THREE.SphereGeometry(0.12, 24, 16).scale(1.1, 0.95, 1), AX_R, WR + 0.01, 0), at(cylAxis(0.05, 0.12, 'x', 16), AX_R + 0.14, WR + 0.01, -0.02)]), { parts: ['Differential', 'Ring and pinion'], label: 'Rear differential', variant: 'metal', modes: GAS, drives: ['awd', 'rwd'], anchor: V(AX_R, WR + 0.16, 0) });
  add('rearaxles', 'drivetrain', merge([rl.shaft, rr.shaft, ...rl.boots, ...rr.boots]), { parts: ['CV axle', 'CV joint boot'], label: '', modes: ['gas', 'hybrid', 'ev'], drives: ['awd', 'rwd'], labelled: false });

  /* ---------------- suspension */
  for (const s of [-1, 1]) {
    const z = s * 0.66, top = V(1.36, 0.9, s * 0.59), knuckle = V(AX_F, WR + 0.06, s * 0.655);
    add('strut' + s, 'suspension', merge([cylBetween(knuckle, top, 0.024, 14), cylBetween(knuckle.clone().lerp(top, 0.48), top, 0.014, 10), at(cylAxis(0.08, 0.02, 'y', 24), top.x, top.y - 0.07, top.z), at(cylAxis(0.075, 0.018, 'y', 24), knuckle.x, knuckle.y + 0.28, knuckle.z + 0.015 * -s)]), { parts: ['MacPherson strut', 'Shock absorber / damper'], label: s > 0 ? 'MacPherson strut' : '', anchor: V(1.36, 0.96, s * 0.6), labelled: s > 0 });
    const sp = helixGeo(V(0, 0, 0), 0.068, 0.23, 5.5, 0.008);
    const spMesh = new THREE.Mesh(sp, matFor('suspension'));
    spMesh.position.copy(knuckle.clone().lerp(top, 0.47)); spMesh.quaternion.setFromUnitVectors(V(0, 1, 0), top.clone().sub(knuckle).normalize());
    add('coil' + s, 'suspension', spMesh, { parts: ['Coil spring'], label: s > 0 ? 'Coil spring' : '', labelled: s > 0 });
    add('knuckle' + s, 'suspension', merge([at(rbox(0.07, 0.24, 0.05, 0.015), AX_F, WR, s * 0.66), cylBetween(V(AX_F, WR - 0.02, s * 0.66), V(1.22, WR - 0.03, s * 0.62), 0.012, 8)]), { parts: ['Steering knuckle'], label: s < 0 ? 'Steering knuckle' : '', labelled: s < 0 });
    const bj = V(AX_F, 0.19, s * 0.66);
    add('lca' + s, 'suspension', merge([cylBetween(bj, V(1.62, 0.21, s * 0.36), 0.018, 10), cylBetween(bj, V(1.18, 0.21, s * 0.34), 0.018, 10), cylBetween(V(1.62, 0.21, s * 0.36), V(1.18, 0.21, s * 0.34), 0.012, 8)]), { parts: ['Control arm'], label: s > 0 ? 'Lower control arm' : '', labelled: s > 0 });
    add('bj' + s, 'suspension', at(new THREE.SphereGeometry(0.022, 12, 10), bj.x, bj.y, bj.z), { parts: ['Ball joint'], label: s < 0 ? 'Ball joint' : '', labelled: s < 0 });
    add('bush' + s, 'suspension', merge([at(cylAxis(0.022, 0.05, 'x', 12), 1.62, 0.21, s * 0.36), at(cylAxis(0.022, 0.05, 'z', 12), 1.18, 0.21, s * 0.34)]), { parts: ['Suspension bushing'], labelled: false });
    // rear multi-link
    const rk = V(AX_R, WR, s * 0.66);
    add('rdamper' + s, 'suspension', cylBetween(V(AX_R + 0.14, 0.24, s * 0.62), V(AX_R + 0.2, 0.68, s * 0.6), 0.022, 12), { parts: ['Shock absorber / damper'], label: s < 0 ? 'Rear damper' : '', labelled: s < 0 });
    add('rcoil' + s, 'suspension', helixGeo(V(AX_R - 0.16, 0.26, s * 0.5), 0.06, 0.26, 5, 0.009), { parts: ['Coil spring'], labelled: false });
    add('rlinks' + s, 'suspension', merge([cylBetween(V(AX_R - 0.04, 0.22, s * 0.64), V(AX_R - 0.1, 0.24, s * 0.3), 0.017, 10), cylBetween(V(AX_R + 0.02, 0.45, s * 0.62), V(AX_R + 0.02, 0.47, s * 0.34), 0.012, 8), cylBetween(V(AX_R + 0.04, 0.28, s * 0.66), V(-0.86, 0.3, s * 0.7), 0.017, 10), at(rbox(0.08, 0.26, 0.05, 0.015), rk.x, rk.y, rk.z)]), { parts: ['Control arm', 'Suspension bushing'], label: s < 0 ? 'Rear multi-link' : '', labelled: s < 0 });
  }
  add('swaybar', 'suspension', merge([tube([V(1.5, 0.3, -0.62), V(1.66, 0.26, -0.48), V(1.66, 0.26, 0.48), V(1.5, 0.3, 0.62)], 0.012), cylBetween(V(1.5, 0.3, -0.62), V(1.43, 0.54, -0.63), 0.007, 8), cylBetween(V(1.5, 0.3, 0.62), V(1.43, 0.54, 0.63), 0.007, 8)]), { parts: ['Sway / anti-roll bar'], anchor: V(1.7, 0.2, 0.3) });
  add('rswaybar', 'suspension', tube([V(AX_R - 0.02, 0.3, -0.6), V(AX_R - 0.12, 0.24, -0.45), V(AX_R - 0.12, 0.24, 0.45), V(AX_R - 0.02, 0.3, 0.6)], 0.011), { parts: ['Sway / anti-roll bar'], labelled: false });

  /* ---------------- steering */
  add('rack', 'steering', merge([at(cylAxis(0.026, 0.62, 'z', 16), 1.18, 0.33, 0), at(cylAxis(0.04, 0.12, 'z', 16), 1.18, 0.33, -0.32), boot(V(1.18, 0.33, -0.31), V(1.18, 0.33, -0.42), 0.032, 0.016), boot(V(1.18, 0.33, 0.31), V(1.18, 0.33, 0.42), 0.032, 0.016)]), { parts: ['Rack-and-pinion steering gear'], label: 'Steering rack', anchor: V(1.14, 0.26, 0.1) });
  add('eps', 'steering', at(cylAxis(0.045, 0.15, 'z', 20), 1.24, 0.34, 0.16), { parts: ['Electric power steering motor', 'Hydraulic power-steering pump'], label: 'EPS motor', anchor: V(1.26, 0.24, 0.2) });
  anim.tieRods = [];
  for (const s of [-1, 1]) {
    const inner = new THREE.Mesh(cylAxis(0.01, 0.2, 'z', 10), matFor('steering')); inner.position.set(1.19, 0.325, s * 0.52);
    add('itr' + s, 'steering', inner, { parts: ['Inner tie rod'], label: s > 0 ? 'Inner tie rod' : '', labelled: s > 0 });
    const outer = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), matFor('steering')); outer.position.set(1.22, 0.315, s * 0.63);
    add('otr' + s, 'steering', outer, { parts: ['Outer tie-rod end'], label: s < 0 ? 'Outer tie-rod end' : '', labelled: s < 0 });
    anim.tieRods.push({ inner, outer, s });
  }
  const colPts = [V(1.18, 0.33, -0.34), V(0.95, 0.47, -0.36), V(0.66, 0.62, -0.37), V(0.4, 0.8, -0.37), V(0.2, 0.9, -0.37)];
  const wheelG = new THREE.TorusGeometry(0.185, 0.019, 12, 48); wheelG.rotateY(Math.PI / 2); wheelG.rotateZ(-0.45);
  const spokes = merge([cylBetween(V(0, 0, 0), V(0, -0.17, 0), 0.012, 8), cylBetween(V(0, 0, 0), V(0, 0.02, 0.17), 0.012, 8), cylBetween(V(0, 0, 0), V(0, 0.02, -0.17), 0.012, 8)]); spokes.rotateZ(-0.45);
  add('column', 'steering', merge([tube(colPts, 0.018), at(wheelG, 0.18, 0.91, -0.37), at(spokes, 0.18, 0.91, -0.37)]), { parts: ['Steering wheel / column'], label: 'Steering wheel + column', anchor: V(0.2, 1.1, -0.37) });
  add('sas', 'steering', at(cylAxis(0.035, 0.02, 'x', 20).rotateZ(-0.45), 0.34, 0.83, -0.37), { parts: ['Steering angle sensor'], labelled: false });

  /* ---------------- brakes (hydraulics; calipers + rotors live with each wheel) */
  add('booster', 'brakes', at(cylAxis(0.12, 0.13, 'x', 32), 0.75, 0.8, -0.42), { parts: ['Brake booster'], anchor: V(0.75, 0.95, -0.44) });
  add('mastercyl', 'brakes', merge([at(cylAxis(0.03, 0.17, 'x', 16), 0.9, 0.8, -0.42), at(rbox(0.09, 0.05, 0.11, 0.012), 0.9, 0.86, -0.42)]), { parts: ['Master cylinder', 'Brake fluid'], label: 'Master cylinder + fluid', anchor: V(0.95, 0.92, -0.4) });
  add('pedal', 'brakes', merge([cylBetween(V(0.6, 0.73, -0.42), V(0.44, 0.4, -0.42), 0.011, 8), at(rbox(0.03, 0.08, 0.08, 0.01).rotateZ(0.5), 0.44, 0.4, -0.42), cylBetween(V(0.58, 0.68, -0.42), V(0.69, 0.78, -0.42), 0.006, 6)]), { parts: ['Brake pedal'], anchor: V(0.42, 0.34, -0.42) });
  add('abs', 'brakes', at(rbox(0.12, 0.1, 0.1, 0.015), 1.04, 0.64, -0.6), { parts: ['ABS hydraulic control unit'], label: 'ABS unit', anchor: V(1.04, 0.72, -0.62) });
  const bl = [
    [V(0.99, 0.8, -0.42), V(1.04, 0.7, -0.52), V(1.04, 0.66, -0.58)],
    [V(1.04, 0.62, -0.62), V(1.2, 0.55, -0.66), V(1.32, 0.44, -0.68), V(AX_F - 0.1, WR + 0.08, -0.7)],
    [V(1.06, 0.62, -0.56), V(0.85, 0.78, -0.2), V(0.85, 0.78, 0.4), V(1.2, 0.56, 0.64), V(AX_F - 0.1, WR + 0.08, 0.7)],
    [V(1.0, 0.6, -0.62), V(0.9, 0.24, -0.58), V(0.0, 0.19, -0.56), V(-1.0, 0.21, -0.56), V(AX_R + 0.12, 0.36, -0.64), V(AX_R - 0.1, WR + 0.08, -0.7)],
    [V(-1.0, 0.21, -0.56), V(-1.1, 0.24, 0.0), V(AX_R + 0.12, 0.36, 0.64), V(AX_R - 0.1, WR + 0.08, 0.7)]
  ];
  add('brakelines', 'brakes', merge(bl.map(p => tube(p, 0.005))), { parts: ['Brake line / flex hose', 'Brake fluid'], label: 'Brake lines', anchor: V(-0.2, 0.26, -0.6) });
  bl.forEach((p, i) => flows.push({ sys: 'brakes', color: 0xff8a80, r: 0.01, speed: 0.35, pts: i === 4 ? p : p, delay: i * 0.1 }));

  /* ---------------- electrical */
  const battX = 1.68;
  add('battery', 'electrical', merge([at(rbox(0.26, 0.19, 0.17, 0.015), battX, 0.72, -0.56), at(cylAxis(0.012, 0.03, 'y', 10), battX + 0.08, 0.83, -0.6), at(cylAxis(0.012, 0.03, 'y', 10), battX - 0.08, 0.83, -0.6)]), { parts: ['12-volt battery'], label: '12 V battery', modes: GAS, anchor: V(battX, 0.9, -0.56) });
  add('battery12h', 'electrical', at(rbox(0.22, 0.17, 0.15, 0.015), -1.95, 0.46, 0.5), { parts: ['12-volt battery'], label: '12 V battery', modes: HY, anchor: V(-1.95, 0.6, 0.5) });
  add('battery12e', 'electrical', at(rbox(0.2, 0.15, 0.13, 0.015), 1.74, 0.7, -0.58), { parts: ['12-volt battery'], label: '12 V battery', modes: EV, anchor: V(1.74, 0.84, -0.58) });
  add('starter', 'electrical', merge([at(cylAxis(0.045, 0.18, 'z', 18), 1.2, 0.5, -0.31), at(cylAxis(0.025, 0.12, 'z', 14), 1.2, 0.56, -0.29)]), { parts: ['Starter motor', 'Starter solenoid'], label: 'Starter + solenoid', modes: GAS, anchor: V(1.18, 0.64, -0.34) });
  add('alternator', 'electrical', merge([at(cylAxis(0.065, 0.12, 'z', 24), 1.77, 0.63, 0.34), at(cylAxis(0.03, 0.02, 'z', 16), 1.77, 0.63, 0.41)]), { parts: ['Alternator'], modes: GAS, anchor: V(1.82, 0.72, 0.4) });
  add('ecu', 'electrical', at(rbox(0.2, 0.04, 0.15, 0.008).rotateZ(-0.3), 0.98, 0.86, 0.6), { parts: ['ECU / PCM', 'CAN bus'], label: 'ECU (PCM)', anchor: V(0.98, 0.93, 0.62) });
  add('fusebox', 'electrical', at(rbox(0.18, 0.1, 0.14, 0.015), 1.72, 0.84, -0.3), { parts: ['Fuse', 'Relay'], label: 'Fuse + relay box', anchor: V(1.72, 0.93, -0.3) });
  add('cps', 'electrical', merge([at(cylAxis(0.01, 0.04, 'x', 10), EX - 0.18, CR.y - 0.02, -0.17), at(cylAxis(0.01, 0.04, 'y', 10), EX - 0.06, 0.93, 0.41)]), { parts: ['Crankshaft position sensor', 'Camshaft position sensor'], label: 'Crank + cam sensors', modes: ICE, anchor: V(EX - 0.2, CR.y - 0.05, -0.2) });
  add('ground', 'electrical', cylBetween(V(EX - 0.1, 0.72, -0.18), V(1.3, 0.86, -0.62), 0.008, 8), { parts: ['Ground cable / strap'], modes: ICE, labelled: false });
  const harness = [V(0.98, 0.84, 0.55), V(1.3, 0.97, 0.3), V(1.5, 1.0, 0.0), V(1.7, 0.92, -0.3), V(battX, 0.83, -0.5)];
  const harness2 = [V(0.9, 0.8, -0.2), V(0.62, 0.3, -0.72), V(-0.4, 0.24, -0.78), V(-1.6, 0.4, -0.72), V(-2.15, 0.85, -0.58)];
  add('harness', 'electrical', merge([tube(harness, 0.01), tube(harness2, 0.009)]), { parts: ['CAN bus', 'Fuse', 'Relay'], label: 'Wiring + CAN bus', anchor: V(-0.6, 0.3, -0.82) });
  add('o2', 'electrical', merge([at(cylAxis(0.01, 0.05, 'y', 10), 1.19, 0.58, 0.09), at(cylAxis(0.01, 0.05, 'y', 10), 0.94, 0.3, 0.12)]), { parts: ['Oxygen sensor'], label: 'Oxygen sensors', modes: ICE, anchor: V(0.9, 0.36, 0.2) });
  const belt = [V(EX, CR.y - 0.08, 0), V(EX + 0.08, CR.y - 0.07, 0), V(1.84, 0.37, 0), V(1.85, 0.47, 0), V(1.8, 0.7, 0), V(1.72, 0.7, 0), V(EX + 0.13, 0.73, 0), V(EX + 0.03, 0.71, 0), V(EX - 0.06, CR.y + 0.03, 0)].map(p => p.setZ(0.47));
  add('accbelt', 'electrical', tube(belt, 0.006, true), { parts: ['Alternator'], label: '', modes: GAS, labelled: false });
  flows.push({ sys: 'electrical', color: 0xfff176, r: 0.016, speed: 0.4, pts: [V(battX, 0.83, -0.56), V(1.72, 0.9, -0.3), V(1.5, 1.0, 0.0), V(1.3, 0.97, 0.3), V(0.98, 0.86, 0.58)] });
  flows.push({ sys: 'electrical', color: 0xfff176, r: 0.015, speed: 0.4, pts: harness2 });

  /* ---------------- heating + A/C */
  add('compressor', 'hvac', merge([at(cylAxis(0.06, 0.15, 'z', 22), 1.8, 0.42, 0.37), at(cylAxis(0.045, 0.02, 'z', 18), 1.8, 0.42, 0.46)]), { parts: ['A/C compressor'], modes: ICE, anchor: V(1.86, 0.36, 0.44) });
  add('ecompressor', 'hvac', at(cylAxis(0.06, 0.2, 'z', 22), 1.8, 0.45, 0.4), { parts: ['A/C compressor', 'Electric A/C compressor / heat pump'], label: 'Electric A/C compressor', modes: EV, anchor: V(1.84, 0.56, 0.44) });
  add('condenser', 'hvac', at(rbox(0.02, 0.4, 1.08, 0.006), 2.03, 0.53, 0), { parts: ['Condenser'], anchor: V(2.05, 0.76, -0.2) });
  add('drier', 'hvac', at(cylAxis(0.025, 0.2, 'y', 14), 1.98, 0.52, 0.6), { parts: ['Receiver-drier / accumulator'], anchor: V(2.0, 0.66, 0.64) });
  add('hvacbox', 'hvac', merge([at(rbox(0.28, 0.26, 0.62, 0.04), 0.5, 0.66, 0.05), at(cylAxis(0.08, 0.1, 'y', 24), 0.48, 0.58, 0.46)]), { parts: ['Evaporator', 'Blower motor', 'Heater core', 'Blend / mode door actuator'], label: 'HVAC box (evaporator + blower)', shell: true, variant: 'shell', anchor: V(0.46, 0.84, 0.3) });
  add('txv', 'hvac', at(rbox(0.04, 0.05, 0.05, 0.008), 0.7, 0.78, 0.36), { parts: ['Expansion valve / orifice tube'], label: 'Expansion valve', anchor: V(0.72, 0.84, 0.4) });
  const acLoop = [V(1.8, 0.48, 0.3), V(1.95, 0.72, 0.48), V(2.02, 0.7, 0.52), V(2.02, 0.38, 0.52), V(1.98, 0.42, 0.6), V(1.96, 0.7, 0.62), V(1.3, 0.86, 0.66), V(0.72, 0.8, 0.38), V(0.6, 0.7, 0.2), V(0.72, 0.74, 0.32), V(1.2, 0.74, 0.55), V(1.72, 0.5, 0.33)];
  add('aclines', 'hvac', merge([tube(acLoop.slice(0, 4), 0.01), tube(acLoop.slice(4, 8), 0.008), tube(acLoop.slice(9), 0.012)]), { parts: ['Receiver-drier / accumulator'], label: 'Refrigerant lines', anchor: V(1.3, 0.93, 0.66) });
  flows.push({ sys: 'hvac', color: 0xcfe6ff, r: 0.014, speed: 0.22, pts: acLoop, closed: true });

  /* ---------------- exhaust + emissions */
  const collector = V(1.26, 0.66, 0.1);
  const exRunners = BORES.map(z => tube([V(EX - 0.17, 0.8, z), V(1.33, 0.76, z), V(1.28, 0.7, (z + 0.1) / 2), collector], 0.021));
  add('exmanifold', 'exhaust', merge(exRunners), { parts: ['Exhaust manifold'], variant: 'metal', modes: ICE, anchor: V(1.3, 0.84, 0.3) });
  const catA = V(1.16, 0.53, 0.08), catB = V(0.99, 0.36, 0.08);
  add('cat', 'exhaust', merge([cylBetween(catA, catB, 0.062, 24), cylBetween(V(1.24, 0.6, 0.05), catA, 0.028, 12)]), { parts: ['Catalytic converter'], variant: 'metal', modes: ICE, anchor: V(1.02, 0.5, 0.22) });
  const exPipe = [catB, V(0.92, 0.25, 0.09), V(0.6, 0.205, 0.1), V(0.32, 0.205, 0.1)];
  const exPipe2 = [V(-0.12, 0.205, 0.1), V(-0.6, 0.21, 0.1), V(-1.0, 0.24, 0.12), V(-1.2, 0.43, 0.2), V(-1.42, 0.43, 0.24), V(-1.6, 0.3, 0.28)];
  add('expipe', 'exhaust', merge([tube(exPipe, 0.028), tube(exPipe2, 0.028), tube([V(-2.1, 0.29, 0.42), V(-2.33, 0.27, 0.46)], 0.03)]), { parts: ['Exhaust manifold'], label: '', variant: 'metal', modes: ICE, labelled: false });
  add('resonator', 'exhaust', at(cylAxis(0.055, 0.44, 'x', 24), 0.1, 0.205, 0.1), { parts: ['Resonator'], variant: 'metal', modes: ICE, anchor: V(0.1, 0.13, 0.25) });
  add('muffler', 'exhaust', at(new THREE.CapsuleGeometry(0.1, 0.34, 8, 20).rotateZ(Math.PI / 2).scale(1, 0.9, 1.6), -1.86, 0.3, 0.3), { parts: ['Muffler'], variant: 'metal', modes: ICE, anchor: V(-1.9, 0.42, 0.34) });
  add('egr', 'exhaust', merge([at(rbox(0.05, 0.05, 0.05, 0.01), 1.84, 0.94, -0.12), tube([V(1.84, 0.94, -0.12), V(1.6, 1.0, -0.2), V(1.34, 0.86, -0.1), V(1.28, 0.7, 0.0)], 0.009)]), { parts: ['EGR valve'], modes: ICE, anchor: V(1.86, 1.0, -0.12) });
  add('evap', 'exhaust', merge([at(rbox(0.16, 0.1, 0.1, 0.02), -1.2, 0.33, -0.52), tube([V(-1.12, 0.33, -0.5), V(tankX, 0.4, -0.45)], 0.006)]), { parts: ['EVAP charcoal canister'], label: 'EVAP canister', modes: ICE, anchor: V(-1.22, 0.42, -0.54) });
  flows.push({ sys: 'exhaust', modes: ICE, color: 0xffb074, r: 0.034, speed: 0.28, pts: [collector, V(1.24, 0.6, 0.05), catA, catB, ...exPipe.slice(1), V(0.1, 0.205, 0.1), ...exPipe2, V(-1.86, 0.3, 0.3), V(-2.1, 0.29, 0.42), V(-2.33, 0.27, 0.46)] });

  /* ---------------- structure + safety */
  const rail = (pts, r = 0.028) => tube(pts, r);
  const pillar = (list) => list.map(([x, y]) => V(x, y, surfZ(x, y, y > 1.3 ? 0.075 : 0.045)));
  const sidePaths = s => [
    pillar([[0.62, 0.93], [0.4, 1.06], [0.1, 1.23], [-0.2, 1.35]]),            // A-pillar
    pillar([[-0.2, 1.35], [-0.6, 1.375], [-1.0, 1.365]]),                      // roof rail
    pillar([[-1.0, 1.365], [-1.3, 1.25], [-1.55, 1.09], [-1.72, 1.02]]),      // C-pillar
    pillar([[-0.34, 1.37], [-0.33, 1.0], [-0.3, 0.6], [-0.3, 0.26]]),         // B-pillar
    pillar([[0.64, 0.26], [0.0, 0.25], [-0.9, 0.26]]),                        // sill
    pillar([[0.64, 0.93], [0.64, 0.6], [0.64, 0.27]])                         // hinge pillar
  ].map(p => p.map(v => v.setZ(v.z * s)));
  add('unibody', 'structure', merge([-1, 1].flatMap(s => sidePaths(s).map(p => rail(p, 0.018))).concat([tube([V(-0.2, 1.35, -0.55), V(-0.2, 1.37, 0), V(-0.2, 1.35, 0.55)], 0.015), tube([V(-1.0, 1.37, -0.55), V(-1.0, 1.38, 0), V(-1.0, 1.37, 0.55)], 0.015), at(rbox(0.06, 0.05, 1.5, 0.01), -0.12, 0.23, 0), at(rbox(0.06, 0.05, 1.5, 0.01), -0.85, 0.23, 0)])), { parts: ['Unibody structure', 'Ladder frame'], label: 'Unibody cage', anchor: V(-0.6, 1.48, 0.0) });
  add('frailsF', 'structure', merge([-1, 1].map(s => at(rbox(1.36, 0.12, 0.09, 0.02), 1.38, 0.45, s * 0.67))), { parts: ['Unibody structure', 'Crumple zone'], label: 'Front frame rails', anchor: V(1.0, 0.56, 0.74) });
  const beamF = strip((z, y) => xFront(z, y) - 0.07, 0.45, -0.66, 0.66, 16), beamR = strip((z, y) => xRear(z, y) + 0.07, 0.48, -0.62, 0.62, 16);
  add('crash', 'structure', merge([tube(beamF, 0.04), ...[-1, 1].map(s => at(rbox(0.16, 0.1, 0.09, 0.015), 2.1, 0.45, s * 0.67)), tube(beamR, 0.036)]), { parts: ['Crumple zone'], label: 'Bumper beams + crash boxes', anchor: V(2.28, 0.56, 0.3) });
  add('zones', 'structure', merge([at(rbox(0.5, 0.5, 1.6, 0.04), 2.05, 0.5, 0), at(rbox(0.42, 0.5, 1.6, 0.04), -2.08, 0.62, 0)]), { parts: ['Crumple zone'], label: '', mat: new THREE.MeshBasicMaterial({ color: 0xff6b3d, transparent: true, opacity: 0.1, depthWrite: false }), labelled: false, noShadow: true });
  const subF = merge([...[-1, 1].map(s => at(rbox(0.72, 0.05, 0.06, 0.012), 1.42, 0.235, s * 0.4)), at(rbox(0.06, 0.05, 0.86, 0.012), 1.08, 0.235, 0), at(rbox(0.06, 0.05, 0.86, 0.012), 1.77, 0.235, 0)]);
  const subR = merge([...[-1, 1].map(s => at(rbox(0.5, 0.05, 0.06, 0.012), AX_R, 0.25, s * 0.34)), at(rbox(0.06, 0.05, 0.74, 0.012), AX_R + 0.24, 0.25, 0), at(rbox(0.06, 0.05, 0.74, 0.012), AX_R - 0.24, 0.25, 0)]);
  add('subframes', 'structure', merge([subF, subR]), { parts: ['Subframe / cradle', 'Crossmember'], label: 'Subframes + crossmembers', variant: 'metal', anchor: V(1.8, 0.18, 0.3) });
  add('rad support', 'structure', at(rbox(0.06, 0.05, 1.3, 0.012), 1.99, 0.8, 0), { parts: ['Crossmember'], labelled: false, variant: 'metal' });
  add('mounts', 'structure', merge([at(cylAxis(0.035, 0.05, 'y', 14), EX, 0.83, 0.58), at(cylAxis(0.035, 0.05, 'y', 14), 1.46, 0.63, -0.66), cylBetween(V(1.3, 0.4, 0.05), V(1.08, 0.26, 0.05), 0.016, 8)]), { parts: ['Engine / transmission mount'], label: 'Engine mounts', modes: ICE, anchor: V(EX, 0.9, 0.6) });
  add('doorbeams', 'structure', merge([-1, 1].flatMap(s => [cylBetween(V(0.52, 0.55, s * surfZ(0.5, 0.55, 0.06)), V(-0.22, 0.6, s * surfZ(-0.2, 0.6, 0.06)), 0.018, 10), cylBetween(V(-0.4, 0.58, s * surfZ(-0.4, 0.58, 0.06)), V(-1.02, 0.6, s * surfZ(-1.0, 0.6, 0.07)), 0.018, 10)])), { parts: ['Unibody structure'], label: 'Door intrusion beams', anchor: V(0.1, 0.62, -0.92) });
  add('airbags', 'structure', merge([at(cylAxis(0.07, 0.05, 'x', 24).rotateZ(-0.45), 0.2, 0.9, -0.37), at(rbox(0.14, 0.08, 0.3, 0.02), 0.43, 0.93, 0.38), ...[-1, 1].map(s => tube([V(0.45, 1.13, s * 0.66), V(0.0, 1.3, s * 0.61), V(-0.6, 1.33, s * 0.6), V(-1.2, 1.27, s * 0.62)], 0.022))]), { parts: ['Airbag module'], label: 'Airbags (front + curtain)', anchor: V(-0.2, 1.4, 0.62) });
  add('pretens', 'structure', merge([-1, 1].map(s => at(cylAxis(0.03, 0.09, 'y', 14), -0.3, 0.33, s * 0.74))), { parts: ['Seat belt pretensioner'], label: 'Belt pretensioners', anchor: V(-0.3, 0.44, 0.78) });

  /* ---------------- hybrid + EV hardware */
  const packTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#6f9e1f'; x.fillRect(0, 0, 512, 256); x.strokeStyle = 'rgba(10,20,5,.55)'; x.lineWidth = 6; for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(i * 512 / 6, 0); x.lineTo(i * 512 / 6, 256); x.stroke(); } x.beginPath(); x.moveTo(0, 128); x.lineTo(512, 128); x.stroke(); x.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) x.fillRect(i * 512 / 6 + 14, j * 128 + 14, 512 / 6 - 28, 10); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const packMat = new THREE.MeshStandardMaterial({ map: packTex, roughness: 0.6, metalness: 0.2 }); packMat.userData.base = new THREE.Color(0xa3e635);
  const packG = rbox(2.1, 0.13, 1.4, 0.03); packG.rotateX(0);
  add('pack', 'hybridev', at(packG, -0.1, 0.205, 0), { parts: ['High-voltage traction battery'], label: 'HV traction battery', mat: packMat, modes: EV, anchor: V(-0.5, 0.3, 0.72) });
  add('packh', 'hybridev', at(rbox(0.34, 0.2, 0.9, 0.03), -1.0, 0.43, 0), { parts: ['High-voltage traction battery'], label: 'HV battery', modes: HY, anchor: V(-1.0, 0.56, 0.4) });
  add('bms', 'hybridev', merge([at(rbox(0.14, 0.05, 0.2, 0.01), 0.86, 0.3, 0.3), at(rbox(0.14, 0.06, 0.22, 0.01), 0.86, 0.3, -0.25)]), { parts: ['Battery management system (BMS)', 'High-voltage contactors'], label: 'BMS + contactors', modes: EV, anchor: V(0.9, 0.38, -0.3) });
  const edu = (ax, s, id, label) => {
    const drives = ax > 0 ? ['fwd', 'awd'] : ['rwd', 'awd'];
    add(id + 'motor', 'hybridev', at(cylAxis(0.125, 0.3, 'z', 32), ax, 0.42, s * 0.2), { parts: ['Traction motor / generator', 'Regenerative braking'], label: label + ' motor', modes: EV, drives, anchor: V(ax, 0.58, s * 0.22) });
    add(id + 'gear', 'hybridev', at(rbox(0.3, 0.32, 0.2, 0.05), ax, 0.38, -s * 0.07), { parts: ['Reduction gearbox'], label: 'Reduction gearbox', modes: EV, drives, variant: 'metal', labelled: true });
    add(id + 'inv', 'hybridev', at(rbox(0.3, 0.1, 0.38, 0.02), ax + (ax > 0 ? 0.04 : -0.02), 0.63, s * 0.1), { parts: ['Inverter / motor controller'], label: label + ' inverter', modes: EV, drives, anchor: V(ax, 0.72, s * 0.1) });
  };
  edu(AX_F, 1, 'fdu', 'Front'); edu(AX_R, -1, 'rdu', 'Rear');
  add('evaxlesF', 'drivetrain', merge([cylBetween(V(AX_F, WR, -0.18), V(AX_F, WR, -TRACK + 0.08), 0.017, 12), cylBetween(V(AX_F, WR, 0.36), V(AX_F, WR, TRACK - 0.08), 0.017, 12), boot(V(AX_F, WR, -0.2), V(AX_F, WR, -0.28), 0.045, 0.022), boot(V(AX_F, WR, 0.36), V(AX_F, WR, 0.44), 0.045, 0.022)]), { parts: ['CV axle', 'CV joint boot'], label: '', modes: EV, drives: ['fwd', 'awd'], labelled: false });
  // e-AWD hybrids add a compact electric motor on the rear axle (no driveshaft)
  add('hrmotor', 'hybridev', merge([at(cylAxis(0.1, 0.24, 'z', 28), AX_R, 0.4, -0.16), at(rbox(0.24, 0.26, 0.16, 0.04), AX_R, 0.37, 0.05)]), { parts: ['Traction motor / generator'], label: 'Rear e-motor (e-AWD)', modes: HY, drives: ['awd'], anchor: V(AX_R, 0.56, -0.1) });
  add('pcu', 'hybridev', at(rbox(0.3, 0.12, 0.34, 0.02), 1.64, 0.76, -0.45), { parts: ['Inverter / motor controller', 'DC-DC converter'], label: 'Power control unit', modes: HY, anchor: V(1.64, 0.86, -0.45) });
  add('obc', 'hybridev', at(rbox(0.28, 0.09, 0.24, 0.02), -1.64, 0.45, -0.22), { parts: ['Onboard charger (OBC)'], label: 'Onboard charger', modes: EV, anchor: V(-1.66, 0.54, -0.22) });
  add('port', 'hybridev', merge([at(cylAxis(0.05, 0.05, 'z', 24), -1.55, 0.86, -0.83), at(rbox(0.14, 0.14, 0.02, 0.02), -1.55, 0.86, -0.86)]), { parts: ['DC fast-charge interface'], label: 'Charge port (DC fast)', modes: EV, anchor: V(-1.55, 0.98, -0.86) });
  add('dcdc', 'hybridev', at(rbox(0.18, 0.07, 0.2, 0.012), 1.7, 0.6, -0.3), { parts: ['DC-DC converter'], modes: EV, anchor: V(1.72, 0.66, -0.26) });
  const hvF = [V(0.95, 0.24, 0.25), V(1.1, 0.3, 0.3), V(1.3, 0.5, 0.3), V(AX_F + 0.02, 0.6, 0.25)];
  const hvR = [V(-1.15, 0.24, 0.25), V(-1.25, 0.4, 0.2), V(AX_R - 0.02, 0.6, 0.1)];
  const hvC = [V(-1.55, 0.84, -0.8), V(-1.62, 0.6, -0.5), V(-1.64, 0.47, -0.3), V(-1.4, 0.3, -0.3), V(-1.15, 0.24, -0.3)];
  add('hvcables', 'hybridev', merge([tube(hvF, 0.017), tube(hvR, 0.017), tube(hvC, 0.014)]), { parts: ['High-voltage contactors'], label: 'HV cables (orange)', variant: 'hv', modes: EV, anchor: V(1.2, 0.38, 0.4) });
  const hvH = [V(-0.85, 0.36, -0.3), V(-0.6, 0.22, -0.32), V(0.6, 0.21, -0.32), V(1.0, 0.3, -0.36), V(1.3, 0.7, -0.45), V(1.5, 0.76, -0.45)];
  add('hvcablesh', 'hybridev', tube(hvH, 0.016), { parts: ['High-voltage contactors'], label: 'HV cables (orange)', variant: 'hv', modes: HY, anchor: V(0.2, 0.3, -0.36) });
  const thermal = [V(1.96, 0.36, -0.2), V(1.4, 0.24, -0.5), V(0.95, 0.22, -0.5), V(-1.0, 0.21, -0.66), V(-1.1, 0.22, 0.6), V(0.95, 0.22, 0.52), V(1.5, 0.3, 0.55), V(1.96, 0.4, 0.3)];
  add('thermal', 'hybridev', tube(thermal, 0.011, true), { parts: ['Battery thermal-management circuit'], label: 'Battery coolant loop', modes: EV, anchor: V(-1.0, 0.3, 0.68) });
  flows.push({ sys: 'hybridev', modes: EV, color: 0xffb35c, r: 0.024, speed: 0.5, pts: hvF });
  flows.push({ sys: 'hybridev', modes: EV, color: 0xffb35c, r: 0.024, speed: 0.5, pts: hvR });
  flows.push({ sys: 'hybridev', modes: EV, color: 0x60a5fa, r: 0.016, speed: 0.15, pts: thermal, closed: true });
  flows.push({ sys: 'hybridev', modes: HY, color: 0xffb35c, r: 0.024, speed: 0.45, pts: hvH });

  return { root, comps, anim, flows };
}

/* ------------------------------------------------------------------ camera presets */
const VIEWS = {
  overview: { pos: [4.7, 3.0, 4.9], target: [0.1, 0.42, 0] },
  side: { pos: [0.05, 0.9, 8.6], target: [0.05, 0.6, 0] },
  top: { pos: [0.3, 9.0, 0.4], target: [0.05, 0.4, 0] },
  front: { pos: [7.5, 1.4, 1.6], target: [0.4, 0.55, 0] },
  under: { pos: [0.6, -3.8, 4.6], target: [0.0, 0.3, 0] }
};
const FOCUS = {
  engine: { pos: [3.4, 1.9, 2.2], target: [1.5, 0.66, 0.1] },
  airfuel: { pos: [3.6, 2.8, 4.4], target: [0.5, 0.5, 0] },
  cooling: { pos: [4.0, 1.9, 2.4], target: [1.6, 0.6, 0.05] },
  lubrication: { pos: [3.0, 1.1, 2.3], target: [1.55, 0.48, 0.12] },
  transmission: { pos: [3.1, 1.5, -2.5], target: [1.45, 0.46, -0.4] },
  drivetrain: { pos: [2.2, 3.3, -4.6], target: [0.1, 0.3, 0] },
  suspension: { pos: [3.6, 1.5, 3.4], target: [0.9, 0.45, 0.3] },
  steering: { pos: [2.9, 2.1, -2.8], target: [0.9, 0.55, -0.2] },
  brakes: { pos: [2.6, 2.4, -4.3], target: [0.5, 0.45, -0.3] },
  electrical: { pos: [3.8, 2.6, -3.4], target: [0.7, 0.62, -0.2] },
  hvac: { pos: [3.9, 2.3, 3.1], target: [1.2, 0.62, 0.2] },
  exhaust: { pos: [0.8, -2.6, 4.9], target: [-0.2, 0.3, 0.1] },
  wheels: { pos: [3.3, 0.8, 2.7], target: [1.4, 0.35, 0.72] },
  structure: { pos: [5.0, 3.0, 5.2], target: [0.05, 0.62, 0] },
  hybridev: { pos: [2.8, 4.6, 4.6], target: [-0.1, 0.35, 0] }
};

/* ------------------------------------------------------------------ mount */
export async function mountMachine(host, opts = {}) {
  const o = { mode: 'gas', autoRotate: true, labels: true, view: 'overview', ...opts };
  const canvas = document.createElement('canvas'); canvas.className = 'm3-canvas'; host.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 120);
  scene.add(new THREE.HemisphereLight(0xdfe9f3, 0x1a1f24, 0.62));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(4, 7, 3); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -3.2, right: 3.2, top: 3.2, bottom: -3.2, near: 1, far: 20 }); key.shadow.bias = -0.0004; scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fd8ff, 0.8); rim.position.set(-5, 3, -4); scene.add(rim);

  // blueprint floor: fine grid fading to the horizon, plus a soft contact shadow
  const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 64).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uCol: { value: new THREE.Color(0x75c7d1) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uCol; varying vec3 vP;
      float grid(vec2 p, float s, float w){ vec2 g = abs(fract(p/s - 0.5) - 0.5) / fwidth(p/s); return 1.0 - min(min(g.x, g.y) / w, 1.0); }
      void main(){ float d = length(vP.xz); float fade = smoothstep(9.0, 2.0, d);
        float a = (grid(vP.xz, 0.25, 1.0)*0.05 + grid(vP.xz, 1.0, 1.2)*0.12) * fade;
        gl_FragColor = vec4(uCol, a); }`
  }));
  floor.position.y = 0.001; floor.visible = o.grid !== false; scene.add(floor);
  const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  contact.position.y = 0.002; scene.add(contact);
  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(12, 12).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.28 }));
  shadowCatcher.receiveShadow = true; shadowCatcher.position.y = 0.003; scene.add(shadowCatcher);

  const tb = performance.now(); const car = buildCar(); scene.add(car.root); const buildMs = Math.round(performance.now() - tb);
  const body = car.root.getObjectByName('body');
  const lamps = car.root.children.filter(n => n.isMesh && (n.material === MAT.lampW || n.material === MAT.lampR)); lamps.forEach(l => { l.userData.op = l.material.opacity; });
  const paint = paintBody();

  // particle flows
  const beadG = new THREE.SphereGeometry(1, 10, 8);
  const flowObjs = car.flows.map(f => {
    const curve = curveOf(f.pts, !!f.closed), len = curve.getLength(), n = Math.max(8, Math.round(len * 9));
    const mesh = new THREE.InstancedMesh(beadG, new THREE.MeshBasicMaterial({ color: f.color, transparent: true, opacity: 0.95, depthWrite: false }), n);
    mesh.visible = false; mesh.frustumCulled = false; mesh.renderOrder = 5; scene.add(mesh);
    return { ...f, curve, n, mesh, len };
  });

  // labels
  scene.updateMatrixWorld(true);
  // callout labels: projected every frame, pushed outward from the car and stacked so they never overlap, with leader lines
  const SVGNS = 'http://www.w3.org/2000/svg';
  const layer = document.createElement('div'); layer.className = 'm3-labels'; host.append(layer);
  const leaders = document.createElementNS(SVGNS, 'svg'); leaders.setAttribute('class', 'm3-leaders'); layer.append(leaders);
  const labels = [];
  const box = new THREE.Box3(), tmp = new THREE.Vector3();
  for (const c of car.comps) {
    if (!c.labelled || !c.label) continue;
    const el = document.createElement('button'); el.type = 'button'; el.className = 'm3-tag'; el.innerHTML = `<span>${c.label}</span>`; el.style.display = 'none';
    el.style.setProperty('--c', '#' + new THREE.Color(SYSTEMS[c.sys].color).getHexString());
    el.addEventListener('click', e => { e.stopPropagation(); emit('pick', { part: c.parts[0], system: c.sys, comp: c.id }); });
    const line = document.createElementNS(SVGNS, 'path'), dot = document.createElementNS(SVGNS, 'circle'); dot.setAttribute('r', '3');
    leaders.append(line, dot); layer.append(el);
    const anchor = c.anchor || (box.setFromObject(c.obj).getCenter(tmp), tmp.clone());
    labels.push({ c, el, line, dot, anchor, on: false, y: null, x: null });
  }
  const proj = new THREE.Vector3(), insets = { left: 4, right: 4 };
  function layoutLabels() {
    const W = host.clientWidth, H = host.clientHeight, vis = labels.filter(L => L.on);
    if (!vis.length) return;
    // project the car centre so labels fan out to the left and right of it
    proj.set(0.1, 0.6, 0).project(camera); const cx = (proj.x + 1) / 2 * W;
    const narrow = W < 560, gap = narrow ? 3 : 5, push = narrow ? 18 : 42;
    for (const L of vis) {
      proj.copy(L.anchor).project(camera);
      L.sx = (proj.x + 1) / 2 * W; L.sy = (1 - proj.y) / 2 * H; L.back = proj.z > 1;
      if (!L.w) { L.w = L.el.offsetWidth; L.h = L.el.offsetHeight; }
      L.side = L.sx < cx ? -1 : 1;
    }
    for (const side of [-1, 1]) {
      const col = vis.filter(L => L.side === side && !L.back).sort((a, b) => a.sy - b.sy);
      let y = (side < 0 ? insets.left : insets.right) - gap;
      for (const L of col) { L.ty = Math.max(L.sy - L.h / 2, y + gap); y = L.ty + L.h; }
      let bottom = H - 6; // then push the stack back up if it runs off the bottom
      for (let i = col.length - 1; i >= 0; i--) { const L = col[i]; if (L.ty + L.h > bottom) L.ty = bottom - L.h; bottom = L.ty - gap; }
      for (const L of col) {
        L.tx = side < 0 ? L.sx - push - L.w : L.sx + push;
        L.tx = Math.max(4, Math.min(W - L.w - 4, L.tx)); L.ty = Math.max(side < 0 ? insets.left : insets.right, Math.min(H - L.h - 4, L.ty));
        L.x = L.x == null ? L.tx : L.x + (L.tx - L.x) * 0.35; L.y = L.y == null ? L.ty : L.y + (L.ty - L.y) * 0.35;
      }
    }
    for (const L of vis) {
      const show = !L.back; L.el.style.display = show ? '' : 'none'; L.line.style.display = L.dot.style.display = show ? '' : 'none'; if (!show) continue;
      L.el.style.transform = `translate(${L.x.toFixed(1)}px, ${L.y.toFixed(1)}px)`;
      const ex = L.side < 0 ? L.x + L.w : L.x, ey = L.y + L.h / 2, mx = L.sx + (ex - L.sx) * 0.55;
      L.line.setAttribute('d', `M${L.sx.toFixed(1)},${L.sy.toFixed(1)} L${mx.toFixed(1)},${ey.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}`);
      L.dot.setAttribute('cx', L.sx.toFixed(1)); L.dot.setAttribute('cy', L.sy.toFixed(1));
    }
  }
  const tip = document.createElement('div'); tip.className = 'm3-tip'; tip.hidden = true; host.append(tip);

  // controls
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, minDistance: 1.6, maxDistance: 14, enablePan: false, autoRotate: o.autoRotate && !reduced, autoRotateSpeed: 0.55, maxPolarAngle: Math.PI * 0.62 });
  controls.target.set(...VIEWS.overview.target); camera.position.set(...VIEWS.overview.pos);
  let tween = null, idleT = 0;
  const fit = (pos, target) => { const k = Math.max(1, 1.3 / camera.aspect), tg = V(...target); return tg.clone().add(V(...pos).sub(tg).multiplyScalar(k)); };
  const flyTo = (pos, target, dur = 1.1) => {
    const p1 = fit(pos, target);
    if (reduced) { camera.position.copy(p1); controls.target.set(...target); controls.update(); return; }
    tween = { t: 0, dur, p0: camera.position.clone(), t0: controls.target.clone(), p1, t1: V(...target) };
  };
  controls.addEventListener('start', () => { tween = null; idleT = 0; controls.autoRotate = false; });

  // state
  const state = { mode: o.mode, drive: o.drive || 'awd', focus: null, part: null, xray: o.xray !== false, hover: null };
  const listeners = {}; function emit(ev, d) { (listeners[ev] || []).forEach(fn => fn(d)); }
  const inMode = c => c.modes.includes(state.mode) && (!c.drives || c.drives.includes(state.drive));
  const variants = new Map();
  const variant = (base, kind, sel) => {
    const k = base.uuid + kind + (sel ? 1 : 0); if (variants.has(k)) return variants.get(k);
    const m = base.clone();
    if (kind === 'xray') { m.transparent = true; m.opacity = 0.22; m.depthWrite = false; }
    else if (kind === 'quiet') { m.transparent = true; m.opacity = 0.42; m.depthWrite = false; }
    else { m.emissive = (base.userData.base || base.color || new THREE.Color(0xffffff)).clone(); m.emissiveIntensity = sel ? 0.6 : 0.16; }
    variants.set(k, m); return m;
  };
  function apply() {
    const f = state.focus, part = state.part, fset = Array.isArray(f) ? new Set(f) : f ? new Set([f]) : null, one = fset && fset.size === 1;
    for (const c of car.comps) {
      const vis = inMode(c) && (c.id !== 'zones' || (fset && fset.has('structure'))); c.obj.visible = vis; if (!vis) continue;
      const hit = !fset || fset.has(c.sys), sel = part && c.parts.includes(part);
      c.obj.traverse(n => {
        if (!n.isMesh) return;
        const base = n.userData.baseMat;
        if (!hit) { n.material = MAT.ghost; n.castShadow = false; return; }
        n.castShadow = true;
        if (n.userData.shell && one && fset.has(c.sys)) { n.material = variant(base, 'xray'); return; }
        if (sel || (f && hit)) { n.material = base.isMeshBasicMaterial ? base : variant(base, 'glow', sel); return; }
        n.material = !f && c.sys === 'structure' && !base.isMeshBasicMaterial ? variant(base, 'quiet') : base;
      });
    }
    const ctx = car.root.getObjectByName('context'); if (ctx) ctx.visible = true;
    body.material = state.xray ? body.userData.ghost || (body.userData.ghost = body.material) : paint;
    body.material.uniforms && (body.material.uniforms.uOpacity.value = f ? 0.55 : 1);
    body.renderOrder = 2;
    lamps.forEach(l => { l.material.opacity = f ? 0.25 : l.userData.op; });
    for (const L of labels) {
      L.on = !!o.labels && !!fset && fset.has(L.c.sys) && inMode(L.c) && (one || L.c.groupLabel);
      L.el.style.display = L.on ? '' : 'none'; L.line.style.display = L.dot.style.display = L.on ? '' : 'none'; if (!L.on) { L.x = L.y = null; } else if (!L.w) { L.w = L.el.offsetWidth; L.h = L.el.offsetHeight; }
      L.el.classList.toggle('is-sel', !!(part && L.c.parts.includes(part)));
    }
    for (const fl of flowObjs) fl.mesh.visible = !!fset && fset.has(fl.sys) && (!fl.modes || fl.modes.includes(state.mode)) && state.xray;
  }
  body.userData.ghost = body.material;

  // picking
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pickables = () => car.comps.filter(c => inMode(c) && (!state.focus || (Array.isArray(state.focus) ? state.focus.includes(c.sys) : c.sys === state.focus))).flatMap(c => { const out = []; c.obj.traverse(n => n.isMesh && out.push(n)); return out; });
  let pickList = pickables();
  const compById = Object.fromEntries(car.comps.map(c => [c.id, c]));
  function pickAt(ev) {
    const r = canvas.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera); const hit = ray.intersectObjects(pickList, false)[0];
    return hit ? compById[hit.object.userData.comp] : null;
  }
  let downAt = null;
  canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const c = pickAt(e);
    if (c) { tip.hidden = false; tip.innerHTML = `<b>${c.parts[0] || c.label}</b><span>${SYSTEMS[c.sys].name}</span>`; const r = host.getBoundingClientRect(); tip.style.left = (e.clientX - r.left + 14) + 'px'; tip.style.top = (e.clientY - r.top + 12) + 'px'; canvas.style.cursor = 'pointer'; }
    else { tip.hidden = true; canvas.style.cursor = ''; }
  });
  canvas.addEventListener('pointerleave', () => { tip.hidden = true; });
  canvas.addEventListener('pointerup', e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const c = pickAt(e); if (c) emit('pick', { part: c.parts[0], system: c.sys, comp: c.id });
  });

  // sizing + visibility-aware render loop
  let framed = false;
  const resize = () => {
    const w = host.clientWidth || 600, h = host.clientHeight || 400; renderer.setSize(w, h, false); leaders.setAttribute('viewBox', `0 0 ${w} ${h}`); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (!framed) { framed = true; camera.position.copy(fit(VIEWS[o.view]?.pos || VIEWS.overview.pos, VIEWS[o.view]?.target || VIEWS.overview.target)); controls.target.set(...(VIEWS[o.view]?.target || VIEWS.overview.target)); }
  };
  new ResizeObserver(resize).observe(host); resize();
  let visible = true, raf = 0, last = performance.now(), t = 0;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) { last = performance.now(); loop(); } }, { threshold: 0.02 }).observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) { last = performance.now(); loop(); } });
  const inst = new THREE.Object3D();
  let crankA = 0, steerT = 0;
  function loop() {
    raf = 0; if (!visible || document.hidden) return;
    raf = requestAnimationFrame(loop);
    const now = performance.now(), dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
    if (tween) { tween.t += dt / tween.dur; const k = tween.t >= 1 ? 1 : 1 - Math.pow(1 - tween.t, 3); camera.position.lerpVectors(tween.p0, tween.p1, k); controls.target.lerpVectors(tween.t0, tween.t1, k); if (tween.t >= 1) tween = null; }
    if (!controls.autoRotate && o.autoRotate && !reduced && !tween && (!state.focus || Array.isArray(state.focus))) { idleT += dt; if (idleT > 6) controls.autoRotate = true; }
    controls.update();
    // moving hardware
    const f = state.focus, running = !reduced && state.mode !== 'ev', has = k => Array.isArray(f) ? f.includes(k) : f === k;
    if (running) crankA += dt * (has('engine') || has('lubrication') ? 4.5 : 1.6);
    const A = car.anim;
    A.crank.rotation.z = -crankA;
    for (const p of A.pistons) {
      const th = crankA + p.phase, px = Math.sin(th) * STROKE_R, py = Math.cos(th) * STROKE_R;
      const pinY = CR.y + py + Math.sqrt(ROD * ROD - px * px);
      p.piston.position.set(CR.x, pinY + 0.018, p.z);
      p.rod.position.set(CR.x + px, CR.y + py, p.z); p.rod.rotation.z = Math.atan2(px, pinY - (CR.y + py)) ;
    }
    A.cams.forEach(c => { c.rotation.z = -crankA / 2; });
    A.fans.forEach(fn => { fn.rotation.x += dt * (has('cooling') ? 9 : 2.5); });
    const roll = !reduced && (has('drivetrain') || has('wheels') || has('transmission') || (has('hybridev') && state.mode !== 'gas'));
    A.wheels.forEach(w => { if (roll) w.spin.rotation.z -= dt * 5; });
    steerT += dt;
    const steer = f === 'steering' && !reduced ? Math.sin(steerT * 1.2) * 0.32 : 0;
    A.wheels.forEach(w => { w.steer.rotation.y = w.front ? steer : 0; });
    A.tieRods.forEach(tr => { tr.inner.position.z = tr.s * 0.52 + steer * 0.06; tr.outer.position.x = 1.22 - steer * 0.03 * tr.s; });
    for (const fl of flowObjs) {
      if (!fl.mesh.visible) continue;
      for (let i = 0; i < fl.n; i++) {
        const u = (i / fl.n + t * fl.speed / Math.max(0.6, fl.len) * 1.5) % 1;
        fl.curve.getPointAt(u, inst.position); inst.scale.setScalar(fl.r * (0.7 + 0.3 * Math.sin(i * 1.7))); inst.updateMatrix(); fl.mesh.setMatrixAt(i, inst.matrix);
      }
      fl.mesh.instanceMatrix.needsUpdate = true;
    }
    renderer.render(scene, camera); layoutLabels();
  }
  apply(); loop();

  const api = {
    SYSTEMS, MODES, buildMs,
    setMode(m) { if (!MODES[m]) return; state.mode = m; pickList = pickables(); apply(); emit('mode', m); },
    focus(sys, { fly = true, view } = {}) {
      state.focus = Array.isArray(sys) ? sys.filter(k => SYSTEMS[k]) : SYSTEMS[sys] ? sys : null; state.part = null; pickList = pickables(); apply();
      controls.autoRotate = false; idleT = 0;
      if (fly) { const v = view ? VIEWS[view] : typeof state.focus === 'string' ? FOCUS[state.focus] : VIEWS.overview; flyTo(v.pos, v.target); }
      emit('focus', state.focus);
    },
    setDrive(d) { if (!['fwd', 'rwd', 'awd'].includes(d)) return; state.drive = d; pickList = pickables(); apply(); },
    autoRotate(on) { o.autoRotate = !!on; controls.autoRotate = !!on && !reduced; },
    focusPart(name, sys) {
      const c = car.comps.find(k => k.parts.includes(name) && inMode(k)) || car.comps.find(k => k.parts.includes(name));
      const s = c ? c.sys : sys;
      if (s !== state.focus) { state.focus = SYSTEMS[s] ? s : null; const v = state.focus ? FOCUS[state.focus] : VIEWS.overview; flyTo(v.pos, v.target); }
      state.part = name; pickList = pickables(); apply(); controls.autoRotate = false;
      return !!c;
    },
    setView(name) { const v = VIEWS[name]; if (v) { controls.autoRotate = false; flyTo(v.pos, v.target); } },
    setXray(on) { state.xray = !!on; apply(); },
    setLabels(on) { o.labels = !!on; apply(); },
    setInsets(v) { Object.assign(insets, v); },
    has(name) { return car.comps.some(k => k.parts.includes(name) && inMode(k)); },
    modesFor(name) { const m = new Set(); car.comps.filter(k => k.parts.includes(name)).forEach(k => k.modes.forEach(x => m.add(x))); return [...m]; },
    resize() { resize(); },
    on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    state
  };
  return api;
}
