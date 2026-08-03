import { PageHeader } from "@/components/layout/page-header";
import { TransactionBrowser } from "./transaction-browser";
import { accounts, transactions } from "@/lib/mock/data";

export const metadata = { title: "Activity" };

export default function TransactionsPage() {
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
