// Savings & retirement: the 401(k) projection, four cards, five costly mistakes.
import * as calc from '../../js/calc.js';
import { money, pct, num } from '../../js/format.js';

export const EXAMPLE = { age: 30, retireAge: 67, salary: 60000, salaryGrowth: 0.03, contribPct: 0.06, tiers: [{ rate: 0.5, upTo: 0.06 }], balance: 10000, returnRate: 0.07, fee: 0.005, inflation: 0.025 };

export default (k) => {
  const { t, box, lines, val, LIMITS } = k;
  const R = LIMITS.retirement, H = LIMITS.hsa['2026'];
  const lim = { limit: R.employeeDeferral, catchUp: R.catchUp50, catchUp6063: R.catchUp60to63 };
  const proj = o => calc.retirementProjection({ ...EXAMPLE, ...lim, ...o });
  const ex = proj({}), f = ex.final;
  const half = proj({ contribPct: 0.03 }).final, hiFee = proj({ fee: 0.01 }).final;
  // the match alone: same contributions with and without the employer's share
  const matchValue = p => proj({ contribPct: p }).final.balance - proj({ contribPct: p, tiers: [] }).final.balance;
  const missedMatch = matchValue(0.06) - matchValue(0.03);
  const years = EXAMPLE.retireAge - EXAMPLE.age;
  const income = f.real * 0.039 / 12;
  const g25 = calc.growth({ monthly: 300, annualRate: 0.07, years: 40 }).at(-1), g35 = calc.growth({ monthly: 300, annualRate: 0.07, years: 30 }).at(-1);
  const feeGap = calc.afterFees(100000, 0.04, 0.0025, 20) - calc.afterFees(100000, 0.04, 0.01, 20);
  const cpi = val('CPIAUCSL'), sav = val('SNDR');
  const realSav = (1 + sav / 100) / (1 + cpi / 100) - 1;

  const hero = { id: 'tool-proj', label: 'Your retirement savings', intro: 'A year-by-year projection. The return is an assumption, not a promise.',
    boxes:
      box({ k: 'age', label: 'Your age', type: 'num', value: EXAMPLE.age, min: 18, max: 70, step: 1 }) +
      box({ k: 'salary', label: 'Salary', value: EXAMPLE.salary, min: 10000, max: 500000, step: 1000 }) +
      box({ k: 'contrib', label: 'You put in', hint: 'of pay', type: 'pct', value: 6, min: 0, max: 50, step: 1 }),
    more:
      box({ k: 'retire', label: 'Retire at', type: 'num', value: EXAMPLE.retireAge, min: 50, max: 75, step: 1 }) +
      box({ k: 'balance', label: 'Saved so far', value: EXAMPLE.balance, min: 0, max: 2000000, step: 1000 }) +
      box({ k: 'mRate', label: 'Employer matches', type: 'pct', value: 50, min: 0, max: 100, step: 5 }) +
      box({ k: 'mUpTo', label: '… of the first', hint: '% of pay', type: 'pct', value: 6, min: 0, max: 15, step: 0.5, dp: 1 }) +
      box({ k: 'ret', label: 'Yearly return', type: 'pct', value: 7, min: 0, max: 12, step: 0.25, dp: 2 }) +
      box({ k: 'fee', label: 'Yearly fees', type: 'pct', value: 0.5, min: 0, max: 2, step: 0.05, dp: 2 }) +
      box({ k: 'infl', label: 'Inflation', hint: 'long run', type: 'pct', value: 2.5, min: 0, max: 8, step: 0.1, dp: 1 }) +
      box({ k: 'raise', label: 'Yearly raises', type: 'pct', value: 3, min: 0, max: 8, step: 0.25, dp: 2 }) };

  const more = [
    { id: 'tool-fees', label: 'Fee drag', hint: 'What 1% really costs', intro: 'Starts at the SEC\'s own example: $100,000 growing 4% a year for 20 years.',
      boxes:
        box({ k: 'start', label: 'Invested', value: 100000, min: 1000, max: 2000000, step: 1000 }) +
        box({ k: 'feeA', label: 'Low-cost fund fee', type: 'pct', value: 0.25, min: 0, max: 3, step: 0.05, dp: 2 }) +
        box({ k: 'feeB', label: 'Higher-cost fee', type: 'pct', value: 1, min: 0, max: 3, step: 0.05, dp: 2 }),
      more:
        box({ k: 'ret', label: 'Yearly return', type: 'pct', value: 4, min: 0, max: 12, step: 0.25, dp: 2 }) +
        box({ k: 'years', label: 'Years', type: 'num', value: 20, min: 1, max: 50, step: 1 }) },
    { id: 'tool-infl', label: 'Inflation', hint: 'What money buys later', intro: 'Inflation starts at the latest 12-month change in consumer prices.',
      boxes:
        box({ k: 'amount', label: 'Costs today', value: 1000, min: 10, max: 100000, step: 10 }) +
        box({ k: 'years', label: 'Years from now', type: 'num', value: 20, min: 1, max: 50, step: 1 }) +
        box({ k: 'infl', label: 'Inflation', type: 'pct', value: Math.round(cpi * 100) / 100, min: 0, max: 10, step: 0.05, live: 'CPIAUCSL', dp: 2 }),
      more: box({ k: 'yield', label: 'Your savings earn', type: 'pct', value: sav, min: 0, max: 10, step: 0.05, live: 'SNDR', dp: 2 }) },
  ];

  const cards = [
    { big: money(g25.balance - g35.balance), line: 'lost by starting at 35 instead of 25, saving $300 a month.',
      back: `At 7% a year: ${money(g25.balance)} versus ${money(g35.balance)}. Money doubles about every ten years, so the earliest dollars double the most.` },
    { big: '50%', line: 'instant return when your employer matches half of what you put in.',
      back: 'The average employer match is 4.7% of pay (Vanguard, 2026). Put in at least enough to get all of it, before anything else.' },
    { big: money(feeGap), line: 'lost to a 1% fee instead of 0.25%, on $100,000 over 20 years.',
      back: 'Fees come out every year, and the money they take stops growing. Broad index funds often charge under 0.10%. (SEC example)' },
    { big: '3.9%', line: 'of your savings you can safely spend in year one of retirement.',
      back: 'Raise it with inflation each year and the money has a 90% chance of lasting 30 years (Morningstar, 2025). $500,000 supports about $1,625 a month.' },
  ];

  const slips = [
    { title: 'Not getting the full employer match', cost: money(missedMatch), fix: 'That is what half the match grows to by 67 here. Put in at least enough to get the whole match.' },
    { title: 'Cashing out when you change jobs', cost: '$6,400 on $20k', fix: `Income tax plus a 10% penalty before 59½. Do a direct ${t('rollover')} to the new plan or an IRA instead.` },
    { title: 'Paying 1% fees instead of 0.5%', cost: money(f.balance - hiFee.balance), fix: `Check each fund's ${t('expense-ratio')}. Broad ${t('index-fund', 'index funds')} often charge under 0.10%.` },
    { title: 'Planning in future dollars', cost: `−${pct(1 - f.real / f.balance, 0)}`, fix: `${money(f.balance)} at 67 buys what ${money(f.real)} buys today. Judge every projection in today's dollars.` },
    { title: 'Leaving long-term money in cash', cost: `${pct(realSav, 1)}/yr`, fix: `That is the average savings account after ${t('inflation')}. Keep an emergency fund there; invest money meant for decades.` },
  ];

  const L = [
    { kind: 'section', desc: 'The saver' },
    { n: 1, desc: 'Age today, retiring at', amt: `${EXAMPLE.age} → ${EXAMPLE.retireAge}` },
    { n: 2, desc: 'Salary, rising 3% a year', amt: num(EXAMPLE.salary) },
    { n: 3, desc: 'You contribute 6% of pay', op: 'Line 2 × 6%, first year', amt: num(EXAMPLE.salary * 0.06) },
    { n: 4, desc: 'Employer adds 50% of the first 6%', op: 'Line 2 × 3%, first year', amt: num(EXAMPLE.salary * 0.03) },
    { n: 5, desc: 'Yearly return of 7% (assumed), less 0.50% fees', op: '(1 + 7%) × (1 − 0.50%) − 1', amt: pct(ex.netReturn, 2, true) },
    { kind: 'section', desc: `After ${years} years` },
    { n: 6, desc: 'Your contributions', amt: num(f.contributed) },
    { n: 7, desc: 'Employer match', amt: num(f.matched) },
    { n: 8, desc: 'Growth', op: 'Line 9 − lines 6, 7 and the starting $10,000', amt: num(f.growth) },
    { n: 9, desc: `Balance at ${EXAMPLE.retireAge}`, amt: num(f.balance), kind: 'total' },
    { n: 10, desc: 'In today\'s dollars, at 2.5% inflation', op: `Line 9 ÷ 1.025<sup>${years}</sup>`, amt: num(f.real) },
    { n: 11, desc: 'Monthly income at a 3.9% withdrawal', sub: 'In today\'s dollars, before Social Security (Morningstar, 2025)', op: 'Line 10 × 3.9% ÷ 12', amt: num(income), kind: 'total' },
    { kind: 'section', desc: 'Two small changes' },
    { n: 12, desc: 'Contribute 3% instead of 6%', sub: 'The employer then adds only 1.5% of pay', amt: num(half.balance) },
    { n: 13, desc: 'Cost of the lower contribution', op: 'Line 9 − line 12', amt: num(f.balance - half.balance), neg: true },
    { n: 14, desc: 'Of which, free match money given up', sub: 'The missing match plus everything it would have grown into', amt: num(missedMatch), neg: true },
    { n: 15, desc: 'Pay 1% fees instead of 0.50%', amt: num(hiFee.balance) },
    { n: 16, desc: 'Cost of the extra half-percent', op: 'Line 9 − line 15', amt: num(f.balance - hiFee.balance), neg: true },
  ];
  const example = `<p>A 30-year-old earning ${money(EXAMPLE.salary)} with ${money(EXAMPLE.balance)} saved, putting in 6% with a typical match. The 7% return is an assumption, not a forecast.</p>${lines(L, 'Worked retirement example')}`;

  const accounts = `<table class="src-table stack">
  <thead><tr><th>Account</th><th>Tax break</th><th>2026 limit</th><th>Worth knowing</th></tr></thead>
  <tbody>
    <tr><td>401(k), traditional</td><td>Pre-tax now, taxed when withdrawn</td><td class="n">${money(R.employeeDeferral)}</td><td>+${money(R.catchUp50)} at 50 or older; +${money(R.catchUp60to63)} at 60 to 63. Employer match on top.</td></tr>
    <tr><td>401(k), Roth</td><td>Taxed now, tax-free later</td><td class="n">same limit, shared</td><td>Good when your tax rate is low today.</td></tr>
    <tr><td>IRA / Roth IRA</td><td>Like the 401(k) versions</td><td class="n">${money(R.ira)}</td><td>+${money(R.iraCatchUp50)} at 50. Roth IRA phases out between ${money(R.rothIraPhaseout.single[0])} and ${money(R.rothIraPhaseout.single[1])} single.</td></tr>
    <tr><td>HSA</td><td>Tax-free in, while growing, and out for care</td><td class="n">${money(H.self)}</td><td>${money(H.family)} family; needs an HSA-eligible plan.</td></tr>
  </tbody>
</table>`;

  return {
    slug: 'retirement',
    title: 'Savings and retirement: will you have enough? | Moneywise',
    description: 'A year-by-year 401(k) projection with your employer match, the 2026 account limits, and what fees, inflation and a late start really cost.',
    body: k.topic({
      slug: 'retirement',
      sub: 'How much you\'ll have, and what quietly eats it.',
      chip: `2026 401(k) limit <b>${money(R.employeeDeferral)}</b> <small>+${money(R.catchUp50)} at 50 or older</small>`,
      hero, cards, slips, more, example,
      folds: [{ summary: '2026 account limits', html: accounts }],
      sources: ['irs-n2567', 'irs-hsa26', 'vanguard-has', 'sec-fees', 'morningstar-swr', 'bls-cpi', 'fdic-rates'],
    }),
  };
};
