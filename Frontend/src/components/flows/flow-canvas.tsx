"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus } from "lucide-react";
import { flowNodeTypes } from "./canvas-nodes";
import { remainderPercentage, totalPercentage } from "@/lib/flows/split-deposit";
import { sample } from "@/lib/api/sample";
import { goals as goalFixtures } from "@/lib/mock/data";

// Accounts are real, passed down from the server. Goals stay on fixtures
// because the contract has no goal resource at all — a SubAccount carries no
// target amount or date (gap #2 in docs/api-contract.md) — so in live mode
// there are simply no goal destinations to offer.
//
// Resolved at call time, not at module scope: module code runs at import,
// before <ApiModeSync> has told the client what the server resolved.
const goalOptions = () => sample(goalFixtures, []);
import type { Account, Money } from "@/lib/types/banking";
import type { FlowDestination, FlowSplit } from "@/lib/types/flows";

/*
 * The node canvas: money in on the left, destinations on the right, dashed
 * threads carrying the shares between them.
 *
 * The canvas and the list editor are two views of the same `splits` state, so a
 * flow built by dragging nodes is the same object as one built from the list —
 * it lands on the flows page identically. The canvas initialises from `splits`
 * on mount and pushes edits back up; it is unmounted when the user switches
 * views, which keeps the two from fighting over one piece of state.
 */

const SOURCE_ID = "node_source";
const MIN_SHARE = 1;
/** Vertical spacing between destination cards. Taller than a card, so they
 *  never overlap when the canvas lays itself out. */
const ROW = 180;

const destinationKey = (destination: FlowDestination) =>
  destination.kind === "account"
    ? `account:${destination.accountId}`
    : `goal:${destination.goalId}`;

const threadEdge = {
  type: "smoothstep" as const,
  animated: false,
  style: { stroke: "var(--thread)", strokeWidth: 2, strokeDasharray: "6 5" },
};

const connect = (source: string, target: string): Connection => ({
  source,
  target,
  sourceHandle: null,
  targetHandle: null,
});

/**
 * Lays the splits out as a graph: source on the left, destinations stacked to
 * the right, Rest last. Positions are recomputed each time the canvas mounts,
 * which keeps the layout predictable when switching between views.
 */
function buildGraph(splits: FlowSplit[], readOnly: boolean) {
  const rest = splits.find((split) => split.isRemainder);
  const shares = splits.filter((split) => !split.isRemainder);

  const nodes: Node[] = [
    {
      id: SOURCE_ID,
      type: "source",
      position: { x: 0, y: Math.max(0, (shares.length * ROW) / 2 - 40) },
      data: {},
      draggable: !readOnly,
    },
    ...shares.map((split, index) => ({
      id: split.id,
      type: "destination",
      position: { x: 380, y: index * ROW },
      data: {
        destination: split.destination,
        percentage: split.percentage ?? 10,
        connected: true,
      },
      draggable: !readOnly,
    })),
    ...(rest
      ? [
          {
            id: rest.id,
            type: "rest",
            position: { x: 380, y: shares.length * ROW },
            data: { destination: rest.destination },
            draggable: !readOnly,
          },
        ]
      : []),
  ];

  const edges: Edge[] = splits.map((split) => ({
    id: `edge_${split.id}`,
    source: SOURCE_ID,
    target: split.id,
    // Rest is the safety valve — its connection can't be pulled out.
    deletable: !readOnly && !split.isRemainder,
    ...threadEdge,
  }));

  return { nodes, edges };
}

type FlowCanvasProps = {
  splits: FlowSplit[];
  onChange: (splits: FlowSplit[]) => void;
  typicalAmount: Money;
  sourceName: string;
  sourceCadence: string;
  readOnly?: boolean;
  /** Real destinations, from the server. */
  accounts?: Account[];
};

