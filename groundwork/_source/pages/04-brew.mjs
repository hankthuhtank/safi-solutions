export default {
  id: "brew",
  url: "/groundwork/brew/",
  title: "Brew guide",
  desc: "Brew coffee without an espresso machine: pour-over, Chemex, AeroPress, French press, moka pot, Turkish cezve, Vietnamese phin, siphon and cold brew, with a grind-size ruler, a ratio calculator and a guided brew timer.",
  script: "brew.js",
  body: `
<div class="wrap">
  <section class="intro" aria-labelledby="brew-h">
    <p class="eyebrow">Brew · The slow bar</p>
    <h1 class="h-xl" id="brew-h">No machine?<br>No problem.</h1>
    <p class="lede">Every brewer is the same three dials: how fine, how much, how long. Pick one and brew along with the timer.</p>
  </section>

  <section aria-labelledby="grind-h">
    <div class="sec-head"><div><p class="eyebrow">01 · Grind size</p><h2 class="h-lg" id="grind-h">Finer means slower.</h2><p class="lede" style="margin-top:12px">Particles drawn to scale. Short contact needs fine grounds; long steeps need coarse ones.</p></div><span class="sec-num" aria-hidden="true">01</span></div>
    <div class="grind-ruler rv">
<div class="gr-in">
      <div class="gr-track"><canvas id="grCanvas" aria-hidden="true"></canvas></div>
      <div class="gr-axis" id="grAxis" aria-hidden="true"></div>
      <div class="gr-methods" id="grMethods" role="group" aria-label="Brew methods by grind size"></div>
      <div class="gr-like" aria-hidden="true"><span>flour</span><span>fine salt</span><span>table salt</span><span>sand</span><span>sea salt</span><span>peppercorns</span></div>
      </div>
      <p class="muted" style="font-size:12.5px;margin-top:10px">Micron ranges are starting points from grinder charts (Honest Coffee Guide, The Coffee Locator). Every grinder labels them differently: taste and brew time are the real test.</p>
    </div>
  </section>

  <section class="sec" aria-labelledby="meth-h">
    <div class="sec-head"><div><p class="eyebrow">02 · Methods</p><h2 class="h-lg" id="meth-h">Pick a brewer.</h2></div><span class="sec-num" aria-hidden="true">02</span></div>
    <div class="methods" id="methods" role="group" aria-label="Brewers"></div>
    <div class="brewer" id="brewer">
      <div class="brewer-card">
        <h3 id="bName">Pour-over</h3>
        <p class="say" id="bLine"></p>
        <div class="spec-grid" id="bSpec"></div>
        <div class="calc">
          <div class="seg" role="group" aria-label="Strength" id="bStrength"><button type="button" data-k="1.12" aria-pressed="false">Lighter</button><button type="button" data-k="1" aria-pressed="true">Standard</button><button type="button" data-k=".9" aria-pressed="false">Stronger</button></div>
          <div><label class="range-ends" for="bWater"><span>Less</span><span>Water <b class="num" id="bWaterV">250 g</b></span><span>More</span></label><input class="dial" id="bWater" type="range" min="100" max="1000" step="10" value="250"></div>
          <div class="calc-out"><b id="bCoffee">15 g</b><span id="bOut">coffee · 250 g water · ≈ 220 ml in the cup</span></div>
        </div>
        <p style="margin-top:14px"><a class="btn ghost small" id="bRecipe" href="/groundwork/recipes/">Recipe card →</a></p>
      </div>
      <div class="ticket timer" id="timer" aria-live="polite"></div>
    </div>
  </section>

  <section class="sec" aria-labelledby="water-h">
    <div class="sec-head"><div><p class="eyebrow">03 · Water</p><h2 class="h-lg" id="water-h">Coffee is 98% water.</h2></div><span class="sec-num" aria-hidden="true">03</span></div>
    <div class="facts">
      <div class="fact rv"><b>1:16</b><p>A good starting ratio for filter coffee. The SCA “golden cup” is about 55 g per litre.</p></div>
      <div class="fact rv"><b>92–96<sup>°C</sup></b><p>Just off the boil. Hotter for light roasts, a little cooler for dark.</p></div>
      <div class="fact rv"><b>1.15–1.45<sup>%</sup></b><p>Dissolved coffee in a good filter cup. Espresso is around 8–12%.</p></div>
      <div class="fact rv"><b>2–4<sup>wks</sup></b><p>After roasting, beans are at their best. Let them rest a few days first.</p></div>
    </div>
  </section>
</div>`,
};
