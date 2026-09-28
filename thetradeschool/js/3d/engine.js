/* TradeSchool 3D stage.
   One WebGL renderer for the whole single-page app: the canvas is moved from page to page
   (trade hero → unit → topic) instead of being rebuilt, so route changes never leak GPU
   contexts. Each trade model is built procedurally once, on first use, and cached.

   A model module exports `meta` and `build(kit)`; build returns
   { root, comps, flows, tick } where each comp is one real, nameable piece of equipment:
     { id, sys, concepts: [conceptId…], label, obj, anchor?, labelled?, hero?, shell?, layer?, modes? }
   `sys` is the unit (course category) the part belongs to, so a unit page can focus the
   model on exactly the hardware that unit teaches. */
import * as kit from './kit.js';
import { OrbitControls, RoomEnvironment } from '../../../assets/vendor/three.min.js';

const { THREE, V } = kit;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const VER = '1';
const LOADERS = {
  electrical: () => import(`./models/electrical.js?v=${VER}`),
  hvac: () => import(`./models/hvac.js?v=${VER}`),
  plumbing: () => import(`./models/plumbing.js?v=${VER}`),
  industrial: () => import(`./models/industrial.js?v=${VER}`),
  welding: () => import(`./models/welding.js?v=${VER}`),
  construction: () => import(`./models/construction.js?v=${VER}`)
};
export const hex = n => '#' + n.toString(16).padStart(6, '0');

/* ------------------------------------------------------------------ shared materials */
const GHOST = new THREE.MeshBasicMaterial({ color: 0x8792a0, transparent: true, opacity: 0.06, depthWrite: false });
const shellMat = () => new THREE.ShaderMaterial({
  uniforms: { uRim: { value: new THREE.Color(0xc9d6e2) }, uOpacity: { value: 1 } },
  vertexShader: `varying vec3 vN; varying vec3 vV;
    void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uRim; uniform float uOpacity; varying vec3 vN; varying vec3 vV;
    void main(){ float f = 1.0 - abs(dot(normalize(vN), normalize(vV))); float rim = pow(f, 2.2);
      gl_FragColor = vec4(uRim*(0.5+0.8*rim), (0.045 + 0.5*rim)*uOpacity); }`,
  transparent: true, depthWrite: false, side: THREE.DoubleSide
});

/* ------------------------------------------------------------------ stage (singleton) */
let stagePromise = null;
export function getStage() { return stagePromise || (stagePromise = Promise.resolve(createStage())); }
export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

