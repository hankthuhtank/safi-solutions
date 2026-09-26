const $ = (q, p=document) => p.querySelector(q);
const $$ = (q, p=document) => [...p.querySelectorAll(q)];
const esc = (s='') => s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

const colors = {signal:'#3d8ef0', power:'#ef5b4c', safety:'#f5c400', network:'#2fbf8f', motion:'#f28a2e', control:'#35d3ee'};

const inspectData = {
  incomingPower:{kicker:'POWER PATH',title:'Incoming 3-phase power',text:'The machine needs electrical energy before the controls can do anything. In many U.S. plants, larger motors and drives are commonly fed from 3-phase AC systems such as 480 V — but the actual voltage is plant- and machine-specific.'},
  panel:{kicker:'CONTROL + DISTRIBUTION',title:'The control panel',text:'A cabinet that organizes protection, power conversion, control hardware, safety hardware, networking, drives, and field wiring. Think of it as the machine’s electrical nerve center.'},
  vfd:{kicker:'MOTOR CONTROL',title:'Variable-frequency drive',text:'A VFD takes fixed-frequency AC power and creates controlled output for an AC motor. That lets the system command motor speed and torque instead of simply switching the motor fully on or off.'},
  motor:{kicker:'LOAD / MOTION',title:'Three-phase motor',text:'Electrical power becomes mechanical rotation. Motors turn conveyors, pumps, fans, rolls, mixers, and countless other loads.'},
  sensor:{kicker:'INPUT',title:'Photoelectric sensor',text:'A sensor turns a physical condition — such as “a box is here” — into an electrical signal the control system can read.'},
  safety:{kicker:'SAFETY',title:'Emergency stop path',text:'An E-stop is part of a safety function, not an ordinary “stop button.” Safety devices, logic, outputs, and the final machine response have to be designed and validated as a complete function.'},
  hmi:{kicker:'OPERATOR INTERFACE',title:'HMI',text:'The Human-Machine Interface shows status, alarms, values, and controls. It is the operator’s window into what the control system is doing.'}
};

const layerData = {
  signal:{
    color:colors.signal,label:'SIGNAL PATH',title:'How the machine knows what is happening',desc:'A physical event becomes an electrical signal, becomes controller data, becomes logic, then becomes an output command.',
    nodes:[['◉','Sensor','Sees the real world'],['▥','Input I/O','Converts field signal'],['▣','PLC logic','Makes the decision'],['▥','Output / drive','Turns decision into action'],['↻','Machine','Moves / changes']],
    notes:[['INPUT','Sensors, switches, transmitters'],['DECISION','Tags, logic, sequences, interlocks'],['OUTPUT','Solenoids, contactors, drives, valves']]
  },
  power:{
    color:colors.power,label:'POWER PATH',title:'How energy reaches the load',desc:'Control signals are tiny. Motors need real power. The power path handles isolation, protection, conversion, and delivery to the load.',
    nodes:[['⚡','Plant source','Electrical supply'],['◫','Disconnect','Isolation point'],['⌁','Protection','Breaker / fuse'],['▤','VFD / starter','Controls motor power'],['↻','Motor / load','Does physical work']],
    notes:[['ISOLATE','Disconnects establish an energy-isolation point'],['PROTECT','Overcurrent / overload protection serve different jobs'],['CONTROL','A starter switches power; a VFD controls it electronically']]
  },
  safety:{
    color:colors.safety,label:'SAFETY PATH',title:'How a hazard requests a safe state',desc:'A safety function is a chain: detect the condition, evaluate it with safety-rated architecture, then remove or limit hazardous motion/energy.',
    nodes:[['●','E-stop / guard','Safety input'],['▥','Safety I/O','Safety-rated signal'],['✣','Safety logic','Relay / GuardLogix'],['⏻','Safe output','STO / contactors'],['✓','Safe state','Hazard reduced']],
    notes:[['REDUNDANCY','Safety designs often use fault detection + redundancy'],['STO','Safe Torque Off prevents drive torque production; it is not the same as power isolation'],['VALIDATE','The complete safety function is assessed, not just one component']]
  },
  network:{
    color:colors.network,label:'DATA PATH',title:'How industrial devices talk',desc:'Modern controls exchange I/O, diagnostics, motion, safety, configuration, and status over industrial networks.',
    nodes:[['▣','Controller','Produces / consumes data'],['◇','Ethernet switch','Forwards frames'],['▥','Remote I/O','Field data'],['▤','Drive','Command + feedback'],['▧','HMI','Status + operator data']],
    notes:[['ETHERNET/IP','Standard Ethernet infrastructure + CIP industrial services'],['LEGACY','ControlNet and DeviceNet still matter in installed equipment'],['RPI','Logix I/O data is transferred at configured intervals and can update asynchronously to logic']]
  }
};

const labs = {};

labs.ladder = () => `
<div class="lab-layout">
  <div class="lab-main">
    <div class="ladder-sim">
      <div class="ladder-controls">
        <button class="io-toggle on" data-io="stop" aria-pressed="true"><i></i>Stop_OK <em>toggle</em></button>
        <button class="io-toggle on" data-io="overload" aria-pressed="true"><i></i>Overload_OK <em>toggle</em></button>
        <button class="io-toggle momentary" data-io="start" aria-pressed="false"><i></i>Start_PB <em>hold to press</em></button>
      </div>
      <div class="ladder-canvas">
        <svg class="ladder-svg" viewBox="0 0 760 250" role="img" aria-label="Seal-in start/stop rung: Stop_OK and Overload_OK in series, Start_PB in parallel with a Motor_Cmd seal-in contact, driving the Motor_Cmd output">
          <text class="rung-no" x="10" y="95">0</text>
          <line class="rail" x1="34" y1="28" x2="34" y2="226"/><line class="rail" x1="726" y1="28" x2="726" y2="226"/>
          <path class="seg" data-seg="a" d="M34 90 H112"/>
          <path class="seg" data-seg="b" d="M148 90 H242"/>
          <path class="seg" data-seg="c" d="M278 90 H330 M330 90 V170 M330 170 H392 M330 90 H392"/>
          <path class="seg" data-seg="top" d="M428 90 H500"/>
          <path class="seg" data-seg="bot" d="M428 170 H500 V90"/>
          <path class="seg" data-seg="out" d="M500 90 H602 M638 90 H726"/>
          <g class="xic" data-c="stop" transform="translate(130 90)"><text class="tag" y="-30">Stop_OK</text><path d="M-18 -16 V16 M18 -16 V16"/><text class="mn" y="34">XIC</text></g>
          <g class="xic" data-c="overload" transform="translate(260 90)"><text class="tag" y="-30">Overload_OK</text><path d="M-18 -16 V16 M18 -16 V16"/><text class="mn" y="34">XIC</text></g>
          <g class="xic" data-c="start" transform="translate(410 90)"><text class="tag" y="-30">Start_PB</text><path d="M-18 -16 V16 M18 -16 V16"/><text class="mn" y="34">XIC</text></g>
          <g class="xic seal" data-c="seal" transform="translate(410 170)"><text class="tag" y="-26">Motor_Cmd</text><path d="M-18 -16 V16 M18 -16 V16"/><text class="mn" y="34">XIC · seal-in</text></g>
          <g class="ote" data-c="coil" transform="translate(620 90)"><text class="tag" y="-30">Motor_Cmd</text><path d="M-12 -18 Q-26 0 -12 18 M12 -18 Q26 0 12 18"/><text class="mn" y="34">OTE</text></g>
        </svg>
      </div>
      <div class="logic-result"><span id="ladderNote">Hold <b>Start_PB</b>, then let go. Watch the lower branch.</span><strong id="logicResult">Motor_Cmd = 0</strong><i class="motor-fan" id="motorFan" aria-hidden="true"></i></div>
    </div>
  </div>
  <aside class="lab-side">
    <div class="lab-kicker">LADDER LOGIC / RUNG 0</div><h3>The seal-in rung.<br>Start once, run until stopped.</h3>
    <p class="beginner-only">A start button is only pressed for a moment, so the rung needs a memory. The output's own contact, wired in parallel with Start, "seals in" the command after you let go. Opening Stop or Overload breaks the seal — and the motor stays off until someone presses Start again.</p>
    <p class="field-only">XIC (“Examine If Closed”) is TRUE when its bit is 1. The branch makes this rung Stop_OK AND Overload_OK AND (Start_PB OR Motor_Cmd). Online, Studio 5000 highlights TRUE instructions and energized rung segments in green — the same convention used here.</p>
    <div class="lab-facts">
      <div class="lab-fact"><small>WHY IT MATTERS</small><p>This is the software form of the classic three-wire start/stop circuit. After a power loss or a stop, the machine does not restart by itself.</p></div>
      <div class="lab-fact"><small>IMPORTANT</small><p>An E-stop should not be taught as an ordinary standard-logic contact. Safety functions belong in properly designed safety architecture.</p></div>
      <div class="lab-fact field-only"><small>LOGIX REALITY</small><p>Logix I/O can update asynchronously to task execution; the classic “read every input → scan → write every output” picture is only a beginner mental model.</p></div>
    </div>
  </aside>
</div>`;

labs.rack = () => `
<div class="lab-layout">
  <div class="lab-main">
    <div class="rack-wrap"><div class="rack-chassis" id="rackChassis">
      ${[
        ['0','1756-L8x','CONTROLLER','cpu'],['1','1756-EN2TR','ETHERNET','net'],['2','1756-IB16','DIGITAL IN','io'],['3','1756-OB16','DIGITAL OUT','io'],['4','1756-IF8','ANALOG IN','io'],['5','SPARE','OPEN SLOT','spare'],['6','SPECIALTY','MODULE','io']
      ].map((m,i)=>`<button class="rack-module ${m[3]} ${i===0?'active':''}" data-rack="${i}" aria-label="Slot ${m[0]} ${m[2]}"><span class="slot">SLOT ${m[0]}</span><i></i><span class="ports"></span><b>${m[2]}</b></button>`).join('')}
    </div></div>
  </div>
  <aside class="lab-side" id="rackInfo"><div class="lab-kicker">CONTROLLOGIX / CHASSIS</div><h3>Slot 0<br>Controller</h3><p>The controller runs tasks, programs, and routines and exchanges data with modules and networked devices.</p><div class="lab-facts"><div class="lab-fact"><small>KEY IDEA</small><p>A ControlLogix system is chassis-based. Modules occupy numbered slots; actual module selection and placement depend on the real design.</p></div><div class="lab-fact"><small>NOT A TEMPLATE</small><p>This rack is a labeled teaching example — never a recommended bill of material or required slot order.</p></div></div></aside>
</div>`;

