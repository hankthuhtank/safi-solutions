(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const all = s => Array.from(document.querySelectorAll(s));
  const projects = window.SAFI_PROJECTS || [];
  const byId = new Map(projects.map(p => [p.id,p]));
  const pages = all('.page');
  let homeScroll=0;
  let activePage = '', lastHash = '';
  document.documentElement.classList.add('js');

  const polish=document.createElement('style');
  polish.textContent=`
    .inquiry-form>.button{grid-column:1/-1;justify-self:center;width:min(100%,420px)}
    .work-page .featured-projects{margin-bottom:24px}
    .portrait img{object-position:center 10%!important}

    /* Dense floating particle field behind all dark sections. */
    body{position:relative;isolation:isolate}
    .particle-layer{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;contain:layout paint;display:block!important;visibility:visible!important}
    .particle-layer i{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);border-radius:50%;background:var(--c);opacity:var(--o);box-shadow:0 0 var(--glow) var(--c);animation:particleFloat var(--d) linear infinite;animation-delay:var(--delay);will-change:transform}
    @keyframes particleFloat{0%{transform:translate3d(0,0,0) scale(.72)}100%{transform:translate3d(var(--drift),-138vh,0) scale(1.15)}}
    main{position:relative;z-index:2}
    html.motion-paused .particle-layer i{animation-play-state:paused!important}
    @media(prefers-reduced-motion:reduce){.particle-layer i{animation:none!important;opacity:var(--o)!important}}

    /* Trading Desk: let the actual logo be the clickable object, not a large box. */
    main>.market-page{align-items:center}
    .markets-logo{display:flex!important;align-items:center!important;justify-content:center!important;justify-self:center!important;width:max-content!important;max-width:100%!important;padding:8px!important;background:transparent!important;border:0!important;box-shadow:none!important;border-radius:8px!important;overflow:visible!important}
    .markets-logo img{width:360px!important;max-width:100%!important;height:auto!important;margin:auto!important;object-fit:contain!important;transition:transform .35s ease,filter .35s ease!important}
    .markets-logo:hover img,.markets-logo:focus-visible img{transform:scale(1.055);filter:drop-shadow(0 10px 22px rgba(29,226,210,.18))}

    /* Cleaner icon treatment for calls to action. */
    .pro-arrow{width:15px;height:15px;display:inline-block;flex:0 0 auto;margin-left:7px;vertical-align:-2px;stroke:currentColor;stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round;transition:transform .2s ease}
    a:hover>.pro-arrow,button:hover>.pro-arrow{transform:translateX(3px)}

    /* Small interaction layer: shine + depth without changing the layout. */
    .project-card{perspective:1400px}
    .project-cover{transform-style:preserve-3d;will-change:transform}
    .project-cover:before{content:'';position:absolute;inset:0;z-index:3;pointer-events:none;opacity:0;background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(205,230,255,.2),transparent 35%);transition:opacity .25s ease}
    .project-cover:hover:before,.project-cover:focus-visible:before{opacity:1}
    .button{position:relative;overflow:hidden;isolation:isolate}
    .button:before{content:'';position:absolute;inset:-2px auto -2px -45%;width:32%;pointer-events:none;background:linear-gradient(100deg,transparent,rgba(255,255,255,.48),transparent);transform:skewX(-18deg);transition:left .55s ease;z-index:-1}
    .button:hover:before,.button:focus-visible:before{left:120%}
    .website-list>a{transition:padding .22s ease,background .22s ease}
    .website-list>a:hover{padding-left:8px;padding-right:8px;background:rgba(255,255,255,.018)}
    .primary-nav a{transition:background .2s,color .2s,transform .2s}
    .primary-nav a:hover{transform:translateX(3px)}
    html.motion-paused .project-cover:before{display:none}
    html.motion-paused .markets-logo img,html.motion-paused .button:before,html.motion-paused .pro-arrow{transition:none!important;transform:none!important}

    @media(max-width:760px){
      .particle-layer{z-index:1!important;opacity:1!important}
      .particle-layer i{filter:brightness(1.12)}
      .featured-projects{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important;margin-bottom:18px!important}
      .featured-projects .site-cover,.featured-projects .card-thebench .site-cover{height:auto!important;aspect-ratio:1.46!important}
      .featured-projects .project-caption{display:block!important;margin-top:9px!important}
      .featured-projects .project-caption>a{font-size:16px!important;line-height:1.25!important}
      .featured-projects .project-caption>span{display:block!important;max-width:100%!important;text-align:left!important;margin-top:5px!important;font-size:11px!important;line-height:1.5!important}
      .work-page .project-tools{margin-top:0!important}

      /* Keep the two header taglines to their intended two lines. */
      .collection-header{align-items:flex-end!important;gap:12px!important}
      .collection-header>div{min-width:0;flex:1 1 auto}
      .collection-header>p{display:block!important;flex:0 0 auto!important;width:auto!important;max-width:none!important;white-space:nowrap!important;font-size:clamp(10px,2.7vw,13px)!important;line-height:1.5!important;padding-bottom:3px!important}

      .markets-logo{width:min(82vw,330px)!important;max-width:330px!important;padding:6px!important;margin:0 auto!important}
      .markets-logo img{width:100%!important;height:auto!important}

      .about-layout{display:grid!important;grid-template-columns:minmax(0,1fr) 135px!important;gap:18px 20px!important;align-items:center!important;margin:25px 0 30px!important}
      .about-letter{display:contents!important}
      .about-letter h2{grid-column:1!important;grid-row:1!important;margin:0!important;align-self:center!important}
      .portrait{grid-column:2!important;grid-row:1!important;width:135px!important;align-self:center!important;margin:0!important;order:initial!important;transform:rotate(-2deg)!important}
      .portrait img{height:165px!important;object-position:center 8%!important}
      .portrait span{font-size:7px!important;padding-top:7px!important}
      .about-letter p{grid-column:1/-1!important}

      /* Tilt is intentionally desktop-only. */
      .project-cover{will-change:auto}
    }
    @media(max-width:430px){
      .featured-projects{gap:10px!important}
      .featured-projects .project-caption>a{font-size:15px!important}
      .featured-projects .project-caption>span{font-size:10px!important}
      .collection-header{gap:9px!important}
      .collection-header>p{display:block!important;font-size:clamp(9.5px,2.55vw,11px)!important;white-space:nowrap!important}
      .about-layout{grid-template-columns:minmax(0,1fr) 112px!important;gap:16px!important}
      .portrait{width:112px!important}
      .portrait img{height:138px!important}
      .about-letter h2{font-size:30px!important}
    }
  `;
  document.head.append(polish);
  $('.form-foot')?.remove();
  $('.work-page .collection-subhead')?.remove();
  $('.about-letter>a[href="#contact"]')?.remove();
  const vellumLabel=$('.card-vellum .project-caption>span');
  if(vellumLabel) vellumLabel.textContent='Bible discovery';
  const tradingLogo=$('.markets-logo');
  if(tradingLogo) tradingLogo.setAttribute('aria-label','Open TheTradingDesk');

  const makeArrowIcon=()=>{
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','pro-arrow');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    const line=document.createElementNS('http://www.w3.org/2000/svg','path');
    line.setAttribute('d','M5 12h14M13 6l6 6-6 6');
    svg.append(line);
    return svg;
  };
  function decorateProArrows(root=document){
    root.querySelectorAll('a,button').forEach(el=>{
      if(!el.textContent.includes('↗')) return;
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      const nodes=[];
      while(walker.nextNode()) nodes.push(walker.currentNode);
      let changed=false;
      nodes.forEach(node=>{
        if(node.nodeValue.includes('↗')){
          node.nodeValue=node.nodeValue.replace(/\s*↗/g,'');
          changed=true;
        }
      });
      if(!changed) return;
      el.querySelectorAll('span[aria-hidden="true"]').forEach(span=>{
        if(!span.textContent.trim()&&!span.children.length) span.remove();
      });
      if(!el.querySelector(':scope > .pro-arrow')) el.append(makeArrowIcon());
    });
  }
  decorateProArrows();

  const particleLayer=document.createElement('div');
  particleLayer.className='particle-layer';
  particleLayer.setAttribute('aria-hidden','true');
  const particlePalette=['rgba(236,242,255,.92)','rgba(184,216,250,.88)','rgba(117,188,255,.82)','rgba(104,231,220,.76)'];
  const particleTotal=window.matchMedia('(max-width:760px)').matches?180:240;
  for(let i=0;i<particleTotal;i++){
    const dot=document.createElement('i');
    const duration=18+Math.random()*34;
    const drift=(Math.random()-.5)*130;
    const size=.75+Math.random()*2.9;
    const opacity=.16+Math.random()*.55;
    const glow=4+Math.random()*12;
    const color=particlePalette[Math.floor(Math.random()*particlePalette.length)];
    const y=-8+Math.random()*116;
    dot.style.cssText=`--x:${(Math.random()*100).toFixed(2)}%;--y:${y.toFixed(2)}vh;--s:${size.toFixed(2)}px;--o:${opacity.toFixed(2)};--d:${duration.toFixed(1)}s;--delay:-${(Math.random()*duration).toFixed(1)}s;--drift:${drift.toFixed(1)}px;--glow:${glow.toFixed(1)}px;--c:${color}`;
    particleLayer.append(dot);
  }
  document.body.prepend(particleLayer);

  $('#year').textContent = new Date().getFullYear();
  const menu = $('#menu-toggle'), mobileNav = $('#mobile-nav');
  const closeMenu = () => { menu.setAttribute('aria-expanded','false'); mobileNav.classList.remove('open'); };
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded',String(open)); mobileNav.classList.toggle('open',open); });
  mobileNav.addEventListener('click', e => { if(e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if(e.key==='Escape' && mobileNav.classList.contains('open')) {closeMenu();menu.focus();} });
  const el = (tag,cls,text) => {const n=document.createElement(tag); if(cls)n.className=cls; if(text)n.textContent=text;return n;};
  let installProject=null;
  const installDialog=$('#install-dialog');
  const installButton=$('#detail-install');
  const installOpen=$('#install-open-project');
  const installTitle=$('#install-title');
  const installCopy=$('#install-dialog-copy');
  const openInstallHelp=()=>{
    if(!installProject||!installDialog)return;
    installTitle.textContent='Add '+installProject.name+' to your phone.';
    installCopy.textContent='Save the live '+installProject.name+' project to your Home Screen so it opens like an app.';
    installOpen.href=installProject.url;
    installOpen.textContent='Open '+installProject.name;
    installOpen.append(makeArrowIcon());
    if(typeof installDialog.showModal==='function')installDialog.showModal();
    else installDialog.setAttribute('open','');
  };
  installButton?.addEventListener('click',openInstallHelp);
  $('#install-dialog-close')?.addEventListener('click',()=>installDialog?.close());
  installDialog?.addEventListener('click',e=>{if(e.target===installDialog)installDialog.close();});
  function renderDetail(p) {
    $('#detail-title').textContent=p.name;
    $('#detail-type').textContent=p.type.toUpperCase();
    $('#detail-copy').textContent=p.detail;
    $('#detail-visit').href=p.url;
    $('#detail-visit').textContent=p.category==='websites'?'Visit live website':'Open live project';
    $('#detail-visit').append(makeArrowIcon());
    installProject=p.category==='websites'?null:p;
    if(installButton)installButton.hidden=p.category==='websites';
    const group=projects.filter(item=>p.category==='websites'?item.category==='websites':item.category!=='websites'&&item.id!=='safistudios');
    const index=group.indexOf(p);
    $('#previous-project').href='#'+group[(index-1+group.length)%group.length].id;
    $('#next-project').href='#'+group[(index+1)%group.length].id;
    $('.detail-toolbar>a').href=p.category==='websites'?'#websites':'#work';
    $('.detail-toolbar>a').textContent=p.category==='websites'?'← All websites':'← All projects';
    const visual=$('#detail-visual');visual.replaceChildren();
    if(p.image) {
      const wrap=el('a','detail-screen detail-preview-link'),image=el('img');
      wrap.href=p.url;wrap.target='_blank';wrap.rel='noopener noreferrer';
      wrap.setAttribute('aria-label','Open '+p.name+' live project');
      image.src='assets/showcase/'+p.image;image.alt=p.name+' - actual website screenshot';
      wrap.append(image);visual.append(wrap);
      $('#detail-foot').textContent='Actual project preview · Click the image or the Open live project button to explore it.';
    } else {
      const wrap=el('a','detail-logo-stage detail-preview-link');wrap.style.setProperty('--identity',p.color);
      wrap.href=p.url;wrap.target='_blank';wrap.rel='noopener noreferrer';
      wrap.setAttribute('aria-label','Open '+p.name+' live project');
      if(p.logo){const image=el('img');image.src='assets/project-logos/'+p.logo;image.alt=p.name;wrap.append(image);}
      else wrap.append(el('strong','',p.name));
      wrap.append(el('p','',p.desc));
      visual.append(wrap);
      $('#detail-foot').textContent='Project preview · Click the preview or the Open live project button to explore it.';
    }
  }
  const homeSections=pages.filter(page=>page.id!=='project-detail');
  const labels={products:'PRODUCTS / DESKTOP SOFTWARE',work:'PROJECTS / INTERACTIVE TOOLS',websites:'CLIENT WEBSITES',safistudios:'SAFISTUDIOS / BUSINESS SOFTWARE',markets:'THETRADINGDESK / MARKETS',about:'ABOUT HELAL',contact:'GET IN TOUCH'};
  function highlight(id){
    all('[data-route]').forEach(a=>{if(a.dataset.route===id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    $('#location-label').textContent=labels[id]||'SAFI SOLUTIONS';
  }
  function route(initial=false){
    let hash;try{hash=decodeURIComponent(location.hash.slice(1)||'products');}catch{hash='products';}
    if(hash===lastHash&&!initial)return;
    if(activePage==='home')homeScroll=window.scrollY;
    let id=hash;
    const productTarget=document.getElementById(hash);
    const productAnchor=!!productTarget?.classList.contains('product-shelf');
    if(productAnchor)id='products';
    if(['main','top','desk','playground'].includes(id))id='products';
    if(['services','packages'].includes(id))id='websites';
    if(id.startsWith('studio-'))id='safistudios';
    if(id==='tradingdesk')id='markets';
    const p=byId.get(id),detail=!!p&&id!=='safistudios';
    const returning=activePage==='detail';
    if(detail)renderDetail(p);
    else if(!homeSections.some(page=>page.id===id))id='products';
    pages.forEach(page=>{const show=detail?page.id==='project-detail':page.id!=='project-detail';page.hidden=!show;page.classList.toggle('active',show);});
    document.body.classList.toggle('detail-mode',detail);
    activePage=detail?'detail':'home';lastHash=hash;closeMenu();
    highlight(detail?(p.category==='websites'?'websites':'work'):id);
    all('[data-project-link]').forEach(a=>{if(detail&&a.dataset.projectLink===hash)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    document.title=(detail?p.name+' - ':'')+'Safi Solutions - Independent design & development';
    requestAnimationFrame(()=>{
      if(detail)window.scrollTo({top:0,behavior:'instant'});
      else if(returning&&['work','websites'].includes(id))window.scrollTo({top:homeScroll,behavior:'instant'});
      else if(productAnchor)productTarget.scrollIntoView({behavior:'auto',block:'start'});
      else if(!initial||hash!=='products')document.getElementById(id).scrollIntoView({behavior:'auto',block:'start'});
      // Do not force focus into the page when opening a project; it can render a text caret in some browsers.
    });
  }
  window.addEventListener('hashchange',()=>route());
  let scrollQueued=false;
  window.addEventListener('scroll',()=>{
    if(scrollQueued||activePage!=='home')return;scrollQueued=true;
    requestAnimationFrame(()=>{scrollQueued=false;let selected=homeSections[0];for(const section of homeSections){if(section.getBoundingClientRect().top<=window.innerHeight*.35)selected=section;}highlight(selected.id);});
  },{passive:true});
  document.addEventListener('click',e=>{
    const a=e.target.closest('a');if(!a)return;
    if(a.dataset.interest){const select=$('#iq-interest');if(Array.from(select.options).some(o=>o.value===a.dataset.interest))select.value=a.dataset.interest;}
    if(a.getAttribute('href')===location.hash&&activePage==='home'){const target=document.getElementById(location.hash.slice(1));if(target)target.scrollIntoView({behavior:'smooth',block:'start'});}
  });

  /* Pointer-follow glow on previews. */
  all('.project-cover').forEach(cover=>cover.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch') return;
    const r=cover.getBoundingClientRect();
    cover.style.setProperty('--mx',`${((e.clientX-r.left)/r.width)*100}%`);
    cover.style.setProperty('--my',`${((e.clientY-r.top)/r.height)*100}%`);
  },{passive:true}));

  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const tiltMedia=window.matchMedia('(min-width:761px) and (hover:hover) and (pointer:fine)');
  let tiltLoaded=false;

  function syncTilt(){
    if(!tiltLoaded||!window.VanillaTilt) return;
    const shouldRun=!reduced.matches&&tiltMedia.matches;
    all('.project-cover').forEach(cover=>{
      if(shouldRun&&!cover.vanillaTilt){
        window.VanillaTilt.init(cover,{max:2.6,perspective:1450,scale:1.01,speed:650,transition:true,glare:true,'max-glare':0.07,gyroscope:false});
      } else if(!shouldRun&&cover.vanillaTilt){
        cover.vanillaTilt.destroy();
      }
    });
  }
  function loadVisualSpice(){
    if(reduced.matches||!tiltMedia.matches) return;
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/vanilla-tilt@1.8.1/dist/vanilla-tilt.min.js';
    script.async=true;
    script.onload=()=>{tiltLoaded=true;syncTilt();};
    script.onerror=()=>{tiltLoaded=false;};
    document.head.append(script);
  }
  function syncMotionPreference(){
    document.documentElement.classList.toggle('motion-paused',reduced.matches);
    syncTilt();
  }
  reduced.addEventListener?.('change',syncMotionPreference);
  tiltMedia.addEventListener?.('change',()=>{if(!tiltLoaded&&tiltMedia.matches)loadVisualSpice();syncTilt();});
  syncMotionPreference();
  loadVisualSpice();
  route(true);
})();