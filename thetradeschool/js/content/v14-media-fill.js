(() => {
  const D = window.TRADE_DATA;
  if (!D) return;

  const a = (src, title, caption, credit = "", license = "") =>
    ({ src, title, caption, credit, license });

  // Aggressive but honest mapping: same photo may support several related concepts,
  // unit page still suppresses duplicate src within one unit view.
  const fill = {
    // ===== ELECTRICAL =====
    multimeter: a("assets/reference/openverse/electrical/multimeter_flickr.jpg","Digital multimeter in use","Range, function, and probe placement decide whether the reading is usable.","Public Domain Photos / Flickr via Openverse","CC BY 2.0"),
    "clamp-meter": a("assets/reference/openverse/electrical/multimeter_flickr.jpg","Meter family","A clamp meter measures current without opening the circuit; a basic multimeter does not.","Public Domain Photos / Flickr via Openverse","CC BY 2.0"),
    rms: a("assets/reference/openverse/electrical/multimeter_flickr.jpg","Metering AC values","True-RMS meters are needed when waveforms are not clean sine waves (VFDs, electronic loads).","Public Domain Photos / Flickr via Openverse","CC BY 2.0"),

    plc: a("assets/reference/openverse/electrical/plc_flickr.jpg","PLC I/O module","Field devices wire to modules; LEDs are the first diagnostic layer.","h080 / Flickr via Openverse","CC BY-SA 2.0"),
    "plc-inputs": a("assets/reference/openverse/electrical/plc_flickr.jpg","PLC inputs","Input modules convert field signals into data the program can read.","h080 / Flickr via Openverse","CC BY-SA 2.0"),
    "plc-outputs": a("assets/reference/openverse/electrical/plc_flickr.jpg","PLC outputs","Output modules drive solenoids, contactors, lamps, and other loads.","h080 / Flickr via Openverse","CC BY-SA 2.0"),
    "scan-cycle": a("assets/reference/openverse/electrical/plc_flickr.jpg","PLC hardware context","Scan cycle runs on the CPU while I/O modules hold the field interface.","h080 / Flickr via Openverse","CC BY-SA 2.0"),

    "limit-switch": a("assets/reference/openverse/electrical/limit_switch.jpg","Limit switch and control devices","Position is converted into a discrete electrical state.","via Openverse","CC licensed"),
    photoeye: a("assets/reference/openverse/electrical/photoeye.jpg","Photoelectric sensor","Detects presence by light beam interruption or reflection.","via Openverse","CC licensed"),
    "proximity-sensor": a("assets/reference/electrical/proximity_sensor.jpg","Inductive proximity sensor","Detects metal targets without contact.","Ekbsensor / Wikimedia Commons","CC BY-SA 4.0"),
    "pnp-npn": a("assets/reference/electrical/proximity_sensor.jpg","Sensor output type","PNP vs NPN decides how the sensor ties to the PLC input.","Ekbsensor / Wikimedia Commons","CC BY-SA 4.0"),

    transformer: a("assets/reference/openverse/electrical/transformer.jpg","Power transformer","Changes AC voltage using magnetic coupling between windings.","via Openverse","CC licensed"),
    "control-circuit": a("assets/reference/electrical/contactor.jpg","Control hardware","Low-power circuits command contactors and starters that switch the load.","Julo / Wikimedia Commons","Public domain"),
    contactor: a("assets/reference/electrical/contactor.jpg","Industrial contactor","Electrically controlled switch for motor and load current.","Julo / Wikimedia Commons","Public domain"),
    "motor-starter": a("assets/reference/electrical/contactor.jpg","Motor starter hardware","Usually contactor plus overload protection.","Julo / Wikimedia Commons","Public domain"),
    relay: a("assets/reference/electrical/contactor_internals.svg","Relay / contactor parts","Coil, armature, main contacts, aux contacts.","TradeSchool technical visual"),
    coil: a("assets/reference/electrical/contactor_internals.svg","Electromagnetic coil","Creates magnetic pull when energized.","TradeSchool technical visual"),
    "aux-contact": a("assets/reference/electrical/contactor_internals.svg","Auxiliary contacts","Seal-in, interlock, status, not load current.","TradeSchool technical visual"),

    "motor-basics": a("assets/reference/electrical/three_phase_motor.jpg","Three-phase induction motor","Frame, junction box, shaft, and nameplate.","KishanMalaviyaatCHETAK ELECTRICALS / Wikimedia Commons","CC BY-SA 4.0"),
    "motor-nameplate": a("assets/reference/electrical/three_phase_motor.jpg","Motor with nameplate","Read volts, amps, phase, Hz, RPM, SF, insulation class before diagnosing.","KishanMalaviyaatCHETAK ELECTRICALS / Wikimedia Commons","CC BY-SA 4.0"),
    "three-phase": a("assets/reference/electrical/three_phase_motor.jpg","Three-phase equipment","Most industrial motors and many power circuits are three-phase.","KishanMalaviyaatCHETAK ELECTRICALS / Wikimedia Commons","CC BY-SA 4.0"),

    vfd: a("assets/reference/electrical/vfd.jpg","Variable-frequency drive","Rectifier → DC bus → inverter control motor speed.","Rahat / Wikimedia Commons","CC BY-SA 4.0"),
    "dc-bus": a("assets/reference/electrical/vfd.jpg","Inside a VFD","DC bus capacitors can hold charge after power is removed.","Rahat / Wikimedia Commons","CC BY-SA 4.0"),
    "soft-starter": a("assets/reference/electrical/vfd.jpg","Motor power electronics","Soft starters and VFDs both sit between line and motor, but they do different jobs.","Rahat / Wikimedia Commons","CC BY-SA 4.0"),

    mcc: a("assets/hero/electrical-mcc.jpg","Motor control center","Buckets, stabs, vertical bus.","Achim Hering / Wikimedia Commons","CC BY 3.0"),
    disconnect: a("assets/hero/electrical-mcc.jpg","Industrial distribution","Visible lockable disconnect is a primary isolation point.","Achim Hering / Wikimedia Commons","CC BY 3.0"),
    breaker: a("assets/hero/electrical-mcc.jpg","Power distribution equipment","Breakers interrupt fault and overload current in distribution gear.","Achim Hering / Wikimedia Commons","CC BY 3.0"),

    // ===== HVAC =====
    compressor: a("assets/reference/hvac/compressor.jpg","Refrigeration compressor","Raises refrigerant pressure so heat can be rejected outdoors.","Tim Sheerman-Chase / Wikimedia Commons","CC BY 4.0"),
    "outdoor-unit": a("assets/reference/hvac/outdoor_unit.jpg","Outdoor condensing unit","Compressor, condenser coil, outdoor fan.","Dinkun Chen / Wikimedia Commons","CC BY-SA 4.0"),
    condenser: a("assets/reference/hvac/outdoor_unit.jpg","Condenser section","High-pressure refrigerant rejects heat here.","Dinkun Chen / Wikimedia Commons","CC BY-SA 4.0"),
    "heat-pump": a("assets/reference/hvac/outdoor_unit.jpg","Heat pump outdoor unit","Same outdoor package, reversing valve changes heating/cooling roles.","Dinkun Chen / Wikimedia Commons","CC BY-SA 4.0"),
    "metering-device": a("assets/reference/hvac/txv.jpg","Thermostatic expansion valve","Meters liquid into the evaporator; many “bad TXV” calls are airflow or charge.","Neurotronix / Wikimedia Commons","CC BY-SA 4.0"),
    "airflow-cfm": a("assets/hero/hvac-rooftop.jpg","Rooftop / air-handling equipment","CFM is the air volume the system actually moves.","P199 / Wikimedia Commons","Public domain"),
    blower: a("assets/hero/hvac-rooftop.jpg","Air-moving equipment","Moves air across the indoor coil and through ductwork.","P199 / Wikimedia Commons","Public domain"),
    ductwork: a("assets/hero/hvac-rooftop.jpg","Air distribution equipment","Supply and return paths between equipment and the space.","P199 / Wikimedia Commons","Public domain"),
    "return-air": a("assets/hero/hvac-rooftop.jpg","Air-side equipment","Return path delivers room air back to the equipment.","P199 / Wikimedia Commons","Public domain"),
    "supply-air": a("assets/hero/hvac-rooftop.jpg","Air-side equipment","Supply path delivers conditioned air to the space.","P199 / Wikimedia Commons","Public domain"),

    // ===== PLUMBING =====
    "p-trap": a("assets/reference/plumbing/ptrap.jpg","P-trap","Water seal blocks sewer gas while waste still passes.","Raquel Baranow / Wikimedia Commons","CC BY-SA 4.0"),
    "pressure-regulator": a("assets/reference/plumbing/regulator.jpg","Water pressure regulator","Reduces street pressure to safer building pressure.","Redstarpublications / Wikimedia Commons","CC BY-SA 3.0"),
    "expansion-tank": a("assets/reference/plumbing/expansion_tank.jpg","Potable expansion tank","Accepts expanded volume when water is heated in a closed system.","Tony Webster / Wikimedia Commons","CC BY 2.0"),
    "water-heater": a("assets/reference/plumbing/water_heater.jpg","Storage water heater","Heat source, tank, dip tube, T&P protection, expansion control.","Tim Evanson / Wikimedia Commons","CC BY-SA 2.0"),
    "ball-valve": a("assets/reference/plumbing/ball_valve.jpg","Ball valve","Quarter-turn shutoff, normally full open or full closed.","NVgt156 / Wikimedia Commons","CC BY-SA 4.0"),
    "shutoff-valve": a("assets/reference/plumbing/ball_valve.jpg","Shutoff valve","Isolation point for a fixture or branch.","NVgt156 / Wikimedia Commons","CC BY-SA 4.0"),
    "main-shutoff": a("assets/reference/plumbing/ball_valve.jpg","Main isolation","Primary shutoff for a building or major branch.","NVgt156 / Wikimedia Commons","CC BY-SA 4.0"),
    "copper-tube": a("assets/reference/openverse/plumbing/copper_fittings.jpg","Copper fittings","Common on potable supply; join by solder, press, or approved fittings.","via Openverse","CC licensed"),
    soldering: a("assets/reference/openverse/plumbing/copper_fittings.jpg","Copper joining","Sweat joints need clean tube, flux, heat, and lead-free solder on potable work.","via Openverse","CC licensed"),
    "press-fitting": a("assets/reference/openverse/plumbing/copper_fittings.jpg","Press-style joining","Mechanical press connections are common alternatives to solder.","via Openverse","CC licensed"),
    "water-meter": a("assets/reference/openverse/plumbing/water_meter.jpg","Water meter","Measures volume delivered to the building.","via Openverse","Public domain / CC"),
    "service-line": a("assets/reference/openverse/plumbing/water_meter.jpg","Service entrance context","Meter and service valves sit near where supply enters the building.","via Openverse","Public domain / CC"),
    pex: a("assets/reference/plumbing/pex_tools_fittings.jpg","PEX tools and fittings","Crimp/clamp/expansion tools and rings for flexible supply tubing.","Tomwsulcer / Wikimedia Commons","CC BY-SA 3.0"),
    "crimp-fitting": a("assets/reference/plumbing/pex_tools_fittings.jpg","PEX connection hardware","Rings and fittings must match the tubing system.","Tomwsulcer / Wikimedia Commons","CC BY-SA 3.0"),
    "manifold-plumbing": a("assets/reference/plumbing/pex_tools_fittings.jpg","Distribution hardware","Manifolds feed home-run PEX lines to individual fixtures.","Tomwsulcer / Wikimedia Commons","CC BY-SA 3.0"),
    "water-pressure": a("assets/reference/plumbing/regulator.jpg","Pressure control devices","Regulators and gauges relate street pressure to building pressure.","Redstarpublications / Wikimedia Commons","CC BY-SA 3.0"),
    "thermal-expansion": a("assets/reference/plumbing/expansion_tank.jpg","Thermal expansion control","Closed systems need a place for heated water to expand.","Tony Webster / Wikimedia Commons","CC BY 2.0"),
    "tpr-valve": a("assets/reference/plumbing/water_heater.jpg","Water heater safety context","T&P valve is a critical safety device on storage heaters.","Tim Evanson / Wikimedia Commons","CC BY-SA 2.0"),
    "anode-rod": a("assets/reference/plumbing/water_heater.jpg","Storage water heater","Anode rod sacrifices itself to slow tank corrosion.","Tim Evanson / Wikimedia Commons","CC BY-SA 2.0"),
    "dip-tube": a("assets/reference/plumbing/water_heater.jpg","Storage water heater","Dip tube sends cold water to the bottom of the tank.","Tim Evanson / Wikimedia Commons","CC BY-SA 2.0"),

    // ===== INDUSTRIAL =====
    bearing: a("assets/reference/industrial/ball_bearing.jpg","Ball bearing","Rolling elements support load while allowing rotation.","Solaris2006 / Wikimedia Commons","CC BY-SA 3.0 / GFDL"),
    "pillow-block": a("assets/reference/industrial/ball_bearing.jpg","Bearing in service context","Pillow blocks mount bearings to frames and shafts.","Solaris2006 / Wikimedia Commons","CC BY-SA 3.0 / GFDL"),
    cylinder: a("assets/reference/industrial/hydraulic_cylinder.jpg","Hydraulic cylinder","Converts fluid pressure and flow into linear force and motion.","S.J. de Waard / Wikimedia Commons","CC BY 2.5"),
    "cylinder-area": a("assets/reference/industrial/cylinder_area_force.svg","Area and force","Force = pressure × effective piston area.","TradeSchool technical visual"),
    "hydraulic-pressure": a("assets/reference/industrial/hydraulic_pressure_system.svg","Pressure in a hydraulic circuit","Pump creates flow; pressure rises when the load resists flow.","TradeSchool technical visual"),
    "pascal-law": a("assets/reference/industrial/hydraulic_pressure_system.svg","Pressure in a confined fluid","Pressure acts throughout the fluid; force still depends on area.","TradeSchool technical visual"),
    "pneumatic-cylinder": a("assets/reference/industrial/pneumatic_cylinder.jpg","Pneumatic cylinder","Air-powered linear actuator. Compressibility changes the feel vs hydraulics.","Grummelbacke / Wikimedia Commons","CC BY-SA 4.0"),
    "centrifugal-pump": a("assets/reference/industrial/centrifugal_pump.png","Centrifugal pump","Impeller adds velocity; casing converts velocity into pressure.","Fantagu / Wikimedia Commons","Public domain"),
    impeller: a("assets/reference/industrial/centrifugal_pump.png","Pump impeller context","The rotating element that does the work.","Fantagu / Wikimedia Commons","Public domain"),
    "belt-drive": a("assets/reference/openverse/industrial/belt_drive.jpg","Belt and pulley drive","Transmits rotation between shafts; tension and alignment matter.","via Openverse","CC licensed"),
    pulley: a("assets/reference/openverse/industrial/belt_drive.jpg","Pulleys","Diameter ratio sets speed ratio in a belt drive.","via Openverse","CC licensed"),
    "belt-tension": a("assets/reference/openverse/industrial/belt_drive.jpg","Belt drive","Too little tension slips; too much loads bearings.","via Openverse","CC licensed"),
    gearbox: a("assets/reference/openverse/industrial/gearbox.jpg","Gears / gearbox context","Gear trains change speed and torque between shafts.","via Openverse","CC licensed"),
    "gear-ratio": a("assets/reference/openverse/industrial/gearbox.jpg","Gear ratio","Tooth counts set the speed/torque tradeoff.","via Openverse","CC licensed"),
    "hydraulic-pump": a("assets/reference/openverse/industrial/hydraulic_flickr.jpg","Hydraulic system hardware","Pump supplies flow to valves and actuators.","via Openverse","CC licensed"),
    "directional-valve": a("assets/reference/openverse/industrial/hydraulic_flickr.jpg","Fluid power valving","Routes fluid to extend, retract, or hold an actuator.","via Openverse","CC licensed"),

    // ===== WELDING =====
    gtaw: a("assets/reference/openverse/welding/welding_flickr.jpg","Welding in fabrication","Process, joint, and PPE work together.","TechShop / Flickr via Openverse","CC BY 2.0"),
    gmaw: a("assets/reference/openverse/welding/gmaw_ov.jpg","MIG / GMAW","Wire feed process common in fabrication shops.","via Openverse","CC licensed"),
    smaw: a("assets/reference/openverse/welding/smaw2.jpg","Stick / SMAW puddle","Electrode, arc, and weld pool.","via Openverse","CC licensed"),
    "welding-ppe": a("assets/reference/openverse/welding/welder_ppe.jpg","Welder PPE in use","Helmet, clothing, and exposure control are a system.","via Openverse","CC licensed"),
    "welding-helmet": a("assets/reference/welding/welding_helmet.jpg","Welding helmet","One part of complete eye and face protection.","Sunnybansodeva / Wikimedia Commons","CC BY-SA 4.0"),
    "helmet-shade": a("assets/reference/welding/helmet_lens_closeup.jpg","Helmet lens","Shade number and sensors decide whether your eyes are protected.","Derived from Sunnybansodeva / Wikimedia Commons","CC BY-SA 4.0"),
    oxyfuel: a("assets/reference/openverse/welding/oxyfuel.jpg","Oxy-fuel / brazing equipment","Torch processes for heating, cutting, or joining.","via Openverse","CC licensed"),
    "fillet-weld": a("assets/reference/openverse/welding/gmaw_ov.jpg","Fillet weld context","Common joint type in fabrication. Check size and fusion.","via Openverse","CC licensed"),
    "fume-control": a("assets/reference/openverse/welding/welder_ppe.jpg","Exposure control","Fume depends on process, base metal, and coatings.","via Openverse","CC licensed"),

    // ===== CONSTRUCTION =====
    "wall-framing": a("assets/reference/construction/light_framing.jpg","Wood wall framing","Studs, plates, headers, and openings in light-frame construction.","Nerv3d5053 / Wikimedia Commons","CC BY-SA 4.0"),
    "top-bottom-plate": a("assets/reference/construction/light_framing.jpg","Wall plates","Top and bottom plates tie studs into a wall assembly.","Nerv3d5053 / Wikimedia Commons","CC BY-SA 4.0"),
    "stud-spacing": a("assets/reference/construction/light_framing.jpg","Stud spacing","On-center layout affects sheathing and load path.","Nerv3d5053 / Wikimedia Commons","CC BY-SA 4.0"),
    header: a("assets/reference/construction/header_opening_crop.jpg","Header at an opening","Carries loads across a window or door opening.","Derived from Nerv3d5053 / Wikimedia Commons","CC BY-SA 4.0"),
    "king-jack-stud": a("assets/reference/construction/header_opening_crop.jpg","King and jack studs","King runs full height; jack supports the header end.","Derived from Nerv3d5053 / Wikimedia Commons","CC BY-SA 4.0"),
    "rough-opening": a("assets/reference/construction/header_opening_crop.jpg","Opening framing","Rough opening size must match the window or door system.","Derived from Nerv3d5053 / Wikimedia Commons","CC BY-SA 4.0"),
    "building-envelope": a("assets/reference/construction/building_envelope_detail.svg","Envelope layers","Cladding, WRB, sheathing, thermal and air control.","TradeSchool technical visual"),
    flashing: a("assets/reference/construction/building_envelope_detail.svg","Flashing path","Directs water out of the assembly.","TradeSchool technical visual"),
    wrb: a("assets/reference/construction/building_envelope_detail.svg","Weather-resistive barrier","Keeps bulk water out while allowing drainage/drying.","TradeSchool technical visual"),
    rebar: a("assets/reference/openverse/construction/rebar_ov.jpg","Reinforcing steel","Placed where concrete needs tensile strength.","via Openverse","CC licensed"),
    formwork: a("assets/reference/openverse/construction/formwork_flickr.jpg","Formwork and pour","Forms hold concrete to shape until it gains strength.","Bill Alden / Flickr via Openverse","CC BY-SA 2.0"),
    concrete: a("assets/reference/openverse/construction/concrete_pour_flickr.jpg","Concrete placement","Placement, consolidation, and curing decide strength.","Bill Alden / Flickr via Openverse","CC BY-SA 2.0"),
    foundation: a("assets/reference/openverse/construction/foundation.jpg","Concrete foundation","Foundation work sets level, bearing, and waterproofing details.","via Openverse","CC licensed"),
    "rebar-cover": a("assets/reference/openverse/construction/rebar_cage.jpg","Rebar cage","Cover distance protects steel and develops the section.","S.C. Air National Guard / Openverse","Public Domain"),
    sheathing: a("assets/reference/construction/light_framing.jpg","Sheathed framing","Sheathing ties the frame into a structural and enclosure surface.","Nerv3d5053 / Wikimedia Commons","CC BY-SA 4.0"),
    // diagrams
    "series-parallel": a("assets/reference/diagrams/series_parallel.svg","Series vs parallel","One path vs shared voltage: current and voltage rules change.","TradeSchool technical visual"),
    superheat: a("assets/reference/diagrams/superheat_subcool.svg","Superheat","Suction temp minus evaporator saturation temp (correct refrigerant P–T chart).","TradeSchool technical visual"),
    subcooling: a("assets/reference/diagrams/superheat_subcool.svg","Subcooling","Condenser saturation temp minus liquid line temp.","TradeSchool technical visual"),
    "load-path": a("assets/reference/diagrams/load_path.svg","Load path","Continuous path from applied load to foundation.","TradeSchool technical visual"),
    // more sensible photo reuse
    voltage: a("assets/reference/openverse/electrical/multimeter_flickr.jpg","Measuring voltage","Voltage is always between two points; both probes must be placed deliberately.","Public Domain Photos / Flickr via Openverse","CC BY 2.0"),
    current: a("assets/reference/openverse/electrical/multimeter_flickr.jpg","Measuring with a meter","Current measurement needs a series path or a clamp, not a voltage-mode probe across the line.","Public Domain Photos / Flickr via Openverse","CC BY 2.0"),
    resistance: a("assets/reference/openverse/electrical/multimeter_flickr.jpg","Resistance checks","Only on de-energized circuits; continuity is not a load test.","Public Domain Photos / Flickr via Openverse","CC BY 2.0"),
    fuse: a("assets/hero/electrical-mcc.jpg","Protective devices in distribution","Fuses and breakers interrupt overcurrent, with different reset and time-current behavior.","Achim Hering / Wikimedia Commons","CC BY 3.0"),
    overload: a("assets/reference/electrical/contactor.jpg","Motor branch protection context","Overloads protect the motor thermally; short-circuit devices protect the circuit.","Julo / Wikimedia Commons","Public domain"),
    "seal-in": a("assets/reference/electrical/contactor_internals.svg","Auxiliary / seal-in idea","A holding contact keeps the coil energized after the start button opens.","TradeSchool technical visual"),
    interlock: a("assets/reference/electrical/contactor_internals.svg","Interlock contacts","Prevent conflicting commands (e.g. forward and reverse) from being true together.","TradeSchool technical visual"),
    "normally-open": a("assets/reference/electrical/contactor_internals.svg","Contact state","NO contacts close when the device operates.","TradeSchool technical visual"),
    "normally-closed": a("assets/reference/electrical/contactor_internals.svg","Contact state","NC contacts open when the device operates.","TradeSchool technical visual"),
    
    "filter-drier": a("assets/reference/hvac/txv.jpg","Liquid-line components","Filter-drier and metering device sit on the liquid side of the circuit.","Neurotronix / Wikimedia Commons","CC BY-SA 4.0"),
    
    
    
    alignment: a("assets/reference/diagrams/shaft_alignment.svg","Shaft alignment","Offset and angular error between coupled shaft centerlines.","TradeSchool technical visual"),
    
    shaft: a("assets/reference/openverse/industrial/belt_drive.jpg","Rotating shafts","Shafts carry torque between driver and driven equipment.","via Openverse","CC licensed"),
    vibration: a("assets/reference/industrial/ball_bearing.jpg","Rotating equipment","Bearings, unbalance, and misalignment are common vibration sources.","Solaris2006 / Wikimedia Commons","CC BY-SA 3.0 / GFDL"),
    lubrication: a("assets/reference/industrial/ball_bearing.jpg","Bearing lubrication","Correct lubricant, quantity, and interval protect rolling elements.","Solaris2006 / Wikimedia Commons","CC BY-SA 3.0 / GFDL"),
    porosity: a("assets/reference/openverse/welding/smaw2.jpg","Weld pool / bead","Gas entrapment and contamination show up as porosity in the finished weld.","via Openverse","CC licensed"),
    "heat-input": a("assets/reference/openverse/welding/gmaw_ov.jpg","Welding parameters","Amperage, voltage, and travel speed together drive heat input.","via Openverse","CC licensed"),
    "travel-speed": a("assets/reference/openverse/welding/gmaw_ov.jpg","Travel speed","Too fast starves the weld; too slow overheats the joint.","via Openverse","CC licensed"),
    amperage: a("assets/reference/openverse/welding/smaw2.jpg","Welding current","Amperage strongly affects penetration and electrode burn-off.","via Openverse","CC licensed"),
    "dead-load": a("assets/reference/diagrams/load_path.svg","Structural loads","Dead load is permanent weight of the structure itself.","TradeSchool technical visual"),
    "live-load": a("assets/reference/diagrams/load_path.svg","Structural loads","Live load is occupancy, snow, and other variable loads.","TradeSchool technical visual"),
    "bearing-wall": a("assets/reference/construction/light_framing.jpg","Bearing walls","Walls that carry load must stay continuous in the load path.","Nerv3d5053 / Wikimedia Commons","CC BY-SA 4.0"),

  };

  D.visualAssets = Object.assign({}, D.visualAssets || {}, fill);
  D.unitVisuals = {};
})();
