import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DrinkTicket } from "@/components/drink-ticket";
import { drinks } from "@/lib/catalog";

export const Route = createFileRoute("/service")({ component: ServicePage });

function ServicePage() {
  const [i, setI] = useState(0);
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const drink = drinks[i] ?? drinks[0]!;
  const shake = drink.method === "shake";

  const q = useMemo(() => drinks, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setT((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "j") setI((n) => (n + 1) % q.length);
      if (e.key === "ArrowLeft" || e.key === "k") setI((n) => (n - 1 + q.length) % q.length);
      if (e.key === " ") {
        e.preventDefault();
        setRunning((r) => !r);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q.length]);

  return (
    <main className="px-4 py-6 sm:px-10 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[0.22em] text-subtle uppercase">
          Bartender mode · glanceable
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setI((n) => (n - 1 + q.length) % q.length)}
            className="h-11 px-3 text-sm text-muted hover:text-fg"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setI((n) => (n + 1) % q.length)}
            className="h-11 px-3 text-sm text-muted hover:text-fg"
          >
            Next
          </button>
          {drink.method === "shake" ? (
            <button
              type="button"
              onClick={() => {
                if (!running) setT(0);
                setRunning((r) => !r);
              }}
              className="h-11 rounded-full bg-primary px-4 font-mono text-sm text-primary-fg tabular-nums"
            >
              {running ? `${t}s` : "12s shake"}
            </button>
          ) : null}
        </div>
      </div>
      <DrinkTicket drink={drink} service />
      <p className="mt-10 text-xs text-subtle">
        J / K or arrows to move.{" "}
        <Link to="/d/$slug" params={{ slug: drink.id }} className="underline-offset-2 hover:underline">
          Open the full ticket
        </Link>
        {shake ? " · Space starts a shake count." : ""}
      </p>
    </main>
  );
}
