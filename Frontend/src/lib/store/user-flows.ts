"use client";

import { useSyncExternalStore } from "react";
import type { Flow } from "@/lib/types/flows";

/**
 * Flows the user has built, kept in localStorage.
 *
 * This is the stand-in for `POST /flows` until the FastAPI backend exists. It
 * is deliberately a tiny external store rather than context: the flows list,
 * the detail page, and the builder all read it independently, and none of them
 * should have to be inside a provider to do so.
 */

const KEY = "talents.flows";
const EMPTY: Flow[] = [];

let cache: Flow[] | null = null;
const listeners = new Set<() => void>();

function read(): Flow[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Flow[]) : EMPTY;
    // getSnapshot must return a stable reference or React re-renders forever.
    cache = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(flows: Flow[]) {
  cache = flows;
  try {
    localStorage.setItem(KEY, JSON.stringify(flows));
  } catch {
    // Storage can be unavailable; the flow still exists for this session.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep other tabs in step.
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveUserFlow(flow: Flow) {
  const existing = read();
  const index = existing.findIndex((candidate) => candidate.id === flow.id);
  if (index >= 0) {
    const next = [...existing];
    next[index] = flow;
    write(next);
  } else {
    write([flow, ...existing]);
  }
}

export function deleteUserFlow(id: string) {
  write(read().filter((flow) => flow.id !== id));
}

/** Reactive list of the user's own flows. Empty during SSR. */
export function useUserFlows(): Flow[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function newFlowId() {
  return `flow_user_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}
