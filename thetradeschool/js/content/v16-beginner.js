(() => {
  const D = window.TRADE_DATA;
  if (!D) return;

  const B = (window.TRADE_BEGINNER = {
    worldIntro: {
      electrical: {
        title: "Start with what electricity is doing.",
        text: "Electricity is invisible, so beginners get lost when lessons jump straight to relays, contactors, PLCs, or motor starters. Start with the basic ideas first: electrical push, electrical flow, what resists that flow, and how a complete path lets a device do work.",
        path: [
          "voltage",
          "current",
          "resistance",
          "power",
          "circuit",
          "breaker",
          "relay",
          "contactor",
          "control-circuit",
          "motor-basics",
          "ladder-logic",
        ],
      },
      hvac: {
        title: "Start with heat, then follow the refrigerant.",
        text: "HVAC is easier when you stop treating it like a box full of parts. First understand that the system moves heat. Then learn the four main refrigeration components, the air side, and the controls that tell everything when to run.",
        path: [
          "heat-transfer",
          "refrigerant",
          "compressor",
          "condenser",
          "metering-device",
          "evaporator",
          "airflow-cfm",
          "thermostat",
        ],
      },
      plumbing: {
        title: "Start with where water comes from and where it has to go.",
        text: "Plumbing has two basic jobs: deliver clean water under pressure and remove used water safely with gravity and venting. Once those two ideas are clear, valves, traps, vents, fixtures, and water heaters make much more sense.",
        path: [
          "potable-water",
          "water-pressure",
          "valve",
          "fixture",
          "p-trap",
          "vent-stack",
          "dwv",
          "water-heater",
        ],
      },
      industrial: {
        title: "Start with motion, support, and power transfer.",
        text: "Industrial machines are groups of parts passing force and motion from one place to another. Begin with shafts, bearings, couplings, speed, and torque before moving into pumps, hydraulics, pneumatics, conveyors, and condition monitoring.",
        path: [
          "torque",
          "rpm",
          "shaft",
          "bearing",
          "coupling",
          "gear-ratio",
          "centrifugal-pump",
          "hydraulic-pressure",
          "pneumatic-system",
        ],
      },
      welding: {
        title: "Start with what has to happen for two pieces of metal to become one joint.",
        text: "Welding is not just “make an arc.” A usable weld needs the right process, clean material, joint shape, enough heat, protection from contamination, and controlled movement. Learn those ideas before worrying about advanced settings and inspection language.",
        path: [
          "welding-process",
          "arc",
          "electrode",
          "shielding-gas",
          "joint-design",
          "fillet-weld",
          "heat-input",
          "porosity",
        ],
      },
      construction: {
        title: "Start by learning how a drawing becomes a structure.",
        text: "Construction makes more sense when you see the sequence: read the plan, lay out locations, build assemblies, carry loads safely to the ground, and keep water and air out. Every fastener and framing member belongs somewhere in that chain.",
        path: [
          "floor-plan",
          "scale",
          "layout",
          "wall-framing",
          "header",
          "load-path",
          "foundation",
          "building-envelope",
        ],
      },
    },

    friendly: {
      voltage:
        "Voltage is the electrical push available between two points. It is what can make electricity move when a complete path is available.",
      current: "Current is the amount of electrical flow moving through a working circuit.",
      resistance:
        "Resistance is anything that makes electrical current harder to move through a path.",
      "electrical power":
        "Electrical power tells you how quickly electrical energy is being used to create heat, light, motion, or another result.",
      "ohm's law":
        "Ohm’s law is a simple relationship between electrical push, electrical flow, and resistance. Change one and the others respond.",
      circuit:
        "A circuit is a complete path that lets electricity leave a source, pass through something that uses it, and return.",
      breaker:
        "A breaker is an automatic safety switch that opens a circuit when too much current flows.",
      fuse: "A fuse is a one-time safety device that melts open when current gets too high.",
      relay:
        "A relay is an electrically controlled switch. A small control signal can use it to switch another circuit on or off.",
      contactor:
        "A contactor is a heavy-duty electrically controlled switch. A small control signal tells it when to connect or disconnect larger loads such as motors or compressors.",
      "control circuit":
        "A control circuit is the decision-making side of a machine. It decides when larger equipment is allowed to start, stop, or change state.",
      "ladder logic":
        "Ladder logic is a drawing that shows the conditions that must be true before a machine output is allowed to turn on.",
      plc: "A PLC is an industrial computer that reads inputs, follows programmed logic, and turns outputs on or off.",
      motor: "A motor turns electrical energy into spinning mechanical motion.",
      "motor starter":
        "A motor starter is the group of switching and protection parts used to start and protect a motor.",
      vfd: "A VFD controls an AC motor by changing the electrical frequency and voltage sent to it, which lets the motor run at different speeds.",
      transformer:
        "A transformer uses a magnetic field to change AC voltage from one level to another.",
      grounding:
        "Grounding gives unwanted electrical energy a controlled path and helps protective devices operate when faults occur.",
      neutral:
        "A neutral is the normal return path used by many AC circuits. It is different from the equipment grounding conductor.",
      "short circuit":
        "A short circuit is an unintended low-resistance path that can allow a very large current to flow.",
      "open circuit":
        "An open circuit is a broken or intentionally opened path, so current cannot complete the trip through the circuit.",
      refrigerant:
        "Refrigerant is the fluid HVAC equipment moves around a closed loop so heat can be picked up in one place and released somewhere else.",
      compressor:
        "The compressor is the pump of the refrigeration system. It takes in low-pressure refrigerant vapor and sends out a hotter, higher-pressure vapor.",
      condenser:
        "The condenser is the part of an air-conditioning system that releases heat to the outside air.",
      evaporator:
        "The evaporator is the indoor heat-absorbing coil. Refrigerant inside it picks up heat from the air moving across the coil.",
      "metering device":
        "The metering device controls how much refrigerant enters the evaporator and creates the pressure drop the refrigeration cycle needs.",
      superheat:
        "Superheat tells you how much warmer refrigerant vapor is than its boiling temperature at that pressure. It helps confirm that liquid refrigerant has finished boiling before leaving the evaporator.",
      subcooling:
        "Subcooling tells you how much cooler liquid refrigerant is than its condensing temperature at that pressure.",
      airflow:
        "Airflow is the amount of air moving through the duct system and equipment. HVAC performance depends on moving the right amount of air.",
      "static pressure":
        "Static pressure is the resistance the blower has to push against as air moves through filters, coils, ducts, fittings, and registers.",
      thermostat:
        "A thermostat is the room control that asks the HVAC equipment for heating or cooling when the space temperature moves away from the setting.",
      "potable water": "Potable water is water that is safe for people to drink and use.",
      "water pressure":
        "Water pressure is the pushing force that moves supply water through the piping system.",
      valve:
        "A valve controls whether fluid can flow, how much can flow, or sometimes which direction it can flow.",
      "p-trap":
        "A P-trap is the curved part of a drain that deliberately holds a small amount of water to block sewer gas from entering the room.",
      "vent stack":
        "A vent lets the drainage system breathe so moving water does not pull or push water out of fixture traps.",
      dwv: "DWV means drain, waste, and vent. It is the gravity-flow piping system that removes wastewater and lets the drainage system breathe.",
      "water heater":
        "A water heater stores or heats incoming water so fixtures can receive hot water when needed.",
      backflow:
        "Backflow is unwanted reverse movement that can pull contaminated water toward the clean water supply.",
      bearing: "A bearing supports a moving shaft and lets it rotate with much less friction.",
      shaft:
        "A shaft is a round rotating member that carries torque from one machine part to another.",
      coupling:
        "A coupling joins two shafts so rotation and torque can pass from one to the other.",
      torque:
        "Torque is twisting force. A motor creates torque at its shaft, and the machine uses that twist to do work.",
      "rpm / rotational speed":
        "RPM tells you how many complete turns a shaft makes in one minute.",
      "gear ratio":
        "A gear ratio trades speed for torque. A reduction usually makes the output slower but gives it more turning force.",
      "centrifugal pump":
        "A centrifugal pump uses a spinning impeller to add energy to a liquid and move it through piping.",
      "hydraulic pressure":
        "Hydraulic pressure is force carried through liquid. That pressure can push on a piston to create a much larger mechanical force.",
      "pneumatic system":
        "A pneumatic system uses compressed air to create controlled motion or force.",
      "welding process":
        "A welding process is the method used to create enough heat and control to join metals together.",
      arc: "A welding arc is an electrical discharge through a small gap. It creates the intense heat that melts metal during arc welding.",
      electrode:
        "An electrode carries welding current to the arc. In some processes it also melts and becomes part of the weld.",
      "shielding gas":
        "Shielding gas surrounds the hot weld area and helps keep oxygen and other contamination away while the metal is molten.",
      "fillet weld":
        "A fillet weld joins two surfaces that meet at roughly a right angle, such as a T-joint or lap joint.",
      "heat input":
        "Heat input is a way to describe how much welding energy is put into a length of weld. It affects melting, cooling, distortion, and the heat-affected zone.",
      porosity: "Porosity means small gas pockets were trapped in the weld metal as it solidified.",
      "floor plan":
        "A floor plan is a top-down drawing that shows where walls, openings, fixtures, and spaces belong.",
      layout:
        "Layout is the process of turning drawing dimensions into real marks and locations on the jobsite.",
      "wall framing":
        "Wall framing is the skeleton of a wall: studs, plates, headers, and other members arranged to support and enclose the building.",
      header:
        "A header is a horizontal structural member that carries load across an opening such as a door or window.",
      "load path":
        "A load path is the continuous route that weight and other forces follow through the structure until they reach the ground.",
      "building envelope":
        "The building envelope is the collection of walls, roof, windows, doors, flashing, insulation, and air/water-control layers separating indoors from outdoors.",
      foundation:
        "The foundation is the part of the structure that transfers building loads into the soil.",
    },

    glossary: {
      voltage: "Electrical push between two points.",
      current: "Electrical flow through a complete path.",
      resistance: "Opposition to electrical flow.",
      load: "The part of a system that uses energy to do work.",
      source:
        "Where usable energy comes from, such as a battery, power supply, utility feed, pump, or compressor.",
      conductor: "Material, usually wire or metal, that carries electrical current.",
      coil: "Wire wound into loops so current through it creates a magnetic field.",
      contact:
        "A conductive surface inside a switch, relay, or contactor that opens or closes an electrical path.",
      "normally open": "A contact that is open until something operates it.",
      "normally closed": "A contact that is closed until something operates it.",
      "line side": "The incoming power side of a device.",
      "load side": "The outgoing side feeding the equipment that uses the power.",
      phase:
        "One timed portion of an AC power system. Three-phase power uses three AC waveforms spaced apart in time.",
      frequency: "How many AC cycles happen each second.",
      hertz: "The unit used to measure frequency. One hertz means one cycle per second.",
      torque: "Twisting force.",
      horsepower: "A measure of how quickly mechanical work can be done.",
      pressure:
        "Force spread over an area. In fluids, pressure is what pushes liquid or gas through a system.",
      flow: "How much fluid or air moves through a system over time.",
      restriction: "Something that makes flow harder.",
      temperature: "A measure of how hot or cold something is.",
      heat: "Energy moving because of a temperature difference.",
      refrigerant: "The working fluid that carries heat around an HVAC refrigeration loop.",
      vapor: "The gas form of a substance.",
      liquid: "A fluid state that has a fixed volume but takes the shape of its container.",
      condense: "Change from vapor to liquid.",
      evaporate: "Change from liquid to vapor.",
      cfm: "Cubic feet per minute, a common way to describe airflow amount.",
      "static pressure": "The resistance a blower works against in an air system.",
      "trap seal": "The water held in a drain trap that blocks sewer gas.",
      vent: "A path that lets air enter or leave a drainage system so water can flow correctly.",
      fixture: "A plumbing device people use directly, such as a sink, toilet, shower, or faucet.",
      backflow: "Unwanted reverse movement in a piping system.",
      shaft: "A rotating member that carries torque.",
      bearing: "A part that supports a shaft or other moving member while reducing friction.",
      coupling: "A part that joins two shafts.",
      alignment: "How accurately connected machine centerlines line up with each other.",
      runout: "Wobble or deviation from true rotation.",
      impeller: "The spinning part inside many pumps and fans that adds energy to fluid or air.",
      hydraulic: "Using liquid under pressure to transmit force.",
      pneumatic: "Using compressed air to transmit force or create motion.",
      cylinder:
        "A device with a piston inside that turns fluid pressure into straight-line movement.",
      actuator: "A device that turns a control signal or stored energy into physical movement.",
      arc: "An electrical discharge through a gap that creates intense heat.",
      puddle: "The small pool of molten metal formed during welding.",
      fusion: "Actual melting and joining between the base metal and weld metal.",
      penetration: "How far the weld melts into the joint.",
      "base metal": "The original material being welded.",
      "filler metal": "Additional metal added to help form the weld.",
      "heat-affected zone":
        "Base metal beside the weld that did not melt but changed because of welding heat.",
      stud: "A vertical framing member in a wall.",
      plate: "A horizontal framing member at the top or bottom of a framed wall.",
      joist: "A repeating horizontal member that supports a floor or ceiling.",
      rafter: "A sloped roof framing member.",
      header: "A member that carries load across an opening.",
      load: "A force or weight a structure or machine has to carry.",
      shear: "A force that tries to slide one part past another.",
      compression: "A force that squeezes material together.",
      tension: "A force that pulls material apart.",
      flashing: "Material arranged to direct water back to the outside of a building assembly.",
    },

    replacements: [
      [/potential difference/gi, "electrical push"],
      [/electrical potential/gi, "electrical push"],
      [/energize/gi, "turn on"],
      [/de-energize/gi, "turn off and remove electrical energy from"],
      [/actuate/gi, "operate"],
      [/modulate/gi, "adjust"],
      [/dissipate/gi, "get rid of"],
      [/reciprocating/gi, "back-and-forth"],
      [/rotational/gi, "spinning"],
      [/longitudinal/gi, "front-to-back"],
      [/transverse/gi, "side-to-side"],
      [/kinetic energy/gi, "energy of motion"],
      [/differential pressure/gi, "pressure difference"],
      [/pressure differential/gi, "pressure difference"],
      [/thermal energy/gi, "heat energy"],
      [/mechanical energy/gi, "motion and force"],
      [/fluid power/gi, "using pressurized liquid or air to create force and motion"],
      [/attenuate/gi, "reduce"],
      [/oscillation/gi, "repeated movement"],
      [/discontinuity/gi, "weld flaw or irregularity"],
      [/substrate/gi, "underlying material"],
    ],
  });
})();
