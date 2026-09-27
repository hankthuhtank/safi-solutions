/* ============================================================
   OVERTONE — CHORD SHAPES
   f  = fret per string, low to high. -1 = don't play, 0 = open
   fi = finger per string. 0 = open/muted, 1 index … 4 pinky
   Movable shapes are written at fret 0 and slid up; the root
   string tells us how far.
   ============================================================ */
window.OT = window.OT || {};

/* ---- open-position guitar chords, as they are actually taught ---- */
OT.GUITAR_OPEN = {
  'C':      {f:[-1,3,2,0,1,0], fi:[0,3,2,0,1,0]},
  'Cmaj7':  {f:[-1,3,2,0,0,0], fi:[0,3,2,0,0,0]},
  'C7':     {f:[-1,3,2,3,1,0], fi:[0,3,2,4,1,0]},
  'D':      {f:[-1,-1,0,2,3,2], fi:[0,0,0,1,3,2]},
  'Dm':     {f:[-1,-1,0,2,3,1], fi:[0,0,0,2,3,1]},
  'D7':     {f:[-1,-1,0,2,1,2], fi:[0,0,0,2,1,3]},
  'Dmaj7':  {f:[-1,-1,0,2,2,2], fi:[0,0,0,1,1,1]},
  'Dm7':    {f:[-1,-1,0,2,1,1], fi:[0,0,0,2,1,1]},
  'Dsus4':  {f:[-1,-1,0,2,3,3], fi:[0,0,0,1,3,4]},
  'Dsus2':  {f:[-1,-1,0,2,3,0], fi:[0,0,0,1,3,0]},
  'E':      {f:[0,2,2,1,0,0], fi:[0,2,3,1,0,0]},
  'Em':     {f:[0,2,2,0,0,0], fi:[0,2,3,0,0,0]},
  'E7':     {f:[0,2,0,1,0,0], fi:[0,2,0,1,0,0]},
  'Em7':    {f:[0,2,0,0,0,0], fi:[0,2,0,0,0,0]},
  'F':      {f:[1,3,3,2,1,1], fi:[1,3,4,2,1,1], barre:1},
  'Fmaj7':  {f:[-1,-1,3,2,1,0], fi:[0,0,3,2,1,0]},
  'G':      {f:[3,2,0,0,0,3], fi:[2,1,0,0,0,3]},
  'G7':     {f:[3,2,0,0,0,1], fi:[3,2,0,0,0,1]},
  'Gmaj7':  {f:[3,2,0,0,0,2], fi:[3,1,0,0,0,2]},
  'A':      {f:[-1,0,2,2,2,0], fi:[0,0,1,2,3,0]},
  'Am':     {f:[-1,0,2,2,1,0], fi:[0,0,2,3,1,0]},
  'A7':     {f:[-1,0,2,0,2,0], fi:[0,0,2,0,3,0]},
  'Am7':    {f:[-1,0,2,0,1,0], fi:[0,0,2,0,1,0]},
  'Amaj7':  {f:[-1,0,2,1,2,0], fi:[0,0,2,1,3,0]},
  'Asus4':  {f:[-1,0,2,2,3,0], fi:[0,0,1,2,3,0]},
  'B7':     {f:[-1,2,1,2,0,2], fi:[0,2,1,3,0,4]},
  'Bm':     {f:[-1,2,4,4,3,2], fi:[0,1,3,4,2,1], barre:2}
};

/* ---- movable guitar shapes: the two barre families ---- */
OT.GUITAR_MOVABLE = [
  {q:'maj',  name:'E shape',  rootStr:0, f:[0,2,2,1,0,0], fi:[1,3,4,2,1,1], barre:0},
  {q:'maj',  name:'A shape',  rootStr:1, f:[-1,0,2,2,2,0], fi:[0,1,3,3,3,1], barre:0},
  {q:'min',  name:'Em shape', rootStr:0, f:[0,2,2,0,0,0], fi:[1,3,4,1,1,1], barre:0},
  {q:'min',  name:'Am shape', rootStr:1, f:[-1,0,2,2,1,0], fi:[0,1,3,4,2,1], barre:0},
  {q:'7',    name:'E7 shape', rootStr:0, f:[0,2,0,1,0,0], fi:[1,3,1,2,1,1], barre:0},
  {q:'7',    name:'A7 shape', rootStr:1, f:[-1,0,2,0,2,0], fi:[0,1,3,1,4,1], barre:0},
  {q:'m7',   name:'Em7 shape',rootStr:0, f:[0,2,0,0,0,0], fi:[1,3,1,1,1,1], barre:0},
  {q:'m7',   name:'Am7 shape',rootStr:1, f:[-1,0,2,0,1,0], fi:[0,1,3,1,2,1], barre:0},
  {q:'maj7', name:'Emaj7 sh.',rootStr:0, f:[0,2,1,1,0,0], fi:[1,4,2,3,1,1], barre:0},
  {q:'maj7', name:'Amaj7 sh.',rootStr:1, f:[-1,0,2,1,2,0], fi:[0,1,3,2,4,1], barre:0},
  {q:'sus4', name:'Esus4 sh.',rootStr:0, f:[0,2,2,2,0,0], fi:[1,2,3,4,1,1], barre:0},
  {q:'sus4', name:'Asus4 sh.',rootStr:1, f:[-1,0,2,2,3,0], fi:[0,1,2,3,4,1], barre:0}
];

