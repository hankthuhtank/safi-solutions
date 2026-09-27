/* ============================================================
   OVERTONE — application
   Audio engine, the string field, the keybed, and every view.
   ============================================================ */
'use strict';
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const store={
  get(k,d){ try{const v=localStorage.getItem('ot.'+k);return v==null?d:JSON.parse(v);}catch(e){return d;} },
  set(k,v){ try{localStorage.setItem('ot.'+k,JSON.stringify(v));}catch(e){} }
};
let toastT;
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2600); }

/* ============================================================
   1 · AUDIO
   Two engines. "Studio" streams real recorded notes from the
   FluidR3 General MIDI set and pitch-shifts between them.
   "Synth" uses lightweight oscillators built into the browser.
   Drums are always synthesised.
   ============================================================ */
const SF_BASE='https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/';
const SAMPLE_PCS={C:0,Eb:3,Gb:6,A:9};   /* one sample every minor 3rd */

const INSTRUMENTS=[
  ['acoustic_grand_piano','Grand Piano'],
  ['bright_acoustic_piano','Bright Piano'],
  ['electric_piano_1','Electric Piano'],
  ['harpsichord','Harpsichord'],
  ['celesta','Celesta'],
  ['music_box','Music Box'],
  ['vibraphone','Vibraphone'],
  ['marimba','Marimba'],
  ['kalimba','Kalimba'],
  ['acoustic_guitar_nylon','Nylon Guitar'],
  ['acoustic_guitar_steel','Steel Guitar'],
  ['overdriven_guitar','Overdriven Guitar'],
  ['electric_bass_finger','Electric Bass'],
  ['acoustic_bass','Upright Bass'],
  ['violin','Violin'],
  ['cello','Cello'],
  ['string_ensemble_1','String Ensemble'],
  ['orchestral_harp','Harp'],
  ['flute','Flute'],
  ['pan_flute','Pan Flute'],
  ['shakuhachi','Shakuhachi'],
  ['koto','Koto'],
  ['trumpet','Trumpet'],
  ['french_horn','French Horn'],
  ['alto_sax','Alto Sax'],
  ['church_organ','Church Organ'],
  ['choir_aahs','Choir'],
  ['synth_strings_1','Synth Strings']
];
const CHIPS=[['chip_square','Warm square'],['chip_pulse','Narrow pulse'],
  ['chip_tri','Triangle'],['chip_saw','Saw lead']];

const A={
  ctx:null, master:null, comp:null, mode:'sampled', sustain:false, hold:false, active:[],
  inst:store.get('inst','acoustic_grand_piano'),
  chip:store.get('chip','chip_square'),
  buf:{}, state:{}, muted:false, waves:{},
  init(){
    if(A.ctx) return A.ctx;
    const C=window.AudioContext||window.webkitAudioContext;
    A.ctx=new C();
    A.comp=A.ctx.createDynamicsCompressor();
    A.comp.threshold.value=-14; A.comp.ratio.value=4; A.comp.attack.value=.004;
    A.master=A.ctx.createGain(); A.master.gain.value=.8;
    A.master.connect(A.comp); A.comp.connect(A.ctx.destination);
    return A.ctx;
  },
  resume(){ A.init(); if(A.ctx.state==='suspended') A.ctx.resume(); },

  /* --- sampled instruments --- */
  load(name){
    if(A.state[name]==='ok'||A.state[name]==='loading') return Promise.resolve(A.state[name]);
    A.init(); A.state[name]='loading'; A.buf[name]={};
    const label=(INSTRUMENTS.find(i=>i[0]===name)||[,name])[1];
    const slow=setTimeout(()=>{ if(A.state[name]==='loading') toast('Loading '+label+'\u2026'); },420);
    const jobs=[];
    for(let oct=1;oct<=6;oct++){
      for(const nm in SAMPLE_PCS){
        const midi=12*(oct+1)+SAMPLE_PCS[nm];
        if(midi<26||midi>96) continue;
        jobs.push(
          fetch(SF_BASE+name+'-mp3/'+nm+oct+'.mp3')
            .then(r=>{ if(!r.ok) throw new Error('http'); return r.arrayBuffer(); })
            .then(b=>A.ctx.decodeAudioData(b))
            .then(b=>{ A.buf[name][midi]=b; })
            .catch(()=>{})
        );
      }
    }
    return Promise.all(jobs).then(()=>{
      clearTimeout(slow);
      const n=Object.keys(A.buf[name]).length;
      A.state[name]= n>=6 ? 'ok' : 'fail';
      if(A.state[name]==='fail') toast('Sampled instruments unavailable. Using the built-in voice.');
      updateInstUI();
      return A.state[name];
    });
  },
  nearest(name,midi){
    const keys=Object.keys(A.buf[name]||{});
    if(!keys.length) return null;
    let best=null,bd=1e9;
    for(const k of keys){ const d=Math.abs(+k-midi); if(d<bd){bd=d;best=+k;} }
    return best;
  },

  /* --- the one entry point everything else calls --- */
  /* register a voice so the sustain pedal can actually release it */
  reg(g,stop){ const v={g,stop}; A.active.push(v);
    if(A.active.length>120) A.active.splice(0,40); return v; },
  releaseAll(hard){
    if(!A.ctx) return;
    const t=A.ctx.currentTime, r=hard?.03:.2;
    A.active.forEach(v=>{ try{
      v.g.gain.cancelScheduledValues(t);
      v.g.gain.setValueAtTime(Math.max(v.g.gain.value||0.0001,0.0001),t);
      v.g.gain.exponentialRampToValueAtTime(.0001,t+r);
      if(v.stop) v.stop(t+r+.03);
    }catch(e){} });
    A.active=[];
    if(hard){ A.hold=false; A.sustain=false; if(typeof KB!=='undefined') KB.syncBtns&&KB.syncBtns(); }
  },
  note(midi,dur=1.1,vel=.75,when=0){
    A.init();
    /* the damper pedal: notes ring until the pedal lifts */
    if(A.hold) dur=Math.max(dur,40);
    else if(A.sustain) dur=Math.max(dur,3.4);
    const t=A.ctx.currentTime+when;
    if(A.mode==='sampled' && A.state[A.inst]==='ok') A.sampleVoice(midi,dur,vel,t);
    else if(A.mode==='sampled') A.fallbackVoice(midi,dur,vel,t);
    else A.chipVoice(midi,dur,vel,t);
    Strings.pluck(midi,vel,when);
  },
  sampleVoice(midi,dur,vel,t){
    const k=A.nearest(A.inst,midi); if(k==null) return A.fallbackVoice(midi,dur,vel,t);
    const src=A.ctx.createBufferSource();
    src.buffer=A.buf[A.inst][k];
    src.playbackRate.value=Math.pow(2,(midi-k)/12);
    const g=A.ctx.createGain();
    g.gain.setValueAtTime(vel,t);
    g.gain.setValueAtTime(vel,t+Math.max(.05,dur-.28));
    g.gain.exponentialRampToValueAtTime(.0001,t+dur+.18);
    src.connect(g); g.connect(A.master);
    src.start(t); src.stop(t+dur+.25);
    A.reg(g,()=>{try{src.stop()}catch(e){}});
  },
  /* a warm additive voice used when the sample set cannot load */
  fallbackVoice(midi,dur,vel,t){
    const f=440*Math.pow(2,(midi-69)/12);
    const parts=[[1,1,'sine'],[2,.34,'sine'],[3,.14,'triangle'],[4.01,.07,'sine']];
    parts.forEach(([mult,amp,type])=>{
      const o=A.ctx.createOscillator(), g=A.ctx.createGain();
      o.type=type; o.frequency.value=f*mult;
      const peak=vel*amp*.5;
      g.gain.setValueAtTime(.0001,t);
      g.gain.exponentialRampToValueAtTime(peak,t+.006);
      g.gain.exponentialRampToValueAtTime(peak*.28,t+.22);
      g.gain.exponentialRampToValueAtTime(.0001,t+dur+.3);
      o.connect(g); g.connect(A.master); o.start(t); o.stop(t+dur+.35);
      A.reg(g,()=>{try{o.stop()}catch(e){}});
    });
  },
  pulseWave(duty){
    if(A.waves[duty]) return A.waves[duty];
    const n=64, real=new Float32Array(n), imag=new Float32Array(n);
    for(let i=1;i<n;i++) imag[i]=(2/(i*Math.PI))*Math.sin(Math.PI*i*duty);
    A.waves[duty]=A.ctx.createPeriodicWave(real,imag);
    return A.waves[duty];
  },
  chipVoice(midi,dur,vel,t){
    const f=440*Math.pow(2,(midi-69)/12);
    const o=A.ctx.createOscillator(), g=A.ctx.createGain();
    if(A.chip==='chip_square') o.setPeriodicWave(A.pulseWave(.5));
    else if(A.chip==='chip_pulse') o.setPeriodicWave(A.pulseWave(.125));
    else if(A.chip==='chip_tri') o.type='triangle';
    else o.type='sawtooth';
    o.frequency.setValueAtTime(f,t);
    const peak=vel*.22;
    g.gain.setValueAtTime(.0001,t);
    g.gain.linearRampToValueAtTime(peak,t+.004);          /* immediate synth attack */
    g.gain.linearRampToValueAtTime(peak*.7,t+Math.min(.12,dur*.4));
    g.gain.setValueAtTime(peak*.7,t+Math.max(.06,dur-.05));
    g.gain.linearRampToValueAtTime(.0001,t+dur);          /* quick gated release */
    o.connect(g); g.connect(A.master); o.start(t); o.stop(t+dur+.02);
    A.reg(g,()=>{try{o.stop()}catch(e){}});
  },

  chord(midis,dur=1.5,vel=.6,when=0,arp=false){
    if(arp){ /* rapid arpeggiation: cycle chord tones fast enough to blend */
      const step=.035;
      for(let i=0;i<Math.floor(dur/step);i++) A.note(midis[i%midis.length],step*1.05,vel,when+i*step);
      return;
    }
    midis.forEach((m,i)=>A.note(m,dur,vel*(i===0?1:.82),when+i*.012));
  },
  seq(midis,gap=.26,dur=.5,vel=.7){ midis.forEach((m,i)=>A.note(m,dur,vel,i*gap)); },

  /* --- percussion, always synthesised --- */
  drum(kind,when=0,vel=1){
    A.init(); const t=A.ctx.currentTime+when, c=A.ctx;
    if(kind==='k'){
      const o=c.createOscillator(), g=c.createGain();
      o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(44,t+.11);
      g.gain.setValueAtTime(vel*.9,t); g.gain.exponentialRampToValueAtTime(.0001,t+.34);
      o.connect(g); g.connect(A.master); o.start(t); o.stop(t+.36);
    } else {
      const len=kind==='s'?.2:.055;
      const b=c.createBuffer(1,c.sampleRate*len,c.sampleRate), d=b.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
      const src=c.createBufferSource(); src.buffer=b;
      const f=c.createBiquadFilter(), g=c.createGain();
      if(kind==='s'){ f.type='bandpass'; f.frequency.value=1900; f.Q.value=.8; g.gain.value=vel*.5;
        const o=c.createOscillator(), og=c.createGain();
        o.type='triangle'; o.frequency.setValueAtTime(190,t);
        og.gain.setValueAtTime(vel*.34,t); og.gain.exponentialRampToValueAtTime(.0001,t+.13);
        o.connect(og); og.connect(A.master); o.start(t); o.stop(t+.15);
      } else { f.type='highpass'; f.frequency.value=7800; g.gain.value=vel*.3; }
      src.connect(f); f.connect(g); g.connect(A.master); src.start(t);
    }
  }
};

