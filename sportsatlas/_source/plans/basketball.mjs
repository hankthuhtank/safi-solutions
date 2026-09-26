import { rowsOf, viz, terms, bullets, note, tbl, glossary } from './_util.mjs';

export default function basketball(o) {
  const S = o.sections;
  return {
    name: 'Basketball', plate: '03', tagline: 'Spacing · actions · coverages', jump: 'pnr', jumpLabel: 'Jump to pick-and-roll',
    meta: 'Basketball explained visually: a 3D NBA arena, shot-value math, spacing, screens, animated pick-and-roll coverages, zone defenses and every term in plain English.',
    heroAlt: 'A 3D NBA arena with a five-out pick-and-roll set and a shot tracer arcing toward the rim.',
    lede: 'Five players, a 24-second clock and one question on every trip: **how do we get a good shot?** Offenses answer with spacing and screens; defenses answer with help and rotations.',
    facts: [['5 v 5', 'players on the court'], ['4 × 12:00', 'quarters · NBA'], ['24 SEC', 'shot clock'], ['10 FT', 'rim height'], ["23' 9\"", 'three-point arc'], ['94 × 50', 'court in feet']],
    periods: [
      { id: 'q1', code: 'Q1', name: 'The basics' },
      { id: 'q2', code: 'Q2', name: 'The offense' },
      { id: 'q3', code: 'Q3', name: 'The defense' },
      { id: 'q4', code: 'Q4', name: 'Clock, rules & stats' },
      { id: 'ot', code: 'OT', name: 'Game mode' }
    ],
    sections: [
      { id: 'words', period: 'q1', title: 'Start here: the words', short: 'Start here: the words', core: true,
        intro: 'Read this first. These are the words the rest of the page assumes you know.',
        blocks: [
          viz('basketball/anatomy', 'The court, to scale', 'NBA RULE 1 · TAP THE LAYERS', 'The three-point line is **23 ft 9 in** from the basket at the top and **22 ft** in the corners — which is why the corner three is the shortest, most valuable shot outside the paint.'),
          terms(rowsOf(S[0]), 'Core vocabulary', '21 words used everywhere below')
        ] },
      { id: 'glance', period: 'q1', title: 'The game at a glance', short: 'The game at a glance',
        intro: 'Score more than the other team in four 12-minute quarters. Every possession ends in a shot, a turnover or a foul — so efficiency per possession is everything.',
        blocks: [
          viz('basketball/shotvalue', 'Why the three changed everything', 'POINTS PER SHOT', 'A shot’s value is its make rate times its points. Hitting **36% of threes is worth the same as 54% of twos** — and very few two-point zones besides the rim beat that.'),
          terms(rowsOf(S[1])),
          bullets([...S[1].bullets,
            'After an offensive rebound that hits the rim, the NBA shot clock resets to **14 seconds**, not 24.',
            'The offense has **8 seconds** to get the ball past half court, and cannot return it to the backcourt afterward.',
            'Each team has **7 timeouts** per game. Overtime periods are 5 minutes.'
          ], 'The clocks', 'NBA timing rules')
        ] },
      { id: 'positions', period: 'q2', title: 'Positions and modern roles', short: 'Positions & roles',
        intro: 'Positions are numbered 1–5, but today’s game thinks in roles: who handles, who shoots, who screens and who protects the rim.',
        blocks: [viz('basketball/positions', 'The five spots', 'TRADITIONAL · MODERN · TAP A PLAYER'), terms(rowsOf(S[2]))] },
      { id: 'spacing', period: 'q2', title: 'Spacing and offensive principles', short: 'Spacing',
        intro: 'Spacing is the offense’s most important weapon: spread five threats so one defender can never guard two of them.',
        blocks: [viz('basketball/spacing', 'Good spacing vs. bad spacing', 'WATCH THE HELP DEFENDERS', 'With five players spread out, a drive forces a defender to leave a shooter. When the floor is cramped, one helper can guard two people at once.'), terms(rowsOf(S[3]))] },
      { id: 'actions', period: 'q2', title: 'Screens and common actions', short: 'Screens & actions',
        intro: 'A **screen** is a legal wall: the screener stands still and a teammate uses him to shake a defender. Almost every NBA play is built from a handful of these.',
        blocks: [viz('basketball/actions', 'The actions, animated', 'PICK · POP · HANDOFF · PIN-DOWN · FLARE · SPAIN'), terms(rowsOf(S[4]))] },
      { id: 'systems', period: 'q2', title: 'Offensive systems and structures', short: 'Offensive systems',
        intro: S[5].intro || 'Systems organize spacing and actions into a repeatable plan.',
        blocks: [terms(rowsOf(S[5]))] },
      { id: 'defense', period: 'q3', title: 'Defense: base concepts', short: 'Defense basics',
        intro: 'Good defense is five players moving on a string: pressure the ball, **help** on drives, then **rotate** back to shooters.',
        blocks: [terms(rowsOf(S[6]))] },
      { id: 'pnr', period: 'q3', title: 'Pick-and-roll coverages', short: 'Pick-and-roll coverages',
        intro: 'The pick-and-roll is the most common play in the NBA, so every defense needs a plan for it. Each coverage gives something up — the question is what.',
        blocks: [viz('basketball/pnr', 'Six ways to guard the pick-and-roll', 'ANIMATED COVERAGES', 'Red is the defense. Watch where the **big man’s defender** goes — that choice defines the coverage.'), terms(rowsOf(S[7]))] },
      { id: 'zones', period: 'q3', title: 'Zone and special defenses', short: 'Zone defenses',
        intro: 'In a zone, defenders guard areas instead of players. NBA rules limit how long a defender can sit in the paint (defensive three seconds), so zones there are rarer than in college.',
        blocks: [viz('basketball/zones', 'Zone shapes and their gaps', '2-3 · 3-2 · 1-3-1 · BOX-AND-ONE'), terms(rowsOf(S[8]))] },
      { id: 'situations', period: 'q4', title: 'Transition, rebounding and situations', short: 'Situations',
        intro: 'The end of each quarter is a math problem with a clock attached.',
        blocks: [viz('basketball/clock', 'The two-for-one', 'SET THE CLOCK', 'Get the ball with about 30–40 seconds left and you can take two shots to the opponent’s one. Slide the clock to see the plan.'), terms(rowsOf(S[9]))] },
      { id: 'fouls', period: 'q4', title: 'Fouls, violations and officiating', short: 'Fouls & violations',
        intro: 'Fouls are illegal contact; violations are rule breaks without contact (like traveling). Fouls add up — for players and for teams.',
        blocks: [
          tbl(['Rule', 'NBA standard', 'What it means'], [
            ['Personal fouls', '<span class="num">6 = OUT</span>', 'A player’s sixth foul disqualifies him for the rest of the game.'],
            ['Team fouls — bonus', '<span class="num">5TH FOUL / QTR</span>', 'From a team’s fifth foul in a quarter (second in the last two minutes), common fouls send the opponent to the line.'],
            ['Three seconds', '<span class="num">3 SEC</span>', 'Offensive players can’t stay in the lane more than 3 seconds; defenders can’t either unless actively guarding someone.'],
            ['Backcourt / 8 seconds', '<span class="num">8 SEC</span>', 'Get the ball over half court in 8 seconds and don’t bring it back.'],
            ['Shot clock', '<span class="num">24 / 14 SEC</span>', 'A shot must hit the rim before it expires; offensive rebounds off the rim reset it to 14.'],
            ['Flagrant 1 / 2', '<span class="num">FT + BALL</span>', 'Unnecessary (1) or unnecessary and excessive (2) contact. A flagrant 2 is an ejection.'],
            ['Coach’s challenge', '<span class="num">1 (+1)</span>', 'One challenge per game; a team that wins its first gets a second.']
          ], 'Key numbers', 'NBA rulebook'),
          terms(rowsOf(S[10])),
          note('**2025–26 point of emphasis — the “high-five” rule:** contact with a shooter’s hand, wrist or arm on the follow-through, after the ball is released, is now called a foul.')
        ] },
      { id: 'stats', period: 'q4', title: 'Basketball analytics and stats', short: 'Analytics',
        intro: 'Points per game depends on pace. Modern stats measure **efficiency per possession** and per shot.',
        blocks: [viz('basketball/stats', 'Shooting-efficiency calculator', 'FG% · eFG% · TS%'), terms(rowsOf(S[11], { edit: { 'eFG%': 'Effective field-goal percentage: (FGM + 0.5 × 3PM) ÷ FGA. Gives threes their extra value.', 'TS%': 'True shooting: points ÷ (2 × (FGA + 0.44 × FTA)). Folds threes and free throws into one efficiency number.' } }))] },
      { id: 'game-mode', period: 'ot', title: 'NBA 2K and basketball-game mode', short: 'Game mode',
        intro: 'The same spacing and pick-and-roll reads win in video games.',
        blocks: [bullets(S[12].bullets, 'Play smarter', 'Transferable habits'), note(S[12].note)] }
    ],
    updatesIntro: 'The NBA adjusts its rules a little every year. These are the changes in force for the 2025–26 season and approved for 2026–27.',
    updates: [
      { when: '2025–26 season', title: 'The “heave rule”', text: 'A shot from **36 feet or more** in the last three seconds of the first, second or third quarter now counts as a team shot attempt, not the player’s — so players stop avoiding end-of-quarter heaves to protect their percentages.' },
      { when: '2025–26 season', title: 'Faster coach’s challenges', text: 'After a challenged out-of-bounds call, the Replay Center official (not the on-court crew chief) decides whether a nearby foul should have been called.' },
      { when: '2025–26 season', title: '“High-five” fouls', text: 'Officials are calling follow-through contact on a shooter’s hand, wrist or arm after release as a foul.' },
      { when: '2026–27 season', title: 'NBA Cup semifinals go home', text: 'The Emirates NBA Cup semifinals move to the higher seed’s arena; only the championship stays at a neutral site.' },
      { when: '2027 Draft', title: 'The “3-2-1” lottery', text: 'Approved in 2026 to discourage tanking: the lottery expands from 14 to 16 teams and flattens the odds among non-playoff teams.' }
    ],
    glossary: glossary(o, { add: [
      { term: 'Heave rule', desc: 'Since 2025–26, shots from 36+ feet in the last 3 seconds of the first three quarters count as team attempts.' },
      { term: 'Two-for-one', desc: 'Shooting early late in a quarter so your team gets two possessions to the opponent’s one.' },
      { term: 'Points per shot', desc: 'Make rate × point value. A 36% three and a 54% two are both worth 1.08.' },
      { term: 'Corner three', desc: 'The three-pointer from the corner, only 22 feet from the rim — the shortest three on the floor.' },
      { term: 'Bonus', desc: 'After a team’s fifth foul in a quarter (second in the last two minutes), the opponent shoots free throws on common fouls.' }
    ] }),
    sources: [
      ['NBA Official Rulebook', 'https://official.nba.com/rulebook/'],
      ['NBA Rule 1 — Court dimensions & equipment', 'https://official.nba.com/rule-no-1-court-dimensions-equipment/'],
      ['NBA Rule 12 — Fouls and penalties', 'https://official.nba.com/rule-no-12-fouls-and-penalties/'],
      ['NBA — Rule changes for 2025–26', 'https://www.nba.com/news/'],
      ['NBA — Board of Governors approves new Draft Lottery system', 'https://www.nba.com/news/nba-board-governors-approve-new-draft-lottery-system'],
      ['NBA Stats — Shot zone league averages', 'https://www.nba.com/stats/players/shooting']
    ]
  };
}
