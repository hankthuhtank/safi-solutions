export default {
  id: "recipes",
  url: "/groundwork/recipes/",
  title: "Recipes",
  desc: "112 coffee recipes drawn as cups: espresso drinks, iced coffee, pour-over, world classics from Hanoi egg coffee to Turkish coffee, Starbucks, Dunkin’, Dutch Bros and McCafé-inspired home recipes and coffee cocktails. Filter by what is in your kitchen.",
  script: "recipes.js",
  body: `
<div class="wrap">
  <section class="intro" aria-labelledby="rx-h">
    <p class="eyebrow">The pass · <span id="rxTotal">112</span> drinks</p>
    <h1 class="h-xl" id="rx-h">Every coffee,<br>drawn as a cup.</h1>
    <p class="lede">The layers are the recipe. Tap a cup for its ticket, or tell us what is in your kitchen.</p>
  </section>

  <div class="rx-tools" id="rxTools">
    <label class="rx-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><span class="sr">Search recipes</span><input id="rxQ" type="search" placeholder="Search: caramel, Dunkin, oat…" autocomplete="off"></label>
    <div class="seg" role="group" aria-label="View"><button type="button" data-view="shelves" aria-pressed="true">Shelves</button><button type="button" data-view="pantry" aria-pressed="false">My kitchen</button><button type="button" data-view="map" aria-pressed="false">Map</button></div>
    <div class="seg" role="group" aria-label="Temperature"><button type="button" data-t="all" aria-pressed="true">All</button><button type="button" data-t="hot" aria-pressed="false">Hot</button><button type="button" data-t="iced" aria-pressed="false">Iced</button></div>
    <span class="rx-count" id="rxCount" aria-live="polite"></span>
    <div class="rx-chips" id="rxChips" role="group" aria-label="Shelf"></div>
  </div>

  <div class="brand-filter"><label for="rxBrand">From your favourite shop</label><select id="rxBrand"><option value="all">All recipes</option><option value="starbucks">Starbucks inspired</option><option value="dunkin">Dunkin’ inspired</option><option value="dutch">Dutch Bros inspired</option><option value="mccafe">McCafé inspired</option><option value="coffeehouse">Coffeehouse classics</option></select><p>Home adaptations, not official formulas. Adjust sweetness to your taste.</p></div>

  <section class="pantry" id="pantry" hidden aria-labelledby="pantry-h">
    <div class="pantry-head"><b id="pantry-h"><span id="canN">0</span> you can make tonight</b><div class="row-btns"><button class="btn ghost small" type="button" id="pTypical">Typical kitchen</button><button class="btn ghost small" type="button" id="pClear">Clear</button></div></div>
    <p class="muted" style="margin-top:6px;font-size:14px">Tap what you have. Water, sugar, salt and a kettle are on the house. <span id="almostN"></span></p>
    <div id="pantryGroups"></div>
  </section>

  <section class="rx-map" id="rxMap" hidden aria-label="Caffeine and milk map"></section>
  <div id="shelves"></div>
</div>

<dialog class="rx" id="rx" aria-labelledby="rxName">
  <button class="rx-close" type="button" aria-label="Close" data-close><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  <div class="rx-in" id="rxIn"></div>
</dialog>`,
};
