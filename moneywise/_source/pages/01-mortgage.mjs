// Mortgage: one payment calculator, four cards, five costly mistakes.
import * as calc from "../../js/calc.js";
import { money, pct, num } from "../../js/format.js";

export default (k) => {
  const { t, box, lines, rate, asof, val } = k;
  // the worked example: a median-priced home, 10% down, today's average 30-year rate
  const price = val("MSPUS"),
    r = val("MORTGAGE30US") / 100;
  const down = price * 0.1,
    loan = price - down;
  const taxRate = 0.009,
    insYear = 3057,
    pmiRate = 0.005;
  const pi = calc.cents(calc.payment(loan, r, 360));
  const am = calc.amortize({ principal: loan, annualRate: r, months: 360 });
  const tax = calc.cents((price * taxRate) / 12),
    ins = calc.cents(insYear / 12),
    pmi = calc.cents((loan * pmiRate) / 12);
  const total = pi + tax + ins + pmi;
  const ms = calc.pmiMilestones({
    principal: loan,
    annualRate: r,
    months: 360,
    originalValue: price,
  });
  const withPmi = calc.amortize({
    principal: loan,
    annualRate: r,
    months: 360,
    pmi: { annualRate: pmiRate, originalValue: price },
  });
  const byRequest = calc.amortize({
    principal: loan,
    annualRate: r,
    months: 360,
    pmi: { annualRate: pmiRate, originalValue: price, removeAt: "request" },
  });
  const pmiSaved = withPmi.pmiTotal - byRequest.pmiTotal;
  const onePoint = calc.payment(loan, r, 360) - calc.payment(loan, r - 0.01, 360);
  const refi = calc.refinance({
    balance: 310000,
    annualRate: 0.08,
    remainingMonths: 324,
    newRate: r,
    newMonths: 360,
    costs: 6200,
  });
  const y = (m) => Math.ceil(m / 12);
  const r100 = Math.round(r * 10000) / 100;
  const term = box({
    k: "term",
    label: "Term",
    type: "seg",
    value: 30,
    options: [
      [15, "15 yr"],
      [20, "20 yr"],
      [30, "30 yr"],
    ],
  });

  const hero = {
    id: "tool-pay",
    label: "Your monthly payment",
    boxes:
      box({ k: "price", label: "Home price", value: price, min: 50000, max: 2000000, step: 5000 }) +
      box({
        k: "downPct",
        label: "Down payment",
        type: "pct",
        value: 10,
        min: 0,
        max: 60,
        step: 1,
      }) +
      box({
        k: "rate",
        label: "Interest rate",
        type: "pct",
        value: r100,
        min: 2,
        max: 12,
        step: 0.05,
        live: "MORTGAGE30US",
        dp: 2,
      }) +
      term,
    more:
      box({
        k: "taxPct",
        label: "Property tax",
        hint: "a year",
        type: "pct",
        value: 0.9,
        min: 0,
        max: 3,
        step: 0.05,
        dp: 2,
      }) +
      box({
        k: "ins",
        label: "Home insurance",
        hint: "a year",
        value: insYear,
        min: 0,
        max: 15000,
        step: 50,
      }) +
      box({
        k: "pmiPct",
        label: "PMI rate",
        type: "pct",
        value: 0.5,
        min: 0,
        max: 2,
        step: 0.05,
        dp: 2,
      }) +
      box({ k: "hoa", label: "HOA dues", hint: "a month", value: 0, min: 0, max: 1500, step: 10 }) +
      box({
        k: "request",
        label: "I will ask to drop PMI at 80%",
        type: "check",
        value: true,
        wide: true,
      }),
  };

  const more = [
    {
      id: "tool-extra",
      label: "Extra payments",
      hint: "Pay it off sooner",
      intro: "Extra money goes straight to principal, so it never gets charged interest.",
      boxes:
        box({
          k: "loan",
          label: "Loan amount",
          value: loan,
          min: 20000,
          max: 1500000,
          step: 5000,
        }) +
        box({
          k: "rate",
          label: "Interest rate",
          type: "pct",
          value: r100,
          min: 2,
          max: 12,
          step: 0.05,
          live: "MORTGAGE30US",
          dp: 2,
        }) +
        box({ k: "extra", label: "Extra each month", value: 200, min: 0, max: 3000, step: 25 }),
      more:
        term +
        box({ k: "lump", label: "One-time extra", value: 0, min: 0, max: 100000, step: 500 }) +
        box({
          k: "lumpYear",
          label: "Paid in year",
          type: "num",
          value: 3,
          min: 1,
          max: 29,
          step: 1,
        }),
    },
    {
      id: "tool-points",
      label: "Points",
      hint: "Worth paying up front?",
      intro:
        "Points buy a lower rate with cash at closing. They only pay off if you keep the loan long enough.",
      boxes:
        box({
          k: "loan",
          label: "Loan amount",
          value: loan,
          min: 20000,
          max: 1500000,
          step: 5000,
        }) +
        box({
          k: "points",
          label: "Points bought",
          type: "num",
          value: 1,
          min: 0,
          max: 4,
          step: 0.25,
        }) +
        box({
          k: "years",
          label: "Years you keep the loan",
          type: "num",
          value: 7,
          min: 1,
          max: 30,
          step: 1,
        }),
      more:
        box({
          k: "rate",
          label: "Rate with no points",
          type: "pct",
          value: r100,
          min: 2,
          max: 12,
          step: 0.05,
          live: "MORTGAGE30US",
          dp: 2,
        }) +
        box({
          k: "cut",
          label: "Rate cut per point",
          type: "pct",
          value: 0.25,
          min: 0.05,
          max: 0.5,
          step: 0.01,
          dp: 2,
        }) +
        box({
          k: "term",
          label: "Term",
          type: "seg",
          value: 30,
          wide: true,
          options: [
            [15, "15 yr"],
            [30, "30 yr"],
          ],
        }),
    },
    {
      id: "tool-refi",
      label: "Refinance",
      hint: "Does it pay off?",
      intro: "A lower payment is not the same as a lower cost. This counts both.",
      boxes:
        box({
          k: "balance",
          label: "What you owe now",
          value: 310000,
          min: 20000,
          max: 1500000,
          step: 5000,
        }) +
        box({
          k: "rate",
          label: "Your rate now",
          type: "pct",
          value: 8,
          min: 2,
          max: 12,
          step: 0.05,
          dp: 2,
        }) +
        box({
          k: "newRate",
          label: "New rate",
          type: "pct",
          value: r100,
          min: 2,
          max: 12,
          step: 0.05,
          live: "MORTGAGE30US",
          dp: 2,
        }),
      more:
        box({
          k: "left",
          label: "Years left on it",
          type: "num",
          value: 27,
          min: 1,
          max: 30,
          step: 1,
        }) +
        box({ k: "costs", label: "Closing costs", value: 6200, min: 0, max: 30000, step: 100 }) +
        box({
          k: "newTerm",
          label: "New term",
          type: "seg",
          value: 30,
          wide: true,
          options: [
            [15, "15 yr"],
            [20, "20 yr"],
            [30, "30 yr"],
          ],
        }) +
        box({
          k: "roll",
          label: "Roll the costs into the new loan",
          type: "check",
          value: false,
          wide: true,
        }),
    },
  ];

  const cards = [
    {
      big: `Year ${y(am.crossoverMonth)}`,
      line: "when your payment finally pays more house than interest.",
      back: `Interest is charged on what you still owe, and at the start you owe the most. Of the first ${money(pi)} payment, ${money(am.rows[0].interest)} is interest.`,
    },
    {
      big: `+${money(total - pi)}`,
      line: "a month for taxes, insurance and PMI, on top of the loan.",
      back: "Your lender collects these with the payment and pays them for you. They can rise every year, even on a fixed rate.",
    },
    {
      big: `Month ${ms.requestMonth}`,
      line: `when you can ask to drop PMI. Wait, and it runs to month ${ms.automaticMonth}.`,
      back: `PMI protects the lender, not you. Ask to cancel it once you owe 80% of the home's original price. Asking saves ${money(pmiSaved)} here.`,
    },
    {
      big: `${money(onePoint)}`,
      line: "a month: the cost of one percentage point of rate on this loan.",
      back: "That is why shopping lenders pays. Freddie Mac found one extra quote saves about $1,500 over a loan, and five save about $3,000.",
    },
  ];

  const slips = [
    {
      title: "Budgeting on the loan payment alone",
      cost: `${money(total - pi)}/mo`,
      fix: "Plan on the full payment, plus about 1% of the home's value a year for repairs.",
    },
    {
      title: "Waiting for PMI to drop on its own",
      cost: money(pmiSaved),
      fix: `Note when you'll owe 80% of the original price and ask your servicer, in writing, to cancel ${t("pmi")}.`,
    },
    {
      title: "Comparing rates instead of Loan Estimates",
      cost: "$1,500+",
      fix: `Get three ${t("loan-estimate", "Loan Estimates")} the same day. Compare fees on page 2 and the ${t("apr")} on page 3.`,
    },
    {
      title: "Refinancing into a fresh 30 years",
      cost: refi.lifetimeChange > 0 ? money(refi.lifetimeChange) : "more interest",
      fix: "Compare what you will pay in total, not the monthly payment. A shorter new term often wins.",
    },
    {
      title: "Buying points you won't keep",
      cost: `${money(loan * 0.01)}/pt`,
      fix: "Only pay for points if you will keep the loan past the break-even, often 5+ years.",
    },
  ];

  const L = [
    { kind: "section", desc: "The loan" },
    {
      n: 1,
      desc: "Home price",
      sub: `Median sales price, ${k.asOf(k.rates.series.MSPUS.latest.date, "quarterly")} (Census and HUD)`,
      amt: num(price),
    },
    { n: 2, desc: "Down payment, 10%", op: "Line 1 × 10%", amt: `(${num(down)})`, neg: true },
    { n: 3, desc: "Loan amount", op: "Line 1 − line 2", amt: num(loan) },
    { kind: "section", desc: "The monthly payment" },
    {
      n: 4,
      desc: "Interest rate, 30-year fixed",
      sub: `Freddie Mac average, ${k.asOf(k.rates.series.MORTGAGE30US.latest.date)}`,
      amt: pct(r, 2, true),
    },
    { n: 5, desc: "Monthly rate", op: "Line 4 ÷ 12", amt: pct(r / 12, 4, true) },
    {
      n: 6,
      desc: "Principal and interest",
      op: "<code>L3 × r ÷ (1 − (1 + r)<sup>−360</sup>)</code>, r = line 5",
      amt: num(pi),
    },
    {
      n: 7,
      desc: "Property tax",
      sub: "National average effective rate 0.90% (ATTOM, 2025)",
      op: "Line 1 × 0.90% ÷ 12",
      amt: num(tax),
    },
    {
      n: 8,
      desc: "Homeowners insurance",
      sub: "Projected 2026 national average, $3,057 a year (Insurify)",
      op: "$3,057 ÷ 12",
      amt: num(ins),
    },
    {
      n: 9,
      desc: "PMI at 0.50% a year",
      sub: "Typical range 0.46% to 1.50% (Urban Institute)",
      op: "Line 3 × 0.50% ÷ 12",
      amt: num(pmi),
    },
    {
      n: 10,
      desc: "Total monthly payment",
      op: "Lines 6 + 7 + 8 + 9",
      amt: num(total),
      kind: "total",
    },
    { kind: "section", desc: "Inside payment 1" },
    { n: 11, desc: "Interest in month 1", op: "Line 3 × line 5", amt: num(am.rows[0].interest) },
    { n: 12, desc: "Principal in month 1", op: "Line 6 − line 11", amt: num(am.rows[0].principal) },
    { kind: "section", desc: "Over the life of the loan" },
    {
      n: 13,
      desc: "All 360 principal and interest payments",
      op: "Line 6 × 360 (last one adjusted)",
      amt: num(am.totalPaid),
    },
    {
      n: 14,
      desc: "Total interest",
      op: "Line 13 − line 3",
      amt: num(am.totalInterest),
      kind: "total",
    },
    {
      n: 15,
      desc: "You can ask to cancel PMI",
      sub: `Scheduled balance reaches 80% of line 1 (${money(price * 0.8)})`,
      amt: `month ${ms.requestMonth}`,
    },
    {
      n: 16,
      desc: "PMI ends automatically",
      sub: `Scheduled balance reaches 78% of line 1 (${money(price * 0.78)})`,
      amt: `month ${ms.automaticMonth}`,
    },
    {
      n: 17,
      desc: "PMI saved by asking at 80%",
      op: "Automatic total − requested total",
      amt: num(pmiSaved),
    },
  ];
  const example = `<p>A median-priced home with 10% down at this week's average rate. The same formula reproduces the CFPB's sample Loan Estimate to the cent.</p>${lines(L, "Worked mortgage example")}`;

  return {
    slug: "mortgage",
    title: "Mortgage: what a home really costs | Moneywise",
    description:
      "Your full monthly mortgage payment, why early payments are mostly interest, when PMI ends, and whether extra payments, points or a refinance pay off. Live rates, every step shown.",
    body: k.topic({
      slug: "mortgage",
      sub: "What a home really costs, every month and over the years.",
      chip: `30-year average today <b>${rate("MORTGAGE30US")}</b> <small>${asof("MORTGAGE30US")}</small>`,
      hero,
      cards,
      slips,
      more,
      example,
      sources: [
        "pmms",
        "mspus",
        "attom-tax",
        "insurify-home",
        "pmi-cost",
        "cfpb-pmi",
        "hud-mip",
        "fhfa-cll",
        "freddie-quotes",
        "cfpb-le",
      ],
    }),
  };
};
