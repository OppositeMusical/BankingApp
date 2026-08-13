import Link from "next/link";
import { ArrowRight, ArrowLeftRight, Snowflake } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { AccountCard } from "@/components/banking/account-card";
import { GoalCard } from "@/components/banking/goal-card";
import { StatTile } from "@/components/banking/stat-tile";
import { TransactionRow } from "@/components/banking/transaction-row";
import { Explainer } from "@/components/banking/explainer";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { accountsApi, authApi, cardsApi } from "@/lib/api";
// Goals, fees, and the monthly trend have no wire representation yet
// (docs/api-contract.md §6), so they still come from fixtures.
import { CardControls } from "../security/card-controls";
import { showingSample } from "@/lib/api/sample";
import { feeSummary, goals, monthlyTrend } from "@/lib/mock/data";
import { sumMoney } from "@/lib/format/money";

export default async function DashboardPage() {
  const [person, accounts, cards] = await Promise.all([
    authApi.me(),
    accountsApi.list(),
    cardsApi.list(),
  ]);
  const recent = await accountsApi.activity(accounts, 5);
  const accountNames = Object.fromEntries(
    accounts.map((account) => [account.id, account.name]),
  );

  const depositAccounts = accounts.filter((a) => a.kind !== "credit");
  const totalBalance = sumMoney(
    depositAccounts.map((a) => a.balance),
    "USD",
  );
  // Balances, accounts and activity are real. The month KPIs, the fee
  // breakdown and goals are fixtures with no endpoint behind them, so they are
  // hidden entirely in live mode rather than shown with invented figures.
  const sample = showingSample();
  const thisMonth = monthlyTrend[monthlyTrend.length - 1];
  const savedThisMonth = sumMoney(
    goals.map((g) => g.monthlyContribution ?? { amount: 0, currency: "USD" }),
    "USD",
  );

  return (
    <>
      {/* Hero: the one number the page leads with. */}
      <section className="mb-8">
        <p className="text-sm text-ink-muted">
          Good afternoon{person ? `, ${person.displayName}` : ""}
        </p>
        <p className="mt-2 font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          <Amount value={totalBalance} splitFraction />
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Across {depositAccounts.length} accounts. Use the eye icon to hide
          every balance at once.
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            href="/transfer"
            className="inline-flex h-11 items-center gap-2 rounded-field bg-accent px-5 text-sm font-medium text-accent-on shadow-card transition-colors hover:bg-accent-hover"
          >
            <ArrowLeftRight className="size-4" aria-hidden />
            Move money
          </Link>
          <Link
            href="/security"
            className="inline-flex h-11 items-center gap-2 rounded-field border border-border-strong bg-surface px-5 text-sm font-medium text-ink transition-colors hover:bg-surface-sunk"
          >
            <Snowflake className="size-4" aria-hidden />
            Freeze a card
          </Link>
        </div>
      </section>

      {/* KPI row — fixture-derived */}
      {sample && (
      <section aria-labelledby="month-heading" className="mb-8">
        <h2 id="month-heading" className="sr-only">
          This month at a glance
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Came in"
            value={thisMonth.earned}
            caption="August so far"
          />
          <StatTile
            label="Went out"
            value={thisMonth.spent}
            caption="August so far"
          />
          <StatTile
            label="Fees you paid"
            value={feeSummary.total}
            caption="Every fee, itemised"
          />
        </div>
      </section>
      )}

      {/* Fee transparency — fixture-derived */}
      {sample && (
      <Card className="mb-8">
        <CardHeader>
          <div>
            <CardTitle>You paid almost nothing in fees</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">
              <Amount value={feeSummary.total} /> this month. A typical account
              elsewhere would have charged about{" "}
              <Amount value={feeSummary.typicalElsewhere} />.
            </p>
          </div>
          <Badge tone="positive">Transparent</Badge>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-border border-t border-border">
            {feeSummary.items.map((item) => (
              <li key={item.label} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-ink">{item.label}</p>
                  <p className="text-sm">
                    <Amount value={item.amount} />
                  </p>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  {item.explanation}
                </p>
              </li>
            ))}
          </ul>
          <Explainer label="How do you make money if you don't charge me?">
            We earn from the difference between what we pay you in interest and
            what we earn lending deposits, plus a flat fee paid by merchants when
            you use your card. We never sell your transaction data, and we don&apos;t
            charge overdraft, monthly maintenance, or minimum-balance fees.
          </Explainer>
        </CardBody>
      </Card>
      )}

      {/* Accounts */}
      <section aria-labelledby="accounts-heading" className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="accounts-heading"
            className="font-display text-xl font-semibold text-ink"
          >
            Accounts
          </h2>
          <Link
            href="/accounts"
            className="inline-flex items-center gap-1 rounded-field text-sm font-medium text-accent hover:underline"
          >
            See all
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {accounts.slice(0, 2).map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      </section>

      {/* Goals — fixture-derived; goals cannot round-trip through the wire */}
      {sample && (
      <section aria-labelledby="goals-heading" className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="goals-heading"
            className="font-display text-xl font-semibold text-ink"
          >
            Goals
          </h2>
          <p className="text-sm text-ink-muted">
            <Amount value={savedThisMonth} compactWhole /> put aside each month
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.slice(0, 2).map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </section>
      )}

      {/* Cards — real in live mode; the same component Security uses, so
          freezing behaves identically in both places. */}
      {cards.length > 0 && (
        <section aria-labelledby="cards-heading" className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="cards-heading"
              className="font-display text-xl font-semibold text-ink"
            >
              Cards
            </h2>
            <Link
              href="/security"
              className="inline-flex items-center gap-1 rounded-field text-sm font-medium text-accent hover:underline"
            >
              Manage
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <CardControls cards={cards} accountNames={accountNames} />
        </section>
      )}

      {/* Recent activity */}
      <section aria-labelledby="activity-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="activity-heading"
            className="font-display text-xl font-semibold text-ink"
          >
            Recent activity
          </h2>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 rounded-field text-sm font-medium text-accent hover:underline"
          >
            See all
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <Card>
          <ul className="divide-y divide-border">
            {recent.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </ul>
        </Card>
      </section>
    </>
  );
}
