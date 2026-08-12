import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { authApi } from "@/lib/api";
import { apiMode } from "@/lib/api/config";

/**
 * Everything below this layout is per-user and authenticated, so none of it may
 * be prerendered. Beyond being wrong on its own terms — a build has no session
 * — a static render in live mode reaches for the API at build time, when no
 * backend is running and no cookie exists. Applies to every nested segment.
 */
export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In live mode this is a real session check against the Go API; in mock mode
  // it resolves to the fixture person and nobody is ever redirected.
  const person = await authApi.me();
  if (!person) redirect("/signin");

  return (
    <AppShell person={person} mode={apiMode()}>
      {children}
    </AppShell>
  );
}