/* ============================================================
   2 · THEORY HELPERS
   ============================================================ */
let useFlats=false;
const pcName=pc=>(useFlats?OT.FLAT:OT.SHARP)[((pc%12)+12)%12];
const midiName=m=>pcName(m)+(Math.floor(m/12)-1);
const midiOf=(pc,oct)=>12*(oct+1)+pc;
const scaleById=id=>OT.SCALES.find(s=>s.id===id);
const chordById=id=>OT.CHORDS.find(c=>c.id===id);
const progById =id=>OT.PROGS.find(p=>p.id===id);

/* chord quality of each degree of a scale, derived from the scale itself */
function diatonic(iv,degIndex,size=4){
  const notes=[];
  for(let i=0;i<size;i++){
    const d=(degIndex+i*2);
    notes.push(iv[d%iv.length] + 12*Math.floor(d/iv.length));
  }
  return notes.map(n=>n-notes[0]);
}
function nameQuality(rel){
  const set=rel.slice(1).join(',');
  const map={'4,7':'','3,7':'m','3,6':'°','4,8':'+','4,7,11':'maj7','4,7,10':'7','3,7,10':'m7',
    '3,6,10':'m7♭5','3,6,9':'°7','3,7,11':'m(maj7)','2,7':'sus2','5,7':'sus4','4,7,9':'6','3,7,9':'m6'};
  return map[set]!==undefined?map[set]:'?';
}
const ROMAN=['I','II','III','IV','V','VI','VII'];
function romanFor(degIndex,quality){
  let r=ROMAN[degIndex%7];
  if(/^m|°/.test(quality)) r=r.toLowerCase();
  if(quality.indexOf('°')>-1) r+='°';
  else if(quality==='+') r+='+';
  else if(quality.indexOf('7')>-1) r+='7';
  return r;
}

/* ============================================================
   3 · THE STRING FIELD — the signature
   Fourteen strings fixed at both ends. Every note played
   anywhere in the app plucks one, and the number of nodes in
   the standing wave rises with pitch, exactly as it does on
   a real string. This is the harmonic series, drawn.
   ============================================================ */
const Strings={
  cv:null,ctx:null,w:0,h:0,S:[],t:0,raf:null,reduced:false,
  init(){
    Strings.cv=$('#strings'); if(!Strings.cv) return;
    Strings.ctx=Strings.cv.getContext&&Strings.cv.getContext('2d');
    if(!Strings.ctx) return;
    Strings.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for(let i=0;i<14;i++) Strings.S.push({amp:0,ph:Math.random()*6.28,n:i+1,hue:0});
    Strings.size(); addEventListener('resize',Strings.size,{passive:true});
    Strings.loop();
  },
  size(){
    if(!Strings.ctx) return;
    const d=Math.min(devicePixelRatio||1,2);
    Strings.w=innerWidth; Strings.h=innerHeight;
    Strings.cv.width=Strings.w*d; Strings.cv.height=Strings.h*d;
    Strings.cv.style.width=Strings.w+'px'; Strings.cv.style.height=Strings.h+'px';
    Strings.ctx.setTransform(d,0,0,d,0,0);
  },
  pluck(midi,vel,when=0){
    if(!Strings.S.length) return;
    const idx=clamp(Math.round((midi-30)/4.7),0,13);
    const go=()=>{ const s=Strings.S[idx];
      s.amp=Math.min(1,(s.amp||0)+vel*0.9);
      s.n=clamp(1+Math.floor((midi-28)/8),1,8);
      s.hue=midi%12; };
    when>0?setTimeout(go,when*1000):go();
  },
  loop(){
    const c=Strings.ctx; if(!c) return;
    Strings.t+=Strings.reduced?.004:.016;
    c.clearRect(0,0,Strings.w,Strings.h);
    const gap=Strings.h/15;
    for(let i=0;i<14;i++){
      const s=Strings.S[i], y0=gap*(i+1);
      const a=s.amp*(Strings.h*0.035);
      const base=0.055 + s.amp*0.5;
      c.beginPath();
      c.lineWidth=s.amp>.05?1.5:1;
      c.strokeStyle=`rgba(217,164,65,${base})`;
      const steps=Math.ceil(Strings.w/9);
      for(let j=0;j<=steps;j++){
        const x=(j/steps)*Strings.w;
        /* standing wave: fixed at both ends, n antinodes */
        const env=Math.sin(Math.PI*(x/Strings.w));
        const y=y0 + a*env*Math.sin(s.n*Math.PI*(x/Strings.w))*Math.cos(Strings.t*6+s.ph);
        j?c.lineTo(x,y):c.moveTo(x,y);
      }
      c.stroke();
      if(s.amp>.02){
        c.strokeStyle=`rgba(95,184,166,${s.amp*.28})`;
        c.lineWidth=3; c.stroke();
      }
      s.amp*=Strings.reduced?.90:.975;
      if(s.amp<.002) s.amp=0;
    }
    Strings.raf=requestAnimationFrame(Strings.loop);
  }
};

/* ============================================================
   4 · THE KEYBED — a playable piano docked on every view
   ============================================================ */
