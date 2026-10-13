// Interest rates: the rate-shock calculator, four cards, five costly mistakes.
import * as calc from '../../js/calc.js';
import { money, pct, num } from '../../js/format.js';

export default (k) => {
  const { t, box, lines, val, rates } = k;
  const S = rates.series;
  const h = (id, m) => { const p = S[id].history.find(x => x[0] === m); return p ? p[1] : null; };
  const fed = S.FEDTARGET.latest, prime = val('DPRIME'), t10 = val('DGS10'), bill = val('DTB3'), sav = val('SNDR');
  const card = val('TERMCBCCALLNS'), cardInt = val('TERMCBCCINTNS'), cpi = val('CPIAUCSL');
  const mo0 = h('MORTGAGE30US', '2024-09'), mo1 = h('MORTGAGE30US', '2025-12');
  const daily = cardInt / 100 / 365, cycle = 5000 * daily * 30, apyCard = calc.aprToApy(cardInt / 100, 365);
  const realSav = (1 + sav / 100) / (1 + cpi / 100) - 1;
  const owe = 6000 * (cardInt - bill) / 100;

  const hero = { id: 'tool-shock', label: 'What a Fed move does to your money', intro: 'Slide the Fed\'s rate up or down and see a year of your borrowing and saving change.',
    boxes:
      box({ k: 'shock', label: 'Fed move', unit: 'pts', type: 'num', value: 1, min: -3, max: 3, step: 0.25 }) +
      box({ k: 'card', label: 'Card balance you carry', value: 6000, min: 0, max: 50000, step: 250 }) +
      box({ k: 'savings', label: 'Money in savings', value: 15000, min: 0, max: 300000, step: 500 }),
    more:
      box({ k: 'cardApr', label: 'Card rate', type: 'pct', value: card, min: 0, max: 36, step: 0.05, live: 'TERMCBCCALLNS', dp: 2 }) +
      box({ k: 'savRate', label: 'Savings rate', type: 'pct', value: bill, min: 0, max: 10, step: 0.05, live: 'DTB3', dp: 2 }) +
      box({ k: 'heloc', label: 'Home equity line', value: 40000, min: 0, max: 300000, step: 1000 }) +
      box({ k: 'helocRate', label: 'Its rate', hint: 'prime + 1', type: 'pct', value: prime + 1, min: 0, max: 20, step: 0.05, dp: 2 }) +
      box({ k: 'mortgage', label: 'Mortgage you plan to take', value: 350000, min: 0, max: 1500000, step: 5000 }) +
      box({ k: 'mShock', label: 'Mortgage rate move', unit: 'pts', type: 'num', value: 0.5, min: -3, max: 3, step: 0.25 }) };

  const more = [
    { id: 'tool-apy', label: 'APR to APY', hint: 'What a rate really pays', intro: 'How often interest is added changes what a rate is worth.',
      boxes:
        box({ k: 'apr', label: 'Stated rate (APR)', type: 'pct', value: 5, min: 0, max: 30, step: 0.05, dp: 2 }) +
        box({ k: 'amount', label: 'Balance', value: 10000, min: 100, max: 100000, step: 100 }) +
        box({ k: 'n', label: 'Interest added', type: 'seg', value: 365, options: [[1, 'Yearly'], [4, 'Quarterly'], [12, 'Monthly'], [365, 'Daily']] }) },
    { id: 'tool-grow', label: 'Compound growth', hint: 'Watch money grow', intro: 'The rate starts at the 3-month Treasury bill, close to what high-yield savings pay.',
      boxes:
        box({ k: 'start', label: 'Starting amount', value: 10000, min: 0, max: 200000, step: 500 }) +
        box({ k: 'monthly', label: 'Added each month', value: 200, min: 0, max: 5000, step: 25 }) +
        box({ k: 'years', label: 'Years', type: 'num', value: 20, min: 1, max: 50, step: 1 }),
      more:
        box({ k: 'rate', label: 'Yearly rate', type: 'pct', value: bill, min: 0, max: 15, step: 0.05, live: 'DTB3', dp: 2 }) +
        box({ k: 'infl', label: 'Inflation', type: 'pct', value: Math.round(cpi * 100) / 100, min: 0, max: 10, step: 0.05, live: 'CPIAUCSL', dp: 2 }) +
        box({ k: 'n', label: 'Compounding', type: 'seg', value: 12, wide: true, options: [[1, 'Yearly'], [12, 'Monthly'], [365, 'Daily']] }) },
  ];

  const cards = [
    { big: pct(calc.aprToApy(0.05, 365), 2, true), line: 'what a 5% rate really pays when interest is added daily.',
      back: 'That yearly total is the APY. Banks quote savings in APY, the bigger number, and loans in APR, the smaller one. Compare APY with APY.' },
    { big: `${card.toFixed(2)}%`, line: `the average card rate. Average savings pays ${sav.toFixed(2)}%.`,
      back: `Paying off a card is a sure ${card.toFixed(0)}% return. High-yield savings pay close to the ${bill.toFixed(2)}% Treasury bill rate, not the average.` },
    { big: `${prime.toFixed(2)}%`, line: 'the prime rate: the Fed\'s top rate plus 3. Card rates sit on top.',
      back: 'When the Fed moves, prime moves the same day. Variable card and home equity rates follow within a statement or two.' },
    { big: `${t10.toFixed(2)}%`, line: 'the 10-year Treasury. Mortgage rates follow it, not the Fed.',
      back: `From Sep 2024 to Dec 2025 the Fed cut 1.75 points, yet the 30-year rate went from ${mo0.toFixed(2)}% to ${mo1.toFixed(2)}%. The 10-year rose.` },
  ];

  const slips = [
    { title: 'Keeping $10,000 at the average savings rate', cost: `${money(10000 * (bill - sav) / 100)}/yr`, fix: `Use an FDIC-insured ${t('hysa', 'high-yield savings')} account or Treasury bills for cash you won't spend soon.` },
    { title: 'Saving at 4% while a card charges 22%', cost: `${money(owe)}/yr`, fix: 'That is the yearly cost on $6,000. Keep a small emergency fund, then pay the card down.' },
    { title: 'Reading a card\'s APR as its true cost', cost: `${pct(apyCard, 2, true)}`, fix: `Interest is added daily, so a ${pct(cardInt / 100, 2, true)} ${t('apr')} really costs ${pct(apyCard, 2, true)} a year on a carried balance.` },
    { title: 'Waiting for a Fed cut to buy a house', cost: `${mo0.toFixed(2)}→${mo1.toFixed(2)}%`, fix: 'Mortgage rates barely moved through 1.75 points of cuts. Watch the 10-year Treasury instead.' },
    { title: '"No interest if paid in full" promos', cost: 'all back interest', fix: `Miss by a dollar and ${t('deferred-interest', 'deferred interest')} is charged back to day one. Divide the balance by the promo months and pay that.` },
  ];

  const L = [
    { kind: 'section', desc: 'A credit card balance' },
    { n: 1, desc: 'Card APR', sub: 'Average on accounts paying interest, Federal Reserve G.19, August 2026', amt: pct(cardInt / 100, 2, true) },
    { n: 2, desc: 'Daily periodic rate', op: 'Line 1 ÷ 365', amt: pct(daily, 5, true) },
    { n: 3, desc: 'Average daily balance this cycle', amt: num(5000) },
    { n: 4, desc: 'Interest for a 30-day cycle', op: 'Line 3 × line 2 × 30', amt: num(cycle) },
    { n: 5, desc: 'Yearly cost with daily compounding (APY)', op: '<code>(1 + line 2)<sup>365</sup> − 1</code>', amt: pct(apyCard, 2, true), kind: 'total' },
    { kind: 'section', desc: '$10,000 of savings for a year' },
    { n: 6, desc: 'At the national average savings rate', sub: `FDIC, ${k.asOf(S.SNDR.latest.date, 'monthly')}`, op: `$10,000 × ${pct(sav / 100, 2, true)}`, amt: num(10000 * sav / 100) },
    { n: 7, desc: 'At the 3-month T-bill yield', sub: `Treasury, ${k.asOf(S.DTB3.latest.date)}`, op: `$10,000 × ${pct(bill / 100, 2, true)}`, amt: num(10000 * bill / 100) },
    { n: 8, desc: 'Left on the table', op: 'Line 7 − line 6', amt: num(10000 * (bill - sav) / 100), kind: 'total' },
    { kind: 'section', desc: 'After inflation' },
    { n: 9, desc: 'Inflation, last 12 months', sub: `CPI, ${k.asOf(S.CPIAUCSL.yoy.latest.date, 'monthly')}`, amt: pct(cpi / 100, 2, true) },
    { n: 10, desc: 'Real return at the average savings rate', op: '<code>(1 + line 6 rate) ÷ (1 + line 9) − 1</code>', amt: pct(realSav, 2, true), neg: realSav < 0 },
  ];
  const example = `<p>Today's published rates in dollars: a card balance, and the same $10,000 parked in two places.</p>${lines(L, 'Worked interest example')}`;

  return {
    slug: 'rates',
    title: 'Interest rates: what they do to your money | Moneywise',
    description: 'APR versus APY, compounding, and how the Federal Reserve\'s rate reaches your credit card, savings and mortgage, with live rates and a rate-shock calculator.',
    body: k.topic({
      slug: 'rates',
      sub: 'How one rate set by the Fed reaches your card, your savings and your mortgage.',
      chip: `Fed target today <b>${fed.lower.toFixed(2)}–${fed.upper.toFixed(2)}%</b> <small>since ${k.asOf(S.FEDTARGET.changed)}</small>`,
      hero, cards, slips, more, example,
      sources: ['fred', 'pmms', 'g19', 'fdic-rates', 'bls-cpi', 'cfpb-margins', 'regdd'],
    }),
  };
};
