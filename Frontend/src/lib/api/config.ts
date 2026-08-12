/**
 * Connector configuration.
 *
 * `mode` decides where data comes from:
 *   - `mock` — every endpoint resolves to the fixtures in lib/mock. No network,
 *     no session needed. This is the sample-data tour of the product.
 *   - `live` — operations the backend implements go over HTTP; the rest still
 *     resolve to fixtures, because a screen with no endpoint behind it has to
 *     render something. See `endpoints/registry.ts` for which is which.
 *
 * The browser only ever talks to the same-origin BFF proxy at `/api`, so the
 * real backend URL is server-only and never shipped to the client. That is why
 * `internalUrl` has no NEXT_PUBLIC_ prefix.
 */

export type ApiMode = "mock" | "live";

const asMode = (raw: string | undefined): ApiMode | null =>
  raw === "live" ? "live" : raw === "mock" ? "mock" : null;

/*
 * Why there are two variables for one setting.
 *
 * `NEXT_PUBLIC_*` is inlined into the client bundle at BUILD time — changing it
 * on the platform does nothing until the image is rebuilt. `API_MODE` has no
 * prefix, so it is read from the real environment at RUNTIME on the server.
 * That makes it a true switch: change it in Railway, the service restarts, and
 * the data source changes with no rebuild.
 *
 * API_MODE wins wherever both are visible.
 */
function serverMode(): ApiMode {
  return (
    asMode(process.env.API_MODE) ??
    asMode(process.env.NEXT_PUBLIC_API_MODE) ??
    "mock"
  );
}

/*
 * The browser cannot read API_MODE — it is server-only by design. So the server
 * tells the client what it resolved, once, via <ApiModeSync> in the root
 * layout. Until that runs, the build-time value is the best guess available.
 *
 * This mirrors how server.ts registers the auth token source: a single
 * side-effect registration rather than threading a value through every call.
 */
let clientMode: ApiMode | null = null;

export function setClientMode(mode: ApiMode) {
  clientMode = mode;
}

export function apiMode(): ApiMode {
  if (typeof window === "undefined") return serverMode();
  return clientMode ?? asMode(process.env.NEXT_PUBLIC_API_MODE) ?? "mock";
}

export const isLive = () => apiMode() === "live";

export const apiConfig = {
  /** Same-origin prefix the browser calls. Proxied server-side. */
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  /**
   * The Go API. Server-only, read at runtime.
   *
   * On Railway this is the `api` service — either its public domain or, on the
   * private network, http://api.railway.internal:4000.
   */
  internalUrl: process.env.API_INTERNAL_URL ?? "http://localhost:4000",
  timeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15000),
} as const;

/**
 * The httpOnly cookies the BFF proxy writes on login/refresh. Named here so
 * the proxy and the server-side token reader cannot drift apart. The names are
 * not secrets — the values never reach JavaScript.
 */
export const authCookies = {
  access: "ba_access",
  refresh: "ba_refresh",
} as const;
