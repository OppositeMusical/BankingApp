import { PageHeader } from "@/components/layout/page-header";
import { TransactionBrowser } from "./transaction-browser";
import { accountsApi } from "@/lib/api";

export const metadata = { title: "Activity" };

export default async function TransactionsPage() {
  const accounts = await accountsApi.list();
  const transactions = await accountsApi.activity(accounts, 100);

  const accountNames = Object.fromEntries(
    accounts.map((account) => [account.id, account.name]),
  );

  return (
    <>
      <PageHeader
        title="Activity"
        description="Search, filter, and see exactly what each charge was."
      />
      <TransactionBrowser
        transactions={transactions}
        accountNames={accountNames}
      />
    </>
  );
}
