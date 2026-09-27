/* ============================================================
   OVERTONE — TOOLS
   Chord diagrams · percussion trainers · staff notation
   Loaded after extra.js.
   ============================================================ */
'use strict';

/* ============================================================
   1 · CHORD DIAGRAMS
   ============================================================ */
const Chords={
  inst:'guitar', root:0, q:'maj', idx:0,
  INSTS:[['guitar','Guitar',[4,9,2,7,11,4],[2,2,3,3,3,4]],
         ['ukulele','Ukulele',[7,0,4,9],[4,4,4,4]],
         ['mandolin','Mandolin',[7,2,9,4],[3,4,4,5]],
         ['bass','Bass',[4,9,2,7],[1,1,2,2]]],
  QUALS:[['maj','Major',''],['min','Minor','m'],['7','Dominant 7th','7'],['m7','Minor 7th','m7'],
         ['maj7','Major 7th','maj7'],['sus4','Sus4','sus4'],['sus2','Sus2','sus2'],
         ['dim','Diminished','°'],['aug','Augmented','+'],['6','Sixth','6'],['m7b5','Half-dim','m7♭5']],
  meta(){ return Chords.INSTS.find(i=>i[0]===Chords.inst); },
  sym(){ return (Chords.QUALS.find(q=>q[0]===Chords.q)||[,,''])[2]; },
  name(){ return pcName(Chords.root)+Chords.sym(); },
  pcs(){ const c=chordById(Chords.q); return c?c.iv.map(i=>(Chords.root+i)%12):[0,4,7]; },

  /* hand-authored shapes first; otherwise search the neck for one */
  shapes(){
    const out=[], name=Chords.name(), alt=OT.FLAT[Chords.root]+Chords.sym();
    if(Chords.inst==='guitar'){
      const open=OT.GUITAR_OPEN[name]||OT.GUITAR_OPEN[alt];
      if(open) out.push({...open, label:'Open position', base:1});
      OT.GUITAR_MOVABLE.filter(m=>m.q===Chords.q).forEach(m=>{
        const openPc=[4,9,2,7,11,4][m.rootStr];
        let fret=((Chords.root-openPc)%12+12)%12;
        if(fret===0) fret=12;
        if(fret>11) fret-=12;
        if(fret<1) return;
        out.push({f:m.f.map(x=>x<0?-1:x+fret), fi:[...m.fi], base:fret,
                  barre:m.barre!=null?fret:null, label:m.name+' · barre '+fret});
      });
    } else if(Chords.inst==='ukulele'){
      const open=OT.UKE_OPEN[name]||OT.UKE_OPEN[alt];
      if(open) out.push({...open, label:'Open position', base:1});
    }
    if(!out.length){ const g=Chords.search(); if(g) out.push(g); }
    else { const g=Chords.search(out[0].base+4); if(g) out.push(g); }
    return out;
  },
  /* generic finder: one chord tone per string inside a four-fret window */
  search(from){
    const m=Chords.meta(), pcs=Chords.pcs(), start=Math.max(0,from||0);
    for(let pos=start;pos<=12;pos++){
      const f=[]; let ok=0, hasRoot=false;
      m[2].forEach((openPc,i)=>{
        let found=-1;
        for(let fr=(pos===0?0:pos);fr<=pos+3;fr++){
          if(pcs.includes((openPc+fr)%12)){ found=fr; break; }
        }
        if(found>-1){ ok++; if((openPc+found)%12===Chords.root%12) hasRoot=true; }
        f.push(found);
      });
      if(ok>=Math.min(4,m[2].length)&&hasRoot){
        const played=f.filter(x=>x>0);
        const base=played.length?Math.min(...played):1;
        /* fingers assigned by fret order, lowest fret gets the index */
        const order=[...new Set(played)].sort((a,b)=>a-b);
        const fi=f.map(x=>x>0?Math.min(4,order.indexOf(x)+1):0);
        return {f, fi, base:Math.max(1,base), label:'Position '+base, found:true};
      }
    }
    return null;
  },

  diagram(sh){
    const m=Chords.meta(), n=m[2].length;
    const W=26*(n-1)+52, H=178, x0=26, y0=42, gap=26, fh=25, frets=5;
    let g='';
    for(let i=0;i<n;i++) g+=`<line x1="${x0+i*gap}" y1="${y0}" x2="${x0+i*gap}" y2="${y0+frets*fh}"
      stroke="#7a6a55" stroke-width="1.4"/>`;
    for(let r=0;r<=frets;r++) g+=`<line x1="${x0}" y1="${y0+r*fh}" x2="${x0+(n-1)*gap}" y2="${y0+r*fh}"
      stroke="${r===0&&sh.base===1?'#f3ecdd':'#57493a'}" stroke-width="${r===0&&sh.base===1?4:1.2}"/>`;
    if(sh.base>1) g+=`<text x="${x0-11}" y="${y0+16}" font-size="12" fill="#ab9e8c"
      font-family="DM Mono, monospace" text-anchor="end">${sh.base}</text>`;
    sh.f.forEach((fr,i)=>{
      const x=x0+i*gap;
      if(fr<0){ g+=`<text x="${x}" y="${y0-9}" font-size="13" fill="#a84356" text-anchor="middle"
        font-family="DM Mono, monospace">\u00d7</text>`; return; }
      if(fr===0){ g+=`<circle cx="${x}" cy="${y0-14}" r="5" fill="none" stroke="#5fb8a6" stroke-width="1.6"/>`; return; }
      const rel=fr-sh.base+1;
      if(rel<1||rel>frets) return;
      const y=y0+(rel-.5)*fh;
      const isRoot=(m[2][i]+fr)%12===Chords.root%12;
      g+=`<circle cx="${x}" cy="${y}" r="10" fill="${isRoot?'#d9a441':'#f3ecdd'}"/>`;
      if(sh.fi&&sh.fi[i]) g+=`<text x="${x}" y="${y+4.5}" font-size="12" text-anchor="middle"
        fill="#12100f" font-family="DM Mono, monospace" font-weight="500">${sh.fi[i]}</text>`;
    });
    if(sh.barre){
      const first=sh.f.findIndex(x=>x===sh.barre), last=sh.f.lastIndexOf(sh.barre);
      if(first>-1&&last>first){
        const y=y0+(sh.barre-sh.base+.5)*fh;
        g+=`<rect x="${x0+first*gap-10}" y="${y-4}" width="${(last-first)*gap+20}" height="8" rx="4"
          fill="#d9a441" opacity=".5"/>`;
      }
    }
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W+20}px" role="img"
      aria-label="${esc(Chords.name())} chord diagram">${g}</svg>`;
  },

  midis(sh){
    const m=Chords.meta(), out=[];
    sh.f.forEach((fr,i)=>{ if(fr>=0) out.push(midiOf(m[2][i],m[3][i])+fr); });
    return out;
  },
  strum(i,dir){
    A.resume();
    const sh=Chords.shapes()[i]; if(!sh) return;
    let v=Chords.midis(sh);
    if(dir===1) v=v.slice().reverse();
    const gap=dir===2?.17:.03;
    v.forEach((mi,k)=>A.note(mi,dir===2?.9:2.6,KB.vel*(k?.92:1),k*gap));
    $('#nowNote').textContent=Chords.name()+' \u00b7 '+v.map(x=>pcName(x)).join(' ');
  },

  mount(){
    const shapes=Chords.shapes();
    const inKey=OT.PROGS.find(p=>p.id==='axis');
    $('#chordBody').innerHTML=`
      <div class="panel" style="margin-bottom:14px">
        <div class="row"><span class="plabel">Instrument</span>
          ${Chords.INSTS.map(([id,n])=>`<button class="chip ${id===Chords.inst?'on':''}"
            onclick="Chords.set('inst','${id}')">${esc(n)}</button>`).join('')}</div>
        <div class="row" style="margin-top:14px"><span class="plabel">Root</span>
          ${OT.SHARP.map((n,pc)=>`<button class="chip ${pc===Chords.root?'on':''}"
            onclick="Chords.set('root',${pc})">${esc(pcName(pc))}</button>`).join('')}</div>
        <div class="row" style="margin-top:14px"><span class="plabel">Type</span>
          ${Chords.QUALS.map(([id,n])=>`<button class="chip ${id===Chords.q?'on':''}"
            onclick="Chords.set('q','${id}')">${esc(n)}</button>`).join('')}</div>
      </div>

      <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">
        ${shapes.length?shapes.map((sh,i)=>`
          <div class="panel" style="text-align:center">
            <div class="plabel" style="margin-bottom:4px">${esc(sh.label)}</div>
            <h3 style="margin-bottom:10px">${esc(Chords.name())}</h3>
            ${Chords.diagram(sh)}
            <div class="row" style="justify-content:center;margin-top:12px">
              <button class="btn btn-brass" onclick="Chords.strum(${i},0)">Strum \u2193</button>
              <button class="btn btn-ghost" onclick="Chords.strum(${i},1)">\u2191</button>
              <button class="btn btn-ghost" onclick="Chords.strum(${i},2)">Pick</button>
            </div>
          </div>`).join('')
        :`<p class="hint">No shape found for that combination on this instrument.</p>`}
      </div>

      <div class="panel" style="margin-top:14px">
        <div class="panel-h"><h3>Reading a chord box</h3></div>
        <div class="grid2">
          <p class="note-txt">
            The vertical lines are the strings, thickest on the left. The horizontal lines are the frets, with the
            thick bar at the top being the nut, the very end of the neck. A number inside a dot is the finger
            to use: <b>1 index, 2 middle, 3 ring, 4 pinky</b>. Gold dots are the root of the chord.
            <br><br>
            Above the diagram, a circle means play that string open and a cross means do not play it at all.
            A gold bar across several strings is a barre: one finger flattened over all of them. When a number
            appears to the left of the box, the shape starts at that fret rather than at the nut.
          </p>
          <p class="note-txt"><span class="kv">Why there is more than one shape</span>
            The same chord exists in several places on the neck. Open shapes ring brighter because open strings
            are involved; barre shapes sound tighter and can slide to any key without changing fingering.
            Learn one open shape and one barre shape per chord type and you can play in all twelve keys.
            <br><br><span class="kv">Try this</span>
            Pick a root, then click through Major, Minor and Dominant 7th and strum each one. Three fingers move
            and the entire emotional character changes. That is the whole of harmony in one experiment.</p>
        </div>
      </div>`;
    KB.setScale(Chords.root,null);
  },
  set(k,v){ Chords[k]=v; if(k==='root') useFlats=OT.FLAT_KEYS.includes(v);
    Chords.mount(); Chords.strum(0,0); }
};

/* ============================================================
   2 · PERCUSSION ROOM
   ============================================================ */
const Perc={
  tool:'rudiments', rud:'para', bpm:80, running:false, timer:null, step:0,
  poly:0, polyOn:false, polyTimer:null,
  gapOn:false, gapTimer:null, gapBar:0, playBars:2, muteBars:2, gapStep:0,
  ladder:false, ladderTimer:null, ladderStep:0, ladderIdx:0,
  LADDER:[[1,'Quarters'],[2,'Eighths'],[3,'Triplets'],[4,'Sixteenths'],[5,'Quintuplets'],[6,'Sextuplets']],
  tools:[['rudiments','Rudiments'],['gap','Gap click'],['poly','Polyrhythm'],['ladder','Subdivision ladder']],

  mount(){
    $('#percBody').innerHTML=`
      <div class="row" style="margin-bottom:18px">${Perc.tools.map(([v,n])=>
        `<button class="chip ${v===Perc.tool?'on':''}" onclick="Perc.go('${v}')">${esc(n)}</button>`).join('')}</div>
      <div id="percTool"></div>`;
    ({rudiments:Perc.rudiments,gap:Perc.gap,poly:Perc.polyView,ladder:Perc.ladderView})[Perc.tool]();
  },
  go(t){ Perc.stopAll(); Perc.tool=t; Perc.mount(); },
  stopAll(){
    [Perc.timer,Perc.polyTimer,Perc.gapTimer,Perc.ladderTimer].forEach(clearInterval);
    Perc.running=Perc.polyOn=Perc.gapOn=Perc.ladder=false;
  },
  hand(ch,when,vel){ /* right hand higher, left lower, so sticking is audible */
    A.init(); const t=A.ctx.currentTime+when, up=ch==='R'||ch==='r';
    const o=A.ctx.createOscillator(), g=A.ctx.createGain(), f=A.ctx.createBiquadFilter();
    const b=A.ctx.createBuffer(1,Math.ceil(A.ctx.sampleRate*.05),A.ctx.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
    const src=A.ctx.createBufferSource(); src.buffer=b;
    f.type='bandpass'; f.frequency.value=up?2600:1500; f.Q.value=1.2;
    g.gain.setValueAtTime(vel*.5,t); g.gain.exponentialRampToValueAtTime(.0001,t+.07);
    src.connect(f); f.connect(g); g.connect(A.master); src.start(t);
    o.type='triangle'; o.frequency.setValueAtTime(up?420:300,t);
    const og=A.ctx.createGain();
    og.gain.setValueAtTime(vel*.22,t); og.gain.exponentialRampToValueAtTime(.0001,t+.05);
    o.connect(og); og.connect(A.master); o.start(t); o.stop(t+.07);
  },

  /* ---- rudiments ---- */
  rudiments(){
    const r=OT.RUDIMENTS.find(x=>x.id===Perc.rud);
    const chars=[...r.p].filter(c=>c!==' ');
    $('#percTool').innerHTML=`
      <div class="row" style="margin-bottom:16px"><span class="plabel">Rudiment</span>
        ${OT.RUDIMENTS.map(x=>`<button class="chip ${x.id===Perc.rud?'on':''}"
          onclick="Perc.setRud('${x.id}')">${esc(x.n)}</button>`).join('')}</div>
      <div class="grid2">
        <div class="panel">
          <div class="panel-h"><h3>${esc(r.n)}</h3><span class="plabel">${r.sub} per beat</span></div>
          <div class="sticking" id="stick">${chars.map((c,i)=>{
            const grace=c===c.toLowerCase();
            return `<span class="sk ${grace?'grace':''} ${r.acc.includes(i)?'acc':''}" data-i="${i}">${c.toUpperCase()}</span>`;
          }).join('')}</div>
          <p class="hint" style="margin-top:10px">Gold = accent \u00b7 small = grace note \u00b7 R and L are your hands</p>
          <div class="row" style="margin-top:18px;gap:14px">
            <span class="plabel">Tempo</span>
            <input type="range" min="40" max="200" value="${Perc.bpm}" style="flex:1"
              oninput="Perc.setBpm(+this.value)">
            <span class="bpm-big" style="font-size:1.5rem" id="rudBpm">${Perc.bpm}</span>
          </div>
          <div class="row" style="margin-top:14px">
            <button class="btn btn-brass" id="rudBtn" onclick="Perc.toggleRud()">Play</button>
            <button class="btn btn-ghost" onclick="Perc.ramp()">Slow \u2192 fast \u2192 slow</button>
          </div>
        </div>
        <div class="panel">
          <p class="note-txt"><span class="kv">What it is</span>${esc(r.note)}</p>
          <p class="note-txt"><span class="kv">Practising it</span><b>${esc(r.tip)}</b></p>
          <p class="note-txt" style="border-top:1px solid var(--line);padding-top:13px">
            <span class="kv">Why rudiments</span>
            They are the alphabet. Every fill and groove you admire is rudiments rearranged and moved around the
            kit. Learning them at a controlled tempo is worth more than an hour of playing along to records,
            and the ramp button above is how competitive drummers actually drill them.</p>
        </div>
      </div>`;
  },
  setRud(id){ Perc.rud=id; const was=Perc.running; Perc.stopRud(); Perc.rudiments(); if(was) Perc.startRud(); },
  setBpm(v){ Perc.bpm=v; const o=$('#rudBpm'); if(o) o.textContent=v;
    if(Perc.running){ Perc.stopRud(); Perc.startRud(); } },
  toggleRud(){ Perc.running?Perc.stopRud():Perc.startRud(); },
  startRud(){
    A.resume(); Perc.running=true; Perc.step=0;
    const r=OT.RUDIMENTS.find(x=>x.id===Perc.rud);
    const chars=[...r.p].filter(c=>c!==' ');
    const iv=(60/Perc.bpm)*1000/r.sub;
    const tick=()=>{
      const i=Perc.step%chars.length, c=chars[i];
      const grace=c===c.toLowerCase();
      Perc.hand(c, 0, r.acc.includes(i)?1:grace?.32:.62);
      $$('#stick .sk').forEach(el=>el.classList.toggle('now',+el.dataset.i===i));
      Perc.step++;
    };
    tick(); Perc.timer=setInterval(tick,iv);
    const b=$('#rudBtn'); if(b){b.textContent='Stop';b.classList.replace('btn-brass','btn-ghost');}
  },
  stopRud(){ clearInterval(Perc.timer); Perc.running=false;
    $$('#stick .sk').forEach(el=>el.classList.remove('now'));
    const b=$('#rudBtn'); if(b){b.textContent='Play';b.classList.replace('btn-ghost','btn-brass');} },
  ramp(){
    const start=Math.max(40,Perc.bpm-40), peak=Math.min(200,Perc.bpm+40);
    let v=start; Perc.setBpm(v); if(!Perc.running) Perc.startRud();
    let dir=1;
    const id=setInterval(()=>{
      v+=dir*4;
      if(v>=peak) dir=-1;
      if(v<=start&&dir===-1){ clearInterval(id); toast('Ramp complete'); return; }
      Perc.setBpm(v);
      const sl=$('#percTool input[type=range]'); if(sl) sl.value=v;
    },900);
    toast('Ramping ' + start + ' \u2192 ' + peak + ' \u2192 ' + start + ' BPM');
  },

  /* ---- gap click: the internal-clock test ---- */
  gap(){
    $('#percTool').innerHTML=`
      <div class="grid2">
        <div class="panel" style="text-align:center">
          <div class="plabel">Click plays</div>
          <div class="bpm-big" id="gapState">${Perc.playBars} on / ${Perc.muteBars} off</div>
          <div class="metro-dots" id="gapDots"></div>
          <div class="plabel" id="gapLabel" style="min-height:20px;color:var(--brass)">ready</div>
          <div class="row" style="justify-content:center;margin-top:16px;gap:14px">
            <span class="plabel">Tempo</span>
            <input type="range" min="40" max="200" value="${Perc.bpm}" style="flex:1;max-width:200px"
              oninput="Perc.bpm=+this.value;$('#gapBpm').textContent=this.value;if(Perc.gapOn){Perc.stopGap();Perc.startGap();}">
            <span class="hint" id="gapBpm">${Perc.bpm}</span>
          </div>
          <div class="row" style="justify-content:center;margin-top:12px">
            <span class="plabel">Bars on</span>
            ${[1,2,4].map(n=>`<button class="chip ${n===Perc.playBars?'on':''}"
              onclick="Perc.setGap('playBars',${n})">${n}</button>`).join('')}
            <span class="plabel" style="margin-left:8px">Bars off</span>
            ${[1,2,4,8].map(n=>`<button class="chip pat ${n===Perc.muteBars?'on':''}"
              onclick="Perc.setGap('muteBars',${n})">${n}</button>`).join('')}
          </div>
          <button class="btn btn-brass" style="margin-top:16px" id="gapBtn" onclick="Perc.toggleGap()">Start</button>
        </div>
        <div class="panel">
          <p class="note-txt"><span class="kv">What this does</span>
            The click plays for a few bars, then disappears for a few, then comes back. Your job is to keep
            playing through the silence and still be exactly in time when it returns.</p>
          <p class="note-txt"><span class="kv">Why it is the real test</span>
            Practising with a click on every beat teaches you to <em>follow</em> a pulse. It does not prove you can
            <em>generate</em> one. The gap is where you find out whether the time is actually internal or whether
            you have been leaning on the metronome the whole time.</p>
          <p class="note-txt"><span class="kv">How to use it</span><b>Start with two bars off. When the click
            returns and you are still locked, double the gap. Most people discover they rush; the silence
            makes that impossible to hide from.</b></p>
        </div>
      </div>`;
    Perc.gapDots();
  },
  setGap(k,v){ Perc[k]=v; const was=Perc.gapOn; Perc.stopGap(); Perc.gap(); if(was) Perc.startGap(); },
  gapDots(){ const d=$('#gapDots'); if(d) d.innerHTML=Array.from({length:4},(_,i)=>
    `<i class="${i===0?'acc':''}" data-b="${i}"></i>`).join(''); },
  toggleGap(){ Perc.gapOn?Perc.stopGap():Perc.startGap(); },
  startGap(){
    A.resume(); Perc.gapOn=true; Perc.gapStep=0;
    const iv=(60/Perc.bpm)*1000;
    const tick=()=>{
      const total=(Perc.playBars+Perc.muteBars)*4;
      const pos=Perc.gapStep%total, bar=Math.floor(pos/4), beat=pos%4;
      const audible=bar<Perc.playBars;
      if(audible){
        A.init();
        const o=A.ctx.createOscillator(), g=A.ctx.createGain(), t=A.ctx.currentTime;
        o.frequency.value=beat===0?1600:1000;
        g.gain.setValueAtTime(beat===0?.5:.3,t); g.gain.exponentialRampToValueAtTime(.0001,t+.05);
        o.connect(g); g.connect(A.master); o.start(t); o.stop(t+.06);
      }
      $$('#gapDots i').forEach((el,i)=>el.classList.toggle('on',i===beat&&audible));
      const lab=$('#gapLabel');
      if(lab) lab.textContent=audible?('click \u00b7 bar '+(bar+1)+' of '+Perc.playBars)
        :('SILENCE \u00b7 bar '+(bar-Perc.playBars+1)+' of '+Perc.muteBars);
      Perc.gapStep++;
    };
    tick(); Perc.gapTimer=setInterval(tick,iv);
    const b=$('#gapBtn'); if(b){b.textContent='Stop';b.classList.replace('btn-brass','btn-ghost');}
  },
  stopGap(){ clearInterval(Perc.gapTimer); Perc.gapOn=false;
    const l=$('#gapLabel'); if(l) l.textContent='ready';
    $$('#gapDots i').forEach(el=>el.classList.remove('on'));
    const b=$('#gapBtn'); if(b){b.textContent='Start';b.classList.replace('btn-ghost','btn-brass');} },

  /* ---- polyrhythm ---- */
  polyView(){
    const p=OT.POLY[Perc.poly];
    $('#percTool').innerHTML=`
      <div class="grid2">
        <div class="panel" style="text-align:center">
          <div class="row" style="justify-content:center;margin-bottom:16px">
            ${OT.POLY.map((x,i)=>`<button class="chip ${i===Perc.poly?'on':''}"
              onclick="Perc.setPoly(${i})">${esc(x.n)}</button>`).join('')}</div>
          <div class="bpm-big">${esc(p.n)}</div>
          <div class="plabel" style="margin-bottom:14px">across one cycle</div>
          <div id="polyRows"></div>
          <div class="row" style="justify-content:center;margin-top:16px;gap:14px">
            <span class="plabel">Cycle</span>
            <input type="range" min="20" max="90" value="${Perc.bpm>90?60:Perc.bpm}" style="flex:1;max-width:200px"
              oninput="Perc.bpm=+this.value;if(Perc.polyOn){Perc.stopPoly();Perc.startPoly();}">
          </div>
          <button class="btn btn-brass" style="margin-top:14px" id="polyBtn" onclick="Perc.togglePoly()">Play</button>
        </div>
        <div class="panel">
          <p class="note-txt"><span class="kv">What you are hearing</span>${esc(p.note)}</p>
          <p class="note-txt"><span class="kv">How to internalise it</span>
            Play only the lower voice with one hand until it is automatic. Then add the upper voice without
            trying to line them up. They only meet at the start of each cycle, and that meeting point is the
            only thing you need to feel.</p>
          <p class="note-txt"><span class="kv">The trap</span><b>Counting both parts at once does not work and
            never will. Feel one, play the other against it.</b></p>
        </div>
      </div>`;
    Perc.polyRows();
  },
  setPoly(i){ const was=Perc.polyOn; Perc.stopPoly(); Perc.poly=i; Perc.polyView(); if(was) Perc.startPoly(); },
  polyRows(){
    const p=OT.POLY[Perc.poly], el=$('#polyRows'); if(!el) return;
    const row=(n,cls)=>`<div class="polyrow">${Array.from({length:n},(_,i)=>
      `<i class="${cls}" data-n="${n}" data-i="${i}"></i>`).join('')}</div>`;
    el.innerHTML=row(p.a,'pa')+row(p.b,'pb');
  },
  togglePoly(){ Perc.polyOn?Perc.stopPoly():Perc.startPoly(); },
  startPoly(){
    A.resume(); Perc.polyOn=true;
    const p=OT.POLY[Perc.poly];
    const cycle=(60/Math.max(20,Math.min(90,Perc.bpm)))*1000*2;
    const gcdRes=200;
    let t0=performance.now();
    const fired={a:-1,b:-1};
    Perc.polyTimer=setInterval(()=>{
      const el=(performance.now()-t0)%cycle, frac=el/cycle;
      const ia=Math.floor(frac*p.a), ib=Math.floor(frac*p.b);
      if(ia!==fired.a){ fired.a=ia; Perc.hand('R',0,ia===0?1:.6);
        $$('#polyRows .pa').forEach(e=>e.classList.toggle('on',+e.dataset.i===ia)); }
      if(ib!==fired.b){ fired.b=ib; Perc.hand('L',0,ib===0?1:.6);
        $$('#polyRows .pb').forEach(e=>e.classList.toggle('on',+e.dataset.i===ib)); }
    },12);
    const b=$('#polyBtn'); if(b){b.textContent='Stop';b.classList.replace('btn-brass','btn-ghost');}
  },
  stopPoly(){ clearInterval(Perc.polyTimer); Perc.polyOn=false;
    $$('#polyRows i').forEach(e=>e.classList.remove('on'));
    const b=$('#polyBtn'); if(b){b.textContent='Play';b.classList.replace('btn-ghost','btn-brass');} },

  /* ---- subdivision ladder ---- */
  ladderView(){
    $('#percTool').innerHTML=`
      <div class="grid2">
        <div class="panel" style="text-align:center">
          <div class="plabel">Pulse stays put \u00b7 subdivision changes</div>
          <div class="bpm-big" id="ladName">${Perc.LADDER[Perc.ladderIdx][1]}</div>
          <div class="plabel" style="margin-bottom:12px" id="ladCount">${Perc.LADDER[Perc.ladderIdx][0]} per beat</div>
          <div class="metro-dots" id="ladDots"></div>
          <div class="row" style="justify-content:center;margin-top:16px;gap:14px">
            <span class="plabel">Tempo</span>
            <input type="range" min="40" max="140" value="${Math.min(140,Perc.bpm)}" style="flex:1;max-width:200px"
              oninput="Perc.bpm=+this.value;$('#ladBpm').textContent=this.value;if(Perc.ladder){Perc.stopLadder();Perc.startLadder();}">
            <span class="hint" id="ladBpm">${Math.min(140,Perc.bpm)}</span>
          </div>
          <div class="row" style="justify-content:center;margin-top:14px">
            ${Perc.LADDER.map((l,i)=>`<button class="chip ${i===Perc.ladderIdx?'on':''}"
              onclick="Perc.setLadder(${i})">${l[0]}</button>`).join('')}</div>
          <button class="btn btn-brass" style="margin-top:16px" id="ladBtn" onclick="Perc.toggleLadder()">Start</button>
          <button class="btn btn-ghost" style="margin-top:16px" onclick="Perc.autoLadder()">Auto-climb</button>
        </div>
        <div class="panel">
          <p class="note-txt"><span class="kv">What this trains</span>
            The quarter-note pulse never changes. Only the number of notes you fit inside it does. Switching
            cleanly between subdivisions without the tempo drifting is one of the hardest and most useful
            skills a drummer can own.</p>
          <p class="note-txt"><span class="kv">The hard ones</span>
            Quintuplets and sextuplets are where most people fall apart. Use words: five is "u-ni-ver-si-ty",
            six is two triplets stacked. Say them out loud while you play.</p>
          <p class="note-txt"><span class="kv">Auto-climb</span><b>Runs each subdivision for four bars and
            steps up automatically. The moment of the change is the whole exercise: that is where time
            gets lost.</b></p>
        </div>
      </div>`;
  },
  setLadder(i){ Perc.ladderIdx=i; const was=Perc.ladder; Perc.stopLadder(); Perc.ladderView(); if(was) Perc.startLadder(); },
  toggleLadder(){ Perc.ladder?Perc.stopLadder():Perc.startLadder(); },
  startLadder(auto){
    A.resume(); Perc.ladder=true; Perc.ladderStep=0;
    const run=()=>{
      clearInterval(Perc.ladderTimer);
      const sub=Perc.LADDER[Perc.ladderIdx][0];
      const iv=(60/Perc.bpm)*1000/sub;
      const nm=$('#ladName'), ct=$('#ladCount');
      if(nm) nm.textContent=Perc.LADDER[Perc.ladderIdx][1];
      if(ct) ct.textContent=sub+' per beat';
      $$('#percTool .chip').forEach((c,i)=>{});
      Perc.ladderTimer=setInterval(()=>{
        const onBeat=Perc.ladderStep%sub===0;
        const beat=Math.floor(Perc.ladderStep/sub)%4;
        A.init();
        const o=A.ctx.createOscillator(), g=A.ctx.createGain(), t=A.ctx.currentTime;
        o.frequency.value=(onBeat&&beat===0)?1700:onBeat?1100:750;
        g.gain.setValueAtTime(onBeat?(beat===0?.5:.34):.15,t);
        g.gain.exponentialRampToValueAtTime(.0001,t+.04);
        o.connect(g); g.connect(A.master); o.start(t); o.stop(t+.05);
        $$('#ladDots i').forEach((el,i)=>el.classList.toggle('on',i===beat&&onBeat));
        Perc.ladderStep++;
        if(auto&&Perc.ladderStep>=sub*16){
          Perc.ladderStep=0;
          Perc.ladderIdx=(Perc.ladderIdx+1)%Perc.LADDER.length;
          run();
        }
      },iv);
    };
    const d=$('#ladDots'); if(d) d.innerHTML='<i class="acc"></i><i></i><i></i><i></i>';
    run();
    const b=$('#ladBtn'); if(b){b.textContent='Stop';b.classList.replace('btn-brass','btn-ghost');}
  },
  autoLadder(){ Perc.stopLadder(); Perc.ladderIdx=0; Perc.startLadder(true);
    toast('Climbing through every subdivision, four bars each'); },
  stopLadder(){ clearInterval(Perc.ladderTimer); Perc.ladder=false;
    $$('#ladDots i').forEach(e=>e.classList.remove('on'));
    const b=$('#ladBtn'); if(b){b.textContent='Start';b.classList.replace('btn-ghost','btn-brass');} }
};

/* ============================================================
   3 · STAFF NOTATION
   ============================================================ */
const Staff={
  LETTER:[0,0,1,1,2,3,3,4,4,5,5,6],      /* pitch class -> letter index */
  ALTER: [0,1,0,1,0,0,1,0,1,0,1,0],      /* does it need a sharp */
  step(midi){ const pc=midi%12, oct=Math.floor(midi/12)-1; return oct*7+Staff.LETTER[pc]; },
  /* bottom line: treble = E4 (step 30), bass = G2 (step 18) */
  bottom(clef){ return clef==='bass'?18:30; },
  render(midis,opt){
    opt=opt||{};
    const clef=opt.clef||'treble', W=Math.max(230,60+midis.length*38), H=132;
    const gap=11, yTop=34, bottom=Staff.bottom(clef);
    const yFor=st=>yTop+4*gap-((st-bottom)*(gap/2));
    let g='';
    for(let i=0;i<5;i++) g+=`<line x1="14" y1="${yTop+i*gap}" x2="${W-10}" y2="${yTop+i*gap}"
      stroke="#57493a" stroke-width="1.1"/>`;
    g+=`<text x="22" y="${yTop+(clef==='bass'?18:34)}" font-size="${clef==='bass'?34:44}"
      fill="#d9a441" font-family="Segoe UI Symbol, Apple Symbols, Noto Music, serif">${clef==='bass'?'\uD834\uDD22':'\uD834\uDD1E'}</text>`;
    g+=`<text x="22" y="${yTop+4*gap+20}" font-size="8" fill="#736555"
      font-family="DM Mono, monospace">${clef}</text>`;
    midis.forEach((m,i)=>{
      const st=Staff.step(m), x=64+i*38, y=yFor(st);
      /* ledger lines above and below the staff */
      for(let s=bottom-2;s>=st;s-=2) g+=`<line x1="${x-12}" y1="${yFor(s)}" x2="${x+12}" y2="${yFor(s)}" stroke="#57493a" stroke-width="1.1"/>`;
      for(let s=bottom+10;s<=st;s+=2) g+=`<line x1="${x-12}" y1="${yFor(s)}" x2="${x+12}" y2="${yFor(s)}" stroke="#57493a" stroke-width="1.1"/>`;
      g+=`<ellipse cx="${x}" cy="${y}" rx="7" ry="5.2" fill="#f3ecdd" transform="rotate(-18 ${x} ${y})"/>`;
      const up=st<bottom+8;
      g+=`<line x1="${x+(up?6.6:-6.6)}" y1="${y}" x2="${x+(up?6.6:-6.6)}" y2="${y+(up?-30:30)}"
        stroke="#f3ecdd" stroke-width="1.6"/>`;
      if(Staff.ALTER[m%12]) g+=`<text x="${x-19}" y="${y+5}" font-size="15" fill="#5fb8a6"
        font-family="Segoe UI Symbol, serif">\u266f</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px" role="img"
      aria-label="${esc(opt.alt||'Staff notation')}">${g}</svg>`;
  },
  /* pick the clef that keeps the notes closest to the staff */
  auto(midis){ const avg=midis.reduce((a,b)=>a+b,0)/midis.length; return avg<57?'bass':'treble'; }
};

/* boot the new rooms */
if(typeof Chords!=='undefined') Chords.mount();
if(typeof Perc!=='undefined') Perc.mount();
