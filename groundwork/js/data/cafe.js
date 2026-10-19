export const BRANDS = {
  starbucks: "Starbucks",
  dunkin: "Dunkin’",
  dutch: "Dutch Bros",
  mccafe: "McCafé",
  coffeehouse: "Coffeehouse classics",
};

const SB = "https://www.starbucks.com/menu/drinks";
const DD = "https://news.dunkindonuts.com/news/dunkin-espresso-new-signature-lattes";
const DB = "https://www.dutchbros.com/menu/iced-coffee/iced-dutch-faves/";
const MC = "https://www.mcdonalds.com/us/en-us/mccafe.html";

// Single-serving home recipes. Brand menus establish the flavour combinations;
// these quantities and methods are Groundwork's adaptations, not store formulas.
function drink(id, n, brand, flavours, note, options = {}) {
  const {
    hot = false,
    blended = false,
    coffee = false,
    breve = false,
    base = "milk",
    extra = [],
    steps,
    needs = [],
    source,
    garnish,
  } = options;
  const milk = coffee || base === "none" ? 0 : breve ? 150 : blended ? 100 : hot ? 200 : 150;
  return {
    id,
    n,
    brand,
    s: "cafe",
    v: hot ? "latte" : "highball",
    t: hot ? "hot" : "iced",
    blended,
    o: brand === "coffeehouse" ? "Coffeehouse classic" : `${BRANDS[brand]} · home version`,
    layers: blended
      ? [
          ["lightcoffee", 310],
          ["whip", 25, "w"],
        ]
      : [
          ...flavours.map(([amount, unit, ingredient, key, ink]) => [
            ink || key,
            unit === "tsp" ? amount * 5 : amount,
          ]),
          [coffee ? "coldbrew" : "espresso", coffee ? 200 : 60],
          ...(milk
            ? [[breve ? "halfhalf" : base === "oat" ? "oat" : hot ? "steamed" : "milk", milk, "b"]]
            : []),
          ...(!hot ? [["ice", 90, "i"]] : []),
          ...(garnish ? [[garnish, 25, garnish === "whip" ? "w" : "f"]] : []),
        ],
    spec: [
      [
        coffee ? 200 : 2,
        coffee ? "ml" : "shots",
        coffee
          ? "ready-to-drink cold brew or chilled strong coffee (not concentrate)"
          : "espresso (about 60 ml total)",
      ],
      ...(milk
        ? [
            [
              milk,
              "ml",
              breve
                ? "half-and-half"
                : `${hot ? "steamed" : "cold"} ${base === "oat" ? "oat milk" : base === "chocmilk" ? "chocolate milk" : "milk"}`,
            ],
          ]
        : []),
      ...flavours.map(([a, u, i]) => [a, u, i]),
      ...(!hot ? [[blended ? 150 : 120, "g", "ice"]] : []),
      ...extra,
    ],
    steps:
      steps ||
      (blended
        ? [
            "Let the espresso cool. Add everything except toppings to a blender.",
            "Blend until thick and smooth. Add a splash of milk only if the blender needs it.",
            "Pour into a tall glass and add the listed toppings. Drink straight away.",
          ]
        : hot
          ? [
              "Stir the syrups or sauces into the hot espresso.",
              "Add the steamed milk, then the listed toppings.",
            ]
          : [
              "Stir the syrups or sauces into the coffee; cool briefly.",
              `Fill a tall glass with ice, then add ${milk ? "the milk and coffee" : "the coffee"}. Stir.`,
              "Add the listed toppings and serve.",
            ]),
    note,
    needs: [
      ...new Set([
        coffee ? "brewed|readycoffee" : "shot",
        ...(milk
          ? [
              breve
                ? "halfhalf"
                : base === "oat"
                  ? "oat"
                  : base === "chocmilk"
                    ? "chocmilk"
                    : "milk",
            ]
          : []),
        ...flavours.map((f) => f[3]),
        ...(!hot ? ["ice"] : []),
        ...(blended ? ["blender"] : []),
        ...needs,
      ]),
    ],
    caf: coffee ? 150 : 126,
    milk: milk ? 60 : coffee ? 15 : 0,
    sweet: 65,
    source: source || { starbucks: SB, dunkin: DD, dutch: DB, mccafe: MC }[brand],
    serving: "1 drink · use a 12–16 oz cup",
    caffeineNote: coffee
      ? "About 150 mg with 200 ml cold brew; use your coffee’s label for a closer estimate."
      : "Estimate for this home recipe: two shots at about 63 mg each. Store recipes and caffeine differ.",
    rel: [coffee ? "cold-brew" : "iced-latte", "vanilla-latte"],
  };
}

