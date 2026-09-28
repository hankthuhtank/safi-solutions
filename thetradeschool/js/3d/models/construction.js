/* Construction model: one corner of a wood-framed house, built up in the order a crew builds it.
   Layers: site + layout → foundation → floor → walls → roof → envelope. Dimensions are real framing
   sizes (2x4 walls at 16 in on centre, 2x10 floor joists, 92-5/8 in precut studs, 82-1/2 in header
   height, 6:12 rafters on a structural ridge, ½ in anchor bolts ≤ 6 ft on centre and ≤ 12 in from
   plate ends). Load-path arrows trace roof → wall → header → jack studs → foundation → soil.
   Footprint 16 ft × 12 ft, grade at y = 0, front wall toward the viewer (z = +1.8). */
export const meta = {
  id: 'construction',
  name: 'House corner, built in layers',
  plate: 'WOOD FRAME · 2x4 @ 16 in O.C. · 2x10 FLOOR · 6:12 ROOF',
  systems: {
    'const-plans': { name: 'Plans + drawings', color: 0x9fd8ff },
    'const-layout': { name: 'Layout + measurement', color: 0x4a87c7 },
    'const-framing': { name: 'Framing', color: 0xe3b778 },
    'const-loads': { name: 'Structures + load path', color: 0xff6a3d },
    'const-envelope': { name: 'Building envelope', color: 0x5fd39a },
    'const-materials': { name: 'Materials + concrete', color: 0xb9b6ad },
    'const-site': { name: 'Site + safety', color: 0xf2c21b }
  },
  layers: ['Site + layout', 'Foundation', 'Floor', 'Walls', 'Roof', 'Envelope'],
  sysLayer: { 'const-layout': 0, 'const-materials': 1, 'const-framing': 4, 'const-loads': 4, 'const-envelope': 5, 'const-site': 4, 'const-plans': 5 },
  views: { overview: { dir: [0.75, 0.55, 1], pad: 1.0 } },
  focus: {
    'const-plans': { dir: [0.2, 0.9, 0.6] }, 'const-framing': { dir: [0.6, 0.35, 1] }, 'const-materials': { dir: [0.6, 0.6, 1] }, 'const-envelope': { dir: [0.9, 0.35, 1] }
  },
  stage: { shadow: 6, grid: 0x8fb4de, fade: 13, minR: 0.35, partR: 0.25 }
};

