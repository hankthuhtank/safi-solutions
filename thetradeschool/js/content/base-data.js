window.TRADE_DATA = {
  worlds: [
    {
      id: "electrical",
      name: "Electrical",
      icon: "⚡",
      kicker: "Power · Controls · Automation",
      description: "From voltage and relays to PLCs, motors, drives, diagnostics and industrial controls.",
      status: "live",
      accent: "#d7ff64",
      topics: 34
    },
    {
      id: "hvac",
      name: "HVAC",
      icon: "❄",
      kicker: "Airflow · Refrigeration · Controls",
      description: "Follow heat, pressure, refrigerant and airflow through real equipment and control systems.",
      status: "next",
      accent: "#81d8ff",
      topics: 0
    },
    {
      id: "plumbing",
      name: "Plumbing",
      icon: "◉",
      kicker: "Water · Drainage · Pressure",
      description: "Explore water supply, drainage, venting, fixtures, pumps, valves and troubleshooting.",
      status: "next",
      accent: "#60e4d3",
      topics: 0
    },
    {
      id: "industrial",
      name: "Industrial Maintenance",
      icon: "⚙",
      kicker: "Mechanical · Hydraulics · Pneumatics",
      description: "Bearings, pumps, conveyors, compressed air, hydraulics and machine reliability.",
      status: "next",
      accent: "#ffb76b",
      topics: 0
    },
    {
      id: "welding",
      name: "Welding",
      icon: "✦",
      kicker: "Process · Metallurgy · Inspection",
      description: "See what the arc, puddle, heat input and joint design are doing while you learn.",
      status: "next",
      accent: "#ff8f77",
      topics: 0
    },
    {
      id: "construction",
      name: "Construction",
      icon: "⌂",
      kicker: "Framing · Plans · Materials",
      description: "Read structures visually: loads, framing, fasteners, layout, plans and sequencing.",
      status: "next",
      accent: "#d7b8ff",
      topics: 0
    }
  ],
  categories: [
    { id: "fundamentals", name: "Fundamentals", icon: "01", description: "The invisible rules everything else follows." },
    { id: "circuits", name: "Circuits", icon: "02", description: "How electricity gets a path, a load and a job." },
    { id: "components", name: "Components", icon: "03", description: "The hardware you touch every day." },
    { id: "motors", name: "Motors", icon: "04", description: "Turn electrical energy into motion." },
    { id: "controls", name: "Controls", icon: "05", description: "Make machines start, stop and behave." },
    { id: "plc", name: "PLC + Ladder", icon: "06", description: "Industrial logic translated into something you can see." },
    { id: "drives", name: "Drives", icon: "07", description: "Control motor speed, torque and acceleration." },
    { id: "sensors", name: "Sensors", icon: "08", description: "Teach machines how to sense the world." },
    { id: "power", name: "Power", icon: "09", description: "Transformers, three-phase and distribution." },
    { id: "diagnostics", name: "Diagnostics", icon: "10", description: "Measure, isolate, prove and repair." },
    { id: "safety", name: "Safety", icon: "11", description: "Control hazardous energy before it controls you." }
  ],
  concepts: [
    {
      id:"voltage", category:"fundamentals", title:"Voltage", eyebrow:"Electrical Fundamentals",
      oneLine:"Electrical potential difference: the push available to move charge.",
      plain:"Voltage is the electrical pressure between two points. It does not tell you how much current is actually flowing; it tells you how much potential exists to make current flow when a path is available.",
      analogy:"Think of water pressure. A closed valve can still have pressure behind it. In the same way, a wire can have voltage present even when almost no current is flowing.",
      where:["Control power supplies","Motor circuits","Batteries","PLC I/O","Residential receptacles"],
      failures:["Low supply voltage can prevent contactors from pulling in.","Overvoltage can overheat or destroy loads.","A measured voltage can disappear under load if the source has high resistance."],
      safety:"Voltage can exist even when equipment looks idle. Verify absence of voltage using an appropriately rated meter and the required safety procedure.",
      related:["current","resistance","power","multimeter"],
      lesson:"voltage"
    },
    {
      id:"current", category:"fundamentals", title:"Current", eyebrow:"Electrical Fundamentals",
      oneLine:"The rate at which electric charge moves through a complete path.",
      plain:"Current is what actually flows through a circuit when voltage has a closed path to push through. Loads determine how much current flows based on their effective resistance or impedance.",
      analogy:"If voltage is water pressure, current is the amount of water flowing through the pipe.",
      where:["Motor nameplates","Breaker sizing","Fuse selection","Heater circuits","Troubleshooting"],
      failures:["Excessive current overheats conductors and equipment.","A stalled motor often draws very high current.","Zero current where current is expected usually means the path is open."],
      safety:"Never place an ammeter directly across a voltage source. Current measurements must use the correct meter mode and method.",
      related:["voltage","resistance","power","overload"],
      lesson:"ohms"
    },
    {
      id:"resistance", category:"fundamentals", title:"Resistance", eyebrow:"Electrical Fundamentals",
      oneLine:"Opposition to current flow, measured in ohms.",
      plain:"Resistance limits current. Conductors have low resistance; loads intentionally create resistance or impedance so electrical energy can be converted into heat, light, motion or another useful form.",
      analogy:"A narrow pipe restricts water flow. Electrical resistance restricts current flow.",
      where:["Heaters","Motor windings","Coils","Sensors","Conductors"],
      failures:["Unexpected resistance in a connection creates heat and voltage drop.","An open circuit is effectively extremely high resistance.","A short circuit is an unintended very low resistance path."],
      safety:"Resistance measurements are normally performed on de-energized circuits. Stored energy must also be addressed.",
      related:["voltage","current","short-circuit","multimeter"],
      lesson:"ohms"
    },
    {
      id:"power", category:"fundamentals", title:"Electrical Power", eyebrow:"Electrical Fundamentals",
      oneLine:"The rate electrical energy is converted or used.",
      plain:"In a simple DC circuit, power is voltage multiplied by current. A load that consumes more power generally creates more heat, light, motion or other output.",
      analogy:"Power is how quickly the electrical system is doing work.",
      where:["Motor horsepower","Heaters","Power supplies","Lighting","Energy calculations"],
      failures:["Excess power dissipation overheats parts.","Undersized power supplies can sag or shut down.","Unexpected power draw can reveal mechanical or electrical problems."],
      safety:"Power implies energy. Even lower-voltage systems can create dangerous heat, arcs or mechanical motion when high current is available.",
      related:["voltage","current","three-phase"],
      lesson:"ohms"
    },
    {
      id:"ac-dc", category:"fundamentals", title:"AC vs DC", eyebrow:"Electrical Fundamentals",
      oneLine:"Two different ways voltage and current behave over time.",
      plain:"Direct current keeps the same polarity direction. Alternating current reverses polarity periodically. Industrial systems often use AC for power and DC for controls, sensors and electronics.",
      analogy:"DC is traffic moving one direction. AC is traffic rhythmically reversing direction.",
      where:["24 VDC controls","120 VAC controls","Three-phase motors","Batteries","Power supplies"],
      failures:["Using an AC-rated device incorrectly on DC can change switching behavior.","Wrong supply type can destroy electronic inputs.","Polarity matters on many DC devices."],
      safety:"Treat both AC and DC sources according to their actual voltage, available fault current and equipment category.",
      related:["three-phase","power-supply","plc-inputs"],
      lesson:"wave"
    },
    {
      id:"series-parallel", category:"circuits", title:"Series vs Parallel", eyebrow:"Circuit Behavior",
      oneLine:"Component arrangement determines how voltage and current are shared.",
      plain:"Series components share one current path. Parallel branches share the same applied voltage while current divides among the branches.",
      analogy:"Series is one road every car must use. Parallel creates multiple roads between the same two locations.",
      where:["Safety strings","Lighting","Sensor circuits","Resistor networks","Troubleshooting"],
      failures:["One open device in a series path can stop everything downstream.","A shorted parallel branch can draw excessive current.","Misreading topology causes bad meter conclusions."],
      safety:"Topology does not reduce the need to verify actual energy sources and isolation.",
      related:["voltage","current","open-circuit","short-circuit"],
      lesson:"series"
    },
    {
      id:"open-circuit", category:"circuits", title:"Open Circuit", eyebrow:"Circuit Behavior",
      oneLine:"A broken path that prevents normal current flow.",
      plain:"An open circuit exists when the intended current path is interrupted. The source may still be energized, so voltage can remain present on one side of the opening.",
      analogy:"A closed water valve stops flow even though pressure still exists upstream.",
      where:["E-stops","Blown fuses","Broken wires","Open switches","Failed overload contacts"],
      failures:["Broken conductor","Loose terminal","Failed contact","Blown protective device"],
      safety:"An open circuit is not automatically de-energized. Voltage may remain present.",
      related:["short-circuit","multimeter","fuse","overload"],
      lesson:"none"
    },
    {
      id:"short-circuit", category:"circuits", title:"Short Circuit", eyebrow:"Circuit Behavior",
      oneLine:"An unintended low-resistance path that can allow extreme current.",
      plain:"A short bypasses the intended load or connects conductors that should not be directly connected. Protective devices are designed to interrupt dangerous fault current.",
      analogy:"Imagine a water main suddenly connected to a huge open pipe with almost no restriction.",
      where:["Damaged insulation","Pinched conductors","Failed components","Incorrect wiring"],
      failures:["Blown fuse","Tripped breaker","Arc damage","Burned conductors"],
      safety:"Fault current can create severe arc and fire hazards. Do not repeatedly reset protection without finding the cause.",
      related:["fuse","breaker","resistance","grounding"],
      lesson:"none"
    },
    {
      id:"relay", category:"components", title:"Relay", eyebrow:"Components",
      oneLine:"An electrically operated switch that lets one circuit control another.",
      plain:"A relay uses an electromagnetic coil to mechanically change one or more contacts. The control circuit energizes the coil; the contacts switch another circuit.",
      analogy:"A tiny electrical command moves a mechanical finger that flips another switch.",
      where:["Control panels","HVAC controls","Machine interlocks","Alarm circuits","PLC interface circuits"],
      failures:["Open coil","Welded contacts","Pitted contacts","Wrong coil voltage","Mechanical sticking"],
      safety:"Coil voltage and contact voltage can be completely different. De-energize all relevant sources before servicing.",
      related:["contactor","coil","normally-open","normally-closed"],
      lesson:"relay"
    },
    {
      id:"contactor", category:"components", title:"Contactor", eyebrow:"Components",
      oneLine:"A heavy-duty electrically controlled switch commonly used for motors and large loads.",
      plain:"A contactor is similar in principle to a relay but is designed to switch higher-power loads repeatedly. A low-power coil controls large main contacts.",
      analogy:"A relay's bigger industrial cousin, built to switch serious loads thousands of times.",
      where:["Motor starters","HVAC compressors","Heaters","Lighting contactors","Industrial panels"],
      failures:["Burned contacts","Weak coil","Chatter from low coil voltage","Mechanical binding","Welded contacts"],
      safety:"The control circuit may be de-energized while line power remains present on the main poles.",
      related:["relay","motor-starter","overload","coil"],
      lesson:"relay"
    },
    {
      id:"fuse", category:"components", title:"Fuse", eyebrow:"Components",
      oneLine:"A sacrificial overcurrent device that opens when current exceeds its design.",
      plain:"A fuse contains an element designed to melt under specified overcurrent conditions, interrupting the circuit and protecting conductors or equipment.",
      analogy:"A deliberately weak link that breaks before expensive equipment does.",
      where:["Control transformers","Motor branch circuits","Disconnects","Electronic equipment"],
      failures:["Nuisance opening","Wrong replacement class/rating","Fault downstream","Loose fuse clips"],
      safety:"Never replace a fuse with a larger rating just to stop it opening. Determine why it operated.",
      related:["breaker","short-circuit","overload"],
      lesson:"none"
    },
    {
      id:"breaker", category:"components", title:"Circuit Breaker", eyebrow:"Components",
      oneLine:"A resettable protective device that opens a circuit during abnormal current.",
      plain:"Breakers detect overcurrent conditions and mechanically separate contacts. Different breakers have different trip characteristics and interrupting ratings.",
      analogy:"An automatic gate that opens when traffic becomes dangerously excessive.",
      where:["Distribution panels","Machine disconnects","Branch circuits","Motor circuits"],
      failures:["Repeated trips","Mechanical failure","Incorrect sizing","Fault downstream"],
      safety:"Resetting a breaker without understanding the cause can re-energize a dangerous fault.",
      related:["fuse","short-circuit","overload"],
      lesson:"none"
    },
    {
      id:"coil", category:"components", title:"Electromagnetic Coil", eyebrow:"Components",
      oneLine:"A wound conductor that creates a magnetic field when current flows.",
      plain:"Coils are used in relays, contactors, solenoids, valves and motors. Energizing the coil creates a magnetic field that produces force or motion.",
      analogy:"Electricity temporarily turns the coil into a magnet.",
      where:["Relays","Contactors","Solenoid valves","Motors","Transformers"],
      failures:["Open winding","Shorted turns","Overheating","Wrong voltage","Mechanical load preventing movement"],
      safety:"Coils can create unexpected mechanical movement when energized.",
      related:["relay","contactor","transformer"],
      lesson:"relay"
    },
    {
      id:"motor-basics", category:"motors", title:"Three-Phase Motor", eyebrow:"Motors",
      oneLine:"A machine that converts rotating three-phase magnetic fields into mechanical motion.",
      plain:"Three-phase stator currents create a rotating magnetic field. The rotor follows that field, creating torque. Load, voltage, frequency and mechanical condition all affect current and speed.",
      analogy:"Imagine a magnetic wave continuously pulling the rotor around in a circle.",
      where:["Pumps","Conveyors","Fans","Compressors","Machine tools"],
      failures:["Phase loss","Bearing failure","Overload","Low voltage","Winding damage"],
      safety:"Electrical isolation does not automatically stop stored mechanical energy or driven equipment movement.",
      related:["three-phase","overload","motor-starter","vfd"],
      lesson:"motor"
    },
    {
      id:"motor-starter", category:"motors", title:"Motor Starter", eyebrow:"Motors + Controls",
      oneLine:"A contactor plus overload protection used to control and protect a motor.",
      plain:"A typical magnetic motor starter uses a contactor to switch power and an overload device to protect against sustained excessive motor current.",
      analogy:"The contactor is the muscle switching power; the overload is the bodyguard watching motor stress.",
      where:["Pumps","Fans","Conveyors","Compressors","Machine tools"],
      failures:["Contactor will not pull in","Overload tripped","Auxiliary contact failed","Control fuse open","Coil voltage missing"],
      safety:"Starter control voltage and motor line voltage may be different sources.",
      related:["contactor","overload","seal-in","three-phase"],
      lesson:"starter"
    },
    {
      id:"overload", category:"motors", title:"Overload Relay", eyebrow:"Motor Protection",
      oneLine:"Protects motors from sustained overcurrent and overheating conditions.",
      plain:"An overload relay monitors motor current or thermal conditions and opens the control circuit when the motor experiences excessive load for too long.",
      analogy:"It is less like a crash detector and more like a heat/stress watchdog.",
      where:["Motor starters","MCC buckets","Pump panels","Conveyors"],
      failures:["Mechanical overload","Phase imbalance","Incorrect setting","Frequent starts","Poor ventilation"],
      safety:"An overload reset can allow a motor to restart. Find the root cause before resetting.",
      related:["motor-starter","contactor","current"],
      lesson:"starter"
    },
    {
      id:"control-circuit", category:"controls", title:"Control Circuit", eyebrow:"Controls",
      oneLine:"The lower-power logic path that tells larger equipment what to do.",
      plain:"A control circuit combines switches, contacts, sensors, relays, PLC outputs and coils to sequence equipment safely and predictably.",
      analogy:"The power circuit is the muscle. The control circuit is the nervous system.",
      where:["Motor starters","Machine controls","HVAC","Conveyors","Packaging equipment"],
      failures:["Open interlock","Failed pushbutton","Missing control voltage","Broken wire","Bad output"],
      safety:"Control circuits can automatically command dangerous motion. Follow the machine's energy-control procedure.",
      related:["seal-in","interlock","relay","plc"],
      lesson:"starter"
    },
    {
      id:"seal-in", category:"controls", title:"Seal-In Circuit", eyebrow:"Controls",
      oneLine:"A holding circuit that keeps a coil energized after a momentary START button is released.",
      plain:"An auxiliary normally-open contact wired around the START button closes when the contactor energizes. That parallel path maintains coil current until STOP or another series interlock opens.",
      analogy:"START opens the door; the auxiliary contact props it open until STOP removes the prop.",
      where:["Motor starters","Pump controls","Conveyors","Legacy relay logic"],
      failures:["Bad auxiliary contact","STOP contact open","Coil drops out","Incorrect wiring"],
      safety:"A seal-in circuit can keep equipment energized after the operator releases START.",
      related:["motor-starter","normally-open","normally-closed","ladder-logic"],
      lesson:"starter"
    },
    {
      id:"interlock", category:"controls", title:"Interlock", eyebrow:"Controls",
      oneLine:"A condition that prevents an action unless another required condition is satisfied.",
      plain:"Interlocks enforce sequence or safety logic. They can be electrical, mechanical or programmed in a PLC.",
      analogy:"A rule built into the machine: 'you may only do this if that is true.'",
      where:["Forward/reverse starters","Safety gates","Pump sequencing","Process equipment"],
      failures:["Bypassed interlock","Failed sensor","Welded contact","Programming error"],
      safety:"Never defeat an interlock without an authorized procedure and full hazard evaluation.",
      related:["control-circuit","plc","normally-closed"],
      lesson:"none"
    },
    {
      id:"plc", category:"plc", title:"PLC", eyebrow:"Automation",
      oneLine:"An industrial computer designed to read inputs, execute logic and control outputs reliably.",
      plain:"A programmable logic controller repeatedly reads field inputs, executes a user program, updates outputs and performs communication/diagnostics.",
      analogy:"A rugged factory brain that repeatedly asks: what do I see, what do my rules say, what should I turn on?",
      where:["Manufacturing","Packaging","Water treatment","Material handling","Process plants"],
      failures:["Input missing","Output failed","Program condition false","Communication fault","Power supply issue"],
      safety:"A PLC output status on screen does not prove the field circuit is de-energized.",
      related:["plc-inputs","plc-outputs","scan-cycle","ladder-logic"],
      lesson:"scan"
    },
    {
      id:"plc-inputs", category:"plc", title:"PLC Inputs", eyebrow:"Automation",
      oneLine:"Signals that tell the PLC what is happening in the field.",
      plain:"Inputs convert field conditions such as pushbuttons, sensors and switches into electrical states the PLC can read.",
      analogy:"Inputs are the PLC's eyes and ears.",
      where:["Proximity sensors","Pushbuttons","Pressure switches","Limit switches","Photoeyes"],
      failures:["No field power","Broken wire","Wrong input type","Failed sensor","Bad input channel"],
      safety:"Input LEDs are clues, not proof of safe energy state.",
      related:["plc","plc-outputs","proximity-sensor","photoeye"],
      lesson:"scan"
    },
    {
      id:"plc-outputs", category:"plc", title:"PLC Outputs", eyebrow:"Automation",
      oneLine:"Signals the PLC uses to command field devices.",
      plain:"Outputs switch electrical signals to loads such as relay coils, solenoids, lamps and contactors based on the user program.",
      analogy:"Outputs are the PLC's hands.",
      where:["Solenoid valves","Motor starters","Stack lights","Relays","Buzzers"],
      failures:["Program false","Output channel failed","No output power","Open load","Interposing relay failure"],
      safety:"A forced or manually commanded PLC output can create unexpected motion.",
      related:["plc","plc-inputs","ladder-logic"],
      lesson:"scan"
    },
    {
      id:"scan-cycle", category:"plc", title:"PLC Scan Cycle", eyebrow:"Automation",
      oneLine:"The repeating loop a PLC uses to read, solve and update the machine.",
      plain:"Most PLCs repeatedly read inputs, execute program logic using an input image, update outputs, then handle communication and diagnostics.",
      analogy:"Take a snapshot → think → act → repeat thousands of times.",
      where:["All PLC-controlled systems"],
      failures:["Logic assumptions about timing","Long scan times","Asynchronous communications","Input filtering"],
      safety:"Fast logic does not replace required safety-rated control architecture.",
      related:["plc","ladder-logic","timer"],
      lesson:"scan"
    },
    {
      id:"ladder-logic", category:"plc", title:"Ladder Logic", eyebrow:"Automation",
      oneLine:"A graphical PLC programming language derived from relay control diagrams.",
      plain:"Ladder logic is drawn as horizontal rungs between power rails. Instructions represent conditions and actions. A rung becomes logically true when its conditions allow continuity to the output instruction.",
      analogy:"Each rung is a sentence: IF these conditions are true, THEN do this.",
      where:["PLCs","Machine control","Industrial automation","Legacy control conversion"],
      failures:["Wrong address","Unexpected branch logic","Latched bit","Timer condition","Force enabled"],
      safety:"Software logic can command real machinery. Testing requires controlled conditions and appropriate safeguards.",
      related:["normally-open","normally-closed","timer","counter","scan-cycle"],
      lesson:"ladder"
    },
    {
      id:"normally-open", category:"plc", title:"Normally Open / XIC", eyebrow:"Ladder Logic",
      oneLine:"A condition instruction that is true when its referenced bit is true.",
      plain:"In ladder logic, an Examine If Closed instruction is often drawn like a normally-open contact. It does not necessarily represent a physical normally-open contact; it examines a bit state.",
      analogy:"Ask: 'Is this bit ON?' If yes, logic can pass.",
      where:["Start commands","Sensor conditions","Permissives","Status bits"],
      failures:["Confusing physical contact state with programmed bit state"],
      safety:"Always distinguish the software instruction from the physical device wiring.",
      related:["normally-closed","ladder-logic","plc-inputs"],
      lesson:"ladder"
    },
    {
      id:"normally-closed", category:"plc", title:"Normally Closed / XIO", eyebrow:"Ladder Logic",
      oneLine:"A condition instruction that is true when its referenced bit is false.",
      plain:"An Examine If Open instruction passes logical continuity when the referenced bit is false. The symbol resembles a normally-closed contact, but it is fundamentally a bit test.",
      analogy:"Ask: 'Is this bit OFF?' If yes, logic can pass.",
      where:["Stop conditions","Fault-not-active logic","Interlocks","Permissives"],
      failures:["Misreading inverse logic","Confusing field wiring with program instruction"],
      safety:"Understand both the physical fail-safe circuit and the PLC logic before modifying either.",
      related:["normally-open","ladder-logic","interlock"],
      lesson:"ladder"
    },
    {
      id:"timer", category:"plc", title:"PLC Timer", eyebrow:"Ladder Logic",
      oneLine:"An instruction that measures time while specified logic conditions are true.",
      plain:"Timers add time-based behavior to PLC programs. Common types include on-delay, off-delay and retentive timers.",
      analogy:"A stopwatch controlled by logic.",
      where:["Start delays","Process timing","Alarm delays","Sequence control"],
      failures:["Wrong time base","Timer not reset","Condition flickering","Retentive value"],
      safety:"Timing logic can create delayed automatic motion that surprises technicians.",
      related:["ladder-logic","scan-cycle","counter"],
      lesson:"ladder"
    },
    {
      id:"counter", category:"plc", title:"PLC Counter", eyebrow:"Ladder Logic",
      oneLine:"An instruction that counts state transitions or events.",
      plain:"Counters track repeated events such as parts passing a sensor, cycles completed or faults recorded.",
      analogy:"A digital tally counter inside the PLC.",
      where:["Production counts","Batch control","Maintenance cycles","Reject tracking"],
      failures:["Double-counting","Missed pulses","Counter not reset","Input bounce"],
      safety:"Counter logic can affect automatic sequence decisions; verify reset and rollover behavior.",
      related:["timer","photoeye","ladder-logic"],
      lesson:"ladder"
    },
    {
      id:"vfd", category:"drives", title:"Variable Frequency Drive", eyebrow:"Drives",
      oneLine:"An electronic drive that controls AC motor speed primarily by changing output frequency.",
      plain:"A VFD rectifies incoming AC to DC, stores it on a DC bus, then uses switching electronics to synthesize a controlled-frequency AC output for the motor.",
      analogy:"Instead of giving the motor only ON/OFF, a VFD gives it a controllable electronic throttle.",
      where:["Fans","Pumps","Conveyors","Mixers","Process equipment"],
      failures:["Overcurrent","Overvoltage","Ground fault","Overtemperature","Parameter error"],
      safety:"VFD DC buses can retain dangerous voltage after incoming power is removed. Follow discharge time and verification requirements.",
      related:["motor-basics","three-phase","frequency"],
      lesson:"motor"
    },
    {
      id:"proximity-sensor", category:"sensors", title:"Proximity Sensor", eyebrow:"Sensors",
      oneLine:"Detects an object without requiring mechanical contact.",
      plain:"Inductive proximity sensors detect metal by disturbing an electromagnetic field. Other proximity technologies can detect different materials.",
      analogy:"A switch that can feel an object getting close without being touched.",
      where:["Machine position","Part detection","Cylinder position","Conveyors"],
      failures:["Wrong sensing distance","Metal buildup","Misalignment","Wrong wiring","Failed sensor"],
      safety:"A sensor state is not a substitute for physical energy isolation.",
      related:["plc-inputs","photoeye","limit-switch"],
      lesson:"sensor"
    },
    {
      id:"photoeye", category:"sensors", title:"Photoelectric Sensor", eyebrow:"Sensors",
      oneLine:"Uses light to detect presence, absence or position.",
      plain:"Photoeyes emit and receive light. Common arrangements include through-beam, retroreflective and diffuse sensing.",
      analogy:"A tiny electronic eye watching for something to block or reflect light.",
      where:["Conveyors","Packaging","Counting","Door systems","Material handling"],
      failures:["Dirty lens","Misalignment","Reflective background","Bad reflector","Wiring fault"],
      safety:"Photoeyes used for ordinary automation are not necessarily safety-rated.",
      related:["plc-inputs","counter","proximity-sensor"],
      lesson:"sensor"
    },
    {
      id:"limit-switch", category:"sensors", title:"Limit Switch", eyebrow:"Sensors",
      oneLine:"A mechanically actuated switch used to detect position or travel.",
      plain:"A moving machine part physically actuates the switch lever or plunger, changing electrical contacts.",
      analogy:"A machine touches the switch and says, 'I've reached this position.'",
      where:["Machine travel","Doors","Guards","Cylinders","Conveyors"],
      failures:["Broken actuator","Misadjustment","Worn contacts","Mechanical obstruction"],
      safety:"Do not assume a position switch is safety-rated unless the complete application is designed for that purpose.",
      related:["plc-inputs","interlock","proximity-sensor"],
      lesson:"sensor"
    },
    {
      id:"three-phase", category:"power", title:"Three-Phase Power", eyebrow:"Power",
      oneLine:"Three AC waveforms separated in phase, ideal for efficient power transfer and motors.",
      plain:"Three-phase systems provide smoother power delivery and naturally create rotating magnetic fields in AC motors.",
      analogy:"Instead of one person pushing a merry-go-round once per cycle, three people push in sequence around it.",
      where:["Industrial motors","MCCs","Large HVAC","Manufacturing","Commercial distribution"],
      failures:["Phase loss","Voltage imbalance","Reversed phase sequence","Loose termination"],
      safety:"Industrial three-phase systems can have very high fault energy. Follow qualified-person requirements and appropriate PPE/work practices.",
      related:["motor-basics","transformer","vfd"],
      lesson:"wave"
    },
    {
      id:"transformer", category:"power", title:"Transformer", eyebrow:"Power",
      oneLine:"Transfers AC energy magnetically while changing voltage/current relationships.",
      plain:"An alternating current in the primary winding creates magnetic flux that induces voltage in the secondary winding. The turns ratio largely determines the voltage ratio.",
      analogy:"A magnetic gearbox for AC voltage and current.",
      where:["Control transformers","Distribution","Machine panels","Power supplies"],
      failures:["Open winding","Shorted turns","Overload","Wrong tap","Blown primary/secondary protection"],
      safety:"Transformers can create a separately derived energized circuit even when another circuit is off.",
      related:["ac-dc","three-phase","power-supply"],
      lesson:"transformer"
    },
    {
      id:"power-supply", category:"power", title:"DC Power Supply", eyebrow:"Power",
      oneLine:"Converts incoming electrical power into regulated DC for controls and electronics.",
      plain:"Industrial power supplies commonly convert AC line voltage into 24 VDC used by PLCs, sensors and control devices.",
      analogy:"A translator that turns incoming AC power into clean DC electronics can use.",
      where:["PLC panels","Sensors","Controls","Networking equipment"],
      failures:["Overload","Shorted output","Low input voltage","Failed supply","Ground fault"],
      safety:"The DC output may be lower voltage while dangerous line voltage is still present on the input side.",
      related:["ac-dc","plc","plc-inputs"],
      lesson:"none"
    },
    {
      id:"multimeter", category:"diagnostics", title:"Digital Multimeter", eyebrow:"Diagnostics",
      oneLine:"A core diagnostic instrument for measuring voltage, resistance and other electrical quantities.",
      plain:"A multimeter lets a technician compare what the circuit should be doing with what it is actually doing. Good troubleshooting is less about random measurements and more about choosing the next measurement that separates possible causes.",
      analogy:"It is an electrical detective's evidence kit.",
      where:["Every electrical troubleshooting task"],
      failures:["Wrong range/mode","Lead in wrong jack","Measuring resistance energized","Poor test point choice"],
      safety:"Use a meter and leads with appropriate ratings, verify operation, and follow required safe-work practices.",
      related:["voltage","resistance","diagnostics-method"],
      lesson:"meter"
    },
    {
      id:"diagnostics-method", category:"diagnostics", title:"Divide-and-Prove Troubleshooting", eyebrow:"Diagnostics",
      oneLine:"Use measurements to repeatedly divide the possible fault area until the cause is proven.",
      plain:"Instead of checking components randomly, start from the symptom, understand the circuit, test at a point that separates possibilities, then continue narrowing the fault region.",
      analogy:"Like finding a break in a long hose by checking halfway, then halfway again.",
      where:["Machine downtime","Controls","Motors","Sensors","Power circuits"],
      failures:["Shotgun parts replacement","Ignoring the schematic","Assuming instead of measuring","Changing multiple things at once"],
      safety:"Troubleshooting energized equipment can be hazardous and must be performed only under appropriate procedures and qualifications.",
      related:["multimeter","motor-starter","plc-inputs"],
      lesson:"troubleshoot"
    },
    {
      id:"grounding", category:"safety", title:"Grounding + Bonding", eyebrow:"Safety",
      oneLine:"Creates intentional conductive paths and reference points that support fault clearing and voltage control.",
      plain:"Grounding and bonding serve related but distinct purposes. Bonding connects conductive parts so fault current has an effective path, while grounding connects systems to earth/reference points as required by the system design.",
      analogy:"Give fault current a deliberate highway instead of letting it invent a dangerous route through equipment, or a person.",
      where:["Panels","Machines","Raceways","Transformers","Service equipment"],
      failures:["Loose bond","Painted connection surface","Broken equipment grounding conductor","Improper neutral-ground connection"],
      safety:"Grounding concepts are code- and system-dependent. Practical work must follow applicable electrical codes and facility procedures.",
      related:["short-circuit","breaker","safety-loto"],
      lesson:"none"
    },
    {
      id:"safety-loto", category:"safety", title:"Lockout / Tagout", eyebrow:"Safety",
      oneLine:"A hazardous-energy control process used to prevent unexpected energization or movement during service.",
      plain:"LOTO is a procedure, not merely a padlock. It includes identifying energy sources, shutdown, isolation, lock/tag application, stored-energy control and verification.",
      analogy:"Make the machine physically incapable of surprising you, then prove it.",
      where:["Electrical service","Mechanical repair","Hydraulics","Pneumatics","Stored energy"],
      failures:["Missed energy source","Stored pressure","Shared disconnect confusion","No verification","Unauthorized restart"],
      safety:"Actual LOTO must follow employer procedures and applicable regulations. This educational module is not a substitute for required workplace training.",
      related:["multimeter","grounding","interlock"],
      lesson:"none"
    }
  ],
  learningPaths: [
    { id:"starter", name:"Electrical Starter Pack", level:"Beginner", minutes:45, concepts:["voltage","current","resistance","power","series-parallel","relay","contactor"] },
    { id:"motor-controls", name:"Motor Controls", level:"Intermediate", minutes:70, concepts:["motor-basics","contactor","overload","motor-starter","control-circuit","seal-in","interlock"] },
    { id:"plc-zero", name:"PLC From Zero", level:"Beginner", minutes:80, concepts:["plc","plc-inputs","plc-outputs","scan-cycle","ladder-logic","normally-open","normally-closed","timer","counter"] },
    { id:"troubleshooter", name:"Troubleshooter", level:"Intermediate", minutes:55, concepts:["multimeter","diagnostics-method","open-circuit","short-circuit","motor-starter"] }
  ]
};


