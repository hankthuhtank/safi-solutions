/* HVAC model: a split-system heat pump with a gas furnace (dual fuel), the way it sits in a
   basement utility room. Proportions follow common residential equipment: a 3-ton outdoor unit
   (~0.75 m cube), an upflow 90%+ furnace (21 in W × 40 in H × 29 in D), a cased A-coil on top,
   a 3/4 in suction line with foam insulation and a 3/8 in bare liquid line.
   x → outdoors, y up, z toward the viewer. The house wall is at x = 1.15. */
export const meta = {
  id: 'hvac',
  name: 'Split-system heat pump + gas furnace',
  plate: 'DUAL FUEL · 3-TON HEAT PUMP · 90%+ FURNACE · R-454B',
  systems: {
    'hvac-fundamentals': { name: 'Heat + air basics', color: 0xf2d6a2 },
    'hvac-cycle': { name: 'Refrigeration cycle', color: 0xe0607e },
    'hvac-air': { name: 'Airflow + ducts', color: 0x7cc6ff },
    'hvac-controls': { name: 'Electrical + controls', color: 0xf0c43a },
    'hvac-heating': { name: 'Heating + heat pump', color: 0xff8a3d },
    'hvac-diagnostics': { name: 'Diagnostics', color: 0x5fd39a },
    'hvac-tools': { name: 'Service tools', color: 0xb49cff },
    'hvac-safety': { name: 'Safety', color: 0xff5a4a }
  },
  modes: { cool: 'Cooling', heat: 'Heat pump heat', furnace: 'Gas furnace' },
  defaultMode: 'cool',
  views: {
    overview: { dir: [0.55, 0.42, 1] },
    indoor: { dir: [0.2, 0.25, 1], box: [[-1.2, 0, -0.8], [0.9, 2.4, 0.6]] },
    outdoor: { dir: [0.4, 0.4, 1], box: [[1.2, 0, -0.7], [2.9, 1.2, 0.9]] }
  },
  focus: {
    'hvac-cycle': { dir: [0.35, 0.45, 1] },
    'hvac-air': { dir: [0.5, 0.35, 1] },
    'hvac-heating': { dir: [-0.2, 0.3, 1] },
    'hvac-controls': { dir: [0.3, 0.3, 1] }
  },
  stage: { shadow: 4.5, grid: 0x9cc4e0, fade: 9, minR: 0.35, partR: 0.24 }
};

