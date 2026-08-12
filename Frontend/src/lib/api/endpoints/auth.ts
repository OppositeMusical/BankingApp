import { apiFetch } from "../client";
import { ApiError } from "../errors";
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

  register: (details: {
    email: string;
    name: string;
    /** The backend requires at least 12 characters. */
    password: string;
  }): Promise<Person> =>
    resolve("auth.register", {
      live: async () => {
        // Like login, this goes through the proxy's token exchange: cookies
        // are set server-side and only the user object comes back.
        const { user } = await apiFetch("/auth/register", {
          method: "POST",
          body: details,
          schema: MeResponse,
        });
        return toPerson(user);
      },
      fixture: () => withLatency(currentPerson),
    }),

  /** The signed-in person, or null when there is no usable session. */
  me: (): Promise<Person | null> =>
    resolve("auth.me", {
      live: async () => {
        try {
          const { user } = await apiFetch("/auth/me", { schema: MeResponse });
          return toPerson(user);
        } catch (error) {
          // Signed out is a state, not an exception — the caller decides
          // whether that means a redirect to /signin.
          if (error instanceof ApiError && error.isAuthFailure) return null;
          throw error;
        }
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
