/**
 * The connector's public surface.
 *
 * Screens import from here and nowhere else inside lib/api — not from
 * `client`, not from `wire`, and never from `generated/`. That is what keeps
 * the contract's vocabulary out of the UI, and what makes a backend change a
 * one-file edit.
 */
export { accountsApi } from "./endpoints/accounts";
export { authApi } from "./endpoints/auth";
export { flowsApi } from "./endpoints/flows";
export { healthApi } from "./endpoints/health";
export { transfersApi } from "./endpoints/transfers";

export { apiConfig, isLive } from "./config";
export {
  ApiError,
  ApiTimeoutError,
  ApiValidationError,
  describeError,
  type ErrorCode,
} from "./errors";
export {
  isServed,
  liveOperations,
  pendingOperations,
  type Operation,
} from "./endpoints/registry";
export type { Page } from "./wire";
