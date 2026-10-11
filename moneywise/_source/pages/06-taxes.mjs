// Form MW-6: Taxes
import * as calc from '../../js/calc.js';
import { money, pct, num } from '../../js/format.js';

export default (k) => {
  const { t, box, group, tools, lines, mistakes, note, TAX } = k;
  const B = TAX.brackets.single, SD = TAX.standardDeduction, P = TAX.payroll, S1 = TAX.schedule1A;
  const wages = 75000, k401 = 4500;
  const it = calc.incomeTax({ status: 'single', wages, preTax: k401 }, TAX);
  const table = calc.irsTaxTable(it.taxable, B);
  const fica = calc.payrollTax(wages, 'single', P);
  const keep = 1000 * (1 - it.marginal - P.socialSecurityRate - P.medicareRate);
  const rowsB = it.rows.filter(r => r.amount > 0);

  const bracketRows = (st, label) => TAX.brackets[st].map((b, i, a) => `<tr><td>${pct(b.rate, 0)}</td><td class="n">${money(i ? a[i - 1].upTo : 0)}</td><td class="n">${b.upTo == null ? 'and up' : money(b.upTo)}</td></tr>`).join('');

  const what = `
<div class="prose">
  <p class="lead">Federal income tax is figured on a ladder. Your income fills the lowest bracket first, then the next one up, and only the dollars inside each bracket pay that bracket's rate. Being "in the 22% bracket" means your last dollars are taxed at 22%, not all of them.</p>
  <p>Before the ladder, income shrinks in two steps. Pre-tax deductions from your paycheck (a traditional 401(k), an HSA, health premiums) never show up as taxable wages. Then the ${t('standard-deduction')} (or your itemized deductions) comes off. What is left is ${t('taxable-income')}, and that is what the brackets apply to.</p>
</div>
<ol class="flow" aria-label="From paycheck to tax bill, with Form 1040 line numbers">
  <li><span>Gross pay</span><b>Your salary, tips, overtime</b></li>
  <li><span>− Pre-tax deductions</span><b>401(k), HSA, health premiums</b><small>W-2 box 1 is what is left</small></li>
  <li><span>= ${t('agi', 'AGI')}</span><b>Adjusted gross income</b><small>Form 1040, line 11a</small></li>
  <li><span>− Deductions</span><b>Standard (${money(SD.single)} single) or itemized, plus ${t('schedule-1a')}</b><small>lines 12e and 13b</small></li>
  <li><span>= Taxable income</span><b>What the brackets apply to</b><small>line 15</small></li>
  <li><span>× Brackets</span><b>10%, 12%, 22% … 37%</b><small>line 16</small></li>
  <li><span>− ${t('tax-credit', 'Credits')}</span><b>Child tax credit and others</b><small>line 19 and up</small></li>
  <li><span>vs ${t('withholding')}</span><b>Refund if you paid more, a bill if you paid less</b><small>lines 25 to 37</small></li>
</ol>
<div class="two-col">
  <table class="src-table brackets"><caption class="micro">2026 brackets, single (Rev. Proc. 2025-32)</caption><thead><tr><th>Rate</th><th>Taxable income over</th><th>Up to</th></tr></thead><tbody>${bracketRows('single')}</tbody></table>
  <table class="src-table brackets"><caption class="micro">2026 brackets, married filing jointly</caption><thead><tr><th>Rate</th><th>Taxable income over</th><th>Up to</th></tr></thead><tbody>${bracketRows('mfj')}</tbody></table>
</div>
${note('A second tax on every paycheck', `<p>${t('fica', 'Social Security and Medicare')} come out separately: 6.2% of wages up to the ${t('wage-base', 'wage base')} (${money(P.socialSecurityWageBase)} in 2026) and 1.45% of all wages, plus 0.9% above $200,000 for single filers. Traditional 401(k) contributions do not reduce them.</p>`)}`;

  const how = `
<h2 class="big">Brackets are buckets.</h2>
<div class="prose"><p>Picture income pouring into a row of buckets. The 10% bucket fills first, then the 12% bucket, and so on. Each bucket's rate applies only to what is in it. Here is the worked example below: a single filer with ${money(wages)} of salary and ${money(it.taxable)} of taxable income.</p></div>
<div data-chart="buckets" data-taxable="${it.taxable}"></div>
<div class="two-col">
  <div class="prose">
    <h3>Marginal versus effective</h3>
    <p>Your ${t('marginal-rate', 'marginal rate')} is the rate on your next dollar (22% here). Your ${t('effective-rate', 'effective rate')} is your total tax divided by your income (${pct(it.tax / wages, 1)} of salary here). Use the marginal rate to judge a raise, overtime or a deduction; use the effective rate to understand your overall bill.</p>
    <h3>Deduction or credit?</h3>
    <p>A $1,000 deduction lowers taxable income, so in the 22% bracket it saves $220. A $1,000 ${t('tax-credit', 'credit')} lowers the tax itself and saves $1,000. A ${t('refundable-credit', 'refundable credit')} can even be paid to you.</p>
  </div>
  <div data-chart="rates"></div>
</div>
<div class="prose">
  <h3>New deductions for 2025 to 2028</h3>
  <p>The 2025 tax law added four deductions you can take even with the standard deduction, each on ${t('schedule-1a')} and each shrinking at higher incomes. Married couples must file jointly to claim them.</p>
</div>
<table class="src-table stack">
  <thead><tr><th>Deduction</th><th>Up to</th><th>Starts shrinking above (single / joint)</th><th>How fast</th></tr></thead>
  <tbody>
    <tr><td>Qualified tips</td><td class="n">${money(S1.tips.cap)}</td><td class="n">${money(S1.tips.phaseStart.single)} / ${money(S1.tips.phaseStart.mfj)}</td><td>$100 per $1,000 over</td></tr>
    <tr><td>Overtime premium pay (the "half" in time-and-a-half)</td><td class="n">${money(S1.overtime.cap.single)} / ${money(S1.overtime.cap.mfj)}</td><td class="n">${money(S1.overtime.phaseStart.single)} / ${money(S1.overtime.phaseStart.mfj)}</td><td>$100 per $1,000 over</td></tr>
    <tr><td>Car loan interest, new U.S.-assembled vehicle</td><td class="n">${money(S1.carLoanInterest.cap)}</td><td class="n">${money(S1.carLoanInterest.phaseStart.single)} / ${money(S1.carLoanInterest.phaseStart.mfj)}</td><td>$200 per $1,000 over</td></tr>
    <tr><td>Age 65 or older (each person)</td><td class="n">${money(S1.seniors.perPerson)}</td><td class="n">${money(S1.seniors.phaseStart.single)} / ${money(S1.seniors.phaseStart.mfj)}</td><td>6% of income over</td></tr>
  </tbody>
</table>`;

  const statusOpts = [['single', 'Single'], ['mfj', 'Married, joint'], ['hoh', 'Head of household'], ['mfs', 'Married, separate']];
  const tryIt = tools([
    { id: 'tool-tax', label: 'Your federal tax', intro: `2026 brackets and standard deduction. Credits are limited to the tax you owe; up to $1,700 per child can be refunded beyond that, which is not shown here.`, boxes:
      box({ no: 1, k: 'status', label: 'Filing status', type: 'sel', value: 'single', options: statusOpts, wide: true }) +
      box({ no: 2, k: 'wages', label: 'Wages, tips, overtime', value: wages, min: 0, max: 500000, step: 1000 }) +
      box({ no: 3, k: 'other', label: 'Other income', hint: 'interest, side work', value: 0, min: 0, max: 200000, step: 500 }) +
      box({ no: 4, k: 'pretax', label: 'Pre-tax 401(k), HSA, premiums', value: k401, min: 0, max: 50000, step: 250 }) +
      box({ no: 5, k: 'itemized', label: 'Itemized deductions', hint: '0 = standard', value: 0, min: 0, max: 100000, step: 500 }) +
      box({ no: 6, k: 'kids', label: 'Children under 17', type: 'seg', value: 0, options: [[0, '0'], [1, '1'], [2, '2'], [3, '3'], [4, '4']] }) +
      box({ no: 7, k: 'seniors', label: 'People 65 or older', type: 'seg', value: 0, options: [[0, '0'], [1, '1'], [2, '2']] }) +
      group('Schedule 1-A, 2025 to 2028') +
      box({ no: 8, k: 'tips', label: 'Qualified tips', value: 0, min: 0, max: 60000, step: 500 }) +
      box({ no: 9, k: 'ot', label: 'Overtime premium pay', value: 0, min: 0, max: 40000, step: 250 }) +
      box({ no: 10, k: 'car', label: 'New-car loan interest', value: 0, min: 0, max: 15000, step: 100, wide: true }) },
    { id: 'tool-pay', label: 'Your paycheck', intro: 'Where each paycheck goes. Federal withholding is estimated as your actual yearly tax spread evenly, which is close to what payroll does when your W-4 is current. State tax is a flat estimate: nine states have no tax on wages.', boxes:
      box({ no: 1, k: 'salary', label: 'Yearly salary', value: wages, min: 10000, max: 500000, step: 1000 }) +
      box({ no: 2, k: 'periods', label: 'Paid', type: 'sel', value: '26', options: [['52', 'Weekly'], ['26', 'Every two weeks'], ['24', 'Twice a month'], ['12', 'Monthly']] }) +
      box({ no: 3, k: 'status', label: 'Filing status', type: 'sel', value: 'single', options: statusOpts }) +
      box({ no: 4, k: 'k401', label: 'Traditional 401(k)', type: 'pct', value: 6, min: 0, max: 50, step: 1 }) +
      box({ no: 5, k: 'roth', label: 'Roth 401(k)', type: 'pct', value: 0, min: 0, max: 50, step: 1 }) +
      box({ no: 6, k: 'health', label: 'Health premium per check', value: 60, min: 0, max: 1000, step: 5 }) +
      box({ no: 7, k: 'hsa', label: 'HSA per check', value: 0, min: 0, max: 500, step: 5 }) +
      box({ no: 8, k: 'state', label: 'State income tax', hint: 'flat estimate', type: 'pct', value: 4, min: 0, max: 13.3, step: 0.1, dp: 1 }) },
    { id: 'tool-refund', label: 'Refund check', intro: 'Your refund is only the gap between what was withheld and what you owe. Enter the federal income tax line from a recent pay stub.', boxes:
      box({ no: 1, k: 'wages', label: 'Yearly wages', value: wages, min: 10000, max: 500000, step: 1000 }) +
      box({ no: 2, k: 'status', label: 'Filing status', type: 'sel', value: 'single', options: statusOpts }) +
      box({ no: 3, k: 'pretax', label: 'Pre-tax deductions', hint: 'per year', value: k401, min: 0, max: 50000, step: 250 }) +
      box({ no: 4, k: 'withheld', label: 'Federal tax withheld per check', value: 380, min: 0, max: 5000, step: 5 }) +
      box({ no: 5, k: 'periods', label: 'Paid', type: 'sel', value: '26', options: [['52', 'Weekly'], ['26', 'Every two weeks'], ['24', 'Twice a month'], ['12', 'Monthly']], wide: true }) },
  ]);

  const L = [
    { kind: 'section', desc: 'Income' },
    { n: 1, desc: 'Salary', amt: num(wages) },
    { n: 2, desc: 'Traditional 401(k), 6% of pay', op: 'Line 1 × 6%', amt: `(${num(k401)})`, neg: true },
    { n: 3, desc: 'Adjusted gross income', sub: 'Form 1040, line 11a', op: 'Line 1 − line 2', amt: num(it.agi) },
    { n: 4, desc: 'Standard deduction, single, 2026', sub: 'Form 1040, line 12e', amt: `(${num(SD.single)})`, neg: true },
    { n: 5, desc: 'Taxable income', sub: 'Form 1040, line 15', op: 'Line 3 − line 4', amt: num(it.taxable), kind: 'total' },
    { kind: 'section', desc: 'Through the brackets' },
    ...rowsB.map((r, i) => ({ n: 6 + i, desc: `${pct(r.rate, 0)} on ${money(r.amount)}`, sub: `taxable income from ${money(r.from)} to ${money(Math.min(r.to, it.taxable))}`, op: `${money(r.amount)} × ${pct(r.rate, 0)}`, amt: num(r.tax) })),
    { n: 6 + rowsB.length, desc: 'Income tax', sub: `The IRS Tax Table, which uses the midpoint of each $50 band, would show ${money(table)}`, op: `Lines 6 to ${5 + rowsB.length}`, amt: num(it.tax), kind: 'total' },
    { kind: 'section', desc: 'Payroll taxes' },
    { n: 7 + rowsB.length, desc: 'Social Security', op: 'Line 1 × 6.2%', amt: num(fica.socialSecurity) },
    { n: 8 + rowsB.length, desc: 'Medicare', op: 'Line 1 × 1.45%', amt: num(fica.medicare) },
    { kind: 'section', desc: 'What it adds up to' },
    { n: 9 + rowsB.length, desc: 'All federal taxes', op: `Lines ${6 + rowsB.length} + ${7 + rowsB.length} + ${8 + rowsB.length}`, amt: num(it.tax + fica.total), kind: 'total' },
    { n: 10 + rowsB.length, desc: 'Effective income tax rate', op: `Line ${6 + rowsB.length} ÷ line 1`, amt: pct(it.tax / wages, 2, true) },
    { n: 11 + rowsB.length, desc: 'Effective rate with payroll taxes', op: `Line ${9 + rowsB.length} ÷ line 1`, amt: pct((it.tax + fica.total) / wages, 2, true) },
    { n: 12 + rowsB.length, desc: 'Kept from the next $1,000 earned', op: '$1,000 × (1 − 22% − 7.65%)', amt: num(keep) },
  ];
  const example = `<div class="example-head"><p>A single filer earning ${money(wages)} who puts 6% into a traditional 401(k), 2026 rules.</p></div>${lines(L, 'Worked tax example')}`;

  const mist = mistakes([
    { title: 'Fearing a raise will push you into a higher bracket', why: `Only the dollars above the line pay the higher rate. In the example, the next $1,000 of pay still leaves ${money(keep)} after federal income and payroll taxes.`, fix: 'Take the raise, the overtime or the bonus. (A few benefit programs do have cliffs; check those separately.)' },
    { title: 'Treating a deduction like a credit', why: 'A $1,000 deduction saves $100 to $370 depending on your bracket. A $1,000 credit saves $1,000.', fix: 'Value a deduction at your marginal rate before you spend money to get one.' },
    { title: 'Celebrating a big refund', why: 'The IRS reported a $3,276 average refund through May 8, 2026. That is $126 every two weeks you lent the government at 0%.', fix: 'Use the IRS Tax Withholding Estimator and update your W-4 so more of it lands in each paycheck.' },
    { title: 'Not updating your W-4 after life changes', why: 'Marriage, a second job, a spouse\'s job or a new child can all leave you badly over- or under-withheld.', fix: 'Revisit your W-4 after every big change, and at least once a year.' },
    { title: 'Assuming a 401(k) cuts every tax', why: 'Traditional contributions lower income tax, but Social Security and Medicare still come out of every dollar you earn.', fix: 'Count the 7.65% when you estimate what a contribution really costs your paycheck.' },
    { title: 'Forgetting taxes on side income', why: `Freelance and gig income has no withholding, and owes ${t('self-employment-tax', 'self-employment tax')} (15.3% on 92.35% of net earnings) on top of income tax.`, fix: `Set aside about a third of side income and pay ${t('estimated-taxes', 'estimated taxes')} quarterly to avoid penalties.` },
    { title: 'Missing the new deductions, or claiming them wrongly', why: 'Qualified tips, the overtime premium and new-car loan interest can be deducted for 2025 to 2028 without itemizing, but only the extra "half" of overtime counts, and married couples must file jointly.', fix: 'Keep your W-2, 1099 and loan statements, and fill out Schedule 1-A line by line.' },
    { title: 'Selling investments without checking the 0% bracket', why: `Long-term ${t('capital-gains')} are taxed at 0% while taxable income stays under ${money(TAX.capitalGains.zeroMax.single)} (single) in 2026.`, fix: 'In a low-income year, consider taking gains up to that line tax-free.' },
  ]);

  return {
    slug: 'taxes',
    title: 'Taxes and your paycheck, explained with the math shown | Moneywise',
    description: '2026 federal tax brackets as buckets, marginal versus effective rates, where each paycheck goes, the new 2025 to 2028 deductions for tips, overtime, car loans and seniors, and what a refund really means.',
    body: k.module({
      slug: 'taxes',
      lede: 'How the 2026 brackets really work, what comes out of a paycheck and why, what your refund actually means, and the new deductions for tips, overtime, car loans and seniors.',
      today: [
        { label: 'Standard deduction, single', value: money(SD.single), sub: '2026' },
        { label: 'Standard deduction, joint', value: money(SD.mfj), sub: '2026' },
        { label: 'Social Security wage base', value: money(P.socialSecurityWageBase), sub: '2026' },
        { label: 'Average refund', value: '$3,276', sub: 'through May 8, 2026' },
      ],
      todaySrc: 'IRS Rev. Proc. 2025-32; Social Security Administration; IRS filing season statistics.',
      parts: [
        { id: 'what', short: 'What it is', title: 'What it is', html: what },
        { id: 'how', short: 'How it works', title: 'How it works', html: how },
        { id: 'try', short: 'Try it', title: 'Try it', html: tryIt, aside: 'Prints every step to the tape' },
        { id: 'example', short: 'Worked example', title: 'Worked example', html: example },
        { id: 'mistakes', short: 'Common mistakes', title: 'Common mistakes', html: mist },
      ],
      sources: ['irs-rp2532', 'irs-f1040', 'irs-i1040', 'irs-sch1a', 'irs-obbba', 'ssa-cbb', 'irs-refunds'],
    }),
  };
};
