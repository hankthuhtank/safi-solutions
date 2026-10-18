export default {
  id: "menu",
  url: "/groundwork/menu/",
  title: "Kinds of coffee",
  desc: "Every kind of coffee drink explained in one cup: slide from espresso to latte, or from ristretto to americano, and read the café menu board with the ratio behind each drink.",
  script: "menu.js",
  body: `
<div class="wrap">
  <section class="intro" aria-labelledby="menu-h">
    <p class="eyebrow">The menu · Kinds of coffee</p>
    <h1 class="h-xl" id="menu-h">One shot.<br>A dozen drinks.</h1>
    <p class="lede">Most of a café menu is the same espresso with different amounts of milk, foam or water. Slide and watch.</p>
  </section>

  <section class="milkline" aria-labelledby="ml-name">
    <div class="ml-stage" id="mlStage" aria-hidden="true"></div>
    <div>
      <div class="seg" role="group" aria-label="Add"><button type="button" data-line="milk" aria-pressed="true">Add milk</button><button type="button" data-line="water" aria-pressed="false">Add water</button></div>
      <h2 class="ml-name" id="ml-name" style="margin-top:22px">Espresso</h2>
      <div class="ml-ratio" id="mlRatio"></div>
      <p class="ml-line" id="mlLine"></p>
      <div class="ml-bar" id="mlBar" aria-hidden="true"></div>
      <div class="ml-controls">
        <input class="dial" id="mlRange" type="range" min="0" max="100" step="1" value="0" aria-label="Amount of milk" aria-describedby="ml-name">
        <div class="ml-stops" id="mlStops"></div>
      </div>
      <p style="margin-top:6px"><a class="btn ghost small" id="mlLink" href="/groundwork/recipes/">Full recipe →</a></p>
    </div>
  </section>

  <section class="sec" aria-labelledby="board-h">
    <div class="board rv">
      <div class="board-head"><h2 id="board-h">On the board</h2><span>ratio · what makes it</span></div>
      <div class="board-cols" id="boardCols"></div>
    </div>
  </section>

  <section class="sec" aria-labelledby="caf-h">
    <div class="sec-head"><div><p class="eyebrow">How much caffeine</p><h2 class="h-lg" id="caf-h">Stronger isn’t always bigger.</h2><p class="lede" style="margin-top:12px">Per sip, espresso wins. Per cup, a big cold brew does.</p></div><span class="sec-num" aria-hidden="true">02</span></div>
    <div id="cafLadder" class="rv"></div>
    <p class="muted" style="font-size:12.5px;margin-top:12px">Typical values: USDA (≈63 mg per 1 oz espresso, ≈95 mg per 8 oz brewed); cold brew and instant vary widely. The FDA puts 400 mg a day as an amount not generally linked to negative effects in healthy adults.</p>
  </section>
</div>`,
};
