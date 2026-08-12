"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, TriangleAlert } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { describeError, toHolder, transfersApi } from "@/lib/api";
import { formatMoney } from "@/lib/format/money";
import type { Account, Money } from "@/lib/types/banking";

type Step = "amount" | "review" | "done";

/**
 * A three-step transfer with an explicit review. The review step is not
 * decoration: it restates what is about to happen in full before anything is
 * irreversible, which is the difference between a confirmation and a dark
 * pattern.
 *
 * Confirming calls `transfersApi.internal()`. The idempotency key is minted
 * when the form opens — not on submit — so a double-click, a retry, or an
 * impatient re-confirm can only ever produce one transfer.
 */
export function TransferFlow({ accounts }: { accounts: Account[] }) {
  const [step, setStep] = useState<Step>("amount");
  const [fromId, setFromId] = useState(accounts[0].id);
  const [toId, setToId] = useState(accounts[2].id);
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );
  const [submitting, setSubmitting] = useState(false);

  const from = accounts.find((account) => account.id === fromId)!;
  const to = accounts.find((account) => account.id === toId)!;

  // Parse to integer minor units — never carry money as a float.
  const parsed = Math.round(Number.parseFloat(amountInput || "0") * 100);
  const amount: Money = { amount: parsed, currency: "USD" };

  const validate = () => {
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter an amount greater than zero.");
      return false;
    }
    if (fromId === toId) {
      setError("Choose two different accounts.");
      return false;
    }
    if (parsed > from.available.amount) {
      setError(
        `That's more than the ${formatMoney(from.available)} available in ${from.name}.`,
      );
      return false;
    }
    setError(null);
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await transfersApi.internal(
        {
          from: toHolder(from),
          to: toHolder(to),
          amount,
        },
        idempotencyKey,
      );
      if (result.status === "failed") {
        setError(
          result.failureReason ??
            "The transfer could not be completed. Nothing was moved.",
        );
        return;
      }
      setStep("done");
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "done") {
    return (
      <Card>
        <CardBody className="pt-8 pb-8 text-center">
          <span
            className="mx-auto grid size-12 place-items-center rounded-pill bg-positive-soft text-positive"
            aria-hidden
          >
            <Check className="size-6" />
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold text-ink">
            Money moved
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            <Amount value={amount} /> is on its way from {from.name} to{" "}
            {to.name}. It usually lands within a few seconds.
          </p>
          <div className="mt-6 flex justify-center gap-2.5">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center rounded-field bg-accent px-5 text-sm font-medium text-accent-on"
            >
              Back to home
            </Link>
            <Button
              variant="secondary"
              onClick={() => {
                setStep("amount");
                setAmountInput("");
                // A fresh intent needs a fresh key, or the backend would
                // replay the transfer that just happened.
                setIdempotencyKey(crypto.randomUUID());
              }}
            >
              Move more money
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (step === "review") {
    return (
      <Card>
        <CardBody className="pt-5">
          <h2 className="font-display text-xl font-semibold text-ink">
            Check this over
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Nothing has moved yet. Nothing will until you confirm.
          </p>

          <dl className="mt-5 divide-y divide-border border-y border-border">
            <Row term="Amount">
              <span className="font-display text-lg font-semibold">
                <Amount value={amount} />
              </span>
            </Row>
            <Row term="From">
              {from.name} ···· {from.last4}
            </Row>
            <Row term="To">
              {to.name} ···· {to.last4}
            </Row>
            <Row term="Fee">
              <span className="text-positive">No fee</span>
            </Row>
            <Row term="Arrives">Usually within seconds</Row>
          </dl>

          {error && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-1.5 text-sm text-alert"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button onClick={submit} disabled={submitting}>
              {submitting ? (
                "Moving it now…"
              ) : (
                <>
                  Confirm and move <Amount value={amount} />
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setStep("amount")}
              disabled={submitting}
            >
              Go back and edit
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="pt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <AccountSelect
            id="from-account"
            label="From"
            accounts={accounts}
            value={fromId}
            onChange={setFromId}
          />
          <AccountSelect
            id="to-account"
            label="To"
            accounts={accounts}
            value={toId}
            onChange={setToId}
          />
        </div>

        <div className="mt-5">
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-ink"
          >
            Amount
          </label>
          <div className="relative mt-1.5">
            <span
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-xl text-ink-muted"
              aria-hidden
            >
              $
            </span>
            <input
              id="amount"
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => {
                setAmountInput(event.target.value);
                if (error) setError(null);
              }}
              placeholder="0.00"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "amount-error" : "amount-available"}
              className="h-14 w-full rounded-field border border-border-strong bg-surface pl-9 pr-4 font-display text-xl tabular text-ink"
            />
          </div>

          {error ? (
            <p
              id="amount-error"
              role="alert"
              className="mt-2 flex items-start gap-1.5 text-sm text-alert"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </p>
          ) : (
            <p id="amount-available" className="mt-2 text-sm text-ink-muted">
              <Amount value={from.available} /> available in {from.name}
            </p>
          )}
        </div>

        <Button
          className="mt-6"
          onClick={() => {
            if (validate()) setStep("review");
          }}
        >
          Review transfer
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </CardBody>
    </Card>
  );
}

function AccountSelect({
  id,
  label,
  accounts,
  value,
  onChange,
}: {
  id: string;
  label: string;
  accounts: Account[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-field border border-border-strong bg-surface px-3 text-sm text-ink"
      >
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} ···· {account.last4}
          </option>
        ))}
      </select>
    </div>
  );
}

function Row({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="text-sm text-ink-muted">{term}</dt>
      <dd className="text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}
