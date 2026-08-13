import { PageHeader } from "@/components/layout/page-header";
import { CardControls } from "./card-controls";
import { IssueCard } from "./issue-card";
import { SessionList } from "./session-list";
import { Explainer } from "@/components/banking/explainer";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { NoData } from "@/components/banking/no-data";
import { accountsApi, cardsApi } from "@/lib/api";
import { showingSample } from "@/lib/api/sample";
import { sessions } from "@/lib/mock/data";

export const metadata = { title: "Security" };

export default async function SecurityPage() {
  // /cards is unimplemented and sessions have no endpoint at all, so in live
  // mode both lists would be invented. The trusted-contact panel below is
  // static copy and stays either way.
  const sample = showingSample();
  // /cards is served now, so cards are real in live mode. Sessions still have
  // no endpoint at all.
  const [cards, accounts] = await Promise.all([
    cardsApi.list(),
    accountsApi.list(),
  ]);
  // Cards are issued against the container account, not a pot.
  const cardAccountId =
    accounts[0]?.parentAccountId ?? accounts[0]?.id ?? "";
  const accountNames = Object.fromEntries(
    accounts.map((account) => [account.id, account.name]),
  );

  return (
    <>
      <PageHeader
        title="Security"
        description="Freeze a card, see every device signed in, and decide who can reach your account."
      />

      <section className="mb-6">
        <h2 className="mb-3 font-display text-xl font-semibold text-ink">
          Cards
        </h2>
        {cards.length > 0 ? (
          <CardControls cards={cards} accountNames={accountNames} />
        ) : (
          <NoData title="No cards yet">
            No cards have been issued on this account.
          </NoData>
        )}
        {!sample && cardAccountId && <IssueCard accountId={cardAccountId} />}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-xl font-semibold text-ink">
          Where you&apos;re signed in
        </h2>
        {sample ? (
          <SessionList sessions={sessions} />
        ) : (
          <NoData title="No session data yet">
            The banking service doesn&apos;t publish signed-in devices yet.
          </NoData>
        )}
      </section>

      <Card className="mb-6">
        <CardHeader>
          <div>
            <CardTitle>Trusted contact</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">
              Someone we can contact if we think your account is at risk and we
              can&apos;t reach you.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-ink-muted">
            You haven&apos;t named one yet.
          </p>
          <Button variant="secondary" size="sm" className="mt-3">
            Add a trusted contact
          </Button>
          <Explainer label="What can a trusted contact see or do?">
            Nothing. They cannot see your balance, your transactions, or your
            personal details, and they cannot move money or make changes. We
            contact them only to confirm we should pause activity on your
            account. You can remove them at any time, and they are never told
            they were removed.
          </Explainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Leaving safely</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">
              If someone else has access to your money and you need that to stop.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-ink-muted">
            You can open a new sole account, move your direct deposit, and remove
            shared access without the other person being notified in advance. Our
            support team can walk through it with you, and the conversation
            won&apos;t appear in any shared statement.
          </p>
          <Button variant="secondary" size="sm" className="mt-3">
            Start a private conversation
          </Button>
        </CardBody>
      </Card>
    </>
  );
}
