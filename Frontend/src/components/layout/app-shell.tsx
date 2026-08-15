"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { mobileNavItems, navItems } from "./nav-items";
import { PrivacyToggle, ThemeToggle } from "./preference-toggles";
import { cn } from "@/lib/utils/cn";
import type { ApiMode } from "@/lib/api/config";
import type { Person } from "@/lib/types/banking";

export function AppShell({
  person,
  mode,
  children,
}: {
  person: Person;
  /** Where the data on screen came from. Shown, never guessed at. */
  mode: ApiMode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-field focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-on"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      {/* Above the sticky header (z-30) so the header's translucent backdrop
          doesn't wash over the sidebar's top edge. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <Link
          href="/dashboard"
          className="mb-8 flex items-center gap-2.5 px-2 rounded-field"
        >
          <TalentsMark />
          <span className="font-display text-xl font-semibold tracking-tight">
            Talents
          </span>
        </Link>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-medium",
                "transition-colors duration-150 ease-[var(--ease-out)]",
                isActive(href)
                  ? "bg-accent-soft text-accent"
                  : "text-ink-muted hover:bg-surface-sunk hover:text-ink",
              )}
            >
              <Icon
                className="size-[20px] shrink-0 drop-shadow-[2px_2px_0px_var(--color-border-strong)]"
                strokeWidth={2.5}
                aria-hidden
              />
              {label}
            </Link>
          ))}
        </nav>

        <Link
          href="/transfer"
          className="mt-4 flex h-11 items-center justify-center gap-2 rounded-field bg-accent px-4 text-sm font-medium text-accent-on shadow-card transition-colors hover:bg-accent-hover"
        >
          <ArrowLeftRight className="size-4" aria-hidden />
          Move money
        </Link>
      </aside>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md lg:pl-64">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <TalentsMark />
            <span className="font-display text-lg font-semibold">Talents</span>
          </Link>

          <p className="hidden text-sm text-ink-muted lg:block">
            Signed in as{" "}
            <span className="font-medium text-ink">
              {person.displayName}
            </span>
          </p>

          <div className="flex items-center gap-1">
            <DataSourceBadge mode={mode} />
            <PrivacyToggle />
            <ThemeToggle />
            <Link
              href="/settings"
              className="ml-1 flex size-11 items-center justify-center rounded-pill bg-accent-soft text-sm font-semibold text-accent"
              title="Profile and settings"
            >
              <span aria-hidden>{person.displayName.charAt(0)}</span>
              <span className="sr-only">Profile and settings</span>
            </Link>
          </div>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:pb-16 lg:pl-64"
      >
        <div className="lg:pl-6">{children}</div>
      </main>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {mobileNavItems.map(({ href, label, icon: Icon }) => (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-field py-2 text-[11px] font-medium",
                  isActive(href) ? "text-accent" : "text-ink-subtle",
                )}
              >
                <Icon
                  className="size-5 drop-shadow-[2px_2px_0px_var(--color-border-strong)]"
                  strokeWidth={2.5}
                  aria-hidden
                />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/**
 * Which data source is on screen.
 *
 * Worth the header space: in `live` the app still falls back to fixtures for
 * the domains the backend hasn't implemented, so "is this real?" is a genuine
 * question with a non-obvious answer. Stating it beats letting someone infer
 * it from whether the numbers look plausible.
 */
function DataSourceBadge({ mode }: { mode: ApiMode }) {
  const sample = mode === "mock";
  return (
    <span
      title={
        sample
          ? "Every screen is rendering sample data. No backend is being called."
          : "Reading from the API where it's implemented; sample data fills the rest."
      }
      className={cn(
        "mr-1 hidden items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-medium sm:inline-flex",
        sample
          ? "border-border text-ink-muted"
          : "border-positive/40 text-positive",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-pill",
          sample ? "bg-ink-subtle" : "bg-positive",
        )}
      />
      {sample ? "Sample data" : "Live data"}
    </span>
  );
}

function TalentsMark() {
  return (
    <span
      aria-hidden
      className="grid size-8 place-items-center rounded-[10px] bg-accent text-accent-on"
    >
      <svg viewBox="0 0 24 24" className="size-4.5" fill="none">
        <path
          d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
