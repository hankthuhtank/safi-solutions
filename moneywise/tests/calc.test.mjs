// Moneywise: verification of the math against primary-source examples.
// Run from the repository root:  node --test moneywise/tests/calc.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as c from "../js/calc.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const TAX = JSON.parse(fs.readFileSync(path.join(here, "../data/tax-2026.json"), "utf8"));
const LIMITS = JSON.parse(fs.readFileSync(path.join(here, "../data/limits-2026.json"), "utf8"));
const to = (x, d = 2) => Number(x.toFixed(d));

/* ------------------------------------------------ amortization
   CFPB sample Loan Estimate (H-24(B)) and Closing Disclosure (H-25(B)): $162,000 at 3.875% for 30 years.
   https://files.consumerfinance.gov/f/201311_cfpb_kbyo_loan-estimate.pdf
   https://files.consumerfinance.gov/f/201311_cfpb_kbyo_closing-disclosure.pdf */
test("amortization: CFPB sample loan, monthly principal & interest is $761.78", () => {
  assert.equal(c.cents(c.payment(162000, 0.03875, 360)), 761.78);
});

test("amortization: CFPB sample loan, principal paid off in 5 years is $15,773", () => {
  const s = c.amortize({ principal: 162000, annualRate: 0.03875, months: 360 });
  const paid = s.rows.slice(0, 60).reduce((sum, r) => sum + r.principal, 0);
  assert.equal(Math.round(paid), 15773);
});

test("amortization: CFPB sample loan, 360 payments retire the balance exactly", () => {
  const s = c.amortize({ principal: 162000, annualRate: 0.03875, months: 360 });
  assert.equal(s.months, 360);
  assert.equal(s.rows.at(-1).balance, 0);
  assert.equal(to(s.totalPrincipal), 162000);
});

test("amortization: CFPB sample loan, Total Interest Percentage is 69.46% with $279.04 prepaid interest", () => {
  const s = c.amortize({ principal: 162000, annualRate: 0.03875, months: 360 });
  assert.equal(to(((s.totalInterest + 279.04) / 162000) * 100), 69.46);
});

test("amortization: closed-form balance agrees with the posted schedule to the dollar", () => {
  const s = c.amortize({ principal: 162000, annualRate: 0.03875, months: 360 });
  for (const k of [12, 60, 120, 240])
    assert.ok(
      Math.abs(c.balanceAfter(162000, 0.03875, 360, k, 761.78) - s.rows[k - 1].balance) < 1,
    );
});

test("amortization: extra principal shortens the loan and cuts interest", () => {
  const base = c.amortize({ principal: 300000, annualRate: 0.07, months: 360 });
  const extra = c.amortize({ principal: 300000, annualRate: 0.07, months: 360, extraMonthly: 200 });
  assert.ok(extra.months < base.months && extra.totalInterest < base.totalInterest);
  assert.equal(to(extra.totalPrincipal), 300000);
});

test("amortization: zero-rate loan divides evenly", () => {
  assert.equal(c.payment(12000, 0, 48), 250);
  assert.equal(c.monthsToPayoff(12000, 0, 250), 48);
});

test("APR from payments: a loan with no fees has an APR equal to its note rate", () => {
  const pay = c.payment(250000, 0.0675, 360);
  assert.equal(to(c.aprFromPayments(250000, pay, 360) * 100, 4), 6.75);
});

test("APR from payments: fees taken from the amount financed raise the APR", () => {
  const pay = c.payment(250000, 0.0675, 360);
  assert.ok(c.aprFromPayments(245000, pay, 360) > 0.0675);
});

test("PMI: scheduled 78% date comes after the 80% date and before the midpoint for a 10%-down loan", () => {
  const m = c.pmiMilestones({
    principal: 360000,
    annualRate: 0.07,
    months: 360,
    originalValue: 400000,
  });
  assert.ok(m.requestMonth < m.automaticMonth && m.automaticMonth <= m.midpointMonth);
});

