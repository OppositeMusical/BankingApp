"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import { Building2, Plus, RefreshCw, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Explainer } from "@/components/banking/explainer";
import { describeError, linkedApi } from "@/lib/api";
import { formatFullDate } from "@/lib/format/date";
import type { LinkedAccount } from "@/lib/api/endpoints/linked";

/**
 * Linking a bank account at another institution.
 *
 * Plaid Link is a hosted flow — the credentials are typed into Plaid's own
 * widget and never touch this app or its backend. That is the entire reason to
 * use it, so it is worth the one dependency rather than reimplementing the
 * handshake.
 *
 * The token is fetched only when someone actually clicks: it is short-lived
 * and single-use, so minting one on every page render would waste most of them
 * and expire the rest.
 */
export function LinkedAccounts({ accounts }: { accounts: LinkedAccount[] }) {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const onSuccess = useCallback(
    // Plaid types the token as nullable. It is not, on the success path — but
    // guarding beats asserting on the one value the whole exchange depends on.
    async (publicToken: string | null) => {
      if (!publicToken) {
        setError("Your bank didn't return a token. Try linking again.");
        setLinkToken(null);
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await linkedApi.exchange(publicToken);
        router.refresh();
      } catch (err) {
        setError(describeError(err));
      } finally {
        setBusy(false);
        setLinkToken(null);
      }
    },
    [router],
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    // Abandoning the flow is not an error. Drop the token so the next attempt
    // fetches a fresh one — this one is spent either way.
    onExit: () => setLinkToken(null),
  });

  const startLink = async () => {
    setBusy(true);
    setError(null);
    try {
      const { linkToken: token } = await linkedApi.linkToken();
      setLinkToken(token);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  // The widget cannot open until Plaid has loaded the token it was handed, so
  // opening is driven by `ready` rather than by the click that started it.
  // In an effect, not in render: opening a modal is a side effect, and React
  // may render more than once before it commits.
  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, ready, open]);

  const act = async (id: string, action: "sync" | "unlink") => {
    setPending(id);
    setError(null);
    try {
      await (action === "sync" ? linkedApi.sync(id) : linkedApi.unlink(id));
      router.refresh();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setPending(null);
    }
  };

  return (
    <section aria-labelledby="linked-heading" className="mt-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="linked-heading"
          className="font-display text-xl font-semibold text-ink"
        >
          Accounts elsewhere
        </h2>
        <Button size="sm" onClick={startLink} disabled={busy}>
          <Plus className="size-3.5" aria-hidden />
          {busy ? "Opening…" : "Add account"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mb-3 text-sm text-alert">
          {error}
        </p>
      )}

      <Card>
        {accounts.length === 0 ? (
          <CardBody className="pt-5">
            <p className="text-sm text-ink-muted">
              Nothing linked yet. Connecting an account at another bank lets a
              flow notice when your pay lands there.
            </p>
          </CardBody>
        ) : (
          <ul className="divide-y divide-border">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-pill bg-surface-sunk text-ink-muted"
                    aria-hidden
                  >
                    <Building2 className="size-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {account.institution ?? "Linked bank"}
                      {account.mask && (
                        <span className="ml-2 text-xs font-normal text-ink-subtle">
                          ···· {account.mask}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-ink-subtle">
                      {account.name ?? account.subtype ?? "Account"}
                      {account.lastSyncedAt &&
                        ` · synced ${formatFullDate(account.lastSyncedAt)}`}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={account.status} />
                  <button
                    type="button"
                    onClick={() => act(account.id, "sync")}
                    disabled={pending === account.id}
                    className="inline-flex size-9 items-center justify-center rounded-pill text-ink-muted hover:bg-surface-sunk hover:text-ink"
                  >
                    <RefreshCw className="size-4" aria-hidden />
                    <span className="sr-only">
                      Sync {account.institution ?? "account"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => act(account.id, "unlink")}
                    disabled={pending === account.id}
                    className="inline-flex size-9 items-center justify-center rounded-pill text-ink-muted hover:bg-surface-sunk hover:text-alert"
                  >
                    <Unlink className="size-4" aria-hidden />
                    <span className="sr-only">
                      Unlink {account.institution ?? "account"}
                    </span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Explainer label="What can you see once I link an account?">
        Balances and transactions, read-only, and only so a flow can notice
        money arriving. Nothing here can move money at your other bank — this
        app cannot make a payment from it, and linking grants no such
        permission. Your bank credentials go to Plaid, never to us. Unlink at
        any time and the access is revoked.
      </Explainer>
    </section>
  );
}

function StatusBadge({ status }: { status: LinkedAccount["status"] }) {
  if (status === "active") return <Badge tone="positive">Connected</Badge>;
  if (status === "login_required")
    return <Badge tone="accent">Sign in again</Badge>;
  return <Badge tone="neutral">Disconnected</Badge>;
}