const KB={
  oct:3, labels:store.get('kblab','names'), held:new Set(), scale:null, root:0, spans:3,
  vel:.78, chordMode:false, snap:false, down:false, latched:new Set(),
  WHITE:[0,2,4,5,7,9,11], BLACKAFTER:[0,1,3,4,5],
  octaves(){ return innerWidth<620?2:3; },
  lbl(midi){
    if(KB.labels==='off') return '';
    if(KB.labels==='deg'){
      const sc=KB.scale?scaleById(KB.scale):null; if(!sc) return '';
      const k=sc.iv.indexOf((((midi%12)-KB.root)%12+12)%12);
      return k>-1?sc.deg[k]:'';
    }
    return midiName(midi);
  },
  render(){
    const k=$('#keys'); if(!k) return;
    KB.spans=KB.octaves();
    let html='';
    const whiteCount=KB.spans*7;
    k.style.setProperty('--wc',whiteCount);
    for(let o=0;o<KB.spans;o++){
      for(let w=0;w<7;w++){
        const midi=midiOf(KB.WHITE[w],KB.oct+o);
        html+=`<div class="wk" data-m="${midi}"><span class="lbl">${esc(KB.lbl(midi))}</span></div>`;
      }
    }
    let blacks='';
    for(let o=0;o<KB.spans;o++){
      KB.BLACKAFTER.forEach(bi=>{
        const wIndex=o*7+bi;
        const midi=midiOf(KB.WHITE[bi]+1,KB.oct+o);
        const left=((wIndex+1)*(100/whiteCount));
        blacks+=`<div class="bk" data-m="${midi}" style="left:calc(${left}% - (100%/${whiteCount}*0.31))">
          <span class="lbl">${esc(KB.labels==='names'?pcName(midi):KB.lbl(midi))}</span></div>`;
      });
    }
    k.innerHTML=html+blacks;
    $('#octLbl').textContent='C'+KB.oct;
    KB.paint(); KB.syncBtns();
  },
  paint(){
    const sc=KB.scale?scaleById(KB.scale):null;
    const pcs=sc?sc.iv.map(i=>(KB.root+i)%12):null;
    $$('#keys [data-m]').forEach(el=>{
      const m=+el.dataset.m, pc=m%12;
      el.classList.toggle('lit', !!(pcs&&pcs.includes(pc)));
      el.classList.toggle('rt', !!(pcs&&pc===KB.root%12));
      el.classList.toggle('sus', KB.latched.has(m));
    });
  },
  syncBtns(){
    const set=(id,on)=>{ const b=$('#'+id); if(b) b.classList.toggle('on',!!on); };
    set('susBtn',A.sustain); set('holdBtn',A.hold);
    set('chordBtn',KB.chordMode); set('snapBtn',KB.snap);
    const lb=$('#labBtn');
    if(lb){ lb.textContent={names:'names',deg:'degrees',off:'no labels'}[KB.labels];
      lb.classList.toggle('on',KB.labels!=='off'); }
  },
  /* snap a pressed key to the nearest note of the current scale */
  fit(m){
    if(!KB.snap||!KB.scale) return m;
    const sc=scaleById(KB.scale), pcs=sc.iv.map(i=>(KB.root+i)%12);
    for(let d=0;d<=6;d++){
      if(pcs.includes(((m-d)%12+12)%12)) return m-d;
      if(pcs.includes(((m+d)%12+12)%12)) return m+d;
    }
    return m;
  },
  /* in chord mode a single key sounds the chord that degree carries in the key */
  chordFor(m){
    const sc=KB.scale?scaleById(KB.scale):null;
    if(!sc||sc.iv.length!==7) return [m,m+4,m+7];
    const k=sc.iv.indexOf((((m%12)-KB.root)%12+12)%12);
    if(k<0) return [m,m+4,m+7];
    return diatonic(sc.iv,k,3).map(r=>m+r);
  },
  hit(m,el){
    A.resume();
    m=KB.fit(m);
    if(A.hold&&KB.latched.has(m)){ KB.latched.delete(m); A.releaseAll(); KB.paint(); return; }
    if(KB.chordMode) A.chord(KB.chordFor(m),1.4,KB.vel*.8);
    else A.note(m,1.3,KB.vel);
    if(A.hold) KB.latched.add(m);
    $('#nowNote').textContent=midiName(m)+(KB.chordMode?' chord':'');
    const t=el||$(`#keys [data-m="${m}"]`);
    if(t){ t.classList.add('down'); setTimeout(()=>t.classList.remove('down'),160); }
    if(A.hold) KB.paint();
  },
  bind(){
    const k=$('#keys');
    const from=e=>{ const t=e.target.closest&&e.target.closest('[data-m]'); return t?+t.dataset.m:null; };
    k.addEventListener('pointerdown',e=>{ const m=from(e);
      if(m!=null){ e.preventDefault(); KB.down=true; KB.hit(m,e.target.closest('[data-m]')); } });
    /* drag across the keys to glissando */
    k.addEventListener('pointerover',e=>{ if(!KB.down) return;
      const m=from(e); if(m!=null) KB.hit(m,e.target.closest('[data-m]')); });
    addEventListener('pointerup',()=>{ KB.down=false; });
    addEventListener('pointercancel',()=>{ KB.down=false; });

    const MAP={a:0,w:1,s:2,e:3,d:4,f:5,t:6,g:7,y:8,h:9,u:10,j:11,k:12,o:13,l:14,p:15,';':16};
    addEventListener('keydown',e=>{
      if(e.metaKey||e.ctrlKey||e.altKey) return;
      if(/^(input|select|textarea)$/i.test(e.target.tagName)) return;
      if(e.code==='Space'){ e.preventDefault();
        if(!A.sustain){ A.sustain=true; KB.syncBtns(); } return; }
      if(e.repeat) return;
      if(e.key==='z'){ octShift(-1); return; }
      if(e.key==='x'){ octShift(1); return; }
      const off=MAP[e.key.toLowerCase()];
      if(off==null) return;
      e.preventDefault();
      const m=midiOf(0,KB.oct+1)+off;
      if(KB.held.has(m)) return; KB.held.add(m); KB.hit(m);
    });
    addEventListener('keyup',e=>{
      if(e.code==='Space'){ A.sustain=false; A.releaseAll(); KB.syncBtns(); return; }
      const off=MAP[e.key.toLowerCase()];
      if(off!=null) KB.held.delete(midiOf(0,KB.oct+1)+off);
    });
  },
  setScale(rootPc,scaleId){ KB.root=rootPc; KB.scale=scaleId; KB.paint(); }
};
function toggleSustain(){ A.sustain=!A.sustain; if(!A.sustain) A.releaseAll(); KB.syncBtns();
  toast(A.sustain?'Sustain on, or just hold the space bar':'Sustain off'); }
function toggleHold(){ A.hold=!A.hold;
  if(!A.hold){ A.releaseAll(); KB.latched.clear(); KB.paint(); }
  KB.syncBtns(); toast(A.hold?'Hold on: keys latch until pressed again':'Hold off'); }
function toggleChordMode(){ KB.chordMode=!KB.chordMode; KB.syncBtns();
  toast(KB.chordMode?'Chord mode: each key plays its chord in the current scale':'Single notes'); }
function toggleSnap(){ KB.snap=!KB.snap; KB.syncBtns();
  toast(KB.snap?'Snap on: every key bends to the nearest scale tone':'Snap off'); }
function cycleLabels(){ KB.labels={names:'deg',deg:'off',off:'names'}[KB.labels];
  store.set('kblab',KB.labels); KB.render(); }
function octShift(d){ KB.oct=clamp(KB.oct+d,1,6); KB.render(); }
function toggleKeybed(){
  const k=$('#keybed'); const hidden=k.classList.toggle('hide');
  $('#hideBtn').textContent=hidden?'show':'hide';
  document.body.style.setProperty('--keybed-h',hidden?'44px':'150px');
}

/* ============================================================
   5 · SOUND CONTROLS
   ============================================================ */
function buildInstSel(){
  const s=$('#instSel');
  s.innerHTML=`<optgroup label="Sampled instruments">${INSTRUMENTS.map(([v,n])=>
      `<option value="${v}">${esc(n)}</option>`).join('')}</optgroup>`+
    `<optgroup label="Synth voices">${CHIPS.map(([v,n])=>
      `<option value="${v}">${esc(n)}</option>`).join('')}</optgroup>`;
  s.value = A.mode==='chip'?A.chip:A.inst;
  s.onchange=()=>{
    const v=s.value;
    if(v.startsWith('chip_')){ A.chip=v; store.set('chip',v); setMode('chip',true); }
    else { A.inst=v; store.set('inst',v); setMode('sampled',true); A.load(v).then(()=>A.note(60,.9,.6)); }
  };
}
function setMode(m,quiet){
  A.mode=m;
  $('#mStudio').classList.toggle('on',m==='sampled');
  $('#mChip').classList.toggle('on',m==='chip');
  const s=$('#instSel'); if(s) s.value = m==='chip'?A.chip:A.inst;
  if(m==='sampled') A.load(A.inst);
  if(!quiet){ A.resume(); A.note(60,.9,.6); }
  updateInstUI();
}
function updateInstUI(){
  const s=$('#instSel'); if(!s) return;
  const st=A.state[A.inst];
  s.style.borderColor = (A.mode==='sampled'&&st==='loading') ? 'var(--brass-dim)' : '';
}
function toggleMute(){
  A.init(); A.muted=!A.muted;
  A.master.gain.setTargetAtTime(A.muted?0:.8,A.ctx.currentTime,.02);
  $('#volBtn').style.color=A.muted?'var(--wine)':'';
}

/* ============================================================
   6 · ROUTER
   ============================================================ */
const VIEWS=[
  ['home','Home','Start here','M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z'],
  ['lab','The Bench','Scales · chords · progressions','M4 20V10M10 20V4M16 20v-8M22 20v-4'],
  ['chords','Chord Book','Finger positions','M3 5v14M8 5v14M13 5v14M18 5v14M3 9h15M3 14h15'],
  ['ear','Ear Training','Seven drills','M12 3a7 7 0 0 0-7 7v5a3 3 0 0 0 3 3h1v-8H5M19 18a3 3 0 0 0 3-3v-5a7 7 0 0 0-7-7M19 10v8h-1'],
  ['rhythm','Rhythm Room','Metronome · sequencer','M12 2 6 22h12L12 2zM9 15h6M12 8v7'],
  ['perc','Practice Room','Rudiments · gap click','M4 14a8 8 0 0 1 16 0v3H4zM4 17v2M20 17v2M8 6l2 4M16 6l-2 4'],
  ['world','Around the World','Twelve traditions','M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20'],
  ['sketch','Sketchpad','Build a progression','M4 17V7m5 10V4m5 13V9m5 11V6'],
  ['enc','Encyclopedia','Plain-language reference','M4 4h11a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM4 4v14'],
  ['path','The Path','10 stages, in order','M12 4 2 9l10 5 10-5zM6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5']
];
function go(v){ location.hash=v; }
function route(){
  const v=(location.hash||'#home').slice(1).split('/')[0];
  const id=VIEWS.some(x=>x[0]===v)?v:'home';
  $$('.view').forEach(s=>s.classList.toggle('on',s.id==='v-'+id));
  $$('#railNav .rnav').forEach(t=>t.classList.toggle('on',t.dataset.v===id));
  scrollTo({top:0,behavior:'auto'});
  closeNav();
  if(id==='rhythm'&&!Rhythm.mounted){ Rhythm.mount(); Rhythm.mounted=true; }
  if(id==='chords'&&typeof Chords!=='undefined'&&!Chords.mounted){ Chords.mount(); Chords.mounted=true; }
  if(id==='perc'&&typeof Perc!=='undefined'&&!Perc.mounted){ Perc.mount(); Perc.mounted=true; }
  if(id!=='perc'&&typeof Perc!=='undefined') Perc.stopAll();
  if(id!=='sketch'&&typeof Sketch!=='undefined') Sketch.stop();
  store.set('lastView',id);
}
function buildTabs(){
  $('#railNav').innerHTML=VIEWS.map(([v,n,sub,path],i)=>
    `${i===6?'<div class="rail-sep"></div>':''}<a class="rnav" data-v="${v}" href="#${v}" onclick="closeNav()">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>
      <span><b>${esc(n)}</b><small>${esc(sub)}</small></span></a>`).join('');
}
function openNav(){ document.body.classList.add('nav');$('#menuBtn').setAttribute('aria-expanded','true'); }
function closeNav(){ document.body.classList.remove('nav');$('#menuBtn').setAttribute('aria-expanded','false'); }
$('#menuBtn').setAttribute('aria-controls','rail');$('#menuBtn').setAttribute('aria-expanded','false');
addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('nav')){closeNav();$('#menuBtn').focus()}});

