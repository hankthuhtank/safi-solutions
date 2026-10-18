// Car loans: the total-cost calculator, four cards, five costly mistakes.
import * as calc from "../../js/calc.js";
import { money, pct, num } from "../../js/format.js";

export default (k) => {
  const { t, box, lines, rate, asof, val } = k;
  const price = 49855,
    taxRate = 0.06,
    fees = 800,
    down = 5000,
    apr = 0.0635,
    months = 72;
  const deal = (m) => calc.autoDeal({ price, taxRate, fees, down, apr, months: m });
  const d = deal(72),
    d84 = deal(84);
  const pay = calc.cents(d.payment);
  const am = calc.amortize({ principal: d.financed, annualRate: apr, months });
  const uw = calc.underwaterMonths(d.financed, apr, months, price);
  const uw84 = calc.underwaterMonths(d84.financed, apr, 84, price);
  const y1 = am.rows.slice(0, 12).reduce((s, r) => s + r.interest, 0);
  const onePoint =
    calc.autoDeal({ price, taxRate, fees, down, apr: apr + 0.01, months }).totalInterest -
    d.totalInterest;
  const addOn = calc.payment(2000, apr, months) * months;
  const bank = val("TERMCBAUTO48NS");
  const term = (
    v,
    opts = [
      [36, "36"],
      [48, "48"],
      [60, "60"],
      [72, "72"],
      [84, "84"],
    ],
  ) => box({ k: "months", label: "Months", type: "seg", value: v, options: opts });

  const hero = {
    id: "tool-deal",
    label: "What this car really costs",
    boxes:
      box({ k: "price", label: "Car price", value: price, min: 5000, max: 150000, step: 500 }) +
      box({ k: "down", label: "Cash down", value: down, min: 0, max: 50000, step: 500 }) +
      box({
        k: "apr",
        label: "Loan rate (APR)",
        type: "pct",
        value: bank,
        min: 0,
        max: 25,
        step: 0.05,
        live: "TERMCBAUTO48NS",
        dp: 2,
      }) +
      term(72),
    more:
      box({
        k: "taxRate",
        label: "Sales tax",
        type: "pct",
        value: 6,
        min: 0,
        max: 11,
        step: 0.25,
        dp: 2,
      }) +
      box({
        k: "fees",
        label: "Title, tag and doc fees",
        value: fees,
        min: 0,
        max: 5000,
        step: 50,
      }) +
      box({ k: "rebate", label: "Rebate", value: 0, min: 0, max: 15000, step: 250 }) +
      box({ k: "addOns", label: "Add-ons financed", value: 0, min: 0, max: 10000, step: 100 }) +
      box({ k: "tradeValue", label: "Trade-in value", value: 0, min: 0, max: 80000, step: 500 }) +
      box({ k: "tradeOwed", label: "Still owed on it", value: 0, min: 0, max: 80000, step: 500 }),
  };

  const more = [
    {
      id: "tool-promo",
      label: "0% or rebate?",
      hint: "Which deal wins",
      intro: "Dealers often offer a cash rebate or a low rate, not both.",
      boxes:
        box({
          k: "rebate",
          label: "Rebate you give up",
          value: 4000,
          min: 0,
          max: 15000,
          step: 250,
        }) +
        box({
          k: "promoApr",
          label: "Dealer's promo rate",
          type: "pct",
          value: 0,
          min: 0,
          max: 8,
          step: 0.1,
          dp: 2,
        }) +
        box({
          k: "bankApr",
          label: "Your bank's rate",
          type: "pct",
          value: bank,
          min: 0,
          max: 25,
          step: 0.05,
          live: "TERMCBAUTO48NS",
          dp: 2,
        }),
      more:
        box({ k: "price", label: "Car price", value: 45000, min: 5000, max: 150000, step: 500 }) +
        box({ k: "down", label: "Cash down", value: 0, min: 0, max: 30000, step: 500 }) +
        box({
          k: "months",
          label: "Months (both)",
          type: "seg",
          value: 60,
          wide: true,
          options: [
            [36, "36"],
            [48, "48"],
            [60, "60"],
            [72, "72"],
          ],
        }),
    },
    {
      id: "tool-deduct",
      label: "Interest deduction",
      hint: "New for 2025 to 2028",
      intro: "New cars with final assembly in the U.S., for personal use. Not leases or used cars.",
      boxes:
        box({
          k: "loan",
          label: "Amount financed",
          value: Math.round(d.financed),
          min: 1000,
          max: 150000,
          step: 500,
        }) +
        box({
          k: "apr",
          label: "Loan rate (APR)",
          type: "pct",
          value: 6.35,
          min: 0,
          max: 25,
          step: 0.05,
          dp: 2,
        }) +
        box({
          k: "magi",
          label: "Your income",
          hint: "modified AGI",
          value: 95000,
          min: 0,
          max: 400000,
          step: 1000,
        }),
      more:
        box({
          k: "months",
          label: "Months",
          type: "seg",
          value: 72,
          wide: true,
          options: [
            [36, "36"],
            [48, "48"],
            [60, "60"],
            [72, "72"],
            [84, "84"],
          ],
        }) +
        box({
          k: "filing",
          label: "Filing",
          type: "seg",
          value: "single",
          wide: true,
          options: [
            ["single", "Single / HoH"],
            ["mfj", "Joint"],
          ],
        }) +
        box({
          k: "bracket",
          label: "Tax bracket",
          type: "sel",
          value: "0.22",
          options: [
            ["0.10", "10%"],
            ["0.12", "12%"],
            ["0.22", "22%"],
            ["0.24", "24%"],
            ["0.32", "32%"],
            ["0.35", "35%"],
            ["0.37", "37%"],
          ],
        }) +
        box({
          k: "startMonth",
          label: "First payment",
          type: "sel",
          value: "1",
          options: [
            ["1", "January"],
            ["4", "April"],
            ["7", "July"],
            ["10", "October"],
          ],
        }) +
        box({
          k: "usa",
          label: "New, U.S.-assembled, personal use",
          type: "check",
          value: true,
          wide: true,
        }),
    },
  ];

  const cards = [
    {
      big: money(am.totalInterest),
      line: `of interest on an average new car, over ${months} months.`,
      back: `Add tax and fees and a ${money(price)} car costs ${money(down + am.totalPaid)} by the last payment. The monthly payment hides that total.`,
    },
    {
      big: `${uw.months} months`,
      line: "you would owe more than the car is worth.",
      back: "New cars lose about 20% of their value in year one. With little down and a long loan, the balance stays above the value. If it's totaled, you owe the gap.",
    },
    {
      big: "29.6%",
      line: "of trade-ins are underwater, by $6,884 on average.",
      back: "That old debt usually gets folded into the new loan, so you keep paying interest on a car you no longer own. (Edmunds, Q2 2026)",
    },
    {
      big: "$10,000",
      line: "a year of new-car loan interest you can now deduct.",
      back: "For 2025 to 2028, even with the standard deduction. The car must be new and assembled in the U.S. The deduction shrinks above $100,000 of income.",
    },
  ];

  const slips = [
    {
      title: "Shopping by monthly payment",
      cost: `+${money(d84.totalInterest - d.totalInterest)}`,
      fix: `Stretching to 84 months adds that much interest. Agree on the ${t("out-the-door", "out-the-door price")} first, in writing.`,
    },
    {
      title: "Rolling an old loan into the new one",
      cost: "$6,884 avg",
      fix: "Keep the current car longer, or pay the gap down in cash before you trade.",
    },
    {
      title: "Taking dealer financing without a quote",
      cost: `${money(onePoint)}/pt`,
      fix: `Get pre-approved by a bank or credit union first. Each point of ${t("dealer-markup", "markup")} costs that much here.`,
    },
    {
      title: "Financing $2,000 of add-ons",
      cost: money(addOn),
      fix: `Say no at the table. ${t("gap-insurance", "GAP")} is often cheaper from your own insurer.`,
    },
    {
      title: "Missing the new interest deduction",
      cost: `${money(y1 * 0.22)}/yr`,
      fix: "Check the window sticker for U.S. final assembly and claim it on Schedule 1-A.",
    },
  ];

  const L = [
    { kind: "section", desc: "The deal" },
    {
      n: 1,
      desc: "Vehicle price",
      sub: "Average new-vehicle transaction price, July 2026 (Kelley Blue Book)",
      amt: num(price),
    },
    {
      n: 2,
      desc: "Sales tax at 6%",
      sub: "Example rate; state and local rates vary from 0% to over 10%",
      op: "Line 1 × 6%",
      amt: num(d.tax),
    },
    {
      n: 3,
      desc: "Title, registration and doc fee",
      sub: "Example; dealer documentation fees vary widely by state",
      amt: num(fees),
    },
    {
      n: 4,
      desc: "Out-the-door price",
      op: "Lines 1 + 2 + 3",
      amt: num(d.outTheDoor),
      kind: "total",
    },
    { n: 5, desc: "Cash down", amt: `(${num(down)})`, neg: true },
    { n: 6, desc: "Amount financed", op: "Line 4 − line 5", amt: num(d.financed) },
    { kind: "section", desc: "The loan" },
    {
      n: 7,
      desc: "APR",
      sub: "Average new-vehicle loan rate, Q2 2026 (Experian)",
      amt: pct(apr, 2, true),
    },
    { n: 8, desc: "Term", sub: "Near the 69.5-month average (Experian)", amt: `${months} months` },
    {
      n: 9,
      desc: "Monthly payment",
      op: "<code>L6 × r ÷ (1 − (1 + r)<sup>−72</sup>)</code>, r = line 7 ÷ 12",
      amt: num(pay),
    },
    { n: 10, desc: "All 72 payments", op: "Line 9 × 72", amt: num(am.totalPaid) },
    {
      n: 11,
      desc: "Total interest",
      op: "Line 10 − line 6",
      amt: num(am.totalInterest),
      kind: "total",
    },
    {
      n: 12,
      desc: "What the car costs you in all",
      op: "Line 5 + line 10",
      amt: num(down + am.totalPaid),
      kind: "total",
    },
    { kind: "section", desc: "Value versus balance" },
    {
      n: 13,
      desc: "Months the loan is underwater",
      sub: "Balance above the car's estimated value (about 20% lost in year one, then 16% a year)",
      amt: `${uw.first} to ${uw.last}`,
    },
    { n: 14, desc: "Deepest gap", amt: num(uw.worst) },
    { n: 15, desc: "Same deal over 84 months: underwater", amt: `${uw84.first} to ${uw84.last}` },
    { kind: "section", desc: "Tax year one (if the car qualifies)" },
    { n: 16, desc: "Interest paid in the first 12 payments", amt: num(y1) },
    {
      n: 17,
      desc: "Tax saved in the 22% bracket",
      sub: "Car loan interest deduction, income under $100,000",
      op: "Line 16 × 22%",
      amt: num(y1 * 0.22),
    },
  ];
  const example = `<p>An average-priced new car with $5,000 down, financed at the average new-car rate for 72 months.</p>${lines(L, "Worked car loan example")}`;

  return {
    slug: "car",
    title: "Car loans: what a car really costs | Moneywise",
    description:
      "What a car costs once tax, fees, interest and depreciation are counted, why a longer loan hurts, 0% financing versus a rebate, and the new car loan interest deduction.",
    body: k.topic({
      slug: "car",
      sub: "What a car really costs by the time it's paid off.",
      chip: `New-car loan rate at banks <b>${rate("TERMCBAUTO48NS")}</b> <small>${asof("TERMCBAUTO48NS")}</small>`,
      hero,
      cards,
      slips,
      more,
      example,
      sources: [
        "experian-auto",
        "kbb-atp",
        "edmunds-neg",
        "depreciation",
        "g19",
        "irs-sch1a",
        "irs-obbba",
      ],
    }),
  };
};
