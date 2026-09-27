import { rowsOf, viz, terms, bullets, note, tbl, glossary } from './_util.mjs';

export default function golf(o) {
  const S = o.sections;
  return {
    name: 'Golf', plate: '06', tagline: 'Clubs · shot shapes · course management', jump: 'flight', jumpLabel: 'Jump to ball flight',
    meta: 'Golf explained visually: a 3D par-4 with shot tracers, the five areas of the course, club distances, ball-flight laws, a putting-break simulator, relief options and every term in plain English.',
    heroAlt: 'A 3D golf hole at golden hour seen from behind the tee, with a red shot tracer arcing down the fairway toward the green.',
    lede: 'Get a ball into a hole 4¼ inches wide in as few strokes as possible, while the course does everything it can to stop you. Golf is less about hitting it far than **choosing where to miss**.',
    facts: [['18 HOLES', 'a standard round'], ['PAR 72', 'typical course'], ['14 CLUBS', 'the legal maximum'], ['4.25 IN', 'hole diameter'], ['1.68 IN', 'minimum ball diameter'], ['3 MIN', 'to search for a ball']],
    periods: [
      { id: 'f9', code: 'FRONT 9', name: 'The basics' },
      { id: 'b9', code: 'BACK 9', name: 'Clubs & ball flight' },
      { id: 'h18', code: '18TH', name: 'Strategy & rules' },
      { id: 'h19', code: '19TH', name: 'Formats & stats' }
    ],
    sections: [
      { id: 'words', period: 'f9', title: 'Start here: the words', short: 'Start here: the words', core: true,
        intro: 'Read this first. These are the words the rest of the page assumes you know.',
        blocks: [viz('golf/hole', 'Anatomy of a hole', 'RULE 2.2 · THE FIVE AREAS OF THE COURSE', 'A to-scale 418-yard par 4. The Rules divide every course into five areas: the **general area**, the **teeing area**, **bunkers**, **penalty areas** and the **putting green**. Everything outside the white stakes is **out of bounds**.'), terms(rowsOf(S[0]), 'Core vocabulary', '22 words used everywhere below')] },
      { id: 'glance', period: 'f9', title: 'The game at a glance', short: 'The game at a glance',
        intro: 'Count every stroke (and every penalty stroke) from the first tee shot to the last putt.',
        blocks: [viz('golf/scoring', 'Score names', 'PICK A PAR · COUNT THE STROKES'), terms(rowsOf(S[1])), bullets([...S[1].bullets, 'Handicaps use the **World Handicap System** (since 2020). A Handicap Index can go up to 54.0, which lets players of any level compete fairly.'], 'The spirit of it', 'Three principles')] },
      { id: 'course', period: 'f9', title: 'Parts of a golf hole', short: 'Parts of a hole',
        intro: 'Every hole is a route from a teeing area to a green, with hazards placed to punish certain misses.',
        blocks: [terms(rowsOf(S[2], { edit: { 'Penalty area': 'Water or other ground marked with **red** or **yellow** stakes or lines. You may play it as it lies, or take relief for one penalty stroke (Rule 17). Red areas also allow sideways (“lateral”) relief.' } }))] },
      { id: 'clubs', period: 'b9', title: 'Club families', short: 'Clubs',
        intro: 'Fourteen clubs, each a different combination of loft and length. More loft sends the ball higher and shorter.',
        blocks: [viz('golf/bag', 'The bag: distances and gaps', 'SET YOUR 7-IRON CARRY', 'Distances scale from TrackMan’s published PGA Tour averages (7-iron ≈ 172 yd carry). Tell it how far **you** carry a 7-iron and it estimates the rest.'), terms(rowsOf(S[3]))] },
      { id: 'shots', period: 'b9', title: 'Shot types', short: 'Shot types',
        intro: 'The same club can produce very different shots depending on setup, swing length and ball position.',
        blocks: [terms(rowsOf(S[4]))] },
      { id: 'flight', period: 'b9', title: 'Ball-flight basics', short: 'Ball flight',
        intro: 'Two numbers explain most of where a shot goes: the **clubface angle** (mostly sets the start direction) and the **face-to-path** difference (sets the curve).',
        blocks: [viz('golf/flight', 'The nine ball flights', 'MOVE THE FACE AND THE PATH', 'Right-handed golfer, viewed from above. Start direction is roughly 75–85% face angle; the curve comes from the difference between face and path. A simplified model of the “D-plane”.'), terms(rowsOf(S[5])), note(S[5].note)] },
      { id: 'misses', period: 'b9', title: 'Common misses and what they mean', short: 'Common misses',
        intro: 'Diagnose the miss before trying to fix the swing.',
        blocks: [terms(rowsOf(S[6]))] },
      { id: 'management', period: 'h18', title: 'Course management', short: 'Course management',
        intro: 'Good scores come from avoiding big numbers. Aim where your normal miss still leaves you playable.',
        blocks: [terms(rowsOf(S[7]))] },
      { id: 'short-game', period: 'h18', title: 'Short game and putting', short: 'Short game',
        intro: 'For most golfers, more than half of all strokes are played within 100 yards of the hole, and putts alone are close to 40%.',
        blocks: [viz('golf/putt', 'Read the break', 'SLOPE · SPEED · DISTANCE', 'A physics simulation of a putt on a tilted green: the ball slows from friction while gravity pulls it downhill. Faster greens and slower putts break more. (Constant slope, no grain.)'), terms(rowsOf(S[8]))] },
      { id: 'rules', period: 'h18', title: 'Rules situations beginners meet', short: 'Rules situations',
        intro: 'Most rulings come down to one question: **where do I play my next shot from, and what does it cost?**',
        blocks: [viz('golf/relief', 'Relief options, drawn to scale', 'PENALTY AREA · UNPLAYABLE · OUT OF BOUNDS', 'Club-lengths are measured with your longest club other than the putter. Drops are made from **knee height** into the relief area.'), terms(rowsOf(S[9])),
          tbl(['Situation', 'Penalty', 'Your options'], [
            ['Ball in a yellow penalty area', '<span class="num">1 STROKE</span>', 'Play it as it lies (no penalty), stroke-and-distance, or back-on-the-line.'],
            ['Ball in a red penalty area', '<span class="num">1 STROKE</span>', 'All yellow options, plus lateral relief within two club-lengths, no nearer the hole.'],
            ['Out of bounds / lost ball', '<span class="num">1 STROKE</span>', 'Stroke-and-distance: replay from where you last hit. (A local rule may allow a two-stroke drop near where it went out.)'],
            ['Unplayable ball', '<span class="num">1 STROKE</span>', 'Stroke-and-distance, back-on-the-line, or two club-lengths sideways. In a bunker, staying in it; or back-on-the-line outside it for two strokes.'],
            ['Cart path / ground under repair', '<span class="num">FREE</span>', 'Drop within one club-length of the nearest point of complete relief, no nearer the hole.']
          ], 'Relief at a glance', 'Rules 16–19')] },
      { id: 'formats', period: 'h19', title: 'Scoring formats', short: 'Formats',
        intro: 'The same round can be scored many ways, some for tournaments, some for fun with friends.',
        blocks: [terms(rowsOf(S[10]))] },
      { id: 'stats', period: 'h19', title: 'Golf statistics that matter', short: 'Statistics',
        intro: '**Strokes gained** compares every shot to a tour-average benchmark from the same spot, so it shows exactly where strokes are won and lost.',
        blocks: [terms(rowsOf(S[11]))] },
      { id: 'game-mode', period: 'h19', title: 'Beginner and golf-game mode', short: 'Game mode',
        intro: 'Habits that lower scores on a real course, and in golf games.',
        blocks: [bullets(S[12].bullets, 'Play smarter', 'Transferable habits')] }
    ],
    updatesIntro: 'Golf’s rules are written jointly by the USGA and The R&A. The current edition took effect in 2023, with clarifications and new Model Local Rules added since; the next full edition is expected in 2027.',
    updates: [
      { when: '2026', title: 'New Model Local Rules', text: 'The R&A and USGA published new and updated Model Local Rules effective 1 January 2026, which committees can adopt for their competitions.' },
      { when: '2028 (elite) · 2030 (everyone)', title: 'The golf-ball rollback', text: 'Balls will be tested at a **125 mph** clubhead speed (up from 120), 2,200 rpm spin and an 11° launch. Elite competitions adopt it in 2028 and recreational golf in 2030. Most amateurs will lose only a few yards.' },
      { when: 'Since 2023', title: 'Friendlier rules', text: 'The 2023 edition simplified back-on-the-line relief, lets a player replace a club damaged during the round (unless it was damaged through abuse), and dropped the penalty for leaving a handicap off the scorecard.' },
      { when: 'Since 2019', title: 'Three-minute search, knee-height drops', text: 'Search time was cut from five minutes to three, drops are made from knee height, relief areas are measured in club-lengths, and there is no penalty for accidentally moving your ball while searching for it.' }
    ],
    glossary: glossary(o, { add: [
      { term: 'Club-length', desc: 'The length of your longest club except the putter, used to measure relief areas.' },
      { term: 'Stroke and distance', desc: 'Relief that costs one stroke and sends you back to where you last played.' },
      { term: 'Back-on-the-line relief', desc: 'Drop on a line from the hole through a reference point (like where the ball crossed into a penalty area), as far back as you like.' },
      { term: 'Lateral relief', desc: 'For red penalty areas and unplayable balls: drop within two club-lengths of the reference point, no nearer the hole.' },
      { term: 'Face-to-path', desc: 'The difference between where the clubface points and where the club is traveling at impact. It sets the curve.' },
      { term: 'Stimpmeter', desc: 'A ramp that measures green speed in feet rolled; tour greens often run 12–14.' },
      { term: 'Five areas of the course', desc: 'Rule 2.2: general area, teeing area, bunkers, penalty areas and the putting green.' }
    ] }),
    sources: [
      ['USGA: Rules of Golf', 'https://www.usga.org/rules-hub.html'],
      ['The R&A: Rules of Golf', 'https://www.randa.org/en/rules/rules-hub'],
      ['The R&A: New and updated Model Local Rules for 2026', 'https://www.randa.org/en/articles/new-and-updated-model-local-rules-for-2026'],
      ['USGA: Additional clarifications of the 2023 Rules', 'https://www.usga.org/rules-hub/clarifications-of-the-rules-of-golf.html'],
      ['USGA / R&A: Golf-ball testing changes (ODS)', 'https://www.usga.org/'],
      ['TrackMan: PGA Tour averages', 'https://www.trackman.com/blog/golf/introducing-updated-tour-averages']
    ]
  };
}
