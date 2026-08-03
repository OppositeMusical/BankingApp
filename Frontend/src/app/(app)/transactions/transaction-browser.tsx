"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  TransactionRow,
  categoryLabels,
} from "@/components/banking/transaction-row";
import { Card, CardBody } from "@/components/ui/card";
import { NOW } from "@/lib/mock/data";
import { relativeDayLabel } from "@/lib/format/date";
import type { Transaction, TransactionCategory } from "@/lib/types/banking";
import { cn } from "@/lib/utils/cn";

type Filter = TransactionCategory | "all";

export function TransactionBrowser({
  transactions,
  accountNames,
}: {
  transactions: Transaction[];
  accountNames: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // Only offer filters for categories that actually occur in the data.
  const availableCategories = useMemo(() => {
    const present = new Set(transactions.map((t) => t.category));
    return (Object.keys(categoryLabels) as TransactionCategory[]).filter(
      (category) => present.has(category),
    );
  }, [transactions]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesFilter =
        filter === "all" || transaction.category === filter;
      const matchesQuery =
        needle.length === 0 ||
        transaction.merchant.toLowerCase().includes(needle) ||
        transaction.note?.toLowerCase().includes(needle);
      return matchesFilter && matchesQuery;
    });
  }, [transactions, query, filter]);

  // Group into day sections so the list reads as a timeline.
  const grouped = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const transaction of visible) {
      const label = relativeDayLabel(transaction.occurredAt, NOW);
      const existing = groups.get(label);
      if (existing) existing.push(transaction);
      else groups.set(label, [transaction]);
    }
    return [...groups.entries()];
  }, [visible]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or note"
            aria-label="Search activity"
            className="h-11 w-full rounded-field border border-border-strong bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-subtle"
          />
        </div>

        {/* Filters sit in a single row above the list. */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div
            role="group"
            aria-label="Filter by category"
            className="flex w-max gap-2 pb-1"
          >
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All
            </FilterChip>
            {availableCategories.map((category) => (
              <FilterChip
                key={category}
                active={filter === category}
                onClick={() => setFilter(category)}
              >
                {categoryLabels[category]}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {visible.length} transactions shown
      </p>

      {grouped.length === 0 ? (
        <Card>
          <CardBody className="pt-5 text-center">
            <p className="text-sm font-medium text-ink">Nothing matches yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              Try a different search term, or clear the category filter.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map(([label, items]) => (
            <section key={label} aria-label={label}>
              <h2 className="mb-2 px-1 text-xs font-medium tracking-wide text-ink-subtle uppercase">
                {label}
              </h2>
              <Card>
                <ul className="divide-y divide-border">
                  {items.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      showAccount={accountNames[transaction.accountId]}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 shrink-0 rounded-pill border px-3.5 text-sm font-medium transition-colors duration-150",
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
