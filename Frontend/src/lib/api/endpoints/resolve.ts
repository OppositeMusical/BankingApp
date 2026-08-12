import { isLive } from "../config";
import { isServed, type Operation } from "./registry";

/**
 * The one decision every endpoint makes: network, or fixtures?
 *
 * An endpoint goes over HTTP only when the app is in live mode *and* the
 * backend actually implements it. Otherwise the fixture branch runs. Both
 * branches return the same type, so this is invisible above the connector.
 */
export async function resolve<T>(
  operation: Operation,
  branches: { live: () => Promise<T>; fixture: () => T | Promise<T> },
): Promise<T> {
  if (isLive() && isServed(operation)) return branches.live();
  return branches.fixture();
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
