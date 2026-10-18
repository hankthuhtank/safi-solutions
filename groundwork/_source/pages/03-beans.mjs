const bean = (fill, crease = "#1a0d07") =>
  `<svg class="bean-ill" viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="40" cy="40" rx="22" ry="30" transform="rotate(30 40 40)" fill="${fill}" stroke="#2a1a12" stroke-width="2.4"/><path d="M28 60c10-8 4-24 24-40" fill="none" stroke="${crease}" stroke-width="2.6" stroke-linecap="round"/></svg>`;

export default {
  id: "beans",
  url: "/groundwork/beans/",
  title: "Coffee beans",
  desc: "Kinds of coffee beans: arabica, robusta, liberica and excelsa; what roasting does from green to dark; washed, honey, natural and anaerobic processing; and where coffee grows, with USDA 2026/27 production.",
  script: "beans.js",
  body: `
<div class="wrap">
  <section class="intro" aria-labelledby="beans-h">
    <p class="eyebrow">Beans · From the farm</p>
    <h1 class="h-xl" id="beans-h">It starts as<br>a cherry.</h1>
    <p class="lede">A coffee bean is the seed of a red fruit. Its species, where it grew, how the fruit came off and how dark it was roasted decide most of what you taste.</p>
  </section>

  <section class="sec" aria-labelledby="sp-h" style="padding-top:20px">
    <div class="sec-head"><div><p class="eyebrow">01 · Species</p><h2 class="h-lg" id="sp-h">Two species make<br>nearly all of it.</h2></div><span class="sec-num" aria-hidden="true">01</span></div>
    <div class="species">
      <article class="label sp rv">${bean("#6a4128")}<h3>${"Arabica"}</h3><p class="latin">Coffea arabica</p>
        <dl><dt>Share</dt><dd>~56% of the world crop</dd><dt>Grows</dt><dd>High: ~1,000–2,000 m</dd><dt>Caffeine</dt><dd>~1.2–1.5% of the bean</dd><dt>Tastes</dt><dd>Sweet, fruity, bright</dd></dl></article>
      <article class="label sp rv">${bean("#4a2c1d")}<h3>Robusta</h3><p class="latin">Coffea canephora</p>
        <dl><dt>Share</dt><dd>~44%; Vietnam grows the most</dd><dt>Grows</dt><dd>Low &amp; hot: 0–800 m</dd><dt>Caffeine</dt><dd>~2.2–2.7%, about double</dd><dt>Tastes</dt><dd>Bitter, chocolate, nutty; thick crema</dd></dl></article>
      <article class="label sp rv">${bean("#7a5636")}<h3>Liberica</h3><p class="latin">Coffea liberica</p>
        <dl><dt>Share</dt><dd>Well under 2%</dd><dt>Grows</dt><dd>Lowland heat; big, lopsided beans</dd><dt>Caffeine</dt><dd>Lower than robusta</dd><dt>Tastes</dt><dd>Smoky, woody, jackfruit</dd></dl></article>
      <article class="label sp rv">${bean("#5d3a22")}<h3>Excelsa</h3><p class="latin">Coffea dewevrei</p>
        <dl><dt>Share</dt><dd>Tiny, growing in Uganda &amp; SE Asia</dd><dt>Grows</dt><dd>Handles heat and drought</dd><dt>Status</dt><dd>Its own species since 2025</dd><dt>Tastes</dt><dd>Tart, dark-fruity</dd></dl></article>
    </div>
    <div class="share rv">
      <div class="share-bar" role="img" aria-label="World coffee production forecast 2026/27: arabica 105.9 million bags, robusta 83.8 million bags"><div style="flex:105.9;background:#6a4128">Arabica · 105.9 M bags</div><div style="flex:83.8;background:#2a1a12">Robusta · 83.8 M</div></div>
      <p class="share-cap">World production forecast 2026/27: a record 189.7 M bags of 60 kg. USDA FAS, July 2026. Kew scientists are trialling heat-tolerant species like stenophylla and liberica × excelsa hybrids as the climate warms.</p>
    </div>
  </section>

  <section class="sec" aria-labelledby="roast-h">
    <div class="sec-head"><div><p class="eyebrow">02 · Roast</p><h2 class="h-lg" id="roast-h">Green to black<br>in 12 minutes.</h2></div><span class="sec-num" aria-hidden="true">02</span></div>
    <div class="roast">
      <div class="roast-stage" id="roastStage"><div class="roast-temp" aria-hidden="true"><b id="roastT">25 °C</b>bean temp</div><svg id="roastBean" viewBox="0 0 200 200" aria-hidden="true"></svg></div>
      <div>
        <p class="roast-name" id="roastName">Green</p>
        <p class="roast-notes" id="roastNotes"></p>
        <input class="dial" id="roastRange" type="range" min="0" max="100" value="0" aria-label="Roast level" style="margin-top:16px">
        <div class="roast-scale" aria-hidden="true"><span style="left:0%">green</span><span class="crack" style="left:32%">1st crack</span><span style="left:52%">medium</span><span class="crack" style="left:72%">2nd crack</span><span style="left:100%;transform:translateX(-100%)">dark</span></div>
        <div class="bars" id="roastBars"></div>
        <p class="muted" style="font-size:14px;margin-top:16px">Caffeine barely changes with roast. Dark beans lose weight and swell, so a scoop of light roast holds slightly more.</p>
      </div>
    </div>
  </section>

  <section class="sec" aria-labelledby="proc-h">
    <div class="sec-head"><div><p class="eyebrow">03 · Process</p><h2 class="h-lg" id="proc-h">How the fruit<br>comes off.</h2></div><span class="sec-num" aria-hidden="true">03</span></div>
    <div class="process">
      <div class="cherry-stage" id="cherry" aria-hidden="true"></div>
      <div>
        <div class="seg" role="group" aria-label="Process" id="procTabs"><button type="button" data-p="washed" aria-pressed="true">Washed</button><button type="button" data-p="honey" aria-pressed="false">Honey</button><button type="button" data-p="natural" aria-pressed="false">Natural</button><button type="button" data-p="anaerobic" aria-pressed="false">Anaerobic</button></div>
        <h3 class="h-md" id="procName" style="margin-top:20px">Washed</h3>
        <p style="margin-top:8px;font-size:17px;color:var(--ink-2)" id="procLine"></p>
        <div class="layer-key" id="layerKey"></div>
        <div class="proc-out" id="procOut"></div>
      </div>
    </div>
  </section>

  <section class="sec" aria-labelledby="belt-h">
    <div class="sec-head"><div><p class="eyebrow">04 · Origin</p><h2 class="h-lg" id="belt-h">The coffee belt.</h2><p class="lede" style="margin-top:12px">Coffee grows between the tropics. Circles show each country’s forecast crop. Tap one.</p></div><span class="sec-num" aria-hidden="true">04</span></div>
    <div class="belt rv"><div class="belt-scroll" id="beltMap"></div></div>
    <div class="origin-card label" id="originCard" aria-live="polite"></div>
    <div class="origin-list" id="originList" role="group" aria-label="Origins"></div>
  </section>
</div>`,
};
