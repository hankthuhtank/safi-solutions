// Form MW-1: Mortgage
import * as calc from '../../js/calc.js';
import { money, pct, num, duration } from '../../js/format.js';

export default (k) => {
  const { t, box, group, tools, lines, mistakes, note, rate, asof, val, LIMITS } = k;
  // the worked example: a median-priced home, 10% down, today's average 30-year rate
  const price = val('MSPUS'), r = val('MORTGAGE30US') / 100, r15 = val('MORTGAGE15US') / 100;
  const down = price * 0.10, loan = price - down;
  const taxRate = 0.009, insYear = 3057, pmiRate = 0.005;
  const pi = calc.cents(calc.payment(loan, r, 360));
  const am = calc.amortize({ principal: loan, annualRate: r, months: 360 });
  const tax = calc.cents(price * taxRate / 12), ins = calc.cents(insYear / 12), pmi = calc.cents(loan * pmiRate / 12);
  const total = pi + tax + ins + pmi;
  const ms = calc.pmiMilestones({ principal: loan, annualRate: r, months: 360, originalValue: price });
  const withPmi = calc.amortize({ principal: loan, annualRate: r, months: 360, pmi: { annualRate: pmiRate, originalValue: price } });
  const byRequest = calc.amortize({ principal: loan, annualRate: r, months: 360, pmi: { annualRate: pmiRate, originalValue: price, removeAt: 'request' } });
  const pi15 = calc.payment(loan, r15, 180), int15 = pi15 * 180 - loan;
  const y = m => Math.ceil(m / 12);
  const seg = (v, c, label) => `<span style="flex:${v.toFixed(2)};background:${c}" title="${label}: ${money(v, { cents: true })}">${v / total > 0.11 ? money(v) : ''}</span>`;

  const what = `
<div class="prose">
  <p class="lead">A mortgage is a loan where the house itself is the collateral: if the payments stop, the lender can take the home. You repay it in equal monthly payments, usually over 30 or 15 years.</p>
  <p>The monthly bill is more than the loan, though. Lenders and budgets both work from ${t('piti')}: principal and interest on the loan, plus property taxes and homeowners insurance, which your servicer usually collects into an ${t('escrow', 'escrow account')} and pays for you. Put down less than 20% on a conventional loan and ${t('pmi')} is added on top. ${t('hoa-dues', 'HOA dues')}, if any, are billed separately.</p>
</div>
<div class="anatomy" role="img" aria-label="Month one of the example payment: ${money(am.rows[0].principal, { cents: true })} principal, ${money(am.rows[0].interest, { cents: true })} interest, ${money(tax, { cents: true })} property tax, ${money(ins, { cents: true })} insurance, ${money(pmi, { cents: true })} PMI">
  <p class="micro" style="margin:0 0 8px">Month 1 of the worked example below: ${money(total, { cents: true })}</p>
  <div class="anatomy-bar">${seg(am.rows[0].principal, 'var(--series-1)', 'Principal')}${seg(am.rows[0].interest, 'var(--series-2)', 'Interest')}${seg(tax, 'var(--series-3)', 'Property tax')}${seg(ins, 'var(--series-5)', 'Insurance')}${seg(pmi, 'var(--series-4)', 'PMI')}</div>
  <div class="anatomy-keys">
    <div style="--k:var(--series-1)"><b>Principal ${money(am.rows[0].principal)}</b>Pays down what you owe. The smallest slice at the start.</div>
    <div style="--k:var(--series-2)"><b>Interest ${money(am.rows[0].interest)}</b>The lender's charge, figured on this month's balance.</div>
    <div style="--k:var(--series-3)"><b>Property tax ${money(tax)}</b>Set by your county; 0.90% of value is the national average.</div>
    <div style="--k:var(--series-5)"><b>Insurance ${money(ins)}</b>Required by the lender, usually paid from escrow.</div>
    <div style="--k:var(--series-4)"><b>PMI ${money(pmi)}</b>Only under 20% down. It protects the lender, not you.</div>
  </div>
</div>
<div class="prose">
  <h3>The choices that set the price</h3>
  <p><b>Term.</b> A 15-year loan has a higher payment but a lower rate and half the years of interest. On the example loan at today's 15-year average of ${rate('MORTGAGE15US')}, the payment is ${money(pi15)} instead of ${money(pi)}, and total interest falls from ${money(am.totalInterest)} to ${money(int15)}.</p>
  <p><b>Fixed or adjustable.</b> A ${t('fixed-rate', 'fixed rate')} never changes. An ${t('arm')} starts lower for a set period, then moves with an index, within caps printed on page 3 of the ${t('loan-estimate')}.</p>
  <p><b>Loan type.</b> Conventional loans up to the ${t('conforming-loan', 'conforming limit')} (${money(LIMITS.housing.conformingLimit.baseline)} for one home in most of the country in 2026) are the default. FHA loans accept lower credit scores and 3.5% down, but charge ${t('mip', 'FHA mortgage insurance')}: 1.75% up front plus 0.55% a year for most borrowers, for the life of the loan if you put down less than 10%.</p>
</div>
${note('Your best tool is a form', `<p>Every lender must give you the same three-page ${t('loan-estimate')} within three business days of applying, so offers line up side by side: rate and payment on page 1, ${t('closing-costs', 'closing costs')} and ${t('points')} on page 2 (section A), ${t('apr')} and ${t('tip')} on page 3. Freddie Mac found that one extra quote saved borrowers about $1,500 over the life of a loan on average, and five quotes about $3,000.</p>`)}`;

  const how = `
<h2 class="big">Every payment is the same. What it buys changes.</h2>
<div class="two-col">
  <div class="prose">
    <p>Each month the lender charges interest on whatever you still owe. The rest of your fixed payment goes to principal. Because the balance is largest at the start, the first payments are mostly interest: in the example, principal does not overtake interest until payment ${am.crossoverMonth}, in year ${y(am.crossoverMonth)}.</p>
    <p>This is called ${t('amortization')}. It is also why an extra dollar of principal early on is worth so much: it is never charged interest again.</p>
  </div>
  <ol class="steps">
    <li><b>Monthly rate</b> = annual rate ÷ 12. ${pct(r, 2, true)} ÷ 12 = ${pct(r / 12, 4, true)}.</li>
    <li><b>Interest this month</b> = balance × monthly rate. ${money(loan)} × ${pct(r / 12, 4, true)} = ${money(am.rows[0].interest, { cents: true })}.</li>
    <li><b>Principal this month</b> = payment − interest. ${money(pi, { cents: true })} − ${money(am.rows[0].interest, { cents: true })} = ${money(am.rows[0].principal, { cents: true })}.</li>
    <li><b>New balance</b> = old balance − principal. Then repeat, 360 times.</li>
  </ol>
</div>
<div data-chart="split" data-loan="${loan}" data-rate="${r}" data-price="${price}"></div>
<div class="prose">
  <h3>PMI has three off-ramps</h3>
  <p>Under the Homeowners Protection Act, you can ask your servicer to cancel ${t('pmi')} once your balance reaches 80% of the home's original value (if you are current and have a good payment history). It must end automatically when the scheduled balance hits 78%, and no later than the midpoint of the loan. In the example that means you can ask in year ${y(ms.requestMonth)} and it ends on its own in year ${y(ms.automaticMonth)}. FHA mortgage insurance follows different rules.</p>
  <h3>Points buy a lower rate with cash</h3>
  <p>${t('points', 'Discount points')} are prepaid interest: each one costs 1% of the loan and lowers the rate by an amount that varies by lender (a quarter point of rate is a common rule of thumb, not a standard). They pay off only if you keep the loan past the ${t('break-even', 'break-even point')}. A ${t('lender-credit')} is the same trade in reverse.</p>
  <h3>Refinancing resets the clock</h3>
  <p>A ${t('refinance')} replaces your loan with a new one. A lower rate cuts the payment, but closing costs come due again, and a fresh 30-year term can mean paying interest for longer than you have left today.</p>
</div>`;

  const r100 = Math.round(r * 10000) / 100;
  const tryIt = tools([
    { id: 'tool-pay', label: 'Payment & schedule', intro: 'Change any box. Rate starts at this week\'s national average; your quote depends on credit, down payment and points.', boxes:
      box({ no: 1, k: 'price', label: 'Home price', value: price, min: 50000, max: 2000000, step: 5000 }) +
      box({ no: 2, k: 'downPct', label: 'Down payment', type: 'pct', value: 10, min: 0, max: 60, step: 1 }) +
      box({ no: 3, k: 'rate', label: 'Interest rate', type: 'pct', value: r100, min: 2, max: 12, step: 0.05, live: 'MORTGAGE30US', dp: 2 }) +
      box({ no: 4, k: 'term', label: 'Term', type: 'seg', value: 30, options: [[15, '15 yr'], [20, '20 yr'], [30, '30 yr']] }) +
      group('Escrow and extras') +
      box({ no: 5, k: 'taxPct', label: 'Property tax', hint: 'per year', type: 'pct', value: 0.9, min: 0, max: 3, step: 0.05, dp: 2 }) +
      box({ no: 6, k: 'ins', label: 'Home insurance', hint: 'per year', value: insYear, min: 0, max: 15000, step: 50 }) +
      box({ no: 7, k: 'pmiPct', label: 'PMI rate', hint: 'if under 20% down', type: 'pct', value: 0.5, min: 0, max: 2, step: 0.05, dp: 2 }) +
      box({ no: 8, k: 'hoa', label: 'HOA dues', hint: 'per month', value: 0, min: 0, max: 1500, step: 10 }) +
      box({ no: 9, k: 'request', label: 'I will ask to drop PMI at 80%', type: 'check', value: true, wide: true }) },
    { id: 'tool-extra', label: 'Extra payments', intro: 'Every extra dollar goes straight to principal, so it is never charged interest again. Tell your servicer to apply it to principal.', boxes:
      box({ no: 1, k: 'loan', label: 'Loan amount', value: loan, min: 20000, max: 1500000, step: 5000 }) +
      box({ no: 2, k: 'rate', label: 'Interest rate', type: 'pct', value: r100, min: 2, max: 12, step: 0.05, live: 'MORTGAGE30US', dp: 2 }) +
      box({ no: 3, k: 'term', label: 'Term', type: 'seg', value: 30, options: [[15, '15 yr'], [20, '20 yr'], [30, '30 yr']] }) +
      box({ no: 4, k: 'extra', label: 'Extra each month', value: 200, min: 0, max: 3000, step: 25 }) +
      box({ no: 5, k: 'lump', label: 'One-time extra', value: 0, min: 0, max: 100000, step: 500 }) +
      box({ no: 6, k: 'lumpYear', label: 'Paid in year', type: 'num', value: 3, min: 1, max: 29, step: 1 }) },
    { id: 'tool-points', label: 'Points', intro: 'Is paying cash at closing for a lower rate worth it? Only if you keep the loan longer than the break-even.', boxes:
      box({ no: 1, k: 'loan', label: 'Loan amount', value: loan, min: 20000, max: 1500000, step: 5000 }) +
      box({ no: 2, k: 'rate', label: 'Rate with no points', type: 'pct', value: r100, min: 2, max: 12, step: 0.05, live: 'MORTGAGE30US', dp: 2 }) +
      box({ no: 3, k: 'points', label: 'Points bought', type: 'num', value: 1, min: 0, max: 4, step: 0.25 }) +
      box({ no: 4, k: 'cut', label: 'Rate cut per point', type: 'pct', value: 0.25, min: 0.05, max: 0.5, step: 0.01, dp: 2 }) +
      box({ no: 5, k: 'years', label: 'Years you keep the loan', type: 'num', value: 7, min: 1, max: 30, step: 1 }) +
      box({ no: 6, k: 'term', label: 'Term', type: 'seg', value: 30, options: [[15, '15 yr'], [30, '30 yr']] }) },
    { id: 'tool-refi', label: 'Refinance', intro: 'Compare keeping your loan with replacing it. The simple break-even ignores the new term; the true break-even counts what you would still owe on each loan.', boxes:
      box({ no: 1, k: 'balance', label: 'Current balance', value: 310000, min: 20000, max: 1500000, step: 5000 }) +
      box({ no: 2, k: 'rate', label: 'Current rate', type: 'pct', value: 8, min: 2, max: 12, step: 0.05, dp: 2 }) +
      box({ no: 3, k: 'left', label: 'Years left on it', type: 'num', value: 27, min: 1, max: 30, step: 1 }) +
      box({ no: 4, k: 'newRate', label: 'New rate', type: 'pct', value: r100, min: 2, max: 12, step: 0.05, live: 'MORTGAGE30US', dp: 2 }) +
      box({ no: 5, k: 'newTerm', label: 'New term', type: 'seg', value: 30, options: [[15, '15 yr'], [20, '20 yr'], [30, '30 yr']] }) +
      box({ no: 6, k: 'costs', label: 'Closing costs', value: 6200, min: 0, max: 30000, step: 100 }) +
      box({ no: 7, k: 'roll', label: 'Roll the costs into the new loan', type: 'check', value: false, wide: true }) },
  ]);

  const L = [
    { kind: 'section', desc: 'The loan' },
    { n: 1, desc: 'Home price', sub: `Median sales price of houses sold, ${k.asOf(k.rates.series.MSPUS.latest.date, 'quarterly')} (Census and HUD)`, amt: num(price) },
    { n: 2, desc: 'Down payment, 10%', op: 'Line 1 × 10%', amt: `(${num(down)})`, neg: true },
    { n: 3, desc: 'Loan amount', op: 'Line 1 − line 2', amt: num(loan) },
    { kind: 'section', desc: 'The monthly payment' },
    { n: 4, desc: 'Interest rate, 30-year fixed', sub: `Freddie Mac average, ${k.asOf(k.rates.series.MORTGAGE30US.latest.date)}`, amt: pct(r, 2, true) },
    { n: 5, desc: 'Monthly rate', op: 'Line 4 ÷ 12', amt: pct(r / 12, 4, true) },
    { n: 6, desc: 'Principal and interest', op: '<code>L3 × r ÷ (1 − (1 + r)<sup>−360</sup>)</code>, r = line 5', amt: num(pi) },
    { n: 7, desc: 'Property tax', sub: 'National average effective rate 0.90% (ATTOM, 2025)', op: 'Line 1 × 0.90% ÷ 12', amt: num(tax) },
    { n: 8, desc: 'Homeowners insurance', sub: 'Projected 2026 national average, $3,057 a year (Insurify)', op: '$3,057 ÷ 12', amt: num(ins) },
    { n: 9, desc: 'PMI at 0.50% a year', sub: 'Typical range 0.46% to 1.50% (Urban Institute)', op: 'Line 3 × 0.50% ÷ 12', amt: num(pmi) },
    { n: 10, desc: 'Total monthly payment', op: 'Lines 6 + 7 + 8 + 9', amt: num(total), kind: 'total' },
    { kind: 'section', desc: 'Inside payment 1' },
    { n: 11, desc: 'Interest in month 1', op: 'Line 3 × line 5', amt: num(am.rows[0].interest) },
    { n: 12, desc: 'Principal in month 1', op: 'Line 6 − line 11', amt: num(am.rows[0].principal) },
    { kind: 'section', desc: 'Over the life of the loan' },
    { n: 13, desc: 'All 360 principal and interest payments', op: 'Line 6 × 360 (last one adjusted)', amt: num(am.totalPaid) },
    { n: 14, desc: 'Total interest', op: 'Line 13 − line 3', amt: num(am.totalInterest), kind: 'total' },
    { n: 15, desc: 'You can ask to cancel PMI', sub: `Scheduled balance reaches 80% of line 1 (${money(price * 0.8)})`, amt: `month ${ms.requestMonth}` },
    { n: 16, desc: 'PMI ends automatically', sub: `Scheduled balance reaches 78% of line 1 (${money(price * 0.78)})`, amt: `month ${ms.automaticMonth}` },
    { n: 17, desc: 'PMI saved by asking at 80%', op: 'Automatic total − requested total', amt: num(withPmi.pmiTotal - byRequest.pmiTotal) },
  ];
  const example = `<div class="example-head"><p>A median-priced home with 10% down at this week's average 30-year rate. Every line shows where its number comes from.</p></div>${lines(L, 'Worked mortgage example')}<p class="example-foot">The CFPB's own sample Loan Estimate ($162,000 at 3.875%) runs through the same formula to $761.78 a month; that check is part of the test suite on the <a href="/moneywise/sources/">Sources</a> page.</p>`;

  const mist = mistakes([
    { title: 'Budgeting on principal and interest alone', why: `In the example, taxes, insurance and PMI add ${money(total - pi)} a month to the ${money(pi)} loan payment, ${pct((total - pi) / pi, 0)} more. Repairs come on top.`, fix: 'Budget from the full payment on line 10, plus roughly 1% of the home\'s value a year for upkeep.' },
    { title: 'Shopping the rate instead of the Loan Estimate', why: `A lower rate can hide ${t('points')} and fees in section A of page 2. The ${t('apr')} on page 3 folds those in.`, fix: 'Request at least three Loan Estimates on the same day and compare page 2, section A, and the APR on page 3.' },
    { title: 'Waiting for PMI to fall off on its own', why: `Servicers must stop PMI at 78%, but they don't have to remind you at 80%. In the example, waiting costs ${money(withPmi.pmiTotal - byRequest.pmiTotal)}.`, fix: 'Note the month you will reach 80% and ask in writing. A big rise in your home\'s value may let you ask sooner with a new appraisal, depending on the loan investor.' },
    { title: 'Buying points you will not keep long enough', why: 'Points pay off slowly: often five years or more. Sell or refinance before then and the cash is gone.', fix: 'Run the Points calculator with an honest guess of how long you will keep this loan, not how long you hope to keep the house.' },
    { title: 'Counting only the monthly savings on a refinance', why: 'Restarting at 30 years can raise your total interest even at a lower rate, and closing costs often get rolled into the balance.', fix: 'Compare total remaining cost, and consider a shorter new term or keep paying your old payment amount.' },
    { title: 'Extra payments that never reach principal', why: 'Servicers can treat an unlabeled extra amount as an early payment of next month\'s bill, not a principal reduction.', fix: 'Mark extra money "principal only" and check that the next statement\'s balance dropped by that amount.' },
    { title: 'Treating the pre-approval as the budget', why: `A ${t('pre-approval')} shows the most a lender will risk, and many programs allow total debt payments near half of your gross income.`, fix: 'Set your own ceiling from take-home pay and the rest of your goals, then shop below it.' },
    { title: 'Ignoring the yearly escrow analysis', why: `If taxes or insurance rise, your payment rises too, even on a fixed rate. Home insurance premiums jumped about 12% in 2025.`, fix: 'Read the escrow letter, shop your homeowners policy every year, and appeal an assessment that looks too high.' },
  ]);

  return {
    slug: 'mortgage',
    title: 'Mortgage, explained with the math shown | Moneywise',
    description: 'How a mortgage payment is built, why early payments are mostly interest, when PMI ends, and whether points, extra payments or a refinance pay off. Live rates and a calculator tape for every step.',
    body: k.module({
      slug: 'mortgage',
      lede: 'The biggest bill most people ever sign. What each payment is made of, why the first years are mostly interest, and when points, PMI, extra payments or a refinance actually pay off.',
      today: [
        { label: '30-year fixed', value: rate('MORTGAGE30US'), sub: asof('MORTGAGE30US') },
        { label: '15-year fixed', value: rate('MORTGAGE15US'), sub: asof('MORTGAGE15US') },
        { label: 'Median home price', value: money(price), sub: k.asOf(k.rates.series.MSPUS.latest.date, 'quarterly') },
        { label: 'Conforming loan limit', value: money(LIMITS.housing.conformingLimit.baseline), sub: '2026, one unit' },
      ],
      todaySrc: 'Freddie Mac, Census and HUD via FRED; FHFA.',
      parts: [
        { id: 'what', short: 'What it is', title: 'What it is', html: what },
        { id: 'how', short: 'How it works', title: 'How it works', html: how },
        { id: 'try', short: 'Try it', title: 'Try it', html: tryIt, aside: 'Prints every step to the tape' },
        { id: 'example', short: 'Worked example', title: 'Worked example', html: example, aside: 'Numbers as of this week' },
        { id: 'mistakes', short: 'Common mistakes', title: 'Common mistakes', html: mist },
      ],
      sources: ['pmms', 'mspus', 'attom-tax', 'insurify-home', 'pmi-cost', 'cfpb-pmi', 'hud-mip', 'fhfa-cll', 'freddie-quotes', 'cfpb-le'],
    }),
  };
};
