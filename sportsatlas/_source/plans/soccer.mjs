import { rowsOf, viz, terms, bullets, note, tbl, glossary } from './_util.mjs';

export default function soccer(o) {
  const S = o.sections;
  return {
    name: 'Soccer', plate: '04', tagline: 'Formations · pressing · buildup', jump: 'offside', jumpLabel: 'Jump to offside',
    meta: 'Soccer explained visually: a 3D stadium, formations, a drag-and-test offside checker, pressing blocks, attacking patterns, the 2026/27 Laws of the Game and every term in plain English.',
    heroAlt: 'A 3D football stadium at night with a 4-3-3 facing a 4-4-2 mid-block and a switch-of-play pass tracer.',
    lede: 'Two teams of eleven, one ball and only one rule most people argue about. Soccer is a game of **space**: creating it with the ball, taking it away without it.',
    facts: [['11 v 11', 'including goalkeepers'], ['2 × 45:00', 'plus added time'], ['105 × 68', 'metres · FIFA standard'], ['7.32 M', 'goal width'], ['3–5 SUBS', 'by competition'], ['OFFSIDE', 'Law 11']],
    periods: [
      { id: 'h1', code: '1H', name: 'The basics' },
      { id: 'h2', code: '2H', name: 'Tactics' },
      { id: 'et', code: 'ET', name: 'Laws & transitions' },
      { id: 'pk', code: 'PENS', name: 'Set pieces & stats' }
    ],
    sections: [
      { id: 'words', period: 'h1', title: 'Start here: the words', short: 'Start here: the words', core: true,
        intro: 'Read this first. These are the words the rest of the page assumes you know.',
        blocks: [
          viz('soccer/anatomy', 'The pitch, to scale', 'IFAB LAW 1 · TAP THE LAYERS', 'Every line is set by Law 1: an **18-yard (16.5 m) penalty area**, a **6-yard (5.5 m) goal area**, the penalty mark **11 m** out and a **9.15 m** circle that keeps opponents away at restarts.'),
          terms(rowsOf(S[0]), 'Core vocabulary', '21 words used everywhere below')
        ] },
      { id: 'glance', period: 'h1', title: 'The game at a glance', short: 'The game at a glance',
        intro: 'Get the whole ball over the opponent’s goal line, between the posts and under the bar. The clock runs continuously; the referee adds time at the end of each half for stoppages.',
        blocks: [terms(rowsOf(S[1])), bullets([
          'Matches are two 45-minute halves plus added time. Knockout games may add two 15-minute periods of extra time, then penalties.',
          'Only the goalkeeper may handle the ball, and only inside his own penalty area.',
          'A player is sent off with a red card or a second yellow card; the team plays short-handed.',
          'Most top competitions allow five substitutions in three windows (plus extra concussion substitutes).'
        ], 'The frame', 'Time, cards, substitutes')] },
      { id: 'positions', period: 'h1', title: 'Positions and role families', short: 'Positions & roles',
        intro: 'Players are often called by number: the **6** screens the defense, the **8** runs box to box, the **10** creates, the **9** finishes.',
        blocks: [terms(rowsOf(S[2]))] },
      { id: 'formations', period: 'h2', title: 'Formations and what they imply', short: 'Formations',
        intro: 'A formation is written back to front, not counting the goalkeeper: a 4-3-3 has four defenders, three midfielders and three forwards.',
        blocks: [viz('soccer/formations', 'Formation board', 'TAP A PLAYER · SWITCH SHAPES', 'The same eleven players can defend in one shape and attack in another; a formation is the starting reference, not a fixed map.'), terms(rowsOf(S[3])), note(S[3].note)] },
      { id: 'attack', period: 'h2', title: 'Attacking principles', short: 'Attacking principles',
        intro: 'Attacks stretch the defense wide and deep, then exploit the gaps that open between defenders.',
        blocks: [
          viz('soccer/lanes', 'The five lanes, thirds and zone 14', 'HOW COACHES SPLIT THE PITCH', 'Modern coaching divides the pitch into five vertical lanes. The **half-spaces** between the center and the wings are the most valuable places to receive the ball.'),
          viz('soccer/patterns', 'Attacking patterns, animated', 'OVERLAP · UNDERLAP · THIRD MAN · SWITCH · CUTBACK · ONE-TWO'),
          terms(rowsOf(S[4]))
        ] },
      { id: 'buildup', period: 'h2', title: 'Buildup and progression', short: 'Buildup',
        intro: 'Buildup is how a team moves the ball from its goalkeeper into the attacking half under pressure.',
        blocks: [terms(rowsOf(S[5]))] },
      { id: 'defending', period: 'h2', title: 'Defending and block structures', short: 'Defending & blocks',
        intro: 'Out of possession, teams choose **where** to defend: high up the pitch, in the middle, or deep near their own goal.',
        blocks: [viz('soccer/blocks', 'High press, mid block, low block', 'THE SAME 4-4-2, THREE HEIGHTS', 'The shape stays compact — roughly 35 m from front to back — and slides up and down the pitch as a unit.'), terms(rowsOf(S[6]))] },
      { id: 'transitions', period: 'et', title: 'Transitions', short: 'Transitions',
        intro: 'The seconds after the ball changes hands are the most chaotic — and most dangerous — of the game.',
        blocks: [terms(rowsOf(S[7]))] },
      { id: 'offside', period: 'et', title: 'Offside, fouls, cards and restarts', short: 'Offside & fouls',
        intro: 'Offside in one sentence: when a teammate plays the ball to you, you are offside if you are in the opponent’s half and nearer the goal line than **both the ball and the second-last defender** — and you then get involved in play.',
        blocks: [
          viz('soccer/offside', 'Offside checker', 'DRAG THE PLAYERS', 'Drag the attacker, the defenders and the passer. Any part of the head, body or feet counts; hands and arms do not. Level is onside.'),
          viz('soccer/restarts', 'The new countdowns (2025/26 → 2026/27)', 'TIME LIMITS AT RESTARTS', 'IFAB has added visible countdowns to cut time-wasting. Pick a situation to see the limit and what happens if it is broken.'),
          terms(rowsOf(S[8]))
        ] },
      { id: 'set-pieces', period: 'pk', title: 'Set pieces', short: 'Set pieces',
        intro: 'Restarts — corners, free kicks, throw-ins and penalties — produce roughly a quarter to a third of goals in top leagues.',
        blocks: [viz('soccer/setpieces', 'Set-piece setups', 'CORNERS · WALLS · PENALTIES'), terms(rowsOf(S[9]))] },
      { id: 'matchups', period: 'pk', title: 'Common tactical matchups', short: 'Tactical matchups',
        intro: 'Tactics are answers. Here is what teams usually do against common opponent plans.',
        blocks: [{ type: 'table', table: S[10].table, heading: 'If they… you…', sub: 'Counter-strategies' }] },
      { id: 'stats', period: 'pk', title: 'Statistics and analysis terms', short: 'Statistics',
        intro: 'Goals are rare, so analysts measure the chances that lead to them.',
        blocks: [terms(rowsOf(S[11], { edit: { 'xG': 'Expected goals: the probability that a shot becomes a goal, based on thousands of similar shots (distance, angle, body part, type of assist). A penalty is worth about 0.76–0.79 xG.' } }))] },
      { id: 'game-mode', period: 'pk', title: 'EA SPORTS FC and soccer-game mode', short: 'Game mode',
        intro: 'The same spacing, patience and transition logic wins in video games.',
        blocks: [bullets(S[12].bullets, 'Play smarter', 'Transferable habits'), note(S[12].note)] }
    ],
    updatesIntro: 'The International Football Association Board (IFAB) updates the Laws every year, effective 1 July. These are the recent changes you will see in 2026.',
    updates: [
      { when: '2026/27 Laws', title: 'Five-second countdown on throw-ins and goal kicks', text: 'If a team deliberately delays a throw-in or goal kick, the referee shows a visible five-second countdown. Too slow: the throw-in goes to the opponents, or the goal kick becomes a **corner kick** for them.' },
      { when: '2026/27 Laws', title: '10 seconds to leave when substituted', text: 'A substituted player has 10 seconds to leave the field. If he takes longer, his replacement cannot enter until the first stoppage after one minute has passed.' },
      { when: '2026/27 Laws', title: 'One minute off after on-field treatment', text: 'A player treated on the field for an injury (or who causes play to stop for one) must leave and stay off for one minute after the restart.' },
      { when: '2026/27 Laws', title: 'More for VAR', text: 'The video assistant may now intervene on a red card that came from a clearly wrong second yellow, on mistaken identity, and on a clearly incorrectly awarded corner kick. Competitions may also punish a player who covers his mouth in a confrontation with a red card.' },
      { when: '2025/26 Laws', title: 'The goalkeeper’s eight seconds', text: 'A goalkeeper holding the ball for more than **eight seconds** concedes a **corner kick** (previously an indirect free kick after six seconds). The referee counts down the last five visibly.' },
      { when: '2025/26 Laws', title: 'Captain-only zone', text: 'Competitions may allow only the team captain to approach the referee about a decision.' }
    ],
    glossary: glossary(o, { add: [
      { term: 'Second-last defender', desc: 'The opponent who, with the goalkeeper usually being last, sets the offside line.' },
      { term: 'Offside line', desc: 'An imaginary line through the second-last defender (or the ball, if it is nearer the goal line).' },
      { term: 'Added time', desc: 'Time added at the end of each half for stoppages such as substitutions, injuries and VAR checks.' },
      { term: 'VAR', desc: 'Video assistant referee: reviews clear and obvious errors in goals, penalties, direct red cards and mistaken identity (and, since 2026/27, some second yellows and corners).' },
      { term: 'Eight-second rule', desc: 'Since 2025/26 a goalkeeper holding the ball for more than 8 seconds concedes a corner kick.' },
      { term: 'Half-space', desc: 'One of the two vertical channels between the center of the pitch and the wings.' }
    ] }),
    sources: [
      ['IFAB — Laws of the Game (latest)', 'https://www.theifab.com/laws/latest/'],
      ['IFAB — Law changes 2026/27', 'https://www.theifab.com/law-changes/latest/'],
      ['IFAB — Law 11: Offside', 'https://www.theifab.com/laws/latest/offside/'],
      ['IFAB — Law 1: The Field of Play', 'https://www.theifab.com/laws/latest/the-field-of-play/'],
      ['The FA — 2026/27 law changes explained', 'https://www.thefa.com/football-rules-governance/lawsandrules/laws/football-11-11/law-changes-explained'],
      ['Concacaf — Implementation of the 2026/27 amendments', 'https://www.concacaf.com/competitions/concacaf/news/concacaf-confirms-implementation-of-the-ifab-2026-27-laws-of-the-game-amendments']
    ]
  };
}
