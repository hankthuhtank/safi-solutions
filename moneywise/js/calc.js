/* Moneywise: the math. Pure functions only (no DOM), shared by every page and by tests/calc.test.mjs.
   Rates are decimals (0.074 = 7.4%). Money is plain numbers in dollars; cents() rounds the way a servicer does. */

/* ------------------------------------------------ rounding */
// Round half away from zero to the cent. The exponent trick avoids 1.005 -> 1.00 float errors.
export function cents(x) {
  if (!Number.isFinite(x)) return x;
  const a = Math.abs(x);
  if (a < 1e-6) return 0;
  return Math.sign(x) * Number(Math.round(Number(a + 'e2')) + 'e-2');
}
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/* ------------------------------------------------ loans */
// Level monthly payment for a fully amortizing loan.
export function payment(principal, annualRate, months) {
  if (months <= 0) return principal;
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return principal * r / (1 - Math.pow(1 + r, -months));
}

// Balance left after k level payments (closed form, unrounded).
export function balanceAfter(principal, annualRate, months, k, pay = payment(principal, annualRate, months)) {
  const r = annualRate / 12;
  if (r === 0) return Math.max(0, principal - pay * k);
  const g = Math.pow(1 + r, k);
  return Math.max(0, principal * g - pay * (g - 1) / r);
}

// Months needed to clear a balance with a fixed payment. Infinity if the payment never covers the interest.
export function monthsToPayoff(balance, annualRate, pay) {
  const r = annualRate / 12;
  if (balance <= 0) return 0;
  if (r === 0) return Math.ceil(balance / pay);
  if (pay <= balance * r) return Infinity;
  return Math.ceil(-Math.log(1 - balance * r / pay) / Math.log(1 + r) - 1e-9);
}

/* Month-by-month schedule, rounded to cents each month the way servicers post payments.
   extraMonthly / extraOnce {month, amount} go straight to principal.
   pmi {annualRate, originalValue, removeAt: 'auto' | 'request'}: charged on the original loan amount until the
   scheduled balance reaches 78% of the original value (automatic, Homeowners Protection Act), or until the actual
   balance reaches 80% if you ask for removal, and never past the midpoint of the term. */
export function amortize({ principal, annualRate, months, pay, extraMonthly = 0, extraOnce = null, pmi = null, maxMonths = 1200 }) {
  const r = annualRate / 12;
  const level = pay ?? cents(payment(principal, annualRate, months));
  const rows = [];
  let bal = principal, totalInterest = 0, totalPrincipal = 0, totalExtra = 0, pmiTotal = 0, crossover = null;
  let pmiOn = !!(pmi && pmi.annualRate > 0 && principal > 0.8 * pmi.originalValue);
  const pmiMonthly = pmiOn ? cents(principal * pmi.annualRate / 12) : 0;
  let pmiEnd = pmiOn ? null : 0;
  const midpoint = Math.ceil(months / 2);
  for (let m = 1; bal > 0.005 && m <= maxMonths; m++) {
    const interest = cents(bal * r);
    // the last scheduled payment absorbs the cents left over from rounding the level payment
    let scheduled = m === months ? bal + interest : Math.min(level, bal + interest);
    let toPrincipal = scheduled - interest;
    if (toPrincipal < 0) toPrincipal = 0; // payment below interest: balance would grow; caller should prevent
    let extra = extraMonthly + (extraOnce && extraOnce.month === m ? extraOnce.amount : 0);
    extra = Math.max(0, Math.min(extra, bal - toPrincipal));
    let pmiPaid = 0;
    if (pmiOn) {
      pmiPaid = pmiMonthly; pmiTotal += pmiPaid;
    }
    bal = cents(bal - toPrincipal - extra);
    totalInterest += interest; totalPrincipal += toPrincipal; totalExtra += extra;
    if (crossover === null && toPrincipal > interest) crossover = m;
    rows.push({ month: m, payment: cents(scheduled), interest, principal: cents(toPrincipal), extra: cents(extra), pmi: pmiPaid, balance: bal });
    if (pmiOn) {
      const scheduledBal = balanceAfter(principal, annualRate, months, m, level);
      const byRequest = pmi.removeAt === 'request' && bal <= 0.8 * pmi.originalValue;
      if (scheduledBal <= 0.78 * pmi.originalValue || byRequest || m >= midpoint) { pmiOn = false; pmiEnd = m; }
    }
  }
  return {
    payment: level, rows, months: rows.length,
    totalInterest: cents(totalInterest), totalPrincipal: cents(totalPrincipal + totalExtra), totalExtra: cents(totalExtra),
    totalPaid: cents(totalInterest + totalPrincipal + totalExtra), pmiMonthly, pmiTotal: cents(pmiTotal), pmiEndMonth: pmiEnd, crossoverMonth: crossover,
  };
}

