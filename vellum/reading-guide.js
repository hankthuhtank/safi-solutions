(() => {
  "use strict";
  const $ = (s) => document.querySelector(s),
    key = "vellum.close-reading.v1",
    prompts = [
      [
        "What can you point to?",
        "Notice repeated words, speakers, actions and changes in the passage. Record a detail with its verse before explaining it.",
        "Your observation",
      ],
      [
        "What might it mean?",
        "Use your observation to support a reading. Try “This may suggest… because verse…”. Consider another plausible reading.",
        "Your interpretation",
      ],
      [
        "What needs another look?",
        "Record a question, an assumption to check or a connection worth following. Read the surrounding passage before settling it.",
        "Your next question",
      ],
    ];
  let step = 0,
    data = { reference: "", notes: ["", "", ""] };
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (
      saved &&
      typeof saved.reference === "string" &&
      Array.isArray(saved.notes) &&
      saved.notes.length === 3 &&
      saved.notes.every((n) => typeof n === "string")
    )
      data = saved;
  } catch (_) {}
  $("#readingReference").value = data.reference;
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      $("#readingSave").textContent = "Saved on this device. Download a copy to keep it elsewhere.";
    } catch (_) {
      $("#readingSave").textContent =
        "Browser storage is unavailable. Download your notes before leaving.";
    }
  }
  function draw(focus = false) {
    $("#readingPromptTitle").textContent = prompts[step][0];
    $("#readingPrompt").textContent = prompts[step][1];
    $("#readingNoteLabel").textContent = prompts[step][2];
    $("#readingNote").value = data.notes[step];
    $("#readingNext").textContent = [
      "Next: interpret →",
      "Next: revisit →",
      "Return to observations →",
    ][step];
    document
      .querySelectorAll("[data-reading-step]")
      .forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.readingStep === step)));
    if (focus) $("#readingPromptTitle").focus();
  }
  $("#readingReference").addEventListener("input", (e) => {
    data.reference = e.target.value;
    save();
  });
  $("#readingNote").addEventListener("input", (e) => {
    data.notes[step] = e.target.value;
    save();
  });
  document.querySelectorAll("[data-reading-step]").forEach((b) =>
    b.addEventListener("click", () => {
      step = +b.dataset.readingStep;
      draw(true);
    }),
  );
  $("#readingNext").addEventListener("click", () => {
    step = (step + 1) % 3;
    draw(true);
  });
  $("#readingExport").addEventListener("click", () => {
    const text =
        "Vellum · Close reading\n" +
        data.reference +
        "\n\n" +
        data.notes.map((n, i) => prompts[i][2] + "\n" + n).join("\n\n"),
      url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" })),
      a = document.createElement("a");
    a.href = url;
    a.download = "vellum-reading-notes.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $("#startCloseReading").addEventListener("click", () => {
    openReference("LUK", 10, 25);
    $("#readingGuide").open = true;
    if (!data.reference && !data.notes.some(Boolean)) {
      data.reference = "Luke 10:25–37 · " + ($("#selTrans").value || "selected translation");
      $("#readingReference").value = data.reference;
      save();
    }
    $("#readingGuide").scrollIntoView({ block: "start", behavior: "auto" });
    $("#readingPromptTitle").focus({ preventScroll: true });
  });
  draw();
})();
