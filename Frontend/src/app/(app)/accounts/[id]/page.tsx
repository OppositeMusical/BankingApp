import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { TransactionRow } from "@/components/banking/transaction-row";
import { Explainer } from "@/components/banking/explainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { accounts, transactions } from "@/lib/mock/data";

export function generateStaticParams() {
  return accounts.map((account) => ({ id: account.id }));
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = accounts.find((candidate) => candidate.id === id);
  if (!account) notFound();

  const accountTransactions = transactions.filter(
    (transaction) => transaction.accountId === account.id,
  );

  return (
    <>
      <Link
        href="/accounts"
        className="mb-5 inline-flex items-center gap-1.5 rounded-field text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All accounts
      </Link>

      <div className="mb-7">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {account.name}
        </h1>
        <p className="mt-0.5 text-sm text-ink-subtle">···· {account.last4}</p>
        <p className="mt-4 font-display text-4xl font-semibold text-ink">
          <Amount value={account.balance} splitFraction />
        </p>
        <p className="mt-1.5 text-sm text-ink-muted">
          <Amount value={account.available} /> available to spend now
        </p>
      </div>

      {/* Who can see this account — a first-class panel, not a settings page. */}
      <Card className="mb-6">
        <CardHeader>
          <div>
            <CardTitle>Who can see this account</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">
              {account.sharedWith.length === 0
                ? "Only you. No one else can see this balance or its activity."
                : `You, plus ${account.sharedWith.length} other person.`}
            </p>
          </div>
          <ShieldCheck className="size-5 shrink-0 text-accent" aria-hidden />
        </CardHeader>
        <CardBody>
          {account.sharedWith.length > 0 && (
            <ul className="divide-y divide-border border-t border-border">
              {account.sharedWith.map((share) => (
                <li
                  key={share.personId}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-9 place-items-center rounded-pill bg-surface-sunk text-sm font-medium text-ink-muted"
                      aria-hidden
                    >
                      {share.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {share.name}
                      </p>
                      <p className="text-xs text-ink-subtle">
                        Can view and spend
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Change access
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Explainer label="Can they see my other accounts?">
            No. Access is granted one account at a time. Someone with access to
            this account cannot see your other balances, your goals, or any
            activity outside this account — and they are not notified about
            anything that happens elsewhere.
          </Explainer>
        </CardBody>
      </Card>

      <section aria-labelledby="account-activity">
        <h2
          id="account-activity"
          className="mb-3 font-display text-xl font-semibold text-ink"
        >
          Activity
        </h2>
        <Card>
          {accountTransactions.length > 0 ? (
            <ul className="divide-y divide-border">
              {accountTransactions.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))}
            </ul>
          ) : (
            <CardBody className="pt-5 text-center">
              <p className="text-sm text-ink-muted">
                Nothing here yet. Activity will appear as soon as money moves.
              </p>
            </CardBody>
          )}
        </Card>
      </section>

      {account.visibility === "joint" && (
        <p className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
          <Badge tone="accent">Shared account</Badge>
          Every transaction shows who made it.
        </p>
      )}
    </>
  );
}
