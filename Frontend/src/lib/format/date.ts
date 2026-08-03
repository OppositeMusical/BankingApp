/*
 * All timestamps arrive as ISO-8601 UTC strings. Formatting is pinned to a
 * fixed locale and time zone so server-rendered and client-rendered output
 * agree — otherwise dates are a reliable source of hydration mismatches.
 */

const TIME_ZONE = "UTC";
const LOCALE = "en-US";

const dayFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  day: "numeric",
  timeZone: TIME_ZONE,
});

const fullFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const monthFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

export const formatDay = (iso: string) => dayFormatter.format(new Date(iso));
export const formatFullDate = (iso: string) =>
  fullFormatter.format(new Date(iso));
export const formatTime = (iso: string) => timeFormatter.format(new Date(iso));

/** "2026-03" -> "March 2026" */
export function formatMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
}

/** Short month label for chart axes: "2026-03" -> "Mar" */
export function formatMonthShort(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    timeZone: TIME_ZONE,
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/**
 * Groups transactions under "Today" / "Yesterday" / a date. `reference` is
 * passed in rather than read from the clock so the result is deterministic
 * and testable.
 */
export function relativeDayLabel(iso: string, reference: Date): string {
  const date = new Date(iso);
  const days = Math.floor(
    (startOfUTCDay(reference) - startOfUTCDay(date)) / 86_400_000,
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return dayFormatter.format(date);
}

function startOfUTCDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** "in 8 months" / "3 months ago" — used for goal target dates. */
export function monthsUntil(iso: string, reference: Date): number {
  const target = new Date(iso);
  return (
    (target.getUTCFullYear() - reference.getUTCFullYear()) * 12 +
    (target.getUTCMonth() - reference.getUTCMonth())
  );
}