/* ============================================================
   7 · HOME
   ============================================================ */
const GATES=[
  ['lab','The Bench','Scales, chords and progressions in any key, played, mapped and explained.','var(--brass)',
   'M4 20V10M10 20V4M16 20v-8M22 20v-4'],
  ['ear','Ear Training','Seven drills that turn listening into understanding. The skill everything else rests on.','var(--patina)',
   'M12 3a7 7 0 0 0-7 7v5a3 3 0 0 0 3 3h1v-8H5M19 18a3 3 0 0 0 3-3v-5a7 7 0 0 0-7-7M19 10v8h-1'],
  ['sketch','Progression Sketchpad','Build a four-chord loop in any key, hear it instantly, and learn the function of each chord.','var(--wine)',
   'M4 17V7m5 10V4m5 13V9m5 11V6'],
  ['perc','Practice Room','Rudiments, a gap click, polyrhythms and a subdivision ladder. For drummers.','var(--brass)',
   'M4 14a8 8 0 0 1 16 0v3H4zM4 17v2M20 17v2M8 6l2 4M16 6l-2 4']
];
function buildHome(){
  $('#gates').innerHTML=GATES.map(([v,t,d,acc,path])=>
    `<button class="gate" style="--acc:${acc}" onclick="go('${v}')">
      <span class="gi"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg></span>
      <h4>${esc(t)}</h4><p>${esc(d)}</p></button>`).join('');
  buildHomeStatus();
}
function buildHomeStatus(){
  const done=store.get('path',[]);
  const pct=Math.round(done.length/PATH.length*100);
  const open=PATH.findIndex((_,i)=>!done.includes(i));
  const next=open===-1?PATH.length-1:open;
  const best=Math.max(...Ear.drills.map(([id])=>store.get('best.'+id,0)),0);
  const el=$('#homeStatus'); if(!el) return;
  el.innerHTML=`<div class="home-status">
    <div class="hstat primary"><div class="copy"><span class="plabel">Continue learning</span><h3>${esc(PATH[next][0])}</h3><p>${esc(PATH[next][1])}</p></div><button class="btn btn-brass" onclick="go('path')">Open path</button></div>
    <div class="hstat"><span class="plabel">Learning path</span><div class="num">${pct}%</div><p>${done.length} of ${PATH.length} stages marked complete.</p><div class="practice-line"><i style="width:${pct}%"></i></div></div>
    <div class="hstat"><span class="plabel">Best ear streak</span><div class="num">${best}</div><p>Best saved streak across the ear-training drills.</p></div>
  </div>`;
}

function heroDemo(){
  A.resume();
  const root=60, prog=progById('royalroad');
  toast('Royal Road progression: a smooth IV–V–iii–vi loop common in Japanese pop.');
  let t=0;
  prog.steps.forEach(([deg,cid])=>{
    const ch=chordById(cid);
    A.chord(ch.iv.map(i=>root+deg+i-12),1.5,.5,t);
    t+=.9;
  });
  setTimeout(()=>A.seq([72,74,76,79,81].map(x=>x),.16,.5,.55),300);
}

/* ============================================================
   8 · THE BENCH
   ============================================================ */