// The PMI milestones on the original schedule (no extra payments).
export function pmiMilestones({ principal, annualRate, months, originalValue }) {
  const pay = cents(payment(principal, annualRate, months));
  const find = ltv => { for (let m = 0; m <= months; m++) if (balanceAfter(principal, annualRate, months, m, pay) <= ltv * originalValue) return m; return months; };
  return { requestMonth: find(0.80), automaticMonth: find(0.78), midpointMonth: Math.ceil(months / 2), startLtv: principal / originalValue };
}

// Annual percentage rate implied by what you actually receive (amount financed) versus the payments you make.
// Actuarial method with a monthly unit period (Regulation Z, Appendix J), solved by bisection.
export function aprFromPayments(amountFinanced, pay, months) {
  const pv = r => (r === 0 ? pay * months : pay * (1 - Math.pow(1 + r, -months)) / r);
  if (pv(0) <= amountFinanced) return 0;
  let lo = 0, hi = 1;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (pv(mid) > amountFinanced) lo = mid; else hi = mid;
  }
  return 12 * (lo + hi) / 2;
}

// Discount points: pay cost now for a lower rate. ratePerPoint is lender-specific (0.25 points of rate per point is a common rule of thumb).
export function pointsDeal({ loan, annualRate, months, points, ratePerPoint = 0.0025, horizonMonths = months }) {
  const cost = loan * points / 100;
  const newRate = Math.max(0, annualRate - points * ratePerPoint);
  const p0 = payment(loan, annualRate, months), p1 = payment(loan, newRate, months);
  const monthlySavings = p0 - p1;
  const simpleBreakEven = monthlySavings > 0 ? cost / monthlySavings : Infinity;
  // If you sell or refinance at month h you also owe a slightly smaller balance on the lower-rate loan.
  const netAt = h => monthlySavings * h + (balanceAfter(loan, annualRate, months, h, p0) - balanceAfter(loan, newRate, months, h, p1)) - cost;
  let trueBreakEven = Infinity;
  for (let h = 1; h <= months; h++) if (netAt(h) >= 0) { trueBreakEven = h; break; }
  return { cost, newRate, payment: p0, newPayment: p1, monthlySavings, simpleBreakEven, trueBreakEven, netAtHorizon: netAt(Math.min(horizonMonths, months)), netAt };
}

/* Refinance: monthly savings, the simple break-even (costs / savings) and the true position if you move or pay off at
   month m, which also counts the balance you still owe on each loan. A new 30-year loan restarts the clock, so the
   lifetime interest can rise even when the payment falls. */
export function refinance({ balance, annualRate, remainingMonths, newRate, newMonths, costs, rollIn = false }) {
  const oldPay = payment(balance, annualRate, remainingMonths);
  const newPrincipal = balance + (rollIn ? costs : 0);
  const newPay = payment(newPrincipal, newRate, newMonths);
  const monthlySavings = oldPay - newPay;
  const upfront = rollIn ? 0 : costs;
  const simpleBreakEven = monthlySavings > 0 ? costs / monthlySavings : Infinity;
  const horizon = Math.max(remainingMonths, newMonths);
  const net = [];
  let trueBreakEven = Infinity;
  for (let m = 0; m <= horizon; m++) {
    const paidOld = oldPay * Math.min(m, remainingMonths), paidNew = newPay * Math.min(m, newMonths);
    const owedOld = balanceAfter(balance, annualRate, remainingMonths, Math.min(m, remainingMonths), oldPay);
    const owedNew = balanceAfter(newPrincipal, newRate, newMonths, Math.min(m, newMonths), newPay);
    const v = (paidOld + owedOld) - (paidNew + owedNew + upfront);
    net.push(v);
    if (m > 0 && trueBreakEven === Infinity && v >= 0) trueBreakEven = m;
  }
  return {
    oldPayment: oldPay, newPayment: newPay, monthlySavings, simpleBreakEven, trueBreakEven,
    oldInterestLeft: oldPay * remainingMonths - balance, newInterest: newPay * newMonths - newPrincipal,
    lifetimeChange: (newPay * newMonths + upfront) - oldPay * remainingMonths, net,
  };
}

