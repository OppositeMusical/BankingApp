"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CircleAlert, ListTree, Users, Workflow } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { FlowCanvas } from "@/components/flows/flow-canvas";
import { FlowDiagram } from "@/components/flows/flow-diagram";
import { FlowStateBadge } from "@/components/flows/flow-state-badge";
import { Explainer } from "@/components/banking/explainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import {
  describeCadence,
  resolveDestination,
  sharedViewers,
} from "@/lib/flows/destinations";
import { formatFullDate } from "@/lib/format/date";
import { flowRuns } from "@/lib/mock/flows";
import { deleteUserFlow, useUserFlows } from "@/lib/store/user-flows";
import type { Flow } from "@/lib/types/flows";
import { cn } from "@/lib/utils/cn";

export function FlowDetail({
  id,
  exampleFlow,
}: {
  id: string;
  /** Present when the id belongs to one of the shipped examples. */
  exampleFlow: Flow | null;
}) {
  const userFlows = useUserFlows();
  const [view, setView] = useState<"diagram" | "list">("diagram");

  const flow = exampleFlow ?? userFlows.find((candidate) => candidate.id === id);

  if (!flow) {
    return (
      <>
        <BackLink />
        <Card>
          <CardBody className="pt-5">
            <p className="text-sm font-medium text-ink">
              We couldn&apos;t find that flow
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              It may have been deleted, or the link may be out of date.
            </p>
          </CardBody>
        </Card>
      </>
    );
  }

  const runs = flowRuns
    .filter((run) => run.flowId === flow.id)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const viewers = sharedViewers(flow.splits.map((split) => split.destination));
  const isUserFlow = !exampleFlow;

  return (
    <>
      <BackLink />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-hand text-4xl leading-tight text-ink">
            {flow.name}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Watching {flow.source.displayName} ·{" "}
            {describeCadence(flow.source.cadence)}
          </p>
        </div>
        <FlowStateBadge state={flow.state} />
      </div>

      {flow.state === "needs-attention" && flow.attentionReason && (
        <Card className="mb-6 border-alert/40">
          <CardBody className="pt-5">
            <p className="flex items-start gap-2 text-sm text-ink">
              <CircleAlert
                className="mt-0.5 size-4 shrink-0 text-alert"
                aria-hidden
              />
              {flow.attentionReason}
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <Button size="sm">Fix this</Button>
              <Button variant="secondary" size="sm">
                Pause for now
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="mb-6">
        <CardBody className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">The split</h2>

            <div className="flex items-center gap-3">
              {flow.source.typicalAmount && (
                <p className="text-sm text-ink-muted">
                  Of a typical{" "}
                  <Amount value={flow.source.typicalAmount} compactWhole />
                </p>
              )}
              <div
                role="group"
                aria-label="How to show the split"
                className="inline-flex rounded-pill border border-border p-0.5"
              >
                {(["diagram", "list"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setView(option)}
                    aria-pressed={view === option}
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-pill transition-colors",
                      view === option
                        ? "bg-accent-soft text-accent"
                        : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {option === "diagram" ? (
                      <Workflow className="size-4" aria-hidden />
                    ) : (
                      <ListTree className="size-4" aria-hidden />
                    )}
                    <span className="sr-only">
                      {option === "diagram" ? "Show diagram" : "Show list"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {flow.setAsides.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                Taken off the top first
              </p>
              <ul className="mt-2 divide-y divide-border border-y border-border">
                {flow.setAsides.map((setAside) => (
                  <li
                    key={setAside.id}
                    className="flex items-baseline justify-between gap-3 py-2.5"
                  >
                    <span className="text-sm text-ink">
                      {setAside.label}
                      <span className="ml-2 text-xs text-ink-subtle">
                        {resolveDestination(setAside.destination).label}
                      </span>
                    </span>
                    <span className="text-sm font-medium tabular text-ink">
                      <Amount value={setAside.amount} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            {view === "diagram" && flow.source.typicalAmount ? (
              <FlowCanvas
                readOnly
                splits={flow.splits}
                onChange={() => {}}
                typicalAmount={flow.source.typicalAmount}
                sourceName={flow.source.displayName}
                sourceCadence={describeCadence(flow.source.cadence)}
              />
            ) : (
              <FlowDiagram
                splits={flow.splits}
                typicalAmount={flow.source.typicalAmount}
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5 border-t border-border pt-4">
            <Button variant="secondary" size="sm">
              Edit shares
            </Button>
            {isUserFlow && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  deleteUserFlow(flow.id);
                  window.location.href = "/flows";
                }}
              >
                Delete flow
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {viewers.length > 0 && (
        <p className="mb-6 flex items-start gap-2 rounded-card border border-accent/25 bg-accent-soft/40 px-4 py-3 text-sm text-ink">
          <Users className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <span>
            {viewers.join(" and ")} can see money that arrives in a shared
            account. They are not told this flow exists.
          </span>
        </p>
      )}

      {/* Run history — pasted-in receipts. This is where the feature earns
          trust: a visible record that it did what it said. */}
      <section aria-labelledby="run-history">
        <h2
          id="run-history"
          className="mb-3 font-display text-xl font-semibold text-ink"
        >
          What actually happened
        </h2>

        {runs.length === 0 ? (
          <Card>
            <CardBody className="pt-5">
              <p className="text-sm text-ink-muted">
                Nothing yet. The first time {flow.source.displayName} pays you,
                you&apos;ll see exactly where every cent went.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grain relative flex flex-col gap-5">
            {runs.map((run, index) => (
              <article
                key={run.id}
                className={`paper relative p-5 ${index % 2 === 0 ? "tilt-b" : "tilt-a"}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-ink">
                    {formatFullDate(run.occurredAt)}
                  </p>
                  <p className="font-display text-lg font-semibold text-ink">
                    <Amount value={run.depositAmount} />
                  </p>
                </div>

                <ul className="mt-3 divide-y divide-paper-edge border-t border-paper-edge">
                  {run.lines.map((line) => {
                    const destination = resolveDestination(line.destination);
                    return (
                      <li key={line.splitId} className="py-2.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="flex items-center gap-1.5 text-sm text-ink">
                            {destination.label}
                            {line.status !== "sent" && (
                              <Badge
                                tone={
                                  line.status === "redirected"
                                    ? "accent"
                                    : "neutral"
                                }
                              >
                                {line.status === "redirected"
                                  ? "Redirected"
                                  : "Skipped"}
                              </Badge>
                            )}
                          </span>
                          <span className="shrink-0 text-sm tabular text-ink">
                            <Amount value={line.amount} />
                          </span>
                        </div>
                        {line.note && (
                          <p className="mt-1 text-xs text-ink-muted">
                            {line.note}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
          </div>
        )}

        <Explainer label="Why don't the percentages always give round numbers?">
          Percentages of a real deposit rarely divide into whole cents. Each
          share is rounded down, and the few cents left over go to the
          destination marked &ldquo;the rest&rdquo; — so every split adds up to
          exactly what arrived, with nothing invented and nothing lost.
        </Explainer>
      </section>
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/flows"
      className="mb-5 inline-flex items-center gap-1.5 rounded-field text-sm font-medium text-ink-muted hover:text-ink"
    >
      <ArrowLeft className="size-4" aria-hidden />
      All flows
    </Link>
  );
}
