/* Health insurance: the who-pays staircase, and a two-plan comparison on demand. */
import { boot, registerTool, startTools, bindBoxes, figs, verdict, draw, $ } from '../ui.js';
import { createTape } from '../tape.js';
import * as c from '../calc.js';
import { money, moneyShort, pct } from '../format.js';

boot();

const C = { green: 'var(--series-1)', red: 'var(--series-2)', blue: 'var(--series-3)', gold: 'var(--series-4)', teal: 'var(--series-5)' };
// you-pay and plan-pays lines across total bills, with the two corners marked
function stairsSpec(plan, maxBill, title, mark) {
  const step = maxBill / 120, xs = Array.from({ length: 121 }, (_, i) => Math.round(i * step));
  const atMax = plan.coinsurance > 0 ? plan.deductible + (plan.oopMax - plan.deductible) / plan.coinsurance : Infinity;
  const ann = [{ x: Math.min(plan.deductible, maxBill), label: 'Deductible met' }];
  if (atMax <= maxBill) ann.push({ x: atMax, label: 'Maximum reached' });
  if (mark != null) ann.push({ x: mark, label: 'Your bill' });
  return {
    type: 'line', title, height: 250, desc: 'What you pay and what the plan pays as the total bill grows',
    x: { values: xs, format: v => money(v), label: 'Total bill' }, y: { format: moneyShort }, tableEvery: 10, tableLabel: 'Total bill',
    series: [
      { key: 'y', label: 'You pay', color: C.red, values: xs.map(b => c.youPayOnBill(plan, b)), format: v => money(v) },
      { key: 'p', label: 'Plan pays', color: C.blue, values: xs.map(b => b - c.youPayOnBill(plan, b)), format: v => money(v) },
    ],
    annotations: ann,
  };
}

