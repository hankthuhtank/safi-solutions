/* OVERTONE · timing
   Sound is scheduled on the audio clock a little ahead of time
   (Chris Wilson, "A Tale of Two Clocks"). A worker drives the
   look-ahead so loops keep time even in a background tab, and a
   draw queue fires visuals when the matching sound is audible. */
import { A } from './audio.js';

const LOOKAHEAD = .12, TICK_MS = 25;
const loops = new Set();
let worker = null, fallback = null;

function tick() {
  if (!A.ctx) return;
  const until = A.ctx.currentTime + LOOKAHEAD;
  loops.forEach(L => L._fill(until));
}
function startTicker() {
  if (worker || fallback) return;
  try {
    const src = `let id=null;onmessage=e=>{if(e.data==='go'){if(!id)id=setInterval(()=>postMessage(0),${TICK_MS})}else{clearInterval(id);id=null}}`;
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    worker.onmessage = tick;
    worker.postMessage('go');
  } catch (e) { worker = null; fallback = setInterval(tick, TICK_MS); }
}
function stopTicker() {
  if (loops.size) return;
  if (worker) { worker.postMessage('stop'); worker.terminate(); worker = null; }
  if (fallback) { clearInterval(fallback); fallback = null; }
}

/* A repeating grid of steps. onStep(step, time, loop) schedules sound
   at `time`; use `at(time, fn)` for anything the eye should see. */
export class Loop {
  constructor({ bpm = 100, div = 4, swing = 0, onStep, onStop } = {}) {
    Object.assign(this, { bpm, div, swing, onStep, onStop });
    this.running = false; this.step = 0; this.next = 0;
  }
  get stepDur() { return 60 / this.bpm / this.div; }
  start(delay = .06) {
    A.resume();
    this.step = 0; this.next = A.ctx.currentTime + delay; this.running = true;
    loops.add(this); startTicker(); tick();
    return this;
  }
  stop() {
    if (!this.running) return;
    this.running = false; loops.delete(this); stopTicker();
    clearQueue(this);
    if (this.onStop) this.onStop();
  }
  toggle() { this.running ? this.stop() : this.start(); return this.running; }
  _fill(until) {
    while (this.running && this.next < until) {
      let t = this.next;
      /* swing pushes every second subdivision late */
      if (this.swing && this.div % 2 === 0 && this.step % 2 === 1) t += this.stepDur * this.swing * .66;
      this.onStep(this.step, t, this);
      this.step++;
      this.next += this.stepDur;
    }
  }
}

/* ---- draw queue ---- */
let queue = [], raf = 0;
function audibleNow() {
  if (!A.ctx) return 0;
  if (A.ctx.getOutputTimestamp) {
    const ts = A.ctx.getOutputTimestamp();
    if (ts.contextTime > 0 && ts.performanceTime > 0) return ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
  }
  return A.ctx.currentTime - (A.ctx.outputLatency || A.ctx.baseLatency || 0);
}
function drain() {
  raf = 0;
  const now = audibleNow();
  const due = [], keep = [];
  for (const q of queue) (q.t <= now ? due : keep).push(q);
  queue = keep;
  /* after a background stall, only the latest of a group matters */
  due.sort((a, b) => a.t - b.t).forEach(q => { if (now - q.t < 1.5 || q.last) try { q.fn(); } catch (e) { console.error(e); } });
  if (queue.length) raf = requestAnimationFrame(drain);
}
export function at(t, fn, owner = null) {
  queue.push({ t, fn, owner });
  if (!raf) raf = requestAnimationFrame(drain);
}
export function clearQueue(owner) { queue = owner ? queue.filter(q => q.owner !== owner) : []; }
export { audibleNow };

/* run fn after `sec` of audio time (for one-shot sequences) */
export function after(sec, fn, owner) { A.init(); at(A.ctx.currentTime + sec, fn, owner); }
