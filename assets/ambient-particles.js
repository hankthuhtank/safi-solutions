(() => {
  'use strict';
  if (document.querySelector('.particle-layer')) return;

  const style = document.createElement('style');
  style.id = 'safi-ambient-particles';
  style.textContent = `
    body{position:relative;isolation:isolate}
    .particle-layer{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;contain:layout paint;display:block!important;visibility:visible!important}
    .particle-layer i{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);border-radius:50%;background:var(--c);opacity:var(--o);box-shadow:0 0 var(--glow) var(--c);animation:safiParticleFloat var(--d) linear infinite;animation-delay:var(--delay);will-change:transform}
    @keyframes safiParticleFloat{0%{transform:translate3d(0,0,0) scale(.72)}100%{transform:translate3d(var(--drift),-138vh,0) scale(1.15)}}
    main{position:relative;z-index:2}
    @media(max-width:760px){.particle-layer i{filter:brightness(1.12)}}
    @media(prefers-reduced-motion:reduce){.particle-layer i{animation:none!important;opacity:var(--o)!important}}
  `;
  document.head.append(style);

  const layer = document.createElement('div');
  layer.className = 'particle-layer';
  layer.setAttribute('aria-hidden', 'true');
  const palette = [
    'rgba(236,242,255,.92)',
    'rgba(184,216,250,.88)',
    'rgba(117,188,255,.82)',
    'rgba(104,231,220,.76)'
  ];
  const total = matchMedia('(max-width:760px)').matches ? 180 : 240;
  const frag = document.createDocumentFragment();

  for (let i = 0; i < total; i++) {
    const dot = document.createElement('i');
    const duration = 18 + Math.random() * 34;
    const drift = (Math.random() - .5) * 130;
    const size = .75 + Math.random() * 2.9;
    const opacity = .16 + Math.random() * .55;
    const glow = 4 + Math.random() * 12;
    const color = palette[Math.floor(Math.random() * palette.length)];
    const y = -8 + Math.random() * 116;
    dot.style.cssText = `--x:${(Math.random()*100).toFixed(2)}%;--y:${y.toFixed(2)}vh;--s:${size.toFixed(2)}px;--o:${opacity.toFixed(2)};--d:${duration.toFixed(1)}s;--delay:-${(Math.random()*duration).toFixed(1)}s;--drift:${drift.toFixed(1)}px;--glow:${glow.toFixed(1)}px;--c:${color}`;
    frag.append(dot);
  }

  layer.append(frag);
  document.body.prepend(layer);
})();