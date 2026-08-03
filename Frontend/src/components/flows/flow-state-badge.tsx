import { CircleAlert, CirclePause, CircleCheck, PencilLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FlowState } from "@/lib/types/flows";

const states = {
  active: { tone: "positive" as const, icon: CircleCheck, label: "Active" },
  paused: { tone: "neutral" as const, icon: CirclePause, label: "Paused" },
  "needs-attention": {
    tone: "alert" as const,
    icon: CircleAlert,
    label: "Needs a moment",
  },
  draft: { tone: "neutral" as const, icon: PencilLine, label: "Draft" },
};

/** State always carries an icon and a word — never colour alone. */
export function FlowStateBadge({ state }: { state: FlowState }) {
  const { tone, icon: Icon, label } = states[state];
  return (
    <Badge tone={tone}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}
