import Link from "next/link";
import { Eye, Users } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { Badge } from "@/components/ui/badge";
import type { Account } from "@/lib/types/banking";

const kindLabels: Record<Account["kind"], string> = {
  checking: "Checking",
  savings: "Savings",
  goal: "Goal",
  credit: "Credit",
};

export function AccountCard({ account }: { account: Account }) {
  return (
    <Link
      href={`/accounts/${account.id}`}
      className="group block rounded-card border border-border bg-surface p-5 shadow-card transition-colors duration-150 hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{account.name}</p>
          <p className="mt-0.5 text-xs text-ink-subtle">
            {kindLabels[account.kind]} ···· {account.last4}
          </p>
        </div>
        <VisibilityBadge account={account} />
      </div>

      <p className="mt-5 font-display text-2xl font-semibold text-ink">
        <Amount value={account.balance} />
      </p>

      {account.available.amount !== account.balance.amount && (
        <p className="mt-1 text-xs text-ink-muted">
          <Amount value={account.available} /> available now
        </p>
      )}

      {account.interestRateBps !== undefined && (
        <p className="mt-1 text-xs text-positive">
          {(account.interestRateBps / 100).toFixed(2)}% interest, paid monthly
        </p>
      )}
    </Link>
  );
}

/**
 * Who can see this account, stated on the account itself. Shared visibility is
 * something you should never have to go looking for.
 */
function VisibilityBadge({ account }: { account: Account }) {
  if (account.visibility === "joint" && account.sharedWith.length > 0) {
    return (
      <Badge tone="accent">
        <Users className="size-3" aria-hidden />
        Shared with {account.sharedWith.length}
      </Badge>
    );
  }
  if (account.visibility === "viewable") {
    return (
      <Badge tone="neutral">
        <Eye className="size-3" aria-hidden />
        Visible to others
      </Badge>
    );
  }
  return <Badge tone="neutral">Only you</Badge>;
}
