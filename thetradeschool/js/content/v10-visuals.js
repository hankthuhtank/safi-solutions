(() => {
  const D = window.TRADE_DATA;
  if (!D) return;

  const asset = (src, title, caption, credit = "", license = "") =>
    ({ src, title, caption, credit, license });

  // V11 rules:
  // - One image per concept.
  // - Do not map the same photo to every related concept in a unit (causes repetition).
  // - Bad nameplate crop is not used — full motor photo with honest caption instead.
  // - Unit-level visual strips are removed in app.js.

  const more = {
    "pex": asset(
      "assets/reference/plumbing/pex_tools_fittings.jpg",
      "PEX tools and fittings",
      "Cinch tool, rings, and fittings used for modern flexible supply piping.",
      "Tomwsulcer / Wikimedia Commons", "CC BY-SA 3.0"
    ),
    "crimp-fitting": asset(
      "assets/reference/plumbing/pex_tools_fittings.jpg",
      "PEX connection hardware",
      "Rings and fittings used to join PEX to supply lines and fixtures.",
      "Tomwsulcer / Wikimedia Commons", "CC BY-SA 3.0"
    ),

    multimeter: asset(
      "assets/reference/electrical/multimeter.jpg",
      "Digital multimeter",
      "Range, function, and probe placement decide whether the reading is usable.",
      "oomlout / Wikimedia Commons", "CC BY-SA 2.0"
    ),
    "clamp-meter": asset(
      "assets/reference/electrical/multimeter.jpg",
      "Meter family",
      "A clamp meter adds current measurement without breaking the circuit. A basic multimeter does not.",
      "oomlout / Wikimedia Commons", "CC BY-SA 2.0"
    ),
    "motor-basics": asset(
      "assets/reference/electrical/three_phase_motor.jpg",
      "Three-phase induction motor",
      "Frame, junction box, shaft, and nameplate are the first recognition points in the field.",
      "KishanMalaviyaatCHETAK ELECTRICALS / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    "motor-nameplate": asset(
      "assets/reference/electrical/three_phase_motor.jpg",
      "Motor with nameplate on the frame",
      "The nameplate is on the motor body. Read volts, amps, phase, hertz, RPM, service factor, and insulation class before diagnosing the motor.",
      "KishanMalaviyaatCHETAK ELECTRICALS / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    vfd: asset(
      "assets/reference/electrical/vfd.jpg",
      "Variable-frequency drive",
      "Rectifier → DC bus → inverter. Output frequency and voltage control motor speed and torque.",
      "Rahat / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    "dc-bus": asset(
      "assets/reference/electrical/vfd.jpg",
      "Inside a VFD",
      "The DC bus sits between rectifier and inverter. Capacitors can hold hazardous charge after power is removed.",
      "Rahat / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    contactor: asset(
      "assets/reference/electrical/contactor.jpg",
      "Industrial contactor",
      "Heavy-duty electrically controlled switch. Coil voltage and contact rating are both critical.",
      "Julo / Wikimedia Commons", "Public domain"
    ),
    relay: asset(
      "assets/reference/electrical/contactor_internals.svg",
      "Contactor parts (schematic)",
      "Coil, armature, main contacts, and aux contacts: what each part does in the device.",
      "TradeSchool technical visual"
    ),
    coil: asset(
      "assets/reference/electrical/contactor_internals.svg",
      "Electromagnetic coil",
      "Creates the magnetic force that closes the contacts. Wrong coil voltage is a common failure mode.",
      "TradeSchool technical visual"
    ),
    "aux-contact": asset(
      "assets/reference/electrical/contactor_internals.svg",
      "Auxiliary contacts",
      "Smaller contacts used for seal-in, interlocks, and status, not for carrying motor current.",
      "TradeSchool technical visual"
    ),
    "motor-starter": asset(
      "assets/reference/electrical/contactor.jpg",
      "Motor starter hardware",
      "Typically a contactor plus overload protection in one assembly.",
      "Julo / Wikimedia Commons", "Public domain"
    ),
    plc: asset(
      "assets/reference/electrical/plc.jpg",
      "Programmable logic controller",
      "CPU plus I/O modules. Field devices wire to the modules; the program decides the outputs.",
      "Bisgaard / Wikimedia Commons", "CC BY-SA 3.0 / GFDL"
    ),
    "proximity-sensor": asset(
      "assets/reference/electrical/proximity_sensor.jpg",
      "Inductive proximity sensor",
      "Detects metal targets without contact. Sensing distance, output type, and the wiring diagram on the body all matter.",
      "Ekbsensor / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    "pnp-npn": asset(
      "assets/reference/electrical/proximity_sensor.jpg",
      "Sensor output type",
      "PNP vs NPN (sourcing vs sinking) decides how the sensor connects to the PLC input.",
      "Ekbsensor / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    mcc: asset(
      "assets/hero/electrical-mcc.jpg",
      "Motor control center",
      "Buckets, stabs, and vertical bus: where power distribution and motor control live together.",
      "Achim Hering / Wikimedia Commons", "CC BY 3.0"
    ),
    compressor: asset(
      "assets/reference/hvac/compressor.jpg",
      "Refrigeration compressor",
      "Raises refrigerant pressure and temperature so heat can be rejected outdoors. It moves vapor; it does not make cold.",
      "Tim Sheerman-Chase / Wikimedia Commons", "CC BY 4.0"
    ),
    "outdoor-unit": asset(
      "assets/reference/hvac/outdoor_unit.jpg",
      "Outdoor condensing unit",
      "Compressor, condenser coil, and outdoor fan in one package.",
      "Dinkun Chen / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    condenser: asset(
      "assets/reference/hvac/outdoor_unit.jpg",
      "Condenser in the outdoor unit",
      "High-pressure refrigerant rejects heat here. Dirty coils or weak outdoor airflow raise head pressure.",
      "Dinkun Chen / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    "metering-device": asset(
      "assets/reference/hvac/txv.jpg",
      "Thermostatic expansion valve",
      "Creates the pressure drop and meters liquid into the evaporator. Most bad TXV calls are airflow, charge, or restriction problems.",
      "Neurotronix / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    "airflow-cfm": asset(
      "assets/hero/hvac-rooftop.jpg",
      "Rooftop / air-handling equipment",
      "CFM is the volume of air the system actually moves. Restrictions and dirty filters kill capacity.",
      "P199 / Wikimedia Commons", "Public domain"
    ),
    "p-trap": asset(
      "assets/reference/plumbing/ptrap.jpg",
      "P-trap",
      "Holds a water seal that blocks sewer gas while still allowing wastewater to pass.",
      "Raquel Baranow / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    "pressure-regulator": asset(
      "assets/reference/plumbing/regulator.jpg",
      "Water pressure regulator",
      "Reduces street pressure to a safer, more consistent building pressure.",
      "Redstarpublications / Wikimedia Commons", "CC BY-SA 3.0"
    ),
    "expansion-tank": asset(
      "assets/reference/plumbing/expansion_tank.jpg",
      "Potable expansion tank",
      "Accepts the extra volume created when water is heated in a closed system.",
      "Tony Webster / Wikimedia Commons", "CC BY 2.0"
    ),
    "water-heater": asset(
      "assets/reference/plumbing/water_heater.jpg",
      "Storage water heater",
      "Thermal storage, energy input, dip tube, T&P protection, and expansion control in one assembly.",
      "Tim Evanson / Wikimedia Commons", "CC BY-SA 2.0"
    ),
    "ball-valve": asset(
      "assets/reference/plumbing/ball_valve.jpg",
      "Ball valve",
      "Quarter-turn shutoff. Full open or full closed is the normal service position.",
      "NVgt156 / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    bearing: asset(
      "assets/reference/industrial/ball_bearing.jpg",
      "Ball bearing",
      "Rolling elements that support load while allowing rotation.",
      "Solaris2006 / Wikimedia Commons", "CC BY-SA 3.0 / GFDL"
    ),
    cylinder: asset(
      "assets/reference/industrial/hydraulic_cylinder.jpg",
      "Hydraulic cylinder",
      "Converts fluid pressure and flow into linear force and motion.",
      "S.J. de Waard / Wikimedia Commons", "CC BY 2.5"
    ),
    "cylinder-area": asset(
      "assets/reference/industrial/cylinder_area_force.svg",
      "Area and force",
      "Force = pressure × effective piston area. Same pressure on a larger area produces more force.",
      "TradeSchool technical visual"
    ),
    "hydraulic-pressure": asset(
      "assets/reference/industrial/hydraulic_pressure_system.svg",
      "Pressure in a hydraulic circuit",
      "The pump creates flow. Pressure rises only when the load resists that flow.",
      "TradeSchool technical visual"
    ),
    "pneumatic-cylinder": asset(
      "assets/reference/industrial/pneumatic_cylinder.jpg",
      "Pneumatic cylinder",
      "Air-powered linear actuator. Compressibility makes behavior different from hydraulics.",
      "Grummelbacke / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    "centrifugal-pump": asset(
      "assets/reference/industrial/centrifugal_pump.png",
      "Centrifugal pump",
      "Impeller adds velocity; the casing converts velocity into pressure.",
      "Fantagu / Wikimedia Commons", "Public domain"
    ),
    gtaw: asset(
      "assets/reference/welding/tig_welding.jpg",
      "GTAW / TIG in process",
      "Non-consumable tungsten, separate filler when needed, shielding gas protecting the puddle.",
      "Prowelder87 / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    "welding-ppe": asset(
      "assets/reference/welding/welding_ppe_reference.svg",
      "PPE as a system",
      "Helmet, gloves, clothing, and fume control work together. A helmet alone is not complete protection.",
      "TradeSchool technical visual"
    ),
    "helmet-shade": asset(
      "assets/reference/welding/helmet_lens_closeup.jpg",
      "Helmet lens / viewing window",
      "Shade number, sensor function, and a clear cover lens decide whether your eyes are actually protected.",
      "Derived from Sunnybansodeva / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    "welding-helmet": asset(
      "assets/reference/welding/welding_helmet.jpg",
      "Welding helmet",
      "One part of a complete PPE and exposure-control system.",
      "Sunnybansodeva / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    "wall-framing": asset(
      "assets/reference/construction/light_framing.jpg",
      "Light-frame wall",
      "Studs, plates, sheathing, and openings: the assembly most residential walls are built from.",
      "Nerv3d5053 / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    header: asset(
      "assets/reference/construction/header_opening_crop.jpg",
      "Header at an opening",
      "Carries loads across a window or door opening. Jack studs transfer that load to the plates below.",
      "Derived from Nerv3d5053 / Wikimedia Commons", "CC BY-SA 4.0"
    ),
    "building-envelope": asset(
      "assets/reference/construction/building_envelope_detail.svg",
      "Envelope layers at an opening",
      "Cladding, drainage plane / WRB, sheathing, thermal and air control. Continuity at openings is where most leaks start.",
      "TradeSchool technical visual"
    ),
    flashing: asset(
      "assets/reference/construction/building_envelope_detail.svg",
      "Flashing at the head",
      "Directs water back out of the assembly. Flashing is a path, not decoration.",
      "TradeSchool technical visual"
    ),
    rebar: asset(
      "assets/reference/construction/rebar_detail_crop.jpg",
      "Reinforcing steel",
      "Concrete is strong in compression and weak in tension. Rebar is placed where tensile force is expected.",
      "Derived from MTA Capital Construction / Wikimedia Commons", "CC BY 2.0"
    ),
    formwork: asset(
      "assets/reference/construction/rebar_formwork.jpg",
      "Formwork and rebar before the pour",
      "The structural assembly exists before concrete is placed. Placement, cover, and support are checked here.",
      "MTA Capital Construction / Wikimedia Commons", "CC BY 2.0"
    )
  };

  // Also REMOVE earlier broad mappings that caused voltage/current/rms to all get the multimeter
  const strip = [
    "voltage","current","resistance","rms","frequency","power",
    "motor-slip","three-phase","phase-loss","phase-sequence",
    "plc-inputs","plc-outputs","sinking-sourcing",
    "soft-starter","disconnect","safety-loto","arc-flash","stored-energy",
    "evaporator","heat-pump","reversing-valve","superheat","subcooling",
    "suction-line","liquid-line","filter-drier","manifold-gauges",
    "static-pressure","blower","ductwork","return-air","supply-air","delta-t",
    "shutoff-valve","main-shutoff","water-pressure","static-dynamic-pressure",
    "thermal-expansion","tpr-valve","dip-tube",
    "pillow-block","bearing-clearance","bearing-fit","pascal-law","hydraulic-pump",
    "impeller","pump-curve","mechanical-seal",
    "gmaw","smaw","fume-control","heat-input","travel-speed","arc-length",
    "penetration","fillet-weld","visual-inspection","welding-symbols",
    "king-jack-stud","load-path","wrb","drainage-plane","window-flashing",
    "rebar-cover","concrete","sheathing","top-bottom-plate","stud-spacing","rough-opening"
  ];

  D.visualAssets = Object.assign({}, D.visualAssets || {});
  strip.forEach(id => { delete D.visualAssets[id]; });

  // V13: prefer Openverse/Flickr CC where we have better or alternate shots
  const openverse = {
    multimeter: asset("assets/reference/openverse/electrical/multimeter_flickr.jpg","Digital multimeter in use","Probes, range, and function decide whether the reading is usable. Category rating matters for the environment.","Public Domain Photos / Flickr via Openverse","CC BY 2.0"),
    plc: asset("assets/reference/openverse/electrical/plc_flickr.jpg","PLC input/output module","Field devices wire to I/O modules. Module LEDs are the first diagnostic layer.","h080 / Flickr via Openverse","CC BY-SA 2.0"),
    "plc-inputs": asset("assets/reference/openverse/electrical/plc_flickr.jpg","PLC I/O hardware","Input and output cards sit between sensors/actuators and the CPU.","h080 / Flickr via Openverse","CC BY-SA 2.0"),
    gtaw: asset("assets/reference/openverse/welding/welding_flickr.jpg","Welding in a fabrication setting","Process, joint, and PPE work together. Fume control and eye protection are not optional.","TechShop / Flickr via Openverse","CC BY 2.0"),
    gmaw: asset("assets/reference/openverse/welding/welding_flickr.jpg","Shop welding","MIG/GMAW is common in fabrication. Wire feed, voltage, and travel speed all affect the bead.","TechShop / Flickr via Openverse","CC BY 2.0"),
    formwork: asset("assets/reference/openverse/construction/formwork_flickr.jpg","Concrete pour in progress","Formwork holds the concrete to shape until it gains strength.","Bill Alden / Flickr via Openverse","CC BY-SA 2.0"),
    concrete: asset("assets/reference/openverse/construction/concrete_pour_flickr.jpg","Concrete placement","Reinforcement and formwork are already in place. Vibration and curing finish the structural job.","Bill Alden / Flickr via Openverse","CC BY-SA 2.0"),
    rebar: asset("assets/reference/openverse/construction/rebar_cage.jpg","Reinforcing steel cage","Rebar is placed where tensile force is expected before the pour. Cover and support matter.","S.C. Air National Guard / via Openverse","Public Domain")
  };
  Object.assign(D.visualAssets, more, openverse);

  // No unit-level clusters
  D.unitVisuals = {};
})();
