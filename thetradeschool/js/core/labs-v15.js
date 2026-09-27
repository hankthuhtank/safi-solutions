/* =============================================================================
   TradeSchool V15 — rebuilt practice labs
   -----------------------------------------------------------------------------
   The V10 pass deleted most labs from the catalog because they "looked like
   toys". That was the right diagnosis and the wrong fix: it left Industrial
   Maintenance with zero labs and an empty Practice tab, and the surviving labs
   still had geometry that could not exist.

   What was actually wrong, and what changed here:

     drain-vent    Trap U did not meet the drain line, and the vent stack
                   crossed through the drain and continued below it.
                   -> Rebuilt in SVG with a connected, plumbable branch and a
                      trap seal that is drawn to scale against its depth.

     ladder        Instructions floated with no rung wire. STOP was not in the
                   demo rung, so the toggle did nothing. No seal-in, which is
                   the one thing ladder logic exists to teach.
                   -> Real rails and rungs, a working three-wire start/stop
                      seal-in, and a live continuity trace.

     weld-puddle   Bead floated above the plate, depth label was clipped off
                   canvas, work angle changed nothing, and no heat input number
                   was ever shown despite heat input having a real formula.
                   -> Bead fused into the section, and a live kJ/in readout from
                      the actual heat-input equation.

     envelope      Abstract colour bars and an unlabelled square marked WINDOW.
                   -> Named assembly layers, a drainage gap, head flashing, and
                      water that follows the layers it is actually given.

     hydraulic     Delisted, and floating unconnected TANK and LOAD boxes.
                   -> Rebuilt as a connected circuit with a real relief valve,
                      and restored to the Industrial catalog so the tab is not
                      empty.

   Every readout here is computed, not decorative. Where a value is illustrative
   rather than a service target it says so on the face of the lab.
   ========================================================================== */
