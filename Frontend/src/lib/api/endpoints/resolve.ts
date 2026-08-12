import { isLive } from "../config";
import { isServed, type Operation } from "./registry";

/**
 * Wire ids are UUIDs; fixture ids are readable slugs like `acc_checking`.
 *
 * That difference is load-bearing. It is how a call can tell whether the id it
 * was handed came from the backend or from a fixture, which decides whether it
 * may be sent over the wire at all.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isWireId = (id: string) => UUID.test(id);

/**
 * The one decision every endpoint makes: network, or fixtures?
 *
 * Two conditions, not one. The obvious one is whether the backend implements
 * the operation at all. The second is subtler and caused a real production
 * failure: resolution has to be coherent *per entity*, not per operation.
 *
 * `accounts.subAccounts` is unimplemented, so the account list comes from
 * fixtures with ids like `acc_checking`. `accounts.transactions` IS
 * implemented — so without `scopedTo` it happily sent `acc_checking` to Go,
 * which rejected it ("id must be a UUID"), and the 400 took the whole page
 * down. An id that came from a fixture can only ever be answered by fixtures,
 * however well-supported the operation is.
 */
export async function resolve<T>(
  operation: Operation,
  branches: {
    live: () => Promise<T>;
    fixture: () => T | Promise<T>;
    /**
     * What to show in live mode when the backend cannot answer.
     *
     * Live mode must never invent data. If an operation is unimplemented, the
     * honest answer is nothing — an empty list, an undefined value — and the
     * screen's empty state. Falling back to fixtures here is what made a real
     * account sit next to three invented ones with no way to tell them apart.
     *
     * Where this is omitted the fixture is used, which is correct only for
     * data that is presentational rather than the user's own.
     */
    empty?: () => T | Promise<T>;
    /**
     * Ids this call addresses. If any of them did not come from the backend,
     * the live branch cannot answer for them.
     */
    scopedTo?: string | string[];
  },
): Promise<T> {
  if (!isLive()) return branches.fixture();

  const unanswerable =
    !isServed(operation) ||
    (branches.scopedTo !== undefined &&
      (Array.isArray(branches.scopedTo)
        ? branches.scopedTo
        : [branches.scopedTo]
      ).some((id) => !isWireId(id)));

  if (unanswerable) {
    return branches.empty ? branches.empty() : branches.fixture();
  }

  return branches.live();
}

/**
 * Fixture latency, so loading states are built against something realistic
 * rather than retrofitted after the backend lands. Skipped on the server,
 * where it would only slow rendering down.
 */
export async function withLatency<T>(value: T, ms = 180): Promise<T> {
  if (typeof window === "undefined") return value;
  await new Promise((resolve) => setTimeout(resolve, ms));
  return value;
}
