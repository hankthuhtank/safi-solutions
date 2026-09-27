import { rowsOf, viz, terms, bullets, steps, note, tbl, glossary } from './_util.mjs';

export default function football(o) {
  const S = o.sections;
  return {
    name: 'Football', plate: '01', tagline: 'Downs · formations · coverages', jump: 'coverage', jumpLabel: 'Jump to coverages',
    meta: 'American football explained visually: a to-scale 3D NFL field, animated plays, route trees, coverages, the 2026 kickoff and every term in plain English.',
    heroAlt: 'A 3D NFL stadium at night with an offense in shotgun trips facing a nickel defense, the blue line of scrimmage and the yellow line to gain.',
    lede: 'A game of **territory and possession**: four tries to gain ten yards, eleven players a side, and a chess match that restarts every play. Start with the words, see the field, then learn why each play is called.',
    facts: [['11 v 11', 'players on the field'], ['4 × 15:00', 'quarters · NFL'], ['100 YD', 'goal line to goal line'], ['4 DOWNS', 'to gain 10 yards'], ['TD 6', 'FG 3 · safety 2'], ['53⅓ YD', 'sideline to sideline']],
    periods: [
      { id: 'q1', code: 'Q1', name: 'The basics' },
      { id: 'q2', code: 'Q2', name: 'The offense' },
      { id: 'q3', code: 'Q3', name: 'The defense' },
      { id: 'q4', code: 'Q4', name: 'Game management' },
      { id: 'ot', code: 'OT', name: 'Game mode' }
    ],
    sections: [
      { id: 'words', period: 'q1', title: 'Start here: the words', short: 'Start here: the words', core: true,
        intro: 'Read this first. These are the words the rest of the page assumes you know, each one defined before it is used to explain anything harder.',
        blocks: [
          viz('football/anatomy', 'The field, to scale', 'NFL RULE 1 · TAP THE LAYERS', 'Every stripe has a job: yard lines every 5 yards, **hash marks** that set where each play starts, and **end zones** where points are scored. Dimensions follow the NFL Rulebook.'),
          terms(rowsOf(S[0]), 'Core vocabulary', '25 words used everywhere below')
        ] },
      { id: 'glance', period: 'q1', title: 'The game at a glance', short: 'The game at a glance',
        intro: S[1].intro,
        blocks: [
          viz('football/chains', 'Move the chains', 'DOWN & DISTANCE SIMULATOR', 'Run a drive yourself. The **blue line** is the line of scrimmage, the **yellow line** is the line to gain. These are the same lines you see on a TV broadcast.'),
          tbl(['Score', 'Points', 'How it happens'], [
            ['Touchdown', '<span class="num">6</span>', 'The ball is carried into, or caught in, the opponent’s end zone.'],
            ['Extra-point kick', '<span class="num">1</span>', 'After a touchdown. In the NFL the ball is snapped from the 15-yard line, making it a 33-yard kick.'],
            ['Two-point try', '<span class="num">2</span>', 'After a touchdown, run or pass it in from the 2-yard line instead of kicking.'],
            ['Field goal', '<span class="num">3</span>', 'Kicked through the uprights. Kick distance ≈ yards to the goal line + 17 (10-yard end zone + 7-yard hold).'],
            ['Safety', '<span class="num">2</span>', 'The offense is downed in its own end zone. The team that gave it up then free-kicks from its own 20.'],
            ['Defensive two-point return', '<span class="num">2</span>', 'The defense returns a blocked kick or turnover on a try all the way to the other end zone.']
          ], 'Scoring', 'NFL values'),
          terms(rowsOf(S[1], { edit: { 'Drive': 'One possession: every play from the moment a team gains the ball until it scores, punts, turns it over, or the half ends.' } }), 'The flow of a game', 'Twelve ideas'),
          bullets([
            ...S[1].bullets,
            'NFL games are four **15-minute quarters**. Each team gets **three timeouts per half**, and the clock stops automatically at the **two-minute warning** of each half.',
            'The offense must snap the ball before the **40-second play clock** expires (25 seconds after certain stoppages).',
            '**Overtime (regular season, since 2025):** one 10-minute period. Both teams get a possession unless the first one ends in a defensive score; if still tied, the game can end in a tie. Playoff overtime continues until there is a winner.'
          ], 'Game structure', 'Clock, timeouts, overtime'),
          note(S[1].note)
        ] },
      { id: 'offense-positions', period: 'q2', title: 'Offensive positions', short: 'Offensive positions',
        intro: 'Eleven players, three groups: the **offensive line** protects, the **backfield** handles the ball, and the **receivers** stretch the field. Tap any player to see the job.',
        blocks: [
          viz('football/offense', 'Who lines up where: offense', '11 PERSONNEL · SHOTGUN · TAP A PLAYER'),
          terms(rowsOf(S[2]), 'Jobs', 'Position by position')
        ] },
      { id: 'personnel', period: 'q2', title: 'Personnel and formations', short: 'Personnel & formations',
        intro: S[4].intro + ' The two-digit code counts **running backs** first, then **tight ends**; whatever is left of the five eligible players are wide receivers.',
        blocks: [
          viz('football/personnel', 'Personnel builder', 'CODE = RBs + TEs', 'Pick a package and watch the formation reshape. “11” = 1 back, 1 tight end, 3 receivers. It is the most common grouping in today’s NFL.'),
          terms(rowsOf(S[4]), 'Packages & shapes', 'The language on the sideline')
        ] },
      { id: 'runs', period: 'q2', title: 'The run game', short: 'Run families',
        intro: 'Every run is a blocking plan plus a path for the ball carrier. **Zone** runs block areas and let the back choose; **gap** runs (power, counter) pull linemen to build a wall at one hole.',
        blocks: [
          viz('football/runs', 'Run concepts, animated', 'BLOCKING + BALL-CARRIER PATH', 'Blue arrows are blocks, the yellow line is the ball carrier. Watch the pulling guard on **Power** and the unblocked end on the **Read option**.'),
          terms(rowsOf(S[5]), 'Run families', 'Fifteen concepts'),
          { type: 'table', table: S[5].table, heading: 'Why a run can work', sub: 'Read the defense first' }
        ] },
      { id: 'passing', period: 'q2', title: 'Routes and pass concepts', short: 'Routes & concepts',
        intro: 'A **route** is one receiver’s path. A **concept** combines routes so that one defender has to choose between two threats: whichever way he goes, the quarterback throws to the other.',
        blocks: [
          viz('football/routetree', 'The route tree', 'NUMBERED 1–9 · TAP A ROUTE', 'Most teams number routes so a whole play can be called in a few digits. Numbering varies by team; this is the classic tree.'),
          viz('football/concepts', 'Pass concepts in motion', 'READ ORDER SHOWN 1 → 2 → 3', 'Each concept is drawn against the coverage it is built to beat. The numbers show the quarterback’s read order.'),
          terms(rowsOf(S[6]), 'Routes & concepts', 'Twenty-seven entries')
        ] },
      { id: 'protection', period: 'q2', title: 'Pass protection', short: 'Pass protection',
        intro: 'More blockers means more time, but fewer receivers. Protection is the trade-off between the two.',
        blocks: [
          viz('football/protection', 'Protection counts', '5 · 6 · 7 MAN', 'Five blockers leave five receivers; seven blockers buy time for a deep shot with only three receivers out.'),
          terms(rowsOf(S[7])),
          bullets(S[7].bullets, 'Beating pressure', 'Rules of thumb')
        ] },
      { id: 'defense-positions', period: 'q3', title: 'Defensive positions', short: 'Defensive positions',
        intro: 'Three levels: **linemen** at the ball, **linebackers** behind them, **defensive backs** (cornerbacks and safeties) deepest. Packages swap linebackers for defensive backs as offenses spread out.',
        blocks: [
          viz('football/defense', 'Who lines up where: defense', 'BASE · NICKEL · DIME · TAP A PLAYER'),
          terms(rowsOf(S[3]), 'Jobs', 'Position by position')
        ] },
      { id: 'fronts', period: 'q3', title: 'Fronts, gaps and techniques', short: 'Fronts & gaps',
        intro: '**Gaps** are lettered from the center out (A, B, C, D). **Techniques** number where a defensive lineman lines up on a blocker. Together they describe a front in two words.',
        blocks: [
          viz('football/fronts', 'Gaps & techniques', 'LETTERS = GAPS · NUMBERS = ALIGNMENT', 'Choose a front to see which gaps each defender owns. In a **one-gap** front every gap has a defender assigned to it.'),
          terms(rowsOf(S[8]))
        ] },
      { id: 'coverage', period: 'q3', title: 'Coverage families', short: 'Coverage families',
        intro: S[9].intro + ' Man coverage follows people; zone coverage guards areas.',
        blocks: [
          viz('football/coverage', 'Coverage shells, animated', 'SNAP → DROPS → ZONES', 'Blue shapes are **deep** zones, yellow are **underneath** zones, red lines are **man** assignments. Watch how two-high shells rotate after the snap.'),
          terms(rowsOf(S[9])),
          { type: 'table', table: S[9].table, heading: 'Clues & answers', sub: 'What the quarterback looks for' }
        ] },
      { id: 'pressure', period: 'q3', title: 'Blitzes, pressure and run fits', short: 'Blitz & pressure',
        intro: 'Pressure is about **numbers and surprise**: send one more rusher than the protection can block, or rush four from places the offense did not expect.',
        blocks: [
          viz('football/pressure', 'Pressure packages', 'WHO RUSHES · WHO DROPS'),
          terms(rowsOf(S[10]))
        ] },
      { id: 'reading', period: 'q3', title: 'Reading the defense', short: 'Reading the defense',
        intro: S[11].intro,
        blocks: [
          viz('football/readdefense', 'Pre-snap to post-snap: an 8-step read', 'STEP THROUGH IT', 'This is the order quarterbacks (and good video-game players) use. Each step lights up what to look at.'),
          steps(S[11].bullets.map(b => b.replace(/^\d+\.\s*/, ''))),
          note(S[11].note)
        ] },
      { id: 'situations', period: 'q4', title: 'Situational football', short: 'Situational football',
        intro: 'The same play can be smart or reckless depending on **down, distance, field position, score and clock**.',
        blocks: [
          viz('football/zones', 'Field position zones', 'WHERE THE PLAYBOOK CHANGES', 'Coaches split the field into zones. Backed up, the priority is avoiding disaster; in the red zone the field compresses; in the high red zone it compresses even more.'),
          terms(rowsOf(S[12], { add: [{ term: 'Two-minute warning', desc: 'An automatic stoppage when two minutes remain in each half. It works like a free timeout for both teams.' }, { term: 'Kneel-down math', desc: 'Each kneel uses a snap plus up to 40 seconds of play clock. With no opposing timeouts, three kneels can run out roughly two minutes.' }] }))
        ] },
      { id: 'special-teams', period: 'q4', title: 'Special teams', short: 'Special teams',
        intro: 'Kicks trade possession for field position. The NFL rebuilt the kickoff in 2024 to bring returns back safely, and tweaked it again in 2025 and 2026.',
        blocks: [
          viz('football/kickoff', 'The dynamic kickoff (2026)', 'ALIGNMENT · LANDING ZONE · TOUCHBACK', 'Ten coverage players start on the receiving team’s 40 and cannot move until the ball lands or is touched. Kicks into the end zone come out to the **35**.'),
          terms(rowsOf(S[13], {
            edit: {
              'Kickoff': 'Starts each half and follows scores. Since 2024 the NFL uses the “dynamic kickoff”: the kicker is at his own 35, the other ten coverage players line up at the receiving team’s 40, and no one moves until the ball hits the ground or a player in the landing zone.',
              'Onside kick': 'A short kick the kicking team hopes to recover. It must be declared in advance and uses a special alignment. **Since 2026 it can be declared at any point in the game** (previously only in the fourth quarter).'
            },
            add: [
              { term: 'Landing zone', desc: 'The area between the receiving team’s goal line and 20-yard line. A kickoff must land here (or in the end zone) to be a legal, returnable kick.', after: 'Kickoff' },
              { term: 'Touchback (kickoff)', desc: 'A kickoff that goes into the end zone and is downed there. Since 2025 the ball comes out to the **35-yard line**; a kick that lands short of the landing zone is spotted at the 40.', after: 'Landing zone', flag: 'SINCE 2025' }
            ],
            flag: { 'Onside kick': 'NEW 2026' }
          }))
        ] },
      { id: 'penalties', period: 'q4', title: 'Penalties and officiating', short: 'Penalties',
        intro: 'A yellow flag means a foul. Most penalties move the ball 5, 10 or 15 yards; some also award an **automatic first down** or cost a **loss of down**.',
        blocks: [
          tbl(['Foul', 'Penalty', 'Notes'], [
            ['False start', '<span class="num">5 YD</span>', 'Offense moves before the snap. The play never starts.'],
            ['Offside / neutral-zone infraction', '<span class="num">5 YD</span>', 'A defender is across the line at the snap, or draws an offensive player into flinching.'],
            ['Delay of game', '<span class="num">5 YD</span>', 'The play clock hits zero before the snap.'],
            ['Too many men on the field', '<span class="num">5 YD</span>', 'More than 11 players in the formation at the snap.'],
            ['Holding (offense)', '<span class="num">10 YD</span>', 'Grabbing or restricting a defender to prevent a tackle or pass rush.'],
            ['Holding (defense)', '<span class="num">5 YD + AUTO 1ST</span>', 'Illegally restricting a receiver or blocker.'],
            ['Illegal contact', '<span class="num">5 YD + AUTO 1ST</span>', 'Contact with a receiver more than 5 yards downfield before the pass is thrown.'],
            ['Defensive pass interference', '<span class="num">SPOT + AUTO 1ST</span>', 'Ball placed where the foul happened. In the end zone it goes to the 1-yard line.'],
            ['Offensive pass interference', '<span class="num">10 YD</span>', 'A receiver pushes off or blocks a defender while the pass is in the air.'],
            ['Intentional grounding', '<span class="num">LOSS OF DOWN + 10 YD</span>', 'Or the spot of the foul if that is worse; a safety if it happens in the end zone.'],
            ['Roughing the passer', '<span class="num">15 YD + AUTO 1ST</span>', 'Illegal hit on a quarterback in the act of passing or after the throw.'],
            ['Face mask / unnecessary roughness', '<span class="num">15 YD</span>', 'Personal fouls. When committed by the defense, also an automatic first down.'],
            ['Unsportsmanlike conduct / taunting', '<span class="num">15 YD</span>', 'Two in one game means an ejection.']
          ], 'Common penalties', 'NFL enforcement'),
          terms(rowsOf(S[14]), 'Officiating words', 'What the referee is saying'),
          note('**2026 officiating note:** league officials in New York may now advise on-field referees about disqualifications for flagrant football and non-football acts, and a flag can be added if one was not thrown.')
        ] },
      { id: 'game-mode', period: 'ot', title: 'Madden and football-game mode', short: 'Game mode',
        intro: 'Video games reward the same logic as the real sport. Learn the thinking once and it carries across every edition.',
        blocks: [
          bullets(S[15].bullets, 'Play smarter', 'Transferable habits'),
          note(S[15].note)
        ] }
    ],
    updatesIntro: 'Rules move every spring. These changes were approved at the NFL Annual League Meeting and apply to the 2026 season, alongside the 2025 changes that are still new to most fans.',
    updates: [
      { when: '2026 season', title: 'Onside kicks at any time', text: 'A team may now declare an onside kick at any point in the game. Previously it was allowed only in the fourth quarter. It still has to be declared, with the special onside alignment.' },
      { when: '2026 season', title: 'Kickoff setup-zone tweak', text: 'The receiving team gets more flexibility in how many players stand off the restraining line inside the 5-yard setup zone, with at least one player required near each sideline.' },
      { when: '2026 season', title: 'Replay help on ejections', text: 'The league’s officiating department can consult with on-field referees on disqualifications for flagrant football and non-football acts, and a flag can be thrown if one was missed.' },
      { when: 'Since 2025', title: 'Touchbacks on kickoffs to the 35', text: 'The dynamic kickoff was made permanent and a kickoff into the end zone that becomes a touchback now puts the ball on the 35-yard line (up from the 30) to encourage returns.' },
      { when: 'Since 2025', title: 'Both teams get the ball in overtime', text: 'Regular-season overtime now matches the playoffs: both teams get a possession unless the first ends in a defensive score. The period stays 10 minutes, so games can still end tied.' }
    ],
    glossary: glossary(o, {
      add: [
        { term: 'Landing zone', desc: 'Area between the receiving team’s goal line and 20-yard line where a kickoff must land.' },
        { term: 'Setup zone', desc: 'The 5-yard band between the receiving team’s 30 and 35 where most of the return team lines up on a kickoff.' },
        { term: 'Line to gain', desc: 'The yard line the offense must reach for a new first down, the yellow line on TV.' },
        { term: 'Hash marks', desc: 'The rows of short lines (70 ft 9 in from each sideline in the NFL) that mark where the ball is placed for the next play.' },
        { term: 'Personnel', desc: 'Which types of players are on the field, written RBs then TEs (e.g. 11 = 1 RB, 1 TE, 3 WR).' },
        { term: 'Technique', desc: 'A number describing exactly where a defensive lineman aligns on an offensive lineman.' }
      ],
      edit: { 'Touchback': 'Ball becomes dead behind the goal line and is placed at a rule-defined spot: the 35 on kickoffs (since 2025), the 20 on punts.' }
    }),
    sources: [
      ['2026 NFL Rulebook', 'https://operations.nfl.com/rules-officiating/2026-nfl-rulebook'],
      ['NFL Football Operations: Football terms', 'https://operations.nfl.com/rules-officiating/nfl-football-basics/football-terms'],
      ['NFL: 2026 rule changes approved (Annual League Meeting)', 'https://www.nfl.com/news/'],
      ['NFL: Dynamic kickoff made permanent, touchbacks to the 35', 'https://www.nfl.com/news/nfl-owners-vote-to-make-dynamic-kickoff-permanent-adjust-ball-spot-on-touchbacks-to-35-yard-line'],
      ['NFL Football Operations: Rulebook archive', 'https://operations.nfl.com/the-rules/nfl-rulebook']
    ]
  };
}
