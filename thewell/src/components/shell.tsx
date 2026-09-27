import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CallPalette } from "@/components/call-palette";
import { useBar } from "@/lib/store";
import { cn } from "@/lib/utils";

const MODES = [
  { to: "/", id: "library", label: "Library", k: "1" },
  { to: "/well", id: "well", label: "Stock", k: "2" },
  { to: "/map", id: "map", label: "Map", k: "3" },
  { to: "/lineage", id: "lineage", label: "Lineage", k: "4" },
  { to: "/spirits", id: "spirits", label: "Bottles", k: "5" },
  { to: "/learn", id: "learn", label: "Learn", k: "6" },
  { to: "/service", id: "service", label: "Service", k: "7" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const units = useBar((s) => s.units);
  const setUnits = useBar((s) => s.setUnits);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      document.documentElement.style.setProperty("--spot-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--spot-y", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && !typing) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
      if (!typing && !e.metaKey && !e.ctrlKey && e.key >= "1" && e.key <= "7") {
        const mode = MODES[Number(e.key) - 1];
        if (mode) {
          e.preventDefault();
          void navigate({ to: mode.to });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <div className="grain relative min-h-dvh bg-bg text-fg">
      <div className="spot-field pointer-events-none fixed inset-0 z-0" />
      <div className="relative z-10 flex min-h-dvh flex-col lg:flex-row">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 lg:hidden">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex size-11 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:text-fg"
            aria-label="Call a drink"
          >
            <Search className="size-4" strokeWidth={1.75} />
          </button>
        </header>

        <aside className="hidden w-[9.5rem] shrink-0 flex-col justify-between border-r border-border px-4 py-6 lg:flex">
          <div>
            <Brand />
            <p className="mt-3 max-w-[9rem] font-sans text-xs leading-5 text-subtle">
              A bartender's field guide.
            </p>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Modes">
            {MODES.map((m) => {
              const active =
                m.to === "/"
                  ? pathname === "/" || pathname.startsWith("/d/")
                  : pathname === m.to || pathname.startsWith(m.to + "/");
              return (
                <Link
                  key={m.id}
                  to={m.to}
                  className={cn(
                    "rail-link flex h-11 items-center justify-between rounded-sm px-1 text-[11px] tracking-[0.18em] uppercase transition-colors duration-150",
                    active ? "text-fg" : "text-subtle hover:text-muted",
                  )}
                  data-active={active}
                >
                  <span>{m.label}</span>
                  <span className="font-mono text-[10px] text-subtle">{m.k}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-11 items-center gap-2 text-left text-[11px] tracking-[0.16em] uppercase text-muted transition-colors duration-150 hover:text-fg"
            >
              <Search className="size-3.5" strokeWidth={1.75} />
              Call
              <span className="font-mono text-[10px] text-subtle">/</span>
            </button>
            <button
              type="button"
              onClick={() => setUnits(units === "oz" ? "ml" : "oz")}
              className="h-11 text-left font-mono text-[11px] tracking-[0.14em] text-subtle uppercase transition-colors duration-150 hover:text-fg"
            >
              {units}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</div>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-bg/95 lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Modes"
        >
          {MODES.map((m) => {
            const active =
              m.to === "/"
                ? pathname === "/" || pathname.startsWith("/d/")
                : pathname === m.to || pathname.startsWith(m.to + "/");
            return (
              <Link
                key={m.id}
                to={m.to}
                className={cn(
                  "flex min-h-12 min-w-0 flex-1 items-center justify-center px-0.5 text-center text-[9px] tracking-[0.12em] uppercase",
                  active ? "text-fg" : "text-subtle",
                )}
              >
                {m.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <CallPalette open={open} onOpenChange={setOpen} />
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="block" aria-label="The Well home">
      <img
        src="/assets/project-logos/thewell.jpg?v=5"
        alt="The Well"
        className="block h-auto w-[178px] max-w-full object-contain object-left lg:w-[190px]"
      />
    </Link>
  );
}
