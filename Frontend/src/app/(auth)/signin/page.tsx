import Link from "next/link";
import { SignInForm } from "./signin-form";
import { apiConfig } from "@/lib/api";

export const metadata = { title: "Sign in" };

/**
 * Auth lives outside the (app) group: no shell, no session requirement.
 *
 * In live mode the form exchanges credentials with the Go API through the BFF
 * proxy, which keeps the tokens in httpOnly cookies (ReadMe.md §5.5). In mock
 * mode there is nothing to authenticate against, so the form says so and any
 * submission signs in as the fixture person.
 */
export default function SignInPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-[10px] bg-accent text-accent-on"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none">
              <path
                d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight text-ink">
            Aster
          </span>
        </Link>

        <SignInForm mockMode={apiConfig.mode === "mock"} />
      </div>
    </main>
  );
}
