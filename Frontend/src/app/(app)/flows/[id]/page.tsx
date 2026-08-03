import { FlowDetail } from "./flow-detail";
import { flows } from "@/lib/mock/flows";

/** Example flows are prerendered; user-built ones resolve on the client. */
export function generateStaticParams() {
  return flows.map((flow) => ({ id: flow.id }));
}

export default async function FlowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exampleFlow = flows.find((candidate) => candidate.id === id) ?? null;

  return <FlowDetail id={id} exampleFlow={exampleFlow} />;
}