export const CAFE_RECIPES = [
  drink(
    "sb-iced-caramel-macchiato",
    "Iced caramel macchiato",
    "starbucks",
    [
      [15, "ml", "vanilla syrup", "vanilla"],
      [10, "ml", "caramel sauce, for drizzling", "caramel"],
    ],
    "Vanilla milk, espresso on top and a caramel finish. Layer first; stir when you drink.",
    {
      source: "https://www.starbucksathome.com/recipes/iced-caramel-macchiato",
      steps: [
        "Stir vanilla syrup into the cold milk in a tall glass.",
        "Add ice, then gently pour the espresso over the milk.",
        "Drizzle caramel across the top.",
      ],
    },
  ),
  drink(
    "sb-iced-white-mocha",
    "Iced white chocolate mocha",
    "starbucks",
    [[25, "ml", "white chocolate sauce", "whitechoc", "vanilla"]],
    "White chocolate gives this iced latte its soft, buttery sweetness.",
    {
      source: "https://www.starbucks.com/menu/product/420/iced",
      extra: [[20, "ml", "whipped cream"]],
      needs: ["cream"],
      garnish: "whip",
    },
  ),
  drink(
    "sb-vanilla-sweet-cream",
    "Vanilla sweet cream cold brew",
    "starbucks",
    [[10, "ml", "vanilla syrup", "vanilla"]],
    "A ribbon of vanilla cream through cold coffee. Sweet cream is poured, rather than whipped.",
    {
      coffee: true,
      source: "https://athome.starbucks.com/recipe/vanilla-sweet-cream-cold-brew",
      extra: [
        [30, "ml", "heavy cream"],
        [20, "ml", "cold milk"],
        [5, "ml", "vanilla syrup, for the cream"],
      ],
      needs: ["cream", "milk"],
      garnish: "cream",
      steps: [
        "Mix heavy cream, milk and 5 ml vanilla syrup until smooth; do not whip.",
        "Stir the remaining 10 ml vanilla into the coffee and pour over ice.",
        "Float the sweet cream on top. Refrigerate any unused cream.",
      ],
    },
  ),
  drink(
    "sb-pumpkin-cream-brew",
    "Pumpkin cream cold brew",
    "starbucks",
    [[10, "ml", "vanilla syrup", "vanilla"]],
    "Vanilla coffee under a pumpkin-spice cloud. Use plain pumpkin purée, not pie filling.",
    {
      coffee: true,
      source: "https://www.starbucks.com/menu/product/2123113/iced/nutrition",
      extra: [
        [30, "ml", "heavy cream"],
        [20, "ml", "milk"],
        [2, "tsp", "pumpkin purée"],
        [2, "tsp", "sweetened condensed milk"],
        [0.25, "tsp", "pumpkin pie spice"],
      ],
      needs: ["cream", "milk", "pumpkin", "condensed", "spices", "foam"],
      garnish: "saltcream",
      steps: [
        "Froth the cream, milk, pumpkin, condensed milk and spice just until thick but pourable.",
        "Stir vanilla syrup into the coffee and pour over ice.",
        "Spoon the pumpkin cream on top and finish with a pinch of spice.",
      ],
    },
  ),
  drink(
    "sb-caramel-blended",
    "Caramel blended coffee",
    "starbucks",
    [[25, "ml", "caramel sauce", "caramel"]],
    "A Frappuccino-inspired home blend. A little vanilla ice cream helps replace the shop’s thickened base.",
    {
      blended: true,
      extra: [
        [40, "g", "vanilla ice cream"],
        [20, "ml", "whipped cream"],
        [5, "ml", "caramel sauce, for drizzling"],
      ],
      needs: ["icecream", "cream"],
      garnish: "whip",
    },
  ),
  drink(
    "sb-peppermint-mocha",
    "Peppermint mocha",
    "starbucks",
    [
      [20, "ml", "chocolate sauce", "cocoa", "chocolate"],
      [10, "ml", "peppermint coffee syrup", "peppermint", "syrup"],
    ],
    "Chocolate with a cool mint edge. Use coffee syrup; peppermint extract is much stronger.",
    {
      hot: true,
      source: "https://about.starbucks.com/stories/2025/starbucks-peppermint-mocha/",
      extra: [[20, "ml", "whipped cream"]],
      needs: ["cream"],
      garnish: "whip",
    },
  ),
  drink(
    "sb-cinnamon-dolce",
    "Cinnamon dolce latte",
    "starbucks",
    [[20, "ml", "cinnamon dolce syrup", "cinnamonsyrup", "spice"]],
    "A warm cinnamon latte with a sweet cream cap and a little cinnamon sugar.",
    {
      hot: true,
      source: "https://www.starbucks.com/menu/product/414/hot/nutrition",
      extra: [
        [20, "ml", "whipped cream"],
        [0.25, "tsp", "cinnamon sugar"],
      ],
      needs: ["cream", "cinnamon"],
      garnish: "whip",
    },
  ),
  drink(
    "sb-iced-vanilla-latte",
    "Iced vanilla latte",
    "starbucks",
    [[15, "ml", "vanilla syrup", "vanilla"]],
    "The easy starting point: espresso, milk, vanilla and ice.",
  ),

  drink(
    "dd-caramel-craze",
    "Caramel Craze latte",
    "dunkin",
    [[25, "ml", "caramel sauce", "caramel"]],
    "A caramel latte finished with whipped cream, caramel and cinnamon sugar.",
    {
      extra: [
        [20, "ml", "whipped cream"],
        [5, "ml", "caramel sauce, for drizzling"],
        [0.25, "tsp", "cinnamon sugar"],
      ],
      needs: ["cream", "cinnamon"],
      garnish: "whip",
    },
  ),
  drink(
    "dd-cocoa-mocha",
    "Cocoa Mocha latte",
    "dunkin",
    [[25, "ml", "chocolate sauce", "cocoa", "chocolate"]],
    "A chocolate latte with a cocoa-dusted cream top.",
    {
      extra: [
        [20, "ml", "whipped cream"],
        [5, "ml", "chocolate sauce, for drizzling"],
        [0.25, "tsp", "cocoa powder"],
      ],
      needs: ["cream"],
      garnish: "whip",
    },
  ),
  drink(
    "dd-blueberry-crisp",
    "Blueberry Crisp latte",
    "dunkin",
    [
      [10, "ml", "blueberry coffee syrup", "blueberry", "cherry"],
      [15, "ml", "caramel sauce", "caramel"],
    ],
    "Blueberry and caramel bring a crumble-like flavour to this home take on a past signature drink.",
    {
      extra: [
        [20, "ml", "whipped cream"],
        [5, "ml", "caramel sauce, for drizzling"],
        [0.25, "tsp", "cinnamon sugar"],
      ],
      needs: ["cream", "cinnamon"],
      garnish: "whip",
    },
  ),
  drink(
    "dd-butter-pecan",
    "Butter pecan iced coffee",
    "dunkin",
    [[25, "ml", "butter pecan coffee syrup", "butterpecan", "caramel"]],
    "Nutty, buttery iced coffee. A home syrup stands in for Dunkin’s proprietary swirl.",
    {
      coffee: true,
      source: "https://news.dunkindonuts.com/blog/all-things-butter-pecan",
      extra: [[40, "ml", "milk or cream"]],
      needs: ["milk|cream"],
      steps: [
        "Stir butter pecan syrup into the chilled coffee.",
        "Pour over ice, then add milk or cream to taste.",
      ],
    },
  ),
  drink(
    "dd-turtle-latte",
    "Turtle latte",
    "dunkin",
    [
      [15, "ml", "butter pecan coffee syrup", "butterpecan", "caramel"],
      [15, "ml", "chocolate sauce", "cocoa", "chocolate"],
    ],
    "Butter pecan and chocolate with a caramel finish, inspired by the Turtle Signature Latte.",
    {
      source: "https://news.dunkindonuts.com/blog/all-things-butter-pecan",
      extra: [
        [20, "ml", "whipped cream"],
        [5, "ml", "caramel sauce"],
        [1, "tsp", "crushed chocolate-caramel cookie crumbs"],
      ],
      needs: ["cream", "caramel", "cookies"],
      garnish: "whip",
    },
  ),
  drink(
    "dd-french-vanilla",
    "French vanilla iced coffee",
    "dunkin",
    [[20, "ml", "French vanilla coffee syrup", "vanilla"]],
    "A simple home take on sweet vanilla iced coffee; swirl strength varies by brand.",
    {
      coffee: true,
      source: "https://news.dunkindonuts.com/news/dunkin-donuts-declares-espresso-revolution",
      extra: [[40, "ml", "milk or cream"]],
      needs: ["milk|cream"],
      steps: [
        "Mix vanilla syrup into chilled strong coffee.",
        "Pour over ice and add milk or cream. Start with less syrup if yours is especially sweet.",
      ],
    },
  ),

  drink(
    "db-golden-eagle",
    "Golden Eagle-style breve",
    "dutch",
    [
      [10, "ml", "vanilla syrup", "vanilla"],
      [15, "ml", "caramel sauce", "caramel"],
    ],
    "Caramel and vanilla with half-and-half for a richer, creamy drink.",
    {
      breve: true,
      source: DB + "golden-eagle/",
      extra: [[5, "ml", "caramel sauce, for drizzling"]],
    },
  ),
  drink(
    "db-annihilator",
    "Annihilator-style breve",
    "dutch",
    [[25, "ml", "chocolate macadamia nut coffee syrup", "macadamia", "chocolate"]],
    "Chocolate-macadamia syrup, espresso and half-and-half. Use the combined syrup for the closest flavour.",
    {
      breve: true,
      source: DB + "annihilator/",
    },
  ),
  drink(
    "db-kicker",
    "Kicker-style breve",
    "dutch",
    [[20, "ml", "non-alcoholic Irish cream coffee syrup", "irishsyrup", "vanilla"]],
    "Irish cream flavour without alcohol, rounded out with half-and-half.",
    {
      breve: true,
      source: DB + "kicker/",
    },
  ),
  drink(
    "db-caramelizer",
    "Caramelizer-style mocha",
    "dutch",
    [[20, "ml", "caramel sauce", "caramel"]],
    "Chocolate milk does the heavy lifting in this caramel mocha.",
    {
      base: "chocmilk",
      source: DB + "caramelizer/",
    },
  ),

  drink(
    "mc-caramel-frappe",
    "Caramel frappé",
    "mccafe",
    [[25, "ml", "caramel sauce", "caramel"]],
    "A coffee-milkshake home version with caramel all the way through.",
    {
      blended: true,
      source: "https://www.mcdonalds.com/us/en-us/product/frappe-caramel-small.html",
      extra: [
        [40, "g", "vanilla ice cream"],
        [20, "ml", "whipped cream"],
        [5, "ml", "caramel drizzle"],
      ],
      needs: ["icecream", "cream"],
      garnish: "whip",
    },
  ),
  drink(
    "mc-mocha-frappe",
    "Mocha frappé",
    "mccafe",
    [[25, "ml", "chocolate sauce", "cocoa", "chocolate"]],
    "Chocolate, coffee and ice blended into a thick, cold treat.",
    {
      blended: true,
      extra: [
        [40, "g", "vanilla ice cream"],
        [20, "ml", "whipped cream"],
        [5, "ml", "chocolate drizzle"],
      ],
      needs: ["icecream", "cream"],
      garnish: "whip",
    },
  ),
  drink(
    "mc-iced-mocha",
    "Iced mocha",
    "mccafe",
    [[25, "ml", "chocolate sauce", "cocoa", "chocolate"]],
    "Chocolate and espresso over ice, finished with cream and chocolate drizzle.",
    {
      source: "https://www.mcdonalds.com/us/en-us/product/iced-mocha-large.html",
      extra: [
        [20, "ml", "whipped cream"],
        [5, "ml", "chocolate drizzle"],
      ],
      needs: ["cream"],
      garnish: "whip",
    },
  ),
  drink(
    "mc-caramel-macchiato",
    "Caramel milk macchiato",
    "mccafe",
    [[25, "ml", "caramel syrup", "caramel"]],
    "Caramel-flavoured milk under espresso. This version uses caramel in the milk rather than vanilla.",
    {
      steps: [
        "Stir caramel syrup into the milk, then add ice.",
        "Pour the espresso slowly over the milk to leave a darker layer on top.",
      ],
    },
  ),

  drink(
    "iced-spanish-latte",
    "Iced Spanish latte",
    "coffeehouse",
    [[25, "ml", "sweetened condensed milk", "condensed"]],
    "Condensed milk turns a simple iced latte into a creamy, caramel-like treat.",
  ),
  drink(
    "iced-honey-oat",
    "Iced honey oat latte",
    "coffeehouse",
    [[15, "ml", "honey", "honey"]],
    "Dissolve the honey in the hot espresso first so it does not sink and stick.",
    { base: "oat" },
  ),
  drink(
    "maple-cream-brew",
    "Maple cream cold brew",
    "coffeehouse",
    [[10, "ml", "maple syrup", "maple"]],
    "Cold coffee under a softly frothed maple cream cap.",
    {
      coffee: true,
      extra: [
        [30, "ml", "heavy cream"],
        [20, "ml", "milk"],
        [5, "ml", "maple syrup, for the cream"],
      ],
      needs: ["cream", "milk", "foam"],
      garnish: "saltcream",
      steps: [
        "Froth cream, milk and 5 ml maple syrup until pourable and airy.",
        "Stir the remaining maple syrup into cold coffee and pour over ice.",
        "Float the maple cream on top.",
      ],
    },
  ),
  drink(
    "orange-espresso",
    "Orange espresso",
    "coffeehouse",
    [[120, "ml", "cold orange juice", "citrus", "orange"]],
    "Fresh orange juice and espresso: bright, bitter and sweet in one glass.",
    {
      base: "none",
      steps: [
        "Pour cold orange juice into a tall glass and add ice.",
        "Slowly pour the espresso over the back of a spoon. Stir before drinking.",
      ],
    },
  ),
  drink(
    "coconut-iced-latte",
    "Coconut iced latte",
    "coffeehouse",
    [[15, "ml", "coconut coffee syrup", "coconutsyrup", "coconut"]],
    "A light coconut twist on the everyday iced latte.",
  ),
  drink(
    "hazelnut-mocha",
    "Hazelnut mocha",
    "coffeehouse",
    [
      [15, "ml", "hazelnut coffee syrup", "hazelnut", "syrup"],
      [15, "ml", "chocolate sauce", "cocoa", "chocolate"],
    ],
    "Chocolate and toasted-nut flavour in a warm latte.",
    { hot: true },
  ),
];
