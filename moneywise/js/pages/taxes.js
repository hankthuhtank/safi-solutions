/* Form MW-6, Taxes: bracket buckets, marginal vs effective, and three calculators. */
import { boot, registerTool, startTools, bindBoxes, figs, verdict, draw, $ } from '../ui.js';
import { makeChart } from '../charts.js';
import { createTape } from '../tape.js';
import * as c from '../calc.js';
import { money, moneyShort, pct, num } from '../format.js';

boot();

const C = { green: 'var(--series-1)', red: 'var(--series-2)', blue: 'var(--series-3)', gold: 'var(--series-4)', teal: 'var(--series-5)', navy: 'var(--navy)' };
// one blue, light to dark, because brackets are ordered (an ordinal ramp, not seven different colors)
const RAMP = ['#86b6ef', '#6da7ec', '#3987e5', '#2a78d6', '#1c5cab', '#104281', '#0d366b'];
const bucketSpec = (taxable, brackets, title) => {
  const r = c.bracketTax(taxable, brackets);
  const used = r.rows.filter(x => x.amount > 0);
  const show = brackets.slice(0, Math.min(brackets.length, used.length + 1));
  return {
    type: 'hbars', title, rowHeight: 32, desc: 'How much of the taxable income falls in each bracket, and the tax on it',
    x: { values: show.map((b, i) => `${pct(b.rate, 0)} bucket \u00B7 ${money(r.rows[i] ? r.rows[i].tax : 0)} tax`) }, y: { format: moneyShort },
    series: [{ key: 'b', label: 'Income in this bracket', color: RAMP[0], values: show.map((_, i) => (r.rows[i] ? r.rows[i].amount : 0)), format: v => money(v), colorFor: (v, i) => RAMP[i] }],
    labelFormat: v => money(v),
  };
};

let TAX = null;
const ready = fetch('/moneywise/data/tax-2026.json').then(r => r.json()).then(j => (TAX = j));

/* ------------------------------------------------ Part II charts */
ready.then(() => {
  const bh = $('[data-chart="buckets"]');
  if (bh) {
    const taxable = +bh.dataset.taxable;
    makeChart(bh, bucketSpec(taxable, TAX.brackets.single, `${money(taxable)} of taxable income, single, 2026`));
  }
  const rh = $('[data-chart="rates"]');
  if (rh) {
    const xs = Array.from({ length: 61 }, (_, i) => i * 5000);
    makeChart(rh, {
      type: 'line', title: 'Single filer, 2026: rate on the next dollar vs on all dollars', height: 260, desc: 'Marginal and effective federal income tax rates across taxable incomes',
      x: { values: xs, format: v => moneyShort(v), label: 'Taxable income' }, y: { format: v => v + '%', min: 0 }, tableEvery: 4, tableLabel: 'Taxable income',
      series: [
        { key: 'm', label: 'Marginal rate', color: C.red, step: true, values: xs.map(x => c.bracketTax(x, TAX.brackets.single).marginal * 100), format: v => v.toFixed(0) + '%' },
        { key: 'e', label: 'Effective rate', color: C.blue, values: xs.map(x => (x ? c.bracketTax(x, TAX.brackets.single).tax / x * 100 : 0)), format: v => v.toFixed(1) + '%' },
      ],
    });
  }
});

