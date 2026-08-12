"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { FlowCard } from "@/components/flows/flow-card";
import { showingSample } from "@/lib/api/sample";
import { useUserFlows } from "@/lib/store/user-flows";
import type { Flow } from "@/lib/types/flows";

/**
 * The flows canvas: the user's own flows first, then the examples.
 *
 * Flows built on the node canvas and flows built from the list are the same
 * shape, so they land here identically — there is no "canvas flow" as a
 * separate kind of thing.
 */
export function FlowsGrid({ exampleFlows }: { exampleFlows: Flow[] }) {
  const userFlows = useUserFlows();
  const all = [...userFlows, ...exampleFlows];

  if (all.length === 0) return <FlowsEmptyState sample={showingSample()} />;

  return (
    <div className="grain relative -mx-2 grid gap-8 px-2 py-4 sm:grid-cols-2 sm:gap-x-6">
      {all.map((flow, index) => (
        <FlowCard
          key={flow.id}
          flow={flow}
          tilt={index % 2 === 0 ? "a" : "b"}
        />
      ))}
    </div>
  );
}

/**
 * The empty state does real work: it teaches the concept with a worked example
 * rather than showing an illustration and a button.
 */
function FlowsEmptyState({ sample }: { sample: boolean }) {
  // The worked example names a payer and four destinations. That reads as
  // account data, so in live mode it is replaced by the same teaching in
  // prose — the concept still lands, without anything that looks like a
  // balance somebody owns.
  if (!sample) {
    return (
      <div className="grain relative">
        <div className="paper tilt-a taped relative mx-auto max-w-lg p-7">
          <h2 className="font-hand text-3xl text-ink">Your first flow</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            A flow splits a deposit the moment it arrives, by percentages you
            set — so a lean month needs no re-planning, and money is set aside
            before you can spend it.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Flows aren&apos;t connected to the banking service yet, so there is
            nothing here to show. Switch to sample data to see a worked example.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grain relative">
      <div className="paper tilt-a taped relative mx-auto max-w-lg p-7">
        <h2 className="font-hand text-3xl text-ink">Your first flow</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Say Northwind pays you $6,125. Instead of it all landing in one place
          and hoping some survives the month, a flow splits it the moment it
          arrives:
        </p>

        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {[
            ["20%", "Safety net", "$1,225"],
            ["25%", "Career break", "$1,531"],
            ["15%", "Household", "$919"],
            ["the rest", "Everyday", "$2,450"],
          ].map(([share, where, amount]) => (
            <li
              key={where}
              className="flex items-baseline justify-between gap-3 border-b border-paper-edge pb-2"
            >
              <span className="text-ink">
                <span className="font-medium tabular">{share}</span> to {where}
              </span>
              <span className="tabular text-ink-muted">{amount}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          Next month the invoice is smaller? The shares stay the same, so nothing
          needs adjusting.
        </p>

        <Link
          href="/flows/new"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-field bg-accent px-5 text-sm font-medium text-accent-on"
        >
          <Plus className="size-4" aria-hidden />
          Build a flow
        </Link>
      </div>
    </div>
  );
}
