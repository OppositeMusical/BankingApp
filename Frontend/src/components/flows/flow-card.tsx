"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Pause, Play, AlertTriangle } from "lucide-react";
import { FlowGraph } from "./flow-graph";
import { FlowStateBadge } from "./flow-state-badge";
import { buttonVariants } from "@/components/ui/button";
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
        "relative rounded-3xl border border-white/5 bg-white/[0.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-3xl transition-transform hover:-translate-y-1 hover:bg-white/[0.04]",
        state === "paused" && "opacity-80 saturate-50",
      )}
    >
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <article
        className={cn(
          "relative p-6",
          state === "needs-attention" && "rounded-3xl border border-alert/30 bg-alert-soft/10",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* Clean metallic display typography instead of handwriting */}
            <h3 className="font-display text-xl font-semibold leading-tight text-ink">
              {flow.name}
            </h3>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-ink-subtle">
              {flow.source.displayName} · {describeCadence(flow.source.cadence)}
            </p>
          </div>
          <FlowStateBadge state={state} />
        </div>

        {/* The split, drawn. The deposit is the diagram's source node, so it
            isn't also stated as a line of prose above it. */}
        <div className="mt-4">
          <FlowGraph
            splits={flow.splits}
            typicalAmount={flow.source.typicalAmount}
            sourceLabel="Usually arrives"
            compact
          />
        </div>

        {state === "needs-attention" && flow.attentionReason && (
          <p className="mt-4 rounded-field bg-alert-soft px-4 py-3 text-sm font-medium leading-relaxed text-alert border border-alert/30">
            {flow.attentionReason}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <Link
            href={`/flows/${flow.id}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
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
              className={buttonVariants({ variant: "secondary", size: "sm" })}
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
