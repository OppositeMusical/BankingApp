"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { accountsApi, describeError } from "@/lib/api";
import type { Account } from "@/lib/types/banking";

/**
 * Open a sub-account.
 *
 * It starts empty and is funded by a transfer like anything else, so opening
 * one never touches the money path. A label is the only thing the API needs —
 * asking for more would be a form inventing fields the wire cannot store.
 */
export function NewSubAccount({
  bankAccounts,
}: {
  /** Sub-accounts belong to a bank account, so one has to be chosen. */
  bankAccounts: Account[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [parent, setParent] = useState(bankAccounts[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setError("Give it a name.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await accountsApi.createSubAccount(parent, trimmed);
      setLabel("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  if (bankAccounts.length === 0) return null;

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" aria-hidden />
        New account
      </Button>
    );
  }

  return (
    <div className="w-full rounded-card border border-border bg-surface-sunk p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Name</span>
          <input
            autoFocus
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && create()}
            placeholder="Rent, Holiday, Taxes…"
            maxLength={80}
            className="h-11 w-52 rounded-field border border-border-strong bg-surface px-3 text-sm text-ink"
          />
        </label>

        {bankAccounts.length > 1 && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Inside</span>
            <select
              value={parent}
              onChange={(event) => setParent(event.target.value)}
              className="h-11 rounded-field border border-border-strong bg-surface px-3 text-sm text-ink"
            >
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <Button size="sm" onClick={create} disabled={busy}>
          {busy ? "Opening…" : "Open account"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>

      <p className="mt-3 text-xs text-ink-subtle">
        Starts empty, and shares the bank account&apos;s number. Move money into
        it from Transfer.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-alert">
          {error}
        </p>
      )}
    </div>
  );
}
