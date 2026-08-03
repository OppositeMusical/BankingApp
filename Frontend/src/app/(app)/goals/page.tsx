import { Plus } from "lucide-react";
import { GoalCard } from "@/components/banking/goal-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { CareerPausePlanner } from "./career-pause-planner";
import { careerPause, goals } from "@/lib/mock/data";
import { sumMoney } from "@/lib/format/money";
import { Amount } from "@/components/banking/amount";

export const metadata = { title: "Goals" };

export default function GoalsPage() {
  const totalSaved = sumMoney(
    goals.map((goal) => goal.saved),
    "USD",
  );

  return (
    <>
      <PageHeader
        title="Goals"
        description="Money set aside for the things you're actually planning for."
        action={
          <Button size="md">
            <Plus className="size-4" aria-hidden />
            New goal
          </Button>
        }
      />

      <p className="mb-5 text-sm text-ink-muted">
        <span className="font-display text-2xl font-semibold text-ink">
          <Amount value={totalSaved} compactWhole />
        </span>{" "}
        saved across {goals.length} goals.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      <section aria-labelledby="career-pause" className="mt-10">
        <h2
          id="career-pause"
          className="font-display text-xl font-semibold text-ink"
        >
          Planning a career break
        </h2>
        <p className="mt-1.5 mb-4 max-w-prose text-sm text-ink-muted">
          Time out for caregiving, retraining, or recovery costs more than the
          salary you don&apos;t earn — it also pauses retirement contributions and
          the compounding on them. Most planning tools ignore that. This one
          doesn&apos;t.
        </p>
        <CareerPausePlanner projection={careerPause} />
      </section>
    </>
  );
}
