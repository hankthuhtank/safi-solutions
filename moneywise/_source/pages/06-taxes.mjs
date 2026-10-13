// Taxes: the paycheck calculator, four cards, five costly mistakes.
import * as calc from '../../js/calc.js';
import { money, pct, num } from '../../js/format.js';

export default (k) => {
  const { t, box, lines, TAX } = k;
  const B = TAX.brackets.single, SD = TAX.standardDeduction, P = TAX.payroll, S1 = TAX.schedule1A;
  const wages = 75000, k401 = 4500;
  const it = calc.incomeTax({ status: 'single', wages, preTax: k401 }, TAX);
  const table = calc.irsTaxTable(it.taxable, B);
  const fica = calc.payrollTax(wages, 'single', P);
  const keep = 1000 * (1 - it.marginal - P.socialSecurityRate - P.medicareRate);
  const rowsB = it.rows.filter(r => r.amount > 0);
  const statusOpts = [['single', 'Single'], ['mfj', 'Married, joint'], ['hoh', 'Head of household'], ['mfs', 'Married, separate']];
  const paid = sel => box({ k: 'periods', label: 'Paid', type: 'sel', value: '26', options: [['52', 'Weekly'], ['26', 'Every two weeks'], ['24', 'Twice a month'], ['12', 'Monthly']], ...sel });

  const hero = { id: 'tool-pay', label: 'Your paycheck', intro: 'Where each paycheck goes, from gross pay to what reaches your bank.',
    boxes:
      box({ k: 'salary', label: 'Yearly salary', value: wages, min: 10000, max: 500000, step: 1000 }) + paid() +
      box({ k: 'status', label: 'Filing status', type: 'sel', value: 'single', options: statusOpts }),
    more:
      box({ k: 'k401', label: 'Traditional 401(k)', type: 'pct', value: 6, min: 0, max: 50, step: 1 }) +
      box({ k: 'roth', label: 'Roth 401(k)', type: 'pct', value: 0, min: 0, max: 50, step: 1 }) +
      box({ k: 'health', label: 'Health premium', hint: 'per check', value: 60, min: 0, max: 1000, step: 5 }) +
      box({ k: 'hsa', label: 'HSA', hint: 'per check', value: 0, min: 0, max: 500, step: 5 }) +
      box({ k: 'state', label: 'State income tax', hint: 'flat estimate', type: 'pct', value: 4, min: 0, max: 13.3, step: 0.1, dp: 1, wide: true }) };

  const more = [
    { id: 'tool-tax', label: 'Your federal tax', hint: 'Brackets, step by step', intro: '2026 brackets and standard deduction.',
      boxes:
        box({ k: 'status', label: 'Filing status', type: 'sel', value: 'single', options: statusOpts }) +
        box({ k: 'wages', label: 'Wages, tips, overtime', value: wages, min: 0, max: 500000, step: 1000 }) +
        box({ k: 'pretax', label: 'Pre-tax 401(k), HSA, premiums', value: k401, min: 0, max: 50000, step: 250 }),
      more:
        box({ k: 'other', label: 'Other income', value: 0, min: 0, max: 200000, step: 500 }) +
        box({ k: 'itemized', label: 'Itemized deductions', hint: '0 = standard', value: 0, min: 0, max: 100000, step: 500 }) +
        box({ k: 'kids', label: 'Children under 17', type: 'seg', value: 0, wide: true, options: [[0, '0'], [1, '1'], [2, '2'], [3, '3'], [4, '4']] }) +
        box({ k: 'seniors', label: 'People 65 or older', type: 'seg', value: 0, wide: true, options: [[0, '0'], [1, '1'], [2, '2']] }) +
        box({ k: 'tips', label: 'Qualified tips', value: 0, min: 0, max: 60000, step: 500 }) +
        box({ k: 'ot', label: 'Overtime premium', value: 0, min: 0, max: 40000, step: 250 }) +
        box({ k: 'car', label: 'New-car loan interest', value: 0, min: 0, max: 15000, step: 100, wide: true }),
      moreLabel: 'Kids, itemizing and the new deductions' },
    { id: 'tool-refund', label: 'Refund check', hint: 'Too much withheld?', intro: 'Find the federal tax line on a recent pay stub.',
      boxes:
        box({ k: 'wages', label: 'Yearly wages', value: wages, min: 10000, max: 500000, step: 1000 }) +
        box({ k: 'withheld', label: 'Federal tax withheld per check', value: 380, min: 0, max: 5000, step: 5 }) + paid(),
      more:
        box({ k: 'status', label: 'Filing status', type: 'sel', value: 'single', options: statusOpts }) +
        box({ k: 'pretax', label: 'Pre-tax deductions', hint: 'a year', value: k401, min: 0, max: 50000, step: 250 }) },
  ];

  const cards = [
    { big: money(keep), line: 'of your next $1,000 you keep, even in the 22% bracket.',
      back: 'Only the dollars above a bracket line pay the higher rate. A raise can never shrink your take-home pay.' },
    { big: pct(it.tax / wages, 1), line: `the real income tax rate on a ${money(wages)} salary.`,
      back: `Brackets fill like buckets: 10% on the first ${money(B[0].upTo)} of taxable income, 12% up to ${money(B[1].upTo)}, 22% after that. Each rate touches only its own slice.` },
    { big: '$3,276', line: 'the average refund: money you lent the IRS at 0%.',
      back: 'That is about $126 a paycheck you could have had all year. Updating your W-4 puts it back in each check. (IRS, 2026)' },
    { big: '7.65%', line: 'for Social Security and Medicare, out of every paycheck.',
      back: `6.2% on wages up to ${money(P.socialSecurityWageBase)} and 1.45% on all of it. A traditional 401(k) lowers income tax but not this.` },
  ];

  const slips = [
    { title: 'Celebrating a big refund', cost: '$126/check', fix: `Use the IRS Tax Withholding Estimator and update your ${t('withholding', 'W-4 withholding')}.` },
    { title: 'Treating a deduction like a credit', cost: '$220 vs $1,000', fix: `A $1,000 deduction saves $220 in the 22% bracket. A $1,000 ${t('tax-credit', 'credit')} saves the full $1,000.` },
    { title: 'Not saving for tax on side income', cost: '15.3% + tax', fix: `Side income owes ${t('self-employment-tax', 'self-employment tax')} too. Set aside about a third and pay quarterly.` },
    { title: 'Missing the new deductions', cost: `up to ${money(S1.tips.cap)}`, fix: `Tips, the overtime premium and new-car loan interest come off on ${t('schedule-1a')}, even without itemizing.` },
    { title: 'Selling investments in the wrong year', cost: '0% missed', fix: `Long-term ${t('capital-gains')} are taxed 0% while taxable income stays under ${money(TAX.capitalGains.zeroMax.single)} (single).` },
  ];

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
  const example = `<p>A single filer earning ${money(wages)} who puts 6% into a traditional 401(k), 2026 rules.</p>${lines(L, 'Worked tax example')}`;

  const bracketRows = st => TAX.brackets[st].map((b, i, a) => `<tr><td>${pct(b.rate, 0)}</td><td class="n">${money(i ? a[i - 1].upTo : 0)}</td><td class="n">${b.upTo == null ? 'and up' : money(b.upTo)}</td></tr>`).join('');
  const brackets = `<div class="two-tables">
  <table class="src-table"><caption class="micro">Single</caption><thead><tr><th>Rate</th><th>Taxable income over</th><th>Up to</th></tr></thead><tbody>${bracketRows('single')}</tbody></table>
  <table class="src-table"><caption class="micro">Married filing jointly</caption><thead><tr><th>Rate</th><th>Taxable income over</th><th>Up to</th></tr></thead><tbody>${bracketRows('mfj')}</tbody></table>
</div><p class="fold-more">Standard deduction: ${money(SD.single)} single, ${money(SD.mfj)} joint, ${money(SD.hoh)} head of household (Rev. Proc. 2025-32).</p>`;

  return {
    slug: 'taxes',
    title: 'Taxes: where your paycheck goes | Moneywise',
    description: 'Where each paycheck goes, how the 2026 brackets really work, marginal versus effective rates, what a refund means, and the new deductions for tips, overtime and car loans.',
    body: k.topic({
      slug: 'taxes',
      sub: 'Where your paycheck goes, and what your tax rate really is.',
      chip: `2026 standard deduction <b>${money(SD.single)}</b> <small>single filers</small>`,
      hero, cards, slips, more, example,
      folds: [{ summary: 'The 2026 tax brackets', html: brackets }],
      sources: ['irs-rp2532', 'irs-f1040', 'irs-i1040', 'irs-sch1a', 'irs-obbba', 'ssa-cbb', 'irs-refunds'],
    }),
  };
};
