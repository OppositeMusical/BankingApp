import { z } from "zod";

/*
 * Errors, normalized to the backend's actual envelope.
 *
 * The plan in ReadMe.md §5.2 was written against FastAPI's `{ detail }` and
 * its 422 `loc/msg/type` array. The backend that exists does not do that — it
 * returns a single tagged envelope, and openapi.yaml is explicit about how to
 * read it: "Branch on this, never on `message`." So `code` is what callers
 * switch on, and `message` is only ever shown to a person.
 */

/** The backend's closed set of error codes. */
export const errorCodes = [
  "BAD_REQUEST",
  "VALIDATION_FAILED",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "IDEMPOTENCY_KEY_REUSED",
  "INSUFFICIENT_FUNDS",
  "ACCOUNT_FROZEN",
  "LIMIT_EXCEEDED",
  "CARD_DECLINED",
  "UPSTREAM_ERROR",
  "RATE_LIMITED",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.enum(errorCodes).catch("INTERNAL"),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  requestId: z.string().optional(),
});

/**
 * A failed request that the backend described. `code` is stable; `message` is
 * not, and must never be branched on.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(init: {
    status: number;
    code: ErrorCode;
    message: string;
    requestId?: string;
    details?: unknown;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.requestId = init.requestId;
    this.details = init.details;
  }

  /** True when retrying the identical request could plausibly succeed. */
  get isTransient() {
    return (
      this.code === "UPSTREAM_ERROR" ||
      this.code === "RATE_LIMITED" ||
      this.code === "INTERNAL"
    );
  }

  /** True when the user needs to sign in again. */
  get isAuthFailure() {
    return this.code === "UNAUTHORIZED";
  }
}

/**
 * The response did not match the contract.
 *
 * This is the check that catches backend drift on the day it ships rather than
 * as a rendering bug three screens away, so it is deliberately loud.
 */
export class ApiValidationError extends Error {
  readonly path: string;
  readonly issues: z.core.$ZodIssue[];

  constructor(path: string, issues: z.core.$ZodIssue[]) {
    const summary = issues
      .slice(0, 3)
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    super(`Response from ${path} did not match the contract — ${summary}`);
    this.name = "ApiValidationError";
    this.path = path;
    this.issues = issues;
  }
}

/** The request did not finish within `apiConfig.timeoutMs`. */
export class ApiTimeoutError extends Error {
  constructor(path: string, timeoutMs: number) {
    super(`Request to ${path} timed out after ${timeoutMs}ms`);
    this.name = "ApiTimeoutError";
  }
}

/**
 * Plain-language text for a failure, safe to render.
 *
 * Keyed on `code` so the wording is ours rather than the backend's, and so a
 * change to a server-side string can never change what a user reads.
 */
export function describeError(error: unknown): string {
  if (error instanceof ApiValidationError) {
    return "We got an unexpected response from the server. Nothing was changed.";
  }
  if (error instanceof ApiTimeoutError) {
    return "That took too long to respond. Check your connection and try again.";
  }
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again.";
  }

  switch (error.code) {
    case "UNAUTHORIZED":
      return "Your session has expired. Please sign in again.";
    case "FORBIDDEN":
      return "You don't have access to do that on this account.";
    case "NOT_FOUND":
      return "We couldn't find that.";
    case "INSUFFICIENT_FUNDS":
      return "There isn't enough available to cover this.";
    case "ACCOUNT_FROZEN":
      return "This account is frozen, so money can't move in or out of it.";
    case "LIMIT_EXCEEDED":
      return "This would go over a limit set on the account.";
    case "CARD_DECLINED":
      return "The card was declined.";
    case "VALIDATION_FAILED":
    case "BAD_REQUEST":
      return "Some of those details weren't right. Check them and try again.";
    case "CONFLICT":
    case "IDEMPOTENCY_KEY_REUSED":
      return "That request was already handled. Nothing was done twice.";
    case "RATE_LIMITED":
      return "Too many attempts just now. Wait a moment and try again.";
    case "UPSTREAM_ERROR":
      return "A service we rely on isn't responding. Please try again shortly.";
    default:
      return "Something went wrong on our side. Please try again.";
  }
}
