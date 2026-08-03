import {
  Baby,
  BookOpen,
  Bus,
  CircleDollarSign,
  Heart,
  House,
  PiggyBank,
  Receipt,
  ShoppingBasket,
  Sparkles,
  Tag,
} from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { Badge } from "@/components/ui/badge";
import { Explainer } from "@/components/banking/explainer";
import { formatTime } from "@/lib/format/date";
import type { Transaction, TransactionCategory } from "@/lib/types/banking";

const categoryIcons: Record<TransactionCategory, typeof Tag> = {
  income: CircleDollarSign,
  housing: House,
  groceries: ShoppingBasket,
  transport: Bus,
  health: Heart,
  childcare: Baby,
  education: BookOpen,
  personal: Sparkles,
  savings: PiggyBank,
  fees: Receipt,
  other: Tag,
};

export const categoryLabels: Record<TransactionCategory, string> = {
  income: "Income",
  housing: "Home",
  groceries: "Groceries",
  transport: "Transport",
  health: "Health",
  childcare: "Childcare",
  education: "Learning",
  personal: "Personal",
  savings: "Savings",
  fees: "Fees",
  other: "Other",
};

export function TransactionRow({
  transaction,
  showAccount,
}: {
  transaction: Transaction;
  showAccount?: string;
}) {
  const Icon = categoryIcons[transaction.category];
  const isCredit = transaction.amount.amount > 0;

  return (
    <li className="flex items-start gap-3.5 px-5 py-3.5">
      <span
        className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-pill bg-surface-sunk text-ink-muted"
        aria-hidden
      >
        <Icon className="size-[18px]" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate font-medium text-ink">{transaction.merchant}</p>
          <p className="shrink-0 text-sm font-medium">
            <Amount
              value={transaction.amount}
              tone={isCredit ? "auto" : "plain"}
              signed
            />
          </p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-subtle">
          <span>{categoryLabels[transaction.category]}</span>
          <span aria-hidden>·</span>
          <span>{formatTime(transaction.occurredAt)}</span>
          {showAccount && (
            <>
              <span aria-hidden>·</span>
              <span>{showAccount}</span>
            </>
          )}
          {transaction.status === "pending" && (
            <Badge tone="neutral" className="ml-0.5">
              Pending
            </Badge>
          )}
          {/* On a joint account, every charge says who made it. */}
          {transaction.initiatedBy && (
            <Badge tone="accent" className="ml-0.5">
              {transaction.initiatedBy}
            </Badge>
          )}
        </div>

        {transaction.note && (
          <p className="mt-1.5 text-xs text-ink-muted italic">
            {transaction.note}
          </p>
        )}

        {transaction.feeExplanation && (
          <Explainer label="Why was I charged this?">
            {transaction.feeExplanation}
          </Explainer>
        )}
      </div>
    </li>
  );
}
