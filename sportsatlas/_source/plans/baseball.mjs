import { rowsOf, viz, terms, bullets, steps, note, tbl, glossary } from './_util.mjs';

export default function baseball(o) {
  const S = o.sections;
  return {
    name: 'Baseball', plate: '02', tagline: 'Pitching · hitting · fielding', jump: 'situations', jumpLabel: 'Jump to strategy',
    meta: 'Baseball explained visually: a 3D ballpark, the 2026 ABS strike zone, pitch movement, force plays, run expectancy and every term in plain English.',
    heroAlt: 'A 3D major-league ballpark at night seen from behind home plate, with the defense in position and a batted-ball tracer heading to right-center.',
    lede: 'A duel repeated about 150 times a game: **pitcher against hitter**, with eight fielders behind one and the scoreboard behind the other. Learn the count and the bases, and every pitch starts to mean something.',
    facts: [['9 v 1', 'fielders vs. the batter'], ['9 INN', 'three outs per half'], ['90 FT', 'between the bases'], ["60' 6\"", 'rubber to home plate'], ['4 BALLS', 'walk · 3 strikes out'], ['ABS', 'challenges · new in 2026']],
    periods: [
      { id: 'i1', code: '1ST', name: 'The basics' },
      { id: 'i4', code: '4TH', name: 'Pitcher vs. hitter' },
      { id: 'i7', code: '7TH', name: 'Defense & baserunning' },
      { id: 'x', code: '10TH', name: 'Strategy & stats' }
    ],
    sections: [
      { id: 'words', period: 'i1', title: 'Start here: the words', short: 'Start here: the words', core: true,
        intro: 'Read this first. These are the words the rest of the page assumes you know.',
        blocks: [
          viz('baseball/anatomy', 'The ballpark, to scale', 'MLB RULE 2.01 · TAP THE LAYERS', 'The infield is fixed by rule: **90-foot baselines**, a mound **60 ft 6 in** from home. Outfield fences vary by ballpark; this plate uses 330-375-400, a typical MLB shape.'),
          terms(rowsOf(S[0]), 'Core vocabulary', '22 words used everywhere below')
        ] },
      { id: 'glance', period: 'i1', title: 'The game at a glance', short: 'The game at a glance',
        intro: 'Nine innings; each has a **top** (the visitors bat) and a **bottom** (the home team bats). Three outs end a half-inning. There is no clock on the game itself, but since 2023 there is one on the pitcher.',
        blocks: [
          viz('baseball/abs', 'The strike zone and the 2026 ABS challenge', 'SET THE BATTER’S HEIGHT · TAP TO PITCH', 'In 2026 every MLB game uses the **Automated Ball-Strike challenge system**: umpires still call pitches, but a batter, pitcher or catcher can challenge. Hawk-Eye cameras judge the pitch against a zone set by the batter’s height.'),
          terms(rowsOf(S[1])),
          bullets([...S[1].bullets.slice(0, 3),
            '**Pitch timer (since 2023):** 15 seconds with the bases empty, 18 with runners on. The batter must be set and alert with 8 seconds left. A pitcher violation is an automatic ball; a batter violation an automatic strike.',
            '**Disengagements:** a pitcher may step off or throw over only twice per plate appearance with runners on. A third, unsuccessful pickoff is a balk: every runner moves up a base.',
            '**Extra innings:** each half-inning after the ninth starts with a runner on second base.',
            '**Designated hitter:** both leagues have used the DH since 2022, so pitchers rarely bat in MLB.'
          ], 'How the game runs', 'Rules that shape every inning')
        ] },
      { id: 'positions', period: 'i1', title: 'Field and defensive positions', short: 'Positions',
        intro: 'Every fielder has a number used in scorekeeping. A “6-4-3 double play” means shortstop to second baseman to first baseman.',
        blocks: [
          viz('baseball/positions', 'The nine positions', 'SCOREKEEPING NUMBERS · TAP A FIELDER'),
          terms(rowsOf(S[2]))
        ] },
      { id: 'count', period: 'i4', title: 'The count and plate-appearance strategy', short: 'The count',
        intro: 'The count (balls first, then strikes) is the single best summary of who is winning the at-bat. Hitters hunt in their counts; pitchers expand the zone in theirs.',
        blocks: [
          viz('baseball/count', 'All twelve counts', 'WHO HAS THE ADVANTAGE?', 'Tap a count. Green counts favor the hitter, red counts favor the pitcher. 3-2 is the only count where the next ball or strike (unless fouled off) ends the at-bat.'),
          terms(rowsOf(S[3]))
        ] },
      { id: 'pitches', period: 'i4', title: 'Pitch types and what they do', short: 'Pitch types',
        intro: 'Pitches differ in **speed**, **spin** and **movement**. Movement is measured against a spinless ball: a four-seamer “rises” only compared with how far it would have dropped.',
        blocks: [
          viz('baseball/pitches', 'The pitch-movement map', 'PITCHER’S VIEW · TYPICAL MLB VALUES', 'Each pitch type plotted by how far it moves (in inches, versus a spinless ball) for a right-handed pitcher. Values are rounded Statcast-era league norms; individual pitchers vary a lot.'),
          terms(rowsOf(S[4])),
          bullets(S[4].bullets, 'The art of it', 'Sequencing and tunneling')
        ] },
      { id: 'hitting', period: 'i4', title: 'Hitting concepts', short: 'Hitting',
        intro: 'Modern hitting is measured at contact: how hard (**exit velocity**) and at what angle (**launch angle**). Hard contact in the right window becomes a **barrel**.',
        blocks: [
          viz('baseball/battedball', 'Exit velocity × launch angle', 'DRAG THE SLIDERS', 'Statcast classifies batted balls by angle and speed. A **barrel** starts at 98 mph between 26° and 30°, and the window widens as the ball is hit harder.'),
          terms(rowsOf(S[5]))
        ] },
      { id: 'baserunning', period: 'i7', title: 'Baserunning', short: 'Baserunning',
        intro: 'Runners advance on hits, walks, steals and outs. Whether a runner is **forced** to run decides how the defense can get him out.',
        blocks: [
          viz('baseball/force', 'Force or tag?', 'PUT RUNNERS ON · CHOOSE THE OUTS', 'Put runners on base. Forced runners (yellow) can be retired just by stepping on the base ahead of them; the rest must be tagged.'),
          terms(rowsOf(S[6]))
        ] },
      { id: 'defense', period: 'i7', title: 'Team defense, alignments and relays', short: 'Team defense',
        intro: 'Fielders reposition on almost every pitch, for the hitter, the count, the runners and the score. Since 2023 there are limits on how the infield can shift.',
        blocks: [
          viz('baseball/alignments', 'Defensive alignments', 'STANDARD · DP DEPTH · INFIELD IN · NO-DOUBLES', 'Since 2023 MLB requires **two infielders on each side of second base**, with all four on the infield dirt when the pitch is thrown. The overloaded “shift” of the 2010s is now illegal.'),
          viz('baseball/relay', 'The cutoff and relay, animated', 'SINGLE TO RIGHT · RUNNER FROM FIRST'),
          terms(rowsOf(S[7], { edit: { 'Infield positioning restrictions': 'Since 2023: when the pitch is released, all four infielders must have both feet on the infield dirt, with two on each side of second base. Infielders cannot switch sides unless there is a substitution.' } }))
        ] },
      { id: 'pitching', period: 'i7', title: 'Pitching strategy and bullpen roles', short: 'Pitching strategy',
        intro: 'Starters give length; relievers give leverage. Managers balance fatigue, handedness and how many times a hitter has already seen a pitcher.',
        blocks: [
          terms(rowsOf(S[8], { add: [{ term: 'Three-batter minimum', desc: 'Since 2020 a reliever must face at least three batters (or finish the half-inning) unless injured, which ended the one-batter lefty specialist.' }] }))
        ] },
      { id: 'situations', period: 'x', title: 'Situational strategy', short: 'Situational strategy',
        intro: 'There are exactly **24 base-out states**: eight ways to arrange runners times zero, one or two outs. Each has a measured average number of runs that follow. That table explains modern strategy.',
        blocks: [
          viz('baseball/baseout', 'Run expectancy: the 24 base-out states', 'TAP A STATE · TEST A STRATEGY', 'Average runs scored from each state to the end of the inning (MLB 2010–2015, FanGraphs RE24). Try the sacrifice bunt: it usually lowers expected runs.'),
          terms(rowsOf(S[9]))
        ] },
      { id: 'stats', period: 'x', title: 'Statistics you actually need', short: 'Statistics',
        intro: 'Traditional stats count events; modern stats weight them by value and adjust for ballpark and era. The first three below are the foundation.',
        blocks: [
          viz('baseball/statcalc', 'Slash-line calculator', 'AVG / OBP / SLG / OPS'),
          terms(rowsOf(S[10], { edit: { 'OBP': 'On-base percentage: (hits + walks + hit-by-pitch) ÷ (at-bats + walks + hit-by-pitch + sacrifice flies).', 'SLG': 'Slugging percentage: total bases ÷ at-bats (single = 1, double = 2, triple = 3, home run = 4).', 'ERA': 'Earned runs allowed per nine innings: earned runs × 9 ÷ innings pitched.', 'WHIP': 'Walks plus hits allowed per inning pitched.', 'Hold': 'Credited to a reliever who enters in a save situation and leaves with the lead intact. Widely tracked, but not an official MLB statistic.' } }))
        ] },
      { id: 'game-mode', period: 'x', title: 'MLB The Show and baseball-game mode', short: 'Game mode',
        intro: 'The same count, sequencing and base-out logic wins in video games.',
        blocks: [bullets(S[11].bullets, 'Play smarter', 'Transferable habits'), note(S[11].note)] }
    ],
    updatesIntro: 'MLB’s rules have changed more since 2023 than in the previous fifty years. Here is what is current for the 2026 season.',
    updates: [
      { when: '2026 season', title: 'ABS challenge system in every game', text: 'Umpires still call balls and strikes, but the batter, pitcher or catcher can challenge immediately by tapping the helmet or cap, with no help from the dugout. Each team starts with **two challenges** and keeps any it wins; after two failed challenges it has none left. A team out of challenges gets one for each extra inning. The replay is shown on the videoboard.' },
      { when: '2026 season', title: 'A strike zone set by height', text: 'For ABS the zone top is **53.5%** of the batter’s standing height and the bottom **27%**, across the 17-inch plate. A pitch is a strike if any part of the ball touches that zone.' },
      { when: 'Since 2024', title: 'Pitch timer 15 / 18 seconds', text: '15 seconds with the bases empty and 18 with runners on (it was 20 with runners in 2023). Violations are an automatic ball or strike.' },
      { when: 'Since 2023', title: 'Shift limits and bigger bases', text: 'Two infielders on each side of second base, all four on the dirt. First, second and third base grew from 15 to **18 inches square**, shortening the distance between bases.' },
      { when: 'Since 2023', title: 'Two disengagements per plate appearance', text: 'Step-offs and pickoff throws are limited. A third unsuccessful attempt is a balk.' }
    ],
    glossary: glossary(o, {
      edit: { 'Shift': 'Strategic fielder positioning. Since 2023, MLB requires two infielders on each side of second base with all four on the infield dirt at the pitch.', 'LOOGY': 'Historic slang for a left-handed specialist reliever; the three-batter minimum (2020) ended the role.' },
      add: [
        { term: 'ABS', desc: 'Automated Ball-Strike system. In 2026 MLB uses it as a challenge system: players can appeal an umpire’s ball/strike call to Hawk-Eye tracking.' },
        { term: 'Pitch timer', desc: 'Clock limiting time between pitches: 15 seconds with bases empty, 18 with runners on.' },
        { term: 'Disengagement', desc: 'A pitcher stepping off the rubber or attempting a pickoff. Limited to two per plate appearance.' },
        { term: 'Exit velocity', desc: 'Speed of the ball off the bat, measured by Statcast.' },
        { term: 'Run expectancy', desc: 'Average number of runs that score from a given base-out state to the end of the inning.' },
        { term: 'Base-out state', desc: 'The combination of which bases are occupied and how many outs there are, 24 in all.' },
        { term: 'Induced vertical break', desc: 'How much a pitch rises or drops compared with a spinless ball thrown at the same speed and angle.' },
        { term: 'Automatic runner', desc: 'The runner placed on second base to start each extra-inning half-inning.' }
      ]
    }),
    sources: [
      ['MLB Official Baseball Rules', 'https://www.mlb.com/official-information/official-rules'],
      ['MLB: ABS Challenge System coming to the Majors in 2026', 'https://www.mlb.com/press-release/press-release-mlb-announces-abs-challenge-system-coming-to-the-major-leagues-beginning-in-the-2026-season'],
      ['MLB Glossary: Rules (pitch timer, shift, bases)', 'https://www.mlb.com/glossary/rules'],
      ['MLB Glossary: Statcast (barrel, exit velocity, launch angle)', 'https://www.mlb.com/glossary/statcast'],
      ['Baseball Savant: pitch movement leaderboards', 'https://baseballsavant.mlb.com/leaderboard/pitch-movement'],
      ['FanGraphs Library: RE24 / run expectancy', 'https://library.fangraphs.com/misc/re24/']
    ]
  };
}