export function FlowCanvas(props: FlowCanvasProps) {
  // React Flow needs its provider for the hooks used inside.
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function FlowCanvasInner({
  splits,
  onChange,
  typicalAmount,
  sourceName,
  sourceCadence,
  readOnly = false,
  accounts = [],
}: FlowCanvasProps) {
  // Built once, from the splits as they were when the canvas mounted. The
  // canvas is unmounted when the user switches back to the list view, so the
  // two editors never fight over one piece of state.
  const [initial] = useState(() => buildGraph(splits, readOnly));
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges);

  const updatePercentage = useCallback(
    (nodeId: string, requested: number) => {
      setNodes((current) => {
        // The most this node can take before Rest would go negative.
        const others = current
          .filter(
            (node) =>
              node.type === "destination" &&
              node.id !== nodeId &&
              node.data.connected,
          )
          .reduce(
            (total, node) => total + Number(node.data.percentage ?? 0),
            0,
          );
        const max = Math.max(MIN_SHARE, 100 - others);
        const clamped = Math.min(
          max,
          Math.max(MIN_SHARE, Math.round(requested)),
        );
        return current.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, percentage: clamped } }
            : node,
        );
      });
    },
    [setNodes],
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      setNodes((current) => current.filter((node) => node.id !== nodeId));
      setEdges((current) =>
        current.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId,
        ),
      );
    },
    [setNodes, setEdges],
  );

  // Keep every node's derived data (Rest %, per-node max, callbacks) current.
  const connectedIds = useMemo(
    () => new Set(edges.map((edge) => edge.target)),
    [edges],
  );

  const decoratedNodes = useMemo(() => {
    const shareTotal = nodes
      .filter((node) => node.type === "destination" && connectedIds.has(node.id))
      .reduce((total, node) => total + Number(node.data.percentage ?? 0), 0);
    const restPercent = Math.max(0, 100 - shareTotal);

    return nodes.map((node) => {
      if (node.type === "source") {
        return {
          ...node,
          data: {
            ...node.data,
            displayName: sourceName,
            cadence: sourceCadence,
            typicalAmount,
          },
        };
      }
      if (node.type === "rest") {
        return {
          ...node,
          data: {
            ...node.data,
            percentage: restPercent,
            typicalAmount,
          },
        };
      }
      const own = Number(node.data.percentage ?? 0);
      const others = shareTotal - (connectedIds.has(node.id) ? own : 0);
      return {
        ...node,
        data: {
          ...node.data,
          typicalAmount,
          connected: connectedIds.has(node.id),
          maxPercentage: Math.max(MIN_SHARE, 100 - others),
          onPercentageChange: updatePercentage,
          onRemove: removeNode,
        },
      };
    });
  }, [
    nodes,
    connectedIds,
    typicalAmount,
    sourceName,
    sourceCadence,
    updatePercentage,
    removeNode,
  ]);

  // Push the graph back up as splits.
  useEffect(() => {
    if (readOnly) return;
    const next: FlowSplit[] = [];
    for (const node of nodes) {
      if (!connectedIds.has(node.id)) continue;
      if (node.type === "rest") {
        next.push({
          id: node.id,
          destination: node.data.destination as FlowDestination,
          isRemainder: true,
        });
      } else if (node.type === "destination") {
        next.push({
          id: node.id,
          destination: node.data.destination as FlowDestination,
          percentage: Number(node.data.percentage ?? 0),
          isRemainder: false,
        });
      }
    }
    onChange(next);
    // `onChange` is a setState from the parent and is stable enough here;
    // including it would re-run this on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, connectedIds, readOnly]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source !== SOURCE_ID) return;
      // One incoming thread per destination.
      setEdges((current) =>
        current.some((edge) => edge.target === connection.target)
          ? current
          : addEdge({ ...connection, ...threadEdge }, current),
      );
    },
    [setEdges],
  );

  const addDestination = useCallback(
    (destination: FlowDestination) => {
      const id = `spl_${Math.random().toString(36).slice(2, 9)}`;
      setNodes((current) => {
        // Slot the new card below the existing destinations, and keep Rest at
        // the bottom — it is always the last thing money reaches.
        const destinations = current.filter((n) => n.type === "destination");
        const newY =
          destinations.length === 0
            ? 0
            : Math.max(...destinations.map((n) => n.position.y)) + ROW;

        return [
          ...current.map((node) =>
            node.type === "rest"
              ? { ...node, position: { x: 380, y: newY + ROW } }
              : node,
          ),
          {
            id,
            type: "destination",
            position: { x: 380, y: newY },
            data: { destination, percentage: 10, connected: true },
          },
        ];
      });
      // Arrives already connected — the fast path. The thread can be deleted
      // and redrawn for anyone who prefers to wire it themselves.
      setEdges((current) =>
        addEdge({ ...connect(SOURCE_ID, id), ...threadEdge }, current),
      );
    },
    [setNodes, setEdges],
  );

  const usedKeys = useMemo(
    () =>
      new Set(
        nodes
          .filter((node) => node.type !== "source")
          .map((node) => destinationKey(node.data.destination as FlowDestination)),
      ),
    [nodes],
  );

  const availableDestinations = useMemo(() => {
    const options: { label: string; destination: FlowDestination }[] = [
      ...accounts.map((account) => ({
        label: account.name,
        destination: { kind: "account" as const, accountId: account.id },
      })),
      ...goalOptions().map((goal) => ({
        label: goal.name,
        destination: { kind: "goal" as const, goalId: goal.id },
      })),
    ];
    return options.filter(
      (option) => !usedKeys.has(destinationKey(option.destination)),
    );
  }, [usedKeys, accounts]);

  const used = totalPercentage(splits);
  const restPercent = remainderPercentage(splits);

  return (
    <div>
      {!readOnly && availableDestinations.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-sm font-medium text-ink">
            Add a destination to the canvas
          </p>
          <div className="flex flex-wrap gap-2">
            {availableDestinations.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => addDestination(option.destination)}
                className="inline-flex h-9 items-center gap-1.5 rounded-pill border border-border bg-surface px-3.5 text-sm font-medium text-ink-muted transition-colors hover:border-accent hover:text-accent"
              >
                <Plus className="size-3.5" aria-hidden />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="flow-canvas h-[26rem] overflow-hidden rounded-card border border-border bg-surface-sunk sm:h-[30rem]"
        // The canvas is a visual convenience. The list view below is the
        // accessible equivalent and stays authoritative.
        role="application"
        aria-label="Flow canvas. A visual editor for the shares. The same shares are listed below in the summary."
      >
        <ReactFlow
          nodes={decoratedNodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          nodeTypes={flowNodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          proOptions={{ hideAttribution: false }}
          nodesConnectable={!readOnly}
          nodesDraggable={!readOnly}
          elementsSelectable={!readOnly}
          minZoom={0.4}
          maxZoom={1.5}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.5}
            color="var(--thread)"
          />
          {!readOnly && <Controls showInteractive={false} />}
        </ReactFlow>
      </div>

      {!readOnly && (
        <>
          <p className="mt-2.5 text-xs text-ink-muted">
            Drag the cards to arrange them. Pull a line from{" "}
            <strong className="font-medium text-ink">Money comes in</strong> to a
            card to send it a share.
          </p>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3 rounded-field border border-border bg-surface px-4 py-3">
            <p className="text-sm text-ink-muted">
              Shares set{" "}
              <span className="font-medium tabular text-ink">{used}%</span> · the
              rest{" "}
              <span className="font-medium tabular text-ink">
                {restPercent}%
              </span>
            </p>
            <p className="text-sm font-medium text-ink">Total 100% ✓</p>
          </div>
          <p aria-live="polite" className="sr-only">
            {`Shares total ${used} percent. The rest is ${restPercent} percent.`}
          </p>
        </>
      )}
    </div>
  );
}