/* ------------------------------------------------ your federal tax */
const ctc = (kids, magi, status, T) => {
  const start = status === 'mfj' ? 400000 : 200000;
  return Math.max(0, kids * T.childTaxCredit.max - 50 * Math.ceil(Math.max(0, magi - start) / 1000));
};
registerTool('tool-tax', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = async v => {
    if (!TAX) await ready;
    const kids = Number(v.kids) || 0, seniors = Number(v.seniors) || 0;
    const base = { status: v.status, wages: v.wages, otherIncome: v.other, preTax: v.pretax, itemized: v.itemized, age65: seniors, tips: v.tips, overtime: v.ot, carInterest: v.car };
    const pre = c.incomeTax(base, TAX);
    const credit = Math.min(pre.taxBeforeCredits, ctc(kids, pre.agi, v.status, TAX));
    const it = c.incomeTax({ ...base, credits: credit }, TAX);
    const next = c.incomeTax({ ...base, wages: v.wages + 1000, credits: ctc(kids, pre.agi + 1000, v.status, TAX) }, TAX);
    const fica = c.payrollTax(v.wages, v.status, TAX.payroll), fica2 = c.payrollTax(v.wages + 1000, v.status, TAX.payroll);
    const keep = 1000 - (next.tax - it.tax) - (fica2.total - fica.total);
    const table = c.irsTaxTable(it.taxable, TAX.brackets[v.status]);
    figs($('[data-figs]', panel), [
      { label: 'Federal income tax', value: money(it.tax), hero: true, note: `${pct(it.effective, 2, true)} of your income` },
      { label: 'Top bracket', value: pct(it.marginal, 0), note: 'rate on your next dollar' },
      { label: 'Next $1,000 of pay keeps', value: money(keep), tone: 'good', note: 'after income tax, Social Security and Medicare' },
      { label: 'Taxable income', value: money(it.taxable), note: `${it.itemizing ? 'itemized' : 'standard'} deduction ${money(it.deduction)}` },
      { label: 'Schedule 1-A deductions', value: money(it.schedule1A.total), note: it.schedule1A.total ? 'tips, overtime, car loan, seniors' : 'none entered' },
    ]);
    verdict($('[data-verdict]', panel), it.taxable < 100000 ? `If you use the IRS Tax Table (taxable income under $100,000), it figures tax at the middle of each $50 band, so your return would show **${money(table)}** before credits, a few dollars from the exact ${money(it.taxBeforeCredits)}.` : 'Above $100,000 of taxable income the IRS worksheet uses the exact bracket math shown here.', 'info');
    $('[data-verdict]', panel).hidden = false;
    draw(panel, 'b', bucketSpec(it.taxable, TAX.brackets[v.status], 'Your taxable income, bucket by bucket'));
    const rows = it.rows.filter(r => r.amount > 0);
    tape.print([
      { label: 'Wages', v: v.wages, op: 'add' },
      ...(v.other ? [{ label: 'Other income', v: v.other, op: 'add' }] : []),
      { label: 'Pre-tax deductions', v: v.pretax, op: 'sub' },
      { label: 'AGI (line 11a)', v: it.agi, kind: 'subtotal' },
      { label: it.itemizing ? 'Itemized (line 12e)' : 'Standard (line 12e)', v: it.deduction, op: 'sub' },
      ...(it.schedule1A.total ? [{ label: 'Schedule 1-A (line 13b)', v: it.schedule1A.total, op: 'sub' }] : []),
      { label: 'Taxable (line 15)', v: it.taxable, kind: 'subtotal' },
      ...rows.map(r => ({ label: `${pct(r.rate, 0)} × ${num(r.amount, 0)}`, v: r.tax, op: 'add' })),
      { label: 'Tax (line 16)', v: it.taxBeforeCredits, kind: 'subtotal' },
      ...(credit ? [{ label: `Child tax credit × ${kids}`, v: credit, op: 'sub' }] : []),
      { label: 'Income tax', v: it.tax, kind: 'total' },
      { label: 'Social Security + Medicare', v: fica.total, op: 'add' },
      { label: 'All federal taxes', v: it.tax + fica.total, kind: 'total' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ your paycheck */
registerTool('tool-pay', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = async v => {
    if (!TAX) await ready;
    const periods = Number(v.periods) || 26;
    const limits = { employeeDeferral: 24500 };
    const pc = c.paycheck({ salary: v.salary, periods, status: v.status, k401Pct: v.k401, rothPct: v.roth, healthPerCheck: v.health, hsaPerCheck: v.hsa, statePct: v.state }, TAX, limits);
    const taxes = pc.incomeTax.tax + pc.fica.total + pc.state;
    const saved = pc.k401 + pc.roth + pc.hsa;
    figs($('[data-figs]', panel), [
      { label: 'Take-home per paycheck', value: money(pc.netPerCheck, { cents: true }), hero: true, note: `${money(pc.net)} a year, ${periods} paychecks` },
      { label: 'Taxes per paycheck', value: money(taxes / periods), tone: 'bad', note: `${pct(taxes / v.salary, 1)} of gross pay` },
      { label: 'Saved for you', value: money(saved / periods), tone: 'good', note: '401(k) and HSA, still your money' },
    ]);
    verdict($('[data-verdict]', panel), `Out of every $100 you earn, about **${money((pc.net / v.salary) * 100)}** reaches your bank account, **${money((saved / v.salary) * 100)}** goes to your own savings and **${money((taxes / v.salary) * 100)}** goes to taxes.`, 'info');
    $('[data-verdict]', panel).hidden = false;
    const kind = { k401: C.green, roth: C.green, hsa: C.green, health: C.teal, federal: C.red, ss: C.red, medicare: C.red, state: C.red, other: C.gold };
    const steps = [{ label: 'Gross pay', value: pc.salary / periods, kind: 'start', color: C.blue },
      ...pc.lines.filter(l => l.key !== 'gross' && Math.abs(l.amount) >= 0.005).map(l => ({ label: l.label, value: l.amount, color: kind[l.key] })),
      { label: 'Take-home pay', value: pc.netPerCheck, kind: 'end', color: C.navy }];
    draw(panel, 'w', {
      type: 'waterfall', title: 'One paycheck, from gross to take-home', desc: 'Each deduction taken from gross pay, ending at take-home pay', tableLabel: 'Line',
      y: { format: x => money(x) }, steps,
      legend: [{ label: 'Gross pay', color: C.blue }, { label: 'Your savings', color: C.green }, { label: 'Insurance', color: C.teal }, { label: 'Taxes', color: C.red }, { label: 'Take-home', color: C.navy }],
    }, { wide: true });
    tape.print([
      ...pc.lines.filter(l => Math.abs(l.amount) >= 0.005).map((l, i) => ({ label: l.label, v: Math.abs(l.amount), op: i === 0 ? 'none' : 'sub' })),
      { label: 'Take-home per check', v: pc.netPerCheck, kind: 'total' },
      { label: `× ${periods} paychecks`, v: pc.net, op: 'mul' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ refund check */
registerTool('tool-refund', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = async v => {
    if (!TAX) await ready;
    const periods = Number(v.periods) || 26;
    const it = c.incomeTax({ status: v.status, wages: v.wages, preTax: v.pretax }, TAX);
    const withheld = v.withheld * periods, gap = withheld - it.tax;
    figs($('[data-figs]', panel), [
      { label: gap >= 0 ? 'Expected refund' : 'Expected to owe', value: money(Math.abs(gap)), hero: true, tone: gap >= 0 ? '' : 'bad', note: `withheld ${money(withheld)} vs tax ${money(it.tax)}` },
      { label: gap >= 0 ? 'Per paycheck, over-withheld' : 'Per paycheck, short', value: money(Math.abs(gap) / periods) },
    ]);
    verdict($('[data-verdict]', panel), gap > 500
      ? `That refund is **${money(gap / periods)} a paycheck** you could have had all year. Lower your withholding on Form W-4 if you would rather have it now.`
      : gap < -1000 ? `You may owe **${money(-gap)}** in April, and possibly an underpayment penalty. Raise your withholding on Form W-4 (step 4(c) adds a fixed extra amount).` : 'Close to even: your withholding is about right.', gap > 500 || gap < -1000 ? 'warn' : '');
    $('[data-verdict]', panel).hidden = false;
    draw(panel, 'r', {
      type: 'hbars', title: 'Paid in versus owed', rowHeight: 40, desc: 'Federal income tax withheld for the year compared with the estimated tax',
      x: { values: ['Withheld from paychecks', 'Tax you actually owe'] }, y: { format: moneyShort },
      series: [{ key: 'v', label: 'Amount', color: C.blue, values: [withheld, it.tax], format: x => money(x), colorFor: (x, i) => (i ? C.red : C.blue) }],
      labelFormat: x => money(x),
    });
    tape.print([
      { label: 'Withheld per check', v: v.withheld },
      { label: `× ${periods}`, v: withheld, op: 'mul' },
      { label: 'Tax for the year', v: it.tax, op: 'sub' },
      { label: gap >= 0 ? 'Refund' : 'Balance due', v: gap, kind: 'total' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

startTools();
