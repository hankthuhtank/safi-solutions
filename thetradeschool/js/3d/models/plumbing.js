/* Plumbing model: a single-storey house slice on a slab, street to roof.
   Supply: water main → curb stop + meter → service line under the footing → main shutoff → PRV →
   copper trunk → storage water heater (cutaway) and a PEX home-run manifold → kitchen, lavatory,
   toilet, shower. DWV: every fixture trap → branch drains → cast-iron stack vented through the roof
   → building drain under the slab (sloped) → building sewer → street.
   Colours: PEX red/blue as sold, PVC DWV white, cast iron black, copper as copper.
   x → toward the bathroom, y up (slab top = 0), z toward the viewer. */
export const meta = {
  id: 'plumbing',
  name: 'House plumbing, street to roof',
  plate: 'SUPPLY · HOT WATER · DRAIN · WASTE · VENT',
  systems: {
    'plumb-fundamentals': { name: 'Fundamentals', color: 0xbfe3ff },
    'plumb-supply': { name: 'Water distribution', color: 0x3d8bff },
    'plumb-pipe': { name: 'Pipe + joining', color: 0xd08a58 },
    'plumb-drain': { name: 'Drain · waste · vent', color: 0xc9a46a },
    'plumb-fixtures': { name: 'Fixtures', color: 0xe9e6dc },
    'plumb-hot': { name: 'Hot water', color: 0xff5a4a },
    'plumb-protection': { name: 'Water protection', color: 0x5fd39a },
    'plumb-diagnostics': { name: 'Diagnostics', color: 0xf0c43a },
    'plumb-tools': { name: 'Service tools', color: 0xb49cff }
  },
  views: { overview: { dir: [0.3, 0.3, 1], pad: 1.0 } },
  focus: {
    'plumb-drain': { dir: [0.25, 0.15, 1] }, 'plumb-hot': { dir: [0.45, 0.25, 1] }, 'plumb-fixtures': { dir: [0.1, 0.25, 1] }, 'plumb-supply': { dir: [0.25, 0.25, 1] }
  },
  stage: { shadow: 5.5, grid: 0x8fd8c2, fade: 12, minR: 0.35, partR: 0.2, floor: false }
};