/* ------------------------------------------------ interest rates */
// periods: 1 annual, 4 quarterly, 12 monthly, 365 daily, Infinity continuous.
export function aprToApy(apr, periods) {
  if (periods === Infinity) return Math.exp(apr) - 1;
  return Math.pow(1 + apr / periods, periods) - 1;
}
export function apyToApr(apy, periods) {
  if (periods === Infinity) return Math.log(1 + apy);
  return periods * (Math.pow(1 + apy, 1 / periods) - 1);
}
// Regulation DD, Appendix A, Part I: APY = 100 [(1 + Interest/Principal)^(365/Days in term) - 1]
export function apyFromInterest(interest, principal, daysInTerm) {
  return Math.pow(1 + interest / principal, 365 / daysInTerm) - 1;
}
// Interest compounded daily (rate / 365 per day) through one or more rate steps: [{rate, days}].
export function dailyCompoundInterest(principal, steps) {
  let b = principal;
  for (const s of steps) b *= Math.pow(1 + s.rate / 365, s.days);
  return b - principal;
}
// Monthly growth factor equivalent to a nominal rate compounded `periods` times a year.
export function monthlyRate(annualRate, periods = 12) {
  if (periods === Infinity) return Math.exp(annualRate / 12) - 1;
  return Math.pow(1 + annualRate / periods, periods / 12) - 1;
}
// Savings growth with an optional deposit at the end of each month. Returns one row per year.
export function growth({ start = 0, monthly = 0, annualRate, years, periods = 12 }) {
  const g = monthlyRate(annualRate, periods);
  const rows = [{ year: 0, contributed: start, interest: 0, balance: start }];
  let bal = start, put = start;
  for (let m = 1; m <= Math.round(years * 12); m++) {
    bal = bal * (1 + g) + monthly; put += monthly;
    if (m % 12 === 0) rows.push({ year: m / 12, contributed: put, interest: bal - put, balance: bal });
  }
  return rows;
}
export const yearsToDouble = r => (r > 0 ? Math.log(2) / Math.log(1 + r) : Infinity);

/* ------------------------------------------------ credit */
export function utilization(cards) {
  const rows = cards.map(c => ({ ...c, ratio: c.limit > 0 ? c.balance / c.limit : 0 }));
  const limit = rows.reduce((s, c) => s + c.limit, 0), balance = rows.reduce((s, c) => s + c.balance, 0);
  return { rows, limit, balance, overall: limit > 0 ? balance / limit : 0, highest: rows.reduce((m, c) => Math.max(m, c.ratio), 0) };
}
export function utilizationBand(u) {
  if (u === 0) return { key: 'zero', label: 'Zero reported' };
  if (u < 0.1) return { key: 'best', label: 'Under 10%' };
  if (u < 0.3) return { key: 'good', label: '10 to 29%' };
  if (u < 0.5) return { key: 'fair', label: '30 to 49%' };
  return { key: 'high', label: '50% or more' };
}

/* Pay off several debts with one monthly budget. Every debt gets its minimum; whatever is left goes to the target
   debt (avalanche = highest APR first, snowball = smallest balance first). When a debt is cleared, its payment rolls
   into the next target. */
