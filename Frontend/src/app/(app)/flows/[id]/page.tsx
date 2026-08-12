import { FlowDetail } from "./flow-detail";
import { flowsApi } from "@/lib/api";
import { flows } from "@/lib/mock/flows";

/**
 * Example flows are prerendered; user-built ones resolve on the client. The
 * params come straight from fixtures because build-time prerendering is
 * exactly the case where no backend is reachable.
 */
export function generateStaticParams() {
  return flows.map((flow) => ({ id: flow.id }));
}

export default async function FlowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exampleFlow = (await flowsApi.get(id)) ?? null;

  return <FlowDetail id={id} exampleFlow={exampleFlow} />;
}
