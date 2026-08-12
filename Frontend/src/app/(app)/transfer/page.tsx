import { PageHeader } from "@/components/layout/page-header";
import { TransferFlow } from "./transfer-flow";
import { accountsApi } from "@/lib/api";

export const metadata = { title: "Move money" };

export default async function TransferPage() {
  const accounts = await accountsApi.list();

  return (
    <>
      <PageHeader
        title="Move money"
        description="Between your own accounts, with a review step before anything happens."
      />
      <TransferFlow accounts={accounts} />
    </>
  );
}
