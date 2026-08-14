"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { kindLabels, VisibilityBadge } from "@/components/banking/account-card";
import type { Account, AccountShare } from "@/lib/types/banking";
import { cn } from "@/lib/utils/cn";

/*
 * Accounts as a carousel.
 *
 * The track is a real scroll container with CSS scroll snapping, so it works
 * by touch, trackpad and keyboard before any of the JavaScript below runs. The
 * arrows and dots are conveniences layered on top of that — they move the
 * scroll position and nothing else, which is why there is no "current slide"
 * state that could disagree with what is on screen.
 *
 * Each card carries its own expander. Only the expanded card grows (the track
 * aligns to the start, not stretch), so opening one doesn't shove the others
 * around.
 */

/** Matches `gap-4` on the track; used to work out one card's scroll step. */
const FALLBACK_GAP = 16;

const accessLabels: Record<AccountShare["access"], string> = {
  view: "Can see the balance and activity",
  spend: "Can also make payments from it",
  manage: "Can also change who has access",
};

/** Smooth, unless the reader has asked for less motion. */
function scrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined") return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

export function AccountCarousel({ accounts }: { accounts: Account[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState({
    atStart: true,
    atEnd: true,
    active: 0,
    scrollable: false,
  });

  /** One card plus the gap after it — how far an arrow press travels. */
  const stepSize = useCallback((track: HTMLUListElement) => {
    const first = track.firstElementChild as HTMLElement | null;
    if (!first) return track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap) || FALLBACK_GAP;
    return first.offsetWidth + gap;
  }, []);

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    const step = stepSize(track);
    setPosition({
      atStart: track.scrollLeft <= 1,
      atEnd: track.scrollLeft >= max - 1,
      active: step > 0 ? Math.round(track.scrollLeft / step) : 0,
      scrollable: max > 1,
    });
  }, [stepSize]);

  // The arrows depend on how many cards fit, which depends on the viewport.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    return () => observer.disconnect();
  }, [sync]);

  const page = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * stepSize(track),
      behavior: scrollBehavior(),
    });
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({
      left: index * stepSize(track),
      behavior: scrollBehavior(),
    });
  };

  return (
    <section aria-roledescription="carousel" aria-label="Your accounts">
      <ul
        ref={trackRef}
        onScroll={sync}
        // Focusable so the scroll region is reachable by keyboard even when
        // the arrows aren't used.
        tabIndex={0}
        aria-label="Accounts, scrollable"
        className="-mx-1 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto scroll-smooth px-1 pt-1 pb-4 [scrollbar-width:thin]"
      >
        {accounts.map((account, index) => (
          <li
            key={account.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${accounts.length}: ${account.name}`}
            className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
          >
            <CarouselAccountCard account={account} />
          </li>
        ))}
      </ul>

      {position.scrollable && (
        <div className="mt-1 flex items-center justify-between gap-4">
          {/* Position, and a way to jump. Dots are a supplement to the
              arrows, never the only control. */}
          <ul className="flex items-center gap-1.5">
            {accounts.map((account, index) => (
              <li key={account.id}>
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  aria-current={position.active === index || undefined}
                  className={cn(
                    "block size-2 rounded-pill transition-colors",
                    position.active === index
                      ? "bg-accent"
                      : "bg-border-strong/50 hover:bg-border-strong",
                  )}
                >
                  <span className="sr-only">Go to {account.name}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <CarouselButton
              label="Previous accounts"
              onClick={() => page(-1)}
              disabled={position.atStart}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </CarouselButton>
            <CarouselButton
              label="Next accounts"
              onClick={() => page(1)}
              disabled={position.atEnd}
            >
              <ChevronRight className="size-4" aria-hidden />
            </CarouselButton>
          </div>
        </div>
      )}
    </section>
  );
}

function CarouselButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-pill border border-border-strong bg-surface text-ink transition-colors hover:bg-surface-sunk disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface"
    >
      {children}
    </button>
  );
}

/**
 * An account card that opens in place.
 *
 * The whole card is deliberately not a link: the expander is a button, and a
 * button inside a link is neither valid nor operable. The account name is the
 * link instead, and "Open account" repeats it at the end of the details for
 * anyone who got there by expanding.
 */
function CarouselAccountCard({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const panelId = `account-details-${account.id}`;
  const hasInterest = account.interestRateBps !== undefined;
  const differsFromBalance =
    account.available.amount !== account.balance.amount;

  return (
    <article className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-ink">
            <Link
              href={`/accounts/${account.id}`}
              className="rounded-field hover:underline"
            >
              {account.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-ink-subtle">
            {kindLabels[account.kind]} ···· {account.last4}
          </p>
        </div>
        <VisibilityBadge account={account} />
      </div>

      <p className="mt-5 font-display text-2xl font-semibold text-ink">
        <Amount value={account.balance} />
      </p>

      {differsFromBalance && (
        <p className="mt-1 text-xs text-ink-muted">
          <Amount value={account.available} /> available now
        </p>
      )}

      {hasInterest && (
        <p className="mt-1 text-xs text-positive">
          {(account.interestRateBps! / 100).toFixed(2)}% interest, paid monthly
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        className="mt-4 inline-flex h-9 w-full items-center justify-between gap-2 rounded-field border border-border px-3 text-sm font-medium text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
      >
        {open ? "Hide details" : "Account details"}
        <ChevronDown
          className={cn(
            "size-4 transition-transform duration-150",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {/* Always in the DOM so `aria-controls` always resolves. No display
          utilities on this element — the `hidden` attribute has to win. */}
      <div id={panelId} hidden={!open} className="mt-3">
        <dl className="divide-y divide-border border-y border-border text-sm">
          <Detail term="Available to spend">
            <Amount value={account.available} />
          </Detail>
          <Detail term="Account type">{kindLabels[account.kind]}</Detail>

          {/* Real numbers from the bank. Shown only once provisioning has
              actually finished — an account exists before its numbers do, and
              a blank field would read as a missing value rather than a
              pending one. */}
          {account.bank?.status === "provisioned" &&
          account.bank.accountNumber ? (
            <>
              <Detail term="Account number">
                <AccountNumber value={account.bank.accountNumber} />
              </Detail>
              {account.bank.routingNumber && (
                <Detail term="Routing number">
                  {account.bank.routingNumber}
                </Detail>
              )}
            </>
          ) : (
            <Detail term="Account number">
              <BankStatus bank={account.bank} fallback={account.last4} />
            </Detail>
          )}
          {hasInterest && (
            <Detail term="Interest">
              {(account.interestRateBps! / 100).toFixed(2)}% a year
            </Detail>
          )}
        </dl>

        <div className="mt-3">
          <p className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
            Who can see this
          </p>
          {account.sharedWith.length === 0 ? (
            <p className="mt-1.5 text-sm text-ink-muted">
              Only you. No one else can see this balance or its activity.
            </p>
          ) : (
            <ul className="mt-1.5 flex flex-col gap-2">
              {account.sharedWith.map((share) => (
                <li key={share.personId} className="flex items-center gap-2.5">
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-pill bg-surface-sunk text-xs font-medium text-ink-muted"
                    aria-hidden
                  >
                    {share.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-ink">{share.name}</span>
                    <span className="block text-xs text-ink-subtle">
                      {accessLabels[share.access]}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href={`/accounts/${account.id}`}
          className="mt-3.5 inline-flex items-center gap-1.5 rounded-field text-sm font-medium text-accent hover:underline"
        >
          Open account
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

/**
 * An account number, masked until asked for.
 *
 * The routing number beside it is public — every bank publishes theirs — but
 * the pair is what authorises a debit, so the account number is the half worth
 * a deliberate action to reveal.
 */
function AccountNumber({ value }: { value: string }) {
  const [shown, setShown] = useState(false);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="tabular">
        {shown ? value : `···· ${value.slice(-4)}`}
      </span>
      <button
        type="button"
        onClick={() => setShown((current) => !current)}
        className="rounded-field text-xs font-medium text-accent hover:underline"
      >
        {shown ? "Hide" : "Show"}
        <span className="sr-only"> full account number</span>
      </button>
    </span>
  );
}

/** What to say while there is no account number yet. */
function BankStatus({
  bank,
  fallback,
}: {
  bank?: Account["bank"];
  fallback: string;
}) {
  if (!bank) return <>···· {fallback}</>;
  if (bank.status === "failed") {
    return (
      <span className="text-alert">
        {bank.failureReason ?? "The bank declined this account"}
      </span>
    );
  }
  return <span className="text-ink-muted">Opening at the bank…</span>;
}

function Detail({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-ink-muted">{term}</dt>
      <dd className="text-right font-medium text-ink">{children}</dd>
    </div>
  );
}
