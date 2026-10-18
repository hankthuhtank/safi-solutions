/* =============================================================================
   TradeSchool currency layer
   -----------------------------------------------------------------------------
   Replaces js/content/modernity.js, which wrote everything to `c.deep.*`.
   Nothing in the app ever read `.deep`, so none of that content had rendered
   even once. This file writes to the fields the renderer actually uses:
   recognize[], verify[], failures[], misconceptions[], safety, fieldScenario.

   Every claim here is dated and attributed in D.standards so the site can show
   its own shelf life instead of implying the information is timeless.
   Reviewed against published sources as of August 2026.
   ========================================================================== */
(() => {
  const D = window.TRADE_DATA;
  if (!D || !D.concepts) return;

  const byId = Object.fromEntries(D.concepts.map((c) => [c.id, c]));

  /* ---------------------------------------------------------------------------
     The standards register. Rendered by the "Standards and currency" page so a
     learner can see what edition each statement is written against.
     -------------------------------------------------------------------------*/
  D.standards = {
    reviewed: "August 2026",
    note: "Editions and dates below were verified against published sources. Codes are adopted locally with amendments, so the authority having jurisdiction always outranks anything on this site.",
    items: [
      {
        world: "hvac",
        key: "AIM Act Technology Transitions Rule",
        current: "GWP limit in force since 1 Jan 2026",
        detail:
          "New residential and light commercial HVAC systems can no longer be installed using refrigerants above roughly 700 GWP, which rules out R-410A for new installs. Manufacture of new R-410A residential systems already ended 1 Jan 2025.",
        soWhat:
          "Existing R-410A equipment is still legal to service indefinitely. The phasedown applies to new equipment, not to the installed base.",
      },
      {
        world: "hvac",
        key: "ASHRAE 34 refrigerant classification",
        current: "R-454B and R-32 are A2L",
        detail:
          "A2L means lower flammability and low toxicity. R-454B is an R-32 / R-1234yf blend at roughly 466 GWP; R-32 is a single component at roughly 675 GWP.",
        soWhat:
          "A2L refrigerants cannot be charged into equipment built for R-410A. The equipment itself has to be rated for them.",
      },
      {
        world: "hvac",
        key: "EPA Section 608",
        current: "Still required for refrigerant handling",
        detail:
          "Existing 608 certification covers A2L handling. A2L-specific training and A2L-rated recovery machines, gauges and leak detection are increasingly required by employers and by local jurisdictions.",
        soWhat: "The certification did not change. The tools on the truck did.",
      },
      {
        world: "electrical",
        key: "NFPA 70 National Electrical Code",
        current: "2026 edition published",
        detail:
          "Three-year revision cycle. The 2026 edition expands arc-flash labeling under 110.16 and aligns that labeling with NFPA 70E.",
        soWhat:
          "Adoption is state by state and often lags the publication date. Ask which edition your jurisdiction has adopted before quoting an article number.",
      },
      {
        world: "electrical",
        key: "NFPA 70E Electrical Safety in the Workplace",
        current: "2024 edition",
        detail:
          "Defines the arc-flash risk assessment, approach boundaries, PPE categories 1 through 4 and the energized work permit. Paired with IEEE 1584-2018 for incident energy calculation.",
        soWhat:
          "PPE comes from the facility's arc-flash study, not from a category memorized off a chart.",
      },
      {
        world: "plumbing",
        key: "Safe Drinking Water Act, Section 1417 / NSF-ANSI-CAN 372",
        current: "Lead-free definition unchanged since 2014",
        detail:
          "Lead-free means a weighted average of no more than 0.25% lead across the wetted surfaces of pipe, fittings and fixtures, and no more than 0.2% in solder and flux.",
        soWhat:
          "Salvaged brass of unknown compliance does not belong on a potable line, no matter how good it looks.",
      },
      {
        world: "welding",
        key: "AWS D1.1 / D1.1M Structural Welding Code, Steel",
        current: "2025 edition, 25th edition",
        detail:
          "Approved March 2025, superseding the 2020 edition. Covers prequalified WPSs, joint details, workmanship and inspection for carbon and low-alloy structural steel.",
        soWhat:
          "Which edition governs is set by the contract documents, not by the newest book on the shelf.",
      },
      {
        world: "welding",
        key: "OSHA hexavalent chromium PEL",
        current: "5 micrograms per cubic metre, 8-hour TWA",
        detail:
          "Stainless and chrome-bearing base metals and coatings put Cr(VI) into the fume. NIOSH-funded sampling of construction welders found a substantial share of breathing-zone samples over the PEL, with stick welding on stainless the worst case.",
        soWhat:
          "Fume control is chosen from the base metal and any coating on it, not from the process alone. Local exhaust at the source is the control that actually moves the number.",
      },
    ],
  };

  /* ---------------------------------------------------------------------------
     Helpers. All of these are additive and idempotent so re-running is safe.
     -------------------------------------------------------------------------*/
  const has = (v, needle) =>
    JSON.stringify(v || "")
      .toLowerCase()
      .includes(needle.toLowerCase());

  function addTo(id, field, lines) {
    const c = byId[id];
    if (!c) return false;
    if (!Array.isArray(c[field])) c[field] = c[field] ? [c[field]] : [];
    (Array.isArray(lines) ? lines : [lines]).forEach((t) => {
      if (!c[field].some((existing) => existing === t)) c[field].push(t);
    });
    c.currency = true;
    return true;
  }

  function setSafety(id, text) {
    const c = byId[id];
    if (!c) return false;
    c.safety = text;
    c.currency = true;
    return true;
  }

  function setScenario(id, text) {
    const c = byId[id];
    if (!c) return false;
    c.fieldScenario = text;
    c.currency = true;
    return true;
  }

  const applied = [];
  const miss = [];
  const tryAll = (id, fn) => {
    if (byId[id]) {
      fn();
      applied.push(id);
    } else {
      miss.push(id);
    }
  };

  /* ============================ HVAC ====================================== */

  tryAll("refrigerant", () => {
    addTo("refrigerant", "recognize", [
      "Read the refrigerant off the equipment nameplate before you connect anything. Three generations are in service at once: R-22 on legacy equipment, R-410A across a very large installed base, and A2L R-454B or R-32 on new residential and light commercial systems.",
      "A2L cylinders and equipment carry flammability marking and often left-hand thread fittings. That marking is the signal that the service procedure changes.",
    ]);
    addTo("refrigerant", "verify", [
      "Match the pressure-temperature chart to the refrigerant actually in the system. A remembered R-410A number applied to an R-454B system produces a wrong superheat and a wrong diagnosis.",
      "Never mix refrigerants or top off a blend after a leak without following the manufacturer's guidance. Cross-contamination gives you unknown pressures and unknown flammability.",
    ]);
    addTo("refrigerant", "misconceptions", [
      "R-410A equipment is not illegal and does not have to be replaced. Since 1 January 2026 the restriction is on installing new high-GWP systems, not on servicing existing ones.",
      "A2L refrigerant cannot be dropped into an R-410A system. The equipment has to be built and rated for it, including its controls and any required leak detection.",
    ]);
    setSafety(
      "refrigerant",
      "A2L refrigerants are mildly flammable. Recovery machines, gauges, vacuum pumps and leak detectors have to be rated for A2L, and cylinders are not transported in a passenger compartment. EPA Section 608 certification is still required for handling; A2L-specific training is increasingly required on top of it.",
    );
  });

  tryAll("compressor", () => {
    addTo("compressor", "recognize", [
      "A compressor raises pressure so the refrigerant can reject heat to outdoor air. It does not create cold. If suction and discharge pressures sit close together with the unit running, it is not compressing.",
    ]);
    addTo("compressor", "verify", [
      "Compare measured suction and discharge pressure against the P-T chart for the refrigerant named on the nameplate, at the actual indoor and outdoor conditions.",
    ]);
    setScenario(
      "compressor",
      "A rooftop unit runs but barely cools. Before condemning the compressor, confirm airflow across both coils, verify the charge against the correct P-T chart, and check that the pressure difference across the compressor is developing at all. A compressor that draws current and turns without building a pressure split has usually lost valves or is short-cycling on a control problem, and neither is fixed by adding refrigerant.",
    );
  });

  tryAll("superheat", () => {
    addTo("superheat", "verify", [
      "Superheat is measured suction line temperature minus the saturation temperature that corresponds to suction pressure, taken from the chart for that specific refrigerant.",
      "On a zeotropic blend such as R-454B, use the dew point column for superheat and the bubble point column for subcooling. Using one column for both is a common source of a wrong charge.",
    ]);
  });

  tryAll("subcooling", () => {
    addTo("subcooling", "verify", [
      "Subcooling is the saturation temperature at liquid line pressure minus the measured liquid line temperature, read off the chart for that refrigerant. On blends, use the bubble point column.",
    ]);
  });

  tryAll("metering-device", () => {
    addTo("metering-device", "recognize", [
      "Look for a TXV with a sensing bulb and equalizer line, a fixed piston, or a capillary tube at the evaporator inlet. The metering device is matched to the refrigerant and the coil, so it is not interchangeable across refrigerant types.",
    ]);
    addTo("metering-device", "misconceptions", [
      "Most calls written up as a bad TXV turn out to be airflow, charge or a sensing bulb that lost contact with the suction line. Prove those three before replacing the valve.",
    ]);
  });

  tryAll("hvac-service-safety", () => {
    addTo("hvac-service-safety", "recognize", [
      "Check the nameplate refrigerant before the gauges come out. An A2L system changes which recovery machine, which leak detector and which brazing sequence are acceptable.",
    ]);
    setSafety(
      "hvac-service-safety",
      "A2L work adds ventilation and ignition-source control to the usual electrical and pressure hazards. Purge and evacuate before any cutting or brazing, keep cylinders out of the passenger compartment and out of unventilated trucks overnight, and treat every cylinder as the refrigerant its label says it is.",
    );
  });

  /* ========================== ELECTRICAL ================================== */

  tryAll("arc-flash", () => {
    addTo("arc-flash", "recognize", [
      "An arc-flash label carries nominal system voltage, the arc-flash boundary, and either the incident energy with its working distance or the PPE category, plus the date of the study. A missing or undated label means the hazard has not been established for that equipment.",
    ]);
    addTo("arc-flash", "verify", [
      "Required PPE comes from the facility's arc-flash risk assessment under NFPA 70E, not from a category recalled from memory. Where incident energy exceeds 40 cal/cm2, energized work is not performed.",
      "Establishing an electrically safe work condition ranks above every level of PPE. PPE is the last control in the hierarchy, not the first.",
    ]);
    setSafety(
      "arc-flash",
      "NFPA 70E-2024 is the current edition, paired with IEEE 1584-2018 for incident energy calculation. OSHA has no separate arc-flash standard and cites 70E as recognized industry practice. The arc-flash boundary is the distance at which incident energy falls to 1.2 cal/cm2. Anyone inside it needs the assessed protection, whether or not they are the one doing the work.",
    );
  });

  tryAll("multimeter", () => {
    addTo("multimeter", "recognize", [
      "Check the meter's CAT rating and its voltage rating against the circuit you are about to touch. A CAT III 600 V meter does not belong on a CAT IV service entrance.",
    ]);
    addTo("multimeter", "verify", [
      "Use a true-RMS meter on anything that is not a clean sine wave. Average-responding meters misread VFD outputs, electronic ballasts and switching supplies, sometimes by a wide margin.",
      "Prove the meter on a known live source before and after the measurement that matters. A meter with a blown fuse or an open lead reads zero volts on a live conductor.",
    ]);
  });

  tryAll("vfd", () => {
    addTo("vfd", "recognize", [
      "A VFD is rectifier, DC bus, then inverter. Faults sort themselves by which of the three sections is complaining, and the drive's own fault code is the first place to look.",
    ]);
    addTo("vfd", "failures", [
      "DC bus capacitors hold hazardous voltage after the input is opened. Follow the manufacturer's discharge time and confirm with a meter rather than assuming.",
    ]);
    addTo("vfd", "verify", [
      "Drive output is a switched waveform, not a sine wave. Measure it with a true-RMS meter, and expect a standard meter to disagree with the drive's own display.",
    ]);
    addTo("vfd", "misconceptions", [
      "Motor cable length and grounding practice are part of the installation, not an afterthought. Long unshielded runs produce reflected wave stress on motor insulation and put noise onto nearby signal wiring.",
    ]);
  });

  tryAll("rms", () => {
    addTo("rms", "recognize", [
      "RMS is the effective heating value of an AC quantity. A true-RMS meter computes it for any waveform shape; an average-responding meter assumes a sine wave and scales, which fails around drives and electronic loads.",
    ]);
  });

  tryAll("grounding", () => {
    addTo("grounding", "misconceptions", [
      "Grounding and bonding are not the same job. Bonding ties metal parts together so fault current has a low-impedance path back to the source; grounding references the system to earth. Fault clearing depends on the bonded path, not on the earth connection.",
    ]);
  });

  /* =========================== PLUMBING =================================== */

  tryAll("potable-water", () => {
    addTo("potable-water", "recognize", [
      "Potable-line components carry lead-free marking. Under the Safe Drinking Water Act and NSF/ANSI/CAN 372, lead-free means a weighted average of at most 0.25% lead across wetted surfaces, and at most 0.2% in solder and flux.",
    ]);
    addTo("potable-water", "verify", [
      "Confirm the marking on valves and fittings before they go on a drinking-water line. Salvage brass of unknown compliance does not belong on potable work.",
    ]);
  });

  tryAll("copper-tube", () => {
    addTo("copper-tube", "verify", [
      "Potable copper joints use lead-free solder, brazing, or an approved press or mechanical fitting. Traditional leaded solder is not permitted on drinking-water systems.",
    ]);
    addTo("copper-tube", "recognize", [
      "Press fittings have become common on potable and hydronic copper. Each system has its own jaw set and its own required tube preparation, and an unpressed joint can hold under test but leak later, which is why manufacturers build in a leak-before-press feature.",
    ]);
  });

  tryAll("pex", () => {
    addTo("pex", "recognize", [
      "PEX-A, PEX-B and PEX-C are all accepted for potable water when they carry the appropriate NSF certification. Joining is what differs: expansion, crimp ring, clamp or push-fit, each with its own tool and its own fitting.",
    ]);
    addTo("pex", "verify", [
      "Match the ring and tool to the tubing standard, respect the bend radius, and keep PEX out of sunlight. UV exposure degrades it, including exposure while it sits on the job.",
    ]);
  });

  tryAll("backflow-prevention", () => {
    addTo("backflow-prevention", "recognize", [
      "The device follows the hazard. Vacuum breakers and dual checks cover low-hazard cases; high-hazard applications generally require a testable assembly such as a reduced-pressure zone device.",
    ]);
    addTo("backflow-prevention", "verify", [
      "Testable assemblies have required orientation, clearance and drain provisions, plus periodic testing by a certified tester under local code. An assembly installed backwards or without its air gap is not protection.",
    ]);
  });

  /* ============================ WELDING =================================== */

  tryAll("heat-input", () => {
    addTo("heat-input", "verify", [
      "Heat input in kJ/in is (volts x amps x 60) divided by travel speed in inches per minute. All three variables move it, which is why travel speed cannot be treated as a comfort setting.",
    ]);
  });

  tryAll("fume-control", () => {
    addTo("fume-control", "recognize", [
      "Fume hazard is set by the base metal and any coating on it, not by the process. Stainless and chrome-bearing material put hexavalent chromium into the fume; galvanized puts zinc oxide in; painted and plated stock can put almost anything in.",
    ]);
    setSafety(
      "fume-control",
      "OSHA's hexavalent chromium PEL is 5 micrograms per cubic metre as an 8-hour time-weighted average. NIOSH-funded sampling of construction welders found a significant share of breathing-zone samples above it, with stick welding on stainless the highest exposure. Local exhaust at the source is the control that measurably reduces it; a shop fan moves fume around rather than removing it.",
    );
  });

  tryAll("welding-symbols", () => {
    addTo("welding-symbols", "misconceptions", [
      "The side of the reference line matters: below the line is the arrow side, above the line is the other side. Reading that backwards puts the weld on the wrong face of the joint.",
    ]);
  });

  /* ========================== CONSTRUCTION ================================ */

  tryAll("load-path", () => {
    addTo("load-path", "recognize", [
      "Follow the load down without skipping a step: sheathing to framing, framing to header or beam, into jacks or posts, through the plate, into the foundation, into the soil. Any step that is missing or undersized is where the assembly finds out.",
    ]);
  });

  tryAll("air-barrier", () => {
    addTo("air-barrier", "misconceptions", [
      "An air barrier and a vapour retarder are different jobs and can be different layers. Air leakage moves far more moisture into an assembly than vapour diffusion does, which is why continuity matters more than permeance rating on most walls.",
    ]);
  });

  /* ============================ INDUSTRIAL ================================ */

  tryAll("bearing", () => {
    addTo("bearing", "recognize", [
      "Most bearing failures trace back to lubrication, contamination, misalignment or mounting, not to the bearing being defective. Read the failed surfaces before ordering the replacement.",
    ]);
  });

  tryAll("safety-loto", () => {
    setSafety(
      "safety-loto",
      "Hazardous energy is not only electrical. Stored energy in hydraulic accumulators, pneumatic receivers, springs, suspended loads, thermal mass and VFD DC bus capacitors all has to be released or restrained, then verified by test, before the work starts.",
    );
  });

  console.log(
    `V15 currency: applied to ${applied.length} concept(s)` +
      (miss.length ? `, ${miss.length} target id(s) not present: ${miss.join(", ")}` : ""),
  );
})();