export function build(k) {
  const { THREE, V, rbox, box, cyl, cylBetween, tube, merge, at, rotY, rotZ, rotX, extrude, mat, STOCK, CONTEXT } = k;
  const A = k.assembly(meta);
  const { add, ctx, flow, root } = A;
  const L = { site: 0, fdn: 1, floor: 2, walls: 3, roof: 4, env: 5 };
  const lumber = STOCK.lumber(), pt = mat(0x9aa36a, { rough: 0.85 }), osb = STOCK.osb(), conc = STOCK.concrete(), rebar = STOCK.rebar(), galv = STOCK.galv();
  const X0 = -2.4, X1 = 2.4, Z0 = -1.8, Z1 = 1.8;
  const T2 = 0.038, D4 = 0.089, D6 = 0.14, D10 = 0.235;
  const lb = (w, h, d, x, y, z) => at(box(w, h, d), x, y, z);

  /* ---------------- context: grade with the excavation, gravel */
  ctx(merge([lb(9.6, 0.02, 2.2, 0, -0.01, -3.0), lb(9.6, 0.02, 2.4, 0, -0.01, 3.2), lb(2.2, 0.02, 3.6, -3.7, -0.01, 0), lb(2.2, 0.02, 3.6, 3.7, -0.01, 0)]), CONTEXT.ground(), { edgeOpacity: 0.12 });
  ctx(lb(5.2, 0.5, 4.0, 0, -0.26, 0), mat(0x6b5a45, { rough: 1, opacity: 0.08 }), { edgeColor: 0xb89a74, edgeOpacity: 0.25 });

  /* =============== layer 0 · site + layout */
  add('batter', 'const-layout', merge([[-3.0, 2.4], [3.0, 2.4], [-3.0, -2.4], [3.0, -2.4]].flatMap(([x, z]) => [lb(0.05, 0.8, 0.05, x, 0.4, z), lb(0.6, 0.1, 0.02, x - Math.sign(x) * -0.0, 0.7, z)])), { c: ['layout'], label: 'Batter boards', mat: lumber, layer: L.site, hideAbove: L.floor });
  add('strings', 'const-layout', merge([cylBetween(V(-3.0, 0.74, Z1), V(3.0, 0.74, Z1), 0.004, 6), cylBetween(V(-3.0, 0.74, Z0), V(3.0, 0.74, Z0), 0.004, 6), cylBetween(V(X0, 0.74, 2.4), V(X0, 0.74, -2.4), 0.004, 6), cylBetween(V(X1, 0.74, 2.4), V(X1, 0.74, -2.4), 0.004, 6)]), { c: ['grid-lines', 'layout'], label: 'String lines on the grid', mat: mat(0xff5aa8), layer: L.site, hideAbove: L.floor });
  add('gridbubble', 'const-layout', merge([at(cyl(0.12, 0.01, 'y', 24), -3.3, 0.02, Z1), at(cyl(0.12, 0.01, 'y', 24), X1, 0.02, 2.75)]), { c: ['grid-lines'], labelled: false, mat: mat(0x4a87c7), layer: L.site, hideAbove: L.floor });
  add('345', 'const-layout', merge([cylBetween(V(X1, 0.75, Z1), V(X1 - 0.914, 0.75, Z1), 0.006, 6), cylBetween(V(X1, 0.75, Z1), V(X1, 0.75, Z1 - 1.219), 0.006, 6), cylBetween(V(X1 - 0.914, 0.75, Z1), V(X1, 0.75, Z1 - 1.219), 0.006, 6)]), { c: ['three-four-five'], label: '3-4-5 square check', mat: mat(0xf2c21b), layer: L.site, hideAbove: L.fdn });
  add('benchmark', 'const-layout', merge([lb(0.05, 0.5, 0.05, -3.6, 0.25, -2.6), at(cyl(0.035, 0.02, 'y', 12), -3.6, 0.51, -2.6)]), { c: ['benchmark'], label: 'Benchmark (elevation 100.00)', mat: mat(0x4a87c7), layer: L.site });
  add('laser', 'const-layout', merge([...[0, 1, 2].map(i => { const a = i / 3 * Math.PI * 2; return cylBetween(V(-3.3, 1.1, -1.3), V(-3.3 + Math.cos(a) * 0.35, 0, -1.3 + Math.sin(a) * 0.35), 0.012, 6); }), at(rbox(0.16, 0.2, 0.16, 0.02), -3.3, 1.22, -1.3), at(cyl(0.04, 0.05, 'y', 16), -3.3, 1.35, -1.3)]), { c: ['laser-level'], label: 'Rotary laser level', mat: mat(0xe07b24, { rough: 0.5 }), layer: L.site });
  const laserPlane = new THREE.Mesh(new THREE.RingGeometry(0.1, 7, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.025, depthWrite: false, side: THREE.DoubleSide })); laserPlane.position.set(-3.3, 1.35, -1.3); root.add(laserPlane);
  add('trench', 'const-site', merge([extrude([[0, 0], [0.6, 0], [0.9, -0.9], [0, -0.9]], 0.3).rotateY(Math.PI / 2).translate(-4.2, 0, 1.5), at(box(0.3, 0.02, 3.4), -4.25, -0.9, 0.0)]), { c: ['excavation-safety'], label: 'Sloped utility trench', mat: mat(0x8a6d4a, { rough: 1, opacity: 0.45 }), layer: L.site, noShadow: true });
  add('utilities', 'const-site', merge([at(cyl(0.04, 3.4, 'z', 14), -4.25, -0.82, 0), ...[-1.2, 0, 1.2].map(z => merge([lb(0.006, 0.35, 0.006, -3.9, 0.17, z), lb(0.08, 0.06, 0.002, -3.86, 0.33, z)]))]), { c: ['site-utilities'], label: 'Marked utilities', mat: mat(0xf2c21b), layer: L.site });
  add('tape', 'const-layout', merge([at(rbox(0.07, 0.07, 0.03, 0.01), -1.6, 0.86, 1.2), lb(1.2, 0.002, 0.025, -1.0, 0.845, 1.2)]), { c: ['tape-reading', 'dimensions'], label: 'Tape measure', mat: mat(0xf2c21b), layer: L.floor });
  add('chalk', 'const-layout', merge([lb(4.6, 0.002, 0.006, 0, 0.843, 1.68), lb(0.006, 0.002, 3.3, 2.28, 0.843, 0)]), { c: ['layout'], label: 'Chalk lines (wall layout)', mat: mat(0x2f6fd6), layer: L.floor, hideAbove: L.walls });
  add('level', 'const-layout', lb(0.04, 1.2, 0.02, X1 - 0.12, 1.6, -0.6), { c: ['plumb-level-square'], label: 'Level (plumb check)', mat: mat(0xf2c21b), layer: L.walls });
  // plan table
  const PT = V(-3.6, 0.9, 2.6);
  ctx(merge([lb(1.2, 0.04, 0.8, PT.x, PT.y, PT.z), ...[[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]].map(([x, z]) => lb(0.04, PT.y, 0.04, PT.x + x, PT.y / 2, PT.z + z))]), lumber, { cast: true });
  const ink = mat(0x1f4f8c, { rough: 0.8 }), paper = mat(0xeef1f4, { rough: 0.95 });
  add('sheets', 'const-plans', merge([lb(0.9, 0.004, 0.6, PT.x - 0.05, PT.y + 0.024, PT.z), lb(0.9, 0.004, 0.6, PT.x + 0.02, PT.y + 0.03, PT.z + 0.04)]), { c: ['plan-set'], label: 'Plan set', mat: paper });
  const planG = merge([lb(0.5, 0.004, 0.012, PT.x, PT.y + 0.034, PT.z - 0.14), lb(0.5, 0.004, 0.012, PT.x, PT.y + 0.034, PT.z + 0.14), lb(0.012, 0.004, 0.29, PT.x - 0.25, PT.y + 0.034, PT.z), lb(0.012, 0.004, 0.29, PT.x + 0.25, PT.y + 0.034, PT.z), lb(0.012, 0.004, 0.2, PT.x + 0.05, PT.y + 0.034, PT.z - 0.04)]);
  add('floorplan', 'const-plans', planG, { c: ['floor-plan', 'plan-symbols'], label: 'Floor plan', mat: ink });
  add('doorswing', 'const-plans', at(new THREE.RingGeometry(0.075, 0.082, 20, 1, 0, Math.PI / 2).rotateX(-Math.PI / 2), PT.x + 0.1, PT.y + 0.035, PT.z + 0.13), { c: ['plan-symbols'], label: 'Door swing symbol', mat: ink });
  add('dims', 'const-plans', merge([lb(0.5, 0.004, 0.004, PT.x, PT.y + 0.034, PT.z - 0.22), lb(0.004, 0.004, 0.03, PT.x - 0.25, PT.y + 0.034, PT.z - 0.22), lb(0.004, 0.004, 0.03, PT.x + 0.25, PT.y + 0.034, PT.z - 0.22)]), { c: ['dimensions', 'scale-reading'], label: 'Dimension string', mat: ink, also: ['const-layout'] });
  add('callout', 'const-plans', merge([at(new THREE.RingGeometry(0.03, 0.036, 20).rotateX(-Math.PI / 2), PT.x + 0.33, PT.y + 0.035, PT.z + 0.2), lb(0.06, 0.004, 0.004, PT.x + 0.33, PT.y + 0.035, PT.z + 0.2)]), { c: ['detail-callout', 'section-view'], label: 'Section / detail callout', mat: ink });
  add('elev', 'const-plans', merge([lb(0.3, 0.004, 0.12, PT.x + 0.25, PT.y + 0.05, PT.z + 0.55), lb(0.26, 0.004, 0.01, PT.x + 0.25, PT.y + 0.053, PT.z + 0.52)]), { c: ['elevation-view'], label: 'Elevation sheet', mat: paper });
  add('schedule', 'const-plans', merge([lb(0.2, 0.004, 0.16, PT.x - 0.4, PT.y + 0.034, PT.z + 0.18), ...[0, 1, 2, 3].map(i => lb(0.2, 0.005, 0.003, PT.x - 0.4, PT.y + 0.036, PT.z + 0.12 + i * 0.04))]), { c: ['schedule'], label: 'Window schedule', mat: ink });
  add('scale', 'const-layout', at(rotY(cyl(0.012, 0.3, 'x', 3), 0.4), PT.x - 0.2, PT.y + 0.045, PT.z - 0.05), { c: ['scale-reading'], label: "Architect's scale", mat: mat(0xdcdad2) });

  /* =============== layer 1 · foundation */
  const FW = 0.5, FH = 0.25, SW = 0.2, SY0 = -0.2, SY1 = 0.55;
  const ring = (w, h, y, inset, outset) => merge([lb(X1 - X0 + 2 * outset, h, w, 0, y, Z1 - inset), lb(X1 - X0 + 2 * outset, h, w, 0, y, Z0 + inset), lb(w, h, Z1 - Z0 + 2 * outset - 2 * w, X0 + inset, y, 0), lb(w, h, Z1 - Z0 + 2 * outset - 2 * w, X1 - inset, y, 0)].map((g, i) => (i > 1 ? g.translate(0, 0, 0) : g)));
  add('footing', 'const-loads', merge([ring(FW, FH, -0.2 - FH / 2, SW / 2, (FW - SW) / 2), lb(0.5, 0.25, 0.5, -0.8, -0.325, 0), lb(0.5, 0.25, 0.5, 0.8, -0.325, 0)]), { c: ['footing', 'concrete'], label: 'Footing', hero: true, shell: true, mat: conc, layer: L.fdn, also: ['const-materials'], anchor: V(X1 - 0.1, -0.33, Z1 + 0.1) });
  add('stem', 'const-loads', ring(SW, SY1 - SY0, (SY0 + SY1) / 2, SW / 2, 0), { c: ['foundation', 'concrete'], label: 'Foundation wall', hero: true, shell: true, mat: conc, layer: L.fdn, also: ['const-materials'], anchor: V(0.6, 0.3, Z1) });
  add('rebar', 'const-materials', merge([
    ...[-0.37, -0.29].flatMap(y => [cylBetween(V(X0 - 0.1, y, Z1 - 0.1), V(X1 + 0.1, y, Z1 - 0.1), 0.0064, 6), cylBetween(V(X1 - 0.1, y, Z1 + 0.1), V(X1 - 0.1, y, Z0 - 0.1), 0.0064, 6), cylBetween(V(X0 - 0.1, y, Z0 + 0.1), V(X1 + 0.1, y, Z0 + 0.1), 0.0064, 6), cylBetween(V(X0 + 0.1, y, Z1 + 0.1), V(X0 + 0.1, y, Z0 - 0.1), 0.0064, 6)]),
    ...[0.1, 0.42].flatMap(y => [cylBetween(V(X0, y, Z1 - 0.1), V(X1, y, Z1 - 0.1), 0.0064, 6), cylBetween(V(X1 - 0.1, y, Z1), V(X1 - 0.1, y, Z0), 0.0064, 6)]),
    ...Array.from({ length: 8 }, (_, i) => cylBetween(V(X0 + 0.3 + i * 0.6, -0.36, Z1 - 0.1), V(X0 + 0.3 + i * 0.6, 0.48, Z1 - 0.1), 0.0064, 6))]), { c: ['rebar', 'rebar-cover'], label: 'Rebar (3 in cover in the footing)', mat: rebar, layer: L.fdn, anchor: V(X1 - 0.1, -0.33, Z1 - 0.1) });
  const bolts = [[-2.2, Z1 - 0.1], [-0.4, Z1 - 0.1], [1.4, Z1 - 0.1], [2.2, Z1 - 0.3], [X1 - 0.1, 0.0], [X1 - 0.1, -1.6], [X0 + 0.1, 1.6], [X0 + 0.1, 0], [X0 + 0.1, -1.6], [-2.2, Z0 + 0.1], [0, Z0 + 0.1], [2.2, Z0 + 0.1]];
  add('bolts', 'const-materials', merge(bolts.map(([x, z]) => merge([at(cyl(0.0064, 0.25, 'y', 8), x, SY1 - 0.06, z), at(cyl(0.02, 0.006, 'y', 12), x, SY1 + 0.045, z)]))), { c: ['anchor-bolt', 'fasteners'], label: 'Anchor bolts (≤ 6 ft o.c.)', mat: galv, layer: L.fdn });
  add('forms', 'const-materials', merge([lb(X1 - X0 + 0.6, 0.6, 0.03, 0, 0.25, Z1 + 0.17), ...Array.from({ length: 7 }, (_, i) => lb(0.05, 0.7, 0.05, X0 - 0.2 + i * 0.8, 0.25, Z1 + 0.22)), ...Array.from({ length: 7 }, (_, i) => cylBetween(V(X0 - 0.2 + i * 0.8, 0.5, Z1 + 0.22), V(X0 - 0.2 + i * 0.8, 0, Z1 + 0.7), 0.02, 6))]), { c: ['formwork'], label: 'Formwork + kickers', mat: mat(0xc9a067, { rough: 0.85 }), layer: L.fdn, hideAbove: L.floor });
  add('chute', 'const-materials', merge([cylBetween(V(-1.6, 1.3, 3.2), V(-1.2, 0.7, Z1 + 0.05), 0.1, 3), cylBetween(V(-1.6, 1.3, 3.2), V(-1.9, 1.6, 4.2), 0.1, 3)]), { c: ['concrete-placement'], label: 'Concrete chute', mat: mat(0x9aa3ad, { metal: 0.6, side: THREE.DoubleSide }), layer: L.fdn, hideAbove: L.floor });
  add('cylinders', 'const-materials', merge([0, 1, 2].map(i => at(cyl(0.05, 0.2, 'y', 16), 3.4 + i * 0.13, 0.1, 2.6))), { c: ['compressive-strength'], label: 'Test cylinders (psi)', mat: conc, layer: L.fdn, hideAbove: L.walls });
  add('blanket', 'const-materials', lb(1.6, 0.03, 0.3, -1.4, SY1 + 0.02, Z0 + 0.1), { c: ['curing'], label: 'Curing blanket', mat: mat(0x2f6fd6, { rough: 0.9 }), layer: L.fdn, hideAbove: L.floor });
  add('saw', 'const-site', merge([at(rbox(0.3, 0.14, 0.14, 0.02), 3.6, 0.07, 1.4), at(cyl(0.16, 0.012, 'z', 28), 3.45, 0.17, 1.4)]), { c: ['silica-dust'], label: 'Cut-off saw with water feed', mat: mat(0xe07b24), layer: L.fdn });
  add('bearing', 'const-loads', merge([-1.5, -0.3, 0.9, 2.1].map(x => merge([cylBetween(V(x, -0.75, Z1 - 0.1), V(x, -0.5, Z1 - 0.1), 0.012, 8), at(cyl(0.035, 0.07, 'y', 12, 0.001), x, -0.48, Z1 - 0.1)]))), { c: ['soil-bearing'], label: 'Soil bearing (pushes back up)', mat: mat(0xff6a3d, { opacity: 0.8 }), layer: L.fdn, noShadow: true });

  /* =============== layer 2 · floor */
  const SILL0 = SY1, SILL1 = SY1 + T2, J1 = SILL1 + D10, FLOOR = J1 + 0.018;
  add('sill', 'const-framing', merge([lb(X1 - X0, T2, D6, 0, SILL0 + T2 / 2, Z1 - D6 / 2), lb(X1 - X0, T2, D6, 0, SILL0 + T2 / 2, Z0 + D6 / 2), lb(D6, T2, Z1 - Z0 - 2 * D6, X1 - D6 / 2, SILL0 + T2 / 2, 0), lb(D6, T2, Z1 - Z0 - 2 * D6, X0 + D6 / 2, SILL0 + T2 / 2, 0)]), { c: ['top-bottom-plate'], label: 'Sill plate (treated)', mat: pt, layer: L.floor });
  add('rim', 'const-framing', merge([lb(X1 - X0, D10, T2, 0, SILL1 + D10 / 2, Z1 - T2 / 2), lb(X1 - X0, D10, T2, 0, SILL1 + D10 / 2, Z0 + T2 / 2), lb(T2, D10, Z1 - Z0, X1 - T2 / 2, SILL1 + D10 / 2, 0), lb(T2, D10, Z1 - Z0, X0 + T2 / 2, SILL1 + D10 / 2, 0)]), { c: ['rim-joist'], label: 'Rim joist', mat: lumber, layer: L.floor });
  const jx = Array.from({ length: 11 }, (_, i) => X0 + 0.406 * (i + 1));
  add('joists', 'const-framing', merge(jx.map(x => lb(T2, D10, Z1 - Z0 - 2 * T2, x, SILL1 + D10 / 2, 0))), { c: ['floor-joist'], label: 'Floor joists 16 in o.c.', hero: true, mat: lumber, layer: L.floor, anchor: V(-1.9, J1, -0.9) });
  add('blocking', 'const-framing', merge(jx.slice(0, -1).map((x, i) => lb(0.406 - T2, D10, T2, x + 0.203, SILL1 + D10 / 2, 0.9))), { c: ['blocking'], label: 'Solid blocking', mat: mat(0xcfa36a, { rough: 0.8 }), layer: L.floor });
  add('girder', 'const-loads', lb(X1 - X0 - 0.4, D10, 0.114, 0, SILL1 - D10 / 2, 0), { c: ['beam'], label: 'Girder (beam)', mat: mat(0xcfa36a, { rough: 0.8 }), layer: L.floor });
  add('posts', 'const-loads', merge([-0.8, 0.8].map(x => lb(D4, SILL1 - D10 + 0.2, D4, x, (SILL1 - D10 - 0.2) / 2, 0))), { c: ['column'], label: 'Posts (columns)', mat: pt, layer: L.floor });
  add('hangers', 'const-materials', merge(jx.slice(0, 5).map(x => lb(0.05, 0.12, 0.004, x, SILL1 + 0.08, Z1 - T2 - 0.002))), { c: ['fasteners'], label: 'Joist hangers + nails', mat: galv, layer: L.floor, labelled: false });
  add('subfloor', 'const-framing', merge([lb(X1 - X0, 0.018, 2.0, 0, J1 + 0.009, 0.8), lb(2.4, 0.018, Z1 - Z0 - 2.0, 1.2, J1 + 0.009, -1.0)]), { c: ['subfloor'], label: 'Subfloor (OSB)', mat: osb, layer: L.floor });
  add('seams', 'const-framing', merge([lb(0.006, 0.003, 2.0, -0.04, FLOOR + 0.001, 0.8), lb(0.006, 0.003, 2.0, -1.26, FLOOR + 0.001, 0.8), lb(X1 - X0, 0.003, 0.006, 0, FLOOR + 0.001, 0.58)]), { c: ['subfloor'], labelled: false, noPick: true, mat: mat(0x6b4e2a), layer: L.floor });
  add('liveload', 'const-loads', merge([-0.4, 0.4].map(x => merge([cylBetween(V(x, FLOOR + 0.9, 0.2), V(x, FLOOR + 0.25, 0.2), 0.02, 8), at(cyl(0.06, 0.14, 'y', 12, 0.001), x, FLOOR + 0.18, 0.2).rotateX(0)]))), { c: ['live-load'], label: 'Live load (people, furniture)', mat: mat(0x9fd8ff, { opacity: 0.8 }), layer: L.floor, noShadow: true });
  add('pointload', 'const-loads', merge([cylBetween(V(0.8, SILL1 + 0.8, 0), V(0.8, SILL1 + 0.12, 0), 0.025, 8), at(rotX(cyl(0.07, 0.15, 'y', 12, 0.001), Math.PI), 0.8, SILL1 + 0.05, 0)]), { c: ['concentrated-load'], label: 'Concentrated load', mat: mat(0xff6a3d, { opacity: 0.85 }), layer: L.floor, hideAbove: L.walls, noShadow: true });

  /* =============== layer 3 · walls */
  const W0 = FLOOR, BP1 = W0 + T2, STUD = 2.353, TP0 = BP1 + STUD, TP1 = TP0 + 2 * T2, HDR = W0 + 2.096;
  const FZ = Z1 - D4 / 2, SX = X1 - D4 / 2;
  const win = { a: -1.357, b: -0.443, sill: HDR - 1.219 }, door = { a: 0.518, b: 1.483 };
  const inOpen = x => (x > win.a - 0.08 && x < win.b + 0.08) || (x > door.a - 0.08 && x < door.b + 0.08);
  const fStuds = [X0 + T2 / 2, ...Array.from({ length: 11 }, (_, i) => X0 + 0.406 * (i + 1)), X1 - D4 - T2 / 2].filter(x => !inOpen(x));
  const sStuds = [Z1 - D4 - T2 / 2, ...Array.from({ length: 8 }, (_, i) => Z1 - 0.406 * (i + 1)), Z0 + T2 / 2];
  add('plates', 'const-framing', merge([lb(win.b - X0 + 0.1, T2, D4, (X0 + door.a) / 2 - 0.25, W0 + T2 / 2, FZ), lb(X1 - door.b, T2, D4, (door.b + X1) / 2, W0 + T2 / 2, FZ), lb(D4, T2, Z1 - Z0 - D4, SX, W0 + T2 / 2, (Z0 + Z1 - D4) / 2), lb(X1 - X0, T2, D4, 0, TP0 + T2 / 2, FZ), lb(X1 - X0 - D4, T2, D4, -D4 / 2, TP0 + 1.5 * T2, FZ), lb(D4, T2, Z1 - Z0 - D4, SX, TP0 + T2 / 2, (Z0 + Z1 - D4) / 2), lb(D4, T2, Z1 - Z0, SX, TP0 + 1.5 * T2, 0)]),
    { c: ['top-bottom-plate'], label: 'Bottom + double top plates', mat: lumber, layer: L.walls, anchor: V(-2.0, TP1, FZ + 0.05) });
  add('studs', 'const-framing', merge([...fStuds.map(x => lb(T2, STUD, D4, x, BP1 + STUD / 2, FZ)), ...sStuds.map(z => lb(D4, STUD, T2, SX, BP1 + STUD / 2, z))]), { c: ['wall-framing', 'stud-spacing', 'bearing-wall'], label: 'Studs 16 in o.c.', hero: true, mat: lumber, layer: L.walls, also: ['const-loads'], anchor: V(-2.0, 1.9, FZ + 0.05) });
  const opening = o => ({ kingA: o.a - T2 - T2 / 2, jackA: o.a - T2 / 2, jackB: o.b + T2 / 2, kingB: o.b + T2 + T2 / 2 });
  const wo = opening(win), dopn = opening(door);
  add('kings', 'const-framing', merge([wo.kingA, wo.kingB, dopn.kingA, dopn.kingB].map(x => lb(T2, STUD, D4, x, BP1 + STUD / 2, FZ))), { c: ['king-jack-stud'], label: 'King studs', mat: mat(0xe8c48a, { rough: 0.8 }), layer: L.walls });
  add('jacks', 'const-framing', merge([wo.jackA, wo.jackB, dopn.jackA, dopn.jackB].map(x => lb(T2, HDR - BP1, D4, x, (BP1 + HDR) / 2, FZ))), { c: ['king-jack-stud', 'rough-opening'], label: 'Jack (trimmer) studs', mat: mat(0xf0d29a, { rough: 0.8 }), layer: L.walls, also: ['const-envelope'] });
  add('headers', 'const-framing', merge([[wo.jackA - T2 / 2, wo.jackB + T2 / 2], [dopn.jackA - T2 / 2, dopn.jackB + T2 / 2]].map(([a, b]) => lb(b - a, D10, D4, (a + b) / 2, HDR + D10 / 2, FZ))), { c: ['header', 'beam'], label: 'Headers (2x10 doubled)', hero: true, mat: mat(0xd8a868, { rough: 0.8 }), layer: L.walls, also: ['const-loads'] });
  add('rosill', 'const-framing', lb(win.b - win.a, T2 * 2, D4, (win.a + win.b) / 2, win.sill - T2, FZ), { c: ['rough-opening'], label: 'Rough sill', mat: mat(0xf0d29a, { rough: 0.8 }), layer: L.walls, also: ['const-envelope'] });
  const crips = [win.a + 0.15, (win.a + win.b) / 2, win.b - 0.15];
  add('cripples', 'const-framing', merge([...crips.map(x => lb(T2, win.sill - 2 * T2 - BP1, D4, x, (BP1 + win.sill - 2 * T2) / 2, FZ)), ...crips.map(x => lb(T2, TP0 - HDR - D10, D4, x, (HDR + D10 + TP0) / 2, FZ)), ...[door.a + 0.25, door.b - 0.25].map(x => lb(T2, TP0 - HDR - D10, D4, x, (HDR + D10 + TP0) / 2, FZ))]), { c: ['cripple-stud'], label: 'Cripple studs', mat: mat(0xe8c48a, { rough: 0.8 }), layer: L.walls });
  add('wallblock', 'const-framing', merge(sStuds.slice(0, -1).map((z, i) => lb(D4, T2, Math.abs(sStuds[i + 1] - z) - T2, SX, 2.0, (z + sStuds[i + 1]) / 2))), { c: ['blocking'], labelled: false, mat: mat(0xcfa36a, { rough: 0.8 }), layer: L.walls });
  add('fireblock', 'const-framing', merge([at(cyl(0.045, 0.12, 'y', 16), -2.0, TP1 + 0.02, FZ), at(new THREE.TorusGeometry(0.05, 0.012, 8, 20).rotateX(Math.PI / 2), -2.0, TP1 + 0.005, FZ)]), { c: ['fire-blocking'], label: 'Fire-blocking at a penetration', mat: mat(0xd33a2c, { rough: 0.8 }), layer: L.walls });
  add('shear', 'const-framing', lb(0.011, TP1 - W0 + D10 + T2, Z1 - Z0, X1 + 0.006, (W0 - D10 - T2 + TP1) / 2, 0), { c: ['sheathing', 'shear-wall'], label: 'Wall sheathing = shear wall', hero: true, mat: osb, layer: L.walls, also: ['const-loads'], anchor: V(X1 + 0.01, 2.2, -0.9) });
  add('holddown', 'const-loads', merge([Z1 - 0.07, Z0 + 0.07].map(z => merge([lb(0.004, 0.35, 0.06, X1 - D4 - 0.004, BP1 + 0.17, z), lb(0.07, 0.01, 0.06, X1 - D4 - 0.04, BP1 + 0.005, z), at(cyl(0.008, 0.9, 'y', 8), X1 - D4 - 0.06, BP1 - 0.3, z)]))), { c: ['hold-down'], label: 'Hold-downs', mat: galv, layer: L.walls });
  add('wind', 'const-loads', merge([1.4, 2.2].flatMap(y => [0.9, -0.9].map(z => merge([cylBetween(V(X1 + 1.2, y, z), V(X1 + 0.25, y, z), 0.02, 8), at(rotZ(cyl(0.06, 0.14, 'y', 12, 0.001), Math.PI / 2), X1 + 0.18, y, z)])))), { c: ['wind-load'], label: 'Wind load', mat: mat(0x7cc6ff, { opacity: 0.8 }), layer: L.walls, noShadow: true });
  add('bracing', 'const-site', merge([cylBetween(V(-1.9, 2.8, FZ + 0.06), V(-1.9, 0.02, Z1 + 1.9), 0.025, 4), lb(0.05, 0.4, 0.05, -1.9, 0.1, Z1 + 1.95)]), { c: ['temporary-bracing'], label: 'Temporary bracing', mat: lumber, layer: L.walls, hideAbove: L.env });
  add('scaffold', 'const-site', merge([...[Z1 - 0.3, 0, Z0 + 0.3].flatMap(z => [at(cyl(0.024, 3.0, 'y', 8), X1 + 0.4, 1.5, z), at(cyl(0.024, 3.0, 'y', 8), X1 + 1.1, 1.5, z), cylBetween(V(X1 + 0.4, 0.2, z), V(X1 + 1.1, 1.4, z), 0.015, 6), cylBetween(V(X1 + 0.4, 1.9, z), V(X1 + 1.1, 3.0, z), 0.015, 6)]), lb(0.7, 0.05, Z1 - Z0 - 0.4, X1 + 0.75, 1.9, 0), cylBetween(V(X1 + 1.1, 2.9, Z1 - 0.3), V(X1 + 1.1, 2.9, Z0 + 0.3), 0.02, 6), cylBetween(V(X1 + 1.1, 2.4, Z1 - 0.3), V(X1 + 1.1, 2.4, Z0 + 0.3), 0.02, 6)]), { c: ['scaffold-safety'], label: 'Scaffold (guardrails)', mat: mat(0xf2c21b, { metal: 0.5 }), layer: L.walls });
  add('ladder', 'const-site', merge([cylBetween(V(-0.2, 0, Z1 + 0.85), V(-0.2, TP1 + 0.95, Z1 + 0.02), 0.022, 6), cylBetween(V(0.25, 0, Z1 + 0.85), V(0.25, TP1 + 0.95, Z1 + 0.02), 0.022, 6), ...Array.from({ length: 13 }, (_, i) => { const t = (i + 1) / 14; return cylBetween(V(-0.2, t * (TP1 + 0.95), Z1 + 0.85 - t * 0.83), V(0.25, t * (TP1 + 0.95), Z1 + 0.85 - t * 0.83), 0.012, 6); })]), { c: ['ladder-safety'], label: 'Ladder 3 ft above landing, 4:1', mat: mat(0xe0c23a, { metal: 0.4 }), layer: L.walls });

  /* =============== layer 4 · roof */
  const RIDGEZ = 0, run = Z1 - RIDGEZ, pitch = 0.5, RY = TP1 + run * pitch;
  add('ridge', 'const-framing', lb(X1 - X0 + 0.3, 0.3, D4, 0, RY + 0.06, RIDGEZ), { c: ['ridge-beam', 'beam'], label: 'Structural ridge beam', mat: mat(0xc99d5e, { rough: 0.7 }), layer: L.roof, also: ['const-loads'] });
  add('ridgeposts', 'const-loads', merge([lb(D4, RY - TP1 - 0.09, D4, X1 - D4 / 2, (TP1 + RY - 0.09) / 2, 0), lb(D4, RY - W0 - 0.09, D4, X0 + 0.1, (W0 + RY - 0.09) / 2, 0)]), { c: ['column'], labelled: false, mat: lumber, layer: L.roof });
  const eaveZ = Z1 + 0.4, eaveY = TP1 - 0.4 * pitch;
  const rafterXs = Array.from({ length: 12 }, (_, i) => X0 + 0.02 + 0.406 * i);
  add('rafters', 'const-framing', merge(rafterXs.map(x => cylBetween(V(x, eaveY + 0.09, eaveZ), V(x, RY + 0.12, RIDGEZ + 0.05), 0.045, 4).scale(1, 1, 1))), { c: ['rafter', 'roof-framing'], label: 'Rafters 6:12', hero: true, mat: lumber, layer: L.roof, anchor: V(-1.0, (TP1 + RY) / 2 + 0.1, 0.9) });
  add('ties', 'const-materials', merge(rafterXs.map(x => lb(0.05, 0.08, 0.004, x + 0.03, TP1 + 0.03, FZ + 0.045))), { c: ['fasteners'], label: 'Hurricane ties', mat: galv, layer: L.roof });
  const slope = (x0, x1, t, y0 = 0.12) => { const g = box(x1 - x0, t, Math.hypot(run + 0.4, (run + 0.4) * pitch)); g.rotateX(Math.atan(pitch)); return at(g, (x0 + x1) / 2, (eaveY + RY) / 2 + y0 + 0.07, (eaveZ + RIDGEZ) / 2); };
  add('roofdeck', 'const-framing', slope(0.0, X1 + 0.15, 0.012), { c: ['sheathing', 'diaphragm'], label: 'Roof sheathing (diaphragm)', mat: osb, layer: L.roof, also: ['const-loads'] });
  add('underlay', 'const-envelope', slope(1.2, X1 + 0.15, 0.004, 0.13), { c: ['roof-underlayment'], label: 'Roof underlayment', mat: mat(0x4a5058, { rough: 0.8 }), layer: L.roof });
  add('dripedge', 'const-envelope', lb(X1 - X0 + 0.3, 0.02, 0.03, 0, eaveY + 0.16, eaveZ + 0.02), { c: ['flashing'], label: 'Drip edge flashing', mat: mat(0xdad7cc, { metal: 0.8 }), layer: L.roof });
  add('trusses', 'const-framing', merge([0, 1, 2].map(i => { const y = 0.05 + i * 0.1, g = [cylBetween(V(-4.6, y, -2.5), V(-2.8, y, -2.5 + 0.9 * 2 - 1.8), 0.02, 4)]; return merge([lb(3.6, 0.04, D4, -3.7, y, -2.6), cylBetween(V(-5.5, y, -2.6), V(-3.7, y, -1.7), 0.02, 4), cylBetween(V(-3.7, y, -1.7), V(-1.9, y, -2.6), 0.02, 4), cylBetween(V(-4.6, y, -2.6), V(-3.7, y, -1.7), 0.015, 4), cylBetween(V(-2.8, y, -2.6), V(-3.7, y, -1.7), 0.015, 4)].map(q => q)); })), { c: ['roof-truss'], label: 'Roof trusses (staged)', mat: lumber, layer: L.roof });
  add('anchor', 'const-site', merge([lb(0.12, 0.04, 0.08, 0.5, RY + 0.25, RIDGEZ + 0.05), tube([V(0.5, RY + 0.27, RIDGEZ + 0.05), V(0.6, (RY + TP1) / 2 + 0.25, 0.9), V(0.7, TP1 + 0.35, 1.5)], 0.008)]), { c: ['fall-protection'], label: 'Roof anchor + lifeline', mat: mat(0xf2c21b), layer: L.roof });
  add('deadload', 'const-loads', merge([-1.6, -0.2, 1.2].map(x => merge([cylBetween(V(x, RY + 1.3, 0.9), V(x, RY + 0.25 - 0.45, 0.9), 0.022, 8), at(rotX(cyl(0.07, 0.15, 'y', 12, 0.001), Math.PI), x, RY - 0.3, 0.9)]))), { c: ['dead-load', 'load-path'], label: 'Dead load (roof weight)', mat: mat(0xff6a3d, { opacity: 0.85 }), layer: L.roof, hideAbove: L.env, noShadow: true });

  /* =============== layer 5 · envelope */
  const skin = (t, dx, m, o) => { const cut = (a, b, y0, y1) => lb(b - a, y1 - y0, t, (a + b) / 2, (y0 + y1) / 2, Z1 + dx); return merge([cut(X0, win.a, W0 - D10, TP1), cut(win.b, door.a, W0 - D10, TP1), cut(door.b, X1, W0 - D10, TP1), cut(win.a, win.b, W0 - D10, win.sill), cut(win.a, win.b, HDR, TP1), cut(door.a, door.b, HDR, TP1)]); };
  add('frontsheath', 'const-framing', skin(0.011, 0.006), { c: ['sheathing'], label: '', labelled: false, mat: osb, layer: L.env });
  add('wrb', 'const-envelope', merge([skin(0.002, 0.014), lb(0.002, TP1 - W0 + D10, Z1 - Z0, X1 + 0.014, (W0 - D10 + TP1) / 2, 0)]), { c: ['wrb', 'building-envelope', 'air-barrier'], label: 'House wrap (WRB)', hero: true, mat: mat(0xe9eef2, { rough: 0.6, opacity: 0.88 }), layer: L.env, anchor: V(-1.8, 1.6, Z1 + 0.02) });
  add('window', 'const-envelope', merge([lb(win.b - win.a - 0.02, 0.05, 0.1, (win.a + win.b) / 2, win.sill + 0.025, Z1 - 0.02), lb(win.b - win.a - 0.02, 0.05, 0.1, (win.a + win.b) / 2, HDR - 0.03, Z1 - 0.02), lb(0.05, HDR - win.sill - 0.02, 0.1, win.a + 0.035, (HDR + win.sill) / 2, Z1 - 0.02), lb(0.05, HDR - win.sill - 0.02, 0.1, win.b - 0.035, (HDR + win.sill) / 2, Z1 - 0.02), lb(0.04, HDR - win.sill - 0.1, 0.06, (win.a + win.b) / 2, (HDR + win.sill) / 2, Z1 - 0.02)]), { c: [], label: 'Window unit', mat: mat(0xeceae4), layer: L.env });
  add('glass', 'const-envelope', lb(win.b - win.a - 0.1, HDR - win.sill - 0.1, 0.01, (win.a + win.b) / 2, (HDR + win.sill) / 2, Z1 - 0.02), { c: [], labelled: false, noPick: true, mat: STOCK.glass(), layer: L.env });
  add('winflash', 'const-envelope', merge([lb(win.b - win.a + 0.2, 0.1, 0.004, (win.a + win.b) / 2, win.sill - 0.02, Z1 + 0.02), lb(0.1, HDR - win.sill + 0.1, 0.004, win.a - 0.04, (HDR + win.sill) / 2, Z1 + 0.022), lb(0.1, HDR - win.sill + 0.1, 0.004, win.b + 0.04, (HDR + win.sill) / 2, Z1 + 0.022), lb(win.b - win.a + 0.3, 0.12, 0.004, (win.a + win.b) / 2, HDR + 0.07, Z1 + 0.024)]), { c: ['window-flashing', 'flashing'], label: 'Window flashing (shingle-lapped)', mat: mat(0x2b2f35, { rough: 0.7 }), layer: L.env });
  add('dripcap', 'const-envelope', lb(win.b - win.a + 0.1, 0.012, 0.05, (win.a + win.b) / 2, HDR + 0.02, Z1 + 0.045), { c: ['flashing'], label: 'Head flashing / drip cap', mat: mat(0xdad7cc, { metal: 0.8 }), layer: L.env });
  const bays = fStuds.slice(0, -1).map((x, i) => [x, fStuds[i + 1]]).filter(([a, b]) => b - a < 0.45);
  add('batts', 'const-envelope', merge(bays.map(([a, b]) => lb(b - a - T2, STUD - 0.02, D4 - 0.01, (a + b) / 2, BP1 + STUD / 2, FZ))), { c: ['insulation'], label: 'Insulation batts', mat: mat(0xf2d27a, { rough: 0.95 }), layer: L.env });
  add('thermal', 'const-envelope', merge(fStuds.map(x => lb(T2, STUD, 0.004, x, BP1 + STUD / 2, FZ - D4 / 2 - 0.004))), { c: ['thermal-bridge'], label: 'Thermal bridging at studs', mat: mat(0xff6a3d, { emissive: 0xff4a1d, ei: 0.35 }), layer: L.env });
  add('vapor', 'const-envelope', lb(0.003, STUD, Z1 - Z0 - 0.2, SX - D4 / 2 - 0.004, BP1 + STUD / 2, -0.1), { c: ['vapor-retarder'], label: 'Vapor retarder', mat: mat(0xdff0ff, { rough: 0.2, opacity: 0.3 }), layer: L.env });
  add('furring', 'const-envelope', merge(sStuds.map(z => lb(0.02, 1.2, 0.05, X1 + 0.03, W0 + 0.3, z))), { c: ['drainage-plane'], label: 'Rainscreen gap (drainage plane)', mat: mat(0xcfa36a, { rough: 0.8 }), layer: L.env });
  add('siding', 'const-envelope', merge(Array.from({ length: 6 }, (_, i) => lb(0.018, 0.2, Z1 - Z0, X1 + 0.05 + (i % 2) * 0.002, W0 - 0.2 + i * 0.18, 0))), { c: ['building-envelope'], label: 'Lap siding', mat: mat(0x7f95a8, { rough: 0.7 }), layer: L.env });
  add('sealant', 'const-envelope', merge([lb(X1 - X0, 0.012, 0.012, 0, W0 + 0.004, Z1 + 0.012), lb(0.012, 0.012, Z1 - Z0, X1 + 0.012, W0 + 0.004, 0)]), { c: ['air-barrier'], label: 'Air sealing at the plate', mat: mat(0xd33a2c), layer: L.env });

  /* =============== load path (roof → soil) */
  const lpX = win.a - 0.2;
  flow('const-loads', [V(lpX, RY + 0.15, 0.2), V(lpX, TP1 + 0.3, 1.4), V(lpX, TP1, FZ), V(wo.jackA, HDR + 0.1, FZ), V(wo.jackA, BP1, FZ), V(wo.jackA, SILL1 + 0.1, Z1 - 0.02), V(wo.jackA, SY1, Z1 - 0.1), V(wo.jackA, -0.3, Z1 - 0.1), V(wo.jackA, -0.7, Z1 - 0.1)], 0xff6a3d, { r: 0.025, speed: 0.3, density: 5, layer: L.roof, also: ['const-framing'] });
  flow('const-loads', [V(1.0, RY + 0.15, 0.2), V(1.0, TP1 + 0.3, 1.4), V(1.0, TP1, FZ), V(dopn.jackB, HDR + 0.1, FZ), V(dopn.jackB, BP1, FZ), V(dopn.jackB, SY1, Z1 - 0.1), V(dopn.jackB, -0.7, Z1 - 0.1)], 0xff6a3d, { r: 0.025, speed: 0.3, density: 5, layer: L.roof });
  flow('const-loads', [V(X1 + 1.3, 1.8, 0), V(X1 + 0.1, 1.8, 0), V(X1 - 0.05, 1.0, -1.7), V(X1 - 0.05, W0, -1.7), V(X1 - 0.1, -0.3, -1.7)], 0x7cc6ff, { r: 0.02, speed: 0.3, density: 6, layer: L.walls, idle: false });

  const tick = (dt, t, cx) => { laserPlane.visible = cx.state.layer <= L.floor; if (!cx.reduced) laserPlane.rotation.y += dt * 2; };
  return { root, comps: A.comps, flows: A.flows, tick };
}
