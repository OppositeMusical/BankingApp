"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  ListTree,
  Users,
  Workflow,
} from "lucide-react";
import { SplitEditor } from "@/components/flows/split-editor";
import { FlowCanvas } from "@/components/flows/flow-canvas";
import { FlowDiagram } from "@/components/flows/flow-diagram";
import { newFlowId, saveUserFlow } from "@/lib/store/user-flows";
import { Amount } from "@/components/banking/amount";
import { Explainer } from "@/components/banking/explainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { describeCadence, resolveDestination, sharedViewers } from "@/lib/flows/destinations";
import { splitDeposit } from "@/lib/flows/split-deposit";
import { sample } from "@/lib/api/sample";
import { accounts as accountFixtures } from "@/lib/mock/data";
import { flows as flowFixtures, sourceSuggestions as sourceFixtures } from "@/lib/mock/flows";

/*
 * The builder runs entirely on fixtures: detected payers, destination accounts
 * and existing flows all come from lib/mock. None has an endpoint, so in live
 * mode each is empty and the steps fall through to their own empty states.
 *
 * Read at call time rather than module scope. Module code runs at import,
 * before <ApiModeSync> has told the client what the server resolved, so a
 * module-level value would use the build-time mode and could disagree with the
 * server's markup.
 */
const builderFixtures = () => ({
  accounts: sample(accountFixtures, []),
  flows: sample(flowFixtures, []),
  sourceSuggestions: sample(sourceFixtures, []),
});
import { formatMoney } from "@/lib/format/money";
import { buttonVariants } from "@/components/ui/button";
import type { Account } from "@/lib/types/banking";
import type { Flow, FlowSourceSuggestion, FlowSplit } from "@/lib/types/flows";
import { cn } from "@/lib/utils/cn";

type Step = 1 | 2 | 3;
type SplitView = "list" | "canvas";

const stepLabels = [
  "Who pays you?",
  "Where should it go?",
  "Check it over",
] as const;