const Lab={
  tab:'scales', root:0, scale:'ionian', chord:'maj', prog:'axis',
  inv:0, arp:false, bpm:88, playing:null,
  tabs:[['scales','Scales & modes'],['chords','Chords'],['progs','Progressions'],['circle','Circle of fifths']],
  mount(t){
    if(t) Lab.tab=t;
    $('#labTabs').innerHTML=Lab.tabs.map(([v,n])=>
      `<button class="chip ${v===Lab.tab?'on':''}" onclick="Lab.mount('${v}')">${esc(n)}</button>`).join('');
    ({scales:Lab.scales,chords:Lab.chords,progs:Lab.progs,circle:Lab.circle})[Lab.tab]();
  },
  keyRow(sel,fn){
    return `<div class="keyrow">${OT.SHARP.map((n,pc)=>
      `<button class="${[1,3,6,8,10].includes(pc)?'blk':''} ${pc===sel?'on':''}"
        onclick="${fn}(${pc})">${esc(pcName(pc))}</button>`).join('')}</div>`;
  },

  /* ---------- scales ---------- */
  scales(){
    const sc=scaleById(Lab.scale);
    const pcs=sc.iv.map(i=>(Lab.root+i)%12);
    KB.setScale(Lab.root,Lab.scale);
    const midis=sc.iv.map(i=>midiOf(Lab.root,4)+i).concat([midiOf(Lab.root,5)]);
    const heptatonic=sc.iv.length===7;
    const chords=!heptatonic?[]:sc.iv.map((_,i)=>{
      const rel=diatonic(sc.iv,i,4), q=nameQuality(rel);
      return {i, root:(Lab.root+sc.iv[i])%12, rel, q, roman:romanFor(i,q)};
    });
    $('#labBody').innerHTML=`
      <div class="grid2">
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="panel">
            <div class="panel-h"><span class="plabel">Root</span></div>
            ${Lab.keyRow(Lab.root,'Lab.setRoot')}
            <div class="panel-h" style="margin:20px 0 12px"><span class="plabel">Scale</span></div>
            <div class="row">${OT.SCALES.map(s=>
              `<button class="chip ${s.id===Lab.scale?'on':''}" onclick="Lab.setScale('${s.id}')">${esc(s.n)}</button>`).join('')}</div>
          </div>
          <div class="panel">
            <div class="panel-h">
              <h3>${esc(pcName(Lab.root))} ${esc(sc.n)}</h3>
              <button class="btn btn-brass" onclick="Lab.playScale()">Hear it</button>
              <button class="btn btn-ghost" onclick="Lab.playScale(true)">Down</button>
              <button class="chip ${Lab.ext?'on':''}" onclick="Lab.toggleExt()"
                title="Carry the run past the octave into the 9th, 10th and 11th">through the 9th</button>
            </div>
            <div class="degs">${sc.iv.map((iv,i)=>{
              const pc=(Lab.root+iv)%12;
              return `<button class="deg ${i===0?'root':''}" onclick="A.resume();A.note(${midiOf(Lab.root,4)+iv},1,.8)">
                <b>${esc(pcName(pc))}</b><i>${esc(sc.deg[i])}</i></button>`;}).join('')}
              <button class="deg root" onclick="A.resume();A.note(${midiOf(Lab.root,5)},1,.8)">
                <b>${esc(pcName(Lab.root))}</b><i>8</i></button>
              ${Lab.ext?sc.iv.slice(1).filter(i=>i<=5).map((iv,k)=>{
                const pc=(Lab.root+iv)%12;
                return `<button class="deg" style="opacity:.72" onclick="A.resume();A.note(${midiOf(Lab.root,5)+iv},1,.8)">
                  <b>${esc(pcName(pc))}</b><i>${[9,10,11][k]||''}</i></button>`;}).join(''):''}
            </div>
            <div class="staffbox">${typeof Staff!=='undefined'?Staff.render(
                sc.iv.map(i=>midiOf(Lab.root,4)+i).concat([midiOf(Lab.root,5)]),
                {clef:'treble',alt:esc(pcName(Lab.root)+' '+sc.n)+' on the staff'}):''}</div>
            <p class="hint" style="margin-top:10px">Highlighted on the keyboard below, and written on the staff above.
               Tap a degree to hear it alone.</p>
          </div>
          ${!heptatonic?`<div class="panel">
            <div class="panel-h"><span class="plabel">Chords</span></div>
            <p class="note-txt">This scale does not have seven notes, so stacking thirds does not produce a
            tidy set of chords the way the major scale does. It is used as melodic colour over harmony
            borrowed from elsewhere, which is exactly why it survives on instruments with very few voices.</p>
          </div>`:`
          <div class="panel">
            <div class="panel-h"><span class="plabel">Chords that live in this scale</span></div>
            <div class="degs">${chords.map(c=>
              `<button class="deg" onclick="Lab.playDiatonic(${c.i})">
                <b>${esc(pcName(c.root))}${esc(c.q)}</b><i>${esc(c.roman)}</i></button>`).join('')}</div>
            <p class="hint" style="margin-top:12px">Built by stacking every other note of the scale. This is where progressions come from.</p>
          </div>`}
        </div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="panel">
            <p class="note-txt"><span class="kv">What it is</span>${esc(sc.read)}</p>
            <p class="note-txt"><span class="kv">Where you hear it</span>${esc(sc.ctx)}</p>
            <p class="note-txt"><span class="kv">The trap</span><b>${esc(sc.trap)}</b></p>
          </div>
        </div>
      </div>`;
  },
  setRoot(pc){ Lab.root=pc; useFlats=OT.FLAT_KEYS.includes(pc); Lab.mount(); Lab.playScale(); },
  setScale(id){ Lab.scale=id; Lab.mount(); Lab.playScale(); },
  ext:store.get('ext9',true),
  scaleRun(root,id,oct){
    const sc=scaleById(id); const base=midiOf(root,oct||4);
    let m=sc.iv.map(i=>base+i);
    m.push(base+12);                                  /* the octave */
    if(Lab.ext){                                      /* keep climbing into the next one */
      sc.iv.slice(1).forEach(i=>{ if(i<=5) m.push(base+12+i); });
    }
    return m;
  },
  toggleExt(){ Lab.ext=!Lab.ext; store.set('ext9',Lab.ext); Lab.mount(); Lab.playScale(); },
  playScale(down){
    A.resume();
    let m=Lab.scaleRun(Lab.root,Lab.scale);
    if(down) m=m.slice().reverse();
    A.seq(m,.2,.44,.72);
  },
  playDiatonic(i){
    A.resume();
    const sc=scaleById(Lab.scale);
    const rel=diatonic(sc.iv,i,4);
    const base=midiOf(Lab.root,3)+sc.iv[i];
    A.chord(rel.map(r=>base+r),1.6,.6,0,A.mode==='chip'&&Lab.arp);
  },

  /* ---------- chords ---------- */
  chords(){
    const ch=chordById(Lab.chord);
    KB.setScale(Lab.root,null);
    const notes=Lab.voiced();
    $('#labBody').innerHTML=`
      <div class="grid2">
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="panel">
            <div class="panel-h"><span class="plabel">Root</span></div>
            ${Lab.keyRow(Lab.root,'Lab.setChordRoot')}
            <div class="panel-h" style="margin:20px 0 12px"><span class="plabel">Chord</span></div>
            <div class="row">${OT.CHORDS.map(c=>
              `<button class="chip ${c.id===Lab.chord?'on':''}" onclick="Lab.setChord('${c.id}')">${esc(c.n)}</button>`).join('')}</div>
          </div>
          <div class="panel">
            <div class="panel-h">
              <h3>${esc(pcName(Lab.root))}${esc(ch.sym)}</h3>
              <button class="btn btn-brass" onclick="Lab.playChord()">Play</button>
              <button class="btn btn-ghost" onclick="Lab.playChord(true)">Arpeggiate</button>
            </div>
            <div class="row" style="margin-bottom:14px">
              <span class="plabel">Inversion</span>
              ${[0,1,2,3].filter(i=>i<ch.iv.length).map(i=>
                `<button class="chip ${i===Lab.inv?'on':''}" onclick="Lab.setInv(${i})">${i===0?'Root':i+(i===1?'st':i===2?'nd':'rd')}</button>`).join('')}
              ${A.mode==='chip'?`<button class="chip pat ${Lab.arp?'on':''}" onclick="Lab.toggleArp()">Rapid arpeggio</button>`:''}
            </div>
            <div class="degs">${notes.map((m,i)=>
              `<button class="deg ${i===0?'root':''}" onclick="A.resume();A.note(${m},1.1,.8)">
                <b>${esc(pcName(m))}</b><i>${esc(midiName(m))}</i></button>`).join('')}</div>
            <div class="staffbox">${typeof Staff!=='undefined'?Staff.render(notes,
              {clef:Staff.auto(notes),alt:esc(Chords?'':'')+'chord on the staff'}):''}</div>
          </div>
        </div>
        <div class="panel">
          <p class="note-txt"><span class="kv">What it is</span>${esc(ch.read)}</p>
          <p class="note-txt"><span class="kv">Where you hear it</span>${esc(ch.ctx)}</p>
          <p class="note-txt"><span class="kv">The trap</span><b>${esc(ch.trap)}</b></p>
          <p class="note-txt" style="border-top:1px solid var(--line);padding-top:13px">
            <span class="kv">Intervals from the root</span>
            ${chordById(Lab.chord).iv.map(i=>{
              const iv=OT.INTERVALS.find(x=>x.s===i%12);
              return esc(iv?iv.n:i+' semitones');}).join(' · ')}</p>
        </div>
      </div>`;
  },
  voiced(){
    const ch=chordById(Lab.chord);
    let n=ch.iv.map(i=>midiOf(Lab.root,4)+i);
    for(let k=0;k<Lab.inv;k++){ n.push(n.shift()+12); }
    return n;
  },
  setChordRoot(pc){ Lab.root=pc; useFlats=OT.FLAT_KEYS.includes(pc); Lab.mount(); Lab.playChord(); },
  setChord(id){ Lab.chord=id; Lab.inv=0; Lab.mount(); Lab.playChord(); },
  setInv(i){ Lab.inv=i; Lab.mount(); Lab.playChord(); },
  toggleArp(){ Lab.arp=!Lab.arp; Lab.mount(); Lab.playChord(); },
  playChord(arp){
    A.resume();
    const n=Lab.voiced();
    if(arp) A.seq(n,.14,.7,.72);
    else A.chord(n,1.7,.62,0,A.mode==='chip'&&Lab.arp);
  },

  /* ---------- progressions ---------- */
  progs(){
    const p=progById(Lab.prog);
    KB.setScale(Lab.root,null);
    $('#labBody').innerHTML=`
      <div class="grid2">
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="panel">
            <div class="panel-h"><span class="plabel">Key</span></div>
            ${Lab.keyRow(Lab.root,'Lab.setProgRoot')}
            <div class="panel-h" style="margin:20px 0 12px"><span class="plabel">Progression</span></div>
            <div class="row">${OT.PROGS.map(x=>
              `<button class="chip ${x.id===Lab.prog?'on':''}" onclick="Lab.setProg('${x.id}')">${esc(x.n)}</button>`).join('')}</div>
          </div>
          <div class="panel">
            <div class="panel-h">
              <h3>${esc(p.n)} <span style="color:var(--faint);font-size:.9rem">in ${esc(pcName(Lab.root))}</span></h3>
              <button class="btn btn-brass" id="progBtn" onclick="Lab.toggleProg()">Play loop</button>
            </div>
            <div class="degs" id="progSteps">${p.steps.map((s,i)=>{
              const ch=chordById(s[1]);
              return `<button class="deg" data-step="${i}" onclick="Lab.playStep(${i})">
                <b>${esc(pcName(Lab.root+s[0]))}${esc(ch.sym)}</b><i>${esc(Lab.roman(s))}</i></button>`;}).join('')}</div>
            <div class="row" style="margin-top:18px;gap:14px">
              <span class="plabel">Tempo</span>
              <input type="range" min="50" max="160" value="${Lab.bpm}" style="flex:1;min-width:140px"
                oninput="Lab.bpm=+this.value;$('#bpmOut').textContent=this.value">
              <span class="hint" id="bpmOut">${Lab.bpm}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="panel">
            <p class="note-txt"><span class="kv">What it is</span>${esc(p.read)}</p>
            <p class="note-txt"><span class="kv">Why it works</span>${esc(p.ctx)}</p>
            <p class="note-txt"><span class="kv">The trap</span><b>${esc(p.trap)}</b></p>
          </div>
        </div>
      </div>`;
  },
  roman(step){
    const ch=chordById(step[1]);
    const degMap={0:'I',2:'II',3:'♭III',4:'III',5:'IV',7:'V',8:'♭VI',9:'VI',10:'♭VII',11:'VII'};
    let r=degMap[step[0]]||'?';
    if(/^m|°/.test(ch.sym)||ch.id==='min'||ch.id==='m7'||ch.id==='m7b5') r=r.toLowerCase();
    return r+(ch.sym==='7'?'7':ch.sym==='maj7'?'maj7':ch.sym==='m7'?'7':'');
  },
  setProgRoot(pc){ Lab.root=pc; useFlats=OT.FLAT_KEYS.includes(pc); Lab.mount(); },
  setProg(id){ Lab.prog=id; Lab.stopProg(); Lab.mount(); },
  playStep(i){
    A.resume();
    const p=progById(Lab.prog), s=p.steps[i], ch=chordById(s[1]);
    /* keep every voicing inside one octave band so the bass does not jump around */
    const base=midiOf(Lab.root,3)+s[0];
    A.chord(ch.iv.map(x=>base+x),1.6,.55);
    A.note(base-12,1.6,.5);
    $$('#progSteps .deg').forEach(d=>d.classList.toggle('root',+d.dataset.step===i));
  },
  toggleProg(){ Lab.playing?Lab.stopProg():Lab.startProg(); },
  startProg(){
    A.resume();
    const p=progById(Lab.prog);
    let i=0;
    const tick=()=>{ Lab.playStep(i); i=(i+1)%p.steps.length; };
    tick();
    Lab.playing=setInterval(tick,(60/Lab.bpm)*1000*2);
    const b=$('#progBtn'); if(b){ b.textContent='Stop'; b.classList.remove('btn-brass'); b.classList.add('btn-ghost'); }
  },
  stopProg(){
    if(Lab.playing) clearInterval(Lab.playing);
    Lab.playing=null;
    const b=$('#progBtn'); if(b){ b.textContent='Play loop'; b.classList.add('btn-brass'); b.classList.remove('btn-ghost'); }
  },

  /* ---------- circle of fifths ---------- */
  circle(){
    KB.setScale(Lab.root,'ionian');
    const R=200,ri=118,rm=88;
    let segs='';
    OT.CIRCLE.forEach((k,i)=>{
      const a0=(i*30-105)*Math.PI/180, a1=((i+1)*30-105)*Math.PI/180;
      const p=(r,a)=>[R+r*Math.cos(a),R+r*Math.sin(a)];
      const [x1,y1]=p(R-6,a0),[x2,y2]=p(R-6,a1),[x3,y3]=p(ri,a1),[x4,y4]=p(ri,a0);
      const mid=(a0+a1)/2;
      const [tx,ty]=p((R-6+ri)/2,mid), [mx,my]=p((ri+rm)/2+8,mid);
      const on=k.pc===Lab.root;
      segs+=`<g class="seg ${on?'on':''}" onclick="Lab.setCircle(${k.pc})">
        <path class="segbg" d="M${x1} ${y1} A${R-6} ${R-6} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${ri} ${ri} 0 0 0 ${x4} ${y4} Z"
          fill="${on?'var(--brass-glow)':'var(--panel)'}" stroke="${on?'var(--brass)':'var(--line)'}"/>
        <text x="${tx}" y="${ty+6}" text-anchor="middle" font-size="19" fill="${on?'#d9a441':'#f3ecdd'}">${esc(k.maj)}</text>
        <text x="${mx}" y="${my+4}" text-anchor="middle" font-size="11" fill="#ab9e8c">${esc(k.min)}</text>
      </g>`;
    });
    const cur=OT.CIRCLE.find(k=>k.pc===Lab.root)||OT.CIRCLE[0];
    $('#labBody').innerHTML=`
      <div class="grid2">
        <div class="panel">
          <svg class="cof" viewBox="0 0 400 400" role="img" aria-label="Circle of fifths">
            ${segs}
            <circle cx="200" cy="200" r="66" fill="var(--wood)" stroke="var(--line)"/>
            <text x="200" y="192" text-anchor="middle" font-size="30" fill="#d9a441">${esc(cur.maj)}</text>
            <text x="200" y="216" text-anchor="middle" font-size="12" fill="#ab9e8c">${esc(cur.min)} · ${esc(cur.sig)}</text>
          </svg>
          <p class="hint" style="text-align:center;margin-top:10px">Tap a key to hear its tonic chord. Neighbours differ by one accidental.</p>
        </div>
        <div class="panel">
          <p class="note-txt"><span class="kv">What you are looking at</span>
            Twelve keys arranged so each step clockwise is a perfect fifth up. Because that is the strongest
            root motion in tonal music, keys that sit next to each other share almost all their notes.</p>
          <p class="note-txt"><span class="kv">Why it is useful</span>
            It answers three questions at once: which sharps or flats a key has, what its relative minor is,
            and which keys you can modulate to without the join showing. Anything adjacent is a smooth move.</p>
          <p class="note-txt"><span class="kv">The trap</span><b>It is a map, not a rule. Distant modulations are
            perfectly usable; they just need preparation, or the deliberate shock of having none.</b></p>
          <div class="row" style="margin-top:16px">
            <button class="btn btn-brass" onclick="Lab.circleWalk()">Walk the circle</button>
            <button class="btn btn-ghost" onclick="Lab.mount('scales')">Open this key in scales</button>
          </div>
        </div>
      </div>`;
  },
  setCircle(pc){
    Lab.root=pc; useFlats=OT.FLAT_KEYS.includes(pc); A.resume();
    A.chord([0,4,7].map(i=>midiOf(pc,4)+i),1.6,.6);
    Lab.circle();
  },
  circleWalk(){
    A.resume();
    OT.CIRCLE.forEach((k,i)=>{
      setTimeout(()=>{ Lab.root=k.pc; useFlats=OT.FLAT_KEYS.includes(k.pc);
        A.chord([0,4,7].map(x=>midiOf(k.pc,4)+x),.8,.5); Lab.circle(); },i*620);
    });
  }
};