export function payoffPlan({ debts, budget, strategy = 'avalanche', maxMonths = 600 }) {
  const ds = debts.map((d, i) => ({ i, name: d.name, apr: d.apr, min: d.min, bal: d.balance, start: d.balance, paidOffMonth: null, interest: 0 }));
  const order = [...ds].sort(strategy === 'snowball'
    ? (a, b) => a.start - b.start || b.apr - a.apr
    : (a, b) => b.apr - a.apr || a.start - b.start);
  const series = [ds.reduce((s, d) => s + d.bal, 0)];
  let month = 0, totalInterest = 0, firstWin = null;
  const minTotal = ds.reduce((s, d) => s + d.min, 0);
  if (budget < minTotal - 1e-9) return { feasible: false, reason: 'budget-below-minimums', minTotal };
  while (ds.some(d => d.bal > 0.005) && month < maxMonths) {
    month++;
    for (const d of ds) if (d.bal > 0) { const int = d.bal * d.apr / 12; d.bal += int; d.interest += int; totalInterest += int; }
    let left = budget;
    for (const d of ds) if (d.bal > 0) { const p = Math.min(d.min, d.bal); d.bal -= p; left -= p; }
    for (const d of order) { if (left <= 0) break; if (d.bal > 0) { const p = Math.min(left, d.bal); d.bal -= p; left -= p; } }
    for (const d of ds) if (d.bal <= 0.005 && d.paidOffMonth === null) { d.bal = 0; d.paidOffMonth = month; if (firstWin === null) firstWin = month; }
    series.push(ds.reduce((s, d) => s + Math.max(0, d.bal), 0));
  }
  const done = ds.every(d => d.bal <= 0.005);
  return {
    feasible: done, months: done ? month : Infinity, totalInterest, firstWinMonth: firstWin, series,
    order: order.map(d => d.i),
    debts: ds.map(d => ({ name: d.name, paidOffMonth: d.paidOffMonth, interest: d.interest })),
  };
}

// Paying only the card's minimum: a percent of the balance plus that month's interest, with a dollar floor.
export function minimumPayoff({ balance, apr, percent = 0.01, plusInterest = true, floor = 35, maxMonths = 1200 }) {
  let bal = balance, months = 0, interest = 0, firstPayment = null;
  const series = [bal];
  while (bal > 0.005 && months < maxMonths) {
    months++;
    const int = cents(bal * apr / 12);
    let pay = Math.max(floor, cents(percent * bal + (plusInterest ? int : 0)));
    pay = Math.min(pay, bal + int);
    if (firstPayment === null) firstPayment = pay;
    if (pay <= int && bal > 0) return { months: Infinity, totalInterest: Infinity, firstPayment, series };
    bal = cents(bal + int - pay); interest += int;
    series.push(bal);
  }
  return { months, totalInterest: cents(interest), totalPaid: cents(balance + interest), firstPayment, series };
}

/* ------------------------------------------------ health insurance */
/* One year of care under one plan. use: visits & visitCost (doctor visits), rx & rxCost (prescription fills),
   other (allowed charges for tests, imaging, surgery or a hospital stay). Copays are flat; when a plan has no copay
   for a service, that service goes through the deductible and coinsurance instead. Everything you pay counts toward
   the out-of-pocket maximum; premiums never do. */
export function planYear(plan, use) {
  let copays = 0, pool = use.other || 0, allowed = use.other || 0;
  const svc = (count, cost, copay) => {
    allowed += count * cost;
    if (copay == null) pool += count * cost; else copays += count * Math.min(copay, cost);
  };
  svc(use.visits || 0, use.visitCost || 0, plan.visitCopay);
  svc(use.rx || 0, use.rxCost || 0, plan.rxCopay);
  const deductiblePart = Math.min(pool, plan.deductible);
  const coinsurancePart = (pool - deductiblePart) * plan.coinsurance;
  const uncapped = copays + deductiblePart + coinsurancePart;
  const outOfPocket = Math.min(uncapped, plan.oopMax);
  const premiums = plan.premiumMonthly * 12;
  const employerHsa = plan.employerHsa || 0;
  return {
    allowed, copays, deductiblePart, coinsurancePart, outOfPocket, cappedBy: uncapped > plan.oopMax ? uncapped - plan.oopMax : 0,
    insurerPays: allowed - outOfPocket, premiums, employerHsa, total: premiums + outOfPocket - employerHsa,
  };
}
// What you pay at each total bill size when every dollar is subject to the deductible (the cost-sharing staircase).
export function youPayOnBill(plan, bill) {
  const d = Math.min(bill, plan.deductible);
  return Math.min(plan.oopMax, d + Math.max(0, bill - plan.deductible) * plan.coinsurance);
}

/* ------------------------------------------------ taxes */
// Tax on taxable income through progressive brackets [{rate, upTo, base}] (upTo null = no ceiling).
export function bracketTax(taxable, brackets) {
  let prev = 0, tax = 0, marginal = brackets[0].rate;
  const rows = [];
  for (const b of brackets) {
    const top = b.upTo == null ? Infinity : b.upTo;
    const amount = Math.max(0, Math.min(taxable, top) - prev);
    rows.push({ rate: b.rate, from: prev, to: top, amount, tax: amount * b.rate });
    tax += amount * b.rate;
    if (taxable > prev) marginal = b.rate;
    if (taxable <= top) break;
    prev = top;
  }
  return { tax: cents(tax), rows, marginal };
}