labs.vfd = () => `
<div class="lab-layout"><div class="lab-main"><div class="vfd-visual">
  <div class="vfd-block"><div class="vfd-screen"><small>OUTPUT FREQUENCY</small><strong id="vfdHz">30.0 Hz</strong></div><div class="vfd-buttons"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>
  <div class="vfd-gauge"><div class="gauge-ring" id="vfdGauge" style="--pct:50"><div><b id="vfdPct">50%</b><span>COMMAND (0–60 Hz demo)</span></div></div><input class="range" id="vfdRange" type="range" min="0" max="60" value="30" step="1"/></div>
</div></div><aside class="lab-side"><div class="lab-kicker">POWERFLEX / VFD</div><h3>Change frequency.<br>Change motor behavior.</h3><p>A variable-frequency drive electronically creates controlled AC output for a motor. It can manage speed, acceleration, deceleration, torque behavior, and diagnostics.</p><div class="lab-facts"><div class="lab-fact"><small>NOT “JUST A DIMMER”</small><p>A drive rectifies and switches power using a controlled power-electronics stage; the motor sees synthesized output.</p></div><div class="lab-fact"><small>FIELD WORDS</small><p>Reference, accel/decel, current, torque, fault, enable, start command, speed feedback.</p></div></div></aside></div>`;

labs.servo = () => `
<div class="lab-layout"><div class="lab-main"><div class="servo-loop"><div class="servo-diagram">
  <div class="servo-row"><div class="servo-box"><b>POSITION COMMAND</b><small>Where should it be?</small></div><div class="servo-box"><b>SERVO CONTROLLER</b><small>Calculates correction</small></div><div class="servo-box"><b>KINETIX DRIVE</b><small>Controls motor current</small></div><div class="servo-box"><b>SERVO MOTOR</b><small>Moves axis</small></div></div>
  <div class="feedback-line"></div><div class="servo-position"><i id="servoPuck" style="--servo-pos:35"></i></div><div class="servo-target"><span>Target</span><input id="servoRange" type="range" min="8" max="92" value="35"/><b id="servoValue">35%</b></div>
</div></div></div><aside class="lab-side"><div class="lab-kicker">KINETIX / MOTION</div><h3>A servo is a<br>closed loop.</h3><p>The key difference is feedback. The system continually compares the command to actual motion and corrects the error.</p><div class="lab-facts"><div class="lab-fact"><small>THREE WORDS</small><p>Position = where. Velocity = how fast. Torque = how hard.</p></div><div class="lab-fact"><small>KINETIX 5700</small><p>Rockwell’s 5700 family integrates motion over EtherNet/IP and is aimed at multi-axis, higher-performance machines.</p></div></div></aside></div>`;

labs.analog = () => `
<div class="lab-layout"><div class="lab-main"><div class="analog-vis"><div><div class="tank"><div class="tank-water" id="tankWater" style="--level:50"></div><div class="tank-scale"></div></div></div><div class="signal-meter"><h4>LEVEL TRANSMITTER</h4><strong id="maValue">12.00 <span>mA</span></strong><div class="signal-bar"><i id="maBar" style="--signal-pct:50%"></i></div><p id="maText">50% process level → 12.00 mA. In this demo, 4 mA represents 0% and 20 mA represents 100%.</p><input id="maRange" type="range" min="0" max="100" value="50"/></div></div></div><aside class="lab-side"><div class="lab-kicker">ANALOG SIGNALS</div><h3>4 mA is zero.<br>20 mA is full scale.</h3><p>A 4–20 mA current loop is a common way to represent a continuously varying measurement such as pressure, level, flow, or temperature.</p><div class="lab-facts"><div class="lab-fact"><small>WHY 4, NOT 0?</small><p>A “live zero” can help distinguish a valid 0% reading from some fault conditions such as a broken loop, depending on the instrument and system design.</p></div><div class="lab-fact"><small>SCALING</small><p>The PLC converts raw input data into engineering units: psi, °F, %, gallons/min, etc.</p></div></div></aside></div>`;

labs.network = () => `
<div class="lab-layout"><div class="lab-main"><div class="network-vis"><div class="topology"><div class="net-node controller"><b>CONTROLLOGIX</b><small>192.168.10.10</small></div><div class="net-node switch"><b>MANAGED SWITCH</b><small>Industrial Ethernet</small></div><div class="net-node io"><b>POINT I/O</b><small>Remote I/O</small></div><div class="net-node vfdn"><b>POWERFLEX</b><small>Drive</small></div><div class="net-node hmi"><b>HMI</b><small>Operator view</small></div><i class="net-line n1"></i><i class="net-line n2"></i><i class="net-line n3"></i><i class="net-line n4"></i><i class="packet p1"></i><i class="packet p2"></i></div></div></div><aside class="lab-side"><div class="lab-kicker">ETHERNET/IP + CIP</div><h3>Ethernet is the road.<br>CIP is the language.</h3><p>EtherNet/IP uses standard Ethernet/IP technology plus the Common Industrial Protocol for automation services such as I/O, control, safety, motion, and information.</p><div class="lab-facts"><div class="lab-fact"><small>COMMON CONFUSION</small><p>EtherNet/IP is not “just any Ethernet connection.” The “IP” is part of the industrial protocol’s name.</p></div><div class="lab-fact"><small>OLDER INSTALLED BASE</small><p>ControlNet and DeviceNet are still important because existing plants may contain them even when new designs favor Ethernet-based architectures.</p></div></div></aside></div>`;

labs.safety = () => `
<div class="lab-layout"><div class="lab-main"><div class="safety-vis"><div class="safety-chain"><div class="safe-box"><i>●</i><b>E-STOP / GUARD</b><small>detect</small></div><div class="safe-box"><i>▥</i><b>SAFETY INPUT</b><small>transport</small></div><div class="safe-box"><i>✣</i><b>SAFETY LOGIC</b><small>evaluate</small></div><div class="safe-box"><i>⏻</i><b>SAFE OUTPUT</b><small>act</small></div></div><div class="safe-test"><button id="tripSafety">Simulate E-stop</button><span class="safe-status" id="safeStatus">Safety chain healthy</span></div></div></div><aside class="lab-side"><div class="lab-kicker">GUARDLOGIX / PILZ / STO</div><h3>Safety is a function,<br>not a magic relay.</h3><p>A complete safety function starts with a hazard and defines how the machine detects a demand and reaches a safe condition with the required risk reduction.</p><div class="lab-facts"><div class="lab-fact"><small>PILZ PNOZ</small><p>Safety relays can monitor functions such as E-stops, safety gates, light curtains, and two-hand controls.</p></div><div class="lab-fact"><small>GUARDLOGIX</small><p>Integrates standard and safety control in the Logix environment, with safety-rated hardware, task behavior, and validation requirements.</p></div><div class="lab-fact"><small>STO ≠ ISOLATION</small><p>Safe Torque Off is a functional-safety feature that prevents torque generation; it does not replace electrical energy isolation for servicing.</p></div></div></aside></div>`;

const paths = [
  {
    n:'1. See the whole machine',
    topics:['PLC','I/O','HMI','drive','motor'],
    idea:'A machine is not one mysterious box. It is a handful of systems passing energy and information back and forth.',
    can:'Point at the major pieces of a machine and explain, in plain English, what each one is responsible for.',
    start:'Machine Map → PLC → I/O → HMI'
  },
  {
    n:'2. Follow power and signals',
    topics:['3-phase','24 VDC','digital','analog','4–20 mA'],
    idea:'Power makes equipment capable of doing work. Signals tell the control system what is happening.',
    can:'Tell the difference between power wiring and signal wiring, and understand why a sensor can be “working” even when a motor has no power.',
    start:'480 VAC → 24 VDC → sensors → input modules'
  },
  {
    n:'3. Understand the PLC brain',
    topics:['ControlLogix','Studio 5000','tags','ladder','permissives'],
    idea:'The PLC reads information, evaluates logic, and produces commands. Studio 5000 is where that behavior is configured and viewed.',
    can:'Open ladder logic and recognize conditions, commands, tags, and the basic reason a rung is true or false.',
    start:'Tags → XIC/XIO → rung result → OTE'
  },
  {
    n:'4. Make things move',
    topics:['contactor','overload','PowerFlex','VFD','servo','Kinetix'],
    idea:'A PLC command is only the beginning. Drives and motor-control hardware turn a low-energy decision into controlled physical motion.',
    can:'Trace a motor or servo from “run command” to actual motion, then identify where feedback or a fault enters the picture.',
    start:'Command → drive/starter → motor → feedback'
  },
  {
    n:'5. Follow the data',
    topics:['EtherNet/IP','CIP','POINT I/O','FLEX I/O','switches'],
    idea:'Modern machines are distributed. The controller may be several cabinets away from the sensor, drive, or I/O it is using.',
    can:'Look at a networked device and understand what it talks to, why remote I/O exists, and why “it pings” does not prove the control connection is healthy.',
    start:'Device → network → controller → logic'
  },
  {
    n:'6. Read, protect, troubleshoot',
    topics:['schematics','terminals','GuardLogix','STO','faults','feedback'],
    idea:'Drawings help you find the real circuit. Safety defines how hazards reach a safe state. Troubleshooting is the skill of tracing where expected behavior stops.',
    can:'Use a drawing and live status to narrow a vague “it won’t run” complaint into a specific missing command, permissive, signal, device state, or physical path.',
    start:'Symptom → command → permissives → device → feedback'
  }
];

const decoder = [
  ['ControlLogix','1756 family','A chassis-based programmable controller system','The brain + modular rack architecture for control, communications, I/O, motion, and safety.'],
  ['Studio 5000 Logix Designer','software','The programming / configuration environment','Where engineers configure Logix controllers, I/O, tags, ladder logic, routines, motion, and more.'],
  ['RSLogix','legacy software name','Older Rockwell programming software branding','You will still hear “RSLogix” casually. RSLogix 5000 evolved into Studio 5000 Logix Designer; RSLogix 5/500 refer to older controller families.'],
  ['Kinetix 5700','servo drive','High-performance multi-axis motion hardware','Controls servo or supported motor axes and integrates motion over EtherNet/IP.'],
  ['Kinetix 6000','servo drive','Earlier multi-axis servo platform','A widely installed Logix-integrated servo family; knowing legacy hardware matters in plants.'],
  ['PowerFlex','AC drive family','Variable-frequency drives for motor control','Controls AC motors for conveyors, pumps, fans, mixers, and other applications.'],
  ['GuardLogix','safety controller','A Logix controller with integrated functional safety','Runs safety logic with the hardware, task, network, and validation rules required by the safety architecture.'],
  ['POINT I/O','1734 distributed I/O','Compact modular remote I/O','Small modular digital, analog, specialty, and safety I/O placed near equipment and networked back to the controller.'],
  ['FLEX I/O','1794 distributed I/O','Modular remote I/O with broader point densities','Installed-base workhorse with digital, analog, HART, specialty, and multiple network adapter options.'],
  ['ControlNet','CIP network','Deterministic legacy industrial network','Used for time-critical I/O and peer data in older / installed systems.'],
  ['DeviceNet','CIP network','CAN-based field device network','Often encountered on older drives, starters, sensors, and distributed devices.'],
  ['Pilz / PNOZ','safety hardware','Safety relays and safety control products','Commonly used to monitor E-stops, guards, light curtains, and other safety functions.']
];

