"use client";

import { setClientMode, type ApiMode } from "./config";

/**
 * Carries the server's resolved API mode to the client.
 *
 * `API_MODE` is deliberately server-only, so the browser cannot read it. The
 * root layout resolves it on the server and renders this, which registers the
 * value for the two client components that call the connector (the transfer
 * confirm step and sign-in).
 *
 * Set during render rather than in an effect: a client component may call the
 * connector before effects have run, and reading a stale mode would send a
 * mutation to the wrong place.
 */
export function ApiModeSync({ mode }: { mode: ApiMode }) {
  setClientMode(mode);
  return null;
}
