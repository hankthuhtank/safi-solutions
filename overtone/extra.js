/* ============================================================
   OVERTONE — WORLD VIEW & MOTIF PLAYER
   Loaded after app.js.
   ============================================================ */
'use strict';

/* ------------------------------------------------------------
   MOTIF PLAYER
   Plays a phrase from OT.MOTIFS: melody over an optional bass,
   at the phrase's own tempo, optionally on its suggested
   instrument. Everything here is original or public domain.
   ------------------------------------------------------------ */
const Motif={
  timers:[], playing:null, restore:null, rate:1, loop:false,
  byId(id){ return OT.MOTIFS.find(m=>m.id===id); },
  totalBeats(m){ return (m.mel||[]).reduce((a,n)=>a+Math.abs(n[1]),0); },

  html(id,compact){
    const m=Motif.byId(id); if(!m) return '';
    const pitches=m.mel.filter(n=>n[0]!==null).map(n=>n[0]);
    const lo=Math.min(...pitches), hi=Math.max(...pitches), span=Math.max(1,hi-lo);
    const roll=m.mel.map((n,i)=>{
      if(n[0]===null) return `<i class="rest" style="width:${Math.abs(n[1])*13}px;height:2px"></i>`;
      const h=16+((n[0]-lo)/span)*46;
      return `<i data-n="${i}" style="width:${Math.abs(n[1])*13}px;height:${h.toFixed(0)}px"
        title="${esc(pcName(m.root+n[0]))}"></i>`;
    }).join('');
    const tag = m.kind==='trad'
      ? `<span class="badge">Traditional \u00b7 ${esc(m.origin||'public domain')}</span>`
      : `<span class="badge orig">Original \u00b7 written for this site</span>`;
    return `<div class="motif" data-motif="${id}">
      <div class="motif-h">
        <h4>${esc(m.n)}</h4>
        ${tag}
        <button class="btn btn-brass" onclick="Motif.play('${id}')" id="mplay-${id}">Play</button>
        <button class="btn btn-ghost" onclick="Motif.stop()">Stop</button>
        <button class="chip ${Motif.loop?'on':''}" onclick="Motif.toggleLoop(this)">Loop</button>
      </div>
      <div class="row" style="gap:12px;margin-bottom:12px">
        <span class="plabel">Tempo</span>
        <input type="range" min="50" max="160" value="${Math.round(Motif.rate*100)}" style="flex:1;max-width:190px"
          oninput="Motif.setRate(+this.value/100,'${id}')">
        <span class="hint" id="mbpm-${id}">${Math.round(m.bpm*Motif.rate)} BPM</span>
      </div>
      <div class="roll" id="roll-${id}">${roll}</div>
      <p class="note-txt" style="margin-top:12px"><span class="kv">${esc(m.dev||'The device')}</span>${esc(m.note)}</p>
      ${compact?'':`<div class="row" style="margin-top:12px">
        ${m.scale?`<button class="chip" onclick="Motif.toBench('${id}')">Open ${esc(scaleById(m.scale)?scaleById(m.scale).n:'')} in the Bench</button>`:''}
        <span class="hint">${m.bpm} BPM \u00b7 ${esc((INSTRUMENTS.find(i=>i[0]===m.inst)||[,'piano'])[1])}</span>
      </div>`}
    </div>`;
  },

  toggleLoop(btn){ Motif.loop=!Motif.loop; if(btn) btn.classList.toggle('on',Motif.loop);
    if(!Motif.loop) Motif.stop(); },
  setRate(r,id){ Motif.rate=r;
    const m=Motif.byId(id), o=$('#mbpm-'+id);
    if(m&&o) o.textContent=Math.round(m.bpm*r)+' BPM';
    if(Motif.playing===id) Motif.play(id); },
  stop(){
    Motif.timers.forEach(clearTimeout); Motif.timers=[]; Motif.playing=null;
    if(A.ctx) A.releaseAll();
    $$('.roll i').forEach(el=>el.classList.remove('on'));
    if(Motif.restore){ A.inst=Motif.restore; Motif.restore=null;
      const sel=$('#instSel'); if(sel&&A.mode==='sampled') sel.value=A.inst; }
    Motif.playing=null;
  },

  play(id){
    const m=Motif.byId(id); if(!m) return;
    Motif.stop(); A.resume(); Motif.playing=id;
    const go2=()=>{
      const spb=60/((m.bpm||100)*Motif.rate);
      const rootMidi=midiOf(m.root||0,4);
      let t=0;
      (m.mel||[]).forEach((n,i)=>{
        const dur=Math.abs(n[1])*spb;
        if(n[0]!==null){
          A.note(rootMidi+n[0], dur*.94, .8, t);
          const at=t*1000;
          Motif.timers.push(setTimeout(()=>{
            const r=$('#roll-'+id); if(!r) return;
            $$('i',r).forEach(el=>el.classList.remove('on'));
            const el=$(`#roll-${id} i[data-n="${i}"]`); if(el) el.classList.add('on');
          },at));
        }
        t+=dur;
      });
      let bt=0;
      (m.bass||[]).forEach(n=>{
        const dur=Math.abs(n[1])*spb;
        if(n[0]!==null) A.note(rootMidi-12+n[0], dur*.96, .5, bt);
        bt+=dur;
      });
      Motif.timers.push(setTimeout(()=>{
        $$('.roll i').forEach(el=>el.classList.remove('on'));
        if(Motif.loop&&Motif.playing===id){ Motif.timers=[]; go2(); return; }
        if(Motif.restore){ A.inst=Motif.restore; Motif.restore=null; }
        Motif.playing=null;
      },Math.max(t,bt)*1000+(Motif.loop?150:400)));
    };
    /* borrow the phrase's own instrument, then hand it back */
    if(m.inst && A.mode==='sampled' && A.inst!==m.inst){
      Motif.restore=A.inst; A.inst=m.inst;
      if(A.state[m.inst]==='ok') go2();
      else { toast('Loading '+((INSTRUMENTS.find(i=>i[0]===m.inst)||[,m.inst])[1])+'\u2026');
             A.load(m.inst).then(go2); }
    } else go2();
  },

  toBench(id){
    const m=Motif.byId(id); if(!m||!m.scale) return;
    closeModal();
    Lab.root=m.root||0; useFlats=OT.FLAT_KEYS.includes(Lab.root);
    if(m.prog){ Lab.prog=m.prog; go('lab'); Lab.mount('progs'); }
    else { Lab.scale=m.scale; go('lab'); Lab.mount('scales'); setTimeout(()=>Lab.playScale(),260); }
  }
};

