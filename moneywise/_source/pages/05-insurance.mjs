// Form MW-5: Health insurance
import * as calc from '../../js/calc.js';
import { money, pct, num } from '../../js/format.js';

export default (k) => {
  const { t, box, group, tools, lines, mistakes, note, LIMITS } = k;
  const O = LIMITS.acaOutOfPocketMax, H = LIMITS.hsa;
  const ex = { deductible: 1886, coinsurance: 0.2, oopMax: 5000, premiumMonthly: 125 };
  const bill = 12000, big = 45000;
  const you = calc.youPayOnBill(ex, bill), youBig = calc.youPayOnBill(ex, big);
  const coins = (bill - ex.deductible) * ex.coinsurance;

  const what = `
<div class="prose">
  <p class="lead">Health insurance is a deal with two prices. The ${t('premium')} is what you pay every month to belong. Everything else (the ${t('deductible')}, ${t('copay', 'copays')} and ${t('coinsurance')}) is what you pay when you actually use care, up to a yearly ceiling called the ${t('oop-max', 'out-of-pocket maximum')}.</p>
  <p>Those four numbers trade off against each other. A low premium usually means a high deductible, and the reverse. Neither is "better": the right plan is the one with the lowest <b>total</b> for the year you are likely to have, and a worst case you could survive.</p>
</div>
<dl class="defs">
  <div><dt>${t('premium', 'Premium')}</dt><dd>Paid every month, used or not. Never counts toward the deductible or the maximum.</dd></div>
  <div><dt>${t('deductible', 'Deductible')}</dt><dd>What you pay for covered care each plan year before the plan starts to share the cost.</dd></div>
  <div><dt>${t('copay', 'Copay')}</dt><dd>A flat fee for a visit or prescription, often before the deductible is met.</dd></div>
  <div><dt>${t('coinsurance', 'Coinsurance')}</dt><dd>Your percentage of each bill after the deductible, until you hit the maximum.</dd></div>
  <div><dt>${t('oop-max', 'Out-of-pocket max')}</dt><dd>The most you pay for in-network covered care in a plan year. Then the plan pays 100%. By law no more than ${money(O['2026'].self)} for one person in 2026 and ${money(O['2027'].self)} in 2027.</dd></div>
</dl>
${note('Open enrollment is coming', `<p>2027 plans can make one person pay up to ${money(O['2027'].self)} (${money(O['2027'].family)} for a family) before the plan pays everything, up from ${money(O['2026'].self)}. If you choose an HSA-eligible plan, you can put ${money(H['2027'].self)} (self-only) or ${money(H['2027'].family)} (family) into a ${t('hsa')} for 2027, pre-tax.</p>`)}`;

  const how = `
<h2 class="big">Your share climbs a staircase, then stops.</h2>
<div class="two-col">
  <ol class="steps">
    <li><b>Every month:</b> the premium, no matter what.</li>
    <li><b>First dollars of care:</b> you pay 100% until the deductible is met. Copays and ${t('preventive-care', 'preventive care')} often skip this step.</li>
    <li><b>After the deductible:</b> you pay your coinsurance share (say 20%) of each ${t('allowed-amount', 'allowed amount')}; the plan pays the rest.</li>
    <li><b>At the maximum:</b> the plan pays 100% of covered in-network care for the rest of the ${t('plan-year', 'plan year')}. Then it all resets.</li>
  </ol>
  <div class="prose">
    <p>On an example plan with the average single deductible (${money(ex.deductible)}, from KFF's 2025 survey of employers), 20% coinsurance and a ${money(ex.oopMax)} maximum, a ${money(bill)} surgery costs you ${money(you)}. A ${money(big)} hospital stay costs you ${money(youBig)}: the maximum, not 20% of the bill.</p>
    <p>Two things sit outside the staircase entirely: premiums, and care from ${t('out-of-network')} providers, which may cost far more and may not count toward your maximum at all.</p>
  </div>
</div>
<div data-chart="stairs" data-ded="${ex.deductible}" data-coins="${ex.coinsurance}" data-max="${ex.oopMax}"></div>`;

  const plan = (p, P) => group(P.title) +
    box({ k: `${p}prem`, label: 'Your premium', hint: 'per month', value: P.prem, min: 0, max: 1500, step: 5 }) +
    box({ k: `${p}ded`, label: 'Deductible', value: P.ded, min: 0, max: 10000, step: 50 }) +
    box({ k: `${p}coins`, label: 'Coinsurance', type: 'pct', value: P.coins, min: 0, max: 50, step: 5 }) +
    box({ k: `${p}max`, label: 'Out-of-pocket max', value: P.max, min: 0, max: 12000, step: 100 }) +
    box({ k: `${p}visit`, label: 'Visit copay', hint: '0 = goes to deductible', value: P.visit, min: 0, max: 100, step: 5 }) +
    box({ k: `${p}rx`, label: 'Rx copay', hint: '0 = goes to deductible', value: P.rx, min: 0, max: 100, step: 5 }) +
    box({ k: `${p}hsa`, label: 'Employer HSA deposit', hint: 'per year', value: P.hsa, min: 0, max: 3000, step: 50, wide: true });

  const tryIt = tools([
    { id: 'tool-plans', label: 'Compare two plans', intro: 'Enter both plans from your enrollment materials. The calculator runs each through a light, a typical and a major year of care.', boxes:
      plan('a', { title: 'Plan A: copay plan', prem: 150, ded: 1000, coins: 20, max: 4500, visit: 30, rx: 15, hsa: 0 }) +
      plan('b', { title: 'Plan B: HSA-eligible plan', prem: 80, ded: 3000, coins: 20, max: 7500, visit: 0, rx: 0, hsa: 500 }) +
      group('Your year') +
      box({ k: 'scen', label: 'Print this year to the tape', type: 'seg', value: 'typical', wide: true, options: [['light', 'Light'], ['typical', 'Typical'], ['major', 'Major']] }) +
      box({ k: 'other', label: 'Major year: hospital & surgery', value: 40000, min: 5000, max: 150000, step: 1000, wide: true }),
      foot: 'Light: 2 doctor visits, 4 prescription fills. Typical: 6 visits, 12 fills, $1,500 of tests. Major: 8 visits, 12 fills, plus the amount above. Visits are priced at $180 and fills at $40 (allowed amounts).' },
    { id: 'tool-stairs', label: 'Where am I on the staircase?', intro: 'One plan, one bill. Drag the total bill to see who pays what.', boxes:
      box({ no: 1, k: 'bill', label: 'Total allowed charges this year', value: 12000, min: 0, max: 100000, step: 500, wide: true }) +
      box({ no: 2, k: 'ded', label: 'Deductible', value: 1886, min: 0, max: 10000, step: 50 }) +
      box({ no: 3, k: 'coins', label: 'Coinsurance', type: 'pct', value: 20, min: 0, max: 50, step: 5 }) +
      box({ no: 4, k: 'max', label: 'Out-of-pocket max', value: 5000, min: 0, max: 12000, step: 100 }) +
      box({ no: 5, k: 'prem', label: 'Your premium', hint: 'per month', value: 125, min: 0, max: 1500, step: 5 }) },
  ]);

  const L = [
    { kind: 'section', desc: 'The plan' },
    { n: 1, desc: 'Deductible', sub: 'Average single deductible for workers with one, 2025 (KFF)', amt: num(ex.deductible) },
    { n: 2, desc: 'Coinsurance after the deductible', sub: 'Example plan', amt: pct(ex.coinsurance, 0) },
    { n: 3, desc: 'Out-of-pocket maximum', sub: `Example plan; the 2026 legal ceiling is ${money(O['2026'].self)}`, amt: num(ex.oopMax) },
    { kind: 'section', desc: `A ${money(bill)} MRI and outpatient surgery` },
    { n: 4, desc: 'Allowed charges', sub: 'What the plan has agreed to pay the providers', amt: num(bill) },
    { n: 5, desc: 'You pay the deductible first', op: 'Smaller of line 1 and line 4', amt: num(ex.deductible) },
    { n: 6, desc: 'Charges left after the deductible', op: 'Line 4 − line 5', amt: num(bill - ex.deductible) },
    { n: 7, desc: 'Your coinsurance share', op: 'Line 6 × line 2', amt: num(coins) },
    { n: 8, desc: 'You pay in all', op: 'Line 5 + line 7, but no more than line 3', amt: num(you), kind: 'total' },
    { n: 9, desc: 'The plan pays', op: 'Line 4 − line 8', amt: num(bill - you) },
    { kind: 'section', desc: `A ${money(big)} hospital stay instead` },
    { n: 10, desc: 'Deductible plus 20% of the rest', op: `${money(ex.deductible)} + 20% × ${money(big - ex.deductible)}`, amt: num(ex.deductible + (big - ex.deductible) * ex.coinsurance) },
    { n: 11, desc: 'Capped at the maximum', op: 'Smaller of line 10 and line 3', amt: num(youBig), kind: 'total' },
    { kind: 'section', desc: 'Do not forget' },
    { n: 12, desc: 'Your share of premiums for the year', sub: 'Example: $125 a month taken from your paycheck', op: '$125 × 12', amt: num(ex.premiumMonthly * 12) },
    { n: 13, desc: 'Worst-case year', op: 'Line 3 + line 12', amt: num(ex.oopMax + ex.premiumMonthly * 12), kind: 'total' },
  ];
  const example = `<div class="example-head"><p>One plan, two bad years. The cap on line 3 is what protects you from the second one.</p></div>${lines(L, 'Worked health insurance example')}`;

  const mist = mistakes([
    { title: 'Choosing on premium alone', why: 'The cheapest monthly premium can cost the most in a year with a surgery, and the lowest deductible can cost the most in a healthy year.', fix: 'Compare premium plus expected out-of-pocket for a light and a bad year, and make sure you could cover the worst case.' },
    { title: 'Thinking the maximum includes premiums', why: `Your worst case is the out-of-pocket maximum plus a full year of premiums. On the example plan that is ${money(ex.oopMax + ex.premiumMonthly * 12)}, not ${money(ex.oopMax)}.`, fix: 'Add twelve months of premiums to the maximum when you size your emergency fund.' },
    { title: 'Going out of network', why: 'Out-of-network bills can be far higher, may not count toward your maximum, and some plans pay nothing.', fix: 'Check the network for every doctor, lab and facility before scheduled care. For emergencies and some hospital care, the No Surprises Act limits you to in-network costs.' },
    { title: 'Forgetting the reset date', why: 'Deductibles and maximums start over at the beginning of each plan year, often January 1.', fix: 'If you have already hit your maximum, schedule elective care before the plan year ends.' },
    { title: 'Assuming a checkup is always free', why: 'Preventive care is covered with no cost in network, but tests or treatment for a new problem during the same visit can be billed as diagnostic care.', fix: 'Ask before extra tests whether they will be billed as preventive or diagnostic.' },
    { title: 'Leaving the HSA on the table', why: `An HSA is the only account that is pre-tax going in, tax-free while it grows and tax-free coming out for medical costs. The 2027 limit is ${money(H['2027'].self)} self-only.`, fix: 'Contribute through payroll to skip Social Security and Medicare tax too, take any employer deposit, and invest what you do not need this year.' },
    { title: 'Skipping the drug list', why: `A plan can look cheapest until your prescription sits in a high tier of its ${t('formulary')} or needs ${t('prior-authorization', 'prior authorization')}.`, fix: 'Search each plan\'s drug list for every regular prescription before you enroll.' },
    { title: 'Paying a bill before the EOB arrives', why: 'Billing errors are common, and the provider\'s bill can differ from what your plan says you owe.', fix: `Wait for the ${t('eob')} and pay what it says you owe; call the provider if the bill is higher.` },
  ]);

  return {
    slug: 'insurance',
    title: 'Health insurance, explained with the math shown | Moneywise',
    description: 'Premium, deductible, copay, coinsurance and out-of-pocket maximum in plain English, with a two-plan comparison across light, typical and major years and the 2026 and 2027 legal limits.',
    body: k.module({
      slug: 'insurance',
      lede: 'Premium, deductible, copay, coinsurance and the out-of-pocket maximum, laid out as a staircase, plus a way to pick the plan that costs least for the year you are likely to have.',
      today: [
        { label: 'Out-of-pocket ceiling, 2026', value: money(O['2026'].self), sub: `${money(O['2026'].family)} family` },
        { label: 'Out-of-pocket ceiling, 2027', value: money(O['2027'].self), sub: `${money(O['2027'].family)} family` },
        { label: 'HSA limit, 2026', value: money(H['2026'].self), sub: `${money(H['2026'].family)} family` },
        { label: 'Average single deductible', value: '$1,886', sub: 'workers with one, 2025' },
      ],
      todaySrc: 'CMS; IRS Rev. Procs. 2025-19 and 2026-24; KFF Employer Health Benefits Survey 2025.',
      parts: [
        { id: 'what', short: 'What it is', title: 'What it is', html: what },
        { id: 'how', short: 'How it works', title: 'How it works', html: how },
        { id: 'try', short: 'Try it', title: 'Try it', html: tryIt, aside: 'Prints every step to the tape' },
        { id: 'example', short: 'Worked example', title: 'Worked example', html: example },
        { id: 'mistakes', short: 'Common mistakes', title: 'Common mistakes', html: mist },
      ],
      sources: ['kff-ehbs', 'cms-oop', 'irs-hsa26', 'irs-hsa27'],
    }),
  };
};
