import { AccountCarousel } from "@/components/banking/account-carousel";
import { LinkedAccounts } from "./linked-accounts";
import { NewSubAccount } from "./new-sub-account";
import { PageHeader } from "@/components/layout/page-header";
import { Explainer } from "@/components/banking/explainer";
import { Card, CardBody } from "@/components/ui/card";
import { accountsApi, linkedApi } from "@/lib/api";

export const metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const [accounts, linked] = await Promise.all([
    accountsApi.list(),
    linkedApi.list(),
  ]);

  // The real Column accounts, and the sub-accounts that divide them. Siblings
  // in the ledger, so they are shown as two sections rather than one list.
  const bankAccounts = accounts.filter((account) => account.isBankAccount);
  const subAccounts = accounts.filter((account) => !account.isBankAccount);

  return (
    <>
      <PageHeader
        title="Accounts"
        description="Every account, and exactly who else can see it."
      />

      {bankAccounts.length > 0 && (
        <section aria-labelledby="bank-heading" className="mb-8">
          <h2
            id="bank-heading"
            className="mb-1 font-display text-xl font-semibold text-ink"
          >
            Your bank account
          </h2>
          <p className="mb-3 max-w-prose text-sm text-ink-muted">
            Held at Column. This is the account number money arrives at — the
            balance here is whatever you haven&apos;t set aside yet.
          </p>
          <AccountCarousel accounts={bankAccounts} />
        </section>
      )}

      {bankAccounts.length > 0 && (
        <section aria-labelledby="pots-heading" className="mb-8">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="pots-heading"
              className="font-display text-xl font-semibold text-ink"
            >
              Set aside
            </h2>
            <NewSubAccount bankAccounts={bankAccounts} />
          </div>
          <p className="mb-3 max-w-prose text-sm text-ink-muted">
            Divisions of the account above. Each keeps its own balance and can
            hold its own card, but they share one account number.
          </p>
          {subAccounts.length > 0 ? (
            <AccountCarousel accounts={subAccounts} />
          ) : (
            <p className="text-sm text-ink-muted">
              None yet. Opening one gives a name and a balance to a slice of the
              account above.
            </p>
          )}
        </section>
      )}

      <LinkedAccounts accounts={linked} />

      <Card className="mt-6">
        <CardBody className="pt-5">
          <h2 className="text-base font-semibold text-ink">
            Shared access, in plain terms
          </h2>
          <p className="mt-1.5 text-sm text-ink-muted">
            &ldquo;Only you&rdquo; means no one else can see the balance or the
            activity — not even someone named on another account with us.
          </p>
          <Explainer label="What can someone on a shared account actually do?">
            Access comes in three levels. <strong>View</strong> can see the
            balance and transactions but cannot move money.{" "}
            <strong>Spend</strong> can also make payments from the account.{" "}
            <strong>Manage</strong> can additionally change who else has access.
            You can lower or remove someone&apos;s access at any time, on your own,
            without their approval and without them being able to reverse it.
          </Explainer>
        </CardBody>
      </Card>
    </>
  );
}
