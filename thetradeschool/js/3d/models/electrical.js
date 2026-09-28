/* Electrical model: one conveyor motor, traced from the transformer to the shaft.
   Dry-type transformer → MCC section → fused safety disconnect (locked out) → control panel
   (PLC, VFD, starter, control transformer, 24 VDC supply) → 3-phase TEFC motor → conveyor with
   its sensors. Panel wiring follows NFPA 79 colours: black power, red AC control, blue DC
   control, orange for circuits that stay live with the disconnect open, green/yellow ground.
   x → right, y up, z toward the viewer. The back wall is at z = -0.62. */
export const meta = {
  id: 'electrical',
  name: 'Conveyor motor circuit',
  plate: '480 V · 3-PHASE · 60 Hz · 120 VAC + 24 VDC CONTROL',
  systems: {
    fundamentals: { name: 'Fundamentals', color: 0xf5e6b8 },
    circuits: { name: 'Circuits', color: 0x9ad0ff },
    components: { name: 'Components', color: 0xf0b429 },
    motors: { name: 'Motors', color: 0x5fd39a },
    controls: { name: 'Controls', color: 0xff5a4a },
    plc: { name: 'PLC + ladder', color: 0x5aa0ff },
    drives: { name: 'Drives', color: 0xc38bff },
    sensors: { name: 'Sensors', color: 0x3fd6c6 },
    power: { name: 'Power', color: 0xffa24a },
    diagnostics: { name: 'Diagnostics', color: 0xe2e2e2 },
    safety: { name: 'Safety', color: 0xff3b30 }
  },
  modes: { run: 'Motor running', stop: 'Stopped' },
  defaultMode: 'run',
  views: {
    overview: { dir: [0.35, 0.38, 1], pad: 1.0 },
    panel: { dir: [0.05, 0.1, 1], box: [[-0.12, 0.62, -0.62], [0.82, 1.9, -0.28]] }
  },
  focus: {
    components: { dir: [0.1, 0.12, 1] }, controls: { dir: [0.1, 0.12, 1] }, plc: { dir: [0.05, 0.1, 1] }, drives: { dir: [0.1, 0.12, 1] },
    motors: { dir: [0.5, 0.35, 1] }, sensors: { dir: [0.7, 0.5, 1] }, power: { dir: [0.25, 0.3, 1] }
  },
  stage: { shadow: 4, grid: 0xf0d58a, fade: 9, minR: 0.3, partR: 0.14 }
};

