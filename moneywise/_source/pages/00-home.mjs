// Moneywise home: one line of promise, the seven decisions (each with today's number), and four things people miss.
import * as calc from '../../js/calc.js';
import { money, pct } from '../../js/format.js';

export default (k, { TESTS }) => {
  const { rates, MODULES, ARROW, val, rate, asof, LIMITS, TAX, GLOSSARY } = k;
  const S = rates.series, fed = S.FEDTARGET.latest;
  // the numbers behind the four cards, from this week's data
  const price = val('MSPUS'), r30 = val('MORTGAGE30US') / 100, loan = price * 0.9;
  const pmiFull = calc.amortize({ principal: loan, annualRate: r30, months: 360, pmi: { annualRate: 0.005, originalValue: price } });
  const pmiAsk = calc.amortize({ principal: loan, annualRate: r30, months: 360, pmi: { annualRate: 0.005, originalValue: price, removeAt: 'request' } });
  const cardInt = val('TERMCBCCINTNS') / 100;
  const minp = calc.minimumPayoff({ balance: 5000, apr: cardInt, percent: 0.01, plusInterest: true, floor: 35 });
  const p36 = calc.payment(5000, cardInt, 36);
  const P = TAX.payroll, keep = 1000 * (1 - 0.22 - P.socialSecurityRate - P.medicareRate);
  const feeGap = calc.afterFees(100000, 0.04, 0.0025, 20) - calc.afterFees(100000, 0.04, 0.01, 20);

  const stat = {
    mortgage: [rate('MORTGAGE30US'), `30-year average, ${asof('MORTGAGE30US')}`],
    car: [rate('TERMCBAUTO48NS'), `new-car loan rate at banks, ${asof('TERMCBAUTO48NS')}`],
    rates: [`${fed.lower.toFixed(2)}–${fed.upper.toFixed(2)}%`, `Fed target since ${k.asOf(S.FEDTARGET.changed)}`],
    credit: [rate('TERMCBCCALLNS'), `average card rate, ${asof('TERMCBCCALLNS')}`],
    insurance: [money(LIMITS.acaOutOfPocketMax['2027'].self), 'most a 2027 plan can charge you'],
    taxes: [money(TAX.standardDeduction.single), 'standard deduction, 2026'],
    retirement: [money(LIMITS.retirement.employeeDeferral), '401(k) limit, 2026'],
  };
  const topics = MODULES.map(m => `<li><a class="topic-card" href="/moneywise/${m.slug}/"><h3>${m.name}</h3><p>${m.q}</p><span class="tc-stat"><b>${stat[m.slug][0]}</b><small>${stat[m.slug][1]}</small></span></a></li>`).join('')
    + `<li><a class="topic-card alt" href="/moneywise/glossary/"><h3>Glossary</h3><p>Any money word, in plain English.</p><span class="tc-stat"><b>${Object.keys(GLOSSARY).length}</b><small>terms on index cards</small></span></a></li>`;

  const cards = [
    { tag: 'Mortgage', big: '80%', line: 'of the original price: when to ask your lender to drop PMI.',
      back: `Servicers must stop PMI at 78% but don't have to remind you at 80%. On a median home with 10% down, asking saves about ${money(pmiFull.pmiTotal - pmiAsk.pmiTotal)}.` },
    { tag: 'Credit', big: `${Math.round(minp.months / 12)} years`, line: 'to clear $5,000 of card debt paying only the minimum.',
      back: `It costs ${money(minp.totalInterest)} in interest. Paying ${money(p36)} a month clears it in three years instead.` },
    { tag: 'Taxes', big: money(keep), line: 'kept from a $1,000 raise, even in the 22% bracket.',
      back: 'Only the dollars above a bracket line pay the higher rate, so a raise never shrinks your take-home pay.' },
    { tag: 'Retirement', big: money(feeGap), line: 'lost to a 1% fee instead of 0.25%, on $100,000.',
      back: 'Over 20 years at 4%, the SEC\'s own example. Fees come out every year, and the money they take stops growing.' },
  ];

  const body = `
<div class="wrap">
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy">
      <h1 id="hero-title">Money decisions,<em>with the math shown.</em></h1>
      <p class="lede">Pick a decision. Move a slider. See what it really costs, in dollars.</p>
      <div class="hero-cta"><a class="btn" href="#topics">Start here ${ARROW}</a></div>
    </div>
    <div class="hero-art" aria-hidden="true"><svg class="guilloche" id="guilloche" viewBox="0 0 500 500"></svg><div class="coin"></div></div>
  </section>

  <section class="t-sec home-topics" id="topics" aria-labelledby="topics-h">
    <h2 class="sec-title" id="topics-h">Pick a decision</h2>
    <ul class="topics">${topics}</ul>
  </section>

  <section class="t-sec" aria-labelledby="miss-h">
    <h2 class="sec-title" id="miss-h">4 things most people miss</h2>
    ${k.cards(cards)}
    <p class="proof-line">Every formula is checked against worked examples from the IRS, CFPB and SEC. All ${TESTS.length} checks pass. <a href="/moneywise/sources/">How we check</a></p>
  </section>
</div>`;

  return {
    slug: 'home', script: 'home',
    title: 'Moneywise | Money decisions, with the math shown',
    description: 'Mortgages, car loans, interest rates, credit, health insurance, taxes and retirement, explained with live rates and calculators that show every step in dollars.',
    body,
  };
};
