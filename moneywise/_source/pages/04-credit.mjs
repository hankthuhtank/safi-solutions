// Credit & debt: the payoff race, four cards, five costly mistakes.
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
  const { t, box, group, lines, rate, asof, val } = k;
  const D = DEBTS.map(d => ({ ...d, apr: d.apr / 100 }));
  const av = calc.payoffPlan({ debts: D, budget: BUDGET, strategy: 'avalanche' });
  const sb = calc.payoffPlan({ debts: D, budget: BUDGET, strategy: 'snowball' });
  const cardInt = val('TERMCBCCINTNS') / 100;
  const minp = calc.minimumPayoff({ balance: 5000, apr: cardInt, percent: 0.01, plusInterest: true, floor: 35 });
  const p36 = calc.payment(5000, cardInt, 36);

  const debtBoxes = DEBTS.map((d, i) => group(d.name) +
    box({ k: `b${i}`, label: 'Balance', value: d.balance, min: 0, max: 40000, step: 50 }) +
    box({ k: `r${i}`, label: 'Rate', type: 'pct', value: d.apr, min: 0, max: 36, step: 0.25, dp: 2 }) +
    box({ k: `m${i}`, label: 'Minimum', value: d.min, min: 0, max: 1500, step: 5 })).join('');

  const hero = { id: 'tool-race', label: 'Pay off your debts, two ways', cols: 3, intro: 'Same debts, same monthly budget. Which order finishes cheaper?',
    boxes: box({ k: 'budget', label: 'Monthly budget for all debts', value: BUDGET, min: 100, max: 5000, step: 25, wide: true }),
    more: debtBoxes, moreLabel: 'Your debts' };

  const card = (i, l, s) => group(`Card ${i + 1}`) + box({ k: `l${i}`, label: 'Limit', value: l, min: 0, max: 50000, step: 100 }) + box({ k: `s${i}`, label: 'Statement balance', value: s, min: 0, max: 50000, step: 50 });
  const more = [
    { id: 'tool-util', label: 'Utilization', hint: 'What the bureaus see', cols: 2, intro: 'Your score sees the balance on each statement, not what you owe after paying.',
      boxes: card(0, 5000, 2000) + card(1, 8000, 450), more: card(2, 2500, 0), moreLabel: 'Add a third card' },
    { id: 'tool-min', label: 'Minimum payment trap', hint: 'What "minimum" really costs', intro: 'Paying only the minimum, next to a fixed payment that clears it in three years.',
      boxes:
        box({ k: 'balance', label: 'Card balance', value: 5000, min: 100, max: 40000, step: 100 }) +
        box({ k: 'apr', label: 'Card rate', type: 'pct', value: Math.round(cardInt * 10000) / 100, min: 0, max: 36, step: 0.05, live: 'TERMCBCCINTNS', dp: 2 }),
      more:
        box({ k: 'pct', label: 'Minimum: % of balance', type: 'pct', value: 1, min: 0.5, max: 5, step: 0.25, dp: 2 }) +
        box({ k: 'floor', label: 'Minimum at least', value: 35, min: 0, max: 100, step: 5 }) +
        box({ k: 'plusInt', label: 'Plus that month\'s interest (most issuers)', type: 'check', value: true, wide: true }) },
  ];

  const cards = [
    { big: '35%', line: 'of a FICO score is paying on time. The biggest piece.',
      back: 'Then 30% amounts owed, 15% length of history, 10% new credit, 10% mix. Income and savings aren\'t in it. A payment 30 days late can stay seven years.' },
    { big: 'Under 10%', line: 'of your limits: the card balances top scorers report.',
      back: 'Issuers usually report your statement balance, even if you pay in full later. Pay most of it a few days before the statement closes.' },
    { big: `${Math.round(minp.months / 12)} years`, line: `to clear $5,000 paying only the minimum at ${pct(cardInt, 2, true)}.`,
      back: `That costs ${money(minp.totalInterest)} in interest. Paying ${money(p36)} a month clears it in three years instead.` },
    { big: '1 in 5', line: 'people have an error on at least one credit report.',
      back: 'An FTC study found it. All three reports are free every week at AnnualCreditReport.com. Dispute errors with the bureau directly.' },
  ];

  const slips = [
    { title: 'Paying only the minimum', cost: money(minp.totalInterest), fix: `That's the interest on $5,000. Pay a fixed amount instead: ${money(p36)} a month clears it in three years.` },
    { title: 'Carrying a balance to “build credit”', cost: `${money(5000 * cardInt)}/yr`, fix: `Interest does nothing for your score. Pay the ${t('statement-balance', 'statement balance')} in full every month.` },
    { title: 'Letting one bill go 30 days late', cost: '7 years', fix: 'That is how long it can stay on your report. Put every minimum on autopay, then pay more by hand.' },
    { title: 'Closing your oldest card', cost: 'score drop', fix: `It shortens your history and raises ${t('utilization')}. Keep no-fee cards open with a small bill on autopay.` },
    { title: 'Opening new cards before a big loan', cost: 'higher rate', fix: `Each application is a ${t('hard-inquiry', 'hard inquiry')}. Wait 6 to 12 months before a mortgage or car loan.` },
  ];

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
  const example = `<p>A typical mix of debts and one monthly budget. Both plans finish the same month; the snowball wins a debt sooner and costs a little more.</p>${lines(L, 'Worked debt payoff example')}`;

  return {
    slug: 'credit',
    title: 'Credit and debt: what to pay first | Moneywise',
    description: 'Which debt to pay first (avalanche versus snowball), what really moves a credit score, why utilization is read on your statement date, and what minimum payments cost.',
    body: k.topic({
      slug: 'credit',
      sub: 'Which debt to pay first, and what really moves your score.',
      chip: `Average card rate when you carry a balance <b>${rate('TERMCBCCINTNS')}</b> <small>${asof('TERMCBCCINTNS')}</small>`,
      hero, cards, slips, more, example,
      sources: ['myfico', 'fico-avg', 'g19', 'kellogg', 'card-act', 'acr', 'cfpb-margins'],
    }),
  };
};
