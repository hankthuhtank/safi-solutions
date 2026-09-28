/* Welding model: a welding bay plus a sectioned joint display.
   Station (real scale): multiprocess power source with wire feeder, MIG gun on a practice coupon,
   work clamp, shielding-gas cylinder with flowmeter, stick + TIG torches, rod oven, oxy-fuel cart,
   plasma cutter, fume-extraction arm, curtain, extinguisher, a tank entry for confined-space work.
   Display (×6 scale, like the sectioned teaching models in weld-inspection classrooms): a fillet-welded
   T-joint and a single-V groove butt joint on backing, cut to show passes, fusion and the HAZ.
   "Defects" mode puts the classic discontinuities where an inspector would find them.
   Hose colours follow the industry rule: oxygen green, fuel gas red. x → right, y up, z → viewer. */
export const meta = {
  id: 'welding',
  name: 'Welding bay + sectioned joints',
  plate: 'GMAW · SMAW · GTAW · OXY-FUEL · PLASMA · JOINTS ×6',
  systems: {
    'weld-process': { name: 'Processes', color: 0xff895f },
    'weld-arc': { name: 'Arc + machine settings', color: 0xf0c43a },
    'weld-joints': { name: 'Joints + fit-up', color: 0x7cc6ff },
    'weld-symbols': { name: 'Symbols + drawings', color: 0x9fd8ff },
    'weld-metal': { name: 'Metallurgy + heat', color: 0xff5a4a },
    'weld-defects': { name: 'Defects + inspection', color: 0xc38bff },
    'weld-safety': { name: 'Safety', color: 0x5fd39a }
  },
  modes: { sound: 'Sound welds', defects: 'Show defects' },
  defaultMode: 'sound',
  views: { overview: { dir: [0.25, 0.45, 1], pad: 1.0 }, joints: { dir: [0.2, 0.3, 1], box: [[0.7, 0.8, -0.5], [2.6, 1.7, 0.62]] } },
  focus: {
    'weld-joints': { dir: [0.2, 0.3, 1], box: [[0.7, 0.8, -0.5], [2.6, 1.7, 0.62]] },
    'weld-metal': { dir: [0.2, 0.3, 1], box: [[0.7, 0.8, -0.5], [2.6, 1.7, 0.62]] },
    'weld-defects': { dir: [0.2, 0.3, 1] },
    'weld-symbols': { dir: [0.05, 0.1, 1] }
  },
  stage: { shadow: 3.6, grid: 0xff9a74, fade: 9, minR: 0.25, partR: 0.12 }
};