const terms = [
  // Control / software
  {n:'PLC',c:'Control',p:'An industrial computer that reads data, runs control logic, and commands outputs.',job:'The controller is where machine decisions live.',connect:'Inputs → controller logic → outputs.',watch:'A PLC can be healthy while a field device, network connection, output device, or safety condition prevents operation.',r:['ControlLogix','Ladder Logic','I/O']},
  {n:'ControlLogix',c:'Control',p:'Rockwell Automation’s chassis-based Logix controller platform.',job:'Common in large manufacturing systems for discrete control, process, drives, motion, and safety integration.',connect:'1756 chassis + controller + modules + networked devices.',watch:'Do not assume slot order or module types from another machine.',r:['Studio 5000','1756 Chassis','GuardLogix']},
  {n:'Studio 5000 Logix Designer',c:'Software',p:'The main software environment used to configure and program Logix controllers.',job:'Engineers go online, inspect tags, edit logic, configure I/O, trend values, and diagnose faults here.',connect:'Engineering workstation ↔ controller project ↔ physical control system.',watch:'Upload vs download direction matters: a download sends the project to the controller.',r:['Upload / Download','Tags','Tasks']},
  {n:'RSLogix',c:'Software',p:'Older Rockwell programming-software branding that still comes up constantly in plants.',job:'“RSLogix” may mean RSLogix 5/500 or older RSLogix 5000 depending on the controller generation.',connect:'Legacy vocabulary → current Studio 5000 environment.',watch:'Always identify the controller family and software version before assuming compatibility.',r:['Studio 5000 Logix Designer','PLC-5 / SLC','ControlLogix']},
  {n:'Tag',c:'Control',p:'A named piece of controller data: a bit, number, structure, array, I/O value, and more.',job:'Instead of memorizing raw addresses, engineers can work with names like Conveyor_12_RunCmd.',connect:'Logic reads/writes tags; I/O modules create module-defined tags.',watch:'Controller scope and program scope affect where data is visible.',r:['UDT','Alias Tag','I/O']},
  {n:'Task',c:'Control',p:'The scheduling layer that determines when a group of programs executes.',job:'Logix projects can use continuous, periodic, or event-driven task execution.',connect:'Task → Program → Routine.',watch:'Task rate, priority, watchdog, and overlap behavior matter in real applications.',r:['Program','Routine','Scan Time']},
  {n:'Program',c:'Control',p:'A container for related routines and program-scoped data inside a task.',job:'Engineers often group machine areas or functions into separate programs.',connect:'Task schedules programs; programs contain routines.',watch:'A program must be scheduled in a task to execute.',r:['Task','Routine','Program Scope']},
  {n:'Routine',c:'Control',p:'A block of executable controller code, such as ladder logic or structured text.',job:'Large applications are divided into manageable routines for motors, sequences, alarms, and functions.',connect:'Program → MainRoutine → called subroutines.',watch:'A routine that exists but is never called or scheduled does nothing.',r:['Ladder Logic','JSR','Structured Text']},
  {n:'Ladder Logic',c:'Control',p:'A graphical programming language modeled after relay-style electrical logic.',job:'Very common for discrete machine control, permissives, interlocks, sequences, and troubleshooting.',connect:'Conditions on the rung evaluate left-to-right into instructions that write results.',watch:'Visual “power flow” is a programming metaphor, not literal electricity inside the PLC.',r:['XIC','XIO','OTE']},
  {n:'XIC',c:'Control',p:'“Examine If Closed.” In Logix, the instruction is true when its referenced bit is 1.',job:'Used constantly to test conditions in ladder logic.',connect:'Tag bit → XIC condition → rung-condition result.',watch:'The symbol resembles a normally-open contact, but think in terms of the bit state, not just physical contact type.',r:['XIO','OTE','Ladder Logic']},
  {n:'XIO',c:'Control',p:'“Examine If Open.” In Logix, the instruction is true when its referenced bit is 0.',job:'Often used for NOT conditions, faults, or conditions that must be off.',connect:'Tag bit → inverted test → rung-condition result.',watch:'Do not confuse the instruction name with the physical wiring of a field device.',r:['XIC','OTE','Ladder Logic']},
  {n:'OTE',c:'Control',p:'“Output Energize.” A ladder output instruction that writes the current rung-condition result to a bit.',job:'Common for commands, internal state bits, and outputs.',connect:'Rung result → OTE → destination bit.',watch:'Execution order and multiple writes to the same tag can create confusing behavior.',r:['XIC','Latch / Unlatch','Output']},
  {n:'Interlock',c:'Control',p:'A condition that blocks an action because another condition makes that action undesirable or unsafe.',job:'Example: do not run a pump if a required valve is closed.',connect:'Command + interlocks/permissives → final run command.',watch:'“Interlock” and “permissive” naming conventions vary by plant.',r:['Permissive','Command vs Feedback','Sequence']},
  {n:'Permissive',c:'Control',p:'A condition that must be satisfied before an action is allowed.',job:'Operators may ask “what permissive are we missing?” when a motor refuses to start.',connect:'Multiple OK conditions are ANDed into an enable / ready state.',watch:'A permissive can be process logic, equipment status, or safety-related — verify its actual purpose.',r:['Interlock','Ready / Running / Faulted','Ladder Logic']},
  {n:'UDT',c:'Control',p:'User-Defined Data Type: a custom structure that groups related data into one repeatable shape.',job:'A motor UDT might contain commands, status, alarms, runtime, and configuration.',connect:'UDT definition → instances used throughout programs.',watch:'A clean UDT structure helps scale code; a bad one scales confusion.',r:['AOI','Tag','Structure']},
  {n:'AOI',c:'Control',p:'Add-On Instruction: reusable custom logic packaged like an instruction.',job:'Common for standardized motor, valve, device, or calculation logic.',connect:'Inputs / outputs / local tags wrapped into reusable instruction logic.',watch:'Always inspect revision and internal behavior before treating an AOI as a black box.',r:['UDT','Ladder Logic','Reusable Code']},
  {n:'Upload / Download',c:'Software',p:'Upload pulls the controller project/data toward the engineering workstation; download sends a project to the controller.',job:'Critical vocabulary before going online with production equipment.',connect:'Workstation ⇄ controller.',watch:'A mistaken download can overwrite controller logic/configuration. Site change-management procedures matter.',r:['Online / Offline','Studio 5000 Logix Designer','Controller Project']},
  {n:'Online / Offline',c:'Software',p:'Online means your software session is connected to a controller; offline means you are viewing a local project without that live connection.',job:'Online monitoring lets you see live tag values, faults, and logic states.',connect:'Laptop ↔ network path ↔ controller.',watch:'Seeing logic online does not mean it is safe to edit it.',r:['Upload / Download','Online Edit','Forces']},
  {n:'Force',c:'Software',p:'A controller feature that can override certain I/O or data behavior for testing and commissioning.',job:'Powerful for diagnostics — and dangerous if misunderstood.',connect:'Engineering action → controller force state → affected I/O behavior.',watch:'Forces can alter real equipment behavior. Follow site procedure and verify all forces are accounted for.',r:['Online / Offline','I/O','Commissioning']},

  // I/O + signals
  {n:'I/O',c:'Signals',p:'Input/Output: the hardware and data boundary between the controller and the real machine.',job:'Inputs report conditions; outputs command actuators.',connect:'Field device ↔ I/O module ↔ controller tags.',watch:'“The PLC sees it” means the signal made it through the electrical and I/O path into controller data.',r:['Digital I/O','Analog I/O','Remote I/O']},
  {n:'Digital Input',c:'Signals',p:'An input with discrete states — usually interpreted as ON/OFF, 1/0, true/false.',job:'Photoeyes, limit switches, pushbuttons, prox sensors, and status contacts often land here.',connect:'Field voltage/current → input channel → input tag.',watch:'Check wiring type, common reference, module voltage, and whether the field signal is actually present.',r:['24 VDC','Sourcing / Sinking','Input']},
  {n:'Digital Output',c:'Signals',p:'A controller-controlled discrete electrical output used to command a field device.',job:'Can operate relays, solenoids, contactors, indicator lights, and other loads through appropriate interfaces.',connect:'Output tag → output module → field load.',watch:'A controller bit can be ON while field voltage is missing because of wiring, fuse, module, interlock, or power issues.',r:['Relay','Solenoid','Contactor']},
  {n:'Analog I/O',c:'Signals',p:'I/O that represents a continuously varying value instead of just ON/OFF.',job:'Used for temperature, pressure, level, speed references, valve positions, and process measurements.',connect:'Physical quantity ↔ transmitter/signal ↔ analog channel ↔ scaled engineering value.',watch:'Signal type, range, scaling, grounding, and noise all matter.',r:['4–20 mA','0–10 V','Scaling']},
  {n:'4–20 mA',c:'Signals',p:'A current-loop signal where 4 mA commonly represents the low end and 20 mA the high end of a measurement range.',job:'Very common for industrial instrumentation.',connect:'Transmitter → current loop → analog input → scaled engineering units.',watch:'The exact fault behavior below/above normal range is device- and configuration-specific.',r:['Analog I/O','Transmitter','Scaling']},
  {n:'0–10 V',c:'Signals',p:'A voltage-based analog signal where voltage represents a continuous command or measurement.',job:'Common on speed references, actuators, sensors, and simpler analog devices.',connect:'Signal source → analog input/output → scaled value.',watch:'Voltage signals can be more susceptible to wiring drop/noise than current loops in some applications.',r:['Analog I/O','4–20 mA','Scaling']},
  {n:'Scaling',c:'Signals',p:'Converting raw I/O data into useful engineering units.',job:'Turns “raw counts” or milliamps into psi, °F, %, rpm, inches, and so on.',connect:'Raw module data → linearization / scaling → engineering tag.',watch:'Wrong min/max values can make a healthy transmitter look wrong.',r:['4–20 mA','Analog I/O','Engineering Units']},
  {n:'Sourcing / Sinking',c:'Signals',p:'Terms describing current direction and how DC inputs/outputs are wired relative to the supply and common.',job:'Critical when matching 24 VDC sensors to input cards and outputs to loads.',connect:'PNP/sourcing device typically supplies current toward the load; NPN/sinking device typically switches toward common.',watch:'Terminology is easy to reverse mentally. Always use the actual module/sensor wiring diagram.',r:['PNP / NPN','24 VDC','Digital Input']},
  {n:'PNP / NPN Sensor',c:'Signals',p:'Common transistor-output sensor types used in DC control systems.',job:'PNP is often called sourcing; NPN is often called sinking in industrial control conversations.',connect:'Sensor transistor output ↔ compatible input circuit.',watch:'Match sensor type, I/O wiring, common, and voltage — do not guess from wire color alone.',r:['Sourcing / Sinking','Photoeye','Proximity Sensor']},
  {n:'Photoeye',c:'Signals',p:'A photoelectric sensor that detects objects using emitted and received light.',job:'Used for product detection, counting, registration, presence, and jams.',connect:'Object interrupts/reflects light → sensor output → PLC input.',watch:'Alignment, lens contamination, teach settings, background reflections, and wiring can all cause false behavior.',r:['Digital Input','Proximity Sensor','Sensor']},
  {n:'Proximity Sensor',c:'Signals',p:'A non-contact sensor that detects nearby targets, often metal for inductive prox sensors.',job:'Common for cylinder position, machine position, presence, and mechanism confirmation.',connect:'Target enters sensing field → output changes → digital input.',watch:'Target material, sensing distance, mounting, and cable condition matter.',r:['Photoeye','Limit Switch','Digital Input']},
  {n:'Encoder',c:'Motion',p:'A feedback device that reports shaft or axis position and/or speed.',job:'Used in servo motion, conveyors, registration, speed measurement, and positioning.',connect:'Mechanical motion → encoder signal → drive/controller feedback.',watch:'Resolution, feedback type, wiring, direction, and reference/absolute behavior are system-specific.',r:['Servo Motor','Kinetix 5700','Feedback']},
  {n:'RTD',c:'Signals',p:'Resistance Temperature Detector: a temperature sensor whose resistance changes predictably with temperature.',job:'Common for process and equipment temperature measurement.',connect:'RTD element → specialty/analog input → temperature value.',watch:'2-, 3-, and 4-wire configurations compensate lead resistance differently.',r:['Thermocouple','Analog I/O','Temperature']},
  {n:'Thermocouple',c:'Signals',p:'A temperature sensor that generates a small voltage related to the temperature difference between dissimilar metals.',job:'Used across wide industrial temperature ranges.',connect:'Thermocouple → compatible input + cold-junction compensation → temperature.',watch:'Type (J, K, etc.), polarity, extension wire, and compensation matter.',r:['RTD','Analog I/O','Temperature']},

  // I/O hardware
  {n:'POINT I/O',c:'Hardware',p:'Rockwell Bulletin 1734 modular distributed I/O, including digital, analog, specialty, and safety modules.',job:'Often mounted near machine devices to reduce long runs back to the main panel.',connect:'Field devices → POINT I/O modules → network adapter → controller.',watch:'Adapter, terminal base, module family, power segmentation, and limits must match the design.',r:['Remote I/O','FLEX I/O','EtherNet/IP']},
  {n:'FLEX I/O',c:'Hardware',p:'Rockwell Bulletin 1794 modular distributed I/O family used widely in installed manufacturing systems.',job:'Supports digital, analog, HART, specialty modules and multiple communications adapters.',connect:'Field wiring → terminal base/module → adapter → controller network.',watch:'Older FLEX installations may use legacy networks as well as EtherNet/IP.',r:['POINT I/O','Remote I/O','ControlNet']},
  {n:'Remote I/O',c:'Hardware',p:'I/O physically located away from the main controller and connected over a communications network.',job:'Lets sensors and actuators terminate near the machine instead of running every wire back to a central rack.',connect:'Field devices → remote I/O station → industrial network → PLC.',watch:'A network/adapter failure can make many I/O points disappear at once.',r:['POINT I/O','FLEX I/O','EtherNet/IP']},
  {n:'1756 Chassis',c:'Hardware',p:'The ControlLogix backplane/chassis that provides slots and module-to-module communication.',job:'Holds controllers, communication modules, and I/O modules in chassis-based architectures.',connect:'Power supply + chassis/backplane + modules.',watch:'The controller is not required to be in a particular slot in standard ControlLogix architecture.',r:['ControlLogix','1756 I/O','Backplane']},
  {n:'Ethernet Module / Card',c:'Hardware',p:'A communication module or embedded interface that connects a controller/chassis to Ethernet networks.',job:'Used for I/O, peer controller data, drives, HMIs, programming access, motion, and more depending on platform.',connect:'Controller/backplane ↔ Ethernet interface ↔ switches/devices.',watch:'Link lights only prove some physical connectivity — not that I/O connections or IP configuration are healthy.',r:['EtherNet/IP','Managed Switch','IP Address']},

  // Networks
  {n:'EtherNet/IP',c:'Network',p:'An industrial network that uses standard Ethernet/TCP/IP technologies with CIP automation services.',job:'Carries I/O, control, configuration, diagnostics, safety, motion, and information across many modern systems.',connect:'CIP application services over Ethernet/IP networking.',watch:'A device can answer a ping and still have a broken CIP I/O connection.',r:['CIP','RPI','DLR']},
  {n:'CIP',c:'Network',p:'Common Industrial Protocol: the shared upper-layer industrial protocol used by EtherNet/IP, DeviceNet, and ControlNet.',job:'Defines industrial objects, messages, connections, device profiles, safety, motion, and more.',connect:'CIP services ride over different network adaptations.',watch:'EtherNet/IP, DeviceNet, and ControlNet share CIP concepts but use different lower-layer network technologies.',r:['EtherNet/IP','DeviceNet','ControlNet']},
  {n:'ControlNet',c:'Network',p:'A CIP network designed for deterministic, high-speed transport of time-critical I/O and peer interlocks.',job:'Important on legacy / installed Rockwell systems.',connect:'Controller and distributed devices over ControlNet media.',watch:'Do not treat its physical/network rules like ordinary Ethernet.',r:['CIP','DeviceNet','EtherNet/IP']},
  {n:'DeviceNet',c:'Network',p:'A CIP network built on CAN technology and commonly used for distributed field devices.',job:'Frequently encountered on older drives, motor starters, sensors, and I/O.',connect:'Trunk/drop network can carry communications and device power depending on design.',watch:'Power, termination, addressing, baud rate, and physical-layer health are key troubleshooting areas.',r:['CIP','ControlNet','EtherNet/IP']},
  {n:'RPI',c:'Network',p:'Requested Packet Interval: the configured update period for a Logix I/O connection.',job:'A major concept in how often networked I/O data is produced/consumed.',connect:'I/O module ↔ connection timing ↔ controller data.',watch:'Logix I/O updates can occur asynchronously to program logic execution.',r:['EtherNet/IP','I/O','Task']},
  {n:'DLR',c:'Network',p:'Device Level Ring: a ring topology supported by certain EtherNet/IP devices for network resiliency.',job:'Allows a supported ring to tolerate a single break while maintaining communications after reconvergence.',connect:'Dual-port devices form a ring with a ring supervisor.',watch:'A physical ring is not automatically a properly configured DLR network.',r:['EtherNet/IP','Managed Switch','Network Topology']},
  {n:'Managed Switch',c:'Network',p:'An Ethernet switch with configuration and diagnostics beyond basic unmanaged forwarding.',job:'Industrial managed switches can support VLANs, diagnostics, redundancy features, port mirroring, QoS, and more.',connect:'Network devices ↔ switch ports ↔ plant/control network.',watch:'A switch configuration problem can look like a controller problem.',r:['EtherNet/IP','VLAN','DLR']},
  {n:'IP Address',c:'Network',p:'A logical network address used by Ethernet/IP devices to communicate on an IP network.',job:'Controllers, HMIs, drives, I/O adapters, switches, and engineering PCs often need compatible addressing.',connect:'IP + subnet + routing determines reachability.',watch:'Duplicate addresses, wrong subnet masks, and unintended DHCP/BOOTP behavior are common commissioning issues.',r:['Subnet Mask','EtherNet/IP','Managed Switch']},

  // Drives/motion
  {n:'VFD',c:'Drives',p:'Variable-Frequency Drive: power electronics that control AC motor output rather than simply switching full line power.',job:'Used on conveyors, pumps, fans, mixers, rolls, and other variable-speed loads.',connect:'3-phase input → drive power stage → controlled motor output; control/network commands come separately.',watch:'Drive “ready,” “enabled,” “running,” command, reference, current, and fault status are separate concepts.',r:['PowerFlex','3-Phase Motor','STO']},
  {n:'PowerFlex',c:'Drives',p:'Rockwell Automation family of AC variable-frequency drives.',job:'Common motor-control platform in Rockwell-based manufacturing systems.',connect:'Power input + control/network + motor output + optional safety/feedback.',watch:'Parameters, firmware, option modules, motor data, and safety features vary by model.',r:['VFD','EtherNet/IP','Motor']},
  {n:'3-Phase Motor',c:'Power',p:'An AC motor designed to run from a three-phase power system.',job:'The workhorse behind pumps, fans, conveyors, rollers, mixers, and many machine loads.',connect:'Power source → protection/control → motor windings → mechanical load.',watch:'Voltage, current, frequency, phase balance, overload, mechanical load, and connection configuration all matter.',r:['VFD','Contactor','Overload Relay']},
  {n:'Servo Motor',c:'Motion',p:'A motor used in a closed-loop motion system with feedback for precise control.',job:'Used where position, velocity, synchronization, registration, or dynamic response matter.',connect:'Motion command → servo drive → motor → encoder feedback → control loop.',watch:'Servo tuning, mechanics, feedback, safety, limits, and motion programming interact.',r:['Kinetix 5700','Encoder','Position / Velocity / Torque']},
  {n:'Kinetix 5700',c:'Motion',p:'Rockwell high-performance servo drive family for multi-axis / higher-power machine applications.',job:'Integrated motion over EtherNet/IP with Logix control; supports integrated safety options on appropriate hardware.',connect:'Logix motion controller ↔ EtherNet/IP ↔ Kinetix drive ↔ motor/feedback.',watch:'Specific inverter, bus supply, motor, cable, safety, and firmware compatibility must be engineered.',r:['Servo Motor','EtherNet/IP','Kinetix 6000']},
  {n:'Kinetix 6000',c:'Motion',p:'An earlier Rockwell multi-axis servo drive platform commonly found in installed equipment.',job:'Important for engineers maintaining older Logix-integrated motion systems.',connect:'Logix controller + motion network/interface → Kinetix 6000 → servo motor.',watch:'Treat as a distinct legacy platform; do not assume 5700 hardware/network behavior applies.',r:['Kinetix 5700','Servo Motor','Legacy System']},
  {n:'Position / Velocity / Torque',c:'Motion',p:'Three core ways to think about servo motion: where the axis is, how fast it moves, and how much rotational force it produces.',job:'Motion problems often make more sense when you ask which of these variables is wrong.',connect:'Command ↔ control loop ↔ motor ↔ feedback.',watch:'Real servo loops can be nested and controller/drive terminology varies.',r:['Servo Motor','Encoder','Motion Profile']},
  {n:'Regeneration',c:'Motion',p:'Energy flowing back from a decelerating mechanical load rather than only from the supply into the motor.',job:'Important on high-inertia loads, rapid deceleration, web handling, hoists, and multi-axis systems.',connect:'Mechanical energy → motor acts as generator → DC bus → resistor or regenerative supply, depending on system.',watch:'DC-bus overvoltage during decel can be a symptom of insufficient energy handling.',r:['Kinetix 5700','Braking Resistor','DC Bus']},

  // Safety
  {n:'GuardLogix',c:'Safety',p:'Rockwell Logix-family controller architecture that integrates standard control and functional safety.',job:'Used to implement validated machine safety functions with safety I/O and safety-capable devices.',connect:'Safety inputs → safety task/logic → safety outputs / networked safety devices.',watch:'Safety integrity depends on the entire function, hardware, configuration, response time, validation, and change controls.',r:['CIP Safety','Safety I/O','Safety Signature']},
  {n:'Safety Relay',c:'Safety',p:'A safety-rated logic device designed to monitor certain safety functions with fault detection and defined safe behavior.',job:'Common for E-stops, safety gates, light curtains, and simpler machine safety architectures.',connect:'Safety input device → safety relay → safety outputs / contactors / drive safety inputs.',watch:'A normal control relay is not a substitute for a safety relay in a safety function.',r:['Pilz PNOZ','E-Stop','STO']},
  {n:'Pilz PNOZ',c:'Safety',p:'A well-known family of Pilz safety relays and safety control products.',job:'Frequently seen in machine panels monitoring E-stops, gates, light curtains, and other protective devices.',connect:'Safety sensors → PNOZ logic → safe outputs.',watch:'Product family includes different architectures; use the exact device manual and machine safety documentation.',r:['Safety Relay','E-Stop','Light Curtain']},
  {n:'E-Stop',c:'Safety',p:'Emergency-stop device: a human-operated safety input intended to initiate a defined emergency stop function.',job:'Used to reduce risk when a person recognizes an emergency condition.',connect:'E-stop device → safety input/logic → safe machine response.',watch:'It is not the same thing as a normal stop, power disconnect, or lockout/tagout energy isolation.',r:['Safety Relay','GuardLogix','STO']},
  {n:'STO',c:'Safety',p:'Safe Torque Off: a drive safety function that prevents torque-producing energy from being applied to the motor.',job:'Common in modern drives and servo systems as part of machine safety functions.',connect:'Safety logic → STO channels / integrated safety → drive torque disabled.',watch:'STO does not necessarily remove hazardous electrical energy from the drive or motor circuit and is not a servicing isolation method.',r:['VFD','Kinetix 5700','E-Stop']},
  {n:'Safety I/O',c:'Safety',p:'I/O designed and certified for use in functional-safety systems when applied according to its requirements.',job:'Connects safety sensors and actuators to safety controllers or safety networks.',connect:'Safety device → safety input module → safety logic → safety output module/device.',watch:'A standard I/O point carrying a copied status does not automatically become safety-rated data.',r:['GuardLogix','POINT Guard I/O','CIP Safety']},
  {n:'CIP Safety',c:'Safety',p:'The functional-safety extension of CIP used to exchange safety-related data over supported CIP networks.',job:'Enables networked safety devices and safety controllers to share safety data over EtherNet/IP and other supported CIP networks.',connect:'Safety producer ↔ network transport ↔ safety consumer with safety protocol protections.',watch:'The network cable itself is not “safety rated”; the safety protocol and certified devices implement the safety communications measures.',r:['GuardLogix','EtherNet/IP','Safety I/O']},
  {n:'Safety Signature',c:'Safety',p:'A generated identifier used in GuardLogix workflows to help verify a validated safety configuration has not changed.',job:'Part of safety application validation/change-control practices.',connect:'Validated safety project/configuration → signature → comparison/record.',watch:'Generating a signature is not a substitute for the required system validation process.',r:['GuardLogix','Validation','Safety Task']},
  {n:'Lockout / Tagout',c:'Safety',p:'An energy-control process used during servicing/maintenance to control hazardous energy and prevent unexpected energization or release.',job:'Fundamental manufacturing safety concept for qualified/authorized work under site procedures.',connect:'Identify energy → isolate → lock/tag → address stored energy → verify isolation, according to the employer’s program.',watch:'This site is not a LOTO procedure. OSHA requirements and the employer’s equipment-specific program/procedure govern.',r:['Disconnect','Stored Energy','STO']},

  // panel/power
  {n:'Disconnect',c:'Power',p:'A device used to disconnect equipment from an electrical energy source.',job:'Often the main visible isolation handle on a control panel or machine.',connect:'Incoming supply → disconnect → downstream distribution.',watch:'A disconnect position alone does not prove absence of voltage; follow qualified electrical work and energy-control procedures.',r:['Lockout / Tagout','Circuit Breaker','Control Panel']},
  {n:'Circuit Breaker',c:'Power',p:'A protective switching device that opens a circuit under certain overcurrent conditions and can be reset.',job:'Protects conductors/equipment according to the circuit design and device ratings.',connect:'Source → breaker → branch circuit/load.',watch:'Breaker protection is not the same function as motor overload protection.',r:['Fuse','Overload Relay','Disconnect']},
  {n:'Fuse',c:'Power',p:'A sacrificial overcurrent-protection device that opens when its element melts under excessive current.',job:'Common in control transformers, drives, branch circuits, and semiconductor protection depending on design.',connect:'Source → fuse → protected circuit.',watch:'Replace only with the specified type/rating; “same amps” does not guarantee equivalence.',r:['Circuit Breaker','Overcurrent Protection','Control Transformer']},
  {n:'Contactor',c:'Power',p:'An electrically operated power switch designed to repeatedly connect and disconnect a load.',job:'Common for motors, heaters, and other controlled power loads.',connect:'Control coil → main power contacts → load.',watch:'A contactor can be commanded ON but fail mechanically/electrically, or have power missing upstream.',r:['Motor Starter','Overload Relay','Relay']},
  {n:'Overload Relay',c:'Power',p:'A protective device intended to protect a motor from sustained overload conditions.',job:'Often part of a motor starter and commonly provides an auxiliary status contact back to controls.',connect:'Motor current path + overload sensing → trip mechanism / auxiliary status.',watch:'It serves a different protection purpose from branch-circuit short-circuit/ground-fault protection.',r:['Contactor','Motor Starter','3-Phase Motor']},
  {n:'24 VDC Power Supply',c:'Power',p:'A power supply that converts incoming AC to 24 VDC for many industrial control circuits.',job:'Feeds PLC/I/O circuits, sensors, relays, valves, network devices, and control electronics as designed.',connect:'AC source → DC power supply → +24 V / 0 V distribution.',watch:'One failed or overloaded 24 V supply can make many unrelated-looking devices fail at once.',r:['Digital Input','Sourcing / Sinking','Control Panel']},
  {n:'Control Transformer',c:'Power',p:'A transformer used to create a lower control voltage from a higher AC system voltage.',job:'Often supplies 120 VAC or other control voltages in legacy and modern panels.',connect:'Primary voltage → transformer → secondary control circuit.',watch:'Primary and secondary protection, grounding, and voltage ratings are design-specific.',r:['Transformer','Fuse','24 VDC Power Supply']},
  {n:'Terminal Block',c:'Panel',p:'A structured connection point that joins field wiring to panel wiring.',job:'Makes large control panels serviceable and helps drawings map wires to physical terminals.',connect:'Field cable → terminal strip → internal device/I/O wiring.',watch:'Loose terminals, jumpers, blown fused terminals, and wrong terminal numbers are common field issues.',r:['Electrical Drawing','Wire Number','Control Panel']},
  {n:'DIN Rail',c:'Panel',p:'A standardized metal rail used to mount many control-panel components.',job:'Holds terminal blocks, relays, power supplies, breakers, safety relays, and other modular devices.',connect:'Mechanical mounting infrastructure inside the cabinet.',watch:'DIN rail is not itself a functional device; bonding/grounding use depends on the panel design.',r:['Terminal Block','Relay','Control Panel']},
  {n:'Control Panel',c:'Panel',p:'An enclosure containing electrical/control equipment for a machine or process.',job:'The place where power distribution, control, safety, drives, networking, and field wiring converge.',connect:'Incoming power + field cables + network links → organized internal hardware.',watch:'A closed panel can contain hazardous voltage and stored energy; access rules matter.',r:['Disconnect','PLC Rack','Terminal Block']},

  // drawings/troubleshooting
  {n:'Electrical Schematic',c:'Drawings',p:'A functional drawing that shows how electrical devices and contacts connect logically.',job:'Best starting point for tracing why a coil, output, motor, or safety circuit is not operating.',connect:'Power rail/source → conditions/devices → load/coil → cross references.',watch:'The schematic is logical; panel layout drawings tell you where the physical part is.',r:['Ladder Diagram','Wire Number','Panel Layout']},
  {n:'One-Line Diagram',c:'Drawings',p:'A simplified representation of major power distribution using one line to represent multi-conductor power paths.',job:'Useful for understanding where power comes from, transformers, switchgear, breakers, and major loads.',connect:'Source → distribution → transformation → major loads.',watch:'It intentionally omits much of the control-level wiring detail.',r:['Electrical Schematic','Power Distribution','Transformer']},
  {n:'Panel Layout',c:'Drawings',p:'A drawing showing where components are physically located inside an enclosure.',job:'Turns a schematic device tag into something you can actually find in a cabinet.',connect:'Drawing reference designator ↔ physical component location.',watch:'Field modifications may not always be reflected in old drawings; controlled documentation matters.',r:['Electrical Schematic','Terminal Block','Control Panel']},
  {n:'Wire Number',c:'Drawings',p:'An identifier printed on a conductor and shown on electrical drawings to make circuits traceable.',job:'Lets you follow one electrical node across a crowded panel and between pages/terminals.',connect:'Drawing net/wire ID ↔ physical labeled conductor.',watch:'Site drawing conventions vary; never infer voltage only from a wire number.',r:['Terminal Block','Electrical Schematic','Cross Reference']},
  {n:'Command vs Feedback',c:'Troubleshooting',p:'Command is what the controller wants; feedback/status is what the device reports actually happened.',job:'One of the fastest ways to narrow a fault: “Did we ask it to run? Did it actually run?”',connect:'Logic command → output/device → physical action → feedback/status input.',watch:'A command bit ON does not prove output voltage, device enable, network health, or motion.',r:['Interlock','Permissive','Ready / Running / Faulted']},
  {n:'Ready / Running / Faulted',c:'Troubleshooting',p:'Three different states that are often confused: able to operate, actively operating, or reporting a problem.',job:'Drives and equipment frequently expose all three as separate status signals.',connect:'Device diagnostics/status → controller → HMI / logic.',watch:'“Not running” does not automatically mean “faulted.” It may simply lack a command or permissive.',r:['Command vs Feedback','VFD','Interlock']},
  {n:'Fault',c:'Troubleshooting',p:'A device or system condition indicating something has violated its expected operating requirements.',job:'Fault codes are evidence — not a complete diagnosis.',connect:'Device detects condition → status/code → controller/HMI/diagnostics.',watch:'Always distinguish root cause from downstream symptoms and secondary faults.',r:['Alarm','Ready / Running / Faulted','Diagnostics']},
  {n:'Alarm',c:'Troubleshooting',p:'A message or condition intended to draw attention to an abnormal or important state.',job:'Operators see alarms; engineers trace the tags, conditions, and equipment behind them.',connect:'Condition → alarm logic → HMI / historian / notification.',watch:'An alarm can be poorly worded or caused by another upstream failure. Trace the actual condition.',r:['Fault','HMI','Diagnostics']}
];

