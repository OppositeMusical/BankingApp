/**
 * Connector configuration.
 *
 * `mode` decides where data comes from:
 *   - `mock` — every endpoint resolves to the fixtures in lib/mock. No network.
 *   - `live` — endpoints the backend actually serves go over HTTP; the rest
 *     fall back to fixtures. See `endpoints/registry.ts` for which is which.
 *
 * The browser only ever talks to the same-origin BFF proxy at `/api`, so the
 * real backend URL is server-only and never shipped to the client. That is why
 * `internalUrl` has no NEXT_PUBLIC_ prefix.
 */

export type ApiMode = "mock" | "live";

function readMode(): ApiMode {
  const raw = process.env.NEXT_PUBLIC_API_MODE;
  return raw === "live" ? "live" : "mock";
}

export const apiConfig = {
  mode: readMode(),
  /** Same-origin prefix the browser calls. Proxied server-side. */
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  /**
   * The Go API. Server-only.
   *
   * Port 4000 is deliberate on the backend's side — it keeps clear of frontend
   * dev servers on 3000/3001. Postgres and Redis likewise sit on 5433/6380.
   */
  internalUrl: process.env.API_INTERNAL_URL ?? "http://localhost:4000",
  timeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15000),
} as const;

export const isLive = () => apiConfig.mode === "live";

/**
 * The httpOnly cookies the BFF proxy writes on login/refresh. Named here so
 * the proxy and the server-side token reader cannot drift apart. The names are
 * not secrets — the values never reach JavaScript.
 */
export const authCookies = {
  access: "ba_access",
  refresh: "ba_refresh",
} as const;
