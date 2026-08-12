import { apiFetch } from "../client";
import { UserSchema, oneOf } from "../wire";
import { resolve, withLatency } from "./resolve";
import { currentPerson } from "@/lib/mock/data";
import type { Person } from "@/lib/types/banking";
import type { WireUser } from "../wire";

/*
 * Auth.  ⇄  openapi.yaml #/paths/~1auth~1login
 *
 * Nothing here handles a token. The browser posts credentials to the
 * same-origin BFF proxy, which exchanges them with the Go API and keeps the
 * access and refresh tokens in httpOnly cookies. That removes the XSS
 * token-theft path rather than mitigating it, per ReadMe.md §5.5.
 */

const MeResponse = oneOf("user", UserSchema);

const toPerson = (user: WireUser): Person => ({
  id: user.id,
  legalName: user.name,
  displayName: user.name.split(" ")[0] ?? user.name,
  email: user.email,
});

export const authApi = {
  login: (credentials: { email: string; password: string }): Promise<Person> =>
    resolve("auth.login", {
      live: async () => {
        // The proxy strips the tokens out of this response and sets cookies;
        // what comes back to the browser is the user only.
        const { user } = await apiFetch("/auth/login", {
          method: "POST",
          body: credentials,
          schema: MeResponse,
        });
        return toPerson(user);
      },
      fixture: () => withLatency(currentPerson),
    }),

  me: (): Promise<Person | null> =>
    resolve("auth.me", {
      live: async () => {
        const { user } = await apiFetch("/auth/me", { schema: MeResponse });
        return toPerson(user);
      },
      fixture: () => withLatency(currentPerson),
    }),

  logout: (): Promise<void> =>
    resolve("auth.logout", {
      live: async () => {
        await apiFetch("/auth/logout", { method: "POST" });
      },
      fixture: () => undefined,
    }),
};