/* The IRS Tax Table: under $100,000 of taxable income the official tax is figured at the midpoint of each income
   band ($5 and $10 bands at the very bottom, $25 bands up to $3,000, $50 bands up to $100,000) and rounded to the
   dollar. From $100,000 up, the Tax Computation Worksheet gives the exact bracket amount. */
export function irsTaxTable(taxable, brackets) {
  if (taxable >= 100000) return bracketTax(taxable, brackets).tax;
  if (taxable < 5) return 0;
  let lo;
  if (taxable < 15) lo = 5;
  else if (taxable < 25) lo = 15;
  else if (taxable < 3000) lo = Math.floor(taxable / 25) * 25;
  else lo = Math.floor(taxable / 50) * 50;
  const hi = taxable < 15 ? 15 : taxable < 25 ? 25 : taxable < 3000 ? lo + 25 : lo + 50;
  return Math.round(bracketTax((lo + hi) / 2, brackets).tax);
}

// Schedule 1-A (2025 to 2028): tips, overtime, car loan interest and the senior deduction, line for line.
export function schedule1A({ magi, mfj = false, tips = 0, overtime = 0, carInterest = 0, seniors = 0 }, rules) {
  const st = mfj ? 'mfj' : 'single';
  const over = start => Math.max(0, magi - start);
  const t7 = Math.min(tips, rules.tips.cap);
  const tipsDed = Math.max(0, t7 - rules.tips.reducePer1000 * Math.floor(over(rules.tips.phaseStart[st]) / 1000));
  const o15 = Math.min(overtime, rules.overtime.cap[st]);
  const otDed = Math.max(0, o15 - rules.overtime.reducePer1000 * Math.floor(over(rules.overtime.phaseStart[st]) / 1000));
  const c24 = Math.min(carInterest, rules.carLoanInterest.cap);
  const carDed = Math.max(0, c24 - rules.carLoanInterest.reducePer1000 * Math.ceil(over(rules.carLoanInterest.phaseStart[st]) / 1000));
  const per = Math.max(0, rules.seniors.perPerson - rules.seniors.reduceRate * over(rules.seniors.phaseStart[st]));
  const seniorDed = per * Math.min(seniors, mfj ? 2 : 1);
  return { tips: tipsDed, overtime: otDed, carInterest: carDed, seniors: seniorDed, total: tipsDed + otDed + carDed + seniorDed };
}

/* Federal income tax for one year. wages = W-2 box 1 before pre-tax deductions; preTax = traditional 401(k), Section 125
   health premiums, payroll HSA. Married filing separately cannot take the Schedule 1-A deductions. */
export function incomeTax(p, table) {
  const status = p.status || 'single';
  const agi = Math.max(0, (p.wages || 0) - (p.preTax || 0) + (p.otherIncome || 0) - (p.aboveLine || 0));
  const unmarried = status === 'single' || status === 'hoh';
  const extra = ((p.age65 || 0) + (p.blind || 0)) * (unmarried ? table.standardDeduction.agedOrBlindUnmarried : table.standardDeduction.agedOrBlind);
  const standard = table.standardDeduction[status] + extra;
  const deduction = Math.max(standard, p.itemized || 0);
  const s1a = status === 'mfs'
    ? { tips: 0, overtime: 0, carInterest: 0, seniors: 0, total: 0 }
    : schedule1A({ magi: agi, mfj: status === 'mfj', tips: p.tips || 0, overtime: p.overtime || 0, carInterest: p.carInterest || 0, seniors: p.age65 || 0 }, table.schedule1A);
  const taxable = Math.max(0, agi - deduction - s1a.total);
  const bt = bracketTax(taxable, table.brackets[status]);
  const tax = Math.max(0, bt.tax - (p.credits || 0));
  const gross = (p.wages || 0) + (p.otherIncome || 0);
  return { status, agi, standard, deduction, itemizing: deduction > standard, schedule1A: s1a, taxable, taxBeforeCredits: bt.tax, tax, rows: bt.rows, marginal: bt.marginal, effective: gross > 0 ? tax / gross : 0 };
}

