import { PageHeader } from "@/components/layout/page-header";
import { Explainer } from "@/components/banking/explainer";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { authApi } from "@/lib/api";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const currentPerson = await authApi.me();
  if (!currentPerson) redirect("/signin");

  return (
    <>
      <PageHeader
        title="Settings"
        description="How you appear, and how we contact you."
      />

      <Card className="mb-6">
        <CardHeader>
          <div>
            <CardTitle>How you appear</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">
              Your display name is what you&apos;ll see across the app and on your
              card.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Display name"
              defaultValue={currentPerson.displayName}
              hint="Change this whenever you like — no documents needed."
            />
            <Field
              label="Pronouns"
              defaultValue={currentPerson.pronouns ?? ""}
              hint="Used by our support team. Never shown to merchants."
            />
            <Field
              label="Legal name"
              defaultValue={currentPerson.legalName}
              hint="Only used where the law requires it."
              className="sm:col-span-2"
            />
          </div>

          <Explainer label="Why are these separate?">
            Names change — after a marriage, a divorce, or simply because the
            name on your documents was never the one you use. Updating your legal
            name means paperwork and a wait. Updating what this app calls you
            shouldn&apos;t. Your display name is what appears on your card, in the
            app, and in every email we send you.
          </Explainer>

          <div className="mt-5 flex gap-2.5">
            <Button size="md">Save changes</Button>
            <Button variant="ghost" size="md">
              Cancel
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Notifications</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">
              We keep these minimal and never use them to sell you anything.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-border border-t border-border">
            <ToggleRow
              label="New device sign-ins"
              description="Always on. This one protects your account."
              locked
            />
            <ToggleRow
              label="Payments over a set amount"
              description="A heads-up when something large leaves your account."
            />
            <ToggleRow
              label="Goal milestones"
              description="When you pass a quarter of the way to a goal."
            />
            <ToggleRow
              label="Shared account activity"
              description="When someone else spends from an account you share."
            />
          </ul>
        </CardBody>
      </Card>
    </>
  );
}

function Field({
  label,
  defaultValue,
  hint,
  className,
}: {
  label: string;
  defaultValue: string;
  hint: string;
  className?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        defaultValue={defaultValue}
        aria-describedby={`${id}-hint`}
        className="mt-1.5 h-11 w-full rounded-field border border-border-strong bg-surface px-3.5 text-sm text-ink"
      />
      <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-muted">
        {hint}
      </p>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  locked,
}: {
  label: string;
  description: string;
  locked?: boolean;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <li className="flex items-start justify-between gap-4 py-3.5">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
      </div>
      <input
        id={id}
        type="checkbox"
        defaultChecked
        disabled={locked}
        className="mt-1 size-5 shrink-0 accent-[var(--accent)] disabled:opacity-50"
      />
    </li>
  );
}
