import { apiMode } from "./config";

/**
 * A fixture that must only ever appear in mock mode.
 *
 * Several screens read fixtures directly rather than through the connector,
 * because the domains behind them — goals, insights, cards, sessions, flow
 * runs — have no representation in the contract at all. There is no endpoint
 * to call and therefore nothing for `resolve()` to key on.
 *
 * In live mode those screens must show nothing rather than something invented.
 * A bank that displays a balance nobody owns is worse than a bank that says it
 * has nothing to show yet.
 *
 *     const goalList = sample(goals, []);
 *
 * Works on the server and the client: the client's mode is registered by
 * <ApiModeSync> from the root layout.
 */
export function sample<T>(fixture: T, empty: T): T {
  return apiMode() === "mock" ? fixture : empty;
}

/** True when fixtures may be shown. Use to hide a whole section outright. */
export const showingSample = () => apiMode() === "mock";