/* TRADESCHOOL MULTI-WORLD EXPANSION */
(() => {
  const D = window.TRADE_DATA;
  D.concepts.forEach(c => { if(!c.world) c.world = "electrical"; });
  const hvac = D.worlds.find(w=>w.id==="hvac"); if(hvac){ hvac.status="live"; hvac.topics=15; }
  const plumbing = D.worlds.find(w=>w.id==="plumbing"); if(plumbing){ plumbing.status="live"; plumbing.topics=14; }

  D.worldCategories = {
    electrical: D.categories,
    hvac: [
      {id:"hvac-cycle",name:"Refrigeration Cycle",icon:"01",description:"Move heat by changing refrigerant pressure, temperature and state."},
      {id:"hvac-air",name:"Airflow",icon:"02",description:"CFM, static pressure, filters, blowers and duct resistance."},
      {id:"hvac-controls",name:"Controls",icon:"03",description:"Thermostats, safeties and electrical control sequences."},
      {id:"hvac-diagnostics",name:"Diagnostics",icon:"04",description:"Superheat, subcooling, temperature split and symptom-based testing."},
      {id:"hvac-safety",name:"Safety",icon:"05",description:"Electrical, pressure, refrigerant and combustion hazards."}
    ],
    plumbing: [
      {id:"plumb-supply",name:"Water Supply",icon:"01",description:"Pressure, flow, valves, regulators and pipe sizing."},
      {id:"plumb-drain",name:"Drain · Waste · Vent",icon:"02",description:"Gravity drainage, traps, vents, slope and cleanouts."},
      {id:"plumb-fixtures",name:"Fixtures",icon:"03",description:"The working parts inside toilets, faucets and common fixtures."},
      {id:"plumb-hot",name:"Hot Water",icon:"04",description:"Water heaters, expansion and temperature control."},
      {id:"plumb-diagnostics",name:"Diagnostics",icon:"05",description:"Leaks, hammer, pressure problems and isolation strategy."}
    ]
  };

  D.concepts.push(
    {world:"hvac",id:"heat-transfer",category:"hvac-cycle",title:"Heat Transfer",eyebrow:"HVAC Fundamentals",oneLine:"Heat naturally moves from warmer matter toward cooler matter.",plain:"HVAC equipment does not create cold. It moves heat. Refrigeration systems absorb heat at the evaporator and reject it at the condenser by controlling pressure, temperature and refrigerant state.",analogy:"Think of the refrigeration circuit as a heat conveyor belt: pick heat up indoors, carry it outside, drop it off, repeat.",where:["Air conditioners","Heat pumps","Refrigerators","Chillers"],failures:["Dirty heat exchangers reduce heat transfer.","Low airflow changes coil temperature.","Incorrect refrigerant charge changes system capacity."],safety:"HVAC equipment combines electricity, moving parts, pressure and refrigerants. Service work requires proper training and procedures.",related:["refrigerant","evaporator","condenser","delta-t"],lesson:"hvac-cycle"},
    {world:"hvac",id:"refrigerant",category:"hvac-cycle",title:"Refrigerant",eyebrow:"Refrigeration Cycle",oneLine:"A working fluid chosen to absorb and reject heat efficiently as its pressure and state change.",plain:"Refrigerant circulates through a closed system. Pressure changes alter its saturation temperature, allowing it to boil while absorbing heat and condense while rejecting heat.",analogy:"It is the reusable delivery truck carrying thermal energy around the loop.",where:["Split systems","Heat pumps","Walk-ins","Chillers"],failures:["Leaks","Incorrect charge","Moisture or contamination","Restriction"],safety:"Refrigerants require appropriate recovery, handling and regulatory procedures. Never intentionally vent refrigerant.",related:["compressor","metering-device","superheat","subcooling"],lesson:"hvac-cycle"},
    {world:"hvac",id:"compressor",category:"hvac-cycle",title:"Compressor",eyebrow:"Refrigeration Cycle",oneLine:"Raises refrigerant vapor pressure and keeps refrigerant moving through the system.",plain:"The compressor takes lower-pressure vapor from the evaporator and compresses it into a higher-pressure, higher-temperature vapor so heat can be rejected at the condenser.",analogy:"The pump and pressure-maker of the refrigeration loop.",where:["Condensing units","Heat pumps","Package units","Refrigeration racks"],failures:["Electrical failure","Loss of lubrication","Floodback","Overheating","Mechanical wear"],safety:"Compressors involve high voltage, high pressure and hot surfaces. Stored electrical energy may remain in capacitors.",related:["condenser","evaporator","contactor","refrigerant"],lesson:"hvac-cycle"},
    {world:"hvac",id:"condenser",category:"hvac-cycle",title:"Condenser",eyebrow:"Refrigeration Cycle",oneLine:"Rejects heat and condenses high-pressure refrigerant vapor into liquid.",plain:"In cooling mode the outdoor coil receives hot high-pressure vapor from the compressor. Airflow across the coil removes heat until the refrigerant condenses.",analogy:"The system's outdoor radiator: this is where captured indoor heat gets dumped.",where:["Outdoor condensing units","Package units","Refrigeration systems"],failures:["Dirty coil","Fan failure","Air recirculation","Overcharge"],safety:"Condenser sections contain live electrical parts, rotating fans and high-pressure refrigerant.",related:["compressor","subcooling","heat-transfer"],lesson:"hvac-cycle"},
    {world:"hvac",id:"metering-device",category:"hvac-cycle",title:"Metering Device",eyebrow:"Refrigeration Cycle",oneLine:"Creates the pressure drop that prepares refrigerant to absorb heat in the evaporator.",plain:"A TXV, electronic expansion valve, piston or capillary tube restricts refrigerant flow between the high and low sides. The pressure drop lowers refrigerant saturation temperature.",analogy:"A controlled bottleneck between the high-pressure and low-pressure halves of the system.",where:["Indoor coils","Refrigeration evaporators","Heat pumps"],failures:["Restriction","Incorrect sizing","Lost bulb charge","Debris","Hunting"],safety:"Do not open pressurized refrigeration circuits without correct recovery and service procedures.",related:["evaporator","superheat","refrigerant"],lesson:"hvac-cycle"},
    {world:"hvac",id:"evaporator",category:"hvac-cycle",title:"Evaporator",eyebrow:"Refrigeration Cycle",oneLine:"Absorbs heat as low-pressure refrigerant boils inside the coil.",plain:"Warm return air passes over the evaporator coil. Refrigerant inside boils at a low temperature, absorbing heat from the air while moisture may condense on the coil.",analogy:"The indoor heat pickup station.",where:["Air handlers","Furnaces with cooling coils","Walk-ins","Chillers"],failures:["Low airflow","Ice buildup","Dirty coil","Low charge","Drain problems"],safety:"Frozen coils and condensate can hide underlying airflow or refrigerant problems; diagnosis requires correct procedures.",related:["metering-device","superheat","airflow-cfm","heat-transfer"],lesson:"hvac-cycle"},
    {world:"hvac",id:"airflow-cfm",category:"hvac-air",title:"Airflow / CFM",eyebrow:"Airflow",oneLine:"The volume of air a blower moves through the system each minute.",plain:"Airflow carries heat to and from the coil. Too little or too much airflow changes comfort, capacity, coil temperature, noise and equipment performance.",analogy:"The duct system is a road network; CFM is how much traffic actually makes it through.",where:["Supply ducts","Return ducts","Air handlers","Furnaces"],failures:["Dirty filter","Closed damper","Undersized duct","Weak blower","Blocked coil"],safety:"Fans can start automatically. Follow energy-control procedures before accessing moving equipment.",related:["static-pressure","blower","delta-t","evaporator"],lesson:"airflow"},
    {world:"hvac",id:"static-pressure",category:"hvac-air",title:"Static Pressure",eyebrow:"Airflow",oneLine:"The pressure the blower must work against to move air through the duct system.",plain:"Filters, coils, ducts, fittings and dampers create resistance. External static pressure measurements help show whether the blower is pushing against an overly restrictive system.",analogy:"Like backpressure in a crowded pipe: more restriction makes the fan work harder for less flow.",where:["Return plenums","Supply plenums","Filter racks","Duct systems"],failures:["Dirty filter","Restrictive coil","Small return","Closed registers"],safety:"Pressure testing around operating equipment still requires awareness of electrical and moving-part hazards.",related:["airflow-cfm","blower","ductwork"],lesson:"airflow"},
    {world:"hvac",id:"blower",category:"hvac-air",title:"Blower",eyebrow:"Airflow",oneLine:"The fan assembly that creates pressure difference and moves conditioned air through ducts.",plain:"The blower must operate on an appropriate speed or control command and overcome the resistance of the connected air distribution system.",analogy:"The heart of the air side: it creates the pressure difference that keeps air circulating.",where:["Furnaces","Air handlers","Package units"],failures:["Motor failure","Bad capacitor on applicable motors","Dirty wheel","Control issue","Excessive static"],safety:"Blowers can coast and can restart automatically. Isolate energy before service.",related:["airflow-cfm","static-pressure","ductwork"],lesson:"airflow"},
    {world:"hvac",id:"ductwork",category:"hvac-air",title:"Ductwork",eyebrow:"Airflow",oneLine:"A distribution network designed to deliver and return air with manageable pressure loss.",plain:"Duct size, length, fittings, leakage and balancing all affect airflow. A high-capacity unit connected to poor ductwork can still perform poorly.",analogy:"Buying a bigger pump will not fix a tiny, kinked hose.",where:["Attics","Crawlspaces","Mechanical rooms","Ceilings"],failures:["Leaks","Crushed flex","Poor sizing","Disconnected runs","Bad balancing"],safety:"Duct access can involve sharp metal, insulation, confined spaces and nearby energized equipment.",related:["airflow-cfm","static-pressure","blower"],lesson:"airflow"},
    {world:"hvac",id:"thermostat",category:"hvac-controls",title:"Thermostat",eyebrow:"HVAC Controls",oneLine:"A user-facing control that creates heating, cooling and fan requests based on temperature and settings.",plain:"A thermostat compares space temperature to its setpoint and sends control signals. The equipment then applies safeties, delays and sequencing before loads operate.",analogy:"The thermostat asks for comfort; the equipment decides how to safely deliver it.",where:["Homes","Commercial zones","Package units"],failures:["No control power","Wrong configuration","Broken conductor","Bad sensor","Improper staging"],safety:"Thermostat circuits are lower voltage in many systems, but the equipment they command contains hazardous line voltage.",related:["contactor","compressor","blower"],lesson:"hvac-controls"},
    {world:"hvac",id:"superheat",category:"hvac-diagnostics",title:"Superheat",eyebrow:"HVAC Diagnostics",oneLine:"How far vapor temperature is above its saturation temperature at the measured pressure.",plain:"Superheat helps show whether refrigerant leaving an evaporator is fully vapor and how effectively the evaporator is being fed. Correct interpretation depends on system type and operating conditions.",analogy:"After all liquid has boiled away, superheat tells you how much warmer the vapor became.",where:["Suction line diagnostics","Charging procedures","Evaporator performance"],failures:["Starved evaporator can raise superheat","Flooded evaporator can lower superheat"],safety:"Pressure/temperature diagnosis requires approved tools, refrigerant knowledge and safe service practices.",related:["refrigerant","evaporator","metering-device","subcooling"],lesson:"hvac-cycle"},
    {world:"hvac",id:"subcooling",category:"hvac-diagnostics",title:"Subcooling",eyebrow:"HVAC Diagnostics",oneLine:"How far liquid refrigerant temperature is below its saturation temperature at the measured pressure.",plain:"Subcooling indicates that refrigerant leaving the condenser has become liquid and then cooled further. It is commonly used when evaluating charge on systems designed for that method.",analogy:"Condensation finishes first; subcooling measures how much cooler the fully liquid refrigerant gets afterward.",where:["Liquid line diagnostics","Charging procedures","Condenser evaluation"],failures:["Conditions can suggest overcharge, undercharge or restrictions depending on the full system picture"],safety:"Never diagnose charge from one number alone; use manufacturer procedures and qualified service practices.",related:["refrigerant","condenser","superheat"],lesson:"hvac-cycle"},
    {world:"hvac",id:"delta-t",category:"hvac-diagnostics",title:"Temperature Split / ΔT",eyebrow:"HVAC Diagnostics",oneLine:"The temperature difference between two air measurements used as one clue to system performance.",plain:"Technicians often compare return-air and supply-air temperatures. The result is useful context but must be interpreted alongside airflow, humidity, equipment design and operating conditions.",analogy:"Measure what the air was before the coil and what it became after the coil.",where:["Supply registers","Return grilles","Air handlers"],failures:["Low airflow can distort temperature split","Sensor placement can mislead","Refrigeration faults can change split"],safety:"Do not use a temperature split alone to declare a system healthy or properly charged.",related:["airflow-cfm","evaporator","heat-transfer"],lesson:"airflow"},
    {world:"hvac",id:"hvac-service-safety",category:"hvac-safety",title:"HVAC Service Safety",eyebrow:"Safety",oneLine:"HVAC service can combine electrical, mechanical, pressure, chemical, thermal and combustion hazards.",plain:"Safe work begins by identifying every energy and hazard source: line voltage, capacitors, rotating equipment, hot surfaces, refrigerant pressure, combustion products and stored energy.",analogy:"One cabinet can contain several completely different hazards at the same time.",where:["Condensing units","Furnaces","Air handlers","Commercial rooftops"],failures:["Unexpected fan start","Stored capacitor energy","Pressurized refrigerant","Hot surfaces"],safety:"Follow employer procedures, equipment instructions and applicable regulations. This module is conceptual education, not task qualification.",related:["safety-loto","compressor","blower"],lesson:"none"},

    {world:"plumbing",id:"water-pressure",category:"plumb-supply",title:"Water Pressure",eyebrow:"Water Supply",oneLine:"The force per unit area available to push water through the plumbing system.",plain:"Pressure is created by the utility, elevation or a pump. Fixtures need adequate pressure, but excessive pressure increases stress, noise and wear.",analogy:"Pressure is the push waiting behind the faucet before you open it.",where:["Service entrance","Hose bibbs","Fixtures","Pressure regulators"],failures:["Low municipal pressure","Failed regulator","Restriction","Excessive static pressure"],safety:"Pressurized water can release suddenly. Isolate and relieve pressure before opening piping or devices.",related:["flow-rate","pressure-regulator","shutoff-valve","water-hammer"],lesson:"pressure-flow"},
    {world:"plumbing",id:"flow-rate",category:"plumb-supply",title:"Flow Rate",eyebrow:"Water Supply",oneLine:"How much water passes a point over time, commonly expressed in gallons per minute.",plain:"Flow depends on pressure, pipe size, length, fittings, restrictions and the opening of valves/fixtures. Good static pressure does not guarantee good flow under demand.",analogy:"Pressure is push; flow is how much water actually gets through.",where:["Showers","Faucets","Tub fillers","Irrigation","Supply mains"],failures:["Clogged aerator","Partly closed valve","Scale","Undersized pipe","Weak supply"],safety:"Flow testing can create slip hazards and unexpected discharge; control where water goes.",related:["water-pressure","pressure-regulator","shutoff-valve"],lesson:"pressure-flow"},
    {world:"plumbing",id:"shutoff-valve",category:"plumb-supply",title:"Shutoff Valve",eyebrow:"Water Supply",oneLine:"A valve used to deliberately stop or isolate water flow.",plain:"Isolation valves allow a fixture, branch or entire building to be serviced without uncontrolled water flow. Different valve designs have different operating and throttling characteristics.",analogy:"A gate in the pipe network that lets you isolate part of the system.",where:["Water meter","Fixtures","Water heaters","Branch piping"],failures:["Seized stem","Leaking packing","Broken handle","Valve not fully opening"],safety:"Closing a valve does not always prove a line is depressurized. Verify before disassembly.",related:["water-pressure","flow-rate","leak-isolation"],lesson:"pressure-flow"},
    {world:"plumbing",id:"pressure-regulator",category:"plumb-supply",title:"Pressure Regulator",eyebrow:"Water Supply",oneLine:"Automatically reduces higher inlet pressure to a controlled downstream pressure.",plain:"A pressure-reducing valve responds to downstream pressure and modulates its opening. A failing regulator can cause low pressure, high pressure or unstable behavior.",analogy:"An automatic valve trying to keep the house side at a calmer pressure than the street side.",where:["Building service entrance","Commercial water systems"],failures:["Debris","Worn diaphragm","Incorrect adjustment","Pressure creep"],safety:"Adjustment and replacement should follow manufacturer procedures and local plumbing requirements.",related:["water-pressure","flow-rate","expansion-tank"],lesson:"pressure-flow"},
    {world:"plumbing",id:"p-trap",category:"plumb-drain",title:"P-Trap",eyebrow:"Drain · Waste · Vent",oneLine:"A curved section of drain that holds a water seal between the room and the drainage system.",plain:"The trap retains water after a fixture drains. That water seal blocks sewer gases while still allowing wastewater to pass when the fixture is used.",analogy:"A small water moat between the room and the sewer system.",where:["Sinks","Tubs","Showers","Floor drains"],failures:["Siphoned dry","Evaporation","Leak","Clog","Improper configuration"],safety:"Drain systems can contain biological hazards and harmful gases; use appropriate procedures and PPE.",related:["vent-stack","drain-slope","cleanout"],lesson:"drain-vent"},
    {world:"plumbing",id:"vent-stack",category:"plumb-drain",title:"Plumbing Vent",eyebrow:"Drain · Waste · Vent",oneLine:"Connects the drainage system to air so pressure changes do not destroy trap seals or disrupt flow.",plain:"As water moves through drainage piping, air must move too. Proper venting helps balance pressure and protects fixture trap seals.",analogy:"Like the vent hole in a gas can: liquid drains smoothly when air can replace it.",where:["Roof penetrations","Fixture vents","Drain stacks"],failures:["Blocked vent","Improper venting","Siphoned trap","Slow/gurgling drains"],safety:"Roof and confined-space access can add fall and atmospheric hazards.",related:["p-trap","drain-slope","cleanout"],lesson:"drain-vent"},
    {world:"plumbing",id:"drain-slope",category:"plumb-drain",title:"Drain Slope",eyebrow:"Drain · Waste · Vent",oneLine:"The controlled fall that lets gravity move waste through horizontal drainage piping.",plain:"Drainage piping needs appropriate slope so water carries solids while maintaining useful flow characteristics. Too little or inappropriate slope can create performance problems.",analogy:"A drain is a tiny gravity-powered river: its grade matters.",where:["Horizontal drains","Branch lines","Building sewers"],failures:["Belly/sag","Backpitch","Poor support","Settling"],safety:"Actual installation must follow applicable plumbing code requirements.",related:["vent-stack","cleanout","p-trap"],lesson:"drain-vent"},
    {world:"plumbing",id:"cleanout",category:"plumb-drain",title:"Cleanout",eyebrow:"Drain · Waste · Vent",oneLine:"An access point provided so drainage piping can be inspected or mechanically cleared.",plain:"Cleanouts are placed where access is needed for maintenance. Their location and accessibility matter when a blockage occurs.",analogy:"A service door built into the drain system.",where:["Building drains","Stacks","Long branches","Changes of direction"],failures:["Buried access","Damaged plug","Leak","Poor placement"],safety:"Opening a blocked drain can release wastewater under pressure; use appropriate protective procedures.",related:["drain-slope","p-trap","leak-isolation"],lesson:"drain-vent"},
    {world:"plumbing",id:"toilet-fill-valve",category:"plumb-fixtures",title:"Toilet Fill Valve",eyebrow:"Fixtures",oneLine:"Refills the tank after a flush and stops when the target water level is reached.",plain:"The fill valve responds to tank water level through a float mechanism or integrated sensor. It also commonly sends refill water to the bowl through the overflow tube.",analogy:"A tiny automatic water-level controller inside the tank.",where:["Tank-type toilets"],failures:["Runs continuously","Slow fill","Debris","Incorrect water level","Failed seal"],safety:"Close the fixture shutoff and verify flow has stopped before disassembly.",related:["shutoff-valve","flow-rate"],lesson:"none"},
    {world:"plumbing",id:"faucet-cartridge",category:"plumb-fixtures",title:"Faucet Cartridge",eyebrow:"Fixtures",oneLine:"A replaceable valve mechanism that meters and mixes water inside many faucets.",plain:"The cartridge aligns internal ports as the handle moves, changing flow and sometimes mixing hot and cold water.",analogy:"The faucet handle is the user interface; the cartridge is the valve logic underneath it.",where:["Kitchen faucets","Lavatory faucets","Tub/shower valves"],failures:["Drip","Stiff movement","Poor mixing","Debris","Worn seals"],safety:"Shut off water and confirm isolation before removing a pressurized cartridge.",related:["shutoff-valve","flow-rate"],lesson:"none"},
    {world:"plumbing",id:"water-heater",category:"plumb-hot",title:"Tank Water Heater",eyebrow:"Hot Water",oneLine:"Stores water and adds heat under thermostat control so hot water is available on demand.",plain:"A tank heater brings incoming cold water to a controlled temperature using gas combustion or electric heating elements. Hot water leaves from the upper portion of the tank as cold water enters lower in the tank.",analogy:"A continuously managed thermal battery made of stored hot water.",where:["Homes","Small commercial buildings"],failures:["Failed element","Burner/ignition issue","Sediment","Thermostat problem","Dip tube issue"],safety:"Water heaters involve high temperature, pressure, electricity and/or combustion. Service requires proper procedures.",related:["expansion-tank","water-pressure","flow-rate"],lesson:"water-heater-lab"},
    {world:"plumbing",id:"expansion-tank",category:"plumb-hot",title:"Thermal Expansion Tank",eyebrow:"Hot Water",oneLine:"Provides a compressible volume that can absorb water expansion in a closed plumbing system.",plain:"Water expands as it heats. In systems where a check valve or regulator prevents expansion back toward the supply, an appropriately configured expansion tank can absorb the increased volume.",analogy:"A small shock absorber for the extra volume created when water gets hot.",where:["Closed domestic water systems","Water heater installations"],failures:["Lost air charge","Ruptured diaphragm","Incorrect sizing","Improper pressure setup"],safety:"Expansion tanks and water heaters are pressurized vessels; follow manufacturer and code requirements.",related:["water-heater","pressure-regulator","water-pressure"],lesson:"water-heater-lab"},
    {world:"plumbing",id:"water-hammer",category:"plumb-diagnostics",title:"Water Hammer",eyebrow:"Diagnostics",oneLine:"A pressure wave created when moving water changes velocity very quickly.",plain:"Fast-closing valves can abruptly stop a column of moving water. The resulting pressure wave can create banging, vibration and stress in the piping system.",analogy:"A moving train of water suddenly hits the brakes and sends a shock wave through the pipe.",where:["Dishwashers","Washing machines","Quick-closing solenoids","Loose piping"],failures:["Excess pressure","Missing/failed arrestor","Poor pipe support","Fast valve closure"],safety:"Repeated hammer can damage piping and fittings; diagnose the system rather than simply hiding the noise.",related:["water-pressure","flow-rate","pressure-regulator"],lesson:"pressure-flow"},
    {world:"plumbing",id:"leak-isolation",category:"plumb-diagnostics",title:"Leak Isolation",eyebrow:"Diagnostics",oneLine:"Narrow a water-loss problem by dividing the system into testable sections.",plain:"Good leak diagnosis uses evidence: meter movement, fixture isolation, pressure behavior, visible moisture and system layout. Isolate branches one at a time to reduce the possible fault area.",analogy:"Troubleshoot a pipe network the same way you troubleshoot a circuit: divide, test, prove.",where:["Hidden leaks","Fixture leaks","Service leaks","Hot-water systems"],failures:["Guessing from stain location alone","Changing multiple things at once","Ignoring intermittent usage"],safety:"Water near electrical systems creates an additional hazard. Address electrical safety before accessing wet areas.",related:["shutoff-valve","water-pressure","diagnostics-method"],lesson:"pressure-flow"}
  );

  D.worldLearningPaths = {
    electrical: D.learningPaths,
    hvac: [
      {id:"hvac-zero",name:"HVAC From Zero",level:"Beginner",minutes:55,concepts:["heat-transfer","refrigerant","compressor","condenser","metering-device","evaporator"]},
      {id:"air-side",name:"Understand the Air Side",level:"Beginner",minutes:40,concepts:["airflow-cfm","static-pressure","blower","ductwork","delta-t"]},
      {id:"hvac-diagnose",name:"HVAC Diagnostic Thinking",level:"Intermediate",minutes:50,concepts:["superheat","subcooling","delta-t","airflow-cfm","compressor"]}
    ],
    plumbing: [
      {id:"water-zero",name:"Water Supply From Zero",level:"Beginner",minutes:40,concepts:["water-pressure","flow-rate","shutoff-valve","pressure-regulator"]},
      {id:"dwv-zero",name:"Understand DWV",level:"Beginner",minutes:45,concepts:["p-trap","vent-stack","drain-slope","cleanout"]},
      {id:"plumb-diagnose",name:"Plumbing Diagnostic Thinking",level:"Intermediate",minutes:45,concepts:["leak-isolation","water-hammer","water-pressure","flow-rate","water-heater"]}
    ]
  };
})();


