import { Link } from "@tanstack/react-router";
import type { Drink } from "@/data/types";
import { DrinkGlass } from "@/components/glass";
import {
  FAMILY_LABEL,
  GLASS_LABEL,
  METHOD_LABEL,
  drinkById,
  formatAmount,
  liquidLayers,
  nameOf,
} from "@/lib/catalog";
import { useBar } from "@/lib/store";
import { cn } from "@/lib/utils";

export function DrinkTicket({ drink, service = false }: { drink: Drink; service?: boolean }) {
  const units = useBar((s) => s.units);
  const layers = liquidLayers(drink);

  return (
    <article className={cn("ticket-enter", service ? "text-fg" : "")}>
      <div className={cn("flex flex-col gap-8 lg:flex-row lg:items-start", service && "lg:gap-16")}>
        <div className="flex shrink-0 flex-col items-center lg:w-[280px]">
          <DrinkGlass drink={drink} size="xl" pour />
          <p className="mt-4 font-mono text-[10px] tracking-[0.22em] text-subtle uppercase">
            {GLASS_LABEL[drink.glass]} · {METHOD_LABEL[drink.method]}
            {drink.ice !== "none" ? ` · ${drink.ice.replace("-", " ")} ice` : ""}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-[0.22em] text-subtle uppercase">
            {FAMILY_LABEL[drink.family]} · {drink.abv}% ABV
            {drink.zero ? " · zero-proof" : ""}
          </p>
          <h1
            className={cn(
              "mt-2 font-display leading-[0.95] tracking-[-0.03em] text-balance",
              service ? "text-5xl sm:text-7xl" : "text-4xl sm:text-5xl",
            )}
          >
            {drink.name}
          </h1>
          <p className={cn("mt-4 max-w-xl font-display italic text-muted", service ? "text-2xl" : "text-lg")}>
            {drink.why}
          </p>

          <ol className={cn("mt-8 space-y-0", service ? "space-y-3" : "")}>
            {drink.spec.map((line) => {
              const layer = layers.find((l) => l.id === line.i);
              return (
                <li
                  key={line.i + line.u + line.a}
                  className="flex items-baseline gap-3 border-b border-border py-2.5"
                >
                  <span
                    className="mt-1 size-2.5 shrink-0 rounded-full"
                    style={{ background: layer?.color ?? "#8a7a68" }}
                  />
                  <Link
                    to="/spirits/$id"
                    params={{ id: line.i }}
                    className={cn(
                      "min-w-0 flex-1 text-fg transition-colors duration-150 hover:text-muted",
                      service ? "font-display text-3xl" : "text-base",
                    )}
                  >
                    {nameOf(line.i)}
                    {line.optional ? (
                      <span className="ml-2 font-sans text-xs tracking-[0.14em] text-subtle uppercase">
                        optional
                      </span>
                    ) : null}
                  </Link>
                  <span
                    className={cn(
                      "font-mono tabular-nums text-muted",
                      service ? "text-xl" : "text-sm",
                    )}
                  >
                    {formatAmount(line, units)}
                  </span>
                </li>
              );
            })}
          </ol>

          <p className={cn("mt-4 text-muted", service ? "text-lg" : "text-sm")}>
            Garnish · {drink.garnish}
          </p>

          {!service ? (
            <>
              <ol className="mt-8 space-y-3">
                {drink.steps.map((step, idx) => (
                  <li key={step} className="flex gap-4 text-sm leading-6 text-fg">
                    <span className="font-mono text-[11px] text-subtle tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <p className="mt-8 max-w-xl text-sm leading-6 text-muted">{drink.origin}</p>
              <p className="mt-4 max-w-xl border-l border-border pl-4 text-sm leading-6 text-fg">
                {drink.note}
              </p>

              <Taste drink={drink} />

              {drink.related.filter((id) => drinkById.has(id)).length ? (
                <div className="mt-10">
                  <p className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">
                    Next to it
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {drink.related.filter((id) => drinkById.has(id)).map((id) => (
                      <Link
                        key={id}
                        to="/d/$slug"
                        params={{ slug: id }}
                        className="rounded-full border border-border px-3 py-2 text-sm text-muted transition-colors duration-150 hover:text-fg"
                      >
                        {drinkById.get(id)?.name ?? id}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <ol className="mt-10 space-y-4">
              {drink.steps.map((step, idx) => (
                <li key={step} className="flex gap-4 font-display text-2xl leading-snug">
                  <span className="font-mono text-sm text-subtle tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </article>
  );
}

function Taste({ drink }: { drink: Drink }) {
  const rows = [
    ["Sweet", drink.sweet, "Dry", drink.dry],
    ["Light", drink.light, "Boozy", drink.boozy],
    ["Fruity", drink.fruity, "Bitter", drink.bitter],
  ] as const;
  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-3">
      {rows.map(([a, av, b, bv]) => (
        <div key={a}>
          <div className="mb-1 flex justify-between font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">
            <span>{a}</span>
            <span>{b}</span>
          </div>
          <div className="relative h-1 rounded-full bg-elevated">
            <div
              className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
              style={{ left: `${Math.round((bv / (av + bv || 1)) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