/* ============================================================
   9 · FRETBOARD
   ============================================================ */
/* ============================================================
   10 · EAR TRAINING
   ============================================================ */
const Ear={
  drill:'interval', q:null, score:0, streak:0, locked:false,
  drills:[['interval','Intervals'],['chord','Chord quality'],['scale','Scales & modes'],
    ['prog','Progressions'],['meter','Time signatures'],['read','Read the staff'],['pitch','Name the note']],
  mount(g){
    if(g){ Ear.drill=g; Ear.score=0; Ear.streak=0; }
    const best=store.get('best.'+Ear.drill,0);
    $('#earBody').innerHTML=`
      <div class="row" style="margin-bottom:18px">${Ear.drills.map(([v,n])=>
        `<button class="chip ${v===Ear.drill?'on':''}" onclick="Ear.mount('${v}')">${esc(n)}</button>`).join('')}</div>
      <div class="panel" style="max-width:660px;margin:0 auto">
        <div class="score-bar">
          <span>Score <b>${Ear.score}</b></span>
          <span>Streak <b class="st">${Ear.streak}</b></span>
          <span>Best <b>${best}</b></span>
        </div>
        <div class="staffbox" id="earStaff" style="display:${Ear.drill==='read'?'block':'none'}"></div>
        <div style="text-align:center;margin:20px 0">
          <button class="btn btn-brass" onclick="Ear.play()" id="earPlay">${Ear.drill==='read'?'Hear it':'Play it'}</button>
          <button class="btn btn-ghost" onclick="Ear.next()">Skip</button>
        </div>
        <div class="answers" id="earAns"></div>
        <p class="fb-msg" id="earMsg"></p>
        <p class="hint" style="text-align:center;margin-top:16px">${esc(Ear.blurb())}</p>
      </div>`;
    Ear.next();
  },
  blurb(){
    return ({
      interval:'Sing the answer back before you click. Producing the interval trains recognition faster than hearing it.',
      chord:'Listen for the third first: it decides major or minor before anything else.',
      scale:'Find the degree that sounds unusual. One altered note is usually the whole identity of a mode.',
      prog:'Track the bass line. Root motion identifies a progression faster than the chords on top.',
      read:'Every Good Boy Deserves Fudge for the lines, FACE for the spaces. Say the landmark note nearest it, then step.',
      meter:'Count along out loud. Find the beat that feels strongest. That is beat one, and the gap between them is your answer.',
      pitch:'This one rewards absolute pitch, which most people do not have. Treat a lucky streak as luck.'
    })[Ear.drill];
  },
  pick(arr,n){
    const p=[...arr].sort(()=>Math.random()-.5).slice(0,n);
    return p;
  },
  next(){
    Ear.locked=false;
    const g=Ear.drill;
    if(g==='interval'){
      const pool=OT.INTERVALS.filter(i=>i.s>0&&i.s<=12);
      const opts=Ear.pick(pool,6), ans=opts[Math.floor(Math.random()*opts.length)];
      Ear.q={ans, opts, root:60+Math.floor(Math.random()*7)};
      Ear.paint(opts.map(o=>[o.n,o.sh===ans.sh]));
    } else if(g==='chord'){
      const pool=OT.CHORDS.filter(c=>['maj','min','dim','aug','7','maj7','m7','m7b5','dim7','sus4'].includes(c.id));
      const opts=Ear.pick(pool,6), ans=opts[Math.floor(Math.random()*opts.length)];
      Ear.q={ans,opts,root:57+Math.floor(Math.random()*10)};
      Ear.paint(opts.map(o=>[o.n,o.id===ans.id]));
    } else if(g==='scale'){
      const pool=OT.SCALES.filter(s=>['ionian','aeolian','dorian','phrygian','lydian','mixolydian','harmonic','minpent','blues','wholetone'].includes(s.id));
      const opts=Ear.pick(pool,5), ans=opts[Math.floor(Math.random()*opts.length)];
      Ear.q={ans,opts,root:55+Math.floor(Math.random()*10)};
      Ear.paint(opts.map(o=>[o.n,o.id===ans.id]));
    } else if(g==='prog'){
      const pool=OT.PROGS.filter(p=>p.steps.length<=4);
      const opts=Ear.pick(pool,5), ans=opts[Math.floor(Math.random()*opts.length)];
      Ear.q={ans,opts,root:55+Math.floor(Math.random()*8)};
      Ear.paint(opts.map(o=>[o.n,o.id===ans.id]));
    } else if(g==='read'){
      const clef=Math.random()<.5?'treble':'bass';
      const lo=clef==='bass'?41:57, midi=lo+Math.floor(Math.random()*17);
      Ear.q={ans:midi,clef};
      Ear.paint(OT.SHARP.filter((n,i)=>!Staff.ALTER[i]).map(n=>[n,n===pcName(midi)]));
    } else if(g==='meter'){
      const opts=Ear.pick(OT.METERS,5), ans=opts[Math.floor(Math.random()*opts.length)];
      Ear.q={ans,opts};
      Ear.paint(opts.map(o=>[o.n,o.n===ans.n]));
    } else {
      const pc=Math.floor(Math.random()*12);
      Ear.q={ans:pc,root:midiOf(pc,4)};
      Ear.paint(OT.SHARP.map((n,i)=>[n,i===pc]));
    }
    $('#earMsg').textContent='';
    const st=$('#earStaff');
    if(st) st.innerHTML = Ear.drill==='read'
      ? Staff.render([Ear.q.ans],{clef:Ear.q.clef,alt:'Name this note'}) : '';
    setTimeout(Ear.play,220);
  },
  paint(opts){
    $('#earAns').innerHTML=opts.map(([label,correct],i)=>
      `<button data-ok="${correct?1:0}" onclick="Ear.answer(this)">${esc(label)}</button>`).join('');
  },
  play(){
    A.resume(); const q=Ear.q, g=Ear.drill; if(!q) return;
    if(g==='interval'){ A.note(q.root,.8,.75); A.note(q.root+q.ans.s,.8,.75,.55);
      setTimeout(()=>A.chord([q.root,q.root+q.ans.s],1.2,.55),1300); }
    else if(g==='chord'){ A.chord(q.ans.iv.map(i=>q.root+i),1.7,.6); }
    else if(g==='scale'){ A.seq(q.ans.iv.map(i=>q.root+i).concat([q.root+12]),.2,.4,.7); }
    else if(g==='prog'){ q.ans.steps.forEach(([d,c],i)=>{
        const ch=chordById(c); A.chord(ch.iv.map(x=>q.root+d+x),1.3,.5,i*.75); }); }
    else if(g==='meter'){ Ear.playMeter(q.ans); }
    else if(g==='read'){ A.note(q.ans,1.4,.8); }
    else { A.note(q.root,1.4,.8); }
  },
  /* two bars of the meter: accent on one, a lighter tick on each group boundary */
  playMeter(m){
    const spb=.44, bars=2;
    for(let b=0;b<bars;b++){
      let beat=0;
      m.group.forEach(g=>{
        for(let i=0;i<g;i++){
          const when=(b*m.beats+beat)*spb;
          const first=(beat===0), groupStart=(i===0);
          A.drum(first?'k':groupStart?'s':'h',when,first?1:groupStart?.55:.4);
          beat++;
        }
      });
    }
  },
  answer(btn){
    if(Ear.locked) return; Ear.locked=true;
    const ok=btn.dataset.ok==='1';
    $$('#earAns button').forEach(b=>{ if(b.dataset.ok==='1') b.classList.add('right'); });
    if(!ok) btn.classList.add('wrong');
    if(ok&&Ear.drill==='meter'&&Ear.q.ans.hint) $('#earMsg').textContent=Ear.q.ans.hint;
    if(ok){ Ear.score++; Ear.streak++;
      const best=store.get('best.'+Ear.drill,0);
      if(Ear.streak>best) store.set('best.'+Ear.drill,Ear.streak);
      $('#earMsg').textContent=['Correct.','Yes.','That is it.','Clean.'][Math.floor(Math.random()*4)];
    } else {
      Ear.streak=0;
      $('#earMsg').textContent='Not that one. Listen again before moving on.';
    }
    $$('.score-bar b')[0].textContent=Ear.score;
    $$('.score-bar b')[1].textContent=Ear.streak;
    $$('.score-bar b')[2].textContent=store.get('best.'+Ear.drill,0);
    setTimeout(Ear.next,ok?1000:2100);
  }
};