// Employee share of Social Security and Medicare on FICA wages.
export function payrollTax(ficaWages, status, payroll) {
  const ss = Math.min(ficaWages, payroll.socialSecurityWageBase) * payroll.socialSecurityRate;
  const medicare = ficaWages * payroll.medicareRate + Math.max(0, ficaWages - payroll.additionalMedicareThreshold[status || 'single']) * payroll.additionalMedicareRate;
  return { socialSecurity: cents(ss), medicare: cents(medicare), total: cents(ss + medicare) };
}

/* A year of paychecks. k401Pct and rothPct are shares of salary; health and hsa are pre-tax dollars per paycheck.
   Federal withholding is approximated as the year's actual tax spread evenly (your employer uses IRS Pub 15-T tables,
   which land close to this when your W-4 is current). statePct is a flat estimate applied to federal wages. */
export function paycheck(p, table, limits) {
  const periods = p.periods || 26, status = p.status || 'single';
  const salary = p.salary || 0;
  const k401 = Math.min(salary * (p.k401Pct || 0), limits ? limits.employeeDeferral : Infinity);
  const roth = Math.min(salary * (p.rothPct || 0), Math.max(0, (limits ? limits.employeeDeferral : Infinity) - k401));
  const health = (p.healthPerCheck || 0) * periods, hsa = (p.hsaPerCheck || 0) * periods;
  const federalWages = salary - k401 - health - hsa;
  const ficaWages = salary - health - hsa;
  const it = incomeTax({ status, wages: salary, preTax: k401 + health + hsa, tips: p.tips, overtime: p.overtime }, table);
  const fica = payrollTax(ficaWages, status, table.payroll);
  const state = Math.max(0, federalWages) * (p.statePct || 0);
  const other = (p.otherPerCheck || 0) * periods;
  const net = salary - k401 - roth - health - hsa - it.tax - fica.total - state - other;
  const per = x => x / periods;
  const lines = [
    { key: 'gross', label: 'Gross pay', amount: per(salary) },
    { key: 'k401', label: 'Traditional 401(k)', amount: -per(k401) },
    { key: 'roth', label: 'Roth 401(k)', amount: -per(roth) },
    { key: 'health', label: 'Health premium (pre-tax)', amount: -per(health) },
    { key: 'hsa', label: 'HSA (pre-tax)', amount: -per(hsa) },
    { key: 'federal', label: 'Federal income tax', amount: -per(it.tax) },
    { key: 'ss', label: 'Social Security 6.2%', amount: -per(fica.socialSecurity) },
    { key: 'medicare', label: 'Medicare 1.45%', amount: -per(fica.medicare) },
    { key: 'state', label: 'State income tax', amount: -per(state) },
    { key: 'other', label: 'Other deductions', amount: -per(other) },
  ];
  return { periods, salary, k401, roth, health, hsa, federalWages, ficaWages, incomeTax: it, fica, state, other, net, netPerCheck: per(net), lines };
}

/* ------------------------------------------------ savings & retirement */
// Employer match from tiers, e.g. 100% of the first 3% of pay, then 50% of the next 2%: [{rate:1, upTo:.03}, {rate:.5, upTo:.05}].
export function employerMatch(salary, contribPct, tiers) {
  let prev = 0, match = 0;
  for (const t of tiers) { match += t.rate * Math.max(0, Math.min(contribPct, t.upTo) - prev) * salary; prev = t.upTo; }
  const maxPct = tiers.length ? tiers[tiers.length - 1].upTo : 0;
  const full = fullMatch(salary, tiers);
  return { match, maxPct, full, missed: full - match };
}
// The most the employer will put in: what you get by contributing up to the top tier.
export function fullMatch(salary, tiers) {
  let prev = 0, m = 0;
  for (const t of tiers) { m += t.rate * (t.upTo - prev) * salary; prev = t.upTo; }
  return m;
}

// SEC Investor Bulletin model: grow by the return, then the fee comes out of the year-end balance.
export function afterFees(start, annualReturn, fee, years) {
  return start * Math.pow((1 + annualReturn) * (1 - fee), years);
}
export const realValue = (amount, inflation, years) => amount / Math.pow(1 + inflation, years);
export const futureCost = (amount, inflation, years) => amount * Math.pow(1 + inflation, years);

