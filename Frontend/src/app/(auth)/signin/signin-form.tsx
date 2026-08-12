"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { authApi, describeError } from "@/lib/api";

type Mode = "signin" | "register";

/**
 * One form, two modes. Both call the connector, which in live mode goes
 * through the BFF proxy — the browser never sees a token, only the signed-in
 * person coming back.
 */
export function SignInForm({ mockMode }: { mockMode: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const registering = mode === "register";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (registering && password.length < 12) {
      setError("Your password needs at least 12 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (registering) {
        await authApi.register({ email, name, password });
      } else {
        await authApi.login({ email, password });
      }
      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(describeError(cause));
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardBody className="pt-6">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {registering ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          {registering
            ? "An email, a name, and a password at least 12 characters long."
            : "Sign in to see your money."}
        </p>

        {mockMode && (
          <p className="mt-3 rounded-field bg-accent-soft px-3 py-2 text-xs text-accent">
            Demo mode: no backend is connected, so any details sign you in as
            the demo person.
          </p>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            required
          />
          {registering && (
            <Field
              id="name"
              label="Name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={setName}
              required
            />
          )}
          <Field
            id="password"
            label="Password"
            type="password"
            autoComplete={registering ? "new-password" : "current-password"}
            value={password}
            onChange={setPassword}
            required
          />

          {error && (
            <p
              role="alert"
              className="flex items-start gap-1.5 text-sm text-alert"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? "One moment…"
              : registering
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-muted">
          {registering ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            className="rounded-field font-medium text-accent hover:underline"
            onClick={() => {
              setMode(registering ? "signin" : "register");
              setError(null);
            }}
          >
            {registering ? "Sign in instead" : "Create an account"}
          </button>
        </p>
      </CardBody>
    </Card>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-1.5 h-11 w-full rounded-field border border-border-strong bg-surface px-3 text-sm text-ink"
      />
    </div>
  );
}
