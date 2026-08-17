import Link from "next/link";
import { Eye, Users } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { Badge } from "@/components/ui/badge";
import type { Account } from "@/lib/types/banking";

export const kindLabels: Record<Account["kind"], string> = {
  checking: "Checking",
  savings: "Savings",
  goal: "Goal",
  credit: "Credit",
};

export function AccountCard({ account }: { account: Account }) {
  return (
    <Link
      href={`/accounts/${account.id}`}
      className="group block rounded-3xl border border-white/5 bg-white/[0.02] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:bg-white/[0.04] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_12px_32px_rgba(0,0,0,0.6)]"
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

      <p className="mt-5 font-numbers text-2xl font-semibold text-ink">
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
export function VisibilityBadge({ account }: { account: Account }) {
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