/* ------------------------------------------------ APR to APY
   Regulation DD (Truth in Savings), 12 CFR 1030, Appendix A, Part I, examples.
   https://www.ecfr.gov/current/title-12/chapter-X/part-1030/appendix-Appendix%20A%20to%20Part%201030 */
test("APY: $61.68 interest on $1,000 for a 365-day year is 6.17%", () => {
  assert.equal(to(c.apyFromInterest(61.68, 1000, 365) * 100), 6.17);
});

test("APY: $30.37 interest on a $1,000 six-month (182-day) certificate is 6.18%", () => {
  assert.equal(to(c.apyFromInterest(30.37, 1000, 182) * 100), 6.18);
});

test("APY: stepped certificate, 5% daily for 91 days then 5.5% for 92 days, earns $26.68 for an APY of 5.39%", () => {
  const interest = c.dailyCompoundInterest(1000, [
    { rate: 0.05, days: 91 },
    { rate: 0.055, days: 92 },
  ]);
  assert.equal(to(interest), 26.68);
  assert.equal(to(c.apyFromInterest(to(interest), 1000, 183) * 100), 5.39);
});

test("APR to APY: daily compounding matches compounding day by day over 365 days", () => {
  const viaFormula = c.aprToApy(0.05, 365);
  const viaDays = c.dailyCompoundInterest(1, [{ rate: 0.05, days: 365 }]);
  assert.ok(Math.abs(viaFormula - viaDays) < 1e-12);
});

test("APR to APY and back is lossless for every compounding frequency", () => {
  for (const n of [1, 4, 12, 365, Infinity]) {
    const apy = c.aprToApy(0.0719, n);
    assert.ok(Math.abs(c.apyToApr(apy, n) - 0.0719) < 1e-12, `n=${n}`);
  }
});

test("APR to APY: more frequent compounding never lowers the yield", () => {
  const ys = [1, 4, 12, 365, Infinity].map((n) => c.aprToApy(0.2119, n));
  for (let i = 1; i < ys.length; i++) assert.ok(ys[i] >= ys[i - 1]);
});

/* ------------------------------------------------ bracket math
   IRS Revenue Procedure 2025-32, section 3.01, Tables 1 to 4 (tax year 2026).
   https://www.irs.gov/pub/irs-drop/rp-25-32.pdf */
for (const status of ["single", "mfj", "hoh", "mfs"]) {
  test(`brackets (${status}): tax at each bracket ceiling equals the next row's published base amount`, () => {
    const b = TAX.brackets[status];
    for (let i = 0; i < b.length - 1; i++)
      assert.equal(c.bracketTax(b[i].upTo, b).tax, b[i + 1].base, `at $${b[i].upTo}`);
  });
  test(`brackets (${status}): every income equals base + rate x excess, as the table is written`, () => {
    const b = TAX.brackets[status];
    for (const income of [5000, 20000, 61234, 99999, 150000, 300000, 450000, 900000]) {
      let lower = 0,
        row = b[0];
      for (const r of b) {
        row = r;
        if (r.upTo == null || income <= r.upTo) break;
        lower = r.upTo;
      }
      assert.equal(
        c.bracketTax(income, b).tax,
        c.cents(row.base + row.rate * (income - lower)),
        `at $${income}`,
      );
    }
  });
}

test("brackets: single filer with $54,400 taxable owes $6,680 at a 22% marginal rate", () => {
  const r = c.bracketTax(54400, TAX.brackets.single);
  assert.equal(r.tax, 6680);
  assert.equal(r.marginal, 0.22);
});

test("brackets: a raise never lowers after-tax income (marginal rates apply only above each line)", () => {
  const b = TAX.brackets.single;
  for (let x = 0; x < 700000; x += 2500) {
    const a = x - c.bracketTax(x, b).tax,
      z = x + 2500 - c.bracketTax(x + 2500, b).tax;
    assert.ok(z > a);
  }
});

test("income tax: $75,000 salary, 6% to a traditional 401(k), single, standard deduction", () => {
  const r = c.incomeTax({ status: "single", wages: 75000, preTax: 4500 }, TAX);
  assert.equal(r.agi, 70500);
  assert.equal(r.taxable, 54400);
  assert.equal(r.tax, 6680);
});

