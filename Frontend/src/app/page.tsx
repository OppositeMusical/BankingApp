import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  ArrowRight,
  EyeOff,
  HeartHandshake,
  PauseCircle,
  Receipt,
  Users,
} from "lucide-react";

const pillars = [
  {
    icon: EyeOff,
    title: "Privacy you can reach in a second",
    body: "One tap blurs every balance on screen. Freeze a card instantly. See every device signed in, and remove any of them yourself.",
  },
  {
    icon: Users,
    title: "Shared money, without the guessing",
    body: "Every joint account says plainly who can see it and what they can do. Every shared transaction says who made it. You can lower someone's access on your own.",
  },
  {
    icon: Receipt,
    title: "Fees that explain themselves",
    body: "No overdraft, maintenance, minimum-balance, or inactivity fees. If you're ever charged anything, it's itemised with the reason.",
  },
  {
    icon: PauseCircle,
    title: "Planning for a career that pauses",
    body: "Stepping back to care, retrain, or recover costs more than the salary. We show the retirement impact too, and help you build the buffer first.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2.5">
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
          <span className="font-display text-xl font-semibold tracking-tight">
            Talents
          </span>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center gap-1.5 rounded-field px-4 text-sm font-medium text-accent hover:bg-accent-soft"
        >
          Open the app
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        <section className="py-16 sm:py-24">
          <p className="text-sm font-medium text-accent">
            A bank account that assumes you can read a number
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.1] font-semibold tracking-tight text-ink sm:text-6xl">
            Banking that keeps your money in plain sight — and out of everyone
            else&apos;s.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            Real privacy controls, fees that explain themselves, and planning
            built for careers that don&apos;t run in a straight line. No lectures,
            no pastel condescension.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Sign in to demo app
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/security"
              className="inline-flex h-13 items-center rounded-field border border-border-strong bg-surface px-7 text-base font-medium text-ink transition-colors hover:bg-surface-sunk"
            >
              How we protect you
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="pillars"
          className="border-t border-border py-16"
        >
          <h2
            id="pillars"
            className="font-display text-2xl font-semibold text-ink"
          >
            What&apos;s actually different
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {pillars.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-card border border-border bg-surface p-6 shadow-card"
              >
                <span
                  className="grid size-10 place-items-center rounded-pill bg-accent-soft text-accent"
                  aria-hidden
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-medium text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-16">
          <div className="rounded-card border border-border bg-surface p-8 shadow-card">
            <HeartHandshake className="size-7 text-accent" aria-hidden />
            <h2 className="mt-4 max-w-2xl font-display text-2xl font-semibold text-ink">
              If someone else controls your money, we&apos;ll help you change that
              quietly.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
              You can open a sole account, move your direct deposit, and remove
              shared access without the other person being told in advance. Our
              support team will walk you through it, and none of it appears on a
              shared statement.
            </p>
            <Link
              href="/security"
              className="mt-5 inline-flex items-center gap-1.5 rounded-field text-sm font-medium text-accent hover:underline"
            >
              Read about leaving safely
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <p className="mx-auto max-w-5xl px-5 text-xs text-ink-subtle">
          Talents is a design prototype. Balances, transactions, and projections
          shown in the app are illustrative sample data.
        </p>
      </footer>
    </div>
  );
}
