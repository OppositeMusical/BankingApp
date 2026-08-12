import { AccountCarousel } from "@/components/banking/account-carousel";
import { PageHeader } from "@/components/layout/page-header";
import { Explainer } from "@/components/banking/explainer";
import { Card, CardBody } from "@/components/ui/card";
import { accountsApi } from "@/lib/api";

export const metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const accounts = await accountsApi.list();

  return (
    <>
      <PageHeader
        title="Accounts"
        description="Every account, and exactly who else can see it."
      />

      <AccountCarousel accounts={accounts} />

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
