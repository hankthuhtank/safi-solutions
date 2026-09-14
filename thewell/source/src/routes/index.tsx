import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DrinkGlass } from "@/components/glass";
import type { Category } from "@/data/types";
import { CATEGORIES, drinks, drinksByHue } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Library });

function Library() {
  const [cat, setCat] = useState<Category | "all">("all");
  const shelves = useMemo(() => {
    const list = cat === "all" ? drinks : drinks.filter((d) => d.cat === cat);
    if (cat !== "all") {
      return [{ id: cat, label: CATEGORIES.find((c) => c.id === cat)?.label ?? cat, items: drinksByHue(list) }];
    }
    return CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      items: drinksByHue(drinks.filter((d) => d.cat === c.id)),
    })).filter((s) => s.items.length);
  }, [cat]);

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-subtle uppercase">
            {drinks.length} drinks on the rail
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none tracking-[-0.03em] sm:text-5xl">
            The backbar
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            Glasses, not cards. Color is the liquid. Click one and it steps forward.
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
          All
        </FilterChip>
        {CATEGORIES.map((c) => (
          <FilterChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </FilterChip>
        ))}
      </div>

      <div className="mt-8 space-y-10">
        {shelves.map((shelf) => (
          <section key={shelf.id}>
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="font-mono text-[10px] tracking-[0.22em] text-subtle uppercase">
                {shelf.label}
              </h2>
              <span className="font-mono text-[10px] text-subtle tabular-nums">
                {String(shelf.items.length).padStart(2, "0")}
              </span>
            </div>
            <ul className="shelf-scroll flex gap-1 overflow-x-auto pb-3 sm:grid sm:grid-cols-6 sm:gap-3 sm:overflow-visible lg:grid-cols-8 xl:grid-cols-10">
              {shelf.items.map((d) => (
                <li key={d.id} className="shrink-0 sm:min-w-0">
                  <Link
                    to="/d/$slug"
                    params={{ slug: d.id }}
                    className="group flex w-[4.6rem] flex-col items-center rounded-md px-1 py-2 transition-colors duration-150 hover:bg-elevated sm:w-auto"
                  >
                    <span className="transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1">
                      <DrinkGlass drink={d} size="sm" />
                    </span>
                    <span className="mt-2 line-clamp-2 text-center font-display text-[12px] leading-tight text-muted group-hover:text-fg">
                      {d.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 shrink-0 rounded-full px-4 text-[11px] tracking-[0.16em] uppercase transition-colors duration-150",
        active ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
