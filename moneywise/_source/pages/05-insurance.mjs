// Health insurance: the who-pays staircase, four cards, five costly mistakes.
import * as calc from "../../js/calc.js";
import { money, pct, num } from "../../js/format.js";

export default (k) => {
  const { t, box, group, lines, LIMITS } = k;
  const O = LIMITS.acaOutOfPocketMax,
    H = LIMITS.hsa;
  const ex = { deductible: 1886, coinsurance: 0.2, oopMax: 5000, premiumMonthly: 125 };
  const bill = 12000,
    big = 45000;
  const you = calc.youPayOnBill(ex, bill),
    youBig = calc.youPayOnBill(ex, big);
  const coins = (bill - ex.deductible) * ex.coinsurance;
  // the two plans the comparison starts with, in a major year
  const A = {
    premiumMonthly: 150,
    deductible: 1000,
    coinsurance: 0.2,
    oopMax: 4500,
    visitCopay: 30,
    rxCopay: 15,
    employerHsa: 0,
  };
  const B = {
    premiumMonthly: 80,
    deductible: 3000,
    coinsurance: 0.2,
    oopMax: 7500,
    visitCopay: null,
    rxCopay: null,
    employerHsa: 500,
  };
  const major = { visits: 8, visitCost: 180, rx: 12, rxCost: 40, other: 40000 };
  const cheapPremiumCost = calc.planYear(B, major).total - calc.planYear(A, major).total;
  const hsaTax = H["2027"].self * (0.22 + 0.0765);

  const hero = {
    id: "tool-stairs",
    label: "Who pays your medical bill",
    intro: "Drag the bill. See what you pay, and where it stops.",
    boxes:
      box({
        k: "bill",
        label: "Total bill this year",
        value: 12000,
        min: 0,
        max: 100000,
        step: 500,
      }) +
      box({ k: "ded", label: "Deductible", value: 1886, min: 0, max: 10000, step: 50 }) +
      box({ k: "coins", label: "Coinsurance", type: "pct", value: 20, min: 0, max: 50, step: 5 }) +
      box({ k: "max", label: "Out-of-pocket max", value: 5000, min: 0, max: 12000, step: 100 }),
    more: box({
      k: "prem",
      label: "Your premium",
      hint: "a month",
      value: 125,
      min: 0,
      max: 1500,
      step: 5,
    }),
  };

  const plan = (p, P) => ({
    main:
      group(P.title) +
      box({
        k: `${p}prem`,
        label: "Premium",
        hint: "/mo",
        value: P.prem,
        min: 0,
        max: 1500,
        step: 5,
      }) +
      box({ k: `${p}ded`, label: "Deductible", value: P.ded, min: 0, max: 10000, step: 50 }) +
      box({ k: `${p}max`, label: "Max", value: P.max, min: 0, max: 12000, step: 100 }),
    extra:
      group(P.title) +
      box({
        k: `${p}coins`,
        label: "Coinsurance",
        type: "pct",
        value: P.coins,
        min: 0,
        max: 50,
        step: 5,
      }) +
      box({ k: `${p}visit`, label: "Visit copay", value: P.visit, min: 0, max: 100, step: 5 }) +
      box({ k: `${p}rx`, label: "Rx copay", value: P.rx, min: 0, max: 100, step: 5 }) +
      box({
        k: `${p}hsa`,
        label: "Employer HSA deposit",
        hint: "a year",
        value: P.hsa,
        min: 0,
        max: 3000,
        step: 50,
        wide: true,
      }),
  });
  const pa = plan("a", {
    title: "Plan A",
    prem: 150,
    ded: 1000,
    coins: 20,
    max: 4500,
    visit: 30,
    rx: 15,
    hsa: 0,
  });
  const pb = plan("b", {
    title: "Plan B",
    prem: 80,
    ded: 3000,
    coins: 20,
    max: 7500,
    visit: 0,
    rx: 0,
    hsa: 500,
  });
  const more = [
    {
      id: "tool-plans",
      label: "Compare two plans",
      hint: "Light, typical and major years",
      cols: 3,
      intro: "Copy both plans from your enrollment page. Each runs through three kinds of year.",
      boxes: pa.main + pb.main,
      more:
        pa.extra +
        pb.extra +
        box({
          k: "scen",
          label: "Print this year to the tape",
          type: "seg",
          value: "typical",
          wide: true,
          options: [
            ["light", "Light"],
            ["typical", "Typical"],
            ["major", "Major"],
          ],
        }) +
        box({
          k: "other",
          label: "Major year: hospital and surgery",
          value: 40000,
          min: 5000,
          max: 150000,
          step: 1000,
          wide: true,
        }),
      foot: "A copay of 0 means visits count toward the deductible instead.",
    },
  ];

  const cards = [
    {
      big: money(ex.deductible),
      line: "the average deductible: you pay the first bills in full, up to this.",
      back: "Copays and free preventive care often skip this step. Everything else, you pay 100% until you reach it. (KFF, 2025)",
    },
    {
      big: "20%",
      line: "a common coinsurance: your share of each bill after the deductible.",
      back: `On a ${money(bill)} surgery: the ${money(ex.deductible)} deductible plus 20% of the rest, ${money(coins)}, is ${money(you)} in all.`,
    },
    {
      big: money(O["2027"].self),
      line: "the most a 2027 plan can make you pay in network.",
      back: `Then the plan pays 100% until the year resets. It was ${money(O["2026"].self)} for 2026. Premiums never count toward it.`,
    },
    {
      big: money(H["2027"].self),
      line: "you can put in an HSA for 2027, tax-free three ways.",
      back: `Tax-free in, tax-free growth, tax-free out for medical costs. It needs an HSA-eligible plan. The family limit is ${money(H["2027"].family)}.`,
    },
  ];

  const slips = [
    {
      title: "Picking the lowest premium",
      cost: `+${money(cheapPremiumCost)}`,
      fix: "In a major year, the cheaper plan in our comparison costs that much more. Compare whole-year totals.",
    },
    {
      title: "Forgetting premiums sit on top",
      cost: `${money(ex.premiumMonthly * 12)}/yr`,
      fix: "Your worst case is the out-of-pocket max plus twelve months of premiums. Save for both.",
    },
    {
      title: "Going out of network",
      cost: "may not count",
      fix: `${t("out-of-network", "Out-of-network")} care can cost more and skip your maximum. Check every doctor, lab and facility first.`,
    },
    {
      title: "Skipping the drug list",
      cost: "surprise tier",
      fix: `Look up every regular prescription in each plan's ${t("formulary")} before you enroll.`,
    },
    {
      title: "Leaving an HSA empty",
      cost: `${money(hsaTax)}/yr`,
      fix: "That is the tax a full HSA saves at 22%, contributing through payroll. Take any employer deposit too.",
    },
  ];

  const L = [
    { kind: "section", desc: "The plan" },
    {
      n: 1,
      desc: "Deductible",
      sub: "Average single deductible for workers with one, 2025 (KFF)",
      amt: num(ex.deductible),
    },
    {
      n: 2,
      desc: "Coinsurance after the deductible",
      sub: "Example plan",
      amt: pct(ex.coinsurance, 0),
    },
    {
      n: 3,
      desc: "Out-of-pocket maximum",
      sub: `Example plan; the 2026 legal ceiling is ${money(O["2026"].self)}`,
      amt: num(ex.oopMax),
    },
    { kind: "section", desc: `A ${money(bill)} MRI and outpatient surgery` },
    {
      n: 4,
      desc: "Allowed charges",
      sub: "What the plan has agreed to pay the providers",
      amt: num(bill),
    },
    {
      n: 5,
      desc: "You pay the deductible first",
      op: "Smaller of line 1 and line 4",
      amt: num(ex.deductible),
    },
    {
      n: 6,
      desc: "Charges left after the deductible",
      op: "Line 4 − line 5",
      amt: num(bill - ex.deductible),
    },
    { n: 7, desc: "Your coinsurance share", op: "Line 6 × line 2", amt: num(coins) },
    {
      n: 8,
      desc: "You pay in all",
      op: "Line 5 + line 7, but no more than line 3",
      amt: num(you),
      kind: "total",
    },
    { n: 9, desc: "The plan pays", op: "Line 4 − line 8", amt: num(bill - you) },
    { kind: "section", desc: `A ${money(big)} hospital stay instead` },
    {
      n: 10,
      desc: "Deductible plus 20% of the rest",
      op: `${money(ex.deductible)} + 20% × ${money(big - ex.deductible)}`,
      amt: num(ex.deductible + (big - ex.deductible) * ex.coinsurance),
    },
    {
      n: 11,
      desc: "Capped at the maximum",
      op: "Smaller of line 10 and line 3",
      amt: num(youBig),
      kind: "total",
    },
    { kind: "section", desc: "Do not forget" },
    {
      n: 12,
      desc: "Your share of premiums for the year",
      sub: "Example: $125 a month taken from your paycheck",
      op: "$125 × 12",
      amt: num(ex.premiumMonthly * 12),
    },
    {
      n: 13,
      desc: "Worst-case year",
      op: "Line 3 + line 12",
      amt: num(ex.oopMax + ex.premiumMonthly * 12),
      kind: "total",
    },
  ];
  const example = `<p>One plan, two bad years. The maximum on line 3 is what protects you from the second one.</p>${lines(L, "Worked health insurance example")}`;

  return {
    slug: "insurance",
    title: "Health insurance: what you'll really pay | Moneywise",
    description:
      "Deductible, coinsurance and the out-of-pocket maximum shown as one staircase, a two-plan comparison for light, typical and major years, and the 2026 and 2027 limits.",
    body: k.topic({
      slug: "insurance",
      sub: "What you'll really pay for care, and how to pick a plan.",
      chip: `Most a 2027 plan can charge you <b>${money(O["2027"].self)}</b> <small>one person, in network</small>`,
      hero,
      cards,
      slips,
      more,
      example,
      sources: ["kff-ehbs", "cms-oop", "irs-hsa26", "irs-hsa27"],
    }),
  };
};
