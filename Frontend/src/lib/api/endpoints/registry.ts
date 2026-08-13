/*
 * Which endpoints the backend actually serves today.
 *
 * The contract declares ~40 operations; the Go server in Banking-backend
 * registers 14 of them (go/internal/api/server.go). The rest exist only in the
 * TypeScript prototype, which is being discarded.
 *
 * Rather than let screens discover that as a 404 at runtime, every endpoint
 * module asks this first. `live` endpoints go over HTTP; everything else
 * resolves to the same fixtures mock mode uses, behind an identical signature.
 * A screen cannot tell which it got.
 *
 * When Go ships an endpoint, move one line. Nothing else changes.
 */

export const liveOperations = [
  "health.live",
  "health.ready",
  "health.ledger",
  "auth.register",
  "auth.login",
  "auth.refresh",
  "auth.logout",
  "auth.me",
  "accounts.list",
  "accounts.balance",
  "accounts.transactions",
  "transfers.internal",
  "transfers.get",
  "simulate.deposit",
  "simulate.cardSwipe",

  // Shipped with the sandbox work: the schema always supported these, the Go
  // API now serves them.
  "accounts.subAccounts",
  "accounts.members",
  "accounts.budgets",
  "rules.list",
  "rules.create",
  "rules.update",
  "rules.delete",
  "rules.executions",
  "cards.list",
  "cards.create",
  "cards.update",
  "cards.authorizations",
  "budgets.list",
  "budgets.upsert",
  "brokerage.account",
  "brokerage.orders",
  "brokerage.holdings",
] as const;

export type LiveOperation = (typeof liveOperations)[number];

/**
 * Everything in the contract that Go has not implemented. Listed explicitly so
 * the gap is visible in code review rather than inferred from an absence.
 */
export const pendingOperations = [
  "transfers.external",
  "linkedAccounts.list",
] as const;

export type PendingOperation = (typeof pendingOperations)[number];

export type Operation = LiveOperation | PendingOperation;

const live = new Set<string>(liveOperations);

/** True when this operation should go over the network in live mode. */
export const isServed = (operation: Operation): operation is LiveOperation =>
  live.has(operation);
