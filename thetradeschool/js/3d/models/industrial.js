/* Industrial maintenance model: a small plant floor where every unit of the course has a machine.
   A · pump skid: TEFC motor → jaw coupling (with dial indicators) → bearing frame → end-suction
       centrifugal pump (volute cut away, impeller visible), shimmed feet, accelerometer, grease points.
   B · conveyor drive: motor → V-belts → right-angle gear reducer (cut away) → roller chain → head
       pulley on pillow blocks → troughed belt, idlers, screw take-up, pull-cord.
   C · hydraulic power unit: reservoir, pump, relief, filter, 4/3 valve, flow control → cylinder.
   D · compressed air: compressor on receiver → dryer → FRL → 5/2 solenoid valve → air cylinder.
   x → right, y up, z toward the viewer. Guards are drawn as see-through safety-yellow mesh. */
export const meta = {
  id: 'industrial',
  name: 'Maintenance floor',
  plate: 'PUMP SKID · CONVEYOR DRIVE · HYDRAULIC POWER UNIT · COMPRESSED AIR',
  systems: {
    'ind-mechanical': { name: 'Mechanical power', color: 0xf3ad63 },
    'ind-bearings': { name: 'Bearings + alignment', color: 0xc9ced6 },
    'ind-fluid': { name: 'Hydraulics', color: 0xe0503c },
    'ind-air': { name: 'Pneumatics', color: 0x5fb8ff },
    'ind-pumps': { name: 'Pumps', color: 0x4f7dff },
    'ind-conveyors': { name: 'Conveyors', color: 0xd9c36a },
    'ind-reliability': { name: 'Lubrication', color: 0xb58b5a },
    'ind-condition': { name: 'Condition monitoring', color: 0x5fd39a },
    'ind-diagnostics': { name: 'Diagnostics', color: 0xe2e2e2 },
    'ind-maint-safety': { name: 'Maintenance safety', color: 0xf2c21b }
  },
  views: { overview: { dir: [0.3, 0.55, 1], pad: 1.0 } },
  focus: {
    'ind-bearings': { dir: [0.35, 0.45, 1] }, 'ind-pumps': { dir: [0.4, 0.4, 1] }, 'ind-fluid': { dir: [0.2, 0.35, 1] }, 'ind-air': { dir: [0.1, 0.4, 1] }
  },
  stage: { shadow: 5, grid: 0xf3c07a, fade: 11, minR: 0.3, partR: 0.16 }
};

