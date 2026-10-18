(() => {
  const D = window.TRADE_DATA;
  if (!D) return;

  const asset = (src, title, caption, credit = "", license = "", url = "") => ({
    src,
    title,
    caption,
    credit,
    license,
    url,
  });

  D.visualAssets = Object.assign({}, D.visualAssets || {}, {
    "motor-nameplate": asset(
      "assets/reference/electrical/motor_nameplate_crop.jpg",
      "Motor nameplate close-up",
      "Close crop of the motor nameplate so learners can focus on volts, amps, phase, hertz and RPM instead of the whole motor.",
      "Derived from KishanMalaviyaatCHETAK ELECTRICALS / Wikimedia Commons",
      "CC BY-SA 4.0",
      "https://commons.wikimedia.org/wiki/File:Three_Phase_Induction_Motor.jpg",
    ),
    "hydraulic-pressure": asset(
      "assets/reference/industrial/hydraulic_pressure_system.svg",
      "Hydraulic pressure in context",
      "Pressure belongs to the whole circuit. The pump provides flow, the load creates resistance, and the gauge tells you how much pressure developed.",
      "TradeSchool V8 technical visual",
    ),
    cylinder: asset(
      "assets/reference/industrial/hydraulic_cylinder.jpg",
      "Hydraulic cylinder",
      "Real hydraulic cylinder showing the barrel, rod and mounting hardware learners should recognize in the field.",
      "S.J. de Waard / Wikimedia Commons",
      "CC BY 2.5",
      "https://commons.wikimedia.org/wiki/File:Hydraulic_cylinder.JPG",
    ),
    "cylinder-area": asset(
      "assets/reference/industrial/cylinder_area_force.svg",
      "Cylinder area and force",
      "Technical visual showing why the same pressure creates different force when piston area changes.",
      "TradeSchool V8 technical visual",
    ),
    "welding-ppe": asset(
      "assets/reference/welding/welding_ppe_reference.svg",
      "Welding PPE system",
      "Learners should think in systems: helmet, gloves, clothing and fume control all work together.",
      "TradeSchool V8 technical visual",
    ),
    "helmet-shade": asset(
      "assets/reference/welding/helmet_lens_closeup.jpg",
      "Helmet lens close-up",
      "Closer view of the shield window so the lens area becomes the focus, not the entire helmet.",
      "Derived from Sunnybansodeva / Wikimedia Commons",
      "CC BY-SA 4.0",
      "https://commons.wikimedia.org/wiki/File:Welding_helmet.jpg",
    ),
    header: asset(
      "assets/reference/construction/header_opening_crop.jpg",
      "Wall opening and header framing",
      "Cropped framing reference that keeps attention on the opening, header and supporting studs.",
      "Derived from Nerv3d5053 / Wikimedia Commons",
      "CC BY-SA 4.0",
      "https://commons.wikimedia.org/wiki/File:Light_Framing_Construction_Picture.jpg",
    ),
    "building-envelope": asset(
      "assets/reference/construction/building_envelope_detail.svg",
      "Window opening envelope detail",
      "A clean assembly reference is more useful here than a vague decorative diagram. It shows where water management and layer continuity matter.",
      "TradeSchool V8 technical visual",
    ),
    flashing: asset(
      "assets/reference/construction/building_envelope_detail.svg",
      "Flashing at an opening",
      "Use the detail to understand how the head and sill pieces direct water back out of the assembly.",
      "TradeSchool V8 technical visual",
    ),
    rebar: asset(
      "assets/reference/construction/rebar_detail_crop.jpg",
      "Rebar detail",
      "Closer framing of reinforcing steel inside formwork so spacing and placement are easier to notice.",
      "Derived from MTA Capital Construction Mega Projects / Wikimedia Commons",
      "CC BY 2.0",
      "https://commons.wikimedia.org/wiki/File:Layout_and_installation_of_rebar_in_wooden_frames_in_preparation_for_a_concrete_pour._09-04-2019_(48688958673).jpg",
    ),
    "welding-symbols": asset(
      "assets/reference/welding/tig_welding.jpg",
      "Weld in context",
      "The drawing symbol exists to describe work like this in the shop or field. Always connect the symbol to a real joint.",
      "Prowelder87 / Wikimedia Commons",
      "CC BY-SA 4.0",
      "https://commons.wikimedia.org/wiki/File:Tig_Welding.jpg",
    ),
  });

  D.unitVisuals = Object.assign({}, D.unitVisuals || {}, {
    industrial: {
      "ind-fluid": [
        asset(
          "assets/reference/industrial/hydraulic_pressure_system.svg",
          "Pressure in the hydraulic circuit",
          "Start by separating pressure, flow and actuator force.",
          "TradeSchool V8 technical visual",
        ),
        asset(
          "assets/reference/industrial/hydraulic_cylinder.jpg",
          "Real hydraulic cylinder",
          "Recognize the cylinder body, rod and mounting points on actual equipment.",
          "S.J. de Waard / Wikimedia Commons",
        ),
        asset(
          "assets/reference/industrial/cylinder_area_force.svg",
          "Piston area changes force",
          "Same pressure, different piston area = different output force.",
          "TradeSchool V8 technical visual",
        ),
      ],
    },
    welding: {
      "weld-safety": [
        asset(
          "assets/reference/welding/welding_ppe_reference.svg",
          "PPE as a system",
          "Think beyond the face shield: gloves, clothing and fume control matter too.",
          "TradeSchool V8 technical visual",
        ),
        asset(
          "assets/reference/welding/helmet_lens_closeup.jpg",
          "Lens and viewing window",
          "A closer look at the area that actually protects your eyes from the arc.",
          "Derived from Sunnybansodeva / Wikimedia Commons",
        ),
        asset(
          "assets/reference/welding/tig_welding.jpg",
          "Arc work context",
          "Use a real process photo to connect PPE choices to the hazards at the weld.",
          "Prowelder87 / Wikimedia Commons",
        ),
      ],
    },
    construction: {
      "const-envelope": [
        asset(
          "assets/reference/construction/building_envelope_detail.svg",
          "Envelope continuity at an opening",
          "Use this as the anchor visual for WRB, drainage plane and flashing.",
          "TradeSchool V8 technical visual",
        ),
        asset(
          "assets/reference/construction/header_opening_crop.jpg",
          "Framing around the opening",
          "The opening is where structure and envelope details collide.",
          "Derived from Nerv3d5053 / Wikimedia Commons",
        ),
      ],
      "const-framing": [
        asset(
          "assets/reference/construction/light_framing.jpg",
          "Real light-frame wall",
          "Start with a field view of studs, plates, sheathing and openings.",
          "Nerv3d5053 / Wikimedia Commons",
        ),
        asset(
          "assets/reference/construction/header_opening_crop.jpg",
          "Header and support studs",
          "A tighter crop helps learners see how loads move around the opening.",
          "Derived from Nerv3d5053 / Wikimedia Commons",
        ),
      ],
      "const-materials": [
        asset(
          "assets/reference/construction/rebar_formwork.jpg",
          "Rebar inside formwork",
          "The structural assembly exists before the concrete pour ever begins.",
          "MTA Capital Construction Mega Projects / Wikimedia Commons",
        ),
        asset(
          "assets/reference/construction/rebar_detail_crop.jpg",
          "Rebar detail",
          "Use the close crop to talk about placement, cover and support.",
          "Derived from MTA Capital Construction Mega Projects / Wikimedia Commons",
        ),
      ],
    },
    electrical: {
      motors: [
        asset(
          "assets/reference/electrical/three_phase_motor.jpg",
          "Three-phase motor",
          "Use the full motor photo for overall recognition.",
          "KishanMalaviyaatCHETAK ELECTRICALS / Wikimedia Commons",
        ),
        asset(
          "assets/reference/electrical/motor_nameplate_crop.jpg",
          "Motor nameplate close-up",
          "Then zoom in on the data plate to learn what technicians actually read.",
          "Derived from KishanMalaviyaatCHETAK ELECTRICALS / Wikimedia Commons",
        ),
      ],
    },
  });
})();