function createStage() {
  const canvas = document.createElement('canvas'); canvas.className = 'rig-canvas';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!window.__RIG_CAPTURE });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, window.__RIG_CAPTURE ? 2 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.6;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.03, 200);
  scene.add(new THREE.HemisphereLight(0xe3ebf3, 0x1a1f24, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xa9d8ff, 0.7); rim.position.set(-6, 4, -5); scene.add(rim);

  // blueprint floor: fine grid fading out, plus a shadow catcher
  const floorMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uCol: { value: new THREE.Color(0x9fb4c8) }, uFade: { value: 8 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uCol; uniform float uFade; varying vec3 vP;
      float grid(vec2 p, float s, float w){ vec2 g = abs(fract(p/s - 0.5) - 0.5) / fwidth(p/s); return 1.0 - min(min(g.x, g.y) / w, 1.0); }
      void main(){ float d = length(vP.xz); float fade = smoothstep(uFade, uFade*0.2, d);
        float a = (grid(vP.xz, 0.25, 1.0)*0.05 + grid(vP.xz, 1.0, 1.2)*0.13) * fade;
        gl_FragColor = vec4(uCol, a); }`
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 72).rotateX(-Math.PI / 2), floorMat); floor.position.y = 0.001; scene.add(floor);
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.3 }));
  catcher.receiveShadow = true; catcher.position.y = 0.002; scene.add(catcher);

  // DOM overlay: callout labels with leader lines, hover tip
  const SVGNS = 'http://www.w3.org/2000/svg';
  const layer = document.createElement('div'); layer.className = 'rig-labels';
  const leaders = document.createElementNS(SVGNS, 'svg'); leaders.setAttribute('class', 'rig-leaders'); layer.append(leaders);
  const tip = document.createElement('div'); tip.className = 'rig-tip'; tip.hidden = true;

  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, enableZoom: false, autoRotateSpeed: 0.5, maxPolarAngle: Math.PI * 0.49, minPolarAngle: 0.08 });

  const listeners = {}; const emit = (ev, d) => (listeners[ev] || []).forEach(fn => fn(d));
  const built = {};
  const state = { model: null, focus: null, part: null, xray: true, labels: true, layer: 99, mode: null, autoRotate: true, flows: true };
  let M = null; // active model instance
  let host = null, ro = null, io = null, visible = false, raf = 0, last = 0, t = 0, tween = null, idleT = 0, interactive = true;

  /* ---------------- model instances */
  async function instance(id) {
    if (built[id]) return built[id];
    const mod = await LOADERS[id]();
    const meta = mod.meta, b = mod.build(kit);
    const root = b.root; root.name = id;
    const comps = b.comps;
    const byConcept = new Map(), byId = new Map();
    for (const c of comps) {
      byId.set(c.id, c);
      c.labelled = c.labelled !== false && !!c.label;
      c.obj.traverse(n => {
        if (!n.isMesh) return;
        n.castShadow = !c.shell && !c.noShadow; n.receiveShadow = !c.shell;
        n.userData.comp = c.id; n.userData.base = n.material;
      });
      for (const k of c.concepts || []) if (!byConcept.has(k)) byConcept.set(k, c);
    }
    for (const n of b.context || []) n.traverse(m => { if (m.isMesh) { m.receiveShadow = true; m.castShadow = !!m.userData.cast; } });
    // particle flows ride along a curve; instanced beads
    const bead = new THREE.SphereGeometry(1, 10, 8);
    const flows = (b.flows || []).map(f => {
      const cv = kit.curve(f.pts, !!f.closed), len = cv.getLength(), n = Math.max(6, Math.round(len * (f.density || 9)));
      const mesh = new THREE.InstancedMesh(bead, new THREE.MeshBasicMaterial({ color: f.color, transparent: true, opacity: 0.95, depthWrite: false }), n);
      mesh.frustumCulled = false; mesh.renderOrder = 6; mesh.visible = false; root.add(mesh);
      const cols = f.colors ? f.colors.map(c => new THREE.Color(c)) : null;
      return { ...f, curve: cv, len, n, mesh, cols };
    });
    // labels (DOM), one per labelled comp
    const labels = comps.filter(c => c.labelled).map(c => {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'rig-tag'; el.innerHTML = `<span>${c.label}</span>`; el.style.display = 'none';
      el.style.setProperty('--c', hex(meta.systems[c.sys]?.color ?? 0xcccccc));
      el.addEventListener('click', e => { e.stopPropagation(); pickComp(c); });
      const line = document.createElementNS(SVGNS, 'path'), dot = document.createElementNS(SVGNS, 'circle'); dot.setAttribute('r', '3');
      return { c, el, line, dot, anchor: null, on: false, x: null, y: null };
    });
    const inst = { id, meta, root, comps, byId, byConcept, flows, labels, tick: b.tick || (() => {}), context: b.context || [], api: b.api || {} };
    root.updateMatrixWorld(true);
    const tmp = new THREE.Box3(), ctr = new THREE.Vector3();
    for (const L of labels) L.anchor = L.c.anchor ? L.c.anchor.clone() : (tmp.setFromObject(L.c.obj).getCenter(ctr), ctr.clone());
    for (const c of comps) { c.box = new THREE.Box3().setFromObject(c.obj); if (c.box.isEmpty()) c.box.setFromCenterAndSize(c.anchor || V(0, 0, 0), V(0.1, 0.1, 0.1)); }
    inst.box = new THREE.Box3(); comps.forEach(c => inst.box.union(c.box));
    built[id] = inst;
    return inst;
  }

  async function setModel(id) {
    if (M?.id === id) return M;
    const next = await instance(id);
    if (M) { scene.remove(M.root); M.context.forEach(n => scene.remove(n)); M.labels.forEach(L => { L.el.remove(); L.line.remove(); L.dot.remove(); }); }
    M = next; state.model = id; state.focus = null; state.part = null;
    state.mode = M.meta.defaultMode || (M.meta.modes ? Object.keys(M.meta.modes)[0] : null);
    state.layer = M.meta.layers ? M.meta.layers.length - 1 : 99;
    scene.add(M.root); M.context.forEach(n => scene.add(n));
    M.labels.forEach(L => { layer.append(L.el); leaders.append(L.line, L.dot); });
    const s = M.meta.stage || {};
    floorMat.uniforms.uCol.value.set(s.grid ?? 0x9fb4c8); floorMat.uniforms.uFade.value = s.fade ?? 8;
    floor.visible = catcher.visible = s.floor !== false;
    const sh = s.shadow ?? 4; Object.assign(key.shadow.camera, { left: -sh, right: sh, top: sh, bottom: -sh, near: 0.5, far: 40 }); key.shadow.camera.updateProjectionMatrix();
    const c = M.box.getCenter(new THREE.Vector3());
    key.position.set(c.x + 5, c.y + 9, c.z + 4); key.target.position.copy(c);
    controls.minDistance = s.minDist ?? 0.6; controls.maxDistance = s.maxDist ?? 30;
    apply(); pickList = pickables();
    emit('model', id);
    return M;
  }

  /* ---------------- visibility + materials */
  const variants = new Map();
  function variant(base, kind, tint) {
    const k = base.uuid + kind + (tint ?? ''); if (variants.has(k)) return variants.get(k);
    const m = base.clone();
    if (kind === 'glow') { m.emissive = new THREE.Color(tint ?? 0xffffff); m.emissiveIntensity = 0.42; if (m.transparent) { m.opacity = Math.max(m.opacity, 0.85); } }
    else if (kind === 'soft') { m.emissive = (base.userData.base || base.color || new THREE.Color(0xffffff)).clone(); m.emissiveIntensity = 0.12; }
    else if (kind === 'dim') { m.transparent = true; m.opacity = 0.2; m.depthWrite = false; }
    else if (kind === 'glassSel') { m.transparent = true; m.opacity = 0.42; m.depthWrite = false; m.side = THREE.DoubleSide; m.emissive = new THREE.Color(tint ?? 0xffffff); m.emissiveIntensity = 0.3; }
    else if (kind === 'glass') { m.transparent = true; m.opacity = 0.34; m.depthWrite = false; m.side = THREE.DoubleSide; m.emissive = (base.userData.base || base.color || new THREE.Color(0xffffff)).clone(); m.emissiveIntensity = 0.08; }
    variants.set(k, m); return m;
  }
  const shellGhost = shellMat();
  const inMode = c => (!c.modes || !state.mode || c.modes.includes(state.mode)) && (c.layer == null || c.layer <= state.layer) && (!c.hideAbove || state.layer < c.hideAbove);
  const focusSet = () => (state.focus == null ? null : new Set(Array.isArray(state.focus) ? state.focus : [state.focus]));
  function apply() {
    if (!M) return;
    const fs = focusSet(), part = state.part;
    const selIds = new Set(part ? M.comps.filter(c => c.concepts?.includes(part) || c.id === part).map(c => c.id) : []);
    for (const c of M.comps) {
      const vis = inMode(c); c.obj.visible = vis; if (!vis) continue;
      const hit = !fs || fs.has(c.sys) || selIds.has(c.id) || (c.also && c.also.some(s => fs.has(s)));
      const sel = selIds.has(c.id);
      c.obj.traverse(n => {
        if (!n.isMesh || n.userData.keep) return;
        const base = n.userData.base;
        if (c.shell) { n.material = fs && hit ? variant(base, sel ? 'glassSel' : 'glass', M.meta.systems[c.sys]?.color) : state.xray || fs ? shellGhost : base; n.castShadow = false; return; }
        if (!hit) { n.material = c.faint ? GHOST : variant(base, 'dim'); n.castShadow = false; return; }
        n.castShadow = !c.noShadow;
        n.material = sel ? variant(base, 'glow', M.meta.systems[c.sys]?.color) : fs && !part ? variant(base, 'soft') : base;
      });
    }
    shellGhost.uniforms.uOpacity.value = fs ? 0.6 : 1;
    for (const L of M.labels) {
      const c = L.c, sel = selIds.has(c.id);
      L.on = state.labels && inMode(c) && (sel || (fs ? (fs.has(c.sys) && !part && !state.sparse) || (part && fs.has(c.sys) && c.labelled && c.near?.includes(part)) : !!c.hero && !(state.sparse && host && host.clientWidth < 520)));
      if (part && !sel && !(c.near?.includes(part))) L.on = false;
      L.el.style.display = L.on ? '' : 'none'; L.line.style.display = L.dot.style.display = L.on ? '' : 'none';
      if (!L.on) { L.x = L.y = null; } else if (!L.w) { L.w = L.el.offsetWidth; L.h = L.el.offsetHeight; }
      L.el.classList.toggle('is-sel', sel);
    }
    for (const f of M.flows) {
      const modeOK = !f.modes || !state.mode || f.modes.includes(state.mode);
      const layerOK = f.layer == null || f.layer <= state.layer;
      f.mesh.visible = !!(state.flows && modeOK && layerOK && (!fs ? f.idle !== false : fs.has(f.sys) || (f.also && f.also.some(s => fs.has(s)))));
    }
  }

  /* ---------------- camera */
  const dirOf = v => V(...v).normalize();
  /* fit the 8 corners of a box into the frustum from a given direction (tighter than a bounding sphere) */
  const _m = new THREE.Matrix4(), _p = new THREE.Vector3();
  function fitTo(box, dir, pad = 1.18, minR = 0.18) {
    const b = box.clone(); const ctr = b.getCenter(new THREE.Vector3());
    const size = b.getSize(new THREE.Vector3()); const need = minR * 2;
    if (size.x < need || size.y < need || size.z < need) b.expandByVector(V(Math.max(0, need - size.x) / 2, Math.max(0, need - size.y) / 2, Math.max(0, need - size.z) / 2));
    const f = dir.clone().normalize();
    _m.lookAt(f, V(0, 0, 0), V(0, 1, 0)); // camera basis looking back along f
    const right = V(1, 0, 0).applyMatrix4(_m).normalize(), up = V(0, 1, 0).applyMatrix4(_m).normalize();
    const tv = Math.tan(camera.fov * Math.PI / 360), th = tv * camera.aspect;
    let d = 0;
    for (let i = 0; i < 8; i++) {
      _p.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).sub(ctr);
      const x = Math.abs(_p.dot(right)), y = Math.abs(_p.dot(up)), z = _p.dot(f);
      d = Math.max(d, z + x * pad / th, z + y * pad / tv);
    }
    return { pos: ctr.clone().add(f.multiplyScalar(Math.max(d, controls.minDistance))), target: ctr };
  }
  function flyTo({ pos, target }, dur = 1.1) {
    if (reduced || dur === 0) { camera.position.copy(pos); controls.target.copy(target); controls.update(); tween = null; return; }
    tween = { t: 0, dur, p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target };
  }
  function viewDir(name) {
    const v = M.meta.views?.[name] || M.meta.views?.overview || { dir: [1, 0.7, 1.2] };
    return dirOf(v.dir);
  }
  function currentDir() {
    const d = camera.position.clone().sub(controls.target).normalize();
    // keep a readable elevation: never flat to the floor, never straight down
    const el = Math.asin(Math.max(-1, Math.min(1, d.y)));
    const want = Math.max(0.2, Math.min(0.95, el));
    const h = Math.cos(want), hz = Math.hypot(d.x, d.z) || 1;
    return V(d.x / hz * h, Math.sin(want), d.z / hz * h);
  }
  function sysBox(sysSet) {
    const b = new THREE.Box3();
    M.comps.forEach(c => { if (inMode(c) && sysSet.has(c.sys) && !c.noFrame && !c.shell) b.union(c.box); });
    if (b.isEmpty()) M.comps.forEach(c => { if (inMode(c) && sysSet.has(c.sys)) b.union(c.box); });
    return b.isEmpty() ? M.box : b;
  }
  function frameOverview(view = 'overview', dur) {
    const v = M.meta.views?.[view];
    const box = v?.box ? new THREE.Box3(V(...v.box[0]), V(...v.box[1])) : M.box;
    flyTo(fitTo(box, viewDir(view), v?.pad ?? 1.02), dur);
  }

  /* ---------------- picking */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let pickList = [];
  function pickables() {
    if (!M) return [];
    const fs = focusSet(); const out = [];
    M.comps.forEach(c => { if (inMode(c) && !c.noPick && (!fs || fs.has(c.sys) || c.also?.some(s => fs.has(s)))) c.obj.traverse(n => n.isMesh && n.visible && out.push(n)); });
    return out;
  }
  function pickAt(ev) {
    const r = canvas.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickList, false);
    for (const h of hits) { const c = M.byId.get(h.object.userData.comp); if (c && (!c.shell || hits.length === 1)) return c; }
    return hits[0] ? M.byId.get(hits[0].object.userData.comp) : null;
  }
  function pickComp(c) { emit('pick', { comp: c.id, concept: c.concepts?.[0] || null, concepts: c.concepts || [], sys: c.sys, label: c.label || c.name }); }
  let downAt = null;
  canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !M || !interactive) return;
    const c = pickAt(e);
    if (c) {
      tip.hidden = false; tip.innerHTML = `<b>${c.label || c.name || ''}</b><span>${M.meta.systems[c.sys]?.name || ''}</span>`;
      const r = host.getBoundingClientRect(); tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 12}px)`; canvas.style.cursor = 'pointer';
    } else { tip.hidden = true; canvas.style.cursor = ''; }
  });
  canvas.addEventListener('pointerleave', () => { tip.hidden = true; });
  canvas.addEventListener('pointerup', e => {
    if (!downAt || !M || !interactive || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const c = pickAt(e); if (c) pickComp(c); else emit('miss', {});
  });
  controls.addEventListener('start', () => { tween = null; idleT = 0; controls.autoRotate = false; emit('interact'); });

  /* ---------------- labels: fanned out left/right of the subject, stacked, with leader lines */
  const proj = new THREE.Vector3();
  const insets = { top: 8, bottom: 8, left: 6, right: 6 };
  function layoutLabels() {
    const W = host.clientWidth, H = host.clientHeight, vis = M.labels.filter(L => L.on);
    if (!vis.length) return;
    proj.copy(controls.target).project(camera); const cx = (proj.x + 1) / 2 * W;
    const narrow = W < 560, gap = narrow ? 3 : 5, push = narrow ? 14 : 36;
    for (const L of vis) {
      proj.copy(L.anchor).project(camera);
      L.sx = (proj.x + 1) / 2 * W; L.sy = (1 - proj.y) / 2 * H; L.back = proj.z > 1 || L.sx < -20 || L.sx > W + 20 || L.sy < -20 || L.sy > H + 20;
      if (!L.w) { L.w = L.el.offsetWidth; L.h = L.el.offsetHeight; }
      L.side = L.sx < cx ? -1 : 1;
    }
    for (const side of [-1, 1]) {
      const col = vis.filter(L => L.side === side && !L.back).sort((a, b) => a.sy - b.sy);
      let y = insets.top - gap;
      for (const L of col) { L.ty = Math.max(L.sy - L.h / 2, y + gap); y = L.ty + L.h; }
      let bottom = H - insets.bottom;
      for (let i = col.length - 1; i >= 0; i--) { const L = col[i]; if (L.ty + L.h > bottom) L.ty = bottom - L.h; bottom = L.ty - gap; }
      for (const L of col) {
        L.tx = side < 0 ? L.sx - push - L.w : L.sx + push;
        L.tx = Math.max(insets.left, Math.min(W - L.w - insets.right, L.tx)); L.ty = Math.max(insets.top, Math.min(H - L.h - insets.bottom, L.ty));
        L.x = L.x == null ? L.tx : L.x + (L.tx - L.x) * 0.3; L.y = L.y == null ? L.ty : L.y + (L.ty - L.y) * 0.3;
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

  /* ---------------- sizing + loop */
  let lastAspect = 0;
  function resize() {
    if (!host) return;
    const w = host.clientWidth || 600, h = host.clientHeight || 400;
    renderer.setSize(w, h, false); leaders.setAttribute('viewBox', `0 0 ${w} ${h}`);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (lastAspect && Math.abs(lastAspect - camera.aspect) > 0.02 && M && !tween) refit(0);
    lastAspect = camera.aspect;
    M?.labels.forEach(L => { L.w = 0; });
  }
  function refit(dur) {
    if (state.part && M.byConcept.get(state.part)) focusConcept(state.part, { dur }); else if (state.focus) focus(state.focus, { dur }); else frameOverview(state.view || 'overview', dur);
  }
  const tickCtx = { state, reduced, has: s => { const fs = focusSet(); return !!fs && fs.has(s); } };
  const dummy = new THREE.Object3D();
  function loop() {
    raf = 0; if (!visible || document.hidden || !host) return;
    raf = requestAnimationFrame(loop);
    const now = performance.now(), dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
    if (tween) { tween.t += dt / tween.dur; const k = tween.t >= 1 ? 1 : 1 - Math.pow(1 - tween.t, 3); camera.position.lerpVectors(tween.p0, tween.p1, k); controls.target.lerpVectors(tween.t0, tween.t1, k); if (tween.t >= 1) tween = null; }
    if (!controls.autoRotate && state.autoRotate && !reduced && !tween && !state.focus && !state.part) { idleT += dt; if (idleT > 7) controls.autoRotate = true; }
    controls.update();
    if (M) {
      M.tick(dt, t, tickCtx);
      for (const f of M.flows) {
        if (!f.mesh.visible) continue;
        const sp = (reduced ? 0 : f.speed ?? 0.2) * (f.dir ?? 1) * (f.speedFn ? f.speedFn(state) : 1);
        for (let i = 0; i < f.n; i++) {
          let u = (i / f.n + t * sp / Math.max(0.5, f.len) * 1.5) % 1; if (u < 0) u += 1;
          f.curve.getPointAt(u, dummy.position); dummy.scale.setScalar(f.r * (0.72 + 0.28 * Math.sin(i * 1.7))); dummy.updateMatrix(); f.mesh.setMatrixAt(i, dummy.matrix);
          if (f.cols) { const seg = f.cols.length, k = Math.min(seg - 1, Math.floor(u * seg)); f.mesh.setColorAt(i, f.cols[k]); }
        }
        f.mesh.instanceMatrix.needsUpdate = true; if (f.cols && f.mesh.instanceColor) f.mesh.instanceColor.needsUpdate = true;
      }
    }
    renderer.render(scene, camera);
    if (M && state.labels) layoutLabels();
  }
  const wake = () => { if (visible && host && !raf && !document.hidden) { last = performance.now(); loop(); } };
  document.addEventListener('visibilitychange', wake);

  /* ---------------- public API */
  async function attach(el, o = {}) {
    if (host && host !== el) detach();
    host = el; host.classList.add('rig-host');
    host.append(canvas, layer, tip);
    interactive = o.interactive !== false;
    const orbitOK = interactive && (!coarse || o.touchOrbit);
    controls.enabled = orbitOK; canvas.style.touchAction = orbitOK ? 'none' : 'pan-y';
    ro?.disconnect(); ro = new ResizeObserver(resize); ro.observe(host);
    io?.disconnect(); io = new IntersectionObserver(es => { visible = es[0].isIntersecting; wake(); }, { threshold: 0.01 }); io.observe(host);
    lastAspect = 0; resize();
    const fresh = M?.id !== o.model;
    await setModel(o.model);
    if (host !== el) return api;
    state.labels = o.labels !== false; state.sparse = !!o.sparse; state.autoRotate = o.autoRotate !== false; state.view = o.view || 'overview';
    controls.autoRotate = state.autoRotate && !reduced && !o.focus && !o.part;
    if (o.mode && M.meta.modes?.[o.mode]) state.mode = o.mode;
    if (o.layer != null) state.layer = o.layer;
    state.focus = null; state.part = null; apply();
    if (fresh || o.reframe !== false) frameOverview(state.view, 0);
    if (o.part && M.byConcept.get(o.part)) focusConcept(o.part, { dur: o.dur ?? 0 });
    else if (o.focus) focus(o.focus, { dur: o.dur ?? 0 });
    visible = true; wake();
    return api;
  }
  function detach() {
    if (!host) return;
    cancelAnimationFrame(raf); raf = 0; visible = false;
    ro?.disconnect(); io?.disconnect();
    canvas.remove(); layer.remove(); tip.remove(); host.classList.remove('rig-host'); host = null;
  }
  function focus(sys, { dur = 1.1, fly = true } = {}) {
    if (!M) return;
    const list = sys == null ? null : (Array.isArray(sys) ? sys : [sys]).filter(s => M.meta.systems[s]);
    state.focus = list && list.length ? (list.length === 1 ? list[0] : list) : null; state.part = null;
    const sl = typeof state.focus === 'string' ? M.meta.sysLayer?.[state.focus] : null;
    if (sl != null && sl !== state.layer) { state.layer = sl; emit('state', { mode: state.mode, layer: state.layer }); }
    controls.autoRotate = false; idleT = 0; apply(); pickList = pickables();
    if (fly) {
      if (!state.focus) frameOverview(state.view || 'overview', dur);
      else {
        const one = typeof state.focus === 'string' ? state.focus : null;
        const v = one && M.meta.focus?.[one];
        const box = v?.box ? new THREE.Box3(V(...v.box[0]), V(...v.box[1])) : sysBox(new Set(list));
        flyTo(fitTo(box, v?.dir ? dirOf(v.dir) : viewDir('overview'), v?.pad ?? 1.12, M.meta.stage?.minR ?? 0.25), dur);
      }
    }
    emit('focus', state.focus);
  }
  function focusConcept(id, { dur = 1.1, keepFocus = false } = {}) {
    if (!M) return false;
    const c = M.byConcept.get(id);
    if (!c) return false;
    if (!inMode(c)) {
      if (c.modes && !c.modes.includes(state.mode)) state.mode = c.modes[0];
      if (c.layer != null && (c.layer > state.layer || (c.hideAbove && state.layer >= c.hideAbove))) state.layer = c.layer;
      emit('state', { mode: state.mode, layer: state.layer });
    }
    if (!keepFocus || !state.focus) state.focus = c.sys;
    state.part = id; controls.autoRotate = false; idleT = 0; apply(); pickList = pickables();
    const box = new THREE.Box3(); M.comps.forEach(k => { if (k.concepts?.includes(id) && inMode(k)) box.union(k.box); });
    const pv = c.view;
    const dir = pv?.dir ? dirOf(pv.dir) : M.meta.focus?.[c.sys]?.dir ? dirOf(M.meta.focus[c.sys].dir) : currentDir();
    flyTo(fitTo(pv?.box ? new THREE.Box3(V(...pv.box[0]), V(...pv.box[1])) : box, dir, pv?.pad ?? 2.1, M.meta.stage?.partR ?? M.meta.stage?.minR ?? 0.25), dur);
    emit('part', { concept: id, comp: c.id, sys: c.sys });
    return true;
  }
  const api = {
    attach, detach, focus, focusConcept,
    get model() { return M; }, get state() { return state; }, get host() { return host; },
    has: id => !!M?.byConcept.get(id),
    partFor: id => M?.byConcept.get(id) || null,
    clearPart() { state.part = null; apply(); pickList = pickables(); },
    overview(view = 'overview', dur = 1.1) { state.view = view; state.focus = null; state.part = null; apply(); pickList = pickables(); frameOverview(view, dur); },
    setMode(m) { if (!M?.meta.modes?.[m]) return; state.mode = m; apply(); pickList = pickables(); emit('state', { mode: m, layer: state.layer }); },
    setLayer(n) { if (!M?.meta.layers) return; state.layer = Math.max(0, Math.min(M.meta.layers.length - 1, n)); apply(); pickList = pickables(); emit('state', { mode: state.mode, layer: state.layer }); },
    setXray(on) { state.xray = !!on; apply(); },
    setFlows(on) { state.flows = !!on; apply(); },
    setLabels(on) { state.labels = !!on; apply(); },
    setInsets(v) { Object.assign(insets, v); },
    setAutoRotate(on) { state.autoRotate = !!on; controls.autoRotate = !!on && !reduced; },
    enableOrbit(on) { controls.enabled = !!on && interactive; canvas.style.touchAction = on ? 'none' : 'pan-y'; },
    setZoom(on) { controls.enableZoom = !!on; },
    orbitBy(rad) { const off = camera.position.clone().sub(controls.target); off.applyAxisAngle(V(0, 1, 0), rad); controls.autoRotate = false; idleT = 0; flyTo({ pos: controls.target.clone().add(off), target: controls.target.clone() }, 0.6); },
    zoom(k) { const d = camera.position.clone().sub(controls.target); const len = Math.max(controls.minDistance, Math.min(controls.maxDistance, d.length() * k)); flyTo({ pos: controls.target.clone().add(d.setLength(len)), target: controls.target.clone() }, 0.35); },
    resize,
    on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); return () => { listeners[ev] = listeners[ev].filter(f => f !== fn); }; },
    off(ev) { listeners[ev] = []; },
    renderOnce() { if (M) { controls.update(); renderer.render(scene, camera); layoutLabels(); } },
    settle() { if (tween) { camera.position.copy(tween.p1); controls.target.copy(tween.t1); tween = null; } controls.update(); },
    canvas
  };
  return api;
}

/* model metadata without building geometry (used for chips, legends and indexes) */
export async function modelMeta(id) { const mod = await LOADERS[id](); return mod.meta; }
