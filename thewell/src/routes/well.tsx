import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { BottleMark } from "@/components/glass";
import { DrinkGlass } from "@/components/glass";
import { SHELVES, drinks, makeState, stockBottles } from "@/lib/catalog";
import { useBar } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/well")({ component: WellPage });

function WellPage() {
  const owned = useBar((s) => s.owned);
  const toggle = useBar((s) => s.toggleOwned);
  const set = new Set(owned);
  const bottles = stockBottles();

  const counts = useMemo(() => {
    const ownedSet = new Set(owned);
    let yes = 0;
    let close = 0;
    for (const d of drinks) {
      const st = makeState(d, ownedSet);
      if (st === "yes") yes += 1;
      if (st === "missing-1") close += 1;
    }
    return { yes, close };
  }, [owned]);

  const makeable = drinks.filter((d) => makeState(d, set) === "yes");
  const almost = drinks.filter((d) => makeState(d, set) === "missing-1");

  return (
    <main className="px-4 py-8 sm:px-8">
      <p className="font-mono text-[10px] tracking-[0.22em] text-subtle uppercase">I have this</p>
      <h1 className="mt-2 font-display text-4xl leading-none tracking-[-0.03em] sm:text-5xl">
        Stock the well
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
        Tap every bottle you actually own. The rail lights up with what you can pour tonight —
        and what's one bottle away.
      </p>
      <p className="mt-4 font-display text-2xl italic text-fg">
        {counts.yes} you can make
        <span className="text-muted"> · {counts.close} missing one</span>
      </p>

      <div className="mt-10 space-y-8">
        {SHELVES.map((shelf) => {
          const items = bottles.filter((b) => b.shelf === shelf.id);
          if (!items.length) return null;
          return (
            <section key={shelf.id}>
              <h2 className="mb-3 font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">
                {shelf.label}
              </h2>
              <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                {items.map((b) => {
                  const on = set.has(b.id);
                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => toggle(b.id)}
                        className={cn(
                          "flex h-full min-h-28 w-full flex-col items-center rounded-md px-1 py-2 transition-colors duration-150",
                          on ? "bg-elevated" : "hover:bg-elevated/50",
                        )}
                      >
                        <BottleMark color={b.color} active={on} className="h-14 w-7" />
                        <span
                          className={cn(
                            "mt-2 line-clamp-2 text-center text-[11px] leading-tight",
                            on ? "text-fg" : "text-subtle",
                          )}
                        >
                          {b.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl">On tonight's ticket</h2>
        {makeable.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Stock a few more bottles and this fills in.</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-3">
            {makeable.map((d) => (
              <li key={d.id}>
                <Link to="/d/$slug" params={{ slug: d.id }} className="flex flex-col items-center">
                  <DrinkGlass drink={d} size="sm" />
                  <span className="mt-1 max-w-[4.5rem] text-center font-display text-xs">{d.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {almost.length ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl">One bottle short</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {almost.slice(0, 24).map((d) => (
              <li key={d.id}>
                <Link
                  to="/d/$slug"
                  params={{ slug: d.id }}
                  className="flex flex-col items-center opacity-70 hover:opacity-100"
                >
                  <DrinkGlass drink={d} size="sm" />
                  <span className="mt-1 max-w-[4.5rem] text-center font-display text-xs">{d.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