/* ---- ukulele, standard GCEA ---- */
OT.UKE_OPEN = {
  'C':    {f:[0,0,0,3], fi:[0,0,0,3]},
  'C7':   {f:[0,0,0,1], fi:[0,0,0,1]},
  'Cmaj7':{f:[0,0,0,2], fi:[0,0,0,2]},
  'Am':   {f:[2,0,0,0], fi:[2,0,0,0]},
  'Am7':  {f:[0,0,0,0], fi:[0,0,0,0]},
  'F':    {f:[2,0,1,0], fi:[2,0,1,0]},
  'Fmaj7':{f:[2,4,1,3], fi:[2,4,1,3]},
  'G':    {f:[0,2,3,2], fi:[0,1,3,2]},
  'G7':   {f:[0,2,1,2], fi:[0,2,1,3]},
  'Em':   {f:[0,4,3,2], fi:[0,4,3,2]},
  'Em7':  {f:[0,2,0,2], fi:[0,2,0,3]},
  'D':    {f:[2,2,2,0], fi:[1,2,3,0]},
  'Dm':   {f:[2,2,1,0], fi:[2,3,1,0]},
  'D7':   {f:[2,2,2,3], fi:[1,2,3,4]},
  'A':    {f:[2,1,0,0], fi:[2,1,0,0]},
  'A7':   {f:[0,1,0,0], fi:[0,1,0,0]},
  'E':    {f:[4,4,4,2], fi:[2,3,4,1]},
  'E7':   {f:[1,2,0,2], fi:[1,2,0,3]},
  'Bb':   {f:[3,2,1,1], fi:[3,2,1,1], barre:1},
  'Bm':   {f:[4,2,2,2], fi:[3,1,1,1], barre:2}
};

/* ============================================================
   RUDIMENTS — the sticking vocabulary a drummer actually drills
   p  = sticking string. R/L = right/left, uppercase in accents[]
   sub= notes per beat
   ============================================================ */
