"use client";

import { useState } from "react";
import { Amount } from "@/components/banking/amount";
import { Explainer } from "@/components/banking/explainer";
import { Meter } from "@/components/ui/meter";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney, percentOf } from "@/lib/format/money";
import type { CareerPauseProjection, Money } from "@/lib/types/banking";

/** Employer + employee retirement contributions, as a share of gross pay. */
const CONTRIBUTION_RATE = 0.1;
/** Long-run real return assumption used for the compounding estimate. */
const REAL_RETURN = 0.05;
/** Years until retirement, used to compound the missed contributions. */
const YEARS_TO_RETIREMENT = 25;

const usd = (amount: number): Money => ({
  amount: Math.round(amount),
  currency: "USD",
});

export function CareerPausePlanner({
  projection,
}: {
  projection: CareerPauseProjection;
}) {
  const [months, setMonths] = useState(projection.months);

  // Recomputed live so the trade-off is visible while the slider moves,
  // rather than hidden behind a "calculate" button.
  const incomeForgone = usd(projection.monthlyIncome.amount * months);
  const contributionsMissed = usd(incomeForgone.amount * CONTRIBUTION_RATE);
  const retirementImpact = usd(
    contributionsMissed.amount * (1 + REAL_RETURN) ** YEARS_TO_RETIREMENT,
  );
  // Essential spending is roughly 44% of income for this household.
  const bufferNeeded = usd(projection.monthlyIncome.amount * months * 0.44);
  const bufferCoverage = percentOf(usd(projection.bufferHeld.amount), bufferNeeded);
  const covered = projection.bufferHeld.amount >= bufferNeeded.amount;

  return (
    <Card>
      <CardBody className="pt-5">
        <label
          htmlFor="pause-months"
          className="block text-sm font-medium text-ink"
        >
          How long would you step back for?
        </label>
        <div className="mt-3 flex items-center gap-4">
          <input
            id="pause-months"
            type="range"
            min={1}
            max={24}
            step={1}
            value={months}
            onChange={(event) => setMonths(Number(event.target.value))}
            aria-describedby="pause-months-value"
            className="h-11 flex-1 accent-[var(--accent)]"
          />
          <output
            id="pause-months-value"
            htmlFor="pause-months"
            className="w-20 shrink-0 text-right font-display text-xl font-semibold tabular text-ink"
          >
            {months} mo
          </output>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <Figure
            term="Income you wouldn't earn"
            value={incomeForgone}
            detail={`${months} months at ${formatMoney(projection.monthlyIncome, {
              compactWhole: true,
            })}`}
          />
          <Figure
            term="Retirement contributions missed"
            value={contributionsMissed}
            detail="Yours and your employer's"
          />
          <Figure
            term="Worth at retirement"
            value={retirementImpact}
            detail={`Compounded over ${YEARS_TO_RETIREMENT} years`}
            emphasis
          />
        </dl>

        <div className="mt-6 rounded-field border border-border bg-surface-sunk p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink">
              Your career break fund
            </p>
            <Badge tone={covered ? "positive" : "accent"}>
              {covered ? "Fully covered" : `${Math.round(bufferCoverage)}% there`}
            </Badge>
          </div>
          <Meter
            className="mt-3"
            value={bufferCoverage}
            tone={covered ? "positive" : "accent"}
            label={`Career break fund: ${formatMoney(
              projection.bufferHeld,
            )} of ${formatMoney(bufferNeeded)} needed`}
          />
          <p className="mt-2.5 text-sm text-ink-muted">
            You hold <Amount value={projection.bufferHeld} compactWhole />. To
            cover essentials for {months} months you&apos;d need{" "}
            <Amount value={bufferNeeded} compactWhole />.
          </p>
        </div>

        <Explainer label="How is this worked out?">
          Income forgone is your current monthly pay times the number of months.
          Retirement contributions assume a combined{" "}
          {Math.round(CONTRIBUTION_RATE * 100)}% of gross pay, compounded at{" "}
          {Math.round(REAL_RETURN * 100)}% a year in real terms for{" "}
          {YEARS_TO_RETIREMENT} years. The buffer figure covers essential
          spending only — housing, food, childcare, health, transport — based on
          your last six months, not your total spending. These are estimates to
          plan against, not a forecast.
        </Explainer>
      </CardBody>
    </Card>
  );
}

function Figure({
  term,
  value,
  detail,
  emphasis,
}: {
  term: string;
  value: Money;
  detail: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
        {term}
      </dt>
      <dd>
        <p
          className={`mt-1.5 font-display text-2xl font-semibold ${
            emphasis ? "text-accent" : "text-ink"
          }`}
        >
          <Amount value={value} compactWhole />
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">{detail}</p>
      </dd>
    </div>
  );
}
