/* ============================================================
   OVERTONE — PROGRESSION SKETCHPAD
   A small custom progression builder that uses the theory core.
   ============================================================ */
'use strict';
const Sketch={
  key:store.get('sketch.key',0),
  scale:store.get('sketch.scale','ionian'),
  slots:store.get('sketch.slots',[0,4,5,3]),
  selected:0,
  bpm:store.get('sketch.bpm',92),
  running:false,
  timer:null,
  step:0,
  scaleIds:['ionian','aeolian'],
  get sc(){ return scaleById(Sketch.scale)||scaleById('ionian'); },
  degrees(){
    const sc=Sketch.sc;
    return sc.iv.map((iv,i)=>{
      const rel=diatonic(sc.iv,i,4), q=nameQuality(rel);
      return {i,pc:(Sketch.key+iv)%12,rel,q,roman:romanFor(i,q)};
    });
  },
  save(){
    store.set('sketch.key',Sketch.key); store.set('sketch.scale',Sketch.scale);
    store.set('sketch.slots',Sketch.slots); store.set('sketch.bpm',Sketch.bpm);
  },
  mount(){
    const root=$('#sketchBody'); if(!root) return;
    useFlats=OT.FLAT_KEYS.includes(Sketch.key);
    const d=Sketch.degrees();
    root.innerHTML=`<div class="sketch-grid">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="panel">
          <div class="panel-h"><h3>Your loop</h3><button class="btn btn-brass" id="sketchPlay" onclick="Sketch.toggle()">${Sketch.running?'Stop':'Play loop'}</button></div>
          <div class="sketch-slots">${Sketch.slots.map((deg,i)=>Sketch.slotHTML(i,d[deg])).join('')}</div>
          <div class="panel-h" style="margin:18px 0 10px"><span class="plabel">Replace selected slot</span></div>
          <div class="degree-pick">${d.map(x=>`<button onclick="Sketch.pick(${x.i})"><b>${esc(x.roman)}</b><small>${esc(pcName(x.pc)+x.q)}</small></button>`).join('')}</div>
        </div>
        <div class="panel">
          <div class="panel-h"><span class="plabel">Key</span></div>
          ${Lab.keyRow(Sketch.key,'Sketch.setKey')}
          <div class="panel-h" style="margin:20px 0 10px"><span class="plabel">Scale</span></div>
          <div class="row">${Sketch.scaleIds.map(id=>{const sc=scaleById(id);return `<button class="chip ${id===Sketch.scale?'on':''}" onclick="Sketch.setScale('${id}')">${esc(sc.n)}</button>`}).join('')}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="panel">
          <div class="panel-h"><h3>Playback</h3></div>
          <span class="kv">Tempo</span>
          <div class="bpm-big" id="sketchBpm">${Sketch.bpm}</div>
          <input aria-label="Sketch tempo" type="range" min="45" max="180" value="${Sketch.bpm}" oninput="Sketch.setBpm(+this.value)">
          <div class="row" style="margin-top:18px">
            <button class="chip" onclick="Sketch.randomize()">Fresh variation</button>
            <button class="chip" onclick="Sketch.reset()">Reset</button>
          </div>
        </div>
        <div class="panel" id="sketchExplain">${Sketch.explain()}</div>
      </div>
    </div>`;
  },
  slotHTML(i,d){
    return `<button class="sketch-slot ${Sketch.selected===i?'on':''}" data-slot="${i}" onclick="Sketch.select(${i})">
      <span class="slotn">Chord ${i+1}</span><b>${esc(pcName(d.pc)+d.q)}</b><small>${esc(d.roman)} · degree ${d.i+1}</small><i class="sketch-playhead"></i></button>`;
  },
  select(i){ Sketch.selected=i; Sketch.mount(); },
  pick(deg){ Sketch.slots[Sketch.selected]=deg; Sketch.selected=(Sketch.selected+1)%4; Sketch.save(); Sketch.mount(); Sketch.preview(deg); },
  setKey(pc){ Sketch.key=pc; Sketch.save(); Sketch.mount(); },
  setScale(id){ Sketch.scale=id; Sketch.slots=Sketch.slots.map(x=>clamp(x,0,6)); Sketch.save(); Sketch.mount(); },
  setBpm(v){ Sketch.bpm=v; Sketch.save(); const o=$('#sketchBpm'); if(o)o.textContent=v; if(Sketch.running){Sketch.stop();Sketch.start();} },
  chordMidis(deg){
    const sc=Sketch.sc, rel=diatonic(sc.iv,deg,4), base=midiOf(Sketch.key,3)+sc.iv[deg];
    return rel.map(n=>base+n);
  },
  preview(deg){ A.resume(); A.chord(Sketch.chordMidis(deg),1.25,.58); },
  toggle(){ Sketch.running?Sketch.stop():Sketch.start(); },
  start(){
    A.resume(); Sketch.running=true; Sketch.step=0; const beatMs=60000/Sketch.bpm, slotMs=beatMs*2;
    const tick=()=>{
      const slot=Sketch.step%Sketch.slots.length, deg=Sketch.slots[slot];
      A.chord(Sketch.chordMidis(deg),Math.max(.7,slotMs/1000*.82),.56);
      $$('.sketch-slot').forEach((el,i)=>{ el.classList.toggle('playing',i===slot); el.style.setProperty('--slotdur',slotMs+'ms'); });
      Sketch.step++;
    };
    tick(); Sketch.timer=setInterval(tick,slotMs);
    const b=$('#sketchPlay'); if(b)b.textContent='Stop';
  },
  stop(){ clearInterval(Sketch.timer); Sketch.timer=null; Sketch.running=false; $$('.sketch-slot').forEach(el=>el.classList.remove('playing')); const b=$('#sketchPlay'); if(b)b.textContent='Play loop'; },
  randomize(){
    const anchors=[[0,4,5,3],[0,5,3,4],[5,3,0,4],[0,3,4,0],[1,4,0,5],[0,2,3,4]];
    Sketch.slots=[...anchors[Math.floor(Math.random()*anchors.length)]]; Sketch.save(); Sketch.mount();
  },
  reset(){ Sketch.slots=[0,4,5,3]; Sketch.key=0; Sketch.scale='ionian'; Sketch.bpm=92; Sketch.selected=0; Sketch.save(); Sketch.stop(); Sketch.mount(); },
  explain(){
    const d=Sketch.degrees(), seq=Sketch.slots.map(x=>d[x]);
    const names=seq.map(x=>x.roman).join(' → ');
    const tonic=seq.filter(x=>x.i===0).length, dominant=seq.filter(x=>x.i===4).length;
    let shape='This loop stays fairly open because it avoids a strong dominant-to-tonic resolution.';
    if(dominant&&tonic) shape='You have both dominant and tonic function in the loop, so the progression has a clear tension-and-release engine.';
    if(seq[seq.length-1].i===4&&seq[0].i===0) shape='The loop ends on V and restarts on I, a strong turnaround that makes the repeat feel intentional.';
    return `<p class="note-txt"><span class="kv">Roman numerals</span><b>${esc(names)}</b></p>
      <p class="note-txt"><span class="kv">What the loop is doing</span>${esc(shape)}</p>
      <p class="note-txt"><span class="kv">Try this</span>Change only one slot at a time. The fastest way to hear harmonic function is to keep three chords fixed and compare the fourth.</p>`;
  }
};

/* Project brand — one shared SVG asset, no helper file. */
(()=>{
  const style=document.createElement('style');
  style.textContent='.project-brand-logo{display:block;width:210px;max-width:34vw;max-height:54px;object-fit:contain;object-position:left center}#rail .project-brand-logo{width:188px;max-width:100%;max-height:52px}@media(max-width:720px){.project-brand-logo{width:178px;max-width:46vw;max-height:48px}}';
  document.head.appendChild(style);
  const top=document.querySelector('a.brand[href="#home"]');
  if(top) top.innerHTML='<img class="project-brand-logo" src="/assets/project-logos/overtone.svg" alt="Overtone">';
  const rail=document.querySelector('a.rail-top[href="#home"]');
  if(rail) rail.innerHTML='<img class="project-brand-logo" src="/assets/project-logos/overtone.svg" alt="Overtone">';
})();
