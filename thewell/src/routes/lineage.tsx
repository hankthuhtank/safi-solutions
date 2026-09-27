import { createFileRoute, Link } from "@tanstack/react-router";
import { DrinkGlass } from "@/components/glass";
import { FAMILIES } from "@/data/families";
import { drinkById } from "@/lib/catalog";

export const Route = createFileRoute("/lineage")({ component: LineagePage });

function LineagePage() {
  return (
    <main className="px-4 py-8 sm:px-8">
      <p className="font-mono text-[10px] tracking-[0.22em] text-subtle uppercase">Family tree</p>
      <h1 className="mt-2 font-display text-4xl leading-none tracking-[-0.03em] sm:text-5xl">
        Lineage
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
        Drinks are not a list. They are formulas wearing different coats. Walk a spine and you can
        invent the next one.
      </p>

      <div className="mt-12 space-y-16">
        {FAMILIES.map((fam) => (
          <section key={fam.id}>
            <p className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">
              {fam.formula}
            </p>
            <h2 className="mt-2 font-display text-3xl">{fam.name}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{fam.meaning}</p>
            <ol className="shelf-scroll mt-6 flex items-end gap-0 overflow-x-auto pb-4">
              {fam.spine.map((id, idx) => {
                const d = drinkById.get(id);
                if (!d) return null;
                return (
                  <li key={id} className="flex shrink-0 items-end">
                    {idx > 0 ? (
                      <span className="mb-16 px-1 font-mono text-[10px] text-subtle">→</span>
                    ) : null}
                    <Link
                      to="/d/$slug"
                      params={{ slug: d.id }}
                      className="flex w-28 flex-col items-center"
                    >
                      <DrinkGlass drink={d} size="md" />
                      <span className="mt-2 text-center font-display text-sm leading-tight">
                        {d.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}
