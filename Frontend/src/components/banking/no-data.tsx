import { Database } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";

/**
 * Stands in for a screen whose data the backend does not serve yet.
 *
 * Shown in live mode only. The alternative — rendering the sample fixtures —
 * puts balances and goals on screen that belong to nobody, and a person cannot
 * tell those from their own. For a banking product that is the one illusion
 * worth refusing outright, so these screens say plainly that there is nothing
 * behind them yet.
 */
export function NoData({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardBody className="pt-6 pb-7 text-center">
        <span
          className="mx-auto grid size-10 place-items-center rounded-pill bg-surface-sunk text-ink-subtle"
          aria-hidden
        >
          <Database className="size-5" />
        </span>
        <p className="mt-3 text-sm font-medium text-ink">{title}</p>
        <p className="mx-auto mt-1.5 max-w-prose text-sm leading-relaxed text-ink-muted">
          {children ?? (
            <>
              This part of the app isn&apos;t connected to the banking service
              yet, so there is nothing real to show. Switch to sample data to
              see how it works.
            </>
          )}
        </p>
      </CardBody>
    </Card>
  );
}
