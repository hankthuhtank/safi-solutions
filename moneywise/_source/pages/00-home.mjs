// Moneywise home: hero, today's numbers, the index of forms, the fine print, and how the math is checked.
import * as calc from '../../js/calc.js';
import { money, pct, duration } from '../../js/format.js';

export default (k, { TESTS, boardHTML }) => {
  const { t, rates, MODULES, ARROW, val, asOf } = k;
  const r30 = val('MORTGAGE30US') / 100, card = (val('TERMCBCCALLNS') ?? 21) / 100, sav = val('SNDR') / 100, bill = val('DTB3') / 100;
  const price = val('MSPUS'), loan = Math.round(price * 0.9);
  const pmi = calc.pmiMilestones({ principal: loan, annualRate: r30, months: 360, originalValue: price });
  const pay = calc.payment(loan, r30, 360), payLess = calc.payment(loan, r30 - 0.01, 360);
  const minp = calc.minimumPayoff({ balance: 5000, apr: card, percent: 0.01, plusInterest: true, floor: 35 });
  const feeGap = calc.afterFees(100000, 0.04, 0.0025, 20) - calc.afterFees(100000, 0.04, 0.01, 20);

  const fine = [
    { m: 'mortgage', b: 'PMI ends on its own at 78%, but you can ask at 80%.', p: `On a median-priced home (${money(price)}) with 10% down at today's ${pct(r30, 2, true)}, you can request removal in month ${pmi.requestMonth}, about ${duration(pmi.automaticMonth - pmi.requestMonth)} before it would drop automatically. Servicers don't remind you.` },
    { m: 'mortgage', b: 'One point of rate is a lot of house.', p: `On that same ${money(loan)} loan, ${pct(r30, 2, true)} instead of ${pct(r30 - 0.01, 2, true)} costs ${money(pay - payLess)} more a month, ${money((pay - payLess) * 360)} over thirty years.` },
    { m: 'rates', b: 'Your card follows the Fed. Your mortgage follows the bond market.', p: `Card APRs are priced off the ${t('prime-rate')}, which moves the day the Fed moves. New mortgage rates track the ${t('treasury-yield', '10-year Treasury yield')}, which can rise even when the Fed cuts.` },
    { m: 'rates', b: `The average savings account pays ${pct(sav, 2, true)}.`, p: `A 3-month Treasury bill pays ${pct(bill, 2, true)}. On $10,000 that is ${money(10000 * sav)} a year versus about ${money(10000 * bill)}. FDIC-insured ${t('hysa', 'high-yield savings')} accounts pay close to the T-bill rate.` },
    { m: 'credit', b: 'Your score sees your statement balance, not your payment.', p: `Most issuers report the balance on the ${t('statement-closing-date', 'statement closing date')}, so a card you pay in full can still show high ${t('utilization')}. Paying before the statement closes fixes it.` },
    { m: 'credit', b: 'The minimum payment is designed to last.', p: `Paying only a typical minimum (1% of the balance plus interest, at least $35) on $5,000 at ${pct(card, 2, true)} takes ${duration(minp.months)} and costs ${money(minp.totalInterest)} in interest.` },
    { m: 'insurance', b: 'The out-of-pocket maximum leaves out your premiums.', p: `For 2027 plans the legal ceiling is $12,000 for one person and $24,000 for a family, before a year of premiums. Out-of-network bills may not count toward it at all.` },
    { m: 'taxes', b: 'A raise never lowers your take-home pay.', p: `Only the dollars above a bracket line are taxed at the higher rate. A $1,000 raise that crosses into 22% still leaves you with more than $700 of it after federal and payroll taxes.` },
    { m: 'taxes', b: 'Your 401(k) cuts income tax, not Social Security and Medicare.', p: `Traditional contributions come off your taxable wages, but the 7.65% ${t('fica')} tax is still taken from every dollar you earn up to the ${t('wage-base', 'wage base')}.` },
    { m: 'retirement', b: 'Fees compound too.', p: `The SEC's own example: $100,000 growing 4% a year for 20 years ends about ${money(Math.round(feeGap / 1000) * 1000)} lower with a 1% fee than with a 0.25% fee. Check the ${t('expense-ratio')} on every fund you hold.` },
  ];

  const forms = MODULES.map(m => `<li><a href="/moneywise/${m.slug}/"><span class="fi-no">Form<b>MW-${m.no}</b></span><span class="fi-name">${m.name}<small>${m.q}</small></span><span class="fi-q"><b>What people miss</b>${m.miss}</span><span class="fi-go">${ARROW}</span></a></li>`).join('');

  const body = `
<div class="wrap">
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy">
      <p class="eyebrow">A plain-English guide to how money works</p>
      <h1 id="hero-title">Money decisions,<em>with the math shown.</em></h1>
      <p class="lede">Mortgages, car loans, credit, insurance, taxes and retirement, taken apart into plain words, today's real numbers and a calculator tape that prints every step. No account, no sales pitch, nothing to buy.</p>
      <div class="hero-cta"><a class="btn" href="#forms">Pick a decision ${ARROW}</a><a class="btn ghost" href="/moneywise/glossary/">Look up a word</a></div>
    </div>
    <div class="hero-art" aria-hidden="true"><svg class="guilloche" id="guilloche" viewBox="0 0 500 500"></svg><div class="coin"></div></div>
  </section>

  <section class="board" aria-labelledby="board-title">
    <div class="board-head"><h2 id="board-title">Today's numbers</h2><p><span class="rs-dot rs-${rates.mode === 'live' ? 'live' : 'snapshot'}"></span><span data-mode>${rates.mode === 'live' ? 'Live from FRED' : 'Snapshot'}</span> · Federal Reserve Bank of St. Louis (FRED) · each number shows its own date</p></div>
    <div class="tiles" id="rate-tiles">${boardHTML(rates)}</div>
  </section>

  <section class="sec" id="forms" aria-labelledby="forms-title">
    <div class="sec-head"><h2 id="forms-title">Pick a decision.</h2><p>Every form follows the same five parts: what it is, how it works, a calculator, a worked example with every number shown, and the mistakes people make.</p></div>
    <ol class="forms-index">${forms}</ol>
  </section>

  <section class="sec" aria-labelledby="fine-title">
    <div class="sec-head"><h2 id="fine-title">The fine print, enlarged.</h2><p>Ten things that cost people real money because nobody points them out. Figures use today's published rates.</p></div>
    <ol class="fine">${fine.map(f => `<li><b>${f.b}</b><p>${f.p} <a href="/moneywise/${f.m}/">${MODULES.find(m => m.slug === f.m).name} →</a></p></li>`).join('')}</ol>
  </section>

  <section class="sec" aria-labelledby="proof-title">
    <div class="sec-head"><h2 id="proof-title">Checked against the source.</h2><p>The formulas are tested against worked examples published by the agencies that write the rules. All ${TESTS.length} checks pass.</p></div>
    <div class="proof">
      <div><span class="pass">CFPB sample Loan Estimate</span><b>$761.78</b><p>$162,000 at 3.875% for 30 years. The amortization here reproduces the payment, the $15,773 of principal repaid in five years and the 69.46% ${t('tip', 'total interest percentage')}.</p></div>
      <div><span class="pass">Regulation DD, Appendix A</span><b>6.17%</b><p>The Truth in Savings examples for ${t('apy')}, including the stepped-rate certificate that earns $26.68 for a 5.39% yield.</p></div>
      <div><span class="pass">IRS Rev. Proc. 2025-32</span><b>$192,979.25</b><p>Every base amount in the 2026 tax rate tables, for all four filing statuses, plus the line-by-line rules of the new Schedule 1-A.</p></div>
    </div>
    <p style="margin-top:16px"><a href="/moneywise/sources/">See every check and source →</a></p>
  </section>
</div>`;

  return {
    slug: 'home', script: 'home',
    title: 'Moneywise | Money decisions, with the math shown',
    description: 'Mortgages, car loans, interest rates, credit, health insurance, taxes and retirement explained visually, with live FRED rates, calculators that show every step, and sources for every number.',
    body,
  };
};