const drawingSymbols = [
  ['NO Contact','Condition / contact shown open in normal reference state'],['NC Contact','Condition / contact shown closed in normal reference state'],['Relay Coil','Electromagnetic or logical coil / output'],['Motor','Rotating electrical load'],['Fuse','Overcurrent protection, replace after operation'],['Circuit Breaker','Resettable overcurrent protective device'],['Transformer','Changes AC voltage / isolation depending on design'],['Ground / PE','Protective earth / grounding symbol context'],['Terminal','Field/panel connection point']
];

const trouble = [
  ['01','Define the symptom','“Conveyor 4 won’t run” is better than “machine is broken.”','OBSERVE'],
  ['02','Find the command','Is the PLC/HMI actually asking the device to operate?','CONTROL'],
  ['03','Trace permissives','Which condition is preventing the command from becoming true?','LOGIC'],
  ['04','Check device state','Ready? Enabled? Faulted? Network connected? Safety satisfied?','STATUS'],
  ['05','Compare command to feedback','Command ON + no feedback means the problem is likely downstream of the command.','NARROW'],
  ['06','Trace the physical path','Output → wire → terminal → interface → device → load. Use drawings and qualified procedures.','FIELD'],
  ['07','Look upstream for the root cause','One missing 24 V supply or network adapter can create many “random” symptoms.','SYSTEM']
];

