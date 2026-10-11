// Form MW-7: Savings & retirement
import * as calc from '../../js/calc.js';
import { money, pct, num } from '../../js/format.js';

export const EXAMPLE = { age: 30, retireAge: 67, salary: 60000, salaryGrowth: 0.03, contribPct: 0.06, tiers: [{ rate: 0.5, upTo: 0.06 }], balance: 10000, returnRate: 0.07, fee: 0.005, inflation: 0.025 };

export default (k) => {
  const { t, box, group, tools, lines, mistakes, note, rate, asof, val, LIMITS } = k;
  const R = LIMITS.retirement, H = LIMITS.hsa['2026'];
  const lim = { limit: R.employeeDeferral, catchUp: R.catchUp50, catchUp6063: R.catchUp60to63 };
  const ex = calc.retirementProjection({ ...EXAMPLE, ...lim }), f = ex.final;
  const half = calc.retirementProjection({ ...EXAMPLE, ...lim, contribPct: 0.03 }).final;
  // the match alone: same contributions with and without the employer's share
  const matchValue = pct => calc.retirementProjection({ ...EXAMPLE, ...lim, contribPct: pct }).final.balance - calc.retirementProjection({ ...EXAMPLE, ...lim, contribPct: pct, tiers: [] }).final.balance;
  const missedMatch = matchValue(0.06) - matchValue(0.03);
  const hiFee = calc.retirementProjection({ ...EXAMPLE, ...lim, fee: 0.01 }).final;
  const years = EXAMPLE.retireAge - EXAMPLE.age;
  const income = f.real * 0.039 / 12;
  const g25 = calc.growth({ monthly: 300, annualRate: 0.07, years: 40 }).at(-1), g35 = calc.growth({ monthly: 300, annualRate: 0.07, years: 30 }).at(-1);
  const cpi = val('CPIAUCSL');

  const what = `
<div class="prose">
  <p class="lead">Saving for retirement is mostly a contest between three forces: ${t('compound-interest', 'compounding')}, which grows money on its own; ${t('inflation')}, which shrinks what each dollar buys; and fees, which quietly take a cut every year. Tax-advantaged accounts and an ${t('employer-match')} tilt the contest in your favor.</p>
</div>
<table class="src-table stack">
  <thead><tr><th>Account</th><th>Tax break</th><th>2026 limit</th><th>Worth knowing</th></tr></thead>
  <tbody>
    <tr><td><b>${t('401k')}</b>, ${t('traditional', 'traditional')}</td><td>Pre-tax now, taxed when withdrawn</td><td class="n">${money(R.employeeDeferral)}</td><td>+${money(R.catchUp50)} at 50 or older; +${money(R.catchUp60to63)} at 60 to 63. Employer match on top.</td></tr>
    <tr><td><b>401(k)</b>, ${t('roth', 'Roth')}</td><td>Taxed now, tax-free later</td><td class="n">same limit, shared</td><td>Good when your tax rate is low today.</td></tr>
    <tr><td><b>${t('ira', 'IRA')}</b> / Roth IRA</td><td>Like the 401(k) versions</td><td class="n">${money(R.ira)}</td><td>+${money(R.iraCatchUp50)} at 50. Roth IRA phases out between ${money(R.rothIraPhaseout.single[0])} and ${money(R.rothIraPhaseout.single[1])} single.</td></tr>
    <tr><td><b>${t('hsa', 'HSA')}</b></td><td>Pre-tax in, tax-free growth, tax-free out for care</td><td class="n">${money(H.self)}</td><td>${money(H.family)} family; needs an HSA-eligible plan. After 65, works like a traditional IRA for anything.</td></tr>
  </tbody>
</table>
${note('The best return you will ever get', `<p>Vanguard's 2026 study of its plans found the average employer match was 4.7% of pay and the average employee deferral 7.6%, yet some workers still contribute less than their plan's match requires. If your employer matches 50% of the first 6%, putting in 6% earns an instant 50% return on that money before any market gain.</p>`)}`;

  const how = `
<h2 class="big">Time does most of the work.</h2>
<div class="two-col">
  <div class="prose">
    <p>Growth earns growth. Someone who invests $300 a month from 25 to 65 at 7% a year ends with about ${money(g25.balance)}, having put in ${money(g25.contributed)}. Starting at 35 instead ends near ${money(g35.balance)}: ten years later costs less than half the money. The ${t('rule-of-72')} explains it: at 7% money doubles about every ten years, so the earliest dollars double the most times.</p>
    <p>Two things work in reverse. ${t('inflation', 'Inflation')} means a dollar in 30 years buys far less than today (prices rose ${rate('CPIAUCSL')} over the last year). And every percent of yearly fees compounds against you, which is why the ${t('expense-ratio')} of each fund matters.</p>
  </div>
  <div data-chart="early"></div>
</div>
<div data-chart="fees"></div>
<div class="prose">
  <h3>How much can you spend later?</h3>
  <p>Morningstar's 2025 research puts the ${t('safe-withdrawal-rate', 'safe starting withdrawal rate')} at 3.9%: spend that share of your savings in year one, raise it with inflation each year, and the money has a 90% chance of lasting 30 years. Flexible spending, delaying Social Security and inflation-protected bonds can support more.</p>
</div>`;

  const tryIt = tools([
    { id: 'tool-proj', label: 'Your 401(k)', intro: 'A yearly projection. Contributions are capped at the IRS limit for your age; limits, salary and prices are assumed to rise each year. Returns are an assumption, not a promise.', boxes:
      box({ no: 1, k: 'age', label: 'Your age', type: 'num', value: EXAMPLE.age, min: 18, max: 70, step: 1 }) +
      box({ no: 2, k: 'retire', label: 'Retire at', type: 'num', value: EXAMPLE.retireAge, min: 50, max: 75, step: 1 }) +
      box({ no: 3, k: 'salary', label: 'Salary', value: EXAMPLE.salary, min: 10000, max: 500000, step: 1000 }) +
      box({ no: 4, k: 'balance', label: 'Saved so far', value: EXAMPLE.balance, min: 0, max: 2000000, step: 1000 }) +
      box({ no: 5, k: 'contrib', label: 'You contribute', type: 'pct', value: 6, min: 0, max: 50, step: 1 }) +
      box({ no: 6, k: 'mRate', label: 'Employer matches', type: 'pct', value: 50, min: 0, max: 100, step: 5 }) +
      box({ no: 7, k: 'mUpTo', label: '… of the first', hint: '% of pay', type: 'pct', value: 6, min: 0, max: 15, step: 0.5, dp: 1 }) +
      box({ no: 8, k: 'ret', label: 'Yearly return', type: 'pct', value: 7, min: 0, max: 12, step: 0.25, dp: 2 }) +
      box({ no: 9, k: 'fee', label: 'Yearly fees', type: 'pct', value: 0.5, min: 0, max: 2, step: 0.05, dp: 2 }) +
      box({ no: 10, k: 'infl', label: 'Inflation', hint: 'long run', type: 'pct', value: 2.5, min: 0, max: 8, step: 0.1, dp: 1 }) +
      box({ no: 11, k: 'raise', label: 'Yearly raises', type: 'pct', value: 3, min: 0, max: 8, step: 0.25, dp: 2, wide: true }) },
    { id: 'tool-fees', label: 'Fee drag', intro: 'Starts at the SEC\'s own example: $100,000 growing 4% a year for 20 years.', boxes:
      box({ no: 1, k: 'start', label: 'Invested', value: 100000, min: 1000, max: 2000000, step: 1000 }) +
      box({ no: 2, k: 'ret', label: 'Yearly return', type: 'pct', value: 4, min: 0, max: 12, step: 0.25, dp: 2 }) +
      box({ no: 3, k: 'years', label: 'Years', type: 'num', value: 20, min: 1, max: 50, step: 1 }) +
      box({ no: 4, k: 'feeA', label: 'Low-cost fund fee', type: 'pct', value: 0.25, min: 0, max: 3, step: 0.05, dp: 2 }) +
      box({ no: 5, k: 'feeB', label: 'Higher-cost fee', type: 'pct', value: 1, min: 0, max: 3, step: 0.05, dp: 2, wide: true }) },
    { id: 'tool-infl', label: 'Inflation', intro: 'What prices and savings look like later. Inflation starts at the latest 12-month CPI change.', boxes:
      box({ no: 1, k: 'amount', label: 'Costs today', value: 1000, min: 10, max: 100000, step: 10 }) +
      box({ no: 2, k: 'years', label: 'Years from now', type: 'num', value: 20, min: 1, max: 50, step: 1 }) +
      box({ no: 3, k: 'infl', label: 'Inflation', type: 'pct', value: Math.round(cpi * 100) / 100, min: 0, max: 10, step: 0.05, live: 'CPIAUCSL', dp: 2 }) +
      box({ no: 4, k: 'yield', label: 'Your savings earn', type: 'pct', value: val('SNDR'), min: 0, max: 10, step: 0.05, live: 'SNDR', dp: 2 }) },
  ]);

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
  const example = `<div class="example-head"><p>A 30-year-old earning ${money(EXAMPLE.salary)} with ${money(EXAMPLE.balance)} saved, contributing 6% with a typical match. The 7% return is an assumption for a stock-heavy mix over decades, not a forecast.</p></div>${lines(L, 'Worked retirement example')}`;

  const mist = mistakes([
    { title: 'Not contributing enough to get the full match', why: `In the example, dropping from 6% to 3% gives up ${money(missedMatch)} of employer money and its growth by ${EXAMPLE.retireAge}, on top of the saver's own smaller contributions.`, fix: 'Find your plan\'s match formula and contribute at least up to its top. Treat it as part of your salary.' },
    { title: 'Cashing out when you change jobs', why: `An ${t('early-withdrawal', 'early withdrawal')} before 59 1/2 usually costs income tax plus a 10% penalty: on $20,000 in the 22% bracket, about $6,400 gone, plus every dollar it would have grown into.`, fix: `Do a direct ${t('rollover')} to your new plan or an IRA.` },
    { title: 'Ignoring fees', why: `Paying 1% instead of 0.50% a year costs the example saver ${money(f.balance - hiFee.balance)} by ${EXAMPLE.retireAge}.`, fix: `Check each fund's ${t('expense-ratio')}; broad ${t('index-fund', 'index funds')} often charge under 0.10%.` },
    { title: 'Setting it once and forgetting it', why: 'A contribution that never rises falls further behind your pay and the limits every year.', fix: 'Turn on automatic yearly increases, or raise your percentage by one point with every raise.' },
    { title: 'Skipping Roth while your tax rate is low', why: 'Early in a career, many people are in the 10% or 12% bracket. Paying tax now at a low rate can beat paying later at a higher one.', fix: 'Split contributions between traditional and Roth if you are unsure; your plan may allow both.' },
    { title: 'Selling after the market drops', why: 'Locking in a loss turns a temporary decline into a permanent one, and missing the rebound is costly.', fix: `Pick a mix you can hold through a bad year (a ${t('target-date-fund')} does this for you) and keep contributing.` },
    { title: 'Planning in future dollars', why: `${money(f.balance)} at ${EXAMPLE.retireAge} sounds like a lot; in today's dollars it is ${money(f.real)}.`, fix: 'Judge every projection in today\'s dollars, like line 10 of the worked example.' },
    { title: 'Parking long-term savings in cash', why: `Cash at the ${pct(val('SNDR') / 100, 2, true)} national average loses buying power when prices rise ${pct(cpi / 100, 2, true)} a year.`, fix: 'Keep an emergency fund in high-yield savings; invest money meant for decades.' },
  ]);

  return {
    slug: 'retirement',
    title: 'Savings and retirement, explained with the math shown | Moneywise',
    description: '401(k), IRA and HSA limits for 2026, employer match, compounding, inflation and fee drag, with a year-by-year projection and the 3.9% safe withdrawal rate.',
    body: k.module({
      slug: 'retirement',
      lede: 'How compounding, an employer match, inflation and fees decide what you retire with, the 2026 account limits, and a projection that shows every year of the math.',
      today: [
        { label: '401(k) limit', value: money(R.employeeDeferral), sub: `+${money(R.catchUp50)} at 50+, 2026` },
        { label: 'IRA limit', value: money(R.ira), sub: `+${money(R.iraCatchUp50)} at 50+, 2026` },
        { label: 'Average employer match', value: '4.7%', sub: 'of pay, 2025 (Vanguard)' },
        { label: 'Inflation', value: rate('CPIAUCSL'), sub: asof('CPIAUCSL') },
      ],
      todaySrc: 'IRS Notice 2025-67; Vanguard How America Saves 2026; BLS via FRED.',
      parts: [
        { id: 'what', short: 'What it is', title: 'What it is', html: what },
        { id: 'how', short: 'How it works', title: 'How it works', html: how },
        { id: 'try', short: 'Try it', title: 'Try it', html: tryIt, aside: 'Prints every step to the tape' },
        { id: 'example', short: 'Worked example', title: 'Worked example', html: example },
        { id: 'mistakes', short: 'Common mistakes', title: 'Common mistakes', html: mist },
      ],
      sources: ['irs-n2567', 'irs-hsa26', 'vanguard-has', 'sec-fees', 'morningstar-swr', 'bls-cpi', 'fdic-rates'],
    }),
  };
};
