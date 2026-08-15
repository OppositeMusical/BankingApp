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
        "relative flex flex-col rounded-t-xl rounded-b-md border-4 border-border-strong bg-surface-sunk p-2 shadow-card transition-transform hover:-translate-y-1",
        state === "paused" && "opacity-80 saturate-50",
      )}
    >
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* Cartridge Grip / Ridges */}
      <div className="mb-3 mt-1 flex justify-center gap-1.5 opacity-50" aria-hidden>
        <div className="h-2 w-8 rounded-full bg-border-strong shadow-inner"></div>
        <div className="h-2 w-8 rounded-full bg-border-strong shadow-inner"></div>
        <div className="h-2 w-8 rounded-full bg-border-strong shadow-inner"></div>
      </div>

      {/* Cartridge Sticker (Label) */}
      <article
        className={cn(
          "relative flex-1 rounded-md border-2 border-border-strong bg-surface p-4 shadow-sm",
          state === "needs-attention" && "border-alert bg-alert-soft/20",
        )}
      >
        <div className="mb-2 border-b-2 border-border pb-2">
           <span className="font-display text-[10px] uppercase tracking-widest text-ink-subtle">
             Talents System Cartridge
           </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* Display font instead of hand font for the cartridge title */}
            <h3 className="font-display text-xl leading-tight text-ink">
              {flow.name}
            </h3>
            <p className="mt-1 font-numbers text-sm leading-relaxed text-ink-subtle">
              {flow.source.displayName} · {describeCadence(flow.source.cadence)}
            </p>
          </div>
          <FlowStateBadge state={state} />
        </div>

        {/* The split, drawn. The deposit is the diagram's source node, so it
            isn't also stated as a line of prose above it. */}
        <div className="mt-5">
          <FlowGraph
            splits={flow.splits}
            typicalAmount={flow.source.typicalAmount}
            sourceLabel="Usually arrives"
            compact
          />
        </div>

        {state === "needs-attention" && flow.attentionReason && (
          <p className="mt-4 rounded-field border-2 border-alert bg-alert-soft px-3 py-2 font-sans text-xs leading-relaxed text-alert">
            {flow.attentionReason}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-border pt-4">
          <Link
            href={`/flows/${flow.id}`}
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            Play
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>

          {canPause && (
            /* One tap, like freezing a card. The moment you want it is not a
               moment for a flow of screens. */
            <button
              type="button"
              onClick={togglePause}
              className="inline-flex h-9 items-center gap-1.5 rounded-field border-2 border-border-strong bg-surface px-3 text-sm font-bold text-ink transition-colors hover:bg-surface-sunk shadow-sm"
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