const sourceLinks = [
  ['Rockwell — Studio 5000 Logix Designer online help','https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/38-01/contents-ditamap/studio-5000-logix-designer.html'],
  ['Rockwell — ControlLogix 5580 system','https://www.rockwellautomation.com/en-us/docs/technical/logix5000/_online/1756-um543/controllogix-5580-and-guardlogix-5580-controllers-/controllogix-and-guardlogix-systems/controllogix-system.html'],
  ['Rockwell — Logix I/O and tag data','https://literature.rockwellautomation.com/idc/groups/literature/documents/pm/1756-pm004_-en-p.pdf'],
  ['Rockwell — POINT I/O','https://www.rockwellautomation.com/en-us/products/hardware/i-o/1734-point-i-o.html'],
  ['Rockwell — FLEX I/O documentation','https://www.rockwellautomation.com/en-us/support/documentation/technical/i-o/1794-flex-i-o-modules.html'],
  ['Rockwell — PowerFlex 755','https://www.rockwellautomation.com/en-us/products/hardware/vfds-variable-frequency-drives/powerflex-755.html'],
  ['Rockwell — Kinetix 5700','https://www.rockwellautomation.com/en-us/products/hardware/motion-control/kinetix-5700.html'],
  ['Rockwell — ControlLogix / GuardLogix 5580','https://www.rockwellautomation.com/en-us/products/hardware/programmable-controllers/1756controllogix5580.html.html'],
  ['ODVA — EtherNet/IP','https://www.odva.org/technology-standards/key-technologies/ethernet-ip/'],
  ['ODVA — DeviceNet','https://www.odva.org/technology-standards/key-technologies/devicenet/'],
  ['ODVA — ControlNet','https://www.odva.org/technology-standards/other-technologies/controlnet/'],
  ['Pilz — Function of a safety relay','https://www.pilz.com/en-INT/support/lexicon/articles/072106'],
  ['OSHA — Control of hazardous energy (LOTO), 29 CFR 1910.147','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147']
];