export function build(k) {
  const { THREE, V, rbox, box, cyl, cylBetween, tube, pipe, pipePoints, merge, at, rotY, rotZ, rotX, helix, lathe, mat, STOCK, CONTEXT } = k;
  const A = k.assembly(meta);
  const { add, ctx, flow, root } = A;
  const RUN = ['run'];
  const W = { black: mat(0x1c1d20, { rough: 0.6 }), red: mat(0xc9302c, { rough: 0.55 }), blue: mat(0x2f6fd6, { rough: 0.55 }), orange: mat(0xf07f1e, { rough: 0.55 }), green: mat(0x2e9e4f, { rough: 0.55 }) };
  const grey = mat(0x8d949c, { rough: 0.45, metal: 0.6 }), panelGrey = mat(0xc9ccc9, { rough: 0.55, metal: 0.3 });
  const plateWhite = mat(0xe9e7e1, { rough: 0.4 });

  /* ---------------- context */
  ctx(at(box(6.6, 0.02, 2.8), 0.4, -0.01, 0.5), CONTEXT.slab());
  ctx(at(box(6.6, 2.6, 0.04), 0.4, 1.3, -0.64), CONTEXT.wall());

  /* ---------------- dry-type transformer */
  const TX = -2.45;
  add('xfmr', 'power', at(rbox(0.8, 1.2, 0.6, 0.012), TX, 0.62, -0.25), { c: ['transformer', 'three-phase'], label: 'Dry-type transformer 480 V', hero: true, shell: true, mat: mat(0x8f9aa3, { metal: 0.4 }), anchor: V(TX, 1.0, 0.05) });
  add('core', 'power', merge([at(box(0.62, 0.08, 0.14), TX, 0.28, -0.25), at(box(0.62, 0.08, 0.14), TX, 1.0, -0.25), ...[-0.22, 0, 0.22].map(x => at(box(0.07, 0.72, 0.14), TX + x, 0.64, -0.25))]), { c: ['transformer'], label: '', labelled: false, mat: mat(0x5a6068, { metal: 0.7 }) });
  add('coils', 'power', merge([-0.22, 0, 0.22].map(x => at(cyl(0.095, 0.56, 'y', 28), TX + x, 0.64, -0.25))), { c: ['transformer', 'inductance'], label: 'Primary + secondary coils', mat: STOCK.copper(), also: ['fundamentals'] });
  add('xterm', 'power', merge([0, 1, 2].map(i => at(cyl(0.012, 0.08, 'y', 10), TX - 0.12 + i * 0.12, 1.06, -0.25))), { c: ['phase-sequence'], label: 'X1 · X2 · X3 terminals', mat: STOCK.brass() });

  /* ---------------- MCC section */
  const MX = -1.45;
  add('mcc', 'power', at(rbox(0.56, 2.1, 0.5, 0.01), MX, 1.05, -0.36), { c: ['mcc'], label: 'MCC section', hero: true, shell: true, mat: panelGrey, anchor: V(MX - 0.2, 1.6, -0.1) });
  add('bus', 'power', merge([0, 1, 2].map(i => at(box(0.02, 1.9, 0.02), MX + 0.18, 1.05, -0.5 + i * 0.05))), { c: ['three-phase', 'kirchhoff-current'], label: 'Vertical bus (L1 L2 L3)', mat: STOCK.copper() });
  add('mainbrk', 'components', merge([at(rbox(0.3, 0.3, 0.12, 0.01), MX - 0.05, 1.82, -0.3), at(rbox(0.05, 0.1, 0.03, 0.006), MX - 0.05, 1.82, -0.23)]), { c: ['breaker', 'short-circuit'], label: 'Circuit breaker', mat: mat(0x2b2f35), also: ['circuits'] });
  add('buckets', 'power', merge([1.4, 1.0, 0.6].map(y => merge([at(box(0.5, 0.36, 0.01), MX, y, -0.105), at(rbox(0.04, 0.08, 0.03, 0.005), MX + 0.18, y, -0.09)]))), { c: ['mcc'], label: '', labelled: false, mat: mat(0xb3b8b5, { metal: 0.3 }) });
  // feeder from transformer to MCC (overhead conduit)
  add('feed1', 'power', pipe([V(TX, 1.22, -0.35), V(TX, 2.3, -0.35), V(MX - 0.1, 2.3, -0.35), V(MX - 0.1, 2.1, -0.35)], 0.028, 0.12), { c: ['three-phase'], label: '', labelled: false, mat: STOCK.galv() });

  /* ---------------- fused safety disconnect, locked out */
  const DX = -0.72, DY = 1.3;
  add('disc', 'components', merge([at(rbox(0.32, 0.46, 0.18, 0.01), DX, DY, -0.53)]), { c: ['disconnect', 'open-circuit'], label: 'Fused disconnect', hero: true, shell: true, mat: mat(0x7d858d, { metal: 0.5 }), also: ['circuits', 'safety'] });
  add('discfuses', 'components', merge([0, 1, 2].map(i => merge([at(cyl(0.018, 0.13, 'y', 14), DX - 0.08 + i * 0.08, DY - 0.04, -0.53), at(cyl(0.02, 0.02, 'y', 14), DX - 0.08 + i * 0.08, DY + 0.04, -0.53), at(cyl(0.02, 0.02, 'y', 14), DX - 0.08 + i * 0.08, DY - 0.12, -0.53)]))), { c: ['fuse'], label: 'Class J fuses', mat: mat(0xd9d2c0, { rough: 0.5 }) });
  add('handle', 'components', merge([at(rbox(0.04, 0.2, 0.04, 0.008), DX + 0.19, DY + 0.02, -0.46), at(rbox(0.06, 0.04, 0.02, 0.006), DX + 0.19, DY - 0.07, -0.43)]), { c: ['disconnect'], label: '', labelled: false, mat: mat(0x22262b) });
  add('loto', 'safety', merge([at(rbox(0.035, 0.045, 0.02, 0.006), DX + 0.19, DY - 0.12, -0.42), at(new THREE.TorusGeometry(0.014, 0.004, 8, 16, Math.PI), DX + 0.19, DY - 0.095, -0.42), at(box(0.06, 0.1, 0.002), DX + 0.2, DY - 0.22, -0.415)]), { c: ['safety-loto'], label: 'Lock + tag (LOTO)', mat: mat(0xd33a2c) });
  add('aflabel', 'safety', at(box(0.18, 0.12, 0.003), DX - 0.03, DY + 0.12, -0.438), { c: ['arc-flash'], label: 'Arc-flash label', mat: mat(0xf2a33a, { rough: 0.4 }) });
  add('feed2', 'power', pipe([V(MX + 0.1, 2.1, -0.4), V(MX + 0.1, 2.25, -0.45), V(DX, 2.25, -0.53), V(DX, DY + 0.23, -0.53)], 0.022, 0.1), { c: ['conductor-size'], label: '', labelled: false, mat: STOCK.galv() });

  /* ---------------- control panel: enclosure shell, backplate, devices, door devices */
  const PX = 0.35, PY = 1.25, PW = 1.0, PH = 1.28, BZ = -0.585;
  add('panel', 'components', at(rbox(PW, PH, 0.32, 0.012), PX, PY, -0.45), { c: [], label: 'Control panel', hero: true, shell: true, noPick: true, mat: mat(0xb9bdb8, { metal: 0.35 }), anchor: V(PX + 0.46, PY + 0.45, -0.3) });
  ctx(at(box(PW - 0.06, PH - 0.06, 0.01), PX, PY, BZ - 0.005), mat(0xe6e3dc, { rough: 0.7 }));
  // wire duct
  const ducts = [1.62, 1.3, 0.98, 0.72].map(y => at(box(PW - 0.1, 0.05, 0.06), PX, y, BZ + 0.03));
  ctx(merge([...ducts, at(box(0.05, PH - 0.12, 0.06), PX - PW / 2 + 0.06, PY, BZ + 0.03), at(box(0.05, PH - 0.12, 0.06), PX + PW / 2 - 0.06, PY, BZ + 0.03)]), mat(0x6f7478, { rough: 0.7, opacity: 0.55 }), { edges: false });
  const row1 = 1.75, row2 = 1.46, row3 = 1.14, row4 = 0.85, dz = BZ + 0.05;
  add('ctrlxfmr', 'power', merge([at(rbox(0.1, 0.09, 0.09, 0.008), PX - 0.36, row1, dz), at(box(0.1, 0.02, 0.1), PX - 0.36, row1 - 0.05, dz)]), { c: ['control-transformer', 'control-circuit'], label: 'Control transformer 480/120', mat: mat(0x3b4148, { metal: 0.5 }), also: ['controls'] });
  add('psu', 'power', merge([at(rbox(0.09, 0.1, 0.1, 0.006), PX - 0.22, row1, dz)]), { c: ['power-supply', 'ac-dc'], label: '24 VDC power supply', mat: mat(0xa8aeb4, { metal: 0.7 }), also: ['fundamentals'] });
  add('phasemon', 'power', at(rbox(0.035, 0.08, 0.08, 0.005), PX - 0.12, row1, dz), { c: ['phase-loss', 'phase-sequence'], label: 'Phase monitor relay', mat: mat(0x5b7a9a) });
  add('safetyrelay', 'controls', at(rbox(0.035, 0.1, 0.1, 0.005), PX - 0.06, row1, dz), { c: ['safety-relay'], label: 'Safety relay', mat: mat(0xe8c93a) });
  add('relays', 'components', merge([0, 1, 2].map(i => merge([at(rbox(0.03, 0.05, 0.035, 0.004), PX + 0.02 + i * 0.045, row1 + 0.01, dz + 0.02), at(rbox(0.035, 0.03, 0.04, 0.004), PX + 0.02 + i * 0.045, row1 - 0.035, dz)]))), { c: ['relay'], label: 'Ice-cube relays', mat: mat(0xd8dde2, { opacity: 0.85 }) });
  add('mcpfuses', 'components', merge([0, 1, 2].map(i => at(rbox(0.022, 0.08, 0.07, 0.004), PX + 0.22 + i * 0.026, row1, dz))), { c: ['fuse'], label: 'Branch fuse holders', labelled: false, mat: mat(0x2a2e33) });
  add('heater', 'fundamentals', merge([at(rbox(0.14, 0.05, 0.04, 0.006), PX + 0.36, row1, dz), ...Array.from({ length: 6 }, (_, i) => at(box(0.004, 0.05, 0.045), PX + 0.3 + i * 0.024, row1, dz))]), { c: ['resistance', 'power'], label: 'Enclosure heater (resistive load)', mat: mat(0x9ea4aa, { metal: 0.7 }) });
  // PLC rack
  add('cpu', 'plc', merge([at(rbox(0.1, 0.13, 0.09, 0.006), PX - 0.33, row2, dz), at(box(0.06, 0.03, 0.005), PX - 0.33, row2 + 0.03, dz + 0.046)]), { c: ['plc', 'scan-cycle', 'ladder-logic', 'timer', 'counter'], label: 'PLC CPU', hero: true, mat: mat(0x3a4450, { metal: 0.3 }), anchor: V(PX - 0.33, row2, dz + 0.05) });
  add('dicard', 'plc', merge([0, 1].map(i => at(rbox(0.035, 0.13, 0.09, 0.004), PX - 0.26 + i * 0.038, row2, dz))), { c: ['plc-inputs', 'sinking-sourcing', 'normally-open'], label: 'Input cards', mat: mat(0x4a79b8, { metal: 0.2 }) });
  add('docard', 'plc', at(rbox(0.035, 0.13, 0.09, 0.004), PX - 0.184, row2, dz), { c: ['plc-outputs'], label: 'Output card', mat: mat(0xc8503c, { metal: 0.2 }) });
  add('aicard', 'plc', at(rbox(0.035, 0.13, 0.09, 0.004), PX - 0.146, row2, dz), { c: ['analog-signals', '4-20ma'], label: 'Analog card (4–20 mA)', mat: mat(0x3fa47a, { metal: 0.2 }) });
  add('softstart', 'drives', merge([at(rbox(0.1, 0.16, 0.1, 0.008), PX + 0.02, row2, dz), at(box(0.06, 0.03, 0.005), PX + 0.02, row2 + 0.04, dz + 0.051)]), { c: ['soft-starter'], label: 'Soft starter', mat: mat(0x6b7682, { metal: 0.3 }) });
  add('ct', 'diagnostics', merge([at(new THREE.TorusGeometry(0.025, 0.012, 10, 20), PX + 0.2, row2, dz + 0.02), at(cyl(0.006, 0.12, 'y', 8), PX + 0.2, row2, dz + 0.02)]), { c: ['current-transformer'], label: 'Current transformer', mat: mat(0x2b2f33) });
  // drives + starters
  const vfd = add('vfd', 'drives', merge([at(rbox(0.2, 0.34, 0.14, 0.012), PX - 0.3, row3 - 0.02, dz + 0.02), at(rbox(0.08, 0.06, 0.01, 0.004), PX - 0.3, row3 + 0.07, dz + 0.095), ...Array.from({ length: 6 }, (_, i) => at(box(0.16, 0.006, 0.01), PX - 0.3, row3 - 0.14 + i * 0.012, dz + 0.095))]),
    { c: ['vfd', 'frequency'], label: 'Variable frequency drive', hero: true, shell: true, mat: mat(0x2e3339, { metal: 0.3 }), also: ['fundamentals'], anchor: V(PX - 0.38, row3 + 0.05, dz + 0.1) });
  add('dcbus', 'drives', merge([...[0, 1, 2].map(i => at(cyl(0.022, 0.08, 'y', 18), PX - 0.36 + i * 0.05, row3 + 0.06, dz)), at(box(0.12, 0.05, 0.03), PX - 0.3, row3 - 0.07, dz), ...[0, 1, 2].map(i => at(box(0.03, 0.03, 0.02), PX - 0.35 + i * 0.05, row3 - 0.12, dz))]),
    { c: ['dc-bus', 'capacitance', 'stored-energy'], label: 'DC bus capacitors', mat: mat(0x3a5ea8, { metal: 0.4 }), also: ['fundamentals', 'safety'] });
  const contactor = (x, y, id, sys, c, label, o = {}) => add(id, sys, merge([at(rbox(0.055, 0.075, 0.07, 0.006), x, y, dz), at(rbox(0.045, 0.02, 0.03, 0.004), x, y + 0.045, dz + 0.01), ...[-0.017, 0, 0.017].map(d => at(cyl(0.004, 0.012, 'y', 8), x + d, y + 0.043, dz + 0.03))]), { c, label, mat: mat(0x3c4047, { metal: 0.3 }), ...o });
  const K1 = contactor(PX - 0.08, row3 + 0.03, 'k1', 'components', ['contactor', 'motor-starter'], 'Contactor (K1)', { also: ['motors'] });
  add('k1coil', 'components', at(rbox(0.04, 0.025, 0.02, 0.004), PX - 0.08, row3 + 0.03, dz + 0.045), { c: ['coil', 'inductance'], label: 'Contactor coil', mat: mat(0x2d7fd6), labelled: false, also: ['fundamentals'] });
  add('aux', 'components', at(rbox(0.018, 0.06, 0.06, 0.004), PX - 0.04, row3 + 0.03, dz), { c: ['aux-contact', 'seal-in'], label: 'Aux contact (seal-in)', mat: mat(0x51565e), also: ['controls'] });
  add('ol', 'motors', merge([at(rbox(0.055, 0.05, 0.07, 0.006), PX - 0.08, row3 - 0.045, dz), at(cyl(0.008, 0.01, 'z', 12), PX - 0.08, row3 - 0.045, dz + 0.04)]), { c: ['overload', 'motor-starter'], label: 'Overload relay', mat: mat(0x4a5058) });
  contactor(PX + 0.07, row3 + 0.03, 'kf', 'motors', ['reversing-starter'], 'Reversing starter (F/R)');
  contactor(PX + 0.14, row3 + 0.03, 'kr', 'motors', ['reversing-starter'], '', { labelled: false });
  add('interlock', 'controls', at(box(0.02, 0.02, 0.07), PX + 0.105, row3 + 0.03, dz), { c: ['interlock'], label: 'Mechanical interlock', mat: mat(0xf07f1e) });
  // terminals + ground bar
  add('terminals', 'components', merge(Array.from({ length: 22 }, (_, i) => at(rbox(0.012, 0.06, 0.05, 0.002), PX - 0.36 + i * 0.016, row4, dz))), { c: ['terminal-block'], label: 'Terminal blocks', mat: mat(0x8fa9c8, { rough: 0.6 }) });
  add('gndbar', 'safety', merge([at(box(0.16, 0.02, 0.02), PX + 0.3, row4 - 0.02, dz), ...Array.from({ length: 6 }, (_, i) => at(cyl(0.004, 0.02, 'z', 6), PX + 0.24 + i * 0.024, row4 - 0.02, dz + 0.015))]), { c: ['grounding'], label: 'Ground bar', mat: STOCK.copper() });
  add('gndwires', 'safety', merge([tube([V(PX + 0.26, row4 - 0.02, dz), V(PX + 0.2, row4 - 0.1, dz), V(PX + 0.1, 0.66, dz)], 0.003), tube([V(PX + 0.34, row4 - 0.02, dz), V(PX + 0.4, 0.75, dz), V(PX + 0.44, 0.62, dz)], 0.003)]), { c: ['grounding'], labelled: false, mat: W.green });
  // panel wiring by NFPA 79 colour
  add('wires', 'controls', merge([
    tube([V(PX - 0.36, row1 - 0.05, dz), V(PX - 0.36, row2 + 0.1, dz + 0.02), V(PX - 0.1, row2 + 0.12, dz + 0.02), V(PX - 0.08, row3 + 0.06, dz + 0.02)], 0.0028),
    tube([V(PX + 0.04, row1 - 0.04, dz), V(PX + 0.04, row3 + 0.08, dz + 0.03), V(PX + 0.07, row3 + 0.06, dz + 0.02)], 0.0028)]), { c: ['control-circuit'], label: '', labelled: false, mat: W.red });
  add('dcwires', 'plc', merge([tube([V(PX - 0.22, row1 - 0.05, dz), V(PX - 0.25, row2 + 0.07, dz + 0.02), V(PX - 0.26, row2 - 0.07, dz + 0.02), V(PX - 0.25, row4 + 0.03, dz + 0.02)], 0.0028), tube([V(PX - 0.146, row2 - 0.07, dz + 0.02), V(PX - 0.2, row3 + 0.12, dz + 0.04), V(PX - 0.26, row3 + 0.09, dz + 0.08)], 0.0028)]), { c: ['analog-signals'], label: '', labelled: false, mat: W.blue });
  add('pwires', 'components', merge([-0.02, 0, 0.02].map(d => tube([V(PX + 0.23 + d, row1 - 0.05, dz), V(PX + 0.23 + d, row2 + 0.1, dz + 0.02), V(PX - 0.08 + d, row3 + 0.12, dz + 0.02), V(PX - 0.08 + d, row3 + 0.05, dz + 0.02)], 0.0035))), { c: ['conductor-size'], label: '', labelled: false, mat: W.black });
  add('ilwire', 'safety', tube([V(PX + 0.23, PY + PH / 2 - 0.02, dz), V(PX + 0.3, row1 + 0.08, dz), V(PX + 0.3, row4 + 0.04, dz + 0.02)], 0.0028), { c: [], label: 'Orange: live with disconnect off', labelled: false, mat: W.orange });
  // operator station on a pedestal by the conveyor: HMI, pushbuttons, selector, E-stop
  const OSx = 1.05, OSz = 0.95, OSy = 1.12;
  ctx(merge([at(cyl(0.03, OSy - 0.1, 'y', 14), OSx, (OSy - 0.1) / 2, OSz), at(box(0.3, 0.02, 0.3), OSx, 0.01, OSz)]), mat(0x6c747c, { metal: 0.6 }), { cast: true });
  const os = new THREE.Group(); os.position.set(OSx, OSy, OSz); os.rotation.x = -0.35; root.add(os);
  const FZ = 0.06;
  add('osbox', 'controls', at(rbox(0.46, 0.2, 0.12, 0.012), 0, 0, 0), { c: [], label: '', labelled: false, noPick: true, parent: os, mat: mat(0xb9bdb8, { metal: 0.35 }) });
  add('hmi', 'plc', merge([at(rbox(0.2, 0.15, 0.02, 0.01), -0.11, 0, FZ), at(box(0.17, 0.12, 0.004), -0.11, 0, FZ + 0.011)]), { c: ['hmi', 'timer', 'counter'], label: 'HMI touchscreen', parent: os, mat: mat(0x1b2128, { rough: 0.3 }) });
  const btn = (x, y, color, id, c, label, o = {}) => add(id, o.sys || 'components', merge([at(cyl(0.022, 0.016, 'z', 20), x, y, FZ + 0.004), at(cyl(0.016, 0.016, 'z', 20), x, y, FZ + 0.016)]), { c, label, parent: os, mat: mat(color, { rough: 0.35 }), ...o });
  btn(0.05, 0.045, 0x2ea44f, 'start', ['pushbutton', 'normally-open', 'series-parallel'], 'START (NO)', { also: ['circuits', 'plc'] });
  btn(0.11, 0.045, 0xd33a2c, 'stop', ['normally-closed', 'series-parallel'], 'STOP (NC)', { also: ['plc', 'circuits'] });
  add('selector', 'components', merge([at(cyl(0.022, 0.016, 'z', 20), 0.05, -0.04, FZ + 0.004), at(rbox(0.01, 0.036, 0.016, 0.003), 0.05, -0.04, FZ + 0.02)]), { c: ['selector-switch'], label: 'Selector H-O-A', parent: os, mat: mat(0x2a2e33) });
  add('pilots', 'components', at(cyl(0.014, 0.016, 'z', 16), 0.11, -0.04, FZ + 0.008), { c: [], label: 'Pilot light', labelled: false, parent: os, mat: mat(0x6bd46b, { emissive: 0x2a8a2a, ei: 0.6 }) });
  add('estop', 'controls', merge([at(cyl(0.024, 0.016, 'z', 20), 0.18, 0, FZ + 0.004), at(cyl(0.036, 0.026, 'z', 24), 0.18, 0, FZ + 0.024)]), { c: ['emergency-stop'], label: 'Emergency stop', parent: os, mat: mat(0xd33a2c, { rough: 0.35 }) });
  add('estopring', 'controls', at(box(0.09, 0.09, 0.003), 0.18, 0, FZ + 0.001), { c: [], labelled: false, noPick: true, parent: os, mat: mat(0xf2c21b) });
  add('oscable', 'controls', pipe([V(OSx, 0.02, OSz - 0.02), V(OSx, 0.02, -0.2), V(PX + 0.3, 0.02, -0.5), V(PX + 0.3, PY - PH / 2, -0.5)], 0.012, 0.08), { c: ['control-circuit'], label: '', labelled: false, mat: mat(0x2a2e33, { rough: 0.7 }) });
  add('feed3', 'power', pipe([V(DX, DY - 0.23, -0.53), V(DX, 0.45, -0.53), V(PX - 0.3, 0.45, -0.53), V(PX - 0.3, PY - PH / 2, -0.53)], 0.022, 0.08), { c: ['conductor-size'], label: '', labelled: false, mat: STOCK.galv() });
  add('clamp', 'diagnostics', merge([at(new THREE.TorusGeometry(0.045, 0.012, 10, 24).rotateX(Math.PI / 2), DX, 0.75, -0.53), at(rbox(0.07, 0.16, 0.035, 0.012), DX + 0.07, 0.67, -0.5)]), { c: ['clamp-meter', 'current'], label: 'Clamp meter (amps)', mat: mat(0xf0c43a), also: ['fundamentals'] });

  /* ---------------- motor + gear reducer + conveyor */
  const MY = 0.28, MXc = 1.35, MZ = -0.28, ML = 0.52;
  add('motorframe', 'motors', merge([at(cyl(0.17, ML, 'x', 36), MXc, MY, MZ), ...Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return at(rotX(box(ML - 0.04, 0.03, 0.006), a), MXc, MY + Math.cos(a) * 0.175, MZ + Math.sin(a) * 0.175); }), at(box(0.34, 0.1, 0.28), MXc, 0.06, MZ), at(cyl(0.16, 0.12, 'x', 32, 0.16), MXc - ML / 2 - 0.06, MY, MZ)]),
    { c: ['motor-basics', 'power'], label: '3-phase induction motor', hero: true, shell: true, mat: mat(0x3d6f9e, { metal: 0.4 }), anchor: V(MXc, MY + 0.2, MZ + 0.15) });
  add('stator', 'motors', merge([at(cyl(0.15, 0.3, 'x', 32, 0.15, true), MXc, MY, MZ), at(new THREE.TorusGeometry(0.12, 0.028, 10, 28).rotateY(Math.PI / 2), MXc - 0.16, MY, MZ), at(new THREE.TorusGeometry(0.12, 0.028, 10, 28).rotateY(Math.PI / 2), MXc + 0.16, MY, MZ)]), { c: ['impedance', 'inductance'], label: 'Stator windings', mat: STOCK.copper(), also: ['fundamentals'] });
  const rotor = new THREE.Group(); rotor.position.set(MXc, MY, MZ);
  rotor.add(new THREE.Mesh(merge([cyl(0.09, 0.3, 'x', 28), ...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return at(box(0.31, 0.012, 0.012), 0, Math.cos(a) * 0.09, Math.sin(a) * 0.09); }), cyl(0.022, ML + 0.34, 'x', 16)]), mat(0x8e969e, { metal: 0.85, rough: 0.35 })));
  add('rotor', 'motors', rotor, { c: ['motor-slip'], label: 'Rotor + shaft', anchor: V(MXc + 0.1, MY + 0.06, MZ + 0.1) });
  add('jbox', 'motors', merge([at(rbox(0.12, 0.08, 0.12, 0.01), MXc, MY + 0.21, MZ)]), { c: ['motor-basics'], label: 'Conduit box (T1-T2-T3)', labelled: false, mat: mat(0x3d6f9e, { metal: 0.4 }) });
  add('nameplate', 'motors', at(box(0.12, 0.07, 0.003), MXc + 0.02, MY + 0.02, MZ + 0.178), { c: ['motor-nameplate'], label: 'Nameplate', mat: mat(0xdad7cc, { metal: 0.8, rough: 0.3 }) });
  add('feed4', 'circuits', pipe([V(PX - 0.1, PY - PH / 2, -0.5), V(PX - 0.1, 0.02, -0.5), V(MXc, 0.02, -0.5), V(MXc, 0.02, MZ - 0.12), V(MXc, MY + 0.25, MZ - 0.05), V(MXc, MY + 0.25, MZ)], 0.02, 0.08), { c: ['voltage-drop', 'conductor-size'], label: 'Motor feeder conduit', mat: STOCK.galv(), also: ['components'] });
  add('gearbox', 'motors', merge([at(rbox(0.22, 0.26, 0.24, 0.02), 1.75, 0.3, MZ), at(cyl(0.03, 0.14, 'x', 16), 1.9, 0.3, MZ)]), { c: [], label: 'Gear reducer', mat: mat(0x3d6f9e, { metal: 0.4 }) });
  // conveyor along z
  const CX = 2.15, CW = 0.5, CY = 0.62, Z0 = MZ, Z1 = 1.55;
  ctx(merge([at(box(0.04, 0.08, Z1 - Z0 + 0.1), CX - CW / 2 - 0.03, CY - 0.05, (Z0 + Z1) / 2), at(box(0.04, 0.08, Z1 - Z0 + 0.1), CX + CW / 2 + 0.03, CY - 0.05, (Z0 + Z1) / 2), ...[Z0 + 0.1, (Z0 + Z1) / 2, Z1 - 0.1].flatMap(z => [at(box(0.04, CY - 0.05, 0.04), CX - CW / 2 - 0.03, (CY - 0.05) / 2, z), at(box(0.04, CY - 0.05, 0.04), CX + CW / 2 + 0.03, (CY - 0.05) / 2, z)])]), mat(0x6c747c, { metal: 0.6 }), { cast: true });
  const head = new THREE.Group(); head.position.set(CX, CY - 0.05, Z0); head.add(new THREE.Mesh(cyl(0.06, CW - 0.02, 'x', 24), grey));
  const tail = new THREE.Group(); tail.position.set(CX, CY - 0.05, Z1); tail.add(new THREE.Mesh(cyl(0.06, CW - 0.02, 'x', 24), grey));
  root.add(head, tail);
  const beltTop = at(box(CW - 0.04, 0.012, Z1 - Z0), CX, CY + 0.012, (Z0 + Z1) / 2);
  ctx(merge([beltTop, at(box(CW - 0.04, 0.012, Z1 - Z0), CX, CY - 0.11, (Z0 + Z1) / 2)]), mat(0x1f2226, { rough: 0.9 }), { cast: true });
  const cartons = new THREE.Group(); root.add(cartons);
  const cartonList = [0, 1, 2].map(i => { const m = new THREE.Mesh(rbox(0.22, 0.16, 0.2, 0.01), mat(0xb88a52, { rough: 0.9 })); m.castShadow = true; m.position.set(CX, CY + 0.1, Z0 + 0.3 + i * 0.6); cartons.add(m); return m; });
  // sensors
  add('photoeye', 'sensors', merge([at(rbox(0.04, 0.06, 0.03, 0.006), CX - CW / 2 - 0.08, CY + 0.12, 0.6), at(cyl(0.012, 0.01, 'x', 12), CX - CW / 2 - 0.055, CY + 0.12, 0.6)]), { c: ['photoeye'], label: 'Photoeye', mat: mat(0xf0c43a) });
  add('reflector', 'sensors', at(box(0.005, 0.06, 0.05), CX + CW / 2 + 0.06, CY + 0.12, 0.6), { c: ['photoeye'], label: '', labelled: false, mat: mat(0xd3302c, { rough: 0.2 }) });
  const beam = new THREE.Mesh(cylBetween(V(CX - CW / 2 - 0.05, CY + 0.12, 0.6), V(CX + CW / 2 + 0.055, CY + 0.12, 0.6), 0.003), new THREE.MeshBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0.8 })); root.add(beam);
  add('prox', 'sensors', merge([at(cyl(0.012, 0.09, 'x', 16), CX + CW / 2 + 0.1, CY - 0.05, Z1 - 0.02), at(cyl(0.004, 0.2, 'y', 8), CX + CW / 2 + 0.14, CY - 0.15, Z1 - 0.02)]), { c: ['proximity-sensor', 'pnp-npn'], label: 'Inductive prox sensor', mat: mat(0xc7cdd3, { metal: 0.9 }) });
  add('limit', 'sensors', merge([at(rbox(0.05, 0.08, 0.04, 0.006), CX + CW / 2 + 0.08, CY + 0.08, Z1 - 0.35), cylBetween(V(CX + CW / 2 + 0.08, CY + 0.12, Z1 - 0.33), V(CX + CW / 2 - 0.02, CY + 0.18, Z1 - 0.33), 0.004), at(cyl(0.015, 0.01, 'x', 12), CX + CW / 2 - 0.02, CY + 0.18, Z1 - 0.33)]), { c: ['limit-switch'], label: 'Limit switch', mat: mat(0x5a6168) });
  add('encoder', 'sensors', merge([at(cyl(0.035, 0.05, 'x', 20), CX + CW / 2 + 0.05, CY - 0.05, Z1), at(cyl(0.004, 0.25, 'y', 8), CX + CW / 2 + 0.08, CY - 0.18, Z1)]), { c: ['encoder'], label: 'Encoder', mat: mat(0x3b4148, { metal: 0.6 }) });
  add('solenoid', 'components', merge([at(rbox(0.06, 0.05, 0.05, 0.006), CX - CW / 2 - 0.1, CY - 0.2, 1.1), at(cyl(0.018, 0.05, 'y', 14), CX - CW / 2 - 0.1, CY - 0.15, 1.1)]), { c: ['solenoid'], label: 'Solenoid valve', mat: mat(0x2b2f33) });

  /* ---------------- tool cart: meters */
  const TCx = -0.3, TCz = 1.0;
  ctx(merge([at(box(0.6, 0.02, 0.4), TCx, 0.8, TCz), at(box(0.6, 0.02, 0.4), TCx, 0.3, TCz), ...[[-0.28, -0.18], [0.28, -0.18], [-0.28, 0.18], [0.28, 0.18]].map(([x, z]) => at(box(0.02, 0.8, 0.02), TCx + x, 0.4, TCz + z))]), mat(0x8e2a22, { metal: 0.4 }), { cast: true });
  add('dmm', 'diagnostics', merge([at(rbox(0.09, 0.02, 0.17, 0.01), TCx - 0.14, 0.82, TCz), at(cyl(0.025, 0.01, 'y', 16), TCx - 0.14, 0.835, TCz + 0.02)]), { c: ['multimeter', 'voltage', 'rms'], label: 'Multimeter', mat: mat(0xf0c43a), also: ['fundamentals'] });
  add('leads', 'diagnostics', merge([tube([V(TCx - 0.16, 0.83, TCz - 0.08), V(TCx - 0.25, 0.9, TCz - 0.3), V(TCx - 0.1, 0.84, TCz - 0.1)], 0.003)]), { c: ['multimeter'], labelled: false, mat: W.red });
  add('megger', 'diagnostics', merge([at(rbox(0.16, 0.1, 0.12, 0.012), MXc - 0.1, 0.05, 0.25), tube([V(MXc - 0.1, 0.1, 0.2), V(MXc - 0.05, 0.4, 0.05), V(MXc, MY + 0.22, MZ + 0.06)], 0.003)]), { c: ['insulation-resistance'], label: 'Megohmmeter', mat: mat(0xe6b21e) });
  add('thermal', 'diagnostics', merge([at(rbox(0.07, 0.18, 0.1, 0.012), TCx + 0.12, 0.9, TCz), at(cyl(0.025, 0.04, 'z', 16), TCx + 0.12, 0.96, TCz - 0.06)]), { c: ['thermal-imaging'], label: 'Thermal imager', mat: mat(0x3a3f45) });
  add('method', 'diagnostics', at(box(0.18, 0.004, 0.24), TCx + 0.12, 0.315, TCz), { c: ['diagnostics-method'], label: 'Prints + test plan', mat: mat(0x9fc3e8, { rough: 0.9 }) });

  /* ---------------- flows: 3-phase power (only through a closed contactor), 120 VAC control, 24 VDC signals */
  const ph = ['#b0703a', '#f07f1e', '#f2c21b'];
  [-0.012, 0, 0.012].forEach((d, i) => {
    const up = [V(TX - 0.12 + i * 0.12, 1.06, -0.25), V(TX + d, 2.3, -0.35 + d), V(MX - 0.1 + d, 2.3, -0.35), V(MX + 0.18, 1.9, -0.5 + i * 0.05), V(MX + 0.1 + d, 2.25, -0.45), V(DX + d, 2.25, -0.53), V(DX - 0.08 + i * 0.08, DY + 0.05, -0.53), V(DX - 0.08 + i * 0.08, DY - 0.15, -0.53), V(DX + d, 0.45, -0.53), V(PX - 0.3 + d, 0.45, -0.53), V(PX + 0.23 + d, row1 - 0.05, dz), V(PX - 0.08 + d, row3 + 0.05, dz + 0.02)];
    flow('power', up, ph[i], { r: 0.009, speed: 0.35, density: 5, also: ['components', 'fundamentals', 'circuits'] });
    flow('power', [V(PX - 0.08 + d, row3 - 0.07, dz + 0.02), V(PX - 0.1 + d, PY - PH / 2, -0.5), V(PX - 0.1 + d, 0.02, -0.5), V(MXc + d, 0.02, -0.5), V(MXc, 0.02, MZ - 0.12), V(MXc + d, MY + 0.25, MZ)], ph[i], { r: 0.009, speed: 0.35, density: 5, modes: RUN, also: ['motors', 'circuits', 'fundamentals'] });
  });
  flow('controls', [V(PX - 0.36, row1 - 0.05, dz + 0.02), V(PX - 0.1, row2 + 0.12, dz + 0.03), V(PX + 0.3, PY - PH / 2, -0.5), V(PX + 0.3, 0.03, -0.5), V(OSx, 0.03, -0.2), V(OSx, 0.03, OSz), V(OSx + 0.08, OSy, OSz + 0.05), V(OSx, 0.05, OSz), V(PX + 0.3, 0.05, -0.5), V(PX + 0.3, PY - PH / 2, -0.52), V(PX - 0.04, row3 + 0.06, dz + 0.04), V(PX - 0.08, row3 + 0.03, dz + 0.05)], 0xff4b3e, { r: 0.006, speed: 0.2, density: 12, also: ['components', 'plc'] });
  flow('plc', [V(CX - CW / 2 - 0.08, CY + 0.12, 0.6), V(CX - CW / 2 - 0.1, 0.1, 0.4), V(PX + 0.2, 0.1, -0.2), V(PX - 0.25, row4, dz + 0.04), V(PX - 0.26, row2, dz + 0.05)], 0x4f8cff, { r: 0.006, speed: 0.25, density: 10, also: ['sensors'] });
  flow('plc', [V(PX - 0.146, row2 - 0.07, dz + 0.04), V(PX - 0.2, row3 + 0.12, dz + 0.06), V(PX - 0.26, row3 + 0.09, dz + 0.09)], 0x3fd69a, { r: 0.005, speed: 0.12, density: 14, also: ['drives'] });

  /* ---------------- motion */
  const tick = (dt, t, cx) => {
    if (cx.reduced) return;
    const running = cx.state.mode === 'run';
    if (running) {
      rotor.rotation.x += dt * 14;
      head.rotation.x -= dt * 3; tail.rotation.x -= dt * 3;
      cartonList.forEach(m => { m.position.z += dt * 0.18; if (m.position.z > Z1 - 0.12) m.position.z = Z0 + 0.12; });
    }
    beam.material.opacity = cartonList.some(m => Math.abs(m.position.z - 0.6) < 0.1) ? 0.15 : 0.8;
  };
  return { root, comps: A.comps, flows: A.flows, tick };
}
