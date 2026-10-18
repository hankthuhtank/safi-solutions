/* Mortgage: the payment calculator and three more on demand. */
import { boot, registerTool, startTools, bindBoxes, figs, verdict, draw, $ } from "../ui.js";
import { createTape } from "../tape.js";
import * as c from "../calc.js";
import { money, moneyShort, pct, num, duration } from "../format.js";

boot();

const C = {
  principal: "var(--series-1)",
  interest: "var(--series-2)",
  blue: "var(--series-3)",
  pmi: "var(--series-4)",
  teal: "var(--series-5)",
};
const yr = (m) => Math.ceil(m / 12);
const yearly = (rows) => {
  const out = [];
  rows.forEach((r, i) => {
    const y = Math.floor(i / 12);
    out[y] ??= { interest: 0, principal: 0, pmi: 0, balance: 0 };
    out[y].interest += r.interest;
    out[y].principal += r.principal + r.extra;
    out[y].pmi += r.pmi;
    out[y].balance = r.balance;
  });
  return out;
};
const splitSpec = (ys, title) => ({
  type: "bars",
  stacked: true,
  title,
  height: 250,
  desc: "Each column is one year of payments, split into principal, interest and mortgage insurance",
  x: { values: ys.map((_, i) => i + 1), format: (v) => `Yr ${v}`, label: "Year" },
  tableLabel: "Year",
  y: { format: moneyShort },
  series: [
    {
      key: "p",
      label: "Principal",
      color: C.principal,
      values: ys.map((y) => y.principal),
      format: (v) => money(v),
    },
    {
      key: "i",
      label: "Interest",
      color: C.interest,
      values: ys.map((y) => y.interest),
      format: (v) => money(v),
    },
    ...(ys.some((y) => y.pmi > 0)
      ? [
          {
            key: "m",
            label: "PMI",
            color: C.pmi,
            values: ys.map((y) => y.pmi),
            format: (v) => money(v),
          },
        ]
      : []),
  ],
});

