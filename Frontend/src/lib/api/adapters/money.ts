import type { Money } from "@/lib/types/banking";
import type { WireMoney } from "../wire";

/**
 * Wire money → domain money.
 *
 * The wire carries a third field, `formatted`, which the UI deliberately drops:
 * every amount in this app renders through <Amount>, which owns Privacy Mode
 * and locale. A server-formatted string would bypass both.
 */
export const toMoney = (wire: WireMoney): Money => ({
  amount: wire.amount,
  currency: wire.currency,
});

/** Domain money → the wire's `AmountInput` (integer minor units). */
export const toAmountInput = (money: Money): number => money.amount;