export function build(k) {
  const { THREE, V, rbox, box, cyl, cylBetween, tube, pipe, pipePoints, merge, at, rotY, rotZ, rotX, helix, lathe, mat, STOCK, CONTEXT } = k;
  const A = k.assembly(meta);
  const { add, ctx, flow, root } = A;
  const S = meta.systems;
  const COOL = ['cool'], HEAT = ['heat'], HP = ['cool', 'heat'], GAS = ['furnace'];

  /* ---------------- context: basement floor, back wall, house wall, floor above */
  ctx(at(box(4.4, 0.02, 2.4), -1.0, -0.01, -0.2), CONTEXT.slab());
  ctx(at(box(4.4, 2.6, 0.04), -1.0, 1.3, -1.42), CONTEXT.wall());
  ctx(at(box(0.2, 2.6, 2.4), 1.25, 1.3, -0.2), CONTEXT.wall());
  ctx(at(box(4.5, 0.18, 2.4), -1.0, 2.69, -0.2), CONTEXT.slab());
  ctx(at(box(1.9, 0.02, 2.2), 2.25, -0.005, -0.1), CONTEXT.ground());

  /* ---------------- outdoor unit (heat pump) */
  const OX = 2.3, OZ = -0.1, OW = 0.76, OH = 0.82;
  add('pad', 'hvac-cycle', at(rbox(0.95, 0.07, 0.95, 0.01), OX, 0.035, OZ), { mat: STOCK.concrete(), noPick: true });
  add('odu', 'hvac-cycle', merge([at(rbox(OW, OH, OW, 0.02), OX, 0.07 + OH / 2, OZ), at(cyl(0.3, 0.04, 'y', 40), OX, 0.07 + OH + 0.02, OZ)]),
    { c: ['outdoor-unit', 'heat-pump'], label: 'Outdoor unit (heat pump)', shell: true, hero: true, mat: mat(0xb9bdb6, { rough: 0.6, metal: 0.3 }), anchor: V(OX + 0.2, 0.8, OZ + 0.38), also: ['hvac-heating'] });
  // condenser coil wraps three sides (fins + hairpin tubes)
  const coilPanels = [];
  for (const [w, x, z, ry] of [[OW - 0.08, OX, OZ - OW / 2 + 0.05, 0], [OW - 0.08, OX + OW / 2 - 0.05, OZ, Math.PI / 2], [OW - 0.08, OX, OZ + OW / 2 - 0.05, 0]]) {
    const g = merge([box(w, OH - 0.16, 0.035), ...Array.from({ length: 14 }, (_, i) => at(cyl(0.0045, w + 0.01, 'x', 8), 0, -0.3 + i * 0.047, 0.02))]);
    rotY(g, ry); coilPanels.push(at(g, x, 0.07 + OH / 2, z));
  }
  add('ocoil', 'hvac-cycle', merge(coilPanels), { c: ['condenser', 'heat-transfer', 'saturation-temperature', 'phase-change'], label: 'Outdoor coil', mat: mat(0x9aa6ae, { rough: 0.35, metal: 0.8 }), anchor: V(OX + OW / 2 - 0.04, 0.5, OZ + 0.1) });
  const comp = add('compressor', 'hvac-cycle', merge([at(lathe([[0, 0], [0.11, 0], [0.12, 0.03], [0.12, 0.36], [0.1, 0.4], [0, 0.42]], 32), OX - 0.08, 0.1, OZ - 0.05), at(cyl(0.02, 0.05, 'y', 12), OX - 0.08, 0.54, OZ - 0.05)]),
    { c: ['compressor'], label: 'Scroll compressor', hero: true, mat: mat(0x2c3a33, { rough: 0.45, metal: 0.5 }), anchor: V(OX - 0.08, 0.35, OZ + 0.07) });
  const accPts = [V(OX + 0.1, 0.12, OZ - 0.2)];
  add('accumulator', 'hvac-cycle', at(lathe([[0, 0], [0.055, 0], [0.058, 0.02], [0.058, 0.26], [0.03, 0.29], [0, 0.29]], 24), OX + 0.12, 0.1, OZ - 0.2), { c: ['accumulator'], label: 'Accumulator', mat: mat(0x3c4a42, { rough: 0.5, metal: 0.5 }) });
  add('rvalve', 'hvac-cycle', merge([at(cyl(0.022, 0.13, 'x', 16), OX + 0.12, 0.6, OZ + 0.1), cylBetween(V(OX + 0.12, 0.62, OZ + 0.1), V(OX + 0.12, 0.72, OZ + 0.1), 0.008), ...[-0.04, 0, 0.04].map(d => cylBetween(V(OX + 0.12 + d, 0.58, OZ + 0.1), V(OX + 0.12 + d, 0.5, OZ + 0.1), 0.007)), at(rbox(0.04, 0.03, 0.03, 0.005), OX + 0.12, 0.6, OZ + 0.135)]),
    { c: ['reversing-valve'], label: 'Reversing valve', mat: STOCK.brass(), also: ['hvac-heating'] });
  add('discharge', 'hvac-cycle', pipe([V(OX - 0.08, 0.56, OZ - 0.05), V(OX - 0.08, 0.66, OZ - 0.05), V(OX + 0.07, 0.66, OZ + 0.1), V(OX + 0.07, 0.72, OZ + 0.1)], 0.007, 0.03), { c: ['discharge-line'], label: 'Discharge line', mat: STOCK.copper() });
  // fan on top
  const fan = new THREE.Group(); fan.position.set(OX, 0.07 + OH - 0.06, OZ);
  fan.add(new THREE.Mesh(merge([cyl(0.04, 0.08, 'y', 18), ...Array.from({ length: 3 }, (_, i) => rotY(at(rbox(0.25, 0.008, 0.1, 0.004), 0.14, 0, 0), i * Math.PI * 2 / 3))]), mat(0x2a2d31, { rough: 0.5 })));
  add('cfan', 'hvac-cycle', fan, { c: ['condenser-fan', 'psc-motor'], label: 'Condenser fan + motor', anchor: V(OX, 0.9, OZ + 0.2), also: ['hvac-air'] });
  // control box corner: contactor, dual run capacitor, defrost board
  const cb = V(OX + 0.28, 0.55, OZ + 0.3);
  add('dualcap', 'hvac-controls', merge([at(cyl(0.032, 0.11, 'y', 20), cb.x, cb.y, cb.z), ...[[-0.013, 0], [0.013, 0], [0, 0.013]].map(([dx, dz]) => at(cyl(0.005, 0.015, 'y', 8), cb.x + dx, cb.y + 0.062, cb.z + dz))]),
    { c: ['dual-run-capacitor', 'run-capacitor'], label: 'Dual run capacitor', mat: mat(0xc6ccd2, { rough: 0.3, metal: 0.9 }) });
  add('ocontactor', 'hvac-controls', at(rbox(0.05, 0.06, 0.04, 0.006), cb.x, cb.y - 0.12, cb.z), { c: ['hvac-24vac'], label: 'Contactor (24 V coil)', labelled: false, mat: mat(0x3a3e44) });
  add('defrost', 'hvac-heating', at(rbox(0.012, 0.09, 0.07, 0.003), cb.x - 0.07, cb.y - 0.05, cb.z), { c: ['defrost-cycle'], label: 'Defrost control', noFrame: true, mat: mat(0x2f7a4f, { rough: 0.6 }) });
  add('dataplate', 'hvac-fundamentals', at(box(0.003, 0.08, 0.12), OX - OW / 2 - 0.002, 0.62, OZ + 0.2), { c: ['refrigeration-ton', 'btu'], label: 'Data plate (tons · BTU/h)', mat: mat(0xdfe3e6, { rough: 0.3, metal: 0.8 }) });
  // service valves on the house side
  const SVy = 0.22, SVx = OX - OW / 2 - 0.02;
  add('svalves', 'hvac-cycle', merge([at(rbox(0.05, 0.05, 0.04, 0.006), SVx, SVy, OZ + 0.22), at(rbox(0.04, 0.04, 0.035, 0.006), SVx, SVy, OZ + 0.3), at(cyl(0.006, 0.03, 'x', 8), SVx - 0.03, SVy + 0.015, OZ + 0.22), at(cyl(0.005, 0.03, 'x', 8), SVx - 0.03, SVy + 0.012, OZ + 0.3)]),
    { c: ['pressure-temperature'], label: 'Service valves', mat: STOCK.brass(), also: ['hvac-diagnostics', 'hvac-tools'] });

  /* ---------------- indoor: filter cabinet, furnace, coil, plenum */
  const FW = 0.53, FD = 0.72, FB = 0.25, FH = 1.02, CH = 0.5;
  const fTop = FB + FH;
  add('filterbox', 'hvac-air', at(rbox(FW + 0.04, FB, FD, 0.01), 0, FB / 2, 0), { c: [], label: '', shell: true, noPick: true, mat: mat(0x8b939b, { metal: 0.6 }) });
  add('filter', 'hvac-air', merge([at(box(FW - 0.02, 0.1, FD - 0.06), 0, FB / 2, 0), ...Array.from({ length: 11 }, (_, i) => at(box(0.012, 0.1, FD - 0.06), -FW / 2 + 0.03 + i * 0.047, FB / 2, 0))]),
    { c: ['filter-merv'], label: 'Media filter (MERV)', hero: true, mat: mat(0xf2efe4, { rough: 0.95 }), anchor: V(-0.1, FB / 2, FD / 2) });
  add('furnace', 'hvac-heating', at(rbox(FW, FH, FD, 0.012), 0, FB + FH / 2, 0), { c: ['furnace', 'furnace-sequence', 'aux-heat'], label: 'Gas furnace', hero: true, shell: true, mat: mat(0xd9d6cf, { rough: 0.5, metal: 0.4 }), anchor: V(-FW / 2, FB + 0.8, FD / 2 - 0.1) });
  // blower (lower compartment)
  const bl = new THREE.Group(); bl.position.set(0, FB + 0.24, 0.02);
  bl.add(new THREE.Mesh(merge([cyl(0.15, 0.3, 'z', 30, 0.15, true), ...Array.from({ length: 28 }, (_, i) => { const a = i / 28 * Math.PI * 2; return rotZ(at(box(0.004, 0.05, 0.29), 0.125, 0, 0), a); })]), mat(0x9fa7ae, { rough: 0.4, metal: 0.8, side: THREE.DoubleSide })));
  add('blower', 'hvac-air', bl, { c: ['blower', 'airflow-cfm'], label: 'Blower wheel', hero: true, anchor: V(0.1, FB + 0.3, 0.2) });
  add('housing', 'hvac-air', merge([at(cyl(0.2, 0.34, 'z', 32, 0.2, true), 0, FB + 0.24, 0.02)]), { c: [], label: '', labelled: false, noPick: true, mat: mat(0x70777f, { metal: 0.6, opacity: 0.3, side: THREE.DoubleSide }) });
  add('ecm', 'hvac-air', merge([at(cyl(0.075, 0.1, 'z', 24), 0, FB + 0.24, -0.2), at(rbox(0.06, 0.06, 0.04, 0.006), 0, FB + 0.24, -0.27)]), { c: ['ecm-motor'], label: 'ECM blower motor', mat: mat(0x3a3f45, { metal: 0.6 }) });
  add('board', 'hvac-controls', at(rbox(0.16, 0.11, 0.012, 0.003), -0.12, FB + 0.5, FD / 2 - 0.04), { c: ['control-board-hvac'], label: 'Furnace control board', mat: mat(0x2f7a4f, { rough: 0.6 }) });
  add('xfmr', 'hvac-controls', merge([at(rbox(0.06, 0.05, 0.05, 0.006), 0.13, FB + 0.5, FD / 2 - 0.06)]), { c: ['hvac-24vac'], label: '24 VAC transformer', mat: mat(0x48505a, { metal: 0.5 }) });
  // burner compartment (upper)
  const HX = FB + 0.6;
  add('hx', 'hvac-heating', merge(Array.from({ length: 4 }, (_, i) => at(rbox(0.07, 0.34, 0.42, 0.03), -0.18 + i * 0.12, HX + 0.18, -0.05))), { c: ['aux-heat'], label: 'Heat exchanger', mat: mat(0x8a8f95, { rough: 0.45, metal: 0.85 }) });
  add('burners', 'hvac-heating', merge(Array.from({ length: 4 }, (_, i) => at(cyl(0.02, 0.2, 'z', 12), -0.18 + i * 0.12, HX - 0.04, 0.2))), { c: [], label: 'Burners', mat: STOCK.darkSteel() });
  const flames = new THREE.Mesh(merge(Array.from({ length: 4 }, (_, i) => at(rotX(cyl(0.022, 0.09, 'y', 10, 0.004), 0), -0.18 + i * 0.12, HX + 0.035, 0.12))), new THREE.MeshBasicMaterial({ color: 0x5aa9ff, transparent: true, opacity: 0.85, depthWrite: false }));
  flames.userData.keep = true; flames.visible = false; root.add(flames);
  add('gasvalve', 'hvac-heating', merge([at(rbox(0.09, 0.07, 0.06, 0.008), 0.18, HX + 0.02, FD / 2 - 0.1), at(cyl(0.012, 0.05, 'y', 10), 0.18, HX + 0.075, FD / 2 - 0.1)]), { c: ['gas-valve'], label: 'Gas valve', mat: mat(0x5a6168, { metal: 0.6 }) });
  add('igniter', 'hvac-heating', at(rbox(0.012, 0.05, 0.01, 0.003), -0.24, HX + 0.03, 0.3), { c: [], label: 'Hot-surface igniter', labelled: false, mat: mat(0xd8d1c0) });
  add('flamesensor', 'hvac-heating', merge([cylBetween(V(0.2, HX + 0.03, 0.3), V(0.14, HX + 0.03, 0.12), 0.004), at(cyl(0.01, 0.02, 'x', 8), 0.21, HX + 0.03, 0.3)]), { c: ['flame-sensor'], label: 'Flame sensor rod', mat: STOCK.steel(), view: { dir: [0.2, 0.2, 1] } });
  add('inducer', 'hvac-heating', merge([at(cyl(0.08, 0.07, 'z', 24), -0.13, HX + 0.3, 0.26), at(cyl(0.045, 0.06, 'z', 18), -0.13, HX + 0.3, 0.32)]), { c: ['inducer'], label: 'Draft inducer', mat: mat(0x4c535b, { metal: 0.6 }) });
  add('limit', 'hvac-heating', at(rbox(0.03, 0.03, 0.012, 0.004), 0.04, HX + 0.36, 0.3), { c: ['limit-switch-hvac'], label: 'High limit switch', mat: mat(0xcfd3d6, { metal: 0.8 }) });
  // cased A-coil on top of the furnace
  add('coilcase', 'hvac-cycle', at(rbox(FW, CH, FD, 0.012), 0, fTop + CH / 2, 0), { c: [], label: '', shell: true, noPick: true, mat: mat(0xcfccc4, { metal: 0.4 }) });
  const aCoil = merge([-1, 1].map(s => { const g = merge([box(0.03, 0.5, FD - 0.1), ...Array.from({ length: 9 }, (_, i) => at(cyl(0.0045, FD - 0.08, 'z', 8), 0.018, -0.22 + i * 0.055, 0))]); g.rotateZ(s * 0.42); return at(g, s * 0.1, fTop + CH / 2, 0); }));
  add('evap', 'hvac-cycle', aCoil, { c: ['evaporator', 'dew-point', 'psychrometrics'], label: 'Evaporator A-coil', hero: true, mat: mat(0xa9b4bc, { rough: 0.35, metal: 0.8 }), anchor: V(0.1, fTop + 0.3, FD / 2 - 0.05), also: ['hvac-fundamentals'] });
  add('drainpan', 'hvac-air', at(rbox(FW - 0.04, 0.04, FD - 0.04, 0.008), 0, fTop + 0.03, 0), { c: ['condensate-drain', 'latent-heat'], label: 'Drain pan + condensate line', mat: mat(0x2f3338, { rough: 0.8 }), also: ['hvac-fundamentals'] });
  add('txv', 'hvac-cycle', merge([at(rbox(0.045, 0.05, 0.04, 0.008), FW / 2 + 0.04, fTop + 0.22, 0.12), at(cyl(0.012, 0.03, 'y', 12), FW / 2 + 0.04, fTop + 0.265, 0.12), cylBetween(V(FW / 2 + 0.04, fTop + 0.28, 0.12), V(FW / 2 + 0.07, fTop + 0.33, 0.0), 0.0025), at(cyl(0.008, 0.07, 'z', 10), FW / 2 + 0.075, fTop + 0.33, -0.03)]),
    { c: ['metering-device'], label: 'TXV (metering device)', mat: STOCK.brass(), view: { dir: [0.8, 0.3, 0.7] } });
  add('float', 'hvac-controls', merge([at(cyl(0.018, 0.05, 'y', 12), FW / 2 + 0.03, fTop + 0.04, -0.2), cylBetween(V(FW / 2, fTop + 0.04, -0.2), V(FW / 2 + 0.03, fTop + 0.04, -0.2), 0.008)]), { c: ['float-switch'], label: 'Float switch', mat: mat(0xe9e6dc) });
  const condPts = [V(FW / 2, fTop + 0.03, 0.2), V(FW / 2 + 0.12, fTop + 0.03, 0.2), V(FW / 2 + 0.12, 0.35, 0.2), V(FW / 2 + 0.12, 0.3, 0.3), V(FW / 2 + 0.12, 0.35, 0.4), V(FW / 2 + 0.12, 0.35, 0.55), V(FW / 2 + 0.12, 0.02, 0.55)];
  add('condline', 'hvac-air', pipe(condPts, 0.011, 0.04), { c: ['condensate-drain'], label: '', labelled: false, mat: mat(0xeeeeea, { rough: 0.5 }) });
  // supply plenum, trunk, branches, registers
  const pTop = fTop + CH, trunkY = 2.38;
  add('plenum', 'hvac-air', at(rbox(FW + 0.02, trunkY - pTop + 0.14, FD - 0.1, 0.01), 0, (pTop + trunkY + 0.14) / 2, 0), { c: ['supply-air', 'ductwork'], label: 'Supply plenum', shell: true, mat: STOCK.galv() });
  add('trunk', 'hvac-air', at(rbox(3.1, 0.24, 0.46, 0.008), -1.7, trunkY, 0), { c: ['ductwork', 'duct-sizing'], label: 'Supply trunk', hero: true, shell: true, mat: STOCK.galv(), anchor: V(-2.2, trunkY, 0.23) });
  const branchX = [-0.9, -1.8, -2.8];
  add('branch1', 'hvac-air', merge([at(cyl(0.075, 0.2, 'y', 20), branchX[0], trunkY + 0.2, 0.08)]), { c: ['supply-air'], label: '', labelled: false, mat: STOCK.galv() });
  add('damper', 'hvac-air', merge([at(cyl(0.075, 0.2, 'y', 20), branchX[1], trunkY + 0.2, 0.08), at(rotZ(cyl(0.07, 0.006, 'y', 20), 0.6), branchX[1], trunkY + 0.2, 0.08), at(rbox(0.05, 0.012, 0.012, 0.003), branchX[1] + 0.1, trunkY + 0.2, 0.08)]), { c: ['damper'], label: 'Balancing damper', mat: STOCK.galv() });
  const flexPts = [V(branchX[2], trunkY + 0.12, 0.08), V(branchX[2] + 0.05, trunkY + 0.24, 0.1), V(branchX[2] + 0.2, trunkY + 0.3, 0.3), V(branchX[2] + 0.25, 2.58, 0.45)];
  add('flex', 'hvac-air', merge([tube(flexPts, 0.075, false, 40, 18), ...Array.from({ length: 16 }, (_, i) => { const c = k.curve(flexPts); const p = c.getPointAt(i / 15), tg = c.getTangentAt(i / 15); const g = new THREE.TorusGeometry(0.077, 0.006, 6, 20); g.lookAt(tg); return at(g, p.x, p.y, p.z); })]),
    { c: ['flex-duct'], label: 'Flex duct', mat: mat(0xc9cdd2, { rough: 0.7, metal: 0.3 }) });
  add('registers', 'hvac-air', merge([...[[branchX[0], 0.08], [branchX[1], 0.08], [branchX[2] + 0.25, 0.45]].map(([x, z]) => merge([at(box(0.3, 0.012, 0.12), x, 2.6, z), ...Array.from({ length: 6 }, (_, i) => at(box(0.29, 0.02, 0.006), x, 2.605, z - 0.05 + i * 0.02))]))]),
    { c: ['supply-air', 'sensible-heat'], label: 'Supply registers', mat: mat(0xe9e6de), also: ['hvac-fundamentals'] });
  // return: grille in the floor above → vertical return drop → filter cabinet
  const RX = -1.35;
  add('returnduct', 'hvac-air', merge([at(rbox(0.36, 2.2, 0.3, 0.008), RX, 1.5, -0.95), at(rbox(1.1, 0.3, 0.3, 0.008), RX / 2 - 0.02, 0.2, -0.95), at(rbox(0.3, 0.3, 0.5, 0.008), -FW / 2 - 0.15, 0.2, -0.55)]),
    { c: ['return-air'], label: 'Return duct', hero: true, shell: true, mat: STOCK.galv(), anchor: V(RX, 1.4, -0.8) });
  add('returngrille', 'hvac-air', merge([at(box(0.44, 0.012, 0.36), RX, 2.6, -0.95), ...Array.from({ length: 8 }, (_, i) => at(box(0.42, 0.018, 0.008), RX, 2.605, -1.1 + i * 0.043))]), { c: ['return-air'], label: '', labelled: false, mat: mat(0xe9e6de) });
  add('sptaps', 'hvac-air', merge([at(cyl(0.008, 0.03, 'z', 10), 0.12, pTop + 0.2, FD / 2 - 0.035), at(cyl(0.008, 0.03, 'z', 10), -0.1, 0.12, FD / 2 + 0.015)]), { c: ['static-pressure'], label: 'Static pressure test ports', mat: mat(0xf0c43a) });

  /* ---------------- line set: coil → through the wall → outdoor service valves */
  const lsY = fTop + 0.3;
  const suctionPts = [V(FW / 2, lsY, -0.05), V(0.55, lsY, -0.05), V(0.55, 1.6, -0.05), V(1.4, 1.6, -0.05), V(1.4, SVy, -0.05), V(SVx - 0.02, SVy, -0.05), V(SVx - 0.02, SVy + 0.015, OZ + 0.22)];
  const liquidPts = [V(FW / 2 + 0.04, fTop + 0.18, 0.12), V(0.6, fTop + 0.18, 0.12), V(0.6, 1.66, 0.04), V(1.45, 1.66, 0.04), V(1.45, SVy - 0.02, 0.04), V(SVx - 0.03, SVy - 0.02, 0.04), V(SVx - 0.03, SVy + 0.012, OZ + 0.3)];
  add('suction', 'hvac-cycle', merge([pipe(suctionPts, 0.022, 0.06)]), { c: ['suction-line'], label: 'Suction line (insulated)', hero: true, mat: STOCK.foam(), anchor: suctionPts[3].clone().lerp(suctionPts[2], 0.3) });
  add('liquid', 'hvac-cycle', pipe(liquidPts, 0.0055, 0.06), { c: ['liquid-line'], label: 'Liquid line', mat: STOCK.copper(), anchor: liquidPts[3].clone().lerp(liquidPts[4], 0.4) });
  add('drier', 'hvac-cycle', at(cyl(0.02, 0.12, 'x', 16), 0.95, 1.66, 0.04), { c: ['filter-drier'], label: 'Filter-drier', mat: mat(0x3a4a5a, { metal: 0.5 }) });
  // compressor piping inside the outdoor unit (for the flow path)
  const accIn = V(OX + 0.12, 0.42, OZ - 0.2);

  /* ---------------- thermostat + wiring, CO alarm, gas supply, vent */
  add('tstat', 'hvac-controls', merge([at(rbox(0.12, 0.12, 0.025, 0.02), -2.3, 1.5, -1.39), at(cyl(0.035, 0.006, 'z', 24), -2.3, 1.5, -1.375)]), { c: ['thermostat', 'relative-humidity'], label: 'Thermostat', hero: true, mat: mat(0xeceae4, { rough: 0.4 }), also: ['hvac-fundamentals'] });
  add('tstatwire', 'hvac-controls', pipe([V(-2.3, 1.44, -1.38), V(-2.3, 1.05, -1.38), V(-0.12, 1.05, -1.38), V(-0.12, 1.05, -0.2), V(-0.12, FB + 0.5, FD / 2 - 0.05)], 0.004, 0.05), { c: ['hvac-24vac'], label: '', labelled: false, mat: mat(0xd9c9a3) });
  add('co', 'hvac-safety', merge([at(cyl(0.06, 0.03, 'z', 24), -0.9, 1.75, -1.39)]), { c: ['carbon-monoxide'], label: 'CO alarm', mat: mat(0xf2f0ea) });
  const gasPts = [V(0.5, 2.3, -1.38), V(0.5, HX + 0.02, -1.38), V(0.5, HX + 0.02, -0.2), V(0.5, HX + 0.02, FD / 2 - 0.1), V(0.23, HX + 0.02, FD / 2 - 0.1)];
  add('gaspipe', 'hvac-heating', merge([pipe(gasPts, 0.013, 0.05), at(cyl(0.014, 0.18, 'y', 12), 0.5, HX - 0.09, FD / 2 - 0.1), at(rbox(0.04, 0.03, 0.03, 0.005), 0.5, HX + 0.02, 0.05), at(rbox(0.1, 0.012, 0.02, 0.004), 0.5, HX + 0.045, 0.05)]), { c: ['gas-valve'], label: 'Gas line + drip leg', mat: mat(0x26292d, { rough: 0.6, metal: 0.6 }), labelled: false });
  const ventPts = [V(-0.13, HX + 0.3, 0.33), V(-0.13, HX + 0.3, 0.46), V(-0.13, 1.95, 0.46), V(1.3, 1.95, 0.46), V(1.6, 1.95, 0.46)];
  add('vent', 'hvac-heating', pipe(ventPts, 0.03, 0.08), { c: [], label: 'PVC vent', labelled: false, mat: mat(0xf1f0ea, { rough: 0.5 }) });
  add('disconnect', 'hvac-safety', merge([at(rbox(0.05, 0.22, 0.16, 0.008), 1.4, 0.95, -0.7), pipe([V(1.42, 0.84, -0.7), V(1.42, 0.5, -0.7), V(OX - 0.2, 0.5, OZ - 0.39)], 0.012, 0.08)]), { c: ['hvac-service-safety'], label: 'Service disconnect', mat: mat(0x8d949b, { metal: 0.5 }) });

  /* ---------------- service tools at the outdoor unit */
  const MG = V(1.72, 0.62, 0.62);
  add('manifold', 'hvac-tools', merge([at(rbox(0.2, 0.06, 0.04, 0.008), MG.x, MG.y, MG.z), at(cyl(0.045, 0.02, 'z', 24), MG.x - 0.06, MG.y + 0.07, MG.z), at(cyl(0.045, 0.02, 'z', 24), MG.x + 0.06, MG.y + 0.07, MG.z)]),
    { c: ['manifold-gauges', 'pressure-temperature'], label: 'Manifold gauges', mat: mat(0x2c3036, { metal: 0.5 }), also: ['hvac-diagnostics'] });
  add('gaugefaces', 'hvac-tools', merge([at(cyl(0.038, 0.004, 'z', 24), MG.x - 0.06, MG.y + 0.07, MG.z + 0.012)]), { c: [], labelled: false, noPick: true, mat: mat(0x4a7fd1) });
  add('gaugefaces2', 'hvac-tools', merge([at(cyl(0.038, 0.004, 'z', 24), MG.x + 0.06, MG.y + 0.07, MG.z + 0.012)]), { c: [], labelled: false, noPick: true, mat: mat(0xd14a4a) });
  add('hoses', 'hvac-tools', merge([tube([V(MG.x - 0.07, MG.y - 0.03, MG.z), V(MG.x - 0.12, 0.3, 0.5), V(SVx - 0.03, SVy + 0.03, OZ + 0.26)], 0.006), tube([V(MG.x + 0.07, MG.y - 0.03, MG.z), V(MG.x + 0.1, 0.3, 0.55), V(SVx - 0.03, SVy + 0.03, OZ + 0.32)], 0.006)]), { c: [], labelled: false, noPick: true, mat: mat(0x3b6fc8, { rough: 0.7 }) });
  add('vacpump', 'hvac-tools', merge([at(rbox(0.3, 0.18, 0.14, 0.02), 1.55, 0.09, 0.9), at(cyl(0.06, 0.1, 'x', 20), 1.66, 0.12, 0.9), at(rbox(0.2, 0.02, 0.02, 0.005), 1.55, 0.21, 0.9)]), { c: ['vacuum-pump', 'evacuation'], label: 'Vacuum pump', mat: mat(0x2c6fb0, { metal: 0.3 }) });
  add('micron', 'hvac-tools', at(rbox(0.05, 0.08, 0.025, 0.006), 1.6, 0.28, 0.75), { c: ['vacuum-micron'], label: 'Micron gauge', mat: mat(0xf0c43a) });
  add('yhose', 'hvac-tools', tube([V(MG.x, MG.y - 0.03, MG.z), V(1.64, 0.35, 0.72), V(1.6, 0.24, 0.75), V(1.5, 0.2, 0.86)], 0.006), { c: [], labelled: false, noPick: true, mat: mat(0xe0c23a, { rough: 0.7 }) });
  add('cylinder', 'hvac-cycle', merge([at(lathe([[0, 0], [0.12, 0], [0.125, 0.03], [0.125, 0.36], [0.07, 0.42], [0, 0.43]], 32), 2.0, 0, 0.85), at(cyl(0.02, 0.05, 'y', 12), 2.0, 0.45, 0.85)]), { c: ['refrigerant', 'charging-basics'], label: 'R-454B cylinder (A2L)', mat: mat(0x9aa39a, { rough: 0.4, metal: 0.4 }) });
  add('cylband', 'hvac-cycle', at(cyl(0.127, 0.035, 'y', 32, 0.12), 2.0, 0.37, 0.85), { c: ['refrigerant'], labelled: false, noPick: true, mat: mat(0xc0332b) });
  // diagnostics: pipe clamps and probe thermometers
  add('shclamp', 'hvac-diagnostics', merge([at(new THREE.TorusGeometry(0.03, 0.008, 8, 18).rotateY(Math.PI / 2), 1.62, SVy, -0.05), at(rbox(0.04, 0.05, 0.02, 0.006), 1.62, SVy + 0.06, -0.05)]), { c: ['superheat'], label: 'Superheat: suction clamp', mat: mat(0x35b97a) });
  add('scclamp', 'hvac-diagnostics', merge([at(new THREE.TorusGeometry(0.016, 0.007, 8, 16).rotateY(Math.PI / 2), 1.62, SVy - 0.02, 0.04), at(rbox(0.035, 0.045, 0.02, 0.006), 1.62, SVy - 0.07, 0.07)]), { c: ['subcooling'], label: 'Subcooling: liquid clamp', mat: mat(0x35b97a) });
  add('probes', 'hvac-diagnostics', merge([at(cyl(0.004, 0.16, 'z', 8), -0.6, 2.38, 0.3), at(rbox(0.04, 0.07, 0.02, 0.006), -0.6, 2.38, 0.4), at(cyl(0.004, 0.16, 'z', 8), -0.75, 0.2, -0.7), at(rbox(0.04, 0.07, 0.02, 0.006), -0.75, 0.2, -0.6)]), { c: ['delta-t'], label: 'Temperature split probes', mat: mat(0x35b97a) });
  add('leak', 'hvac-diagnostics', merge([at(rbox(0.05, 0.11, 0.03, 0.008), 0.72, 1.35, 0.35), tube([V(0.72, 1.41, 0.35), V(0.7, 1.5, 0.3), V(0.62, 1.56, 0.2)], 0.004)]), { c: ['leak-detection-hvac'], label: 'Leak detector', mat: mat(0xf06f3a) });

  /* ---------------- flows */
  const outCoil = [V(OX - 0.3, 0.3, OZ - OW / 2 + 0.06), V(OX + 0.3, 0.45, OZ - OW / 2 + 0.06), V(OX + OW / 2 - 0.06, 0.55, OZ), V(OX + 0.3, 0.3, OZ + OW / 2 - 0.06), V(OX - 0.2, 0.2, OZ + OW / 2 - 0.06)];
  const indoorCoil = [V(FW / 2 + 0.04, fTop + 0.2, 0.12), V(0.15, fTop + 0.4, 0.1), V(0.0, fTop + 0.45, -0.1), V(-0.15, fTop + 0.2, -0.1), V(0.05, fTop + 0.12, -0.05), V(FW / 2, lsY, -0.05)];
  const compLoop = [accIn, V(OX + 0.12, 0.1, OZ - 0.2), V(OX - 0.08, 0.14, OZ - 0.05), V(OX - 0.08, 0.6, OZ - 0.05), V(OX + 0.07, 0.66, OZ + 0.1), V(OX + 0.12, 0.62, OZ + 0.1)];
  // cooling: compressor → outdoor coil (condenser) → liquid line → TXV → indoor coil (evaporator) → suction → accumulator
  flow('hvac-cycle', [...compLoop.slice(2), ...outCoil], 0xff4d3d, { modes: COOL, r: 0.012, speed: 0.25, also: ['hvac-diagnostics'] });
  flow('hvac-cycle', [V(OX - 0.2, 0.2, OZ + OW / 2 - 0.06), V(SVx, SVy, OZ + 0.3), ...pipePoints([...liquidPts].reverse(), 0.06)], 0xffa53d, { modes: COOL, r: 0.008, speed: 0.2, also: ['hvac-diagnostics'] });
  flow('hvac-cycle', indoorCoil, 0x4f8cff, { modes: COOL, r: 0.013, speed: 0.2, also: ['hvac-fundamentals'] });
  flow('hvac-cycle', [...pipePoints(suctionPts, 0.06), V(OX - 0.3, 0.25, OZ + 0.2), accIn, V(OX + 0.12, 0.1, OZ - 0.2), V(OX - 0.08, 0.14, OZ - 0.05)], 0x7fd6ff, { modes: COOL, r: 0.012, speed: 0.24, also: ['hvac-diagnostics'] });
  // heat pump heating: the reversing valve swaps the coils' jobs, so hot gas goes indoors
  flow('hvac-cycle', [...compLoop.slice(2), V(OX - 0.3, 0.25, OZ + 0.2), ...pipePoints([...suctionPts].reverse(), 0.06)], 0xff4d3d, { modes: HEAT, r: 0.012, speed: 0.25, also: ['hvac-heating'] });
  flow('hvac-cycle', [...indoorCoil].reverse(), 0xff7a3d, { modes: HEAT, r: 0.013, speed: 0.2, also: ['hvac-heating'] });
  flow('hvac-cycle', [...pipePoints(liquidPts, 0.06), V(SVx, SVy, OZ + 0.3)], 0xffa53d, { modes: HEAT, r: 0.008, speed: 0.2, also: ['hvac-heating'] });
  flow('hvac-cycle', [...outCoil].reverse().concat([accIn, V(OX + 0.12, 0.1, OZ - 0.2)]), 0x4f8cff, { modes: HEAT, r: 0.012, speed: 0.22, also: ['hvac-heating'] });
  // air side
  const ret = [V(RX, 2.62, -0.95), V(RX, 0.25, -0.95), V(-FW / 2 - 0.15, 0.2, -0.95), V(-FW / 2 - 0.15, 0.2, -0.3), V(-0.1, 0.13, 0), V(0, FB + 0.24, 0.02)];
  flow('hvac-air', ret, 0xb4bcc6, { r: 0.022, speed: 0.3, density: 5 });
  const sup = [V(0, FB + 0.4, 0), V(0, fTop + 0.3, 0), V(0, trunkY, 0), V(-1.0, trunkY, 0.02), V(-2.9, trunkY, 0.02)];
  const supColor = { cool: 0x7cc6ff, heat: 0xffa24a, furnace: 0xffa24a };
  for (const m of ['cool', 'heat', 'furnace']) {
    flow('hvac-air', sup, supColor[m], { modes: [m], r: 0.024, speed: 0.34, density: 5, also: ['hvac-heating', 'hvac-fundamentals'] });
    branchX.forEach((bx, i) => flow('hvac-air', i === 2 ? [V(bx, trunkY, 0.02), ...flexPts.slice(1), V(bx + 0.25, 2.8, 0.45)] : [V(bx, trunkY, 0.02), V(bx, 2.8, 0.08)], supColor[m], { modes: [m], r: 0.016, speed: 0.25, density: 7 }));
  }
  flow('hvac-heating', [...ventPts, V(1.9, 1.95, 0.46)], 0xb9b2aa, { modes: GAS, r: 0.018, speed: 0.3, density: 6 });
  flow('hvac-heating', [...gasPts], 0xffd05a, { modes: GAS, r: 0.008, speed: 0.12 });
  flow('hvac-air', condPts, 0x9fd8ff, { modes: COOL, r: 0.007, speed: 0.08, density: 5, idle: false, also: ['hvac-fundamentals'] });

  /* ---------------- motion */
  const tick = (dt, t, cx) => {
    const m = cx.state.mode, rm = !cx.reduced;
    if (rm && m !== 'furnace') fan.rotation.y -= dt * 9;
    if (rm) bl.rotation.z -= dt * 11;
    flames.visible = m === 'furnace' && comp.obj.visible !== undefined;
    if (flames.visible && rm) flames.scale.y = 0.85 + Math.sin(t * 23) * 0.08 + Math.sin(t * 37) * 0.05;
  };
  return { root, comps: A.comps, flows: A.flows, tick };
}
