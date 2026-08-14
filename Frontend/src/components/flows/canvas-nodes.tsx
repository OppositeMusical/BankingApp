"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Trash2, Users } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { resolveDestination } from "@/lib/flows/destinations";
import { formatMoney } from "@/lib/format/money";
import type { Money } from "@/lib/types/banking";
import type { FlowDestination } from "@/lib/types/flows";

/*
 * Nodes for the flow canvas.
 *
 * Every node is a paper clipping, consistent with the rest of Flows. Nothing
 * here is tilted: on a canvas the user positions the cards themselves, and a
 * baked-in rotation would fight that. Interactive controls carry `nodrag` so
 * using them doesn't drag the node out from under the pointer.
 */

export type SourceNodeData = {
  displayName: string;
  cadence: string;
  typicalAmount: Money;
};

export type DestinationNodeData = {
  destination: FlowDestination;
  percentage: number;
  typicalAmount: Money;
  maxPercentage: number;
  onPercentageChange: (id: string, value: number) => void;
  onRemove: (id: string) => void;
  connected: boolean;
};

export type RestNodeData = {
  destination: FlowDestination;
  percentage: number;
  typicalAmount: Money;
};

const handleClass =
  "!size-3 !border-2 !border-surface !bg-accent hover:!bg-accent-hover";

export function SourceNode({ data }: NodeProps) {
  const { displayName, cadence, typicalAmount } = data as SourceNodeData;
  return (
    <div className="paper w-56 p-4">
      <p className="text-[10px] font-medium tracking-wide text-ink-subtle uppercase">
        Money comes in
      </p>
      <p className="mt-1 font-hand text-2xl leading-tight text-ink">
        {displayName}
      </p>
      <p className="mt-1 text-xs text-ink-subtle">{cadence}</p>
      <p className="mt-2 font-numbers text-lg font-semibold text-ink">
        <Amount value={typicalAmount} compactWhole />
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className={handleClass}
        aria-label={`Drag from ${displayName} to a destination to send it a share`}
      />
    </div>
  );
}

export function DestinationNode({ id, data }: NodeProps) {
  const {
    destination,
    percentage,
    typicalAmount,
    maxPercentage,
    onPercentageChange,
    onRemove,
    connected,
  } = data as DestinationNodeData;
  const resolved = resolveDestination(destination);
  const share: Money = {
    amount: Math.floor((typicalAmount.amount * percentage) / 100),
    currency: typicalAmount.currency,
  };

  return (
    <div
      className={`paper w-60 p-4 ${connected ? "" : "border-dashed opacity-70"}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={handleClass}
        aria-label={`Connect a share to ${resolved.label}`}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <span className="truncate">{resolved.label}</span>
            {resolved.isShared && (
              <Users className="size-3.5 shrink-0 text-accent" aria-hidden />
            )}
          </p>
          <p className="mt-0.5 truncate text-xs text-ink-subtle">
            {resolved.detail}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="nodrag -mr-1 -mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-field text-ink-subtle hover:bg-surface-sunk hover:text-alert"
        >
          <Trash2 className="size-3.5" aria-hidden />
          <span className="sr-only">Remove {resolved.label}</span>
        </button>
      </div>

      {connected ? (
        <>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={100}
              value={percentage}
              onChange={(event) =>
                onPercentageChange(id, Number(event.target.value))
              }
              aria-label={`${resolved.label} share`}
              aria-valuetext={`${percentage} percent, about ${formatMoney(share, {
                compactWhole: true,
              })}`}
              className="nodrag nowheel h-8 flex-1 accent-[var(--accent)]"
            />
            <input
              type="number"
              min={1}
              max={maxPercentage}
              value={percentage}
              onChange={(event) =>
                onPercentageChange(id, Number(event.target.value))
              }
              aria-label={`${resolved.label} share, percent`}
              className="nodrag h-8 w-14 rounded-field border border-border-strong bg-surface px-1.5 text-center text-sm tabular text-ink"
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">
            ≈ <Amount value={share} /> of a typical deposit
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs text-ink-muted">
          Not connected yet — drag a line from the source to start sending it a
          share.
        </p>
      )}
    </div>
  );
}

export function RestNode({ data }: NodeProps) {
  const { destination, percentage, typicalAmount } = data as RestNodeData;
  const resolved = resolveDestination(destination);
  const share: Money = {
    amount: Math.floor((typicalAmount.amount * percentage) / 100),
    currency: typicalAmount.currency,
  };

  return (
    <div className="paper w-60 border-accent/40 p-4">
      <Handle type="target" position={Position.Left} className={handleClass} />
      <p className="text-[10px] font-medium tracking-wide text-accent uppercase">
        The rest
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink">
        <span className="truncate">{resolved.label}</span>
        {resolved.isShared && (
          <Users className="size-3.5 shrink-0 text-accent" aria-hidden />
        )}
      </p>
      <p className="mt-0.5 text-xs text-ink-subtle">Gets whatever&apos;s left</p>

      {/* Derived: no slider, no input. It moves as the others move. */}
      <p className="mt-3 font-numbers text-2xl font-semibold tabular text-ink">
        {percentage}%
      </p>
      <p className="mt-0.5 text-xs text-ink-muted">
        ≈ <Amount value={share} /> of a typical deposit
      </p>
    </div>
  );
}

export const flowNodeTypes = {
  source: SourceNode,
  destination: DestinationNode,
  rest: RestNode,
};
