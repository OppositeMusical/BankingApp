"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cardsApi, describeError } from "@/lib/api";
import type { Account } from "@/lib/types/banking";

/**
 * Issue a card, against a chosen account.
 *
 * What a card spends from is the only decision that matters here, and it used
 * to be made silently: every card was issued against the bank account, so a
 * card could never be tied to a sub-account and two cards were
 * indistinguishable. The picker is the whole point of the form.
 *
 * The spend limit is optional because the API treats it as optional — a card
 * with no limit is a real choice, not a missing field.
 */
export function IssueCard({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(accounts[0]?.id ?? "");
  const [limit, setLimit] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issue = async () => {
    const chosen = accounts.find((account) => account.id === target);
    if (!chosen) {
      setError("Choose an account for the card to spend from.");
      return;
    }

    const parsed = limit.trim() ? Math.round(Number(limit) * 100) : undefined;
    if (parsed !== undefined && (!Number.isFinite(parsed) || parsed <= 0)) {
      setError("A spend limit must be greater than zero.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await cardsApi.issue({
        // A card is always issued against the bank account; the sub-account
        // only narrows what it draws on.
        accountId: chosen.parentAccountId ?? chosen.id,
        subAccountId: chosen.parentAccountId ? chosen.id : undefined,
        perTransactionLimit: parsed,
      });
      setOpen(false);
      setLimit("");
      router.refresh();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="mt-3">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" aria-hidden />
          Issue a card
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-card border border-border bg-surface-sunk p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Spends from</span>
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="h-11 rounded-field border border-border-strong bg-surface px-3 text-sm text-ink"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
                {account.isBankAccount ? " (bank account)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Per-transaction limit
          </span>
          <input
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            inputMode="decimal"
            placeholder="Optional"
            className="h-11 w-36 rounded-field border border-border-strong bg-surface px-3 text-sm tabular text-ink"
          />
        </label>

        <Button size="sm" onClick={issue} disabled={busy}>
          {busy ? "Issuing…" : "Issue card"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-alert">
          {error}
        </p>
      )}
    </div>
  );
}
