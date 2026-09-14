(()=>{
'use strict';
const css=document.createElement('link');css.rel='stylesheet';css.href='roulette-v2.css';document.head.append(css);
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
const redNums=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
function waitForBuilder(){const host=q('#rouletteBuilder');if(!host||host.dataset.rv2==='1'){if(!host)requestAnimationFrame(waitForBuilder);return}requestAnimationFrame(()=>init(host))}
waitForBuilder();

function init(host){
  if(host.dataset.rv2==='1')return;host.dataset.rv2='1';host.classList.add('rv2');
  host.innerHTML=`<div class="roulette-builder-head"><div><h3>Build the whole roulette layout.</h3><p>Place more than one wager, use the real outside and column bets, or click the edges and corners between numbers for split and corner bets. The slip recalculates the total risk and every possible payout.</p></div><div class="wheel-toggle" id="rvWheelToggle"><button type="button" class="on" data-wheel="european">European 0</button><button type="button" data-wheel="american">American 0 / 00</button></div></div>
  <div class="rv-shell"><section class="rv-table-side"><div class="rv-table"><div class="rv-zero-rail" id="rvZeroRail"></div><div class="rv-number-wrap"><div class="rv-number-grid" id="rvNumberGrid"></div></div><div class="rv-column-bets" id="rvColumnBets"></div></div><div class="rv-inside-note"><b>Inside bets:</b><span><i></i> center = straight</span><span><i></i> edge = split</span><span><i class="corner"></i> intersection = corner</span><span>Use the rail below for streets and six-lines.</span></div><div class="rv-street-wrap"><span></span><div class="rv-street-grid" id="rvStreetGrid"></div><span></span></div><div class="rv-outside-stack"><div class="rv-dozens" id="rvDozens"></div><div class="rv-evenmoney" id="rvEvenMoney"></div></div><div class="rv-active"><div class="rv-active-head"><span>Active wagers · click a chip to remove it</span><b id="rvActiveTotal">1 bet</b></div><div class="rv-bet-list" id="rvBetList"></div></div></section>
  <aside class="rv-slip"><h4>Your table</h4><p class="rv-slip-intro">Stake is the amount placed on each selected wager. Multiple wagers stack just like chips on a real layout.</p><div class="rv-stake-row"><label>Bet per selection<input id="rvStake" type="number" min="1" step="5" value="25"></label><button class="rv-clear" id="rvClear" type="button">Clear table</button></div><div class="rv-summary"><div><span>ACTIVE BETS</span><b id="rvBetCount">1</b><small id="rvBetCountNote">one chip on the layout</small></div><div><span>TOTAL WAGER</span><b id="rvTotalStake">$25.00</b><small>stake across every selected bet</small></div><div><span>POCKETS COVERED</span><b id="rvCoverage">1 / 37</b><small id="rvCoverageNote">1 profitable outcome</small></div><div><span>ANY BET CASHES</span><b id="rvHitChance">2.70%</b><small>at least one selected wager wins</small></div><div><span>NET ON COVERED SPIN</span><b id="rvNetRange">$875.00</b><small>range depends on overlapping bets</small></div><div><span>BEST TOTAL RETURN</span><b id="rvBestReturn">$900.00</b><small>includes returned winning stake</small></div><div><span>EXPECTED LOSS / SPIN</span><b id="rvExpectedLoss">$0.68</b><small>long-run average, not a prediction</small></div><div><span>EFFECTIVE HOUSE EDGE</span><b id="rvEdge">2.70%</b><small>weighted across selected wagers</small></div></div><div class="rv-read" id="rvRead"></div><div class="rv-bet-help">Example: if you place $25 on Red and $25 straight-up on 32, your total wager is $50. If 32 lands, both bets win. If another red number lands, only the Red bet wins. The calculator models that overlap automatically.</div></aside></div>`;

  const state={wheel:'european',unit:25,bets:new Map()};
  const catalog=new Map(),controls=new Map(),pocketButtons=new Map();
  const zeroRail=q('#rvZeroRail',host),grid=q('#rvNumberGrid',host),columnBox=q('#rvColumnBets',host),streetGrid=q('#rvStreetGrid',host),dozens=q('#rvDozens',host),evenMoney=q('#rvEvenMoney',host);
  const betId=(type,numbers,label)=>`${type}:${label||numbers.join('-')}`;
  const createBet=(type,label,numbers,payout)=>{const b={type,label,numbers:numbers.map(String),payout};b.id=betId(type,b.numbers,label);catalog.set(b.id,b);return b};
  const register=(el,bet)=>{el.dataset.betId=bet.id;el.title=`${bet.label} · pays ${bet.payout}:1`;if(!controls.has(bet.id))controls.set(bet.id,new Set());controls.get(bet.id).add(el);el.addEventListener('click',e=>{e.preventDefault();toggle(bet.id)});return el};
  const button=(cls,text,bet)=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;return register(b,bet)};

  const zero=createBet('straight','0 straight up',['0'],35),zbtn=button('rv-zero','0',zero);zbtn.dataset.pocket='0';zeroRail.appendChild(zbtn);pocketButtons.set('0',zbtn);
  const zz=createBet('straight','00 straight up',['00'],35),zzbtn=button('rv-zero double','00',zz);zzbtn.dataset.pocket='00';zeroRail.appendChild(zzbtn);pocketButtons.set('00',zzbtn);

  const rowNumbers=[[],[],[]];
  for(let c=1;c<=12;c++){
    const nums=[c*3,c*3-1,c*3-2];
    nums.forEach((n,r)=>{rowNumbers[r].push(String(n));const bet=createBet('straight',`${n} straight up`,[n],35),b=button(`rv-num ${redNums.has(n)?'red':'black'}`,String(n),bet);b.style.gridColumn=String(c);b.style.gridRow=String(r+1);b.dataset.pocket=String(n);b.innerHTML=`${n}<span class="rv-cover-count"></span>`;grid.appendChild(b);pocketButtons.set(String(n),b)});
  }

  // Splits between vertically adjacent numbers inside each three-number column.
  for(let c=1;c<=12;c++){
    const top=c*3,mid=c*3-1,bot=c*3-2;
    [[top,mid,1],[mid,bot,2]].forEach(([a,b,boundary])=>{const bet=createBet('split',`${a} / ${b} split`,[a,b],17),h=button('rv-hotspot rv-split-v','',bet);h.style.left=`${((c-.5)/12)*100}%`;h.style.top=`${boundary/3*100}%`;grid.appendChild(h)});
  }
  // Splits between neighboring three-number columns.
  for(let c=1;c<=11;c++)for(let r=0;r<3;r++){
    const left=c*3-r,right=(c+1)*3-r,bet=createBet('split',`${left} / ${right} split`,[left,right],17),h=button('rv-hotspot rv-split-h','',bet);h.style.left=`${c/12*100}%`;h.style.top=`${((r+.5)/3)*100}%`;grid.appendChild(h);
  }
  // Four-number corners at every internal intersection.
  for(let c=1;c<=11;c++)for(let boundary=1;boundary<=2;boundary++){
    const leftTop=c*3-(boundary-1),leftBottom=c*3-boundary,rightTop=(c+1)*3-(boundary-1),rightBottom=(c+1)*3-boundary;
    const ns=[leftTop,leftBottom,rightTop,rightBottom],bet=createBet('corner',`${ns.join(' / ')} corner`,ns,8),h=button('rv-hotspot rv-corner-hit','',bet);h.style.left=`${c/12*100}%`;h.style.top=`${boundary/3*100}%`;grid.appendChild(h);
  }

  // 2-to-1 column wagers live on the right edge of the real table.
  ['Top row 2 to 1','Middle row 2 to 1','Bottom row 2 to 1'].forEach((label,r)=>columnBox.appendChild(button('rv-column',`2 TO 1`,createBet('column',label,rowNumbers[r],2))));

  // Street bets and six-lines sit under the number grid.
  for(let c=1;c<=12;c++){
    const ns=[c*3-2,c*3-1,c*3],bet=createBet('street',`${ns[0]}-${ns[2]} street`,ns,11),b=button('rv-street',`${ns[0]}-${ns[2]}`,bet);b.style.gridColumn=String(c);streetGrid.appendChild(b);
  }
  for(let c=1;c<=11;c++){
    const ns=[c*3-2,c*3-1,c*3,(c+1)*3-2,(c+1)*3-1,(c+1)*3],bet=createBet('six',`${ns[0]}-${ns[5]} six-line`,ns,5),b=button('rv-six-hit','6',bet);b.style.left=`${c/12*100}%`;streetGrid.appendChild(b);
  }

  [[1,12,'1st 12'],[13,24,'2nd 12'],[25,36,'3rd 12']].forEach(([a,z,label])=>{const ns=Array.from({length:z-a+1},(_,i)=>String(a+i));dozens.appendChild(button('',label.toUpperCase(),createBet('dozen',label,ns,2)))});
  const red=[...redNums].map(String),black=Array.from({length:36},(_,i)=>i+1).filter(n=>!redNums.has(n)).map(String),odd=Array.from({length:18},(_,i)=>String(i*2+1)),even=Array.from({length:18},(_,i)=>String((i+1)*2)),low=Array.from({length:18},(_,i)=>String(i+1)),high=Array.from({length:18},(_,i)=>String(i+19));
  [[low,'1-18',''],[even,'Even',''],[red,'Red','red-bet'],[black,'Black','black-bet'],[odd,'Odd',''],[high,'19-36','']].forEach(([ns,label,cls])=>evenMoney.appendChild(button(cls,label.toUpperCase(),createBet('even',label,ns,1))));

  const currentPockets=()=>state.wheel==='american'?['0','00',...Array.from({length:36},(_,i)=>String(i+1))]:['0',...Array.from({length:36},(_,i)=>String(i+1))];
  const toggle=id=>{if(state.bets.has(id))state.bets.delete(id);else if(catalog.has(id))state.bets.set(id,catalog.get(id));sync()};
  function sync(){
    state.unit=Math.max(0,Number(q('#rvStake',host)?.value||0));
    const active=[...state.bets.values()],pockets=currentPockets(),total=state.unit*active.length;
    controls.forEach((els,id)=>els.forEach(el=>{const on=state.bets.has(id);el.classList.toggle('on',on);if(el.classList.contains('rv-num'))el.classList.toggle('straight-on',on)}));
    const coverCounts=new Map(pockets.map(p=>[p,0]));active.forEach(b=>b.numbers.forEach(n=>{if(coverCounts.has(n))coverCounts.set(n,coverCounts.get(n)+1)}));
    pocketButtons.forEach((el,p)=>{const count=coverCounts.get(p)||0;el.classList.toggle('covered',count>0);el.classList.toggle('multi-covered',count>1);const badge=q('.rv-cover-count',el);if(badge)badge.textContent=count>1?String(count):''});
    const outcomes=pockets.map(p=>{let gross=0,wins=0;active.forEach(b=>{if(b.numbers.includes(p)){gross+=state.unit*(b.payout+1);wins++}});return{p,gross,wins,net:gross-total}});
    const covered=outcomes.filter(o=>o.wins>0),profitable=outcomes.filter(o=>o.net>0);const best=outcomes.length?Math.max(...outcomes.map(o=>o.gross)):0,avgNet=outcomes.length?outcomes.reduce((s,o)=>s+o.net,0)/outcomes.length:0,edge=total>0?Math.max(0,-avgNet/total*100):0;
    const minCovered=covered.length?Math.min(...covered.map(o=>o.net)):0,maxCovered=covered.length?Math.max(...covered.map(o=>o.net)):0,range=covered.length?(Math.abs(minCovered-maxCovered)<.005?money(minCovered):`${money(minCovered)} to ${money(maxCovered)}`):'—';
    q('#rvBetCount',host).textContent=String(active.length);q('#rvBetCountNote',host).textContent=active.length===1?'one chip on the layout':`${active.length} separate wagers`;q('#rvTotalStake',host).textContent=money(total);q('#rvCoverage',host).textContent=`${covered.length} / ${pockets.length}`;q('#rvCoverageNote',host).textContent=`${profitable.length} profitable outcome${profitable.length===1?'':'s'}`;q('#rvHitChance',host).textContent=active.length?(covered.length/pockets.length*100).toFixed(2)+'%':'—';q('#rvNetRange',host).textContent=range;q('#rvBestReturn',host).textContent=active.length?money(best):'—';q('#rvExpectedLoss',host).textContent=active.length?money(Math.max(0,-avgNet)):'—';q('#rvEdge',host).textContent=active.length?edge.toFixed(2)+'%':'—';q('#rvActiveTotal',host).textContent=`${active.length} bet${active.length===1?'':'s'} · ${money(total)}`;
    const list=q('#rvBetList',host);list.innerHTML='';if(!active.length)list.innerHTML='<span class="rv-empty">No wagers selected. Click a number, edge, corner, street, column, dozen, or outside bet.</span>';else active.forEach(b=>{const chip=document.createElement('button');chip.type='button';chip.className='rv-bet-chip';chip.innerHTML=`<b>${b.label}</b><span>${b.payout}:1</span><small>${money(state.unit)} wager · ${money(state.unit*b.payout)} profit if this bet wins</small>`;chip.addEventListener('click',()=>toggle(b.id));list.appendChild(chip)});
    const read=q('#rvRead',host);if(!active.length)read.innerHTML='Select one or more wagers to model the table.';else{const wheelName=state.wheel==='american'?'American double-zero':'European single-zero';read.innerHTML=`You have <strong>${active.length} wager${active.length===1?'':'s'}</strong> totaling <strong>${money(total)}</strong> on a ${wheelName} wheel. At least one bet cashes on <strong>${covered.length} of ${pockets.length}</strong> pockets. Because overlapping bets can win together, the net result on a covered pocket ranges from <strong>${range}</strong>. The long-run expected loss for this exact layout is about <strong>${money(Math.max(0,-avgNet))}</strong> per spin.`}
  }

  qa('#rvWheelToggle button',host).forEach(b=>b.addEventListener('click',()=>{state.wheel=b.dataset.wheel;qa('#rvWheelToggle button',host).forEach(x=>x.classList.toggle('on',x===b));zeroRail.classList.toggle('american',state.wheel==='american');if(state.wheel!=='american'&&state.bets.has(zz.id))state.bets.delete(zz.id);sync()}));
  q('#rvStake',host).addEventListener('input',sync);q('#rvClear',host).addEventListener('click',()=>{state.bets.clear();sync()});
  state.bets.set('straight:32 straight up',catalog.get('straight:32 straight up'));sync();
}
})();