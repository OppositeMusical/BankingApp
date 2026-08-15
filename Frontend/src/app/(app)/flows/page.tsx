import Link from "next/link";
import { Plus } from "lucide-react";
import { FlowsGrid } from "./flows-grid";
import { PageHeader } from "@/components/layout/page-header";
import { Explainer } from "@/components/banking/explainer";
import { flowsApi } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Flows" };

export default async function FlowsPage() {
  const flows = await flowsApi.list();

  return (
    <>
      <PageHeader
        title="Flows"
        description="Where your money goes before you can spend it."
        action={
          <Link
            href="/flows/new"
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            <Plus className="size-4" aria-hidden />
            New flow
          </Link>
        }
      />

      <FlowsGrid exampleFlows={flows} />

      <Explainer label="How does a flow decide what to do?">
        When a deposit from one of your sources clears, the flow that matches it
        splits it by the shares you set. Percentages mean it works the same
        whether the deposit is large or small — a lean month needs no
        re-planning. One deposit is only ever handled by one flow, and money from
        a payer no flow matches simply stays where it landed.
      </Explainer>
    </>
  );
}
