import { PageHeader } from "@/components/layout/page-header";
import { CategoryBars } from "@/components/charts/category-bars";
import { TrendChart } from "@/components/charts/trend-chart";
import { Explainer } from "@/components/banking/explainer";
import { Amount } from "@/components/banking/amount";
import { StatTile } from "@/components/banking/stat-tile";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { NoData } from "@/components/banking/no-data";
import { showingSample } from "@/lib/api/sample";
import { feeSummary, monthlyTrend, spendingByCategory } from "@/lib/mock/data";
import { sumMoney } from "@/lib/format/money";

export const metadata = { title: "Insights" };

export default function InsightsPage() {
  // Every figure here comes from fixtures — spending slices, the six-month
  // trend, the fee comparison. None of it has an endpoint, so in live mode
  // there is nothing to compute from and nothing honest to show.
  if (!showingSample()) {
    return (
      <>
        <PageHeader
          title="Insights"
          description="Where your money went, in plain numbers."
        />
        <NoData title="No spending data yet">
          Insights are built from categorised transactions, spending totals and
          a fee comparison — none of which the banking service publishes yet.
          Switch to sample data to see the finished screen.
        </NoData>
      </>
    );
  }

  const thisMonth = monthlyTrend[monthlyTrend.length - 1];
  const totalSpent = sumMoney(
    spendingByCategory.map((slice) => slice.total),
    "USD",
  );
  const kept = {
    amount: thisMonth.earned.amount - thisMonth.spent.amount,
    currency: "USD",
  };
  const savedVsElsewhere = {
    amount: feeSummary.typicalElsewhere.amount - feeSummary.total.amount,
    currency: "USD",
  };

  return (
    <>
      <PageHeader
        title="Insights"
        description="Where your money went, in plain numbers."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatTile label="Kept this month" value={kept} caption="In minus out" />
        <StatTile
          label="Spent"
          value={totalSpent}
          caption="Across all categories"
        />
        <StatTile
          label="Saved on fees"
          value={savedVsElsewhere}
          caption="Versus a typical account"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div>
            <CardTitle>Money in and out</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">
              Last six months, same scale.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <TrendChart data={monthlyTrend} />
          <Explainer label="Why does June look different?">
            June included a second invoice payment from Northwind Design Studio.
            Freelance and contract income is often lumpy, so a single high month
            usually isn&apos;t a trend — we compare against your six-month median
            rather than the previous month.
          </Explainer>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div>
            <CardTitle>Where it went this month</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">
              Sorted by size. <Amount value={totalSpent} compactWhole /> total.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <CategoryBars data={spendingByCategory} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Fees, itemised</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">
              Every charge, with the reason for it.
            </p>
          </div>
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
                <p className="mt-1 text-xs text-ink-muted">{item.explanation}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-muted">
            We don&apos;t charge overdraft, monthly maintenance, minimum-balance, or
            inactivity fees. If a fee ever appears here, it will say why.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