let currentFilter='All';
let fieldMode=false;

function renderLayer(name='signal'){
  const d=layerData[name];
  $('#layerStage').innerHTML=`<div class="layer-diagram" style="--flow-color:${d.color}"><div class="layer-summary"><div><small>${d.label}</small><h3>${d.title}</h3><p>${d.desc}</p></div><div class="mental-model">MENTAL MODEL / NOT A WIRING DIAGRAM</div></div><div class="flow-track">${d.nodes.map((n,i)=>`<div class="flow-node ${i===2?'hot':''}"><div><div class="icon">${n[0]}</div><strong>${n[1]}</strong><span>${n[2]}</span></div></div>`).join('')}</div><div class="layer-notes">${d.notes.map(n=>`<div class="layer-note"><small>${n[0]}</small><p>${n[1]}</p></div>`).join('')}</div></div>`;
}

function renderLab(name='ladder'){
  $('#labStage').innerHTML=labs[name]();
  setupLab(name);
}

function setupLab(name){
  if(name==='ladder'){
    const st={stop:true,overload:true,start:false,motor:false};
    const scan=()=>{
      st.motor=st.stop&&st.overload&&(st.start||st.motor);
      const b=st.stop, c=b&&st.overload, top=c&&st.start, bot=c&&st.motor;
      const pw={a:true,b,c,top,bot,out:st.motor};
      $$('.ladder-svg [data-seg]').forEach(el=>el.classList.toggle('live',!!pw[el.dataset.seg]));
      const on={stop:st.stop,overload:st.overload,start:st.start,seal:st.motor,coil:st.motor};
      $$('.ladder-svg [data-c]').forEach(el=>el.classList.toggle('live',!!on[el.dataset.c]));
      $('#logicResult').classList.toggle('on',st.motor);$('#logicResult').textContent=`Motor_Cmd = ${st.motor?1:0}`;$('#motorFan').classList.toggle('on',st.motor);
      $('#ladderNote').innerHTML=!st.stop?'<b>Stop_OK</b> is open — the rung is broken and the seal drops out.':!st.overload?'<b>Overload_OK</b> is open — a tripped overload stops the motor.':st.start?'Start is held — power flows through the <b>top</b> branch.':st.motor?'Start released — the motor keeps running through the <b>seal-in</b> branch.':'Motor stopped. Hold <b>Start_PB</b> to start it.';
    };
    $$('.io-toggle').forEach(btn=>{const k=btn.dataset.io;
      if(btn.classList.contains('momentary')){
        const set=v=>{st.start=v;btn.classList.toggle('on',v);btn.setAttribute('aria-pressed',String(v));scan();};
        btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture?.(e.pointerId);set(true);});
        ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>btn.addEventListener(ev,()=>{if(st.start)set(false);}));
        btn.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();set(true);}});
        btn.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')set(false);});
      } else btn.onclick=()=>{st[k]=!st[k];btn.classList.toggle('on',st[k]);btn.setAttribute('aria-pressed',String(st[k]));scan();};
    });
    scan();
  }
  if(name==='rack'){
    const info=[
      ['Slot 0','Controller','The controller runs tasks, programs, and routines and exchanges data with local and networked modules.'],
      ['Slot 1','Ethernet module','A communications module links the chassis/backplane to an EtherNet/IP network. Modern controllers may also have embedded Ethernet.'],
      ['Slot 2','Digital input','Reads ON/OFF field signals such as sensors and status contacts.'],
      ['Slot 3','Digital output','Commands ON/OFF field loads through the appropriate output circuit/interface.'],
      ['Slot 4','Analog input','Reads continuously varying signals such as 4–20 mA and converts them into controller data.'],
      ['Slot 5','Spare slot','Real systems often reserve physical capacity for future modules — but the actual design varies.'],
      ['Slot 6','Specialty module','ControlLogix supports many module types, including specialty I/O and communications.']
    ];
    $$('.rack-module').forEach((m,i)=>m.onclick=()=>{ $$('.rack-module').forEach(x=>x.classList.remove('active'));m.classList.add('active');$('#rackInfo').innerHTML=`<div class="lab-kicker">CONTROLLOGIX / CHASSIS</div><h3>${info[i][0]}<br>${info[i][1]}</h3><p>${info[i][2]}</p><div class="lab-facts"><div class="lab-fact"><small>KEY IDEA</small><p>The backplane lets modules exchange data and receive chassis power. Module catalog numbers and exact placement come from the real design.</p></div><div class="lab-fact"><small>NOT A TEMPLATE</small><p>This visualization is an orientation tool, not a recommended rack configuration.</p></div></div>`;});
  }
  if(name==='vfd'){
    $('#vfdRange').oninput=e=>{const v=+e.target.value,p=v/60*100;$('#vfdHz').textContent=`${v.toFixed(1)} Hz`;$('#vfdPct').textContent=`${Math.round(p)}%`;$('#vfdGauge').style.setProperty('--pct',p)};
  }
  if(name==='servo'){
    $('#servoRange').oninput=e=>{const v=+e.target.value;$('#servoPuck').style.setProperty('--servo-pos',v);$('#servoValue').textContent=`${v}%`};
  }
  if(name==='analog'){
    $('#maRange').oninput=e=>{const v=+e.target.value;const ma=4+(v/100)*16;$('#tankWater').style.setProperty('--level',v);$('#maValue').innerHTML=`${ma.toFixed(2)} <span>mA</span>`;$('#maBar').style.setProperty('--signal-pct',`${v}%`);$('#maText').textContent=`${v}% process level → ${ma.toFixed(2)} mA. In this demo, 4 mA represents 0% and 20 mA represents 100%.`;};
  }
  if(name==='safety'){
    let tripped=false;$('#tripSafety').onclick=()=>{tripped=!tripped;$('#tripSafety').textContent=tripped?'Reset demo':'Simulate E-stop';$('#safeStatus').textContent=tripped?'Safety demand → safe output requested':'Safety chain healthy';$('#safeStatus').classList.toggle('trip',tripped);$$('.safe-box').forEach((b,i)=>b.style.opacity=tripped&&i===3?'.42':'1')};
  }
}