/* IRS Tax Table, 2025: Form 1040 instructions (https://www.irs.gov/pub/irs-pdf/i1040gi.pdf), using the 2025 brackets
   from Rev. Proc. 2024-40 (https://www.irs.gov/pub/irs-drop/rp-24-40.pdf). Rows: [band start, single, joint, separate, head of household]. */
const B2025 = {
  single: [
    { rate: 0.1, upTo: 11925 },
    { rate: 0.12, upTo: 48475 },
    { rate: 0.22, upTo: 103350 },
    { rate: 0.24, upTo: 197300 },
    { rate: 0.32, upTo: 250525 },
    { rate: 0.35, upTo: 626350 },
    { rate: 0.37, upTo: null },
  ],
  mfj: [
    { rate: 0.1, upTo: 23850 },
    { rate: 0.12, upTo: 96950 },
    { rate: 0.22, upTo: 206700 },
    { rate: 0.24, upTo: 394600 },
    { rate: 0.32, upTo: 501050 },
    { rate: 0.35, upTo: 751600 },
    { rate: 0.37, upTo: null },
  ],
  mfs: [
    { rate: 0.1, upTo: 11925 },
    { rate: 0.12, upTo: 48475 },
    { rate: 0.22, upTo: 103350 },
    { rate: 0.24, upTo: 197300 },
    { rate: 0.32, upTo: 250525 },
    { rate: 0.35, upTo: 375800 },
    { rate: 0.37, upTo: null },
  ],
  hoh: [
    { rate: 0.1, upTo: 17000 },
    { rate: 0.12, upTo: 64850 },
    { rate: 0.22, upTo: 103350 },
    { rate: 0.24, upTo: 197300 },
    { rate: 0.32, upTo: 250500 },
    { rate: 0.35, upTo: 626350 },
    { rate: 0.37, upTo: null },
  ],
};
const TABLE_2025 = [
  [3000, 303, 303, 303, 303],
  [12000, 1205, 1203, 1205, 1203],
  [23000, 2525, 2303, 2525, 2423],
  [48450, 5579, 5340, 5579, 5477],
  [54400, 6888, 6054, 6888, 6191],
  [75000, 11420, 8526, 11420, 9681],
  [99950, 16909, 11823, 16909, 15170],
];
["single", "mfj", "mfs", "hoh"].forEach((status, col) => {
  test(`IRS Tax Table 2025 (${status}): seven published rows reproduced to the dollar`, () => {
    for (const row of TABLE_2025)
      assert.equal(c.irsTaxTable(row[0] + 10, B2025[status]), row[col + 1], `row ${row[0]}`);
  });
});

test("IRS Tax Table 2025: the 2025 bracket bases match Rev. Proc. 2024-40", () => {
  assert.equal(c.bracketTax(48475, B2025.single).tax, 5578.5);
  assert.equal(c.bracketTax(96950, B2025.mfj).tax, 11157);
  assert.equal(c.bracketTax(64850, B2025.hoh).tax, 7442);
  assert.equal(c.bracketTax(626350, B2025.single).tax, 188769.75);
});

/* ------------------------------------------------ Schedule 1-A (2025 to 2028)
   IRS Schedule 1-A (Form 1040), Parts II to V, line by line.  https://www.irs.gov/pub/irs-pdf/f1040s1a.pdf */
test("Schedule 1-A: tips are capped at $25,000 and reduced $100 per full $1,000 of MAGI over $150,000", () => {
  assert.equal(c.schedule1A({ magi: 160000, tips: 30000 }, TAX.schedule1A).tips, 24000);
  assert.equal(c.schedule1A({ magi: 150999, tips: 8000 }, TAX.schedule1A).tips, 8000); // 0.999 rounds down to 0
});

