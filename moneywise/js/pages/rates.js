/* Interest rates: the rate-shock calculator and two more on demand. */
import { boot, registerTool, startTools, bindBoxes, figs, verdict, getRates, draw, $ } from '../ui.js';
import { createTape } from '../tape.js';
import * as c from '../calc.js';
import { money, moneyShort, pct, num, duration } from '../format.js';

boot();

const C = { green: 'var(--series-1)', red: 'var(--series-2)', blue: 'var(--series-3)', gold: 'var(--series-4)', teal: 'var(--series-5)' };

/* ------------------------------------------------ APR to APY */
registerTool('tool-apy', panel => {
  const tape = createTape($('[data-tape]', panel));
  const names = { 1: 'yearly', 4: 'quarterly', 12: 'monthly', 365: 'daily' };
  const update = v => {
    const n = Number(v.n) || 365, apy = c.aprToApy(v.apr, n);
    figs($('[data-figs]', panel), [
      { label: `APY, compounded ${names[n]}`, value: pct(apy, 3, true), hero: true },
      { label: 'Interest in one year', value: money(v.amount * apy, { cents: true }), note: `on ${money(v.amount)}` },
      { label: 'Extra from compounding', value: money(v.amount * (apy - v.apr), { cents: true }), note: 'versus simple interest' },
    ]);
    verdict($('[data-verdict]', panel), `Compare **APY with APY**. On a loan, ${pct(v.apr, 2, true)} added daily really costs ${pct(c.aprToApy(v.apr, 365), 2, true)} a year.`, 'info');
    $('[data-verdict]', panel).hidden = false;
    const freqs = [[1, 'Yearly'], [4, 'Quarterly'], [12, 'Monthly'], [365, 'Daily'], [Infinity, 'Continuous']];
    draw(panel, 'apy', {
      type: 'hbars', title: `${pct(v.apr, 2, true)} stated, by how often interest is added`, rowHeight: 30, desc: 'APY for each compounding frequency',
      x: { values: freqs.map(f => f[1]) }, y: { format: x => x.toFixed(2) + '%', min: 0 },
      series: [{ key: 'a', label: 'APY', color: C.blue, values: freqs.map(f => c.aprToApy(v.apr, f[0]) * 100), format: x => x.toFixed(3) + '%' }],
    });
    tape.print([
      { label: 'Stated rate (APR)', text: pct(v.apr, 3, true) },
      { label: `÷ ${n} periods`, text: pct(v.apr / n, 5, true), op: 'div' },
      { label: '1 + periodic rate', text: num(1 + v.apr / n, 6), op: 'add' },
      { label: `Raised to the ${n}`, text: num(Math.pow(1 + v.apr / n, n), 6), op: 'none' },
      { label: '− 1', text: pct(apy, 4, true), op: 'sub' },
      { label: 'APY', text: pct(apy, 3, true), kind: 'total' },
      { label: 'Balance', v: v.amount },
      { label: '× APY', v: v.amount * apy, op: 'mul' },
      { label: 'One year of interest', v: v.amount * apy, kind: 'total' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ compound growth */
registerTool('tool-grow', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = v => {
    const n = Number(v.n) || 12, years = Math.max(1, Math.round(v.years));
    const rows = c.growth({ start: v.start, monthly: v.monthly, annualRate: v.rate, years, periods: n });
    const end = rows[rows.length - 1], real = c.realValue(end.balance, v.infl, years);
    const dbl = c.yearsToDouble(c.aprToApy(v.rate, n));
    figs($('[data-figs]', panel), [
      { label: `After ${years} years`, value: money(end.balance), hero: true, note: `${money(real)} in today's dollars` },
      { label: 'You put in', value: money(end.contributed) },
      { label: 'Interest earned', value: money(end.interest), tone: 'good' },
      { label: 'Doubles every', value: Number.isFinite(dbl) ? `${num(dbl, 1)} yrs` : 'never', note: v.rate > 0 ? `Rule of 72: 72 ÷ ${num(v.rate * 100, 2)} = ${num(72 / (v.rate * 100), 1)}` : '' },
    ]);
    const realRate = (1 + c.aprToApy(v.rate, n)) / (1 + v.infl) - 1;
    verdict($('[data-verdict]', panel), realRate >= 0 ? `After inflation you gain about **${pct(realRate, 2, true)} a year** in buying power.` : `At this rate you **lose about ${pct(-realRate, 2, true)} a year** of buying power to inflation, even as the balance grows.`, realRate >= 0 ? '' : 'warn');
    $('[data-verdict]', panel).hidden = false;
    draw(panel, 'grow', {
      type: 'line', title: 'Balance over time', height: 240, desc: 'Money put in, balance with interest, and the balance in today\'s dollars',
      x: { values: rows.map(r => r.year), format: y => (y ? `Year ${y}` : 'Start') }, y: { format: moneyShort },
      series: [
        { key: 'p', label: 'Put in', color: C.blue, values: rows.map(r => r.contributed), format: x => money(x) },
        { key: 'b', label: 'Balance', color: C.green, values: rows.map(r => r.balance), format: x => money(x), area: true },
        { key: 'r', label: "In today's dollars", color: C.gold, values: rows.map(r => c.realValue(r.balance, v.infl, r.year)), format: x => money(x), dash: true },
      ],
    });
    tape.print([
      { label: 'Starting amount', v: v.start },
      { label: `${years * 12} deposits of ${money(v.monthly)}`, v: v.monthly * years * 12, op: 'add' },
      { label: 'Total put in', v: end.contributed, kind: 'subtotal' },
      { label: 'Interest earned', v: end.interest, op: 'add' },
      { label: 'Balance', v: end.balance, kind: 'total' },
      { label: `÷ (1 + ${pct(v.infl, 2, true)})^${years}`, text: num(Math.pow(1 + v.infl, years), 4), op: 'div' },
      { label: "In today's dollars", v: real, kind: 'total' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ rate shock */
// today's 30-year rate, from the same document as every other number (the live feed updates it through 'mw:rates')
let base30 = 0.07;
registerTool('tool-shock', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = v => {
    const d = v.shock / 100, dm = v.mShock / 100;
    const cardCost = v.card * d, helocCost = v.heloc * d, savGain = v.savings * d;
    const base = base30;
    const mortCost = (c.payment(v.mortgage, base + dm, 360) - c.payment(v.mortgage, base, 360)) * 12;
    const net = cardCost + helocCost + mortCost - savGain;
    figs($('[data-figs]', panel), [
      { label: 'Net change per year', value: (net >= 0 ? '+' : '−') + money(Math.abs(net)), hero: true, tone: net > 0 ? 'bad' : 'good', note: net >= 0 ? 'more out of your pocket' : 'less out of your pocket' },
      { label: 'Card interest', value: (cardCost >= 0 ? '+' : '−') + money(Math.abs(cardCost)), tone: cardCost > 0 ? 'bad' : cardCost < 0 ? 'good' : '', note: `now ${pct(v.cardApr + d, 2, true)}` },
      { label: 'Savings interest', value: (savGain >= 0 ? '+' : '−') + money(Math.abs(savGain)), tone: savGain > 0 ? 'good' : savGain < 0 ? 'bad' : '', note: `now ${pct(Math.max(0, v.savRate + d), 2, true)}` },
      { label: 'Home equity line', value: (helocCost >= 0 ? '+' : '−') + money(Math.abs(helocCost)), note: `now ${pct(v.helocRate + d, 2, true)}` },
      { label: 'New mortgage, a year', value: (mortCost >= 0 ? '+' : '−') + money(Math.abs(mortCost)), note: `rate ${pct(base + dm, 2, true)}` },
    ]);
    verdict($('[data-verdict]', panel), 'Card and home equity rates follow the Fed within weeks. Savings follow slower. **New mortgages** follow the bond market instead.', 'info');
    $('[data-verdict]', panel).hidden = false;
    const items = [['Credit card', cardCost], ['Home equity line', helocCost], ['New mortgage, a year', mortCost], ['Savings (earned)', -savGain]];
    draw(panel, 'shock', {
      type: 'hbars', title: 'Yearly change in what you pay', rowHeight: 34, desc: 'Change in yearly interest for each account; savings shown as a cost when it earns less',
      x: { values: items.map(i => i[0]) }, y: { format: moneyShort },
      series: [{ key: 's', label: 'Change', color: C.red, values: items.map(i => i[1]), format: x => (x >= 0 ? '+' : '−') + money(Math.abs(x)), colorFor: x => (x > 0 ? C.red : C.green) }],
    });
    tape.print([
      { label: 'Fed move', text: (v.shock >= 0 ? '+' : '') + num(v.shock, 2) + ' pts' },
      { label: `Card ${money(v.card)} × move`, v: cardCost, op: cardCost >= 0 ? 'add' : 'sub' },
      { label: `HELOC ${money(v.heloc)} × move`, v: helocCost, op: helocCost >= 0 ? 'add' : 'sub' },
      { label: 'Mortgage, 12 payments', v: mortCost, op: mortCost >= 0 ? 'add' : 'sub' },
      { label: `Savings ${money(v.savings)} × move`, v: -savGain, op: savGain >= 0 ? 'sub' : 'add' },
      { label: 'Net yearly change', v: net, kind: 'total' },
    ]);
  };
  const b = bindBoxes(panel, update);
  const take = doc => { const s30 = doc && doc.series && doc.series.MORTGAGE30US; if (s30) { base30 = s30.latest.value / 100; b.fire(); } };
  getRates().then(take).catch(() => {});
  document.addEventListener('mw:rates', e => take(e.detail));
  update(b.values());
});

startTools();
