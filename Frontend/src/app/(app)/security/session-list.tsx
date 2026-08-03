"use client";

import { useState } from "react";
import { Laptop } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NOW } from "@/lib/mock/data";
import { relativeDayLabel, formatTime } from "@/lib/format/date";
import type { Session } from "@/lib/types/banking";

export function SessionList({ sessions }: { sessions: Session[] }) {
  const [revoked, setRevoked] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");

  const revoke = (session: Session) => {
    setRevoked((current) => [...current, session.id]);
    setAnnouncement(`${session.device} has been signed out.`);
  };

  const active = sessions.filter((session) => !revoked.includes(session.id));

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <Card>
        <ul className="divide-y divide-border">
          {active.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-pill bg-surface-sunk text-ink-muted"
                  aria-hidden
                >
                  <Laptop className="size-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-ink">
                    <span className="truncate">{session.device}</span>
                    {session.current && <Badge tone="accent">This device</Badge>}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    {session.location} ·{" "}
                    {relativeDayLabel(session.lastActiveAt, NOW)} at{" "}
                    {formatTime(session.lastActiveAt)}
                  </p>
                </div>
              </div>

              {!session.current && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => revoke(session)}
                >
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <p className="mt-2.5 px-1 text-xs text-ink-muted">
        We&apos;ll email you whenever a new device signs in, even if it&apos;s you.
      </p>
    </>
  );
}
