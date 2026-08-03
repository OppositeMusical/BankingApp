"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Pause, Play } from "lucide-react";
import { FlowDiagram } from "./flow-diagram";
import { FlowStateBadge } from "./flow-state-badge";
import { Amount } from "@/components/banking/amount";
import { describeCadence } from "@/lib/flows/destinations";
import type { Flow, FlowState } from "@/lib/types/flows";
import { cn } from "@/lib/utils/cn";

/**
 * A Flow as a taped-down clipping.
 *
 * Only the card wrapper is tilted, and only by ~1deg — the links and buttons
 * inside stay square, so hit targets and focus rings are unaffected.
 */
export function FlowCard({ flow, tilt }: { flow: Flow; tilt: "a" | "b" }) {
  const [state, setState] = useState<FlowState>(flow.state);
  const [announcement, setAnnouncement] = useState("");

  const togglePause = () => {
    const next: FlowState = state === "paused" ? "active" : "paused";
    setState(next);
    setAnnouncement(
      next === "paused"
        ? `${flow.name} is paused. Deposits will be left alone.`
        : `${flow.name} is active again.`,
    );
  };

  const canPause = state === "active" || state === "paused";

  return (
    <div
      className={cn(
        "relative",
        tilt === "a" ? "tilt-a" : "tilt-b",
        state === "paused" && "opacity-80 saturate-50",
      )}
    >
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <article
        className={cn(
          "paper taped relative p-5",
          state === "paused" && "taped-peeled",
          state === "needs-attention" && "border-alert/50",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* The one place the handwritten face is allowed. */}
            <h3 className="font-hand text-2xl leading-tight text-ink">
              {flow.name}
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-subtle">
              {flow.source.displayName} · {describeCadence(flow.source.cadence)}
            </p>
          </div>
          <FlowStateBadge state={state} />
        </div>

        {flow.source.typicalAmount && (
          <p className="mt-3 text-sm text-ink-muted">
            Usually <Amount value={flow.source.typicalAmount} compactWhole />
          </p>
        )}

        <div className="mt-3 border-t border-paper-edge pt-2">
          <FlowDiagram splits={flow.splits} compact />
        </div>

        {state === "needs-attention" && flow.attentionReason && (
          <p className="mt-3 rounded-field bg-alert-soft px-3 py-2 text-xs leading-relaxed text-alert">
            {flow.attentionReason}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-paper-edge pt-3.5">
          <Link
            href={`/flows/${flow.id}`}
            className="inline-flex items-center gap-1.5 rounded-field text-sm font-medium text-accent hover:underline"
          >
            Open
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>

          {canPause && (
            /* One tap, like freezing a card. The moment you want it is not a
               moment for a flow of screens. */
            <button
              type="button"
              onClick={togglePause}
              className="inline-flex h-9 items-center gap-1.5 rounded-field border border-border-strong bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-sunk"
            >
              {state === "paused" ? (
                <>
                  <Play className="size-3.5" aria-hidden />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="size-3.5" aria-hidden />
                  Pause
                </>
              )}
            </button>
          )}
        </div>
      </article>
    </div>
  );
}