/* ============================================================
   11 · RHYTHM ROOM
   ============================================================ */
const Rhythm={
  bpm:100, sig:4, sub:1, running:false, timer:null, step:0, accent:true,
  seqOn:false, seqTimer:null, seqStep:0, swing:0, beats:4, cat:'all',
  pattern:{k:[],s:[],h:[]}, steps:16, mounted:false,
  res(){ return Math.max(1,Math.round(Rhythm.steps/Rhythm.beats)); },
  mount(){
    if(!Rhythm.pattern.k.length) Rhythm.loadPreset('rock');
    Rhythm.render();
  },
  render(){
    Rhythm.mounted=true;
    $('#rhythmBody').innerHTML=`
      <div class="grid2">
        <div class="panel">
          <div class="panel-h"><h3>Metronome</h3><span class="plabel">${Rhythm.sig}/4</span></div>
          <div style="text-align:center">
            <div class="bpm-big" id="bpmBig">${Rhythm.bpm}</div>
            <div class="plabel" style="margin-bottom:16px">beats per minute</div>
            <input type="range" min="30" max="220" value="${Rhythm.bpm}" oninput="Rhythm.setBpm(+this.value)">
            <div class="metro-dots" id="dots"></div>
            <div class="row" style="justify-content:center">
              <button class="btn btn-brass" id="metroBtn" onclick="Rhythm.toggle()">Start</button>
              <button class="btn btn-ghost" onclick="Rhythm.tap()">Tap tempo</button>
            </div>
          </div>
          <div class="row" style="margin-top:20px"><span class="plabel">Time</span>
            ${[2,3,4,5,6,7,9,11,12].map(n=>`<button class="chip ${n===Rhythm.sig?'on':''}"
              onclick="Rhythm.setSig(${n})">${n}/4</button>`).join('')}</div>
          <div class="row" style="margin-top:12px"><span class="plabel">Subdivide</span>
            ${[[1,'Quarter'],[2,'Eighth'],[3,'Triplet'],[4,'Sixteenth']].map(([v,n])=>
              `<button class="chip pat ${v===Rhythm.sub?'on':''}" onclick="Rhythm.setSub(${v})">${n}</button>`).join('')}</div>
        </div>
        <div class="panel">
          <p class="note-txt"><span class="kv">Why subdivision matters</span>
            Perceived speed comes from how densely the beat is filled, not from the tempo number. A slow track
            full of sixteenths feels faster than a quick one that only plays quarters. Practise switching
            subdivision without changing the tempo and your internal clock gets far more stable.</p>
          <p class="note-txt"><span class="kv">Using the accent</span>
            The first beat of every bar is louder. That is what tells a listener where the bar starts.
            Remove it and 3/4 and 4/4 become indistinguishable.</p>
          <p class="note-txt"><span class="kv">The trap</span><b>Practising only with a click on every beat
            teaches you to follow rather than to keep time. Set it to sound on beat one only and you will find
            out very quickly whether the pulse is actually internal.</b></p>
        </div>
      </div>

      <div class="panel" style="margin-top:14px">
        <div class="panel-h"><h3>Step sequencer</h3>
          <button class="btn btn-brass" id="seqBtn" onclick="Rhythm.toggleSeq()">Play pattern</button></div>
        <div class="row" style="margin-bottom:10px"><span class="plabel">Family</span>
          ${Rhythm.cats().map(c=>`<button class="chip pat ${c===Rhythm.cat?'on':''}"
            onclick="Rhythm.setCat('${c}')">${esc(c==='all'?'All '+OT.RHYTHMS.length:c)}</button>`).join('')}
        </div>
        <div class="row" style="margin-bottom:16px"><span class="plabel">Grooves</span>
          ${OT.RHYTHMS.filter(r=>Rhythm.cat==='all'||r.cat===Rhythm.cat)
            .map(r=>`<button class="chip" onclick="Rhythm.loadPreset('${r.id}')" title="${esc(r.sig)}">${esc(r.n)}</button>`).join('')}
          <button class="chip pat" onclick="Rhythm.clear()">Clear</button>
        </div>
        <div class="seq" id="seq"></div>
        <div class="row" style="margin-top:16px;gap:14px">
          <span class="plabel">Swing</span>
          <input type="range" min="0" max="60" value="${Rhythm.swing}" style="flex:1;max-width:220px"
            oninput="Rhythm.swing=+this.value;$('#swingOut').textContent=this.value+'%'">
          <span class="hint" id="swingOut">${Rhythm.swing}%</span>
          <span class="hint" style="margin-left:auto">Tap any cell to edit the groove</span>
        </div>
        <p class="note-txt" style="margin-top:16px" id="rhythmNote"></p>
      </div>`;
    Rhythm.dots(); Rhythm.grid();
  },
  dots(){
    $('#dots').innerHTML=Array.from({length:Rhythm.sig},(_,i)=>
      `<i class="${i===0?'acc':''}" data-b="${i}"></i>`).join('');
  },
  grid(){
    const lanes=[['k','Kick'],['s','Snare'],['h','Hat']];
    $('#seq').innerHTML=lanes.map(([id,n])=>
      `<div class="seq-row" style="--steps:${Rhythm.steps}">
        <span class="lane">${n}</span>
        ${Rhythm.pattern[id].map((v,i)=>
          `<button class="step ${v?'on':''} ${id==='s'?'sn':id==='h'?'hh':''}" data-l="${id}" data-i="${i}"
            onclick="Rhythm.tog('${id}',${i})" aria-label="${n} step ${i+1}"></button>`).join('')}
      </div>`).join('');
  },
  cats(){ return ['all',...new Set(OT.RHYTHMS.map(r=>r.cat))]; },
  setCat(c){ Rhythm.cat=c; Rhythm.render(); },
  loadPreset(id){
    const r=OT.RHYTHMS.find(x=>x.id===id); if(!r) return;
    Rhythm.pattern={k:[...r.k],s:[...r.s],h:[...r.h]};
    Rhythm.steps=r.k.length; Rhythm.bpm=r.bpm; Rhythm.beats=r.beats||4;
    const sigTop=parseInt(r.sig,10); if(sigTop>=2&&sigTop<=12) Rhythm.sig=sigTop;
    Rhythm.render();
    const n=$('#rhythmNote');
    if(n) n.innerHTML=`<span class="kv">${esc(r.n)} · ${esc(r.sig)}</span>${esc(r.read)}
      <br><br>${esc(r.ctx)} <b>${esc(r.trap)}</b>`;
  },
  clear(){ const z=Array(Rhythm.steps).fill(0);
    Rhythm.pattern={k:[...z],s:[...z],h:[...z]}; Rhythm.grid(); },
  tog(l,i){ Rhythm.pattern[l][i]=Rhythm.pattern[l][i]?0:1;
    A.resume(); if(Rhythm.pattern[l][i]) A.drum(l);
    $(`.step[data-l="${l}"][data-i="${i}"]`).classList.toggle('on',!!Rhythm.pattern[l][i]); },
  setBpm(v){ Rhythm.bpm=v; $('#bpmBig').textContent=v;
    if(Rhythm.running){ Rhythm.stop(); Rhythm.start(); }
    if(Rhythm.seqOn){ Rhythm.stopSeq(); Rhythm.startSeq(); } },
  setSig(n){ Rhythm.sig=n; Rhythm.step=0; Rhythm.render(); },
  setSub(n){ Rhythm.sub=n; Rhythm.render(); if(Rhythm.running){ Rhythm.stop(); Rhythm.start(); } },
  toggle(){ Rhythm.running?Rhythm.stop():Rhythm.start(); },
  start(){
    A.resume(); Rhythm.running=true; Rhythm.step=0;
    const iv=(60/Rhythm.bpm)*1000/Rhythm.sub;
    const tick=()=>{
      const beat=Math.floor(Rhythm.step/Rhythm.sub)%Rhythm.sig;
      const onBeat=Rhythm.step%Rhythm.sub===0;
      const acc=beat===0&&onBeat;
      A.init();
      const o=A.ctx.createOscillator(), g=A.ctx.createGain(), t=A.ctx.currentTime;
      o.frequency.value=acc?1600:onBeat?1050:760;
      g.gain.setValueAtTime(acc?.5:onBeat?.32:.16,t);
      g.gain.exponentialRampToValueAtTime(.0001,t+.05);
      o.connect(g); g.connect(A.master); o.start(t); o.stop(t+.06);
      $$('#dots i').forEach((d,i)=>d.classList.toggle('on',i===beat&&onBeat));
      Rhythm.step++;
    };
    tick(); Rhythm.timer=setInterval(tick,iv);
    const b=$('#metroBtn'); if(b){b.textContent='Stop';b.classList.replace('btn-brass','btn-ghost');}
  },
  stop(){ clearInterval(Rhythm.timer); Rhythm.running=false;
    $$('#dots i').forEach(d=>d.classList.remove('on'));
    const b=$('#metroBtn'); if(b){b.textContent='Start';b.classList.replace('btn-ghost','btn-brass');} },
  toggleSeq(){ Rhythm.seqOn?Rhythm.stopSeq():Rhythm.startSeq(); },
  startSeq(){
    A.resume(); Rhythm.seqOn=true; Rhythm.seqStep=0;
    const iv=(60/Rhythm.bpm)*1000/Rhythm.res();
    const tick=()=>{
      const i=Rhythm.seqStep%Rhythm.steps;
      const late=(Rhythm.res()%2===0&&i%2===1)?(Rhythm.swing/100)*(iv/1000)*.6:0;
      if(Rhythm.pattern.k[i]) A.drum('k',late);
      if(Rhythm.pattern.s[i]) A.drum('s',late);
      if(Rhythm.pattern.h[i]) A.drum('h',late,.7);
      $$('#seq .step').forEach(el=>el.classList.toggle('cur',+el.dataset.i===i));
      Rhythm.seqStep++;
    };
    tick(); Rhythm.seqTimer=setInterval(tick,iv);
    const b=$('#seqBtn'); if(b){b.textContent='Stop';b.classList.replace('btn-brass','btn-ghost');}
  },
  stopSeq(){ clearInterval(Rhythm.seqTimer); Rhythm.seqOn=false;
    $$('#seq .step').forEach(el=>el.classList.remove('cur'));
    const b=$('#seqBtn'); if(b){b.textContent='Play pattern';b.classList.replace('btn-ghost','btn-brass');} },
  taps:[],
  tap(){
    const now=performance.now();
    Rhythm.taps=Rhythm.taps.filter(t=>now-t<2400); Rhythm.taps.push(now);
    if(Rhythm.taps.length<2) return;
    const gaps=Rhythm.taps.slice(1).map((t,i)=>t-Rhythm.taps[i]);
    const avg=gaps.reduce((a,b)=>a+b,0)/gaps.length;
    Rhythm.setBpm(clamp(Math.round(60000/avg),30,220));
    const sl=$('#rhythmBody input[type=range]'); if(sl) sl.value=Rhythm.bpm;
  }
};

