import { createFileRoute, Link } from "@tanstack/react-router";
import { BottleMark } from "@/components/glass";
import { SHELVES, cocktailsUsing, stockBottles } from "@/lib/catalog";

export const Route = createFileRoute("/spirits/")({ component: SpiritsPage });

function SpiritsPage() {
  const bottles = stockBottles().filter(
    (b) => b.kind === "spirit" || b.kind === "family" || b.kind === "liqueur" || b.kind === "wine",
  );

  return (
    <main className="px-4 py-8 sm:px-8">
      <p className="font-mono text-[10px] tracking-[0.22em] text-subtle uppercase">Knowledge</p>
      <h1 className="mt-2 font-display text-4xl leading-none tracking-[-0.03em] sm:text-5xl">
        Bottles
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
        Click whiskey and it splits: bourbon, rye, Scotch, Irish, Japanese. How it tastes, what it
        makes, what stands in.
      </p>
      <div className="mt-10 space-y-10">
        {SHELVES.map((shelf) => {
          const items = bottles.filter((b) => b.shelf === shelf.id);
          if (!items.length) return null;
          return (
            <section key={shelf.id}>
              <h2 className="mb-4 font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">
                {shelf.label}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((b) => {
                  const n = cocktailsUsing(b.id).length;
                  return (
                    <li key={b.id}>
                      <Link
                        to="/spirits/$id"
                        params={{ id: b.id }}
                        className="flex min-h-20 items-center gap-4 rounded-lg px-3 py-3 transition-colors duration-150 hover:bg-elevated"
                      >
                        <BottleMark color={b.color} active className="h-12 w-6" />
                        <span className="min-w-0">
                          <span className="block font-display text-xl leading-tight">{b.name}</span>
                          <span className="block truncate text-xs text-muted">{b.taste}</span>
                        </span>
                        <span className="ml-auto font-mono text-[10px] text-subtle tabular-nums">
                          {n}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
