(() => {
  "use strict";
  const H = window.TS?.host;
  if (!H) return;
  const key = "tradeschool.fieldchecks.v1";
  const cases = [
    {
      id: "electrical",
      name: "Electrical",
      title: "Stopped is not isolated.",
      evidence: ["Conveyor is motionless", "Stop button pressed", "Disconnect remains ON"],
      q: "What does this evidence establish?",
      choices: [
        "The conveyor is safe to service",
        "A stop command has been given; hazardous energy may remain",
        "No electrical energy is present",
      ],
      answer: 1,
      why: [
        "Motionless equipment can still contain electrical or stored energy. A stop button does not isolate it.",
        "Correct. A control command is different from physical energy isolation. The listed conditions do not establish a safe service state.",
        "The disconnect is still on, and a stop button is control circuitry. Neither the lack of motion nor a button proves absence of hazardous energy.",
      ],
      source: "OSHA: control circuitry and energy isolation",
      url: "https://www.osha.gov/etools/lockout-tagout/hot-topics/energy-control-program/energy-control-circuitry-prohibition",
      next: "ladder",
    },
    {
      id: "hvac",
      name: "HVAC",
      title: "Follow the air before the guess.",
      evidence: ["Cooling call is active", "Supply airflow is weak", "Filter is visibly clogged"],
      q: "Which conclusion is supported?",
      choices: [
        "The refrigerant charge is definitely low",
        "The compressor needs replacement",
        "The filter is a plausible airflow restriction",
      ],
      answer: 2,
      why: [
        "Weak airflow alone does not establish refrigerant charge. The visible restriction deserves attention.",
        "This evidence does not identify a failed compressor. Work from observations rather than replacement guesses.",
        "Correct. A clogged filter can restrict airflow and reduce cooling performance. It is a supported lead, not proof that it is the only fault.",
      ],
      source: "DOE: home cooling fundamentals",
      url: "https://www.energy.gov/sites/prod/files/2016/11/f34/Energy%20Saver%20101%20Infographic%20Home%20Cooling_0.pdf",
      next: "airflow",
    },
    {
      id: "plumbing",
      name: "Plumbing",
      title: "A connection can change direction.",
      evidence: [
        "Hose touches non-potable liquid",
        "No verified backflow protection",
        "Supply pressure drops",
      ],
      q: "What risk belongs in the assessment?",
      choices: [
        "Contaminated liquid could be drawn toward the potable supply",
        "Water always flows out of a tap, so there is no risk",
        "Clear-looking water proves the connection is safe",
      ],
      answer: 0,
      why: [
        "Correct. A pressure change across an unprotected cross-connection can cause backflow. Use the appropriate approved protection for the hazard and local requirements.",
        "Direction depends on pressure conditions. A supply-pressure drop can allow backsiphonage.",
        "Appearance does not prove water is safe or that a cross-connection is protected.",
      ],
      source: "EPA: cross-connection control",
      url: "https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=2000ZZB8.TXT",
      next: "pressure-flow",
    },
    {
      id: "industrial",
      name: "Industrial",
      title: "The motor is only one energy source.",
      evidence: [
        "Motor supply isolated",
        "Pneumatic accumulator charged",
        "Raised load unsupported",
      ],
      q: "What still matters before service?",
      choices: [
        "Only whether the motor can start",
        "Stored pressure and gravitational energy",
        "Nothing, because electrical power is isolated",
      ],
      answer: 1,
      why: [
        "The machine also contains stored pressure and an elevated load. An electrical check alone misses those hazards.",
        "Correct. Hazardous energy includes more than electricity. Stored pressure, gravity and possible reaccumulation must be addressed through the equipment-specific energy-control procedure.",
        "Isolation of one source does not establish control of all hazardous energy.",
      ],
      source: "OSHA: hazardous energy control",
      url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147",
      next: "pneumatic-lab",
    },
    {
      id: "welding",
      name: "Welding",
      title: "A helmet does not control fumes.",
      evidence: [
        "Welding arc is shielded",
        "Work is in an enclosed space",
        "Ventilation has not been assessed",
      ],
      q: "Which response addresses the missing information?",
      choices: [
        "Assume the helmet handles all exposure",
        "Use the appearance of the weld as an air-quality test",
        "Assess fume controls and applicable space requirements before work",
      ],
      answer: 2,
      why: [
        "A welding helmet is not, by itself, a fume-control system. Ventilation and other protection depend on the work and exposure.",
        "A sound-looking bead tells you nothing reliable about airborne exposure.",
        "Correct. Welding fumes require appropriate controls. An enclosed or confined space may add requirements; the work needs a proper assessment before it begins.",
      ],
      source: "OSHA: welding ventilation and protection",
      url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.353",
      next: "weld-puddle",
    },
    {
      id: "construction",
      name: "Construction",
      title: "Read the dimension, not the screen.",
      evidence: [
        "Drawing view is resized to 80%",
        "Dimension label remains 1,200 mm",
        "No design revision issued",
      ],
      q: "What happened to the specified dimension?",
      choices: [
        "It is now 960 mm",
        "It remains 1,200 mm; the display changed",
        "It depends on the monitor size",
      ],
      answer: 1,
      why: [
        "960 mm is 80% of 1,200, but resizing a view does not revise a dimension annotation.",
        "Correct. A drawing dimension specifies the feature; zoom or print resizing changes the picture. Check units, revision and any conflict before work.",
        "Monitor size affects the display, not the written dimension.",
      ],
      source: "NASA: engineering drawing practices",
      url: "https://ntrs.nasa.gov/citations/20205010487",
      next: "blueprint-lab",
    },
  ];
  let selected = 0,
    done = [];
  try {
    const v = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(v)) done = v.filter((x) => cases.some((c) => c.id === x));
  } catch (_) {}
  function render() {
    const c = cases[selected];
    H.shell(
      `<section class="fieldcheck"><div class="fieldcheck-head"><a href="#/">← All trades</a><span>FIELD DECISIONS / LEARN FROM EVIDENCE</span><h1>What do you know<br>before you act?</h1><p>Choose a trade. Read three observations. Decide what they actually support.</p></div><nav class="fieldcheck-trades" aria-label="Choose a trade">${cases.map((x, i) => `<button type="button" data-case="${i}" aria-pressed="${i === selected}">${x.name}${done.includes(x.id) ? " · reviewed" : ""}</button>`).join("")}</nav><div class="fieldcheck-case"><div class="fieldcheck-evidence"><span>THE OBSERVATIONS</span><h2>${c.title}</h2>${c.evidence.map((x, i) => `<div><b>0${i + 1}</b><p>${x}</p></div>`).join("")}</div><div class="fieldcheck-decision"><span>YOUR CALL</span><h3>${c.q}</h3><div class="fieldcheck-choices">${c.choices.map((x, i) => `<button type="button" data-answer="${i}"><span>${String.fromCharCode(65 + i)}</span>${x}</button>`).join("")}</div><div id="fieldFeedback" class="fieldcheck-feedback" aria-live="polite">Choose an answer to see the reasoning.</div><div id="fieldNext" hidden><a href="#/tool/${c.next}">Explore the related lab →</a><button type="button" id="nextField">Next trade →</button></div></div></div><p class="fieldcheck-scope">Practice reasoning, not permission to perform work. These short scenarios are not complete procedures or qualification checks.</p><p class="fieldcheck-progress">${new Set(done).size} of ${cases.length} decisions reviewed on this device.</p></section>${H.footer()}`,
    );
    document.querySelectorAll("[data-case]").forEach((b) =>
      b.addEventListener("click", () => {
        selected = +b.dataset.case;
        render();
        document.querySelector(".fieldcheck-case h2").setAttribute("tabindex", "-1");
        document.querySelector(".fieldcheck-case h2").focus();
      }),
    );
    document.querySelectorAll("[data-answer]").forEach((b) =>
      b.addEventListener("click", () => {
        const answer = +b.dataset.answer,
          out = document.querySelector("#fieldFeedback");
        document
          .querySelectorAll("[data-answer]")
          .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        out.innerHTML = `<b>${answer === c.answer ? "Supported by the evidence" : "Look at the evidence again"}</b><p>${c.why[answer]}</p><a href="${c.url}" target="_blank" rel="noopener">${c.source} ↗</a>`;
        document.querySelector("#fieldNext").hidden = false;
        if (answer === c.answer && !done.includes(c.id)) {
          done.push(c.id);
          try {
            localStorage.setItem(key, JSON.stringify(done));
          } catch (_) {}
          document.querySelector(".fieldcheck-progress").textContent =
            `${done.length} of ${cases.length} decisions reviewed on this device.`;
        }
      }),
    );
    document.querySelector("#nextField").addEventListener("click", () => {
      selected = (selected + 1) % cases.length;
      render();
      document
        .querySelector(".fieldcheck-case")
        .scrollIntoView({ block: "start", behavior: "auto" });
    });
  }
  window.TS.labs.fieldcheck = render;
  if (location.hash.split("?")[0] === "#/tool/fieldcheck") render();
})();
