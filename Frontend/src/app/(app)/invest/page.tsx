import { PageHeader } from "@/components/layout/page-header";
import { NoData } from "@/components/banking/no-data";
import { Explainer } from "@/components/banking/explainer";
import { TradeDesk } from "./trade-desk";
import { accountsApi, brokerageApi } from "@/lib/api";
import { showingSample } from "@/lib/api/sample";
import { fetchQuotes } from "@/lib/market/quotes";

export const metadata = { title: "Invest" };

export default async function InvestPage() {
  if (showingSample()) {
    return (
      <>
        <PageHeader title="Invest" description="Paper trading, with real cash." />
        <NoData title="Trading needs the live API">
          Orders move real ledger money, so there is nothing to simulate with
          sample data. Switch to live to trade.
        </NoData>
      </>
    );
  }

  const [account, holdings, orders, accounts] = await Promise.all([
    brokerageApi.account(),
    brokerageApi.holdings(),
    brokerageApi.orders(),
    accountsApi.list(),
  ]);

  // Only what this account actually touched: what it holds, plus anything
  // ordered but not filled yet. No catalogue padding — a stock the account has
  // never touched belongs behind the search dialog, not on the page.
  const watchlist = [
    ...new Set([
      ...holdings.map((holding) => holding.symbol),
      ...orders.map((order) => order.symbol),
    ]),
  ].slice(0, 12);
  const quotes = watchlist.length > 0 ? await fetchQuotes(watchlist) : [];

  return (
    <>
      <PageHeader title="Invest" description="Paper trading, with real cash." />

      <TradeDesk
        account={account}
        holdings={holdings}
        orders={orders}
        quotes={quotes}
        fundingAccountId={accounts[0]?.parentAccountId ?? accounts[0]?.id ?? ""}
      />

      <Explainer label="Is this real money?">
        The shares are not — prices are simulated and no order reaches a real
        market. The cash is: a buy moves money out of your account through the
        same ledger as any other payment, and a sell moves it back. That is why
        a buy you cannot afford is declined rather than accepted.
      </Explainer>
    </>
  );
}
