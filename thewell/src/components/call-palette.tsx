import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { DrinkGlass } from "@/components/glass";
import { drinks, ingredientById, searchDrinks } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function CallPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const hits = useMemo(() => searchDrinks(q).slice(0, 8), [q]);
  const bottleHits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return [...ingredientById.values()]
      .filter(
        (b) =>
          b.stock &&
          (b.name.toLowerCase().includes(s) || b.id.includes(s)) &&
          (b.kind === "spirit" || b.kind === "liqueur" || b.kind === "wine" || b.kind === "family"),
      )
      .slice(0, 4);
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setI(0);
      const t = window.setTimeout(() => input.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => setI(0), [q]);

  if (!open) return null;

  const goDrink = (id: string) => {
    onOpenChange(false);
    void navigate({ to: "/d/$slug", params: { slug: id } });
  };
  const goSpirit = (id: string) => {
    onOpenChange(false);
    void navigate({ to: "/spirits/$id", params: { id } });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-bg/80 px-4 pt-[12vh]"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="ticket-enter w-full max-w-xl rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Call a drink"
      >
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setI((n) => Math.min(n + 1, hits.length + bottleHits.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setI((n) => Math.max(n - 1, 0));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              if (i < hits.length) {
                const d = hits[i];
                if (d) goDrink(d.id);
              } else {
                const b = bottleHits[i - hits.length];
                if (b) goSpirit(b.id);
              }
            }
            if (e.key === "Escape") onOpenChange(false);
          }}
          placeholder="Call a drink or a bottle"
          className="h-12 w-full bg-transparent px-3 font-display text-2xl text-fg outline-none placeholder:text-subtle"
        />
        <ul className="mt-2 max-h-[50vh] overflow-auto">
          {hits.map((d, idx) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => goDrink(d.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150",
                  idx === i ? "bg-elevated" : "hover:bg-elevated/60",
                )}
              >
                <DrinkGlass drink={d} size="sm" />
                <span className="min-w-0">
                  <span className="block font-display text-lg leading-tight">{d.name}</span>
                  <span className="block truncate text-xs text-muted">{d.why}</span>
                </span>
              </button>
            </li>
          ))}
          {bottleHits.map((b, idx) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => goSpirit(b.id)}
                className={cn(
                  "flex h-12 w-full items-center gap-3 rounded-md px-3 text-left",
                  hits.length + idx === i ? "bg-elevated" : "hover:bg-elevated/60",
                )}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: b.color }}
                />
                <span className="font-display text-lg">{b.name}</span>
                <span className="text-xs tracking-[0.14em] text-subtle uppercase">
                  bottle
                </span>
              </button>
            </li>
          ))}
          {!hits.length && !bottleHits.length ? (
            <li className="px-3 py-6 text-sm text-muted">
              {q ? "Nothing by that name." : `${drinks.length} drinks on the rail.`}
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
