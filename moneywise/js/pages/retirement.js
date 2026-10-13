/* Savings & retirement: the 401(k) projection, plus fee drag and inflation on demand. */
import { boot, registerTool, startTools, bindBoxes, figs, verdict, draw, $ } from '../ui.js';
import { createTape } from '../tape.js';
import * as c from '../calc.js';
import { money, moneyShort, pct } from '../format.js';

boot();

const C = { green: 'var(--series-1)', red: 'var(--series-2)', blue: 'var(--series-3)', gold: 'var(--series-4)', teal: 'var(--series-5)' };
const SWR = 0.039; // Morningstar's 2025 safe starting withdrawal rate

let LIM = null;
const ready = fetch('/moneywise/data/limits-2026.json').then(r => r.json()).then(j => (LIM = j.retirement));

/* ------------------------------------------------ your 401(k) */
registerTool('tool-proj', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = async v => {
    if (!LIM) await ready;
    const tiers = v.mRate > 0 && v.mUpTo > 0 ? [{ rate: v.mRate, upTo: v.mUpTo }] : [];
    const base = { age: v.age, retireAge: v.retire, salary: v.salary, salaryGrowth: v.raise, contribPct: v.contrib, tiers, balance: v.balance, returnRate: v.ret, fee: v.fee, inflation: v.infl, limit: LIM.employeeDeferral, catchUp: LIM.catchUp50, catchUp6063: LIM.catchUp60to63 };
    if (!(v.retire > v.age)) {
      figs($('[data-figs]', panel), [{ label: 'Years to grow', value: '0', hero: true, note: 'set a retirement age above your age' }]);
      $('[data-verdict]', panel).hidden = true;
      return;
    }
    const p = c.retirementProjection(base), f = p.final, years = v.retire - v.age;
    const income = f.real * SWR / 12;
    const y1 = p.rows[1];
    const m1 = c.employerMatch(v.salary, y1.contributed / v.salary, tiers);
    const cappedYears = p.rows.filter(r => r.capped).length;
    figs($('[data-figs]', panel), [
      { label: `Balance at ${v.retire}`, value: money(f.balance), hero: true, note: `${money(f.real)} in today's dollars` },
      { label: 'Monthly income at 3.9%', value: money(income), note: 'today\'s dollars, before Social Security' },
      { label: 'Employer added', value: money(f.matched), tone: f.matched ? 'good' : '', note: tiers.length ? 'free money from the match' : 'no match entered' },
      { label: 'You put in', value: money(f.contributed), note: v.balance ? `plus the ${money(v.balance)} saved today` : `over ${years} years` },
      { label: 'Growth', value: money(f.growth), tone: f.growth >= 0 ? 'good' : 'bad', note: `${pct(p.netReturn, 2, true)} a year after fees` },
    ]);
    if (v.contrib < m1.maxPct && m1.missed > 0.5) {
      const full = c.retirementProjection({ ...base, contribPct: Math.max(v.contrib, m1.maxPct) }).final;
      verdict($('[data-verdict]', panel), `You're leaving **${money(m1.missed)} a year** of free match unclaimed. Putting in ${pct(m1.maxPct, 1)} means about **${money(full.balance - f.balance)} more** at ${v.retire}.`, 'warn');
    } else if (cappedYears) {
      verdict($('[data-verdict]', panel), `You hit the IRS limit in **${cappedYears} of ${years} years**. An IRA (${money(LIM.ira)} in 2026) or an HSA can take more.`, 'info');
    } else {
      const more = c.retirementProjection({ ...base, contribPct: v.contrib + 0.01 }).final;
      verdict($('[data-verdict]', panel), `Each extra 1% of pay adds about **${money(more.balance - f.balance)}** by ${v.retire} (${money(more.real - f.real)} in today's dollars).`, 'info');
    }
    $('[data-verdict]', panel).hidden = false;
    const rows = p.rows.slice(1);
    draw(panel, 'p', {
      type: 'bars', stacked: true, title: `Your balance each year, age ${v.age + 1} to ${v.retire}`, height: 280, desc: 'Year-end balance split into your money (including today\'s balance), the employer match, and growth',
      x: { values: rows.map(r => r.age), format: a => String(a) }, y: { format: moneyShort }, tableEvery: 5, tableLabel: 'Age',
      series: [
        { key: 'you', label: 'Your money', color: C.blue, values: rows.map(r => r.start + r.contributed), format: x => money(x) },
        { key: 'match', label: 'Employer match', color: C.gold, values: rows.map(r => r.matched), format: x => money(x) },
        { key: 'growth', label: 'Growth', color: C.teal, values: rows.map(r => r.growth), format: x => money(x) },
      ],
    }, { wide: true });
    const infl = Math.pow(1 + v.infl, years);
    tape.print([
      { label: 'Saved so far', v: v.balance, op: 'none' },
      { label: `Year 1: you put in ${pct(v.contrib, 1)}`, v: y1.contributed, op: 'add' },
      { label: 'Year 1: employer match', v: y1.matched, op: 'add' },
      { label: `Return ${pct(v.ret, 2)}, fees ${pct(v.fee, 2)}`, text: pct(p.netReturn, 2, true), op: 'pct' },
      { kind: 'note', label: `Repeated for ${years} years, pay rising ${pct(v.raise, 2)}` },
      { label: 'Your money, all years', v: f.contributed, op: 'add' },
      { label: 'Employer match, all years', v: f.matched, op: 'add' },
      { label: 'Growth', v: f.growth, op: f.growth < 0 ? 'sub' : 'add' },
      { label: `Balance at ${v.retire}`, v: f.balance, kind: 'total' },
      { label: `Inflation: ${(1 + v.infl).toFixed(3)} ^ ${years}`, text: infl.toFixed(4), op: 'div' },
      { label: 'In today\'s dollars', v: f.real, kind: 'subtotal' },
      { label: 'Withdraw 3.9% a year ÷ 12', text: (SWR / 12).toFixed(5), op: 'mul' },
      { label: 'Monthly income, today\'s $', v: income, kind: 'total' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ fee drag */
registerTool('tool-fees', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = v => {
    const years = Math.max(1, Math.round(v.years));
    const none = c.afterFees(v.start, v.ret, 0, years), a = c.afterFees(v.start, v.ret, v.feeA, years), b = c.afterFees(v.start, v.ret, v.feeB, years);
    const gap = a - b;
    figs($('[data-figs]', panel), [
      { label: 'The higher fee costs you', value: money(Math.abs(gap)), hero: true, tone: gap > 0 ? 'bad' : '', note: `${pct(Math.abs(gap) / Math.max(a, b), 1)} of the ending balance after ${years} years` },
      { label: `At ${pct(v.feeA, 2, true)}`, value: money(a), tone: 'good', note: `fees and their lost growth: ${money(none - a)}` },
      { label: `At ${pct(v.feeB, 2, true)}`, value: money(b), note: `fees and their lost growth: ${money(none - b)}` },
    ]);
    verdict($('[data-verdict]', panel), `**${pct(Math.abs(v.feeB - v.feeA), 2, true)} a year** sounds tiny. Over ${years} years it costs **${money(Math.abs(gap))}**, because fees stop that money growing.`, gap > 0 ? 'warn' : 'info');
    $('[data-verdict]', panel).hidden = false;
    const yrs = Array.from({ length: years + 1 }, (_, i) => i);
    draw(panel, 'f', {
      type: 'line', title: `${money(v.start)} at ${pct(v.ret, 2)} a year`, height: 260, desc: 'Balance with no fees and at each fee level', endLabels: true,
      x: { values: yrs, format: y => `Yr ${y}`, label: 'Year' }, y: { format: moneyShort, min: v.start }, tableEvery: Math.max(1, Math.round(years / 8)), tableLabel: 'Year',
      series: [
        { key: 'n', label: 'No fees', color: C.blue, dash: true, values: yrs.map(y => c.afterFees(v.start, v.ret, 0, y)), format: x => money(x) },
        { key: 'a', label: `${pct(v.feeA, 2, true)} fees`, color: C.green, values: yrs.map(y => c.afterFees(v.start, v.ret, v.feeA, y)), format: x => money(x) },
        { key: 'b', label: `${pct(v.feeB, 2, true)} fees`, color: C.red, values: yrs.map(y => c.afterFees(v.start, v.ret, v.feeB, y)), format: x => money(x) },
      ],
    });
    tape.print([
      { label: 'Invested', v: v.start, op: 'none' },
      { label: `(1 + ${pct(v.ret, 2)}) × (1 − ${pct(v.feeA, 2)}), ^ ${years}`, text: Math.pow((1 + v.ret) * (1 - v.feeA), years).toFixed(4), op: 'mul' },
      { label: 'Low-cost fund', v: a, kind: 'subtotal' },
      { kind: 'gap' },
      { label: 'Invested', v: v.start, op: 'none' },
      { label: `(1 + ${pct(v.ret, 2)}) × (1 − ${pct(v.feeB, 2)}), ^ ${years}`, text: Math.pow((1 + v.ret) * (1 - v.feeB), years).toFixed(4), op: 'mul' },
      { label: 'Higher-cost fund', v: b, kind: 'subtotal' },
      { kind: 'gap' },
      { label: 'Low-cost fund', v: a, op: 'none' },
      { label: 'Higher-cost fund', v: b, op: 'sub' },
      { label: 'Cost of the higher fee', v: gap, kind: 'total' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ inflation */
registerTool('tool-infl', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = v => {
    const years = Math.max(1, Math.round(v.years));
    const later = c.futureCost(v.amount, v.infl, years), buys = c.realValue(v.amount, v.infl, years);
    const saved = v.amount * Math.pow(1 + v.yield, years), savedReal = c.realValue(saved, v.infl, years);
    const realYield = (1 + v.yield) / (1 + v.infl) - 1;
    figs($('[data-figs]', panel), [
      { label: `Costs in ${years} years`, value: money(later), hero: true, note: `what ${money(v.amount)} of things cost today` },
      { label: 'Cash kept at home buys', value: money(buys), tone: 'bad', note: 'in today\'s prices' },
      { label: `In savings at ${pct(v.yield, 2, true)}`, value: money(saved), note: `worth ${money(savedReal)} in today's prices` },
      { label: 'Real yield', value: pct(realYield, 2, true), tone: realYield >= 0 ? 'good' : 'bad', note: 'what your savings earn after inflation' },
    ]);
    verdict($('[data-verdict]', panel), realYield < 0
      ? `Your savings rate is below inflation: the money **loses ${pct(-realYield, 2, true)} of buying power a year**.`
      : `Your savings beat inflation by **${pct(realYield, 2, true)} a year**.`, realYield < 0 ? 'warn' : 'info');
    $('[data-verdict]', panel).hidden = false;
    const yrs = Array.from({ length: years + 1 }, (_, i) => i);
    draw(panel, 'i', {
      type: 'line', title: `${money(v.amount)} today, over ${years} years`, height: 260, desc: 'Rising price of today\'s purchases against money in savings and cash kept at home', endLabels: true,
      x: { values: yrs, format: y => `Yr ${y}`, label: 'Year' }, y: { format: moneyShort }, tableEvery: Math.max(1, Math.round(years / 8)), tableLabel: 'Year',
      series: [
        { key: 'p', label: 'What it costs', color: C.red, values: yrs.map(y => c.futureCost(v.amount, v.infl, y)), format: x => money(x) },
        { key: 's', label: 'Money in savings', color: C.green, values: yrs.map(y => v.amount * Math.pow(1 + v.yield, y)), format: x => money(x) },
        { key: 'c', label: 'Cash at home', color: C.blue, dash: true, values: yrs.map(() => v.amount), format: x => money(x) },
      ],
    });
    tape.print([
      { label: 'Costs today', v: v.amount, op: 'none' },
      { label: `Inflation: ${(1 + v.infl).toFixed(4)} ^ ${years}`, text: Math.pow(1 + v.infl, years).toFixed(4), op: 'mul' },
      { label: `Costs in ${years} years`, v: later, kind: 'subtotal' },
      { kind: 'gap' },
      { label: 'Cash today', v: v.amount, op: 'none' },
      { label: `Inflation: ${(1 + v.infl).toFixed(4)} ^ ${years}`, text: Math.pow(1 + v.infl, years).toFixed(4), op: 'div' },
      { label: 'Buys, in today\'s prices', v: buys, kind: 'subtotal' },
      { kind: 'gap' },
      { label: 'Savings today', v: v.amount, op: 'none' },
      { label: `Interest: ${(1 + v.yield).toFixed(4)} ^ ${years}`, text: Math.pow(1 + v.yield, years).toFixed(4), op: 'mul' },
      { label: `Balance in ${years} years`, v: saved, kind: 'subtotal' },
      { label: `Inflation: ${(1 + v.infl).toFixed(4)} ^ ${years}`, text: Math.pow(1 + v.infl, years).toFixed(4), op: 'div' },
      { label: 'Savings, in today\'s prices', v: savedReal, kind: 'total' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

startTools();
