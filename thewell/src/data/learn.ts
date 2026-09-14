export interface LearnSection {
  heading: string;
  body: string;
  visual?: "shake-stir" | "glasses" | "formulas" | "ice" | "pour" | "terms";
}

export interface LearnChapter {
  id: string;
  title: string;
  dek: string;
  kicker: string;
  sections: LearnSection[];
}

export const LEARN: LearnChapter[] = [
  {
    id: "glassware",
    title: "Glassware",
    dek: "The vessel is part of the recipe. It sets aroma, ice, and how fast the drink dies.",
    kicker: "The cup",
    sections: [
      {
        heading: "Why the glass matters",
        body: "A coupe puts aroma in the face and keeps a stirred drink cold without extra ice. A rocks glass is a stage for a cube. A Collins is length. A flute holds bubbles. If you put a Martini in a pint, you didn't make a bigger Martini. You made a warm one.",
        visual: "glasses",
      },
      {
        heading: "The working set",
        body: "If you own six shapes you can serve almost this whole book: coupe or Nick & Nora, rocks, highball, flute, wine, and a mug. Everything else is theater — useful theater, but theater.",
      },
    ],
  },
  {
    id: "shake-stir",
    title: "Shake versus stir",
    dek: "Cloudy and cold, or silk and clear. The drink tells you which.",
    kicker: "The motion",
    sections: [
      {
        heading: "The rule that almost always holds",
        body: "Shake anything with juice, dairy, or egg. Stir anything that is only spirits, vermouth, and bitters. Shake to aerate and smash ice into the drink. Stir to chill and dilute without the foam.",
        visual: "shake-stir",
      },
      {
        heading: "How hard, how long",
        body: "A sour wants ten to twelve seconds of a violent shake — the tin should frost. A Martini wants twenty to thirty seconds of a quiet stir. You are not mixing. You are metering cold and water.",
      },
      {
        heading: "The exceptions",
        body: "Bond was wrong about the Martini and accidentally right about the Vesper — that drink has Lillet and enough volume to want a hard shake. A Ramos wants a minute. A Negroni will survive being built in the glass if you are in the weeds. Taste is the only boss.",
      },
    ],
  },
  {
    id: "formulas",
    title: "The formulas",
    dek: "Most of the canon is a handful of ratios wearing different coats.",
    kicker: "The bones",
    sections: [
      {
        heading: "Learn six shapes, know two hundred drinks",
        body: "Sour 2:1:1. Old Fashioned — spirit, sugar, bitters. Martini — spirit and vermouth. Negroni — equal parts. Highball — spirit and length. Spritz — 3:2:1 sparkling, bitter, soda. Everything else is a variation with a story.",
        visual: "formulas",
      },
      {
        heading: "Why this matters at the stick",
        body: "When someone asks for a whiskey sour with mezcal, you are not inventing. You are moving one corner of a triangle. When the Daiquiri is too sharp, you are not lost — you are 1/8 oz of syrup away from balance.",
      },
    ],
  },
  {
    id: "ice",
    title: "Ice",
    dek: "Ice is an ingredient. It is water, cold, and time.",
    kicker: "The silent pour",
    sections: [
      {
        heading: "What ice actually does",
        body: "It chills. It dilutes. It changes texture. A large cube in an Old Fashioned melts slowly so the drink opens instead of collapsing. Crushed ice in a Julep melts fast on purpose — the drink is supposed to water as you sit with it. Blenders turn ice into the body of the drink.",
        visual: "ice",
      },
      {
        heading: "The working types",
        body: "Hard cubes for shaking and highballs. One large cube for stirred drinks served down. Crushed or pebble for juleps, swizzles, and mint. Never use wet bag ice if you can help it — it is already melted water wearing a costume.",
      },
    ],
  },
  {
    id: "measure",
    title: "Measure",
    dek: "Free pour is a skill. A jigger is a truth-teller. Use both.",
    kicker: "The count",
    sections: [
      {
        heading: "Parts, ounces, milliliters",
        body: "American bars live in ounces. 1 oz is 30 ml at the stick. A jigger is 1 oz / 2 oz, or ¾ / 1½. Parts are ratios: a Negroni in parts works in any size glass. Count pours (one-Mississippi per quarter-ounce) only after you have calibrated your bottle and your wrist.",
        visual: "pour",
      },
      {
        heading: "Taste, then correct",
        body: "A measured spec is a starting line. Lime changes with the season. A ¾ oz of July lime is not a ¾ oz of January lime. Taste from the tin. Add a barspoon of syrup or a squeeze of citrus. Then strain.",
      },
    ],
  },
  {
    id: "terms",
    title: "The language",
    dek: "Up, down, neat, dirty, dry, perfect, with a twist. Short words that change the drink.",
    kicker: "Call it",
    sections: [
      {
        heading: "How it's served",
        body: "Neat: spirit in a glass, no ice. Up: chilled and strained, no ice. Down / on the rocks: over ice. Straight up is up. A twist is peel oil. A wash or rinse is a coating you dump. A float sits on top.",
        visual: "terms",
      },
      {
        heading: "How it's built",
        body: "Dry Martini: less vermouth. Wet: more. Perfect: half sweet, half dry vermouth. Dirty: olive brine. Bruised: shaken when it should have been stirred — a complaint, not a recipe. Virgin: the structure without the proof.",
      },
    ],
  },
  {
    id: "garnish",
    title: "Garnish",
    dek: "If it doesn't change aroma, texture, or salt, it's decoration. Decoration is allowed. Don't confuse it with the drink.",
    kicker: "The last move",
    sections: [
      {
        heading: "Peel is a technique",
        body: "A twist is not a curl on the rim. Cut a wide swath of peel, pith mostly off, pinch it over the drink so the oil sprays the surface, then drop it or discard it. The Sazerac discards. The Old Fashioned keeps. Both are correct because the oil already landed.",
      },
      {
        heading: "Salt, sugar, mint, cherry",
        body: "Salt makes tequila and citrus louder — half-rim so they can choose. Sugar on a Sidecar is traditional and also optional. Mint is slapped, never shredded. A neon cherry is a different garnish from Luxardo. Say which one you mean.",
      },
    ],
  },
  {
    id: "bitters",
    title: "Bitters",
    dek: "The bartender's salt. Two dashes can correct a drink. A heavy hand makes it medicinal.",
    kicker: "The dashes",
    sections: [
      {
        heading: "What they are",
        body: "High-proof infusions of bark, peel, and spice. They don't make a drink bitter the way Campari does. They add a middle and a finish. Angostura is clove and cinnamon. Peychaud's is anise and cherry. Orange is dried peel. That is most of what you need.",
      },
      {
        heading: "Where they go",
        body: "Old Fashioned, Manhattan, anything brown and stirred. A dash on sour foam is aroma, not flavor. A rinse of absinthe is bitters' louder cousin. If a drink tastes flat, ask if it wanted a dash before you add more sugar.",
      },
    ],
  },
  {
    id: "wine-beer",
    title: "Wine and beer at the stick",
    dek: "You will be asked to pour both. The standards are short and physical.",
    kicker: "The other bottles",
    sections: [
      {
        heading: "Wine",
        body: "Hold the bottle at the shoulder, label out. A still-wine pour is about 5 oz — the glass should be a third full, not a bath. Sparkling: down the side or into the glass already tilted, so you don't pour a glass of foam. Don't perfume the pour with a spinning wrist.",
      },
      {
        heading: "Beer",
        body: "Tilt the glass 45 degrees, pour down the side, then straighten to build a finger of head. The head is aroma and a lid, not waste. A Michelada is still a beer pour with seasoning — keep the lager cold and last in the glass so it doesn't go flat in the mix.",
      },
    ],
  },
  {
    id: "stock",
    title: "Stocking a well",
    dek: "You don't need a hundred bottles. You need a spine, then you grow sideways.",
    kicker: "The well",
    sections: [
      {
        heading: "The first twelve",
        body: "Bourbon, rye, gin, vodka, blanco tequila, white rum, a dark rum, brandy or cognac, Campari, dry vermouth, sweet vermouth, Cointreau. Add Angostura, citrus, and simple. That pours an embarrassing amount of the canon.",
      },
      {
        heading: "Then the bottles that unlock families",
        body: "Mezcal unlocks smoke. Jamaican rum unlocks tiki. Green Chartreuse unlocks the Last Word. Aperol unlocks the spritz. Coffee liqueur and espresso unlock the night. Buy the next bottle for the drink you actually want to make, not for the shelf photo.",
      },
    ],
  },
];