export function build(k) {
  const { THREE, V, rbox, box, cyl, cylBetween, tube, pipe, pipePoints, merge, at, rotY, rotZ, rotX, helix, lathe, mat, STOCK, CONTEXT } = k;
  const A = k.assembly(meta);
  const { add, ctx, flow, root } = A;
  const blue = mat(0x2f5d8c, { metal: 0.45, rough: 0.45 }), grey = mat(0x7d858e, { metal: 0.7, rough: 0.4 }), steel = STOCK.steel(), dark = STOCK.darkSteel();
  const guardMat = mat(0xf2c21b, { rough: 0.5, metal: 0.2, opacity: 0.35, side: THREE.DoubleSide });
  const spin = [];
  const spinner = (x, y, z, axis, rate, parts) => { const g = new THREE.Group(); g.position.set(x, y, z); parts.forEach(([geo, m]) => g.add(new THREE.Mesh(geo, m))); g.userData = { axis, rate }; spin.push(g); return g; };

  ctx(at(box(8.2, 0.02, 4.4), 0.1, -0.01, 0.5), CONTEXT.slab());

  /* =============== A · pump skid (shaft along x) */
  const AY = 0.42, AZ = -0.9;
  ctx(at(box(2.1, 0.1, 0.6), -2.35, 0.05, AZ), mat(0x4d555e, { metal: 0.6 }), { cast: true });
  add('pmotor', 'ind-mechanical', merge([at(cyl(0.18, 0.55, 'x', 32), -3.0, AY, AZ), ...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return at(rotX(box(0.5, 0.03, 0.006), a), -3.0, AY + Math.cos(a) * 0.185, AZ + Math.sin(a) * 0.185); }), at(box(0.4, 0.14, 0.34), -3.0, 0.19, AZ), at(rbox(0.12, 0.1, 0.12, 0.01), -3.0, AY + 0.23, AZ)]),
    { c: ['rpm', 'horsepower'], label: 'Motor 1780 rpm', hero: true, mat: blue, anchor: V(-3.1, AY + 0.2, AZ + 0.18) });
  add('shims', 'ind-bearings', merge([[-3.15, -0.15], [-2.85, -0.15], [-3.15, 0.15], [-2.85, 0.15]].map(([x, z]) => at(box(0.1, 0.012, 0.08), x, 0.106, AZ + z))), { c: ['soft-foot'], label: 'Shims (soft foot)', mat: mat(0xc9ced6, { metal: 0.9 }) });
  const pshaft = spinner(-2.3, AY, AZ, 'x', 30, [[cyl(0.022, 1.25, 'x', 16), steel], [at(box(0.05, 0.008, 0.012), -0.4, 0.022, 0), mat(0xc9a449, { metal: 0.9 })]]);
  add('pshaft', 'ind-mechanical', pshaft, { c: ['shaft', 'key-keyway'], label: 'Shaft + key', anchor: V(-2.62, AY + 0.03, AZ + 0.02) });
  const cplg = spinner(-2.62, AY, AZ, 'x', 30, [[merge([cyl(0.06, 0.05, 'x', 24), at(cyl(0.06, 0.05, 'x', 24), 0.07, 0, 0), ...Array.from({ length: 6 }, (_, i) => at(rotX(box(0.03, 0.03, 0.02), i * Math.PI / 3), 0.035, Math.cos(i * Math.PI / 3) * 0.045, Math.sin(i * Math.PI / 3) * 0.045))]), mat(0x444a52, { metal: 0.8 })]]);
  add('coupling', 'ind-mechanical', cplg, { c: ['coupling'], label: 'Jaw coupling', hero: true });
  add('cguard', 'ind-maint-safety', merge([at(cyl(0.12, 0.3, 'x', 24, 0.12, true), -2.6, AY, AZ)]), { c: ['machine-guarding'], label: 'Coupling guard', mat: guardMat, noShadow: true });
  add('dial', 'ind-bearings', merge([at(rbox(0.05, 0.08, 0.05, 0.006), -2.62, AY - 0.02, AZ + 0.22), cylBetween(V(-2.62, AY + 0.02, AZ + 0.22), V(-2.62, AY + 0.15, AZ + 0.1), 0.006), cylBetween(V(-2.62, AY + 0.15, AZ + 0.1), V(-2.58, AY + 0.1, AZ + 0.02), 0.005), at(cyl(0.03, 0.015, 'z', 24), -2.58, AY + 0.14, AZ + 0.06)]),
    { c: ['dial-indicator', 'alignment', 'runout', 'endplay'], label: 'Dial indicator', mat: mat(0xdad7cc, { metal: 0.6 }) });
  add('bframe', 'ind-bearings', merge([at(cyl(0.1, 0.4, 'x', 24), -2.2, AY, AZ), at(box(0.3, AY - 0.15, 0.16), -2.2, (AY + 0.1) / 2, AZ)]), { c: ['bearing', 'radial-load', 'axial-load', 'bearing-clearance', 'bearing-fit', 'preload'], label: 'Bearing frame', hero: true, shell: true, mat: mat(0x3c5a86, { metal: 0.4 }), anchor: V(-2.2, AY + 0.1, AZ + 0.1) });
  add('bearings', 'ind-bearings', merge([-0.12, 0.12].map(x => merge([at(new THREE.TorusGeometry(0.05, 0.012, 10, 24).rotateY(Math.PI / 2), -2.2 + x, AY, AZ), ...Array.from({ length: 9 }, (_, i) => at(new THREE.SphereGeometry(0.011, 10, 8), -2.2 + x, AY + Math.cos(i / 9 * Math.PI * 2) * 0.05, AZ + Math.sin(i / 9 * Math.PI * 2) * 0.05))]))),
    { c: ['bearing', 'axial-load', 'radial-load'], label: 'Ball bearings', mat: steel });
  add('seal', 'ind-mechanical', merge([at(cyl(0.05, 0.05, 'x', 24), -1.95, AY, AZ), at(cyl(0.04, 0.02, 'x', 24), -1.92, AY, AZ)]), { c: ['mechanical-seal'], label: 'Mechanical seal', mat: mat(0x9c7a4c, { metal: 0.6 }) });
  // volute (see-through) and impeller
  add('volute', 'ind-pumps', merge([at(cyl(0.26, 0.16, 'x', 36), -1.75, AY + 0.03, AZ), at(cyl(0.07, 0.25, 'x', 20), -1.5, AY, AZ), at(cyl(0.06, 0.28, 'y', 20), -1.75, AY + 0.35, AZ)]), { c: ['centrifugal-pump', 'pump-curve'], label: 'Centrifugal pump', hero: true, shell: true, mat: mat(0x2f4f8c, { metal: 0.4 }), anchor: V(-1.75, AY + 0.25, AZ + 0.12) });
  const imp = spinner(-1.75, AY, AZ, 'x', 30, [[merge([cyl(0.2, 0.012, 'x', 32), at(cyl(0.2, 0.012, 'x', 32), 0.06, 0, 0), ...Array.from({ length: 6 }, (_, i) => { const g = box(0.06, 0.012, 0.16); g.translate(0.03, 0, 0.1); g.rotateX(i * Math.PI / 3 + 0.3); return g; }), cyl(0.05, 0.1, 'x', 16)]), mat(0xc9a449, { metal: 0.85, rough: 0.3 })]]);
  add('impeller', 'ind-pumps', imp, { c: ['impeller'], label: 'Impeller', anchor: V(-1.75, AY + 0.12, AZ + 0.05) });
  add('suction', 'ind-pumps', pipe([V(-1.38, AY, AZ), V(-0.95, AY, AZ), V(-0.95, AY, AZ - 0.45)], 0.075, 0.12), { c: ['npsh', 'hydraulic-cavitation'], label: 'Suction (NPSH)', mat: grey, also: ['ind-fluid'] });
  add('discharge', 'ind-pumps', merge([pipe([V(-1.75, AY + 0.48, AZ), V(-1.75, 1.35, AZ), V(-1.75, 1.35, AZ - 0.45)], 0.055, 0.1), at(cyl(0.035, 0.03, 'z', 20), -1.68, 1.1, AZ), at(cyl(0.03, 0.006, 'z', 20), -1.68, 1.1, AZ + 0.018)]), { c: ['pump-curve'], label: 'Discharge + gauge', mat: grey });
  add('accel', 'ind-condition', merge([at(cyl(0.015, 0.04, 'y', 12), -2.2, AY + 0.12, AZ), tube([V(-2.2, AY + 0.14, AZ), V(-2.1, AY + 0.4, AZ - 0.1), V(-2.0, 0.9, AZ - 0.3)], 0.004)]), { c: ['vibration', 'condition-monitoring'], label: 'Accelerometer', mat: mat(0x5fd39a) });
  add('monitor', 'ind-condition', at(rbox(0.22, 0.28, 0.1, 0.012), -2.0, 1.05, AZ - 0.35), { c: ['condition-monitoring', 'temperature-trending'], label: 'Online monitor', mat: mat(0x3a3f45) });
  add('zerk', 'ind-reliability', merge([-2.32, -2.08].map(x => at(cyl(0.008, 0.03, 'y', 8), x, AY + 0.11, AZ))), { c: ['grease'], label: 'Grease fittings', mat: STOCK.brass() });

  /* =============== B · conveyor drive + conveyor (belt runs along x) */
  const BX = -0.5, BZ = -0.55, headY = 0.95;
  add('cmotor', 'ind-mechanical', merge([at(cyl(0.14, 0.42, 'z', 28), BX - 0.55, 0.3, BZ - 0.1), at(box(0.3, 0.14, 0.34), BX - 0.55, 0.1, BZ - 0.1)]), { c: ['rpm'], label: '', labelled: false, mat: blue });
  const p1 = spinner(BX - 0.55, 0.3, BZ + 0.18, 'z', 18, [[merge([cyl(0.06, 0.06, 'z', 24), at(new THREE.TorusGeometry(0.06, 0.008, 6, 24), 0, 0, 0.015), at(new THREE.TorusGeometry(0.06, 0.008, 6, 24), 0, 0, -0.015)]), grey]]);
  const p2 = spinner(BX - 0.1, 0.62, BZ + 0.18, 'z', 9, [[merge([cyl(0.12, 0.06, 'z', 32), at(new THREE.TorusGeometry(0.12, 0.008, 6, 32), 0, 0, 0.015), at(new THREE.TorusGeometry(0.12, 0.008, 6, 32), 0, 0, -0.015)]), grey]]);
  add('pulleys', 'ind-mechanical', [[new THREE.BufferGeometry(), grey]], { c: ['pulley'], label: '', labelled: false, noPick: true });
  const pul = add('pulley1', 'ind-mechanical', p1, { c: ['pulley', 'belt-drive'], label: 'Drive pulley' });
  add('pulley2', 'ind-mechanical', p2, { c: ['pulley'], label: 'Driven pulley', labelled: false });
  const belt = (dz) => { const a = V(BX - 0.55, 0.3, BZ + 0.18 + dz), b = V(BX - 0.1, 0.62, BZ + 0.18 + dz); const d = b.clone().sub(a).normalize(), n = V(-d.y, d.x, 0); return merge([cylBetween(a.clone().add(n.clone().multiplyScalar(0.062)), b.clone().add(n.clone().multiplyScalar(0.122)), 0.007, 8), cylBetween(a.clone().sub(n.clone().multiplyScalar(0.062)), b.clone().sub(n.clone().multiplyScalar(0.122)), 0.007, 8)]); };
  add('vbelts', 'ind-mechanical', merge([belt(0.015), belt(-0.015)]), { c: ['belt-drive', 'belt-tension'], label: 'V-belts', mat: STOCK.rubber() });
  add('bguard', 'ind-maint-safety', at(rbox(0.26, 0.62, 0.14, 0.03), BX - 0.32, 0.46, BZ + 0.18), { c: ['machine-guarding'], label: 'Belt guard', mat: guardMat, noShadow: true, labelled: false });
  add('reducer', 'ind-mechanical', merge([at(rbox(0.34, 0.3, 0.28, 0.03), BX - 0.1, 0.62, BZ - 0.08), at(box(0.3, 0.44, 0.24), BX - 0.1, 0.22, BZ - 0.08)]), { c: ['gearbox', 'torque'], label: 'Gear reducer', hero: true, shell: true, mat: mat(0x4a6a8a, { metal: 0.45 }), anchor: V(BX - 0.1, 0.8, BZ + 0.06) });
  const g1 = spinner(BX - 0.1, 0.62, BZ - 0.02, 'z', 9, [[merge([cyl(0.05, 0.04, 'z', 20), ...Array.from({ length: 14 }, (_, i) => at(rotZ(box(0.016, 0.02, 0.04), i / 14 * Math.PI * 2), Math.cos(i / 14 * Math.PI * 2) * 0.055, Math.sin(i / 14 * Math.PI * 2) * 0.055, 0))]), mat(0xc9a449, { metal: 0.85 })]]);
  const g2 = spinner(BX - 0.1 + 0.14, 0.62, BZ - 0.02, 'z', -9 * 14 / 34, [[merge([cyl(0.1, 0.04, 'z', 36), ...Array.from({ length: 34 }, (_, i) => at(rotZ(box(0.016, 0.02, 0.04), i / 34 * Math.PI * 2), Math.cos(i / 34 * Math.PI * 2) * 0.106, Math.sin(i / 34 * Math.PI * 2) * 0.106, 0))]), mat(0xb8903a, { metal: 0.85 })]]);
  g2.position.x = BX + 0.03; g2.scale.setScalar(0.7);
  add('gears', 'ind-mechanical', [[new THREE.BufferGeometry()]], { c: [], labelled: false, noPick: true });
  add('gear1', 'ind-mechanical', g1, { c: ['gear-ratio', 'backlash'], label: 'Gear mesh (ratio)' });
  add('gear2', 'ind-mechanical', g2, { c: ['gear-ratio'], labelled: false });
  add('sight', 'ind-reliability', merge([at(cyl(0.022, 0.012, 'z', 18), BX - 0.18, 0.55, BZ + 0.065)]), { c: ['viscosity', 'lubrication'], label: 'Oil sight glass', mat: mat(0xd9a441, { rough: 0.1, opacity: 0.8 }) });
  add('oilsample', 'ind-condition', merge([at(cyl(0.012, 0.05, 'y', 10), BX - 0.22, 0.09, BZ + 0.06), at(cyl(0.025, 0.08, 'y', 14), BX - 0.22, 0.04, BZ + 0.16)]), { c: ['oil-analysis'], label: 'Oil sample valve', mat: mat(0xd9a441, { opacity: 0.85 }) });
  add('tempsensor', 'ind-condition', at(rbox(0.03, 0.03, 0.02, 0.005), BX + 0.02, 0.72, BZ + 0.07), { c: ['temperature-trending'], label: 'Temperature sensor', mat: mat(0x5fd39a) });
  // chain drive: reducer output sprocket → head pulley sprocket
  const s1c = V(BX + 0.12, 0.62, BZ + 0.12), s2c = V(BX + 0.55, headY, BZ + 0.12);
  const sp1 = spinner(s1c.x, s1c.y, s1c.z, 'z', 4, [[merge([cyl(0.07, 0.015, 'z', 16), ...Array.from({ length: 16 }, (_, i) => at(rotZ(box(0.012, 0.02, 0.015), i / 16 * Math.PI * 2), Math.cos(i / 16 * Math.PI * 2) * 0.076, Math.sin(i / 16 * Math.PI * 2) * 0.076, 0))]), dark]]);
  const sp2 = spinner(s2c.x, s2c.y, s2c.z, 'z', 2.2, [[merge([cyl(0.12, 0.015, 'z', 24), ...Array.from({ length: 28 }, (_, i) => at(rotZ(box(0.012, 0.02, 0.015), i / 28 * Math.PI * 2), Math.cos(i / 28 * Math.PI * 2) * 0.126, Math.sin(i / 28 * Math.PI * 2) * 0.126, 0))]), dark]]);
  add('sprocket1', 'ind-mechanical', sp1, { c: ['sprocket', 'chain-drive'], label: 'Sprockets', labelled: true });
  add('sprocket2', 'ind-mechanical', sp2, { c: ['sprocket'], labelled: false });
  const chainPath = (() => { const d = s2c.clone().sub(s1c).normalize(), n = V(-d.y, d.x, 0); return [s1c.clone().add(n.clone().multiplyScalar(0.08)), s2c.clone().add(n.clone().multiplyScalar(0.13)), s2c.clone().sub(n.clone().multiplyScalar(0.13)), s1c.clone().sub(n.clone().multiplyScalar(0.08))]; })();
  add('chain', 'ind-mechanical', merge([cylBetween(chainPath[0], chainPath[1], 0.008, 6), cylBetween(chainPath[3], chainPath[2], 0.008, 6)]), { c: ['chain-drive'], label: 'Roller chain', mat: mat(0x55595e, { metal: 0.8 }) });
  // conveyor
  const CX0 = s2c.x, CX1 = CX0 + 2.6, CZ = BZ + 0.45, CW = 0.6;
  ctx(merge([at(box(CX1 - CX0 + 0.2, 0.1, 0.05), (CX0 + CX1) / 2, headY - 0.1, CZ - CW / 2 - 0.05), at(box(CX1 - CX0 + 0.2, 0.1, 0.05), (CX0 + CX1) / 2, headY - 0.1, CZ + CW / 2 + 0.05), ...[CX0 + 0.3, (CX0 + CX1) / 2, CX1 - 0.3].flatMap(x => [at(box(0.05, headY - 0.15, 0.05), x, (headY - 0.15) / 2, CZ - CW / 2 - 0.05), at(box(0.05, headY - 0.15, 0.05), x, (headY - 0.15) / 2, CZ + CW / 2 + 0.05)])]), mat(0x5d656e, { metal: 0.6 }), { cast: true });
  const headP = spinner(CX0, headY, CZ, 'z', -2.2, [[cyl(0.12, CW, 'z', 28), mat(0x4b525b, { metal: 0.7 })]]);
  const tailP = spinner(CX1, headY, CZ, 'z', -2.2, [[cyl(0.1, CW, 'z', 28), mat(0x4b525b, { metal: 0.7 })]]);
  add('headpulley', 'ind-conveyors', headP, { c: ['conveyor-belt'], label: 'Head (drive) pulley', labelled: false });
  add('tailpulley', 'ind-maint-safety', tailP, { c: ['pinch-point'], label: 'Tail pulley nip (pinch point)', anchor: V(CX1 + 0.08, headY - 0.02, CZ + CW / 2) });
  add('pillow', 'ind-bearings', merge([CZ - CW / 2 - 0.1, CZ + CW / 2 + 0.1].map(z => merge([at(rbox(0.12, 0.1, 0.08, 0.02), CX0, headY - 0.03, z), at(box(0.2, 0.025, 0.08), CX0, headY - 0.09, z)]))), { c: ['pillow-block', 'bearing'], label: 'Pillow blocks', mat: mat(0x3b4148, { metal: 0.5 }) });
  const beltG = merge([at(box(CX1 - CX0, 0.012, CW - 0.02), (CX0 + CX1) / 2, headY + 0.125, CZ), at(box(CX1 - CX0, 0.012, CW - 0.02), (CX0 + CX1) / 2, headY - 0.125, CZ)]);
  add('belt', 'ind-conveyors', beltG, { c: ['conveyor-belt'], label: 'Conveyor belt', hero: true, mat: mat(0x1c1e21, { rough: 0.9 }), anchor: V((CX0 + CX1) / 2 + 0.4, headY + 0.13, CZ + CW / 2 - 0.05) });
  add('idlers', 'ind-conveyors', merge([...[CX0 + 0.5, CX0 + 1.0, CX0 + 1.5, CX0 + 2.0].map(x => at(cyl(0.04, CW - 0.04, 'z', 16), x, headY + 0.08, CZ)), ...[CX0 + 0.8, CX0 + 1.8].map(x => at(cyl(0.04, CW - 0.04, 'z', 16), x, headY - 0.17, CZ))]), { c: ['idler'], label: 'Idlers', mat: steel });
  add('training', 'ind-conveyors', merge([at(cyl(0.04, CW - 0.04, 'z', 16), CX0 + 2.25, headY + 0.08, CZ), at(box(0.06, 0.03, CW + 0.1), CX0 + 2.25, headY + 0.03, CZ)]), { c: ['belt-tracking'], label: 'Training idler (tracking)', mat: mat(0xd9c36a, { metal: 0.6 }) });
  add('takeup', 'ind-conveyors', merge([CZ - CW / 2 - 0.08, CZ + CW / 2 + 0.08].map(z => merge([at(box(0.35, 0.04, 0.03), CX1 - 0.05, headY, z), at(cyl(0.008, 0.4, 'x', 10), CX1 - 0.1, headY + 0.03, z)]))), { c: ['belt-tension-conveyor'], label: 'Screw take-up', mat: steel });
  add('pullcord', 'ind-conveyors', merge([at(rbox(0.1, 0.12, 0.08, 0.01), CX0 + 0.1, headY + 0.35, CZ + CW / 2 + 0.12), cylBetween(V(CX0 + 0.15, headY + 0.35, CZ + CW / 2 + 0.12), V(CX1, headY + 0.35, CZ + CW / 2 + 0.12), 0.004, 6)]), { c: ['conveyor-pullcord'], label: 'Pull-cord stop', mat: mat(0xd33a2c) });
  const totes = [0, 1, 2].map(i => { const m = new THREE.Mesh(rbox(0.3, 0.2, 0.4, 0.02), mat(0x2f6fd6, { rough: 0.6 })); m.position.set(CX0 + 0.4 + i * 0.85, headY + 0.24, CZ); m.castShadow = true; root.add(m); return m; });
  add('greasegun', 'ind-reliability', merge([at(cyl(0.035, 0.3, 'x', 16), CX0 - 0.05, 0.05, CZ + 0.62), cylBetween(V(CX0 + 0.1, 0.05, CZ + 0.62), V(CX0 + 0.2, 0.12, CZ + 0.62), 0.008), at(rbox(0.12, 0.02, 0.03, 0.006), CX0 - 0.1, 0.1, CZ + 0.62)]), { c: ['lubrication', 'grease'], label: 'Grease gun', mat: mat(0xc0392b, { metal: 0.4 }) });

  /* =============== C · hydraulic power unit + cylinder */
  const HX = 2.55, HZ = -0.9;
  add('reservoir', 'ind-fluid', merge([at(rbox(0.8, 0.5, 0.5, 0.02), HX, 0.3, HZ), at(cyl(0.03, 0.06, 'y', 14), HX + 0.3, 0.58, HZ + 0.15)]), { c: ['reservoir', 'contamination'], label: 'Reservoir', hero: true, shell: true, mat: mat(0x5a6e7e, { metal: 0.4 }), also: ['ind-reliability'], anchor: V(HX - 0.3, 0.35, HZ + 0.25) });
  add('oil', 'ind-fluid', at(box(0.74, 0.3, 0.44), HX, 0.2, HZ), { c: ['reservoir'], labelled: false, noPick: true, mat: mat(0xd9a441, { opacity: 0.35, rough: 0.1 }) });
  add('strainer', 'ind-fluid', merge([at(cyl(0.035, 0.1, 'y', 14), HX - 0.15, 0.12, HZ), at(cyl(0.012, 0.3, 'y', 10), HX - 0.15, 0.3, HZ)]), { c: ['hydraulic-cavitation'], label: 'Suction strainer', mat: mat(0x9aa3ad, { metal: 0.6 }) });
  add('hmotor', 'ind-fluid', merge([at(cyl(0.11, 0.32, 'x', 24), HX + 0.1, 0.67, HZ), at(box(0.2, 0.06, 0.2), HX + 0.1, 0.57, HZ)]), { c: [], label: 'Electric motor', labelled: false, mat: blue });
  add('hpump', 'ind-fluid', merge([at(rbox(0.12, 0.12, 0.12, 0.015), HX - 0.13, 0.67, HZ), at(cyl(0.02, 0.08, 'x', 12), HX - 0.06, 0.67, HZ)]), { c: ['hydraulic-pump', 'hydraulic-flow'], label: 'Gear pump', mat: mat(0x3b4148, { metal: 0.5 }) });
  add('relief', 'ind-fluid', merge([at(rbox(0.06, 0.06, 0.06, 0.01), HX - 0.25, 0.8, HZ + 0.12), at(cyl(0.015, 0.1, 'y', 12), HX - 0.25, 0.88, HZ + 0.12)]), { c: ['relief-valve'], label: 'Relief valve', mat: mat(0xb8903a, { metal: 0.7 }) });
  add('hfilter', 'ind-fluid', at(cyl(0.045, 0.2, 'y', 18), HX - 0.35, 0.72, HZ - 0.1), { c: ['hydraulic-filter', 'contamination'], label: 'Pressure filter', mat: mat(0x3a3f45) });
  add('dcv', 'ind-fluid', merge([at(rbox(0.2, 0.07, 0.07, 0.008), HX - 0.05, 0.84, HZ + 0.2), at(cyl(0.028, 0.08, 'x', 16), HX - 0.19, 0.84, HZ + 0.2), at(cyl(0.028, 0.08, 'x', 16), HX + 0.09, 0.84, HZ + 0.2)]), { c: ['directional-valve'], label: '4/3 directional valve', mat: mat(0x2f6fd6, { metal: 0.4 }) });
  add('fcv', 'ind-fluid', merge([at(rbox(0.05, 0.05, 0.05, 0.008), HX + 0.2, 0.84, HZ + 0.2), at(cyl(0.012, 0.05, 'y', 10), HX + 0.2, 0.89, HZ + 0.2)]), { c: ['flow-control-valve'], label: 'Flow control', mat: mat(0xb8903a, { metal: 0.7 }) });
  add('hcheck', 'ind-fluid', at(cyl(0.022, 0.08, 'x', 14), HX - 0.02, 0.76, HZ + 0.12), { c: ['hydraulic-check-valve'], label: 'Check valve', mat: mat(0xb8903a, { metal: 0.7 }) });
  add('hgauge', 'ind-fluid', merge([at(cyl(0.04, 0.02, 'z', 20), HX - 0.05, 0.96, HZ + 0.22), at(cyl(0.035, 0.005, 'z', 20), HX - 0.05, 0.96, HZ + 0.233)]), { c: ['hydraulic-pressure', 'pascal-law'], label: 'Pressure gauge', mat: mat(0xdadcd8, { metal: 0.6 }) });
  // cylinder on a frame, extending toward +z (down onto a press plate)
  const CYx = HX + 0.1, CYz = 0.35, CYtop = 1.55;
  ctx(merge([at(box(0.06, CYtop + 0.1, 0.06), CYx - 0.3, (CYtop + 0.1) / 2, CYz), at(box(0.06, CYtop + 0.1, 0.06), CYx + 0.3, (CYtop + 0.1) / 2, CYz), at(box(0.66, 0.08, 0.2), CYx, CYtop + 0.1, CYz), at(box(0.5, 0.05, 0.3), CYx, 0.3, CYz)]), mat(0x5d656e, { metal: 0.6 }), { cast: true });
  add('hcyl', 'ind-fluid', merge([at(cyl(0.065, 0.5, 'y', 24), CYx, CYtop - 0.2, CYz), at(cyl(0.075, 0.03, 'y', 24), CYx, CYtop - 0.45, CYz), at(cyl(0.075, 0.03, 'y', 24), CYx, CYtop + 0.05, CYz)]), { c: ['cylinder', 'cylinder-area', 'pascal-law'], label: 'Hydraulic cylinder', hero: true, mat: mat(0xc0392b, { metal: 0.3 }), anchor: V(CYx + 0.07, CYtop - 0.2, CYz + 0.05) });
  const rod = new THREE.Group(); rod.position.set(CYx, CYtop - 0.47, CYz); rod.add(new THREE.Mesh(merge([at(cyl(0.025, 0.4, 'y', 16), 0, -0.2, 0), at(box(0.2, 0.03, 0.14), 0, -0.4, 0)]), mat(0xdfe4e8, { metal: 1, rough: 0.12 })));
  root.add(rod);
  add('hhoses', 'ind-fluid', merge([tube([V(HX - 0.19, 0.84, HZ + 0.24), V(HX - 0.25, 1.1, HZ + 0.6), V(CYx - 0.15, CYtop + 0.2, CYz - 0.2), V(CYx, CYtop + 0.06, CYz - 0.05)], 0.012), tube([V(HX + 0.09, 0.84, HZ + 0.24), V(HX + 0.2, 1.0, HZ + 0.7), V(CYx + 0.1, CYtop - 0.3, CYz - 0.2), V(CYx + 0.06, CYtop - 0.44, CYz)], 0.012)]), { c: ['hydraulic-hose'], label: 'Hydraulic hoses', mat: STOCK.rubber() });

  /* =============== D · compressed air (front row) */
  const DZ = 1.45;
  add('receiver', 'ind-air', merge([at(cyl(0.2, 0.9, 'x', 28), -2.4, 0.3, DZ), at(new THREE.SphereGeometry(0.2, 20, 12).scale(0.4, 1, 1), -2.85, 0.3, DZ), at(new THREE.SphereGeometry(0.2, 20, 12).scale(0.4, 1, 1), -1.95, 0.3, DZ)]), { c: ['air-receiver', 'pneumatic-system'], label: 'Air receiver', mat: mat(0x9aa3ad, { metal: 0.6 }) });
  add('compressor', 'ind-air', merge([at(rbox(0.26, 0.24, 0.22, 0.02), -2.6, 0.65, DZ), at(cyl(0.12, 0.05, 'z', 24), -2.6, 0.7, DZ + 0.14), at(cyl(0.1, 0.24, 'x', 20), -2.22, 0.62, DZ)]), { c: ['air-compressor'], label: 'Compressor', hero: true, mat: mat(0xc0392b, { metal: 0.3 }) });
  add('dryer', 'ind-air', at(rbox(0.3, 0.55, 0.3, 0.02), -1.5, 0.28, DZ), { c: ['air-dryer'], label: 'Refrigerated dryer', mat: mat(0x3a6ea8, { metal: 0.3 }) });
  const airPts = [V(-2.0, 0.45, DZ), V(-2.0, 0.7, DZ), V(-1.5, 0.7, DZ), V(-1.5, 0.95, DZ), V(-0.55, 0.95, DZ)];
  add('airline', 'ind-air', pipe(airPts, 0.014, 0.06), { c: [], labelled: false, mat: mat(0x2f6fd6, { metal: 0.5 }) });
  add('frl', 'ind-air', merge([at(cyl(0.035, 0.14, 'y', 18), -0.55, 0.85, DZ), at(cyl(0.04, 0.04, 'y', 18), -0.45, 0.97, DZ), at(cyl(0.03, 0.03, 'z', 18), -0.45, 1.02, DZ + 0.04), at(cyl(0.035, 0.14, 'y', 18), -0.35, 0.85, DZ, 0.035)]), { c: ['frl', 'pneumatic-regulator'], label: 'FRL (filter · regulator · lubricator)', mat: mat(0xdadcd8, { metal: 0.4, opacity: 0.9 }) });
  add('solvalve', 'ind-air', merge([at(rbox(0.16, 0.05, 0.05, 0.006), 0.0, 0.95, DZ), at(rbox(0.04, 0.05, 0.05, 0.006), 0.1, 0.95, DZ)]), { c: ['solenoid-valve'], label: '5/2 solenoid valve', mat: mat(0x3b4148) });
  add('qex', 'ind-air', at(cyl(0.02, 0.04, 'x', 12), 0.62, 0.9, DZ), { c: ['quick-exhaust'], label: 'Quick exhaust', mat: STOCK.brass() });
  add('acyl', 'ind-air', merge([at(cyl(0.035, 0.45, 'x', 20), 0.85, 0.9, DZ), at(rbox(0.05, 0.08, 0.08, 0.008), 0.62, 0.9, DZ), at(rbox(0.05, 0.08, 0.08, 0.008), 1.08, 0.9, DZ)]), { c: ['air-cylinder'], label: 'Air cylinder', mat: mat(0xcfd5dc, { metal: 0.9, rough: 0.25 }) });
  add('pfc', 'ind-air', merge([0.64, 1.06].map(x => at(cyl(0.012, 0.04, 'y', 10), x, 0.96, DZ))), { c: ['pneumatic-flow-control'], label: 'Flow controls', mat: STOCK.brass() });
  const arod = new THREE.Group(); arod.position.set(1.1, 0.9, DZ); arod.add(new THREE.Mesh(merge([at(cyl(0.01, 0.3, 'x', 12), 0.15, 0, 0), at(rbox(0.03, 0.08, 0.08, 0.008), 0.3, 0, 0)]), mat(0xdfe4e8, { metal: 1, rough: 0.12 }))); root.add(arod);
  add('tubing', 'ind-air', merge([tube([V(0.08, 0.98, DZ), V(0.3, 1.1, DZ), V(0.64, 0.98, DZ)], 0.006), tube([V(0.04, 0.98, DZ), V(0.5, 1.2, DZ), V(1.06, 0.98, DZ)], 0.006), tube([V(-0.3, 0.9, DZ), V(-0.08, 0.95, DZ)], 0.006)]), { c: [], labelled: false, mat: mat(0x2f6fd6, { rough: 0.5 }) });
  add('leak', 'ind-air', merge([at(cyl(0.018, 0.03, 'x', 12), -1.0, 0.95, DZ), at(rbox(0.06, 0.16, 0.05, 0.01), -1.0, 1.2, DZ + 0.25), cylBetween(V(-1.0, 1.12, DZ + 0.25), V(-1.0, 0.99, DZ + 0.05), 0.008)]), { c: ['air-leak', 'ultrasound'], label: 'Air leak + ultrasonic detector', mat: mat(0xf0c43a), also: ['ind-condition'] });

  /* =============== flows */
  flow('ind-pumps', [V(-0.95, AY, AZ - 0.45), V(-0.95, AY, AZ), V(-1.4, AY, AZ), V(-1.75, AY + 0.2, AZ + 0.15), V(-1.75, AY + 0.5, AZ), V(-1.75, 1.35, AZ), V(-1.75, 1.35, AZ - 0.45)], 0x4f8cff, { r: 0.028, speed: 0.4, density: 7 });
  flow('ind-fluid', [V(HX - 0.15, 0.12, HZ), V(HX - 0.15, 0.6, HZ), V(HX - 0.13, 0.67, HZ), V(HX - 0.35, 0.72, HZ - 0.1), V(HX - 0.05, 0.84, HZ + 0.2), V(HX - 0.19, 0.84, HZ + 0.24), V(HX - 0.25, 1.1, HZ + 0.6), V(CYx - 0.15, CYtop + 0.2, CYz - 0.2), V(CYx, CYtop + 0.06, CYz - 0.05)], 0xe0503c, { r: 0.012, speed: 0.25, density: 10 });
  flow('ind-fluid', [V(CYx + 0.06, CYtop - 0.44, CYz), V(CYx + 0.1, CYtop - 0.3, CYz - 0.2), V(HX + 0.2, 1.0, HZ + 0.7), V(HX + 0.09, 0.84, HZ + 0.24), V(HX + 0.2, 0.6, HZ + 0.1), V(HX + 0.25, 0.3, HZ)], 0x3d8bff, { r: 0.011, speed: 0.25, density: 10 });
  flow('ind-air', [V(-2.22, 0.62, DZ), V(-2.0, 0.45, DZ), ...airPts.slice(1), V(-0.35, 0.9, DZ), V(-0.05, 0.95, DZ), V(0.3, 1.1, DZ), V(0.64, 0.95, DZ)], 0xbfe6ff, { r: 0.012, speed: 0.35, density: 8 });
  flow('ind-air', [V(-1.0, 0.95, DZ), V(-1.0, 1.05, DZ + 0.06), V(-1.0, 1.15, DZ + 0.14)], 0xeaf6ff, { r: 0.008, speed: 0.4, density: 30, idle: false });

  /* =============== motion */
  const tick = (dt, t, cx) => {
    if (cx.reduced) return;
    for (const g of spin) { const r = g.userData.rate * dt; if (g.userData.axis === 'x') g.rotation.x += r; else if (g.userData.axis === 'z') g.rotation.z -= r; else g.rotation.y += r; }
    totes.forEach(m => { m.position.x += dt * 0.25; if (m.position.x > CX1 - 0.2) m.position.x = CX0 + 0.25; });
    const e = (Math.sin(t * 0.9) + 1) / 2; rod.position.y = CYtop - 0.47 - e * 0.6;
    const a = (Math.sin(t * 1.6) + 1) / 2; arod.position.x = 1.1 + a * 0.25;
  };
  return { root, comps: A.comps.filter(c => !(c.obj.isMesh && c.obj.geometry && !c.obj.geometry.attributes.position)), flows: A.flows, tick };
}