function renderPaths(){
  $('#pathRail').innerHTML=paths.map((p,i)=>`
    <button class="path-card" data-path="${i}">
      <div class="path-card-top"><span class="path-num">${String(i+1).padStart(2,'0')}</span><span class="path-arrow">↗</span></div>
      <h3>${p.n.replace(/^\d+\.\s*/,'')}</h3>
      <p class="path-idea">${p.idea}</p>
      <div class="path-can"><small>AFTER THIS, YOU SHOULD BE ABLE TO</small><p>${p.can}</p></div>
      <div class="path-topics">${p.topics.map(t=>`<span>${t}</span>`).join('')}</div>
    </button>`).join('');
  $$('.path-card').forEach((r,i)=>r.onclick=()=>{
    const p=paths[i];
    openInfo({
      n:p.n,
      c:'Learning Path',
      p:p.idea,
      job:p.can,
      connect:`Start by tracing: ${p.start}.`,
      watch:'You do not need to memorize every catalog number. The goal is to know what kind of thing you are looking at, what goes into it, what comes out of it, and where to look next.',
      r:p.topics
    });
  });
}

function renderDecoder(){
  $('#decoderBoard').innerHTML=decoder.map(d=>`<div class="decode-row"><div class="product">${d[0]}<small>${d[1]}</small></div><div class="equals">=</div><div class="meaning"><b>${d[2]}</b><p>${d[3]}</p></div></div>`).join('');
}

function symbolSvg(name){
  const base=(inner)=>`<svg viewBox="0 0 80 50" aria-hidden="true">${inner}</svg>`;
  if(name==='NO Contact') return base(`<path d="M0 25h22m36 0h22M22 8v34M58 8v34" stroke="currentColor" stroke-width="2" fill="none"/>`);
  if(name==='NC Contact') return base(`<path d="M0 25h22m36 0h22M22 8v34M58 8v34M25 38L55 12" stroke="currentColor" stroke-width="2" fill="none"/>`);
  if(name==='Relay Coil') return base(`<path d="M0 25h20m40 0h20M31 8Q20 25 31 42M49 8Q60 25 49 42" stroke="currentColor" stroke-width="2" fill="none"/>`);
  if(name==='Motor') return base(`<path d="M0 25h17m46 0h17" stroke="currentColor" stroke-width="2"/><circle cx="40" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="2"/><text x="40" y="30" text-anchor="middle" font-size="14" font-weight="800">M</text>`);
  if(name==='Fuse') return base(`<path d="M0 25h20m40 0h20" stroke="currentColor" stroke-width="2"/><rect x="20" y="16" width="40" height="18" fill="none" stroke="currentColor" stroke-width="2"/>`);
  if(name==='Circuit Breaker') return base(`<path d="M0 25h24m32 0h24M24 38L55 12" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="24" cy="25" r="2"/><circle cx="56" cy="25" r="2"/>`);
  if(name==='Transformer') return base(`<path d="M0 25h18m44 0h18M29 7q-12 8 0 16q-12 8 0 16M51 7q12 8 0 16q12 8 0 16" stroke="currentColor" stroke-width="2" fill="none"/>`);
  if(name==='Ground / PE') return base(`<path d="M40 2v22M22 25h36M28 32h24M34 39h12" stroke="currentColor" stroke-width="2" fill="none"/>`);
  return base(`<path d="M0 25h32m16 0h32" stroke="currentColor" stroke-width="2"/><circle cx="40" cy="25" r="8" fill="none" stroke="currentColor" stroke-width="2"/>`);
}

/* An across-the-line (DOL) motor starter, drawn the way a real set is: power section on the left, control ladder on the right,
   line numbers, wire numbers and a coil cross-reference. Picking a symbol in the tray lights every place it appears. */
const SYMBOL_WHERE={
  'NO Contact':['s-no','START pushbutton (line 11), the M seal-in contact (line 12), the RUN-light contact (line 13) and the three M power contacts.'],
  'NC Contact':['s-nc','STOP pushbutton (line 11) and the overload contact OL (line 11) — both break the circuit when they open.'],
  'Relay Coil':['s-coil','The M contactor coil (line 11). The cross-reference under it — “12 · 13” — lists the lines where its auxiliary contacts sit; its main contacts are in the power section.'],
  'Motor':['s-motor','MTR1, the three-phase motor at the bottom of the power section.'],
  'Fuse':['s-fuse','FU1 and FU2 protect the control transformer primary; FU3 protects the 120 V control circuit.'],
  'Circuit Breaker':['s-cb','CB1, the three-pole main breaker — the linked dashed line means all poles open together.'],
  'Transformer':['s-xfmr','CT1 steps 480 V line voltage down to 120 V for the control circuit.'],
  'Ground / PE':['s-gnd','The motor frame ground and the grounded X2 side of the control transformer.'],
  'Terminal':['s-term','Terminal points T1–T3 where field wiring to the motor lands.']
};
function starterSvg(){
  const nc=(x,y,l,t)=>`<g class="sym s-nc"><path d="M${x-26} ${y}H${x-10} M${x-10} ${y-12}V${y+12} M${x+10} ${y-12}V${y+12} M${x+10} ${y}H${x+26} M${x-14} ${y+14} L${x+14} ${y-14}"/><text x="${x}" y="${y-20}">${l}</text>${t?`<text class="sub" x="${x}" y="${y+28}">${t}</text>`:''}</g>`;
  const no=(x,y,l,t)=>`<g class="sym s-no"><path d="M${x-26} ${y}H${x-10} M${x-10} ${y-12}V${y+12} M${x+10} ${y-12}V${y+12} M${x+10} ${y}H${x+26}"/><text x="${x}" y="${y-20}">${l}</text>${t?`<text class="sub" x="${x}" y="${y+28}">${t}</text>`:''}</g>`;
  const pbNO=(x,y,l,t)=>`<g class="sym s-no"><path d="M${x-30} ${y}H${x-14} M${x+14} ${y}H${x+30} M${x-18} ${y-10}H${x+18} M${x} ${y-10}V${y-24}"/><circle cx="${x-14}" cy="${y}" r="3"/><circle cx="${x+14}" cy="${y}" r="3"/><text x="${x}" y="${y-30}">${l}</text><text class="sub" x="${x}" y="${y+22}">${t}</text></g>`;
  const pbNC=(x,y,l,t)=>`<g class="sym s-nc"><path d="M${x-30} ${y}H${x-14} M${x+14} ${y}H${x+30} M${x-18} ${y+5}H${x+18} M${x} ${y+5}V${y-22}"/><circle cx="${x-14}" cy="${y}" r="3"/><circle cx="${x+14}" cy="${y}" r="3"/><text x="${x}" y="${y-28}">${l}</text><text class="sub" x="${x}" y="${y+22}">${t}</text></g>`;
  const pole=(x)=>`<path d="M${x} 58V92"/><circle cx="${x}" cy="94" r="3"/><path d="M${x} 96L${x+14} 118"/><circle cx="${x}" cy="124" r="3"/><path d="M${x} 127V172"/>`;
  const mc=(x)=>`<path d="M${x-11} 178H${x+11} M${x-11} 192H${x+11} M${x} 172V178 M${x} 192V214"/>`;
  const ol=(x)=>`<path d="M${x} 214V226 q12 6 0 12 q-12 6 0 12 V262"/>`;
  return `<svg class="starter" viewBox="0 0 960 520" role="img" aria-label="Across-the-line motor starter schematic">
  <g class="lbl-top"><text x="80" y="44">L1</text><text x="130" y="44">L2</text><text x="180" y="44">L3</text><text x="206" y="44" class="sub" text-anchor="start">480 V · 3φ · 60 Hz</text></g>
  <g class="sym s-cb">${pole(80)}${pole(130)}${pole(180)}<path class="link" d="M76 108H194"/><text x="222" y="112">CB1</text></g>
  <g class="wire"><path d="M80 140H250 M130 156H250"/><circle class="dot" cx="80" cy="140" r="3.5"/><circle class="dot" cx="130" cy="156" r="3.5"/></g>
  <g class="sym s-fuse"><rect x="250" y="134" width="30" height="12"/><rect x="250" y="150" width="30" height="12"/><path d="M280 140H300 M280 156H300"/><text x="265" y="128">FU1</text><text x="265" y="176">FU2</text></g>
  <g class="sym s-xfmr"><path d="M300 140q10 4 0 8q10 4 0 8M300 140V132 M300 156V164 M312 128V168 M316 128V168 M328 140q-10 4 0 8q-10 4 0 8 M328 140V132H350 M328 156V164H350"/><text x="314" y="120">CT1</text><text class="sub" x="314" y="186">480 : 120 V</text></g>
  <g class="sym s-fuse"><rect x="360" y="126" width="30" height="12"/><path d="M350 132H360 M390 132H420"/><text x="375" y="118">FU3</text></g>
  <g class="wire"><path d="M350 164H900"/></g>
  <g class="sym s-no">${mc(80)}${mc(130)}${mc(180)}<text x="210" y="190">M</text><text class="xref" x="210" y="204">main</text></g>
  <g class="sym s-ol">${ol(80)}${ol(130)}${ol(180)}<text x="214" y="238">OL</text><text class="xref" x="214" y="251">heaters</text></g>
  <g class="sym s-term"><circle cx="80" cy="268" r="4"/><circle cx="130" cy="268" r="4"/><circle cx="180" cy="268" r="4"/><text x="90" y="290" class="sub" text-anchor="start">T1</text><text x="140" y="290" class="sub" text-anchor="start">T2</text><text x="190" y="290" class="sub" text-anchor="start">T3</text></g>
  <g class="wire"><path d="M80 272V300L110 332 M130 272V326 M180 272V300L150 332"/></g>
  <g class="sym s-motor"><circle cx="130" cy="362" r="34"/><text x="130" y="360" class="big">M</text><text x="130" y="378" class="sub">3~</text><text x="130" y="418">MTR1</text></g>
  <g class="sym s-gnd"><path d="M164 368H196V384 M184 384H208 M188 390H204 M192 396H200"/></g>
  <g class="rail"><path d="M420 132V420 M900 164V420"/><text x="420" y="118" class="sub">X1</text><text x="900" y="150" class="sub">X2</text></g>
  <g class="sym s-gnd"><path d="M900 164V150 M900 150H930V160 M920 160H940 M924 166H936 M928 172H932"/></g>
  <g class="lines"><text x="396" y="224">11</text><text x="396" y="284">12</text><text x="396" y="354">13</text></g>
  <g class="wire"><path d="M420 220H444 M504 220H536 M596 220H700 M760 220H792 M840 220H900 M520 220V280H536 M596 280H612V220 M420 350H536 M596 350H700 M760 350H900"/><circle class="dot" cx="520" cy="220" r="3.5"/><circle class="dot" cx="612" cy="220" r="3.5"/><circle class="dot" cx="420" cy="220" r="3.5"/><circle class="dot" cx="420" cy="350" r="3.5"/><circle class="dot" cx="900" cy="220" r="3.5"/><circle class="dot" cx="900" cy="350" r="3.5"/></g>
  <g class="wn"><text x="522" y="212">2</text><text x="648" y="212">3</text><text x="776" y="212">4</text></g>
  ${pbNC(474,220,'STOP','PB1')}${pbNO(566,220,'START','PB2')}${no(566,280,'M','seal-in')}${no(566,350,'M','')}
  <g class="sym s-coil"><circle cx="730" cy="220" r="22"/><text x="730" y="226" class="big">M</text><text class="xref" x="730" y="260">12 · 13</text></g>
  ${nc(816,220,'OL','')}
  <g class="sym lamp"><circle cx="730" cy="350" r="18"/><path d="M718 338L742 362 M742 338L718 362"/><text x="730" y="386" class="sub">RUN · G</text></g>
</svg>`;
}
function renderDrawing(symbol='NO Contact'){
  const index=drawingSymbols.findIndex(s=>s[0]===symbol); const s=drawingSymbols[index<0?0:index];
  const [cls,where]=SYMBOL_WHERE[s[0]]||['',''];
  $('#drawingCanvas').innerHTML=`<div class="blueprint starter-sheet"><div class="bp-title"><span>MOTOR STARTER — ACROSS THE LINE</span><span>SHEET 1 / 1</span></div><div class="starter-wrap" data-sel="${cls}">${starterSvg()}</div><div class="bp-where"><b>${esc(s[0])}</b><span>${esc(where)}</span></div><div class="bp-footer"><b>TRAINING DRAWING</b><span>NOT FOR CONSTRUCTION</span><span>SELECTED:</span><b>${esc(s[0])}</b></div></div>`;
  $$('#drawingCanvas .sym').forEach(g=>g.classList.toggle('hl',!!cls&&g.classList.contains(cls)));
  $('#symbolTray').innerHTML=`<h3>SYMBOL TRAY</h3>${drawingSymbols.map((x,i)=>`<button class="symbol-card ${x[0]===s[0]?'active':''}" data-symbol="${esc(x[0])}"><span class="sc-icon" aria-hidden="true">${symbolSvg(x[0])}</span><b>${x[0]}</b><small>${x[1]}</small></button>`).join('')}`;
  $$('.symbol-card').forEach(b=>b.onclick=()=>renderDrawing(b.dataset.symbol));
}

