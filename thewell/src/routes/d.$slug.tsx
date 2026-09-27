import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { DrinkTicket } from "@/components/drink-ticket";
import { drinkById, drinks } from "@/lib/catalog";

export const Route = createFileRoute("/d/$slug")({
  component: DrinkPage,
});

function DrinkPage() {
  const { slug } = Route.useParams();
  const drink = drinkById.get(slug);
  if (!drink) throw notFound();
  const idx = drinks.findIndex((d) => d.id === slug);
  const prev = drinks[(idx - 1 + drinks.length) % drinks.length];
  const next = drinks[(idx + 1) % drinks.length];

  return (
    <main className="px-4 py-8 sm:px-10 sm:py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="font-mono text-[10px] tracking-[0.2em] text-subtle uppercase transition-colors duration-150 hover:text-fg"
        >
          Back to the rail
        </Link>
        <div className="flex gap-4">
          {prev ? (
            <Link
              to="/d/$slug"
              params={{ slug: prev.id }}
              className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase hover:text-fg"
            >
              Prev
            </Link>
          ) : null}
          {next ? (
            <Link
              to="/d/$slug"
              params={{ slug: next.id }}
              className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase hover:text-fg"
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
      <DrinkTicket drink={drink} />
    </main>
  );
}
