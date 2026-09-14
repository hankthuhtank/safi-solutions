import { ALL_DRINKS } from "@/data/drinks";
import { INGREDIENTS } from "@/data/ingredients";
import type { Category, Drink, Ingredient, SpecLine, Unit } from "@/data/types";
import { hexHue } from "@/lib/utils";

export const drinks: Drink[] = ALL_DRINKS;
export const ingredients: Ingredient[] = INGREDIENTS;

export const drinkById = new Map(drinks.map((d) => [d.id, d]));
export const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "cocktails", label: "Cocktails" },
  { id: "highballs", label: "Highballs" },
  { id: "tiki", label: "Tiki" },
  { id: "brunch", label: "Brunch" },
  { id: "coffee", label: "Coffee" },
  { id: "shots", label: "Shots" },
  { id: "beer", label: "Beer" },
  { id: "frozen", label: "Frozen" },
  { id: "regional", label: "Regional" },
  { id: "mocktails", label: "Zero-proof" },
];

export const SHELVES = [
  { id: "whiskey", label: "Whiskey" },
  { id: "agave", label: "Agave" },
  { id: "rum", label: "Rum" },
  { id: "clear", label: "Gin & vodka" },
  { id: "brandy", label: "Brandy" },
  { id: "aperitif", label: "Aperitif" },
  { id: "liqueur", label: "Liqueurs" },
  { id: "bitters", label: "Bitters" },
  { id: "syrup", label: "Syrups" },
  { id: "mixer", label: "Mixers" },
  { id: "fresh", label: "Fresh" },
] as const;

const SKIP_KINDS = new Set(["garnish"]);
const SKIP_IDS = new Set(["hot-water"]);

export function ingredientOf(id: string): Ingredient | undefined {
  return ingredientById.get(id);
}

export function colorOf(id: string): string {
  return ingredientById.get(id)?.color ?? "#c8c0b4";
}

export function nameOf(id: string): string {
  return ingredientById.get(id)?.name ?? id;
}

export function visualOz(line: SpecLine): number {
  const { a, u } = line;
  switch (u) {
    case "oz":
      return a;
    case "ml":
      return a / 30;
    case "dash":
      return a * 0.08;
    case "drop":
      return a * 0.02;
    case "tsp":
      return a * 0.17;
    case "barspoon":
      return a * 0.125;
    case "splash":
      return 0.35;
    case "top":
      return 0;
    case "whole":
      return line.i === "egg-white" ? 0.6 : 0.15;
    case "sprig":
      return 0;
    case "pinch":
      return 0;
    case "wedge":
    case "wheel":
    case "twist":
      return 0.05;
    default:
      return a;
  }
}

export function isLiquidLine(line: SpecLine): boolean {
  const ing = ingredientById.get(line.i);
  if (!ing) return visualOz(line) > 0;
  if (ing.kind === "garnish") return false;
  if (line.u === "sprig" || line.u === "pinch" || line.u === "twist") return false;
  if (line.i === "mint" || line.i === "salt" || line.i === "sugar") return false;
  return visualOz(line) > 0 || line.u === "top";
}

export interface LiquidLayer {
  id: string;
  name: string;
  color: string;
  oz: number;
  foam?: boolean;
}

export function liquidLayers(drink: Drink): LiquidLayer[] {
  const lines = drink.spec.filter(isLiquidLine);
  const tops = lines.filter((l) => l.u === "top");
  const rest = lines.filter((l) => l.u !== "top");
  const measured = rest.map((l) => {
    const ing = ingredientById.get(l.i);
    return {
      id: l.i,
      name: ing?.name ?? l.i,
      color: ing?.color ?? "#c8c0b4",
      oz: Math.max(visualOz(l), 0.08),
      foam: l.i === "egg-white" || l.i === "cream",
    };
  });
  const measuredTotal = measured.reduce((s, l) => s + (l.foam ? 0 : l.oz), 0);
  const topOz = tops.length ? Math.max(1.6, 4.2 - measuredTotal) / tops.length : 0;
  const topLayers = tops.map((l) => {
    const ing = ingredientById.get(l.i);
    return {
      id: l.i,
      name: ing?.name ?? l.i,
      color: ing?.color ?? "#d8e4ea",
      oz: topOz,
      foam: false,
    };
  });
  return [...measured.filter((l) => !l.foam), ...topLayers, ...measured.filter((l) => l.foam)];
}

export function dominantColor(drink: Drink): string {
  const layers = liquidLayers(drink);
  const body = layers.filter((l) => !l.foam);
  if (!body.length) return "#c8c0b4";
  return body.reduce((a, b) => (a.oz >= b.oz ? a : b)).color;
}

export function drinksByHue(list: Drink[] = drinks): Drink[] {
  return [...list].sort((a, b) => hexHue(dominantColor(a)) - hexHue(dominantColor(b)));
}

export function requiredIds(drink: Drink): string[] {
  const ids: string[] = [];
  for (const line of drink.spec) {
    if (line.optional) continue;
    const ing = ingredientById.get(line.i);
    if (!ing) continue;
    if (SKIP_KINDS.has(ing.kind)) continue;
    if (SKIP_IDS.has(ing.id)) continue;
    if (ing.kind === "garnish") continue;
    ids.push(ing.id);
  }
  return [...new Set(ids)];
}

