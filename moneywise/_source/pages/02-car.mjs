// Form MW-2: Car loans
import * as calc from '../../js/calc.js';
import { money, pct, num, duration } from '../../js/format.js';

export default (k) => {
  const { t, box, group, tools, lines, mistakes, note, rate, asof, val, TAX } = k;
  const price = 49855, taxRate = 0.06, fees = 800, down = 5000, apr = 0.0635, months = 72;
  const d = calc.autoDeal({ price, taxRate, fees, down, apr, months });
  const pay = calc.cents(d.payment);
  const am = calc.amortize({ principal: d.financed, annualRate: apr, months });
  const uw = calc.underwaterMonths(d.financed, apr, months, price);
  const uw84 = calc.underwaterMonths(calc.autoDeal({ price, taxRate, fees, down, apr, months: 84 }).financed, apr, 84, price);
  const y1 = am.rows.slice(0, 12).reduce((s, r) => s + r.interest, 0);
  const bank = val('TERMCBAUTO48NS');
  const seg = (v, c, label, total) => `<span style="flex:${v.toFixed(2)};background:${c}" title="${label}: ${money(v)}">${v / total > 0.1 ? money(v) : ''}</span>`;
  const whole = price + d.tax + fees + am.totalInterest;

  const what = `
<div class="prose">
  <p class="lead">For most people a car loan is the second-biggest loan they will ever take, and it is sold in the most confusing way: in the finance office, after you have fallen for the car, as a monthly payment with products bundled in.</p>
  <p>Four numbers decide what a car really costs: the ${t('out-the-door', 'out-the-door price')}, what your ${t('trade-in')} is worth against what you still owe on it, the ${t('apr')}, and the ${t('loan-term', 'term')}. The monthly payment is just the result of those four, which is exactly why a dealer can make almost any payment work by quietly changing one of them.</p>
</div>
<div class="anatomy" role="img" aria-label="Where the money goes on the worked example: price ${money(price)}, sales tax ${money(d.tax)}, fees ${money(fees)}, interest ${money(am.totalInterest)}">
  <p class="micro" style="margin:0 0 8px">Everything you pay on the worked example below: ${money(whole)}</p>
  <div class="anatomy-bar">${seg(price, 'var(--series-3)', 'Price', whole)}${seg(d.tax, 'var(--series-4)', 'Sales tax', whole)}${seg(fees, 'var(--series-5)', 'Fees', whole)}${seg(am.totalInterest, 'var(--series-2)', 'Interest', whole)}</div>
  <div class="anatomy-keys">
    <div style="--k:var(--series-3)"><b>Price ${money(price)}</b>What you negotiated (here, July 2026's average new-car price).</div>
    <div style="--k:var(--series-4)"><b>Sales tax ${money(d.tax)}</b>Usually on the price minus your trade-in.</div>
    <div style="--k:var(--series-5)"><b>Fees ${money(fees)}</b>Title, registration and the dealer's documentation fee.</div>
    <div style="--k:var(--series-2)"><b>Interest ${money(am.totalInterest)}</b>${pct(apr, 2, true)} for ${months} months on ${money(d.financed)} financed.</div>
  </div>
</div>
${note('New for 2025 to 2028', `<p>Interest on a loan for a <b>new</b> car, SUV, pickup, van or motorcycle with <b>final assembly in the United States</b> is deductible up to $10,000 a year, even if you take the standard deduction. It shrinks above $100,000 of income ($200,000 for joint filers) and does not apply to used cars or leases. Check the VIN or the window sticker for the assembly plant. ${t('car-interest-deduction', 'How the deduction works')}.</p>`)}`;

  const how = `
<h2 class="big">The payment is the last number to look at.</h2>
<div class="two-col">
  <div class="prose">
    <p>Dealers often work from a "four-square" sheet: price, trade-in, down payment and monthly payment. Ask for a payment and every other box can move to hit it. A longer term, a lower trade value, or old debt folded into the new loan can all produce the payment you asked for while the total climbs.</p>
    <p>Meanwhile the car loses value fastest exactly when you owe the most. New cars lose about 20% of their value in the first year and are worth roughly 40% of the price after five years. With little down and a long term, the loan balance stays above the car's value for years. That gap is ${t('negative-equity')}, and if the car is totaled or traded early, you owe the difference.</p>
  </div>
  <ol class="steps">
    <li><b>Agree on the out-the-door price</b> in writing before discussing financing or trade-in.</li>
    <li><b>Price the trade separately.</b> Get a written offer from a second buyer first.</li>
    <li><b>Bring a pre-approval</b> from a bank or credit union, so you know the real rate and can spot a ${t('dealer-markup', 'dealer markup')}.</li>
    <li><b>Then compare terms</b> by total cost, not payment. Decline or price-shop every ${t('add-ons', 'add-on')}.</li>
  </ol>
</div>
<div data-chart="underwater" data-financed="${d.financed}" data-apr="${apr}" data-price="${price}"></div>
<p class="micro" style="margin-top:8px">The worked example at 72 and 84 months. Value curve: about 20% lost in year one, then roughly 16% a year (Carfax averages).</p>`;

  const tryIt = tools([
    { id: 'tool-deal', label: 'Total cost', intro: `Rate starts at the Federal Reserve's average 48-month new-car rate at banks (${rate('TERMCBAUTO48NS')}, ${asof('TERMCBAUTO48NS')}). Experian's average across all lenders was 6.35% in Q2 2026, pulled down by automaker deals.`, boxes:
      box({ no: 1, k: 'price', label: 'Vehicle price', value: price, min: 5000, max: 150000, step: 500 }) +
      box({ no: 2, k: 'rebate', label: 'Rebate', value: 0, min: 0, max: 15000, step: 250 }) +
      box({ no: 3, k: 'down', label: 'Cash down', value: down, min: 0, max: 50000, step: 500 }) +
      box({ no: 4, k: 'taxRate', label: 'Sales tax', type: 'pct', value: 6, min: 0, max: 11, step: 0.25, dp: 2 }) +
      box({ no: 5, k: 'fees', label: 'Title, registration, doc fee', value: fees, min: 0, max: 5000, step: 50 }) +
      box({ no: 6, k: 'addOns', label: 'Add-ons financed', value: 0, min: 0, max: 10000, step: 100 }) +
      group('Trade-in') +
      box({ no: 7, k: 'tradeValue', label: 'Trade-in value', value: 0, min: 0, max: 80000, step: 500 }) +
      box({ no: 8, k: 'tradeOwed', label: 'Still owed on it', value: 0, min: 0, max: 80000, step: 500 }) +
      group('Loan') +
      box({ no: 9, k: 'apr', label: 'APR', type: 'pct', value: bank, min: 0, max: 25, step: 0.05, live: 'TERMCBAUTO48NS', dp: 2 }) +
      box({ no: 10, k: 'months', label: 'Term', type: 'seg', value: 72, options: [[36, '36'], [48, '48'], [60, '60'], [72, '72'], [84, '84']] }) },
    { id: 'tool-promo', label: '0% or rebate?', intro: 'Automakers often offer a cash rebate or a low promotional rate, not both. Take the rebate and finance elsewhere, or skip it for the cheap loan?', boxes:
      box({ no: 1, k: 'price', label: 'Vehicle price', value: 45000, min: 5000, max: 150000, step: 500 }) +
      box({ no: 2, k: 'rebate', label: 'Rebate you give up', value: 4000, min: 0, max: 15000, step: 250 }) +
      box({ no: 3, k: 'promoApr', label: 'Promotional APR', type: 'pct', value: 0, min: 0, max: 8, step: 0.1, dp: 2 }) +
      box({ no: 4, k: 'bankApr', label: 'Your bank or credit union APR', type: 'pct', value: bank, min: 0, max: 25, step: 0.05, live: 'TERMCBAUTO48NS', dp: 2 }) +
      box({ no: 5, k: 'months', label: 'Term (both)', type: 'seg', value: 60, options: [[36, '36'], [48, '48'], [60, '60'], [72, '72']] }) +
      box({ no: 6, k: 'down', label: 'Cash down', value: 0, min: 0, max: 30000, step: 500 }) },
    { id: 'tool-deduct', label: 'Interest deduction', intro: 'For tax years 2025 to 2028. Only new vehicles with final assembly in the U.S., bought for personal use with a loan taken out after 2024. Leases and used cars do not qualify.', boxes:
      box({ no: 1, k: 'loan', label: 'Amount financed', value: Math.round(d.financed), min: 1000, max: 150000, step: 500 }) +
      box({ no: 2, k: 'apr', label: 'APR', type: 'pct', value: 6.35, min: 0, max: 25, step: 0.05, dp: 2 }) +
      box({ no: 3, k: 'months', label: 'Term', type: 'seg', value: 72, options: [[36, '36'], [48, '48'], [60, '60'], [72, '72'], [84, '84']] }) +
      box({ no: 4, k: 'magi', label: 'Modified AGI', hint: 'roughly your AGI', value: 95000, min: 0, max: 400000, step: 1000 }) +
      box({ no: 5, k: 'filing', label: 'Filing', type: 'seg', value: 'single', options: [['single', 'Single / HoH'], ['mfj', 'Joint']] }) +
      box({ no: 6, k: 'bracket', label: 'Your tax bracket', type: 'sel', value: '0.22', options: [['0.10', '10%'], ['0.12', '12%'], ['0.22', '22%'], ['0.24', '24%'], ['0.32', '32%'], ['0.35', '35%'], ['0.37', '37%']] }) +
      box({ no: 7, k: 'startMonth', label: 'First payment month', type: 'sel', value: '1', options: [['1', 'January'], ['4', 'April'], ['7', 'July'], ['10', 'October']] }) +
      box({ no: 8, k: 'usa', label: 'New, U.S. final assembly, personal use', type: 'check', value: true }) },
  ]);

  const L = [
    { kind: 'section', desc: 'The deal' },
    { n: 1, desc: 'Vehicle price', sub: 'Average new-vehicle transaction price, July 2026 (Kelley Blue Book)', amt: num(price) },
    { n: 2, desc: 'Sales tax at 6%', sub: 'Example rate; state and local rates vary from 0% to over 10%', op: 'Line 1 × 6%', amt: num(d.tax) },
    { n: 3, desc: 'Title, registration and doc fee', sub: 'Example; dealer documentation fees vary widely by state', amt: num(fees) },
    { n: 4, desc: 'Out-the-door price', op: 'Lines 1 + 2 + 3', amt: num(d.outTheDoor), kind: 'total' },
    { n: 5, desc: 'Cash down', amt: `(${num(down)})`, neg: true },
    { n: 6, desc: 'Amount financed', op: 'Line 4 − line 5', amt: num(d.financed) },
    { kind: 'section', desc: 'The loan' },
    { n: 7, desc: 'APR', sub: 'Average new-vehicle loan rate, Q2 2026 (Experian)', amt: pct(apr, 2, true) },
    { n: 8, desc: 'Term', sub: 'Near the 69.5-month average (Experian)', amt: `${months} months` },
    { n: 9, desc: 'Monthly payment', op: '<code>L6 × r ÷ (1 − (1 + r)<sup>−72</sup>)</code>, r = line 7 ÷ 12', amt: num(pay) },
    { n: 10, desc: 'All 72 payments', op: 'Line 9 × 72', amt: num(am.totalPaid) },
    { n: 11, desc: 'Total interest', op: 'Line 10 − line 6', amt: num(am.totalInterest), kind: 'total' },
    { n: 12, desc: 'What the car costs you in all', op: 'Line 5 + line 10', amt: num(down + am.totalPaid), kind: 'total' },
    { kind: 'section', desc: 'Value versus balance' },
    { n: 13, desc: 'Months the loan is underwater', sub: 'Balance above the car\'s estimated value', amt: `${uw.first} to ${uw.last}` },
    { n: 14, desc: 'Deepest gap', amt: num(uw.worst) },
    { n: 15, desc: 'Same deal over 84 months: underwater', amt: `${uw84.first} to ${uw84.last}` },
    { kind: 'section', desc: 'Tax year one (if the car qualifies)' },
    { n: 16, desc: 'Interest paid in the first 12 payments', amt: num(y1) },
    { n: 17, desc: 'Tax saved in the 22% bracket', sub: 'Car loan interest deduction, income under $100,000', op: 'Line 16 × 22%', amt: num(y1 * 0.22) },
  ];
  const example = `<div class="example-head"><p>An average-priced new car with $5,000 down, financed at the average new-car rate for 72 months.</p></div>${lines(L, 'Worked car loan example')}`;

  const mist = mistakes([
    { title: 'Negotiating the monthly payment', why: 'Any payment can be reached by stretching the term, lowering your trade-in or rolling in add-ons. You lose sight of the price.', fix: 'Negotiate one number, the out-the-door price, in writing. Discuss payments only after it is fixed.' },
    { title: 'Rolling old loan debt into the new one', why: `Edmunds found 29.6% of trade-ins were underwater in Q2 2026, by $6,884 on average, and buyers in that spot averaged $944 a month.`, fix: 'Keep the current car longer, pay the gap down in cash, or sell it privately for more than a trade-in offer.' },
    { title: 'Stretching to 84 months', why: `In the worked example, 84 months instead of 72 adds ${money(calc.autoDeal({ price, taxRate, fees, down, apr, months: 84 }).totalInterest - am.totalInterest)} of interest and keeps you underwater until month ${uw84.last}.`, fix: 'If only the long term makes the payment fit, look at a less expensive car or a larger down payment.' },
    { title: 'Taking dealer financing without a pre-approval', why: `The dealer can add a ${t('dealer-markup', 'markup')} to the rate the lender approved you for. Without your own quote you cannot tell.`, fix: 'Get pre-approved by a credit union or bank before you shop, then let the dealer try to beat it.' },
    { title: 'Buying add-ons in the finance office', why: `${t('gap-insurance', 'GAP')}, ${t('service-contract', 'service contracts')}, paint and fabric protection are optional and negotiable, and financed add-ons collect interest for years.`, fix: 'Say no at the table and price them later. GAP is often far cheaper from your own auto insurer.' },
    { title: 'Taking 0% when the rebate is worth more', why: `A ${t('promo-apr', 'promotional rate')} often replaces a cash ${t('rebate')}. A large rebate plus a decent credit union loan can cost less.`, fix: 'Run the "0% or rebate?" calculator with your own pre-approved rate before you choose.' },
    { title: 'Forgetting what the car costs to own', why: 'Insurance, fuel or charging, maintenance and registration can rival the payment, and some models cost far more to insure.', fix: 'Get an insurance quote on the exact vehicle before you sign.' },
    { title: 'Missing the new interest deduction, or claiming it wrongly', why: 'From 2025 through 2028, interest on a new, U.S.-assembled personal vehicle can be deducted up to $10,000 a year, even without itemizing. Used cars, leases and business vehicles do not qualify.', fix: 'Keep the loan statement showing interest paid, check the VIN for final assembly, and claim it on Schedule 1-A.' },
  ]);

  return {
    slug: 'car',
    title: 'Car loans, explained with the math shown | Moneywise',
    description: 'What a car really costs once tax, fees, interest and depreciation are counted; when a longer term or negative equity hurts; 0% financing versus a rebate; and the new car loan interest deduction.',
    body: k.module({
      slug: 'car',
      lede: 'What a car costs once tax, fees, interest and depreciation are counted, why the monthly payment is the worst number to negotiate, and how to judge 0% financing against a cash rebate.',
      today: [
        { label: 'Bank new-car rate, 48 mo', value: rate('TERMCBAUTO48NS'), sub: asof('TERMCBAUTO48NS') },
        { label: 'Average new-car loan', value: '$43,610', sub: '6.35% for 69.5 mo, Q2 2026' },
        { label: 'Average new-car price', value: '$50,000+', sub: 'August 2026' },
        { label: 'Trade-ins underwater', value: '29.6%', sub: 'by $6,884 on average, Q2 2026' },
      ],
      todaySrc: 'Federal Reserve G.19 via FRED; Experian; Kelley Blue Book; Edmunds.',
      parts: [
        { id: 'what', short: 'What it is', title: 'What it is', html: what },
        { id: 'how', short: 'How it works', title: 'How it works', html: how },
        { id: 'try', short: 'Try it', title: 'Try it', html: tryIt, aside: 'Prints every step to the tape' },
        { id: 'example', short: 'Worked example', title: 'Worked example', html: example },
        { id: 'mistakes', short: 'Common mistakes', title: 'Common mistakes', html: mist },
      ],
      sources: ['experian-auto', 'kbb-atp', 'edmunds-neg', 'depreciation', 'g19', 'irs-sch1a', 'irs-obbba'],
    }),
  };
};
