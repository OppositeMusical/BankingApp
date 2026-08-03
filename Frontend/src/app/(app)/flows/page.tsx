import Link from "next/link";
import { Plus } from "lucide-react";
import { FlowsGrid } from "./flows-grid";
import { PageHeader } from "@/components/layout/page-header";
import { Explainer } from "@/components/banking/explainer";
import { flows } from "@/lib/mock/flows";

export const metadata = { title: "Flows" };

export default function FlowsPage() {
  return (
    <>
      <PageHeader
        title="Flows"
        description="Where your money goes before you can spend it."
        action={
          <Link
            href="/flows/new"
            className="inline-flex h-11 items-center gap-2 rounded-field bg-accent px-5 text-sm font-medium text-accent-on shadow-card transition-colors hover:bg-accent-hover"
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