/* ------------------------------------------------------------
   WORLD VIEW
   ------------------------------------------------------------ */
const World={
  cont:'all',
  conts(){ return ['all',...new Set(OT.WORLD.map(w=>w.cont.split(' \u00b7 ')[0]))]; },
  mount(){
    const list=OT.WORLD.filter(w=>World.cont==='all'||w.cont.startsWith(World.cont));
    $('#worldBody').innerHTML=`
      <div class="searchbar">
        ${World.conts().map(c=>`<button class="chip ${c===World.cont?'on':''}"
          onclick="World.setCont('${c}')">${esc(c==='all'?'Everywhere':c)}</button>`).join('')}
      </div>
      <div class="cards">
        ${list.map(w=>`<button class="wcard" onclick="World.open('${w.id}')">
          <span class="cont">${esc(w.cont)}</span>
          <h4>${esc(w.region)}</h4>
          <p>${esc(w.blurb)}</p>
          <span class="tagrow">
            <span class="tg acc">${w.scales.length} scales</span>
            <span class="tg pat">${w.rhythms.length} grooves</span>
            ${w.motifs.length?`<span class="tg">${w.motifs.length} to play</span>`:''}
          </span></button>`).join('')}
      </div>
      <div class="panel" style="margin-top:22px">
        <p class="note-txt"><span class="kv">Before you browse</span>
          These are doorways, not summaries. Every tradition below has centuries of practice, regional variation
          and living teachers behind it, and a page on a website flattens all of that. Treat what follows as a
          reason to go and listen to the real thing.</p>
        <p class="note-txt"><span class="kv">On the tuning</span>
          Several of these traditions do not use the twelve equal semitones this site is built on. Arabic maqamat
          and Javanese gamelan both contain intervals that fall between the keys of a piano. Where that happens
          the entry says so. What you hear here is a translation with real information lost.</p>
      </div>`;
  },
  setCont(c){ World.cont=c; World.mount(); },
  open(id){
    const w=OT.WORLD.find(x=>x.id===id); if(!w) return;
    const scaleRow=w.scales.map(sid=>{
      const sc=scaleById(sid); if(!sc) return '';
      return `<button class="chip" onclick="World.hearScale('${sid}')">${esc(sc.n)} \u25b6</button>`;
    }).join('');
    const rhythmRow=w.rhythms.map(rid=>{
      const r=OT.RHYTHMS.find(x=>x.id===rid); if(!r) return '';
      return `<button class="chip pat" onclick="World.hearRhythm('${rid}')">${esc(r.n)} \u00b7 ${esc(r.sig)} \u25b6</button>`;
    }).join('');
    openModal(w.region,`
      <h3>${esc(w.region)}</h3>
      <p class="msub">${esc(w.cont)}</p>
      <div class="mrow"><span class="k">The tradition</span><span class="v">${esc(w.blurb)}</span></div>
      <div class="mrow"><span class="k">The big idea</span><span class="v"><b>${esc(w.idea)}</b></span></div>
      <div class="mrow"><span class="k">Instruments</span><span class="v">${esc(w.inst)}</span></div>
      <div class="mrow"><span class="k">Its scales</span><span class="v"><div class="row">${scaleRow||'–'}</div></span></div>
      <div class="mrow"><span class="k">Its grooves</span><span class="v"><div class="row">${rhythmRow||'–'}</div>
        <p class="hint" style="margin-top:8px">Loads into the Rhythm Room and starts playing.</p></span></div>
      ${w.motifs.map(mid=>Motif.html(mid)).join('')}`);
  },
  hearScale(sid){
    A.resume();
    const sc=scaleById(sid);
    const root = sid==='bhairav'?2 : sid==='insen'?9 : sid==='hijaz'?4 : sid==='pelog'?0 : 0;
    A.seq(Lab.scaleRun(root,sid,4),.22,.5,.75);
    toast(pcName(root)+' '+sc.n);
  },
  hearRhythm(rid){
    closeModal(); go('rhythm');
    setTimeout(()=>{ Rhythm.loadPreset(rid); Rhythm.startSeq(); },280);
  }
};

/* stop any phrase when a modal closes */
(function(){
  const orig=window.closeModal;
  window.closeModal=function(){ Motif.stop(); orig(); };
})();

World.mount();