export function FlowBuilder({ accounts }: { accounts: Account[] }) {
  const [step, setStep] = useState<Step>(1);
  const [source, setSource] = useState<FlowSourceSuggestion | null>(null);
  const [flowName, setFlowName] = useState("");
  const [splits, setSplits] = useState<FlowSplit[]>([]);
  const [view, setView] = useState<SplitView>("list");
  const [activated, setActivated] = useState(false);

  const chooseSource = (suggestion: FlowSourceSuggestion) => {
    setSource(suggestion);
    setFlowName(suggestion.displayName.split(" ")[0]);
    // Seed with the account the money already lands in as Rest, so the flow is
    // valid from the first moment and the user only adds what they want to
    // divert.
    setSplits([
      {
        id: "spl_rest",
        destination: {
          kind: "account",
          accountId: suggestion.arrivesInAccountId,
        },
        isRemainder: true,
      },
    ]);
    setStep(2);
  };

  if (activated && source) {
    return <BuilderDone flowName={flowName} source={source} />;
  }

  return (
    <>
      <ol className="mb-7 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {stepLabels.map((label, index) => {
          const number = (index + 1) as Step;
          const isCurrent = number === step;
          const isDone = number < step;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-pill px-2.5 py-1",
                  isCurrent && "bg-accent-soft font-medium text-accent",
                  isDone && "text-ink-muted",
                  !isCurrent && !isDone && "text-ink-subtle",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isDone ? (
                  <Check className="size-3.5" aria-hidden />
                ) : (
                  <span className="tabular">{number}.</span>
                )}
                {label}
              </span>
              {index < stepLabels.length - 1 && (
                <span className="text-ink-subtle" aria-hidden>
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {step === 1 && <StepSource onChoose={chooseSource} accounts={accounts} />}

      {step === 2 && source && (
        <StepSplits
          accounts={accounts}
          source={source}
          flowName={flowName}
          onNameChange={setFlowName}
          splits={splits}
          onSplitsChange={setSplits}
          view={view}
          setView={setView}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && source && (
        <StepPreview
          source={source}
          flowName={flowName}
          splits={splits}
          onBack={() => setStep(2)}
          onActivate={() => {
            // Persist it so it appears on the flows page alongside the rest.
            saveUserFlow({
              id: newFlowId(),
              name: flowName.trim() || source.displayName,
              state: "active",
              source: {
                id: source.id,
                displayName: source.displayName,
                matchPatterns: source.matchPatterns,
                arrivesInAccountId: source.arrivesInAccountId,
                cadence: source.cadence,
                typicalAmount: source.typicalAmount,
                lastSeenAt: source.lastSeenAt,
              },
              setAsides: [],
              splits,
              createdAt: new Date().toISOString(),
            });
            setActivated(true);
          }}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 1 — source discovery                                                  */
/* -------------------------------------------------------------------------- */

function StepSource({
  onChoose,
  accounts,
}: {
  onChoose: (suggestion: FlowSourceSuggestion) => void;
  accounts: Account[];
}) {
  // Sorted by total received, not by date — the main income comes first.
  const sorted = useMemo(
    () =>
      [...builderFixtures().sourceSuggestions].sort(
        (a, b) => b.totalReceived.amount - a.totalReceived.amount,
      ),
    [],
  );

  return (
    <>
      <p className="mb-4 max-w-prose text-sm text-ink-muted">
        These are the people and companies who have paid you more than once in
        the last year. Pick the one this flow should watch for.
      </p>

      <ul className="flex flex-col gap-3">
        {sorted.map((suggestion) => {
          const arrivesIn = accounts.find(
            (a) => a.id === suggestion.arrivesInAccountId,
          );
          const claimed = suggestion.alreadyUsed;

          return (
            <li key={suggestion.id}>
              <button
                type="button"
                disabled={claimed}
                onClick={() => onChoose(suggestion)}
                className={cn(
                  "w-full rounded-card border bg-surface p-4 text-left transition-colors",
                  claimed
                    ? "cursor-not-allowed border-border opacity-60"
                    : "border-border hover:border-accent hover:bg-accent-soft/40",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">
                      {suggestion.displayName}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-subtle">
                      {describeCadence(suggestion.cadence)} · lands in{" "}
                      {arrivesIn?.name ?? "an account"}
                    </p>
                  </div>
                  {claimed ? (
                    <Badge tone="neutral">Already in a flow</Badge>
                  ) : (
                    <p className="text-sm font-medium text-ink">
                      <Amount value={suggestion.typicalAmount} compactWhole />
                      <span className="ml-1 text-xs font-normal text-ink-subtle">
                        typical
                      </span>
                    </p>
                  )}
                </div>

                {/* The last three amounts, so the payer is recognisable. */}
                <p className="mt-2.5 text-xs text-ink-muted">
                  Last three:{" "}
                  {suggestion.recentAmounts
                    .map((amount) => formatMoney(amount, { compactWhole: true }))
                    .join(" · ")}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      <Card className="mt-4">
        <CardBody className="pt-5">
          <p className="text-sm font-medium text-ink">Someone else pays me</p>
          <p className="mt-1 text-sm text-ink-muted">
            If your payer isn&apos;t listed — a new client, a benefit payment, a
            family transfer — you can add them by name and we&apos;ll watch for
            them.
          </p>
          <Button variant="secondary" size="sm" className="mt-3">
            Add a payer by name
          </Button>
          <Explainer label="Why don't you ask how much they pay?">
            Because you shouldn&apos;t have to know. Flows split by percentage, so
            they work the same whether the deposit is $400 or $4,000. That&apos;s
            the whole point — a lean month needs no re-planning.
          </Explainer>
        </CardBody>
      </Card>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 2 — splits                                                            */
/* -------------------------------------------------------------------------- */

function StepSplits({
  source,
  flowName,
  onNameChange,
  splits,
  onSplitsChange,
  view,
  setView,
  onBack,
  onNext,
  accounts,
}: {
  accounts: Account[];
  source: FlowSourceSuggestion;
  flowName: string;
  onNameChange: (name: string) => void;
  splits: FlowSplit[];
  onSplitsChange: (splits: FlowSplit[]) => void;
  view: SplitView;
  setView: (view: SplitView) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <div className="mb-5">
        <label htmlFor="flow-name" className="block text-sm font-medium text-ink">
          Call this flow
        </label>
        <input
          id="flow-name"
          value={flowName}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={source.displayName}
          className="mt-1.5 h-11 w-full max-w-sm rounded-field border border-border-strong bg-surface px-3.5 text-sm text-ink"
        />
        <p className="mt-1.5 text-xs text-ink-muted">
          Watching for {source.displayName}, {describeCadence(source.cadence)}.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-ink">
          Where should {source.displayName.split(" ")[0]}&apos;s money go?
        </h2>

        {/* Two views of the same shares. Whichever you use, the flow that comes
            out is identical. */}
        <div
          role="group"
          aria-label="How to arrange the shares"
          className="inline-flex rounded-pill border border-border bg-surface p-0.5"
        >
          {(["list", "canvas"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              aria-pressed={view === option}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-pill px-3.5 text-sm font-medium transition-colors",
                view === option
                  ? "bg-accent-soft text-accent"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {option === "list" ? (
                <ListTree className="size-4" aria-hidden />
              ) : (
                <Workflow className="size-4" aria-hidden />
              )}
              {option === "list" ? "List" : "Canvas"}
            </button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <SplitEditor
          splits={splits}
          onChange={onSplitsChange}
          typicalAmount={source.typicalAmount}
          accounts={accounts}
        />
      ) : (
        <>
          <FlowCanvas
            splits={splits}
            onChange={onSplitsChange}
            typicalAmount={source.typicalAmount}
            sourceName={source.displayName}
            sourceCadence={describeCadence(source.cadence)}
            accounts={accounts}
          />
          {/* The accessible equivalent of the canvas, always present. */}
          <details className="mt-3">
            <summary className="cursor-pointer list-none text-sm font-medium text-accent hover:underline">
              The same shares, as a list
            </summary>
            <div className="mt-2 rounded-card border border-border bg-surface p-4">
              <FlowDiagram
                splits={splits}
                typicalAmount={source.typicalAmount}
              />
            </div>
          </details>
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Button onClick={onNext} disabled={!flowName.trim()}>
          Preview this flow
          <ArrowRight className="size-4" aria-hidden />
        </Button>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Button>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 3 — preview against a real past deposit                               */
/* -------------------------------------------------------------------------- */

function StepPreview({
  source,
  flowName,
  splits,
  onBack,
  onActivate,
}: {
  source: FlowSourceSuggestion;
  flowName: string;
  splits: FlowSplit[];
  onBack: () => void;
  onActivate: () => void;
}) {
  // Their actual last payment, not a round example.
  const lastDeposit = source.recentAmounts[0];

  const draft: Flow = {
    id: "flow_draft",
    name: flowName,
    state: "draft",
    source: {
      id: source.id,
      displayName: source.displayName,
      matchPatterns: source.matchPatterns,
      arrivesInAccountId: source.arrivesInAccountId,
      cadence: source.cadence,
      typicalAmount: source.typicalAmount,
    },
    setAsides: [],
    splits,
    createdAt: new Date(0).toISOString(),
  };

  const result = splitDeposit(draft, lastDeposit);
  const viewers = sharedViewers(splits.map((split) => split.destination));

  // A payer may only be claimed by one flow.
  const conflict = builderFixtures().flows.find(
    (existing) => existing.source.displayName === source.displayName,
  );

  return (
    <>
      <h2 className="font-display text-xl font-semibold text-ink">
        If {source.displayName} had paid you this, here&apos;s what would have
        happened
      </h2>
      <p className="mt-1.5 mb-5 text-sm text-ink-muted">
        Using their most recent payment of{" "}
        <span className="font-medium text-ink">
          <Amount value={lastDeposit} />
        </span>{" "}
        — real numbers, down to the cent.
      </p>

      {!result.ok ? (
        <Card className="border-alert/40">
          <CardBody className="pt-5">
            <p className="flex items-start gap-2 text-sm text-alert">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {result.reason}
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {result.lines.map((line) => {
              const destination = resolveDestination(line.destination);
              const split = splits.find((s) => s.id === line.splitId);
              return (
                <li
                  key={line.splitId}
                  className="flex items-baseline justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm text-ink">
                      {destination.label}
                      {destination.isShared && (
                        <Users className="size-3.5 text-accent" aria-hidden />
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-subtle">
                      {split?.isRemainder
                        ? "The rest"
                        : `${split?.percentage ?? 0}%`}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium">
                    <Amount value={line.amount} />
                  </p>
                </li>
              );
            })}
          </ul>
          <CardBody className="pt-4">
            <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3 text-sm">
              <span className="text-ink-muted">Total</span>
              <span className="font-medium tabular text-ink">
                <Amount value={lastDeposit} />
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Routing money into a shared account is a visibility event, stated
          before the user commits — never in a footnote afterwards. */}
      {viewers.length > 0 && (
        <Card className="mt-4 border-accent/30">
          <CardBody className="pt-5">
            <p className="flex items-start gap-2 text-sm text-ink">
              <Users className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <span>
                <span className="font-medium">
                  {viewers.join(" and ")} can see money that arrives in a shared
                  account.
                </span>{" "}
                They are not told this flow exists, and they can&apos;t see your
                other accounts, goals, or flows.
              </span>
            </p>
          </CardBody>
        </Card>
      )}

      <Card className="mt-4">
        <CardBody className="pt-5">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Runs</dt>
              <dd className="text-right font-medium text-ink">
                Next time {source.displayName} pays you
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Fee</dt>
              <dd className="text-right font-medium text-positive">No fee</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Changing your mind</dt>
              <dd className="text-right font-medium text-ink">
                Pause or delete any time, instantly
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      {conflict && (
        <p className="mt-4 flex items-start gap-2 text-sm text-alert">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <Link href={`/flows/${conflict.id}`} className="underline">
              {conflict.name}
            </Link>{" "}
            already handles payments from {source.displayName}. A payer can only
            belong to one flow.
          </span>
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Button onClick={onActivate} disabled={!result.ok || Boolean(conflict)}>
          Turn on this flow
        </Button>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden />
          Go back and edit
        </Button>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function BuilderDone({
  flowName,
  source,
}: {
  flowName: string;
  source: FlowSourceSuggestion;
}) {
  return (
    <div className="grain relative">
      <div className="paper tilt-a taped relative mx-auto max-w-md p-7 text-center">
        <span
          className="mx-auto grid size-12 place-items-center rounded-pill bg-positive-soft text-positive"
          aria-hidden
        >
          <Check className="size-6" />
        </span>
        <h2 className="mt-4 font-hand text-3xl text-ink">{flowName} is on</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          The next time {source.displayName} pays you, it&apos;ll be split the way
          you set it. We&apos;ll show you exactly what happened.
        </p>
        <Link
          href="/flows"
          className={cn("mt-5", buttonVariants({ variant: "primary", size: "md" }))}
        >
          Back to flows
        </Link>
      </div>
    </div>
  );
}