/* ------------------------------------------------ compare two plans */
const SCEN = {
  light: { name: 'Light year', use: { visits: 2, visitCost: 180, rx: 4, rxCost: 40, other: 0 } },
  typical: { name: 'Typical year', use: { visits: 6, visitCost: 180, rx: 12, rxCost: 40, other: 1500 } },
  major: { name: 'Major year', use: { visits: 8, visitCost: 180, rx: 12, rxCost: 40, other: 40000 } },
};
registerTool('tool-plans', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = v => {
    SCEN.major.use.other = v.other;
    const plan = p => ({ premiumMonthly: v[`${p}prem`], deductible: v[`${p}ded`], coinsurance: v[`${p}coins`], oopMax: v[`${p}max`], visitCopay: v[`${p}visit`] > 0 ? v[`${p}visit`] : null, rxCopay: v[`${p}rx`] > 0 ? v[`${p}rx`] : null, employerHsa: v[`${p}hsa`] });
    const A = plan('a'), B = plan('b');
    const rows = Object.entries(SCEN).map(([key, s]) => ({ key, name: s.name, a: c.planYear(A, s.use), b: c.planYear(B, s.use) }));
    const worstA = A.premiumMonthly * 12 + A.oopMax - A.employerHsa, worstB = B.premiumMonthly * 12 + B.oopMax - B.employerHsa;
    const win = r => (r.a.total <= r.b.total ? 'A' : 'B');
    const fig = (r, hero) => ({ label: r.name, value: `Plan ${win(r)}${hero ? ` saves ${money(Math.abs(r.a.total - r.b.total))}` : ''}`, hero, note: hero ? `A ${money(r.a.total)} vs B ${money(r.b.total)} for the year` : `saves ${money(Math.abs(r.a.total - r.b.total))}` });
    figs($('[data-figs]', panel), [
      fig(rows[1], true), fig(rows[0]), fig(rows[2]),
      { label: 'Worst case, A vs B', value: `${money(worstA)} vs ${money(worstB)}`, wide: true, note: 'premiums + out-of-pocket max − employer HSA' },
    ]);
    const wins = rows.map(win);
    verdict($('[data-verdict]', panel), wins.every(w => w === wins[0])
      ? `**Plan ${wins[0]}** costs less in every kind of year here.`
      : `**Plan ${wins[0]}** wins a light year, **Plan ${wins[2]}** a major one. Can't predict? Compare worst cases: ${money(worstA)} vs ${money(worstB)}.`, wins.every(w => w === wins[0]) ? '' : 'info');
    $('[data-verdict]', panel).hidden = false;
    draw(panel, 'cmp', {
      type: 'bars', title: 'What each plan costs you for the year', height: 240, desc: 'Premiums plus out-of-pocket costs minus the employer HSA deposit, for three kinds of year',
      x: { values: rows.map(r => r.name) }, y: { format: moneyShort },
      series: [
        { key: 'a', label: 'Plan A', color: C.blue, values: rows.map(r => r.a.total), format: x => money(x) },
        { key: 'b', label: 'Plan B', color: C.gold, values: rows.map(r => r.b.total), format: x => money(x) },
      ],
    });
    const r = rows.find(x => x.key === v.scen) || rows[1];
    const lines = (label, y, P) => [
      { label: `${label}: premiums`, v: y.premiums, op: 'add' },
      ...(y.copays ? [{ label: 'Copays', v: y.copays, op: 'add' }] : []),
      { label: 'Deductible paid', v: y.deductiblePart, op: 'add' },
      { label: `Coinsurance ${pct(P.coinsurance, 0)}`, v: y.coinsurancePart, op: 'add' },
      ...(y.cappedBy ? [{ label: 'Over the max (plan pays)', v: y.cappedBy, op: 'sub' }] : []),
      ...(y.employerHsa ? [{ label: 'Employer HSA', v: y.employerHsa, op: 'sub' }] : []),
      { label: `${label} total`, v: y.total, kind: 'subtotal' },
    ];
    tape.print([
      { kind: 'note', label: `${r.name}: ${money(r.a.allowed)} of allowed charges.` },
      ...lines('Plan A', r.a, A), { kind: 'gap' },
      ...lines('Plan B', r.b, B), { kind: 'gap' },
      { label: `Plan ${win(r)} saves`, v: Math.abs(r.a.total - r.b.total), kind: 'total' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ where am I on the staircase */
registerTool('tool-stairs', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = v => {
    const plan = { deductible: v.ded, coinsurance: v.coins, oopMax: v.max };
    const youPay = c.youPayOnBill(plan, v.bill), planPays = v.bill - youPay;
    const phase = v.bill <= v.ded ? 'Still in the deductible: you pay 100%' : youPay >= v.max ? 'Past the maximum: the plan pays 100% now' : `Past the deductible: you pay ${pct(v.coins, 0)} of each bill`;
    figs($('[data-figs]', panel), [
      { label: 'You pay for care', value: money(youPay), hero: true, tone: 'bad', note: `plus ${money(v.prem * 12)} of premiums` },
      { label: 'The plan pays', value: money(planPays), tone: 'good' },
      { label: 'Share you pay', value: v.bill ? pct(youPay / v.bill, 1) : '–' },
    ]);
    verdict($('[data-verdict]', panel), `**${phase}.** ${youPay < v.max ? `${money(v.max - youPay)} more and you reach the maximum.` : ''}`, 'info');
    $('[data-verdict]', panel).hidden = false;
    draw(panel, 'st', stairsSpec(plan, Math.max(20000, Math.min(100000, v.bill * 1.6)), 'Who pays as the bill grows', v.bill));
    const dedPart = Math.min(v.bill, v.ded), coinsPart = Math.max(0, v.bill - v.ded) * v.coins;
    tape.print([
      { label: 'Allowed charges', v: v.bill },
      { label: 'Deductible portion', v: dedPart, op: 'none' },
      { label: `Remainder × ${pct(v.coins, 0)}`, v: coinsPart, op: 'add' },
      { label: 'Before the cap', v: dedPart + coinsPart, kind: 'subtotal' },
      { label: 'Out-of-pocket max', v: v.max, op: 'none' },
      { label: 'You pay (smaller)', v: youPay, kind: 'total' },
      { label: 'Premiums for the year', v: v.prem * 12, op: 'add' },
      { label: 'Your total for the year', v: youPay + v.prem * 12, kind: 'total' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

startTools();