(() => {
  const TS = window.TS;
  if (!TS || !TS.host) return;
  const { shell, footer, toolIntro, labGuide, esc, id } = TS.host;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const on = (elId, ev, fn) => { const e = id(elId); if (e) e.addEventListener(ev, fn); };

  /* Shared chrome so the rebuilt labs match the originals. */
  function frame(barLeft, barRight, controls, stage) {
    return `<div class="workspace"><div class="workspace-bar"><span>${barLeft}</span><span id="labState">${barRight}</span></div>
      <div class="workspace-body"><div class="system-lab-layout">
        <aside class="circuit-controls">${controls}</aside>
        <section class="big-sim-stage lab15-stage">${stage}</section>
      </div></div></div>`;
  }
  const range = (i, label, min, max, val, step, unit) =>
    `<div class="range-row"><div class="range-head"><span>${label}</span><b id="${i}L">${val}${unit}</b></div>
     <input id="${i}" type="range" min="${min}" max="${max}" value="${val}" step="${step}"></div>`;
  const metrics = rows =>
    `<div class="metric-row">${rows.map(([i, v, s]) => `<div class="metric"><b id="${i}">${v}</b><small>${s}</small></div>`).join("")}</div>`;
  const explain = (i, t, s) => `<div class="lab-live-explain big" id="${i}"><b>${t}</b><span>${s}</span></div>`;

  /* ==========================================================================
     1. DRAIN + VENT  —  a branch you could actually pipe
     ========================================================================== */
  TS.labs["drain-vent"] = function () {
    shell(`${toolIntro("Trap + Vent Lab",
      "A drain moves water and air at the same time. Drain the fixture with the vent open, then block it and watch what the pressure imbalance does to the trap seal.",
      "plumbing")}
      ${labGuide('drain-vent')}
      ${frame("DWV TRAINER · LAVATORY BRANCH", "READY",
        range("dvFill", "Fixture water", 10, 100, 80, 1, "%") +
        `<button class="push on" id="dvVent">VENT OPEN</button>
         <button class="solid-btn" style="width:100%;margin-top:8px" id="dvDrain">PULL PLUG</button>` +
        metrics([["dvTrap", "2.0\u2033", "Trap seal depth"], ["dvAir", "BALANCED", "Branch pressure"], ["dvFlow", "READY", "Drain"]]) +
        explain("dvExplain", "Trap seal is full.",
          "Drain once with the vent open. Then block the vent and drain again, and compare what is left in the trap.") +
        `<p class="sim-note">Seal depth is drawn to scale against a nominal 2\u2033 trap. Codes generally require a seal between 2\u2033 and 4\u2033; a seal drawn down below that lets sewer gas through.</p>`,
        `<svg id="dvSvg" viewBox="0 0 640 480" class="lab15-svg" aria-label="Fixture trap and vent">
          <defs>
            <linearGradient id="dvWater" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#5fd3a0"/><stop offset="100%" stop-color="#2FA36B"/>
            </linearGradient>
          </defs>
          <!-- basin -->
          <path d="M120 70 L300 70 L276 140 L144 140 Z" fill="none" stroke="#5b6a7a" stroke-width="5"/>
          <clipPath id="dvBasinClip"><path d="M123 73 L297 73 L274 137 L146 137 Z"/></clipPath>
          <rect id="dvBasinWater" x="120" y="70" width="180" height="70" fill="url(#dvWater)" clip-path="url(#dvBasinClip)" opacity="0.85"/>
          <!-- tailpiece -->
          <rect x="200" y="140" width="22" height="70" fill="none" stroke="#5b6a7a" stroke-width="5"/>
          <!-- P-trap: down, U, back up, then out to the branch -->
          <path d="M211 210 L211 268 A38 38 0 0 0 287 268 L287 232"
                fill="none" stroke="#5b6a7a" stroke-width="16" stroke-linecap="butt"/>
          <clipPath id="dvTrapClip">
            <path d="M211 210 L211 268 A38 38 0 0 0 287 268 L287 232 L279 232 L279 268 A30 30 0 0 1 219 268 L219 210 Z"/>
          </clipPath>
          <rect id="dvTrapWater" x="200" y="240" width="100" height="70" fill="url(#dvWater)" clip-path="url(#dvTrapClip)"/>
          <!-- trap arm out to the stack -->
          <path d="M287 232 L470 232" fill="none" stroke="#5b6a7a" stroke-width="16"/>
          <!-- vent takes off ABOVE the trap arm and rises; drain continues DOWN -->
          <path d="M470 232 L470 60" fill="none" stroke="#5b6a7a" stroke-width="14"/>
          <path d="M470 232 L470 430 L600 430" fill="none" stroke="#5b6a7a" stroke-width="16"/>
          <g id="dvVentAir" opacity="1">
            <circle class="dv-air" cx="470" cy="200" r="5" fill="#79A8FF"/>
            <circle class="dv-air" cx="470" cy="150" r="5" fill="#79A8FF"/>
            <circle class="dv-air" cx="470" cy="100" r="5" fill="#79A8FF"/>
          </g>
          <g id="dvBlockMark" opacity="0">
            <rect x="452" y="66" width="36" height="14" fill="#C4472F"/>
            <text x="470" y="52" fill="#C4472F" font-family="ui-monospace,monospace" font-size="13" text-anchor="middle">BLOCKED</text>
          </g>
          <g id="dvDrops" opacity="0"></g>
          <text x="470" y="34" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="12" text-anchor="middle">VENT</text>
          <text x="610" y="424" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="12" text-anchor="end">TO DRAIN</text>
          <text x="150" y="196" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="12">TAILPIECE</text>
          <text x="150" y="300" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="12">P-TRAP</text>
          <text x="330" y="222" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="12">TRAP ARM</text>
        </svg>`)}
      ${footer()}`);
    initDrainVent15();
  };

  function initDrainVent15() {
    const st = { fill: 80, vent: true, seal: 100, draining: false };

    function paint() {
      const basin = id("dvBasinWater");
      if (basin) { const h = 70 * (st.fill / 100); basin.setAttribute("y", 140 - h); basin.setAttribute("height", h); }

      const tw = id("dvTrapWater");
      if (tw) { const h = 70 * (st.seal / 100); tw.setAttribute("y", 310 - h); tw.setAttribute("height", h); }

      const depth = (2 * st.seal / 100);
      const dt = id("dvTrap");
      if (dt) {
        dt.textContent = depth.toFixed(1) + "\u2033";
        dt.style.color = depth < 1 ? "var(--sig-danger)" : depth < 1.6 ? "var(--sig-warn)" : "";
      }
      id("dvAir") && (id("dvAir").textContent = st.vent ? "BALANCED" : "NEGATIVE");
      id("dvVentAir") && (id("dvVentAir").style.opacity = st.vent ? 1 : 0.12);
      id("dvBlockMark") && (id("dvBlockMark").setAttribute("opacity", st.vent ? 0 : 1));

      const b = id("dvVent");
      if (b) { b.textContent = st.vent ? "VENT OPEN" : "VENT BLOCKED"; b.classList.toggle("on", st.vent); }

      const ex = id("dvExplain");
      if (ex) {
        if (st.draining) {
          ex.innerHTML = st.vent
            ? `<b>Draining with the vent open.</b><span>Air enters behind the slug of water through the vent, so the branch stays near atmospheric pressure and the trap keeps its seal.</span>`
            : `<b>Draining with the vent blocked.</b><span>Water leaving the arm has no air behind it. The branch goes negative and pulls the trap seal out with the flow.</span>`;
        } else if (depth < 1) {
          ex.innerHTML = `<b>Seal siphoned to ${depth.toFixed(1)}\u2033.</b><span>Below roughly 2\u2033 there is not enough water left to reliably block sewer gas. This is what a dry trap smell actually is.</span>`;
        } else {
          ex.innerHTML = `<b>Trap seal ${depth.toFixed(1)}\u2033.</b><span>The vent is the reason the seal survives the drain event. Refill and run it again with the vent blocked.</span>`;
        }
      }
    }

    function drain() {
      if (st.draining) return;
      st.draining = true;
      id("dvFlow") && (id("dvFlow").textContent = "FLOWING");
      id("labState") && (id("labState").textContent = "DRAINING");
      id("dvDrops") && id("dvDrops").setAttribute("opacity", 1);
      const start = st.fill, t0 = performance.now(), dur = 1700;
      (function step(now) {
        const p = clamp((now - t0) / dur, 0, 1);
        st.fill = start * (1 - p);
        /* Vent open: the seal is disturbed but recovers as the fixture refills
           the trap on the tail of the flow. Vent blocked: negative pressure in
           the arm siphons the seal down and it does not come back. */
        st.seal = st.vent ? 100 - 18 * Math.sin(p * Math.PI) : 100 - 76 * p;
        paint();
        if (p < 1) requestAnimationFrame(step);
        else {
          st.draining = false;
          id("dvFlow") && (id("dvFlow").textContent = "EMPTY");
          id("labState") && (id("labState").textContent = st.vent ? "SEAL INTACT" : "SEAL SIPHONED");
          id("dvDrops") && id("dvDrops").setAttribute("opacity", 0);
          paint();
        }
      })(performance.now());
    }

    on("dvFill", "input", e => { st.fill = +e.target.value; id("dvFillL").textContent = st.fill + "%"; paint(); });
    on("dvVent", "click", () => { st.vent = !st.vent; paint(); });
    on("dvDrain", "click", drain);
    paint();
  }

  /* ==========================================================================
     2. LADDER LOGIC  —  three-wire start/stop with a real seal-in
     ========================================================================== */
  TS.labs["ladder"] = function () {
    shell(`${toolIntro("Ladder Logic Lab",
      "Build the circuit every motor control panel starts with: a momentary start button that stays started, and a stop button that always wins.",
      "electrical")}
      ${labGuide('ladder')}
      ${frame("PROJECT · THREE_WIRE_CONTROL", "SCANNING",
        `<div class="lab15-inputs">
          <div class="lab15-io"><span>START</span><button class="push" id="ldStart">MOMENTARY</button></div>
          <div class="lab15-io"><span>STOP</span><button class="push on" id="ldStop">CLOSED (NC)</button></div>
          <div class="lab15-io"><span>OVERLOAD</span><button class="push on" id="ldOl">CLOSED (NC)</button></div>
         </div>
         <button class="ghost-btn" style="width:100%;margin-top:10px" id="ldSeal">SEAL-IN CONTACT: IN</button>` +
        metrics([["ldMotor", "OFF", "Motor output"], ["ldPath", "OPEN", "Rung continuity"]]) +
        explain("ldExplain", "Rung is false.", "Press and release START. Watch whether the motor stays running once the button opens again.") +
        `<p class="sim-note">START is momentary: it closes only while held. That is exactly why the seal-in contact exists, and removing it is the fastest way to see what it does.</p>`,
        `<svg id="ldSvg" viewBox="0 0 640 380" class="lab15-svg" aria-label="Three-wire control rung">
          <!-- rails -->
          <line x1="60" y1="40" x2="60" y2="340" stroke="#455060" stroke-width="4"/>
          <line x1="580" y1="40" x2="580" y2="340" stroke="#455060" stroke-width="4"/>
          <text x="60" y="30" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="12" text-anchor="middle">L1</text>
          <text x="580" y="30" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="12" text-anchor="middle">L2</text>

          <!-- main rung wire -->
          <polyline id="ldWireMain" points="60,140 160,140 260,140 380,140 580,140"
                    fill="none" stroke="#3a4450" stroke-width="4"/>
          <!-- seal-in branch: parallels the START contact only -->
          <polyline id="ldWireSeal" points="110,140 110,230 210,230 210,140"
                    fill="none" stroke="#3a4450" stroke-width="4"/>

          <!-- START contact (NO) -->
          <g id="ldCStart"><line x1="140" y1="128" x2="140" y2="152" stroke="#8b97a5" stroke-width="3"/>
            <line x1="180" y1="128" x2="180" y2="152" stroke="#8b97a5" stroke-width="3"/>
            <text x="160" y="118" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="11" text-anchor="middle">START</text>
            <text x="160" y="172" fill="#6c7684" font-family="ui-monospace,monospace" font-size="10" text-anchor="middle">NO</text></g>
          <!-- STOP contact (NC) -->
          <g id="ldCStop"><line x1="280" y1="128" x2="280" y2="152" stroke="#8b97a5" stroke-width="3"/>
            <line x1="320" y1="128" x2="320" y2="152" stroke="#8b97a5" stroke-width="3"/>
            <line x1="276" y1="152" x2="324" y2="128" stroke="#8b97a5" stroke-width="2"/>
            <text x="300" y="118" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="11" text-anchor="middle">STOP</text>
            <text x="300" y="172" fill="#6c7684" font-family="ui-monospace,monospace" font-size="10" text-anchor="middle">NC</text></g>
          <!-- OVERLOAD contact (NC) -->
          <g id="ldCOl"><line x1="400" y1="128" x2="400" y2="152" stroke="#8b97a5" stroke-width="3"/>
            <line x1="440" y1="128" x2="440" y2="152" stroke="#8b97a5" stroke-width="3"/>
            <line x1="396" y1="152" x2="444" y2="128" stroke="#8b97a5" stroke-width="2"/>
            <text x="420" y="118" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="11" text-anchor="middle">OL</text>
            <text x="420" y="172" fill="#6c7684" font-family="ui-monospace,monospace" font-size="10" text-anchor="middle">NC</text></g>
          <!-- seal-in auxiliary contact (NO, driven by M) -->
          <g id="ldCSeal"><line x1="140" y1="218" x2="140" y2="242" stroke="#8b97a5" stroke-width="3"/>
            <line x1="180" y1="218" x2="180" y2="242" stroke="#8b97a5" stroke-width="3"/>
            <text x="160" y="262" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="11" text-anchor="middle">M aux</text></g>
          <!-- coil -->
          <g id="ldCoil"><circle cx="510" cy="140" r="22" fill="none" stroke="#8b97a5" stroke-width="3"/>
            <text x="510" y="146" fill="#e9e5dc" font-family="ui-monospace,monospace" font-size="14" text-anchor="middle">M</text>
            <text x="510" y="186" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="11" text-anchor="middle">COIL</text></g>
          <text x="320" y="322" id="ldCaption" fill="#6c7684" font-family="ui-monospace,monospace" font-size="12" text-anchor="middle">Hold START to close the NO contact</text>
        </svg>`)}
      ${footer()}`);
    initLadder15();
  };

  function initLadder15() {
    const LIVE = "#F0B429", DEAD = "#3a4450";
    const st = { start: false, stop: true, ol: true, sealFitted: true, motor: false };

    function solve() {
      /* Real three-wire logic: (START or seal-in) AND STOP AND OL. */
      const holdPath = st.start || (st.sealFitted && st.motor);
      st.motor = holdPath && st.stop && st.ol;
      return holdPath;
    }

    function paint() {
      const holdPath = solve();
      const energized = st.motor;

      const setG = (gid, live) => {
        const g = id(gid); if (!g) return;
        g.querySelectorAll("line").forEach(l => l.setAttribute("stroke", live ? LIVE : "#8b97a5"));
      };
      setG("ldCStart", st.start);
      setG("ldCStop", st.stop);
      setG("ldCOl", st.ol);
      setG("ldCSeal", st.sealFitted && st.motor);

      id("ldWireMain") && id("ldWireMain").setAttribute("stroke", holdPath && st.stop && st.ol ? LIVE : DEAD);
      const sw = id("ldWireSeal");
      if (sw) {
        sw.setAttribute("stroke", st.sealFitted && st.motor ? LIVE : DEAD);
        sw.setAttribute("opacity", st.sealFitted ? 1 : 0.18);
      }
      const coil = id("ldCoil");
      if (coil) {
        coil.querySelector("circle").setAttribute("stroke", energized ? LIVE : "#8b97a5");
        coil.querySelector("circle").setAttribute("stroke-width", energized ? 4 : 3);
      }

      id("ldMotor") && (id("ldMotor").textContent = energized ? "RUNNING" : "OFF");
      id("ldPath") && (id("ldPath").textContent = energized ? "CLOSED" : "OPEN");
      id("labState") && (id("labState").textContent = energized ? "COIL ENERGIZED" : "SCANNING");
      const sb = id("ldSeal");
      if (sb) sb.textContent = st.sealFitted ? "SEAL-IN CONTACT: IN" : "SEAL-IN CONTACT: REMOVED";

      const ex = id("ldExplain");
      if (!ex) return;
      if (!st.stop) ex.innerHTML = `<b>STOP is pressed.</b><span>An NC stop opens the rung no matter what else is true. That is why stop buttons are wired normally closed: a broken wire stops the motor instead of hiding the fault.</span>`;
      else if (!st.ol) ex.innerHTML = `<b>Overload contact is open.</b><span>The overload relay drops the coil, so the starter releases. Reset the overload before looking anywhere else.</span>`;
      else if (energized && !st.start && st.sealFitted) ex.innerHTML = `<b>Sealed in.</b><span>START is released, but the M auxiliary contact is now carrying the circuit around it. This is the whole point of three-wire control.</span>`;
      else if (energized && st.start) ex.innerHTML = `<b>Coil energized while START is held.</b><span>Release START and watch whether the seal-in takes over.</span>`;
      else if (!st.sealFitted) ex.innerHTML = `<b>No seal-in path.</b><span>Without the auxiliary contact the motor runs only while your finger is on the button. That is two-wire jog behaviour, not a starter.</span>`;
      else ex.innerHTML = `<b>Rung is false.</b><span>Nothing is holding the coil. Press START to close the NO contact.</span>`;
    }

    const press = (key, downVal) => (elId, isNC) => {
      const btn = id(elId); if (!btn) return;
      const down = () => { st[key] = downVal; paint(); };
      const up = () => { st[key] = !downVal; paint(); };
      if (isNC) { btn.addEventListener("mousedown", () => { st[key] = false; paint(); });
                  btn.addEventListener("mouseup", () => { st[key] = true; paint(); });
                  btn.addEventListener("mouseleave", () => { if (!st[key]) { st[key] = true; paint(); } }); }
      else { btn.addEventListener("mousedown", down); btn.addEventListener("mouseup", up);
             btn.addEventListener("mouseleave", () => { if (st[key]) { st[key] = false; paint(); } }); }
      btn.addEventListener("click", e => e.preventDefault());
    };
    press("start", true)("ldStart", false);
    press("stop", false)("ldStop", true);
    press("ol", false)("ldOl", true);
    on("ldSeal", "click", () => { st.sealFitted = !st.sealFitted; paint(); });
    paint();
  }

  /* ==========================================================================
     3. HYDRAULIC POWER  —  restored to the Industrial catalog, properly piped
     ========================================================================== */
  TS.labs["hydraulic-lab"] = function () {
    shell(`${toolIntro("Hydraulic Force + Motion Lab",
      "Pressure is what the load demands. Flow is what the pump supplies. One sets force, the other sets speed, and the relief valve decides what happens when the load asks for more than the system has.",
      "industrial")}
      ${labGuide('hydraulic-lab')}
      ${frame("HYDRAULIC TRAINER · PUMP / RELIEF / CYLINDER", "HOLDING",
        range("hyFlow", "Pump flow", 1, 15, 8, 0.5, " gpm") +
        range("hyRelief", "Relief setting", 500, 3000, 1800, 50, " psi") +
        range("hyLoad", "Load on the rod", 0, 12000, 4000, 250, " lb") +
        range("hyBore", "Cylinder bore", 1.5, 5, 3, 0.5, "\u2033") +
        `<div class="lab15-dirs">
           <button class="push" id="hyRet">\u2190 RETRACT</button>
           <button class="push on" id="hyHold">HOLD</button>
           <button class="push" id="hyExt">EXTEND \u2192</button>
         </div>` +
        metrics([["hyPsi", "0 psi", "System pressure"], ["hySpeed", "0.0 in/s", "Rod speed"], ["hyCap", "0 lb", "Force available"]]) +
        explain("hyExplain", "System is holding.",
          "Pick a direction. Then raise the load until the pressure the load demands reaches the relief setting.") +
        `<p class="sim-note">Force = pressure \u00d7 effective area. Speed = flow \u00f7 effective area. Rod diameter is taken as 40% of bore, so retract sees less area than extend and behaves differently at the same settings.</p>`,
        `<svg id="hySvg" viewBox="0 0 740 470" class="lab15-svg" aria-label="Hydraulic circuit">
          <!-- reservoir -->
          <path d="M40 340 L40 420 L150 420 L150 340" fill="none" stroke="#5b6a7a" stroke-width="4"/>
          <rect x="44" y="384" width="102" height="34" fill="#E4712F" opacity="0.25"/>
          <text x="95" y="440" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="12" text-anchor="middle">TANK</text>
          <!-- suction -->
          <path d="M95 340 L95 300" stroke="#5b6a7a" stroke-width="6" fill="none"/>
          <!-- pump -->
          <circle cx="95" cy="272" r="28" fill="none" stroke="#5b6a7a" stroke-width="4"/>
          <path id="hyPumpArrow" d="M85 272 L105 272 M99 266 L105 272 L99 278" stroke="#E4712F" stroke-width="3" fill="none"/>
          <text x="95" y="230" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="12" text-anchor="middle">PUMP</text>
          <!-- pressure line to valve -->
          <path id="hyPLine" d="M123 272 L250 272" stroke="#5b6a7a" stroke-width="6" fill="none"/>
          <!-- relief valve teed off the pressure line, back to tank -->
          <path d="M180 272 L180 360 L150 360" stroke="#5b6a7a" stroke-width="5" fill="none"/>
          <rect x="160" y="300" width="40" height="34" fill="#171b21" stroke="#5b6a7a" stroke-width="3"/>
          <path id="hyReliefFlow" d="M180 300 L180 334" stroke="#C4472F" stroke-width="4" opacity="0"/>
          <text x="212" y="320" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="11">RELIEF</text>
          <!-- directional valve -->
          <rect x="250" y="238" width="86" height="68" fill="#171b21" stroke="#5b6a7a" stroke-width="3"/>
          <text x="293" y="228" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="11" text-anchor="middle">4/3 VALVE</text>
          <text id="hyValvePos" x="293" y="278" fill="#E4712F" font-family="ui-monospace,monospace" font-size="12" text-anchor="middle">HOLD</text>
          <!-- return to tank -->
          <path d="M293 306 L293 400 L150 400" stroke="#5b6a7a" stroke-width="5" fill="none"/>
          <!-- work lines A and B to the cylinder -->
          <path id="hyLineA" d="M336 252 L400 252 L400 110 L430 110" stroke="#5b6a7a" stroke-width="5" fill="none"/>
          <path id="hyLineB" d="M336 292 L370 292 L370 196 L600 196 L600 146" stroke="#5b6a7a" stroke-width="5" fill="none"/>
          <text x="430" y="76" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="11">A \u00b7 CAP END</text>
          <text x="600" y="214" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="11" text-anchor="middle">B \u00b7 ROD END</text>
          <!-- cylinder -->
          <rect x="430" y="88" width="180" height="58" fill="none" stroke="#5b6a7a" stroke-width="4"/>
          <rect id="hyPiston" x="460" y="92" width="14" height="50" fill="#E4712F"/>
          <rect id="hyRod" x="474" y="110" width="150" height="14" fill="#5b6a7a"/>
          <rect id="hyLoadBox" x="626" y="84" width="40" height="66" fill="#171b21" stroke="#5b6a7a" stroke-width="3"/>
          <text id="hyLoadTxt" x="646" y="170" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="11" text-anchor="middle">LOAD</text>
        </svg>`)}
      ${footer()}`);
    initHydraulic15();
  };

  function initHydraulic15() {
    const st = { flow: 8, relief: 1800, load: 4000, bore: 3, dir: 0, pos: 0.15 };
    let raf = null;

    function calc() {
      const bore = st.bore, rod = bore * 0.4;
      const capArea = Math.PI * bore * bore / 4;
      const rodArea = capArea - Math.PI * rod * rod / 4;
      const area = st.dir >= 0 ? capArea : rodArea;
      /* Pressure is set by the load, capped by the relief. */
      const demand = st.dir === 0 ? 0 : st.load / area;
      const relieving = demand > st.relief;
      const psi = st.dir === 0 ? 0 : Math.min(demand, st.relief);
      /* 1 gpm = 231 in^3/min. Speed only happens if the pump can beat the load. */
      const speed = (st.dir === 0 || relieving) ? 0 : (st.flow * 231 / 60) / area;
      return { capArea, rodArea, area, demand, psi, relieving, speed, capacity: st.relief * area };
    }

    function paint() {
      const c = calc();
      id("hyPsi") && (id("hyPsi").textContent = Math.round(c.psi) + " psi");
      id("hySpeed") && (id("hySpeed").textContent = c.speed.toFixed(1) + " in/s");
      id("hyCap") && (id("hyCap").textContent = Math.round(c.capacity).toLocaleString() + " lb");
      const cap = id("hyCap"); if (cap) cap.style.color = c.relieving ? "var(--sig-danger)" : "";

      id("hyValvePos") && (id("hyValvePos").textContent = st.dir === 0 ? "HOLD" : st.dir > 0 ? "EXTEND" : "RETRACT");
      id("hyReliefFlow") && (id("hyReliefFlow").setAttribute("opacity", c.relieving ? 1 : 0));
      id("hyPLine") && (id("hyPLine").setAttribute("stroke", st.dir ? "#E4712F" : "#5b6a7a"));
      id("hyLineA") && (id("hyLineA").setAttribute("stroke", st.dir > 0 ? "#E4712F" : "#5b6a7a"));
      id("hyLineB") && (id("hyLineB").setAttribute("stroke", st.dir < 0 ? "#E4712F" : "#5b6a7a"));
      ["hyExt", "hyRet", "hyHold"].forEach((b, i) => {
        const want = [1, -1, 0][i];
        id(b) && id(b).classList.toggle("on", st.dir === want);
      });
      id("labState") && (id("labState").textContent = c.relieving ? "OVER RELIEF · NO MOTION" : st.dir ? "MOVING" : "HOLDING");

      /* geometry */
      const travel = 128, x0 = 460;
      const px = x0 + travel * st.pos;
      id("hyPiston") && id("hyPiston").setAttribute("x", px);
      const rodEl = id("hyRod");
      if (rodEl) { rodEl.setAttribute("x", px + 14); rodEl.setAttribute("width", Math.max(12, 626 - (px + 14))); }
      id("hyLoadBox") && id("hyLoadBox").setAttribute("x", 626);
      id("hyLoadTxt") && id("hyLoadTxt").setAttribute("x", 646);

      const ex = id("hyExplain");
      if (!ex) return;
      if (c.relieving) {
        ex.innerHTML = `<b>Load exceeds what the relief allows.</b><span>The load needs ${Math.round(c.demand).toLocaleString()} psi but the relief opens at ${st.relief}. All the pump flow goes over the relief and turns into heat. The cylinder does not move, and nothing about that is a cylinder fault.</span>`;
      } else if (st.dir === 0) {
        ex.innerHTML = `<b>System is holding.</b><span>No flow path to the cylinder, so no pressure is developed and no work is done.</span>`;
      } else {
        const side = st.dir > 0 ? "cap" : "rod";
        ex.innerHTML = `<b>${st.dir > 0 ? "Extending" : "Retracting"} on the ${side} side.</b><span>Effective area ${c.area.toFixed(2)} in\u00b2, so the ${st.load.toLocaleString()} lb load demands ${Math.round(c.demand)} psi and ${st.flow} gpm gives ${c.speed.toFixed(1)} in/s. Switch direction at the same settings and both numbers change, because the rod removes area.</span>`;
      }
    }

    function tick() {
      const c = calc();
      if (c.speed > 0) {
        st.pos = clamp(st.pos + st.dir * c.speed * 0.0022, 0, 1);
        if ((st.pos === 1 && st.dir > 0) || (st.pos === 0 && st.dir < 0)) st.dir = 0;
        paint();
      }
      raf = requestAnimationFrame(tick);
    }

    [["hyFlow", "flow", v => v + " gpm"], ["hyRelief", "relief", v => v + " psi"],
     ["hyLoad", "load", v => (+v).toLocaleString() + " lb"], ["hyBore", "bore", v => v + "\u2033"]]
      .forEach(([elId, key, fmt]) => on(elId, "input", e => {
        st[key] = +e.target.value; id(elId + "L").textContent = fmt(e.target.value); paint();
      }));
    on("hyExt", "click", () => { st.dir = 1; paint(); });
    on("hyRet", "click", () => { st.dir = -1; paint(); });
    on("hyHold", "click", () => { st.dir = 0; paint(); });
    paint(); tick();
    window.addEventListener("hashchange", () => raf && cancelAnimationFrame(raf), { once: true });
  }

  /* ==========================================================================
     4. WELD PARAMETER WINDOW  —  bead fused to the plate, real heat input
     ========================================================================== */
  TS.labs["weld-puddle"] = function () {
    shell(`${toolIntro("Weld Parameter Window",
      "Not a weld-quality predictor. A parameter map that shows which direction heat input, bead width and penetration move when you change one setting at a time.",
      "welding")}
      ${labGuide('weld-puddle')}
      ${frame("PROCESS MAP · RELATIVE RESPONSE", "BASELINE",
        range("wpAmps", "Current", 60, 300, 140, 5, " A") +
        range("wpVolts", "Arc voltage", 14, 34, 22, 0.5, " V") +
        range("wpSpeed", "Travel speed", 4, 24, 10, 0.5, " ipm") +
        metrics([["wpHeat", "18.5", "kJ/in heat input"], ["wpPen", "MED", "Penetration"], ["wpWidth", "MED", "Bead width"]]) +
        explain("wpExplain", "Baseline settings.",
          "Change one variable and watch the section respond. Heat input is computed, not estimated.") +
        `<p class="sim-note">Heat input = (volts \u00d7 amps \u00d7 60) \u00f7 travel speed in ipm, reported in kJ/in. Bead geometry here is a relative model: real fusion depends on process, polarity, electrode, shielding, joint design, position and the qualified procedure.</p>`,
        `<svg id="wpSvg" viewBox="0 0 640 400" class="lab15-svg" aria-label="Weld cross section">
          <defs>
            <linearGradient id="wpHot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#F0B429"/><stop offset="55%" stop-color="#C4472F"/><stop offset="100%" stop-color="#7a2f22"/>
            </linearGradient>
            <clipPath id="wpPlateClip"><rect x="70" y="180" width="500" height="150"/></clipPath>
          </defs>
          <!-- base plate -->
          <rect x="70" y="180" width="500" height="150" fill="#232830" stroke="#455060" stroke-width="2"/>
          <text x="86" y="316" fill="#6c7684" font-family="ui-monospace,monospace" font-size="12">BASE METAL</text>
          <!-- fusion zone: sits INSIDE the plate, clipped so it can never float -->
          <g clip-path="url(#wpPlateClip)">
            <ellipse id="wpFusion" cx="320" cy="180" rx="70" ry="42" fill="url(#wpHot)" opacity="0.55"/>
            <ellipse id="wpHaz" cx="320" cy="180" rx="98" ry="62" fill="#C4472F" opacity="0.13"/>
          </g>
          <!-- reinforcement cap sits ON the plate surface -->
          <path id="wpCap" d="M250 180 Q320 165 390 180 Z" fill="url(#wpHot)"/>
          <!-- width dimension above the plate -->
          <g id="wpWidthDim">
            <line id="wpWL" x1="250" y1="122" x2="390" y2="122" stroke="#97A1AD" stroke-width="1"/>
            <line id="wpWL1" x1="250" y1="116" x2="250" y2="128" stroke="#97A1AD" stroke-width="1"/>
            <line id="wpWL2" x1="390" y1="116" x2="390" y2="128" stroke="#97A1AD" stroke-width="1"/>
            <text x="320" y="110" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="11" text-anchor="middle">BEAD WIDTH</text>
          </g>
          <!-- depth dimension: drawn to the LEFT, inside the canvas -->
          <g id="wpDepthDim">
            <line id="wpDL" x1="180" y1="180" x2="180" y2="222" stroke="#97A1AD" stroke-width="1"/>
            <line x1="174" y1="180" x2="186" y2="180" stroke="#97A1AD" stroke-width="1"/>
            <line id="wpDL2" x1="174" y1="222" x2="186" y2="222" stroke="#97A1AD" stroke-width="1"/>
            <text x="168" y="206" fill="#97A1AD" font-family="ui-monospace,monospace" font-size="11" text-anchor="end">PENETRATION</text>
          </g>
          <!-- heat input scale -->
          <line x1="70" y1="366" x2="570" y2="366" stroke="#2E3540" stroke-width="6"/>
          <line id="wpScale" x1="70" y1="366" x2="240" y2="366" stroke="#C4472F" stroke-width="6"/>
          <text x="70" y="390" fill="#6c7684" font-family="ui-monospace,monospace" font-size="11">LOW HEAT INPUT</text>
          <text x="570" y="390" fill="#6c7684" font-family="ui-monospace,monospace" font-size="11" text-anchor="end">HIGH HEAT INPUT</text>
        </svg>`)}
      ${footer()}`);
    initWeld15();
  };

  function initWeld15() {
    const st = { amps: 140, volts: 22, speed: 10 };

    function paint() {
      const kj = (st.volts * st.amps * 60) / (st.speed * 1000);
      id("wpHeat") && (id("wpHeat").textContent = kj.toFixed(1));

      /* Relative geometry: current drives penetration, voltage drives width,
         travel speed divides both. Normalised against the baseline case. */
      const penN = clamp((st.amps / 140) * Math.pow(10 / st.speed, 0.5), 0.35, 2.2);
      const widN = clamp((st.volts / 22) * Math.pow(10 / st.speed, 0.5), 0.4, 2.2);

      const rx = 70 * widN, ry = 42 * penN;
      const f = id("wpFusion"); if (f) { f.setAttribute("rx", rx); f.setAttribute("ry", ry); }
      const h = id("wpHaz"); if (h) { h.setAttribute("rx", rx * 1.4); h.setAttribute("ry", ry * 1.45); }

      const capW = 70 * widN, capH = 15 * Math.min(1.6, widN);
      const cap = id("wpCap");
      if (cap) cap.setAttribute("d", `M${320 - capW} 180 Q320 ${180 - capH} ${320 + capW} 180 Z`);

      id("wpWL") && (id("wpWL").setAttribute("x1", 320 - capW), id("wpWL").setAttribute("x2", 320 + capW));
      id("wpWL1") && (id("wpWL1").setAttribute("x1", 320 - capW), id("wpWL1").setAttribute("x2", 320 - capW));
      id("wpWL2") && (id("wpWL2").setAttribute("x1", 320 + capW), id("wpWL2").setAttribute("x2", 320 + capW));
      id("wpDL") && id("wpDL").setAttribute("y2", 180 + ry);
      id("wpDL2") && (id("wpDL2").setAttribute("y1", 180 + ry), id("wpDL2").setAttribute("y2", 180 + ry));

      const band = v => v < 0.75 ? "LOW" : v > 1.35 ? "HIGH" : "MED";
      id("wpPen") && (id("wpPen").textContent = band(penN));
      id("wpWidth") && (id("wpWidth").textContent = band(widN));
      id("wpScale") && id("wpScale").setAttribute("x2", 70 + clamp(kj / 60, 0.02, 1) * 500);
      id("labState") && (id("labState").textContent = kj.toFixed(1) + " kJ/in");

      const ex = id("wpExplain");
      if (ex) ex.innerHTML = `<b>${kj.toFixed(1)} kJ/in.</b><span>${st.volts} V \u00d7 ${st.amps} A \u00d7 60 \u00f7 ${st.speed} ipm. Raising travel speed cuts heat input and shrinks both width and penetration at once, which is why speed is not a comfort setting. High heat input on a quench-and-tempered steel is a metallurgy problem, not just a wide bead.</span>`;
    }

    [["wpAmps", "amps", " A"], ["wpVolts", "volts", " V"], ["wpSpeed", "speed", " ipm"]]
      .forEach(([elId, key, unit]) => on(elId, "input", e => {
        st[key] = +e.target.value; id(elId + "L").textContent = e.target.value + unit; paint();
      }));
    paint();
  }

  /* ==========================================================================
     5. ENVELOPE WATER  —  a named wall assembly, water follows the layers
     ========================================================================== */
  TS.labs["envelope-lab"] = function () {
    shell(`${toolIntro("Water Management Lab",
      "Cladding is not the waterproofing. Watch where wind-driven rain goes when the drainage plane and the head flashing are continuous, and where it goes when they are not.",
      "construction")}
      ${labGuide('envelope-lab')}
      ${frame("WALL SECTION · WATER CONTROL", "DRAINING OUT",
        range("enRain", "Rain intensity", 10, 100, 60, 1, "%") +
        range("enWind", "Wind pressure", 0, 100, 40, 1, "%") +
        `<label class="lab15-toggle"><input type="checkbox" id="enFlash" checked><span>Head flashing over the window</span></label>
         <label class="lab15-toggle"><input type="checkbox" id="enWrb" checked><span>Drainage plane lapped and continuous</span></label>
         <label class="lab15-toggle"><input type="checkbox" id="enGap" checked><span>Drainage gap behind the cladding</span></label>` +
        metrics([["enDrain", "GOOD", "Drainage"], ["enWet", "DRY", "Sheathing"], ["enInt", "DRY", "Interior"]]) +
        explain("enExplain", "Assembly is draining.",
          "Break one layer at a time and follow the water. Most leaks are a lap running the wrong way, not a hole.") +
        `<p class="sim-note">Water is shown following the layers it is given. Real assemblies also depend on the drying direction, the climate zone and the specific products, which is why detail drawings exist.</p>`,
        `<svg id="enSvg" viewBox="0 0 640 460" class="lab15-svg" aria-label="Wall section water path">
          <!-- assembly layers, exterior on the left -->
          <rect x="90"  y="50" width="46" height="360" fill="#3a4450"/>
          <rect x="140" y="50" width="14" height="360" fill="#12151A"/>
          <rect id="enWrbLayer" x="156" y="50" width="12" height="360" fill="#4A87C7" opacity="0.85"/>
          <rect x="170" y="50" width="70" height="360" fill="#2a3038"/>
          <rect x="242" y="50" width="120" height="360" fill="#1e2229"/>
          <rect x="364" y="50" width="16" height="360" fill="#333a44"/>
          <text x="113" y="432" fill="#6c7684" font-family="ui-monospace,monospace" font-size="10" text-anchor="middle">CLADDING</text>
          <text x="147" y="446" fill="#6c7684" font-family="ui-monospace,monospace" font-size="10" text-anchor="middle">GAP</text>
          <text x="162" y="432" fill="#4A87C7" font-family="ui-monospace,monospace" font-size="10" text-anchor="middle">WRB</text>
          <text x="205" y="446" fill="#6c7684" font-family="ui-monospace,monospace" font-size="10" text-anchor="middle">SHEATHING</text>
          <text x="302" y="432" fill="#6c7684" font-family="ui-monospace,monospace" font-size="10" text-anchor="middle">STUD + INSULATION</text>
          <text x="372" y="446" fill="#6c7684" font-family="ui-monospace,monospace" font-size="10" text-anchor="middle">GYPSUM</text>

          <!-- window unit through the wall -->
          <rect x="90" y="180" width="290" height="110" fill="#12151A" stroke="#5b6a7a" stroke-width="3"/>
          <text x="235" y="242" fill="#8b97a5" font-family="ui-monospace,monospace" font-size="13" text-anchor="middle">WINDOW UNIT</text>
          <!-- head flashing -->
          <path id="enFlashing" d="M84 176 L176 176 L176 168 L84 168 Z" fill="#F0B429"/>
          <text id="enFlashTxt" x="200" y="164" fill="#F0B429" font-family="ui-monospace,monospace" font-size="11">HEAD FLASHING</text>

          <!-- rain -->
          <g id="enRainG"></g>
          <!-- water paths -->
          <path id="enPathGood" d="M138 60 L138 400 L120 418" stroke="#4A87C7" stroke-width="4" fill="none" opacity="0.9" stroke-linecap="round"/>
          <path id="enPathSheath" d="M162 60 L162 178 L200 200 L200 400" stroke="#C4472F" stroke-width="4" fill="none" opacity="0"/>
          <path id="enPathInterior" d="M162 60 L162 178 L300 210 L300 400" stroke="#C4472F" stroke-width="4" fill="none" opacity="0"/>
          <text x="120" y="436" fill="#4A87C7" font-family="ui-monospace,monospace" font-size="11" text-anchor="middle">DRAINS OUT</text>
        </svg>`)}
      ${footer()}`);
    initEnvelope15();
  };

  function initEnvelope15() {
    const st = { rain: 60, wind: 40, flash: true, wrb: true, gap: true };

    function paint() {
      const drops = id("enRainG");
      if (drops) {
        const n = Math.round(st.rain / 9);
        const skew = st.wind / 100 * 26;
        drops.innerHTML = Array.from({ length: n }, (_, i) => {
          const y = 40 + (i * 37) % 360;
          return `<line x1="${20 + skew}" y1="${y}" x2="${86}" y2="${y + 14}" stroke="#4A87C7" stroke-width="2" opacity="0.5"/>`;
        }).join("");
      }

      id("enWrbLayer") && id("enWrbLayer").setAttribute("opacity", st.wrb ? 0.85 : 0.12);
      id("enFlashing") && id("enFlashing").setAttribute("opacity", st.flash ? 1 : 0.1);
      id("enFlashTxt") && id("enFlashTxt").setAttribute("opacity", st.flash ? 1 : 0.3);

      /* Cladding always leaks a little under wind-driven rain. What decides the
         outcome is whether the water behind it has a drained path back out. */
      const behindCladding = st.rain > 15;
      const reachesSheathing = behindCladding && (!st.flash || !st.wrb || !st.gap);
      const reachesInterior = behindCladding && !st.flash && !st.wrb;

      id("enPathGood") && id("enPathGood").setAttribute("opacity", reachesSheathing ? 0.2 : 0.9);
      id("enPathSheath") && id("enPathSheath").setAttribute("opacity", reachesSheathing && !reachesInterior ? 0.95 : 0);
      id("enPathInterior") && id("enPathInterior").setAttribute("opacity", reachesInterior ? 0.95 : 0);

      const set = (i, v, bad) => { const e = id(i); if (e) { e.textContent = v; e.style.color = bad ? "var(--sig-danger)" : ""; } };
      set("enDrain", reachesSheathing ? "BLOCKED" : "GOOD", reachesSheathing);
      set("enWet", reachesSheathing ? "WETTING" : "DRY", reachesSheathing);
      set("enInt", reachesInterior ? "LEAKING" : "DRY", reachesInterior);
      id("labState") && (id("labState").textContent = reachesInterior ? "WATER REACHING INTERIOR" : reachesSheathing ? "WATER ON SHEATHING" : "DRAINING OUT");

      const ex = id("enExplain");
      if (!ex) return;
      if (reachesInterior) ex.innerHTML = `<b>Water is reaching the interior.</b><span>With no head flashing and a discontinuous drainage plane, there is nothing directing water back out above the opening. The window head is where most wall leaks actually start.</span>`;
      else if (!st.gap && st.wrb && st.flash) ex.innerHTML = `<b>No drainage gap.</b><span>The layers are continuous, but water held tight against the sheathing has no way to drain or dry. A drained and vented cavity is what turns a water-resistive barrier into a working assembly.</span>`;
      else if (reachesSheathing) ex.innerHTML = `<b>Water is sitting on the sheathing.</b><span>${!st.flash ? "Without head flashing, water running down the face gets behind the assembly at the opening." : "A break in the drainage plane gives water somewhere to go sideways instead of down and out."}</span>`;
      else ex.innerHTML = `<b>Assembly is draining.</b><span>Some water always gets past cladding under wind-driven rain. Because the flashing sheds it onto a lapped drainage plane with a gap behind, it runs down and back out instead of soaking in.</span>`;
    }

    on("enRain", "input", e => { st.rain = +e.target.value; id("enRainL").textContent = st.rain + "%"; paint(); });
    on("enWind", "input", e => { st.wind = +e.target.value; id("enWindL").textContent = st.wind + "%"; paint(); });
    ["enFlash", "enWrb", "enGap"].forEach((elId, i) => on(elId, "change", e => {
      st[["flash", "wrb", "gap"][i]] = e.target.checked; paint();
    }));
    paint();
  }

  /* app.js runs its first route() before this file has executed, so a deep link
     straight to a rebuilt lab would render the old one. Re-route once the
     registry is populated if the current hash points at a lab we replaced. */
  const current = (location.hash.replace(/^#\/?/, "").split("?")[0].split("/"));
  if (current[0] === "tool" && TS.labs[current[1]] && TS.host.rerender) TS.host.rerender();

  console.log("V15 labs: " + Object.keys(TS.labs).length + " rebuilt (" + Object.keys(TS.labs).join(", ") + ")");
})();
