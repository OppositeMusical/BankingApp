import { PageHeader } from "@/components/layout/page-header";
import { TransferFlow } from "./transfer-flow";
import { accounts } from "@/lib/mock/data";

export const metadata = { title: "Move money" };

export default function TransferPage() {
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
