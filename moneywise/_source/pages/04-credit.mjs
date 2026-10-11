// Form MW-4: Credit
import * as calc from '../../js/calc.js';
import { money, pct, num, duration } from '../../js/format.js';

export const DEBTS = [
  { name: 'Visa', balance: 8400, apr: 24.99, min: 210 },
  { name: 'Store card', balance: 650, apr: 19.99, min: 35 },
  { name: 'Personal loan', balance: 3200, apr: 11.9, min: 145 },
  { name: 'Car loan', balance: 10500, apr: 7.49, min: 300 },
];
export const BUDGET = 1000;

export default (k) => {
  const { t, box, group, tools, lines, mistakes, note, rate, asof, val } = k;
  const D = DEBTS.map(d => ({ ...d, apr: d.apr / 100 }));
  const av = calc.payoffPlan({ debts: D, budget: BUDGET, strategy: 'avalanche' });
  const sb = calc.payoffPlan({ debts: D, budget: BUDGET, strategy: 'snowball' });
  const cardInt = val('TERMCBCCINTNS') / 100;
  const minp = calc.minimumPayoff({ balance: 5000, apr: cardInt, percent: 0.01, plusInterest: true, floor: 35 });
  const p36 = calc.payment(5000, cardInt, 36);
  const factor = (w, c, name, body) => `<span style="flex:${w};background:${c}" title="${name}: ${w}%">${w}%</span>`;

  const what = `
<div class="prose">
  <p class="lead">Your ${t('credit-report')} is the record: every card and loan, its limit, its balance and whether you paid on time. Your ${t('credit-score')} is a grade computed from that record. Lenders use the grade to decide whether to say yes and what to charge; landlords, insurers and some employers look too.</p>
  <p>The most common score is the ${t('fico')}, from 300 to 850. The average was 714 in spring 2026. Your income, savings, job title and debit card use are not part of it; only what is on your credit reports counts.</p>
</div>
<div class="anatomy" role="img" aria-label="What makes up a FICO score: payment history 35%, amounts owed 30%, length of history 15%, new credit 10%, credit mix 10%">
  <p class="micro" style="margin:0 0 8px">What a FICO score weighs, for the general population (myFICO)</p>
  <div class="anatomy-bar">${factor(35, 'var(--series-1)', 'Payment history')}${factor(30, 'var(--series-2)', 'Amounts owed')}${factor(15, 'var(--series-3)', 'Length of history')}${factor(10, 'var(--series-4)', 'New credit')}${factor(10, 'var(--series-5)', 'Credit mix')}</div>
  <div class="anatomy-keys">
    <div style="--k:var(--series-1)"><b>Payment history 35%</b>On time, every time. A payment 30 days late can stay on your report for seven years.</div>
    <div style="--k:var(--series-2)"><b>Amounts owed 30%</b>Mostly ${t('utilization')}: card balances against limits.</div>
    <div style="--k:var(--series-3)"><b>Length of history 15%</b>The age of your oldest, newest and average accounts.</div>
    <div style="--k:var(--series-4)"><b>New credit 10%</b>Recent accounts and ${t('hard-inquiry', 'hard inquiries')}.</div>
    <div style="--k:var(--series-5)"><b>Credit mix 10%</b>Cards and installment loans, handled well.</div>
  </div>
</div>
${note('Free, every week', `<p>Equifax, Experian and TransUnion let you pull all three reports free every week at AnnualCreditReport.com. Free scores from banks and apps are often VantageScore, a different model, so they will not match a lender's FICO exactly.</p>`)}`;

  const timeline = `
<ol class="cycle" aria-label="A credit card billing cycle">
  <li><b>Day 1</b><span>Cycle starts. Purchases add to the balance.</span></li>
  <li class="hot"><b>Day 30</b><span>${t('statement-closing-date', 'Statement closes')}. This balance is usually what gets reported to the bureaus.</span></li>
  <li><b>21+ days later</b><span>Due date. Pay the ${t('statement-balance', 'statement balance')} in full and new purchases cost no interest (the ${t('grace-period', 'grace period')}).</span></li>
  <li class="bad"><b>30 days past due</b><span>Only now can a late payment be reported, and it can stay seven years.</span></li>
</ol>`;

  const how = `
<h2 class="big">Two habits do most of the work.</h2>
<div class="prose">
  <p><b>Pay on time.</b> Payment history is the biggest factor, and a payment is not reported late until it is 30 days past due. Set up autopay for at least the minimum so a busy month never becomes a late mark.</p>
  <p><b>Keep reported balances low.</b> Utilization is your balances divided by your limits, both on each card and overall. The catch most people miss is timing: issuers usually report the balance on your statement date, not after your payment. Spend $2,000 on a $5,000 card and pay it in full on the due date, and the bureaus may still see 40%.</p>
</div>
${timeline}
<div class="prose">
  <h3>Paying off several debts: two orders</h3>
  <p>Pay every minimum, then send all extra money to one target. The ${t('avalanche', 'avalanche')} targets the highest rate first and always costs the least. The ${t('snowball', 'snowball')} targets the smallest balance first, costs a bit more, and delivers quick wins. Researchers at Kellogg studied about 6,000 people in a debt-settlement program and found those who closed out small balances early were more likely to clear all their debt. The best order is the one you will finish.</p>
</div>`;

  const debtBoxes = DEBTS.map((d, i) => group(d.name) +
    box({ k: `b${i}`, label: 'Balance', value: d.balance, min: 0, max: 40000, step: 50 }) +
    box({ k: `r${i}`, label: 'APR', type: 'pct', value: d.apr, min: 0, max: 36, step: 0.25, dp: 2 }) +
    box({ k: `m${i}`, label: 'Minimum', value: d.min, min: 0, max: 1500, step: 5 })).join('');

  const tryIt = tools([
    { id: 'tool-race', label: 'Avalanche vs snowball', cols: 3, intro: 'Same debts, same monthly budget, two orders. Press Run the race to watch both plans month by month.', boxes:
      box({ no: 1, k: 'budget', label: 'Monthly budget for all debts', value: BUDGET, min: 100, max: 5000, step: 25, wide: true }) + debtBoxes, foot: 'Minimums stay fixed for simplicity; real card minimums shrink as the balance falls, which makes paying only the minimum even slower.' },
    { id: 'tool-util', label: 'Utilization', intro: 'Enter each card\'s limit and the balance on its last statement. Scoring models look at the overall ratio and at your highest single card.', boxes:
      group('Card 1') + box({ k: 'l0', label: 'Limit', value: 5000, min: 0, max: 50000, step: 100 }) + box({ k: 's0', label: 'Statement balance', value: 2000, min: 0, max: 50000, step: 50 }) +
      group('Card 2') + box({ k: 'l1', label: 'Limit', value: 8000, min: 0, max: 50000, step: 100 }) + box({ k: 's1', label: 'Statement balance', value: 450, min: 0, max: 50000, step: 50 }) +
      group('Card 3') + box({ k: 'l2', label: 'Limit', value: 2500, min: 0, max: 50000, step: 100 }) + box({ k: 's2', label: 'Statement balance', value: 0, min: 0, max: 50000, step: 50 }) },
    { id: 'tool-min', label: 'Minimum payment trap', intro: 'Every card statement must print a box like the one below. Here it is for your balance.', boxes:
      box({ no: 1, k: 'balance', label: 'Card balance', value: 5000, min: 100, max: 40000, step: 100 }) +
      box({ no: 2, k: 'apr', label: 'APR', type: 'pct', value: Math.round(cardInt * 10000) / 100, min: 0, max: 36, step: 0.05, live: 'TERMCBCCINTNS', dp: 2 }) +
      box({ no: 3, k: 'pct', label: 'Minimum: % of balance', type: 'pct', value: 1, min: 0.5, max: 5, step: 0.25, dp: 2 }) +
      box({ no: 4, k: 'floor', label: 'Minimum at least', value: 35, min: 0, max: 100, step: 5 }) +
      box({ no: 5, k: 'plusInt', label: 'Plus that month\'s interest (most issuers)', type: 'check', value: true, wide: true }) },
  ]);

  const L = [
    { kind: 'section', desc: `Four debts, ${money(BUDGET)} a month in all` },
    ...DEBTS.map((d, i) => ({ n: i + 1, desc: d.name, sub: `${pct(d.apr / 100, 2, true)} APR, minimum ${money(d.min)}`, amt: num(d.balance) })),
    { n: 5, desc: 'Total owed', op: 'Lines 1 to 4', amt: num(DEBTS.reduce((s, d) => s + d.balance, 0)), kind: 'total' },
    { n: 6, desc: 'Extra each month beyond the minimums', op: `${money(BUDGET)} − ${money(DEBTS.reduce((s, d) => s + d.min, 0))}`, amt: num(BUDGET - DEBTS.reduce((s, d) => s + d.min, 0)) },
    { kind: 'section', desc: 'Avalanche: highest rate first' },
    { n: 7, desc: 'First debt paid off', sub: DEBTS[av.order[0]].name, amt: `month ${av.firstWinMonth}` },
    { n: 8, desc: 'Debt-free', amt: `month ${av.months}` },
    { n: 9, desc: 'Total interest', amt: num(av.totalInterest) },
    { kind: 'section', desc: 'Snowball: smallest balance first' },
    { n: 10, desc: 'First debt paid off', sub: DEBTS[sb.order[0]].name, amt: `month ${sb.firstWinMonth}` },
    { n: 11, desc: 'Debt-free', amt: `month ${sb.months}` },
    { n: 12, desc: 'Total interest', amt: num(sb.totalInterest) },
    { n: 13, desc: 'Price of the quicker wins', op: 'Line 12 − line 9', amt: num(sb.totalInterest - av.totalInterest), kind: 'total' },
  ];
  const example = `<div class="example-head"><p>A typical mix of debts and a fixed monthly budget. Both plans finish in the same month here; the difference is when the first debt disappears and what the interest adds up to.</p></div>${lines(L, 'Worked debt payoff example')}`;

  const mist = mistakes([
    { title: 'Closing your oldest card', why: 'It shortens your credit history and removes its limit, which raises utilization on the cards you keep.', fix: 'Keep old no-fee cards open; put a small recurring bill on them so the issuer does not close them for inactivity.' },
    { title: 'Carrying a balance to "build credit"', why: 'Paying interest does nothing for your score. On-time payments and low reported balances do.', fix: 'Use the card, pay the statement balance in full every month, and keep the reported balance low.' },
    { title: 'Maxing out a card you pay in full', why: 'The statement balance is usually what gets reported, so a card paid in full can still show high utilization.', fix: 'Pay most of the balance a few days before the statement closes.' },
    { title: 'Paying only the minimum', why: `On $5,000 at ${pct(cardInt, 2, true)}, a typical minimum takes ${duration(minp.months)} and ${money(minp.totalInterest)} of interest. ${money(p36)} a month clears it in three years.`, fix: 'Pay a fixed amount you choose, not the shrinking minimum the issuer prints.' },
    { title: 'Opening new accounts right before a big loan', why: 'Each application is a hard inquiry and lowers the average age of your accounts, just when a mortgage or auto lender is pricing you.', fix: 'Hold off on new cards for six months to a year before a major loan. Rate-shopping one mortgage or car loan within a short window counts as a single inquiry.' },
    { title: 'Never checking your reports', why: 'A 2012 FTC study found one in five consumers had an error on at least one of their three reports.', fix: 'Pull all three free at AnnualCreditReport.com and dispute errors directly with the bureau.' },
    { title: 'Co-signing a loan', why: 'You are fully responsible for the debt, and every late payment the other person makes lands on your report too.', fix: 'Only co-sign for an amount you could pay off yourself without strain.' },
    { title: 'Letting one bill slip past 30 days', why: 'One reported late payment can cost a strong score many points and stays for seven years.', fix: 'Turn on autopay for every minimum, then pay more by hand.' },
  ]);

  return {
    slug: 'credit',
    title: 'Credit scores and paying off debt, with the math shown | Moneywise',
    description: 'What moves a credit score, why utilization is measured on your statement date, the debt avalanche versus snowball race, and the true cost of minimum payments.',
    body: k.module({
      slug: 'credit',
      lede: 'What a credit score actually weighs, why paying in full can still show high utilization, which debt should get your extra money, and what paying only the minimum really costs.',
      today: [
        { label: 'Card APR, accounts paying interest', value: rate('TERMCBCCINTNS'), sub: asof('TERMCBCCINTNS') },
        { label: 'Card APR, all accounts', value: rate('TERMCBCCALLNS'), sub: asof('TERMCBCCALLNS') },
        { label: 'Average FICO score', value: '714', sub: 'spring 2026' },
        { label: 'Prime rate', value: rate('DPRIME'), sub: asof('DPRIME') },
      ],
      todaySrc: 'Federal Reserve G.19 and H.15 via FRED; FICO.',
      parts: [
        { id: 'what', short: 'What it is', title: 'What it is', html: what },
        { id: 'how', short: 'How it works', title: 'How it works', html: how },
        { id: 'try', short: 'Try it', title: 'Try it', html: tryIt, aside: 'Prints every step to the tape' },
        { id: 'example', short: 'Worked example', title: 'Worked example', html: example },
        { id: 'mistakes', short: 'Common mistakes', title: 'Common mistakes', html: mist },
      ],
      sources: ['myfico', 'fico-avg', 'g19', 'kellogg', 'card-act', 'acr', 'cfpb-margins'],
    }),
  };
};
