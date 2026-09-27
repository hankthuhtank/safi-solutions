export type Category =
  | "cocktails"
  | "shots"
  | "highballs"
  | "tiki"
  | "frozen"
  | "brunch"
  | "mocktails"
  | "coffee"
  | "beer"
  | "regional";

export type FamilyId =
  | "sour"
  | "old-fashioned"
  | "martini"
  | "negroni"
  | "highball"
  | "tiki"
  | "fizz"
  | "spritz"
  | "shot"
  | "hot"
  | "frozen"
  | "beer-mix"
  | "punch"
  | "coffee";

export type GlassId =
  | "rocks"
  | "double-rocks"
  | "coupe"
  | "martini"
  | "nick-nora"
  | "highball"
  | "collins"
  | "flute"
  | "wine"
  | "hurricane"
  | "copper-mug"
  | "julep"
  | "snifter"
  | "shot"
  | "irish-coffee"
  | "tiki"
  | "pint"
  | "margarita"
  | "mug";

export type Method =
  | "stir"
  | "shake"
  | "build"
  | "blend"
  | "throw"
  | "layer"
  | "swizzle"
  | "muddle";

export type Ice =
  | "none"
  | "cubed"
  | "crushed"
  | "large-cube"
  | "pebble"
  | "cracked"
  | "blend";

export type Unit =
  | "oz"
  | "ml"
  | "dash"
  | "drop"
  | "tsp"
  | "barspoon"
  | "splash"
  | "top"
  | "whole"
  | "sprig"
  | "pinch"
  | "wedge"
  | "wheel"
  | "twist";

export type IngredientKind =
  | "family"
  | "spirit"
  | "liqueur"
  | "wine"
  | "beer"
  | "modifier"
  | "mixer"
  | "fresh"
  | "syrup"
  | "bitters"
  | "garnish"
  | "other";

export interface Substitute {
  id: string;
  note: string;
}

export interface Ingredient {
  id: string;
  name: string;
  kind: IngredientKind;
  parent?: string;
  color: string;
  abv: number;
  taste: string;
  made: string;
  examples: string[];
  substitutes: Substitute[];
  notes: string;
  stock: boolean;
  shelf: string;
}

export interface SpecLine {
  i: string;
  a: number;
  u: Unit;
  optional?: boolean;
}

export interface Drink {
  id: string;
  name: string;
  aka?: string[];
  cat: Category;
  family: FamilyId;
  glass: GlassId;
  method: Method;
  ice: Ice;
  garnish: string;
  spec: SpecLine[];
  steps: string[];
  why: string;
  origin: string;
  note: string;
  sweet: number;
  dry: number;
  light: number;
  boozy: number;
  fruity: number;
  bitter: number;
  abv: number;
  era: string;
  related: string[];
  difficulty: 1 | 2 | 3;
  zero?: boolean;
}

export interface FamilyNode {
  id: FamilyId;
  name: string;
  formula: string;
  meaning: string;
  drinks: string[];
}

export interface LearnChapter {
  id: string;
  title: string;
  dek: string;
  kicker: string;
}
