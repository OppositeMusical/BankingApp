import { PageHeader } from "@/components/layout/page-header";
import { NoData } from "@/components/banking/no-data";
import { Explainer } from "@/components/banking/explainer";
import { TradeDesk } from "./trade-desk";
import { accountsApi, brokerageApi } from "@/lib/api";
import { showingSample } from "@/lib/api/sample";

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

  return (
    <>
      <PageHeader title="Invest" description="Paper trading, with real cash." />

      <TradeDesk
        account={account}
        holdings={holdings}
        orders={orders}
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
