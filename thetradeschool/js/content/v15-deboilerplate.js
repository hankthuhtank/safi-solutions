/* =============================================================================
   TradeSchool boilerplate stripper
   -----------------------------------------------------------------------------
   The content passes filled every concept's schema to 100%, which looks
   complete in a validator and reads as filler on the page. Measured across the
   428 concepts before this pass:

       safety         one identical sentence on 104 concepts
       verify         one identical 3-line block on  76 concepts
       misconceptions one identical block on         73 concepts
       analogy        one identical sentence on      60 concepts
       recognize      one identical block on         14 concepts

   A sentence that is true of 104 different things teaches nothing about any of
   them. Rather than hard-coding regexes for the strings we happen to know about,
   this pass counts every string in every list field and removes any that recur
   across more concepts than THRESHOLD. New boilerplate introduced later gets
   caught automatically.

   Concepts touched by currency.js keep their specific lines, because those
   were written for one concept each and will never cross the threshold.
   ========================================================================== */
(() => {
  const D = window.TRADE_DATA;
  if (!D || !D.concepts) return;

  const THRESHOLD = 8;
  const LIST_FIELDS = ["recognize", "verify", "failures", "misconceptions", "where", "steps"];
  const TEXT_FIELDS = ["analogy", "safety", "fieldScenario"];

  const tally = {};
  const bump = (field, value) => {
    if (!value) return;
    const k = field + "\u0000" + value;
    tally[k] = (tally[k] || 0) + 1;
  };

  D.concepts.forEach((c) => {
    LIST_FIELDS.forEach((f) => (c[f] || []).forEach((v) => bump(f, v)));
    TEXT_FIELDS.forEach((f) => bump(f, c[f]));
  });

  /* Short entries are allowed to repeat. `where` legitimately lists the same
     equipment across many concepts ("Conveyors", "Pumps", "Motors"), and a
     one-word failure clue like "Noise" is a real clue, not filler. Boilerplate
     is specifically the long generic sentence that fits anything. */
  const MIN_LENGTH = 45;

  const isBoilerplate = (field, value) =>
    String(value).length >= MIN_LENGTH && (tally[field + "\u0000" + value] || 0) > THRESHOLD;

  const report = {};
  const count = (field, n) => {
    report[field] = (report[field] || 0) + n;
  };

  D.concepts.forEach((c) => {
    LIST_FIELDS.forEach((f) => {
      if (!Array.isArray(c[f])) return;
      const before = c[f].length;
      c[f] = c[f].filter((v) => !isBoilerplate(f, v));
      if (c[f].length !== before) count(f, before - c[f].length);
    });
    TEXT_FIELDS.forEach((f) => {
      if (c[f] && isBoilerplate(f, c[f])) {
        delete c[f];
        count(f, 1);
      }
    });
  });

  /* What got removed, so the audit doc and the app can both cite real numbers. */
  D.boilerplateRemoved = Object.entries(tally)
    .filter(([k, n]) => n > THRESHOLD)
    .map(([k, n]) => {
      const [field, value] = k.split("\u0000");
      return { field, count: n, sample: value.slice(0, 120) };
    })
    .sort((a, b) => b.count - a.count);

  /* --------------------------------------------------------------------------
     Knowledge checks.

     Measured before this pass: 416 of the 428 checks shared just three option
     sets. 96 concepts asked literally "What best shows you understand <title>?"
     with the same four answers. That is not assessment, it is a shape that looks
     like assessment, and answering it correctly proves nothing about the topic.

     Same rule as the prose: if the same options are attached to more than
     THRESHOLD concepts, the check is generic and gets removed. What survives is
     the small number of checks that were actually written about their concept.
     ------------------------------------------------------------------------ */
  const checkTally = {};
  D.concepts.forEach((c) => {
    if (!c.check || !Array.isArray(c.check.options)) return;
    const k = JSON.stringify(c.check.options);
    checkTally[k] = (checkTally[k] || 0) + 1;
  });
  let checksRemoved = 0;
  D.concepts.forEach((c) => {
    if (!c.check || !Array.isArray(c.check.options)) return;
    if (checkTally[JSON.stringify(c.check.options)] > THRESHOLD) {
      delete c.check;
      checksRemoved++;
    }
  });
  D.genericChecksRemoved = checksRemoved;
  D.realChecks = D.concepts.filter((c) => c.check).length;

  console.log(
    "V15 de-boilerplate: removed " +
      Object.entries(report)
        .map(([f, n]) => `${n} ${f}`)
        .join(", ") +
      ` across ${D.boilerplateRemoved.length} repeated string(s); ` +
      `removed ${checksRemoved} generic knowledge check(s), ${D.realChecks} concept-specific check(s) kept.`,
  );
})();
