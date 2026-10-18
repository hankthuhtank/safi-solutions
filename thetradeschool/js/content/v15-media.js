/* =============================================================================
   TradeSchool media integrity layer
   -----------------------------------------------------------------------------
   Runs after every other content file, so it has the last word on visualAssets.

   Two jobs:
     1. PURGE — remove every mapping that points at a file deleted in the media audit. Those photos did not show the thing they claimed to show.
     2. REPLACE — install original technical diagrams built by
        tools/media/build_diagrams.py, plus honest re-labels for photos that
        were real but mis-captioned.

   Rule kept from docs/MEDIA_POLICY.md: a visual earns its place by teaching
   recognition or mechanism. If neither a correct photo nor a correct diagram
   exists for a concept, the concept gets no image at all.
   ========================================================================== */
(() => {
  const D = window.TRADE_DATA;
  if (!D) return;

  /* --- 1. Files removed in the audit, with the reason -------------------
     Kept as data so the reason survives in the repo, not just in a changelog. */
  const REMOVED = {
    "assets/reference/hvac/compressor.jpg":
      "Museum exhibit behind rope barriers, ship's wheel in frame. Not a refrigeration compressor.",
    "assets/reference/industrial/hydraulic_cylinder.jpg":
      "Yellow bottle jack photographed on a pink wall. Not a cylinder, and it was the Industrial hero.",
    "assets/reference/openverse/electrical/photoeye.jpg":
      "Watermarked commercial vendor advertisement, not an openly licensed field photo.",
    "assets/reference/openverse/electrical/plc_flickr.jpg":
      "Bare relay board held in a hand. Not a PLC I/O module.",
    "assets/reference/openverse/industrial/gearbox.jpg":
      "CGI stock render. Violates the no-fake-visuals rule.",
    "assets/reference/openverse/industrial/hyd_pump.jpg": "Photograph of a brick building.",
    "assets/reference/openverse/industrial/hydraulic_flickr.jpg":
      "Electrical connectors and cordsets, filed and captioned as hydraulics.",
    "assets/reference/openverse/industrial/belt_drive.jpg":
      "Antique wooden farm machine. Teaches nothing about a modern belt drive.",
    "assets/reference/openverse/plumbing/water_meter.jpg":
      "1941 archival photo of meter testing. Not current equipment recognition.",
    "assets/reference/openverse/welding/smaw2.jpg":
      "Two-panel collage, both panels blown out by arc glare.",
    "assets/reference/openverse/welding/gmaw_ov.jpg":
      "Underexposed to the point that no joint or puddle is visible.",
    "assets/reference/electrical/contactor_parts.jpg":
      "Spanish part labels on an English-language site.",
    "assets/reference/electrical/contactor_principle.jpg": "Corrupt file. Not a decodable image.",
    "assets/reference/plumbing/copper_pipe.jpg": "Corrupt file. Not a decodable image.",
    "assets/reference/electrical/motor_nameplate_crop.jpg":
      "Washed-out crop with no readable nameplate data.",
    "assets/reference/industrial/hydraulic_cylinder_end_crop.jpg":
      "Detail crop of the mislabeled bottle jack.",
    "assets/reference/construction/header_opening_crop.jpg":
      "Identical wide subdivision shot to light_framing.jpg, with no header visible.",
    "assets/reference/construction/rebar_detail_crop.jpg": "Near-duplicate of rebar_formwork.jpg.",
    "assets/reference/plumbing/broken_pipe.jpg":
      "Close-up of insulation with an indistinct pipe. Nothing identifiable.",
  };
  D.removedMedia = REMOVED;

  const gone = new Set(Object.keys(REMOVED));
  const va = Object.assign({}, D.visualAssets || {});
  let purged = 0;
  Object.keys(va).forEach((id) => {
    if (va[id] && gone.has(va[id].src)) {
      delete va[id];
      purged++;
    }
  });

  /* --- 2. Replacements ---------------------------------------------------- */
  const own = "TradeSchool original technical diagram";
  const a = (src, title, caption, credit = own, license = "") => ({
    src,
    title,
    caption,
    credit,
    license,
  });

  const fill = {
    /* ---- HVAC: compressor family now uses the real mechanism diagram ---- */
    compressor: a(
      "assets/reference/hvac/compressor_types.svg",
      "Reciprocating and scroll compression",
      "A compressor raises pressure. It does not make cold. Reciprocating sweeps a fixed volume behind one-way valves; scroll shrinks gas pockets as they travel inward and needs no valves.",
    ),
    "refrigeration-ton": a(
      "assets/reference/hvac/compressor_types.svg",
      "Capacity starts at the compressor",
      "A ton of refrigeration is a rate of heat removal. The compressor is what makes that rate possible by moving refrigerant against a pressure difference.",
    ),
    refrigerant: a(
      "assets/reference/diagrams/refrigerant_transition.svg",
      "Three refrigerants are in the field at once",
      "R-22 legacy, R-410A installed base, and A2L R-454B / R-32 on new equipment. The nameplate decides the P-T chart, the tools and the procedure.",
    ),
    "pressure-temperature": a(
      "assets/reference/diagrams/refrigerant_transition.svg",
      "Pressure and temperature are locked together",
      "Saturation pressure maps to saturation temperature, but only on the chart for the refrigerant actually in the system.",
    ),

    /* ---- Electrical: PLC and sensing get real schematics ---- */
    plc: a(
      "assets/reference/electrical/plc_architecture.svg",
      "PLC signal path",
      "Field devices land on input modules, the CPU works on the input image, output modules drive the loads.",
    ),
    "plc-inputs": a(
      "assets/reference/electrical/plc_architecture.svg",
      "Where inputs enter",
      "An input LED proves the field device closed. It does not prove the program used it.",
    ),
    "plc-outputs": a(
      "assets/reference/electrical/plc_architecture.svg",
      "Where outputs leave",
      "An output LED proves the program commanded the output. It does not prove the load ran.",
    ),
    "scan-cycle": a(
      "assets/reference/electrical/plc_architecture.svg",
      "What the scan moves through",
      "Read inputs, solve logic, write outputs, repeat. The modules hold the field interface either side of that loop.",
    ),
    photoeye: a(
      "assets/reference/electrical/photoeye_modes.svg",
      "Three photoelectric sensing modes",
      "Through-beam, retroreflective and diffuse differ in range, mounting and how they fail when the lens gets dirty.",
    ),
    "proximity-sensor": a(
      "assets/reference/electrical/photoeye_modes.svg",
      "Non-contact sensing family",
      "A proximity sensor detects a target without touching it, the same way a photo eye does. The output type, PNP or NPN, decides how either one lands on a PLC input.",
    ),

    /* ---- Industrial: cylinder, belt, gearbox ---- */
    cylinder: a(
      "assets/reference/industrial/cylinder_anatomy.svg",
      "Hydraulic cylinder anatomy",
      "Bore, rod, ports and seals. The rod removes area on the retract side, so extend and retract are never symmetric.",
    ),
    "cylinder-area": a(
      "assets/reference/industrial/cylinder_anatomy.svg",
      "Force and speed come from area",
      "Force = pressure x effective area. Speed = flow / effective area. Same pump, two different answers per direction.",
    ),
    "air-cylinder": a(
      "assets/reference/industrial/cylinder_anatomy.svg",
      "Pneumatic cylinder, same geometry",
      "Air instead of oil, but the rod still removes area on the retract side. Air compresses, so speed is far less predictable than in hydraulics.",
    ),
    "belt-drive": a(
      "assets/reference/industrial/belt_drive_ratio.svg",
      "Belt drive ratio",
      "Sheave diameters set the speed and torque trade. Alignment comes before tension.",
    ),
    "belt-tension": a(
      "assets/reference/industrial/belt_drive_ratio.svg",
      "Tension is what lets the ratio happen",
      "Too loose and the belt slips, showing up as heat, dust and squeal. Too tight and it loads the bearings either side.",
    ),
    "gear-ratio": a(
      "assets/reference/industrial/gear_reduction.svg",
      "Gear ratio",
      "Count teeth. A reduction trades shaft speed for shaft torque, and never adds power.",
    ),
    gearbox: a(
      "assets/reference/industrial/gear_reduction.svg",
      "Gearbox ratio",
      "A gearbox running hot at unchanged load has lost lubrication, alignment or clearance, not ratio.",
    ),
    "conveyor-belt": a(
      "assets/reference/industrial/gear_reduction.svg",
      "Drive ratio sets belt speed",
      "Conveyor speed comes from the reducer ratio and the drive pulley diameter, not from the motor nameplate RPM alone.",
    ),

    /* ---- Plumbing: service entry ---- */
    "service-line": a(
      "assets/reference/plumbing/water_service.svg",
      "Building water service",
      "Curb stop, meter, backflow protection, pressure reduction and main shutoff. Order varies by jurisdiction and hazard level.",
    ),
    "water-meter": a(
      "assets/reference/plumbing/water_service.svg",
      "Where the meter sits",
      "The meter measures volume. It is not a shutoff and it is not a pressure control.",
    ),
    "backflow-prevention": a(
      "assets/reference/plumbing/water_service.svg",
      "Backflow protection on the service",
      "The device type follows the hazard level. High-hazard applications generally need testable assemblies.",
    ),

    /* ---- Welding: process comparison ---- */
    fcaw: a(
      "assets/reference/welding/arc_processes.svg",
      "Where FCAW sits",
      "Flux lives inside the tubular wire, so it runs outdoors like stick but feeds continuously like MIG. It still leaves slag.",
    ),
    smaw: a(
      "assets/reference/welding/arc_processes.svg",
      "Where SMAW sits",
      "Flux coating shields the arc, so wind is tolerable and slag has to come off.",
    ),
    gmaw: a(
      "assets/reference/welding/arc_processes.svg",
      "Where GMAW sits",
      "Bottled gas shields the arc, so a draft across the joint is a defect waiting to happen.",
    ),
    gtaw: a(
      "assets/reference/welding/arc_processes.svg",
      "Where GTAW sits",
      "Separate filler and bottled gas give the most control and the slowest travel.",
    ),
    "heat-input": a(
      "assets/reference/welding/arc_processes.svg",
      "Heat input across processes",
      "Heat input = (volts x amps x 60) / travel speed in in/min, reported in kJ/in.",
    ),

    /* ---- Construction: header framing ---- */
    header: a(
      "assets/reference/construction/header_framing.svg",
      "Header and rough opening",
      "King studs, jacks, header and cripples. The header carries what the removed studs used to carry.",
    ),
    "rough-opening": a(
      "assets/reference/construction/header_framing.svg",
      "Rough opening framing",
      "Sized from the manufacturer's unit dimensions plus shim space, never from the finished door or window.",
    ),
    "bearing-wall": a(
      "assets/reference/construction/header_framing.svg",
      "What a bearing wall carries",
      "Remove studs for an opening and the header plus jacks have to carry what those studs were carrying.",
    ),
  };

  /* Only install a mapping if the concept actually exists, so the reference
     index never advertises a page that is not there. */
  const ids = new Set((D.concepts || []).map((c) => c.id));
  let installed = 0,
    skipped = 0;
  Object.keys(fill).forEach((id) => {
    if (ids.has(id)) {
      va[id] = fill[id];
      installed++;
    } else {
      skipped++;
    }
  });

  D.visualAssets = va;

  /* --- 3. Honest re-labels for photos that were real but mis-captioned ---- */
  const RECAPTION = {
    "assets/reference/openverse/electrical/limit_switch.jpg": {
      title: "Control panel DIN rail",
      caption:
        "Breakers, terminal blocks and a controller on a DIN rail. This is panel context, not a limit switch.",
    },
    "assets/reference/industrial/centrifugal_pump.png": {
      title: "Centrifugal pump cutaway",
      caption: "Suction at the eye, impeller adds velocity, volute converts velocity to pressure.",
    },
  };
  Object.keys(va).forEach((id) => {
    const r = RECAPTION[va[id] && va[id].src];
    if (r) va[id] = Object.assign({}, va[id], r);
  });

  /* --- 4. World hero images -------------------------------------------------
     Industrial pointed at the deleted bottle jack. app.js reads
     TRADE_DATA.worldMedia when present so the hero set is data, not code. */
  D.worldMedia = {
    electrical: {
      image: "assets/hero/electrical-mcc.jpg",
      label: "Motor control center",
      tone: "electrical",
    },
    hvac: { image: "assets/hero/hvac-rooftop.jpg", label: "Packaged rooftop unit", tone: "hvac" },
    plumbing: {
      image: "assets/reference/plumbing/pex_tools_fittings.jpg",
      label: "PEX tools and fittings",
      tone: "plumbing",
    },
    industrial: {
      image: "assets/reference/industrial/ball_bearing.jpg",
      label: "Deep-groove ball bearing",
      tone: "industrial",
    },
    welding: {
      image: "assets/reference/welding/tig_welding.jpg",
      label: "GTAW at the bench",
      tone: "welding",
    },
    construction: {
      image: "assets/reference/construction/light_framing.jpg",
      label: "Light-frame construction",
      tone: "construction",
    },
  };

  console.log(
    `V15 media: purged ${purged} dead mapping(s), installed ${installed} replacement(s), ` +
      `skipped ${skipped} with no matching concept.`,
  );
})();
