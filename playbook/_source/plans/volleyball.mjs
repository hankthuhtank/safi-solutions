import { rowsOf, viz, terms, bullets, note, tbl, glossary } from './_util.mjs';

export default function volleyball(o) {
  const S = o.sections;
  return {
    name: 'Volleyball', plate: '05', tagline: 'Rotations · systems · serving', jump: 'rotation', jumpLabel: 'Jump to rotations',
    meta: 'Volleyball explained visually: a 3D arena court, a six-rotation stepper, the rally sequence, attack tempos, serve-receive formations, blocking and the FIVB 2025–2028 rules in plain English.',
    heroAlt: 'A 3D indoor volleyball arena with the receiving team in formation and a serve tracer crossing the net.',
    lede: 'Three touches, then it has to go over. Volleyball looks chaotic until you see the **rotation**. Once you know where everyone must stand, every play makes sense.',
    facts: [['6 v 6', 'players per side'], ['25 PTS', 'per set · 5th set to 15'], ['BEST OF 5', 'sets'], ['18 × 9 M', 'court'], ['2.43 M', 'net · men (2.24 women)'], ['3 TOUCHES', 'block excluded']],
    periods: [
      { id: 's1', code: 'SET 1', name: 'The basics' },
      { id: 's2', code: 'SET 2', name: 'Rotation & roles' },
      { id: 's3', code: 'SET 3', name: 'Offense' },
      { id: 's4', code: 'SET 4', name: 'Serve, block, defend' },
      { id: 's5', code: 'SET 5', name: 'Rules & strategy' }
    ],
    sections: [
      { id: 'words', period: 's1', title: 'Start here: the words', short: 'Start here: the words', core: true,
        intro: 'Read this first. These are the words the rest of the page assumes you know.',
        blocks: [viz('volleyball/anatomy', 'The court, to scale', 'FIVB RULES CH. 1 · TAP THE LAYERS', 'The **attack line** 3 m from the net splits each side into a front zone and a back zone. Back-row players may only attack from behind it (unless the ball is below the top of the net). Around the court is a **free zone** at least 3 m wide, 5 m at the sides and 6.5 m behind the end lines at FIVB world events.'), terms(rowsOf(S[0]), 'Core vocabulary', '21 words used everywhere below')] },
      { id: 'glance', period: 's1', title: 'The game at a glance', short: 'The game at a glance',
        intro: 'Every rally scores a point. Win the rally while receiving and you also win the serve, and rotate.',
        blocks: [terms(rowsOf(S[1], { edit: { 'Set': 'Sets 1–4 go to 25 points and sets 5 to 15; a set must be won by two points. (“Set” is also the name of the second contact.)' } })), bullets([
          'Each team gets **two 30-second timeouts** per set and **six substitutions** per set (FIVB).',
          'The server has **8 seconds** after the referee’s whistle to serve.',
          'A block touch does not count as one of the team’s three contacts.'
        ], 'The frame', 'FIVB indoor rules')] },
      { id: 'rotation', period: 's2', title: 'Court positions and rotations', short: 'Positions & rotations',
        intro: 'Six spots, numbered counterclockwise from the server (1 = right back). When a team wins the serve back, everyone rotates one spot **clockwise**.',
        blocks: [viz('volleyball/rotation', 'The six rotations of a 5-1', 'STEP THROUGH · SERVE vs. BASE', 'Step through all six rotations. At the moment of the serve the receiving team must be in order; the instant the ball is hit, players run to their **base** positions for their jobs.'), terms(rowsOf(S[2], { edit: { 'Rotational order': 'Under the FIVB 2025–2028 rules, only the **receiving** team must be in rotational order when the ball is served; the serving team may stand anywhere (the server must be in the service zone).', 'Overlap fault': 'A receiving-team player out of order at the serve: each front-row player must be closer to the net than the back-row player behind him, and left-to-right order must hold within each row.' } }))] },
      { id: 'roles', period: 's2', title: 'Specialized roles', short: 'Roles',
        intro: 'Six players, five jobs. The libero wears a different color and can replace any back-row player without using a substitution.',
        blocks: [terms(rowsOf(S[3], { edit: { 'Libero': 'Back-row defensive specialist in a contrasting jersey. Under FIVB rules the libero may not serve, block or attempt to block, and may not complete an attack while the ball is entirely above the top of the net. Libero replacements do not count as substitutions.' } }))] },
      { id: 'rally', period: 's3', title: 'The rally sequence', short: 'The rally',
        intro: 'Serve, pass, set, attack, then block, dig and do it again. Following that loop is the key to watching volleyball.',
        blocks: [viz('volleyball/rally', 'One rally, touch by touch', 'SERVE → PASS → SET → ATTACK → BLOCK → DIG'), terms(rowsOf(S[4]))] },
      { id: 'offense', period: 's3', title: 'Offensive systems and tempo', short: 'Systems & tempo',
        intro: '**Tempo** is how fast the set arrives. The faster the set, the less time blockers have to get there.',
        blocks: [viz('volleyball/tempo', 'Set locations and tempos', 'QUICK · 31 · SLIDE · GO · BACK · PIPE · D', 'Where the setter can send the ball from a perfect pass. First-tempo sets (the quick and slide) are hit almost as soon as they leave the setter’s hands.'), terms(rowsOf(S[5]))] },
      { id: 'serve', period: 's4', title: 'Serving and serve receive', short: 'Serve & receive',
        intro: 'The serve is the only skill a player controls completely. Receive formations decide who passes it.',
        blocks: [viz('volleyball/receive', 'Serve-receive formations', 'W · FOUR · THREE · TWO PASSERS', 'Fewer passers means better passers take more of the court, and everyone else is free to attack.'), terms(rowsOf(S[6]))] },
      { id: 'block', period: 's4', title: 'Blocking and floor defense', short: 'Block & defense',
        intro: 'The block and the diggers are one system: the block takes away part of the court, the diggers cover what is left.',
        blocks: [viz('volleyball/block', 'Line block vs. angle block', 'THE SHADOW OF THE BLOCK'), terms(rowsOf(S[7]))] },
      { id: 'attack', period: 's4', title: 'Attacking choices', short: 'Attacking',
        intro: 'Hitters don’t just hit hard: they aim. Line, angle, seams, tips, and off the blockers’ hands.',
        blocks: [terms(rowsOf(S[8]))] },
      { id: 'faults', period: 's5', title: 'Common faults and rules', short: 'Faults & rules',
        intro: 'Most faults are about contacts, the net, the center line and the rotation.',
        blocks: [terms(rowsOf(S[9], { edit: { 'Rotation fault': 'Serving out of order. (Positional faults, standing out of order at the serve, now apply only to the receiving team.)' } })), note('**Antenna rule (FIVB 2025–2028):** a team’s second or third contact that sends the ball into the opponent’s free zone outside an antenna is out as soon as it crosses the vertical plane of the net.')] },
      { id: 'strategy', period: 's5', title: 'Volleyball strategy', short: 'Strategy',
        intro: 'Strategy is mostly about the pass: a good pass unlocks the whole offense, a bad one leaves only a high ball outside.',
        blocks: [{ type: 'table', table: S[10].table, heading: 'Situation → plan', sub: 'What teams try to do' }] },
      { id: 'game-mode', period: 's5', title: 'Learning mode', short: 'Learning mode',
        intro: 'How to watch, or play, with the whole picture in your head.',
        blocks: [bullets(S[11].bullets, 'Watch smarter', 'Transferable habits')] }
    ],
    updatesIntro: 'The FIVB approved a new rulebook for 2025–2028 at its 39th World Congress (2024). These are the changes that affect what you see.',
    updates: [
      { when: '2025–2028 rules', title: 'Serving team can stand anywhere', text: 'At the moment of the serve, only the **receiving** team has to be in rotational order. Players on the serving team may take any position, so they can start in their defensive spots.' },
      { when: '2025–2028 rules', title: 'Positional faults after the serve', text: 'If a service fault happens after the serve is hit, the positional fault is what is penalised: the point and serve go to the opponent and positions are corrected.' },
      { when: '2025–2028 rules', title: 'No coordinated screening', text: 'Players may not use coordinated movements to hide the server or the flight of the ball from the receiving team.' },
      { when: '2025–2028 rules', title: 'The antenna plane', text: 'On a second or third contact, a ball crossing into the opponent’s free zone outside the antenna is out once it crosses the plane of the net.' }
    ],
    glossary: glossary(o, { add: [
      { term: 'Attack line', desc: 'The line 3 m from the net that separates the front zone from the back zone.' },
      { term: 'Rotational order', desc: 'The required front/back and left/right relationships between players at the serve, now enforced only for the receiving team.' },
      { term: 'Base position', desc: 'Where a player moves right after the serve to do his job, regardless of his rotational spot.' },
      { term: 'Tempo', desc: 'How quickly a set reaches the attacker: first tempo (quick), second, third (high ball).' },
      { term: '5-1', desc: 'System with one setter who sets in all six rotations.' },
      { term: 'Free zone', desc: 'The playable area around the court: at least 3 m, and 5 m / 6.5 m at FIVB world competitions.' }
    ] }),
    sources: [
      ['FIVB Official Volleyball Rules 2025–2028 (PDF)', 'https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf'],
      ['FIVB: Official Volleyball Rules', 'https://www.fivb.com/volleyball/the-game/official-volleyball-rules/'],
      ['FIVB: Basic rules', 'https://www.fivb.com/volleyball/the-game/basic-rules/'],
      ['USA Volleyball: Casebook of approved rulings (2026)', 'https://usavolleyball.org/wp-content/uploads/2026/02/25-27_Casebook_1-1-26.pdf']
    ]
  };
}