/* ------------------------------------------------ payment & schedule */
registerTool("tool-pay", (panel) => {
  const tape = createTape($("[data-tape]", panel));
  const update = (v) => {
    const term = Number(v.term) || 30,
      months = term * 12;
    const down = v.price * v.downPct,
      loan = Math.max(0, v.price - down);
    const needsPmi = loan > 0.8 * v.price && v.pmiPct > 0;
    const am = c.amortize({
      principal: loan,
      annualRate: v.rate,
      months,
      pmi: needsPmi
        ? { annualRate: v.pmiPct, originalValue: v.price, removeAt: v.request ? "request" : "auto" }
        : null,
    });
    const pi = am.payment,
      tax = c.cents((v.price * v.taxPct) / 12),
      ins = c.cents(v.ins / 12),
      pmi = am.pmiMonthly,
      hoa = v.hoa;
    const total = pi + tax + ins + pmi + hoa;
    figs($("[data-figs]", panel), [
      {
        label: "Monthly payment",
        value: money(total),
        note: `${money(pi)} is principal and interest`,
        hero: true,
      },
      {
        label: "Total interest",
        value: money(am.totalInterest),
        note: `over ${term} years`,
        tone: "bad",
      },
      {
        label: "Principal passes interest",
        value: am.crossoverMonth ? `Year ${yr(am.crossoverMonth)}` : "–",
        note: am.crossoverMonth ? `payment ${am.crossoverMonth}` : "",
      },
      {
        label: "PMI paid",
        value: money(am.pmiTotal),
        note: needsPmi ? `${am.pmiEndMonth} months` : "20% or more down",
      },
    ]);
    if (needsPmi) {
      const ms = c.pmiMilestones({
        principal: loan,
        annualRate: v.rate,
        months,
        originalValue: v.price,
      });
      verdict(
        $("[data-verdict]", panel),
        `Ask to cancel PMI at **payment ${ms.requestMonth}** (year ${yr(ms.requestMonth)}). If you don't, it runs to payment ${ms.automaticMonth}.`,
        "info",
      );
    } else
      verdict($("[data-verdict]", panel), `With **${pct(v.downPct, 1)} down**, there is no PMI.`);
    $("[data-verdict]", panel).hidden = false;
    draw(panel, "split", splitSpec(yearly(am.rows), "Where each year of payments goes"));
    tape.print([
      { label: "Home price", v: v.price, op: "add" },
      { label: `Down payment ${pct(v.downPct, 1)}`, v: down, op: "sub" },
      { label: "Loan amount", v: loan, kind: "subtotal" },
      { label: "Annual rate", text: pct(v.rate, 3, true), op: "none" },
      { label: "Monthly rate (÷ 12)", text: pct(v.rate / 12, 4, true), op: "div" },
      { label: "Number of payments", text: String(months), op: "none" },
      { label: "Principal & interest", v: pi, op: "eq" },
      { label: "Property tax", v: tax, op: "add" },
      { label: "Home insurance", v: ins, op: "add" },
      { label: "PMI", v: pmi, op: "add" },
      { label: "HOA dues", v: hoa, op: "add" },
      { label: "Monthly payment", v: total, kind: "total" },
      { kind: "gap" },
      { label: `${am.months} P&I payments`, v: am.totalPaid, op: "add" },
      { label: "Loan amount", v: loan, op: "sub" },
      { label: "Total interest", v: am.totalInterest, kind: "total" },
      ...(needsPmi
        ? [{ label: `PMI for ${am.pmiEndMonth} months`, v: am.pmiTotal, op: "none" }]
        : []),
      {
        kind: "note",
        label: `First payment: ${money(am.rows[0].interest, { cents: true })} interest, ${money(am.rows[0].principal, { cents: true })} principal.`,
      },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ extra payments */
registerTool("tool-extra", (panel) => {
  const tape = createTape($("[data-tape]", panel));
  const update = (v) => {
    const months = (Number(v.term) || 30) * 12;
    const base = c.amortize({ principal: v.loan, annualRate: v.rate, months });
    const lumpMonth = Math.max(1, Math.round(v.lumpYear) * 12 - 11);
    const fast = c.amortize({
      principal: v.loan,
      annualRate: v.rate,
      months,
      extraMonthly: v.extra,
      extraOnce: v.lump > 0 ? { month: lumpMonth, amount: v.lump } : null,
    });
    const saved = base.totalInterest - fast.totalInterest,
      cut = base.months - fast.months;
    figs($("[data-figs]", panel), [
      {
        label: "Paid off sooner by",
        value: duration(cut),
        note: `in ${duration(fast.months)} instead of ${duration(base.months)}`,
        hero: true,
        tone: "good",
      },
      { label: "Interest saved", value: money(saved), tone: "good" },
      { label: "Extra you put in", value: money(fast.totalExtra) },
    ]);
    const per = fast.totalExtra > 0 ? saved / fast.totalExtra : 0;
    verdict(
      $("[data-verdict]", panel),
      fast.totalExtra > 0
        ? `Every extra dollar you send saves about **${money(per, { cents: true })}** of interest, a guaranteed return equal to your ${pct(v.rate, 2, true)} rate.`
        : "Add an extra monthly amount or a one-time payment to see the difference.",
      fast.totalExtra > 0 ? "" : "info",
    );
    $("[data-verdict]", panel).hidden = false;
    const n = Math.ceil(base.months / 12);
    const balAt = (s, y) =>
      y === 0 ? v.loan : (s.rows[Math.min(s.rows.length, y * 12) - 1] || { balance: 0 }).balance;
    draw(panel, "bal", {
      type: "line",
      title: "What you still owe",
      height: 230,
      desc: "Balance with and without the extra payments",
      x: {
        values: Array.from({ length: n + 1 }, (_, i) => i),
        format: (v2) => (v2 ? `Year ${v2}` : "Start"),
      },
      y: { format: moneyShort },
      series: [
        {
          key: "a",
          label: "As scheduled",
          color: C.interest,
          values: Array.from({ length: n + 1 }, (_, i) => balAt(base, i)),
          format: (x) => money(x),
        },
        {
          key: "b",
          label: "With extra payments",
          color: C.principal,
          values: Array.from({ length: n + 1 }, (_, i) =>
            i * 12 > fast.months + 11 ? null : balAt(fast, i),
          ),
          format: (x) => money(x),
        },
      ],
    });
    tape.print([
      { label: "Loan amount", v: v.loan, kind: "subtotal" },
      { label: "Rate", text: pct(v.rate, 3, true) },
      { label: "Scheduled payment", v: base.payment, op: "eq" },
      { label: "Extra each month", v: v.extra, op: "add" },
      ...(v.lump > 0 ? [{ label: `One-time, month ${lumpMonth}`, v: v.lump, op: "add" }] : []),
      { kind: "gap" },
      { label: "Interest, no extra", v: base.totalInterest, op: "add" },
      { label: "Interest, with extra", v: fast.totalInterest, op: "sub" },
      { label: "Interest saved", v: saved, kind: "total" },
      { label: "Months, no extra", text: String(base.months) },
      { label: "Months, with extra", text: String(fast.months), op: "sub" },
      { label: "Months saved", text: String(cut), kind: "total" },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ points */
registerTool("tool-points", (panel) => {
  const tape = createTape($("[data-tape]", panel));
  const update = (v) => {
    const months = (Number(v.term) || 30) * 12,
      h = Math.min(months, Math.round(v.years * 12));
    const p = c.pointsDeal({
      loan: v.loan,
      annualRate: v.rate,
      months,
      points: v.points,
      ratePerPoint: v.cut,
      horizonMonths: h,
    });
    const net = p.netAtHorizon;
    figs($("[data-figs]", panel), [
      {
        label: "Points cost at closing",
        value: money(p.cost),
        note: `${num(v.points, 2)} × 1% of the loan`,
      },
      {
        label: "New rate",
        value: pct(p.newRate, 3, true),
        note: `${money(p.monthlySavings, { cents: true })} less a month`,
      },
      {
        label: "Break-even",
        value: Number.isFinite(p.simpleBreakEven)
          ? duration(Math.ceil(p.simpleBreakEven))
          : "never",
        note: `cost ÷ monthly savings; ${Number.isFinite(p.trueBreakEven) ? duration(p.trueBreakEven) : "never"} counting the smaller balance you would owe`,
        hero: true,
      },
      {
        label: `After ${v.years} years you are`,
        value: (net >= 0 ? "ahead " : "behind ") + money(Math.abs(net)),
        tone: net >= 0 ? "good" : "bad",
      },
    ]);
    verdict(
      $("[data-verdict]", panel),
      net >= 0
        ? `Worth it **if you keep the loan ${duration(p.trueBreakEven)} or more**. Sell sooner and the points are lost.`
        : `Not worth it over ${v.years} years. You would need to keep the loan **${duration(p.trueBreakEven)}**.`,
      net >= 0 ? "" : "warn",
    );
    $("[data-verdict]", panel).hidden = false;
    const xs = Array.from({ length: Math.ceil(months / 12) + 1 }, (_, i) => i);
    draw(panel, "net", {
      type: "line",
      title: "Ahead or behind, if you sell or refinance in year…",
      height: 230,
      desc: "Monthly savings plus the smaller balance, minus the cost of the points",
      x: { values: xs, format: (y) => (y ? `Year ${y}` : "Closing") },
      y: { format: moneyShort, zero: false },
      series: [
        {
          key: "n",
          label: "Net position",
          color: C.blue,
          values: xs.map((y) => (y === 0 ? -p.cost : p.netAt(y * 12))),
          format: (x) => (x >= 0 ? "+" : "") + money(x),
        },
      ],
      annotations: [{ x: Math.min(months / 12, v.years), label: `${v.years} yrs` }],
    });
    tape.print([
      { label: "Loan amount", v: v.loan },
      { label: "Points", text: num(v.points, 2), op: "mul" },
      { label: "Cost (1% each)", v: p.cost, kind: "subtotal" },
      { label: "Rate before", text: pct(v.rate, 3, true) },
      {
        label: `Rate cut ${num(v.points, 2)} × ${pct(v.cut, 3, true)}`,
        text: pct(v.rate - p.newRate, 3, true),
        op: "sub",
      },
      { label: "Rate after", text: pct(p.newRate, 3, true), op: "eq" },
      { label: "Payment before", v: p.payment },
      { label: "Payment after", v: p.newPayment, op: "sub" },
      { label: "Monthly savings", v: p.monthlySavings, kind: "subtotal" },
      {
        label: "Cost ÷ savings",
        text: Number.isFinite(p.simpleBreakEven) ? num(p.simpleBreakEven, 1) + " mo" : "never",
        op: "div",
      },
      { label: `Net after ${v.years} years`, v: net, kind: "total" },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ refinance */
registerTool("tool-refi", (panel) => {
  const tape = createTape($("[data-tape]", panel));
  const update = (v) => {
    const rem = Math.round(v.left * 12),
      nm = (Number(v.newTerm) || 30) * 12;
    const rf = c.refinance({
      balance: v.balance,
      annualRate: v.rate,
      remainingMonths: rem,
      newRate: v.newRate,
      newMonths: nm,
      costs: v.costs,
      rollIn: v.roll,
    });
    const lowers = rf.monthlySavings > 0;
    figs($("[data-figs]", panel), [
      { label: "New payment", value: money(rf.newPayment), note: `now ${money(rf.oldPayment)}` },
      { label: "Monthly savings", value: money(rf.monthlySavings), tone: lowers ? "good" : "bad" },
      {
        label: "Simple break-even",
        value: lowers ? duration(Math.ceil(rf.simpleBreakEven)) : "never",
        note: "costs ÷ savings",
      },
      {
        label: "True break-even",
        value: Number.isFinite(rf.trueBreakEven) ? duration(rf.trueBreakEven) : "never",
        note: "counts what you still owe",
        hero: true,
      },
      {
        label: "Lifetime cost change",
        value: (rf.lifetimeChange > 0 ? "+" : "") + money(rf.lifetimeChange),
        tone: rf.lifetimeChange > 0 ? "bad" : "good",
        note: "all payments + costs",
      },
    ]);
    const restart = nm > rem;
    verdict(
      $("[data-verdict]", panel),
      !lowers
        ? "This does not lower your payment. Refinance only for another reason, like a shorter term."
        : rf.lifetimeChange > 0 && restart
          ? `The payment drops ${money(rf.monthlySavings)}, but the longer loan costs **${money(rf.lifetimeChange)} more** in total. Keep paying your old amount to fix that.`
          : `Lower payment and lower total cost. You come out ahead after **${duration(rf.trueBreakEven)}**.`,
      !lowers || rf.lifetimeChange > 0 ? "warn" : "",
    );
    $("[data-verdict]", panel).hidden = false;
    const ys = Array.from({ length: Math.ceil(Math.max(rem, nm) / 12) + 1 }, (_, i) => i);
    draw(panel, "net", {
      type: "line",
      title: "Ahead or behind if you move or pay off in year…",
      height: 230,
      desc: "Payments saved plus the difference in what you would still owe, minus closing costs",
      x: { values: ys, format: (y) => (y ? `Year ${y}` : "Closing") },
      y: { format: moneyShort, zero: false },
      series: [
        {
          key: "n",
          label: "Net position",
          color: C.blue,
          values: ys.map((y) => rf.net[Math.min(rf.net.length - 1, y * 12)]),
          format: (x) => (x >= 0 ? "+" : "") + money(x),
        },
      ],
      annotations: Number.isFinite(rf.trueBreakEven)
        ? [{ x: rf.trueBreakEven / 12, label: "Break-even" }]
        : [],
    });
    tape.print([
      { label: "Balance today", v: v.balance },
      { label: `Payment at ${pct(v.rate, 2, true)}, ${duration(rem)}`, v: rf.oldPayment, op: "eq" },
      {
        label: `Payment at ${pct(v.newRate, 2, true)}, ${duration(nm)}`,
        v: rf.newPayment,
        op: "sub",
      },
      { label: "Monthly savings", v: rf.monthlySavings, kind: "subtotal" },
      { label: "Closing costs", v: v.costs, op: v.roll ? "add" : "none" },
      {
        label: "Costs ÷ savings",
        text: lowers ? num(rf.simpleBreakEven, 1) + " mo" : "never",
        op: "div",
      },
      { kind: "gap" },
      { label: "Old loan, payments left", v: rf.oldPayment * rem, op: "add" },
      { label: "New loan, payments", v: rf.newPayment * nm, op: "sub" },
      ...(v.roll ? [] : [{ label: "Costs paid at closing", v: v.costs, op: "sub" }]),
      { label: "Lifetime difference", v: -rf.lifetimeChange, kind: "total" },
      {
        kind: "note",
        label:
          rf.lifetimeChange > 0
            ? "Red total: the refinance costs more over its full life."
            : "Black total: the refinance saves money over its full life.",
      },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

startTools();
