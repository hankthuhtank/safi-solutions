import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";

export const Route = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
