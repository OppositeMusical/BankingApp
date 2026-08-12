import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { authApi } from "@/lib/api";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In live mode this is a real session check against the Go API; in mock mode
  // it resolves to the fixture person and nobody is ever redirected.
  const person = await authApi.me();
  if (!person) redirect("/signin");

  return <AppShell person={person}>{children}</AppShell>;
}
