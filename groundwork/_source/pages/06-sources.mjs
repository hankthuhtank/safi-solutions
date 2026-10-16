const S = [
  ['Espresso & the machine', [
    ['Defining the ever-changing espresso', 'https://sca.coffee/sca-news/25-magazine/issue-3/defining-ever-changing-espresso-25-magazine-issue-3-zyx36', 'Specialty Coffee Association, 25 Magazine', 'Heritage espresso definition: dose, 90.5–96.1 °C, 9–10 atm, 20–30 s.'],
    ['Espresso extraction time & ratio', 'https://clivecoffee.com/blogs/learn/espresso-extraction-time-ratio-a-complete-guide-clive-coffee', 'Clive Coffee', '18 g in, 36 g out, 25–30 s starting recipe.'],
    ['Dialing in espresso by taste', 'https://clivecoffee.com/blogs/learn/dialing-in-espresso-by-taste', 'Clive Coffee', 'Sour → finer, bitter → coarser; sour-and-bitter points to channeling.'],
    ['Espresso extraction yield explained', 'https://completehomebarista.com/guides/espresso-extraction-yield-explained/', 'Complete Home Barista', 'The 18–22% extraction window used by the bar’s compass.'],
    ['Espresso', 'https://en.wikipedia.org/wiki/Espresso', 'Wikipedia', 'Bezzera 1901, Pavoni 1905, Gaggia’s lever and crema.'],
    ['History of espresso machines', 'https://counterculturecoffee.com/blogs/counter-culture-coffee/history-of-espresso-machines', 'Counter Culture Coffee', ''],
  ]],
  ['Milk', [
    ['How to steam milk for lattes and cappuccinos', 'https://clivecoffee.com/blogs/learn/how-to-steam-milk-for-lattes-and-cappuccinos-at-home-clive-coffee', 'Clive Coffee', 'Stretch times by drink.'],
    ['How to steam milk', 'https://breville.com/us/en/blog/coffee-and-espresso/how-to-steam-milk.html', 'Breville', ''],
    ['The science of milk', 'https://www.diffordsguide.com/g/1113/coffee/science-of-milk', 'Difford’s Guide', 'Lactose sweetness peaks near 60 °C.'],
  ]],
  ['Coffee in 2026', [
    ['Coffee: World Markets and Trade (July 2026)', 'https://apps.fas.usda.gov/psdonline/circulars/coffee.pdf', 'USDA Foreign Agricultural Service', '2026/27 forecast: 189.7 M bags; country and arabica/robusta tables used on Beans.'],
    ['Coffee tops beverage charts again; specialty hits new high', 'https://www.ncausa.org/newsroom/NCA-Coffee-tops-beverage-charts-again-specialty-coffee-hits-new-high', 'National Coffee Association', '47% had an espresso drink in the past week.'],
    ['More Americans drinking specialty coffee and ordering by app', 'https://dailycoffeenews.com/2026/09/15/nca-more-americans-are-drinking-specialty-coffee-and-ordering-by-app/', 'Daily Coffee News, Sep 2026', 'Cold coffee among past-day drinkers: 21%.'],
    ['Why is coffee back in bullish mode', 'https://www.barchart.com/story/news/3280820/why-is-coffee-back-in-bullish-mode', 'Barchart', 'Arabica record $4.3795/lb (Oct 2025); 2026 slide and rebound.'],
    ['Best of Panama auction sees world-record price', 'https://www.gcrmag.com/best-of-panama-auction-sees-world-record-price', 'Global Coffee Report', '2025 washed Geisha at US$30,204 per kg.'],
    ['The 13 biggest coffee trends of 2026', 'https://www.tastingtable.com/2237336/biggest-coffee-trends-2026/', 'Tasting Table', 'Protein, pistachio, savoury-sweet, espresso tonic.'],
    ['Coffee shop trends in 2026', 'https://perfectdailygrind.com/2026/01/coffee-shop-trends-in-2026/', 'Perfect Daily Grind', ''],
  ]],
  ['Beans, species & processing', [
    ['Genomic data define species delimitation in Liberica coffee', 'https://zaguan.unizar.es/record/165574', 'Davis et al., Nature Plants (2025)', 'Liberica, excelsa (C. dewevrei) and C. klainii as separate species.'],
    ['The search for climate-resilient coffee', 'https://news.mongabay.com/short-article/2026/06/the-search-for-climate-resilient-coffee-diversifying-beyond-arabica-and-robusta/', 'Mongabay, Jun 2026', 'Excelsa in Uganda; stenophylla.'],
    ['New coffee species to stand up against climate impact', 'https://www.gcrmag.com/new-coffee-species-to-stand-up-against-climate-impact', 'Global Coffee Report', ''],
    ['Arabica and robusta: meaning and curiosities', 'https://www.lavazzausa.com/en/coffee-secrets/arabica-robusta-meaning-vocabulary-curiosities', 'Lavazza', 'Caffeine and altitude ranges.'],
    ['The guide to coffee processing methods', 'https://1zpresso.coffee/jp/the-guide-to-coffee-processing-methods/', '1Zpresso', ''],
    ['Washed vs natural process coffee', 'https://presscoffee.com/pages/washed-vs-natural-process-coffee', 'Press Coffee', ''],
    ['Coffee roast levels chart', 'https://www.verenastreet.com/blogs/all-about-coffee/coffee-roast-levels', 'Verena Street', 'Crack temperatures vary by source: first ~196–205 °C, second ~224–230 °C.'],
    ['Types of coffee roasts', 'https://breville.com/us/en/blog/coffee-and-espresso/types-of-coffee-roasts.html', 'Breville', ''],
  ]],
  ['Brewing & grind', [
    ['Coffee grind size chart', 'https://honestcoffeeguide.com/coffee-grind-size-chart/', 'Honest Coffee Guide', 'Micron ranges per method.'],
    ['Coffee grind size chart', 'https://thecoffeelocator.com/guide/coffee-grind-size-chart/', 'The Coffee Locator', ''],
    ['James Hoffmann’s V60 recipe (write-up)', 'https://www.lamose.com/blogs/recipes/james-hoffmanns-ultimate-v60-pour-over-recipe', 'La Mose', '15 g : 250 g pulse pours.'],
    ['James Hoffmann’s AeroPress recipe (write-up)', 'https://lamose.com/blogs/recipes/james-hoffmanns-aeropress-recipe-world-champion-method', 'La Mose', '11 g : 200 g, 2 min, swirl, press.'],
  ]],
  ['Drinks & caffeine', [
    ['Cortado', 'https://en.wikipedia.org/wiki/Cortado', 'Wikipedia', 'Cortado and Gibraltar glass.'],
    ['Vietnamese coffee decoded', 'https://www.vietnamtourism.com/en/vietnamese-coffee-decoded-ca-phe-sua-da-egg-coffee-coconut-salt-coffee', 'Vietnam Tourism', 'Egg coffee (1946), salt coffee, coconut coffee.'],
    ['Caffeine content by brew method', 'https://www.seattlecoffeegear.com/blogs/learning-center/caffeine-content-by-brew-method', 'Seattle Coffee Gear', 'USDA-based per-ounce values.'],
    ['Spilling the beans: how much caffeine is too much?', 'https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much', 'U.S. Food & Drug Administration', '400 mg a day for healthy adults.'],
  ]],
];

