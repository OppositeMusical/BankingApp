import { apiFetch } from "../client";
import { ReadinessSchema, type WireReadiness } from "../wire";
import { resolve } from "./resolve";

/*
 * Health.  ⇄  openapi.yaml #/paths/~1health~1ready
 *
 * Worth wiring early: `/health/ready` reports whether Plaid and Alpaca are in
 * `simulated` or real sandbox mode, which is the difference between a demo and
 * a demo that quietly stopped being one.
 */

export const healthApi = {
  ready: (): Promise<WireReadiness> =>
    resolve("health.ready", {
      live: () => apiFetch("/health/ready", { schema: ReadinessSchema }),
      fixture: () => ({
        status: "ok" as const,
        checks: { database: "ok" as const, redis: "ok" as const },
        providers: {
          plaid: "simulated" as const,
          alpaca: "simulated" as const,
        },
      }),
    }),
};