function renderFilters(){
  const cats=['All',...new Set(terms.map(t=>t.c))];
  $('#filterRow').innerHTML=cats.map(c=>`<button class="${c===currentFilter?'active':''}" data-filter="${c}">${c}</button>`).join('');
  $$('#filterRow button').forEach(b=>b.onclick=()=>{currentFilter=b.dataset.filter;renderFilters();renderTerms()});
}

function renderTerms(){
  const q=$('#termSearch').value.trim().toLowerCase();
  const list=terms.filter(t=>(currentFilter==='All'||t.c===currentFilter)&&(!q||[t.n,t.c,t.p,t.job,...t.r].join(' ').toLowerCase().includes(q)));
  $('#termCount').textContent=`${list.length} OF ${terms.length} TERMS`;
  $('#termGrid').innerHTML=list.map((t)=>`<article class="term-card" tabindex="0" data-term="${esc(t.n)}"><span class="cat">${t.c}</span><h3>${t.n}</h3><p>${t.p}</p><div class="term-job"><b>ON THE JOB</b><span>${t.job}</span></div><span class="arrow">↗</span></article>`).join('') || `<div class="term-card"><h3>No matches.</h3><p>Try a broader term or choose “All.”</p></div>`;
  $$('.term-card[data-term]').forEach(c=>{const open=()=>openInfo(terms.find(t=>t.n===c.dataset.term));c.onclick=open;c.onkeydown=e=>{if(e.key==='Enter')open()}});
}

function openInfo(t){
  $('#modalBody').innerHTML=`<div class="modal-content"><span class="cat">${esc(t.c)} / PLAIN ENGLISH</span><h2>${esc(t.n)}</h2><p class="plain">${esc(t.p)}</p><div class="term-explain"><div class="modal-section"><b>WHY YOU CARE</b><p>${esc(t.job)}</p></div><div class="modal-section"><b>PICTURE THE CONNECTION</b><p>${esc(t.connect)}</p></div><div class="modal-section wide"><b>THE PART THAT SAVES YOU FROM LEARNING IT WRONG</b><p>${esc(t.watch)}</p></div></div><div class="modal-tags">${(t.r||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>`;
  $('#infoModal').showModal();
}

function openQuickStart(){
  $('#modalBody').innerHTML=`<div class="modal-content"><span class="cat">START AT ABSOLUTE ZERO</span><h2>What is an industrial electrical engineer actually looking at?</h2><p class="plain">Think of a machine like a body. <b>Power is the energy, sensors are the senses, the PLC is the decision-maker, outputs and drives are the muscles, networks are the nerves, and feedback tells the system whether the thing it commanded really happened.</b> Safety is a separate layer whose job is to reduce risk when something dangerous happens.</p><div class="modal-sections"><div class="modal-section"><b>1 / POWER</b><p>Electricity arrives at useful voltage levels and is distributed to controls and loads. A motor may use 480 VAC while sensors and PLC I/O often use 24 VDC.</p></div><div class="modal-section"><b>2 / INPUTS</b><p>Sensors and switches convert real-world conditions — present, open, hot, full, moving — into electrical signals the controller can understand.</p></div><div class="modal-section"><b>3 / PLC</b><p>The PLC evaluates those inputs and its programmed logic. It decides whether conditions are right to start, stop, sequence, alarm, or wait.</p></div><div class="modal-section"><b>4 / OUTPUTS</b><p>The PLC itself usually does not power a big motor. It commands other hardware — relays, valves, contactors, VFDs, servo drives — that does the physical work.</p></div><div class="modal-section"><b>5 / FEEDBACK</b><p>A command means “I asked for it.” Feedback means “it actually happened.” That difference is one of the most useful troubleshooting ideas on the floor.</p></div><div class="modal-section"><b>6 / SAFETY</b><p>E-stops, guards, safety relays/controllers, and safe drive functions form engineered safety functions. They are not simply extra stop buttons.</p></div></div></div>`;$('#infoModal').showModal();
}
function openSources(){
  $('#modalBody').innerHTML=`<div class="modal-content"><span class="cat">DUE DILIGENCE</span><h2>Primary references</h2><p class="plain">The prototype intentionally separates beginner mental models from field-accurate caveats. Product-specific claims were checked against current manufacturer / standards-body documentation.</p><div class="source-list">${sourceLinks.map(s=>`<a target="_blank" rel="noreferrer" href="${s[1]}">${s[0]} ↗</a>`).join('')}</div><div class="modal-section" style="margin-top:18px"><b>SAFETY BOUNDARY</b><p>This is an educational interface — not a substitute for equipment manuals, engineered drawings, risk assessments, OSHA requirements, NFPA/IEC requirements, site procedures, or qualified-person training.</p></div></div>`;$('#infoModal').showModal();
}

function init(){
  setTimeout(()=>$('#boot').classList.add('hide'),650);
  renderLayer();renderLab();renderPaths();renderDecoder();renderDrawing();renderFilters();renderTerms();
  $('#troubleRight').innerHTML=trouble.map(s=>`<div class="trouble-step"><span>${s[0]}</span><div><b>${s[1]}</b><p>${s[2]}</p></div><small>${s[3]}</small></div>`).join('');
  $$('.machine-node').forEach(n=>{const inspect=()=>{const d=inspectData[n.dataset.inspect];$('#machineInspector').innerHTML=`<small>${d.kicker}</small><strong>${d.title}</strong><p>${d.text}</p>`};n.onclick=inspect;n.onkeydown=e=>{if(e.key==='Enter')inspect()}});
  $$('.layer-controls button').forEach(b=>b.onclick=()=>{$$('.layer-controls button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderLayer(b.dataset.layer)});
  $$('.lab-tabs button').forEach(b=>b.onclick=()=>{$$('.lab-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderLab(b.dataset.lab)});
  $$('[data-jump]').forEach(b=>b.onclick=()=>{currentFilter={power:'Power',signals:'Signals',controls:'Control',motion:'Motion',safety:'Safety',network:'Network'}[b.dataset.jump]||'All';renderFilters();renderTerms();$('#library').scrollIntoView({behavior:'smooth'})});
  $('#termSearch').oninput=renderTerms;
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('#termSearch').focus()}if(e.key==='Escape'&&$('#infoModal').open)$('#infoModal').close()});
  $('#modalClose').onclick=()=>$('#infoModal').close();
  $('#modeToggle').onclick=()=>{fieldMode=!fieldMode;document.body.classList.toggle('field-mode',fieldMode);$('#modeLabel').textContent=fieldMode?'FIELD':'BEGINNER';$('#modeToggle').setAttribute('aria-pressed',fieldMode)};
  $('[data-open="quickStart"]').onclick=openQuickStart;$('[data-open="sources"]').onclick=openSources;
  const menuButton=$('#menuBtn'),mobileMenu=$('#mobileMenu');
  function setMenu(open,restore=false){
    mobileMenu.classList.toggle('open',open);mobileMenu.setAttribute('aria-hidden',String(!open));mobileMenu.inert=!open;
    menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');
    if(restore)menuButton.focus();
  }
  menuButton.setAttribute('aria-controls','mobileMenu');setMenu(false);
  menuButton.onclick=()=>setMenu(!mobileMenu.classList.contains('open'));
  $$('#mobileMenu a').forEach(a=>a.onclick=()=>setMenu(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobileMenu.classList.contains('open'))setMenu(false,true)});
  document.addEventListener('click',e=>{if(!e.target.closest('#mobileMenu,#menuBtn'))setMenu(false)});
  matchMedia('(max-width:1000px)').addEventListener('change',()=>setMenu(false));
  window.addEventListener('scroll',()=>{const h=document.documentElement.scrollHeight-innerHeight;$('#pageProgress').style.width=`${h?scrollY/h*100:0}%`},{passive:true});
}

document.addEventListener('DOMContentLoaded',init);
