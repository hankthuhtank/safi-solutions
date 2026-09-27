import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Units = "oz" | "ml";

interface BarState {
  owned: string[];
  units: Units;
  axis: "sweet-dry" | "fruity-bitter";
  toggleOwned: (id: string) => void;
  setOwned: (ids: string[]) => void;
  setUnits: (u: Units) => void;
  setAxis: (a: BarState["axis"]) => void;
  stocked: (id: string) => boolean;
}

export const useBar = create<BarState>()(
  persist(
    (set, get) => ({
      owned: [
        "bourbon",
        "gin",
        "vodka",
        "blanco",
        "white-rum",
        "lime-juice",
        "lemon-juice",
        "simple-syrup",
        "soda",
        "angostura",
        "sugar",
        "salt",
        "mint",
        "lime",
        "lemon",
        "orange",
      ],
      units: "oz",
      axis: "sweet-dry",
      toggleOwned: (id) =>
        set((s) => ({
          owned: s.owned.includes(id) ? s.owned.filter((x) => x !== id) : [...s.owned, id],
        })),
      setOwned: (ids) => set({ owned: ids }),
      setUnits: (units) => set({ units }),
      setAxis: (axis) => set({ axis }),
      stocked: (id) => get().owned.includes(id),
    }),
    { name: "the-well-bar" },
  ),
);
