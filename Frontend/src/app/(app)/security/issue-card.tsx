"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cardsApi, describeError } from "@/lib/api";

/**
 * Issue a virtual card.
 *
 * No form: the only thing the API needs is which account it spends from, and
 * there is one. A dialog asking for a nickname the wire cannot store would be
 * theatre.
 */
export function IssueCard({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issue = async () => {
    setBusy(true);
    setError(null);
    try {
      await cardsApi.issue(accountId);
      router.refresh();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <Button variant="secondary" size="sm" onClick={issue} disabled={busy}>
        <Plus className="size-3.5" aria-hidden />
        {busy ? "Issuing…" : "Issue a virtual card"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-alert">
          {error}
        </p>
      )}
    </div>
  );
}