export function build(k) {
  const { THREE, V, rbox, box, cyl, cylBetween, tube, pipe, pipePoints, merge, at, rotY, rotZ, rotX, lathe, mat, STOCK, CONTEXT } = k;
  const A = k.assembly(meta);
  const { add, ctx, flow, root } = A;
  const M = {
    pexR: mat(0xd8322c, { rough: 0.45 }), pexB: mat(0x2f6fd6, { rough: 0.45 }), pvc: mat(0xeeeeea, { rough: 0.45 }), iron: mat(0x2a2c2f, { rough: 0.7, metal: 0.4 }),
    porcelain: mat(0xf4f2ec, { rough: 0.2, metal: 0.05 }), chrome: mat(0xd6dbe0, { rough: 0.12, metal: 1 }), counter: mat(0x5b6168, { rough: 0.5 }), copper: STOCK.copper(), brass: STOCK.brass()
  };
  const WALL = -1.3, FLOOR = 0;

  /* ---------------- context: soil section, slab, back wall, footing, roof patch */
  ctx(at(box(8.6, 1.2, 2.6), -0.6, -0.62, -0.2), mat(0x6b5a45, { rough: 1, opacity: 0.1 }), { edgeColor: 0xb89a74, edgeOpacity: 0.3 });
  ctx(at(box(5.9, 0.1, 2.6), 0.45, -0.05, -0.2), CONTEXT.slab());
  ctx(at(box(5.9, 2.5, 0.04), 0.45, 1.25, WALL - 0.12), CONTEXT.wall());
  ctx(at(box(0.2, 2.5, 2.6), -2.6, 1.25, -0.2), CONTEXT.wall());
  ctx(at(box(0.45, 0.3, 2.6), -2.6, -0.35, -0.2), mat(0x9c9a94, { rough: 1, opacity: 0.25 }));
  ctx(at(rotZ(box(2.2, 0.04, 1.2), -0.35), 1.7, 3.05, -0.7), CONTEXT.slab());

  /* ---------------- street: main, curb stop, meter pit */
  const SX = -4.3, SY = -0.95;
  add('main', 'plumb-supply', at(cyl(0.075, 2.4, 'z', 20), SX, SY, -0.2), { c: ['potable-water'], label: 'Water main', mat: mat(0x3b4a8a, { metal: 0.4 }), also: ['plumb-fundamentals'] });
  ctx(at(cyl(0.2, 0.9, 'y', 24, 0.2, true), -3.5, -0.45, -0.5), mat(0x2f3a33, { rough: 0.8, opacity: 0.3, side: THREE.DoubleSide }));
  add('meter', 'plumb-supply', merge([at(rbox(0.14, 0.09, 0.1, 0.02), -3.5, -0.8, -0.5), at(cyl(0.045, 0.012, 'y', 18), -3.5, -0.75, -0.5)]), { c: ['water-meter'], label: 'Water meter', mat: M.brass });
  add('dualcheck', 'plumb-protection', at(cyl(0.035, 0.12, 'x', 16), -3.3, -0.85, -0.5), { c: ['check-valve', 'backflow-prevention'], label: 'Dual check (backflow)', mat: M.brass });
  const svcPts = [V(SX, SY + 0.07, -0.5), V(-3.6, -0.85, -0.5), V(-2.3, -0.85, -0.5), V(-2.3, -0.85, WALL + 0.1), V(-2.3, 0.8, WALL + 0.1)];
  add('service', 'plumb-supply', pipe(svcPts, 0.018, 0.08), { c: ['service-line', 'potable-water'], label: 'Service line', hero: true, mat: mat(0x2f5fb8, { rough: 0.5 }), anchor: V(-2.9, -0.85, -0.5) });

  /* ---------------- utility wall: main shutoff, PRV, trunk, hose bibb */
  const UY = 0.95;
  add('mainvalve', 'plumb-supply', merge([at(cyl(0.028, 0.1, 'y', 16), -2.3, UY, WALL + 0.1), at(rbox(0.12, 0.018, 0.03, 0.006), -2.25, UY + 0.03, WALL + 0.1)]), { c: ['main-shutoff', 'ball-valve', 'shutoff-valve'], label: 'Main shutoff (ball valve)', hero: true, mat: M.brass });
  add('prv', 'plumb-supply', merge([at(cyl(0.035, 0.14, 'y', 16), -2.3, UY + 0.22, WALL + 0.1), at(cyl(0.04, 0.12, 'z', 18), -2.3, UY + 0.3, WALL + 0.16), at(cyl(0.012, 0.05, 'z', 10), -2.3, UY + 0.3, WALL + 0.24)]), { c: ['pressure-regulator', 'water-pressure'], label: 'Pressure-reducing valve', mat: M.brass, also: ['plumb-fundamentals'] });
  const trunkPts = [V(-2.3, UY + 0.3, WALL + 0.1), V(-2.3, 2.2, WALL + 0.1), V(-1.75, 2.2, WALL + 0.1), V(-0.95, 2.2, WALL + 0.1)];
  add('trunk', 'plumb-supply', pipe(trunkPts, 0.013, 0.05), { c: ['pipe-sizing-water', 'copper-tube'], label: 'Copper trunk (¾ in)', mat: M.copper, also: ['plumb-pipe'] });
  add('pressfit', 'plumb-pipe', merge([at(cyl(0.02, 0.05, 'x', 16), -2.0, 2.2, WALL + 0.1), at(new THREE.TorusGeometry(0.02, 0.004, 8, 18).rotateY(Math.PI / 2), -2.02, 2.2, WALL + 0.1)]), { c: ['press-fitting'], label: 'Press fitting', mat: M.copper });
  add('solder', 'plumb-pipe', merge([at(cyl(0.019, 0.045, 'y', 16), -2.3, 1.8, WALL + 0.1), at(new THREE.TorusGeometry(0.019, 0.003, 8, 18).rotateX(Math.PI / 2), -2.3, 1.822, WALL + 0.1)]), { c: ['soldering', 'pipe-prep'], label: 'Soldered joint', mat: mat(0xc9a449, { metal: 0.9, rough: 0.3 }) });
  add('bibb', 'plumb-protection', merge([pipe([V(-2.3, 1.4, WALL + 0.1), V(-2.55, 1.4, WALL + 0.1), V(-2.72, 1.4, WALL + 0.1)], 0.012, 0.03), at(rbox(0.06, 0.05, 0.05, 0.01), -2.76, 1.4, WALL + 0.1), at(cyl(0.018, 0.05, 'y', 12), -2.78, 1.35, WALL + 0.1)]), { c: ['galvanized-pipe', 'threaded-joint'], label: 'Hose bibb (old galvanized)', mat: STOCK.galv(), also: ['plumb-pipe'] });
  add('vb', 'plumb-protection', at(cyl(0.02, 0.04, 'y', 14), -2.78, 1.3, WALL + 0.1), { c: ['vacuum-breaker'], label: 'Vacuum breaker', mat: M.brass });
  add('hose', 'plumb-protection', tube([V(-2.78, 1.28, WALL + 0.1), V(-2.9, 0.6, -0.8), V(-2.95, 0.1, -0.2), V(-3.05, 0.45, 0.35)], 0.012), { c: ['cross-connection'], label: 'Hose in a bucket (cross-connection)', mat: mat(0x3a8a3a, { rough: 0.7 }) });
  add('bucket', 'plumb-protection', at(cyl(0.14, 0.34, 'y', 20, 0.16, true), -3.05, 0.17, 0.35), { c: ['cross-connection'], labelled: false, mat: mat(0xe07b24, { rough: 0.6, side: THREE.DoubleSide }) });
  add('gauge', 'plumb-tools', merge([at(cyl(0.04, 0.02, 'x', 20), -2.9, 1.45, WALL + 0.1), at(cyl(0.035, 0.005, 'x', 20), -2.915, 1.45, WALL + 0.1)]), { c: ['pressure-gauge-plumb', 'static-dynamic-pressure'], label: 'Pressure gauge', mat: mat(0xdadcd8, { metal: 0.6 }), also: ['plumb-fundamentals', 'plumb-diagnostics'] });

  /* ---------------- storage water heater (cutaway), expansion tank, mixing valve, recirc */
  const HX = -1.75, HZ = -0.85, HR = 0.26, HH = 1.45;
  add('wh', 'plumb-hot', merge([at(cyl(HR, HH, 'y', 40), HX, 0.06 + HH / 2, HZ), at(cyl(0.05, 0.3, 'y', 16), HX, HH + 0.22, HZ)]), { c: ['water-heater', 'thermal-stratification'], label: 'Storage water heater', hero: true, shell: true, mat: mat(0xdad7d0, { metal: 0.3 }), anchor: V(HX + HR, 1.0, HZ + 0.1) });
  // stratified water: hot on top, cold at the bottom (vertex colours)
  const water = cyl(HR - 0.03, HH - 0.2, 'y', 32); const col = [], pos = water.attributes.position;
  for (let i = 0; i < pos.count; i++) { const t = (pos.getY(i) + (HH - 0.2) / 2) / (HH - 0.2); const c = new THREE.Color(0x3d8bff).lerp(new THREE.Color(0xff4d3d), Math.pow(t, 1.4)); col.push(c.r, c.g, c.b); }
  water.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); at(water, HX, 0.16 + (HH - 0.2) / 2, HZ);
  add('water', 'plumb-hot', water, { c: ['thermal-stratification'], label: 'Hot rises, cold sinks', mat: new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.32, depthWrite: false, roughness: 0.2 }), noShadow: true, labelled: false });
  add('diptube', 'plumb-hot', at(cyl(0.012, HH - 0.3, 'y', 12), HX - 0.08, 0.28 + (HH - 0.3) / 2, HZ), { c: ['dip-tube'], label: 'Dip tube', mat: mat(0xf0efe8) });
  add('anode', 'plumb-hot', at(cyl(0.011, HH - 0.35, 'y', 12), HX + 0.09, 0.3 + (HH - 0.35) / 2, HZ + 0.05), { c: ['anode-rod', 'galvanic-corrosion'], label: 'Anode rod', mat: mat(0x8f969c, { metal: 0.8 }), also: ['plumb-diagnostics'] });
  add('burner', 'plumb-hot', merge([at(cyl(0.12, 0.03, 'y', 24), HX, 0.1, HZ), at(rbox(0.1, 0.12, 0.06, 0.01), HX, 0.35, HZ + HR + 0.02)]), { c: [], label: 'Burner + gas control', mat: mat(0x3a3f45, { metal: 0.5 }) });
  add('tpr', 'plumb-hot', merge([at(rbox(0.05, 0.05, 0.05, 0.008), HX + HR + 0.02, HH - 0.12, HZ), at(rbox(0.012, 0.05, 0.02, 0.004), HX + HR + 0.02, HH - 0.07, HZ), pipe([V(HX + HR + 0.05, HH - 0.12, HZ), V(HX + HR + 0.1, HH - 0.12, HZ), V(HX + HR + 0.1, 0.15, HZ)], 0.012, 0.04)]), { c: ['tpr-valve'], label: 'T&P relief valve + discharge', mat: M.brass });
  const coldIn = [V(-2.3, 2.05, WALL + 0.1), V(HX - 0.08, 2.05, WALL + 0.1), V(HX - 0.08, 2.05, HZ), V(HX - 0.08, HH + 0.06, HZ)];
  add('whcold', 'plumb-hot', pipe(coldIn, 0.012, 0.05), { c: [], labelled: false, mat: M.copper });
  add('dielectric', 'plumb-diagnostics', merge([at(cyl(0.022, 0.035, 'y', 16), HX - 0.08, HH + 0.14, HZ), at(cyl(0.022, 0.035, 'y', 16), HX + 0.08, HH + 0.14, HZ)]), { c: ['galvanic-corrosion'], label: 'Dielectric unions', mat: mat(0xb9a15a, { metal: 0.9 }) });
  add('exptank', 'plumb-hot', merge([at(lathe([[0, 0], [0.1, 0.02], [0.12, 0.08], [0.12, 0.28], [0.09, 0.34], [0, 0.36]], 28), HX - 0.08, 2.1, HZ + 0.25), pipe([V(HX - 0.08, 2.05, HZ), V(HX - 0.08, 2.05, HZ + 0.25), V(HX - 0.08, 2.1, HZ + 0.25)], 0.01, 0.03)]), { c: ['expansion-tank', 'thermal-expansion'], label: 'Expansion tank', mat: mat(0xeceae4, { rough: 0.4 }) });
  add('mixvalve', 'plumb-hot', merge([at(rbox(0.07, 0.07, 0.06, 0.012), HX + 0.08, 1.85, HZ), at(cyl(0.022, 0.03, 'z', 14), HX + 0.08, 1.85, HZ + 0.045)]), { c: ['mixing-valve', 'scald-protection'], label: 'Thermostatic mixing valve', mat: M.brass });
  const hotOut = [V(HX + 0.08, HH + 0.06, HZ), V(HX + 0.08, 2.12, HZ), V(HX + 0.08, 2.12, WALL + 0.1), V(-0.95, 2.12, WALL + 0.1)];
  add('whhot', 'plumb-hot', pipe(hotOut, 0.012, 0.05), { c: [], labelled: false, mat: M.copper });
  add('recirc', 'plumb-hot', merge([at(rbox(0.1, 0.08, 0.08, 0.012), HX - 0.35, 0.55, HZ + 0.05), pipe([V(-0.95, 2.28, WALL + 0.12), V(HX - 0.35, 2.28, WALL + 0.12), V(HX - 0.35, 0.6, HZ + 0.05)], 0.008, 0.04)]), { c: ['hot-water-recirculation'], label: 'Recirculation pump', mat: mat(0x2e7d5b, { metal: 0.3 }) });
  add('leaksensor', 'plumb-tools', at(cyl(0.035, 0.02, 'y', 18), HX + 0.35, 0.01, HZ + 0.25), { c: ['leak-detector'], label: 'Leak sensor', mat: mat(0xf4f2ec) });

  /* ---------------- PEX home-run manifold */
  const MXp = -0.95, MYp = 1.9;
  add('manifold', 'plumb-supply', merge([at(cyl(0.02, 0.5, 'x', 16), MXp + 0.25, MYp, WALL + 0.1), at(cyl(0.02, 0.5, 'x', 16), MXp + 0.25, MYp - 0.28, WALL + 0.1), ...Array.from({ length: 5 }, (_, i) => merge([at(cyl(0.008, 0.08, 'y', 10), MXp + 0.05 + i * 0.1, MYp - 0.06, WALL + 0.1), at(cyl(0.008, 0.08, 'y', 10), MXp + 0.05 + i * 0.1, MYp - 0.34, WALL + 0.1)]))]),
    { c: ['manifold-plumbing', 'leak-isolation', 'branch-line'], label: 'PEX manifold', hero: true, mat: M.brass, also: ['plumb-diagnostics'] });
  add('crimp', 'plumb-pipe', merge(Array.from({ length: 5 }, (_, i) => at(new THREE.TorusGeometry(0.011, 0.004, 8, 16).rotateX(Math.PI / 2), MXp + 0.05 + i * 0.1, MYp - 0.1, WALL + 0.1))), { c: ['crimp-fitting'], label: 'Crimp rings', mat: M.copper });
  pipePoints; // (kept for symmetry with other models)
  const fixturesX = { kitchen: 0.25, lav: 1.25, wc: 2.05, tub: 2.9 };
  const homerun = (x0, x1, y1, hot, z = WALL + 0.14) => [V(x0, hot ? MYp - 0.1 : MYp - 0.38, WALL + 0.1), V(x0, hot ? 2.36 : 2.3, WALL + 0.1), V(x1, hot ? 2.36 : 2.3, z), V(x1, y1, z)];
  const runs = [
    ['kitchen', fixturesX.kitchen - 0.07, 0.62, true], ['kitchen', fixturesX.kitchen + 0.07, 0.62, false],
    ['lav', fixturesX.lav - 0.07, 0.55, true], ['lav', fixturesX.lav + 0.07, 0.55, false],
    ['wc', fixturesX.wc + 0.15, 0.2, false],
    ['tub', fixturesX.tub - 0.05, 1.05, true], ['tub', fixturesX.tub + 0.05, 1.05, false]
  ];
  const hotRuns = [], coldRuns = [];
  runs.forEach(([f, x, y, hot], i) => { const p = homerun(MXp + 0.05 + (i % 5) * 0.1, x, y, hot, WALL + 0.08 + (hot ? 0 : 0.03)); (hot ? hotRuns : coldRuns).push(p); });
  add('pexhot', 'plumb-pipe', merge(hotRuns.map(p => pipe(p, 0.008, 0.08))), { c: ['pex'], label: 'PEX (hot = red)', mat: M.pexR, also: ['plumb-hot'] });
  add('pexcold', 'plumb-pipe', merge(coldRuns.map(p => pipe(p, 0.008, 0.08))), { c: ['pex', 'friction-loss-water'], label: 'PEX (cold = blue)', mat: M.pexB, also: ['plumb-supply', 'plumb-fundamentals'] });
  add('washer', 'plumb-diagnostics', merge([at(rbox(0.3, 0.26, 0.08, 0.01), -0.35, 1.1, WALL + 0.06), at(cyl(0.022, 0.12, 'y', 14), -0.45, 1.36, WALL + 0.1), at(cyl(0.022, 0.12, 'y', 14), -0.25, 1.36, WALL + 0.1)]), { c: ['water-hammer', 'water-hammer-arrestor'], label: 'Washer box + hammer arrestors', mat: mat(0xeceae4) });

  /* ---------------- fixtures */
  // kitchen sink with AAV
  const KX = fixturesX.kitchen;
  ctx(merge([at(box(1.2, 0.04, 0.62), KX, 0.9, WALL + 0.31), at(box(1.2, 0.86, 0.02), KX, 0.45, WALL + 0.61)]), mat(0x5b6168, { rough: 0.5, opacity: 0.35 }));
  add('ksink', 'plumb-fixtures', merge([at(lathe([[0.001, -0.2], [0.2, -0.2], [0.22, -0.02], [0.24, 0], [0.24, 0.005]], 4).rotateY(Math.PI / 4).scale(1.35, 1, 0.9), KX, 0.9, WALL + 0.32)]), { c: [], label: 'Kitchen sink', mat: M.chrome, noShadow: true });
  add('faucet', 'plumb-fixtures', merge([at(cyl(0.022, 0.12, 'y', 16), KX, 0.98, WALL + 0.08), tube([V(KX, 1.03, WALL + 0.08), V(KX, 1.25, WALL + 0.1), V(KX, 1.28, WALL + 0.2), V(KX, 1.2, WALL + 0.3)], 0.011), at(rbox(0.02, 0.07, 0.02, 0.006), KX + 0.05, 1.05, WALL + 0.08)]), { c: ['faucet-cartridge'], label: 'Faucet (cartridge)', mat: M.chrome });
  add('kstops', 'plumb-fixtures', merge([-0.07, 0.07].map(d => merge([at(rbox(0.035, 0.035, 0.05, 0.006), KX + d, 0.62, WALL + 0.16), at(cyl(0.01, 0.03, 'y', 10), KX + d, 0.66, WALL + 0.17), tube([V(KX + d, 0.66, WALL + 0.17), V(KX + d, 0.82, WALL + 0.12), V(KX + d * 0.3, 0.9, WALL + 0.1)], 0.005)]))), { c: ['angle-stop', 'shutoff-valve', 'compression-fitting'], label: 'Angle stops', mat: M.chrome });
  const kTrap = [V(KX, 0.7, WALL + 0.32), V(KX, 0.48, WALL + 0.32), V(KX, 0.38, WALL + 0.26), V(KX, 0.46, WALL + 0.2), V(KX, 0.48, WALL + 0.14), V(KX + 0.3, 0.46, WALL + 0.14)];
  add('ktrap', 'plumb-drain', tube(kTrap.slice(0, 5), 0.02, false, 40), { c: ['p-trap', 'sewer-gas'], label: 'P-trap', hero: true, mat: M.pvc, anchor: V(KX, 0.4, WALL + 0.27) });
  add('ktraparm', 'plumb-drain', pipe([V(KX, 0.48, WALL + 0.14), V(KX + 0.3, 0.46, WALL + 0.14), V(KX + 0.42, 0.46, WALL + 0.14)], 0.02, 0.03), { c: ['trap-arm', 'drain-slope'], label: 'Trap arm (¼ in/ft)', mat: M.pvc });
  add('aav', 'plumb-drain', merge([at(cyl(0.02, 0.25, 'y', 14), KX + 0.42, 0.6, WALL + 0.14), at(cyl(0.038, 0.09, 'y', 18), KX + 0.42, 0.77, WALL + 0.14)]), { c: ['air-admittance-valve'], label: 'Air admittance valve', mat: mat(0x2f3338, { rough: 0.6 }) });
  add('kdrain', 'plumb-drain', pipe([V(KX + 0.42, 0.46, WALL + 0.14), V(KX + 0.42, -0.35, WALL + 0.14), V(KX + 0.42, -0.35, WALL + 0.35)], 0.022, 0.05), { c: ['branch-drain', 'pvc-dwv', 'solvent-cement'], label: 'Branch drain (PVC)', mat: M.pvc, also: ['plumb-pipe'] });
  // lavatory with POU tankless
  const LX = fixturesX.lav;
  add('lav', 'plumb-fixtures', merge([at(lathe([[0.001, -0.14], [0.16, -0.12], [0.2, -0.02], [0.21, 0.02]], 32).scale(1, 1, 0.8), LX, 0.85, WALL + 0.3), at(cyl(0.07, 0.62, 'y', 20, 0.1), LX, 0.42, WALL + 0.25)]), { c: [], label: 'Lavatory', mat: M.porcelain });
  add('lavfaucet', 'plumb-fixtures', merge([at(cyl(0.018, 0.1, 'y', 14), LX, 0.92, WALL + 0.12), tube([V(LX, 0.96, WALL + 0.12), V(LX, 1.0, WALL + 0.16), V(LX, 0.97, WALL + 0.22)], 0.009)]), { c: ['faucet-cartridge'], labelled: false, mat: M.chrome });
  add('lavtrap', 'plumb-drain', tube([V(LX, 0.72, WALL + 0.3), V(LX, 0.5, WALL + 0.3), V(LX, 0.42, WALL + 0.24), V(LX, 0.5, WALL + 0.18), V(LX, 0.52, WALL + 0.1), V(1.62, 0.5, WALL + 0.1)], 0.017, false, 40), { c: ['p-trap'], labelled: false, mat: M.chrome });
  add('pou', 'plumb-hot', at(rbox(0.16, 0.2, 0.08, 0.012), LX - 0.22, 0.4, WALL + 0.08), { c: ['tankless-water-heater', 'descaling'], label: 'Point-of-use tankless', mat: mat(0xeceae4) });
  // toilet
  const WX = fixturesX.wc;
  add('bowl', 'plumb-fixtures', merge([at(lathe([[0.001, 0], [0.11, 0], [0.12, 0.05], [0.13, 0.25], [0.2, 0.36], [0.2, 0.4]], 32).scale(0.9, 1, 1.15), WX, 0, WALL + 0.45), at(rbox(0.36, 0.03, 0.46, 0.015), WX, 0.41, WALL + 0.45)]), { c: [], label: 'Toilet', mat: M.porcelain });
  const tank = add('tank', 'plumb-fixtures', at(rbox(0.46, 0.38, 0.19, 0.02), WX, 0.62, WALL + 0.14), { c: ['toilet-flush-valve'], label: 'Toilet tank', shell: true, mat: M.porcelain, labelled: false });
  add('fillvalve', 'plumb-fixtures', merge([at(cyl(0.016, 0.3, 'y', 12), WX + 0.15, 0.6, WALL + 0.14), at(cyl(0.035, 0.07, 'y', 16), WX + 0.15, 0.62, WALL + 0.14)]), { c: ['toilet-fill-valve'], label: 'Fill valve', mat: mat(0x3a3f45) });
  add('flushvalve', 'plumb-fixtures', merge([at(cyl(0.04, 0.05, 'y', 18), WX - 0.02, 0.47, WALL + 0.14), at(cyl(0.012, 0.28, 'y', 10), WX - 0.02, 0.62, WALL + 0.14)]), { c: ['toilet-flush-valve'], label: 'Flush valve + overflow', mat: mat(0x5a6168) });
  add('flapper', 'plumb-fixtures', at(cyl(0.045, 0.012, 'y', 20), WX - 0.02, 0.5, WALL + 0.14), { c: ['toilet-flapper'], label: 'Flapper', mat: mat(0xd8322c, { rough: 0.8 }) });
  add('flange', 'plumb-fixtures', merge([at(cyl(0.1, 0.012, 'y', 28), WX, 0.005, WALL + 0.35), at(cyl(0.05, 0.12, 'y', 20), WX, -0.06, WALL + 0.35)]), { c: ['closet-flange'], label: 'Closet flange', mat: M.pvc });
  add('wax', 'plumb-fixtures', at(new THREE.TorusGeometry(0.06, 0.02, 10, 24).rotateX(Math.PI / 2), WX, 0.025, WALL + 0.35), { c: ['wax-ring'], label: 'Wax ring', mat: mat(0xd9b35a, { rough: 0.8 }) });
  // shower/tub
  const TX = fixturesX.tub;
  add('tub', 'plumb-fixtures', at(rbox(0.72, 0.5, 1.2, 0.05), TX, 0.25, WALL + 0.62), { c: [], label: 'Tub', shell: true, mat: M.porcelain });
  add('showervalve', 'plumb-fixtures', merge([at(cyl(0.07, 0.02, 'z', 24), TX, 1.05, WALL + 0.04), at(rbox(0.1, 0.1, 0.08, 0.012), TX, 1.05, WALL), tube([V(TX, 1.05, WALL), V(TX, 1.8, WALL), V(TX, 1.9, WALL + 0.15)], 0.01), at(cyl(0.06, 0.04, 'y', 20, 0.035), TX, 1.86, WALL + 0.2)]), { c: ['scald-protection', 'flow-rate'], label: 'Shower valve (pressure-balance)', mat: M.chrome, also: ['plumb-hot', 'plumb-fundamentals'] });

  /* ---------------- DWV: stack, vent, fittings, building drain, sewer */
  const STX = 1.65, BDy0 = -0.38, BDy1 = -0.52, BDx0 = 3.15, BDx1 = -2.4;
  const bdY = x => BDy0 + (BDx0 - x) / (BDx0 - BDx1) * (BDy1 - BDy0);
  add('stack', 'plumb-drain', merge([at(cyl(0.045, 2.55, 'y', 20), STX, bdY(STX) + 1.27, WALL + 0.1)]), { c: ['stack-plumbing', 'cast-iron'], label: 'Cast-iron stack', hero: true, mat: M.iron, also: ['plumb-pipe'], anchor: V(STX, 1.6, WALL + 0.15) });
  add('vent', 'plumb-drain', merge([at(cyl(0.045, 1.05, 'y', 20), STX, 2.6, WALL + 0.1), at(cyl(0.1, 0.02, 'y', 24, 0.05), STX, 3.05, WALL + 0.1)]), { c: ['vent-stack'], label: 'Vent through roof', hero: true, mat: M.iron, anchor: V(STX, 2.9, WALL + 0.12) });
  add('santee', 'plumb-drain', merge([at(cyl(0.05, 0.14, 'y', 18), STX, 0.5, WALL + 0.1), at(cyl(0.024, 0.07, 'x', 14), STX - 0.06, 0.5, WALL + 0.1)]), { c: ['sanitary-tee', 'dwv-fittings'], label: 'Sanitary tee', mat: mat(0x3a3d41, { metal: 0.4 }) });
  add('wcdrain', 'plumb-drain', pipe([V(WX, -0.06, WALL + 0.35), V(WX, bdY(WX) + 0.15, WALL + 0.35), V(WX, bdY(WX), WALL + 0.1)], 0.04, 0.08), { c: ['branch-drain'], labelled: false, mat: M.pvc });
  add('wye', 'plumb-drain', merge([at(cyl(0.05, 0.16, 'x', 18), WX, bdY(WX), WALL + 0.1), at(rotY(cyl(0.042, 0.12, 'x', 16), Math.PI / 4), WX + 0.04, bdY(WX), WALL + 0.15)]), { c: ['wye-fitting', 'dwv-fittings'], label: 'Wye fitting', mat: M.pvc });
  add('tubdrain', 'plumb-drain', merge([tube([V(TX - 0.2, 0.02, WALL + 0.4), V(TX - 0.2, -0.12, WALL + 0.4), V(TX - 0.2, -0.2, WALL + 0.34), V(TX - 0.2, -0.12, WALL + 0.28), V(TX - 0.2, -0.14, WALL + 0.2)], 0.022, false, 30), pipe([V(TX - 0.2, -0.14, WALL + 0.2), V(TX - 0.2, bdY(TX - 0.2), WALL + 0.1)], 0.022, 0.04)]), { c: ['branch-drain', 'drain-slope'], label: 'Tub trap + branch', mat: M.pvc });
  const bdPts = [V(BDx0 - 0.3, bdY(BDx0 - 0.3), WALL + 0.1), V(BDx1, bdY(BDx1), WALL + 0.1)];
  add('bdrain', 'plumb-drain', cylBetween(bdPts[0], bdPts[1], 0.05, 20), { c: ['building-drain', 'fixture-units', 'drain-slope'], label: 'Building drain (sloped)', hero: true, mat: M.pvc, also: ['plumb-fundamentals'], anchor: V(0.4, bdY(0.4), WALL + 0.15) });
  add('cleanout', 'plumb-drain', merge([pipe([V(-2.2, bdY(-2.2), WALL + 0.1), V(-2.2, bdY(-2.2), WALL + 0.4), V(-2.2, 0.02, WALL + 0.4)], 0.05, 0.08), at(cyl(0.06, 0.03, 'y', 20), -2.2, 0.02, WALL + 0.4)]), { c: ['cleanout'], label: 'Cleanout', mat: M.pvc });
  const sewerPts = [V(BDx1, bdY(BDx1), WALL + 0.1), V(-3.3, -0.62, WALL + 0.1), V(SX + 0.2, -0.75, WALL + 0.1)];
  add('sewer', 'plumb-drain', pipe(sewerPts, 0.055, 0.1), { c: ['building-sewer'], label: 'Building sewer', mat: mat(0x3f7a3f, { rough: 0.6 }), anchor: V(-3.6, -0.68, WALL + 0.15) });
  add('floordrain', 'plumb-drain', merge([at(cyl(0.09, 0.012, 'y', 20), -1.0, 0.005, -0.1), tube([V(-1.0, -0.01, -0.1), V(-1.0, -0.2, -0.1), V(-1.0, -0.3, -0.18), V(-1.0, -0.22, -0.26), V(-1.0, -0.24, -0.35), V(-1.0, bdY(-1.0), WALL + 0.1)], 0.035, false, 40)]), { c: ['floor-drain'], label: 'Floor drain', mat: mat(0x5a6168, { metal: 0.5 }) });
  add('primer', 'plumb-drain', merge([at(rbox(0.06, 0.08, 0.05, 0.01), -1.35, 0.5, WALL + 0.08), tube([V(-1.35, 0.45, WALL + 0.08), V(-1.35, 0.02, WALL + 0.1), V(-1.02, -0.05, -0.2)], 0.005)]), { c: ['trap-primer'], label: 'Trap primer', mat: M.brass });

  /* ---------------- tools */
  add('camera', 'plumb-tools', merge([at(cyl(0.14, 0.07, 'z', 28), -2.0, 0.16, 0.4), at(rbox(0.14, 0.1, 0.03, 0.01), -2.0, 0.36, 0.42), tube([V(-2.0, 0.12, 0.4), V(-2.1, 0.02, 0.2), V(-2.2, 0.03, WALL + 0.4)], 0.006)]), { c: ['camera-inspection'], label: 'Sewer camera', mat: mat(0xf0c43a) });
  add('snake', 'plumb-tools', merge([at(cyl(0.16, 0.14, 'x', 24), -0.55, 0.3, 0.2), at(rbox(0.3, 0.05, 0.2, 0.01), -0.55, 0.1, 0.2), tube([V(-0.62, 0.3, 0.2), V(-0.85, 0.12, 0.05), V(-0.98, 0.02, -0.08)], 0.006)]), { c: ['drain-snake'], label: 'Drum auger', mat: mat(0xc0392b, { metal: 0.4 }) });

  /* ---------------- flows */
  const cold = [...svcPts.slice(0, 5), ...trunkPts.slice(1)];
  flow('plumb-supply', [V(SX, SY, -1.4), V(SX, SY, 1.0)], 0x3d8bff, { r: 0.03, speed: 0.4, density: 6, also: ['plumb-fundamentals'] });
  flow('plumb-supply', cold, 0x3d8bff, { r: 0.012, speed: 0.3, density: 7, also: ['plumb-fundamentals', 'plumb-protection', 'plumb-pipe'] });
  flow('plumb-hot', coldIn.concat([V(HX - 0.08, 0.3, HZ)]), 0x3d8bff, { r: 0.011, speed: 0.25, density: 8, also: ['plumb-supply'] });
  flow('plumb-hot', [V(HX + 0.08, HH - 0.1, HZ), ...hotOut.slice(0), V(MXp + 0.25, MYp, WALL + 0.1)], 0xff4d3d, { r: 0.011, speed: 0.25, density: 8, also: ['plumb-supply'] });
  hotRuns.forEach(p => flow('plumb-hot', pipePoints(p, 0.08), 0xff4d3d, { r: 0.008, speed: 0.25, density: 8, also: ['plumb-supply', 'plumb-fixtures', 'plumb-pipe'] }));
  coldRuns.forEach(p => flow('plumb-supply', pipePoints(p, 0.08), 0x3d8bff, { r: 0.008, speed: 0.25, density: 8, also: ['plumb-fixtures', 'plumb-pipe'] }));
  const brown = 0xa8845a;
  flow('plumb-drain', [...kTrap, V(KX + 0.42, 0.46, WALL + 0.14), V(KX + 0.42, -0.35, WALL + 0.14), V(KX + 0.42, bdY(KX + 0.42), WALL + 0.1)], brown, { r: 0.014, speed: 0.2, density: 8, also: ['plumb-fixtures'] });
  flow('plumb-drain', [V(WX, 0.2, WALL + 0.4), V(WX, -0.06, WALL + 0.35), V(WX, bdY(WX), WALL + 0.1)], brown, { r: 0.02, speed: 0.2, density: 10, also: ['plumb-fixtures'] });
  flow('plumb-drain', [V(LX, 0.72, WALL + 0.3), V(LX, 0.45, WALL + 0.25), V(LX, 0.52, WALL + 0.1), V(STX, 0.5, WALL + 0.1), V(STX, bdY(STX), WALL + 0.1)], brown, { r: 0.012, speed: 0.2, density: 10, also: ['plumb-fixtures'] });
  flow('plumb-drain', [bdPts[0], bdPts[1], ...sewerPts.slice(1)], brown, { r: 0.022, speed: 0.22, density: 6 });
  flow('plumb-drain', [V(STX, bdY(STX) + 0.1, WALL + 0.1), V(STX, 3.1, WALL + 0.1), V(STX, 3.3, WALL + 0.1)], 0xdfe7ee, { r: 0.012, speed: 0.3, density: 6, idle: false });

  return { root, comps: A.comps, flows: A.flows };
}
