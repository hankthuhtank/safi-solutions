import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { DrinkGlass } from "@/components/glass";
import { LEARN } from "@/data/learn";
import { FAMILIES } from "@/data/families";
import { GLASS_LABEL, drinks } from "@/lib/catalog";
import type { GlassId } from "@/data/types";

export const Route = createFileRoute("/learn/$topic")({ component: Chapter });

function Chapter() {
  const { topic } = Route.useParams();
  const ch = LEARN.find((c) => c.id === topic);
  if (!ch) throw notFound();
  const idx = LEARN.findIndex((c) => c.id === topic);
  const next = LEARN[idx + 1];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      <Link
        to="/learn"
        className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase hover:text-fg"
      >
        All chapters
      </Link>
      <p className="mt-8 font-mono text-[10px] tracking-[0.22em] text-subtle uppercase">{ch.kicker}</p>
      <h1 className="mt-2 font-display text-4xl leading-none tracking-[-0.03em] sm:text-5xl">
        {ch.title}
      </h1>
      <p className="mt-4 font-display text-xl italic text-muted">{ch.dek}</p>

      {ch.sections.map((s) => (
        <section key={s.heading} className="mt-12">
          <h2 className="font-display text-2xl">{s.heading}</h2>
          <p className="mt-3 text-[15px] leading-7 text-fg">{s.body}</p>
          {s.visual === "shake-stir" ? <ShakeStir /> : null}
          {s.visual === "glasses" ? <GlassLine /> : null}
          {s.visual === "formulas" ? <FormulaList /> : null}
          {s.visual === "ice" ? <IceTypes /> : null}
          {s.visual === "pour" ? <PourCounts /> : null}
          {s.visual === "terms" ? <Terms /> : null}
        </section>
      ))}

      {next ? (
        <Link
          to="/learn/$topic"
          params={{ topic: next.id }}
          className="mt-16 block border-t border-border pt-6 font-display text-xl hover:text-muted"
        >
          Next · {next.title}
        </Link>
      ) : null}
    </main>
  );
}

function ShakeStir() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg bg-elevated p-5">
        <p className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">Shake</p>
        <p className="mt-2 font-display text-2xl">Juice, dairy, egg</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Two tins, hard ice, 10–12 seconds. The drink comes out cold, diluted, and cloudy. Aeration
          is the point.
        </p>
      </div>
      <div className="rounded-lg bg-elevated p-5">
        <p className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase">Stir</p>
        <p className="mt-2 font-display text-2xl">Spirits only</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Mixing glass, a spoon around the ice, 20–30 seconds. Silk, not foam. You should still
          see through it.
        </p>
      </div>
    </div>
  );
}

function GlassLine() {
  const seen = new Set<GlassId>();
  const unique = drinks.filter((d) => {
    if (seen.has(d.glass)) return false;
    seen.add(d.glass);
    return true;
  });
  return (
    <ul className="shelf-scroll mt-6 flex gap-4 overflow-x-auto pb-2">
      {unique.map((d) => (
        <li key={d.glass} className="flex w-20 shrink-0 flex-col items-center">
          <DrinkGlass drink={d} size="sm" />
          <span className="mt-2 text-center text-[11px] text-muted">{GLASS_LABEL[d.glass]}</span>
        </li>
      ))}
    </ul>
  );
}

function FormulaList() {
  return (
    <ul className="mt-6 space-y-4">
      {FAMILIES.map((f) => (
        <li key={f.id} className="border-b border-border pb-4">
          <p className="font-display text-xl">{f.name}</p>
          <p className="mt-1 font-mono text-xs text-muted">{f.formula}</p>
        </li>
      ))}
    </ul>
  );
}

function IceTypes() {
  const rows = [
    ["Hard cube", "Shake, highball, anything that needs slow water."],
    ["Large cube", "Old Fashioned, Negroni, anything served down."],
    ["Crushed / pebble", "Julep, swizzle, mint. Melts on purpose."],
    ["Blender ice", "Becomes the drink. Piña Colada, frozen Margarita."],
  ];
  return (
    <ul className="mt-6 space-y-3">
      {rows.map(([a, b]) => (
        <li key={a} className="flex gap-4 text-sm leading-6">
          <span className="w-36 shrink-0 font-display text-base">{a}</span>
          <span className="text-muted">{b}</span>
        </li>
      ))}
    </ul>
  );
}

function PourCounts() {
  const rows = [
    ["¼ oz", "7.5 ml", "a barspoon, roughly"],
    ["½ oz", "15 ml", "a short count"],
    ["¾ oz", "22 ml", "citrus in a sour"],
    ["1 oz", "30 ml", "a standard jigger small side"],
    ["1½ oz", "45 ml", "an American well pour"],
    ["2 oz", "60 ml", "a spirit in a cocktail"],
  ];
  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border">
      {rows.map(([a, b, c]) => (
        <div
          key={a}
          className="grid grid-cols-3 gap-2 border-b border-border px-4 py-3 font-mono text-xs last:border-0"
        >
          <span>{a}</span>
          <span className="text-muted">{b}</span>
          <span className="text-subtle">{c}</span>
        </div>
      ))}
    </div>
  );
}

function Terms() {
  const rows = [
    ["Neat", "Spirit, no ice, no mix."],
    ["Up", "Chilled, strained, no ice in the glass."],
    ["Down / rocks", "Served over ice."],
    ["Dry", "Less vermouth. A personality, not a measurement."],
    ["Perfect", "Half sweet vermouth, half dry."],
    ["Dirty", "Olive brine in a Martini."],
    ["With a twist", "Expressed citrus peel — the oil is the garnish."],
    ["Rinse", "Coat the glass, dump the excess. Absinthe, usually."],
  ];
  return (
    <ul className="mt-6 space-y-3">
      {rows.map(([a, b]) => (
        <li key={a} className="flex gap-4 text-sm leading-6">
          <span className="w-32 shrink-0 font-display text-base">{a}</span>
          <span className="text-muted">{b}</span>
        </li>
      ))}
    </ul>
  );
}