export type MakeState = "yes" | "missing-1" | "no";

export function makeState(drink: Drink, owned: Set<string>): MakeState {
  const req = requiredIds(drink);
  let missing = 0;
  for (const id of req) {
    if (owned.has(id)) continue;
    const ing = ingredientById.get(id);
    const subs = ing?.substitutes ?? [];
    if (subs.some((s) => owned.has(s.id))) continue;
    missing += 1;
  }
  if (missing === 0) return "yes";
  if (missing === 1) return "missing-1";
  return "no";
}

export function missingIds(drink: Drink, owned: Set<string>): string[] {
  return requiredIds(drink).filter((id) => {
    if (owned.has(id)) return false;
    const ing = ingredientById.get(id);
    return !(ing?.substitutes ?? []).some((s) => owned.has(s.id));
  });
}

const ML: Record<Unit, (n: number) => string> = {
  oz: (n) => `${Math.round(n * 30)} ml`,
  ml: (n) => `${n} ml`,
  dash: (n) => (n === 1 ? "1 dash" : `${n} dashes`),
  drop: (n) => (n === 1 ? "1 drop" : `${n} drops`),
  tsp: (n) => `${n} tsp`,
  barspoon: (n) => (n === 1 ? "1 barspoon" : `${n} barspoons`),
  splash: () => "splash",
  top: () => "top",
  whole: (n) => (n === 1 ? "1" : String(n)),
  sprig: (n) => (n === 1 ? "1 sprig" : `${n} sprigs`),
  pinch: () => "pinch",
  wedge: () => "wedge",
  wheel: () => "wheel",
  twist: () => "twist",
};

export function formatAmount(line: SpecLine, units: "oz" | "ml"): string {
  if (units === "ml") return ML[line.u](line.a);
  switch (line.u) {
    case "oz":
      return `${formatOz(line.a)} oz`;
    case "ml":
      return `${line.a} ml`;
    case "dash":
      return line.a === 1 ? "1 dash" : `${line.a} dashes`;
    case "drop":
      return line.a === 1 ? "1 drop" : `${line.a} drops`;
    case "tsp":
      return `${line.a} tsp`;
    case "barspoon":
      return line.a === 1 ? "1 bsp" : `${line.a} bsp`;
    case "splash":
      return "splash";
    case "top":
      return "top";
    case "whole":
      return line.a === 1 ? "1" : String(line.a);
    case "sprig":
      return line.a === 1 ? "1 sprig" : `${line.a} sprigs`;
    case "pinch":
      return "pinch";
    case "wedge":
      return "wedge";
    case "wheel":
      return "wheel";
    case "twist":
      return "twist";
  }
}

function formatOz(n: number): string {
  const halves = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];
  const nearest = halves.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
  if (Math.abs(nearest - n) < 0.02) {
    if (nearest === 0.25) return "¼";
    if (nearest === 0.5) return "½";
    if (nearest === 0.75) return "¾";
    if (nearest === 1.25) return "1¼";
    if (nearest === 1.5) return "1½";
    if (nearest === 1.75) return "1¾";
    return String(nearest);
  }
  return String(n);
}

export function stockBottles(): Ingredient[] {
  return ingredients.filter((i) => i.stock);
}

export function cocktailsUsing(ingredientId: string): Drink[] {
  return drinks.filter((d) => d.spec.some((s) => s.i === ingredientId));
}

export function searchDrinks(q: string): Drink[] {
  const s = q.trim().toLowerCase();
  if (!s) return drinks;
  return drinks.filter((d) => {
    if (d.name.toLowerCase().includes(s)) return true;
    if (d.aka?.some((a) => a.toLowerCase().includes(s))) return true;
    if (d.why.toLowerCase().includes(s)) return true;
    if (d.spec.some((l) => nameOf(l.i).toLowerCase().includes(s) || l.i.includes(s)))
      return true;
    return false;
  });
}

export const GLASS_LABEL: Record<Drink["glass"], string> = {
  rocks: "Rocks",
  "double-rocks": "Double rocks",
  coupe: "Coupe",
  martini: "Martini",
  "nick-nora": "Nick & Nora",
  highball: "Highball",
  collins: "Collins",
  flute: "Flute",
  wine: "Wine",
  hurricane: "Hurricane",
  "copper-mug": "Copper mug",
  julep: "Julep cup",
  snifter: "Snifter",
  shot: "Shot",
  "irish-coffee": "Irish coffee",
  tiki: "Tiki mug",
  pint: "Pint",
  margarita: "Margarita",
  mug: "Mug",
};

export const METHOD_LABEL: Record<Drink["method"], string> = {
  stir: "Stirred",
  shake: "Shaken",
  build: "Built",
  blend: "Blended",
  throw: "Thrown",
  layer: "Layered",
  swizzle: "Swizzled",
  muddle: "Muddled",
};

export const FAMILY_LABEL: Record<Drink["family"], string> = {
  sour: "Sour",
  "old-fashioned": "Old Fashioned",
  martini: "Martini",
  negroni: "Negroni",
  highball: "Highball",
  tiki: "Tiki",
  fizz: "Fizz",
  spritz: "Spritz",
  shot: "Shot",
  hot: "Hot",
  frozen: "Frozen",
  "beer-mix": "Beer",
  punch: "Punch",
  coffee: "Coffee",
};
