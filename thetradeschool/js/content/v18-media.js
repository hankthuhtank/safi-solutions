/* =============================================================================
   TradeSchool V18 — 3D models replace the photos that did not teach
   -----------------------------------------------------------------------------
   Every trade now has a procedural 3D model (js/3d/models/) with 425 of the 428
   topics placed on a real, named part. A topic's first visual is now its part on
   that model, so a photo only stays where it adds something the model cannot:
   a real, current, clearly-shot piece of equipment or a drawn diagram of a
   relationship (ratios, sequences, P-T behaviour).

   RETIRED: wrong subject, antique equipment, duplicates, or too small to read.
   Reasons are kept as data, same as the V15 audit, so they survive in the repo.
   ========================================================================== */
(() => {
  const D = window.TRADE_DATA;
  if (!D || !D.visualAssets) return;

  const RETIRED = {
    'assets/reference/electrical/contactor.jpg': 'Antique open-frame contactor on a wooden base. Looks nothing like a modern IEC or NEMA contactor.',
    'assets/reference/electrical/vfd.jpg': 'Dated drive with an open terminal cover and loose wiring; the 3D panel shows a current drive in context.',
    'assets/reference/hvac/txv.jpg': 'Scanned line drawing, low contrast. The 3D coil shows the TXV, its bulb and its lines in place.',
    'assets/reference/plumbing/ptrap.jpg': 'Rusted cast trap on a painted wall. Not what a learner will install or inspect.',
    'assets/reference/openverse/electrical/multimeter_flickr.jpg': '480 px snapshot of an older meter; replaced by the clean multimeter photo.',
    'assets/reference/openverse/electrical/limit_switch.jpg': 'Shows a DIN-rail panel, not a limit switch.',
    'assets/reference/openverse/plumbing/copper_fittings.jpg': 'Shows threaded brass fittings, captioned as copper sweat and press fittings.',
    'assets/reference/openverse/welding/oxyfuel.jpg': 'Hobby brazing kit on a table, not an oxy-fuel outfit.',
    'assets/reference/openverse/construction/formwork_flickr.jpg': 'Duplicate of the concrete-pour photo, captioned as formwork.',
    'assets/reference/openverse/construction/rebar_cage.jpg': 'A person pointing at a site; no rebar cage visible.',
    'assets/reference/construction/light_framing.jpg': 'Distant houses behind a field; the framing is a few pixels tall.',
    'assets/reference/welding/helmet_lens_closeup.jpg': 'Blurry lens close-up that does not show shade numbers.',
    'assets/reference/welding/welding_helmet.jpg': 'Dated fixed-shade helmet on a floor.'
  };
  /* real photos that were stretched to cover topics they do not show */
  const NARROW = {
    'assets/hero/hvac-rooftop.jpg': ['airflow-cfm', 'blower', 'ductwork', 'return-air', 'supply-air'],
    'assets/hero/electrical-mcc.jpg': ['disconnect', 'breaker', 'fuse']
  };
  const removed = D.removedMedia = D.removedMedia || {};
  let n = 0;
  for (const [id, a] of Object.entries(D.visualAssets)) {
    if (!a) continue;
    if (RETIRED[a.src]) { removed[a.src] = RETIRED[a.src]; delete D.visualAssets[id]; n++; continue; }
    if (NARROW[a.src]?.includes(id)) { delete D.visualAssets[id]; n++; }
  }
  // the clean meter photo takes over for the meter topics only
  const meter = { src: 'assets/reference/electrical/multimeter.jpg', title: 'Digital multimeter', caption: 'Function dial, range and the jacks the leads plug into decide what the reading means.', credit: 'oomlout / Wikimedia Commons', license: 'CC BY-SA 2.0' };
  D.visualAssets.multimeter = meter;

  /* trade heroes: rendered stills of each trade's 3D model (tools/render-stills.mjs) */
  const label = { electrical: 'Conveyor motor circuit', hvac: 'Heat pump + gas furnace', plumbing: 'House plumbing, street to roof', industrial: 'Maintenance floor', welding: 'Welding bay + sectioned joints', construction: 'House corner, built in layers' };
  D.worldMedia = Object.fromEntries(Object.keys(label).map(w => [w, { image: `assets/renders/${w}.webp`, label: label[w], tone: w }]));
  D.v18MediaRetired = n;
})();
