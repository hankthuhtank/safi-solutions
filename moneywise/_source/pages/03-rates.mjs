// Form MW-3: Interest rates
import * as calc from '../../js/calc.js';
import { money, pct, num } from '../../js/format.js';

export default (k) => {
  const { t, box, group, tools, lines, mistakes, note, rate, asof, val, rates } = k;
  const S = rates.series;
  const h = (id, m) => { const p = S[id].history.find(x => x[0] === m); return p ? p[1] : null; };
  const fed = S.FEDTARGET.latest, prime = val('DPRIME'), t10 = val('DGS10'), m30 = val('MORTGAGE30US'), bill = val('DTB3'), sav = val('SNDR');
  const card = val('TERMCBCCALLNS'), cardInt = val('TERMCBCCINTNS'), cpi = val('CPIAUCSL');
  const spread = m30 - t10;
  // the 2024-25 easing cycle, from the monthly averages in the data
  const mo0 = h('MORTGAGE30US', '2024-09'), mo1 = h('MORTGAGE30US', '2025-12');
  const tn0 = h('DGS10', '2024-09'), tn1 = h('DGS10', '2025-12');
  const daily = cardInt / 100 / 365, cycle = 5000 * daily * 30, apyCard = calc.aprToApy(cardInt / 100, 365);
  const realSav = (1 + sav / 100) / (1 + cpi / 100) - 1;

  const node = (src, small, big, span, cls = '') => `<div class="pnode ${cls}"><small>${small}</small><b>${big}</b><span>${span}</span></div>`;
  const arrow = label => `<div class="parrow" aria-hidden="true"><span>${label}</span></div>`;
  const pipes = `
<div class="pipes" role="list" aria-label="How rate changes travel">
  <div class="pipe" role="listitem">${node(1, 'Federal Reserve sets', `${fed.lower.toFixed(2)}–${fed.upper.toFixed(2)}%`, `${t('fed-funds-rate', 'fed funds')} target, since ${k.asOf(S.FEDTARGET.changed)}`, 'src')}${arrow('same day')}${node(2, 'Banks reset', `${prime.toFixed(2)}%`, `${t('prime-rate', 'prime rate')}: top of the range + 3`)}${arrow('next statement or two')}${node(3, 'You pay on cards and HELOCs', `${card.toFixed(2)}%`, `average card APR (${t('variable-rate', 'variable')}: prime + a margin)`, 'out')}</div>
  <div class="pipe" role="listitem">${node(1, 'Federal Reserve sets', `${fed.lower.toFixed(2)}–${fed.upper.toFixed(2)}%`, 'the overnight rate', 'src')}${arrow('days')}${node(2, 'Short-term Treasuries', `${bill.toFixed(2)}%`, `3-month ${t('t-bill', 'T-bill')}`)}${arrow('weeks, if at all')}${node(3, 'You earn on savings', `${sav.toFixed(2)}%`, `the national average; ${t('hysa', 'high-yield')} accounts track the T-bill`, 'out')}</div>
  <div class="pipe" role="listitem">${node(1, 'Bond investors weigh', 'inflation, growth, debt', 'and where they expect the Fed to go', 'src')}${arrow('every trading day')}${node(2, '10-year Treasury', `${t10.toFixed(2)}%`, t('treasury-yield', 'the benchmark yield'))}${arrow(`+ ${spread.toFixed(2)} points of ${t('spread')}`)}${node(3, 'You borrow for a house', `${m30.toFixed(2)}%`, 'average 30-year fixed', 'out')}</div>
</div>`;

  const what = `
<div class="prose">
  <p class="lead">Interest is the price of using someone else's money for a while. When you borrow you pay it; when you save you earn it. Nearly every decision on this site turns on one rate or another, so it pays to know which rate is which.</p>
  <p><b>APR or APY?</b> An ${t('apr')} is the yearly rate before compounding. An ${t('apy')} includes the effect of interest earning interest, so it is always at least as high. Banks advertise APY on savings (the bigger number) and APR on loans (the smaller number). At 5% compounded daily, the APY is 5.13%.</p>
  <p><b>Fixed or variable?</b> A ${t('fixed-rate', 'fixed rate')} is locked for the life of the loan. A ${t('variable-rate', 'variable rate')} is an index plus a margin, so it moves when the index does. Most credit cards and home equity lines are variable.</p>
  <p><b>Nominal or real?</b> The stated rate is nominal. Subtract ${t('inflation')} and you get the ${t('real-rate', 'real return')}: what your money actually gains in buying power. Today's average savings account pays ${rate('SNDR')} while prices rise ${pct(cpi / 100, 2, true)} a year, a real return of about ${pct(realSav, 1)}.</p>
</div>
<div data-chart="ladder"></div>`;

  const how = `
<h2 class="big">One rate at the Fed. Many rates in your wallet.</h2>
<div class="prose">
  <p>The Federal Reserve sets a target for one rate: what banks charge each other overnight. Anything priced off short-term rates follows within days. Long-term loans, like a 30-year mortgage, follow the bond market instead, which reacts to where investors think inflation and the Fed are headed over the next decade.</p>
</div>
${pipes}
<div data-chart="history"></div>
<div class="prose">
  <p>That split is why the headlines and your quotes can disagree. Between September 2024 and December 2025 the Fed cut its target 1.75 points, from 5.25–5.50% to 3.50–3.75%. Over the same months the 10-year Treasury rose from ${tn0.toFixed(2)}% to ${tn1.toFixed(2)}% (monthly averages), and the average 30-year mortgage went from ${mo0.toFixed(2)}% to ${mo1.toFixed(2)}%: no change at all. In September 2026 the Fed raised rates again and the 10-year climbed past 5%, taking mortgage rates to ${m30.toFixed(2)}%.</p>
  <p>Cards are tied to prime, but the margin on top is up to the issuer. The CFPB found the average margin over prime rose from 9.6 points in 2013 to 14.3 points in 2023, which is why card rates barely fell when the Fed cut.</p>
</div>`;

  const tryIt = tools([
    { id: 'tool-apy', label: 'APR to APY', intro: 'How often interest is added changes what a rate is really worth. The same rule works for debt: a card charging interest daily costs more than its APR.', boxes:
      box({ no: 1, k: 'apr', label: 'Stated rate (APR)', type: 'pct', value: 5, min: 0, max: 30, step: 0.05, dp: 2 }) +
      box({ no: 2, k: 'amount', label: 'Balance', value: 10000, min: 100, max: 100000, step: 100 }) +
      box({ no: 3, k: 'n', label: 'Interest added', type: 'seg', value: 365, wide: true, options: [[1, 'Yearly'], [4, 'Quarterly'], [12, 'Monthly'], [365, 'Daily']] }) },
    { id: 'tool-grow', label: 'Compound growth', intro: 'Rate starts at the 3-month T-bill yield, close to what FDIC-insured high-yield savings accounts pay. Inflation starts at the latest CPI.', boxes:
      box({ no: 1, k: 'start', label: 'Starting amount', value: 10000, min: 0, max: 200000, step: 500 }) +
      box({ no: 2, k: 'monthly', label: 'Added each month', value: 200, min: 0, max: 5000, step: 25 }) +
      box({ no: 3, k: 'rate', label: 'Annual rate', type: 'pct', value: bill, min: 0, max: 15, step: 0.05, live: 'DTB3', dp: 2 }) +
      box({ no: 4, k: 'years', label: 'Years', type: 'num', value: 20, min: 1, max: 50, step: 1 }) +
      box({ no: 5, k: 'infl', label: 'Inflation', type: 'pct', value: Math.round(cpi * 100) / 100, min: 0, max: 10, step: 0.05, live: 'CPIAUCSL', dp: 2 }) +
      box({ no: 6, k: 'n', label: 'Compounding', type: 'seg', value: 12, options: [[1, 'Yearly'], [12, 'Monthly'], [365, 'Daily']] }) },
    { id: 'tool-shock', label: 'Rate shock', intro: 'Move the slider to see what a change in short-term rates does to a year of your borrowing and saving. Variable rates follow fully; new mortgage rates move with the bond market, so set that separately.', boxes:
      box({ no: 1, k: 'shock', label: 'Fed move (points)', type: 'num', value: 1, min: -3, max: 3, step: 0.25, wide: true }) +
      group('Variable rates: follow the Fed') +
      box({ no: 2, k: 'card', label: 'Card balance carried', value: 6000, min: 0, max: 50000, step: 250 }) +
      box({ no: 3, k: 'cardApr', label: 'Card APR', type: 'pct', value: card, min: 0, max: 36, step: 0.05, live: 'TERMCBCCALLNS', dp: 2 }) +
      box({ no: 4, k: 'heloc', label: 'Home equity line', value: 40000, min: 0, max: 300000, step: 1000 }) +
      box({ no: 5, k: 'helocRate', label: 'HELOC rate', hint: 'prime + 1', type: 'pct', value: prime + 1, min: 0, max: 20, step: 0.05, dp: 2 }) +
      box({ no: 6, k: 'savings', label: 'High-yield savings', value: 15000, min: 0, max: 300000, step: 500 }) +
      box({ no: 7, k: 'savRate', label: 'Savings APY', type: 'pct', value: bill, min: 0, max: 10, step: 0.05, live: 'DTB3', dp: 2 }) +
      group('New mortgage: follows bonds') +
      box({ no: 8, k: 'mortgage', label: 'Mortgage you plan to take', value: 350000, min: 0, max: 1500000, step: 5000 }) +
      box({ no: 9, k: 'mShock', label: 'Mortgage rate move (points)', type: 'num', value: 0.5, min: -3, max: 3, step: 0.25 }) },
  ]);

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
  const example = `<div class="example-head"><p>What today's published rates mean in dollars: a card balance, and the same $10,000 parked in two places.</p></div>${lines(L, 'Worked interest example')}`;

  const mist = mistakes([
    { title: 'Comparing an APR with an APY', why: 'A loan quoted as an APR and a savings account quoted as an APY are measured differently. The APY is always the larger number for the same rate.', fix: 'Convert both to APY (or both to APR) with the calculator before you compare.' },
    { title: 'Expecting a Fed cut to lower your mortgage rate', why: `From September 2024 to December 2025 the Fed cut 1.75 points and the average 30-year rate went from ${mo0.toFixed(2)}% to ${mo1.toFixed(2)}%.`, fix: 'Watch the 10-year Treasury yield, not the Fed headlines, when you time a home purchase or refinance.' },
    { title: 'Expecting a Fed cut to rescue a card balance', why: 'Cards move with prime, but issuers set the margin on top, and margins have risen for a decade. A one-point cut saves $60 a year on a $6,000 balance.', fix: 'Pay the balance down, or move it to a 0% balance transfer only if you can clear it before the promotion ends.' },
    { title: 'Leaving savings at the national average', why: `On $10,000 the gap between ${pct(sav / 100, 2, true)} and the ${pct(bill / 100, 2, true)} T-bill yield is ${money(10000 * (bill - sav) / 100)} a year.`, fix: 'Use an FDIC-insured high-yield savings account, a money market fund or Treasury bills for cash you are not spending this month.' },
    { title: 'Saving at 4% while carrying a card at 22%', why: 'Every dollar of card debt costs about five times what the same dollar earns in savings.', fix: 'Keep a starter emergency fund, then send the rest at the card until it is gone.' },
    { title: 'Missing the catch in "no interest if paid in full"', why: `${t('deferred-interest', 'Deferred interest')} promotions charge every month of interest back to the purchase date if a single dollar is left at the end.`, fix: 'Divide the balance by the months in the promotion and pay at least that much every month.' },
    { title: 'Forgetting that variable debt rises with rates', why: 'A home equity line at prime plus 1 costs $400 more a year on $40,000 after a one-point increase.', fix: 'Pay down variable-rate debt first when rates are rising, or ask about fixing part of a HELOC balance.' },
    { title: 'Ignoring inflation', why: `A return below inflation loses buying power. Today's average savings rate is about ${pct(-realSav, 1)} a year behind prices.`, fix: 'Judge every rate by its real return: the rate minus inflation.' },
  ]);

  return {
    slug: 'rates',
    title: 'Interest rates, explained with the math shown | Moneywise',
    description: 'APR versus APY, compounding, and how the Federal Reserve\'s rate reaches your credit card, savings account and mortgage, with live FRED data and a rate-shock calculator.',
    body: k.module({
      slug: 'rates',
      lede: 'APR versus APY, why compounding matters, and how one decision at the Federal Reserve reaches your credit card in days, your savings in weeks, and your mortgage hardly at all.',
      today: [
        { label: 'Fed target range', value: `${fed.lower.toFixed(2)}–${fed.upper.toFixed(2)}%`, sub: `since ${k.asOf(S.FEDTARGET.changed)}` },
        { label: 'Prime rate', value: rate('DPRIME'), sub: asof('DPRIME') },
        { label: '10-year Treasury', value: rate('DGS10'), sub: asof('DGS10') },
        { label: 'Average card APR', value: rate('TERMCBCCALLNS'), sub: asof('TERMCBCCALLNS') },
        { label: 'Average savings', value: rate('SNDR'), sub: asof('SNDR') },
        { label: 'Inflation', value: rate('CPIAUCSL'), sub: asof('CPIAUCSL') },
      ],
      todaySrc: 'Federal Reserve, Treasury, FDIC and BLS via FRED.',
      parts: [
        { id: 'what', short: 'What it is', title: 'What it is', html: what },
        { id: 'how', short: 'How it works', title: 'How it works', html: how },
        { id: 'try', short: 'Try it', title: 'Try it', html: tryIt, aside: 'Prints every step to the tape' },
        { id: 'example', short: 'Worked example', title: 'Worked example', html: example },
        { id: 'mistakes', short: 'Common mistakes', title: 'Common mistakes', html: mist },
      ],
      sources: ['fred', 'pmms', 'g19', 'fdic-rates', 'bls-cpi', 'cfpb-margins', 'regdd'],
    }),
  };
};
