/* Car loans: the total-cost calculator and two more on demand. */
import { boot, registerTool, startTools, bindBoxes, figs, verdict, draw, $ } from '../ui.js';
import { createTape } from '../tape.js';
import * as c from '../calc.js';
import { money, moneyShort, pct, num, duration } from '../format.js';

boot();

const C = { green: 'var(--series-1)', red: 'var(--series-2)', blue: 'var(--series-3)', gold: 'var(--series-4)', teal: 'var(--series-5)' };
/* ------------------------------------------------ total cost */
registerTool('tool-deal', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = v => {
    const months = Number(v.months) || 72;
    const d = c.autoDeal({ ...v, months });
    const uw = c.underwaterMonths(d.financed, v.apr, months, v.price);
    const totalAll = (v.down || 0) + d.totalOfPayments;
    figs($('[data-figs]', panel), [
      { label: 'This car costs you', value: money(totalAll + d.tradeEquity), hero: true, note: 'cash down plus every payment' },
      { label: 'Monthly payment', value: money(d.payment), note: `${months} months at ${pct(v.apr, 2, true)}` },
      { label: 'Total interest', value: money(d.totalInterest), tone: 'bad' },
      { label: 'Amount financed', value: money(d.financed), note: d.negativeEquity ? `includes ${money(d.negativeEquity)} of old loan` : `out-the-door ${money(d.outTheDoor)}` },
      { label: 'Underwater', value: uw.months ? `${uw.months} months` : 'never', tone: uw.months ? 'bad' : 'good', note: uw.months ? `months ${uw.first} to ${uw.last}, by up to ${money(uw.worst)}` : 'balance stays below value' },
    ]);
    verdict($('[data-verdict]', panel), d.negativeEquity > 0
      ? `**${money(d.negativeEquity)}** of your old loan rides in this one, collecting interest for ${months} months.`
      : uw.months > 12 ? `You'd owe more than the car is worth for **${uw.months} months**. Put more down or shorten the loan.` : 'The loan stays at or below the car\'s value. A sound deal.', d.negativeEquity > 0 || uw.months > 12 ? 'warn' : '');
    $('[data-verdict]', panel).hidden = false;
    const terms = [36, 48, 60, 72, 84].map(m => ({ m, d: c.autoDeal({ ...v, months: m }) }));
    draw(panel, 'terms', {
      type: 'hbars', stacked: true, title: 'Same car, longer loan: what you repay', rowHeight: 36,
      desc: 'Amount financed plus total interest for each loan term',
      x: { values: terms.map(t => `${t.m} mo · ${money(t.d.payment)}/mo`) }, y: { format: moneyShort },
      series: [
        { key: 'f', label: 'Amount financed', color: C.blue, values: terms.map(t => t.d.financed), format: x => money(x) },
        { key: 'i', label: 'Interest', color: C.red, values: terms.map(t => t.d.totalInterest), format: x => money(x) },
      ],
    });
    tape.print([
      { label: 'Vehicle price', v: v.price, op: 'add' },
      ...(v.rebate ? [{ label: 'Rebate', v: v.rebate, op: 'sub' }] : []),
      { label: `Sales tax ${pct(v.taxRate, 2)}`, v: d.tax, op: 'add' },
      { label: 'Fees', v: v.fees, op: 'add' },
      ...(v.addOns ? [{ label: 'Add-ons', v: v.addOns, op: 'add' }] : []),
      { label: 'Out-the-door', v: d.outTheDoor, kind: 'subtotal' },
      { label: 'Cash down', v: v.down, op: 'sub' },
      ...(d.tradeEquity ? [{ label: 'Trade equity', v: d.tradeEquity, op: 'sub' }] : []),
      ...(d.negativeEquity ? [{ label: 'Negative equity rolled in', v: d.negativeEquity, op: 'add' }] : []),
      { label: 'Amount financed', v: d.financed, kind: 'subtotal' },
      { label: `Rate ${pct(v.apr, 2, true)} ÷ 12`, text: pct(v.apr / 12, 4, true) },
      { label: `Payment × ${months}`, v: d.payment, op: 'eq' },
      { label: 'All payments', v: d.totalOfPayments },
      { label: 'Amount financed', v: d.financed, op: 'sub' },
      { label: 'Total interest', v: d.totalInterest, kind: 'total' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ 0% or rebate */
registerTool('tool-promo', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = v => {
    const months = Number(v.months) || 60;
    const r = c.rebateVsPromo({ price: v.price, rebate: v.rebate, promoApr: v.promoApr, bankApr: v.bankApr, months, down: v.down });
    // the rebate at which the two paths cost the same
    const promoPay = r.promoPay, rr = v.bankApr / 12;
    const pvAtBank = rr === 0 ? promoPay * months : promoPay * (1 - Math.pow(1 + rr, -months)) / rr;
    const breakEvenRebate = Math.max(0, (v.price - v.down) - pvAtBank);
    const promoWins = r.better === 'promo';
    figs($('[data-figs]', panel), [
      { label: promoWins ? 'Take the promotional rate' : 'Take the rebate', value: `saves ${money(r.difference)}`, hero: true, tone: 'good', note: `over ${months} months` },
      { label: `Promo: ${pct(v.promoApr, 2, true)} on ${money(v.price - v.down)}`, value: `${money(r.promoPay)}/mo`, note: `${money(r.promoTotal)} in all` },
      { label: `Rebate: ${pct(v.bankApr, 2, true)} on ${money(v.price - v.rebate - v.down)}`, value: `${money(r.rebatePay)}/mo`, note: `${money(r.rebateTotal)} in all` },
    ]);
    verdict($('[data-verdict]', panel), `At your ${pct(v.bankApr, 2, true)} rate, any rebate over **${money(breakEvenRebate)}** beats the promo rate. Promo rates need top credit.`, 'info');
    $('[data-verdict]', panel).hidden = false;
    draw(panel, 'cmp', {
      type: 'hbars', title: 'Everything you pay', rowHeight: 44, desc: 'Total paid under each option',
      x: { values: ['Promotional rate', 'Rebate + your loan'] }, y: { format: moneyShort },
      series: [{ key: 't', label: 'Total paid', color: C.blue, values: [r.promoTotal, r.rebateTotal], format: x => money(x), colorFor: (x, i) => ((i === 0) === promoWins ? C.green : C.red) }],
    });
    tape.print([
      { label: 'Price', v: v.price },
      { label: 'Cash down', v: v.down, op: 'sub' },
      { label: `Promo ${pct(v.promoApr, 2, true)}, ${months} mo`, v: r.promoPay, op: 'eq' },
      { label: 'Promo, all payments', v: r.promoTotal, kind: 'subtotal' },
      { kind: 'gap' },
      { label: 'Price', v: v.price },
      { label: 'Rebate', v: v.rebate, op: 'sub' },
      { label: 'Cash down', v: v.down, op: 'sub' },
      { label: `Loan ${pct(v.bankApr, 2, true)}, ${months} mo`, v: r.rebatePay, op: 'eq' },
      { label: 'Rebate path, all payments', v: r.rebateTotal, kind: 'subtotal' },
      { kind: 'gap' },
      { label: 'Difference', v: r.difference, kind: 'total' },
      { label: 'Break-even rebate', v: breakEvenRebate },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ car loan interest deduction (2025 to 2028) */
let TAX = null;
const taxReady = fetch('/moneywise/data/tax-2026.json').then(r => r.json()).then(j => (TAX = j));
registerTool('tool-deduct', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = async v => {
    if (!TAX) await taxReady;
    const months = Number(v.months) || 72, start = Number(v.startMonth) || 1;
    const am = c.amortize({ principal: v.loan, annualRate: v.apr, months });
    // interest by calendar year, first payment in month `start` of 2026
    const years = [2026, 2027, 2028, 2029];
    const byYear = years.map((y, i) => {
      const from = i === 0 ? 0 : (13 - start) + (i - 1) * 12, to = i === 0 ? 13 - start : from + 12;
      return am.rows.slice(from, to).reduce((s, r) => s + r.interest, 0);
    });
    const rules = TAX.schedule1A;
    const ded = byYear.map((int, i) => (v.usa && years[i] <= 2028 ? c.schedule1A({ magi: v.magi, mfj: v.filing === 'mfj', carInterest: int }, rules).carInterest : 0));
    const rate = Number(v.bracket);
    const saved = ded.map(d => d * rate), totalSaved = saved.reduce((a, b) => a + b, 0);
    figs($('[data-figs]', panel), [
      { label: 'Tax saved, 2026 to 2028', value: money(totalSaved), hero: true, tone: totalSaved > 0 ? 'good' : '', note: v.usa ? `at a ${pct(rate, 0)} bracket` : 'vehicle does not qualify' },
      { label: '2026 interest paid', value: money(byYear[0]), note: `${13 - start} payments in 2026` },
      { label: '2026 deduction', value: money(ded[0]), note: ded[0] < byYear[0] && v.usa ? 'reduced by the income phase-out' : 'up to $10,000 a year' },
    ]);
    const limit = v.filing === 'mfj' ? 200000 : 100000;
    verdict($('[data-verdict]', panel), !v.usa
      ? 'Used cars, leases, business vehicles and cars assembled outside the U.S. do not qualify.'
      : v.magi > limit ? `Above ${money(limit)} the deduction shrinks $200 per $1,000 of income. It's gone at ${money(limit + 50000)}.` : 'Claim it on **Schedule 1-A**, even with the standard deduction. It ends after 2028.', !v.usa || v.magi > limit ? 'warn' : 'info');
    $('[data-verdict]', panel).hidden = false;
    draw(panel, 'years', {
      type: 'bars', title: 'Interest paid and the part you can deduct, by tax year', height: 220, desc: 'Interest paid each calendar year and the deductible amount',
      x: { values: years.map(String) }, y: { format: moneyShort },
      series: [
        { key: 'i', label: 'Interest paid', color: C.red, values: byYear, format: x => money(x) },
        { key: 'd', label: 'Deductible', color: C.green, values: ded, format: x => money(x) },
      ],
    });
    tape.print([
      { label: '2026 interest', v: byYear[0] },
      { label: 'Cap', v: 10000, op: 'none' },
      { label: `MAGI over ${money(limit)}`, v: Math.max(0, v.magi - limit), op: 'none' },
      { label: 'Phase-out reduction', v: Math.max(0, Math.min(byYear[0], 10000) - ded[0]), op: 'sub' },
      { label: '2026 deduction', v: ded[0], kind: 'subtotal' },
      { label: `× bracket ${pct(rate, 0)}`, v: saved[0], op: 'mul' },
      { label: '2027 deduction', v: ded[1], op: 'add' },
      { label: '2028 deduction', v: ded[2], op: 'add' },
      { label: 'Tax saved, 3 years', v: totalSaved, kind: 'total' },
      { kind: 'note', label: 'Estimate: the deduction lowers taxable income, so the saving is the deduction times your bracket.' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

startTools();