test("Schedule 1-A: car loan interest is reduced $200 per $1,000 over $100,000, rounding the thousands up", () => {
  assert.equal(c.schedule1A({ magi: 100500, carInterest: 3000 }, TAX.schedule1A).carInterest, 2800);
  assert.equal(c.schedule1A({ magi: 150000, carInterest: 12000 }, TAX.schedule1A).carInterest, 0);
});

test("Schedule 1-A: overtime cap doubles for joint filers", () => {
  assert.equal(
    c.schedule1A({ magi: 120000, mfj: true, overtime: 40000 }, TAX.schedule1A).overtime,
    25000,
  );
  assert.equal(c.schedule1A({ magi: 120000, overtime: 40000 }, TAX.schedule1A).overtime, 12500);
});

test("Schedule 1-A: senior deduction falls 6% of MAGI over $75,000", () => {
  assert.equal(c.schedule1A({ magi: 85000, seniors: 1 }, TAX.schedule1A).seniors, 5400);
  assert.equal(
    c.schedule1A({ magi: 140000, mfj: true, seniors: 2 }, TAX.schedule1A).seniors,
    12000,
  );
});

/* ------------------------------------------------ payroll */
test("payroll: Social Security stops at the $184,500 wage base; Additional Medicare starts at $200,000 (single)", () => {
  const p = c.payrollTax(250000, "single", TAX.payroll);
  assert.equal(p.socialSecurity, c.cents(184500 * 0.062));
  assert.equal(p.medicare, c.cents(250000 * 0.0145 + 50000 * 0.009));
});

test("paycheck: traditional 401(k) lowers income tax but not Social Security or Medicare", () => {
  const a = c.paycheck({ salary: 75000, periods: 26, status: "single" }, TAX, LIMITS.retirement);
  const b = c.paycheck(
    { salary: 75000, periods: 26, status: "single", k401Pct: 0.06 },
    TAX,
    LIMITS.retirement,
  );
  assert.equal(a.fica.total, b.fica.total);
  assert.ok(b.incomeTax.tax < a.incomeTax.tax);
});

/* ------------------------------------------------ fees & compounding
   SEC Investor Bulletin, "How Fees and Expenses Affect Your Investment Portfolio": $100,000 growing 4% a year for 20 years
   is worth about $208,000 with a 0.25% annual fee, $198,000 with 0.50% and $179,000 with 1.00%.
   https://www.investor.gov/additional-resources/news-alerts/alerts-bulletins/investor-bulletin-how-fees-expenses-affect-your */
test("fees: SEC bulletin example lands on $208k, $198k and $179k", () => {
  assert.equal(Math.round(c.afterFees(100000, 0.04, 0.0025, 20) / 1000), 208);
  assert.equal(Math.round(c.afterFees(100000, 0.04, 0.005, 20) / 1000), 198);
  assert.equal(Math.round(c.afterFees(100000, 0.04, 0.01, 20) / 1000), 179);
});

test("growth: monthly deposits with no interest add up exactly", () => {
  const rows = c.growth({ start: 1000, monthly: 100, annualRate: 0, years: 10 });
  assert.equal(rows.at(-1).balance, 1000 + 100 * 120);
});

test("retirement: employer match follows its tiers and reports what is left on the table", () => {
  const tiers = [
    { rate: 1, upTo: 0.03 },
    { rate: 0.5, upTo: 0.05 },
  ];
  assert.equal(c.employerMatch(60000, 0.05, tiers).match, 2400);
  assert.equal(c.employerMatch(60000, 0.02, tiers).missed, 1200);
});

test("retirement: projection never lets the deferral exceed the IRS limit", () => {
  const r = c.retirementProjection({
    age: 40,
    retireAge: 41,
    salary: 500000,
    contribPct: 0.2,
    tiers: [],
    returnRate: 0,
    inflation: 0,
    limit: LIMITS.retirement.employeeDeferral,
    catchUp: 8000,
    catchUp6063: 11250,
  });
  assert.equal(r.final.contributed, 24500);
});

