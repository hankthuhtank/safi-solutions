import type { FamilyId } from "./types";

export interface Family {
  id: FamilyId;
  name: string;
  formula: string;
  meaning: string;
  spine: string[];
}

export const FAMILIES: Family[] = [
  {
    id: "sour",
    name: "Sour",
    formula: "2 : 1 : 1  ·  spirit : citrus : sweet",
    meaning:
      "The most useful recipe in the bar. Change the spirit, change the citrus, change the sweet — it's still a sour.",
    spine: [
      "whiskey-sour",
      "daiquiri",
      "margarita",
      "brandy-crusta",
      "sidecar",
      "gimlet",
      "gold-rush",
      "penicillin",
      "last-word",
    ],
  },
  {
    id: "old-fashioned",
    name: "Old Fashioned",
    formula: "spirit + sugar + bitters",
    meaning:
      "The original cocktail. No juice. The drink is the spirit, corrected.",
    spine: ["old-fashioned", "sazerac", "oaxaca-old-fashioned", "ti-punch", "mint-julep", "rusty-nail"],
  },
  {
    id: "martini",
    name: "Martini",
    formula: "spirit + vermouth",
    meaning:
      "Spirit and aromatized wine, ice-cold. Ratio is a personality test.",
    spine: ["martini", "gibson", "vesper", "manhattan", "rob-roy", "vieux-carre"],
  },
  {
    id: "negroni",
    name: "Negroni",
    formula: "equal parts spirit, bitter, vermouth",
    meaning:
      "A triangle. Swap any corner and you still have a drink that teaches balance.",
    spine: ["negroni", "boulevardier", "old-pal", "white-negroni", "americano", "paper-plane", "naked-and-famous"],
  },
  {
    id: "highball",
    name: "Highball",
    formula: "spirit + long mixer + ice",
    meaning:
      "Length, cold, and carbonation. The mixer is half the drink.",
    spine: ["gin-tonic", "japanese-highball", "paloma", "moscow-mule", "dark-n-stormy", "ranch-water"],
  },
  {
    id: "tiki",
    name: "Tiki",
    formula: "rum + fruit + spice",
    meaning:
      "Not juice bombs — built sours with more rum than people expect, and spice where sugar wants to go.",
    spine: ["mai-tai", "jungle-bird", "pina-colada", "painkiller", "zombie"],
  },
  {
    id: "fizz",
    name: "Fizz / Collins",
    formula: "sour + soda",
    meaning:
      "A sour that learned to breathe. Shake the sour, then lengthen.",
    spine: ["tom-collins", "french-75", "mojito", "ramos-gin-fizz"],
  },
  {
    id: "spritz",
    name: "Spritz",
    formula: "3 : 2 : 1  ·  sparkling : bitter : soda",
    meaning:
      "Low proof, high sun. The bitter is the point, the bubbles are the vehicle.",
    spine: ["aperol-spritz", "sbagliato", "mimosa", "bellini", "kir-royale"],
  },
];
