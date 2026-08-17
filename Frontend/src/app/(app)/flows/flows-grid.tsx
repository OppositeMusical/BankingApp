"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
      <div className="relative mx-auto max-w-lg rounded-3xl border border-white/5 bg-white/[0.02] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-3xl transition-all hover:bg-white/[0.04]">
        <h2 className="font-display text-2xl font-semibold text-ink">Your first flow</h2>
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
    );
  }

  return (
    <div className="relative mx-auto max-w-lg rounded-3xl border border-white/5 bg-white/[0.02] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-3xl transition-all hover:bg-white/[0.04]">
      <h2 className="font-display text-2xl font-semibold text-ink">Your first flow</h2>
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
              className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2"
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
          className={buttonVariants({ variant: "primary", size: "md", className: "mt-5" })}
        >
          <Plus className="size-4" aria-hidden />
          Build a flow
        </Link>
    </div>
  );
}
