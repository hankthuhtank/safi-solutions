/* OVERTONE · The Path
   Ten stages laid out like frets up a neck. Tick one off and its inlay
   lights; each stage points at the room where you practise it. */
import { $, esc, store, act, defineView } from '../util.js';
import { A } from '../audio.js';
import { KB } from '../keybed.js';
import { vhead, PATH, SECTIONS_META } from './shared.js';

const NOTES = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76];
const P = {
  mount(el) {
    el.innerHTML = vhead('The Path · ten stages, in order', 'Zero to <em>reading the language.</em>', 'Each stage assumes the one before. Tick them off as they click. Progress stays on this device.') + '<div id="pathBody"></div>';
    P.render();
  },
  render() {
    const done = store.get('path', []), pct = Math.round(done.length / PATH.length * 100);
    $('#pathBody').innerHTML = `
      <div class="path-top"><div class="path-meter"><b>${done.length}</b><span>of ${PATH.length} stages</span></div>
        <div class="path-frets" aria-hidden="true">${PATH.map((_, i) => `<i class="${done.includes(i) ? 'on' : ''}"></i>`).join('')}</div><span class="plabel">${pct}% of the way up the neck</span></div>
      <ol class="stages">${PATH.map((s, i) => { const room = SECTIONS_META.find(x => x[0] === s[3]); const on = done.includes(i); return `
        <li class="stage ${on ? 'done' : ''}">
          <button class="stage-mark" data-act="path.toggle" data-v="${i}" aria-pressed="${on}" aria-label="Mark stage ${i + 1} ${on ? 'not done' : 'done'}"><span class="fret-no">${i + 1}</span><i class="inl"></i></button>
          <div class="stage-body"><h4>${esc(s[0])}</h4><p>${esc(s[1])}</p><span class="stage-key">${esc(s[2])}</span></div>
          ${room ? `<a class="btn btn-ghost btn-sm" href="#${room[0]}">${esc(room[1])} →</a>` : ''}
        </li>`; }).join('')}</ol>
      <div class="row" style="margin-top:18px"><button class="chip" data-act="path.reset">Start again</button></div>`;
  }
};
act({
  'path.toggle': el => {
    const i = +el.dataset.v, done = store.get('path', []), k = done.indexOf(i);
    k > -1 ? done.splice(k, 1) : done.push(i);
    store.set('path', done); P.render();
    if (k === -1) { A.resume(); A.chord([NOTES[i], NOTES[i] + 4, NOTES[i] + 7].map(n => n + 12), { dur: 1, vel: .35, voice: 'celesta', strum: .05 }); }
  },
  'path.reset': () => { if (confirm('Clear your progress on the path?')) { store.set('path', []); P.render(); } }
});
defineView('path', { mount: el => P.mount(el), show() { KB.setKey(0, 'ionian'); P.render(); } });
