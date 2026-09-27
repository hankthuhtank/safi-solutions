import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Link, RouterProvider, createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "@/routeTree.gen";
import "@/styles.css";

function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[10px] tracking-[0.22em] text-subtle uppercase">86'd</p>
      <h1 className="mt-3 font-display text-3xl">That isn't on the rail</h1>
      <Link
        to="/"
        className="mt-6 text-sm text-muted transition-colors duration-150 hover:text-fg"
      >
        Back to the well
      </Link>
    </main>
  );
}

const router = createRouter({
  routeTree,
  basepath: "/thewell",
  defaultErrorComponent: AppErrorComponent,
  defaultNotFoundComponent: NotFound,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
