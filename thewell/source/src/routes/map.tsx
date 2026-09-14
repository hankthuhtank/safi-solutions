import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DrinkGlass } from "@/components/glass";
import { drinks, dominantColor } from "@/lib/catalog";
import { useBar } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({ component: MapPage });

function MapPage() {
  const axis = useBar((s) => s.axis);
  const setAxis = useBar((s) => s.setAxis);
  const [hover, setHover] = useState<string | null>(null);
  const navigate = useNavigate();
  const active = drinks.find((d) => d.id === hover);

  const points = useMemo(
    () =>
      drinks.map((d) => {
        const x = axis === "sweet-dry" ? d.dry : d.bitter;
        const y = d.boozy;
        return { d, x, y, color: dominantColor(d) };
      }),
    [axis],
  );

  return (
    <main className="relative flex min-h-[calc(100dvh-4rem)] flex-col px-4 py-6 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-subtle uppercase">Flavor</p>
          <h1 className="mt-2 font-display text-4xl leading-none tracking-[-0.03em]">The map</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            Every drink as a point of liquid. Up is boozy. Down is light. Flip the floor between
            sweet–dry and fruity–bitter.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAxis("sweet-dry")}
            className={cn(
              "h-11 rounded-full px-4 text-[11px] tracking-[0.16em] uppercase",
              axis === "sweet-dry" ? "bg-primary text-primary-fg" : "text-muted",
            )}
          >
            Sweet — dry
          </button>
          <button
            type="button"
            onClick={() => setAxis("fruity-bitter")}
            className={cn(
              "h-11 rounded-full px-4 text-[11px] tracking-[0.16em] uppercase",
              axis === "fruity-bitter" ? "bg-primary text-primary-fg" : "text-muted",
            )}
          >
            Fruity — bitter
          </button>
        </div>
      </div>

      <div className="relative mx-auto mt-6 w-full max-w-4xl flex-1">
        <span className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">
          Light
        </span>
        <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">
          Boozy
        </span>
        <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">
          {axis === "sweet-dry" ? "Sweet" : "Fruity"}
        </span>
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">
          {axis === "sweet-dry" ? "Dry" : "Bitter"}
        </span>

        <div className="relative mx-8 my-10 aspect-square max-h-[min(70vh,640px)] w-auto max-w-full sm:mx-auto sm:w-full">
          <div className="absolute inset-0 rounded-lg border border-border" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
          {points.map((p) => {
            let h = 2166136261;
            for (const c of p.d.id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
            const jx = ((h % 11) - 5) * 0.7;
            const jy = (((h >>> 8) % 11) - 5) * 0.7;
            const left = Math.min(96, Math.max(4, p.x + jx));
            const top = Math.min(96, Math.max(4, 100 - p.y + jy));
            return (
            <button
              key={p.d.id}
              type="button"
              onMouseEnter={() => setHover(p.d.id)}
              onFocus={() => setHover(p.d.id)}
              onClick={() => void navigate({ to: "/d/$slug", params: { slug: p.d.id } })}
              className="absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${left}%`, top: `${top}%` }}
              aria-label={p.d.name}
            >
              <span
                className="block size-2.5 rounded-full transition-transform duration-150 hover:scale-150"
                style={{
                  background: p.color,
                  boxShadow: hover === p.d.id ? `0 0 16px ${p.color}` : undefined,
                  transform: hover === p.d.id ? "scale(1.8)" : undefined,
                }}
              />
            </button>
            );
          })}
        </div>
      </div>

      {active ? (
        <div className="pointer-events-none sticky bottom-20 flex justify-center lg:bottom-6">
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg bg-elevated px-3 py-2 shadow-[var(--shadow-border)]">
            <DrinkGlass drink={active} size="sm" />
            <div>
              <p className="font-display text-lg leading-tight">{active.name}</p>
              <p className="text-xs text-muted">{active.why}</p>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