export function build(k) {
  const { THREE, V, rbox, box, cyl, cylBetween, tube, merge, at, rotY, rotZ, rotX, lathe, extrude, mat, STOCK, CONTEXT } = k;
  const A = k.assembly(meta);
  const { add, ctx, flow, root } = A;
  const SOUND = ['sound'], DEF = ['defects'];
  const plate = mat(0x7f868e, { metal: 0.85, rough: 0.42 }), weld = mat(0xa7a29a, { metal: 0.8, rough: 0.35 });
  const etch = mat(0x5d6168, { metal: 0.6, rough: 0.6 });

  ctx(at(box(5.2, 0.02, 3.2), 0, -0.01, 0.2), CONTEXT.slab());
  ctx(at(box(5.2, 2.5, 0.04), 0, 1.25, -1.2), CONTEXT.wall());

  /* ---------------- welding table + practice coupon */
  const TY = 0.85;
  ctx(merge([at(box(1.3, 0.03, 0.85), -0.25, TY, 0.1), ...[[-0.85, -0.3], [0.35, -0.3], [-0.85, 0.5], [0.35, 0.5]].map(([x, z]) => at(box(0.05, TY, 0.05), x, TY / 2, z))]), mat(0x55595e, { metal: 0.8 }), { cast: true });
  add('coupon', 'weld-metal', merge([at(box(0.3, 0.012, 0.12), -0.25, TY + 0.021, 0.12), at(box(0.3, 0.012, 0.12), -0.25, TY + 0.021, 0.24)]), { c: ['base-metal', 'weldability'], label: 'Practice coupon (base metal)', mat: plate });
  add('bead', 'weld-arc', merge([at(cyl(0.008, 0.2, 'x', 10), -0.3, TY + 0.03, 0.18)]), { c: ['travel-speed', 'heat-input'], label: 'Bead (travel direction →)', mat: weld, also: ['weld-metal'] });
  add('slagcap', 'weld-defects', at(cyl(0.009, 0.08, 'x', 10), -0.36, TY + 0.033, 0.18), { c: ['slag'], label: 'Slag coating', noFrame: true, mat: mat(0x3b3024, { rough: 0.9 }) });
  const arc = new THREE.Mesh(new THREE.SphereGeometry(0.018, 14, 10), new THREE.MeshBasicMaterial({ color: 0xcfe8ff })); arc.position.set(-0.19, TY + 0.035, 0.18); root.add(arc);
  const arcLight = new THREE.PointLight(0x9fd0ff, 1.2, 1.2); arcLight.position.copy(arc.position).add(V(0, 0.04, 0)); root.add(arcLight);
  add('arczone', 'weld-arc', merge([at(cyl(0.004, 0.02, 'y', 8), -0.19, TY + 0.045, 0.18)]), { c: ['transfer-mode', 'arc-length', 'heat-input'], label: 'Arc + transfer', mat: mat(0xffe08a, { emissive: 0xffc04a, ei: 1 }), also: ['weld-metal'] });
  // MIG gun resting on the coupon
  const gunTip = V(-0.19, TY + 0.06, 0.18), gunBack = V(0.05, TY + 0.25, 0.3);
  add('gun', 'weld-process', merge([cylBetween(gunTip.clone().lerp(gunBack, 0.25), gunBack, 0.018, 14), cylBetween(gunTip.clone().lerp(gunBack, 0.1), gunTip.clone().lerp(gunBack, 0.28), 0.01, 10)]), { c: ['gmaw'], label: 'MIG gun (GMAW)', hero: true, mat: mat(0x2b2f35, { rough: 0.6 }) });
  add('nozzle', 'weld-arc', merge([cylBetween(gunTip.clone().lerp(gunBack, 0.02), gunTip.clone().lerp(gunBack, 0.1), 0.012, 14, 0.009)]), { c: ['ctwd'], label: 'Nozzle + contact tip (CTWD)', mat: STOCK.copper() });
  // stick + TIG torches, TIG filler rods
  add('stinger', 'weld-process', merge([at(cyl(0.02, 0.18, 'x', 12), -0.7, TY + 0.05, -0.1), cylBetween(V(-0.6, TY + 0.05, -0.1), V(-0.45, TY + 0.08, -0.05), 0.003, 8)]), { c: ['smaw'], label: 'Stick electrode holder (SMAW)', mat: mat(0x1f2226) });
  add('tig', 'weld-process', merge([at(cyl(0.012, 0.16, 'x', 12), -0.72, TY + 0.03, 0.35), at(cyl(0.014, 0.04, 'x', 12, 0.008), -0.62, TY + 0.03, 0.35), at(cyl(0.0016, 0.03, 'x', 6), -0.585, TY + 0.03, 0.35)]), { c: ['gtaw', 'arc-length'], label: 'TIG torch (GTAW)', mat: mat(0x2b2f35), also: ['weld-arc'] });
  add('fillerrods', 'weld-metal', merge(Array.from({ length: 5 }, (_, i) => at(cyl(0.0012, 0.5, 'x', 6), -0.45, TY + 0.02, 0.44 + i * 0.006))), { c: ['filler-metal'], label: 'Filler rods', mat: STOCK.copper() });
  add('clamp', 'weld-arc', merge([at(rbox(0.05, 0.08, 0.03, 0.006), 0.36, TY - 0.02, 0.35), at(cyl(0.01, 0.06, 'y', 8), 0.36, TY + 0.03, 0.35)]), { c: ['welding-leads', 'polarity'], label: 'Work clamp', mat: STOCK.copper() });
  add('grinder', 'weld-joints', merge([at(cyl(0.028, 0.2, 'x', 14), 0.12, TY + 0.05, -0.15), at(cyl(0.05, 0.012, 'z', 20), 0.24, TY + 0.05, -0.15)]), { c: ['interpass-cleaning'], label: 'Grinder + wire wheel', mat: mat(0x2e6fb0, { rough: 0.5 }), also: ['weld-defects'] });

  /* ---------------- power source + wire feeder + gas */
  const PX = -1.55, PZ = -0.25;
  ctx(merge([at(box(0.5, 0.04, 0.8), PX, 0.1, PZ), ...[[-0.2, -0.35], [0.2, -0.35], [-0.2, 0.35], [0.2, 0.35]].map(([x, z]) => at(cyl(0.05, 0.03, 'x', 12), PX + x, 0.05, PZ + z))]), mat(0x3a3f45, { metal: 0.5 }), { cast: true });
  add('machine', 'weld-arc', merge([at(rbox(0.36, 0.5, 0.66, 0.02), PX, 0.37, PZ)]), { c: ['amperage', 'voltage-welding'], label: 'Power source', hero: true, mat: mat(0x1f4f8c, { metal: 0.3 }), anchor: V(PX, 0.5, PZ + 0.33) });
  add('panel', 'weld-arc', merge([at(box(0.28, 0.2, 0.01), PX, 0.48, PZ + 0.335), at(cyl(0.025, 0.02, 'z', 16), PX - 0.07, 0.5, PZ + 0.345), at(cyl(0.025, 0.02, 'z', 16), PX + 0.07, 0.5, PZ + 0.345), at(box(0.1, 0.035, 0.005), PX, 0.56, PZ + 0.342)]), { c: ['amperage', 'voltage-welding'], label: 'Amperage + voltage controls', mat: mat(0x1b1f24) });
  add('terminals', 'weld-arc', merge([at(cyl(0.02, 0.03, 'z', 14), PX - 0.08, 0.22, PZ + 0.345), at(cyl(0.02, 0.03, 'z', 14), PX + 0.08, 0.22, PZ + 0.345)]), { c: ['polarity'], label: 'Output terminals (+/−)', mat: mat(0xc9302c) });
  add('rating', 'weld-arc', at(box(0.003, 0.12, 0.18), PX + 0.182, 0.4, PZ), { c: ['duty-cycle'], label: 'Rating plate (duty cycle)', mat: mat(0xdad7cc, { metal: 0.8 }) });
  add('feeder', 'weld-arc', merge([at(rbox(0.3, 0.3, 0.5, 0.02), PX, 0.78, PZ)]), { c: ['wire-feed-speed'], label: 'Wire feeder', shell: true, mat: mat(0x1f4f8c, { metal: 0.3 }) });
  add('spool', 'weld-process', merge([at(cyl(0.15, 0.1, 'x', 32), PX, 0.8, PZ - 0.08), at(cyl(0.16, 0.008, 'x', 32), PX - 0.052, 0.8, PZ - 0.08), at(cyl(0.16, 0.008, 'x', 32), PX + 0.052, 0.8, PZ - 0.08)]), { c: ['fcaw', 'filler-metal', 'electrode-classification'], label: 'Wire spool', mat: STOCK.copper() });
  add('driverolls', 'weld-arc', merge([at(cyl(0.025, 0.02, 'x', 16), PX + 0.05, 0.84, PZ + 0.15), at(cyl(0.025, 0.02, 'x', 16), PX + 0.05, 0.79, PZ + 0.15)]), { c: ['wire-feed-speed'], label: 'Drive rolls', mat: mat(0xc9a449, { metal: 0.8 }) });
  add('leads', 'weld-arc', merge([tube([V(PX, 0.8, PZ + 0.26), V(PX + 0.4, 0.6, PZ + 0.6), V(-0.4, 0.9, 0.55), gunBack], 0.012), tube([V(PX + 0.08, 0.22, PZ + 0.36), V(PX + 0.4, 0.1, PZ + 0.7), V(0.2, 0.25, 0.6), V(0.36, TY - 0.02, 0.35)], 0.012)]), { c: ['welding-leads'], label: 'Gun cable + work lead', mat: STOCK.rubber() });
  const GX = PX - 0.05, GZ = PZ - 0.55;
  add('gascyl', 'weld-safety', merge([at(lathe([[0, 0], [0.11, 0], [0.115, 0.03], [0.115, 1.2], [0.07, 1.3], [0.03, 1.32], [0, 1.32]], 32), GX, 0.02, GZ)]), { c: ['gas-cylinders'], label: 'Gas cylinder (chained)', mat: mat(0x6f7a73, { metal: 0.4 }) });
  add('chain', 'weld-safety', merge([0.75, 1.05].map(y => at(new THREE.TorusGeometry(0.12, 0.006, 6, 30).rotateX(Math.PI / 2), GX, y, GZ))), { c: ['gas-cylinders'], labelled: false, mat: mat(0x9aa3ad, { metal: 0.9 }) });
  add('flowmeter', 'weld-arc', merge([at(rbox(0.05, 0.05, 0.05, 0.008), GX, 1.37, GZ), at(cyl(0.012, 0.12, 'y', 12), GX + 0.05, 1.42, GZ), tube([V(GX, 1.36, GZ + 0.03), V(GX + 0.1, 1.1, GZ + 0.25), V(PX, 0.9, PZ - 0.2)], 0.005)]), { c: ['shielding-gas'], label: 'Shielding gas + flowmeter', mat: STOCK.brass() });
  add('rodoven', 'weld-metal', merge([at(cyl(0.08, 0.4, 'y', 20), -0.6, TY + 0.2, -0.3), at(cyl(0.085, 0.03, 'y', 20), -0.6, TY + 0.41, -0.3)]), { c: ['hydrogen-cracking', 'electrode-classification'], label: 'Rod oven (low-hydrogen E7018)', mat: mat(0x6c747c, { metal: 0.5 }), also: ['weld-defects', 'weld-arc'] });

  /* ---------------- oxy-fuel cart + plasma cutter */
  const OX = -2.2, OZ = 0.7;
  ctx(merge([at(box(0.5, 0.04, 0.3), OX, 0.08, OZ), at(box(0.04, 1.1, 0.04), OX - 0.22, 0.6, OZ - 0.12)]), mat(0x3a3f45, { metal: 0.5 }), { cast: true });
  add('oxy', 'weld-process', merge([at(lathe([[0, 0], [0.1, 0], [0.105, 0.03], [0.105, 1.15], [0.06, 1.25], [0, 1.27]], 28), OX - 0.11, 0.1, OZ), at(lathe([[0, 0], [0.13, 0], [0.135, 0.03], [0.135, 0.95], [0.08, 1.03], [0, 1.05]], 28), OX + 0.13, 0.1, OZ)]), { c: ['oxyfuel', 'gas-cylinders', 'preheat'], label: 'Oxy-fuel cylinders', mat: mat(0x2e7d4f, { metal: 0.3 }), also: ['weld-safety', 'weld-metal'] });
  add('acet', 'weld-process', at(cyl(0.137, 0.9, 'y', 28), OX + 0.13, 0.55, OZ), { c: ['oxyfuel'], labelled: false, mat: mat(0x7a2a2a, { metal: 0.3 }) });
  add('torchhose', 'weld-process', merge([tube([V(OX - 0.11, 1.4, OZ), V(OX - 0.2, 1.0, OZ + 0.3), V(OX + 0.4, 0.9, OZ + 0.5)], 0.007), at(cyl(0.012, 0.3, 'x', 10), OX + 0.5, 0.9, OZ + 0.5)]), { c: ['oxyfuel'], labelled: false, mat: mat(0x2e8f4f, { rough: 0.6 }) });
  add('fuelhose', 'weld-process', tube([V(OX + 0.13, 1.2, OZ), V(OX + 0.1, 0.9, OZ + 0.35), V(OX + 0.36, 0.89, OZ + 0.51)], 0.007), { c: ['oxyfuel'], labelled: false, mat: mat(0xc9302c, { rough: 0.6 }) });
  add('plasma', 'weld-process', merge([at(rbox(0.22, 0.28, 0.4, 0.02), -1.2, 0.14, 0.75), tube([V(-1.2, 0.2, 0.96), V(-0.9, 0.3, 1.0), V(-0.8, TY + 0.03, 0.45)], 0.008), at(cyl(0.015, 0.12, 'x', 10), -0.75, TY + 0.03, 0.45)]), { c: ['plasma-cutting'], label: 'Plasma cutter', mat: mat(0xc9302c, { metal: 0.3 }) });

  /* ---------------- safety */
  add('fumearm', 'weld-safety', merge([cylBetween(V(0.7, 2.3, -1.15), V(0.7, 1.9, -0.9), 0.06, 16), cylBetween(V(0.7, 1.9, -0.9), V(0.0, 1.45, -0.2), 0.06, 16), at(cyl(0.15, 0.18, 'y', 24, 0.06, true), -0.08, 1.33, -0.12)]), { c: ['fume-control'], label: 'Fume extraction arm', mat: mat(0xf2c21b, { rough: 0.5, side: THREE.DoubleSide }) });
  add('helmet', 'weld-safety', merge([at(new THREE.SphereGeometry(0.13, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.6).scale(0.9, 1.1, 1), 0.2, TY + 0.13, 0.35), at(box(0.1, 0.06, 0.01), 0.2, TY + 0.14, 0.47)]), { c: ['welding-ppe', 'helmet-shade'], label: 'Auto-darkening helmet', mat: mat(0x202328, { rough: 0.5, side: THREE.DoubleSide }) });
  add('gloves', 'weld-safety', merge([at(rbox(0.1, 0.03, 0.2, 0.015), 0.25, TY + 0.03, 0.02), at(rbox(0.1, 0.03, 0.2, 0.015), 0.1, TY + 0.03, -0.02)]), { c: ['welding-ppe'], labelled: false, mat: mat(0xb88a52, { rough: 0.95 }) });
  add('curtain', 'weld-safety', at(box(0.02, 1.8, 1.6), 0.85, 0.95, -0.2), { c: ['hot-work'], label: 'Welding curtain', mat: mat(0xd35a2a, { rough: 0.7, opacity: 0.18, side: THREE.DoubleSide }), noShadow: true });
  add('extinguisher', 'weld-safety', merge([at(cyl(0.07, 0.45, 'y', 20), -2.35, 0.25, -1.05), at(cyl(0.02, 0.08, 'y', 10), -2.35, 0.51, -1.05)]), { c: ['hot-work'], label: 'Fire extinguisher', mat: mat(0xc9302c, { metal: 0.3 }) });
  add('tank', 'weld-safety', merge([at(cyl(0.32, 0.9, 'z', 32), 3.05, 0.34, -0.55), at(cyl(0.15, 0.06, 'y', 24, 0.15, true), 3.05, 0.68, -0.55), tube([V(3.6, 0.15, -0.9), V(3.4, 0.9, -0.7), V(3.05, 1.05, -0.55), V(3.05, 0.72, -0.55)], 0.04)]), { c: ['confined-space-welding'], label: 'Tank entry (confined space)', mat: mat(0x6c747c, { metal: 0.6, rough: 0.5 }) });

  /* ---------------- welding symbol on a drawing board */
  const SB = V(-1.0, 1.55, -1.17);
  ctx(at(box(1.1, 0.7, 0.02), SB.x, SB.y, SB.z), mat(0xe9ecef, { rough: 0.9 }), { edges: false });
  const ink = mat(0x1f4f8c, { rough: 0.6 });
  add('refline', 'weld-symbols', at(box(0.5, 0.012, 0.01), SB.x + 0.05, SB.y, SB.z + 0.015), { c: ['symbol-reference-line', 'welding-symbols'], label: 'Reference line', mat: ink });
  add('arrow', 'weld-symbols', merge([cylBetween(V(SB.x - 0.2, SB.y, SB.z + 0.015), V(SB.x - 0.38, SB.y - 0.2, SB.z + 0.015), 0.006, 6), at(rotZ(cyl(0.02, 0.05, 'y', 3, 0.001), Math.PI - 0.84), SB.x - 0.39, SB.y - 0.21, SB.z + 0.015)]), { c: ['symbol-arrow-side'], label: 'Arrow (arrow side)', mat: ink });
  add('filletsym', 'weld-symbols', extrude([[0, 0], [0, 0.08], [0.08, 0]], 0.01).translate(SB.x - 0.02, SB.y - 0.086, SB.z + 0.012), { c: ['welding-symbols'], label: 'Fillet symbol (below line = arrow side)', mat: ink });
  add('sizes', 'weld-symbols', merge([at(box(0.035, 0.05, 0.008), SB.x - 0.09, SB.y - 0.05, SB.z + 0.014), at(box(0.07, 0.05, 0.008), SB.x + 0.14, SB.y - 0.05, SB.z + 0.014)]), { c: ['symbol-size-length'], label: 'Size + length', mat: ink });
  add('contour', 'weld-symbols', at(box(0.1, 0.008, 0.008), SB.x + 0.02, SB.y - 0.11, SB.z + 0.014), { c: ['symbol-contour'], label: 'Contour (flush)', mat: ink });
  add('allaround', 'weld-symbols', at(new THREE.TorusGeometry(0.025, 0.005, 8, 24), SB.x - 0.2, SB.y, SB.z + 0.015), { c: ['all-around-symbol'], label: 'Weld-all-around circle', mat: ink });

  /* ---------------- sectioned joint display (×6) */
  const plinth = ctx(merge([at(box(1.5, 0.8, 0.9), 1.65, 0.4, 0.05)]), mat(0x2a2e33, { rough: 0.8 }), { cast: true, edges: false });
  const dispFrom = A.comps.length;
  const DY = 0.8, L = 0.6;
  // T-joint fillet (left), extruded along z
  const TXc = 1.3;
  add('tflange', 'weld-metal', at(box(0.5, 0.06, L), TXc, DY + 0.03, 0.05), { c: ['base-metal'], label: 'Base metal', mat: plate });
  add('tweb', 'weld-joints', at(box(0.06, 0.34, L), TXc, DY + 0.06 + 0.17, 0.05), { c: ['base-metal'], label: '', labelled: false, mat: plate });
  const fillet = (s) => extrude([[0.03 * s, 0.06], [0.03 * s + 0.12 * s, 0.06], [0.03 * s, 0.18]].map(([x, y]) => [x, y]), L).translate(TXc, DY, -L / 2 + 0.05);
  add('fillet', 'weld-joints', merge([fillet(1), fillet(-1)]), { c: ['fillet-weld', 'fillet-gauge'], label: 'Fillet weld (leg · throat)', hero: true, mat: weld, also: ['weld-defects'], anchor: V(TXc + 0.1, DY + 0.1, 0.35) });
  add('thaz', 'weld-metal', merge([-1, 1].map(s => extrude([[0.03 * s, 0.045], [0.03 * s + 0.16 * s, 0.045], [0.03 * s, 0.22], [0.02 * s, 0.22], [0.02 * s, 0.05]].map(([x, y]) => [x, y]), 0.004).translate(TXc, DY, 0.05 + L / 2 + 0.001))), { c: ['haz'], label: 'Heat-affected zone', mat: mat(0x2f6fd6, { opacity: 0.55 }), noShadow: true });
  add('workangle', 'weld-joints', merge([cylBetween(V(TXc + 0.35, DY + 0.42, 0.05), V(TXc + 0.1, DY + 0.16, 0.05), 0.008, 8), at(cyl(0.02, 0.06, 'y', 12), TXc + 0.38, DY + 0.46, 0.05)]), { c: ['work-angle'], label: 'Work angle 45°', mat: mat(0x7cc6ff, { opacity: 0.7 }) });
  // single-V groove butt joint on backing (right)
  const BXc = 2.0, t = 0.12, gap = 0.02, land = 0.02, bev = Math.tan(30 * Math.PI / 180) * (t - land);
  const plateL = [[-0.3, 0], [-gap / 2, 0], [-gap / 2, land], [-gap / 2 - bev, t], [-0.3, t]], plateR = plateL.map(([x, y]) => [-x, y]);
  const distort = 0.03;
  add('bplates', 'weld-metal', merge([extrude(plateL, L).rotateZ(distort).translate(BXc, DY + 0.04, -L / 2 + 0.05), extrude(plateR, L).rotateZ(-distort).translate(BXc, DY + 0.04, -L / 2 + 0.05)]), { c: ['base-metal', 'distortion', 'residual-stress'], label: 'Plates (angular distortion)', mat: plate, also: ['weld-joints'] });
  add('bevels', 'weld-joints', merge([-1, 1].map(s => extrude([[s * gap / 2, land], [s * (gap / 2 + bev), t], [s * (gap / 2 + bev + 0.004), t], [s * (gap / 2 + 0.004), land]], 0.004).translate(BXc, DY + 0.04, 0.05 + L / 2 + 0.002))), { c: ['bevel-angle', 'joint-prep'], label: 'Bevel 30° (60° included)', mat: mat(0x7cc6ff) });
  add('rootface', 'weld-joints', merge([-1, 1].map(s => at(box(0.006, land, 0.004), BXc + s * gap / 2, DY + 0.04 + land / 2, 0.05 + L / 2 + 0.004))), { c: ['root-face'], label: 'Root face (land)', mat: mat(0xf0c43a) });
  add('rootgap', 'weld-joints', at(box(gap, 0.006, 0.004), BXc, DY + 0.035, 0.05 + L / 2 + 0.004), { c: ['root-gap', 'fit-up'], label: 'Root opening', mat: mat(0xff895f) });
  add('backing', 'weld-joints', at(box(0.14, 0.03, L), BXc, DY + 0.025, 0.05), { c: ['backing'], label: 'Backing strip', mat: mat(0x9aa3ad, { metal: 0.8 }) });
  const pass = (pts, id, c, label, m, o = {}) => add(id, o.sys || 'weld-joints', extrude(pts, L).translate(BXc, DY + 0.04, -L / 2 + 0.05), { c, label, mat: m, modes: o.modes, ...o });
  pass([[-gap / 2 - 0.004, -0.004], [gap / 2 + 0.004, -0.004], [gap / 2 + 0.012, 0.035], [-gap / 2 - 0.012, 0.035]], 'root', ['penetration', 'groove-weld'], 'Root pass (penetration)', mat(0xb7aa90, { metal: 0.8 }));
  pass([[-gap / 2 - 0.012, 0.035], [gap / 2 + 0.012, 0.035], [gap / 2 + bev * 0.75, 0.085], [-gap / 2 - bev * 0.75, 0.085]], 'fill', ['groove-weld', 'filler-metal', 'interpass-temperature'], 'Fill pass', mat(0xa69d8c, { metal: 0.8 }), { also: ['weld-metal'] });
  pass([[-gap / 2 - bev * 0.75, 0.085], [gap / 2 + bev * 0.75, 0.085], [gap / 2 + bev + 0.012, t], [gap / 2 + bev * 0.6, t + 0.022], [-gap / 2 - bev * 0.6, t + 0.022], [-gap / 2 - bev - 0.012, t]], 'cap', ['groove-weld'], 'Cap pass (reinforcement)', mat(0x9b9589, { metal: 0.8 }));
  add('interpass', 'weld-joints', merge([extrude([[-gap / 2 - 0.012, 0.034], [gap / 2 + 0.012, 0.034], [gap / 2 + 0.013, 0.037], [-gap / 2 - 0.013, 0.037]], 0.004), extrude([[-gap / 2 - bev * 0.75, 0.084], [gap / 2 + bev * 0.75, 0.084], [gap / 2 + bev * 0.76, 0.087], [-gap / 2 - bev * 0.76, 0.087]], 0.004)].map(g => g.translate(BXc, DY + 0.04, 0.05 + L / 2 + 0.003))), { c: ['interpass-cleaning'], label: 'Interpass boundaries', mat: mat(0x1c1e21) });
  add('bhaz', 'weld-metal', merge([-1, 1].map(s => extrude([[s * (gap / 2 + 0.004), -0.01], [s * (gap / 2 + 0.03), -0.01], [s * (gap / 2 + bev + 0.05), t + 0.004], [s * (gap / 2 + bev + 0.014), t + 0.004]], 0.004).translate(BXc, DY + 0.04, 0.05 + L / 2 + 0.001))), { c: ['haz', 'heat-input', 'preheat'], label: '', labelled: false, mat: mat(0x2f6fd6, { opacity: 0.55 }), noShadow: true });
  add('tacks', 'weld-joints', merge([-L / 2 + 0.07, L / 2 + 0.03].map(z => at(cyl(0.018, 0.04, 'z', 10), BXc, DY + 0.075, z))), { c: ['tack-weld'], label: 'Tack welds', mat: weld, modes: DEF.concat(SOUND), labelled: true });
  add('tempstick', 'weld-metal', merge([at(cyl(0.008, 0.12, 'x', 10), BXc + 0.2, DY + 0.01, 0.3), at(cyl(0.0085, 0.03, 'x', 10), BXc + 0.13, DY + 0.01, 0.3)]), { c: ['interpass-temperature', 'preheat'], label: 'Temp-indicating crayon', mat: mat(0x5fd39a) });
  // inspection tools
  add('gauge', 'weld-defects', merge([extrude([[0, 0], [0.12, 0], [0.12, 0.02], [0.02, 0.02], [0.02, 0.12], [0, 0.12]], 0.004).translate(TXc + 0.14, DY + 0.06, 0.36)]), { c: ['fillet-gauge', 'visual-inspection'], label: 'Fillet gauge', mat: mat(0xc9ced6, { metal: 0.9 }) });
  add('pt', 'weld-defects', merge([0, 1, 2].map(i => at(cyl(0.022, 0.16, 'y', 14), 1.74 - i * 0.055, DY + 0.08, 0.36))), { c: ['dye-penetrant'], label: 'Dye penetrant kit', mat: mat(0xc9302c, { metal: 0.3 }) });
  add('yoke', 'weld-defects', merge([at(rbox(0.05, 0.12, 0.05, 0.01), 2.1, DY + 0.2, -0.3), cylBetween(V(2.07, DY + 0.14, -0.3), V(2.04, DY + 0.08, -0.3), 0.01, 8), cylBetween(V(2.13, DY + 0.14, -0.3), V(2.16, DY + 0.08, -0.3), 0.01, 8)]), { c: ['magnetic-particle'], label: 'Mag-particle yoke', mat: mat(0x3a3f45) });
  // defects (only in defects mode)
  const dz = 0.05 + L / 2 + 0.006;
  add('porosity', 'weld-defects', merge(Array.from({ length: 9 }, (_, i) => at(new THREE.SphereGeometry(0.006 + (i % 3) * 0.002, 10, 8), BXc - 0.03 + (i % 4) * 0.02, DY + 0.1 + (i % 3) * 0.012, dz - 0.004 - (i % 2) * 0.01))), { c: ['porosity'], label: 'Porosity', mat: mat(0x0b0c0e), modes: DEF });
  add('undercut', 'weld-defects', extrude([[0.005, 0.18], [0.02, 0.172], [0.035, 0.18]], L).translate(TXc + 0.12, DY - 0.005, -L / 2 + 0.05), { c: ['undercut'], label: 'Undercut at the toe', mat: mat(0xc38bff, { emissive: 0x5a2a8a, ei: 0.5 }), modes: DEF });
  add('overlap', 'weld-defects', extrude([[-0.15, 0.06], [-0.19, 0.062], [-0.2, 0.075], [-0.15, 0.075]], L).translate(TXc, DY, -L / 2 + 0.05), { c: ['overlap'], label: 'Overlap (cold roll-over)', mat: weld, modes: DEF });
  add('slagincl', 'weld-defects', at(box(0.03, 0.006, 0.3), BXc + 0.01, DY + 0.04 + 0.086, 0.05), { c: ['slag-inclusion', 'slag'], label: 'Slag inclusion', mat: mat(0x3b3024), modes: DEF });
  add('lof', 'weld-defects', extrude([[-gap / 2 - bev * 0.5, 0.06], [-gap / 2 - bev * 0.5 - 0.006, 0.06], [-gap / 2 - bev * 0.9 - 0.006, 0.11], [-gap / 2 - bev * 0.9, 0.11]], L * 0.6).translate(BXc, DY + 0.04, 0.05 - L * 0.1), { c: ['lack-of-fusion'], label: 'Lack of sidewall fusion', mat: mat(0x0b0c0e), modes: DEF });
  add('ip', 'weld-defects', at(box(0.008, 0.02, L * 0.5), BXc, DY + 0.05, 0.05), { c: ['incomplete-penetration'], label: 'Incomplete penetration', mat: mat(0x0b0c0e), modes: DEF });
  add('crack', 'weld-defects', merge([cylBetween(V(BXc - 0.005, DY + 0.165, 0.05 - 0.2), V(BXc + 0.004, DY + 0.166, 0.05), 0.003, 6), cylBetween(V(BXc + 0.004, DY + 0.166, 0.05), V(BXc - 0.003, DY + 0.166, 0.05 + 0.15), 0.003, 6)]), { c: ['cracking'], label: 'Centerline crack', mat: mat(0x0b0c0e), modes: DEF });
  add('crater', 'weld-defects', merge([0, 1, 2, 3].map(i => at(rotY(box(0.05, 0.003, 0.004), i * Math.PI / 4), BXc, DY + 0.166, 0.05 + L / 2 - 0.04))), { c: ['crater-crack'], label: 'Crater crack', mat: mat(0x0b0c0e), modes: DEF });
  add('burnthrough', 'weld-defects', at(cyl(0.03, 0.02, 'y', 18), BXc, DY + 0.03, 0.05 - 0.2), { c: ['burn-through'], label: 'Burn-through', mat: mat(0x0b0c0e), modes: DEF });
  add('spatter', 'weld-defects', merge(Array.from({ length: 14 }, (_, i) => at(new THREE.SphereGeometry(0.005, 8, 6), TXc - 0.2 + (i * 0.037) % 0.4, DY + 0.063, -0.2 + (i * 0.061) % 0.5))), { c: ['spatter'], label: 'Spatter', mat: weld, modes: DEF });

  // scale the whole display up around the top of the plinth so the sections read at a glance
  const disp = new THREE.Group(); disp.position.set(1.65, 0.8, 0.05); root.add(disp); root.updateMatrixWorld(true);
  A.comps.slice(dispFrom).forEach(c => disp.attach(c.obj));
  disp.scale.setScalar(1.45); plinth.scale.set(1.2, 1, 1.3); plinth.position.set(1.65 * -0.2, 0, 0.05 * -0.3);

  /* ---------------- flows: current through the welding circuit, gas to the gun, fumes up the arm */
  flow('weld-arc', [V(PX, 0.8, PZ + 0.26), V(PX + 0.4, 0.6, PZ + 0.6), V(-0.4, 0.9, 0.55), gunBack, gunTip, arc.position.clone(), V(0.36, TY + 0.02, 0.3), V(0.36, TY - 0.02, 0.35), V(0.2, 0.25, 0.6), V(PX + 0.4, 0.1, PZ + 0.7), V(PX + 0.08, 0.22, PZ + 0.36)], 0xf0c43a, { r: 0.008, speed: 0.4, density: 7, also: ['weld-process'] });
  flow('weld-arc', [V(GX, 1.36, GZ + 0.03), V(GX + 0.1, 1.1, GZ + 0.25), V(PX, 0.9, PZ - 0.2), V(PX, 0.8, PZ + 0.26), V(PX + 0.4, 0.6, PZ + 0.6), V(-0.4, 0.9, 0.55), gunBack, gunTip], 0x9fe0ff, { r: 0.006, speed: 0.3, density: 9, idle: false, also: ['weld-process'] });
  flow('weld-safety', [arc.position.clone().add(V(0, 0.05, 0)), V(-0.15, 1.1, 0.05), V(-0.08, 1.35, -0.12), V(0.0, 1.45, -0.2), V(0.7, 1.9, -0.9), V(0.7, 2.3, -1.15)], 0xb9b2aa, { r: 0.016, speed: 0.25, density: 7 });

  const tick = (dt, t, cx) => {
    const flick = cx.reduced ? 1 : 0.75 + Math.random() * 0.5;
    arc.scale.setScalar(flick); arcLight.intensity = 1.2 * flick;
  };
  return { root, comps: A.comps, flows: A.flows, tick };
}