/* Year-by-year 401(k) projection. Contributions and match arrive through the year (mid-year convention); the employee
   deferral is capped at the IRS limit plus the catch-up for your age, with limits rising with inflation. */
export function retirementProjection(p) {
  const years = Math.max(0, p.retireAge - p.age);
  const net = (1 + p.returnRate) * (1 - (p.fee || 0)) - 1;
  let bal = p.balance || 0, salary = p.salary, contributed = 0, matched = 0;
  const rows = [{ age: p.age, year: 0, contributed: 0, matched: 0, growth: 0, start: bal, balance: bal, real: bal }];
  for (let y = 1; y <= years; y++) {
    const age = p.age + y - 1;
    const idx = Math.pow(1 + (p.limitGrowth ?? p.inflation ?? 0), y - 1);
    const catchUp = age >= 60 && age <= 63 ? p.catchUp6063 : age >= 50 ? p.catchUp : 0;
    const cap = (p.limit + (catchUp || 0)) * idx;
    const want = salary * p.contribPct;
    const c = Math.min(want, cap);
    const m = employerMatch(salary, c / salary, p.tiers || []).match;
    bal = bal * (1 + net) + (c + m) * (1 + net / 2);
    contributed += c; matched += m;
    rows.push({ age: age + 1, year: y, contributed, matched, growth: bal - (p.balance || 0) - contributed - matched, start: p.balance || 0, balance: bal, real: realValue(bal, p.inflation || 0, y), capped: want > cap });
    salary *= 1 + (p.salaryGrowth || 0);
  }
  return { rows, final: rows[rows.length - 1], netReturn: net };
}

/* ------------------------------------------------ cars */
/* Out-the-door price and the loan behind it. Most states tax the price after the trade-in value; a negative-equity
   trade (owing more than it is worth) gets rolled into the new loan. */
export function autoDeal(p) {
  const tradeValue = p.tradeValue || 0, tradeOwed = p.tradeOwed || 0;
  const negativeEquity = Math.max(0, tradeOwed - tradeValue), tradeEquity = Math.max(0, tradeValue - tradeOwed);
  const taxable = Math.max(0, p.price - (p.taxAfterTrade === false ? 0 : tradeValue));
  const tax = taxable * (p.taxRate || 0);
  const outTheDoor = p.price - (p.rebate || 0) + tax + (p.fees || 0) + (p.addOns || 0);
  const financed = Math.max(0, outTheDoor - (p.down || 0) - tradeEquity + negativeEquity);
  const pay = payment(financed, p.apr, p.months);
  const totalInterest = pay * p.months - financed;
  return { negativeEquity, tradeEquity, tax, outTheDoor, financed, payment: pay, totalInterest, totalOfPayments: pay * p.months, cashAtSigning: p.down || 0, totalCost: (p.down || 0) + pay * p.months + tradeEquity };
}
// Typical new-car value curve: about 20% gone in year one, then roughly 16% a year (about 40% of the price left at five years).
export function carValue(price, month, firstYear = 0.20, after = 0.159) {
  if (month <= 12) return price * (1 - firstYear * month / 12);
  return price * (1 - firstYear) * Math.pow(1 - after, (month - 12) / 12);
}
// Months during which the loan balance is higher than the car's value.
export function underwaterMonths(financed, apr, months, price, firstYear, after) {
  const pay = payment(financed, apr, months);
  let first = null, last = null, worst = 0;
  for (let m = 0; m <= months; m++) {
    const gap = balanceAfter(financed, apr, months, m, pay) - carValue(price, m, firstYear, after);
    if (gap > 0) { if (first === null) first = m; last = m; worst = Math.max(worst, gap); }
  }
  return { first, last, months: first === null ? 0 : last - first + 1, worst };
}
// Dealer 0% (or low) promotional APR versus taking the cash rebate and financing elsewhere.
export function rebateVsPromo({ price, rebate, promoApr, bankApr, months, down = 0 }) {
  const promoLoan = price - down, rebateLoan = price - rebate - down;
  const promoPay = payment(promoLoan, promoApr, months), rebatePay = payment(rebateLoan, bankApr, months);
  return { promoPay, rebatePay, promoTotal: promoPay * months + down, rebateTotal: rebatePay * months + down, better: promoPay * months <= rebatePay * months ? 'promo' : 'rebate', difference: Math.abs(promoPay - rebatePay) * months };
}
