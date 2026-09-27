import { createFileRoute, Link } from "@tanstack/react-router";
import { LEARN } from "@/data/learn";

export const Route = createFileRoute("/learn/")({ component: LearnIndex });

function LearnIndex() {
  return (
    <main className="px-4 py-8 sm:px-8">
      <p className="font-mono text-[10px] tracking-[0.22em] text-subtle uppercase">Studio</p>
      <h1 className="mt-2 font-display text-4xl leading-none tracking-[-0.03em] sm:text-5xl">
        Learn
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
        Glassware, shaking, ice, formulas, language. The stuff you use with your hands.
      </p>
      <ol className="mt-10 divide-y divide-border border-y border-border">
        {LEARN.map((ch, i) => (
          <li key={ch.id}>
            <Link
              to="/learn/$topic"
              params={{ topic: ch.id }}
              className="flex min-h-20 items-baseline gap-6 py-5 transition-colors duration-150 hover:text-muted"
            >
              <span className="w-8 font-mono text-[11px] text-subtle tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-2xl leading-tight">{ch.title}</span>
                <span className="mt-1 block text-sm text-muted">{ch.dek}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
