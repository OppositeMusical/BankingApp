import { FlowDetail } from "./flow-detail";
import { flowsApi } from "@/lib/api";

// No generateStaticParams: it enumerated fixture ids, which prerenders pages
// for flows that do not exist against a live backend — and the parent layout
// is force-dynamic regardless, since this is authenticated per-user data.

export default async function FlowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exampleFlow = (await flowsApi.get(id)) ?? null;

  return <FlowDetail id={id} exampleFlow={exampleFlow} />;
}