// --- V3: remaining trade worlds -------------------------------------------------
(() => {
  const D = window.TRADE_DATA;
  const setLive=(id,count)=>{const w=D.worlds.find(x=>x.id===id);if(w){w.status="live";w.topics=count;}};
  setLive("industrial",16); setLive("welding",15); setLive("construction",15);

  D.worldCategories = D.worldCategories || {};
  Object.assign(D.worldCategories, {
    industrial:[
      {id:"ind-mechanical",name:"Mechanical Power",icon:"01",description:"Shafts, couplings, belts, chains, gearboxes and how torque moves."},
      {id:"ind-bearings",name:"Bearings + Alignment",icon:"02",description:"Support rotating equipment, control friction and keep shafts where they belong."},
      {id:"ind-fluid",name:"Hydraulics",icon:"03",description:"Use pressurized liquid to create controlled force and motion."},
      {id:"ind-air",name:"Pneumatics",icon:"04",description:"Compressed-air preparation, valves, cylinders and machine motion."},
      {id:"ind-reliability",name:"Reliability",icon:"05",description:"Lubrication, vibration, heat and condition clues before failure."},
      {id:"ind-diagnostics",name:"Diagnostics",icon:"06",description:"Read symptoms, isolate causes and prove machine faults."}
    ],
    welding:[
      {id:"weld-process",name:"Processes",icon:"01",description:"SMAW, GMAW/MIG, GTAW/TIG and FCAW: what changes and why."},
      {id:"weld-arc",name:"Arc + Puddle",icon:"02",description:"Heat, current, voltage, travel speed and the molten weld pool."},
      {id:"weld-joints",name:"Joints + Positions",icon:"03",description:"Butt, lap, tee, groove, fillet and common welding positions."},
      {id:"weld-metal",name:"Metallurgy",icon:"04",description:"Base metal, filler metal, heat-affected zones and distortion."},
      {id:"weld-defects",name:"Defects + Inspection",icon:"05",description:"Porosity, undercut, lack of fusion, cracking and visual clues."},
      {id:"weld-safety",name:"Safety",icon:"06",description:"Arc radiation, fumes, fire, cylinders, electricity and hot work."}
    ],
    construction:[
      {id:"const-plans",name:"Plans + Layout",icon:"01",description:"Read drawings, dimensions, scale, symbols and establish layout."},
      {id:"const-framing",name:"Framing",icon:"02",description:"Walls, floors, roofs, openings and the members that form them."},
      {id:"const-loads",name:"Loads + Structure",icon:"03",description:"Follow gravity and lateral loads down to the foundation."},
      {id:"const-envelope",name:"Building Envelope",icon:"04",description:"Control rain, air, heat and moisture through assemblies."},
      {id:"const-materials",name:"Materials + Fasteners",icon:"05",description:"Wood, concrete, steel, connectors and how materials behave."},
      {id:"const-site",name:"Site + Safety",icon:"06",description:"Sequencing, temporary conditions, access and construction hazards."}
    ]
  });

  const C = (world,id,category,title,eyebrow,oneLine,plain,analogy,where,failures,safety,related,lesson="none") => ({world,id,category,title,eyebrow,oneLine,plain,analogy,where,failures,safety,related,lesson});
  D.concepts.push(
    // INDUSTRIAL MAINTENANCE
    C("industrial","shaft","ind-mechanical","Shaft","Mechanical Power","A rotating member that transmits torque between machine components.","Shafts carry rotational force from drivers such as motors to driven equipment. Their diameter, support, alignment and loading determine how reliably that torque reaches the load.","A shaft is the machine's rotating drive spine.",["Motors","Pumps","Gearboxes","Conveyors","Fans"],["Bent shaft","Wear at fits","Cracks","Misalignment","Excess runout"],"Rotating equipment can store energy and create entanglement hazards. Guarding and hazardous-energy controls matter.",["coupling","bearing","alignment"],"shaft-alignment"),
    C("industrial","coupling","ind-mechanical","Coupling","Mechanical Power","Connects two rotating shafts so torque can pass between them.","Couplings join driver and driven shafts. Different designs tolerate different amounts of angular, offset and axial misalignment while transmitting torque.","Two rotating hands joined together, ideally centered, not fighting each other.",["Motor-to-pump connections","Gearboxes","Fans","Mixers"],["Elastomer wear","Loose hardware","Hub damage","Misalignment","Incorrect gap"],"Couplings rotate at high speed. Never inspect an exposed rotating coupling while operating unless a designed safe method exists.",["shaft","alignment","bearing"],"shaft-alignment"),
    C("industrial","belt-drive","ind-mechanical","Belt Drive","Mechanical Power","Transfers rotation between pulleys using a flexible belt.","Belt drives can change speed ratio, isolate some vibration and transmit power without rigid shaft-to-shaft connection. Correct tension and pulley alignment strongly affect life.","Like bicycle power transmission, but designed around pulleys and controlled belt tension.",["Fans","Conveyors","Pumps","Air handlers"],["Slipping","Glazing","Cracking","Misaligned sheaves","Incorrect tension"],"Belt drives require guarding. De-energize and control stored motion before adjustment.",["pulley","alignment","bearing"],"conveyor-lab"),
    C("industrial","gearbox","ind-mechanical","Gearbox","Mechanical Power","Uses gears to change rotational speed, torque or direction.","A gearbox trades speed for torque or changes direction through meshing gears. Lubrication, tooth condition, bearing health and alignment all influence reliability.","A mechanical ratio converter: less speed can become more torque.",["Conveyors","Mixers","Hoists","Process equipment"],["Gear tooth wear","Oil contamination","Bearing damage","Backlash change","Overheating"],"Gearboxes may contain stored rotational load and hot lubricant. Isolate connected energy sources before service.",["shaft","bearing","lubrication"],"conveyor-lab"),
    C("industrial","bearing","ind-bearings","Rolling-Element Bearing","Bearings + Alignment","Supports a rotating shaft while reducing friction and controlling motion.","Rolling-element bearings use balls or rollers between races to support radial and/or axial load. Installation, lubrication, contamination and alignment largely determine service life.","A precisely controlled rolling path that lets the shaft spin without rubbing directly on the housing.",["Motors","Pumps","Gearboxes","Conveyors","Fans"],["Noise","Heat","Vibration","Spalling","Looseness"],"Bearing failures can seize or release rotating parts. Follow guarding and energy-control procedures.",["lubrication","alignment","vibration"],"bearing-lab"),
    C("industrial","alignment","ind-bearings","Shaft Alignment","Bearings + Alignment","Positions coupled shaft centerlines so the rotating machines operate together correctly.","Alignment corrects offset and angular relationship between shafts. Poor alignment creates extra forces that show up as vibration, heat, seal wear and bearing damage.","Two arrows can point the same direction but still miss each other; good alignment makes their centerlines agree.",["Motor-pump sets","Gearboxes","Compressors","Fans"],["High vibration","Coupling wear","Seal leakage","Hot bearings","Repeated failures"],"Alignment normally requires equipment to be isolated from hazardous energy before physical adjustment.",["coupling","bearing","soft-foot"],"shaft-alignment"),
    C("industrial","soft-foot","ind-bearings","Soft Foot","Bearings + Alignment","A machine-foot condition where all mounting feet do not sit flat on the base.","Tightening a soft-foot machine can distort its frame and change shaft alignment. Technicians identify the offending foot and correct the base/contact condition before final alignment.","A wobbly table becomes twisted when you force every leg down with bolts.",["Motors","Pumps","Baseplates"],["Alignment shifts during bolt tightening","Frame distortion","Repeat vibration"],"Use established measurement and correction procedures; shimming and base work require safe isolation.",["alignment","vibration","coupling"],"shaft-alignment"),
    C("industrial","hydraulic-pressure","ind-fluid","Hydraulic Pressure","Hydraulics","Force distributed through confined liquid, commonly expressed as pressure per unit area.","Hydraulic systems create force by applying pressure to piston area. Pressure rises as the actuator meets resistance to motion; the pump provides flow while the load drives required pressure.","Pressure is the push available; cylinder area turns that push into force.",["Presses","Lifts","Machine tools","Mobile equipment"],["Low force","Relief opening","Leakage","Pressure spikes"],"Hydraulic systems can contain extremely dangerous stored pressure. Depressurize and verify before opening the circuit.",["hydraulic-flow","cylinder","relief-valve"],"hydraulic-lab"),
    C("industrial","hydraulic-flow","ind-fluid","Hydraulic Flow","Hydraulics","The volume of hydraulic fluid moving through the circuit over time.","Flow primarily determines actuator speed. Restrictions, valve openings, pump displacement and leakage influence how much flow reaches the actuator.","Pressure helps create force; flow determines how quickly the movement happens.",["Hydraulic power units","Cylinders","Hydraulic motors"],["Slow actuator","Excess heat","Internal leakage","Restricted filter"],"Escaping high-pressure fluid can penetrate skin. Never use a hand to search for hydraulic leaks.",["hydraulic-pressure","cylinder","directional-valve"],"hydraulic-lab"),
    C("industrial","cylinder","ind-fluid","Hydraulic Cylinder","Hydraulics","Converts hydraulic pressure and flow into linear force and movement.","Pressure acts on piston area to generate force while supplied flow changes cylinder position. Double-acting cylinders use controlled pressure on either side for extend and retract motion.","A pressure-powered linear muscle.",["Clamps","Presses","Lifts","Machine slides"],["Seal leakage","Drift","Scored rod","Bent rod","Air in oil"],"A raised or loaded cylinder can move unexpectedly if pressure changes. Mechanically secure loads as procedures require.",["hydraulic-pressure","hydraulic-flow","directional-valve"],"hydraulic-lab"),
    C("industrial","directional-valve","ind-fluid","Directional Control Valve","Hydraulics","Routes fluid to determine which direction an actuator moves.","Directional valves connect pressure, tank and actuator ports in different patterns. Their spool position determines the current fluid path.","A railroad switch for hydraulic fluid.",["Hydraulic manifolds","Machine valves","Mobile hydraulics"],["Sticking spool","Contamination","Coil failure","Internal leakage"],"Valve state may change actuator motion instantly. Control stored energy before manual actuation or service.",["cylinder","hydraulic-flow","solenoid-valve"],"hydraulic-lab"),
    C("industrial","pneumatic-system","ind-air","Pneumatic System","Pneumatics","Uses compressed air to transmit energy and create machine motion.","Pneumatic systems commonly include air preparation, valves, tubing and actuators. Air is compressible, so pneumatic motion and stored energy behave differently from hydraulics.","A machine's compressed-air nervous and muscle system.",["Packaging","Clamping","Pick-and-place","Automation"],["Leaks","Low pressure","Water contamination","Sticky valves","Slow cylinders"],"Compressed air stores energy and can move actuators suddenly. Isolate and exhaust pressure before service.",["air-cylinder","solenoid-valve","frl"],"pneumatic-lab"),
    C("industrial","frl","ind-air","FRL / Air Preparation","Pneumatics","Filter, regulator and sometimes lubricator used to condition compressed air.","Air preparation removes contaminants, controls pressure and, where appropriate, introduces lubrication. Poor air quality shortens valve and actuator life.","Condition the air before asking precision components to live in it.",["Machine air drops","Valve manifolds","Pneumatic panels"],["Clogged filter","Regulator creep","Water carryover","Incorrect lubrication"],"Bowls and fittings are pressure-containing components. Depressurize before service.",["pneumatic-system","air-cylinder","solenoid-valve"],"pneumatic-lab"),
    C("industrial","air-cylinder","ind-air","Pneumatic Cylinder","Pneumatics","Converts compressed-air energy into linear movement.","Air pressure acting on piston area produces force while flow through valves and restrictions affects speed. Cushions and flow controls manage end-of-stroke behavior.","A lighter, springier cousin of the hydraulic cylinder.",["Stops","Pushers","Clamps","Packaging machines"],["Air leak","Binding","Worn seals","Poor cushioning","Low force"],"Unexpected cylinder motion can create pinch and crush hazards. Exhaust and verify stored air energy.",["pneumatic-system","solenoid-valve","frl"],"pneumatic-lab"),
    C("industrial","solenoid-valve","ind-air","Solenoid Valve","Pneumatics","Uses an electrical coil to shift a valve and redirect air or fluid.","An energized solenoid creates magnetic force that changes valve position. The electrical command and pneumatic/hydraulic power are separate energy domains connected by the valve.","Electricity moves the gate; pressure moves the machine.",["Valve manifolds","Cylinders","Process valves"],["Burned coil","Stuck spool","Contamination","No pilot pressure"],"Removing electrical power may not remove stored fluid pressure. Address every energy source.",["relay","pneumatic-system","directional-valve"],"pneumatic-lab"),
    C("industrial","lubrication","ind-reliability","Lubrication","Reliability","Controls friction, wear, heat and surface contact between moving parts.","Correct lubricant type, amount, cleanliness and interval create a protective film between surfaces. Both under-lubrication and over-lubrication can damage equipment.","The goal is a controlled film between surfaces, not simply 'more grease.'",["Bearings","Gearboxes","Chains","Slides"],["Heat","Discoloration","Contamination","Dryness","Churning"],"Lubricants can be hot, pressurized or chemically hazardous. Follow SDS and equipment procedures.",["bearing","gearbox","vibration"],"bearing-lab"),
    C("industrial","vibration","ind-reliability","Machine Vibration","Reliability","Mechanical motion that can reveal imbalance, misalignment, looseness and component defects.","Machines always vibrate to some degree. The pattern, frequency, direction and trend help technicians distinguish normal operation from developing faults.","A machine is constantly talking through motion; vibration analysis is learning its accent.",["Motors","Pumps","Fans","Gearboxes","Bearings"],["Increasing amplitude","New frequencies","Loose mounts","Resonance","Bearing defect patterns"],"Do not defeat guarding or approach rotating components just to obtain a reading; use approved measurement methods.",["bearing","alignment","soft-foot"],"bearing-lab"),

    // WELDING
    C("welding","smaw","weld-process","SMAW / Stick Welding","Welding Processes","An arc-welding process using a flux-coated consumable electrode.","The electrode conducts current to the arc and melts as filler metal. Its flux creates shielding gas and slag that protect the molten weld pool from the atmosphere.","The rod is conductor, filler and chemistry package all at once.",["Structural steel","Repair","Field fabrication","Pipe work"],["Arc instability","Slag inclusions","Porosity","Undercut","Poor bead profile"],"Arc welding involves electric shock, UV/IR radiation, fumes, fire and hot metal hazards. Use required training and PPE.",["arc-length","amperage","slag"],"weld-puddle"),
    C("welding","gmaw","weld-process","GMAW / MIG","Welding Processes","Uses a continuously fed wire electrode and externally supplied shielding gas.","Wire feed speed strongly influences welding current while voltage affects arc length and bead shape. Shielding gas protects the molten metal from atmospheric contamination.","A controlled wire-feed system continuously replaces the electrode as you weld.",["Fabrication","Automotive","Manufacturing","Sheet and structural work"],["Birdnesting","Poor gas coverage","Spatter","Burn-through","Lack of fusion"],"Protect cylinders, control fumes and hot work, and follow electrical/welding safety procedures.",["voltage-welding","wire-feed","shielding-gas"],"weld-puddle"),
    C("welding","gtaw","weld-process","GTAW / TIG","Welding Processes","Uses a nonconsumable tungsten electrode to create the arc, with filler added separately when needed.","TIG gives the operator precise control of arc heat and filler addition. Shielding gas protects the tungsten and weld pool.","One hand controls the heat source while the other can meter filler into the puddle.",["Stainless","Aluminum","Pipe","Precision fabrication"],["Tungsten contamination","Poor gas shielding","Lack of fusion","Excess heat input"],"TIG still presents arc radiation, electrical, gas-cylinder, fume and hot-metal hazards.",["arc-length","heat-input","shielding-gas"],"weld-puddle"),
    C("welding","fcaw","weld-process","FCAW","Welding Processes","Uses tubular wire filled with flux ingredients to support shielding and weld chemistry.","Flux-cored arc welding combines continuous wire feeding with flux in the electrode. Some wires are self-shielded; others also use shielding gas.","Think wire-feed welding with a chemistry package built inside the wire.",["Structural fabrication","Heavy equipment","Outdoor fabrication"],["Slag inclusions","Porosity","Excess spatter","Incorrect polarity"],"FCAW can generate significant fumes and hot slag. Use appropriate ventilation, PPE and hot-work controls.",["wire-feed","slag","shielding-gas"],"weld-puddle"),
    C("welding","amperage","weld-arc","Amperage","Arc + Puddle","Electrical current through the arc that strongly influences melting rate and heat.","Current affects how aggressively the arc melts electrode and base material. The exact relationship depends on the welding process and power-source mode.","More current generally means a more forceful heat-delivery rate, but only inside the correct process window.",["Welding machine settings","Procedure specifications","Electrode charts"],["Too cold","Burn-through","Excess deposition","Electrode overheating"],"Settings must stay within approved procedure, equipment and consumable limits.",["voltage-welding","travel-speed","heat-input"],"weld-puddle"),
    C("welding","voltage-welding","weld-arc","Arc Voltage","Arc + Puddle","Electrical potential across the arc that strongly relates to arc length and bead behavior.","In many arc processes, changing voltage changes arc length and arc spread. Too little or too much can destabilize the arc or alter penetration and bead profile.","Voltage helps define how wide and stretched the arc feels between electrode and work.",["GMAW settings","FCAW settings","Power-source displays"],["Excess spatter","Flat/wide bead","Unstable short arc","Undercut"],"Do not treat generic settings as a welding procedure; use approved parameters for actual work.",["amperage","arc-length","wire-feed"],"weld-puddle"),
    C("welding","travel-speed","weld-arc","Travel Speed","Arc + Puddle","How quickly the arc progresses along the joint.","Travel speed changes how long heat and filler are concentrated in each area. Too fast can reduce fusion and bead size; too slow can add excessive heat and buildup.","It's how long the moving heat source gets to work on each inch of joint.",["Every manual welding process"],["Undercut","Cold lap","Excess reinforcement","Burn-through","Distortion"],"Maintain body position and cable management so technique does not create trips, burns or loss of control.",["heat-input","work-angle","penetration"],"weld-puddle"),
    C("welding","arc-length","weld-arc","Arc Length","Arc + Puddle","Distance between the electrode tip and the workpiece across the active arc.","Arc length influences voltage, heat distribution and stability. Correct arc length depends on process, electrode and procedure.","Too far away stretches the arc; too close crowds it.",["SMAW","GTAW","Manual arc control"],["Arc wandering","Electrode sticking","Porosity","Poor bead shape"],"Arc length is controlled while exposed to intense radiation and hot metal; proper PPE is essential.",["voltage-welding","amperage","work-angle"],"weld-puddle"),
    C("welding","fillet-weld","weld-joints","Fillet Weld","Joints + Positions","A weld with roughly triangular cross-section joining surfaces that meet at an angle.","Fillet welds are common in tee, lap and corner joints. Leg size, throat, fusion and contour determine whether the weld can carry its intended load.","A triangular bridge of fused metal between two meeting surfaces.",["Frames","Brackets","Structural connections","Fabrication"],["Unequal legs","Undercut","Overlap","Lack of fusion","Incorrect size"],"Structural weld requirements come from drawings, procedures, codes and qualified personnel, not visual guessing alone.",["work-angle","penetration","undercut"],"joint-lab"),
    C("welding","groove-weld","weld-joints","Groove Weld","Joints + Positions","A weld deposited in a prepared groove between workpieces.","Groove geometry provides access for the arc and filler so the joint can achieve required fusion and penetration. Root opening, bevel angle and land affect the result.","Shape the joint so the weld can reach where the strength has to exist.",["Butt joints","Pipe","Structural connections","Pressure work"],["Incomplete penetration","Lack of fusion","Root defects","Excess reinforcement"],"Joint preparation and welding must follow the applicable qualified procedure and code requirements.",["penetration","heat-input","joint-prep"],"joint-lab"),
    C("welding","work-angle","weld-joints","Work + Travel Angle","Joints + Positions","Electrode orientation relative to the joint and direction of travel.","Work angle divides the arc between joint members; travel angle controls how the arc points along the weld path. Both influence bead placement, fusion and puddle control.","Aim the heat where the metal needs to fuse, then lean it appropriately along the direction of travel.",["Fillet welds","Groove welds","Out-of-position welding"],["Unequal bead","Undercut","Lack of fusion","Slag trapping"],"Maintain stable posture and visibility without placing yourself in fume, spark or hot-metal paths.",["fillet-weld","travel-speed","penetration"],"joint-lab"),
    C("welding","heat-input","weld-metal","Heat Input","Metallurgy","A measure of welding energy delivered along the joint, affected by voltage, current and travel speed.","Heat input influences cooling rate, weld size, distortion and metallurgical changes in the weld and heat-affected zone. Real procedures control it when material performance matters.","Not just how hot the arc is, but how much energy you leave behind per length of joint.",["Procedure qualification","Alloy steels","Distortion control","Production welding"],["Excess distortion","Too-fast cooling","Large HAZ","Mechanical-property changes"],"Follow approved welding procedures when heat input matters to material properties.",["travel-speed","amperage","haz"],"joint-lab"),
    C("welding","haz","weld-metal","Heat-Affected Zone","Metallurgy","Base metal next to the weld that did not melt but had its microstructure changed by welding heat.","The HAZ experiences a thermal cycle that can alter hardness, strength, toughness or corrosion behavior depending on material and procedure.","The weld changed more metal than just what visibly melted.",["All welded joints"],["Hardening","Softening","Cracking susceptibility","Distortion"],"Metallurgical acceptance requires applicable procedures, codes and inspection methods.",["heat-input","penetration","cracking"],"joint-lab"),
    C("welding","porosity","weld-defects","Porosity","Defects + Inspection","Gas pockets trapped in solidifying weld metal.","Porosity often points toward shielding, contamination, moisture or technique issues. Distribution and severity matter when evaluating a weld.","Tiny bubbles got trapped before the molten metal could solidify cleanly.",["Visual inspection","Radiography","Cut sections"],["Poor shielding gas","Dirty base metal","Moisture","Long arc"],"Defect acceptance is governed by the applicable code/specification and qualified inspection, not a generic rule.",["shielding-gas","arc-length","cracking"],"defect-lab"),
    C("welding","undercut","weld-defects","Undercut","Defects + Inspection","A groove melted into base metal beside the weld toe that is not adequately filled.","Undercut reduces local section thickness and can create a stress concentration. Excess current, travel speed or poor angle can contribute.","The arc carved away the edge faster than filler replaced it.",["Weld toes","Fillet welds","Groove welds"],["High current","Fast travel","Wrong angle","Arc directed at edge"],"Acceptance limits vary by application and code; inspection must use the governing criteria.",["travel-speed","work-angle","fillet-weld"],"defect-lab"),
    C("welding","cracking","weld-defects","Weld Cracking","Defects + Inspection","A fracture in weld metal or adjacent base material and one of the most serious weld discontinuities.","Cracks can result from metallurgical, restraint, hydrogen, thermal and design factors. Their timing and location help identify cause.","The joint could not accommodate the stresses and material condition created during or after welding.",["Weld centerline","Crater","HAZ","Root"],["Hydrogen","High restraint","Poor crater fill","Material sensitivity","Thermal stress"],"Crack evaluation and repair require qualified procedures and applicable code requirements.",["haz","heat-input","porosity"],"defect-lab"),

    // CONSTRUCTION
    C("construction","scale-reading","const-plans","Drawing Scale","Plans + Layout","A defined relationship between dimensions on a drawing and actual dimensions in the field.","Scaled drawings compress real buildings onto sheets. Technicians must distinguish scaled measurement from written dimensions and understand when not to scale a drawing.","A map for a building, but written dimensions outrank eyeballing distance.",["Plans","Details","Site drawings","Shop drawings"],["Wrong scale","Printing distortion","Using architectural vs engineering scale incorrectly"],"Field layout must follow approved/current documents and project procedures.",["dimensions","plan-symbols","layout"],"blueprint-lab"),
    C("construction","dimensions","const-plans","Dimensions","Plans + Layout","Written measurements that define required locations, sizes and relationships.","Dimension strings communicate controlling distances. Good plan reading follows extension lines, dimension hierarchy, references and notes rather than assuming geometry from appearance.","The drawing picture explains shape; dimensions tell you where it really goes.",["Floor plans","Elevations","Details","Structural plans"],["Reading wrong string","Missing reference point","Rounding","Using obsolete drawing"],"Verify current revisions and resolve conflicts through the project's approved process.",["scale-reading","layout","plan-symbols"],"blueprint-lab"),
    C("construction","plan-symbols","const-plans","Plan Symbols + References","Plans + Layout","Graphic shorthand that points to building elements, sections, details and notes.","Construction documents use discipline-specific symbols and callouts to connect drawings. A section marker, detail bubble or key note can lead to the information that actually governs the work.","The plans are a linked information system, not a single picture.",["Architectural plans","MEP plans","Structural drawings"],["Ignoring detail reference","Wrong sheet","Missing legend","Using superseded note"],"Use the project's current drawing set and formal clarification process.",["dimensions","scale-reading","layout"],"blueprint-lab"),
    C("construction","layout","const-plans","Field Layout","Plans + Layout","Transfers designed locations and dimensions from drawings into physical reference points on site.","Layout establishes control lines, elevations, offsets and positions that downstream work depends on. Small errors early can propagate through many trades.","Turn information on paper into trustworthy points in the real world.",["Walls","Foundations","Openings","Equipment","Utilities"],["Wrong datum","Accumulated error","Bad reference line","Unverified measurement"],"Layout work around active sites requires awareness of fall, struck-by, equipment and access hazards.",["dimensions","scale-reading","wall-framing"],"blueprint-lab"),
    C("construction","wall-framing","const-framing","Wood Wall Framing","Framing","Studs, plates, headers and related members assembled to create walls and transfer loads.","Typical wall framing uses vertical studs between plates, with special framing around openings and concentrated loads. Load-bearing and non-load-bearing walls behave differently.","A repeating skeleton that creates surfaces while carrying loads where required.",["Residential construction","Light commercial"],["Over-spaced members","Poor nailing","Missing support","Incorrect opening framing"],"Framing operations involve saws, nailers, lifting and fall hazards. Follow required site safety practices.",["header","load-path","shear-wall"],"framing-lab"),
    C("construction","header","const-framing","Header","Framing","A horizontal structural member that carries load across an opening.","Openings interrupt normal vertical load paths. Headers collect load above the opening and transfer it to supporting members at each side.","A bridge over a door or window.",["Doors","Windows","Large wall openings"],["Undersized member","Missing bearing","Incorrect jack studs","Excess notch/drill"],"Member sizing and support must follow approved structural documents and applicable code.",["wall-framing","load-path","bearing"],"framing-lab"),
    C("construction","floor-joist","const-framing","Floor Joist","Framing","A repeated horizontal structural member supporting floor loads between supports.","Joists span between bearing lines or beams and support subfloor. Span, spacing, species/product, holes and notches all affect performance.","Repeated beams forming the floor's structural ribs.",["Wood floors","Decks","Ceilings"],["Over-span","Improper holes/notches","Rot","Missing bearing","Excess deflection"],"Field modifications to structural members require approved criteria, not guesswork.",["load-path","beam","subfloor"],"framing-lab"),
    C("construction","roof-framing","const-framing","Roof Framing","Framing","Structural members that create roof shape and transfer roof loads to walls or other supports.","Rafters or trusses carry gravity loads and interact with bracing, sheathing and connections. Engineered trusses must not be modified casually.","The roof skeleton turns a large sloped surface into organized load paths.",["Houses","Commercial roofs","Additions"],["Cut truss","Missing bracing","Poor bearing","Connection failure"],"Roof work adds severe fall hazards; structural alterations require qualified design.",["load-path","shear-wall","building-envelope"],"framing-lab"),
    C("construction","load-path","const-loads","Load Path","Loads + Structure","The continuous route forces follow through connected building elements to the ground.","A structure works when each load has a connected path through roofs/floors, walls/frames, beams, columns and foundations. Missing connections break that chain.","Follow the weight and forces until they reach the earth.",["Every structure","Framing inspection","Structural coordination"],["Missing bearing","Discontinuous support","Weak connection","Unplanned point load"],"Structural modifications should be evaluated against approved design documents and by qualified professionals when required.",["header","beam","foundation"],"loadpath-lab"),
    C("construction","beam","const-loads","Beam","Loads + Structure","A structural member primarily used to span and carry loads to supports.","Beams resist bending and shear while transferring reactions into columns, walls or foundations. Material, section, span and loading control capacity and deflection.","A bridge inside the building structure.",["Floors","Roofs","Openings","Frames"],["Excess deflection","Cracking","Corrosion/rot","Insufficient bearing","Overload"],"Beam sizing and alterations require approved structural design.",["load-path","column","foundation"],"loadpath-lab"),
    C("construction","foundation","const-loads","Foundation","Loads + Structure","Transfers building loads into supporting soil or rock while controlling movement.","Footings, slabs, piers and foundation walls spread and transfer loads. Soil capacity, drainage, frost, expansive soils and settlement influence performance.","The final handoff between the structure and the earth.",["Footings","Slabs","Piers","Basements"],["Settlement","Cracking","Water intrusion","Heave","Poor bearing soil"],"Excavation, formwork and concrete operations carry significant site hazards and engineering requirements.",["load-path","beam","drainage-plane"],"loadpath-lab"),
    C("construction","shear-wall","const-loads","Shear Wall / Braced Wall","Loads + Structure","A wall system configured to resist lateral forces such as wind or seismic loads.","Sheathing, framing, anchors and hold-down/connection details work together to move lateral loads through the structure.","A wall that acts like a vertical structural panel instead of only dividing rooms.",["Exterior walls","Engineered lateral systems","Braced wall lines"],["Missing nailing","Blocked load path","Incorrect anchor","Large unaccounted opening"],"Lateral-system changes can affect building stability and require design review.",["load-path","wall-framing","fasteners"],"loadpath-lab"),
    C("construction","building-envelope","const-envelope","Building Envelope","Building Envelope","The assemblies separating conditioned interior space from exterior weather and environmental conditions.","Walls, roofs, windows, doors and foundations must coordinate water, air, vapor and thermal control layers. Failures often happen at transitions between components.","The building's environmental skin, but made from multiple layers doing different jobs.",["Roofs","Walls","Windows","Foundations"],["Air leaks","Water intrusion","Condensation","Thermal bridging"],"Envelope installation often occurs at heights and around sharp materials, sealants and weather exposure.",["drainage-plane","flashing","insulation"],"envelope-lab"),
    C("construction","flashing","const-envelope","Flashing","Building Envelope","Material arranged to direct water back toward the exterior at joints, openings and transitions.","Good flashing uses laps, end dams, membranes and geometry so gravity and drainage paths work in the correct direction. Sealant alone is rarely the whole strategy.","Give water an intentional exit path before it finds an accidental one.",["Windows","Doors","Roofs","Deck ledgers","Wall transitions"],["Reverse lap","Missing end dam","Puncture","Poor integration"],"Installation must follow manufacturer details, approved documents and safe access procedures.",["building-envelope","drainage-plane","roof-framing"],"envelope-lab"),
    C("construction","fasteners","const-materials","Fasteners + Connectors","Materials + Fasteners","Mechanical devices that transfer force between construction materials and components.","Nails, screws, bolts, anchors and metal connectors have specific applications, capacities, edge distances and installation requirements. Substitution can change performance.","Small pieces that make the load path physically continuous.",["Framing","Concrete anchors","Steel connections","Decks"],["Wrong fastener","Corrosion","Under/over-driving","Missing fasteners","Improper edge distance"],"Use specified connectors and manufacturer installation requirements; power fasteners add projectile and noise hazards.",["shear-wall","wall-framing","load-path"],"framing-lab")
  );

  Object.assign(D.worldLearningPaths, {
    industrial:[
      {id:"ind-zero",name:"Mechanical Maintenance From Zero",level:"Beginner",minutes:65,concepts:["shaft","coupling","belt-drive","gearbox","bearing","alignment"]},
      {id:"fluid-power",name:"Fluid Power Basics",level:"Beginner",minutes:60,concepts:["hydraulic-pressure","hydraulic-flow","cylinder","directional-valve","pneumatic-system","air-cylinder"]},
      {id:"machine-health",name:"Read Machine Health",level:"Intermediate",minutes:45,concepts:["bearing","alignment","soft-foot","lubrication","vibration"]}
    ],
    welding:[
      {id:"weld-zero",name:"Welding From Zero",level:"Beginner",minutes:65,concepts:["smaw","gmaw","gtaw","fcaw","amperage","voltage-welding"]},
      {id:"puddle-control",name:"Control the Puddle",level:"Intermediate",minutes:50,concepts:["amperage","voltage-welding","travel-speed","arc-length","work-angle"]},
      {id:"weld-quality",name:"Understand Weld Quality",level:"Intermediate",minutes:55,concepts:["fillet-weld","groove-weld","heat-input","haz","porosity","undercut","cracking"]}
    ],
    construction:[
      {id:"plans-zero",name:"Read Construction Plans",level:"Beginner",minutes:50,concepts:["scale-reading","dimensions","plan-symbols","layout"]},
      {id:"frame-zero",name:"How Framing Works",level:"Beginner",minutes:60,concepts:["wall-framing","header","floor-joist","roof-framing","fasteners"]},
      {id:"loads-zero",name:"Follow the Load",level:"Intermediate",minutes:50,concepts:["load-path","beam","foundation","shear-wall","fasteners"]}
    ]
  });
  D.worlds.forEach(w => { w.topics = D.concepts.filter(c => (c.world || "electrical") === w.id).length; });
})();