/* ------------------------------------------------ credit */
const DEBTS = [
  { name: "Store card", balance: 900, apr: 0.2899, min: 35 },
  { name: "Visa", balance: 6200, apr: 0.2299, min: 155 },
  { name: "Car loan", balance: 11800, apr: 0.0749, min: 285 },
];
test("debt payoff: avalanche never pays more interest than snowball", () => {
  const av = c.payoffPlan({ debts: DEBTS, budget: 800, strategy: "avalanche" });
  const sb = c.payoffPlan({ debts: DEBTS, budget: 800, strategy: "snowball" });
  assert.ok(av.feasible && sb.feasible);
  assert.ok(av.totalInterest <= sb.totalInterest + 1e-6);
});

test("debt payoff: snowball clears its first debt no later than avalanche", () => {
  const debts = [
    { name: "A", balance: 9000, apr: 0.26, min: 180 },
    { name: "B", balance: 1200, apr: 0.18, min: 40 },
  ];
  const av = c.payoffPlan({ debts, budget: 600, strategy: "avalanche" });
  const sb = c.payoffPlan({ debts, budget: 600, strategy: "snowball" });
  assert.ok(sb.firstWinMonth <= av.firstWinMonth);
});

test("debt payoff: a budget below the minimums is rejected", () => {
  assert.equal(c.payoffPlan({ debts: DEBTS, budget: 300 }).feasible, false);
});

test("minimum payments: paying only the minimum takes far longer than the 36-month payoff", () => {
  const min = c.minimumPayoff({ balance: 5000, apr: 0.2236 });
  assert.ok(min.months > 120);
  assert.ok(min.totalInterest > c.payment(5000, 0.2236, 36) * 36 - 5000);
});

/* ------------------------------------------------ insurance */
test("insurance: out-of-pocket stops at the maximum and premiums sit on top", () => {
  const plan = {
    premiumMonthly: 150,
    deductible: 2000,
    coinsurance: 0.2,
    oopMax: 5000,
    visitCopay: 30,
    rxCopay: 15,
  };
  const y = c.planYear(plan, { visits: 4, visitCost: 180, rx: 6, rxCost: 60, other: 60000 });
  assert.equal(y.outOfPocket, 5000);
  assert.equal(y.total, 5000 + 1800);
  assert.equal(c.youPayOnBill(plan, 1500), 1500);
  assert.equal(c.youPayOnBill(plan, 7000), 3000);
});

/* ------------------------------------------------ cars */
test("cars: negative equity is rolled into the amount financed", () => {
  const d = c.autoDeal({
    price: 40000,
    tradeValue: 15000,
    tradeOwed: 20000,
    taxRate: 0,
    apr: 0.0635,
    months: 72,
  });
  assert.equal(d.negativeEquity, 5000);
  assert.equal(d.financed, 45000);
});

test("cars: 0% financing beats a rebate only when the rebate is small", () => {
  const small = c.rebateVsPromo({
    price: 40000,
    rebate: 1000,
    promoApr: 0,
    bankApr: 0.0635,
    months: 60,
  });
  const big = c.rebateVsPromo({
    price: 40000,
    rebate: 7500,
    promoApr: 0,
    bankApr: 0.0635,
    months: 60,
  });
  assert.equal(small.better, "promo");
  assert.equal(big.better, "rebate");
});

test("points: simple break-even is cost divided by the monthly savings", () => {
  const p = c.pointsDeal({
    loan: 400000,
    annualRate: 0.0675,
    months: 360,
    points: 1,
    ratePerPoint: 0.0025,
  });
  assert.equal(
    to(p.simpleBreakEven, 6),
    to(4000 / (c.payment(400000, 0.0675, 360) - c.payment(400000, 0.065, 360)), 6),
  );
});

test("refinance: a lower rate on a fresh 30 years can still raise lifetime cost", () => {
  const r = c.refinance({
    balance: 250000,
    annualRate: 0.075,
    remainingMonths: 240,
    newRate: 0.065,
    newMonths: 360,
    costs: 6000,
  });
  assert.ok(r.monthlySavings > 0);
  assert.ok(r.lifetimeChange > 0);
});
