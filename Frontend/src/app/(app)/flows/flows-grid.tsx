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
      <div className="relative flex flex-col rounded-t-xl rounded-b-md border-4 border-border-strong bg-surface-sunk p-2 shadow-card max-w-lg mx-auto">
        <div className="mb-3 mt-1 flex justify-center gap-1.5 opacity-50" aria-hidden>
          <div className="h-2 w-8 rounded-full bg-border-strong shadow-inner"></div>
          <div className="h-2 w-8 rounded-full bg-border-strong shadow-inner"></div>
          <div className="h-2 w-8 rounded-full bg-border-strong shadow-inner"></div>
        </div>
        <div className="relative flex-1 rounded-md border-2 border-border-strong bg-surface p-7 shadow-sm">
          <div className="mb-4 border-b-2 border-border pb-2">
             <span className="font-display text-[10px] uppercase tracking-widest text-ink-subtle">
               Talents System Cartridge
             </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-ink">Your first flow</h2>
          <p className="mt-4 font-sans text-sm leading-relaxed text-ink-muted">
            A flow splits a deposit the moment it arrives, by percentages you
            set — so a lean month needs no re-planning, and money is set aside
            before you can spend it.
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
            Flows aren&apos;t connected to the banking service yet, so there is
            nothing here to show. Switch to sample data to see a worked example.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col rounded-t-xl rounded-b-md border-4 border-border-strong bg-surface-sunk p-2 shadow-card max-w-lg mx-auto">
      <div className="mb-3 mt-1 flex justify-center gap-1.5 opacity-50" aria-hidden>
        <div className="h-2 w-8 rounded-full bg-border-strong shadow-inner"></div>
        <div className="h-2 w-8 rounded-full bg-border-strong shadow-inner"></div>
        <div className="h-2 w-8 rounded-full bg-border-strong shadow-inner"></div>
      </div>
      <div className="relative flex-1 rounded-md border-2 border-border-strong bg-surface p-7 shadow-sm">
        <div className="mb-4 border-b-2 border-border pb-2">
           <span className="font-display text-[10px] uppercase tracking-widest text-ink-subtle">
             Talents System Cartridge
           </span>
        </div>
        <h2 className="font-display text-2xl font-bold text-ink">Your first flow</h2>
        <p className="mt-4 font-sans text-sm leading-relaxed text-ink-muted">
          Say Northwind pays you $6,125. Instead of it all landing in one place
          and hoping some survives the month, a flow splits it the moment it
          arrives:
        </p>

        <ul className="mt-5 flex flex-col gap-2 font-sans text-sm">
          {[
            ["20%", "Safety net", "$1,225"],
            ["25%", "Career break", "$1,531"],
            ["15%", "Household", "$919"],
            ["the rest", "Everyday", "$2,450"],
          ].map(([share, where, amount]) => (
            <li
              key={where}
              className="flex items-baseline justify-between gap-3 border-b-2 border-border pb-2"
            >
              <span className="text-ink font-bold">
                <span className="font-numbers text-base">{share}</span> to {where}
              </span>
              <span className="font-numbers text-base font-bold text-ink-muted">{amount}</span>
            </li>
          ))}
        </ul>

        <p className="mt-5 font-sans text-sm leading-relaxed text-ink-muted">
          Next month the invoice is smaller? The shares stay the same, so nothing
          needs adjusting.
        </p>

        <div className="mt-6 border-t-2 border-border pt-5">
          <Link
            href="/flows/new"
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            <Plus className="size-4" aria-hidden />
            Insert Coin to Build
          </Link>
        </div>
      </div>
    </div>
  );
}
