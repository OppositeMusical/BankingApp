import {
  GraduationCap,
  HeartHandshake,
  House,
  PauseCircle,
  Plane,
  ShieldCheck,
  Target,
} from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { Meter } from "@/components/ui/meter";
import { formatMoney, percentOf } from "@/lib/format/money";
import { formatMonthKey } from "@/lib/format/date";
import type { Goal, GoalKind } from "@/lib/types/banking";

const goalIcons: Record<GoalKind, typeof Target> = {
  emergency: ShieldCheck,
  "career-break": PauseCircle,
  caregiving: HeartHandshake,
  home: House,
  education: GraduationCap,
  travel: Plane,
  custom: Target,
};

export function GoalCard({ goal }: { goal: Goal }) {
  const Icon = goalIcons[goal.kind];
  const percent = percentOf(goal.saved, goal.target);
  const remaining = {
    amount: Math.max(0, goal.target.amount - goal.saved.amount),
    currency: goal.target.currency,
  };

  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-pill bg-accent-soft text-accent"
          aria-hidden
        >
          <Icon className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">{goal.name}</p>
          {goal.note && (
            <p className="mt-0.5 text-xs text-ink-muted">{goal.note}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <p className="font-display text-xl font-semibold text-ink">
          <Amount value={goal.saved} compactWhole />
        </p>
        <p className="text-xs text-ink-muted">
          of <Amount value={goal.target} compactWhole /> ·{" "}
          <span className="font-medium text-ink">{Math.round(percent)}%</span>
        </p>
      </div>

      <Meter
        className="mt-2.5"
        value={percent}
        label={`${goal.name}: ${formatMoney(goal.saved)} saved of ${formatMoney(goal.target)}`}
      />

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3.5 text-xs">
        <div>
          <dt className="text-ink-subtle">Still to save</dt>
          <dd className="mt-0.5 font-medium text-ink">
            <Amount value={remaining} compactWhole />
          </dd>
        </div>
        <div>
          <dt className="text-ink-subtle">
            {goal.targetDate ? "Target" : "Each month"}
          </dt>
          <dd className="mt-0.5 font-medium text-ink">
            {goal.targetDate ? (
              formatMonthKey(goal.targetDate.slice(0, 7))
            ) : goal.monthlyContribution ? (
              <Amount value={goal.monthlyContribution} compactWhole />
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