OT.RUDIMENTS=[
  {id:'single', n:'Single Stroke Roll', cat:'roll', sub:4, p:'RLRLRLRL', acc:[0,4],
   note:'One stroke per hand, strictly alternating. The foundation everything else is measured against.',
   tip:'Practise it slow to fast to slow in one unbroken pass. Evenness matters far more than speed.'},
  {id:'single4', n:'Single Stroke Four', cat:'roll', sub:3, p:'RLRLRL', acc:[0,3],
   note:'Two groups of three alternating strokes, accented at the start of each.',
   tip:'Feel it in triplets. The accent should land on alternating hands each time.'},
  {id:'double', n:'Double Stroke Roll', cat:'roll', sub:4, p:'RRLLRRLL', acc:[0,4],
   note:'Two strokes per hand. The second stroke should match the first in volume, not fade.',
   tip:'At slow tempos play both strokes from the wrist. Only let the stick bounce once it is genuinely fast.'},
  {id:'five', n:'Five Stroke Roll', cat:'roll', sub:4, p:'RRLLR', acc:[4],
   note:'Two doubles into a single accent. The most common roll in the entire repertoire.',
   tip:'The accent is the point of the whole figure. Everything before it is a run-up.'},
  {id:'seven', n:'Seven Stroke Roll', cat:'roll', sub:4, p:'RRLLRRL', acc:[6],
   note:'Three doubles resolving to a single accented stroke.',
   tip:'Count the strokes rather than the beats until the shape is automatic.'},
  {id:'nine', n:'Nine Stroke Roll', cat:'roll', sub:4, p:'RRLLRRLLR', acc:[8],
   note:'Four doubles and an accent. Standard fill material across every style.',
   tip:'It fits neatly across two beats at sixteenth notes. Learn where it starts, not just how it sounds.'},
  {id:'para', n:'Single Paradiddle', cat:'diddle', sub:4, p:'RLRRLRLL', acc:[0,4],
   note:'Right left right right, left right left left. The most useful sticking ever devised.',
   tip:'Because it alternates its leading hand every bar, it moves around a kit naturally. Accent only the first note of each group.'},
  {id:'dpara', n:'Double Paradiddle', cat:'diddle', sub:3, p:'RLRLRRLRLRLL', acc:[0,6],
   note:'Two alternating strokes added in front of the diddle. Sits naturally in six.',
   tip:'It fits 6/8 and shuffle feels perfectly. Try it as the ride pattern in a jazz waltz.'},
  {id:'tpara', n:'Triple Paradiddle', cat:'diddle', sub:4, p:'RLRLRLRRLRLRLRLL', acc:[0,8],
   note:'Three alternating pairs before each diddle, spanning a full bar of sixteenths.',
   tip:'Good for building endurance and for phrasing across a whole bar rather than a beat.'},
  {id:'paradiddlediddle', n:'Paradiddle-diddle', cat:'diddle', sub:3, p:'RLRRLL', acc:[0],
   note:'One alternating pair followed by two diddles. Six notes, so it leads with the same hand every time.',
   tip:'Because the lead hand never changes it loops beautifully in triplets, a staple of groove playing.'},
  {id:'invpara', n:'Inverted Paradiddle', cat:'diddle', sub:4, p:'RLLRLRRL', acc:[0,4],
   note:'A paradiddle rotated so the diddle sits in the middle.',
   tip:'The four paradiddle inversions are where the real vocabulary is. Learn all of them.'},
  {id:'flam', n:'Flam', cat:'flam', sub:2, p:'lR lL', acc:[0,2],
   note:'A quiet grace note just before the main stroke, played by the opposite hand.',
   tip:'Both sticks start at different heights. The grace note is low, the main stroke is high. That is the whole technique.'},
  {id:'flamtap', n:'Flam Tap', cat:'flam', sub:4, p:'lRR lLL', acc:[0,3],
   note:'A flam followed by a tap with the same hand.',
   tip:'The tap must be quieter than the flammed stroke or the figure loses its shape.'},
  {id:'flamacue', n:'Flamacue', cat:'flam', sub:4, p:'lR L R lL', acc:[1],
   note:'A flam, three alternating strokes with the accent on the second note, then a closing flam.',
   tip:'The accent deliberately sits off the downbeat. That displacement is the entire character of it.'},
  {id:'swiss', n:'Swiss Army Triplet', cat:'flam', sub:3, p:'lRRL', acc:[0],
   note:'A flam, a tap with the same hand, then the other hand. Three sounded notes in a triplet.',
   tip:'It sounds like a flam tap but leads differently, which makes it move around the drums much more easily.'},
  {id:'drag', n:'Drag (Ruff)', cat:'drag', sub:2, p:'llR llL', acc:[0,2],
   note:'Two quiet grace notes ahead of the main stroke.',
   tip:'The grace notes are a controlled double, not a random buzz. Play them deliberately.'},
  {id:'singledragtap', n:'Single Drag Tap', cat:'drag', sub:4, p:'llR L', acc:[0],
   note:'A drag, the main stroke, then a tap with the other hand.',
   tip:'Keep the drag tight against the main note. Space between them turns it into a triplet.'},
  {id:'doubledragtap', n:'Double Drag Tap', cat:'drag', sub:4, p:'llR llR L', acc:[0,3],
   note:'Two drags in succession before the closing tap.',
   tip:'This is where drag control gets tested: the second drag usually collapses first.'},
  {id:'ratamacue', n:'Single Ratamacue', cat:'drag', sub:3, p:'llR L R L', acc:[4],
   note:'A drag followed by four notes, accented on the last.',
   tip:'The accent at the end is what makes it a ratamacue rather than a drag with notes after it.'},
  {id:'sixstroke', n:'Six Stroke Roll', cat:'roll', sub:4, p:'RLLRRL', acc:[0,5],
   note:'An accent, two doubles, then a closing accent.',
   tip:'A modern favourite for grooves: play the accents on the toms and the doubles on the snare.'}
];

/* ---- gap-click and polyrhythm presets ---- */
OT.POLY=[
  {n:'3 : 2', a:3, b:2, note:'The gateway polyrhythm. Say "not dif-fi-cult" evenly and you are playing it.'},
  {n:'4 : 3', a:4, b:3, note:'Four against three. Say "pass the gol-den but-ter" across the cycle.'},
  {n:'5 : 4', a:5, b:4, note:'Five against four. Common in progressive and modern jazz drumming.'},
  {n:'7 : 4', a:7, b:4, note:'Seven against four. The cycle takes a full bar to resolve.'},
  {n:'5 : 3', a:5, b:3, note:'Wide and unstable. Both parts feel like the odd one out.'},
  {n:'3 : 4', a:3, b:4, note:'The same ratio as 4:3 with the roles swapped, and it feels completely different.'}
];
