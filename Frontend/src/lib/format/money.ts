import type { Money } from "@/lib/types/banking";

/*
 * Money is always carried as an integer number of minor units (cents) plus an
 * ISO-4217 code — never a float. Formatting is the only place it becomes a
 * decimal, and that happens at the edge, for display only.
 */

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, options: Intl.NumberFormatOptions) {
  const key = `${currency}:${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      ...options,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/** Minor units -> major units, respecting the currency's exponent. */
function toMajorUnits(money: Money) {
  const exponent = CURRENCY_EXPONENTS[money.currency] ?? 2;
  return money.amount / 10 ** exponent;
}

// Currencies whose minor unit is not 1/100. Extend as markets are added.
const CURRENCY_EXPONENTS: Record<string, number> = {
  JPY: 0,
  KRW: 0,
  BHD: 3,
  KWD: 3,
};

export type FormatMoneyOptions = {
  /** Drop the fractional part when the value is whole (e.g. $1,200). */
  compactWhole?: boolean;
  /** Always show a leading + or -, for transaction amounts. */
  signed?: boolean;
};

export function formatMoney(
  money: Money,
  { compactWhole = false, signed = false }: FormatMoneyOptions = {},
): string {
  const major = toMajorUnits(money);
  const isWhole = Number.isInteger(major);
  const fractionDigits =
    compactWhole && isWhole ? 0 : (CURRENCY_EXPONENTS[money.currency] ?? 2);

  const formatted = getFormatter(money.currency, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Math.abs(major));

  if (signed) {
    return `${major < 0 ? "−" : "+"}${formatted}`;
  }
  return major < 0 ? `−${formatted}` : formatted;
}

/** Splits a formatted balance so the cents can be de-emphasised visually. */
export function splitMoneyParts(money: Money): {
  whole: string;
  fraction: string;
} {
  const exponent = CURRENCY_EXPONENTS[money.currency] ?? 2;
  const formatted = formatMoney(money);
  if (exponent === 0) return { whole: formatted, fraction: "" };
  const separator = formatted.lastIndexOf(".");
  if (separator === -1) return { whole: formatted, fraction: "" };
  return {
    whole: formatted.slice(0, separator),
    fraction: formatted.slice(separator),
  };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add ${a.currency} to ${b.currency}`);
  }
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function sumMoney(items: Money[], currency: string): Money {
  return items.reduce<Money>((total, item) => addMoney(total, item), {
    amount: 0,
    currency,
  });
}

/** Percentage of `target` reached by `current`, clamped to 0–100. */
export function percentOf(current: Money, target: Money): number {
  if (target.amount <= 0) return 0;
  return Math.min(100, Math.max(0, (current.amount / target.amount) * 100));
}