/* ============================================================
   13 · ENCYCLOPEDIA
   ============================================================ */
const Enc={
  cat:'all', q:'',
  mount(){
    $('#encBody').innerHTML=`
      <div class="searchbar">
        ${OT.ENC_CATS.map(([v,n])=>`<button class="chip ${v===Enc.cat?'on':''}"
          onclick="Enc.setCat('${v}')">${esc(n)}</button>`).join('')}
        <label class="search"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></svg>
          <input placeholder="Search terms…" oninput="Enc.search(this.value)"></label>
      </div>
      <div class="cards" id="encGrid"></div>
      <div class="count" id="encCount"></div>`;
    Enc.render();
  },
  setCat(c){ Enc.cat=c; Enc.mount(); },
  search(v){ Enc.q=v.toLowerCase(); Enc.render(); },
  render(){
    const l=OT.ENCYCLOPEDIA.filter(e=>(Enc.cat==='all'||e.cat===Enc.cat) &&
      (!Enc.q||(e.t+' '+e.tag+' '+e.def).toLowerCase().includes(Enc.q)));
    $('#encGrid').innerHTML=l.map((e,i)=>
      `<button class="card" onclick="Enc.open(${OT.ENCYCLOPEDIA.indexOf(e)})">
        <h4>${esc(e.t)}</h4><span class="sub">${esc(e.tag)}</span><p>${esc(e.def)}</p>
      </button>`).join('') || `<p class="hint">No entry matches that.</p>`;
    $('#encCount').textContent=`${l.length} of ${OT.ENCYCLOPEDIA.length} entries`;
  },
  open(i){
    const e=OT.ENCYCLOPEDIA[i];
    openModal(e.t,`<h3>${esc(e.t)}</h3><p class="msub">${esc(e.tag)}</p>
      <div class="mrow"><span class="k">What it is</span><span class="v">${esc(e.def)}</span></div>
      <div class="mrow"><span class="k">Why it matters</span><span class="v">${esc(e.why)}</span></div>
      <div class="mrow"><span class="k">Worth knowing</span><span class="v"><b>${esc(e.watch)}</b></span></div>`);
  }
};

/* ============================================================
   14 · THE PATH
   ============================================================ */
const PATH=[
  ['Sound, pitch and rhythm','What sound physically is, why pitch is frequency, and how the harmonic series quietly decides everything that follows.','If you can clap a beat and hum a pitch, you already speak the language.'],
  ['The keyboard as a map','Twelve notes, the repeating pattern, and where the half-steps hide. The fastest way to make theory visible.','The keyboard is a ruler for pitch. Learn the map and everything else becomes readable.'],
  ['Intervals','Naming and hearing the distance between any two notes. The single highest-leverage skill in this whole list.','An interval is a relationship, not a note. Hear relationships and songs start talking.'],
  ['Scales and modes','Major, minor, the seven modes and the pentatonics: how the same notes rearranged produce completely different weather.','A scale is a palette. Modes are that palette under different light.'],
  ['Chords and harmony','Triads, sevenths, inversions and where chords come from. Roman numerals so a progression works in any key.','Harmony is melody stacked vertically. When notes agree, emotion multiplies.'],
  ['Progressions and cadences','How chords move, why some motions feel like gravity, and what a cadence is actually doing to the listener.','Function beats memorisation. Learn why V pulls to I and you can build your own.'],
  ['Rhythm, time and groove','Time signatures, subdivision, syncopation and swing, plus why perfectly quantised music often feels dead.','Groove lives in the spaces between beats as much as on them.'],
  ['Your instrument, mapped','Taking all of the above onto the fretboard, the keys or the voice, so theory becomes something under your fingers.','Theory you cannot play is trivia. Put every idea on the instrument.'],
  ['Ear training and transcription','Recognising intervals, chord quality and progressions by ear, then writing down music you love.','Your ear is the final instrument. Train it and the other tools become optional.'],
  ['Form, style and listening','Song structure, motif, arrangement, production choices, and how to take apart anything you hear.','Great music feels inevitable because the structure is invisible. Learn to see it.']
];
const Path={
  mount(){
    const done=store.get('path',[]);
    const pct=Math.round(done.length/PATH.length*100);
    $('#pathBody').innerHTML=`
      <div class="plabel">${done.length} of ${PATH.length} complete</div>
      <div class="progbar"><i style="width:${pct}%"></i></div>
      ${PATH.map((s,i)=>`
        <button class="stage ${done.includes(i)?'done':''}" onclick="Path.toggle(${i})">
          <span class="num">${String(i+1).padStart(2,'0')}</span>
          <span><h4>${esc(s[0])}</h4><p>${esc(s[1])}</p><span class="key">${esc(s[2])}</span></span>
        </button>`).join('')}`;
  },
  toggle(i){
    const done=store.get('path',[]);
    const k=done.indexOf(i);
    k>-1?done.splice(k,1):done.push(i);
    store.set('path',done); Path.mount(); buildHomeStatus();
    if(k===-1){ A.resume(); A.note(72,.5,.5); }
  }
};

/* ============================================================
   15 · MODAL + BOOT
   ============================================================ */
let modalReturn=null;
function openModal(title,html){
  if(!$('#modal').classList.contains('open'))modalReturn=document.activeElement;
  $('#mTitle').textContent=title; $('#mBody').innerHTML=html;
  $('#modal').setAttribute('aria-labelledby','mTitle');
  $('#modal').classList.add('open'); document.body.style.overflow='hidden';
  $('#modal .mbar button').focus({preventScroll:true});
}
function closeModal(){
  const wasOpen=$('#modal').classList.contains('open');
  $('#modal').classList.remove('open'); document.body.style.overflow='';
  if(wasOpen&&modalReturn?.isConnected)modalReturn.focus({preventScroll:true});
}
$('#modal').addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const controls=[...$('#modal').querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
  const first=controls[0],last=controls[controls.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
});
$('#modal').addEventListener('click',e=>{ if(e.target.id==='modal') closeModal(); });
addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });

function boot(){
  buildTabs(); buildHome(); buildInstSel();
  Strings.init(); KB.render(); KB.bind();
  Lab.mount(); Ear.mount(); Rhythm.mount(); Enc.mount(); Path.mount();
  if(typeof Sketch!=='undefined') Sketch.mount();
  addEventListener('hashchange',route); route();
  /* the audio context can only start from a gesture */
  const wake=()=>{ A.resume(); if(A.mode==='sampled') A.load(A.inst);
    removeEventListener('pointerdown',wake); removeEventListener('keydown',wake); };
  addEventListener('pointerdown',wake); addEventListener('keydown',wake);
  let lastSpans=KB.spans;
  addEventListener('resize',()=>{ if(KB.octaves()!==lastSpans){ lastSpans=KB.octaves(); KB.render(); } },{passive:true});
  document.body.style.setProperty('--keybed-h','150px');
}
if(document.readyState==='loading') addEventListener('DOMContentLoaded',boot); else boot();
