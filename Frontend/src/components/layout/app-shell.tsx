"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { mobileNavItems, navItems } from "./nav-items";
import { PrivacyToggle } from "./preference-toggles";
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

      {/* Desktop sidebar — edge-to-edge, ultra-minimal */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/[0.04] bg-black/40 px-5 py-8 backdrop-blur-2xl lg:flex">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="mb-10 flex items-center gap-2.5 px-1"
        >
          <TalentsMark className="size-6" />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Talents
          </span>
        </Link>

        {/* Navigation */}
        <nav aria-label="Main" className="flex-1">
          <ul className="space-y-0.5">
            {navItems.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] tracking-wide",
                    "transition-all duration-200",
                    isActive(href)
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  {/* Active dot indicator */}
                  {isActive(href) && (
                    <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
                  )}
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0 transition-colors duration-200",
                      isActive(href) ? "text-accent" : "text-zinc-600 group-hover:text-zinc-400",
                    )}
                    strokeWidth={1.8}
                    aria-hidden
                  />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="mt-auto space-y-4">
          <div className="flex items-center gap-2 px-1">
            <DataSourceBadge mode={mode} />
            <div className="ml-auto">
              <PrivacyToggle />
            </div>
          </div>
          <div className="h-px bg-white/[0.04]" />
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <div className="flex size-7 items-center justify-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent">
              {person.displayName.charAt(0)}
            </div>
            <span className="tracking-wide">{person.displayName}</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-surface/80 px-4 backdrop-blur-2xl lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <TalentsMark />
          <span className="font-display text-lg font-semibold">Talents</span>
        </Link>
        <div className="flex items-center gap-2">
          <PrivacyToggle />
          <Link
            href="/settings"
            className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
          >
            {person.displayName.charAt(0)}
          </Link>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 lg:pl-72 lg:pr-8 lg:pb-12 lg:pt-12"
      >
        {children}
      </main>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-4 bottom-4 z-30 rounded-full border border-white/5 bg-white/[0.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-3xl lg:hidden"
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
                  className="size-5"
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

function TalentsMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid place-items-center rounded-[10px] bg-accent text-accent-on",
        className || "size-8"
      )}
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
