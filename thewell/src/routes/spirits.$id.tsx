import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { DrinkGlass } from "@/components/glass";
import { cocktailsUsing, ingredientById, ingredients, nameOf } from "@/lib/catalog";

export const Route = createFileRoute("/spirits/$id")({ component: SpiritPage });

function SpiritPage() {
  const { id } = Route.useParams();
  const ing = ingredientById.get(id);
  if (!ing) throw notFound();
  const children = ingredients.filter((i) => i.parent === id);
  const used = cocktailsUsing(id);
  const parent = ing.parent ? ingredientById.get(ing.parent) : undefined;

  return (
    <main className="px-4 py-8 sm:px-10">
      <Link
        to="/spirits"
        className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase hover:text-fg"
      >
        All bottles
      </Link>
      <div className="mt-6 flex items-start gap-6">
        <span
          className="mt-2 size-4 shrink-0 rounded-full"
          style={{ background: ing.color }}
        />
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">
            {ing.kind}
            {parent ? ` · ${parent.name}` : ""}
            {ing.abv ? ` · ${ing.abv}% ABV` : ""}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">{ing.name}</h1>
        </div>
      </div>

      <p className="mt-6 max-w-xl font-display text-2xl italic leading-snug text-fg">{ing.taste}</p>
      {ing.made ? <p className="mt-4 max-w-xl text-sm leading-6 text-muted">{ing.made}</p> : null}
      {ing.notes ? (
        <p className="mt-4 max-w-xl border-l border-border pl-4 text-sm leading-6">{ing.notes}</p>
      ) : null}

      {ing.examples.length ? (
        <div className="mt-10">
          <h2 className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">On the shelf</h2>
          <p className="mt-2 text-sm text-muted">{ing.examples.join(" · ")}</p>
        </div>
      ) : null}

      {children.length ? (
        <div className="mt-10">
          <h2 className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">Splits into</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {children.map((c) => (
              <li key={c.id}>
                <Link
                  to="/spirits/$id"
                  params={{ id: c.id }}
                  className="flex h-11 items-center gap-2 rounded-full border border-border px-3 text-sm hover:text-muted"
                >
                  <span className="size-2 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ing.substitutes.length ? (
        <div className="mt-10">
          <h2 className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">If you don't have it</h2>
          <ul className="mt-3 space-y-3">
            {ing.substitutes.map((s) => (
              <li key={s.id} className="max-w-xl text-sm leading-6">
                <Link to="/spirits/$id" params={{ id: s.id }} className="text-fg underline-offset-4 hover:underline">
                  {nameOf(s.id)}
                </Link>
                <span className="text-muted"> — {s.note}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {used.length ? (
        <div className="mt-12">
          <h2 className="font-display text-2xl">What it pours</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {used.map((d) => (
              <li key={d.id}>
                <Link to="/d/$slug" params={{ slug: d.id }} className="flex flex-col items-center">
                  <DrinkGlass drink={d} size="sm" />
                  <span className="mt-1 max-w-[4.5rem] text-center font-display text-xs">{d.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}