export default {
  id: 'sources',
  url: '/groundwork/sources/',
  title: 'Sources',
  desc: 'Where Groundwork’s coffee numbers come from: SCA, USDA FAS, the National Coffee Association, Kew and Nature Plants research, and the brewing guides behind every recipe.',
  script: '',
  body: `
<div class="wrap">
  <section class="intro" aria-labelledby="src-h">
    <p class="eyebrow">Sources · Checked October 2026</p>
    <h1 class="h-xl" id="src-h">Where the<br>numbers come from.</h1>
    <p class="lede">Old standards and this year’s reports. Where sources disagree, we say so and give the range.</p>
  </section>
  <div class="src">
    ${S.map(([h, items]) => `<section><h2>${h}</h2><ul>${items.map(([t, u, by, note]) => `<li><a href="${u}" rel="noopener">${t}</a><time>${by}</time>${note ? `<span>${note}</span>` : ''}</li>`).join('')}</ul></section>`).join('')}
    <section><h2>About the bar’s shot</h2><p style="margin-top:12px;max-width:70ch;color:var(--ink-2)">The espresso machine is a teaching model, not a physics simulation. Grind size and dose set how much the puck resists water; that sets pressure and flow. Ratio, resistance and channeling then set extraction and strength, calibrated so a dialed-in 1:2 shot lands near 20% extraction and 10% strength. Real coffees shift these numbers: use them to learn the direction of each change.</p></section>
  </div>
</div>`,
};
