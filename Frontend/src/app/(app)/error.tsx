"use client";

import { useEffect } from "react";
import { CircleAlert, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

/**
 * Error boundary for every authenticated screen.
 *
 * Without this, a single failing connector call takes the whole page down to
 * the framework's blank "a server error occurred" screen — which tells the
 * user nothing and loses the navigation with it. Here the shell survives, so
 * one broken screen stays one broken screen.
 *
 * Next only passes `digest` to the client; the message and stack stay on the
 * server. So the digest is shown deliberately — it is the only handle that ties
 * what the user saw to a line in the deploy logs.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console for anyone debugging a deployed build.
    console.error("Screen failed to render:", error);
  }, [error]);

  return (
    <Card className="border-alert/40">
      <CardBody className="pt-5">
        <p className="flex items-start gap-2 text-sm font-medium text-ink">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-alert" aria-hidden />
          This screen couldn&apos;t load
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          Something went wrong fetching your data. Nothing was changed, and no
          money moved. The rest of the app still works — you can try again, or
          use the navigation to go elsewhere.
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button size="sm" onClick={reset}>
            <RotateCw className="size-3.5" aria-hidden />
            Try again
          </Button>
        </div>

        {error.digest && (
          <p className="mt-4 border-t border-border pt-3 text-xs text-ink-subtle">
            If you need to report this, quote{" "}
            <code className="tabular">{error.digest}</code> — it matches the
            entry in the server logs.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
