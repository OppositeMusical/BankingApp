import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FlowBuilder } from "./flow-builder";
import { accountsApi } from "@/lib/api";

export const metadata = { title: "New flow" };

export default async function NewFlowPage() {
  // Real destinations. The builder used fixtures, which meant it offered
  // nothing at all in live mode.
  const accounts = await accountsApi.list();

  return (
    <>
      <Link
        href="/flows"
        className="mb-5 inline-flex items-center gap-1.5 rounded-field text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All flows
      </Link>
      <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight text-ink">
        Build a flow
      </h1>
      <FlowBuilder accounts={accounts} />
    </>
  );
}
