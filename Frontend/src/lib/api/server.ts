import { cookies } from "next/headers";
import { setAuthTokenSource } from "./client";
import { authCookies } from "./config";

/*
 * Server-graph wiring for the connector. Imported (for its side effect) by the
 * root layout, which is a server component — so `next/headers` stays out of
 * every client bundle while server components still get authenticated fetches.
 *
 * The source reads the same httpOnly cookie the BFF proxy writes on login.
 * During a build-time prerender there is no request and `cookies()` throws;
 * that is the "no session" case, not an error.
 */
setAuthTokenSource(async () => {
  try {
    return (await cookies()).get(authCookies.access)?.value ?? null;
  } catch {
    return null;
  }
});
